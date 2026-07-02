import type {
  ModelWeightPolicyEvaluation,
  ProductionModelWeightManifestTemplate,
} from './model-weight-manifest-types'

export function evaluateModelWeightManifestForMode(
  manifest: ProductionModelWeightManifestTemplate | undefined,
  mode: 'dry_run' | 'production_ready',
): ModelWeightPolicyEvaluation {
  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (!manifest) {
    blockingReasons.push('Missing model-weight manifest blocks production execution.')
    return {
      allowedForProduction: false,
      allowedForDryRun: mode === 'dry_run',
      blockingReasons,
      warnings: ['Dry-run may continue with missing manifest metadata, but production is blocked.'],
    }
  }

  if (manifest.license.toLowerCase() === 'unknown' || manifest.commercialUseStatus === 'unknown') {
    blockingReasons.push(`${manifest.id} has unknown model-weight license/commercial-use status.`)
  }

  if (!manifest.commercialUseAllowed || manifest.commercialUseStatus === 'blocked') {
    blockingReasons.push(`${manifest.id} is not approved for commercial paid production.`)
  }

  if (manifest.reviewStatus === 'needs_review' || manifest.reviewStatus === 'not_reviewed') {
    blockingReasons.push(`${manifest.id} needs explicit model-weight review before production execution.`)
    warnings.push(`${manifest.id} may be represented in dry-run readiness only.`)
  }

  if (manifest.reviewStatus === 'blocked' || manifest.reviewStatus === 'evaluation_only') {
    blockingReasons.push(`${manifest.id} review status is ${manifest.reviewStatus}.`)
  }

  if (!manifest.redistributionAllowed) {
    warnings.push(`${manifest.id} redistribution is not approved; runtime mount/source policy must be reviewed.`)
  }

  return {
    allowedForProduction: blockingReasons.length === 0 && manifest.reviewStatus === 'approved',
    allowedForDryRun: mode === 'dry_run',
    blockingReasons,
    warnings,
  }
}

export function assertModelWeightManifestProductionAllowed(
  manifest: ProductionModelWeightManifestTemplate | undefined,
): void {
  const evaluation = evaluateModelWeightManifestForMode(manifest, 'production_ready')
  if (!evaluation.allowedForProduction) {
    throw new Error(evaluation.blockingReasons.join(' '))
  }
}
