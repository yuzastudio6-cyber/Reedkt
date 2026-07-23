import { z } from 'zod'

import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  motionStudioArtifactDataSchemaForKind,
  motionStudioArtifactPayloadSchema,
  motionStudioJsonValueSchema,
  motionStudioRegisteredExtensionSchema,
  validateMotionStudioDeepValue,
} from '../../src/lib/motion-studio/contracts'
import type {
  ApplyMotionStudioCommandRequest,
  ApproveMotionStudioArtifactVersionRequest,
  CreateMotionStudioArtifactVersionRequest,
  CreateMotionStudioProductionRequest,
} from '../../src/types/motion-studio'

const nonEmpty = z.string().trim().min(1)
const stableId = nonEmpty.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const createMotionStudioProductionRequestSchema = z.object({
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
}).strict() satisfies z.ZodType<CreateMotionStudioProductionRequest>

const provenanceInputSchema = z.object({
  sourceArtifactVersionIds: z.array(stableId).max(512),
  sourceAssetIds: z.array(stableId).max(512),
  skillRunIds: z.array(stableId).max(512),
  toolRunIds: z.array(stableId).max(512),
  providerAttemptIds: z.array(stableId).max(512),
  extensions: z.array(motionStudioRegisteredExtensionSchema).max(64).optional(),
}).strict()

const dependencyInputSchema = z.object({
  upstreamVersionId: z.string().uuid(),
  dependencyKind: z.enum([
    'requires_exact_version', 'derives_from', 'timing_authority',
    'style_authority', 'asset_input', 'approval_input',
  ]),
  invalidationPolicy: z.enum(['always', 'material_change', 'manual_review', 'never']),
}).strict()

export const createMotionStudioArtifactVersionRequestSchema = z.object({
  kind: z.enum(MOTION_STUDIO_ARTIFACT_KINDS),
  state: z.enum(['draft', 'in_review']),
  payload: motionStudioArtifactPayloadSchema,
  provenance: provenanceInputSchema,
  dependencies: z.array(dependencyInputSchema).max(128).readonly(),
}).strict().superRefine((value, context) => {
  const expectedSchemaVersion = `motion-studio.${value.kind.replaceAll('_', '-')}.v1`
  if (value.payload.schemaVersion !== expectedSchemaVersion) {
    context.addIssue({
      code: 'custom',
      path: ['payload', 'schemaVersion'],
      message: `Expected ${expectedSchemaVersion} for ${value.kind}.`,
    })
  }
  const artifactData = motionStudioArtifactDataSchemaForKind(value.kind).safeParse(value.payload.data)
  if (!artifactData.success) {
    for (const issue of artifactData.error.issues) {
      context.addIssue({
        code: 'custom',
        path: ['payload', 'data', ...issue.path],
        message: issue.message,
      })
    }
  }
  for (const error of validateMotionStudioDeepValue(value).errors) {
    context.addIssue({ code: 'custom', path: [], message: error })
  }
}) satisfies z.ZodType<CreateMotionStudioArtifactVersionRequest>

export const motionStudioCommandOperationRequestSchema = z.object({
  operationId: stableId,
  kind: z.enum([
    'create_version', 'set_property', 'insert_item', 'remove_item', 'move_item',
    'replace_asset', 'set_timing_reference', 'lock_property',
    'release_property_lock', 'request_approval', 'invalidate_dependencies',
  ]),
  targetPath: nonEmpty.max(1_000),
  value: motionStudioJsonValueSchema.optional(),
  expectedValueDigest: digest.optional(),
}).strict()

export const applyMotionStudioCommandRequestSchema = z.object({
  baseVersionId: z.string().uuid(),
  baseVersionDigest: digest,
  operations: z.array(motionStudioCommandOperationRequestSchema).min(1).max(128).readonly(),
  reason: nonEmpty.max(2_000),
}).strict().superRefine((value, context) => {
  const operationIds = new Set<string>()
  value.operations.forEach((operation, index) => {
    if (operationIds.has(operation.operationId)) {
      context.addIssue({
        code: 'custom',
        path: ['operations', index, 'operationId'],
        message: 'Command operation IDs must be unique.',
      })
    }
    operationIds.add(operation.operationId)
  })
}) satisfies z.ZodType<ApplyMotionStudioCommandRequest>

export const approveMotionStudioArtifactVersionRequestSchema = z.object({
  artifactVersionId: z.string().uuid(),
  artifactContentDigest: digest,
  approvedSnapshotId: z.string().uuid(),
  approvalKind: z.enum(['stage_artifact', 'expensive_work', 'picture_lock', 'delivery']),
}).strict() satisfies z.ZodType<ApproveMotionStudioArtifactVersionRequest>
