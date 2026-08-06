import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { createCanonicalPlanningHandoffService } from '../../services/canonical-planning-handoff-service'
import {
  createEditPlanningAuthorityService,
  type CanonicalApprovedExecutionAuthority,
} from '../../services/edit-planning-authority-service'
import {
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  type AuthorityJsonBlobRef,
} from '../../services/private-edit-authority-store'
import type { ServiceContext } from '../../types'
import { createMotionStudioCommandService } from '../commands'
import type { StorytellingStyleCalibrationEvidenceSource } from './calibration-review-projection'
import {
  createCanonicalApprovedStorytellingStyleBinding,
  verifyCanonicalApprovedStorytellingStyleBinding,
  type CanonicalApprovedStorytellingStyleBinding,
} from './canonical-approved-style-binding'
import type { StorytellingMotionStyleDecisionSource } from './decision-projection'
import {
  CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY,
  canonicalStorytellingStyleAuthoritySchema,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import {
  createCanonicalApprovedStorytellingStylePlanSource,
  createStorytellingStylePlanSourceStore,
  type CanonicalApprovedStorytellingStylePlanSource,
  type StorytellingStylePlanSourceStore,
} from './style-plan-source-store'

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const blobRefSchema = z.object({
  sha256: digest,
  byteLength: z.number().int().positive().max(2 * 1024 * 1024),
}).strict()
const publishedPlanReadSchema = z.object({
  plan: z.object({
    id: z.string().trim().min(1),
    projectId: z.string().trim().min(1),
    editSessionId: z.string().trim().min(1),
    status: z.enum([
      'presented',
      'approved',
      'superseded',
      'rejected',
      'cancellation_pending',
      'cancelled',
    ]),
    componentRefs: z.record(z.string(), blobRefSchema),
  }).passthrough(),
}).passthrough()

type CommandAuthority = Pick<
  ReturnType<typeof createMotionStudioCommandService>,
  'getProductionScopeById'
>
type PlanningHandoffAuthority = Pick<
  ReturnType<typeof createCanonicalPlanningHandoffService>,
  'inspectLatest'
>
type PlanningAuthority = Pick<
  ReturnType<typeof createEditPlanningAuthorityService>,
  'getCanonicalPlan' | 'getCanonicalPlanApproval' | 'loadApprovedExecutionAuthority'
>

export interface CanonicalStorytellingStyleReviewSourceDependencies {
  commandAuthority?: CommandAuthority
  planningHandoffAuthority?: PlanningHandoffAuthority
  planningAuthority?: PlanningAuthority
  readComponent?: (input: {
    localStorageRoot: string
    ref: AuthorityJsonBlobRef
  }) => Promise<Record<string, unknown> | unknown[]>
  createApprovedBinding?: (
    authority: CanonicalApprovedExecutionAuthority,
  ) => CanonicalApprovedStorytellingStyleBinding
  createApprovedStylePlanSource?: (input: {
    record: Awaited<ReturnType<StorytellingStylePlanSourceStore['read']>>
    binding: CanonicalApprovedStorytellingStyleBinding
  }) => CanonicalApprovedStorytellingStylePlanSource
  stylePlanSourceStore?: Pick<StorytellingStylePlanSourceStore, 'read'>
}

type ResolvedReviewSource = {
  decisionSource: StorytellingMotionStyleDecisionSource
  calibrationEvidence?: StorytellingStyleCalibrationEvidenceSource
}

/**
 * Reopens the exact canonical planning component for one owned Storytelling
 * production. It projects read-only decision state only; it creates no plan,
 * approval, execution package, queue item, provider attempt, or commercial
 * authority.
 */
export class CanonicalStorytellingStyleReviewSource {
  private readonly context: ServiceContext
  private readonly commandAuthority: CommandAuthority
  private readonly planningHandoffAuthority: PlanningHandoffAuthority
  private readonly planningAuthority: PlanningAuthority
  private readonly readComponent: NonNullable<
    CanonicalStorytellingStyleReviewSourceDependencies['readComponent']
  >
  private readonly createApprovedBinding: NonNullable<
    CanonicalStorytellingStyleReviewSourceDependencies['createApprovedBinding']
  >
  private readonly createApprovedStylePlanSource: NonNullable<
    CanonicalStorytellingStyleReviewSourceDependencies['createApprovedStylePlanSource']
  >
  private readonly stylePlanSourceStore: Pick<
    StorytellingStylePlanSourceStore,
    'read'
  >
  private readonly reads = new Map<string, Promise<ResolvedReviewSource>>()

  constructor(
    context: ServiceContext,
    dependencies: CanonicalStorytellingStyleReviewSourceDependencies = {},
  ) {
    this.context = context
    this.commandAuthority = dependencies.commandAuthority ??
      createMotionStudioCommandService(context)
    this.planningHandoffAuthority = dependencies.planningHandoffAuthority ??
      createCanonicalPlanningHandoffService(context)
    this.planningAuthority = dependencies.planningAuthority ??
      createEditPlanningAuthorityService(context)
    this.readComponent = dependencies.readComponent ?? readPrivateAuthorityJsonBlob
    this.createApprovedBinding = dependencies.createApprovedBinding ??
      createCanonicalApprovedStorytellingStyleBinding
    this.createApprovedStylePlanSource = dependencies.createApprovedStylePlanSource ??
      createCanonicalApprovedStorytellingStylePlanSource
    this.stylePlanSourceStore = dependencies.stylePlanSourceStore ??
      createStorytellingStylePlanSourceStore({
        localStorageRoot: context.env.localStorageRoot,
      })
  }

  async getStyleDecisionSource(
    productionId: string,
  ): Promise<StorytellingMotionStyleDecisionSource | undefined> {
    return (await this.resolve(productionId)).decisionSource
  }

  async getCalibrationEvidenceSource(
    productionId: string,
  ): Promise<StorytellingStyleCalibrationEvidenceSource | undefined> {
    return (await this.resolve(productionId)).calibrationEvidence
  }

  private resolve(productionId: string): Promise<ResolvedReviewSource> {
    const existing = this.reads.get(productionId)
    if (existing) return existing
    const pending = this.resolveUncached(productionId)
    this.reads.set(productionId, pending)
    void pending.catch(() => {
      if (this.reads.get(productionId) === pending) this.reads.delete(productionId)
    })
    return pending
  }

  private async resolveUncached(productionId: string): Promise<ResolvedReviewSource> {
    const scope = await this.commandAuthority.getProductionScopeById(productionId)
    let handoff: Awaited<ReturnType<PlanningHandoffAuthority['inspectLatest']>>
    try {
      handoff = await this.planningHandoffAuthority.inspectLatest({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PLAN_NOT_APPROVED' && error.status === 404) {
        return { decisionSource: { state: 'comparison_only' } }
      }
      throw error
    }

    if (handoff.publicationStatus === 'unpublished') {
      return { decisionSource: { state: 'comparison_only' } }
    }
    const planResult = await this.planningAuthority.getCanonicalPlan(
      handoff.publication.planId,
      scope.workspaceId,
    )
    const parsedPlan = publishedPlanReadSchema.safeParse(planResult.authority)
    if (!parsedPlan.success) {
      throw invalid('Canonical Storytelling plan readback is malformed.', parsedPlan.error.flatten())
    }
    const plan = parsedPlan.data.plan
    if (
      plan.id !== handoff.publication.planId ||
      plan.projectId !== scope.projectId ||
      plan.editSessionId !== scope.editSessionId ||
      plan.status !== handoff.publication.planStatus
    ) {
      throw conflict('Canonical Storytelling plan readback changed its exact publication identity.')
    }
    const componentRef = plan.componentRefs[
      CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY
    ]
    if (!componentRef) return { decisionSource: { state: 'comparison_only' } }

    const componentValue = await this.readComponent({
      localStorageRoot: this.context.env.localStorageRoot,
      ref: componentRef,
    })
    const parsedComponent = canonicalStorytellingStyleAuthoritySchema.safeParse(
      componentValue,
    )
    if (!parsedComponent.success) {
      throw invalid(
        'Canonical Storytelling style component is malformed.',
        parsedComponent.error.flatten(),
      )
    }
    const component = parsedComponent.data
    if (
      componentRef.sha256 !== sha256AuthorityValue(component) ||
      component.workspaceId !== scope.workspaceId ||
      component.projectId !== scope.projectId ||
      component.editSessionId !== scope.editSessionId ||
      component.productionId !== scope.productionId
    ) {
      throw conflict('Canonical Storytelling style component changed its exact production scope or digest.')
    }
    const sourceReadback = await this.readOptionalSourceRecord({
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      productionId: scope.productionId,
      calibrationPlanDigest: component.calibrationPlan.planDigest,
      expectedCanonicalProjectionDigest: componentRef.sha256,
    })

    if (plan.status === 'presented') {
      return {
        decisionSource: {
          state: 'canonical_awaiting_plan_review',
          authority: component,
          componentDigest: componentRef.sha256,
          sourceRepositoryReverified: sourceReadback !== undefined,
          ...(sourceReadback
            ? { sourcePlanReviewInputDigest: sourceReadback.planReviewInputDigest }
            : {}),
        },
      }
    }
    if (plan.status !== 'approved') {
      throw conflict('Latest canonical Storytelling style plan is superseded and requires a fresh planning handoff.')
    }

    const approval = await this.planningAuthority.getCanonicalPlanApproval(
      plan.id,
      scope.workspaceId,
    )
    if (!approval.approval) {
      throw conflict('Approved canonical Storytelling plan is missing its immutable approval snapshot.')
    }
    const approvedAuthority = await this.planningAuthority.loadApprovedExecutionAuthority(
      approval.approval.snapshotId,
      scope.workspaceId,
    )
    const binding = this.createApprovedBinding(approvedAuthority)
    if (
      !verifyCanonicalApprovedStorytellingStyleBinding(binding) ||
      binding.canonicalStyleComponent.componentDigest !== componentRef.sha256 ||
      binding.workspaceId !== scope.workspaceId ||
      binding.projectId !== scope.projectId ||
      binding.editSessionId !== scope.editSessionId ||
      binding.productionId !== scope.productionId
    ) {
      throw conflict('Canonical approved Storytelling style binding changed its exact production authority.')
    }
    const approvedStylePlanSource = sourceReadback
      ? this.createApprovedStylePlanSource({ record: sourceReadback, binding })
      : undefined
    return {
      decisionSource: {
        state: 'canonical_approved_locked',
        binding,
        sourceRepositoryReverified: sourceReadback !== undefined,
        ...(approvedStylePlanSource
          ? {
              sourcePlanReviewInputDigest:
                approvedStylePlanSource.sourcePlanReviewInputDigest,
              approvedCalibrationPlanDigest:
                approvedStylePlanSource.approvedCalibrationPlan.planDigest,
            }
          : {}),
      },
    }
  }

  private async readOptionalSourceRecord(input: Parameters<
    StorytellingStylePlanSourceStore['read']
  >[0]) {
    try {
      return await this.stylePlanSourceStore.read(input)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOOL_NOT_READY' && error.status === 503) {
        return undefined
      }
      throw error
    }
  }
}

export function createCanonicalStorytellingStyleReviewSource(
  context: ServiceContext,
): CanonicalStorytellingStyleReviewSource {
  return new CanonicalStorytellingStyleReviewSource(context)
}

function invalid(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}
