import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION,
  type CanonicalCaptionPrivateQualificationRunController,
  type CanonicalCaptionPrivateQualificationRunControllerInput,
  type CanonicalCaptionPrivateQualificationRunOutcome,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import type {
  CanonicalCaptionQualificationRunEvidenceAssembly,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import type {
  CanonicalCaptionRealSourceInspectionBundleRepository,
  CanonicalCaptionRealSourceInspectionProjectionServiceV3,
} from '../../src/types/canonical-caption-real-source-inspection-projection'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseCanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence-service'
import {
  isCanonicalCaptionQualificationRunEvidenceAssembly,
  parseCanonicalCaptionQualificationRunEvidence,
} from './canonical-caption-qualification-run-evidence-reader'
import {
  isCanonicalCaptionRealSourceInspectionBundleRepository,
  isCanonicalCaptionRealSourceInspectionProjectionServiceV3,
  parseCanonicalCaptionRealSourceInspectionProjectionRequest,
} from './canonical-caption-real-source-inspection-projection-service'
import {
  parseCanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification-service'

const inputSchema = z.object({
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
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const inspectionProjectionSchema = z.object({
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
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION),
  outcomeDigestSha256: sha256,
  disposition: z.enum([
    'inspection_projected_waiting_for_complete_run',
    'approved_run_recorded',
  ]),
  inspectionProjection: inspectionProjectionSchema,
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

export function parseCanonicalCaptionPrivateQualificationRunOutcome(
  value: unknown,
): CanonicalCaptionPrivateQualificationRunOutcome {
  assertClosedContractTree(value,
    'Canonical Caption private qualification run outcome')
  const parsed = outcomeSchema.parse(value)
  const request = parseCanonicalCaptionRealSourceInspectionProjectionRequest(
    parsed.inspectionProjection.request)
  const evidence = parseCanonicalCaptionDirectVisualInspectionEvidence(
    parsed.inspectionProjection.evidence)
  const runEvidence = parsed.qualificationRunEvidence === null ? null
    : parseCanonicalCaptionQualificationRunEvidence(
      parsed.qualificationRunEvidence)
  const runRef = runEvidence ? {
    id: runEvidence.recordId,
    version: runEvidence.schemaVersion,
    contentHash: runEvidence.recordDigestSha256,
  } : null
  if (parsed.outcomeDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'outcomeDigestSha256')
    || !sameRef(parsed.inspectionEvidenceRef, {
      id: evidence.evidenceId,
      version: evidence.schemaVersion,
      contentHash: evidence.evidenceDigestSha256,
    })
    || !sameInspectionScope(evidence.canonicalScope, request.canonicalScope)
    || !sameRef(evidence.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(evidence.renderedArtifactRef, request.renderedArtifactRef)
    || !sameRef(evidence.deterministicQaRef, request.deterministicQaRef)
    || !sameRef(evidence.inspectionArtifactSetRef, request.receiptRef)
    || (parsed.disposition === 'approved_run_recorded') !==
      Boolean(runEvidence)
    || parsed.qualificationRunEvidencePersistedAndExactReread !==
      Boolean(runEvidence)
    || (runRef === null) !==
      (parsed.qualificationRunEvidenceRef === null)
    || (runRef && parsed.qualificationRunEvidenceRef
      && !sameRef(runRef, parsed.qualificationRunEvidenceRef))) {
    throw new Error('Canonical Caption qualification run outcome invalid.')
  }
  return structuredClone(parsed) as
    CanonicalCaptionPrivateQualificationRunOutcome
}

export function createCanonicalCaptionPrivateQualificationRunController(
  input: {
    readonly inspectionBundleRepository:
      CanonicalCaptionRealSourceInspectionBundleRepository
    readonly inspectionProjectionService:
      CanonicalCaptionRealSourceInspectionProjectionServiceV3
    readonly runEvidenceAssembly:
      CanonicalCaptionQualificationRunEvidenceAssembly
  },
): CanonicalCaptionPrivateQualificationRunController {
  if (!isCanonicalCaptionRealSourceInspectionBundleRepository(
    input.inspectionBundleRepository)
    || !isCanonicalCaptionRealSourceInspectionProjectionServiceV3(
      input.inspectionProjectionService)
    || !isCanonicalCaptionQualificationRunEvidenceAssembly(
      input.runEvidenceAssembly)) {
    throw new Error('Canonical Caption qualification controller ports invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION,
    closedCaptionDirectInspectionReceiptRequired: true as const,
    exactApprovedRunRereadRequired: true as const,
    incompleteRunPromotionAllowed: false as const,
    async reconcileApprovedRun(untrusted: unknown) {
      const request = parseControllerInput(untrusted)
      assertSharedRunIdentity(request)
      await input.inspectionBundleRepository.persistBundleCreateOnly({
        locator: {
          canonicalScope: request.inspectionRequest.canonicalScope,
          receiptRef: request.inspectionRequest.receiptRef,
          variant: request.inspectionRequest.variant,
        },
        bundle: request.inspectionBundle,
      })
      const inspectionProjection = await input.inspectionProjectionService
        .project(request.inspectionRequest)
      const runValue = await input.runEvidenceAssembly.evidenceReadPort
        .readExact({ request: request.qualificationRequest })
      const runEvidence = runValue === null ? null
        : parseCanonicalCaptionQualificationRunEvidence(runValue)
      if (runEvidence) {
        assertRecordedRunIdentity(request, inspectionProjection, runEvidence)
      }
      const withoutDigest: Omit<
        CanonicalCaptionPrivateQualificationRunOutcome,
        'outcomeDigestSha256'> = {
        schemaVersion:
          CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION,
        disposition: runEvidence
          ? 'approved_run_recorded'
          : 'inspection_projected_waiting_for_complete_run',
        inspectionProjection,
        inspectionEvidenceRef: {
          id: inspectionProjection.evidence.evidenceId,
          version: inspectionProjection.evidence.schemaVersion,
          contentHash:
            inspectionProjection.evidence.evidenceDigestSha256,
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
        qualificationRunEvidencePersistedAndExactReread:
          runEvidence !== null,
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
      return Object.freeze(parseCanonicalCaptionPrivateQualificationRunOutcome({
        ...withoutDigest,
        outcomeDigestSha256: calculateSkillContractDigest({
          ...withoutDigest,
          outcomeDigestSha256: '',
        } as unknown as Record<string, unknown>, 'outcomeDigestSha256'),
      }))
    },
  })
}

function parseControllerInput(
  value: unknown,
): CanonicalCaptionPrivateQualificationRunControllerInput {
  assertClosedContractTree(value,
    'Canonical Caption private qualification run controller input')
  const parsed = inputSchema.parse(value)
  return {
    ...parsed,
    inspectionRequest:
      parseCanonicalCaptionRealSourceInspectionProjectionRequest(
        parsed.inspectionRequest),
    inspectionBundle: structuredClone(parsed.inspectionBundle) as
      CanonicalCaptionPrivateQualificationRunControllerInput[
        'inspectionBundle'],
    qualificationRequest:
      parseCanonicalCaptionTerminalQualificationRequest(
        parsed.qualificationRequest),
  }
}

function assertSharedRunIdentity(
  input: CanonicalCaptionPrivateQualificationRunControllerInput,
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
      'Caption inspection and qualification request crossed approved run.')
  }
}

function assertRecordedRunIdentity(
  input: CanonicalCaptionPrivateQualificationRunControllerInput,
  inspection: Awaited<ReturnType<
    CanonicalCaptionRealSourceInspectionProjectionServiceV3['project']>>,
  record: ReturnType<typeof parseCanonicalCaptionQualificationRunEvidence>,
): void {
  const request = input.inspectionRequest
  if (record.canonicalScope.ownerUserId !== request.canonicalScope.ownerUserId
    || record.canonicalScope.workspaceId !== request.canonicalScope.workspaceId
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
    throw new Error('Caption qualification run crossed inspection evidence.')
  }
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameInspectionScope(
  left: CanonicalCaptionPrivateQualificationRunControllerInput[
    'inspectionRequest']['canonicalScope'],
  right: CanonicalCaptionPrivateQualificationRunControllerInput[
    'inspectionRequest']['canonicalScope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && left.outputId === right.outputId
    && sameRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
    && sameRef(left.executionPackageRef, right.executionPackageRef)
}
