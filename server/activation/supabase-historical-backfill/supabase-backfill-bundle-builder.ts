import type { SupabaseMilestoneBundle } from '../supabase-milestone-registry'
import { validateSupabaseMilestoneBundle } from '../supabase-milestone-registry'
import { supabaseHistoricalBackfillDisabledFeatureGates } from './supabase-historical-backfill-policy'
import type {
  SupabaseHistoricalBackfillPhaseDefinition,
  SupabaseHistoricalBundleRecord,
  SupabaseHistoricalEvidenceRecord,
} from './supabase-historical-backfill-types'

export function buildSupabaseHistoricalBundleRecords(input: {
  phases: SupabaseHistoricalBackfillPhaseDefinition[]
  evidence: SupabaseHistoricalEvidenceRecord[]
}): SupabaseHistoricalBundleRecord[] {
  return input.phases.map((phase) => {
    const evidence = input.evidence.find((item) => item.phaseId === phase.phaseId) ?? missingEvidenceForPhase(phase)
    if (evidence.evidenceVerificationStatus === 'skipped' || (evidence.evidenceVerificationStatus === 'missing' && phase.priority === 'P1')) {
      return skippedRecord(phase, evidence, evidence.skippedReason ?? `Optional phase ${phase.phaseId} skipped because evidence is unavailable.`)
    }
    if (evidence.blockers.length) {
      if (phase.priority === 'P0') {
        return blockedRecord(phase, evidence, evidence.blockers)
      }
      return skippedRecord(phase, evidence, `Optional phase ${phase.phaseId} skipped because evidence is incomplete: ${evidence.blockers.join('; ')}`)
    }
    const bundle = buildSupabaseHistoricalMilestoneBundle(phase, evidence)
    const validation = validateSupabaseMilestoneBundle(bundle)
    return {
      phase,
      evidence,
      bundle,
      validation,
      writeVerification: null,
      writeStatus: validation.ok ? 'not_attempted' : 'blocked',
      readbackMatched: false,
      skippedReason: null,
      blockers: validation.blockers,
      warnings: [...evidence.warnings, ...validation.warnings],
    }
  })
}

export function buildSupabaseHistoricalMilestoneBundle(phase: SupabaseHistoricalBackfillPhaseDefinition, evidence: SupabaseHistoricalEvidenceRecord): SupabaseMilestoneBundle {
  const artifacts = evidence.gcsUris.map((gcsUri, index) => ({
    artifactId: `${phase.phaseId.toLowerCase()}_artifact_${String(index + 1).padStart(2, '0')}`,
    artifactType: artifactTypeForUri(gcsUri),
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phaseId: phase.phaseId, runId: phase.runId, evidenceSource: 'canonical_docs_gcs_reference' },
  }))
  return {
    phaseId: phase.phaseId,
    phaseName: phase.phaseName,
    runId: phase.runId,
    status: phase.status,
    track: phase.track,
    subsystem: phase.subsystem,
    branch: phase.branch,
    prNumber: phase.prNumber,
    prUrl: phase.prUrl,
    baseBranch: phase.baseBranch,
    commitSha: null,
    qaStatus: phase.qaStatus,
    readinessStatus: phase.readinessStatus,
    completedAt: phase.completedAt,
    artifacts,
    qaGates: [
      { gateId: 'historical_evidence_resolved', status: evidence.blockers.length ? 'blocked' : 'passed', summary: `Historical evidence for ${phase.phaseId} resolved from ${phase.docsPath}.`, mandatory: phase.priority === 'P0', evidence: { evidenceVerificationStatus: evidence.evidenceVerificationStatus, gcsReferences: evidence.gcsUris.length } },
      { gateId: 'artifact_policy', status: 'passed', summary: 'Only private gs:// artifact references are stored in Supabase.', mandatory: true },
      { gateId: 'feature_gate_policy', status: 'passed', summary: 'Production, beta, public artifact, signed URL, and raw prompt execution gates remain disabled.', mandatory: true },
      { gateId: 'blocked_features', status: 'passed', summary: 'Historical backfill does not rerun tools, providers, media, web search, map rendering, migrations, or production/beta paths.', mandatory: true },
    ],
    readinessSnapshots: [
      {
        subsystem: phase.subsystem,
        readinessKey: `${phase.phaseId.toLowerCase()}_historical_activation_readiness`,
        readinessStatus: phase.readinessStatus,
        scope: 'historical_activation_evidence_backfill_only',
        evidence: { phaseId: phase.phaseId, runId: phase.runId, docsPath: phase.docsPath, gcsReferences: evidence.gcsUris.length },
      },
    ],
    toolCapabilities: phase.toolCapabilities.map((tool) => ({
      toolId: tool.toolId,
      displayName: tool.displayName,
      track: phase.track,
      subsystem: phase.subsystem,
      readinessState: tool.readinessState,
      runtimeAllowed: tool.runtimeAllowed,
      productionAllowed: false,
      externalBetaAllowed: false,
      broadMediaAllowed: false,
      evidence: { phaseId: phase.phaseId, runId: phase.runId, historicalBackfill: true },
    })),
    featureGateUpdates: supabaseHistoricalBackfillDisabledFeatureGates.map((gateKey) => ({
      gateKey,
      gateName: gateName(gateKey),
      gateStatus: 'disabled' as const,
      enabled: false as const,
      productionAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadMediaAllowed: false,
      evidence: { phase51C: 'historical_backfill_keeps_gate_disabled', sourcePhase: phase.phaseId, sourceRun: phase.runId },
    })),
    summary: phase.summary,
    blockers: evidence.blockers,
    warnings: evidence.warnings,
  }
}

function artifactTypeForUri(uri: string): string {
  if (uri.includes('/reports/')) return 'phase_report'
  if (uri.includes('/qa/')) return 'qa_summary'
  if (uri.includes('/manifest/') || uri.includes('/readiness/')) return 'readiness_manifest'
  if (uri.includes('/evidence/')) return 'evidence_chain'
  if (uri.endsWith('.png') || uri.endsWith('.mp4')) return 'private_media_reference'
  return 'private_json_reference'
}

function gateName(gateKey: string): string {
  return gateKey.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

function missingEvidenceForPhase(phase: SupabaseHistoricalBackfillPhaseDefinition): SupabaseHistoricalEvidenceRecord {
  return {
    phaseId: phase.phaseId,
    phaseName: phase.phaseName,
    runId: phase.runId,
    priority: phase.priority,
    docsPath: phase.docsPath,
    docsPresent: false,
    evidenceVerificationStatus: 'missing',
    gcsUris: [],
    generatedAssetUris: [],
    qaArtifactUris: [],
    readinessDecision: phase.readinessStatus,
    skippedReason: null,
    blockers: [`Missing evidence for ${phase.phaseId}.`],
    warnings: [],
  }
}

function skippedRecord(phase: SupabaseHistoricalBackfillPhaseDefinition, evidence: SupabaseHistoricalEvidenceRecord, reason: string): SupabaseHistoricalBundleRecord {
  return { phase, evidence, bundle: null, validation: null, writeVerification: null, writeStatus: 'skipped', readbackMatched: false, skippedReason: reason, blockers: [], warnings: [reason] }
}

function blockedRecord(phase: SupabaseHistoricalBackfillPhaseDefinition, evidence: SupabaseHistoricalEvidenceRecord, blockers: string[]): SupabaseHistoricalBundleRecord {
  return { phase, evidence, bundle: null, validation: null, writeVerification: null, writeStatus: 'blocked', readbackMatched: false, skippedReason: null, blockers, warnings: evidence.warnings }
}
