import type { SupabaseClient } from '@supabase/supabase-js'
import { getRequiredSupabaseRuntimeTables } from '../supabase/table-readiness'

export interface SupabaseSmokeLeftoverRecord {
  table: string
  id: string
  matchedBy: string
}

export interface SupabaseSmokeLeftoverResult {
  ok: boolean
  smokeRunId?: string
  checkedTables: string[]
  leftovers: SupabaseSmokeLeftoverRecord[]
  queryErrors: string[]
  warnings: string[]
}

export interface ExactSmokeRecordRef {
  table: string
  id: string
}

const OPTIONAL_SMOKE_TABLES = [
  'user_profiles',
  'profiles',
  'edit_sessions',
  'edit_plan_versions',
  'job_events',
  'render_events',
  'qa_report_items',
]

const JSON_SMOKE_COLUMNS = [
  'metadata',
  'metadata_json',
  'content_json',
  'input_payload',
  'output_payload',
  'error_payload',
  'payload',
  'event_payload',
  'render_payload',
  'qa_payload',
  'item_payload',
  'line_payload',
  'estimate_payload',
  'approval_payload',
  'plan_payload',
  'snapshot_json',
  'snapshot_payload',
  'timeline_spec',
  'render_settings',
]

const TEXT_SMOKE_COLUMNS = [
  'idempotency_key',
  'email',
  'slug',
]

export async function findSupabaseSmokeRunLeftovers(
  client: SupabaseClient,
  smokeRunId: string,
): Promise<SupabaseSmokeLeftoverResult> {
  const tableNames = Array.from(new Set([...getRequiredSupabaseRuntimeTables(), ...OPTIONAL_SMOKE_TABLES]))
  const columnsByTable = await loadColumnNames(client, tableNames)
  const leftovers = new Map<string, SupabaseSmokeLeftoverRecord>()
  const queryErrors: string[] = []
  const warnings: string[] = []
  const checkedTables: string[] = []

  for (const table of tableNames) {
    const columns = columnsByTable[table] ?? []
    if (columns.length === 0) continue
    checkedTables.push(table)

    for (const column of columns.filter((candidate) => JSON_SMOKE_COLUMNS.includes(candidate))) {
      const result = await readJsonSmokeMatches(client, table, column, smokeRunId)
      for (const error of result.errors) queryErrors.push(error)
      for (const id of result.ids) {
        leftovers.set(`${table}/${id}/${column}`, { table, id, matchedBy: `${column}->>smokeRunId` })
      }
    }

    for (const column of columns.filter((candidate) => TEXT_SMOKE_COLUMNS.includes(candidate))) {
      const result = await readTextSmokeMatches(client, table, column, smokeRunId)
      for (const error of result.errors) queryErrors.push(error)
      for (const id of result.ids) {
        leftovers.set(`${table}/${id}/${column}`, { table, id, matchedBy: column })
      }
    }
  }

  if (checkedTables.length === 0) {
    warnings.push('No smoke-checkable Supabase tables were reachable for leftover scanning.')
  }

  return {
    ok: leftovers.size === 0 && queryErrors.length === 0,
    smokeRunId,
    checkedTables,
    leftovers: Array.from(leftovers.values()),
    queryErrors,
    warnings,
  }
}

export async function findExactSupabaseSmokeRecordLeftovers(
  client: SupabaseClient,
  records: ExactSmokeRecordRef[],
): Promise<SupabaseSmokeLeftoverResult> {
  const leftovers: SupabaseSmokeLeftoverRecord[] = []
  const queryErrors: string[] = []
  const checkedTables = Array.from(new Set(records.map((record) => record.table)))

  for (const record of uniqueRecordRefs(records)) {
    const { data, error } = await client
      .from(record.table)
      .select('id')
      .eq('id', record.id)
      .maybeSingle()

    if (error) {
      queryErrors.push(`${record.table}/${record.id}: ${error.message}`)
      continue
    }

    if (data) {
      leftovers.push({ table: record.table, id: record.id, matchedBy: 'exact_id' })
    }
  }

  return {
    ok: leftovers.length === 0 && queryErrors.length === 0,
    checkedTables,
    leftovers,
    queryErrors,
    warnings: [],
  }
}

async function loadColumnNames(
  client: SupabaseClient,
  tableNames: string[],
): Promise<Record<string, string[]>> {
  const columnsByTable: Record<string, string[]> = {}
  try {
    const { data, error } = await client
      .schema('information_schema')
      .from('columns')
      .select('table_name,column_name')
      .eq('table_schema', 'public')
      .in('table_name', tableNames)

    if (!error) {
      for (const row of data ?? []) {
        const table = String((row as { table_name?: unknown }).table_name ?? '')
        const column = String((row as { column_name?: unknown }).column_name ?? '')
        if (!table || !column) continue
        columnsByTable[table] ??= []
        columnsByTable[table].push(column)
      }
      return columnsByTable
    }
  } catch {
    // Fall through to conservative probes below.
  }

  for (const table of tableNames) {
    const { error } = await client.from(table).select('id', { head: true, count: 'exact' }).limit(1)
    if (!error) columnsByTable[table] = [...JSON_SMOKE_COLUMNS, ...TEXT_SMOKE_COLUMNS]
  }
  return columnsByTable
}

async function readJsonSmokeMatches(
  client: SupabaseClient,
  table: string,
  column: string,
  smokeRunId: string,
): Promise<{ ids: string[]; errors: string[] }> {
  const { data, error } = await client
    .from(table)
    .select('id')
    .eq(`${column}->>smokeRunId`, smokeRunId)
    .limit(100)

  if (error) return { ids: [], errors: isMissingColumnError(error.message) ? [] : [`${table}.${column}: ${error.message}`] }
  return { ids: extractIds(data), errors: [] }
}

async function readTextSmokeMatches(
  client: SupabaseClient,
  table: string,
  column: string,
  smokeRunId: string,
): Promise<{ ids: string[]; errors: string[] }> {
  const { data, error } = await client
    .from(table)
    .select('id')
    .ilike(column, `%${smokeRunId}%`)
    .limit(100)

  if (error) return { ids: [], errors: isMissingColumnError(error.message) ? [] : [`${table}.${column}: ${error.message}`] }
  return { ids: extractIds(data), errors: [] }
}

function extractIds(data: unknown): string[] {
  if (!Array.isArray(data)) return []
  return data
    .map((row) => String((row as { id?: unknown }).id ?? ''))
    .filter(Boolean)
}

function uniqueRecordRefs(records: ExactSmokeRecordRef[]): ExactSmokeRecordRef[] {
  const seen = new Set<string>()
  return records.filter((record) => {
    const key = `${record.table}/${record.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isMissingColumnError(message: string): boolean {
  return /column|schema cache|could not find/i.test(message)
}
