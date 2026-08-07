import { z } from 'zod'

import type { EditSkillArtifactSchemaRegistry } from '../core/edit-skill-artifact-store'
import { skillQualificationReceiptV2Schema } from '../core/skill-qualification-receipt'
import {
  approvedUserAssetV1Schema,
  brollCandidateManifestSchema,
  brollCandidateMediaManifestSchema,
  brollExistingSourceCandidateVersionSchema,
  brollCanonicalNoActionResultReceiptSchema,
  brollColorHandoffSchema,
  brollPrivatePreviewMediaManifestSchema,
  brollRemotionPreviewProxyManifestSchema,
  brollProviderRequestSpecificationSchema,
  brollRestraintResultSchema,
  brollRuntimeQaReportSchema,
  brollSoundHandoffSchema,
  brollTransitionHandoffSchema,
  captionReservedZonesV1Schema,
  editPreferenceSnapshotV1Schema,
  priorBrollResultV1Schema,
  referenceDnaV1Schema,
  sourceMediaArtifactV1Schema,
  transcriptEvidenceV1Schema,
} from './b-roll-active-artifact-contracts'
import { brollCandidateVersionSchema } from './b-roll-candidate-qa'
import {
  brollMasterTimingPlanSchema,
  brollPublicContextManifestSchema,
  brollSourceInventorySchema,
  brollVisualOwnershipManifestSchema,
} from './b-roll-input-authorities'
import { brollPlanningQaReportSchema } from './b-roll-planning-qa'
import {
  brollPlanArtifactSchema,
  brollSkillAssignmentSchema,
} from './b-roll-schemas'
import {
  brollRemotionLayerManifestSchema,
  brollResultReceiptSchema,
} from './b-roll-remotion-integration'
import { trackGraphV1Schema } from './b-roll-track-graph-dependency'
import {
  BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE,
  brollVisualIntelligenceCandidateQaSchema,
} from './b-roll-visual-intelligence-dependency'

export { trackGraphV1Schema } from './b-roll-track-graph-dependency'

export const BROLL_ACCEPTED_ARTIFACT_TYPES = [
  'b_roll_assignment_v1',
  'b_roll_context_manifest_v1',
  'source_inventory_v1',
  'master_timing_plan_v1',
  'visual_ownership_manifest_v1',
  'transcript_evidence_v1',
  BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE,
  'edit_preference_snapshot_v1',
  'reference_dna_v1',
  'caption_reserved_zones_v1',
  'track_graph_v1',
  'prior_b_roll_result_v1',
  'approved_user_asset_v1',
  'source_media_artifact_v1',
] as const

export const BROLL_PRODUCED_ARTIFACT_TYPES = [
  'b_roll_plan_v1',
  'b_roll_planning_qa_report_v1',
  'b_roll_restraint_result_v1',
  'b_roll_provider_request_specification_v1',
  'b_roll_candidate_media_manifest_v1',
  'b_roll_candidate_manifest_v1',
  'b_roll_candidate_version_v1',
  'b_roll_qa_report_v1',
  'b_roll_remotion_layer_manifest_v1',
  'b_roll_remotion_preview_proxy_manifest_v1',
  'b_roll_private_preview_media_manifest_v1',
  'b_roll_sound_handoff_v1',
  'b_roll_color_handoff_v1',
  'b_roll_transition_handoff_v1',
  'b_roll_result_receipt_v1',
  'skill_qualification_receipt_v2',
] as const

const brollResultReceiptArtifactSchema = z.union([
  brollResultReceiptSchema,
  brollCanonicalNoActionResultReceiptSchema,
])

const ACTIVE_BROLL_ARTIFACT_SCHEMAS = new Map<string, z.ZodType>([
  ['b_roll_assignment_v1', brollSkillAssignmentSchema],
  ['b_roll_context_manifest_v1', brollPublicContextManifestSchema],
  ['source_inventory_v1', brollSourceInventorySchema],
  ['master_timing_plan_v1', brollMasterTimingPlanSchema],
  ['visual_ownership_manifest_v1', brollVisualOwnershipManifestSchema],
  ['transcript_evidence_v1', transcriptEvidenceV1Schema],
  [BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE,
    brollVisualIntelligenceCandidateQaSchema],
  ['edit_preference_snapshot_v1', editPreferenceSnapshotV1Schema],
  ['reference_dna_v1', referenceDnaV1Schema],
  ['caption_reserved_zones_v1', captionReservedZonesV1Schema],
  ['track_graph_v1', trackGraphV1Schema],
  ['prior_b_roll_result_v1', priorBrollResultV1Schema],
  ['approved_user_asset_v1', approvedUserAssetV1Schema],
  ['source_media_artifact_v1', sourceMediaArtifactV1Schema],
  ['b_roll_plan_v1', brollPlanArtifactSchema],
  ['b_roll_planning_qa_report_v1', brollPlanningQaReportSchema],
  ['b_roll_restraint_result_v1', brollRestraintResultSchema],
  ['b_roll_provider_request_specification_v1', brollProviderRequestSpecificationSchema],
  ['b_roll_candidate_media_manifest_v1', brollCandidateMediaManifestSchema],
  ['b_roll_candidate_manifest_v1', brollCandidateManifestSchema],
  ['b_roll_candidate_version_v1', z.union([
    brollCandidateVersionSchema,
    brollExistingSourceCandidateVersionSchema,
  ])],
  ['b_roll_qa_report_v1', brollRuntimeQaReportSchema],
  ['b_roll_remotion_layer_manifest_v1', brollRemotionLayerManifestSchema],
  ['b_roll_remotion_preview_proxy_manifest_v1', brollRemotionPreviewProxyManifestSchema],
  ['b_roll_private_preview_media_manifest_v1', brollPrivatePreviewMediaManifestSchema],
  ['b_roll_sound_handoff_v1', brollSoundHandoffSchema],
  ['b_roll_color_handoff_v1', brollColorHandoffSchema],
  ['b_roll_transition_handoff_v1', brollTransitionHandoffSchema],
  ['b_roll_result_receipt_v1', brollResultReceiptArtifactSchema],
  ['skill_qualification_receipt_v2', skillQualificationReceiptV2Schema],
])

export function registerBrollArtifactSchemas(
  registry: EditSkillArtifactSchemaRegistry,
): void {
  const activeTypes = [
    ...BROLL_ACCEPTED_ARTIFACT_TYPES,
    ...BROLL_PRODUCED_ARTIFACT_TYPES,
  ]
  if (
    new Set(activeTypes).size !== activeTypes.length ||
    ACTIVE_BROLL_ARTIFACT_SCHEMAS.size !== activeTypes.length
  ) throw new Error('B-roll active artifact registry does not cover each artifact exactly once.')
  for (const artifactType of activeTypes) {
    const schema = ACTIVE_BROLL_ARTIFACT_SCHEMAS.get(artifactType)
    if (!schema) throw new Error(`B-roll active artifact ${artifactType} lacks a strict schema.`)
    registry.register(artifactType, schema, { contractClass: 'strict_active' })
  }
}
