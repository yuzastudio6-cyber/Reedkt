import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import {
  assertEditSkillSupportResultForRequest,
  createEditSkillSupportResult,
  editSkillSupportRequestSchema,
  editSkillSupportResultReferenceSchema,
  editSkillSupportResultSchema,
  type EditSkillSupportRequest,
  type EditSkillSupportResult,
} from '../core/edit-skill-support-bridge'
import { canonicalSkillJson, hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillQualificationReceiptV2Schema } from '../core/skill-qualification-receipt'
import { skillRouteQualificationReceiptSchema } from '../core/skill-route-qualification'
import type { SkillAssignment } from '../core/skill-assignment-types'
import { trackGraphV1Schema } from '../shared/track-graph/track-graph-schemas'
import { trackAllCrossSkillHandoffSchema } from './track-all-active-artifact-contracts'
import { TRACK_ALL_CAPABILITY_MANIFEST } from './track-all-capability-manifest'

export const TRACK_ALL_PUBLIC_SUPPORT_RESULT_CONTRACT = Object.freeze({
  schemaVersion: 'edit-skill-support-result-v1' as const,
  persistedArtifactType: 'edit_skill_support_result_v1' as const,
  producerSkillKey: 'track_all' as const,
  supportedArtifactTypes: Object.freeze([
    'track_graph_v1',
    'track_all_cross_skill_handoff_v1',
  ] as const),
  modelNeutral: true as const,
  privateArtifactReferencesOnly: true as const,
  publicArtifactCount: 0 as const,
  productionMutationCount: 0 as const,
})

/**
 * Produces the public Track All owner result envelope. It does not dispatch
 * Track All or any consumer skill; all artifacts and receipts must already
 * exist under exact private, content-addressed authority.
 */
export function createTrackAllOwnerSupportResult(input: {
  request: EditSkillSupportRequest
  supportRequestRef: EditSkillArtifactReference
  trackAllAssignment: SkillAssignment
  trackAllPlanHash: string
  trackAllResultReceiptHash: string
  skillQualificationReceipt: unknown
  routeQualificationReceipt: unknown
  compatibleRange: SkillAssignment['authorizedRange']
  producedArtifactRef: EditSkillArtifactReference
  producedArtifact: unknown
}): EditSkillSupportResult {
  const request = editSkillSupportRequestSchema.parse(input.request)
  const assignment = input.trackAllAssignment
  const skillReceipt = skillQualificationReceiptV2Schema.parse(
    input.skillQualificationReceipt,
  )
  const routeReceipt = skillRouteQualificationReceiptSchema.parse(
    input.routeQualificationReceipt,
  )
  const producerQualificationStatus = skillReceipt.qualificationStatus
  if (
    producerQualificationStatus !== 'planning_qualified' &&
    producerQualificationStatus !== 'internal_execution_qualified' &&
    producerQualificationStatus !== 'production_qualified'
  ) throw new Error('Track All support result cannot bind an inactive skill qualification.')
  if (
    request.producerSkillKey !== 'track_all' ||
    assignment.manifestRef.skillKey !== 'track_all' ||
    assignment.manifestRef.manifestHash !== TRACK_ALL_CAPABILITY_MANIFEST.manifestHash ||
    canonicalSkillJson(skillReceipt.manifestRef) !== canonicalSkillJson(assignment.manifestRef) ||
    canonicalSkillJson(routeReceipt.manifestRef) !== canonicalSkillJson(assignment.manifestRef) ||
    routeReceipt.routeKey !== request.requiredProducerRouteKey ||
    routeReceipt.environmentClass !== 'canonical_private' ||
    routeReceipt.qualificationCandidateOnly ||
    routeReceipt.fixtureEvidenceOnly ||
    routeReceipt.skillQualificationReceiptHash !== skillReceipt.receiptHash ||
    assignment.ownerUserId !== request.sharedAuthority.ownerUserId ||
    assignment.workspaceId !== request.sharedAuthority.workspaceId ||
    assignment.projectId !== request.sharedAuthority.projectId ||
    assignment.editSessionId !== request.sharedAuthority.editSessionId
  ) throw new Error(
    'Track All support result requires exact current canonical-private producer authority.',
  )
  assertProducedSupportArtifact({
    request,
    assignment,
    producerPlanHash: input.trackAllPlanHash,
    compatibleRange: input.compatibleRange,
    producedArtifactRef: input.producedArtifactRef,
    producedArtifact: input.producedArtifact,
  })
  return createEditSkillSupportResult({
    request,
    supportRequestRef: input.supportRequestRef,
    producer: {
      manifestRef: assignment.manifestRef,
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      planHash: input.trackAllPlanHash,
      resultReceiptHash: input.trackAllResultReceiptHash,
      qualificationStatus: producerQualificationStatus,
      qualificationReceiptHash: skillReceipt.receiptHash,
      routeQualification: routeReceipt,
    },
    compatibleRange: input.compatibleRange,
    producedArtifactRef: input.producedArtifactRef,
  })
}

/** Public consumer-side validator reusable by Caption and other peer skills. */
export function assertTrackAllOwnerSupportResult(input: {
  request: unknown
  result: unknown
  supportResultRef: EditSkillArtifactReference
  producedArtifact: unknown
}): EditSkillSupportResult {
  const request = editSkillSupportRequestSchema.parse(input.request)
  const result = editSkillSupportResultSchema.parse(input.result)
  const resultRef = editSkillSupportResultReferenceSchema.parse(input.supportResultRef)
  assertEditSkillSupportResultForRequest({ request, result, supportResultRef: resultRef })
  assertProducedSupportArtifact({
    request,
    assignment: {
      assignmentId: result.producer.assignmentId,
      assignmentHash: result.producer.assignmentHash,
      manifestRef: result.producer.manifestRef,
      ownerUserId: result.sharedAuthority.ownerUserId,
      workspaceId: result.sharedAuthority.workspaceId,
      projectId: result.sharedAuthority.projectId,
      editSessionId: result.sharedAuthority.editSessionId,
    },
    producerPlanHash: result.producer.planHash,
    compatibleRange: result.compatibleRange,
    producedArtifactRef: result.producedArtifactRef,
    producedArtifact: input.producedArtifact,
  })
  return result
}

function assertProducedSupportArtifact(input: {
  request: EditSkillSupportRequest
  assignment: Pick<SkillAssignment,
    'assignmentId' | 'assignmentHash' | 'manifestRef' | 'ownerUserId' |
    'workspaceId' | 'projectId' | 'editSessionId'>
  producerPlanHash: string
  compatibleRange: SkillAssignment['authorizedRange']
  producedArtifactRef: EditSkillArtifactReference
  producedArtifact: unknown
}): void {
  const commonMismatch =
    input.producedArtifactRef.artifactType !== input.request.consumer.requestedArtifactType ||
    input.producedArtifactRef.sha256 !== hashSkillValue(input.producedArtifact) ||
    input.producedArtifactRef.ownerUserId !== input.request.sharedAuthority.ownerUserId ||
    input.producedArtifactRef.workspaceId !== input.request.sharedAuthority.workspaceId ||
    input.producedArtifactRef.projectId !== input.request.sharedAuthority.projectId
  if (commonMismatch) throw new Error(
    'Track All support output is cross-tenant, forged, or differs from the requested type.',
  )
  if (input.producedArtifactRef.artifactType === 'track_graph_v1') {
    const graph = trackGraphV1Schema.parse(input.producedArtifact)
    if (
      graph.assignmentId !== input.assignment.assignmentId ||
      graph.assignmentHash !== input.assignment.assignmentHash ||
      graph.sourceSha256 !== input.request.sharedAuthority.sourceSha256 ||
      canonicalSkillJson(graph.authorizedRange) !== canonicalSkillJson(input.compatibleRange)
    ) throw new Error('Track All graph support output lost producer, source, or range lineage.')
    return
  }
  if (input.producedArtifactRef.artifactType === 'track_all_cross_skill_handoff_v1') {
    const handoff = trackAllCrossSkillHandoffSchema.parse(input.producedArtifact)
    if (
      handoff.consumerSkillKey !== input.request.consumer.skillKey ||
      handoff.assignmentId !== input.assignment.assignmentId ||
      handoff.assignmentHash !== input.assignment.assignmentHash ||
      handoff.planHash !== input.producerPlanHash ||
      canonicalSkillJson(handoff.manifestRef) !== canonicalSkillJson(input.assignment.manifestRef) ||
      handoff.sourceSha256 !== input.request.sharedAuthority.sourceSha256 ||
      canonicalSkillJson(handoff.authorizedRange) !== canonicalSkillJson(input.compatibleRange)
    ) throw new Error('Track All peer handoff lost producer, consumer, source, or range lineage.')
    return
  }
  throw new Error('Track All does not own the requested public support artifact type.')
}
