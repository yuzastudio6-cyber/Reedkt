import assert from 'node:assert/strict'

import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
  resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry,
} from '../edit-architecture/canonical-quality-first-professional-tool-gpu-placement'
import {
  ALL_PROFESSIONAL_TOOL_CATALOG_IDS,
  getKnownProfessionalToolCatalogProfile,
} from '../tool-registry'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { modelFrameworkSettings } from '../../src/lib/tool-settings-catalog'

const policy = createCanonicalQualityFirstProfessionalToolGpuPlacement()
assert.equal(
  assertCanonicalQualityFirstProfessionalToolGpuPlacement(policy).policyHash,
  policy.policyHash,
)
assert.equal(policy.entries.length, ALL_PROFESSIONAL_TOOL_CATALOG_IDS.length)
assert.equal(new Set(policy.entries.map((entry) => entry.toolId)).size, 75)
assert.equal(policy.summary.totalCatalogToolCount, 75)
assert.equal(policy.summary.a100HeavyPrimaryL4FallbackCount, 4)
assert.equal(policy.summary.controlPlaneOnlyCount, 9)
assert.equal(policy.summary.l4ColocatedHelperCount, 4)
assert.equal(policy.summary.historicalReadOnlyCount, 3)
assert.equal(policy.summary.l4StandardPrimaryCount, 55)
assert.equal(policy.summary.gpuSuccessorImplementationRequiredCount, 0)
assert.equal(policy.summary.declaredGpuSuccessorRouteCount, 34)
assert.equal(policy.summary.cpuOnlySubstantiveExecutionAllowedCount, 0)
assert.equal(policy.summary.newPlanRuntimeAdmissibleCount, 0)
assert.equal(policy.entries.every((entry) =>
  !entry.cpuOnlySubstantiveExecutionAllowed), true)
assert.equal(
  getKnownProfessionalToolCatalogProfile('whisper_cpp')?.cpuAllowed,
  false,
)
assert.equal(
  getKnownProfessionalToolCatalogProfile('deepfilternet')?.cpuAllowed,
  false,
)
assert.deepEqual(
  modelFrameworkSettings.find((setting) =>
    setting.id === 'devicePolicy'),
  {
    id: 'devicePolicy',
    label: 'Device policy',
    type: 'select',
    description: 'GPU worker device policy.',
    required: false,
    defaultValue: 'gpu_required',
    options: ['gpu_required'],
  },
)

const sam31 = entry('sam3_1')
assert.equal(sam31.placementClass,
  'a100_80gb_heavy_primary_l4_fallback')
assert.equal(sam31.primaryGpuProfileId,
  'quality_a100_80gb_user_triggered_heavy_job_v1')
assert.equal(sam31.fallbackGpuProfileId,
  'quality_l4_user_triggered_heavy_fallback_job_v1')
assert.equal(sam31.costProfileId, 'gpu-tool-sam3_1-v1')
assert.equal(sam31.newPlanRuntimeAdmissible, false)

const sam2 = entry('sam2')
assert.equal(sam2.placementClass, 'historical_read_only')
assert.equal(sam2.primaryGpuProfileId, null)
assert.equal(sam2.costProfileId, null)

const ffmpeg = entry('ffmpeg')
assert.equal(ffmpeg.placementClass, 'l4_standard_gpu_primary')
assert(ffmpeg.requiredGates.includes(
  'exact_gpu_kernel_hardware_codec_or_model_attestation'))

const pydub = entry('pydub')
assert.equal(pydub.placementClass, 'l4_standard_gpu_primary')
assert.equal(pydub.gpuImplementationDisposition,
  'declared_gpu_route_release_qualification_pending')
assert.equal(pydub.gpuExecutionOwnerBindingMode, 'declared_gpu_successor')
assert.equal(pydub.gpuExecutionOwnerToolId, 'torch_torchvision')
assert.equal(pydub.legacyToolSubstantiveExecutionAllowed, false)
assert.equal(pydub.newPlanRuntimeAdmissible, false)

const d3 = entry('d3')
assert.equal(d3.gpuExecutionOwnerBindingMode, 'declared_gpu_successor')
assert.equal(d3.gpuExecutionOwnerToolId, 'remotion')

const sceneDetect = entry('pyscenedetect')
assert.equal(sceneDetect.gpuExecutionOwnerToolId, 'opencv')

const nativeGpu = entry('ffmpeg')
assert.equal(nativeGpu.gpuExecutionOwnerBindingMode,
  'native_gpu_implementation')
assert.equal(nativeGpu.gpuExecutionOwnerToolId, 'ffmpeg')

const ffprobe = entry('ffprobe')
assert.equal(ffprobe.placementClass,
  'l4_colocated_io_container_metadata_helper')
assert.equal(ffprobe.costAllocationMode, 'included_in_parent_gpu_attempt')
assert.equal(ffprobe.gpuKernelOrHardwareCodecEvidenceRequired, false)

const hyperframe = entry('hyperframe')
assert.equal(hyperframe.placementClass, 'non_gpu_control_plane_only')
assert.equal(hyperframe.currentCloudRateAuthorityRequired, false)
assert.equal(
  resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry('sam3_1')
    .placementClass,
  'a100_80gb_heavy_primary_l4_fallback',
)
assert.equal(
  resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry('ffmpeg')
    .placementClass,
  'l4_standard_gpu_primary',
)
assert.equal(
  resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry('sam2')
    .placementClass,
  'historical_read_only',
)
assert.equal(
  resolveCanonicalQualityFirstProfessionalToolGpuPlacementEntry('hyperframe')
    .placementClass,
  'non_gpu_control_plane_only',
)

const tamperCases: Array<(value: Record<string, unknown>) => void> = [
  (value) => {
    tool(value, 'pydub').newPlanRuntimeAdmissible = true
  },
  (value) => {
    tool(value, 'sam3_1').primaryGpuProfileId =
      'quality_l4_user_triggered_standard_media_job_v1'
  },
  (value) => {
    tool(value, 'ffmpeg').gpuKernelOrHardwareCodecEvidenceRequired = false
  },
  (value) => {
    tool(value, 'pydub').gpuExecutionOwnerToolId = 'pydub'
  },
  (value) => {
    tool(value, 'd3').legacyToolSubstantiveExecutionAllowed = true
  },
  (value) => {
    tool(value, 'sam2').placementClass = 'l4_standard_gpu_primary'
  },
  (value) => {
    tool(value, 'hyperframe').costProfileId = 'gpu-tool-hyperframe-v1'
  },
  (value) => {
    ;(value.entries as unknown[]).pop()
  },
  (value) => {
    value.policyHash = '0'.repeat(64)
  },
]

for (const mutate of tamperCases) {
  const candidate = structuredClone(policy) as unknown as
    Record<string, unknown>
  mutate(candidate)
  if (candidate.policyHash !== '0'.repeat(64)) {
    for (const value of candidate.entries as Array<Record<string, unknown>>) {
      const payload = { ...value }
      Reflect.deleteProperty(payload, 'entryHash')
      value.entryHash = sha256AuthorityValue(payload)
    }
    const payload = { ...candidate }
    Reflect.deleteProperty(payload, 'policyHash')
    candidate.policyHash = sha256AuthorityValue(payload)
  }
  assert.throws(() =>
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(candidate))
}

console.log(JSON.stringify({
  smoke: 'canonical-quality-first-professional-tool-gpu-placement',
  checks: 47,
  totalToolCount: policy.summary.totalCatalogToolCount,
  a100HeavyPrimaryL4FallbackCount:
    policy.summary.a100HeavyPrimaryL4FallbackCount,
  l4StandardPrimaryCount: policy.summary.l4StandardPrimaryCount,
  l4ColocatedHelperCount: policy.summary.l4ColocatedHelperCount,
  controlPlaneOnlyCount: policy.summary.controlPlaneOnlyCount,
  historicalReadOnlyCount: policy.summary.historicalReadOnlyCount,
  gpuSuccessorImplementationRequiredCount:
    policy.summary.gpuSuccessorImplementationRequiredCount,
  declaredGpuSuccessorRouteCount:
    policy.summary.declaredGpuSuccessorRouteCount,
  cpuOnlySubstantiveExecutionAllowedCount:
    policy.summary.cpuOnlySubstantiveExecutionAllowedCount,
  adversarialCases: tamperCases.length,
  productionReady: policy.authority.productionReady,
  policyHash: policy.policyHash,
}))

function entry(toolId: string) {
  return policy.entries.find((candidate) => candidate.toolId === toolId)!
}

function tool(
  value: Record<string, unknown>,
  toolId: string,
): Record<string, unknown> {
  return (value.entries as Array<Record<string, unknown>>).find((candidate) =>
    candidate.toolId === toolId)!
}
