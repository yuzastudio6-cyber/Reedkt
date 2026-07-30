import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getCanonicalComfyUiGpuRuntimeContract,
} from './canonical-comfyui-gpu-runtime-contract'
import {
  CANONICAL_COMFYUI_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
  type CanonicalComfyUiGpuRuntimeRequestCandidate,
  type CanonicalComfyUiGpuRuntimeRequestCandidateAssertionInput,
  type CanonicalComfyUiGpuRuntimeRequestCandidateInput,
  type CanonicalComfyUiGpuRuntimeRunnerRequest,
} from './canonical-comfyui-gpu-runtime-request-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const NODE_ID_PATTERN = /^[1-9][0-9]{0,2}$/u
const URL_LIKE_PATTERN = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE_PATTERN =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const ALLOWED_NODE_CLASSES = new Set([
  'CheckpointLoaderSimple',
  'LoraLoader',
  'CLIPTextEncode',
  'ControlNetLoader',
  'LoadImage',
  'ControlNetApplyAdvanced',
  'EmptyLatentImage',
  'CLIPVisionLoader',
  'IPAdapterModelLoader',
  'IPAdapterAdvanced',
  'KSampler',
  'VAEDecode',
  'SaveImageWebsocket',
])

const BLOCKERS = [
  'canonical_gpu_worker_operation_router_execution_required',
  'current_runtime_image_build_scan_signature_and_release_required',
  'exact_five_model_bundle_ingest_read_only_mount_and_paid_use_review_required',
  'cloud_run_l4_generation_and_resource_receipt_required',
  'private_output_commit_alpha_continuity_fact_composite_qa_and_review_required',
] as const

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))
const promptValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite().min(-1e9).max(1e9),
    z.string().max(16_384),
    z.array(promptValueSchema).max(64),
    z.record(z.string().max(128), promptValueSchema),
  ]),
)

const promptGraphSchema = z.record(
  z.string(),
  z.object({
    class_type: z.string(),
    inputs: z.record(z.string(), promptValueSchema),
  }).strict(),
)

const modelArtifactSchema = z.object({
  canonicalOrder: z.number().int().min(0).max(4),
  role: z.enum([
    'base_checkpoint',
    'controlnet_checkpoint',
    'lora_adapter',
    'generic_ipadapter_checkpoint',
    'clip_vision_checkpoint',
  ]),
  slotId: z.enum([
    'base_checkpoint_artifact',
    'controlnet_checkpoint_artifact',
    'lora_adapter_artifact',
    'generic_ipadapter_checkpoint_artifact',
    'clip_vision_checkpoint_artifact',
  ]),
  fileName: z.enum([
    'sd_xl_base_1.0.safetensors',
    'diffusion_pytorch_model.fp16.safetensors',
    'sd_xl_offset_example-lora_1.0.safetensors',
    'ip-adapter_sdxl.safetensors',
    'model.safetensors',
  ]),
  byteLength: z.number().int().positive(),
  contentSha256: digestSchema,
  sourceBindingDigestSha256: digestSchema,
  readOnlyMountRequired: z.literal(true),
}).strict()

const inputImageSchema = z.object({
  canonicalOrder: z.number().int().min(0).max(1),
  slotId: z.enum([
    'control_image_artifact',
    'reference_image_artifact',
  ]),
  fileName: z.enum([
    'control-image.png',
    'reference-image.png',
  ]),
  artifactId: safeIdSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().min(33).max(67_108_864),
  width: z.number().int().min(16).max(4_096),
  height: z.number().int().min(16).max(4_096),
  sourceBindingDigestSha256: digestSchema,
  readOnlyMountRequired: z.literal(true),
}).strict()

export const canonicalComfyUiGpuRuntimeRunnerRequestSchema =
  z.object({
    schemaVersion: z.literal(
      'canonical-comfyui-gpu-runtime-request-v1',
    ),
    operationId: z.literal(
      'tool.comfyui.generate_controlled_image.v1',
    ),
    admissionDigestSha256: digestSchema,
    dispatch: z.object({
      dispatchIntentId: safeIdSchema,
      dispatchBindingHash: digestSchema,
      attemptPlanHash: digestSchema,
      runtimeRegion: z.literal('europe-west1'),
    }).strict(),
    selectedScene: z.object({
      requestBindingId: safeIdSchema,
      requestBindingDigestSha256: digestSchema,
      approvedSnapshotId: safeIdSchema,
      approvedSnapshotHash: digestSchema,
      workItemId: safeIdSchema,
      workItemHash: digestSchema,
      outputKey: safeIdSchema,
      plannedAssetManifestEntryId: safeIdSchema,
      confirmedOutputFrameExpectationDigestSha256:
        digestSchema,
    }).strict(),
    prompt: z.object({
      graph: promptGraphSchema,
      graphDigestSha256: digestSchema,
      outputNodeId: z.string().regex(NODE_ID_PATTERN),
      nodeCount: z.number().int().min(7).max(32),
    }).strict(),
    modelArtifacts: z.tuple([
      modelArtifactSchema,
      modelArtifactSchema,
      modelArtifactSchema,
      modelArtifactSchema,
      modelArtifactSchema,
    ]),
    inputImages: z.array(inputImageSchema).max(2),
    output: z.object({
      canvasClass: z.enum([
        'isolated_component_square_1024',
        'confirmed_full_frame_ratio',
      ]),
      width: z.number().int().min(256).max(4_096)
        .refine((value) => value % 8 === 0),
      height: z.number().int().min(256).max(4_096)
        .refine((value) => value % 8 === 0),
      imageCount: z.literal(1),
      contentType: z.literal('image/png'),
      transport: z.literal('websocket_image_output'),
      opaqueGenerationOutputOnly: z.literal(true),
      finalCanvasCreatedByComfyUi: z.literal(false),
    }).strict(),
    settings: z.object({
      device: z.literal('cuda'),
      accelerator: z.literal('nvidia_l4'),
      gpuCount: z.literal(1),
      cpuFallbackAllowed: z.literal(false),
      runtimeDownloadAllowed: z.literal(false),
      networkFetchAllowed: z.literal(false),
      deniedTopLevelImports: z.tuple([z.literal('sam2')]),
      allFiveModelsMountedReadOnly: z.literal(true),
      verifyModelsBeforeAndAfterInference: z.literal(true),
      oneProcessPerAttempt: z.literal(true),
      outputBatchingAllowed: z.literal(false),
    }).strict(),
    requestBindingSha256: digestSchema,
  }).strict()
    .superRefine((request, context) => {
      const {
        requestBindingSha256,
        ...requestWithoutBinding
      } = request
      if (
        requestBindingSha256
          !== sha256AuthorityValue(requestWithoutBinding)
      ) {
        addIssue(context, 'request binding changed')
      }
      if (
        request.output.width * request.output.height
          > 8_294_400
        || (
          request.output.canvasClass
            === 'isolated_component_square_1024'
          && (
            request.output.width !== 1_024
            || request.output.height !== 1_024
          )
        )
      ) {
        addIssue(context, 'output dimensions changed')
      }
      validateInputImages(request.inputImages, context)
      validatePromptGraph({
        graph: request.prompt.graph,
        graphDigestSha256:
          request.prompt.graphDigestSha256,
        outputNodeId: request.prompt.outputNodeId,
        nodeCount: request.prompt.nodeCount,
        inputImages: request.inputImages,
        outputWidth: request.output.width,
        outputHeight: request.output.height,
        context,
      })
    })

export async function createCanonicalComfyUiGpuRuntimeRequestCandidate(
  input: CanonicalComfyUiGpuRuntimeRequestCandidateInput,
): Promise<CanonicalComfyUiGpuRuntimeRequestCandidate> {
  const runtimeContract =
    await getCanonicalComfyUiGpuRuntimeContract()
  const modelArtifacts = runtimeContract.fixedFileLayout.modelFiles
    .map((model, index) => ({
      canonicalOrder: model.canonicalOrder,
      role: model.role,
      slotId: model.slotId,
      fileName: model.fileName,
      byteLength: model.byteLength,
      contentSha256: model.contentSha256,
      sourceBindingDigestSha256:
        input.modelSourceBindingDigests[index],
      readOnlyMountRequired: true as const,
    })) as unknown as CanonicalComfyUiGpuRuntimeRunnerRequest[
      'modelArtifacts'
    ]
  const requestWithoutBinding = {
    schemaVersion:
      'canonical-comfyui-gpu-runtime-request-v1' as const,
    operationId:
      'tool.comfyui.generate_controlled_image.v1' as const,
    admissionDigestSha256:
      input.admissionDigestSha256,
    dispatch: input.dispatch,
    selectedScene: input.selectedScene,
    prompt: {
      graph: input.prompt.graph,
      graphDigestSha256:
        sha256AuthorityValue(input.prompt.graph),
      outputNodeId: input.prompt.outputNodeId,
      nodeCount: Object.keys(input.prompt.graph).length,
    },
    modelArtifacts,
    inputImages: input.inputImages,
    output: {
      ...input.output,
      imageCount: 1 as const,
      contentType: 'image/png' as const,
      transport: 'websocket_image_output' as const,
      opaqueGenerationOutputOnly: true as const,
      finalCanvasCreatedByComfyUi: false as const,
    },
    settings: {
      device: 'cuda' as const,
      accelerator: 'nvidia_l4' as const,
      gpuCount: 1 as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      deniedTopLevelImports: ['sam2'] as const,
      allFiveModelsMountedReadOnly: true as const,
      verifyModelsBeforeAndAfterInference: true as const,
      oneProcessPerAttempt: true as const,
      outputBatchingAllowed: false as const,
    },
  }
  const runnerRequest =
    assertCanonicalComfyUiGpuRuntimeRunnerRequest({
      ...requestWithoutBinding,
      requestBindingSha256:
        sha256AuthorityValue(requestWithoutBinding),
    })
  const serializedRunnerRequest =
    stableAuthorityStringify(runnerRequest)
  const serializedRunnerRequestByteLength =
    Buffer.byteLength(serializedRunnerRequest, 'utf8')
  if (
    serializedRunnerRequestByteLength
      > runtimeContract.runtimeProtocol.maximumRequestBytes
  ) {
    throw invalid('comfyui_gpu_runtime_request_too_large')
  }
  const identity = {
    admissionDigestSha256:
      runnerRequest.admissionDigestSha256,
    runtimeContractDigestSha256:
      runtimeContract.contractDigestSha256,
    runtimeSourceDigestSha256:
      runtimeContract.sourceDigestSha256,
    ...runnerRequest.selectedScene,
    ...runnerRequest.dispatch,
  }
  const draft = {
    requestCandidateVersion:
      CANONICAL_COMFYUI_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
    requestCandidateClass:
      'server_derived_non_dispatching_selected_scene_comfyui_gpu_runtime_request_candidate' as const,
    identity,
    runnerRequest,
    serializedRunnerRequestByteLength,
    runnerRequestDigestSha256:
      sha256AuthorityValue(runnerRequest),
    expectedOutput: {
      artifactKind: 'generated_opaque_png' as const,
      fileName: 'generated.png' as const,
      contentType: 'image/png' as const,
      encodingProfile:
        'opaque_rgb_or_rgba_png_v1' as const,
      width: runnerRequest.output.width,
      height: runnerRequest.output.height,
      privateCreateOnlyPersistenceRequired: true as const,
      remotionFinalCanvasRequired: true as const,
    },
    summary: {
      exactCurrentRuntimeSourceReread: true as const,
      exactFiveModelSetBound: true as const,
      exactModelSourceBindingDigestsBound: true as const,
      selectedSceneLineageBound: true as const,
      selectedSceneDimensionsBound: true as const,
      allowlistedPromptGraphBound: true as const,
      exactInputImageSetBound: true as const,
      oneRequestOneProcessOneImageOneAttempt: true as const,
      representedGpuCapabilitiesShareOneAttempt:
        true as const,
      callerPathsIncluded: false as const,
      callerUrlsIncluded: false as const,
      callerBytesIncluded: false as const,
      credentialsIncluded: false as const,
      finalCanvasAuthorityIncluded: false as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      candidateOnly: true as const,
      serverDerived: true as const,
      runnerInvoked: false as const,
      exactModelBundleMounted: false as const,
      cloudRunL4ExecutionVerified: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      outputArtifactCommitAuthority: false as const,
      outputQaAndPrivateReviewAuthority: false as const,
      customerCostAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return deepFreeze({
    ...draft,
    requestCandidateDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalComfyUiGpuRuntimeRequestCandidate(
  input: CanonicalComfyUiGpuRuntimeRequestCandidateAssertionInput,
): Promise<CanonicalComfyUiGpuRuntimeRequestCandidate> {
  const expected =
    await createCanonicalComfyUiGpuRuntimeRequestCandidate(input)
  if (
    stableAuthorityStringify(input.candidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('comfyui_gpu_runtime_request_candidate_mismatch')
  }
  return expected
}

export function assertCanonicalComfyUiGpuRuntimeRunnerRequest(
  value: unknown,
): CanonicalComfyUiGpuRuntimeRunnerRequest {
  const parsed =
    canonicalComfyUiGpuRuntimeRunnerRequestSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('comfyui_gpu_runtime_request_invalid')
  }
  return deepFreeze(
    parsed.data as CanonicalComfyUiGpuRuntimeRunnerRequest,
  )
}

function validateInputImages(
  images: readonly {
    canonicalOrder: number
    slotId:
      | 'control_image_artifact'
      | 'reference_image_artifact'
    fileName: 'control-image.png' | 'reference-image.png'
  }[],
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>()
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const expectedFileName =
      image.slotId === 'control_image_artifact'
        ? 'control-image.png'
        : 'reference-image.png'
    if (
      image.canonicalOrder !== index
      || image.fileName !== expectedFileName
      || seen.has(image.slotId)
    ) {
      addIssue(context, 'input image set changed')
    }
    seen.add(image.slotId)
  }
}

function validatePromptGraph(input: {
  graph: Record<string, {
    class_type: string
    inputs: Record<string, unknown>
  }>
  graphDigestSha256: string
  outputNodeId: string
  nodeCount: number
  inputImages: readonly {
    fileName: string
    slotId:
      | 'control_image_artifact'
      | 'reference_image_artifact'
  }[]
  outputWidth: number
  outputHeight: number
  context: z.RefinementCtx
}): void {
  const nodeEntries = Object.entries(input.graph)
  if (
    nodeEntries.length !== input.nodeCount
    || input.graphDigestSha256
      !== sha256AuthorityValue(input.graph)
  ) {
    addIssue(input.context, 'prompt graph digest changed')
  }
  const classCounts = new Map<string, number>()
  const strings: string[] = []
  for (const [nodeId, node] of nodeEntries) {
    if (
      !NODE_ID_PATTERN.test(nodeId)
      || !ALLOWED_NODE_CLASSES.has(node.class_type)
    ) {
      addIssue(input.context, 'prompt node changed')
      continue
    }
    classCounts.set(
      node.class_type,
      (classCounts.get(node.class_type) ?? 0) + 1,
    )
    validatePromptValue({
      value: node.inputs,
      graph: input.graph,
      currentNode: Number(nodeId),
      strings,
      context: input.context,
    })
  }
  if (
    input.graph[input.outputNodeId]?.class_type
      !== 'SaveImageWebsocket'
    || classCounts.get('SaveImageWebsocket') !== 1
    || classCounts.get('CheckpointLoaderSimple') !== 1
    || classCounts.get('CLIPTextEncode') !== 2
    || classCounts.get('EmptyLatentImage') !== 1
    || classCounts.get('KSampler') !== 1
    || classCounts.get('VAEDecode') !== 1
    || (classCounts.get('LoraLoader') ?? 0) > 1
    || (classCounts.get('ControlNetLoader') ?? 0) > 1
    || (classCounts.get('ControlNetApplyAdvanced') ?? 0) > 1
    || (classCounts.get('CLIPVisionLoader') ?? 0) > 1
    || (classCounts.get('IPAdapterModelLoader') ?? 0) > 1
    || (classCounts.get('IPAdapterAdvanced') ?? 0) > 1
    || (classCounts.get('LoadImage') ?? 0)
      !== input.inputImages.length
  ) {
    addIssue(input.context, 'prompt topology changed')
  }
  const latentNode = nodeEntries.find(
    ([, node]) => node.class_type === 'EmptyLatentImage',
  )?.[1]
  if (
    latentNode?.inputs.width !== input.outputWidth
    || latentNode.inputs.height !== input.outputHeight
    || latentNode.inputs.batch_size !== 1
  ) {
    addIssue(input.context, 'prompt output dimensions changed')
  }
  validateExactGraphTopology(input)
  const flattenedStrings = strings.join('\n')
  const modelCounts = [
    ['sd_xl_base_1.0.safetensors', 1],
    [
      'diffusion_pytorch_model.fp16.safetensors',
      classCounts.get('ControlNetLoader') ?? 0,
    ],
    [
      'sd_xl_offset_example-lora_1.0.safetensors',
      classCounts.get('LoraLoader') ?? 0,
    ],
    [
      'ip-adapter_sdxl.safetensors',
      classCounts.get('IPAdapterAdvanced') ?? 0,
    ],
    [
      'model.safetensors',
      classCounts.get('IPAdapterAdvanced') ?? 0,
    ],
  ] as const
  for (const [fileName, count] of modelCounts) {
    if (countOccurrences(flattenedStrings, fileName) !== count) {
      addIssue(input.context, 'prompt model alias changed')
    }
  }
  for (const image of input.inputImages) {
    if (
      countOccurrences(flattenedStrings, image.fileName) !== 1
    ) {
      addIssue(input.context, 'prompt input image alias changed')
    }
  }
}

function validateExactGraphTopology(input: {
  graph: Record<string, {
    class_type: string
    inputs: Record<string, unknown>
  }>
  outputNodeId: string
  inputImages: readonly {
    fileName: string
    slotId:
      | 'control_image_artifact'
      | 'reference_image_artifact'
  }[]
  outputWidth: number
  outputHeight: number
  context: z.RefinementCtx
}): void {
  const nodeIds = Object.keys(input.graph)
  const expectedNodeIds = Array.from(
    { length: nodeIds.length },
    (_, index) => String(index + 1),
  )
  if (
    stableAuthorityStringify(nodeIds)
      !== stableAuthorityStringify(expectedNodeIds)
  ) {
    addIssue(input.context, 'prompt node order changed')
    return
  }
  let cursor = 1
  const base = String(cursor)
  requireExactNodeInputs(input, base, 'CheckpointLoaderSimple', {
    ckpt_name: 'sd_xl_base_1.0.safetensors',
  })
  cursor += 1

  let modelSource = base
  const usesLora =
    input.graph[String(cursor)]?.class_type === 'LoraLoader'
  if (usesLora) {
    modelSource = String(cursor)
    requireExactNodeInputs(input, modelSource, 'LoraLoader', {
      model: [base, 0],
      clip: [base, 1],
      lora_name:
        'sd_xl_offset_example-lora_1.0.safetensors',
      strength_model: 0.7,
      strength_clip: 0.55,
    })
    cursor += 1
  }

  const positive = String(cursor)
  const positiveInputs = requireExactNodeInputs(
    input,
    positive,
    'CLIPTextEncode',
  )
  if (
    stableAuthorityStringify(Object.keys(positiveInputs).sort())
      !== stableAuthorityStringify(['clip', 'text'])
    || typeof positiveInputs.text !== 'string'
    || stableAuthorityStringify(positiveInputs.clip)
      !== stableAuthorityStringify([modelSource, 1])
  ) {
    addIssue(input.context, 'positive conditioning changed')
  }
  cursor += 1

  const negative = String(cursor)
  const negativeInputs = requireExactNodeInputs(
    input,
    negative,
    'CLIPTextEncode',
  )
  if (
    stableAuthorityStringify(Object.keys(negativeInputs).sort())
      !== stableAuthorityStringify(['clip', 'text'])
    || typeof negativeInputs.text !== 'string'
    || stableAuthorityStringify(negativeInputs.clip)
      !== stableAuthorityStringify([modelSource, 1])
  ) {
    addIssue(input.context, 'negative conditioning changed')
  }
  cursor += 1

  let positiveSource = positive
  let negativeSource = negative
  const usesControlNet =
    input.graph[String(cursor)]?.class_type === 'ControlNetLoader'
  if (usesControlNet) {
    const controlLoader = String(cursor)
    requireExactNodeInputs(
      input,
      controlLoader,
      'ControlNetLoader',
      {
        control_net_name:
          'diffusion_pytorch_model.fp16.safetensors',
      },
    )
    cursor += 1
    const controlImage = String(cursor)
    requireExactNodeInputs(input, controlImage, 'LoadImage', {
      image: 'control-image.png',
    })
    cursor += 1
    const controlApply = String(cursor)
    requireExactNodeInputs(
      input,
      controlApply,
      'ControlNetApplyAdvanced',
      {
        positive: [positive, 0],
        negative: [negative, 0],
        control_net: [controlLoader, 0],
        image: [controlImage, 0],
        strength: usesLora ? 0.75 : 0.85,
        start_percent: usesLora ? 0.1 : 0,
        end_percent: usesLora ? 1 : 0.9,
      },
    )
    cursor += 1
    positiveSource = controlApply
    negativeSource = controlApply
  }

  const latent = String(cursor)
  requireExactNodeInputs(input, latent, 'EmptyLatentImage', {
    width: input.outputWidth,
    height: input.outputHeight,
    batch_size: 1,
  })
  cursor += 1

  let finalModelSource = modelSource
  const usesIpAdapter =
    input.graph[String(cursor)]?.class_type === 'CLIPVisionLoader'
  if (usesIpAdapter) {
    const clipVision = String(cursor)
    requireExactNodeInputs(
      input,
      clipVision,
      'CLIPVisionLoader',
      {
        clip_name: 'model.safetensors',
      },
    )
    cursor += 1
    const ipAdapterModel = String(cursor)
    requireExactNodeInputs(
      input,
      ipAdapterModel,
      'IPAdapterModelLoader',
      {
        ipadapter_file: 'ip-adapter_sdxl.safetensors',
      },
    )
    cursor += 1
    const referenceImage = String(cursor)
    requireExactNodeInputs(input, referenceImage, 'LoadImage', {
      image: 'reference-image.png',
    })
    cursor += 1
    finalModelSource = String(cursor)
    requireExactNodeInputs(
      input,
      finalModelSource,
      'IPAdapterAdvanced',
      {
        model: [modelSource, 0],
        ipadapter: [ipAdapterModel, 0],
        image: [referenceImage, 0],
        clip_vision: [clipVision, 0],
        weight: 0.85,
        weight_type: 'linear',
        combine_embeds: 'average',
        start_at: 0,
        end_at: 0.9,
        embeds_scaling: 'v_only',
      },
    )
    cursor += 1
  }

  const sampler = String(cursor)
  const samplerInputs = requireExactNodeInputs(
    input,
    sampler,
    'KSampler',
  )
  const expectedSamplerKeys = [
    'cfg',
    'denoise',
    'latent_image',
    'model',
    'negative',
    'positive',
    'sampler_name',
    'scheduler',
    'seed',
    'steps',
  ]
  if (
    stableAuthorityStringify(Object.keys(samplerInputs).sort())
      !== stableAuthorityStringify(expectedSamplerKeys)
    || stableAuthorityStringify(samplerInputs.model)
      !== stableAuthorityStringify([finalModelSource, 0])
    || stableAuthorityStringify(samplerInputs.positive)
      !== stableAuthorityStringify([positiveSource, 0])
    || stableAuthorityStringify(samplerInputs.negative)
      !== stableAuthorityStringify([
        negativeSource,
        usesControlNet ? 1 : 0,
      ])
    || stableAuthorityStringify(samplerInputs.latent_image)
      !== stableAuthorityStringify([latent, 0])
    || !Number.isSafeInteger(samplerInputs.seed)
    || Number(samplerInputs.seed) < 0
    || samplerInputs.steps !== 24
    || samplerInputs.cfg !== 5.5
    || samplerInputs.sampler_name !== 'dpmpp_2m'
    || samplerInputs.scheduler !== 'karras'
    || samplerInputs.denoise !== 1
  ) {
    addIssue(input.context, 'sampler settings changed')
  }
  cursor += 1

  const vae = String(cursor)
  requireExactNodeInputs(input, vae, 'VAEDecode', {
    samples: [sampler, 0],
    vae: [base, 2],
  })
  cursor += 1

  const output = String(cursor)
  requireExactNodeInputs(input, output, 'SaveImageWebsocket', {
    images: [vae, 0],
  })
  cursor += 1
  if (
    cursor !== nodeIds.length + 1
    || input.outputNodeId !== output
  ) {
    addIssue(input.context, 'prompt output topology changed')
  }

  const expectedSlots: string[] = []
  if (usesControlNet) {
    expectedSlots.push('control_image_artifact')
  }
  if (usesIpAdapter) {
    expectedSlots.push('reference_image_artifact')
  }
  if (
    stableAuthorityStringify(
      input.inputImages.map((image) => image.slotId),
    ) !== stableAuthorityStringify(expectedSlots)
  ) {
    addIssue(input.context, 'prompt input slot topology changed')
  }
}

function requireExactNodeInputs(
  input: {
    graph: Record<string, {
      class_type: string
      inputs: Record<string, unknown>
    }>
    context: z.RefinementCtx
  },
  nodeId: string,
  classType: string,
  expectedInputs?: Record<string, unknown>,
): Record<string, unknown> {
  const node = input.graph[nodeId]
  if (
    node?.class_type !== classType
    || (
      expectedInputs !== undefined
      && stableAuthorityStringify(node.inputs)
        !== stableAuthorityStringify(expectedInputs)
    )
  ) {
    addIssue(input.context, 'prompt exact node contract changed')
  }
  return node?.inputs ?? {}
}

function validatePromptValue(input: {
  value: unknown
  graph: Record<string, unknown>
  currentNode: number
  strings: string[]
  context: z.RefinementCtx
}): void {
  if (
    input.value === null
    || typeof input.value === 'boolean'
    || typeof input.value === 'number'
  ) {
    return
  }
  if (typeof input.value === 'string') {
    if (
      Buffer.byteLength(input.value, 'utf8') > 16_384
      || URL_LIKE_PATTERN.test(input.value)
      || SECRET_LIKE_PATTERN.test(input.value)
      || input.value.startsWith('/')
      || /^[A-Za-z]:[\\/]/u.test(input.value)
    ) {
      addIssue(input.context, 'unsafe prompt value')
    }
    input.strings.push(input.value)
    return
  }
  if (Array.isArray(input.value)) {
    if (
      input.value.length === 2
      && typeof input.value[0] === 'string'
      && NODE_ID_PATTERN.test(input.value[0])
      && Number.isInteger(input.value[1])
    ) {
      if (
        !(input.value[0] in input.graph)
        || Number(input.value[0]) >= input.currentNode
        || Number(input.value[1]) < 0
        || Number(input.value[1]) > 15
      ) {
        addIssue(input.context, 'prompt edge changed')
      }
      return
    }
    for (const nested of input.value) {
      validatePromptValue({
        ...input,
        value: nested,
      })
    }
    return
  }
  if (
    typeof input.value === 'object'
    && input.value !== null
  ) {
    for (const [key, nested] of Object.entries(input.value)) {
      if (key.length > 128) {
        addIssue(input.context, 'prompt input key changed')
      }
      validatePromptValue({
        ...input,
        value: nested,
      })
    }
    return
  }
  addIssue(input.context, 'prompt value changed')
}

function countOccurrences(value: string, target: string): number {
  if (target.length === 0) return 0
  let count = 0
  let offset = 0
  while (true) {
    const index = value.indexOf(target, offset)
    if (index < 0) return count
    count += 1
    offset = index + target.length
  }
}

function addIssue(
  context: z.RefinementCtx,
  message: string,
): void {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    message,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate:
      'canonical_comfyui_gpu_runtime_request_candidate',
  })
}
