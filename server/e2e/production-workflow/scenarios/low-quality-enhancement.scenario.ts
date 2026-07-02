import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const lowQualityEnhancementScenario: ProductionWorkflowScenario = {
  scenarioId: 'low-quality-enhancement',
  displayName: 'Low Quality Enhancement',
  description: 'Validates sample-first enhancement planning and enhancement QA without blind full-clip enhancement.',
  mode: 'dry_run',
  targetPlatform: 'shorts',
  aspectRatio: '9:16',
  expectedStages: ['media_foundation', 'enhancement_slowmotion_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'representative_frame', 'enhanced_video', 'render_manifest', 'qa_report'],
  requiredQAGates: ['enhancement_artifacts', 'render_asset_integrity', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['Sample-first enhancement must pass QA before wider use.'],
  fixturePolicy: defaultFixturePolicy(['Enhancement uses dry-run sample metadata only.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['No Real-ESRGAN execution or model download.'],
}
