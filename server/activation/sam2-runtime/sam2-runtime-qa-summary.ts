import { sam2RuntimeConfig } from './sam2-runtime-policy'
import type { Sam2RuntimeExecutionReport, Sam2RuntimeQaGate } from './sam2-runtime-types'

export function buildSam2RuntimeQaSummary(executionReport?: Sam2RuntimeExecutionReport): {
  gates: Sam2RuntimeQaGate[]
  blockers: string[]
  warnings: string[]
  readyForPhase35D: boolean
  reason: string
} {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!executionReport) {
    blockers.push('Phase 35C Cloud Run execution report is missing.')
    return {
      gates: requiredGateIds().map((gateId) => ({ gateId, status: 'blocked', summary: 'Execution report missing.' })),
      blockers,
      warnings,
      readyForPhase35D: false,
      reason: 'Phase 35D remains blocked until generated/synthetic SAM2 runtime verification passes.',
    }
  }

  const gates = executionReport.qa.gates
  const gateIds = new Set(gates.map((gate) => gate.gateId))
  for (const gateId of requiredGateIds()) {
    if (!gateIds.has(gateId)) blockers.push(`Missing QA gate: ${gateId}`)
  }

  if (!executionReport.ok) blockers.push('SAM2 runtime execution report is not ok.')
  if (executionReport.projectId !== sam2RuntimeConfig.projectId) blockers.push('Execution report project id does not match policy.')
  if (executionReport.jobName !== sam2RuntimeConfig.runtimeJobName) blockers.push('Execution report job name does not match policy.')
  if (!executionReport.gpu.cudaAvailable) blockers.push('CUDA was not available during SAM2 runtime verification.')
  if (executionReport.gpu.type !== sam2RuntimeConfig.gpuType) blockers.push('GPU type does not match nvidia-l4 policy.')
  if (!/L4/i.test(executionReport.gpu.deviceName ?? '')) blockers.push('GPU device name does not confirm NVIDIA L4.')
  if (executionReport.model.modelId !== sam2RuntimeConfig.modelId) blockers.push('Execution report model id does not match Phase 35B evidence.')
  if (executionReport.model.checkpointSha256 !== sam2RuntimeConfig.checkpointSha256) blockers.push('Checkpoint checksum mismatch in execution report.')
  if (executionReport.model.configSha256 !== sam2RuntimeConfig.configSha256) blockers.push('Config checksum mismatch in execution report.')
  if (executionReport.model.aggregateSha256 !== sam2RuntimeConfig.aggregateSha256) blockers.push('Aggregate checksum mismatch in execution report.')
  if (!executionReport.fixture.generated) blockers.push('Fixture must be generated-only.')
  if (executionReport.fixture.frameCount !== sam2RuntimeConfig.fixtureFrameCount) blockers.push('Generated fixture frame count must be exactly 5.')
  if (executionReport.fixture.width !== sam2RuntimeConfig.fixtureWidth || executionReport.fixture.height !== sam2RuntimeConfig.fixtureHeight) blockers.push('Generated fixture dimensions must be 512x512.')
  if (executionReport.masks.status !== 'completed') blockers.push('SAM2 mask generation did not complete.')
  if (executionReport.masks.maskUris.length !== sam2RuntimeConfig.fixtureFrameCount) blockers.push('Mask artifact count must match generated fixture frame count.')
  if (executionReport.masks.perFrame.some((frame) => frame.nonZeroRatio <= 0.005 || frame.nonZeroRatio >= 0.995)) blockers.push('One or more masks are empty or effectively full-frame.')
  if (executionReport.qa.status === 'blocked') blockers.push(...executionReport.qa.blockers)
  if (executionReport.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (executionReport.safety.modelDownloadedExternally) blockers.push('External model download was reported.')
  if (executionReport.safety.realMediaUsed || executionReport.safety.realVideoInputUsed) blockers.push('Real media input was reported.')
  if (executionReport.safety.fullVideoMaskExecuted) blockers.push('Full-video mask execution was reported.')
  if (executionReport.safety.fullVideoTextBehindSubjectExecuted) blockers.push('Full-video text-behind-subject execution was reported.')
  if (executionReport.safety.publicAccessEnabled) blockers.push('Public access was reported.')
  if (executionReport.safety.rtxPro6000Used) blockers.push('RTX PRO 6000 use was reported.')
  if (executionReport.safety.productionReadyAllowed || executionReport.safety.externalBetaAllowed || executionReport.safety.broadRealUserMediaAllowed) blockers.push('Launch gates were reported as unlocked.')

  warnings.push(...executionReport.warnings)
  warnings.push('Generated fixture runtime QA does not prove real-video temporal mask stability.')
  warnings.push('Human visual review is required before broader SAM2 usage.')

  const ready = blockers.length === 0
  return {
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    readyForPhase35D: ready,
    reason: ready
      ? 'SAM2 loaded approved private GCS weights/config and produced private masks for generated synthetic frames with no blocking QA failures.'
      : 'Phase 35D remains blocked until Phase 35C runtime, artifact, and safety QA pass.',
  }
}

function requiredGateIds(): Sam2RuntimeQaGate['gateId'][] {
  return [
    'model_artifacts',
    'runtime_integrity',
    'fixture_integrity',
    'mask_artifacts',
    'temporal_fixture_consistency',
    'artifact_privacy',
    'blocked_features',
  ]
}
