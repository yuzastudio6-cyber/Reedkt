import type {
  BrollDisplayTreatment,
  BrollEditorialRole,
  BrollPlanningContext,
  BrollSkillAssignment,
} from '../b-roll-contracts'
import type { BrollSourceStrategy } from './source-strategy-resolver'

export interface BrollTimingCompositionPlan {
  authorizedRange: BrollSkillAssignment['writeRangeAuthority']['authorizedRange']
  sourceTrim?: BrollSkillAssignment['writeRangeAuthority']['authorizedRange']
  displayTreatment: BrollDisplayTreatment
  cropSafeProviderAspectRatio?: '16:9' | '9:16'
  speakerVisibilityIntent: 'preserve' | 'temporarily_hidden' | 'not_applicable'
  captionSafeBehavior: string
  entryIntent: string
  exitIntent: string
  outsideAuthorizedRangeModified: false
}

function nativeRatio(confirmed: string): '16:9' | '9:16' | undefined {
  if (confirmed === '16:9' || confirmed === '9:16') return confirmed
  const [width, height] = confirmed.split(':').map(Number)
  return width >= height ? '16:9' : '9:16'
}

export function planBrollTimingAndComposition(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  role: BrollEditorialRole
  strategy: BrollSourceStrategy
}): BrollTimingCompositionPlan {
  const noDisplay = ['use_no_broll', 'blocked', 'needs_other_skill', 'needs_user_confirmation'].includes(input.strategy.decision)
  let displayTreatment: BrollDisplayTreatment = 'full_frame_cutaway'
  if (noDisplay) displayTreatment = 'no_display'
  else if (input.role === 'before_after') displayTreatment = 'split_screen'
  else if (input.assignment.requestedVisualOwnership === 'support' || input.context.primaryVisualOwner) {
    displayTreatment = input.context.captionReservedZoneCount > 0 ? 'picture_in_picture' : 'inset'
  } else if (input.role === 'establishing') displayTreatment = 'full_frame_takeover'
  const provider = ['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni', 'refine_generated_omni_candidate']
    .includes(input.strategy.decision)
  const sourceTrim = input.strategy.selected?.candidate.sourceRange
  const cropSafeProviderAspectRatio = provider ? nativeRatio(input.context.confirmedAspectRatio) : undefined
  return {
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    ...(sourceTrim ? { sourceTrim } : {}),
    displayTreatment,
    ...(cropSafeProviderAspectRatio ? { cropSafeProviderAspectRatio } : {}),
    speakerVisibilityIntent: noDisplay
      ? 'not_applicable'
      : ['inset', 'picture_in_picture', 'partial_overlay'].includes(displayTreatment) ? 'preserve' : 'temporarily_hidden',
    captionSafeBehavior: input.context.captionReservedZoneCount > 0
      ? 'Respect every caption reserved zone; report any layout change to Captions.'
      : 'Keep a conservative lower caption-safe band and preserve caption ownership.',
    entryIntent: noDisplay ? 'No B-roll entry.' : 'Enter on the exact meaning anchor without changing the boundary transition.',
    exitIntent: noDisplay ? 'No B-roll exit.' : 'Exit by endFrameExclusive and hand boundary intent to Transition.',
    outsideAuthorizedRangeModified: false,
  }
}
