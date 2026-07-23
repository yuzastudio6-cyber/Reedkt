import { createHash, randomUUID } from 'node:crypto'

import {
  motionStudioReferenceContractSchema,
  motionStudioSceneDocumentSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  CreateMotionStudioGenerationBindingRequest,
  AssetRef,
  MotionStudioGenerationExecutionReceiptDto,
  MotionStudioGenerationReferenceRole,
  MotionStudioGenerationTier,
  ReferenceContract,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  persistCanonicalPrivateGeneratedMedia,
  readCanonicalPrivateGeneratedMedia,
} from '../../services/canonical-private-generated-media-storage'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioProductionRow } from '../commands/types'
import { createSupabaseMotionStudioJobRepository } from '../jobs/repository'
import { hashMotionStudioLeaseCredential, MotionStudioJobService } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { createSupabaseMotionStudioSceneRepository } from '../scenes/repository'
import type { MotionStudioSceneRepository } from '../scenes/types'
import { versionReference } from '../scenes/types'
import { compileMotionStudioGeneration } from './compiler'
import { openMotionStudioProtocolSimulator, type MotionStudioProtocolSession } from './protocol-simulator'
import { verifyMotionStudioGeneratedMediaFixture } from './qa'
import { createSupabaseMotionStudioGenerationRepository } from './repository'
import {
  generationBindingDto,
  generationCandidateDto,
  generationExecutionReceipt,
  generationWorkspaceDto,
  providerOperationDto,
  type MotionStudioGenerationExecutionAuthority,
  type MotionStudioGenerationRepository,
  type MotionStudioProviderAttemptRow,
} from './types'

const LOCAL_WARNING = 'Generated-media execution is a private loopback protocol simulation. It makes no provider call, incurs no provider cost, creates no final-eligible asset, measures no reference adherence or visual quality, and does not activate billing, customer pricing, credits, export, or public delivery.'

export class MotionStudioGenerationService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioGenerationRepository
  private readonly scenes: MotionStudioSceneRepository
  private readonly jobs: MotionStudioJobService

  constructor(
    context: ServiceContext,
    repository?: MotionStudioGenerationRepository,
    scenes?: MotionStudioSceneRepository,
  ) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    const admin = ensureAdminClient(context)
    this.repository = repository ?? createSupabaseMotionStudioGenerationRepository(admin)
    this.scenes = scenes ?? createSupabaseMotionStudioSceneRepository(admin)
    this.jobs = new MotionStudioJobService(context, createSupabaseMotionStudioJobRepository(admin))
  }

  async getWorkspace(productionId: string) {
    await this.requireOwnedProduction(productionId)
    return {
      data: { generationWorkspace: await this.readWorkspace(productionId) },
      warnings: [LOCAL_WARNING],
    }
  }

  async createBinding(
    productionId: string,
    request: CreateMotionStudioGenerationBindingRequest,
    idempotencyKey: string,
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const [snapshot, version, proposals] = await Promise.all([
      this.scenes.findSnapshot(production, request.approvedSnapshotId),
      this.scenes.findArtifactVersion(productionId, request.sceneDocumentVersionId),
      this.scenes.listTimelineProposals(productionId),
    ])
    if (!snapshot) blocked('The exact approved snapshot is unavailable for generated-media planning.')
    if (
      !version || version.kind !== 'scene_document' ||
      version.artifact_id !== request.sceneDocumentArtifactId ||
      version.content_digest !== request.sceneDocumentContentDigest ||
      !['approved', 'locked'].includes(version.state)
    ) blocked('Generated media requires the exact approved SceneDocument version and digest.')
    const parsedDocument = motionStudioSceneDocumentSchema.safeParse(version.payload_json.data)
    if (!parsedDocument.success) blocked('The approved SceneDocument is invalid for generated-media compilation.')
    const proposal = proposals.find((candidate) => candidate.id === request.timelineProposalId)
    if (!proposal) blocked('The exact append-only timeline proposal is unavailable.')

    const referenceContractVersions = parsedDocument.data.generationReferenceContractVersions ?? []
    const referenceArtifacts = await this.scenes.findArtifactVersions(
      productionId,
      referenceContractVersions.map((reference) => reference.versionId),
    )
    const referenceArtifactsById = new Map(referenceArtifacts.map((reference) => [reference.id, reference]))
    const referenceVersions = referenceContractVersions.flatMap((reference) => {
      const artifactVersion = referenceArtifactsById.get(reference.versionId)
      if (
        !artifactVersion || artifactVersion.kind !== 'reference_contract' ||
        artifactVersion.artifact_id !== reference.artifactId ||
        artifactVersion.version_number !== reference.versionNumber ||
        artifactVersion.content_digest !== reference.contentDigest ||
        !['approved', 'locked'].includes(artifactVersion.state)
      ) blocked('Generated media requires each exact approved reference-contract version.')
      const contract = motionStudioReferenceContractSchema.safeParse(artifactVersion.payload_json.data)
      if (!contract.success) blocked('An approved reference contract is invalid for generated-media compilation.')
      const assetReference = artifactVersion.payload_json.references.find((candidate): candidate is AssetRef & {
        assetVersionId: string
        contentDigest: string
      } =>
        candidate.referenceKind === 'asset_ref' && candidate.assetId === contract.data.assetId &&
        Boolean(candidate.assetVersionId && candidate.contentDigest))
      if (!assetReference || !assetReference.assetVersionId || !assetReference.contentDigest) {
        blocked('An approved reference contract must freeze one exact asset version and digest.')
      }
      return contract.data.roles.map((role) => ({
        referenceContract: reference,
        assetId: assetReference.assetId,
        assetVersionId: assetReference.assetVersionId!,
        contentDigest: assetReference.contentDigest!,
        role,
        instruction: compileReferenceInstruction(contract.data, role),
      }))
    })

    const compiled = compileMotionStudioGeneration({
      sceneDocument: parsedDocument.data,
      sceneDocumentVersion: versionReference(version),
      proposal,
      mediaKind: request.mediaKind,
      modelTier: approvedModelTier(snapshot.snapshot_json),
      referenceVersions,
    })
    const requestHash = requestDigest(
      'POST',
      `/v1/motion-studio/productions/${productionId}/generation-bindings`,
      request,
    )
    const binding = await this.repository.createBinding({
      productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      sceneDocumentArtifactId: request.sceneDocumentArtifactId,
      sceneDocumentVersionId: request.sceneDocumentVersionId,
      sceneDocumentContentDigest: request.sceneDocumentContentDigest,
      timelineProposalId: request.timelineProposalId,
      jobId: request.jobId,
      shotSpec: compiled.shotSpec,
      shotSpecDigest: compiled.shotSpecDigest,
      routePolicy: compiled.routePolicy,
      routePolicyDigest: compiled.routePolicyDigest,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const workspace = await this.readWorkspace(productionId)
    const dto = workspace.bindings.find((candidate) => candidate.id === binding.id)
    if (!dto) internalInvalid('The generated-media binding could not be read back from canonical authority.')
    return { data: { binding: dto, generationWorkspace: workspace }, warnings: [LOCAL_WARNING] }
  }

  async executeGeneration(
    leaseId: string,
    leaseCredential: string,
    bindingId: string,
    idempotencyKey: string,
    simulationScenario:
      | 'success'
      | 'failed'
      | 'cancelled'
      | 'outcome_unknown'
      | 'qa_rejected'
      | 'execution_error' = 'success',
  ) {
    const credentialHash = hashMotionStudioLeaseCredential(leaseCredential)
    let authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
    await this.requireOwnedProduction(authority.binding.production_id)
    if (authority.candidate && authority.mediaVersion && authority.providerAttempt) {
      return { data: { receipt: await this.replayReceipt(authority) }, warnings: [LOCAL_WARNING] }
    }
    if (
      authority.providerAttempt?.status === 'reconciliation_required' &&
      authority.job.status === 'reconciliation_required' && authority.attempt.status === 'unknown'
    ) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The provider protocol outcome is unknown and requires explicit reconciliation.', 409, {
        providerAttemptId: authority.providerAttempt.id,
        retryAllowed: false,
      })
    }
    if (authority.lease.status !== 'active' || authority.attempt.status === 'unknown') {
      throw new ApiError('WORKER_LEASE_INVALID', 'The exact active generated-media lease is required.', 409)
    }
    if (!['claimed', 'running'].includes(authority.attempt.status) || !['claimed', 'running'].includes(authority.job.status)) {
      throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The generated-media job is not in an executable claimed state.', 409)
    }
    assertCostAuthority(authority)

    let started = authority.attempt.status === 'running'
    let terminalHandled = false
    let reconciliationRequired = false
    let usage: readonly MotionStudioAttemptUsageLine[] = []
    let session: MotionStudioProtocolSession | undefined
    let providerAttempt: MotionStudioProviderAttemptRow | undefined
    let meteringStartedAt: number | undefined
    let requestEvidenceDigest = authority.binding.shot_spec_digest
    const ensureMeasuredUsage = (mediaSha256?: string) => {
      if (!usage.length && meteringStartedAt !== undefined) {
        usage = [usageLine(
          authority,
          Math.max(1, Math.ceil(performance.now() - meteringStartedAt)),
          requestEvidenceDigest,
          mediaSha256,
        )]
      }
      return usage
    }
    try {
      if (!started) {
        await this.jobs.startAttempt(leaseId, leaseCredential, derivedKey(idempotencyKey, 'start'))
        started = true
        authority = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      }
      const route = authority.binding.route_policy_json.candidates[0]
      if (!route || route.routeRole !== 'primary' || route.finalFallbackOnly) {
        blocked('MS-010A can execute only the first approved, non-rescue route.')
      }
      meteringStartedAt = performance.now()
      session = await openMotionStudioProtocolSimulator({
        shotSpec: authority.binding.shot_spec_json,
        providerRoute: route.providerRoute,
        ffmpegBin: this.context.env.ffmpegBin,
        behavior: simulationScenario,
      })
      requestEvidenceDigest = session.requestDigest
      providerAttempt = await this.repository.beginProviderAttempt({
        bindingId,
        leaseId,
        credentialHash,
        providerRoute: session.providerRoute,
        providerModelVersion: session.providerModelVersion,
        requestDigest: session.requestDigest,
        externalOperationIdHash: session.externalOperationIdHash,
        actorUserId: this.actorUserId,
        idempotencyKey: derivedKey(idempotencyKey, 'provider'),
        requestHash: requestDigest(
          'POST',
          `/v1/internal/motion-studio/generation-bindings/${bindingId}/provider-attempts`,
          {
            providerRoute: session.providerRoute,
            providerModelVersion: session.providerModelVersion,
            requestDigest: session.requestDigest,
            externalOperationIdHash: session.externalOperationIdHash,
          },
        ),
      })
      const result = await session.execute()
      requestEvidenceDigest = result.requestDigest
      for (const signal of result.signals) {
        await this.repository.recordProviderSignal({
          providerAttemptId: providerAttempt.id,
          eventKeyHash: signal.eventKeyHash,
          eventSource: signal.eventSource,
          eventType: signal.eventType,
          normalizedStatus: signal.normalizedStatus,
          verificationKind: signal.verificationKind,
          signatureVerified: signal.signatureVerified,
          eventDigest: signal.eventDigest,
          occurredAt: signal.occurredAt,
          actorUserId: this.actorUserId,
        })
      }
      const terminal = result.signals.at(-1)?.normalizedStatus
      if (terminal === 'reconciliation_required') {
        ensureMeasuredUsage()
        await this.repository.markReconciliationRequired({
          providerAttemptId: providerAttempt.id,
          leaseId,
          credentialHash,
          usage,
          evidenceDigest: sha256CanonicalJson({
            bindingId,
            providerAttemptId: providerAttempt.id,
            terminal,
            usage,
          }),
          actorUserId: this.actorUserId,
          idempotencyKey: derivedKey(idempotencyKey, 'unknown'),
          requestHash: requestDigest(
            'POST',
            `/v1/internal/motion-studio/provider-attempts/${providerAttempt.id}/reconciliation-required`,
            { usage, terminal },
          ),
        })
        reconciliationRequired = true
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The provider protocol outcome is unknown and requires explicit reconciliation.', 409, {
          providerAttemptId: providerAttempt.id,
          retryAllowed: false,
        })
      }
      if (terminal === 'failed' || terminal === 'cancelled') {
        ensureMeasuredUsage()
        await this.jobs.finishAttempt(leaseId, leaseCredential, {
          outcome: terminal,
          ...(terminal === 'failed' ? { failureCategory: 'provider_transient' } : {}),
          usage,
          outcomeDigest: sha256CanonicalJson({ bindingId, providerAttemptId: providerAttempt.id, terminal, usage }),
        }, derivedKey(idempotencyKey, 'terminal'))
        terminalHandled = true
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', `The simulated provider operation ended as ${terminal}.`, 409, {
          providerAttemptId: providerAttempt.id,
          newApprovalRequiredForFallback: true,
        })
      }
      if (terminal !== 'completed' || !result.bytes || !result.mimeType) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'The provider protocol did not return exact completed media.', 409)
      }
      let qa: Awaited<ReturnType<typeof verifyMotionStudioGeneratedMediaFixture>>
      try {
        qa = await verifyMotionStudioGeneratedMediaFixture({
          bytes: result.bytes,
          mimeType: result.mimeType,
          shotSpec: authority.binding.shot_spec_json,
          ffprobeBin: this.context.env.ffprobeBin,
        })
      } catch (error) {
        ensureMeasuredUsage()
        await this.jobs.finishAttempt(leaseId, leaseCredential, {
          outcome: 'failed',
          failureCategory: 'quality_rejected',
          usage,
          outcomeDigest: sha256CanonicalJson({
            bindingId,
            providerAttemptId: providerAttempt.id,
            failureCategory: 'quality_rejected',
            usage,
          }),
        }, derivedKey(idempotencyKey, 'qa-rejected'))
        terminalHandled = true
        throw error
      }
      ensureMeasuredUsage(qa.sha256)
      const privateObjectIdentityHash = sha256CanonicalJson({
        domain: 'motion_studio_private_generated_media_v1',
        bindingId,
        providerAttemptId: providerAttempt.id,
        mediaSha256: qa.sha256,
      })
      await persistCanonicalPrivateGeneratedMedia({
        localStorageRoot: this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        mimeType: result.mimeType,
        bytes: result.bytes,
        expectedSha256: qa.sha256,
      })
      await assertPersistedMedia(
        this.context.env.localStorageRoot,
        privateObjectIdentityHash,
        result.mimeType,
        qa.sha256,
        qa.byteLength,
      )
      const provenanceDigest = sha256CanonicalJson({
        sourceKind: 'protocol_simulator_fixture',
        adapterId: 'motion_studio_protocol_simulator_v1',
        providerRoute: result.providerRoute,
        providerModelVersion: result.providerModelVersion,
        providerCostIncurred: false,
        outputIsProviderGenerated: false,
        shotSpecDigest: authority.binding.shot_spec_digest,
        routePolicyDigest: authority.binding.route_policy_digest,
        requestDigest: result.requestDigest,
        externalOperationIdHash: result.externalOperationIdHash,
        qaEvidenceDigest: qa.qaEvidenceDigest,
      })
      const mediaAssetId = randomUUID()
      const mediaAssetVersionId = randomUUID()
      const outcomeDigest = sha256CanonicalJson({
        bindingId,
        providerAttemptId: providerAttempt.id,
        mediaAssetId,
        mediaAssetVersionId,
        privateObjectIdentityHash,
        mediaSha256: qa.sha256,
        provenanceDigest,
        qaEvidenceDigest: qa.qaEvidenceDigest,
        usage,
      })
      const completed = await this.repository.completeCandidate({
        providerAttemptId: providerAttempt.id,
        leaseId,
        credentialHash,
        mediaAssetId,
        mediaAssetVersionId,
        privateObjectIdentityHash,
        mediaSha256: qa.sha256,
        byteLength: qa.byteLength,
        mimeType: qa.mimeType,
        width: qa.width,
        height: qa.height,
        ...(qa.durationFrames ? { durationFrames: qa.durationFrames } : {}),
        ...(qa.fpsNumerator ? { fpsNumerator: qa.fpsNumerator } : {}),
        ...(qa.fpsDenominator ? { fpsDenominator: qa.fpsDenominator } : {}),
        provenanceDigest,
        qaEvidenceDigest: qa.qaEvidenceDigest,
        safetyStatus: qa.safetyStatus,
        usage,
        outcomeDigest,
        actorUserId: this.actorUserId,
        idempotencyKey: derivedKey(idempotencyKey, 'complete'),
        requestHash: requestDigest(
          'POST',
          `/v1/internal/motion-studio/provider-attempts/${providerAttempt.id}/candidates`,
          {
            mediaAssetId,
            mediaAssetVersionId,
            privateObjectIdentityHash,
            mediaSha256: qa.sha256,
            qaEvidenceDigest: qa.qaEvidenceDigest,
            usage,
            outcomeDigest,
          },
        ),
      })
      // Candidate completion atomically succeeds the exact job attempt. Any
      // subsequent readback failure must not attempt to fail that terminal
      // attempt a second time.
      terminalHandled = true
      const committed = await this.requireExecutionAuthority(bindingId, leaseId, credentialHash)
      if (
        !committed.candidate || !committed.mediaVersion || !committed.providerAttempt ||
        committed.candidate.id !== completed.candidate.id ||
        committed.mediaVersion.id !== completed.mediaVersion.id
      ) internalInvalid('The generated-media candidate could not be read back from canonical authority.')
      return {
        data: { receipt: receipt(committed) },
        warnings: [LOCAL_WARNING],
      }
    } catch (error) {
      ensureMeasuredUsage()
      if (
        started && !terminalHandled && !reconciliationRequired &&
        authority.lease.status === 'active' && ['claimed', 'running'].includes(authority.job.status)
      ) {
        await this.jobs.finishAttempt(leaseId, leaseCredential, {
          outcome: 'failed',
          failureCategory: 'worker_transient',
          usage,
          outcomeDigest: sha256CanonicalJson({
            bindingId,
            attemptId: authority.attempt.id,
            failureClass: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
          }),
        }, derivedKey(idempotencyKey, 'failure'))
      }
      throw error
    } finally {
      await session?.close().catch(() => undefined)
    }
  }

  async readPrivateMedia(assetVersionId: string) {
    const authority = await this.repository.findMediaAuthority(assetVersionId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Private generated-media asset version was not found.', 404)
    await this.requireOwnedProduction(authority.production.id)
    if (
      authority.candidate.media_asset_version_id !== authority.mediaVersion.id ||
      !['image/png', 'video/mp4'].includes(authority.mediaVersion.mime_type)
    ) internalInvalid('Private generated-media authority is not a supported immutable artifact.')
    const mimeType = authority.mediaVersion.mime_type as 'image/png' | 'video/mp4'
    const stored = await readCanonicalPrivateGeneratedMedia({
      localStorageRoot: this.context.env.localStorageRoot,
      privateObjectIdentityHash: authority.mediaVersion.private_object_identity_hash,
      mimeType,
    })
    if (
      !stored || stored.sha256 !== authority.mediaVersion.sha256 ||
      stored.byteLength !== authority.mediaVersion.byte_length
    ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private generated-media bytes no longer match immutable authority.', 409)
    return {
      media: {
        assetVersionId: authority.mediaVersion.id,
        mimeType,
        sha256: authority.mediaVersion.sha256,
      },
      bytes: stored.bytes,
    }
  }

  async reconcileGeneration(
    providerAttemptId: string,
    request: { decision: 'no_side_effect' | 'manual_review'; evidenceDigest: string },
    idempotencyKey: string,
  ) {
    const result = await this.repository.reconcileProviderAttempt({
      providerAttemptId,
      decision: request.decision,
      evidenceDigest: request.evidenceDigest,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: requestDigest(
        'POST',
        `/v1/internal/motion-studio/provider-attempts/${providerAttemptId}/reconciliation`,
        request,
      ),
    })
    return { data: { result, localCandidateOnly: true as const }, warnings: [LOCAL_WARNING] }
  }

  private async readWorkspace(productionId: string) {
    const state = await this.repository.readWorkspaceState(productionId)
    return generationWorkspaceDto({ productionId, ...state })
  }

  private async replayReceipt(
    authority: MotionStudioGenerationExecutionAuthority,
  ): Promise<MotionStudioGenerationExecutionReceiptDto> {
    if (
      !authority.candidate || !authority.mediaVersion || !authority.providerAttempt ||
      authority.job.status !== 'succeeded' || authority.providerAttempt.status !== 'completed'
    ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Generation replay lacks exact successful candidate authority.', 409)
    const mimeType = authority.mediaVersion.mime_type
    if (mimeType !== 'image/png' && mimeType !== 'video/mp4') internalInvalid('Generation replay has unsupported private media.')
    await assertPersistedMedia(
      this.context.env.localStorageRoot,
      authority.mediaVersion.private_object_identity_hash,
      mimeType,
      authority.mediaVersion.sha256,
      authority.mediaVersion.byte_length,
    )
    const usage = await this.repository.findAttemptUsage(authority.attempt.id)
    if (!usage) internalInvalid('Generation replay lost immutable internal-cost usage authority.')
    return receipt(authority)
  }

  private async requireExecutionAuthority(bindingId: string, leaseId: string, credentialHash: string) {
    const authority = await this.repository.findExecutionAuthority(bindingId, leaseId)
    if (!authority) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Generated-media binding was not found.', 404)
    const expectedWorkType = authority.binding.media_kind === 'still_image'
      ? 'generate_motion_studio_still_fixture'
      : 'generate_motion_studio_video_fixture'
    if (
      authority.binding.job_id !== authority.job.id || authority.lease.job_id !== authority.job.id ||
      authority.lease.attempt_id !== authority.attempt.id ||
      authority.lease.credential_hash_sha256 !== credentialHash ||
      authority.job.approved_snapshot_id !== authority.binding.approved_snapshot_id ||
      authority.job.approved_work_item_id !== authority.binding.approved_work_item_id ||
      authority.job.cost_budget_id !== authority.binding.cost_budget_id ||
      authority.job.work_item_type !== expectedWorkType ||
      authority.job.required_worker_class !== 'motion_studio_generation_simulator_worker' ||
      authority.cost.capabilityOrToolId !== 'motion_studio_protocol_simulator'
    ) throw new ApiError('WORKER_LEASE_INVALID', 'Generation lease, work, budget, cost, and binding authority do not match.', 403)
    return authority
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The authenticated user does not own this Motion Studio production.', 403)
    }
    return production
  }
}

export function createMotionStudioGenerationService(context: ServiceContext): MotionStudioGenerationService {
  return new MotionStudioGenerationService(context)
}

function approvedModelTier(snapshot: Record<string, unknown>): MotionStudioGenerationTier {
  const plan = record(snapshot.plan)
  const compiledIntent = record(plan.compiledIntent)
  const resolved = record(compiledIntent.resolvedSettings)
  return resolved.editLevel === 'pro' || resolved.editLevel === 'premium' ? resolved.editLevel : 'basic'
}

function compileReferenceInstruction(
  contract: ReferenceContract,
  role: MotionStudioGenerationReferenceRole,
): string {
  const direction = role === 'do_not_copy'
    ? contract.avoidCopying
    : [...contract.extract, ...contract.preserve]
  const fallback = role === 'do_not_copy'
    ? 'Analyze the reference but do not copy its exact layout or identity.'
    : `Use only the approved ${role} characteristics.`
  return (direction.length ? direction.join('; ') : fallback).slice(0, 500)
}

function usageLine(
  authority: MotionStudioGenerationExecutionAuthority,
  durationMilliseconds: number,
  requestDigestValue: string,
  mediaSha256: string | undefined,
): MotionStudioAttemptUsageLine {
  if (!Number.isSafeInteger(durationMilliseconds) || durationMilliseconds < 1 || durationMilliseconds > 300_000) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured protocol-simulator duration is invalid.', 409)
  }
  const quantity = durationMilliseconds / 1000
  const calculatedBigInt = BigInt(authority.cost.unitPriceMicros) * BigInt(durationMilliseconds)
  const roundedMicros = Number((calculatedBigInt + 999n) / 1000n)
  const internalCostMicros = Math.max(authority.cost.minimumChargeMicros, roundedMicros)
  if (
    quantity > authority.cost.quantity || !Number.isSafeInteger(internalCostMicros) ||
    internalCostMicros > authority.cost.maximumAuthorizedInternalCostMicros ||
    internalCostMicros > authority.job.maximum_authorized_internal_cost_micros
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Measured simulator usage exceeds approved internal-cost authority.', 409)
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
      requestDigest: requestDigestValue,
      ...(mediaSha256 ? { mediaSha256 } : {}),
    }),
  }
}

function receipt(
  authority: MotionStudioGenerationExecutionAuthority,
): MotionStudioGenerationExecutionReceiptDto {
  const { binding, job, attempt, providerAttempt, candidate, mediaVersion } = authority
  if (!providerAttempt || !candidate || !mediaVersion) internalInvalid('Generation receipt lacks committed candidate authority.')
  const bindingDto = generationBindingDto({ binding, job, attempt, providerAttempt, candidate, mediaVersion })
  return generationExecutionReceipt({
    binding: bindingDto,
    providerOperation: providerOperationDto(providerAttempt),
    candidate: generationCandidateDto(candidate, mediaVersion),
  })
}

function assertCostAuthority(authority: MotionStudioGenerationExecutionAuthority): void {
  if (
    authority.cost.quantity <= 0 || authority.cost.quantity > 300 ||
    authority.cost.unitPriceMicros < 0 || authority.cost.minimumChargeMicros < 0
  ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'Approved simulator CPU rate authority is invalid.', 409)
}

async function assertPersistedMedia(
  root: string,
  identity: string,
  mimeType: 'image/png' | 'video/mp4',
  sha256: string,
  byteLength: number,
): Promise<void> {
  const stored = await readCanonicalPrivateGeneratedMedia({
    localStorageRoot: root,
    privateObjectIdentityHash: identity,
    mimeType,
  })
  if (!stored || stored.sha256 !== sha256 || stored.byteLength !== byteLength) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Persisted generated media changed before canonical registration.', 409)
  }
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Generated-media operations require a verified bearer identity.', 401)
  }
  return userId
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function derivedKey(root: string, phase: string): string {
  return `ms010-${phase}-${createHash('sha256').update(root).digest('hex').slice(0, 48)}`
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
