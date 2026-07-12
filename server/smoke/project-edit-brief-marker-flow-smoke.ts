import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createDefaultMockProjectEditBriefApiClient,
} from '../../src/lib/project-edit-brief-api-client'
import {
  createProjectEditBriefMarkerDraftForUI,
  createProjectEditBriefMarkerFlowBoundarySummary,
  createProjectEditBriefMarkerFormModel,
  saveProjectEditBriefMarkerViaApi,
  updateProjectEditBriefMarkerViaApi,
  confirmProjectEditBriefMarkerViaApi,
  archiveProjectEditBriefMarkerViaApi,
} from '../../src/lib/project-edit-brief-marker-flow-ui-adapter'
import { loadProjectEditBriefWorkspaceForUI } from '../../src/lib/project-edit-brief-ui-adapter'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-youtube-wide'

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

const requiredFiles = [
  'src/lib/project-edit-brief-marker-flow-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefAddMarkerButton.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerDrawer.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerTypePicker.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerPriorityPicker.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerTimeEditor.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerAIModePicker.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerStatusControls.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerActionBar.tsx',
  'docs/project-edit-brief-marker-creation-flow.md',
  'docs/project-edit-brief-marker-drawer-ui.md',
  'docs/project-edit-brief-marker-timeline-interaction.md',
  'docs/project-edit-brief-marker-action-boundary.md',
  'docs/project-edit-brief-marker-next-chat-flow.md',
  'tests/e2e/project-edit-brief-marker-flow.spec.ts',
]

requiredFiles.forEach((path) => assert.equal(existsSync(file(path)), true, `${path} should exist`))

const adapter = read('src/lib/project-edit-brief-marker-flow-ui-adapter.ts')
assert.match(adapter, /createProjectEditBriefMarkerDraftForUI/)
assert.match(adapter, /saveProjectEditBriefMarkerViaApi/)
assert.match(adapter, /updateProjectEditBriefMarkerViaApi/)
assert.match(adapter, /confirmProjectEditBriefMarkerViaApi/)
assert.match(adapter, /archiveProjectEditBriefMarkerViaApi/)
assert.doesNotMatch(adapter, /src\/backend|\.\.\/backend|MockDatabase|type="file"|uploadFile|readFile/i)

const componentFiles = readdirSync(file('src/components/projects/brief'))
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => `src/components/projects/brief/${name}`)

componentFiles.forEach((path) => {
  const source = read(path)
  assert.doesNotMatch(source, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/, `${path} should not import backend code`)
  const hasDisabledFilePlaceholder = /type="file"/.test(source) && /disabled/.test(source)
  const isLocalSourceVideoPicker = path.endsWith('ProjectEditBriefSourceVideoPicker.tsx')
  assert.equal(/type="file"/.test(source) && !hasDisabledFilePlaceholder && !isLocalSourceVideoPicker, false, `${path} should not add active file upload UI`)
  assert.doesNotMatch(source, /\b(?:uploadFile|readFile|renderJob|creditReserved)\b/i, `${path} should not add upload/render/credit UI`)
})

const docsCombined = requiredFiles
  .filter((path) => path.startsWith('docs/'))
  .map(read)
  .join('\n')

for (const phrase of [
  'RP-EDITBRIEF-06',
  'mock/local',
  'Add Marker',
  'Archive',
  'Marker Chat',
  'No Supabase',
  'Production ready: false',
]) {
  assert.match(docsCombined, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const boundary = createProjectEditBriefMarkerFlowBoundarySummary()
assert.equal(boundary.mockOnly, true)
assert.equal(boundary.providerCallMade, false)
assert.equal(boundary.supabaseWriteMade, false)
assert.equal(boundary.fileBytesRead, false)
assert.equal(boundary.mediaProcessingStarted, false)
assert.equal(boundary.renderJobCreated, false)
assert.equal(boundary.creditReservedOrSpent, false)

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: false,
})

const initialModel = await loadProjectEditBriefWorkspaceForUI({
  client,
  editSessionId,
  projectId,
  playheadSeconds: 21,
})
assert.ok(initialModel.brief)
assert.ok(initialModel.timeline.markers.length >= 1)
assert.equal(initialModel.boundary.providerCallMade, false)
assert.equal(initialModel.boundary.supabaseWriteMade, false)

const createDraft = createProjectEditBriefMarkerDraftForUI({
  briefId: initialModel.brief.id,
  editSessionId,
  playheadSeconds: 21,
  projectId,
})
createDraft.markerType = 'broll'
createDraft.title = 'Add product counter B-roll'
createDraft.userNote = 'Use a short product counter cutaway here when future assets exist.'

const createForm = createProjectEditBriefMarkerFormModel(createDraft)
assert.equal(createForm.canSave, true)
const created = await saveProjectEditBriefMarkerViaApi(createDraft, client)
assert.ok(created.marker)
assert.equal(created.marker.markerType, 'broll')
assert.equal(created.marker.status, 'draft')
assert.equal(created.marker.startTimeSeconds, 21)

const updateDraft = createProjectEditBriefMarkerDraftForUI({
  briefId: created.marker.briefId,
  editSessionId: created.marker.editSessionId,
  marker: created.marker,
  projectId: created.marker.projectId,
})
updateDraft.userNote = 'Updated mock/local marker note for the product counter cutaway.'
const updated = await updateProjectEditBriefMarkerViaApi(updateDraft, client)
assert.ok(updated.marker)
assert.equal(updated.marker.userNote, updateDraft.userNote)

const confirmed = await confirmProjectEditBriefMarkerViaApi(updated.marker.id, updated.marker.title, client)
assert.ok(confirmed.marker)
const confirmedMarker = confirmed.marker
assert.equal(confirmedMarker.status, 'confirmed')

const archived = await archiveProjectEditBriefMarkerViaApi(confirmedMarker.id, client)
assert.ok(archived.data?.marker)
assert.equal(archived.data.marker.status, 'archived')

const afterArchiveModel = await loadProjectEditBriefWorkspaceForUI({
  client,
  editSessionId,
  projectId,
  selectedMarkerId: confirmedMarker.id,
})
assert.equal(afterArchiveModel.timeline.markers.some((marker) => marker.markerId === confirmedMarker.id), false)
assert.equal(afterArchiveModel.boundary.workerJobCreated, false)
assert.equal(afterArchiveModel.boundary.generationRequestCreated, false)
assert.equal(afterArchiveModel.boundary.renderJobCreated, false)
assert.equal(afterArchiveModel.boundary.creditReservedOrSpent, false)

const packageLock = read('package-lock.json')
assert.doesNotMatch(packageLock, /project-edit-brief-marker-flow/)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-06',
  createdMarkerId: created.marker.id,
  archivedMarkerHiddenFromTimeline: true,
  mockOnly: true,
  noBackendImportsInBriefComponents: true,
  noSupabaseCommandRun: true,
  noRenderProgressOrCreditsUi: true,
  productionReady: false,
  nextStep: 'RP-EDITBRIEF-07 — Marker Chat flow',
}, null, 2))
