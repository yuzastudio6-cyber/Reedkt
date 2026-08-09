import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION,
  type CanonicalCaptionIncomingSupportRequestReadPort,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_ADMISSION_VERSION,
  CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_REPOSITORY_VERSION,
  type CanonicalCaptionIncomingSupportRequestAdmission,
  type CanonicalCaptionIncomingSupportRequestRepository,
} from '../../src/types/canonical-caption-incoming-support-request'
import {
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  type CaptionsSupportJobType,
} from '../../src/types/captions-specialist'
import type { OrchestraSkillCall } from
  '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import { stableAuthorityStringify } from './private-edit-authority-store'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

const admittedReadPorts = new WeakSet<object>()
const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/incoming-support-request'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const admissionEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_ADMISSION_VERSION),
  admissionId: safeKey,
  admissionDigestSha256: sha256,
  requestRef: refSchema,
  originalCallRef: refSchema,
  request: z.unknown(),
  originalCall: z.unknown(),
  admittedAt: timestamp,
  exactRequestAndOriginalCallRereadRequired: z.literal(true),
  requestIsHqMediatedAndTargetsCaption: z.literal(true),
  requestScopeMayOnlyGainApprovedSnapshotFromCanonicalWork: z.literal(true),
  callerSuppliedExecutionEvidenceAccepted: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  runtimeExecutionPerformed: z.literal(false),
  assetMutationPerformed: z.literal(false),
  costOrBillingMutationPerformed: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export function createCanonicalCaptionIncomingSupportRequestReadPort(
  readExact: CanonicalCaptionIncomingSupportRequestReadPort['readExact'],
): CanonicalCaptionIncomingSupportRequestReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption incoming-support reader is required.')
  }
  const port: CanonicalCaptionIncomingSupportRequestReadPort = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_specialist_support_request',
    callerSuppliedRequestAccepted: false,
    readExact: readExact.bind(undefined),
  })
  admittedReadPorts.add(port)
  return port
}

export function isCanonicalCaptionIncomingSupportRequestReadPort(
  value: unknown,
): value is CanonicalCaptionIncomingSupportRequestReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedReadPorts.has(value as object))
}

export function createCanonicalCaptionIncomingSupportRequestAdmission(input: {
  readonly request: SkillSupportRequestV2
  readonly originalCall: OrchestraSkillCall
  readonly admittedAt: string
}): CanonicalCaptionIncomingSupportRequestAdmission {
  assertClosedContractTree(input,
    'Canonical Caption incoming-support admission input')
  const request = parseSkillSupportRequestV2(input.request)
  const originalCall = parseOrchestraSkillCall(input.originalCall)
  assertRequestAgainstOriginalCall(request, originalCall)
  const requestRef = supportRequestRef(request)
  const originalCallRef = callRef(originalCall)
  const withoutDigest: Omit<
    CanonicalCaptionIncomingSupportRequestAdmission,
    'admissionDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_ADMISSION_VERSION,
    admissionId: `caption.incoming-support.${
      request.requestDigestSha256.slice(0, 40)}`,
    requestRef,
    originalCallRef,
    request: structuredClone(request),
    originalCall: structuredClone(originalCall),
    admittedAt: timestamp.parse(input.admittedAt),
    exactRequestAndOriginalCallRereadRequired: true,
    requestIsHqMediatedAndTargetsCaption: true,
    requestScopeMayOnlyGainApprovedSnapshotFromCanonicalWork: true,
    callerSuppliedExecutionEvidenceAccepted: false,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    providerCallPerformed: false,
    runtimeExecutionPerformed: false,
    assetMutationPerformed: false,
    costOrBillingMutationPerformed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCanonicalCaptionIncomingSupportRequestAdmission({
    ...withoutDigest,
    admissionDigestSha256: calculateSkillContractDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'admissionDigestSha256',
    ),
  })
}

export function parseCanonicalCaptionIncomingSupportRequestAdmission(
  value: unknown,
): CanonicalCaptionIncomingSupportRequestAdmission {
  assertClosedContractTree(value,
    'Canonical Caption incoming-support admission')
  const envelope = admissionEnvelopeSchema.parse(value)
  const request = parseSkillSupportRequestV2(envelope.request)
  const originalCall = parseOrchestraSkillCall(envelope.originalCall)
  const parsed: CanonicalCaptionIncomingSupportRequestAdmission = {
    ...envelope,
    request,
    originalCall,
  }
  assertRequestAgainstOriginalCall(request, originalCall)
  if (!sameRef(parsed.requestRef, supportRequestRef(request))
    || !sameRef(parsed.originalCallRef, callRef(originalCall))
    || parsed.admissionId !== `caption.incoming-support.${
      request.requestDigestSha256.slice(0, 40)}`
    || parsed.admissionDigestSha256 !== calculateSkillContractDigest(
      parsed as unknown as Record<string, unknown>,
      'admissionDigestSha256',
    )) {
    throw new Error(
      'Canonical Caption incoming-support admission lineage or digest failed.',
    )
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionIncomingSupportRequestRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionIncomingSupportRequestRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const rereadExact = async (requestRef: {
    id: string
    version: string
    contentHash: string
  }): Promise<CanonicalCaptionIncomingSupportRequestAdmission | null> => {
    const expectedRef = refSchema.parse(requestRef)
    const body = await input.objectPort.readExact(
      admissionPath(prefix, expectedRef),
    )
    if (body === null) return null
    if (!(body instanceof Uint8Array)
      || body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new Error(
        'Canonical Caption incoming-support admission bytes are invalid.',
      )
    }
    let value: unknown
    try {
      value = JSON.parse(Buffer.from(body).toString('utf8'))
    } catch (error) {
      throw new Error(
        'Canonical Caption incoming-support admission JSON is invalid.',
        { cause: error },
      )
    }
    const admission =
      parseCanonicalCaptionIncomingSupportRequestAdmission(value)
    if (!sameRef(admission.requestRef, expectedRef)) {
      throw new Error(
        'Canonical Caption incoming-support admission crossed its request.',
      )
    }
    return admission
  }
  const readPort = createCanonicalCaptionIncomingSupportRequestReadPort(
    async ({ requestRef }) => {
      const admission = await rereadExact(requestRef)
      return admission === null ? null : {
        request: structuredClone(admission.request),
        originalCall: structuredClone(admission.originalCall),
      }
    },
  )
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_REPOSITORY_VERSION,
    readPort,
    async persistCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption incoming-support admission write')
      const admission = parseCanonicalCaptionIncomingSupportRequestAdmission(
        z.object({ admission: z.unknown() }).strict()
          .parse(untrusted).admission,
      )
      const body = Buffer.from(stableAuthorityStringify(admission), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption incoming-support admission exceeds its private bound.',
        )
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: admissionPath(prefix, admission.requestRef),
        body,
        contentSha256: rawSha256(body),
      })
      const reread = await rereadExact(admission.requestRef)
      if (!reread || stableAuthorityStringify(reread)
        !== stableAuthorityStringify(admission)) {
        throw new Error(
          'Canonical Caption incoming-support admission create-only reread failed.',
        )
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadExact(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption incoming-support admission read')
      const requestRef = z.object({ requestRef: refSchema }).strict()
        .parse(untrusted).requestRef
      return rereadExact(requestRef)
    },
  })
}

/**
 * Rereads the immutable V2 assignment request for an initial or resumed
 * Caption call. The call carries only its byte-free ref; neither a browser nor
 * an owner adapter may inject a replacement request body.
 */
export async function resolveCanonicalCaptionIncomingSupportRequestForCall(
  input: {
    readonly call: OrchestraSkillCall
    readonly readPort?: CanonicalCaptionIncomingSupportRequestReadPort
  },
): Promise<SkillSupportRequestV2 | null> {
  const call = parseOrchestraSkillCall(input.call)
  const artifacts = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === 'source_skill_support_request')
  if (artifacts.length === 0) return null
  if (artifacts.length !== 1) {
    throw new Error(
      'Canonical Caption incoming-support assignment is ambiguous.',
    )
  }
  if (!input.readPort
    || !admittedReadPorts.has(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_backend_persisted_specialist_support_request'
    || input.readPort.callerSuppliedRequestAccepted
    || typeof input.readPort.readExact !== 'function') {
    throw new Error(
      'Canonical Caption incoming-support request reader is unavailable.',
    )
  }
  const artifact = artifacts[0]!
  if (artifact.producerSkillKey !== 'head_of_orchestra'
    || artifact.sourceSupportRequestRef !== null) {
    throw new Error(
      'Canonical Caption incoming-support assignment authority is invalid.',
    )
  }
  const requestRef = {
    id: artifact.id,
    version: artifact.version,
    contentHash: artifact.contentHash,
  }
  const first = await input.readPort.readExact({ requestRef })
  const second = await input.readPort.readExact({ requestRef })
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error(
      'Canonical Caption incoming-support request changed between rereads.',
    )
  }
  const request = parseSkillSupportRequestV2(first.request)
  const repeatedRequest = parseSkillSupportRequestV2(second.request)
  const originalCall = parseOrchestraSkillCall(first.originalCall)
  const repeatedOriginalCall = parseOrchestraSkillCall(second.originalCall)
  const supportJob = (CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
    .includes(call.job.jobType)
  const expectedArtifactType = supportJob
    ? CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
      call.job.jobType as CaptionsSupportJobType]
    : null
  if (stableAuthorityStringify(request)
      !== stableAuthorityStringify(repeatedRequest)
    || stableAuthorityStringify(originalCall)
      !== stableAuthorityStringify(repeatedOriginalCall)
    || request.requestId !== requestRef.id
    || request.schemaVersion !== requestRef.version
    || request.requestDigestSha256 !== requestRef.contentHash
    || !supportJob
    || expectedArtifactType === null
    || request.targetSkillKey !== 'captions'
    || request.requestingSkillKey === 'captions'
    || originalCall.caller.callerKind !== 'head_of_orchestra'
    || originalCall.assigneeSkillKey !== request.requestingSkillKey
    || !sameRef(request.originalCallRef, callRef(originalCall))
    || !sameCanonical(originalCall.canonicalScope, request.canonicalScope)
    || request.requestedJobType !== call.job.jobType
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== expectedArtifactType
    || !supportScopeMatchesApprovedCall(
      request.canonicalScope, call.canonicalScope)
    || sameRef(request.originalCallRef, callRef(call))) {
    throw new Error(
      'Canonical Caption incoming-support request crossed its assignment.',
    )
  }
  return structuredClone(request)
}

function assertRequestAgainstOriginalCall(
  request: SkillSupportRequestV2,
  originalCall: OrchestraSkillCall,
): void {
  const supportJob = (CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
    .includes(request.requestedJobType)
  const expectedArtifactType = supportJob
    ? CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
      request.requestedJobType as CaptionsSupportJobType]
    : null
  if (request.targetSkillKey !== 'captions'
    || request.requestingSkillKey === 'captions'
    || originalCall.caller.callerKind !== 'head_of_orchestra'
    || originalCall.assigneeSkillKey !== request.requestingSkillKey
    || !sameRef(request.originalCallRef, callRef(originalCall))
    || !sameCanonical(request.canonicalScope, originalCall.canonicalScope)
    || expectedArtifactType === null
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== expectedArtifactType) {
    throw new Error(
      'Canonical Caption incoming-support admission crossed its owner, scope, job, or artifact.',
    )
  }
}

function supportScopeMatchesApprovedCall(
  requestScope: OrchestraSkillCall['canonicalScope'],
  callScope: OrchestraSkillCall['canonicalScope'],
): boolean {
  const { approvedSnapshotRef: requestSnapshot, ...requestRest } = requestScope
  const { approvedSnapshotRef: callSnapshot, ...callRest } = callScope
  return sameCanonical(requestRest, callRest)
    && (requestSnapshot === null
      ? callSnapshot !== null
      : callSnapshot !== null && sameRef(requestSnapshot, callSnapshot))
}

function supportRequestRef(request: SkillSupportRequestV2) {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function callRef(call: OrchestraSkillCall) {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption incoming-support object port is unavailable.',
    )
  }
}

function admissionPath(
  prefix: string,
  ref: { id: string; version: string; contentHash: string },
): string {
  return `${prefix}/${rawSha256(Buffer.from(stableAuthorityStringify(ref),
    'utf8'))}.json`
}

function rawSha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
