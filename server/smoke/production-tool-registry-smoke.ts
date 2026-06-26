import {
  PRODUCTION_TOOL_IDS,
  assertToolAllowedForProduction,
  assertToolAllowedForWorker,
  assertToolModelWeightsAllowed,
  getProductionToolProfile,
  getToolsNeedingLicenseReview,
  getToolsWithModelWeights,
  listProductionToolProfiles,
  summarizeProductionToolRegistry,
} from '../tool-registry'
import type { ProductionToolId, ProductionToolProfile } from '../tool-registry'

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

const profiles = listProductionToolProfiles()
const profileIds = new Set(profiles.map((profile) => profile.toolId))

for (const toolId of PRODUCTION_TOOL_IDS) {
  check(profileIds.has(toolId), `Every required tool must have a profile: missing ${toolId}`)
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

const revideo = requireProfile('revideo')
check(revideo.productionStatus === 'evaluation_only', 'Revideo must remain evaluation-only.')
check(!revideo.launchCore, 'Revideo must not be launch core.')
expectThrows(() => assertToolAllowedForProduction('revideo'), 'Revideo must be blocked from production execution.')

const remotion = requireProfile('remotion')
check(remotion.category === 'render_composition', 'Remotion must remain the primary render/composition profile.')
check(remotion.launchCore, 'Remotion must remain launch core.')

const hyperframe = requireProfile('hyperframe')
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

const birefnet = requireProfile('birefnet')
check(birefnet.qaResponsibilities.includes('mask_edge_quality'), 'BiRefNet must include mask edge QA.')
check(birefnet.qaResponsibilities.includes('mask_subject_coverage'), 'BiRefNet must include subject coverage QA.')
check(birefnet.modelWeightPolicy.required, 'BiRefNet must require model-weight policy review.')

const sam2 = requireProfile('sam2')
check(sam2.qaResponsibilities.includes('mask_temporal_stability'), 'SAM 2 must include temporal mask QA.')
check(sam2.modelWeightPolicy.required, 'SAM 2 must require checkpoint/model-weight review.')

check(requireProfile('faster_whisper').qaResponsibilities.includes('transcript_alignment'), 'faster-whisper must include transcript alignment QA.')
check(requireProfile('deepfilternet').qaResponsibilities.includes('audio_naturalness'), 'DeepFilterNet must include audio naturalness QA.')
check(requireProfile('deepfilternet').qaResponsibilities.includes('audio_loudness'), 'DeepFilterNet must include audio loudness QA.')
check(requireProfile('real_esrgan').qaResponsibilities.includes('enhancement_artifacts'), 'Real-ESRGAN must include enhancement artifact QA.')
check(requireProfile('film').qaResponsibilities.includes('slow_motion_artifacts'), 'FILM must include slow-motion artifact QA.')

const qwenVl = requireProfile('qwen_vl')
check(qwenVl.displayName === 'Qwen2.5-VL 7B Instruct', 'Qwen VLM profile must use the selected Qwen2.5-VL 7B label.')
check(qwenVl.category === 'visual_analysis', 'Qwen VLM must be visual analysis, not AI video generation.')
check(qwenVl.workerType === 'gpu_ai_worker', 'Qwen VLM must remain GPU worker scoped.')
check(qwenVl.gpuRequired, 'Qwen VLM must require GPU readiness.')
check(!qwenVl.cpuAllowed, 'Qwen VLM must not be treated as CPU execution-ready.')
check(qwenVl.modelWeightPolicy.required, 'Qwen VLM must require exact model-weight review.')
check(qwenVl.qaResponsibilities.includes('ocr_text_overlap'), 'Qwen VLM must carry OCR/text overlap QA.')
check(qwenVl.qaResponsibilities.includes('caption_safe_zone'), 'Qwen VLM must carry safe-zone QA.')
check(qwenVl.fallbackToolIds.includes('paddleocr'), 'Qwen VLM must fall back to deterministic OCR.')
expectThrows(() => assertToolModelWeightsAllowed('qwen_vl'), 'Unreviewed Qwen2.5-VL weights must be blocked.')
expectThrows(() => assertToolAllowedForWorker('qwen_vl', 'cpu_analysis_worker'), 'Qwen VLM must be blocked on CPU workers.')

const expectedModelWeightTools: ProductionToolId[] = [
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'qwen_vl',
  'mediapipe',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
]

for (const toolId of expectedModelWeightTools) {
  check(requireProfile(toolId).modelWeightPolicy.required, `${toolId} must have an explicit model-weight policy.`)
}

check(getToolsWithModelWeights().length >= expectedModelWeightTools.length, 'Model-weight tools must be surfaced by helper.')
check(getToolsNeedingLicenseReview().length > 0, 'Tools needing license review must be surfaced.')

expectThrows(() => assertToolAllowedForProduction('not_a_tool'), 'Unknown tools must be blocked from production execution.')
expectThrows(() => assertToolAllowedForProduction('birefnet'), 'Unreviewed model-weight tools must be blocked from production execution.')
expectThrows(() => assertToolModelWeightsAllowed('sam2'), 'Unreviewed SAM 2 checkpoints must be blocked.')
expectThrows(() => assertToolAllowedForWorker('real_esrgan', 'cpu_analysis_worker'), 'GPU-only tools must be blocked on CPU workers.')

const summary = summarizeProductionToolRegistry()
check(summary.totalTools === PRODUCTION_TOOL_IDS.length, 'Summary must include every required production tool.')
check(summary.evaluationOnlyTools.includes('revideo'), 'Summary must surface Revideo as evaluation-only.')
check(summary.toolsNeedingLicenseReview.includes('birefnet'), 'Summary must surface BiRefNet license/model review.')

console.log(JSON.stringify({
  ok: true,
  totalTools: summary.totalTools,
  launchCoreToolCount: summary.launchCoreTools.length,
  gpuRequiredToolCount: summary.gpuRequiredTools.length,
  toolsNeedingLicenseReviewCount: summary.toolsNeedingLicenseReview.length,
  modelWeightToolCount: summary.toolsWithModelWeights.length,
  evaluationOnlyTools: summary.evaluationOnlyTools,
}, null, 2))
