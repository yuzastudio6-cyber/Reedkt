import { getApprovedAudioSystemReadinessEvidence } from './approved-audio-system-readiness-evidence'
import { buildAudioSystemBetaScopeManifest } from './audio-system-beta-scope'
import { buildAudioSystemReadinessCommandPlans } from './audio-system-command-plan'
import { buildAudioSystemEvidenceChain, audioSystemEvidenceChainBlockers } from './audio-system-evidence-resolver'
import { buildAudioSystemReadinessIamPlan } from './audio-system-iam-plan'
import { audioSystemReadinessConfig } from './audio-system-readiness-policy'
import { audioSystemRiskRegister } from './audio-system-risk-register'
import type { AudioSystemReadinessReport } from './audio-system-readiness-types'

export function buildAudioSystemReadinessReport(): AudioSystemReadinessReport {
  const approvedEvidence = getApprovedAudioSystemReadinessEvidence()
  const evidenceChain = buildAudioSystemEvidenceChain()
  const blockers = Array.from(new Set([
    ...approvedEvidence.blockers,
    ...audioSystemEvidenceChainBlockers(evidenceChain),
  ]))
  const completed = approvedEvidence.status === 'completed' && blockers.length === 0

  return {
    reportId: 'activation-phase-36f-audio-system-internal-beta-readiness',
    createdAt: new Date().toISOString(),
    config: audioSystemReadinessConfig,
    evidenceChain,
    betaScope: buildAudioSystemBetaScopeManifest({
      runId: approvedEvidence.runId ?? 'phase36f-YYYYMMDDTHHMMSS',
      phase36EArtifacts: [
        approvedEvidence.phase36EReportUri,
      ],
      ready: approvedEvidence.audioSystemInternalFeatureTestingReady,
    }),
    iamPlan: buildAudioSystemReadinessIamPlan(),
    commandPlans: buildAudioSystemReadinessCommandPlans(),
    risks: audioSystemRiskRegister,
    approvedEvidence,
    status: completed ? 'ready' : approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings: Array.from(new Set([
      ...approvedEvidence.warnings,
      'Phase 36F does not approve external beta, paid production, broad media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, or production.',
    ])),
    audioSystemInternalFeatureTestingReady: completed,
    phase37AReadiness: approvedEvidence.phase37AReadiness,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    arbitraryRealUserMediaAllowed: false,
    rnnoiseAllowed: false,
    demucsAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
  }
}

export function summarizeAudioSystemReadinessReport(report: AudioSystemReadinessReport): string {
  return [
    `Audio system internal beta readiness report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? '(not run)'}`,
    `Phase 36E run: ${report.config.phase36ERunId}`,
    `Phase 36E report: ${report.config.phase36EReportUri}`,
    `Included audio features: ${report.betaScope.includedFeatures.join(', ')}`,
    `Excluded audio features: ${report.betaScope.excludedFeatures.join(', ')}`,
    `Audio system internal feature testing ready: ${report.audioSystemInternalFeatureTestingReady}`,
    `Phase 37A ready: ${report.phase37AReadiness.readyForOcrApprovalWorkflow}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Arbitrary real user media allowed: ${report.arbitraryRealUserMediaAllowed}`,
    `RNNoise allowed: ${report.rnnoiseAllowed}`,
    `Demucs allowed: ${report.demucsAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Evidence chain:',
    ...report.evidenceChain.map((entry) => `- Phase ${entry.phase}: ${entry.status} - ${entry.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
