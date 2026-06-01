import { buildOcrCaptionRenderQaCaptionConstraintManifest } from './ocr-caption-render-qa-caption-constraints'
import { boxArea, intersectionArea, paddedBox } from './ocr-caption-render-qa-normalizer'
import { ocrCaptionRenderQaConfig } from './ocr-caption-render-qa-policy'
import type {
  OcrCaptionRenderQaCandidateZoneReport,
  OcrCaptionRenderQaCaptionZone,
  OcrCaptionRenderQaFixtureEvaluation,
  OcrCaptionRenderQaFrame,
  OcrCaptionRenderQaFrameRecommendation,
  OcrCaptionRenderQaNormalizationReport,
  OcrCaptionRenderQaOverlapEntry,
  OcrCaptionRenderQaStatus,
  OcrCaptionRenderQaZoneId,
} from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaCandidateZoneReport(input: {
  runId: string
  normalizationReport: OcrCaptionRenderQaNormalizationReport
}): OcrCaptionRenderQaCandidateZoneReport {
  const constraintManifest = buildOcrCaptionRenderQaCaptionConstraintManifest(input.runId)
  const evaluations = input.normalizationReport.normalizedFixtures.map((fixture): OcrCaptionRenderQaFixtureEvaluation => {
    if (fixture.kind === 'blocked_guard') {
      return {
        fixtureId: fixture.fixtureId,
        kind: fixture.kind,
        expectedStatus: fixture.expectedStatus,
        expectedLowerThirdCollision: fixture.expectedLowerThirdCollision,
        status: 'blocked',
        framesChecked: 0,
        textRegionCount: 0,
        lowerThirdCollisionFrames: 0,
        recommendedZoneIds: [],
        recommendations: [],
        blockersExpected: [...fixture.blockersExpected],
        blockers: [...fixture.blockersExpected],
        warnings: [],
      }
    }

    const recommendations = fixture.frames.map((frame) => evaluateFrame({
      fixtureId: fixture.fixtureId,
      frame,
      candidateZones: constraintManifest.candidateZones,
    }))
    const lowerThirdCollisionFrames = recommendations.filter((recommendation) => recommendation.lowerThirdCollisionDetected).length
    const manualReview = recommendations.some((recommendation) => recommendation.status === 'manual_review')
    const blocked = recommendations.some((recommendation) => recommendation.status === 'blocked')
    const warnings = [
      ...fixture.warnings,
      ...recommendations.flatMap((recommendation) => recommendation.warnings),
    ]
    const blockers = recommendations.flatMap((recommendation) => recommendation.blockers)
    const expectedCollisionMet = lowerThirdCollisionFrames > 0 === fixture.expectedLowerThirdCollision
    if (!expectedCollisionMet) blockers.push(`Fixture ${fixture.fixtureId} did not match expected lower-third collision state.`)
    const status = blocked || blockers.length > 0
      ? 'blocked'
      : manualReview
        ? 'manual_review'
        : warnings.length > 0 && fixture.expectedStatus === 'warning'
          ? 'warning'
          : 'passed'

    return {
      fixtureId: fixture.fixtureId,
      kind: fixture.kind,
      expectedStatus: fixture.expectedStatus,
      expectedLowerThirdCollision: fixture.expectedLowerThirdCollision,
      status,
      framesChecked: fixture.frames.length,
      textRegionCount: fixture.frames.reduce((count, frame) => count + frame.regions.length, 0),
      lowerThirdCollisionFrames,
      recommendedZoneIds: recommendations
        .map((recommendation) => recommendation.recommendedZoneId)
        .filter((zoneId): zoneId is OcrCaptionRenderQaZoneId => Boolean(zoneId)),
      recommendations,
      blockersExpected: [...fixture.blockersExpected],
      blockers,
      warnings,
    }
  })

  const candidateZoneCoverage = constraintManifest.candidateZones.map((zone) => {
    const frameRecommendations = evaluations.flatMap((evaluation) => evaluation.recommendations)
    return {
      zoneId: zone.zoneId,
      recommendedFrameCount: frameRecommendations.filter((recommendation) => recommendation.recommendedZoneId === zone.zoneId).length,
      blockedFrameCount: frameRecommendations.filter((recommendation) => recommendation.overlapEntries.some((entry) => entry.zoneId === zone.zoneId && entry.status === 'blocked')).length,
      warningFrameCount: frameRecommendations.filter((recommendation) => recommendation.overlapEntries.some((entry) => entry.zoneId === zone.zoneId && entry.status === 'warning')).length,
    }
  })
  const blockers = [
    ...input.normalizationReport.blockers,
    ...evaluations
      .filter((evaluation) => evaluation.kind !== 'blocked_guard')
      .flatMap((evaluation) => evaluation.blockers),
  ]
  const warnings = [
    ...input.normalizationReport.warnings,
    ...evaluations
      .filter((evaluation) => evaluation.kind !== 'blocked_guard')
      .flatMap((evaluation) => evaluation.warnings),
  ]

  return {
    phase: '37E',
    runId: input.runId,
    evaluations,
    candidateZoneCoverage,
    blockers,
    warnings,
  }
}

function evaluateFrame(input: {
  fixtureId: string
  frame: OcrCaptionRenderQaFrame
  candidateZones: OcrCaptionRenderQaCaptionZone[]
}): OcrCaptionRenderQaFrameRecommendation {
  const overlapEntries = input.candidateZones.map((zone) => evaluateZone(input.frame, zone))
  const lowerThird = overlapEntries.find((entry) => entry.zoneId === 'lower_third_default')
  const safeZone = overlapEntries.find((entry) => entry.status === 'passed')
  const allRisky = overlapEntries.every((entry) => entry.status !== 'passed')
  const warnings = input.frame.regions.flatMap((region) => region.warnings)
  const blockers = input.frame.regions.flatMap((region) => region.blockers)
  if (allRisky) warnings.push('All Phase 37E caption candidate zones overlap OCR text regions; manual caption layout review is required.')
  const status: OcrCaptionRenderQaStatus = blockers.length > 0
    ? 'blocked'
    : allRisky
      ? 'manual_review'
      : overlapEntries.some((entry) => entry.status === 'warning')
        ? 'warning'
        : 'passed'

  return {
    fixtureId: input.fixtureId,
    frameId: input.frame.frameId,
    recommendedZoneId: safeZone?.zoneId,
    lowerThirdCollisionDetected: Boolean(lowerThird && lowerThird.status !== 'passed'),
    status,
    overlapEntries,
    avoidRegions: input.frame.regions.map((region) => ({
      avoidRegionId: `avoid_${region.regionId}`,
      sourceRegionId: region.regionId,
      ...paddedBox(region.box, ocrCaptionRenderQaConfig.padding),
      padding: ocrCaptionRenderQaConfig.padding,
    })),
    warnings,
    blockers,
  }
}

function evaluateZone(frame: OcrCaptionRenderQaFrame, zone: OcrCaptionRenderQaCaptionZone): OcrCaptionRenderQaOverlapEntry {
  const zoneArea = boxArea(zone)
  const overlaps = frame.regions
    .map((region) => {
      const overlapArea = intersectionArea(paddedBox(region.box, ocrCaptionRenderQaConfig.padding), zone)
      return {
        regionId: region.regionId,
        overlapRatio: zoneArea > 0 ? overlapArea / zoneArea : 0,
      }
    })
    .filter((overlap) => overlap.overlapRatio > 0)
  const maxOverlapRatio = overlaps.reduce((max, overlap) => Math.max(max, overlap.overlapRatio), 0)
  const status: OcrCaptionRenderQaStatus = maxOverlapRatio >= ocrCaptionRenderQaConfig.blockingOverlapRatio
    ? 'blocked'
    : maxOverlapRatio >= ocrCaptionRenderQaConfig.warningOverlapRatio
      ? 'warning'
      : 'passed'
  return {
    fixtureId: frame.regions[0]?.fixtureId ?? 'empty-frame',
    frameId: frame.frameId,
    zoneId: zone.zoneId,
    maxOverlapRatio: Number(maxOverlapRatio.toFixed(4)),
    overlappingRegionIds: overlaps.map((overlap) => overlap.regionId),
    status,
  }
}
