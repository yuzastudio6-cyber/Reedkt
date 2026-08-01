import { createHash } from "node:crypto";

import {
  LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_STATUS,
  LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_OPEN_GATES,
  type LivingFrameComfyUiPrunedSourceBuildEvidence,
  type LivingFrameComfyUiPrunedSourceBuildObservation,
} from "../../src/types/living-frame-comfyui-pruned-source-build-evidence";

const SHA256 = /^[a-f0-9]{64}$/u;
const GIT_OBJECT = /^[a-f0-9]{40}$/u;

export function compileLivingFrameComfyUiPrunedSourceBuildEvidence(
  observation: LivingFrameComfyUiPrunedSourceBuildObservation,
): LivingFrameComfyUiPrunedSourceBuildEvidence {
  assertObservation(observation);
  const observationDigestSha256 = sha256CanonicalJson(observation);
  const draft = {
    contractVersion: LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_VERSION,
    evidenceClass: LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_CLASS,
    status: LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_EVIDENCE_STATUS,
    evidenceId: `lf-comfyui-pruned-source-build.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: "",
    observationDigestSha256,
    imageDigestSha256: observation.image.imageDigestSha256,
    imageByteLength: observation.image.byteLength,
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
      "internal_l4_image_candidate_manual_and_canonical_gates_open" as const,
    openGateCodes: LIVING_FRAME_COMFYUI_PRUNED_SOURCE_BUILD_OPEN_GATES,
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

export function verifyLivingFrameComfyUiPrunedSourceBuildEvidence(
  evidence: LivingFrameComfyUiPrunedSourceBuildEvidence,
  observation: LivingFrameComfyUiPrunedSourceBuildObservation,
): boolean {
  try {
    assertObservation(observation);
  } catch {
    return false;
  }
  return (
    canonicalJson(evidence) ===
    canonicalJson(
      compileLivingFrameComfyUiPrunedSourceBuildEvidence(observation),
    )
  );
}

function assertObservation(
  observation: LivingFrameComfyUiPrunedSourceBuildObservation,
): void {
  const { source, image, strictVerification, scan, runtime, authority } =
    observation;
  const { vulnerability, sbom, license } = scan;
  if (
    observation.observedAt !== "2026-07-30" ||
    source.featureCommitSha !== "b871bfee33837f00eac297a1f05e866246e9abb0" ||
    source.featureTreeSha !== "56eb03aa1d9ac9b44adaad15c87471752c1b4c0a" ||
    source.parentImageDigestSha256 !==
      "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b" ||
    source.dockerfileDigestSha256 !==
      "925a02d191a63616287d672d524202314b55ef1ddc007b0467ec86e559af22ea" ||
    source.prunerDigestSha256 !==
      "fa22140680ce100698d14a5c99f9ff5a508d53e61adf74b49c6b3758031696e6" ||
    source.verifierDigestSha256 !==
      "fb5ca9b5fb615051824337b23fd4bf1bb7fdb65a96f37c8f537f4bdb8ec0522a" ||
    source.exactInputWheelCount !== 33 ||
    !source.sourceDefinedBuild ||
    !source.installNetworkDisabled ||
    !source.pruneNetworkDisabled ||
    image.imageDigestSha256 !==
      "a8a56322da6f6098faeb92fdc9de1d6f7239b98351a34c7ceb6ef6fe34e48ecc" ||
    image.platformManifestDigestSha256 !==
      "8b870524042d2f4ea446464dda8b977220a55866fe63fe48e2fc80d3109dbd4f" ||
    image.configDigestSha256 !==
      "6817e7f8f44acd228eafc40f22c419326b0a56af24b462368b13f7b8047b28d0" ||
    image.buildKitAttestationManifestDigestSha256 !==
      "972c15359a06c765504f541b60e51d4b6383bffe8f951ddfaf582211223c72ab" ||
    image.byteLength !== 12_657_934_444 ||
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
    !strictVerification.sam2ImportDenied ||
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
      "0eda27e420c76178b3df1cb77b1816ee2ead3ca9a7437244bd942cd0e3894c11" ||
    vulnerability.reportByteLength !== 4_142_186 ||
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
      "e435263899421b914fd4e30f5c7525342f66b5abf333d2633525c8f98ffb6248" ||
    sbom.reportByteLength !== 1_452_211 ||
    sbom.spdxVersion !== "SPDX-2.3" ||
    sbom.dataLicense !== "CC0-1.0" ||
    sbom.packageCount !== 691 ||
    sbom.relationshipCount !== 1_432 ||
    sbom.noAssertionPackageCount !== 137 ||
    sbom.operatingSystemPackageCount !== 498 ||
    sbom.pythonPackageCount !== 191 ||
    sbom.ociPackageCount !== 1 ||
    license.reportDigestSha256 !==
      "750dc1c3bcfa563b3f4091f635b710d653ab60f83ce1e87ffb02472b7a6cb2fc" ||
    license.reportByteLength !== 3_574_608 ||
    license.resultCount !== 5 ||
    license.totalFindingCount !== 6_718 ||
    license.uniqueLicenseNameCount !== 304 ||
    license.restrictedFindingCount !== 809 ||
    license.reciprocalFindingCount !== 24 ||
    license.unknownFindingCount !== 567 ||
    license.noticeFindingCount !== 5_294 ||
    license.unencumberedFindingCount !== 24 ||
    license.operatingSystemLicenseFindingCount !== 1_924 ||
    license.pythonLicenseFindingCount !== 191 ||
    license.looseFileLicenseFindingCount !== 4_603 ||
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
      "Living Frame pruned source-build evidence does not match the exact private build, scan, and closed-authority boundary.",
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
