export const LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_VERSION =
  'living-frame-ai-2d-interpolation-source-audit-v1' as const

export const LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_CLASS =
  'pinned_source_archive_and_static_risk_evidence_without_runtime_release' as const

export type LivingFrameAi2dInterpolationSourceRiskCode =
  | 'runtime_huggingface_download_path_present'
  | 'upstream_shell_ffmpeg_invocation_present'
  | 'dependency_manifest_not_fully_pinned'
  | 'large_pickle_checkpoint_requires_separate_safe_weight_disposition'
  | 'official_memory_profile_not_safely_within_l4_capacity'
  | 'model_archive_digest_size_and_license_unresolved'
  | 'upstream_cli_forbidden_fixed_adapter_required'

export interface LivingFrameAi2dInterpolationSourceCandidateAudit {
  readonly candidateId:
    | 'tooncrafter_official_candidate'
    | 'rife_official_candidate'
  readonly proposedToolId:
    | 'tooncrafter'
    | 'rife'
  readonly upstreamRepositorySlug:
    | 'Doubiiu/ToonCrafter'
    | 'hzwer/ECCV2022-RIFE'
  readonly pinnedCommitSha: string
  readonly pinnedCommitDateUtc: string
  readonly officialGithubCommitMetadataObserved:
    true
  readonly sourceArchive: {
    readonly sha256: string
    readonly byteLength: number
    readonly repeatedDownloadByteIdentical:
      true
    readonly extractedRegularFileCount:
      number
    readonly extractedRegularFileBytes:
      number
    readonly symlinkCount: 0
    readonly filesLargerThanTenMiB: 0
    readonly sourceArchivePersistedInRepository:
      false
  }
  readonly sourceLicense: {
    readonly observedSpdxId:
      | 'Apache-2.0'
      | 'MIT'
    readonly licenseFileSha256: string
    readonly upstreamLicenseObserved:
      true
    readonly independentLegalDispositionReleased:
      false
  }
  readonly dependencyManifest: {
    readonly path: 'requirements.txt'
    readonly sha256: string
    readonly fullyVersionPinned: false
    readonly offlineLockReleased: false
  }
  readonly modelEvidence: {
    readonly inventoryState:
      | 'official_single_checkpoint_observed_not_downloaded'
      | 'upstream_external_archive_unresolved'
    readonly repositoryRevisionSha?:
      string
    readonly observedCheckpointSha256?:
      string
    readonly observedCheckpointSizeLabel?:
      string
    readonly pickleImportsObserved?:
      readonly string[]
    readonly modelCardLicenseStatementObserved:
      boolean
    readonly exactModelWeightInventoryReleased:
      false
    readonly modelWeightLicenseDispositionReleased:
      false
    readonly safeDeserializationEvidenceReleased:
      false
  }
  readonly upstreamCapabilityObservation: {
    readonly observationOnlyNotLocalProof:
      true
    readonly summary: string
    readonly maximumFramesClaimed?: number
    readonly widthPixelsClaimed?: number
    readonly heightPixelsClaimed?: number
    readonly officialGpuMemoryRangeClaimed?:
      'approximately_24G_to_27G'
  }
  readonly staticRiskCodes:
    readonly LivingFrameAi2dInterpolationSourceRiskCode[]
  readonly resolvedEvidence: readonly [
    'exact_source_commit_and_source_archive_digest',
  ]
  readonly unresolvedEvidence: readonly string[]
  readonly qualificationState:
    'source_pinned_and_static_risks_recorded_runtime_still_blocked'
  readonly registryIdentityCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
}

export interface LivingFrameAi2dInterpolationSourceAuditDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AI_2D_INTERPOLATION_SOURCE_AUDIT_CLASS
  readonly capturedAtUtc:
    '2026-07-31T00:00:00.000Z'
  readonly evidenceMethod: {
    readonly officialRepositoryMetadataRead:
      true
    readonly exactCommitArchiveDownloadedTwice:
      true
    readonly repeatedArchiveBytesCompared:
      true
    readonly archiveInventoryAndStaticRiskScanPerformed:
      true
    readonly modelWeightsDownloaded: false
    readonly dependenciesInstalled: false
    readonly runtimeStarted: false
    readonly inferenceExecuted: false
  }
  readonly candidateAudits:
    readonly LivingFrameAi2dInterpolationSourceCandidateAudit[]
  readonly sourcePinningCompleteForBothCandidates:
    true
  readonly runtimeQualificationComplete:
    false
  readonly sourceLicenseObservationIsNotModelOrCommercialRelease:
    true
  readonly containsSourceArchiveModelBytesPathUrlCredentialCommandOrEnvironment:
    false
  readonly registryIdentityCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameAi2dInterpolationSourceAudit
  extends LivingFrameAi2dInterpolationSourceAuditDraft {
  readonly auditDigestSha256: string
}
