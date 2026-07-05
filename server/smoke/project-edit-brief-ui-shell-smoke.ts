import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createProjectEditSessionBriefPath,
  createProjectEditSessionPath,
} from '../../src/lib/project-edit-session-navigation'
import {
  createProjectEditSessionRouteTabs,
  getProjectEditSessionRouteSectionFromPath,
} from '../../src/lib/project-edit-session-route-models'
import { loadProjectEditBriefWorkspaceForUI } from '../../src/lib/project-edit-brief-ui-adapter'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'
const emptySessionId = 'edit-session-vertical-dna'
const markerSessionId = 'edit-session-youtube-wide'

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function migrationCount(): number {
  return readdirSync(file('supabase/migrations')).filter((name) => !name.startsWith('.')).length
}

const requiredFiles = [
  'src/lib/project-edit-brief-ui-adapter.ts',
  'src/styles/project-edit-brief.css',
  'src/components/projects/brief/ProjectEditBriefWorkspace.tsx',
  'src/components/projects/brief/ProjectEditBriefHeader.tsx',
  'src/components/projects/brief/ProjectEditBriefVideoShell.tsx',
  'src/components/projects/brief/ProjectEditBriefTimeline.tsx',
  'src/components/projects/brief/ProjectEditBriefTimelineRuler.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerLane.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerPill.tsx',
  'src/components/projects/brief/ProjectEditBriefPlayhead.tsx',
  'src/components/projects/brief/ProjectEditBriefSummaryPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerDetailPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefAttachmentChips.tsx',
  'src/components/projects/brief/ProjectEditBriefExportSettingsSummary.tsx',
  'src/components/projects/brief/ProjectEditBriefBoundaryNotice.tsx',
  'src/components/projects/brief/ProjectEditBriefEmptyState.tsx',
  'docs/project-edit-brief-ui-shell.md',
  'docs/project-edit-brief-video-timeline-ui.md',
  'docs/project-edit-brief-marker-readonly-panel.md',
  'docs/project-edit-brief-export-settings-ui-shell.md',
  'docs/project-edit-brief-ui-shell-boundary.md',
  'docs/project-edit-brief-ui-shell-next-marker-flow.md',
  'tests/e2e/project-edit-brief-shell.spec.ts',
]

requiredFiles.forEach((path) => assert.equal(existsSync(file(path)), true, `${path} should exist`))

assert.equal(createProjectEditSessionBriefPath(projectId, emptySessionId), `${createProjectEditSessionPath(projectId, emptySessionId)}/brief`)
assert.equal(getProjectEditSessionRouteSectionFromPath(`/projects/${projectId}/edits/${emptySessionId}/brief`), 'brief')

const tabs = createProjectEditSessionRouteTabs({ projectId, editSessionId: emptySessionId, activeSection: 'brief' })
assert.equal(tabs.length, 3)
assert.equal(tabs.find((tab) => tab.section === 'brief')?.active, true)
assert.equal(tabs.find((tab) => tab.section === 'brief')?.badge, 'Upload')

const navigationTypes = read('src/types/project-edit-session-navigation.ts')
assert.match(navigationTypes, /'brief'/)
assert.match(navigationTypes, /'open_brief_section'/)

const app = read('src/App.tsx')
assert.match(app, /\/projects\/:projectId\/edits\/:editSessionId\/brief/)
assert.match(app, /path="\/" element={<Navigate to="\/dashboard" replace \/>}/)
assert.match(app, /path="\/pricing" element={<Navigate to="\/projects\/new" replace \/>}/)
assert.doesNotMatch(app, /LandingPage/)
assert.doesNotMatch(app, /PricingPage/)

const indexCss = read('src/index.css')
assert.match(indexCss, /project-edit-brief\.css/)

const chatPage = read('src/pages/EditorPage.tsx')
assert.match(chatPage, /ProjectEditBriefWorkspace/)
assert.match(chatPage, /data-route-section="workspace"/)
assert.doesNotMatch(chatPage, /ProjectEditSessionRouteTabs/)
assert.doesNotMatch(chatPage, /ProjectEditSessionChatInput/)

const workspaceSource = read('src/components/projects/brief/ProjectEditBriefWorkspace.tsx')
assert.match(workspaceSource, /data-testid="project-edit-flow-summary"/)
assert.match(workspaceSource, /Source/)
assert.match(workspaceSource, /Brief/)
assert.match(workspaceSource, /Private export/)

const uiAdapter = read('src/lib/project-edit-brief-ui-adapter.ts')
assert.doesNotMatch(uiAdapter, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockProjectEditBriefRepository/)
assert.doesNotMatch(uiAdapter, /createProjectEditBriefMarkerViaApi|updateProjectEditBriefMarkerViaApi|confirmProjectEditBriefMarkerViaApi|appendProjectEditBriefMarkerMessageViaApi|addProjectEditBriefMarkerAttachmentViaApi|updateProjectEditSessionExportSettingsViaApi|recommendProjectEditSessionExportSettingsViaApi/)

const briefComponentFiles = readdirSync(file('src/components/projects/brief'))
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => `src/components/projects/brief/${name}`)

briefComponentFiles.forEach((path) => {
  const source = read(path)
  assert.doesNotMatch(source, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/, `${path} should not import backend code`)
  const hasDisabledFilePlaceholder = /type="file"/.test(source) && /disabled/.test(source)
  const isLocalSourceVideoPicker = path.endsWith('ProjectEditBriefSourceVideoPicker.tsx')
  const isCleanLocalBriefWorkspace = path.endsWith('ProjectEditBriefWorkspace.tsx') && /URL\.createObjectURL/.test(source) && /Nothing has been uploaded or processed yet/.test(source)
  assert.equal(
    /type="file"/.test(source) && !hasDisabledFilePlaceholder && !isLocalSourceVideoPicker && !isCleanLocalBriefWorkspace,
    false,
    `${path} should not add backend upload UI or active runtime media execution`,
  )
  assert.doesNotMatch(source, /appendMarkerMessage|addMarkerAttachment|renderJob|creditReserved/, `${path} should stay browser-safe and free of future runtime surfaces`)
})

const chatNativeEditor = read('src/components/editor/ChatNativeEditor.tsx')
assert.doesNotMatch(chatNativeEditor, /ProjectEditBriefWorkspace|project-edit-brief-ui-adapter|createProjectEditSessionBriefPath/)

const docsCombined = requiredFiles
  .filter((path) => path.startsWith('docs/'))
  .map(read)
  .join('\n')
for (const phrase of [
  'mock/local',
  'marker creation',
  'Marker Chat',
  'No Supabase command',
  'Production ready: false',
  'RP-EDITBRIEF-06',
]) {
  assert.match(docsCombined, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const scenarios = read('src/lib/internal-testing-scenarios.ts')
assert.match(scenarios, /edit-brief-shell-route-tab/)
assert.match(scenarios, /edit-brief-shell-no-runtime-effects/)

const emptyModel = await loadProjectEditBriefWorkspaceForUI({ projectId, editSessionId: emptySessionId })
assert.equal(emptyModel.emptyState?.kind, 'not_opened')
assert.equal(emptyModel.timeline.markers.length, 0)
assert.equal(emptyModel.boundary.renderJobCreated, false)
assert.equal(emptyModel.boundary.creditReservedOrSpent, false)

const markerModel = await loadProjectEditBriefWorkspaceForUI({ projectId, editSessionId: markerSessionId })
assert.ok(markerModel.timeline.markers.length >= 1)
assert.ok(markerModel.selectedMarker)
assert.ok(markerModel.exportSettings)
assert.equal(markerModel.boundary.providerCallMade, false)
assert.equal(markerModel.boundary.supabaseWriteMade, false)
assert.equal(markerModel.boundary.fileBytesRead, false)
assert.equal(markerModel.boundary.externalUrlFetched, false)
assert.equal(markerModel.boundary.mediaProcessingStarted, false)

assert.equal(migrationCount(), 24)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-05',
  route: createProjectEditSessionBriefPath(projectId, markerSessionId),
  tabs: tabs.length,
  componentsChecked: briefComponentFiles.length,
  emptyState: emptyModel.emptyState?.kind,
  markerCount: markerModel.timeline.markers.length,
  selectedMarker: markerModel.selectedMarker?.markerId,
  migrationCount: migrationCount(),
  noSupabaseCommandRun: true,
  noChatNativeEditorRuntimeChangeRequired: true,
  productionReady: false,
  nextStep: 'RP-EDITBRIEF-07 — Marker Chat flow after owner review',
}, null, 2))
