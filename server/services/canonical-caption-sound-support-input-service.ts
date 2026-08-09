import { z } from 'zod'

import {
  CANONICAL_CAPTION_SOUND_SUPPORT_INPUT_READ_PORT_VERSION,
  type CanonicalCaptionSoundSupportInput,
  type CanonicalCaptionSoundSupportInputReadPort,
  type CanonicalCaptionSoundSupportInputReadRequest,
} from '../../src/types/canonical-caption-soundsync-support'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTIONS_SOUND_SUPPORT_JOB_TYPES,
} from '../../src/types/captions-specialist'
import type {
  OrchestraSkillCall,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  createCaptionSoundSupportBundle,
  parseCaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import {
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from './private-edit-authority-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const inputEnvelopeSchema = z.object({
  canonicalContext: z.unknown(),
  dialogueTrackRef: refSchema,
  dialogueActivityRef: refSchema,
  maximumRequestedCueCount: z.number().int().min(0).max(4),
}).strict()
const admittedReadPorts = new WeakSet<object>()

export function createCanonicalCaptionSoundSupportInputReadPort(
  readExact: CanonicalCaptionSoundSupportInputReadPort['readExact'],
): CanonicalCaptionSoundSupportInputReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption Sound support-input reader is required.')
  }
  const port: CanonicalCaptionSoundSupportInputReadPort = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_SOUND_SUPPORT_INPUT_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_approved_snapshot_master_timing_story_timing_owner',
    callerSuppliedContextAccepted: false,
    readExact: readExact.bind(undefined),
  })
  admittedReadPorts.add(port)
  return port
}

export async function resolveCanonicalCaptionSoundSupportRuntimeInput(input: {
  readonly call: OrchestraSkillCall
  readonly postapprovalFinishBindingRef: CaptionDomainRef | null
  readonly pictureLockRef: CaptionDomainRef | null
  readonly finishReadinessRef: CaptionDomainRef | null
  readonly readPort?: CanonicalCaptionSoundSupportInputReadPort
}): Promise<{
  readonly soundSupportContext?: unknown
  readonly soundSupportPayload?: unknown
}> {
  const call = parseOrchestraSkillCall(input.call)
  if (!(CAPTIONS_SOUND_SUPPORT_JOB_TYPES as readonly string[])
    .includes(call.job.jobType)) return {}
  if (!input.postapprovalFinishBindingRef
    || !input.pictureLockRef
    || !input.finishReadinessRef) {
    throw new Error(
      'Canonical Caption Sound work requires exact postapproval finish lineage.',
    )
  }
  if (!input.readPort
    || !admittedReadPorts.has(input.readPort)
    || input.readPort.schemaVersion !==
      CANONICAL_CAPTION_SOUND_SUPPORT_INPUT_READ_PORT_VERSION
    || input.readPort.sourceAuthority !==
      'canonical_approved_snapshot_master_timing_story_timing_owner'
    || input.readPort.callerSuppliedContextAccepted) {
    throw new Error(
      'Canonical Caption Sound support-input reader is unavailable.',
    )
  }
  const request: CanonicalCaptionSoundSupportInputReadRequest = {
    call: structuredClone(call),
    postapprovalFinishBindingRef:
      structuredClone(input.postapprovalFinishBindingRef),
    pictureLockRef: structuredClone(input.pictureLockRef),
    finishReadinessRef: structuredClone(input.finishReadinessRef),
  }
  const first = await reread(input.readPort, request)
  const second = await reread(input.readPort, request)
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error(
      'Canonical Caption Sound support inputs changed between exact rereads.',
    )
  }
  assertInputMatchesCall({
    call,
    value: first,
    pictureLockRef: input.pictureLockRef,
    finishReadinessRef: input.finishReadinessRef,
  })
  const bundle = createCaptionSoundSupportBundle({
    requestId: `${call.callId}.sound-request`,
    idempotencyKey: call.idempotencyKey,
    originalCallRef: callRef(call),
    context: first.canonicalContext,
    dialogueTrackRef: first.dialogueTrackRef,
    dialogueActivityRef: first.dialogueActivityRef,
    maximumRequestedCueCount: first.maximumRequestedCueCount,
  })
  return {
    soundSupportContext: structuredClone(first.canonicalContext),
    soundSupportPayload: structuredClone(bundle.payload),
  }
}

async function reread(
  port: CanonicalCaptionSoundSupportInputReadPort,
  request: CanonicalCaptionSoundSupportInputReadRequest,
): Promise<CanonicalCaptionSoundSupportInput | null> {
  const value = await port.readExact(structuredClone(request))
  if (value === null) return null
  assertClosedContractTree(value, 'Canonical Caption Sound support input')
  const envelope = inputEnvelopeSchema.parse(value)
  return {
    canonicalContext: parseCaptionSoundContext(envelope.canonicalContext),
    dialogueTrackRef: structuredClone(envelope.dialogueTrackRef),
    dialogueActivityRef: structuredClone(envelope.dialogueActivityRef),
    maximumRequestedCueCount: envelope.maximumRequestedCueCount,
  }
}

function assertInputMatchesCall(input: {
  call: OrchestraSkillCall
  value: CanonicalCaptionSoundSupportInput
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
}): void {
  const call = input.call
  const context = parseCaptionSoundContext(input.value.canonicalContext)
  const scope = context.sceneGraph.canonicalScope
  const confirmedOutputFrameRef = exactSingleArtifactRef(
    call, 'confirmed_output_frame')
  const masterTimingRef = exactSingleArtifactRef(
    call, 'master_timing_or_planning_timing')
  if (call.canonicalScope.approvedSnapshotRef === null
    || call.canonicalScope.outputId === null
    || call.canonicalScope.sceneId === null
    || call.canonicalScope.authorizedFrameRanges.length !== 1
    || scope.ownerUserId !== call.canonicalScope.ownerUserId
    || scope.workspaceId !== call.canonicalScope.workspaceId
    || scope.projectId !== call.canonicalScope.projectId
    || scope.editSessionId !== call.canonicalScope.editSessionId
    || !sameRef(scope.approvedSnapshotRef,
      call.canonicalScope.approvedSnapshotRef)
    || scope.outputId !== call.canonicalScope.outputId
    || scope.sceneId !== call.canonicalScope.sceneId
    || stableAuthorityStringify(scope.authorizedFrameRanges) !==
      stableAuthorityStringify(call.canonicalScope.authorizedFrameRanges)
    || !sameRef(context.sceneGraph.confirmedOutputFrameRef,
      confirmedOutputFrameRef)
    || !sameRef(context.storyTimingResolution.masterTimingRef,
      masterTimingRef)
    || !sameRef(context.sceneGraph.pictureLockRef, input.pictureLockRef)
    || !sameRef(context.sceneGraph.finishReadinessRef,
      input.finishReadinessRef)) {
    throw new Error(
      'Canonical Caption Sound inputs crossed call, finish, frame, or timing authority.',
    )
  }
}

function exactSingleArtifactRef(
  call: OrchestraSkillCall,
  artifactType: string,
): SkillContractRef {
  const matches = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === artifactType)
  if (matches.length !== 1) {
    throw new Error(`Canonical Caption call lacks one ${artifactType} ref.`)
  }
  const ref = matches[0]!
  return { id: ref.id, version: ref.version, contentHash: ref.contentHash }
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function sameRef(
  left: CaptionDomainRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null || right === null
    ? left === right
    : left.id === right.id
      && left.version === right.version
      && left.contentHash === right.contentHash
}
