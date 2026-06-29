import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledRuntimeScaffoldInput,
  validateGpacMp4boxDisabledRuntimeScaffoldInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const input = buildGpacMp4boxDisabledRuntimeScaffoldInput({ createdAt })
const result = validateGpacMp4boxDisabledRuntimeScaffoldInput(input)

assert.equal(result.ok, true, result.sanitizedSummary)
assert.equal(result.scaffoldStatus, 'disabled_scaffold_registered_no_runtime')
assert.equal(result.scaffoldId, 'runtimeScaffold.gpacMp4box.disabled')
assert.equal(result.sanitizedScaffold.runtimeMode, 'disabled_scaffold_only')
assert.equal(result.sanitizedScaffold.enabled, false)
assert.equal(result.sanitizedScaffold.enablementPlanId, 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1')
assert.equal(result.sanitizedScaffold.serviceRoleRouteStatus, 'disabled')
assert.equal(result.sanitizedScaffold.workerDispatchEnabled, false)
assert.equal(result.sanitizedScaffold.rawCommandStringsAllowed, false)
assert.equal(result.sanitizedScaffold.routeExecution, false)
assert.equal(result.sanitizedScaffold.workerDispatch, false)
assert.equal(result.sanitizedScaffold.workerExecution, false)
assert.equal(result.sanitizedScaffold.gpacMp4boxExecution, false)
assert.equal(result.sanitizedScaffold.mediaProcessing, false)
assert.equal(result.sanitizedScaffold.storageTransfer, false)
assert.equal(result.sanitizedScaffold.signedUrlCreation, false)
assert.equal(result.sanitizedScaffold.publicArtifactCreation, false)
assert.equal(result.sanitizedScaffold.supabaseMutation, false)
assert.equal(result.sanitizedScaffold.sqlExecution, false)
assert.equal(result.sanitizedScaffold.externalBetaExpansion, false)
assert.equal(result.sanitizedScaffold.paidProductionUnlock, false)
assert.equal(result.sanitizedScaffold.productionUnlock, false)
assert.equal(result.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1')

const enabledAttempt = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...input,
  enabled: true,
} as unknown as typeof input)
assert.equal(enabledAttempt.ok, false)
assert.ok(enabledAttempt.blockers.includes('blocked_runtime_flag_not_disabled'))

const rawCommandAttempt = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...input,
  rejectedInputs: {
    ...input.rejectedInputs,
    rawCommandString: true,
  },
} as unknown as typeof input)
assert.equal(rawCommandAttempt.ok, false)
assert.ok(rawCommandAttempt.blockers.includes('blocked_rejected_input_present'))

const toolExecutionAttempt = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...input,
  safety: {
    ...input.safety,
    gpacMp4boxExecution: true,
  },
} as unknown as typeof input)
assert.equal(toolExecutionAttempt.ok, false)
assert.ok(toolExecutionAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const storageAttempt = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...input,
  safety: {
    ...input.safety,
    storageTransfer: true,
  },
} as unknown as typeof input)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_delivery_attempt'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'disabled_runtime_scaffold_validates',
    'runtime_flag_must_remain_disabled',
    'raw_command_input_blocks',
    'gpac_mp4box_execution_blocks',
    'storage_transfer_blocks',
    'no_route_worker_tool_storage_or_media_execution_enabled',
  ],
  scaffoldStatus: result.scaffoldStatus,
  nextRequiredGate: result.nextRequiredGate,
}, null, 2))
