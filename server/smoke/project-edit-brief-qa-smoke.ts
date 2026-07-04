import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import { getProjectEditBriefBundleViaApi } from '../../src/lib/project-edit-brief-api-client-adapter'
import {
  PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  createProjectEditBriefQABoundarySummary,
  createProjectEditBriefQASummaryModel,
  loadProjectEditBriefQAPackageForUI,
  runProjectEditBriefMarkerQAViaApi,
  runProjectEditBriefQAViaApi,
} from '../../src/lib/project-edit-brief-qa-ui-adapter'
import {
  PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  createProjectEditBriefQAPackage,
  createProjectEditBriefQAFindingSummary,
  detectProjectEditBriefAudioConflicts,
  detectProjectEditBriefCopyRisk,
  detectProjectEditBriefExportWarnings,
  detectProjectEditBriefInvalidTimeRange,
  detectProjectEditBriefMissingAsset,
  detectProjectEditBriefNeedsClarification,
  detectProjectEditBriefOverlapConflicts,
  runProjectEditBriefMarkerQA,
} from '../../src/lib/project-edit-brief-qa-rules'
import { createMockProjectEditBriefFixtureBundle } from '../../src/lib/mock-project-edit-briefs'
import {
  createProjectEditBriefQAPolicy,
  createProjectEditBriefQAPrioritySummary,
  listMockProjectEditBriefQAScenarios,
  runMockAudioConflictQAFlow,
  runMockBriefQAPackageFlow,
  runMockCopyRiskQAFlow,
  runMockExportWarningQAFlow,
  runMockMissingAssetQAFlow,
  runMockOverlapConflictQAFlow,
  runMockProjectEditBriefQAFlow,
  validateNoProjectEditBriefQASideEffects,
  validateProjectEditBriefQAFinding,
  validateProjectEditBriefQAPackage,
} from '../../src/backend'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'

function assertFalseFlags(value: unknown, label: string) {
  const record = value as Record<string, unknown>
  for (const key of Object.keys(PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS)) {
    assert.equal(record[key], false, `${label}.${key} must remain false`)
  }
}

function assertDoc(path: string) {
  const fullPath = join(root, path)
  assert.ok(existsSync(fullPath), `${path} should exist`)
  const content = readFileSync(fullPath, 'utf8')
  for (const phrase of [
    'Marker QA',
    'mock/local',
    'no Qwen',
    'no DeepSeek',
    'no providers',
    'no workers',
    'no render',
    'no credits',
    'no Supabase command',
    'no planner application',
    'owner review',
  ]) {
    assert.ok(content.includes(phrase), `${path} should include ${phrase}`)
  }
}

const fixture = createMockProjectEditBriefFixtureBundle()
const bundle = fixture.bundles.find((candidate) => candidate.markers.length > 0)
assert.ok(bundle, 'Fixture bundle with markers should exist')
const baseMarker = bundle.markers[0]

const policy = createProjectEditBriefQAPolicy()
assert.equal(policy.mockOnly, true)
assert.ok(createProjectEditBriefQAPrioritySummary().includes('Safety / do-not-copy'))

const missingAssetMarker = {
  ...baseMarker,
  id: 'smoke-missing-broll-marker',
  markerType: 'broll' as const,
  title: 'Missing B-roll marker',
  userNote: 'Add B-roll here',
}
const missingAsset = detectProjectEditBriefMissingAsset({
  marker: missingAssetMarker,
  allMarkers: [missingAssetMarker],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(missingAsset?.qaStatus, 'needs_asset')
assert.equal(missingAsset?.findingType, 'missing_asset')
assertFalseFlags(missingAsset!, 'missingAsset')

const vagueMarker = {
  ...baseMarker,
  id: 'smoke-vague-marker',
  title: 'Make this better',
  userNote: 'Make this better',
}
const vague = detectProjectEditBriefNeedsClarification({
  marker: vagueMarker,
  allMarkers: [vagueMarker],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(vague?.qaStatus, 'needs_clarification')

const invalidMarker = {
  ...baseMarker,
  id: 'smoke-invalid-range',
  title: 'Invalid range',
  startTimeSeconds: 20,
  endTimeSeconds: 10,
  timeMode: 'range' as const,
}
assert.equal(detectProjectEditBriefInvalidTimeRange({
  marker: invalidMarker,
  allMarkers: [invalidMarker],
  attachments: [],
  exportSettings: bundle.exportSettings,
})?.qaStatus, 'blocked')

const cut = {
  ...baseMarker,
  id: 'smoke-cut-conflict',
  markerType: 'cut_remove' as const,
  title: 'Cut this section',
  startTimeSeconds: 10,
  endTimeSeconds: 20,
  timeMode: 'range' as const,
}
const broll = {
  ...baseMarker,
  id: 'smoke-broll-conflict',
  markerType: 'broll' as const,
  title: 'Add B-roll here',
  startTimeSeconds: 12,
  endTimeSeconds: 18,
  timeMode: 'range' as const,
}
const overlap = detectProjectEditBriefOverlapConflicts({
  marker: cut,
  allMarkers: [cut, broll],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(overlap[0]?.conflictKind, 'cut_vs_broll')
assert.equal(overlap[0]?.qaStatus, 'conflict')

const noMusic = {
  ...baseMarker,
  id: 'smoke-no-music',
  title: 'No music',
  userNote: 'No music here',
  startTimeSeconds: 10,
  endTimeSeconds: 20,
  timeMode: 'range' as const,
}
const music = {
  ...baseMarker,
  id: 'smoke-music',
  markerType: 'music_soundtrack' as const,
  title: 'Add music',
  userNote: 'Add music here',
  startTimeSeconds: 12,
  endTimeSeconds: 18,
  timeMode: 'range' as const,
}
const audio = detectProjectEditBriefAudioConflicts({
  marker: noMusic,
  allMarkers: [noMusic, music],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(audio[0]?.conflictKind, 'music_vs_no_music')

const copyRisk = detectProjectEditBriefCopyRisk({
  marker: { ...baseMarker, id: 'smoke-copy-risk', userNote: 'Copy this exact reference shot for shot.' },
  allMarkers: [baseMarker],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(copyRisk?.qaStatus, 'blocked')

const exportWarning = detectProjectEditBriefExportWarnings({
  marker: { ...baseMarker, id: 'smoke-caption-warning', markerType: 'caption_text' as const, title: 'Add captions', userNote: 'Add captions' },
  allMarkers: [baseMarker],
  attachments: [],
  exportSettings: bundle.exportSettings ? { ...bundle.exportSettings, captionSafeArea: false } : undefined,
})
assert.equal(exportWarning[0]?.findingType, 'export_warning')

const markerPackage = runProjectEditBriefMarkerQA({
  marker: missingAssetMarker,
  allMarkers: [missingAssetMarker],
  attachments: [],
  exportSettings: bundle.exportSettings,
})
assert.equal(markerPackage.qaStatus, 'needs_asset')
assertFalseFlags(markerPackage, 'markerPackage')

const qaPackage = createProjectEditBriefQAPackage({ bundle })
assert.equal(qaPackage.mockOnly, true)
assert.ok(qaPackage.markerCount >= 1)
assertFalseFlags(qaPackage, 'qaPackage')
const summary = createProjectEditBriefQASummaryModel(qaPackage)
assert.equal(summary.canRunMockQA, true)
assert.ok(summary.boundarySummary.includes('does not call Qwen'))
assertFalseFlags(summary, 'summary')
assert.ok(createProjectEditBriefQAFindingSummary(qaPackage.findings[0]).length > 0)

assert.equal(validateProjectEditBriefQAFinding(qaPackage.findings[0]).ok, true)
assert.equal(validateProjectEditBriefQAPackage(qaPackage).ok, true)
const sideEffects = validateNoProjectEditBriefQASideEffects(PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS as unknown as Record<string, unknown>)
assert.equal(sideEffects.ok, true)
assertFalseFlags(sideEffects, 'sideEffects')

for (const flow of [
  runMockProjectEditBriefQAFlow(),
  runMockMissingAssetQAFlow(),
  runMockOverlapConflictQAFlow(),
  runMockAudioConflictQAFlow(),
  runMockCopyRiskQAFlow(),
  runMockExportWarningQAFlow(),
  runMockBriefQAPackageFlow(),
]) {
  assert.equal(flow.nextStep, 'RP-EDITBRIEF-11 — Apply Brief Markers to Edit Plan')
  assertFalseFlags(flow, `flow:${flow.summary}`)
}

const scenarios = listMockProjectEditBriefQAScenarios()
assert.ok(scenarios.length >= 70, 'QA scenarios should cover at least 70 cases')
assert.ok(scenarios.some((scenario) => scenario.expectedFindingType === 'copy_risk'))
assert.ok(scenarios.some((scenario) => scenario.expectedFindingType === 'audio_conflict'))
for (const scenario of scenarios) assertFalseFlags(scenario, `scenario:${scenario.id}`)

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: true,
})
const uiPackage = await loadProjectEditBriefQAPackageForUI({
  projectId,
  editSessionId: 'edit-session-youtube-wide',
  client,
})
assert.ok(uiPackage, 'UI QA package should load')
assertFalseFlags(uiPackage!, 'uiPackage')
const runResult = await runProjectEditBriefQAViaApi({
  projectId,
  editSessionId: 'edit-session-youtube-wide',
  client,
})
assert.ok(runResult.qaPackage, 'Brief QA should run through API client')
assert.equal(runResult.renderJobCreated, false)
assertFalseFlags(runResult, 'runResult')
const bundleAfterRun = await getProjectEditBriefBundleViaApi(runResult.qaPackage!.briefId, client)
assert.ok(bundleAfterRun.bundle?.markers.some((marker) => marker.qaStatus !== 'not_checked'))

const markerRun = await runProjectEditBriefMarkerQAViaApi({
  markerId: 'marker-calm-soundtrack',
  client,
})
assert.ok(markerRun?.panelModel, 'Marker QA panel model should be created')
assertFalseFlags(markerRun!, 'markerRun')
assert.ok(createProjectEditBriefQABoundarySummary().includes('no') || createProjectEditBriefQABoundarySummary().includes('does not'))
for (const key of Object.keys(PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS)) {
  assert.equal(PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS[key as keyof typeof PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS], false)
}

for (const path of [
  'docs/project-edit-brief-marker-qa-system.md',
  'docs/project-edit-brief-conflict-detection.md',
  'docs/project-edit-brief-missing-asset-qa.md',
  'docs/project-edit-brief-copy-risk-qa.md',
  'docs/project-edit-brief-export-warning-qa.md',
  'docs/project-edit-brief-qa-ui.md',
  'docs/project-edit-brief-qa-boundary.md',
  'docs/project-edit-brief-qa-next-planner-bridge.md',
]) {
  assertDoc(path)
}

for (const path of [
  'src/lib/project-edit-brief-qa-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefQASummaryCard.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerQAPanel.tsx',
]) {
  const content = readFileSync(join(root, path), 'utf8')
  assert.equal(/from ['"].*backend/.test(content), false, `${path} must not import backend modules`)
  assert.equal(content.includes('MockDatabase'), false, `${path} must not import MockDatabase`)
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-qa'], 'tsx server/smoke/project-edit-brief-qa-smoke.ts')

const migrationCount = readdirSync(join(root, 'supabase/migrations')).filter((name) => !name.startsWith('.')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain 24')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-qa',
  status: 'passed',
  scenarios: scenarios.length,
  migrationCount,
  boundaries: {
    qwenCallMade: false,
    deepSeekCallMade: false,
    providerCallMade: false,
    soundRuntimeStarted: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    plannerApplicationStarted: false,
  },
}, null, 2))
