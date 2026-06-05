import {
  readTrackBReadinessRollupSummary,
  writeTrackBReadinessRollupArtifacts,
} from '../activation/track-b-readiness-rollup'

const requiredConfirmations = ['REEDITPRO_CONFIRM_TRACK_B_READINESS_ROLLUP'] as const

const forbiddenConfirmations = [
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_MIGRATION_DEPLOYMENT',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
  'REEDITPRO_CONFIRM_SERVICE_ROLE_SECRET_ACCESS',
  'REEDITPRO_CONFIRM_PROVIDER_SECRET_ACCESS',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_EXECUTION',
  'REEDITPRO_CONFIRM_DUCKDB_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_POLARS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_current_shell_confirmation',
    requiredConfirmations,
  }, null, 2))
  process.exit(0)
}

const missing = requiredConfirmations.filter((name) => process.env[name] !== 'true')
const forbidden = forbiddenConfirmations.filter((name) => process.env[name] === 'true')
if (missing.length > 0 || forbidden.length > 0) {
  console.error(JSON.stringify({
    status: 'blocked',
    blocker: missing.length > 0 ? 'missing_required_confirmation' : 'forbidden_confirmation_set',
    missing,
    forbidden,
  }, null, 2))
  process.exit(1)
}

await writeTrackBReadinessRollupArtifacts()

console.log(JSON.stringify(readTrackBReadinessRollupSummary(), null, 2))
