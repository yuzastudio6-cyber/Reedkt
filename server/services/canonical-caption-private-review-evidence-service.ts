import { z } from 'zod'

import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
  type CanonicalCaptionPrivateReviewEvidenceProjection,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import type {
  CanonicalCaptionPrivateReviewDependencyBinding,
} from '../../src/types/canonical-caption-private-review-dependency-binding'
import type {
  CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
} from './canonical-caption-postrender-visual-qa-evidence-service'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION,
  parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope,
} from './canonical-caption-postrender-visual-qa-evidence-service'
import type { ServiceContext } from '../types'
import type {
  CanonicalPrivateReviewAssemblyResponse,
} from '../validation/canonical-private-review-assembly-schemas'
import type {
  CanonicalPrivateReviewDecisionResponse,
} from '../validation/canonical-private-review-decision-schemas'
import { canonicalPrivateReviewAssemblyResponseSchema } from
  '../validation/canonical-private-review-assembly-schemas'
import { canonicalPrivateReviewDecisionResponseSchema } from
  '../validation/canonical-private-review-decision-schemas'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalEditExecutionPackageService,
} from './canonical-edit-execution-package-service'
import { createCanonicalPrivateReviewAssemblyService } from
  './canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionService } from
  './canonical-private-review-decision-service'
import { createEditPlanningAuthorityService } from
  './edit-planning-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_SERVICE_VERSION =
  'canonical-caption-private-review-evidence-service-v1' as const

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const domainRef = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const evidenceRef = z.object({
  id: safeKey,
  version: z.number().int().positive(),
  contentHash: prefixedSha256,
}).strict()
const projectionSchema: z.ZodType<
  CanonicalCaptionPrivateReviewEvidenceProjection
> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION),
  projectionId: safeKey,
  projectionDigestSha256: sha256,
  canonicalScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    projectId: safeKey,
    editSessionId: safeKey,
    approvedSnapshotId: safeKey,
    approvedSnapshotHash: sha256,
    planId: safeKey,
    planVersion: z.number().int().positive(),
    packageRecordId: safeKey,
    packageHash: sha256,
  }).strict(),
  output: z.object({
    outputId: safeKey,
    confirmedOutputFrameRef: domainRef,
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    renderedArtifactRef: evidenceRef,
    deterministicQaRef: evidenceRef,
  }).strict(),
  sourceRefs: z.object({
    privateReviewDependencyBindingRef: domainRef,
    postrenderVisualQaEvidenceRef: evidenceRef,
    workRequestRef: evidenceRef,
    normalizedResultRef: evidenceRef,
  }).strict(),
  visualReview: z.object({
    decision: z.enum([
      'passed', 'repair_required', 'needs_human_review',
      'blocked_evidence_reconciliation',
    ]),
    actualModelInferenceVerified: z.literal(true),
    exactApprovedRenderBound: z.literal(true),
    canonicalEvidenceReconciled: z.boolean(),
    actualCompleteTimeVisualReviewPassed: z.boolean(),
    smallestScopeRepairRequired: z.boolean(),
    privateHumanReviewRequired: z.boolean(),
  }).strict(),
  canonicalPrivateReview: z.object({
    assemblyRef: domainRef.nullable(),
    decisionRef: domainRef.nullable(),
    decision: z.enum([
      'accept_private_internal_review', 'request_revision',
    ]).nullable(),
    finalArtifactSha256: sha256.nullable(),
    finalQaArtifactSha256: sha256.nullable(),
    exactAssemblyReread: z.boolean(),
    exactDecisionReread: z.boolean(),
    immutableApprovedSnapshotPreserved: z.boolean(),
    immutableReviewManifestPreserved: z.boolean(),
  }).strict(),
  disposition: z.enum([
    'blocked_visual_evidence_reconciliation',
    'repair_required_before_private_review',
    'waiting_for_private_review_assembly',
    'waiting_for_private_review_decision',
    'canonical_revision_requested',
    'private_review_accepted_visual_pass',
    'private_review_accepted_visual_uncertainty_unresolved',
  ]),
  privateReviewAssemblyAllowed: z.boolean(),
  privateReviewDecisionRecorded: z.boolean(),
  privateReviewAccepted: z.boolean(),
  terminalPrivateInternalQualificationEligible: z.boolean(),
  requiresNewApprovedSnapshot: z.boolean(),
  browserLocalCompletionAccepted: z.literal(false),
  captionCreatedPrivateReviewDecision: z.literal(false),
  captionExecutedRepair: z.literal(false),
  approvedSnapshotMutationGranted: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

interface ProjectionAuthority {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedSnapshotHash: string
  planId: string
  planVersion: number
  packageRecordId: string
  packageHash: string
  approvedVisualQaWorkItemId: string
  dependencyBinding: CanonicalCaptionPrivateReviewDependencyBinding
}

export function createCanonicalCaptionPrivateReviewEvidenceService(
  context: ServiceContext,
) {
  return {
    async readForPackage(input: {
      workspaceId: string
      packageRecordId: string
      outputId?: string
    }): Promise<CanonicalCaptionPrivateReviewEvidenceProjection | null> {
      const ownerUserId = getRequiredAuthUserId(context)
      const packageResult = await createCanonicalEditExecutionPackageService(
        context).getPackage(input.packageRecordId, input.workspaceId)
      const executionPackage = packageResult.approvedEditExecutionPackage
      const authority = await createEditPlanningAuthorityService(context)
        .loadApprovedExecutionAuthority(
          executionPackage.approvedPlanSnapshotId, input.workspaceId)
      const dependencyBinding =
        authority.captionPrivateReviewDependencyBinding
      if (!dependencyBinding) return null
      if (input.outputId !== undefined
        && dependencyBinding.outputId !== input.outputId) {
        throw conflict('caption_private_review_output_crossed')
      }
      const visualWorkItem = authority.workItems.find((item) =>
        item.workItemKey === dependencyBinding.requiredReviewArtifacts[2]
          .workItemKey)
      if (!visualWorkItem) {
        throw conflict('caption_private_review_visual_work_item_missing')
      }
      const repository =
        context.canonicalCaptionPostrenderVisualQaEvidenceRepository
      if (!repository
        || repository.repositoryVersion !==
          CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Canonical Caption private review is waiting for its visual-evidence repository.',
          503,
          { requiredGate: 'canonical_caption_visual_qa_evidence_repository' },
        )
      }
      const completed = await repository.readCompletedEvidence({
        ownerUserId,
        workspaceId: input.workspaceId,
        projectId: executionPackage.projectId,
        editSessionId: executionPackage.editSessionId,
        approvedSnapshotId: executionPackage.approvedPlanSnapshotId,
        outputId: dependencyBinding.outputId,
      })
      if (!completed) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Canonical Caption private review is waiting for persisted visual evidence.',
          409,
          { requiredGate: 'canonical_caption_postrender_visual_qa_evidence' },
        )
      }
      const assembly = await optionalMissing(() =>
        createCanonicalPrivateReviewAssemblyService(context).getCompleted({
          workspaceId: input.workspaceId,
          packageRecordId: input.packageRecordId,
        }))
      const decision = assembly
        ? await optionalMissing(() =>
            createCanonicalPrivateReviewDecisionService(context).getCompleted({
              workspaceId: input.workspaceId,
              reviewAssemblyId: assembly.identity.reviewAssemblyId,
            }))
        : null
      return buildCanonicalCaptionPrivateReviewEvidenceProjection({
        authority: {
          ownerUserId,
          workspaceId: authority.snapshot.workspaceId,
          projectId: authority.snapshot.projectId,
          editSessionId: authority.snapshot.editSessionId,
          approvedSnapshotId: authority.snapshot.snapshotId,
          approvedSnapshotHash: authority.snapshot.snapshotHash,
          planId: authority.snapshot.planId,
          planVersion: authority.snapshot.planVersion,
          packageRecordId: executionPackage.packageRecordId,
          packageHash: executionPackage.packageHash,
          approvedVisualQaWorkItemId: visualWorkItem.id,
          dependencyBinding,
        },
        completed,
        assembly,
        decision,
      })
    },
  }
}

export function buildCanonicalCaptionPrivateReviewEvidenceProjection(input: {
  authority: ProjectionAuthority
  completed: CanonicalCaptionPostrenderVisualQaCompletedEnvelope
  assembly: CanonicalPrivateReviewAssemblyResponse | null
  decision: CanonicalPrivateReviewDecisionResponse | null
}): CanonicalCaptionPrivateReviewEvidenceProjection {
  const authority = input.authority
  const binding = authority.dependencyBinding
  const envelope = parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(
    input.completed)
  const assembly = input.assembly === null ? null
    : canonicalPrivateReviewAssemblyResponseSchema.parse(input.assembly)
  const decision = input.decision === null ? null
    : canonicalPrivateReviewDecisionResponseSchema.parse(input.decision)
  if ((assembly && !validResponseHash(assembly, 'responseHash'))
    || (decision && !validResponseHash(decision, 'responseHash'))) {
    throw conflict('caption_private_review_canonical_response_hash_invalid')
  }
  assertExactCaptionReviewLineage({ authority, envelope, assembly, decision })
  const visualDecision = envelope.evidence.decision
  const assemblyAllowed = visualDecision === 'passed'
    || visualDecision === 'needs_human_review'
  const accepted = decision?.decision === 'accept_private_internal_review'
  const revision = decision?.decision === 'request_revision'
  const disposition = visualDecision === 'blocked_evidence_reconciliation'
    ? 'blocked_visual_evidence_reconciliation'
    : visualDecision === 'repair_required' && !revision
      ? 'repair_required_before_private_review'
      : revision
        ? 'canonical_revision_requested'
        : !assembly
          ? 'waiting_for_private_review_assembly'
          : !decision
            ? 'waiting_for_private_review_decision'
            : visualDecision === 'passed'
              ? 'private_review_accepted_visual_pass'
              : 'private_review_accepted_visual_uncertainty_unresolved'
  const withoutDigest: Omit<CanonicalCaptionPrivateReviewEvidenceProjection,
    'projectionDigestSha256'> = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
    projectionId: `caption.private-review.evidence.${
      envelope.evidence.evidenceDigestSha256.slice(7, 47)}`,
    canonicalScope: {
      ownerUserId: authority.ownerUserId,
      workspaceId: authority.workspaceId,
      projectId: authority.projectId,
      editSessionId: authority.editSessionId,
      approvedSnapshotId: authority.approvedSnapshotId,
      approvedSnapshotHash: authority.approvedSnapshotHash,
      planId: authority.planId,
      planVersion: authority.planVersion,
      packageRecordId: authority.packageRecordId,
      packageHash: authority.packageHash,
    },
    output: {
      outputId: binding.outputId,
      confirmedOutputFrameRef: structuredClone(
        binding.confirmedOutputFrameRef),
      width: envelope.normalizedResult.output.width,
      height: envelope.normalizedResult.output.height,
      fpsNumerator: envelope.normalizedResult.output.fpsNumerator,
      fpsDenominator: envelope.normalizedResult.output.fpsDenominator,
      renderedArtifactRef: structuredClone(
        envelope.workRequest.privateRenderArtifactRef),
      deterministicQaRef: structuredClone(
        envelope.workRequest.deterministicQaRef),
    },
    sourceRefs: {
      privateReviewDependencyBindingRef: {
        id: binding.bindingId,
        version: binding.schemaVersion,
        contentHash: binding.bindingDigestSha256,
      },
      postrenderVisualQaEvidenceRef: {
        id: envelope.evidence.evidenceId,
        version: 1,
        contentHash: envelope.evidence.evidenceDigestSha256,
      },
      workRequestRef: structuredClone(envelope.evidence.workRequestRef),
      normalizedResultRef: structuredClone(
        envelope.evidence.normalizedDecisionRef),
    },
    visualReview: {
      decision: visualDecision,
      actualModelInferenceVerified: true,
      exactApprovedRenderBound: true,
      canonicalEvidenceReconciled:
        envelope.evidence.canonicalEvidenceReconciled,
      actualCompleteTimeVisualReviewPassed:
        envelope.evidence.actualCompleteTimeVisualReviewPassed,
      smallestScopeRepairRequired:
        envelope.evidence.smallestScopeRepairRequired,
      privateHumanReviewRequired:
        envelope.evidence.privateHumanReviewRequired,
    },
    canonicalPrivateReview: {
      assemblyRef: assembly ? {
        id: assembly.identity.reviewAssemblyId,
        version: assembly.schemaVersion,
        contentHash: assembly.responseHash,
      } : null,
      decisionRef: decision ? {
        id: decision.identity.reviewDecisionId,
        version: decision.schemaVersion,
        contentHash: decision.responseHash,
      } : null,
      decision: decision?.decision ?? null,
      finalArtifactSha256: assembly?.finalArtifact.sha256 ?? null,
      finalQaArtifactSha256: assembly?.finalQaArtifact.sha256 ?? null,
      exactAssemblyReread: assembly !== null,
      exactDecisionReread: decision !== null,
      immutableApprovedSnapshotPreserved:
        decision?.authority.immutableApprovedSnapshotPreserved ?? false,
      immutableReviewManifestPreserved:
        decision?.authority.immutableReviewManifestPreserved ?? false,
    },
    disposition,
    privateReviewAssemblyAllowed: assemblyAllowed,
    privateReviewDecisionRecorded: decision !== null,
    privateReviewAccepted: accepted,
    terminalPrivateInternalQualificationEligible:
      accepted && visualDecision === 'passed',
    requiresNewApprovedSnapshot:
      visualDecision === 'repair_required' || revision,
    browserLocalCompletionAccepted: false,
    captionCreatedPrivateReviewDecision: false,
    captionExecutedRepair: false,
    approvedSnapshotMutationGranted: false,
    operationDispatchAuthority: false,
    providerOrModelRuntimeAuthority: false,
    assetMutationAuthority: false,
    finalQaApprovalAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return parseCanonicalCaptionPrivateReviewEvidenceProjection({
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    } as unknown as Record<string, unknown>, 'projectionDigestSha256'),
  })
}

export function parseCanonicalCaptionPrivateReviewEvidenceProjection(
  value: unknown,
): CanonicalCaptionPrivateReviewEvidenceProjection {
  assertClosedContractTree(value,
    'Canonical Caption private-review evidence projection')
  const parsed = projectionSchema.parse(value)
  if (parsed.projectionDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'projectionDigestSha256')) {
    throw conflict('caption_private_review_projection_digest_invalid')
  }
  const accepted = parsed.canonicalPrivateReview.decision ===
    'accept_private_internal_review'
  const revision = parsed.canonicalPrivateReview.decision ===
    'request_revision'
  const assemblyPresent = parsed.canonicalPrivateReview.assemblyRef !== null
  const decisionPresent = parsed.canonicalPrivateReview.decisionRef !== null
  const expectedDisposition = deriveDisposition({
    visualDecision: parsed.visualReview.decision,
    assemblyPresent,
    decision: parsed.canonicalPrivateReview.decision,
  })
  const visualPassed = parsed.visualReview.decision === 'passed'
  const visualRepair = parsed.visualReview.decision === 'repair_required'
  const visualHuman = parsed.visualReview.decision === 'needs_human_review'
  const visualBlocked = parsed.visualReview.decision ===
    'blocked_evidence_reconciliation'
  if (
    parsed.privateReviewDecisionRecorded !== decisionPresent
    || parsed.privateReviewAccepted !== accepted
    || parsed.canonicalPrivateReview.exactAssemblyReread !== assemblyPresent
    || parsed.canonicalPrivateReview.exactDecisionReread !== decisionPresent
    || decisionPresent !== (parsed.canonicalPrivateReview.decision !== null)
    || (decisionPresent && !assemblyPresent)
    || assemblyPresent !== (
      parsed.canonicalPrivateReview.finalArtifactSha256 !== null)
    || assemblyPresent !== (
      parsed.canonicalPrivateReview.finalQaArtifactSha256 !== null)
    || (assemblyPresent && !parsed.privateReviewAssemblyAllowed)
    || decisionPresent !== (
      parsed.canonicalPrivateReview.immutableApprovedSnapshotPreserved)
    || decisionPresent !== (
      parsed.canonicalPrivateReview.immutableReviewManifestPreserved)
    || parsed.terminalPrivateInternalQualificationEligible !== (
      accepted && parsed.visualReview.decision === 'passed')
    || parsed.requiresNewApprovedSnapshot !== (
      parsed.visualReview.decision === 'repair_required' || revision)
    || parsed.privateReviewAssemblyAllowed !== (
      parsed.visualReview.decision === 'passed'
      || parsed.visualReview.decision === 'needs_human_review')
    || parsed.disposition !== expectedDisposition
    || visualPassed !==
      parsed.visualReview.actualCompleteTimeVisualReviewPassed
    || visualRepair !== parsed.visualReview.smallestScopeRepairRequired
    || visualHuman !== parsed.visualReview.privateHumanReviewRequired
    || visualBlocked === parsed.visualReview.canonicalEvidenceReconciled
  ) throw conflict('caption_private_review_projection_semantics_invalid')
  return structuredClone(parsed)
}

function assertExactCaptionReviewLineage(input: {
  authority: ProjectionAuthority
  envelope: CanonicalCaptionPostrenderVisualQaCompletedEnvelope
  assembly: CanonicalPrivateReviewAssemblyResponse | null
  decision: CanonicalPrivateReviewDecisionResponse | null
}): void {
  const { authority, envelope, assembly, decision } = input
  const binding = authority.dependencyBinding
  const workRequest = envelope.workRequest
  const normalized = envelope.normalizedResult
  const scope = envelope.evidence.scope
  const exactOutput = normalized.output
  if (
    envelope.evidence.ownerUserId !== authority.ownerUserId
    || scope.workspaceId !== authority.workspaceId
    || scope.projectId !== authority.projectId
    || scope.editSessionId !== authority.editSessionId
    || scope.approvedSnapshotId !== authority.approvedSnapshotId
    || workRequest.approvedSnapshotRef.id !== authority.approvedSnapshotId
    || unprefix(workRequest.approvedSnapshotRef.contentHash)
      !== authority.approvedSnapshotHash
    || workRequest.executionPackageRef.id !== authority.packageRecordId
    || unprefix(workRequest.executionPackageRef.contentHash)
      !== authority.packageHash
    || workRequest.approvedWorkItemRef.id
      !== authority.approvedVisualQaWorkItemId
    || binding.outputId !== exactOutput.outputId
    || !sameDomainRef(binding.confirmedOutputFrameRef,
      exactOutput.confirmedOutputFrameRef)
    || binding.confirmedOutputFrameRef.id
      !== envelope.evidence.output.confirmedOutputFrameRef.id
    || binding.confirmedOutputFrameRef.contentHash
      !== unprefix(envelope.evidence.output.confirmedOutputFrameRef.contentHash)
    || envelope.evidence.actualModelInferenceVerified !== true
    || envelope.evidence.exactApprovedRenderBound !== true
  ) throw conflict('caption_private_review_exact_lineage_mismatch')
  if (assembly) {
    if (
      !['passed', 'needs_human_review'].includes(envelope.evidence.decision)
      || assembly.identity.workspaceId !== authority.workspaceId
      || assembly.identity.projectId !== authority.projectId
      || assembly.identity.editSessionId !== authority.editSessionId
      || assembly.identity.packageRecordId !== authority.packageRecordId
      || assembly.identity.approvedPlanSnapshotId
        !== authority.approvedSnapshotId
      || assembly.finalArtifact.artifactId
        !== workRequest.privateRenderArtifactRef.id
      || assembly.finalArtifact.sha256
        !== unprefix(workRequest.privateRenderArtifactRef.contentHash)
      || assembly.finalQaArtifact.artifactId !== workRequest.deterministicQaRef.id
      || assembly.finalQaArtifact.sha256
        !== unprefix(workRequest.deterministicQaRef.contentHash)
      || assembly.finalQaArtifact.finalQaGatesPassed !== true
      || assembly.readiness.privateReviewReady !== true
    ) throw conflict('caption_private_review_assembly_lineage_mismatch')
  }
  if (decision) {
    if (!assembly
      || decision.identity.workspaceId !== authority.workspaceId
      || decision.identity.projectId !== authority.projectId
      || decision.identity.editSessionId !== authority.editSessionId
      || decision.identity.packageRecordId !== authority.packageRecordId
      || decision.identity.approvedPlanSnapshotId
        !== authority.approvedSnapshotId
      || decision.identity.reviewAssemblyId
        !== assembly.identity.reviewAssemblyId
      || decision.authority.reviewManifestSha256
        !== assembly.manifest.manifestSha256
      || decision.authority.finalArtifactSha256
        !== assembly.finalArtifact.sha256
      || decision.authority.immutableApprovedSnapshotPreserved !== true
      || decision.authority.immutableReviewManifestPreserved !== true
      || (decision.decision === 'accept_private_internal_review'
        && !['passed', 'needs_human_review'].includes(
          envelope.evidence.decision))) {
      throw conflict('caption_private_review_decision_lineage_mismatch')
    }
  }
}

function deriveDisposition(input: {
  visualDecision:
    CanonicalCaptionPrivateReviewEvidenceProjection['visualReview']['decision']
  assemblyPresent: boolean
  decision: CanonicalCaptionPrivateReviewEvidenceProjection[
    'canonicalPrivateReview']['decision']
}): CanonicalCaptionPrivateReviewEvidenceProjection['disposition'] {
  if (input.visualDecision === 'blocked_evidence_reconciliation') {
    return 'blocked_visual_evidence_reconciliation'
  }
  if (input.visualDecision === 'repair_required'
    && input.decision !== 'request_revision') {
    return 'repair_required_before_private_review'
  }
  if (input.decision === 'request_revision') {
    return 'canonical_revision_requested'
  }
  if (!input.assemblyPresent) return 'waiting_for_private_review_assembly'
  if (input.decision === null) return 'waiting_for_private_review_decision'
  return input.visualDecision === 'passed'
    ? 'private_review_accepted_visual_pass'
    : 'private_review_accepted_visual_uncertainty_unresolved'
}

function sameDomainRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function unprefix(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function validResponseHash(
  value: Record<string, unknown>,
  field: string,
): boolean {
  const { [field]: received, ...withoutHash } = value
  return received === sha256AuthorityValue(withoutHash)
}

async function optionalMissing<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof ApiError
      && error.code === 'JOB_DEPENDENCY_NOT_READY'
      && error.status === 409
      && /has not completed/u.test(error.message)) return null
    throw error
  }
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Caption private-review evidence conflicts with immutable lineage.',
    409,
    { reason },
  )
}
