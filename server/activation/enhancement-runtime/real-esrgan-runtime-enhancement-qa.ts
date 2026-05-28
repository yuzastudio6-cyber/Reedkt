import type { RealEsrganEnhancementQaGate, RealEsrganRuntimeExecutionReport } from './real-esrgan-runtime-types'

export function buildRealEsrganEnhancementQaSummary(input: {
  inputWidth: number
  inputHeight: number
  outputWidth?: number
  outputHeight?: number
  outputSizeBytes?: number
  enhancedProduced: boolean
  faceEnhanceRan: boolean
  realMediaUsed: boolean
  modelDownloadedExternally: boolean
  providerExecuted: boolean
  fullVideoEnhancementExecuted: boolean
  slowMotionExecuted: boolean
  disallowedWeightsPresent: boolean
}): { status: 'passed' | 'warning' | 'blocked'; gates: RealEsrganEnhancementQaGate[]; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = ['Phase 34C is generated-image runtime verification only and does not claim real-video visual quality improvement.']
  const dimensionsX4 = input.outputWidth === input.inputWidth * 4 && input.outputHeight === input.inputHeight * 4
  const outputNonEmpty = Boolean(input.outputSizeBytes && input.outputSizeBytes > 0)
  if (!input.enhancedProduced) blockers.push('Enhanced image artifact was not produced.')
  if (!dimensionsX4) blockers.push('Enhanced image dimensions do not match the expected x4 output.')
  if (!outputNonEmpty) blockers.push('Enhanced image artifact is empty or missing size evidence.')
  if (input.faceEnhanceRan) blockers.push('GFPGAN/face enhancement ran, which is blocked in Phase 34C.')
  if (input.realMediaUsed) blockers.push('Real media or real frame processing was reported.')
  if (input.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (input.providerExecuted) blockers.push('Provider execution was reported.')
  if (input.fullVideoEnhancementExecuted) blockers.push('Full-video enhancement was reported.')
  if (input.slowMotionExecuted) blockers.push('Slow-motion execution was reported.')
  if (input.disallowedWeightsPresent) blockers.push('Disallowed model weights were present in the runtime model path.')

  const gates: RealEsrganEnhancementQaGate[] = [
    {
      gateId: 'enhancement_artifacts',
      status: input.enhancedProduced && dimensionsX4 && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && dimensionsX4 && outputNonEmpty
        ? `Enhanced PNG exists and is ${input.outputWidth}x${input.outputHeight}.`
        : 'Enhanced artifact creation or dimensions failed.',
    },
    {
      gateId: 'render_asset_integrity',
      status: input.enhancedProduced && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && outputNonEmpty
        ? 'Runtime metadata, QA, and enhanced image artifacts are present for this run.'
        : 'Runtime artifact integrity failed.',
    },
    {
      gateId: 'sample_first_policy',
      status: !input.realMediaUsed && !input.fullVideoEnhancementExecuted && !input.slowMotionExecuted ? 'passed' : 'blocked',
      summary: !input.realMediaUsed && !input.fullVideoEnhancementExecuted && !input.slowMotionExecuted
        ? 'Only the generated synthetic fixture was processed.'
        : 'Sample-first policy was violated.',
    },
    {
      gateId: 'runtime_safety',
      status: !input.providerExecuted && !input.modelDownloadedExternally && !input.faceEnhanceRan && !input.disallowedWeightsPresent ? 'passed' : 'blocked',
      summary: !input.providerExecuted && !input.modelDownloadedExternally && !input.faceEnhanceRan && !input.disallowedWeightsPresent
        ? 'No provider, runtime model download, GFPGAN/facexlib weight, or face enhancement use was reported.'
        : 'Runtime safety guard failed.',
    },
  ]

  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

export function validateRealEsrganRuntimeExecutionReport(report?: RealEsrganRuntimeExecutionReport): string[] {
  if (!report) return ['Real-ESRGAN runtime execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Real-ESRGAN runtime job did not report ok=true.')
  if (report.model.manifestId !== 'real_esrgan_x4plus_staging_v1') blockers.push('Runtime did not use the approved Real-ESRGAN manifest.')
  if (report.model.name !== 'RealESRGAN_x4plus') blockers.push('Runtime did not use RealESRGAN_x4plus.')
  if (report.model.fileSha256 !== '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1') blockers.push('Runtime file checksum does not match Phase 34B evidence.')
  if (report.model.aggregateSha256 !== '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5') blockers.push('Runtime aggregate checksum does not match Phase 34B evidence.')
  if (!report.gpu.cudaAvailable || report.gpu.type !== 'nvidia-l4') blockers.push('Runtime did not confirm nvidia-l4 CUDA availability.')
  if (!report.fixture.generated) blockers.push('Runtime did not use a generated fixture image.')
  if (report.enhanced.status !== 'completed') blockers.push('Real-ESRGAN enhancement did not complete.')
  if (report.enhanced.width !== report.fixture.width * 4 || report.enhanced.height !== report.fixture.height * 4) blockers.push('Enhanced output is not x4 fixture size.')
  if (report.qa.status === 'blocked') blockers.push('Real-ESRGAN enhancement QA has blocking failures.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('External model download was reported.')
  if (report.safety.realMediaUsed || report.safety.realVideoFrameUsed) blockers.push('Real media/frame use was reported.')
  if (report.safety.filmUsed) blockers.push('FILM use was reported.')
  if (report.safety.slowMotionExecuted) blockers.push('Slow-motion execution was reported.')
  if (report.safety.fullVideoEnhancementExecuted) blockers.push('Full-video enhancement was reported.')
  if (report.safety.faceEnhanceRan) blockers.push('GFPGAN/face enhancement was reported.')
  if (report.safety.gfpganWeightsPresent) blockers.push('GFPGAN weights were present.')
  if (report.safety.facexlibWeightsPresent) blockers.push('facexlib weights were present.')
  if (report.safety.alternateRealEsrganWeightsPresent) blockers.push('Alternate Real-ESRGAN weights were present.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was reported.')
  if (report.safety.rtxPro6000Used) blockers.push('RTX PRO 6000 use was reported.')
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return blockers
}
