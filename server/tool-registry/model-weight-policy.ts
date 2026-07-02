import type { ProductionModelWeightPolicy, ProductionToolProfile } from './production-tool-types'

export function evaluateModelWeightPolicy(policy: ProductionModelWeightPolicy, toolId: string): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (!policy.required) {
    return { allowed: true, blockingReasons, warnings }
  }

  if (policy.reviewStatus !== 'approved') {
    blockingReasons.push(`${toolId} model/checkpoint weights are ${policy.reviewStatus}; production is blocked until explicitly approved.`)
  }

  if (policy.commercialUseStatus === 'blocked') {
    blockingReasons.push(`${toolId} has non-commercial or blocked model weights and cannot be used for paid ReeditPro production.`)
  }

  if (policy.commercialUseStatus === 'unknown' || policy.commercialUseStatus === 'needs_review') {
    blockingReasons.push(`${toolId} model-weight commercial-use status is ${policy.commercialUseStatus}; production is blocked until reviewed.`)
  }

  if (policy.checkpointReviewRequired) {
    warnings.push(`${toolId} requires checkpoint/model-card review separate from the repository license.`)
  }

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

export function evaluateToolModelWeightPolicy(profile: ProductionToolProfile): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  return evaluateModelWeightPolicy(profile.modelWeightPolicy, profile.toolId)
}

export function assertToolModelWeightPolicyAllowed(profile: ProductionToolProfile): void {
  const result = evaluateToolModelWeightPolicy(profile)

  if (!result.allowed) {
    throw new Error(result.blockingReasons.join(' '))
  }
}
