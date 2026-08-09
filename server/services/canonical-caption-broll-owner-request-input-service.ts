import type { BrollCaptionOwnerReadRequest } from
  '../../src/types/caption-broll-owner-read-adapter'
import {
  CANONICAL_CAPTION_BROLL_OWNER_REQUEST_READ_PORT_VERSION,
  type CanonicalCaptionBrollOwnerRequestReadPort,
} from '../../src/types/canonical-caption-broll-owner-request-input'
import type { OrchestraSkillCall, SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import { parseBrollCaptionOwnerReadRequest } from
  '../captions-specialist/caption-broll-owner-read-adapter'
import { parseOrchestraSkillCall } from
  '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from './private-edit-authority-store'

const admittedPorts = new WeakSet<object>()

export function createCanonicalCaptionBrollOwnerRequestReadPort(
  readExact: CanonicalCaptionBrollOwnerRequestReadPort['readExact'],
): CanonicalCaptionBrollOwnerRequestReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption B-roll owner-request reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_REQUEST_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_approved_b_roll_caption_owner_request' as const,
    callerSuppliedOwnerRequestAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedPorts.add(port)
  return port
}

export async function resolveCanonicalCaptionBrollOwnerRequestForCall(input: {
  readonly call: OrchestraSkillCall
  readonly readPort?: CanonicalCaptionBrollOwnerRequestReadPort
}): Promise<BrollCaptionOwnerReadRequest | null> {
  const call = parseOrchestraSkillCall(input.call)
  if (call.job.jobType !==
      'provide_caption_broll_composition_constraints') return null
  const port = input.readPort
  if (!port || !admittedPorts.has(port)
    || port.schemaVersion !==
      CANONICAL_CAPTION_BROLL_OWNER_REQUEST_READ_PORT_VERSION
    || port.sourceAuthority !==
      'canonical_approved_b_roll_caption_owner_request'
    || port.callerSuppliedOwnerRequestAccepted) {
    throw new Error(
      'Canonical Caption B-roll owner-request reader is unavailable.',
    )
  }
  const read = { call: structuredClone(call) }
  const firstValue = await port.readExact(read)
  const secondValue = await port.readExact(read)
  if (!firstValue || !secondValue) {
    throw new Error('Canonical Caption B-roll owner request is unavailable.')
  }
  const first = parseBrollCaptionOwnerReadRequest(firstValue)
  const second = parseBrollCaptionOwnerReadRequest(secondValue)
  if (stableAuthorityStringify(first) !== stableAuthorityStringify(second)
    || !requestMatchesCall(call, first)) {
    throw new Error(
      'Canonical Caption B-roll owner request crossed approved call authority.',
    )
  }
  return structuredClone(first)
}

function requestMatchesCall(
  call: OrchestraSkillCall,
  request: BrollCaptionOwnerReadRequest,
): boolean {
  const scope = request.canonicalScope
  const snapshot = call.canonicalScope.approvedSnapshotRef
  return call.job.scopeLevel === 'scene'
    && call.canonicalScope.boundaryId === null
    && snapshot !== null
    && sameRef(snapshot, scope.approvedSnapshotRef)
    && call.canonicalScope.ownerUserId === scope.ownerUserId
    && call.canonicalScope.workspaceId === scope.workspaceId
    && call.canonicalScope.projectId === scope.projectId
    && call.canonicalScope.editSessionId === scope.editSessionId
    && call.canonicalScope.outputId === scope.outputId
    && call.canonicalScope.sceneId === scope.sceneId
    && call.canonicalScope.authorizedFrameRanges.length === 1
    && call.canonicalScope.authorizedFrameRanges[0]?.startFrame
      === scope.authorizedFrameRange.startFrameInclusive
    && call.canonicalScope.authorizedFrameRanges[0]?.endFrameExclusive
      === scope.authorizedFrameRange.endFrameExclusive
    && exactArtifact(call, 'confirmed_output_frame', scope.outputFrameRef)
    && exactArtifact(call, 'master_timing_or_planning_timing',
      scope.masterTimingRef)
}

function exactArtifact(
  call: OrchestraSkillCall,
  artifactType: string,
  ref: SkillContractRef,
): boolean {
  const matches = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === artifactType)
  return matches.length === 1 && sameRef(matches[0]!, ref)
}

function sameRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
