import {
  createEditPlanningAuthorityService,
} from '../../services/edit-planning-authority-service'
import {
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import type { ServiceContext } from '../../types'
import { ApiError } from '../../errors/api-error'
import {
  createCanonicalApprovedStorytellingStyleBinding,
} from './canonical-approved-style-binding'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import {
  createCanonicalApprovedStorytellingStylePlanSource,
  createStorytellingStylePlanSourceStore,
  type CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export interface CanonicalApprovedStorytellingStylePlanSourceReaderPort {
  read(input: {
    approvedSnapshotId: string
    workspaceId: string
  }): Promise<CanonicalApprovedStorytellingStylePlanSource>
}

/**
 * Reopens the exact immutable canonical snapshot and its Motion-owned private
 * planning source. Callers may identify the snapshot, but cannot supply the
 * style component, scenario set, route policy, or restored Motion payload.
 */
export function createCanonicalApprovedStorytellingStylePlanSourceReader(
  context: ServiceContext,
): CanonicalApprovedStorytellingStylePlanSourceReaderPort {
  return {
    async read(input) {
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(
        input.approvedSnapshotId,
        input.workspaceId,
      )
      const binding = createCanonicalApprovedStorytellingStyleBinding(
        authority,
      )
      const sourceRecord = await createStorytellingStylePlanSourceStore({
        localStorageRoot: context.env.localStorageRoot,
      }).read({
        workspaceId: binding.workspaceId,
        projectId: binding.projectId,
        editSessionId: binding.editSessionId,
        productionId: binding.productionId,
        calibrationPlanDigest:
          binding.canonicalStyleComponent.authority.calibrationPlan.planDigest,
        expectedCanonicalProjectionDigest:
          binding.canonicalStyleComponent.componentDigest,
      })
      return createCanonicalApprovedStorytellingStylePlanSource({
        record: sourceRecord,
        binding,
      })
    },
  }
}

export async function reopenCanonicalApprovedStorytellingStylePlanSource(
  input: {
    context: ServiceContext
    claimedSource: CanonicalApprovedStorytellingStylePlanSource
    /** Test-only dependency injection. Production callers omit this value. */
    sourceReader?: CanonicalApprovedStorytellingStylePlanSourceReaderPort
  },
): Promise<CanonicalApprovedStorytellingStylePlanSource> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.claimedSource)
  if (input.sourceReader && input.context.env.nodeEnv !== 'test') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Injected approved-plan readers are limited to the controlled test runtime.',
      503,
      {
        requiredGate: 'canonical_approved_storytelling_style_plan_readback',
        productionReady: false,
      },
    )
  }
  const claimedPlan = input.claimedSource.approvedCalibrationPlan
  const sourceReadback = await (
    input.sourceReader ??
    createCanonicalApprovedStorytellingStylePlanSourceReader(input.context)
  ).read({
    approvedSnapshotId: input.claimedSource.approvedSnapshotId,
    workspaceId: claimedPlan.workspaceId,
  })
  assertCanonicalApprovedStorytellingStylePlanSourceReadback({
    claimedSource: input.claimedSource,
    sourceReadback,
  })
  return sourceReadback
}

export function assertCanonicalApprovedStorytellingStylePlanSourceReadback(
  input: {
    claimedSource: CanonicalApprovedStorytellingStylePlanSource
    sourceReadback: CanonicalApprovedStorytellingStylePlanSource
  },
): void {
  assertCanonicalApprovedStorytellingStylePlanSource(input.claimedSource)
  assertCanonicalApprovedStorytellingStylePlanSource(input.sourceReadback)
  if (
    stableAuthorityStringify(input.claimedSource) !==
      stableAuthorityStringify(input.sourceReadback)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Caller-supplied Storytelling style plan does not match its source-reverified approved snapshot.',
      409,
      {
        requiredGate: 'canonical_approved_storytelling_style_plan_readback',
        productionReady: false,
      },
    )
  }
}
