import type {
  FrontendPublicConfigDefinition,
  FrontendPublicConfigName,
  ProviderRuntimeDefinition,
  ProviderSecretDefinition,
  ProviderSecretName,
  ReeditProProviderId,
} from '../../types'

type SecretSpec = [
  name: ProviderSecretName,
  providerId: ReeditProProviderId,
  requiredForProduction: boolean,
  boundary: ProviderSecretDefinition['boundary'],
  description: string,
  notes?: string[],
]

const secretSpecs: SecretSpec[] = [
  ['QWEN_API_KEY', 'qwen', true, 'secret_manager_only', 'Qwen provider API key for future backend reasoning calls.'],
  ['QWEN_BASE_URL', 'qwen', false, 'backend_only', 'Optional Qwen-compatible base URL override.'],
  ['QWEN_MODEL_ID', 'qwen', false, 'backend_only', 'Optional Qwen configured model ID override.'],
  ['DEEPSEEK_API_KEY', 'deepseek', true, 'secret_manager_only', 'DeepSeek provider API key for future code-agent calls.'],
  ['DEEPSEEK_BASE_URL', 'deepseek', false, 'backend_only', 'Optional DeepSeek-compatible base URL override.'],
  ['DEEPSEEK_MODEL_ID', 'deepseek', false, 'backend_only', 'Optional DeepSeek configured model ID override.'],
  ['LYRIA_API_KEY', 'lyria', true, 'secret_manager_only', 'Future Lyria music generation API key.'],
  ['LYRIA_PROJECT_ID', 'lyria', false, 'backend_only', 'Future Lyria/Google project identifier metadata.'],
  ['LYRIA_LOCATION', 'lyria', false, 'backend_only', 'Future Lyria region/location metadata.'],
  ['LYRIA_MODEL_ID', 'lyria', false, 'backend_only', 'Future Lyria model identifier.'],
  ['MIRELO_API_KEY', 'mirelo_sfx', true, 'secret_manager_only', 'Future Mirelo production SFX API key.'],
  ['MIRELO_BASE_URL', 'mirelo_sfx', false, 'backend_only', 'Optional Mirelo base URL override.'],
  ['MIRELO_SFX_MODEL_ID', 'mirelo_sfx', false, 'backend_only', 'Future Mirelo SFX model identifier.'],
  ['MMAUDIO_API_KEY', 'mmaudio', true, 'secret_manager_only', 'Future MMAudio draft/fallback SFX API key.'],
  ['MMAUDIO_BASE_URL', 'mmaudio', false, 'backend_only', 'Optional MMAudio base URL override.'],
  ['MMAUDIO_MODEL_ID', 'mmaudio', false, 'backend_only', 'Future MMAudio model identifier.'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'supabase', true, 'secret_manager_only', 'Backend-only Supabase service-role key.'],
  ['SUPABASE_DB_PASSWORD', 'supabase', true, 'secret_manager_only', 'Backend-only database password for migrations/admin operations.'],
  ['SUPABASE_PROJECT_REF', 'supabase', true, 'backend_only', 'Project ref for verified backend/Supabase operations.'],
  ['STRIPE_SECRET_KEY', 'stripe', true, 'secret_manager_only', 'Backend-only Stripe secret key.'],
  ['STRIPE_WEBHOOK_SECRET', 'stripe', true, 'secret_manager_only', 'Backend-only Stripe webhook signing secret.'],
  ['GOOGLE_CLOUD_PROJECT_ID', 'google_cloud', true, 'backend_only', 'Google Cloud project ID metadata for backend/worker runtime.'],
  ['GOOGLE_CLOUD_REGION', 'google_cloud', true, 'backend_only', 'Google Cloud runtime region metadata.'],
  ['GOOGLE_CLOUD_SERVICE_ACCOUNT', 'google_cloud', true, 'worker_only', 'Backend/worker service account identity metadata.'],
  ['GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON', 'google_cloud', true, 'secret_manager_only', 'Service account JSON payload; never store or expose in frontend code.'],
]

export const REEDITPRO_PROVIDER_SECRET_REGISTRY: ProviderSecretDefinition[] = secretSpecs.map(([
  name,
  providerId,
  requiredForProduction,
  boundary,
  description,
  notes = [],
]) => ({
  name,
  providerId,
  requiredForProduction,
  requiredForMock: false,
  boundary,
  description,
  neverExposeToFrontend: boundary !== 'frontend_public_allowed',
  notes: [
    'RP-MODEL-02 records expected names only; it does not add or read values.',
    ...notes,
  ],
}))

export const REEDITPRO_FRONTEND_PUBLIC_CONFIG_REGISTRY: FrontendPublicConfigDefinition[] = [
  {
    name: 'VITE_SUPABASE_URL',
    description: 'Public Supabase URL for browser anon client setup.',
    requiredForLocalDev: false,
    requiredForProduction: true,
    mayBeLogged: true,
    notes: ['URL only; no service-role credential.'],
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    description: 'Public anon key for RLS-limited Supabase browser access.',
    requiredForLocalDev: false,
    requiredForProduction: true,
    mayBeLogged: false,
    notes: ['Do not log key contents even though it is browser-public.'],
  },
  {
    name: 'VITE_REEDITPRO_API_BASE_URL',
    description: 'Public API base URL for future backend route calls.',
    requiredForLocalDev: false,
    requiredForProduction: true,
    mayBeLogged: true,
    notes: ['URL only; provider calls remain backend-gated.'],
  },
  {
    name: 'VITE_REEDITPRO_API_MODE',
    description: 'Public API mode selector for mock/local behavior.',
    requiredForLocalDev: false,
    requiredForProduction: false,
    mayBeLogged: true,
    notes: ['Mode only.'],
  },
  {
    name: 'VITE_REEDITPRO_MOCK_MODE',
    description: 'Public mock/local mode flag.',
    requiredForLocalDev: false,
    requiredForProduction: false,
    mayBeLogged: true,
    notes: ['Mode only.'],
  },
]

export const REEDITPRO_PROVIDER_RUNTIME_REGISTRY: ProviderRuntimeDefinition[] = [
  {
    providerId: 'qwen',
    runtimeKind: 'reasoning_model',
    displayName: 'Qwen reasoning runtime',
    description: 'Future backend-only runtime for Qwen 3.7 reasoning roles.',
    requiredSecrets: ['QWEN_API_KEY'],
    optionalSecrets: ['QWEN_BASE_URL', 'QWEN_MODEL_ID'],
    runtimeGates: ['backend_runtime_required', 'provider_enabled_required', 'secret_present_required', 'rate_limit_required', 'manual_review_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: true,
    workerOnly: false,
    notes: ['RP-MODEL-02 does not call Qwen.'],
  },
  {
    providerId: 'deepseek',
    runtimeKind: 'coding_model',
    displayName: 'DeepSeek coding runtime',
    description: 'Future backend/worker runtime for DeepSeek V4 Pro code roles.',
    requiredSecrets: ['DEEPSEEK_API_KEY'],
    optionalSecrets: ['DEEPSEEK_BASE_URL', 'DEEPSEEK_MODEL_ID'],
    runtimeGates: ['backend_runtime_required', 'worker_runtime_required', 'provider_enabled_required', 'secret_present_required', 'rate_limit_required', 'manual_review_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: true,
    workerOnly: true,
    notes: ['Future code output also needs sandbox validation from RP-MODEL-01 policy.'],
  },
  {
    providerId: 'lyria',
    runtimeKind: 'music_generation',
    displayName: 'Lyria music provider',
    description: 'Future worker-only music generation provider.',
    requiredSecrets: ['LYRIA_API_KEY'],
    optionalSecrets: ['LYRIA_PROJECT_ID', 'LYRIA_LOCATION', 'LYRIA_MODEL_ID'],
    runtimeGates: ['worker_runtime_required', 'user_approval_required', 'credit_estimate_required', 'credit_reservation_required', 'job_lease_required', 'provider_enabled_required', 'secret_present_required', 'rate_limit_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: false,
    workerOnly: true,
    notes: ['Generation remains disabled until future provider milestones.'],
  },
  {
    providerId: 'mirelo_sfx',
    runtimeKind: 'sfx_generation',
    displayName: 'Mirelo SFX provider',
    description: 'Future worker-only production SFX provider.',
    requiredSecrets: ['MIRELO_API_KEY'],
    optionalSecrets: ['MIRELO_BASE_URL', 'MIRELO_SFX_MODEL_ID'],
    runtimeGates: ['worker_runtime_required', 'user_approval_required', 'credit_estimate_required', 'credit_reservation_required', 'job_lease_required', 'provider_enabled_required', 'secret_present_required', 'rate_limit_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: false,
    workerOnly: true,
    notes: ['No Mirelo call is made by RP-MODEL-02.'],
  },
  {
    providerId: 'mmaudio',
    runtimeKind: 'sfx_generation',
    displayName: 'MMAudio SFX provider',
    description: 'Future worker-only draft/fallback SFX provider.',
    requiredSecrets: ['MMAUDIO_API_KEY'],
    optionalSecrets: ['MMAUDIO_BASE_URL', 'MMAUDIO_MODEL_ID'],
    runtimeGates: ['worker_runtime_required', 'user_approval_required', 'credit_estimate_required', 'credit_reservation_required', 'job_lease_required', 'provider_enabled_required', 'secret_present_required', 'rate_limit_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: false,
    workerOnly: true,
    notes: ['No MMAudio call is made by RP-MODEL-02.'],
  },
  {
    providerId: 'supabase',
    runtimeKind: 'database',
    displayName: 'Supabase backend runtime',
    description: 'Future backend persistence/runtime boundary.',
    requiredSecrets: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_PASSWORD', 'SUPABASE_PROJECT_REF'],
    optionalSecrets: [],
    runtimeGates: ['backend_runtime_required', 'secret_present_required', 'manual_review_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: true,
    workerOnly: false,
    notes: ['Frontend may use only public anon config.'],
  },
  {
    providerId: 'stripe',
    runtimeKind: 'billing',
    displayName: 'Stripe billing runtime',
    description: 'Future backend billing and webhook runtime.',
    requiredSecrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    optionalSecrets: [],
    runtimeGates: ['backend_runtime_required', 'secret_present_required', 'manual_review_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: true,
    workerOnly: false,
    notes: ['No billing call is made by RP-MODEL-02.'],
  },
  {
    providerId: 'google_cloud',
    runtimeKind: 'cloud_runtime',
    displayName: 'Google Cloud runtime',
    description: 'Future Cloud Run, worker, storage, and Secret Manager runtime boundary.',
    requiredSecrets: ['GOOGLE_CLOUD_PROJECT_ID', 'GOOGLE_CLOUD_REGION', 'GOOGLE_CLOUD_SERVICE_ACCOUNT', 'GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON'],
    optionalSecrets: [],
    runtimeGates: ['backend_runtime_required', 'worker_runtime_required', 'secret_present_required', 'manual_review_required'],
    enabledByDefault: false,
    mockOnly: false,
    backendOnly: true,
    workerOnly: true,
    notes: ['Secret inventory is metadata-only and gated.'],
  },
  {
    providerId: 'internal_mock',
    runtimeKind: 'internal_mock',
    displayName: 'Internal mock runtime',
    description: 'Mock/local provider used for internal testing and smoke checks.',
    requiredSecrets: [],
    optionalSecrets: [],
    runtimeGates: [],
    enabledByDefault: true,
    mockOnly: true,
    backendOnly: false,
    workerOnly: false,
    notes: ['Requires no secrets and creates no provider calls.'],
  },
]

export function listProviderSecretDefinitions(): ProviderSecretDefinition[] {
  return REEDITPRO_PROVIDER_SECRET_REGISTRY
}

export function listProviderRuntimeDefinitions(): ProviderRuntimeDefinition[] {
  return REEDITPRO_PROVIDER_RUNTIME_REGISTRY
}

export function listFrontendPublicConfigDefinitions(): FrontendPublicConfigDefinition[] {
  return REEDITPRO_FRONTEND_PUBLIC_CONFIG_REGISTRY
}

export function getProviderSecretDefinition(name: string): ProviderSecretDefinition | undefined {
  return REEDITPRO_PROVIDER_SECRET_REGISTRY.find((definition) => definition.name === name)
}

export function getProviderRuntimeDefinition(providerId: ReeditProProviderId): ProviderRuntimeDefinition | undefined {
  return REEDITPRO_PROVIDER_RUNTIME_REGISTRY.find((definition) => definition.providerId === providerId)
}

export function getProviderSecretsForProvider(providerId: ReeditProProviderId): ProviderSecretDefinition[] {
  return REEDITPRO_PROVIDER_SECRET_REGISTRY.filter((definition) => definition.providerId === providerId)
}

export function getProviderRuntimeSummary(providerId: ReeditProProviderId): string {
  const runtime = getProviderRuntimeDefinition(providerId)
  if (!runtime) return `${providerId} runtime is not registered.`
  if (runtime.mockOnly) return `${runtime.displayName} is mock/local and requires no secrets.`
  return `${runtime.displayName} is disabled until backend/worker runtime, provider enablement, and required secrets are configured.`
}

export function isProviderSecretName(name: string): name is ProviderSecretName {
  return Boolean(getProviderSecretDefinition(name))
}

export function isFrontendPublicConfigDefinitionName(name: string): name is FrontendPublicConfigName {
  return REEDITPRO_FRONTEND_PUBLIC_CONFIG_REGISTRY.some((definition) => definition.name === name)
}
