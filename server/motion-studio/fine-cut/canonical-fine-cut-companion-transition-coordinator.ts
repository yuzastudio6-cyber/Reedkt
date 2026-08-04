import {
  motionStudioDeliveryHandoffV1Schema,
  motionStudioFineCutReviewDecisionV1Schema,
  motionStudioPrivateReviewBindingV1Schema,
  motionStudioQualityControlReportV1Schema,
  motionStudioReviewCommentEventV1Schema,
  motionStudioReviewCommentV1Schema,
  motionStudioRevisionImpactV1Schema,
} from '../../../src/lib/motion-studio/contracts/fine-cut'
import type {
  MotionStudioDeliveryHandoffV1,
  MotionStudioFineCutReviewDecisionV1,
  MotionStudioPrivateReviewBindingV1,
  MotionStudioQualityControlReportV1,
  MotionStudioReviewCommentEventV1,
  MotionStudioReviewCommentV1,
  MotionStudioRevisionImpactV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  canonicalMotionStudioFineCutAuthorizationV1Schema,
  canonicalMotionStudioFineCutCompanionCommitReceiptV1Schema,
  type CanonicalMotionStudioFineCutAuthorizationV1,
  type CanonicalMotionStudioFineCutCompanionCommitReceiptV1,
} from '../../validation/motion-studio-fine-cut-transition-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  CanonicalMotionStudioFineCutScope,
  CanonicalMotionStudioFineCutTransitionPort,
} from './canonical-fine-cut-transition-port'

export interface CanonicalMotionStudioFineCutCompanionTransitionInput<TRecord> {
  scope: CanonicalMotionStudioFineCutScope
  actorUserId: string
  record: TRecord
  idempotencyKey: string
}

type CompanionRecord =
  | MotionStudioPrivateReviewBindingV1
  | MotionStudioReviewCommentV1
  | MotionStudioReviewCommentEventV1
  | MotionStudioFineCutReviewDecisionV1
  | MotionStudioRevisionImpactV1
  | MotionStudioQualityControlReportV1
  | MotionStudioDeliveryHandoffV1

type CompanionRecordKind =
  CanonicalMotionStudioFineCutCompanionCommitReceiptV1['recordKind']

export class CanonicalMotionStudioFineCutCompanionTransitionCoordinator {
  private readonly port: CanonicalMotionStudioFineCutTransitionPort

  constructor(port: CanonicalMotionStudioFineCutTransitionPort) {
    this.port = port
  }

  async commitPrivateReviewBinding(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioPrivateReviewBindingV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioPrivateReviewBindingV1Schema.parse(input.record)
    return this.commit(input, record, 'private_review_binding', 'commit_private_review_binding', {
      recordId: record.reviewBindingId,
      canonicalPackageRecordId: record.canonicalPackageRecordId,
      canonicalReviewAssemblyId: record.canonicalReviewAssemblyId,
      canonicalReviewManifestSha256: record.canonicalReviewManifestSha256,
      canonicalFinalArtifactSha256: record.canonicalFinalArtifactSha256,
    })
  }

  async appendReviewComment(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioReviewCommentV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioReviewCommentV1Schema.parse(input.record)
    if (record.authoredByActorId !== input.actorUserId) {
      denied('A review comment cannot be authored for another actor.')
    }
    return this.commit(input, record, 'review_comment', 'append_review_comment', {
      recordId: record.commentId,
      reviewBindingId: record.reviewBindingId,
    })
  }

  async appendReviewCommentEvent(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioReviewCommentEventV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioReviewCommentEventV1Schema.parse(input.record)
    if (record.actorId !== input.actorUserId) {
      denied('A review-comment event cannot be authored for another actor.')
    }
    return this.commit(input, record, 'review_comment_event', 'append_review_comment_event', {
      recordId: record.eventId,
      commentId: record.commentId,
      sequence: record.sequence,
      expectedPreviousState: record.expectedPreviousState,
      resultingState: record.resultingState,
    })
  }

  async commitReviewDecision(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioFineCutReviewDecisionV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioFineCutReviewDecisionV1Schema.parse(input.record)
    if (record.decidedByActorId !== input.actorUserId) {
      denied('A Fine Cut review decision cannot be recorded for another actor.')
    }
    const canonicalDecision = record.decision === 'approve'
      ? 'accept_private_internal_review'
      : 'request_revision'
    return this.commit(input, record, 'fine_cut_review_decision', 'commit_review_decision', {
      recordId: record.decisionId,
      canonicalReviewAssemblyId: record.canonicalReviewAssemblyId,
      expectedReviewRecordVersion: record.expectedReviewRecordVersion,
      canonicalDecision,
    })
  }

  async commitRevisionImpact(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioRevisionImpactV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioRevisionImpactV1Schema.parse(input.record)
    return this.commit(input, record, 'revision_impact', 'commit_revision_impact', {
      recordId: record.impactId,
      sourceDecisionId: record.sourceDecisionId,
      chatRevisionProposalId: record.chatRevisionProposalId,
    })
  }

  async commitQualityControlReport(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioQualityControlReportV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioQualityControlReportV1Schema.parse(input.record)
    return this.commit(input, record, 'quality_control_report', 'commit_quality_control_report', {
      recordId: record.reportId,
      reviewDecisionId: record.reviewDecisionId,
    })
  }

  async commitDeliveryHandoff(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<MotionStudioDeliveryHandoffV1>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const record = motionStudioDeliveryHandoffV1Schema.parse(input.record)
    return this.commit(input, record, 'delivery_handoff', 'commit_delivery_handoff', {
      recordId: record.handoffId,
      qualityControlReportId: record.qualityControlReportId,
      existingExportRecordId: record.existingExportRecordId,
      exportManifestId: record.exportManifestId,
    })
  }

  private async commit<TRecord extends CompanionRecord>(
    input: CanonicalMotionStudioFineCutCompanionTransitionInput<TRecord>,
    record: TRecord,
    recordKind: CompanionRecordKind,
    operation: string,
    expected: Record<string, string | number>,
  ): Promise<CanonicalMotionStudioFineCutCompanionCommitReceiptV1> {
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
    assertScope(input.scope)
    assertIdentity(input.actorUserId, 'actorUserId')
    assertRecordScope(input.scope, record)

    const authorization = canonicalMotionStudioFineCutAuthorizationV1Schema.parse(
      await this.port.authorizeScope({
        scope: input.scope,
        actorUserId: input.actorUserId,
        access: 'write',
      }),
    )
    assertAuthorization(input.scope, input.actorUserId, authorization)
    const authorizationDigest = sha256CanonicalJson(authorization)
    const recordDigest = sha256CanonicalJson(record)
    const requestHash = sha256CanonicalJson({
      operation: `canonical_motion_studio_fine_cut_${operation}_v1`,
      scope: input.scope,
      actorUserId: input.actorUserId,
      record,
    })
    const portInput = {
      authorization,
      authorizationDigest,
      actorUserId: input.actorUserId,
      requestHash,
      idempotencyKey,
      record,
      recordDigest,
    }
    const receiptInput = recordKind === 'private_review_binding'
      ? await this.port.commitPrivateReviewBinding(
          portInput as Parameters<typeof this.port.commitPrivateReviewBinding>[0],
        )
      : recordKind === 'review_comment'
        ? await this.port.appendReviewComment(
            portInput as Parameters<typeof this.port.appendReviewComment>[0],
          )
        : recordKind === 'review_comment_event'
          ? await this.port.appendReviewCommentEvent(
              portInput as Parameters<typeof this.port.appendReviewCommentEvent>[0],
            )
          : recordKind === 'fine_cut_review_decision'
            ? await this.port.commitReviewDecision(
                portInput as Parameters<typeof this.port.commitReviewDecision>[0],
              )
            : recordKind === 'revision_impact'
              ? await this.port.commitRevisionImpact(
                  portInput as Parameters<typeof this.port.commitRevisionImpact>[0],
                )
              : recordKind === 'quality_control_report'
                ? await this.port.commitQualityControlReport(
                    portInput as Parameters<typeof this.port.commitQualityControlReport>[0],
                  )
                : await this.port.commitDeliveryHandoff(
                    portInput as Parameters<typeof this.port.commitDeliveryHandoff>[0],
                  )
    const receipt = canonicalMotionStudioFineCutCompanionCommitReceiptV1Schema.parse(receiptInput)
    assertReceipt({
      scope: input.scope,
      actorUserId: input.actorUserId,
      authorizationDigest,
      requestHash,
      record,
      recordDigest,
      recordKind,
      expected,
      receipt,
    })
    return receipt
  }
}

function assertReceipt(input: {
  scope: CanonicalMotionStudioFineCutScope
  actorUserId: string
  authorizationDigest: string
  requestHash: string
  record: CompanionRecord
  recordDigest: string
  recordKind: CompanionRecordKind
  expected: Record<string, string | number>
  receipt: CanonicalMotionStudioFineCutCompanionCommitReceiptV1
}): void {
  const receipt = input.receipt
  if (
    !sameScope(input.scope, receipt) ||
    receipt.actorUserId !== input.actorUserId ||
    receipt.authorizationDigest !== input.authorizationDigest ||
    receipt.requestHash !== input.requestHash ||
    receipt.recordDigest !== input.recordDigest ||
    receipt.recordKind !== input.recordKind ||
    receipt.fineCutVersionId !== input.record.fineCutVersionId ||
    receipt.authorizationBeforeIdempotency !== true ||
    receipt.exactCurrentAuthorityReverified !== true
  ) blocked('Fine Cut companion commit failed exact atomic readback verification.')

  const actual = receipt as unknown as Record<string, unknown>
  for (const [key, expectedValue] of Object.entries(input.expected)) {
    if (actual[key] !== expectedValue) {
      blocked(`Fine Cut companion commit changed exact ${key} authority.`)
    }
  }
  if (receipt.recordKind === 'fine_cut_review_decision') {
    const expectedDecision = input.expected.canonicalDecision
    if (receipt.canonicalDecision !== expectedDecision) {
      blocked('Fine Cut review decision did not use the canonical shared decision path.')
    }
  }
}

function assertRecordScope(
  scope: CanonicalMotionStudioFineCutScope,
  record: CompanionRecord,
): void {
  if (!sameScope(scope, record)) {
    blocked('Fine Cut companion record changed exact production ownership.')
  }
}

function assertAuthorization(
  scope: CanonicalMotionStudioFineCutScope,
  actorUserId: string,
  authorization: CanonicalMotionStudioFineCutAuthorizationV1,
): void {
  if (
    !sameScope(scope, authorization) ||
    authorization.actorUserId !== actorUserId ||
    authorization.authorizationBeforeIdempotency !== true ||
    authorization.exactStorytellingProductionReverified !== true
  ) denied('Fine Cut companion authorization does not match this exact production.')
}

function sameScope(
  expected: CanonicalMotionStudioFineCutScope,
  actual: CanonicalMotionStudioFineCutScope,
): boolean {
  return expected.workspaceId === actual.workspaceId &&
    expected.projectId === actual.projectId &&
    expected.editSessionId === actual.editSessionId &&
    expected.productionId === actual.productionId
}

function assertScope(scope: CanonicalMotionStudioFineCutScope): void {
  assertIdentity(scope.workspaceId, 'workspaceId')
  assertIdentity(scope.projectId, 'projectId')
  assertIdentity(scope.editSessionId, 'editSessionId')
  assertIdentity(scope.productionId, 'productionId')
}

function assertIdentity(value: string, field: string): void {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(value) ||
    value.includes('..')
  ) throw new ApiError('VALIDATION_FAILED', `Invalid ${field}.`, 400)
}

function requireIdempotencyKey(value: string): string {
  const key = value.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/u.test(key) || key.includes('..')) {
    throw new ApiError('VALIDATION_FAILED', 'A bounded idempotency key is required.', 400)
  }
  return key
}

function denied(message: string): never {
  throw new ApiError('WORKSPACE_ACCESS_DENIED', message, 403)
}

function blocked(message: string): never {
  throw new ApiError(
    'MOTION_STUDIO_APPROVAL_BLOCKED',
    message,
    409,
    { requiredGate: 'canonical_motion_studio_fine_cut_companion_transition' },
  )
}
