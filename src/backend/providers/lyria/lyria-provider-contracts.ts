import type {
  CreditReservationRecord,
  GeneratedAssetRecord,
  GeneratedMusicTrackRecord,
  GenerationRequestRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  MusicMixPlanRecord,
  MusicQAReportRecord,
  MusicTrackAnalysisRecord,
} from '../../../types'

export type LyriaIntegrationMode = 'mock' | 'disabled' | 'real'

export type LyriaModelName = 'lyria-3-pro-preview' | 'lyria-3-clip-preview'

export type LyriaOutputMimeType =
  | 'audio/mpeg'
  | 'audio/mp3'
  | 'audio/wav'

export interface LyriaGenerationConfig {
  responseModalities?: Array<'AUDIO' | 'TEXT'>
  responseFormat?: {
    audio?: {
      mimeType: LyriaOutputMimeType
    }
  }
}

export interface LyriaGenerateMusicRequest {
  model: LyriaModelName
  prompt: string
  negativePrompt?: string
  durationSeconds?: number
  outputMimeType?: LyriaOutputMimeType
  generationConfig?: LyriaGenerationConfig
  metadata?: Record<string, unknown>
}

export interface LyriaGeneratedTextPart {
  type: 'text'
  text: string
}

export interface LyriaGeneratedAudioPart {
  type: 'audio'
  mimeType: LyriaOutputMimeType | string
  data: Uint8Array | string | null
  sizeBytes?: number
}

export type LyriaGeneratedPart =
  | LyriaGeneratedTextPart
  | LyriaGeneratedAudioPart

export interface LyriaGenerateMusicResponse {
  provider: 'Lyria Pro'
  model: LyriaModelName
  parts: LyriaGeneratedPart[]
  textParts: string[]
  audioParts: LyriaGeneratedAudioPart[]
  rawResponse?: unknown
  mockOnly: boolean
  generatedAt: string
}

export interface LyriaProviderResult {
  ok: boolean
  response?: LyriaGenerateMusicResponse
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings?: string[]
}

export interface LyriaProviderConfig {
  mode: LyriaIntegrationMode
  modelName: LyriaModelName
  outputMimeType: LyriaOutputMimeType
  isBrowserRuntime: boolean
  hasApiKey: boolean
  secretReferenceName?: string
}

export interface LyriaSafetyGateResult {
  ok: boolean
  code?: string
  message: string
  warnings: string[]
}

export interface LyriaSafetyGateInput {
  mode?: LyriaIntegrationMode
  promptPlan?: LyriaPromptPlanRecord
  musicCue?: MusicCueSheetItemRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
}

export interface LyriaProviderGenerationPlan {
  id: string
  request: LyriaGenerateMusicRequest
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueSheetItemRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  safetyGate: LyriaSafetyGateResult
  warnings: string[]
}

export interface LyriaProviderMockGenerationResult {
  providerResult: LyriaProviderResult
  generatedMusicTrack?: GeneratedMusicTrackRecord
  generatedAsset?: GeneratedAssetRecord
  trackAnalysis?: MusicTrackAnalysisRecord
  qaReport?: MusicQAReportRecord
  mixPlan?: MusicMixPlanRecord
  warnings: string[]
}
