import { getApprovedDeepFilterNetFeatureE2EEvidence } from './approved-deepfilternet-feature-e2e-evidence'
import { buildDeepFilterNetFeatureE2ECommandPlans } from './deepfilternet-feature-command-plan'
import { buildDeepFilterNetFeatureE2EIamPlan } from './deepfilternet-feature-iam-plan'
import { buildDeepFilterNetFeatureE2EPlanSnapshot } from './deepfilternet-feature-plan-snapshot'
import { deepFilterNetFeatureE2EConfig } from './deepfilternet-feature-e2e-policy'
import { buildDeepFilterNetFeatureE2ESourceSummary } from './deepfilternet-feature-source-resolver'
import type { DeepFilterNetFeatureE2EReport } from './deepfilternet-feature-e2e-types'

export function buildDeepFilterNetFeatureE2EReport(): DeepFilterNetFeatureE2EReport {
  const approvedEvidence = getApprovedDeepFilterNetFeatureE2EEvidence()
  const sourceSummary = buildDeepFilterNetFeatureE2ESourceSummary()
  const blockers = Array.from(new Set([
    ...approvedEvidence.blockers,
    ...sourceSummary.blockers,
  ]))
  const completed = approvedEvidence.status === 'completed' && blockers.length === 0

  return {
    reportId: 'activation-phase-36e-deepfilternet-feature-e2e',
    createdAt: new Date().toISOString(),
    config: deepFilterNetFeatureE2EConfig,
    sourceSummary,
    planSnapshot: buildDeepFilterNetFeatureE2EPlanSnapshot(approvedEvidence.runId ?? 'phase36e-YYYYMMDDTHHMMSS'),
    iamPlan: buildDeepFilterNetFeatureE2EIamPlan(),
    commandPlans: buildDeepFilterNetFeatureE2ECommandPlans({
      imageDigest: approvedEvidence.runtimeImageDigest,
      runId: approvedEvidence.runId,
    }),
    approvedEvidence,
    status: completed ? 'ready' : approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings: Array.from(new Set([
      ...approvedEvidence.warnings,
      ...sourceSummary.warnings,
      'Phase 36E does not approve arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, final delivery, production, beta, or broad media.',
    ])),
    deepFilterNetFeatureE2ECompleted: completed,
    phase37AReadiness: approvedEvidence.phase37AReadiness,
    audioFeatureE2EAllowed: true,
    arbitraryRealUserMediaAllowed: false,
    rnnoiseAllowed: false,
    demucsAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
    finalDeliveryAllowed: false,
  }
}

export function summarizeDeepFilterNetFeatureE2EReport(report: DeepFilterNetFeatureE2EReport): string {
  return [
    `DeepFilterNet feature E2E audio cleanup report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? '(not run)'}`,
    `Source video: ${report.config.approvedInputVideo}`,
    `Reference Phase 31 audio: ${report.config.referencePhase31Audio}`,
    `Tool: ${report.config.toolId} ${report.config.toolVersion}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image: ${report.approvedEvidence.runtimeImage ?? report.config.runtimeTargetImage}`,
    `CLI SHA-256: ${report.config.cliSha256}`,
    `Model archive SHA-256: ${report.config.modelArchiveSha256}`,
    `Aggregate SHA-256: ${report.config.aggregateSha256}`,
    `Plan snapshot: ${report.approvedEvidence.planSnapshotUri ?? 'not created'}`,
    `Cleaned audio: ${report.approvedEvidence.cleanedAudioUri ?? 'not created'}`,
    `Private review preview: ${report.approvedEvidence.privateReviewPreviewUri ?? 'not created'}`,
    `DeepFilterNet feature E2E completed: ${report.deepFilterNetFeatureE2ECompleted}`,
    `Phase 37A ready: ${report.phase37AReadiness.readyForOcrApprovalWorkflow}`,
    `Arbitrary real user media allowed: ${report.arbitraryRealUserMediaAllowed}`,
    `RNNoise allowed: ${report.rnnoiseAllowed}`,
    `Demucs allowed: ${report.demucsAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
