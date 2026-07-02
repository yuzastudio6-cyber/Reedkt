import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const textBehindSubjectScenario: ProductionWorkflowScenario = {
  scenarioId: 'text-behind-subject',
  displayName: 'Text Behind Subject',
  description: 'Validates mask/depth metadata handoff and downgrade behavior for weak text-behind-subject masks.',
  mode: 'dry_run',
  targetPlatform: 'tiktok',
  aspectRatio: '9:16',
  expectedStages: ['media_foundation', 'mask_background_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'proxy_video', 'mask_sequence', 'render_manifest', 'qa_report'],
  requiredQAGates: ['mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg'],
  expectedBlockers: ['mask_confidence_low', 'final_export_missing'],
  expectedWarnings: ['Weak mask confidence downgrades or blocks text-behind-subject preview.'],
  fixturePolicy: defaultFixturePolicy(['No mask model execution; metadata-only composition handoff.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['Text-behind-subject must not bypass mask QA.'],
}
