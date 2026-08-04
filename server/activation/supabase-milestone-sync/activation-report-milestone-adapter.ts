import { readFileSync } from 'node:fs'
import { buildDefaultDisabledFeatureGates } from './activation-milestone-bundle-builder'
import { futurePhaseSupabaseSyncPrSummary, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { ActivationMilestoneSyncInput, ActivationReportMilestoneAdapterResult } from './supabase-milestone-sync-types'

export function adaptActivationReportToMilestoneInput(input: { report?: Record<string, unknown>; reportPath?: string; directInput?: ActivationMilestoneSyncInput }): ActivationReportMilestoneAdapterResult {
  if (input.directInput) return { input: input.directInput, warnings: [] }
  const report = input.report ?? readReportPath(input.reportPath)
  const warnings: string[] = []
  const phaseId = stringField(report, 'phase') ?? stringField(report, 'phaseId')
  const runId = stringField(report, 'runId')
  const status = statusField(report, 'status')
  if (!phaseId) warnings.push('Report adapter could not find phase/phaseId.')
  if (!runId) warnings.push('Report adapter could not find runId.')
  const artifactUris = Array.isArray(report.artifacts) ? report.artifacts : []
  const artifacts = artifactUris.flatMap((artifact, index) => {
    const record = artifact as Record<string, unknown>
    const gcsUri = typeof record.gcsUri === 'string' ? record.gcsUri : undefined
    if (!gcsUri) return []
    return [{
      artifactId: typeof record.id === 'string' ? record.id : `artifact_${index + 1}`,
      artifactType: typeof record.kind === 'string' ? record.kind : 'private_json',
      gcsUri,
      sourceOfTruth: true,
      signedUrlSourceOfTruth: false as const,
      metadata: { adaptedFromReport: true },
    }]
  })
  if (!artifacts.length) warnings.push('Report adapter found no artifact references.')
  const adapted: ActivationMilestoneSyncInput = {
    phaseId: phaseId ?? 'unknown',
    phaseName: stringField(report, 'phaseName') ?? `Activation phase ${phaseId ?? 'unknown'}`,
    runId: runId ?? 'unknown',
    status,
    track: stringField(report, 'track') ?? 'activation',
    subsystem: stringField(report, 'subsystem') ?? 'activation',
    branch: stringField(report, 'branch') ?? 'unknown',
    prNumber: typeof report.prNumber === 'number' ? report.prNumber : null,
    prUrl: typeof report.prUrl === 'string' ? report.prUrl : null,
    baseBranch: stringField(report, 'baseBranch') ?? supabaseMilestoneSyncConfig.baseBranch,
    commitSha: typeof report.commitSha === 'string' ? report.commitSha : null,
    qaStatus: report.qa && typeof report.qa === 'object' && (report.qa as { status?: unknown }).status === 'passed' ? 'passed' : status === 'blocked' ? 'blocked' : 'warning',
    readinessStatus: stringField(report, 'readinessStatus') ?? stringField(report, 'phase52AReadiness') ?? 'unknown_readiness',
    completedAt: typeof report.createdAt === 'string' ? report.createdAt : null,
    reportPath: input.reportPath ?? null,
    manifestPath: null,
    qaPath: null,
    artifacts,
    qaGates: [],
    readinessSnapshots: [],
    toolCapabilities: [],
    featureGateUpdates: buildDefaultDisabledFeatureGates({ phaseId: phaseId ?? 'unknown', runId: runId ?? 'unknown' }),
    summary: stringField(report, 'summary') ?? `Adapted milestone sync input for ${phaseId ?? 'unknown'}.`,
    blockers: Array.isArray(report.blockers) ? report.blockers.filter((item): item is string => typeof item === 'string') : [],
    warnings,
    supabaseSyncPolicy: {
      mode: supabaseMilestoneSyncConfig.mode,
      registryTablesOnly: true,
      privateGcsArtifactReferencesOnly: true,
      supabaseStoresBlobs: false,
      futurePhasePrSummaryTemplate: futurePhaseSupabaseSyncPrSummary,
    },
  }
  return { input: adapted, warnings }
}

function readReportPath(reportPath?: string): Record<string, unknown> {
  if (!reportPath) return {}
  return JSON.parse(readFileSync(reportPath, 'utf8')) as Record<string, unknown>
}

function stringField(report: Record<string, unknown>, field: string): string | undefined {
  return typeof report[field] === 'string' ? report[field] as string : undefined
}

function statusField(report: Record<string, unknown>, field: string): ActivationMilestoneSyncInput['status'] {
  const value = report[field]
  if (value === 'completed' || value === 'partial' || value === 'blocked' || value === 'skipped' || value === 'superseded') return value
  return 'partial'
}
