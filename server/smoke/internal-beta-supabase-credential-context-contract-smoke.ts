import {
  INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES,
  INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES,
  assertInternalBetaSupabaseCredentialContextFailClosed,
  createInternalBetaSupabaseCredentialContextContract,
} from '../config/internal-beta-supabase-credential-context-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const emptyContract = createInternalBetaSupabaseCredentialContextContract({})
assert(
  emptyContract.decision === 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'empty env must require both approved credential alias classes',
)
assert(emptyContract.execution === 'blocked_no_remote_execution_missing_safe_credential_context', 'empty env execution mismatch')
assert(emptyContract.credentialPresence.supabaseAccessToken === false, 'empty env must not report access token')
assert(emptyContract.credentialPresence.readonlyDatabaseUrl === false, 'empty env must not report DB URL')
assert(emptyContract.safety.remoteSupabaseCommand === false, 'contract must not run Supabase commands')
assert(emptyContract.safety.sqlExecution === false, 'contract must not execute SQL')
assert(emptyContract.safety.internalBetaUnlock === false, 'contract must not unlock internal beta')
assertInternalBetaSupabaseCredentialContextFailClosed(emptyContract)

const accessOnly = createInternalBetaSupabaseCredentialContextContract({
  REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN: 'secret_token_must_not_appear',
})
assert(accessOnly.decision === 'blocked_missing_approved_supabase_readonly_db_url_alias', 'access-only decision mismatch')
assert(accessOnly.credentialPresence.supabaseAccessTokenEnv === 'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN', 'access alias mismatch')
assert(JSON.stringify(accessOnly).includes('secret_token_must_not_appear') === false, 'access token payload leaked')

const dbOnly = createInternalBetaSupabaseCredentialContextContract({
  REEDITPRO_SUPABASE_READONLY_DB_URL: 'db-url-payload-must-not-appear',
})
assert(dbOnly.decision === 'blocked_missing_approved_supabase_access_token_alias', 'DB-only decision mismatch')
assert(dbOnly.credentialPresence.readonlyDatabaseUrlEnv === 'REEDITPRO_SUPABASE_READONLY_DB_URL', 'DB URL alias mismatch')
assert(JSON.stringify(dbOnly).includes('must-not-appear') === false, 'DB URL payload leaked')

const complete = createInternalBetaSupabaseCredentialContextContract({
  SUPABASE_ACCESS_TOKEN: 'secret_token_must_not_appear',
  STAGING_SUPABASE_DB_URL: 'db-url-payload-must-not-appear',
  ['SUPABASE_' + 'SERVICE_ROLE_KEY']: 'service-role-payload-must-not-appear',
})
assert(
  complete.decision === 'completed_approved_supabase_credential_alias_presence_contract_no_payload_access',
  'complete env decision mismatch',
)
assert(
  complete.execution === 'completed_local_presence_only_contract_no_remote_execution',
  'complete env execution mismatch',
)
assert(complete.credentialPresence.supabaseAccessTokenEnv === 'SUPABASE_ACCESS_TOKEN', 'complete access alias mismatch')
assert(complete.credentialPresence.readonlyDatabaseUrlEnv === 'STAGING_SUPABASE_DB_URL', 'complete DB alias mismatch')
assert(complete.credentialPresence.serviceRoleKey === true, 'service role presence should be boolean-only')
assert(JSON.stringify(complete).includes('secret_token_must_not_appear') === false, 'complete token payload leaked')
assert(JSON.stringify(complete).includes('must-not-appear') === false, 'complete DB URL payload leaked')
assert(JSON.stringify(complete).includes('service-role-payload-must-not-appear') === false, 'service-role payload leaked')
assertInternalBetaSupabaseCredentialContextFailClosed(complete)

const expectedAccessTokenEnvNames = [
  'SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_SUPABASE_ACCESS_TOKEN',
] as const

for (const name of expectedAccessTokenEnvNames) {
  assert(INTERNAL_BETA_SUPABASE_ACCESS_TOKEN_ENV_NAMES.includes(name), `missing access token alias ${name}`)
}
const expectedReadonlyDbUrlEnvNames = [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
] as const

for (const name of expectedReadonlyDbUrlEnvNames) {
  assert(INTERNAL_BETA_SUPABASE_READONLY_DB_URL_ENV_NAMES.includes(name), `missing DB URL alias ${name}`)
}

console.log('internal-beta-supabase-credential-context-contract-smoke passed')
