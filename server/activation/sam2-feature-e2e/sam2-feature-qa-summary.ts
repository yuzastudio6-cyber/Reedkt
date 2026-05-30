import { getApprovedSam2FeatureE2EEvidence } from './approved-sam2-feature-e2e-evidence'
import { sam2FeatureE2EConfig, validateSam2FeatureE2EReport } from './sam2-feature-e2e-policy'
import type {
  Sam2FeatureE2EExecutionReport,
  Sam2FeatureQaGate,
} from './sam2-feature-e2e-types'

const gateIds: Sam2FeatureQaGate['gateId'][] = [
  'source_integrity',
  'plan_snapshot_integrity',
  'preview_scope',
  'model_integrity',
  'sam2_mask_tracking',
  'composition_integrity',
  'artifact_privacy',
  'beta_readiness_evidence',
  'blocked_features',
]

export function buildSam2FeatureE2EQaSummary(executionReport?: Sam2FeatureE2EExecutionReport) {
  const approvedEvidence = getApprovedSam2FeatureE2EEvidence()
  if (executionReport) {
    const blockers = validateSam2FeatureE2EReport(executionReport)
    const warnings = Array.from(new Set([
      ...executionReport.qa.warnings,
      'Human visual review is recommended before any broader SAM2 feature use.',
      'External beta and paid production remain blocked.',
    ]))
    return {
      status: blockers.length === 0 ? 'ready' as const : 'blocked' as const,
      gates: executionReport.qa.gates,
      blockers,
      warnings,
    }
  }

  const blockers = approvedEvidence.status === 'not_started' ? [] : approvedEvidence.blockers
  return {
    status: approvedEvidence.status === 'verified' || approvedEvidence.status === 'segment_only' ? 'ready' as const : 'planned' as const,
    gates: gateIds.map((gateId): Sam2FeatureQaGate => ({
      gateId,
      status: approvedEvidence.status === 'verified' || approvedEvidence.status === 'segment_only'
        ? gateId === 'beta_readiness_evidence'
          ? approvedEvidence.featureReadiness.status === 'ready_for_internal_sam2_feature_testing' ? 'passed' : 'warning'
          : 'passed'
        : 'not_applicable',
      summary: approvedEvidence.status === 'not_started' ? 'Pending Phase 35F execution.' : qaGateSummary(gateId),
    })),
    blockers,
    warnings: approvedEvidence.warnings,
  }
}

export function buildSam2FeatureExecutionQa(input: {
  sourceOk: boolean
  planSnapshotOk: boolean
  frameCount: number
  maskCount: number
  previewFrameCount: number
  width: number
  height: number
  fps: number
  fullControlledClip: boolean
  previewClipGenerated: boolean
  publicAccessEnabled: boolean
  runtimeQaBlockers: string[]
}): Sam2FeatureE2EExecutionReport['qa'] {
  const blockers: string[] = [...input.runtimeQaBlockers]
  const warnings: string[] = [
    'Human visual review is recommended before any broader SAM2 feature use.',
    'This is internal SAM2 feature testing evidence only, not external beta or production approval.',
  ]
  const previewScopeOk = input.width === sam2FeatureE2EConfig.previewWidth
    && input.height === sam2FeatureE2EConfig.previewHeight
    && input.fps <= sam2FeatureE2EConfig.maxFps
    && input.frameCount <= sam2FeatureE2EConfig.maxFrames
  const masksOk = input.maskCount === input.frameCount && input.maskCount > 0
  const compositionOk = input.previewFrameCount === input.frameCount && input.previewFrameCount > 0
  const privacyOk = !input.publicAccessEnabled

  if (!input.sourceOk) blockers.push('Approved source validation failed.')
  if (!input.planSnapshotOk) blockers.push('Approved plan snapshot is missing or raw prompt execution was enabled.')
  if (!previewScopeOk) blockers.push('Preview scope is outside Phase 35F bounds.')
  if (!masksOk) blockers.push('SAM2 mask count does not match preview frame count.')
  if (!compositionOk) blockers.push('Preview composition frame count does not match preview frame count.')
  if (!privacyOk) blockers.push('Public access was detected.')
  if (!input.fullControlledClip) warnings.push('Only fallback segment scope completed; full SAM2 feature beta candidate readiness remains blocked.')
  if (!input.previewClipGenerated) warnings.push('Private MP4 preview assembly was not generated; private preview frames are the source of truth.')

  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates: [
      { gateId: 'source_integrity', status: input.sourceOk ? 'passed' : 'blocked', summary: 'Used only the approved controlled source/export; no arbitrary media.' },
      { gateId: 'plan_snapshot_integrity', status: input.planSnapshotOk ? 'passed' : 'blocked', summary: 'Structured approved plan snapshot existed before worker execution; raw prompt execution stayed false.' },
      { gateId: 'preview_scope', status: previewScopeOk ? input.fullControlledClip ? 'passed' : 'warning' : 'blocked', summary: `${input.frameCount} frames at ${input.width}x${input.height}, ${input.fps} fps.` },
      { gateId: 'model_integrity', status: input.runtimeQaBlockers.length === 0 ? 'passed' : 'blocked', summary: 'Approved private SAM2.1 tiny checkpoint/config and checksums were used.' },
      { gateId: 'sam2_mask_tracking', status: masksOk ? 'passed' : 'blocked', summary: `Generated ${input.maskCount} SAM2 masks for the bounded preview scope.` },
      { gateId: 'composition_integrity', status: compositionOk ? 'passed' : 'blocked', summary: `Generated ${input.previewFrameCount} private text-behind-subject preview frames.` },
      { gateId: 'artifact_privacy', status: privacyOk ? 'passed' : 'blocked', summary: 'Artifacts are private GCS objects only; no signed/public URLs.' },
      { gateId: 'beta_readiness_evidence', status: input.fullControlledClip && blockers.length === 0 ? 'passed' : 'warning', summary: input.fullControlledClip ? 'Full controlled private preview scope completed.' : 'Segment-level evidence only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Providers, Revideo, FILM, slow motion, Real-ESRGAN, production, external beta, paid production, and broad media remained blocked.' },
    ],
    blockers,
    warnings,
  }
}

function qaGateSummary(gateId: Sam2FeatureQaGate['gateId']): string {
  switch (gateId) {
    case 'source_integrity':
      return 'Approved controlled source/export only.'
    case 'plan_snapshot_integrity':
      return 'Approved plan snapshot existed and raw prompt execution stayed false.'
    case 'preview_scope':
      return 'Bounded private preview resolution, FPS, and frame cap.'
    case 'model_integrity':
      return 'Approved private SAM2 checkpoint/config and checksums.'
    case 'sam2_mask_tracking':
      return 'SAM2 masks generated for the selected bounded preview scope.'
    case 'composition_integrity':
      return 'Text-behind-subject private preview frames generated.'
    case 'artifact_privacy':
      return 'Private GCS prefixes only.'
    case 'beta_readiness_evidence':
      return 'Internal SAM2 feature readiness evidence only.'
    case 'blocked_features':
      return 'Forbidden broad/full-video/provider/export/beta features remained blocked.'
  }
}
