import {
  validateGcpStagingCommandPlan,
  validateGcpStagingIamPlan,
  validateGcpStagingResourceMap,
  validateGcpStagingSecretPlan,
} from './gcp-staging-policy'
import {
  validateGcpStagingConfig,
} from './gcp-staging-config'
import type {
  GcpStagingBlocker,
  GcpStagingCommandPlan,
  GcpStagingConfigInput,
  GcpStagingIamBindingPlan,
  GcpStagingReadinessDecision,
  GcpStagingResourceMap,
  GcpStagingSecretPlan,
  GcpStagingWarning,
} from './gcp-staging-types'

export interface GcpStagingBlockerEvaluation {
  blockers: GcpStagingBlocker[]
  warnings: GcpStagingWarning[]
  phase23Readiness: GcpStagingReadinessDecision
  phase24Readiness: GcpStagingReadinessDecision
}

export function evaluateGcpStagingBlockers(input: {
  configInput: GcpStagingConfigInput
  resourceMap: GcpStagingResourceMap
  iamPlan: GcpStagingIamBindingPlan[]
  secretPlan: GcpStagingSecretPlan[]
  commandPlans: GcpStagingCommandPlan[]
  productionReadyAllowed?: boolean
  externalBetaAllowed?: boolean
  realUserMediaTestingAllowed?: boolean
}): GcpStagingBlockerEvaluation {
  const blockers: GcpStagingBlocker[] = []
  const warnings: GcpStagingWarning[] = []

  collect('config', validateGcpStagingConfig(input.configInput), blockers, warnings)
  collect('resource-map', validateGcpStagingResourceMap(input.resourceMap), blockers, warnings)
  collect('iam', validateGcpStagingIamPlan(input.iamPlan), blockers, warnings)
  collect('secret-plan', validateGcpStagingSecretPlan(input.secretPlan), blockers, warnings)
  collect('command-plan', validateGcpStagingCommandPlan(input.commandPlans), blockers, warnings)

  if (input.productionReadyAllowed) blockers.push({ id: 'production-ready-allowed', summary: 'Production-ready must remain false.' })
  if (input.externalBetaAllowed) blockers.push({ id: 'external-beta-allowed', summary: 'External beta must remain false.' })
  if (input.realUserMediaTestingAllowed) blockers.push({ id: 'real-user-media-allowed', summary: 'Real user media testing must remain false.' })

  warnings.push(
    { id: 'resources-not-created', summary: 'Staging resources are not created by Phase 22; a human must run setup later.' },
    { id: 'gpu-staging-not-required', summary: 'GPU staging is not required for Phase 23 and remains later-phase work.' },
    { id: 'model-weights-not-approved', summary: 'Model weights and licenses are not approved in Phase 22.' },
    { id: 'deployment-not-done', summary: 'Runtime rollout is later Phase 24/27 work.' },
    { id: 'readiness-still-blocked', summary: 'Actual staging readiness remains blocked until resources, images, IAM, secrets, and non-GPU readiness are verified.' },
  )

  const phase23Blockers = blockers.map((blocker) => blocker.summary)
  const phase23Warnings = warnings.map((warning) => warning.summary)
  const phase24Blockers = [
    'GCP staging resources must be created by a human before Phase 24.',
    'Images must be pushed to Artifact Registry in Phase 23 before Phase 24.',
    'Service accounts and IAM bindings must be verified before Phase 24.',
    'Secret placeholders must be configured before Phase 24.',
    'Required non-GPU container readiness must pass before Phase 24.',
  ]

  return {
    blockers,
    warnings,
    phase23Readiness: {
      ready: phase23Blockers.length === 0,
      blockers: phase23Blockers,
      warnings: phase23Warnings,
    },
    phase24Readiness: {
      ready: false,
      blockers: phase24Blockers,
      warnings: phase23Warnings,
    },
  }
}

function collect(
  prefix: string,
  check: { blockers: string[]; warnings: string[] },
  blockers: GcpStagingBlocker[],
  warnings: GcpStagingWarning[],
): void {
  for (const [index, summary] of check.blockers.entries()) {
    blockers.push({ id: `${prefix}-blocker-${index + 1}`, summary })
  }
  for (const [index, summary] of check.warnings.entries()) {
    warnings.push({ id: `${prefix}-warning-${index + 1}`, summary })
  }
}
