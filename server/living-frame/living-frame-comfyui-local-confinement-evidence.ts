import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_STATE,
  LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_OPEN_GATES,
  type LivingFrameComfyUiLocalConfinementAuthority,
  type LivingFrameComfyUiLocalConfinementEvidence,
  type LivingFrameComfyUiLocalConfinementEvidenceDraft,
  type LivingFrameComfyUiLocalConfinementIssue,
  type LivingFrameComfyUiLocalConfinementObservation,
} from '../../src/types/living-frame-comfyui-local-confinement-evidence'
import {
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
} from './living-frame-comfyui-dependency-lock-manifest'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u
const ENTRYPOINT_SOURCE_DIGEST_SHA256 =
  '1f12a36bbdea0f8aa51dd247a085db4d8658df71cd5d7ddac0bbec88df01055a'
const FIXED_ENVIRONMENT_DIGEST_SHA256 =
  'fbeef7db64ca9448fb41dccec77343d1be3ebbe572f43e3ea6916f75a50356c6'

export interface LivingFrameComfyUiLocalConfinementObservationPort {
  readonly portClass:
    'process_bound_local_comfyui_confinement_observation_port_v1'
  readonly callerImageCommandArgumentsEnvironmentOrPathAccepted: false
  readonly productionQualified: false
  readonly observeOnce:
    () => Promise<LivingFrameComfyUiLocalConfinementObservation>
}

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiLocalConfinementAuthority =
  deepFreeze({
    localCandidateBuildObservationAuthority: true,
    localContainerStartupObservationAuthority: true,
    canonicalImageAuthority: false,
    canonicalArtifactRepositoryAuthority: false,
    vulnerabilityScanAuthority: false,
    signatureAuthority: false,
    provenanceAttestationAuthority: false,
    licenseApprovalAuthority: false,
    releasedRunnerAuthority: false,
    modelArtifactAuthority: false,
    gpuExecutionAuthority: false,
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
    alphaAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

const registeredPorts = new WeakSet<object>()
const consumedPorts = new WeakSet<object>()

export class LivingFrameComfyUiLocalConfinementEvidenceError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiLocalConfinementIssue[]

  constructor(
    issues:
      readonly LivingFrameComfyUiLocalConfinementIssue[],
  ) {
    super(
      'Living Frame local ComfyUI confinement evidence failed.',
    )
    this.name =
      'LivingFrameComfyUiLocalConfinementEvidenceError'
    this.issues = issues
  }
}

export function createLivingFrameComfyUiLocalConfinementObservationPort(
  observeOnce:
    LivingFrameComfyUiLocalConfinementObservationPort[
      'observeOnce'
    ],
): LivingFrameComfyUiLocalConfinementObservationPort {
  if (typeof observeOnce !== 'function') {
    throw issue('observation_port_invalid', '$.port')
  }
  const port:
    LivingFrameComfyUiLocalConfinementObservationPort =
    Object.freeze({
      portClass:
        'process_bound_local_comfyui_confinement_observation_port_v1',
      callerImageCommandArgumentsEnvironmentOrPathAccepted: false,
      productionQualified: false,
      observeOnce,
    })
  registeredPorts.add(port)
  return port
}

export async function createLivingFrameComfyUiLocalConfinementEvidence(
  input: {
    readonly evidenceId: string
    readonly observationPort:
      LivingFrameComfyUiLocalConfinementObservationPort
  },
): Promise<LivingFrameComfyUiLocalConfinementEvidence> {
  if (
    !input
    || !SAFE_ID.test(input.evidenceId)
    || !registeredPorts.has(input.observationPort)
    || consumedPorts.has(input.observationPort)
    || input.observationPort.portClass !==
      'process_bound_local_comfyui_confinement_observation_port_v1'
    || input.observationPort
      .callerImageCommandArgumentsEnvironmentOrPathAccepted
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
    LivingFrameComfyUiLocalConfinementObservation
  try {
    observation = await input.observationPort.observeOnce()
  } catch {
    throw issue('observation_failed', '$.observationPort')
  }
  validateObservation(observation)

  const draft:
    LivingFrameComfyUiLocalConfinementEvidenceDraft = {
      contractVersion:
        LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_VERSION,
      evidenceClass:
        LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_CLASS,
      evidenceState:
        LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_STATE,
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
        callerCommandOrArgumentsUsedForMainStartup: false,
        callerArgumentRejectionObserved: true,
        injectedCallerEnvironmentScrubbed: true,
        environmentDigestSha256:
          observation.environmentDigestSha256,
        rootFilesystemReadOnlyObserved: true,
        allLinuxCapabilitiesDropped: true,
        noNewPrivilegesObserved: true,
        externalNetworkDisabled: true,
        runtimeDownloadsAllowed: false,
        ephemeralWriteRootOnly: true,
        processLimit: 512,
        cpuLimit: 2,
        memoryLimitBytes: 4_294_967_296,
      },
      startup: {
        cpuEmulationOnly: true,
        localArchitectureEmulationUsed: true,
        sam2ImportBlockedBeforeComfyUiLoad: true,
        standardLibraryImportPreserved: true,
        reviewedCustomNodeCount: 2,
        loopbackReady: true,
        fixedLoopbackPort: 8_188,
        modelArtifactCount: 0,
        modelInferenceExecuted: false,
        gpuExecutionPerformed: false,
        promptSubmitted: false,
        outputArtifactCreated: false,
        startedAt: observation.startedAt,
        readyAt: observation.readyAt,
        stoppedAt: observation.stoppedAt,
        elapsedMilliseconds:
          observation.elapsedMilliseconds,
        exitCode: observation.exitCode,
        stopGracePeriodSeconds:
          observation.stopGracePeriodSeconds,
        stopEscalationRequired:
          observation.stopEscalationRequired,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      openGateCodes: [
        ...LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_OPEN_GATES,
      ],
      canonicalOperationDispatched: false,
      actualCostEvidenceCreated: false,
      customerChargeCreated: false,
      artifactPersisted: false,
      publicDeliveryCreated: false,
      productionReady: false,
    }
  if (!hasExpectedSemantics(draft)) {
    throw issue(
      'evidence_semantics_invalid',
      '$.evidence',
    )
  }
  return deepFreeze({
    ...draft,
    evidenceDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameComfyUiLocalConfinementEvidence(
  value: unknown,
): value is LivingFrameComfyUiLocalConfinementEvidence {
  if (
    !isRecord(value)
    || typeof value.evidenceDigestSha256 !== 'string'
    || !SHA256.test(value.evidenceDigestSha256)
  ) return false
  const {
    evidenceDigestSha256,
    ...draft
  } = value
  return (
    digest(draft) === evidenceDigestSha256
    && hasExpectedSemantics(draft)
  )
}

export function fixedLivingFrameComfyUiLocalConfinementLaunchSpec() {
  return deepFreeze({
    parentImageDigestSha256:
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
    entrypointSourceDigestSha256:
      ENTRYPOINT_SOURCE_DIGEST_SHA256,
    imageDefaultIdentity: '65532:65532' as const,
    mainStartupCallerCommandOrArgumentsAllowed: false as const,
    environmentMergeAllowed: false as const,
    listenAddress: '127.0.0.1' as const,
    listenPort: 8_188 as const,
    customNodePolicy: 'disable_all_then_whitelist_two' as const,
    deniedTopLevelImports: ['sam2'] as const,
    runtimeNetworkAllowed: false as const,
    runtimeDownloadsAllowed: false as const,
    modelArtifactCount: 0 as const,
    cpuEmulationOnly: true as const,
    gpuExecutionAllowed: false as const,
    promptSubmissionAllowed: false as const,
    outputCreationAllowed: false as const,
    stopGracePeriodSeconds: 5 as const,
    boundedStopEscalationAllowed: true as const,
    productionQualified: false as const,
  })
}

function validateObservation(
  value: LivingFrameComfyUiLocalConfinementObservation,
): void {
  if (
    !value
    || value.observationClass !==
      'process_bound_local_comfyui_confinement_startup_observation_v1'
    || value.parentImageDigestSha256 !==
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    || !SHA256.test(value.derivedImageDigestSha256)
    || value.entrypointSourceDigestSha256 !==
      ENTRYPOINT_SOURCE_DIGEST_SHA256
    || value.fixedLaunchSpecDigestSha256 !==
      digest(
        fixedLivingFrameComfyUiLocalConfinementLaunchSpec(),
      )
    || value.operatingSystem !== 'linux'
    || value.architecture !== 'amd64'
    || value.localArchitectureEmulationUsed !== true
    || value.derivedImageDefaultUid !== 65_532
    || value.derivedImageDefaultGid !== 65_532
    || value.defaultEntrypointObserved !== true
    || value.callerCommandOrArgumentsUsedForMainStartup !==
      false
    || value.callerArgumentRejectionObserved !== true
    || value.injectedCallerEnvironmentScrubbed !== true
    || value.environmentDigestSha256 !==
      FIXED_ENVIRONMENT_DIGEST_SHA256
    || value.rootFilesystemReadOnlyObserved !== true
    || value.allLinuxCapabilitiesDropped !== true
    || value.noNewPrivilegesObserved !== true
    || value.externalNetworkDisabled !== true
    || value.runtimeDownloadsAllowed !== false
    || value.ephemeralWriteRootOnly !== true
    || value.processLimit !== 512
    || value.cpuLimit !== 2
    || value.memoryLimitBytes !== 4_294_967_296
    || value.sam2ImportBlockedBeforeComfyUiLoad !== true
    || value.standardLibraryImportPreserved !== true
    || value.reviewedCustomNodeCount !== 2
    || value.loopbackReady !== true
    || value.fixedLoopbackPort !== 8_188
    || value.modelArtifactCount !== 0
    || value.modelInferenceExecuted !== false
    || value.gpuExecutionPerformed !== false
    || value.promptSubmitted !== false
    || value.outputArtifactCreated !== false
    || !SAFE_ISO_TIMESTAMP.test(value.startedAt)
    || !SAFE_ISO_TIMESTAMP.test(value.readyAt)
    || !SAFE_ISO_TIMESTAMP.test(value.stoppedAt)
    || ![0, 137, 143].includes(value.exitCode)
    || value.stopGracePeriodSeconds !== 5
    || typeof value.stopEscalationRequired !== 'boolean'
    || value.stopEscalationRequired !==
      (value.exitCode === 137)
    || value.rawLogPromptPathUrlCredentialOrModelBytesIncluded
      !== false
  ) throw issue('observation_invalid', '$.observation')

  const started = Date.parse(value.startedAt)
  const ready = Date.parse(value.readyAt)
  const stopped = Date.parse(value.stoppedAt)
  if (
    !Number.isFinite(started)
    || !Number.isFinite(ready)
    || !Number.isFinite(stopped)
    || ready < started
    || stopped < ready
    || !Number.isSafeInteger(value.elapsedMilliseconds)
    || value.elapsedMilliseconds < 0
    || value.elapsedMilliseconds !== stopped - started
  ) throw issue('observation_invalid', '$.observation')
}

function hasExpectedSemantics(
  value: unknown,
): value is LivingFrameComfyUiLocalConfinementEvidenceDraft {
  if (!isRecord(value)) return false
  const image = value.image
  const confinement = value.confinement
  const startup = value.startup
  return (
    value.contractVersion ===
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_VERSION
    && value.evidenceClass ===
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_CLASS
    && value.evidenceState ===
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_STATE
    && typeof value.evidenceId === 'string'
    && SAFE_ID.test(value.evidenceId)
    && isRecord(image)
    && image.parentImageDigestSha256 ===
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    && typeof image.derivedImageDigestSha256 === 'string'
    && SHA256.test(image.derivedImageDigestSha256)
    && image.entrypointSourceDigestSha256 ===
      ENTRYPOINT_SOURCE_DIGEST_SHA256
    && image.fixedLaunchSpecDigestSha256 ===
      digest(
        fixedLivingFrameComfyUiLocalConfinementLaunchSpec(),
      )
    && image.operatingSystem === 'linux'
    && image.architecture === 'amd64'
    && image.localImageOnly === true
    && image.canonicalImageRepositoryAdmissionPresent === false
    && image.imageSignatureVerified === false
    && image.vulnerabilityScanCompleted === false
    && image.provenanceAttestationVerified === false
    && isRecord(confinement)
    && confinement.defaultUid === 65_532
    && confinement.defaultGid === 65_532
    && confinement.defaultEntrypointObserved === true
    && confinement
      .callerCommandOrArgumentsUsedForMainStartup === false
    && confinement.callerArgumentRejectionObserved === true
    && confinement.injectedCallerEnvironmentScrubbed === true
    && confinement.environmentDigestSha256 ===
      FIXED_ENVIRONMENT_DIGEST_SHA256
    && confinement.rootFilesystemReadOnlyObserved === true
    && confinement.allLinuxCapabilitiesDropped === true
    && confinement.noNewPrivilegesObserved === true
    && confinement.externalNetworkDisabled === true
    && confinement.runtimeDownloadsAllowed === false
    && confinement.ephemeralWriteRootOnly === true
    && confinement.processLimit === 512
    && confinement.cpuLimit === 2
    && confinement.memoryLimitBytes === 4_294_967_296
    && isRecord(startup)
    && startup.cpuEmulationOnly === true
    && startup.localArchitectureEmulationUsed === true
    && startup.sam2ImportBlockedBeforeComfyUiLoad === true
    && startup.standardLibraryImportPreserved === true
    && startup.reviewedCustomNodeCount === 2
    && startup.loopbackReady === true
    && startup.fixedLoopbackPort === 8_188
    && startup.modelArtifactCount === 0
    && startup.modelInferenceExecuted === false
    && startup.gpuExecutionPerformed === false
    && startup.promptSubmitted === false
    && startup.outputArtifactCreated === false
    && typeof startup.startedAt === 'string'
    && SAFE_ISO_TIMESTAMP.test(startup.startedAt)
    && typeof startup.readyAt === 'string'
    && SAFE_ISO_TIMESTAMP.test(startup.readyAt)
    && typeof startup.stoppedAt === 'string'
    && SAFE_ISO_TIMESTAMP.test(startup.stoppedAt)
    && Number.isSafeInteger(startup.elapsedMilliseconds)
    && Number(startup.elapsedMilliseconds) >= 0
    && validTimeline(startup)
    && [0, 137, 143].includes(Number(startup.exitCode))
    && startup.stopGracePeriodSeconds === 5
    && typeof startup.stopEscalationRequired === 'boolean'
    && startup.stopEscalationRequired ===
      (startup.exitCode === 137)
    && canonicalJson(value.authorityBoundary) ===
      canonicalJson(AUTHORITY_BOUNDARY)
    && canonicalJson(value.openGateCodes) ===
      canonicalJson(
        LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_OPEN_GATES,
      )
    && value.canonicalOperationDispatched === false
    && value.actualCostEvidenceCreated === false
    && value.customerChargeCreated === false
    && value.artifactPersisted === false
    && value.publicDeliveryCreated === false
    && value.productionReady === false
  )
}

function validTimeline(
  value: Record<string, unknown>,
): boolean {
  const started = Date.parse(String(value.startedAt))
  const ready = Date.parse(String(value.readyAt))
  const stopped = Date.parse(String(value.stoppedAt))
  return Number.isFinite(started)
    && Number.isFinite(ready)
    && Number.isFinite(stopped)
    && ready >= started
    && stopped >= ready
    && Number(value.elapsedMilliseconds) === stopped - started
}

function issue(
  code: LivingFrameComfyUiLocalConfinementIssue['code'],
  path: string,
): LivingFrameComfyUiLocalConfinementEvidenceError {
  return new LivingFrameComfyUiLocalConfinementEvidenceError([
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
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
