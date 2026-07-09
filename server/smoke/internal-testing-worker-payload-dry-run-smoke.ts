import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_DECISION,
  runInternalTestingWorkerPayloadDryRun,
  type InternalTestingWorkerPayloadDryRunInput,
} from '../tool-calling/internal-testing-worker-payload-dry-run'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'server/tool-calling/internal-testing-worker-payload-dry-run.ts',
  'server/smoke/internal-testing-worker-payload-dry-run-smoke.ts',
  'src/lib/internal-testing-worker-payload-dry-run-ui.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'package.json',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-worker-payload-dry-run'],
  'tsx server/smoke/internal-testing-worker-payload-dry-run-smoke.ts',
)

const completeInput: InternalTestingWorkerPayloadDryRunInput = {
  workspaceId: 'workspace-internal-testing',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  approvedPlanSnapshotId: 'approved-snapshot-internal-testing',
  editPlanId: 'edit-plan-internal-testing',
  creditEstimateId: 'credit-estimate-internal-testing',
  creditReservationId: 'credit-reservation-internal-testing',
  toolExecutionPlanId: 'tool-execution-plan-internal-testing',
  idempotencyKey: 'internal-testing-worker-payload-dry-run-001',
  requestedPatternId: 'raw_footage_to_social_short',
  privateArtifactReferences: [
    {
      storageReferenceId: 'private-source-media-001',
      artifactType: 'source_media',
      storageUri: 'private://workspace-internal-testing/project/mock-project-edit-chat-foundation/source/source-video.mp4',
      source: 'finalized_source_upload',
    },
    {
      storageReferenceId: 'private-review-manifest-001',
      artifactType: 'qa_report',
      storageUri: 'storage://private/workspace-internal-testing/project/mock-project-edit-chat-foundation/review/manifest.json',
      source: 'private_review_manifest',
    },
  ],
}

const dryRun = runInternalTestingWorkerPayloadDryRun(completeInput)

assert.equal(dryRun.decision, INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_DECISION)
assert.equal(dryRun.status, 'passed_ready_for_mock_worker_queue_review')
assert.equal(dryRun.productReady, false)
assert.equal(dryRun.blockers.length, 0)
assert.ok(dryRun.routeCount > 0)
assert.equal(dryRun.payloadCount, dryRun.routeCount)
assert.equal(dryRun.validPayloadCount, dryRun.payloadCount)
assert.equal(dryRun.blockedPayloadCount, 0)
assert.ok(dryRun.payloads.some((payload) => payload.workerType === 'media_analysis_worker'))
assert.ok(dryRun.payloads.some((payload) => payload.workerType === 'remotion_render_worker'))

for (const payload of dryRun.payloads) {
  assert.equal(payload.workspaceId, completeInput.workspaceId)
  assert.equal(payload.projectId, completeInput.projectId)
  assert.equal(payload.approvedPlanSnapshotId, completeInput.approvedPlanSnapshotId)
  assert.equal(payload.editPlanId, completeInput.editPlanId)
  assert.equal(payload.creditReservationId, completeInput.creditReservationId)
  assert.equal(payload.attempt, 1)
  assert.equal(payload.maxAttempts, 1)
  assert.equal(payload.requestedAt, '2026-07-09T00:00:00.000Z')
  assert.ok(payload.idempotencyKey.startsWith(`${completeInput.idempotencyKey}:`))
  assert.ok(payload.sourceAssetIds.includes('private-source-media-001'))
  assert.ok(payload.operationIds.length > 0)
  assert.ok(payload.toolStrategyItemIds.length > 0)
  assert.equal(payload.metadata?.dryRunOnly, true)
  assert.equal(payload.metadata?.noWorkerDispatch, true)
  assert.equal(payload.metadata?.noMediaProcessing, true)
  assert.equal(payload.metadata?.noCreditSpend, true)
}

for (const summary of dryRun.validationSummaries) {
  assert.equal(summary.valid, true)
  assert.equal(summary.errorCount, 0)
}

assert.deepEqual(dryRun.blockedScope, {
  frontendToolExecution: false,
  rawPromptExecution: false,
  publicOrSignedUrlArtifacts: false,
  serviceRoleBrowserAccess: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  ledgerWrites: false,
  supabaseWrites: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
})

const missingGateDryRun = runInternalTestingWorkerPayloadDryRun({
  workspaceId: completeInput.workspaceId,
  projectId: completeInput.projectId,
  editSessionId: completeInput.editSessionId,
})
assert.equal(missingGateDryRun.status, 'blocked_by_route_review_or_payload_validation')
assert.equal(missingGateDryRun.payloadCount, 0)
assert.ok(missingGateDryRun.blockers.includes('approvedPlanSnapshotId_missing'))
assert.ok(missingGateDryRun.blockers.includes('editPlanId_or_toolExecutionPlanId_missing'))

const unsafeArtifactDryRun = runInternalTestingWorkerPayloadDryRun({
  ...completeInput,
  privateArtifactReferences: [
    {
      storageReferenceId: 'signed-url-source-media',
      artifactType: 'source_media',
      storageUri: 'https://storage.example.test/source.mp4?x-goog-signature=secret',
      source: 'finalized_source_upload',
    },
  ],
})
assert.equal(unsafeArtifactDryRun.status, 'blocked_by_route_review_or_payload_validation')
assert.equal(unsafeArtifactDryRun.payloadCount, 0)
assert.ok(unsafeArtifactDryRun.blockers.includes('privateArtifactReference_invalid_signed-url-source-media'))

const scenario = internalTestingScenarios.find((item) => item.id === 'internal-testing-worker-payload-dry-run')
assert.ok(scenario, 'Worker payload dry-run scenario should exist.')
assert.equal(scenario.route, '/internal-testing')
assert.equal(scenario.status, 'mock_local')
assert.equal(scenario.mockOnly, true)

const dryRunSource = read('server/tool-calling/internal-testing-worker-payload-dry-run.ts')
assert.doesNotMatch(dryRunSource, /execFile|spawn|child_process|fetch\(|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/i)
assert.doesNotMatch(dryRunSource, /\bworkerDispatch:\s*true|\bmediaProcessing:\s*true|\bproductReady:\s*true/i)

const uiSource = read('src/lib/internal-testing-worker-payload-dry-run-ui.ts')
const pageSource = read('src/pages/InternalTestingPage.tsx')
assert.match(uiSource, /workerDispatchAllowed:\s*false/)
assert.match(uiSource, /toolExecutionAllowed:\s*false/)
assert.match(uiSource, /privateStorageReferencesOnly:\s*true/)
assert.match(pageSource, /internal-testing-worker-payload-dry-run/)
assert.match(pageSource, /Worker payload dry run/)
const sectionStart = pageSource.indexOf('data-testid="internal-testing-worker-payload-dry-run"')
const sectionEnd = pageSource.indexOf('data-testid="internal-testing-preference-video-limits"')
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Internal Testing page should contain a bounded worker payload dry-run section.')
const sectionSource = pageSource.slice(sectionStart, sectionEnd)
assert.doesNotMatch(sectionSource, /ffmpeg|ffprobe|librosa|opencolorio|openimageio|gpac|mp4box/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-worker-payload-dry-run',
  decision: dryRun.decision,
  status: dryRun.status,
  payloadCount: dryRun.payloadCount,
  validPayloadCount: dryRun.validPayloadCount,
  productReady: dryRun.productReady,
}, null, 2))
