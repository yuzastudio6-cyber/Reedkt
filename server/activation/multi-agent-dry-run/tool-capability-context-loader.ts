import type { SupabaseClient } from '@supabase/supabase-js'
import { toolCapabilityRecords } from '../tool-capability-registry-audit'
import { buildMultiAgentEvidenceContext } from './multi-agent-evidence-resolver'
import type { MultiAgentEvidenceContext } from './multi-agent-dry-run-types'

export function loadCommittedToolCapabilityContext(): MultiAgentEvidenceContext {
  return buildMultiAgentEvidenceContext()
}

export async function loadExecutedToolCapabilityContext(client?: SupabaseClient): Promise<MultiAgentEvidenceContext> {
  if (!client) return loadCommittedToolCapabilityContext()
  const expected = toolCapabilityRecords.length
  const blockers: string[] = []
  const warnings: string[] = []
  let recordCount = 0
  try {
    const { data, error } = await client
      .from('tool_capabilities')
      .select('track,tool_id,readiness_state')
      .in('tool_id', toolCapabilityRecords.map((item) => item.toolId))
    if (error) throw error
    const expectedKeys = new Set(toolCapabilityRecords.map((item) => `${item.track}:${item.toolId}`))
    const found = new Set((data ?? []).map((row: { track: string; tool_id: string }) => `${row.track}:${row.tool_id}`))
    recordCount = Array.from(expectedKeys).filter((key) => found.has(key)).length
    if (recordCount !== expected) blockers.push(`Supabase tool capability readback expected ${expected}, got ${recordCount}.`)
  } catch (error) {
    blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
  }

  return buildMultiAgentEvidenceContext({
    supabaseCapabilityReadback: {
      attempted: true,
      status: blockers.length ? 'blocked' : 'completed',
      recordCount,
      expectedCount: expected,
      blockers,
      warnings,
    },
  })
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
