import type {
  BrollDecision,
  BrollPlanningContext,
  BrollSkillAssignment,
} from '../b-roll-contracts'
import type { RestraintDecision } from './restraint-director'
import { rankBrollSourceCandidates, type RankedBrollSourceCandidate } from './source-candidate-ranker'

export interface BrollSourceStrategy {
  decision: BrollDecision
  reason: string
  selected?: RankedBrollSourceCandidate
  dependencySkillKey?: 'track_all'
}

function permitted(assignment: BrollSkillAssignment, decision: BrollDecision): boolean {
  return assignment.permittedSourceRoutes.includes(decision)
}

export function resolveBrollSourceStrategy(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  restraint: RestraintDecision
}): BrollSourceStrategy {
  if (input.restraint.useNoBroll) return { decision: 'use_no_broll', reason: input.restraint.reason }
  if (input.context.trackingRequired && !input.context.trackGraphRef) {
    return { decision: 'needs_other_skill', dependencySkillKey: 'track_all', reason: 'A model-neutral track_graph_v1 artifact is required.' }
  }
  if (input.context.primaryVisualOwner && input.assignment.requestedVisualOwnership === 'primary') {
    return { decision: 'blocked', reason: `Primary visual ownership already belongs to ${input.context.primaryVisualOwner}.` }
  }

  const ranked = rankBrollSourceCandidates(input.context.sourceCandidates)
  const existing = ranked.find((item) => item.eligible && item.candidate.sourceType === 'existing_project_clip' && item.score >= 55)
  if (existing && permitted(input.assignment, 'use_existing_project_clip')) {
    return { decision: 'use_existing_project_clip', selected: existing, reason: 'An eligible project clip supports the point without a provider request.' }
  }
  const userAsset = ranked.find((item) => item.eligible && item.candidate.sourceType === 'approved_user_asset' && item.score >= 50)
  if (userAsset && permitted(input.assignment, 'use_uploaded_user_asset')) {
    return { decision: 'use_uploaded_user_asset', selected: userAsset, reason: 'An approved user asset provides safe, relevant context.' }
  }
  const uploadedVideo = ranked.find((item) => item.eligible && item.candidate.sourceType === 'uploaded_video_for_edit')
  if (
    uploadedVideo && input.context.uploadedVideoEditRegionEligible &&
    input.assignment.providerPermission === 'approved_within_ceiling' &&
    permitted(input.assignment, 'edit_uploaded_video_with_gemini_omni')
  ) return { decision: 'edit_uploaded_video_with_gemini_omni', selected: uploadedVideo, reason: 'The approved bounded source is eligible for Gemini Omni editing.' }

  const referenceImage = ranked.find((item) =>
    item.eligible && item.candidate.sourceType === 'reference_image')
  if (
    referenceImage && input.assignment.providerPermission === 'approved_within_ceiling' &&
    permitted(input.assignment, 'generate_with_gemini_omni')
  ) return {
    decision: 'generate_with_gemini_omni',
    selected: referenceImage,
    reason: 'The approved reference image can guide one bounded Gemini Omni image-to-video candidate.',
  }

  if (input.context.claimSensitivity === 'verified_proof_required' || input.context.generatedMediaWouldMislead) {
    return { decision: 'needs_user_confirmation', reason: 'Generated media cannot satisfy a verified-proof or claim-sensitive need.' }
  }
  if (
    input.assignment.providerPermission === 'approved_within_ceiling' &&
    permitted(input.assignment, 'generate_with_gemini_omni')
  ) return { decision: 'generate_with_gemini_omni', reason: 'No eligible source exists; an illustrative Gemini Omni candidate is approved within the ceiling.' }
  return { decision: 'use_no_broll', reason: 'No safe source or approved provider route improves the scene.' }
}
