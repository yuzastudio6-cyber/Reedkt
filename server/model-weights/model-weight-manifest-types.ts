import type { ReviewStatus } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProfessionalToolCatalogId } from '../tool-registry'

export type GpuModelWeightTemplateId =
  | 'rembg_u2netp_model'
  | 'faster_whisper_model'
  | 'birefnet_model'
  | 'sam3_1_checkpoint'
  | 'sam2_checkpoint'
  | 'deepfilternet_model'
  | 'demucs_model'
  | 'torch_torchvision_model'
  | 'transformers_model'
  | 'real_esrgan_model'
  | 'film_model'
  | 'paddleocr_model'

export type ModelWeightCommercialUseStatus =
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'needs_review'

export interface ProductionModelWeightManifestTemplate {
  id: GpuModelWeightTemplateId
  /**
   * Historical/candidate model-weight requirements are retained here for
   * review only. This field does not admit the identity into ProductionToolId.
   */
  toolId: ProfessionalToolCatalogId
  modelName: string
  modelVersion: string
  expectedPath: string
  source: string
  license: string
  commercialUseAllowed: boolean
  commercialUseStatus: ModelWeightCommercialUseStatus
  redistributionAllowed: boolean
  requiresAttribution: boolean
  reviewStatus: ReviewStatus
  riskNotes: string[]
  checksum?: string
  requiredForProduction: boolean
  blocksProductionIfMissing: boolean
}

export interface ModelWeightPolicyEvaluation {
  allowedForProduction: boolean
  allowedForDryRun: boolean
  blockingReasons: string[]
  warnings: string[]
}

export interface ModelWeightReadinessSummary {
  totalTemplates: number
  requiredForProduction: GpuModelWeightTemplateId[]
  productionBlocked: GpuModelWeightTemplateId[]
  needsReview: GpuModelWeightTemplateId[]
  blocked: GpuModelWeightTemplateId[]
  unknownLicense: GpuModelWeightTemplateId[]
  nonCommercial: GpuModelWeightTemplateId[]
  notes: string[]
}
