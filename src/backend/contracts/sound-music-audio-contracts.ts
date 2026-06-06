import type {
  SoundArtifactKind,
  SoundBlockedUseReason,
  SoundExecutionGateAllowedMode,
  SoundExecutionGateInput,
  SoundExecutionGateResult,
  SoundExecutionMode,
  SoundMusicWorkstreamId,
  SoundProviderId,
  SoundProviderPolicy,
  SoundRelatedWorkstreamId,
  SoundRuntimePolicy,
  SoundRuntimeTarget,
  SoundToolId,
} from '../../types/audio-music'

export const SOUND_MUSIC_WORKSTREAM_ID: SoundMusicWorkstreamId = 'SOUND_MUSIC_AUDIO'

export const SOUND_RELATED_WORKSTREAM_IDS = [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
] as const satisfies readonly SoundRelatedWorkstreamId[]

export const SOUND_EXPLICIT_NON_OWNERSHIP = [
  'final Track A render/export validation',
  'final mux/export/delivery validation',
  'visual graphics tools',
  'map/geospatial stack',
  'general Track B media/video/image processing',
  'general Track B audio processing unless explicitly handed off',
  'provider gateway/fallback/transport/secrets unless explicitly approved later',
  'raw worker execution from chat prompts',
  'worker dispatch/runtime infrastructure',
  'Supabase staging/production mutation',
  'Supabase migrations unless explicitly approved by SUPABASE_RLS_STORAGE_DATABASE',
  'billing/Stripe/payment operations',
  'production/beta unlock',
] as const

export type SoundToolAllowedRole = 'sound_agent'
export type SoundOwnerSystem = 'SoundSync' | 'Sound Agent'
export type SoundToolBetaStatus = 'planning_only_mock_safe'

export interface SoundToolRegistryMetadata {
  toolId: SoundToolId
  displayName: string
  description: string
  ownerWorkstream: SoundMusicWorkstreamId
  ownerSystem: SoundOwnerSystem
  relatedWorkstreams: SoundRelatedWorkstreamId[]
  allowedRole: SoundToolAllowedRole
  allowedExecutionModes: SoundExecutionMode[]
  requiresApprovalForGeneration: true
  requiresCreditGateForGeneration: true
  allowedArtifactKinds: SoundArtifactKind[]
  runtimePolicyKey: string
  providerPolicyKeys: SoundProviderId[]
  failClosed: true
  currentBetaStatus: SoundToolBetaStatus
  productionEnabled: false
  betaEnabled: false
  externalBetaEnabled: false
  paidProductionEnabled: false
}

export type SoundTaskRuntimeKind =
  | 'sound_agent_planner'
  | 'action_foley_sfx_tool_planning'
  | 'ambient_everyday_soundscape_tool_planning'
  | 'music_cue_planning'
  | 'soundsync_planning'
  | 'provider_routing'
  | 'license_check'
  | 'credit_estimate_metadata'
  | 'private_audio_artifact_manifest_builder'
  | 'timing_aware_cue_manifest_builder'
  | 'audio_qa_metadata'
  | 'ffmpeg_loudness_resampling_mixing'
  | 'audioflux_analysis'
  | 'signalsmith_stretch_pitch'
  | 'dasheng_generation_metadata'
  | 'stable_audio_open_generation_metadata'
  | 'heavy_long_generation_metadata'
  | 'mock_preview'
  | 'disabled_provider'

export interface SoundRuntimeClassificationInput {
  taskKind?: SoundTaskRuntimeKind
  toolId?: SoundToolId
  providerId?: SoundProviderId
  executionMode?: SoundExecutionMode
}

function providerPolicy(input: Omit<SoundProviderPolicy, 'generationEnabled'>): SoundProviderPolicy {
  return {
    ...input,
    generationEnabled: false,
  }
}

const notApplicableMockLicense: SoundProviderPolicy['licensePolicy'] = {
  licenseStatus: 'not_applicable_mock',
  commercialUseStatus: 'commercial_export_blocked',
  commercialExportAllowed: false,
  notes: ['Mock-only metadata. No real generation, export, provider call, or storage write is enabled.'],
}

export const SOUND_PROVIDER_POLICIES = {
  mock_sfx_provider: providerPolicy({
    providerId: 'mock_sfx_provider',
    status: 'mock_only',
    commercialExportAllowed: false,
    runtimeDefault: 'mock_only',
    allowedForPlanning: true,
    licensePolicy: notApplicableMockLicense,
    notes: ['Mock SFX provider metadata only.'],
  }),
  mock_music_provider: providerPolicy({
    providerId: 'mock_music_provider',
    status: 'mock_only',
    commercialExportAllowed: false,
    runtimeDefault: 'mock_only',
    allowedForPlanning: true,
    licensePolicy: notApplicableMockLicense,
    notes: ['Mock music provider metadata only.'],
  }),
  lyria_mock: providerPolicy({
    providerId: 'lyria_mock',
    status: 'mock_only_real_client_placeholder_fail_closed',
    commercialExportAllowed: false,
    runtimeDefault: 'external_provider_gateway',
    allowedForPlanning: true,
    ownerBoundary: 'PROVIDER_GATEWAY_MODELS for real transport',
    licensePolicy: notApplicableMockLicense,
    notes: ['Real Lyria transport belongs to PROVIDER_GATEWAY_MODELS and remains fail-closed.'],
  }),
  mirelo_sfx_mock: providerPolicy({
    providerId: 'mirelo_sfx_mock',
    status: 'mock_only_real_client_placeholder_fail_closed',
    commercialExportAllowed: false,
    runtimeDefault: 'external_provider_gateway',
    allowedForPlanning: true,
    ownerBoundary: 'PROVIDER_GATEWAY_MODELS for real transport',
    licensePolicy: notApplicableMockLicense,
    notes: ['Real Mirelo transport belongs to PROVIDER_GATEWAY_MODELS and remains fail-closed.'],
  }),
  mmaudio_mock: providerPolicy({
    providerId: 'mmaudio_mock',
    status: 'mock_only_real_client_placeholder_fail_closed',
    commercialExportAllowed: false,
    runtimeDefault: 'external_provider_gateway',
    allowedForPlanning: true,
    ownerBoundary: 'PROVIDER_GATEWAY_MODELS for real transport',
    licensePolicy: notApplicableMockLicense,
    notes: ['Real MMAudio transport belongs to PROVIDER_GATEWAY_MODELS and remains fail-closed.'],
  }),
  dasheng_audiogen_candidate: providerPolicy({
    providerId: 'dasheng_audiogen_candidate',
    status: 'candidate_requires_license_dependency_model_card_runtime_quality_review',
    license: 'Apache-2.0 candidate',
    commercialExportAllowed: 'pending_review',
    runtimeDefault: 'gpu_cloud_run_job_l4',
    allowedForPlanning: true,
    defaultFor: ['action_foley_sfx', 'ambient_everyday_soundscape'],
    realExecutionOwnerBoundary: 'PROVIDER_GATEWAY_MODELS plus WORKER_RUNTIME_JOBS',
    licensePolicy: {
      licenseStatus: 'apache_2_candidate',
      commercialUseStatus: 'pending_review',
      commercialExportAllowed: 'pending_review',
      notes: ['Requires license, dependency, model-card, runtime, and quality review before any execution.'],
    },
    notes: ['No model download or execution in SOUND-1B.'],
  }),
  stable_audio_open_license_gated: providerPolicy({
    providerId: 'stable_audio_open_license_gated',
    status: 'conditional_license_gated_optional',
    license: 'Stability AI Community License / conditional',
    commercialExportAllowed: 'conditional_pending_license_review',
    runtimeDefault: 'gpu_cloud_run_job_l4',
    allowedForPlanning: true,
    fallbackFor: ['ambient_everyday_soundscape'],
    requiresLicenseGate: true,
    realExecutionOwnerBoundary: 'PROVIDER_GATEWAY_MODELS plus WORKER_RUNTIME_JOBS',
    licensePolicy: {
      licenseStatus: 'stability_ai_community_license_conditional',
      commercialUseStatus: 'conditional_pending_license_review',
      commercialExportAllowed: 'conditional_pending_license_review',
      requiresLicenseGate: true,
      notes: ['Conditional license gate required before any commercial/export use.'],
    },
    notes: ['Metadata only. No model download, fallback routing, or provider execution is enabled.'],
  }),
  openmoss_moss_soundeffect_v2_pending_verification: providerPolicy({
    providerId: 'openmoss_moss_soundeffect_v2_pending_verification',
    status: 'disabled_until_model_card_weights_license_runtime_quality_verified',
    license: 'unknown_until_reverified',
    commercialExportAllowed: false,
    runtimeDefault: 'blocked',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'unknown_until_reverified',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Disabled until model card, weights, license, runtime, and quality are verified.'],
    },
    notes: ['Disabled from planning execution and generation.'],
  }),
  meta_audiogen_disabled: providerPolicy({
    providerId: 'meta_audiogen_disabled',
    status: 'disabled_for_commercial_production',
    license: 'non_commercial_public_weights',
    commercialExportAllowed: false,
    runtimeDefault: 'blocked',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'non_commercial_public_weights',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Disabled for commercial production use.'],
    },
    notes: ['Disabled; do not route to real generation.'],
  }),
  woosh_disabled: providerPolicy({
    providerId: 'woosh_disabled',
    status: 'disabled_until_license_policy_changes',
    commercialExportAllowed: false,
    runtimeDefault: 'blocked',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'license_policy_change_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Disabled until license policy changes and is reviewed.'],
    },
    notes: ['Disabled; do not route to real generation.'],
  }),
  tangoflux_disabled: providerPolicy({
    providerId: 'tangoflux_disabled',
    status: 'disabled_until_license_policy_changes',
    commercialExportAllowed: false,
    runtimeDefault: 'blocked',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'license_policy_change_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Disabled until license policy changes and is reviewed.'],
    },
    notes: ['Disabled; do not route to real generation.'],
  }),
  mmaudio_disabled: providerPolicy({
    providerId: 'mmaudio_disabled',
    status: 'disabled_until_license_policy_changes_for_public_weights',
    commercialExportAllowed: false,
    runtimeDefault: 'blocked',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'license_policy_change_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Disabled until public-weight license policy changes and is reviewed.'],
    },
    notes: ['Disabled public-weight path; mock MMAudio placeholder remains separate and fail-closed.'],
  }),
  audioflux_analysis_only: providerPolicy({
    providerId: 'audioflux_analysis_only',
    status: 'analysis_processing_only_not_generation_provider',
    commercialExportAllowed: false,
    runtimeDefault: 'cpu_cloud_run_job',
    allowedForPlanning: true,
    licensePolicy: {
      licenseStatus: 'analysis_processing_only',
      commercialUseStatus: 'analysis_only_not_generation',
      commercialExportAllowed: false,
      notes: ['AudioFlux is analysis/processing metadata only, not a generation provider.'],
    },
    notes: ['Open-source analysis candidate. No generation route.'],
  }),
  signalsmith_stretch_processing_only: providerPolicy({
    providerId: 'signalsmith_stretch_processing_only',
    status: 'stretch_pitch_processing_only_not_generation_provider',
    commercialExportAllowed: false,
    runtimeDefault: 'cpu_cloud_run_job',
    allowedForPlanning: true,
    licensePolicy: {
      licenseStatus: 'analysis_processing_only',
      commercialUseStatus: 'processing_only_not_generation',
      commercialExportAllowed: false,
      notes: ['Signalsmith Stretch is stretch/pitch processing metadata only, not a generation provider.'],
    },
    notes: ['Open-source processing candidate. No generation route.'],
  }),
  deepfilternet_review_required: providerPolicy({
    providerId: 'deepfilternet_review_required',
    status: 'cleanup_separation_candidate_requires_model_license_readiness_review',
    commercialExportAllowed: false,
    runtimeDefault: 'cpu_cloud_run_job',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'review_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Requires model/license/readiness review before production cleanup use.'],
    },
    notes: ['Cleanup candidate only; not a generation provider.'],
  }),
  rnnoise_review_required: providerPolicy({
    providerId: 'rnnoise_review_required',
    status: 'cleanup_candidate_requires_license_readiness_review',
    commercialExportAllowed: false,
    runtimeDefault: 'cpu_cloud_run_job',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'review_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Requires license/readiness review before production cleanup use.'],
    },
    notes: ['Cleanup candidate only; not a generation provider.'],
  }),
  demucs_review_required: providerPolicy({
    providerId: 'demucs_review_required',
    status: 'separation_candidate_requires_model_license_readiness_review',
    commercialExportAllowed: false,
    runtimeDefault: 'cpu_cloud_run_job',
    allowedForPlanning: false,
    licensePolicy: {
      licenseStatus: 'review_required',
      commercialUseStatus: 'commercial_export_blocked',
      commercialExportAllowed: false,
      notes: ['Requires model/license/readiness review before production separation use.'],
    },
    notes: ['Separation candidate only; not a generation provider.'],
  }),
} satisfies Record<SoundProviderId, SoundProviderPolicy>

function soundTool(input: Omit<SoundToolRegistryMetadata, 'ownerWorkstream' | 'relatedWorkstreams' | 'allowedRole' | 'requiresApprovalForGeneration' | 'requiresCreditGateForGeneration' | 'failClosed' | 'currentBetaStatus' | 'productionEnabled' | 'betaEnabled' | 'externalBetaEnabled' | 'paidProductionEnabled'>): SoundToolRegistryMetadata {
  return {
    ...input,
    ownerWorkstream: SOUND_MUSIC_WORKSTREAM_ID,
    relatedWorkstreams: [...SOUND_RELATED_WORKSTREAM_IDS],
    allowedRole: 'sound_agent',
    requiresApprovalForGeneration: true,
    requiresCreditGateForGeneration: true,
    failClosed: true,
    currentBetaStatus: 'planning_only_mock_safe',
    productionEnabled: false,
    betaEnabled: false,
    externalBetaEnabled: false,
    paidProductionEnabled: false,
  }
}

export const SOUND_TOOL_REGISTRY_METADATA = {
  action_foley_sfx_tool: soundTool({
    toolId: 'action_foley_sfx_tool',
    displayName: 'Action Foley SFX Tool',
    description: 'Plans action-tied foley accents as metadata only.',
    ownerSystem: 'Sound Agent',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['mock_sfx_provider', 'dasheng_audiogen_candidate'],
  }),
  ambient_everyday_soundscape_tool: soundTool({
    toolId: 'ambient_everyday_soundscape_tool',
    displayName: 'Ambient Everyday Soundscape Tool',
    description: 'Plans ambient everyday soundscapes as metadata only.',
    ownerSystem: 'Sound Agent',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['mock_sfx_provider', 'dasheng_audiogen_candidate', 'stable_audio_open_license_gated'],
  }),
  sfx_director_tool: soundTool({
    toolId: 'sfx_director_tool',
    displayName: 'SFX Director Tool',
    description: 'Coordinates SFX decisions, density, target layer, and handoff metadata.',
    ownerSystem: 'SoundSync',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'sound_readiness_status', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['mock_sfx_provider', 'mirelo_sfx_mock', 'mmaudio_mock'],
  }),
  music_cue_planner: soundTool({
    toolId: 'music_cue_planner',
    displayName: 'Music Cue Planner',
    description: 'Plans music cues, soundtrack layers, and audio beds as metadata only.',
    ownerSystem: 'Sound Agent',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'sound_readiness_status', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['mock_music_provider', 'lyria_mock'],
  }),
  ambient_sound_planner: soundTool({
    toolId: 'ambient_sound_planner',
    displayName: 'Ambient Sound Planner',
    description: 'Plans ambience matching, room tone, and environmental texture metadata.',
    ownerSystem: 'Sound Agent',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'generated_ambient_soundscape_metadata', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['mock_sfx_provider', 'dasheng_audiogen_candidate', 'stable_audio_open_license_gated'],
  }),
  soundsync_planner: soundTool({
    toolId: 'soundsync_planner',
    displayName: 'SoundSync Planner',
    description: 'Plans frame-aware SoundSync cue manifests and speech-first ducking metadata.',
    ownerSystem: 'SoundSync',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'sound_mix_manifest', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_planning',
    providerPolicyKeys: ['audioflux_analysis_only', 'signalsmith_stretch_processing_only'],
  }),
  audio_qa_tool: soundTool({
    toolId: 'audio_qa_tool',
    displayName: 'Audio QA Tool',
    description: 'Plans audio QA evidence for loudness, sync, naturalness, and music-over-voice handoff.',
    ownerSystem: 'SoundSync',
    allowedExecutionModes: ['planning_only', 'benchmark_only', 'blocked'],
    allowedArtifactKinds: ['sound_qa_report', 'sound_readiness_status', 'handoff_notes'],
    runtimePolicyKey: 'cpu_cloud_run_job_qa_metadata',
    providerPolicyKeys: ['audioflux_analysis_only', 'signalsmith_stretch_processing_only'],
  }),
  private_audio_artifact_manifest_builder: soundTool({
    toolId: 'private_audio_artifact_manifest_builder',
    displayName: 'Private Audio Artifact Manifest Builder',
    description: 'Builds private audio artifact manifest metadata with no public or signed URLs.',
    ownerSystem: 'SoundSync',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['private_audio_artifact_manifest', 'sound_readiness_status', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_private_manifest_metadata',
    providerPolicyKeys: ['mock_sfx_provider', 'mock_music_provider'],
  }),
  timing_aware_cue_manifest_builder: soundTool({
    toolId: 'timing_aware_cue_manifest_builder',
    displayName: 'Timing-Aware Cue Manifest Builder',
    description: 'Builds timing-aware sound cue manifest metadata for Track A/Track B handoff.',
    ownerSystem: 'SoundSync',
    allowedExecutionModes: ['planning_only', 'mock_preview_only', 'blocked'],
    allowedArtifactKinds: ['timing_aware_cue_manifest', 'sound_readiness_status', 'handoff_notes'],
    runtimePolicyKey: 'cpu_service_timing_manifest_metadata',
    providerPolicyKeys: ['mock_sfx_provider', 'mock_music_provider', 'audioflux_analysis_only'],
  }),
} satisfies Record<SoundToolId, SoundToolRegistryMetadata>

const cpuServiceTaskKinds = new Set<SoundTaskRuntimeKind>([
  'sound_agent_planner',
  'action_foley_sfx_tool_planning',
  'ambient_everyday_soundscape_tool_planning',
  'music_cue_planning',
  'soundsync_planning',
  'provider_routing',
  'license_check',
  'credit_estimate_metadata',
  'private_audio_artifact_manifest_builder',
  'timing_aware_cue_manifest_builder',
])

const cpuCloudRunTaskKinds = new Set<SoundTaskRuntimeKind>([
  'audio_qa_metadata',
  'ffmpeg_loudness_resampling_mixing',
  'audioflux_analysis',
  'signalsmith_stretch_pitch',
])

const gpuL4TaskKinds = new Set<SoundTaskRuntimeKind>([
  'dasheng_generation_metadata',
  'stable_audio_open_generation_metadata',
])

const blockedProviderIds = new Set<SoundProviderId>([
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
])

export function getSoundProviderPolicy(providerId: SoundProviderId): SoundProviderPolicy {
  return SOUND_PROVIDER_POLICIES[providerId]
}

export function getSoundToolMetadata(toolId: SoundToolId): SoundToolRegistryMetadata {
  return SOUND_TOOL_REGISTRY_METADATA[toolId]
}

export function resolveSoundRuntimeTarget(input: SoundRuntimeClassificationInput): SoundRuntimeTarget {
  if (input.executionMode === 'blocked' || input.taskKind === 'disabled_provider') return 'blocked'
  if (input.executionMode === 'mock_preview_only' || input.taskKind === 'mock_preview') return 'mock_only'
  if (input.providerId && blockedProviderIds.has(input.providerId)) return 'blocked'
  if (input.taskKind && cpuServiceTaskKinds.has(input.taskKind)) return 'cpu_service'
  if (input.taskKind && cpuCloudRunTaskKinds.has(input.taskKind)) return 'cpu_cloud_run_job'
  if (input.taskKind && gpuL4TaskKinds.has(input.taskKind)) return 'gpu_cloud_run_job_l4'
  if (input.taskKind === 'heavy_long_generation_metadata') return 'gpu_cloud_run_job_blackwell'
  if (input.providerId === 'dasheng_audiogen_candidate' || input.providerId === 'stable_audio_open_license_gated') return 'gpu_cloud_run_job_l4'
  if (input.providerId === 'audioflux_analysis_only' || input.providerId === 'signalsmith_stretch_processing_only') return 'cpu_cloud_run_job'
  if (
    input.providerId === 'deepfilternet_review_required' ||
    input.providerId === 'rnnoise_review_required' ||
    input.providerId === 'demucs_review_required'
  ) {
    return 'cpu_cloud_run_job'
  }
  if (input.toolId === 'audio_qa_tool') return 'cpu_cloud_run_job'
  if (input.toolId) return 'cpu_service'
  if (input.providerId) return getSoundProviderPolicy(input.providerId).runtimeDefault
  return 'cpu_service'
}

function handoffsForRuntime(runtimeTarget: SoundRuntimeTarget, providerPolicy?: SoundProviderPolicy): SoundRelatedWorkstreamId[] {
  const handoffs = new Set<SoundRelatedWorkstreamId>(['OBSERVABILITY_AUDIT_COST'])

  if (runtimeTarget === 'cpu_cloud_run_job' || runtimeTarget === 'gpu_cloud_run_job_l4' || runtimeTarget === 'gpu_cloud_run_job_blackwell') {
    handoffs.add('WORKER_RUNTIME_JOBS')
  }

  if (runtimeTarget === 'external_provider_gateway' || providerPolicy?.ownerBoundary || providerPolicy?.realExecutionOwnerBoundary) {
    handoffs.add('PROVIDER_GATEWAY_MODELS')
  }

  handoffs.add('TRACK_A_RENDER_EXPORT')
  handoffs.add('TRACK_B_MEDIA_PROCESSING')
  return [...handoffs]
}

function runtimeBlockedReasons(runtimeTarget: SoundRuntimeTarget): SoundBlockedUseReason[] {
  if (runtimeTarget === 'blocked') return ['runtime_target_blocked']
  if (runtimeTarget === 'mock_only') return ['runtime_target_mock_only']
  return []
}

export function classifySoundTaskRuntime(input: SoundRuntimeClassificationInput): {
  runtimeTarget: SoundRuntimeTarget
  blockedReasons: SoundBlockedUseReason[]
  requiredHandoffs: SoundRelatedWorkstreamId[]
} {
  const runtimeTarget = resolveSoundRuntimeTarget(input)
  const provider = input.providerId ? getSoundProviderPolicy(input.providerId) : undefined

  return {
    runtimeTarget,
    blockedReasons: runtimeBlockedReasons(runtimeTarget),
    requiredHandoffs: handoffsForRuntime(runtimeTarget, provider),
  }
}

export function getSoundRuntimePolicy(input: SoundRuntimeClassificationInput): SoundRuntimePolicy {
  const classification = classifySoundTaskRuntime(input)
  const executionMode = input.executionMode ?? 'planning_only'

  return {
    policyKey: `${classification.runtimeTarget}_${executionMode}`,
    runtimeTarget: classification.runtimeTarget,
    executionMode,
    planningAllowed: classification.runtimeTarget !== 'blocked',
    generationAllowed: false,
    requiresApprovedSnapshot: executionMode === 'approved_generation' || executionMode === 'internal_beta_generation',
    requiresCreditGate: executionMode === 'approved_generation',
    mayCreateGeneratedAsset: false,
    mayDispatchWorker: false,
    mayCallProvider: false,
    requiredHandoffs: classification.requiredHandoffs,
    requiredEvidence: [
      'source-of-truth ownership check',
      'provider policy metadata',
      'runtime target metadata',
      'approval and credit gate metadata when generation is requested',
    ],
    blockedReasons: [
      ...classification.blockedReasons,
      'real_provider_call_blocked',
    ],
  }
}

function modeForExecution(executionMode: SoundExecutionMode): SoundExecutionGateAllowedMode {
  if (executionMode === 'planning_only') return 'planning'
  if (executionMode === 'mock_preview_only') return 'mock'
  if (executionMode === 'benchmark_only') return 'benchmark'
  if (executionMode === 'internal_beta_generation') return 'internal'
  if (executionMode === 'approved_generation') return 'approved'
  return 'blocked'
}

function addReason(reasons: Set<SoundBlockedUseReason>, reason: SoundBlockedUseReason): void {
  reasons.add(reason)
}

function providerLicenseBlocks(providerPolicy: SoundProviderPolicy, commercialExportRequested?: boolean): SoundBlockedUseReason[] {
  const reasons: SoundBlockedUseReason[] = []

  if (!providerPolicy.generationEnabled) reasons.push('provider_generation_disabled')
  if (!providerPolicy.allowedForPlanning && providerPolicy.runtimeDefault === 'blocked') reasons.push('provider_license_blocked')
  if (commercialExportRequested) reasons.push('commercial_export_not_allowed')

  return reasons
}

export function evaluateSoundExecutionGate(input: SoundExecutionGateInput): SoundExecutionGateResult {
  const blockedReasons = new Set<SoundBlockedUseReason>(runtimeBlockedReasons(input.runtimeTarget))
  const allowedMode = modeForExecution(input.executionMode)
  const runtimePolicy = getSoundRuntimePolicy({
    providerId: input.providerPolicy.providerId,
    executionMode: input.executionMode,
  })

  addReason(blockedReasons, 'real_provider_call_blocked')

  if (input.executionMode === 'blocked') {
    addReason(blockedReasons, 'runtime_target_blocked')
  }

  if (input.executionMode === 'planning_only') {
    addReason(blockedReasons, 'generated_asset_not_allowed')
    addReason(blockedReasons, 'storage_object_not_allowed')
  }

  if (input.executionMode === 'mock_preview_only') {
    addReason(blockedReasons, 'generated_asset_not_allowed')
    addReason(blockedReasons, 'storage_object_not_allowed')
    addReason(blockedReasons, 'public_artifact_blocked')
  }

  if (input.executionMode === 'benchmark_only') {
    if (!input.benchmarkScopeApproved || !input.benchmarkProviderAllowed) {
      addReason(blockedReasons, 'benchmark_scope_required')
    }
  }

  if (input.executionMode === 'internal_beta_generation') {
    if (!input.approvedPlanSnapshotId) addReason(blockedReasons, 'approved_snapshot_required')
    if (!input.internalTestScope) addReason(blockedReasons, 'internal_test_scope_required')
    for (const reason of providerLicenseBlocks(input.providerPolicy, input.commercialExportRequested)) {
      addReason(blockedReasons, reason)
    }
    if (!input.workerExecutionAllowed) addReason(blockedReasons, 'worker_execution_not_allowed')
  }

  if (input.executionMode === 'approved_generation') {
    if (!input.approvedPlanSnapshotId) addReason(blockedReasons, 'approved_snapshot_required')
    if (!input.creditEstimateId) addReason(blockedReasons, 'credit_estimate_required')
    if (!input.creditApprovalId) addReason(blockedReasons, 'credit_approval_required')
    if (!input.creditReservationId) addReason(blockedReasons, 'credit_reservation_required')
    for (const reason of providerLicenseBlocks(input.providerPolicy, input.commercialExportRequested ?? true)) {
      addReason(blockedReasons, reason)
    }
    if (input.runtimeTarget === 'mock_only') addReason(blockedReasons, 'runtime_target_mock_only')
    if (!input.toolReadinessEnabled) addReason(blockedReasons, 'tool_readiness_not_enabled')
    if (!input.workerExecutionAllowed) addReason(blockedReasons, 'worker_execution_not_allowed')
  }

  const planningAllowed = input.executionMode === 'planning_only' && input.runtimeTarget !== 'blocked'
  const mockAllowed = input.executionMode === 'mock_preview_only' && input.runtimeTarget === 'mock_only'
  const benchmarkAllowed = input.executionMode === 'benchmark_only' &&
    Boolean(input.benchmarkScopeApproved && input.benchmarkProviderAllowed) &&
    input.runtimeTarget !== 'blocked'
  const allowed = planningAllowed || mockAllowed || benchmarkAllowed

  return {
    allowed,
    allowedMode: allowed ? allowedMode : 'blocked',
    blockedReasons: [...blockedReasons],
    requiredHandoffs: runtimePolicy.requiredHandoffs,
    requiredEvidence: runtimePolicy.requiredEvidence,
    mayCreateGeneratedAsset: false,
    mayDispatchWorker: false,
    mayCallProvider: false,
  }
}
