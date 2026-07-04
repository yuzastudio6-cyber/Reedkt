import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  MOCK_PROJECT_EDIT_BRIEF_FIXTURE_BUNDLE,
  createMockProjectEditBriefFixtureBundle,
} from '../../src/lib/mock-project-edit-briefs'
import {
  createProjectEditBriefAttachmentChipModel,
  createProjectEditBriefAvailabilitySummary,
  createProjectEditBriefBundle,
  createProjectEditBriefFixtureBundleSummary,
  createProjectEditBriefMarkerDrawerModels,
  createProjectEditBriefStatusBadges,
} from '../../src/lib/project-edit-brief-fixture-mappers'
import {
  createProjectEditBriefAttachmentSummary,
  createProjectEditBriefConflictSummary,
  createProjectEditBriefDebugSummary,
  createProjectEditBriefExportSettingsSummary,
  createProjectEditBriefIntentReadableSummary,
  createProjectEditBriefMarkerReadableSummary,
  createProjectEditBriefReadableSummary,
} from '../../src/lib/project-edit-brief-summary-mappers'
import {
  createProjectEditBriefTimelineMarkerModels,
  createProjectEditBriefTimelineSummary,
  getProjectEditBriefMarkerColorToken,
  getProjectEditBriefMarkerIconLabel,
  getProjectEditBriefMarkerLane,
} from '../../src/lib/project-edit-brief-timeline-mappers'
import { MOCK_PROJECT_EDIT_BRIEF_SCENARIOS } from '../../src/backend/mock/mock-project-edit-brief-scenarios'
import {
  runMockProjectEditBriefAttachmentFlow,
  runMockProjectEditBriefConflictFlow,
  runMockProjectEditBriefExportSettingsFlow,
  runMockProjectEditBriefFixtureFlow,
  runMockProjectEditBriefIntentFlow,
  runMockProjectEditBriefMarkerChatFlow,
  runMockProjectEditBriefMarkerDrawerFlow,
  runMockProjectEditBriefSummaryFlow,
  runMockProjectEditBriefTimelineFlow,
} from '../../src/backend/orchestrators/mock-project-edit-brief-orchestrator'
import type {
  CreateProjectEditBriefRequest,
  GetProjectEditBriefBundleRequest,
  ProjectEditBriefContractResponseMeta,
} from '../../src/backend/contracts/project-edit-brief-contracts'
import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefRecord,
} from '../../src/types/project-edit-brief'

const repoRoot = process.cwd()

const requiredDocs = [
  'docs/project-edit-brief-type-contracts.md',
  'docs/project-edit-brief-mock-fixtures.md',
  'docs/project-edit-brief-marker-status-model.md',
  'docs/project-edit-brief-marker-intent-contract.md',
  'docs/project-edit-brief-attachment-contract.md',
  'docs/project-edit-brief-export-settings-contract.md',
  'docs/project-edit-brief-contract-boundary.md',
]

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

function recordsAreMockOnly(records: Array<{ mockOnly: boolean }>): boolean {
  return records.every((record) => record.mockOnly === true)
}

const createRequest: CreateProjectEditBriefRequest = {
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-vertical-dna',
  title: 'Smoke Brief',
  mockOnly: true,
}

const bundleRequest: GetProjectEditBriefBundleRequest = {
  projectId: createRequest.projectId,
  editSessionId: createRequest.editSessionId,
  briefId: 'project-edit-brief-broll-attached',
  mockOnly: true,
}

const meta: ProjectEditBriefContractResponseMeta = {
  mockOnly: true,
  contractOnly: true,
  repositoryImplemented: false,
  apiHandlerImplemented: false,
  uiBehaviorChanged: false,
  supabaseCommandRun: false,
  migrationCreated: false,
  warnings: [],
}

assert.equal(createRequest.mockOnly, true, 'create request type should compile')
assert.equal(bundleRequest.mockOnly, true, 'bundle request type should compile')
assert.equal(meta.repositoryImplemented, false, 'contract meta should remain repository-free')

const fixture = createMockProjectEditBriefFixtureBundle()
assert.equal(MOCK_PROJECT_EDIT_BRIEF_FIXTURE_BUNDLE.briefs.length, fixture.briefs.length)
assert.ok(fixture.briefs.length >= 12, 'fixture bundle should include at least 12 briefs')
assert.ok(fixture.markers.length > 0, 'markers should exist')
assert.ok(fixture.attachments.length > 0, 'attachments should exist')
assert.ok(fixture.messages.length > 0, 'marker messages should exist')
assert.ok(fixture.intents.length > 0, 'intents should exist')
assert.ok(fixture.confirmations.length > 0, 'confirmations should exist')
assert.ok(fixture.conflicts.length > 0, 'conflicts should exist')
assert.ok(fixture.revisions.length > 0, 'revisions should exist')
assert.ok(fixture.applicationLogs.length > 0, 'application logs should exist')
assert.ok(fixture.exportSettings.length >= fixture.briefs.length, 'export settings should exist')
assert.ok(fixture.timelineMarkers.length > 0, 'timeline marker models should exist')
assert.equal(fixture.bundles.length, fixture.briefs.length, 'one joined bundle should exist per brief')

const allRecords = [
  ...fixture.briefs,
  ...fixture.markers,
  ...fixture.attachments,
  ...fixture.messages,
  ...fixture.intents,
  ...fixture.confirmations,
  ...fixture.conflicts,
  ...fixture.revisions,
  ...fixture.applicationLogs,
  ...fixture.exportSettings,
  ...fixture.timelineMarkers,
  ...fixture.bundles,
]
assert.equal(recordsAreMockOnly(allRecords), true, 'all fixtures should be mockOnly')

const optionalBrief = fixture.briefs.find((brief) => brief.id === 'project-edit-brief-optional-not-opened')
assert.equal(optionalBrief?.availability, 'optional_not_opened', 'optional not-opened brief should exist')
const activeEmpty = fixture.briefs.find((brief) => brief.id === 'project-edit-brief-active-empty')
assert.equal(activeEmpty?.markerCount, 0, 'active empty brief should have no markers')
assert.ok(fixture.markers.some((marker) => marker.markerType === 'broll' && marker.status === 'ready_for_plan'))
assert.ok(fixture.markers.some((marker) => marker.markerType === 'broll' && marker.status === 'needs_asset'))
assert.ok(fixture.markers.some((marker) => marker.markerType === 'music_soundtrack'))
assert.ok(fixture.markers.some((marker) => marker.markerType === 'caption_text'))
assert.ok(fixture.markers.some((marker) => marker.markerType === 'cut_remove'))
assert.ok(fixture.markers.some((marker) => marker.markerType === 'do_not_use'))
assert.ok(fixture.markers.some((marker) => marker.status === 'needs_clarification'))
assert.ok(fixture.markers.some((marker) => marker.status === 'conflict'))
assert.ok(fixture.briefs.some((brief) => brief.status === 'changed_after_plan'))

const brollMarker = fixture.markers.find((marker) => marker.id === 'marker-broll-city')
assert.ok(brollMarker, 'b-roll marker should exist')
assert.equal(getProjectEditBriefMarkerLane(brollMarker.markerType), 'visual')
assert.equal(getProjectEditBriefMarkerIconLabel('cut_remove'), 'CUT')
assert.equal(getProjectEditBriefMarkerColorToken('conflict'), 'edit-brief-marker-danger')

const timelineMarkers = createProjectEditBriefTimelineMarkerModels(fixture.markers)
assert.equal(timelineMarkers.length, fixture.markers.length)
assert.match(createProjectEditBriefTimelineSummary(timelineMarkers), /timeline markers/)

const brollBrief = fixture.briefs.find((brief) => brief.id === 'project-edit-brief-broll-attached') as ProjectEditBriefRecord
const brollBundle = createProjectEditBriefBundle(brollBrief, fixture) as ProjectEditBriefBundleRecord
assert.equal(brollBundle.mockOnly, true)
assert.ok(brollBundle.attachments.length > 0)

const drawerModels = createProjectEditBriefMarkerDrawerModels(fixture)
assert.equal(drawerModels.length, fixture.markers.length)
assert.ok(drawerModels.some((drawer) => drawer.confirmations.length > 0), 'drawer should include confirmations')
assert.ok(drawerModels.some((drawer) => drawer.conflicts.length > 0), 'drawer should include conflicts')

const firstAttachment = fixture.attachments[0]
assert.equal(createProjectEditBriefAttachmentChipModel(firstAttachment).mockOnly, true)
assert.match(createProjectEditBriefAttachmentSummary(firstAttachment), /metadata-only/i)
assert.match(createProjectEditBriefAvailabilitySummary(optionalBrief as ProjectEditBriefRecord), /optional/i)
assert.ok(createProjectEditBriefStatusBadges(brollBrief, brollBundle.markers).includes('mock only'))
assert.match(createProjectEditBriefReadableSummary(brollBrief), /B-roll/i)
assert.match(createProjectEditBriefMarkerReadableSummary(brollMarker), /B-roll|b-roll/i)
assert.match(createProjectEditBriefIntentReadableSummary(fixture.intents[0]), /confidence/i)
assert.match(createProjectEditBriefConflictSummary(fixture.conflicts[0]), /Resolution/i)
assert.match(createProjectEditBriefExportSettingsSummary(fixture.exportSettings[0]), /fps/i)

const fixtureSummary = createProjectEditBriefFixtureBundleSummary(fixture)
assert.equal(fixtureSummary.mockOnly, true)
assert.equal(fixtureSummary.briefCount, fixture.briefs.length)

const debug = createProjectEditBriefDebugSummary(fixture)
assert.equal(debug.noExecution, true)
assert.ok(debug.warningCount > 0, 'debug summary should report fixture warnings')

const serialized = JSON.stringify(fixture)
for (const forbidden of [
  '"providerCallMade":true',
  '"renderJobCreated":true',
  '"creditReservedOrSpent":true',
  '"fileBytesRead":true',
  '"storageWriteMade":true',
  '"signedUrlCreated":true',
  '"supabaseCommandRun":true',
]) {
  assert.equal(serialized.includes(forbidden), false, `fixture should not include ${forbidden}`)
}

assert.ok(MOCK_PROJECT_EDIT_BRIEF_SCENARIOS.length >= 60, 'at least 60 scenarios should exist')
assert.equal(MOCK_PROJECT_EDIT_BRIEF_SCENARIOS.every((scenario) => scenario.mockOnly), true)
assert.equal(MOCK_PROJECT_EDIT_BRIEF_SCENARIOS.every((scenario) => scenario.expectedOk), true)

const flows = [
  runMockProjectEditBriefFixtureFlow(),
  runMockProjectEditBriefTimelineFlow(),
  runMockProjectEditBriefMarkerDrawerFlow(),
  runMockProjectEditBriefMarkerChatFlow(),
  runMockProjectEditBriefIntentFlow(),
  runMockProjectEditBriefAttachmentFlow(),
  runMockProjectEditBriefExportSettingsFlow(),
  runMockProjectEditBriefConflictFlow(),
  runMockProjectEditBriefSummaryFlow(),
]
for (const flow of flows) {
  assert.equal(flow.nextStep, 'RP-EDITBRIEF-03 — Mock Repository Layer')
  assert.ok(flow.briefs.length >= 12)
  assert.ok(flow.bundles.length >= 12)
  assert.ok(flow.summary.scenarioCount)
}

for (const doc of requiredDocs) {
  const absolutePath = path.join(repoRoot, doc)
  assert.equal(existsSync(absolutePath), true, `${doc} should exist`)
  const text = read(doc)
  assert.match(text, /Edit Brief/)
  assert.match(text, /ProjectEditSession/)
  assert.match(text, /Marker/)
  assert.match(text, /no (repository|API handler|Supabase command)/i)
}

const typeIndex = read('src/types/index.ts')
assert.match(typeIndex, /project-edit-brief/, 'types index should export project-edit-brief')

const contractIndex = read('src/backend/contracts/index.ts')
assert.match(contractIndex, /project-edit-brief-contracts/, 'contracts index should export project-edit-brief contracts')

const backendIndex = read('src/backend/index.ts')
assert.match(backendIndex, /mock-project-edit-brief-orchestrator/, 'backend index should export orchestrator')
assert.match(backendIndex, /mock-project-edit-brief-scenarios/, 'backend index should export scenarios')

assert.equal(migrationCount(), 24, 'Supabase migration count should remain 24')

console.log('RP-EDITBRIEF-02 smoke passed')
