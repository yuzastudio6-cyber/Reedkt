import type {
  MotionStudioGeneratedMusicCandidateRequestV1,
  MotionStudioGeneratedMusicCapabilityField,
  MotionStudioGeneratedMusicCapabilitySnapshotV1,
  MotionStudioGeneratedMusicProtocolEnvelopeV1,
  MotionStudioSynchronizedFoleyCandidateRequestV1,
  MotionStudioSynchronizedFoleyCapabilityField,
  MotionStudioSynchronizedFoleyCapabilitySnapshotV1,
  MotionStudioSynchronizedFoleyProtocolEnvelopeV1,
} from '../../../src/types/motion-studio'
import { MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID } from '../../../src/types/motion-studio'
import {
  motionStudioGeneratedMusicCandidateRequestV1Schema,
  motionStudioGeneratedMusicCapabilitySnapshotV1Schema,
  motionStudioMusicFoleyProtocolEnvelopeV1Schema,
  motionStudioSynchronizedFoleyCandidateRequestV1Schema,
  motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

const MUSIC_FIELDS: readonly MotionStudioGeneratedMusicCapabilityField[] = [
  'text_prompt', 'negative_instructions', 'instrumental_only', 'duration_control', 'wav_output',
]
const FOLEY_FIELDS: readonly MotionStudioSynchronizedFoleyCapabilityField[] = [
  'video_conditioning', 'text_prompt', 'visible_event_grounding',
  'dialogue_suppression', 'music_suppression', 'exact_sound_suppression',
  'duration_control', 'wav_output',
]

export function compileMotionStudioGeneratedMusicProtocolRequest(input: {
  request: MotionStudioGeneratedMusicCandidateRequestV1
  capabilitySnapshot: MotionStudioGeneratedMusicCapabilitySnapshotV1
}): MotionStudioGeneratedMusicProtocolEnvelopeV1 {
  const request = parse(
    input.request,
    motionStudioGeneratedMusicCandidateRequestV1Schema,
    'Generated music request',
  ) as MotionStudioGeneratedMusicCandidateRequestV1
  const snapshot = parse(
    input.capabilitySnapshot,
    motionStudioGeneratedMusicCapabilitySnapshotV1Schema,
    'Generated music capability snapshot',
  ) as MotionStudioGeneratedMusicCapabilitySnapshotV1
  assertProtocolScope(request, snapshot)
  assertCapabilityBinding(request, snapshot)
  requireProtocolFields(snapshot.fields, MUSIC_FIELDS, 'Generated music')
  const requestDigest = sha256CanonicalJson(request)
  return parse({
    schemaVersion: 'motion-studio.music-foley-protocol-envelope.v1',
    adapterId: MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID,
    executionClass: 'protocol_simulator',
    intent: 'generated_music_candidate',
    requestId: request.musicRequestId,
    requestDigest,
    capabilitySnapshotId: snapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: snapshot.evidenceDigest,
    providerIdentityStatus: 'unverified_protocol_fixture',
    configuredRouteId: 'lyria_3_pro',
    musicCueId: request.cue.cueId,
    direction: request.direction,
    emittedFields: MUSIC_FIELDS,
    externalNetworkAllowed: false,
    providerSubmissionAllowed: false,
    mediaOutputAllowed: false,
    automaticRetry: false,
    automaticFallback: false,
    automaticSelection: false,
  }, motionStudioMusicFoleyProtocolEnvelopeV1Schema, 'Compiled generated music envelope') as MotionStudioGeneratedMusicProtocolEnvelopeV1
}

export function compileMotionStudioSynchronizedFoleyProtocolRequest(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  capabilitySnapshot: MotionStudioSynchronizedFoleyCapabilitySnapshotV1
}): MotionStudioSynchronizedFoleyProtocolEnvelopeV1 {
  const request = parse(
    input.request,
    motionStudioSynchronizedFoleyCandidateRequestV1Schema,
    'Synchronized Foley request',
  ) as MotionStudioSynchronizedFoleyCandidateRequestV1
  const snapshot = parse(
    input.capabilitySnapshot,
    motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
    'Synchronized Foley capability snapshot',
  ) as MotionStudioSynchronizedFoleyCapabilitySnapshotV1
  assertProtocolScope(request, snapshot)
  assertCapabilityBinding(request, snapshot)
  requireProtocolFields(snapshot.fields, FOLEY_FIELDS, 'Synchronized Foley')
  const requestDigest = sha256CanonicalJson(request)
  return parse({
    schemaVersion: 'motion-studio.music-foley-protocol-envelope.v1',
    adapterId: MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID,
    executionClass: 'protocol_simulator',
    intent: 'synchronized_foley_candidate',
    requestId: request.foleyRequestId,
    requestDigest,
    capabilitySnapshotId: snapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: snapshot.evidenceDigest,
    providerIdentityStatus: 'unverified_protocol_fixture',
    configuredRouteId: 'mmaudio',
    soundEventId: request.soundEvent.soundEventId,
    sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
    direction: request.direction,
    emittedFields: FOLEY_FIELDS,
    externalNetworkAllowed: false,
    providerSubmissionAllowed: false,
    mediaOutputAllowed: false,
    automaticRetry: false,
    automaticFallback: false,
    automaticSelection: false,
  }, motionStudioMusicFoleyProtocolEnvelopeV1Schema, 'Compiled synchronized Foley envelope') as MotionStudioSynchronizedFoleyProtocolEnvelopeV1
}

function assertProtocolScope(
  request: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
  snapshot: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    discoveryKind: string
    providerIdentityStatus: string
    lifecycleStatus: string
  },
): void {
  if (request.workspaceId !== snapshot.workspaceId || request.projectId !== snapshot.projectId ||
      request.editSessionId !== snapshot.editSessionId || request.productionId !== snapshot.productionId) {
    throw blocked('Music/Foley request and capability evidence must share exact tenant and production scope.')
  }
  if (snapshot.discoveryKind !== 'protocol_fixture' ||
      snapshot.providerIdentityStatus !== 'unverified_protocol_fixture' ||
      snapshot.lifecycleStatus !== 'protocol_fixture_only') {
    throw blocked('MS-012D0 compiler accepts protocol capability fixtures only; official discovery requires a later compiler authority.')
  }
}

function assertCapabilityBinding(
  request: { capabilitySnapshotId: string; capabilitySnapshotDigest: string; configuredRouteId: string },
  snapshot: { capabilitySnapshotId: string; evidenceDigest: string; configuredRouteId: string },
): void {
  if (request.capabilitySnapshotId !== snapshot.capabilitySnapshotId ||
      request.capabilitySnapshotDigest !== snapshot.evidenceDigest ||
      request.configuredRouteId !== snapshot.configuredRouteId) {
    throw blocked('Music/Foley request does not bind the exact configured route and capability snapshot.')
  }
}

function requireProtocolFields<TField extends string>(
  evidence: readonly { field: TField; support: 'supported' | 'unsupported' | 'unknown' }[],
  fields: readonly TField[],
  label: string,
): void {
  for (const field of fields) {
    const entry = evidence.find((candidate) => candidate.field === field)
    if (!entry || entry.support !== 'supported') {
      throw blocked(`${label} compiler field ${field} is ${entry?.support ?? 'unknown'} in the exact capability snapshot.`)
    }
  }
}

function parse<T>(
  value: unknown,
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: { flatten(): unknown } } },
  label: string,
): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError('VALIDATION_FAILED', `${label} is invalid.`, 400, result.error.flatten())
  return result.data
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
