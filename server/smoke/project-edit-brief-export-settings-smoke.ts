import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createDefaultMockProjectEditBriefApiClient,
} from '../../src/lib/project-edit-brief-api-client'
import {
  applyProjectEditBriefExportPresetToForm,
  createProjectEditBriefExportSettingsFormState,
  loadProjectEditBriefExportSettingsPanelForUI,
  saveProjectEditBriefExportSettingsFormViaApi,
  validateProjectEditBriefExportSettingsForm,
} from '../../src/lib/project-edit-brief-export-settings-ui-adapter'
import {
  PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS,
  PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS,
  recommendProjectEditBriefExportSettings,
} from '../../src/lib/project-edit-brief-export-settings-rules'
import {
  createProjectEditBriefExportSettingsRecommendation,
  createProjectEditBriefExportSettingsReadableSummary,
  listMockProjectEditBriefExportSettingsScenarios,
  listProjectEditBriefExportSettingPresets,
  runMockProjectEditBriefExportSettingsRecommendationFlow,
  validateNoProjectEditBriefExportSettingsSideEffects,
  validateProjectEditBriefExportSettingsRecord,
} from '../../src/backend'

const root = process.cwd()
const projectId = 'mock-project-edit-chat-foundation'

function assertFalseFlags(value: unknown, label: string) {
  const record = value as Record<string, unknown>
  for (const key of Object.keys(PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS)) {
    assert.equal(record[key], false, `${label}.${key} must remain false`)
  }
}

function assertDoc(path: string) {
  const fullPath = join(root, path)
  assert.ok(existsSync(fullPath), `${path} should exist`)
  const content = readFileSync(fullPath, 'utf8')
  for (const phrase of [
    'Export Settings',
    'mock/local',
    'session-level',
    'no render/export',
    'no file bytes',
    'no URL fetch',
    'no media processing',
    'no Supabase command',
    'owner review',
  ]) {
    assert.ok(content.includes(phrase), `${path} should include ${phrase}`)
  }
}

const presets = listProjectEditBriefExportSettingPresets()
assert.equal(presets.length, PROJECT_EDIT_BRIEF_EXPORT_PRESET_DEFINITIONS.length, 'backend preset registry should match shared registry')
for (const preset of presets) assertFalseFlags(preset, `preset:${preset.presetId}`)

const expectedPresets = [
  ['instagram_reel', '9:16', 'instagram_reel_1080x1920', 1080, 1920],
  ['tiktok_reel', '9:16', 'tiktok_1080x1920', 1080, 1920],
  ['youtube_shorts', '9:16', 'youtube_shorts_1080x1920', 1080, 1920],
  ['youtube_standard', '16:9', 'youtube_standard_1920x1080', 1920, 1080],
  ['website', '16:9', 'website_1920x1080', 1920, 1080],
  ['instagram_feed', '1:1', 'instagram_feed_square_1080x1080', 1080, 1080],
  ['ad_creative', '4:5', 'instagram_feed_4x5_1080x1350', 1080, 1350],
  ['custom', 'custom', 'custom', 1080, 1080],
] as const

for (const [platformTarget, aspectRatio, presetId, width, height] of expectedPresets) {
  const recommendation = createProjectEditBriefExportSettingsRecommendation({
    projectId,
    editSessionId: `edit-session-export-${presetId}`,
    platformTarget,
    aspectRatio,
  })
  assert.equal(recommendation.exportSettings.deliveryPreset, presetId)
  assert.equal(recommendation.exportSettings.resolution.width, width)
  assert.equal(recommendation.exportSettings.resolution.height, height)
  assert.equal(recommendation.exportSettings.frameRate, 30)
  assert.equal(recommendation.exportSettings.format, 'mp4')
  assert.equal(recommendation.exportSettings.codec, 'h264')
  assert.equal(recommendation.exportSettings.audioCodec, 'aac')
  assert.equal(recommendation.exportSettings.captionSafeArea, true)
  assert.equal(recommendation.exportSettings.metadata?.fileBytesRead, false)
  assertFalseFlags(recommendation, `recommendation:${presetId}`)
}

const client = createDefaultMockProjectEditBriefApiClient({
  projectId,
  preserveMockSession: true,
})
const clientRecommendation = await client.exportSettings.recommend<{
  exportSettings: ReturnType<typeof recommendProjectEditBriefExportSettings>['exportSettings']
  safety: Record<string, unknown>
}>({
  projectId,
  editSessionId: 'edit-session-rp09-api-client',
  platformTarget: 'ad_creative',
  aspectRatio: '4:5',
})
assert.equal(clientRecommendation.ok, true)
assert.equal(clientRecommendation.data?.exportSettings.deliveryPreset, 'instagram_feed_4x5_1080x1350')
assert.equal(clientRecommendation.data?.safety.renderJobCreated, false)

const panel = await loadProjectEditBriefExportSettingsPanelForUI({
  projectId,
  editSessionId: 'edit-session-youtube-wide',
  client,
})
assert.equal(panel.settings?.deliveryPreset, 'youtube_standard_1920x1080')
assert.equal(panel.canStartRender, false)
assert.equal(panel.canStartExport, false)
assertFalseFlags(panel, 'panel')

const form = createProjectEditBriefExportSettingsFormState(panel.settings!)
const updatedForm = {
  ...applyProjectEditBriefExportPresetToForm(form, 'instagram_reel_1080x1920'),
  resolutionWidth: 1080,
  resolutionHeight: 1920,
  captionSafeArea: true,
}
const formValidation = validateProjectEditBriefExportSettingsForm(updatedForm)
assert.equal(formValidation.ok, true)
assertFalseFlags(formValidation, 'formValidation')
const saved = await saveProjectEditBriefExportSettingsFormViaApi(updatedForm, client)
assert.equal(saved.validation.ok, true)
assert.equal(saved.exportSettings?.deliveryPreset, 'instagram_reel_1080x1920')
assert.equal(saved.exportSettings?.source, 'user_override_mock')
assert.match(saved.summary, /No render\/export started/)

const invalidForm = {
  ...updatedForm,
  resolutionWidth: 0,
}
const invalidValidation = validateProjectEditBriefExportSettingsForm(invalidForm)
assert.equal(invalidValidation.ok, false)
assert.match(invalidValidation.blockedReasons.join(' '), /Resolution width/)

const summary = createProjectEditBriefExportSettingsReadableSummary(saved.exportSettings!)
assert.match(summary, /mock\/local metadata only/)
const recordValidation = validateProjectEditBriefExportSettingsRecord(saved.exportSettings!)
assert.equal(recordValidation.ok, true)
assertFalseFlags(recordValidation, 'recordValidation')

const sideEffectValidation = validateNoProjectEditBriefExportSettingsSideEffects(PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_SAFETY_FLAGS)
assert.equal(sideEffectValidation.ok, true)
assertFalseFlags(sideEffectValidation, 'sideEffectValidation')

const scenarios = listMockProjectEditBriefExportSettingsScenarios()
assert.ok(scenarios.length >= 48, 'Export Settings scenarios should cover at least 48 cases')
assert.ok(scenarios.some((scenario) => scenario.expectedPreset === 'instagram_feed_4x5_1080x1350'))
for (const scenario of scenarios) assertFalseFlags(scenario, `scenario:${scenario.id}`)

const orchestrator = runMockProjectEditBriefExportSettingsRecommendationFlow()
assert.equal(orchestrator.ok, true)
assert.equal(orchestrator.nextStep, 'RP-EDITBRIEF-10 — Marker QA + Conflict Detection')
assertFalseFlags(orchestrator, 'orchestrator')

for (const path of [
  'docs/project-edit-brief-export-settings-recommendation.md',
  'docs/project-edit-brief-export-settings-ui.md',
  'docs/project-edit-brief-export-settings-policy.md',
  'docs/project-edit-brief-export-settings-boundary.md',
  'docs/project-edit-brief-export-settings-next-qa-conflicts.md',
]) {
  assertDoc(path)
}

for (const path of [
  'src/lib/project-edit-brief-export-settings-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefExportSettingsSummary.tsx',
]) {
  const content = readFileSync(join(root, path), 'utf8')
  assert.equal(/from ['"].*backend/.test(content), false, `${path} must not import backend modules`)
  assert.equal(content.includes('MockDatabase'), false, `${path} must not import MockDatabase`)
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-export-settings'], 'tsx server/smoke/project-edit-brief-export-settings-smoke.ts')

const migrationCount = readdirSync(join(root, 'supabase/migrations')).filter((name) => !name.startsWith('.')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain 24')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-export-settings',
  status: 'passed',
  scenarios: scenarios.length,
  presets: presets.length,
  migrationCount,
  boundaries: {
    renderJobCreated: false,
    exportJobCreated: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    supabaseWriteMade: false,
    creditReservedOrSpent: false,
  },
}, null, 2))
