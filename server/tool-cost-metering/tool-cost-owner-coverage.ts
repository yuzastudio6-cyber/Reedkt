import { productionToolProfiles } from '../tool-registry/production-tool-profiles'
import {
  PRODUCTION_TOOL_IDS,
  type ProductionRegistryWorkerType,
  type ProductionToolCategory,
  type ProductionToolExecutionMode,
  type ProductionToolId,
  type ProductionToolProfile,
  type ProductionToolStatus,
} from '../tool-registry/production-tool-types'
import { productionToolReadinessSpecs } from '../workers/production-readiness/production-tool-readiness-specs'
import type {
  ProductionContainerImageRole,
  ProductionReadinessCheckMode,
  ProductionReadinessStatus,
  ProductionToolReadinessSpec,
} from '../workers/production-readiness/production-tool-readiness-types'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'
import type {
  ToolCostComputeLevel,
  ToolCostProviderType,
  ToolCostQualityLevel,
  ToolCostUsageCategory,
} from './types'

export type ToolCostMeteringOwner =
  | 'backend_api_metering_owner'
  | 'cpu_analysis_worker_metering_owner'
  | 'gpu_ai_worker_metering_owner'
  | 'render_worker_metering_owner'
  | 'qa_worker_metering_owner'
  | 'tool_readiness_worker_metering_owner'
  | 'frontend_preview_metering_owner'
  | 'planning_metadata_metering_owner'

export type ToolCostProductionBillingPersistence =
  | 'backend_required'
  | 'supabase_tool_cost_events_implemented_pending_deployment'

export type ToolCostOwnerCoverageStatus =
  | 'covered_launch_core_mock_safe'
  | 'covered_planned_mock_safe'
  | 'covered_future_blocked'
  | 'covered_evaluation_only_blocked'
  | 'covered_license_review_blocked'
  | 'covered_production_blocked'

export interface ToolCostOwnerCoverageRecord {
  toolId: ProductionToolId
  displayName: string
  category: ProductionToolCategory
  productionStatus: ProductionToolStatus
  workerType: ProductionRegistryWorkerType
  executionMode: ProductionToolExecutionMode
  meteringOwner: ToolCostMeteringOwner
  ownerCaseId: string
  usageCategory: ToolCostUsageCategory
  providerType: ToolCostProviderType
  computeLevel: ToolCostComputeLevel
  qualityLevel: ToolCostQualityLevel
  gpuRequired: boolean
  modelWeightsRequired: boolean
  launchCore: boolean
  expectedWorkerTypes: ProductionRegistryWorkerType[]
  imageRoles: ProductionContainerImageRole[]
  readinessCheckModes: ProductionReadinessCheckMode[]
  readinessStatusWhenMissing: ProductionReadinessStatus
  productionRequired: boolean
  blocksProductionIfMissing: boolean
  evaluationOnly: boolean
  rateCardVersion: string
  serviceFeeIncluded: false
  requiresApprovedPlanSnapshot: true
  requiresCreditEstimate: true
  requiresCreditReservation: true
  requiresIdempotentEvent: true
  productionBillingPersistence: ToolCostProductionBillingPersistence
  productReadyLocalOss: false
  coverageStatus: ToolCostOwnerCoverageStatus
  notes: string[]
}

export interface ToolCostOwnerCoverageSummary {
  productionToolCount: number
  coveredToolCount: number
  readinessSpecCoveredCount: number
  productReadyLocalOssCount: 0
  rateCardVersion: string
  serviceFeeIncluded: false
  productionBillingPersistence: ToolCostProductionBillingPersistence
  missingToolIds: ProductionToolId[]
  missingReadinessSpecToolIds: ProductionToolId[]
  duplicateToolIds: ProductionToolId[]
  duplicateReadinessSpecToolIds: ProductionToolId[]
  byMeteringOwner: Record<ToolCostMeteringOwner, number>
  byUsageCategory: Record<ToolCostUsageCategory, number>
  byProviderType: Record<ToolCostProviderType, number>
  blockedOrReviewToolIds: ProductionToolId[]
  notes: string[]
}

const workerOwnerMap: Record<ProductionRegistryWorkerType, ToolCostMeteringOwner> = {
  api_service: 'backend_api_metering_owner',
  cpu_analysis_worker: 'cpu_analysis_worker_metering_owner',
  gpu_ai_worker: 'gpu_ai_worker_metering_owner',
  render_worker: 'render_worker_metering_owner',
  qa_worker: 'qa_worker_metering_owner',
  tool_readiness_worker: 'tool_readiness_worker_metering_owner',
  frontend_preview_only: 'frontend_preview_metering_owner',
  planning_only: 'planning_metadata_metering_owner',
}

const workerProviderMap: Record<ProductionRegistryWorkerType, ToolCostProviderType> = {
  api_service: 'cloud_run_request',
  cpu_analysis_worker: 'cloud_run_job',
  gpu_ai_worker: 'gpu_worker',
  render_worker: 'deterministic_renderer',
  qa_worker: 'cloud_run_job',
  tool_readiness_worker: 'cloud_run_job',
  frontend_preview_only: 'deterministic_renderer',
  planning_only: 'unknown',
}

const categoryUsageMap: Record<ProductionToolCategory, ToolCostUsageCategory> = {
  core_media: 'media_analysis',
  timeline: 'planning',
  render_composition: 'rendering',
  speech_transcription: 'transcription',
  captions: 'captions',
  scene_detection: 'media_analysis',
  visual_analysis: 'media_analysis',
  ocr: 'media_analysis',
  background_removal: 'graphic_design',
  segmentation_tracking: 'graphic_design',
  mask_refinement: 'graphic_design',
  color_management: 'media_analysis',
  image_processing: 'media_analysis',
  audio_cleanup: 'soundsync',
  audio_analysis: 'soundsync',
  music_separation: 'soundsync',
  enhancement: 'graphic_design',
  frame_interpolation: 'real_motion',
  motion_graphics: 'stroke_motion',
  browser_capture: 'graphic_design',
  maps_geospatial: 'graphic_design',
  charts_dataviz: 'graphic_design',
  qa: 'qa',
  evaluation: 'other',
}

const toolUsageOverrides: Partial<Record<ProductionToolId, ToolCostUsageCategory>> = {
  ffmpeg: 'export',
  remotion: 'rendering',
  libass: 'captions',
  faster_whisper: 'transcription',
  whisper_cpp: 'transcription',
  revideo: 'rendering',
}

const zeroCountByOwner: Record<ToolCostMeteringOwner, number> = {
  backend_api_metering_owner: 0,
  cpu_analysis_worker_metering_owner: 0,
  gpu_ai_worker_metering_owner: 0,
  render_worker_metering_owner: 0,
  qa_worker_metering_owner: 0,
  tool_readiness_worker_metering_owner: 0,
  frontend_preview_metering_owner: 0,
  planning_metadata_metering_owner: 0,
}

const zeroCountByUsageCategory: Record<ToolCostUsageCategory, number> = {
  planning: 0,
  transcription: 0,
  media_analysis: 0,
  captions: 0,
  stroke_motion: 0,
  graphic_design: 0,
  real_motion: 0,
  soundsync: 0,
  music: 0,
  sfx: 0,
  rendering: 0,
  export: 0,
  qa: 0,
  revision: 0,
  other: 0,
}

const zeroCountByProviderType: Record<ToolCostProviderType, number> = {
  external_api: 0,
  cloud_run_request: 0,
  cloud_run_job: 0,
  compute_engine_vm: 0,
  gpu_worker: 0,
  deterministic_renderer: 0,
  human: 0,
  unknown: 0,
}

export function buildToolCostOwnerCoverageMatrix(): ToolCostOwnerCoverageRecord[] {
  const profileByToolId = new Map<ProductionToolId, ProductionToolProfile>()
  const readinessSpecByToolId = new Map<ProductionToolId, ProductionToolReadinessSpec>()
  const duplicateToolIds: ProductionToolId[] = []
  const duplicateReadinessSpecToolIds: ProductionToolId[] = []

  for (const profile of productionToolProfiles) {
    if (profileByToolId.has(profile.toolId)) {
      duplicateToolIds.push(profile.toolId)
      continue
    }
    profileByToolId.set(profile.toolId, profile)
  }

  for (const spec of productionToolReadinessSpecs) {
    if (readinessSpecByToolId.has(spec.toolId)) {
      duplicateReadinessSpecToolIds.push(spec.toolId)
      continue
    }
    readinessSpecByToolId.set(spec.toolId, spec)
  }

  if (duplicateToolIds.length > 0) {
    throw new Error(`Duplicate production tool profiles found for metering coverage: ${duplicateToolIds.join(', ')}`)
  }

  if (duplicateReadinessSpecToolIds.length > 0) {
    throw new Error(`Duplicate production readiness specs found for metering coverage: ${duplicateReadinessSpecToolIds.join(', ')}`)
  }

  return PRODUCTION_TOOL_IDS.map((toolId) => {
    const profile = profileByToolId.get(toolId)
    const readinessSpec = readinessSpecByToolId.get(toolId)
    if (!profile) {
      throw new Error(`Missing production tool profile for metering coverage: ${toolId}`)
    }
    if (!readinessSpec) {
      throw new Error(`Missing production readiness spec for metering coverage: ${toolId}`)
    }
    return buildCoverageRecord(profile, readinessSpec)
  })
}

export function assertToolCostOwnerCoverageComplete(): ToolCostOwnerCoverageRecord[] {
  const matrix = buildToolCostOwnerCoverageMatrix()
  const coveredToolIds = new Set(matrix.map((record) => record.toolId))
  const missingToolIds = PRODUCTION_TOOL_IDS.filter((toolId) => !coveredToolIds.has(toolId))

  if (missingToolIds.length > 0) {
    throw new Error(`Missing tool cost owner coverage for: ${missingToolIds.join(', ')}`)
  }

  if (matrix.length !== PRODUCTION_TOOL_IDS.length) {
    throw new Error(`Tool cost owner coverage mismatch: expected ${PRODUCTION_TOOL_IDS.length}, found ${matrix.length}`)
  }

  return matrix
}

export function getToolCostOwnerCoverage(toolId: ProductionToolId): ToolCostOwnerCoverageRecord {
  const record = buildToolCostOwnerCoverageMatrix().find((candidate) => candidate.toolId === toolId)
  if (!record) {
    throw new Error(`Missing tool cost owner coverage for: ${toolId}`)
  }
  return record
}

export function buildToolCostOwnerCoverageSummary(matrix = buildToolCostOwnerCoverageMatrix()): ToolCostOwnerCoverageSummary {
  const coveredToolIds = new Set(matrix.map((record) => record.toolId))
  const readinessSpecIds = new Set(productionToolReadinessSpecs.map((spec) => spec.toolId))
  const seenToolIds = new Set<ProductionToolId>()
  const seenReadinessSpecIds = new Set<ProductionToolId>()
  const duplicateToolIds: ProductionToolId[] = []
  const duplicateReadinessSpecToolIds: ProductionToolId[] = []
  const byMeteringOwner = { ...zeroCountByOwner }
  const byUsageCategory = { ...zeroCountByUsageCategory }
  const byProviderType = { ...zeroCountByProviderType }
  const blockedOrReviewToolIds: ProductionToolId[] = []

  for (const record of matrix) {
    if (seenToolIds.has(record.toolId)) {
      duplicateToolIds.push(record.toolId)
    }
    seenToolIds.add(record.toolId)
    byMeteringOwner[record.meteringOwner] += 1
    byUsageCategory[record.usageCategory] += 1
    byProviderType[record.providerType] += 1
    if (record.coverageStatus !== 'covered_launch_core_mock_safe' && record.coverageStatus !== 'covered_planned_mock_safe') {
      blockedOrReviewToolIds.push(record.toolId)
    }
  }

  for (const spec of productionToolReadinessSpecs) {
    if (seenReadinessSpecIds.has(spec.toolId)) {
      duplicateReadinessSpecToolIds.push(spec.toolId)
    }
    seenReadinessSpecIds.add(spec.toolId)
  }

  return {
    productionToolCount: PRODUCTION_TOOL_IDS.length,
    coveredToolCount: matrix.length,
    readinessSpecCoveredCount: productionToolReadinessSpecs.length,
    productReadyLocalOssCount: 0,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    serviceFeeIncluded: false,
    productionBillingPersistence: 'supabase_tool_cost_events_implemented_pending_deployment',
    missingToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !coveredToolIds.has(toolId)),
    missingReadinessSpecToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !readinessSpecIds.has(toolId)),
    duplicateToolIds,
    duplicateReadinessSpecToolIds,
    byMeteringOwner,
    byUsageCategory,
    byProviderType,
    blockedOrReviewToolIds,
    notes: [
      'Coverage is generated from the production tool registry so owners can see every registered tool case.',
      'Each coverage case also references the matching production readiness spec for worker/image and production-blocker context.',
      'Supabase-backed tool cost event persistence is implemented as a backend skeleton and migration artifact; deployment, wallet spend/release/refund, Stripe, and production billing QA remain blocked.',
      'ReEditPro service fee is intentionally excluded from tool events.',
      'Product-ready local OSS tools remain 0 until separate production runtime and owner approval gates pass.',
    ],
  }
}

function buildCoverageRecord(
  profile: ProductionToolProfile,
  readinessSpec: ProductionToolReadinessSpec,
): ToolCostOwnerCoverageRecord {
  return {
    toolId: profile.toolId,
    displayName: profile.displayName,
    category: profile.category,
    productionStatus: profile.productionStatus,
    workerType: profile.workerType,
    executionMode: profile.executionMode,
    meteringOwner: workerOwnerMap[profile.workerType],
    ownerCaseId: `tool-cost-owner-case:${profile.toolId}`,
    usageCategory: toolUsageOverrides[profile.toolId] ?? categoryUsageMap[profile.category],
    providerType: workerProviderMap[profile.workerType],
    computeLevel: computeLevelForProfile(profile),
    qualityLevel: qualityLevelForProfile(profile),
    gpuRequired: profile.gpuRequired,
    modelWeightsRequired: profile.modelWeightsRequired,
    launchCore: profile.launchCore,
    expectedWorkerTypes: readinessSpec.expectedWorkerTypes,
    imageRoles: readinessSpec.imageRoles,
    readinessCheckModes: readinessSpec.checkMode,
    readinessStatusWhenMissing: readinessSpec.readinessStatusWhenMissing,
    productionRequired: readinessSpec.productionRequired,
    blocksProductionIfMissing: readinessSpec.blocksProductionIfMissing,
    evaluationOnly: readinessSpec.evaluationOnly,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    serviceFeeIncluded: false,
    requiresApprovedPlanSnapshot: true,
    requiresCreditEstimate: true,
    requiresCreditReservation: true,
    requiresIdempotentEvent: true,
    productionBillingPersistence: 'supabase_tool_cost_events_implemented_pending_deployment',
    productReadyLocalOss: false,
    coverageStatus: coverageStatusForProfile(profile),
    notes: [
      `Default usage bucket: ${toolUsageOverrides[profile.toolId] ?? categoryUsageMap[profile.category]}.`,
      `Default metering owner follows worker type: ${profile.workerType}.`,
      `Readiness fallback status when missing: ${readinessSpec.readinessStatusWhenMissing}.`,
      'Tool cost event persistence has a Supabase-backed skeleton; live billing remains blocked until deployment, RLS/service-role validation, wallet settlement, Stripe, and owner QA pass.',
    ],
  }
}

function computeLevelForProfile(profile: ProductionToolProfile): ToolCostComputeLevel {
  if (profile.gpuRequired || profile.workerType === 'gpu_ai_worker') {
    return 'premium'
  }
  if (profile.workerType === 'frontend_preview_only' || profile.workerType === 'planning_only' || profile.workerType === 'tool_readiness_worker') {
    return 'economy'
  }
  return 'standard'
}

function qualityLevelForProfile(profile: ProductionToolProfile): ToolCostQualityLevel {
  if (profile.gpuRequired || profile.workerType === 'gpu_ai_worker') {
    return 'premium'
  }
  if (profile.productionStatus === 'launch_core' || profile.productionStatus === 'planned') {
    return 'production'
  }
  return 'preview'
}

function coverageStatusForProfile(profile: ProductionToolProfile): ToolCostOwnerCoverageStatus {
  switch (profile.productionStatus) {
    case 'launch_core':
      return 'covered_launch_core_mock_safe'
    case 'planned':
      return 'covered_planned_mock_safe'
    case 'future':
      return 'covered_future_blocked'
    case 'evaluation_only':
      return 'covered_evaluation_only_blocked'
    case 'needs_license_review':
      return 'covered_license_review_blocked'
    case 'blocked':
      return 'covered_production_blocked'
  }
}
