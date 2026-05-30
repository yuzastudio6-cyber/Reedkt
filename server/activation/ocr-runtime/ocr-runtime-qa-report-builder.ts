import { ocrGeneratedFixtureSpecs } from './ocr-generated-fixture-registry'
import { ocrRuntimeConfig } from './ocr-runtime-policy'
import type {
  OcrFixtureRuntimeResult,
  OcrRuntimeQaGate,
  OcrRuntimeQaStatus,
  OcrSafeZoneReport,
  OcrTextMatchReport,
} from './ocr-runtime-types'

export function buildOcrTextMatchReport(input: {
  runId: string
  fixtures: OcrFixtureRuntimeResult[]
}): OcrTextMatchReport {
  const blockers: string[] = []
  const warnings: string[] = []
  for (const fixture of input.fixtures) {
    const spec = ocrGeneratedFixtureSpecs.find((candidate) => candidate.fixtureId === fixture.fixtureId)
    if (!spec) {
      blockers.push(`Unknown OCR fixture result: ${fixture.fixtureId}`)
      continue
    }
    if (spec.riskCategory === 'required_pass') {
      if (fixture.tokenRecall < ocrRuntimeConfig.requiredTokenRecallThreshold) {
        blockers.push(`${fixture.fixtureId} token recall ${fixture.tokenRecall.toFixed(3)} is below ${ocrRuntimeConfig.requiredTokenRecallThreshold}.`)
      }
      if (fixture.averageConfidence !== undefined && fixture.averageConfidence < ocrRuntimeConfig.requiredAverageConfidenceThreshold) {
        blockers.push(`${fixture.fixtureId} average OCR confidence ${fixture.averageConfidence.toFixed(3)} is below ${ocrRuntimeConfig.requiredAverageConfidenceThreshold}.`)
      }
    } else if (fixture.missingCriticalTokens.length > 0) {
      warnings.push(`${fixture.fixtureId} warning fixture missed critical tokens: ${fixture.missingCriticalTokens.join(', ')}.`)
    }
  }

  return {
    phase: '37C',
    runId: input.runId,
    requiredTokenRecallThreshold: ocrRuntimeConfig.requiredTokenRecallThreshold,
    requiredAverageConfidenceThreshold: ocrRuntimeConfig.requiredAverageConfidenceThreshold,
    fixtureResults: input.fixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      status: fixture.status,
      tokenRecall: fixture.tokenRecall,
      averageConfidence: fixture.averageConfidence,
      matchedCriticalTokens: [...fixture.matchedCriticalTokens],
      missingCriticalTokens: [...fixture.missingCriticalTokens],
    })),
    blockers,
    warnings,
  }
}

export function buildOcrSafeZoneReport(input: {
  runId: string
  fixtures: OcrFixtureRuntimeResult[]
}): OcrSafeZoneReport {
  const blockers: string[] = []
  const warnings: string[] = []
  const captionFixture = input.fixtures.find((fixture) => fixture.fixtureId === 'caption-safe-zone-conflict')
  if (!captionFixture) blockers.push('caption-safe-zone-conflict result is missing.')
  else if (!captionFixture.safeZoneCollision) blockers.push('caption-safe-zone-conflict did not detect OCR text intersecting the expected lower caption conflict zone.')
  for (const fixture of input.fixtures) {
    const spec = ocrGeneratedFixtureSpecs.find((candidate) => candidate.fixtureId === fixture.fixtureId)
    if (!spec) continue
    if (spec.riskCategory === 'required_pass') {
      const requiredRegions = spec.expectedRegions.filter((region) => region.required)
      const missingRegions = requiredRegions.filter((region) => !fixture.matchedRegionIds.includes(region.regionId))
      if (missingRegions.length > 0) blockers.push(`${fixture.fixtureId} missed required OCR regions: ${missingRegions.map((region) => region.regionId).join(', ')}.`)
    } else if (fixture.matchedRegionIds.length === 0) {
      warnings.push(`${fixture.fixtureId} warning fixture had no broad-region OCR match.`)
    }
  }
  return {
    phase: '37C',
    runId: input.runId,
    fixtureResults: input.fixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      matchedRegionIds: [...fixture.matchedRegionIds],
      safeZoneCollision: fixture.safeZoneCollision,
      status: fixture.status,
    })),
    blockers,
    warnings,
  }
}

export function buildOcrRuntimeQa(input: {
  modelVerified: boolean
  extractionOk: boolean
  runtimeOk: boolean
  localModelPathsUsed: boolean
  networkBlocked: boolean
  runtimeModelAutoDownloadBlocked: boolean
  artifactCount: number
  fixtures: OcrFixtureRuntimeResult[]
  textMatchReport: OcrTextMatchReport
  safeZoneReport: OcrSafeZoneReport
}): { status: OcrRuntimeQaStatus; gates: OcrRuntimeQaGate[]; blockers: string[]; warnings: string[] } {
  const blockers = [
    ...input.textMatchReport.blockers,
    ...input.safeZoneReport.blockers,
    ...input.fixtures.flatMap((fixture) => fixture.blockers),
  ]
  const warnings = [
    ...input.textMatchReport.warnings,
    ...input.safeZoneReport.warnings,
    ...input.fixtures.flatMap((fixture) => fixture.warnings),
  ]
  if (!input.modelVerified) blockers.push('Phase 37B OCR model assets were not verified.')
  if (!input.extractionOk) blockers.push('OCR model archives were not safely extracted.')
  if (!input.runtimeOk) blockers.push('PaddleOCR local runtime execution did not complete.')
  if (!input.localModelPathsUsed) blockers.push('PaddleOCR did not report explicit local model path usage.')
  if (!input.runtimeModelAutoDownloadBlocked) blockers.push('PaddleOCR runtime model auto-download guard was not active.')
  if (!input.networkBlocked) blockers.push('PaddleOCR runtime network guard was not active.')
  if (input.artifactCount <= 0) blockers.push('No Phase 37C generated OCR runtime artifacts were written.')

  const gate = (gateId: OcrRuntimeQaGate['gateId'], ok: boolean, summary: string): OcrRuntimeQaGate => ({
    gateId,
    status: ok ? 'passed' : 'blocked',
    summary,
  })

  const gates: OcrRuntimeQaGate[] = [
    gate('phase37b_model_assets', input.modelVerified, 'Uses only verified private Phase 37B PP-OCRv5 det/rec/dict assets.'),
    gate('checksum_verification', input.modelVerified, 'SHA-256 checksums are computed locally and matched against Phase 37B evidence.'),
    gate('model_extraction', input.extractionOk, 'Tar entries were checked for unsafe paths before extraction.'),
    gate('runtime_integrity', input.runtimeOk && input.localModelPathsUsed && input.runtimeModelAutoDownloadBlocked && input.networkBlocked, 'PaddleOCR CPU runtime used local model paths with runtime download/network guards.'),
    gate('generated_fixture_integrity', input.fixtures.every((fixture) => fixture.generatedOnly), 'All OCR inputs are deterministic generated fixtures.'),
    gate('ocr_text_match', input.textMatchReport.blockers.length === 0, 'Required fixture critical token recall and confidence thresholds passed.'),
    gate('caption_safe_zone_collision', input.safeZoneReport.blockers.length === 0, 'Caption safe-zone conflict fixture produced the expected OCR collision.'),
    gate('artifact_privacy', input.artifactCount > 0, 'Artifacts are generated reports/fixtures only and are scoped for private QA artifact upload.'),
    gate('blocked_features', true, 'Real media, providers, public output, beta, production, Cloud Run, GPU, Docker push, and Track A remain blocked.'),
  ]

  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers,
    warnings,
  }
}
