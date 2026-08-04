import type { EditSkillArtifactSchemaRegistry } from '../core/edit-skill-artifact-store'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { createSkillQaFinding } from '../core/skill-qa-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'

export const TRACK_ALL_PLANNING_QA_KEYS = [
  'track_all.qa.assignment_authority',
  'track_all.qa.range_authority',
  'track_all.qa.source_authority',
  'track_all.qa.target_specificity',
  'track_all.qa.target_ambiguity',
  'track_all.qa.target_count',
  'track_all.qa.concept_exclusion',
  'track_all.qa.privacy_classification',
  'track_all.qa.tool_eligibility',
  'track_all.qa.sam_qualification',
  'track_all.qa.shot_chunk_plan',
  'track_all.qa.initialization_frame',
  'track_all.qa.object_budget',
  'track_all.qa.multiplex_budget',
  'track_all.qa.time_estimate',
  'track_all.qa.credit_estimate',
  'track_all.qa.lower_cost_route',
  'track_all.qa.ownership_conflict',
  'track_all.qa.dependency_completeness',
  'track_all.qa.no_action_consideration',
  'track_all.qa.repair_policy',
  'track_all.qa.range_expansion',
  'track_all.qa.approval_readiness',
  'track_all.qa.privacy_fail_closed',
] as const

export const TRACK_ALL_OUTPUT_QA_KEYS = [
  'track_all.qa.target',
  'track_all.qa.temporal',
  'track_all.qa.mask',
  'track_all.qa.identity',
  'track_all.qa.camera_planar',
  'track_all.qa.privacy',
  'track_all.qa.chunk_seam',
] as const

export const TRACK_ALL_INTEGRATION_QA_KEYS = [
  'track_all.qa.exact_authorized_range',
  'track_all.qa.outside_range_unchanged',
  'track_all.qa.exact_source_timing',
  'track_all.qa.visual_ownership',
  'track_all.qa.safe_zones_layer_order',
  'track_all.qa.private_output',
  'track_all.qa.final_lineage',
] as const

export const TRACK_ALL_ALL_QA_KEYS = [
  ...TRACK_ALL_PLANNING_QA_KEYS,
  ...TRACK_ALL_OUTPUT_QA_KEYS,
  ...TRACK_ALL_INTEGRATION_QA_KEYS,
] as const

export function registerTrackAllQaPolicies(qa: SkillQaRegistry): void {
  for (const qaKey of TRACK_ALL_ALL_QA_KEYS) {
    qa.register(qaKey, (input) => createSkillQaFinding({
      qaKey,
      validatorVersion: `${qaKey}.validator.v1`,
      disposition: 'needs_review',
      summary: 'The generic registry cannot self-attest Track All QA; a dedicated typed validator must derive the finding.',
      evidenceHashes: [hashSkillValue({ qaKey, input })],
      observations: { acceptedRawBoolean: false, inputKeys: Object.keys(input).sort() },
    }))
  }
}

// Kept as an explicit dependency for qualification-source hashing. Active
// artifact schemas are registered by track-all-schemas.ts.
export function assertTrackAllQaArtifactRegistry(artifacts: EditSkillArtifactSchemaRegistry): void {
  void artifacts
}
