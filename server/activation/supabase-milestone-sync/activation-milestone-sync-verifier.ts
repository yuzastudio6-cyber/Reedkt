import type { SupabaseClient } from '@supabase/supabase-js'
import { readActivationRun, type SupabaseMilestoneBundle, type SupabaseMilestoneWriteVerification } from '../supabase-milestone-registry'
import type { ActivationMilestoneReadbackVerification } from './supabase-milestone-sync-types'

export async function verifyActivationMilestoneSyncReadback(input: {
  client?: SupabaseClient
  bundle: SupabaseMilestoneBundle
  writeVerification: SupabaseMilestoneWriteVerification
}): Promise<ActivationMilestoneReadbackVerification> {
  if (!input.client) {
    return { status: 'not_attempted', phaseId: input.bundle.phaseId, runId: input.bundle.runId, readbackMatched: false, activationRunId: null, blockers: ['Supabase client was unavailable.'], warnings: [] }
  }
  if (input.writeVerification.status !== 'completed') {
    return { status: 'blocked', phaseId: input.bundle.phaseId, runId: input.bundle.runId, readbackMatched: false, activationRunId: null, blockers: input.writeVerification.blockers, warnings: input.writeVerification.warnings }
  }
  try {
    const readback = await readActivationRun(input.client, input.bundle.phaseId, input.bundle.runId)
    const matched = readback?.run_id === input.bundle.runId
    return {
      status: matched ? 'completed' : 'blocked',
      phaseId: input.bundle.phaseId,
      runId: input.bundle.runId,
      readbackMatched: matched,
      activationRunId: readback?.id ?? null,
      blockers: matched ? [] : ['Activation run readback did not match the written Phase 51D bundle.'],
      warnings: input.writeVerification.warnings,
    }
  } catch (error) {
    return { status: 'blocked', phaseId: input.bundle.phaseId, runId: input.bundle.runId, readbackMatched: false, activationRunId: null, blockers: [sanitizeError(error)], warnings: input.writeVerification.warnings }
  }
}

export function phase52AReadinessFromSync(input: { writeVerification: SupabaseMilestoneWriteVerification; readbackVerification: ActivationMilestoneReadbackVerification }) {
  return input.writeVerification.status === 'completed' && input.readbackVerification.status === 'completed'
    ? 'ready_for_shared_agent_and_tool_ownership_architecture' as const
    : 'blocked' as const
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
