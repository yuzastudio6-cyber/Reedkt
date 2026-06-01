import type { ApprovedVlmBlockerResolutionEvidence } from './vlm-blocker-resolution-types'

export const approvedVlmBlockerResolutionEvidence: ApprovedVlmBlockerResolutionEvidence = {
  phase: '47B',
  status: 'completed',
  runId: 'phase47b-20260601T03032',
  decision: 'vlm_excluded_from_initial_internal_testing',
  blockerEvidenceUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47b/phase47b-20260601T03032/evidence/vlm-blocker-evidence.json',
  exclusionManifestUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47b/phase47b-20260601T03032/exclusion/vlm-exclusion-manifest.json',
  systemReadinessImpactUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47b/phase47b-20260601T03032/readiness/system-readiness-impact.json',
  qaReportUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47b/phase47b-20260601T03032/qa/vlm-blocker-resolution-qa.json',
  phase47bReportUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47b/phase47b-20260601T03032/reports/phase47b-report.json',
  runtimeFixAttempted: false,
  runtimeFixResult: 'not_attempted_out_of_scope',
  exclusionApplied: true,
  phase47CReadiness: 'ready_for_system_level_internal_testing_gate_preparation_without_vlm',
  blockers: [],
  warnings: [
    'Phase 47B uploaded private JSON blocker evidence, exclusion, readiness-impact, QA, and report artifacts only.',
    'VLM remains future-scoped and excluded from initial internal system testing until a later approved model/runtime/hardware path resolves the Phase 39C L4/vLLM CUDA OOM blocker.',
    'Production, external beta, paid production, broad real media, providers, Revideo, final delivery, model downloads, Docker, Cloud Run, and media processing remain blocked.',
  ],
}

export function getApprovedVlmBlockerResolutionEvidence(): ApprovedVlmBlockerResolutionEvidence {
  return {
    ...approvedVlmBlockerResolutionEvidence,
    blockers: [...approvedVlmBlockerResolutionEvidence.blockers],
    warnings: [...approvedVlmBlockerResolutionEvidence.warnings],
  }
}
