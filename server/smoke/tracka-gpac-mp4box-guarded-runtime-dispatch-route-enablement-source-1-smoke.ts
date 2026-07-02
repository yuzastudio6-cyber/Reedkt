import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
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

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_URL: '',
})
const app = createReeditProApiApp(env)
const server = app.listen(0)
const previousGate = process.env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')

  const blockedHttpInput = buildGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput({
    workspaceId: 'workspace-gpac-mp4box-http-route-blocked',
    projectId: 'project-gpac-mp4box-http-route-blocked',
    approvedSnapshotId: 'approvedSnapshot.gpacMp4box.httpBlocked.generatedSubtitleOnly.v1',
    jobId: 'job.gpacMp4box.httpBlocked.packageValidation.generatedSubtitleOnly.v1',
  })
  delete process.env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]
  const blockedResponse = await fetch(
    `http://127.0.0.1:${address.port}${TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': blockedHttpInput.routeIdempotencyKey,
      },
      body: JSON.stringify(blockedHttpInput),
    },
  )
  assert.equal(blockedResponse.status, 409)
  const blockedBody = await blockedResponse.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { localMockQueueItemCreated?: unknown } } }
  }
  assert.equal(blockedBody.data?.result?.ok, false)
  assert.equal(
    blockedBody.data?.result?.status,
    'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation',
  )
  assert.equal(blockedBody.data?.result?.safety?.localMockQueueItemCreated, false)

  const confirmedHttpInput = buildGpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceInput({
    workspaceId: 'workspace-gpac-mp4box-http-route-confirmed',
    projectId: 'project-gpac-mp4box-http-route-confirmed',
    approvedSnapshotId: 'approvedSnapshot.gpacMp4box.httpConfirmed.generatedSubtitleOnly.v1',
    jobId: 'job.gpacMp4box.httpConfirmed.packageValidation.generatedSubtitleOnly.v1',
  })
  process.env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV] = 'true'
  const confirmedResponse = await fetch(
    `http://127.0.0.1:${address.port}${TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': confirmedHttpInput.routeIdempotencyKey,
      },
      body: JSON.stringify(confirmedHttpInput),
    },
  )
  assert.equal(confirmedResponse.status, 201)
  const confirmedBody = await confirmedResponse.json() as {
    data?: {
      result?: {
        ok?: boolean
        status?: string
        sanitizedRouteSource?: {
          localMockQueueItemCreated?: unknown
          workerSkeletonValidated?: unknown
          queueStatus?: unknown
        }
        safety?: {
          workerDispatch?: unknown
          workerExecution?: unknown
          gpacMp4boxExecution?: unknown
          supabaseMutation?: unknown
          sqlExecution?: unknown
          signedUrlCreation?: unknown
          publicArtifactCreation?: unknown
        }
      }
    }
  }
  assert.equal(confirmedBody.data?.result?.ok, true)
  assert.equal(
    confirmedBody.data?.result?.status,
    'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source',
  )
  assert.equal(confirmedBody.data?.result?.sanitizedRouteSource?.localMockQueueItemCreated, true)
  assert.equal(confirmedBody.data?.result?.sanitizedRouteSource?.workerSkeletonValidated, true)
  assert.equal(confirmedBody.data?.result?.sanitizedRouteSource?.queueStatus, 'queued')
  assert.equal(confirmedBody.data?.result?.safety?.workerDispatch, false)
  assert.equal(confirmedBody.data?.result?.safety?.workerExecution, false)
  assert.equal(confirmedBody.data?.result?.safety?.gpacMp4boxExecution, false)
  assert.equal(confirmedBody.data?.result?.safety?.supabaseMutation, false)
  assert.equal(confirmedBody.data?.result?.safety?.sqlExecution, false)
  assert.equal(confirmedBody.data?.result?.safety?.signedUrlCreation, false)
  assert.equal(confirmedBody.data?.result?.safety?.publicArtifactCreation, false)
} finally {
  if (previousGate === undefined) {
    delete process.env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV]
  } else {
    process.env[TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_ENABLEMENT_SOURCE_CONFIRM_ENV] = previousGate
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

console.log(JSON.stringify({
  ok: true,
  routePath: passed.routePath,
  checks: [
    'absent_confirmation_blocks',
    'confirmed_route_source_creates_local_mock_queue_only',
    'worker_skeleton_validates_without_dispatch',
    'tool_execution_request_blocks',
    'unapproved_command_template_blocks',
    'express_route_registered_and_fails_closed_without_env_gate',
    'express_route_confirmed_returns_local_mock_queue_only',
    'no_supabase_sql_storage_signed_public_or_tool_execution',
  ],
  nextMilestone: passed.nextMilestone,
}, null, 2))
