import type { TextBehindSubjectFrameTextLayerPlan } from './text-behind-subject-frame-types'

export function buildStaticTextLayerFramePlan(): TextBehindSubjectFrameTextLayerPlan {
  return {
    textLayerId: 'phase33e-text-layer-reeditpro',
    textContent: 'REEDITPRO',
    sanitizedText: 'REEDITPRO',
    fontFamilyFallback: 'DejaVu Sans Bold',
    fontFile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    fontSize: 270,
    position: {
      x: 296,
      y: 1355,
      width: 1568,
      height: 311,
      anchor: 'center_upper_mid',
    },
    layerOrder: ['background_frame', 'text_layer', 'foreground_cutout'],
    behindSubject: true,
    estimatedSubjectOcclusionRatio: 0.42,
    fallbackPlacement: 'center_upper_mid',
    warnings: [
      'Text content is fixed to REEDITPRO for Phase 33E.',
      'Final placement is recomputed by the render worker using the approved mask bounds.',
    ],
  }
}
