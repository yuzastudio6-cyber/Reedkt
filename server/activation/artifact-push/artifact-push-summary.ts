import type { ArtifactPushReport } from './artifact-push-types'

export function summarizeArtifactPushReport(report: ArtifactPushReport): string {
  return [
    `Artifact push report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Project: ${report.project ?? '(missing)'}`,
    `Artifact region: ${report.artifactRegion ?? '(missing)'}`,
    `Repository: ${report.repository ?? '(missing)'}`,
    `Image tag: ${report.imageTag ?? '(missing)'}`,
    `Image manifests: ${report.imageManifests.length}`,
    `Command plans: ${report.commandPlans.length}`,
    `Push results: ${report.pushResults.length}`,
    `Digest evidence: ${report.digestEvidence.length}`,
    `Blockers: ${report.blockers.length}`,
    `Docker push executed: ${report.dockerPushExecuted}`,
    `gcloud executed: ${report.gcloudExecuted}`,
    `Deployment executed: ${report.deploymentExecuted}`,
    `Docker build executed: ${report.dockerBuildExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Phase 24 non-GPU deploy ready: ${report.phase24Readiness.readyForNonGpuStagingDeploy}`,
    `Phase 27 GPU ready: ${report.phase27Readiness.readyForGpuStaging}`,
    '',
    'Pushed image evidence:',
    ...(report.pushResults.length > 0
      ? report.pushResults.map((result) => [
          `- ${result.imageId}: ${result.status}`,
          result.targetFullImageName ? `  image=${result.targetFullImageName}` : undefined,
          result.digest ? `  digest=${result.digest}` : undefined,
          result.logPath ? `  log=${result.logPath}` : undefined,
        ].filter(Boolean).join('\n'))
      : ['- none']),
    '',
    'Blockers:',
    ...(report.blockers.length > 0 ? report.blockers.map((blocker) => `- ${blocker.summary}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning.summary}`) : ['- none']),
    '',
    'Human-run command plan text:',
    ...(report.commandPlans.length > 0
      ? report.commandPlans.map((plan) => [
          `# ${plan.commandId}`,
          `imageId=${plan.imageId}`,
          `deferred=${plan.deferred}`,
          `requiresHumanConfirmation=${plan.requiresHumanConfirmation}`,
          `confirmationEnvVar=${plan.confirmationEnvVar}`,
          `targetFullImageName=${plan.targetFullImageName}`,
          `commandString=${plan.commandString}`,
          `doesNotDo=${plan.doesNotDo.join('; ')}`,
        ].join('\n'))
      : ['- no command plans until blockers are resolved']),
  ].join('\n')
}
