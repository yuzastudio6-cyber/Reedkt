import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const podcastRepeatedTakesScenario: ProductionWorkflowScenario = {
  scenarioId: 'podcast-repeated-takes',
  displayName: 'Podcast Repeated Takes',
  description: 'Validates transcript-aware repeated-take safety, no mid-word cuts, audio planning, and final render dry-run.',
  mode: 'dry_run',
  targetPlatform: 'podcast',
  aspectRatio: '16:9',
  expectedStages: ['media_foundation', 'speech_caption_execution', 'smart_cut_timeline_execution', 'audio_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'extracted_audio', 'transcript_json', 'caption_segments_json', 'timeline_manifest', 'audio_analysis_json', 'render_manifest', 'qa_report'],
  requiredQAGates: ['transcript_alignment', 'cut_smoothness', 'audio_loudness', 'audio_naturalness', 'render_timeline_integrity', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'ffprobe', 'remotion', 'libass'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['Repeated-take planner preserved at least one take and no mid-word cut was allowed.'],
  fixturePolicy: defaultFixturePolicy(['Mock transcript segments contain repeated take evidence.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['Meaning preservation outranks speed.'],
}
