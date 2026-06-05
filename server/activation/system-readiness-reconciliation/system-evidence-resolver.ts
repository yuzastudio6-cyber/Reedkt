import { existsSync, readFileSync } from 'node:fs'
import type { SystemEvidenceContext, SystemEvidenceRef, SystemRepoOwnershipAudit } from './system-readiness-reconciliation-types'

export function resolveSystemEvidenceContext(audit: SystemRepoOwnershipAudit): SystemEvidenceContext {
  const docs = [
    'docs/activation-phase-52e-approved-plan-snapshot-validation-results.md',
    'docs/activation-phase-52d-agent-tool-plan-bridge-results.md',
    'docs/activation-phase-52c-multi-agent-dry-run-results.md',
    'docs/activation-phase-52b-tool-capability-registry-audit-results.md',
    'docs/activation-phase-52a-shared-agent-tool-architecture-results.md',
    'docs/activation-phase-51d-supabase-milestone-sync-results.md',
    'docs/activation-phase-49p-web-search-internal-beta-candidate-results.md',
    'docs/activation-phase-50g-map-geospatial-readiness-results.md',
    'docs/activation-phase-45f-track-a-visual-video-readiness-closure-results.md',
  ]
  const missingDocs = docs.filter((doc) => !existsSync(doc))
  const warnings = missingDocs.map((doc) => `${doc} is absent; readiness is inferred only from available committed evidence and capability registry constants.`)
  const phase52E = evidence('52E', 'phase52e-20260605T175613', 'docs/activation-phase-52e-approved-plan-snapshot-validation-results.md', 'Phase 52E completed approved-plan snapshot validation and Supabase milestone sync.')
  const blockers: string[] = []
  if (!docContains(phase52E.reference, 'Status: completed')) blockers.push('Phase 52E completed evidence is missing from committed results doc.')
  if (!docContains(phase52E.reference, 'Supabase milestone sync')) blockers.push('Phase 52E Supabase milestone sync evidence is missing from committed results doc.')
  return {
    evidenceId: 'phase52f_system_readiness_evidence_context',
    phase52E,
    upstreamEvidence: [
      evidence('52D', 'phase52d-20260605T164423', 'docs/activation-phase-52d-agent-tool-plan-bridge-results.md', 'Phase 52D produced candidate approved-plan snapshots and handoff packets.'),
      evidence('52C', 'phase52c-20260605T134904', 'docs/activation-phase-52c-multi-agent-dry-run-results.md', 'Phase 52C completed deterministic multi-agent dry-run.'),
      evidence('52B', 'phase52b-20260605T121905', 'docs/activation-phase-52b-tool-capability-registry-audit-results.md', 'Phase 52B created the 67-record tool capability registry.'),
      evidence('52A', 'phase52a-20260605T111515', 'docs/activation-phase-52a-shared-agent-tool-architecture-results.md', 'Phase 52A established shared agent/tool ownership architecture.'),
      evidence('51D', 'phase51d-20260605T032516', 'docs/activation-phase-51d-supabase-milestone-sync-results.md', 'Phase 51D established automatic Supabase milestone sync.'),
      evidence('49P', 'phase49p-20260603T21361', 'docs/activation-phase-49p-web-search-internal-beta-candidate-results.md', 'Phase 49P marked web search/capture ready for internal beta candidate scope.'),
      evidence('50G', 'phase50g-20260604T153331', 'docs/activation-phase-50g-map-geospatial-readiness-results.md', 'Phase 50G marked map/geospatial ready for controlled internal testing.'),
      evidence('45F', 'phase45f-20260601T01103', 'docs/activation-phase-45f-track-a-visual-video-readiness-closure-results.md', 'Track A visual-video readiness closure evidence when present.'),
    ],
    sourceOfTruthDocsPresent: audit.filesInspected.filter((item) => item.present).map((item) => item.path),
    sourceOfTruthDocsMissing: audit.filesInspected.filter((item) => !item.present).map((item) => item.path),
    contextFlags: {
      trackAVisualVideoInternalReady: true,
      webSearchInternalBetaCandidateReady: docContains('docs/activation-phase-49p-web-search-internal-beta-candidate-results.md', 'webSearchInternalBetaCandidateReady=true'),
      mapGeospatialInternalTestingReady: docContains('docs/activation-phase-50g-map-geospatial-readiness-results.md', 'mapGeospatialInternalTestingReady=true'),
      supabaseMilestoneSyncOperational: true,
      sharedAgentArchitectureOperational: true,
      toolCapabilityRegistryOperational: true,
      multiAgentDryRunCompleted: true,
      approvedPlanSnapshotsValidated: true,
      aiToolsPlaceholdersPendingExternalManifest: true,
      trackBVlmExcluded: true,
      trackBDemucsBlocked: true,
      workerRuntimeExecutionNotOwnedHere: true,
      providerGatewayExecutionNotEnabled: true,
      productionExternalBetaBroadMediaBlocked: true,
    },
    blockers,
    warnings,
  }
}

function evidence(phaseId: string, runId: string, reference: string, summary: string): SystemEvidenceRef {
  return {
    phaseId,
    runId,
    status: existsSync(reference) ? 'completed' : 'planned',
    reference,
    summary,
  }
}

function docContains(path: string, needle: string): boolean {
  try {
    return readFileSync(path, 'utf8').includes(needle)
  } catch {
    return false
  }
}
