import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'

import {
  motionStudioSceneDocumentSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioLayeredAssemblyDto,
  MotionStudioLayeredCutoutExecutionReceiptDto,
  MotionStudioLayeredWorkspaceDto,
  CreateMotionStudioLayeredAssemblyRequest,
  SceneDocument,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { persistCanonicalPrivateLayeredCutout, readCanonicalPrivateLayeredCutout } from '../../services/canonical-private-layered-asset-storage'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import {
  OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS,
  buildOfflineRembgBackgroundRemovalApprovedRequest,
  openPrivateOfflineRembgBackgroundRemovalRuntime,
  readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority,
} from '../../tool-execution/rembg-background-removal-execution'
import type { ServiceContext } from '../../types'
import type { MotionStudioArtifactVersionRow } from '../commands/types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createSupabaseMotionStudioJobRepository } from '../jobs/repository'
import { hashMotionStudioLeaseCredential, MotionStudioJobService } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { createSupabaseMotionStudioRenderRepository } from '../render/repository'
import { previewBindingDto } from '../render/types'
import { createSupabaseMotionStudioSceneRepository } from '../scenes/repository'
import type { MotionStudioSceneRepository } from '../scenes/types'
import { compileMotionStudioLayeredAssembly } from './compiler'
import { createSupabaseMotionStudioLayeredRepository } from './repository'
import {
  layeredAssemblyBaseDto,
  layeredCutoutArtifactDto,
  type MotionStudioLayeredCutoutExecutionAuthority,
  type MotionStudioLayeredRepository,
} from './types'

const LOCAL_WARNING = 'This is a fixed-fixture private local layered-motion candidate. User media, automatic depth, providers, remote Supabase, final delivery, billing, customer pricing and credits remain disabled.'

export class MotionStudioLayeredService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioLayeredRepository
  private readonly scenes: MotionStudioSceneRepository
  private readonly jobs: MotionStudioJobService
  private readonly renderRepository: ReturnType<typeof createSupabaseMotionStudioRenderRepository>

  constructor(context: ServiceContext, repository?: MotionStudioLayeredRepository) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    const client = ensureAdminClient(context)
    this.repository = repository ?? createSupabaseMotionStudioLayeredRepository(client)
    this.scenes = createSupabaseMotionStudioSceneRepository(client)
    this.jobs = new MotionStudioJobService(context, createSupabaseMotionStudioJobRepository(client))
    this.renderRepository = createSupabaseMotionStudioRenderRepository(client)
  }

  async getWorkspace(productionId: string) {
    await this.requireOwnedProduction(productionId)
    return { data: { layeredWorkspace: await this.readWorkspace(productionId) }, warnings: [LOCAL_WARNING] }
  }

  async createAssembly(
    productionId: string,
    request: CreateMotionStudioLayeredAssemblyRequest,
    idempotencyKey: string,
  ) {
    await this.requireOwnedProduction(productionId)
    const version = await this.requireSceneDocumentVersion(productionId, request)
    const document = parseSceneDocument(version)
    const proposal = (await this.scenes.listTimelineProposals(productionId))
      .find((candidate) => candidate.id === request.timelineProposalId)
    if (!proposal) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Exact layered timeline proposal was not found.', 404)
    const compiled = compileMotionStudioLayeredAssembly({
      sceneDocument: document,
      sceneDocumentVersion: {
        artifactId: version.artifact_id,
        versionId: version.id,
        versionNumber: version.version_number,
        contentDigest: version.content_digest,
      },
      proposal,
    })
    const requestHash = requestDigest('POST', `/v1/motion-studio/productions/${productionId}/layered-assemblies`, request)
    const created = await this.repository.createAssembly({
      productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      sceneDocumentArtifactId: request.sceneDocumentArtifactId,
      sceneDocumentVersionId: request.sceneDocumentVersionId,
      sceneDocumentContentDigest: request.sceneDocumentContentDigest,
      timelineProposalId: request.timelineProposalId,
      cutoutJobId: request.cutoutJobId,
      renderJobId: request.renderJobId,
      layerManifest: compiled.layerManifest,
      layerManifestDigest: compiled.layerManifestDigest,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    if (created.binding.layered_assembly_id !== created.assembly.id) {
      throw internalInvalid('Layered assembly lost its exact render binding authority.')
    }
    return {
      data: {
        assembly: await this.requireAssemblyDto(productionId, created.assembly.id),
        layeredWorkspace: await this.readWorkspace(productionId),
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async executeCutout(
    leaseId: string,
    leaseCredential: string,
    assemblyId: string,
    idempotencyKey: string,
  ) {
    const credentialHash = hashMotionStudioLeaseCredential(leaseCredential)
    let authority = await this.requireCutoutAuthority(assemblyId, leaseId, credentialHash)
    await this.requireOwnedProduction(authority.assembly.production_id)
    if (authority.artifact) {
      return { data: { receipt: await this.replayReceipt(authority) }, warnings: [LOCAL_WARNING] }
    }
    if (authority.lease.status !== 'active' || authority.attempt.status === 'unknown') {
      throw new ApiError('WORKER_LEASE_INVALID', 'The exact active cutout lease is required.', 409)
    }
    if (!['claimed', 'running'].includes(authority.attempt.status) || !['claimed', 'running'].includes(authority.job.status)) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The cutout job is not in an executable claimed state.', 409)
    }
    assertCostAuthority(authority)

    let started = authority.attempt.status === 'running'
    let executionCompleted = false
    let usage: readonly MotionStudioAttemptUsageLine[] = []
    try {
      if (!started) {
        await this.jobs.startAttempt(leaseId, leaseCredential, derivedKey(idempotencyKey, 'start'))
        started = true
        authority = await this.requireCutoutAuthority(assemblyId, leaseId, credentialHash)
      }
      const runtimeAuthority = await readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority()
      if (!runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady || runtimeAuthority.readiness.productReady) {
        throw runtimeUnavailable('Pinned private rembg runtime authority is unavailable.')
      }
      const runtime = await openPrivateOfflineRembgBackgroundRemovalRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw runtimeUnavailable('Opened rembg runtime identity changed after authorization.')
      }
      const request = buildOfflineRembgBackgroundRemovalApprovedRequest({
        toolId: 'rembg',
        operationId: OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS.rembg,
        planningPayload: {
          confidenceThreshold: 0.5, alphaMatteMode: 'straight',
          edgeRefinementProfileId: 'approved_u2netp_default_v1', maximumSubjects: 1,
        },
      })
      const startedAt = performance.now()
      const result = await runtime.execute(request)
      const executionDurationMilliseconds = Math.max(1, Math.ceil(performance.now() - startedAt))
      executionCompleted = true
      usage = [cutoutUsageLine(authority, executionDurationMilliseconds, result.artifact.sha256, result.attestation.attestationHash)]
      if (
        result.readiness.productReady || !result.readiness.privateInternalOnly ||
        result.evidence.semanticEvidence.serverOwnedFixtureOnly !== true ||
        result.evidence.semanticEvidence.callerMediaAllowed !== false ||
        result.evidence.semanticEvidence.alphaMinimum !== 0 ||
        result.evidence.semanticEvidence.alphaMaximum !== 255 ||
        result.evidence.semanticEvidence.alphaUniqueValueCount !== 160 ||
        result.evidence.semanticEvidence.foregroundAlphaMean !== 226.802912 ||
        result.evidence.semanticEvidence.backgroundAlphaMean !== 2.492606
      ) throw runtimeUnavailable('rembg output diverged from fixed-fixture alpha authority.')

      const qaEvidenceDigest = sha256CanonicalJson({
        assemblyId, layerManifestDigest: authority.assembly.layer_manifest_digest,
        artifactSha256: result.artifact.sha256, semanticEvidence: result.evidence.semanticEvidence,
        modelId: result.evidence.modelId, modelSha256: result.evidence.modelSha256,
        captionAboveMask: true, contactObjectPresent: false, maskRisk: 'low_fixture_only',
      })
      const privateObjectIdentityHash = sha256CanonicalJson({
        domain: 'motion_studio_private_layered_cutout_v1', assemblyId,
        attemptId: authority.attempt.id, artifactSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateLayeredCutout({
        localStorageRoot: this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        bytes: result.artifact.bytes,
        expectedSha256: result.artifact.sha256,
      })
      await assertPersistedCutout(this.context.env.localStorageRoot, privateObjectIdentityHash, result.artifact.sha256, result.artifact.byteLength)
      const outcomeDigest = sha256CanonicalJson({
        assemblyId, attemptId: authority.attempt.id, privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256, runtimeIdentityDigest: runtimeAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash, qaEvidenceDigest,
        executionDurationMilliseconds, usage,
      })
      const artifact = await this.repository.completeCutout({
        assemblyId, leaseId, credentialHash, privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256, byteLength: result.artifact.byteLength,
        runtimeIdentityDigest: runtimeAuthority.authorityHash,
        attestationDigest: result.attestation.attestationHash, qaEvidenceDigest,
        executionDurationMilliseconds, usage, outcomeDigest, actorUserId: this.actorUserId,
        idempotencyKey: derivedKey(idempotencyKey, 'complete'),
        requestHash: requestDigest('POST', `/v1/internal/motion-studio/job-leases/${leaseId}/layered-cutout`, {
          assemblyId, privateObjectIdentityHash, artifactSha256: result.artifact.sha256,
          executionDurationMilliseconds, usage,
        }),
      })
      const completed = await this.requireCutoutAuthority(assemblyId, leaseId, credentialHash)
      if (!completed.artifact || completed.artifact.id !== artifact.id) {
        throw internalInvalid('Completed layered cutout could not be read back from canonical authority.')
      }
      return { data: { receipt: await this.receipt(completed, usage[0]!) }, warnings: [LOCAL_WARNING] }
    } catch (error) {
      if (started && authority.lease.status === 'active' && ['claimed', 'running'].includes(authority.job.status)) {
        await this.jobs.finishAttempt(leaseId, leaseCredential, {
          outcome: 'failed', failureCategory: 'worker_transient', usage,
          outcomeDigest: sha256CanonicalJson({
            assemblyId, attemptId: authority.attempt.id, executionCompleted,
            failureClass: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
          }),
        }, derivedKey(idempotencyKey, 'failure')).catch(() => undefined)
      }
      throw error
    }
  }

  private async readWorkspace(productionId: string): Promise<MotionStudioLayeredWorkspaceDto> {
    const [assemblies, cutouts, renderState] = await Promise.all([
      this.repository.listAssemblies(productionId),
      this.repository.listCutoutArtifacts(productionId),
      this.renderRepository.readWorkspaceState(productionId),
    ])
    let workGraphJobs: Awaited<ReturnType<MotionStudioJobService['getWorkGraph']>>['data']['workGraph']['jobs'] = []
    try {
      workGraphJobs = (await this.jobs.getWorkGraph(productionId)).data.workGraph.jobs
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'MOTION_STUDIO_NOT_FOUND' || assemblies.length) throw error
    }
    const jobs = new Map(workGraphJobs.map((job) => [job.id, job]))
    const cutoutByAssembly = new Map(cutouts.map((artifact) => [artifact.assembly_id, artifact]))
    return {
      productionId,
      assemblies: assemblies.map((assembly) => {
        const cutoutJob = jobs.get(assembly.cutout_job_id)
        const renderJob = jobs.get(assembly.render_job_id)
        const binding = renderState.bindings.find((candidate) => candidate.layered_assembly_id === assembly.id)
        if (!cutoutJob || !renderJob || !binding) throw internalInvalid('Layered workspace lost exact job or render binding authority.')
        return {
          ...layeredAssemblyBaseDto(assembly),
          cutoutStatus: cutoutJob.status,
          renderStatus: renderJob.status,
          ...(cutoutByAssembly.get(assembly.id) ? { cutout: layeredCutoutArtifactDto(cutoutByAssembly.get(assembly.id)!) } : {}),
          renderBinding: previewBindingDto(binding, renderState.jobs.get(binding.job_id)!, renderState.attempts.get(binding.job_id), renderState.artifacts.get(binding.id)),
        }
      }),
      localCandidateOnly: true,
    }
  }

  private async requireAssemblyDto(productionId: string, assemblyId: string): Promise<MotionStudioLayeredAssemblyDto> {
    const workspace = await this.readWorkspace(productionId)
    const assembly = workspace.assemblies.find((candidate) => candidate.id === assemblyId)
    if (!assembly) throw internalInvalid('New layered assembly could not be read back.')
    return assembly
  }

  private async requireSceneDocumentVersion(
    productionId: string,
    request: CreateMotionStudioLayeredAssemblyRequest,
  ): Promise<MotionStudioArtifactVersionRow> {
    const version = await this.scenes.findArtifactVersion(productionId, request.sceneDocumentVersionId)
    if (!version || version.artifact_id !== request.sceneDocumentArtifactId ||
      version.content_digest !== request.sceneDocumentContentDigest || version.kind !== 'scene_document') {
      throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Exact layered SceneDocument version was not found.', 404)
    }
    if (!['approved', 'locked'].includes(version.state)) {
      throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Layered assembly requires an approved SceneDocument.', 409)
    }
    return version
  }

  private async requireCutoutAuthority(assemblyId: string, leaseId: string, credentialHash: string) {
    const authority = await this.repository.findCutoutExecutionAuthority(assemblyId, leaseId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Layered assembly was not found.', 404)
    if (
      authority.assembly.cutout_job_id !== authority.job.id || authority.lease.job_id !== authority.job.id ||
      authority.lease.attempt_id !== authority.attempt.id || authority.lease.credential_hash_sha256 !== credentialHash ||
      authority.job.approved_snapshot_id !== authority.assembly.approved_snapshot_id ||
      authority.job.approved_work_item_id !== authority.assembly.cutout_approved_work_item_id ||
      authority.job.cost_budget_id !== authority.assembly.cost_budget_id ||
      authority.job.work_item_type !== 'prepare_motion_studio_subject_cutout' ||
      authority.job.required_worker_class !== 'motion_studio_layered_asset_worker'
    ) throw new ApiError('WORKER_LEASE_INVALID', 'Cutout lease, work, budget and assembly authority do not match.', 403)
    return authority
  }

  private async replayReceipt(authority: MotionStudioLayeredCutoutExecutionAuthority) {
    const artifact = authority.artifact
    if (!artifact || authority.lease.attempt_id !== artifact.attempt_id || authority.job.status !== 'succeeded') {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Cutout replay lacks exact successful attempt authority.', 409)
    }
    await assertPersistedCutout(this.context.env.localStorageRoot, artifact.private_object_identity_hash, artifact.artifact_sha256, artifact.byte_length)
    return this.receipt(authority, cutoutUsageLine(authority, artifact.execution_duration_milliseconds, artifact.artifact_sha256, artifact.attestation_digest))
  }

  private async receipt(authority: MotionStudioLayeredCutoutExecutionAuthority, usage: MotionStudioAttemptUsageLine): Promise<MotionStudioLayeredCutoutExecutionReceiptDto> {
    const artifact = authority.artifact
    if (!artifact) throw internalInvalid('Layered cutout receipt requires a passed artifact.')
    return {
      assembly: await this.requireAssemblyDto(authority.assembly.production_id, authority.assembly.id),
      artifact: layeredCutoutArtifactDto(artifact),
      usage: {
        costEstimateItemId: usage.costEstimateItemId,
        meterId: 'cpu_second', quantity: usage.quantity,
        internalCostMicros: usage.internalCostMicros,
      },
      localCandidateOnly: true,
    }
  }

  private async requireOwnedProduction(productionId: string) {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'This layered workspace belongs to another production.', 403)
    if (production.status === 'archived') throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived productions cannot prepare layered motion.', 409)
    return production
  }
}

export function createMotionStudioLayeredService(context: ServiceContext): MotionStudioLayeredService {
  return new MotionStudioLayeredService(context)
}

function parseSceneDocument(version: MotionStudioArtifactVersionRow): SceneDocument {
  const payload = version.payload_json
  const parsed = motionStudioSceneDocumentSchema.safeParse(payload.data)
  if (!parsed.success) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Stored SceneDocument is invalid for layered assembly.', 409)
  return parsed.data
}

function cutoutUsageLine(
  authority: MotionStudioLayeredCutoutExecutionAuthority,
  durationMilliseconds: number,
  artifactSha256: string,
  attestationDigest: string,
): MotionStudioAttemptUsageLine {
  if (!Number.isSafeInteger(durationMilliseconds) || durationMilliseconds < 1 || durationMilliseconds > 300000) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured cutout execution duration is invalid.', 409)
  }
  const quantity = durationMilliseconds / 1000
  const calculatedBigInt = BigInt(authority.cost.unitPriceMicros) * BigInt(durationMilliseconds)
  const roundedMicros = Number((calculatedBigInt + 999n) / 1000n)
  const internalCostMicros = Math.max(authority.cost.minimumChargeMicros, roundedMicros)
  if (
    quantity > authority.cost.quantity || !Number.isSafeInteger(internalCostMicros) ||
    internalCostMicros > authority.cost.maximumAuthorizedInternalCostMicros ||
    internalCostMicros > authority.job.maximum_authorized_internal_cost_micros
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured cutout usage exceeds approved internal-cost authority.', 409)
  return {
    costEstimateItemId: authority.cost.estimateItemId,
    meterId: 'cpu_second', quantity, internalCostMicros,
    evidenceClass: 'infrastructure_metered',
    evidenceDigest: sha256CanonicalJson({
      assemblyId: authority.assembly.id, attemptId: authority.attempt.id,
      rateCardVersionId: authority.cost.rateCardVersionId,
      durationMilliseconds, quantity, internalCostMicros, artifactSha256, attestationDigest,
    }),
  }
}

function assertCostAuthority(authority: MotionStudioLayeredCutoutExecutionAuthority): void {
  if (authority.cost.quantity <= 0 || authority.cost.quantity > 300 || authority.cost.unitPriceMicros < 0) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', 'Approved rembg CPU rate authority is invalid.', 409)
  }
}
async function assertPersistedCutout(root: string, identity: string, sha256: string, byteLength: number): Promise<void> {
  const stored = await readCanonicalPrivateLayeredCutout({ localStorageRoot: root, privateObjectIdentityHash: identity })
  if (!stored || stored.sha256 !== sha256 || stored.byteLength !== byteLength) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Persisted layered cutout changed before receipt registration.', 409)
  }
}
function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) throw new ApiError('AUTH_INVALID', 'Layered motion requires a verified bearer identity.', 401)
  return userId
}
function requestDigest(method: string, path: string, body: unknown): string { return sha256CanonicalJson({ method, path, body }) }
function derivedKey(root: string, phase: string): string { return `ms009-${phase}-${createHash('sha256').update(root).digest('hex').slice(0, 48)}` }
function runtimeUnavailable(message: string): ApiError { return new ApiError('TOOL_NOT_READY', message, 503) }
function internalInvalid(message: string): ApiError { return new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true }) }
