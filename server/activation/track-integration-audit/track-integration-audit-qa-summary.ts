import { trackIntegrationAuditBlockedScopes, trackIntegrationAuditGateIds } from './track-integration-audit-policy'
import type {
  TrackIntegrationAuditManifest,
  TrackIntegrationAuditQaGate,
  TrackIntegrationAuditQaSummary,
  TrackIntegrationDocsReconciliation,
  TrackIntegrationOwnershipMatrix,
  TrackIntegrationRegistryReconciliation,
  TrackIntegrationTrackSummary,
} from './track-integration-audit-types'

export function buildTrackIntegrationAuditQaSummary(input: {
  trackA: TrackIntegrationTrackSummary
  trackB: TrackIntegrationTrackSummary
  ownershipMatrix: TrackIntegrationOwnershipMatrix
  registryReconciliation: TrackIntegrationRegistryReconciliation
  docsReconciliation: TrackIntegrationDocsReconciliation
  publicAccessBlocked: boolean
  productionBetaGatesBlocked: boolean
}): TrackIntegrationAuditQaSummary {
  const gates: TrackIntegrationAuditQaGate[] = [
    gate('track_a_evidence_valid', input.trackA.status === 'ready', input.trackA.summary),
    gate('track_b_evidence_valid_or_blocked_with_reason', input.trackB.status === 'partial', input.trackB.summary),
    gate('ownership_boundaries_clear', input.ownershipMatrix.conflicts.length === 0, input.ownershipMatrix.conflicts.join('; ') || 'Track A/Track B ownership boundaries are explicit.'),
    gate('tool_registry_consistent', input.registryReconciliation.toolRegistry.status !== 'blocked', input.registryReconciliation.toolRegistry.summary),
    gate('package_scripts_consistent', input.registryReconciliation.packageScripts.status === 'passed', input.registryReconciliation.packageScripts.summary),
    gate('docs_consistent', input.docsReconciliation.docs.status === 'passed', input.docsReconciliation.docs.summary),
    gate('readiness_state_consistent', input.docsReconciliation.readinessState.status === 'passed', input.docsReconciliation.readinessState.summary),
    gate('no_stale_contradictory_status', input.docsReconciliation.staleContradictions.status === 'passed', input.docsReconciliation.staleContradictions.summary),
    gate('no_public_access', input.publicAccessBlocked, input.publicAccessBlocked ? 'Private buckets have no public principals.' : 'Public bucket principal detected or bucket IAM could not be verified.'),
    gate('production_beta_gates_blocked', input.productionBetaGatesBlocked, input.productionBetaGatesBlocked ? 'Production, beta, broad media, final delivery, providers, Revideo, Docker, Cloud Run, and media processing remain blocked.' : 'One or more production/beta execution gates is unlocked.'),
    gate('integration_readiness_decision', true, 'Integration readiness is intentionally blocked until Track B VLM is resolved or explicitly excluded in a later phase.'),
  ]
  const blockers = [
    ...input.trackA.blockers.map((blocker) => `Track A: ${blocker}`),
    ...(input.trackB.status === 'blocked' ? input.trackB.blockers.map((blocker) => `Track B: ${blocker}`) : []),
    ...input.ownershipMatrix.conflicts.map((conflict) => `Ownership: ${conflict}`),
    ...[
      input.registryReconciliation.packageScripts,
      input.registryReconciliation.toolRegistry,
      input.registryReconciliation.workerRuntimeOwnership,
    ].flatMap((check) => check.blockers.map((blocker: string) => `${check.checkId}: ${blocker}`)),
    ...[
      input.docsReconciliation.docs,
      input.docsReconciliation.readinessState,
      input.docsReconciliation.staleContradictions,
    ].flatMap((check) => check.blockers.map((blocker: string) => `${check.checkId}: ${blocker}`)),
    ...(!input.publicAccessBlocked ? ['Public bucket principal detected or bucket IAM verification failed.'] : []),
    ...(!input.productionBetaGatesBlocked ? ['Production/beta/public/final-delivery/provider execution gate is not blocked.'] : []),
  ]
  const warnings = [
    ...input.trackA.warnings,
    ...input.trackB.warnings,
    ...[
      input.registryReconciliation.packageScripts,
      input.registryReconciliation.toolRegistry,
      input.registryReconciliation.workerRuntimeOwnership,
    ].flatMap((check) => check.warnings.map((warning: string) => `${check.checkId}: ${warning}`)),
    ...[
      input.docsReconciliation.docs,
      input.docsReconciliation.readinessState,
      input.docsReconciliation.staleContradictions,
    ].flatMap((check) => check.warnings.map((warning: string) => `${check.checkId}: ${warning}`)),
    'Phase 47A completes the audit even though integration readiness remains blocked by explicit Track B blockers.',
  ]

  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

export function buildTrackIntegrationAuditManifest(input: Omit<TrackIntegrationAuditManifest, 'blockedScopes'>): TrackIntegrationAuditManifest {
  return {
    ...input,
    blockedScopes: [...trackIntegrationAuditBlockedScopes],
  }
}

function gate(gateId: typeof trackIntegrationAuditGateIds[number], passed: boolean, summary: string): TrackIntegrationAuditQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
