import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type {
  CanonicalCaptionSourceLedProfessionalPlanningRequest,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  applyCanonicalCaptionSourceLedProfessionalPlanning,
  createCanonicalCaptionSourceLedProfessionalPlanningRequest,
  readCanonicalCaptionSourceLedProfessionalPlanning,
} from '../captions-specialist/caption-source-led-professional-planning'
import {
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort,
} from '../captions-specialist/caption-source-led-professional-planning-owner'
import type {
  CanonicalSourceLedCleanupAuthorityInput,
} from '../services/canonical-source-led-plan-compiler'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import {
  createCanonicalEditExecutionPackageService,
} from '../services/canonical-edit-execution-package-service'
import type {
  AuthorityApprovedSnapshotManifest,
} from '../services/private-edit-authority-store'
import {
  createEditPlanningAuthorityService,
} from '../services/edit-planning-authority-service'
import type { ServiceContext } from '../types'
import {
  canonicalPlanComponentsSchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import type {
  PlanningInputAuthorityExpectation,
} from '../validation/planning-input-authority-binding-schemas'
import type {
  SourceMediaAuthorityExpectation,
} from '../validation/source-media-authority-schemas'
import {
  createCanonicalCaptionBrollApprovedPlanHarness,
} from './canonical-caption-broll-approved-plan-harness'

export const CANONICAL_CAPTION_BROLL_APPROVED_RUN_HARNESS_VERSION =
  'canonical-caption-broll-approved-run-harness-v1' as const

export interface CanonicalCaptionBrollApprovedRunHarnessInput {
  readonly context: ServiceContext
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly outputId: string
  readonly plannerInput: PlannerInput
  readonly sourceMediaAssets:
    readonly ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  readonly sourceCleanupAuthority: CanonicalSourceLedCleanupAuthorityInput
  readonly planningInputAuthority: PlanningInputAuthorityExpectation
  readonly sourceMediaAuthority: SourceMediaAuthorityExpectation
  readonly idempotencySeed: string
  readonly approvedAt: string
}

/**
 * Internal qualification seam only. It uses the source-led Caption owner,
 * canonical B-roll plugin, canonical plan publisher, approval/credit owner,
 * immutable snapshot owner, and canonical execution-package owner. It neither
 * executes work nor schedules another specialist.
 */
export async function createCanonicalCaptionBrollApprovedRunHarness(
  input: CanonicalCaptionBrollApprovedRunHarnessInput,
) {
  assertHarnessScope(input)
  const compiled = compileCanonicalSourceLedPlan({
    plannerInput: structuredClone(input.plannerInput),
    sourceMediaAssets: input.sourceMediaAssets.map((asset) =>
      structuredClone(asset)),
    confirmedCaptionMarkers: [],
    sourceCleanupAuthority: structuredClone(input.sourceCleanupAuthority),
  })
  const publication = compiled.canonicalDraft.publication ??
    compiled.professionalLongFormPublication
  if (!publication) {
    throw new Error(
      `Caption+B-roll approved-run harness could not publish its source-led draft: ${
        compiled.canonicalDraft.publicationBlockers.join(' | ')
      }`,
    )
  }
  const baseComponents = canonicalPlanComponentsSchema.parse(
    publication.canonicalPlan.components,
  )
  const firstSegment = baseComponents.segments[0]
  const firstSequenceItem = baseComponents.sourceSequence[0]
  const firstSource = input.sourceMediaAssets[0]
  if (!firstSegment || !firstSequenceItem || !firstSource) {
    throw new Error(
      'Caption+B-roll approved-run harness requires one canonical source scene.',
    )
  }
  if (
    firstSequenceItem.sourceSequenceItemId !==
      firstSource.sourceSequenceItemId ||
    !firstSource.checksumSha256 ||
    !firstSource.sourceMetadata?.durationSeconds ||
    !firstSource.sourceMetadata.frameRateNumerator ||
    !firstSource.sourceMetadata.frameRateDenominator ||
    !firstSource.sourceMetadata.width ||
    !firstSource.sourceMetadata.height
  ) {
    throw new Error(
      'Caption+B-roll approved-run source metadata or sequence lineage is incomplete.',
    )
  }
  const sourceFrameCount = Math.round(
    firstSource.sourceMetadata.durationSeconds *
      firstSource.sourceMetadata.frameRateNumerator /
      firstSource.sourceMetadata.frameRateDenominator,
  )
  const sceneFrameCount = firstSegment.endFrameExclusive -
    firstSegment.startFrame
  if (sceneFrameCount <= 0 || sceneFrameCount > sourceFrameCount) {
    throw new Error(
      'Caption+B-roll approved-run scene exceeds its exact source-frame authority.',
    )
  }

  const broll = await createCanonicalCaptionBrollApprovedPlanHarness({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    planningRequestId: publication.planningRequestIdSeed,
    assignmentId: `${input.idempotencySeed}.broll-assignment`,
    editPlanVersion: 1,
    canonicalMasterTimingPlan: baseComponents.masterTimingPlan,
    canonicalTimingSummary: baseComponents.timingSummary,
    timelineRange: {
      startFrameInclusive: 0,
      endFrameExclusive: baseComponents.timingSummary.totalFrames,
      fps: baseComponents.timingSummary.fps,
    },
    authorizedRange: {
      startFrameInclusive: firstSegment.startFrame,
      endFrameExclusive: firstSegment.endFrameExclusive,
      fps: baseComponents.timingSummary.fps,
    },
    segmentIds: [firstSegment.segmentId],
    confirmedAspectRatio: input.plannerInput.aspectRatio,
    approvedAt: input.approvedAt,
    source: {
      sourceSequenceItemId: firstSequenceItem.sourceSequenceItemId,
      objectSha256: firstSource.checksumSha256,
      byteLength: firstSource.byteSize,
      durationFrames: sourceFrameCount,
      frameRateNumerator:
        firstSource.sourceMetadata.frameRateNumerator,
      frameRateDenominator:
        firstSource.sourceMetadata.frameRateDenominator,
      fps: baseComponents.timingSummary.fps,
      width: firstSource.sourceMetadata.width,
      height: firstSource.sourceMetadata.height,
      sourceRange: {
        startFrameInclusive: 0,
        endFrameExclusive: sceneFrameCount,
        fps: baseComponents.timingSummary.fps,
      },
    },
  })
  const componentsWithBroll = canonicalPlanComponentsSchema.parse({
    ...structuredClone(baseComponents),
    bRollSkill: broll.persistedComponent.component,
    bRollMasterTimingBinding: broll.masterTimingBinding,
  })
  const captionRequest =
    createCanonicalCaptionSourceLedProfessionalPlanningRequest({
      canonicalScope: {
        ownerUserId: input.ownerUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        planningRequestId: publication.planningRequestIdSeed,
        outputId: input.outputId,
      },
      components: componentsWithBroll,
      confirmedCaptionMarkerSetRef: null,
    })
  const captionOwnerRead =
    await readCanonicalCaptionSourceLedProfessionalPlanning({
      port: createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
        components: componentsWithBroll,
        sourceCleanupAuthority:
          structuredClone(input.sourceCleanupAuthority),
        confirmedCaptionMarkerSetRef: null,
      }),
      request: captionRequest,
    })
  if (captionOwnerRead.status !== 'ready') {
    throw new Error(
      `Caption source-led owner is not ready: ${captionOwnerRead.blockerCodes.join(' | ')}`,
    )
  }
  const captionPlanning =
    applyCanonicalCaptionSourceLedProfessionalPlanning({
      request: captionRequest,
      authority: captionOwnerRead.authority,
      components: componentsWithBroll,
      estimate: publication.canonicalPlan.estimate,
      workItems: publication.canonicalPlan.workItems,
    })
  const canonicalPlan = publishCanonicalEditPlanSchema.shape.canonicalPlan
    .parse({
      ...structuredClone(publication.canonicalPlan),
      components: captionPlanning.components,
      estimate: {
        ...structuredClone(captionPlanning.estimate),
        lineItems: [
          ...structuredClone(captionPlanning.estimate.lineItems),
          {
            lineKey: `${input.idempotencySeed}.broll-estimate`,
            label: 'Approved existing-source B-roll planning and private review',
            category: 'b_roll',
            estimatedCredits: broll.estimatedCredits,
            removable: false,
            metadata: {
              assignmentHash: broll.brollAssignment.assignmentHash,
              workGraphHash: broll.canonicalWorkGraph.workGraphHash,
              masterTimingHash: broll.masterTimingPlan.timingHash,
              estimateOwnerRemainsCanonical: true,
              billingAuthorityGrantedToBroll: false,
            },
          },
        ],
      },
      workItems: [
        ...structuredClone(publication.canonicalPlan.workItems),
        ...structuredClone(broll.canonicalWorkItems),
      ],
    })

  const planning = createEditPlanningAuthorityService(input.context)
  const published = await planning.publishCanonicalPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    planningRequestId: publication.planningRequestIdSeed,
    planningInputAuthority:
      structuredClone(input.planningInputAuthority),
    sourceMediaAuthority: structuredClone(input.sourceMediaAuthority),
    canonicalPlan,
    idempotencyKey: `${input.idempotencySeed}.publish`,
  })
  const publishedAuthority = published.authority as unknown as {
    authorityRevision: number
    plan: { id: string; planHash: string }
    estimate: { estimateHash: string }
  }
  const approved = await planning.approveAndFundCanonicalPlan({
    workspaceId: input.workspaceId,
    editPlanId: publishedAuthority.plan.id,
    expectedAuthorityRevision: publishedAuthority.authorityRevision,
    expectedPlanHash: publishedAuthority.plan.planHash,
    expectedEstimateHash: publishedAuthority.estimate.estimateHash,
    idempotencyKey: `${input.idempotencySeed}.approve`,
  })
  const approvedAuthority = approved.authority as unknown as {
    authorityRevision: number
    snapshot: AuthorityApprovedSnapshotManifest
  }
  const snapshot = approvedAuthority.snapshot
  const packaged = await createCanonicalEditExecutionPackageService(
    input.context,
  ).createPackage({
    workspaceId: input.workspaceId,
    approvedPlanSnapshotId: snapshot.snapshotId,
    expectedSnapshotHash: snapshot.snapshotHash,
    purpose: 'private_internal_execution_handoff',
    idempotencyKey: `${input.idempotencySeed}.package`,
  })
  const approvedExecutionAuthority =
    await planning.loadApprovedExecutionAuthority(
      snapshot.snapshotId,
      input.workspaceId,
    )
  assertApprovedRunLineage({
    request: captionRequest,
    approvedExecutionAuthority,
    packageValue: packaged.approvedEditExecutionPackage,
    expectedBrollWorkItemCount: broll.canonicalWorkItems.length,
  })

  return Object.freeze({
    harnessVersion:
      CANONICAL_CAPTION_BROLL_APPROVED_RUN_HARNESS_VERSION,
    captionRequest,
    captionPlanningAuthority: captionOwnerRead.authority,
    captionPlanningProjection: captionPlanning.projection,
    broll,
    canonicalPlan,
    published: { ...published, authority: publishedAuthority },
    approved: { ...approved, authority: approvedAuthority },
    approvedExecutionAuthority,
    approvedEditExecutionPackage: packaged.approvedEditExecutionPackage,
    toolCapabilityManifest: packaged.toolCapabilityManifest,
    runtimeDispatched: false as const,
    providerCalled: false as const,
    assetCreated: false as const,
    finalQaApproved: false as const,
    publicDeliveryCreated: false as const,
    productionAuthorityGranted: false as const,
  })
}

function assertHarnessScope(
  input: CanonicalCaptionBrollApprovedRunHarnessInput,
): void {
  if (
    input.context.auth?.userId !== input.ownerUserId ||
    input.sourceMediaAssets.length !== 1 ||
    input.plannerInput.clips.length !== 1 ||
    !input.plannerInput.aspectRatioConfirmed ||
    input.plannerInput.sourceOrderConfirmed !== true
  ) {
    throw new Error(
      'Caption+B-roll approved-run harness scope or confirmed planning authority is invalid.',
    )
  }
}

function assertApprovedRunLineage(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  approvedExecutionAuthority: Awaited<ReturnType<
    ReturnType<typeof createEditPlanningAuthorityService>[
      'loadApprovedExecutionAuthority'
    ]
  >>
  packageValue: Awaited<ReturnType<
    ReturnType<typeof createCanonicalEditExecutionPackageService>[
      'createPackage'
    ]
  >>['approvedEditExecutionPackage']
  expectedBrollWorkItemCount: number
}): void {
  const authority = input.approvedExecutionAuthority
  const packageValue = input.packageValue
  const brollWorkItems = authority.workItems.filter((workItem) =>
    workItem.executionInput.bRollAtomicAuthority !== undefined)
  const captionWorkItems = authority.workItems.filter((workItem) =>
    workItem.workerClass === 'canonical_caption_specialist_worker_v1')
  if (
    authority.snapshot.workspaceId !==
      input.request.canonicalScope.workspaceId ||
    authority.snapshot.projectId !== input.request.canonicalScope.projectId ||
    authority.snapshot.editSessionId !==
      input.request.canonicalScope.editSessionId ||
    packageValue.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
    packageValue.snapshotHash !== authority.snapshot.snapshotHash ||
    packageValue.workGraphHash !== authority.snapshot.workGraphHash ||
    packageValue.timingHash !== authority.snapshot.timingHash ||
    packageValue.componentRefs.bRollSkill?.sha256 !==
      authority.snapshot.componentRefs.bRollSkill?.sha256 ||
    brollWorkItems.length !== input.expectedBrollWorkItemCount ||
    captionWorkItems.length === 0 ||
    !authority.captionPlanningProjection ||
    !authority.captionRenderedMediaWorkBinding ||
    !authority.captionPostrenderVisualQaWorkBinding ||
    !authority.captionPrivateReviewDependencyBinding
  ) {
    throw new Error(
      'Caption+B-roll approved snapshot or execution-package lineage is incomplete.',
    )
  }
}
