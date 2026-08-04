import type { BrollShotSpecification, BrollSkillAssignment } from '../b-roll-contracts'
import type { BrollTimingCompositionPlan } from './timing-composition-planner'
import type { BrollSourceStrategy } from './source-strategy-resolver'

export interface BrollOmniRequestPlan {
  operationId: 'provider.google.generate_b_roll_candidate.v1'
  mode: 'text_to_video' | 'image_to_video' | 'reference_to_video' | 'edit'
  approvedRange: BrollSkillAssignment['writeRangeAuthority']['authorizedRange']
  nativeAspectRatio: '16:9' | '9:16'
  shotSpecification: BrollShotSpecification
  sourceArtifactId?: string
  sourceArtifactIds?: readonly string[]
  maximumInitialSubmissions: 1
  maximumRefinements: 1
  automaticRetryAllowed: false
  alternateProviderFallbackAllowed: false
}

export function planBrollOmniRequest(input: {
  assignment: BrollSkillAssignment
  strategy: BrollSourceStrategy
  shotSpecification?: BrollShotSpecification
  timing: BrollTimingCompositionPlan
}): BrollOmniRequestPlan | undefined {
  if (!input.shotSpecification || !input.timing.cropSafeProviderAspectRatio) return undefined
  if (!['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni'].includes(input.strategy.decision)) return undefined
  const sourceArtifactId = input.strategy.selected?.candidate.artifactRef.sha256
  const sourceArtifactIds = input.strategy.providerReferenceImages?.map((item) =>
    item.candidate.artifactRef.sha256) ?? (sourceArtifactId ? [sourceArtifactId] : [])
  return {
    operationId: 'provider.google.generate_b_roll_candidate.v1',
    mode: input.strategy.decision === 'edit_uploaded_video_with_gemini_omni'
      ? 'edit'
      : input.strategy.selected?.candidate.sourceType === 'reference_image'
        ? input.strategy.selected.candidate.providerImageRole === 'reference'
          ? 'reference_to_video'
          : 'image_to_video'
        : 'text_to_video',
    approvedRange: input.assignment.writeRangeAuthority.authorizedRange,
    nativeAspectRatio: input.timing.cropSafeProviderAspectRatio,
    shotSpecification: input.shotSpecification,
    ...(sourceArtifactId ? { sourceArtifactId } : {}),
    ...(sourceArtifactIds.length > 0 ? { sourceArtifactIds } : {}),
    maximumInitialSubmissions: 1,
    maximumRefinements: 1,
    automaticRetryAllowed: false,
    alternateProviderFallbackAllowed: false,
  }
}
