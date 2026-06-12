import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
} from './worker-runtime-audit-policy'
import type { ApprovedPlanIntakeAudit, WorkerRuntimeFactCheck, WorkerRuntimePathCheck } from './worker-runtime-audit-types'

const CANDIDATE_SNAPSHOT_PATH =
  'docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'
const WORKER_JOB_CONTRACTS_PATH = 'src/backend/cloud/worker-job-contracts.ts'
const APPROVED_PLAN_CONTRACTS_PATH = 'src/backend/cloud/approved-plan-snapshot-contracts.ts'
const APPROVED_SNAPSHOT_SERVICE_PATH = 'server/services/approved-snapshot-service.ts'

function pathCheck(path: string, purpose: string): WorkerRuntimePathCheck {
  return { path, exists: existsSync(path), required: true, purpose }
}

function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function check(name: string, present: boolean, source: string, notes?: string): WorkerRuntimeFactCheck {
  return { name, status: present ? 'present' : 'missing', source, required: true, notes }
}

export function buildApprovedPlanIntakeAudit(): ApprovedPlanIntakeAudit {
  const candidate = readText(CANDIDATE_SNAPSHOT_PATH)
  const workerContracts = readText(WORKER_JOB_CONTRACTS_PATH)
  const approvedContracts = readText(APPROVED_PLAN_CONTRACTS_PATH)
  const approvedSnapshotService = readText(APPROVED_SNAPSHOT_SERVICE_PATH)
  const candidateContractCompatibleForReview =
    /"executionStatus"\s*:\s*"candidate_only"/.test(candidate) &&
    /"approvedForRuntime"\s*:\s*false/.test(candidate) &&
    /"workerExecutionAllowed"\s*:\s*false/.test(candidate)

  const intakeContracts = [
    pathCheck(CANDIDATE_SNAPSHOT_PATH, 'PLAN-SNAPSHOT-1 candidate-only approved-plan snapshot evidence.'),
    pathCheck(WORKER_JOB_CONTRACTS_PATH, 'Frontend/backend cloud worker job payload contract validator.'),
    pathCheck(APPROVED_PLAN_CONTRACTS_PATH, 'Approved-plan snapshot contract validator for worker readiness.'),
    pathCheck(APPROVED_SNAPSHOT_SERVICE_PATH, 'Server approved snapshot persistence boundary.'),
  ]
  const serviceBoundaries = [
    check('worker_job_contract_requires_approved_snapshot_id', /approvedPlanSnapshotId/.test(workerContracts), WORKER_JOB_CONTRACTS_PATH),
    check('worker_job_contract_blocks_raw_prompt_only_execution', /raw prompt/i.test(workerContracts), WORKER_JOB_CONTRACTS_PATH),
    check('approved_snapshot_requires_hash_and_approval_fields', /snapshotHash/.test(approvedContracts) && /approvedAt/.test(approvedContracts), APPROVED_PLAN_CONTRACTS_PATH),
    check(
      'approved_snapshot_service_is_server_side',
      /service_role|admin|backend/i.test(approvedSnapshotService),
      APPROVED_SNAPSHOT_SERVICE_PATH,
      'WORKER-0 does not call the service.',
    ),
  ]
  const requiredWorkerSnapshotFields = [
    check('execution_status_candidate_only', /"executionStatus"\s*:\s*"candidate_only"/.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('approved_for_runtime_false', /"approvedForRuntime"\s*:\s*false/.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('worker_execution_allowed_false', /"workerExecutionAllowed"\s*:\s*false/.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('owner_routes_present', /"ownerRoutes"\s*:/.test(candidate), CANDIDATE_SNAPSHOT_PATH),
    check('runtime_limits_present', /"runtimeLimits"\s*:/.test(candidate), CANDIDATE_SNAPSHOT_PATH),
  ]
  const activeBlockers = [
    ...intakeContracts.filter((item) => item.required && !item.exists).map((item) => `missing_intake_contract:${item.path}`),
    ...serviceBoundaries.filter((item) => item.required && item.status === 'missing').map((item) => `missing_service_boundary:${item.name}`),
    ...requiredWorkerSnapshotFields.filter((item) => item.required && item.status === 'missing').map((item) => `missing_snapshot_field:${item.name}`),
  ]
  if (!candidateContractCompatibleForReview) activeBlockers.push('candidate_snapshot_not_review_compatible')

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourcePlanSnapshotRunId: WORKER_RUNTIME_JOBS_AUDIT_SOURCE_RUN_ID,
    candidateContractCompatibleForReview,
    runtimeApproved: false,
    intakeContracts,
    serviceBoundaries,
    requiredWorkerSnapshotFields,
    activeBlockers,
  }
}
