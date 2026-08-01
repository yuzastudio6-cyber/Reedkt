import type {
  PersistedArtifactQaEvaluation,
  PersistedArtifactReconciliation,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import {
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  CanonicalLivingFrameDepthStyle,
} from '../../src/types/living-frame-canonical-motion'
import {
  verifyCanonicalLivingFrameMotionSpec,
} from './canonical-living-frame-motion'
import { ApiError } from '../errors/api-error'

const FINAL_COMPOSITION_OPERATION =
  'render_approved_source_caption_final'
const OVERLAY_POLICY =
  'approved_rgba_over_source_below_captions_v1'
interface ApprovedWorkItem {
  readonly id: string
  readonly workItemKey: string
  readonly workItemType: string
  readonly executionInput:
    Readonly<Record<string, unknown>>
  readonly expectedOutputs: readonly {
    readonly outputKey: string
    readonly artifactType: string
    readonly contentType?: string
    readonly rendererLayerIds: readonly string[]
  }[]
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds: readonly string[]
}

export interface CanonicalLivingFramePrivateReviewArtifactSelection {
  readonly artifact: PersistedArtifactResult
  readonly qa: PersistedArtifactQaEvaluation
  readonly reconciliation:
    PersistedArtifactReconciliation
}

export interface CanonicalLivingFramePrivateReviewOverlayEvidence {
  readonly order: number
  readonly sceneId: string
  readonly layerId: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly motion: {
    readonly motionSpecDigestSha256: string
    readonly depthStyle:
      CanonicalLivingFrameDepthStyle
    readonly layerTrackCount: number
    readonly cameraTrackCount: number
    readonly sourceTrackCount: number
  }
  readonly layerManifest: {
    readonly approvedWorkItemId: string
    readonly expectedAssetId: string
    readonly artifactId: string
    readonly sha256: string
    readonly qaEvaluationId: string
    readonly reconciliationId: string
  }
  readonly rgbaComponent: {
    readonly approvedWorkItemId: string
    readonly expectedAssetId: string
    readonly artifactId: string
    readonly sha256: string
    readonly qaEvaluationId: string
    readonly reconciliationId: string
  }
}

export interface CanonicalLivingFramePrivateReviewEvidence {
  readonly evidenceClass:
    'canonical_private_review_living_frame_composition_evidence_v1'
  readonly overlayPolicy:
    'approved_rgba_over_source_below_captions_v1'
  readonly overlayCount: number
  readonly overlays:
    readonly CanonicalLivingFramePrivateReviewOverlayEvidence[]
  readonly finalComposition: {
    readonly approvedWorkItemId: string
    readonly expectedAssetId: string
    readonly artifactId: string
    readonly sha256: string
    readonly runnerEvidenceHash: string
    readonly renderPreflightEvidenceHash: string
  }
  readonly allLayerManifestsQaPassed: true
  readonly allRgbaComponentsQaPassed: true
  readonly allArtifactsPrivateReconciled: true
  readonly captionPlaneRemainsAboveLivingFrame: true
  readonly allDeterministicMotionSpecsVerified: true
  readonly adaptiveDepthStyleEvidenceIncluded: true
  readonly existingPrivateReviewAuthorityRemainsSoleAuthority:
    true
  readonly customerPriceOrCreditAuthority: false
  readonly furtherRenderAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export function compileCanonicalLivingFramePrivateReviewEvidence(
  input: {
    readonly finalWorkItem: ApprovedWorkItem
    readonly requiredWorkItems:
      readonly ApprovedWorkItem[]
    readonly requiredSelections:
      readonly CanonicalLivingFramePrivateReviewArtifactSelection[]
    readonly finalSelection:
      CanonicalLivingFramePrivateReviewArtifactSelection
  },
): CanonicalLivingFramePrivateReviewEvidence | undefined {
  const payload = record(
    input.finalWorkItem.executionInput.structuredPayload,
    'final composition payload',
  )
  const hasOverlayPolicy =
    Object.hasOwn(payload, 'livingFrameOverlayPolicy')
  const hasOverlayLayers =
    Object.hasOwn(payload, 'livingFrameOverlayLayers')
  if (!hasOverlayPolicy && !hasOverlayLayers) {
    return undefined
  }
  if (
    !hasOverlayPolicy
    || !hasOverlayLayers
    || input.finalWorkItem.workItemType !==
      'render_final_export'
    || input.finalWorkItem.approvedToolIds.length !== 1
    || input.finalWorkItem.approvedToolIds[0] !==
      'remotion'
    || input.finalWorkItem.executionInput.operation !==
      FINAL_COMPOSITION_OPERATION
    || payload.livingFrameOverlayPolicy !==
      OVERLAY_POLICY
    || !Array.isArray(payload.livingFrameOverlayLayers)
    || payload.livingFrameOverlayLayers.length < 1
    || payload.livingFrameOverlayLayers.length > 128
  ) {
    throw blocked(
      'Living Frame private-review evidence requires one supported direct Remotion final-composition overlay payload.',
    )
  }

  const layers = payload.livingFrameOverlayLayers.map(
    (candidate, order) => compileOverlay({
      order,
      candidate,
      finalWorkItem: input.finalWorkItem,
      requiredWorkItems: input.requiredWorkItems,
      requiredSelections: input.requiredSelections,
    }),
  )
  assertUnique(
    layers.map((layer) => layer.layerId),
    'Living Frame private-review layer identities',
  )
  assertUnique(
    layers.map((layer) =>
      layer.layerManifest.expectedAssetId),
    'Living Frame private-review layer-manifest assets',
  )
  assertUnique(
    layers.map((layer) =>
      layer.rgbaComponent.expectedAssetId),
    'Living Frame private-review RGBA assets',
  )
  const finalOutput =
    input.finalWorkItem.expectedOutputs[0]
  const rendererLayerIds =
    finalOutput?.rendererLayerIds ?? []
  const livingFrameLayerIndexes = layers.map(
    (layer) => rendererLayerIds.indexOf(layer.layerId),
  )
  const firstCaptionIndex = rendererLayerIds.findIndex(
    (layerId) =>
      layerId.toLowerCase().includes('caption'),
  )
  if (
    input.finalWorkItem.expectedOutputs.length !== 1
    || livingFrameLayerIndexes.some(
      (index) => index < 0,
    )
    || (
      firstCaptionIndex >= 0
      && livingFrameLayerIndexes.some(
        (index) => index >= firstCaptionIndex,
      )
    )
  ) {
    throw blocked(
      'Living Frame private-review evidence requires every overlay below the approved caption plane.',
    )
  }

  const finalQaGate =
    input.finalSelection.qa.gateResults.find(
      (gate) =>
        gate.gateId === 'render_preflight_gate'
        && gate.status === 'passed',
    )
  const finalRun =
    input.finalSelection.artifact.actualRunEvidence
  assertSelection(
    input.finalSelection,
    input.finalWorkItem.id,
    'video/mp4',
  )
  if (
    !finalQaGate
    || finalRun.state !==
      'actual_run_evidence_verified_v2'
    || finalRun.runnerClass !==
      'offline_remotion_render_execution_v1'
    || finalRun.toolIds.length !== 1
    || finalRun.toolIds[0] !== 'remotion'
    || !finalRun.actualRunVerified
  ) {
    throw blocked(
      'Living Frame private-review evidence requires the exact QA-passed Remotion final artifact and render-preflight evidence.',
    )
  }

  return {
    evidenceClass:
      'canonical_private_review_living_frame_composition_evidence_v1',
    overlayPolicy: OVERLAY_POLICY,
    overlayCount: layers.length,
    overlays: layers,
    finalComposition: {
      approvedWorkItemId:
        input.finalWorkItem.id,
      expectedAssetId:
        input.finalSelection.artifact.identity
          .expectedAssetId,
      artifactId:
        input.finalSelection.artifact.artifactId,
      sha256:
        input.finalSelection.artifact.content.sha256,
      runnerEvidenceHash:
        finalRun.runnerEvidenceHash,
      renderPreflightEvidenceHash:
        finalQaGate.evidenceHash,
    },
    allLayerManifestsQaPassed: true,
    allRgbaComponentsQaPassed: true,
    allArtifactsPrivateReconciled: true,
    captionPlaneRemainsAboveLivingFrame: true,
    allDeterministicMotionSpecsVerified: true,
    adaptiveDepthStyleEvidenceIncluded: true,
    existingPrivateReviewAuthorityRemainsSoleAuthority:
      true,
    customerPriceOrCreditAuthority: false,
    furtherRenderAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
}

function compileOverlay(input: {
  readonly order: number
  readonly candidate: unknown
  readonly finalWorkItem: ApprovedWorkItem
  readonly requiredWorkItems:
    readonly ApprovedWorkItem[]
  readonly requiredSelections:
    readonly CanonicalLivingFramePrivateReviewArtifactSelection[]
}): CanonicalLivingFramePrivateReviewOverlayEvidence {
  const layer = record(
    input.candidate,
    'Living Frame overlay layer',
  )
  const sceneId = safeId(layer.sceneId)
  const layerId = safeId(layer.layerId)
  const manifestOutputKey =
    safeId(layer.manifestOutputKey)
  const componentOutputKey =
    safeId(layer.componentOutputKey)
  const startFrame = safeFrame(layer.startFrame)
  const endFrameExclusive =
    safeFrame(layer.endFrameExclusive)
  const finalMotionSpec = layer.motionSpec
  if (
    endFrameExclusive <= startFrame
    || layer.fit !== 'fill'
    || layer.opacity !== 1
    || !verifyCanonicalLivingFrameMotionSpec(
      finalMotionSpec,
    )
    || finalMotionSpec.sceneId !== sceneId
    || finalMotionSpec.sceneStartFrame !==
      startFrame
    || finalMotionSpec.sceneEndFrameExclusive !==
      endFrameExclusive
  ) {
    throw blocked(
      'Living Frame private-review overlay geometry or frame range is invalid.',
    )
  }
  const manifestWorkItem =
    findOutputWorkItem({
      workItems: input.requiredWorkItems,
      outputKey: manifestOutputKey,
      workItemType: 'prepare_remotion_layer',
      operation:
        CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
      artifactType:
        'living_frame_remotion_layer_manifest',
      contentType: 'application/json',
    })
  const componentWorkItem =
    findOutputWorkItem({
      workItems: input.requiredWorkItems,
      outputKey: componentOutputKey,
      workItemType: 'process_image_asset',
      operation:
        CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
      artifactType:
        'living_frame_component_rgba_png',
      contentType: 'image/png',
    })
  const manifestPayload = record(
    manifestWorkItem.executionInput
      .structuredPayload,
    'Living Frame layer manifest payload',
  )
  const componentDependency = record(
    manifestPayload.componentDependency,
    'Living Frame layer component dependency',
  )
  const manifestMotionSpec =
    manifestPayload.motionSpec
  if (
    !input.finalWorkItem.dependencyKeys.includes(
      manifestWorkItem.workItemKey,
    )
    || !input.finalWorkItem.dependencyKeys.includes(
      componentWorkItem.workItemKey,
    )
    || manifestWorkItem.dependencyKeys.length !== 1
    || manifestWorkItem.dependencyKeys[0] !==
      componentWorkItem.workItemKey
    || manifestPayload.sceneId !== sceneId
    || manifestPayload.layerId !== layerId
    || manifestPayload.startFrame !== startFrame
    || manifestPayload.endFrameExclusive !==
      endFrameExclusive
    || manifestPayload.compositionPolicy !==
      OVERLAY_POLICY
    || manifestPayload
      .captionPlaneRemainsAboveLivingFrame !== true
    || !verifyCanonicalLivingFrameMotionSpec(
      manifestMotionSpec,
    )
    || manifestMotionSpec.motionSpecDigestSha256 !==
      finalMotionSpec.motionSpecDigestSha256
    || componentDependency.workItemKey !==
      componentWorkItem.workItemKey
    || componentDependency.outputKey !==
      componentOutputKey
    || componentDependency.artifactType !==
      'living_frame_component_rgba_png'
    || componentDependency.contentType !==
      'image/png'
  ) {
    throw blocked(
      'Living Frame private-review overlay lost its exact final, manifest, and RGBA dependency chain.',
    )
  }
  const manifestSelection = findSelection(
    input.requiredSelections,
    manifestWorkItem.id,
  )
  const componentSelection = findSelection(
    input.requiredSelections,
    componentWorkItem.id,
  )
  assertSelection(
    manifestSelection,
    manifestWorkItem.id,
    'application/json',
  )
  assertSelection(
    componentSelection,
    componentWorkItem.id,
    'image/png',
  )
  return {
    order: input.order,
    sceneId,
    layerId,
    startFrame,
    endFrameExclusive,
    motion: {
      motionSpecDigestSha256:
        finalMotionSpec.motionSpecDigestSha256,
      depthStyle: finalMotionSpec.depthStyle,
      layerTrackCount:
        finalMotionSpec.metrics.layerTrackCount,
      cameraTrackCount:
        finalMotionSpec.metrics.cameraTrackCount,
      sourceTrackCount:
        finalMotionSpec.metrics.sourceTrackCount,
    },
    layerManifest: selectionEvidence(
      manifestSelection,
      manifestWorkItem.id,
    ),
    rgbaComponent: selectionEvidence(
      componentSelection,
      componentWorkItem.id,
    ),
  }
}

function findOutputWorkItem(input: {
  readonly workItems: readonly ApprovedWorkItem[]
  readonly outputKey: string
  readonly workItemType:
    'prepare_remotion_layer' | 'process_image_asset'
  readonly operation: string
  readonly artifactType: string
  readonly contentType: string
}): ApprovedWorkItem {
  const matches = input.workItems.filter((item) =>
    item.workItemType === input.workItemType
    && item.executionInput.operation === input.operation
    && item.expectedOutputs.length === 1
    && item.expectedOutputs[0]?.outputKey ===
      input.outputKey
    && item.expectedOutputs[0]?.artifactType ===
      input.artifactType
    && item.expectedOutputs[0]?.contentType ===
      input.contentType)
  if (matches.length !== 1) {
    throw blocked(
      'Living Frame private-review output lineage is missing or ambiguous.',
    )
  }
  return matches[0]!
}

function findSelection(
  selections:
    readonly CanonicalLivingFramePrivateReviewArtifactSelection[],
  approvedWorkItemId: string,
): CanonicalLivingFramePrivateReviewArtifactSelection {
  const matches = selections.filter(
    (selection) =>
      selection.artifact.lineage.approvedWorkItemId ===
        approvedWorkItemId,
  )
  if (matches.length !== 1) {
    throw blocked(
      'Living Frame private-review artifact selection is missing or ambiguous.',
    )
  }
  return matches[0]!
}

function assertSelection(
  selection:
    CanonicalLivingFramePrivateReviewArtifactSelection,
  approvedWorkItemId: string,
  contentType: 'application/json' | 'image/png' | 'video/mp4',
): void {
  if (
    selection.artifact.lineage.approvedWorkItemId !==
      approvedWorkItemId
    || selection.artifact.content.contentType !==
      contentType
    || selection.artifact.placeholder.isPlaceholder
    || selection.qa.outcome !== 'passed'
    || selection.qa.failureScope !== 'none'
    || selection.reconciliation.decision !==
      'test_merged_not_live_authorized'
    || !selection.reconciliation
      .privateTestDependencySatisfied
    || selection.reconciliation
      .liveRuntimeDependencySatisfied
    || selection.reconciliation.finalRenderAuthorized
  ) {
    throw blocked(
      'Living Frame private-review artifact has not passed exact private QA and reconciliation.',
    )
  }
}

function selectionEvidence(
  selection:
    CanonicalLivingFramePrivateReviewArtifactSelection,
  approvedWorkItemId: string,
) {
  return {
    approvedWorkItemId,
    expectedAssetId:
      selection.artifact.identity.expectedAssetId,
    artifactId: selection.artifact.artifactId,
    sha256: selection.artifact.content.sha256,
    qaEvaluationId: selection.qa.qaEvaluationId,
    reconciliationId:
      selection.reconciliation.reconciliationId,
  }
}

function record(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) {
    throw blocked(`${label} is not a strict object.`)
  }
  return value as Record<string, unknown>
}

function safeId(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(
      value,
    )
    || value.includes('..')
  ) {
    throw blocked(
      'Living Frame private-review identity is invalid.',
    )
  }
  return value
}

function safeFrame(value: unknown): number {
  if (
    !Number.isSafeInteger(value)
    || Number(value) < 0
  ) {
    throw blocked(
      'Living Frame private-review frame is invalid.',
    )
  }
  return Number(value)
}

function assertUnique(
  values: readonly string[],
  label: string,
): void {
  if (new Set(values).size !== values.length) {
    throw blocked(`${label} must be unique.`)
  }
}

function blocked(message: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_private_review_lineage',
    },
  )
}
