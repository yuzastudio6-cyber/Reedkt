import { timelineRatesEqual } from '../edit-skills/core/timeline-rate'
import type { SkillCapabilityEntryDefinition } from '../edit-skills/core/skill-capability-manifest-types'
import { musicSkillCapabilityManifest } from '../edit-skills/music/music-capability-manifest'
import { resolveMusicCapabilityEntry, qualificationSupportsMusicRequest } from '../edit-skills/music/music-admission'
import {
  MUSIC_SKILL_VERSION,
  parseCanonicalMusicRequest,
  type CanonicalMusicSkillRequest,
  type CanonicalMusicSkillResult,
  type MusicFrameRange,
} from './music-contracts'

export type MusicScopeGuardCode =
  | 'invalid_contract' | 'manifest_mismatch' | 'capability_mismatch'
  | 'qualification_blocked' | 'peer_authority_escalation' | 'circular_dependency'
  | 'range_violation' | 'locked_track_violation' | 'stale_timeline'
  | 'rights_blocked' | 'approval_blocked' | 'credit_blocked'

export interface MusicScopeGuardResult {
  ok: boolean
  code?: MusicScopeGuardCode
  errors: string[]
  request?: CanonicalMusicSkillRequest
  capability?: SkillCapabilityEntryDefinition
}

function fail(code: MusicScopeGuardCode, errors: string[]): MusicScopeGuardResult {
  return { ok: false, code, errors }
}

function mergedRanges(ranges: readonly MusicFrameRange[]): Array<{ start: number; end: number }> {
  const sorted = ranges.map((range) => ({ start: range.startFrame, end: range.endFrameExclusive }))
    .sort((left, right) => left.start - right.start || left.end - right.end)
  const merged: Array<{ start: number; end: number }> = []
  for (const range of sorted) {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}

export function musicRangeIsSubset(candidate: MusicFrameRange, authority: readonly MusicFrameRange[]): boolean {
  return mergedRanges(authority).some((range) =>
    candidate.startFrame >= range.start && candidate.endFrameExclusive <= range.end)
}

export function musicRangesAreSubset(candidates: readonly MusicFrameRange[], authority: readonly MusicFrameRange[]): boolean {
  return candidates.every((range) => musicRangeIsSubset(range, authority))
}

export function musicRangesOverlap(left: MusicFrameRange, right: MusicFrameRange): boolean {
  return left.startFrame < right.endFrameExclusive && left.endFrameExclusive > right.startFrame
}

function rightsErrors(request: CanonicalMusicSkillRequest): string[] {
  const byAsset = new Map(request.rightsAndProvenanceRefs.map((binding) => [binding.assetId, binding]))
  const protectedSources = request.inputAssetRefs.filter((asset) =>
    request.scopeAuthority.authorizedSourceMusicAssetIds.includes(asset.artifactId))
  const errors: string[] = []
  for (const asset of protectedSources) {
    const rights = byAsset.get(asset.artifactId)
    if (!rights) errors.push(`missing_rights:${asset.artifactId}`)
    else if (rights.commercialUse !== 'allowed' || rights.platformUse !== 'allowed' || rights.editingPermission !== 'allowed') {
      errors.push(`unapproved_rights:${asset.artifactId}`)
    }
  }
  return errors
}

export function evaluateMusicScopeGuard(input: unknown): MusicScopeGuardResult {
  let request: CanonicalMusicSkillRequest
  try {
    request = parseCanonicalMusicRequest(input)
  } catch (error) {
    return fail('invalid_contract', [error instanceof Error ? error.message : String(error)])
  }
  if (request.scopeAuthority.approvedTimelineRef.checksumSha256 !== request.timelineBinding.timelineManifestHash ||
    !timelineRatesEqual(request.scopeAuthority.timelineRate, request.timelineBinding.rationalTimelineRate)) {
    return fail('stale_timeline', ['timeline_hash_or_rate_mismatch'])
  }
  const capability = resolveMusicCapabilityEntry({ jobType: request.jobType })
  if (!capability || capability.capabilityKey !== `music.${request.jobType}`) {
    return fail('capability_mismatch', ['music_capability_not_published'])
  }
  if (!qualificationSupportsMusicRequest(capability, request.requestedExecutionMode)) {
    return fail('qualification_blocked', [
      `${capability.capabilityKey}:${capability.qualificationStatus}:${capability.evidenceLevel}:${request.requestedExecutionMode}`,
    ])
  }
  if (request.caller.ancestorSkillKeys.includes('music')) {
    return fail('circular_dependency', ['music_dependency_cycle_detected'])
  }
  if (request.caller.callerType !== 'head_of_orchestra') {
    if (!request.caller.callerOwnedRanges || !musicRangesAreSubset(
      request.scopeAuthority.authorizedMusicWriteRanges,
      request.caller.callerOwnedRanges,
    )) return fail('peer_authority_escalation', ['peer_delegated_ranges_exceed_caller_authority'])
  }
  if (request.scopeAuthority.authorizedMusicTrackIds.some((track) =>
    request.scopeAuthority.lockedMusicTrackIds.includes(track))) {
    return fail('locked_track_violation', ['target_music_track_is_locked'])
  }
  if (request.proposedCues.some((cue) => !musicRangeIsSubset(
    cue.exactRange,
    request.scopeAuthority.authorizedMusicWriteRanges,
  ))) return fail('range_violation', ['music_cue_exceeds_write_authority'])
  if (request.proposedCues.some((cue) => request.scopeAuthority.lockedRanges.some(
    (locked) => musicRangesOverlap(cue.exactRange, locked),
  ))) return fail('range_violation', ['music_cue_overlaps_locked_range'])
  if (request.scopeAuthority.mayStudyWholeVideo && request.scopeAuthority.authorizedInspectRanges.length === 0) {
    return fail('range_violation', ['whole_video_study_requires_inspect_authority'])
  }
  const executing = request.requestedExecutionMode !== 'planning'
  if (executing && (request.approvalAndBudget.approvalStatus !== 'approved' || !request.privateOutputScopeId)) {
    return fail('approval_blocked', ['approved_snapshot_and_private_output_scope_required'])
  }
  if (executing && request.userMusicPolicy.allowGeneration && !request.approvalAndBudget.reservationRef) {
    return fail('credit_blocked', ['provider_capable_execution_requires_credit_reservation'])
  }
  const rights = rightsErrors(request)
  if (executing && rights.length > 0) return fail('rights_blocked', rights)
  if (musicSkillCapabilityManifest.skillVersion !== MUSIC_SKILL_VERSION) {
    return fail('manifest_mismatch', ['music_service_and_manifest_version_mismatch'])
  }
  return { ok: true, errors: [], request, capability }
}

export function validateMusicResultAuthority(input: {
  request: CanonicalMusicSkillRequest
  result: CanonicalMusicSkillResult
}): MusicScopeGuardResult {
  const admission = evaluateMusicScopeGuard(input.request)
  if (!admission.ok) return admission
  if (input.result.requestId !== input.request.requestId ||
    input.result.musicSkillVersion !== musicSkillCapabilityManifest.skillVersion ||
    input.result.musicManifestHash !== musicSkillCapabilityManifest.manifestHash) {
    return fail('manifest_mismatch', ['music_result_binding_mismatch'])
  }
  if (!musicRangesAreSubset(
    input.result.actualMusicMutationRanges,
    input.request.scopeAuthority.authorizedMusicWriteRanges,
  )) return fail('range_violation', ['music_result_mutation_exceeds_write_authority'])
  for (const receipt of input.result.soundSupportReceipts) {
    if (!musicRangesAreSubset(receipt.mutationRanges, input.request.scopeAuthority.authorizedMusicWriteRanges)) {
      return fail('range_violation', [`sound_child_mutation_exceeds_music_authority:${receipt.cueId}`])
    }
  }
  return admission
}
