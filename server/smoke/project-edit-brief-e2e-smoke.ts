import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import {
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  listProjectEditBriefApplicationLogsViaApi,
} from '../../src/lib/project-edit-brief-api-client-adapter'
import {
  addProjectEditBriefMetadataAttachmentViaApi,
  createProjectEditBriefAttachmentDraftForUI,
} from '../../src/lib/project-edit-brief-attachment-ui-adapter'
import {
  loadProjectEditBriefExportSettingsPanelForUI,
  saveProjectEditBriefExportSettingsFormViaApi,
} from '../../src/lib/project-edit-brief-export-settings-ui-adapter'
import {
  createProjectEditBriefMarkerDraftForUI,
  createProjectEditBriefMarkerSavePayload,
  saveProjectEditBriefMarkerViaApi,
} from '../../src/lib/project-edit-brief-marker-flow-ui-adapter'
import { sendProjectEditBriefMarkerChatMessageViaApi } from '../../src/lib/project-edit-brief-marker-chat-ui-adapter'
import { runProjectEditBriefQAViaApi } from '../../src/lib/project-edit-brief-qa-ui-adapter'
import { prepareProjectEditBriefPlanHintsForUI } from '../../src/lib/project-edit-brief-plan-ui-adapter'

const repoRoot = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-youtube-wide'
const sideEffectKeys = [
  'providerCallMade',
  'modelCallMade',
  'supabaseReadMade',
  'supabaseWriteMade',
  'storageReadMade',
  'storageWriteMade',
  'signedUrlCreated',
  'fileBytesRead',
  'externalUrlFetched',
  'mediaProcessingStarted',
  'soundRuntimeStarted',
  'dockerCommandRun',
  'workerJobCreated',
  'generationRequestCreated',
  'renderJobCreated',
  'creditReservedOrSpent',
  'plannerExecuted',
  'editPlanCreated',
] as const

const requiredDocs = [
  'docs/project-edit-brief-e2e-audit.md',
  'docs/project-edit-brief-internal-testing-runbook.md',
  'docs/project-edit-brief-ui-qa-checklist.md',
  'docs/project-edit-brief-known-limitations.md',
  'docs/project-edit-brief-qa-handoff.md',
  'docs/project-edit-brief-next-production-plan.md',
]

function assertNoTruthySideEffects(value: unknown, label: string) {
  assert.ok(value && typeof value === 'object', `${label} should be an object`)
  const record = value as Record<string, unknown>
  for (const key of sideEffectKeys) {
    assert.notEqual(record[key], true, `${label}: ${key} must not be true`)
  }
}

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: false,
})
assertNoTruthySideEffects(client.safety, 'client safety')

const briefResult = await getProjectEditBriefForSessionViaApi(editSessionId, client)
assert.ok(briefResult.brief, 'Brief should load for the mock Edit Chat.')
assertNoTruthySideEffects(briefResult, 'brief result')

const bundleResult = await getProjectEditBriefBundleViaApi(briefResult.brief.id, client)
assert.ok(bundleResult.bundle, 'Brief bundle should load.')
assert.ok(bundleResult.bundle.markers.length >= 1, 'Timeline markers should load.')
assertNoTruthySideEffects(bundleResult, 'bundle result')

const draft = createProjectEditBriefMarkerDraftForUI({
  briefId: briefResult.brief.id,
  editSessionId,
  playheadSeconds: 42,
  projectId,
})
const markerDraft = {
  ...draft,
  markerType: 'broll' as const,
  priority: 'must_follow' as const,
  title: 'RP12 smoke marker',
  userNote: 'Mock/local E2E marker for internal testing coverage only.',
  status: 'draft' as const,
}
const markerPayload = createProjectEditBriefMarkerSavePayload(markerDraft)
assert.equal(markerPayload.metadata.plannerExecutionStarted, false, 'Marker payload must not imply planner execution.')
const markerResult = await saveProjectEditBriefMarkerViaApi(markerDraft, client)
assert.ok(markerResult.marker, 'Marker creation should work through the mock client.')
assertNoTruthySideEffects(markerResult, 'marker create result')

const chatResult = await sendProjectEditBriefMarkerChatMessageViaApi({
  markerId: markerResult.marker.id,
  messageText: 'Use this attached B-roll clip and keep original audio.',
}, client)
assert.ok(chatResult?.intent, 'Marker Chat should extract structured intent.')
assert.ok(chatResult.warnings.some((warning) => /scoped to the marker/i.test(warning)), 'Marker Chat should remain marker-scoped.')
assertNoTruthySideEffects(chatResult, 'marker chat result')

const drawerAfterChat = await getProjectEditBriefMarkerDrawerViaApi(markerResult.marker.id, client)
assert.ok(drawerAfterChat.drawer, 'Marker drawer should load after Marker Chat.')
const attachmentDraft = createProjectEditBriefAttachmentDraftForUI({
  drawer: drawerAfterChat.drawer,
  attachmentKind: 'broll_video',
})
const attachmentResult = await addProjectEditBriefMetadataAttachmentViaApi({
  ...attachmentDraft,
  label: 'rp12-broll-metadata.mp4',
  notes: ['Metadata-only attachment. No upload.'],
}, client)
assert.ok(attachmentResult.attachment, 'Metadata-only attachment should save.')
assert.equal(attachmentResult.fileBytesRead, false, 'Attachment save must not read file bytes.')
assert.equal(attachmentResult.externalUrlFetched, false, 'Attachment save must not fetch URLs.')
assertNoTruthySideEffects(attachmentResult, 'attachment result')

const exportPanel = await loadProjectEditBriefExportSettingsPanelForUI({ projectId, editSessionId, client })
assert.equal(exportPanel.canStartRender, false, 'Export panel cannot start render.')
assert.equal(exportPanel.canStartExport, false, 'Export panel cannot start export.')
const exportResult = await saveProjectEditBriefExportSettingsFormViaApi({
  ...exportPanel.form,
  summary: 'RP12 mock export settings save. No render/export started.',
}, client)
assert.ok(exportResult.exportSettings, 'Export settings should save as mock metadata.')
assert.equal(exportResult.validation.ok, true, 'Export settings form should validate.')

const qaResult = await runProjectEditBriefQAViaApi({ projectId, editSessionId, client })
assert.ok(qaResult.qaPackage, 'QA package should be created.')
assert.ok(qaResult.summaryModel, 'QA summary model should be created.')
assertNoTruthySideEffects(qaResult, 'QA result')

const planResult = await prepareProjectEditBriefPlanHintsForUI({ projectId, editSessionId, client })
assert.ok(planResult.package, 'Plan hint package should be created.')
assert.ok(planResult.panelModel, 'Plan hint panel model should be created.')
assert.ok(planResult.applicationLog, 'Plan hint preparation should append an application log.')
assert.equal(planResult.plannerExecuted, false, 'Plan hint preparation must not run planner.')
assert.equal(planResult.editPlanCreated, false, 'Plan hint preparation must not create edit plan.')
assertNoTruthySideEffects(planResult, 'plan result')

const logsResult = await listProjectEditBriefApplicationLogsViaApi(briefResult.brief.id, client)
assert.ok(logsResult.applicationLogs.some((log) => log.summary.includes('Prepared')), 'Application logs should include plan hint summary.')
assertNoTruthySideEffects(logsResult, 'application log result')

for (const doc of requiredDocs) {
  const path = join(repoRoot, doc)
  assert.ok(existsSync(path), `${doc} should exist.`)
  const text = readFileSync(path, 'utf8')
  assert.match(text, /Edit Brief is optional/i, `${doc} should state Edit Brief is optional.`)
  assert.match(text, /Chat remains default/i, `${doc} should state Chat remains default.`)
  assert.match(text, /Marker Chat is marker-scoped/i, `${doc} should state Marker Chat is marker-scoped.`)
  assert.match(text, /metadata-only/i, `${doc} should state attachments are metadata-only.`)
  assert.match(text, /plan hints are not execution/i, `${doc} should state plan hints are not execution.`)
  assert.match(text, /production ready: false/i, `${doc} should state production ready is false.`)
  assert.match(text, /owner approval.*pending/i, `${doc} should state owner approval is pending.`)
  assert.match(text, /no migration/i, `${doc} should state no migration.`)
  assert.match(text, /no Supabase command/i, `${doc} should state no Supabase command.`)
}

const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8')
assert.match(packageJson, /"smoke:project-edit-brief-e2e": "tsx server\/smoke\/project-edit-brief-e2e-smoke\.ts"/)

const migrationCount = readdirSync(join(repoRoot, 'supabase/migrations')).filter((file) => file.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain at the clean mock/local branch baseline.')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-e2e',
  status: 'passed',
  markerCreated: markerResult.marker.id,
  markerChatIntent: chatResult.intent.action,
  attachmentSaved: attachmentResult.attachment.id,
  qaReadiness: qaResult.summaryModel.readinessStatus,
  planInstructions: planResult.package.planInstructions.length,
  skippedMarkers: planResult.package.skippedMarkers.length,
  applicationLogs: logsResult.applicationLogs.length,
  migrationCount,
  supabaseCommandRequired: false,
  realPlannerExecuted: false,
  editPlanCreated: false,
  renderProgressProviderWorkerCreditStarted: false,
}, null, 2))
