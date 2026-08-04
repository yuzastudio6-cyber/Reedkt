import type { OfflineRemotionMotionStudioLayeredPlanningPayload } from '../../tool-execution/remotion-render-execution'

export const MOTION_STUDIO_LAYERED_GOLDEN_PLANNING_PAYLOAD = Object.freeze({
  width: 640,
  height: 360,
  fps: 30,
  durationFrames: 150,
  compositionProfileId: 'motion_studio_native_layered_scene_v1',
  sceneId: 'scene-ms009-layered',
  sceneStartFrame: 0,
  sceneEndFrame: 150,
  semanticPurpose: 'Trace the signal through the operations room',
  headline: 'Trace the signal through the operations room',
  caption: 'Review · Trace the signal through the operations room',
  layerManifestDigest: 'a'.repeat(64),
  depthModel: 'semantic_planes_v1',
  planes: [
    { planeId: 'background-plane', role: 'background', zIndex: 0, sourceKind: 'remotion_native', motionToken: 'ambient_drift' },
    { planeId: 'headline-plane', role: 'headline', zIndex: 10, sourceKind: 'remotion_native', motionToken: 'headline_reveal' },
    { planeId: 'subject-plane', role: 'subject', zIndex: 20, sourceKind: 'approved_cutout_slot', motionToken: 'subject_parallax' },
    { planeId: 'caption-plane', role: 'caption', zIndex: 30, sourceKind: 'remotion_native', motionToken: 'caption_hold' },
  ],
  panelBackground: '#0F172A',
  panelHighlight: '#16213E',
  headlineColor: '#E0F2FE',
  accentColor: '#FF4D8D',
  captionColor: '#F8FAFC',
  horizontalSafePercent: 8,
  verticalSafePercent: 8,
  captionBottomPercent: 9,
  captionAboveMask: true,
  contactObjectPresent: false,
  maskRisk: 'low_fixture_only',
} as const satisfies OfflineRemotionMotionStudioLayeredPlanningPayload)

export const MOTION_STUDIO_LAYERED_GOLDEN_CUTOUT = Object.freeze({
  mimeType: 'image/png',
  byteLength: 3_231,
  sha256: '668366803056dc51a75cafc5ad2be9363146fa22a1ed5cba481815944759fd45',
} as const)

export const MOTION_STUDIO_LAYERED_GOLDEN_RUNTIME = Object.freeze({
  packageVersion: '4.0.487',
} as const)

export const MOTION_STUDIO_LAYERED_FRAME_GOLDENS = Object.freeze([
  { frame: 0, sha256: '5b81b6dce1a4a65641e1c0633a2635bc56f05f814162bd35e43fd86fc96f17c5' },
  { frame: 74, sha256: '078887656d63331a6dd6ecd8bb8fc2b1515726ba9b6720c4ed2caee42b7abd70' },
  { frame: 149, sha256: '515b6ea0791206d9d62501c7e99739abbee909560650c4b5cce5b3288faca557' },
] as const)
