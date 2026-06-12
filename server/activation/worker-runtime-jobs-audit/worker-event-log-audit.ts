import { existsSync, readFileSync } from 'node:fs'
import type { WorkerEventLogAudit, WorkerRuntimeFactCheck, WorkerRuntimePathCheck } from './worker-runtime-audit-types'

const JOB_MIGRATION_PATH = 'supabase/migrations/202605130005_job_orchestration_agent_runs.sql'
const READINESS_MIGRATION_PATH = 'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql'
const JOB_EVENT_SERVICE_PATH = 'src/backend/services/job-event-runtime-service.ts'
const JOB_QUEUE_SERVICE_PATH = 'src/backend/services/job-queue-runtime-service.ts'
const JOB_ORCHESTRATION_SERVICE_PATH = 'src/backend/services/job-orchestration-service.ts'

function readText(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function pathCheck(path: string, purpose: string): WorkerRuntimePathCheck {
  return { path, exists: existsSync(path), required: true, purpose }
}

function check(name: string, present: boolean, source: string, notes?: string): WorkerRuntimeFactCheck {
  return { name, status: present ? 'present' : 'missing', source, required: true, notes }
}

export function buildWorkerEventLogAudit(): WorkerEventLogAudit {
  const jobMigration = readText(JOB_MIGRATION_PATH)
  const readinessMigration = readText(READINESS_MIGRATION_PATH)
  const eventService = readText(JOB_EVENT_SERVICE_PATH)
  const queueService = readText(JOB_QUEUE_SERVICE_PATH)
  const orchestrationService = readText(JOB_ORCHESTRATION_SERVICE_PATH)
  const eventLogContracts = [
    pathCheck(JOB_MIGRATION_PATH, 'Job orchestration, job events, agent outputs, worker runtime configs, and event log migration.'),
    pathCheck(READINESS_MIGRATION_PATH, 'Runtime readiness migration with claim/storage/signed-url/provider event records.'),
    pathCheck(JOB_EVENT_SERVICE_PATH, 'Job event runtime service source.'),
    pathCheck(JOB_QUEUE_SERVICE_PATH, 'Job queue runtime service source.'),
    pathCheck(JOB_ORCHESTRATION_SERVICE_PATH, 'Job orchestration mock service source.'),
  ]
  const requiredEventTables = [
    check('job_events_table_present', /job_events/i.test(jobMigration), JOB_MIGRATION_PATH),
    check('agent_runs_table_present', /agent_runs/i.test(jobMigration), JOB_MIGRATION_PATH),
    check('agent_outputs_table_present', /agent_outputs/i.test(jobMigration), JOB_MIGRATION_PATH),
    check('event_log_table_present', /event_log/i.test(jobMigration), JOB_MIGRATION_PATH),
    check('provider_request_attempts_table_present', /provider_request_attempts/i.test(readinessMigration), READINESS_MIGRATION_PATH),
    check('provider_webhook_events_table_present', /provider_webhook_events/i.test(readinessMigration), READINESS_MIGRATION_PATH),
  ]
  const serviceSignals = [
    check('job_event_service_records_events', /event/i.test(eventService), JOB_EVENT_SERVICE_PATH),
    check('job_queue_service_exposes_queue_boundary', /queue|claim|job/i.test(queueService), JOB_QUEUE_SERVICE_PATH),
    check('job_orchestration_service_is_mock_boundary', /mock/i.test(orchestrationService), JOB_ORCHESTRATION_SERVICE_PATH),
  ]
  const activeBlockers = [
    ...eventLogContracts.filter((item) => item.required && !item.exists).map((item) => `missing_event_log_contract:${item.path}`),
    ...requiredEventTables.filter((item) => item.required && item.status === 'missing').map((item) => `missing_event_table:${item.name}`),
    ...serviceSignals.filter((item) => item.required && item.status === 'missing').map((item) => `missing_event_service_signal:${item.name}`),
  ]

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    eventLogReadiness: activeBlockers.length > 0 ? 'blocked_missing_event_log_contracts' : 'present_for_future_dry_run',
    eventLogContracts,
    requiredEventTables,
    serviceSignals,
    activeBlockers,
  }
}
