import assert from 'node:assert/strict'

import {
  compileCanonicalLivingFramePrivateReviewEvidence,
  type CanonicalLivingFramePrivateReviewArtifactSelection,
} from '../living-frame/canonical-living-frame-private-review-evidence'
import {
  canonicalPrivateReviewAssemblyResponseSchema,
} from '../validation/canonical-private-review-assembly-schemas'
import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from '../living-frame/canonical-living-frame-motion'

const sha = (character: string) =>
  character.repeat(64)
const motionSpec = createMotionSpec()

const componentWorkItem = workItem({
  id: 'work-component',
  workItemKey: 'lf-001-process-image-asset',
  workItemType: 'process_image_asset',
  operation:
    'prepare_approved_living_frame_rgba_component',
  outputKey: 'component-output',
  artifactType:
    'living_frame_component_rgba_png',
  contentType: 'image/png',
  dependencyKeys: [
    'lf-001-generate-mask-asset',
    'lf-001-generate-image-asset',
  ],
})

const manifestWorkItem = workItem({
  id: 'work-manifest',
  workItemKey: 'lf-001-prepare-remotion-layer',
  workItemType: 'prepare_remotion_layer',
  operation:
    'compile_approved_living_frame_remotion_layer_manifest',
  outputKey: 'manifest-output',
  artifactType:
    'living_frame_remotion_layer_manifest',
  contentType: 'application/json',
  dependencyKeys: [componentWorkItem.workItemKey],
  structuredPayload: {
    sceneId: 'scene-001',
    layerId: 'living-frame-layer-001',
    startFrame: 30,
    endFrameExclusive: 120,
    compositionPolicy:
      'approved_rgba_over_source_below_captions_v1',
    captionPlaneRemainsAboveLivingFrame: true,
    motionSpec,
    componentDependency: {
      workItemKey: componentWorkItem.workItemKey,
      outputKey: 'component-output',
      artifactType:
        'living_frame_component_rgba_png',
      contentType: 'image/png',
    },
  },
})

const finalWorkItem = workItem({
  id: 'work-final',
  workItemKey: 'final-export',
  workItemType: 'render_final_export',
  operation:
    'render_approved_source_caption_final',
  outputKey: 'final-output',
  artifactType:
    'private_source_caption_4k_delivery_master_v1',
  contentType: 'video/mp4',
  dependencyKeys: [
    componentWorkItem.workItemKey,
    manifestWorkItem.workItemKey,
  ],
  approvedToolIds: ['remotion'],
  rendererLayerIds: [
    'source-layer',
    'living-frame-layer-001',
    'caption-layer',
  ],
  structuredPayload: {
    livingFrameOverlayPolicy:
      'approved_rgba_over_source_below_captions_v1',
    livingFrameOverlayLayers: [{
      sceneId: 'scene-001',
      layerId: 'living-frame-layer-001',
      manifestOutputKey: 'manifest-output',
      componentOutputKey: 'component-output',
      startFrame: 30,
      endFrameExclusive: 120,
      fit: 'fill',
      opacity: 1,
      motionSpec,
    }],
  },
})

const componentSelection = selection({
  approvedWorkItemId: componentWorkItem.id,
  expectedAssetId: 'asset-component',
  artifactId: 'artifact-component',
  contentType: 'image/png',
  contentSha256: sha('a'),
  qaEvaluationId: 'qa-component',
  reconciliationId: 'reconciliation-component',
})
const manifestSelection = selection({
  approvedWorkItemId: manifestWorkItem.id,
  expectedAssetId: 'asset-manifest',
  artifactId: 'artifact-manifest',
  contentType: 'application/json',
  contentSha256: sha('b'),
  qaEvaluationId: 'qa-manifest',
  reconciliationId: 'reconciliation-manifest',
})
const finalSelection = selection({
  approvedWorkItemId: finalWorkItem.id,
  expectedAssetId: 'asset-final',
  artifactId: 'artifact-final',
  contentType: 'video/mp4',
  contentSha256: sha('c'),
  qaEvaluationId: 'qa-final',
  reconciliationId: 'reconciliation-final',
  finalRemotion: true,
})

const evidence =
  compileCanonicalLivingFramePrivateReviewEvidence({
    finalWorkItem,
    requiredWorkItems: [
      componentWorkItem,
      manifestWorkItem,
      finalWorkItem,
    ],
    requiredSelections: [
      componentSelection,
      manifestSelection,
      finalSelection,
    ],
    finalSelection,
  })
assert.ok(evidence)
assert.equal(evidence.overlayCount, 1)
assert.equal(
  evidence.overlays[0]?.layerManifest.sha256,
  sha('b'),
)
assert.equal(
  evidence.overlays[0]?.rgbaComponent.sha256,
  sha('a'),
)
assert.equal(
  evidence.finalComposition.runnerEvidenceHash,
  sha('d'),
)
assert.equal(
  evidence.finalComposition
    .renderPreflightEvidenceHash,
  sha('e'),
)
assert.equal(
  evidence.captionPlaneRemainsAboveLivingFrame,
  true,
)
assert.equal(
  evidence.allDeterministicMotionSpecsVerified,
  true,
)
assert.equal(
  evidence.overlays[0]!.motion
    .motionSpecDigestSha256,
  motionSpec.motionSpecDigestSha256,
)
assert.equal(
  evidence.customerPriceOrCreditAuthority,
  false,
)
assert.equal(evidence.furtherRenderAuthority, false)
assert.equal(evidence.publicDeliveryAuthority, false)
assert.equal(evidence.productionAuthority, false)

const privateReviewResponse = {
  schemaVersion:
    'canonical-private-review-assembly-response-v1',
  source:
    'canonical_private_review_assembly_service',
  purpose: 'assemble_canonical_private_review',
  identity: {
    workspaceId: 'workspace-001',
    projectId: 'project-001',
    editSessionId: 'edit-session-001',
    packageRecordId: 'package-record-001',
    approvedPlanSnapshotId: 'snapshot-001',
    reviewAssemblyId: 'review-assembly-001',
  },
  status: 'ready_for_private_internal_review',
  requiredExecution: {
    requiredJobCount: 3,
    requiredExpectedAssetCount: 3,
    passedQaArtifactCount: 3,
    reconciledArtifactCount: 3,
    allRequiredJobsCompleted: true,
    allRequiredAssetsQaPassed: true,
    allRequiredAssetsReconciled: true,
  },
  finalArtifact: {
    jobId: 'job-final',
    approvedWorkItemId: 'work-final',
    expectedAssetId: 'asset-final',
    artifactId: 'artifact-final',
    artifactVersion: 1,
    qaEvaluationId: 'qa-final',
    reconciliationId: 'reconciliation-final',
    contentType: 'video/mp4',
    sha256: sha('c'),
    byteLength: 1024,
    privateObjectIdentityHash: sha('f'),
    privateDownloadAvailable: true,
    publicUrlCreated: false,
    signedUrlCreated: false,
  },
  finalQaArtifact: {
    jobId: 'job-final-qa',
    approvedWorkItemId: 'work-final-qa',
    expectedAssetId: 'asset-final-qa',
    artifactId: 'artifact-final-qa',
    artifactVersion: 1,
    qaEvaluationId: 'qa-final-qa',
    reconciliationId: 'reconciliation-final-qa',
    contentType: 'application/json',
    sha256: sha('1'),
    byteLength: 512,
    privateObjectIdentityHash: sha('2'),
    canonicalToolId: 'ffprobe',
    finalQaGatesPassed: true,
    finalQaReportSha256: sha('3'),
  },
  livingFrameCompositionEvidence: evidence,
  chain: {
    finalQaLeaseId: 'lease-final-qa',
    finalQaExecutionAttemptId: 'attempt-final-qa',
    finalQaDependencyAuthorityHash: sha('4'),
    finalQaInputBoundToFinalArtifact: true,
    immutablePackageRevalidated: true,
    immutablePlanRevalidated: true,
    artifactStoreChecksumVerified: true,
    leaseStoreChecksumVerified: true,
  },
  manifest: {
    schemaVersion:
      'canonical-private-review-manifest-v1',
    manifestId: 'review-manifest-001',
    manifestSha256: sha('5'),
    privateCreateOnlyPersistence: true,
    credentialFree: true,
  },
  replay: {
    idempotentReplay: false,
    sameManifestOnly: true,
  },
  readiness: {
    privateReviewReady: true,
    publicExportReady: false,
    productReady: false,
    externalBetaReady: false,
    productionReady: false,
    nextRequiredGate:
      'canonical_private_review_user_decision_or_revision',
  },
  permissions: {
    providerCall: false,
    publicArtifact: false,
    publicDelivery: false,
    productionRender: false,
    furtherRender: false,
    customerPriceMutation: false,
    customerCreditMutation: false,
    walletMutation: false,
    settlement: false,
    billing: false,
    deployment: false,
  },
  assembledAt: '2026-07-29T12:00:00.000Z',
  responseHash: sha('6'),
  testOnly: true,
}
assert.equal(
  canonicalPrivateReviewAssemblyResponseSchema.safeParse(
    privateReviewResponse,
  ).success,
  true,
)
assert.equal(
  canonicalPrivateReviewAssemblyResponseSchema.safeParse({
    ...structuredClone(privateReviewResponse),
    livingFrameCompositionEvidence: {
      ...structuredClone(evidence),
      finalComposition: {
        ...structuredClone(evidence.finalComposition),
        artifactId: 'forged-final-artifact',
      },
    },
  }).success,
  false,
)

const ordinaryFinal = structuredClone(finalWorkItem)
delete (
  ordinaryFinal.executionInput.structuredPayload as
    Record<string, unknown>
).livingFrameOverlayPolicy
delete (
  ordinaryFinal.executionInput.structuredPayload as
    Record<string, unknown>
).livingFrameOverlayLayers
assert.equal(
  compileCanonicalLivingFramePrivateReviewEvidence({
    finalWorkItem: ordinaryFinal,
    requiredWorkItems: [ordinaryFinal],
    requiredSelections: [finalSelection],
    finalSelection,
  }),
  undefined,
)

assert.throws(
  () =>
    compileCanonicalLivingFramePrivateReviewEvidence({
      finalWorkItem: {
        ...structuredClone(finalWorkItem),
        expectedOutputs: [{
          ...structuredClone(
            finalWorkItem.expectedOutputs[0]!,
          ),
          rendererLayerIds: [
            'source-layer',
            'caption-layer',
            'living-frame-layer-001',
          ],
        }],
      },
      requiredWorkItems: [
        componentWorkItem,
        manifestWorkItem,
        finalWorkItem,
      ],
      requiredSelections: [
        componentSelection,
        manifestSelection,
        finalSelection,
      ],
      finalSelection,
    }),
  /caption plane/,
)

const failedComponentSelection = {
  ...structuredClone(componentSelection),
  qa: {
    ...structuredClone(componentSelection.qa),
    outcome: 'failed',
    failureScope: 'local_asset',
  },
} as unknown as
  CanonicalLivingFramePrivateReviewArtifactSelection
assert.throws(
  () =>
    compileCanonicalLivingFramePrivateReviewEvidence({
      finalWorkItem,
      requiredWorkItems: [
        componentWorkItem,
        manifestWorkItem,
        finalWorkItem,
      ],
      requiredSelections: [
        failedComponentSelection,
        manifestSelection,
        finalSelection,
      ],
      finalSelection,
    }),
  /private QA and reconciliation/,
)

const forgedDependencyFinal = {
  ...structuredClone(finalWorkItem),
  dependencyKeys: [manifestWorkItem.workItemKey],
}
assert.throws(
  () =>
    compileCanonicalLivingFramePrivateReviewEvidence({
      finalWorkItem: forgedDependencyFinal,
      requiredWorkItems: [
        componentWorkItem,
        manifestWorkItem,
        forgedDependencyFinal,
      ],
      requiredSelections: [
        componentSelection,
        manifestSelection,
        finalSelection,
      ],
      finalSelection,
    }),
  /dependency chain/,
)

console.log(
  'Living Frame canonical private-review evidence passed exact manifest/RGBA/final Remotion lineage, QA/reconciliation, caption-plane, non-use, and forged-promotion checks.',
)

function createMotionSpec():
CanonicalLivingFrameMotionSpec {
  const duration = 90
  const opacityKeyframes = [{
    frameOffset: 0,
    value: 0,
    easingToNext: 'ease_in_out_cubic',
  }, {
    frameOffset: duration - 1,
    value: 1,
    easingToNext: 'hold',
  }] as const
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v1',
      motionProfileId:
        'approved_scalar_keyframe_choreography_v1',
      sceneId: 'scene-001',
      componentId: 'component-subject-neutral',
      sceneStartFrame: 30,
      sceneEndFrameExclusive: 120,
      visualVerb: 'reveal',
      importance: 'important',
      depthStyle: 'flat',
      depthBand: 'subject_plane',
      parallaxFactor: 0,
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          sha('d'),
        timingBindingDigestSha256:
          sha('e'),
        deterministicMotionBundleDigestSha256:
          sha('f'),
      },
      attentionEventIds: [],
      semanticScaleRequestIds: [],
      tracks: [{
        trackId:
          'lf.track.subject-neutral-opacity',
        order: 0,
        target: 'layer',
        property: 'opacity',
        role: 'primary',
        keyframes: opacityKeyframes,
        compiledSampleCount: duration,
        compiledSampleDigestSha256:
          deriveCanonicalLivingFrameCompiledSampleDigestSha256({
            keyframes: opacityKeyframes,
            sceneFrameCount: duration,
          }),
      }],
      metrics: {
        layerTrackCount: 1,
        cameraTrackCount: 0,
        sourceTrackCount: 0,
        keyframeCount: 2,
        compiledSampleCount: duration,
      },
      authorityBoundary: {
        serverDerivedFromSelectedSceneAndMasterTiming:
          true,
        exactFrameAuthority: false,
        masterTimingMutationAuthority: false,
        soundSyncAuthority: false,
        approvalAuthority: false,
        workGraphAuthority: false,
        rendererCodeAuthority: false,
        providerAuthority: false,
        queueAuthority: false,
        productionAuthority: false,
      },
      exactFramesRemainOwnedByMasterTiming: true,
      captionsRemainAboveLivingFrame: true,
      containsExecutableCodeCommandsPathsUrlsOrCredentials:
        false,
      subjectSpecificRouting: false,
    }
  return {
    ...draft,
    motionSpecDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function workItem(input: {
  readonly id: string
  readonly workItemKey: string
  readonly workItemType:
    | 'process_image_asset'
    | 'prepare_remotion_layer'
    | 'render_final_export'
  readonly operation: string
  readonly outputKey: string
  readonly artifactType: string
  readonly contentType:
    | 'image/png'
    | 'application/json'
    | 'video/mp4'
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds?: readonly string[]
  readonly rendererLayerIds?: readonly string[]
  readonly structuredPayload?: Record<string, unknown>
}) {
  return {
    id: input.id,
    workItemKey: input.workItemKey,
    workItemType: input.workItemType,
    workerClass: 'fixture-worker',
    executionInput: {
      operation: input.operation,
      approvedToolOperationIds: [],
      expectedOutputKeys: [input.outputKey],
      structuredPayload:
        input.structuredPayload ?? {},
    },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: input.outputKey,
      artifactType: input.artifactType,
      assetRole:
        input.workItemType ===
          'render_final_export'
          ? 'final' as const
          : 'processed' as const,
      required: true,
      previewPlaceholderAllowed: false,
      contentType: input.contentType,
      segmentIds: ['segment-001'],
      timingIds: ['timing-001'],
      rendererLayerIds:
        input.rendererLayerIds ?? [],
    }],
    dependencyKeys: [...input.dependencyKeys],
    approvedToolIds: [
      ...(input.approvedToolIds ?? []),
    ],
    providerExecutionMode: 'none' as const,
    fallbackPolicy: {},
    maxAttempts: 1,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 1,
    required: true,
  }
}

function selection(input: {
  readonly approvedWorkItemId: string
  readonly expectedAssetId: string
  readonly artifactId: string
  readonly contentType:
    | 'image/png'
    | 'application/json'
    | 'video/mp4'
  readonly contentSha256: string
  readonly qaEvaluationId: string
  readonly reconciliationId: string
  readonly finalRemotion?: boolean
}): CanonicalLivingFramePrivateReviewArtifactSelection {
  return {
    artifact: {
      artifactId: input.artifactId,
      identity: {
        expectedAssetId: input.expectedAssetId,
      },
      lineage: {
        approvedWorkItemId:
          input.approvedWorkItemId,
      },
      content: {
        contentType: input.contentType,
        sha256: input.contentSha256,
      },
      placeholder: {
        isPlaceholder: false,
      },
      actualRunEvidence: input.finalRemotion
        ? {
            state:
              'actual_run_evidence_verified_v2',
            runnerClass:
              'offline_remotion_render_execution_v1',
            toolIds: ['remotion'],
            actualRunVerified: true,
            runnerEvidenceHash: sha('d'),
          }
        : {
            state:
              'actual_run_evidence_placeholder',
          },
    },
    qa: {
      qaEvaluationId: input.qaEvaluationId,
      outcome: 'passed',
      failureScope: 'none',
      gateResults: input.finalRemotion
        ? [{
            gateId: 'render_preflight_gate',
            status: 'passed',
            evidenceHash: sha('e'),
          }]
        : [],
    },
    reconciliation: {
      reconciliationId: input.reconciliationId,
      decision:
        'test_merged_not_live_authorized',
      privateTestDependencySatisfied: true,
      liveRuntimeDependencySatisfied: false,
      finalRenderAuthorized: false,
    },
  } as unknown as
    CanonicalLivingFramePrivateReviewArtifactSelection
}
