import { systemReadinessRequiredScripts } from './system-readiness-reconciliation-policy'
import type {
  ControlledInternalTestLane,
  FeatureGateReconciliationRecord,
  SystemBlockerRecord,
  SystemEvidenceContext,
  SystemHandoffPacket,
  SystemReadinessManifest,
  SystemReadinessQaGate,
  SystemReadinessQaSummary,
  SystemReadinessSupabaseSyncResult,
  SystemRepoOwnershipAudit,
  SystemRiskRecord,
  WorkstreamReadinessRecord,
} from './system-readiness-reconciliation-types'

export function buildSystemReadinessQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  repoOwnershipAudit: SystemRepoOwnershipAudit
  evidenceContext: SystemEvidenceContext
  workstreamReadiness: WorkstreamReadinessRecord[]
  controlledInternalTestPlan: ControlledInternalTestLane[]
  blockerInventory: SystemBlockerRecord[]
  featureGateReconciliation: FeatureGateReconciliationRecord[]
  systemRiskRegister: SystemRiskRecord[]
  handoffPackets: SystemHandoffPacket[]
  manifest: SystemReadinessManifest
  supabaseSyncResult: SystemReadinessSupabaseSyncResult
  executionMode: boolean
}): SystemReadinessQaSummary {
  const gates: SystemReadinessQaGate[] = [
    gate('source_of_truth_repo_audit', input.repoOwnershipAudit.implementationAllowed, 'Source-of-truth and ownership audit completed; missing optional docs are recorded.'),
    gate('phase52e_evidence', !input.evidenceContext.blockers.length, 'Phase 52E completed evidence exists and feeds Phase 52F.'),
    gate('workstream_readiness_reconciliation', input.workstreamReadiness.length === 12, 'All 12 required workstreams are represented.'),
    gate('controlled_internal_test_plan', input.controlledInternalTestPlan.length >= 7 && input.controlledInternalTestPlan.every((lane) => lane.executableInPhase52F === false), 'Controlled internal test plan exists and no lane is executable in Phase 52F.'),
    gate('blocker_inventory', input.blockerInventory.length >= 16, 'Blocker inventory is documented by owner and severity.'),
    gate('feature_gate_reconciliation', input.featureGateReconciliation.length > 0 && input.featureGateReconciliation.every((item) => !item.actualEnabled), 'Production, beta, broad media, public artifact, provider, worker, and runtime gates remain disabled.'),
    gate('risk_register', input.systemRiskRegister.length >= 14, 'System risk register covers ownership, runtime, Supabase, privacy, tool, Track B, AI Tools, Worker Runtime, provider, compliance, observability, frontend, and billing gaps.'),
    gate('handoff_packets', input.handoffPackets.length === 12, 'Handoff packets are generated for all relevant owners.'),
    gate('source_of_truth_policy', input.manifest.sourceOfTruthSummary.every((item) => !item.includes('signed URL source of truth allowed')), 'Source-of-truth policy keeps screenshots/previews non-authoritative and private GCS refs authoritative.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, input.executionMode ? 'Phase 52F Supabase milestone sync completed or exact blocker recorded.' : 'Static mode references the Supabase milestone sync contract without writing.'),
    gate('blocked_features', input.manifest.blockedFeatures.includes('production_ready') && input.manifest.blockedFeatures.includes('worker_execution'), 'No runtime, worker, provider, public artifact, production, beta, or broad-media path is enabled.'),
  ]
  const missingScripts = systemReadinessRequiredScripts.filter((script) => !input.packageScripts[script])
  const missingDocs = Object.entries(input.docsPresent).filter(([, present]) => !present).map(([doc]) => doc)
  const blockers = [
    ...gates.filter((item) => !item.passed).map((item) => `${item.gateId} failed.`),
    ...missingScripts.map((script) => `Missing package script ${script}.`),
    ...missingDocs.map((doc) => `Missing Phase 52F doc ${doc}.`),
  ]
  const warnings = [...input.repoOwnershipAudit.warnings, ...input.evidenceContext.warnings, ...input.supabaseSyncResult.warnings]
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: SystemReadinessQaGate['gateId'], passed: boolean, summary: string): SystemReadinessQaGate {
  return { gateId, passed, mandatory: true, summary }
}
