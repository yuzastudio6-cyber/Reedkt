import type { TimelineLayer, TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { JSONValue } from '../../../src/types/shared'
import {
  validateApprovedSceneRecipeInstantiation,
  validateLayerPlanBoundary,
  validateMatchingOwnership,
  validateSceneDocumentBoundary,
} from '../../../src/lib/motion-studio/contracts'
import type {
  LayerPlan,
  MotionLanguageDefinition,
  MotionStudioVersionReference,
  NarrativeFunctionDefinition,
  SceneDocument,
  SceneDocumentCompilationResult,
  SceneRecipe,
  SceneRecipeInstantiation,
  TimelineProposalOperation,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { verifyStorytellingSceneContinuitySliceDigest } from '../style-system/story-continuity-grammar'

export const MOTION_STUDIO_SCENE_COMPILER_ID = 'motion-studio-scene-compiler' as const
export const MOTION_STUDIO_SCENE_COMPILER_VERSION = 'ms-006.0.0' as const

export interface MotionStudioSceneCompilationAuthority {
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedTimingAuthority: SceneDocument['timingAuthority']
  baseTimeline: TimelineManifest
  anchorFrames: Readonly<Record<string, number>>
  sourceSceneDocumentVersion: MotionStudioVersionReference
  sceneDocument: SceneDocument
  layerPlanVersion: MotionStudioVersionReference
  layerPlan: LayerPlan
  recipeInstantiations: readonly SceneRecipeInstantiation[]
  recipeVersions: readonly {
    version: MotionStudioVersionReference
    recipe: SceneRecipe
  }[]
  motionLanguages: readonly MotionLanguageDefinition[]
  narrativeFunctions: readonly NarrativeFunctionDefinition[]
}

/** Pure, deterministic compiler. It proposes changes to the existing TimelineManifest. */
export function compileMotionStudioSceneDocument(
  authority: MotionStudioSceneCompilationAuthority,
): SceneDocumentCompilationResult {
  const errors = validateCompilationAuthority(authority)
  if (errors.length) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Scene compilation authority is incomplete or stale.', 409, {
      compilationErrors: errors,
    })
  }

  const operations = authority.layerPlan.layers
    .map((layer) => compileLayer(authority, layer))
    .sort((left, right) => {
      const zOrder = Number(left.layer.metadata.zIndex) - Number(right.layer.metadata.zIndex)
      return zOrder || left.id.localeCompare(right.id)
    })

  const materializedTimelineProposal = applyTimelineProposal(authority.baseTimeline, operations)
  const inputDigest = sha256CanonicalJson({
    compilerId: MOTION_STUDIO_SCENE_COMPILER_ID,
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    approvedSnapshotId: authority.approvedSnapshotId,
    approvedSnapshotDigest: authority.approvedSnapshotDigest,
    targetTimelineManifestId: authority.baseTimeline.id,
    timingAuthority: authority.sceneDocument.timingAuthority,
    sourceSceneDocumentVersion: authority.sourceSceneDocumentVersion,
    layerPlanVersion: authority.layerPlanVersion,
    storyContinuitySliceDigest: authority.sceneDocument.storyContinuity?.sliceDigest,
    recipeInstantiations: authority.recipeInstantiations.map((item) => ({
      id: item.id,
      recipeInputDigest: item.recipeInputDigest,
      recipeVersion: item.recipeVersion,
      motionLanguage: item.motionLanguage,
      narrativeFunction: item.narrativeFunction,
      productionMode: item.productionMode,
    })),
  })
  const outputDigest = sha256CanonicalJson(materializedTimelineProposal)

  return {
    sourceSceneDocumentVersion: authority.sourceSceneDocumentVersion,
    targetTimelineManifestId: authority.baseTimeline.id,
    operations,
    materializedTimelineProposal,
    ...(authority.sceneDocument.storyContinuity
      ? { storyContinuity: structuredClone(authority.sceneDocument.storyContinuity) }
      : {}),
    compilerFingerprint: {
      compilerId: MOTION_STUDIO_SCENE_COMPILER_ID,
      compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
      inputDigest,
      outputDigest,
    },
    warnings: [],
  }
}

function validateCompilationAuthority(authority: MotionStudioSceneCompilationAuthority): string[] {
  const errors = [
    ...validateSceneDocumentBoundary(authority.sceneDocument).errors,
    ...validateLayerPlanBoundary(authority.layerPlan).errors,
    ...validateMatchingOwnership(authority.sceneDocument, authority.layerPlan).errors,
  ]
  const document = authority.sceneDocument
  const source = authority.sourceSceneDocumentVersion
  const layerVersion = authority.layerPlanVersion
  const storyContinuity = document.storyContinuity

  if (source.artifactId !== document.id) errors.push('SceneDocument identity does not match its exact artifact-version reference.')
  if (document.approvedSnapshotId !== authority.approvedSnapshotId) {
    errors.push('SceneDocument does not bind the exact approved snapshot selected for compilation.')
  }
  if (
    document.compilerFingerprint.compilerId !== MOTION_STUDIO_SCENE_COMPILER_ID ||
    document.compilerFingerprint.compilerVersion !== MOTION_STUDIO_SCENE_COMPILER_VERSION
  ) {
    errors.push('SceneDocument compiler authority does not match the active deterministic compiler.')
  }
  if (!sameTimingAuthority(document.timingAuthority, authority.approvedTimingAuthority)) {
    errors.push('SceneDocument timing authority does not match the exact approved snapshot timing authority.')
  }
  if (document.productionId !== authority.layerPlan.productionId || document.sceneId !== authority.layerPlan.sceneId) {
    errors.push('SceneDocument and LayerPlan must bind the same production and scene.')
  }
  if (
    document.layerPlanVersion.artifactId !== layerVersion.artifactId ||
    document.layerPlanVersion.versionId !== layerVersion.versionId ||
    document.layerPlanVersion.versionNumber !== layerVersion.versionNumber ||
    document.layerPlanVersion.contentDigest !== layerVersion.contentDigest
  ) errors.push('SceneDocument does not freeze the exact LayerPlan version and digest.')
  if (authority.baseTimeline.id.length === 0) errors.push('Existing target TimelineManifest identity is required.')
  if (authority.baseTimeline.approvedSnapshotId !== authority.approvedSnapshotId) {
    errors.push('Target TimelineManifest does not bind the exact approved snapshot.')
  }
  if (authority.baseTimeline.workspaceId !== document.workspaceId || authority.baseTimeline.projectId !== document.projectId) {
    errors.push('Target TimelineManifest is outside the SceneDocument workspace/project authority.')
  }
  const timing = document.timingAuthority
  const expectedDuration = authority.baseTimeline.durationSeconds * timing.frameRate
  if (Math.abs(expectedDuration - timing.durationFrames) > 0.000001) {
    errors.push('Timeline duration does not match the exact frame-based timing authority.')
  }
  const instantiationIds = new Set(document.recipeInstantiationIds)
  if (instantiationIds.size !== document.recipeInstantiationIds.length) {
    errors.push('SceneDocument recipe instantiation IDs must be unique.')
  }
  if (authority.recipeInstantiations.length !== instantiationIds.size) {
    errors.push('Every SceneDocument recipe instantiation must resolve exactly once.')
  }
  if (storyContinuity) {
    if (!verifyStorytellingSceneContinuitySliceDigest(storyContinuity)) {
      errors.push('SceneDocument Story Continuity slice digest is invalid.')
    }
    if (storyContinuity.workspaceId !== document.workspaceId ||
        storyContinuity.projectId !== document.projectId ||
        storyContinuity.editSessionId !== document.editSessionId ||
        storyContinuity.productionId !== document.productionId ||
        storyContinuity.sceneId !== document.sceneId) {
      errors.push('SceneDocument Story Continuity slice changed the exact scope or scene.')
    }
    const requiredContinuityDigests = [
      storyContinuity.sourceMotionDnaVersion.contentDigest,
      storyContinuity.sourcePreparedScriptVersion.contentDigest,
      storyContinuity.sourceGrammarDigest,
    ]
    for (const instance of authority.recipeInstantiations) {
      if (requiredContinuityDigests.some((digest) => !instance.inputArtifactDigests.includes(digest))) {
        errors.push(`Recipe instantiation ${instance.id} omits exact Story Continuity lineage.`)
      }
    }
  }

  for (const instance of authority.recipeInstantiations) {
    if (!instantiationIds.has(instance.id)) errors.push(`Unexpected recipe instantiation ${instance.id}.`)
    if (instance.sceneDocumentVersionId !== source.versionId || instance.sceneId !== document.sceneId) {
      errors.push(`Recipe instantiation ${instance.id} does not bind the exact SceneDocument version and scene.`)
    }
    const recipe = authority.recipeVersions.find((candidate) =>
      candidate.version.versionId === instance.recipeVersion.versionId &&
      candidate.version.artifactId === instance.recipeVersion.artifactId &&
      candidate.version.contentDigest === instance.recipeVersion.contentDigest,
    )
    if (!recipe) {
      errors.push(`Recipe instantiation ${instance.id} references a missing exact Scene Recipe version.`)
      continue
    }
    if (recipe.recipe.compilerVersion !== MOTION_STUDIO_SCENE_COMPILER_VERSION) {
      errors.push(`Recipe instantiation ${instance.id} targets a different compiler version.`)
    }
    errors.push(...validateApprovedSceneRecipeInstantiation(
      instance,
      recipe.recipe,
      authority.motionLanguages,
      authority.narrativeFunctions,
    ).errors.map((error) => `${instance.id}: ${error}`))
  }

  for (const anchorId of requiredAnchorIds(document, authority.layerPlan)) {
    const frame = authority.anchorFrames[anchorId]
    if (!Number.isSafeInteger(frame) || frame < 0 || frame > timing.durationFrames) {
      errors.push(`Timing anchor ${anchorId} is missing or outside the approved frame range.`)
    }
  }
  for (const range of [document.timing, ...authority.layerPlan.layers.map((layer) => layer.timing)]) {
    const start = authority.anchorFrames[range.startAnchorId]
    const end = authority.anchorFrames[range.endAnchorId]
    if (Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= end) {
      errors.push(`Timing range ${range.startAnchorId} → ${range.endAnchorId} must advance in frames.`)
    }
  }
  return [...new Set(errors)]
}

function sameTimingAuthority(
  left: SceneDocument['timingAuthority'],
  right: SceneDocument['timingAuthority'],
): boolean {
  return left.masterTimingPlanVersionId === right.masterTimingPlanVersionId &&
    left.confirmedFrameId === right.confirmedFrameId &&
    left.timingAuthorityDigest === right.timingAuthorityDigest &&
    left.frameRate === right.frameRate &&
    left.width === right.width &&
    left.height === right.height &&
    left.aspectRatio === right.aspectRatio &&
    left.durationFrames === right.durationFrames &&
    left.timebase === right.timebase
}

function requiredAnchorIds(document: SceneDocument, layerPlan: LayerPlan): string[] {
  return [...new Set([
    document.timing.startAnchorId,
    document.timing.endAnchorId,
    ...layerPlan.layers.flatMap((layer) => [layer.timing.startAnchorId, layer.timing.endAnchorId]),
    ...document.keyframes.map((keyframe) => keyframe.timingAnchorId),
  ])]
}

function compileLayer(
  authority: MotionStudioSceneCompilationAuthority,
  layer: LayerPlan['layers'][number],
): TimelineProposalOperation {
  const startFrame = authority.anchorFrames[layer.timing.startAnchorId]!
  const endFrame = authority.anchorFrames[layer.timing.endAnchorId]!
  const frameRate = authority.sceneDocument.timingAuthority.frameRate
  const targetCollection = layerCollection(layer.layerType)
  const timelineLayer: TimelineLayer = {
    id: `motion-studio:${authority.sceneDocument.sceneId}:${layer.id}`,
    layerType: layer.layerType,
    timelineRange: {
      startSeconds: startFrame / frameRate,
      endSeconds: endFrame / frameRate,
      startFrame,
      endFrame,
    },
    artifactIds: [...layer.assetIds],
    metadata: {
      source: 'motion_studio_scene_proposal',
      sceneId: authority.sceneDocument.sceneId,
      sceneDocumentVersionId: authority.sourceSceneDocumentVersion.versionId,
      sceneDocumentDigest: authority.sourceSceneDocumentVersion.contentDigest,
      layerPlanVersionId: authority.layerPlanVersion.versionId,
      layerPlanItemId: layer.id,
      layerType: layer.layerType,
      zIndex: layer.zIndex,
      semanticPurpose: authority.sceneDocument.semanticPurpose,
      productionMode: authority.sceneDocument.productionMode,
      recipeInstantiationIds: [...authority.sceneDocument.recipeInstantiationIds],
      designTokenReferences: [...authority.sceneDocument.designTokenReferences],
      keyframes: authority.sceneDocument.keyframes.map((keyframe) => ({ ...keyframe })) as unknown as JSONValue,
      ...(authority.sceneDocument.storyContinuity ? {
        storyContinuitySliceDigest: authority.sceneDocument.storyContinuity.sliceDigest,
        storyContinuityArcRole: authority.sceneDocument.storyContinuity.arc.role,
        storyContinuityMotifId: authority.sceneDocument.storyContinuity.throughLine.mode === 'recurring_motif'
          ? authority.sceneDocument.storyContinuity.throughLine.motifId
          : null,
      } : {}),
      proposalOnly: true,
    },
  }
  return {
    id: `timeline-proposal-operation:${authority.sceneDocument.sceneId}:${layer.id}`,
    kind: 'upsert_layer',
    targetCollection,
    layer: timelineLayer,
  }
}

function layerCollection(layerType: LayerPlan['layers'][number]['layerType']): TimelineProposalOperation['targetCollection'] {
  if (layerType === 'audio') return 'audioLayers'
  if (layerType === 'caption') return 'captionLayers'
  if (layerType === 'mask') return 'maskLayers'
  return 'overlayLayers'
}

export function applyTimelineProposal(
  baseTimeline: TimelineManifest,
  operations: readonly TimelineProposalOperation[],
): TimelineManifest {
  const next: TimelineManifest = {
    ...baseTimeline,
    clips: baseTimeline.clips.map((clip) => ({ ...clip })),
    audioLayers: baseTimeline.audioLayers.map(copyLayer),
    captionLayers: baseTimeline.captionLayers.map(copyLayer),
    overlayLayers: baseTimeline.overlayLayers.map(copyLayer),
    maskLayers: baseTimeline.maskLayers.map(copyLayer),
    colorOperations: baseTimeline.colorOperations.map((operation) => ({ ...operation, settings: { ...operation.settings } })),
    renderNotes: [...baseTimeline.renderNotes],
    sourceReferences: baseTimeline.sourceReferences.map((reference) => ({ ...reference })),
  }
  for (const operation of operations) {
    const collection = next[operation.targetCollection]
    const withoutPrior = collection.filter((layer) => layer.id !== operation.layer.id)
    next[operation.targetCollection] = [...withoutPrior, copyLayer(operation.layer)]
      .sort((left, right) => left.id.localeCompare(right.id))
  }
  return next
}

function copyLayer(layer: TimelineLayer): TimelineLayer {
  return {
    ...layer,
    timelineRange: { ...layer.timelineRange },
    artifactIds: [...layer.artifactIds],
    metadata: structuredClone(layer.metadata),
  }
}
