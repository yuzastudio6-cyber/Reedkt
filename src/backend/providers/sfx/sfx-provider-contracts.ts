import type {
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../../types'

export type SFXProviderIntegrationMode = 'mock' | 'disabled' | 'real'

export type SFXProviderKey =
  | 'mirelo_sfx_v1_5'
  | 'mmaudio_v'
  | 'reeditpro_internal_library'
  | 'no_sfx'

export type SFXProviderOutputFormat =
  | 'wav'
  | 'mp3'
  | 'unknown'

export interface SFXProviderGenerateRequest {
  providerKey: SFXProviderKey
  modelName?: string
  prompt: string
  negativePrompt?: string
  durationSeconds: number
  durationNeededSeconds?: number
  outputFormat?: SFXProviderOutputFormat
  targetLayer?: string
  useCase?: string
  timingAnchor?: {
    anchorType: string
    anchorTimeSeconds?: number
  }
  videoContext?: {
    projectId: string
    editPlanId: string
    segmentId?: string
    sceneSummary?: string
    hasSpeech?: boolean
    hasMusic?: boolean
    ambienceImportant?: boolean
  }
  mockOnly?: boolean
  metadata?: Record<string, unknown>
}

export interface SFXProviderAudioPart {
  type: 'audio'
  mimeType: string
  data: Uint8Array | string | null
  sizeBytes?: number
}

export interface SFXProviderTextPart {
  type: 'text'
  text: string
}

export type SFXProviderGeneratedPart =
  | SFXProviderAudioPart
  | SFXProviderTextPart

export interface SFXProviderGenerateResponse {
  providerKey: SFXProviderKey
  providerName: string
  modelName?: string
  parts: SFXProviderGeneratedPart[]
  audioParts: SFXProviderAudioPart[]
  textParts: string[]
  durationSeconds?: number
  outputFormat?: SFXProviderOutputFormat
  mockStoragePath?: string
  rawResponse?: unknown
  mockOnly: boolean
  generatedAt: string
}

export interface SFXProviderResult {
  ok: boolean
  response?: SFXProviderGenerateResponse
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings?: string[]
}

export interface SFXProviderConfig {
  mode: SFXProviderIntegrationMode
  mireloModelName: string
  mmaudioModelName: string
  outputFormat: SFXProviderOutputFormat
  isBrowserRuntime: boolean
  hasMireloCredential: boolean
  hasMMAudioCredential: boolean
  mireloSecretReferenceName?: string
  mmaudioSecretReferenceName?: string
}

export interface SFXProviderSafetyGateResult {
  ok: boolean
  code?: string
  message: string
  warnings: string[]
}

export interface SFXProviderSafetyGateInput {
  mode?: SFXProviderIntegrationMode
  eventPlan?: SFXEventPlanRecord
  providerRoute?: SFXProviderRouteRecord
  promptPlan?: SFXPromptPlanRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  editPlan?: EditPlanRecord
  sourceFootageApproved?: boolean
}

export interface SFXProviderGenerationPlan {
  id: string
  providerRequest: SFXProviderGenerateRequest
  eventPlan: SFXEventPlanRecord
  providerRoute: SFXProviderRouteRecord
  promptPlan: SFXPromptPlanRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  safetyGate: SFXProviderSafetyGateResult
  warnings: string[]
}
