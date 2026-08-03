import { z } from 'zod'

import type { EditSkillArtifactSchemaRegistry } from '../core/edit-skill-artifact-store'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'

export const BROLL_ACCEPTED_ARTIFACT_TYPES = [
  'b_roll_assignment_v1',
  'b_roll_context_manifest_v1',
  'source_inventory_v1',
  'master_timing_plan_v1',
  'visual_ownership_manifest_v1',
  'transcript_evidence_v1',
  'visual_intelligence_report_v1',
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
  'b_roll_restraint_result_v1',
  'b_roll_provider_request_specification_v1',
  'b_roll_candidate_manifest_v1',
  'b_roll_candidate_version_v1',
  'b_roll_qa_report_v1',
  'b_roll_remotion_layer_manifest_v1',
  'b_roll_sound_handoff_v1',
  'b_roll_color_handoff_v1',
  'b_roll_transition_handoff_v1',
  'b_roll_result_receipt_v1',
  'skill_qualification_receipt_v1',
] as const

const scopedArtifactEnvelopeSchema = z.object({
  schemaVersion: z.string().trim().min(1).max(180),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  manifestRef: skillManifestReferenceSchema.optional(),
  assignmentId: z.string().trim().min(1).max(180).optional(),
  payload: z.record(z.string(), z.unknown()),
}).strict()

export const trackGraphV1Schema = z.object({
  schemaVersion: z.literal('track_graph_v1'),
  modelNeutral: z.literal(true),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  sourceSha256: skillSha256Schema,
  fps: z.number().int().min(1).max(120),
  tracks: z.array(z.object({
    trackId: z.string().trim().min(1).max(180),
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    samplesArtifactHash: skillSha256Schema,
  }).strict()).max(10_000),
}).strict()

export function registerBrollArtifactSchemas(registry: EditSkillArtifactSchemaRegistry): void {
  for (const artifactType of [...BROLL_ACCEPTED_ARTIFACT_TYPES, ...BROLL_PRODUCED_ARTIFACT_TYPES]) {
    registry.register(
      artifactType,
      artifactType === 'track_graph_v1'
        ? trackGraphV1Schema
        : scopedArtifactEnvelopeSchema.extend({ schemaVersion: z.literal(artifactType) }).strict(),
    )
  }
}
