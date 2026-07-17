export type ReeditProProviderId =
  | 'qwen'
  | 'deepseek'
  | 'lyria'
  | 'mirelo_sfx'
  | 'mmaudio'
  | 'supabase'
  | 'stripe'
  | 'google_cloud'
  | 'internal_mock'

export type ProviderRuntimeKind =
  | 'reasoning_model'
  | 'coding_model'
  | 'music_generation'
  | 'sfx_generation'
  | 'database'
  | 'billing'
  | 'cloud_runtime'
  | 'storage'
  | 'internal_mock'

export type ProviderSecretBoundary =
  | 'frontend_public_allowed'
  | 'backend_only'
  | 'worker_only'
  | 'secret_manager_only'
  | 'local_dev_placeholder_only'
  | 'not_required'

export type ProviderConfigStatus =
  | 'configured'
  | 'missing_required_secret'
  | 'missing_optional_secret'
  | 'disabled'
  | 'mock_only'
  | 'blocked_missing_gate'
  | 'blocked_wrong_project'
  | 'unknown'

export type ProviderSecretInventoryStatus =
  | 'not_attempted'
  | 'blocked_missing_gate'
  | 'blocked_wrong_project'
  | 'gcloud_unavailable'
  | 'not_authenticated'
  | 'project_unverified'
  | 'metadata_listed'
  | 'failed'

export type ProviderRuntimeGate =
  | 'backend_runtime_required'
  | 'worker_runtime_required'
  | 'user_approval_required'
  | 'credit_estimate_required'
  | 'credit_reservation_required'
  | 'job_lease_required'
  | 'provider_enabled_required'
  | 'secret_present_required'
  | 'rate_limit_required'
  | 'manual_review_required'

export type ProviderSecretName =
  | 'QWEN_API_KEY'
  | 'QWEN_BASE_URL'
  | 'QWEN_MODEL_ID'
  | 'DEEPSEEK_API_KEY'
  | 'DEEPSEEK_BASE_URL'
  | 'DEEPSEEK_MODEL_ID'
  | 'LYRIA_API_KEY'
  | 'LYRIA_PROJECT_ID'
  | 'LYRIA_LOCATION'
  | 'LYRIA_MODEL_ID'
  | 'MIRELO_API_KEY'
  | 'MIRELO_BASE_URL'
  | 'MIRELO_SFX_MODEL_ID'
  | 'MMAUDIO_API_KEY'
  | 'MMAUDIO_BASE_URL'
  | 'MMAUDIO_MODEL_ID'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'SUPABASE_DB_PASSWORD'
  | 'SUPABASE_PROJECT_REF'
  | 'STRIPE_SECRET_KEY'
  | 'STRIPE_WEBHOOK_SECRET'
  | 'GOOGLE_CLOUD_PROJECT_ID'
  | 'GOOGLE_CLOUD_REGION'
  | 'GOOGLE_CLOUD_SERVICE_ACCOUNT'
  | 'GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON'

export type FrontendPublicConfigName =
  | 'VITE_SUPABASE_URL'
  | 'VITE_SUPABASE_ANON_KEY'
  | 'VITE_REEDITPRO_AUTH_MODE'
  | 'VITE_REEDITPRO_API_BASE_URL'
  | 'VITE_REEDITPRO_API_MODE'
  | 'VITE_REEDITPRO_MOCK_MODE'

export type ProviderConfigNextStep =
  | 'configure_secret_manager'
  | 'build_backend_api_routes'
  | 'manual_review'
  | 'keep_mock_mode'

export interface ProviderSecretDefinition {
  name: ProviderSecretName
  providerId: ReeditProProviderId
  requiredForProduction: boolean
  requiredForMock: boolean
  boundary: ProviderSecretBoundary
  description: string
  neverExposeToFrontend: boolean
  notes: string[]
}

export interface FrontendPublicConfigDefinition {
  name: FrontendPublicConfigName
  description: string
  requiredForLocalDev: boolean
  requiredForProduction: boolean
  mayBeLogged: boolean
  notes: string[]
}

export interface ProviderRuntimeDefinition {
  providerId: ReeditProProviderId
  runtimeKind: ProviderRuntimeKind
  displayName: string
  description: string
  requiredSecrets: ProviderSecretName[]
  optionalSecrets: ProviderSecretName[]
  runtimeGates: ProviderRuntimeGate[]
  enabledByDefault: boolean
  mockOnly: boolean
  backendOnly: boolean
  workerOnly: boolean
  notes: string[]
}

export interface ProviderRuntimeReadiness {
  providerId: ReeditProProviderId
  status: ProviderConfigStatus
  readyForMock: boolean
  readyForProduction: boolean
  missingRequiredSecrets: ProviderSecretName[]
  missingOptionalSecrets: ProviderSecretName[]
  blockedReasons: string[]
  warnings: string[]
}

export interface ProviderSecretInventoryItem {
  name: string
  providerId?: ReeditProProviderId
  exists: boolean
  metadataOnly: true
  labels?: Record<string, string>
  createdAt?: string
  updatedAt?: string
  notes: string[]
}

export interface ProviderSecretInventoryReport {
  status: ProviderSecretInventoryStatus
  projectId?: string
  projectVerified: boolean
  inspectedAt: string
  expectedSecrets: ProviderSecretName[]
  foundSecrets: ProviderSecretInventoryItem[]
  missingSecrets: ProviderSecretName[]
  warnings: string[]
  secretValuesPrinted: false
}

export interface FrontendSecretSafetyReport {
  ok: boolean
  scannedFiles: number
  unsafeReferences: Array<{
    filePath: string
    secretName: ProviderSecretName
    reason: string
  }>
  warnings: string[]
}

export interface MockProviderConfigScenario {
  id: string
  title: string
  input: Record<string, unknown>
  expectedStatus: ProviderConfigStatus
  expectedWarnings: string[]
  mockOnly: true
}

export const REEDITPRO_SECRET_VALUES_NEVER_PRINTED_RULE =
  'ReeditPro secret values must never be printed, logged, copied into docs, or exposed to frontend code.'

export const REEDITPRO_PROVIDER_RUNTIME_BACKEND_ONLY_RULE =
  'Provider/model runtime calls are backend-only or worker-only and must never be made directly from the browser.'

export const REEDITPRO_GCLOUD_INVENTORY_METADATA_ONLY_RULE =
  'Google Cloud Secret Manager inventory may inspect metadata only and must never access secret version payloads.'
