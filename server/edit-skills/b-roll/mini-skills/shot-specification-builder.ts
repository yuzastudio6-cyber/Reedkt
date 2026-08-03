import type {
  BrollEditorialRole,
  BrollPlanningContext,
  BrollShotSpecification,
  BrollSkillAssignment,
} from '../b-roll-contracts'
import type { BrollConceptDecision } from './concept-director'
import type { BrollSourceStrategy } from './source-strategy-resolver'

export function buildBrollShotSpecification(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  role: BrollEditorialRole
  concept: BrollConceptDecision
  sourceStrategy: BrollSourceStrategy
}): BrollShotSpecification | undefined {
  if (!input.concept.conceptKey || input.concept.rejectedAsRepeated) return undefined
  const generated = ['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni', 'refine_generated_omni_candidate']
    .includes(input.sourceStrategy.decision)
  const durationFrames = input.assignment.writeRangeAuthority.authorizedRange.endFrameExclusive -
    input.assignment.writeRangeAuthority.authorizedRange.startFrameInclusive
  return {
    conceptKey: input.concept.conceptKey,
    purpose: input.concept.purpose,
    singleContinuousShot: true,
    noSceneCuts: true,
    subject: input.assignment.pointToProveClarifyCoverOrSupport,
    action: input.role === 'process_step' ? 'Show one clear process action.' : 'Show one coherent supporting action.',
    environment: 'Match the approved story context without inventing exact evidence or private details.',
    framing: input.assignment.requestedVisualOwnership === 'support'
      ? 'Keep the subject legible inside the approved support-layer frame.'
      : 'Compose one clear primary subject with deliberate negative space.',
    cameraMovement: 'Use one restrained continuous camera move with no cuts or montage changes.',
    lensDepthIntent: 'Use natural perspective and moderate depth separation without synthetic lens distortion.',
    lighting: 'Use coherent motivated lighting that matches the surrounding approved story context.',
    colorMood: 'Match the approved edit mood while leaving final color ownership to the Color skill.',
    cameraIntent: 'Single unbroken scene with stable, intentional camera movement.',
    visualStyle: 'Match the approved edit preference and surrounding source without copying Reference DNA.',
    durationFrames,
    durationSeconds: durationFrames / input.assignment.writeRangeAuthority.authorizedRange.fps,
    aspectRatio: input.context.confirmedAspectRatio,
    audioIntent: 'silent_visual_candidate',
    continuityRequirements: [
      'Preserve one continuous action and stable subject identity.',
      'Match the approved entry and exit story context.',
    ],
    cropSafeSubjectArea: 'Keep the essential subject and action inside the centered 70% safe area.',
    allowedTransformationClass: input.sourceStrategy.decision === 'edit_uploaded_video_with_gemini_omni'
      ? 'approved_source_edit'
      : input.role === 'emotional_support' ? 'contextual_generation' : 'illustrative_generation',
    proofClassification: generated
      ? input.role === 'emotional_support' ? 'atmospheric' : 'illustrative'
      : 'source_verified',
    avoid: [
      'scene cuts', 'montage', 'fabricated proof', 'real metrics', 'real reviews', 'private data',
      ...input.assignment.forbiddenInterpretations,
      ...input.context.referenceDnaDoNotCopyRules,
    ],
  }
}
