import { createHash } from 'node:crypto'
import { getApprovedControlledRealVideoOcrExecutionEvidence } from '../controlled-real-video-ocr-safe-zone'
import type {
  OcrCaptionRenderQaBox,
  OcrCaptionRenderQaFixture,
  OcrCaptionRenderQaFrame,
  OcrCaptionRenderQaTextRegion,
} from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaGeneratedFixtures(): OcrCaptionRenderQaFixture[] {
  return [
    {
      fixtureId: 'generated-lower-third-conflict',
      kind: 'generated_metadata',
      label: 'Synthetic lower-third OCR collision',
      required: true,
      expectedStatus: 'passed',
      expectedLowerThirdCollision: true,
      frames: [
        generatedFrame('generated_lower_conflict_frame_01', [
          generatedRegion('generated-lower-third-conflict', 'generated_lower_conflict_frame_01', 'synthetic_sale_banner', { x: 0.12, y: 0.74, width: 0.68, height: 0.09 }, 0.93, 'SALE ENDS TODAY'),
        ]),
      ],
      sourceArtifactRefs: [],
      blockersExpected: [],
      warnings: [],
    },
    {
      fixtureId: 'generated-no-conflict',
      kind: 'generated_metadata',
      label: 'Synthetic safe lower-third caption placement',
      required: true,
      expectedStatus: 'passed',
      expectedLowerThirdCollision: false,
      frames: [
        generatedFrame('generated_no_conflict_frame_01', [
          generatedRegion('generated-no-conflict', 'generated_no_conflict_frame_01', 'synthetic_top_nav', { x: 0.12, y: 0.12, width: 0.28, height: 0.08 }, 0.88, 'Dashboard'),
        ]),
      ],
      sourceArtifactRefs: [],
      blockersExpected: [],
      warnings: [],
    },
    {
      fixtureId: 'generated-multi-region-crowded',
      kind: 'generated_metadata',
      label: 'Synthetic crowded OCR metadata requiring manual placement review',
      required: true,
      expectedStatus: 'manual_review',
      expectedLowerThirdCollision: true,
      frames: [
        generatedFrame('generated_crowded_frame_01', [
          generatedRegion('generated-multi-region-crowded', 'generated_crowded_frame_01', 'synthetic_upper_label', { x: 0.06, y: 0.08, width: 0.86, height: 0.2 }, 0.91, 'UPPER STATUS PANEL'),
          generatedRegion('generated-multi-region-crowded', 'generated_crowded_frame_01', 'synthetic_center_label', { x: 0.12, y: 0.39, width: 0.76, height: 0.18 }, 0.87, 'CENTER DATA TABLE'),
          generatedRegion('generated-multi-region-crowded', 'generated_crowded_frame_01', 'synthetic_lower_label', { x: 0.08, y: 0.72, width: 0.84, height: 0.16 }, 0.9, 'LOWER THIRD COPY'),
        ]),
      ],
      sourceArtifactRefs: [],
      blockersExpected: [],
      warnings: ['All default caption candidate zones intentionally contain OCR metadata; manual caption layout review is expected.'],
    },
  ]
}

export function buildOcrCaptionRenderQaBlockedGuardFixtures(): OcrCaptionRenderQaFixture[] {
  const guardCases = [
    ['public-path-blocked', 'Public artifact path is blocked.', 'public_artifact_path_blocked'],
    ['signed-url-blocked', 'Signed URL source-of-truth is blocked.', 'signed_url_source_of_truth_blocked'],
    ['arbitrary-media-input-blocked', 'Arbitrary media input is blocked.', 'arbitrary_media_input_blocked'],
    ['missing-phase37c-evidence-blocked', 'Missing Phase 37C evidence blocks integration.', 'phase37c_evidence_required'],
    ['missing-phase37d-evidence-blocked', 'Missing Phase 37D evidence blocks integration.', 'phase37d_evidence_required'],
    ['attempted-ocr-runtime-blocked', 'Attempted OCR runtime execution is blocked.', 'ocr_runtime_execution_blocked'],
  ] as const

  return guardCases.map(([fixtureId, label, blocker]) => ({
    fixtureId,
    kind: 'blocked_guard' as const,
    label,
    required: true,
    expectedStatus: 'blocked' as const,
    expectedLowerThirdCollision: false,
    frames: [],
    sourceArtifactRefs: [],
    blockersExpected: [blocker],
    warnings: [],
  }))
}

export function buildOcrCaptionRenderQaControlledFixtureFromApprovedEvidence(): OcrCaptionRenderQaFixture {
  const evidence = getApprovedControlledRealVideoOcrExecutionEvidence()
  const frames: OcrCaptionRenderQaFrame[] = evidence.frameOffsetsSeconds.map((offsetSeconds, index) => ({
    frameId: `controlled_phase37d_summary_frame_${String(index + 1).padStart(2, '0')}`,
    offsetSeconds,
    width: 1080,
    height: 1920,
    regions: [],
  }))

  return {
    fixtureId: 'controlled-phase37d-sample',
    kind: 'controlled_phase37d_metadata',
    label: 'Controlled Phase 37D sample, committed safe evidence summary',
    required: true,
    expectedStatus: evidence.ocrSummary.framesWithLowerThirdCollision === 0 ? 'passed' : 'manual_review',
    expectedLowerThirdCollision: evidence.ocrSummary.framesWithLowerThirdCollision > 0,
    frames,
    sourceArtifactRefs: [
      evidence.artifactPrefix ?? 'phase37d_private_artifact_prefix_missing',
    ],
    blockersExpected: [],
    warnings: [
      'Using committed Phase 37D summary evidence only; private per-region metadata is loaded only during confirmed execution.',
      ...evidence.warnings,
    ],
  }
}

export function buildOcrCaptionRenderQaControlledFixtureFromAvoidRegions(input: {
  artifactPrefix: string
  safeZoneManifest: {
    avoidTextRegions?: Array<OcrCaptionRenderQaBox & {
      avoidRegionId?: string
      sourceRegionId?: string
      frameId?: string
      padding?: number
    }>
    frameRecommendations?: Array<{
      frameId?: string
      offsetSeconds?: number
      textRegionCount?: number
    }>
  }
}): OcrCaptionRenderQaFixture {
  const evidence = getApprovedControlledRealVideoOcrExecutionEvidence()
  const regionsByFrame = new Map<string, OcrCaptionRenderQaTextRegion[]>()
  for (const region of input.safeZoneManifest.avoidTextRegions ?? []) {
    const frameId = region.frameId ?? 'controlled_phase37d_unknown_frame'
    const regionId = region.sourceRegionId ?? region.avoidRegionId ?? `${frameId}_redacted_region`
    const normalized: OcrCaptionRenderQaTextRegion = {
      regionId,
      fixtureId: 'controlled-phase37d-sample',
      frameId,
      source: 'phase37d_private_redacted',
      box: {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
      },
      textRedaction: {
        mode: 'controlled_text_redacted',
        sha256: hashRedactedRegionId(regionId),
      },
      warnings: [],
      blockers: [],
    }
    regionsByFrame.set(frameId, [...regionsByFrame.get(frameId) ?? [], normalized])
  }

  const frames: OcrCaptionRenderQaFrame[] = (input.safeZoneManifest.frameRecommendations ?? []).map((frame, index) => {
    const frameId = frame.frameId ?? `controlled_phase37d_private_frame_${String(index + 1).padStart(2, '0')}`
    return {
      frameId,
      offsetSeconds: frame.offsetSeconds ?? evidence.frameOffsetsSeconds[index],
      width: 1080,
      height: 1920,
      regions: regionsByFrame.get(frameId) ?? [],
    }
  })

  return {
    fixtureId: 'controlled-phase37d-sample',
    kind: 'controlled_phase37d_metadata',
    label: 'Controlled Phase 37D sample, private safe-zone metadata redacted',
    required: true,
    expectedStatus: evidence.ocrSummary.framesWithLowerThirdCollision === 0 ? 'passed' : 'manual_review',
    expectedLowerThirdCollision: evidence.ocrSummary.framesWithLowerThirdCollision > 0,
    frames: frames.length > 0 ? frames : buildOcrCaptionRenderQaControlledFixtureFromApprovedEvidence().frames,
    sourceArtifactRefs: [input.artifactPrefix],
    blockersExpected: [],
    warnings: [
      'Controlled real-media OCR text is redacted; only normalized boxes, counts, and hashed region ids are used.',
      ...evidence.warnings,
    ],
  }
}

function generatedFrame(frameId: string, regions: OcrCaptionRenderQaTextRegion[]): OcrCaptionRenderQaFrame {
  return {
    frameId,
    width: 1080,
    height: 1920,
    regions,
  }
}

function generatedRegion(
  fixtureId: string,
  frameId: string,
  regionId: string,
  box: OcrCaptionRenderQaBox,
  confidence: number,
  text: string,
): OcrCaptionRenderQaTextRegion {
  return {
    regionId,
    fixtureId,
    frameId,
    source: 'generated',
    box,
    confidence,
    text,
    textRedaction: {
      mode: 'synthetic_text_allowed',
      tokenCount: text.split(/\s+/).filter(Boolean).length,
    },
    warnings: [],
    blockers: [],
  }
}

function hashRedactedRegionId(value: string): string {
  return createHash('sha256').update(`phase37e:${value}`).digest('hex')
}
