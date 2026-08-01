import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_STATUS,
  LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_OPEN_GATES,
  type LivingFrameComfyUiHardenedLocalImageEvidence,
  type LivingFrameComfyUiHardenedLocalImageObservation,
} from '../../src/types/living-frame-comfyui-hardened-local-image-evidence'

const SHA256 = /^[a-f0-9]{64}$/u

export function compileLivingFrameComfyUiHardenedLocalImageEvidence(
  observation: LivingFrameComfyUiHardenedLocalImageObservation,
): LivingFrameComfyUiHardenedLocalImageEvidence {
  assertObservation(observation)
  const observationDigestSha256 = sha256CanonicalJson(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_CLASS,
    status:
      LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_STATUS,
    evidenceId:
      `lf-comfyui-hardened-local-image.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: '',
    observationDigestSha256,
    imageDigestSha256: observation.image.digestSha256,
    imageByteLength: observation.image.byteLength,
    packageArtifactCount: observation.image.packageArtifactCount,
    strictNonRootVerificationPassed: true as const,
    sanitizedImageHostPathAbsent: true as const,
    unsafeIntermediateRemoved: true as const,
    reproducibleOciBuildCompleted: false as const,
    fullImageScanCompleted: false as const,
    vulnerabilityClearanceGranted: false as const,
    releaseDisposition:
      'blocked_reproducible_build_and_complete_scan_required' as const,
    openGateCodes:
      LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_OPEN_GATES,
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

export function verifyLivingFrameComfyUiHardenedLocalImageEvidence(
  evidence: LivingFrameComfyUiHardenedLocalImageEvidence,
  observation: LivingFrameComfyUiHardenedLocalImageObservation,
): boolean {
  try {
    assertObservation(observation)
  } catch {
    return false
  }
  return canonicalJson(evidence) === canonicalJson(
    compileLivingFrameComfyUiHardenedLocalImageEvidence(
      observation,
    ),
  )
}

function assertObservation(
  observation: LivingFrameComfyUiHardenedLocalImageObservation,
): void {
  const source = observation.source
  const image = observation.image
  const materialization = observation.materialization
  const verification = observation.strictVerification
  const scan = observation.scan
  if (
    observation.observedAt !== '2026-07-30'
    || source.closureCommitSha !==
      '31e1bca64f76fbde11050129d842eb3a2a90e479'
    || source.closureTreeSha !==
      'b450107244f85c3001eb43251fc87334655750d7'
    || source.hostEvidenceCommitSha !==
      '897d22d83236b5bbca1a0a19efc6ee304b762aa6'
    || source.hostEvidenceDigestSha256 !==
      '285d63bb14ad0ed3545d98c7f6d7488f923db45fed2aa7b47261de6f8ac22155'
    || source.parentImageDigestSha256 !==
      '84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b'
    || image.localReference !==
      'reeditpro-living-frame-comfyui-hardened:private-internal-closure-31e1bca6-sanitized'
    || image.digestSha256 !==
      'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd'
    || image.byteLength !== 12_657_282_187
    || image.operatingSystem !== 'linux'
    || image.architecture !== 'amd64'
    || image.defaultUid !== 65_532
    || image.defaultGid !== 65_532
    || !image.canonicalRunnerEntrypointMatched
    || image.packageArtifactCount !== 33
    || image.modelWeightsBakedIntoImage
    || !image.localImageOnly
    || materialization.method !==
      'sealed_container_overlay_commit_then_metadata_sanitize'
    || !materialization.exactParentDigestRevalidated
    || !materialization.exactClosureRevalidated
    || !materialization.networkDisabled
    || !materialization.packageInputsReadOnly
    || !materialization.rootLimitedToDisposableOverlay
    || materialization.finalVerifierUid !== 65_532
    || materialization.finalVerifierGid !== 65_532
    || !materialization.unsafeIntermediateHostPathLeakDetected
    || materialization.unsafeIntermediateDigestSha256 !==
      'f23caf6ab721156005ac7096d88ff5d12a30fe92e46adff871c0300d553d48a3'
    || !materialization.unsafeIntermediateTagRemoved
    || !materialization.unsafeIntermediateImageDeleted
    || !materialization.temporaryContainersRemoved
    || !materialization.sanitizedImageConfigHostPathAbsent
    || !materialization.sanitizedImageHistoryHostPathAbsent
    || materialization.reproducibleOciBuildCompleted
    || materialization.buildProvenanceCreated
    || !verification.rootFilesystemReadOnly
    || verification.tmpfsPath !== '/tmp'
    || verification.tmpfsByteLimit !== 268_435_456
    || !verification.tmpfsNoExec
    || !verification.allCapabilitiesDropped
    || !verification.noNewPrivileges
    || !verification.networkDisabled
    || verification.uid !== 65_532
    || verification.gid !== 65_532
    || verification.distributionCount !== 33
    || verification.torch !== '2.6.0+cu124'
    || verification.torchCudaBuild !== '12.4'
    || verification.torchvision !== '0.21.0+cu124'
    || verification.torchaudio !== '2.6.0+cu124'
    || verification.pillow !== '12.3.0'
    || verification.transformers !== '5.5.0'
    || verification.huggingfaceHub !== '1.5.0'
    || !verification.canonicalRunnerLineageVerified
    || !verification.sam2ImportDenied
    || verification.modelWeightsLoaded
    || verification.graphExecuted
    || scan.scanner !== 'docker_scout'
    || scan.scannerVersion !== '1.20.4'
    || !scan.fullImageAttempted
    || scan.fullImageCompleted
    || scan.boundedSeconds !== 1_200
    || !scan.scratchRedirectedToPrivateBackupVolume
    || scan.failureCode !==
      'external_volume_indexing_timeout_no_report'
    || scan.reportCreated
    || !scan.incompleteTemporaryDataCleaned
    || scan.vulnerabilityClearanceGranted
    || observation.runtime.modelWeightsMounted
    || observation.runtime.controlledGenerationExecuted
    || observation.runtime.gpuAttemptCreated
    || observation.authority.canonicalImageIngested
    || observation.authority.operationRegistered
    || observation.authority.dispatchGranted
    || observation.authority.assetCreated
    || observation.authority.actualCostReceiptCreated
    || observation.authority.customerChargeCreated
    || observation.authority.publicDeliveryCreated
    || observation.authority.productionReady
    || observation.pathSerialized
    || observation.bytePayloadSerialized
    || [
      source.closureCommitSha,
      source.closureTreeSha,
      source.hostEvidenceCommitSha,
      source.hostEvidenceDigestSha256,
      source.parentImageDigestSha256,
      image.digestSha256,
      materialization.unsafeIntermediateDigestSha256,
    ].some((value) =>
      value.length === 64 && !SHA256.test(value))
  ) {
    throw new Error(
      'Living Frame hardened local image observation does not match the exact private materialization and incomplete-scan boundary.',
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
