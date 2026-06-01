import { getApprovedDeepFilterNetRuntimeEvidence } from './approved-deepfilternet-runtime-evidence'
import { buildDeepFilterNetRuntimeCommandPlans } from './deepfilternet-runtime-command-plan'
import { buildDeepFilterNetRuntimeFixturePlan } from './deepfilternet-runtime-fixture-plan'
import { buildDeepFilterNetRuntimeIamPlan } from './deepfilternet-runtime-iam-plan'
import { buildDeepFilterNetRuntimeModelResolverSummary } from './deepfilternet-runtime-model-resolver'
import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { DeepFilterNetRuntimeReport } from './deepfilternet-runtime-types'

export function buildDeepFilterNetRuntimeReport(): DeepFilterNetRuntimeReport {
  const approvedEvidence = getApprovedDeepFilterNetRuntimeEvidence()
  const modelResolver = buildDeepFilterNetRuntimeModelResolverSummary()
  const fixturePlan = buildDeepFilterNetRuntimeFixturePlan()
  const blockers = Array.from(new Set([
    ...approvedEvidence.blockers,
    ...modelResolver.blockers,
    ...fixturePlan.blockers,
  ]))
  const verified = approvedEvidence.status === 'verified' && blockers.length === 0

  return {
    reportId: 'activation-phase-36c-deepfilternet-runtime',
    createdAt: new Date().toISOString(),
    config: deepFilterNetRuntimeConfig,
    fixturePlan,
    iamPlan: buildDeepFilterNetRuntimeIamPlan(),
    commandPlans: buildDeepFilterNetRuntimeCommandPlans({
      imageDigest: approvedEvidence.runtimeImageDigest,
      runId: approvedEvidence.runId,
    }),
    approvedEvidence,
    status: verified ? 'ready' : approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings: Array.from(new Set([
      ...approvedEvidence.warnings,
      ...modelResolver.warnings,
      ...fixturePlan.warnings,
      'Phase 36C does not approve real-video audio AI cleanup, RNNoise, Demucs, providers, Revideo, FILM, slow motion, production, beta, or broad media.',
    ])),
    runtimeImageBuilt: Boolean(approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(approvedEvidence.cloudRunExecutionId),
    jobExecuted: Boolean(approvedEvidence.cloudRunExecutionId),
    deepFilterNetRuntimeVerified: verified,
    phase36DReadiness: approvedEvidence.phase36DReadiness,
    generatedAudioOnly: true,
    realVideoInputAllowed: false,
    realUserMediaAllowed: false,
    realMediaAudioAiAllowed: false,
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
  }
}

export function summarizeDeepFilterNetRuntimeReport(report: DeepFilterNetRuntimeReport): string {
  return [
    `DeepFilterNet runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? '(not run)'}`,
    `Tool: ${report.config.toolId} ${report.config.toolVersion}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image: ${report.approvedEvidence.runtimeImage ?? report.config.runtimeTargetImage}`,
    `CLI SHA-256: ${report.config.cliSha256}`,
    `Model archive SHA-256: ${report.config.modelArchiveSha256}`,
    `Aggregate SHA-256: ${report.config.aggregateSha256}`,
    `Artifact path: ${report.config.artifactGcsPath}`,
    `Blockers: ${report.blockers.length}`,
    `DeepFilterNet runtime verified: ${report.deepFilterNetRuntimeVerified}`,
    `Phase 36D controlled real-video audio AI cleanup sample ready: ${report.phase36DReadiness.readyForControlledRealVideoAudioAiCleanupSample}`,
    `Generated audio only: ${report.generatedAudioOnly}`,
    `Real media audio AI allowed: ${report.realMediaAudioAiAllowed}`,
    `RNNoise allowed: ${report.rnnoiseAllowed}`,
    `Demucs allowed: ${report.demucsAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Enhanced audio:',
    `- ${report.approvedEvidence.enhancedAudioUri ?? 'not generated'}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
