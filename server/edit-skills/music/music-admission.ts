import type { SkillCapabilityEntryDefinition } from '../core/skill-capability-manifest-types'
import { getMusicToolRouteManifest } from '../../music/music-tool-routes'
import type { CanonicalMusicSkillRequest } from '../../music/music-contracts'
import { musicCapabilityEntries } from './music-capability-manifest'

export function resolveMusicCapabilityEntry(input: {
  capabilityKey?: string
  jobType?: string
}): SkillCapabilityEntryDefinition | undefined {
  return musicCapabilityEntries.find((entry) =>
    (!input.capabilityKey || entry.capabilityKey === input.capabilityKey) &&
    (!input.jobType || entry.supportedJobTypes.includes(input.jobType)))
}

export function qualificationSupportsMusicRequest(
  capability: SkillCapabilityEntryDefinition,
  mode: CanonicalMusicSkillRequest['requestedExecutionMode'],
): boolean {
  if (mode === 'planning') return capability.qualificationStatus === 'planning_qualified' ||
    capability.qualificationStatus === 'internal_execution_qualified' ||
    capability.qualificationStatus === 'production_qualified'
  if (mode === 'fixture') return capability.evidenceLevel === 'fixture' ||
    capability.qualificationStatus === 'internal_execution_qualified' ||
    capability.qualificationStatus === 'production_qualified'
  if (mode === 'private_internal') return capability.qualificationStatus === 'internal_execution_qualified' ||
    capability.qualificationStatus === 'production_qualified' || isCompositeMusicJob(capability.supportedJobTypes[0] ?? '')
  return capability.qualificationStatus === 'production_qualified'
}

export function isCompositeMusicJob(jobType: string): boolean {
  return [
    'full_video_music_pass', 'support_motion_studio_music', 'support_living_frame_music',
    'support_3d_music', 'support_transition_music', 'support_graphic_design_music',
    'revise_music',
  ].includes(jobType)
}

export function assertMusicRouteAdmission(input: {
  routeKey: string
  routeVersion: string
  routeHash: string
  jobType: string
  mode: CanonicalMusicSkillRequest['requestedExecutionMode']
}): void {
  const route = getMusicToolRouteManifest(input.routeKey, input.routeVersion)
  if (!route || route.routeHash !== input.routeHash) throw new Error('Exact Music route is unavailable or stale.')
  if (!route.supportedJobTypes.includes(input.jobType) && !isCompositeMusicJob(input.jobType)) {
    throw new Error(`Music route ${route.routeKey} does not support ${input.jobType}.`)
  }
  const qualified = input.mode === 'planning'
    ? route.qualificationByMode.planning !== 'blocked'
    : input.mode === 'fixture'
      ? route.qualificationByMode.fixtureExecution !== 'blocked'
      : input.mode === 'private_internal'
        ? route.qualificationByMode.privateInternalExecution === 'internal_execution_qualified' ||
          route.routeRole === 'no_music' || route.routeRole === 'lower_cost'
        : route.qualificationByMode.productionExecution === 'production_qualified'
  if (!qualified) throw new Error(`Music route ${route.routeKey} is not qualified for ${input.mode}.`)
}
