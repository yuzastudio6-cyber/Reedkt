import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
  type CanonicalCaptionPostrenderVisualQaEvidence,
} from '../../src/types/canonical-caption-postrender-visual-qa-evidence'
import type { CaptionRenderedVisualReviewAuthenticatedOutputScope } from
  '../../src/types/caption-direction-visual-review-authenticated-read'
import type { CanonicalPostrenderVisualQaSharedLifecycleResult } from
  '../../src/types/canonical-postrender-visual-qa-lifecycle'
import type { CanonicalPostrenderVisualQaNormalizedResult } from
  '../../src/types/canonical-postrender-visual-qa-normalized-result'
import type { CanonicalPostrenderVisualQaWorkRequest } from
  '../../src/types/canonical-postrender-visual-qa-work-request'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { ApiError } from '../errors/api-error'
import {
  parseCanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../validation/canonical-postrender-visual-qa-lifecycle-schemas'
import {
  parseCanonicalPostrenderVisualQaNormalizedResult,
} from '../validation/canonical-postrender-visual-qa-normalized-result-schemas'
import {
  parseCanonicalPostrenderVisualQaWorkRequest,
} from '../validation/canonical-postrender-visual-qa-work-request-schemas'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OUTPUT_AUTHORITY_VERSION =
  'canonical-caption-postrender-visual-qa-output-authority-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_SERVICE_V1_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-service-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_SERVICE_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-service-v2' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_V1_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-repository-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-repository-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegativeInteger = z.number().int().nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
const aspectRatio = z.enum([
  '16:9', '9:16', '1:1', '4:5', 'original', 'custom',
])
const evidenceRef = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const scope = z.object({
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  approvedSnapshotId: safeId,
}).strict()
const output = z.object({
  outputId: safeId,
  aspectRatio,
  width: positiveInteger.max(8_192),
  height: positiveInteger.max(8_192),
  fps: z.number().positive().max(240_000),
  confirmedOutputFrameRef: evidenceRef,
  confirmedByUser: z.literal(true),
  confirmationRecordId: safeId,
}).strict().superRefine((value, context) => {
  if (!dimensionsMatch(value.aspectRatio, value.width, value.height)) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical Caption visual-QA output dimensions do not match.',
    })
  }
})
const safeSummary = z.string().trim().min(1).max(1_000).superRefine(
  (value, context) => {
    if (/(?:https?:\/\/|file:|data:|blob:|javascript:|\/Users\/|\/Volumes\/|\/tmp\/|\\|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,})/iu
      .test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Caption visual-QA summary contains unsafe text.',
      })
    }
  },
)

const outputAuthorityCore = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OUTPUT_AUTHORITY_VERSION),
  authorityId: safeId,
  authorityDigestSha256: prefixedSha256,
  ownerUserId: safeId,
  scope,
  output,
  lifecycleState: z.enum([
    'not_scheduled',
    'waiting_for_render',
    'waiting_for_qualified_ai',
  ]),
  approvedSnapshotImmutable: z.literal(true),
  exactConfirmedOutputFrameReread: z.literal(true),
  browserLocalStateAccepted: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export type CanonicalCaptionPostrenderVisualQaOutputAuthority = z.infer<
  typeof outputAuthorityCore
>

const evidenceCore = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION),
  evidenceId: safeId,
  evidenceDigestSha256: prefixedSha256,
  ownerUserId: safeId,
  scope,
  output,
  workRequestRef: evidenceRef,
  lifecycleResultRef: evidenceRef,
  normalizedDecisionRef: evidenceRef,
  providerExecutionReceiptRef: evidenceRef,
  persistedEvidenceArtifactRef: evidenceRef,
  independentArtifactQaRef: evidenceRef,
  assetManifestReconciliationRef: evidenceRef,
  decision: z.enum([
    'passed',
    'repair_required',
    'needs_human_review',
    'blocked_evidence_reconciliation',
  ]),
  userFacingSummary: safeSummary,
  deterministicQaPassed: z.literal(true),
  exactApprovedRenderBound: z.literal(true),
  actualModelInferenceVerified: z.literal(true),
  deterministicAndModelEvidenceAgree: z.boolean(),
  canonicalEvidenceReconciled: z.boolean(),
  modelInspectionCoverage: z.object({
    scope: z.enum([
      'complete_segment_coverage',
      'bounded_representative_segment_coverage',
    ]),
    sampledSegmentCount: positiveInteger,
    unsampledSegmentCount: nonnegativeInteger,
    modelInspectedOnlyPlannedSamples: z.literal(true),
    unsampledSegmentsNeverImpliedInspected: z.literal(true),
  }).strict(),
  smallestScopeRepairRequired: z.boolean(),
  privateHumanReviewRequired: z.boolean(),
  actualCompleteTimeVisualReviewPassed: z.boolean(),
  rawModelTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  browserLocalStateUsed: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict().superRefine((value, context) => {
  const completeCoverage =
    value.modelInspectionCoverage.scope === 'complete_segment_coverage'
    && value.modelInspectionCoverage.unsampledSegmentCount === 0
  const passed = value.decision === 'passed'
  const repair = value.decision === 'repair_required'
  const human = value.decision === 'needs_human_review'
  const blocked = value.decision === 'blocked_evidence_reconciliation'
  if (
    value.evidenceDigestSha256 !== digestEvidence(value)
    || passed !== value.actualCompleteTimeVisualReviewPassed
    || (passed && (!completeCoverage
      || !value.deterministicAndModelEvidenceAgree
      || !value.canonicalEvidenceReconciled
      || value.smallestScopeRepairRequired
      || value.privateHumanReviewRequired))
    || repair !== value.smallestScopeRepairRequired
    || human !== value.privateHumanReviewRequired
    || blocked === value.canonicalEvidenceReconciled
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical Caption post-render visual-QA decision is inconsistent.',
    })
  }
})

export interface CanonicalCaptionPostrenderVisualQaCompletedEnvelope {
  evidence: CanonicalCaptionPostrenderVisualQaEvidence
  workRequest: CanonicalPostrenderVisualQaWorkRequest
  lifecycleResult: CanonicalPostrenderVisualQaSharedLifecycleResult
  normalizedResult: CanonicalPostrenderVisualQaNormalizedResult
}

export interface CanonicalCaptionPostrenderVisualQaEvidenceRepository {
  readonly repositoryVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION
  readOutputAuthority(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    outputId: string
  }): Promise<CanonicalCaptionPostrenderVisualQaOutputAuthority | null>
  readCompletedEvidence(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    outputId: string
  }): Promise<CanonicalCaptionPostrenderVisualQaCompletedEnvelope | null>
  persistCompletedEvidenceCreateOnly(
    input: CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
  ): Promise<{
    disposition: 'created' | 'idempotent_replay'
    evidenceRef: CanonicalCaptionPostrenderVisualQaEvidence['lifecycleResultRef']
    exactRereadVerified: true
  }>
}

export function createCanonicalCaptionPostrenderVisualQaOutputAuthority(
  input: Omit<CanonicalCaptionPostrenderVisualQaOutputAuthority,
    'schemaVersion' | 'authorityDigestSha256'>,
): CanonicalCaptionPostrenderVisualQaOutputAuthority {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OUTPUT_AUTHORITY_VERSION,
    ...input,
  }
  return parseOutputAuthority({
    ...withoutDigest,
    authorityDigestSha256: digestOutputAuthority(withoutDigest),
  })
}

export function createCanonicalCaptionPostrenderVisualQaEvidence(
  input: Omit<CanonicalCaptionPostrenderVisualQaEvidence,
    'schemaVersion' | 'evidenceDigestSha256'>,
): CanonicalCaptionPostrenderVisualQaEvidence {
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
    ...input,
  }
  return parseCanonicalCaptionPostrenderVisualQaEvidence({
    ...withoutDigest,
    evidenceDigestSha256: digestEvidence(withoutDigest),
  })
}

export function parseCanonicalCaptionPostrenderVisualQaEvidence(
  value: unknown,
): CanonicalCaptionPostrenderVisualQaEvidence {
  assertClosedContractTree(value, 'Canonical Caption post-render visual-QA evidence')
  return structuredClone(evidenceCore.parse(value)) as
    CanonicalCaptionPostrenderVisualQaEvidence
}

export function parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(
  value: unknown,
): CanonicalCaptionPostrenderVisualQaCompletedEnvelope {
  assertClosedContractTree(value,
    'Canonical Caption post-render visual-QA completed envelope')
  if (!record(value) || !exactKeys(value, [
    'evidence', 'workRequest', 'lifecycleResult', 'normalizedResult',
  ])) throw invalid('canonical_caption_visual_qa_envelope_invalid')
  const evidence = parseCanonicalCaptionPostrenderVisualQaEvidence(
    value.evidence)
  const workRequest = parseCanonicalPostrenderVisualQaWorkRequest(
    value.workRequest)
  const lifecycleResult =
    parseCanonicalPostrenderVisualQaSharedLifecycleResult(
      value.lifecycleResult)
  const normalizedResult =
    parseCanonicalPostrenderVisualQaNormalizedResult(value.normalizedResult)
  assertCompletedLineage({
    evidence, workRequest, lifecycleResult, normalizedResult,
  })
  return structuredClone({
    evidence, workRequest, lifecycleResult, normalizedResult,
  })
}

export function createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository(
  input: {
    authorities: readonly CanonicalCaptionPostrenderVisualQaOutputAuthority[]
    completed?: readonly CanonicalCaptionPostrenderVisualQaCompletedEnvelope[]
  },
): CanonicalCaptionPostrenderVisualQaEvidenceRepository {
  const authorities = new Map<string,
    CanonicalCaptionPostrenderVisualQaOutputAuthority>()
  const completed = new Map<string,
    CanonicalCaptionPostrenderVisualQaCompletedEnvelope>()
  for (const authorityValue of input.authorities) {
    const authority = parseOutputAuthority(authorityValue)
    const key = locatorKey(authority)
    if (authorities.has(key)) throw conflict('duplicate_output_authority')
    authorities.set(key, structuredClone(authority))
  }
  for (const envelopeValue of input.completed ?? []) {
    const envelope = parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(
      envelopeValue)
    const key = locatorKey(envelope.evidence)
    const authority = authorities.get(key)
    if (!authority || !authorityMatchesEvidence(authority, envelope.evidence)) {
      throw conflict('completed_evidence_without_exact_output_authority')
    }
    if (completed.has(key)) throw conflict('duplicate_completed_evidence')
    completed.set(key, structuredClone(envelope))
  }
  const repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository = {
    repositoryVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION,
    async readOutputAuthority(locator: Parameters<
      CanonicalCaptionPostrenderVisualQaEvidenceRepository[
        'readOutputAuthority']
    >[0]) {
      return cloneOrNull(authorities.get(locatorKey(locator)))
    },
    async readCompletedEvidence(locator: Parameters<
      CanonicalCaptionPostrenderVisualQaEvidenceRepository[
        'readCompletedEvidence']
    >[0]) {
      return cloneOrNull(completed.get(locatorKey(locator)))
    },
    async persistCompletedEvidenceCreateOnly(value:
      CanonicalCaptionPostrenderVisualQaCompletedEnvelope) {
      const envelope = parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(
        value)
      const key = locatorKey(envelope.evidence)
      const authority = authorities.get(key)
      if (!authority || !authorityMatchesEvidence(
        authority, envelope.evidence)) {
        throw conflict('completed_evidence_output_authority_mismatch')
      }
      const existing = completed.get(key)
      if (existing) {
        if (canonicalJson(existing) !== canonicalJson(envelope)) {
          throw conflict('completed_evidence_create_only_conflict')
        }
        return {
          disposition: 'idempotent_replay' as const,
          evidenceRef: evidenceRecordRef(existing.evidence),
          exactRereadVerified: true as const,
        }
      }
      completed.set(key, structuredClone(envelope))
      const reread = completed.get(key)!
      if (canonicalJson(reread) !== canonicalJson(envelope)) {
        throw conflict('completed_evidence_exact_reread_failed')
      }
      return {
        disposition: 'created' as const,
        evidenceRef: evidenceRecordRef(reread.evidence),
        exactRereadVerified: true as const,
      }
    },
  }
  return Object.freeze(repository)
}

export async function persistCanonicalCaptionPostrenderVisualQaEvidence(input: {
  repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository
  envelope: CanonicalCaptionPostrenderVisualQaCompletedEnvelope
}): Promise<{
  disposition: 'created' | 'idempotent_replay'
  evidenceRef: CanonicalPostrenderVisualQaSharedLifecycleResult['requestRef']
  exactRereadVerified: true
}> {
  assertRepository(input.repository)
  const envelope = parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(
    input.envelope)
  const locator = evidenceLocator(envelope.evidence)
  const authority = await input.repository.readOutputAuthority(locator)
  if (!authority || !authorityMatchesEvidence(
    parseOutputAuthority(authority), envelope.evidence)) {
    throw conflict('canonical_output_authority_reread_mismatch')
  }
  const result = await input.repository.persistCompletedEvidenceCreateOnly(
    envelope)
  const reread = await input.repository.readCompletedEvidence(locator)
  if (!reread || canonicalJson(
    parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(reread))
    !== canonicalJson(envelope)) {
    throw conflict('canonical_completed_evidence_reread_mismatch')
  }
  return result
}

function parseOutputAuthority(
  value: unknown,
): CanonicalCaptionPostrenderVisualQaOutputAuthority {
  assertClosedContractTree(value, 'Canonical Caption visual-QA output authority')
  const parsed = outputAuthorityCore.parse(value)
  if (parsed.authorityDigestSha256 !== digestOutputAuthority(parsed)) {
    throw invalid('canonical_caption_visual_qa_output_authority_digest_mismatch')
  }
  return structuredClone(parsed)
}

function assertCompletedLineage(
  envelope: CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
): void {
  const { evidence, workRequest, lifecycleResult, normalizedResult } = envelope
  const samples = workRequest.samplePlan.samples
  const lifecycleSamples = lifecycleResult.sampledFrameRefs
  const fullMotionFrameNumbers = new Set(samples
    .filter((sample) => sample.sourceRenderKind === 'full_motion')
    .map((sample) => sample.frameNumber))
  const completeTimelineFramesInspected =
    fullMotionFrameNumbers.size === workRequest.render.frameCount
    && workRequest.render.frameCount <= 4_096
    && Array.from({ length: workRequest.render.frameCount }, (_, frame) => frame)
      .every((frame) => fullMotionFrameNumbers.has(frame))
  if (
    !sameScope(evidence.scope, workRequest.scope)
    || !sameScope(evidence.scope, lifecycleResult.scope)
    || evidence.ownerUserId !== workRequest.scope.ownerUserId
    || !sameScope(evidence.scope, normalizedResult.scope)
    || evidence.workRequestRef.id !== workRequest.workRequestId
    || evidence.workRequestRef.version !== 1
    || evidence.workRequestRef.contentHash !== workRequest.workRequestDigestSha256
    || lifecycleResult.requestRef.id !== workRequest.workRequestId
    || lifecycleResult.requestRef.version !== 1
    || lifecycleResult.requestRef.contentHash
      !== workRequest.workRequestDigestSha256
    || refKey(lifecycleResult.providerWorkPackageRef)
      !== refKey(workRequest.executionPackageRef)
    || refKey(lifecycleResult.approvedSnapshotRef)
      !== refKey(workRequest.approvedSnapshotRef)
    || refKey(lifecycleResult.approvedWorkItemRef)
      !== refKey(workRequest.approvedWorkItemRef)
    || refKey(lifecycleResult.estimateCostBindingRef)
      !== refKey(workRequest.estimateCostBindingRef)
    || evidence.lifecycleResultRef.id !== lifecycleResult.lifecycleResultId
    || evidence.lifecycleResultRef.version !== 1
    || evidence.lifecycleResultRef.contentHash
      !== lifecycleResult.lifecycleResultDigestSha256
    || refKey(evidence.normalizedDecisionRef)
      !== refKey(lifecycleResult.normalizedResultRef)
    || normalizedResult.normalizedResultId
      !== lifecycleResult.normalizedResultRef.id
    || lifecycleResult.normalizedResultRef.version !== 1
    || normalizedResult.normalizedResultDigestSha256
      !== lifecycleResult.normalizedResultRef.contentHash
    || refKey(normalizedResult.requestRef) !== refKey(evidence.workRequestRef)
    || normalizedResult.output.outputId !== evidence.output.outputId
    || normalizedResult.output.width !== evidence.output.width
    || normalizedResult.output.height !== evidence.output.height
    || normalizedResult.output.fpsNumerator
      / normalizedResult.output.fpsDenominator !== evidence.output.fps
    || normalizedResult.output.confirmedByUser !== true
    || normalizedResult.output.confirmationRecordId
      !== evidence.output.confirmationRecordId
    || normalizedResult.decision !== evidence.decision
    || normalizedResult.userFacingSummary !== evidence.userFacingSummary
    || normalizedResult.deterministicQaPassed !== evidence.deterministicQaPassed
    || normalizedResult.exactApprovedRenderBound
      !== evidence.exactApprovedRenderBound
    || normalizedResult.actualModelInferenceVerified
      !== evidence.actualModelInferenceVerified
    || normalizedResult.deterministicAndModelEvidenceAgree
      !== evidence.deterministicAndModelEvidenceAgree
    || normalizedResult.canonicalEvidenceReconciled
      !== evidence.canonicalEvidenceReconciled
    || canonicalJson(normalizedResult.modelInspectionCoverage)
      !== canonicalJson(evidence.modelInspectionCoverage)
    || normalizedResult.smallestScopeRepairRequired
      !== evidence.smallestScopeRepairRequired
    || normalizedResult.privateHumanReviewRequired
      !== evidence.privateHumanReviewRequired
    || normalizedResult.actualCompleteTimeVisualReviewPassed
      !== evidence.actualCompleteTimeVisualReviewPassed
    || refKey(normalizedResult.providerExecutionReceiptRef)
      !== refKey(evidence.providerExecutionReceiptRef)
    || refKey(normalizedResult.persistedEvidenceArtifactRef)
      !== refKey(evidence.persistedEvidenceArtifactRef)
    || refKey(normalizedResult.independentArtifactQaRef)
      !== refKey(evidence.independentArtifactQaRef)
    || refKey(normalizedResult.assetManifestReconciliationRef)
      !== refKey(evidence.assetManifestReconciliationRef)
    || refKey(lifecycleResult.sampleCollectionRef)
      !== refKey(workRequest.sampleCollectionRef)
    || evidence.output.width !== workRequest.render.width
    || evidence.output.height !== workRequest.render.height
    || evidence.output.fps !== workRequest.render.fpsNumerator
      / workRequest.render.fpsDenominator
    || evidence.modelInspectionCoverage.scope !==
      (workRequest.samplePlan.coverageScope === 'complete'
        ? 'complete_segment_coverage'
        : 'bounded_representative_segment_coverage')
    || evidence.modelInspectionCoverage.sampledSegmentCount !==
      workRequest.samplePlan.sampledSegmentCount
    || evidence.modelInspectionCoverage.unsampledSegmentCount !==
      workRequest.samplePlan.unsampledSegmentCount
    || lifecycleSamples.length !== samples.length
    || lifecycleSamples.some((sample, index) => {
      const requestSample = samples[index]
      return !requestSample
        || sample.sampleId !== requestSample.sampleId
        || sample.sourceRenderKind !== requestSample.sourceRenderKind
        || sample.frameNumber !== requestSample.frameNumber
        || refKey(sample.frameArtifactRef)
          !== refKey(requestSample.frameArtifactRef)
        || sample.frameSha256 !== requestSample.frameSha256
    })
    || (evidence.actualCompleteTimeVisualReviewPassed && (
      workRequest.samplePlan.coverageScope !== 'complete'
      || !workRequest.samplePlan.completeTimeCoverageClaimAllowed
      || workRequest.samplePlan.unsampledSegmentCount !== 0
      || !completeTimelineFramesInspected
    ))
  ) throw conflict('canonical_caption_visual_qa_completed_lineage_mismatch')
}

function authorityMatchesEvidence(
  authority: CanonicalCaptionPostrenderVisualQaOutputAuthority,
  evidenceValue: CanonicalCaptionPostrenderVisualQaEvidence,
): boolean {
  return authority.ownerUserId === evidenceValue.ownerUserId
    && sameScope(authority.scope, evidenceValue.scope)
    && canonicalJson(authority.output) === canonicalJson(evidenceValue.output)
    && authority.lifecycleState !== 'not_scheduled'
}

function assertRepository(
  repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository,
): void {
  if (!repository
    || repository.repositoryVersion !==
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION
    || typeof repository.readOutputAuthority !== 'function'
    || typeof repository.readCompletedEvidence !== 'function'
    || typeof repository.persistCompletedEvidenceCreateOnly !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption visual-QA evidence repository is unavailable.',
      503,
      { requiredGate: 'canonical_caption_visual_qa_evidence_repository' },
    )
  }
}

function locatorKey(value: {
  ownerUserId: string
  scope?: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  approvedSnapshotId?: string
  output?: { outputId: string }
  outputId?: string
}): string {
  const scoped = value.scope ?? value
  return [
    value.ownerUserId,
    scoped.workspaceId,
    scoped.projectId,
    scoped.editSessionId,
    scoped.approvedSnapshotId,
    value.output?.outputId ?? value.outputId,
  ].join('\u0000')
}

function evidenceLocator(
  value: CanonicalCaptionPostrenderVisualQaEvidence,
) {
  return {
    ownerUserId: value.ownerUserId,
    ...value.scope,
    outputId: value.output.outputId,
  }
}

function sameScope(
  left: { workspaceId: string; projectId: string; editSessionId: string;
    approvedSnapshotId: string },
  right: { workspaceId: string; projectId: string; editSessionId: string;
    approvedSnapshotId: string },
): boolean {
  return left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function dimensionsMatch(
  ratio: CaptionRenderedVisualReviewAuthenticatedOutputScope['aspectRatio'],
  width: number,
  height: number,
): boolean {
  if (ratio === 'custom' || ratio === 'original') return true
  const [x, y] = ratio.split(':').map(Number) as [number, number]
  return Math.abs(width / height - x / y) <= 0.01
}

function digestOutputAuthority(value: unknown): string {
  return digest({
    ...(value as Record<string, unknown>),
    authorityDigestSha256: null,
  })
}

function digestEvidence(value: unknown): string {
  return digest({
    ...(value as Record<string, unknown>),
    evidenceDigestSha256: null,
  })
}

function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`
}

function evidenceRecordRef(
  value: CanonicalCaptionPostrenderVisualQaEvidence,
) {
  return {
    id: value.evidenceId,
    version: 1,
    contentHash: value.evidenceDigestSha256,
  }
}

function refKey(value: { id: string; version: number; contentHash: string }) {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value))
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!record(value)) return value
  return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalValue(item)]))
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === keys.length
    && actual.every((key, index) => key === [...keys].sort()[index])
}

function cloneOrNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : structuredClone(value)
}

function invalid(reason: string): ApiError {
  return new ApiError('VALIDATION_FAILED',
    'Canonical Caption visual-QA evidence is invalid.', 400, { reason })
}

function conflict(reason: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT',
    'Canonical Caption visual-QA evidence conflicts with immutable lineage.',
    409, { reason })
}
