export const LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_VERSION =
  "living-frame-comfyui-pruned-no-sam2-source-build-evidence-v1" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_CLASS =
  "private_internal_source_bound_pruned_no_inherited_sam2_image_scan_evidence" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_STATUS =
  "direct_vcs_distribution_removed_zero_critical_high_manual_review_required" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_OPEN_GATES = [
  "medium_low_vulnerability_disposition_required",
  "full_license_manual_disposition_required",
  "image_signature_and_provenance_attestation_required",
  "canonical_private_image_ingest_required",
  "canonical_five_model_mount_distribution_required",
  "real_l4_graph_execution_and_resource_receipt_required",
  "private_output_persistence_qa_and_review_required",
] as const;

export interface LivingFrameComfyUiPrunedNoSam2SourceBuildObservation {
  readonly observedAt: "2026-07-30";
  readonly supersedes: {
    readonly contractVersion: "living-frame-comfyui-pruned-source-build-evidence-v1";
    readonly reason:
      "remove_unused_inherited_direct_vcs_sam2_distribution_and_repeat_complete_image_scan";
  };
  readonly source: {
    readonly featureCommitSha: "8f88f6d702781aec64b5b5795fc12c65619d93b0";
    readonly featureTreeSha: "261f6931a76800c7a3d6890dc620ac8ff8b37554";
    readonly parentImageDigestSha256: "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b";
    readonly dockerfileDigestSha256: "2586fe9274b313ca600c66d73efaba782df68bfd0dff14644475c13f2368271f";
    readonly prunerDigestSha256: "f0992d47abcc863a245a61213fccbba3f5602a56b494342932cfb7511aff4067";
    readonly verifierDigestSha256: "a442b35e268a1ae447161453cfea3ad8c659a381b38e6dee75971dcb65337b19";
    readonly removalHelperDigestSha256: "d7728338ebdc04c9a647882b9d0e16328e317f8863287dd7f4d9f6d7cf861440";
    readonly exactInputWheelCount: 33;
    readonly sourceDefinedBuild: true;
    readonly installNetworkDisabled: true;
    readonly pruneNetworkDisabled: true;
  };
  readonly directVcsRemoval: {
    readonly distributionName: "sam-2";
    readonly distributionVersion: "1.0";
    readonly sourceRevision: "2b90b9f5ceec907a1c18123530e92e794ad901a4";
    readonly metadataLicense: "Apache 2.0";
    readonly installedFileCountBeforeRemoval: 114;
    readonly installedFileListDigestSha256: "e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468";
    readonly exactAllowedRoots:
      readonly ["sam2", "training", "sam_2-1.0.dist-info"];
    readonly exactIdentityValidatedBeforeRemoval: true;
    readonly onlyAllowedRootsRemoved: true;
    readonly distributionPresentAfterRemoval: false;
    readonly sam2ModulePresentAfterRemoval: false;
    readonly trainingModulePresentAfterRemoval: false;
    readonly exactPackageCountInSbom: 0;
    readonly exactPackageLicenseFindingCount: 0;
    readonly runnerSam2ImportGuardRetained: true;
    readonly dispositionPassedForPrivateImage: true;
  };
  readonly image: {
    readonly imageDigestSha256: "51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e";
    readonly platformManifestDigestSha256: "32c3e356186f1de63379c3e31643ea78b1bf67b6443db668b59dab9f6445c9a5";
    readonly configDigestSha256: "123a7fc601d476aece02af6d38cdd2415d5a0a0d4e77b7008ecacdfa48fb7bca";
    readonly buildKitAttestationManifestDigestSha256: "9684d48b82d3a2c745aa6f51eeab5800177ab04b4bbb94b9ff454f55b55ca75b";
    readonly byteLength: 12657937701;
    readonly operatingSystem: "linux";
    readonly architecture: "amd64";
    readonly defaultUid: 65532;
    readonly defaultGid: 65532;
    readonly canonicalRunnerEntrypointMatched: true;
    readonly distributionCount: 33;
    readonly modelWeightsBakedIntoImage: false;
    readonly signedProvenanceAttestationVerified: false;
  };
  readonly strictVerification: {
    readonly rootFilesystemReadOnly: true;
    readonly tmpfsByteLimit: 67108864;
    readonly tmpfsNoExec: true;
    readonly allCapabilitiesDropped: true;
    readonly noNewPrivileges: true;
    readonly networkDisabled: true;
    readonly uid: 65532;
    readonly gid: 65532;
    readonly torch: "2.6.0+cu124";
    readonly torchCudaBuild: "12.4";
    readonly torchvision: "0.21.0+cu124";
    readonly torchaudio: "2.6.0+cu124";
    readonly pillow: "12.3.0";
    readonly transformers: "5.5.0";
    readonly huggingfaceHub: "1.5.0";
    readonly baseVerifierPassed: true;
    readonly sam2ImportDenied: true;
    readonly inheritedSam2DistributionPresent: false;
    readonly inheritedSam2ModuleImportable: false;
    readonly inheritedSam2TrainingModuleImportable: false;
    readonly operationLocalInstallerMetadataPresent: false;
    readonly buildToolchainPresent: false;
    readonly networkTrustStorePresent: false;
    readonly systemPipPresent: true;
    readonly modelWeightsLoaded: false;
    readonly graphExecuted: false;
  };
  readonly scan: {
    readonly scanner: "trivy";
    readonly scannerVersion: "0.72.0";
    readonly scannerImageDigestSha256: "c6e969c5662a546ad5de4a73c2a6b7a7c627f86d916903e175aa623af5b97ada";
    readonly imageIdentityMatched: true;
    readonly vulnerability: {
      readonly reportDigestSha256: "525c54af3f32ad3f6aa021eed0a586cb326cfede11e17d4f474e128d38610927";
      readonly reportByteLength: 4142705;
      readonly resultCount: 2;
      readonly totalFindingCount: 877;
      readonly uniqueFindingIdCount: 227;
      readonly criticalCount: 0;
      readonly highCount: 0;
      readonly mediumCount: 745;
      readonly lowCount: 132;
      readonly fixedCount: 398;
      readonly unfixedCount: 479;
      readonly operatingSystemCoverage: true;
      readonly pythonCoverage: true;
      readonly criticalHighAdmissionGatePassed: true;
      readonly fullVulnerabilityClearanceGranted: false;
    };
    readonly sbom: {
      readonly reportDigestSha256: "6798ab6f0bfc329e16d3bb540ab1f053b61ad684c2e394d1c66c910f87b539b8";
      readonly reportByteLength: 1451110;
      readonly spdxVersion: "SPDX-2.3";
      readonly dataLicense: "CC0-1.0";
      readonly packageCount: 690;
      readonly relationshipCount: 1431;
      readonly noAssertionPackageCount: 137;
      readonly operatingSystemPackageCount: 498;
      readonly pythonPackageCount: 190;
      readonly ociPackageCount: 1;
      readonly exactDirectVcsPackageCount: 0;
    };
    readonly license: {
      readonly reportDigestSha256: "9f6526c9e84328b2125c096445daf609b6b80fa32e435be7a8fe41f0fe5e2a0b";
      readonly reportByteLength: 3574469;
      readonly resultCount: 5;
      readonly totalFindingCount: 6716;
      readonly uniqueLicenseNameCount: 304;
      readonly restrictedFindingCount: 809;
      readonly reciprocalFindingCount: 24;
      readonly unknownFindingCount: 567;
      readonly noticeFindingCount: 5292;
      readonly unencumberedFindingCount: 24;
      readonly operatingSystemLicenseFindingCount: 1924;
      readonly pythonLicenseFindingCount: 190;
      readonly looseFileLicenseFindingCount: 4602;
      readonly exactDirectVcsPackageFindingCount: 0;
      readonly fullFileScanCompleted: true;
      readonly manualDispositionRequired: true;
      readonly licenseApprovalGranted: false;
    };
  };
  readonly runtime: {
    readonly privateL4InternalTestEligibleFromImageEvidence: true;
    readonly canonicalImageIngested: false;
    readonly modelWeightsMounted: false;
    readonly controlledGenerationExecuted: false;
    readonly gpuAttemptCreated: false;
  };
  readonly authority: {
    readonly operationRegistered: false;
    readonly dispatchGranted: false;
    readonly runtimeAuthority: false;
    readonly assetCreated: false;
    readonly actualCostReceiptCreated: false;
    readonly customerChargeCreated: false;
    readonly publicDeliveryCreated: false;
    readonly productionReady: false;
  };
  readonly localPathSerialized: false;
  readonly reportBytesSerialized: false;
  readonly modelBytesSerialized: false;
  readonly promptSerialized: false;
  readonly credentialSerialized: false;
}

export interface LivingFrameComfyUiPrunedNoSam2SourceBuildEvidence {
  readonly contractVersion: typeof LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_VERSION;
  readonly evidenceClass: typeof LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_CLASS;
  readonly status: typeof LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_STATUS;
  readonly evidenceId: string;
  readonly evidenceDigestSha256: string;
  readonly observationDigestSha256: string;
  readonly supersedesContractVersion:
    "living-frame-comfyui-pruned-source-build-evidence-v1";
  readonly imageDigestSha256:
    "51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e";
  readonly imageByteLength: 12657937701;
  readonly inheritedDirectVcsDistributionRemoved: true;
  readonly inheritedDirectVcsPackageAbsentFromSbom: true;
  readonly inheritedDirectVcsPackageAbsentFromLicenseReport: true;
  readonly runnerSam2ImportGuardRetained: true;
  readonly directVcsDispositionPassedForPrivateImage: true;
  readonly sourceDefinedBuildCompleted: true;
  readonly strictNonRootVerificationPassed: true;
  readonly fullVulnerabilityScanCompleted: true;
  readonly sbomCompleted: true;
  readonly fullFileLicenseScanCompleted: true;
  readonly criticalHighAdmissionGatePassed: true;
  readonly fullVulnerabilityClearanceGranted: false;
  readonly licenseApprovalGranted: false;
  readonly privateL4InternalTestEligibleFromImageEvidence: true;
  readonly releaseDisposition:
    "internal_l4_image_candidate_direct_vcs_removed_manual_and_canonical_gates_open";
  readonly openGateCodes:
    typeof LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_OPEN_GATES;
  readonly canonicalImageIngested: false;
  readonly modelWeightsMounted: false;
  readonly controlledGenerationExecuted: false;
  readonly gpuAttemptCreated: false;
  readonly operationRegistered: false;
  readonly dispatchGranted: false;
  readonly runtimeAuthority: false;
  readonly assetCreated: false;
  readonly actualCostReceiptCreated: false;
  readonly customerChargeCreated: false;
  readonly publicDeliveryCreated: false;
  readonly productionReady: false;
  readonly localPathSerialized: false;
  readonly reportBytesSerialized: false;
  readonly modelBytesSerialized: false;
  readonly promptSerialized: false;
  readonly credentialSerialized: false;
}
