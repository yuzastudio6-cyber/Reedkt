import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_CLASS,
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_STATE,
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_VERSION,
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_OPEN_GATES,
  type LivingFrameSam2LocalRuntimeConfinementAuthority,
  type LivingFrameSam2LocalRuntimeConfinementEvidence,
  type LivingFrameSam2LocalRuntimeConfinementEvidenceDraft,
  type LivingFrameSam2LocalRuntimeConfinementIssue,
  type LivingFrameSam2LocalRuntimeConfinementObservation,
} from '../../src/types/living-frame-sam2-local-runtime-confinement-evidence'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256 =
  '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4'

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256 =
  '603c450cf046f08efc166aec10fbf4f7b193171657a48d1c1303e69c6f4612e8'

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENVIRONMENT_DIGEST_SHA256 =
  'a9d9d6d96c776605aee4c2e7efb76d8139493b996fb6f18718740b9053b0ef1e'

const SOURCE_REVISION =
  '2b90b9f5ceec907a1c18123530e92e794ad901a4' as const
const SOURCE_LICENSE_DIGEST_SHA256 =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' as const
const SELECTED_CONFIG_DIGEST_SHA256 =
  '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55' as const
const DIRECT_SOURCE_RECORD_DIGEST_SHA256 =
  'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f' as const

export interface LivingFrameSam2LocalRuntimeConfinementObservationPort {
  readonly portClass:
    'process_bound_local_sam2_runtime_confinement_observation_port_v1'
  readonly callerImageCommandArgumentsEnvironmentPathCheckpointPromptOrMediaAccepted:
    false
  readonly productionQualified: false
  readonly observeOnce:
    () => Promise<LivingFrameSam2LocalRuntimeConfinementObservation>
}

const AUTHORITY_BOUNDARY:
  LivingFrameSam2LocalRuntimeConfinementAuthority =
  deepFreeze({
    localCandidateBuildObservationAuthority: true,
    localContainerStartupObservationAuthority: true,
    localSourceConfigRuntimeObservationAuthority: true,
    canonicalImageAuthority: false,
    canonicalArtifactRepositoryAuthority: false,
    checkpointIngestAuthority: false,
    checkpointMountAuthority: false,
    checkpointDeserializationAuthority: false,
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
    maskQaAuthority: false,
    renderAuthority: false,
    runtimeReleaseAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

const registeredPorts = new WeakSet<object>()
const consumedPorts = new WeakSet<object>()

export class
LivingFrameSam2LocalRuntimeConfinementEvidenceError
  extends Error {
  readonly issues:
    readonly LivingFrameSam2LocalRuntimeConfinementIssue[]

  constructor(
    issues:
      readonly LivingFrameSam2LocalRuntimeConfinementIssue[],
  ) {
    super(
      'Living Frame local SAM2 runtime confinement evidence failed.',
    )
    this.name =
      'LivingFrameSam2LocalRuntimeConfinementEvidenceError'
    this.issues = issues
  }
}

export function
createLivingFrameSam2LocalRuntimeConfinementObservationPort(
  observeOnce:
    LivingFrameSam2LocalRuntimeConfinementObservationPort[
      'observeOnce'
    ],
): LivingFrameSam2LocalRuntimeConfinementObservationPort {
  if (typeof observeOnce !== 'function') {
    throw issue('observation_port_invalid', '$.port')
  }
  const port:
    LivingFrameSam2LocalRuntimeConfinementObservationPort =
    Object.freeze({
      portClass:
        'process_bound_local_sam2_runtime_confinement_observation_port_v1',
      callerImageCommandArgumentsEnvironmentPathCheckpointPromptOrMediaAccepted:
        false,
      productionQualified: false,
      observeOnce,
    })
  registeredPorts.add(port)
  return port
}

export async function
createLivingFrameSam2LocalRuntimeConfinementEvidence(
  input: {
    readonly evidenceId: string
    readonly observationPort:
      LivingFrameSam2LocalRuntimeConfinementObservationPort
  },
): Promise<LivingFrameSam2LocalRuntimeConfinementEvidence> {
  if (
    !input
    || !SAFE_ID.test(input.evidenceId)
    || !registeredPorts.has(input.observationPort)
    || consumedPorts.has(input.observationPort)
    || input.observationPort.portClass !==
      'process_bound_local_sam2_runtime_confinement_observation_port_v1'
    || input.observationPort
      .callerImageCommandArgumentsEnvironmentPathCheckpointPromptOrMediaAccepted
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
    LivingFrameSam2LocalRuntimeConfinementObservation
  try {
    observation = await input.observationPort.observeOnce()
  } catch {
    throw issue('observation_failed', '$.observationPort')
  }
  validateObservation(observation)

  const draft:
    LivingFrameSam2LocalRuntimeConfinementEvidenceDraft = {
      contractVersion:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_VERSION,
      evidenceClass:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_CLASS,
      evidenceState:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_STATE,
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
        callerCommandOrArgumentsUsedForStartup: false,
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
        cpuLimit: 1,
        memoryLimitBytes: 2_147_483_648,
      },
      runtime: {
        sourceRevision: SOURCE_REVISION,
        sourceLicenseDigestSha256:
          SOURCE_LICENSE_DIGEST_SHA256,
        selectedConfigDigestSha256:
          SELECTED_CONFIG_DIGEST_SHA256,
        directSourceRecordDigestSha256:
          DIRECT_SOURCE_RECORD_DIGEST_SHA256,
        sam2DistributionVersion: '1.0',
        torchVersion: '2.5.1+cu124',
        torchvisionVersion: '0.20.1+cu124',
        cudaBuild: '12.4',
        sam2PackageImportVerified: true,
        nativeVideoPredictorBuilderImportVerified: true,
        cpuEmulationOnly: true,
        localArchitectureEmulationUsed: true,
        loopbackReady: true,
        fixedLoopbackPort: 8_190,
        cudaAvailable: false,
        cudaDeviceCount: 0,
        modelArtifactCount: 0,
        checkpointLoaded: false,
        modelInferenceExecuted: false,
        maskOutputCreated: false,
        startedAt: observation.startedAt,
        readyAt: observation.readyAt,
        stoppedAt: observation.stoppedAt,
        elapsedMilliseconds:
          observation.elapsedMilliseconds,
        exitCode: 0,
        stopGracePeriodSeconds: 5,
        stopEscalationRequired: false,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      openGateCodes:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_OPEN_GATES,
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
    !verifyLivingFrameSam2LocalRuntimeConfinementEvidence(
      evidence,
    )
  ) {
    throw issue('evidence_semantics_invalid', '$')
  }
  return evidence
}

export function
fixedLivingFrameSam2LocalRuntimeConfinementLaunchSpec() {
  return deepFreeze({
    launchSpecVersion:
      'living-frame-sam2-local-runtime-confinement-launch-v1',
    parentImageDigestSha256:
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256,
    entrypointSourceDigestSha256:
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256,
    platform: 'linux/amd64',
    defaultUid: 65_532,
    defaultGid: 65_532,
    entrypoint: [
      '/usr/bin/python3',
      '-I',
      '-B',
      '/opt/reeditpro/local-sam2-runtime-confinement-entrypoint.py',
    ],
    callerCommandOrArgumentsAccepted: false,
    callerEnvironmentMerged: false,
    networkMode: 'none',
    rootFilesystemReadOnly: true,
    allLinuxCapabilitiesDropped: true,
    noNewPrivileges: true,
    processLimit: 256,
    cpuLimit: 1,
    memoryLimitBytes: 2_147_483_648,
    tmpfs: '/tmp:rw,nosuid,nodev,noexec,size=256m',
    bindMountsAllowed: false,
    checkpointMountsAllowed: false,
    fixedLoopbackPort: 8_190,
    modelInferenceAuthorized: false,
    productionQualified: false,
  } as const)
}

export function
verifyLivingFrameSam2LocalRuntimeConfinementEvidence(
  value: unknown,
): value is LivingFrameSam2LocalRuntimeConfinementEvidence {
  if (!isRecord(value)) return false
  const {
    evidenceDigestSha256,
    ...draft
  } = value
  if (
    typeof evidenceDigestSha256 !== 'string'
    || !SHA256.test(evidenceDigestSha256)
    || evidenceDigestSha256 !== digest(draft)
  ) return false
  try {
    validateObservation({
      observationClass:
        'process_bound_local_sam2_runtime_confinement_observation_v1',
      parentImageDigestSha256:
        nestedString(value, 'image', 'parentImageDigestSha256'),
      derivedImageDigestSha256:
        nestedString(value, 'image', 'derivedImageDigestSha256'),
      entrypointSourceDigestSha256:
        nestedString(value, 'image', 'entrypointSourceDigestSha256'),
      fixedLaunchSpecDigestSha256:
        nestedString(value, 'image', 'fixedLaunchSpecDigestSha256'),
      operatingSystem: 'linux',
      architecture: 'amd64',
      localArchitectureEmulationUsed: true,
      defaultUid: 65_532,
      defaultGid: 65_532,
      defaultEntrypointObserved: true,
      callerCommandOrArgumentsUsedForStartup: false,
      callerArgumentRejectionObserved: true,
      rootIdentityOverrideRejectionObserved: true,
      injectedCallerEnvironmentScrubbed: true,
      environmentDigestSha256:
        nestedString(value, 'confinement', 'environmentDigestSha256'),
      rootFilesystemReadOnlyObserved: true,
      allLinuxCapabilitiesDropped: true,
      noNewPrivilegesObserved: true,
      externalNetworkDisabled: true,
      runtimeDownloadsAllowed: false,
      ephemeralWriteRootOnly: true,
      processLimit: 256,
      cpuLimit: 1,
      memoryLimitBytes: 2_147_483_648,
      sourceRevision: SOURCE_REVISION,
      sourceLicenseDigestSha256:
        SOURCE_LICENSE_DIGEST_SHA256,
      selectedConfigDigestSha256:
        SELECTED_CONFIG_DIGEST_SHA256,
      directSourceRecordDigestSha256:
        DIRECT_SOURCE_RECORD_DIGEST_SHA256,
      sam2DistributionVersion: '1.0',
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      cudaBuild: '12.4',
      sam2PackageImportVerified: true,
      nativeVideoPredictorBuilderImportVerified: true,
      loopbackReady: true,
      fixedLoopbackPort: 8_190,
      cudaAvailable: false,
      cudaDeviceCount: 0,
      modelArtifactCount: 0,
      checkpointLoaded: false,
      modelInferenceExecuted: false,
      maskOutputCreated: false,
      startedAt:
        nestedString(value, 'runtime', 'startedAt'),
      readyAt:
        nestedString(value, 'runtime', 'readyAt'),
      stoppedAt:
        nestedString(value, 'runtime', 'stoppedAt'),
      elapsedMilliseconds:
        nestedNumber(value, 'runtime', 'elapsedMilliseconds'),
      exitCode: 0,
      stopGracePeriodSeconds: 5,
      stopEscalationRequired: false,
      rawLogPromptPathUrlCredentialCheckpointOrMediaBytesIncluded:
        false,
    })
  } catch {
    return false
  }
  return validEvidenceSemantics(value)
}

function validateObservation(
  value: LivingFrameSam2LocalRuntimeConfinementObservation,
): void {
  const timestampsValid =
    SAFE_ISO_TIMESTAMP.test(value.startedAt)
    && SAFE_ISO_TIMESTAMP.test(value.readyAt)
    && SAFE_ISO_TIMESTAMP.test(value.stoppedAt)
  const started = Date.parse(value.startedAt)
  const ready = Date.parse(value.readyAt)
  const stopped = Date.parse(value.stoppedAt)
  const valid =
    value.observationClass ===
      'process_bound_local_sam2_runtime_confinement_observation_v1'
    && value.parentImageDigestSha256 ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256
    && SHA256.test(value.derivedImageDigestSha256)
    && value.entrypointSourceDigestSha256 ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256
    && value.fixedLaunchSpecDigestSha256 === digest(
      fixedLivingFrameSam2LocalRuntimeConfinementLaunchSpec(),
    )
    && value.operatingSystem === 'linux'
    && value.architecture === 'amd64'
    && value.localArchitectureEmulationUsed === true
    && value.defaultUid === 65_532
    && value.defaultGid === 65_532
    && value.defaultEntrypointObserved === true
    && value.callerCommandOrArgumentsUsedForStartup === false
    && value.callerArgumentRejectionObserved === true
    && value.rootIdentityOverrideRejectionObserved === true
    && value.injectedCallerEnvironmentScrubbed === true
    && value.environmentDigestSha256 ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENVIRONMENT_DIGEST_SHA256
    && value.rootFilesystemReadOnlyObserved === true
    && value.allLinuxCapabilitiesDropped === true
    && value.noNewPrivilegesObserved === true
    && value.externalNetworkDisabled === true
    && value.runtimeDownloadsAllowed === false
    && value.ephemeralWriteRootOnly === true
    && value.processLimit === 256
    && value.cpuLimit === 1
    && value.memoryLimitBytes === 2_147_483_648
    && value.sourceRevision === SOURCE_REVISION
    && value.sourceLicenseDigestSha256 ===
      SOURCE_LICENSE_DIGEST_SHA256
    && value.selectedConfigDigestSha256 ===
      SELECTED_CONFIG_DIGEST_SHA256
    && value.directSourceRecordDigestSha256 ===
      DIRECT_SOURCE_RECORD_DIGEST_SHA256
    && value.sam2DistributionVersion === '1.0'
    && value.torchVersion === '2.5.1+cu124'
    && value.torchvisionVersion === '0.20.1+cu124'
    && value.cudaBuild === '12.4'
    && value.sam2PackageImportVerified === true
    && value.nativeVideoPredictorBuilderImportVerified === true
    && value.loopbackReady === true
    && value.fixedLoopbackPort === 8_190
    && value.cudaAvailable === false
    && value.cudaDeviceCount === 0
    && value.modelArtifactCount === 0
    && value.checkpointLoaded === false
    && value.modelInferenceExecuted === false
    && value.maskOutputCreated === false
    && timestampsValid
    && Number.isFinite(started)
    && Number.isFinite(ready)
    && Number.isFinite(stopped)
    && ready >= started
    && stopped >= ready
    && Number.isSafeInteger(value.elapsedMilliseconds)
    && value.elapsedMilliseconds === stopped - started
    && value.exitCode === 0
    && value.stopGracePeriodSeconds === 5
    && value.stopEscalationRequired === false
    && value
      .rawLogPromptPathUrlCredentialCheckpointOrMediaBytesIncluded
      === false
  if (!valid) throw issue('observation_invalid', '$.observation')
}

function validEvidenceSemantics(
  value: Record<string, unknown>,
): boolean {
  const image = value.image
  const confinement = value.confinement
  const runtime = value.runtime
  return (
    value.contractVersion ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_VERSION
    && value.evidenceClass ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_CLASS
    && value.evidenceState ===
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_STATE
    && typeof value.evidenceId === 'string'
    && SAFE_ID.test(value.evidenceId)
    && isRecord(image)
    && image.localImageOnly === true
    && image.canonicalImageRepositoryAdmissionPresent === false
    && image.imageSignatureVerified === false
    && image.vulnerabilityScanCompleted === false
    && image.provenanceAttestationVerified === false
    && isRecord(confinement)
    && confinement.defaultUid === 65_532
    && confinement.defaultGid === 65_532
    && confinement.defaultEntrypointObserved === true
    && confinement.callerCommandOrArgumentsUsedForStartup === false
    && confinement.callerArgumentRejectionObserved === true
    && confinement.rootIdentityOverrideRejectionObserved === true
    && confinement.injectedCallerEnvironmentScrubbed === true
    && confinement.rootFilesystemReadOnlyObserved === true
    && confinement.allLinuxCapabilitiesDropped === true
    && confinement.noNewPrivilegesObserved === true
    && confinement.externalNetworkDisabled === true
    && confinement.runtimeDownloadsAllowed === false
    && confinement.ephemeralWriteRootOnly === true
    && confinement.processLimit === 256
    && confinement.cpuLimit === 1
    && confinement.memoryLimitBytes === 2_147_483_648
    && isRecord(runtime)
    && runtime.cpuEmulationOnly === true
    && runtime.localArchitectureEmulationUsed === true
    && runtime.cudaAvailable === false
    && runtime.cudaDeviceCount === 0
    && runtime.modelArtifactCount === 0
    && runtime.checkpointLoaded === false
    && runtime.modelInferenceExecuted === false
    && runtime.maskOutputCreated === false
    && runtime.exitCode === 0
    && runtime.stopEscalationRequired === false
    && canonicalJson(value.authorityBoundary) ===
      canonicalJson(AUTHORITY_BOUNDARY)
    && canonicalJson(value.openGateCodes) === canonicalJson(
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_OPEN_GATES,
    )
    && value.canonicalOperationDispatched === false
    && value.actualCostEvidenceCreated === false
    && value.customerChargeCreated === false
    && value.artifactPersisted === false
    && value.publicDeliveryCreated === false
    && value.productionReady === false
  )
}

function nestedString(
  value: Record<string, unknown>,
  parent: string,
  child: string,
): string {
  const record = value[parent]
  if (!isRecord(record) || typeof record[child] !== 'string') {
    return ''
  }
  return record[child]
}

function nestedNumber(
  value: Record<string, unknown>,
  parent: string,
  child: string,
): number {
  const record = value[parent]
  if (!isRecord(record) || typeof record[child] !== 'number') {
    return Number.NaN
  }
  return record[child]
}

function issue(
  code:
    LivingFrameSam2LocalRuntimeConfinementIssue['code'],
  path: string,
): LivingFrameSam2LocalRuntimeConfinementEvidenceError {
  return new LivingFrameSam2LocalRuntimeConfinementEvidenceError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
