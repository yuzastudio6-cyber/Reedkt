import { z } from 'zod'

import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  type CaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt,
  type CaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseCaptionCanonicalTranscript } from
  './caption-transcript-lineage'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const readScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
}).strict()
const captionScopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(z.object({
    startFrame: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
  }).strict().refine((range) =>
    range.endFrameExclusive > range.startFrame)).min(1).max(512),
}).strict()
const bindingSchema:
z.ZodType<CaptionCanonicalTranscriptAuthenticatedReadBinding> = z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION),
  bindingId: safeKey,
  bindingDigestSha256: sha256,
  ownerKey: z.literal('canonical_transcript'),
  consumerSkillKey: z.literal('captions'),
  artifactType: z.literal('canonical_transcript'),
  canonicalReadScope: readScopeSchema,
  canonicalTranscriptRef: refSchema,
  sourceSpeechEvidencePackageRef: refSchema,
  alignmentQualificationRef: refSchema,
  diarizationArtifactRefs: z.array(refSchema).max(512),
  speakerDiarizationState: z.enum(['not_present', 'complete']),
  persistenceReadReceiptRef: refSchema,
  authenticatedOwnerEvidenceRef: refSchema,
  exactPrivateArtifactRereadVerified: z.literal(true),
  exactTranscriptDigestRecomputed: z.literal(true),
  exactTenantScopeVerified: z.literal(true),
  exactApprovedSnapshotVerified: z.literal(true),
  exactSourceAndAlignmentLineageVerified: z.literal(true),
  exactDiarizationLineageVerified: z.literal(true),
  immutableTranscriptVerified: z.literal(true),
  singleCanonicalTranscriptVerified: z.literal(true),
  privateArtifact: z.literal(true),
  byteFreeBinding: z.literal(true),
  canonicalTranscriptPayloadEmbedded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  transcriptMutationAuthorityGranted: z.literal(false),
  timingAuthorityGranted: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const receiptSchema:
z.ZodType<CaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: sha256,
  transcriptContractVersion:
    z.literal(CAPTION_CANONICAL_TRANSCRIPT_VERSION),
  bindingContractVersion: z.literal(
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION),
  captionParserEntrypointId: z.literal('parseCaptionCanonicalTranscript'),
  authenticatedReadParserEntrypointId: z.literal(
    'parseCaptionCanonicalTranscriptAuthenticatedReadBinding'),
  admissionEntrypointId: z.literal(
    'admitCaptionCanonicalTranscriptFromAuthenticatedRead'),
  initialCallArtifactType: z.literal('canonical_transcript'),
  authenticatedReadEvidenceArtifactType:
    z.literal('canonical_transcript_authenticated_read_binding'),
  initialCallPrerequisite: z.literal(true),
  directPeerDispatchAllowed: z.literal(false),
  transcriptOwnerImplementedByCaption: z.literal(false),
  persistenceReaderImplementedByCaption: z.literal(false),
  authenticatedPrivateResultIntegrated: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const unsafeTextPattern =
  /https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu

function assertNoUnsafeText(value: unknown, label: string): void {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string' && unsafeTextPattern.test(current)) {
      throw new Error(`${label} contains URL, path, or credential-shaped text.`)
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function refKey(ref: { id: string; version: string; contentHash: string }): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function exactRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return refKey(left) === refKey(right)
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function transcriptDiarizationRefs(
  transcript: CaptionCanonicalTranscript,
): CaptionCanonicalTranscriptAuthenticatedReadBinding['diarizationArtifactRefs'] {
  return [...new Map(transcript.words
    .flatMap((word) => word.diarizationArtifactRef === null
      ? [] : [[refKey(word.diarizationArtifactRef), word.diarizationArtifactRef] as const]))
    .entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([, ref]) => structuredClone(ref))
}

export function parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  value: unknown,
): CaptionCanonicalTranscriptAuthenticatedReadBinding {
  assertClosedContractTree(
    value, 'Caption canonical transcript authenticated read binding')
  assertNoUnsafeText(
    value, 'Caption canonical transcript authenticated read binding')
  const binding = bindingSchema.parse(value)
  verifyDigest(binding as unknown as Record<string, unknown>,
    'bindingDigestSha256',
    'Caption canonical transcript authenticated read binding')
  const diarizationKeys = binding.diarizationArtifactRefs.map(refKey)
  if (binding.canonicalTranscriptRef.version
      !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || binding.persistenceReadReceiptRef.version
      !== 'canonical-transcript-authenticated-read-record-v1'
    || binding.authenticatedOwnerEvidenceRef.version
      !== 'canonical-transcript-authenticated-owner-evidence-v1'
    || new Set(diarizationKeys).size !== diarizationKeys.length
    || [...diarizationKeys].sort().join('|') !== diarizationKeys.join('|')
    || (binding.speakerDiarizationState === 'not_present'
      && diarizationKeys.length !== 0)
    || (binding.speakerDiarizationState === 'complete'
      && diarizationKeys.length === 0)) {
    throw new Error(
      'Caption canonical transcript authenticated read semantics are invalid.',
    )
  }
  return structuredClone(binding)
}

export function admitCaptionCanonicalTranscriptFromAuthenticatedRead(input: {
  binding: unknown
  canonicalTranscript: unknown
  expectedCanonicalScope: CaptionDomainCanonicalScope
}): CaptionCanonicalTranscript {
  const binding = parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
    input.binding)
  const transcript = parseCaptionCanonicalTranscript(input.canonicalTranscript)
  assertClosedContractTree(
    input.expectedCanonicalScope, 'Expected Caption transcript read scope')
  assertNoUnsafeText(
    input.expectedCanonicalScope, 'Expected Caption transcript read scope')
  const expected = captionScopeSchema.parse(input.expectedCanonicalScope)
  const expectedDiarizationRefs = transcriptDiarizationRefs(transcript)
  const everyWordHasDiarization = transcript.words.every((word) =>
    word.speakerId !== null && word.diarizationArtifactRef !== null)
  const noWordHasDiarization = transcript.words.every((word) =>
    word.speakerId === null && word.diarizationArtifactRef === null)
  if (expected.approvedSnapshotRef === null
    || binding.canonicalReadScope.ownerUserId !== expected.ownerUserId
    || binding.canonicalReadScope.workspaceId !== expected.workspaceId
    || binding.canonicalReadScope.projectId !== expected.projectId
    || binding.canonicalReadScope.editSessionId !== expected.editSessionId
    || binding.canonicalReadScope.planVersionId !== expected.planVersionId
    || !exactRef(binding.canonicalReadScope.approvedSnapshotRef,
      expected.approvedSnapshotRef)
    || transcript.workspaceId !== expected.workspaceId
    || transcript.projectId !== expected.projectId
    || transcript.editSessionId !== expected.editSessionId
    || !exactRef(binding.canonicalTranscriptRef, {
      id: transcript.transcriptId,
      version: transcript.schemaVersion,
      contentHash: transcript.transcriptDigestSha256,
    })
    || !exactRef(binding.sourceSpeechEvidencePackageRef,
      transcript.sourceSpeechEvidencePackageRef)
    || !exactRef(binding.alignmentQualificationRef,
      transcript.alignmentQualificationRef)
    || binding.diarizationArtifactRefs.map(refKey).join('|')
      !== expectedDiarizationRefs.map(refKey).join('|')
    || (binding.speakerDiarizationState === 'complete'
      && !everyWordHasDiarization)
    || (binding.speakerDiarizationState === 'not_present'
      && !noWordHasDiarization)) {
    throw new Error(
      'Canonical transcript reread does not match the approved Caption scope.',
    )
  }
  return structuredClone(transcript)
}

export function parseCaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt(
  value: unknown,
): CaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt {
  assertClosedContractTree(
    value, 'Caption canonical transcript authenticated read adapter receipt')
  assertNoUnsafeText(
    value, 'Caption canonical transcript authenticated read adapter receipt')
  const receipt = receiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256',
    'Caption canonical transcript authenticated read adapter receipt')
  return structuredClone(receipt)
}

const adapterReceiptWithoutDigest: Omit<
  CaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt,
  'adapterDigestSha256'
> = {
  schemaVersion:
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_VERSION,
  adapterId: 'captions.canonical-transcript.authenticated-read.adapter',
  transcriptContractVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  bindingContractVersion:
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  captionParserEntrypointId: 'parseCaptionCanonicalTranscript',
  authenticatedReadParserEntrypointId:
    'parseCaptionCanonicalTranscriptAuthenticatedReadBinding',
  admissionEntrypointId:
    'admitCaptionCanonicalTranscriptFromAuthenticatedRead',
  initialCallArtifactType: 'canonical_transcript',
  authenticatedReadEvidenceArtifactType:
    'canonical_transcript_authenticated_read_binding',
  initialCallPrerequisite: true,
  directPeerDispatchAllowed: false,
  transcriptOwnerImplementedByCaption: false,
  persistenceReaderImplementedByCaption: false,
  authenticatedPrivateResultIntegrated: false,
  browserLocalCompletionAccepted: false,
  runtimeOrDispatchAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT =
parseCaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt({
  ...adapterReceiptWithoutDigest,
  adapterDigestSha256: calculateSkillContractDigest({
    ...adapterReceiptWithoutDigest,
    adapterDigestSha256: '',
  }, 'adapterDigestSha256'),
})
