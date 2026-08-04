import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import {
  publishSoundToolRouteManifest,
  registerSoundToolRouteManifest,
  validateSoundToolRouteRegistry,
  type SoundToolRouteManifest,
  type SoundToolRouteStep,
  type UnpublishedSoundToolRouteManifest,
} from './sound-tool-route-manifest'
import { registerCanonicalSoundToolManifests } from './sound-tool-capability-manifests'

interface StepSeed {
  key: string
  tool: string
  toolVersion: string
  operation: string
  profile: string
  profileVersion?: string
  depends?: string[]
  inputs?: string[]
  outputs?: string[]
  condition?: string
  required?: boolean
  qualification: SkillQualificationStatus
  provider?: boolean
  optional?: boolean
}

function step(seed: StepSeed): SoundToolRouteStep {
  return {
    stepKey: seed.key,
    orderOrDependencies: seed.depends ?? [],
    required: seed.required ?? !seed.optional,
    toolKey: seed.tool,
    toolVersionConstraint: seed.toolVersion,
    operationKey: seed.operation,
    operationProfileKey: seed.profile,
    operationProfileVersion: seed.profileVersion ?? '1.0.0',
    inputBindings: seed.inputs ?? [],
    outputBindings: seed.outputs ?? [],
    executionCondition: seed.condition ?? 'always',
    timeoutPolicy: {
      timeoutSeconds: seed.provider ? 900 : 600,
      unknownOutcomeBehavior: seed.provider
        ? 'reconcile_without_resubmission'
        : 'fail_closed',
    },
    retryPolicy: {
      maximumAttempts: seed.provider ? 2 : 1,
      retryEligibility: seed.provider ? 'reconciled_failure_only' : 'idempotent_only',
    },
    requiredQualificationStatus: seed.qualification,
    failureBehavior: seed.optional
      ? 'continue_without_optional_step'
      : seed.provider
        ? 'use_declared_fallback'
        : 'block_route',
  }
}

interface RouteSeed {
  key: string
  capabilities: string[]
  jobs: string[]
  role: SoundToolRouteManifest['routeRole']
  requiredInputs: string[]
  outputs: string[]
  steps: StepSeed[]
  fallbacks?: string[]
  automaticFallback?: boolean
  limitations?: string[]
}

function route(seed: RouteSeed): Readonly<SoundToolRouteManifest> {
  const unpublished: UnpublishedSoundToolRouteManifest = {
    manifestSchemaVersion: 'sound-tool-route-manifest-v1',
    routeKey: seed.key,
    routeVersion: '2.0.0',
    skillKey: 'sound',
    capabilityKeys: seed.capabilities,
    supportedJobTypes: seed.jobs,
    routeRole: seed.role,
    qualificationEvidenceRefs: [...new Set(seed.steps.flatMap((item) => {
      if (item.tool === 'mirelo_sfx') return ['sound.evidence.mirelo_injected_transport_v1']
      if (item.tool === 'mmaudio_v2') return ['sound.evidence.blocked_no_runtime_v1']
      if (item.tool === 'sound_internal_library') return ['sound.evidence.internal_library_planning_v1']
      return ['sound.evidence.local_audio_real_bytes_v1']
    }))],
    requiredInputs: seed.requiredInputs,
    producedArtifactTypes: seed.outputs,
    supportedScopes: ['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'],
    eligibilityRules: [
      'head_or_authorized_peer_admission_required',
      'exact_scope_and_artifact_authority_required',
      'approved_snapshot_required_for_execution',
      'operation_and_route_qualification_derived_fail_closed',
      'runtime_availability_checked_separately',
      'speech_clarity_outranks_sync_and_decorative_sound',
    ],
    orderedOrGraphSteps: seed.steps.map(step),
    timeEstimatorKey: `sound.route.time.${seed.key}.v1`,
    creditEstimatorKey: `sound.route.credit.${seed.key}.v1`,
    attemptPolicyKey: seed.steps.some((item) => item.provider)
      ? 'sound.attempt.provider_reconciled.v1'
      : 'sound.attempt.local_idempotent.v1',
    fallbackPolicy: {
      fallbackRouteRefs: (seed.fallbacks ?? []).map((routeKey) => ({
        routeKey,
        routeVersion: '2.0.0',
      })),
      automaticFallbackAllowed: seed.automaticFallback ?? false,
      unknownOutcomeResubmissionAllowed: false,
      freshApprovalRequiredForCostIncrease: true,
    },
    planningQa: ['scope_authority_qa', 'input_lineage_qa', 'route_eligibility_qa'],
    stepQa: ['private_artifact_qa', 'media_contract_qa'],
    finalOutputQa: ['technical_audio_qa', 'sync_qa', 'speech_clarity_qa', 'provenance_qa'],
    integrationQa: ['approved_visual_integrity_qa', 'range_authority_qa', 'music_read_only_boundary_qa'],
    invalidationRules: [
      'source_hash_changed', 'visual_timing_changed', 'approved_snapshot_changed',
      'tool_manifest_hash_changed', 'route_hash_changed', 'operation_profile_changed',
    ],
    knownLimitations: seed.limitations ?? ['Private/internal or planning evidence does not imply production deployment.'],
  }
  return publishSoundToolRouteManifest(unpublished)
}

const privateStoreVersion = '1.0.0'
const ffmpegVersion = '8.1.1-local'
const fixture = 'planning_qualified' as const
const privateInternal = 'internal_execution_qualified' as const

registerCanonicalSoundToolManifests()

export const SOUND_TOOL_ROUTE_MANIFESTS = [
  route({
    key: 'sound.route.study.source_audio.v1',
    capabilities: ['sound.study_source_audio'], jobs: ['study_source_audio'], role: 'primary',
    requiredInputs: ['approved_source_audio', 'bounded_authority'], outputs: ['sound_study_report'],
    steps: [
      { key: 'inspect_media', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.audio.v1', outputs: ['validated_audio_metadata'], qualification: privateInternal },
      { key: 'decode_analyze', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.v1', depends: ['inspect_media'], inputs: ['validated_audio_metadata'], outputs: ['sound_study_report'], qualification: privateInternal },
      { key: 'feature_analysis_optional', tool: 'audioflux', toolVersion: 'registry-current', operation: 'analyze_onsets_energy', profile: 'sound.audioflux.onsets.v1', depends: ['inspect_media'], inputs: ['approved_source_audio'], outputs: ['optional_feature_report'], qualification: privateInternal, optional: true },
    ],
  }),
  route({
    key: 'sound.route.study.reference_sound.v1',
    capabilities: ['sound.study_reference_sound', 'sound.create_sound_dna'],
    jobs: ['study_reference_sound', 'create_sound_dna'], role: 'primary',
    requiredInputs: ['reference_sound_asset', 'bounded_authority'],
    outputs: ['sound_study_report', 'reference_sound_dna'],
    steps: [
      { key: 'inspect_reference', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.reference.v1', inputs: ['reference_sound_asset'], outputs: ['validated_audio_metadata'], qualification: privateInternal },
      { key: 'analyze_reference', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.reference.v1', depends: ['inspect_reference'], inputs: ['reference_sound_asset'], outputs: ['sound_study_report'], qualification: privateInternal },
      { key: 'derive_dna', tool: 'sound_planning_service', toolVersion: '1.0.0', operation: 'derive_reference_sound_dna', profile: 'sound.reference_dna.v1', depends: ['analyze_reference'], inputs: ['sound_study_report'], outputs: ['reference_sound_dna'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.study.visual_events.v1',
    capabilities: ['sound.study_visual_sound_events'], jobs: ['study_visual_sound_events'], role: 'support',
    requiredInputs: ['visual_event_manifest', 'bounded_authority'], outputs: ['visual_sound_event_study'],
    steps: [{
      key: 'study_visual_events', tool: 'sound_planning_service', toolVersion: '1.0.0',
      operation: 'study_visual_sound_events', profile: 'sound.study.visual_events.v1',
      inputs: ['visual_event_manifest'], outputs: ['visual_sound_event_study'], qualification: 'blocked',
    }],
    limitations: ['Planning-qualified visual-event study; no independent visual-generation ownership.'],
  }),
  route({
    key: 'sound.route.design.plan.v1',
    capabilities: [
      'sound.design_scene_sound', 'sound.design_boundary_sound', 'sound.full_video_sound_pass',
      'sound.support_living_frame_sound', 'sound.support_3d_sound',
      'sound.support_motion_design_sound', 'sound.support_transition_sound',
      'sound.support_graphic_design_sound',
    ],
    jobs: [
      'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
      'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
      'support_transition_sound', 'support_graphic_design_sound',
    ],
    role: 'primary', requiredInputs: ['sound_design_context', 'bounded_authority'],
    outputs: ['sound_design_plan', 'caller_receipt'],
    fallbacks: ['sound.route.no_sound.v1'],
    steps: [{
      key: 'design_sound_plan', tool: 'sound_planning_service', toolVersion: '1.0.0',
      operation: 'design_sound_plan', profile: 'sound.design.plan.v1',
      inputs: ['sound_design_context'], outputs: ['sound_design_plan', 'caller_receipt'], qualification: 'blocked',
    }],
    limitations: ['Planning-qualified; execution routes are selected separately per approved cue.'],
  }),
  route({
    key: 'sound.route.revision.v1',
    capabilities: ['sound.revise_sound'], jobs: ['revise_sound'], role: 'support',
    requiredInputs: ['sound_cue_manifest', 'revision_lineage', 'bounded_authority'],
    outputs: ['sound_design_plan', 'caller_receipt'],
    steps: [{
      key: 'revise_sound_plan', tool: 'sound_planning_service', toolVersion: '1.0.0',
      operation: 'revise_sound_plan', profile: 'sound.revision.plan.v1',
      inputs: ['sound_cue_manifest', 'revision_lineage'], outputs: ['sound_design_plan', 'caller_receipt'],
      qualification: 'blocked',
    }],
    limitations: ['Planning-qualified; affected execution operations require new route admission and bindings.'],
  }),
  route({
    key: 'sound.route.acquire.internal_library.v1',
    capabilities: ['sound.search_sound_library', 'sound.design_scene_sound', 'sound.design_boundary_sound'],
    jobs: ['search_sound_library', 'design_scene_sound', 'design_boundary_sound'], role: 'lower_cost',
    requiredInputs: ['sound_event_semantics', 'project_asset_authority'],
    outputs: ['sound_library_search_decision', 'caller_receipt'],
    steps: [{
      key: 'search_authorized_library', tool: 'sound_internal_library', toolVersion: '1.0.0',
      operation: 'semantic_search_authorized_assets', profile: 'sound.library.semantic_search.v1',
      inputs: ['sound_event_semantics', 'project_asset_authority'],
      outputs: ['sound_library_search_decision', 'caller_receipt'],
      qualification: 'blocked',
    }],
    limitations: ['Planning-qualified only until the real private Sound library and provenance index are deployed and tested.'],
  }),
  route({
    key: 'sound.route.acquire.project_source.v1',
    capabilities: ['sound.extract_project_owned_sound'], jobs: ['extract_project_owned_sound'], role: 'primary',
    requiredInputs: ['approved_project_sound_resolution', 'approved_source_audio'],
    outputs: ['edited_audio_asset_version', 'provenance_report'],
    steps: [
      { key: 'extract_project_audio', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'extract_audio_pcm', profile: 'sound.extract.pcm.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], qualification: privateInternal },
      { key: 'analyze_extracted_audio', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.output.v1', depends: ['extract_project_audio'], inputs: ['edited_audio_asset_version'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'validate_extracted_audio', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.audio.v1', depends: ['analyze_extracted_audio'], inputs: ['edited_audio_asset_version'], outputs: ['validated_audio_metadata'], qualification: privateInternal },
      { key: 'commit_extracted_audio', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['validate_extracted_audio'], inputs: ['validated_audio_metadata'], outputs: ['private_selected_sound_artifact', 'provenance_report'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.generate.video_sfx.mirelo.v1',
    capabilities: ['sound.generate_video_conditioned_sfx', 'sound.generate_foley'],
    jobs: ['generate_video_conditioned_sfx', 'generate_foley'], role: 'primary',
    requiredInputs: ['approved_visual_artifact', 'approved_sound_event_brief', 'credit_reservation'],
    outputs: ['candidate_sfx_asset', 'sound_cue_manifest', 'mix_automation_manifest', 'provenance_report', 'cost_evidence', 'caller_receipt'],
    fallbacks: ['sound.route.no_sound.v1'],
    steps: [
      { key: 'prepare_visual_proxy', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'prepare_bounded_private_visual_proxy', profile: 'sound.proxy.visual_bounded.v2', profileVersion: '2.0.0', inputs: ['approved_visual_artifact'], outputs: ['bounded_private_visual_proxy'], qualification: fixture },
      { key: 'record_attempt', tool: 'sound_provider_attempt_service', toolVersion: '1.0.0', operation: 'record_provider_attempt', profile: 'sound.provider.attempt.v1', depends: ['prepare_visual_proxy'], inputs: ['approved_provider_request'], outputs: ['provider_attempt_evidence', 'cost_evidence'], qualification: fixture },
      { key: 'generate_mirelo', tool: 'mirelo_sfx', toolVersion: '1.6', operation: 'generate_video_conditioned_sfx', profile: 'sound.mirelo.video_sfx_1_6.v1', depends: ['record_attempt'], inputs: ['bounded_private_visual_proxy', 'provider_attempt_evidence'], outputs: ['untrusted_provider_audio_candidate'], qualification: fixture, provider: true },
      { key: 'ingest_provider_output', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'ingest_untrusted_provider_output', profile: 'sound.artifact.ingest_provider.v1', depends: ['generate_mirelo'], inputs: ['untrusted_provider_audio_candidate'], outputs: ['private_untrusted_sound_candidate'], qualification: fixture },
      { key: 'validate_carrier', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.provider_carrier.v1', depends: ['ingest_provider_output'], inputs: ['private_untrusted_sound_candidate'], outputs: ['validated_provider_carrier'], qualification: privateInternal },
      { key: 'extract_carrier_audio', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'extract_audio_pcm', profile: 'sound.extract.pcm.v1', depends: ['validate_carrier'], inputs: ['validated_provider_carrier'], outputs: ['extracted_provider_audio'], condition: 'provider_output_is_video_carrier', qualification: privateInternal, optional: true },
      { key: 'analyze_event_region', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.provider_candidate.v1', depends: ['validate_carrier'], inputs: ['private_untrusted_sound_candidate'], outputs: ['candidate_transient_report'], qualification: privateInternal },
      { key: 'trim_sync_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'trim_fade_gain_audio', profile: 'sound.trim-fade-gain.v1', depends: ['analyze_event_region'], inputs: ['candidate_transient_report'], outputs: ['trimmed_sound_candidate'], qualification: privateInternal },
      { key: 'match_room_and_tone', tool: 'pedalboard', toolVersion: 'registry-current', operation: 'apply_approved_effect_chain', profile: 'sound.tone-room-match.v1', depends: ['trim_sync_candidate'], inputs: ['trimmed_sound_candidate'], outputs: ['tone_matched_sound_candidate'], qualification: privateInternal, optional: true },
      { key: 'align_visual_event', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'align_sound_to_visual_event', profile: 'sound.sync.visual_event.v1', depends: ['trim_sync_candidate'], inputs: ['trimmed_sound_candidate', 'visual_event_manifest'], outputs: ['sound_cue_manifest'], qualification: privateInternal },
      { key: 'create_mix_automation', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_speech_safe_mix_automation', profile: 'sound.mix.automation.v1', depends: ['align_visual_event'], inputs: ['sound_cue_manifest', 'dialogue_context', 'read_only_music_context'], outputs: ['mix_automation_manifest'], qualification: privateInternal },
      { key: 'mix_match_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'mix_scene_stem', profile: 'sound.mix-stem.v1', depends: ['trim_sync_candidate', 'create_mix_automation'], inputs: ['trimmed_sound_candidate', 'dialogue_context', 'mix_automation_manifest'], outputs: ['validated_sound_candidate'], qualification: privateInternal, optional: true },
      { key: 'qa_candidate', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.final.v1', depends: ['trim_sync_candidate', 'create_mix_automation'], inputs: ['trimmed_sound_candidate', 'sound_cue_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
      { key: 'commit_selected_candidate', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_candidate'], inputs: ['trimmed_sound_candidate', 'sound_qa_report'], outputs: ['private_selected_sound_artifact', 'candidate_sfx_asset', 'provenance_report'], qualification: privateInternal },
      { key: 'create_caller_receipt', tool: 'sound_planning_service', toolVersion: '1.0.0', operation: 'create_sound_caller_receipt', profile: 'sound.receipt.provider_result.v1', depends: ['commit_selected_candidate', 'record_attempt'], inputs: ['private_selected_sound_artifact', 'sound_qa_report', 'provider_attempt_evidence'], outputs: ['caller_receipt'], qualification: fixture },
    ],
    limitations: ['Fixture-qualified only. Provider visual is ignored/discarded and cannot become project visual.'],
  }),
  route({
    key: 'sound.route.generate.video_sfx.mmaudio.v1',
    capabilities: ['sound.generate_video_conditioned_sfx', 'sound.generate_foley'],
    jobs: ['generate_video_conditioned_sfx', 'generate_foley'], role: 'fallback',
    requiredInputs: ['bounded_private_visual_proxy', 'reviewed_model_manifest'], outputs: ['candidate_sfx_asset'],
    fallbacks: ['sound.route.no_sound.v1'],
    steps: [{
      key: 'generate_mmaudio', tool: 'mmaudio_v2', toolVersion: '2.0',
      operation: 'generate_video_conditioned_sfx', profile: 'sound.mmaudio.video_sfx.v1',
      inputs: ['bounded_private_visual_proxy'], outputs: ['untrusted_model_audio_candidate'],
      qualification: 'blocked',
    },
    { key: 'ingest_model_output', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'ingest_untrusted_provider_output', profile: 'sound.artifact.ingest_model.v1', depends: ['generate_mmaudio'], inputs: ['untrusted_model_audio_candidate'], outputs: ['private_untrusted_sound_candidate'], qualification: fixture },
    { key: 'analyze_model_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.model_candidate.v1', depends: ['ingest_model_output'], inputs: ['private_untrusted_sound_candidate'], outputs: ['candidate_transient_report'], qualification: privateInternal },
    { key: 'trim_model_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'trim_fade_gain_audio', profile: 'sound.trim-fade-gain.v1', depends: ['analyze_model_candidate'], inputs: ['candidate_transient_report'], outputs: ['trimmed_sound_candidate'], qualification: privateInternal },
    { key: 'match_model_room_and_tone', tool: 'pedalboard', toolVersion: 'registry-current', operation: 'apply_approved_effect_chain', profile: 'sound.tone-room-match.v1', depends: ['trim_model_candidate'], inputs: ['trimmed_sound_candidate'], outputs: ['tone_matched_sound_candidate'], qualification: privateInternal },
    { key: 'align_model_visual_event', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'align_sound_to_visual_event', profile: 'sound.sync.visual_event.v1', depends: ['match_model_room_and_tone'], inputs: ['tone_matched_sound_candidate', 'visual_event_manifest'], outputs: ['sound_cue_manifest'], qualification: privateInternal },
    { key: 'create_model_mix_automation', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_speech_safe_mix_automation', profile: 'sound.mix.automation.v1', depends: ['align_model_visual_event'], inputs: ['sound_cue_manifest', 'dialogue_context'], outputs: ['mix_automation_manifest'], qualification: privateInternal },
    { key: 'mix_model_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'mix_scene_stem', profile: 'sound.mix-stem.v1', depends: ['match_model_room_and_tone', 'create_model_mix_automation'], inputs: ['tone_matched_sound_candidate', 'dialogue_context'], outputs: ['validated_sound_candidate'], qualification: privateInternal },
    { key: 'qa_model_candidate', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.final.v1', depends: ['mix_model_candidate'], inputs: ['validated_sound_candidate', 'sound_cue_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
    { key: 'commit_model_candidate', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_model_candidate'], inputs: ['validated_sound_candidate', 'sound_qa_report'], outputs: ['private_selected_sound_artifact', 'candidate_sfx_asset', 'provenance_report'], qualification: privateInternal },
    ],
    limitations: ['Blocked: no reviewed model weights, private runtime, project-media E2E, or deployed qualification evidence.'],
  }),
  route({
    key: 'sound.route.generate.text_sfx.v1',
    capabilities: ['sound.generate_text_conditioned_sfx'], jobs: ['generate_text_conditioned_sfx'], role: 'primary',
    requiredInputs: ['approved_sound_event_brief', 'credit_reservation'],
    outputs: ['candidate_sfx_asset', 'sound_cue_manifest', 'mix_automation_manifest', 'provenance_report', 'cost_evidence', 'caller_receipt'],
    fallbacks: ['sound.route.no_sound.v1'],
    steps: [
      { key: 'record_attempt', tool: 'sound_provider_attempt_service', toolVersion: '1.0.0', operation: 'record_provider_attempt', profile: 'sound.provider.attempt.v1', inputs: ['approved_provider_request'], outputs: ['provider_attempt_evidence', 'cost_evidence'], qualification: fixture },
      { key: 'generate_mirelo_text', tool: 'mirelo_sfx', toolVersion: '1.6', operation: 'generate_text_conditioned_sfx', profile: 'sound.mirelo.text_sfx_1_6.v1', depends: ['record_attempt'], inputs: ['approved_sound_event_brief'], outputs: ['untrusted_provider_audio_candidate'], qualification: fixture, provider: true },
      { key: 'ingest_provider_output', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'ingest_untrusted_provider_output', profile: 'sound.artifact.ingest_provider.v1', depends: ['generate_mirelo_text'], inputs: ['untrusted_provider_audio_candidate'], outputs: ['private_untrusted_sound_candidate'], qualification: fixture },
      { key: 'trim_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'trim_fade_gain_audio', profile: 'sound.trim-fade-gain.v1', depends: ['ingest_provider_output'], inputs: ['private_untrusted_sound_candidate'], outputs: ['validated_sound_candidate'], qualification: privateInternal },
      { key: 'analyze_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.provider_candidate.v1', depends: ['trim_candidate'], inputs: ['validated_sound_candidate'], outputs: ['candidate_transient_report'], qualification: privateInternal },
      { key: 'match_room_and_tone', tool: 'pedalboard', toolVersion: 'registry-current', operation: 'apply_approved_effect_chain', profile: 'sound.tone-room-match.v1', depends: ['trim_candidate'], inputs: ['validated_sound_candidate'], outputs: ['tone_matched_sound_candidate'], qualification: privateInternal, optional: true },
      { key: 'align_event', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'align_sound_to_visual_event', profile: 'sound.sync.visual_event.v1', depends: ['analyze_candidate'], inputs: ['validated_sound_candidate', 'visual_event_manifest'], outputs: ['sound_cue_manifest'], qualification: privateInternal },
      { key: 'create_mix_automation', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_speech_safe_mix_automation', profile: 'sound.mix.automation.v1', depends: ['align_event'], inputs: ['sound_cue_manifest', 'dialogue_context', 'read_only_music_context'], outputs: ['mix_automation_manifest'], qualification: privateInternal },
      { key: 'mix_candidate', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'mix_scene_stem', profile: 'sound.mix-stem.v1', depends: ['trim_candidate', 'create_mix_automation'], inputs: ['validated_sound_candidate', 'dialogue_context', 'mix_automation_manifest'], outputs: ['validated_sound_candidate'], qualification: privateInternal, optional: true },
      { key: 'qa_candidate', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.final.v1', depends: ['trim_candidate', 'create_mix_automation'], inputs: ['validated_sound_candidate', 'sound_cue_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
      { key: 'commit_candidate', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_candidate'], inputs: ['validated_sound_candidate', 'sound_qa_report'], outputs: ['private_selected_sound_artifact', 'candidate_sfx_asset', 'provenance_report'], qualification: privateInternal },
      { key: 'create_caller_receipt', tool: 'sound_planning_service', toolVersion: '1.0.0', operation: 'create_sound_caller_receipt', profile: 'sound.receipt.provider_result.v1', depends: ['commit_candidate', 'record_attempt'], inputs: ['private_selected_sound_artifact', 'sound_qa_report', 'provider_attempt_evidence'], outputs: ['caller_receipt'], qualification: fixture },
    ],
    limitations: ['Fixture-qualified Mirelo path; no live production canary or deployed runtime evidence.'],
  }),
  route({
    key: 'sound.route.ambience.generate_or_extend.v1',
    capabilities: ['sound.generate_ambience', 'sound.extend_ambience', 'sound.loop_audio'],
    jobs: ['generate_ambience', 'extend_ambience', 'loop_audio'], role: 'primary',
    requiredInputs: ['approved_ambience_source_or_brief'],
    outputs: ['ambience_asset', 'sound_cue_manifest', 'provenance_report'],
    fallbacks: ['sound.route.no_sound.v1'],
    steps: [
      { key: 'generate_if_required', tool: 'mirelo_sfx', toolVersion: '1.6', operation: 'generate_text_conditioned_sfx', profile: 'sound.mirelo.ambience_1_6.v1', inputs: ['approved_sound_event_brief'], outputs: ['untrusted_provider_audio_candidate'], condition: 'no_approved_ambience_source', qualification: fixture, provider: true },
      { key: 'ingest_if_generated', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'ingest_untrusted_provider_output', profile: 'sound.artifact.ingest_provider.v1', depends: ['generate_if_required'], inputs: ['untrusted_provider_audio_candidate'], outputs: ['private_untrusted_sound_candidate'], condition: 'provider_generation_succeeded', qualification: fixture },
      { key: 'extend_loop', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'loop_audio_crossfade', profile: 'sound.loop.v1', depends: ['ingest_if_generated'], inputs: ['private_untrusted_sound_candidate'], outputs: ['ambience_asset'], qualification: privateInternal },
      { key: 'create_ambience_cue', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_timed_sound_cue', profile: 'sound.cue.ambience.v1', depends: ['extend_loop'], inputs: ['ambience_asset', 'timing_manifest'], outputs: ['sound_cue_manifest'], qualification: privateInternal },
      { key: 'qa_ambience', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.ambience.v1', depends: ['create_ambience_cue'], inputs: ['ambience_asset', 'sound_cue_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
      { key: 'commit_ambience', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_ambience'], inputs: ['ambience_asset', 'sound_qa_report'], outputs: ['private_selected_sound_artifact', 'provenance_report'], qualification: privateInternal },
    ],
    limitations: ['Overall route is fixture-qualified because generation is a required Mirelo branch; deterministic extension alone has private-local evidence.'],
  }),
  route({
    key: 'sound.route.repair.dialogue_gentle.v1',
    capabilities: ['sound.repair_audio', 'sound.clean_dialogue', 'sound.reduce_noise'],
    jobs: ['repair_audio', 'clean_dialogue', 'reduce_noise'], role: 'primary',
    requiredInputs: ['approved_source_audio', 'speech_ranges'],
    outputs: ['cleaned_dialogue_asset', 'sound_qa_report', 'provenance_report'],
    steps: [
      { key: 'gentle_cleanup', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'cleanup_dialogue_gentle', profile: 'sound.cleanup.gentle.v1', inputs: ['approved_source_audio'], outputs: ['cleaned_dialogue_asset'], qualification: privateInternal },
      { key: 'rnnoise_optional', tool: 'rnnoise', toolVersion: 'registry-current', operation: 'denoise_voice_bounded', profile: 'sound.rnnoise.voice.v1', depends: ['gentle_cleanup'], inputs: ['cleaned_dialogue_asset'], outputs: ['cleaned_dialogue_asset_v2'], condition: 'approved_noise_profile_requires_rnnoise', qualification: privateInternal, optional: true },
      { key: 'analyze_dialogue', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.output.v1', depends: ['gentle_cleanup'], inputs: ['cleaned_dialogue_asset'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'qa_dialogue', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.dialogue.v1', depends: ['analyze_dialogue'], inputs: ['cleaned_dialogue_asset'], outputs: ['sound_qa_report'], qualification: privateInternal },
      { key: 'commit_dialogue', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_dialogue'], inputs: ['cleaned_dialogue_asset', 'sound_qa_report'], outputs: ['private_selected_sound_artifact', 'provenance_report'], qualification: privateInternal },
    ],
    limitations: ['Gentle speech-safe cleanup only; DeepFilterNet remains declared and unqualified.'],
  }),
  route({
    key: 'sound.route.edit.deterministic.v1',
    capabilities: ['sound.edit_audio', 'sound.trim_audio', 'sound.fade_audio', 'sound.adjust_gain', 'sound.normalize_audio', 'sound.resample_audio', 'sound.convert_audio_channels', 'sound.loop_audio'],
    jobs: ['edit_audio', 'trim_audio', 'fade_audio', 'adjust_gain', 'normalize_audio', 'resample_audio', 'convert_audio_channels', 'loop_audio'], role: 'primary',
    requiredInputs: ['approved_source_audio', 'bounded_operation_profile'],
    outputs: ['edited_audio_asset_version', 'provenance_report'],
    steps: [
      { key: 'trim_fade_gain', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'trim_fade_gain_audio', profile: 'sound.trim-fade-gain.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], condition: 'job_requires_trim_fade_or_gain', qualification: privateInternal },
      { key: 'normalize', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'normalize_audio_loudness', profile: 'sound.normalize.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], condition: 'job_requires_normalization', qualification: privateInternal },
      { key: 'resample_channels', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'resample_convert_channels', profile: 'sound.resample-channels.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], condition: 'job_requires_resample_or_channels', qualification: privateInternal },
      { key: 'loop_audio', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'loop_audio_crossfade', profile: 'sound.loop.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], condition: 'job_requires_loop', qualification: privateInternal },
      { key: 'analyze_output', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.output.v1', depends: ['trim_fade_gain', 'normalize', 'resample_channels', 'loop_audio'], inputs: ['edited_audio_asset_version'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'validate_output', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.audio.v1', depends: ['analyze_output'], inputs: ['edited_audio_asset_version'], outputs: ['validated_audio_metadata'], qualification: privateInternal },
      { key: 'commit_output', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['validate_output'], inputs: ['edited_audio_asset_version'], outputs: ['private_selected_sound_artifact', 'provenance_report'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.retime.pitch_preserved.v1',
    capabilities: ['sound.time_stretch_audio', 'sound.pitch_shift_audio'],
    jobs: ['time_stretch_audio', 'pitch_shift_audio'], role: 'primary',
    requiredInputs: ['approved_source_audio', 'bounded_retime_profile'], outputs: ['edited_audio_asset_version', 'sound_qa_report'],
    steps: [
      { key: 'retime_sound', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'stretch_pitch_audio', profile: 'sound.stretch-pitch.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], qualification: privateInternal },
      { key: 'signalsmith_optional', tool: 'signalsmith_stretch', toolVersion: 'registry-current', operation: 'stretch_pitch_bounded', profile: 'sound.signalsmith.stretch.v1', inputs: ['approved_source_audio'], outputs: ['edited_audio_asset_version'], condition: 'approved_high_quality_retime_profile', qualification: privateInternal, optional: true },
      { key: 'analyze_retime', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.output.v1', depends: ['retime_sound'], inputs: ['edited_audio_asset_version'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'qa_retime', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.retime.v1', depends: ['analyze_retime'], inputs: ['edited_audio_asset_version'], outputs: ['sound_qa_report'], qualification: privateInternal },
    ],
    limitations: ['Current active local path uses bounded FFmpeg retime; Signalsmith is an optional separately qualified profile.'],
  }),
  route({
    key: 'sound.route.sync.visual_event.v1',
    capabilities: ['sound.sync_audio_to_visual', 'sound.align_sound_transient'],
    jobs: ['sync_audio_to_visual', 'align_sound_transient'], role: 'support',
    requiredInputs: ['approved_sound_asset', 'versioned_visual_event', 'timing_manifest'],
    outputs: ['sound_cue_manifest', 'mix_automation_manifest', 'sound_qa_report'],
    steps: [
      { key: 'analyze_transient', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'sync_transient_qa', profile: 'sound.sync-qa.v1', inputs: ['approved_sound_asset'], outputs: ['transient_timing_report'], qualification: privateInternal },
      { key: 'align_event', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'align_sound_to_visual_event', profile: 'sound.sync.visual_event.v1', depends: ['analyze_transient'], inputs: ['transient_timing_report', 'versioned_visual_event'], outputs: ['sound_cue_manifest'], qualification: privateInternal },
      { key: 'create_mix_automation', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_speech_safe_mix_automation', profile: 'sound.mix.automation.v1', depends: ['align_event'], inputs: ['sound_cue_manifest', 'dialogue_context'], outputs: ['mix_automation_manifest'], qualification: privateInternal },
      { key: 'qa_sync', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.sync.v1', depends: ['create_mix_automation'], inputs: ['sound_cue_manifest', 'mix_automation_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.mix.scene.v1',
    capabilities: ['sound.mix_sound_layers', 'sound.create_sound_stem'],
    jobs: ['mix_sound_layers', 'create_sound_stem'], role: 'primary',
    requiredInputs: ['approved_sound_layers', 'dialogue_context', 'read_only_music_context'],
    outputs: ['private_sound_stem', 'mix_automation_manifest', 'sound_qa_report'],
    steps: [
      { key: 'create_mix_automation', tool: 'sound_sync_service', toolVersion: '1.0.0', operation: 'create_speech_safe_mix_automation', profile: 'sound.mix.automation.v1', inputs: ['approved_sound_layers', 'dialogue_context', 'read_only_music_context'], outputs: ['mix_automation_manifest'], qualification: privateInternal },
      { key: 'mix_stem', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'mix_scene_stem', profile: 'sound.mix-stem.v1', depends: ['create_mix_automation'], inputs: ['approved_sound_layers', 'dialogue_context', 'mix_automation_manifest'], outputs: ['private_sound_stem'], qualification: privateInternal },
      { key: 'analyze_mix', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.output.v1', depends: ['mix_stem'], inputs: ['private_sound_stem'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'qa_mix', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.mix.v1', depends: ['analyze_mix'], inputs: ['private_sound_stem', 'mix_automation_manifest'], outputs: ['sound_qa_report'], qualification: privateInternal },
      { key: 'commit_mix', tool: 'sound_private_artifact_store', toolVersion: privateStoreVersion, operation: 'commit_selected_sound_artifact', profile: 'sound.artifact.commit_selected.v1', depends: ['qa_mix'], inputs: ['private_sound_stem'], outputs: ['private_selected_sound_artifact'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.qa.final_sound.v1',
    capabilities: ['sound.qa_sound', 'sound.handoff_sound_to_final_composition'],
    jobs: ['qa_sound', 'handoff_sound_to_final_composition'], role: 'qa',
    requiredInputs: ['private_sound_stem', 'sound_cue_manifest', 'approved_timing_manifest'],
    outputs: ['sound_qa_report', 'final_composition_sound_handoff', 'caller_receipt'],
    steps: [
      { key: 'inspect_final_audio', tool: 'ffprobe', toolVersion: ffmpegVersion, operation: 'inspect_validate_audio', profile: 'sound.inspect.final.v1', inputs: ['private_sound_stem'], outputs: ['validated_audio_metadata'], qualification: privateInternal },
      { key: 'analyze_final_audio', tool: 'ffmpeg', toolVersion: ffmpegVersion, operation: 'analyze_audio_pcm', profile: 'sound.analyze.final.v1', depends: ['inspect_final_audio'], inputs: ['private_sound_stem'], outputs: ['final_audio_metrics'], qualification: privateInternal },
      { key: 'evaluate_final_sound', tool: 'sound_qa_service', toolVersion: '1.0.0', operation: 'evaluate_final_sound', profile: 'sound.qa.final.v1', depends: ['analyze_final_audio'], inputs: ['final_audio_metrics', 'sound_cue_manifest'], outputs: ['sound_qa_report', 'final_composition_sound_handoff', 'caller_receipt'], qualification: privateInternal },
    ],
  }),
  route({
    key: 'sound.route.no_sound.v1',
    capabilities: [
      'sound.design_scene_sound', 'sound.design_boundary_sound', 'sound.full_video_sound_pass',
      'sound.support_living_frame_sound', 'sound.support_3d_sound',
      'sound.support_motion_design_sound', 'sound.support_transition_sound',
      'sound.support_graphic_design_sound', 'sound.generate_video_conditioned_sfx',
      'sound.generate_text_conditioned_sfx', 'sound.generate_foley',
      'sound.generate_ambience', 'sound.extend_ambience',
      'sound.search_sound_library', 'sound.extract_project_owned_sound',
    ],
    jobs: [
      'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
      'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
      'support_transition_sound', 'support_graphic_design_sound',
      'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
      'generate_foley', 'generate_ambience', 'extend_ambience',
      'search_sound_library', 'extract_project_owned_sound',
    ], role: 'no_sound',
    requiredInputs: [], outputs: ['no_sound_decision', 'caller_receipt'],
    steps: [{
      key: 'decide_no_sound', tool: 'sound_no_sound_decision', toolVersion: '1.0.0',
      operation: 'decide_intentional_no_sound', profile: 'sound.no_sound.professional.v1',
      inputs: ['sound_design_context'], outputs: ['no_sound_decision', 'caller_receipt'], qualification: privateInternal,
    }],
    limitations: ['Intentional silence is valid only with a typed reason and caller receipt.'],
  }),
] as const

for (const manifest of SOUND_TOOL_ROUTE_MANIFESTS) registerSoundToolRouteManifest(manifest)
validateSoundToolRouteRegistry()

export function registerCanonicalSoundToolRoutes(): void {
  registerCanonicalSoundToolManifests()
  for (const manifest of SOUND_TOOL_ROUTE_MANIFESTS) registerSoundToolRouteManifest(manifest)
  validateSoundToolRouteRegistry()
}
