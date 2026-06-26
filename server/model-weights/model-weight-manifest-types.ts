import type { ReviewStatus } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionToolId } from '../tool-registry'

export type GpuModelWeightTemplateId =
  | 'faster_whisper_model'
  | 'birefnet_model'
  | 'sam2_checkpoint'
  | 'deepfilternet_model'
  | 'demucs_model'
  | 'real_esrgan_model'
  | 'film_model'
  | 'wan_video_model'
  | 'ltx_video_model'
  | 'mochi_video_model'
  | 'hunyuan_video_model'
  | 'paddleocr_model'

export type ModelWeightCommercialUseStatus =
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'needs_review'

export interface ProductionModelWeightManifestTemplate {
  id: GpuModelWeightTemplateId
  toolId: ProductionToolId
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
