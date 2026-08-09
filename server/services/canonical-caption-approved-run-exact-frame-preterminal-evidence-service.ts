import { createHash } from 'node:crypto'

import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_EVIDENCE_VERSION,
  CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_REPOSITORY_VERSION,
  type CanonicalCaptionApprovedRunExactFramePreterminalEvidence,
  type CanonicalCaptionApprovedRunExactFramePreterminalRepository,
} from '../../src/types/canonical-caption-approved-run-exact-frame-preterminal-evidence'
import {
  parseClosedCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
} from '../captions-specialist/caption-broll-approved-run-exact-frame-professional-inspection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const rangeSchema = z.object({
  startFrame: z.literal(0),
  endFrameExclusive: z.literal(127),
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  sceneId: safeKey,
  authorizedFrameRanges: z.array(rangeSchema).length(1),
}).strict()
const preterminalOutputSchema = z.object({
  variant: z.enum(['full_motion', 'reduced_motion']),
  exactFrameReviewRef: refSchema,
  renderedArtifactRef: refSchema,
  everyFrameContactSheetRef: refSchema,
  exactResolutionRasterRefs: z.tuple([
    refSchema, refSchema, refSchema, refSchema, refSchema,
  ]),
  transitionRasterRefs: z.tuple([
    refSchema, refSchema, refSchema, refSchema,
  ]),
  width: z.literal(3_840),
  height: z.literal(2_160),
  fps: z.literal(30),
  frameCount: z.literal(127),
  everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
  originalResolutionEntranceHoldTransitionAndTailChecksComplete:
    z.literal(true),
}).strict()
const evidenceSchema:
z.ZodType<CanonicalCaptionApprovedRunExactFramePreterminalEvidence> =
z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_EVIDENCE_VERSION),
  evidenceId: safeKey,
  evidenceDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  approvedRunInspectionPackageRef: refSchema,
  exactFrameInspectionReceiptRef: refSchema,
  exactFrameInspectionPackageRef: refSchema,
  sourceProxyReviewPackageRef: refSchema,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  sourceMediaRef: refSchema,
  baselinePreviewRef: refSchema,
  outputs: z.tuple([
    preterminalOutputSchema.extend({
      variant: z.literal('full_motion'),
    }).strict(),
    preterminalOutputSchema.extend({
      variant: z.literal('reduced_motion'),
    }).strict(),
  ]),
  approvedRunCoverage: z.object({
    approvedCaptionJobCount: z.literal(17),
    captionSupportResumeCount: z.literal(1),
    approvedBrollWorkItemCount: z.literal(13),
    canonicalCaptionReplayVerified: z.literal(true),
    canonicalBrollRestartReplayVerified: z.literal(true),
    exactFrameVariantCount: z.literal(2),
    exactFrameRenderedFrameCount: z.literal(254),
    exactFrameEveryFrameInspectionComplete: z.literal(true),
    exactFrameOriginalResolutionSpotChecksComplete: z.literal(true),
    fullReducedMotionSemanticParityInspected: z.literal(true),
  }).strict(),
  evidenceClass: z.literal(
    'approved_run_exact_frame_typography_layout_preterminal'),
  disposition: z.literal('accepted_preterminal_evidence'),
  firstRemainingGateCode: z.literal(
    'postrender_visual_intelligence_evidence_missing'),
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: z.literal(true),
  sameApprovedSnapshotExecutionPackageOutputAndSourceBound: z.literal(true),
  sourceProxyUpscaleDisclosed: z.literal(true),
  sourcePictureQualityQualified: z.literal(false),
  completeMotionPlaybackInspectionPerformed: z.literal(false),
  finalCustomerCanvasClaimed: z.literal(false),
  terminalRunEvidenceEligible: z.literal(false),
  wholeSkillPrivateInternalQualificationClaimed: z.literal(false),
  qualifiedSharedPostrenderAiReviewClaimed: z.literal(false),
  independentFinalQaClaimed: z.literal(false),
  terminalEvidenceAssemblySatisfied: z.literal(false),
  callerSuppliedCompletionAccepted: z.literal(false),
  browserLocalCompletionClaimed: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  localPathsOrUrlsSerialized: z.literal(false),
  rawChatOrCredentialsSerialized: z.literal(false),
  providerCallMadeByCaption: z.literal(false),
  operationDispatchAuthorityGranted: z.literal(false),
  repairExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const rasterFixtureSchema = z.object({
  frameIndex: z.number().int().min(0).max(126),
  fileName: safeKey,
  sha256,
}).strict()
const approvedRunInspectionPackageSchema = z.object({
  schemaVersion: z.literal(
    'caption-broll-approved-execution-inspection-package-v3'),
  sourceEvidenceMode: z.literal('real_private_media'),
  sourceSha256: sha256,
  approvedSnapshotRef: refSchema,
  captionApprovedJobCount: z.literal(17),
  captionSupportResumeCount: z.literal(1),
  brollApprovedWorkItemCount: z.literal(13),
  canonicalCaptionReplayVerified: z.literal(true),
  canonicalBrollRestartReplayVerified: z.literal(true),
  captionOverlaySha256: sha256,
  previewSha256: sha256,
  previewFrameCount: z.literal(127),
  previewFps: z.literal(30),
  contactSheet: z.object({
    fileName: safeKey,
    sha256,
    representsEveryFrame: z.literal(true),
  }).strict(),
  sampleFrames: z.array(rasterFixtureSchema).length(5),
  captionSampleStrips: z.array(rasterFixtureSchema).length(5),
  captionPixelCoverage: z.object({
    crop: z.object({
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }).strict(),
    expectedVisiblePixelCount: z.number().int().positive(),
    minimumCoverageBasisPoints: z.number().int().min(0).max(10_000),
    maximumCoverageBasisPoints: z.number().int().min(0).max(10_000),
    everyFrameCoverageVerified: z.literal(true),
  }).strict(),
  qualificationReadiness: z.object({
    id: safeKey,
    version: z.literal('canonical-caption-qualification-run-readiness-v1'),
    contentHash: sha256,
    disposition: z.literal('blocked_missing_canonical_evidence'),
    firstBlockerCode: z.literal(
      'postrender_visual_intelligence_evidence_missing'),
    terminalStatusClaimed: z.literal(false),
  }).strict(),
  structuralVisualIntelligenceFixtureExcludedFromQualification:
    z.literal(true),
  directRasterInspectionRequired: z.literal(true),
  providerCalled: z.literal(false),
  publicDeliveryCreated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  packageSha256: sha256,
}).strict()
const readSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  exactFrameInspectionReceiptRef: refSchema,
}).strict()
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/approved-run-exact-frame-preterminal'
const MAX_RECORD_BYTES = 32 * 1024 * 1024
const admittedRepositories = new WeakSet<object>()

export function createCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
  input: {
    readonly evidenceId: string
    readonly approvedRunInspectionPackage: unknown
    readonly exactFrameInspectionReceipt: unknown
  },
): CanonicalCaptionApprovedRunExactFramePreterminalEvidence {
  assertClosedContractTree(input,
    'Canonical Caption approved-run preterminal input')
  const runPackage = parseApprovedRunInspectionPackage(
    input.approvedRunInspectionPackage)
  const receipt =
    parseClosedCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
      input.exactFrameInspectionReceipt)
  if (!sameRef(runPackage.approvedSnapshotRef, receipt.approvedSnapshotRef)) {
    throw new Error(
      'Canonical Caption approved-run preterminal snapshot crossed evidence.')
  }
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_EVIDENCE_VERSION,
    evidenceId: safeKey.parse(input.evidenceId),
    observedAt: receipt.observedAt,
    canonicalScope: structuredClone(receipt.canonicalScope) as
      CanonicalCaptionApprovedRunExactFramePreterminalEvidence[
        'canonicalScope'],
    approvedRunInspectionPackageRef: ref(
      'caption.broll.approved-run.execution.inspection.package',
      runPackage.schemaVersion,
      runPackage.packageSha256),
    exactFrameInspectionReceiptRef: ref(
      receipt.receiptId,
      receipt.schemaVersion,
      receipt.receiptDigestSha256),
    exactFrameInspectionPackageRef: structuredClone(
      receipt.exactFrameInspectionPackageRef),
    sourceProxyReviewPackageRef: structuredClone(
      receipt.sourceProxyReviewPackageRef),
    approvedSnapshotRef: structuredClone(receipt.approvedSnapshotRef),
    executionPackageRef: structuredClone(receipt.executionPackageRef),
    confirmedOutputFrameRef: structuredClone(receipt.confirmedOutputFrameRef),
    sourceMediaRef: ref(
      `caption.broll.approved-run.source-media.${
        runPackage.sourceSha256.slice(0, 24)}`,
      'private-source-media-sha256-v1',
      runPackage.sourceSha256),
    baselinePreviewRef: ref(
      `caption.broll.approved-run.baseline-preview.${
        runPackage.previewSha256.slice(0, 24)}`,
      'private-review-mp4-v1',
      runPackage.previewSha256),
    outputs: receipt.outputs.map((output) => ({
      variant: output.variant,
      exactFrameReviewRef: structuredClone(output.exactFrameReviewRef),
      renderedArtifactRef: structuredClone(output.renderArtifactRef),
      everyFrameContactSheetRef: structuredClone(
        output.everyFrameContactSheet.rasterRef),
      exactResolutionRasterRefs: output.exactResolutionSpotChecks.map(
        (item) => structuredClone(item.rasterRef)),
      transitionRasterRefs: output.transitionSpotChecks.map(
        (item) => structuredClone(item.rasterRef)),
      width: 3_840 as const,
      height: 2_160 as const,
      fps: 30 as const,
      frameCount: 127 as const,
      everyRenderedFrameRepresentedExactlyOnce: true as const,
      originalResolutionEntranceHoldTransitionAndTailChecksComplete:
        true as const,
    })) as CanonicalCaptionApprovedRunExactFramePreterminalEvidence[
      'outputs'],
    approvedRunCoverage: {
      approvedCaptionJobCount: 17 as const,
      captionSupportResumeCount: 1 as const,
      approvedBrollWorkItemCount: 13 as const,
      canonicalCaptionReplayVerified: true as const,
      canonicalBrollRestartReplayVerified: true as const,
      exactFrameVariantCount: 2 as const,
      exactFrameRenderedFrameCount: 254 as const,
      exactFrameEveryFrameInspectionComplete: true as const,
      exactFrameOriginalResolutionSpotChecksComplete: true as const,
      fullReducedMotionSemanticParityInspected: true as const,
    },
    evidenceClass:
      'approved_run_exact_frame_typography_layout_preterminal' as const,
    disposition: 'accepted_preterminal_evidence' as const,
    firstRemainingGateCode:
      'postrender_visual_intelligence_evidence_missing' as const,
    acceptedForCaptionOwnedExactFrameTypographyAndLayout: true as const,
    sameApprovedSnapshotExecutionPackageOutputAndSourceBound: true as const,
    sourceProxyUpscaleDisclosed: true as const,
    sourcePictureQualityQualified: false as const,
    completeMotionPlaybackInspectionPerformed: false as const,
    finalCustomerCanvasClaimed: false as const,
    terminalRunEvidenceEligible: false as const,
    wholeSkillPrivateInternalQualificationClaimed: false as const,
    qualifiedSharedPostrenderAiReviewClaimed: false as const,
    independentFinalQaClaimed: false as const,
    terminalEvidenceAssemblySatisfied: false as const,
    callerSuppliedCompletionAccepted: false as const,
    browserLocalCompletionClaimed: false as const,
    mediaBytesSerialized: false as const,
    localPathsOrUrlsSerialized: false as const,
    rawChatOrCredentialsSerialized: false as const,
    providerCallMadeByCaption: false as const,
    operationDispatchAuthorityGranted: false as const,
    repairExecutionAuthorityGranted: false as const,
    assetMutationAuthorityGranted: false as const,
    finalQaApprovalGranted: false as const,
    billingAuthorityGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence({
    ...withoutDigest,
    evidenceDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      evidenceDigestSha256: '',
    }, 'evidenceDigestSha256'),
  })
}

export function parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
  value: unknown,
): CanonicalCaptionApprovedRunExactFramePreterminalEvidence {
  assertClosedContractTree(value,
    'Canonical Caption approved-run exact-frame preterminal evidence')
  rejectUnsafeText(value)
  const parsed = evidenceSchema.parse(value)
  const allRefKeys = parsed.outputs.flatMap((output) => [
    refKey(output.exactFrameReviewRef),
    refKey(output.renderedArtifactRef),
    refKey(output.everyFrameContactSheetRef),
    ...output.exactResolutionRasterRefs.map(refKey),
    ...output.transitionRasterRefs.map(refKey),
  ])
  if (parsed.evidenceDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'evidenceDigestSha256')
    || !sameRef(parsed.canonicalScope.approvedSnapshotRef,
      parsed.approvedSnapshotRef)
    || parsed.canonicalScope.outputId.length === 0
    || new Set(allRefKeys).size !== allRefKeys.length
    || sameRef(parsed.outputs[0].renderedArtifactRef,
      parsed.outputs[1].renderedArtifactRef)
    || sameRef(parsed.approvedRunInspectionPackageRef,
      parsed.exactFrameInspectionPackageRef)
    || sameRef(parsed.exactFrameInspectionReceiptRef,
      parsed.exactFrameInspectionPackageRef)) {
    throw new Error(
      'Canonical Caption approved-run preterminal evidence invalid.')
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionApprovedRunExactFramePreterminalRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionApprovedRunExactFramePreterminalRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_APPROVED_RUN_EXACT_FRAME_PRETERMINAL_REPOSITORY_VERSION,
    async persistEvidenceCreateOnly(untrusted: unknown) {
      const evidence =
        parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
          z.object({ evidence: z.unknown() }).strict()
            .parse(untrusted).evidence)
      const body = serialize(evidence)
      const path = evidencePath(prefix, {
        ownerUserId: evidence.canonicalScope.ownerUserId,
        workspaceId: evidence.canonicalScope.workspaceId,
        approvedSnapshotRef: evidence.approvedSnapshotRef,
        outputId: evidence.canonicalScope.outputId,
        exactFrameInspectionReceiptRef:
          evidence.exactFrameInspectionReceiptRef,
      })
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readExact(input.objectPort, path)
      if (!reread || !sameCanonical(reread, evidence)) {
        throw new Error(
          'Canonical Caption approved-run preterminal persistence conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadEvidence(untrusted: unknown) {
      const read = readSchema.parse(untrusted)
      const evidence = await readExact(input.objectPort,
        evidencePath(prefix, read))
      if (!evidence) return null
      if (evidence.canonicalScope.ownerUserId !== read.ownerUserId
        || evidence.canonicalScope.workspaceId !== read.workspaceId
        || evidence.canonicalScope.outputId !== read.outputId
        || !sameRef(evidence.approvedSnapshotRef,
          read.approvedSnapshotRef)
        || !sameRef(evidence.exactFrameInspectionReceiptRef,
          read.exactFrameInspectionReceiptRef)) {
        throw new Error(
          'Canonical Caption approved-run preterminal evidence crossed scope.')
      }
      return evidence
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function isCanonicalCaptionApprovedRunExactFramePreterminalRepository(
  value: unknown,
): value is CanonicalCaptionApprovedRunExactFramePreterminalRepository {
  return Boolean(value && typeof value === 'object'
    && admittedRepositories.has(value as object))
}

function parseApprovedRunInspectionPackage(value: unknown):
z.infer<typeof approvedRunInspectionPackageSchema> {
  assertClosedContractTree(value,
    'Caption B-roll approved-run inspection package')
  const parsed = approvedRunInspectionPackageSchema.parse(value)
  const { packageSha256, ...core } = parsed
  if (hashText(JSON.stringify(core)) !== packageSha256
    || parsed.captionPixelCoverage.minimumCoverageBasisPoints
      > parsed.captionPixelCoverage.maximumCoverageBasisPoints
    || parsed.sampleFrames.map((item) => item.frameIndex).join('|')
      !== '0|31|63|94|126'
    || parsed.captionSampleStrips.map((item) => item.frameIndex).join('|')
      !== '0|31|63|94|126') {
    throw new Error(
      'Caption B-roll approved-run inspection package invalid.')
  }
  return structuredClone(parsed)
}

function evidencePath(
  prefix: string,
  read: {
    ownerUserId: string
    workspaceId: string
    approvedSnapshotRef: CaptionDomainRef
    outputId: string
    exactFrameInspectionReceiptRef: CaptionDomainRef
  },
): string {
  return `${prefix}/${hashText(JSON.stringify(read))}.json`
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<CanonicalCaptionApprovedRunExactFramePreterminalEvidence | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption approved-run preterminal bytes invalid.')
  }
  try {
    return parseCanonicalCaptionApprovedRunExactFramePreterminalEvidence(
      JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    throw new Error(
      'Canonical Caption approved-run preterminal reread invalid.', {
        cause: error,
      })
  }
}

function serialize(
  evidence: CanonicalCaptionApprovedRunExactFramePreterminalEvidence,
): Buffer {
  const body = Buffer.from(JSON.stringify(evidence), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption approved-run preterminal record size invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption approved-run preterminal object port invalid.')
  }
}

function ref(id: string, version: string, contentHash: string):
CaptionDomainRef {
  return { id, version, contentHash }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function rejectUnsafeText(value: unknown): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(
          'Canonical Caption approved-run preterminal evidence contains unsafe text.')
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}
