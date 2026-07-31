export const LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_VERSION =
  'living-frame-ai-2d-interpolation-qualification-v1' as const

export const LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_CLASS =
  'source_only_non_executable_ai_2d_interpolation_tool_qualification' as const

export type LivingFrameAi2dInterpolationCandidateId =
  | 'tooncrafter_official_candidate'
  | 'rife_official_candidate'

export interface LivingFrameAi2dInterpolationCandidate {
  readonly candidateId:
    LivingFrameAi2dInterpolationCandidateId
  readonly proposedToolId:
    | 'tooncrafter'
    | 'rife'
  readonly proposedOperationId:
    | 'tool.tooncrafter.interpolate_accepted_character_keyposes.v1'
    | 'tool.rife.smooth_accepted_character_motion.v1'
  readonly upstreamRepositorySlug:
    | 'Doubiiu/ToonCrafter'
    | 'hzwer/ECCV2022-RIFE'
  readonly declaredSourceLicense:
    | 'Apache-2.0'
    | 'MIT'
  readonly boundedResponsibility:
    | 'generate_bounded_motion_between_two_already_accepted_complete_character_keyposes'
    | 'smooth_frame_cadence_only_after_underlying_character_motion_is_accepted'
  readonly inputPolicy: {
    readonly acceptedPrivateArtifactRefsOnly:
      true
    readonly exactSceneComponentWorkTimingAndStyleLineageRequired:
      true
    readonly rawChatPromptPathUrlBytesCredentialCommandOrEnvironmentForbidden:
      true
    readonly callerModelCheckpointSeedDimensionsOrRuntimeSettingsForbidden:
      true
    readonly finalCanvasInputForbidden: true
  }
  readonly outputPolicy: {
    readonly onePrivateCandidateOutputPerAttempt:
      true
    readonly contentAddressedDigestAndFrameCountRequired:
      true
    readonly createOnlyPersistenceAndExactRereadRequired:
      true
    readonly outputCannotClaimAnatomyIdentityOrAttachmentRepair:
      true
    readonly outputCannotClaimFinalCanvas:
      true
    readonly remotionOwnsFinalCanvas: true
  }
  readonly requiredReleaseEvidence: readonly (
    | 'exact_source_commit_and_source_archive_digest'
    | 'independent_source_license_disposition'
    | 'exact_model_weight_inventory_hash_and_license_disposition'
    | 'dependency_lock_and_offline_build_inputs'
    | 'signed_scanned_non_root_no_network_runtime_image'
    | 'fixed_server_owned_entrypoint_and_request_schema'
    | 'no_runtime_download_or_dynamic_code_execution'
    | 'gpu_or_cpu_hardware_fit_and_peak_resource_evidence'
    | 'cold_warm_and_per_frame_latency_evidence'
    | 'one_attempt_one_output_and_idempotent_replay_evidence'
    | 'private_output_persistence_reread_and_tenant_isolation'
    | 'anatomy_identity_costume_prop_attachment_and_temporal_visual_qa'
    | 'canonical_resource_and_actual_cost_receipt'
    | 'professional_fallback_and_local_repair_evidence'
  )[]
  readonly currentEvidence: {
    readonly upstreamCapabilityReviewed:
      true
    readonly declaredSourceLicenseObserved:
      true
    readonly exactSourceCommitPinned:
      false
    readonly exactSourceArchiveScanned:
      false
    readonly modelWeightLicenseReleased:
      false
    readonly offlineImageReleased: false
    readonly fixedEntrypointReleased: false
    readonly supportedHardwareMeasured: false
    readonly realPrivateInferenceExecuted:
      false
    readonly professionalRenderedVisualAcceptancePassed:
      false
    readonly resourceAndActualCostReceiptReleased:
      false
  }
  readonly qualificationState:
    'evaluation_blocked_pending_source_model_runtime_and_visual_evidence'
  readonly registryIdentityCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
}

export interface LivingFrameAi2dInterpolationQualificationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_CLASS
  readonly state:
    'source_reviewed_evaluation_candidates_runtime_blocked'
  readonly candidates:
    readonly LivingFrameAi2dInterpolationCandidate[]
  readonly sequencingRules: {
    readonly toonCrafterRequiresTwoAcceptedCompleteKeyposes:
      true
    readonly toonCrafterSuccessIsNeverAssumed:
      true
    readonly toonCrafterOutputRequiresFullProfessionalVisualReview:
      true
    readonly rifeRequiresAcceptedUnderlyingMotion:
      true
    readonly rifeCannotRepairAnatomyIdentityOrAttachments:
      true
    readonly rifeOutputRequiresRegressionVisualReview:
      true
    readonly eitherFailureReturnsToAcceptedStillOrRestrainedMotion:
      true
  }
  readonly registryPolicy: {
    readonly currentRegistryUnchanged:
      true
    readonly registryExpansionPermittedForDistinctReleasedRuntime:
      true
    readonly noIdentityForWeightsAdaptersLibrariesOrPreprocessors:
      true
    readonly postQualificationHostDispositionRequiresCanonicalOwnerDecision:
      true
  }
  readonly authorityBoundary: {
    readonly registryAuthority: false
    readonly operationAuthority: false
    readonly providerAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameAi2dInterpolationQualification
  extends LivingFrameAi2dInterpolationQualificationDraft {
  readonly qualificationDigestSha256:
    string
}
