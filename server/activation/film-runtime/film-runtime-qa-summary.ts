import { filmRuntimeConfig } from './film-runtime-policy'
import type { FilmRuntimeExecutionReport, FilmRuntimeQaGate } from './film-runtime-types'

export function buildFilmRuntimeQaSummary(executionReport?: FilmRuntimeExecutionReport) {
  const gates: FilmRuntimeQaGate[] = executionReport?.qa.gates ?? [
    { gateId: 'model_artifacts', status: 'blocked', summary: 'No Phase 38C execution report is recorded.' },
    { gateId: 'runtime_integrity', status: 'blocked', summary: 'No FILM runtime execution has completed.' },
    { gateId: 'fixture_integrity', status: 'blocked', summary: 'Generated frame fixture has not been produced.' },
    { gateId: 'interpolated_frame_artifacts', status: 'blocked', summary: 'Interpolated frame artifact has not been produced.' },
    { gateId: 'motion_sanity', status: 'blocked', summary: 'Motion sanity has not been evaluated.' },
    { gateId: 'artifact_privacy', status: 'blocked', summary: 'Private artifact uploads have not been verified.' },
    { gateId: 'blocked_features', status: 'blocked', summary: 'Blocked feature evidence has not been recorded.' },
  ]
  const blockers = executionReport ? executionReport.qa.blockers : ['Phase 38C runtime report is missing.']
  const warnings = executionReport
    ? executionReport.qa.warnings
    : ['Phase 38C can only become ready after one generated-frame runtime execution passes.']
  const ready = Boolean(executionReport?.ok && executionReport.qa.status !== 'blocked')
  return {
    gates,
    blockers,
    warnings,
    ready,
    reason: ready
      ? `FILM runtime verified on ${filmRuntimeConfig.fixtureFrameCount} generated ${filmRuntimeConfig.fixtureWidth}x${filmRuntimeConfig.fixtureHeight} frames only.`
      : 'Phase 38D remains blocked until Phase 38C generated-frame runtime QA passes.',
  }
}
