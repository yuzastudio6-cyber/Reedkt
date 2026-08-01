import assert from "node:assert/strict";

import type { LivingFrameComfyUiPrunedSourceBuildObservation } from "../../src/types/living-frame-comfyui-pruned-source-build-evidence";
import {
  compileLivingFrameComfyUiPrunedSourceBuildEvidence,
  verifyLivingFrameComfyUiPrunedSourceBuildEvidence,
} from "../living-frame/living-frame-comfyui-pruned-source-build-evidence";

const observation = buildObservation();
const evidence =
  compileLivingFrameComfyUiPrunedSourceBuildEvidence(observation);

assert.equal(
  verifyLivingFrameComfyUiPrunedSourceBuildEvidence(evidence, observation),
  true,
);

let adversarialAssertions = 0;
for (const forged of [
  {
    ...observation,
    source: {
      ...observation.source,
      featureCommitSha: "f".repeat(40),
    },
  },
  {
    ...observation,
    image: {
      ...observation.image,
      imageDigestSha256: "f".repeat(64),
    },
  },
  {
    ...observation,
    image: {
      ...observation.image,
      defaultUid: 0,
    },
  },
  {
    ...observation,
    strictVerification: {
      ...observation.strictVerification,
      networkDisabled: false,
    },
  },
  {
    ...observation,
    strictVerification: {
      ...observation.strictVerification,
      sam2ImportDenied: false,
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      vulnerability: {
        ...observation.scan.vulnerability,
        highCount: 1,
      },
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      vulnerability: {
        ...observation.scan.vulnerability,
        fullVulnerabilityClearanceGranted: true,
      },
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      license: {
        ...observation.scan.license,
        manualDispositionRequired: false,
      },
    },
  },
  {
    ...observation,
    runtime: {
      ...observation.runtime,
      controlledGenerationExecuted: true,
    },
  },
  {
    ...observation,
    authority: {
      ...observation.authority,
      dispatchGranted: true,
    },
  },
  {
    ...observation,
    authority: {
      ...observation.authority,
      productionReady: true,
    },
  },
  {
    ...observation,
    localPathSerialized: true,
  },
] as unknown as readonly LivingFrameComfyUiPrunedSourceBuildObservation[]) {
  assert.throws(() => {
    compileLivingFrameComfyUiPrunedSourceBuildEvidence(forged);
  });
  adversarialAssertions += 1;
}
assert.equal(adversarialAssertions, 12);

assert.equal(evidence.sourceDefinedBuildCompleted, true);
assert.equal(evidence.strictNonRootVerificationPassed, true);
assert.equal(evidence.fullVulnerabilityScanCompleted, true);
assert.equal(evidence.sbomCompleted, true);
assert.equal(evidence.fullFileLicenseScanCompleted, true);
assert.equal(evidence.criticalHighAdmissionGatePassed, true);
assert.equal(evidence.fullVulnerabilityClearanceGranted, false);
assert.equal(evidence.licenseApprovalGranted, false);
assert.equal(evidence.privateL4InternalTestEligibleFromImageEvidence, true);
assert.equal(evidence.canonicalImageIngested, false);
assert.equal(evidence.controlledGenerationExecuted, false);
assert.equal(evidence.operationRegistered, false);
assert.equal(evidence.dispatchGranted, false);
assert.equal(evidence.productionReady, false);

process.stdout.write(
  `${JSON.stringify({
    suite: "living-frame-comfyui-pruned-source-build-evidence",
    status: "passed",
    evidenceDigestSha256: evidence.evidenceDigestSha256,
    observationDigestSha256: evidence.observationDigestSha256,
    imageDigestSha256: evidence.imageDigestSha256,
    imageByteLength: evidence.imageByteLength,
    sourceDefinedBuildCompleted: evidence.sourceDefinedBuildCompleted,
    strictNonRootVerificationPassed: evidence.strictNonRootVerificationPassed,
    fullVulnerabilityScanCompleted: evidence.fullVulnerabilityScanCompleted,
    vulnerabilityFindingCount: observation.scan.vulnerability.totalFindingCount,
    criticalFindingCount: observation.scan.vulnerability.criticalCount,
    highFindingCount: observation.scan.vulnerability.highCount,
    criticalHighAdmissionGatePassed: evidence.criticalHighAdmissionGatePassed,
    fullVulnerabilityClearanceGranted:
      evidence.fullVulnerabilityClearanceGranted,
    sbomCompleted: evidence.sbomCompleted,
    sbomPackageCount: observation.scan.sbom.packageCount,
    fullFileLicenseScanCompleted: evidence.fullFileLicenseScanCompleted,
    licenseFindingCount: observation.scan.license.totalFindingCount,
    restrictedLicenseFindingCount:
      observation.scan.license.restrictedFindingCount,
    reciprocalLicenseFindingCount:
      observation.scan.license.reciprocalFindingCount,
    licenseApprovalGranted: evidence.licenseApprovalGranted,
    privateL4InternalTestEligibleFromImageEvidence:
      evidence.privateL4InternalTestEligibleFromImageEvidence,
    releaseDisposition: evidence.releaseDisposition,
    adversarialAssertions,
    canonicalImageIngested: evidence.canonicalImageIngested,
    controlledGenerationExecuted: evidence.controlledGenerationExecuted,
    operationRegistered: evidence.operationRegistered,
    dispatchGranted: evidence.dispatchGranted,
    productionReady: evidence.productionReady,
  })}\n`,
);

function buildObservation(): LivingFrameComfyUiPrunedSourceBuildObservation {
  return {
    observedAt: "2026-07-30",
    source: {
      featureCommitSha: "b871bfee33837f00eac297a1f05e866246e9abb0",
      featureTreeSha: "56eb03aa1d9ac9b44adaad15c87471752c1b4c0a",
      parentImageDigestSha256:
        "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b",
      dockerfileDigestSha256:
        "925a02d191a63616287d672d524202314b55ef1ddc007b0467ec86e559af22ea",
      prunerDigestSha256:
        "fa22140680ce100698d14a5c99f9ff5a508d53e61adf74b49c6b3758031696e6",
      verifierDigestSha256:
        "fb5ca9b5fb615051824337b23fd4bf1bb7fdb65a96f37c8f537f4bdb8ec0522a",
      exactInputWheelCount: 33,
      sourceDefinedBuild: true,
      installNetworkDisabled: true,
      pruneNetworkDisabled: true,
    },
    image: {
      imageDigestSha256:
        "a8a56322da6f6098faeb92fdc9de1d6f7239b98351a34c7ceb6ef6fe34e48ecc",
      platformManifestDigestSha256:
        "8b870524042d2f4ea446464dda8b977220a55866fe63fe48e2fc80d3109dbd4f",
      configDigestSha256:
        "6817e7f8f44acd228eafc40f22c419326b0a56af24b462368b13f7b8047b28d0",
      buildKitAttestationManifestDigestSha256:
        "972c15359a06c765504f541b60e51d4b6383bffe8f951ddfaf582211223c72ab",
      byteLength: 12_657_934_444,
      operatingSystem: "linux",
      architecture: "amd64",
      defaultUid: 65_532,
      defaultGid: 65_532,
      canonicalRunnerEntrypointMatched: true,
      distributionCount: 33,
      modelWeightsBakedIntoImage: false,
      signedProvenanceAttestationVerified: false,
    },
    strictVerification: {
      rootFilesystemReadOnly: true,
      tmpfsByteLimit: 67_108_864,
      tmpfsNoExec: true,
      allCapabilitiesDropped: true,
      noNewPrivileges: true,
      networkDisabled: true,
      uid: 65_532,
      gid: 65_532,
      torch: "2.6.0+cu124",
      torchCudaBuild: "12.4",
      torchvision: "0.21.0+cu124",
      torchaudio: "2.6.0+cu124",
      pillow: "12.3.0",
      transformers: "5.5.0",
      huggingfaceHub: "1.5.0",
      sam2ImportDenied: true,
      operationLocalInstallerMetadataPresent: false,
      buildToolchainPresent: false,
      networkTrustStorePresent: false,
      systemPipPresent: true,
      modelWeightsLoaded: false,
      graphExecuted: false,
    },
    scan: {
      scanner: "trivy",
      scannerVersion: "0.72.0",
      scannerImageDigestSha256:
        "c6e969c5662a546ad5de4a73c2a6b7a7c627f86d916903e175aa623af5b97ada",
      imageIdentityMatched: true,
      vulnerability: {
        reportDigestSha256:
          "0eda27e420c76178b3df1cb77b1816ee2ead3ca9a7437244bd942cd0e3894c11",
        reportByteLength: 4_142_186,
        resultCount: 2,
        totalFindingCount: 877,
        uniqueFindingIdCount: 227,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 745,
        lowCount: 132,
        fixedCount: 398,
        unfixedCount: 479,
        operatingSystemCoverage: true,
        pythonCoverage: true,
        criticalHighAdmissionGatePassed: true,
        fullVulnerabilityClearanceGranted: false,
      },
      sbom: {
        reportDigestSha256:
          "e435263899421b914fd4e30f5c7525342f66b5abf333d2633525c8f98ffb6248",
        reportByteLength: 1_452_211,
        spdxVersion: "SPDX-2.3",
        dataLicense: "CC0-1.0",
        packageCount: 691,
        relationshipCount: 1_432,
        noAssertionPackageCount: 137,
        operatingSystemPackageCount: 498,
        pythonPackageCount: 191,
        ociPackageCount: 1,
      },
      license: {
        reportDigestSha256:
          "750dc1c3bcfa563b3f4091f635b710d653ab60f83ce1e87ffb02472b7a6cb2fc",
        reportByteLength: 3_574_608,
        resultCount: 5,
        totalFindingCount: 6_718,
        uniqueLicenseNameCount: 304,
        restrictedFindingCount: 809,
        reciprocalFindingCount: 24,
        unknownFindingCount: 567,
        noticeFindingCount: 5_294,
        unencumberedFindingCount: 24,
        operatingSystemLicenseFindingCount: 1_924,
        pythonLicenseFindingCount: 191,
        looseFileLicenseFindingCount: 4_603,
        fullFileScanCompleted: true,
        manualDispositionRequired: true,
        licenseApprovalGranted: false,
      },
    },
    runtime: {
      privateL4InternalTestEligibleFromImageEvidence: true,
      canonicalImageIngested: false,
      modelWeightsMounted: false,
      controlledGenerationExecuted: false,
      gpuAttemptCreated: false,
    },
    authority: {
      operationRegistered: false,
      dispatchGranted: false,
      runtimeAuthority: false,
      assetCreated: false,
      actualCostReceiptCreated: false,
      customerChargeCreated: false,
      publicDeliveryCreated: false,
      productionReady: false,
    },
    localPathSerialized: false,
    reportBytesSerialized: false,
    modelBytesSerialized: false,
    promptSerialized: false,
    credentialSerialized: false,
  };
}
