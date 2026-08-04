import {
  MOTION_STUDIO_LAYERED_PROFILE_ID,
  MOTION_STUDIO_LAYER_MANIFEST_VERSION,
  type MotionStudioLayerManifestV1,
  type MotionStudioVersionReference,
  type SceneDocument,
} from '../../../src/types/motion-studio'
import {
  motionStudioLayerManifestV1Schema,
  validateSceneDocumentBoundary,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioTimelineProposalRow } from '../scenes/types'

export interface CompileMotionStudioLayeredAssemblyInput {
  sceneDocument: SceneDocument
  sceneDocumentVersion: MotionStudioVersionReference
  proposal: MotionStudioTimelineProposalRow
}

export interface CompiledMotionStudioLayeredAssembly {
  layerManifest: MotionStudioLayerManifestV1
  layerManifestDigest: string
  sceneStartFrame: number
  sceneEndFrame: number
  durationFrames: number
}

export function compileMotionStudioLayeredAssembly(
  input: CompileMotionStudioLayeredAssemblyInput,
): CompiledMotionStudioLayeredAssembly {
  const documentErrors = validateSceneDocumentBoundary(input.sceneDocument).errors
  if (documentErrors.length) throw blocked('SceneDocument is invalid for layered assembly.', documentErrors)
  const document = input.sceneDocument
  const proposal = input.proposal
  if (!['layered_first', 'hybrid_directed'].includes(document.productionMode)) {
    throw blocked('Layered assembly requires an approved layered or hybrid SceneDocument.')
  }
  if (
    proposal.approved_snapshot_id !== document.approvedSnapshotId ||
    proposal.source_scene_document_artifact_id !== input.sceneDocumentVersion.artifactId ||
    proposal.source_scene_document_version_id !== input.sceneDocumentVersion.versionId ||
    proposal.source_scene_document_version_number !== input.sceneDocumentVersion.versionNumber ||
    proposal.source_scene_document_digest !== input.sceneDocumentVersion.contentDigest
  ) {
    throw blocked('Layered assembly proposal does not bind the exact SceneDocument authority.')
  }
  const ranges = proposal.operations_json.map((operation) => operation.layer.timelineRange)
  if (ranges.length !== 1) throw blocked('MS-009 layered proof requires exactly one proposed source layer.')
  const layerType = proposal.operations_json[0]?.layer.metadata.layerType
  if (layerType !== 'image' && layerType !== 'mask') {
    throw blocked('MS-009 layered proof requires an approved image or mask source layer.')
  }
  const range = ranges[0]
  const startFrame = range?.startFrame
  const endFrame = range?.endFrame
  if (
    typeof startFrame !== 'number' || typeof endFrame !== 'number' ||
    !Number.isSafeInteger(startFrame) || !Number.isSafeInteger(endFrame) ||
    startFrame < 0 || endFrame <= startFrame ||
    endFrame > document.timingAuthority.durationFrames
  ) throw blocked('Layered proposal range is outside exact timing authority.')
  const semanticPurpose = document.semanticPurpose.trim()
  if (semanticPurpose.length < 1 || semanticPurpose.length > 120) {
    throw blocked('Layered scene semantic purpose must be 1–120 characters before approval.')
  }
  const caption = `Review · ${semanticPurpose}`
  if (caption.length > 160) throw blocked('Derived layered caption exceeds the registered copy limit.')

  const layerManifest: MotionStudioLayerManifestV1 = {
    schemaVersion: MOTION_STUDIO_LAYER_MANIFEST_VERSION,
    compositionProfileId: MOTION_STUDIO_LAYERED_PROFILE_ID,
    depthModel: 'semantic_planes_v1',
    sceneId: document.sceneId,
    semanticPurpose,
    headline: semanticPurpose,
    caption,
    timingAuthority: { ...document.timingAuthority },
    sceneRange: { startFrame, endFrame },
    planes: [
      { planeId: 'background-plane', role: 'background', zIndex: 0, sourceKind: 'remotion_native', motionToken: 'ambient_drift', editablePropertyKeys: ['design.background_token'] },
      { planeId: 'headline-plane', role: 'headline', zIndex: 10, sourceKind: 'remotion_native', motionToken: 'headline_reveal', editablePropertyKeys: ['scene.semantic_purpose'] },
      { planeId: 'subject-plane', role: 'subject', zIndex: 20, sourceKind: 'approved_cutout_slot', motionToken: 'subject_parallax', editablePropertyKeys: ['asset.subject_cutout'] },
      { planeId: 'caption-plane', role: 'caption', zIndex: 30, sourceKind: 'remotion_native', motionToken: 'caption_hold', editablePropertyKeys: ['scene.caption_copy'] },
    ],
    design: {
      panelBackground: '#0F172A', panelHighlight: '#16213E', headlineColor: '#E0F2FE',
      accentColor: '#FF4D8D', captionColor: '#F8FAFC',
    },
    safeZones: { horizontalPercent: 8, verticalPercent: 8, captionBottomPercent: 9 },
    maskPolicy: {
      sourceFixtureId: 'server_owned_rembg_portrait_v1', maskRisk: 'low_fixture_only',
      contactObjectPresent: false, captionAboveMask: true, callerMediaAllowed: false,
      automaticDepthModelUsed: false, productionLicenseReviewRequired: true,
    },
    fallbackPolicy: {
      automaticFallbackAllowed: false, aiVideoFallbackAllowed: false,
      approvedAlternative: 'new_approval_required_for_full_panel_native_graphics',
    },
    revisionPolicy: {
      immutableAssembly: true, newSceneDocumentVersionRequired: true, freeFormLayerJsonAllowed: false,
    },
  }
  const parsed = motionStudioLayerManifestV1Schema.safeParse(layerManifest)
  if (!parsed.success) throw blocked('Derived layered manifest failed its registered schema.', parsed.error.issues.map((issue) => issue.message))
  return {
    layerManifest: parsed.data,
    layerManifestDigest: sha256CanonicalJson(parsed.data),
    sceneStartFrame: startFrame,
    sceneEndFrame: endFrame,
    durationFrames: endFrame - startFrame,
  }
}

function blocked(message: string, errors: readonly string[] = []): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, errors.length ? { errors } : undefined)
}
