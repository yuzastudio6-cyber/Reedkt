export const INTERNAL_BETA_SUPABASE_CREDENTIAL_CONTEXT_PACKET =
  'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1' as const

export const INTERNAL_BETA_SUPABASE_TARGET = {
  name: 'Reeditpro',
  projectRef: 'wmyyttnynmteqgcdishd',
  class: 'staging',
} as const

export const INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES = [
  'SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_SUPABASE_ACCESS_TOKEN',
] as const

export const INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES = [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
] as const

export type InternalBetaSupabaseCredentialContextDecision =
  | 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
  | 'blocked_missing_approved_supabase_access_token_alias'
  | 'blocked_missing_approved_supabase_readonly_db_url_alias'
  | 'completed_approved_supabase_credential_alias_presence_contract_no_payload_access'

export type InternalBetaSupabaseCredentialContextExecution =
  | 'blocked_no_remote_execution_missing_safe_credential_context'
  | 'completed_local_presence_only_contract_no_remote_execution'

export interface InternalBetaSupabaseCredentialContextPresence {
  supabaseAccessToken: boolean
  supabaseAccessTokenEnv: string | null
  readonlyDatabaseUrl: boolean
  readonlyDatabaseUrlEnv: string | null
  acceptedAccessTokenEnvNames: readonly string[]
  acceptedReadonlyDbUrlEnvNames: readonly string[]
  serviceRoleKey: boolean
  databasePassword: boolean
}

export interface InternalBetaSupabaseCredentialContextContract {
  packet: typeof INTERNAL_BETA_SUPABASE_CREDENTIAL_CONTEXT_PACKET
  decision: InternalBetaSupabaseCredentialContextDecision
  execution: InternalBetaSupabaseCredentialContextExecution
  targetName: typeof INTERNAL_BETA_SUPABASE_TARGET.name
  targetRef: typeof INTERNAL_BETA_SUPABASE_TARGET.projectRef
  targetClass: typeof INTERNAL_BETA_SUPABASE_TARGET.class
  credentialPresence: InternalBetaSupabaseCredentialContextPresence
  payloadPolicy: {
    secretPayloadAccess: false
    accessTokenPayloadPrinted: false
    databaseUrlPayloadPrinted: false
    serviceRolePayloadPrinted: false
    credentialValuesPersisted: false
  }
  safety: {
    remoteSupabaseCommand: false
    remoteSupabaseMutation: false
    sqlExecution: false
    sqlMutation: false
    migrationApply: false
    storageObjectRead: false
    serviceRoleSecretPayloadAccess: false
    frontendServiceRoleCredentialExposure: false
    serviceRoleRouteExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    workerExecution: false
    providerModelCall: false
    renderExport: false
    internalBetaUnlock: false
    externalBetaUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN'
}

type EnvLike = Record<string, string | undefined>

export function createInternalBetaSupabaseCredentialContextContract(
  env: EnvLike = process.env,
): InternalBetaSupabaseCredentialContextContract {
  const accessTokenEnvName = firstPresentEnvName(INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES, env)
  const readonlyDbUrlEnvName = firstPresentEnvName(INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES, env)
  const hasAccessToken = Boolean(accessTokenEnvName)
  const hasReadonlyDbUrl = Boolean(readonlyDbUrlEnvName)
  const decision = getDecision(hasAccessToken, hasReadonlyDbUrl)

  return {
    packet: INTERNAL_BETA_SUPABASE_CREDENTIAL_CONTEXT_PACKET,
    decision,
    execution:
      decision === 'completed_approved_supabase_credential_alias_presence_contract_no_payload_access'
        ? 'completed_local_presence_only_contract_no_remote_execution'
        : 'blocked_no_remote_execution_missing_safe_credential_context',
    targetName: INTERNAL_BETA_SUPABASE_TARGET.name,
    targetRef: INTERNAL_BETA_SUPABASE_TARGET.projectRef,
    targetClass: INTERNAL_BETA_SUPABASE_TARGET.class,
    credentialPresence: {
      supabaseAccessToken: hasAccessToken,
      supabaseAccessTokenEnv: accessTokenEnvName,
      readonlyDatabaseUrl: hasReadonlyDbUrl,
      readonlyDatabaseUrlEnv: readonlyDbUrlEnvName,
      acceptedAccessTokenEnvNames: INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES,
      acceptedReadonlyDbUrlEnvNames: INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES,
      serviceRoleKey: isPresent('SUPABASE_SERVICE_ROLE_KEY', env),
      databasePassword: isPresent('SUPABASE_DB_PASSWORD', env),
    },
    payloadPolicy: {
      secretPayloadAccess: false,
      accessTokenPayloadPrinted: false,
      databaseUrlPayloadPrinted: false,
      serviceRolePayloadPrinted: false,
      credentialValuesPersisted: false,
    },
    safety: {
      remoteSupabaseCommand: false,
      remoteSupabaseMutation: false,
      sqlExecution: false,
      sqlMutation: false,
      migrationApply: false,
      storageObjectRead: false,
      serviceRoleSecretPayloadAccess: false,
      frontendServiceRoleCredentialExposure: false,
      serviceRoleRouteExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      workerExecution: false,
      providerModelCall: false,
      renderExport: false,
      internalBetaUnlock: false,
      externalBetaUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  }
}

export function assertInternalBetaSupabaseCredentialContextFailClosed(
  contract: InternalBetaSupabaseCredentialContextContract,
): void {
  if (contract.productReadyEndToEndLocalOssTools !== 0) {
    throw new Error('Internal beta Supabase credential context must not change product-ready local OSS tool count.')
  }

  for (const [key, value] of Object.entries(contract.payloadPolicy)) {
    if (value !== false) throw new Error(`Payload policy must remain false for ${key}.`)
  }

  for (const [key, value] of Object.entries(contract.safety)) {
    if (value !== false) throw new Error(`Safety flag must remain false for ${key}.`)
  }
}

function getDecision(
  hasAccessToken: boolean,
  hasReadonlyDbUrl: boolean,
): InternalBetaSupabaseCredentialContextDecision {
  if (!hasAccessToken && !hasReadonlyDbUrl) {
    return 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
  }
  if (!hasAccessToken) return 'blocked_missing_approved_supabase_access_token_alias'
  if (!hasReadonlyDbUrl) return 'blocked_missing_approved_supabase_readonly_db_url_alias'
  return 'completed_approved_supabase_credential_alias_presence_contract_no_payload_access'
}

function firstPresentEnvName(names: readonly string[], env: EnvLike): string | null {
  return names.find((name) => isPresent(name, env)) ?? null
}

function isPresent(name: string, env: EnvLike): boolean {
  return Object.prototype.hasOwnProperty.call(env, name) && env[name] !== undefined && env[name] !== ''
}
