import type { ProductionToolId } from '../tool-registry'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  listCompleteProfessionalToolOperationSpecs,
} from './core-registry-operations/core-registry-operation-specs'
import {
  OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES,
} from './node-runner-execution/offline-node-structured-execution-service'
import {
  OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES,
} from './python-runner-execution/offline-python-structured-execution-service'
import { OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES } from './browser-graphics-execution/offline-browser-graphics-protocol'
import { OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES } from './ai-capability-execution/offline-ai-capability-protocol'
import { OFFLINE_NATIVE_IMAGE_PIPELINE_PACKAGE_IDENTITIES } from './native-image-pipeline-execution/offline-native-image-pipeline-protocol'
import { OFFLINE_NATIVE_AUDIO_PROCESSING_PACKAGE_IDENTITIES } from './native-audio-processing-execution/offline-native-audio-processing-protocol'
import { OFFLINE_CONTAINER_PACKAGING_VALIDATION_PACKAGE_IDENTITIES } from './container-packaging-validation-execution/offline-container-packaging-validation-protocol'
import { OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PACKAGE_IDENTITIES } from './vapoursynth-frame-pipeline-execution/offline-vapoursynth-frame-pipeline-protocol'
import { OFFLINE_AUDIOFLUX_ANALYSIS_PACKAGE_IDENTITIES } from './audioflux-analysis-execution/offline-audioflux-analysis-protocol'
import { OFFLINE_REMBG_BACKGROUND_REMOVAL_PACKAGE_IDENTITIES } from './rembg-background-removal-execution/offline-rembg-background-removal-protocol'
import { OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY } from './deepfilternet-voice-cleanup-execution/offline-deepfilternet-voice-cleanup-protocol'

export const PROVEN_TOOL_IDENTITY_CATALOG_VERSION = 'proven-tool-identity-catalog-v1' as const
export const PROVEN_TOOL_EVIDENCE_REVISION = '2026-07-15.30' as const

export type ToolVerificationState =
  | 'canonical_e2e_verified'
  | 'confined_runner_verified'
  | 'declared_not_runner_verified'
  | 'intentionally_non_executable'

export type ProvenToolRunnerClass =
  | 'offline_node_structured_execution_v1'
  | 'offline_sharp_structured_execution_v1'
  | 'offline_python_structured_execution_v1'
  | 'offline_media_binary_execution_v1'
  | 'offline_remotion_render_execution_v1'
  | 'offline_libass_caption_execution_v1'
  | 'offline_browser_graphics_execution_v1'
  | 'offline_ai_capability_execution_v1'
  | 'offline_native_image_pipeline_execution_v1'
  | 'offline_native_audio_processing_execution_v1'
  | 'offline_container_packaging_validation_execution_v1'
  | 'offline_vapoursynth_frame_pipeline_execution_v1'
  | 'offline_audioflux_analysis_execution_v1'
  | 'offline_rembg_background_removal_execution_v1'
  | 'offline_deepfilternet_voice_cleanup_execution_v1'

export interface ProvenToolGateEvidence {
  exactOperationIdentityVerified: boolean
  pinnedPackageOrBinaryVerified: boolean
  actualConfinedOperationVerified: boolean
  approvedSnapshotAndWorkItemBound: boolean
  fundedReservationBound: boolean
  leaseAndOneUseDispatchBound: boolean
  approvedInputAuthorityBound: boolean
  privateArtifactPersisted: boolean
  actualQaPassed: boolean
  reconciliationPassed: boolean
  exactIdempotentReplayPassed: boolean
  downstreamLeaseVerificationPassed: boolean
}

export interface ProvenToolIdentityRecord {
  schemaVersion: typeof PROVEN_TOOL_IDENTITY_CATALOG_VERSION
  evidenceRevision: typeof PROVEN_TOOL_EVIDENCE_REVISION
  stableToolIdentity: string
  canonicalToolId: ProductionToolId
  displayName: string
  operationId: string
  operationSpecHash: string
  callability: 'callable_candidate' | 'intentionally_non_executable'
  verificationState: ToolVerificationState
  runtime: {
    runnerClass: ProvenToolRunnerClass | null
    packageOrBinaryName: string
    pinnedVersion: string | null
    networkMode: 'none' | 'not_verified'
    frontendExecutionAllowed: false
  }
  artifactContract: {
    declaredPrivateInputKinds: readonly string[]
    declaredPrivateOutputKinds: readonly string[]
    verifiedOutputContentTypes: readonly string[]
  }
  evidence: {
    runnerSmokeCommand: string | null
    canonicalLifecycleSmokeCommand: string | null
    canonicalEvidenceKey: string | null
    canonicalJobAdapterSmokeCommand: string | null
    canonicalJobAdapterEvidenceKey: string | null
    gates: ProvenToolGateEvidence
  }
  readiness: {
    privateInternalRunnerReady: boolean
    privateInternalEndToEndReady: boolean
    privateInternalJobAdapterReady: boolean
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
  blockers: readonly string[]
  identityHash: string
  proofHash: string
}

const CANONICAL_E2E_EVIDENCE_KEYS: Partial<Record<ProductionToolId, string>> = {
  d3: 'coordinator_consumes_dispatch_and_runs_actual_confined_d3_operation_under_lease_fence',
  echarts: 'echarts_exact_svg_canonical_lifecycle_verified',
  vega_lite: 'vega_lite_exact_svg_canonical_lifecycle_verified',
  vega: 'vega_exact_svg_canonical_lifecycle_verified',
  satori: 'satori_exact_svg_canonical_lifecycle_verified',
  svg_js: 'svg_js_exact_svg_canonical_lifecycle_verified',
  viz_js: 'viz_js_exact_svg_canonical_lifecycle_verified',
  animejs: 'animejs_exact_svg_canonical_lifecycle_verified',
  three_js: 'three_js_exact_svg_canonical_lifecycle_verified',
  lottie: 'lottie_exact_png_canonical_lifecycle_verified',
  pixijs: 'pixijs_exact_png_canonical_lifecycle_verified',
  konva: 'konva_exact_png_canonical_lifecycle_verified',
  babylon_js: 'babylon_js_exact_png_canonical_lifecycle_verified',
  playwright: 'playwright_authorized_internal_capture_png_canonical_lifecycle_verified',
  sharp: 'sharp_actual_png_artifact_qa_reconciliation_and_idempotent_replay',
  duckdb: 'python_coordinator_commits_actual_json_artifact_qa_and_reconciliation',
  pyav: 'media_json_artifact_qa_reconciliation_and_idempotent_replay',
  polars: 'polars_exact_json_canonical_lifecycle_verified',
  opentimelineio: 'opentimelineio_exact_json_canonical_lifecycle_verified',
  opencv: 'opencv_exact_json_canonical_lifecycle_verified',
  pyscenedetect: 'pyscenedetect_exact_json_canonical_lifecycle_verified',
  scipy: 'scipy_approved_audio_signal_analysis_json_qa_reconciliation_replay_and_downstream_verification',
  pyloudnorm: 'pyloudnorm_approved_audio_loudness_json_qa_reconciliation_replay_and_downstream_verification',
  pydub: 'pydub_approved_audio_processing_wav_qa_reconciliation_replay_and_downstream_verification',
  pydub_effects: 'pydub_effects_approved_recipe_wav_qa_reconciliation_replay_and_downstream_verification',
  ebu_r128_pyloudnorm: 'explicit_ebu_r128_json_qa_reconciliation_replay_and_downstream_verification',
  audioread: 'audioread_decode_json_qa_reconciliation_replay_and_downstream_verification',
  resampy: 'resampy_private_wav_qa_reconciliation_replay_and_downstream_verification',
  pedalboard: 'pedalboard_private_wav_qa_reconciliation_replay_and_downstream_verification',
  mir_eval: 'mir_eval_timing_json_qa_reconciliation_replay_and_downstream_verification',
  mido: 'mido_timing_json_qa_reconciliation_replay_and_downstream_verification',
  pretty_midi: 'pretty_midi_exact_json_canonical_lifecycle_verified',
  noisereduce: 'noisereduce_exact_wav_canonical_lifecycle_verified',
  librosa: 'librosa_exact_json_canonical_lifecycle_verified',
  ffprobe: 'ffprobe_json_artifact_actual_qa_reconciliation_and_idempotent_replay',
  ffmpeg: 'ffmpeg_private_media_artifact_actual_qa_reconciliation_and_idempotent_replay',
  remotion: 'remotion_source_caption_private_final_mp4_canonical_lifecycle_verified',
  libass: 'libass_caption_overlay_png_canonical_lifecycle_verified',
  music21: 'music21_exact_json_canonical_lifecycle_verified',
  kornia: 'kornia_exact_png_canonical_lifecycle_verified',
  opencolorio: 'opencolorio_exact_png_canonical_lifecycle_verified',
  openimageio: 'openimageio_exact_png_canonical_lifecycle_verified',
  rnnoise: 'rnnoise_exact_wav_canonical_lifecycle_verified',
  signalsmith_stretch: 'signalsmith_stretch_exact_wav_canonical_lifecycle_verified',
  mkvtoolnix_container_validation: 'mkvtoolnix_container_validation_exact_json_canonical_lifecycle_verified',
  gpac_mp4box_packaging_validation: 'gpac_mp4box_packaging_validation_exact_json_canonical_lifecycle_verified',
  vapoursynth: 'vapoursynth_exact_json_canonical_lifecycle_verified',
  audioflux: 'audioflux_exact_json_canonical_lifecycle_verified',
  rembg: 'rembg_exact_png_canonical_lifecycle_verified',
  deepfilternet: 'deepfilternet_exact_wav_canonical_lifecycle_verified',
}

const CANONICAL_JOB_ADAPTER_EVIDENCE_KEYS: Partial<Record<ProductionToolId, string>> = {
  d3: 'server_derived_job_adapter_executes_d3_and_dependency_bound_sharp_identities',
  echarts: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  vega_lite: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  vega: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  satori: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  svg_js: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  viz_js: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  animejs: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  three_js: 'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
  lottie: 'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
  pixijs: 'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
  konva: 'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
  babylon_js: 'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
  playwright: 'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
  music21: 'server_derived_job_adapter_executes_bounded_ai_capability_tool_identities',
  kornia: 'server_derived_job_adapter_executes_bounded_ai_capability_tool_identities',
  opencolorio: 'server_derived_job_adapter_executes_native_image_tool_identities',
  openimageio: 'server_derived_job_adapter_executes_native_image_tool_identities',
  rnnoise: 'server_derived_job_adapter_executes_native_audio_tool_identities',
  signalsmith_stretch: 'server_derived_job_adapter_executes_native_audio_tool_identities',
  mkvtoolnix_container_validation: 'server_derived_job_adapter_executes_container_packaging_tool_identities',
  gpac_mp4box_packaging_validation: 'server_derived_job_adapter_executes_container_packaging_tool_identities',
  vapoursynth: 'server_derived_job_adapter_executes_vapoursynth_frame_pipeline_identity',
  audioflux: 'server_derived_job_adapter_executes_audioflux_analysis_identity',
  rembg: 'server_derived_job_adapter_executes_rembg_background_removal_identity',
  deepfilternet: 'server_derived_job_adapter_executes_deepfilternet_with_attempt_cost_evidence',
  pretty_midi: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  noisereduce: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  polars: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  opentimelineio: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  opencv: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  pyscenedetect: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  librosa: 'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
  audioread: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  pydub: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  scipy: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  resampy: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  pyloudnorm: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  mido: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  pedalboard: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  mir_eval: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  pydub_effects: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  ebu_r128_pyloudnorm: 'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
  ffmpeg: 'server_derived_job_adapter_executes_libass_and_source_bound_ffmpeg_identities',
  ffprobe: 'canonical_job_adapter_replays_final_artifact_qa_without_a_second_ffprobe_execution',
  pyav: 'server_derived_job_adapter_executes_duckdb_and_source_bound_pyav_identities',
  remotion: 'eight_job_canonical_work_graph_completes_snapshot_trim_two_captions_two_voice_tracks_final_composition_and_final_qa',
  libass: 'server_derived_job_adapter_executes_libass_and_source_bound_ffmpeg_identities',
  sharp: 'server_derived_job_adapter_executes_d3_and_dependency_bound_sharp_identities',
  duckdb: 'server_derived_job_adapter_executes_duckdb_and_source_bound_pyav_identities',
}

const OUTPUT_CONTENT_TYPES: Partial<Record<ProductionToolId, readonly string[]>> = {
  d3: ['image/svg+xml'], echarts: ['image/svg+xml'], vega_lite: ['image/svg+xml'],
  vega: ['image/svg+xml'], satori: ['image/svg+xml'], svg_js: ['image/svg+xml'],
  viz_js: ['image/svg+xml'], sharp: ['image/png', 'image/jpeg', 'image/webp'],
  animejs: ['image/svg+xml'],
  three_js: ['image/svg+xml'],
  pydub: ['audio/wav'], pydub_effects: ['audio/wav'], resampy: ['audio/wav'],
  pedalboard: ['audio/wav'], ffmpeg: ['video/x-nut', 'video/x-matroska', 'audio/wav'],
  noisereduce: ['audio/wav'],
  remotion: ['video/mp4'],
  libass: ['image/png'],
  lottie: ['image/png'], pixijs: ['image/png'], konva: ['image/png'],
  babylon_js: ['image/png'], playwright: ['image/png'],
  kornia: ['image/png'],
  opencolorio: ['image/png'], openimageio: ['image/png'],
  rnnoise: ['audio/wav'], signalsmith_stretch: ['audio/wav'],
  mkvtoolnix_container_validation: ['application/json'], gpac_mp4box_packaging_validation: ['application/json'],
  vapoursynth: ['application/json'],
  audioflux: ['application/json'],
  rembg: ['image/png'],
  deepfilternet: ['audio/wav'],
}

const specs = listCompleteProfessionalToolOperationSpecs()
const records = specs.map((spec): ProvenToolIdentityRecord => {
  const runtime = runtimeIdentity(spec.canonicalToolId)
  const canonicalEvidenceKey = CANONICAL_E2E_EVIDENCE_KEYS[spec.canonicalToolId] ?? null
  const canonicalJobAdapterEvidenceKey =
    CANONICAL_JOB_ADAPTER_EVIDENCE_KEYS[spec.canonicalToolId] ?? null
  const callable = spec.policyBlocks.length === 0
  const endToEnd = Boolean(canonicalEvidenceKey)
  const verificationState: ToolVerificationState = !callable
    ? 'intentionally_non_executable'
    : endToEnd
      ? 'canonical_e2e_verified'
      : runtime
        ? 'confined_runner_verified'
        : 'declared_not_runner_verified'
  const verifiedOutputContentTypes = runtime
    ? [...(OUTPUT_CONTENT_TYPES[spec.canonicalToolId] ?? ['application/json'])]
    : []
  const identityCore = {
    schemaVersion: PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    canonicalToolId: spec.canonicalToolId,
    operationId: spec.allowedOperationIds[0]!,
    operationSpecHash: sha256AuthorityValue(spec),
  }
  const gates = gateEvidence(Boolean(runtime), endToEnd)
  const proofCore = {
    ...identityCore,
    verificationState,
    runtime: runtime ?? null,
    canonicalEvidenceKey,
    canonicalJobAdapterEvidenceKey,
    gates,
    verifiedOutputContentTypes,
  }
  return deepFreeze({
    ...identityCore,
    stableToolIdentity: `reeditpro.tool.${spec.canonicalToolId}.v1`,
    displayName: spec.requestedToolName,
    callability: callable ? 'callable_candidate' : 'intentionally_non_executable',
    verificationState,
    runtime: runtime ?? {
      runnerClass: null, packageOrBinaryName: spec.entrypoint.packageName,
      pinnedVersion: null, networkMode: 'not_verified', frontendExecutionAllowed: false,
    },
    artifactContract: {
      declaredPrivateInputKinds: [...spec.declaredPrivateInputArtifactKinds],
      declaredPrivateOutputKinds: [...spec.declaredPrivateOutputArtifactKinds],
      verifiedOutputContentTypes,
    },
    evidence: {
      runnerSmokeCommand: runtime ? runnerSmokeCommand(runtime.runnerClass!) : null,
      canonicalLifecycleSmokeCommand: endToEnd ? 'npm run smoke:canonical-private-tool-dispatch' : null,
      canonicalEvidenceKey,
      canonicalJobAdapterSmokeCommand: canonicalJobAdapterEvidenceKey
        ? 'npm run smoke:canonical-private-tool-dispatch'
        : null,
      canonicalJobAdapterEvidenceKey,
      gates,
    },
    readiness: {
      privateInternalRunnerReady: Boolean(runtime),
      privateInternalEndToEndReady: endToEnd,
      privateInternalJobAdapterReady: Boolean(canonicalJobAdapterEvidenceKey),
      productReady: false, externalBetaReady: false, productionReady: false,
    },
    blockers: blockers(spec.canonicalToolId, verificationState, spec.policyBlockReasons),
    identityHash: sha256AuthorityValue(identityCore),
    proofHash: sha256AuthorityValue(proofCore),
  })
})

validateCatalog(records)

export const PROVEN_TOOL_IDENTITY_CATALOG: readonly ProvenToolIdentityRecord[] = deepFreeze(records)

export function listProvenToolIdentityCatalog(): readonly ProvenToolIdentityRecord[] {
  return PROVEN_TOOL_IDENTITY_CATALOG
}

export function getToolIdentityRecord(toolId: ProductionToolId): ProvenToolIdentityRecord {
  const record = PROVEN_TOOL_IDENTITY_CATALOG.find((candidate) => candidate.canonicalToolId === toolId)
  if (!record) throw new Error(`Canonical tool identity is missing: ${toolId}`)
  return record
}

export function getProvenEndToEndToolIdentity(
  toolId: ProductionToolId,
): ProvenToolIdentityRecord | undefined {
  const record = PROVEN_TOOL_IDENTITY_CATALOG.find((candidate) => candidate.canonicalToolId === toolId)
  return record?.readiness.privateInternalEndToEndReady ? record : undefined
}

export function summarizeProvenToolIdentityCatalog() {
  return deepFreeze({
    schemaVersion: PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    totalRegistryProfiles: records.length,
    callableCandidateCount: records.filter((record) => record.callability === 'callable_candidate').length,
    intentionallyNonExecutableCount: records.filter((record) => record.callability === 'intentionally_non_executable').length,
    confinedRunnerVerifiedCount: records.filter((record) => record.readiness.privateInternalRunnerReady).length,
    canonicalEndToEndVerifiedCount: records.filter((record) => record.readiness.privateInternalEndToEndReady).length,
    canonicalEndToEndVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalEndToEndReady)
      .map((record) => record.canonicalToolId),
    canonicalJobAdapterVerifiedCount: records
      .filter((record) => record.readiness.privateInternalJobAdapterReady).length,
    canonicalJobAdapterVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalJobAdapterReady)
      .map((record) => record.canonicalToolId),
  })
}

function runtimeIdentity(toolId: ProductionToolId): ProvenToolIdentityRecord['runtime'] | undefined {
  if (Object.hasOwn(OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_NODE_STRUCTURED_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: toolId === 'sharp'
        ? 'offline_sharp_structured_execution_v1'
        : 'offline_node_structured_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_PYTHON_STRUCTURED_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_python_structured_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (toolId === 'ffmpeg' || toolId === 'ffprobe') {
    return {
      runnerClass: 'offline_media_binary_execution_v1',
      packageOrBinaryName: toolId, pinnedVersion: '8.1.2',
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (toolId === 'remotion') {
    return {
      runnerClass: 'offline_remotion_render_execution_v1',
      packageOrBinaryName: 'remotion+@remotion/renderer', pinnedVersion: '4.0.487',
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (toolId === 'libass') {
    return {
      runnerClass: 'offline_libass_caption_execution_v1',
      packageOrBinaryName: 'libass', pinnedVersion: '0.17.5',
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_browser_graphics_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_ai_capability_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_NATIVE_IMAGE_PIPELINE_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_NATIVE_IMAGE_PIPELINE_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_NATIVE_IMAGE_PIPELINE_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_native_image_pipeline_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_NATIVE_AUDIO_PROCESSING_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_NATIVE_AUDIO_PROCESSING_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_NATIVE_AUDIO_PROCESSING_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_native_audio_processing_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_CONTAINER_PACKAGING_VALIDATION_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_CONTAINER_PACKAGING_VALIDATION_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_container_packaging_validation_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_vapoursynth_frame_pipeline_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_AUDIOFLUX_ANALYSIS_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_AUDIOFLUX_ANALYSIS_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_AUDIOFLUX_ANALYSIS_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_audioflux_analysis_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (Object.hasOwn(OFFLINE_REMBG_BACKGROUND_REMOVAL_PACKAGE_IDENTITIES, toolId)) {
    const identity = OFFLINE_REMBG_BACKGROUND_REMOVAL_PACKAGE_IDENTITIES[
      toolId as keyof typeof OFFLINE_REMBG_BACKGROUND_REMOVAL_PACKAGE_IDENTITIES
    ]
    return {
      runnerClass: 'offline_rembg_background_removal_execution_v1',
      packageOrBinaryName: identity.packageName, pinnedVersion: identity.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  if (toolId === 'deepfilternet') {
    return {
      runnerClass: 'offline_deepfilternet_voice_cleanup_execution_v1',
      packageOrBinaryName: `${OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY.packageName}+${OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY.nativePackageName}`,
      pinnedVersion: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY.version,
      networkMode: 'none', frontendExecutionAllowed: false,
    }
  }
  return undefined
}

function runnerSmokeCommand(runnerClass: ProvenToolRunnerClass): string {
  if (runnerClass === 'offline_python_structured_execution_v1') {
    return 'npm run smoke:offline-python-structured-execution'
  }
  if (runnerClass === 'offline_media_binary_execution_v1') {
    return 'npm run smoke:offline-media-binary-execution'
  }
  if (runnerClass === 'offline_remotion_render_execution_v1') {
    return 'npm run smoke:offline-remotion-render-execution'
  }
  if (runnerClass === 'offline_libass_caption_execution_v1') {
    return 'npm run smoke:offline-libass-caption-execution'
  }
  if (runnerClass === 'offline_sharp_structured_execution_v1') {
    return 'npm run smoke:offline-sharp-structured-execution'
  }
  if (runnerClass === 'offline_browser_graphics_execution_v1') {
    return 'npm run smoke:offline-browser-graphics-execution'
  }
  if (runnerClass === 'offline_ai_capability_execution_v1') {
    return 'npm run smoke:offline-ai-capability-execution'
  }
  if (runnerClass === 'offline_native_image_pipeline_execution_v1') {
    return 'npm run smoke:offline-native-image-pipeline-execution'
  }
  if (runnerClass === 'offline_native_audio_processing_execution_v1') {
    return 'npm run smoke:offline-native-audio-processing-execution'
  }
  if (runnerClass === 'offline_container_packaging_validation_execution_v1') {
    return 'npm run smoke:offline-container-packaging-validation-execution'
  }
  if (runnerClass === 'offline_vapoursynth_frame_pipeline_execution_v1') {
    return 'npm run smoke:offline-vapoursynth-frame-pipeline-execution'
  }
  if (runnerClass === 'offline_audioflux_analysis_execution_v1') {
    return 'npm run smoke:offline-audioflux-analysis-execution'
  }
  if (runnerClass === 'offline_rembg_background_removal_execution_v1') {
    return 'npm run smoke:offline-rembg-background-removal-execution'
  }
  if (runnerClass === 'offline_deepfilternet_voice_cleanup_execution_v1') {
    return 'npm run smoke:offline-deepfilternet-voice-cleanup-execution'
  }
  return 'npm run smoke:offline-node-structured-execution'
}

function gateEvidence(runtime: boolean, endToEnd: boolean): ProvenToolGateEvidence {
  return deepFreeze({
    exactOperationIdentityVerified: runtime,
    pinnedPackageOrBinaryVerified: runtime,
    actualConfinedOperationVerified: runtime,
    approvedSnapshotAndWorkItemBound: endToEnd,
    fundedReservationBound: endToEnd,
    leaseAndOneUseDispatchBound: endToEnd,
    approvedInputAuthorityBound: endToEnd,
    privateArtifactPersisted: endToEnd,
    actualQaPassed: endToEnd,
    reconciliationPassed: endToEnd,
    exactIdempotentReplayPassed: endToEnd,
    downstreamLeaseVerificationPassed: endToEnd,
  })
}

function blockers(
  toolId: ProductionToolId,
  state: ToolVerificationState,
  policyReasons: readonly string[],
): readonly string[] {
  if (state === 'intentionally_non_executable') return [...policyReasons]
  const promotion = [
    'distributed_worker_and_service_identity_not_verified',
    'deployed_private_storage_and_observability_not_verified',
    'product_external_beta_and_production_promotion_not_verified',
  ]
  if (state === 'canonical_e2e_verified') return promotion
  if (state === 'confined_runner_verified') {
    return ['exact_tool_canonical_lifecycle_evidence_missing', ...promotion]
  }
  return [
    ...unverifiedToolSpecificBlockers(toolId),
    'actual_confined_operation_evidence_missing',
    'exact_tool_canonical_lifecycle_evidence_missing',
    ...promotion,
  ]
}

function unverifiedToolSpecificBlockers(toolId: ProductionToolId): readonly string[] {
  const blockers: Partial<Record<ProductionToolId, readonly string[]>> = {
    torch_torchvision: ['exact_torch_torchvision_container_tensor_and_vision_fixture_proof_missing'],
    transformers: ['exact_transformers_offline_no_model_runtime_fixture_proof_missing'],
    sam2: ['reviewed_sam2_model_manifest_checkpoint_hash_and_offline_tracking_fixture_missing'],
    birefnet: ['reviewed_birefnet_model_manifest_checkpoint_hash_and_offline_foreground_fixture_missing'],
    real_esrgan: ['reviewed_real_esrgan_model_manifest_checkpoint_hash_and_enhancement_fixture_missing'],
    kornia: ['exact_kornia_torch_runtime_and_mask_refinement_fixture_proof_missing'],
    faster_whisper: ['reviewed_faster_whisper_model_manifest_offline_cache_and_alignment_fixture_missing'],
    music21: ['exact_music21_structure_analysis_fixture_and_canonical_artifact_proof_missing'],
    rnnoise: ['pinned_rnnoise_build_voice_fixture_and_denoised_audio_qa_proof_missing'],
    deepfilternet: ['reviewed_deepfilternet_model_manifest_checkpoint_hash_and_voice_fixture_missing'],
    opencolorio: ['pinned_opencolorio_config_transform_fixture_and_color_qa_proof_missing'],
    openimageio: ['pinned_openimageio_sequence_fixture_and_private_image_artifact_qa_proof_missing'],
    streamer_render_pipeline_support: ['pinned_gstreamer_binary_plugin_closure_and_pipeline_fixture_proof_missing'],
    mkvtoolnix_container_validation: ['pinned_mkvtoolnix_binary_and_private_mkv_validation_fixture_proof_missing'],
    gpac_mp4box_packaging_validation: ['pinned_gpac_mp4box_binary_and_private_mp4_validation_fixture_proof_missing'],
    hyperframe: ['exact_hyperframe_timeline_handoff_runtime_and_structured_artifact_proof_missing'],
    paddleocr: ['reviewed_paddleocr_model_manifest_offline_cache_and_text_region_fixture_missing'],
    demucs: ['reviewed_demucs_model_manifest_checkpoint_hash_and_audio_stem_fixture_missing'],
    signalsmith_stretch: ['pinned_signalsmith_stretch_build_and_timing_preserving_audio_fixture_proof_missing'],
    film: ['reviewed_film_model_manifest_checkpoint_hash_and_frame_interpolation_fixture_missing'],
    vapoursynth: ['pinned_vapoursynth_runtime_plugin_closure_and_frame_pipeline_fixture_proof_missing'],
  }
  return blockers[toolId] ?? []
}

function validateCatalog(catalog: readonly ProvenToolIdentityRecord[]): void {
  if (catalog.length !== 72) throw new Error('Proven tool identity catalog must cover all 72 profiles.')
  if (catalog.filter((record) => record.callability === 'callable_candidate').length !== 61) {
    throw new Error('Proven tool identity catalog callable partition changed unexpectedly.')
  }
  for (const key of ['stableToolIdentity', 'identityHash', 'proofHash'] as const) {
    if (new Set(catalog.map((record) => record[key])).size !== catalog.length) {
      throw new Error(`Proven tool identity catalog contains duplicate ${key}.`)
    }
  }
  for (const record of catalog) {
    const allCanonicalGates = Object.entries(record.evidence.gates)
      .filter(([key]) => ![
        'exactOperationIdentityVerified', 'pinnedPackageOrBinaryVerified',
        'actualConfinedOperationVerified',
      ].includes(key))
      .every(([, value]) => value)
    if (record.readiness.privateInternalEndToEndReady !== allCanonicalGates) {
      throw new Error(`Canonical E2E proof gates are inconsistent for ${record.canonicalToolId}.`)
    }
    if (record.readiness.privateInternalEndToEndReady && !record.readiness.privateInternalRunnerReady) {
      throw new Error(`Canonical E2E tool lacks runner proof: ${record.canonicalToolId}.`)
    }
    if (
      record.readiness.privateInternalJobAdapterReady &&
      (!record.readiness.privateInternalEndToEndReady || !record.evidence.canonicalJobAdapterEvidenceKey)
    ) {
      throw new Error(`Canonical job-adapter proof is inconsistent for ${record.canonicalToolId}.`)
    }
    if (record.callability === 'intentionally_non_executable' && record.readiness.privateInternalRunnerReady) {
      throw new Error(`Non-executable tool cannot have a proven runner: ${record.canonicalToolId}.`)
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
  }
  return value
}
