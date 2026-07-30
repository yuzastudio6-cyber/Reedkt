import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_STATE,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_OPEN_GATES,
  type LivingFrameComfyUiFiveModelLocalMountArtifact,
  type LivingFrameComfyUiFiveModelLocalMountAuthority,
  type LivingFrameComfyUiFiveModelLocalMountEvidence,
  type LivingFrameComfyUiFiveModelLocalMountEvidenceDraft,
  type LivingFrameComfyUiFiveModelLocalMountIssue,
  type LivingFrameComfyUiFiveModelLocalMountObservation,
} from '../../src/types/living-frame-comfyui-five-model-local-mount-evidence'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256 =
  '1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64'

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256 =
  '89e134c865658e4d9691bf822b1397163f9cd707f23a5a7e4279cbf9e8e2ce24'

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_ENVIRONMENT_DIGEST_SHA256 =
  '7bf604a9ab25fc9a45ac74cc30ebacf734f9aafb46913162a95bd190a32ab184'

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256 =
  'cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20'

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS =
  deepFreeze([
    artifact(
      0,
      'base_checkpoint',
      6_938_078_334,
      '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
    ),
    artifact(
      1,
      'controlnet_checkpoint',
      320_237_179,
      'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
    ),
    artifact(
      2,
      'lora_adapter',
      49_553_604,
      '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
    ),
    artifact(
      3,
      'generic_ipadapter_checkpoint',
      702_585_376,
      'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
    ),
    artifact(
      4,
      'clip_vision_checkpoint',
      3_689_912_664,
      '657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d',
    ),
  ] as const)

export interface LivingFrameComfyUiFiveModelLocalMountObservationPort {
  readonly portClass:
    'process_bound_local_comfyui_five_model_mount_observation_port_v1'
  readonly callerImageCommandArgumentsEnvironmentPathModelPromptOrOutputAccepted:
    false
  readonly productionQualified: false
  readonly observeOnce:
    () => Promise<LivingFrameComfyUiFiveModelLocalMountObservation>
}

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiFiveModelLocalMountAuthority =
  deepFreeze({
    localCandidateBuildObservationAuthority: true,
    localExactModelByteObservationAuthority: true,
    localAtomicReadOnlyMountObservationAuthority: true,
    localCudaRefusalObservationAuthority: true,
    canonicalImageAuthority: false,
    canonicalArtifactRepositoryAuthority: false,
    distributedMountAuthority: false,
    modelLoadAuthority: false,
    gpuExecutionAuthority: false,
    modelInferenceAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeReleaseAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

const registeredPorts = new WeakSet<object>()
const consumedPorts = new WeakSet<object>()

export class
LivingFrameComfyUiFiveModelLocalMountEvidenceError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiFiveModelLocalMountIssue[]

  constructor(
    issues:
      readonly LivingFrameComfyUiFiveModelLocalMountIssue[],
  ) {
    super(
      'Living Frame local ComfyUI five-model mount evidence failed.',
    )
    this.name =
      'LivingFrameComfyUiFiveModelLocalMountEvidenceError'
    this.issues = issues
  }
}

export function
createLivingFrameComfyUiFiveModelLocalMountObservationPort(
  observeOnce:
    LivingFrameComfyUiFiveModelLocalMountObservationPort[
      'observeOnce'
    ],
): LivingFrameComfyUiFiveModelLocalMountObservationPort {
  if (typeof observeOnce !== 'function') {
    throw issue('observation_port_invalid', '$.port')
  }
  const port =
    Object.freeze({
      portClass:
        'process_bound_local_comfyui_five_model_mount_observation_port_v1',
      callerImageCommandArgumentsEnvironmentPathModelPromptOrOutputAccepted:
        false,
      productionQualified: false,
      observeOnce,
    } satisfies LivingFrameComfyUiFiveModelLocalMountObservationPort)
  registeredPorts.add(port)
  return port
}

export async function
createLivingFrameComfyUiFiveModelLocalMountEvidence(
  input: {
    readonly evidenceId: string
    readonly observationPort:
      LivingFrameComfyUiFiveModelLocalMountObservationPort
  },
): Promise<LivingFrameComfyUiFiveModelLocalMountEvidence> {
  if (
    !input
    || !SAFE_ID.test(input.evidenceId)
    || !registeredPorts.has(input.observationPort)
    || consumedPorts.has(input.observationPort)
    || input.observationPort.portClass !==
      'process_bound_local_comfyui_five_model_mount_observation_port_v1'
    || input.observationPort
      .callerImageCommandArgumentsEnvironmentPathModelPromptOrOutputAccepted
      !== false
    || input.observationPort.productionQualified !== false
  ) {
    throw issue(
      consumedPorts.has(input?.observationPort)
        ? 'observation_port_reused'
        : 'input_invalid',
      '$',
    )
  }
  consumedPorts.add(input.observationPort)

  let observation:
    LivingFrameComfyUiFiveModelLocalMountObservation
  try {
    observation = await input.observationPort.observeOnce()
  } catch {
    throw issue('observation_failed', '$.observationPort')
  }
  validateObservation(observation)

  const draft:
    LivingFrameComfyUiFiveModelLocalMountEvidenceDraft = {
      contractVersion:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_VERSION,
      evidenceClass:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_CLASS,
      evidenceState:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_STATE,
      evidenceId: input.evidenceId,
      image: {
        parentImageDigestSha256:
          observation.parentImageDigestSha256,
        derivedImageDigestSha256:
          observation.derivedImageDigestSha256,
        entrypointSourceDigestSha256:
          observation.entrypointSourceDigestSha256,
        fixedLaunchSpecDigestSha256:
          observation.fixedLaunchSpecDigestSha256,
        operatingSystem: 'linux',
        architecture: 'amd64',
        localImageOnly: true,
        canonicalImageRepositoryAdmissionPresent: false,
        imageSignatureVerified: false,
        vulnerabilityScanCompleted: false,
        provenanceAttestationVerified: false,
      },
      confinement: {
        defaultUid: 65_532,
        defaultGid: 65_532,
        defaultEntrypointObserved: true,
        callerArgumentRejectionObserved: true,
        rootIdentityOverrideRejectionObserved: true,
        injectedCallerEnvironmentScrubbed: true,
        environmentDigestSha256:
          observation.environmentDigestSha256,
        rootFilesystemReadOnlyObserved: true,
        allLinuxCapabilitiesDropped: true,
        noNewPrivilegesObserved: true,
        externalNetworkDisabled: true,
        runtimeDownloadsAllowed: false,
        ephemeralWriteRootOnly: true,
        processLimit: 256,
        cpuLimit: 2,
        memoryLimitBytes: 4_294_967_296,
      },
      modelMount: {
        modelArtifactCount: 5,
        aggregateByteLength: 11_700_367_157,
        modelArtifacts:
          LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS,
        bundleDigestSha256:
          LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
        atomicFiveModelMountLifetimeObserved: true,
        modelMountsReadOnlyObserved: true,
        sam2ImportBlocked: true,
      },
      runtime: {
        torchVersion: '2.5.1+cu124',
        torchvisionVersion: '0.20.1+cu124',
        cpuEmulationOnly: true,
        localArchitectureEmulationUsed: true,
        cudaAvailable: false,
        cudaDeviceCount: 0,
        promptSubmitted: false,
        modelInferenceExecuted: false,
        gpuExecutionPerformed: false,
        outputArtifactCreated: false,
        startedAt: observation.startedAt,
        completedAt: observation.completedAt,
        elapsedMilliseconds:
          observation.elapsedMilliseconds,
        exitCode: 78,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      openGateCodes:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_OPEN_GATES,
      canonicalOperationDispatched: false,
      actualCostEvidenceCreated: false,
      customerChargeCreated: false,
      artifactPersisted: false,
      publicDeliveryCreated: false,
      productionReady: false,
    }
  const evidence =
    deepFreeze({
      ...draft,
      evidenceDigestSha256: digest(draft),
    })
  if (
    !verifyLivingFrameComfyUiFiveModelLocalMountEvidence(
      evidence,
    )
  ) {
    throw issue('evidence_semantics_invalid', '$')
  }
  return evidence
}

export function
verifyLivingFrameComfyUiFiveModelLocalMountEvidence(
  value: unknown,
): value is LivingFrameComfyUiFiveModelLocalMountEvidence {
  if (
    !isRecord(value)
    || typeof value.evidenceDigestSha256 !== 'string'
    || !SHA256.test(value.evidenceDigestSha256)
  ) return false
  const { evidenceDigestSha256, ...draft } = value
  return (
    digest(draft) === evidenceDigestSha256
    && hasExpectedSemantics(draft)
  )
}

export function
fixedLivingFrameComfyUiFiveModelLocalMountLaunchSpec() {
  return deepFreeze({
    launchSpecVersion:
      'living-frame-comfyui-five-model-local-mount-launch-v1',
    parentImageDigestSha256:
      LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256,
    entrypointSourceDigestSha256:
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256,
    platform: 'linux/amd64',
    defaultUid: 65_532,
    defaultGid: 65_532,
    entrypoint: [
      '/usr/bin/python3',
      '-I',
      '-B',
      '/opt/reeditpro/local-five-model-mount-entrypoint.py',
    ],
    callerCommandOrArgumentsAccepted: false,
    callerEnvironmentMerged: false,
    networkMode: 'none',
    rootFilesystemReadOnly: true,
    allLinuxCapabilitiesDropped: true,
    noNewPrivileges: true,
    processLimit: 256,
    cpuLimit: 2,
    memoryLimitBytes: 4_294_967_296,
    temporaryRootBytes: 536_870_912,
    modelArtifactCount: 5,
    aggregateModelBytes: 11_700_367_157,
    modelBundleDigestSha256:
      LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
    modelMountsReadOnly: true,
    atomicMountLifetimeRequired: true,
    deniedTopLevelImports: ['sam2'],
    expectedLocalTerminalState:
      'exact_mount_verified_cuda_required_exit_78',
    promptSubmitted: false,
    modelInferenceExecuted: false,
    outputArtifactCreated: false,
    canonicalOperationDispatched: false,
    productionQualified: false,
  })
}

function validateObservation(
  value: LivingFrameComfyUiFiveModelLocalMountObservation,
): void {
  if (
    !value
    || value.observationClass !==
      'process_bound_local_comfyui_five_model_mount_observation_v1'
    || value.parentImageDigestSha256 !==
      LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256
    || value.entrypointSourceDigestSha256 !==
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256
    || !SHA256.test(value.derivedImageDigestSha256)
    || !SHA256.test(value.fixedLaunchSpecDigestSha256)
    || value.environmentDigestSha256 !==
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ENVIRONMENT_DIGEST_SHA256
    || value.operatingSystem !== 'linux'
    || value.architecture !== 'amd64'
    || value.localArchitectureEmulationUsed !== true
    || value.defaultUid !== 65_532
    || value.defaultGid !== 65_532
    || value.defaultEntrypointObserved !== true
    || value.callerArgumentRejectionObserved !== true
    || value.rootIdentityOverrideRejectionObserved !== true
    || value.injectedCallerEnvironmentScrubbed !== true
    || value.rootFilesystemReadOnlyObserved !== true
    || value.allLinuxCapabilitiesDropped !== true
    || value.noNewPrivilegesObserved !== true
    || value.externalNetworkDisabled !== true
    || value.runtimeDownloadsAllowed !== false
    || value.ephemeralWriteRootOnly !== true
    || value.processLimit !== 256
    || value.cpuLimit !== 2
    || value.memoryLimitBytes !== 4_294_967_296
    || value.modelArtifactCount !== 5
    || value.aggregateByteLength !== 11_700_367_157
    || value.bundleDigestSha256 !==
      LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256
    || !sameArtifacts(
      value.modelArtifacts,
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS,
    )
    || value.atomicFiveModelMountLifetimeObserved !== true
    || value.modelMountsReadOnlyObserved !== true
    || value.sam2ImportBlocked !== true
    || value.torchVersion !== '2.5.1+cu124'
    || value.torchvisionVersion !== '0.20.1+cu124'
    || value.cudaAvailable !== false
    || value.cudaDeviceCount !== 0
    || value.promptSubmitted !== false
    || value.modelInferenceExecuted !== false
    || value.gpuExecutionPerformed !== false
    || value.outputArtifactCreated !== false
    || !SAFE_ISO_TIMESTAMP.test(value.startedAt)
    || !SAFE_ISO_TIMESTAMP.test(value.completedAt)
    || value.elapsedMilliseconds <= 0
    || value.exitCode !== 78
    || value.canonicalOperationDispatched !== false
    || value.sensitiveDetailsIncluded !== false
  ) {
    throw issue('observation_invalid', '$.observation')
  }
}

function hasExpectedSemantics(value: unknown): boolean {
  if (
    !isRecord(value)
    || !isRecord(value.image)
    || !isRecord(value.confinement)
    || !isRecord(value.modelMount)
    || !isRecord(value.runtime)
    || !isRecord(value.authorityBoundary)
  ) return false
  try {
    validateObservation(Object.assign({
      observationClass:
        'process_bound_local_comfyui_five_model_mount_observation_v1',
      parentImageDigestSha256:
        value.image.parentImageDigestSha256,
      derivedImageDigestSha256:
        value.image.derivedImageDigestSha256,
      entrypointSourceDigestSha256:
        value.image.entrypointSourceDigestSha256,
      fixedLaunchSpecDigestSha256:
        value.image.fixedLaunchSpecDigestSha256,
      environmentDigestSha256:
        value.confinement.environmentDigestSha256,
      operatingSystem: 'linux',
      architecture: 'amd64',
      localArchitectureEmulationUsed: true,
    }, value.confinement, value.modelMount, value.runtime, {
      canonicalOperationDispatched: false,
      sensitiveDetailsIncluded: false,
    }) as unknown as
      LivingFrameComfyUiFiveModelLocalMountObservation)
  } catch {
    return false
  }
  const authority = value.authorityBoundary
  return (
    value.contractVersion ===
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_VERSION
    && value.evidenceClass ===
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_CLASS
    && value.evidenceState ===
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_STATE
    && value.image.localImageOnly === true
    && value.image.canonicalImageRepositoryAdmissionPresent === false
    && authority.localAtomicReadOnlyMountObservationAuthority === true
    && authority.gpuExecutionAuthority === false
    && authority.dispatchAuthority === false
    && authority.productionAuthority === false
    && value.actualCostEvidenceCreated === false
    && value.customerChargeCreated === false
    && value.artifactPersisted === false
    && value.publicDeliveryCreated === false
    && value.productionReady === false
    && Array.isArray(value.openGateCodes)
    && canonicalJson(value.openGateCodes) === canonicalJson(
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_OPEN_GATES,
    )
  )
}

function artifact(
  canonicalOrder: number,
  role: LivingFrameComfyUiFiveModelLocalMountArtifact['role'],
  byteLength: number,
  contentSha256: string,
): LivingFrameComfyUiFiveModelLocalMountArtifact {
  return {
    canonicalOrder,
    role,
    byteLength,
    contentSha256,
    readOnlyMountObserved: true,
  }
}

function sameArtifacts(
  left: readonly LivingFrameComfyUiFiveModelLocalMountArtifact[],
  right: readonly LivingFrameComfyUiFiveModelLocalMountArtifact[],
): boolean {
  return (
    Array.isArray(left)
    && left.length === 5
    && canonicalJson(left) === canonicalJson(right)
  )
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value))
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  if (
    value === null
    || typeof value === 'boolean'
    || typeof value === 'string'
  ) return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Non-finite value.')
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
    ).join(',')}}`
  }
  throw new TypeError('Unsupported canonical value.')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function issue(
  code: LivingFrameComfyUiFiveModelLocalMountIssue['code'],
  path: string,
): LivingFrameComfyUiFiveModelLocalMountEvidenceError {
  return new LivingFrameComfyUiFiveModelLocalMountEvidenceError([
    { code, path },
  ])
}
