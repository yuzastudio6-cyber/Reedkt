import type { ProColorImageFeatureE2EExecutionReport, ProColorImageFeatureE2EQaGate } from './pro-color-image-feature-e2e-types'

const missingGateSummary: Record<ProColorImageFeatureE2EQaGate['gateId'], string> = {
  source_integrity: 'Approved Phase 32 source validation has not been executed.',
  phase40c_evidence: 'Phase 40C runtime evidence has not been verified.',
  plan_snapshot_integrity: 'Approved Phase 40D plan snapshot has not been produced.',
  sample_bounds: 'Bounded feature sample has not been produced.',
  openimageio_feature: 'OpenImageIO has not been verified on feature sample frames.',
  opencolorio_feature: 'OpenColorIO has not been verified on feature sample frames.',
  kornia_feature: 'Kornia has not been verified on feature sample frames.',
  review_artifacts: 'Private review artifacts have not been produced.',
  artifact_privacy: 'Private artifact upload prefixes have not been verified.',
  feature_readiness_evidence: 'Internal feature-readiness evidence has not been recorded.',
  blocked_features: 'Blocked feature evidence has not been recorded.',
}

export function buildProColorImageFeatureE2EQaSummary(executionReport?: ProColorImageFeatureE2EExecutionReport) {
  const gates: ProColorImageFeatureE2EQaGate[] = executionReport?.qa.gates ?? Object.entries(missingGateSummary).map(([gateId, summary]) => ({
    gateId: gateId as ProColorImageFeatureE2EQaGate['gateId'],
    passed: false,
    severity: 'mandatory',
    summary,
  }))
  const blockers = executionReport ? executionReport.qa.blockers : ['Phase 40D pro color/image feature E2E execution report is missing.']
  const warnings = executionReport
    ? executionReport.qa.warnings
    : ['Internal pro color/image feature testing remains blocked until Phase 40D passes.']
  const ready = Boolean(executionReport?.ok && executionReport.qa.status === 'passed')
  return {
    gates,
    blockers,
    warnings,
    ready,
    reason: ready
      ? 'Phase 40D verified the private pro color/image feature E2E path on bounded approved real-video-derived frames.'
      : 'Internal pro color/image feature testing remains blocked until Phase 40D QA passes.',
  }
}
