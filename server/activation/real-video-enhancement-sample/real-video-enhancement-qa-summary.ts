import type { RealVideoEnhancementSampleQaGate } from './real-video-enhancement-sample-types'

export function buildRealVideoEnhancementSampleQaSummary(input: {
  sampleWidth: number
  sampleHeight: number
  outputWidth?: number
  outputHeight?: number
  outputSizeBytes?: number
  enhancedProduced: boolean
  exactlyOneBoundedSample: boolean
  faceEnhanceRan: boolean
  modelDownloadedExternally: boolean
  providerExecuted: boolean
  fullFrameEnhanced: boolean
  fullVideoEnhancementExecuted: boolean
  slowMotionExecuted: boolean
  filmUsed: boolean
  disallowedWeightsPresent: boolean
}): { status: 'passed' | 'warning' | 'blocked'; gates: RealVideoEnhancementSampleQaGate[]; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings = [
    'Hallucination/detail improvement, oversharpening, and texture artifacts require human review before any broader enhancement use.',
    'Phase 34D validates one bounded real-video-derived crop only and does not claim full-frame or full-video enhancement quality.',
  ]
  const dimensionsX4 = input.outputWidth === input.sampleWidth * 4 && input.outputHeight === input.sampleHeight * 4
  const outputNonEmpty = Boolean(input.outputSizeBytes && input.outputSizeBytes > 0)
  if (!input.enhancedProduced) blockers.push('Enhanced sample artifact was not produced.')
  if (!dimensionsX4) blockers.push('Enhanced sample dimensions do not match expected x4 output.')
  if (!outputNonEmpty) blockers.push('Enhanced sample artifact is empty or missing size evidence.')
  if (!input.exactlyOneBoundedSample) blockers.push('Exactly one bounded sample crop was not confirmed.')
  if (input.fullFrameEnhanced) blockers.push('Full-frame enhancement was reported.')
  if (input.fullVideoEnhancementExecuted) blockers.push('Full-video enhancement was reported.')
  if (input.faceEnhanceRan) blockers.push('GFPGAN/face enhancement ran.')
  if (input.modelDownloadedExternally) blockers.push('Runtime model download was reported.')
  if (input.providerExecuted) blockers.push('Provider execution was reported.')
  if (input.slowMotionExecuted) blockers.push('Slow-motion execution was reported.')
  if (input.filmUsed) blockers.push('FILM use was reported.')
  if (input.disallowedWeightsPresent) blockers.push('Disallowed model weights were present.')

  const gates: RealVideoEnhancementSampleQaGate[] = [
    {
      gateId: 'enhancement_artifacts',
      status: input.enhancedProduced && dimensionsX4 && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && dimensionsX4 && outputNonEmpty
        ? `Enhanced sample exists and is ${input.outputWidth}x${input.outputHeight}.`
        : 'Enhanced sample creation, decode, or dimensions failed.',
    },
    {
      gateId: 'render_asset_integrity',
      status: input.enhancedProduced && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && outputNonEmpty ? 'Sample, enhanced image, metadata, QA, and report artifacts were generated.' : 'Artifact integrity failed.',
    },
    {
      gateId: 'sample_first_policy',
      status: input.exactlyOneBoundedSample && !input.fullFrameEnhanced && !input.fullVideoEnhancementExecuted ? 'passed' : 'blocked',
      summary: input.exactlyOneBoundedSample && !input.fullFrameEnhanced && !input.fullVideoEnhancementExecuted
        ? 'Exactly one bounded sample crop was enhanced; full-frame and full-video enhancement stayed blocked.'
        : 'Sample-first policy was violated.',
    },
    { gateId: 'hallucination_risk', status: 'warning', summary: 'Warning-only until a reviewer compares the before/after sample for invented detail.' },
    { gateId: 'oversharpening_risk', status: 'warning', summary: 'Warning-only until a reviewer checks edge halos and sharpening artifacts.' },
    { gateId: 'texture_artifact_risk', status: 'warning', summary: 'Warning-only until a reviewer checks texture and skin/product integrity.' },
    {
      gateId: 'runtime_safety',
      status: !input.providerExecuted && !input.modelDownloadedExternally && !input.faceEnhanceRan && !input.disallowedWeightsPresent && !input.filmUsed && !input.slowMotionExecuted ? 'passed' : 'blocked',
      summary: !input.providerExecuted && !input.modelDownloadedExternally && !input.faceEnhanceRan && !input.disallowedWeightsPresent && !input.filmUsed && !input.slowMotionExecuted
        ? 'No provider, runtime model download, FILM, slow motion, GFPGAN/facexlib weight, or face enhancement use was reported.'
        : 'Runtime safety guard failed.',
    },
  ]

  return { status: blockers.length > 0 ? 'blocked' : 'warning', gates, blockers, warnings }
}
