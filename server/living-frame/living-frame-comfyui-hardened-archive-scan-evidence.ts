import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_STATUS,
  LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_OPEN_GATES,
  type LivingFrameComfyUiHardenedArchiveScanEvidence,
  type LivingFrameComfyUiHardenedArchiveScanObservation,
} from '../../src/types/living-frame-comfyui-hardened-archive-scan-evidence'

const SHA256 = /^[a-f0-9]{64}$/u

export function compileLivingFrameComfyUiHardenedArchiveScanEvidence(
  observation: LivingFrameComfyUiHardenedArchiveScanObservation,
): LivingFrameComfyUiHardenedArchiveScanEvidence {
  assertObservation(observation)
  const observationDigestSha256 = sha256CanonicalJson(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_VERSION,
    status:
      LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_STATUS,
    evidenceId:
      `lf-comfyui-hardened-archive-scan.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: '',
    observationDigestSha256,
    imageDigestSha256: observation.image.digestSha256,
    archiveDigestSha256: observation.archive.digestSha256,
    archiveByteLength: observation.archive.byteLength,
    archiveInputVerified: true as const,
    fullImageScanCompleted: false as const,
    vulnerabilityClearanceGranted: false as const,
    archiveAndScratchDeleted: true as const,
    sanitizedDockerImageRetained: true as const,
    releaseDisposition:
      'blocked_linux_fast_local_storage_scan_required' as const,
    openGateCodes:
      LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_OPEN_GATES,
    modelWeightsMounted: false as const,
    controlledGenerationExecuted: false as const,
    gpuAttemptCreated: false as const,
    canonicalImageIngested: false as const,
    operationRegistered: false as const,
    dispatchGranted: false as const,
    assetCreated: false as const,
    actualCostReceiptCreated: false as const,
    customerChargeCreated: false as const,
    publicDeliveryCreated: false as const,
    productionReady: false as const,
    pathSerialized: false as const,
    bytePayloadSerialized: false as const,
  }
  return Object.freeze({
    ...draft,
    evidenceDigestSha256: sha256CanonicalJson({
      ...draft,
      evidenceDigestSha256: undefined,
    }),
  })
}

export function verifyLivingFrameComfyUiHardenedArchiveScanEvidence(
  evidence: LivingFrameComfyUiHardenedArchiveScanEvidence,
  observation: LivingFrameComfyUiHardenedArchiveScanObservation,
): boolean {
  try {
    assertObservation(observation)
  } catch {
    return false
  }
  return canonicalJson(evidence) === canonicalJson(
    compileLivingFrameComfyUiHardenedArchiveScanEvidence(
      observation,
    ),
  )
}

function assertObservation(
  observation: LivingFrameComfyUiHardenedArchiveScanObservation,
): void {
  const image = observation.image
  const archive = observation.archive
  const scan = observation.scan
  const cleanup = observation.cleanup
  const authority = observation.authority
  if (
    observation.observedAt !== '2026-07-30'
    || observation.sourceEvidenceCommitSha !==
      '3b6ce879da055dd7d8ea09ec0bf2914327ea0da3'
    || image.digestSha256 !==
      'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd'
    || image.byteLength !== 12_657_282_187
    || image.operatingSystem !== 'linux'
    || image.architecture !== 'amd64'
    || !image.sanitizedLocalDerivative
    || archive.format !== 'docker_save_tar'
    || archive.digestSha256 !==
      'bc37a857b7c962df846d4f61874feb6f100b5a1f4bdf7e53798c95bec509fe06'
    || archive.byteLength !== 12_657_311_744
    || !archive.sourceImageDigestRevalidated
    || !archive.sourceImageReferenceMatched
    || !archive.privateTemporaryArtifact
    || scan.scanner !== 'docker_scout'
    || scan.scannerVersion !== '1.20.4'
    || scan.inputScheme !== 'archive'
    || scan.requestedPlatform !== 'linux/amd64'
    || scan.boundedSeconds !== 1_200
    || !scan.archiveReadStarted
    || !scan.scratchRedirectedToPrivateBackupVolume
    || !scan.scratchWorkspaceObservedNonEmpty
    || scan.reportCreated
    || scan.fullImageScanCompleted
    || !scan.terminatedAtBound
    || scan.exitCode !== 255
    || scan.failureCode !==
      'private_external_volume_archive_indexing_timeout_no_report'
    || scan.vulnerabilityClearanceGranted
    || !cleanup.scannerProcessStopped
    || !cleanup.scoutTemporaryDataPruned
    || !cleanup.archiveDeleted
    || !cleanup.temporaryRootDeleted
    || !cleanup.backupCapacityRestored
    || !cleanup.sanitizedDockerImageRetained
    || authority.modelWeightsMounted
    || authority.controlledGenerationExecuted
    || authority.gpuAttemptCreated
    || authority.canonicalImageIngested
    || authority.operationRegistered
    || authority.dispatchGranted
    || authority.assetCreated
    || authority.actualCostReceiptCreated
    || authority.customerChargeCreated
    || authority.publicDeliveryCreated
    || authority.productionReady
    || observation.pathSerialized
    || observation.bytePayloadSerialized
    || !SHA256.test(image.digestSha256)
    || !SHA256.test(archive.digestSha256)
  ) {
    throw new Error(
      'Living Frame hardened archive scan observation does not match the exact bounded no-report and cleanup boundary.',
    )
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sha256CanonicalJson(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value))
    .digest('hex')
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    )
  }
  return value
}
