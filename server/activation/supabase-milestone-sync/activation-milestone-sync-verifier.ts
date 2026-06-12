import type { SupabaseClient } from '@supabase/supabase-js'
import { readActivationRun } from '../supabase-milestone-registry'

export async function verifySupabaseMilestoneSyncReadback(input: {
  client: SupabaseClient
  phaseId: string
  runId: string
}): Promise<{ status: 'completed' | 'blocked'; readbackMatched: boolean; blockers: string[]; warnings: string[] }> {
  try {
    const readback = await readActivationRun(input.client, input.phaseId, input.runId)
    const matched = readback?.run_id === input.runId
    return {
      status: matched ? 'completed' : 'blocked',
      readbackMatched: matched,
      blockers: matched ? [] : [`Activation run ${input.phaseId}/${input.runId} was not found during readback.`],
      warnings: [],
    }
  } catch (error) {
    return {
      status: 'blocked',
      readbackMatched: false,
      blockers: [sanitizeError(error instanceof Error ? error.message : String(error))],
      warnings: [],
    }
  }
}

function sanitizeError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
