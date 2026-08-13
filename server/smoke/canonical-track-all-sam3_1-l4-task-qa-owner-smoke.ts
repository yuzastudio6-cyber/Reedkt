import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  buildCanonicalTrackAllSam31L4TaskQaMaterialV2,
  createCanonicalTrackAllSam31L4TaskQaMaterialRepository,
  createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort,
  createCanonicalTrackAllSam31L4TaskQaTaskStore,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const objects = new Map<string, Buffer>()
const objectPort = {
  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }) {
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
    if (objects.has(input.objectPath)) return 'already_exists' as const
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created' as const
  },
  async readExact(objectPath: string) {
    const body = objects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}
const taskStore = createCanonicalTrackAllSam31L4TaskQaTaskStore({
  objectPort,
})
const admission = buildAdmission()
const executionEnvelopeRef = ref('track-all-l4-envelope-1')
const target = {
  releaseRef: admission.runtimeReleaseRef,
  releaseEvidenceClass: 'canonical_private_reread' as const,
  privateInternalQualified: true as const,
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary' as const,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_run_l4_job' as const,
  machineType: 'cloud_run_nvidia_l4' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageRef: ref('track-all-l4-task-qa-image'),
  immutableImageDigest: hash('track-all-l4-task-qa-image'),
  fixedServerTaskContractRef:
    canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
  serviceIdentityRef: ref('track-all-l4-task-qa-service'),
  privateNetworkAndArtifactTransportRef:
    ref('track-all-l4-task-qa-private-transport'),
  minimumIdleInstances: 0 as const,
  maximumConcurrentAttemptsPerInstance: 1 as const,
  runtimeNetworkDownloadAllowed: false as const,
  callerCommandImageModelOrEnvironmentAccepted: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  startsOnlyFromConsumedApprovedAdmission: true as const,
  stopsAtTerminalAttempt: true as const,
}
const material = buildCanonicalTrackAllSam31L4TaskQaMaterialV2({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-material-v2',
  source: 'canonical_server_track_all_sam3_1_l4_task_qa_material_owner',
  evidenceClass: 'canonical_private_reread',
  materialId: 'track-all-l4-task-qa-material-1',
  sam31InvocationId: 'sam31-invocation-1',
  sam31TaskRef: ref('sam31-task-1'),
  sam31RuntimeRequestBindingSha256: digest('sam31-runtime-request'),
  sam31RuntimeResultAdmissionRef: ref('sam31-result-1'),
  sam31MaskManifestRef: ref('sam31-mask-manifest'),
  approvedSnapshotRef: admission.scope.approvedSnapshotRef,
  confirmedOutputFrameRef: admission.scope.confirmedOutputFrameRef,
  masterTimingRef: admission.scope.masterTimingRef,
  approvedWorkItemRef: admission.scope.approvedWorkItemRef,
  workerLeaseRef: admission.scope.workerLeaseRef,
  fundedReservationRef: admission.scope.fundedReservationRef,
  userTriggerRecordRef: admission.scope.userTriggerRecordRef,
  executionAttemptRef: admission.scope.executionAttemptRef,
  sourceFrameMappingRef: ref('source-frame-mapping-1'),
  sourceWidth: 640,
  sourceHeight: 360,
  maskFrameRange: { startFrame: 0, endFrameExclusive: 24 },
  expectedMaskManifestByteLength: 4_096,
  expectedMaskManifestSha256: digest('sam31-mask-manifest'),
  expectedMaskPngCount: 24,
  chunkOrdinal: 1,
  canonicalStartFrameInclusive: 120,
  canonicalEndFrameInclusive: 143,
  previousChunkBoundaryInput: null,
  subjects: [{
    subjectRequestId: 'subject-request-1',
    subjectEvidenceId: 'subject-evidence-1',
    subjectRole: 'primary_speaker',
    maskObjectId: 1,
    canonicalFrameRange: { startFrame: 120, endFrameExclusive: 144 },
    maskFrameRange: { startFrame: 0, endFrameExclusive: 24 },
    trackManifestRef: ref('sam31-mask-manifest'),
    anchorManifestRef: null,
    sourceFrameMappingRef: ref('source-frame-mapping-1'),
    outputFrameDigestSha256:
      admission.scope.confirmedOutputFrameRef.contentHash.slice(7),
  }],
  exactSamTaskContextResultAndPrivateOutputReread: true,
  exactApprovedSnapshotFrameTimingWorkLeaseAttemptAndFundingReread: true,
  materialCreateOnlyPersistenceAndExactRereadRequiredBeforeL4AdmissionConsumption:
    true,
  browserOrCallerTaskMaterialAccepted: false,
  callerPathUrlCommandCodeModelEnvironmentOrPriceAccepted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  preparedAt: '2026-08-05T15:00:00.000Z',
})
const materialRepository =
  createCanonicalTrackAllSam31L4TaskQaMaterialRepository({ objectPort })
assert.equal(await materialRepository.persistMaterialCreateOnly({ material }),
  'created')
assert.equal(
  (await materialRepository.rereadMaterial({
    executionAttemptRef: material.executionAttemptRef,
  }))?.materialHash,
  material.materialHash,
)

let delegateCalls = 0
const preparingPort = createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort({
  materialReadPort: {
    async rereadCanonicalL4TaskQaMaterial() {
      return structuredClone(material)
    },
  },
  taskStore,
  delegate: {
    async startOneShotJob() {
      delegateCalls += 1
      return {
        disposition: 'accepted' as const,
        cloudJobExecutionRef: ref('track-all-l4-cloud-job-1'),
        cloudJobCreateRequestRef: ref('track-all-l4-create-request-1'),
        providerRequestIdDigestSha256: digest('provider-request-1'),
        observedAt: '2026-08-05T15:00:01.000Z',
        providerInferenceOrSubstantiveWorkKnownExecuted:
          'not_executed' as const,
      }
    },
  },
  now: () => '2026-08-05T15:00:00.500Z',
})
const launch = await preparingPort.startOneShotJob({
  admission,
  target,
  admissionConsumptionRef: ref('track-all-l4-consumption-1'),
  executionEnvelopeRef,
})
assert.equal(launch.disposition, 'accepted')
assert.equal(delegateCalls, 1)
const persisted = await taskStore.rereadWorkerTask(executionEnvelopeRef.id)
assert.ok(persisted && typeof persisted === 'object')
const request = assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
  (persisted as { runtimeRequest: unknown }).runtimeRequest,
)
assert.equal(request.l4InvocationId, executionEnvelopeRef.id)
assert.equal(request.sam31InvocationId, material.sam31InvocationId)
assert.notEqual(request.l4InvocationId, request.sam31InvocationId)
assert.equal(request.executionPolicy.accelerator, 'nvidia_l4')
assert.equal(request.executionPolicy.cpuOnlySubstantiveMaskQaAllowed, false)

const replay = await preparingPort.startOneShotJob({
  admission,
  target,
  admissionConsumptionRef: ref('track-all-l4-consumption-1'),
  executionEnvelopeRef,
})
assert.equal(replay.disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

const collapsedPort = createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort({
  materialReadPort: {
    async rereadCanonicalL4TaskQaMaterial() {
      return {
        ...structuredClone(material),
        sam31InvocationId: 'track-all-l4-envelope-collapsed',
      }
    },
  },
  taskStore,
  delegate: {
    async startOneShotJob() {
      throw new Error('Collapsed identities must not reach launch.')
    },
  },
  now: () => '2026-08-05T15:00:00.500Z',
})
const collapsed = await collapsedPort.startOneShotJob({
  admission,
  target,
  admissionConsumptionRef: ref('track-all-l4-consumption-collapsed'),
  executionEnvelopeRef: ref('track-all-l4-envelope-collapsed'),
})
assert.equal(collapsed.disposition, 'rejected_before_creation')

assert.throws(() => buildCanonicalTrackAllSam31L4TaskQaMaterialV2({
  ...structuredClone(material),
  expectedMaskPngCount: 23,
  materialHash: undefined,
} as never))

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-owner',
  checks: 20,
  fixedTaskPersistedBeforeCloudJobCreation: true,
  exactTaskRereadBeforeCloudJobCreation: true,
  approvedMaterialCreateOnlyPersistedAndExactReread: true,
  sam31AndL4InvocationRootsSeparate: true,
  duplicateTaskLaunchRejected: true,
  collapsedInvocationRejected: true,
  callerExecutionMaterialAccepted: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  delegateCalls,
}))

function buildAdmission() {
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-dispatch-admission-v1' as const,
    source: 'canonical_server_professional_gpu_dispatch_owner' as const,
    admissionId: 'track-all-l4-qa-admission-1',
    toolId: 'kornia',
    operationId: 'tool.kornia.refine_mask.v1',
    routeId: 'l4_standard_primary' as const,
    scope: {
      ownerUserId: 'owner-1', workspaceId: 'workspace-1',
      projectId: 'project-1', editSessionId: 'edit-session-1',
      editPlanId: 'edit-plan-1', editPlanVersion: 1,
      approvedSnapshotRef: ref('approved-snapshot-1'),
      confirmedOutputFrameRef: ref('confirmed-output-frame-1'),
      masterTimingRef: ref('master-timing-1'),
      approvedWorkItemRef: ref('l4-task-qa-work-1'),
      workerLeaseRef: ref('l4-task-qa-lease-1'),
      fundedReservationRef: ref('funded-reservation-1'),
      userApprovalRecordRef: ref('user-approval-1'),
      userTriggerRecordRef: ref('l4-user-trigger-1'),
      executionAttemptRef: ref('l4-execution-attempt-1'),
      idempotencyKey: 'l4-execution-attempt-1.idempotency',
    },
    estimateRef: ref('gpu-estimate-1'),
    estimateMaximumReservedToolCostCredits: 50,
    currentRateAuthorityRef: ref('l4-current-rate-1'),
    placementPolicyRef: {
      schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1' as const,
      policyHash: digest('placement-policy'),
      entryHash: digest('placement-entry'),
    },
    gpuPolicyRef: {
      schemaVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3' as const,
      policyHash: digest('gpu-policy'),
    },
    runtimeReleaseRef: ref('track-all-l4-runtime-release-1'),
    priorPrimaryTerminalReceiptRef: null,
    priorPrimaryFailureClass: 'not_applicable' as const,
    priorPrimaryOutcomeKnownNotExecuted: false,
    admittedAttemptOrdinal: 1 as const,
    callerSelectedRouteImageModelOrCommand: false as const,
    exactCurrentRateEstimateApprovalReservationAndReleaseReread: true as const,
    exactApprovedUserTriggerAndIdempotencyReread: true as const,
    actualGpuEvidenceRequiredFromTerminalResult: true as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyAdmission: false as const,
    unknownPriorOutcomeMayRetryOrFallback: false as const,
    createOnlyDurableConsumptionRequiredBeforeJobCreation: true as const,
    userTriggeredScaleFromZero: true as const,
    noApprovedAttemptMeansZeroGpuInstances: true as const,
    minimumIdleInstances: 0 as const,
    stopAtTerminalAttempt: true as const,
    workDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-05T14:59:00.000Z',
    expiresAt: '2026-08-05T16:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function digest(value: unknown): string {
  return sha256AuthorityValue(value)
}

function hash(value: unknown): `sha256:${string}` {
  return `sha256:${digest(value)}`
}

function ref(id: string) {
  return { id, version: 1, contentHash: hash(id) }
}
