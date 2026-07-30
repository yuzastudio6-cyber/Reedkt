import assert from 'node:assert/strict'

import type {
  LivingFrameComfyUiHardenedArchiveScanObservation,
} from '../../src/types/living-frame-comfyui-hardened-archive-scan-evidence'
import {
  compileLivingFrameComfyUiHardenedArchiveScanEvidence,
  verifyLivingFrameComfyUiHardenedArchiveScanEvidence,
} from '../living-frame/living-frame-comfyui-hardened-archive-scan-evidence'

const observation = buildObservation()
const evidence =
  compileLivingFrameComfyUiHardenedArchiveScanEvidence(
    observation,
  )
assert.equal(
  verifyLivingFrameComfyUiHardenedArchiveScanEvidence(
    evidence,
    observation,
  ),
  true,
)

let adversarialAssertions = 0
for (const forged of [
  {
    ...observation,
    archive: {
      ...observation.archive,
      digestSha256: 'f'.repeat(64),
    },
  },
  {
    ...observation,
    archive: {
      ...observation.archive,
      byteLength: 12_657_282_187,
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      reportCreated: true,
    },
  },
  {
    ...observation,
    scan: {
      ...observation.scan,
      fullImageScanCompleted: true,
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
    cleanup: {
      ...observation.cleanup,
      archiveDeleted: false,
    },
  },
  {
    ...observation,
    authority: {
      ...observation.authority,
      controlledGenerationExecuted: true,
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
    pathSerialized: true,
  },
] as unknown as readonly LivingFrameComfyUiHardenedArchiveScanObservation[]) {
  assert.throws(() => {
    compileLivingFrameComfyUiHardenedArchiveScanEvidence(
      forged,
    )
  })
  adversarialAssertions += 1
}
assert.equal(adversarialAssertions, 9)

assert.equal(evidence.archiveInputVerified, true)
assert.equal(evidence.fullImageScanCompleted, false)
assert.equal(evidence.vulnerabilityClearanceGranted, false)
assert.equal(evidence.archiveAndScratchDeleted, true)
assert.equal(evidence.sanitizedDockerImageRetained, true)
assert.equal(evidence.controlledGenerationExecuted, false)
assert.equal(evidence.operationRegistered, false)
assert.equal(evidence.productionReady, false)

process.stdout.write(`${JSON.stringify({
  suite:
    'living-frame-comfyui-hardened-archive-scan-evidence',
  status: 'passed_with_incomplete_archive_scan',
  evidenceDigestSha256:
    evidence.evidenceDigestSha256,
  observationDigestSha256:
    evidence.observationDigestSha256,
  imageDigestSha256:
    evidence.imageDigestSha256,
  archiveDigestSha256:
    evidence.archiveDigestSha256,
  archiveByteLength:
    evidence.archiveByteLength,
  archiveInputVerified:
    evidence.archiveInputVerified,
  fullImageScanCompleted:
    evidence.fullImageScanCompleted,
  vulnerabilityClearanceGranted:
    evidence.vulnerabilityClearanceGranted,
  archiveAndScratchDeleted:
    evidence.archiveAndScratchDeleted,
  releaseDisposition:
    evidence.releaseDisposition,
  adversarialAssertions,
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
  LivingFrameComfyUiHardenedArchiveScanObservation {
  return {
    observedAt: '2026-07-30',
    sourceEvidenceCommitSha:
      '3b6ce879da055dd7d8ea09ec0bf2914327ea0da3',
    image: {
      digestSha256:
        'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd',
      byteLength: 12_657_282_187,
      operatingSystem: 'linux',
      architecture: 'amd64',
      sanitizedLocalDerivative: true,
    },
    archive: {
      format: 'docker_save_tar',
      digestSha256:
        'bc37a857b7c962df846d4f61874feb6f100b5a1f4bdf7e53798c95bec509fe06',
      byteLength: 12_657_311_744,
      sourceImageDigestRevalidated: true,
      sourceImageReferenceMatched: true,
      privateTemporaryArtifact: true,
    },
    scan: {
      scanner: 'docker_scout',
      scannerVersion: '1.20.4',
      inputScheme: 'archive',
      requestedPlatform: 'linux/amd64',
      boundedSeconds: 1_200,
      archiveReadStarted: true,
      scratchRedirectedToPrivateBackupVolume: true,
      scratchWorkspaceObservedNonEmpty: true,
      reportCreated: false,
      fullImageScanCompleted: false,
      terminatedAtBound: true,
      exitCode: 255,
      failureCode:
        'private_external_volume_archive_indexing_timeout_no_report',
      vulnerabilityClearanceGranted: false,
    },
    cleanup: {
      scannerProcessStopped: true,
      scoutTemporaryDataPruned: true,
      archiveDeleted: true,
      temporaryRootDeleted: true,
      backupCapacityRestored: true,
      sanitizedDockerImageRetained: true,
    },
    authority: {
      modelWeightsMounted: false,
      controlledGenerationExecuted: false,
      gpuAttemptCreated: false,
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
