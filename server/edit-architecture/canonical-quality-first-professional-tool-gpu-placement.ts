import { z } from 'zod'

import {
  ALL_PROFESSIONAL_TOOL_CATALOG_IDS,
  getKnownProfessionalToolCatalogProfile,
  isProductionToolId,
  type ProfessionalToolCatalogId,
} from '../tool-registry'
import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from './canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_QUALITY_FIRST_PROFESSIONAL_TOOL_GPU_PLACEMENT_VERSION =
  'canonical-quality-first-professional-tool-gpu-placement-v1' as const

const CONTROL_PLANE_ONLY_TOOL_IDS = [
  'hyperframe',
  'opentimelineio',
  'duckdb',
  'polars',
  'maplibre',
  'turf',
  'deck_gl',
  'cesium_js',
  'revideo',
] as const satisfies readonly ProfessionalToolCatalogId[]

const GPU_COLOCATED_HELPER_TOOL_IDS = [
  'audioread',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'ffprobe',
] as const satisfies readonly ProfessionalToolCatalogId[]

const HEAVY_A100_PRIMARY_TOOL_IDS = [
  'faster_whisper',
  'sam3_1',
  'comfyui',
  'stable_audio_3_small_sfx',
] as const satisfies readonly ProfessionalToolCatalogId[]

const HISTORICAL_OR_REPLACED_TOOL_IDS = [
  'sam2',
  'essentia',
  'rubber_band',
] as const satisfies readonly ProfessionalToolCatalogId[]

const DECLARED_GPU_IMPLEMENTATION_TOOL_IDS = [
  'three_js',
  'pixijs',
  'babylon_js',
  'rembg',
  'kornia',
  'deepfilternet',
  'playwright',
  'ffmpeg',
  'remotion',
  'opencv',
  'vapoursynth',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'birefnet',
  'transparent_background',
  'demucs',
  'real_esrgan',
  'film',
  'torch_torchvision',
  'transformers',
  ...HEAVY_A100_PRIMARY_TOOL_IDS,
] as const satisfies readonly ProfessionalToolCatalogId[]

/**
 * Logical catalog identities whose historical package is not itself a GPU
 * media implementation. New work keeps the approved logical tool identity for
 * plan/readback compatibility, but the immutable runtime release must execute
 * through this GPU owner. The historical package may contribute only bounded
 * structured parameters; it may never satisfy substantive execution.
 */
const GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID = {
  d3: 'remotion',
  echarts: 'remotion',
  vega_lite: 'remotion',
  vega: 'remotion',
  satori: 'remotion',
  svg_js: 'remotion',
  viz_js: 'remotion',
  lottie: 'pixijs',
  animejs: 'pixijs',
  konva: 'pixijs',
  librosa: 'torch_torchvision',
  pydub: 'torch_torchvision',
  scipy: 'torch_torchvision',
  resampy: 'torch_torchvision',
  pyloudnorm: 'torch_torchvision',
  audioflux: 'torch_torchvision',
  music21: 'torch_torchvision',
  pretty_midi: 'torch_torchvision',
  mido: 'torch_torchvision',
  noisereduce: 'deepfilternet',
  pedalboard: 'torch_torchvision',
  mir_eval: 'torch_torchvision',
  pydub_effects: 'torch_torchvision',
  ebu_r128_pyloudnorm: 'torch_torchvision',
  rnnoise: 'deepfilternet',
  pyscenedetect: 'opencv',
  opencolorio: 'kornia',
  openimageio: 'kornia',
  pyav: 'ffmpeg',
  libass: 'remotion',
  sharp: 'kornia',
  signalsmith_stretch: 'torch_torchvision',
  streamer_render_pipeline_support: 'remotion',
  soundtouch: 'torch_torchvision',
} as const satisfies Partial<Record<
  ProfessionalToolCatalogId,
  ProfessionalToolCatalogId
>>

const toolIdSchema = z.enum(ALL_PROFESSIONAL_TOOL_CATALOG_IDS)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const entryWithoutHashSchema = z.object({
  toolId: toolIdSchema,
  sourceCatalogClass: z.enum([
    'canonical_private_e2e_tool',
    'non_e2e_capability_candidate',
  ]),
  sourceProfileHash: sha256,
  sourceWorkerType: z.enum([
    'api_service',
    'cpu_analysis_worker',
    'gpu_ai_worker',
    'render_worker',
    'qa_worker',
    'tool_readiness_worker',
    'frontend_preview_only',
    'planning_only',
  ]),
  sourceProfileGpuRequired: z.boolean(),
  sourceProfileCpuAllowed: z.boolean(),
  placementClass: z.enum([
    'non_gpu_control_plane_only',
    'l4_colocated_io_container_metadata_helper',
    'l4_standard_gpu_primary',
    'a100_80gb_heavy_primary_l4_fallback',
    'historical_read_only',
  ]),
  primaryGpuProfileId: z.enum([
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2],
  ]).nullable(),
  fallbackGpuProfileId: z.literal(
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
  ).nullable(),
  gpuImplementationDisposition: z.enum([
    'not_applicable_control_plane',
    'included_in_parent_l4_attempt_only',
    'declared_gpu_route_release_qualification_pending',
    'gpu_successor_implementation_required',
    'historical_or_replaced_no_new_work',
  ]),
  gpuExecutionOwnerBindingMode: z.enum([
    'not_applicable_control_plane',
    'included_in_parent_l4_attempt',
    'native_gpu_implementation',
    'declared_gpu_successor',
    'historical_read_only',
  ]),
  gpuExecutionOwnerToolId: toolIdSchema.nullable(),
  legacyToolSubstantiveExecutionAllowed: z.literal(false),
  costProfileId: safeId.nullable(),
  costAllocationMode: z.enum([
    'not_billable_tool_execution',
    'included_in_parent_gpu_attempt',
    'exact_per_tool_gpu_attempt',
  ]),
  currentCloudRateAuthorityRequired: z.boolean(),
  exactAttemptUsageEvidenceRequired: z.boolean(),
  gpuKernelOrHardwareCodecEvidenceRequired: z.boolean(),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  cpuHelperBoundary: z.enum([
    'none',
    'auth_validation_queue_persistence_and_structured_metadata_only',
    'io_container_metadata_only_inside_parent_l4_attempt',
  ]),
  newPlanRuntimeAdmissible: z.literal(false),
  requiredGates: z.array(safeId).min(1).max(16),
}).strict().superRefine((entry, context) => {
  const control = entry.placementClass === 'non_gpu_control_plane_only'
  const helper = entry.placementClass ===
    'l4_colocated_io_container_metadata_helper'
  const standard = entry.placementClass === 'l4_standard_gpu_primary'
  const heavy = entry.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const historical = entry.placementClass === 'historical_read_only'
  const exact = control
    ? entry.primaryGpuProfileId === null
      && entry.fallbackGpuProfileId === null
      && entry.gpuImplementationDisposition ===
        'not_applicable_control_plane'
      && entry.gpuExecutionOwnerBindingMode ===
        'not_applicable_control_plane'
      && entry.gpuExecutionOwnerToolId === null
      && entry.costProfileId === null
      && entry.costAllocationMode === 'not_billable_tool_execution'
      && !entry.currentCloudRateAuthorityRequired
      && !entry.exactAttemptUsageEvidenceRequired
      && !entry.gpuKernelOrHardwareCodecEvidenceRequired
      && entry.cpuHelperBoundary ===
        'auth_validation_queue_persistence_and_structured_metadata_only'
    : helper
      ? entry.primaryGpuProfileId ===
          CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2]
        && entry.fallbackGpuProfileId === null
        && entry.gpuImplementationDisposition ===
          'included_in_parent_l4_attempt_only'
        && entry.gpuExecutionOwnerBindingMode ===
          'included_in_parent_l4_attempt'
        && entry.gpuExecutionOwnerToolId === null
        && entry.costProfileId === null
        && entry.costAllocationMode === 'included_in_parent_gpu_attempt'
        && entry.currentCloudRateAuthorityRequired
        && entry.exactAttemptUsageEvidenceRequired
        && !entry.gpuKernelOrHardwareCodecEvidenceRequired
        && entry.cpuHelperBoundary ===
          'io_container_metadata_only_inside_parent_l4_attempt'
      : standard
        ? entry.primaryGpuProfileId ===
            CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2]
          && entry.fallbackGpuProfileId === null
          && entry.costProfileId === `gpu-tool-${entry.toolId}-v1`
          && entry.costAllocationMode === 'exact_per_tool_gpu_attempt'
          && entry.currentCloudRateAuthorityRequired
          && entry.exactAttemptUsageEvidenceRequired
          && entry.gpuKernelOrHardwareCodecEvidenceRequired
          && entry.cpuHelperBoundary === 'none'
          && entry.gpuImplementationDisposition ===
            'declared_gpu_route_release_qualification_pending'
          && entry.gpuExecutionOwnerToolId !== null
          && (entry.gpuExecutionOwnerBindingMode ===
            'native_gpu_implementation'
            || entry.gpuExecutionOwnerBindingMode ===
              'declared_gpu_successor')
        : heavy
          ? entry.primaryGpuProfileId ===
              CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
            && entry.fallbackGpuProfileId ===
              CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
            && entry.costProfileId === `gpu-tool-${entry.toolId}-v1`
            && entry.costAllocationMode === 'exact_per_tool_gpu_attempt'
            && entry.currentCloudRateAuthorityRequired
            && entry.exactAttemptUsageEvidenceRequired
            && entry.gpuKernelOrHardwareCodecEvidenceRequired
            && entry.cpuHelperBoundary === 'none'
            && entry.gpuImplementationDisposition ===
              'declared_gpu_route_release_qualification_pending'
            && entry.gpuExecutionOwnerToolId !== null
            && (entry.gpuExecutionOwnerBindingMode ===
              'native_gpu_implementation'
              || entry.gpuExecutionOwnerBindingMode ===
                'declared_gpu_successor')
          : historical
            && entry.primaryGpuProfileId === null
            && entry.fallbackGpuProfileId === null
            && entry.gpuImplementationDisposition ===
              'historical_or_replaced_no_new_work'
            && entry.gpuExecutionOwnerBindingMode ===
              'historical_read_only'
            && entry.gpuExecutionOwnerToolId === null
            && entry.costProfileId === null
            && entry.costAllocationMode === 'not_billable_tool_execution'
            && !entry.currentCloudRateAuthorityRequired
            && !entry.exactAttemptUsageEvidenceRequired
            && !entry.gpuKernelOrHardwareCodecEvidenceRequired
            && entry.cpuHelperBoundary === 'none'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Professional tool placement lost its exact GPU boundary.',
  })
})

const entrySchema = entryWithoutHashSchema.extend({ entryHash: sha256 }).strict()

const policyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_QUALITY_FIRST_PROFESSIONAL_TOOL_GPU_PLACEMENT_VERSION,
  ),
  source: z.literal(
    'canonical_backend_complete_professional_tool_gpu_placement',
  ),
  sourceCatalogDigestSha256: sha256,
  entries: z.array(entrySchema)
    .length(ALL_PROFESSIONAL_TOOL_CATALOG_IDS.length),
  summary: z.object({
    totalCatalogToolCount: z.literal(
      ALL_PROFESSIONAL_TOOL_CATALOG_IDS.length,
    ),
    controlPlaneOnlyCount: z.number().int().nonnegative(),
    l4ColocatedHelperCount: z.number().int().nonnegative(),
    l4StandardPrimaryCount: z.number().int().nonnegative(),
    a100HeavyPrimaryL4FallbackCount: z.number().int().nonnegative(),
    historicalReadOnlyCount: z.number().int().nonnegative(),
    gpuSuccessorImplementationRequiredCount: z.literal(0),
    declaredGpuSuccessorRouteCount: z.number().int().nonnegative(),
    newPlanRuntimeAdmissibleCount: z.literal(0),
    allCatalogToolsClassifiedExactlyOnce: z.literal(true),
    cpuOnlySubstantiveExecutionAllowedCount: z.literal(0),
  }).strict(),
  authority: z.object({
    sourcePolicyOnly: z.literal(true),
    existingRegistryProfileRelabeledAsGpu: z.literal(false),
    legacyCpuMediaRuntimeMayAuthorizeNewPlan: z.literal(false),
    toolInstalledOrExecuted: z.literal(false),
    cloudResourceCreated: z.literal(false),
    rateOrCreditApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((policy, context) => {
  const expectedIds = [...ALL_PROFESSIONAL_TOOL_CATALOG_IDS]
  const actualIds = policy.entries.map((entry) => entry.toolId)
  const count = (placementClass: z.infer<typeof entrySchema>['placementClass']) =>
    policy.entries.filter((entry) => entry.placementClass === placementClass)
      .length
  const badEntryHash = policy.entries.some((entry) => {
    const payload = { ...entry }
    Reflect.deleteProperty(payload, 'entryHash')
    return entry.entryHash !== sha256AuthorityValue(payload)
  })
  const badGpuExecutionOwner = policy.entries.some((entry) => {
    const declared = (DECLARED_GPU_IMPLEMENTATION_TOOL_IDS as readonly string[])
      .includes(entry.toolId)
    const successor =
      GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID[
        entry.toolId as keyof typeof GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID
      ] ?? null
    const gpuRouted = entry.placementClass === 'l4_standard_gpu_primary'
      || entry.placementClass ===
        'a100_80gb_heavy_primary_l4_fallback'
    return gpuRouted
      ? entry.gpuExecutionOwnerToolId !== (declared
          ? entry.toolId
          : successor)
        || entry.gpuExecutionOwnerBindingMode !== (declared
          ? 'native_gpu_implementation'
          : 'declared_gpu_successor')
      : entry.gpuExecutionOwnerToolId !== null
  })
  if (
    stableAuthorityStringify(actualIds) !== stableAuthorityStringify(expectedIds)
    || new Set(actualIds).size !== expectedIds.length
    || badEntryHash
    || badGpuExecutionOwner
    || policy.summary.controlPlaneOnlyCount !==
      count('non_gpu_control_plane_only')
    || policy.summary.l4ColocatedHelperCount !==
      count('l4_colocated_io_container_metadata_helper')
    || policy.summary.l4StandardPrimaryCount !==
      count('l4_standard_gpu_primary')
    || policy.summary.a100HeavyPrimaryL4FallbackCount !==
      count('a100_80gb_heavy_primary_l4_fallback')
    || policy.summary.historicalReadOnlyCount !==
      count('historical_read_only')
    || policy.summary.gpuSuccessorImplementationRequiredCount !==
      policy.entries.filter((entry) => entry.gpuImplementationDisposition ===
        'gpu_successor_implementation_required').length
    || policy.summary.declaredGpuSuccessorRouteCount !==
      policy.entries.filter((entry) => entry.gpuExecutionOwnerBindingMode ===
        'declared_gpu_successor').length
  ) context.addIssue({
    code: 'custom',
    message: 'Professional tool GPU policy lost exact catalog coverage.',
  })
})

export const canonicalQualityFirstProfessionalToolGpuPlacementSchema =
  policyWithoutHashSchema.extend({ policyHash: sha256 }).strict()

export type CanonicalQualityFirstProfessionalToolGpuPlacement = z.infer<
  typeof canonicalQualityFirstProfessionalToolGpuPlacementSchema
>
export type CanonicalQualityFirstProfessionalToolGpuPlacementEntry =
  CanonicalQualityFirstProfessionalToolGpuPlacement['entries'][number]

export function createCanonicalQualityFirstProfessionalToolGpuPlacement():
CanonicalQualityFirstProfessionalToolGpuPlacement {
  assertClassificationSets()
  const entries = ALL_PROFESSIONAL_TOOL_CATALOG_IDS.map((toolId) =>
    createEntry(toolId))
  const count = (placementClass: z.infer<typeof entrySchema>['placementClass']) =>
    entries.filter((entry) => entry.placementClass === placementClass).length
  const payload = policyWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_QUALITY_FIRST_PROFESSIONAL_TOOL_GPU_PLACEMENT_VERSION,
    source: 'canonical_backend_complete_professional_tool_gpu_placement',
    sourceCatalogDigestSha256: sha256AuthorityValue(
      ALL_PROFESSIONAL_TOOL_CATALOG_IDS.map((toolId) =>
        getKnownProfessionalToolCatalogProfile(toolId)),
    ),
    entries,
    summary: {
      totalCatalogToolCount: ALL_PROFESSIONAL_TOOL_CATALOG_IDS.length,
      controlPlaneOnlyCount: count('non_gpu_control_plane_only'),
      l4ColocatedHelperCount:
        count('l4_colocated_io_container_metadata_helper'),
      l4StandardPrimaryCount: count('l4_standard_gpu_primary'),
      a100HeavyPrimaryL4FallbackCount:
        count('a100_80gb_heavy_primary_l4_fallback'),
      historicalReadOnlyCount: count('historical_read_only'),
      gpuSuccessorImplementationRequiredCount: entries.filter((entry) =>
        entry.gpuImplementationDisposition ===
          'gpu_successor_implementation_required').length,
      declaredGpuSuccessorRouteCount: entries.filter((entry) =>
        entry.gpuExecutionOwnerBindingMode ===
          'declared_gpu_successor').length,
      newPlanRuntimeAdmissibleCount: 0,
      allCatalogToolsClassifiedExactlyOnce: true,
      cpuOnlySubstantiveExecutionAllowedCount: 0,
    },
    authority: {
      sourcePolicyOnly: true,
      existingRegistryProfileRelabeledAsGpu: false,
      legacyCpuMediaRuntimeMayAuthorizeNewPlan: false,
      toolInstalledOrExecuted: false,
      cloudResourceCreated: false,
      rateOrCreditApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalQualityFirstProfessionalToolGpuPlacementSchema.parse({
    ...payload,
    policyHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalQualityFirstProfessionalToolGpuPlacement(
  value: unknown,
): CanonicalQualityFirstProfessionalToolGpuPlacement {
  const parsed = canonicalQualityFirstProfessionalToolGpuPlacementSchema
    .parse(value)
  const { policyHash, ...payload } = parsed
  if (policyHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional tool GPU placement hash is invalid.')
  }
  return parsed
}

/**
 * Resolve execution placement from the quality-first policy, never from the
 * legacy registry worker class. Legacy metadata may still name CPU/render
 * workers for historical plans and is not new-work runtime authority.
 */
export function resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry(
  toolId: ProfessionalToolCatalogId,
): CanonicalQualityFirstProfessionalToolGpuPlacementEntry {
  const policy = assertCanonicalQualityFirstProfessionalToolGpuPlacement(
    createCanonicalQualityFirstProfessionalToolGpuPlacement(),
  )
  const entry = policy.entries.find((candidate) =>
    candidate.toolId === toolId)
  if (!entry) {
    throw new Error(`Professional tool GPU placement is missing: ${toolId}`)
  }
  return entry
}

function createEntry(toolId: ProfessionalToolCatalogId):
z.infer<typeof entrySchema> {
  const profile = getKnownProfessionalToolCatalogProfile(toolId)
  if (!profile) throw new Error(`Missing professional tool profile: ${toolId}`)
  const placementClass = placementClassFor(toolId)
  const control = placementClass === 'non_gpu_control_plane_only'
  const helper = placementClass ===
    'l4_colocated_io_container_metadata_helper'
  const heavy = placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const historical = placementClass === 'historical_read_only'
  const gpuDeclared = (DECLARED_GPU_IMPLEMENTATION_TOOL_IDS as readonly string[])
    .includes(toolId)
  const gpuSuccessorToolId =
    GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID[toolId as keyof typeof GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID]
      ?? null
  const payload = entryWithoutHashSchema.parse({
    toolId,
    sourceCatalogClass: isProductionToolId(toolId)
      ? 'canonical_private_e2e_tool'
      : 'non_e2e_capability_candidate',
    sourceProfileHash: sha256AuthorityValue(profile),
    sourceWorkerType: profile.workerType,
    sourceProfileGpuRequired: profile.gpuRequired,
    sourceProfileCpuAllowed: profile.cpuAllowed,
    placementClass,
    primaryGpuProfileId: heavy
      ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
      : control || historical
        ? null
        : CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2],
    fallbackGpuProfileId: heavy
      ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      : null,
    gpuImplementationDisposition: control
      ? 'not_applicable_control_plane'
      : helper
        ? 'included_in_parent_l4_attempt_only'
        : historical
          ? 'historical_or_replaced_no_new_work'
          : gpuDeclared || gpuSuccessorToolId !== null
            ? 'declared_gpu_route_release_qualification_pending'
            : 'gpu_successor_implementation_required',
    gpuExecutionOwnerBindingMode: control
      ? 'not_applicable_control_plane'
      : helper
        ? 'included_in_parent_l4_attempt'
        : historical
          ? 'historical_read_only'
          : gpuDeclared
            ? 'native_gpu_implementation'
            : 'declared_gpu_successor',
    gpuExecutionOwnerToolId: control || helper || historical
      ? null
      : gpuDeclared
        ? toolId
        : gpuSuccessorToolId,
    legacyToolSubstantiveExecutionAllowed: false,
    costProfileId: control || helper || historical
      ? null
      : `gpu-tool-${toolId}-v1`,
    costAllocationMode: control || historical
      ? 'not_billable_tool_execution'
      : helper
        ? 'included_in_parent_gpu_attempt'
        : 'exact_per_tool_gpu_attempt',
    currentCloudRateAuthorityRequired: !control && !historical,
    exactAttemptUsageEvidenceRequired: !control && !historical,
    gpuKernelOrHardwareCodecEvidenceRequired:
      !control && !helper && !historical,
    cpuOnlySubstantiveExecutionAllowed: false,
    cpuHelperBoundary: control
      ? 'auth_validation_queue_persistence_and_structured_metadata_only'
      : helper
        ? 'io_container_metadata_only_inside_parent_l4_attempt'
        : 'none',
    newPlanRuntimeAdmissible: false,
    requiredGates: gatesFor({ toolId, control, helper, heavy, historical,
      gpuDeclared, gpuSuccessorToolId }),
  })
  return entrySchema.parse({
    ...payload,
    entryHash: sha256AuthorityValue(payload),
  })
}

function placementClassFor(toolId: ProfessionalToolCatalogId):
z.infer<typeof entrySchema>['placementClass'] {
  if ((CONTROL_PLANE_ONLY_TOOL_IDS as readonly string[]).includes(toolId)) {
    return 'non_gpu_control_plane_only'
  }
  if ((GPU_COLOCATED_HELPER_TOOL_IDS as readonly string[]).includes(toolId)) {
    return 'l4_colocated_io_container_metadata_helper'
  }
  if ((HEAVY_A100_PRIMARY_TOOL_IDS as readonly string[]).includes(toolId)) {
    return 'a100_80gb_heavy_primary_l4_fallback'
  }
  if ((HISTORICAL_OR_REPLACED_TOOL_IDS as readonly string[]).includes(toolId)) {
    return 'historical_read_only'
  }
  return 'l4_standard_gpu_primary'
}

function gatesFor(input: {
  toolId: ProfessionalToolCatalogId
  control: boolean
  helper: boolean
  heavy: boolean
  historical: boolean
  gpuDeclared: boolean
  gpuSuccessorToolId: ProfessionalToolCatalogId | null
}): string[] {
  if (input.control) return [
    'closed_control_plane_operation_and_no_media_tensor_processing',
  ]
  if (input.helper) return [
    'parent_l4_attempt_exact_lineage',
    'io_container_or_metadata_only_no_substantive_processing',
    'parent_l4_attempt_usage_cost_reconciliation',
  ]
  if (input.historical) return [
    'immutable_historical_evidence_reread_only',
    'new_work_fallback_and_repair_dispatch_refused',
  ]
  return [
    input.heavy
      ? 'a100_primary_and_independent_l4_fallback_release_qualification'
      : 'l4_standard_gpu_release_qualification',
    input.gpuDeclared
      ? 'exact_gpu_kernel_hardware_codec_or_model_attestation'
      : `exact_gpu_successor_${input.gpuSuccessorToolId}_binding_and_acceleration_evidence`,
    `exact_per_tool_cost_profile_${input.toolId}`,
    'current_server_owned_cloud_rate_authority',
    'approved_plan_estimate_credit_reservation_and_idempotent_attempt',
    'terminal_attempt_usage_cost_qa_reconciliation_and_scale_down',
  ]
}

function assertClassificationSets(): void {
  const catalog = new Set<string>(ALL_PROFESSIONAL_TOOL_CATALOG_IDS)
  const groups = [
    CONTROL_PLANE_ONLY_TOOL_IDS,
    GPU_COLOCATED_HELPER_TOOL_IDS,
    HEAVY_A100_PRIMARY_TOOL_IDS,
    HISTORICAL_OR_REPLACED_TOOL_IDS,
  ] as const
  const seen = new Set<string>()
  for (const group of groups) {
    for (const toolId of group) {
      if (!catalog.has(toolId) || seen.has(toolId)) {
        throw new Error(`Invalid or duplicate tool placement class: ${toolId}`)
      }
      seen.add(toolId)
    }
  }
  for (const toolId of DECLARED_GPU_IMPLEMENTATION_TOOL_IDS) {
    if (!catalog.has(toolId) || (HISTORICAL_OR_REPLACED_TOOL_IDS as readonly string[])
      .includes(toolId)) {
      throw new Error(`Invalid declared GPU implementation identity: ${toolId}`)
    }
  }
  const successorKeys = Object.keys(
    GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID,
  ) as ProfessionalToolCatalogId[]
  const expectedSuccessorKeys = ALL_PROFESSIONAL_TOOL_CATALOG_IDS.filter(
    (toolId) =>
      !seen.has(toolId)
      && !(DECLARED_GPU_IMPLEMENTATION_TOOL_IDS as readonly string[])
        .includes(toolId),
  )
  if (
    stableAuthorityStringify(successorKeys) !==
      stableAuthorityStringify(expectedSuccessorKeys)
  ) throw new Error('GPU successor execution-owner coverage is incomplete.')
  for (const toolId of successorKeys) {
    const successor = GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID[
      toolId as keyof typeof GPU_SUCCESSOR_EXECUTION_OWNER_BY_TOOL_ID
    ]
    if (
      !successor
      || successor === toolId
      || !(DECLARED_GPU_IMPLEMENTATION_TOOL_IDS as readonly string[])
        .includes(successor)
    ) throw new Error(`Invalid GPU successor execution owner: ${toolId}`)
  }
}
