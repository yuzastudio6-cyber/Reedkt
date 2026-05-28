import {
  gcpStagingDefaultConfig,
  parseGcpStagingConfig,
  summarizeGcpStagingConfig,
} from './gcp-staging-config'
import { buildGcpStagingCommandPlans } from './gcp-staging-command-plan'
import { buildGcpStagingIamPlan } from './gcp-staging-iam-plan'
import { buildGcpStagingResourceMap } from './gcp-staging-resource-map'
import { evaluateGcpStagingBlockers } from './gcp-staging-blocker-policy'
import type {
  BuildGcpStagingFoundationReportInput,
  GcpStagingFoundationReport,
} from './gcp-staging-types'

export const GCP_STAGING_FOUNDATION_REPORT_ID = 'activation-phase-22-gcp-staging-foundation'

export function buildGcpStagingFoundationReport(
  input: BuildGcpStagingFoundationReportInput = {},
): GcpStagingFoundationReport {
  const configInput = {
    environment: gcpStagingDefaultConfig.environment,
    ...input.configInput,
  }
  const config = parseGcpStagingConfig(configInput)
  const resourceMap = buildGcpStagingResourceMap(config)
  const iamPlan = buildGcpStagingIamPlan(config, resourceMap)
  const commandPlans = buildGcpStagingCommandPlans(config, resourceMap)
  const evaluation = evaluateGcpStagingBlockers({
    configInput,
    resourceMap,
    iamPlan,
    secretPlan: resourceMap.secretPlaceholders,
    commandPlans,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  })

  return {
    reportId: GCP_STAGING_FOUNDATION_REPORT_ID,
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode: input.mode ?? 'static_plan',
    configSummary: summarizeGcpStagingConfig(config),
    resourceMap,
    artifactRegistryPlan: resourceMap.artifactRegistry,
    bucketPlan: resourceMap.buckets,
    serviceAccountPlan: resourceMap.serviceAccounts,
    iamPlan,
    secretPlan: resourceMap.secretPlaceholders,
    commandPlans,
    blockers: evaluation.blockers,
    warnings: evaluation.warnings,
    phase23Readiness: evaluation.phase23Readiness,
    phase24Readiness: evaluation.phase24Readiness,
    gcloudExecuted: false,
    resourcesCreated: false,
    secretValuesCreated: false,
    deploymentExecuted: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeGcpStagingFoundationReport(report: GcpStagingFoundationReport): string {
  return [
    `GCP staging foundation report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Project: ${report.configSummary.projectId || '(missing)'}`,
    `Region: ${report.configSummary.region}`,
    `Artifact region: ${report.configSummary.artifactRegion}`,
    `Bucket location: ${report.configSummary.bucketLocation}`,
    `Environment: ${report.configSummary.environment}`,
    `Artifact repository: ${report.configSummary.artifactRepository}`,
    `Image tag: ${report.configSummary.imageTag}`,
    `Command plans: ${report.commandPlans.length}`,
    `Buckets: ${report.bucketPlan.length}`,
    `Service accounts: ${report.serviceAccountPlan.length}`,
    `Secret placeholders: ${report.secretPlan.length}`,
    `Blockers: ${report.blockers.length}`,
    `Warnings: ${report.warnings.length}`,
    `gcloud executed: ${report.gcloudExecuted}`,
    `Resources created: ${report.resourcesCreated}`,
    `Secret values created: ${report.secretValuesCreated}`,
    `Runtime rollout executed: ${report.deploymentExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Phase 23 image push preparation ready: ${report.phase23Readiness.ready}`,
    `Phase 24 non-GPU runtime rollout ready: ${report.phase24Readiness.ready}`,
    '',
    'Top blockers:',
    ...(report.blockers.length > 0 ? report.blockers.slice(0, 12).map((blocker) => `- ${blocker.summary}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length > 0 ? report.warnings.slice(0, 12).map((warning) => `- ${warning.summary}`) : ['- none']),
  ].join('\n')
}

export function summarizeGcpStagingCommandPlan(report: GcpStagingFoundationReport): string {
  return [
    'Activation GCP staging command plan',
    'Static text only. Codex must not run gcloud, create resources, deploy, push images, run Docker, call providers, download models, add secret payloads, or process media.',
    '',
    ...report.commandPlans.map((plan) => [
      `# ${plan.commandId}`,
      plan.commandString,
      `phase=${plan.phase}`,
      `requiresConfirmation=${plan.requiresConfirmation}`,
      `confirmationEnvVar=${plan.confirmationEnvVar}`,
      `requiredEnvVars=${plan.requiredEnvVars.join('; ') || 'none'}`,
      `safeToRunManually=${plan.safeToRunManually}`,
      `doesNotDo=${plan.doesNotDo.join('; ')}`,
      plan.warnings.length > 0 ? `warnings=${plan.warnings.join('; ')}` : 'warnings=none',
    ].join('\n')),
  ].join('\n\n')
}
