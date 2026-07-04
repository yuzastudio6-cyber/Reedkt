import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createDefaultMockProjectEditBriefApiClient,
} from '../../src/lib/project-edit-brief-api-client'
import {
  PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS,
  PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  addProjectEditBriefMetadataAttachmentViaApi,
  createProjectEditBriefAttachmentBoundarySummary,
  createProjectEditBriefAttachmentDraftFromPanelForUI,
  createProjectEditBriefAttachmentIntentBridgeForUI,
  loadProjectEditBriefAttachmentPanelForUI,
  redactProjectEditBriefAttachmentReferenceUrlForUI,
  removeProjectEditBriefAttachmentViaApi,
  validateProjectEditBriefAttachmentDraftForUI,
} from '../../src/lib/project-edit-brief-attachment-ui-adapter'
import {
  createProjectEditBriefAttachmentPolicySummary,
  listMockProjectEditBriefAttachmentScenarios,
  listProjectEditBriefAttachmentKinds,
  runMockAttachmentIntentBridgeFlow,
  runMockAttachmentReadinessFlow,
  validateNoProjectEditBriefAttachmentSideEffects,
} from '../../src/backend'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const markerId = 'marker-calm-soundtrack'

function assertFalseFlags(value: unknown, label: string) {
  const record = value as Record<string, unknown>
  for (const key of Object.keys(PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS)) {
    assert.equal(record[key], false, `${label}.${key} must remain false`)
  }
}

function assertDoc(path: string) {
  const fullPath = join(root, path)
  assert.ok(existsSync(fullPath), `${path} should exist`)
  const content = readFileSync(fullPath, 'utf8')
  for (const phrase of [
    'Marker Attachments',
    'mock/local',
    'metadata-only',
    'no upload',
    'no file bytes',
    'no URL fetch',
    'no media processing',
    'no sound runtime',
    'no providers',
    'no workers',
    'no render',
    'no credits',
    'no Supabase',
  ]) {
    assert.ok(content.includes(phrase), `${path} should include ${phrase}`)
  }
}

const scenarioCount = listMockProjectEditBriefAttachmentScenarios().length
assert.ok(scenarioCount >= 58, 'Attachment scenarios should cover at least 58 cases')

const backendKinds = listProjectEditBriefAttachmentKinds()
const uiKinds = PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS.map((kind) => kind.kind)
for (const kind of ['broll_video', 'image', 'music_track', 'soundtrack', 'sfx', 'voiceover', 'document', 'reference_label', 'reference_url_metadata_only']) {
  assert.ok(backendKinds.some((definition) => definition.kind === kind), `${kind} should exist in backend registry`)
  assert.ok(uiKinds.includes(kind as never), `${kind} should exist in UI registry`)
}

assert.ok(createProjectEditBriefAttachmentPolicySummary().includes('metadata-only'))
assert.ok(createProjectEditBriefAttachmentBoundarySummary().includes('No upload'))
assert.equal(redactProjectEditBriefAttachmentReferenceUrlForUI('https://example.com/private/path?token=abc'), 'https://example.com/...')

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: true,
})
const initialPanel = await loadProjectEditBriefAttachmentPanelForUI(markerId, client)
assert.ok(initialPanel, 'Attachment panel should load for fixture marker')
assertFalseFlags(initialPanel, 'initialPanel')
const needsAssetMarker = await client.markers.update<{ marker: { status: string; qaStatus: string } }>({
  markerId,
  patch: {
    status: 'needs_asset',
    qaStatus: 'needs_asset',
    metadata: {
      smokeNeedsAssetBeforeAttachment: true,
      noPlannerApplication: true,
    },
  },
})
assert.equal(needsAssetMarker.data?.marker.status, 'needs_asset', 'Smoke marker should enter needs-asset state before attachment bridge.')

const brollDraft = {
  ...createProjectEditBriefAttachmentDraftFromPanelForUI({ panel: initialPanel }),
  attachmentKind: 'broll_video' as const,
  label: 'rp08-city-broll-metadata.mp4',
  notes: ['Metadata-only B-roll label; no upload.'],
}
const brollValidation = validateProjectEditBriefAttachmentDraftForUI(brollDraft)
assert.equal(brollValidation.ok, true)
assertFalseFlags(brollValidation, 'brollValidation')
const addBroll = await addProjectEditBriefMetadataAttachmentViaApi(brollDraft, client)
assert.ok(addBroll.attachment, 'B-roll metadata attachment should save')
assert.equal(addBroll.attachment?.attachmentKind, 'broll_video')
assert.equal(addBroll.attachment?.label, 'rp08-city-broll-metadata.mp4')
assertFalseFlags(addBroll, 'addBroll')
const afterNeedsAssetBridge = await loadProjectEditBriefAttachmentPanelForUI(markerId, client, addBroll.attachment?.id)
assert.equal(afterNeedsAssetBridge?.attachments.some((attachment) => attachment.id === addBroll.attachment?.id), true)
const drawerAfterBridge = await client.drawer.get<{ drawer: { marker: { status: string; qaStatus: string } } }>(markerId)
assert.equal(drawerAfterBridge.data?.drawer.marker.status, 'draft', 'Metadata-only attachment should reduce needs-asset marker to draft for user confirmation.')
assert.equal(drawerAfterBridge.data?.drawer.marker.qaStatus, 'not_checked', 'Metadata-only attachment should reset marker QA for re-check.')

const urlDraft = {
  ...createProjectEditBriefAttachmentDraftFromPanelForUI({
    panel: initialPanel,
    attachmentKind: 'reference_url_metadata_only',
  }),
  label: 'safe reference URL',
  referenceUrl: 'https://example.com/reference/private-clip',
}
const addUrl = await addProjectEditBriefMetadataAttachmentViaApi(urlDraft, client)
assert.ok(addUrl.attachment, 'Reference URL metadata attachment should save')
assert.equal(addUrl.attachment?.attachmentKind, 'reference_url_metadata_only')
assert.equal(addUrl.attachment?.metadata?.referenceUrlFetched, false)
assertFalseFlags(addUrl, 'addUrl')

const audioDraft = {
  ...createProjectEditBriefAttachmentDraftFromPanelForUI({
    panel: initialPanel,
    attachmentKind: 'sfx',
  }),
  label: 'soft-whoosh-metadata.wav',
}
const addAudio = await addProjectEditBriefMetadataAttachmentViaApi(audioDraft, client)
assert.ok(addAudio.attachment, 'SFX metadata attachment should save')
assert.ok(addAudio.warnings.join(' ').includes('metadata'))
assertFalseFlags(addAudio, 'addAudio')

const afterAddPanel = await loadProjectEditBriefAttachmentPanelForUI(markerId, client, addBroll.attachment?.id)
assert.ok(afterAddPanel?.attachments.some((attachment) => attachment.label === 'rp08-city-broll-metadata.mp4'))
assert.ok(afterAddPanel?.attachments.some((attachment) => attachment.referenceUrlLabel === 'https://example.com/...'))
assertFalseFlags(afterAddPanel!, 'afterAddPanel')

const bridge = createProjectEditBriefAttachmentIntentBridgeForUI({
  intent: undefined,
  attachments: [addBroll.attachment!, addUrl.attachment!, addAudio.attachment!],
})
assert.ok(bridge.providedAssetIds.includes(addBroll.attachment!.id))
assert.notEqual(bridge.statusSuggestion, 'ready_for_plan')
assertFalseFlags(bridge, 'bridge')

const orchestratorBridge = runMockAttachmentIntentBridgeFlow()
assert.notEqual(orchestratorBridge.intentBridge?.statusSuggestion, 'ready_for_plan')
assertFalseFlags(orchestratorBridge, 'orchestratorBridge')
const readiness = runMockAttachmentReadinessFlow()
assert.equal(readiness.nextStep, 'RP-EDITBRIEF-09 — Export Settings Auto-Recommendation + Brief Access')
assertFalseFlags(readiness, 'readiness')

const uploadDraft = {
  ...brollDraft,
  inputMode: 'future_upload_placeholder' as const,
}
const uploadValidation = validateProjectEditBriefAttachmentDraftForUI(uploadDraft)
assert.equal(uploadValidation.ok, false)
assert.equal(uploadValidation.safetyStatus, 'blocked_upload_gate')

const removeBroll = await removeProjectEditBriefAttachmentViaApi(addBroll.attachment!.id, client)
assert.equal(removeBroll.removed, true)
assertFalseFlags(removeBroll, 'removeBroll')
const afterRemovePanel = await loadProjectEditBriefAttachmentPanelForUI(markerId, client)
assert.equal(afterRemovePanel?.attachments.some((attachment) => attachment.id === addBroll.attachment!.id), false)

const sideEffectValidation = validateNoProjectEditBriefAttachmentSideEffects(PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS as unknown as Record<string, unknown>)
assert.equal(sideEffectValidation.ok, true)
assertFalseFlags(sideEffectValidation, 'sideEffectValidation')

for (const path of [
  'docs/project-edit-brief-marker-attachments-system.md',
  'docs/project-edit-brief-attachment-ui.md',
  'docs/project-edit-brief-attachment-metadata-policy.md',
  'docs/project-edit-brief-attachment-intent-bridge.md',
  'docs/project-edit-brief-attachment-boundary.md',
  'docs/project-edit-brief-attachment-next-export-settings.md',
]) {
  assertDoc(path)
}

for (const path of [
  'src/lib/project-edit-brief-attachment-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefAttachmentPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefAttachmentForm.tsx',
  'src/components/projects/brief/ProjectEditBriefAttachmentChip.tsx',
]) {
  const content = readFileSync(join(root, path), 'utf8')
  assert.equal(/from ['"].*backend/.test(content), false, `${path} must not import backend modules`)
  assert.equal(content.includes('MockDatabase'), false, `${path} must not import MockDatabase`)
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-attachments'], 'tsx server/smoke/project-edit-brief-attachments-smoke.ts')

const migrationCount = readdirSync(join(root, 'supabase/migrations')).filter((name) => !name.startsWith('.')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain 24')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-attachments',
  status: 'passed',
  scenarios: scenarioCount,
  migrationCount,
  boundaries: {
    uploadStarted: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    soundRuntimeStarted: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  },
}, null, 2))
