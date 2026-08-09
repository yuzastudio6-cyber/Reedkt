import type { SkillCapabilityEntryDefinition } from '../edit-skills/core/skill-capability-manifest-types'
import {
  qualificationSupportsSoundRequest,
  resolveSoundCapabilityEntry,
} from '../edit-skills/sound/sound-admission'
import {
  parseCanonicalSoundRequest,
  parseCanonicalSoundResult,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundFrameRange,
} from './sound-contracts'
import {
  SOUND_SKILL_KEY,
  SOUND_SKILL_VERSION,
  soundSkillCapabilityManifest,
} from './sound-manifest'

export type SoundScopeGuardCode =
  | 'invalid_contract'
  | 'manifest_mismatch'
  | 'capability_mismatch'
  | 'qualification_blocked'
  | 'peer_authority_escalation'
  | 'circular_dependency'
  | 'range_violation'
  | 'locked_layer_violation'
  | 'stale_source'
  | 'approval_blocked'
  | 'credit_blocked'
  | 'unauthorized_visual_write'

export interface SoundScopeGuardResult {
  ok: boolean
  code?: SoundScopeGuardCode
  errors: string[]
  request?: CanonicalSoundRequest
  capability?: SkillCapabilityEntryDefinition
}

function fail(code: SoundScopeGuardCode, errors: string[]): SoundScopeGuardResult {
  return { ok: false, code, errors }
}

function normalizedRanges(ranges: SoundFrameRange[]): Array<{ start: number; end: number }> {
  const sorted = ranges
    .map((range) => ({ start: range.startFrame, end: range.endFrameExclusive }))
    .sort((left, right) => left.start - right.start || left.end - right.end)
  const merged: Array<{ start: number; end: number }> = []
  for (const range of sorted) {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}

export function soundRangeIsSubset(
  candidate: SoundFrameRange,
  authorityRanges: SoundFrameRange[],
): boolean {
  return normalizedRanges(authorityRanges).some(
    (authority) => candidate.startFrame >= authority.start &&
      candidate.endFrameExclusive <= authority.end,
  )
}

export function soundRangesAreSubset(
  candidates: SoundFrameRange[],
  authorityRanges: SoundFrameRange[],
): boolean {
  return candidates.every((range) => soundRangeIsSubset(range, authorityRanges))
}

function requiredExecutionApproval(request: CanonicalSoundRequest): string[] {
  if (request.executionAuthority.requestedMode === 'planning' ||
    request.executionAuthority.requestedMode === 'fixture') return []
  const errors: string[] = []
  if (request.executionAuthority.approvalStatus !== 'approved' ||
    !request.executionAuthority.approvedPlanSnapshotId ||
    !request.executionAuthority.approvedPlanSnapshotHash ||
    !request.executionAuthority.privateOutputScopeId) {
    errors.push('approved_snapshot_and_private_output_scope_required')
  }
  return errors
}

function validateSourceVersions(request: CanonicalSoundRequest): string[] {
  const versions = new Map(
    request.assignmentScope.sourceArtifactVersions.map((item) => [item.artifactId, item]),
  )
  const refs = [
    ...request.sourceMediaRefs,
    ...request.sourceAudioRefs,
    ...request.visualDependencies.map((item) => item.artifact),
    request.timelineManifestRef,
    ...(request.transcriptSpeechEvidenceRef ? [request.transcriptSpeechEvidenceRef] : []),
    ...request.referenceSoundInputs,
  ]
  const errors: string[] = []
  for (const ref of refs) {
    const version = versions.get(ref.artifactId)
    if (!version || version.version !== ref.version || version.checksumSha256 !== ref.checksumSha256) {
      errors.push(`stale_or_unbound_artifact:${ref.artifactId}`)
    }
  }
  return errors
}

export function evaluateSoundScopeGuard(input: unknown): SoundScopeGuardResult {
  let request: CanonicalSoundRequest
  try {
    request = parseCanonicalSoundRequest(input)
  } catch (error) {
    return fail('invalid_contract', [error instanceof Error ? error.message : String(error)])
  }
  const manifest = soundSkillCapabilityManifest
  if (
    request.soundSkillKey !== SOUND_SKILL_KEY ||
    request.soundSkillVersion !== SOUND_SKILL_VERSION ||
    request.soundManifestHash !== manifest.manifestHash ||
    request.assignmentScope.manifestHash !== manifest.manifestHash
  ) {
    return fail('manifest_mismatch', ['sound_manifest_binding_mismatch'])
  }
  const capability = resolveSoundCapabilityEntry({
    capabilityKey: request.requestedCapabilityKey,
    jobType: request.requestedJobType,
  })
  if (
    !capability ||
    capability.capabilityKey !== request.requestedCapabilityKey ||
    !capability.supportedJobTypes.includes(request.requestedJobType)
  ) {
    return fail('capability_mismatch', ['sound_capability_binding_mismatch'])
  }
  if (!qualificationSupportsSoundRequest(capability, request.requiredQualificationMode)) {
    return fail('qualification_blocked', [
      `${capability.capabilityKey}:${capability.qualificationStatus}:${capability.evidenceLevel}:${request.requiredQualificationMode}`,
    ])
  }
  const caller = request.callerType === 'head_of_orchestra' ? 'orchestra' : request.callerType
  if (!capability.acceptedCallerTypes.includes(caller)) {
    return fail('capability_mismatch', ['caller_not_accepted_by_capability'])
  }
  if (request.dependencyChain.includes(SOUND_SKILL_KEY) ||
    request.peerAuthority?.ancestorSkillKeys.includes(SOUND_SKILL_KEY)) {
    return fail('circular_dependency', ['sound_dependency_cycle_detected'])
  }
  if (request.peerAuthority) {
    if (
      request.peerAuthority.parentAuthorityHash !== request.assignmentScope.parentAuthorityHash ||
      request.callerManifestHash !== request.peerAuthority.callerManifestHash
    ) {
      return fail('peer_authority_escalation', ['peer_parent_authority_binding_mismatch'])
    }
    if (!soundRangesAreSubset(
      request.assignmentScope.authorizedAudioWriteRanges,
      request.peerAuthority.callerOwnedAudioRanges,
    ) || !soundRangesAreSubset(
      request.assignmentScope.authorizedVisualWriteRanges,
      request.peerAuthority.callerOwnedVisualRanges,
    )) {
      return fail('peer_authority_escalation', ['peer_delegated_ranges_exceed_caller_authority'])
    }
  }
  const lockedAudio = request.assignmentScope.targetAudioTracks.filter(
    (track) => request.assignmentScope.lockedAudioTracks.includes(track),
  )
  const lockedVisual = request.assignmentScope.targetVisualLayers.filter(
    (layer) => request.assignmentScope.lockedVisualLayers.includes(layer),
  )
  if (lockedAudio.length > 0 || lockedVisual.length > 0) {
    return fail('locked_layer_violation', [
      ...lockedAudio.map((track) => `locked_audio_track:${track}`),
      ...lockedVisual.map((layer) => `locked_visual_layer:${layer}`),
    ])
  }
  if (
    request.assignmentScope.sourceTimelineHash !== request.timelineManifestHash ||
    request.visualDependencies.some(
      (dependency) => dependency.timingManifestHash !== request.timelineManifestHash,
    )
  ) {
    return fail('stale_source', ['timeline_or_visual_dependency_hash_mismatch'])
  }
  const staleSources = validateSourceVersions(request)
  if (staleSources.length > 0) return fail('stale_source', staleSources)
  const approvalErrors = requiredExecutionApproval(request)
  if (approvalErrors.length > 0) return fail('approval_blocked', approvalErrors)
  if (
    request.costPolicy.allowProviderGeneration &&
    (request.executionAuthority.requestedMode === 'private_internal' ||
      request.executionAuthority.requestedMode === 'production') &&
    (!request.executionAuthority.creditReservationId ||
      request.executionAuthority.creditStatus !== 'reserved')
  ) {
    return fail('credit_blocked', ['provider_execution_requires_reserved_credits'])
  }
  return { ok: true, errors: [], request, capability }
}

function effectiveAudioAuthority(request: CanonicalSoundRequest): SoundFrameRange[] {
  if (request.assignmentScope.soundTailPolicy !== 'use_authorized_context_handle') {
    return request.assignmentScope.authorizedAudioWriteRanges
  }
  return [
    ...request.assignmentScope.authorizedAudioWriteRanges,
    ...request.assignmentScope.contextHandles
      .filter((handle) => handle.purpose === 'sound_tail' || handle.purpose === 'crossfade')
      .map((handle) => handle.authorizedRange),
  ]
}

export function validateSoundResultAuthority(
  requestInput: unknown,
  resultInput: unknown,
): SoundScopeGuardResult & { result?: CanonicalSoundResult } {
  const admission = evaluateSoundScopeGuard(requestInput)
  if (!admission.ok || !admission.request) return admission
  let result: CanonicalSoundResult
  try {
    result = parseCanonicalSoundResult(resultInput)
  } catch (error) {
    return fail('invalid_contract', [error instanceof Error ? error.message : String(error)])
  }
  const request = admission.request
  if (
    result.requestId !== request.requestId ||
    result.soundSkillVersion !== request.soundSkillVersion ||
    result.soundManifestHash !== request.soundManifestHash ||
    result.capabilityEntryKey !== request.requestedCapabilityKey
  ) {
    return fail('manifest_mismatch', ['result_request_or_manifest_binding_mismatch'])
  }
  if (!soundRangesAreSubset(result.modifiedAudioRanges, effectiveAudioAuthority(request))) {
    return fail('range_violation', ['modified_audio_range_outside_authority'])
  }
  if (!soundRangesAreSubset(
    result.modifiedVisualRanges,
    request.assignmentScope.authorizedVisualWriteRanges,
  )) {
    return fail('unauthorized_visual_write', ['modified_visual_range_outside_authority'])
  }
  if (result.cueManifest.cues.some((cue) => !soundRangeIsSubset({
    rangeId: cue.cueId,
    startFrame: cue.startFrame,
    endFrameExclusive: cue.endFrameExclusive,
  }, effectiveAudioAuthority(request)))) {
    return fail('range_violation', ['sound_cue_or_tail_outside_authority'])
  }
  const requestVisualHashes = new Set(request.visualDependencies.map((item) => item.visualHash))
  if (result.sourceVisualHashes.some((hash) => !requestVisualHashes.has(hash))) {
    return fail('stale_source', ['result_references_unknown_visual_hash'])
  }
  const requestAudioHashes = new Set(request.sourceAudioRefs.map((item) => item.checksumSha256))
  if (result.sourceAudioHashes.some((hash) => !requestAudioHashes.has(hash))) {
    return fail('stale_source', ['result_references_unknown_audio_hash'])
  }
  if (result.sourceTimingHash !== request.timelineManifestHash) {
    return fail('stale_source', ['result_timing_hash_mismatch'])
  }
  return { ...admission, result }
}
