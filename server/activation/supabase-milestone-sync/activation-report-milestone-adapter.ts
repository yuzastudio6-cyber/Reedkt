import { readFileSync } from 'node:fs'
import { buildPhase51DSelfSyncInput } from './activation-milestone-bundle-builder'
import { supabaseMilestoneSyncArtifactPrefix, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { ActivationMilestoneSyncInput } from './supabase-milestone-sync-types'

export type ActivationMilestoneReportSource = ActivationMilestoneSyncInput | Record<string, unknown> | string

export function adaptActivationReportToMilestoneSyncInput(source: ActivationMilestoneReportSource, fallbackRunId: string): ActivationMilestoneSyncInput {
  if (typeof source === 'string') {
    const parsed = JSON.parse(readFileSync(source, 'utf8')) as Record<string, unknown>
    return adaptActivationReportToMilestoneSyncInput(parsed, fallbackRunId)
  }
  if (isDirectSyncInput(source)) return source

  const report = source as Record<string, unknown>
  const phase = stringValue(report.phase, 'unknown')
  const runId = stringValue(report.runId ?? (report.executionReport as Record<string, unknown> | undefined)?.runId, fallbackRunId)
  const prefix = supabaseMilestoneSyncArtifactPrefix(runId)
  const generatedBase = `gs://${supabaseMilestoneSyncConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${supabaseMilestoneSyncConfig.qaBucket}/${prefix}`
  const base = buildPhase51DSelfSyncInput(runId)
  return {
    ...base,
    phaseId: phase,
    phaseName: stringValue(report.phaseName, `Activation phase ${phase}`),
    status: statusValue(report.status),
    branch: stringValue(report.branch, base.branch),
    baseBranch: stringValue(report.baseBranch, base.baseBranch),
    reportArtifactPath: `${qaBase}/reports/${phase.toLowerCase()}-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/${phase.toLowerCase()}-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/${phase.toLowerCase()}-qa.json`,
    summary: stringValue(report.summary, `Adapted activation report for phase ${phase}; optional fields missing are warnings, not invented success.`),
    warnings: [...base.warnings, 'Adapter source lacked one or more optional milestone fields; defaults remain fail-closed.'],
  }
}

function isDirectSyncInput(value: unknown): value is ActivationMilestoneSyncInput {
  return Boolean(value && typeof value === 'object' && 'supabaseSyncPolicy' in value && 'phaseId' in value && 'runId' in value)
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function statusValue(value: unknown): ActivationMilestoneSyncInput['status'] {
  if (value === 'completed' || value === 'partial' || value === 'blocked' || value === 'skipped' || value === 'superseded') return value
  return 'blocked'
}
