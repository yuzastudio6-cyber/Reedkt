import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_RUNTIME_REQUIRED_SERVICE_PATHS,
} from './worker-runtime-audit-policy'
import type { WorkerClaimLeaseAudit, WorkerRuntimeFactCheck, WorkerRuntimePathCheck } from './worker-runtime-audit-types'

const CLAIM_SERVICE_PATH = 'server/services/worker-claim-service.ts'
const LEASE_SERVICE_PATH = 'src/backend/runtime/worker-lease-service.ts'
const LEASE_RECOVERY_PATH = 'src/backend/runtime/worker-lease-recovery-service.ts'
const CLAIM_MIGRATION_PATH = 'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql'
const LEASE_MIGRATION_PATH = 'supabase/migrations/202605200002_worker_leases_runtime_transport.sql'

function readText(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function pathCheck(path: string, purpose: string): WorkerRuntimePathCheck {
  return { path, exists: existsSync(path), required: true, purpose }
}

function check(name: string, present: boolean, source: string, notes?: string): WorkerRuntimeFactCheck {
  return { name, status: present ? 'present' : 'missing', source, required: true, notes }
}

export function buildWorkerClaimLeaseAudit(): WorkerClaimLeaseAudit {
  const claimService = readText(CLAIM_SERVICE_PATH)
  const leaseService = readText(LEASE_SERVICE_PATH)
  const leaseRecovery = readText(LEASE_RECOVERY_PATH)
  const claimMigration = readText(CLAIM_MIGRATION_PATH)
  const leaseMigration = readText(LEASE_MIGRATION_PATH)
  const transactionRpcRaceWindowTodosPresent =
    /TODO:.*transaction|transaction\/RPC|race window|race-window/i.test(claimService) ||
    /backend_required|mock/i.test(leaseService)

  const files = [
    pathCheck(CLAIM_SERVICE_PATH, 'Server worker claim service boundary; not executed by WORKER-0.'),
    pathCheck(LEASE_SERVICE_PATH, 'Mock/local worker lease service boundary.'),
    pathCheck(LEASE_RECOVERY_PATH, 'Mock/local stale lease recovery boundary.'),
    pathCheck(CLAIM_MIGRATION_PATH, 'Worker job claim and readiness migration source.'),
    pathCheck(LEASE_MIGRATION_PATH, 'Worker lease runtime transport migration source.'),
    ...WORKER_RUNTIME_REQUIRED_SERVICE_PATHS
      .filter((path) => ![CLAIM_SERVICE_PATH, LEASE_SERVICE_PATH, LEASE_RECOVERY_PATH].includes(path))
      .map((path) => pathCheck(path, 'Related worker/job service source audited as static text.')),
  ]

  const serviceSignals = [
    check('worker_claim_table_present', /worker_job_claims/i.test(claimMigration), CLAIM_MIGRATION_PATH),
    check('worker_leases_table_present', /worker_leases/i.test(leaseMigration), LEASE_MIGRATION_PATH),
    check('can_claim_worker_job_function_present', /can_claim_worker_job/i.test(claimMigration), CLAIM_MIGRATION_PATH),
    check('active_worker_claim_exists_function_present', /active_worker_claim_exists/i.test(claimMigration), CLAIM_MIGRATION_PATH),
    check('server_claim_service_has_service_role_boundary', /service_role|admin|backend/i.test(claimService), CLAIM_SERVICE_PATH),
    check('mock_local_lease_boundary_present', /mock|backend_required/i.test(leaseService), LEASE_SERVICE_PATH),
    check('lease_recovery_boundary_present', /stale|recover|lease/i.test(leaseRecovery), LEASE_RECOVERY_PATH),
    check(
      'transaction_rpc_race_window_todo_recorded',
      transactionRpcRaceWindowTodosPresent,
      CLAIM_SERVICE_PATH,
      'This is a future real-runtime blocker, not a WORKER-0 audit blocker.',
    ),
  ]
  const activeBlockers = [
    ...files.filter((item) => item.required && !item.exists).map((item) => `missing_claim_lease_source:${item.path}`),
    ...serviceSignals.filter((item) => item.required && item.status === 'missing').map((item) => `missing_claim_lease_signal:${item.name}`),
  ]

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    claimExecutionStatus: 'blocked_until_future_transactional_backend_runtime',
    mockLocalBoundaryPresent: /mock|backend_required/i.test(leaseService),
    serviceRoleBoundaryPresent: /service_role|admin|backend/i.test(claimService),
    transactionRpcRaceWindowTodosPresent,
    files,
    serviceSignals,
    futureRuntimeBlockers: [
      'claim_service_insert_path_needs_transaction_or_rpc_before_real_parallel_claim_execution',
      'lease_heartbeat_enforcement_needs_backend_service_role_runtime_before_real_worker_dispatch',
      'real worker execution remains blocked until approved Worker Runtime implementation and service deployment',
    ],
    activeBlockers,
  }
}
