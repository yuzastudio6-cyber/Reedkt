import { productionToolProfiles } from '../../tool-registry/production-tool-profiles'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolInputType,
  ProductionToolProfile,
} from '../../tool-registry/production-tool-types'
import { getFallbackChainsForTool } from '../../tool-registry/tool-fallback-policy'
import { getToolQAPolicy } from '../../tool-registry/tool-qa-policy'
import {
  listProfessionalToolOperationSpecs,
  normalizeProfessionalToolOperationAlias,
} from '../professional-tool-operation-spec-registry'
import type { ProfessionalToolOperationResourceClass } from '../professional-tool-operation-seeds'
import {
  PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION,
  type ProfessionalToolOperationCostEvidenceRequirements,
  type ProfessionalToolOperationCostUnit,
  type ProfessionalToolOperationDisposition,
  type ProfessionalToolOperationEntrypointKind,
  type ProfessionalToolOperationNetworkPolicy,
  type ProfessionalToolOperationPolicyBlock,
  type ProfessionalToolOperationRequestSchema,
  type ProfessionalToolOperationResourceCeilings,
  type ProfessionalToolOperationSettingConstraint,
  type ProfessionalToolOperationSettingsSchema,
  type ProfessionalToolOperationSpec,
  type ProfessionalToolOperationWorkerRuntime,
} from '../professional-tool-operation-spec-types'

const OPAQUE_ID_PATTERN = '^[A-Za-z][A-Za-z0-9_-]{7,159}$'
const SHA256_PATTERN = '^[a-f0-9]{64}$'
const PRIVATE_INTERNAL_RUNNER_VERIFIED_TOOL_IDS = new Set<ProductionToolId>([
  'audioflux',
  'd3',
  'duckdb',
  'echarts',
  'ffmpeg',
  'ffprobe',
  'libass',
  'opentimelineio',
  'opencv',
  'polars',
  'pyav',
  'remotion',
  'sharp',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
  'lottie',
  'pixijs',
  'konva',
  'babylon_js',
  'playwright',
  'signalsmith_stretch',
  'vapoursynth',
])

const PROHIBITED_PROPERTY_NAMES = [
  'args',
  'arguments',
  'argv',
  'authorization',
  'code',
  'command',
  'cookie',
  'cookies',
  'cwd',
  'env',
  'environment',
  'executable',
  'file',
  'filepath',
  'filename',
  'headers',
  'html',
  'javascript',
  'modelpath',
  'outputpath',
  'path',
  'prompt',
  'rawchat',
  'rawhtml',
  'script',
  'shell',
  'signedurl',
  'sourcepath',
  'token',
  'uri',
  'url',
] as const

const PROHIBITED_STRING_FORMS = [
  'absolute filesystem path',
  'relative traversal path',
  'http/https URL',
  'file/data/javascript URI',
  'shell metacharacter sequence',
  'inline source code',
  'secret or bearer credential',
] as const

export type CoreRegistryOperationPromotionGate =
  | 'launch_core_candidate'
  | 'planned_candidate'
  | 'future_only'
  | 'license_review_only'
  | 'evaluation_only'
  | 'planning_only'

export type CoreRegistryOperationCallability =
  | 'real_candidate'
  | 'non_callable_policy_disposition'

export interface CoreRegistryOperationSpec extends ProfessionalToolOperationSpec {
  coverageSource: 'production_registry_without_bounded_adapter_contract'
  promotionGate: CoreRegistryOperationPromotionGate
  callability: CoreRegistryOperationCallability
  fixedContractOnly: true
}

interface CoreRegistryOperationSeed {
  canonicalToolId: ProductionToolId
  operationName: string
  aliases: readonly string[]
  settingsSchema: ProfessionalToolOperationSettingsSchema
  resourceClass: ProfessionalToolOperationResourceClass
  entrypoint: {
    kind: ProfessionalToolOperationEntrypointKind
    packageName: string
    importName?: string
    callableSymbol?: string
    commandName?: string
  }
}

interface ExpectedDisposition {
  disposition: ProfessionalToolOperationDisposition
  promotionGate: CoreRegistryOperationPromotionGate
  callability: CoreRegistryOperationCallability
  policyBlocks: readonly ProfessionalToolOperationPolicyBlock[]
}

const mediaRecipeSettings = strictSettings({
  recipeProfileId: enumConstraint([
    'proxy_h264_aac_v1',
    'audio_extract_pcm_v1',
    'approved_trim_transcode_v1',
    'approved_4k_source_slice_mezzanine_finalize_v1',
    'approved_4k_object_mezzanine_chunk_stream_copy_v1',
    'final_export_h264_aac_v1',
  ]),
  timestampPolicy: enumConstraint(['preserve_approved_timeline', 'normalize_from_zero']),
  overwriteExistingArtifact: booleanConstraint(false),
  allowUnreviewedCodec: booleanConstraint(false),
  trimStartFrame: integerConstraint(0, 100_000_000),
  trimEndFrameExclusive: integerConstraint(1, 100_000_001),
  frameRate: integerEnumConstraint([24, 25, 30, 50, 60]),
}, ['recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact', 'allowUnreviewedCodec'])

const mediaInspectionSettings = strictSettings({
  inspectionProfileId: enumConstraint([
    'source_intake_v1',
    'pre_render_v1',
    'object_mezzanine_chunk_qa_v1',
    'final_export_v1',
  ]),
  countFrames: booleanConstraint(),
  verifyDurationAndSync: booleanConstraint(true),
  emitMachineJsonOnly: booleanConstraint(true),
}, ['inspectionProfileId', 'countFrames', 'verifyDurationAndSync', 'emitMachineJsonOnly'])

const frameDecodeSettings = strictSettings({
  decodeProfileId: enumConstraint(['timestamp_safe_sample_v1', 'keyframe_extract_v1', 'audio_extract_v1']),
  frameStride: integerEnumConstraint([1, 5, 10, 15, 30]),
  maximumSamples: integerConstraint(1, 2_000),
  preserveSourceTimestamps: booleanConstraint(true),
}, ['decodeProfileId', 'frameStride', 'maximumSamples', 'preserveSourceTimestamps'])

const timelineInterchangeSettings = strictSettings({
  interchangeProfileId: enumConstraint(['approved_plan_to_otio_v1', 'validate_approved_otio_v1']),
  frameRate: integerEnumConstraint([24, 25, 30, 50, 60]),
  strictRangeValidation: booleanConstraint(true),
  preserveApprovedSourceOrder: booleanConstraint(true),
}, ['interchangeProfileId', 'frameRate', 'strictRangeValidation', 'preserveApprovedSourceOrder'])

const hyperframeBoundarySettings = strictSettings({
  boundaryProfileId: constConstraint('approved_timeline_preview_handoff_v1'),
  approvedSnapshotOnly: booleanConstraint(true),
  sourceMediaProcessingAllowed: booleanConstraint(false),
  mutationMode: constConstraint('read_only_handoff'),
}, ['boundaryProfileId', 'approvedSnapshotOnly', 'sourceMediaProcessingAllowed', 'mutationMode'])

const remotionRenderSettings = strictSettings({
  compositionProfileId: enumConstraint([
    'approved_preview_composition_v1',
    'approved_final_composition_v1',
  ]),
  frameRate: integerEnumConstraint([24, 25, 30, 50, 60]),
  outputWidth: integerEnumConstraint([720, 1080, 1920, 2160, 3840]),
  outputHeight: integerEnumConstraint([720, 1080, 1920, 2160, 3840]),
  rendererCodec: enumConstraint(['h264', 'prores_422']),
  approvedFrameOnly: booleanConstraint(true),
}, ['compositionProfileId', 'frameRate', 'outputWidth', 'outputHeight', 'rendererCodec', 'approvedFrameOnly'])

const captionRenderSettings = strictSettings({
  captionProfileId: enumConstraint(['approved_ass_burn_in_v1', 'approved_ass_track_render_v1']),
  fontPackProfileId: enumConstraint(['reeditpro_reviewed_fonts_v1']),
  collisionPolicy: enumConstraint(['fail_on_reserved_zone_collision', 'use_approved_reflow']),
  preserveSpeechTiming: booleanConstraint(true),
}, ['captionProfileId', 'fontPackProfileId', 'collisionPolicy', 'preserveSpeechTiming'])

const imageAssetSettings = strictSettings({
  imageRecipeId: enumConstraint(['approved_thumbnail_v1', 'approved_panel_asset_v1', 'approved_overlay_asset_v1']),
  outputFormat: enumConstraint(['png', 'jpeg', 'webp']),
  outputWidth: integerConstraint(1, 8_192),
  outputHeight: integerConstraint(1, 8_192),
  preserveMetadata: booleanConstraint(false),
  allowUpscale: booleanConstraint(false),
}, ['imageRecipeId', 'outputFormat', 'outputWidth', 'outputHeight', 'preserveMetadata', 'allowUpscale'])

const tableQuerySettings = strictSettings({
  queryProfileId: enumConstraint(['approved_qa_aggregate_v1', 'approved_timing_metrics_v1']),
  maximumRows: integerConstraint(1, 100_000),
  emitMachineJsonOnly: booleanConstraint(true),
  persistentDatabaseAllowed: booleanConstraint(false),
}, ['queryProfileId', 'maximumRows', 'emitMachineJsonOnly', 'persistentDatabaseAllowed'])

const tableTransformSettings = strictSettings({
  transformProfileId: enumConstraint(['approved_qa_transform_v1', 'approved_timing_table_v1']),
  maximumRows: integerConstraint(1, 100_000),
  deterministicOrdering: booleanConstraint(true),
}, ['transformProfileId', 'maximumRows', 'deterministicOrdering'])

const ocrSettings = strictSettings({
  ocrProfileId: enumConstraint(['approved_screen_text_regions_v1', 'approved_no_cover_zones_v1']),
  languageProfileId: enumConstraint(['reviewed_multilingual_default_v1']),
  confidenceThreshold: numberConstraint(0.5, 1),
  frameStride: integerEnumConstraint([1, 5, 10, 15, 30]),
  maximumFrames: integerConstraint(1, 2_000),
}, ['ocrProfileId', 'languageProfileId', 'confidenceThreshold', 'frameStride', 'maximumFrames'])

const visualAnalysisSettings = strictSettings({
  analysisProfileId: enumConstraint(['approved_safe_zone_v1', 'approved_blur_check_v1', 'approved_mask_qa_v1']),
  frameStride: integerEnumConstraint([1, 5, 10, 15, 30]),
  maximumFrames: integerConstraint(1, 5_000),
  emitDerivedPixels: booleanConstraint(false),
}, ['analysisProfileId', 'frameStride', 'maximumFrames', 'emitDerivedPixels'])

const landmarkSettings = strictSettings({
  landmarkProfileId: enumConstraint(['future_face_region_v1', 'future_body_region_v1', 'future_hand_region_v1']),
  confidenceThreshold: numberConstraint(0.5, 1),
  maximumSubjects: integerConstraint(1, 16),
  identityInferenceAllowed: booleanConstraint(false),
}, ['landmarkProfileId', 'confidenceThreshold', 'maximumSubjects', 'identityInferenceAllowed'])

const stemSeparationSettings = strictSettings({
  separationProfileId: enumConstraint(['approved_voice_music_v1', 'approved_four_stem_v1']),
  modelProfileId: enumConstraint(['reviewed_demucs_manifest_v1']),
  preserveVoice: booleanConstraint(true),
  maximumStemCount: integerEnumConstraint([2, 4]),
}, ['separationProfileId', 'modelProfileId', 'preserveVoice', 'maximumStemCount'])

const stretchSettings = strictSettings({
  stretchProfileId: enumConstraint(['approved_music_bed_fit_v1', 'approved_pitch_adjust_v1']),
  speedRatio: numberEnumConstraint([0.5, 0.75, 0.8, 1, 1.25, 1.5, 2]),
  pitchSemitones: integerEnumConstraint([-12, -7, -5, 0, 5, 7, 12]),
  preserveVoice: booleanConstraint(false),
}, ['stretchProfileId', 'speedRatio', 'pitchSemitones', 'preserveVoice'])

const audioFeatureEvaluationSettings = strictSettings({
  evaluationProfileId: constConstraint('offline_audio_feature_benchmark_v1'),
  sampleRate: integerEnumConstraint([22_050, 44_100, 48_000]),
  maximumDurationSeconds: integerConstraint(1, 14_400),
  productionUseAllowed: booleanConstraint(false),
}, ['evaluationProfileId', 'sampleRate', 'maximumDurationSeconds', 'productionUseAllowed'])

const interpolationSettings = strictSettings({
  interpolationProfileId: enumConstraint(['reviewed_2x_interpolation_v1', 'reviewed_4x_interpolation_v1']),
  modelProfileId: enumConstraint(['reviewed_film_manifest_v1']),
  interpolationFactor: integerEnumConstraint([2, 4]),
  rejectTextFaceHandRisk: booleanConstraint(true),
}, ['interpolationProfileId', 'modelProfileId', 'interpolationFactor', 'rejectTextFaceHandRisk'])

const globePlanningSettings = strictSettings({
  planningProfileId: constConstraint('future_approved_globe_scene_v1'),
  terrainMode: enumConstraint(['none', 'server_approved_tiles_only']),
  maximumLabels: integerConstraint(1, 100),
  externalTileUrlAllowed: booleanConstraint(false),
}, ['planningProfileId', 'terrainMode', 'maximumLabels', 'externalTileUrlAllowed'])

const vapourSynthSettings = strictSettings({
  pipelineProfileId: enumConstraint(['approved_frame_preprocess_v1', 'approved_clip_prepare_v1']),
  pluginPackProfileId: enumConstraint(['reviewed_builtin_plugins_v1']),
  frameRate: integerEnumConstraint([24, 25, 30, 50, 60]),
  callerScriptAllowed: booleanConstraint(false),
}, ['pipelineProfileId', 'pluginPackProfileId', 'frameRate', 'callerScriptAllowed'])

const revideoEvaluationSettings = strictSettings({
  evaluationProfileId: constConstraint('offline_core_stack_gap_comparison_v1'),
  coreStackGapEvidenceId: opaqueIdConstraint(),
  productionExecutionAllowed: booleanConstraint(false),
}, ['evaluationProfileId', 'coreStackGapEvidenceId', 'productionExecutionAllowed'])

const CORE_REGISTRY_OPERATION_SEEDS = [
  binarySeed('ffmpeg', 'execute_approved_media_recipe', ['ffmpeg_cli'], mediaRecipeSettings, 'render_binary_validation', 'ffmpeg', 'ffmpeg'),
  binarySeed('ffprobe', 'inspect_approved_media', ['ffprobe_cli'], mediaInspectionSettings, 'cpu_media_analysis', 'ffmpeg', 'ffprobe'),
  pythonSeed('pyav', 'decode_approved_media', ['py_av', 'av'], frameDecodeSettings, 'cpu_media_analysis', 'pyav', 'av', 'container.open'),
  pythonSeed('opentimelineio', 'interchange_approved_timeline', ['open_timeline_io', 'otio'], timelineInterchangeSettings, 'cpu_media_analysis', 'opentimelineio', 'opentimelineio', 'adapters'),
  nodeSeed('hyperframe', 'handoff_approved_preview_timeline', ['hyper_frame'], hyperframeBoundarySettings, 'render_2d', 'hyperframe', 'hyperframe', 'approvedTimelineHandoff'),
  nodeSeed('remotion', 'render_approved_composition', ['@remotion/renderer', 'remotion_renderer'], remotionRenderSettings, 'render_2d', '@remotion/renderer', '@remotion/renderer', 'renderMedia'),
  binarySeed('libass', 'render_approved_caption_track', ['lib_ass'], captionRenderSettings, 'render_binary_validation', 'libass', 'ffmpeg'),
  nodeSeed('sharp', 'prepare_approved_image_asset', ['sharp_libvips', 'libvips'], imageAssetSettings, 'cpu_image_process', 'sharp', 'sharp', 'default'),
  pythonSeed('duckdb', 'query_approved_artifact_tables', ['duck_db'], tableQuerySettings, 'cpu_media_analysis', 'duckdb', 'duckdb', 'connect'),
  pythonSeed('polars', 'transform_approved_artifact_tables', ['polars_dataframe'], tableTransformSettings, 'cpu_media_analysis', 'polars', 'polars', 'DataFrame'),
  pythonSeed('paddleocr', 'detect_approved_text_regions', ['paddle_ocr'], ocrSettings, 'cpu_image_process', 'paddleocr', 'paddleocr', 'PaddleOCR.ocr'),
  pythonSeed('opencv', 'analyze_approved_visual_artifacts', ['open_cv', 'opencv_python', 'cv2'], visualAnalysisSettings, 'cpu_media_analysis', 'opencv-python-headless', 'cv2', 'VideoCapture'),
  pythonSeed('mediapipe', 'analyze_future_landmark_regions', ['media_pipe'], landmarkSettings, 'cpu_media_analysis', 'mediapipe', 'mediapipe', 'solutions'),
  pythonSeed('demucs', 'separate_approved_audio_stems', ['demucs_audio'], stemSeparationSettings, 'gpu_audio', 'demucs', 'demucs', 'apply_model'),
  binarySeed('signalsmith_stretch', 'stretch_approved_music_asset', ['signalsmith', 'signalsmith-stretch'], stretchSettings, 'cpu_audio_process', 'signalsmith-stretch', 'signalsmith-stretch'),
  binarySeed('soundtouch', 'stretch_future_audio_asset', ['sound_touch', 'soundstretch'], stretchSettings, 'cpu_audio_process', 'soundtouch', 'soundstretch'),
  binarySeed('rubber_band', 'evaluate_audio_stretch_quality', ['rubberband', 'rubberband_cli'], stretchSettings, 'cpu_audio_process', 'rubberband', 'rubberband'),
  pythonSeed('essentia', 'evaluate_audio_features', ['essentia_standard'], audioFeatureEvaluationSettings, 'cpu_audio_analysis', 'essentia', 'essentia.standard', 'MusicExtractor'),
  pythonSeed('film', 'interpolate_approved_frames', ['frame_interpolation_for_large_motion', 'film_interpolation'], interpolationSettings, 'gpu_video', 'film', 'film', 'interpolate'),
  nodeSeed('cesium_js', 'prepare_future_globe_scene', ['cesium', 'cesium.js'], globePlanningSettings, 'render_3d', 'cesium', 'cesium', 'Viewer'),
  pythonSeed('vapoursynth', 'process_approved_frame_pipeline', ['vapour_synth', 'vs'], vapourSynthSettings, 'cpu_media_analysis', 'vapoursynth', 'vapoursynth', 'core'),
  nodeSeed('revideo', 'evaluate_core_stack_gap', ['re_video', '@revideo/core'], revideoEvaluationSettings, 'render_2d', '@revideo/core', '@revideo/core', 'makeScene2D'),
] as const satisfies readonly CoreRegistryOperationSeed[]

export type CoreRegistryOperationToolId = (typeof CORE_REGISTRY_OPERATION_SEEDS)[number]['canonicalToolId']

export const CORE_REGISTRY_EXPECTED_DISPOSITIONS = deepFreeze({
  ffmpeg: candidate('launch_core_candidate'),
  ffprobe: candidate('launch_core_candidate'),
  pyav: candidate('planned_candidate'),
  opentimelineio: candidate('launch_core_candidate'),
  hyperframe: candidate('launch_core_candidate'),
  remotion: candidate('launch_core_candidate'),
  libass: candidate('launch_core_candidate'),
  sharp: candidate('launch_core_candidate'),
  duckdb: candidate('planned_candidate'),
  polars: candidate('planned_candidate'),
  paddleocr: candidate('planned_candidate'),
  opencv: candidate('launch_core_candidate'),
  mediapipe: blocked('future_only', ['future_only']),
  demucs: candidate('planned_candidate'),
  signalsmith_stretch: candidate('launch_core_candidate'),
  soundtouch: blocked('future_only', ['future_only']),
  rubber_band: blocked('license_review_only', ['evaluation_only', 'registry_blocked']),
  essentia: blocked('license_review_only', ['evaluation_only', 'registry_blocked']),
  film: candidate('planned_candidate'),
  cesium_js: blocked('future_only', ['future_only', 'planning_only']),
  vapoursynth: candidate('planned_candidate'),
  revideo: blocked('evaluation_only', ['evaluation_only', 'planning_only']),
} satisfies Record<CoreRegistryOperationToolId, ExpectedDisposition>)

const boundedSpecs = listProfessionalToolOperationSpecs()
const boundedToolIds = new Set(boundedSpecs.map((spec) => spec.canonicalToolId))

export const DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS = deepFreeze(
  productionToolProfiles
    .filter((profile) => !boundedToolIds.has(profile.toolId))
    .map((profile) => profile.toolId),
) as readonly CoreRegistryOperationToolId[]

assertExactDerivedCoverage()

const profileByToolId = new Map(productionToolProfiles.map((profile) => [profile.toolId, profile]))

export const CORE_REGISTRY_OPERATION_SPECS: readonly CoreRegistryOperationSpec[] = deepFreeze(
  CORE_REGISTRY_OPERATION_SEEDS.map(buildOperationSpec),
)

const coreSpecByToolId = new Map(
  CORE_REGISTRY_OPERATION_SPECS.map((spec) => [spec.canonicalToolId, spec]),
)
const completeSpecs = deepFreeze([...boundedSpecs, ...CORE_REGISTRY_OPERATION_SPECS])
const completeAliasMap = buildCompleteAliasMap(completeSpecs)

assertCompleteCoverage()

export interface CompleteProfessionalToolOperationCoverageSummary {
  productionProfileCount: number
  boundedAdapterSpecCount: number
  coreRegistryOnlySpecCount: number
  completeCanonicalSpecCount: number
  completeAliasIdentityCount: number
  duplicateCanonicalToolIds: ProductionToolId[]
  duplicateOperationIds: string[]
  unclassifiedPlannerSelectableToolIds: ProductionToolId[]
  coreRegistryCandidateCount: number
  coreRegistryNonCallableCount: number
  completeProductReadyCount: 0
  coreRegistryPolicyBlockedToolIds: CoreRegistryOperationToolId[]
  notes: string[]
}

export function listCoreRegistryOperationSpecs(): readonly CoreRegistryOperationSpec[] {
  return CORE_REGISTRY_OPERATION_SPECS
}

export function listCompleteProfessionalToolOperationSpecs(): readonly ProfessionalToolOperationSpec[] {
  return completeSpecs
}

export function getCoreRegistryOperationSpec(
  toolId: CoreRegistryOperationToolId,
): CoreRegistryOperationSpec | undefined {
  return coreSpecByToolId.get(toolId)
}

export function resolveCompleteProfessionalToolOperationSpec(
  requestedToolName: string,
): ProfessionalToolOperationSpec | undefined {
  const normalized = normalizeProfessionalToolOperationAlias(requestedToolName)
  return normalized ? completeAliasMap.get(normalized) : undefined
}

export function resolveCoreRegistryOperationSpec(
  requestedToolName: string,
): CoreRegistryOperationSpec | undefined {
  const spec = resolveCompleteProfessionalToolOperationSpec(requestedToolName)
  return spec && coreSpecByToolId.has(spec.canonicalToolId)
    ? coreSpecByToolId.get(spec.canonicalToolId)
    : undefined
}

export function summarizeCompleteProfessionalToolOperationCoverage(): CompleteProfessionalToolOperationCoverageSummary {
  const canonicalCounts = countValues(completeSpecs.map((spec) => spec.canonicalToolId))
  const operationCounts = countValues(completeSpecs.flatMap((spec) => spec.allowedOperationIds))
  const coveredIds = new Set(completeSpecs.map((spec) => spec.canonicalToolId))
  const policyBlockedToolIds = CORE_REGISTRY_OPERATION_SPECS
    .filter((spec) => spec.disposition === 'policy_blocked')
    .map((spec) => spec.canonicalToolId as CoreRegistryOperationToolId)

  return {
    productionProfileCount: productionToolProfiles.length,
    boundedAdapterSpecCount: boundedSpecs.length,
    coreRegistryOnlySpecCount: CORE_REGISTRY_OPERATION_SPECS.length,
    completeCanonicalSpecCount: completeSpecs.length,
    completeAliasIdentityCount: completeAliasMap.size,
    duplicateCanonicalToolIds: duplicates(canonicalCounts) as ProductionToolId[],
    duplicateOperationIds: duplicates(operationCounts),
    unclassifiedPlannerSelectableToolIds: productionToolProfiles
      .filter((profile) => !coveredIds.has(profile.toolId))
      .map((profile) => profile.toolId),
    coreRegistryCandidateCount: CORE_REGISTRY_OPERATION_SPECS.length - policyBlockedToolIds.length,
    coreRegistryNonCallableCount: policyBlockedToolIds.length,
    completeProductReadyCount: 0,
    coreRegistryPolicyBlockedToolIds: policyBlockedToolIds,
    notes: [
      'Coverage is derived from the live production registry minus the existing bounded 50-spec catalog.',
      'Candidate means a strict fixed contract exists; it does not mean a runner, package, license, model, worker image, deployment, or product path is ready.',
      'Planned candidates remain productReady=false and cannot receive a production lease until their tool-specific runtime evidence gate passes.',
      'Future, license-review/evaluation, and planning-only profiles fail closed with explicit non-callable dispositions.',
      'Hyperframe is limited to an approved manifest handoff contract and never claims backend media processing or frontend implementation.',
    ],
  }
}

function buildOperationSpec(seed: CoreRegistryOperationSeed): CoreRegistryOperationSpec {
  const profile = profileByToolId.get(seed.canonicalToolId)
  if (!profile) throw new Error(`Missing production registry profile for ${seed.canonicalToolId}.`)
  const expected = CORE_REGISTRY_EXPECTED_DISPOSITIONS[
    seed.canonicalToolId as CoreRegistryOperationToolId
  ]
  assertDispositionMatchesProfile(profile, expected)

  const operationId = `tool.${seed.canonicalToolId}.${seed.operationName}.v1`
  const resourceCeilings = resourceCeilingsFor(seed.resourceClass)
  const inputKinds = unique(profile.inputTypes.filter((kind) => kind !== 'none'))
  const qaPolicy = getToolQAPolicy(seed.canonicalToolId)
  const fallbackChains = getFallbackChainsForTool(seed.canonicalToolId)
  const aliases = unique([profile.displayName, seed.canonicalToolId, ...seed.aliases])
  const policyBlockReasons = policyBlockReasonsFor(profile, expected)
  const privateInternalRunnerVerified =
    PRIVATE_INTERNAL_RUNNER_VERIFIED_TOOL_IDS.has(seed.canonicalToolId)

  return {
    schemaVersion: PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION,
    requestedToolName: profile.displayName,
    canonicalToolId: seed.canonicalToolId,
    aliases,
    allowedOperationIds: [operationId],
    disposition: expected.disposition,
    policyBlocks: [...expected.policyBlocks],
    policyBlockReasons,
    sourceContractModes: [`production_registry:${profile.executionMode}`, `adoption_stage:${profile.adoptionStage}`],
    requestSchema: buildRequestSchema({
      operationId,
      inputKinds,
      settingsSchema: seed.settingsSchema,
      resourceCeilings,
      modelManifestRequired: profile.modelWeightPolicy.required,
    }),
    declaredPrivateInputArtifactKinds: inputKinds,
    declaredPrivateOutputArtifactKinds: unique(profile.outputTypes.filter((kind) => kind !== 'none')),
    workerRuntime: workerRuntimeFor(profile, seed, expected),
    networkPolicy: offlineNetworkPolicy(),
    resourceCeilings,
    licenseGate: {
      registryStatus: profile.productionStatus,
      declaredLicense: profile.license,
      licenseFamily: profile.licenseFamily,
      licenseRisk: profile.licenseRisk,
      commercialUseStatus: profile.commercialUseStatus,
      distributionRisk: profile.distributionRisk,
      evidenceRecordRequired: true,
      ownerApprovalRequired: requiresOwnerLicenseApproval(profile),
      blocksUntilSatisfied: true,
    },
    modelGate: {
      modelWeightsRequired: profile.modelWeightPolicy.required,
      exactManifestRequired: profile.modelWeightPolicy.required,
      checkpointHashRequired: profile.modelWeightPolicy.required,
      commercialUseApprovalRequired: profile.modelWeightPolicy.required,
      downloadAtRuntimeAllowed: false,
      callerSelectedModelAllowed: false,
      serverMountedModelOnly: true,
    },
    credentialGate: {
      callerSuppliedCredentialsAllowed: false,
      providerCredentialsAllowed: false,
      secretValuesInRequestAllowed: false,
      serverServiceIdentityRequired: true,
      privateStorageIdentityRequired: true,
      scopedSecretLeaseRequired: false,
      captureAuthorizationRequired: false,
    },
    entrypoint: {
      ...seed.entrypoint,
      fixedInvocationProfileId: `entrypoint.${seed.canonicalToolId}.${seed.operationName}.v1`,
      serverOwned: true,
      implementationStatus: privateInternalRunnerVerified
        ? 'private_internal_runner_verified'
        : 'declared_not_runner_tested',
      callerSuppliedExecutableAllowed: false,
      callerSuppliedArgumentsAllowed: false,
      shellAllowed: false,
      dynamicImportSpecifierAllowed: false,
    },
    qa: {
      gateTypes: [...qaPolicy.gateTypes],
      requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
      requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
      runtimeQaEvidenceRequired: true,
      outputArtifactLineageRequired: true,
      failedRequiredGateBlocksPromotion: true,
      failedRequiredGateBlocksFinalExport: true,
    },
    costEvidence: costEvidenceFor(seed.resourceClass),
    fallback: {
      fallbackToolIds: [...profile.fallbackToolIds],
      fallbackChainIds: fallbackChains.map((chain) => chain.chainId),
      fallbackMustExistInApprovedSnapshot: true,
      fallbackMustPreserveArtifactContract: true,
      fallbackMayNotIncreaseCostWithoutNewApproval: true,
      automaticProviderSubstitutionAllowed: false,
      aiVideoFallbackAllowed: false,
      unresolvedRequiredFailureBlocksFinalExport: true,
      independentWorkMayContinue: true,
      userReviewTriggers: unique([
        'meaning_or_source_truth_change',
        'privacy_or_capture_authorization_change',
        'unapproved_cost_overage',
        'required_output_cannot_pass_qa',
        ...(profile.modelWeightPolicy.required ? ['model_or_checkpoint_substitution'] : []),
      ]),
    },
    requiresApprovedSnapshot: true,
    requiresApprovedWorkItem: true,
    requiresOpaqueWorkerLease: true,
    requiresPrivateArtifacts: true,
    frontendExecutionAllowed: false,
    productReady: false,
    privateInternalExecutionReady: privateInternalRunnerVerified,
    runnerTestEvidenceStatus: privateInternalRunnerVerified
      ? 'private_internal_verified'
      : 'not_verified',
    nextRequiredGate: privateInternalRunnerVerified
      ? 'canonical_private_execution_coordinator_integration'
      : 'tool_specific_runner_integration_and_adversarial_output_test',
    coverageSource: 'production_registry_without_bounded_adapter_contract',
    promotionGate: expected.promotionGate,
    callability: expected.callability,
    fixedContractOnly: true,
  }
}

function buildRequestSchema(input: {
  operationId: string
  inputKinds: readonly ProductionToolInputType[]
  settingsSchema: ProfessionalToolOperationSettingsSchema
  resourceCeilings: ProfessionalToolOperationResourceCeilings
  modelManifestRequired: boolean
}): ProfessionalToolOperationRequestSchema {
  const required = [
    'operationId',
    'approvedSnapshotId',
    'approvedSnapshotHash',
    'workItemId',
    'workItemHash',
    'creditEstimateId',
    'creditReservationId',
    'workerLeaseId',
    'idempotencyKey',
    'artifactBindings',
    'settings',
    ...(input.modelManifestRequired ? ['modelManifestId'] : []),
  ]
  const opaqueId = {
    type: 'string' as const,
    minLength: 8,
    maxLength: 160,
    pattern: OPAQUE_ID_PATTERN,
  }
  const properties: ProfessionalToolOperationRequestSchema['properties'] = {
    operationId: { type: 'string', const: input.operationId },
    approvedSnapshotId: opaqueId,
    approvedSnapshotHash: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
    workItemId: opaqueId,
    workItemHash: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
    creditEstimateId: opaqueId,
    creditReservationId: opaqueId,
    workerLeaseId: opaqueId,
    idempotencyKey: opaqueId,
    artifactBindings: {
      type: 'array',
      minItems: input.inputKinds.length > 0 ? 1 : 0,
      maxItems: 64,
      uniqueArtifactIds: true,
      serverManifestResolutionRequired: true,
      literalPathsAllowed: false,
      literalUrlsAllowed: false,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['artifactId', 'kind', 'sha256', 'byteLength'],
        properties: {
          artifactId: opaqueId,
          kind: { type: 'string', enum: input.inputKinds },
          sha256: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
          byteLength: {
            type: 'integer',
            minimum: 0,
            maximum: input.resourceCeilings.maxInputBytes,
          },
        },
      },
    },
    settings: input.settingsSchema,
  }
  if (input.modelManifestRequired) properties.modelManifestId = opaqueId

  return {
    schemaId: `${input.operationId}.request`,
    type: 'object',
    additionalProperties: false,
    maxSerializedBytes: 128 * 1024,
    required,
    properties,
    prohibitedPropertyNames: PROHIBITED_PROPERTY_NAMES,
    prohibitedStringForms: PROHIBITED_STRING_FORMS,
    callerSelectedWorkspaceOrProjectAllowed: false,
    rawChatOrPromptAllowed: false,
    arbitraryCommandAllowed: false,
    arbitraryArgumentsAllowed: false,
    arbitraryCodeAllowed: false,
    arbitraryEnvironmentAllowed: false,
    arbitraryPathsAllowed: false,
    arbitraryUrlsAllowed: false,
  }
}

function workerRuntimeFor(
  profile: ProductionToolProfile,
  seed: CoreRegistryOperationSeed,
  expected: ExpectedDisposition,
): ProfessionalToolOperationWorkerRuntime {
  if (
    expected.disposition === 'policy_blocked' ||
    profile.workerType === 'planning_only' ||
    profile.workerType === 'frontend_preview_only'
  ) {
    return {
      registryWorkerType: profile.workerType,
      imageRole: 'none_policy_blocked',
      imageDefinition: profile.workerType === 'frontend_preview_only'
        ? 'frontend_preview_boundary_no_backend_worker_assigned'
        : 'not_assigned_until_product_policy_promotion',
      runtimeClass: 'not_assignable_policy_blocked',
      privateFilesystemRequired: true,
      readOnlyRootFilesystemRequired: true,
      unprivilegedUserRequired: true,
      isolatedTemporaryDirectoryRequired: true,
      sourceArtifactsMountedReadOnly: true,
    }
  }

  const imageRole = imageRoleFor(profile.workerType)
  let runtimeClass: ProfessionalToolOperationWorkerRuntime['runtimeClass']
  if (seed.entrypoint.kind === 'fixed_binary') {
    runtimeClass = imageRole === 'render_worker' ? 'native_render_worker' : 'native_cpu_worker'
  } else if (seed.entrypoint.kind === 'node_library') {
    runtimeClass = imageRole === 'render_worker' ? 'node24_render_worker' : 'node24_cpu_worker'
  } else {
    runtimeClass = imageRole === 'gpu_worker' ? 'python3_cuda12_gpu_worker' : 'python3_cpu_worker'
  }

  return {
    registryWorkerType: profile.workerType,
    imageRole,
    imageDefinition: imageDefinitionFor(imageRole),
    runtimeClass,
    privateFilesystemRequired: true,
    readOnlyRootFilesystemRequired: true,
    unprivilegedUserRequired: true,
    isolatedTemporaryDirectoryRequired: true,
    sourceArtifactsMountedReadOnly: true,
  }
}

function imageRoleFor(workerType: ProductionRegistryWorkerType): ProfessionalToolOperationWorkerRuntime['imageRole'] {
  if (workerType === 'gpu_ai_worker') return 'gpu_worker'
  if (workerType === 'render_worker') return 'render_worker'
  if (workerType === 'tool_readiness_worker') return 'tool_readiness_worker'
  return 'cpu_worker'
}

function imageDefinitionFor(imageRole: ProfessionalToolOperationWorkerRuntime['imageRole']): string {
  if (imageRole === 'gpu_worker') return 'docker/prod/gpu-worker/Dockerfile'
  if (imageRole === 'render_worker') return 'docker/prod/render-worker/Dockerfile'
  if (imageRole === 'tool_readiness_worker') return 'docker/prod/tool-readiness-worker/Dockerfile'
  if (imageRole === 'cpu_worker') return 'docker/prod/cpu-worker/Dockerfile'
  return 'not_assigned_until_product_policy_promotion'
}

function offlineNetworkPolicy(): ProfessionalToolOperationNetworkPolicy {
  return {
    mode: 'offline_required',
    denyByDefault: true,
    packageOrModelDownloadsAllowed: false,
    providerCallsAllowed: false,
    callerSuppliedTargetsAllowed: false,
    rawUrlsAllowed: false,
    fileDataJavascriptSchemesAllowed: false,
    privateIpTargetsAllowed: false,
    redirectReauthorizationRequired: true,
    dnsAndResolvedIpRevalidationRequired: true,
    approvedDestinationKinds: [],
    networkGrantRequired: false,
    notes: [
      'The operation must complete with worker egress disabled.',
      'All packages, models, fonts, styles, and source artifacts must already exist in approved private runtime inputs.',
    ],
  }
}

function resourceCeilingsFor(resourceClass: ProfessionalToolOperationResourceClass): ProfessionalToolOperationResourceCeilings {
  const base = resourceCeilingBase(resourceClass)
  return {
    ...base,
    maxNetworkRequests: 0,
    maxNetworkResponseBytes: 0,
    terminateProcessTreeOnTimeout: true,
    outputVerificationBeforePromotion: true,
  }
}

function resourceCeilingBase(resourceClass: ProfessionalToolOperationResourceClass): Omit<
  ProfessionalToolOperationResourceCeilings,
  'maxNetworkRequests' | 'maxNetworkResponseBytes' | 'terminateProcessTreeOnTimeout' | 'outputVerificationBeforePromotion'
> {
  if (resourceClass === 'render_2d') return ceilings(600_000, 4, 4_096, 0, 8_192, 4_096, 8_192, 7_200, 216_000, 16)
  if (resourceClass === 'render_3d') return ceilings(600_000, 4, 4_096, 0, 4_096, 512, 2_048, 300, 9_000, 4)
  if (resourceClass === 'gpu_video') return ceilings(1_800_000, 4, 16_384, 1, 16_384, 4_096, 8_192, 600, 18_000, 8)
  if (resourceClass === 'gpu_audio') return ceilings(3_600_000, 4, 16_384, 1, 8_192, 4_096, 4_096, 14_400, 0, 8)
  if (resourceClass === 'cpu_audio_analysis') return ceilings(900_000, 4, 8_192, 0, 4_096, 4_096, 1_024, 14_400, 0, 8)
  if (resourceClass === 'cpu_audio_process') return ceilings(1_200_000, 4, 8_192, 0, 8_192, 4_096, 4_096, 14_400, 0, 8)
  if (resourceClass === 'cpu_image_process') return ceilings(600_000, 4, 8_192, 0, 8_192, 4_096, 4_096, 0, 2_000, 64)
  if (resourceClass === 'render_binary_validation') return ceilings(1_800_000, 4, 8_192, 0, 16_384, 8_192, 8_192, 7_200, 216_000, 16)
  return ceilings(1_800_000, 4, 8_192, 0, 16_384, 8_192, 8_192, 7_200, 216_000, 16)
}

function ceilings(
  timeoutMs: number,
  vcpuLimit: number,
  memoryMiBLimit: number,
  gpuLimit: 0 | 1,
  temporaryStorageMiBLimit: number,
  maxInputMiB: number,
  maxOutputMiB: number,
  maxInputDurationSeconds: number,
  maxFrames: number,
  maxOutputArtifacts: number,
): Omit<
  ProfessionalToolOperationResourceCeilings,
  'maxNetworkRequests' | 'maxNetworkResponseBytes' | 'terminateProcessTreeOnTimeout' | 'outputVerificationBeforePromotion'
> {
  return {
    timeoutMs,
    maxAttemptsPerApprovedWorkItem: 3,
    vcpuLimit,
    memoryMiBLimit,
    gpuLimit,
    temporaryStorageMiBLimit,
    maxInputBytes: maxInputMiB * 1024 * 1024,
    maxOutputBytes: maxOutputMiB * 1024 * 1024,
    maxInputDurationSeconds,
    maxFrames,
    maxOutputArtifacts,
  }
}

function costEvidenceFor(resourceClass: ProfessionalToolOperationResourceClass): ProfessionalToolOperationCostEvidenceRequirements {
  const deterministicRenderer = resourceClass === 'render_2d' || resourceClass === 'render_3d'
  const gpu = resourceClass === 'gpu_video' || resourceClass === 'gpu_audio'
  const units: ProfessionalToolOperationCostUnit[] = ['operation', 'cpu_millisecond', 'input_mebibyte']
  if (gpu) units.push('gpu_millisecond')
  if (resourceClass.includes('audio')) units.push('input_audio_second')
  if (resourceClass === 'gpu_video' || resourceClass === 'cpu_media_analysis' || resourceClass === 'render_binary_validation') {
    units.push('input_video_second')
  }
  if (deterministicRenderer || resourceClass === 'render_binary_validation') {
    units.push('output_frame', 'output_megapixel')
  }

  return {
    sourceKind: deterministicRenderer || resourceClass === 'render_binary_validation'
      ? 'deterministic_renderer'
      : 'infrastructure_runtime',
    units: unique(units),
    requiredMeasurements: unique([
      'startedAt',
      'completedAt',
      'wallTimeMilliseconds',
      'attemptNumber',
      'inputBytes',
      'outputBytes',
      'peakMemoryMiB',
      'vcpuMilliseconds',
      ...(gpu ? ['gpuMilliseconds'] : []),
      ...(resourceClass.includes('audio') ? ['inputAudioSeconds'] : []),
      ...(resourceClass === 'gpu_video' || resourceClass === 'cpu_media_analysis' || resourceClass === 'render_binary_validation'
        ? ['inputVideoSeconds']
        : []),
      ...(deterministicRenderer || resourceClass === 'render_binary_validation'
        ? ['outputFrames', 'outputMegapixelFrames']
        : []),
    ]),
    estimateLineItemRequiredBeforeExecution: true,
    activeReservationRequiredBeforeExecution: true,
    actualCostEventRequiredAfterActualWork: true,
    exactOperationAndAttemptLineageRequired: true,
    idempotentCostEventRequired: true,
    actualInternalToolCostOnly: true,
    serviceFeeIncluded: false,
    callerSuppliedCostAllowed: false,
    walletMutationAllowedByRunner: false,
    settlementAllowedByRunner: false,
  }
}

function candidate(promotionGate: 'launch_core_candidate' | 'planned_candidate'): ExpectedDisposition {
  return {
    disposition: 'edit_operation_candidate',
    promotionGate,
    callability: 'real_candidate',
    policyBlocks: [],
  }
}

function blocked(
  promotionGate: Exclude<CoreRegistryOperationPromotionGate, 'launch_core_candidate' | 'planned_candidate'>,
  policyBlocks: readonly ProfessionalToolOperationPolicyBlock[],
): ExpectedDisposition {
  return {
    disposition: 'policy_blocked',
    promotionGate,
    callability: 'non_callable_policy_disposition',
    policyBlocks,
  }
}

function assertDispositionMatchesProfile(profile: ProductionToolProfile, expected: ExpectedDisposition): void {
  if (expected.promotionGate === 'launch_core_candidate' && profile.productionStatus !== 'launch_core') {
    throw new Error(`${profile.toolId} launch candidate disposition no longer matches registry status.`)
  }
  if (expected.promotionGate === 'planned_candidate' && profile.productionStatus !== 'planned') {
    throw new Error(`${profile.toolId} planned candidate disposition no longer matches registry status.`)
  }
  if (expected.promotionGate === 'future_only' && profile.productionStatus !== 'future') {
    throw new Error(`${profile.toolId} future-only disposition no longer matches registry status.`)
  }
  if (expected.promotionGate === 'license_review_only' && profile.productionStatus !== 'needs_license_review') {
    throw new Error(`${profile.toolId} license-review disposition no longer matches registry status.`)
  }
  if (expected.promotionGate === 'evaluation_only' && profile.productionStatus !== 'evaluation_only') {
    throw new Error(`${profile.toolId} evaluation disposition no longer matches registry status.`)
  }
  if (expected.policyBlocks.includes('planning_only') && profile.workerType !== 'planning_only') {
    throw new Error(`${profile.toolId} planning-only disposition no longer matches registry worker type.`)
  }
  if (expected.disposition === 'policy_blocked' && expected.policyBlocks.length === 0) {
    throw new Error(`${profile.toolId} policy-blocked disposition must name at least one policy block.`)
  }
}

function policyBlockReasonsFor(profile: ProductionToolProfile, expected: ExpectedDisposition): string[] {
  const reasons: string[] = []
  if (expected.promotionGate === 'future_only') {
    reasons.push(`${profile.toolId} is future-only and has not been promoted into a callable product lane.`)
  }
  if (expected.promotionGate === 'license_review_only') {
    reasons.push(`${profile.toolId} is non-callable until commercial-use, distribution, and license evidence is approved.`)
  }
  if (expected.promotionGate === 'evaluation_only') {
    reasons.push(`${profile.toolId} is evaluation-only and cannot receive an execution lease.`)
  }
  if (expected.policyBlocks.includes('planning_only')) {
    reasons.push(`${profile.toolId} has planning metadata only and no approved worker ownership.`)
  }
  return reasons
}

function requiresOwnerLicenseApproval(profile: ProductionToolProfile): boolean {
  return profile.licenseRisk !== 'low' ||
    profile.commercialUseStatus !== 'allowed' ||
    profile.distributionRisk !== 'low' ||
    profile.licenseFamily === 'gpl' ||
    profile.licenseFamily === 'agpl' ||
    profile.licenseFamily === 'lgpl' ||
    profile.modelWeightPolicy.required
}

function buildCompleteAliasMap(
  specs: readonly ProfessionalToolOperationSpec[],
): Map<string, ProfessionalToolOperationSpec> {
  const aliases = new Map<string, ProfessionalToolOperationSpec>()
  for (const spec of specs) {
    for (const alias of spec.aliases) {
      const normalized = normalizeProfessionalToolOperationAlias(alias)
      if (!normalized) throw new Error(`Invalid tool alias declared for ${spec.canonicalToolId}: ${alias}`)
      const existing = aliases.get(normalized)
      if (existing && existing.canonicalToolId !== spec.canonicalToolId) {
        throw new Error(
          `Complete tool alias collision: ${alias} resolves to both ${existing.canonicalToolId} and ${spec.canonicalToolId}.`,
        )
      }
      aliases.set(normalized, spec)
    }
  }
  return aliases
}

function assertExactDerivedCoverage(): void {
  const seedIds = CORE_REGISTRY_OPERATION_SEEDS.map((seed) => seed.canonicalToolId)
  if (DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS.length !== 22) {
    throw new Error(`Expected exactly 22 registry-only operation profiles, found ${DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS.length}.`)
  }
  if (!sameValues(seedIds, DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS)) {
    throw new Error('Core registry operation seeds must exactly match the profiles missing from the bounded operation catalog.')
  }
  if (new Set(seedIds).size !== seedIds.length) {
    throw new Error('Core registry operation seeds contain a duplicate canonical tool identity.')
  }
}

function assertCompleteCoverage(): void {
  const summary = summarizeCompleteProfessionalToolOperationCoverage()
  if (summary.productionProfileCount !== 72 || summary.completeCanonicalSpecCount !== 72) {
    throw new Error(`Complete professional tool operation coverage must remain exactly 72/72; received ${summary.completeCanonicalSpecCount}/${summary.productionProfileCount}.`)
  }
  if (summary.duplicateCanonicalToolIds.length > 0 || summary.duplicateOperationIds.length > 0) {
    throw new Error('Complete professional tool operation coverage contains duplicate execution identities.')
  }
  if (summary.unclassifiedPlannerSelectableToolIds.length > 0) {
    throw new Error(`Unclassified production tool profiles: ${summary.unclassifiedPlannerSelectableToolIds.join(', ')}.`)
  }
  if (completeSpecs.some((spec) => spec.productReady)) {
    throw new Error('A professional tool operation claimed product readiness without tool-specific runner evidence.')
  }
}

function nodeSeed<T extends ProductionToolId>(
  canonicalToolId: T,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  importName: string,
  callableSymbol: string,
): CoreRegistryOperationSeed & { canonicalToolId: T } {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    entrypoint: { kind: 'node_library', packageName, importName, callableSymbol },
  }
}

function pythonSeed<T extends ProductionToolId>(
  canonicalToolId: T,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  importName: string,
  callableSymbol: string,
): CoreRegistryOperationSeed & { canonicalToolId: T } {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    entrypoint: { kind: 'python_library', packageName, importName, callableSymbol },
  }
}

function binarySeed<T extends ProductionToolId>(
  canonicalToolId: T,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  commandName: string,
): CoreRegistryOperationSeed & { canonicalToolId: T } {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    entrypoint: { kind: 'fixed_binary', packageName, commandName },
  }
}

function strictSettings(
  properties: Readonly<Record<string, ProfessionalToolOperationSettingConstraint>>,
  required: readonly string[],
): ProfessionalToolOperationSettingsSchema {
  return {
    type: 'object',
    additionalProperties: false,
    maxProperties: Object.keys(properties).length,
    required,
    properties,
  }
}

function opaqueIdConstraint(): ProfessionalToolOperationSettingConstraint {
  return { type: 'string', minLength: 8, maxLength: 160, pattern: OPAQUE_ID_PATTERN }
}

function constConstraint(value: string): ProfessionalToolOperationSettingConstraint {
  return { type: 'string', const: value }
}

function enumConstraint(values: readonly string[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'string', enum: values }
}

function numberConstraint(minimum: number, maximum: number): ProfessionalToolOperationSettingConstraint {
  return { type: 'number', minimum, maximum }
}

function integerConstraint(minimum: number, maximum: number): ProfessionalToolOperationSettingConstraint {
  return { type: 'integer', minimum, maximum }
}

function numberEnumConstraint(values: readonly number[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'number', enum: values }
}

function integerEnumConstraint(values: readonly number[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'integer', enum: values }
}

function booleanConstraint(constant?: boolean): ProfessionalToolOperationSettingConstraint {
  return { type: 'boolean', const: constant }
}

function countValues<T extends string>(values: readonly T[]): Map<T, number> {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

function duplicates<T extends string>(counts: Map<T, number>): T[] {
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index])
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  return value
}
