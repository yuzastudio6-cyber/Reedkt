import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../../core/edit-skill-artifact-store'
import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import type {
  TrackAllCanonicalPrivateAtomicResult,
  TrackAllCanonicalPrivateAtomicStageExecutor,
  TrackAllCanonicalPrivateExecutionPackage,
  TrackAllCanonicalPrivateOperationDriver,
  TrackAllCanonicalPrivateOperationResult,
  TrackAllCanonicalPrivatePublicOutputProjector,
} from '../track-all-canonical-private-runtime'
import {
  aggregateTrackAllCanonicalPrivateExecutionCounts,
} from '../track-all-canonical-private-runtime'

const TRACK_ALL_SAM31_OPERATION = 'tool.sam3_1.track_masklets.v2' as const

/**
 * Owns exact approved atomic traversal and selects a stage executor solely from
 * the immutable operation ID in the plugin work graph. Callers cannot choose
 * the deterministic or SAM executor.
 */
export class TrackAllCanonicalPrivateCompositeOperationDriver
implements TrackAllCanonicalPrivateOperationDriver {
  readonly #artifactStore: EditSkillArtifactStore
  readonly #deterministic: TrackAllCanonicalPrivateAtomicStageExecutor &
    TrackAllCanonicalPrivatePublicOutputProjector
  readonly #sam31: TrackAllCanonicalPrivateAtomicStageExecutor | undefined
  readonly #now: () => string
  readonly #atomicResults = new Map<string, TrackAllCanonicalPrivateAtomicResult>()
  readonly #atomicToolOperations = new Map<string, readonly string[]>()
  readonly #publicResults = new Map<string, TrackAllCanonicalPrivateOperationResult>()

  constructor(input: {
    artifactStore: EditSkillArtifactStore
    deterministicStageExecutor: TrackAllCanonicalPrivateAtomicStageExecutor &
      TrackAllCanonicalPrivatePublicOutputProjector
    sam31StageExecutor?: TrackAllCanonicalPrivateAtomicStageExecutor
    now?: () => string
  }) {
    if (input.artifactStore.storageClass !== 'durable') {
      throw new Error('Track All composite driver requires durable private storage.')
    }
    this.#artifactStore = input.artifactStore
    this.#deterministic = input.deterministicStageExecutor
    this.#sam31 = input.sam31StageExecutor
    this.#now = input.now ?? (() => new Date().toISOString())
  }

  async execute(input: Parameters<TrackAllCanonicalPrivateOperationDriver['execute']>[0]):
  Promise<TrackAllCanonicalPrivateOperationResult> {
    const replay = this.#publicResults.get(input.invocation.workItemKey)
    if (replay) return replay
    const publicItem = input.execution.approvedWorkGraph.workItems.find((item) =>
      item.workItemKey === input.invocation.workItemKey)
    if (!publicItem || publicItem.jobType !== input.jobType) {
      throw new Error('Track All composite driver received work outside the approved public graph.')
    }
    const roots = input.execution.pluginWorkGraph.atomicWorkItems.filter((item) =>
      item.parentJobType === input.jobType)
    if (roots.length === 0) {
      throw new Error(`Track All public job ${input.jobType} has no approved atomic work.`)
    }
    const before = new Set(this.#atomicResults.keys())
    for (const item of roots) await this.#executeAtomic(item.workItemKey, input.execution)
    const closure = atomicClosureKeys(
      roots.map((item) => item.workItemKey),
      input.execution.pluginWorkGraph.atomicWorkItems,
    )
    const atomicResults = input.execution.pluginWorkGraph.atomicWorkItems
      .filter((item) => closure.has(item.workItemKey) && !before.has(item.workItemKey))
      .map((item) => this.#atomicResults.get(item.workItemKey)!)
    if (atomicResults.length === 0) {
      throw new Error('Track All composite public work produced no new atomic execution evidence.')
    }
    const output = await this.#deterministic.projectPublicOutput({
      jobType: input.jobType,
      execution: input.execution,
    })
    const result: TrackAllCanonicalPrivateOperationResult = {
      outputArtifact: { artifactType: input.definition.output, value: output },
      atomicResults,
      actualToolOperationIds: [...new Set(atomicResults.flatMap((atomic) =>
        this.#atomicToolOperations.get(atomic.workItemKey) ?? []))],
      executionCounts: aggregateTrackAllCanonicalPrivateExecutionCounts(
        atomicResults.map((atomic) => atomic.executionCounts),
      ),
    }
    this.#publicResults.set(input.invocation.workItemKey, result)
    return result
  }

  async #executeAtomic(
    workItemKey: string,
    execution: TrackAllCanonicalPrivateExecutionPackage,
  ): Promise<TrackAllCanonicalPrivateAtomicResult> {
    const replay = this.#atomicResults.get(workItemKey)
    if (replay) return replay
    const item = execution.pluginWorkGraph.atomicWorkItems.find((candidate) =>
      candidate.workItemKey === workItemKey)
    if (!item) throw new Error('Track All composite driver received unapproved atomic work.')
    const dependencies: TrackAllCanonicalPrivateAtomicResult[] = []
    for (const dependencyKey of item.dependencyKeys) {
      dependencies.push(await this.#executeAtomic(dependencyKey, execution))
    }
    const inputArtifactRefs = atomicInputs({
      artifactTypes: item.inputArtifactTypes,
      dependencies,
      execution,
      completed: [...this.#atomicResults.values()],
    })
    const executor = item.operationId === TRACK_ALL_SAM31_OPERATION
      ? this.#sam31
      : this.#deterministic
    if (!executor) {
      throw new Error(
        'Track All real SAM stage executor is unconfigured because its route is not qualified.',
      )
    }
    if (item.createsGpuWork && item.operationId !== TRACK_ALL_SAM31_OPERATION) {
      throw new Error('Track All composite driver rejected an unknown GPU atomic operation.')
    }
    const startedAt = this.#now()
    const stage = await executor.executeAtomicStage({
      item,
      execution,
      inputArtifactRefs,
      dependencyResults: dependencies,
    })
    const outputArtifactRef = await this.#artifactStore.putJson({
      artifactType: item.outputArtifactType,
      value: stage.value,
      ...artifactScope(execution),
    })
    const completedAt = this.#now()
    const operationEvidenceHash = hashSkillValue({
      schemaVersion: 'track_all_canonical_private_composite_atomic_operation_evidence_v1',
      approvedWorkGraphHash: execution.approvedWorkGraph.approvedWorkGraphHash,
      pluginWorkGraphHash: execution.pluginWorkGraph.artifactHash,
      workItemHash: item.workItemHash,
      operationId: item.operationId,
      inputArtifactHashes: inputArtifactRefs.map((reference) => reference.sha256),
      dependencyOutputHashes: dependencies.map((result) =>
        result.outputArtifactRef.sha256),
      outputArtifactHash: outputArtifactRef.sha256,
      stageEvidenceHashes: stage.evidenceHashes,
      actualToolOperationIds: stage.actualToolOperationIds,
      executionCounts: stage.executionCounts,
      outsideAuthorizedRangeModified: false,
    })
    const result: TrackAllCanonicalPrivateAtomicResult = {
      workItemKey: item.workItemKey,
      workItemHash: item.workItemHash,
      stageId: item.stageId,
      parentJobType: item.parentJobType,
      operationId: item.operationId,
      workerClass: item.workerClass,
      inputArtifactRefs,
      dependencyOutputRefs: dependencies.map((value) => value.outputArtifactRef),
      outputArtifactRef,
      evidenceHashes: [...new Set([...stage.evidenceHashes, operationEvidenceHash])],
      executionCounts: stage.executionCounts,
      status: 'succeeded',
      startedAt,
      completedAt,
      outsideAuthorizedRangeModified: false,
    }
    this.#atomicResults.set(item.workItemKey, result)
    this.#atomicToolOperations.set(item.workItemKey, stage.actualToolOperationIds)
    return result
  }
}

function atomicInputs(input: {
  artifactTypes: readonly string[]
  dependencies: readonly TrackAllCanonicalPrivateAtomicResult[]
  execution: TrackAllCanonicalPrivateExecutionPackage
  completed: readonly TrackAllCanonicalPrivateAtomicResult[]
}): EditSkillArtifactReference[] {
  return input.artifactTypes.map((artifactType) => {
    const dependency = [...input.dependencies].reverse().find((result) =>
      result.outputArtifactRef.artifactType === artifactType)
    if (dependency) return dependency.outputArtifactRef
    if (artifactType === 'track_all_plan_v1') return input.execution.publicPlan.payloadRef
    const initial = input.execution.initialArtifactRefs.filter((reference) =>
      reference.artifactType === artifactType)
    if (initial.length === 1) return initial[0]!
    const completed = [...input.completed].reverse().find((result) =>
      result.outputArtifactRef.artifactType === artifactType)
    if (completed) return completed.outputArtifactRef
    throw new Error(`Track All composite atomic work lacks exact ${artifactType} input authority.`)
  })
}

function atomicClosureKeys(
  rootKeys: readonly string[],
  items: TrackAllCanonicalPrivateExecutionPackage['pluginWorkGraph']['atomicWorkItems'],
): ReadonlySet<string> {
  const byKey = new Map(items.map((item) => [item.workItemKey, item]))
  const closure = new Set<string>()
  const visit = (key: string): void => {
    if (closure.has(key)) return
    const item = byKey.get(key)
    if (!item) throw new Error(`Track All atomic closure references unknown work ${key}.`)
    for (const dependencyKey of item.dependencyKeys) visit(dependencyKey)
    closure.add(key)
  }
  for (const rootKey of rootKeys) visit(rootKey)
  return closure
}

function artifactScope(execution: TrackAllCanonicalPrivateExecutionPackage) {
  return {
    ownerUserId: execution.assignment.ownerUserId,
    workspaceId: execution.assignment.workspaceId,
    projectId: execution.assignment.projectId,
  }
}
