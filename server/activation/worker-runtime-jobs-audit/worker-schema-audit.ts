import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_RUNTIME_REQUIRED_FUNCTIONS,
  WORKER_RUNTIME_REQUIRED_MIGRATION_PATHS,
  WORKER_RUNTIME_REQUIRED_TABLES,
} from './worker-runtime-audit-policy'
import type { WorkerRuntimeFactCheck, WorkerRuntimePathCheck, WorkerSchemaAudit } from './worker-runtime-audit-types'

function readExistingText(filePaths: readonly string[]): string {
  return filePaths
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => readFileSync(filePath, 'utf8'))
    .join('\n')
}

function migrationPathCheck(path: string): WorkerRuntimePathCheck {
  return {
    path,
    exists: existsSync(path),
    required: true,
    purpose: 'Local migration source used for WORKER-0 schema readiness audit only.',
  }
}

function checkSqlToken(
  token: string,
  text: string,
  source: string,
  required: boolean,
  notes?: string,
): WorkerRuntimeFactCheck {
  const regex = new RegExp(`\\b${token}\\b`, 'i')
  return {
    name: token,
    status: regex.test(text) ? 'present' : required ? 'missing' : 'not_required',
    source,
    required,
    notes,
  }
}

export function buildWorkerSchemaAudit(): WorkerSchemaAudit {
  const migrations = WORKER_RUNTIME_REQUIRED_MIGRATION_PATHS.map(migrationPathCheck)
  const sql = readExistingText(WORKER_RUNTIME_REQUIRED_MIGRATION_PATHS)
  const requiredTables = WORKER_RUNTIME_REQUIRED_TABLES.map((table) =>
    checkSqlToken(table, sql, 'local Supabase migration files', true),
  )
  const requiredFunctions = WORKER_RUNTIME_REQUIRED_FUNCTIONS.map((fn) =>
    checkSqlToken(fn, sql, 'local Supabase migration files', true),
  )
  const rlsAndGrantSignals: WorkerRuntimeFactCheck[] = [
    {
      name: 'row_level_security_enabled',
      status: /enable row level security/i.test(sql) ? 'present' : 'missing',
      source: 'local Supabase migration files',
      required: true,
      notes: 'WORKER-0 audits presence only; it does not execute SQL or inspect live staging policies.',
    },
    {
      name: 'service_role_grants',
      status: /service_role/i.test(sql) ? 'present' : 'missing',
      source: 'local Supabase migration files',
      required: true,
      notes: 'Future Worker Runtime execution remains service-role/backend only.',
    },
    {
      name: 'public_artifact_access_not_selected',
      status: 'present',
      source: 'WORKER-0 policy',
      required: true,
      notes: 'Signed URLs and public artifacts are explicitly excluded as source of truth.',
    },
  ]
  const activeBlockers = [
    ...migrations.filter((item) => item.required && !item.exists).map((item) => `missing_migration:${item.path}`),
    ...requiredTables.filter((item) => item.required && item.status === 'missing').map((item) => `missing_table:${item.name}`),
    ...requiredFunctions.filter((item) => item.required && item.status === 'missing').map((item) => `missing_function:${item.name}`),
    ...rlsAndGrantSignals.filter((item) => item.required && item.status === 'missing').map((item) => `missing_security_signal:${item.name}`),
  ]

  return {
    phase: 'WORKER_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    migrations,
    requiredTables,
    requiredFunctions,
    rlsAndGrantSignals,
    workerSchemaReadiness: activeBlockers.length > 0
      ? 'blocked_missing_required_contracts'
      : 'present_for_audit',
    activeBlockers,
  }
}
