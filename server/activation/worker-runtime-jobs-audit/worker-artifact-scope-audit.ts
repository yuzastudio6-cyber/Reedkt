import { existsSync, readFileSync } from 'node:fs'
import type { WorkerArtifactScopeAudit, WorkerRuntimeFactCheck, WorkerRuntimePathCheck } from './worker-runtime-audit-types'

const CANDIDATE_SNAPSHOT_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'
const SNAPSHOT_RESULTS_PATH = 'docs/activation-phase-provider-output-plan-snapshot-contract-results.md'
const STORAGE_MIGRATION_PATH = 'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql'
const WORKER_JOB_CONTRACTS_PATH = 'src/backend/cloud/worker-job-contracts.ts'

function readText(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function pathCheck(path: string, purpose: string): WorkerRuntimePathCheck {
  return { path, exists: existsSync(path), required: true, purpose }
}

function check(name: string, present: boolean, source: string, notes?: string): WorkerRuntimeFactCheck {
  return { name, status: present ? 'present' : 'missing', source, required: true, notes }
}

export function buildWorkerArtifactScopeAudit(): WorkerArtifactScopeAudit {
  const candidate = readText(CANDIDATE_SNAPSHOT_PATH)
  const results = readText(SNAPSHOT_RESULTS_PATH)
  const storageMigration = readText(STORAGE_MIGRATION_PATH)
  const workerContracts = readText(WORKER_JOB_CONTRACTS_PATH)
  const signedUrlsSourceOfTruth = /signedUrlSourceOfTruthAllowed"\s*:\s*true/.test(candidate) ||
    /signed url source of truth:\s*`true`/i.test(results)
  const publicArtifactsAllowed = /publicArtifactAllowed"\s*:\s*true/.test(candidate) ||
    /public artifacts.*`true`/i.test(results)

  const artifactContracts = [
    pathCheck(CANDIDATE_SNAPSHOT_PATH, 'PLAN-SNAPSHOT-1 artifact policy and private GCS refs.'),
    pathCheck(SNAPSHOT_RESULTS_PATH, 'PLAN-SNAPSHOT-1 artifact result status.'),
    pathCheck(STORAGE_MIGRATION_PATH, 'Local storage object and signed URL event table definitions.'),
    pathCheck(WORKER_JOB_CONTRACTS_PATH, 'Worker payload contract that rejects signed URL/source-of-truth leakage.'),
  ]
  const storageSignals = [
    check('private_generated_gcs_prefix_present', /gs:\/\/reeditpro-staging-reeditpro-generated-assets\//.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('private_qa_gcs_prefix_present', /gs:\/\/reeditpro-staging-reeditpro-qa-artifacts\//.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('storage_object_records_table_present', /storage_object_records/i.test(storageMigration), STORAGE_MIGRATION_PATH),
    check('signed_url_events_table_present_for_audit_only', /signed_url_events/i.test(storageMigration), STORAGE_MIGRATION_PATH),
    check('worker_contract_checks_signed_url_restrictions', /signed url|signedUrl/i.test(workerContracts), WORKER_JOB_CONTRACTS_PATH),
    check('public_artifacts_not_allowed', !publicArtifactsAllowed, CANDIDATE_SNAPSHOT_PATH),
    check('signed_urls_not_source_of_truth', !signedUrlsSourceOfTruth, CANDIDATE_SNAPSHOT_PATH),
  ]
  const activeBlockers = [
    ...artifactContracts.filter((item) => item.required && !item.exists).map((item) => `missing_artifact_contract:${item.path}`),
    ...storageSignals.filter((item) => item.required && item.status === 'missing').map((item) => `missing_artifact_scope_signal:${item.name}`),
  ]

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    privateGcsRefsOnly: !publicArtifactsAllowed && !signedUrlsSourceOfTruth,
    signedUrlsSourceOfTruth: false,
    publicArtifactsAllowed: false,
    artifactContracts,
    storageSignals,
    activeBlockers,
  }
}
