import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import type {
  LivingFrameControlledSdxlBenchmarkGraphRecipe,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
  canonicalPrivateToolDispatchConsumptionResponseSchema,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
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
  createLivingFrameControlledSdxlGpuRuntimeArtifactReader,
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
  consumeLivingFrameControlledSdxlComfyUiOutputLease,
  executeLivingFrameControlledSdxlComfyUiHostRuntime,
  LivingFrameControlledSdxlComfyUiHostRuntimeError,
  verifyLivingFrameControlledSdxlComfyUiHostRuntimeReceipt,
} from '../living-frame/living-frame-controlled-sdxl-comfyui-host-runtime'
import {
  createControlledLivingFrameComfyUiHostFixturePort,
} from '../living-frame/living-frame-controlled-sdxl-comfyui-loopback-host-port'
import {
  createLivingFrameComfyUiControlledProcessFixturePort,
  executeSupervisedLivingFrameControlledSdxlComfyUiHostRuntime,
  fixedLivingFrameComfyUiLaunchSpec,
  verifyLivingFrameComfyUiProcessSupervisorReceipt,
} from '../living-frame/living-frame-controlled-sdxl-comfyui-process-supervisor'
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
  lora_adapter_artifact:
    'editorial_style_private.safetensors',
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

const STARTED_AT = '2026-07-29T12:00:00.000Z'
const FINISHED_AT = '2026-07-29T12:00:08.250Z'

async function main(): Promise<void> {
  const recipe = await createCombinedRecipe()
  const png = await createPng(1024, 1024)
  const controlled = await compileControlled(recipe)
  const supervised =
    await executeSupervisedLivingFrameControlledSdxlComfyUiHostRuntime({
      processPort: controlledProcessPort(),
      hostRuntimeInput: {
        gpuRuntimeRequestReceipt: controlled.receipt,
        privateWireRequestLease:
          controlled.privateWireRequestLease,
        canonicalDispatchConsumption:
          canonicalDispatchConsumption(),
        hostPort: completedFixturePort(png),
      },
    })
  const completed = supervised.hostRuntime

  assert.equal(
    verifyLivingFrameControlledSdxlComfyUiHostRuntimeReceipt(
      completed.receipt,
    ),
    true,
  )
  assert.equal(
    verifyLivingFrameComfyUiProcessSupervisorReceipt(
      supervised.processLifecycle,
    ),
    true,
  )
  assert.equal(
    supervised.processLifecycle.oneProcessPerAttempt,
    true,
  )
  assert.equal(
    supervised.processLifecycle.actualCostEvidenceCreated,
    false,
  )
  assert.equal(
    supervised.processLifecycle.customerChargeCreated,
    false,
  )
  assert.equal(
    fixedLivingFrameComfyUiLaunchSpec().listenAddress,
    '127.0.0.1',
  )
  assert.equal(
    fixedLivingFrameComfyUiLaunchSpec()
      .arguments.join(' ').includes('0.0.0.0'),
    false,
  )
  assert.equal(
    completed.receipt.hostObservation.terminalState,
    'completed',
  )
  assert.equal(
    completed.receipt.hostObservation.modelInferenceExecuted,
    false,
    'Controlled fixture output cannot self-promote into model inference.',
  )
  assert.equal(
    completed.receipt.operation
      .fiveGpuCapabilitiesShareOneAttempt,
    true,
  )
  assert.equal(
    completed.receipt.operation.separateAuraFaceCpuQaExcluded,
    true,
  )
  assert.equal(completed.receipt.actualCostEvidenceCreated, false)
  assert.equal(completed.receipt.customerChargeCreated, false)
  assert.equal(
    completed.receipt.output?.opaqueGenerationOutputOnly,
    true,
  )
  assert.equal(
    completed.receipt.output
      ?.transparentBackgroundClaimAccepted,
    false,
  )
  assert.equal(
    completed.receipt.output?.trueAlphaArtifactCreated,
    false,
  )
  const serializedReceipt = JSON.stringify(completed.receipt)
  for (const forbidden of [
    SLOT_VALUES.base_checkpoint_artifact,
    SLOT_VALUES.positive_conditioning_text,
    SLOT_VALUES.reference_image_artifact,
    '127.0.0.1',
    'http://',
    'ws://',
    'prompt.fixture.001',
  ]) {
    assert.equal(serializedReceipt.includes(forbidden), false)
  }
  assert(completed.outputLease)
  const leasedBytes =
    consumeLivingFrameControlledSdxlComfyUiOutputLease(
      completed.outputLease,
    )
  assert.equal(digestBytes(leasedBytes), digestBytes(png))
  expectIssue(
    () => consumeLivingFrameControlledSdxlComfyUiOutputLease(
      completed.outputLease!,
    ),
    'host_port_invalid',
  )

  let adversarialAssertions = 1
  const {
    receiptDigestSha256: _processPromotionDigest,
    ...processPromotionDraft
  } = structuredClone(supervised.processLifecycle)
  void _processPromotionDigest
  const forgedProcessPromotion = {
    ...processPromotionDraft,
    runtimeAuthority: true,
    productionAuthority: true,
    productionReady: true,
  }
  assert.equal(
    verifyLivingFrameComfyUiProcessSupervisorReceipt({
      ...forgedProcessPromotion,
      receiptDigestSha256: digest(forgedProcessPromotion),
    }),
    false,
  )
  adversarialAssertions += 1

  const {
    runtimeObservationDigestSha256: _unknownKeyDigest,
    ...unknownKeyDraft
  } = structuredClone(completed.receipt)
  void _unknownKeyDigest
  const forgedUnknownKey = {
    ...unknownKeyDraft,
    providerId: 'forbidden-provider',
  }
  assert.equal(
    verifyLivingFrameControlledSdxlComfyUiHostRuntimeReceipt({
      ...forgedUnknownKey,
      runtimeObservationDigestSha256: digest(forgedUnknownKey),
    }),
    false,
  )
  adversarialAssertions += 1

  const {
    runtimeObservationDigestSha256: _promotionDigest,
    ...promotionDraft
  } = structuredClone(completed.receipt)
  void _promotionDigest
  const forgedPromotion = {
    ...promotionDraft,
    authorityBoundary: {
      ...promotionDraft.authorityBoundary,
      runtimeAuthority: true,
      productionAuthority: true,
    },
    productionReady: true,
  }
  assert.equal(
    verifyLivingFrameControlledSdxlComfyUiHostRuntimeReceipt({
      ...forgedPromotion,
      runtimeObservationDigestSha256: digest(forgedPromotion),
    }),
    false,
  )
  adversarialAssertions += 1

  const forgedHostControlled = await compileControlled(recipe)
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: forgedHostControlled.receipt,
      privateWireRequestLease:
        forgedHostControlled.privateWireRequestLease,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      hostPort: {
        ...completedFixturePort(png),
      },
    }),
    'host_port_invalid',
  )
  adversarialAssertions += 1

  const badHashControlled = await compileControlled(recipe)
  const badHash = {
    ...canonicalDispatchConsumption(),
    responseHash: 'f'.repeat(64),
  }
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: badHashControlled.receipt,
      privateWireRequestLease:
        badHashControlled.privateWireRequestLease,
      canonicalDispatchConsumption: badHash,
      hostPort: completedFixturePort(png),
    }),
    'canonical_dispatch_invalid',
  )
  adversarialAssertions += 1

  const replayControlled = await compileControlled(recipe)
  const replayDraft = {
    ...canonicalDispatchConsumption(),
    consumptionReplayed: true,
    executionAuthority: {
      ...canonicalDispatchConsumption().executionAuthority,
      newExecutionStartAuthorized: false,
      resumeSameIdempotentAttemptOnly: true,
      toolExecutionAuthorized: false,
    },
  }
  const {
    responseHash: _replayHash,
    ...replayWithoutHash
  } = replayDraft
  void _replayHash
  const replay = {
    ...replayWithoutHash,
    responseHash: sha256AuthorityValue(replayWithoutHash),
  }
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: replayControlled.receipt,
      privateWireRequestLease:
        replayControlled.privateWireRequestLease,
      canonicalDispatchConsumption: replay,
      hostPort: completedFixturePort(png),
    }),
    'canonical_dispatch_replay_forbidden',
  )
  adversarialAssertions += 1

  const wrongOperationControlled = await compileControlled(recipe)
  const operationDraft = {
    ...canonicalDispatchConsumption(),
    grant: {
      ...canonicalDispatchConsumption().grant,
      binding: {
        ...canonicalDispatchConsumption().grant.binding,
        canonicalToolId: 'remotion',
        operationId:
          'tool.remotion.render_approved_composition.v1',
      },
    },
  }
  const {
    responseHash: _operationHash,
    ...operationWithoutHash
  } = operationDraft
  void _operationHash
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt:
        wrongOperationControlled.receipt,
      privateWireRequestLease:
        wrongOperationControlled.privateWireRequestLease,
      canonicalDispatchConsumption: {
        ...operationWithoutHash,
        responseHash: sha256AuthorityValue(
          operationWithoutHash,
        ),
      },
      hostPort: completedFixturePort(png),
    }),
    'canonical_operation_mismatch',
  )
  adversarialAssertions += 1

  const wrongDimensionsControlled =
    await compileControlled(recipe)
  const wrongDimensionsPng = await createPng(512, 512)
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt:
        wrongDimensionsControlled.receipt,
      privateWireRequestLease:
        wrongDimensionsControlled.privateWireRequestLease,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      hostPort: completedFixturePort(wrongDimensionsPng),
    }),
    'output_image_invalid',
  )
  adversarialAssertions += 1

  const extraOutputControlled = await compileControlled(recipe)
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: extraOutputControlled.receipt,
      privateWireRequestLease:
        extraOutputControlled.privateWireRequestLease,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      hostPort: createControlledLivingFrameComfyUiHostFixturePort(
        async () => ({
          evidenceClass:
            'controlled_non_promotable_comfyui_host_runtime_fixture',
          terminalState: 'completed',
          failureCode: 'none',
          promptAccepted: true,
          modelInferenceExecuted: false,
          startedAt: STARTED_AT,
          finishedAt: FINISHED_AT,
          privatePromptId: 'prompt.fixture.002',
          outputPngBytes: png,
          outputImageCount: 2,
          externalNetworkPerformed: false,
          runtimeDownloadPerformed: false,
        }),
      ),
    }),
    'host_execution_result_invalid',
  )
  adversarialAssertions += 1

  const failedControlled = await compileControlled(recipe)
  const failed =
    await executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: failedControlled.receipt,
      privateWireRequestLease:
        failedControlled.privateWireRequestLease,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      hostPort: terminalFixturePort(
        'failed',
        'host_execution_failed',
      ),
    })
  assert.equal(failed.receipt.outputLeaseIssued, false)
  assert.equal(failed.outputLease, undefined)
  assert.equal(failed.receipt.actualCostEvidenceCreated, false)
  adversarialAssertions += 1

  const unknownControlled = await compileControlled(recipe)
  const unknown =
    await executeLivingFrameControlledSdxlComfyUiHostRuntime({
      gpuRuntimeRequestReceipt: unknownControlled.receipt,
      privateWireRequestLease:
        unknownControlled.privateWireRequestLease,
      canonicalDispatchConsumption:
        canonicalDispatchConsumption(),
      hostPort: terminalFixturePort(
        'outcome_unknown',
        'host_timeout',
      ),
    })
  assert.equal(
    unknown.receipt.hostObservation.terminalState,
    'outcome_unknown',
  )
  assert.equal(unknown.receipt.outputLeaseIssued, false)
  assert.equal(unknown.receipt.customerChargeCreated, false)
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 12)
  process.stdout.write(JSON.stringify({
    status: 'passed',
    controlledFixtures: 3,
    adversarialAssertions,
    fixedLoopbackTransportImplemented: true,
    fixedProcessSupervisorImplemented: true,
    oneProcessPerAttempt: true,
    canonicalDispatchRequired: true,
    oneGpuAttemptForFiveCapabilities: true,
    separateAuraFaceCpuQa: true,
    opaqueOutputOnly: true,
    actualCostEvidenceCreatedByHost: false,
    customerChargeCreatedByHost: false,
    runtimeRegistered: false,
    productionReady: false,
  }, null, 2))
  process.stdout.write('\n')
}

function controlledProcessPort() {
  const empty = createHash('sha256').update('').digest('hex')
  return createLivingFrameComfyUiControlledProcessFixturePort(
    async () => ({
      handleClass:
        'process_bound_single_use_comfyui_process_handle_v1',
      evidenceClass:
        'controlled_non_promotable_process_fixture',
      startedAt: STARTED_AT,
      callerCommandAccepted: false,
      callerArgumentsAccepted: false,
      callerEnvironmentAccepted: false,
      callerPathUrlCredentialAccepted: false,
      externalListenAllowed: false,
      runtimeDownloadsAllowed: false,
      productionQualified: false,
      async waitUntilReady() {
        return {
          readyAt: '2026-07-29T12:00:00.250Z',
          loopbackOnly: true as const,
          fixedPort: 8188 as const,
          externalNetworkPerformed: false as const,
          runtimeDownloadPerformed: false as const,
        }
      },
      async stop() {
        return {
          exitCode: 0,
          signal: null,
          timedOut: false,
          captureExceeded: false,
          stdoutByteLength: 0,
          stdoutSha256: empty,
          stderrByteLength: 0,
          stderrSha256: empty,
        }
      },
    }),
  )
}

function completedFixturePort(png: Uint8Array) {
  return createControlledLivingFrameComfyUiHostFixturePort(
    async () => ({
      evidenceClass:
        'controlled_non_promotable_comfyui_host_runtime_fixture',
      terminalState: 'completed',
      failureCode: 'none',
      promptAccepted: true,
      modelInferenceExecuted: false,
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      privatePromptId: 'prompt.fixture.001',
      outputPngBytes: png,
      outputImageCount: 1,
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
    }),
  )
}

function terminalFixturePort(
  terminalState: 'failed' | 'outcome_unknown',
  failureCode: 'host_execution_failed' | 'host_timeout',
) {
  return createControlledLivingFrameComfyUiHostFixturePort(
    async () => ({
      evidenceClass:
        'controlled_non_promotable_comfyui_host_runtime_fixture',
      terminalState,
      failureCode,
      promptAccepted: true,
      modelInferenceExecuted: false,
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      privatePromptId: 'prompt.fixture.terminal',
      outputImageCount: 0,
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
    }),
  )
}

async function createPng(
  width: number,
  height: number,
): Promise<Uint8Array> {
  const scanlines = Buffer.alloc(height * (1 + width * 3))
  for (let row = 0; row < height; row += 1) {
    const rowStart = row * (1 + width * 3)
    scanlines[rowStart] = 0
    for (let column = 0; column < width; column += 1) {
      const pixel = rowStart + 1 + column * 3
      scanlines[pixel] = 24
      scanlines[pixel + 1] = 38
      scanlines[pixel + 2] = 62
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  header[10] = 0
  header[11] = 0
  header[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.byteLength, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, Buffer.from(data)])),
    0,
  )
  return Buffer.concat([length, typeBytes, Buffer.from(data), crc])
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (
        (crc & 1) !== 0 ? 0xedb88320 : 0
      )
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

async function createCombinedRecipe():
  Promise<LivingFrameControlledSdxlBenchmarkGraphRecipe> {
  const benchmarkSpecificationInput = {
    specificationId: 'spec.sdxl.comfy-host.001',
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
    auditId: 'audit.sdxl.comfy-host.001',
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
    blueprintId: 'blueprint.sdxl.comfy-host.001',
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
      graphBlueprintId: 'graph.sdxl.comfy-host.001',
      requestBlueprint,
      requestBlueprintInput,
    })
  const recipe = graphBlueprint.recipes.find((entry) =>
    entry.caseId === 'full_combined_primary')
  assert(recipe)
  return recipe
}

async function compileControlled(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
) {
  const materialization = await materialize(recipe)
  return compileLivingFrameControlledSdxlGpuRuntimeRequest({
    serverOwnedArtifactLocatorId:
      'lf.gpu-artifacts.comfy-host.fixture.v1',
    reader:
      createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
        async () => artifactPacket(materialization),
      ),
    materializationReceipt: materialization.receipt,
    privatePromptLease:
      materialization.privatePromptLease,
  })
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
      graphBlueprintId: 'graph.sdxl.comfy-host.001',
      graphBlueprintDigestSha256: digest('graph'),
      outputFrameExpectationDigestSha256: digest('frame'),
      graphRecipe: recipe,
      resolvedSlots,
    }
  return materializeLivingFrameControlledSdxlPrivatePrompt({
    serverOwnedLocatorId:
      'lf.prompt.comfy-host.fixture.v1',
    reader: createLivingFrameControlledSdxlPrivatePromptReader(
      async () => packet,
    ),
  })
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
        LivingFrameControlledSdxlGpuRuntimePrivateArtifact => ({
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
          privateAlias: SLOT_VALUES[slot.slotKind],
          readOnlyMountRequired: true,
        }))
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

function canonicalDispatchConsumption() {
  const timestamp = '2026-07-29T11:59:00.000Z'
  const responseWithoutHash = {
    schemaVersion:
      CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose:
      'private_internal_canonical_tool_dispatch_consume' as const,
    consumed: true as const,
    consumedAt: timestamp,
    executionAttemptId: 'attempt.lf.comfy.fixture.001',
    consumptionReplayed: false,
    grant: {
      grantId: 'attempt.lf.comfy.fixture.001',
      status: 'consumed' as const,
      binding: {
        workspaceId: 'workspace.lf.fixture',
        projectId: 'project.lf.fixture',
        editSessionId: 'edit.lf.fixture',
        jobId: 'job.lf.comfy.fixture',
        approvedPlanSnapshotId: 'snapshot.lf.fixture',
        approvedWorkItemId: 'work.lf.comfy.fixture',
        expectedAssetId: 'asset.lf.comfy.fixture',
        requestedToolName: 'ComfyUI',
        canonicalToolId: 'comfyui',
        operationId:
          'tool.comfyui.generate_controlled_image.v1',
        leaseId: 'lease.lf.comfy.fixture',
        leaseAttemptNumber: 1,
        leaseImmutableHash: digest('lease'),
        leaseDependencyAuthority: {
          state: 'not_required_for_root_job' as const,
          readinessHash: digest('readiness'),
          authorityHash: digest('dependency-authority'),
          selectedArtifactsHash: digest([]),
          selectedArtifactCount: 0,
          liveRuntimeEligible: false as const,
        },
        leaseExecutionFenceState: 'not_started' as const,
        reservationId: 'reservation.lf.fixture',
        maximumCreditBudget: 10,
        remainingReservedCreditsAtDecision: 10,
        expectedOutput: {
          outputKey: 'controlled_illustration',
          artifactType: 'generated_image',
          assetRole: 'generated' as const,
          required: true,
          previewPlaceholderAllowed: false,
          contentType: 'image/png',
          segmentIds: ['segment.lf.fixture'],
          timingIds: ['timing.lf.fixture'],
          rendererLayerIds: ['layer.lf.fixture'],
        },
      },
      issuedAt: timestamp,
      expiresAt: '2026-07-29T12:05:00.000Z',
      immutableGrantHash: digest('grant'),
      singleUse: true as const,
      credentialReturned: false as const,
    },
    verificationEvidence: {
      tenantAndCanonicalAuthority: 'passed' as const,
      activeOpaqueLease: 'passed' as const,
      timingSafeDispatchCredentialMatch: 'passed' as const,
      immutableGrantHash: 'passed' as const,
      exactWorkItemOutputToolOperation: 'passed' as const,
      fundedReservationAndBudget: 'passed' as const,
      toolOperationSpecHash: 'passed' as const,
      runtimeEvidenceAuthorityHash: 'passed' as const,
      runtimeEvidenceRecordHash: 'passed' as const,
      privateRuntimeAuthorityHash: 'passed' as const,
      privateRuntimeImageIdentityHash: 'passed' as const,
      privateInternalReadiness: 'passed' as const,
      leaseDependencyAuthorityBinding: 'passed' as const,
      leaseExecutionFenceNotStarted: 'passed' as const,
      atomicSingleUseTransition: 'passed' as const,
      leaseCredentialReturned: false as const,
      dispatchCredentialReturned: false as const,
      credentialHashReturned: false as const,
    },
    executionAuthority: {
      dispatchGrantConsumed: true as const,
      newExecutionStartAuthorized: true,
      resumeSameIdempotentAttemptOnly: false,
      toolExecutionAuthorized: true,
      executionAttemptId: 'attempt.lf.comfy.fixture.001',
      outputPromotionRequiresCreateOnlyAttemptId: true as const,
      costEventRequiresSameIdempotentAttemptId: true as const,
      providerCallAuthorized: false as const,
      sourceObjectReadAuthorized: false as const,
      artifactWriteAuthorized: false as const,
      renderAuthorized: false as const,
      privatePreviewRenderAuthorized: false,
      privateCaptionRenderAuthorized: false,
      privateFinalCompositionAuthorized: false,
      privateCompositionChunkAuthorized: false,
      creditSpendAuthorized: false as const,
      walletMutationAuthorized: false as const,
      settlementAuthorized: false as const,
      toolExecutionPerformedByConsume: false as const,
    },
    testOnly: true as const,
  }
  return canonicalPrivateToolDispatchConsumptionResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
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
  assert(
    thrown instanceof
      LivingFrameControlledSdxlComfyUiHostRuntimeError,
  )
  assert.equal(thrown.code, expectedCode)
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
  assert(
    thrown instanceof
      LivingFrameControlledSdxlComfyUiHostRuntimeError,
  )
  assert.equal(thrown.code, expectedCode)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

void main()
