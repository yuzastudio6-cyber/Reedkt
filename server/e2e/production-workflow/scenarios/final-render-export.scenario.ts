import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const finalRenderExportScenario: ProductionWorkflowScenario = {
  scenarioId: 'final-render-export',
  displayName: 'Final Render Export',
  description: 'Validates full artifact handoff into final render/export command planning and final-delivery QA rules.',
  mode: 'dry_run',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  expectedStages: ['media_foundation', 'speech_caption_execution', 'smart_cut_timeline_execution', 'audio_execution', 'color_execution', 'enhancement_slowmotion_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'proxy_video', 'transcript_json', 'caption_segments_json', 'timeline_manifest', 'audio_analysis_json', 'color_grade_recipe', 'enhanced_video', 'interpolated_video', 'render_manifest', 'qa_report'],
  requiredQAGates: ['render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'ffprobe', 'remotion', 'libass'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['final_delivery cannot pass without private final_export artifact.'],
  fixturePolicy: defaultFixturePolicy(['Local-dev generated fixture mode remains optional.']),
  finalExportExpected: true,
  productionReadyExpected: false,
  notes: ['Final export artifacts remain private until a future delivery/share policy.'],
}
