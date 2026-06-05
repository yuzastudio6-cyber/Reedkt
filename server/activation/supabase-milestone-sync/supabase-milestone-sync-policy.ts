import type { SupabaseFeatureGateInput } from '../supabase-milestone-registry'
import type { SupabaseMilestoneSyncConfig, SupabaseMilestoneSyncPolicy } from './supabase-milestone-sync-types'

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
  branch: 'codex/rp-activation-51d-automatic-supabase-milestone-sync',
}

export const supabaseMilestoneSyncSafetyFlags: SupabaseMilestoneSyncPolicy = {
  writesAllowed: true,
  migrationsAllowed: false,
  historicalBackfillAllowed: false,
  productRowWritesAllowed: false,
  providerCallsAllowed: false,
  frontendServiceRoleExposureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const supabaseMilestoneSyncDisabledFeatureGates: SupabaseFeatureGateInput[] = [
  disabledGate('production_delivery', 'Production delivery'),
  disabledGate('external_beta', 'External beta'),
  disabledGate('paid_production', 'Paid production'),
  disabledGate('broad_real_media', 'Broad real media'),
  disabledGate('public_artifacts', 'Public artifacts'),
  disabledGate('signed_url_source_of_truth', 'Signed URL source of truth'),
  disabledGate('raw_prompt_execution', 'Raw prompt execution'),
]

export const futurePhaseSupabaseSyncPrTemplate = [
  'Supabase milestone sync: completed/blocked',
  'Supabase sync run ID: <phase-run-id>',
  'Supabase sync artifact: gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/<phase>/<runId>/reports/<report>.json',
  'Registry write/readback: completed/blocked',
  'Production/external beta/broad media/public artifacts/signed URL source-of-truth: blocked',
].join('\n')

export function makeSupabaseMilestoneSyncRunId(now = new Date()): string {
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
  return `phase51d-${timestamp}`
}

export function supabaseMilestoneSyncArtifactPrefix(runId: string): string {
  return `${supabaseMilestoneSyncConfig.artifactPrefixBase}/${runId}`
}

export function validateSupabaseMilestoneSyncEnv(input: { activeProject?: string }): { ok: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.GCP_PROJECT_ID !== supabaseMilestoneSyncConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== supabaseMilestoneSyncConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== supabaseMilestoneSyncConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC !== 'true') blockers.push('REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true is required for Phase 51D execution.')
  if (input.activeProject && input.activeProject !== supabaseMilestoneSyncConfig.projectId) blockers.push(`Active gcloud project must be reeditpro, got ${input.activeProject}.`)
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY === 'true') blockers.push('Phase 51D must not apply migrations; unset REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY.')
  if (process.env.REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL === 'true') blockers.push('Phase 51D must not rerun historical backfill; unset REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL.')
  warnings.push('Execution writes exactly one Phase 51D self-sync bundle to the Phase 51B milestone registry.')
  return { ok: blockers.length === 0, blockers, warnings }
}

function disabledGate(gateKey: string, gateName: string): SupabaseFeatureGateInput {
  return {
    gateKey,
    gateName,
    gateStatus: 'blocked',
    enabled: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    evidence: { phase: '51D', reason: 'Phase 51D is milestone-sync plumbing only.' },
  }
}
