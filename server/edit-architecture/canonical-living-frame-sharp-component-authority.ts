import { z } from 'zod'

import {
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import { ApiError } from '../errors/api-error'
import {
  getProductionToolProfile,
} from '../tool-registry'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  validateOfflineSharpPlanningPayload,
} from '../tool-execution/node-runner-execution'

const safeKeySchema = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const outputSchema = z.object({
  outputKey: safeKeySchema,
  artifactType: z.literal(
    'living_frame_component_rgba_png',
  ),
  assetRole: z.literal('processed'),
  required: z.literal(true),
  previewPlaceholderAllowed: z.literal(false),
  contentType: z.literal('image/png'),
  segmentIds: z.array(safeKeySchema).min(1).max(128),
  timingIds: z.array(safeKeySchema).min(1).max(128),
  rendererLayerIds: z.array(safeKeySchema).min(1).max(128),
}).passthrough()

const sharpComponentWorkItemSchema = z.object({
  workItemKey: safeKeySchema,
  workItemType: z.literal('process_image_asset'),
  workerClass: z.literal(
    CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS,
  ),
  executionInput: z.object({
    operation: z.literal(
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
    ),
    approvedToolOperationIds: z.tuple([
      z.literal(
        CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
      ),
    ]),
    expectedOutputKeys: z.tuple([safeKeySchema]),
    structuredPayload: z.object({
      imageRecipeId: z.literal(
        CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE,
      ),
      outputFormat: z.literal('png'),
      outputWidth: z.number().int().positive().max(4_096),
      outputHeight: z.number().int().positive().max(4_096),
      preserveMetadata: z.literal(false),
      allowUpscale: z.literal(false),
    }).strict(),
  }).strict(),
  sourceSequenceItemIds: z.tuple([safeKeySchema]),
  sourceCleanupDecisionIds: z.tuple([safeKeySchema]),
  expectedOutputs: z.tuple([outputSchema]),
  dependencyKeys: z.array(safeKeySchema)
    .length(2)
    .refine((values) =>
      new Set(values).size === values.length),
  approvedToolIds: z.tuple([z.literal('sharp')]),
  providerExecutionMode: z.literal('none'),
  fallbackPolicy: z.object({
    policy: z.literal(
      'block_living_frame_branch_until_source_mask_component_and_alpha_qa_pass',
    ),
    unapprovedFallbackAllowed: z.literal(false),
    finalRenderBlockedWhilePending: z.literal(true),
  }).strict(),
  maxAttempts: z.literal(2),
  attemptTimeoutSeconds: z.literal(300),
  scheduledDelaySeconds: z.literal(0),
  maximumCreditBudget:
    z.number().int().positive().max(10_000_000),
  required: z.literal(true),
}).passthrough()

export function assertCanonicalLivingFrameSharpComponentWorkItem(
  value: unknown,
): void {
  const parsed =
    sharpComponentWorkItemSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'Living Frame Sharp component work item is not the exact bounded two-input alpha shape.',
    )
  }
  const workItem = parsed.data
  const planning = validateOfflineSharpPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  const output = workItem.expectedOutputs[0]
  const sourceFrameKeys = workItem.dependencyKeys.filter(
    (dependencyKey) =>
      dependencyKey.endsWith(
        '-exact-source-frame-png',
      ),
  )
  const maskKeys = workItem.dependencyKeys.filter(
    (dependencyKey) =>
      !dependencyKey.endsWith(
        '-exact-source-frame-png',
      ),
  )
  const profile = getProductionToolProfile('sharp')
  const operation =
    resolveCompleteProfessionalToolOperationSpec(
      'sharp',
    )
  if (
    planning.imageRecipeId !==
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE
    || planning.outputFormat !== 'png'
    || planning.outputWidth *
      planning.outputHeight > 16_777_216
    || sourceFrameKeys.length !== 1
    || maskKeys.length !== 1
    || maskKeys[0] === workItem.workItemKey
    || workItem.executionInput
      .expectedOutputKeys[0] !== output.outputKey
    || !profile
    || profile.workerType !== 'render_worker'
    || profile.gpuRequired
    || !profile.cpuAllowed
    || !operation
    || operation.canonicalToolId !== 'sharp'
    || !operation.allowedOperationIds.includes(
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
    )
  ) {
    throw invalid(
      'Living Frame Sharp component work item lost its exact source-frame, mask, output, dimensions, or tool authority.',
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
        'canonical_living_frame_sharp_component_authority',
    },
  )
}
