import {
  GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
  evaluateModelWeightManifestForMode,
  summarizeGpuModelWeightReadiness,
  type GpuModelWeightTemplateId,
  type ModelWeightPolicyEvaluation,
  type ModelWeightReadinessSummary,
  type ProductionModelWeightManifestTemplate,
} from '../../model-weights'

export interface GpuModelWeightReadinessCheck {
  templateId: GpuModelWeightTemplateId
  toolId: ProductionModelWeightManifestTemplate['toolId']
  modelName: string
  expectedPath: string
  reviewStatus: ProductionModelWeightManifestTemplate['reviewStatus']
  license: string
  productionEvaluation: ModelWeightPolicyEvaluation
  dryRunEvaluation: ModelWeightPolicyEvaluation
}

export function listGpuModelWeightReadinessChecks(
  templates: ProductionModelWeightManifestTemplate[] = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
): GpuModelWeightReadinessCheck[] {
  return templates.map((template) => ({
    templateId: template.id,
    toolId: template.toolId,
    modelName: template.modelName,
    expectedPath: template.expectedPath,
    reviewStatus: template.reviewStatus,
    license: template.license,
    productionEvaluation: evaluateModelWeightManifestForMode(template, 'production_ready'),
    dryRunEvaluation: evaluateModelWeightManifestForMode(template, 'dry_run'),
  }))
}

export function summarizeGpuModelWeightsForReadiness(
  templates: ProductionModelWeightManifestTemplate[] = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
): ModelWeightReadinessSummary {
  return summarizeGpuModelWeightReadiness(templates)
}
