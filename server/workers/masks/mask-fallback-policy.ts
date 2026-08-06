import type { MaskFallbackDecision, MaskTaskPlan } from './mask-execution-types'

export function buildMaskFallbackDecisions(input: {
  taskPlan: MaskTaskPlan
  maskConfidence?: number
  temporalStabilityScore?: number
}): MaskFallbackDecision[] {
  const decisions: MaskFallbackDecision[] = []
  const confidence = input.maskConfidence ?? 0.72
  const temporal = input.temporalStabilityScore ?? 0.68

  if (confidence < 0.78 && input.taskPlan.primaryTool === 'birefnet') {
    decisions.push({
      trigger: 'birefnet_weak_mask',
      action: 'switch_tool',
      toolIds: ['sam3_1', 'opencv', 'kornia'],
      reason: 'Weak foreground extraction should try tracking/refinement before any depth effect.',
    })
  }

  if (confidence < 0.78 && input.taskPlan.primaryTool === 'sam3_1') {
    decisions.push({
      trigger: 'sam3_1_subject_confidence_low',
      action: 'request_review',
      reason: 'Low subject confidence must not silently switch to a lower-quality segmentation model.',
      blocksPreview: true,
    })
  }

  if (input.taskPlan.temporalSmoothingPlan.required && temporal < 0.75) {
    decisions.push({
      trigger: 'sam3_1_tracking_drift',
      action: 'use_shorter_segment',
      toolIds: ['sam3_1'],
      reason: 'Tracking drift should shorten the segment or use keyframe-only cutout.',
    })
    decisions.push({
      trigger: 'sam3_1_tracking_drift',
      action: 'keyframe_only_cutout',
      reason: 'Use keyframe-only cutout when temporal propagation is not stable.',
    })
  }

  if (input.taskPlan.maskIntent === 'text_behind_subject' && confidence < 0.82) {
    decisions.push({
      trigger: 'text_behind_subject_mask_weak',
      action: 'normal_foreground_text',
      reason: 'Weak masks should downgrade text-behind-subject to normal foreground text.',
      blocksPreview: true,
    })
    decisions.push({
      trigger: 'text_behind_subject_mask_weak',
      action: 'side_panel',
      reason: 'Side panel is a safer fallback when subject edge confidence is low.',
      blocksPreview: true,
    })
    decisions.push({
      trigger: 'text_behind_subject_mask_weak',
      action: 'lower_third',
      reason: 'Lower-third text avoids unstable foreground edge compositing.',
      blocksPreview: true,
    })
  }

  if (decisions.length === 0) {
    decisions.push({
      trigger: 'mask_plan_ready_for_qa',
      action: 'request_review',
      reason: 'Mask plan still requires QA before preview or future render.',
    })
  }

  return decisions
}
