import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import type { EditSkillDependencyRequest } from '../core/edit-skill-dependency-request'
import type { EditSkillPublicPlan } from '../core/edit-skill-plugin'
import {
  createEditSkillSupportRequest,
  editSkillSupportRequestSchema,
  type EditSkillSupportRequest,
} from '../core/edit-skill-support-bridge'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillAssignment } from '../core/skill-assignment-types'
import {
  sourceMediaArtifactV1Schema,
  type SourceMediaArtifactV1,
} from './b-roll-active-artifact-contracts'

export const BROLL_TRACK_ALL_SUPPORT_REQUEST_CONTRACT = Object.freeze({
  schemaVersion: 'edit-skill-support-request-v1' as const,
  persistedArtifactType: 'edit_skill_support_request_v1' as const,
  producerSkillKey: 'track_all' as const,
  requestedArtifactType: 'track_graph_v1' as const,
  producerRouteKey: 'public_plugin_lifecycle_route' as const,
  minimumProducerRouteQualification: 'internal_execution_qualified' as const,
  modelNeutral: true as const,
  executionAuthorityGranted: false as const,
  providerInvocationAuthorityGranted: false as const,
  timelineMutationAuthorityGranted: false as const,
  scopeExpansionAuthorityGranted: false as const,
})

/**
 * Public, type-only adapter from a B-Roll dependency request to the generic
 * owner-support request accepted by Track All. It carries no dispatch or
 * execution authority.
 */
export function createBrollTrackAllSupportRequest(input: {
  assignment: SkillAssignment
  plan: EditSkillPublicPlan
  dependencyRequest: EditSkillDependencyRequest
  sourceMediaRef: EditSkillArtifactReference
  sourceMedia: SourceMediaArtifactV1
}): EditSkillSupportRequest {
  const source = sourceMediaArtifactV1Schema.parse(input.sourceMedia)
  const request = input.dependencyRequest
  if (
    input.assignment.manifestRef.skillKey !== 'b_roll' ||
    request.dependencySkillKey !== 'track_all' ||
    request.requiredArtifactType !== 'track_graph_v1' ||
    request.assignmentId !== input.assignment.assignmentId ||
    request.assignmentHash !== input.assignment.assignmentHash ||
    request.planHash !== input.plan.envelope.planHash ||
    request.requestHash !== input.plan.dependencyRequests.find((candidate) =>
      candidate.requestHash === request.requestHash)?.requestHash ||
    input.sourceMediaRef.artifactType !== 'source_media_artifact_v1' ||
    input.sourceMediaRef.sha256 !== hashSkillValue(source) ||
    source.ownerUserId !== input.assignment.ownerUserId ||
    source.workspaceId !== input.assignment.workspaceId ||
    source.projectId !== input.assignment.projectId ||
    input.sourceMediaRef.ownerUserId !== source.ownerUserId ||
    input.sourceMediaRef.workspaceId !== source.workspaceId ||
    input.sourceMediaRef.projectId !== source.projectId
  ) throw new Error(
    'B-roll cannot create Track All support authority from stale, cross-tenant, or non-source lineage.',
  )
  return editSkillSupportRequestSchema.parse(createEditSkillSupportRequest({
    schemaVersion: 'edit-skill-support-request-v1',
    requestId: `b-roll-track-all-${request.requestHash.slice(0, 24)}`,
    consumer: {
      skillKey: 'b_roll',
      manifestRef: input.assignment.manifestRef,
      assignmentId: input.assignment.assignmentId,
      assignmentHash: input.assignment.assignmentHash,
      dependencyRequestHash: request.requestHash,
      requestedRange: request.authorizedRange,
      requestedArtifactType: 'track_graph_v1',
      requiredForPhase: request.requiredForPhase,
    },
    sharedAuthority: {
      ownerUserId: input.assignment.ownerUserId,
      workspaceId: input.assignment.workspaceId,
      projectId: input.assignment.projectId,
      editSessionId: input.assignment.editSessionId,
      sourceSha256: source.objectSha256,
      sourceArtifactRef: input.sourceMediaRef,
    },
    producerSkillKey: 'track_all',
    requiredProducerRouteKey: 'public_plugin_lifecycle_route',
    minimumProducerRouteQualification: 'internal_execution_qualified',
    supportRequestOnly: true,
    executionAuthorityGranted: false,
    providerInvocationAuthorityGranted: false,
    timelineMutationAuthorityGranted: false,
    scopeExpansionAuthorityGranted: false,
  }))
}
