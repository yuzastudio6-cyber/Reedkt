import { createHash } from 'node:crypto'

import type {
  CreateMotionStudioPreviewBindingRequest,
  MotionStudioPreviewExecutionReceiptDto,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import {
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  buildOfflineRemotionMotionStudioLayeredRequest,
  isMotionStudioLayeredPayload,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionRenderResult,
} from '../../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../../types'
import { persistCanonicalPrivateRemotionArtifact, readCanonicalPrivateRemotionArtifact } from '../../services/canonical-private-remotion-artifact-storage'
import { readCanonicalPrivateLayeredCutout } from '../../services/canonical-private-layered-asset-storage'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createSupabaseMotionStudioJobRepository } from '../jobs/repository'
import { hashMotionStudioLeaseCredential, MotionStudioJobService } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { createSupabaseMotionStudioLayeredRepository } from '../layered/repository'
import type {
  MotionStudioLayeredAssemblyRow,
  MotionStudioLayeredCutoutArtifactRow,
  MotionStudioLayeredRepository,
} from '../layered/types'
import { createSupabaseMotionStudioRenderRepository } from './repository'
import {
  previewArtifactDto,
  previewBindingDto,
  previewWorkspaceDto,
  type MotionStudioRenderArtifactRow,
  type MotionStudioRenderExecutionAuthority,
  type MotionStudioRenderRepository,
} from './types'

const LOCAL_WARNING = 'This is a private local canonical scene preview. It does not apply the timeline proposal, call a provider, create a final export, expose public media, or activate customer pricing or credits.'
const PANEL_BACKGROUND = '#111216'
const ACCENT_COLOR = '#7857FF'

export class MotionStudioRenderService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioRenderRepository
  private readonly jobs: MotionStudioJobService
  private readonly layeredRepository: MotionStudioLayeredRepository

  constructor(context: ServiceContext, repository?: MotionStudioRenderRepository) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    const client = ensureAdminClient(context)
    this.repository = repository ?? createSupabaseMotionStudioRenderRepository(client)
    this.jobs = new MotionStudioJobService(context, createSupabaseMotionStudioJobRepository(client))
    this.layeredRepository = createSupabaseMotionStudioLayeredRepository(client)
  }

  async getPreviewWorkspace(productionId: string) {
    await this.requireOwnedProduction(productionId)
    const state = await this.repository.readWorkspaceState(productionId)
    return {
      data: { previewWorkspace: previewWorkspaceDto({ productionId, ...state }) },
      warnings: [LOCAL_WARNING],
    }
  }

  async createBinding(
    productionId: string,
    request: CreateMotionStudioPreviewBindingRequest,
    idempotencyKey: string,
  ) {
    await this.requireOwnedProduction(productionId)
    const requestHash = requestDigest('POST', `/v1/motion-studio/productions/${productionId}/render-bindings`, request)
    const binding = await this.repository.createBinding({
      productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      sceneDocumentArtifactId: request.sceneDocumentArtifactId,
      sceneDocumentVersionId: request.sceneDocumentVersionId,
      sceneDocumentContentDigest: request.sceneDocumentContentDigest,
      timelineProposalId: request.timelineProposalId,
      jobId: request.jobId,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const state = await this.repository.readWorkspaceState(productionId)
    const job = state.jobs.get(binding.job_id)
    if (!job) throw internalInvalid('The new preview binding lost its exact durable job authority.')
    return {
      data: {
        binding: previewBindingDto(binding, job, state.attempts.get(job.id), state.artifacts.get(binding.id)),
        previewWorkspace: previewWorkspaceDto({ productionId, ...state }),
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async executePreview(
    leaseId: string,
    leaseCredential: string,
    bindingId: string,
    idempotencyKey: string,
  ) {
    const credentialHash = hashMotionStudioLeaseCredential(leaseCredential)
    let authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
    await this.requireOwnedProduction(authority.binding.production_id)
    let layeredInput = await this.requireLayeredInput(authority)

    if (authority.artifact) {
      return {
        data: { receipt: await this.replayReceipt(authority) },
        warnings: [LOCAL_WARNING],
      }
    }

    if (authority.lease.status !== 'active' || authority.attempt.status === 'unknown') {
      throw new ApiError('WORKER_LEASE_INVALID', 'The exact active preview lease is required.', 409)
    }
    if (!['claimed', 'running'].includes(authority.attempt.status) || !['claimed', 'running'].includes(authority.job.status)) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The preview job is not in a renderable claimed state.', 409)
    }

    // Fail before opening the renderer when the persisted rate card, exact
    // frame quantity, estimate, or job ceiling no longer agree. Recompute the
    // evidence-bearing line after rendering so its digest can include the
    // actual artifact and attestation.
    usageLine(authority)

    let started = authority.attempt.status === 'running'
    let renderCompleted = false
    let usage: readonly MotionStudioAttemptUsageLine[] = []
    try {
      if (!started) {
        await this.jobs.startAttempt(leaseId, leaseCredential, derivedIdempotencyKey(idempotencyKey, 'start'))
        started = true
        authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
        layeredInput = await this.requireLayeredInput(authority)
      }

      const remotionAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
      if (!remotionAuthority || !remotionAuthority.readiness.privateInternalExecutionReady || remotionAuthority.readiness.productReady) {
        throw runtimeUnavailable('Pinned private Remotion runtime authority is unavailable.')
      }
      const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (!mediaAuthority || !mediaAuthority.readiness.privateInternalExecutionReady || mediaAuthority.readiness.finalExportReady) {
        throw runtimeUnavailable('Pinned independent FFprobe authority is unavailable.')
      }
      const request = layeredInput
        ? buildOfflineRemotionMotionStudioLayeredRequest({
            planningPayload: layeredPlanningPayload(layeredInput.assembly),
            subject: {
              mimeType: 'image/png',
              bytes: layeredInput.subjectBytes,
              sha256: layeredInput.cutout.artifact_sha256,
            },
          })
        : validateOfflineRemotionRenderRequest({
            schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
            toolId: 'remotion',
            operationId: OFFLINE_REMOTION_RENDER_OPERATION,
            payload: {
              compositionProfileId: 'motion_studio_scene_preview_v1',
              width: authority.binding.width,
              height: authority.binding.height,
              fps: authority.binding.fps_numerator,
              durationFrames: authority.binding.duration_frames,
              sceneId: authority.binding.scene_id,
              sceneStartFrame: authority.binding.scene_start_frame,
              sceneEndFrame: authority.binding.scene_end_frame,
              semanticPurpose: authority.binding.semantic_purpose,
              productionMode: authority.binding.production_mode,
              layerType: authority.binding.layer_type,
              panelBackground: PANEL_BACKGROUND,
              accentColor: ACCENT_COLOR,
            },
          })
      const runtime = await openPrivateOfflineRemotionRenderRuntime()
      if (runtime.image.imageIdentityHash !== remotionAuthority.image.imageIdentityHash) {
        throw runtimeUnavailable('Opened Remotion runtime identity changed after authorization.')
      }
      const result = await runtime.execute(request)
      assertRenderResult(result, authority)
      renderCompleted = true
      usage = [usageLine(authority, result)]

      const media = await openPrivateOfflineMediaBinaryRuntime()
      const probe = await media.execute(validateOfflineFfprobeExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffprobe',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        payload: {
          inspectionProfileId: 'pre_render_v1',
          countFrames: true,
          verifyDurationAndSync: true,
          emitMachineJsonOnly: true,
          mimeType: 'video/mp4',
          sourceByteLength: result.artifact.byteLength,
          sourceSha256: result.artifact.sha256,
          sourceBytesBase64: result.artifact.bytes.toString('base64'),
        },
      }))
      if (!('resultJson' in probe)) throw runtimeUnavailable('Independent FFprobe returned an invalid result class.')
      const mediaQaEvidenceDigest = validateProbe(probe.resultJson.document, authority)
      const qaEvidenceDigest = layeredInput
        ? layeredQaEvidenceDigest(authority, layeredInput, result, mediaQaEvidenceDigest)
        : mediaQaEvidenceDigest
      const privateObjectIdentityHash = sha256CanonicalJson({
        domain: 'motion_studio_private_scene_preview_v1',
        bindingId: authority.binding.id,
        attemptId: authority.attempt.id,
        artifactSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateRemotionArtifact({
        localStorageRoot: this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        bytes: result.artifact.bytes,
        expectedSha256: result.artifact.sha256,
      })
      await assertPersistedBytes(this.context.env.localStorageRoot, privateObjectIdentityHash, result)

      const frameEvidence = result.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 }))
      const outcomeDigest = sha256CanonicalJson({
        bindingId: authority.binding.id,
        attemptId: authority.attempt.id,
        artifactSha256: result.artifact.sha256,
        privateObjectIdentityHash,
        frameEvidence,
        ...(layeredInput ? {
          layerManifestDigest: layeredInput.assembly.layer_manifest_digest,
          subjectCutoutSha256: layeredInput.cutout.artifact_sha256,
        } : {}),
        runtimeIdentityDigest: remotionAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash,
        qaEvidenceDigest,
        usage,
      })
      const completionInput = {
        bindingId: authority.binding.id,
        leaseId,
        privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256,
        byteLength: result.artifact.byteLength,
        frameEvidence,
        runtimeIdentityDigest: remotionAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash,
        qaEvidenceDigest,
        usage,
        outcomeDigest,
      }
      const artifact = await this.repository.completeAttempt({
        ...completionInput,
        credentialHash,
        actorUserId: this.actorUserId,
        idempotencyKey: derivedIdempotencyKey(idempotencyKey, 'complete'),
        requestHash: requestDigest(
          'POST',
          `/v1/internal/motion-studio/job-leases/${leaseId}/${layeredInput ? 'remotion-layered-preview' : 'remotion-preview'}`,
          completionInput,
        ),
      })
      const completedAuthority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      if (!completedAuthority.artifact || completedAuthority.artifact.id !== artifact.id) {
        throw internalInvalid('Completed preview receipt could not be read back from canonical authority.')
      }
      return {
        data: { receipt: receipt(completedAuthority, artifact, usage[0]) },
        warnings: [LOCAL_WARNING],
      }
    } catch (error) {
      if (started && authority.lease.status === 'active' && ['claimed', 'running'].includes(authority.job.status)) {
        await this.jobs.finishAttempt(
          leaseId,
          leaseCredential,
          {
            outcome: 'failed',
            failureCategory: 'worker_transient',
            usage,
            outcomeDigest: sha256CanonicalJson({
              bindingId,
              attemptId: authority.attempt.id,
              renderCompleted,
              failureClass: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
            }),
          },
          derivedIdempotencyKey(idempotencyKey, 'failure'),
        ).catch(() => undefined)
      }
      throw error
    }
  }

  async readPrivateArtifact(artifactId: string) {
    const artifact = await this.repository.findArtifact(artifactId)
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private preview artifact was not found.', 404)
    await this.requireOwnedProduction(artifact.production_id)
    const stored = await readCanonicalPrivateRemotionArtifact({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: artifact.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== artifact.artifact_sha256 || stored.byteLength !== artifact.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private preview bytes no longer match immutable artifact authority.', 409)
    }
    return { artifact: previewArtifactDto(artifact), bytes: stored.bytes }
  }

  private async replayReceipt(authority: MotionStudioRenderExecutionAuthority): Promise<MotionStudioPreviewExecutionReceiptDto> {
    const artifact = authority.artifact
    if (!artifact || authority.lease.attempt_id !== artifact.attempt_id || authority.job.status !== 'succeeded') {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Preview replay lacks exact successful attempt authority.', 409)
    }
    await this.requireLayeredInput(authority)
    const stored = await readCanonicalPrivateRemotionArtifact({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: artifact.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== artifact.artifact_sha256 || stored.byteLength !== artifact.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Preview replay bytes failed checksum verification.', 409)
    }
    return receipt(authority, artifact, usageLine(authority))
  }

  private async requireExecutionAuthority(bindingId: string, leaseId: string, credentialHash: string) {
    const authority = await this.repository.findExecutionAuthority(bindingId, leaseId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private preview binding was not found.', 404)
    const standardProfile =
      authority.binding.registered_profile_id === 'motion_studio_scene_preview_v1' &&
      authority.binding.layered_assembly_id === null &&
      authority.job.work_item_type === 'render_remotion_preview' &&
      authority.job.required_worker_class === 'motion_studio_remotion_preview_worker'
    const layeredProfile =
      authority.binding.registered_profile_id === 'motion_studio_native_layered_scene_v1' &&
      authority.binding.layered_assembly_id !== null &&
      authority.job.work_item_type === 'render_motion_studio_layered_preview' &&
      authority.job.required_worker_class === 'motion_studio_layered_preview_worker'
    if (
      authority.binding.job_id !== authority.job.id || authority.lease.job_id !== authority.job.id ||
      authority.lease.attempt_id !== authority.attempt.id || authority.lease.credential_hash_sha256 !== credentialHash ||
      authority.job.approved_snapshot_id !== authority.binding.approved_snapshot_id ||
      authority.job.approved_work_item_id !== authority.binding.approved_work_item_id ||
      authority.job.cost_budget_id !== authority.binding.cost_budget_id ||
      (!standardProfile && !layeredProfile) ||
      authority.cost.quantity !== authority.binding.duration_frames
    ) throw new ApiError('WORKER_LEASE_INVALID', 'Preview lease, work, cost, and binding authority do not match.', 403)
    return authority
  }

  private async requireLayeredInput(authority: MotionStudioRenderExecutionAuthority): Promise<{
    assembly: MotionStudioLayeredAssemblyRow
    cutout: MotionStudioLayeredCutoutArtifactRow
    subjectBytes: Buffer
  } | undefined> {
    if (authority.binding.registered_profile_id === 'motion_studio_scene_preview_v1') return undefined
    const assemblyId = authority.binding.layered_assembly_id
    if (!assemblyId) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Layered preview lost its exact assembly authority.', 409)
    const [assembly, cutout] = await Promise.all([
      this.layeredRepository.findAssembly(assemblyId),
      this.layeredRepository.findCutoutForAssembly(assemblyId),
    ])
    if (!assembly || !cutout) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Layered preview is waiting for the exact passed subject cutout.', 409)
    }
    const binding = authority.binding
    if (
      assembly.id !== assemblyId || assembly.render_job_id !== binding.job_id ||
      assembly.production_id !== binding.production_id || assembly.approved_snapshot_id !== binding.approved_snapshot_id ||
      assembly.scene_document_artifact_id !== binding.scene_document_artifact_id ||
      assembly.scene_document_version_id !== binding.scene_document_version_id ||
      assembly.scene_document_content_digest !== binding.scene_document_content_digest ||
      assembly.timeline_proposal_id !== binding.timeline_proposal_id ||
      assembly.timeline_proposal_output_digest !== binding.timeline_proposal_output_digest ||
      assembly.registered_profile_id !== binding.registered_profile_id ||
      assembly.scene_id !== binding.scene_id || assembly.semantic_purpose !== binding.semantic_purpose ||
      assembly.width !== binding.width || assembly.height !== binding.height ||
      assembly.fps_numerator !== binding.fps_numerator || assembly.fps_denominator !== binding.fps_denominator ||
      assembly.duration_frames !== binding.duration_frames ||
      assembly.scene_start_frame !== binding.scene_start_frame || assembly.scene_end_frame !== binding.scene_end_frame ||
      cutout.assembly_id !== assembly.id || cutout.production_id !== assembly.production_id ||
      cutout.job_id !== assembly.cutout_job_id || !cutout.subject_coverage_verified
    ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Layered assembly, cutout, and render binding authority diverged.', 409)
    const stored = await readCanonicalPrivateLayeredCutout({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: cutout.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== cutout.artifact_sha256 || stored.byteLength !== cutout.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Layered subject bytes failed immutable checksum readback.', 409)
    }
    return { assembly, cutout, subjectBytes: stored.bytes }
  }

  private async requireOwnedProduction(productionId: string) {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'This private preview belongs to another Motion Studio production.', 403)
    }
    if (production.status === 'archived') throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived Motion Studio productions cannot render previews.', 409)
    return production
  }
}

export function createMotionStudioRenderService(context: ServiceContext): MotionStudioRenderService {
  return new MotionStudioRenderService(context)
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Motion Studio private previews require a verified bearer identity.', 401)
  }
  return userId
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function derivedIdempotencyKey(root: string, phase: string): string {
  return `ms007-${phase}-${createHash('sha256').update(root).digest('hex').slice(0, 48)}`
}

function usageLine(
  authority: MotionStudioRenderExecutionAuthority,
  result?: OfflineRemotionRenderResult,
): MotionStudioAttemptUsageLine {
  const quantity = authority.binding.duration_frames
  const calculated = Math.max(authority.cost.minimumChargeMicros, authority.cost.unitPriceMicros * quantity)
  if (
    !Number.isSafeInteger(calculated) || calculated !== authority.cost.expectedInternalCostMicros ||
    calculated > authority.cost.maximumAuthorizedInternalCostMicros ||
    calculated > authority.job.maximum_authorized_internal_cost_micros
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Approved render-frame rate authority no longer matches exact preview usage.', 409)
  return {
    costEstimateItemId: authority.cost.estimateItemId,
    meterId: 'render_frame',
    quantity,
    internalCostMicros: calculated,
    evidenceClass: 'infrastructure_metered',
    evidenceDigest: sha256CanonicalJson({
      bindingId: authority.binding.id,
      attemptId: authority.attempt.id,
      rateCardVersionId: authority.cost.rateCardVersionId,
      unit: authority.cost.unit,
      quantity,
      internalCostMicros: calculated,
      ...(result ? { artifactSha256: result.artifact.sha256, attestationDigest: result.attestation.attestationHash } : {}),
    }),
  }
}

function receipt(
  authority: MotionStudioRenderExecutionAuthority,
  artifact: MotionStudioRenderArtifactRow,
  usage: MotionStudioAttemptUsageLine,
): MotionStudioPreviewExecutionReceiptDto {
  return {
    binding: previewBindingDto(authority.binding, authority.job, authority.attempt, artifact),
    artifact: previewArtifactDto(artifact),
    usage: {
      costEstimateItemId: usage.costEstimateItemId,
      meterId: 'render_frame',
      quantity: usage.quantity,
      internalCostMicros: usage.internalCostMicros,
    },
    localCandidateOnly: true,
  }
}

function assertRenderResult(result: OfflineRemotionRenderResult, authority: MotionStudioRenderExecutionAuthority): void {
  const binding = authority.binding
  const expectedFrames = [0, Math.floor((binding.duration_frames - 1) / 2), binding.duration_frames - 1]
  const renderedProfile = 'compositionProfileId' in result.request.payload
    ? result.request.payload.compositionProfileId
    : undefined
  if (
    result.request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    renderedProfile !== binding.registered_profile_id ||
    result.artifact.width !== binding.width || result.artifact.height !== binding.height ||
    result.artifact.fps !== binding.fps_numerator || result.artifact.durationFrames !== binding.duration_frames ||
    result.frameArtifacts.length !== 3 || result.frameArtifacts.some((frame, index) => frame.frame !== expectedFrames[index]) ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.readiness.productReady || result.readiness.canonicalDispatchIntegrated
  ) throw runtimeUnavailable('Remotion output diverged from the exact immutable preview binding.')
}

function layeredPlanningPayload(assembly: MotionStudioLayeredAssemblyRow) {
  const manifest = assembly.layer_manifest_json
  return {
    compositionProfileId: 'motion_studio_native_layered_scene_v1' as const,
    width: assembly.width,
    height: assembly.height,
    fps: assembly.fps_numerator,
    durationFrames: assembly.duration_frames,
    sceneId: assembly.scene_id,
    sceneStartFrame: assembly.scene_start_frame,
    sceneEndFrame: assembly.scene_end_frame,
    semanticPurpose: assembly.semantic_purpose,
    headline: manifest.headline,
    caption: manifest.caption,
    layerManifestDigest: assembly.layer_manifest_digest,
    depthModel: manifest.depthModel,
    planes: manifest.planes.map(({ planeId, role, zIndex, sourceKind, motionToken }) => ({
      planeId, role, zIndex, sourceKind, motionToken,
    })),
    panelBackground: manifest.design.panelBackground,
    panelHighlight: manifest.design.panelHighlight,
    headlineColor: manifest.design.headlineColor,
    accentColor: manifest.design.accentColor,
    captionColor: manifest.design.captionColor,
    horizontalSafePercent: manifest.safeZones.horizontalPercent,
    verticalSafePercent: manifest.safeZones.verticalPercent,
    captionBottomPercent: manifest.safeZones.captionBottomPercent,
    captionAboveMask: manifest.maskPolicy.captionAboveMask,
    contactObjectPresent: manifest.maskPolicy.contactObjectPresent,
    maskRisk: manifest.maskPolicy.maskRisk,
  }
}

function layeredQaEvidenceDigest(
  authority: MotionStudioRenderExecutionAuthority,
  layeredInput: {
    assembly: MotionStudioLayeredAssemblyRow
    cutout: MotionStudioLayeredCutoutArtifactRow
  },
  result: OfflineRemotionRenderResult,
  mediaQaEvidenceDigest: string,
): string {
  if (!isMotionStudioLayeredPayload(result.request.payload)) {
    throw runtimeUnavailable('Layered render did not execute the registered layered payload.')
  }
  const evidence = result.evidence.semanticEvidence
  const requiredEvidence = [
    'motionStudioNativeLayeredCompositionExecuted',
    'approvedSubjectCutoutBytesVerified',
    'semanticFourPlaneDepthOrderPreserved',
    'nativeBackgroundAndHeadlineRendered',
    'subjectParallaxRendered',
    'captionAboveMaskRendered',
    'contactObjectPolicyPreserved',
    'remotionRenderStillExecuted',
    'frameGoldenArtifactsProduced',
  ] as const
  if (
    result.request.payload.subjectSha256 !== layeredInput.cutout.artifact_sha256 ||
    result.request.payload.layerManifestDigest !== layeredInput.assembly.layer_manifest_digest ||
    result.request.payload.captionAboveMask !== true || result.request.payload.contactObjectPresent !== false ||
    result.request.payload.maskRisk !== 'low_fixture_only' ||
    requiredEvidence.some((key) => evidence[key] !== true)
  ) throw runtimeUnavailable('Layered mask, semantic order, or caption-protection QA failed.')
  return sha256CanonicalJson({
    profileId: authority.binding.registered_profile_id,
    layerManifestDigest: layeredInput.assembly.layer_manifest_digest,
    subjectCutoutSha256: layeredInput.cutout.artifact_sha256,
    cutoutQaEvidenceDigest: layeredInput.cutout.qa_evidence_digest,
    planeOrder: result.request.payload.planes.map(({ planeId, role, zIndex }) => ({ planeId, role, zIndex })),
    captionAboveMask: true,
    contactObjectPresent: false,
    maskRisk: 'low_fixture_only',
    frameEvidence: result.frameArtifacts.map(({ frame, sha256 }) => ({ frame, sha256 })),
    mediaQaEvidenceDigest,
  })
}

function validateProbe(document: Readonly<Record<string, unknown>>, authority: MotionStudioRenderExecutionAuthority): string {
  const streams = Array.isArray(document.streams) ? document.streams as Array<Record<string, unknown>> : []
  const video = streams.find((stream) => stream.codecType === 'video')
  const report = {
    codecName: video?.codecName,
    pixelFormat: video?.pixelFormat,
    colorSpace: video?.colorSpace,
    width: video?.width,
    height: video?.height,
    fps: video?.fps,
    frameCount: video?.readFrameCount,
    durationSeconds: document.durationSeconds,
  }
  const binding = authority.binding
  if (
    report.codecName !== 'h264' || report.pixelFormat !== 'yuv420p' || report.colorSpace !== 'bt709' ||
    report.width !== binding.width || report.height !== binding.height ||
    report.fps !== binding.fps_numerator || report.frameCount !== binding.duration_frames ||
    report.durationSeconds !== Number((binding.duration_frames / binding.fps_numerator).toFixed(6))
  ) throw runtimeUnavailable('Independent FFprobe QA diverged from exact preview media authority.')
  return sha256CanonicalJson(report)
}

async function assertPersistedBytes(
  localStorageRoot: string,
  privateObjectIdentityHash: string,
  result: OfflineRemotionRenderResult,
): Promise<void> {
  const stored = await readCanonicalPrivateRemotionArtifact({ localStorageRoot, privateObjectIdentityHash })
  if (!stored || stored.sha256 !== result.artifact.sha256 || stored.byteLength !== result.artifact.byteLength || !stored.bytes.equals(result.artifact.bytes)) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Persisted preview bytes changed before canonical receipt registration.', 409)
  }
}

function runtimeUnavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, { requiredGate: 'motion_studio_private_remotion_preview' })
}

function internalInvalid(message: string): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
