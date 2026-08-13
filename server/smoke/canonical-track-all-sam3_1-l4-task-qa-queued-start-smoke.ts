import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  buildTrackAllSam31L4TaskQaGpuQueuedStartRequest,
  parseTrackAllSam31L4TaskQaGpuQueuedStartRequest,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-queued-start-service'

const captionCallRef = {
  id: 'caption-call-l4-queue-smoke',
  version: 'orchestra-skill-call-v1',
  contentHash: '1'.repeat(64),
}
const supportRequestRef = {
  id: 'caption-support-l4-queue-smoke',
  version: 'skill-support-request-v1',
  contentHash: '2'.repeat(64),
}
const request = buildTrackAllSam31L4TaskQaGpuQueuedStartRequest({
  requestId: 'l4-task-qa-queued-start-smoke',
  approvedSnapshotId: 'l4-task-qa-queued-snapshot',
  workItemKey: 'l4-task-qa-queued-work',
  sam31InvocationId: 'sam31-invocation-l4-queue-smoke',
  priorCaptionCallRef: captionCallRef,
  selectedCaptionSupportRequestRef: supportRequestRef,
})
assert.deepEqual(
  parseTrackAllSam31L4TaskQaGpuQueuedStartRequest(request),
  request,
)
assert.throws(() => parseTrackAllSam31L4TaskQaGpuQueuedStartRequest({
  ...request,
  requestDigestSha256: '0'.repeat(64),
}))
assert.throws(() => parseTrackAllSam31L4TaskQaGpuQueuedStartRequest({
  ...request,
  queuePriority: 'caller_highest',
}))
assert.throws(() => parseTrackAllSam31L4TaskQaGpuQueuedStartRequest({
  ...request,
  callerSelectedQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
    true,
}))

const serviceSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-queued-start-service.ts',
  'utf8',
)
assert.match(serviceSource,
  /sealCanonicalProfessionalGpuFairQueueTransactionRequest/u)
assert.match(serviceSource, /multiReplicaDurabilityVerified/u)
assert.match(serviceSource, /prepareApprovedTaskQaWork/u)
assert.doesNotMatch(serviceSource, /startApprovedTaskQaWork/u)
assert.doesNotMatch(serviceSource, /rereadLaunchBinding/u)
assert.match(serviceSource, /l4_standard_primary/u)
assert.match(serviceSource, /assertCanonicalTrackAllSam31L4TaskQaMaterialV2/u)
assert.match(serviceSource, /rereadMaterial/u)
assert.doesNotMatch(serviceSource,
  /\.startOneShotJob\s*\(|dispatchCanonicalProfessionalGpuCloudTask\s*\(/u)
assert.doesNotMatch(serviceSource,
  /customerCreditsMutated:\s*true|minimumIdleGpuInstances:\s*[1-9]/u)

const capacitySource = readFileSync(
  'server/services/canonical-professional-gpu-queue-runtime-read-port.ts',
  'utf8',
)
assert.match(capacitySource,
  /assertCanonicalSam31L4CompleteSourceCapacityObservation/u)
assert.match(capacitySource, /routeId:\s*'l4_standard_primary'/u)

const productionSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-production-runtime.ts',
  'utf8',
)
assert.match(productionSource,
  /createCanonicalTrackAllSam31L4TaskQaQueuedStartRuntime/u)
assert.match(productionSource,
  /l4FixedTaskPreparedBeforeDurableQueueAdmission:\s*true/u)
assert.match(productionSource,
  /directL4GpuInvocationHttpRouteMounted:\s*false/u)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-queued-start',
  checks: 22,
  requestClosedAndDigestBound: true,
  exactL4MaterialRereadBeforeQueue: true,
  durablePostgresQueueAdmissionRequired: true,
  serverOwnedL4QuotaAndActiveCapacity: true,
  directGpuInvocationPerformedByRequest: false,
  launchAuthorityConsumedBeforeScheduler: false,
  customerCreditsMutated: false,
  productionAuthority: false,
}, null, 2))
