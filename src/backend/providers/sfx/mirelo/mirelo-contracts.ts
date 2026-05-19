export interface MireloSFXInternalRequest {
  modelName: 'mirelo-sfx-v1.5' | string
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  outputFormat?: 'wav' | 'mp3'
  promptStyle?: string
  metadata?: Record<string, unknown>
}

export interface MireloSFXInternalResponse {
  providerName: 'Mirelo SFX V1.5'
  modelName: string
  mockAudioBytes: null
  mockStoragePath?: string
  durationSeconds: number
  outputFormat: 'wav' | 'mp3'
  rawResponse?: unknown
  mockOnly: boolean
  generatedAt: string
}
