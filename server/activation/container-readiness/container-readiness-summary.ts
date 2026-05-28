import type {
  ContainerReadinessCommandPlan,
  ContainerReadinessReport,
} from './container-readiness-types'

export function summarizeContainerReadinessReport(report: ContainerReadinessReport): string {
  return [
    `Container readiness report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Image tag: ${report.imageTag ?? '(not provided)'}`,
    `Images: ${report.imageReadinessResults.length}`,
    `Tool results: ${report.toolReadinessResults.length}`,
    `Model-weight results: ${report.modelWeightReadinessResults.length}`,
    `Manual review items: ${report.manualReviewItems.length}`,
    `Blockers: ${report.blockers.length}`,
    `Warnings: ${report.warnings.length}`,
    `Docker executed: ${report.dockerExecuted}`,
    `gcloud executed: ${report.gcloudExecuted}`,
    `Provider executed: ${report.providerExecuted}`,
    `Model download executed: ${report.modelDownloadExecuted}`,
    `Media processing executed: ${report.mediaProcessingExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Phase 22 staging foundation ready: ${report.phase22Readiness.readyForGcpStagingFoundationSetup}`,
    `Phase 22 requires GPU readiness: ${report.phase22Readiness.gpuReadinessRequired}`,
    `Phase 23 image push ready: ${report.phase23Readiness.readyForArtifactRegistryPush}`,
    '',
    'Top blockers:',
    ...(report.blockers.length > 0
      ? report.blockers.slice(0, 12).map((blocker) => `- ${blocker.summary}`)
      : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length > 0
      ? report.warnings.slice(0, 12).map((warning) => `- ${warning.summary}`)
      : ['- none']),
    '',
    'Next actions:',
    ...report.nextActions.map((action) => `- ${action.title}: ${action.summary}`),
  ].join('\n')
}

export function summarizeContainerReadinessCommandPlan(plans: ContainerReadinessCommandPlan[]): string {
  return [
    'Activation container readiness command plan',
    'Static text only. Codex must not run Docker, docker compose, builds, pushes, gcloud, deploys, providers, model downloads, GPU jobs, or media processing.',
    '',
    ...plans.map((plan) => [
      `# ${plan.commandId}`,
      plan.commandString,
      `imageId=${plan.imageId ?? '(none)'}`,
      `requiresHumanConfirmation=${plan.requiresHumanConfirmation}`,
      `confirmationEnvVar=${plan.confirmationEnvVar}`,
      `requiredEnvVars=${plan.requiredEnvVars.join('; ')}`,
      `doesNotDo=${plan.doesNotDo.join('; ')}`,
      `expectedOutput=${plan.expectedOutput}`,
      plan.notes.length > 0 ? `notes=${plan.notes.join('; ')}` : 'notes=none',
    ].join('\n')),
  ].join('\n\n')
}
