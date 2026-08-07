import type {
  OfflineRemotionBrollPreviewLayerPlanningPayload,
} from '../../tool-execution/remotion-render-execution'
import type {
  BrollDisplayTreatment,
  BrollPlanArtifact,
} from './b-roll-contracts'

export function brollRemotionPreviewLayerForTreatment(
  treatment: BrollDisplayTreatment,
): OfflineRemotionBrollPreviewLayerPlanningPayload {
  const fixed = {
    full_frame_takeover: [0, 0, 100, 100, 1, 10],
    full_frame_cutaway: [0, 0, 100, 100, 1, 10],
    inset: [60, 8, 34, 34, 1, 10],
    picture_in_picture: [65, 6, 30, 30, 1, 10],
    split_screen: [50, 0, 50, 100, 1, 10],
    partial_overlay: [55, 45, 40, 45, 1, 10],
    background_layer: [0, 0, 100, 100, 0.45, 0],
  } as const
  if (treatment === 'no_display') {
    throw new Error('A no-display B-roll plan cannot enter Remotion integration.')
  }
  const geometry = fixed[treatment]
  return {
    displayTreatment: treatment,
    position: 'absolute',
    crop: 'contain',
    xPercent: geometry[0],
    yPercent: geometry[1],
    widthPercent: geometry[2],
    heightPercent: geometry[3],
    scale: 1,
    opacity: geometry[4],
    layerOrder: geometry[5],
  }
}

export function brollRemotionPreviewDimensions(
  plan: BrollPlanArtifact,
): readonly [number, number] {
  const ratio = plan.shotSpecification?.aspectRatio ??
    plan.cropSafeProviderAspectRatio
  if (ratio === '16:9') return [640, 360]
  if (ratio === '9:16') return [360, 640]
  if (ratio === '1:1') return [480, 480]
  if (ratio === '4:5') return [480, 600]
  throw new Error(
    'B-roll private preview requires a Remotion-supported confirmed output frame.',
  )
}
