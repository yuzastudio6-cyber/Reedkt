export const
LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION =
  'living-frame-comfyui-container-sbom-evidence-v1' as const

export const
LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS =
  'controlled_non_promotable_image_derived_spdx_package_inventory' as const

export const
LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE =
  'exact_local_image_inventory_with_release_policy_failures' as const

export const
LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES = [
  'canonical_image_repository_admission_required',
  'independent_sbom_validation_required',
  'vulnerability_scan_and_disposition_required',
  'image_signature_and_provenance_attestation_required',
  'default_non_root_or_released_runtime_override_required',
  'inherited_distribution_scope_and_license_review_required',
  'out_of_scope_vcs_distribution_disposition_required',
  'approved_l4_runtime_and_operation_release_required',
] as const

export type LivingFrameComfyUiContainerSbomOpenGate =
  (typeof
    LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES)[number]

export interface LivingFrameComfyUiContainerSbomAuthority {
  readonly controlledImageInventoryAuthority: true
  readonly boundedSpdxProjectionAuthority: true
  readonly canonicalImageAuthority: false
  readonly canonicalArtifactRepositoryAuthority: false
  readonly vulnerabilityScanAuthority: false
  readonly signatureAuthority: false
  readonly provenanceAttestationAuthority: false
  readonly licenseApprovalAuthority: false
  readonly modelArtifactAuthority: false
  readonly gpuExecutionAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactCreationAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComfyUiContainerSbomEvidenceDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS
  readonly evidenceId: string
  readonly evidenceState:
    typeof
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE
  readonly imageObservation: {
    readonly candidateImageDigestSha256: string
    readonly repositoryDigestMatchedCandidateDigest: true
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly localImageOnly: true
    readonly canonicalImageRepositoryAdmissionPresent: false
    readonly imageSignatureVerified: false
    readonly provenanceAttestationVerified: false
    readonly vulnerabilityScanCompleted: false
    readonly imageDefaultUser: 'root_or_unspecified'
    readonly explicitUnprivilegedRuntimeOverrideObserved: true
    readonly explicitRuntimeUid: 65_532
    readonly explicitRuntimeGid: 65_532
    readonly rootFilesystemReadOnlyObserved: true
    readonly networkDisabledObserved: true
    readonly localArchitectureEmulationUsed: true
  }
  readonly sourceBinding: {
    readonly controlledBaseImageDigestSha256: string
    readonly wheelManifestDigestSha256: string
    readonly comfyUiRevision: string
    readonly genericIpAdapterRevision: string
    readonly controlNetAuxRevision: string
    readonly exactImageLabelsMatched: true
  }
  readonly packageInventory: {
    readonly format: 'SPDX-2.3'
    readonly dataLicense: 'CC0-1.0'
    readonly generator:
      'ReeditPro bounded container package inventory v1'
    readonly documentNamespaceUrn: string
    readonly documentByteLength: number
    readonly documentSha256: string
    readonly debianPackageCount: number
    readonly pythonDistributionCount: number
    readonly lockedWheelDistributionCount: 35
    readonly inheritedPythonDistributionCount: number
    readonly sourceArchivePackageCount: 3
    readonly totalPackageCount: number
    readonly expectedLockedWheelSetMatched: true
    readonly expectedSourceRevisionSetMatched: true
    readonly processBoundObservationReadTwice: true
    readonly stableInventoryObservedTwice: true
    readonly packageManagerInventoryComplete: true
    readonly filesystemComponentInventoryClaimed: false
    readonly outOfScopeDirectVcsDistributionCodes:
      readonly ['sam-2']
    readonly outOfScopeDirectVcsDistributionCount: 1
    readonly rawPathUrlCredentialSecretOrPackageBytesIncluded: false
  }
  readonly releasePolicy: {
    readonly packageInventoryAvailableForReview: true
    readonly independentSbomValidationPassed: false
    readonly vulnerabilityDispositionPassed: false
    readonly signatureAndProvenancePassed: false
    readonly defaultNonRootPassed: false
    readonly inheritedDistributionScopeReviewPassed: false
    readonly outOfScopeVcsDistributionDispositionPassed: false
    readonly releasePolicyPassed: false
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiContainerSbomOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiContainerSbomAuthority
  readonly spdxDocumentLeaseIssued: true
  readonly spdxArtifactPersisted: false
  readonly selectedSceneCreated: false
  readonly providerTransportCalled: false
  readonly canonicalOperationDispatched: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiContainerSbomEvidence
  extends LivingFrameComfyUiContainerSbomEvidenceDraft {
  readonly evidenceDigestSha256: string
}

export interface LivingFrameComfyUiContainerSbomIssue {
  readonly code:
    | 'input_invalid'
    | 'reader_invalid'
    | 'reader_reused'
    | 'reader_failed'
    | 'observation_invalid'
    | 'observation_unstable'
    | 'image_identity_mismatch'
    | 'image_label_mismatch'
    | 'package_inventory_invalid'
    | 'locked_wheel_set_mismatch'
    | 'source_revision_set_mismatch'
    | 'unsafe_inventory_value'
    | 'spdx_projection_invalid'
    | 'evidence_semantics_invalid'
    | 'lease_reused'
  readonly path: string
}
