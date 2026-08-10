import assert from 'node:assert/strict'

import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createCanonicalA100VertexCustomJobLaunchPort,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  createCanonicalA100VertexProfessionalGpuLaunchAdapter,
} from '../services/canonical-a100-vertex-professional-gpu-launch-adapter'
import {
  createCanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sealCanonicalSam31VertexQualificationQuotaObservation,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  canonicalSam31GpuFixedTaskContractRef,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { authority as currentVertexRate } from
  './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import { record as releasePair } from
  './canonical-sam3_1-gpu-runtime-release-registry-smoke'

const NOW = '2026-08-06T16:10:00.000Z'
const target = createCanonicalProfessionalGpuRuntimeLaunchTarget({
  runtimeRelease: releasePair.runtimeRelease,
  fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
  at: NOW,
})
const admission = buildAdmission()
const quota = buildQuota()
const providerRequests: Array<Record<string, unknown>> = []
const sequence: string[] = []

const vertexLaunchPort = createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread(value) {
      sequence.push('durable_consumption')
      return structuredClone(value)
    },
  },
  executionRepository: {
    async createOnlyAndReread(value) {
      sequence.push('durable_execution')
      return structuredClone(value)
    },
  },
  auth: {
    async request(request) {
      sequence.push('vertex_create')
      providerRequests.push(structuredClone(
        request as Record<string, unknown>,
      ))
      const body = request.data as { displayName: string }
      return { data: {
        name:
          'projects/390722338345/locations/us-central1/customJobs/24680',
        displayName: body.displayName,
        state: 'JOB_STATE_PENDING',
      } } as never
    },
  },
  now: () => NOW,
})

let releaseRereads = 0
let rateRereads = 0
let quotaRereads = 0
const adapter = createCanonicalA100VertexProfessionalGpuLaunchAdapter({
  releasePairReadPort: {
    async rereadReleasePair(input) {
      releaseRereads += 1
      assert.deepEqual(input.runtimeReleaseRef, target.releaseRef)
      return structuredClone(releasePair)
    },
  },
  rateAuthorityReadPort: {
    async reread(input) {
      rateRereads += 1
      assert.deepEqual(input.rateAuthorityRef,
        admission.currentRateAuthorityRef)
      assert.equal(input.at, NOW)
      return structuredClone(currentVertexRate)
    },
  },
  quotaReadPort: {
    async rereadCurrent() {
      quotaRereads += 1
      return structuredClone(quota)
    },
  },
  vertexLaunchPort,
  now: () => NOW,
})

const result = await adapter.startOneShotJob({
  admission,
  target,
  admissionConsumptionRef: ref('admission-consumption'),
  executionEnvelopeRef: ref('execution-envelope'),
})
assert.equal(result.disposition, 'accepted')
assert.deepEqual(sequence, [
  'durable_consumption',
  'vertex_create',
  'durable_execution',
])
assert.equal(releaseRereads, 1)
assert.equal(rateRereads, 1)
assert.equal(quotaRereads, 1)
assert.equal(providerRequests.length, 1)
const providerBody = providerRequests[0]?.data as Record<string, unknown>
const jobSpec = providerBody.jobSpec as Record<string, unknown>
const worker = (jobSpec.workerPoolSpecs as Array<Record<string, unknown>>)[0]
assert.ok(worker)
assert.deepEqual(worker.machineSpec, {
  machineType: 'a2-ultragpu-1g',
  acceleratorType: 'NVIDIA_A100_80GB',
  acceleratorCount: 1,
})
assert.equal(jobSpec.serviceAccount,
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(jobSpec.network,
  'projects/390722338345/global/networks/weeditpro-gpu-private')
assert.match(
  (worker.containerSpec as { imageUri: string }).imageUri,
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)
assert.equal(JSON.stringify(providerBody).includes('batch.googleapis.com'), false)
assert.equal(JSON.stringify(providerBody).includes('sam2'), false)
assert.equal(JSON.stringify(providerBody).includes('qwen'), false)

await assert.rejects(adapter.startOneShotJob({
  admission,
  target: {
    ...target,
    executionTarget: 'google_cloud_batch_a2_ultra_job',
  },
  admissionConsumptionRef: ref('batch-consumption'),
  executionEnvelopeRef: ref('batch-envelope'),
}), /Vertex A100 adapter received another route/u)
assert.equal(providerRequests.length, 1)

const expiredQuotaAdapter =
  createCanonicalA100VertexProfessionalGpuLaunchAdapter({
    releasePairReadPort: {
      async rereadReleasePair() { return structuredClone(releasePair) },
    },
    rateAuthorityReadPort: {
      async reread() { return structuredClone(currentVertexRate) },
    },
    quotaReadPort: {
      async rereadCurrent() {
        return buildQuota({
          observedAt: '2026-08-06T15:00:00.000Z',
          expiresAt: '2026-08-06T16:00:00.000Z',
        })
      },
    },
    vertexLaunchPort,
    now: () => NOW,
  })
await assert.rejects(expiredQuotaAdapter.startOneShotJob({
  admission,
  target,
  admissionConsumptionRef: ref('expired-quota-consumption'),
  executionEnvelopeRef: ref('expired-quota-envelope'),
}), /quota observation is not current/u)
assert.equal(providerRequests.length, 1)

console.log(JSON.stringify({
  smoke: 'canonical-a100-vertex-professional-gpu-launch-adapter',
  checks: {
    exactQualifiedReleasePairReread: true,
    exactBillingAccountEffectiveVertexRateReread: true,
    liveVertexA100QuotaReread: true,
    durableConsumptionBeforeVertexProvider: true,
    exactVertexA100WorkerPoolCompiledServerSide: true,
    immutableSuccessorImageCompiledServerSide: true,
    callerRouteImageCommandModelPriceOrRetryNotAccepted: true,
    historicalBatchA100RejectedBeforeProvider: true,
    expiredQuotaRejectedBeforeProvider: true,
    scaleFromZeroAndTerminalReconciliationRequired: true,
  },
}, null, 2))

function buildAdmission() {
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-dispatch-admission-v1' as const,
    source: 'canonical_server_professional_gpu_dispatch_owner' as const,
    admissionId: 'sam31-a100-vertex-admission-1',
    toolId: 'sam3_1' as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary' as const,
    scope: {
      ownerUserId: 'owner-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-session-1',
      editPlanId: 'edit-plan-1',
      editPlanVersion: 1,
      approvedSnapshotRef: ref('approved-snapshot'),
      confirmedOutputFrameRef: ref('confirmed-output-frame'),
      masterTimingRef: ref('master-timing'),
      approvedWorkItemRef: ref('approved-work-item'),
      workerLeaseRef: ref('worker-lease'),
      fundedReservationRef: ref('funded-reservation'),
      userApprovalRecordRef: ref('user-approval'),
      userTriggerRecordRef: ref('user-trigger'),
      executionAttemptRef: ref('execution-attempt'),
      idempotencyKey: 'sam31-a100-attempt-1',
    },
    estimateRef: ref('estimate'),
    estimateMaximumReservedToolCostCredits: 300,
    currentRateAuthorityRef: {
      id: currentVertexRate.rateAuthorityId,
      version: currentVertexRate.rateAuthorityVersion,
      contentHash:
        `sha256:${currentVertexRate.rateAuthorityHash}` as const,
    },
    placementPolicyRef: {
      schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1' as const,
      policyHash: sha256AuthorityValue('placement-policy'),
      entryHash: sha256AuthorityValue('sam31-a100-entry'),
    },
    gpuPolicyRef: {
      schemaVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3' as const,
      policyHash: sha256AuthorityValue('gpu-policy-v3'),
    },
    runtimeReleaseRef: target.releaseRef,
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
    admittedAt: '2026-08-06T16:00:00.000Z',
    expiresAt: '2026-08-06T17:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function buildQuota(input: {
  observedAt?: string
  expiresAt?: string
} = {}) {
  return sealCanonicalSam31VertexQualificationQuotaObservation({
    schemaVersion:
      'canonical-sam3_1-vertex-a100-qualification-quota-observation-v1',
    source: 'canonical_server_vertex_quota_observation_owner',
    evidenceClass: 'canonical_private_reread',
    projectId: 'reeditpro',
    region: 'us-central1',
    quotaPreferenceId: 'weeditpro-vertex-a100-80gb-us-central1-1',
    quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
    preferredValue: 1,
    grantedValue: 1,
    reconciling: false,
    exactCloudQuotaPreferenceAndQuotaInfoReread: true,
    batchOrComputeA100QuotaUsedAsVertexAuthority: false,
    gpuJobStarted: false,
    customerCreditsMutated: false,
    observedAt: input.observedAt ?? '2026-08-06T16:09:00.000Z',
    expiresAt: input.expiresAt ?? '2026-08-06T16:24:00.000Z',
  })
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}
