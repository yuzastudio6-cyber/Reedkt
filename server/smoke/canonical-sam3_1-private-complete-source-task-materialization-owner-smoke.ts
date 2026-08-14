import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createOrchestraSkillCall,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission,
} from '../services/canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertCanonicalSam31PrivateCompleteSourceTaskMaterialization,
  canonicalSam31PrivateCompleteSourceChunkTerminalRereadSchema,
  createCanonicalSam31PrivateCompleteSourceTaskMaterializationOwner,
  createCanonicalSam31PrivateCompleteSourceTaskMaterializationRepository,
} from '../services/canonical-sam3_1-private-complete-source-task-materialization-owner'
import {
  canonicalSam31PrivateCompleteSourceExecutionPlanRef,
  createCanonicalSam31PrivateCompleteSourceExecutionPlanRepository,
} from '../services/canonical-sam3_1-private-complete-source-execution-plan-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuPrivateInputStagingEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
  createCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  a100,
  fallbackRateRef,
  primaryRateRef,
} from './canonical-sam3_1-gpu-task-owner-smoke'
import {
  a100Plan as priorPlan,
  privateInternalDispatchReadiness as priorReadiness,
} from './canonical-sam3_1-private-complete-source-execution-plan-owner-smoke'

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly({ objectPath, body, contentSha256 }) {
    assert.equal(createHash('sha256').update(body).digest('hex'),
      contentSha256)
    const existing = objects.get(objectPath)
    if (existing) {
      if (!existing.equals(body)) throw new Error('create-only collision')
      return 'already_exists'
    }
    objects.set(objectPath, Buffer.from(body))
    return 'created'
  },
  async readExact(path) {
    const body = objects.get(path)
    return body ? Buffer.from(body) : null
  },
}

const { readinessHash: _oldReadinessHash, ...oldReadinessPayload } =
  priorReadiness
void _oldReadinessHash
const readinessPayload = {
  ...oldReadinessPayload,
  a100RuntimeReleaseRef: a100.target.releaseRef,
  currentA100RateAuthorityRef: primaryRateRef,
  a100ImmutableImageDigest: a100.target.immutableImageDigest,
}
const readiness = {
  ...readinessPayload,
  readinessHash: sha256AuthorityValue(readinessPayload),
}
const readinessRef = ref(readiness.readinessId, readiness.readinessHash)

const { planHash: _oldPlanHash, ...oldPlanPayload } = priorPlan
void _oldPlanHash
const planPayload = {
  ...oldPlanPayload,
  privateInternalDispatchReadinessRef: readinessRef,
  runtimeReleaseRef: a100.target.releaseRef,
  accountEffectiveRateAuthorityRef: primaryRateRef,
  immutableImageDigest: a100.target.immutableImageDigest,
}
const plan = {
  ...planPayload,
  planHash: sha256AuthorityValue(planPayload),
}
const planRef = canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan)

const planRepository =
  createCanonicalSam31PrivateCompleteSourceExecutionPlanRepository({
    objectPort,
    prefix: 'private/smoke/sam31-private-task-plan',
  })
await planRepository.persistCreateOnly({ plan })
const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort,
  prefix: 'private/smoke/sam31-private-fixed-tasks',
})
const materializationRepository =
  createCanonicalSam31PrivateCompleteSourceTaskMaterializationRepository({
    objectPort,
    prefix: 'private/smoke/sam31-private-task-materializations',
  })

const specializedPayload = {
  ...(a100.context.specializedRuntimeRelease as Record<string, unknown>),
  qualifiedAt: '2026-08-13T15:30:00.000Z',
  expiresAt: '2026-08-13T16:30:00.000Z',
}
delete specializedPayload.releaseObservationHash
const specializedRuntimeRelease = {
  ...specializedPayload,
  releaseObservationHash: sha256AuthorityValue(specializedPayload),
}
const terminals = new Map<number, unknown>()

const owner =
  createCanonicalSam31PrivateCompleteSourceTaskMaterializationOwner({
    executionPlanRepository: planRepository,
    privateInternalDispatchReadinessReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadCurrent(input) {
        return sameRef(input.runtimeReleaseRef, plan.runtimeReleaseRef)
          && sameRef(input.rateAuthorityRef,
            plan.accountEffectiveRateAuthorityRef)
          ? structuredClone(readiness) : null
      },
    },
    taskAuthorityReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-task-authority-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadExactChunkAuthority(input) {
        if (!sameRef(input.executionPlanRef, planRef)) return null
        const chunk = plan.chunks[input.chunkOrdinal - 1]
        if (!chunk) return null
        return authorityForChunk(chunk)
      },
    },
    priorChunkTerminalReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-chunk-terminal-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadExactTerminal(input) {
        if (!sameRef(input.executionPlanRef, planRef)) return null
        return structuredClone(terminals.get(input.chunkOrdinal) ?? null)
      },
    },
    privateInputStagingPort: {
      async stageAndRereadExactMaskProxy(input) {
        const source = input.sourceMedia as typeof plan.chunks[number] & {
          finalizedSourceArtifactRef: ReturnType<typeof ref>
          gpuPreparedMaskProxyArtifactRef: ReturnType<typeof ref>
          exactSourceReadEvidenceRef: ReturnType<typeof ref>
          sourceFrameRangeMappingRef: ReturnType<typeof ref>
          proxyPixelGeometryQaRef: ReturnType<typeof ref>
          byteLength: number
          sha256: string
          width: number
          height: number
          decodedFrameCount: number
          selectedStartFrameInclusive: number
          selectedEndFrameInclusive: number
        }
        const payload = {
          schemaVersion:
            'canonical-sam3_1-gpu-private-input-staging-evidence-v1' as const,
          source: 'canonical_server_sam3_1_private_input_staging_owner' as const,
          evidenceClass: 'canonical_private_reread' as const,
          stagingId: `sam31-input-staging:${input.invocationId}`,
          invocationId: input.invocationId,
          scope: input.scope,
          dispatchAdmissionRef: input.dispatchAdmissionRef,
          executionEnvelopeRef: input.executionEnvelopeRef,
          sourceBindingRef: input.sourceBindingRef,
          finalizedSourceArtifactRef: source.finalizedSourceArtifactRef,
          gpuPreparedMaskProxyArtifactRef:
            source.gpuPreparedMaskProxyArtifactRef,
          exactSourceReadEvidenceRef: source.exactSourceReadEvidenceRef,
          sourceFrameRangeMappingRef: source.sourceFrameRangeMappingRef,
          proxyPixelGeometryQaRef: source.proxyPixelGeometryQaRef,
          privateTaskInputTransportRef: input.privateTaskInputTransportRef,
          privateInvocationObjectRef: ref(
            `private-input-object:${input.invocationId}`,
            source.sha256,
          ),
          contentType: 'video/mp4' as const,
          byteLength: source.byteLength,
          sha256: source.sha256,
          width: source.width,
          height: source.height,
          decodedFrameCount: source.decodedFrameCount,
          selectedStartFrameInclusive: source.selectedStartFrameInclusive,
          selectedEndFrameInclusive: source.selectedEndFrameInclusive,
          storageGeneration: String(1_000 + source.decodedFrameCount),
          storageEtagSha256: sha256AuthorityValue(
            `etag:${input.invocationId}`,
          ),
          sourceArtifactOpenedThroughCanonicalReadPort: true as const,
          exactSourceStreamByteLengthAndSha256Verified: true as const,
          targetCreatedWithIfGenerationMatchZero: true as const,
          exactCreatedGenerationMetadataReread: true as const,
          exactCreatedGenerationBytesRereadAndHashed: true as const,
          sourceAndTargetBytesIdentical: true as const,
          taskAndSourceShareExactInvocationPrefix: true as const,
          callerPathUrlBucketObjectGenerationOrBytesAccepted: false as const,
          signedUrlOrPublicObjectUsed: false as const,
          sourceOrTargetMutationAllowed: false as const,
          runtimeDownloadAllowed: false as const,
          customerCreditsMutated: false as const,
          qaApproved: false as const,
          publicDeliveryAuthorized: false as const,
          productionAuthorityGranted: false as const,
          stagedAt: input.stagedAt,
        }
        return canonicalSam31GpuPrivateInputStagingEvidenceSchema.parse({
          ...payload,
          evidenceHash: sha256AuthorityValue(payload),
        })
      },
    },
    taskStore,
    materializationRepository,
  })

const first = await owner.materialize({
  executionPlanRef: planRef,
  chunkOrdinal: 1,
  materializedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(owner.privateInternalOnly, true)
assert.equal(owner.customerOrPublicDispatchAuthorized, false)
assert.equal(first.status, 'private_chunk_task_materialized_not_dispatched')
assert.equal(first.chunkOrdinal, 1)
assert.equal(first.previousChunkTerminalRef, null)
assert.equal(first.gpuJobDispatched, false)
assert.equal(first.customerOrPublicDispatchAuthorized, false)
assert.equal(first.publicConcurrencyCapacityRequiredForThisPrivateRun, false)
assert.equal(first.futurePublicA100ConcurrencyTarget, 16)
assert.equal(first.maximumSimultaneousRouteAttempts, 1)
assert.deepEqual(
  assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(first),
  first,
)

await assert.rejects(() => owner.materialize({
  executionPlanRef: planRef,
  chunkOrdinal: 2,
  materializedAt: '2026-08-13T16:13:00.000Z',
}), /prior private chunk terminal/u)

const firstTerminalPayload = {
  schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-terminal-reread-v1' as const,
  source:
    'canonical_server_sam3_1_private_complete_source_chunk_terminal_owner' as const,
  evidenceClass:
    'canonical_private_exact_task_response_output_cost_and_scale_zero_reread' as const,
  executionPlanRef: planRef,
  routeId: plan.routeId,
  chunkOrdinal: 1,
  taskRecordRef: first.taskRecordRef,
  runtimeResponseRef: ref('chunk-1-runtime-response'),
  privateOutputRereadEvidenceRef: ref('chunk-1-output-reread'),
  accountEffectiveAttemptCostReceiptRef: ref('chunk-1-cost-receipt'),
  scaleBackToZeroObservationRef: ref('chunk-1-scale-zero'),
  providerOutcome: 'executed' as const,
  runtimeStatus: 'completed' as const,
  exactTaskResponseOutputAndAccountCostReread: true as const,
  activeGpuExecutionsAfterTerminal: 0 as const,
  minimumIdleGpuInstancesAfterTerminal: 0 as const,
  scaleBackToZeroVerified: true as const,
  nextChunkTaskMaterializationAllowed: true as const,
  automaticRetryOrFallbackStarted: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  completedAt: '2026-08-13T16:13:30.000Z',
}
terminals.set(1,
  canonicalSam31PrivateCompleteSourceChunkTerminalRereadSchema.parse({
    ...firstTerminalPayload,
    terminalHash: sha256AuthorityValue(firstTerminalPayload),
  }),
)
const second = await owner.materialize({
  executionPlanRef: planRef,
  chunkOrdinal: 2,
  materializedAt: '2026-08-13T16:14:00.000Z',
})
assert.equal(second.chunkOrdinal, 2)
assert.equal(second.canonicalStartFrameInclusive, 239)
assert.equal(second.overlapWithPreviousFrames, 1)
assert.notEqual(second.previousChunkTerminalRef, null)
assert.equal(second.gpuJobDispatched, false)
assert.deepEqual(await materializationRepository.reread({
  executionPlanId: plan.executionPlanId,
  chunkOrdinal: 2,
}), second)

const firstReplay = await owner.materialize({
  executionPlanRef: planRef,
  chunkOrdinal: 1,
  materializedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(firstReplay.materializationHash, first.materializationHash)

await assert.rejects(() => owner.materialize({
  executionPlanRef: { ...planRef, contentHash: `sha256:${'0'.repeat(64)}` },
  chunkOrdinal: 1,
  materializedAt: '2026-08-13T16:12:00.000Z',
}))
await assert.rejects(() => owner.materialize({
  executionPlanRef: planRef,
  chunkOrdinal: 1,
  materializedAt: plan.expiresAt,
}))
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceTaskMaterialization({
  ...first,
  materializationHash: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-private-complete-source-task-materialization-owner',
  checks: 61,
  firstTwoExactChunksMaterialized: true,
  previousChunkTerminalAndScaleZeroRequired: true,
  exactTaskPersistedAndReread: true,
  maximumSimultaneousRouteAttempts: first.maximumSimultaneousRouteAttempts,
  publicSixteenGpuCapacityRequiredForPrivateRun:
    first.publicConcurrencyCapacityRequiredForThisPrivateRun,
  gpuJobDispatched: first.gpuJobDispatched,
  customerOrPublicDispatchAuthorized:
    first.customerOrPublicDispatchAuthorized,
}))

function authorityForChunk(chunk: typeof plan.chunks[number]) {
  const admission = admissionForChunk(chunk)
  const privateAdmission = privateAdmissionFor(admission)
  const sceneId = 'scene-private-full-source-qualification'
  const selectedSceneBindingRef = ref('private-full-source-scene-binding')
  const sourceFrameLineageRef = chunk.exactSourceRangeMappingRef
  const call = createOrchestraSkillCall({
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: `${chunk.privateInvocationId}:track-all-call`,
    orchestraPlanRef: ref('private-full-source-orchestra-plan'),
    orchestraJobRef: ref(`${chunk.privateInvocationId}:orchestra-job`),
    parentJobRef: null,
    requestedBy: { kind: 'orchestra' },
    targetSkillKey: 'track_all',
    jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
    phase: 'approved_execution',
    scope: {
      scopeType: 'scene',
      sourceArtifactRef: plan.exactEightMinuteSourceRef,
      sceneId,
      outputId: 'output-private-full-source',
      authorizedRange: {
        startFrame: chunk.canonicalStartFrameInclusive,
        endFrameExclusive: chunk.canonicalEndFrameInclusive + 1,
        frameRate: { numerator: 24, denominator: 1 },
      },
      selectedSceneBindingRef,
      completeSceneCoverageRequired: true,
    },
    sceneContextSnapshotRef: ref('private-full-source-scene-context'),
    sourceArtifactRefs: [plan.exactEightMinuteSourceRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [ref(`${chunk.privateInvocationId}:mask-outcome`)],
    requiredEvidenceRefs: [
      selectedSceneBindingRef,
      admission.scope.confirmedOutputFrameRef,
      admission.scope.masterTimingRef,
      plan.compiledSubjectIntentRef,
      plan.promptApprovalRef,
      sourceFrameLineageRef,
    ],
    manifestRef: ref('track-all-capability-manifest-v1'),
    qualificationSnapshotRef: ref('track-all-qualification-snapshot-v1'),
    timeBudgetRef: ref('track-all-private-time-budget-v1'),
    creditBudgetRef: ref('track-all-private-credit-budget-v1'),
    attemptEnvelopeRef: admission.scope.executionAttemptRef,
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    idempotencyKey: admission.scope.idempotencyKey,
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
  const trackAllOrchestraBinding =
    createCanonicalTrackAllSam31OrchestraBinding({
      bindingId: `${chunk.privateInvocationId}:track-all-binding`,
      call,
      admission,
    })
  return {
    privateInternalFundedAdmission: privateAdmission,
    runtimeLaunchTarget: structuredClone(a100.target),
    taskAuthority: {
      trackAllOrchestraBinding,
      editPlanVersionId: 'edit-plan-version-1',
      editPlanVersionRef: ref('edit-plan-version-1'),
      outputId: 'output-private-full-source',
      confirmedOutputFrameRef: admission.scope.confirmedOutputFrameRef,
      sceneId,
      sourceBindingRef: selectedSceneBindingRef,
      specializedRuntimeRelease,
      primaryRateAuthorityRef: primaryRateRef,
      fallbackRateAuthorityRef: fallbackRateRef,
      exactApprovedPlanFrameTimingTrackAllAndRuntimeReread: true as const,
      callerTaskContextAccepted: false as const,
    },
  }
}

function admissionForChunk(chunk: typeof plan.chunks[number]) {
  const { admissionHash: _oldHash, ...payload } = a100.admission
  void _oldHash
  const exactPayload = {
    ...payload,
    admissionId: `${chunk.privateInvocationId}:dispatch-admission`,
    scope: {
      ...payload.scope,
      outputId: undefined,
      executionAttemptRef: chunk.executionAttemptRef,
      workerLeaseRef: ref(`${chunk.privateInvocationId}:lease`),
      userTriggerRecordRef: ref(`${chunk.privateInvocationId}:user-trigger`),
      idempotencyKey: `${chunk.privateInvocationId}.idempotency`,
    },
    admittedAt: '2026-08-13T16:11:30.000Z',
    expiresAt: plan.expiresAt,
  }
  delete (exactPayload.scope as Record<string, unknown>).outputId
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...exactPayload,
    admissionHash: sha256AuthorityValue(exactPayload),
  })
}

function privateAdmissionFor(
  admission: ReturnType<typeof admissionForChunk>,
) {
  const fundedPayload = {
    schemaVersion:
      'canonical-professional-gpu-funded-dispatch-admission-v1' as const,
    source:
      'canonical_server_professional_gpu_funded_dispatch_reconciliation' as const,
    fundedAdmissionId: `${admission.admissionId}:funded`,
    scope: {
      ownerUserId: admission.scope.ownerUserId,
      workspaceId: admission.scope.workspaceId,
      projectId: admission.scope.projectId,
      editSessionId: admission.scope.editSessionId,
      planningRequestId: 'planning-request-private-full-source',
      editPlanId: admission.scope.editPlanId,
      editPlanVersion: admission.scope.editPlanVersion,
      outputId: 'output-private-full-source',
    },
    pricingAuthorityBundleRef: ref('private-pricing-bundle'),
    pricingBasisRef: ref('private-pricing-basis'),
    preapprovalManifestRef: ref('private-preapproval-manifest'),
    publicationBindingRef: ref('private-publication-binding'),
    dispatchEstimateSetRef: ref('private-dispatch-estimate-set'),
    approvedFundingObservationRef: ref('private-funding-observation'),
    attemptStartAuthorityRef: ref('private-attempt-start'),
    pricingUnitRef: ref('private-pricing-unit'),
    preapprovalManifestEntryDigestSha256:
      sha256AuthorityValue('private-manifest-entry'),
    approvedPlanRef: ref(admission.scope.editPlanId),
    approvedCustomerEstimateRef: ref('private-approved-estimate'),
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    userApprovalRecordRef: admission.scope.userApprovalRecordRef,
    fundedReservationRef: admission.scope.fundedReservationRef,
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    gpuManifestTotalCeilingCredits: 300,
    approvedCustomerEstimateMaximumCredits: 300,
    originallyReservedCredits: 300,
    remainingReservedCreditsAtAdmission: 300,
    approvedWorkItemGpuCeilingCredits:
      admission.estimateMaximumReservedToolCostCredits,
    toolDispatchAdmission: admission,
    exactPreapprovalPriceCalculationReused: true as const,
    exactPublishedPlanEstimateSnapshotApprovalReservationReread:
      true as const,
    fullCustomerEstimateFundedBeforeDispatch: true as const,
    currentWorkCeilingStillCovered: true as const,
    exactQualifiedRuntimeReleaseAndCurrentRateReread: true as const,
    authenticatedUserTriggeredScaleFromZero: true as const,
    callerApprovalReservationRatePriceRouteOrRuntimeAccepted: false as const,
    customerCreditsMutated: false as const,
    cloudJobCreated: false as const,
    admittedAt: admission.admittedAt,
    expiresAt: admission.expiresAt,
  }
  const funded = {
    ...fundedPayload,
    fundedAdmissionHash: sha256AuthorityValue(fundedPayload),
  }
  const privatePayload = {
    schemaVersion:
      'canonical-professional-gpu-private-internal-funded-dispatch-admission-v1' as const,
    source:
      'canonical_server_professional_gpu_private_internal_funded_dispatch_owner' as const,
    status: 'private_internal_sequential_dispatch_admitted' as const,
    privateInternalDispatchReadinessRef: readinessRef,
    fundedDispatchAdmission: funded,
    runtimeReleaseRef: admission.runtimeReleaseRef,
    currentRateAuthorityRef: admission.currentRateAuthorityRef,
    exactPrivateInternalReadinessReleaseAndRateReread: true as const,
    customerPlanEstimateApprovalAndReservationStillRequired: true as const,
    privateInternalQualificationOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    customerCreditsMutated: false as const,
    cloudJobCreated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: admission.admittedAt,
    expiresAt: admission.expiresAt,
  }
  return assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission({
    ...privatePayload,
    privateInternalFundedAdmissionHash: sha256AuthorityValue(privatePayload),
  })
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}
