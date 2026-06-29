import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerImplementationScaffoldInput,
  validateGpacMp4boxDisabledHandlerImplementationScaffoldInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-implementation-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerImplementationScaffoldInput({ createdAt })
const baselineResult = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput(baseline)

assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.scaffoldStatus, 'disabled_handler_implementation_scaffold_registered_no_executable_handler')
assert.equal(baselineResult.scaffoldId, 'handlerImplementationScaffold.gpacMp4box.disabled')
assert.equal(baselineResult.sanitizedScaffold.handlerImplementationMode, 'disabled_handler_implementation_scaffold_only')
assert.equal(baselineResult.sanitizedScaffold.enabled, false)
assert.equal(baselineResult.sanitizedScaffold.handlerRegistered, false)
assert.equal(baselineResult.sanitizedScaffold.executableHandlerRegistered, false)
assert.equal(baselineResult.sanitizedScaffold.handlerEnabled, false)
assert.equal(baselineResult.sanitizedScaffold.featureFlagDefault, false)
assert.equal(baselineResult.sanitizedScaffold.routeExecution, false)
assert.equal(baselineResult.sanitizedScaffold.workerDispatch, false)
assert.equal(baselineResult.sanitizedScaffold.workerExecution, false)
assert.equal(baselineResult.sanitizedScaffold.gpacMp4boxExecution, false)
assert.equal(baselineResult.sanitizedScaffold.storageTransfer, false)
assert.equal(baselineResult.sanitizedScaffold.signedUrlCreation, false)
assert.equal(baselineResult.sanitizedScaffold.publicArtifactCreation, false)
assert.equal(baselineResult.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1')

const planDriftAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  guardedHandlerImplementationPlanRef: {
    ...baseline.guardedHandlerImplementationPlanRef,
    mergeSha: 'wrong',
  },
} as unknown as typeof baseline)
assert.equal(planDriftAttempt.ok, false)
assert.ok(planDriftAttempt.blockers.includes('blocked_guarded_handler_implementation_plan_invalid'))

const handlerAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  executableHandlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerAttempt.ok, false)
assert.ok(handlerAttempt.blockers.includes('blocked_handler_implementation_not_disabled'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const routeExecutionAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    routeExecution: true,
  },
} as unknown as typeof baseline)
assert.equal(routeExecutionAttempt.ok, false)
assert.ok(routeExecutionAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const storageAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    publicArtifactCreation: true,
  },
} as unknown as typeof baseline)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_artifact_attempt'))

const missingGuardAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  approvedSnapshotGuardRef: {
    ...baseline.approvedSnapshotGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingGuardAttempt.ok, false)
assert.ok(missingGuardAttempt.blockers.includes('blocked_missing_approved_snapshot_guard'))

const rejectedInputAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  rejectedInputs: {
    ...baseline.rejectedInputs,
    rawCommandString: true,
  },
} as unknown as typeof baseline)
assert.equal(rejectedInputAttempt.ok, false)
assert.ok(rejectedInputAttempt.blockers.includes('blocked_rejected_input_present'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'disabled_handler_implementation_scaffold_validates',
    'guarded_handler_implementation_plan_drift_blocks',
    'executable_handler_implementation_blocks',
    'feature_flag_enablement_blocks',
    'route_execution_blocks',
    'public_artifact_attempt_blocks',
    'missing_approved_snapshot_guard_blocks',
    'raw_command_input_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  scaffoldStatus: baselineResult.scaffoldStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
