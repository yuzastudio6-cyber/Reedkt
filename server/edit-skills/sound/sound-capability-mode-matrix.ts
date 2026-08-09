import type { CanonicalSoundRequest, CompositeSoundExecutionPolicy } from '../../sound/sound-contracts'
import { getSoundToolRouteManifest } from '../../sound/sound-tool-route-manifest'
import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import { isCompositeSoundExecutionJob, resolveSoundCapabilityEntry } from './sound-admission'

export type SoundCapabilityModeDisposition =
  | 'planning_only'
  | 'direct_execution'
  | 'composite_child_execution'
  | 'blocked'

export interface SoundCapabilityModeMatrixEntry {
  jobType: string
  mode: CanonicalSoundRequest['requiredQualificationMode']
  disposition: SoundCapabilityModeDisposition
  parentQualification: SkillQualificationStatus
  childRouteQualificationRequired?: SkillQualificationStatus | 'fixture_or_internal_execution_qualified'
  privateInternalExecution: boolean
  reason: string
}

const rank: Record<SkillQualificationStatus, number> = {
  blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
  planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
}

export function resolveSoundCapabilityModeMatrixEntry(input: {
  jobType: string
  mode: CanonicalSoundRequest['requiredQualificationMode']
}): SoundCapabilityModeMatrixEntry {
  const capability = resolveSoundCapabilityEntry({ jobType: input.jobType })
  if (!capability) return {
    ...input, disposition: 'blocked', parentQualification: 'blocked',
    privateInternalExecution: false, reason: 'capability_not_published',
  }
  if (input.mode === 'planning') return {
    ...input, disposition: 'planning_only', parentQualification: capability.qualificationStatus,
    privateInternalExecution: false, reason: 'planning_mode_never_mutates_media',
  }
  if (isCompositeSoundExecutionJob(input.jobType)) {
    if (input.mode === 'production') return {
      ...input, disposition: 'blocked', parentQualification: capability.qualificationStatus,
      childRouteQualificationRequired: 'production_qualified', privateInternalExecution: false,
      reason: 'composite_production_requires_production_qualified_child_routes',
    }
    return {
      ...input, disposition: 'composite_child_execution',
      parentQualification: capability.qualificationStatus,
      childRouteQualificationRequired: input.mode === 'fixture'
        ? 'fixture_or_internal_execution_qualified' : 'internal_execution_qualified',
      privateInternalExecution: input.mode === 'private_internal',
      reason: 'parent_bounds_work_and_every_child_route_is_admitted_independently',
    }
  }
  const required: SkillQualificationStatus = input.mode === 'production'
    ? 'production_qualified' : input.mode === 'private_internal'
      ? 'internal_execution_qualified' : 'planning_qualified'
  const admitted = rank[capability.qualificationStatus] >= rank[required] ||
    (input.mode === 'fixture' && capability.evidenceLevel === 'fixture')
  return {
    ...input,
    disposition: admitted ? 'direct_execution' : 'blocked',
    parentQualification: capability.qualificationStatus,
    childRouteQualificationRequired: required,
    privateInternalExecution: input.mode === 'private_internal' && admitted,
    reason: admitted ? 'capability_mode_qualification_satisfied' : 'capability_mode_qualification_blocked',
  }
}

export function validateSoundExecutionGraphMode(input: {
  jobType: string
  mode: CanonicalSoundRequest['requiredQualificationMode']
  compositePolicy?: CompositeSoundExecutionPolicy
  units: Array<{
    unitId: string
    unitKind: string
    route: { routeKey: string; routeVersion: string; routeHash: string }
  }>
}): void {
  const matrix = resolveSoundCapabilityModeMatrixEntry({ jobType: input.jobType, mode: input.mode })
  if (matrix.disposition === 'blocked') throw new Error(`Sound mode matrix blocked execution: ${matrix.reason}.`)
  if (matrix.disposition === 'planning_only') return
  if (matrix.disposition === 'composite_child_execution' && !input.compositePolicy) {
    throw new Error('Composite Sound execution requires its published child-route policy.')
  }
  for (const unit of input.units.filter((candidate) => candidate.unitKind !== 'planning_only')) {
    const route = getSoundToolRouteManifest(unit.route.routeKey, unit.route.routeVersion)
    if (!route || route.routeHash !== unit.route.routeHash) {
      throw new Error(`Sound mode matrix cannot resolve exact route for ${unit.unitId}.`)
    }
    const qualification = input.mode === 'production'
      ? route.qualificationByMode.final_execution
      : route.qualificationByMode.preview_execution
    const fixtureRoute = route.qualificationEvidenceRefs.some((evidence) => evidence.includes('injected_transport'))
    const admitted = input.mode === 'fixture'
      ? rank[qualification] >= rank.internal_execution_qualified || fixtureRoute
      : input.mode === 'private_internal'
        ? rank[qualification] >= rank.internal_execution_qualified
        : rank[qualification] >= rank.production_qualified
    if (!admitted) throw new Error(`Sound child route ${route.routeKey} is not qualified for ${input.mode}.`)
  }
}
