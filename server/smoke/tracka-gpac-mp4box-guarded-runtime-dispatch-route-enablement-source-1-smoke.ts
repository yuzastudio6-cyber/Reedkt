import assert from 'node:assert/strict'
import {
  TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV,
  TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH,
  buildGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput,
  runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource,
} from '../services/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1'

const input = buildGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput()

const blocked = runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource(input, { env: {} })
assert.equal(blocked.ok, false)
assert.equal(blocked.status, 'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation')
assert.equal(blocked.safety.localMockQueueItemCreated, false)
assert.equal(blocked.safety.routeExecution, false)
assert.equal(blocked.safety.workerDispatch, false)
assert.equal(blocked.safety.workerExecution, false)
assert.equal(blocked.safety.gpacMp4boxExecution, false)

const passed = runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource(input, {
  env: { [TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]: 'true' },
})

assert.equal(passed.ok, true, JSON.stringify(passed.blockers))
assert.equal(passed.status, 'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source')
assert.equal(passed.routePath, TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH)
assert.equal(passed.sanitizedRouteSource.localMockQueueItemCreated, true)
assert.equal(passed.sanitizedRouteSource.workerSkeletonValidated, true)
assert.equal(passed.sanitizedRouteSource.queueStatus, 'queued')
assert.ok(passed.queueItem)
assert.equal(passed.queueItem?.mockOnly, true)
assert.equal(passed.queueItem?.payload.mockOnly, true)
assert.equal(passed.queueItem?.payload.gpacMp4boxExecution, false)
assert.equal(passed.queueItem?.payload.mediaProcessing, false)
assert.equal(passed.safety.routeExecution, false)
assert.equal(passed.safety.workerDispatch, false)
assert.equal(passed.safety.workerExecution, false)
assert.equal(passed.safety.workerProcessStart, false)
assert.equal(passed.safety.workerLeaseClaim, false)
assert.equal(passed.safety.persistentJobQueueWrite, false)
assert.equal(passed.safety.gpacMp4boxExecution, false)
assert.equal(passed.safety.ffmpegFfprobeExecution, false)
assert.equal(passed.safety.dockerExecution, false)
assert.equal(passed.safety.remotionExecution, false)
assert.equal(passed.safety.storageTransfer, false)
assert.equal(passed.safety.supabaseMutation, false)
assert.equal(passed.safety.sqlExecution, false)
assert.equal(passed.safety.signedUrlCreation, false)
assert.equal(passed.safety.publicArtifactCreation, false)
assert.equal(passed.safety.finalRenderExport, false)

const unsafe = runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource({
  ...input,
  gpacMp4boxExecutionRequestedNow: true,
}, {
  env: { [TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]: 'true' },
})
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_runtime_or_remote_execution_not_enabled_for_gpac_mp4box_route_source'))

const badCommand = runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource({
  ...input,
  commandTemplateId: 'mp4box_arbitrary_command',
}, {
  env: { [TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]: 'true' },
})
assert.equal(badCommand.ok, false)
assert.ok(badCommand.blockers.includes('blocked_unapproved_gpac_mp4box_command_template'))

console.log(JSON.stringify({
  ok: true,
  routePath: passed.routePath,
  checks: [
    'absent_confirmation_blocks',
    'confirmed_route_source_creates_local_mock_queue_only',
    'worker_skeleton_validates_without_dispatch',
    'tool_execution_request_blocks',
    'unapproved_command_template_blocks',
    'no_supabase_sql_storage_signed_public_or_tool_execution',
  ],
  nextMilestone: passed.nextMilestone,
}, null, 2))
