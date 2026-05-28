import type { ContainerBuildReport } from './container-build-types'

export function summarizeContainerBuildReport(report: ContainerBuildReport): string {
  return [
    `Container build report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Image tag: ${report.imageTag ?? '(missing)'}`,
    `Images planned: ${report.imagePlans.length}`,
    `Command plans: ${report.commandPlans.length}`,
    `Build results: ${report.buildResults.length}`,
    `Blockers: ${report.blockers.length}`,
    `Warnings: ${report.warnings.length}`,
    `Docker build executed: ${report.dockerBuildExecuted}`,
    `Docker push executed: ${report.dockerPushExecuted}`,
    `gcloud executed: ${report.gcloudExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Phase 21 non-GPU readiness: ${report.phase21Readiness.readyForNonGpuContainerReadinessValidation}`,
    `Phase 21 full readiness: ${report.phase21Readiness.readyForContainerReadinessValidation}`,
    '',
    'Top blockers:',
    ...(report.blockers.length > 0
      ? report.blockers.slice(0, 12).map((blocker) => `- ${blocker.summary}`)
      : ['- none']),
    '',
    'Next actions:',
    ...report.nextActions.map((action) => `- ${action.title}: ${action.summary}`),
  ].join('\n')
}

export function summarizeContainerBuildCommandPlan(report: ContainerBuildReport): string {
  return [
    'Activation container build command plan',
    'Static text only. Codex must not execute Docker, push images, run gcloud, deploy, call providers, download models, or process media.',
    '',
    ...report.commandPlans.map((plan) => [
      `# ${plan.commandId}`,
      plan.commandString,
      `imageId=${plan.imageId}`,
      `requiresHumanConfirmation=${plan.requiresHumanConfirmation}`,
      `doesNotDo=${plan.doesNotDo.join('; ')}`,
      plan.warnings.length > 0 ? `warnings=${plan.warnings.join('; ')}` : 'warnings=none',
    ].join('\n')),
  ].join('\n\n')
}
