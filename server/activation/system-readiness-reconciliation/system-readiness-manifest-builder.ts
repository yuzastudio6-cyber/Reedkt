import type {
  ControlledInternalTestLane,
  FeatureGateReconciliationRecord,
  SystemBlockerRecord,
  SystemEvidenceContext,
  SystemHandoffPacket,
  SystemReadinessManifest,
  SystemReadinessQaSummary,
  SystemRepoOwnershipAudit,
  SystemRiskRecord,
  WorkstreamReadinessRecord,
} from './system-readiness-reconciliation-types'

export function buildSystemReadinessManifest(input: {
  runId: string
  repoOwnershipAudit: SystemRepoOwnershipAudit
  evidenceContext: SystemEvidenceContext
  workstreamReadiness: WorkstreamReadinessRecord[]
  controlledInternalTestPlan: ControlledInternalTestLane[]
  blockerInventory: SystemBlockerRecord[]
  featureGateReconciliation: FeatureGateReconciliationRecord[]
  systemRiskRegister: SystemRiskRecord[]
  handoffPackets: SystemHandoffPacket[]
  qa?: SystemReadinessQaSummary
  blockers?: string[]
  warnings?: string[]
}): SystemReadinessManifest {
  const blockers = Array.from(new Set([...(input.blockers ?? []), ...(input.qa?.blockers ?? [])]))
  const warnings = Array.from(new Set([...(input.warnings ?? []), ...(input.qa?.warnings ?? [])]))
  return {
    manifestId: 'phase52f_system_readiness_reconciliation_manifest',
    runId: input.runId,
    phase: '52F',
    repoOwnershipAudit: input.repoOwnershipAudit,
    evidenceContext: input.evidenceContext,
    workstreamReadiness: input.workstreamReadiness,
    controlledInternalTestPlan: input.controlledInternalTestPlan,
    blockerInventory: input.blockerInventory,
    featureGateReconciliation: input.featureGateReconciliation,
    systemRiskRegister: input.systemRiskRegister,
    handoffPackets: input.handoffPackets,
    sourceOfTruthSummary: [
      'Approved plan snapshots, manifests, and private gs:// references are source of truth.',
      'Screenshots and previews are QA/review artifacts only.',
      'Signed URLs and public artifacts are not source of truth.',
      'Workers must not execute from raw chat or PR summaries.',
    ],
    supabaseMilestoneRefs: ['52E:phase52e-20260605T175613', `52F:${input.runId}`],
    blockedFeatures: input.featureGateReconciliation.map((gate) => gate.gateKey),
    warnings,
    blockers,
    phase52GReadiness: blockers.length === 0 && input.qa?.status === 'passed' ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
  }
}
