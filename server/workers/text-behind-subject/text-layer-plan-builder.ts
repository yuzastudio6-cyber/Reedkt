import { isUnsafeTextContent } from './text-behind-subject-policy'
import type { TextBehindSubjectExecutionInput, TextLayerPlan } from './text-behind-subject-types'

export function buildTextLayerPlan(input: TextBehindSubjectExecutionInput): TextLayerPlan {
  if (isUnsafeTextContent(input.textContent)) {
    throw new Error('Unsafe text-behind-subject content is blocked.')
  }
  const confidence = input.maskConfidence ?? 0.72
  const fallbackPlacement: TextLayerPlan['fallbackPlacement'] = confidence < 0.82
    ? input.placementPolicy === 'side_panel' ? 'side_panel' : 'lower_third'
    : 'foreground_safe'
  return {
    textLayerId: `text-layer-${input.mediaAssetId}`,
    textContent: input.textContent,
    textStylePreset: input.textStylePreset,
    placement: input.placementPolicy,
    motionPolicy: input.motionPolicy ?? 'static',
    safeZoneRules: [
      'protect_face_and_critical_subject',
      'keep_captions_above_masks_and_graphics',
      'avoid_covering_product_or_contact_objects',
    ],
    behindSubject: true,
    fallbackPlacement,
    expectedRenderLayerMetadata: {
      layerOrder: 'between_background_and_foreground_mask',
      requiresMask: true,
      requiresFinalRender: false,
      noRevideo: true,
    },
    warnings: [
      ...(confidence < 0.82 ? ['Mask confidence is low; use fallback placement instead of behind-subject text.'] : []),
      'M15C builds metadata only and does not render text-behind-subject.',
    ],
  }
}
