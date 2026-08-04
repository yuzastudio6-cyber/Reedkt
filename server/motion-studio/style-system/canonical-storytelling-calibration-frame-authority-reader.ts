import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { createEditPlanningAuthorityService } from '../../services/edit-planning-authority-service'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import type { ServiceContext } from '../../types'
import {
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_COMPONENT_KEY,
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
} from '../../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_CANONICAL_STORYTELLING_CALIBRATION_FRAME_AUTHORITY_VERSION =
  'motion-studio.canonical-storytelling-calibration-frame-authority.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

export const canonicalStorytellingCalibrationFrameAuthoritySchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_STORYTELLING_CALIBRATION_FRAME_AUTHORITY_VERSION,
  ),
  sourceAuthority: z.enum([
    'canonical_approved_storytelling_production_authority',
    'controlled_storytelling_production_authority_fixture',
  ]),
  evidenceClass: z.enum([
    'canonical_backend_runtime_unreleased',
    'controlled_test_fixture',
  ]),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  storytellingStyleComponentDigest: digestSchema,
  storytellingProductionAuthorityRefDigest: digestSchema,
  storytellingProductionAuthorityHash: digestSchema,
  masterTimingPlanVersionId: stableIdSchema,
  confirmedFrameId: stableIdSchema,
  timingAuthorityDigest: digestSchema,
  width: z.number().int().positive().max(8_192),
  height: z.number().int().positive().max(8_192),
  aspectRatio: z.string().trim().min(1).max(40),
  frameRate: z.union([z.literal(24), z.literal(30)]),
  durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  timebase: z.string().trim().min(1).max(40),
  approvedSnapshotSourceReverified: z.literal(true),
  storytellingProductionAuthorityReverified: z.literal(true),
  confirmedFrameAndTimingReverified: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  productionReady: z.literal(false),
  authorityReceiptDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.authorityReceiptDigest
  const sourceClassMatches =
    value.sourceAuthority ===
      'canonical_approved_storytelling_production_authority'
      ? value.evidenceClass === 'canonical_backend_runtime_unreleased'
      : value.evidenceClass === 'controlled_test_fixture'
  if (
    !sourceClassMatches ||
    value.timebase !== `${value.frameRate}/1` ||
    sha256CanonicalJson(unsigned) !== value.authorityReceiptDigest
  ) {
    context.addIssue({
      code: 'custom',
      message:
        'Canonical Storytelling calibration frame authority failed timing or digest reconciliation.',
    })
  }
})

export type CanonicalStorytellingCalibrationFrameAuthority = z.infer<
  typeof canonicalStorytellingCalibrationFrameAuthoritySchema
>

export interface CanonicalStorytellingCalibrationFrameAuthorityReaderPort {
  read(input: {
    approvedSnapshotId: string
    workspaceId: string
  }): Promise<CanonicalStorytellingCalibrationFrameAuthority>
}

/**
 * Reopens the exact canonical approved snapshot and projects only the
 * Storytelling production frame/timing fields needed to validate a bounded
 * calibration proxy. No caller-supplied frame, timing, media, or execution
 * value becomes authority.
 */
export function createCanonicalStorytellingCalibrationFrameAuthorityReader(
  context: ServiceContext,
): CanonicalStorytellingCalibrationFrameAuthorityReaderPort {
  return {
    async read(input) {
      const executionAuthority = await createEditPlanningAuthorityService(
        context,
      ).loadApprovedExecutionAuthority(
        input.approvedSnapshotId,
        input.workspaceId,
      )
      const productionAuthority =
        canonicalMotionStudioStorytellingProductionAuthoritySchema.parse(
          executionAuthority.components
            .motionStudioStorytellingProductionAuthority,
        )
      const snapshotRef = executionAuthority.snapshot.componentRefs[
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_COMPONENT_KEY
      ]
      const planRef = executionAuthority.plan.componentRefs[
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_COMPONENT_KEY
      ]
      if (
        !snapshotRef ||
        !planRef ||
        snapshotRef.sha256 !== planRef.sha256 ||
        snapshotRef.byteLength !== planRef.byteLength ||
        snapshotRef.sha256 !== sha256AuthorityValue(productionAuthority)
      ) {
        throw conflict(
          'Canonical Storytelling production authority changed between plan and approved snapshot.',
        )
      }
      return projectFrameAuthority({
        approvedSnapshotId: executionAuthority.snapshot.snapshotId,
        approvedSnapshotDigest: executionAuthority.snapshot.snapshotHash,
        storytellingStyleComponentDigest:
          productionAuthority.storytellingStyleAuthority.componentDigest,
        storytellingProductionAuthorityRefDigest: snapshotRef.sha256,
        storytellingProductionAuthorityHash: productionAuthority.authorityHash,
        productionAuthority,
      })
    },
  }
}

export async function reopenCanonicalStorytellingCalibrationFrameAuthority(
  input: {
    context: ServiceContext
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    /** Test-only dependency injection. Production callers omit this value. */
    sourceReader?: CanonicalStorytellingCalibrationFrameAuthorityReaderPort
  },
): Promise<CanonicalStorytellingCalibrationFrameAuthority> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  if (input.sourceReader && input.context.env.nodeEnv !== 'test') {
    throw notReady(
      'Injected Storytelling calibration frame readers are limited to controlled tests.',
    )
  }
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const authority = canonicalStorytellingCalibrationFrameAuthoritySchema.parse(
    await (
      input.sourceReader ??
      createCanonicalStorytellingCalibrationFrameAuthorityReader(input.context)
    ).read({
      approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
      workspaceId: plan.workspaceId,
    }),
  )
  if (
    (input.sourceReader
      ? authority.evidenceClass !== 'controlled_test_fixture'
      : authority.evidenceClass !== 'canonical_backend_runtime_unreleased') ||
    authority.workspaceId !== plan.workspaceId ||
    authority.projectId !== plan.projectId ||
    authority.editSessionId !== plan.editSessionId ||
    authority.productionId !== plan.productionId ||
    authority.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    authority.approvedSnapshotDigest !==
      input.approvedPlanSource.approvedSnapshotDigest ||
    authority.storytellingStyleComponentDigest !==
      input.approvedPlanSource.canonicalProjectionDigest
  ) {
    throw conflict(
      'Canonical Storytelling calibration frame authority changed project, edit, snapshot, or style identity.',
    )
  }
  return authority
}

export function createControlledTestStorytellingCalibrationFrameAuthority(
  input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    approvedSnapshotId: string
    approvedSnapshotDigest: string
    storytellingStyleComponentDigest: string
    storytellingProductionAuthorityRefDigest: string
    storytellingProductionAuthorityHash: string
    masterTimingPlanVersionId: string
    confirmedFrameId: string
    timingAuthorityDigest: string
    width: number
    height: number
    aspectRatio: string
    frameRate: 24 | 30
    durationFrames: number
  },
): CanonicalStorytellingCalibrationFrameAuthority {
  const base = {
    schemaVersion:
      MOTION_STUDIO_CANONICAL_STORYTELLING_CALIBRATION_FRAME_AUTHORITY_VERSION,
    sourceAuthority:
      'controlled_storytelling_production_authority_fixture' as const,
    evidenceClass: 'controlled_test_fixture' as const,
    workspaceId: stableIdSchema.parse(input.workspaceId),
    projectId: stableIdSchema.parse(input.projectId),
    editSessionId: stableIdSchema.parse(input.editSessionId),
    productionId: stableIdSchema.parse(input.productionId),
    approvedSnapshotId: stableIdSchema.parse(input.approvedSnapshotId),
    approvedSnapshotDigest: digestSchema.parse(input.approvedSnapshotDigest),
    storytellingStyleComponentDigest: digestSchema.parse(
      input.storytellingStyleComponentDigest,
    ),
    storytellingProductionAuthorityRefDigest: digestSchema.parse(
      input.storytellingProductionAuthorityRefDigest,
    ),
    storytellingProductionAuthorityHash: digestSchema.parse(
      input.storytellingProductionAuthorityHash,
    ),
    masterTimingPlanVersionId: stableIdSchema.parse(
      input.masterTimingPlanVersionId,
    ),
    confirmedFrameId: stableIdSchema.parse(input.confirmedFrameId),
    timingAuthorityDigest: digestSchema.parse(input.timingAuthorityDigest),
    width: z.number().int().positive().max(8_192).parse(input.width),
    height: z.number().int().positive().max(8_192).parse(input.height),
    aspectRatio: z.string().trim().min(1).max(40).parse(input.aspectRatio),
    frameRate: z.union([z.literal(24), z.literal(30)]).parse(input.frameRate),
    durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
      .parse(input.durationFrames),
    timebase: `${input.frameRate}/1`,
    approvedSnapshotSourceReverified: true as const,
    storytellingProductionAuthorityReverified: true as const,
    confirmedFrameAndTimingReverified: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(canonicalStorytellingCalibrationFrameAuthoritySchema.parse({
    ...base,
    authorityReceiptDigest: sha256CanonicalJson(base),
  }))
}

function projectFrameAuthority(input: {
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  storytellingStyleComponentDigest: string
  storytellingProductionAuthorityRefDigest: string
  storytellingProductionAuthorityHash: string
  productionAuthority: z.infer<
    typeof canonicalMotionStudioStorytellingProductionAuthoritySchema
  >
}): CanonicalStorytellingCalibrationFrameAuthority {
  const timing = input.productionAuthority.timingAuthority
  const base = {
    schemaVersion:
      MOTION_STUDIO_CANONICAL_STORYTELLING_CALIBRATION_FRAME_AUTHORITY_VERSION,
    sourceAuthority:
      'canonical_approved_storytelling_production_authority' as const,
    evidenceClass: 'canonical_backend_runtime_unreleased' as const,
    workspaceId: input.productionAuthority.workspaceId,
    projectId: input.productionAuthority.projectId,
    editSessionId: input.productionAuthority.editSessionId,
    productionId: input.productionAuthority.productionId,
    approvedSnapshotId: input.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedSnapshotDigest,
    storytellingStyleComponentDigest: input.storytellingStyleComponentDigest,
    storytellingProductionAuthorityRefDigest:
      input.storytellingProductionAuthorityRefDigest,
    storytellingProductionAuthorityHash:
      input.storytellingProductionAuthorityHash,
    masterTimingPlanVersionId: timing.masterTimingPlanVersionId,
    confirmedFrameId: timing.confirmedFrameId,
    timingAuthorityDigest: timing.timingAuthorityDigest,
    width: timing.width,
    height: timing.height,
    aspectRatio: timing.aspectRatio,
    frameRate: timing.frameRate,
    durationFrames: timing.durationFrames,
    timebase: timing.timebase,
    approvedSnapshotSourceReverified: true as const,
    storytellingProductionAuthorityReverified: true as const,
    confirmedFrameAndTimingReverified: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(canonicalStorytellingCalibrationFrameAuthoritySchema.parse({
    ...base,
    authorityReceiptDigest: sha256CanonicalJson(base),
  }))
}

function conflict(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_storytelling_calibration_frame_authority',
    productionReady: false,
  })
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_storytelling_calibration_frame_authority',
    productionReady: false,
  })
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
