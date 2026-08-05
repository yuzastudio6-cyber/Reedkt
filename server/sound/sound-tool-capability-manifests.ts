import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import type { SkillScopeLevel } from '../edit-skills/core/skill-capability-manifest-types'
import {
  publishToolCapabilityManifest,
  registerToolCapabilityManifest,
  type ToolCapabilityManifest,
  type ToolClass,
  type ToolExecutionBoundary,
  type ToolOperationCapability,
  type ToolOperationQualificationByMode,
  type UnpublishedToolCapabilityManifest,
} from '../tool-registry'

const allScopes: SkillScopeLevel[] = [
  'clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video',
]

const EVIDENCE = {
  localSoundRuntime: 'sound.evidence.local_audio_real_bytes_v1',
  localSoundQa: 'sound.evidence.local_audio_qa_v1',
  corePrivateRunner: 'sound.evidence.core_registry_private_runner_v1',
  pythonPrivateRunner: 'sound.evidence.python_audio_private_runner_v1',
  mireloFixture: 'sound.evidence.mirelo_injected_transport_v1',
  mireloOfficialProfile: 'sound.evidence.mirelo_official_profile_2026_08_03',
  internalLibraryPlanning: 'sound.evidence.internal_library_planning_v1',
  privateArtifactRuntime: 'sound.evidence.private_artifact_runtime_v1',
  providerAttemptFixture: 'sound.evidence.provider_attempt_reconciliation_fixture_v1',
  controller: 'sound.evidence.controller_smoke_v1',
  soundSync: 'sound.evidence.soundsync_local_smoke_v1',
  declaredCatalog: 'sound.evidence.declared_catalog_only_v1',
  blockedNoRuntime: 'sound.evidence.blocked_no_runtime_v1',
} as const

type QualificationPreset = 'planning' | 'fixture' | 'private' | 'declared' | 'blocked'

function qualification(preset: QualificationPreset): ToolOperationQualificationByMode {
  if (preset === 'planning') return {
    planning: 'planning_qualified', preview_execution: 'blocked', final_execution: 'blocked',
  }
  if (preset === 'fixture') return {
    planning: 'planning_qualified', preview_execution: 'planning_qualified', final_execution: 'planning_qualified',
  }
  if (preset === 'private') return {
    planning: 'internal_execution_qualified',
    preview_execution: 'internal_execution_qualified',
    final_execution: 'internal_execution_qualified',
  }
  if (preset === 'declared') return {
    planning: 'declared', preview_execution: 'blocked', final_execution: 'blocked',
  }
  return { planning: 'blocked', preview_execution: 'blocked', final_execution: 'blocked' }
}

interface OperationSeed {
  operationKey: string
  displayName: string
  description?: string
  jobs: string[]
  preset: QualificationPreset
  evidence: string[]
  mutation?: ToolOperationCapability['mutationPolicy']
  determinism?: ToolOperationCapability['determinism']
  requiredInputs?: string[]
  optionalInputs?: string[]
  accepted?: string[]
  produced?: string[]
  conditioningModes?: string[]
  scopes?: SkillScopeLevel[]
  contentTypes?: string[]
  paid?: boolean
  provider?: boolean
  license?: boolean
  runtime?: boolean
  outputQa?: string[]
  limitations?: string[]
}

function operation(seed: OperationSeed): ToolOperationCapability {
  return {
    operationKey: seed.operationKey,
    operationVersion: '1.0.0',
    displayName: seed.displayName,
    description: seed.description ?? `Bounded Sound operation for ${seed.displayName.toLowerCase()}.`,
    supportedJobTypes: seed.jobs,
    conditioningModes: seed.conditioningModes ?? ['approved_structured_inputs'],
    supportedScopes: seed.scopes ?? allScopes,
    requiredInputs: seed.requiredInputs ?? ['approved_snapshot', 'bounded_authority'],
    optionalInputs: seed.optionalInputs ?? [],
    acceptedArtifactTypes: seed.accepted ?? ['approved_source_audio'],
    producedArtifactTypes: seed.produced ?? [],
    mediaConstraints: {
      acceptedContentTypes: seed.contentTypes ?? ['audio_wav', 'audio_flac', 'audio_mpeg', 'video_mp4'],
      maximumInputBytes: 1_073_741_824,
      maximumInputDurationSeconds: 21_600,
      maximumOutputBytes: 268_435_456,
      maximumOutputDurationSeconds: 21_600,
      allowedSampleRates: [44_100, 48_000],
      allowedChannelCounts: [1, 2],
      carrierVisualMayReplaceApprovedVisual: false,
    },
    mutationPolicy: seed.mutation ?? (seed.produced?.length
      ? 'create_versioned_private_artifact'
      : 'read_only_analysis'),
    determinism: seed.determinism ?? 'deterministic',
    executionRequirements: {
      serverOwnedProfileRequired: true,
      approvedSnapshotRequired: seed.preset !== 'planning' && seed.preset !== 'declared',
      creditReservationRequired: seed.paid === true,
      privateArtifactInputsRequired: seed.preset !== 'planning',
      privateArtifactOutputsRequired: Boolean(seed.produced?.length),
      runtimeAvailabilityRequired: seed.runtime !== false && seed.preset !== 'planning' && seed.preset !== 'declared' && seed.preset !== 'blocked',
      licenseEvidenceRequired: seed.license === true,
      rateCardSnapshotRequired: seed.paid === true,
      arbitraryCommandAllowed: false,
      arbitraryArgumentsAllowed: false,
      arbitraryPathsAllowed: false,
      arbitraryNetworkTargetsAllowed: false,
      callerSuppliedCredentialsAllowed: false,
    },
    qualificationByMode: qualification(seed.preset),
    qualificationEvidenceLevel: seed.preset === 'fixture' ? 'fixture' :
      seed.preset === 'private' ? 'internal_execution' : seed.preset,
    qualificationEvidenceRefs: seed.evidence,
    timeEstimatorKey: `sound.tool.time.${seed.operationKey}.v1`,
    creditEstimatorKey: `sound.tool.credit.${seed.operationKey}.v1`,
    attemptPolicyKey: seed.provider ? 'sound.attempt.provider_reconciled.v1' : 'sound.attempt.local_idempotent.v1',
    requiredPlanningQa: ['scope_authority_qa', 'artifact_lineage_qa'],
    requiredOutputQa: seed.outputQa ?? ['private_artifact_qa', 'media_contract_qa'],
    requiredIntegrationQa: ['range_authority_qa', 'approved_visual_integrity_qa'],
    invalidationRules: [
      'source_hash_changed', 'approved_snapshot_changed', 'tool_manifest_hash_changed',
      'operation_profile_changed',
    ],
    knownLimitations: seed.limitations ?? [],
  }
}

interface ToolSeed {
  toolKey: string
  toolVersion: string
  toolClass: ToolClass
  executionBoundary: ToolExecutionBoundary
  status: SkillQualificationStatus
  evidence: string[]
  operations: OperationSeed[]
  licensePolicyRef: string
  rateCardRef?: string
  runtimeProbeKey: string
  provider?: boolean
  limitations?: string[]
}

function tool(seed: ToolSeed): Readonly<ToolCapabilityManifest> {
  const unpublished: UnpublishedToolCapabilityManifest = {
    manifestSchemaVersion: 'tool-capability-manifest-v1',
    toolManifestId: `tool.manifest.${seed.toolKey}.v1`,
    toolKey: seed.toolKey,
    toolVersion: seed.toolVersion,
    adapterVersion: '1.0.0',
    contractVersion: '1.0.0',
    toolClass: seed.toolClass,
    executionBoundary: seed.executionBoundary,
    owningSystem: 'sound',
    qualificationStatus: seed.status,
    qualificationEvidenceLevel: seed.status === 'internal_execution_qualified'
      ? 'internal_execution'
      : seed.status === 'production_qualified'
        ? 'production'
        : seed.status === 'planning_qualified' && seed.operations.some((operation) => operation.preset === 'fixture')
          ? 'fixture'
          : seed.status === 'blocked' ? 'blocked' : seed.status === 'retired' ? 'retired' : 'planning',
    qualificationEvidenceRefs: seed.evidence,
    operations: seed.operations.map(operation),
    privacyPolicy: {
      policyKey: seed.provider ? 'sound.privacy.external_provider.v1' : 'sound.privacy.private_local.v1',
      privateInputsOnly: true,
      privateOutputsOnly: true,
      providerOutputUntrustedUntilIngestAndQa: seed.provider === true,
      durableProviderUrlsAllowed: false,
      secretValuesAllowedInManifest: false,
      retentionApprovalRequired: seed.provider === true,
    },
    securityPolicy: {
      policyKey: seed.provider ? 'sound.security.external_provider.v1' : 'sound.security.private_local.v1',
      serverOwnedProfilesOnly: true,
      sourceOverwriteAllowed: false,
      checksumValidationRequired: true,
      mediaValidationRequired: true,
      networkDenyByDefault: true,
      callerSelectedExecutableAllowed: false,
      callerSelectedArgumentsAllowed: false,
      callerSelectedPathsAllowed: false,
      callerSelectedProviderRouteAllowed: false,
    },
    licensePolicyRef: seed.licensePolicyRef,
    rateCardRef: seed.rateCardRef ?? 'sound.rate.none.v1',
    runtimeProbeKey: seed.runtimeProbeKey,
    knownLimitations: seed.limitations ?? [],
  }
  return publishToolCapabilityManifest(unpublished)
}

const localEvidence = [EVIDENCE.localSoundRuntime, EVIDENCE.localSoundQa]
const pythonEvidence = [EVIDENCE.pythonPrivateRunner, EVIDENCE.corePrivateRunner]
const generatedSoundJobs = [
  'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
  'generate_foley', 'generate_ambience', 'extend_ambience', 'loop_audio',
]
const deterministicEditJobs = [
  'edit_audio', 'edit_music_technical_automation', 'trim_audio', 'fade_audio', 'adjust_gain', 'normalize_audio',
  'resample_audio', 'convert_audio_channels', 'loop_audio',
]
const qaServiceJobs = [
  ...generatedSoundJobs,
  'repair_audio', 'clean_dialogue', 'reduce_noise',
  'time_stretch_audio', 'pitch_shift_audio',
  'sync_audio_to_visual', 'align_sound_transient',
  'mix_sound_layers', 'create_sound_stem',
  'qa_sound', 'handoff_sound_to_final_composition',
]

const manifests = [
  tool({
    toolKey: 'mirelo_sfx', toolVersion: '1.6', toolClass: 'external_provider',
    executionBoundary: 'server_provider_adapter', status: 'planning_qualified',
    evidence: [EVIDENCE.mireloFixture, EVIDENCE.mireloOfficialProfile],
    licensePolicyRef: 'sound.license.mirelo_commercial_terms_pending.v1',
    rateCardRef: 'sound.rate.mirelo_sfx_credits_per_second.v1',
    runtimeProbeKey: 'sound.runtime.mirelo_sfx_1_6.v1', provider: true,
    limitations: ['Live canary, deployed runtime, privacy opt-out, retention, and commercial-account evidence remain unsatisfied.'],
    operations: [
      {
        operationKey: 'generate_video_conditioned_sfx', displayName: 'Generate video-conditioned SFX',
        jobs: ['generate_video_conditioned_sfx', 'generate_foley'], preset: 'fixture',
        evidence: [EVIDENCE.mireloFixture], provider: true, paid: true, license: true,
        mutation: 'private_provider_ingest', determinism: 'bounded_nondeterministic',
        requiredInputs: ['bounded_private_visual_proxy', 'approved_snapshot', 'credit_reservation'],
        accepted: ['bounded_private_visual_proxy'], produced: ['untrusted_provider_audio_candidate'],
        conditioningModes: ['video_asset_conditioning'], contentTypes: ['video_mp4'],
        limitations: ['Provider carrier video is transport-only and may never replace approved project visual.'],
      },
      {
        operationKey: 'generate_text_conditioned_sfx', displayName: 'Generate text-conditioned SFX',
        jobs: ['generate_text_conditioned_sfx', 'generate_ambience', 'extend_ambience', 'loop_audio'], preset: 'fixture',
        evidence: [EVIDENCE.mireloFixture], provider: true, paid: true, license: true,
        mutation: 'private_provider_ingest', determinism: 'bounded_nondeterministic',
        requiredInputs: ['approved_sound_event_brief', 'approved_snapshot', 'credit_reservation'],
        accepted: ['approved_sound_event_brief'], produced: ['untrusted_provider_audio_candidate'],
        conditioningModes: ['structured_text_conditioning'], contentTypes: [],
      },
    ],
  }),
  tool({
    toolKey: 'mmaudio_v2', toolVersion: '2.0', toolClass: 'open_source_model',
    executionBoundary: 'private_gpu_worker', status: 'blocked',
    evidence: [EVIDENCE.blockedNoRuntime], licensePolicyRef: 'sound.license.mmaudio_review_required.v1',
    runtimeProbeKey: 'sound.runtime.mmaudio_v2.v1',
    limitations: ['No reviewed model weights, runtime, private project-media E2E, or deployed evidence.'],
    operations: [{
      operationKey: 'generate_video_conditioned_sfx', displayName: 'Generate video-conditioned SFX fallback',
      jobs: ['generate_video_conditioned_sfx', 'generate_foley'], preset: 'blocked',
      evidence: [EVIDENCE.blockedNoRuntime], determinism: 'bounded_nondeterministic',
      requiredInputs: ['bounded_private_visual_proxy'], accepted: ['bounded_private_visual_proxy'],
      produced: ['untrusted_model_audio_candidate'], contentTypes: ['video_mp4'], license: true,
    }],
  }),
  tool({
    toolKey: 'sound_internal_library', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'planning_only', status: 'planning_qualified',
    evidence: [EVIDENCE.internalLibraryPlanning], licensePolicyRef: 'sound.license.internal_library_provenance_required.v1',
    runtimeProbeKey: 'sound.runtime.internal_library.v1',
    limitations: ['Current evidence covers deterministic authorized planning/search fixtures, not a deployed asset library.'],
    operations: [{
      operationKey: 'semantic_search_authorized_assets', displayName: 'Search authorized Sound assets',
      jobs: ['search_sound_library', 'design_scene_sound', 'design_boundary_sound'], preset: 'planning',
      evidence: [EVIDENCE.internalLibraryPlanning], mutation: 'read_only_analysis', runtime: false,
      requiredInputs: ['sound_event_semantics', 'project_asset_authority'], accepted: ['sound_library_index'],
      produced: ['sound_library_search_decision', 'caller_receipt'], contentTypes: [],
    }],
  }),
  tool({
    toolKey: 'ffmpeg', toolVersion: '8.1.1-local', toolClass: 'system_binary',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: localEvidence,
    licensePolicyRef: 'sound.license.ffmpeg_lgpl_build_required.v1', runtimeProbeKey: 'sound.runtime.ffmpeg.v1',
    limitations: ['Qualified only on a private local GPL-enabled Homebrew build; production requires a reviewed LGPL-safe deployment build.'],
    operations: [
      ['analyze_audio_pcm', 'Analyze decoded audio', [...new Set(['study_source_audio', 'study_reference_sound', 'create_sound_dna', 'extract_project_owned_sound', ...qaServiceJobs, ...deterministicEditJobs])], ['sound_study_report', 'candidate_transient_report', 'final_audio_metrics']],
      ['extract_audio_pcm', 'Extract approved audio', ['extract_project_owned_sound', 'generate_video_conditioned_sfx', 'generate_foley'], ['edited_audio_asset_version', 'extracted_provider_audio']],
      ['trim_fade_gain_audio', 'Trim, fade, and gain audio', [...deterministicEditJobs, 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley'], ['edited_audio_asset_version', 'trimmed_sound_candidate', 'validated_sound_candidate']],
      ['normalize_audio_loudness', 'Normalize audio loudness', deterministicEditJobs, ['edited_audio_asset_version']],
      ['resample_convert_channels', 'Resample and convert channels', deterministicEditJobs, ['edited_audio_asset_version']],
      ['loop_audio_crossfade', 'Loop approved ambience with seam crossfades', [...deterministicEditJobs, 'extend_ambience', 'generate_ambience'], ['edited_audio_asset_version', 'ambience_asset']],
      ['stretch_pitch_audio', 'Retime and pitch approved audio', ['time_stretch_audio', 'pitch_shift_audio', 'edit_music_technical_automation'], ['edited_audio_asset_version']],
      ['mix_scene_stem', 'Mix Sound layers with dialogue sidechain protection', ['mix_sound_layers', 'create_sound_stem', 'edit_music_technical_automation', 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley'], ['edited_audio_asset_version', 'validated_sound_candidate', 'private_sound_stem']],
      ['sync_transient_qa', 'Analyze Sound synchronization', ['sync_audio_to_visual', 'align_sound_transient', 'qa_sound', 'edit_music_technical_automation'], ['transient_timing_report']],
      ['cleanup_dialogue_gentle', 'Apply bounded gentle cleanup', ['repair_audio', 'clean_dialogue', 'reduce_noise'], ['edited_audio_asset_version', 'cleaned_dialogue_asset']],
    ].map(([operationKey, displayName, jobs, produced]) => ({
      operationKey: operationKey as string, displayName: displayName as string,
      jobs: jobs as string[], preset: 'private' as const, evidence: localEvidence,
      produced: produced as string[],
      mutation: (produced as string[]).length > 0 && operationKey !== 'analyze_audio_pcm' && operationKey !== 'sync_transient_qa'
        ? 'create_versioned_private_artifact' as const
        : 'read_only_analysis' as const,
      license: true,
    })),
  }),
  tool({
    toolKey: 'ffprobe', toolVersion: '8.1.1-local', toolClass: 'system_binary',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: localEvidence,
    licensePolicyRef: 'sound.license.ffmpeg_lgpl_build_required.v1', runtimeProbeKey: 'sound.runtime.ffprobe.v1',
    limitations: ['Private-local qualification only; deployed build evidence is absent.'],
    operations: [{
      operationKey: 'inspect_validate_audio', displayName: 'Inspect and validate audio media',
      jobs: [...new Set(['study_source_audio', 'study_reference_sound', 'create_sound_dna', 'extract_project_owned_sound', ...qaServiceJobs, ...deterministicEditJobs])], preset: 'private',
      evidence: localEvidence, mutation: 'read_only_analysis',
      produced: ['validated_audio_metadata', 'validated_provider_carrier'], license: true,
    }],
  }),
  ...([
    ['pyav', 'decode_approved_media', 'Decode approved media', ['study_source_audio'], 'read_only_analysis', ['decoded_audio_report']],
    ['librosa', 'analyze_audio_features', 'Analyze audio features', ['study_source_audio', 'study_reference_sound'], 'read_only_analysis', ['audio_feature_report']],
    ['audioflux', 'analyze_onsets_energy', 'Analyze onset and energy timing', ['study_source_audio', 'sync_audio_to_visual'], 'read_only_analysis', ['optional_feature_report']],
    ['pyloudnorm', 'measure_loudness', 'Measure loudness', ['study_source_audio', 'qa_sound'], 'read_only_analysis', ['loudness_report']],
    ['pydub', 'process_audio_segments', 'Process bounded audio segments', ['edit_audio', 'trim_audio', 'fade_audio'], 'create_versioned_private_artifact', ['edited_audio_asset_version']],
    ['scipy', 'analyze_signal_transients', 'Analyze signal transients', ['study_source_audio', 'align_sound_transient'], 'read_only_analysis', ['transient_timing_report']],
    ['resampy', 'resample_audio', 'Resample approved audio', ['resample_audio'], 'create_versioned_private_artifact', ['edited_audio_asset_version']],
    ['noisereduce', 'reduce_noise_bounded', 'Reduce bounded noise', ['reduce_noise', 'repair_audio'], 'create_versioned_private_artifact', ['cleaned_dialogue_asset']],
    ['pedalboard', 'apply_approved_effect_chain', 'Apply approved effects', ['edit_audio', 'mix_sound_layers', 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley'], 'create_versioned_private_artifact', ['edited_audio_asset_version', 'tone_matched_sound_candidate']],
  ] as const).map(([toolKey, operationKey, displayName, jobs, mutation, produced]) => tool({
    toolKey, toolVersion: 'registry-current', toolClass: 'python_library',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: pythonEvidence,
    licensePolicyRef: `sound.license.${toolKey}.registry_review.v1`, runtimeProbeKey: `sound.runtime.${toolKey}.v1`,
    limitations: ['Qualified only through the private structured runner evidence; no deployed worker-fleet evidence.'],
    operations: [{
      operationKey, displayName, jobs: [...jobs], preset: 'private', evidence: pythonEvidence,
      mutation, produced: [...produced], license: true,
    }],
  })),
  tool({
    toolKey: 'rnnoise', toolVersion: 'registry-current', toolClass: 'open_source_model',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: pythonEvidence,
    licensePolicyRef: 'sound.license.rnnoise.registry_review.v1', runtimeProbeKey: 'sound.runtime.rnnoise.v1',
    limitations: ['Bounded voice denoise only; unsupported for Music and complex ambience.'],
    operations: [{
      operationKey: 'denoise_voice_bounded', displayName: 'Denoise bounded voice',
      jobs: ['repair_audio', 'clean_dialogue', 'reduce_noise'], preset: 'private', evidence: pythonEvidence,
      produced: ['cleaned_dialogue_asset', 'cleaned_dialogue_asset_v2'], license: true,
    }],
  }),
  tool({
    toolKey: 'deepfilternet', toolVersion: 'registry-current', toolClass: 'open_source_model',
    executionBoundary: 'private_gpu_worker', status: 'declared', evidence: [EVIDENCE.declaredCatalog],
    licensePolicyRef: 'sound.license.deepfilternet_model_review_required.v1', runtimeProbeKey: 'sound.runtime.deepfilternet.v1',
    limitations: ['Declared only: exact weights, private project-media E2E, quality benchmark, and deployed runtime are absent.'],
    operations: [{
      operationKey: 'enhance_dialogue_bounded', displayName: 'Enhance bounded dialogue',
      jobs: ['clean_dialogue'], preset: 'declared', evidence: [EVIDENCE.declaredCatalog],
      produced: ['cleaned_dialogue_asset'], license: true,
    }],
  }),
  tool({
    toolKey: 'signalsmith_stretch', toolVersion: 'registry-current', toolClass: 'system_binary',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified',
    evidence: [EVIDENCE.corePrivateRunner], licensePolicyRef: 'sound.license.signalsmith_mit_review.v1',
    runtimeProbeKey: 'sound.runtime.signalsmith_stretch.v1',
    limitations: ['Private runner evidence only; extreme ratios remain unsupported and Music ownership remains outside Sound.'],
    operations: [{
      operationKey: 'stretch_pitch_bounded', displayName: 'Stretch or pitch bounded Sound audio',
      jobs: ['time_stretch_audio', 'pitch_shift_audio'], preset: 'private',
      evidence: [EVIDENCE.corePrivateRunner], produced: ['edited_audio_asset_version'], license: true,
    }],
  }),
  tool({
    toolKey: 'sound_private_artifact_store', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'private_artifact_service', status: 'planning_qualified',
    evidence: [EVIDENCE.privateArtifactRuntime, EVIDENCE.mireloFixture],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.private_artifact_store.v1',
    limitations: ['Single-host private-local evidence is not deployed multi-tenant storage evidence.'],
    operations: [
      {
        operationKey: 'prepare_bounded_private_visual_proxy', displayName: 'Prepare bounded private visual proxy',
        jobs: ['generate_video_conditioned_sfx', 'generate_foley'], preset: 'fixture',
        evidence: [EVIDENCE.mireloFixture], accepted: ['approved_visual_artifact'], produced: ['bounded_private_visual_proxy'],
      },
      {
        operationKey: 'ingest_untrusted_provider_output', displayName: 'Ingest untrusted provider output privately',
        jobs: generatedSoundJobs,
        preset: 'fixture', evidence: [EVIDENCE.mireloFixture], mutation: 'private_provider_ingest',
        accepted: ['untrusted_provider_audio_candidate', 'untrusted_model_audio_candidate'],
        produced: ['private_untrusted_sound_candidate'],
      },
      {
        operationKey: 'commit_selected_sound_artifact', displayName: 'Commit selected Sound artifact',
        jobs: [
          'extract_project_owned_sound', ...generatedSoundJobs,
          'repair_audio', 'clean_dialogue', 'reduce_noise',
          ...deterministicEditJobs, 'mix_sound_layers', 'create_sound_stem',
          'handoff_sound_to_final_composition',
        ],
        preset: 'private', evidence: [EVIDENCE.privateArtifactRuntime],
        accepted: ['validated_sound_candidate'],
        produced: ['private_selected_sound_artifact', 'candidate_sfx_asset', 'provenance_report'],
      },
    ],
  }),
  tool({
    toolKey: 'sound_provider_attempt_service', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'private_coordination_service', status: 'planning_qualified',
    evidence: [EVIDENCE.providerAttemptFixture], licensePolicyRef: 'sound.license.internal_service.v1',
    runtimeProbeKey: 'sound.runtime.provider_attempt_service.v1',
    limitations: ['Attempt and reconciliation evidence is fixture/in-memory; durable multi-worker authority is not activated.'],
    operations: [
      {
        operationKey: 'record_provider_attempt', displayName: 'Record provider attempt identity and cost lineage',
        jobs: ['generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley', 'generate_ambience'],
        preset: 'fixture', evidence: [EVIDENCE.providerAttemptFixture], mutation: 'coordination_record_only',
        accepted: ['approved_provider_request'],
        produced: ['provider_attempt_evidence', 'cost_evidence'], contentTypes: [],
      },
      {
        operationKey: 'reconcile_unknown_provider_attempt', displayName: 'Reconcile provider attempt without blind resubmission',
        jobs: ['generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley', 'generate_ambience'],
        preset: 'fixture', evidence: [EVIDENCE.providerAttemptFixture], mutation: 'coordination_record_only',
        accepted: ['provider_attempt_evidence'], produced: ['provider_reconciliation_evidence'], contentTypes: [],
      },
    ],
  }),
  tool({
    toolKey: 'sound_project_source_resolver', toolVersion: '1.0.0', toolClass: 'decision_route',
    executionBoundary: 'planning_only', status: 'planning_qualified', evidence: [EVIDENCE.controller],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.project_source_resolver.v1',
    operations: [{
      operationKey: 'resolve_approved_project_sound', displayName: 'Resolve approved project-owned Sound',
      jobs: ['extract_project_owned_sound', 'design_scene_sound', 'design_boundary_sound'], preset: 'planning',
      evidence: [EVIDENCE.controller], mutation: 'read_only_analysis', runtime: false,
      accepted: ['approved_source_audio'], produced: ['project_sound_acquisition_decision'], contentTypes: [],
    }],
  }),
  tool({
    toolKey: 'sound_planning_service', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'private_coordination_service', status: 'planning_qualified',
    evidence: [EVIDENCE.controller, EVIDENCE.localSoundRuntime],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.planning_service.v1',
    limitations: ['Visual-event and scene-design operations are planning-qualified; reference DNA additionally has private decoded-audio evidence.'],
    operations: [
      {
        operationKey: 'study_visual_sound_events', displayName: 'Study visual events for Sound',
        jobs: ['study_visual_sound_events'], preset: 'planning', evidence: [EVIDENCE.controller],
        mutation: 'coordination_record_only', runtime: false,
        accepted: ['visual_event_manifest'], produced: ['visual_sound_event_study'], contentTypes: [],
      },
      {
        operationKey: 'derive_reference_sound_dna', displayName: 'Derive reference Sound DNA',
        jobs: ['study_reference_sound', 'create_sound_dna'], preset: 'private',
        evidence: [EVIDENCE.localSoundRuntime], mutation: 'coordination_record_only', runtime: false,
        accepted: ['sound_study_report'], produced: ['reference_sound_dna'], contentTypes: [],
      },
      {
        operationKey: 'design_sound_plan', displayName: 'Design a bounded Sound plan',
        jobs: [
          'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
          'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
          'support_transition_sound', 'support_graphic_design_sound',
        ],
        preset: 'planning', evidence: [EVIDENCE.controller], mutation: 'coordination_record_only', runtime: false,
        accepted: ['sound_design_context'], produced: ['sound_design_plan', 'caller_receipt'], contentTypes: [],
      },
      {
        operationKey: 'revise_sound_plan', displayName: 'Revise affected Sound ranges',
        jobs: ['revise_sound'], preset: 'planning', evidence: [EVIDENCE.controller],
        mutation: 'coordination_record_only', runtime: false,
        accepted: ['sound_cue_manifest', 'revision_lineage'], produced: ['sound_design_plan', 'caller_receipt'], contentTypes: [],
      },
      {
        operationKey: 'create_sound_caller_receipt', displayName: 'Create a bounded Sound caller receipt',
        jobs: ['generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley', 'generate_ambience'],
        preset: 'fixture', evidence: [EVIDENCE.controller, EVIDENCE.mireloFixture],
        mutation: 'coordination_record_only',
        accepted: ['private_selected_sound_artifact', 'sound_qa_report', 'provider_attempt_evidence'],
        produced: ['caller_receipt'], contentTypes: [],
      },
    ],
  }),
  tool({
    toolKey: 'sound_sync_service', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: [EVIDENCE.soundSync],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.sync_service.v1',
    operations: [
      {
        operationKey: 'align_sound_to_visual_event', displayName: 'Align Sound to an approved visual event',
        jobs: ['sync_audio_to_visual', 'align_sound_transient', 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley'],
        preset: 'private', evidence: [EVIDENCE.soundSync],
        accepted: ['validated_sound_candidate', 'visual_event_manifest'], produced: ['sound_cue_manifest'],
      },
      {
        operationKey: 'create_speech_safe_mix_automation', displayName: 'Create speech-safe mix automation',
        jobs: ['mix_sound_layers', 'create_sound_stem', 'sync_audio_to_visual', 'align_sound_transient', 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley'],
        preset: 'private', evidence: [EVIDENCE.soundSync], mutation: 'coordination_record_only',
        accepted: ['sound_cue_manifest', 'dialogue_context', 'read_only_music_context'],
        produced: ['mix_automation_manifest'], contentTypes: [],
      },
      {
        operationKey: 'create_timed_sound_cue', displayName: 'Create a timed Sound cue',
        jobs: ['generate_ambience', 'extend_ambience', 'loop_audio'], preset: 'private',
        evidence: [EVIDENCE.soundSync], mutation: 'coordination_record_only',
        accepted: ['ambience_asset', 'timing_manifest'], produced: ['sound_cue_manifest'], contentTypes: [],
      },
    ],
  }),
  tool({
    toolKey: 'sound_qa_service', toolVersion: '1.0.0', toolClass: 'internal_service',
    executionBoundary: 'private_cpu_worker', status: 'internal_execution_qualified', evidence: [EVIDENCE.localSoundQa],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.qa_service.v1',
    operations: [{
      operationKey: 'evaluate_final_sound', displayName: 'Evaluate final Sound output and integration',
      jobs: [...qaServiceJobs, 'edit_music_technical_automation'], preset: 'private', evidence: [EVIDENCE.localSoundQa],
      mutation: 'coordination_record_only', accepted: ['private_sound_stem', 'sound_cue_manifest'],
      produced: ['sound_qa_report', 'final_composition_sound_handoff', 'caller_receipt'], contentTypes: [],
      outputQa: ['technical_audio_qa', 'sync_qa', 'speech_clarity_qa', 'provenance_qa'],
    }],
  }),
  tool({
    toolKey: 'sound_no_sound_decision', toolVersion: '1.0.0', toolClass: 'decision_route',
    executionBoundary: 'private_coordination_service', status: 'internal_execution_qualified', evidence: [EVIDENCE.controller],
    licensePolicyRef: 'sound.license.internal_service.v1', runtimeProbeKey: 'sound.runtime.no_sound_decision.v1',
    operations: [{
      operationKey: 'decide_intentional_no_sound', displayName: 'Create intentional no-Sound decision',
      jobs: [
        'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
        'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
        'support_transition_sound', 'support_graphic_design_sound',
        'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
        'generate_foley', 'generate_ambience', 'extend_ambience',
        'search_sound_library', 'extract_project_owned_sound',
      ], preset: 'private',
      evidence: [EVIDENCE.controller], mutation: 'coordination_record_only', accepted: ['sound_design_context'],
      produced: ['no_sound_decision', 'caller_receipt'], contentTypes: [], runtime: false,
    }],
  }),
] as const

for (const manifest of manifests) registerToolCapabilityManifest(manifest)

export const SOUND_TOOL_CAPABILITY_MANIFESTS: readonly Readonly<ToolCapabilityManifest>[] = manifests

export function registerCanonicalSoundToolManifests(): void {
  for (const manifest of SOUND_TOOL_CAPABILITY_MANIFESTS) registerToolCapabilityManifest(manifest)
}
