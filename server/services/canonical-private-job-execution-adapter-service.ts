import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  getProvenEndToEndToolIdentity,
  listProvenToolIdentityCatalog,
  type ProvenToolRunnerClass,
} from '../tool-execution/proven-tool-identity-catalog'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateJobExecutionAdapterResponseSchema,
  executeCanonicalPrivateJobAdapterSchema,
  type CanonicalPrivateJobExecutionAdapterResponse,
  type ExecuteCanonicalPrivateJobAdapterBody,
} from '../validation/canonical-private-job-execution-adapter-schemas'
import { createCanonicalInternalAuthorityRunnerService } from './canonical-internal-authority-runner-service'
import { createCanonicalPrivateAiCapabilityExecutionService } from './canonical-private-ai-capability-execution-service'
import { createCanonicalPrivateAudioFluxAnalysisExecutionService } from './canonical-private-audioflux-analysis-execution-service'
import { createCanonicalPrivateBrowserGraphicsExecutionService } from './canonical-private-browser-graphics-execution-service'
import { createCanonicalPrivateContainerPackagingValidationExecutionService } from './canonical-private-container-packaging-validation-execution-service'
import { createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService } from './canonical-private-deepfilternet-voice-cleanup-execution-service'
import { createCanonicalPrivateFinalCompositionExecutionService } from './canonical-private-final-composition-execution-service'
import { createCanonicalPrivateLibassExecutionService } from './canonical-private-libass-execution-service'
import { createCanonicalPrivateMediaBinaryExecutionService } from './canonical-private-media-binary-execution-service'
import { createCanonicalPrivateNativeAudioProcessingExecutionService } from './canonical-private-native-audio-processing-execution-service'
import { createCanonicalPrivateNativeImagePipelineExecutionService } from './canonical-private-native-image-pipeline-execution-service'
import { createCanonicalPrivatePythonToolExecutionService } from './canonical-private-python-tool-execution-service'
import { createCanonicalPrivateRembgBackgroundRemovalExecutionService } from './canonical-private-rembg-background-removal-execution-service'
import { createCanonicalPrivateRemotionExecutionService } from './canonical-private-remotion-execution-service'
import { createCanonicalPrivateSharpExecutionService } from './canonical-private-sharp-execution-service'
import { createCanonicalPrivateStructuredToolExecutionService } from './canonical-private-structured-tool-execution-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalPrivateVapourSynthFramePipelineExecutionService } from './canonical-private-vapoursynth-frame-pipeline-execution-service'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const RESPONSE_PATH_PREFIX = 'private-internal/canonical-job-execution-adapter/v1'
const adapterExecutionLocks = new Map<string, Promise<void>>()

export interface ExecuteCanonicalPrivateJobAdapterInput extends ExecuteCanonicalPrivateJobAdapterBody {
  jobId: string
  idempotencyKey: string
}

interface PersistedAdapterResponse {
  schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1'
  requestHash: string
  response: CanonicalPrivateJobExecutionAdapterResponse
}

interface PersistedAdapterCompletion {
  schemaVersion: 'canonical-private-job-execution-adapter-completion-v1'
  requestHash: string
  response: CanonicalPrivateJobExecutionAdapterResponse
}

type CoordinatorResponse = Record<string, unknown> & {
  result: Record<string, unknown>
  completedAt: string
  attemptCost?: Record<string, unknown>
}

/**
 * Bridges one immutable canonical job to its exact private/internal runner.
 *
 * The request deliberately contains no snapshot, reservation, tool, operation,
 * output, path, URL, command, provider, price, or credit fields. Every execution
 * identity is reconstructed from server-owned authority before a lease is
 * claimed. This is a single-job adapter, not a whole-work-graph scheduler.
 */
export function createCanonicalPrivateJobExecutionAdapterService(context: ServiceContext) {
  return {
    async execute(input: ExecuteCanonicalPrivateJobAdapterInput): Promise<CanonicalPrivateJobExecutionAdapterResponse> {
      const { jobId, idempotencyKey: rawIdempotencyKey, ...requestBody } = input
      const parsed = executeCanonicalPrivateJobAdapterSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(jobId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private job execution adapter request validation failed.',
          400,
          parsed.success ? { jobId: ['Invalid canonical job identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const actorUserId = getRequiredAuthUserId(context)
      const requestHash = sha256AuthorityValue({
        operation: 'execute_canonical_private_job',
        actorUserId,
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: body.purpose,
      })
      const responseRelativePath = adapterResponseRelativePath(actorUserId, body.workspaceId, idempotencyKey)
      const completionRelativePath = adapterCompletionRelativePath(actorUserId, body, jobId)
      return withAdapterExecutionLock(responseRelativePath, async () => {
        const replay = await readPersistedResponse(context, responseRelativePath, requestHash)
        if (replay) return markReplay(replay)
        return withAdapterExecutionLock(completionRelativePath, async () => {
          const completion = await readPersistedCompletion(context, completionRelativePath, requestHash)
          if (completion) {
            await persistIdempotencyResponse(context, responseRelativePath, requestHash, completion)
            return markReplay(completion)
          }

        const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        readiness.job.approvedPlanSnapshotId,
        body.workspaceId,
      )
      const workItem = authority.workItems.find((candidate) => candidate.id === readiness.job.approvedWorkItemId)
      if (!workItem) {
        throw new ApiError('JOB_NOT_FOUND', 'Canonical approved work item is missing for this derived job.', 409)
      }
      const expectedAssets = authority.assetManifest.entries.filter((candidate) =>
        candidate.approvedWorkItemId === workItem.id && readiness.job.expectedAssetIds.includes(candidate.id))
      if (expectedAssets.length !== 1 || readiness.job.expectedAssetIds.length !== 1) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Canonical private job adapter currently requires exactly one server-owned expected output.',
          409,
          { requiredGate: 'canonical_multi_output_job_execution_adapter' },
        )
      }
      const expectedAsset = expectedAssets[0]!
      const internalAuthorityJob = workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'validate_approved_snapshot'
      const internalSourceTrimJob = workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'prepare_source_trim'
      const internalServerJob = internalAuthorityJob || internalSourceTrimJob
      let resolvedProvenTool: ReturnType<typeof getProvenEndToEndToolIdentity>
      if (!internalServerJob) {
        if (workItem.approvedToolIds.length !== 1) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Canonical private job adapter requires exactly one approved tool identity.',
            409,
            { requiredGate: 'canonical_multi_tool_job_execution_adapter' },
          )
        }
        const approvedToolId = workItem.approvedToolIds[0]!
        const catalogRecord = listProvenToolIdentityCatalog().find((candidate) =>
          candidate.canonicalToolId === approvedToolId)
        if (!catalogRecord) {
          throw new ApiError('TOOL_NOT_READY', 'Approved canonical tool identity is not in the proven catalog.', 409)
        }
        resolvedProvenTool = getProvenEndToEndToolIdentity(catalogRecord.canonicalToolId)
        if (!resolvedProvenTool || !resolvedProvenTool.runtime.runnerClass) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Approved canonical tool has not passed the exact private end-to-end lifecycle.',
            409,
            { requiredGate: 'canonical_tool_lifecycle_evidence' },
          )
        }
      }
      const stageKey = (stage: string) => `job-adapter:${stage}:${sha256(`${idempotencyKey}\u0000${jobId}`).slice(0, 48)}`
      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const claim = (await leaseService.claim({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: 'private_internal_canonical_lease_claim',
        idempotencyKey: stageKey('claim'),
      })).workerLeaseClaim
      const leaseAuthority = {
        leaseId: claim.lease.leaseId,
        leaseCredential: claim.leaseCredential,
      }

      let rawResponse: CoordinatorResponse
      let canonicalToolId: string | null = null
      let operationId: string
      let runnerClass: string
      let singleUseDispatchConsumed = false
      let finalCompositionExecution = false

      if (internalServerJob) {
        operationId = internalSourceTrimJob
          ? 'internal.validate_approved_source_trim_plan.v1'
          : 'internal.validate_snapshot_manifest.v1'
        runnerClass = internalSourceTrimJob
          ? 'canonical_source_trim_validation_runner_v1'
          : 'canonical_authority_validation_runner_v1'
        rawResponse = asCoordinatorResponse(await createCanonicalInternalAuthorityRunnerService(context).execute({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId,
          expectedAssetId: expectedAsset.id,
          purpose: internalSourceTrimJob
            ? 'execute_canonical_internal_source_trim_validation'
            : 'execute_canonical_internal_authority_validation',
        }, leaseAuthority))
      } else {
        const provenTool = resolvedProvenTool!
        const provenRunnerClass = provenTool.runtime.runnerClass
        if (!provenRunnerClass) {
          throw new ApiError('TOOL_NOT_READY', 'Approved canonical tool runner identity is unavailable.', 409)
        }
        canonicalToolId = provenTool.canonicalToolId
        operationId = provenTool.operationId
        runnerClass = provenRunnerClass
        finalCompositionExecution =
          provenTool.canonicalToolId === 'remotion' &&
          workItem.workItemType === 'render_final_export' &&
          expectedAsset.assetRole === 'final'
        const grant = (await createCanonicalPrivateToolDispatchAuthorityService(context).authorize({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          jobId,
          approvedWorkItemId: workItem.id,
          expectedAssetId: expectedAsset.id,
          requestedToolName: provenTool.canonicalToolId,
          operationId: provenTool.operationId,
          purpose: 'private_internal_canonical_tool_dispatch_authorization',
          idempotencyKey: stageKey('authorize'),
        }, leaseAuthority)).toolDispatchGrant
        if (grant.grant.status !== 'authorized' || !grant.dispatchCredential) {
          await leaseService.release({
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId,
            leaseId: claim.lease.leaseId,
            leaseCredential: claim.leaseCredential,
            purpose: 'private_internal_canonical_lease_release',
            idempotencyKey: stageKey('release-denied-dispatch'),
          })
          throw new ApiError(
            'TOOL_NOT_READY',
            'Canonical tool dispatch did not issue exact single-use private execution authority.',
            409,
            {
              canonicalToolId,
              operationId,
              dispatchStatus: grant.grant.status,
              privateInternalRuntimeReady: grant.evidence.runtimePrivateInternalReady,
            },
          )
        }
        rawResponse = await executeToolCoordinator({
          context,
          body,
          jobId,
          grantId: grant.grant.grantId,
          idempotencyKey: stageKey('consume'),
          runnerClass: provenRunnerClass,
          finalCompositionExecution,
          serverAuthority: { ...leaseAuthority, dispatchCredential: grant.dispatchCredential },
        })
        singleUseDispatchConsumed = true
      }

      const normalized = normalizeResponse({
        body,
        jobId,
        approvedPlanSnapshotId: readiness.job.approvedPlanSnapshotId,
        approvedWorkItemId: workItem.id,
        expectedAssetId: expectedAsset.id,
        canonicalToolId,
        operationId,
        runnerClass,
        singleUseDispatchConsumed,
        finalCompositionExecution,
        rawResponse,
        idempotentAdapterReplay: false,
      })
      const persisted: PersistedAdapterResponse = {
        schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1',
        requestHash,
        response: normalized,
      }
      const persistedCompletion: PersistedAdapterCompletion = {
        schemaVersion: 'canonical-private-job-execution-adapter-completion-v1',
        requestHash,
        response: normalized,
      }
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: context.env.localStorageRoot,
        relativePath: completionRelativePath,
        content: Buffer.from(`${stableAuthorityStringify(persistedCompletion)}\n`, 'utf8'),
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: context.env.localStorageRoot,
        relativePath: responseRelativePath,
        content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
      })
        return normalized
        })
      })
    },
  }
}

async function executeToolCoordinator(input: {
  context: ServiceContext
  body: ExecuteCanonicalPrivateJobAdapterBody
  jobId: string
  grantId: string
  idempotencyKey: string
  runnerClass: ProvenToolRunnerClass
  finalCompositionExecution: boolean
  serverAuthority: { leaseId: string; leaseCredential: string; dispatchCredential: string }
}): Promise<CoordinatorResponse> {
  const base = {
    workspaceId: input.body.workspaceId,
    projectId: input.body.projectId,
    editSessionId: input.body.editSessionId,
    jobId: input.jobId,
    grantId: input.grantId,
    idempotencyKey: input.idempotencyKey,
  }
  const authority = input.serverAuthority as never
  let response: unknown
  switch (input.runnerClass) {
    case 'offline_node_structured_execution_v1':
      response = await createCanonicalPrivateStructuredToolExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_structured_tool',
      }, authority)
      break
    case 'offline_sharp_structured_execution_v1':
      response = await createCanonicalPrivateSharpExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_sharp_tool',
      }, authority)
      break
    case 'offline_python_structured_execution_v1':
      response = await createCanonicalPrivatePythonToolExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_python_tool',
      }, authority)
      break
    case 'offline_media_binary_execution_v1':
      response = await createCanonicalPrivateMediaBinaryExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_media_binary_tool',
      }, authority)
      break
    case 'offline_remotion_render_execution_v1':
      response = input.finalCompositionExecution
        ? await createCanonicalPrivateFinalCompositionExecutionService(input.context).execute({
            ...base, purpose: 'execute_canonical_private_final_composition',
          }, authority)
        : await createCanonicalPrivateRemotionExecutionService(input.context).execute({
            ...base, purpose: 'execute_canonical_private_remotion_tool',
          }, authority)
      break
    case 'offline_libass_caption_execution_v1':
      response = await createCanonicalPrivateLibassExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_libass_tool',
      }, authority)
      break
    case 'offline_browser_graphics_execution_v1':
      response = await createCanonicalPrivateBrowserGraphicsExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_browser_graphic',
      }, authority)
      break
    case 'offline_ai_capability_execution_v1':
      response = await createCanonicalPrivateAiCapabilityExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_ai_capability',
      }, authority)
      break
    case 'offline_native_image_pipeline_execution_v1':
      response = await createCanonicalPrivateNativeImagePipelineExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_native_image_pipeline',
      }, authority)
      break
    case 'offline_native_audio_processing_execution_v1':
      response = await createCanonicalPrivateNativeAudioProcessingExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_native_audio_processing',
      }, authority)
      break
    case 'offline_container_packaging_validation_execution_v1':
      response = await createCanonicalPrivateContainerPackagingValidationExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_container_packaging_validation',
      }, authority)
      break
    case 'offline_vapoursynth_frame_pipeline_execution_v1':
      response = await createCanonicalPrivateVapourSynthFramePipelineExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_vapoursynth_frame_pipeline',
      }, authority)
      break
    case 'offline_audioflux_analysis_execution_v1':
      response = await createCanonicalPrivateAudioFluxAnalysisExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_audioflux_analysis',
      }, authority)
      break
    case 'offline_rembg_background_removal_execution_v1':
      response = await createCanonicalPrivateRembgBackgroundRemovalExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_rembg_background_removal',
      }, authority)
      break
    case 'offline_deepfilternet_voice_cleanup_execution_v1':
      response = await createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_deepfilternet_voice_cleanup',
      }, authority)
      break
  }
  return asCoordinatorResponse(response)
}

function normalizeResponse(input: {
  body: ExecuteCanonicalPrivateJobAdapterBody
  jobId: string
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  expectedAssetId: string
  canonicalToolId: string | null
  operationId: string
  runnerClass: string
  singleUseDispatchConsumed: boolean
  finalCompositionExecution: boolean
  rawResponse: CoordinatorResponse
  idempotentAdapterReplay: boolean
}): CanonicalPrivateJobExecutionAdapterResponse {
  const result = input.rawResponse.result
  const coordinatorTool = optionalRecord(input.rawResponse.tool)
  const finalArtifactQa = optionalRecord(input.rawResponse.finalArtifactQa)
  const dependencyGates = input.finalCompositionExecution
    ? normalizeFinalCompositionDependencyGates(input.rawResponse)
    : result.liveRuntimeDependencySatisfied === undefined
      ? normalizePrivateOnlyCoordinatorDependencyGates(input.rawResponse)
    : {
        privateTestDependencySatisfied: requireLiteral(
          result.privateTestDependencySatisfied,
          true,
          'privateTestDependencySatisfied',
        ),
        liveRuntimeDependencySatisfied: requireLiteral(
          result.liveRuntimeDependencySatisfied,
          false,
          'liveRuntimeDependencySatisfied',
        ),
        finalRenderAuthorized: requireLiteral(result.finalRenderAuthorized, false, 'finalRenderAuthorized'),
      }
  const responseWithoutHash = {
    schemaVersion: 'canonical-private-job-execution-adapter-response-v2' as const,
    source: 'canonical_private_job_execution_adapter' as const,
    purpose: input.body.purpose,
    identity: {
      workspaceId: input.body.workspaceId,
      projectId: input.body.projectId,
      editSessionId: input.body.editSessionId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      jobId: input.jobId,
      approvedWorkItemId: input.approvedWorkItemId,
      expectedAssetId: input.expectedAssetId,
      canonicalToolId: input.canonicalToolId,
      operationId: input.operationId,
      runnerClass: input.runnerClass,
    },
    result: {
      artifactId: requireString(result.artifactId, 'artifactId'),
      contentType: requireString(result.contentType, 'contentType'),
      sha256: requireSha256(result.sha256, 'sha256'),
      byteLength: requirePositiveInteger(result.byteLength, 'byteLength'),
      qaOutcome: requireLiteral(result.qaOutcome, 'passed', 'qaOutcome'),
      reconciliationDecision: requireLiteral(
        result.reconciliationDecision,
        'test_merged_not_live_authorized',
        'reconciliationDecision',
      ),
      ...dependencyGates,
    },
    evidence: {
      serverDerivedCanonicalJob: true as const,
      serverDerivedToolAndOperation: true as const,
      fundedReservationVerified: true as const,
      opaqueLeaseClaimed: true as const,
      singleUseDispatchConsumed: input.singleUseDispatchConsumed,
      privateArtifactPersisted: true as const,
      actualQaPassed: true as const,
      reconciliationPassed: true as const,
      idempotentAdapterReplay: input.idempotentAdapterReplay,
      attemptCostEvidenceRecorded: Boolean(input.rawResponse.attemptCost),
      dependencyArtifactInput: coordinatorTool?.inputKind === 'qa_passed_dependency_artifact',
      finalArtifactQaPassed: finalArtifactQa?.finalQaGatesPassed === true,
    },
    permissions: {
      providerCall: false as const,
      publicArtifact: false as const,
      publicDelivery: false as const,
      productionRender: false as const,
      customerPriceMutation: false as const,
      customerCreditMutation: false as const,
      walletMutation: false as const,
      settlement: false as const,
      billing: false as const,
      deployment: false as const,
    },
    readiness: {
      privateInternalJobExecutionReady: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate: 'canonical_required_job_capabilities_and_terminal_private_review' as const,
    },
    completedAt: requireString(input.rawResponse.completedAt, 'completedAt'),
    testOnly: true as const,
  }
  return canonicalPrivateJobExecutionAdapterResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function markReplay(response: CanonicalPrivateJobExecutionAdapterResponse): CanonicalPrivateJobExecutionAdapterResponse {
  const { responseHash, ...withoutHash } = response
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical job adapter replay response hash is invalid.', 409)
  }
  return canonicalPrivateJobExecutionAdapterResponseSchema.parse({
    ...withoutHash,
    evidence: { ...withoutHash.evidence, idempotentAdapterReplay: true },
    responseHash: sha256AuthorityValue({
      ...withoutHash,
      evidence: { ...withoutHash.evidence, idempotentAdapterReplay: true },
    }),
  })
}

function normalizePrivateOnlyCoordinatorDependencyGates(response: CoordinatorResponse): {
  privateTestDependencySatisfied: true
  liveRuntimeDependencySatisfied: false
  finalRenderAuthorized: false
} {
  const result = response.result
  const permissions = requireRecord(response.permissions, 'permissions')
  const runtime = requireRecord(response.runtime, 'runtime')
  requireLiteral(result.privateTestDependencySatisfied, true, 'privateTestDependencySatisfied')
  requireLiteral(result.finalRenderAuthorized, false, 'finalRenderAuthorized')
  requireLiteral(runtime.productReady, false, 'runtime.productReady')
  requireLiteral(runtime.externalBetaReady, false, 'runtime.externalBetaReady')
  requireLiteral(runtime.productionReady, false, 'runtime.productionReady')
  const delivery = permissions.publicDelivery ?? permissions.delivery
  requireLiteral(delivery, false, 'permissions.delivery')
  return {
    privateTestDependencySatisfied: true,
    liveRuntimeDependencySatisfied: false,
    finalRenderAuthorized: false,
  }
}

function normalizeFinalCompositionDependencyGates(response: CoordinatorResponse): {
  privateTestDependencySatisfied: true
  liveRuntimeDependencySatisfied: false
  finalRenderAuthorized: false
} {
  const result = response.result
  const permissions = requireRecord(response.permissions, 'permissions')
  const runtime = requireRecord(response.runtime, 'runtime')
  requireLiteral(result.privateFinalArtifactRecorded, true, 'privateFinalArtifactRecorded')
  requireLiteral(result.publicDeliveryAuthorized, false, 'publicDeliveryAuthorized')
  requireLiteral(result.settlementAuthorized, false, 'settlementAuthorized')
  requireLiteral(permissions.furtherRender, false, 'permissions.furtherRender')
  requireLiteral(permissions.publicDelivery, false, 'permissions.publicDelivery')
  requireLiteral(runtime.productReady, false, 'runtime.productReady')
  requireLiteral(runtime.externalBetaReady, false, 'runtime.externalBetaReady')
  requireLiteral(runtime.productionReady, false, 'runtime.productionReady')
  return {
    privateTestDependencySatisfied: true,
    liveRuntimeDependencySatisfied: false,
    finalRenderAuthorized: false,
  }
}

async function readPersistedResponse(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response is invalid.', 409)
  }
  const record = value as Partial<PersistedAdapterResponse>
  if (record.schemaVersion !== 'canonical-private-job-execution-adapter-idempotency-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused for a different canonical job.', 409)
  }
  const response = canonicalPrivateJobExecutionAdapterResponseSchema.safeParse(record.response)
  if (!response.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response failed validation.', 409)
  }
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response hash is invalid.', 409)
  }
  return response.data
}

async function readPersistedCompletion(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion is invalid.', 409)
  }
  const record = value as Partial<PersistedAdapterCompletion>
  if (record.schemaVersion !== 'canonical-private-job-execution-adapter-completion-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion scope is invalid.', 409)
  }
  const response = canonicalPrivateJobExecutionAdapterResponseSchema.safeParse(record.response)
  if (!response.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion failed validation.', 409)
  }
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion hash is invalid.', 409)
  }
  return response.data
}

async function persistIdempotencyResponse(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  response: CanonicalPrivateJobExecutionAdapterResponse,
): Promise<void> {
  const persisted: PersistedAdapterResponse = {
    schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1',
    requestHash,
    response,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
    content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
  })
}

function adapterResponseRelativePath(ownerUserId: string, workspaceId: string, idempotencyKey: string): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${workspaceId}`)
  const keyHash = sha256(`${scopeHash}\u0000${idempotencyKey}`)
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/${keyHash}.json`
}

function adapterCompletionRelativePath(
  ownerUserId: string,
  body: ExecuteCanonicalPrivateJobAdapterBody,
  jobId: string,
): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${body.workspaceId}`)
  const jobHash = sha256([
    scopeHash,
    body.projectId,
    body.editSessionId,
    jobId,
  ].join('\u0000'))
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/completed-jobs/${jobHash}.json`
}

async function withAdapterExecutionLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = adapterExecutionLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  adapterExecutionLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (adapterExecutionLocks.get(key) === tail) adapterExecutionLocks.delete(key)
  }
}

function asCoordinatorResponse(value: unknown): CoordinatorResponse {
  if (
    !value || typeof value !== 'object' ||
    !('result' in value) || !value.result || typeof value.result !== 'object' ||
    !('completedAt' in value) || typeof value.completedAt !== 'string'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical runner returned an invalid adapter response.', 409)
  }
  return value as CoordinatorResponse
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (
    !normalized || normalized.length < 8 || normalized.length > 240 ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.', 400)
  }
  return normalized
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result is missing ${field}.`, 409)
  }
  return value
}

function requireSha256(value: unknown, field: string): string {
  const result = requireString(value, field)
  if (!/^[a-f0-9]{64}$/.test(result)) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return result
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return value
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return value as Record<string, unknown>
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, field: string): T {
  if (value !== expected) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return expected
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
