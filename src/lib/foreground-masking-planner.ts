import type {
  DepthAwareOverlayPlan,
  ForegroundMaskingPlan,
  MaskingPlanItem,
  PlannerInput,
} from '../types/reeditpro'

function needsMaskBridge(item: DepthAwareOverlayPlan['items'][number]) {
  return item.maskStrategy !== 'none' ||
    item.foregroundObjects.some((object) => object.preserveInFrontOfOverlay) ||
    item.depthCompositingMode === 'graphic_behind_subject' ||
    item.depthCompositingMode === 'graphic_behind_subject_and_contact_objects'
}

function createMaskingItem(item: DepthAwareOverlayPlan['items'][number], index: number): MaskingPlanItem {
  const contactObjects = item.foregroundObjects.filter((object) => object.kind === 'contact_object')
  const fallback = item.fallbackLayoutMode ?? 'side_by_side_speaker_visual'

  return {
    id: `masking-plan-item-${index + 1}`,
    segmentId: item.segmentId,
    assetPlanItemId: item.assetPlanItemId,
    depthAwareOverlayItemId: item.id,
    maskStrategy: item.maskStrategy,
    maskRisk: item.maskRisk,
    trackingRequirement: item.trackingRequirement,
    foregroundObjects: item.foregroundObjects,
    foregroundDepthGroups: item.foregroundDepthGroups,
    preservesContactObjects: contactObjects.length > 0 && contactObjects.every((object) => object.preserveInFrontOfOverlay),
    fallbackLayoutMode: fallback,
    fallbackIfMaskFails: `Use ${fallback.replaceAll('_', ' ')} if the future mask worker cannot preserve the foreground cleanly.`,
    qaChecks: [
      ...item.qaChecks,
      'Verify captions remain above all planned mask layers.',
      contactObjects.length > 0
        ? 'Verify the contact object remains in front of the overlay with the subject.'
        : 'Verify subject preservation is enough for this depth effect.',
    ],
    workerNotes: [
      ...item.workerNotes,
      'Mock foreground masking plan only; no segmentation, tracking, OpenCV, FFmpeg, or Remotion rendering runs here.',
      'Future workers must execute an approved plan snapshot, not raw chat.',
    ],
    limitations: [
      'Structured planning only; no real pixels or masks are inspected.',
      'Mask edge quality and tracking stability require a future worker.',
    ],
  }
}

export function createForegroundMaskingPlan(params: {
  input: PlannerInput
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
}): ForegroundMaskingPlan {
  const { depthAwareOverlayPlan, input } = params
  const items = (depthAwareOverlayPlan?.items ?? []).filter(needsMaskBridge).map(createMaskingItem)

  if (!depthAwareOverlayPlan?.active || items.length === 0) {
    return {
      id: `foreground-masking-${input.editingCategory}-${input.editLevel}`,
      active: false,
      summary: 'No foreground masking bridge is needed for this mock plan.',
      items: [],
      globalRules: [
        'Do not run real segmentation, object detection, object tracking, OpenCV, FFmpeg, or Remotion rendering in this frontend mock.',
        'Captions remain top layer even when masking is inactive.',
      ],
      qaChecks: ['Confirm no hidden mask worker requirement is implied.'],
      limitations: ['Mock plan only; no real masks or pixels are processed.'],
      notes: ['Foreground masking bridge activates only when depth-aware overlay planning requires it.'],
    }
  }

  const contactCount = items.filter((item) => item.preservesContactObjects).length

  return {
    id: `foreground-masking-${input.editingCategory}-${input.editLevel}`,
    active: true,
    summary: `${items.length} mock foreground masking item${items.length === 1 ? '' : 's'} planned; ${contactCount} preserve contact objects.`,
    items,
    globalRules: [
      'Foreground masking is planning-only in this milestone.',
      'Captions and top UI remain above future foreground masks.',
      'Depth-aware composition does not enable Veo or any AI-video fallback.',
      'Medium/high/premium mask risk must keep a fallback layout.',
    ],
    qaChecks: [
      'Confirm fallback layout exists for risky masks.',
      'Confirm contact objects are preserved when requested.',
      'Confirm graphics avoid foreground and caption safe zones.',
      'Confirm future worker notes do not imply real execution in the frontend demo.',
    ],
    limitations: [
      'No real masks are generated.',
      'No segmentation, object detection, tracking, OpenCV, FFmpeg, Sharp, or Remotion rendering is executed.',
      'Validation checks structured plans, not rendered pixels.',
    ],
    notes: [
      'This bridge keeps the RP-MASK architecture visible to QA and credits without implementing real mask processing.',
    ],
  }
}
