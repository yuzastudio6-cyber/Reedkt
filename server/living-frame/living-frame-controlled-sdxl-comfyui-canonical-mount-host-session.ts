import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledModelFamilyRole,
} from '../../src/types/living-frame-controlled-model-family-binding'
import type {
  CanonicalModelArtifactMountConsumptionReceipt,
  CanonicalModelArtifactReadOnlyMountInput,
  CanonicalModelArtifactReadOnlyMountLease,
  CanonicalModelArtifactRepositoryPort,
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
  BindLivingFrameComfyUiCanonicalModelArtifactsInput,
  LivingFrameComfyUiCanonicalModelArtifactBinding,
  LivingFrameComfyUiCanonicalModelArtifactBindingEntry,
} from './living-frame-comfyui-canonical-model-artifact-binding'
import {
  verifyLivingFrameComfyUiCanonicalModelArtifactBinding,
} from './living-frame-comfyui-canonical-model-artifact-binding'
import {
  registerLivingFrameControlledSdxlComfyUiCanonicalMountHostSessionPort,
  type LivingFrameControlledSdxlComfyUiHostExecutionResult,
  type LivingFrameControlledSdxlComfyUiHostPort,
} from './living-frame-controlled-sdxl-comfyui-host-runtime'
import type {
  LivingFrameControlledSdxlPrivateGpuWireRequest,
} from './living-frame-controlled-sdxl-gpu-runtime-protocol'

const CONSUMER_SCOPE = 'comfyui.private-inference' as const
const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/u
const PRIVATE_ALIAS =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,126}[A-Za-z0-9]$/u
const SHA256 = /^[a-f0-9]{64}$/u

const MODEL_BINDINGS = Object.freeze({
  base_checkpoint: {
    slotKind: 'base_checkpoint_artifact',
    directory: 'checkpoints',
  },
  controlnet_checkpoint: {
    slotKind: 'controlnet_checkpoint_artifact',
    directory: 'controlnet',
  },
  lora_adapter: {
    slotKind: 'lora_adapter_artifact',
    directory: 'loras',
  },
  generic_ipadapter_checkpoint: {
    slotKind: 'generic_ipadapter_checkpoint_artifact',
    directory: 'ipadapter',
  },
  clip_vision_checkpoint: {
    slotKind: 'clip_vision_checkpoint_artifact',
    directory: 'clip_vision',
  },
} as const satisfies Readonly<Record<
  LivingFrameControlledModelFamilyRole,
  {
    readonly slotKind: string
    readonly directory: string
  }
>>)

export interface LivingFrameComfyUiMountedModelSource {
  readonly canonicalOrder: number
  readonly role: LivingFrameControlledModelFamilyRole
  readonly slotKind:
    | 'base_checkpoint_artifact'
    | 'controlnet_checkpoint_artifact'
    | 'lora_adapter_artifact'
    | 'generic_ipadapter_checkpoint_artifact'
    | 'clip_vision_checkpoint_artifact'
  readonly sourceAbsolutePath: string
  readonly canonicalServerDerivedMountAlias: string
  readonly fixedContainerMountPath: string
  readonly privatePromptModelAlias: string
  readonly expectedByteLength: number
  readonly expectedContentSha256: string
  readonly readOnly: true
}

export interface LivingFrameComfyUiMountedSupervisedRunnerInput {
  readonly canonicalMountSessionDigestSha256: string
  readonly wireRequest:
    LivingFrameControlledSdxlPrivateGpuWireRequest
  readonly modelSources:
    readonly LivingFrameComfyUiMountedModelSource[]
  readonly callerCommandAccepted: false
  readonly callerArgumentsAccepted: false
  readonly callerEnvironmentAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly readOnlyModelMountsRequired: true
  readonly oneProcessPerAttemptRequired: true
  readonly productionQualified: false
}

export interface LivingFrameComfyUiMountedSupervisedRunnerResult {
  readonly canonicalMountSessionDigestSha256: string
  readonly hostExecutionResult:
    LivingFrameControlledSdxlComfyUiHostExecutionResult
  readonly processLifecycle: {
    readonly receiptDigestSha256: string
    readonly processStarted: true
    readonly loopbackReady: true
    readonly hostExecutionCompleted: true
    readonly processStopped: true
    readonly oneProcessPerAttempt: true
    readonly externalListenAllowed: false
    readonly runtimeDownloadsAllowed: false
    readonly productionQualified: false
  }
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly productionQualified: false
}

export interface LivingFrameComfyUiMountedSupervisedRunnerPort {
  readonly portClass:
    'private_comfyui_mounted_supervised_runner_port_v1'
  readonly callerCommandAccepted: false
  readonly callerArgumentsAccepted: false
  readonly callerEnvironmentAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerCredentialAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly readOnlyModelMountsRequired: true
  readonly oneProcessPerAttemptRequired: true
  readonly productionQualified: false
  executeOne(
    input: LivingFrameComfyUiMountedSupervisedRunnerInput,
  ): Promise<LivingFrameComfyUiMountedSupervisedRunnerResult>
}

export interface CreateLivingFrameComfyUiCanonicalMountHostSessionInput {
  readonly sessionId: string
  readonly artifactBinding:
    LivingFrameComfyUiCanonicalModelArtifactBinding
  readonly artifactBindingInput:
    BindLivingFrameComfyUiCanonicalModelArtifactsInput
  readonly repository: CanonicalModelArtifactRepositoryPort
  readonly runnerPort:
    LivingFrameComfyUiMountedSupervisedRunnerPort
  readonly leaseDurationMs?: number
  readonly now?: () => Date
}

export interface LivingFrameComfyUiModelMountBindingPacket {
  readonly packetClass:
    'process_bound_comfyui_model_artifact_mount_binding_packet_v1'
  readonly canonicalModelArtifactBindingDigestSha256: string
  readonly requiredArtifactCount: 5
  readonly bindings: readonly {
    readonly canonicalOrder: number
    readonly role: LivingFrameControlledModelFamilyRole
    readonly artifactRecordIdDigestSha256: string
    readonly descriptorDigestSha256: string
    readonly contentSha256: string
    readonly mountConsumptionDigestSha256: string
    readonly consumerScope: typeof CONSUMER_SCOPE
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly objectVerifiedBeforeConsumer: true
    readonly objectVerifiedAfterConsumer: true
    readonly readOnlySourcePresented: true
    readonly hostPathIncluded: false
    readonly mountAliasIncluded: false
  }[]
  readonly pathsIncluded: false
  readonly mountAliasesIncluded: false
  readonly modelBytesIncluded: false
  readonly runtimeDownloadsPerformed: false
  readonly productionReady: false
  readonly packetDigestSha256: string
}

const runnerPorts = new WeakSet<object>()

export function createLivingFrameComfyUiPrivateMountedSupervisedRunnerPort(
  executeOne: (
    input: LivingFrameComfyUiMountedSupervisedRunnerInput,
  ) => Promise<LivingFrameComfyUiMountedSupervisedRunnerResult>,
): LivingFrameComfyUiMountedSupervisedRunnerPort {
  if (typeof executeOne !== 'function') {
    throw new TypeError('ComfyUI mounted runner callback is required.')
  }
  const port =
    Object.freeze<LivingFrameComfyUiMountedSupervisedRunnerPort>({
      portClass:
        'private_comfyui_mounted_supervised_runner_port_v1',
      callerCommandAccepted: false,
      callerArgumentsAccepted: false,
      callerEnvironmentAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      callerCredentialAccepted: false,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      readOnlyModelMountsRequired: true,
      oneProcessPerAttemptRequired: true,
      productionQualified: false,
      executeOne: executeOne.bind(undefined),
    })
  runnerPorts.add(port)
  return port
}

export function createLivingFrameComfyUiPrivateCanonicalMountHostSessionPort(
  input: CreateLivingFrameComfyUiCanonicalMountHostSessionInput,
): LivingFrameControlledSdxlComfyUiHostPort {
  assertFactoryInput(input)
  let consumed = false
  return registerLivingFrameControlledSdxlComfyUiCanonicalMountHostSessionPort(
    Object.freeze({
      hostPortClass:
        'private_atomic_canonical_mount_comfyui_host_session_port_v1' as const,
      callerEndpointAccepted: false as const,
      callerPathUrlCredentialAccepted: false as const,
      externalNetworkAllowed: false as const,
      runtimeDownloadsAllowed: false as const,
      productionQualified: false as const,
      executeOne: async (
        wireRequest: LivingFrameControlledSdxlPrivateGpuWireRequest,
      ) => {
        if (consumed) throw new Error('atomic_mount_session_reused')
        consumed = true
        return executeCanonicalSession(input, wireRequest)
      },
    }),
  )
}

export function livingFrameComfyUiCanonicalWireArtifactSourceBindingDigest(
  binding: LivingFrameComfyUiCanonicalModelArtifactBinding,
  entry: LivingFrameComfyUiCanonicalModelArtifactBindingEntry,
): string {
  return sha256AuthorityValue({
    bindingVersion:
      'living-frame-comfyui-canonical-wire-artifact-source-binding-v1',
    canonicalModelArtifactBindingDigestSha256:
      binding.bindingDigestSha256,
    canonicalOrder: entry.canonicalOrder,
    role: entry.role,
    artifactRecordId: entry.locator.artifactRecordId,
    descriptorDigestSha256: entry.descriptorDigestSha256,
    contentSha256: entry.contentSha256,
  })
}

async function executeCanonicalSession(
  factory: CreateLivingFrameComfyUiCanonicalMountHostSessionInput,
  wireRequest: LivingFrameControlledSdxlPrivateGpuWireRequest,
): Promise<LivingFrameControlledSdxlComfyUiHostExecutionResult> {
  if (
    !await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      factory.artifactBinding,
      factory.artifactBindingInput,
    )
  ) throw new Error('canonical_model_artifact_binding_invalid')
  if (
    factory.repository !== factory.artifactBindingInput.repository
  ) throw new Error('canonical_model_artifact_repository_mismatch')

  const entries = orderedEntries(factory.artifactBinding)
  const wireBindings = bindWireRequest(
    wireRequest,
    factory.artifactBinding,
    entries,
  )
  const leases = await Promise.all(entries.map(
    (entry) =>
      createCanonicalModelArtifactReadOnlyMountLease({
        repository: factory.repository,
        locator: entry.locator,
        leaseId:
          `${factory.sessionId}.${entry.canonicalOrder}.${entry.role}`,
        consumerScope: CONSUMER_SCOPE,
        executionTarget: 'google_cloud_run_gpu',
        leaseDurationMs: factory.leaseDurationMs,
        now: factory.now,
      }),
  ))
  const canonicalMountSessionDigestSha256 =
    sha256AuthorityValue({
      sessionVersion:
        'living-frame-comfyui-canonical-mount-host-session-v1',
      sessionIdDigestSha256:
        sha256AuthorityValue(factory.sessionId),
      canonicalModelArtifactBindingDigestSha256:
        factory.artifactBinding.bindingDigestSha256,
      requestIdDigestSha256:
        sha256AuthorityValue(wireRequest.requestId),
      modelWireBindings: wireBindings.map((binding) => ({
        role: binding.entry.role,
        slotKind: binding.wire.slotKind,
        artifactRecordId: binding.wire.artifactRecordId,
        artifactContentSha256:
          binding.wire.artifactContentSha256,
        artifactSourceBindingDigestSha256:
          binding.wire.artifactSourceBindingDigestSha256,
        privateAliasDigestSha256:
          sha256AuthorityValue(binding.wire.privateAlias),
      })),
      leases: leases.map((lease, index) => ({
        canonicalOrder: index,
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
      Array.from({ length: entries.length })
  const receipts:
    Array<CanonicalModelArtifactMountConsumptionReceipt | undefined> =
      Array.from({ length: entries.length })
  let runnerResult:
    LivingFrameComfyUiMountedSupervisedRunnerResult | undefined

  const consumeAt = async (index: number): Promise<void> => {
    const consumer =
      createCanonicalModelArtifactReadOnlyMountConsumer({
        consumerScope: CONSUMER_SCOPE,
        executionTarget: 'google_cloud_run_gpu',
        consumeReadOnlyModelArtifact: async (source) => {
          sources[index] = source
          if (index + 1 < entries.length) {
            await consumeAt(index + 1)
            return
          }
          runnerResult = await factory.runnerPort.executeOne({
            canonicalMountSessionDigestSha256,
            wireRequest,
            modelSources: mountedSources(
              sources,
              wireBindings,
            ),
            callerCommandAccepted: false,
            callerArgumentsAccepted: false,
            callerEnvironmentAccepted: false,
            callerPathAccepted: false,
            callerUrlAccepted: false,
            callerCredentialAccepted: false,
            externalNetworkAllowed: false,
            runtimeDownloadsAllowed: false,
            readOnlyModelMountsRequired: true,
            oneProcessPerAttemptRequired: true,
            productionQualified: false,
          })
        },
      })
    receipts[index] =
      await consumeCanonicalModelArtifactReadOnlyMountLease({
        lease: leases[index],
        consumer,
      })
  }
  await consumeAt(0)

  if (!runnerResult) throw new Error('atomic_mount_session_incomplete')
  assertRunnerResult(
    runnerResult,
    canonicalMountSessionDigestSha256,
  )
  const packet = modelPacket(
    factory.artifactBinding,
    entries,
    leases,
    receipts,
  )
  const hostResult = runnerResult.hostExecutionResult
  if (hostResult.canonicalModelMountSession !== undefined) {
    throw new Error('nested_canonical_mount_session_forbidden')
  }
  return Object.freeze({
    ...hostResult,
    canonicalModelMountSession: Object.freeze({
      canonicalMountSessionDigestSha256,
      modelBindingPacketDigestSha256:
        packet.packetDigestSha256,
      processLifecycleReceiptDigestSha256:
        runnerResult.processLifecycle.receiptDigestSha256,
      requiredArtifactCount: 5 as const,
      everyObjectVerifiedBeforeAndAfterInference: true as const,
      processStartedAndStoppedInsideSession: true as const,
      hostPathIncluded: false as const,
      mountAliasIncluded: false as const,
      modelBytesIncluded: false as const,
    }),
  })
}

function orderedEntries(
  binding: LivingFrameComfyUiCanonicalModelArtifactBinding,
): readonly LivingFrameComfyUiCanonicalModelArtifactBindingEntry[] {
  const expectedRoles = Object.keys(MODEL_BINDINGS)
  if (
    binding.entries.length !== 5
    || binding.entries.some((entry, index) =>
      entry.canonicalOrder !== index
      || !expectedRoles.includes(entry.role))
    || new Set(binding.entries.map((entry) => entry.role)).size !== 5
  ) throw new Error('canonical_model_artifact_set_invalid')
  return binding.entries
}

function bindWireRequest(
  request: LivingFrameControlledSdxlPrivateGpuWireRequest,
  binding: LivingFrameComfyUiCanonicalModelArtifactBinding,
  entries:
    readonly LivingFrameComfyUiCanonicalModelArtifactBindingEntry[],
) {
  const modelWires = request.artifactMountBindings.filter(
    (entry) =>
      Object.values(MODEL_BINDINGS).some(
        (expectation) =>
          expectation.slotKind === entry.slotKind,
      ),
  )
  if (modelWires.length !== 5) {
    throw new Error('wire_model_artifact_set_invalid')
  }
  return entries.map((entry) => {
    const expected = MODEL_BINDINGS[entry.role]
    const wire = modelWires.find(
      (candidate) => candidate.slotKind === expected.slotKind,
    )
    if (
      !wire
      || wire.artifactRecordId
        !== entry.locator.artifactRecordId
      || wire.artifactContentSha256 !== entry.contentSha256
      || wire.artifactSourceBindingDigestSha256
        !==
          livingFrameComfyUiCanonicalWireArtifactSourceBindingDigest(
            binding,
            entry,
          )
      || wire.readOnlyMountRequired !== true
      || !validPrivateAlias(wire.privateAlias)
    ) throw new Error('wire_model_artifact_binding_mismatch')
    return { entry, wire }
  })
}

function mountedSources(
  sources:
    Array<CanonicalModelArtifactReadOnlyMountInput | undefined>,
  bindings: ReturnType<typeof bindWireRequest>,
): readonly LivingFrameComfyUiMountedModelSource[] {
  return bindings.map(({ entry, wire }, index) => {
    const source = sources[index]
    const expected = MODEL_BINDINGS[entry.role]
    if (
      !source
      || source.artifactRecordId
        !== entry.locator.artifactRecordId
      || source.expectedByteLength !== entry.byteLength
      || source.expectedContentSha256 !== entry.contentSha256
      || source.consumerScope !== CONSUMER_SCOPE
      || source.executionTarget !== 'google_cloud_run_gpu'
      || source.accelerator !== 'cuda'
      || source.readOnly !== true
      || source.cpuFallbackAllowed !== false
      || source.runtimeDownloadAllowed !== false
      || source.networkFetchAllowed !== false
    ) throw new Error('canonical_model_source_mismatch')
    return Object.freeze({
      canonicalOrder: entry.canonicalOrder,
      role: entry.role,
      slotKind: expected.slotKind,
      sourceAbsolutePath: source.sourceAbsolutePath,
      canonicalServerDerivedMountAlias:
        source.serverDerivedMountAlias,
      fixedContainerMountPath:
        `/mnt/reeditpro/model-artifacts/${expected.directory}/${wire.privateAlias}`,
      privatePromptModelAlias: wire.privateAlias,
      expectedByteLength: entry.byteLength,
      expectedContentSha256: entry.contentSha256,
      readOnly: true as const,
    })
  })
}

function modelPacket(
  binding: LivingFrameComfyUiCanonicalModelArtifactBinding,
  entries:
    readonly LivingFrameComfyUiCanonicalModelArtifactBindingEntry[],
  leases: readonly CanonicalModelArtifactReadOnlyMountLease[],
  receipts:
    Array<CanonicalModelArtifactMountConsumptionReceipt | undefined>,
): LivingFrameComfyUiModelMountBindingPacket {
  const bindings = entries.map((entry, index) => {
    const lease = leases[index]
    const receipt = receipts[index]
    if (
      !lease
      || !receipt
      || receipt.locator.artifactRecordId
        !== entry.locator.artifactRecordId
      || receipt.locator.contentSha256 !== entry.contentSha256
      || receipt.consumerScope !== CONSUMER_SCOPE
      || receipt.executionTarget !== 'google_cloud_run_gpu'
      || receipt.objectVerifiedBeforeConsumer !== true
      || receipt.objectVerifiedAfterConsumer !== true
      || receipt.readOnlySourcePresented !== true
    ) throw new Error('canonical_mount_receipt_mismatch')
    return {
      canonicalOrder: entry.canonicalOrder,
      role: entry.role,
      artifactRecordIdDigestSha256:
        sha256AuthorityValue(receipt.locator.artifactRecordId),
      descriptorDigestSha256: lease.descriptorDigestSha256,
      contentSha256: entry.contentSha256,
      mountConsumptionDigestSha256:
        receipt.consumptionDigestSha256,
      consumerScope: CONSUMER_SCOPE,
      executionTarget: 'google_cloud_run_gpu' as const,
      objectVerifiedBeforeConsumer: true as const,
      objectVerifiedAfterConsumer: true as const,
      readOnlySourcePresented: true as const,
      hostPathIncluded: false as const,
      mountAliasIncluded: false as const,
    }
  })
  const draft = {
    packetClass:
      'process_bound_comfyui_model_artifact_mount_binding_packet_v1' as const,
    canonicalModelArtifactBindingDigestSha256:
      binding.bindingDigestSha256,
    requiredArtifactCount: 5 as const,
    bindings,
    pathsIncluded: false as const,
    mountAliasesIncluded: false as const,
    modelBytesIncluded: false as const,
    runtimeDownloadsPerformed: false as const,
    productionReady: false as const,
  }
  return Object.freeze({
    ...draft,
    packetDigestSha256: sha256AuthorityValue(draft),
  })
}

function assertFactoryInput(
  input: CreateLivingFrameComfyUiCanonicalMountHostSessionInput,
): void {
  if (
    !input
    || typeof input !== 'object'
    || !SAFE_ID.test(input.sessionId)
    || !input.artifactBinding
    || !input.artifactBindingInput
    || !input.repository
    || !runnerPorts.has(input.runnerPort)
    || input.runnerPort.portClass
      !== 'private_comfyui_mounted_supervised_runner_port_v1'
  ) throw new TypeError(
    'Living Frame ComfyUI canonical mount session input is invalid.',
  )
}

function assertRunnerResult(
  value: LivingFrameComfyUiMountedSupervisedRunnerResult,
  expectedSessionDigestSha256: string,
): void {
  const lifecycle = value?.processLifecycle
  const host = value?.hostExecutionResult
  const started = Date.parse(host?.startedAt ?? '')
  const finished = Date.parse(host?.finishedAt ?? '')
  if (
    !value
    || value.canonicalMountSessionDigestSha256
      !== expectedSessionDigestSha256
    || !lifecycle
    || !SHA256.test(lifecycle.receiptDigestSha256)
    || lifecycle.processStarted !== true
    || lifecycle.loopbackReady !== true
    || lifecycle.hostExecutionCompleted !== true
    || lifecycle.processStopped !== true
    || lifecycle.oneProcessPerAttempt !== true
    || lifecycle.externalListenAllowed !== false
    || lifecycle.runtimeDownloadsAllowed !== false
    || lifecycle.productionQualified !== false
    || !host
    || host.evidenceClass
      !==
        'private_internal_comfyui_host_runtime_observation_unreleased'
    || !Number.isFinite(started)
    || !Number.isFinite(finished)
    || finished < started
    || (
      host.terminalState === 'completed'
      && host.modelInferenceExecuted !== true
    )
    || host.externalNetworkPerformed !== false
    || host.runtimeDownloadPerformed !== false
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
    || value.productionQualified !== false
  ) throw new Error('mounted_supervised_runner_result_invalid')
}

function validPrivateAlias(value: string): boolean {
  return PRIVATE_ALIAS.test(value)
    && value.endsWith('.safetensors')
    && !value.includes('..')
    && !value.includes('/')
    && !value.includes('\\')
}

export function livingFrameComfyUiCanonicalMountHostSessionValueSha256(
  value: unknown,
): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}
