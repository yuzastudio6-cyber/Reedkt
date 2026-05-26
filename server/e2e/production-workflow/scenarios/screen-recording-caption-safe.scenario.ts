import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const screenRecordingCaptionSafeScenario: ProductionWorkflowScenario = {
  scenarioId: 'screen-recording-caption-safe',
  displayName: 'Screen Recording Caption Safe',
  description: 'Validates caption safe-zone warnings around screen-recording/OCR placeholders without claiming OCR ran.',
  mode: 'dry_run',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  expectedStages: ['media_foundation', 'speech_caption_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'extracted_audio', 'transcript_json', 'caption_segments_json', 'render_manifest', 'qa_report'],
  requiredQAGates: ['caption_safe_zone', 'caption_readability', 'render_asset_integrity', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'ffprobe', 'remotion', 'libass'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['OCR not executed; caption safe-zone remains conservative.'],
  fixturePolicy: defaultFixturePolicy(['OCR is intentionally placeholder-only in this E2E smoke.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['No false OCR claims should appear in the workflow report.'],
}
