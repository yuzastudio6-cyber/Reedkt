import { createHash } from 'node:crypto'

import {
  motionStudioUploadedNarrationAuthoritySchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  AssembleMotionStudioAnimaticRequest,
  CreateMotionStudioAnimaticBindingRequest,
  MotionStudioAnimaticExecutionReceiptDto,
  UploadedNarrationAuthority,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { persistCanonicalPrivateRemotionArtifact, readCanonicalPrivateRemotionArtifact } from '../../services/canonical-private-remotion-artifact-storage'
import {
  loadPrivateFinalizedMediaAuthority,
  privateUploadMediaAuthorityValueHash,
} from '../../services/private-upload-media-authority-store'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import { createUploadService } from '../../services/upload-service'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import {
  buildOfflineRemotionMotionStudioAnimaticRequest,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  type OfflineRemotionRenderResult,
} from '../../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioProductionRow } from '../commands/types'
import { createSupabaseMotionStudioJobRepository } from '../jobs/repository'
import { hashMotionStudioLeaseCredential, MotionStudioJobService } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { createSupabaseMotionStudioSceneRepository } from '../scenes/repository'
import type { MotionStudioSceneRepository } from '../scenes/types'
import { compileMotionStudioAnimaticCandidates } from './compiler'
import { createSupabaseMotionStudioAnimaticRepository } from './repository'
import {
  animaticArtifactDto,
  animaticBindingDto,
  animaticWorkspaceDto,
  type MotionStudioAnimaticArtifactRow,
  type MotionStudioAnimaticBindingRow,
  type MotionStudioAnimaticExecutionAuthority,
  type MotionStudioAnimaticRepository,
} from './types'

const LOCAL_WARNING = 'Prepared-script animatic assembly is a private local-canonical candidate. External providers, remote Supabase, final render, public delivery, billing and customer pricing remain disabled.'
const ALLOWED_AUDIO_MIME_TYPES = new Set(['audio/wav', 'audio/mpeg', 'audio/mp3'])
const PANEL_BACKGROUND = '#111216'
const ACCENT_COLOR = '#7857FF'

export class MotionStudioAnimaticService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioAnimaticRepository
  private readonly sceneRepository: MotionStudioSceneRepository
  private readonly jobs: MotionStudioJobService

  constructor(
    context: ServiceContext,
    repository?: MotionStudioAnimaticRepository,
    sceneRepository?: MotionStudioSceneRepository,
  ) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    const admin = ensureAdminClient(context)
    this.repository = repository ?? createSupabaseMotionStudioAnimaticRepository(admin)
    this.sceneRepository = sceneRepository ?? createSupabaseMotionStudioSceneRepository(admin)
    this.jobs = new MotionStudioJobService(context, createSupabaseMotionStudioJobRepository(admin))
  }

  async assemble(
    productionId: string,
    request: AssembleMotionStudioAnimaticRequest,
    idempotencyKey: string,
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const snapshot = await this.sceneRepository.findSnapshot(production, request.approvedSnapshotId)
    if (!snapshot) blocked('The exact approved snapshot is unavailable for this production.')
    const preparedScriptVersion = await this.sceneRepository.findArtifactVersion(production.id, request.preparedScriptVersionId)
    if (
      !preparedScriptVersion || preparedScriptVersion.artifact_id !== request.preparedScriptArtifactId ||
      preparedScriptVersion.content_digest !== request.preparedScriptContentDigest
    ) blocked('The exact prepared-script version or digest is unavailable.')

    const proposals = await this.sceneRepository.listTimelineProposals(production.id)
    const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]))
    const scenes = await Promise.all(request.scenes.map(async (selection) => {
      const documentVersion = await this.sceneRepository.findArtifactVersion(production.id, selection.sceneDocumentVersionId)
      if (
        !documentVersion || documentVersion.artifact_id !== selection.sceneDocumentArtifactId ||
        documentVersion.content_digest !== selection.sceneDocumentContentDigest
      ) blocked('An exact selected SceneDocument version or digest is unavailable.')
      const proposal = proposalsById.get(selection.timelineProposalId)
      if (!proposal) blocked('An exact selected timeline proposal is unavailable.')
      return { documentVersion, proposal }
    }))
    const narrationInput = await this.loadVerifiedUploadedNarration(production, {
      narrationMediaAssetId: request.narrationMediaAssetId,
      narrationChecksumSha256: request.narrationChecksumSha256,
    })
    const narration = narrationInput.authority
    const compiled = compileMotionStudioAnimaticCandidates({
      production,
      snapshot,
      preparedScriptVersion,
      scenes,
      narration,
    })
    const createdAt = new Date().toISOString()
    const requestHash = sha256CanonicalJson({
      method: 'POST',
      path: `/v1/motion-studio/productions/${productionId}/animatic-assemblies`,
      body: request,
    })
    const receipt = await this.repository.createAssembly({
      production,
      approvedSnapshotId: request.approvedSnapshotId,
      preparedScriptArtifactId: request.preparedScriptArtifactId,
      preparedScriptVersionId: request.preparedScriptVersionId,
      preparedScriptContentDigest: request.preparedScriptContentDigest,
      narration,
      narrationAuthorityDigest: compiled.narrationAuthorityDigest,
      orderedSceneVersionIds: compiled.orderedSceneVersionIds,
      orderedProposalIds: compiled.orderedProposalIds,
      voicePayload: compiled.voicePayload,
      storyboardPayload: compiled.storyboardPayload,
      animaticPayload: compiled.animaticPayload,
      inputDigest: compiled.inputDigest,
      actorUserId: this.actorUserId,
      createdAt,
      idempotencyKey,
      requestHash,
    })
    return { data: { assembly: receipt }, warnings: [LOCAL_WARNING] }
  }

  async listAssemblies(productionId: string) {
    await this.requireOwnedProduction(productionId)
    return { data: { assemblies: await this.repository.listAssemblies(productionId) }, warnings: [LOCAL_WARNING] }
  }

  async getWorkspace(productionId: string) {
    await this.requireOwnedProduction(productionId)
    const [assemblies, state] = await Promise.all([
      this.repository.listAssemblies(productionId),
      this.repository.readWorkspaceState(productionId),
    ])
    return {
      data: { animaticWorkspace: animaticWorkspaceDto({ productionId, assemblies, ...state }) },
      warnings: [LOCAL_WARNING],
    }
  }

  async createBinding(
    productionId: string,
    request: CreateMotionStudioAnimaticBindingRequest,
    idempotencyKey: string,
  ) {
    await this.requireOwnedProduction(productionId)
    const requestHash = requestDigest(
      'POST',
      `/v1/motion-studio/productions/${productionId}/animatic-bindings`,
      request,
    )
    const binding = await this.repository.createBinding({
      productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      animaticArtifactId: request.animaticArtifactId,
      animaticVersionId: request.animaticVersionId,
      animaticContentDigest: request.animaticContentDigest,
      jobId: request.jobId,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const [assemblies, state] = await Promise.all([
      this.repository.listAssemblies(productionId),
      this.repository.readWorkspaceState(productionId),
    ])
    const job = state.jobs.get(binding.job_id)
    if (!job) internalInvalid('The new animatic binding lost its durable job authority.')
    return {
      data: {
        binding: animaticBindingDto(binding, job, state.attempts.get(job.id), state.artifacts.get(binding.id)),
        animaticWorkspace: animaticWorkspaceDto({ productionId, assemblies, ...state }),
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async executeAnimatic(
    leaseId: string,
    leaseCredential: string,
    bindingId: string,
    idempotencyKey: string,
  ) {
    const credentialHash = hashMotionStudioLeaseCredential(leaseCredential)
    let authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
    const production = await this.requireOwnedProduction(authority.binding.production_id)
    if (authority.artifact) {
      return { data: { receipt: await this.replayReceipt(authority) }, warnings: [LOCAL_WARNING] }
    }
    if (authority.lease.status !== 'active' || authority.attempt.status === 'unknown') {
      throw new ApiError('WORKER_LEASE_INVALID', 'The exact active animatic lease is required.', 409)
    }
    if (!['claimed', 'running'].includes(authority.attempt.status) || !['claimed', 'running'].includes(authority.job.status)) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The animatic job is not in a renderable claimed state.', 409)
    }
    usageLine(authority)

    let started = authority.attempt.status === 'running'
    let renderCompleted = false
    let usage: readonly MotionStudioAttemptUsageLine[] = []
    try {
      if (!started) {
        await this.jobs.startAttempt(leaseId, leaseCredential, derivedIdempotencyKey(idempotencyKey, 'start'))
        started = true
        authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      }
      const narrationInput = await this.loadVerifiedUploadedNarration(production, {
        narrationMediaAssetId: authority.binding.narration_media_asset_id,
        narrationChecksumSha256: authority.binding.narration_checksum_sha256,
      })
      assertNarrationBinding(narrationInput.authority, authority)

      const remotionAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
      if (!remotionAuthority || !remotionAuthority.readiness.privateInternalExecutionReady || remotionAuthority.readiness.productReady) {
        throw runtimeUnavailable('Pinned private Remotion runtime authority is unavailable.')
      }
      const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (!mediaAuthority || !mediaAuthority.readiness.privateInternalExecutionReady || mediaAuthority.readiness.finalExportReady) {
        throw runtimeUnavailable('Pinned independent FFprobe authority is unavailable.')
      }
      const request = buildOfflineRemotionMotionStudioAnimaticRequest({
        planningPayload: {
          compositionProfileId: authority.binding.registered_profile_id,
          width: authority.binding.width,
          height: authority.binding.height,
          fps: authority.binding.fps_numerator,
          durationFrames: authority.binding.rendered_frame_count,
          scenes: runtimeScenes(authority.binding.scene_bindings_json),
          panelBackground: PANEL_BACKGROUND,
          accentColor: ACCENT_COLOR,
        },
        narration: {
          mimeType: narrationInput.authority.mimeType,
          bytes: narrationInput.bytes,
          sha256: narrationInput.authority.checksumSha256,
        },
      })
      const runtime = await openPrivateOfflineRemotionRenderRuntime()
      if (runtime.image.imageIdentityHash !== remotionAuthority.image.imageIdentityHash) {
        throw runtimeUnavailable('Opened Remotion runtime identity changed after animatic authorization.')
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
      if (!('resultJson' in probe)) throw runtimeUnavailable('Independent FFprobe returned an invalid animatic result class.')
      const qa = validateMotionStudioAnimaticProbe(probe.resultJson.document, authority.binding)
      const privateObjectIdentityHash = sha256CanonicalJson({
        domain: 'motion_studio_private_animatic_v1',
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
        runtimeIdentityDigest: remotionAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash,
        qaEvidenceDigest: qa.digest,
        usage,
      })
      const completionInput = {
        bindingId: authority.binding.id,
        leaseId,
        privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256,
        byteLength: result.artifact.byteLength,
        audioSampleRateHertz: qa.audioSampleRateHertz,
        audioChannelCount: qa.audioChannelCount,
        frameEvidence,
        runtimeIdentityDigest: remotionAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash,
        qaEvidenceDigest: qa.digest,
        usage,
        outcomeDigest,
      }
      const artifact = await this.repository.completeAttempt({
        ...completionInput,
        credentialHash,
        actorUserId: this.actorUserId,
        idempotencyKey: derivedIdempotencyKey(idempotencyKey, 'complete'),
        requestHash: requestDigest('POST', `/v1/internal/motion-studio/job-leases/${leaseId}/remotion-animatic`, completionInput),
      })
      const completedAuthority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      if (!completedAuthority.artifact || completedAuthority.artifact.id !== artifact.id) {
        internalInvalid('Completed animatic receipt could not be read back from canonical authority.')
      }
      return {
        data: { receipt: executionReceipt(completedAuthority, artifact, usage[0]!) },
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
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private animatic artifact was not found.', 404)
    await this.requireOwnedProduction(artifact.production_id)
    const stored = await readCanonicalPrivateRemotionArtifact({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: artifact.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== artifact.artifact_sha256 || stored.byteLength !== artifact.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private animatic bytes no longer match immutable artifact authority.', 409)
    }
    return { artifact: animaticArtifactDto(artifact), bytes: stored.bytes }
  }

  private async replayReceipt(authority: MotionStudioAnimaticExecutionAuthority): Promise<MotionStudioAnimaticExecutionReceiptDto> {
    const artifact = authority.artifact
    if (!artifact || authority.lease.attempt_id !== artifact.attempt_id || authority.job.status !== 'succeeded') {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Animatic replay lacks exact successful attempt authority.', 409)
    }
    const stored = await readCanonicalPrivateRemotionArtifact({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: artifact.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== artifact.artifact_sha256 || stored.byteLength !== artifact.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Animatic replay bytes failed checksum verification.', 409)
    }
    return executionReceipt(authority, artifact, usageLine(authority))
  }

  private async requireExecutionAuthority(bindingId: string, leaseId: string, credentialHash: string) {
    const authority = await this.repository.findExecutionAuthority(bindingId, leaseId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private animatic binding was not found.', 404)
    if (
      authority.binding.job_id !== authority.job.id || authority.lease.job_id !== authority.job.id ||
      authority.lease.attempt_id !== authority.attempt.id || authority.lease.credential_hash_sha256 !== credentialHash ||
      authority.job.approved_snapshot_id !== authority.binding.approved_snapshot_id ||
      authority.job.approved_work_item_id !== authority.binding.approved_work_item_id ||
      authority.job.cost_budget_id !== authority.binding.cost_budget_id ||
      authority.job.work_item_type !== 'render_motion_studio_animatic' ||
      authority.job.required_worker_class !== 'motion_studio_animatic_preview_worker' ||
      authority.cost.quantity !== authority.binding.rendered_frame_count
    ) throw new ApiError('WORKER_LEASE_INVALID', 'Animatic lease, work, cost, and binding authority do not match.', 403)
    return authority
  }

  private async loadVerifiedUploadedNarration(
    production: MotionStudioProductionRow,
    request: Pick<AssembleMotionStudioAnimaticRequest, 'narrationMediaAssetId' | 'narrationChecksumSha256'>,
  ): Promise<{ authority: UploadedNarrationAuthority; bytes: Buffer }> {
    const authority = await loadPrivateFinalizedMediaAuthority({
      localStorageRoot: this.context.env.localStorageRoot,
      ownerUserId: this.actorUserId,
      workspaceId: production.workspace_id,
    }, request.narrationMediaAssetId)
    if (!authority) blocked('Finalized private uploaded narration authority was not found.')
    const { uploadIntent, mediaAsset, storageObject } = authority
    const metadata = mediaAsset.sourceMetadata
    if (
      uploadIntent.projectId !== production.project_id || uploadIntent.uploadPurpose !== 'source_media' ||
      mediaAsset.projectId !== production.project_id || mediaAsset.assetType !== 'source_audio' ||
      mediaAsset.uploadPurpose !== 'source_media' || storageObject.projectId !== production.project_id ||
      storageObject.uploadPurpose !== 'source_media' || storageObject.objectPurpose !== 'source_media' ||
      !ALLOWED_AUDIO_MIME_TYPES.has(mediaAsset.mimeType) || mediaAsset.mimeType !== storageObject.mimeType ||
      mediaAsset.checksumSha256 !== request.narrationChecksumSha256 ||
      mediaAsset.checksumSha256 !== storageObject.checksumSha256 ||
      mediaAsset.sizeBytes !== storageObject.sizeBytes || mediaAsset.sizeBytes > 16 * 1024 * 1024 ||
      !metadata || metadata.probeStatus !== 'probed' || !metadata.hasAudio || metadata.hasVideo ||
      !metadata.durationSeconds || !metadata.audioCodec || !metadata.audioSampleRateHertz || !metadata.audioChannelCount
    ) blocked('Uploaded narration does not satisfy exact private audio authority.')

    const { stream, storageObjectRecord } = await createUploadService(this.context)
      .createLocalObjectStream(storageObject.id, production.workspace_id)
    const live = await readAndHashBoundedStream(stream, 16 * 1024 * 1024)
    if (
      live.sha256 !== mediaAsset.checksumSha256 || live.byteLength !== mediaAsset.sizeBytes ||
      storageObjectRecord.id !== storageObject.id || storageObjectRecord.projectId !== production.project_id
    ) blocked('Uploaded narration bytes no longer match finalized private authority.')

    const storageIdentityHash = privateUploadMediaAuthorityValueHash({
      storageProvider: storageObject.storageProvider,
      bucketName: storageObject.bucketName,
      objectPath: storageObject.objectPath,
      generation: storageObject.generation,
      etag: storageObject.etag,
      metageneration: storageObject.metageneration,
    })
    const candidateWithoutHash = {
      authorityStatus: 'verified_private_upload' as const,
      uploadIntentId: uploadIntent.id,
      mediaAssetId: mediaAsset.id,
      storageObjectRecordId: storageObject.id,
      authorityRevision: authority.authorityRevision,
      authorityChecksumSha256: authority.authorityChecksumSha256,
      storageIdentityHash,
      mimeType: mediaAsset.mimeType,
      byteLength: mediaAsset.sizeBytes,
      checksumSha256: mediaAsset.checksumSha256,
      audioCodec: metadata.audioCodec,
      sampleRateHertz: metadata.audioSampleRateHertz,
      channelCount: metadata.audioChannelCount,
      durationMilliseconds: Math.max(1, Math.round(metadata.durationSeconds * 1_000)),
    }
    return {
      authority: motionStudioUploadedNarrationAuthoritySchema.parse({
        ...candidateWithoutHash,
        bindingHash: privateUploadMediaAuthorityValueHash(candidateWithoutHash),
      }),
      bytes: live.bytes,
    }
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.sceneRepository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Motion Studio animatic access is owner-private in the current canonical model.', 403)
    if (production.status === 'archived') blocked('Archived Motion Studio productions are immutable.')
    return production
  }
}

export function createMotionStudioAnimaticService(context: ServiceContext): MotionStudioAnimaticService {
  return new MotionStudioAnimaticService(context)
}

async function readAndHashBoundedStream(stream: NodeJS.ReadableStream, maximumBytes: number) {
  const hash = createHash('sha256')
  let byteLength = 0
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.length
    if (byteLength > maximumBytes) throw new ApiError('VALIDATION_FAILED', 'Uploaded narration exceeds the bounded animatic input limit.', 413)
    hash.update(bytes)
    chunks.push(bytes)
  }
  return { byteLength, sha256: hash.digest('hex'), bytes: Buffer.concat(chunks) }
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) throw new ApiError('AUTH_INVALID', 'Motion Studio animatic commands require a verified bearer identity.', 401)
  return userId
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function derivedIdempotencyKey(root: string, phase: string): string {
  return `ms008-${phase}-${createHash('sha256').update(root).digest('hex').slice(0, 48)}`
}

function runtimeScenes(values: readonly Record<string, unknown>[]) {
  return values.map((value, order) => {
    if (
      value.visualTreatment !== 'deterministic_placeholder' || value.finalAssetEligible !== false ||
      value.order !== order
    ) blocked('Animatic storyboard binding lost its review-only placeholder authority.')
    return {
      order,
      sceneId: requiredString(value.sceneId, 'sceneId'),
      startFrame: requiredInteger(value.startFrame, 'startFrame'),
      endFrame: requiredInteger(value.endFrame, 'endFrame'),
      title: requiredString(value.title, 'title'),
      visualDescription: requiredString(value.visualDescription, 'visualDescription'),
    }
  })
}

function assertNarrationBinding(
  narration: UploadedNarrationAuthority,
  authority: MotionStudioAnimaticExecutionAuthority,
): void {
  const binding = authority.binding
  if (
    sha256CanonicalJson(narration) !== binding.narration_authority_digest ||
    narration.mediaAssetId !== binding.narration_media_asset_id ||
    narration.checksumSha256 !== binding.narration_checksum_sha256 ||
    narration.byteLength !== binding.narration_byte_length ||
    narration.mimeType !== binding.narration_mime_type ||
    narration.audioCodec !== binding.narration_audio_codec ||
    narration.sampleRateHertz !== binding.narration_sample_rate_hertz ||
    narration.channelCount !== binding.narration_channel_count ||
    narration.durationMilliseconds !== binding.narration_duration_milliseconds
  ) blocked('Uploaded narration no longer matches the immutable animatic binding.')
}

function usageLine(
  authority: MotionStudioAnimaticExecutionAuthority,
  result?: OfflineRemotionRenderResult,
): MotionStudioAttemptUsageLine {
  const quantity = authority.binding.rendered_frame_count
  const calculated = Math.max(authority.cost.minimumChargeMicros, authority.cost.unitPriceMicros * quantity)
  if (
    !Number.isSafeInteger(calculated) || calculated !== authority.cost.expectedInternalCostMicros ||
    calculated > authority.cost.maximumAuthorizedInternalCostMicros ||
    calculated > authority.job.maximum_authorized_internal_cost_micros
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Approved render-frame rate authority no longer matches exact animatic usage.', 409)
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
      ...(result ? {
        artifactSha256: result.artifact.sha256,
        attestationDigest: result.attestation.attestationHash,
      } : {}),
    }),
  }
}

function executionReceipt(
  authority: MotionStudioAnimaticExecutionAuthority,
  artifact: MotionStudioAnimaticArtifactRow,
  usage: MotionStudioAttemptUsageLine,
): MotionStudioAnimaticExecutionReceiptDto {
  return {
    binding: animaticBindingDto(authority.binding, authority.job, authority.attempt, artifact),
    artifact: animaticArtifactDto(artifact),
    usage: {
      costEstimateItemId: usage.costEstimateItemId,
      meterId: 'render_frame',
      quantity: usage.quantity,
      internalCostMicros: usage.internalCostMicros,
    },
    localCandidateOnly: true,
  }
}

function assertRenderResult(
  result: OfflineRemotionRenderResult,
  authority: MotionStudioAnimaticExecutionAuthority,
): void {
  const binding = authority.binding
  const expectedFrames = [0, Math.floor((binding.rendered_frame_count - 1) / 2), binding.rendered_frame_count - 1]
  if (
    !('compositionProfileId' in result.request.payload) ||
    result.request.payload.compositionProfileId !== binding.registered_profile_id ||
    result.artifact.width !== binding.width || result.artifact.height !== binding.height ||
    result.artifact.fps !== binding.fps_numerator || result.artifact.durationFrames !== binding.rendered_frame_count ||
    result.frameArtifacts.length !== 3 || result.frameArtifacts.some((frame, index) => frame.frame !== expectedFrames[index]) ||
    result.evidence.semanticEvidence.motionStudioPreparedAnimaticCompositionExecuted !== true ||
    result.evidence.semanticEvidence.approvedNarrationBytesVerified !== true ||
    result.evidence.semanticEvidence.oneFrameDurationTailConstrained !== true ||
    result.evidence.semanticEvidence.reviewOnlyPlaceholderDisclosureRendered !== true ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.readiness.productReady || result.readiness.canonicalDispatchIntegrated
  ) throw runtimeUnavailable('Remotion output diverged from the exact immutable animatic binding.')
}

export function validateMotionStudioAnimaticProbe(
  document: Readonly<Record<string, unknown>>,
  binding: Pick<MotionStudioAnimaticBindingRow, 'rendered_frame_count' | 'fps_numerator' | 'width' | 'height'>,
): { digest: string; audioSampleRateHertz: number; audioChannelCount: number } {
  const streams = Array.isArray(document.streams) ? document.streams as Array<Record<string, unknown>> : []
  const video = streams.find((stream) => stream.codecType === 'video')
  const audio = streams.find((stream) => stream.codecType === 'audio')
  const approvedDurationSeconds = Number((binding.rendered_frame_count / binding.fps_numerator).toFixed(6))
  const actualDurationSeconds = Number(document.durationSeconds)
  const actualAudioDurationSeconds = Number(audio?.durationSeconds)
  const durationDriftFrames = Number((Math.abs(actualDurationSeconds - approvedDurationSeconds) * binding.fps_numerator).toFixed(6))
  const audioDurationDriftFrames = Number((Math.abs(actualAudioDurationSeconds - approvedDurationSeconds) * binding.fps_numerator).toFixed(6))
  const report = {
    videoCodecName: video?.codecName,
    pixelFormat: video?.pixelFormat,
    colorSpace: video?.colorSpace,
    width: video?.width,
    height: video?.height,
    fps: video?.fps,
    frameCount: video?.readFrameCount,
    audioCodecName: audio?.codecName,
    audioSampleRateHertz: audio?.sampleRate,
    audioChannelCount: audio?.channels,
    approvedDurationSeconds,
    actualDurationSeconds,
    actualAudioDurationSeconds,
    maximumDurationDriftFrames: 1,
    durationDriftFrames,
    audioDurationDriftFrames,
  }
  if (
    report.videoCodecName !== 'h264' || report.pixelFormat !== 'yuv420p' || report.colorSpace !== 'bt709' ||
    report.width !== binding.width || report.height !== binding.height || report.fps !== binding.fps_numerator ||
    report.frameCount !== binding.rendered_frame_count || report.audioCodecName !== 'aac' ||
    report.audioSampleRateHertz !== 48_000 || !Number.isSafeInteger(report.audioChannelCount) ||
    Number(report.audioChannelCount) < 1 || Number(report.audioChannelCount) > 2 ||
    !Number.isFinite(actualDurationSeconds) || !Number.isFinite(actualAudioDurationSeconds) ||
    durationDriftFrames > 1.000_001 || audioDurationDriftFrames > 1.000_001
  ) throw runtimeUnavailable('Independent FFprobe QA diverged from exact animatic video, audio, frame, or duration authority.')
  return {
    digest: sha256CanonicalJson(report),
    audioSampleRateHertz: 48_000,
    audioChannelCount: Number(report.audioChannelCount),
  }
}

async function assertPersistedBytes(
  localStorageRoot: string,
  privateObjectIdentityHash: string,
  result: OfflineRemotionRenderResult,
): Promise<void> {
  const stored = await readCanonicalPrivateRemotionArtifact({ localStorageRoot, privateObjectIdentityHash })
  if (
    !stored || stored.sha256 !== result.artifact.sha256 || stored.byteLength !== result.artifact.byteLength ||
    !stored.bytes.equals(result.artifact.bytes)
  ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Persisted animatic bytes changed before canonical receipt registration.', 409)
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) blocked(`Animatic ${label} is invalid.`)
  return value
}

function requiredInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) blocked(`Animatic ${label} is invalid.`)
  return Number(value)
}

function runtimeUnavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, { requiredGate: 'motion_studio_private_animatic' })
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
