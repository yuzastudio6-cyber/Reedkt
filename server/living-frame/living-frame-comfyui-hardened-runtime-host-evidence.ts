import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_STATUS,
  LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_VERSION,
  type LivingFrameComfyUiHardenedRuntimeHostEvidence,
  type LivingFrameComfyUiHardenedRuntimeHostObservation,
} from '../../src/types/living-frame-comfyui-hardened-runtime-host-evidence'

const SHA256 = /^[a-f0-9]{64}$/u
const GIT_SHA = /^[a-f0-9]{40}$/u

export function compileLivingFrameComfyUiHardenedRuntimeHostEvidence(
  observation: LivingFrameComfyUiHardenedRuntimeHostObservation,
): LivingFrameComfyUiHardenedRuntimeHostEvidence {
  assertObservation(observation)
  const observationDigestSha256 = sha256CanonicalJson(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_CLASS,
    status:
      LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_STATUS,
    evidenceId:
      `lf-comfyui-hardened-host.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: '',
    observationDigestSha256,
    sourceContractCommitSha: observation.sourceContractCommitSha,
    sourceContractTreeSha: observation.sourceContractTreeSha,
    evidenceRunnerCommitSha: observation.evidenceRunnerCommitSha,
    evidenceRunnerTreeSha: observation.evidenceRunnerTreeSha,
    parentImageDigest: observation.parentImageDigest,
    packageArtifactCount: 33 as const,
    packageCacheSetDigestsSha256:
      observation.packageCacheBindings.map(
        (binding) => binding.beforeSetDigestSha256,
      ) as [string, string, string],
    cacheRehashStable: true as const,
    cacheHostReadOnlyModeVerified: true as const,
    cacheContainerReadOnlyMountVerified: true as const,
    packageRuntimeCompatibilityVerified: true as const,
    nonRootRuntimeIdentityVerified: true as const,
    canonicalRunnerLineageVerified: true as const,
    sam2ImportDenied: true as const,
    networkDenied: true as const,
    gpuAccessGranted: false as const,
    containerRemovedAfterRun: true as const,
    ephemeralInstallerRootOnly: true as const,
    finalVerifierNonRoot: true as const,
    imageBuilt: false as const,
    imageScanned: false as const,
    controlledGenerationRuntimeExecuted: false as const,
    modelWeightsMounted: false as const,
    gpuAttemptCreated: false as const,
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
    packageCacheSetDigestsSha256:
      Object.freeze(draft.packageCacheSetDigestsSha256),
    evidenceDigestSha256: sha256CanonicalJson({
      ...draft,
      evidenceDigestSha256: undefined,
    }),
  })
}

export function verifyLivingFrameComfyUiHardenedRuntimeHostEvidence(
  evidence: LivingFrameComfyUiHardenedRuntimeHostEvidence,
  observation: LivingFrameComfyUiHardenedRuntimeHostObservation,
): boolean {
  try {
    assertObservation(observation)
  } catch {
    return false
  }
  const expected =
    compileLivingFrameComfyUiHardenedRuntimeHostEvidence(observation)
  return canonicalJson(evidence) === canonicalJson(expected)
}

function assertObservation(
  observation: LivingFrameComfyUiHardenedRuntimeHostObservation,
): void {
  const [core, remediation, transformers] =
    observation.packageCacheBindings
  const verifier = observation.verifierObservation
  if (
    observation.sourceContractCommitSha !==
      '31e1bca64f76fbde11050129d842eb3a2a90e479'
    || observation.sourceContractTreeSha !==
      'b450107244f85c3001eb43251fc87334655750d7'
    || !GIT_SHA.test(observation.evidenceRunnerCommitSha)
    || !GIT_SHA.test(observation.evidenceRunnerTreeSha)
    || !observation.sourceWorktreeClean
    || !observation.sourceContractFilesMatchFrozenCommit
    || !observation.frozenCommitIsRunnerAncestor
    || observation.parentImageReference !==
      'reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0'
    || observation.parentImageDigest !==
      'sha256:84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b'
    || observation.platform !== 'linux/amd64'
    || observation.networkMode !== 'none'
    || observation.processLimit !== 256
    || observation.memoryLimit !== '12g'
    || observation.cpuLimit !== '4'
    || !observation.noNewPrivileges
    || observation.gpuAccessGranted
    || observation.packageCacheBindings.length !== 3
    || core.role !== 'core'
    || core.artifactCount !== 4
    || remediation.role !== 'remediation'
    || remediation.artifactCount !== 2
    || transformers.role !== 'transformers_closure'
    || transformers.artifactCount !== 27
    || observation.packageCacheBindings.some(
      (binding) =>
        !SHA256.test(binding.beforeSetDigestSha256)
        || binding.beforeSetDigestSha256 !==
          binding.afterSetDigestSha256
        || !binding.hostReadOnlyModeVerified
        || !binding.containerReadOnlyMountVerified
        || !binding.beforeAfterRehashStable
        || binding.pathSerialized,
    )
    || observation.dockerAttemptCount !== 1
    || !observation.disposableOverlayUsed
    || !observation.containerRemovedAfterRun
    || observation.installerIdentity !==
      'ephemeral_overlay_root'
    || observation.finalVerifierIdentity !==
      'non_root_65532'
    || !observation.installerCompleted
    || !observation.nonRootVerifierCompleted
    || verifier.contract !==
      'living-frame-comfyui-hardened-runtime-private-build-verifier-v1'
    || verifier.status !== 'passed'
    || verifier.uid !== 65532
    || verifier.gid !== 65532
    || verifier.distributionCount !== 33
    || verifier.torch !== '2.6.0+cu124'
    || verifier.torchCudaBuild !== '12.4'
    || verifier.torchvision !== '0.21.0+cu124'
    || verifier.torchaudio !== '2.6.0+cu124'
    || verifier.pillow !== '12.3.0'
    || verifier.transformers !== '5.5.0'
    || verifier.huggingfaceHub !== '1.5.0'
    || !verifier.sam2ImportDenied
    || verifier.modelWeightsLoaded
    || verifier.graphExecuted
    || verifier.runtimeAuthority
    || verifier.productionReady
    || !SHA256.test(observation.verifierOutputDigestSha256)
    || observation.verifierOutputDigestSha256 !==
      sha256CanonicalJson(verifier)
    || !observation.packageRuntimeCompatibilityVerified
    || observation.controlledGenerationRuntimeExecuted
    || observation.modelWeightsMounted
    || observation.sourceMediaMounted
    || observation.promptMaterialMounted
    || observation.credentialMaterialMounted
    || observation.imageBuilt
    || observation.imageScanned
    || observation.gpuAttemptCreated
    || observation.operationRegistered
    || observation.dispatchGranted
    || observation.assetCreated
    || observation.actualCostReceiptCreated
    || observation.customerChargeCreated
    || observation.publicDeliveryCreated
    || observation.productionReady
    || observation.pathSerialized
    || observation.bytePayloadSerialized
  ) {
    throw new Error(
      'Living Frame hardened ComfyUI host observation does not match the exact sealed private-internal closure boundary.',
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
