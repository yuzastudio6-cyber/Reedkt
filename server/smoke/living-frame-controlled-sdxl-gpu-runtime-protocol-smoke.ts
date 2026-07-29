import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkGraphRecipe,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlBenchmarkGraphBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  compileLivingFrameControlledSdxlGpuRuntimeRequest,
  consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease,
  createLivingFrameControlledSdxlGpuRuntimeArtifactReader,
  LivingFrameControlledSdxlGpuRuntimeProtocolError,
  verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  type LivingFrameControlledSdxlGpuRuntimeArtifactPacket,
  type LivingFrameControlledSdxlGpuRuntimePrivateArtifact,
} from '../living-frame/living-frame-controlled-sdxl-gpu-runtime-protocol'
import {
  createLivingFrameControlledSdxlPrivatePromptReader,
  materializeLivingFrameControlledSdxlPrivatePrompt,
  type LivingFrameControlledSdxlPrivatePromptMaterializationResult,
  type LivingFrameControlledSdxlPrivatePromptPacket,
} from '../living-frame/living-frame-controlled-sdxl-private-prompt-materialization'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const SLOT_VALUES: Readonly<Record<
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
  string
>> = Object.freeze({
  base_checkpoint_artifact: 'sdxl_base_private.safetensors',
  controlnet_checkpoint_artifact:
    'controlnet_canny_private.safetensors',
  lora_adapter_artifact: 'editorial_style_private.safetensors',
  generic_ipadapter_checkpoint_artifact:
    'ipadapter_generic_private.safetensors',
  clip_vision_checkpoint_artifact:
    'clip_vision_private.safetensors',
  positive_conditioning_text:
    'subject-neutral editorial illustration with clear layer separation',
  negative_conditioning_text:
    'illegible text, watermark, distorted geometry, unsafe likeness',
  control_image_artifact: 'control_image_private.png',
  reference_image_artifact: 'reference_image_private.png',
})

async function main(): Promise<void> {
  const recipe = await createCombinedRecipe()
  const controlled = await compileControlled(recipe)
  const receipt = controlled.runtime.receipt
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      receipt,
    ),
    true,
  )
  assert.equal(receipt.caseId, 'full_combined_primary')
  assert.equal(receipt.requestSummary.promptNodeCount, 15)
  assert.equal(receipt.requestSummary.modelArtifactCount, 5)
  assert.equal(receipt.requestSummary.inputImageArtifactCount, 2)
  assert.equal(
    receipt.costBinding.oneWireRequestRepresentsOneGpuAttempt,
    true,
  )
  assert.equal(
    receipt.costBinding.fiveGpuCapabilitiesShareAttemptLifetime,
    true,
  )
  assert.deepEqual(
    receipt.costBinding.sharedGpuCapabilityKeys,
    [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ],
  )
  assert.equal(
    receipt.costBinding.separateCpuQaCapabilityKey,
    'auraface',
  )
  assert.equal(receipt.costBinding.auraFaceExcludedFromGpuRequest, true)
  assert.equal(
    receipt.costBinding.creditsMustRoundOnceAfterBundleAggregation,
    true,
  )
  assert.equal(receipt.gpuAttemptCreated, false)
  assert.equal(receipt.actualAttemptCostEvidenceCreated, false)
  assert.equal(receipt.dispatchReady, false)
  assert.equal(receipt.productionReady, false)
  const serializedReceipt = JSON.stringify(receipt)
  for (const forbidden of [
    SLOT_VALUES.base_checkpoint_artifact,
    SLOT_VALUES.control_image_artifact,
    SLOT_VALUES.positive_conditioning_text,
    'https://',
    'file://',
    '/tmp/',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    assert.equal(serializedReceipt.includes(forbidden), false)
  }

  const wireRequest =
    consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease(
      controlled.runtime.privateWireRequestLease,
    )
  assert.equal(Object.keys(wireRequest.prompt).length, 15)
  assert.equal(wireRequest.artifactMountBindings.length, 7)
  const checkpointNode = Object.values(wireRequest.prompt)
    .find((node) =>
      node.class_type === 'CheckpointLoaderSimple')
  assert.equal(
    checkpointNode?.inputs.ckpt_name,
    SLOT_VALUES.base_checkpoint_artifact,
  )
  assert.equal(
    wireRequest.costEventExpectation
      .oneRequestEqualsOneGpuAttempt,
    true,
  )
  expectIssue(
    () =>
      consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease(
        controlled.runtime.privateWireRequestLease,
      ),
    'reader_reused',
  )

  let adversarialAssertions = 1
  const forgedReader = {
    ...createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
      async () => controlled.artifactPacket,
    ),
  }
  await expectAsyncIssue(
    async () => {
      const materialized = await materialize(recipe)
      await compileLivingFrameControlledSdxlGpuRuntimeRequest({
        serverOwnedArtifactLocatorId:
          'lf.gpu.fixture.forged-reader.v1',
        reader: forgedReader,
        materializationReceipt: materialized.receipt,
        privatePromptLease: materialized.privatePromptLease,
      })
    },
    'reader_invalid',
  )
  adversarialAssertions += 1

  const readerReuseMaterialization = await materialize(recipe)
  const readerReusePacket =
    artifactPacket(readerReuseMaterialization)
  const reusedReader =
    createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
      async () => readerReusePacket,
    )
  await compileLivingFrameControlledSdxlGpuRuntimeRequest({
    serverOwnedArtifactLocatorId:
      'lf.gpu.fixture.reader-reuse.v1',
    reader: reusedReader,
    materializationReceipt: readerReuseMaterialization.receipt,
    privatePromptLease:
      readerReuseMaterialization.privatePromptLease,
  })
  const readerReuseMaterializationTwo = await materialize(recipe)
  await expectAsyncIssue(
    () => compileLivingFrameControlledSdxlGpuRuntimeRequest({
      serverOwnedArtifactLocatorId:
        'lf.gpu.fixture.reader-reuse-2.v1',
      reader: reusedReader,
      materializationReceipt:
        readerReuseMaterializationTwo.receipt,
      privatePromptLease:
        readerReuseMaterializationTwo.privatePromptLease,
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  await expectMutation(
    recipe,
    (packet) => {
      packet.artifactPacketDigestSha256 = 'f'.repeat(64)
    },
    'digest_mismatch',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.materializationDigestSha256 = 'f'.repeat(64)
      refreshPacketDigest(packet)
    },
    'artifact_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.outputFrameExpectationDigestSha256 = 'f'.repeat(64)
      refreshPacketDigest(packet)
    },
    'artifact_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifactSetDigestSha256 = 'f'.repeat(64)
      refreshPacketDigest(packet)
    },
    'artifact_slot_set_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifacts.pop()
      refreshArtifactDigests(packet)
    },
    'artifact_slot_set_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifacts[1]!.order = 0
      refreshArtifactDigests(packet)
    },
    'private_alias_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifacts[0]!.slotKind =
        'reference_image_artifact'
      refreshArtifactDigests(packet)
    },
    'private_alias_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifacts[0]!.privateAlias =
        'wrong_model_private.safetensors'
      refreshArtifactDigests(packet)
    },
    'private_alias_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.artifacts[0]!.privateAlias =
        '../wrong_model_private.safetensors'
      refreshArtifactDigests(packet)
    },
    'artifact_packet_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.workerExpectation.cpuFallbackAllowed =
        true as false
      refreshPacketDigest(packet)
    },
    'artifact_packet_invalid',
  )
  adversarialAssertions += 1
  await expectMutation(
    recipe,
    (packet) => {
      packet.productionReady = true as false
      refreshPacketDigest(packet)
    },
    'artifact_packet_invalid',
  )
  adversarialAssertions += 1
  await expectPacketUnknownKey(recipe)
  adversarialAssertions += 1

  const digestTamper = structuredClone(receipt)
  ;(digestTamper as {
    requestReceiptDigestSha256: string
  }).requestReceiptDigestSha256 = 'f'.repeat(64)
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      digestTamper,
    ),
    false,
  )
  adversarialAssertions += 1
  const promoted = structuredClone(receipt)
  ;(promoted as {
    dispatchReady: boolean
    gpuAttemptCreated: boolean
    productionReady: boolean
  }).dispatchReady = true
  ;(promoted as {
    gpuAttemptCreated: boolean
  }).gpuAttemptCreated = true
  ;(promoted as {
    productionReady: boolean
  }).productionReady = true
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      promoted,
    ),
    false,
  )
  adversarialAssertions += 1
  const rawPromptLeak = structuredClone(receipt) as unknown as
    Record<string, unknown>
  rawPromptLeak.prompt = { secret: 'should-not-appear' }
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      rawPromptLeak,
    ),
    false,
  )
  adversarialAssertions += 1
  const costInjection = structuredClone(receipt) as unknown as
    Record<string, unknown>
  costInjection.costMicros = 123
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      costInjection,
    ),
    false,
  )
  adversarialAssertions += 1
  const reversedArtifacts = structuredClone(receipt)
  ;(reversedArtifacts as unknown as {
    requestSummary: {
      artifactReceipts: unknown[]
    }
  }).requestSummary.artifactReceipts.reverse()
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      reversedArtifacts,
    ),
    false,
  )
  adversarialAssertions += 1
  const callerPacketAttempt = await materialize(recipe)
  await expectAsyncIssue(
    () => compileLivingFrameControlledSdxlGpuRuntimeRequest({
      serverOwnedArtifactLocatorId:
        'lf.gpu.fixture.caller-packet.v1',
      reader: null,
      materializationReceipt: callerPacketAttempt.receipt,
      privatePromptLease:
        callerPacketAttempt.privatePromptLease,
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 21)
  process.stdout.write(JSON.stringify({
    status: 'passed',
    controlledFixtures: 1,
    adversarialAssertions,
    caseId: receipt.caseId,
    promptNodeCount: receipt.requestSummary.promptNodeCount,
    modelArtifactCount:
      receipt.requestSummary.modelArtifactCount,
    inputImageArtifactCount:
      receipt.requestSummary.inputImageArtifactCount,
    sharedGpuAttemptCountPerWireRequest: 1,
    gpuCapabilitiesSharingAttempt: 5,
    auraFaceCpuMeasurementExcluded: true,
    creditsRoundOnceAfterBundleAggregation: true,
    gpuAttemptCreated: false,
    actualAttemptCostEvidenceCreated: false,
    dispatchReady: false,
    productionReady: false,
  }, null, 2))
  process.stdout.write('\n')
}

async function createCombinedRecipe():
  Promise<LivingFrameControlledSdxlBenchmarkGraphRecipe> {
  const benchmarkSpecificationInput = {
    specificationId: 'spec.sdxl.gpu-protocol.001',
    candidateSet:
      controlledSdxlArtifactCandidateSetSmokeFixture.candidateSet,
    candidateSetInput:
      controlledSdxlArtifactCandidateSetSmokeFixture.input,
  }
  const benchmarkSpecification =
    await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
      benchmarkSpecificationInput,
    )
  const benchmarkAdmissionAuditInput = {
    auditId: 'audit.sdxl.gpu-protocol.001',
    benchmarkSpecification,
    benchmarkSpecificationInput,
    exactArtifactEvidence: {
      state: 'not_injected',
    } as const,
  }
  const benchmarkAdmissionAudit =
    await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
      benchmarkAdmissionAuditInput,
    )
  const requestBlueprintInput = {
    blueprintId: 'blueprint.sdxl.gpu-protocol.001',
    benchmarkSpecification,
    benchmarkSpecificationInput,
    benchmarkAdmissionAudit,
    benchmarkAdmissionAuditInput,
  }
  const requestBlueprint =
    await createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
      requestBlueprintInput,
    )
  const graphBlueprint =
    await createLivingFrameControlledSdxlBenchmarkGraphBlueprint({
      graphBlueprintId: 'graph.sdxl.gpu-protocol.001',
      requestBlueprint,
      requestBlueprintInput,
    })
  const recipe = graphBlueprint.recipes.find((entry) =>
    entry.caseId === 'full_combined_primary')
  assert(recipe)
  return recipe
}

async function materialize(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
): Promise<
  LivingFrameControlledSdxlPrivatePromptMaterializationResult
> {
  const resolvedSlots = recipe.graph.referencedSlotKinds.map(
    (slotKind, order) => ({
      order,
      slotKind,
      valueClass: slotKind.includes('conditioning_text')
        ? 'private_conditioning_text' as const
        : slotKind.includes('image_artifact')
          ? 'private_image_alias' as const
          : 'private_model_alias' as const,
      value: SLOT_VALUES[slotKind],
    }),
  )
  const packet:
    LivingFrameControlledSdxlPrivatePromptPacket = {
      graphBlueprintId: 'graph.sdxl.gpu-protocol.001',
      graphBlueprintDigestSha256: digest('graph'),
      outputFrameExpectationDigestSha256: digest('frame'),
      graphRecipe: recipe,
      resolvedSlots,
    }
  return materializeLivingFrameControlledSdxlPrivatePrompt({
    serverOwnedLocatorId:
      'lf.prompt.gpu-protocol.fixture.v1',
    reader: createLivingFrameControlledSdxlPrivatePromptReader(
      async () => packet,
    ),
  })
}

async function compileControlled(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
) {
  const materialization = await materialize(recipe)
  const packet = artifactPacket(materialization)
  const runtime =
    await compileLivingFrameControlledSdxlGpuRuntimeRequest({
      serverOwnedArtifactLocatorId:
        'lf.gpu-artifacts.fixture.v1',
      reader:
        createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
          async () => packet,
        ),
      materializationReceipt: materialization.receipt,
      privatePromptLease:
        materialization.privatePromptLease,
    })
  return { materialization, artifactPacket: packet, runtime }
}

function artifactPacket(
  materialization:
    LivingFrameControlledSdxlPrivatePromptMaterializationResult,
): LivingFrameControlledSdxlGpuRuntimeArtifactPacket {
  const artifacts =
    materialization.receipt.privatePrompt.slotReceipts
      .filter((slot) =>
        slot.valueClass !== 'private_conditioning_text')
      .map((slot, order):
        LivingFrameControlledSdxlGpuRuntimePrivateArtifact => {
        const alias = SLOT_VALUES[slot.slotKind]
        return {
          order,
          slotKind: slot.slotKind,
          artifactClass:
            slot.valueClass === 'private_model_alias'
              ? 'canonical_model_artifact'
              : 'private_input_image_artifact',
          artifactRecordId:
            `artifact.${slot.slotKind}.fixture.v1`,
          artifactContentSha256:
            digest(`content:${slot.slotKind}`),
          artifactByteLength:
            slot.valueClass === 'private_model_alias'
              ? 1_000_000_000 + order
              : 50_000 + order,
          artifactSourceBindingDigestSha256:
            digest(`source:${slot.slotKind}`),
          privateAlias: alias,
          readOnlyMountRequired: true,
        }
      })
  const draft = {
    sourceAuthority:
      'controlled_living_frame_gpu_artifact_fixture_reader' as const,
    evidenceClass:
      'controlled_non_promotable_gpu_runtime_artifact_packet' as const,
    materializationDigestSha256:
      materialization.receipt.materializationDigestSha256,
    outputFrameExpectationDigestSha256:
      materialization.receipt.sourceBindings
        .outputFrameExpectationDigestSha256,
    artifactSetDigestSha256: digest(artifacts),
    artifacts,
    workerExpectation: {
      runtimeRegion: 'europe-west1' as const,
      accelerator: 'nvidia_l4' as const,
      gpuCount: 1 as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    callerBytesPathUrlOrCredentialAccepted: false as const,
    dispatchAuthority: false as const,
    actualCostAuthority: false as const,
    productionReady: false as const,
  }
  return {
    ...draft,
    artifactPacketDigestSha256: digest(draft),
  }
}

type MutableArtifactPacket = {
  -readonly [Key in keyof
    LivingFrameControlledSdxlGpuRuntimeArtifactPacket]:
      Key extends 'artifacts'
        ? MutableArtifact[]
        : Key extends 'workerExpectation'
          ? {
              -readonly [WorkerKey in keyof
                LivingFrameControlledSdxlGpuRuntimeArtifactPacket[
                  'workerExpectation'
                ]]:
                LivingFrameControlledSdxlGpuRuntimeArtifactPacket[
                  'workerExpectation'
                ][WorkerKey]
            }
          : LivingFrameControlledSdxlGpuRuntimeArtifactPacket[Key]
}

type MutableArtifact = {
  -readonly [Key in keyof
    LivingFrameControlledSdxlGpuRuntimePrivateArtifact]:
      LivingFrameControlledSdxlGpuRuntimePrivateArtifact[Key]
}

async function expectMutation(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
  mutate: (packet: MutableArtifactPacket) => void,
  expectedCode: string,
): Promise<void> {
  const materialization = await materialize(recipe)
  const packet = structuredClone(
    artifactPacket(materialization),
  ) as MutableArtifactPacket
  mutate(packet)
  await expectAsyncIssue(
    () => compileLivingFrameControlledSdxlGpuRuntimeRequest({
      serverOwnedArtifactLocatorId:
        'lf.gpu.fixture.adversarial.v1',
      reader:
        createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
          async () => packet,
        ),
      materializationReceipt: materialization.receipt,
      privatePromptLease:
        materialization.privatePromptLease,
    }),
    expectedCode,
  )
}

async function expectPacketUnknownKey(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
): Promise<void> {
  const materialization = await materialize(recipe)
  const packet = artifactPacket(materialization) as unknown as
    Record<string, unknown>
  packet.providerId = 'forbidden-provider'
  await expectAsyncIssue(
    () => compileLivingFrameControlledSdxlGpuRuntimeRequest({
      serverOwnedArtifactLocatorId:
        'lf.gpu.fixture.unknown-key.v1',
      reader:
        createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
          async () => packet,
        ),
      materializationReceipt: materialization.receipt,
      privatePromptLease:
        materialization.privatePromptLease,
    }),
    'artifact_packet_invalid',
  )
}

function refreshArtifactDigests(packet: MutableArtifactPacket): void {
  packet.artifactSetDigestSha256 = digest(packet.artifacts)
  refreshPacketDigest(packet)
}

function refreshPacketDigest(packet: MutableArtifactPacket): void {
  const {
    artifactPacketDigestSha256: _omitted,
    ...draft
  } = packet
  void _omitted
  packet.artifactPacketDigestSha256 = digest(draft)
}

function expectIssue(
  action: () => unknown,
  expectedCode: string,
): void {
  let thrown: unknown
  try {
    action()
  } catch (error) {
    thrown = error
  }
  assert(thrown instanceof
    LivingFrameControlledSdxlGpuRuntimeProtocolError)
  assert.equal(thrown.issues[0]?.code, expectedCode)
}

async function expectAsyncIssue(
  action: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  let thrown: unknown
  try {
    await action()
  } catch (error) {
    thrown = error
  }
  assert(thrown instanceof
    LivingFrameControlledSdxlGpuRuntimeProtocolError)
  assert.equal(thrown.issues[0]?.code, expectedCode)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

await main()
