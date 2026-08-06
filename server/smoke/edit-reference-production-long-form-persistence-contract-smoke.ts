import assert from 'node:assert/strict'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_TABLES,
  editReferenceProductionPersistenceContract,
  validateEditReferenceProductionPersistenceContract,
  type EditReferenceProductionPersistenceContract,
} from '../edit-references/edit-reference-production-persistence-contract'

const summary = validateEditReferenceProductionPersistenceContract()
const contract = editReferenceProductionPersistenceContract

assert.equal(summary.version, 'edit-reference-production-persistence-contract-v6')
assert.equal(summary.longFormStudyTableCount, EDIT_REFERENCE_LONG_FORM_STUDY_TABLES.length)
assert.equal(summary.longFormStudyTableCount, 6)
assert.equal(summary.longFormStudyOperationCount, 9)
assert.equal(summary.longFormStudyRuntimeEnabled, false)

assert.equal(contract.longFormStudy.authorityClass, 'pre_plan_edit_reference_long_form_study')
assert.equal(contract.longFormStudy.approvedEditPlanSnapshotRequired, false)
assert.equal(contract.longFormStudy.approvedEditCreditReservationRequired, false)
assert.equal(contract.longFormStudy.approvedEditAuthorityFabricated, false)
assert.equal(contract.longFormStudy.paidStudyUsageApprovalRequiredBeforeExecution, true)
assert.equal(contract.longFormStudy.transaction.oneActiveLeasePerWorkItem, true)
assert.equal(contract.longFormStudy.transaction.monotonicCheckpointRequired, true)
assert.equal(contract.longFormStudy.transaction.lostResponseReplayRequired, true)
assert.equal(contract.longFormStudy.transaction.expiredLeaseRecoveryRequired, true)
assert.equal(contract.longFormStudy.execution.browserClaimAllowed, false)
assert.equal(contract.longFormStudy.execution.browserSessionRequiredForCompletion, false)
assert.equal(contract.longFormStudy.execution.fixedWholeStudyTimeoutAllowed, false)
assert.equal(contract.longFormStudy.execution.restartResumeRequired, true)
assert.equal(contract.longFormStudy.cost.maximumAuthorizedInternalCostRequired, true)
assert.equal(contract.longFormStudy.cost.attemptLevelProviderAndInfrastructureUsageRequired, true)
assert.equal(contract.longFormStudy.cost.failedAttemptCostRetained, true)
assert.equal(contract.longFormStudy.cost.customerPriceCalculated, false)
assert.equal(contract.longFormStudy.cost.customerCreditsMutated, false)
assert.equal(contract.longFormStudy.cost.serviceFeeIncluded, false)
assert.equal(contract.longFormStudy.runtimeActivation.databaseTransactionAdapterVerified, false)
assert.equal(contract.longFormStudy.runtimeActivation.multiReplicaLeaseRecoveryVerified, false)
assert.equal(contract.longFormStudy.runtimeActivation.authenticatedWorkerDispatchVerified, false)
assert.equal(contract.longFormStudy.runtimeActivation.livePrivateObjectReadVerified, false)
assert.equal(contract.longFormStudy.runtimeActivation.productionEnabled, false)

for (const tableName of EDIT_REFERENCE_LONG_FORM_STUDY_TABLES) {
  assert.ok(contract.tables.some((candidate) => candidate.name === tableName))
}

const withoutCheckpointTable = {
  ...contract,
  tables: contract.tables.filter((candidate) => (
    candidate.name !== 'preference_long_form_study_checkpoints'
  )),
} as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withoutCheckpointTable),
  /production persistence contract is incomplete or unsafe/i,
)

const withoutStudyUsageApproval = {
  ...contract,
  longFormStudy: {
    ...contract.longFormStudy,
    paidStudyUsageApprovalRequiredBeforeExecution: false,
  },
} as unknown as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withoutStudyUsageApproval),
  /production persistence contract is incomplete or unsafe/i,
)

const withUnverifiedProductionRuntime = {
  ...contract,
  longFormStudy: {
    ...contract.longFormStudy,
    runtimeActivation: {
      ...contract.longFormStudy.runtimeActivation,
      productionEnabled: true,
    },
  },
} as unknown as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withUnverifiedProductionRuntime),
  /production persistence contract is incomplete or unsafe/i,
)

const withUnsafeBrowserClaim = {
  ...contract,
  longFormStudy: {
    ...contract.longFormStudy,
    execution: {
      ...contract.longFormStudy.execution,
      browserClaimAllowed: true,
    },
  },
} as unknown as EditReferenceProductionPersistenceContract
assert.throws(
  () => validateEditReferenceProductionPersistenceContract(withUnsafeBrowserClaim),
  /production persistence contract is incomplete or unsafe/i,
)

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: summary.version,
  authorityClass: contract.longFormStudy.authorityClass,
  tableCount: summary.longFormStudyTableCount,
  operationCount: summary.longFormStudyOperationCount,
  approvedEditAuthorityFabricated: contract.longFormStudy.approvedEditAuthorityFabricated,
  runtimeActivation: contract.longFormStudy.runtimeActivation,
  productionReady: summary.productionReady,
}, null, 2))
