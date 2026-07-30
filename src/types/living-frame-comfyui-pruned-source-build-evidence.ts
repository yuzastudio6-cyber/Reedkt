export const LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_VERSION =
  "living-frame-comfyui-pruned-source-build-evidence-v1" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_CLASS =
  "private_internal_source_bound_pruned_image_scan_evidence" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_STATUS =
  "source_build_complete_zero_critical_high_license_review_required" as const;

export const LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_OPEN_GATES = [
  "medium_low_vulnerability_disposition_required",
  "full_license_manual_disposition_required",
  "direct_vcs_distribution_disposition_required",
  "image_signature_and_provenance_attestation_required",
  "canonical_private_image_ingest_required",
  "canonical_five_model_mount_distribution_required",
  "real_l4_graph_execution_and_resource_receipt_required",
  "private_output_persistence_qa_and_review_required",
] as const;

export interface LivingFrameComfyUiPrunedSourceBuildObservation {
  readonly observedAt: "2026-07-30";
  readonly source: {
    readonly featureCommitSha: "b871bfee33837f00eac297a1f05e866246e9abb0";
    readonly featureTreeSha: "56eb03aa1d9ac9b44adaad15c87471752c1b4c0a";
    readonly parentImageDigestSha256: "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b";
    readonly dockerfileDigestSha256: "925a02d191a63616287d672d524202314b55ef1ddc007b0467ec86e559af22ea";
    readonly prunerDigestSha256: "fa22140680ce100698d14a5c99f9ff5a508d53e61adf74b49c6b3758031696e6";
    readonly verifierDigestSha256: "fb5ca9b5fb615051824337b23fd4bf1bb7fdb65a96f37c8f537f4bdb8ec0522a";
    readonly exactInputWheelCount: 33;
    readonly sourceDefinedBuild: true;
    readonly installNetworkDisabled: true;
    readonly pruneNetworkDisabled: true;
  };
  readonly image: {
    readonly imageDigestSha256: "a8a56322da6f6098faeb92fdc9de1d6f7239b98351a34c7ceb6ef6fe34e48ecc";
    readonly platformManifestDigestSha256: "8b870524042d2f4ea446464dda8b977220a55866fe63fe48e2fc80d3109dbd4f";
    readonly configDigestSha256: "6817e7f8f44acd228eafc40f22c419326b0a56af24b462368b13f7b8047b28d0";
    readonly buildKitAttestationManifestDigestSha256: "972c15359a06c765504f541b60e51d4b6383bffe8f951ddfaf582211223c72ab";
    readonly byteLength: 12657934444;
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
    readonly sam2ImportDenied: true;
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
      readonly reportDigestSha256: "0eda27e420c76178b3df1cb77b1816ee2ead3ca9a7437244bd942cd0e3894c11";
      readonly reportByteLength: 4142186;
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
      readonly reportDigestSha256: "e435263899421b914fd4e30f5c7525342f66b5abf333d2633525c8f98ffb6248";
      readonly reportByteLength: 1452211;
      readonly spdxVersion: "SPDX-2.3";
      readonly dataLicense: "CC0-1.0";
      readonly packageCount: 691;
      readonly relationshipCount: 1432;
      readonly noAssertionPackageCount: 137;
      readonly operatingSystemPackageCount: 498;
      readonly pythonPackageCount: 191;
      readonly ociPackageCount: 1;
    };
    readonly license: {
      readonly reportDigestSha256: "750dc1c3bcfa563b3f4091f635b710d653ab60f83ce1e87ffb02472b7a6cb2fc";
      readonly reportByteLength: 3574608;
      readonly resultCount: 5;
      readonly totalFindingCount: 6718;
      readonly uniqueLicenseNameCount: 304;
      readonly restrictedFindingCount: 809;
      readonly reciprocalFindingCount: 24;
      readonly unknownFindingCount: 567;
      readonly noticeFindingCount: 5294;
      readonly unencumberedFindingCount: 24;
      readonly operatingSystemLicenseFindingCount: 1924;
      readonly pythonLicenseFindingCount: 191;
      readonly looseFileLicenseFindingCount: 4603;
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

export interface LivingFrameComfyUiPrunedSourceBuildEvidence {
  readonly contractVersion: typeof LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_VERSION;
  readonly evidenceClass: typeof LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_CLASS;
  readonly status: typeof LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_STATUS;
  readonly evidenceId: string;
  readonly evidenceDigestSha256: string;
  readonly observationDigestSha256: string;
  readonly imageDigestSha256: string;
  readonly imageByteLength: 12657934444;
  readonly sourceDefinedBuildCompleted: true;
  readonly strictNonRootVerificationPassed: true;
  readonly fullVulnerabilityScanCompleted: true;
  readonly sbomCompleted: true;
  readonly fullFileLicenseScanCompleted: true;
  readonly criticalHighAdmissionGatePassed: true;
  readonly fullVulnerabilityClearanceGranted: false;
  readonly licenseApprovalGranted: false;
  readonly privateL4InternalTestEligibleFromImageEvidence: true;
  readonly releaseDisposition: "internal_l4_image_candidate_manual_and_canonical_gates_open";
  readonly openGateCodes: typeof LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_OPEN_GATES;
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
