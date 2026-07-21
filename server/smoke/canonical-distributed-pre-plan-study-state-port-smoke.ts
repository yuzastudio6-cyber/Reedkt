import assert from 'node:assert/strict'

import {
  runCanonicalDistributedPrePlanStudyConformance,
} from '../distributed-pre-plan-study'

const evidence = await runCanonicalDistributedPrePlanStudyConformance()

assert.ok(evidence.checkCount >= 15)
assert.equal(evidence.productionAuthority, false)
assert.equal(evidence.approvedSnapshotOrCreditReservationFabricated, false)
assert.equal(evidence.customerPriceCreditsServiceFeeWalletOrBillingIncluded, false)

console.log(JSON.stringify({
  ok: true,
  evidence,
}, null, 2))
