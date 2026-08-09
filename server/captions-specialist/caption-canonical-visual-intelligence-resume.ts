import { z } from 'zod'

import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
} from '../../src/types/canonical-specialist-support-resume'
import {
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_VERSION,
  type CaptionCanonicalVisualIntelligenceResumeAdmissionReceipt,
} from '../../src/types/caption-canonical-visual-intelligence-resume'
import type {
  OrchestraSkillJobResult,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionCanonicalSpecialistSupportResumeRecord,
} from './caption-canonical-specialist-resume-read'
import {
  parseCaptionCanonicalVisualIntelligenceEvidenceRecord,
} from './caption-canonical-visual-intelligence-evidence-read'
import { runCaptionsSpecialistJob } from './captions-specialist-runtime'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const receiptSchema:
z.ZodType<CaptionCanonicalVisualIntelligenceResumeAdmissionReceipt> =
z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: rawSha256,
  canonicalEvidenceRecordVersion: z.literal(
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  canonicalResumeRecordVersion: z.literal(
    CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION),
  captionEntrypointId: z.literal(
    'runCaptionCanonicalVisualIntelligenceResumeAdmission'),
  exactCallRequestProjectionArtifactAndResultReplayRequired: z.literal(true),
  onlyCurrentVisualIntelligenceResultInjected: z.literal(true),
  priorOwnerResultsRemainCanonicalInputs: z.literal(true),
  runtimeResultMustMatchPersistedResultDigest: z.literal(true),
  sourceFixtureExercised: z.literal(true),
  actualBackendRecordPairConsumed: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  providerCallAuthorityGranted: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function exactRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function resultRef(result: OrchestraSkillJobResult): SkillContractRef {
  return {
    id: result.resultId,
    version: result.schemaVersion,
    contentHash: result.resultDigestSha256,
  }
}

export function runCaptionCanonicalVisualIntelligenceResumeAdmission(input: {
  canonicalResumeRecord: unknown
  canonicalVisualIntelligenceEvidenceRecord: unknown
}): OrchestraSkillJobResult {
  assertClosedContractTree(
    input, 'Caption canonical Visual Intelligence resume admission input')
  const resumeRecord =
    parseCaptionCanonicalSpecialistSupportResumeRecord(
      input.canonicalResumeRecord)
  const evidenceRecord =
    parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
      input.canonicalVisualIntelligenceEvidenceRecord)
  if (resumeRecord.authenticatedOwnerProjection.ownerKey
      !== 'visual_intelligence'
    || resumeRecord.authenticatedOwnerProjection.projectionId
      !== evidenceRecord.authenticatedOwnerProjection.projectionId
    || resumeRecord.authenticatedOwnerProjection.projectionDigestSha256
      !== evidenceRecord.authenticatedOwnerProjection.projectionDigestSha256
    || !exactRef(
      {
        id: resumeRecord.selectedSupportRequest.requestId,
        version: resumeRecord.selectedSupportRequest.schemaVersion,
        contentHash:
          resumeRecord.selectedSupportRequest.requestDigestSha256,
      },
      evidenceRecord.supportRequestRef)
    || !exactRef(
      resumeRecord.authenticatedOwnerProjection.ownerResultRef,
      evidenceRecord.authenticatedReadResultRef)
    || resumeRecord.authenticatedOwnerProjection.artifactRefs.length !== 1
    || evidenceRecord.authenticatedOwnerProjection.artifactRefs.length !== 1
    || !exactRef(
      resumeRecord.authenticatedOwnerProjection.artifactRefs[0],
      evidenceRecord.authenticatedOwnerProjection.artifactRefs[0])) {
    throw new Error(
      'Caption canonical Visual Intelligence resume records are crossed.')
  }
  const replayedResult = runCaptionsSpecialistJob({
    call: resumeRecord.resumedCall,
    resumeSupportRequest: resumeRecord.selectedSupportRequest,
    canonicalVisualIntelligenceEvidenceRecord: evidenceRecord,
  })
  if (replayedResult.resultDigestSha256
      !== resumeRecord.resumedResult.resultDigestSha256
    || !exactRef(resultRef(replayedResult), resultRef(
      resumeRecord.resumedResult))) {
    throw new Error(
      'Caption canonical Visual Intelligence replay changed its persisted result.')
  }
  return structuredClone(replayedResult)
}

export function parseCaptionCanonicalVisualIntelligenceResumeAdmissionReceipt(
  value: unknown,
): CaptionCanonicalVisualIntelligenceResumeAdmissionReceipt {
  assertClosedContractTree(
    value, 'Caption canonical Visual Intelligence resume admission receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.receiptDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256')) {
    throw new Error(
      'Caption canonical Visual Intelligence resume receipt is stale.')
  }
  return structuredClone(receipt)
}

const receiptWithoutDigest: Omit<
  CaptionCanonicalVisualIntelligenceResumeAdmissionReceipt,
  'receiptDigestSha256'
> = {
  schemaVersion:
    CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_VERSION,
  receiptId: 'captions.canonical.visual-intelligence.resume-admission',
  canonicalEvidenceRecordVersion:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  canonicalResumeRecordVersion:
    CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
  captionEntrypointId:
    'runCaptionCanonicalVisualIntelligenceResumeAdmission',
  exactCallRequestProjectionArtifactAndResultReplayRequired: true,
  onlyCurrentVisualIntelligenceResultInjected: true,
  priorOwnerResultsRemainCanonicalInputs: true,
  runtimeResultMustMatchPersistedResultDigest: true,
  sourceFixtureExercised: true,
  actualBackendRecordPairConsumed: false,
  directPeerDispatchAdded: false,
  providerCallAuthorityGranted: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_VISUAL_INTELLIGENCE_RESUME_ADMISSION_RECEIPT =
  parseCaptionCanonicalVisualIntelligenceResumeAdmissionReceipt({
    ...receiptWithoutDigest,
    receiptDigestSha256: calculateSkillContractDigest({
      ...receiptWithoutDigest,
      receiptDigestSha256: '',
    }, 'receiptDigestSha256'),
  })
