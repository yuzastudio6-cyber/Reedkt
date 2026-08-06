import type { SupabaseMilestoneSyncConfig, SupabaseMilestoneSyncSafetyFlags } from './supabase-milestone-sync-types'
import { defaultActivationLaunchPermissions } from '../activation-launch-permissions'

export const supabaseMilestoneSyncConfig: SupabaseMilestoneSyncConfig = {
  phase: '51D',
  mode: 'automatic_per_phase_supabase_milestone_sync',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-supabase/phase51d',
  baseBranch: 'codex/rp-activation-51c-historical-activation-evidence-backfill',
}

export const supabaseMilestoneSyncSafetyFlags: SupabaseMilestoneSyncSafetyFlags = {
  supabaseWritesAllowed: true,
  milestoneRegistryOnly: true,
  migrationApplyAllowed: false,
  schemaMutationAllowed: false,
  rlsMutationAllowed: false,
  historicalBackfillAllowed: false,
  secretValueLoggingAllowed: false,
  frontendServiceRoleAllowed: false,
  rawPromptExecutionAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  publicUrlSourceOfTruthAllowed: false,
  rawProviderResponseStorageAllowed: false,
  largeArtifactBlobStorageAllowed: false,
  productionReadyAllowed: defaultActivationLaunchPermissions.productionReadyAllowed,
  externalBetaAllowed: defaultActivationLaunchPermissions.externalBetaAllowed,
  paidProductionAllowed: defaultActivationLaunchPermissions.paidProductionAllowed,
  broadMediaAllowed: false,
}

export const supabaseMilestoneSyncDisabledFeatureGates = [
  'production_ready',
  'external_beta_ready',
  'paid_production_ready',
  'broad_real_media_ready',
  'public_artifacts_allowed',
  'raw_prompt_execution_allowed',
  'signed_urls_source_of_truth_allowed',
] as const

export const futurePhaseSupabaseSyncPrSummary = [
  'Supabase milestone sync:',
  '- status: completed | blocked',
  '- run ID: <phase-run-id>',
  '- activation_run row: written | not_written',
  '- readback: matched | blocked',
  '- blocker if any: <exact reason>',
].join('\n')

export function makeSupabaseMilestoneSyncRunId(): string {
  const now = new Date().toISOString()
  return `phase51d-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function supabaseMilestoneSyncArtifactPrefix(runId: string): string {
  if (!/^phase51d-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 51D run id: ${runId}`)
  return `${supabaseMilestoneSyncConfig.artifactPrefixBase}/${runId}`
}

export function validateSupabaseMilestoneSyncEnv(input: { activeProject?: string }): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== supabaseMilestoneSyncConfig.projectId) blockers.push('GCP_PROJECT_ID=reeditpro is required for Phase 51D execution.')
  if (process.env.GCP_REGION !== supabaseMilestoneSyncConfig.region) blockers.push('GCP_REGION=us-central1 is required for Phase 51D execution.')
  if (process.env.REEDITPRO_ENV !== supabaseMilestoneSyncConfig.env) blockers.push('REEDITPRO_ENV=staging is required for Phase 51D execution.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 51D execution.')
  if (input.activeProject && input.activeProject !== supabaseMilestoneSyncConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  blockers.push(...forbiddenFlagBlockers())
  warnings.push('Phase 51D writes exactly one self-sync milestone bundle to the Phase 51B registry tables; migrations, historical backfill, production, beta, public artifacts, providers, and broad media remain blocked.')
  return { ok: blockers.length === 0, blockers, warnings }
}

function forbiddenFlagBlockers(): string[] {
  const forbidden = [
    'REEDITPRO_PRODUCTION_READY',
    'REEDITPRO_EXTERNAL_BETA_READY',
    'REEDITPRO_PAID_PRODUCTION_READY',
    'REEDITPRO_BROAD_MEDIA_READY',
    'REEDITPRO_PUBLIC_ARTIFACTS_ALLOWED',
    'REEDITPRO_SIGNED_URL_SOURCE_OF_TRUTH',
    'REEDITPRO_RAW_PROMPT_EXECUTION_ALLOWED',
    'REEDITPRO_RAW_PROVIDER_RESPONSE_STORAGE_ALLOWED',
    'REEDITPRO_HISTORICAL_BACKFILL_ALLOWED',
    'REEDITPRO_SUPABASE_MIGRATION_APPLY_ALLOWED',
  ]
  return forbidden
    .filter((name) => process.env[name] === 'true')
    .map((name) => `${name} must remain false or unset for Phase 51D.`)
}
