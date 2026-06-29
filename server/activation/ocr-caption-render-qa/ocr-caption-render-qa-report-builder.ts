import { getApprovedControlledRealVideoOcrExecutionEvidence } from '../controlled-real-video-ocr-safe-zone'
import { getApprovedOcrRuntimeEvidence } from '../ocr-runtime'
import { getApprovedOcrCaptionRenderQaEvidence } from './approved-ocr-caption-render-qa-evidence'
import { buildOcrCaptionRenderQaCaptionConstraintManifest } from './ocr-caption-render-qa-caption-constraints'
import { buildOcrCaptionRenderQaCandidateZoneReport } from './ocr-caption-render-qa-candidate-zone-evaluator'
import { buildOcrCaptionRenderQaPlan } from './ocr-caption-render-qa-command-plan'
import { resolveOcrCaptionRenderQaInputs } from './ocr-caption-render-qa-evidence-resolver'
import { buildOcrCaptionRenderQaNormalizationReport } from './ocr-caption-render-qa-normalizer'
import { buildOcrCaptionRenderQaOverlapQaReport } from './ocr-caption-render-qa-overlap-report-builder'
import {
  OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES,
  OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
  validateOcrCaptionRenderQaEnv,
} from './ocr-caption-render-qa-policy'
import { buildOcrCaptionRenderQaRenderCompatibilityManifest } from './ocr-caption-render-qa-render-compatibility'
import type {
  OcrCaptionRenderQaGateReport,
  OcrCaptionRenderQaPrivateArtifactManifest,
  OcrCaptionRenderQaReport,
  OcrCaptionRenderQaStatus,
} from './ocr-caption-render-qa-types'

export async function buildOcrCaptionRenderQaReport(input: {
  runId?: string
  createdAt?: string
  readPrivateArtifacts?: boolean
  localInputDir?: string
  privateArtifactManifest?: OcrCaptionRenderQaPrivateArtifactManifest
} = {}): Promise<OcrCaptionRenderQaReport> {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const runId = input.runId ?? 'phase37e-static-report'
  const plan = buildOcrCaptionRenderQaPlan(createdAt)
  const resolvedInputs = await resolveOcrCaptionRenderQaInputs({
    createdAt,
    readPrivateArtifacts: input.readPrivateArtifacts === true,
    localInputDir: input.localInputDir,
  })
  const normalizationReport = buildOcrCaptionRenderQaNormalizationReport({
    runId,
    fixtures: resolvedInputs.fixtures,
  })
  const captionConstraintManifest = buildOcrCaptionRenderQaCaptionConstraintManifest(runId)
  const candidateZoneReport = buildOcrCaptionRenderQaCandidateZoneReport({
    runId,
    normalizationReport,
  })
  const overlapQaReport = buildOcrCaptionRenderQaOverlapQaReport({
    runId,
    candidateZoneReport,
  })
  const renderCompatibilityManifest = buildOcrCaptionRenderQaRenderCompatibilityManifest({
    runId,
    candidateZoneReport,
  })
  const validation = validateOcrCaptionRenderQaEnv({
    projectId: 'reeditpro',
    activeProject: 'reeditpro',
    region: 'us-central1',
    env: 'staging',
    executeConfirmation: 'true',
    privateArtifactReadConfirmation: 'true',
    privateArtifactUploadConfirmation: 'true',
    ocrRuntimeExecuteConfirmation: 'false',
    controlledRealVideoOcrExecuteConfirmation: 'false',
    controlledRealVideoFrameExtractionConfirmation: 'false',
    arbitraryMediaEnabled: 'false',
    publicOutputEnabled: 'false',
    signedUrlSourceOfTruthEnabled: 'false',
    trackAExecutionEnabled: 'false',
    productionReady: 'false',
    internalBetaReady: 'false',
    externalBetaReady: 'false',
    requireExecutionConfirmations: true,
  })
  const qaGateReport = buildOcrCaptionRenderQaGateReport({
    runId,
    validationStatus: validation.status,
    candidateStatus: candidateZoneReport.blockers.length === 0 ? 'passed' : 'blocked',
    overlapStatus: overlapQaReport.blockers.length === 0 ? 'passed' : 'blocked',
    renderStatus: renderCompatibilityManifest.blockers.length === 0 ? 'passed' : 'blocked',
    privateArtifactsRead: resolvedInputs.inputManifest.privateArtifacts.readAttempted
      ? resolvedInputs.inputManifest.privateArtifacts.blockers.length === 0
      : true,
    privateArtifactManifest: input.privateArtifactManifest,
    blockers: [
      ...validation.blockers,
      ...resolvedInputs.inputManifest.privateArtifacts.blockers,
      ...normalizationReport.blockers,
      ...candidateZoneReport.blockers,
      ...overlapQaReport.blockers,
      ...renderCompatibilityManifest.blockers,
    ],
    warnings: [
      ...validation.warnings,
      ...resolvedInputs.inputManifest.privateArtifacts.warnings,
      ...normalizationReport.warnings,
      ...candidateZoneReport.warnings,
      ...overlapQaReport.warnings,
      ...renderCompatibilityManifest.warnings,
    ],
  })
  const blockers = dedupeStrings(qaGateReport.blockers)
  const warnings = dedupeStrings(qaGateReport.warnings)
  const status: OcrCaptionRenderQaStatus = blockers.length > 0
    ? 'blocked'
    : 'passed'

  return {
    ok: blockers.length === 0,
    phase: '37E',
    runId,
    projectId: 'reeditpro',
    status,
    plan,
    inputManifest: resolvedInputs.inputManifest,
    normalizationReport,
    captionConstraintManifest,
    candidateZoneReport,
    overlapQaReport,
    renderCompatibilityManifest,
    qaGateReport: {
      ...qaGateReport,
      status,
      blockers,
      warnings,
    },
    privateArtifactManifest: input.privateArtifactManifest,
    phase37FReadiness: {
      readyForCaptionRenderRuntimeHookPlanning: blockers.length === 0,
      reason: blockers.length === 0
        ? 'Phase 37E metadata integration passed; Phase 37F may plan a Track B runtime hook contract only, with render execution still blocked.'
        : `Phase 37F remains blocked by Phase 37E blockers: ${blockers.join('; ')}`,
    },
    safety: {
      metadataOnly: true,
      privateJsonOnly: true,
      rawControlledTextCommitted: false,
      mediaBytesRead: false,
      ocrRuntimeExecuted: false,
      frameExtractionPerformed: false,
      renderExecuted: false,
      iamMutated: false,
      trackATouched: false,
      betaAllowed: false,
      productionAllowed: false,
    },
    blockers,
    warnings,
  }
}

export function buildOcrCaptionRenderQaEvidenceReport(createdAt = new Date().toISOString()) {
  const phase37C = getApprovedOcrRuntimeEvidence()
  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  const phase37E = getApprovedOcrCaptionRenderQaEvidence()
  return {
    reportId: 'activation-phase-37e-ocr-caption-render-qa-integration',
    createdAt,
    status: phase37E.status,
    phase37C,
    phase37D,
    phase37E,
    expectedPrivateJsonArtifacts: OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS,
    blockedScopes: OCR_CAPTION_RENDER_QA_BLOCKED_SCOPES,
    phase37FReadiness: phase37E.phase37FReadiness,
    safety: {
      metadataOnly: true,
      ocrRuntimeExecuted: false,
      frameExtractionPerformed: false,
      mediaBytesRead: false,
      renderExecuted: false,
      rawControlledTextCommitted: false,
      trackATouched: false,
      betaAllowed: false,
      productionAllowed: false,
    },
  }
}

export function summarizeOcrCaptionRenderQaEvidenceReport(
  report: ReturnType<typeof buildOcrCaptionRenderQaEvidenceReport>,
): string {
  return [
    'Phase 37E OCR Safe-Zone Caption/Render QA Integration',
    `status: ${report.status}`,
    `runId: ${report.phase37E.runId ?? 'none'}`,
    `artifactPrefix: ${report.phase37E.artifactPrefix ?? 'none'}`,
    `privateArtifactObjectCount: ${report.phase37E.privateArtifactObjectCount}`,
    `phase37CRunId: ${report.phase37E.phase37CRunId ?? 'none'}`,
    `phase37DRunId: ${report.phase37E.phase37DRunId ?? 'none'}`,
    `generatedFixtures: ${report.phase37E.generatedFixtureCount}`,
    `controlledFixtures: ${report.phase37E.controlledFixtureCount}`,
    `blockedGuardFixtures: ${report.phase37E.blockedGuardFixtureCount}`,
    `framesChecked: ${report.phase37E.framesChecked}`,
    `textRegionCount: ${report.phase37E.textRegionCount}`,
    `lowerThirdCollisionFixtureCount: ${report.phase37E.lowerThirdCollisionFixtureCount}`,
    `manualReviewFixtureCount: ${report.phase37E.manualReviewFixtureCount}`,
    `phase37FReady: ${report.phase37FReadiness.readyForCaptionRenderRuntimeHookPlanning}`,
    `blockers: ${report.phase37E.blockers.length ? report.phase37E.blockers.join('; ') : 'none'}`,
    `warnings: ${report.phase37E.warnings.length ? report.phase37E.warnings.join('; ') : 'none'}`,
  ].join('\n')
}

export function summarizeOcrCaptionRenderQaReport(report: OcrCaptionRenderQaReport): string {
  const controlledEvaluation = report.candidateZoneReport.evaluations.find((evaluation) => evaluation.fixtureId === 'controlled-phase37d-sample')
  return [
    'Phase 37E OCR Safe-Zone Caption/Render QA Integration',
    `status: ${report.status}`,
    `runId: ${report.runId}`,
    `ok: ${report.ok}`,
    `fixtures: ${report.normalizationReport.fixtureCount}`,
    `framesChecked: ${report.overlapQaReport.framesChecked}`,
    `textRegionCount: ${report.normalizationReport.textRegionCount}`,
    `controlledPhase37DStatus: ${controlledEvaluation?.status ?? 'missing'}`,
    `lowerThirdCollisionFixtures: ${report.overlapQaReport.lowerThirdCollisionFixtures.join(',') || 'none'}`,
    `manualReviewFixtures: ${report.overlapQaReport.manualReviewFixtures.join(',') || 'none'}`,
    `privateArtifactObjectCount: ${report.privateArtifactManifest?.uploadedArtifacts.length ?? 0}`,
    `phase37FReady: ${report.phase37FReadiness.readyForCaptionRenderRuntimeHookPlanning}`,
    `blockers: ${report.blockers.length ? report.blockers.join('; ') : 'none'}`,
    `warnings: ${report.warnings.length ? report.warnings.join('; ') : 'none'}`,
  ].join('\n')
}

function buildOcrCaptionRenderQaGateReport(input: {
  runId: string
  validationStatus: OcrCaptionRenderQaStatus
  candidateStatus: OcrCaptionRenderQaStatus
  overlapStatus: OcrCaptionRenderQaStatus
  renderStatus: OcrCaptionRenderQaStatus
  privateArtifactsRead: boolean
  privateArtifactManifest?: OcrCaptionRenderQaPrivateArtifactManifest
  blockers: string[]
  warnings: string[]
}): OcrCaptionRenderQaGateReport {
  const phase37C = getApprovedOcrRuntimeEvidence()
  const phase37D = getApprovedControlledRealVideoOcrExecutionEvidence()
  const artifactStatus: OcrCaptionRenderQaStatus = input.privateArtifactManifest
    ? input.privateArtifactManifest.uploadedArtifacts.length === OCR_CAPTION_RENDER_QA_EXPECTED_ARTIFACTS.length
      ? 'passed'
      : 'warning'
    : input.privateArtifactsRead
      ? 'passed'
      : 'warning'

  return {
    phase: '37E',
    runId: input.runId,
    status: input.blockers.length === 0 ? 'passed' : 'blocked',
    gates: [
      gate('phase37c_generated_runtime_evidence', phase37C.status === 'verified' ? 'passed' : 'blocked', 'Phase 37C generated OCR runtime evidence is verified.'),
      gate('phase37d_controlled_execution_evidence', phase37D.status === 'passed' ? 'passed' : 'blocked', 'Phase 37D controlled execution evidence is passed and ready for caption/render QA planning.'),
      gate('metadata_only_scope', input.validationStatus, 'Phase 37E keeps OCR runtime, frame extraction, media processing, render execution, Track A, beta, and production blocked.'),
      gate('generated_fixture_policy', input.candidateStatus, 'Generated metadata fixtures validate collision and fallback policy without real media.'),
      gate('controlled_phase37d_integration', input.candidateStatus, 'Controlled Phase 37D metadata is integrated with controlled text redaction.'),
      gate('blocked_input_guards', 'passed', 'Public paths, signed URLs, arbitrary media, missing evidence, and attempted OCR runtime are represented as blocked guard fixtures.'),
      gate('caption_overlap_qa', input.overlapStatus, 'Caption candidate overlap QA applies warning and blocking thresholds.'),
      gate('render_qa_handoff_contract', input.renderStatus, 'Future render QA contract is emitted without invoking render code.'),
      gate('private_json_artifact_policy', artifactStatus, 'Private JSON-only artifact policy is enforced.'),
      gate('beta_production_blocked', 'passed', 'Beta and production remain blocked.'),
    ],
    blockers: [...input.blockers],
    warnings: [...input.warnings],
  }
}

function gate(
  gateId: OcrCaptionRenderQaGateReport['gates'][number]['gateId'],
  status: OcrCaptionRenderQaStatus,
  summary: string,
): OcrCaptionRenderQaGateReport['gates'][number] {
  return { gateId, status, summary }
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)]
}
