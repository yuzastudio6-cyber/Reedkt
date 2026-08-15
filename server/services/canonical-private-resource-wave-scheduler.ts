import {
  CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
  CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION,
  canonicalPrivateResourceLaneKey,
  type CanonicalPrivateExecutableWorkerType,
  type CanonicalPrivateResourcePlacementManifest,
  type CanonicalPrivateWorkItemResourcePlacement,
} from '../edit-architecture/canonical-private-resource-placement-authority'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PRIVATE_RESOURCE_WAVE_SCHEDULER_VERSION =
  'canonical-private-resource-wave-scheduler-v3' as const

const CANONICAL_PRIVATE_LOCAL_RESOURCE_CLASS_CONCURRENCY_LIMITS: Readonly<
  Record<CanonicalPrivateWorkItemResourcePlacement['resourceClassId'], number>
> = {
  control_plane_cpu_v1: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
  cpu_analysis_standard_v1: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
  gpu_l4_standard_v1: 1,
  render_cpu_high_memory_v1: 1,
  qa_cpu_standard_v1: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
  tool_readiness_cpu_v1: 1,
}

export interface CanonicalPrivateResourceSchedulableJob {
  id: string
  approvedWorkItemId: string
  dependencyJobIds: string[]
}

export interface CanonicalPrivateResourceWaveEntry<
  TJob extends CanonicalPrivateResourceSchedulableJob,
> {
  job: TJob
  placement: CanonicalPrivateWorkItemResourcePlacement
}

export interface CanonicalPrivateResourceWave<
  TJob extends CanonicalPrivateResourceSchedulableJob,
> {
  waveNumber: number
  entries: Array<CanonicalPrivateResourceWaveEntry<TJob>>
  workerCounts: Partial<Record<CanonicalPrivateExecutableWorkerType, number>>
  resourceLaneCounts: Record<string, number>
  resourceLaneConcurrencyLimits: Record<string, number>
  waveHash: string
}

export interface CanonicalPrivateResourceWaveResult<
  TJob extends CanonicalPrivateResourceSchedulableJob,
  TResult,
> {
  wave: CanonicalPrivateResourceWave<TJob>
  settled: Array<{
    entry: CanonicalPrivateResourceWaveEntry<TJob>
    status: 'fulfilled' | 'rejected'
    result?: TResult
    error?: unknown
  }>
  actualExecutionCount: number
  observedPeakConcurrency: number
  observedPeakConcurrencyByWorkerType:
    Partial<Record<CanonicalPrivateExecutableWorkerType, number>>
  observedPeakConcurrencyByResourceLane: Record<string, number>
  parallelExecutionObserved: boolean
}

export interface CanonicalPrivateResourceSchedulingEvidence {
  schedulerVersion: typeof CANONICAL_PRIVATE_RESOURCE_WAVE_SCHEDULER_VERSION
  placementPolicyVersion: typeof CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION
  placementManifestHash: string
  toolExecutionAuthorityHash: string
  approvedResourcePlacementAuthorityHash: string
  provenToolPlacementCatalogHash: string
  configuredGlobalMaxConcurrency: typeof CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY
  configuredWorkerConcurrencyLimits:
    Partial<Record<CanonicalPrivateExecutableWorkerType, number>>
  configuredLocalResourceLaneConcurrencyLimits: Record<string, number>
  waveCount: number
  parallelWaveCount: number
  maximumWaveWidth: number
  actualExecutionCount: number
  parallelJobCount: number
  observedPeakConcurrency: number
  observedPeakConcurrencyByWorkerType:
    Partial<Record<CanonicalPrivateExecutableWorkerType, number>>
  observedPeakConcurrencyByResourceLane: Record<string, number>
  resourceWaveHashes: string[]
  concurrencyMeasurementScope: 'in_process_orchestrator_execution_tasks'
  allStartsResourcePlacementAuthorized: true
  deterministicDependencyWaves: true
  callerSelectedConcurrency: false
  localSingleHostOnly: true
  localResourceLaneConcurrencyEnforced: true
  cloudDispatchAuthorized: false
  distributedExecutionProven: false
  physicalWorkerProcessConcurrencyProven: false
  cloudWorkerConcurrencyProven: false
  performanceSlaProven: false
  immutableSnapshotPlacementBindingProven: true
}

export function selectCanonicalPrivateResourceWave<
  TJob extends CanonicalPrivateResourceSchedulableJob,
>(input: {
  waveNumber: number
  jobs: readonly TJob[]
  remainingJobIds: ReadonlySet<string>
  completedJobIds: ReadonlySet<string>
  placementManifest: CanonicalPrivateResourcePlacementManifest
}): CanonicalPrivateResourceWave<TJob> | undefined {
  if (!Number.isSafeInteger(input.waveNumber) || input.waveNumber < 1) {
    throw new Error('Canonical resource wave number is invalid.')
  }
  const placements = new Map(input.placementManifest.placements.map((entry) => [entry.jobId, entry]))
  const entries: Array<CanonicalPrivateResourceWaveEntry<TJob>> = []
  const workerCounts: Partial<Record<CanonicalPrivateExecutableWorkerType, number>> = {}
  const resourceLaneCounts: Record<string, number> = {}
  const resourceLaneConcurrencyLimits: Record<string, number> = {}

  for (const job of input.jobs) {
    if (!input.remainingJobIds.has(job.id)) continue
    if (!job.dependencyJobIds.every((dependencyJobId) =>
      input.completedJobIds.has(dependencyJobId))) continue
    const placement = placements.get(job.id)
    if (!placement || placement.approvedWorkItemId !== job.approvedWorkItemId) {
      throw new Error('Canonical scheduler placement does not match its job lineage.')
    }
    if (entries.length >= CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY) break
    const workerCount = workerCounts[placement.workerType] ?? 0
    if (workerCount >= placement.workerConcurrencyLimit) continue
    const laneKey = canonicalPrivateResourceLaneKey(placement)
    const laneLimit = canonicalPrivateLocalResourceLaneConcurrencyLimit(placement)
    resourceLaneConcurrencyLimits[laneKey] = laneLimit
    if ((resourceLaneCounts[laneKey] ?? 0) >= laneLimit) continue
    entries.push({ job, placement })
    workerCounts[placement.workerType] = workerCount + 1
    resourceLaneCounts[laneKey] = (resourceLaneCounts[laneKey] ?? 0) + 1
  }
  if (entries.length === 0) return undefined
  const waveProjection = {
    schedulerVersion: CANONICAL_PRIVATE_RESOURCE_WAVE_SCHEDULER_VERSION,
    waveNumber: input.waveNumber,
    placementManifestHash: input.placementManifest.manifestHash,
    toolExecutionAuthorityHash:
      input.placementManifest.identity.toolExecutionAuthorityHash,
    approvedResourcePlacementAuthorityHash:
      input.placementManifest.identity.approvedResourcePlacementAuthorityHash,
    entries: entries.map(({ job, placement }) => ({
      jobId: job.id,
      approvedWorkItemId: job.approvedWorkItemId,
      dependencyJobIds: [...job.dependencyJobIds],
      placementHash: placement.placementHash,
      workerType: placement.workerType,
      resourceClassId: placement.resourceClassId,
    })),
    workerCounts,
    resourceLaneCounts,
    resourceLaneConcurrencyLimits,
  }
  return {
    waveNumber: input.waveNumber,
    entries,
    workerCounts,
    resourceLaneCounts,
    resourceLaneConcurrencyLimits,
    waveHash: sha256AuthorityValue(waveProjection),
  }
}

export async function executeCanonicalPrivateResourceWave<
  TJob extends CanonicalPrivateResourceSchedulableJob,
  TResult,
>(input: {
  wave: CanonicalPrivateResourceWave<TJob>
  execute(entry: CanonicalPrivateResourceWaveEntry<TJob>): Promise<TResult>
}): Promise<CanonicalPrivateResourceWaveResult<TJob, TResult>> {
  let active = 0
  let peak = 0
  const activeByWorker: Partial<Record<CanonicalPrivateExecutableWorkerType, number>> = {}
  const peakByWorker: Partial<Record<CanonicalPrivateExecutableWorkerType, number>> = {}
  const activeByResourceLane: Record<string, number> = {}
  const peakByResourceLane: Record<string, number> = {}
  const settled = await Promise.all(input.wave.entries.map(async (entry) => {
    const tracksActualExecution = entry.placement.privateExecutionReady
    const resourceLaneKey = canonicalPrivateResourceLaneKey(entry.placement)
    if (tracksActualExecution) {
      active += 1
      peak = Math.max(peak, active)
      const workerActive = (activeByWorker[entry.placement.workerType] ?? 0) + 1
      activeByWorker[entry.placement.workerType] = workerActive
      peakByWorker[entry.placement.workerType] = Math.max(
        peakByWorker[entry.placement.workerType] ?? 0,
        workerActive,
      )
      const resourceLaneActive = (activeByResourceLane[resourceLaneKey] ?? 0) + 1
      activeByResourceLane[resourceLaneKey] = resourceLaneActive
      peakByResourceLane[resourceLaneKey] = Math.max(
        peakByResourceLane[resourceLaneKey] ?? 0,
        resourceLaneActive,
      )
    }
    try {
      return {
        entry,
        status: 'fulfilled' as const,
        result: await input.execute(entry),
      }
    } catch (error) {
      return { entry, status: 'rejected' as const, error }
    } finally {
      if (tracksActualExecution) {
        active -= 1
        activeByWorker[entry.placement.workerType] =
          (activeByWorker[entry.placement.workerType] ?? 1) - 1
        activeByResourceLane[resourceLaneKey] =
          (activeByResourceLane[resourceLaneKey] ?? 1) - 1
      }
    }
  }))
  const actualExecutionCount = input.wave.entries.filter((entry) =>
    entry.placement.privateExecutionReady).length
  return {
    wave: input.wave,
    settled,
    actualExecutionCount,
    observedPeakConcurrency: peak,
    observedPeakConcurrencyByWorkerType: peakByWorker,
    observedPeakConcurrencyByResourceLane: peakByResourceLane,
    parallelExecutionObserved: peak > 1,
  }
}

export function createCanonicalPrivateResourceSchedulingEvidence(input: {
  placementManifest: CanonicalPrivateResourcePlacementManifest
  waveResults: readonly CanonicalPrivateResourceWaveResult<
    CanonicalPrivateResourceSchedulableJob,
    unknown
  >[]
}): CanonicalPrivateResourceSchedulingEvidence {
  const workerLimits: Partial<Record<CanonicalPrivateExecutableWorkerType, number>> = {}
  for (const placement of input.placementManifest.placements) {
    const existing = workerLimits[placement.workerType]
    if (existing !== undefined && existing !== placement.workerConcurrencyLimit) {
      throw new Error('Canonical placement manifest has conflicting worker concurrency limits.')
    }
    workerLimits[placement.workerType] = placement.workerConcurrencyLimit
  }
  const observedByWorker: Partial<Record<CanonicalPrivateExecutableWorkerType, number>> = {}
  const configuredByResourceLane: Record<string, number> = {}
  for (const placement of input.placementManifest.placements) {
    const laneKey = canonicalPrivateResourceLaneKey(placement)
    const laneLimit = canonicalPrivateLocalResourceLaneConcurrencyLimit(placement)
    const existing = configuredByResourceLane[laneKey]
    if (existing !== undefined && existing !== laneLimit) {
      throw new Error('Canonical placement manifest has conflicting local resource-lane limits.')
    }
    configuredByResourceLane[laneKey] = laneLimit
  }
  const observedByResourceLane: Record<string, number> = {}
  for (const result of input.waveResults) {
    for (const [rawWorkerType, peak] of Object.entries(
      result.observedPeakConcurrencyByWorkerType,
    )) {
      const workerType = rawWorkerType as CanonicalPrivateExecutableWorkerType
      observedByWorker[workerType] = Math.max(observedByWorker[workerType] ?? 0, peak ?? 0)
    }
    for (const [laneKey, peak] of Object.entries(
      result.observedPeakConcurrencyByResourceLane,
    )) {
      observedByResourceLane[laneKey] = Math.max(
        observedByResourceLane[laneKey] ?? 0,
        peak,
      )
    }
  }
  return {
    schedulerVersion: CANONICAL_PRIVATE_RESOURCE_WAVE_SCHEDULER_VERSION,
    placementPolicyVersion: CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION,
    placementManifestHash: input.placementManifest.manifestHash,
    toolExecutionAuthorityHash:
      input.placementManifest.identity.toolExecutionAuthorityHash,
    approvedResourcePlacementAuthorityHash:
      input.placementManifest.identity.approvedResourcePlacementAuthorityHash,
    provenToolPlacementCatalogHash:
      input.placementManifest.identity.provenToolPlacementCatalogHash,
    configuredGlobalMaxConcurrency: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    configuredWorkerConcurrencyLimits: workerLimits,
    configuredLocalResourceLaneConcurrencyLimits: configuredByResourceLane,
    waveCount: input.waveResults.length,
    parallelWaveCount: input.waveResults.filter((result) =>
      result.parallelExecutionObserved).length,
    maximumWaveWidth: Math.max(0, ...input.waveResults.map((result) =>
      result.wave.entries.length)),
    actualExecutionCount: input.waveResults.reduce((total, result) =>
      total + result.actualExecutionCount, 0),
    parallelJobCount: input.waveResults.reduce((total, result) =>
      total + (result.parallelExecutionObserved ? result.actualExecutionCount : 0), 0),
    observedPeakConcurrency: Math.max(0, ...input.waveResults.map((result) =>
      result.observedPeakConcurrency)),
    observedPeakConcurrencyByWorkerType: observedByWorker,
    observedPeakConcurrencyByResourceLane: observedByResourceLane,
    resourceWaveHashes: input.waveResults.map((result) => result.wave.waveHash),
    concurrencyMeasurementScope: 'in_process_orchestrator_execution_tasks',
    allStartsResourcePlacementAuthorized: true,
    deterministicDependencyWaves: true,
    callerSelectedConcurrency: false,
    localSingleHostOnly: true,
    localResourceLaneConcurrencyEnforced: true,
    cloudDispatchAuthorized: false,
    distributedExecutionProven: false,
    physicalWorkerProcessConcurrencyProven: false,
    cloudWorkerConcurrencyProven: false,
    performanceSlaProven: false,
    immutableSnapshotPlacementBindingProven: true,
  }
}

export function canonicalPrivateLocalResourceLaneConcurrencyLimit(
  placement: CanonicalPrivateWorkItemResourcePlacement,
): number {
  return Math.min(
    CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    placement.workerConcurrencyLimit,
    CANONICAL_PRIVATE_LOCAL_RESOURCE_CLASS_CONCURRENCY_LIMITS[
      placement.resourceClassId
    ],
  )
}
