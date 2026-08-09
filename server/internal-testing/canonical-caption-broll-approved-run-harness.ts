import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type {
  CanonicalCaptionSourceLedProfessionalPlanningRequest,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import type {
  CanonicalCaptionPostapprovalJobSelectionRecord,
} from '../../src/types/canonical-caption-postapproval-job-selection'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from '../../src/types/caption-remotion-broll-owner-approved-run-review'
import type {
  BrollCaptionOwnerReadRequest,
} from '../../src/types/caption-broll-owner-read-adapter'
import type {
  CaptionStyleId,
  PlannerInput,
  SoundStyleId,
} from '../../src/types/reeditpro'
import {
  CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS,
  CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS,
  type CaptionSourceLedAdvancedPresetId,
  type CaptionSourceLedCrossSystemTargetPresetId,
} from '../../src/types/caption-source-led-intent-policy'
import {
  createCaptionBrollOwnerReadRequest,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import {
  BROLL_CAPTION_OWNER_MANIFEST_REF,
} from '../edit-skills/b-roll/b-roll-caption-public-contract'
import {
  applyCanonicalCaptionSourceLedProfessionalPlanning,
  createCanonicalCaptionSourceLedProfessionalPlanningRequest,
  readCanonicalCaptionSourceLedProfessionalPlanning,
} from '../captions-specialist/caption-source-led-professional-planning'
import {
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort,
  type CanonicalCaptionIncomingSupportPlanningAdmission,
} from '../captions-specialist/caption-source-led-professional-planning-owner'
import {
  canonicalCaptionPostapprovalJobSelectionRecordRef,
  createCanonicalCaptionPostapprovalJobSelectionRecord,
  createCanonicalCaptionPostapprovalJobSelectionRepository,
} from '../captions-specialist/caption-postapproval-job-selection'
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
  readPrivateEditAuthorityAggregate,
} from '../services/private-edit-authority-store'
import {
  createEditPlanningAuthorityService,
} from '../services/edit-planning-authority-service'
import {
  createCanonicalPrivateLocalJsonObjectPort,
} from '../services/canonical-private-local-json-object-port'
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
import { hashSkillValue } from '../edit-skills/core'

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
  /**
   * Closed private-internal qualification scenario compiled into the final
   * canonical plan before approval. It is not accepted by a public route and
   * never bypasses the normal Caption owner, estimate, snapshot, or package.
   */
  readonly captionScenario?: CanonicalCaptionApprovedRunScenario
  readonly incomingCaptionSupportRequests?: readonly
    CanonicalCaptionIncomingSupportPlanningAdmission[]
  /**
   * Private-internal seam for admitting source-derived, preapproval neutral
   * support requests after the canonical draft has established the exact
   * Caption scene scope. It cannot approve, schedule, or execute the requests.
   */
  readonly admitIncomingCaptionSupportRequests?: (input: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly outputId: string
    readonly sceneId: string
    readonly frameRange: {
      readonly startFrame: number
      readonly endFrameExclusive: number
    }
  }) => Promise<readonly CanonicalCaptionIncomingSupportPlanningAdmission[]>
}

export interface CanonicalCaptionApprovedRunScenario {
  readonly scenarioId: string
  readonly mappedPresetIds: readonly (
    CaptionSourceLedAdvancedPresetId |
    CaptionSourceLedCrossSystemTargetPresetId
  )[]
  readonly captionStyle?: CaptionStyleId
  readonly soundStyle?: SoundStyleId
  readonly postapprovalLifecycleSource?:
    CanonicalCaptionApprovedRunPostapprovalSource
}

export interface CanonicalCaptionApprovedRunPostapprovalSource {
  readonly sourceScope: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly planVersionId: string
    readonly approvedSnapshotRef: CaptionDomainRef
    readonly outputId: string
    readonly sceneId: string
    readonly authorizedFrameRanges: readonly [{
      readonly startFrame: number
      readonly endFrameExclusive: number
    }]
    readonly confirmedOutputFrameRef: CaptionDomainRef
    readonly masterTimingRef: CaptionDomainRef
  }
  readonly sourceExecutionPackageRef: CaptionDomainRef
  readonly sourceCaptionPlanningProjectionRef: CaptionDomainRef
  readonly sourcePostrenderVisualQaWorkBindingRef: CaptionDomainRef
  readonly exactApprovedRunDerived: true
  readonly privateQualificationEvidence: false
}

export interface CanonicalCaptionBrollApprovedRunReviewAuthority {
  readonly canonicalScope:
    CaptionRemotionBrollOwnerApprovedRunReviewSpec['canonicalScope']
  readonly approvedRunLineage:
    CaptionRemotionBrollOwnerApprovedRunReviewSpec['approvedRunLineage']
  readonly confirmedOutputFrame:
    CaptionRemotionBrollOwnerApprovedRunReviewSpec['confirmedOutputFrame']
  readonly masterTimingRef:
    CaptionRemotionBrollOwnerApprovedRunReviewSpec['masterTimingRef']
  readonly masterTimingHash: string
  readonly exactAuthorityDerivedFromCanonicalApprovedRun: true
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
  const compiledComponents = canonicalPlanComponentsSchema.parse(
    publication.canonicalPlan.components,
  )
  const baseComponents = applyCaptionApprovedRunScenario(
    compiledComponents,
    input.captionScenario,
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
  if (input.incomingCaptionSupportRequests !== undefined
    && input.admitIncomingCaptionSupportRequests !== undefined) {
    throw new Error(
      'Caption approved-run harness cannot accept two support-request owners.',
    )
  }
  const incomingCaptionSupportRequests =
    input.incomingCaptionSupportRequests
    ?? await input.admitIncomingCaptionSupportRequests?.({
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      outputId: input.outputId,
      sceneId: firstSegment.segmentId,
      frameRange: {
        startFrame: firstSegment.startFrame,
        endFrameExclusive: firstSegment.endFrameExclusive,
      },
    })
  let postapprovalJobSelectionRecord:
    CanonicalCaptionPostapprovalJobSelectionRecord | null = null
  let postapprovalJobSelectionMount: Parameters<
    typeof createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort
  >[0]['postapprovalJobSelection']
  const postapprovalSource = input.captionScenario
    ?.postapprovalLifecycleSource
  if (postapprovalSource) {
    assertPostapprovalSourceTargetsRequest({
      source: postapprovalSource,
      request: captionRequest,
      sceneId: firstSegment.segmentId,
      startFrame: firstSegment.startFrame,
      endFrameExclusive: firstSegment.endFrameExclusive,
    })
    const fixtureRef = (role: string, version: string): CaptionDomainRef => ({
      id: `${postapprovalSource.sourceScope.approvedSnapshotRef.id}.${role}`,
      version,
      contentHash: hashSkillValue({
        role,
        sourceApprovedSnapshotRef:
          postapprovalSource.sourceScope.approvedSnapshotRef,
        sourceExecutionPackageRef:
          postapprovalSource.sourceExecutionPackageRef,
        sourcePostrenderVisualQaWorkBindingRef:
          postapprovalSource.sourcePostrenderVisualQaWorkBindingRef,
        sourceContractFixture: true,
        privateQualificationEvidence: false,
      }),
    })
    postapprovalJobSelectionRecord =
      createCanonicalCaptionPostapprovalJobSelectionRecord({
        evidenceMode: 'source_contract_fixture',
        sourceScope: {
          ownerUserId: postapprovalSource.sourceScope.ownerUserId,
          workspaceId: postapprovalSource.sourceScope.workspaceId,
          projectId: postapprovalSource.sourceScope.projectId,
          editSessionId: postapprovalSource.sourceScope.editSessionId,
          planVersionId: postapprovalSource.sourceScope.planVersionId,
          approvedSnapshotRef: structuredClone(
            postapprovalSource.sourceScope.approvedSnapshotRef,
          ),
          outputId: postapprovalSource.sourceScope.outputId,
          sceneId: postapprovalSource.sourceScope.sceneId,
          authorizedFrameRanges: postapprovalSource.sourceScope
            .authorizedFrameRanges.map((range) => ({ ...range })),
          confirmedOutputFrameRef: structuredClone(
            postapprovalSource.sourceScope.confirmedOutputFrameRef,
          ),
          masterTimingRef: structuredClone(
            postapprovalSource.sourceScope.masterTimingRef,
          ),
        },
        sourceExecutionPackageRef:
          structuredClone(postapprovalSource.sourceExecutionPackageRef),
        sourceCaptionPlanningProjectionRef: structuredClone(
          postapprovalSource.sourceCaptionPlanningProjectionRef,
        ),
        completeQaReportRef: fixtureRef(
          'complete-qa-report',
          'caption-complete-qa-report-v1',
        ),
        localRepairFallbackPlanRef: fixtureRef(
          'local-repair-fallback-plan',
          'caption-local-repair-fallback-plan-v1',
        ),
        accessibilityRecompositionPlanRef: fixtureRef(
          'accessibility-recomposition-plan',
          'caption-accessibility-export-plan-v1',
        ),
        directInspectionReceiptRef: fixtureRef(
          'direct-inspection-receipt',
          'caption-direct-visual-inspection-receipt-v1',
        ),
        postrenderVisualQaWorkBindingRef: structuredClone(
          postapprovalSource.sourcePostrenderVisualQaWorkBindingRef,
        ),
        targetPlanningScope: {
          ownerUserId: captionRequest.canonicalScope.ownerUserId,
          workspaceId: captionRequest.canonicalScope.workspaceId,
          projectId: captionRequest.canonicalScope.projectId,
          editSessionId: captionRequest.canonicalScope.editSessionId,
          planningRequestId:
            captionRequest.canonicalScope.planningRequestId,
          outputId: captionRequest.canonicalScope.outputId,
          sceneId: firstSegment.segmentId,
          authorizedFrameRanges: [{
            startFrame: firstSegment.startFrame,
            endFrameExclusive: firstSegment.endFrameExclusive,
          }],
          confirmedOutputFrameRef: structuredClone(
            captionRequest.confirmedOutputFrame.confirmedOutputFrameRef,
          ),
          masterTimingRef: structuredClone(captionRequest.masterTimingRef),
        },
      })
    const repository =
      createCanonicalCaptionPostapprovalJobSelectionRepository({
        objectPort: createCanonicalPrivateLocalJsonObjectPort({
          localStorageRoot: input.context.env.localStorageRoot,
        }),
        prefix: [
          'private-internal/captions-specialist/v1/postapproval-job-selection',
          input.ownerUserId,
          input.workspaceId,
        ].join('/'),
      })
    await repository.persistCreateOnly({
      record: postapprovalJobSelectionRecord,
    })
    const recordRef = canonicalCaptionPostapprovalJobSelectionRecordRef(
      postapprovalJobSelectionRecord,
    )
    const reread = await repository.readPort.readExact({ recordRef })
    if (!reread || reread.recordDigestSha256 !==
      postapprovalJobSelectionRecord.recordDigestSha256) {
      throw new Error(
        'Caption approved-run postapproval selection reread failed.',
      )
    }
    postapprovalJobSelectionMount = {
      readPort: repository.readPort,
      recordRef,
      targetSceneId: firstSegment.segmentId,
    }
  }
  const captionOwnerRead =
    await readCanonicalCaptionSourceLedProfessionalPlanning({
      port: createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
        components: componentsWithBroll,
        sourceCleanupAuthority:
          structuredClone(input.sourceCleanupAuthority),
        confirmedCaptionMarkerSetRef: null,
        ...(incomingCaptionSupportRequests === undefined ? {} : {
          incomingSupportRequests: incomingCaptionSupportRequests,
        }),
        ...(postapprovalJobSelectionMount === undefined ? {} : {
          postapprovalJobSelection: postapprovalJobSelectionMount,
        }),
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
  let publishedAuthority: {
    authorityRevision: number
    plan: { id: string; planHash: string }
    estimate: { estimateHash: string }
  }
  let approvedAuthority: {
    authorityRevision: number
    snapshot: AuthorityApprovedSnapshotManifest
  }
  let publishedWarnings: readonly string[]
  let approvedWarnings: readonly string[]
  let approvedExecutionAuthority: Awaited<ReturnType<
    ReturnType<typeof createEditPlanningAuthorityService>[
      'loadApprovedExecutionAuthority'
    ]
  >>
  const persistedAggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
  })
  const persistedPublish = persistedAggregate?.idempotencyRecords.find(
    (record) => record.operation === 'publish_plan'
      && record.idempotencyKey === `${input.idempotencySeed}.publish`,
  )
  const persistedPlan = persistedPublish
    ? persistedAggregate?.plans.find((plan) => plan.id === persistedPublish.responseId)
    : undefined
  const persistedSnapshots = persistedPlan
    ? persistedAggregate?.snapshots.filter((candidate) =>
        candidate.planId === persistedPlan.id)
    : []
  if (persistedPlan && persistedSnapshots?.length === 1) {
    if (
      persistedPlan.projectId !== input.projectId
      || persistedPlan.editSessionId !== input.editSessionId
      || persistedPlan.planningRequestId !== publication.planningRequestIdSeed
    ) {
      throw new Error(
        'Persisted Caption+B-roll publication does not match the requested approved-run scope.',
      )
    }
    approvedExecutionAuthority = await planning.loadApprovedExecutionAuthority(
      persistedSnapshots[0]!.snapshotId,
      input.workspaceId,
    )
    const persistedComponents = approvedExecutionAuthority.components as
      unknown as Record<string, unknown>
    const derivedComponents = canonicalPlan.components as
      unknown as Record<string, unknown>
    const allowedDerivedOnlyComponentKeys = new Set([
      'bRollMasterTimingBinding',
    ])
    const changedComponentKeys = [...new Set([
      ...Object.keys(persistedComponents),
      ...Object.keys(derivedComponents),
    ])].filter((key) => {
      if (!(key in persistedComponents)) {
        return !allowedDerivedOnlyComponentKeys.has(key)
      }
      if (!(key in derivedComponents)) return true
      return hashSkillValue(persistedComponents[key])
        !== hashSkillValue(derivedComponents[key])
    })
    if (
      changedComponentKeys.length > 0
      || hashSkillValue(approvedExecutionAuthority.components.bRollSkill)
        !== hashSkillValue(broll.persistedComponent.component)
    ) {
      throw new Error(
        'Persisted Caption+B-roll approved components changed before replay: '
          + changedComponentKeys.join(', '),
      )
    }
    publishedAuthority = {
      authorityRevision: persistedAggregate!.revision,
      plan: persistedPlan,
      estimate: approvedExecutionAuthority.estimate,
    }
    approvedAuthority = {
      authorityRevision: persistedAggregate!.revision,
      snapshot: approvedExecutionAuthority.snapshot,
    }
    publishedWarnings = [
      'The exact persisted Caption+B-roll canonical plan was reread; no duplicate publication occurred.',
    ]
    approvedWarnings = [
      'The exact immutable Caption+B-roll approved snapshot was reread; no duplicate approval or reservation occurred.',
    ]
  } else {
    if (persistedPlan || (persistedSnapshots?.length ?? 0) > 0) {
      throw new Error(
        'Persisted Caption+B-roll publication has incomplete or ambiguous snapshot lineage.',
      )
    }
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
    publishedAuthority = published.authority as unknown as typeof publishedAuthority
    const approved = await planning.approveAndFundCanonicalPlan({
      workspaceId: input.workspaceId,
      editPlanId: publishedAuthority.plan.id,
      expectedAuthorityRevision: publishedAuthority.authorityRevision,
      expectedPlanHash: publishedAuthority.plan.planHash,
      expectedEstimateHash: publishedAuthority.estimate.estimateHash,
      idempotencyKey: `${input.idempotencySeed}.approve`,
    })
    approvedAuthority = approved.authority as unknown as typeof approvedAuthority
    publishedWarnings = published.warnings
    approvedWarnings = approved.warnings
    approvedExecutionAuthority = await planning.loadApprovedExecutionAuthority(
      approvedAuthority.snapshot.snapshotId,
      input.workspaceId,
    )
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
    published: { warnings: publishedWarnings, authority: publishedAuthority },
    approved: { warnings: approvedWarnings, authority: approvedAuthority },
    approvedExecutionAuthority,
    approvedEditExecutionPackage: packaged.approvedEditExecutionPackage,
    captionPostapprovalJobSelectionRecord:
      postapprovalJobSelectionRecord === null
        ? null : Object.freeze(structuredClone(
            postapprovalJobSelectionRecord)),
    toolCapabilityManifest: packaged.toolCapabilityManifest,
    runtimeDispatched: false as const,
    providerCalled: false as const,
    assetCreated: false as const,
    finalQaApproved: false as const,
    publicDeliveryCreated: false as const,
    productionAuthorityGranted: false as const,
  })
}

export function deriveCanonicalCaptionApprovedRunPostapprovalSource(
  run: Awaited<ReturnType<
    typeof createCanonicalCaptionBrollApprovedRunHarness
  >>,
): CanonicalCaptionApprovedRunPostapprovalSource {
  const snapshot = run.approved.authority.snapshot
  const projection = run.approvedExecutionAuthority.captionPlanningProjection
  const postrenderBinding =
    run.approvedExecutionAuthority.captionPostrenderVisualQaWorkBinding
  const scene = run.canonicalPlan.components.segments[0]
  if (!projection || !postrenderBinding || !scene
    || projection.outputId !== run.captionRequest.canonicalScope.outputId
    || !projection.projectedSceneIds.includes(scene.segmentId)
    || postrenderBinding.outputId !== projection.outputId) {
    throw new Error(
      'Canonical Caption approved run cannot derive postapproval selection lineage.',
    )
  }
  return Object.freeze({
    sourceScope: Object.freeze({
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: Object.freeze({
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      }),
      outputId: projection.outputId,
      sceneId: scene.segmentId,
      authorizedFrameRanges: Object.freeze([Object.freeze({
        startFrame: scene.startFrame,
        endFrameExclusive: scene.endFrameExclusive,
      })]) as unknown as CanonicalCaptionApprovedRunPostapprovalSource[
        'sourceScope']['authorizedFrameRanges'],
      confirmedOutputFrameRef: Object.freeze(structuredClone(
        run.captionRequest.confirmedOutputFrame.confirmedOutputFrameRef,
      )),
      masterTimingRef: Object.freeze(structuredClone(
        run.captionRequest.masterTimingRef,
      )),
    }),
    sourceExecutionPackageRef: Object.freeze({
      id: run.approvedEditExecutionPackage.packageRecordId,
      version: run.approvedEditExecutionPackage.schemaVersion,
      contentHash: run.approvedEditExecutionPackage.packageHash,
    }),
    sourceCaptionPlanningProjectionRef: Object.freeze({
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    }),
    sourcePostrenderVisualQaWorkBindingRef: Object.freeze({
      id: postrenderBinding.bindingId,
      version: postrenderBinding.schemaVersion,
      contentHash: postrenderBinding.bindingDigestSha256,
    }),
    exactApprovedRunDerived: true,
    privateQualificationEvidence: false,
  })
}

function assertPostapprovalSourceTargetsRequest(input: {
  source: CanonicalCaptionApprovedRunPostapprovalSource
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  sceneId: string
  startFrame: number
  endFrameExclusive: number
}): void {
  const sourceRange = input.source.sourceScope.authorizedFrameRanges[0]
  if (!input.source.exactApprovedRunDerived
    || input.source.privateQualificationEvidence
    || input.source.sourceScope.ownerUserId !==
      input.request.canonicalScope.ownerUserId
    || input.source.sourceScope.workspaceId !==
      input.request.canonicalScope.workspaceId
    || input.source.sourceScope.projectId !==
      input.request.canonicalScope.projectId
    || input.source.sourceScope.outputId !==
      input.request.canonicalScope.outputId
    || sourceRange.startFrame !== input.startFrame
    || sourceRange.endFrameExclusive !== input.endFrameExclusive
    || input.source.sourceScope.confirmedOutputFrameRef.version !==
      input.request.confirmedOutputFrame.confirmedOutputFrameRef.version
    || input.source.sourceScope.confirmedOutputFrameRef.contentHash !==
      input.request.confirmedOutputFrame.confirmedOutputFrameRef.contentHash
    || input.source.sourceScope.masterTimingRef.version !==
      input.request.masterTimingRef.version) {
    throw new Error(
      'Caption approved-run postapproval source crossed target planning scope.',
    )
  }
}

const approvedScenarioPresetOrder = [
  ...CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS,
  ...Object.values(CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS),
] as const

function applyCaptionApprovedRunScenario(
  components: ReturnType<typeof canonicalPlanComponentsSchema.parse>,
  scenario: CanonicalCaptionApprovedRunScenario | undefined,
): ReturnType<typeof canonicalPlanComponentsSchema.parse> {
  if (scenario === undefined) return components
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(scenario.scenarioId)
    || scenario.mappedPresetIds.length < 1
    || scenario.mappedPresetIds.length > 4
    || new Set(scenario.mappedPresetIds).size !==
      scenario.mappedPresetIds.length) {
    throw new Error(
      'Caption approved-run scenario identity or preset cardinality is invalid.',
    )
  }
  const order = new Map(approvedScenarioPresetOrder.map((id, index) =>
    [id, index]))
  const presetIndexes = scenario.mappedPresetIds.map((id) => order.get(id))
  if (presetIndexes.some((index) => index === undefined)
    || presetIndexes.some((index, position) => position > 0
      && index! <= presetIndexes[position - 1]!)) {
    throw new Error(
      'Caption approved-run scenario presets are unknown or non-canonical.',
    )
  }
  const directive = structuredClone(components.professionalEditingDirective)
  if (!Array.isArray(directive.customDirectives)) {
    throw new Error(
      'Caption approved-run scenario requires the compiled directive list.',
    )
  }
  return canonicalPlanComponentsSchema.parse({
    ...structuredClone(components),
    professionalEditingDirective: {
      ...directive,
      ...(scenario.captionStyle === undefined
        ? {} : { captionStyle: scenario.captionStyle }),
      ...(scenario.soundStyle === undefined
        ? {} : { soundStyle: scenario.soundStyle }),
      customDirectives: [
        ...structuredClone(directive.customDirectives),
        {
          id: `caption-approved-run-scenario.${scenario.scenarioId}`,
          rawUserRequest:
            'Private internal Caption qualification scenario.',
          interpretedMeaning:
            'Exercise only the exact versioned Caption preset identifiers.',
          mappedPresetIds: [...scenario.mappedPresetIds],
          customOverrides: [],
          mustFollowRules: [],
          avoidRules: [],
          confidence: 'high',
          clarifyingQuestions: [],
        },
      ],
    },
  })
}

/**
 * Derives the creative-review authority only from the immutable approved run.
 * No caller-provided snapshot, package, frame, scene, timing, or Caption
 * planning reference is accepted here. The returned authority still grants no
 * render or asset mutation rights; it is an input to the bounded private V5
 * review request after the canonical B-roll owner result has been reread.
 */
export function deriveCanonicalCaptionBrollApprovedRunReviewAuthority(
  run: Awaited<ReturnType<
    typeof createCanonicalCaptionBrollApprovedRunHarness
  >>,
): CanonicalCaptionBrollApprovedRunReviewAuthority {
  const snapshot = run.approved.authority.snapshot
  const executionPackage = run.approvedEditExecutionPackage
  const projection = run.approvedExecutionAuthority.captionPlanningProjection
  const renderedMediaBinding =
    run.approvedExecutionAuthority.captionRenderedMediaWorkBinding
  const firstSegment = run.canonicalPlan.components.segments[0]
  const brollRange = run.broll.brollAssignment.writeRangeAuthority
    .authorizedRange
  if (!projection || !renderedMediaBinding || !firstSegment
    || projection.outputId !== run.captionRequest.canonicalScope.outputId
    || renderedMediaBinding.outputId !== projection.outputId
    || renderedMediaBinding.planningProjectionRef.id
      !== projection.projectionId
    || renderedMediaBinding.planningProjectionRef.version
      !== projection.schemaVersion
    || renderedMediaBinding.planningProjectionRef.contentHash
      !== projection.projectionDigestSha256
    || renderedMediaBinding.planningBindingRef.id
      !== projection.planningBindingRef.id
    || renderedMediaBinding.planningBindingRef.version
      !== projection.planningBindingRef.version
    || renderedMediaBinding.planningBindingRef.contentHash
      !== projection.planningBindingRef.contentHash
    || renderedMediaBinding.confirmedOutputFrame.frameRef.id
      !== run.captionRequest.confirmedOutputFrame.confirmedOutputFrameRef.id
    || renderedMediaBinding.confirmedOutputFrame.frameRef.version
      !== run.captionRequest.confirmedOutputFrame.confirmedOutputFrameRef.version
    || renderedMediaBinding.confirmedOutputFrame.frameRef.contentHash
      !== run.captionRequest.confirmedOutputFrame.confirmedOutputFrameRef
        .contentHash
    || renderedMediaBinding.masterTimingRef.id
      !== run.captionRequest.masterTimingRef.id
    || renderedMediaBinding.masterTimingRef.version
      !== run.captionRequest.masterTimingRef.version
    || renderedMediaBinding.masterTimingRef.contentHash
      !== run.captionRequest.masterTimingRef.contentHash
    || brollRange.startFrameInclusive !== firstSegment.startFrame
    || brollRange.endFrameExclusive !== firstSegment.endFrameExclusive
    || brollRange.fps !== run.canonicalPlan.components.timingSummary.fps
    || executionPackage.approvedPlanSnapshotId !== snapshot.snapshotId
    || executionPackage.snapshotHash !== snapshot.snapshotHash) {
    throw new Error(
      'Canonical Caption+B-roll approved run cannot derive exact V5 review authority.',
    )
  }
  const approvedSnapshotRef = {
    id: snapshot.snapshotId,
    version: snapshot.schemaVersion,
    contentHash: snapshot.snapshotHash,
  }
  const confirmed = renderedMediaBinding.confirmedOutputFrame
  if (confirmed.width !== 3_840 || confirmed.height !== 2_160
    || confirmed.fpsNumerator !== 30 || confirmed.fpsDenominator !== 1) {
    throw new Error(
      'Canonical Caption+B-roll V5 review requires the exact 4K@30 approved frame.',
    )
  }
  return Object.freeze({
    canonicalScope: Object.freeze({
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: Object.freeze(approvedSnapshotRef),
      outputId: projection.outputId,
      sceneId: firstSegment.segmentId,
      authorizedFrameRanges: [{
        startFrame: brollRange.startFrameInclusive,
        endFrameExclusive: brollRange.endFrameExclusive,
      }],
    }),
    approvedRunLineage: Object.freeze({
      approvedSnapshotRef: Object.freeze({ ...approvedSnapshotRef }),
      executionPackageRef: Object.freeze({
        id: executionPackage.packageRecordId,
        version: executionPackage.schemaVersion,
        contentHash: executionPackage.packageHash,
      }),
      captionPlanningProjectionRef: Object.freeze({
        id: projection.projectionId,
        version: projection.schemaVersion,
        contentHash: projection.projectionDigestSha256,
      }),
      captionPlanningBindingRef: Object.freeze({
        ...projection.planningBindingRef,
      }),
      captionRenderedMediaWorkBindingRef: Object.freeze({
        id: renderedMediaBinding.bindingId,
        version: renderedMediaBinding.schemaVersion,
        contentHash: renderedMediaBinding.bindingDigestSha256,
      }),
      exactImmutableApprovedRunRereadVerified: true,
      creativeReviewSupplementsCanonicalFinalCanvas: true,
      creativeReviewReplacesCanonicalFinalCanvas: false,
    }),
    confirmedOutputFrame: Object.freeze({
      frameRef: Object.freeze({ ...confirmed.frameRef }),
      outputId: projection.outputId,
      width: 3_840,
      height: 2_160,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      fpsNumerator: 30,
      fpsDenominator: 1,
    }),
    masterTimingRef: Object.freeze({ ...renderedMediaBinding.masterTimingRef }),
    masterTimingHash: renderedMediaBinding.masterTimingRef.contentHash,
    exactAuthorityDerivedFromCanonicalApprovedRun: true,
  })
}

/**
 * Derives the one exact B-roll owner-read request from the immutable approved
 * run. The B-roll plan itself remains the planning-constraint owner; Caption
 * cannot replace it with a caller-authored request or a second selection lane.
 */
export function deriveCanonicalCaptionBrollApprovedRunOwnerReadRequest(
  run: Awaited<ReturnType<
    typeof createCanonicalCaptionBrollApprovedRunHarness
  >>,
): BrollCaptionOwnerReadRequest {
  const authority = deriveCanonicalCaptionBrollApprovedRunReviewAuthority(run)
  const snapshot = run.approved.authority.snapshot
  const plan = run.broll.plan
  const range = authority.canonicalScope.authorizedFrameRanges[0]
  if (!range
    || authority.canonicalScope.sceneId === null
    || authority.canonicalScope.approvedSnapshotRef === null
    || plan.assignmentId !== run.broll.brollAssignment.assignmentId
    || plan.assignmentHash !== run.broll.brollAssignment.assignmentHash
    || plan.planId !== run.broll.publicPlan.envelope.planId
    || run.broll.publicPlan.payloadRef.artifactType !== 'b_roll_plan_v1'
    || run.broll.publicPlan.payloadRef.sha256 !== hashSkillValue(plan)
    || snapshot.approvedByUserId !== authority.canonicalScope.ownerUserId) {
    throw new Error(
      'Canonical Caption+B-roll approved run cannot derive one exact owner-read request.',
    )
  }
  return createCaptionBrollOwnerReadRequest({
    requestId: `${run.captionRequest.requestId}.broll-owner-read`,
    brollManifestRef: structuredClone(
      BROLL_CAPTION_OWNER_MANIFEST_REF,
    ),
    canonicalScope: {
      ownerUserId: authority.canonicalScope.ownerUserId,
      workspaceId: authority.canonicalScope.workspaceId,
      projectId: authority.canonicalScope.projectId,
      editSessionId: authority.canonicalScope.editSessionId,
      planVersionId: authority.canonicalScope.planVersionId,
      approvedSnapshotRef: {
        ...authority.canonicalScope.approvedSnapshotRef,
      },
      outputId: authority.canonicalScope.outputId,
      outputFrameRef: {
        ...authority.confirmedOutputFrame.frameRef,
      },
      sceneId: authority.canonicalScope.sceneId,
      authorizedFrameRange: {
        startFrameInclusive: range.startFrame,
        endFrameExclusive: range.endFrameExclusive,
        fps: authority.confirmedOutputFrame.fpsNumerator,
      },
      masterTimingRef: { ...authority.masterTimingRef },
      masterTimingHash: authority.masterTimingHash,
    },
    planningConstraintRef: {
      id: plan.planId,
      version: plan.schemaVersion,
      contentHash: plan.planHash,
    },
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
