import type {
  OcrCaptionRenderQaCandidateZoneReport,
  OcrCaptionRenderQaOverlapQaReport,
} from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaOverlapQaReport(input: {
  runId: string
  candidateZoneReport: OcrCaptionRenderQaCandidateZoneReport
}): OcrCaptionRenderQaOverlapQaReport {
  const evaluations = input.candidateZoneReport.evaluations
  const blockedGuardFixturesPassed = evaluations
    .filter((evaluation) => evaluation.kind === 'blocked_guard' && evaluation.status === 'blocked' && evaluation.blockersExpected.length > 0)
    .map((evaluation) => evaluation.fixtureId)
  const blockers = [
    ...input.candidateZoneReport.blockers,
  ]
  const warnings = [
    ...input.candidateZoneReport.warnings,
  ]
  const lowerThirdCollisionFixtures = evaluations
    .filter((evaluation) => evaluation.lowerThirdCollisionFrames > 0)
    .map((evaluation) => evaluation.fixtureId)
  const manualReviewFixtures = evaluations
    .filter((evaluation) => evaluation.status === 'manual_review')
    .map((evaluation) => evaluation.fixtureId)

  for (const evaluation of evaluations) {
    if (evaluation.kind === 'blocked_guard' && evaluation.status !== 'blocked') {
      blockers.push(`Blocked guard fixture ${evaluation.fixtureId} did not block as expected.`)
    }
    if (evaluation.kind !== 'blocked_guard' && evaluation.expectedStatus === 'manual_review' && evaluation.status !== 'manual_review') {
      blockers.push(`Fixture ${evaluation.fixtureId} did not require manual review as expected.`)
    }
    if (evaluation.kind !== 'blocked_guard' && evaluation.expectedStatus === 'passed' && evaluation.status !== 'passed') {
      blockers.push(`Fixture ${evaluation.fixtureId} did not pass as expected.`)
    }
  }

  return {
    phase: '37E',
    runId: input.runId,
    framesChecked: evaluations.reduce((count, evaluation) => count + evaluation.framesChecked, 0),
    fixturesChecked: evaluations.length,
    lowerThirdCollisionFixtures,
    manualReviewFixtures,
    blockedGuardFixturesPassed,
    blockers,
    warnings,
  }
}
