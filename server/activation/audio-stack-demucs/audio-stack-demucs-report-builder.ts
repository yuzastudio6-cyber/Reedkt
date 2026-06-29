import { getApprovedAudioStackDemucsEvidence } from './approved-audio-stack-demucs-evidence'
import { buildAudioStackDemucsCommandPlans } from './audio-stack-demucs-command-plan'
import { buildAudioStackDemucsIamPlan } from './audio-stack-demucs-iam-plan'
import { audioStackDemucsConfig } from './audio-stack-demucs-policy'
import { buildAudioStackDemucsQaGates } from './audio-stack-demucs-qa-summary'
import { buildAudioStackToolRoutingDecision } from './audio-stack-tool-routing'
import { buildDemucsLicenseReview, buildDemucsSourceEvidence, demucsEvidenceBlockers } from './demucs-source-evidence'
import type { AudioStackDemucsReport } from './audio-stack-demucs-types'

export function buildAudioStackDemucsReport(): AudioStackDemucsReport {
  const approvedEvidence = getApprovedAudioStackDemucsEvidence()
  const sourceEvidence = buildDemucsSourceEvidence()
  const blockers = Array.from(new Set([
    ...approvedEvidence.blockers,
    ...demucsEvidenceBlockers(sourceEvidence),
  ]))

  return {
    reportId: 'activation-phase-36g-audio-stack-demucs',
    createdAt: new Date().toISOString(),
    config: audioStackDemucsConfig,
    toolRouting: buildAudioStackToolRoutingDecision(),
    sourceEvidence,
    licenseReview: buildDemucsLicenseReview(),
    iamPlan: buildAudioStackDemucsIamPlan(),
    commandPlans: buildAudioStackDemucsCommandPlans(),
    qaGates: buildAudioStackDemucsQaGates(),
    approvedEvidence,
    status: 'closed_with_demucs_blocked',
    blockers,
    warnings: Array.from(new Set(approvedEvidence.warnings)),
    deepFilterNetSpeechCleanupAllowed: true,
    rnnoiseActiveProductFlowAllowed: false,
    demucsDownloadAllowed: false,
    demucsRuntimeAllowed: false,
    demucsInternalBetaAllowed: false,
    arbitraryRealUserMediaAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
    phase37AReadiness: approvedEvidence.phase37AReadiness,
  }
}

export function summarizeAudioStackDemucsReport(report: AudioStackDemucsReport): string {
  return [
    `Audio stack Demucs report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId}`,
    `DeepFilterNet speech cleanup allowed: ${report.deepFilterNetSpeechCleanupAllowed}`,
    `RNNoise active product flow allowed: ${report.rnnoiseActiveProductFlowAllowed}`,
    `Demucs download allowed: ${report.demucsDownloadAllowed}`,
    `Demucs runtime allowed: ${report.demucsRuntimeAllowed}`,
    `Demucs internal beta allowed: ${report.demucsInternalBetaAllowed}`,
    `Phase 37A OCR approval ready: ${report.phase37AReadiness.readyForOcrApprovalWorkflow}`,
    '',
    'Tool routing:',
    ...report.toolRouting.map((tool) => `- ${tool.toolId}: ${tool.productStatus} - ${tool.decision}`),
    '',
    'Demucs evidence:',
    ...report.sourceEvidence.map((entry) => `- ${entry.sourceId}: ${entry.status} - ${entry.evidenceSummary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
