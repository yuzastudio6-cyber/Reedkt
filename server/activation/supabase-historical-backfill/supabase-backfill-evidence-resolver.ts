import { existsSync, readFileSync } from 'node:fs'
import type { SupabaseHistoricalBackfillPhaseDefinition, SupabaseHistoricalEvidenceRecord } from './supabase-historical-backfill-types'

const gcsPattern = /gs:\/\/[^\s)`]+/g

export function resolveSupabaseHistoricalEvidence(phases: SupabaseHistoricalBackfillPhaseDefinition[]): SupabaseHistoricalEvidenceRecord[] {
  return phases.map((phase) => resolvePhaseEvidence(phase))
}

export function resolvePhaseEvidence(phase: SupabaseHistoricalBackfillPhaseDefinition): SupabaseHistoricalEvidenceRecord {
  if (!existsSync(phase.docsPath)) {
    const missingMessage = `Missing canonical evidence doc ${phase.docsPath}.`
    return {
      phaseId: phase.phaseId,
      phaseName: phase.phaseName,
      runId: phase.runId,
      priority: phase.priority,
      docsPath: phase.docsPath,
      docsPresent: false,
      evidenceVerificationStatus: phase.priority === 'P0' ? 'missing' : 'skipped',
      gcsUris: [],
      generatedAssetUris: [],
      qaArtifactUris: [],
      readinessDecision: phase.readinessStatus,
      skippedReason: phase.priority === 'P0' ? null : missingMessage,
      blockers: phase.priority === 'P0' ? [missingMessage] : [],
      warnings: phase.priority === 'P0' ? [] : [missingMessage],
    }
  }

  const text = readFileSync(phase.docsPath, 'utf8')
  const gcsUris = Array.from(new Set(text.match(gcsPattern) ?? [])).map((uri) => uri.replace(/[.,]$/, ''))
  const generatedAssetUris = gcsUris.filter((uri) => uri.includes('reeditpro-staging-reeditpro-generated-assets'))
  const qaArtifactUris = gcsUris.filter((uri) => uri.includes('reeditpro-staging-reeditpro-qa-artifacts'))
  const docsMentionRun = text.includes(phase.runId) || phase.runId.includes('static')
  const docsMentionComplete = /Status:\s*completed/i.test(text) || /Status:\s*completed\./i.test(text) || /Readiness decision/i.test(text)
  const blockers: string[] = []
  const warnings: string[] = []

  if (!docsMentionRun) blockers.push(`Evidence doc ${phase.docsPath} does not mention canonical run ${phase.runId}.`)
  if (!docsMentionComplete) warnings.push(`Evidence doc ${phase.docsPath} does not have an explicit completed status line.`)
  if (!gcsUris.length) warnings.push(`Evidence doc ${phase.docsPath} has no private GCS artifact references; storing doc-only evidence.`)

  return {
    phaseId: phase.phaseId,
    phaseName: phase.phaseName,
    runId: phase.runId,
    priority: phase.priority,
    docsPath: phase.docsPath,
    docsPresent: true,
    evidenceVerificationStatus: gcsUris.length ? 'local_doc_only' : 'local_doc_only',
    gcsUris,
    generatedAssetUris,
    qaArtifactUris,
    readinessDecision: phase.readinessStatus,
    skippedReason: null,
    blockers,
    warnings,
  }
}
