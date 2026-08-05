import assert from 'node:assert/strict'

import {
  inspectTrackAllSam31PrivateCanary,
  trackAllSam31PrivateCanaryReceiptSchema,
} from '../edit-skills/track-all/private/sam3_1-private-canary'
import {
  createCurrentTrackAllSam31V2RouteGateReport,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'

const report = createCurrentTrackAllSam31V2RouteGateReport({
  generatedAt: '2026-08-04T20:00:00.000Z',
})
const receipt = inspectTrackAllSam31PrivateCanary({
  routeGateReport: report,
  explicitExecutionAuthorityObserved: false,
  checkedAt: '2026-08-04T20:00:01.000Z',
})
assert.doesNotThrow(() =>
  trackAllSam31PrivateCanaryReceiptSchema.parse(receipt))
assert.equal(receipt.status, 'blocked_external_prerequisites')
assert.equal(receipt.missingGateKeys.length, 10)
assert.equal(receipt.actualSamRequestCount, 0)
assert.equal(receipt.actualGpuExecutionCount, 0)
assert.equal(receipt.injectedEvidenceUsed, false)
assert.equal(receipt.paidActionOccurred, false)
assert.equal(receipt.publicArtifactCount, 0)
assert.equal(receipt.productionMutationCount, 0)
assert.equal(receipt.productionQualified, false)

const authorizedButBlocked = inspectTrackAllSam31PrivateCanary({
  routeGateReport: report,
  explicitExecutionAuthorityObserved: true,
  checkedAt: '2026-08-04T20:00:02.000Z',
})
assert.equal(authorizedButBlocked.status, 'blocked_external_prerequisites')
assert.equal(authorizedButBlocked.actualSamRequestCount, 0)
assert.equal(authorizedButBlocked.paidActionOccurred, false)

console.log(JSON.stringify({
  status: 'ok',
  canaryStatus: receipt.status,
  routeGateReportHash: receipt.routeGateReportHash,
  receiptHash: receipt.receiptHash,
  missingGateCount: receipt.missingGateKeys.length,
  actualSamRequestCount: receipt.actualSamRequestCount,
  actualGpuExecutionCount: receipt.actualGpuExecutionCount,
  paidActionOccurred: receipt.paidActionOccurred,
}))

