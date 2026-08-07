import {
  CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION,
  type CanonicalCaptionIncomingSupportRequestReadPort,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  type CaptionsSupportJobType,
} from '../../src/types/captions-specialist'
import type { OrchestraSkillCall } from
  '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import {
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import { stableAuthorityStringify } from './private-edit-authority-store'

const admittedReadPorts = new WeakSet<object>()

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
    || originalCall.assigneeSkillKey !== request.requestingSkillKey
    || !sameRef(request.originalCallRef, callRef(originalCall))
    || !sameCanonical(originalCall.canonicalScope, call.canonicalScope)
    || request.requestedJobType !== call.job.jobType
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== expectedArtifactType
    || !sameCanonical(request.canonicalScope, call.canonicalScope)
    || sameRef(request.originalCallRef, callRef(call))) {
    throw new Error(
      'Canonical Caption incoming-support request crossed its assignment.',
    )
  }
  return structuredClone(request)
}

function callRef(call: OrchestraSkillCall) {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
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
