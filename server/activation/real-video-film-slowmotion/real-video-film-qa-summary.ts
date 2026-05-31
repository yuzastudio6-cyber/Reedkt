import type {
  RealVideoFilmSlowmotionExecutionReport,
  RealVideoFilmSlowmotionQaGate,
} from './real-video-film-slowmotion-types'

export function buildRealVideoFilmQaSummary(executionReport?: RealVideoFilmSlowmotionExecutionReport, input: { approvedEvidenceVerified?: boolean } = {}) {
  const gates: RealVideoFilmSlowmotionQaGate[] = executionReport?.qa.gates ?? [
    { gateId: 'source_integrity', status: 'blocked', summary: 'No Phase 38D execution report is recorded.' },
    { gateId: 'plan_snapshot_integrity', status: 'blocked', summary: 'Approved plan snapshot has not been executed.' },
    { gateId: 'segment_bounds', status: 'blocked', summary: 'Selected segment bounds have not been verified.' },
    { gateId: 'model_artifacts', status: 'blocked', summary: 'Private FILM model checksums have not been verified by runtime.' },
    { gateId: 'runtime_integrity', status: 'blocked', summary: 'FILM runtime has not completed.' },
    { gateId: 'interpolated_artifacts', status: 'blocked', summary: 'Interpolated frame artifacts are not recorded.' },
    { gateId: 'motion_sanity', status: 'blocked', summary: 'Motion sanity has not been evaluated.' },
    { gateId: 'preview_artifacts', status: 'blocked', summary: 'Preview artifacts are not recorded.' },
    { gateId: 'artifact_privacy', status: 'blocked', summary: 'Private artifact prefixes have not been verified.' },
    { gateId: 'blocked_features', status: 'blocked', summary: 'Blocked feature evidence has not been recorded.' },
  ]
  const blockers = executionReport
    ? executionReport.qa.blockers
    : input.approvedEvidenceVerified ? [] : ['Phase 38D real-video FILM slow-motion execution report is missing.']
  const warnings = executionReport
    ? executionReport.qa.warnings
    : ['Phase 38D readiness requires one approved selected-segment runtime execution.']
  const ready = Boolean(executionReport?.ok && executionReport.qa.status !== 'blocked') || input.approvedEvidenceVerified === true
  return {
    gates,
    blockers,
    warnings,
    status: ready ? 'ready' : 'blocked',
    reason: ready
      ? 'Phase 38D verified one controlled selected real-video FILM slow-motion sample only.'
      : 'Phase 38E remains blocked until Phase 38D selected-segment runtime QA passes.',
  }
}
