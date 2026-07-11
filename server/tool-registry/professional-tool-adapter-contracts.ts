import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolInputType,
  ProductionToolOutputType,
} from './production-tool-types'
import { productionToolProfiles } from './production-tool-profiles'
import { getToolQAPolicy } from './tool-qa-policy'

export type ProfessionalToolAdapterMode =
  | 'dry_run'
  | 'bounded_execution'
  | 'readiness_check'
  | 'blocked_until_package_ready'
  | 'blocked_until_model_weight_ready'

export type ProfessionalToolCapabilityFamily =
  | 'data_visual_layer'
  | 'vector_motion_layer'
  | 'three_d_motion_layer'
  | 'mask_background_layer'
  | 'enhancement_layer'
  | 'model_runtime_foundation'
  | 'speech_transcript_layer'
  | 'audio_analysis_layer'
  | 'audio_processing_layer'
  | 'music_timing_layer'
  | 'loudness_qa_layer'
  | 'map_geospatial_layer'
  | 'browser_capture_layer'
  | 'color_image_layer'
  | 'scene_detection_layer'
  | 'render_pipeline_validation_layer'
  | 'container_packaging_layer'

export interface ProfessionalToolAdapterContract {
  requestedToolName: string
  canonicalToolId: ProductionToolId
  capabilityFamily: ProfessionalToolCapabilityFamily
  workerType: ProductionRegistryWorkerType
  modes: ProfessionalToolAdapterMode[]
  userFacingActivity: string
  internalToolSummary: string
  privateInputManifestKinds: ProductionToolInputType[]
  privateOutputManifestKinds: ProductionToolOutputType[]
  qaGates: QualityGateType[]
  requiresApprovedSnapshot: true
  requiresPrivateArtifacts: boolean
  requiresPackageReadiness: boolean
  requiresModelWeightApproval: boolean
  frontendExecutionAllowed: false
  productReady: boolean
  productReadiness: ProfessionalToolAdapterProductReadiness
  blockerNotes: string[]
}

export interface ProfessionalToolAdapterProductReadinessEvidence {
  approvedPlanSnapshotContractReady?: boolean
  packageRuntimeReady?: boolean
  privateArtifactPolicyReady?: boolean
  qaGatePolicyReady?: boolean
  backendWorkerRunnerReady?: boolean
  costGateReady?: boolean
  modelWeightApprovalReady?: boolean
  profilePromotionApproved?: boolean
  productionDeploymentReady?: boolean
}

export interface ProfessionalToolAdapterProductReadiness {
  productReady: boolean
  blockers: string[]
  warnings: string[]
  evidence: Required<ProfessionalToolAdapterProductReadinessEvidence>
}

type ContractSeed = {
  requestedToolName: string
  canonicalToolId: ProductionToolId
  capabilityFamily: ProfessionalToolCapabilityFamily
  userFacingActivity: string
  modes?: ProfessionalToolAdapterMode[]
  requiresPrivateArtifacts?: boolean
}

const dataVisualSeeds: ContractSeed[] = [
  seed('d3', 'd3', 'data_visual_layer', 'Prepare a precise data visual layer'),
  seed('echarts', 'echarts', 'data_visual_layer', 'Prepare a structured chart layer'),
  seed('vega_lite', 'vega_lite', 'data_visual_layer', 'Prepare a declarative chart spec'),
  seed('vega', 'vega', 'data_visual_layer', 'Prepare a rich declarative chart asset'),
  seed('satori', 'satori', 'vector_motion_layer', 'Prepare an exact text card asset'),
  seed('svg_js', 'svg_js', 'vector_motion_layer', 'Prepare a vector overlay asset'),
  seed('viz_js', 'viz_js', 'data_visual_layer', 'Prepare a graph diagram asset'),
]

const motionSeeds: ContractSeed[] = [
  seed('lottie_web', 'lottie', 'vector_motion_layer', 'Prepare a reusable vector motion layer'),
  seed('animejs', 'animejs', 'vector_motion_layer', 'Prepare a controlled motion timeline'),
  seed('three', 'three_js', 'three_d_motion_layer', 'Prepare a controlled 3D visual layer'),
  seed('pixi_js', 'pixijs', 'vector_motion_layer', 'Prepare a 2D motion graphics layer'),
  seed('konva', 'konva', 'vector_motion_layer', 'Prepare an editable canvas overlay'),
  seed('babylonjs', 'babylon_js', 'three_d_motion_layer', 'Prepare an advanced 3D scene layer'),
]

const aiVisionSeeds: ContractSeed[] = [
  seed('torch_torchvision', 'torch_torchvision', 'model_runtime_foundation', 'Verify model runtime readiness', ['readiness_check']),
  seed('transformers', 'transformers', 'model_runtime_foundation', 'Verify model adapter readiness', ['readiness_check']),
  seed('sam2', 'sam2', 'mask_background_layer', 'Prepare a tracked mask pass', ['dry_run', 'blocked_until_model_weight_ready'], true),
  seed('birefnet', 'birefnet', 'mask_background_layer', 'Prepare a foreground cutout pass', ['dry_run', 'blocked_until_model_weight_ready'], true),
  seed('rembg', 'rembg', 'mask_background_layer', 'Prepare a fallback cutout pass', ['dry_run', 'bounded_execution'], true),
  seed('transparent_background', 'transparent_background', 'mask_background_layer', 'Prepare a fallback background-removal pass', ['dry_run', 'blocked_until_model_weight_ready'], true),
  seed('real_esrgan', 'real_esrgan', 'enhancement_layer', 'Prepare an enhancement sample pass', ['dry_run', 'blocked_until_model_weight_ready'], true),
  seed('kornia', 'kornia', 'mask_background_layer', 'Prepare mask refinement checks', ['dry_run', 'bounded_execution'], true),
]

const speechModelSeeds: ContractSeed[] = [
  seed('faster_whisper', 'faster_whisper', 'speech_transcript_layer', 'Prepare speech transcript timing', ['dry_run', 'bounded_execution'], true),
  seed('whisper_cpp', 'whisper_cpp', 'speech_transcript_layer', 'Prepare fallback speech transcript evaluation', ['dry_run'], true),
]

const musicAudioSeeds: ContractSeed[] = [
  seed('librosa', 'librosa', 'audio_analysis_layer', 'Analyze rhythm and timing cues', ['dry_run', 'bounded_execution'], true),
  seed('audioread', 'audioread', 'audio_analysis_layer', 'Verify source audio readability', ['dry_run', 'bounded_execution'], true),
  seed('pydub', 'pydub', 'audio_processing_layer', 'Prepare bounded audio polish steps', ['dry_run', 'bounded_execution'], true),
  seed('scipy', 'scipy', 'audio_analysis_layer', 'Prepare signal quality measurements', ['dry_run', 'bounded_execution'], true),
  seed('resampy', 'resampy', 'audio_processing_layer', 'Prepare sample-rate normalization checks', ['dry_run', 'bounded_execution'], true),
  seed('pyloudnorm', 'pyloudnorm', 'loudness_qa_layer', 'Measure voice-first loudness readiness', ['dry_run', 'bounded_execution'], true),
  seed('audioflux', 'audioflux', 'audio_analysis_layer', 'Analyze beat and energy cues', ['dry_run', 'bounded_execution'], true),
  seed('music21', 'music21', 'music_timing_layer', 'Prepare music-structure timing notes', ['dry_run', 'bounded_execution'], true),
  seed('pretty_midi', 'pretty_midi', 'music_timing_layer', 'Prepare symbolic music timing cues', ['dry_run', 'bounded_execution'], true),
  seed('mido', 'mido', 'music_timing_layer', 'Validate symbolic timing events', ['dry_run', 'bounded_execution'], true),
  seed('noisereduce', 'noisereduce', 'audio_processing_layer', 'Prepare bounded noise cleanup steps', ['dry_run', 'bounded_execution'], true),
  seed('pedalboard', 'pedalboard', 'audio_processing_layer', 'Prepare bounded audio effect checks', ['dry_run', 'bounded_execution'], true),
  seed('mir_eval', 'mir_eval', 'music_timing_layer', 'Score music timing alignment', ['dry_run', 'bounded_execution'], true),
  seed('pydub_effects', 'pydub_effects', 'audio_processing_layer', 'Prepare approved audio effect recipes', ['dry_run', 'bounded_execution'], true),
  seed('ebu_r128_pyloudnorm', 'ebu_r128_pyloudnorm', 'loudness_qa_layer', 'Verify delivery loudness gates', ['dry_run', 'bounded_execution'], true),
  seed('rnnoise', 'rnnoise', 'audio_processing_layer', 'Prepare lightweight voice cleanup checks', ['dry_run', 'bounded_execution'], true),
]

const audioModelSeeds: ContractSeed[] = [
  seed('deepfilternet', 'deepfilternet', 'audio_processing_layer', 'Prepare model-gated voice cleanup checks', ['dry_run', 'bounded_execution'], true),
]

const mapBrowserColorSceneSeeds: ContractSeed[] = [
  seed('maplibre', 'maplibre', 'map_geospatial_layer', 'Prepare a controlled map layer', ['dry_run']),
  seed('turf', 'turf', 'map_geospatial_layer', 'Prepare route and location geometry', ['dry_run']),
  seed('deck_gl', 'deck_gl', 'map_geospatial_layer', 'Prepare an advanced map overlay plan', ['dry_run']),
  seed('playwright', 'playwright', 'browser_capture_layer', 'Prepare an approved page capture plan', ['dry_run', 'bounded_execution'], true),
  seed('pyscenedetect', 'pyscenedetect', 'scene_detection_layer', 'Prepare scene boundary checks', ['dry_run', 'bounded_execution'], true),
  seed('opencolorio', 'opencolorio', 'color_image_layer', 'Prepare color-management checks', ['dry_run', 'bounded_execution'], true),
  seed('openimageio', 'openimageio', 'color_image_layer', 'Prepare professional image pipeline checks', ['dry_run', 'bounded_execution'], true),
]

const renderPackagingSeeds: ContractSeed[] = [
  seed(
    'streamer_render_pipeline_support',
    'streamer_render_pipeline_support',
    'render_pipeline_validation_layer',
    'Validate internal render pipeline support',
    ['dry_run', 'readiness_check', 'bounded_execution'],
  ),
  seed(
    'mkvtoolnix_container_validation',
    'mkvtoolnix_container_validation',
    'container_packaging_layer',
    'Validate private container packaging readiness',
    ['dry_run', 'bounded_execution'],
    true,
  ),
  seed(
    'gpac_mp4box_packaging_validation',
    'gpac_mp4box_packaging_validation',
    'container_packaging_layer',
    'Validate private package delivery readiness',
    ['dry_run', 'bounded_execution'],
    true,
  ),
]

const requestedSeeds = [
  ...dataVisualSeeds,
  ...motionSeeds,
  ...aiVisionSeeds,
  ...speechModelSeeds,
  ...musicAudioSeeds,
  ...audioModelSeeds,
  ...mapBrowserColorSceneSeeds,
  ...renderPackagingSeeds,
]

function seed(
  requestedToolName: string,
  canonicalToolId: ProductionToolId,
  capabilityFamily: ProfessionalToolCapabilityFamily,
  userFacingActivity: string,
  modes: ProfessionalToolAdapterMode[] = ['dry_run', 'bounded_execution'],
  requiresPrivateArtifacts = false,
): ContractSeed {
  return { requestedToolName, canonicalToolId, capabilityFamily, userFacingActivity, modes, requiresPrivateArtifacts }
}

export function listProfessionalToolAdapterContracts(): ProfessionalToolAdapterContract[] {
  return requestedSeeds.map(buildContract)
}

export function resolveProfessionalToolAdapterContract(
  requestedToolName: string,
): ProfessionalToolAdapterContract | undefined {
  const normalized = normalizeRequestedToolName(requestedToolName)
  return listProfessionalToolAdapterContracts().find((contract) =>
    normalizeRequestedToolName(contract.requestedToolName) === normalized ||
    normalizeRequestedToolName(contract.canonicalToolId) === normalized
  )
}

export function normalizeRequestedToolName(value: string): string {
  return value.trim().toLowerCase().replace(/[-.\s]+/g, '_')
}

export function summarizeProfessionalToolAdapterContracts(): {
  totalContracts: number
  canonicalToolCount: number
  dataVisualContracts: number
  motionContracts: number
  aiVisionContracts: number
  speechTranscriptContracts: number
  musicAudioContracts: number
  mapBrowserColorSceneContracts: number
  renderPackagingContracts: number
  productReadyContracts: number
  notes: string[]
} {
  const contracts = listProfessionalToolAdapterContracts()
  return {
    totalContracts: contracts.length,
    canonicalToolCount: new Set(contracts.map((contract) => contract.canonicalToolId)).size,
    dataVisualContracts: contracts.filter((contract) => contract.capabilityFamily === 'data_visual_layer').length,
    motionContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'vector_motion_layer' ||
      contract.capabilityFamily === 'three_d_motion_layer'
    ).length,
    aiVisionContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'mask_background_layer' ||
      contract.capabilityFamily === 'enhancement_layer' ||
      contract.capabilityFamily === 'model_runtime_foundation'
    ).length,
    speechTranscriptContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'speech_transcript_layer'
    ).length,
    musicAudioContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'audio_analysis_layer' ||
      contract.capabilityFamily === 'audio_processing_layer' ||
      contract.capabilityFamily === 'music_timing_layer' ||
      contract.capabilityFamily === 'loudness_qa_layer'
    ).length,
    mapBrowserColorSceneContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'map_geospatial_layer' ||
      contract.capabilityFamily === 'browser_capture_layer' ||
      contract.capabilityFamily === 'color_image_layer' ||
      contract.capabilityFamily === 'scene_detection_layer'
    ).length,
    renderPackagingContracts: contracts.filter((contract) =>
      contract.capabilityFamily === 'render_pipeline_validation_layer' ||
      contract.capabilityFamily === 'container_packaging_layer'
    ).length,
    productReadyContracts: contracts.filter((contract) => contract.productReady).length,
    notes: [
      'Adapter contracts are backend-owned and require approved snapshots before execution.',
      'User-facing copy should describe the edit activity, not expose exact package names.',
      'Model-backed adapters are wired, but execution must receive owner-lane model/checkpoint manifest evidence at the approved backend gate.',
    ],
  }
}

export function evaluateProfessionalToolAdapterProductReadiness(
  contract: Pick<
    ProfessionalToolAdapterContract,
    | 'canonicalToolId'
    | 'requiresPackageReadiness'
    | 'requiresPrivateArtifacts'
    | 'requiresModelWeightApproval'
  > & { productionStatus?: string },
  evidence: ProfessionalToolAdapterProductReadinessEvidence = {},
): ProfessionalToolAdapterProductReadiness {
  const needsProfilePromotion = contract.productionStatus === 'future' || contract.productionStatus === 'evaluation_only'
  const normalizedEvidence: Required<ProfessionalToolAdapterProductReadinessEvidence> = {
    approvedPlanSnapshotContractReady: Boolean(evidence.approvedPlanSnapshotContractReady),
    packageRuntimeReady: contract.requiresPackageReadiness ? Boolean(evidence.packageRuntimeReady) : true,
    privateArtifactPolicyReady: contract.requiresPrivateArtifacts ? Boolean(evidence.privateArtifactPolicyReady) : true,
    qaGatePolicyReady: Boolean(evidence.qaGatePolicyReady),
    backendWorkerRunnerReady: Boolean(evidence.backendWorkerRunnerReady),
    costGateReady: Boolean(evidence.costGateReady),
    modelWeightApprovalReady: contract.requiresModelWeightApproval ? Boolean(evidence.modelWeightApprovalReady) : true,
    profilePromotionApproved: needsProfilePromotion ? Boolean(evidence.profilePromotionApproved) : true,
    productionDeploymentReady: Boolean(evidence.productionDeploymentReady),
  }
  const blockers: string[] = []

  if (!normalizedEvidence.approvedPlanSnapshotContractReady) {
    blockers.push(`${contract.canonicalToolId} needs approved snapshot contract evidence before product readiness.`)
  }

  if (!normalizedEvidence.packageRuntimeReady) {
    blockers.push(`${contract.canonicalToolId} needs package/runtime readiness evidence before product readiness.`)
  }

  if (!normalizedEvidence.privateArtifactPolicyReady) {
    blockers.push(`${contract.canonicalToolId} needs private artifact input/output policy evidence before product readiness.`)
  }

  if (!normalizedEvidence.qaGatePolicyReady) {
    blockers.push(`${contract.canonicalToolId} needs QA gate policy evidence before product readiness.`)
  }

  if (!normalizedEvidence.backendWorkerRunnerReady) {
    blockers.push(`${contract.canonicalToolId} needs backend worker/runner integration evidence before product readiness.`)
  }

  if (!normalizedEvidence.costGateReady) {
    blockers.push(`${contract.canonicalToolId} needs credit estimate/reservation cost gate evidence before product readiness.`)
  }

  if (!normalizedEvidence.modelWeightApprovalReady) {
    blockers.push(`${contract.canonicalToolId} needs exact model/checkpoint owner approval before product readiness.`)
  }

  if (!normalizedEvidence.profilePromotionApproved) {
    blockers.push(`${contract.canonicalToolId} needs owner promotion from ${contract.productionStatus} status before product readiness.`)
  }

  if (!normalizedEvidence.productionDeploymentReady) {
    blockers.push(`${contract.canonicalToolId} needs deployment/runbook/observability evidence before product readiness.`)
  }

  return {
    productReady: blockers.length === 0,
    blockers,
    warnings: [
      'Product readiness never permits frontend package execution; backend worker boundaries still apply.',
      'Readiness evidence must come from server/source-of-truth gates, not browser hints.',
    ],
    evidence: normalizedEvidence,
  }
}

function buildContract(seedInput: ContractSeed): ProfessionalToolAdapterContract {
  const profile = productionToolProfiles.find((item) => item.toolId === seedInput.canonicalToolId)
  if (!profile) {
    throw new Error(`Missing production profile for adapter contract: ${seedInput.canonicalToolId}`)
  }

  const qaPolicy = getToolQAPolicy(seedInput.canonicalToolId)
  const requiresModelWeightApproval = profile.modelWeightPolicy.required
  const baseModes = seedInput.modes ?? ['dry_run', 'bounded_execution']
  const modes = requiresModelWeightApproval
    ? Array.from(new Set([...baseModes, 'blocked_until_model_weight_ready' as const]))
    : baseModes
  const requiresPrivateArtifacts = seedInput.requiresPrivateArtifacts || profile.inputTypes.some((kind) =>
    kind === 'source_media' ||
    kind === 'proxy_media' ||
    kind === 'video' ||
    kind === 'audio' ||
    kind === 'image' ||
    kind === 'frame_sequence'
  )
  const requiresPackageReadiness = profile.productionStatus !== 'future' && profile.productionStatus !== 'evaluation_only'
  const productReadiness = evaluateProfessionalToolAdapterProductReadiness({
    canonicalToolId: seedInput.canonicalToolId,
    requiresPackageReadiness,
    requiresPrivateArtifacts,
    requiresModelWeightApproval,
    productionStatus: profile.productionStatus,
  })

  return {
    requestedToolName: seedInput.requestedToolName,
    canonicalToolId: seedInput.canonicalToolId,
    capabilityFamily: seedInput.capabilityFamily,
    workerType: profile.workerType,
    modes,
    userFacingActivity: seedInput.userFacingActivity,
    internalToolSummary: `${profile.displayName}: ${profile.description}`,
    privateInputManifestKinds: profile.requiredArtifacts,
    privateOutputManifestKinds: profile.producedArtifacts,
    qaGates: qaPolicy.gateTypes,
    requiresApprovedSnapshot: true,
    requiresPrivateArtifacts,
    requiresPackageReadiness,
    requiresModelWeightApproval,
    frontendExecutionAllowed: false,
    productReady: productReadiness.productReady,
    productReadiness,
    blockerNotes: [
      'Execution requires approved plan snapshot, idempotency, private artifact references, and cost gates.',
      ...(requiresModelWeightApproval ? ['Exact model/checkpoint manifest approval is required before model-backed execution.'] : []),
      ...(profile.productionStatus === 'future' ? ['Future-only profile; keep as planning/readiness metadata until explicitly promoted.'] : []),
      ...(profile.productionStatus === 'evaluation_only' ? ['Evaluation-only profile; owner promotion is required before production execution.'] : []),
    ],
  }
}
