import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'

import { motionStudioAudioMixWorkspaceDtoSchema } from '../../../src/lib/motion-studio/contracts'
import type {
  CreateMotionStudioAudioMixBindingRequest,
  MotionStudioAudioCandidateReviewSummaryDto,
  MotionStudioAudioMixExecutionReceiptDto,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioProductionRow } from '../commands/types'
import { createSupabaseMotionStudioJobRepository } from '../jobs/repository'
import { hashMotionStudioLeaseCredential, MotionStudioJobService } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { executeMotionStudioPrivateAudioMix } from './private-mix-runtime'
import {
  loadVerifiedMotionStudioUploadedAudioInput,
  safeVerifiedAudioInput,
  type VerifiedMotionStudioUploadedAudioInput,
} from './private-upload-input'
import { createSupabaseMotionStudioAudioMixRepository } from './repository'
import type {
  MotionStudioAudioMixExecutionAuthority,
  MotionStudioAudioMixRepository,
} from './types'
import {
  assertCanonicalMotionStudioAudioCandidateReviewProjection,
  type CanonicalMotionStudioAudioCandidateReviewProjection,
} from './canonical-audio-candidate-review-reader-port'
import { parseMotionStudioPcmWave } from './pcm-wave'

const LOCAL_WARNING = 'Private Storytelling audio mix only. External providers, timeline, render, export, billing, customer pricing, credits, deployment, and public delivery remain disabled.'

export class MotionStudioAudioMixService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioAudioMixRepository
  private readonly jobs: MotionStudioJobService

  constructor(context: ServiceContext, repository?: MotionStudioAudioMixRepository) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    const admin = ensureAdminClient(context)
    this.repository = repository ?? createSupabaseMotionStudioAudioMixRepository(admin)
    this.jobs = new MotionStudioJobService(context, createSupabaseMotionStudioJobRepository(admin))
  }

  async getWorkspace(productionId: string) {
    const production = await this.requireOwnedProduction(productionId)
    const workspace = await this.repository.readWorkspace(productionId)
    const candidateReviews = await this.readCurrentCandidateReviews(production, workspace.candidateReviews)
    return {
      data: {
        audioMixWorkspace: motionStudioAudioMixWorkspaceDtoSchema.parse({
          ...workspace,
          ...(candidateReviews.length > 0 ? { candidateReviews } : { candidateReviews: undefined }),
        }),
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async createBinding(
    productionId: string,
    request: CreateMotionStudioAudioMixBindingRequest,
    idempotencyKey: string,
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const audioAuthority = await this.repository.findAudioAuthority(productionId, request.audioAuthorityId)
    if (
      !audioAuthority || audioAuthority.approved_snapshot_id !== request.sourceApprovedSnapshotId ||
      audioAuthority.mix_plan_version_id !== request.mixPlanVersionId ||
      audioAuthority.mix_plan_content_digest !== request.mixPlanContentDigest
    ) blocked('The exact accepted Storytelling audio authority is unavailable.')

    const verified: VerifiedMotionStudioUploadedAudioInput[] = []
    for (const selection of request.inputs) {
      verified.push(await loadVerifiedMotionStudioUploadedAudioInput({
        context: this.context,
        actorUserId: this.actorUserId,
        production,
        selection,
      }))
    }
    const safeInputs = verified.map(safeVerifiedAudioInput)
    const inputDigest = audioMixInputDigest(request.fps, request.durationFrames, safeInputs)
    const requestHash = requestDigest(
      'POST',
      `/v1/motion-studio/productions/${productionId}/audio-mix-bindings`,
      request,
    )
    const binding = await this.repository.createBinding({
      productionId,
      request,
      verifiedInputs: safeInputs,
      inputDigest,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const workspace = await this.repository.readWorkspace(productionId)
    const safeBinding = workspace.bindings.find((candidate) => candidate.bindingId === binding.id)
    if (!safeBinding) internalInvalid('New private audio mix binding could not be read back.')
    return {
      data: { binding: safeBinding, audioMixWorkspace: workspace },
      warnings: [LOCAL_WARNING],
    }
  }

  async executeMix(
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
    if (
      authority.lease.status !== 'active' || authority.attempt.status === 'unknown' ||
      !['claimed', 'running'].includes(authority.attempt.status) ||
      !['claimed', 'running'].includes(authority.job.status)
    ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The exact claimed private audio mix attempt is required.', 409)

    let started = authority.attempt.status === 'running'
    let artifactPersisted = false
    let usage: readonly MotionStudioAttemptUsageLine[] = []
    try {
      if (!started) {
        await this.jobs.startAttempt(leaseId, leaseCredential, derivedKey(idempotencyKey, 'start'))
        started = true
        authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      }
      const inputs = await this.reloadExactInputs(production, authority)
      const startedAt = performance.now()
      const result = await executeMotionStudioPrivateAudioMix({
        fps: authority.binding.fps,
        durationFrames: authority.binding.duration_frames,
        inputs,
      })
      const durationMilliseconds = Math.max(1, Math.ceil(performance.now() - startedAt))
      if (
        result.evidence.inputDigest !== authority.binding.input_digest ||
        result.artifact.sampleCountPerChannel !== authority.binding.sample_count_per_channel ||
        result.quality.qaEvidenceDigest !== sha256CanonicalJson({
          ...result.quality,
          qaEvidenceDigest: undefined,
        })
      ) internalInvalid('Private audio runtime result diverged from immutable input or QA authority.')
      usage = [audioMixUsageLine(authority, durationMilliseconds, result.artifact.sha256)]
      const privateObjectIdentityHash = sha256CanonicalJson({
        domain: 'motion_studio_private_storytelling_audio_mix_v1',
        bindingId: authority.binding.id,
        attemptId: authority.attempt.id,
        artifactSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateAudioArtifact({
        localStorageRoot: this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        bytes: result.artifact.bytes,
        expectedSha256: result.artifact.sha256,
      })
      await assertPersistedAudio(
        this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        result.artifact.sha256,
        result.artifact.byteLength,
      )
      artifactPersisted = true
      const outcomeDigest = sha256CanonicalJson({
        bindingId: authority.binding.id,
        attemptId: authority.attempt.id,
        privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256,
        qualityDigest: result.quality.qaEvidenceDigest,
        evidence: result.evidence,
        durationMilliseconds,
        usage,
      })
      const completionBody = {
        bindingId: authority.binding.id,
        privateObjectIdentityHash,
        artifactSha256: result.artifact.sha256,
        qualityDigest: result.quality.qaEvidenceDigest,
        usage,
        outcomeDigest,
      }
      const artifact = await this.repository.completeAttempt({
        bindingId: authority.binding.id,
        leaseId,
        credentialHash,
        privateObjectIdentityHash,
        result,
        usage,
        outcomeDigest,
        actorUserId: this.actorUserId,
        idempotencyKey: derivedKey(idempotencyKey, 'complete'),
        requestHash: requestDigest(
          'POST',
          `/v1/internal/motion-studio/job-leases/${leaseId}/storytelling-audio-mix`,
          completionBody,
        ),
      })
      const completed = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      if (!completed.artifact || completed.artifact.id !== artifact.id || !completed.usage) {
        internalInvalid('Completed private audio mix could not be read back from canonical authority.')
      }
      return {
        data: { receipt: await this.executionReceipt(completed) },
        warnings: [LOCAL_WARNING],
      }
    } catch (error) {
      // A create-only artifact is a real side effect. If database completion is
      // uncertain, leave the attempt for reconciliation instead of recording a
      // false no-side-effect failure and blindly retrying the mix.
      if (
        started && !artifactPersisted && authority.lease.status === 'active' &&
        ['claimed', 'running'].includes(authority.job.status)
      ) {
        await this.jobs.finishAttempt(leaseId, leaseCredential, {
          outcome: 'failed',
          failureCategory: failureCategory(error),
          usage,
          outcomeDigest: sha256CanonicalJson({
            bindingId,
            attemptId: authority.attempt.id,
            artifactPersisted: false,
            failureClass: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
          }),
        }, derivedKey(idempotencyKey, 'failure')).catch(() => undefined)
      }
      throw error
    }
  }

  async readPrivateArtifact(artifactId: string) {
    const artifact = await this.repository.findArtifact(artifactId)
    if (!artifact) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private Storytelling audio mix was not found.', 404)
    await this.requireOwnedProduction(artifact.production_id)
    const stored = await readCanonicalPrivateAudioArtifact({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: artifact.private_object_identity_hash,
    })
    if (!stored || stored.sha256 !== artifact.artifact_sha256 || stored.byteLength !== artifact.byte_length) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private audio bytes no longer match immutable artifact authority.', 409)
    }
    return { artifact, bytes: stored.bytes }
  }

  async readPrivateCandidate(candidateReference: string) {
    const reader = this.context.canonicalMotionStudioAudioCandidateReviewReaderPort
    if (!reader) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Private Storytelling candidate playback is waiting for the released canonical review reader.',
        503,
      )
    }
    const resolvedInput = await reader.resolveCurrentCandidateReview(candidateReference)
    if (!resolvedInput) {
      throw new ApiError(
        'MOTION_STUDIO_NOT_FOUND',
        'Private Storytelling audio candidate was not found.',
        404,
      )
    }
    const resolved = assertCanonicalMotionStudioAudioCandidateReviewProjection(resolvedInput)
    if (resolved.summary.candidateReference !== candidateReference) {
      blocked('Private audio candidate reference changed during canonical resolution.')
    }
    const production = await this.requireOwnedProduction(resolved.summary.productionId)
    this.assertCandidateScope(production, resolved)

    const current = await this.readCurrentCandidateReviewProjections(production)
    const visible = current.filter((entry) =>
      entry.summary.candidateReference === candidateReference)
    if (
      visible.length !== 1 ||
      visible[0]!.projectionDigest !== resolved.projectionDigest
    ) {
      blocked('Private audio candidate is no longer current for this exact Storytelling production.')
    }
    const candidate = resolved.summary.candidate
    if (!candidate || ![
      'ready_for_review',
      'reviewed_passed',
      'reviewed_rejected',
    ].includes(resolved.summary.state)) {
      blocked('Private audio candidate is not available for complete review playback.')
    }
    const readback = await reader.readExactPrivateCandidate({
      workspaceId: production.workspace_id,
      projectId: production.project_id,
      editSessionId: production.edit_session_id,
      productionId: production.id,
      candidateReference,
      projectionDigest: resolved.projectionDigest,
    })
    if (!readback) {
      blocked('Private audio candidate bytes are unavailable from canonical readback.')
    }
    const rereadProjection = assertCanonicalMotionStudioAudioCandidateReviewProjection(
      readback.projection,
    )
    if (
      rereadProjection.projectionDigest !== resolved.projectionDigest ||
      rereadProjection.summary.candidateReference !== candidateReference ||
      !Buffer.isBuffer(readback.bytes) ||
      readback.bytes.byteLength !== candidate.byteLength ||
      createHash('sha256').update(readback.bytes).digest('hex') !== candidate.sha256
    ) blocked('Private audio candidate readback changed immutable projection or byte authority.')

    let wave: ReturnType<typeof parseMotionStudioPcmWave>
    try {
      wave = parseMotionStudioPcmWave(readback.bytes)
    } catch {
      blocked('Private audio candidate readback failed exact PCM media verification.')
    }
    if (
      wave.sampleRateHertz !== candidate.sampleRateHertz ||
      wave.channelCount !== candidate.channelCount ||
      wave.bitsPerSample !== 16 ||
      wave.durationMilliseconds !== candidate.durationMilliseconds
    ) blocked('Private audio candidate readback changed exact PCM media authority.')
    return { candidate, bytes: readback.bytes }
  }

  private async readCurrentCandidateReviews(
    production: MotionStudioProductionRow,
    repositoryReviews: readonly MotionStudioAudioCandidateReviewSummaryDto[] | undefined,
  ): Promise<readonly MotionStudioAudioCandidateReviewSummaryDto[]> {
    const projections = await this.readCurrentCandidateReviewProjections(production)
    const projectedReviews = projections.map((entry) => entry.summary)
    const persistedReviews = repositoryReviews ?? []
    if (
      persistedReviews.length > 0 &&
      sha256CanonicalJson(persistedReviews) !== sha256CanonicalJson(projectedReviews)
    ) {
      blocked('Audio candidate workspace projection does not match canonical source verification.')
    }
    return projectedReviews
  }

  private async readCurrentCandidateReviewProjections(
    production: MotionStudioProductionRow,
  ): Promise<readonly CanonicalMotionStudioAudioCandidateReviewProjection[]> {
    const reader = this.context.canonicalMotionStudioAudioCandidateReviewReaderPort
    if (!reader) return []
    const inputs = await reader.listCurrentCandidateReviews({
      workspaceId: production.workspace_id,
      projectId: production.project_id,
      editSessionId: production.edit_session_id,
      productionId: production.id,
    })
    const projections = inputs.map((entry) =>
      assertCanonicalMotionStudioAudioCandidateReviewProjection(entry))
    if (
      projections.length > 2 ||
      new Set(projections.map((entry) => entry.summary.candidateReference)).size !==
        projections.length ||
      new Set(projections.map((entry) => entry.summary.role)).size !== projections.length
    ) blocked('Canonical audio candidate reader returned duplicate or excessive current projections.')
    for (const projection of projections) this.assertCandidateScope(production, projection)
    return projections
  }

  private assertCandidateScope(
    production: MotionStudioProductionRow,
    projection: CanonicalMotionStudioAudioCandidateReviewProjection,
  ): void {
    const summary = projection.summary
    if (
      summary.productionId !== production.id ||
      summary.projectId !== production.project_id ||
      summary.editSessionId !== production.edit_session_id
    ) blocked('Canonical audio candidate projection does not match the exact named edit.')
  }

  private async reloadExactInputs(
    production: MotionStudioProductionRow,
    authority: MotionStudioAudioMixExecutionAuthority,
  ): Promise<VerifiedMotionStudioUploadedAudioInput[]> {
    const inputs: VerifiedMotionStudioUploadedAudioInput[] = []
    for (const stored of authority.binding.verified_inputs_json) {
      const verified = await loadVerifiedMotionStudioUploadedAudioInput({
        context: this.context,
        actorUserId: this.actorUserId,
        production,
        selection: stored,
      })
      if (sha256CanonicalJson(safeVerifiedAudioInput(verified)) !== sha256CanonicalJson(stored)) {
        blocked('A private audio upload changed after immutable mix binding.')
      }
      inputs.push(verified)
    }
    if (audioMixInputDigest(authority.binding.fps, authority.binding.duration_frames, inputs) !== authority.binding.input_digest) {
      blocked('Private audio input evidence no longer matches the immutable mix binding.')
    }
    return inputs
  }

  private async requireExecutionAuthority(bindingId: string, leaseId: string, credentialHash: string) {
    const authority = await this.repository.findExecutionAuthority(bindingId, leaseId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private Storytelling audio mix binding was not found.', 404)
    const binding = authority.binding
    if (
      binding.job_id !== authority.job.id || authority.lease.job_id !== authority.job.id ||
      authority.lease.attempt_id !== authority.attempt.id ||
      authority.lease.credential_hash_sha256 !== credentialHash ||
      authority.job.approved_snapshot_id !== binding.execution_approved_snapshot_id ||
      authority.job.approved_work_item_id !== binding.approved_work_item_id ||
      authority.job.cost_budget_id !== binding.cost_budget_id ||
      authority.job.work_item_type !== 'mix_motion_studio_storytelling_audio' ||
      authority.job.required_worker_class !== 'motion_studio_audio_mix_worker' ||
      binding.sample_count_per_channel !== binding.duration_frames * (48_000 / binding.fps) ||
      audioMixInputDigest(binding.fps, binding.duration_frames, binding.verified_inputs_json) !== binding.input_digest ||
      authority.cost.quantity < 1 || authority.cost.quantity > 120 ||
      authority.cost.maximumAuthorizedInternalCostMicros > authority.job.maximum_authorized_internal_cost_micros ||
      authority.cost.unitPriceMicros < 0 || authority.cost.minimumChargeMicros < 0 ||
      (authority.artifact && authority.artifact.attempt_id !== authority.attempt.id)
    ) throw new ApiError('WORKER_LEASE_INVALID', 'Audio mix lease, work, cost, and immutable binding authority do not match.', 403)
    return authority
  }

  private async replayReceipt(authority: MotionStudioAudioMixExecutionAuthority) {
    if (
      !authority.artifact || !authority.usage || authority.job.status !== 'succeeded' ||
      authority.artifact.attempt_id !== authority.attempt.id
    ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private audio replay lacks exact successful attempt authority.', 409)
    await assertPersistedAudio(
      this.context.env.localStorageRoot,
      authority.artifact.private_object_identity_hash,
      authority.artifact.artifact_sha256,
      authority.artifact.byte_length,
    )
    return this.executionReceipt(authority)
  }

  private async executionReceipt(
    authority: MotionStudioAudioMixExecutionAuthority,
  ): Promise<MotionStudioAudioMixExecutionReceiptDto> {
    if (!authority.artifact || !authority.usage) internalInvalid('Private audio receipt requires artifact and usage authority.')
    const workspace = await this.repository.readWorkspace(authority.binding.production_id)
    const binding = workspace.bindings.find((candidate) => candidate.bindingId === authority.binding.id)
    if (!binding?.artifact || binding.artifact.artifactId !== authority.artifact.id) {
      internalInvalid('Private audio receipt lost its browser-safe artifact authority.')
    }
    return {
      binding,
      artifact: binding.artifact,
      usage: {
        costEstimateItemId: authority.usage.costEstimateItemId,
        meterId: 'cpu_second',
        quantity: authority.usage.quantity,
        internalCostMicros: authority.usage.internalCostMicros,
      },
      privateReviewOnly: true,
    }
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'This private audio workspace belongs to another production.', 403)
    }
    if (production.status === 'archived') blocked('Archived Motion Studio productions cannot mix audio.')
    return production
  }
}

export function createMotionStudioAudioMixService(context: ServiceContext): MotionStudioAudioMixService {
  return new MotionStudioAudioMixService(context)
}

function audioMixInputDigest(
  fps: 24 | 30,
  durationFrames: number,
  inputs: readonly Omit<VerifiedMotionStudioUploadedAudioInput, 'bytes'>[] | readonly VerifiedMotionStudioUploadedAudioInput[],
): string {
  const inputEvidenceDigest = sha256CanonicalJson(inputs.map((entry) => ({
    role: entry.role,
    stemId: entry.stemId,
    mediaAssetId: entry.mediaAssetId,
    checksumSha256: entry.checksumSha256,
    bindingHash: entry.bindingHash,
    startFrame: entry.startFrame,
    endFrame: entry.endFrame,
    cueAuthorityId: entry.cueAuthorityId,
    rightsEvidenceId: entry.rightsEvidenceId,
  })))
  return sha256CanonicalJson({ fps, durationFrames, inputEvidenceDigest })
}

function audioMixUsageLine(
  authority: MotionStudioAudioMixExecutionAuthority,
  durationMilliseconds: number,
  artifactSha256: string,
): MotionStudioAttemptUsageLine {
  if (!Number.isSafeInteger(durationMilliseconds) || durationMilliseconds < 1 || durationMilliseconds > 120_000) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured audio mix duration is outside approved CPU authority.', 409)
  }
  const quantity = durationMilliseconds / 1_000
  const roundedMicros = Number(
    (BigInt(authority.cost.unitPriceMicros) * BigInt(durationMilliseconds) + 999n) / 1_000n,
  )
  const internalCostMicros = Math.max(authority.cost.minimumChargeMicros, roundedMicros)
  if (
    quantity > authority.cost.quantity || !Number.isSafeInteger(internalCostMicros) ||
    internalCostMicros > authority.cost.maximumAuthorizedInternalCostMicros ||
    internalCostMicros > authority.job.maximum_authorized_internal_cost_micros
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured audio mix usage exceeds approved internal-cost authority.', 409)
  return {
    costEstimateItemId: authority.cost.estimateItemId,
    meterId: 'cpu_second',
    quantity,
    internalCostMicros,
    evidenceClass: 'infrastructure_metered',
    evidenceDigest: sha256CanonicalJson({
      bindingId: authority.binding.id,
      attemptId: authority.attempt.id,
      rateCardVersionId: authority.cost.rateCardVersionId,
      durationMilliseconds,
      quantity,
      internalCostMicros,
      artifactSha256,
    }),
  }
}

async function assertPersistedAudio(root: string, identity: string, sha256: string, byteLength: number): Promise<void> {
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: root,
    privateObjectIdentityHash: identity,
  })
  if (!stored || stored.sha256 !== sha256 || stored.byteLength !== byteLength) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Persisted private audio changed before canonical registration.', 409)
  }
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Private Storytelling audio mix requires a verified bearer identity.', 401)
  }
  return userId
}

function failureCategory(error: unknown): string {
  if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') return 'temporary_unavailable'
  if (error instanceof ApiError && error.code === 'JOB_DEPENDENCY_NOT_READY') return 'quality_gate_failed'
  if (error instanceof ApiError && error.code === 'MOTION_STUDIO_APPROVAL_BLOCKED') return 'dependency_changed'
  return 'worker_transient'
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function derivedKey(root: string, phase: string): string {
  return `ms012b-${phase}-${createHash('sha256').update(root).digest('hex').slice(0, 48)}`
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
