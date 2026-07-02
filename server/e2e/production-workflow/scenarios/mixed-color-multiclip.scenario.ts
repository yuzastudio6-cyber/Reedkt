import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const mixedColorMulticlipScenario: ProductionWorkflowScenario = {
  scenarioId: 'mixed-color-multiclip',
  displayName: 'Mixed Color Multiclip',
  description: 'Validates color shot-match planning, timeline handoff, and final render blocking on color delivery risk.',
  mode: 'dry_run',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  expectedStages: ['media_foundation', 'color_execution', 'smart_cut_timeline_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'representative_frame', 'color_analysis_json', 'color_grade_recipe', 'timeline_manifest', 'render_manifest', 'qa_report'],
  requiredQAGates: ['color_exposure', 'color_shot_match', 'color_export_space', 'render_timeline_integrity', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'remotion'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['Shot-match plan is metadata-only until final render/export probe.'],
  fixturePolicy: defaultFixturePolicy(['Mock analysis marks representative frames as mismatched.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['Color execution remains clean/natural before looks.'],
}
