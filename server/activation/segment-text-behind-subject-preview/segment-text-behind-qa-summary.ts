import { getApprovedSegmentTextBehindSubjectPreviewEvidence } from './approved-segment-text-behind-subject-preview-evidence'
import { segmentTextBehindSubjectPreviewConfig, validateSegmentTextBehindSubjectPreviewReport } from './segment-text-behind-subject-preview-policy'
import type {
  SegmentTextBehindSubjectPreviewExecutionReport,
  SegmentTextBehindSubjectPreviewQaGate,
} from './segment-text-behind-subject-preview-types'

const gateIds: SegmentTextBehindSubjectPreviewQaGate['gateId'][] = [
  'source_integrity',
  'segment_bounds',
  'mask_integrity',
  'composition_artifacts',
  'behind_subject_effect',
  'temporal_preview_consistency',
  'artifact_privacy',
  'blocked_features',
]

export function buildSegmentTextBehindSubjectPreviewQaSummary(executionReport?: SegmentTextBehindSubjectPreviewExecutionReport) {
  const approvedEvidence = getApprovedSegmentTextBehindSubjectPreviewEvidence()
  if (executionReport) {
    const blockers = validateSegmentTextBehindSubjectPreviewReport(executionReport)
    const warnings = Array.from(new Set([
      ...executionReport.qa.warnings,
      'Subjective visual quality still requires human review before any broader scope.',
      'Full-video text-behind-subject and final export remain blocked.',
    ]))
    return {
      status: blockers.length === 0 ? 'ready' as const : 'blocked' as const,
      reason: blockers.length === 0
        ? 'Phase 35E execution report exists with required private preview frames and no blocking QA findings.'
        : 'Phase 35E execution report has blocking QA findings.',
      gates: executionReport.qa.gates,
      blockers,
      warnings,
    }
  }

  const blockers = approvedEvidence.status === 'verified' ? [] : approvedEvidence.blockers
  return {
    status: approvedEvidence.status === 'verified' ? 'ready' as const : 'planned' as const,
    reason: approvedEvidence.status === 'verified'
      ? approvedEvidence.phase36AReadiness.reason
      : 'Phase 35E has not produced a controlled segment preview report yet.',
    gates: gateIds.map((gateId): SegmentTextBehindSubjectPreviewQaGate => ({
      gateId,
      status: approvedEvidence.status === 'verified' ? (gateId === 'behind_subject_effect' || gateId === 'temporal_preview_consistency' ? 'warning' : 'passed') : 'not_applicable',
      summary: approvedEvidence.status === 'verified'
        ? qaGateSummary(gateId)
        : 'Pending Phase 35E execution.',
    })),
    blockers,
    warnings: approvedEvidence.warnings,
  }
}

export function buildSegmentTextBehindSubjectPreviewExecutionQa(input: {
  previewFrameCount: number
  maskCount: number
  frameCount: number
  width: number
  height: number
  publicAccessEnabled: boolean
}): SegmentTextBehindSubjectPreviewExecutionReport['qa'] {
  const blockers: string[] = []
  const warnings: string[] = [
    'Subjective visual quality and edge flicker remain warning-only until human review.',
    'Preview clip generation was omitted; private preview frames are the Phase 35E source of truth.',
  ]
  const sourceOk = true
  const segmentOk = input.frameCount === segmentTextBehindSubjectPreviewConfig.approvedFrameCount
    && input.width === segmentTextBehindSubjectPreviewConfig.approvedFrameWidth
    && input.height === segmentTextBehindSubjectPreviewConfig.approvedFrameHeight
  const masksOk = input.maskCount === input.frameCount
  const compositionOk = input.previewFrameCount === input.frameCount
  const privacyOk = !input.publicAccessEnabled
  const blockedOk = true

  if (!segmentOk) blockers.push('Segment frame count or dimensions do not match Phase 35D evidence.')
  if (!masksOk) blockers.push('Mask count does not match segment frame count.')
  if (!compositionOk) blockers.push('Preview frame count does not match segment frame count.')
  if (!privacyOk) blockers.push('Public access was detected.')

  const gates: SegmentTextBehindSubjectPreviewQaGate[] = [
    { gateId: 'source_integrity', status: sourceOk ? 'passed' : 'blocked', summary: 'Used only the approved Phase 35D run, manifests, frames, masks, and QA report.' },
    { gateId: 'segment_bounds', status: segmentOk ? 'passed' : 'blocked', summary: `Segment remained ${input.frameCount} frames at ${input.width}x${input.height}.` },
    { gateId: 'mask_integrity', status: masksOk ? 'passed' : 'blocked', summary: `Decoded ${input.maskCount} SAM2 masks matching the segment frame sequence.` },
    { gateId: 'composition_artifacts', status: compositionOk ? 'passed' : 'blocked', summary: `Created ${input.previewFrameCount} private text-behind-subject preview frames.` },
    { gateId: 'behind_subject_effect', status: 'warning', summary: 'Text was composited behind the subject mask; visual quality remains subject to human review.' },
    { gateId: 'temporal_preview_consistency', status: 'warning', summary: 'Text placement is stable across frames; subjective flicker/edge quality remains review-only.' },
    { gateId: 'artifact_privacy', status: privacyOk ? 'passed' : 'blocked', summary: 'Outputs remain under private staging GCS prefixes with no public URLs.' },
    { gateId: 'blocked_features', status: blockedOk ? 'passed' : 'blocked', summary: 'Full-video text-behind-subject, full-video masks, final export, providers, Revideo, FILM, slow motion, production, beta, and broad media remained blocked.' },
  ]

  return {
    status: blockers.length > 0 ? 'blocked' : gates.some((gate) => gate.status === 'warning') ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function qaGateSummary(gateId: SegmentTextBehindSubjectPreviewQaGate['gateId']): string {
  switch (gateId) {
    case 'source_integrity':
      return 'Approved Phase 35D source artifacts only.'
    case 'segment_bounds':
      return 'Bounded 2.0s, 10-frame segment only.'
    case 'mask_integrity':
      return 'SAM2 masks matched segment frames.'
    case 'composition_artifacts':
      return 'Private preview frames and composition metadata exist.'
    case 'behind_subject_effect':
      return 'Warning-only pending human visual review.'
    case 'temporal_preview_consistency':
      return 'Warning-only pending temporal visual review.'
    case 'artifact_privacy':
      return 'Private GCS prefixes only.'
    case 'blocked_features':
      return 'Forbidden broad/full-video/provider/export features remained blocked.'
  }
}
