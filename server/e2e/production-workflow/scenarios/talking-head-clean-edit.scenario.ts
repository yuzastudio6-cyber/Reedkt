import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const talkingHeadCleanEditScenario: ProductionWorkflowScenario = {
  scenarioId: 'talking-head-clean-edit',
  displayName: 'Talking Head Clean Edit',
  description: 'End-to-end dry-run for a clean talking-head edit with captions, smart cuts, audio, color, and final render planning.',
  mode: 'dry_run',
  targetPlatform: 'reels',
  aspectRatio: '9:16',
  expectedStages: ['media_foundation', 'speech_caption_execution', 'smart_cut_timeline_execution', 'audio_execution', 'color_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'proxy_video', 'extracted_audio', 'transcript_json', 'caption_segments_json', 'timeline_manifest', 'audio_analysis_json', 'color_grade_recipe', 'render_manifest', 'qa_report'],
  requiredQAGates: ['caption_safe_zone', 'caption_readability', 'transcript_alignment', 'cut_smoothness', 'audio_loudness', 'audio_naturalness', 'color_exposure', 'render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'ffprobe', 'remotion', 'libass'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['Dry-run final delivery remains blocked without a final_export artifact.'],
  fixturePolicy: defaultFixturePolicy(['No user media; generated fixture refs only.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['Basic clean edit must remain professional while staying dry-run safe.'],
}
