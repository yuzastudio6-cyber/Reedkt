import { createHash } from "node:crypto";

import {
  LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_STATUS,
  LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_OPEN_GATES,
  type LivingFrameComfyUiPrunedNoSam2SourceBuildEvidence,
  type LivingFrameComfyUiPrunedNoSam2SourceBuildObservation,
} from "../../src/types/living-frame-comfyui-pruned-no-sam2-source-build-evidence";

const SHA256 = /^[a-f0-9]{64}$/u;
const GIT_OBJECT = /^[a-f0-9]{40}$/u;

export function compileLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(
  observation: LivingFrameComfyUiPrunedNoSam2SourceBuildObservation,
): LivingFrameComfyUiPrunedNoSam2SourceBuildEvidence {
  assertObservation(observation);
  const observationDigestSha256 = sha256CanonicalJson(observation);
  const draft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_CLASS,
    status: LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_EVIDENCE_STATUS,
    evidenceId:
      `lf-comfyui-pruned-no-sam2-source-build.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: "",
    observationDigestSha256,
    supersedesContractVersion: observation.supersedes.contractVersion,
    imageDigestSha256: observation.image.imageDigestSha256,
    imageByteLength: observation.image.byteLength,
    inheritedDirectVcsDistributionRemoved: true as const,
    inheritedDirectVcsPackageAbsentFromSbom: true as const,
    inheritedDirectVcsPackageAbsentFromLicenseReport: true as const,
    runnerSam2ImportGuardRetained: true as const,
    directVcsDispositionPassedForPrivateImage: true as const,
    sourceDefinedBuildCompleted: true as const,
    strictNonRootVerificationPassed: true as const,
    fullVulnerabilityScanCompleted: true as const,
    sbomCompleted: true as const,
    fullFileLicenseScanCompleted: true as const,
    criticalHighAdmissionGatePassed: true as const,
    fullVulnerabilityClearanceGranted: false as const,
    licenseApprovalGranted: false as const,
    privateL4InternalTestEligibleFromImageEvidence: true as const,
    releaseDisposition:
      "internal_l4_image_candidate_direct_vcs_removed_manual_and_canonical_gates_open" as const,
    openGateCodes:
      LIVING_FRAME_COMFYUI_PRUNED_NO_SAM2_SOURCE_BUILD_OPEN_GATES,
    canonicalImageIngested: false as const,
    modelWeightsMounted: false as const,
    controlledGenerationExecuted: false as const,
    gpuAttemptCreated: false as const,
    operationRegistered: false as const,
    dispatchGranted: false as const,
    runtimeAuthority: false as const,
    assetCreated: false as const,
    actualCostReceiptCreated: false as const,
    customerChargeCreated: false as const,
    publicDeliveryCreated: false as const,
    productionReady: false as const,
    localPathSerialized: false as const,
    reportBytesSerialized: false as const,
    modelBytesSerialized: false as const,
    promptSerialized: false as const,
    credentialSerialized: false as const,
  };
  return Object.freeze({
    ...draft,
    evidenceDigestSha256: sha256CanonicalJson({
      ...draft,
      evidenceDigestSha256: undefined,
    }),
  });
}

export function verifyLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(
  evidence: LivingFrameComfyUiPrunedNoSam2SourceBuildEvidence,
  observation: LivingFrameComfyUiPrunedNoSam2SourceBuildObservation,
): boolean {
  try {
    assertObservation(observation);
  } catch {
    return false;
  }
  return (
    canonicalJson(evidence) ===
    canonicalJson(
      compileLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(observation),
    )
  );
}

function assertObservation(
  observation: LivingFrameComfyUiPrunedNoSam2SourceBuildObservation,
): void {
  const {
    supersedes,
    source,
    directVcsRemoval,
    image,
    strictVerification,
    scan,
    runtime,
    authority,
  } = observation;
  const { vulnerability, sbom, license } = scan;

  if (
    observation.observedAt !== "2026-07-30" ||
    supersedes.contractVersion !==
      "living-frame-comfyui-pruned-source-build-evidence-v1" ||
    supersedes.reason !==
      "remove_unused_inherited_direct_vcs_sam2_distribution_and_repeat_complete_image_scan" ||
    source.featureCommitSha !==
      "8f88f6d702781aec64b5b5795fc12c65619d93b0" ||
    source.featureTreeSha !==
      "261f6931a76800c7a3d6890dc620ac8ff8b37554" ||
    source.parentImageDigestSha256 !==
      "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b" ||
    source.dockerfileDigestSha256 !==
      "2586fe9274b313ca600c66d73efaba782df68bfd0dff14644475c13f2368271f" ||
    source.prunerDigestSha256 !==
      "f0992d47abcc863a245a61213fccbba3f5602a56b494342932cfb7511aff4067" ||
    source.verifierDigestSha256 !==
      "a442b35e268a1ae447161453cfea3ad8c659a381b38e6dee75971dcb65337b19" ||
    source.removalHelperDigestSha256 !==
      "d7728338ebdc04c9a647882b9d0e16328e317f8863287dd7f4d9f6d7cf861440" ||
    source.exactInputWheelCount !== 33 ||
    !source.sourceDefinedBuild ||
    !source.installNetworkDisabled ||
    !source.pruneNetworkDisabled ||
    directVcsRemoval.distributionName !== "sam-2" ||
    directVcsRemoval.distributionVersion !== "1.0" ||
    directVcsRemoval.sourceRevision !==
      "2b90b9f5ceec907a1c18123530e92e794ad901a4" ||
    directVcsRemoval.metadataLicense !== "Apache 2.0" ||
    directVcsRemoval.installedFileCountBeforeRemoval !== 114 ||
    directVcsRemoval.installedFileListDigestSha256 !==
      "e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468" ||
    canonicalJson(directVcsRemoval.exactAllowedRoots) !==
      canonicalJson(["sam2", "training", "sam_2-1.0.dist-info"]) ||
    !directVcsRemoval.exactIdentityValidatedBeforeRemoval ||
    !directVcsRemoval.onlyAllowedRootsRemoved ||
    directVcsRemoval.distributionPresentAfterRemoval ||
    directVcsRemoval.sam2ModulePresentAfterRemoval ||
    directVcsRemoval.trainingModulePresentAfterRemoval ||
    directVcsRemoval.exactPackageCountInSbom !== 0 ||
    directVcsRemoval.exactPackageLicenseFindingCount !== 0 ||
    !directVcsRemoval.runnerSam2ImportGuardRetained ||
    !directVcsRemoval.dispositionPassedForPrivateImage ||
    image.imageDigestSha256 !==
      "51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e" ||
    image.platformManifestDigestSha256 !==
      "32c3e356186f1de63379c3e31643ea78b1bf67b6443db668b59dab9f6445c9a5" ||
    image.configDigestSha256 !==
      "123a7fc601d476aece02af6d38cdd2415d5a0a0d4e77b7008ecacdfa48fb7bca" ||
    image.buildKitAttestationManifestDigestSha256 !==
      "9684d48b82d3a2c745aa6f51eeab5800177ab04b4bbb94b9ff454f55b55ca75b" ||
    image.byteLength !== 12_657_937_701 ||
    image.operatingSystem !== "linux" ||
    image.architecture !== "amd64" ||
    image.defaultUid !== 65_532 ||
    image.defaultGid !== 65_532 ||
    !image.canonicalRunnerEntrypointMatched ||
    image.distributionCount !== 33 ||
    image.modelWeightsBakedIntoImage ||
    image.signedProvenanceAttestationVerified ||
    !strictVerification.rootFilesystemReadOnly ||
    strictVerification.tmpfsByteLimit !== 67_108_864 ||
    !strictVerification.tmpfsNoExec ||
    !strictVerification.allCapabilitiesDropped ||
    !strictVerification.noNewPrivileges ||
    !strictVerification.networkDisabled ||
    strictVerification.uid !== 65_532 ||
    strictVerification.gid !== 65_532 ||
    strictVerification.torch !== "2.6.0+cu124" ||
    strictVerification.torchCudaBuild !== "12.4" ||
    strictVerification.torchvision !== "0.21.0+cu124" ||
    strictVerification.torchaudio !== "2.6.0+cu124" ||
    strictVerification.pillow !== "12.3.0" ||
    strictVerification.transformers !== "5.5.0" ||
    strictVerification.huggingfaceHub !== "1.5.0" ||
    !strictVerification.baseVerifierPassed ||
    !strictVerification.sam2ImportDenied ||
    strictVerification.inheritedSam2DistributionPresent ||
    strictVerification.inheritedSam2ModuleImportable ||
    strictVerification.inheritedSam2TrainingModuleImportable ||
    strictVerification.operationLocalInstallerMetadataPresent ||
    strictVerification.buildToolchainPresent ||
    strictVerification.networkTrustStorePresent ||
    !strictVerification.systemPipPresent ||
    strictVerification.modelWeightsLoaded ||
    strictVerification.graphExecuted ||
    scan.scanner !== "trivy" ||
    scan.scannerVersion !== "0.72.0" ||
    scan.scannerImageDigestSha256 !==
      "c6e969c5662a546ad5de4a73c2a6b7a7c627f86d916903e175aa623af5b97ada" ||
    !scan.imageIdentityMatched ||
    vulnerability.reportDigestSha256 !==
      "525c54af3f32ad3f6aa021eed0a586cb326cfede11e17d4f474e128d38610927" ||
    vulnerability.reportByteLength !== 4_142_705 ||
    vulnerability.resultCount !== 2 ||
    vulnerability.totalFindingCount !== 877 ||
    vulnerability.uniqueFindingIdCount !== 227 ||
    vulnerability.criticalCount !== 0 ||
    vulnerability.highCount !== 0 ||
    vulnerability.mediumCount !== 745 ||
    vulnerability.lowCount !== 132 ||
    vulnerability.fixedCount !== 398 ||
    vulnerability.unfixedCount !== 479 ||
    !vulnerability.operatingSystemCoverage ||
    !vulnerability.pythonCoverage ||
    !vulnerability.criticalHighAdmissionGatePassed ||
    vulnerability.fullVulnerabilityClearanceGranted ||
    sbom.reportDigestSha256 !==
      "6798ab6f0bfc329e16d3bb540ab1f053b61ad684c2e394d1c66c910f87b539b8" ||
    sbom.reportByteLength !== 1_451_110 ||
    sbom.spdxVersion !== "SPDX-2.3" ||
    sbom.dataLicense !== "CC0-1.0" ||
    sbom.packageCount !== 690 ||
    sbom.relationshipCount !== 1_431 ||
    sbom.noAssertionPackageCount !== 137 ||
    sbom.operatingSystemPackageCount !== 498 ||
    sbom.pythonPackageCount !== 190 ||
    sbom.ociPackageCount !== 1 ||
    sbom.exactDirectVcsPackageCount !== 0 ||
    license.reportDigestSha256 !==
      "9f6526c9e84328b2125c096445daf609b6b80fa32e435be7a8fe41f0fe5e2a0b" ||
    license.reportByteLength !== 3_574_469 ||
    license.resultCount !== 5 ||
    license.totalFindingCount !== 6_716 ||
    license.uniqueLicenseNameCount !== 304 ||
    license.restrictedFindingCount !== 809 ||
    license.reciprocalFindingCount !== 24 ||
    license.unknownFindingCount !== 567 ||
    license.noticeFindingCount !== 5_292 ||
    license.unencumberedFindingCount !== 24 ||
    license.operatingSystemLicenseFindingCount !== 1_924 ||
    license.pythonLicenseFindingCount !== 190 ||
    license.looseFileLicenseFindingCount !== 4_602 ||
    license.exactDirectVcsPackageFindingCount !== 0 ||
    !license.fullFileScanCompleted ||
    !license.manualDispositionRequired ||
    license.licenseApprovalGranted ||
    !runtime.privateL4InternalTestEligibleFromImageEvidence ||
    runtime.canonicalImageIngested ||
    runtime.modelWeightsMounted ||
    runtime.controlledGenerationExecuted ||
    runtime.gpuAttemptCreated ||
    authority.operationRegistered ||
    authority.dispatchGranted ||
    authority.runtimeAuthority ||
    authority.assetCreated ||
    authority.actualCostReceiptCreated ||
    authority.customerChargeCreated ||
    authority.publicDeliveryCreated ||
    authority.productionReady ||
    observation.localPathSerialized ||
    observation.reportBytesSerialized ||
    observation.modelBytesSerialized ||
    observation.promptSerialized ||
    observation.credentialSerialized ||
    !GIT_OBJECT.test(source.featureCommitSha) ||
    !GIT_OBJECT.test(source.featureTreeSha) ||
    [
      source.parentImageDigestSha256,
      source.dockerfileDigestSha256,
      source.prunerDigestSha256,
      source.verifierDigestSha256,
      source.removalHelperDigestSha256,
      directVcsRemoval.installedFileListDigestSha256,
      image.imageDigestSha256,
      image.platformManifestDigestSha256,
      image.configDigestSha256,
      image.buildKitAttestationManifestDigestSha256,
      scan.scannerImageDigestSha256,
      vulnerability.reportDigestSha256,
      sbom.reportDigestSha256,
      license.reportDigestSha256,
    ].some((value) => !SHA256.test(value))
  ) {
    throw new Error(
      "Living Frame pruned no-SAM2 source-build evidence does not match the exact private build, removal, scan, and closed-authority boundary.",
    );
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sha256CanonicalJson(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    );
  }
  return value;
}
