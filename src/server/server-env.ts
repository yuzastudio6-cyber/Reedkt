export interface BackendEnvStatus {
  supabaseUrlConfigured: boolean
  supabaseServiceRoleConfigured: boolean
  openAiConfigured: boolean
  lyriaConfigured: boolean
  mireloConfigured: boolean
  mmaudioConfigured: boolean
  stripeSecretConfigured: boolean
  stripeWebhookConfigured: boolean
  googleCloudProjectConfigured: boolean
  googleCloudRegionConfigured: boolean
  googleCloudServiceAccountConfigured: boolean
  providerSecretsConfigured: boolean
  stripeConfigured: boolean
  googleCloudConfigured: boolean
  frontendSecretLeakCheck: FrontendSecretLeakCheck
  warnings: string[]
}

export interface FrontendSecretLeakCheck {
  ok: boolean
  hasPotentialLeak: boolean
  leakedFrontendSecretKeyCount: number
  warnings: string[]
}

export interface BackendSecretPresenceSummary {
  supabaseServiceRoleConfigured: boolean
  providerSecretsConfigured: boolean
  stripeConfigured: boolean
  googleCloudConfigured: boolean
}

const BACKEND_ONLY_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'LYRIA_API_KEY',
  'MIRELO_API_KEY',
  'MMAUDIO_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_REGION',
  'GOOGLE_CLOUD_SERVICE_ACCOUNT',
] as const

const SAFE_FRONTEND_ENV_KEYS = new Set([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_REEDITPRO_API_BASE_URL',
  'VITE_REEDITPRO_API_MODE',
])

export function getBackendEnvStatus(env: NodeJS.ProcessEnv = process.env): BackendEnvStatus {
  const supabaseUrlConfigured = hasEnvValue(env, 'SUPABASE_URL')
  const supabaseServiceRoleConfigured = hasEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const openAiConfigured = hasEnvValue(env, 'OPENAI_API_KEY')
  const lyriaConfigured = hasEnvValue(env, 'LYRIA_API_KEY')
  const mireloConfigured = hasEnvValue(env, 'MIRELO_API_KEY')
  const mmaudioConfigured = hasEnvValue(env, 'MMAUDIO_API_KEY')
  const stripeSecretConfigured = hasEnvValue(env, 'STRIPE_SECRET_KEY')
  const stripeWebhookConfigured = hasEnvValue(env, 'STRIPE_WEBHOOK_SECRET')
  const googleCloudProjectConfigured = hasEnvValue(env, 'GOOGLE_CLOUD_PROJECT_ID')
  const googleCloudRegionConfigured = hasEnvValue(env, 'GOOGLE_CLOUD_REGION')
  const googleCloudServiceAccountConfigured = hasEnvValue(env, 'GOOGLE_CLOUD_SERVICE_ACCOUNT')
  const frontendSecretLeakCheck = assertNoFrontendSecretLeak(env)
  const providerSecretsConfigured = openAiConfigured || lyriaConfigured || mireloConfigured || mmaudioConfigured
  const stripeConfigured = stripeSecretConfigured && stripeWebhookConfigured
  const googleCloudConfigured = googleCloudProjectConfigured && googleCloudRegionConfigured
  const warnings: string[] = [
    ...frontendSecretLeakCheck.warnings,
  ]

  if (supabaseServiceRoleConfigured && !supabaseUrlConfigured) {
    warnings.push('Server has a Supabase service-role placeholder configured without SUPABASE_URL.')
  }

  if (providerSecretsConfigured) {
    warnings.push('Provider secret presence was detected, but provider routes remain disabled in this scaffold.')
  }

  if (stripeSecretConfigured || stripeWebhookConfigured) {
    warnings.push('Stripe secret presence was detected, but Stripe routes remain disabled in this scaffold.')
  }

  return {
    supabaseUrlConfigured,
    supabaseServiceRoleConfigured,
    openAiConfigured,
    lyriaConfigured,
    mireloConfigured,
    mmaudioConfigured,
    stripeSecretConfigured,
    stripeWebhookConfigured,
    googleCloudProjectConfigured,
    googleCloudRegionConfigured,
    googleCloudServiceAccountConfigured,
    providerSecretsConfigured,
    stripeConfigured,
    googleCloudConfigured,
    frontendSecretLeakCheck,
    warnings,
  }
}

export function assertNoFrontendSecretLeak(env: NodeJS.ProcessEnv = process.env): FrontendSecretLeakCheck {
  const leakedFrontendSecretKeyCount = Object.keys(env).filter((key) =>
    key.startsWith('VITE_') &&
    !SAFE_FRONTEND_ENV_KEYS.has(key) &&
    BACKEND_ONLY_ENV_KEYS.some((backendKey) => key.includes(backendKey)),
  ).length
  const hasPotentialLeak = leakedFrontendSecretKeyCount > 0

  return {
    ok: !hasPotentialLeak,
    hasPotentialLeak,
    leakedFrontendSecretKeyCount,
    warnings: hasPotentialLeak
      ? ['Potential backend secret was exposed through a VITE_* environment variable name. Values were not inspected or printed.']
      : [],
  }
}

export function getBackendSecretPresenceSummary(env: NodeJS.ProcessEnv = process.env): BackendSecretPresenceSummary {
  const status = getBackendEnvStatus(env)

  return {
    supabaseServiceRoleConfigured: status.supabaseServiceRoleConfigured,
    providerSecretsConfigured: status.providerSecretsConfigured,
    stripeConfigured: status.stripeConfigured,
    googleCloudConfigured: status.googleCloudConfigured,
  }
}

function hasEnvValue(env: NodeJS.ProcessEnv, key: string): boolean {
  return Boolean(env[key]?.trim())
}
