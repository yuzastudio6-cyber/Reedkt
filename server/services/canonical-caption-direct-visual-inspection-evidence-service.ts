import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_EVIDENCE_VERSION,
  CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_REPOSITORY_VERSION,
  type CanonicalCaptionDirectVisualInspectionEvidence,
  type CanonicalCaptionDirectVisualInspectionRepository,
} from '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
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
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  outputId: safeKey,
}).strict()
const evidenceSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_EVIDENCE_VERSION),
  evidenceId: safeKey,
  evidenceDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  sourceMediaAuthorityRef: refSchema,
  sourceMediaBindingRefs: z.array(refSchema).min(1).max(1_000),
  inspectionArtifactSetRef: refSchema,
  coverage: z.object({
    renderedFrameCount: z.number().int().positive().max(10_000_000),
    representedFrameCount: z.number().int().positive().max(10_000_000),
    contactSheetCount: z.number().int().positive().max(100_000),
    originalResolutionSpotCheckCount:
      z.number().int().min(4).max(10_000),
    everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
    contactSheetCoverageComplete: z.literal(true),
    originalResolutionTransitionAndTailChecksComplete: z.literal(true),
    completeMotionPlaybackClaimed: z.literal(false),
  }).strict(),
  findings: z.object({
    faceObstructionObserved: z.literal(false),
    gestureObstructionObserved: z.literal(false),
    captionClippingObserved: z.literal(false),
    phraseOverflowObserved: z.literal(false),
    inaccessibleReadingStateObserved: z.literal(false),
    importantSourceTextCollisionObserved: z.literal(false),
    unstablePlacementObserved: z.literal(false),
    unusableCueTransitionObserved: z.literal(false),
    tailTruncationObserved: z.literal(false),
    unprofessionalVisualTreatmentObserved: z.literal(false),
  }).strict(),
  inspectionMethod: z.literal(
    'every_rendered_frame_contact_sheets_plus_original_resolution_checks_v1'),
  inspectorClass: z.literal('codex_agent_direct_visual_inspection'),
  disposition: z.literal('passed_caption_owned_professional_appearance'),
  realUploadedSourcePixelsInspected: z.literal(true),
  syntheticEngineeringFixtureUsed: z.literal(false),
  acceptedForCaptionOwnedProfessionalAppearance: z.literal(true),
  exactApprovedRenderAndSourceAuthorityBound: z.literal(true),
  deterministicTechnicalQaReplaced: z.literal(false),
  sharedPostrenderModelReviewClaimed: z.literal(false),
  independentFinalQaClaimed: z.literal(false),
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
const readSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  renderedArtifactRef: refSchema,
}).strict()
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/direct-visual-inspection'
const MAX_RECORD_BYTES = 32 * 1024 * 1024
const admittedRepositories = new WeakSet<object>()

type EvidenceInput = Omit<CanonicalCaptionDirectVisualInspectionEvidence,
  'schemaVersion' | 'evidenceDigestSha256'>

export function createCanonicalCaptionDirectVisualInspectionEvidence(
  input: EvidenceInput,
): CanonicalCaptionDirectVisualInspectionEvidence {
  assertClosedContractTree(input,
    'Canonical Caption direct visual-inspection input')
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_EVIDENCE_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionDirectVisualInspectionEvidence({
    ...withoutDigest,
    evidenceDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      evidenceDigestSha256: '',
    }, 'evidenceDigestSha256'),
  })
}

export function parseCanonicalCaptionDirectVisualInspectionEvidence(
  value: unknown,
): CanonicalCaptionDirectVisualInspectionEvidence {
  assertClosedContractTree(value,
    'Canonical Caption direct visual-inspection evidence')
  rejectUnsafeText(value)
  const parsed = evidenceSchema.parse(value) as
    CanonicalCaptionDirectVisualInspectionEvidence
  const bindingKeys = parsed.sourceMediaBindingRefs.map(refKey)
  if (parsed.evidenceDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'evidenceDigestSha256')
    || parsed.coverage.representedFrameCount !==
      parsed.coverage.renderedFrameCount
    || new Set(bindingKeys).size !== bindingKeys.length
    || bindingKeys.join('|') !== [...bindingKeys].sort(compareUtf16).join('|')
    || refKey(parsed.renderedArtifactRef) ===
      refKey(parsed.inspectionArtifactSetRef)) {
    throw new Error(
      'Canonical Caption direct visual-inspection evidence invalid.')
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionDirectVisualInspectionRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionDirectVisualInspectionRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_DIRECT_VISUAL_INSPECTION_REPOSITORY_VERSION,
    async persistEvidenceCreateOnly(untrusted: unknown) {
      const evidence = parseCanonicalCaptionDirectVisualInspectionEvidence(
        z.object({ evidence: z.unknown() }).strict().parse(untrusted).evidence)
      const body = serialize(evidence)
      const path = evidencePath(prefix, {
        ownerUserId: evidence.canonicalScope.ownerUserId,
        workspaceId: evidence.canonicalScope.workspaceId,
        approvedSnapshotRef: evidence.canonicalScope.approvedSnapshotRef,
        outputId: evidence.canonicalScope.outputId,
        renderedArtifactRef: evidence.renderedArtifactRef,
      })
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readExact(input.objectPort, path)
      if (!reread || !sameCanonical(reread, evidence)) {
        throw new Error(
          'Canonical Caption direct visual-inspection persistence conflict.')
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
        || refKey(evidence.canonicalScope.approvedSnapshotRef) !==
          refKey(read.approvedSnapshotRef)
        || evidence.canonicalScope.outputId !== read.outputId
        || refKey(evidence.renderedArtifactRef) !==
          refKey(read.renderedArtifactRef)) {
        throw new Error(
          'Canonical Caption direct visual-inspection evidence crossed scope.')
      }
      return evidence
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function isCanonicalCaptionDirectVisualInspectionRepository(
  value: unknown,
): value is CanonicalCaptionDirectVisualInspectionRepository {
  return Boolean(value && typeof value === 'object'
    && admittedRepositories.has(value as object))
}

function evidencePath(
  prefix: string,
  read: {
    ownerUserId: string
    workspaceId: string
    approvedSnapshotRef: CaptionDomainRef
    outputId: string
    renderedArtifactRef: CaptionDomainRef
  },
): string {
  const digest = createHash('sha256').update(JSON.stringify({
    ownerUserId: read.ownerUserId,
    workspaceId: read.workspaceId,
    approvedSnapshotRef: read.approvedSnapshotRef,
    outputId: read.outputId,
    renderedArtifactRef: read.renderedArtifactRef,
  }), 'utf8').digest('hex')
  return `${prefix}/${digest}.json`
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<CanonicalCaptionDirectVisualInspectionEvidence | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption direct visual-inspection bytes invalid.')
  }
  try {
    return parseCanonicalCaptionDirectVisualInspectionEvidence(
      JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    throw new Error(
      'Canonical Caption direct visual-inspection reread invalid.', {
        cause: error,
      })
  }
}

function serialize(
  evidence: CanonicalCaptionDirectVisualInspectionEvidence,
): Buffer {
  const body = Buffer.from(JSON.stringify(evidence), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption direct visual-inspection record size invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption direct visual-inspection object port invalid.')
  }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function rejectUnsafeText(value: unknown): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(
          'Canonical Caption direct visual-inspection evidence contains unsafe text.')
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}
