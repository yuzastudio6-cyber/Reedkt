import assert from "node:assert/strict";

import type { LivingFrameComfyUiPrunedNoSam2SourceBuildObservation } from "../../src/types/living-frame-comfyui-pruned-no-sam2-source-build-evidence";
import {
  compileLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence,
  verifyLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence,
} from "../living-frame/living-frame-comfyui-pruned-no-sam2-source-build-evidence";

const observation = buildObservation();
const evidence =
  compileLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(observation);

assert.equal(
  verifyLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(
    evidence,
    observation,
  ),
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
    directVcsRemoval: {
      ...observation.directVcsRemoval,
      exactIdentityValidatedBeforeRemoval: false,
    },
  },
  {
    ...observation,
    directVcsRemoval: {
      ...observation.directVcsRemoval,
      onlyAllowedRootsRemoved: false,
    },
  },
  {
    ...observation,
    directVcsRemoval: {
      ...observation.directVcsRemoval,
      distributionPresentAfterRemoval: true,
    },
  },
  {
    ...observation,
    directVcsRemoval: {
      ...observation.directVcsRemoval,
      exactPackageCountInSbom: 1,
    },
  },
  {
    ...observation,
    strictVerification: {
      ...observation.strictVerification,
      inheritedSam2ModuleImportable: true,
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
      license: {
        ...observation.scan.license,
        exactDirectVcsPackageFindingCount: 1,
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
] as unknown as readonly LivingFrameComfyUiPrunedNoSam2SourceBuildObservation[]) {
  assert.throws(() => {
    compileLivingFrameComfyUiPrunedNoSam2SourceBuildEvidence(forged);
  });
  adversarialAssertions += 1;
}
assert.equal(adversarialAssertions, 13);

assert.equal(evidence.inheritedDirectVcsDistributionRemoved, true);
assert.equal(evidence.inheritedDirectVcsPackageAbsentFromSbom, true);
assert.equal(evidence.inheritedDirectVcsPackageAbsentFromLicenseReport, true);
assert.equal(evidence.runnerSam2ImportGuardRetained, true);
assert.equal(evidence.directVcsDispositionPassedForPrivateImage, true);
assert.equal(evidence.criticalHighAdmissionGatePassed, true);
assert.equal(evidence.fullVulnerabilityClearanceGranted, false);
assert.equal(evidence.licenseApprovalGranted, false);
assert.equal(evidence.privateL4InternalTestEligibleFromImageEvidence, true);
assert.equal(evidence.operationRegistered, false);
assert.equal(evidence.dispatchGranted, false);
assert.equal(evidence.productionReady, false);

process.stdout.write(
  `${JSON.stringify({
    suite: "living-frame-comfyui-pruned-no-sam2-source-build-evidence",
    status: "passed",
    evidenceDigestSha256: evidence.evidenceDigestSha256,
    observationDigestSha256: evidence.observationDigestSha256,
    imageDigestSha256: evidence.imageDigestSha256,
    imageByteLength: evidence.imageByteLength,
    inheritedDirectVcsDistributionRemoved:
      evidence.inheritedDirectVcsDistributionRemoved,
    inheritedDirectVcsPackageAbsentFromSbom:
      evidence.inheritedDirectVcsPackageAbsentFromSbom,
    inheritedDirectVcsPackageAbsentFromLicenseReport:
      evidence.inheritedDirectVcsPackageAbsentFromLicenseReport,
    runnerSam2ImportGuardRetained: evidence.runnerSam2ImportGuardRetained,
    directVcsDispositionPassedForPrivateImage:
      evidence.directVcsDispositionPassedForPrivateImage,
    vulnerabilityFindingCount: observation.scan.vulnerability.totalFindingCount,
    criticalFindingCount: observation.scan.vulnerability.criticalCount,
    highFindingCount: observation.scan.vulnerability.highCount,
    sbomPackageCount: observation.scan.sbom.packageCount,
    licenseFindingCount: observation.scan.license.totalFindingCount,
    criticalHighAdmissionGatePassed: evidence.criticalHighAdmissionGatePassed,
    fullVulnerabilityClearanceGranted:
      evidence.fullVulnerabilityClearanceGranted,
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

function buildObservation(): LivingFrameComfyUiPrunedNoSam2SourceBuildObservation {
  return {
    observedAt: "2026-07-30",
    supersedes: {
      contractVersion: "living-frame-comfyui-pruned-source-build-evidence-v1",
      reason:
        "remove_unused_inherited_direct_vcs_sam2_distribution_and_repeat_complete_image_scan",
    },
    source: {
      featureCommitSha: "8f88f6d702781aec64b5b5795fc12c65619d93b0",
      featureTreeSha: "261f6931a76800c7a3d6890dc620ac8ff8b37554",
      parentImageDigestSha256:
        "84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b",
      dockerfileDigestSha256:
        "2586fe9274b313ca600c66d73efaba782df68bfd0dff14644475c13f2368271f",
      prunerDigestSha256:
        "f0992d47abcc863a245a61213fccbba3f5602a56b494342932cfb7511aff4067",
      verifierDigestSha256:
        "a442b35e268a1ae447161453cfea3ad8c659a381b38e6dee75971dcb65337b19",
      removalHelperDigestSha256:
        "d7728338ebdc04c9a647882b9d0e16328e317f8863287dd7f4d9f6d7cf861440",
      exactInputWheelCount: 33,
      sourceDefinedBuild: true,
      installNetworkDisabled: true,
      pruneNetworkDisabled: true,
    },
    directVcsRemoval: {
      distributionName: "sam-2",
      distributionVersion: "1.0",
      sourceRevision: "2b90b9f5ceec907a1c18123530e92e794ad901a4",
      metadataLicense: "Apache 2.0",
      installedFileCountBeforeRemoval: 114,
      installedFileListDigestSha256:
        "e0056305b664ab9f54cf1b4a7f5886a6bcacb389195fe8f1c07aee3547b8e468",
      exactAllowedRoots: ["sam2", "training", "sam_2-1.0.dist-info"],
      exactIdentityValidatedBeforeRemoval: true,
      onlyAllowedRootsRemoved: true,
      distributionPresentAfterRemoval: false,
      sam2ModulePresentAfterRemoval: false,
      trainingModulePresentAfterRemoval: false,
      exactPackageCountInSbom: 0,
      exactPackageLicenseFindingCount: 0,
      runnerSam2ImportGuardRetained: true,
      dispositionPassedForPrivateImage: true,
    },
    image: {
      imageDigestSha256:
        "51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e",
      platformManifestDigestSha256:
        "32c3e356186f1de63379c3e31643ea78b1bf67b6443db668b59dab9f6445c9a5",
      configDigestSha256:
        "123a7fc601d476aece02af6d38cdd2415d5a0a0d4e77b7008ecacdfa48fb7bca",
      buildKitAttestationManifestDigestSha256:
        "9684d48b82d3a2c745aa6f51eeab5800177ab04b4bbb94b9ff454f55b55ca75b",
      byteLength: 12_657_937_701,
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
      baseVerifierPassed: true,
      sam2ImportDenied: true,
      inheritedSam2DistributionPresent: false,
      inheritedSam2ModuleImportable: false,
      inheritedSam2TrainingModuleImportable: false,
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
          "525c54af3f32ad3f6aa021eed0a586cb326cfede11e17d4f474e128d38610927",
        reportByteLength: 4_142_705,
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
          "6798ab6f0bfc329e16d3bb540ab1f053b61ad684c2e394d1c66c910f87b539b8",
        reportByteLength: 1_451_110,
        spdxVersion: "SPDX-2.3",
        dataLicense: "CC0-1.0",
        packageCount: 690,
        relationshipCount: 1_431,
        noAssertionPackageCount: 137,
        operatingSystemPackageCount: 498,
        pythonPackageCount: 190,
        ociPackageCount: 1,
        exactDirectVcsPackageCount: 0,
      },
      license: {
        reportDigestSha256:
          "9f6526c9e84328b2125c096445daf609b6b80fa32e435be7a8fe41f0fe5e2a0b",
        reportByteLength: 3_574_469,
        resultCount: 5,
        totalFindingCount: 6_716,
        uniqueLicenseNameCount: 304,
        restrictedFindingCount: 809,
        reciprocalFindingCount: 24,
        unknownFindingCount: 567,
        noticeFindingCount: 5_292,
        unencumberedFindingCount: 24,
        operatingSystemLicenseFindingCount: 1_924,
        pythonLicenseFindingCount: 190,
        looseFileLicenseFindingCount: 4_602,
        exactDirectVcsPackageFindingCount: 0,
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
