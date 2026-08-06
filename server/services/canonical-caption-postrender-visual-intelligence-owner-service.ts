import { z } from 'zod'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { ApiError } from '../errors/api-error'
import {
  createVisualInspectionResult,
  parseVisualInspectionRequirement,
  parseVisualIntelligenceReport,
  parseVisualIntelligenceRequest,
  parseVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceCanonicalRequestPackageStore,
} from '../visual-intelligence/visual-intelligence-canonical-request-package-store'
import type {
  VisualIntelligenceReportRepository,
  VisualIntelligenceSpatialEvidenceRepository,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  createCanonicalCaptionPostrenderVisualIntelligenceResult,
} from './canonical-caption-postrender-visual-intelligence-result'
import type {
  CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository,
} from './canonical-caption-postrender-visual-intelligence-owner-result-port'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_SERVICE_VERSION =
  'canonical-caption-postrender-visual-intelligence-owner-service-v1' as const

export interface FinalizeCanonicalCaptionPostrenderVisualIntelligenceInput {
  resultId: string
  requestRef: VisualIntelligenceEvidenceRef
  reportRef: VisualIntelligenceEvidenceRef
  spatialEvidenceRef: VisualIntelligenceEvidenceRef
  approvedSnapshotRef: VisualIntelligenceEvidenceRef
  executionPackageRef: VisualIntelligenceEvidenceRef
  approvedWorkItemRef: VisualIntelligenceEvidenceRef
  deterministicCompleteTimeQaRef: VisualIntelligenceEvidenceRef
  independentArtifactQaRef: VisualIntelligenceEvidenceRef
  assetManifestReconciliationRef: VisualIntelligenceEvidenceRef
  captionConfirmedOutputFrameRef: CaptionDomainRef
  confirmedOutputFrameBindingDigestSha256: string
  confirmationRecordId: string
  deterministicAndSemanticEvidenceAgree: boolean
  exactApprovedPrivateRenderRereadVerified: true
}

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentHash: prefixedSha256,
}).strict()
const captionRefSchema = z.object({
  id: safeId,
  version: safeId,
  contentHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()
const finalizeInputSchema: z.ZodType<
  FinalizeCanonicalCaptionPostrenderVisualIntelligenceInput
> = z.object({
  resultId: safeId,
  requestRef: refSchema,
  reportRef: refSchema,
  spatialEvidenceRef: refSchema,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  approvedWorkItemRef: refSchema,
  deterministicCompleteTimeQaRef: refSchema,
  independentArtifactQaRef: refSchema,
  assetManifestReconciliationRef: refSchema,
  captionConfirmedOutputFrameRef: captionRefSchema,
  confirmedOutputFrameBindingDigestSha256: prefixedSha256,
  confirmationRecordId: safeId,
  deterministicAndSemanticEvidenceAgree: z.boolean(),
  exactApprovedPrivateRenderRereadVerified: z.literal(true),
}).strict()

interface CanonicalCaptionPostrenderVisualIntelligenceOwnerDependencies {
  requestPackageStore: Pick<
    VisualIntelligenceCanonicalRequestPackageStore,
    'rereadCanonicalRequestByRef'
    | 'rereadInspectionRequirementByRequestRef'
  >
  reportRepository: Pick<
    VisualIntelligenceReportRepository,
    'readAcceptedByRef'
  >
  spatialEvidenceRepository: Pick<
    VisualIntelligenceSpatialEvidenceRepository,
    'readAcceptedSpatialEvidenceByReportRef'
  >
  ownerResultRepository:
    CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository
}

/**
 * Visual Intelligence-owned finalizer. It rereads canonical request, report,
 * spatial evidence, and the request-bound inspection requirement before it
 * derives the inspection result and seals one immutable Caption owner result.
 * No Caption dispatcher or provider call exists here.
 */
export function createCanonicalCaptionPostrenderVisualIntelligenceOwnerService(
  input: CanonicalCaptionPostrenderVisualIntelligenceOwnerDependencies,
) {
  assertDependencies(input)
  return Object.freeze({
    serviceVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_SERVICE_VERSION,
    async finalize(
      value: FinalizeCanonicalCaptionPostrenderVisualIntelligenceInput,
    ) {
      assertClosedContractTree(value,
        'Caption post-render Visual Intelligence finalization input')
      const parsed = finalizeInputSchema.parse(value)
      const [requestValue, requirementValue, reportValue, spatialValue] =
        await Promise.all([
          input.requestPackageStore.rereadCanonicalRequestByRef({
            requestRef: parsed.requestRef,
          }),
          input.requestPackageStore.rereadInspectionRequirementByRequestRef({
            requestRef: parsed.requestRef,
          }),
          input.reportRepository.readAcceptedByRef(parsed.reportRef),
          input.spatialEvidenceRepository
            .readAcceptedSpatialEvidenceByReportRef(parsed.reportRef),
        ])
      if (!requestValue || !requirementValue || !reportValue || !spatialValue) {
        throw notReady('caption_postrender_visual_intelligence_evidence_missing')
      }
      const request = parseVisualIntelligenceRequest(requestValue)
      const requirement = parseVisualInspectionRequirement(requirementValue)
      const report = parseVisualIntelligenceReport(reportValue)
      const spatialEvidence = parseVisualIntelligenceSpatialEvidence(
        spatialValue)
      if (!sameRef(parsed.requestRef, requestRef(request))
        || !sameRef(parsed.reportRef, reportRef(report))
        || !sameRef(parsed.spatialEvidenceRef, spatialRef(spatialEvidence))) {
        throw conflict('caption_postrender_visual_intelligence_ref_mismatch')
      }
      const inspectionResult = deriveInspectionResult(requirement, report)
      const result =
        createCanonicalCaptionPostrenderVisualIntelligenceResult({
          resultId: parsed.resultId,
          approvedSnapshotRef: parsed.approvedSnapshotRef,
          executionPackageRef: parsed.executionPackageRef,
          approvedWorkItemRef: parsed.approvedWorkItemRef,
          deterministicCompleteTimeQaRef:
            parsed.deterministicCompleteTimeQaRef,
          independentArtifactQaRef: parsed.independentArtifactQaRef,
          assetManifestReconciliationRef:
            parsed.assetManifestReconciliationRef,
          confirmedOutputFrameBindingDigestSha256:
            parsed.confirmedOutputFrameBindingDigestSha256,
          captionConfirmedOutputFrameRef:
            parsed.captionConfirmedOutputFrameRef,
          confirmationRecordId: parsed.confirmationRecordId,
          requirement,
          request,
          report,
          spatialEvidence,
          inspectionResult,
          deterministicAndSemanticEvidenceAgree:
            parsed.deterministicAndSemanticEvidenceAgree,
          exactApprovedPrivateRenderRereadVerified:
            parsed.exactApprovedPrivateRenderRereadVerified,
        })
      const persisted = await input.ownerResultRepository
        .persistOwnerResultCreateOnly(result)
      return Object.freeze({
        result,
        ...persisted,
        providerCallMadeByFinalizer: false as const,
        timelineOrAssetMutationPerformed: false as const,
        qaApprovalGranted: false as const,
        repairExecutionGranted: false as const,
        billingOrPublicAuthorityGranted: false as const,
      })
    },
  })
}

function deriveInspectionResult(
  requirement: ReturnType<typeof parseVisualInspectionRequirement>,
  report: ReturnType<typeof parseVisualIntelligenceReport>,
) {
  const needsRepair = report.disposition === 'needs_revision'
  const blocked = report.disposition === 'blocked'
  const exhausted = needsRepair && requirement.currentRepairCycle >= 2
  const blocks = needsRepair || blocked
  return createVisualInspectionResult({
    schemaVersion: 'visual-inspection-result-v1',
    inspectionRef: {
      id: requirement.inspectionId,
      version: 1,
      contentHash: requirement.inspectionDigestSha256,
    },
    reportRef: reportRef(report),
    disposition: report.disposition,
    owningSkillId: requirement.owningSkillId,
    findingIds: report.findings.map((finding) => finding.findingId),
    repairCycle: requirement.currentRepairCycle,
    routeToOwningSkill: needsRepair,
    automaticRepairAllowed: needsRepair && !exhausted,
    automaticSpendStopped: blocked || exhausted,
    blocksNextWorkNode: blocks && requirement.blocksNextWorkNode,
    blocksPreview: blocks && requirement.blocksPreview,
    blocksFinalExport: blocks && requirement.blocksFinalExport,
    planningOrHumanReviewRequired: blocked || exhausted,
    visualIntelligenceMutatedEdit: false,
  })
}

function requestRef(value: ReturnType<typeof parseVisualIntelligenceRequest>) {
  return { id: value.requestId, version: 1,
    contentHash: value.requestDigestSha256 }
}

function reportRef(value: ReturnType<typeof parseVisualIntelligenceReport>) {
  return { id: value.reportId, version: 1,
    contentHash: value.reportDigestSha256 }
}

function spatialRef(
  value: ReturnType<typeof parseVisualIntelligenceSpatialEvidence>,
) {
  return { id: value.spatialEvidenceId, version: 1,
    contentHash: value.spatialEvidenceDigestSha256 }
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(
  input: CanonicalCaptionPostrenderVisualIntelligenceOwnerDependencies,
): void {
  if (typeof input.requestPackageStore.rereadCanonicalRequestByRef !== 'function'
    || typeof input.requestPackageStore
      .rereadInspectionRequirementByRequestRef !== 'function'
    || typeof input.reportRepository.readAcceptedByRef !== 'function'
    || typeof input.spatialEvidenceRepository
      .readAcceptedSpatialEvidenceByReportRef !== 'function'
    || typeof input.ownerResultRepository
      .persistOwnerResultCreateOnly !== 'function') {
    throw notReady('caption_postrender_visual_intelligence_owner_invalid')
  }
}

function notReady(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical Caption post-render Visual Intelligence owner is not ready.',
    503,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Caption post-render Visual Intelligence evidence conflicts with immutable authority.',
    409,
    { reason },
  )
}
