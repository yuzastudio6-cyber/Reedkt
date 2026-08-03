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
  return {
    conceptKey: input.concept.conceptKey,
    purpose: input.concept.purpose,
    singleContinuousShot: true,
    noSceneCuts: true,
    subject: input.assignment.pointToProveClarifyCoverOrSupport,
    action: input.role === 'process_step' ? 'Show one clear process action.' : 'Show one coherent supporting action.',
    environment: 'Match the approved story context without inventing exact evidence or private details.',
    cameraIntent: 'Single unbroken scene with stable, intentional camera movement.',
    visualStyle: 'Match the approved edit preference and surrounding source without copying Reference DNA.',
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
