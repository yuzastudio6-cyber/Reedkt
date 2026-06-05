import type { SystemRiskRecord } from './system-readiness-reconciliation-types'

export function buildSystemRiskRegister(): SystemRiskRecord[] {
  return [
    risk('ownership_conflict_runtime_boundaries', 'ownership_conflict', 'medium', 'Boundaries are documented but some owner manifests are still external.', 'Emit owner-specific handoff packets and keep execution disabled.', 'shared system readiness owner', 'Phase 52G owner handoff dispatch.'),
    risk('missing_contract_docs', 'missing_contracts', 'medium', 'Several prompt-listed foundation/cross-chat docs are absent on this base.', 'Record as audit gaps and avoid inferred contracts.', 'cross-chat coordination owner', 'Merge or publish cross-chat/source-of-truth docs.'),
    risk('runtime_execution_boundary', 'runtime_execution_boundary', 'critical', 'Candidate plans are validated but non-executable.', 'Keep workerExecutionAllowed=false and hand off to Worker Runtime.', 'Worker Runtime/jobs owner', 'Worker Runtime approved snapshot execution contract review.'),
    risk('supabase_sync', 'supabase_sync', 'medium', 'Phase 52F depends on one milestone sync/write/readback.', 'Use Phase 51D/51B sync path only and fail closed on credential/readback errors.', 'Supabase milestone sync owner', 'Verify Phase 52F milestone readback.'),
    risk('privacy_artifact_policy', 'privacy_artifact_policy', 'high', 'Private GCS must remain source of truth for artifacts.', 'Reject public artifacts and signed URLs as source of truth.', 'system readiness owner', 'Keep artifact policy in Phase 52G.'),
    risk('tool_capability_mismatch', 'tool_capability_mismatch', 'medium', 'Tool capability registry includes external placeholders.', 'Do not upgrade placeholder status without owner evidence.', 'tool capability registry owner', 'Owner manifests update before execution.'),
    risk('track_b_model_runtime', 'track_b_model_runtime', 'high', 'VLM and Demucs remain blocked.', 'Keep blocked in internal test plan.', 'Track B media/audio/VLM owner', 'Track B runtime and provenance review.'),
    risk('ai_tools_manifest_gap', 'ai_tools_manifest_gap', 'medium', 'AI Tools creative graphics are placeholders only.', 'Handoff planning only.', 'AI Tools chat', 'Prompt GD-0.'),
    risk('worker_runtime_gap', 'worker_runtime_gap', 'critical', 'No worker execution contract is active for Phase 52F.', 'No execution; hand off requirements.', 'Worker Runtime/jobs owner', 'Worker execution contract review.'),
    risk('provider_gateway_gap', 'provider_gateway_gap', 'high', 'Provider Gateway execution is not enabled.', 'No provider calls.', 'Provider Gateway/models owner', 'Provider policy review.'),
    risk('compliance_gap', 'compliance_gap', 'high', 'Compliance/security review is not closed.', 'Keep production/external beta blocked.', 'Compliance/security owner', 'Compliance review.'),
    risk('observability_cost_gap', 'observability_cost_gap', 'high', 'Audit/abuse/cost controls are not closed.', 'Keep beta/production blocked.', 'Observability/audit/cost owner', 'Observability/cost controls review.'),
    risk('frontend_ux_gap', 'frontend_ux_gap', 'medium', 'Internal UX flow is not validated by this phase.', 'Handoff to frontend owner.', 'Frontend product UX owner', 'Frontend UX contract review.'),
    risk('billing_gap', 'billing_gap', 'high', 'Billing/credits are not enabled for internal test execution.', 'Keep paid production and credit charging blocked.', 'Billing/Stripe credits owner', 'Billing/credits readiness review.'),
  ]
}

function risk(riskId: string, category: SystemRiskRecord['category'], severity: SystemRiskRecord['severity'], currentStatus: string, mitigation: string, owner: string, nextAction: string): SystemRiskRecord {
  return { riskId, category, severity, currentStatus, mitigation, owner, nextAction }
}
