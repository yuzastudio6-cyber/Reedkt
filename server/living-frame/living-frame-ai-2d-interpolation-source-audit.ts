import {
  LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_CLASS,
  LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_VERSION,
  type LivingFrameAi2dInterpolationSourceAudit,
  type LivingFrameAi2dInterpolationSourceAuditDraft,
  type LivingFrameAi2dInterpolationSourceCandidateAudit,
} from '../../src/types/living-frame-ai-2d-interpolation-source-audit'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const COMMON_UNRESOLVED_EVIDENCE = [
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
] as const

export function compileLivingFrameAi2dInterpolationSourceAudit():
LivingFrameAi2dInterpolationSourceAudit {
  const candidateAudits = [
    toonCrafterAudit(),
    rifeAudit(),
  ] as const
  const draft:
    LivingFrameAi2dInterpolationSourceAuditDraft = {
      contractVersion:
        LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_VERSION,
      resultClass:
        LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_CLASS,
      capturedAtUtc:
        '2026-07-31T00:00:00.000Z',
      evidenceMethod: {
        officialRepositoryMetadataRead:
          true,
        exactCommitArchiveDownloadedTwice:
          true,
        repeatedArchiveBytesCompared:
          true,
        archiveInventoryAndStaticRiskScanPerformed:
          true,
        modelWeightsDownloaded: false,
        dependenciesInstalled: false,
        runtimeStarted: false,
        inferenceExecuted: false,
      },
      candidateAudits,
      sourcePinningCompleteForBothCandidates:
        true,
      runtimeQualificationComplete:
        false,
      sourceLicenseObservationIsNotModelOrCommercialRelease:
        true,
      containsSourceArchiveModelBytesPathUrlCredentialCommandOrEnvironment:
        false,
      registryIdentityCreated: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    auditDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameAi2dInterpolationSourceAudit(
  value: unknown,
): value is LivingFrameAi2dInterpolationSourceAudit {
  return stableAuthorityStringify(value) ===
    stableAuthorityStringify(
      compileLivingFrameAi2dInterpolationSourceAudit(),
    )
}

function toonCrafterAudit():
LivingFrameAi2dInterpolationSourceCandidateAudit {
  return deepFreeze({
    candidateId:
      'tooncrafter_official_candidate',
    proposedToolId: 'tooncrafter',
    upstreamRepositorySlug:
      'Doubiiu/ToonCrafter',
    pinnedCommitSha:
      'b0c47ff339c5e5ec45b84d0c6587850f242d41ef',
    pinnedCommitDateUtc:
      '2025-03-19T06:43:54Z',
    officialGithubCommitMetadataObserved:
      true,
    sourceArchive: {
      sha256:
        '6bba686b76434291a5ce58911edad565b51e31d15319c779f0f1627b938a23ca',
      byteLength: 12_122_980,
      repeatedDownloadByteIdentical:
        true,
      extractedRegularFileCount: 81,
      extractedRegularFileBytes:
        12_509_772,
      symlinkCount: 0,
      filesLargerThanTenMiB: 0,
      sourceArchivePersistedInRepository:
        false,
    },
    sourceLicense: {
      observedSpdxId: 'Apache-2.0',
      licenseFileSha256:
        '9849d33ce88d14d755c8d71d7c8e6deecf7e9ff8d91a6ca0ee5cd9058120b830',
      upstreamLicenseObserved: true,
      independentLegalDispositionReleased:
        false,
    },
    dependencyManifest: {
      path: 'requirements.txt',
      sha256:
        'da576e8543bddd16c29749dcdba3e77456d09bc7171e0f5c748d17eb6f385664',
      fullyVersionPinned: false,
      offlineLockReleased: false,
    },
    modelEvidence: {
      inventoryState:
        'official_single_checkpoint_observed_not_downloaded',
      repositoryRevisionSha:
        '7c56c5a23d9f8a9d99398e2a2491fff4bd6cffaf',
      observedCheckpointSha256:
        'e4df5aecd9919af2f41a92912bb6391e03531b269785a7448d87e964462edf53',
      observedCheckpointSizeLabel:
        '10.5 GB',
      pickleImportsObserved: [
        'torch._utils._rebuild_tensor_v2',
        'torch.FloatStorage',
        'collections.OrderedDict',
      ],
      modelCardLicenseStatementObserved:
        true,
      exactModelWeightInventoryReleased:
        false,
      modelWeightLicenseDispositionReleased:
        false,
      safeDeserializationEvidenceReleased:
        false,
    },
    upstreamCapabilityObservation: {
      observationOnlyNotLocalProof: true,
      summary:
        'Upstream documents two-image cartoon interpolation at 512x320 for up to 16 frames, reports approximately 24 to 27G in the official implementation, and warns that success is not guaranteed.',
      maximumFramesClaimed: 16,
      widthPixelsClaimed: 512,
      heightPixelsClaimed: 320,
      officialGpuMemoryRangeClaimed:
        'approximately_24G_to_27G',
    },
    staticRiskCodes: [
      'runtime_huggingface_download_path_present',
      'dependency_manifest_not_fully_pinned',
      'large_pickle_checkpoint_requires_separate_safe_weight_disposition',
      'official_memory_profile_not_safely_within_l4_capacity',
      'upstream_cli_forbidden_fixed_adapter_required',
    ],
    resolvedEvidence: [
      'exact_source_commit_and_source_archive_digest',
    ],
    unresolvedEvidence:
      COMMON_UNRESOLVED_EVIDENCE,
    qualificationState:
      'source_pinned_and_static_risks_recorded_runtime_still_blocked',
    registryIdentityCreated: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    canonicalQaApproved: false,
  })
}

function rifeAudit():
LivingFrameAi2dInterpolationSourceCandidateAudit {
  return deepFreeze({
    candidateId:
      'rife_official_candidate',
    proposedToolId: 'rife',
    upstreamRepositorySlug:
      'hzwer/ECCV2022-RIFE',
    pinnedCommitSha:
      '5d8adbdd40e12c2c8f91930eff838aebe561c086',
    pinnedCommitDateUtc:
      '2025-09-10T06:32:03Z',
    officialGithubCommitMetadataObserved:
      true,
    sourceArchive: {
      sha256:
        'd2b3822a1a9241f87bd05d5255dd30b44395d24573ce918b90732419e64d324a',
      byteLength: 3_912_872,
      repeatedDownloadByteIdentical:
        true,
      extractedRegularFileCount: 45,
      extractedRegularFileBytes:
        4_062_528,
      symlinkCount: 0,
      filesLargerThanTenMiB: 0,
      sourceArchivePersistedInRepository:
        false,
    },
    sourceLicense: {
      observedSpdxId: 'MIT',
      licenseFileSha256:
        'f629619f078e3ed699f1ea401248cb7796c36334e3b8ec0eb2c082eceaa5f084',
      upstreamLicenseObserved: true,
      independentLegalDispositionReleased:
        false,
    },
    dependencyManifest: {
      path: 'requirements.txt',
      sha256:
        '367487b035f580e163761c142fa2dc5fa9d599fb1a59812c075d6db0861b4ea7',
      fullyVersionPinned: false,
      offlineLockReleased: false,
    },
    modelEvidence: {
      inventoryState:
        'upstream_external_archive_unresolved',
      modelCardLicenseStatementObserved:
        false,
      exactModelWeightInventoryReleased:
        false,
      modelWeightLicenseDispositionReleased:
        false,
      safeDeserializationEvidenceReleased:
        false,
    },
    upstreamCapabilityObservation: {
      observationOnlyNotLocalProof: true,
      summary:
        'Upstream documents arbitrary-timestep frame interpolation and claims more than 30 FPS for 2x 720p interpolation on a 2080 Ti; neither claim is local qualification evidence.',
    },
    staticRiskCodes: [
      'upstream_shell_ffmpeg_invocation_present',
      'dependency_manifest_not_fully_pinned',
      'model_archive_digest_size_and_license_unresolved',
      'upstream_cli_forbidden_fixed_adapter_required',
    ],
    resolvedEvidence: [
      'exact_source_commit_and_source_archive_digest',
    ],
    unresolvedEvidence:
      COMMON_UNRESOLVED_EVIDENCE,
    qualificationState:
      'source_pinned_and_static_risks_recorded_runtime_still_blocked',
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
