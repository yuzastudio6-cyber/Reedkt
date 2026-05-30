import { ocrModelCandidates } from './ocr-model-candidate-registry'
import { ocrModelLicenseEvidence } from './ocr-model-license-evidence'
import { ocrModelApprovalPolicy, phase37ABlockedExecutionScopes } from './ocr-model-approval-policy'
import { buildOcrModelStoragePlan } from './ocr-model-storage-plan'
import { buildOcrModelDownloadCommandPlan } from './ocr-model-download-command-plan'
import { buildOcrRuntimeImagePlan } from './ocr-runtime-image-plan'
import { buildOcrModelManifests } from './ocr-model-manifest-writer'
import { ocrModelApprovalBlockers, ocrModelApprovalWarnings } from './ocr-model-approval-blocker-policy'
import type { OcrModelApprovalReport } from './ocr-model-approval-types'

export function buildOcrModelApprovalReport(): OcrModelApprovalReport {
  const storagePlan = buildOcrModelStoragePlan()
  const downloadCommandPlan = buildOcrModelDownloadCommandPlan(storagePlan)
  const runtimeImagePlan = buildOcrRuntimeImagePlan()
  const manifests = buildOcrModelManifests(storagePlan)
  return {
    phase: '37A',
    reportId: 'activation-phase-37a-paddleocr-model-runtime-approval',
    createdAt: new Date().toISOString(),
    status: 'staging_planning_approved',
    approvedPlanningScopes: [
      ocrModelApprovalPolicy.approvedPlanningScope,
      'generated_ui_text_frame_ocr_planning',
      'caption_safe_zone_metadata_planning',
      'text_ui_region_detection_planning',
      'private_artifact_output_planning',
    ],
    blockedExecutionScopes: phase37ABlockedExecutionScopes,
    toolEvidenceSummary: ocrModelCandidates.filter((candidate) => candidate.candidateId === 'paddleocr'),
    licenseEvidence: ocrModelLicenseEvidence,
    runtimeEvidenceSummary: ocrModelCandidates.filter((candidate) => candidate.candidateId === 'paddlepaddle'),
    modelFamilySummary: ocrModelCandidates.filter((candidate) => candidate.candidateId === 'pp_ocrv5'),
    storagePlan,
    downloadCommandPlan,
    runtimeImagePlan,
    manifests,
    blockers: ocrModelApprovalBlockers,
    warnings: ocrModelApprovalWarnings,
    phase37BReadiness: {
      ready: true,
      nextPhase: 'Phase 37B exact OCR asset selection/download planning',
      status: 'ready_for_exact_asset_selection',
      blockers: ['Model download remains blocked until exact official PP-OCRv5 asset URLs and versions are selected.'],
      criteria: [
        'PaddleOCR/PaddlePaddle evidence exists.',
        'Private storage plan exists.',
        'Text-only download plan exists.',
        'No model files were downloaded in Phase 37A.',
        'All OCR execution remains blocked.',
      ],
    },
    phase37CReadiness: {
      ready: false,
      nextPhase: 'Phase 37C generated OCR runtime verification',
      status: 'blocked_until_phase37b_assets',
      blockers: ['Exact OCR assets are not downloaded/checksummed yet.', 'OCR runtime image is not built yet.', 'Runtime no-auto-download behavior is not proven yet.'],
      criteria: ['Phase 37B must select/download/checksum exact assets or prove pinned no-runtime-download packaging.'],
    },
    phase37DReadiness: {
      ready: false,
      nextPhase: 'Phase 37D controlled real-video OCR safe-zone analysis',
      status: 'blocked_until_phase37c_runtime',
      blockers: ['Generated OCR runtime verification has not passed.', 'Real-video OCR remains blocked.'],
      criteria: ['Phase 37C must pass generated UI/text OCR runtime verification with private artifacts.'],
    },
    ocrExecutionAllowed: false,
    ocrModelDownloadAllowed: false,
    runtimeAutoDownloadAllowed: false,
    realMediaOcrAllowed: false,
    realVideoOcrAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    publicOutputAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeOcrModelApprovalReport(report: OcrModelApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Status: ${report.status}`,
    `PaddleOCR planning approved: ${report.toolEvidenceSummary.some((candidate) => candidate.candidateId === 'paddleocr')}`,
    `PaddlePaddle runtime planning exists: ${report.runtimeEvidenceSummary.some((candidate) => candidate.candidateId === 'paddlepaddle')}`,
    `PP-OCRv5 model family deferred: ${report.modelFamilySummary[0]?.downloadStatus ?? 'missing'}`,
    `Storage path: ${report.storagePlan.baseStagingPath}`,
    `Download commands: text-only (${report.downloadCommandPlan.length})`,
    `Runtime image plan: ${report.runtimeImagePlan.imagePlanId}`,
    `CPU first: ${report.runtimeImagePlan.cpuFirst}`,
    `OCR execution allowed: ${report.ocrExecutionAllowed}`,
    `OCR model download allowed: ${report.ocrModelDownloadAllowed}`,
    `Runtime auto-download allowed: ${report.runtimeAutoDownloadAllowed}`,
    `Real media OCR allowed: ${report.realMediaOcrAllowed}`,
    `Real video OCR allowed: ${report.realVideoOcrAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Public output allowed: ${report.publicOutputAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Phase 37B ready: ${report.phase37BReadiness.ready}`,
    `Phase 37B status: ${report.phase37BReadiness.status}`,
    `Phase 37C ready: ${report.phase37CReadiness.ready}`,
    `Phase 37D ready: ${report.phase37DReadiness.ready}`,
    '',
    'Manifests:',
    ...report.manifests.map((manifest) => `- ${manifest.manifestId}: ${manifest.checksum}`),
    '',
    'Blockers:',
    ...report.blockers.map((blocker) => `- ${blocker}`),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}

export function buildOcrModelApprovalPlanText(): string {
  const report = buildOcrModelApprovalReport()
  return [
    'Phase 37A PaddleOCR model/runtime approval plan',
    `Approved planning scope: ${report.approvedPlanningScopes.join(', ')}`,
    `Private storage base: ${report.storagePlan.baseStagingPath}`,
    'Future sequence: Phase 37B exact asset selection/download, Phase 37C generated OCR runtime verification, Phase 37D controlled real-video OCR safe-zone, Phase 37E caption/render QA integration.',
    'Phase 37A does not download models, run OCR, process media, build Docker images, mutate GCP, call providers, or create public output.',
    '',
    'Text-only future commands:',
    ...report.downloadCommandPlan.map((plan) => `- ${plan.commandId}: ${plan.commandText}`),
  ].join('\n')
}

export function buildOcrModelWeightSummary(): string {
  const report = buildOcrModelApprovalReport()
  return [
    'OCR model weight summary',
    `Approved staging manifests: ${report.manifests.length}`,
    ...report.manifests.map((manifest) => `- ${manifest.manifestId}: ${manifest.checksum}`),
    '',
    `Storage path: ${report.storagePlan.baseStagingPath}`,
    `Detection path: ${report.storagePlan.detectionModelPath}`,
    `Recognition path: ${report.storagePlan.recognitionModelPath}`,
    `Classifier path: ${report.storagePlan.classifierModelPath}`,
    'Checksum: missing_until_download',
    `Download plan: text-only (${report.downloadCommandPlan.length} commands)`,
    `OCR model download allowed: ${report.ocrModelDownloadAllowed}`,
    `OCR execution allowed: ${report.ocrExecutionAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
  ].join('\n')
}
