import assert from 'node:assert/strict'

import type {
  LivingFrameApprovedLineageBinding,
  LivingFrameApprovedLineageBindingDraft,
} from '../../src/types/living-frame-approved-lineage-binding'
import {
  LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS,
  LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION,
  LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES,
} from '../../src/types/living-frame-approved-lineage-binding'
import type {
  LivingFrameChoreographyBinding,
  LivingFrameChoreographyBindingDraft,
} from '../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameRemotionProfile,
} from '../../src/types/living-frame-remotion-profile'
import type {
  LivingFrameRendererPlanBinding,
  LivingFrameRendererPlanBindingDraft,
} from '../../src/types/living-frame-renderer-plan-binding'
import {
  LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
  LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES,
  LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
} from '../../src/types/living-frame-renderer-plan-binding'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameApprovedLineageBindingDigest,
} from '../living-frame/living-frame-approved-lineage-binding'
import {
  verifyLivingFrameChoreographyBindingDigest,
} from '../living-frame/living-frame-choreography-binding'
import {
  livingFrameChoreographyFixtureBinding,
} from './living-frame-choreography-binding-smoke'
import {
  compileLivingFrameRemotionProfile,
  verifyLivingFrameRemotionProfileDigest,
} from '../living-frame/living-frame-remotion-profile'
import {
  verifyLivingFrameRendererPlanBindingDigest,
} from '../living-frame/living-frame-renderer-plan-binding'

const sceneId = livingFrameChoreographyFixtureBinding.sceneId
const choreography = structuredClone(
  livingFrameChoreographyFixtureBinding,
)
const renderer = createRendererBinding()
const lineage = createApprovedLineageBinding(renderer, choreography)
assert.equal(verifyLivingFrameRendererPlanBindingDigest(renderer), true)
assert.equal(verifyLivingFrameChoreographyBindingDigest(choreography), true)
assert.equal(verifyLivingFrameApprovedLineageBindingDigest(lineage), true)

const profile = compileLivingFrameRemotionProfile({
  rendererPlanBinding: renderer,
  choreographyBinding: choreography,
  approvedLineageBinding: lineage,
})

assert.equal(verifyLivingFrameRemotionProfileDigest(profile), true)
assert.equal(
  profile.compositionProfileId,
  'living_frame_deterministic_layered_scene_v1',
)
assert.equal(
  profile.profileState,
  'blocked_by_canonical_component_admission',
)
assert.equal(profile.layers.length, 1)
assert.equal(profile.layers[0]?.componentId, 'component.generic-primary')
assert.equal(
  profile.layers[0]?.rendererLayerId,
  'renderer-layer.generic-primary',
)
assert.equal(
  profile.layers[0]?.approvedWorkItemId,
  'approved-work.generic-primary',
)
assert.equal(profile.metrics.layerCount, 1)
assert.equal(
  profile.metrics.motionTrackCount,
  choreography.boundMotionTracks.length,
)
assert.equal(profile.authorityBoundary.selectedSceneAuthority, false)
assert.equal(profile.authorityBoundary.masterTimingAuthority, false)
assert.equal(profile.authorityBoundary.soundSyncAuthority, false)
assert.equal(profile.authorityBoundary.approvalAuthority, false)
assert.equal(profile.authorityBoundary.snapshotAuthority, false)
assert.equal(profile.authorityBoundary.remotionProtocolAuthority, false)
assert.equal(profile.authorityBoundary.remotionExecutionAuthority, false)
assert.equal(profile.authorityBoundary.productionAuthority, false)
assert.equal(profile.subjectSpecificRouting, false)
assert.equal(profile.remotionExecutionStillForbidden, true)

const replay = compileLivingFrameRemotionProfile({
  rendererPlanBinding: renderer,
  choreographyBinding: choreography,
  approvedLineageBinding: lineage,
})
assert.equal(replay.profileDigestSha256, profile.profileDigestSha256)

const degradedRenderer = signRenderer({
  ...withoutDigest(renderer),
  projectionState: 'blocked_on_primitive_or_depth_qa',
  bindingState: 'blocked_by_living_frame_projection_gates',
  openGateCodes: [
    ...LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES,
  ].sort(),
})
const degradedLineage = createApprovedLineageBinding(
  degradedRenderer,
  choreography,
)
const degraded = compileLivingFrameRemotionProfile({
  rendererPlanBinding: degradedRenderer,
  choreographyBinding: choreography,
  approvedLineageBinding: degradedLineage,
})
assert.equal(
  degraded.profileState,
  'blocked_by_renderer_choreography_or_lineage',
)
assert.equal(
  degraded.openGateCodes.includes('renderer_projection_blocked'),
  true,
)

assert.throws(
  () => compileLivingFrameRemotionProfile({
    rendererPlanBinding: renderer,
    choreographyBinding: signChoreography({
      ...withoutDigest(choreography),
      sceneId: 'scene.wrong',
    }),
    approvedLineageBinding: lineage,
  }),
  /invalid|stale/,
)
assert.throws(
  () => compileLivingFrameRemotionProfile({
    rendererPlanBinding: signRenderer({
      ...withoutDigest(renderer),
      sourceBindings: {
        ...renderer.sourceBindings,
        outputFrameDigestSha256: hash('output-frame-wrong'),
      },
    }),
    choreographyBinding: choreography,
    approvedLineageBinding: lineage,
  }),
  /invalid|stale/,
)
assert.throws(
  () => compileLivingFrameRemotionProfile({
    rendererPlanBinding: renderer,
    choreographyBinding: choreography,
    approvedLineageBinding: signLineage({
      ...withoutDigest(lineage),
      sourceBindings: {
        ...lineage.sourceBindings,
        rendererPlanBindingDigestSha256: hash('renderer-wrong'),
      },
    }),
  }),
  /invalid|stale/,
)

assert.equal(
  verifyLivingFrameRemotionProfileDigest(signProfile({
    ...withoutDigest(profile),
    authorityBoundary: {
      ...profile.authorityBoundary,
      selectedSceneAuthority: true,
      approvalAuthority: true,
      remotionExecutionAuthority: true,
      productionAuthority: true,
    },
  } as unknown as Omit<LivingFrameRemotionProfile, 'profileDigestSha256'>)),
  false,
)
assert.equal(
  verifyLivingFrameRemotionProfileDigest(signProfile({
    ...withoutDigest(profile),
    subjectSpecificRouting: true,
  } as unknown as Omit<LivingFrameRemotionProfile, 'profileDigestSha256'>)),
  false,
)
assert.equal(
  verifyLivingFrameRemotionProfileDigest(signUnknown({
    ...profile,
    musashiRoute: 'special_case',
  })),
  false,
)
assert.equal(
  verifyLivingFrameRemotionProfileDigest(signProfile({
    ...withoutDigest(profile),
    openGateCodes: [],
  })),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-remotion-profile',
  genericProfileCases: 2,
  adversarialAssertions: 8,
  deterministicReplay: true,
  subjectSpecificRouting: profile.subjectSpecificRouting,
  exampleSpecificRoutesAccepted: false,
  existingRendererPlanReused:
    profile.existingRendererCompositionPlanRemainsAuthority,
  selectedSceneAuthorityGranted:
    profile.authorityBoundary.selectedSceneAuthority,
  approvalAuthorityGranted:
    profile.authorityBoundary.approvalAuthority,
  snapshotAuthorityGranted:
    profile.authorityBoundary.snapshotAuthority,
  remotionProtocolAuthorityGranted:
    profile.authorityBoundary.remotionProtocolAuthority,
  remotionExecutionAuthorityGranted:
    profile.authorityBoundary.remotionExecutionAuthority,
  productionAuthorityGranted:
    profile.authorityBoundary.productionAuthority,
}))

function createRendererBinding(): LivingFrameRendererPlanBinding {
  const motionTrackIds = choreography.boundMotionTracks
    .map((track) => track.trackId)
    .sort()
  const gates = LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES
    .filter((gate) =>
      gate !== 'living_frame_projection_blockers_must_resolve')
    .slice()
    .sort()
  return signRenderer({
    contractVersion: LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
    bindingClass: LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
    sceneId,
    sourceBindings: {
      livingFrameProjectionDigestSha256: hash('projection'),
      deterministicMotionBundleDigestSha256:
        choreography.sourceBindings
          .deterministicMotionBundleDigestSha256,
      rendererCompositionPlanId: 'renderer-plan.generic',
      rendererCompositionPlanDigestSha256: hash('renderer-plan'),
      masterTimingPlanId:
        choreography.sourceBindings.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        choreography.sourceBindings.masterTimingPlanDigestSha256,
      outputFrameId: choreography.sourceBindings.outputFrameId,
      outputFrameDigestSha256:
        choreography.sourceBindings.outputFrameDigestSha256,
    },
    projectionState: 'candidate_pending_canonical_renderer_adapter',
    layerBindings: [{
      order: 0,
      projectedComponentId: 'component.generic-primary',
      rendererLayerId: 'renderer-layer.generic-primary',
      rendererLayerType: 'still_image',
      fitMode: 'contain',
      zIndex: 10,
      primitive: 'rgba_raster_layer',
      artifact: {
        artifactId: 'artifact.generic-primary',
        artifactDigestSha256: hash('artifact-primary'),
      },
      maskArtifact: null,
      motionTrackIds,
      motionSampleCount: motionTrackIds.length,
      zonePixels: {
        x: 120,
        y: 80,
        width: 900,
        height: 760,
      },
    }],
    cameraBindings: [],
    captionLayerIds: ['renderer-layer.caption'],
    bindingState: 'candidate_pending_canonical_snapshot_projection',
    openGateCodes: gates,
    metrics: {
      projectedLayerBindingCount: 1,
      projectedCameraBindingCount: 0,
      projectedMotionTrackCount: motionTrackIds.length,
      projectedMotionSampleCount: motionTrackIds.length,
      captionLayerCount: 1,
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
  })
}

function createApprovedLineageBinding(
  rendererBinding: LivingFrameRendererPlanBinding,
  choreographyBinding: LivingFrameChoreographyBinding,
): LivingFrameApprovedLineageBinding {
  const gates = LIVING_FRAME_APPROVED_LINEAGE_OPEN_GATES
    .filter((gate) =>
      gate !== 'approved_work_output_lineage_incomplete'
      && gate !== 'approved_asset_manifest_lineage_incomplete')
    .slice()
    .sort()
  return signLineage({
    contractVersion: LIVING_FRAME_APPROVED_LINEAGE_BINDING_VERSION,
    bindingClass: LIVING_FRAME_APPROVED_LINEAGE_BINDING_CLASS,
    sceneId,
    canonicalScope: {
      workspaceId: 'workspace.generic',
      projectId: 'project.generic',
      editSessionId: 'edit.generic',
    },
    sourceBindings: {
      approvedSnapshotId: 'snapshot.generic',
      approvedSnapshotHashSha256: hash('snapshot'),
      approvedPlanId: 'plan.generic',
      approvedPlanVersion: 1,
      approvedPlanHashSha256: hash('plan'),
      approvedWorkGraphHashSha256: hash('work-graph'),
      approvedTimingHashSha256: hash('timing'),
      approvedAssetManifestHashSha256: hash('asset-manifest'),
      canonicalRendererPlanRefSha256: hash('renderer-ref'),
      canonicalRendererPlanDigestSha256: hash('renderer-plan'),
      rendererPlanBindingDigestSha256:
        rendererBinding.bindingDigestSha256,
      choreographyBindingDigestSha256:
        choreographyBinding.bindingDigestSha256,
    },
    rendererLayerLineage: [{
      order: 0,
      sceneId,
      projectedComponentId: 'component.generic-primary',
      rendererLayerId: 'renderer-layer.generic-primary',
      approvedWorkItemId: 'approved-work.generic-primary',
      approvedWorkItemKey: 'work.generic-primary',
      outputKey: 'output.generic-primary',
      plannedAssetManifestEntryId: 'asset.generic-primary',
      required: true,
      previewPlaceholderAllowed: false,
      lineageState:
        'covered_by_exact_approved_work_output_and_planned_asset',
    }],
    bindingState:
      'blocked_by_canonical_living_frame_component_admission',
    openGateCodes: gates,
    metrics: {
      projectedLayerCount: 1,
      workOutputCoveredLayerCount: 1,
      assetManifestCoveredLayerCount: 1,
      requiredAssetCount: 1,
      placeholderAllowedAssetCount: 0,
    },
    authorityBoundary: {
      controlledLineageObservationOnly: true,
      selectedSceneAuthority: false,
      masterTimingAuthority: false,
      exactFrameAuthority: false,
      soundSyncAuthority: false,
      estimateAuthority: false,
      costAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      assetManifestMutationAuthority: false,
      qaApprovalAuthority: false,
      providerAuthority: false,
      toolRouteAuthority: false,
      workGraphMutationAuthority: false,
      queueAuthority: false,
      remotionExecutionAuthority: false,
      privateReviewAuthority: false,
      runtimePromotionAuthority: false,
      productionAuthority: false,
    },
    canonicalApprovedSnapshotWasReadByRegisteredServerPort: true,
    existingCanonicalSnapshotRemainsImmutable: true,
    existingCanonicalWorkGraphRemainsAuthority: true,
    existingCanonicalAssetManifestRemainsAuthority: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolJobQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
  })
}

function signRenderer(
  draft: LivingFrameRendererPlanBindingDraft,
): LivingFrameRendererPlanBinding {
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function signChoreography(
  draft: LivingFrameChoreographyBindingDraft,
): LivingFrameChoreographyBinding {
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function signLineage(
  draft: LivingFrameApprovedLineageBindingDraft,
): LivingFrameApprovedLineageBinding {
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function signProfile(
  draft: Omit<LivingFrameRemotionProfile, 'profileDigestSha256'>,
): LivingFrameRemotionProfile {
  return {
    ...draft,
    profileDigestSha256: sha256AuthorityValue(draft),
  }
}

function signUnknown(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const { profileDigestSha256: _ignored, ...draft } = value
  void _ignored
  return {
    ...draft,
    profileDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest<T extends {
  readonly bindingDigestSha256?: string
  readonly profileDigestSha256?: string
}>(
  value: T,
): Omit<T, 'bindingDigestSha256' | 'profileDigestSha256'> {
  const {
    bindingDigestSha256: _bindingDigest,
    profileDigestSha256: _profileDigest,
    ...draft
  } = value
  void _bindingDigest
  void _profileDigest
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
