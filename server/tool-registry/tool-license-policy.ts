import type { ProductionToolProfile } from './production-tool-types'

export function evaluateToolLicensePolicy(profile: ProductionToolProfile): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (profile.commercialUseStatus === 'blocked') {
    blockingReasons.push(`${profile.toolId} is blocked for commercial production use.`)
  }

  if (profile.commercialUseStatus === 'unknown' || profile.commercialUseStatus === 'needs_review') {
    blockingReasons.push(`${profile.toolId} commercial-use status is ${profile.commercialUseStatus}; production is blocked until reviewed.`)
  }

  if (profile.licenseRisk === 'blocked' || profile.licenseRisk === 'unknown') {
    blockingReasons.push(`${profile.toolId} license risk is ${profile.licenseRisk}; production is blocked until reviewed.`)
  }

  if (profile.distributionRisk === 'blocked' || profile.distributionRisk === 'unknown') {
    blockingReasons.push(`${profile.toolId} distribution risk is ${profile.distributionRisk}; production is blocked until reviewed.`)
  }

  if (profile.licenseFamily === 'agpl') {
    warnings.push(`${profile.toolId} uses AGPL-style licensing risk and requires legal review before any network service use.`)
  }

  if (profile.licenseFamily === 'gpl') {
    warnings.push(`${profile.toolId} uses GPL-style licensing risk and must not be bundled into production images without approval.`)
  }

  if (profile.licenseFamily === 'lgpl') {
    warnings.push(`${profile.toolId} uses LGPL-style licensing risk and requires build/linking/distribution review.`)
  }

  if (profile.commercialUseStatus === 'allowed_with_review') {
    warnings.push(`${profile.toolId} is commercially usable only after the recorded review constraints are satisfied.`)
  }

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

export function assertToolLicenseAllowed(profile: ProductionToolProfile): void {
  const result = evaluateToolLicensePolicy(profile)

  if (!result.allowed) {
    throw new Error(result.blockingReasons.join(' '))
  }
}
