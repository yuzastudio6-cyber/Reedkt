import {
  LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_CLASS,
  LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_VERSION,
  type LivingFrameAi2dInterpolationCandidate,
  type LivingFrameAi2dInterpolationQualification,
  type LivingFrameAi2dInterpolationQualificationDraft,
} from '../../src/types/living-frame-ai-2d-interpolation-qualification'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const REQUIRED_RELEASE_EVIDENCE = [
  'exact_source_commit_and_source_archive_digest',
  'independent_source_license_disposition',
  'exact_model_weight_inventory_hash_and_license_disposition',
  'dependency_lock_and_offline_build_inputs',
  'signed_scanned_non_root_no_network_runtime_image',
  'fixed_server_owned_entrypoint_and_request_schema',
  'no_runtime_download_or_dynamic_code_execution',
  'gpu_or_cpu_hardware_fit_and_peak_resource_evidence',
  'cold_warm_and_per_frame_latency_evidence',
  'one_attempt_one_output_and_idempotent_replay_evidence',
  'private_output_persistence_reread_and_tenant_isolation',
  'anatomy_identity_costume_prop_attachment_and_temporal_visual_qa',
  'canonical_resource_and_actual_cost_receipt',
  'professional_fallback_and_local_repair_evidence',
] as const satisfies LivingFrameAi2dInterpolationCandidate['requiredReleaseEvidence']

const CURRENT_EVIDENCE = {
  upstreamCapabilityReviewed: true,
  declaredSourceLicenseObserved:
    true,
  exactSourceCommitPinned: false,
  exactSourceArchiveScanned: false,
  modelWeightLicenseReleased: false,
  offlineImageReleased: false,
  fixedEntrypointReleased: false,
  supportedHardwareMeasured: false,
  realPrivateInferenceExecuted: false,
  professionalRenderedVisualAcceptancePassed:
    false,
  resourceAndActualCostReceiptReleased:
    false,
} as const

export function compileLivingFrameAi2dInterpolationQualification():
LivingFrameAi2dInterpolationQualification {
  const candidates = [
    candidate({
      candidateId:
        'tooncrafter_official_candidate',
      proposedToolId: 'tooncrafter',
      proposedOperationId:
        'tool.tooncrafter.interpolate_accepted_character_keyposes.v1',
      upstreamRepositorySlug:
        'Doubiiu/ToonCrafter',
      declaredSourceLicense:
        'Apache-2.0',
      boundedResponsibility:
        'generate_bounded_motion_between_two_already_accepted_complete_character_keyposes',
    }),
    candidate({
      candidateId:
        'rife_official_candidate',
      proposedToolId: 'rife',
      proposedOperationId:
        'tool.rife.smooth_accepted_character_motion.v1',
      upstreamRepositorySlug:
        'hzwer/ECCV2022-RIFE',
      declaredSourceLicense: 'MIT',
      boundedResponsibility:
        'smooth_frame_cadence_only_after_underlying_character_motion_is_accepted',
    }),
  ] as const
  const draft:
    LivingFrameAi2dInterpolationQualificationDraft = {
      contractVersion:
        LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_VERSION,
      resultClass:
        LIVING_FRAME_AI_2D_INTERPOLATION_QUALIFICATION_CLASS,
      state:
        'source_reviewed_evaluation_candidates_runtime_blocked',
      candidates,
      sequencingRules: {
        toonCrafterRequiresTwoAcceptedCompleteKeyposes:
          true,
        toonCrafterSuccessIsNeverAssumed:
          true,
        toonCrafterOutputRequiresFullProfessionalVisualReview:
          true,
        rifeRequiresAcceptedUnderlyingMotion:
          true,
        rifeCannotRepairAnatomyIdentityOrAttachments:
          true,
        rifeOutputRequiresRegressionVisualReview:
          true,
        eitherFailureReturnsToAcceptedStillOrRestrainedMotion:
          true,
      },
      registryPolicy: {
        currentRegistryUnchanged: true,
        registryExpansionPermittedForDistinctReleasedRuntime:
          true,
        noIdentityForWeightsAdaptersLibrariesOrPreprocessors:
          true,
        postQualificationHostDispositionRequiresCanonicalOwnerDecision:
          true,
      },
      authorityBoundary: {
        registryAuthority: false,
        operationAuthority: false,
        providerAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    qualificationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameAi2dInterpolationQualification(
  value: unknown,
): value is LivingFrameAi2dInterpolationQualification {
  return stableAuthorityStringify(
    value,
  ) === stableAuthorityStringify(
    compileLivingFrameAi2dInterpolationQualification(),
  )
}

function candidate(
  identity: Pick<
    LivingFrameAi2dInterpolationCandidate,
    | 'candidateId'
    | 'proposedToolId'
    | 'proposedOperationId'
    | 'upstreamRepositorySlug'
    | 'declaredSourceLicense'
    | 'boundedResponsibility'
  >,
): LivingFrameAi2dInterpolationCandidate {
  return deepFreeze({
    ...identity,
    inputPolicy: {
      acceptedPrivateArtifactRefsOnly:
        true,
      exactSceneComponentWorkTimingAndStyleLineageRequired:
        true,
      rawChatPromptPathUrlBytesCredentialCommandOrEnvironmentForbidden:
        true,
      callerModelCheckpointSeedDimensionsOrRuntimeSettingsForbidden:
        true,
      finalCanvasInputForbidden: true,
    },
    outputPolicy: {
      onePrivateCandidateOutputPerAttempt:
        true,
      contentAddressedDigestAndFrameCountRequired:
        true,
      createOnlyPersistenceAndExactRereadRequired:
        true,
      outputCannotClaimAnatomyIdentityOrAttachmentRepair:
        true,
      outputCannotClaimFinalCanvas:
        true,
      remotionOwnsFinalCanvas: true,
    },
    requiredReleaseEvidence:
      REQUIRED_RELEASE_EVIDENCE,
    currentEvidence: CURRENT_EVIDENCE,
    qualificationState:
      'evaluation_blocked_pending_source_model_runtime_and_visual_evidence',
    registryIdentityCreated: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    canonicalQaApproved: false,
  })
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(nested)
  return value
}
