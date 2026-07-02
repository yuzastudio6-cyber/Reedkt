export interface MMAudioInternalRequest {
  modelName: 'mmaudio-v2' | string
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  outputFormat?: 'wav' | 'mp3'
  videoConditioning?: {
    sourceClipId?: string
    videoSegmentStartSeconds?: number
    videoSegmentEndSeconds?: number
    sceneSummary?: string
  }
  metadata?: Record<string, unknown>
}

export interface MMAudioInternalResponse {
  providerName: 'MMAudio V2'
  modelName: string
  mockAudioBytes: null
  mockStoragePath?: string
  durationSeconds: number
  outputFormat: 'wav' | 'mp3'
  rawResponse?: unknown
  mockOnly: boolean
  generatedAt: string
}
