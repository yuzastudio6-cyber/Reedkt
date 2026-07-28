import { z } from 'zod'

import {
  CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import { ApiError } from '../errors/api-error'
import {
  getProductionToolProfile,
} from '../tool-registry'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'

const safeKeySchema = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const uniqueSafeKeysSchema = z.array(safeKeySchema)
  .min(1)
  .max(128)
  .refine((values) =>
    new Set(values).size === values.length)

const expectedOutputSchema = z.object({
  outputKey: safeKeySchema,
  artifactType: z.literal(
    'living_frame_alpha_mask_png',
  ),
  assetRole: z.literal('processed'),
  required: z.literal(true),
  previewPlaceholderAllowed: z.literal(false),
  contentType: z.literal('image/png'),
  segmentIds: uniqueSafeKeysSchema.optional(),
  timingIds: uniqueSafeKeysSchema.optional(),
  rendererLayerIds: uniqueSafeKeysSchema.optional(),
}).passthrough()

const rembgGpuMaskWorkItemSchema = z.object({
  workItemKey: safeKeySchema,
  workItemType: z.literal('generate_mask_asset'),
  workerClass: z.literal(
    CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
  ),
  executionInput: z.object({
    operation: z.literal(
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
    ),
    approvedToolOperationIds: z.tuple([
      z.literal(
        CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
      ),
    ]),
    expectedOutputKeys: z.tuple([safeKeySchema]),
    structuredPayload: z.object({
      schemaVersion: z.literal(
        CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION,
      ),
      selectedSceneBindingDigestSha256: digestSchema,
      assetWorkInputBindingDigestSha256: digestSchema,
      estimateWorkAssetProjectionDigestSha256:
        digestSchema,
      customerEstimateAuthorityDigestSha256:
        digestSchema,
      sceneId: safeKeySchema,
      workRequirementDigestSha256: digestSchema,
      inputAssetIntentIds: uniqueSafeKeysSchema,
      outputAssetIntentIds: uniqueSafeKeysSchema,
      sourceFrameDependency: z.object({
        workItemKey: safeKeySchema,
        outputKey: safeKeySchema,
        artifactType: z.literal(
          CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
        ),
        sourceSequenceItemId: safeKeySchema,
        sourceCleanupDecisionId: safeKeySchema,
        masterFrameIndex: z.number().int().nonnegative(),
        sourceFrameIndex: z.number().int().nonnegative(),
        frameRate: z.union([
          z.literal(24),
          z.literal(25),
          z.literal(30),
          z.literal(50),
          z.literal(60),
        ]),
        frameSelectionPolicy: z.literal(
          'approved_source_frame_ordinal_v1',
        ),
        sourceFrameSelectionDigestSha256:
          digestSchema,
        contentType: z.literal('image/png'),
      }).strict(),
      runtimePolicy: z.object({
        executionTarget: z.literal(
          'google_cloud_run_gpu',
        ),
        workerType: z.literal(
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
        ),
        accelerator: z.literal('nvidia_l4'),
        gpuCount: z.literal(1),
        device: z.literal('cuda'),
        modelId: z.literal('u2netp'),
        outputMode: z.literal('mask_only_png'),
        confidenceThreshold: z.literal(0.5),
        alphaMatteMode: z.literal('straight'),
        edgeRefinementProfileId: z.literal(
          'approved_u2netp_default_v1',
        ),
        maximumSubjects: z.literal(1),
        preserveSourceDimensions: z.literal(true),
        cpuFallbackAllowed: z.literal(false),
        runtimeDownloadAllowed: z.literal(false),
        networkFetchAllowed: z.literal(false),
      }).strict(),
      requiredQaGates: z.tuple([
        z.literal('mask_edge_quality'),
        z.literal('mask_subject_coverage'),
      ]),
      runtimeQualificationRequired: z.literal(true),
      outputArtifactCommitRequired: z.literal(true),
      artifactQaPassRequired: z.literal(true),
    }).strict(),
  }).strict(),
  sourceSequenceItemIds: z.tuple([safeKeySchema]),
  sourceCleanupDecisionIds: z.tuple([safeKeySchema]),
  expectedOutputs: z.tuple([expectedOutputSchema]),
  dependencyKeys: z.array(safeKeySchema)
    .min(1)
    .max(128)
    .refine((values) =>
      new Set(values).size === values.length),
  approvedToolIds: z.tuple([z.literal('rembg')]),
  providerExecutionMode: z.literal('none'),
  fallbackPolicy: z.object({
    policy: z.literal(
      'block_living_frame_branch_until_gpu_runtime_and_mask_qa_pass',
    ),
    unapprovedFallbackAllowed: z.literal(false),
    cpuFallbackAllowed: z.literal(false),
    finalRenderBlockedWhilePending: z.literal(true),
  }).strict().optional(),
  maxAttempts: z.literal(2),
  attemptTimeoutSeconds: z.literal(3_600).optional(),
  scheduledDelaySeconds: z.literal(0).optional(),
  maximumCreditBudget:
    z.number().int().positive().max(10_000_000)
      .optional(),
  required: z.literal(true),
}).passthrough()

export function assertCanonicalLivingFrameRembgGpuMaskWorkItem(
  value: unknown,
): void {
  const parsed =
    rembgGpuMaskWorkItemSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'Living Frame rembg work item is not the exact bounded GPU-only shape.',
    )
  }
  const workItem = parsed.data
  const payload =
    workItem.executionInput.structuredPayload
  const source = payload.sourceFrameDependency
  const output = workItem.expectedOutputs[0]
  const profile = getProductionToolProfile('rembg')
  const operation =
    resolveCompleteProfessionalToolOperationSpec(
      'rembg',
    )
  if (
    !profile
    || profile.workerType !== 'gpu_ai_worker'
    || !profile.gpuRequired
    || profile.cpuAllowed
    || !operation
    || operation.canonicalToolId !== 'rembg'
    || !operation.allowedOperationIds.includes(
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
    )
    || workItem.workItemKey ===
      source.workItemKey
    || !workItem.dependencyKeys.includes(
      source.workItemKey,
    )
    || !source.workItemKey.endsWith(
      '-exact-source-frame-png',
    )
    || workItem.sourceSequenceItemIds[0] !==
      source.sourceSequenceItemId
    || workItem.sourceCleanupDecisionIds[0] !==
      source.sourceCleanupDecisionId
    || workItem.executionInput
      .expectedOutputKeys[0] !== output.outputKey
  ) {
    throw invalid(
      'Living Frame rembg work item lost its exact tool, CUDA-only placement, source dependency, or output authority.',
    )
  }
}

function invalid(message: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_rembg_gpu_mask_authority',
    },
  )
}
