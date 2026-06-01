import type { ApprovedTrackIntegrationAuditEvidence } from './track-integration-audit-types'

export const approvedTrackIntegrationAuditEvidence: ApprovedTrackIntegrationAuditEvidence = {
  phase: '47A',
  status: 'completed',
  runId: 'phase47a-20260601T02252',
  integrationManifestUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/integration/integration-readiness-manifest.json',
  trackAEvidenceUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/evidence/track-a-evidence.json',
  trackBEvidenceUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/evidence/track-b-evidence.json',
  ownershipMatrixUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/ownership/ownership-matrix.json',
  registryReconciliationUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/reconciliation/registry-reconciliation.json',
  docsReconciliationUri:
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/phase47a-20260601T02252/reconciliation/docs-reconciliation.json',
  qaReportUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47a/phase47a-20260601T02252/reports/phase47a-report.json',
  trackAReadiness: {
    status: 'ready',
    reason: 'Track A is ready for internal private visual-video testing using Phase 45F approved evidence.',
  },
  trackBReadiness: {
    status: 'partial',
    reason: 'Track B is partial: audio and OCR have internal evidence, Demucs is intentionally blocked, and VLM remains blocked on Phase 39C L4/vLLM CUDA OOM.',
  },
  integrationReadiness: {
    status: 'blocked',
    reason: 'Track A is ready and Track B is explicitly partial, but full system-level internal testing remains blocked until Track B VLM is resolved or explicitly excluded in a later approval phase.',
    remainingBlockers: [
      'Track B VLM Phase 39C remains blocked on L4/vLLM CUDA OOM before generated fixture inference.',
      'Demucs remains blocked until pretrained-model license/provenance is approved; keep it outside active runtime/download scope.',
    ],
  },
  blockers: [],
  warnings: [
    'Phase 47A completed the audit; integration readiness remains blocked by explicit Track B blockers.',
    'Track B VLM Phase 39C remains blocked on L4/vLLM CUDA OOM before generated fixture inference.',
    'Demucs remains blocked until pretrained-model license/provenance approval.',
    'Production, external beta, paid production, broad real media, final delivery, providers, Revideo, Docker, Cloud Run, and media processing remain blocked.',
  ],
}

export function getApprovedTrackIntegrationAuditEvidence(): ApprovedTrackIntegrationAuditEvidence {
  return {
    ...approvedTrackIntegrationAuditEvidence,
    trackAReadiness: { ...approvedTrackIntegrationAuditEvidence.trackAReadiness },
    trackBReadiness: { ...approvedTrackIntegrationAuditEvidence.trackBReadiness },
    integrationReadiness: {
      ...approvedTrackIntegrationAuditEvidence.integrationReadiness,
      remainingBlockers: [...approvedTrackIntegrationAuditEvidence.integrationReadiness.remainingBlockers],
    },
    blockers: [...approvedTrackIntegrationAuditEvidence.blockers],
    warnings: [...approvedTrackIntegrationAuditEvidence.warnings],
  }
}
