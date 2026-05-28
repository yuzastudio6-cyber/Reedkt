import { listModelApprovalCandidates } from './model-candidate-registry'
import { evaluateModelApprovalPolicy, productionApprovalBlockers } from './model-approval-policy'
import { listModelLicenseEvidence } from './model-license-evidence'
import { buildFasterWhisperTinyStoragePlan } from './model-storage-plan'
import { buildModelDownloadCommandPlan } from './model-download-command-plan'
import { buildModelApprovalBlockers } from './model-approval-blocker-policy'
import { buildBlockedModelWeightManifests, buildModelWeightManifest } from './model-manifest-writer'
import { getApprovedModelDownloadEvidence } from '../model-download/approved-model-download-evidence'
import {
  isSpeechRuntimeExecutionVerified,
  readSpeechRuntimeExecutionReport,
  SPEECH_RUNTIME_LOCAL_REPORT_PATH,
} from '../speech-runtime/speech-runtime-report-builder'
import type { ModelApprovalReport } from './model-approval-types'

export const MODEL_APPROVAL_REPORT_ID = 'activation-phase-26-model-license-approval'

export function buildModelApprovalReport(): ModelApprovalReport {
  const candidates = listModelApprovalCandidates()
  const evidenceSummary = listModelLicenseEvidence()
  const downloadEvidence = getApprovedModelDownloadEvidence()
  const downloadVerified = downloadEvidence.status === 'verified'
  const speechRuntimeVerified = isSpeechRuntimeExecutionVerified(readSpeechRuntimeExecutionReport(SPEECH_RUNTIME_LOCAL_REPORT_PATH))
  const storagePlan = buildFasterWhisperTinyStoragePlan()
  const downloadCommandPlan = buildModelDownloadCommandPlan(storagePlan)
  const decisions = candidates.map((candidate) => evaluateModelApprovalPolicy({
    candidate,
    evidence: evidenceSummary.filter((evidence) => evidence.modelCandidateId === candidate.candidateId),
    storagePlan,
  }))
  const tinyCandidate = candidates.find((candidate) => candidate.candidateId === 'systran_faster_whisper_tiny')
  const tinyManifest = tinyCandidate ? buildModelWeightManifest(tinyCandidate) : undefined
  const approvedModels = tinyManifest?.reviewStatus === 'staging_approved' ? [tinyManifest] : []
  const blockedModels = buildBlockedModelWeightManifests(candidates)
  const evaluatedOnlyModels = candidates.filter((candidate) => candidate.status === 'evaluated_only' || candidate.status === 'candidate' || candidate.status === 'upstream_evidence')
  const blockerEvaluation = buildModelApprovalBlockers({
    decisions,
    approvedManifest: approvedModels[0],
    storagePlan,
    downloadCommandPlan,
  })
  const warnings = [
    ...blockerEvaluation.warnings,
    ...productionApprovalBlockers(),
    speechRuntimeVerified
      ? 'Phase 27A CPU speech runtime verification passed with private-GCS model sync and generated audio only.'
      : downloadVerified
      ? 'Phase 26B model storage evidence exists, but runtime loading/transcription is still unverified.'
      : 'Actual model weights are not downloaded or available in runtime path during Phase 26.',
    speechRuntimeVerified
      ? 'Phase 28 can proceed only as an explicit controlled speech/caption real-video phase; broad real user media testing remains blocked.'
      : downloadVerified
      ? 'Phase 28 execution remains blocked until a speech runtime image/job is deployed and verified.'
      : 'Phase 28 execution remains blocked until explicit model availability evidence exists.',
  ]

  return {
    reportId: MODEL_APPROVAL_REPORT_ID,
    createdAt: new Date().toISOString(),
    approvedModels,
    blockedModels,
    evaluatedOnlyModels,
    evidenceSummary,
    storagePlan,
    downloadCommandPlan,
    blockers: blockerEvaluation.blockers,
    warnings: Array.from(new Set(warnings)),
    phase27Readiness: {
      readyForGpuDeploy: false,
      optionalForTinySpeechCaption: true,
      blockers: ['GPU staging/deploy is not approved or required by Phase 26.'],
      warnings: ['Tiny faster-whisper staging test may proceed through non-GPU/CPU planning if runtime availability is provided later.'],
    },
    phase28Readiness: {
      readyForPlanning: approvedModels.length === 1 && blockerEvaluation.blockers.length === 0,
      readyForExecution: speechRuntimeVerified && approvedModels.length === 1 && blockerEvaluation.blockers.length === 0,
      blockers: speechRuntimeVerified
        ? []
        : downloadVerified
        ? [
            'Speech runtime image/job loading for the approved tiny model is not verified.',
            'Phase 28 real-video execution requires a separate explicit approval and generated scope.',
          ]
        : [
            'Actual model weights are missing from approved runtime/storage path until a later explicit download/load phase.',
            'Phase 28 real-video execution requires a separate explicit approval and generated scope.',
          ],
      warnings: ['Planning is limited to speech/caption only with Systran/faster-whisper-tiny.'],
    },
    modelDownloadExecuted: downloadEvidence.status !== 'not_started',
    providerExecuted: false,
    gpuDeployed: false,
    realUserMediaProcessed: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeModelApprovalReport(report: ModelApprovalReport): string {
  return [
    `Model approval report: ${report.reportId}`,
    `Approved models: ${report.approvedModels.length}`,
    `Blocked models: ${report.blockedModels.length}`,
    `Evaluated-only candidates: ${report.evaluatedOnlyModels.length}`,
    `Evidence records: ${report.evidenceSummary.length}`,
    `Download commands: ${report.downloadCommandPlan.length} (text-only)`,
    `Blockers: ${report.blockers.length}`,
    `Phase 27 GPU deploy ready: ${report.phase27Readiness.readyForGpuDeploy}`,
    `Phase 28 planning ready: ${report.phase28Readiness.readyForPlanning}`,
    `Phase 28 execution ready: ${report.phase28Readiness.readyForExecution}`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Approved:',
    ...(report.approvedModels.length
      ? report.approvedModels.map((model) => `- ${model.modelWeightManifestId}: ${model.modelName} (${model.reviewStatus})`)
      : ['- none']),
    '',
    'Blocked:',
    ...(report.blockedModels.length
      ? report.blockedModels.map((model) => `- ${model.modelWeightManifestId}: ${model.modelName}`)
      : ['- none']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
