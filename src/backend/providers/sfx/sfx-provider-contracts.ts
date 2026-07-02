import type {
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../../types'

export type SFXProviderIntegrationMode = 'mock' | 'disabled' | 'real'

export type SFXProviderKey =
  | 'mirelo_sfx_v1_5'
  | 'mmaudio_v2'
  // Legacy alias accepted for existing mock records and older planning data.
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

export type SFXProviderDisplayKey = SFXProviderKey | 'manual_upload' | 'unknown' | string

export function isMMAudioProviderKey(provider?: SFXProviderDisplayKey): provider is 'mmaudio_v2' | 'mmaudio_v' {
  return provider === 'mmaudio_v2' || provider === 'mmaudio_v'
}

export function normalizeSFXProviderKey(provider?: SFXProviderDisplayKey): SFXProviderKey {
  if (provider === 'mirelo_sfx_v1_5') return 'mirelo_sfx_v1_5'
  if (isMMAudioProviderKey(provider)) return 'mmaudio_v2'
  if (provider === 'reeditpro_internal_library') return 'reeditpro_internal_library'
  return 'no_sfx'
}

export function getSFXProviderDisplayLabel(provider?: SFXProviderDisplayKey): string {
  if (provider === 'mirelo_sfx_v1_5') return 'Mirelo SFX V1.5'
  if (isMMAudioProviderKey(provider)) return 'MMAudio V2'
  if (provider === 'reeditpro_internal_library') return 'ReeditPro Internal Library'
  return 'No SFX'
}

export type SFXProviderReadinessRuntimeMode =
  | 'browser_frontend'
  | 'vite_frontend'
  | 'node_backend'
  | 'backend_worker'
  | 'mock_runtime'
  | 'unknown'

export type SFXProviderReadinessBlockReason =
  | 'provider_mode_mock'
  | 'provider_mode_disabled'
  | 'frontend_runtime_blocked'
  | 'unsupported_provider'
  | 'provider_route_missing'
  | 'provider_route_no_sfx'
  | 'prompt_plan_missing'
  | 'generation_request_missing'
  | 'worker_job_missing'
  | 'edit_plan_not_approved'
  | 'credit_estimate_not_approved'
  | 'credit_reservation_missing'
  | 'secret_reference_missing'
  | 'provider_docs_not_reviewed'
  | 'source_footage_not_approved'
  | 'storage_output_not_configured'
  | 'provenance_review_missing'
  | 'safety_gate_blocked'

export type SFXProviderReadinessSafeNextStep =
  | 'stay_in_mock_mode'
  | 'keep_provider_disabled'
  | 'move_check_to_backend_worker'
  | 'configure_secret_references'
  | 'review_provider_docs'
  | 'approve_plan_and_reserve_credits'
  | 'create_generation_request'
  | 'queue_backend_worker_job'
  | 'prepare_storage_and_provenance'
  | 'do_not_generate_sfx'
  | 'implement_backend_transport'

export interface SFXProviderExecutionReadinessResult {
  readyForRealTransport: boolean
  providerKey: SFXProviderKey
  providerMode: SFXProviderIntegrationMode
  runtimeMode: SFXProviderReadinessRuntimeMode
  blockReasons: SFXProviderReadinessBlockReason[]
  warnings: string[]
  requiredBackendCapabilities: string[]
  safeNextStep: SFXProviderReadinessSafeNextStep
  summary: string
  checkedAt: string
  mockOnly: true
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

export interface SFXProviderExecutionReadinessInput extends SFXProviderSafetyGateInput {
  creditEstimate?: CreditEstimateRecord
  workerJob?: JobRecord
  forceBrowserRuntime?: boolean
  runtimeMode?: SFXProviderReadinessRuntimeMode
  providerDocsReviewed?: boolean
  storageOutputConfigured?: boolean
  provenancePolicyReviewed?: boolean
  config?: Partial<SFXProviderConfig>
  requiredBackendCapabilities?: string[]
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
