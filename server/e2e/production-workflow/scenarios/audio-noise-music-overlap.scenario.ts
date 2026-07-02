import { defaultFixturePolicy, type ProductionWorkflowScenario } from '../production-workflow-scenario-types'

export const audioNoiseMusicOverlapScenario: ProductionWorkflowScenario = {
  scenarioId: 'audio-noise-music-overlap',
  displayName: 'Audio Noise Music Overlap',
  description: 'Validates gentle audio cleanup, music ducking, and music-over-voice QA before final render planning.',
  mode: 'dry_run',
  targetPlatform: 'reels',
  aspectRatio: '9:16',
  expectedStages: ['media_foundation', 'speech_caption_execution', 'audio_execution', 'final_render_export_execution', 'final_workflow_report'],
  requiredArtifacts: ['source_media', 'extracted_audio', 'transcript_json', 'audio_analysis_json', 'render_manifest', 'qa_report'],
  requiredQAGates: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice', 'final_delivery'],
  allowedLocalDevTools: ['ffmpeg', 'ffprobe'],
  expectedBlockers: ['final_export_missing'],
  expectedWarnings: ['Demucs is not selected unless overlap or approved reason justifies it.'],
  fixturePolicy: defaultFixturePolicy(['Mock audio analysis includes speech/music overlap.']),
  finalExportExpected: false,
  productionReadyExpected: false,
  notes: ['Voice-first mix policy must remain intact.'],
}
