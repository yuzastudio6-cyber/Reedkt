import assert from 'node:assert/strict'

import type {
  LivingFrameComfyUiHardenedLocalImageObservation,
} from '../../src/types/living-frame-comfyui-hardened-local-image-evidence'
import {
  compileLivingFrameComfyUiHardenedLocalImageEvidence,
  verifyLivingFrameComfyUiHardenedLocalImageEvidence,
} from '../living-frame/living-frame-comfyui-hardened-local-image-evidence'

const observation = buildObservation()
const evidence =
  compileLivingFrameComfyUiHardenedLocalImageEvidence(
    observation,
  )
assert.equal(
  verifyLivingFrameComfyUiHardenedLocalImageEvidence(
    evidence,
    observation,
  ),
  true,
)

let adversarialAssertions = 0
for (const forged of [
  {
    ...observation,
    image: {
      ...observation.image,
      digestSha256: 'f'.repeat(64),
    },
  },
  {
    ...observation,
    materialization: {
      ...observation.materialization,
      unsafeIntermediateTagRemoved: false,
    },
  },
  {
    ...observation,
    materialization: {
      ...observation.materialization,
      sanitizedImageConfigHostPathAbsent: false,
    },
  },
  {
    ...observation,
    strictVerification: {
      ...observation.strictVerification,
      uid: 0,
    },
  },
  {
    ...observation,
    strictVerification: {
      ...observation.strictVerification,
      graphExecuted: true,
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      fullImageCompleted: true,
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      vulnerabilityClearanceGranted: true,
    },
  },
  {
    ...observation,
    authority: {
      ...observation.authority,
      productionReady: true,
    },
  },
] as unknown as readonly LivingFrameComfyUiHardenedLocalImageObservation[]) {
  assert.throws(() => {
    compileLivingFrameComfyUiHardenedLocalImageEvidence(
      forged,
    )
  })
  adversarialAssertions += 1
}
assert.equal(adversarialAssertions, 8)

assert.equal(evidence.strictNonRootVerificationPassed, true)
assert.equal(evidence.sanitizedImageHostPathAbsent, true)
assert.equal(evidence.unsafeIntermediateRemoved, true)
assert.equal(evidence.reproducibleOciBuildCompleted, false)
assert.equal(evidence.fullImageScanCompleted, false)
assert.equal(evidence.vulnerabilityClearanceGranted, false)
assert.equal(evidence.controlledGenerationExecuted, false)
assert.equal(evidence.operationRegistered, false)
assert.equal(evidence.productionReady, false)

process.stdout.write(`${JSON.stringify({
  suite:
    'living-frame-comfyui-hardened-local-image-evidence',
  status: 'passed_with_incomplete_full_image_scan',
  evidenceDigestSha256:
    evidence.evidenceDigestSha256,
  observationDigestSha256:
    evidence.observationDigestSha256,
  imageDigestSha256:
    evidence.imageDigestSha256,
  imageByteLength:
    evidence.imageByteLength,
  packageArtifactCount:
    evidence.packageArtifactCount,
  strictNonRootVerificationPassed:
    evidence.strictNonRootVerificationPassed,
  sanitizedImageHostPathAbsent:
    evidence.sanitizedImageHostPathAbsent,
  unsafeIntermediateRemoved:
    evidence.unsafeIntermediateRemoved,
  reproducibleOciBuildCompleted:
    evidence.reproducibleOciBuildCompleted,
  fullImageScanCompleted:
    evidence.fullImageScanCompleted,
  vulnerabilityClearanceGranted:
    evidence.vulnerabilityClearanceGranted,
  releaseDisposition:
    evidence.releaseDisposition,
  adversarialAssertions,
  modelWeightsMounted:
    evidence.modelWeightsMounted,
  controlledGenerationExecuted:
    evidence.controlledGenerationExecuted,
  operationRegistered:
    evidence.operationRegistered,
  dispatchGranted:
    evidence.dispatchGranted,
  publicDeliveryCreated:
    evidence.publicDeliveryCreated,
  productionReady:
    evidence.productionReady,
})}\n`)

function buildObservation():
  LivingFrameComfyUiHardenedLocalImageObservation {
  return {
    observedAt: '2026-07-30',
    source: {
      closureCommitSha:
        '31e1bca64f76fbde11050129d842eb3a2a90e479',
      closureTreeSha:
        'b450107244f85c3001eb43251fc87334655750d7',
      hostEvidenceCommitSha:
        '897d22d83236b5bbca1a0a19efc6ee304b762aa6',
      hostEvidenceDigestSha256:
        '285d63bb14ad0ed3545d98c7f6d7488f923db45fed2aa7b47261de6f8ac22155',
      parentImageDigestSha256:
        '84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b',
    },
    image: {
      localReference:
        'reeditpro-living-frame-comfyui-hardened:private-internal-closure-31e1bca6-sanitized',
      digestSha256:
        'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd',
      byteLength: 12_657_282_187,
      operatingSystem: 'linux',
      architecture: 'amd64',
      defaultUid: 65_532,
      defaultGid: 65_532,
      canonicalRunnerEntrypointMatched: true,
      packageArtifactCount: 33,
      modelWeightsBakedIntoImage: false,
      localImageOnly: true,
    },
    materialization: {
      method:
        'sealed_container_overlay_commit_then_metadata_sanitize',
      exactParentDigestRevalidated: true,
      exactClosureRevalidated: true,
      networkDisabled: true,
      packageInputsReadOnly: true,
      rootLimitedToDisposableOverlay: true,
      finalVerifierUid: 65_532,
      finalVerifierGid: 65_532,
      unsafeIntermediateHostPathLeakDetected: true,
      unsafeIntermediateDigestSha256:
        'f23caf6ab721156005ac7096d88ff5d12a30fe92e46adff871c0300d553d48a3',
      unsafeIntermediateTagRemoved: true,
      unsafeIntermediateImageDeleted: true,
      temporaryContainersRemoved: true,
      sanitizedImageConfigHostPathAbsent: true,
      sanitizedImageHistoryHostPathAbsent: true,
      reproducibleOciBuildCompleted: false,
      buildProvenanceCreated: false,
    },
    strictVerification: {
      rootFilesystemReadOnly: true,
      tmpfsPath: '/tmp',
      tmpfsByteLimit: 268_435_456,
      tmpfsNoExec: true,
      allCapabilitiesDropped: true,
      noNewPrivileges: true,
      networkDisabled: true,
      uid: 65_532,
      gid: 65_532,
      distributionCount: 33,
      torch: '2.6.0+cu124',
      torchCudaBuild: '12.4',
      torchvision: '0.21.0+cu124',
      torchaudio: '2.6.0+cu124',
      pillow: '12.3.0',
      transformers: '5.5.0',
      huggingfaceHub: '1.5.0',
      canonicalRunnerLineageVerified: true,
      sam2ImportDenied: true,
      modelWeightsLoaded: false,
      graphExecuted: false,
    },
    scan: {
      scanner: 'docker_scout',
      scannerVersion: '1.20.4',
      fullImageAttempted: true,
      fullImageCompleted: false,
      boundedSeconds: 1_200,
      scratchRedirectedToPrivateBackupVolume: true,
      failureCode:
        'external_volume_indexing_timeout_no_report',
      reportCreated: false,
      incompleteTemporaryDataCleaned: true,
      vulnerabilityClearanceGranted: false,
    },
    runtime: {
      modelWeightsMounted: false,
      controlledGenerationExecuted: false,
      gpuAttemptCreated: false,
    },
    authority: {
      canonicalImageIngested: false,
      operationRegistered: false,
      dispatchGranted: false,
      assetCreated: false,
      actualCostReceiptCreated: false,
      customerChargeCreated: false,
      publicDeliveryCreated: false,
      productionReady: false,
    },
    pathSerialized: false,
    bytePayloadSerialized: false,
  }
}
