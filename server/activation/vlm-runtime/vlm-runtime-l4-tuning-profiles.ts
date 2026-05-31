import type { VlmRuntimeL4TuningProfile } from './vlm-runtime-types'

export const VLM_RUNTIME_L4_TUNING_MATRIX_ID = 'l4-oom-remediation-v1'

export const vlmRuntimeL4TuningProfiles: VlmRuntimeL4TuningProfile[] = [
  {
    profileId: 'conservative-eager-short-context',
    description: 'Short context, eager execution, one image per prompt, and tiny multimodal cache to reduce startup/KV pressure on L4.',
    launchArgs: {
      maxModelLen: 2048,
      maxNumSeqs: 1,
      maxNumBatchedTokens: 1024,
      maxTokens: 128,
      enforceEager: true,
      gpuMemoryUtilization: 0.92,
      mmProcessorCacheGb: 0,
      limitMmPerPrompt: { image: 1 },
    },
    fixtureImageConstraints: { generatedOnly: true, maxSizePx: 384, imageCountPerPrompt: 1 },
    expectedMemoryEffect: 'Reduces context/KV and multimodal processor cache while avoiding CUDA graph capture.',
    safetyStatus: 'allowed',
    diagnosticOnly: false,
  },
  {
    profileId: 'conservative-cuda-graph-lower-reservation',
    description: 'Lower GPU reservation and smaller generated fixtures while allowing CUDA graph behavior if vLLM selects it.',
    launchArgs: {
      maxModelLen: 2048,
      maxNumSeqs: 1,
      maxNumBatchedTokens: 1024,
      maxTokens: 128,
      enforceEager: false,
      gpuMemoryUtilization: 0.82,
      mmProcessorCacheGb: 0,
      limitMmPerPrompt: { image: 1 },
    },
    fixtureImageConstraints: { generatedOnly: true, maxSizePx: 256, imageCountPerPrompt: 1 },
    expectedMemoryEffect: 'Leaves more unreserved L4 memory and reduces image token pressure.',
    safetyStatus: 'allowed',
    diagnosticOnly: false,
  },
  {
    profileId: 'auto-fit-context',
    description: 'Reserved for a vLLM-supported safe auto-fit context mode.',
    launchArgs: {
      maxModelLen: null,
      maxNumSeqs: 1,
      maxNumBatchedTokens: 1024,
      maxTokens: 128,
      enforceEager: true,
      gpuMemoryUtilization: 0.9,
      mmProcessorCacheGb: 0,
      limitMmPerPrompt: { image: 1 },
    },
    fixtureImageConstraints: { generatedOnly: true, maxSizePx: 256, imageCountPerPrompt: 1 },
    expectedMemoryEffect: 'Would allow vLLM to choose a smaller safe context if a supported auto-fit API exists.',
    safetyStatus: 'skipped_unsupported',
    diagnosticOnly: false,
    unsupportedReason: 'vLLM 0.11.0 LLM API does not expose a safe max_model_len auto-fit value for this worker path.',
  },
  {
    profileId: 'cpu-offload-short-context',
    description: 'Short context plus CPU offload for the same approved model assets; requires 64Gi Cloud Run memory.',
    launchArgs: {
      maxModelLen: 2048,
      maxNumSeqs: 1,
      maxNumBatchedTokens: 1024,
      maxTokens: 128,
      enforceEager: true,
      gpuMemoryUtilization: 0.9,
      mmProcessorCacheGb: 0,
      cpuOffloadGb: 8,
      limitMmPerPrompt: { image: 1 },
    },
    fixtureImageConstraints: { generatedOnly: true, maxSizePx: 256, imageCountPerPrompt: 1 },
    expectedMemoryEffect: 'Moves up to 8Gi to CPU memory while keeping the L4 GPU class.',
    safetyStatus: 'allowed',
    diagnosticOnly: false,
  },
  {
    profileId: 'minimal-smoke-one-fixture',
    description: 'Diagnostic-only one-fixture smoke to determine whether any generated VLM inference can run on L4.',
    launchArgs: {
      maxModelLen: 1024,
      maxNumSeqs: 1,
      maxNumBatchedTokens: 512,
      maxTokens: 64,
      enforceEager: true,
      gpuMemoryUtilization: 0.9,
      mmProcessorCacheGb: 0,
      limitMmPerPrompt: { image: 1 },
    },
    fixtureImageConstraints: { generatedOnly: true, maxSizePx: 224, imageCountPerPrompt: 1 },
    expectedMemoryEffect: 'Smallest approved L4 smoke envelope; cannot complete Phase 39C by itself.',
    safetyStatus: 'allowed',
    diagnosticOnly: true,
    fixtureIds: ['generated-object-layout'],
  },
]

export function getVlmRuntimeL4TuningProfile(profileId: string): VlmRuntimeL4TuningProfile | undefined {
  return vlmRuntimeL4TuningProfiles.find((profile) => profile.profileId === profileId)
}
