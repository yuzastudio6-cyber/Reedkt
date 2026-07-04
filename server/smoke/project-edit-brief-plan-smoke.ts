import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import { createMockProjectEditBriefFixtureBundle } from '../../src/lib/mock-project-edit-briefs'
import {
  PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY,
  PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  createProjectEditBriefMarkerPlanInstructions,
  createProjectEditBriefPlanApplicationLogSummary,
  createProjectEditBriefPlanPanelModel,
  createProjectEditBriefPlanReadableSummary,
  createProjectEditBriefPlannerInputPackage,
  mapProjectEditBriefMarkerIntentToPlanInstructionKind,
  validateNoProjectEditBriefPlanSideEffects,
  validateProjectEditBriefPlannerInputPackage,
} from '../../src/lib/project-edit-brief-plan-rules'
import {
  loadProjectEditBriefPlanPanelForUI,
  prepareProjectEditBriefPlanHintsForUI,
} from '../../src/lib/project-edit-brief-plan-ui-adapter'
import { listMockProjectEditBriefPlanScenarios } from '../../src/backend/project-edit-brief-plan/mock-project-edit-brief-plan-scenarios'
import { runMockProjectEditBriefPlanFlow } from '../../src/backend/orchestrators/mock-project-edit-brief-plan-orchestrator'
import type { ProjectEditBriefMarkerIntentAction, ProjectEditBriefMarkerIntentRecord } from '../../src/types/project-edit-brief'

const repoRoot = process.cwd()
const docs = [
  'docs/project-edit-brief-plan-bridge-system.md',
  'docs/project-edit-brief-marker-plan-eligibility.md',
  'docs/project-edit-brief-marker-plan-instructions.md',
  'docs/project-edit-brief-plan-priority-policy.md',
  'docs/project-edit-brief-plan-ui.md',
  'docs/project-edit-brief-plan-application-log.md',
  'docs/project-edit-brief-plan-boundary.md',
  'docs/project-edit-brief-plan-next-internal-testing.md',
]

function assertAllSideEffectsFalse(value: unknown, label: string) {
  const record = value as Record<string, unknown>
  for (const key of Object.keys(PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS)) {
    assert.equal(record[key], false, `${label}: ${key} must remain false`)
  }
}

const scenarios = listMockProjectEditBriefPlanScenarios()
assert.ok(scenarios.length >= 70, 'At least 70 plan scenarios are required.')
assert.ok(scenarios.every((scenario) => scenario.mockOnly && scenario.expectedSideEffectsFalse), 'All plan scenarios must be mock-only with false side-effect expectations.')
assert.equal(PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY[0], '1. Safety / do-not-copy / policy', 'Priority policy must preserve safety first.')

const fixtures = createMockProjectEditBriefFixtureBundle()
const attachedBundle = fixtures.bundles.find((bundle) => bundle.brief.id === 'project-edit-brief-broll-attached')
assert.ok(attachedBundle, 'B-roll attached fixture bundle should exist.')

const packageRecord = createProjectEditBriefPlannerInputPackage({
  bundle: attachedBundle,
  exportSettings: attachedBundle.exportSettings,
})
assert.ok(packageRecord.planInstructions.some((instruction) => instruction.instructionKind === 'broll_insert'), 'B-roll fixture should map to a broll_insert plan hint.')
assert.equal(packageRecord.plannerExecuted, false, 'Planner should not execute.')
assert.equal(packageRecord.editPlanCreated, false, 'Edit plan should not be created.')
assertAllSideEffectsFalse(packageRecord, 'package')

const instructions = createProjectEditBriefMarkerPlanInstructions({ bundle: attachedBundle })
assert.ok(instructions.eligibleMarkers.length >= 1, 'At least one eligible marker should be selected.')
assert.ok(instructions.instructions.length >= 1, 'At least one plan instruction should be created.')

const actionMap: Record<ProjectEditBriefMarkerIntentAction, string> = {
  add_broll: 'broll_insert',
  remove_or_cut: 'cut_or_remove',
  keep_or_emphasize: 'keep_or_emphasize',
  add_caption_or_text: 'caption_or_text',
  add_graphic_or_ui_card: 'graphic_or_card',
  add_music_or_soundtrack: 'music_or_soundtrack_hint',
  add_sfx: 'sfx_hint',
  add_voiceover: 'voiceover_hint',
  add_transition: 'transition_hint',
  adjust_speed_or_pacing: 'pacing_adjustment',
  adjust_color_or_tone: 'color_tone_adjustment',
  avoid_or_do_not_use: 'restriction',
  general_instruction: 'general_note',
}
for (const [action, kind] of Object.entries(actionMap)) {
  assert.equal(mapProjectEditBriefMarkerIntentToPlanInstructionKind(action as ProjectEditBriefMarkerIntentAction), kind)
}

const marker = attachedBundle.markers[0]
const needsAssetBundle = {
  ...attachedBundle,
  markers: [{ ...marker, id: 'marker-needs-plan-asset', title: 'Needs asset', qaStatus: 'needs_asset' as const }],
  intents: [{
    ...(attachedBundle.intents[0] as ProjectEditBriefMarkerIntentRecord),
    id: 'intent-needs-plan-asset',
    markerId: 'marker-needs-plan-asset',
    status: 'needs_asset' as const,
    providedAssetIds: [],
    assetRequirement: 'missing mock b-roll',
  }],
  attachments: [],
}
const skippedPackage = createProjectEditBriefPlannerInputPackage({ bundle: needsAssetBundle })
assert.ok(skippedPackage.skippedMarkers.some((item) => item.eligibility === 'skipped_needs_asset'), 'Missing asset marker should be skipped.')

const validation = validateProjectEditBriefPlannerInputPackage(packageRecord)
assert.equal(validation.ok, true, 'Valid planner input package should pass validation.')
assert.equal(validateNoProjectEditBriefPlanSideEffects({ plannerExecuted: true }).ok, false, 'Validation should block plannerExecuted=true.')
assert.equal(validateNoProjectEditBriefPlanSideEffects({ editPlanCreated: true }).ok, false, 'Validation should block editPlanCreated=true.')
assert.ok(createProjectEditBriefPlanReadableSummary(packageRecord).includes('No real planner'), 'Readable summary should state no real planner.')
assert.ok(createProjectEditBriefPlanApplicationLogSummary(packageRecord).includes('Prepared'), 'Application log summary should be readable.')

const panel = createProjectEditBriefPlanPanelModel(packageRecord)
assert.ok(panel.canPreparePlanHints, 'Panel model should allow mock preparation.')
assert.ok(panel.boundarySummary.includes('mock/local'), 'Panel boundary should be mock/local.')
assertAllSideEffectsFalse(panel, 'panel')

const orchestrator = runMockProjectEditBriefPlanFlow()
assert.equal(orchestrator.nextStep, 'RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage')
assert.equal(orchestrator.validation.ok, true, 'Orchestrator validation should pass.')
assertAllSideEffectsFalse(orchestrator, 'orchestrator')

const client = createDefaultMockProjectEditBriefApiClient({
  projectId: 'mock-project-edit-chat-foundation',
  preserveMockSession: false,
})
const loaded = await loadProjectEditBriefPlanPanelForUI({
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  client,
})
assert.ok(loaded.panelModel, 'UI adapter should load a plan panel model.')
const prepared = await prepareProjectEditBriefPlanHintsForUI({
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
  client,
})
assert.ok(prepared.panelModel, 'UI adapter should prepare plan hints.')
assert.ok(prepared.applicationLog?.summary.includes('Prepared'), 'UI adapter should append an application log through the mock API.')
assert.equal(prepared.plannerExecuted, false)
assert.equal(prepared.editPlanCreated, false)

for (const doc of docs) {
  const path = join(repoRoot, doc)
  assert.ok(existsSync(path), `${doc} should exist.`)
  const text = readFileSync(path, 'utf8')
  assert.match(text, /mock\/local|mock/i, `${doc} should mention mock/local behavior.`)
  assert.match(text, /no real planner|does not run the real edit planner|No real planner/i, `${doc} should mention no real planner.`)
}

const uiFiles = [
  'src/lib/project-edit-brief-plan-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefPlanBridgePanel.tsx',
]
for (const file of uiFiles) {
  const text = readFileSync(join(repoRoot, file), 'utf8')
  assert.equal(/from ['"].*(src\/backend|\.\.\/\.\.\/backend|MockDatabase|supabase)/i.test(text), false, `${file} must not import backend, MockDatabase, or Supabase.`)
}

const migrationCount = readdirSync(join(repoRoot, 'supabase/migrations')).filter((file) => file.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain 24.')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-plan',
  status: 'passed',
  scenarios: scenarios.length,
  instructions: packageRecord.planInstructions.length,
  skipped: skippedPackage.skippedMarkers.length,
  migrationCount,
  plannerExecuted: false,
  editPlanCreated: false,
}, null, 2))
