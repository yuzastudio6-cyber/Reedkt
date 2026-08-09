import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_V2_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_V2_VERSION,
  type CanonicalCaptionPrivateQualificationInspectionProjectionV2,
  type CanonicalCaptionPrivateQualificationRunControllerInputV2,
  type CanonicalCaptionPrivateQualificationRunControllerV2,
  type CanonicalCaptionPrivateQualificationRunOutcomeV2,
} from '../../src/types/canonical-caption-private-qualification-run-controller-v2'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION,
  type CanonicalCaptionPrivateQualificationRunController,
  type CanonicalCaptionPrivateQualificationRunControllerInput,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import type {
  CanonicalCaptionBrollOwnerInspectionBundleRepository,
  CanonicalCaptionBrollOwnerInspectionProjectionService,
  CanonicalCaptionBrollOwnerInspectionProjectionServiceV2,
} from '../../src/types/canonical-caption-broll-owner-inspection-projection'
import type {
  CanonicalCaptionQualificationRunEvidenceAssembly,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  isCanonicalCaptionBrollOwnerInspectionBundleRepository,
  isCanonicalCaptionBrollOwnerInspectionProjectionService,
  parseCanonicalCaptionBrollOwnerInspectionProjectionOutcome,
  parseCanonicalCaptionBrollOwnerInspectionProjectionRequest,
} from './canonical-caption-broll-owner-inspection-projection-service'
import {
  parseCanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence-service'
import {
  isCanonicalCaptionQualificationRunEvidenceAssembly,
  parseCanonicalCaptionQualificationRunEvidence,
} from './canonical-caption-qualification-run-evidence-reader'
import {
  parseCanonicalCaptionPrivateQualificationRunOutcome,
} from './canonical-caption-private-qualification-run-controller'
import {
  parseCanonicalCaptionRealSourceInspectionProjectionRequest,
} from './canonical-caption-real-source-inspection-projection-service'
import {
  parseCanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification-service'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const commonInputSchema = z.object({
  inspectionLane: z.enum(['uploaded_source', 'broll_owner']),
  inspectionRequest: z.unknown(),
  inspectionBundle: z.unknown(),
  qualificationRequest: z.unknown(),
  captionOwnedClosedDirectInspectionReceiptProvided: z.literal(true),
  exactApprovedRunRereadRequired: z.literal(true),
  callerSuppliedCanonicalAuthorityAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const uploadedProjectionSchema = z.object({
  disposition: z.literal(
    'projected_canonical_direct_visual_inspection_evidence'),
  request: z.unknown(),
  evidence: z.unknown(),
  captionReceiptRereadTwice: z.literal(true),
  reviewSpecsRereadTwice: z.literal(true),
  canonicalApprovedRunAuthorityRereadTwice: z.literal(true),
  canonicalApprovedRunAuthorityRef: refSchema,
  evidencePersistedCreateOnlyAndReread: z.literal(true),
  canonicalQualificationReaderMustRevalidateAuthority: z.literal(true),
  currentProductStatusChanged: z.literal(false),
  publicOrProductionAuthorityGranted: z.literal(false),
}).strict()
const outcomeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_V2_VERSION),
  outcomeDigestSha256: sha256,
  disposition: z.enum([
    'inspection_projected_waiting_for_complete_run',
    'approved_run_recorded',
  ]),
  inspectionLane: z.enum(['uploaded_source', 'broll_owner']),
  inspectionProjection: z.unknown(),
  inspectionEvidenceRef: refSchema,
  qualificationRunEvidence: z.unknown().nullable(),
  qualificationRunEvidenceRef: refSchema.nullable(),
  inspectionBundlePersistedCreateOnlyAndReread: z.literal(true),
  canonicalInspectionAuthorityRereadTwice: z.literal(true),
  canonicalRunEvidenceSourceReadAttempted: z.literal(true),
  qualificationRunEvidencePersistedAndExactReread: z.boolean(),
  incompleteRunPromoted: z.literal(false),
  callerSuppliedCanonicalAuthorityAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const admittedControllers = new WeakSet<object>()

export function parseCanonicalCaptionPrivateQualificationRunOutcomeV2(
  value: unknown,
): CanonicalCaptionPrivateQualificationRunOutcomeV2 {
  assertClosedContractTree(value,
    'Canonical Caption private qualification run outcome V2')
  const envelope = outcomeSchema.parse(value)
  const projection = envelope.inspectionLane === 'uploaded_source'
    ? parseUploadedProjection(envelope.inspectionProjection)
    : parseCanonicalCaptionBrollOwnerInspectionProjectionOutcome(
      envelope.inspectionProjection)
  const evidence = parseCanonicalCaptionDirectVisualInspectionEvidence(
    projection.evidence)
  const runEvidence = envelope.qualificationRunEvidence === null ? null
    : parseCanonicalCaptionQualificationRunEvidence(
      envelope.qualificationRunEvidence)
  const runEvidenceRef = runEvidence ? {
    id: runEvidence.recordId,
    version: runEvidence.schemaVersion,
    contentHash: runEvidence.recordDigestSha256,
  } : null
  const request = projection.request
  const requestScope = request.canonicalScope
  const scope = evidence.canonicalScope
  if (envelope.outcomeDigestSha256 !== calculateSkillContractDigest(
    envelope as unknown as Record<string, unknown>, 'outcomeDigestSha256')
    || !sameRef(envelope.inspectionEvidenceRef, {
      id: evidence.evidenceId,
      version: evidence.schemaVersion,
      contentHash: evidence.evidenceDigestSha256,
    })
    || scope.ownerUserId !== requestScope.ownerUserId
    || scope.workspaceId !== requestScope.workspaceId
    || scope.projectId !== requestScope.projectId
    || scope.editSessionId !== requestScope.editSessionId
    || scope.planVersionId !== requestScope.planVersionId
    || scope.outputId !== requestScope.outputId
    || !sameRef(scope.approvedSnapshotRef,
      requestScope.approvedSnapshotRef)
    || !sameRef(scope.executionPackageRef,
      requestScope.executionPackageRef)
    || !sameRef(evidence.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(evidence.renderedArtifactRef,
      request.renderedArtifactRef)
    || !sameRef(evidence.deterministicQaRef,
      request.deterministicQaRef)
    || !sameRef(evidence.inspectionArtifactSetRef, request.receiptRef)
    || (envelope.disposition === 'approved_run_recorded')
      !== Boolean(runEvidence)
    || envelope.qualificationRunEvidencePersistedAndExactReread
      !== Boolean(runEvidence)
    || (runEvidenceRef === null)
      !== (envelope.qualificationRunEvidenceRef === null)
    || (runEvidenceRef && envelope.qualificationRunEvidenceRef
      && !sameRef(runEvidenceRef,
        envelope.qualificationRunEvidenceRef))) {
    throw new Error(
      'Canonical Caption private qualification run outcome V2 invalid.')
  }
  return structuredClone({
    ...envelope,
    inspectionProjection: projection,
    qualificationRunEvidence: runEvidence,
  }) as CanonicalCaptionPrivateQualificationRunOutcomeV2
}

export function createCanonicalCaptionPrivateQualificationRunControllerV2(
  input: {
    readonly legacyUploadedSourceController:
      CanonicalCaptionPrivateQualificationRunController
    readonly brollInspectionBundleRepository:
      CanonicalCaptionBrollOwnerInspectionBundleRepository
    readonly brollInspectionProjectionService:
      CanonicalCaptionBrollOwnerInspectionProjectionService
      | CanonicalCaptionBrollOwnerInspectionProjectionServiceV2
    readonly runEvidenceAssembly:
      CanonicalCaptionQualificationRunEvidenceAssembly
  },
): CanonicalCaptionPrivateQualificationRunControllerV2 {
  assertDependencies(input)
  const controller = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_V2_VERSION,
    supportedInspectionLanes:
      ['uploaded_source', 'broll_owner'] as const,
    closedCaptionDirectInspectionReceiptRequired: true as const,
    exactApprovedRunRereadRequired: true as const,
    incompleteRunPromotionAllowed: false as const,
    async reconcileApprovedRun(untrusted: unknown) {
      const request =
        parseCanonicalCaptionPrivateQualificationRunControllerInputV2(
          untrusted)
      assertSharedRunIdentity(request)
      if (request.inspectionLane === 'uploaded_source') {
        const legacyOutcome =
          parseCanonicalCaptionPrivateQualificationRunOutcome(
            await input.legacyUploadedSourceController.reconcileApprovedRun(
              legacyInput(request)))
        return createOutcome({
          inspectionLane: 'uploaded_source',
          inspectionProjection: legacyOutcome.inspectionProjection,
          qualificationRunEvidence:
            legacyOutcome.qualificationRunEvidence,
        })
      }
      await input.brollInspectionBundleRepository.persistBundleCreateOnly({
        locator: {
          canonicalScope: request.inspectionRequest.canonicalScope,
          receiptRef: request.inspectionRequest.receiptRef,
          variant: request.inspectionRequest.variant,
        },
        bundle: request.inspectionBundle,
      })
      const inspectionProjection =
        await input.brollInspectionProjectionService.project(
          request.inspectionRequest)
      const runValue = await input.runEvidenceAssembly.evidenceReadPort
        .readExact({ request: request.qualificationRequest })
      const runEvidence = runValue === null ? null
        : parseCanonicalCaptionQualificationRunEvidence(runValue)
      if (runEvidence) {
        assertRecordedRunIdentity(request, inspectionProjection, runEvidence)
      }
      return createOutcome({
        inspectionLane: 'broll_owner',
        inspectionProjection,
        qualificationRunEvidence: runEvidence,
      })
    },
  })
  admittedControllers.add(controller)
  return controller
}

export function isCanonicalCaptionPrivateQualificationRunControllerV2(
  value: unknown,
): value is CanonicalCaptionPrivateQualificationRunControllerV2 {
  return Boolean(value && typeof value === 'object'
    && admittedControllers.has(value as object))
}

function createOutcome(input: {
  inspectionLane: 'uploaded_source' | 'broll_owner'
  inspectionProjection:
    CanonicalCaptionPrivateQualificationInspectionProjectionV2
  qualificationRunEvidence: ReturnType<
    typeof parseCanonicalCaptionQualificationRunEvidence> | null
}): CanonicalCaptionPrivateQualificationRunOutcomeV2 {
  const projection = input.inspectionProjection
  const evidence = projection.evidence
  const runEvidence = input.qualificationRunEvidence
  const withoutDigest: Omit<
    CanonicalCaptionPrivateQualificationRunOutcomeV2,
    'outcomeDigestSha256'> = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_V2_VERSION,
    disposition: runEvidence
      ? 'approved_run_recorded'
      : 'inspection_projected_waiting_for_complete_run',
    inspectionLane: input.inspectionLane,
    inspectionProjection: projection,
    inspectionEvidenceRef: {
      id: evidence.evidenceId,
      version: evidence.schemaVersion,
      contentHash: evidence.evidenceDigestSha256,
    },
    qualificationRunEvidence: runEvidence,
    qualificationRunEvidenceRef: runEvidence ? {
      id: runEvidence.recordId,
      version: runEvidence.schemaVersion,
      contentHash: runEvidence.recordDigestSha256,
    } : null,
    inspectionBundlePersistedCreateOnlyAndReread: true,
    canonicalInspectionAuthorityRereadTwice: true,
    canonicalRunEvidenceSourceReadAttempted: true,
    qualificationRunEvidencePersistedAndExactReread: runEvidence !== null,
    incompleteRunPromoted: false,
    callerSuppliedCanonicalAuthorityAccepted: false,
    browserLocalCompletionAccepted: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
  return Object.freeze(parseCanonicalCaptionPrivateQualificationRunOutcomeV2({
    ...withoutDigest,
    outcomeDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      outcomeDigestSha256: '',
    } as unknown as Record<string, unknown>, 'outcomeDigestSha256'),
  }))
}

export function parseCanonicalCaptionPrivateQualificationRunControllerInputV2(
  value: unknown,
): CanonicalCaptionPrivateQualificationRunControllerInputV2 {
  assertClosedContractTree(value,
    'Canonical Caption private qualification run controller input V2')
  const parsed = commonInputSchema.parse(value)
  const qualificationRequest =
    parseCanonicalCaptionTerminalQualificationRequest(
      parsed.qualificationRequest)
  if (parsed.inspectionLane === 'uploaded_source') {
    return {
      ...parsed,
      inspectionLane: 'uploaded_source',
      inspectionRequest:
        parseCanonicalCaptionRealSourceInspectionProjectionRequest(
          parsed.inspectionRequest),
      inspectionBundle: structuredClone(parsed.inspectionBundle) as
        Extract<CanonicalCaptionPrivateQualificationRunControllerInputV2, {
          inspectionLane: 'uploaded_source'
        }>['inspectionBundle'],
      qualificationRequest,
    }
  }
  return {
    ...parsed,
    inspectionLane: 'broll_owner',
    inspectionRequest:
      parseCanonicalCaptionBrollOwnerInspectionProjectionRequest(
        parsed.inspectionRequest),
    inspectionBundle: structuredClone(parsed.inspectionBundle) as
      Extract<CanonicalCaptionPrivateQualificationRunControllerInputV2, {
        inspectionLane: 'broll_owner'
      }>['inspectionBundle'],
    qualificationRequest,
  }
}

function parseUploadedProjection(
  value: unknown,
): Extract<CanonicalCaptionPrivateQualificationInspectionProjectionV2, {
  captionReceiptRereadTwice: true
}> {
  assertClosedContractTree(value,
    'Canonical Caption uploaded-source inspection projection')
  const envelope = uploadedProjectionSchema.parse(value)
  const request = parseCanonicalCaptionRealSourceInspectionProjectionRequest(
    envelope.request)
  const evidence = parseCanonicalCaptionDirectVisualInspectionEvidence(
    envelope.evidence)
  return structuredClone({ ...envelope, request, evidence }) as
    Extract<CanonicalCaptionPrivateQualificationInspectionProjectionV2, {
      captionReceiptRereadTwice: true
    }>
}

function legacyInput(
  input: Extract<CanonicalCaptionPrivateQualificationRunControllerInputV2, {
    inspectionLane: 'uploaded_source'
  }>,
): CanonicalCaptionPrivateQualificationRunControllerInput {
  return {
    inspectionRequest: input.inspectionRequest,
    inspectionBundle: input.inspectionBundle,
    qualificationRequest: input.qualificationRequest,
    captionOwnedClosedDirectInspectionReceiptProvided:
      input.captionOwnedClosedDirectInspectionReceiptProvided,
    exactApprovedRunRereadRequired: input.exactApprovedRunRereadRequired,
    callerSuppliedCanonicalAuthorityAccepted:
      input.callerSuppliedCanonicalAuthorityAccepted,
    browserLocalCompletionAccepted: input.browserLocalCompletionAccepted,
    operationOrRuntimeAuthorityGrantedToCaption:
      input.operationOrRuntimeAuthorityGrantedToCaption,
    providerOrModelAuthorityGrantedToCaption:
      input.providerOrModelAuthorityGrantedToCaption,
    assetMutationAuthorityGrantedToCaption:
      input.assetMutationAuthorityGrantedToCaption,
    finalQaApprovalAuthorityGrantedToCaption:
      input.finalQaApprovalAuthorityGrantedToCaption,
    creditOrBillingAuthorityGrantedToCaption:
      input.creditOrBillingAuthorityGrantedToCaption,
    publicDeliveryAuthorityGrantedToCaption:
      input.publicDeliveryAuthorityGrantedToCaption,
    productionAuthorityGrantedToCaption:
      input.productionAuthorityGrantedToCaption,
  }
}

function assertSharedRunIdentity(
  input: CanonicalCaptionPrivateQualificationRunControllerInputV2,
): void {
  const inspection = input.inspectionRequest
  const qualification = input.qualificationRequest
  const left = inspection.canonicalScope
  const right = qualification.canonicalScope
  if (left.ownerUserId !== right.ownerUserId
    || left.workspaceId !== right.workspaceId
    || left.projectId !== right.projectId
    || left.editSessionId !== right.editSessionId
    || left.planVersionId !== right.planVersionId
    || !sameRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
    || !sameRef(left.executionPackageRef,
      qualification.executionPackageRef)
    || qualification.requiredOutputIds.length !== 1
    || qualification.requiredOutputIds[0] !== left.outputId) {
    throw new Error(
      'Caption inspection and qualification crossed approved run V2.')
  }
}

function assertRecordedRunIdentity(
  input: Extract<CanonicalCaptionPrivateQualificationRunControllerInputV2, {
    inspectionLane: 'broll_owner'
  }>,
  inspection: Awaited<ReturnType<
    CanonicalCaptionBrollOwnerInspectionProjectionService['project']>>,
  record: ReturnType<typeof parseCanonicalCaptionQualificationRunEvidence>,
): void {
  const request = input.inspectionRequest
  if (record.canonicalScope.ownerUserId !== request.canonicalScope.ownerUserId
    || record.canonicalScope.workspaceId !==
      request.canonicalScope.workspaceId
    || record.canonicalScope.projectId !== request.canonicalScope.projectId
    || record.canonicalScope.editSessionId !==
      request.canonicalScope.editSessionId
    || record.canonicalScope.planVersionId !==
      request.canonicalScope.planVersionId
    || !sameRef(record.canonicalScope.approvedSnapshotRef,
      request.canonicalScope.approvedSnapshotRef)
    || !sameRef(record.executionPackageRef,
      request.canonicalScope.executionPackageRef)
    || record.outputEvidence.outputId !== request.canonicalScope.outputId
    || !sameRef(record.outputEvidence.captionOwnedDirectVisualInspectionRef,
      {
        id: inspection.evidence.evidenceId,
        version: inspection.evidence.schemaVersion,
        contentHash: inspection.evidence.evidenceDigestSha256,
      })) {
    throw new Error(
      'Caption B-roll qualification run crossed inspection evidence.')
  }
}

function assertDependencies(input: {
  legacyUploadedSourceController:
    CanonicalCaptionPrivateQualificationRunController
  brollInspectionBundleRepository:
    CanonicalCaptionBrollOwnerInspectionBundleRepository
  brollInspectionProjectionService:
    CanonicalCaptionBrollOwnerInspectionProjectionService
    | CanonicalCaptionBrollOwnerInspectionProjectionServiceV2
  runEvidenceAssembly: CanonicalCaptionQualificationRunEvidenceAssembly
}): void {
  const legacy = input.legacyUploadedSourceController
  if (!legacy
    || legacy.schemaVersion !==
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION
    || !legacy.closedCaptionDirectInspectionReceiptRequired
    || !legacy.exactApprovedRunRereadRequired
    || legacy.incompleteRunPromotionAllowed
    || typeof legacy.reconcileApprovedRun !== 'function'
    || !isCanonicalCaptionBrollOwnerInspectionBundleRepository(
      input.brollInspectionBundleRepository)
    || !isCanonicalCaptionBrollOwnerInspectionProjectionService(
      input.brollInspectionProjectionService)
    || !isCanonicalCaptionQualificationRunEvidenceAssembly(
      input.runEvidenceAssembly)) {
    throw new Error(
      'Canonical Caption qualification controller V2 ports invalid.')
  }
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

export function canonicalCaptionQualificationRunRequestRef(
  request: CanonicalCaptionPrivateQualificationRunControllerInputV2[
    'qualificationRequest'],
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}
