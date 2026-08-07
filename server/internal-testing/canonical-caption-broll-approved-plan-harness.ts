import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
  brollPlanArtifactSchema,
  brollPlanningQaReportSchema,
  compileBrollCanonicalWorkGraph,
  createBrollAssignment,
  createBrollMasterTimingPlan,
  createCanonicalBrollMasterTimingProjectionBinding,
  createBrollPlanningContext,
  createBrollPublicContextManifest,
  createBrollSourceInventory,
  createBrollVisualOwnershipManifest,
  createSourceMediaArtifactV1,
  projectBrollCanonicalWorkItems,
  type BrollMasterTimingPlan,
  type BrollPublicContextManifest,
  type CanonicalBrollMasterTimingProjectionBinding,
  type BrollPlanningContext,
  type BrollSkillAssignment,
  type SourceMediaArtifactV1,
} from '../edit-skills/b-roll'
import {
  createEditSkillPlanApproval,
  createSkillAssignment,
  hashSkillValue,
  InMemoryCreateOnlyEditSkillArtifactStore,
  skillManifestReference,
  type EditSkillApprovedWorkGraph,
  type EditSkillArtifactReference,
  type EditSkillPublicPlan,
  type SkillAssignment,
  type SkillFrameRange,
} from '../edit-skills/core'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from '../edit-skills/registry'
import {
  persistCanonicalBrollPlanComponent,
  revalidateCanonicalBrollPlanAuthority,
} from '../services/canonical-broll-plan-component-service'

export const CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION =
  'canonical-caption-broll-approved-plan-harness-v1' as const

export interface CanonicalCaptionBrollApprovedPlanHarnessInput {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly planningRequestId: string
  readonly assignmentId: string
  readonly editPlanVersion: number
  readonly canonicalMasterTimingPlan: Record<string, unknown>
  readonly canonicalTimingSummary: {
    readonly validationStatus: 'passed' | 'warning'
    readonly approvalBlocked: false
    readonly fps: number
    readonly totalFrames: number
  }
  readonly timelineRange: SkillFrameRange
  readonly authorizedRange: SkillFrameRange
  readonly segmentIds: readonly string[]
  readonly confirmedAspectRatio: string
  readonly approvedAt: string
  readonly source: {
    readonly sourceSequenceItemId: string
    readonly objectSha256: string
    readonly byteLength: number
    readonly durationFrames: number
    readonly frameRateNumerator: number
    readonly frameRateDenominator: number
    readonly fps: number
    readonly width: number
    readonly height: number
    readonly sourceRange: SkillFrameRange
  }
}

export interface CanonicalCaptionBrollApprovedPlanHarnessResult {
  readonly harnessVersion:
    typeof CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION
  readonly masterTimingPlan: BrollMasterTimingPlan
  readonly masterTimingBinding:
    CanonicalBrollMasterTimingProjectionBinding
  readonly sourceManifest: SourceMediaArtifactV1
  readonly sourceManifestRef: EditSkillArtifactReference
  readonly assignment: SkillAssignment
  readonly brollAssignment: BrollSkillAssignment
  readonly context: BrollPlanningContext
  readonly visualOwnership: ReturnType<
    typeof createBrollVisualOwnershipManifest
  >
  readonly sourceInventory: ReturnType<typeof createBrollSourceInventory>
  readonly publicContextManifest: BrollPublicContextManifest
  readonly publicPlan: EditSkillPublicPlan
  readonly publicApprovedWorkGraph: EditSkillApprovedWorkGraph
  readonly canonicalWorkGraph: ReturnType<
    typeof compileBrollCanonicalWorkGraph
  >
  readonly canonicalWorkItems: ReturnType<
    typeof projectBrollCanonicalWorkItems
  >
  readonly persistedComponent: Awaited<ReturnType<
    typeof persistCanonicalBrollPlanComponent
  >>
  readonly estimatedCredits: number
  readonly providerWorkPlanned: false
  readonly runtimeDispatched: false
  readonly assetCreated: false
  readonly finalQaApproved: false
  readonly publicDeliveryCreated: false
  readonly productionAuthorityGranted: false
}

/**
 * Internal qualification assembly only. This function calls the registered
 * B-roll plugin, its immutable component writer, and its canonical work-graph
 * projector. It deliberately does not execute a work item, select a provider,
 * create media, approve final QA, or act as a Caption/B-roll dispatcher.
 */
export async function createCanonicalCaptionBrollApprovedPlanHarness(
  input: CanonicalCaptionBrollApprovedPlanHarnessInput,
): Promise<CanonicalCaptionBrollApprovedPlanHarnessResult> {
  assertInputTiming(input)
  const registries = createEditSkillRuntimeRegistries()
  const runtime = createEditSkillRuntime({
    environmentClass: 'internal_fixture',
    artifactStore: new InMemoryCreateOnlyEditSkillArtifactStore(
      registries.artifactSchemaRegistry,
    ),
    providerAuthority: {
      operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    toolRegistry: { operationIds: new Set(BROLL_TOOL_OPERATIONS) },
    ...registries,
  })
  const artifactStore = runtime.artifactStore
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const plugin = runtime.pluginRegistry.resolve(manifestRef)
  const scope = {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
  }
  const sourceManifest = createSourceMediaArtifactV1({
    schemaVersion: 'source_media_artifact_v1',
    ...scope,
    sourceId: input.source.sourceSequenceItemId,
    privateObjectIdentityHash: hashSkillValue({
      ...scope,
      sourceSequenceItemId: input.source.sourceSequenceItemId,
      objectSha256: input.source.objectSha256,
    }),
    objectSha256: input.source.objectSha256,
    byteLength: input.source.byteLength,
    mimeType: 'video/mp4',
    container: 'mp4',
    durationFrames: input.source.durationFrames,
    fps: input.source.frameRateNumerator,
    width: input.source.width,
    height: input.source.height,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofClassification: 'source_verified',
    checksumReadbackVerified: true,
    privateOnly: true,
    publicDeliveryAllowed: false,
    immutable: true,
  })
  const sourceManifestRef = await artifactStore.putJson({
    artifactType: 'source_media_artifact_v1',
    ...scope,
    value: sourceManifest,
  })
  const masterTimingPlan = createBrollMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1',
    ...scope,
    editSessionId: input.editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: input.editPlanVersion,
    manifestRef,
    fps: input.timelineRange.fps,
    timelineRange: input.timelineRange,
    assignmentRange: input.authorizedRange,
  })
  const masterTimingBinding =
    createCanonicalBrollMasterTimingProjectionBinding({
      scope: {
        ownerUserId: input.ownerUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
      canonicalTimingSummary: input.canonicalTimingSummary,
      brollTimingProjection: masterTimingPlan,
    })
  const masterTimingRef = await artifactStore.putJson({
    artifactType: 'master_timing_plan_v1',
    ...scope,
    value: masterTimingPlan,
  })
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId: input.editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: input.editPlanVersion,
    manifestRef,
    assignmentRange: input.authorizedRange,
    requestedOwnership: 'support',
    ownershipWindows: [],
  })
  const visualOwnershipRef = await artifactStore.putJson({
    artifactType: 'visual_ownership_manifest_v1',
    ...scope,
    value: visualOwnership,
  })
  const sourceCandidate = {
    sourceId: sourceManifest.sourceId,
    sourceType: 'existing_project_clip' as const,
    artifactRef: sourceManifestRef,
    sourceRange: input.source.sourceRange,
    semanticRelevance: 0.99,
    visualQuality: 0.95,
    temporalFit: 0.98,
    storyContinuity: 0.96,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofSafe: true,
    repetitionRisk: 0,
    cropFeasibility: 0.98,
    speakerActionProtection: 0.95,
    audioUsefulness: 0.5,
    costCredits: 1,
    approvedByUser: true,
  }
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: input.assignmentId,
    baseFootageStrength: 0.4,
    speakerEmotionImportance: 0.2,
    meaningfulVisualNeed: 0.95,
    userVisualPreference: 'balanced',
    claimSensitivity: 'none',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: false,
    sourceCandidates: [sourceCandidate],
    priorConceptKeys: [],
    confirmedAspectRatio: input.confirmedAspectRatio,
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: [
      'Do not substitute or imitate an unrelated reference shot.',
    ],
  })
  const sourceInventory = createBrollSourceInventory({
    schemaVersion: 'source_inventory_v1',
    ...scope,
    editSessionId: input.editSessionId,
    assignmentId: input.assignmentId,
    editPlanVersion: input.editPlanVersion,
    manifestRef,
    candidates: [sourceCandidate],
  })
  const sourceInventoryRef = await artifactStore.putJson({
    artifactType: 'source_inventory_v1',
    ...scope,
    value: sourceInventory,
  })
  const brollAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: input.assignmentId,
    orchestrationRunId: `internal-caption-broll.${input.assignmentId}`,
    ...scope,
    editSessionId: input.editSessionId,
    editPlanVersion: input.editPlanVersion,
    masterTimingHash: masterTimingPlan.timingHash,
    masterTimingRange: input.timelineRange,
    segmentIds: [...input.segmentIds],
    sourceSequenceIds: [input.source.sourceSequenceItemId],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [
        sourceInventoryRef,
        masterTimingRef,
        visualOwnershipRef,
      ],
    },
    writeRangeAuthority: {
      authorizedRange: input.authorizedRange,
      outsideAuthorizedRangeModified: false,
    },
    reason: 'Use the exact approved project source as a restrained cutaway.',
    pointToProveClarifyCoverOrSupport:
      'Clarify the exact approved beat without fabricating proof.',
    expectedViewerBenefit:
      'See source-backed visual context while the Caption remains readable.',
    requestedVisualOwnership: 'support',
    forbiddenInterpretations: [
      'Do not present illustrative media as verified documentary proof.',
    ],
    permittedSourceRoutes: ['use_existing_project_clip', 'use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 120,
    maximumCredits: 20,
    requiredOutputTypes: ['b_roll_result_receipt_v1'],
    manifestRef,
  })
  const assignmentRef = await artifactStore.putJson({
    artifactType: 'b_roll_assignment_v1',
    ...scope,
    value: brollAssignment,
  })
  const publicContext = createBrollPublicContextManifest({
    context,
    editSessionId: input.editSessionId,
    editPlanVersion: input.editPlanVersion,
    manifestRef,
    assignmentRef,
    sourceInventoryRef,
    masterTimingRef,
    visualOwnershipRef,
  })
  const contextRef = await artifactStore.putJson({
    artifactType: 'b_roll_context_manifest_v1',
    ...scope,
    value: publicContext,
  })
  const assignment = createSkillAssignment({
    schemaVersion: 'edit-skill-assignment-v1',
    assignmentId: input.assignmentId,
    ...scope,
    editSessionId: input.editSessionId,
    planningRequestId: input.planningRequestId,
    manifestRef,
    authorizedRange: input.authorizedRange,
    reason: brollAssignment.reason,
    intendedViewerBenefit: brollAssignment.expectedViewerBenefit,
    editorialContext:
      'Private Caption plus B-roll approved-plan qualification; future HQ-mediated owner assignment.',
    visualOwnership: 'support',
    contextArtifactRefs: [
      assignmentRef,
      contextRef,
      sourceInventoryRef,
      masterTimingRef,
      visualOwnershipRef,
    ],
    dependencyArtifactRefs: [],
    requestedBySkill: 'orchestra',
  })
  const publicPlan = await plugin.planAssignment({ assignment })
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planId: publicPlan.envelope.planId,
    planHash: publicPlan.envelope.planHash,
    manifestRef,
    authorizedRange: input.authorizedRange,
    approved: true,
    approvedAt: input.approvedAt,
  })
  const publicApprovedWorkGraph = await plugin.compileApprovedWorkGraph({
    assignment,
    plan: publicPlan,
    approval,
  })
  const plan = brollPlanArtifactSchema.parse(await artifactStore.readJson({
    reference: publicPlan.payloadRef,
    ...scope,
  }))
  const planningQaReport = brollPlanningQaReportSchema.parse(
    await artifactStore.readJson({
      reference: publicPlan.evidenceRefs[0]!,
      ...scope,
    }),
  )
  const canonicalWorkGraph = compileBrollCanonicalWorkGraph({
    assignment: brollAssignment,
    plan,
  })
  if (publicApprovedWorkGraph.pluginWorkGraphHash !==
    canonicalWorkGraph.workGraphHash) {
    throw new Error(
      'Caption+B-roll harness rejected divergent public and canonical B-roll work graphs.',
    )
  }
  const canonicalWorkItems = projectBrollCanonicalWorkItems({
    assignment: brollAssignment,
    workGraph: canonicalWorkGraph,
  })
  const persistedComponent = await persistCanonicalBrollPlanComponent({
    localStorageRoot: input.localStorageRoot,
    assignment: brollAssignment,
    context,
    plan,
    planningQaReport,
    workGraph: canonicalWorkGraph,
    qualificationReceipt: runtime.qualificationRegistry.resolve(manifestRef),
    executionAuthorities: {
      sourceInventory,
      masterTimingProjection: masterTimingPlan,
      visualOwnership,
      publicContextManifest: publicContext,
      sourceMediaArtifacts: [sourceManifest],
    },
    publicLifecycleAuthorities: {
      publicAssignment: assignment,
      publicPlan,
      approval,
      approvedPublicWorkGraph: publicApprovedWorkGraph,
    },
  })
  const reread = await revalidateCanonicalBrollPlanAuthority({
    localStorageRoot: input.localStorageRoot,
    component: persistedComponent.component,
    masterTimingBinding,
    canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
    canonicalTimingSummary: input.canonicalTimingSummary,
    canonicalWorkItems,
  })
  if (
    reread.assignment?.assignmentHash !== brollAssignment.assignmentHash ||
    reread.workGraph?.workGraphHash !== canonicalWorkGraph.workGraphHash ||
    reread.publicLifecycleAuthorities?.approval.approvalHash !==
      approval.approvalHash ||
    reread.publicLifecycleAuthorities.approvedPublicWorkGraph
      .approvedWorkGraphHash !== publicApprovedWorkGraph.approvedWorkGraphHash
  ) {
    throw new Error(
      'Caption+B-roll harness failed immutable component/work-graph reread.',
    )
  }
  if (
    plan.decision !== 'use_existing_project_clip' ||
    plan.providerRequestPlanned ||
    canonicalWorkItems.some((item) => item.approvedProviderRoute !== undefined)
  ) {
    throw new Error(
      'Caption+B-roll existing-source harness unexpectedly planned provider work.',
    )
  }

  return {
    harnessVersion: CANONICAL_CAPTION_BROLL_APPROVED_PLAN_HARNESS_VERSION,
    masterTimingPlan,
    masterTimingBinding,
    sourceManifest,
    sourceManifestRef,
    assignment,
    brollAssignment,
    context,
    visualOwnership,
    sourceInventory,
    publicContextManifest: publicContext,
    publicPlan,
    publicApprovedWorkGraph,
    canonicalWorkGraph,
    canonicalWorkItems,
    persistedComponent,
    estimatedCredits: plan.creditEstimate,
    providerWorkPlanned: false,
    runtimeDispatched: false,
    assetCreated: false,
    finalQaApproved: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }
}

function assertInputTiming(
  input: CanonicalCaptionBrollApprovedPlanHarnessInput,
): void {
  if (
    input.timelineRange.fps !== input.authorizedRange.fps ||
    input.timelineRange.fps !== input.source.sourceRange.fps ||
    input.source.fps !== input.source.sourceRange.fps ||
    input.source.frameRateDenominator !== 1 ||
    input.source.frameRateNumerator !== input.source.fps ||
    input.authorizedRange.startFrameInclusive <
      input.timelineRange.startFrameInclusive ||
    input.authorizedRange.endFrameExclusive >
      input.timelineRange.endFrameExclusive ||
    input.source.sourceRange.endFrameExclusive > input.source.durationFrames ||
    input.segmentIds.length === 0 ||
    new Set(input.segmentIds).size !== input.segmentIds.length
  ) {
    throw new Error(
      'Caption+B-roll approved-plan harness requires one exact contained timing and segment authority.',
    )
  }
}
