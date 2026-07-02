import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
  buildGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
  runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff,
  summarizeGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffBoundary,
  validateGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'

const validInput = buildGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput()
const validation = validateGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput(validInput)
assert.deepEqual(validation, [])

const blockedWithoutGate = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(validInput, {
  env: {},
})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(
  blockedWithoutGate.status,
  'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation',
)
assert.equal(blockedWithoutGate.safety.localMockQueueItemCreated, false)
assert.equal(blockedWithoutGate.safety.runtimeRouteExecution, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)

const completed = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(validInput, {
  env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true' },
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'queued_generated_fixture_approved_snapshot_job_queue_handoff')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION)
assert.ok(completed.queueItem)
assert.equal(completed.queueItem.queueStatus, 'queued')
assert.equal(completed.queueItem.workerKind, 'custom')
assert.equal(completed.queueItem.mockOnly, true)
assert.equal(completed.queueItem.payload.mockOnly, true)
assert.equal(completed.queueItem.payload.runtimeRoutePath, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH)
assert.equal(completed.queueItem.payload.runtimeRouteExecution, false)
assert.equal(completed.queueItem.payload.workerDispatch, false)
assert.equal(completed.queueItem.payload.workerExecution, false)
assert.equal(completed.queueItem.payload.gstreamerExecution, false)
assert.equal(completed.queueItem.payload.mkvtoolnixExecution, false)
assert.equal(completed.queueItem.payload.mediaProcessing, false)
assert.equal(completed.sanitizedHandoff.runtimeRouteBody.routeIdempotencyKey, validInput.routeIdempotencyKey)
assert.equal(completed.sanitizedHandoff.runtimeRouteBody.approvedSnapshotId, validInput.approvedSnapshotId)
assert.equal(completed.sanitizedHandoff.runtimeRouteBody.fixtureScope, 'generated_srt_and_generated_subtitle_only_mkv_fixture')
assert.equal(completed.sanitizedHandoff.runtimeRouteExecution, false)
assert.equal(completed.sanitizedHandoff.localMockQueueItemCreated, true)
assert.equal(completed.safety.routeHandlerInvocation, 'completed_guarded_queue_handoff_route_handler')
assert.equal(completed.safety.runtimeRouteExecution, false)
assert.equal(completed.safety.persistentJobQueueWrite, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(
  buildGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput({
    privateMediaPath: '/private/user/source.mp4',
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true' },
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsupported_generated_fixture_queue_handoff_payload'))
assert.equal(unsafe.safety.privateMediaProcessing, false)

const routeExecutionRequested = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(
  buildGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput({
    runtimeRouteExecutionRequestedNow: true,
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true' },
  },
)
assert.equal(routeExecutionRequested.ok, false)
assert.ok(routeExecutionRequested.blockers.includes('blocked_runtime_or_remote_execution_not_enabled_for_queue_handoff'))

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
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const response = await fetch(`http://127.0.0.1:${address.port}${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': validInput.routeIdempotencyKey,
    },
    body: JSON.stringify(validInput),
  })
  assert.equal(response.status, 409)
  const body = await response.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { localMockQueueItemCreated?: unknown } } }
  }
  assert.equal(body.data?.result?.ok, false)
  assert.equal(
    body.data?.result?.status,
    'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation',
  )
  assert.equal(body.data?.result?.safety?.localMockQueueItemCreated, false)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffBoundary()
assert.ok(boundary.some((line) => line.includes('approved-snapshot')))
assert.ok(boundary.some((line) => line.includes('Fails closed')))
assert.ok(boundary.some((line) => line.includes('local mock queue item only')))
assert.ok(boundary.some((line) => line.includes('existing runtime route path and body')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_generated_fixture_approved_snapshot_queue_handoff_input',
    'confirmation_gate_blocks_before_queue',
    'local_mock_queue_item_created',
    'runtime_route_body_embedded_for_next_milestone',
    'private_media_payload_blocks',
    'immediate_runtime_route_execution_request_blocks',
    'express_route_registered_and_fails_closed_without_env_gate',
    'no_supabase_sql_worker_dispatch_tool_execution_media_processing_or_public_artifact_enabled',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
  runtimeRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION,
}, null, 2))
