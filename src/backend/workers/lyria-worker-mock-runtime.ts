import type { MusicCueSheetItemRecord } from '../../types'
import { nowIso } from '../mock/mock-database'
import type {
  LyriaWorkerContext,
  LyriaWorkerInput,
  MockLyriaProviderResponse,
} from './lyria-worker-contracts'

export function createMockAudioStoragePath(projectId: string, musicCueId: string, format: 'wav' = 'wav') {
  return `mock://generated-audio/${projectId}/${musicCueId}.${format}`
}

export function createMockAudioDuration(cue?: MusicCueSheetItemRecord) {
  if (cue?.timeRange) {
    return Math.max(8, Math.round(cue.timeRange.endSeconds - cue.timeRange.startSeconds))
  }

  if (cue?.sectionType === 'coming_up_teaser') return 18
  if (cue?.sectionType === 'dialogue') return 45
  if (cue?.sectionType === 'outro') return 30
  return 60
}

export function createMockMusicWaveformSummary(cue?: MusicCueSheetItemRecord) {
  if (!cue) {
    return ['neutral intro', 'steady body', 'soft resolve']
  }

  if (cue.sectionType === 'dialogue') {
    return ['soft entry', 'low voice-safe bed', 'gentle tail']
  }

  if (cue.sectionType === 'movement' || cue.sectionType === 'montage') {
    return ['clean pickup', 'broad energy rise', 'crossfade-safe ending']
  }

  if (cue.sectionType === 'outro') {
    return ['warm entry', 'soft resolve', 'fade-ready tail']
  }

  return ['short cue start', 'supportive middle', 'clean exit']
}

export function createMockProviderResponse(input: {
  workerInput: LyriaWorkerInput
  context: LyriaWorkerContext
  cue?: MusicCueSheetItemRecord
}): MockLyriaProviderResponse {
  const durationSeconds = createMockAudioDuration(input.cue)

  return {
    provider: input.context.provider,
    model: input.context.modelName,
    mockAudioBytes: null,
    mockStoragePath: createMockAudioStoragePath(input.workerInput.projectId, input.workerInput.musicCueId),
    durationSeconds,
    format: 'wav',
    generatedAt: nowIso(),
    mockOnly: true,
    waveformSummary: createMockMusicWaveformSummary(input.cue),
  }
}

export function simulateLyriaGenerationDelay() {
  return {
    simulatedDelayMs: 0,
    skippedRealWait: true,
  }
}

export function simulateLyriaProGeneration(input: {
  workerInput: LyriaWorkerInput
  context: LyriaWorkerContext
  cue?: MusicCueSheetItemRecord
}): MockLyriaProviderResponse {
  simulateLyriaGenerationDelay()
  return createMockProviderResponse(input)
}
