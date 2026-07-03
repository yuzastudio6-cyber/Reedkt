import {
  runProductionToolExecutionReadinessEvidenceCollectorFromEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorFetch,
} from './production-tool-execution-readiness-evidence-collector'
import { buildProductionToolExecutionReadinessGateInput } from './production-tool-execution-readiness-evidence-preflight'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionSupabasePersistenceEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE?: string
}

export interface ProductionSupabasePersistenceEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded'
  readyForSupabasePersistenceEvidence: boolean
  recordConfirmationRequired: boolean
  supabasePersistence: ProductionSupabasePersistenceSliceStatus
  record?: Awaited<ReturnType<typeof runProductionToolExecutionReadinessEvidenceCollectorFromEnv>>
  warnings: string[]
}

export interface ProductionSupabasePersistenceSliceStatus {
  ready: boolean
  evidenceArtifactIdPresent: boolean
  reviewedByPresent: boolean
  reviewedAtValid: boolean
  notesPresent: boolean
  checks: Record<string, boolean>
  blockers: string[]
}

export async function runProductionSupabasePersistenceEvidenceCollectorFromEnv(
  env: ProductionSupabasePersistenceEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionSupabasePersistenceEvidenceCollectorRunResult> {
  const input = buildProductionToolExecutionReadinessGateInput(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: env.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: env.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    supabaseArtifactId: env.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID,
    supabaseNotes: env.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
  }, 'productionSupabasePersistenceEvidenceCollector')
  if (secretLikeInputPaths.length > 0) {
    throw new Error(`Production Supabase persistence evidence collector inputs contain secret-like values: ${secretLikeInputPaths.join('; ')}`)
  }

  const supabasePersistence = buildSliceStatus({
    evidenceArtifactId: input.supabasePersistence?.evidenceArtifactId,
    reviewedBy: input.supabasePersistence?.reviewedBy,
    reviewedAt: input.supabasePersistence?.reviewedAt,
    notes: input.supabasePersistence?.notes,
    checks: {
      productionEnvironment: input.supabasePersistence?.environment === 'production',
      toolCostEventsMigrationDeployed: Boolean(input.supabasePersistence?.toolCostEventsMigrationDeployed),
      betaReadinessEvidenceMigrationDeployed: Boolean(input.supabasePersistence?.betaReadinessEvidenceMigrationDeployed),
      productionReadinessEvidenceMigrationDeployed: Boolean(input.supabasePersistence?.productionReadinessEvidenceMigrationDeployed),
      workerRuntimeArtifactManifestMigrationDeployed: Boolean(input.supabasePersistence?.workerRuntimeArtifactManifestMigrationDeployed),
      workerRuntimeArtifactManifestServiceRoleOnlyVerified: Boolean(input.supabasePersistence?.workerRuntimeArtifactManifestServiceRoleOnlyVerified),
      workerRuntimeArtifactManifestReadbackVerified: Boolean(input.supabasePersistence?.workerRuntimeArtifactManifestReadbackVerified),
      serviceRoleWritePathVerified: Boolean(input.supabasePersistence?.serviceRoleWritePathVerified),
      rlsMemberReadPathVerified: Boolean(input.supabasePersistence?.rlsMemberReadPathVerified),
      explicitDataApiGrantsVerified: Boolean(input.supabasePersistence?.explicitDataApiGrantsVerified),
      betaEvidenceBackendOnlyAccessVerified: Boolean(input.supabasePersistence?.betaEvidenceBackendOnlyAccessVerified),
      productionEvidenceBackendOnlyAccessVerified: Boolean(input.supabasePersistence?.productionEvidenceBackendOnlyAccessVerified),
      backupPitrApproved: Boolean(input.supabasePersistence?.backupPitrApproved),
      securityAdvisorReviewed: Boolean(input.supabasePersistence?.securityAdvisorReviewed),
      performanceAdvisorReviewed: Boolean(input.supabasePersistence?.performanceAdvisorReviewed),
      storagePoliciesVerified: Boolean(input.supabasePersistence?.storagePoliciesVerified),
    },
  })
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE)

  if (!supabasePersistence.ready) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForSupabasePersistenceEvidence: false,
      recordConfirmationRequired: true,
      supabasePersistence,
      warnings: [
        'Supabase production persistence evidence is incomplete; no backend record call was attempted.',
        'This collector does not connect to Supabase, run SQL, deploy migrations, write data, alter grants, enable beta, or activate production.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForSupabasePersistenceEvidence: true,
      recordConfirmationRequired: true,
      supabasePersistence,
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_SUPABASE_PERSISTENCE_CONFIRM_RECORD_EVIDENCE=true is required before reusing the backend production readiness evidence route.',
        'The all-up production readiness packet still requires billing, wallet, Stripe, ops/observability, tools, hard-safety, and final owner evidence before recording can pass.',
      ],
    }
  }

  const record = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...env,
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  }, fetchImpl)
  if (!record.ok || record.mode !== 'recorded') {
    throw new Error('Production Supabase persistence evidence could not be recorded because the all-up production readiness evidence collector did not record a passing packet.')
  }

  return {
    ok: true,
    mode: 'recorded',
    readyForSupabasePersistenceEvidence: true,
    recordConfirmationRequired: false,
    supabasePersistence,
    record,
    warnings: [
      ...record.warnings,
      'Supabase persistence evidence was recorded only as part of the authenticated all-up production readiness evidence packet.',
      'This collector did not connect to Supabase, run SQL, deploy migrations, write data, alter grants, enable beta, or activate production.',
    ],
  }
}

function buildSliceStatus(input: {
  evidenceArtifactId?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string[]
  checks: Record<string, boolean>
}): ProductionSupabasePersistenceSliceStatus {
  const evidenceArtifactIdPresent = Boolean(input.evidenceArtifactId?.trim())
  const reviewedByPresent = Boolean(input.reviewedBy?.trim())
  const reviewedAtValid = Boolean(input.reviewedAt && isValidIsoDate(input.reviewedAt))
  const notesPresent = Boolean(input.notes?.length && input.notes.every((note) => note.trim().length > 0))
  const blockers = [
    evidenceArtifactIdPresent ? undefined : 'evidence artifact ID is missing.',
    reviewedByPresent ? undefined : 'reviewer reference is missing.',
    reviewedAtValid ? undefined : 'review timestamp is missing or invalid.',
    notesPresent ? undefined : 'evidence notes are missing.',
    ...Object.entries(input.checks).map(([name, ok]) => ok ? undefined : `${name} is not verified.`),
  ].filter((item): item is string => Boolean(item))

  return {
    ready: blockers.length === 0,
    evidenceArtifactIdPresent,
    reviewedByPresent,
    reviewedAtValid,
    notesPresent,
    checks: input.checks,
    blockers,
  }
}

function isValidIsoDate(value: string): boolean {
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runProductionSupabasePersistenceEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
