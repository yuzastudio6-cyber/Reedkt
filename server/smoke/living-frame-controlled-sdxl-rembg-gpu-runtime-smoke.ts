import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import {
  consumeLivingFrameControlledSdxlRembgAlphaOutputLease,
  executeLivingFrameControlledSdxlRembgAlphaBridge,
  LivingFrameControlledSdxlRembgAlphaBridgeError,
  verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt,
} from '../living-frame/living-frame-controlled-sdxl-rembg-alpha-bridge'
import {
  createLivingFrameControlledSdxlRembgInputBinding,
  createLivingFrameControlledSdxlRembgInputConsumer,
  createLivingFrameControlledSdxlRembgPrivateInputReader,
  type LivingFrameControlledSdxlRembgPrivateInputPacket,
} from '../living-frame/living-frame-controlled-sdxl-rembg-input-binding'
import {
  createLivingFrameControlledSdxlRembgGpuSourceReader,
  executeLivingFrameControlledSdxlRembgGpuRuntime,
  registerLivingFrameControlledSdxlRembgGpuHostPort,
  registerLivingFrameControlledSdxlRembgGpuModelMountPort,
  consumeLivingFrameControlledSdxlRembgAlphaSourceLease,
  consumeLivingFrameControlledSdxlRembgGpuMaskLease,
  LivingFrameControlledSdxlRembgGpuRuntimeError,
  verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt,
  type LivingFrameControlledSdxlRembgGpuHostExecutionResult,
  type LivingFrameControlledSdxlRembgGpuHostPort,
  type LivingFrameControlledSdxlRembgGpuModelMountObservation,
  type LivingFrameControlledSdxlRembgGpuSourcePacket,
} from '../living-frame/living-frame-controlled-sdxl-rembg-gpu-runtime'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
  type LivingFrameControlledSdxlGpuOutputObservation,
  type LivingFrameControlledSdxlGpuOutputObservationDraft,
} from '../../src/types/living-frame-controlled-sdxl-gpu-output-observation'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
  canonicalPrivateToolDispatchConsumptionResponseSchema,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createPrivateOfflineSharpStructuredExecutionRuntime,
} from '../tool-execution/node-runner-execution'

const WIDTH = 1024
const HEIGHT = 1024
const PIXEL_COUNT = WIDTH * HEIGHT
const RGBA_BYTE_COUNT = PIXEL_COUNT * 4
const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const HASH_C = 'c'.repeat(64)
const HASH_D = 'd'.repeat(64)
const HASH_E = 'e'.repeat(64)
const HASH_F = 'f'.repeat(64)

async function main(): Promise<void> {
  const sourcePng = createOpaqueRgbaPng()
  const decodedRgba = createOpaqueRgba()
  const observation = observationFor(sourcePng, decodedRgba)
  const binding = await createBinding(
    observation,
    sourcePng,
    decodedRgba,
  )
  const maskPng = createGray8MaskPng()

  const happy = await executeLivingFrameControlledSdxlRembgGpuRuntime({
    rembgInputBinding: binding,
    sourceReader: sourceReaderFor(
      binding,
      sourcePng,
      decodedRgba,
    ),
    canonicalDispatchConsumption: canonicalDispatch(),
    modelMountPort: controlledMountPort(),
    hostPort: controlledHostPort(maskPng),
  })
  assert.equal(
    verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt(
      happy.receipt,
    ),
    true,
  )
  assert.equal(happy.receipt.hostObservation.terminalState, 'completed')
  assert.equal(
    happy.receipt.hostObservation.modelInferenceExecuted,
    false,
  )
  assert.equal(
    happy.receipt.costLineage.comfyuiGpuAttemptChargedAgain,
    false,
  )
  assert.equal(
    happy.receipt.costLineage.rembgIsSeparateCanonicalToolAttempt,
    true,
  )
  assert.equal(
    happy.receipt.costLineage
      .oneRuntimeInvocationRepresentsOneRembgAttempt,
    true,
  )
  assert.equal(happy.receipt.actualCostEvidenceCreated, false)
  assert.equal(happy.receipt.customerChargeCreated, false)
  assert.equal(happy.receipt.productionReady, false)
  assert(happy.maskLease)
  assert(happy.alphaSourceLease)
  const maskPayload =
    consumeLivingFrameControlledSdxlRembgGpuMaskLease(
      happy.maskLease,
    )
  const sourcePayload =
    consumeLivingFrameControlledSdxlRembgAlphaSourceLease(
      happy.alphaSourceLease,
    )
  assert.equal(maskPayload.maskPng.equals(maskPng), true)
  assert.equal(sourcePayload.sourcePng.equals(sourcePng), true)
  assert.equal(
    sourcePayload.decodedRgba.equals(decodedRgba),
    true,
  )
  expectSyncIssue(
    () => consumeLivingFrameControlledSdxlRembgGpuMaskLease(
      happy.maskLease!,
    ),
    'mask_lease_invalid',
  )
  expectSyncIssue(
    () => consumeLivingFrameControlledSdxlRembgAlphaSourceLease(
      happy.alphaSourceLease!,
    ),
    'alpha_source_lease_invalid',
  )

  let adversarialAssertions = 2
  const failed = await executeFixture({
    binding,
    sourcePng,
    decodedRgba,
    hostResult: {
      evidenceClass:
        'controlled_non_promotable_generated_still_rembg_gpu_fixture',
      terminalState: 'failed',
      failureCode: 'host_execution_failed',
      requestAccepted: true,
      modelInferenceExecuted: false,
      startedAt: '2026-07-29T12:00:00.000Z',
      finishedAt: '2026-07-29T12:00:01.000Z',
      maskOutputCount: 0,
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
      cpuFallbackPerformed: false,
    },
  })
  assert.equal(failed.receipt.maskOutputLeaseIssued, false)
  assert.equal(failed.maskLease, undefined)
  assert.equal(failed.receipt.costLineage
    .failedOrUnknownAttemptCostMustBeRetained, true)
  adversarialAssertions += 1

  const outcomeUnknown = await executeFixture({
    binding,
    sourcePng,
    decodedRgba,
    hostResult: {
      evidenceClass:
        'controlled_non_promotable_generated_still_rembg_gpu_fixture',
      terminalState: 'outcome_unknown',
      failureCode: 'host_outcome_unknown',
      requestAccepted: true,
      modelInferenceExecuted: false,
      startedAt: '2026-07-29T12:00:00.000Z',
      finishedAt: '2026-07-29T12:00:02.000Z',
      maskOutputCount: 0,
      externalNetworkPerformed: false,
      runtimeDownloadPerformed: false,
      cpuFallbackPerformed: false,
    },
  })
  assert.equal(
    outcomeUnknown.receipt.hostObservation.terminalState,
    'outcome_unknown',
  )
  assert.equal(
    outcomeUnknown.receipt.costLineage
      .failedOrUnknownAttemptCostMustBeRetained,
    true,
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(true),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng),
    }),
    'canonical_dispatch_replay_forbidden',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(
        false,
        'comfyui',
      ),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng),
    }),
    'canonical_operation_mismatch',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: {
        ...controlledMountPort(),
      },
      hostPort: controlledHostPort(maskPng),
    }),
    'model_mount_port_invalid',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort({
        contentSha256: HASH_A,
      }),
      hostPort: controlledHostPort(maskPng),
    }),
    'model_mount_binding_invalid',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng, {
        cpuFallbackPerformed: true,
      }),
    }),
    'host_result_invalid',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng, {
        externalNetworkPerformed: true,
      }),
    }),
    'host_result_invalid',
  )
  adversarialAssertions += 1

  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(
        Buffer.from('not-a-mask'),
      ),
    }),
    'mask_output_invalid',
  )
  adversarialAssertions += 1

  const allOpaqueMask = createGray8MaskPng(255)
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(allOpaqueMask),
    }),
    'mask_output_invalid',
  )
  adversarialAssertions += 1

  const wrongSource = Buffer.from(sourcePng)
  wrongSource[wrongSource.length - 1] ^= 1
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        wrongSource,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng),
    }),
    'source_bytes_invalid',
  )
  adversarialAssertions += 1

  const unregisteredSourceReader = {
    ...sourceReaderFor(binding, sourcePng, decodedRgba),
  }
  await expectAsyncIssue(
    () => executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: unregisteredSourceReader,
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng),
    }),
    'source_reader_invalid',
  )
  adversarialAssertions += 1

  const forgedReceipt = {
    ...happy.receipt,
    productionReady: true,
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt(
      forgedReceipt,
    ),
    false,
  )
  adversarialAssertions += 1
  assert.equal(adversarialAssertions, 15)

  const alphaReady =
    await executeLivingFrameControlledSdxlRembgGpuRuntime({
      rembgInputBinding: binding,
      sourceReader: sourceReaderFor(
        binding,
        sourcePng,
        decodedRgba,
      ),
      canonicalDispatchConsumption: canonicalDispatch(),
      modelMountPort: controlledMountPort(),
      hostPort: controlledHostPort(maskPng),
    })
  assert(alphaReady.maskLease)
  assert(alphaReady.alphaSourceLease)
  await expectAlphaIssue(
    () => executeLivingFrameControlledSdxlRembgAlphaBridge({
      rembgRuntimeReceipt: alphaReady.receipt,
      sourceLease: alphaReady.alphaSourceLease!,
      maskLease: alphaReady.maskLease!,
      sharpDispatchConsumption:
        canonicalDispatch(true, 'sharp'),
    }),
    'sharp_dispatch_replay_forbidden',
  )
  adversarialAssertions += 1
  await expectAlphaIssue(
    () => executeLivingFrameControlledSdxlRembgAlphaBridge({
      rembgRuntimeReceipt: alphaReady.receipt,
      sourceLease: alphaReady.alphaSourceLease!,
      maskLease: alphaReady.maskLease!,
      sharpDispatchConsumption:
        canonicalDispatch(false, 'comfyui'),
    }),
    'sharp_operation_mismatch',
  )
  adversarialAssertions += 1
  await createPrivateOfflineSharpStructuredExecutionRuntime()
  const alpha = await executeLivingFrameControlledSdxlRembgAlphaBridge({
    rembgRuntimeReceipt: alphaReady.receipt,
    sourceLease: alphaReady.alphaSourceLease,
    maskLease: alphaReady.maskLease,
    sharpDispatchConsumption:
      canonicalDispatch(false, 'sharp'),
  })
  assert.equal(
    verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt(
      alpha.receipt,
    ),
    true,
  )
  assert.equal(
    alpha.receipt.packageObservation.actualSharpPackageExecuted,
    true,
  )
  assert.equal(
    alpha.receipt.operation.alphaMode,
    'straight_alpha',
  )
  assert.equal(alpha.receipt.alphaQaPassed, false)
  assert.equal(
    alpha.receipt.costLineage.comfyuiGpuAttemptChargedAgain,
    false,
  )
  assert.equal(
    alpha.receipt.costLineage.rembgGpuAttemptChargedAgain,
    false,
  )
  assert.equal(
    alpha.receipt.costLineage
      .sharpUsesExistingDeterministicToolCostOwner,
    true,
  )
  const alphaPayload =
    consumeLivingFrameControlledSdxlRembgAlphaOutputLease(
      alpha.outputLease,
    )
  assert.equal(
    digestBytes(alphaPayload.alphaPng),
    alpha.receipt.alphaOutput.contentSha256,
  )
  assert.equal(
    digestBytes(alphaPayload.decodedRgba),
    alpha.receipt.alphaOutput.decodedRgbaSha256,
  )
  expectAlphaSyncIssue(
    () => consumeLivingFrameControlledSdxlRembgAlphaOutputLease(
      alpha.outputLease,
    ),
    'output_lease_invalid',
  )
  adversarialAssertions += 1
  assert.equal(
    verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt({
      ...alpha.receipt,
      productionReady: true,
    }),
    false,
  )
  adversarialAssertions += 1
  assert.equal(adversarialAssertions, 19)

  const serialized = JSON.stringify(happy.receipt)
  for (const forbidden of [
    '"sourcePng"',
    '"decodedRgba"',
    '"maskPngBytes"',
    'https://',
    'file://',
    '/tmp/',
    '"priceUsd"',
    '"customerCredits"',
    '"serviceFeeAmount"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }

  console.log(
    'Living Frame controlled SDXL rembg GPU runtime smoke passed: '
      + 'GPU mask plus actual Sharp straight-alpha output, '
      + 'failed/unknown cost retention, '
      + `${adversarialAssertions} adversarial assertions.`,
  )
}

async function executeFixture(input: {
  binding: Awaited<ReturnType<typeof createBinding>>
  sourcePng: Buffer
  decodedRgba: Buffer
  hostResult: LivingFrameControlledSdxlRembgGpuHostExecutionResult
}) {
  return executeLivingFrameControlledSdxlRembgGpuRuntime({
    rembgInputBinding: input.binding,
    sourceReader: sourceReaderFor(
      input.binding,
      input.sourcePng,
      input.decodedRgba,
    ),
    canonicalDispatchConsumption: canonicalDispatch(),
    modelMountPort: controlledMountPort(),
    hostPort: controlledHostPort(
      Buffer.alloc(0),
      { ...input.hostResult },
    ),
  })
}

function sourceReaderFor(
  binding: Awaited<ReturnType<typeof createBinding>>,
  sourcePng: Buffer,
  decodedRgba: Buffer,
) {
  return createLivingFrameControlledSdxlRembgGpuSourceReader({
    rembgInputBinding: binding,
    readServerOwnedGeneratedStill: async () => ({
      packetClass:
        'server_owned_verified_generated_still_runtime_source_v1',
      inputBindingId: binding.bindingId,
      inputBindingDigestSha256: binding.bindingDigestSha256,
      sourceArtifactId: binding.sourceBindings.outputArtifactId,
      sourceContentSha256:
        binding.verifiedOpaqueInput.contentSha256,
      sourceByteLength: sourcePng.byteLength,
      decodedRgbaSha256:
        binding.verifiedOpaqueInput.decodedRgbaSha256,
      outputFrameExpectationDigestSha256:
        binding.sourceBindings.outputFrameExpectationDigestSha256,
      sourcePng: Buffer.from(sourcePng),
      decodedRgba: Buffer.from(decodedRgba),
      callerBytesPathUrlOrCredentialAccepted: false,
      canonicalSourceVariantAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
    } satisfies LivingFrameControlledSdxlRembgGpuSourcePacket),
  })
}

function controlledMountPort(
  override: Record<string, unknown> = {},
) {
  return registerLivingFrameControlledSdxlRembgGpuModelMountPort({
    portClass:
      'controlled_fixture_u2netp_model_mount_port_v1',
    callerArtifactAccepted: false,
    callerPathUrlOrBytesAccepted: false,
    runtimeDownloadsAllowed: false,
    networkFetchAllowed: false,
    productionQualified: false,
    inspectExactMount: async () => ({
      evidenceClass:
        'controlled_non_promotable_u2netp_mount_fixture',
      slotId: 'rembg_u2netp_onnx',
      artifactId: 'rembg-u2netp-onnx',
      revision: 'rembg-v0.0.0-u2netp-309c8469258d',
      byteLength: 4_574_861,
      contentSha256:
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
      consumerScope: 'rembg.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      runtimeRegion: 'europe-west1',
      accelerator: 'nvidia_l4',
      device: 'cuda',
      readOnlyMountObserved: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
      cpuFallbackAllowed: false,
      modelBytesIncluded: false,
      mountPathIncluded: false,
      ...override,
    }) as LivingFrameControlledSdxlRembgGpuModelMountObservation,
  })
}

function controlledHostPort(
  maskPng: Buffer,
  override: Record<string, unknown> = {},
): LivingFrameControlledSdxlRembgGpuHostPort {
  return registerLivingFrameControlledSdxlRembgGpuHostPort({
    hostPortClass:
      'controlled_fixture_generated_still_rembg_gpu_host_port_v1',
    callerEndpointAccepted: false,
    callerPathUrlCredentialCommandAccepted: false,
    externalNetworkAllowed: false,
    runtimeDownloadsAllowed: false,
    cpuFallbackAllowed: false,
    productionQualified: false,
    executeOne: async () => {
      const result: Record<string, unknown> = {
        evidenceClass:
          'controlled_non_promotable_generated_still_rembg_gpu_fixture',
        terminalState: 'completed',
        failureCode: 'none',
        requestAccepted: true,
        modelInferenceExecuted: false,
        startedAt: '2026-07-29T12:00:00.000Z',
        finishedAt: '2026-07-29T12:00:01.000Z',
        maskPngBytes: Buffer.from(maskPng),
        maskOutputCount: 1,
        externalNetworkPerformed: false,
        runtimeDownloadPerformed: false,
        cpuFallbackPerformed: false,
        ...override,
      }
      if (result.terminalState !== 'completed') {
        delete result.maskPngBytes
      }
      return result as unknown as
        LivingFrameControlledSdxlRembgGpuHostExecutionResult
    },
  })
}

function canonicalDispatch(
  replayed = false,
  toolId: 'rembg' | 'comfyui' | 'sharp' = 'rembg',
) {
  const timestamp = '2026-07-29T11:59:00.000Z'
  const responseWithoutHash = {
    schemaVersion:
      CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose:
      'private_internal_canonical_tool_dispatch_consume' as const,
    consumed: true as const,
    consumedAt: timestamp,
    executionAttemptId: 'attempt.lf.rembg.fixture.001',
    consumptionReplayed: replayed,
    grant: {
      grantId: 'attempt.lf.rembg.fixture.001',
      status: 'consumed' as const,
      binding: {
        workspaceId: 'workspace.lf.fixture',
        projectId: 'project.lf.fixture',
        editSessionId: 'edit.lf.fixture',
        jobId: 'job.lf.rembg.fixture',
        approvedPlanSnapshotId: 'snapshot.lf.fixture',
        approvedWorkItemId: 'work.lf.rembg.fixture',
        expectedAssetId: 'asset.lf.rembg.mask.fixture',
        requestedToolName:
          toolId === 'rembg'
            ? 'rembg'
            : toolId === 'sharp'
              ? 'Sharp'
              : 'ComfyUI',
        canonicalToolId: toolId,
        operationId: toolId === 'rembg'
          ? 'tool.rembg.remove_image_background.v1'
          : toolId === 'sharp'
            ? 'tool.sharp.prepare_approved_image_asset.v1'
          : 'tool.comfyui.generate_controlled_image.v1',
        leaseId: 'lease.lf.rembg.fixture',
        leaseAttemptNumber: 1,
        leaseImmutableHash: digest('lease'),
        leaseDependencyAuthority: {
          state: 'private_test_dependencies_verified' as const,
          readinessHash: digest('readiness'),
          authorityHash: digest('dependency-authority'),
          selectedArtifactsHash: digest(['source']),
          selectedArtifactCount: 1,
          liveRuntimeEligible: false as const,
        },
        leaseExecutionFenceState: 'not_started' as const,
        reservationId: 'reservation.lf.fixture',
        maximumCreditBudget: 10,
        remainingReservedCreditsAtDecision: 10,
        expectedOutput: {
          outputKey: toolId === 'sharp'
            ? 'living-frame-alpha-component'
            : 'living-frame-alpha-mask',
          artifactType: toolId === 'sharp'
            ? 'living_frame_component_rgba_png'
            : 'living_frame_alpha_mask_png',
          assetRole: 'processed' as const,
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
      newExecutionStartAuthorized: !replayed,
      resumeSameIdempotentAttemptOnly: replayed,
      toolExecutionAuthorized: !replayed,
      executionAttemptId: 'attempt.lf.rembg.fixture.001',
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

async function createBinding(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  sourcePng: Buffer,
  decodedRgba: Buffer,
) {
  return createLivingFrameControlledSdxlRembgInputBinding({
    gpuOutputObservation: observation,
    inputReader:
      createLivingFrameControlledSdxlRembgPrivateInputReader({
        gpuOutputObservation: observation,
        readServerOwnedOpaqueOutput: async () => ({
          packetClass:
            'server_owned_living_frame_opaque_output_for_rembg_v1',
          evidenceClass: observation.outputReader.evidenceClass,
          gpuOutputObservationId: observation.observationId,
          gpuOutputObservationDigestSha256:
            observation.observationDigestSha256,
          outputArtifactId:
            observation.verifiedOutput.outputArtifactId,
          outputContentType: 'image/png',
          outputByteLength: sourcePng.byteLength,
          outputContentSha256:
            observation.verifiedOutput.contentSha256,
          decodedRgbaSha256:
            observation.verifiedOutput.decodedRgbaSha256,
          outputPng: Buffer.from(sourcePng),
          decodedRgba: Buffer.from(decodedRgba),
          callerBytesPathUrlOrCredentialAccepted: false,
          genericRembgSourceVariantAuthority: false,
          rembgAdmissionAuthority: false,
          actualCostAuthority: false,
          productionReady: false,
        } satisfies LivingFrameControlledSdxlRembgPrivateInputPacket),
      }),
    inputConsumer:
      createLivingFrameControlledSdxlRembgInputConsumer(
        async () => undefined,
      ),
  })
}

function observationFor(
  sourcePng: Buffer,
  decodedRgba: Buffer,
): LivingFrameControlledSdxlGpuOutputObservation {
  const draft: LivingFrameControlledSdxlGpuOutputObservationDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
    observationId: 'lfgpuout_rembg_runtime_fixture_v1',
    caseId: 'full_combined_primary',
    sourceBindings: {
      requestReceiptId: 'lf.gpu.request.controlled.v1',
      requestReceiptDigestSha256: HASH_A,
      privateWireRequestDigestSha256: HASH_B,
      promptMaterializationDigestSha256: HASH_C,
      artifactSetDigestSha256: HASH_D,
      outputFrameExpectationDigestSha256: HASH_E,
      readerBindingDigestSha256: HASH_F,
    },
    outputReader: {
      evidenceClass: 'controlled_source_fixture',
      oneShotReaderConsumed: true,
      oneShotConsumerConsumed: true,
      verifiedBytesDeliveredOutOfBand: true,
    },
    verifiedOutput: {
      outputArtifactId: 'lf.output.opaque.rembg.fixture.v1',
      contentType: 'image/png',
      byteLength: sourcePng.byteLength,
      contentSha256: digestBytes(sourcePng),
      decodedRgbaSha256: digestBytes(decodedRgba),
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      decodedChannelCount: 4,
      sourcePngHadAlphaChannel: false,
      transparentPixelCount: 0,
      semiTransparentPixelCount: 0,
      opaquePixelCount: 1_048_576,
      alphaMeasurementReportDigestSha256: HASH_A,
      alphaFindingCodes: ['alpha_channel_fully_opaque'],
      alphaDisposition:
        'opaque_generated_source_requires_segmentation_matting_decontamination_and_alpha_qa',
    },
    costLineage: {
      costComponentId: 'shared_controlled_illustration_gpu_host',
      oneObservedOutputBelongsToOneGpuAttempt: true,
      fiveGpuCapabilitiesShareAttemptLifetime: true,
      auraFaceCpuMeasurementExcluded: true,
      canonicalWorkerResourceCostEvidenceRequired: true,
      completedFailedOrUnknownOutcomeNotInferred: true,
      actualCostAmountIncluded: false,
      customerPriceOrCreditIncluded: false,
      serviceFeeIncluded: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
    authorityBoundary: {
      privateOutputRereadAuthority: true,
      requestAuthority: false,
      operationAuthority: false,
      dispatchAuthority: false,
      workerCompletionAuthority: false,
      selectedSceneAuthority: false,
      timingAuthority: false,
      soundAuthority: false,
      estimateAuthority: false,
      actualCostAuthority: false,
      customerPriceAuthority: false,
      customerCreditAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      workItemAuthority: false,
      workGraphAuthority: false,
      queueAuthority: false,
      assetManifestAuthority: false,
      artifactCommitAuthority: false,
      segmentationOrMattingAuthority: false,
      alphaQaAuthority: false,
      continuityQaAuthority: false,
      documentarySafetyQaAuthority: false,
      renderAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    },
    requestReceiptRevalidated: true,
    exactRequestAndOutputLineageMatched: true,
    exactPrivateOutputBytesRereadAndDecoded: true,
    alphaMeasurementRecomputedFromDecodedBytes: true,
    outputIsOpaqueSourceOnly: true,
    transparentComponentCreated: false,
    artifactCommitted: false,
    actualAttemptCostEvidenceVerified: false,
    selectedSceneCreated: false,
    containsOutputBytesPathUrlCredentialPromptAliasOrCommand: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    observationDigestSha256: digest(draft),
  }
}

function createOpaqueRgba(): Buffer {
  const rgba = Buffer.alloc(RGBA_BYTE_COUNT)
  for (let index = 0; index < PIXEL_COUNT; index += 1) {
    const offset = index * 4
    rgba[offset] = 48
    rgba[offset + 1] = 80
    rgba[offset + 2] = 112
    rgba[offset + 3] = 255
  }
  return rgba
}

function createOpaqueRgbaPng(): Buffer {
  const pixel = Buffer.from([48, 80, 112, 255])
  const row = Buffer.alloc(1 + WIDTH * 4)
  for (let x = 0; x < WIDTH; x += 1) {
    pixel.copy(row, 1 + x * 4)
  }
  const rows = Array.from(
    { length: HEIGHT },
    () => row,
  )
  return createPng(6, Buffer.concat(rows))
}

function createGray8MaskPng(fill?: number): Buffer {
  const row = Buffer.alloc(1 + WIDTH)
  for (let x = 0; x < WIDTH; x += 1) {
    row[1 + x] = fill ?? (
      x < WIDTH / 3
        ? 0
        : x > WIDTH * 2 / 3
          ? 255
          : Math.round(
            ((x - WIDTH / 3) / (WIDTH / 3)) * 255,
          )
    )
  }
  const rows = Array.from(
    { length: HEIGHT },
    () => row,
  )
  return createPng(0, Buffer.concat(rows))
}

function createPng(colorType: 0 | 6, rows: Buffer): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(WIDTH, 0)
  ihdr.writeUInt32BE(HEIGHT, 4)
  ihdr[8] = 8
  ihdr[9] = colorType
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.byteLength)
  chunk.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return chunk
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1)
        ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
    && !Buffer.isBuffer(value)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

async function expectAsyncIssue(
  action: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof
        LivingFrameControlledSdxlRembgGpuRuntimeError
      && error.code === code,
  )
}

function expectSyncIssue(
  action: () => unknown,
  code: string,
): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof
        LivingFrameControlledSdxlRembgGpuRuntimeError
      && error.code === code,
  )
}

async function expectAlphaIssue(
  action: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof
        LivingFrameControlledSdxlRembgAlphaBridgeError
      && error.code === code,
  )
}

function expectAlphaSyncIssue(
  action: () => unknown,
  code: string,
): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof
        LivingFrameControlledSdxlRembgAlphaBridgeError
      && error.code === code,
  )
}

void main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
