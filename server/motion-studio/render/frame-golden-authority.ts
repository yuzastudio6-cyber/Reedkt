import type { OfflineRemotionMotionStudioScenePreviewPayload } from '../../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'

export const MOTION_STUDIO_REMOTION_GOLDEN_PAYLOAD = Object.freeze({
  compositionProfileId: 'motion_studio_scene_preview_v1',
  width: 640,
  height: 360,
  fps: 24,
  durationFrames: 48,
  sceneId: 'scene-ms007-golden',
  sceneStartFrame: 120,
  sceneEndFrame: 168,
  semanticPurpose: 'Reveal how the route narrows toward the operation site.',
  productionMode: 'hybrid_directed',
  layerType: 'map',
  panelBackground: '#111216',
  accentColor: '#7857FF',
} as const satisfies OfflineRemotionMotionStudioScenePreviewPayload)

export const MOTION_STUDIO_REMOTION_FRAME_GOLDENS = Object.freeze([
  { frame: 0, sha256: '4e4259806a81711eed3fd317e6bea96df997ec135207e606baf92991f53fac0e' },
  { frame: 23, sha256: '8330a22824fa9c5d912c91e91dfe99772126d40b6b86f027b8835721e8292bb0' },
  { frame: 47, sha256: '27d1bddc1e70d9ad4f9c799b2ae84c95e6eef197bdb0277d539d8eaf2c41fc5e' },
] as const)

export const MOTION_STUDIO_REMOTION_GOLDEN_RUNTIME = Object.freeze({
  packageVersion: '4.0.487',
} as const)
