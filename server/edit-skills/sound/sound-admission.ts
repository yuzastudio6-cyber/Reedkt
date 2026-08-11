import type { SkillCapabilityEntryDefinition } from '../core/skill-capability-manifest-types'
import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import type { CanonicalSoundRequest } from '../../sound/sound-contracts'
import { soundSkillCapabilityManifest } from './sound-capability-manifest'

const compositeExecutionJobs = new Set([
  'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
  'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
  'support_transition_sound', 'support_graphic_design_sound',
])

export function isCompositeSoundExecutionJob(jobType: string): boolean {
  return compositeExecutionJobs.has(jobType)
}

export interface StandaloneSoundAssignmentPlan {
  ok: boolean
  status: 'eligible' | 'blocked'
  blockCode?: 'unsupported_capability' | 'qualification_blocked' | 'scope_not_supported' | 'caller_not_supported' | 'time_limit_exceeded' | 'credit_limit_exceeded'
  reasons: string[]
  binding?: {
    skillKey: 'sound'
    skillVersion: string
    manifestSchemaVersion: string
    manifestHash: string
    capabilityKey: string
    capabilityVersion: string
    qualificationStatus: SkillQualificationStatus
  }
  dependencies: string[]
  primaryToolRoutes: Array<{ routeKey: string }>
  fallbackRoutes: Array<{ routeKey: string }>
  lowerCostRoutes: Array<{ routeKey: string }>
  timeEstimate?: { minimum: number; expected: number; maximum: number; unit: 'minutes' }
  creditEstimate?: { minimum: number; expected: number; maximum: number; unit: 'credits' }
}

export function resolveSoundCapabilityEntry(input: {
  capabilityKey?: string
  jobType: string
}): SkillCapabilityEntryDefinition | undefined {
  return soundSkillCapabilityManifest.capabilityEntries?.find((entry) =>
    entry.supportedJobTypes.includes(input.jobType) &&
    (!input.capabilityKey || entry.capabilityKey === input.capabilityKey))
}

export function qualificationSupportsSoundRequest(
  entry: SkillCapabilityEntryDefinition,
  mode: CanonicalSoundRequest['requiredQualificationMode'],
): boolean {
  if (entry.qualificationStatus === 'blocked' || entry.qualificationStatus === 'retired' ||
    entry.qualificationStatus === 'implementation_pending' || entry.qualificationStatus === 'declared') return false
  if (mode === 'planning') return true
  if (isCompositeSoundExecutionJob(entry.supportedJobTypes[0] ?? '')) {
    // The parent capability plans and bounds work. Execution qualification is
    // evaluated independently for every exact child route in the compiled graph.
    return mode === 'fixture' || mode === 'private_internal'
  }
  if (mode === 'fixture') return entry.evidenceLevel === 'fixture' || entry.evidenceLevel === 'internal_execution' || entry.evidenceLevel === 'production'
  if (mode === 'private_internal') return entry.qualificationStatus === 'internal_execution_qualified' ||
    entry.qualificationStatus === 'production_qualified'
  return entry.qualificationStatus === 'production_qualified'
}

export function planStandaloneSoundAssignment(input: {
  request: CanonicalSoundRequest
  durationSeconds: number
  providerDurationSeconds: number
  localOperationCount: number
}): StandaloneSoundAssignmentPlan {
  const entry = resolveSoundCapabilityEntry({
    capabilityKey: input.request.requestedCapabilityKey,
    jobType: input.request.requestedJobType,
  })
  if (!entry) return blocked('unsupported_capability', ['sound_capability_not_published'])
  if (!qualificationSupportsSoundRequest(entry, input.request.requiredQualificationMode)) {
    return blocked('qualification_blocked', [
      `${entry.capabilityKey}:${entry.qualificationStatus}:${entry.evidenceLevel}:${input.request.requiredQualificationMode}`,
    ])
  }
  const caller = input.request.callerType === 'head_of_orchestra' ? 'orchestra' : input.request.callerType
  if (!entry.acceptedCallerTypes.includes(caller)) return blocked('caller_not_supported', ['caller_not_accepted'])
  const scope = input.request.assignmentScope.assignmentMode === 'whole_video'
    ? 'video'
    : input.request.assignmentScope.assignmentMode
  if (!entry.supportedScopes.includes(scope)) return blocked('scope_not_supported', ['scope_not_supported'])
  const provider = input.providerDurationSeconds > 0
  const expectedMinutes = Math.max(1, Math.ceil(
    2 + input.durationSeconds / 120 + input.localOperationCount * 0.5 + (provider ? 4 : 0),
  ))
  const expectedCredits = provider
    ? Math.max(1, Math.ceil(input.providerDurationSeconds * input.request.costPolicy.candidateCount))
    : input.localOperationCount > 0 ? Math.max(1, input.localOperationCount) : 0
  if (expectedMinutes > input.request.latencyPolicy.maximumExpectedSeconds / 60) {
    return blocked('time_limit_exceeded', ['sound_estimate_exceeds_latency_policy'])
  }
  if (expectedCredits > input.request.costPolicy.maximumCredits) {
    return blocked('credit_limit_exceeded', ['sound_estimate_exceeds_credit_policy'])
  }
  return {
    ok: true,
    status: 'eligible',
    reasons: [],
    binding: {
      skillKey: 'sound',
      skillVersion: soundSkillCapabilityManifest.skillVersion,
      manifestSchemaVersion: soundSkillCapabilityManifest.schemaVersion,
      manifestHash: soundSkillCapabilityManifest.manifestHash,
      capabilityKey: entry.capabilityKey,
      capabilityVersion: entry.capabilityVersion,
      qualificationStatus: entry.qualificationStatus,
    },
    dependencies: [...soundSkillCapabilityManifest.mustRunAfter],
    primaryToolRoutes: entry.primaryRouteRefs.map(({ routeKey }) => ({ routeKey })),
    fallbackRoutes: entry.fallbackRouteRefs.map(({ routeKey }) => ({ routeKey })),
    lowerCostRoutes: entry.lowerCostRouteRefs.map(({ routeKey }) => ({ routeKey })),
    timeEstimate: {
      minimum: Math.max(1, Math.floor(expectedMinutes * 0.5)), expected: expectedMinutes,
      maximum: expectedMinutes * 3, unit: 'minutes',
    },
    creditEstimate: {
      minimum: expectedCredits === 0 ? 0 : 1, expected: expectedCredits,
      maximum: provider ? expectedCredits * 2 : expectedCredits, unit: 'credits',
    },
  }
}

function blocked(
  blockCode: NonNullable<StandaloneSoundAssignmentPlan['blockCode']>,
  reasons: string[],
): StandaloneSoundAssignmentPlan {
  return {
    ok: false, status: 'blocked', blockCode, reasons, dependencies: [],
    primaryToolRoutes: [], fallbackRoutes: [], lowerCostRoutes: [],
  }
}
