import assert from 'node:assert/strict'
import {
  EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV,
  EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES,
  assertExternalBetaControlledEnablementResult,
  evaluateExternalBetaControlledEnablement,
} from '../config/external-beta-controlled-enablement-contract'

const disabled = evaluateExternalBetaControlledEnablement()
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'disabled_pending_explicit_external_beta_ready_flag')
assert.equal(disabled.safety.externalBetaUnlockAppliedToEnvironment, false)
assertExternalBetaControlledEnablementResult(disabled)

const enabledInput = evaluateExternalBetaControlledEnablement({
  env: {
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.rollbackMode]:
      EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.rollbackMode,
  },
})
assert.equal(enabledInput.ok, true)
assert.equal(enabledInput.status, 'enabled_controlled_external_beta_private_preview_only')
assert.equal(enabledInput.runtimeBoundary.privateArtifactsOnly, true)
assert.equal(enabledInput.runtimeBoundary.publicArtifactsAllowed, false)
assert.equal(enabledInput.runtimeBoundary.paidBillingAllowed, false)
assert.equal(enabledInput.runtimeBoundary.productionAllowed, false)
assert.equal(enabledInput.safety.environmentMutationPerformed, false)
assert.equal(enabledInput.safety.externalBetaUnlockAppliedToEnvironment, false)
assertExternalBetaControlledEnablementResult(enabledInput)

const badTarget = evaluateExternalBetaControlledEnablement({
  env: {
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef]: 'fajinbvwhcjnutkaumkm',
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.rollbackMode]:
      EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.rollbackMode,
  },
})
assert.equal(badTarget.ok, false)
assert.equal(badTarget.status, 'blocked_target_ref_mismatch')
assert.match(badTarget.blockers.join(','), /wmyyttnynmteqgcdishd/)
assertExternalBetaControlledEnablementResult(badTarget)

const missingRollback = evaluateExternalBetaControlledEnablement({
  env: {
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef,
    [EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope]: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope,
  },
})
assert.equal(missingRollback.ok, false)
assert.equal(missingRollback.status, 'blocked_rollback_mode_missing')
assertExternalBetaControlledEnablementResult(missingRollback)

console.log('external-beta-controlled-enablement-contract-smoke passed')
