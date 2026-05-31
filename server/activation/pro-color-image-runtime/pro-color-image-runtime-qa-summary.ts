import { proColorImageRuntimeConfig } from './pro-color-image-runtime-policy'
import type { ProColorImageRuntimeExecutionReport, ProColorImageRuntimeQaGate } from './pro-color-image-runtime-types'

const missingGateSummary: Record<ProColorImageRuntimeQaGate['gateId'], string> = {
  tool_runtime_integrity: 'No Phase 40B tool runtime execution is recorded.',
  fixture_integrity: 'Generated color/image fixtures have not been produced.',
  opencolorio_result: 'OpenColorIO identity transform has not been verified.',
  openimageio_result: 'OpenImageIO read/write/metadata inspection has not been verified.',
  kornia_result: 'Kornia generated-image transform/metric run has not been verified.',
  image_artifact_integrity: 'Generated image artifacts have not been verified.',
  metadata_integrity: 'Fixture metadata has not been verified.',
  color_transform_safety: 'Color transform safety checks have not been evaluated.',
  artifact_privacy: 'Private artifact upload prefixes have not been verified.',
  blocked_features: 'Blocked feature evidence has not been recorded.',
}

export function buildProColorImageRuntimeQaSummary(executionReport?: ProColorImageRuntimeExecutionReport) {
  const gates: ProColorImageRuntimeQaGate[] = executionReport?.qa.gates ?? Object.entries(missingGateSummary).map(([gateId, summary]) => ({
    gateId: gateId as ProColorImageRuntimeQaGate['gateId'],
    passed: false,
    severity: 'mandatory',
    summary,
  }))
  const blockers = executionReport ? executionReport.qa.blockers : ['Phase 40B runtime report is missing.']
  const warnings = executionReport
    ? executionReport.qa.warnings
    : ['Phase 40B can only promote to Phase 40C after one generated-fixture runtime execution passes.']
  const ready = Boolean(executionReport?.ok && executionReport.qa.status === 'passed')
  return {
    gates,
    blockers,
    warnings,
    ready,
    reason: ready
      ? `OpenColorIO, OpenImageIO, and Kornia verified on ${proColorImageRuntimeConfig.fixtureFrameCount} generated ${proColorImageRuntimeConfig.fixtureWidth}x${proColorImageRuntimeConfig.fixtureHeight} fixtures only.`
      : 'Phase 40C remains blocked until Phase 40B generated-fixture runtime QA passes.',
  }
}
