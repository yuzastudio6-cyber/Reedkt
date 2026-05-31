import type { RealVideoProColorImageExecutionReport, RealVideoProColorImageQaGate } from './real-video-pro-color-image-types'

const missingGateSummary: Record<RealVideoProColorImageQaGate['gateId'], string> = {
  source_integrity: 'Approved Phase 32 source validation has not been executed.',
  phase40b_evidence: 'Phase 40B runtime evidence has not been verified.',
  plan_snapshot_integrity: 'Approved Phase 40C plan snapshot has not been produced.',
  sample_bounds: 'Bounded frame sample has not been produced.',
  openimageio_real_frame: 'OpenImageIO has not been verified on real-video-derived frames.',
  opencolorio_real_frame: 'OpenColorIO has not been verified on real-video-derived frames.',
  kornia_real_frame: 'Kornia has not been verified on real-video-derived frames.',
  artifact_privacy: 'Private artifact upload prefixes have not been verified.',
  blocked_features: 'Blocked feature evidence has not been recorded.',
}

export function buildRealVideoProColorImageQaSummary(executionReport?: RealVideoProColorImageExecutionReport) {
  const gates: RealVideoProColorImageQaGate[] = executionReport?.qa.gates ?? Object.entries(missingGateSummary).map(([gateId, summary]) => ({
    gateId: gateId as RealVideoProColorImageQaGate['gateId'],
    passed: false,
    severity: 'mandatory',
    summary,
  }))
  const blockers = executionReport ? executionReport.qa.blockers : ['Phase 40C real-video pro color/image execution report is missing.']
  const warnings = executionReport
    ? executionReport.qa.warnings
    : ['Phase 40D remains blocked until one bounded real-video pro color/image sample passes.']
  const ready = Boolean(executionReport?.ok && executionReport.qa.status === 'passed')
  return {
    gates,
    blockers,
    warnings,
    ready,
    reason: ready
      ? 'Phase 40C verified OpenColorIO, OpenImageIO, and Kornia on bounded real-video-derived frames only.'
      : 'Phase 40D remains blocked until Phase 40C bounded real-video sample QA passes.',
  }
}

