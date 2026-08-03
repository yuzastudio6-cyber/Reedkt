import type { SkillQaRegistry } from '../core/skill-qa-registry'

export const BROLL_PLANNING_QA_KEYS = [
  'b_roll.planning.range_authority',
  'b_roll.planning.editorial_purpose',
  'b_roll.planning.restraint_considered',
  'b_roll.planning.source_safety',
  'b_roll.planning.provenance_rights',
  'b_roll.planning.proof_safety',
  'b_roll.planning.visual_density',
  'b_roll.planning.repetition',
  'b_roll.planning.primary_visual_ownership',
  'b_roll.planning.caption_space',
  'b_roll.planning.dependency_completeness',
  'b_roll.planning.approval_credit_readiness',
  'b_roll.planning.provider_eligibility',
  'b_roll.planning.lower_cost_route',
] as const

export const BROLL_OUTPUT_QA_KEYS = [
  'b_roll.output.valid_mp4',
  'b_roll.output.decodable_streams',
  'b_roll.output.duration',
  'b_roll.output.frame_rate',
  'b_roll.output.resolution',
  'b_roll.output.not_truncated',
  'b_roll.output.not_frozen_or_black',
  'b_roll.output.semantic_alignment',
  'b_roll.output.generated_visual_integrity',
  'b_roll.output.subject_object_consistency',
  'b_roll.output.plausible_motion',
  'b_roll.output.camera_intent',
  'b_roll.output.crop_safety',
  'b_roll.output.no_proof_misrepresentation',
  'b_roll.output.content_safety',
  'b_roll.output.audio_disposition',
  'b_roll.output.private_artifact_integrity',
] as const

export const BROLL_INTEGRATION_QA_KEYS = [
  'b_roll.integration.exact_authorized_range',
  'b_roll.integration.no_outside_range_modification',
  'b_roll.integration.primary_ownership',
  'b_roll.integration.caption_collision',
  'b_roll.integration.transition_boundary',
  'b_roll.integration.color_handoff',
  'b_roll.integration.sound_handoff',
  'b_roll.integration.layer_order',
  'b_roll.integration.visual_density',
  'b_roll.integration.preview_integrity',
  'b_roll.integration.result_lineage',
] as const

export const BROLL_QA_KEYS = [
  ...BROLL_PLANNING_QA_KEYS,
  ...BROLL_OUTPUT_QA_KEYS,
  ...BROLL_INTEGRATION_QA_KEYS,
] as const

export function registerBrollQaPolicies(registry: SkillQaRegistry): void {
  for (const qaKey of BROLL_QA_KEYS) {
    registry.register(qaKey, (input) => {
      const supplied = input[qaKey]
      const passed = supplied === true || supplied === 'pass'
      return {
        qaKey,
        disposition: passed ? 'pass' : 'blocking',
        summary: passed ? `${qaKey} passed.` : `${qaKey} requires explicit passing evidence.`,
        evidenceHashes: Array.isArray(input.evidenceHashes)
          ? input.evidenceHashes.filter((value): value is string => typeof value === 'string')
          : [],
      }
    })
  }
}
