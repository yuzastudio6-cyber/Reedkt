import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import { MUSIC_JOB_TYPES, type CanonicalMusicSkillRequest } from '../../music/music-contracts'
import { getMusicToolRouteManifest } from '../../music/music-tool-routes'
import { isCompositeMusicJob, resolveMusicCapabilityEntry } from './music-admission'

export interface MusicCapabilityModeMatrixEntry {
  capabilityKey: string
  jobType: string
  planningQualification: SkillQualificationStatus
  fixtureExecutionQualification: SkillQualificationStatus
  privateInternalQualification: SkillQualificationStatus
  productionQualification: SkillQualificationStatus
  requiredInputs: string[]
  routeKeys: string[]
  expectedOutputs: string[]
  acceptanceTestKey: string
  fixtureExecutionTestKey?: string
  privateInternalExecutionTestKey?: string
  productionExecutionTestKey?: string
  limitations: string[]
}

function best(
  values: readonly SkillQualificationStatus[],
): SkillQualificationStatus {
  const rank: Record<SkillQualificationStatus, number> = {
    blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
    planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
  }
  return values.reduce<SkillQualificationStatus>((winner, value) =>
    rank[value] > rank[winner] ? value : winner, 'blocked')
}

export const MUSIC_CAPABILITY_MODE_MATRIX: readonly MusicCapabilityModeMatrixEntry[] = Object.freeze(
  MUSIC_JOB_TYPES.map((jobType) => {
    const capability = resolveMusicCapabilityEntry({ jobType })
    if (!capability) throw new Error(`Missing Music capability matrix source for ${jobType}.`)
    const refs = [...capability.primaryRouteRefs, ...capability.fallbackRouteRefs, ...capability.lowerCostRouteRefs]
    const routes = refs.map((ref) => getMusicToolRouteManifest(ref.routeKey, ref.routeVersion))
      .filter((route): route is NonNullable<typeof route> => Boolean(route))
    const fixtureExecutionQualification: SkillQualificationStatus = isCompositeMusicJob(jobType)
      ? 'internal_execution_qualified'
      : capability.evidenceLevel === 'fixture' ? 'planning_qualified'
        : capability.qualificationStatus === 'internal_execution_qualified' ||
            capability.qualificationStatus === 'production_qualified'
          ? capability.qualificationStatus : 'blocked'
    const privateInternalQualification: SkillQualificationStatus = isCompositeMusicJob(jobType)
      ? 'internal_execution_qualified'
      : capability.qualificationStatus === 'internal_execution_qualified' ||
          capability.qualificationStatus === 'production_qualified'
        ? capability.qualificationStatus : 'blocked'
    const productionQualification: SkillQualificationStatus = capability.qualificationStatus === 'production_qualified'
      ? 'production_qualified' : 'blocked'
    return {
      capabilityKey: capability.capabilityKey,
      jobType,
      planningQualification: best(routes.map((route) => route.qualificationByMode.planning)),
      fixtureExecutionQualification,
      privateInternalQualification,
      productionQualification,
      requiredInputs: [...capability.requiredInputs],
      routeKeys: routes.map((route) => route.routeKey),
      expectedOutputs: [...capability.producedArtifactTypes],
      acceptanceTestKey: `music.acceptance.${jobType}.v1`,
      ...(fixtureExecutionQualification !== 'blocked'
        ? { fixtureExecutionTestKey: `music.acceptance.fixture.${jobType}.v1` } : {}),
      ...(privateInternalQualification !== 'blocked'
        ? { privateInternalExecutionTestKey: `music.acceptance.private.${jobType}.v1` } : {}),
      ...(productionQualification !== 'blocked'
        ? { productionExecutionTestKey: `music.acceptance.production.${jobType}.v1` } : {}),
      limitations: [...capability.knownLimitations],
    }
  }),
)

export function resolveMusicModeDisposition(input: {
  jobType: string
  mode: CanonicalMusicSkillRequest['requestedExecutionMode']
}): 'planning_only' | 'direct_execution' | 'composite_child_execution' | 'blocked' {
  const entry = MUSIC_CAPABILITY_MODE_MATRIX.find((candidate) => candidate.jobType === input.jobType)
  if (!entry) return 'blocked'
  if (input.mode === 'planning') return entry.planningQualification === 'blocked' ? 'blocked' : 'planning_only'
  if (isCompositeMusicJob(input.jobType) && input.mode !== 'production') return 'composite_child_execution'
  const status = input.mode === 'fixture' ? entry.fixtureExecutionQualification
    : input.mode === 'private_internal' ? entry.privateInternalQualification : entry.productionQualification
  if (input.mode === 'fixture') return status === 'blocked' ? 'blocked' : 'direct_execution'
  if (input.mode === 'private_internal') return status === 'internal_execution_qualified' || status === 'production_qualified'
    ? 'direct_execution' : 'blocked'
  return status === 'production_qualified' ? 'direct_execution' : 'blocked'
}

export function validateMusicCapabilityModeMatrix(): void {
  const jobs = new Set(MUSIC_JOB_TYPES)
  const matrixJobs = new Set(MUSIC_CAPABILITY_MODE_MATRIX.map((entry) => entry.jobType))
  if (matrixJobs.size !== jobs.size || [...jobs].some((job) => !matrixJobs.has(job))) {
    throw new Error('Every supported Music job must have exactly one capability matrix entry.')
  }
  for (const entry of MUSIC_CAPABILITY_MODE_MATRIX) {
    if (entry.routeKeys.length === 0) throw new Error(`Music matrix entry ${entry.jobType} has no exact route.`)
    if (entry.acceptanceTestKey.length === 0) throw new Error(`Music matrix entry ${entry.jobType} has no acceptance fixture.`)
    if (entry.fixtureExecutionQualification !== 'blocked' && !entry.fixtureExecutionTestKey) {
      throw new Error(`Music matrix entry ${entry.jobType} lacks fixture-execution evidence.`)
    }
    if (entry.privateInternalQualification !== 'blocked' && !entry.privateInternalExecutionTestKey) {
      throw new Error(`Music matrix entry ${entry.jobType} lacks private-execution evidence.`)
    }
    if (entry.productionQualification !== 'blocked' && !entry.productionExecutionTestKey) {
      throw new Error(`Music matrix entry ${entry.jobType} lacks production-execution evidence.`)
    }
  }
}
