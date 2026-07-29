import { createHash } from 'node:crypto'

import {
  type CanonicalModelArtifactLocator,
  type CanonicalModelArtifactMountConsumptionReceipt,
  type CanonicalModelArtifactReadOnlyMountInput,
  type CanonicalModelArtifactRepositoryPort,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  consumeCanonicalModelArtifactReadOnlyMountLease,
  createCanonicalModelArtifactReadOnlyMountConsumer,
  createCanonicalModelArtifactReadOnlyMountLease,
} from '../model-artifacts/canonical-model-artifact-read-only-mount'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  LivingFrameAuraFaceArtifactRequirement,
  LivingFrameAuraFaceArtifactRequirements,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  verifyLivingFrameAuraFaceArtifactRequirements,
} from './living-frame-auraface-artifact-requirements'
import {
  registerLivingFrameAuraFaceCpuCanonicalMountHostSessionPort,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionPort,
  type LivingFrameAuraFaceCpuCanonicalMountHostSessionResult,
  type LivingFrameAuraFaceCpuHostExecutionResult,
  type LivingFrameAuraFaceCpuModelBindingPacket,
} from './living-frame-auraface-cpu-runtime'
import {
  compileLivingFrameAuraFaceAtomicMountOfflineRunnerRequest,
  parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse,
} from './living-frame-auraface-offline-runner-protocol'

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const CONSUMER_SCOPE =
  'living-frame.auraface-continuity-measurement' as const

const CONTAINER_MODEL_PATHS = {
  auraface_v1_embedding_model:
    '/mnt/reeditpro/model-artifacts/auraface/glintr100.onnx',
  auraface_v1_face_detector:
    '/mnt/reeditpro/model-artifacts/auraface/scrfd_10g_bnkps.onnx',
} as const

export interface LivingFrameAuraFaceMountedModelSource {
  readonly canonicalOrder: 0 | 1
  readonly requirementId:
    LivingFrameAuraFaceArtifactRequirement['requirementId']
  readonly sourceAbsolutePath: string
  readonly canonicalServerDerivedMountAlias: string
  readonly fixedContainerMountPath:
    | '/mnt/reeditpro/model-artifacts/auraface/glintr100.onnx'
    | '/mnt/reeditpro/model-artifacts/auraface/scrfd_10g_bnkps.onnx'
  readonly expectedByteLength:
    LivingFrameAuraFaceArtifactRequirement['byteLength']
  readonly expectedContentSha256:
    LivingFrameAuraFaceArtifactRequirement['contentSha256']
  readonly readOnly: true
}

export interface LivingFrameAuraFaceMountedOfflineRunnerInput {
  readonly requestJson: string
  readonly requestEnvelopeSha256: string
  readonly canonicalMountSessionDigestSha256: string
  readonly modelSources: readonly [
    LivingFrameAuraFaceMountedModelSource,
    LivingFrameAuraFaceMountedModelSource,
  ]
  readonly callerCommandAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly readOnlyRootFilesystemRequired: true
  readonly productionQualified: false
}

export interface LivingFrameAuraFaceMountedOfflineRunnerResult {
  readonly responseJson: string
  readonly requestEnvelopeSha256: string
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly productionQualified: false
}

export interface LivingFrameAuraFaceMountedOfflineRunnerPort {
  readonly portClass:
    | 'controlled_fixture_auraface_mounted_offline_runner_port_v1'
    | 'private_auraface_mounted_offline_runner_port_v1'
  readonly callerCommandAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly readOnlyRootFilesystemRequired: true
  readonly productionQualified: false
  executeOne(
    input: LivingFrameAuraFaceMountedOfflineRunnerInput,
  ): Promise<LivingFrameAuraFaceMountedOfflineRunnerResult>
}

export interface CreateLivingFrameAuraFaceCanonicalMountHostSessionInput {
  readonly sessionId: string
  readonly artifactRequirements:
    LivingFrameAuraFaceArtifactRequirements
  readonly repository: CanonicalModelArtifactRepositoryPort
  readonly artifactLocators: readonly [
    CanonicalModelArtifactLocator,
    CanonicalModelArtifactLocator,
  ]
  readonly runnerPort:
    LivingFrameAuraFaceMountedOfflineRunnerPort
  readonly leaseDurationMs?: number
  readonly now?: () => Date
}

const runnerPorts = new WeakSet<object>()

export function createLivingFrameAuraFaceControlledFixtureMountedOfflineRunnerPort(
  executeOne: (
    input: LivingFrameAuraFaceMountedOfflineRunnerInput,
  ) => Promise<LivingFrameAuraFaceMountedOfflineRunnerResult>,
): LivingFrameAuraFaceMountedOfflineRunnerPort {
  return registerRunnerPort({
    portClass:
      'controlled_fixture_auraface_mounted_offline_runner_port_v1',
    executeOne,
  })
}

export function createLivingFrameAuraFacePrivateMountedOfflineRunnerPort(
  executeOne: (
    input: LivingFrameAuraFaceMountedOfflineRunnerInput,
  ) => Promise<LivingFrameAuraFaceMountedOfflineRunnerResult>,
): LivingFrameAuraFaceMountedOfflineRunnerPort {
  return registerRunnerPort({
    portClass:
      'private_auraface_mounted_offline_runner_port_v1',
    executeOne,
  })
}

export function createLivingFrameAuraFacePrivateCanonicalMountHostSessionPort(
  input: CreateLivingFrameAuraFaceCanonicalMountHostSessionInput,
): LivingFrameAuraFaceCpuCanonicalMountHostSessionPort {
  assertFactoryInput(input)
  let consumed = false
  return registerLivingFrameAuraFaceCpuCanonicalMountHostSessionPort(
    Object.freeze({
      portClass:
        'private_canonical_auraface_atomic_mount_host_session_port_v1' as const,
      callerLocatorAccepted: false as const,
      callerPathAccepted: false as const,
      callerBytesAccepted: false as const,
      callerUrlAccepted: false as const,
      callerEndpointAccepted: false as const,
      externalNetworkAllowed: false as const,
      runtimeDownloadsAllowed: false as const,
      atomicMountAndInferenceRequired: true as const,
      productionQualified: false as const,
      executeOne: async (
        sessionInput:
          LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
      ): Promise<
        LivingFrameAuraFaceCpuCanonicalMountHostSessionResult
      > => {
        if (consumed) throw new Error('atomic_mount_session_reused')
        consumed = true
        return executeCanonicalSession(input, sessionInput)
      },
    }),
  )
}

async function executeCanonicalSession(
  factory:
    CreateLivingFrameAuraFaceCanonicalMountHostSessionInput,
  session: LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
): Promise<LivingFrameAuraFaceCpuCanonicalMountHostSessionResult> {
  assertSessionInput(session, factory.artifactRequirements)
  const leases = await Promise.all(
    factory.artifactRequirements.artifacts.map(
      async (requirement, index) =>
        createCanonicalModelArtifactReadOnlyMountLease({
          repository: factory.repository,
          locator: factory.artifactLocators[index]!,
          leaseId:
            `${factory.sessionId}.${index}.${requirement.requirementId}`,
          consumerScope: CONSUMER_SCOPE,
          executionTarget: 'private_controlled_cpu',
          leaseDurationMs: factory.leaseDurationMs,
          now: factory.now,
        }),
    ),
  )
  const canonicalMountSessionDigestSha256 =
    sha256AuthorityValue({
      sessionVersion:
        'living-frame-auraface-canonical-mount-host-session-v1',
      sessionIdDigestSha256:
        sha256AuthorityValue(factory.sessionId),
      artifactRequirementSetDigestSha256:
        session.artifactRequirementSetDigestSha256,
      preprocessingSpecDigestSha256:
        session.preprocessingSpecDigestSha256,
      inputContentDigests: [
        session.referenceImage.contentSha256,
        session.candidateImage.contentSha256,
      ],
      modelLeaseBindings: leases.map((lease, index) => ({
        canonicalOrder: index,
        requirementId:
          factory.artifactRequirements.artifacts[index]!
            .requirementId,
        leaseDigestSha256: lease.leaseDigestSha256,
        descriptorDigestSha256:
          lease.descriptorDigestSha256,
        contentSha256: lease.locator.contentSha256,
      })),
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
    })

  const sources:
    Array<CanonicalModelArtifactReadOnlyMountInput | undefined> =
      [undefined, undefined]
  let detectorReceipt:
    CanonicalModelArtifactMountConsumptionReceipt | undefined
  let hostResult: LivingFrameAuraFaceCpuHostExecutionResult | undefined
  let runnerRequestEnvelopeSha256: string | undefined

  const embeddingConsumer =
    createCanonicalModelArtifactReadOnlyMountConsumer({
      consumerScope: CONSUMER_SCOPE,
      executionTarget: 'private_controlled_cpu',
      consumeReadOnlyModelArtifact: async (embeddingSource) => {
        sources[0] = embeddingSource
        const detectorConsumer =
          createCanonicalModelArtifactReadOnlyMountConsumer({
            consumerScope: CONSUMER_SCOPE,
            executionTarget: 'private_controlled_cpu',
            consumeReadOnlyModelArtifact: async (detectorSource) => {
              sources[1] = detectorSource
              const request =
                compileLivingFrameAuraFaceAtomicMountOfflineRunnerRequest({
                  session,
                  canonicalMountSessionDigestSha256,
                })
              const runnerResult =
                await factory.runnerPort.executeOne({
                  requestJson: request.requestJson,
                  requestEnvelopeSha256:
                    request.requestEnvelopeSha256,
                  canonicalMountSessionDigestSha256,
                  modelSources: mountedSources(
                    sources,
                    factory.artifactRequirements,
                  ),
                  callerCommandAccepted: false,
                  callerPathAccepted: false,
                  callerUrlAccepted: false,
                  callerCredentialAccepted: false,
                  externalNetworkAllowed: false,
                  runtimeDownloadsAllowed: false,
                  readOnlyRootFilesystemRequired: true,
                  productionQualified: false,
                })
              assertRunnerResult(
                runnerResult,
                request.requestEnvelopeSha256,
              )
              runnerRequestEnvelopeSha256 =
                request.requestEnvelopeSha256
              hostResult =
                parseLivingFrameAuraFaceAtomicMountOfflineRunnerResponse({
                  responseJson: runnerResult.responseJson,
                  expectedRequestEnvelopeSha256:
                    request.requestEnvelopeSha256,
                })
            },
          })
        detectorReceipt =
          await consumeCanonicalModelArtifactReadOnlyMountLease({
            lease: leases[1],
            consumer: detectorConsumer,
          })
      },
    })
  const embeddingReceipt =
    await consumeCanonicalModelArtifactReadOnlyMountLease({
      lease: leases[0],
      consumer: embeddingConsumer,
    })

  if (
    !detectorReceipt
    || !hostResult
    || !runnerRequestEnvelopeSha256
  ) throw new Error('atomic_mount_session_incomplete')
  const receipts = [embeddingReceipt, detectorReceipt] as const
  const modelBindingPacket = modelPacket(
    factory.artifactRequirements,
    leases,
    receipts,
  )
  return Object.freeze({
    modelBindingPacket,
    hostExecutionResult: hostResult,
    canonicalMountSessionDigestSha256,
    runnerRequestEnvelopeSha256,
    atomicMountAndInferenceCompleted: true,
    callerPathUrlCredentialCommandAccepted: false,
    externalNetworkPerformed: false,
    runtimeDownloadPerformed: false,
    productionQualified: false,
  })
}

function mountedSources(
  sources:
    Array<CanonicalModelArtifactReadOnlyMountInput | undefined>,
  requirements: LivingFrameAuraFaceArtifactRequirements,
): readonly [
  LivingFrameAuraFaceMountedModelSource,
  LivingFrameAuraFaceMountedModelSource,
] {
  if (!sources[0] || !sources[1]) {
    throw new Error('canonical_model_sources_incomplete')
  }
  return requirements.artifacts.map((requirement, index) => {
    const source = sources[index]!
    if (
      source.expectedByteLength !== requirement.byteLength
      || source.expectedContentSha256
        !== requirement.contentSha256
      || source.consumerScope !== CONSUMER_SCOPE
      || source.executionTarget !== 'private_controlled_cpu'
      || source.accelerator !== 'none'
      || source.readOnly !== true
      || source.cpuFallbackAllowed !== false
      || source.runtimeDownloadAllowed !== false
      || source.networkFetchAllowed !== false
    ) throw new Error('canonical_model_source_mismatch')
    return Object.freeze({
      canonicalOrder: requirement.canonicalOrder,
      requirementId: requirement.requirementId,
      sourceAbsolutePath: source.sourceAbsolutePath,
      canonicalServerDerivedMountAlias:
        source.serverDerivedMountAlias,
      fixedContainerMountPath:
        CONTAINER_MODEL_PATHS[requirement.requirementId],
      expectedByteLength: requirement.byteLength,
      expectedContentSha256: requirement.contentSha256,
      readOnly: true as const,
    })
  }) as unknown as readonly [
    LivingFrameAuraFaceMountedModelSource,
    LivingFrameAuraFaceMountedModelSource,
  ]
}

function modelPacket(
  requirements: LivingFrameAuraFaceArtifactRequirements,
  leases: Awaited<
    ReturnType<typeof createCanonicalModelArtifactReadOnlyMountLease>
  >[],
  receipts: readonly [
    CanonicalModelArtifactMountConsumptionReceipt,
    CanonicalModelArtifactMountConsumptionReceipt,
  ],
): LivingFrameAuraFaceCpuModelBindingPacket {
  const bindings = requirements.artifacts.map(
    (requirement, index) => {
      const lease = leases[index]!
      const receipt = receipts[index]!
      if (
        receipt.locator.artifactRecordId
          !== lease.locator.artifactRecordId
        || receipt.locator.contentSha256
          !== requirement.contentSha256
        || receipt.consumerScope !== CONSUMER_SCOPE
        || receipt.executionTarget !== 'private_controlled_cpu'
        || receipt.objectVerifiedBeforeConsumer !== true
        || receipt.objectVerifiedAfterConsumer !== true
        || receipt.readOnlySourcePresented !== true
      ) throw new Error('canonical_mount_receipt_mismatch')
      return {
        canonicalOrder: requirement.canonicalOrder,
        requirementId: requirement.requirementId,
        artifactIdentityCode: requirement.artifactIdentityCode,
        sourceRevision: requirement.sourceRevision,
        artifactFormat: requirement.artifactFormat,
        byteLength: requirement.byteLength,
        contentSha256: requirement.contentSha256,
        artifactRecordIdDigestSha256:
          sha256AuthorityValue(receipt.locator.artifactRecordId),
        descriptorDigestSha256:
          lease.descriptorDigestSha256,
        mountConsumptionDigestSha256:
          receipt.consumptionDigestSha256,
        consumerScope: CONSUMER_SCOPE,
        executionTarget: 'private_controlled_cpu' as const,
        objectVerifiedBeforeConsumer: true as const,
        objectVerifiedAfterConsumer: true as const,
        readOnlySourcePresented: true as const,
        hostPathIncluded: false as const,
        mountAliasIncluded: false as const,
      }
    },
  )
  return Object.freeze({
    packetClass:
      'process_bound_auraface_model_artifact_mount_binding_packet_v1',
    artifactRequirementSetDigestSha256:
      requirements.requirementSetDigestSha256,
    bindings: bindings as unknown as
      LivingFrameAuraFaceCpuModelBindingPacket['bindings'],
    pathsIncluded: false,
    mountAliasesIncluded: false,
    modelBytesIncluded: false,
    runtimeDownloadsPerformed: false,
    productionReady: false,
  })
}

function registerRunnerPort(
  input: {
    readonly portClass:
      LivingFrameAuraFaceMountedOfflineRunnerPort['portClass']
    readonly executeOne:
      LivingFrameAuraFaceMountedOfflineRunnerPort['executeOne']
  },
): LivingFrameAuraFaceMountedOfflineRunnerPort {
  if (typeof input.executeOne !== 'function') {
    throw new TypeError('AuraFace mounted runner callback is required.')
  }
  const port =
    Object.freeze<LivingFrameAuraFaceMountedOfflineRunnerPort>({
      portClass: input.portClass,
      callerCommandAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      callerCredentialAccepted: false,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      readOnlyRootFilesystemRequired: true,
      productionQualified: false,
      executeOne: input.executeOne.bind(undefined),
    })
  runnerPorts.add(port)
  return port
}

function assertFactoryInput(
  input: CreateLivingFrameAuraFaceCanonicalMountHostSessionInput,
): void {
  if (
    !input
    || typeof input !== 'object'
    || !SAFE_ID.test(input.sessionId)
    || !verifyLivingFrameAuraFaceArtifactRequirements(
      input.artifactRequirements,
    )
    || !input.repository
    || !Array.isArray(input.artifactLocators)
    || input.artifactLocators.length !== 2
    || !runnerPorts.has(input.runnerPort)
    || input.runnerPort.portClass
      !== 'private_auraface_mounted_offline_runner_port_v1'
  ) throw new TypeError(
    'Living Frame AuraFace canonical mount session input is invalid.',
  )
  input.artifactLocators.forEach((locator, index) => {
    const requirement = input.artifactRequirements.artifacts[index]!
    if (
      locator.contentSha256 !== requirement.contentSha256
      || locator.revision !== requirement.sourceRevision
      || !SHA256.test(locator.manifestDigestSha256)
    ) throw new TypeError(
      'Living Frame AuraFace canonical model locator is invalid.',
    )
  })
}

function assertSessionInput(
  input: LivingFrameAuraFaceCpuCanonicalMountHostSessionInput,
  requirements: LivingFrameAuraFaceArtifactRequirements,
): void {
  if (
    input.artifactRequirementSetDigestSha256
      !== requirements.requirementSetDigestSha256
    || !SHA256.test(input.preprocessingSpecDigestSha256)
    || input.callerThresholdAccepted !== false
    || input.identityApprovalRequested !== false
    || input.externalNetworkAllowed !== false
    || input.runtimeDownloadsAllowed !== false
    || !validImage(input.referenceImage)
    || !validImage(input.candidateImage)
  ) throw new TypeError(
    'Living Frame AuraFace atomic session request is invalid.',
  )
}

function validImage(
  image:
    LivingFrameAuraFaceCpuCanonicalMountHostSessionInput[
      'referenceImage'
    ],
): boolean {
  return (
    ['image/png', 'image/jpeg'].includes(image.contentType)
    && SHA256.test(image.contentSha256)
    && image.contentBytes instanceof Uint8Array
    && createHash('sha256').update(image.contentBytes).digest('hex')
      === image.contentSha256
  )
}

function assertRunnerResult(
  value: LivingFrameAuraFaceMountedOfflineRunnerResult,
  expectedEnvelopeSha256: string,
): void {
  if (
    !value
    || typeof value !== 'object'
    || typeof value.responseJson !== 'string'
    || value.responseJson.length < 2
    || value.responseJson.length > 128 * 1024
    || value.requestEnvelopeSha256 !== expectedEnvelopeSha256
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
    || value.productionQualified !== false
  ) throw new Error('mounted_runner_result_invalid')
}
