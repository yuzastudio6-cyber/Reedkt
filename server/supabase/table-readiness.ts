import type { SupabaseClient } from '@supabase/supabase-js'

export interface TableReadinessGroup {
  group: string
  tables: string[]
}

export interface TableReadinessResult {
  ok: boolean
  checkedAt: string
  availableTables: string[]
  missingTables: string[]
  groups: Array<{
    group: string
    ok: boolean
    availableTables: string[]
    missingTables: string[]
  }>
  warnings: string[]
}

export const REQUIRED_TABLE_GROUPS: TableReadinessGroup[] = [
  {
    group: 'core',
    tables: [
      'workspaces',
      'workspace_members',
      'projects',
      'chat_sessions',
      'chat_messages',
      'chat_attachments',
      'media_assets',
      'source_clip_sequences',
      'source_clip_sequence_items',
    ],
  },
  {
    group: 'planning',
    tables: [
      'intent_analyses',
      'edit_plans',
      'edit_plan_segments',
      'signature_routes',
    ],
  },
  {
    group: 'credits_approval',
    tables: [
      'credit_wallets',
      'credit_estimates',
      'credit_estimate_line_items',
      'credit_approvals',
      'credit_reservations',
      'credit_ledger_entries',
    ],
  },
  {
    group: 'jobs',
    tables: [
      'job_batches',
      'jobs',
      'job_dependencies',
      'job_events',
      'agent_runs',
      'agent_outputs',
    ],
  },
  {
    group: 'generation_render_qa',
    tables: [
      'generation_requests',
      'generated_assets',
      'render_jobs',
      'render_job_inputs',
      'renders',
      'preview_reviews',
      'qa_reports',
      'qa_report_items',
    ],
  },
  {
    group: 'rp_e2e_runtime',
    tables: [
      'approved_plan_snapshots',
      'api_idempotency_keys',
      'upload_intents',
      'storage_object_records',
      'signed_url_events',
      'worker_job_claims',
      'tool_runtime_checks',
      'provider_request_attempts',
      'provider_webhook_events',
    ],
  },
  {
    group: 'sfx_timing',
    tables: [
      'sfx_event_plans',
      'sfx_provider_routes',
      'sfx_prompt_plans',
      'master_timing_maps',
      'timing_anchors',
      'timing_events',
    ],
  },
]

export function getRequiredSupabaseRuntimeTables(): string[] {
  return Array.from(new Set(REQUIRED_TABLE_GROUPS.flatMap((group) => group.tables)))
}

export async function checkSupabaseTableReadiness(client: SupabaseClient): Promise<TableReadinessResult> {
  const warnings: string[] = []
  const requiredTables = getRequiredSupabaseRuntimeTables()
  const informationSchemaResult = await readTablesFromInformationSchema(client, requiredTables)

  let availableTables: string[]
  if (informationSchemaResult.ok) {
    availableTables = informationSchemaResult.availableTables
  } else {
    warnings.push(informationSchemaResult.warning)
    const fallback = await checkTablesByHeadSelect(client, requiredTables)
    availableTables = fallback.availableTables
    warnings.push(...fallback.warnings)
  }

  const availableSet = new Set(availableTables)
  const groups = REQUIRED_TABLE_GROUPS.map((group) => {
    const groupAvailable = group.tables.filter((table) => availableSet.has(table))
    const groupMissing = group.tables.filter((table) => !availableSet.has(table))
    return {
      group: group.group,
      ok: groupMissing.length === 0,
      availableTables: groupAvailable,
      missingTables: groupMissing,
    }
  })
  const missingTables = groups.flatMap((group) => group.missingTables)

  return {
    ok: missingTables.length === 0,
    checkedAt: new Date().toISOString(),
    availableTables: requiredTables.filter((table) => availableSet.has(table)),
    missingTables,
    groups,
    warnings,
  }
}

async function readTablesFromInformationSchema(
  client: SupabaseClient,
  requiredTables: string[],
): Promise<{ ok: true; availableTables: string[] } | { ok: false; warning: string }> {
  try {
    const { data, error } = await client
      .schema('information_schema')
      .from('tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', requiredTables)

    if (error) {
      return {
        ok: false,
        warning: `information_schema table check unavailable; falling back to per-table head checks (${error.message}).`,
      }
    }

    return {
      ok: true,
      availableTables: (data ?? [])
        .map((row) => String((row as { table_name?: unknown }).table_name ?? ''))
        .filter(Boolean),
    }
  } catch (error) {
    return {
      ok: false,
      warning: `information_schema table check threw; falling back to per-table head checks (${error instanceof Error ? error.message : 'unknown error'}).`,
    }
  }
}

async function checkTablesByHeadSelect(
  client: SupabaseClient,
  requiredTables: string[],
): Promise<{ availableTables: string[]; warnings: string[] }> {
  const availableTables: string[] = []
  const warnings: string[] = []

  for (const tableName of requiredTables) {
    const { error } = await client
      .from(tableName)
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    if (error) {
      warnings.push(`Table ${tableName} unavailable or unreadable: ${error.message}`)
    } else {
      availableTables.push(tableName)
    }
  }

  return { availableTables, warnings }
}
