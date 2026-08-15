import {
  NON_E2E_TOOL_CAPABILITY_IDS,
  PRODUCTION_TOOL_IDS,
  RUNNER_ONLY_FOUNDATION_IDS,
  assertToolAllowedForProduction,
  assertToolAllowedForWorker,
  assertToolModelWeightsAllowed,
  getNonE2EToolCapabilityProfile,
  getProductionToolProfile,
  getToolsNeedingLicenseReview,
  getToolsWithModelWeights,
  isProductionToolId,
  listNonE2EToolCapabilityProfiles,
  listProductionToolProfiles,
  summarizeNonE2EToolCapabilityCatalog,
  summarizeProductionToolRegistry,
} from '../tool-registry'
import type {
  NonE2EToolCapabilityId,
  NonE2EToolCapabilityProfile,
  ProductionToolId,
  ProductionToolProfile,
} from '../tool-registry'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function expectThrows(fn: () => void, message: string): void {
  let threw = false

  try {
    fn()
  } catch {
    threw = true
  }

  check(threw, message)
}

function requireProfile(toolId: ProductionToolId): ProductionToolProfile {
  const profile = getProductionToolProfile(toolId)
  check(Boolean(profile), `Missing production profile for ${toolId}`)
  return profile as ProductionToolProfile
}

function requireCapabilityProfile(
  toolId: NonE2EToolCapabilityId,
): NonE2EToolCapabilityProfile {
  const profile = getNonE2EToolCapabilityProfile(toolId)
  check(Boolean(profile), `Missing non-E2E capability profile for ${toolId}`)
  return profile as NonE2EToolCapabilityProfile
}

const profiles = listProductionToolProfiles()
const profileIds = new Set(profiles.map((profile) => profile.toolId))
const capabilityProfiles = listNonE2EToolCapabilityProfiles()
const capabilityProfileIds = new Set(
  capabilityProfiles.map((profile) => profile.toolId),
)

check(profiles.length === 50, 'Production registry must contain exactly 50 canonical private E2E tools.')
check(capabilityProfiles.length === 25, 'Non-E2E capability catalog must contain exactly 25 historical/future identities.')
check(requireCapabilityProfile('sam2').productionStatus === 'blocked', 'SAM 2 must remain historical-only and blocked for new work.')
check(requireCapabilityProfile('sam3_1').productionStatus === 'needs_license_review', 'SAM 3.1 must remain non-E2E until its exact gated checkpoint and GPU routes qualify.')
check(requireCapabilityProfile('sam3_1').cpuAllowed === false, 'SAM 3.1 must not gain a CPU heavy-execution lane.')

for (const toolId of PRODUCTION_TOOL_IDS) {
  check(profileIds.has(toolId), `Every required tool must have a profile: missing ${toolId}`)
}

for (const toolId of NON_E2E_TOOL_CAPABILITY_IDS) {
  check(
    capabilityProfileIds.has(toolId),
    `Every non-E2E capability must retain audit metadata: missing ${toolId}`,
  )
  check(
    !new Set<string>(profileIds).has(toolId),
    `${toolId} must not appear in the production tool registry.`,
  )
  check(
    !isProductionToolId(toolId),
    `${toolId} must not pass the production tool ID guard.`,
  )
  check(
    getProductionToolProfile(toolId) === undefined,
    `${toolId} must not resolve through production lookup.`,
  )
  expectThrows(
    () => assertToolAllowedForProduction(toolId),
    `${toolId} must not be admitted for production execution.`,
  )
}

for (const profile of profiles) {
  check(Boolean(profile.category), `${profile.toolId} must have a category`)
  check(Boolean(profile.workerType), `${profile.toolId} must have a worker type`)
  check(profile.inputTypes.length > 0, `${profile.toolId} must list input types`)
  check(profile.outputTypes.length > 0, `${profile.toolId} must list output types`)
  check(profile.qaResponsibilities.length > 0, `${profile.toolId} must list QA responsibilities`)
  check(Boolean(profile.productionStatus), `${profile.toolId} must have a production status`)

  if (profile.gpuRequired) {
    check(
      profile.workerType === 'gpu_ai_worker' ||
        profile.productionStatus === 'planned' ||
        profile.productionStatus === 'future' ||
        profile.productionStatus === 'evaluation_only' ||
        profile.productionStatus === 'needs_license_review',
      `${profile.toolId} is GPU-required but is not assigned to gpu_ai_worker or explicitly non-launch executable.`,
    )
  }

  if (profile.workerType === 'frontend_preview_only') {
    check(
      !profile.inputTypes.some((inputType) => inputType === 'source_media' || inputType === 'proxy_media' || inputType === 'video' || inputType === 'audio'),
      `${profile.toolId} is frontend-preview-only and must not process source media.`,
    )
    check(
      !profile.outputTypes.some((outputType) => outputType === 'processed_video' || outputType === 'processed_audio' || outputType === 'final_export'),
      `${profile.toolId} is frontend-preview-only and must not produce processed media.`,
    )
  }
}

for (const profile of profiles.filter((item) => item.productionStatus === 'evaluation_only')) {
  expectThrows(
    () => assertToolAllowedForProduction(profile.toolId),
    `${profile.toolId} is evaluation-only and must not be production executable.`,
  )
}

const revideo = requireCapabilityProfile('revideo')
check(revideo.productionStatus === 'evaluation_only', 'Revideo must remain evaluation-only.')
check(!revideo.launchCore, 'Revideo must not be launch core.')
expectThrows(() => assertToolAllowedForProduction('revideo'), 'Revideo must be blocked from production execution.')

const remotion = requireProfile('remotion')
check(remotion.category === 'render_composition', 'Remotion must remain the primary render/composition profile.')
check(remotion.launchCore, 'Remotion must remain launch core.')

const hyperframe = requireCapabilityProfile('hyperframe')
check(hyperframe.category === 'timeline', 'Hyperframe must remain timeline/preview boundary.')
check(hyperframe.executionMode === 'preview_boundary', 'Hyperframe must be modeled as the preview boundary.')

const ffmpeg = requireProfile('ffmpeg')
check(ffmpeg.launchCore, 'FFmpeg must remain core media/export.')
check(ffmpeg.outputTypes.includes('final_export'), 'FFmpeg must own final export output capability.')
assertToolAllowedForProduction('ffmpeg')

const libass = requireProfile('libass')
check(libass.category === 'captions', 'libass must remain caption burn-in/render support.')
check(libass.qaResponsibilities.includes('caption_readability'), 'libass must carry caption QA gates.')

const otio = requireProfile('opentimelineio')
check(otio.category === 'timeline', 'OpenTimelineIO must remain structured timeline interchange.')
check(otio.qaResponsibilities.includes('render_timeline_integrity'), 'OpenTimelineIO must carry timeline integrity QA.')

const opencolorio = requireProfile('opencolorio')
check(opencolorio.qaResponsibilities.includes('color_exposure'), 'OpenColorIO must include color exposure QA.')
check(opencolorio.qaResponsibilities.includes('color_skin_tone'), 'OpenColorIO must include skin tone QA.')
check(opencolorio.qaResponsibilities.includes('color_export_space'), 'OpenColorIO must include export color-space QA.')

const birefnet = requireCapabilityProfile('birefnet')
check(birefnet.qaResponsibilities.includes('mask_edge_quality'), 'BiRefNet must include mask edge QA.')
check(birefnet.qaResponsibilities.includes('mask_subject_coverage'), 'BiRefNet must include subject coverage QA.')
check(birefnet.modelWeightPolicy.required, 'BiRefNet must require model-weight policy review.')

const sam2 = requireCapabilityProfile('sam2')
check(sam2.qaResponsibilities.includes('mask_temporal_stability'), 'SAM 2 must include temporal mask QA.')
check(sam2.modelWeightPolicy.required, 'SAM 2 must require checkpoint/model-weight review.')

const comfyui = requireCapabilityProfile('comfyui')
check(comfyui.productionStatus === 'evaluation_only', 'ComfyUI must remain evaluation-only.')
check(comfyui.workerType === 'gpu_ai_worker', 'ComfyUI must remain a GPU-worker candidate.')
check(comfyui.qaResponsibilities.includes('render_asset_integrity'), 'ComfyUI must require generated-image integrity QA.')
check(comfyui.modelWeightPolicy.required, 'ComfyUI must require exact model-weight review.')
expectThrows(() => assertToolAllowedForProduction('comfyui'), 'ComfyUI must remain blocked from production execution.')

const stableAudio = requireCapabilityProfile('stable_audio_3_small_sfx')
check(stableAudio.category === 'audio_generation', 'Stable Audio 3 Small-SFX must remain an audio-generation candidate.')
check(stableAudio.workerType === 'gpu_ai_worker', 'Stable Audio 3 Small-SFX must use the GPU-worker boundary.')
check(stableAudio.qaResponsibilities.includes('audio_naturalness'), 'Stable Audio 3 Small-SFX must require naturalness QA.')
check(stableAudio.qaResponsibilities.includes('audio_loudness'), 'Stable Audio 3 Small-SFX must require loudness QA.')
check(stableAudio.qaResponsibilities.includes('audio_sync'), 'Stable Audio 3 Small-SFX must require timing QA.')
check(stableAudio.modelWeightPolicy.required, 'Stable Audio 3 Small-SFX must require exact gated-weight review.')
expectThrows(
  () => assertToolAllowedForProduction('stable_audio_3_small_sfx'),
  'Stable Audio 3 Small-SFX must remain blocked until its real GPU E2E evidence exists.',
)

check(requireCapabilityProfile('faster_whisper').qaResponsibilities.includes('transcript_alignment'), 'faster-whisper must include transcript alignment QA.')
check(requireProfile('deepfilternet').qaResponsibilities.includes('audio_naturalness'), 'DeepFilterNet must include audio naturalness QA.')
check(requireProfile('deepfilternet').qaResponsibilities.includes('audio_loudness'), 'DeepFilterNet must include audio loudness QA.')
check(requireCapabilityProfile('real_esrgan').qaResponsibilities.includes('enhancement_artifacts'), 'Real-ESRGAN must include enhancement artifact QA.')
check(requireCapabilityProfile('film').qaResponsibilities.includes('slow_motion_artifacts'), 'FILM must include slow-motion artifact QA.')

const expectedProductionModelWeightTools: ProductionToolId[] = [
  'rembg',
  'deepfilternet',
]

const expectedCapabilityModelWeightTools: NonE2EToolCapabilityId[] = [
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'birefnet',
  'sam2',
  'stable_audio_3_small_sfx',
  'transparent_background',
  'torch_torchvision',
  'transformers',
  'demucs',
  'real_esrgan',
  'film',
]

for (const toolId of expectedProductionModelWeightTools) {
  check(requireProfile(toolId).modelWeightPolicy.required, `${toolId} must have an explicit model-weight policy.`)
}

for (const toolId of expectedCapabilityModelWeightTools) {
  check(
    requireCapabilityProfile(toolId).modelWeightPolicy.required,
    `${toolId} capability must retain its model-weight policy.`,
  )
}

check(
  getToolsWithModelWeights().length ===
    expectedProductionModelWeightTools.length,
  'Production model-weight helper must cover only the two E2E identities.',
)
check(getToolsNeedingLicenseReview().length > 0, 'Tools needing license review must be surfaced.')

expectThrows(() => assertToolAllowedForProduction('not_a_tool'), 'Unknown tools must be blocked from production execution.')
expectThrows(() => assertToolAllowedForProduction('birefnet'), 'Unreviewed model-weight tools must be blocked from production execution.')
expectThrows(() => assertToolModelWeightsAllowed('sam2'), 'Unreviewed SAM 2 checkpoints must be blocked.')
expectThrows(() => assertToolAllowedForWorker('real_esrgan', 'cpu_analysis_worker'), 'GPU-only tools must be blocked on CPU workers.')

const summary = summarizeProductionToolRegistry()
const capabilitySummary = summarizeNonE2EToolCapabilityCatalog()
check(summary.totalTools === PRODUCTION_TOOL_IDS.length, 'Summary must include every required production tool.')
check(summary.totalTools === 50, 'Production summary must expose exactly 50 canonical E2E tools.')
check(summary.gpuRequiredTools.length === 3, 'Only three current E2E tools may retain GPU placement metadata.')
check(summary.evaluationOnlyTools.length === 0, 'Evaluation-only candidates must not appear in the production summary.')
check(
  !(summary.toolsNeedingLicenseReview as readonly string[]).includes('birefnet'),
  'BiRefNet must not leak into production registry summaries.',
)
check(capabilitySummary.totalCapabilities === 25, 'Capability summary must retain exactly 25 non-E2E identities.')
check(
  capabilitySummary.runnerOnlyFoundations.join('|') ===
    RUNNER_ONLY_FOUNDATION_IDS.join('|'),
  'Capability summary must identify the exact three runner-only foundations.',
)
check(!capabilitySummary.toolCallAllowed, 'Non-E2E capabilities must never be callable.')
check(!capabilitySummary.plannerSelectionAllowed, 'Non-E2E capabilities must never be planner-selectable.')
check(!capabilitySummary.workManifestAdmissionAllowed, 'Non-E2E capabilities must never enter work manifests.')
check(!capabilitySummary.dispatchAllowed, 'Non-E2E capabilities must never enter dispatch.')

console.log(JSON.stringify({
  ok: true,
  totalTools: summary.totalTools,
  nonE2ECapabilityCount: capabilitySummary.totalCapabilities,
  runnerOnlyFoundationCount: capabilitySummary.runnerOnlyFoundations.length,
  launchCoreToolCount: summary.launchCoreTools.length,
  gpuRequiredToolCount: summary.gpuRequiredTools.length,
  toolsNeedingLicenseReviewCount: summary.toolsNeedingLicenseReview.length,
  modelWeightToolCount: summary.toolsWithModelWeights.length,
  evaluationOnlyTools: summary.evaluationOnlyTools,
}, null, 2))
