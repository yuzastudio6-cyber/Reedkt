import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
  type LivingFrameControlledIllustrationActualCostLocator,
  type LivingFrameControlledIllustrationActualCostScope,
  type LivingFrameControlledIllustrationExactReuseEvidence,
} from '../../src/types/living-frame-controlled-illustration-actual-cost-attribution'
import { ApiError } from '../errors/api-error'
import {
  readPrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  createLivingFrameControlledIllustrationCanonicalActualCostReader,
  type LivingFrameControlledIllustrationActualCostReaderPort,
} from './living-frame-controlled-illustration-actual-cost-attribution'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const scopeSchema = z.object({
  ownerUserId: z.string().regex(SAFE_ID),
  workspaceId: z.string().regex(SAFE_ID),
  projectId: z.string().regex(SAFE_ID),
  editSessionId: z.string().regex(SAFE_ID),
  approvedPlanSnapshotId: z.string().regex(SAFE_ID),
  approvedPlanSnapshotHashSha256: z.string().regex(SHA256),
  packageRecordId: z.string().regex(SAFE_ID),
  packageHashSha256: z.string().regex(SHA256),
}).strict()

const attemptLocatorSchema = z.object({
  order: z.number().int().nonnegative().max(999),
  executionAttemptId: z.string().regex(SAFE_ID),
}).strict()

const sourceBundleSchema = z.object({
  canonicalScope: scopeSchema,
  operationPreflight: z.unknown(),
  attemptLocators: z.array(attemptLocatorSchema).max(1_000),
  exactReuseEvidence: z.array(z.unknown()).max(1_000),
}).strict().superRefine((value, context) => {
  if (
    value.attemptLocators.length === 0
    && value.exactReuseEvidence.length === 0
  ) {
    context.addIssue({
      code: 'custom',
      message: 'At least one canonical attempt locator or exact reuse is required.',
    })
  }
  value.attemptLocators.forEach((locator, order) => {
    if (locator.order !== order) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical attempt locator order must be contiguous.',
      })
    }
  })
  if (
    new Set(value.attemptLocators.map((entry) =>
      entry.executionAttemptId)).size !== value.attemptLocators.length
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical attempt locator identity is duplicated.',
    })
  }
})

export interface LivingFrameControlledIllustrationActualCostSourceBundle {
  readonly canonicalScope:
    LivingFrameControlledIllustrationActualCostScope
  readonly operationPreflight: unknown
  readonly attemptLocators: readonly {
    readonly order: number
    readonly executionAttemptId: string
  }[]
  readonly exactReuseEvidence:
    readonly LivingFrameControlledIllustrationExactReuseEvidence[]
}

export interface LivingFrameControlledIllustrationActualCostSourceResolver {
  (
    locator: LivingFrameControlledIllustrationActualCostLocator,
  ): Promise<LivingFrameControlledIllustrationActualCostSourceBundle>
}

/**
 * Adapts the existing canonical private worker-resource evidence repository to
 * Living Frame cost attribution. The caller supplies only an opaque locator;
 * repository paths and attempt identities are resolved by the injected server
 * closure. This adapter creates no new store and grants no billing, settlement,
 * dispatch, provider, tool, or production authority.
 */
export function createLivingFrameControlledIllustrationCanonicalRepositoryCostReader(
  input: {
    readonly privateCostEvidenceStorageRoot: string
    readonly resolveSourceBundle:
      LivingFrameControlledIllustrationActualCostSourceResolver
  },
): LivingFrameControlledIllustrationActualCostReaderPort {
  if (
    !input.privateCostEvidenceStorageRoot.trim()
    || typeof input.resolveSourceBundle !== 'function'
  ) {
    throw blocked('Canonical Living Frame actual-cost repository configuration is missing.')
  }
  const resolveSourceBundle = input.resolveSourceBundle.bind(undefined)
  const privateCostEvidenceStorageRoot =
    input.privateCostEvidenceStorageRoot
  return createLivingFrameControlledIllustrationCanonicalActualCostReader(
    async (rawLocator) => {
      const locator = parseLocator(rawLocator)
      const sourceBundle = sourceBundleSchema.parse(
        await resolveSourceBundle(locator),
      )
      const attemptEvidence = []
      for (const attemptLocator of sourceBundle.attemptLocators) {
        const evidence =
          await readPrivateWorkerResourceUsageCostEvidence({
            localStorageRoot: privateCostEvidenceStorageRoot,
            ownerUserId: sourceBundle.canonicalScope.ownerUserId,
            workspaceId: sourceBundle.canonicalScope.workspaceId,
            projectId: sourceBundle.canonicalScope.projectId,
            executionAttemptId:
              attemptLocator.executionAttemptId,
          })
        if (!evidence) {
          throw blocked('Canonical Living Frame attempt-cost evidence is missing.')
        }
        if (
          evidence.evidenceClass !==
            'private_embedded_observed_usage_test'
          && evidence.evidenceClass !==
            'canonical_backend_observed_usage_unreleased'
        ) {
          throw blocked('Canonical Living Frame attempt-cost evidence is not repository-derived.')
        }
        attemptEvidence.push(evidence)
      }
      return {
        sourceAuthority:
          'canonical_private_worker_resource_usage_repository' as const,
        evidenceClass:
          'canonical_private_attempt_cost_repository_unreleased' as const,
        productionReady: false as const,
        canonicalScope: sourceBundle.canonicalScope,
        operationPreflight: sourceBundle.operationPreflight,
        attemptEvidence,
        exactReuseEvidence: sourceBundle.exactReuseEvidence,
      }
    },
  )
}

function parseLocator(
  rawLocator: LivingFrameControlledIllustrationActualCostLocator,
): LivingFrameControlledIllustrationActualCostLocator {
  const parsed = z.object({
    schemaVersion: z.literal(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
    ),
    serverOwnedLocatorId: z.string().regex(SAFE_ID),
  }).strict().safeParse(rawLocator)
  if (!parsed.success) {
    throw invalid('Canonical Living Frame actual-cost locator is invalid.')
  }
  return parsed.data
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    actualCostAuthority: false,
    productionReady: false,
  })
}

function blocked(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    actualCostAuthority: false,
    productionReady: false,
  })
}
