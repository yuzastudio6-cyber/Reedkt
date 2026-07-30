import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

import {
  CANONICAL_GPU_WORKER_COMFYUI_PYTHON,
  CANONICAL_GPU_WORKER_COMFYUI_RUNNER,
  assertCanonicalComfyUiGpuRuntimeContract,
  assertCanonicalComfyUiGpuRuntimeRequestCandidate,
  assertCanonicalComfyUiGpuRuntimeResultCandidate,
  createCanonicalComfyUiGpuRuntimeRequestCandidate,
  createCanonicalComfyUiGpuRuntimeResultCandidate,
  createCanonicalGpuWorkerComfyUiSubprocessRuntimePort,
  createCanonicalGpuWorkerOperationRuntimePort,
  getCanonicalComfyUiGpuRuntimeContract,
  hashCanonicalGpuWorkerStderr,
  routeCanonicalGpuWorkerOperation,
  type CanonicalComfyUiGpuRuntimeRequestCandidateInput,
  type CanonicalComfyUiGpuRuntimeRunnerRequest,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getNonE2EToolCapabilityProfile,
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'

const contract =
  await getCanonicalComfyUiGpuRuntimeContract()
assert.deepEqual(
  await assertCanonicalComfyUiGpuRuntimeContract(
    structuredClone(contract),
  ),
  contract,
)
assert.equal(PRODUCTION_TOOL_IDS.length, 50)
assert.equal(PRODUCTION_TOOL_IDS.includes(
  'comfyui' as never,
), false)
assert.equal(
  getNonE2EToolCapabilityProfile('comfyui').productionStatus,
  'evaluation_only',
)
assert.equal(contract.operationIdentity.requestedToolId, 'comfyui')
assert.equal(
  contract.operationIdentity.registryCountIsProductCap,
  false,
)
assert.equal(
  contract.operationIdentity
    .representedGpuCapabilitiesShareOneAttempt,
  true,
)
assert.equal(
  contract.fixedFileLayout.totalModelByteLength,
  11_700_367_157,
)
assert.equal(
  contract.privateLocalFiveModelMountEvidence
    .orderedBundleDigestSha256,
  'cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20',
)
assert.equal(
  contract.boundaries.privateLocalAtomicReadOnlyMountVerified,
  true,
)
assert.equal(contract.boundaries.exactModelBundleIngested, false)
assert.equal(contract.boundaries.comfyUiInferenceVerified, false)

const graph = {
  '1': {
    class_type: 'CheckpointLoaderSimple' as const,
    inputs: {
      ckpt_name: 'sd_xl_base_1.0.safetensors',
    },
  },
  '2': {
    class_type: 'CLIPTextEncode' as const,
    inputs: {
      text: 'controlled subject-neutral private illustration',
      clip: ['1', 1],
    },
  },
  '3': {
    class_type: 'CLIPTextEncode' as const,
    inputs: {
      text: 'text, watermark, malformed anatomy',
      clip: ['1', 1],
    },
  },
  '4': {
    class_type: 'EmptyLatentImage' as const,
    inputs: {
      width: 1_920,
      height: 1_080,
      batch_size: 1,
    },
  },
  '5': {
    class_type: 'KSampler' as const,
    inputs: {
      seed: 4_294_967,
      steps: 24,
      cfg: 5.5,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      denoise: 1,
      model: ['1', 0],
      positive: ['2', 0],
      negative: ['3', 0],
      latent_image: ['4', 0],
    },
  },
  '6': {
    class_type: 'VAEDecode' as const,
    inputs: {
      samples: ['5', 0],
      vae: ['1', 2],
    },
  },
  '7': {
    class_type: 'SaveImageWebsocket' as const,
    inputs: {
      images: ['6', 0],
    },
  },
} as const

const requestInput = {
  admissionDigestSha256: '1'.repeat(64),
  dispatch: {
    dispatchIntentId: 'dispatch-intent-comfyui-router-0001',
    dispatchBindingHash: '2'.repeat(64),
    attemptPlanHash: '3'.repeat(64),
    runtimeRegion: 'europe-west1' as const,
  },
  selectedScene: {
    requestBindingId: 'selected-scene-request-binding-0001',
    requestBindingDigestSha256: '4'.repeat(64),
    approvedSnapshotId: 'approved-snapshot-comfyui-0001',
    approvedSnapshotHash: '5'.repeat(64),
    workItemId: 'work-item-generate-image-0001',
    workItemHash: '6'.repeat(64),
    outputKey: 'generated-background-plate-0001',
    plannedAssetManifestEntryId:
      'planned-asset-comfyui-0001',
    confirmedOutputFrameExpectationDigestSha256:
      '7'.repeat(64),
  },
  prompt: {
    graph,
    outputNodeId: '7',
  },
  modelSourceBindingDigests: [
    '8'.repeat(64),
    '9'.repeat(64),
    'a'.repeat(64),
    'b'.repeat(64),
    'c'.repeat(64),
  ],
  inputImages: [],
  output: {
    canvasClass: 'confirmed_full_frame_ratio' as const,
    width: 1_920,
    height: 1_080,
  },
} satisfies CanonicalComfyUiGpuRuntimeRequestCandidateInput

const requestCandidate =
  await createCanonicalComfyUiGpuRuntimeRequestCandidate(
    requestInput,
  )
assert.deepEqual(
  await assertCanonicalComfyUiGpuRuntimeRequestCandidate({
    ...requestInput,
    candidate: structuredClone(requestCandidate),
  }),
  requestCandidate,
)
const request = requestCandidate.runnerRequest
assert.equal(request.prompt.nodeCount, 7)
assert.equal(request.modelArtifacts.length, 5)
assert.equal(request.inputImages.length, 0)
assert.equal(request.output.width, 1_920)
assert.equal(request.output.height, 1_080)
assert.equal(
  request.settings.deniedTopLevelImports[0],
  'sam2',
)
assertPythonRunnerAcceptsRequest(request)

const fullCombinedGraph = {
  '1': graph['1'],
  '2': {
    class_type: 'LoraLoader' as const,
    inputs: {
      model: ['1', 0],
      clip: ['1', 1],
      lora_name:
        'sd_xl_offset_example-lora_1.0.safetensors',
      strength_model: 0.7,
      strength_clip: 0.55,
    },
  },
  '3': {
    class_type: 'CLIPTextEncode' as const,
    inputs: {
      text: 'controlled private combined conditioning',
      clip: ['2', 1],
    },
  },
  '4': {
    class_type: 'CLIPTextEncode' as const,
    inputs: {
      text: 'text, watermark, malformed anatomy',
      clip: ['2', 1],
    },
  },
  '5': {
    class_type: 'ControlNetLoader' as const,
    inputs: {
      control_net_name:
        'diffusion_pytorch_model.fp16.safetensors',
    },
  },
  '6': {
    class_type: 'LoadImage' as const,
    inputs: {
      image: 'control-image.png',
    },
  },
  '7': {
    class_type: 'ControlNetApplyAdvanced' as const,
    inputs: {
      positive: ['3', 0],
      negative: ['4', 0],
      control_net: ['5', 0],
      image: ['6', 0],
      strength: 0.75,
      start_percent: 0.1,
      end_percent: 1,
    },
  },
  '8': {
    class_type: 'EmptyLatentImage' as const,
    inputs: {
      width: 1_024,
      height: 1_024,
      batch_size: 1,
    },
  },
  '9': {
    class_type: 'CLIPVisionLoader' as const,
    inputs: {
      clip_name: 'model.safetensors',
    },
  },
  '10': {
    class_type: 'IPAdapterModelLoader' as const,
    inputs: {
      ipadapter_file: 'ip-adapter_sdxl.safetensors',
    },
  },
  '11': {
    class_type: 'LoadImage' as const,
    inputs: {
      image: 'reference-image.png',
    },
  },
  '12': {
    class_type: 'IPAdapterAdvanced' as const,
    inputs: {
      model: ['2', 0],
      ipadapter: ['10', 0],
      image: ['11', 0],
      clip_vision: ['9', 0],
      weight: 0.85,
      weight_type: 'linear',
      combine_embeds: 'average',
      start_at: 0,
      end_at: 0.9,
      embeds_scaling: 'v_only',
    },
  },
  '13': {
    class_type: 'KSampler' as const,
    inputs: {
      model: ['12', 0],
      positive: ['7', 0],
      negative: ['7', 1],
      latent_image: ['8', 0],
      seed: 7_654_321,
      steps: 24,
      cfg: 5.5,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      denoise: 1,
    },
  },
  '14': {
    class_type: 'VAEDecode' as const,
    inputs: {
      samples: ['13', 0],
      vae: ['1', 2],
    },
  },
  '15': {
    class_type: 'SaveImageWebsocket' as const,
    inputs: {
      images: ['14', 0],
    },
  },
} as const
const fullCombinedInput = {
  ...requestInput,
  selectedScene: {
    ...requestInput.selectedScene,
    requestBindingId: 'selected-scene-request-binding-0002',
    requestBindingDigestSha256: 'd'.repeat(64),
    workItemId: 'work-item-generate-image-0002',
    workItemHash: 'e'.repeat(64),
    outputKey: 'generated-isolated-component-0002',
    plannedAssetManifestEntryId:
      'planned-asset-comfyui-0002',
  },
  prompt: {
    graph: fullCombinedGraph,
    outputNodeId: '15',
  },
  inputImages: [
    {
      canonicalOrder: 0 as const,
      slotId: 'control_image_artifact' as const,
      fileName: 'control-image.png' as const,
      artifactId: 'private-control-image-comfyui-0002',
      contentSha256: 'f'.repeat(64),
      byteLength: 240_000,
      width: 1_024,
      height: 1_024,
      sourceBindingDigestSha256: '0'.repeat(64),
      readOnlyMountRequired: true as const,
    },
    {
      canonicalOrder: 1 as const,
      slotId: 'reference_image_artifact' as const,
      fileName: 'reference-image.png' as const,
      artifactId: 'private-reference-image-comfyui-0002',
      contentSha256: '1'.repeat(64),
      byteLength: 260_000,
      width: 1_024,
      height: 1_024,
      sourceBindingDigestSha256: '2'.repeat(64),
      readOnlyMountRequired: true as const,
    },
  ],
  output: {
    canvasClass: 'isolated_component_square_1024' as const,
    width: 1_024,
    height: 1_024,
  },
} satisfies CanonicalComfyUiGpuRuntimeRequestCandidateInput
const fullCombinedCandidate =
  await createCanonicalComfyUiGpuRuntimeRequestCandidate(
    fullCombinedInput,
  )
assert.equal(fullCombinedCandidate.runnerRequest.prompt.nodeCount, 15)
assert.equal(fullCombinedCandidate.runnerRequest.inputImages.length, 2)
assertPythonRunnerAcceptsRequest(
  fullCombinedCandidate.runnerRequest,
)

let invocationCount = 0
const receipt = await routeCanonicalGpuWorkerOperation({
  request,
  runtimePort: createCanonicalGpuWorkerOperationRuntimePort({
    evidenceClass: 'controlled_source_fixture',
    supportedOperationIds: [
      'tool.comfyui.generate_controlled_image.v1',
    ],
    async execute(input) {
      invocationCount += 1
      assert.deepEqual(input.request, request)
      assert.equal(
        input.serializedRequest,
        stableAuthorityStringify(request),
      )
      return successfulPortResult(
        successfulWireResponse(request),
      )
    },
  }),
})

assert.equal(invocationCount, 1)
assert.equal(
  receipt.operation.operationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(receipt.operation.computeType, 'model_native')
assert.equal(
  receipt.runtimeContract.contractDigestSha256,
  contract.contractDigestSha256,
)
assert.equal(receipt.response.outputs.length, 1)
assert.equal(receipt.summary.outputCount, 1)
assert.equal(receipt.summary.processEvidenceCount, 1)
assert.equal(receipt.summary.outputBytesIncluded, false)
assert.equal(receipt.boundaries.actualCloudRunExecutionVerified, false)
assert.equal(receipt.boundaries.cloudDispatchAuthority, false)
assert.equal(receipt.boundaries.productionAuthority, false)

const resultCandidateInput = {
  ...requestInput,
  runtimeRequestCandidate: requestCandidate,
  runtimeWireResponse: successfulWireResponse(request),
}
const resultCandidate =
  await createCanonicalComfyUiGpuRuntimeResultCandidate(
    resultCandidateInput,
  )
assert.deepEqual(
  await assertCanonicalComfyUiGpuRuntimeResultCandidate({
    ...resultCandidateInput,
    resultCandidate: structuredClone(resultCandidate),
  }),
  resultCandidate,
)
assert.equal(
  resultCandidate.costEvidenceRequirements
    .representedGpuCapabilitiesShareOneAttempt,
  true,
)
assert.equal(
  resultCandidate.outputCandidate.remotionFinalCanvasRequired,
  true,
)
assert.equal(
  resultCandidate.boundaries.outputArtifactCommitAuthority,
  false,
)

const subprocessPort =
  createCanonicalGpuWorkerComfyUiSubprocessRuntimePort()
assert.deepEqual(subprocessPort.supportedOperationIds, [
  'tool.comfyui.generate_controlled_image.v1',
])
assert.equal(
  CANONICAL_GPU_WORKER_COMFYUI_PYTHON,
  '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python',
)
assert.equal(
  CANONICAL_GPU_WORKER_COMFYUI_RUNNER,
  '/opt/reeditpro/gpu-operations/comfyui/runner.py',
)

let adversarialAssertions = 0

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    callerModelPath: '/tmp/caller-model.safetensors',
  }),
  'caller model path',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeWithFreshPort(rebindRequest({
    ...request,
    settings: {
      ...request.settings,
      device: 'cpu',
    },
  })),
  'CPU substitution',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeWithFreshPort(rebindRequest({
    ...request,
    output: {
      ...request.output,
      width: 1_024,
      height: 1_024,
    },
  })),
  'square full-frame substitution',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => {
    const tamperedGraph = {
      ...request.prompt.graph,
      '7': {
        class_type: 'SaveImage',
        inputs: {
          images: ['6', 0],
        },
      },
    }
    return routeWithFreshPort(rebindRequest({
      ...request,
      prompt: {
        graph: tamperedGraph,
        graphDigestSha256:
          sha256AuthorityValue(tamperedGraph),
        outputNodeId: '7',
        nodeCount: 7,
      },
    }))
  },
  'arbitrary save node',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => {
    const tamperedGraph = {
      ...request.prompt.graph,
      '5': {
        ...request.prompt.graph['5'],
        inputs: {
          ...request.prompt.graph['5'].inputs,
          caller_output_path: 'caller-output.png',
        },
      },
    }
    return routeWithFreshPort(rebindRequest({
      ...request,
      prompt: {
        graph: tamperedGraph,
        graphDigestSha256:
          sha256AuthorityValue(tamperedGraph),
        outputNodeId: '7',
        nodeCount: 7,
      },
    }))
  },
  'arbitrary sampler input',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => {
    const modelArtifacts = request.modelArtifacts.map(
      (model, index) => index === 0
        ? {
          ...model,
          contentSha256: 'f'.repeat(64),
        }
        : model,
    )
    return routeWithFreshPort(rebindRequest({
      ...request,
      modelArtifacts,
    }))
  },
  'model object substitution',
  'canonical_gpu_worker_current_runtime_contract_mismatch',
)

await expectRejects(
  () => routeWithFreshPort(
    request,
    {
      ...successfulWireResponse(request),
      outputs: [{
        ...successfulWireResponse(request).outputs[0],
        width: 1_024,
      }],
    },
  ),
  'output dimension substitution',
  'comfyui_gpu_runtime_result_request_lineage_mismatch',
)

await expectRejects(
  () => routeWithFreshPort(
    request,
    {
      ...successfulWireResponse(request),
      runtimeIdentity: {
        ...successfulWireResponse(request).runtimeIdentity,
        cudaDeviceName: 'Apple M4',
      },
    },
  ),
  'non-L4 response',
  'comfyui_gpu_runtime_result_wire_invalid',
)

await expectRejects(
  () => routeWithFreshPort(
    request,
    {
      ...successfulWireResponse(request),
      processEvidence: [{
        ...successfulWireResponse(request).processEvidence[0],
        gracefulShutdownObserved: false,
        stopEscalationRequired: true,
      }],
    },
  ),
  'ungraceful host shutdown',
  'comfyui_gpu_runtime_result_wire_invalid',
)

const replayPort = createCanonicalGpuWorkerOperationRuntimePort({
  evidenceClass: 'controlled_source_fixture',
  supportedOperationIds: [
    'tool.comfyui.generate_controlled_image.v1',
  ],
  async execute() {
    return successfulPortResult(
      successfulWireResponse(request),
    )
  },
})
await routeCanonicalGpuWorkerOperation({
  request,
  runtimePort: replayPort,
})
await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort: replayPort,
  }),
  'runtime-port replay',
  'canonical_gpu_worker_process_bound_runtime_port_required',
)

await expectRejects(
  () => assertCanonicalComfyUiGpuRuntimeRequestCandidate({
    ...requestInput,
    candidate: {
      ...requestCandidate,
      boundaries: {
        ...requestCandidate.boundaries,
        runtimeAuthority: true,
      },
    },
  }),
  'candidate authority promotion',
  'comfyui_gpu_runtime_request_candidate_mismatch',
)

console.log(JSON.stringify({
  ok: true,
  operationId: receipt.operation.operationId,
  productionToolCount: PRODUCTION_TOOL_IDS.length,
  currentCatalogClass:
    contract.operationIdentity.currentCatalogClass,
  representedGpuCapabilityCount:
    contract.operationIdentity.representedGpuCapabilities.length,
  modelArtifactCount:
    contract.fixedFileLayout.modelFiles.length,
  modelArtifactByteLength:
    contract.fixedFileLayout.totalModelByteLength,
  selectedSceneDimensions: [
    request.output.width,
    request.output.height,
  ],
  outputCount: receipt.summary.outputCount,
  processEvidenceCount: receipt.summary.processEvidenceCount,
  exactModelBundleIngested:
    contract.boundaries.exactModelBundleIngested,
  privateLocalAtomicReadOnlyMountVerified:
    contract.boundaries.privateLocalAtomicReadOnlyMountVerified,
  actualCloudRunExecutionVerified:
    receipt.boundaries.actualCloudRunExecutionVerified,
  productionAuthority: receipt.boundaries.productionAuthority,
  adversarialAssertions,
}))

function successfulWireResponse(
  value: CanonicalComfyUiGpuRuntimeRunnerRequest,
) {
  return {
    schemaVersion:
      'canonical-comfyui-gpu-runtime-response-v1' as const,
    ok: true as const,
    status:
      'controlled_comfyui_gpu_generation_completed' as const,
    operationId: value.operationId,
    admissionDigestSha256: value.admissionDigestSha256,
    requestBindingSha256: value.requestBindingSha256,
    dispatchIntentId: value.dispatch.dispatchIntentId,
    runtimeIdentity: {
      comfyUiSourceRevision:
        '093d571b83e7a79833200e199b46b9f5a62217f9' as const,
      ipAdapterSourceRevision:
        'b188a6cb39b512a9c6da7235b880af42c78ccd0d' as const,
      controlNetAuxSourceRevision:
        'e8b689a513c3e6b63edc44066560ca5919c0576e' as const,
      wheelManifestSha256:
        'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9' as const,
      torchVersion: '2.5.1+cu124' as const,
      cudaBuild: '12.4' as const,
      cudaDeviceCount: 1 as const,
      cudaDeviceName: 'NVIDIA L4' as const,
      accelerator: 'nvidia_l4' as const,
      device: 'cuda' as const,
      runtimeRegion: 'europe-west1' as const,
      modelArtifactCount: 5 as const,
      modelArtifactByteLength: 11_700_367_157 as const,
      allModelsVerifiedBeforeAndAfterInference: true as const,
      sam2ImportDenied: true as const,
      cpuFallbackDisabled: true as const,
    },
    outputs: [{
      canonicalOrder: 0 as const,
      artifactKind: 'generated_opaque_png' as const,
      fileName: 'generated.png' as const,
      contentType: 'image/png' as const,
      encodingProfile:
        'opaque_rgb_or_rgba_png_v1' as const,
      width: value.output.width,
      height: value.output.height,
      byteLength: 4_200_000,
      contentSha256: 'd'.repeat(64),
      decodedRgbaSha256: 'e'.repeat(64),
      opaquePixelCount:
        value.output.width * value.output.height,
    }] as const,
    processEvidence: [{
      canonicalOrder: 0 as const,
      processClass:
        'fixed_supervised_comfyui_host' as const,
      startedAtUnixMilliseconds: 1_785_000_000_000,
      finishedAtUnixMilliseconds: 1_785_000_045_000,
      promptIdSha256: 'f'.repeat(64),
      stdoutByteLength: 2_400,
      stdoutSha256: '0'.repeat(64),
      stderrByteLength: 400,
      stderrSha256: '1'.repeat(64),
      gracefulShutdownObserved: true as const,
      stopEscalationRequired: false as const,
    }] as const,
    receiptBoundaries: {
      outputBytesIncluded: false as const,
      promptTextIncluded: false as const,
      modelBytesIncluded: false as const,
      inputImageBytesIncluded: false as const,
      pathsIncluded: false as const,
      urlsIncluded: false as const,
      credentialsIncluded: false as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      artifactCommitAuthority: false as const,
      qaPassAuthority: false as const,
      customerCostAuthority: false as const,
      productionReady: false as const,
    },
  }
}

function assertPythonRunnerAcceptsRequest(
  value: CanonicalComfyUiGpuRuntimeRunnerRequest,
): void {
  const serialized = stableAuthorityStringify(value)
  const runnerPath = resolve(
    process.cwd(),
    'docker/prod/gpu-worker/comfyui/runner.py',
  )
  const graphDigestProbe = spawnSync(
    'python3',
    [
      '-c',
      [
        'import hashlib,importlib.util,json,sys',
        'spec=importlib.util.spec_from_file_location("canonical_comfyui_runner",sys.argv[1])',
        'module=importlib.util.module_from_spec(spec)',
        'spec.loader.exec_module(module)',
        'value=json.load(sys.stdin)',
        'graph=module.canonical_json(value["prompt"]["graph"])',
        'print(hashlib.sha256(graph.encode("utf-8")).hexdigest())',
      ].join(';'),
      runnerPath,
    ],
    {
      input: serialized,
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: '1',
      },
    },
  )
  assert.equal(graphDigestProbe.status, 0)
  assert.equal(
    graphDigestProbe.stdout.trim(),
    value.prompt.graphDigestSha256,
  )
  const probe = spawnSync(
    'python3',
    [runnerPath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: '1',
      },
      input: `${serialized}\n`,
      encoding: 'utf8',
    },
  )
  assert.equal(probe.status, 70)
  assert.match(
    probe.stderr,
    /COMFYUI_RUNTIME_FAILED:(?:NONROOT_IDENTITY_INVALID|READ_ONLY_ROOT_REQUIRED|PACKAGE_LAYOUT_INVALID)/u,
  )
  assert.doesNotMatch(
    probe.stderr,
    /(?:REQUEST|DISPATCH|SELECTED_SCENE|MODEL_SET|INPUT_IMAGE_SET|OUTPUT|SETTINGS|PROMPT)_INVALID/u,
  )
}

function successfulPortResult(wireResponse: unknown) {
  const stdout = JSON.stringify(wireResponse)
  return {
    wireResponse,
    process: {
      exitCode: 0,
      timedOut: false,
      oomKilled: false,
      stdoutByteLength: Buffer.byteLength(stdout),
      stderrByteLength: 0,
      stderrSha256: hashCanonicalGpuWorkerStderr(''),
    },
  }
}

function routeWithFreshPort(
  value: unknown,
  wireResponse: unknown = successfulWireResponse(request),
) {
  return routeCanonicalGpuWorkerOperation({
    request: value,
    runtimePort: createCanonicalGpuWorkerOperationRuntimePort({
      evidenceClass: 'controlled_source_fixture',
      supportedOperationIds: [
        'tool.comfyui.generate_controlled_image.v1',
      ],
      async execute() {
        return successfulPortResult(wireResponse)
      },
    }),
  })
}

function rebindRequest(
  value: Omit<
    CanonicalComfyUiGpuRuntimeRunnerRequest,
    'requestBindingSha256'
  > & {
    readonly requestBindingSha256?: string
  } | Record<string, unknown>,
): Record<string, unknown> {
  const withoutBinding: Record<string, unknown> = { ...value }
  delete withoutBinding.requestBindingSha256
  return {
    ...withoutBinding,
    requestBindingSha256:
      sha256AuthorityValue(withoutBinding),
  }
}

async function expectRejects(
  action: () => Promise<unknown>,
  label: string,
  expectedCode: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => {
      const record = error as {
        code?: string
        message?: string
      }
      assert.equal(
        record.message?.includes(expectedCode)
          || record.code === expectedCode,
        true,
        `${label}: unexpected error ${record.message}`,
      )
      return true
    },
  )
  adversarialAssertions += 1
}
