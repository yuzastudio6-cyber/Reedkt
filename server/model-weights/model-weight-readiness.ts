import { GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES } from './model-weight-manifest-templates'
import { evaluateModelWeightManifestForMode } from './model-weight-license-policy'
import type { ModelWeightReadinessSummary, ProductionModelWeightManifestTemplate } from './model-weight-manifest-types'
import { assertModelWeightTemplateStoragePolicy } from './model-weight-storage-policy'

export function validateGpuModelWeightTemplates(
  templates: ProductionModelWeightManifestTemplate[] = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
): void {
  const ids = new Set<string>()

  for (const template of templates) {
    if (ids.has(template.id)) {
      throw new Error(`Duplicate model-weight manifest template id: ${template.id}`)
    }
    ids.add(template.id)
    assertModelWeightTemplateStoragePolicy(template)

    if (!template.blocksProductionIfMissing || !template.requiredForProduction) {
      throw new Error(`${template.id} must block production when missing in M11.`)
    }
  }
}

export function summarizeGpuModelWeightReadiness(
  templates: ProductionModelWeightManifestTemplate[] = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
): ModelWeightReadinessSummary {
  validateGpuModelWeightTemplates(templates)

  return {
    totalTemplates: templates.length,
    requiredForProduction: templates
      .filter((template) => template.requiredForProduction)
      .map((template) => template.id),
    productionBlocked: templates
      .filter((template) => !evaluateModelWeightManifestForMode(template, 'production_ready').allowedForProduction)
      .map((template) => template.id),
    needsReview: templates
      .filter((template) => template.reviewStatus === 'needs_review' || template.reviewStatus === 'not_reviewed')
      .map((template) => template.id),
    blocked: templates
      .filter((template) => template.reviewStatus === 'blocked')
      .map((template) => template.id),
    unknownLicense: templates
      .filter((template) => template.license.toLowerCase() === 'unknown' || template.commercialUseStatus === 'unknown')
      .map((template) => template.id),
    nonCommercial: templates
      .filter((template) => !template.commercialUseAllowed || template.commercialUseStatus === 'blocked')
      .map((template) => template.id),
    notes: [
      'Model-weight manifests are templates only in Milestone 11.',
      'Code/package license approval does not approve model/checkpoint weights.',
      'Unknown, non-commercial, missing, or needs-review weights block paid production.',
      'Dry-run readiness may surface warnings without loading weights.',
    ],
  }
}
