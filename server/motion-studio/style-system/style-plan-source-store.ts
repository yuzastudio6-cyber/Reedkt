import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  storytellingMotionStylePlanReviewInputSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  StorytellingMotionStyleSelection,
  StorytellingMotionStylePlanReviewInput,
  StyleCalibrationPlan,
} from '../../../src/types/motion-studio'
import { projectCanonicalStorytellingStyleAuthority } from '../../../src/lib/canonical-planning-draft'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { findApprovedSnapshotSecretLikePaths } from '../../services/approved-snapshot-validation'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  createStorytellingMotionStyleSelection,
  createStyleCalibrationPlan,
  verifyStorytellingStyleAuthorityDigest,
} from './authority'
import {
  verifyCanonicalApprovedStorytellingStyleBinding,
  type CanonicalApprovedStorytellingStyleBinding,
} from './canonical-approved-style-binding'

export const MOTION_STUDIO_STORYTELLING_STYLE_PLAN_SOURCE_RECORD_VERSION =
  'motion-studio.storytelling-style-plan-source-record.v1' as const

const MAX_RECORD_BYTES = 512 * 1024
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const sourceRecordSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_STYLE_PLAN_SOURCE_RECORD_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_storytelling_style_planning_service',
  ),
  evidenceClass: z.literal(
    'private_local_content_addressed_motion_planning_source',
  ),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  styleSelectionDigest: digestSchema,
  calibrationPlanId: stableIdSchema,
  calibrationPlanDigest: digestSchema,
  planReviewInputDigest: digestSchema,
  canonicalProjectionDigest: digestSchema,
  planReviewInput: storytellingMotionStylePlanReviewInputSchema,
  sourceRepositoryReverified: z.literal(true),
  privateLocalOnly: z.literal(true),
  createOnly: z.literal(true),
  planApprovalAuthorityGranted: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  recordDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const plan = value.planReviewInput
  if (
    !verifyStorytellingStyleAuthorityDigest(plan.styleSelection) ||
    !verifyStorytellingStyleAuthorityDigest(plan.calibrationPlan)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['planReviewInput'],
      message: 'Storytelling style planning source failed immutable authority verification.',
    })
  }
  if (
    plan.workspaceId !== value.workspaceId ||
    plan.projectId !== value.projectId ||
    plan.editSessionId !== value.editSessionId ||
    plan.productionId !== value.productionId ||
    plan.styleSelection.selectionDigest !== value.styleSelectionDigest ||
    plan.calibrationPlan.id !== value.calibrationPlanId ||
    plan.calibrationPlan.planDigest !== value.calibrationPlanDigest ||
    sha256CanonicalJson(plan) !== value.planReviewInputDigest ||
    sha256AuthorityValue(projectCanonicalStorytellingStyleAuthority(plan)) !==
      value.canonicalProjectionDigest
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Storytelling style planning source changed its exact scope, plan, or canonical projection.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.recordDigest
  if (sha256CanonicalJson(unsigned) !== value.recordDigest) {
    context.addIssue({
      code: 'custom',
      path: ['recordDigest'],
      message: 'Storytelling style planning source record digest verification failed.',
    })
  }
})

export type StorytellingStylePlanSourceRecord = z.infer<
  typeof sourceRecordSchema
>

export interface StorytellingStylePlanSourceStore {
  persist(
    planReviewInput: StorytellingMotionStylePlanReviewInput,
  ): Promise<{ record: StorytellingStylePlanSourceRecord; created: boolean }>
  read(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    calibrationPlanDigest: string
    expectedCanonicalProjectionDigest: string
  }): Promise<StorytellingStylePlanSourceRecord>
}

export interface CanonicalApprovedStorytellingStylePlanSource {
  sourceRecordVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_PLAN_SOURCE_RECORD_VERSION
  sourcePlanReviewInputDigest: string
  canonicalProjectionDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedStyleSelection: StorytellingMotionStyleSelection
  approvedCalibrationPlan: StyleCalibrationPlan
  sourceRepositoryReverified: true
  runtimeExecutionAuthorized: false
  providerExecutionAuthorized: false
  customerCommercialAuthorityGranted: false
  immutable: true
}

/**
 * Private, content-addressed source archive for the complete Motion-owned style
 * planning input. The canonical plan remains the only approval and execution
 * authority; this record only lets a later server reader re-open the exact
 * scenario, route, reference, and internal-cost details that its bounded
 * canonical projection identifies by digest.
 */
export function createStorytellingStylePlanSourceStore(input: {
  localStorageRoot: string
}): StorytellingStylePlanSourceStore {
  return {
    async persist(value) {
      const plan = validatePlanReviewInput(value)
      const base = sourceRecordBase(plan)
      const record = parseRecord({
        ...base,
        recordDigest: sha256CanonicalJson(base),
      })
      const bytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
      if (bytes.byteLength > MAX_RECORD_BYTES) {
        throw invalid('Storytelling style planning source exceeds its private byte ceiling.', {
          byteLength: bytes.byteLength,
          maximumBytes: MAX_RECORD_BYTES,
        })
      }
      const written = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(record),
        content: bytes,
      })
      const readback = await readRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath: relativePath(record),
      })
      if (sha256CanonicalJson(readback) !== sha256CanonicalJson(record)) {
        throw conflict('Storytelling style planning source changed during create-only persistence.')
      }
      return { record, created: written.created }
    },

    async read(value) {
      const scope = parseScope(value)
      const path = relativePath({
        ...scope,
        calibrationPlanDigest: value.calibrationPlanDigest,
      })
      const record = await readRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath: path,
      })
      if (
        record.workspaceId !== scope.workspaceId ||
        record.projectId !== scope.projectId ||
        record.editSessionId !== scope.editSessionId ||
        record.productionId !== scope.productionId ||
        record.calibrationPlanDigest !== value.calibrationPlanDigest ||
        record.canonicalProjectionDigest !==
          value.expectedCanonicalProjectionDigest
      ) {
        throw conflict('Storytelling style planning source does not match the exact canonical production authority.')
      }
      return record
    },
  }
}

/**
 * Rehydrates the complete post-approval Motion plan from the private planning
 * source and the one canonical approved snapshot binding. The canonical
 * snapshot remains the sole approval authority; this projection only restores
 * fields that the bounded canonical component intentionally omits.
 */
export function createCanonicalApprovedStorytellingStylePlanSource(input: {
  record: StorytellingStylePlanSourceRecord
  binding: CanonicalApprovedStorytellingStyleBinding
}): CanonicalApprovedStorytellingStylePlanSource {
  const record = parseRecord(input.record)
  const binding = input.binding
  if (!verifyCanonicalApprovedStorytellingStyleBinding(binding)) {
    throw conflict('Canonical approved Storytelling style binding failed exact verification.')
  }
  const component = binding.canonicalStyleComponent
  const plan = record.planReviewInput
  if (
    record.workspaceId !== binding.workspaceId ||
    record.projectId !== binding.projectId ||
    record.editSessionId !== binding.editSessionId ||
    record.productionId !== binding.productionId ||
    record.canonicalProjectionDigest !== component.componentDigest ||
    record.calibrationPlanDigest !== component.authority.calibrationPlan.planDigest ||
    plan.styleSelection.selectionDigest !==
      component.authority.styleSelection.selectionDigest ||
    plan.internalCostEstimateId !== component.authority.internalCostEnvelope.estimateId ||
    plan.internalCostEstimateDigest !==
      component.authority.internalCostEnvelope.estimateDigest
  ) {
    throw conflict(
      'Storytelling style planning source does not match the canonical approved snapshot component.',
    )
  }

  const approvedSnapshot = binding.approvedSnapshot
  const approvedStyleSelection = createStorytellingMotionStyleSelection({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    id: derivedId('style-selection-approved', approvedSnapshot.snapshotHash),
    productionId: plan.productionId,
    styleProfile: plan.styleSelection.styleProfile,
    motionLanguage: plan.styleSelection.motionLanguage,
    motionDnaVersion: plan.styleSelection.motionDnaVersion,
    referenceContractVersions: plan.styleSelection.referenceContractVersions,
    sourceAuditDigests: plan.styleSelection.sourceAuditDigests,
    selectionOrigin: plan.styleSelection.selectionOrigin,
    matchedInputAliases: plan.styleSelection.matchedInputAliases,
    customizationNotes: plan.styleSelection.customizationNotes,
    state: 'approved_snapshot_bound',
    approvedPlanSnapshotId: approvedSnapshot.snapshotId,
    approvedPlanSnapshotDigest: approvedSnapshot.snapshotHash,
  })
  const approvedCalibrationPlan = createStyleCalibrationPlan({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    id: derivedId('style-calibration-approved', approvedSnapshot.snapshotHash),
    productionId: plan.productionId,
    styleSelectionDigest: approvedStyleSelection.selectionDigest,
    styleProfile: plan.calibrationPlan.styleProfile,
    motionLanguage: plan.calibrationPlan.motionLanguage,
    motionDnaVersion: plan.calibrationPlan.motionDnaVersion,
    routePolicy: plan.calibrationPlan.routePolicy,
    scenarios: plan.calibrationPlan.scenarios,
    estimatedInternalCostRangeMicros:
      plan.calibrationPlan.estimatedInternalCostRangeMicros,
    approvalAuthority: {
      state: 'approved_bounded_execution',
      approvedPlanSnapshotId: approvedSnapshot.snapshotId,
      approvedPlanSnapshotDigest: approvedSnapshot.snapshotHash,
      approvedEstimateId: plan.internalCostEstimateId,
      approvedEstimateDigest: plan.internalCostEstimateDigest,
      maximumAuthorizedInternalCostMicros:
        component.authority.internalCostEnvelope
          .maximumEstimatedInternalProductionCostMicros,
      customerPriceIncluded: false,
      customerCreditsMutated: false,
    },
  }, approvedStyleSelection)

  return deepFreeze({
    sourceRecordVersion: record.schemaVersion,
    sourcePlanReviewInputDigest: record.planReviewInputDigest,
    canonicalProjectionDigest: record.canonicalProjectionDigest,
    approvedSnapshotId: approvedSnapshot.snapshotId,
    approvedSnapshotDigest: approvedSnapshot.snapshotHash,
    approvedStyleSelection,
    approvedCalibrationPlan,
    sourceRepositoryReverified: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    immutable: true as const,
  })
}

function validatePlanReviewInput(
  value: StorytellingMotionStylePlanReviewInput,
): StorytellingMotionStylePlanReviewInput {
  const plan = storytellingMotionStylePlanReviewInputSchema.parse(value)
  if (
    !verifyStorytellingStyleAuthorityDigest(plan.styleSelection) ||
    !verifyStorytellingStyleAuthorityDigest(plan.calibrationPlan)
  ) {
    throw invalid('Storytelling style planning source failed immutable authority verification.')
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(plan)
  if (secretLikePaths.length > 0) {
    throw invalid('Storytelling style planning source contains secret-like fields or values.', {
      secretLikePaths,
    })
  }
  return plan
}

function sourceRecordBase(plan: StorytellingMotionStylePlanReviewInput) {
  return {
    schemaVersion:
      MOTION_STUDIO_STORYTELLING_STYLE_PLAN_SOURCE_RECORD_VERSION,
    sourceAuthority:
      'motion_studio_storytelling_style_planning_service' as const,
    evidenceClass:
      'private_local_content_addressed_motion_planning_source' as const,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    styleSelectionDigest: plan.styleSelection.selectionDigest,
    calibrationPlanId: plan.calibrationPlan.id,
    calibrationPlanDigest: plan.calibrationPlan.planDigest,
    planReviewInputDigest: sha256CanonicalJson(plan),
    canonicalProjectionDigest: sha256AuthorityValue(
      projectCanonicalStorytellingStyleAuthority(plan),
    ),
    planReviewInput: plan,
    sourceRepositoryReverified: true as const,
    privateLocalOnly: true as const,
    createOnly: true as const,
    planApprovalAuthorityGranted: false as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    immutable: true as const,
  }
}

async function readRecord(input: {
  localStorageRoot: string
  relativePath: string
}): Promise<StorytellingStylePlanSourceRecord> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (!bytes) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'The exact Storytelling style planning source is not available for source verification.',
      503,
      {
        requiredGate: 'motion_studio_storytelling_style_plan_source_repository',
        productionReady: false,
      },
    )
  }
  if (bytes.byteLength < 256 || bytes.byteLength > MAX_RECORD_BYTES) {
    throw invalid('Storytelling style planning source has an invalid private byte length.')
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Storytelling style planning source is not valid JSON.')
  }
  return parseRecord(value)
}

function parseRecord(value: unknown): StorytellingStylePlanSourceRecord {
  const parsed = sourceRecordSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'Storytelling style planning source failed schema or digest verification.',
      { validation: parsed.error.flatten() },
    )
  }
  return deepFreeze(parsed.data)
}

function parseScope(value: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  calibrationPlanDigest: string
  expectedCanonicalProjectionDigest: string
}) {
  const parsed = z.object({
    workspaceId: stableIdSchema,
    projectId: stableIdSchema,
    editSessionId: stableIdSchema,
    productionId: stableIdSchema,
    calibrationPlanDigest: digestSchema,
    expectedCanonicalProjectionDigest: digestSchema,
  }).strict().parse(value)
  return parsed
}

function relativePath(value: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  calibrationPlanDigest: string
}): string {
  const scopeHash = createHash('sha256').update(sha256CanonicalJson({
    workspaceId: value.workspaceId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    productionId: value.productionId,
  }), 'utf8').digest('hex')
  return [
    'motion-studio',
    'storytelling-style-plan-sources',
    'private-v1',
    scopeHash.slice(0, 2),
    scopeHash,
    `${value.calibrationPlanDigest}.json`,
  ].join('/')
}

function derivedId(prefix: string, digest: string): string {
  return `${prefix}-${digest.slice(0, 24)}`
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
