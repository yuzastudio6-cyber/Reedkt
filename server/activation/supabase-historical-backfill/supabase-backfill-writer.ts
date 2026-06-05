import type { SupabaseClient } from '@supabase/supabase-js'
import { buildNotAttemptedWriteVerification, readActivationRun, writeMilestoneBundle } from '../supabase-milestone-registry'
import type { SupabaseHistoricalBundleRecord } from './supabase-historical-backfill-types'

export async function writeSupabaseHistoricalBackfillBundles(input: {
  client?: SupabaseClient
  schemaPresent: boolean
  records: SupabaseHistoricalBundleRecord[]
}): Promise<SupabaseHistoricalBundleRecord[]> {
  if (!input.client || !input.schemaPresent) {
    const blockers = input.schemaPresent ? ['Supabase service-role client was unavailable.'] : ['Registry schema is unavailable.']
    return input.records.map((record) => {
      if (!record.bundle || record.writeStatus === 'skipped') return record
      return { ...record, writeStatus: 'blocked', writeVerification: buildNotAttemptedWriteVerification(blockers, []), blockers: Array.from(new Set([...record.blockers, ...blockers])) }
    })
  }

  const written: SupabaseHistoricalBundleRecord[] = []
  for (const record of input.records) {
    if (!record.bundle || record.writeStatus === 'skipped') {
      written.push(record)
      continue
    }
    if (record.validation && !record.validation.ok) {
      written.push({ ...record, writeStatus: 'blocked' })
      continue
    }
    const writeVerification = await writeMilestoneBundle(input.client, record.bundle)
    const readback = await readActivationRun(input.client, record.bundle.phaseId, record.bundle.runId)
    written.push({
      ...record,
      writeVerification,
      writeStatus: writeVerification.status === 'completed' && readback?.run_id === record.bundle.runId ? 'written' : 'blocked',
      readbackMatched: readback?.run_id === record.bundle.runId,
      blockers: writeVerification.blockers,
      warnings: Array.from(new Set([...record.warnings, ...writeVerification.warnings])),
    })
  }
  return written
}
