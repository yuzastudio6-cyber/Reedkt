import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameApprovedLineageBinding,
  LivingFrameApprovedLineageLocator,
} from '../../src/types/living-frame-approved-lineage-binding'
import {
  LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION,
  LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION,
} from '../../src/types/living-frame-approved-lineage-binding'
import type {
  LivingFrameChoreographyBinding,
} from '../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameRendererPlanBinding,
  LivingFrameRendererPlanBindingDraft,
} from '../../src/types/living-frame-renderer-plan-binding'
import {
  LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
  LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES,
  LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
} from '../../src/types/living-frame-renderer-plan-binding'
import type {
  RendererCompositionPlan,
} from '../../src/types/reeditpro'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from '../services/edit-planning-authority-service'
import type {
  AuthorityApprovedSnapshotManifest,
  AuthorityPlanRecord,
  AuthorityPlannedAssetManifest,
} from '../services/private-edit-authority-store'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  createLivingFrameFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  bindLivingFrameApprovedLineage,
  registerLivingFrameApprovedLineageReader,
  verifyLivingFrameApprovedLineageBindingDigest,
} from '../living-frame/living-frame-approved-lineage-binding'
import {
  compileLivingFrameChoreographyBinding,
  verifyLivingFrameChoreographyBindingDigest,
} from '../living-frame/living-frame-choreography-binding'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  verifyLivingFrameRendererPlanBindingDigest,
} from '../living-frame/living-frame-renderer-plan-binding'

const locator: LivingFrameApprovedLineageLocator = {
  schemaVersion: LIVING_FRAME_APPROVED_LINEAGE_LOCATOR_VERSION,
  workspaceId: 'workspace.generic-living-frame',
  projectId: 'project.generic-living-frame',
  editSessionId: 'edit.generic-living-frame',
  snapshotId: 'snapshot.generic-living-frame',
}

const canonicalMasterTimingPlan = {
  id: 'master-timing.generic-lineage',
}
const compiledChoreography = await createCompiledChoreography(
  sha256AuthorityValue(canonicalMasterTimingPlan),
)
const completeResult = createReaderResult()
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(
    completeResult.rendererPlanBinding,
  ),
  true,
)
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(
    completeResult.choreographyBinding,
  ),
  true,
)
const reader = registerLivingFrameApprovedLineageReader({
  schemaVersion: LIVING_FRAME_APPROVED_LINEAGE_READER_VERSION,
  sourceAuthority:
    'controlled_canonical_approved_execution_fixture_reader',
  evidenceClass: 'controlled_non_promotable_lineage_reader',
  productionReady: false,
  async readCurrentByServerOwnedLocator() {
    return structuredClone(completeResult)
  },
})

const binding = await bindLivingFrameApprovedLineage({
  locator,
  reader,
})
assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(binding),
  true,
)
assert.equal(
  binding.bindingState,
  'blocked_by_canonical_living_frame_component_admission',
)
assert.equal(binding.rendererLayerLineage.length, 1)
assert.equal(
  binding.rendererLayerLineage[0]?.lineageState,
  'covered_by_exact_approved_work_output_and_planned_asset',
)
assert.equal(binding.metrics.projectedLayerCount, 1)
assert.equal(binding.metrics.workOutputCoveredLayerCount, 1)
assert.equal(binding.metrics.assetManifestCoveredLayerCount, 1)
assert.equal(
  binding.openGateCodes.includes(
    'canonical_selected_living_frame_scene_component_ref_required',
  ),
  true,
)
assert.equal(
  binding.openGateCodes.includes(
    'canonical_living_frame_renderer_binding_component_ref_required',
  ),
  true,
)
assert.equal(binding.authorityBoundary.approvalAuthority, false)
assert.equal(binding.authorityBoundary.snapshotAuthority, false)
assert.equal(binding.authorityBoundary.workGraphMutationAuthority, false)
assert.equal(binding.authorityBoundary.assetManifestMutationAuthority, false)
assert.equal(binding.authorityBoundary.remotionExecutionAuthority, false)
assert.equal(binding.authorityBoundary.productionAuthority, false)
assert.equal(binding.subjectSpecificRouting, false)

const replay = await bindLivingFrameApprovedLineage({
  locator,
  reader,
})
assert.equal(
  replay.bindingDigestSha256,
  binding.bindingDigestSha256,
)

const missingCoverageResult = createReaderResult({
  rendererLayerIds: [],
})
const missingCoverageReader = registerLivingFrameApprovedLineageReader({
  ...reader,
  async readCurrentByServerOwnedLocator() {
    return structuredClone(missingCoverageResult)
  },
})
const missingCoverage = await bindLivingFrameApprovedLineage({
  locator,
  reader: missingCoverageReader,
})
assert.equal(
  missingCoverage.bindingState,
  'blocked_by_work_or_asset_lineage',
)
assert.equal(
  missingCoverage.openGateCodes.includes(
    'approved_work_output_lineage_incomplete',
  ),
  true,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: {
      ...reader,
      async readCurrentByServerOwnedLocator() {
        return completeResult
      },
    },
  }),
  /registered in this process/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator: { ...locator, workspaceId: 'workspace.wrong' },
    reader,
  }),
  /scope or lineage is invalid/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: registeredMutatingReader((result) => {
      result.authority.snapshot.snapshotHash = digest('0')
    }),
  }),
  /hashes are invalid/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: registeredMutatingReader((result) => {
      result.rendererPlanBinding = resignRenderer({
        ...result.rendererPlanBinding,
        sourceBindings: {
          ...result.rendererPlanBinding.sourceBindings,
          rendererCompositionPlanDigestSha256: digest('1'),
        },
      })
    }),
  }),
  /reader result is invalid|stale or blocked/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: registeredMutatingReader((result) => {
      result.choreographyBinding = resignChoreography({
        ...result.choreographyBinding,
        sourceBindings: {
          ...result.choreographyBinding.sourceBindings,
          masterTimingPlanDigestSha256: digest('2'),
        },
      })
    }),
  }),
  /reader result is invalid|stale or blocked/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: registeredMutatingReader((result) => {
      const duplicate = structuredClone(result.authority.workItems[0]!)
      duplicate.id = 'approved-work.duplicate'
      duplicate.workItemKey = 'work.duplicate'
      duplicate.sourceWorkItemId = 'source-work.duplicate'
      result.authority.workItems.push(duplicate)
      result.authority.snapshot.approvedWorkItemIds.push(duplicate.id)
      result.authority.plan.workItemIds.push(duplicate.sourceWorkItemId)
      const duplicateAsset = structuredClone(
        result.authority.assetManifest.entries[0]!,
      )
      duplicateAsset.id = 'asset.duplicate'
      duplicateAsset.approvedWorkItemId = duplicate.id
      duplicateAsset.workItemKey = duplicate.workItemKey
      result.authority.assetManifest.entries.push(duplicateAsset)
      result.authority.assetManifest.requiredAssetCount = 2
      rebuildAuthorityHashes(result.authority)
    }),
  }),
  /ambiguous work lineage/,
)

await assert.rejects(
  () => bindLivingFrameApprovedLineage({
    locator,
    reader: registeredMutatingReader((result) => {
      result.authority.assetManifest.entries[0]!.outputKey =
        'output.tampered'
      rebuildAuthorityHashes(result.authority)
    }),
  }),
  /does not match work output/,
)

assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(resignOutput({
    ...binding,
    authorityBoundary: {
      ...binding.authorityBoundary,
      approvalAuthority: true,
      snapshotAuthority: true,
      remotionExecutionAuthority: true,
      productionAuthority: true,
    },
  } as unknown as LivingFrameApprovedLineageBinding)),
  false,
)
assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(resignOutput({
    ...binding,
    bindingState:
      'blocked_by_work_or_asset_lineage',
  })),
  false,
)
assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(resignOutput({
    ...binding,
    openGateCodes: [],
  })),
  false,
)
assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(resignOutput({
    ...binding,
    subjectSpecificRouting: true,
  } as unknown as LivingFrameApprovedLineageBinding)),
  false,
)
assert.equal(
  verifyLivingFrameApprovedLineageBindingDigest(resignUnknown({
    ...binding,
    providerId: 'forged-provider',
  })),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-approved-lineage-binding',
  controlledCases: 2,
  adversarialAssertions: 11,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  selectedSceneAuthorityGranted:
    binding.authorityBoundary.selectedSceneAuthority,
  approvalAuthorityGranted:
    binding.authorityBoundary.approvalAuthority,
  snapshotAuthorityGranted:
    binding.authorityBoundary.snapshotAuthority,
  workGraphMutationAuthorityGranted:
    binding.authorityBoundary.workGraphMutationAuthority,
  assetManifestMutationAuthorityGranted:
    binding.authorityBoundary.assetManifestMutationAuthority,
  remotionExecutionAuthorityGranted:
    binding.authorityBoundary.remotionExecutionAuthority,
  productionAuthorityGranted:
    binding.authorityBoundary.productionAuthority,
}))

function createReaderResult(options?: {
  rendererLayerIds?: string[]
}) {
  const rendererPlan = createRendererPlan()
  const masterTimingPlan = canonicalMasterTimingPlan
  const masterTimingDigest = sha256AuthorityValue(masterTimingPlan)
  const rendererPlanBinding = createRendererBinding({
    rendererPlan,
    masterTimingDigest,
  })
  const choreographyBinding = structuredClone(compiledChoreography)
  const authority = createAuthority({
    rendererPlan,
    masterTimingPlan,
    rendererLayerIds:
      options?.rendererLayerIds ?? ['renderer-layer.generic'],
  })
  return {
    authority,
    rendererPlanBinding,
    choreographyBinding,
  }
}

function createRendererPlan(): RendererCompositionPlan {
  return {
    id: 'renderer-plan.generic-lineage',
    engine: 'remotion',
    frameTemplate: {
      templateType: 'horizontal_wide_frame',
      aspectRatio: '16:9',
      canvasWidth: 1920,
      canvasHeight: 1080,
      animationZone: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
      safeMargin: 48,
      panelBackgroundColor: '#111111',
      notes: [],
    },
    durationSeconds: 3,
    fps: 30,
    masterTimingPlanId: 'master-timing.generic-lineage',
    layers: [],
    captionSafeZone: {
      x: 100,
      y: 850,
      width: 1720,
      height: 180,
    },
    panelBackgroundColor: '#111111',
    rendererNotes: [],
    approvalRequired: true,
    renderReady: false,
  }
}

function createRendererBinding(input: {
  rendererPlan: RendererCompositionPlan
  masterTimingDigest: string
}): LivingFrameRendererPlanBinding {
  const gates = LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES
    .filter((gate) =>
      gate !== 'living_frame_projection_blockers_must_resolve')
    .slice()
    .sort()
  const draft: LivingFrameRendererPlanBindingDraft = {
    contractVersion: LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
    bindingClass: LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
    sceneId: 'scene.hormuz-a-roll',
    sourceBindings: {
      livingFrameProjectionDigestSha256: digest('3'),
      deterministicMotionBundleDigestSha256: digest('4'),
      rendererCompositionPlanId: input.rendererPlan.id,
      rendererCompositionPlanDigestSha256:
        sha256AuthorityValue(input.rendererPlan),
      masterTimingPlanId: 'master-timing.generic-lineage',
      masterTimingPlanDigestSha256: input.masterTimingDigest,
      outputFrameId: 'output-frame.generic-lineage',
      outputFrameDigestSha256: digest('5'),
    },
    projectionState: 'candidate_pending_canonical_renderer_adapter',
    layerBindings: [{
      order: 0,
      projectedComponentId: 'component.generic',
      rendererLayerId: 'renderer-layer.generic',
      rendererLayerType: 'still_image',
      fitMode: 'contain',
      zIndex: 1,
      primitive: 'rgba_raster_layer',
      artifact: {
        artifactId: 'artifact.generic',
        artifactDigestSha256: digest('6'),
      },
      maskArtifact: null,
      motionTrackIds: [],
      motionSampleCount: 0,
      zonePixels: {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      },
    }],
    cameraBindings: [],
    captionLayerIds: [],
    bindingState: 'candidate_pending_canonical_snapshot_projection',
    openGateCodes: gates,
    metrics: {
      projectedLayerBindingCount: 1,
      projectedCameraBindingCount: 0,
      projectedMotionTrackCount: 0,
      projectedMotionSampleCount: 0,
      captionLayerCount: 0,
      unresolvedProjectionGateCount: 0,
    },
    authorityBoundary: {
      bindingCandidateOnly: true,
      rendererPlanAuthority: false,
      rendererLayerIdAuthority: false,
      rendererLayerMutationAuthority: false,
      masterTimingAuthority: false,
      exactFrameAuthority: false,
      soundSyncAuthority: false,
      estimateAuthority: false,
      costAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      assetManifestAuthority: false,
      artifactQaAuthority: false,
      providerAuthority: false,
      toolRouteAuthority: false,
      workGraphAuthority: false,
      queueAuthority: false,
      remotionExecutionAuthority: false,
      privateReviewAuthority: false,
      runtimePromotionAuthority: false,
      productionAuthority: false,
    },
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueOrCostRoute: false,
    containsExecutableCodeOrCommands: false,
    existingRendererCompositionPlanRemainsAuthority: true,
    canonicalSnapshotAdapterStillRequired: true,
    remotionExecutionStillForbidden: true,
  }
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function createAuthority(input: {
  rendererPlan: RendererCompositionPlan
  masterTimingPlan: Record<string, unknown>
  rendererLayerIds: string[]
}): CanonicalApprovedExecutionAuthority {
  const componentRefs = {
    sourceSequence: refFor([]),
    masterTimingPlan: refFor(input.masterTimingPlan),
    captionVisualCueTimingPlan: refFor({ id: 'caption-timing.generic' }),
    soundSyncTransitionTimingPlan:
      refFor({ id: 'soundsync-timing.generic' }),
    timingValidationPlan: refFor({ id: 'timing-validation.generic' }),
    timingSummary: refFor({ status: 'passed' }),
    rendererPlan: refFor(input.rendererPlan),
  }
  const expectedOutput = {
    outputKey: 'output.generic-layer',
    artifactType: 'remotion_layer',
    assetRole: 'processed' as const,
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment.generic'],
    timingIds: ['timing.generic'],
    rendererLayerIds: input.rendererLayerIds,
  }
  const workItem: CanonicalApprovedExecutionWorkItem = {
    id: 'approved-work.generic-layer',
    snapshotId: locator.snapshotId,
    sourceWorkItemId: 'source-work.generic-layer',
    workItemKey: 'work.generic-layer',
    workItemType: 'prepare_remotion_layers',
    workerClass: 'remotion_layer_preparation',
    executionInputRef: refFor({ sceneId: 'scene.generic-lineage' }),
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [expectedOutput],
    dependencyKeys: [],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicyRef: refFor({ fallback: 'static_layer' }),
    maxAttempts: 1,
    attemptTimeoutSeconds: 30,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
    executionInputHash:
      refFor({ sceneId: 'scene.generic-lineage' }).sha256,
    createdAt: '2026-07-26T00:00:00.000Z',
    executionInput: { sceneId: 'scene.generic-lineage' },
    fallbackPolicy: { fallback: 'static_layer' },
  }
  const workItems = [workItem]
  const workGraphHash = calculateWorkGraphHash(workItems)
  const planCore = {
    schemaVersion: 'private-edit-authority-plan-v2',
    componentRefs,
    workGraphHash,
  }
  const planHash = sha256AuthorityValue(planCore)
  const timingHash = sha256AuthorityValue({
    masterTimingPlan: componentRefs.masterTimingPlan,
    captionVisualCueTimingPlan: componentRefs.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan:
      componentRefs.soundSyncTransitionTimingPlan,
    timingValidationPlan: componentRefs.timingValidationPlan,
    timingSummary: componentRefs.timingSummary,
  })
  const plan: AuthorityPlanRecord = {
    id: 'plan.generic-living-frame',
    projectId: locator.projectId,
    editSessionId: locator.editSessionId,
    planningRequestId: 'planning-request.generic-living-frame',
    planVersion: 1,
    status: 'approved',
    componentRefs,
    estimateId: 'estimate.generic-living-frame',
    workItemIds: [workItem.sourceWorkItemId],
    planHash,
    workGraphHash,
    sourceSequenceHash: componentRefs.sourceSequence.sha256,
    timingHash,
    createdAt: '2026-07-26T00:00:00.000Z',
    approvedAt: '2026-07-26T00:01:00.000Z',
  }
  const assetEntry = {
    id: 'asset.generic-layer',
    snapshotId: locator.snapshotId,
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    ...expectedOutput,
    status: 'planned' as const,
    version: 1 as const,
    createdAt: '2026-07-26T00:01:00.000Z',
  }
  const manifestCore = {
    schemaVersion: 'private-edit-asset-manifest-v1' as const,
    snapshotId: locator.snapshotId,
    planId: plan.id,
    planHash,
    workGraphHash,
    entries: [assetEntry],
    requiredAssetCount: 1,
    optionalAssetCount: 0,
  }
  const assetManifest: AuthorityPlannedAssetManifest = {
    ...manifestCore,
    manifestHash: sha256AuthorityValue(manifestCore),
  }
  const snapshotCore = {
    schemaVersion:
      'private-edit-authority-approved-snapshot-v3' as const,
    snapshotId: locator.snapshotId,
    workspaceId: locator.workspaceId,
    projectId: locator.projectId,
    editSessionId: locator.editSessionId,
    planId: plan.id,
    planVersion: plan.planVersion,
    estimateId: plan.estimateId,
    approvalId: 'approval.generic-living-frame',
    reservationId: 'reservation.generic-living-frame',
    approvedByUserId: 'user.generic-living-frame',
    approvedAt: '2026-07-26T00:01:00.000Z',
    componentRefs,
    approvedWorkItemIds: [workItem.id],
    planHash,
    estimateHash: digest('8'),
    workGraphHash,
    sourceSequenceHash: plan.sourceSequenceHash,
    timingHash,
    approvedAssetManifestRef: refFor(assetManifest),
    approvedAssetManifestHash: assetManifest.manifestHash,
    approvedSourceAssetManifestRef: refFor({
      id: 'source-manifest.generic',
    }),
    approvedSourceAssetManifestHash: digest('9'),
  }
  const snapshot: AuthorityApprovedSnapshotManifest = {
    ...snapshotCore,
    snapshotHash: sha256AuthorityValue(snapshotCore),
  }
  return {
    authorityRevision: 1,
    snapshot,
    plan,
    estimate: {
      id: plan.estimateId,
      planId: plan.id,
      estimateVersion: 1,
      status: 'approved',
      lineItems: [],
      estimatedCredits: 0,
      fallbackAllowanceCredits: 0,
      approvedMaximumCredits: 0,
      estimateHash: snapshot.estimateHash,
      validUntil: '2026-07-27T00:00:00.000Z',
      createdAt: '2026-07-26T00:00:00.000Z',
      approvedAt: '2026-07-26T00:01:00.000Z',
    },
    reservation: {
      id: snapshot.reservationId,
      approvalId: snapshot.approvalId,
      snapshotId: snapshot.snapshotId,
      estimateId: snapshot.estimateId,
      planId: snapshot.planId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      status: 'reserved',
      reservedCredits: 0,
      spentCredits: 0,
      releasedCredits: 0,
      refundedCredits: 0,
      reservedAt: snapshot.approvedAt,
      expiresAt: '2026-07-27T00:00:00.000Z',
      updatedAt: snapshot.approvedAt,
    },
    approval: {
      id: snapshot.approvalId,
      planId: snapshot.planId,
      estimateId: snapshot.estimateId,
      snapshotId: snapshot.snapshotId,
      reservationId: snapshot.reservationId,
      approvedByUserId: snapshot.approvedByUserId,
      approvedAt: snapshot.approvedAt,
      requestHash: digest('a'),
      idempotencyKey: 'idempotency.generic-living-frame',
    },
    components: {
      rendererPlan: input.rendererPlan,
      masterTimingPlan: input.masterTimingPlan,
    } as unknown as CanonicalApprovedExecutionAuthority['components'],
    assetManifest,
    planningInputAuthority:
      {} as CanonicalApprovedExecutionAuthority['planningInputAuthority'],
    canonicalCustomerEstimateAuthority:
      {} as CanonicalApprovedExecutionAuthority['canonicalCustomerEstimateAuthority'],
    toolExecutionAuthority:
      {} as CanonicalApprovedExecutionAuthority['toolExecutionAuthority'],
    toolPayloadAuthority:
      {} as CanonicalApprovedExecutionAuthority['toolPayloadAuthority'],
    sourceAssetManifest:
      {} as CanonicalApprovedExecutionAuthority['sourceAssetManifest'],
    workItems,
    jobs: [],
    testOnly: true,
  }
}

async function createCompiledChoreography(
  masterTimingDigest: string,
): Promise<LivingFrameChoreographyBinding> {
  const parentDraft = structuredClone(
    createLivingFrameFixtureDrafts().hormuzLivingARoll,
  ) as LivingFrameProfessionalSkillComponentDraft
  const mutableScene = parentDraft.scenePlans[0] as unknown as {
    attentionSequence: Array<{ methods: string[] }>
  }
  mutableScene.attentionSequence[0]!.methods = [
    'motion_emphasis_expectation',
  ]
  mutableScene.attentionSequence[1]!.methods = [
    'focus_depth_expectation',
    'motion_emphasis_expectation',
  ]
  mutableScene.attentionSequence[2]!.methods = [
    'motion_emphasis_expectation',
  ]
  mutableScene.attentionSequence[3]!.methods = [
    'focus_depth_expectation',
  ]
  const parent =
    await createLivingFrameProfessionalSkillComponent(parentDraft)
  const tracks: LivingFrameMotionTrackDraft[] = [
    {
      trackId: 'track.hormuz-route-reveal',
      order: 0,
      motionGroupId: 'motion.hormuz-primary',
      componentId: 'hormuz.routes',
      property: 'path_reveal',
      role: 'primary',
      restorationExpectation: 'not_applicable',
      keyframes: [
        { frame: 10, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 60, value: 1, easingToNext: 'hold' },
      ],
    },
    {
      trackId: 'track.hormuz-focus',
      order: 1,
      motionGroupId: 'motion.hormuz-attention',
      componentId: 'hormuz.map',
      property: 'focus_depth_normalized',
      role: 'secondary',
      restorationExpectation: 'required_return_to_initial',
      keyframes: [
        { frame: 0, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 30, value: 0.72, easingToNext: 'settle_out' },
        { frame: 89, value: 0, easingToNext: 'hold' },
      ],
    },
  ]
  const motion = compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId: canonicalMasterTimingPlan.id,
      masterTimingPlanDigestSha256: masterTimingDigest,
      outputFrameId: 'output-frame.generic-lineage',
      outputFrameDigestSha256: digest('5'),
      sceneId: 'scene.hormuz-a-roll',
      sceneStartFrame: 0,
      sceneEndFrame: 89,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks,
  })
  return compileLivingFrameChoreographyBinding({
    livingFrameComponent: parent,
    sceneId: 'scene.hormuz-a-roll',
    motionBundle: motion,
    attentionTrackBindings: [
      {
        attentionEventId: 'attention.hormuz-prepare',
        motionTrackIds: ['track.hormuz-route-reveal'],
        soundRequestIds: [],
      },
      {
        attentionEventId: 'attention.hormuz-handoff',
        motionTrackIds: [
          'track.hormuz-focus',
          'track.hormuz-route-reveal',
        ],
        soundRequestIds: [],
      },
      {
        attentionEventId: 'attention.hormuz-hold',
        motionTrackIds: ['track.hormuz-route-reveal'],
        soundRequestIds: [],
      },
      {
        attentionEventId: 'attention.hormuz-restore',
        motionTrackIds: ['track.hormuz-focus'],
        soundRequestIds: [],
      },
    ],
    semanticScaleTrackBindings: [{
      semanticScaleRequestId: 'scale.hormuz-map-truth',
      motionTrackIds: [],
    }],
  })
}

function registeredMutatingReader(
  mutate: (result: ReturnType<typeof createReaderResult>) => void,
) {
  return registerLivingFrameApprovedLineageReader({
    ...reader,
    async readCurrentByServerOwnedLocator() {
      const result = structuredClone(completeResult)
      mutate(result)
      return result
    },
  })
}

function rebuildAuthorityHashes(
  authority: CanonicalApprovedExecutionAuthority,
): void {
  authority.plan.workGraphHash =
    calculateWorkGraphHash(authority.workItems)
  authority.plan.planHash = sha256AuthorityValue({
    schemaVersion: 'private-edit-authority-plan-v2',
    componentRefs: authority.plan.componentRefs,
    workGraphHash: authority.plan.workGraphHash,
  })
  authority.snapshot.planHash = authority.plan.planHash
  authority.snapshot.workGraphHash = authority.plan.workGraphHash
  authority.assetManifest.planHash = authority.plan.planHash
  authority.assetManifest.workGraphHash = authority.plan.workGraphHash
  const { manifestHash: _oldManifestHash, ...manifestCore } =
    authority.assetManifest
  void _oldManifestHash
  authority.assetManifest.manifestHash =
    sha256AuthorityValue(manifestCore)
  authority.snapshot.approvedAssetManifestHash =
    authority.assetManifest.manifestHash
  authority.snapshot.approvedAssetManifestRef =
    refFor(authority.assetManifest)
  const { snapshotHash: _oldSnapshotHash, ...snapshotCore } =
    authority.snapshot
  void _oldSnapshotHash
  authority.snapshot.snapshotHash = sha256AuthorityValue(snapshotCore)
}

function calculateWorkGraphHash(
  workItems: readonly CanonicalApprovedExecutionWorkItem[],
): string {
  return sha256AuthorityValue(workItems.map((workItem) => ({
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    sourceSequenceItemIds: workItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
    expectedOutputs: workItem.expectedOutputs,
    dependencyKeys: workItem.dependencyKeys,
    approvedToolIds: workItem.approvedToolIds,
    approvedProviderRoute: workItem.approvedProviderRoute,
    providerExecutionMode: workItem.providerExecutionMode,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
    executionInputRef: workItem.executionInputRef,
    fallbackPolicyRef: workItem.fallbackPolicyRef,
  })))
}

function refFor(value: unknown) {
  const serialized = JSON.stringify(value)
  return {
    sha256: sha256AuthorityValue(value),
    byteLength: Buffer.byteLength(serialized),
  }
}

function resignRenderer(
  value: LivingFrameRendererPlanBinding,
): LivingFrameRendererPlanBinding {
  const { bindingDigestSha256: _oldDigest, ...draft } = value
  void _oldDigest
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function resignChoreography(
  value: LivingFrameChoreographyBinding,
): LivingFrameChoreographyBinding {
  const { bindingDigestSha256: _oldDigest, ...draft } = value
  void _oldDigest
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function resignOutput(
  value: LivingFrameApprovedLineageBinding,
): LivingFrameApprovedLineageBinding {
  const { bindingDigestSha256: _oldDigest, ...draft } = value
  void _oldDigest
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function resignUnknown(value: Record<string, unknown>) {
  const clone = structuredClone(value)
  delete clone.bindingDigestSha256
  return {
    ...clone,
    bindingDigestSha256: sha256AuthorityValue(clone),
  }
}

function digest(character: string): string {
  return character.repeat(64)
}
