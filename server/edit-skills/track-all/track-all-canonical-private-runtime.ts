import type { z } from 'zod'

import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../core/edit-skill-artifact-store'
import type {
  EditSkillProviderAuthority,
  EditSkillRuntime,
  EditSkillToolOperationRegistry,
} from '../core/edit-skill-runtime'
import type {
  SkillJobRuntimeAdapterResult,
  SkillJobRuntimeInvocation,
} from '../core/edit-skill-runtime-binding'
import { createEditSkillWorkResult, type EditSkillWorkResult } from '../core/edit-skill-work-result'
import {
  canonicalSkillJson,
  hashSkillValue,
} from '../core/skill-capability-manifest-hash'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
import type { SkillRouteQualificationRegistry } from '../core/skill-route-qualification'
import type { EditSkillArtifactSchemaRegistry } from '../core/edit-skill-artifact-store'
import {
  editSkillApprovedWorkGraphSchema,
  editSkillPlanApprovalSchema,
  editSkillPublicPlanSchema,
  type EditSkillApprovedWorkGraph,
  type EditSkillPlanApproval,
  type EditSkillPublicPlan,
  type EditSkillResultReceipt,
} from '../core/edit-skill-plugin'
import { assertSkillAssignment } from '../core/skill-range-authority'
import type { SkillAssignment } from '../core/skill-assignment-types'
import {
  trackAllAtomicExecutionEvidenceSchema,
  trackAllPublicWorkProjectionEvidenceSchema,
  trackAllWorkGraphArtifactSchema,
} from './track-all-active-artifact-contracts'
import {
  createTrackAllCanonicalPrivateRuntimeBindings,
  type TrackAllCanonicalPrivateWorkExecutor,
  type TrackAllPublicJobType,
  type TrackAllPublicWorkDefinition,
} from './track-all-work-graph'
import { trackAllPlanSchema, type TrackAllPlan } from './track-all-schemas'

export interface TrackAllCanonicalPrivateAtomicResult {
  workItemKey: string
  workItemHash: string
  stageId: string
  parentJobType: string
  operationId: string
  workerClass: string
  inputArtifactRefs: readonly EditSkillArtifactReference[]
  dependencyOutputRefs: readonly EditSkillArtifactReference[]
  outputArtifactRef: EditSkillArtifactReference
  evidenceHashes: readonly string[]
  status: 'succeeded'
  startedAt: string
  completedAt: string
  outsideAuthorizedRangeModified: false
}

export interface TrackAllCanonicalPrivateOperationResult {
  outputArtifact: { artifactType: string; value: unknown }
  atomicResults: readonly TrackAllCanonicalPrivateAtomicResult[]
  actualToolOperationIds: readonly string[]
  providerRequestCount: 0
  actualSamRequestCount: 0
  actualGpuExecutionCount: 0
}

export interface TrackAllCanonicalPrivateExecutionPackage {
  assignment: SkillAssignment
  publicPlan: EditSkillPublicPlan
  plan: TrackAllPlan
  approval: EditSkillPlanApproval
  approvedWorkGraph: EditSkillApprovedWorkGraph
  pluginWorkGraph: z.infer<typeof trackAllWorkGraphArtifactSchema>
  initialArtifactRefs: readonly EditSkillArtifactReference[]
}

export interface TrackAllCanonicalPrivateOperationDriver {
  execute(input: {
    jobType: TrackAllPublicJobType
    definition: TrackAllPublicWorkDefinition
    invocation: SkillJobRuntimeInvocation
    execution: TrackAllCanonicalPrivateExecutionPackage
  }): Promise<TrackAllCanonicalPrivateOperationResult>
}

/**
 * Exact graph-bound canonical adapter. It accepts no caller operation, command,
 * path, URL, model, GPU, retry, or price fields; those authorities live in the
 * injected server-owned operation driver.
 */
export class TrackAllCanonicalPrivateWorkExecutorImpl
implements TrackAllCanonicalPrivateWorkExecutor {
  readonly #execution: TrackAllCanonicalPrivateExecutionPackage
  readonly #driver: TrackAllCanonicalPrivateOperationDriver
  readonly #artifactStore: EditSkillArtifactStore
  readonly #results = new Map<string, SkillJobRuntimeAdapterResult>()
  readonly #atomicEvidenceRefs = new Map<string, EditSkillArtifactReference>()

  constructor(input: {
    execution: TrackAllCanonicalPrivateExecutionPackage
    operationDriver: TrackAllCanonicalPrivateOperationDriver
    artifactStore: EditSkillArtifactStore
  }) {
    this.#execution = assertExecutionPackage(input.execution)
    this.#driver = input.operationDriver
    this.#artifactStore = input.artifactStore
    if (input.artifactStore.storageClass !== 'durable') {
      throw new Error('Track All canonical execution requires a durable private artifact store.')
    }
  }

  async execute(
    jobType: TrackAllPublicJobType,
    definition: TrackAllPublicWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): Promise<SkillJobRuntimeAdapterResult> {
    this.#assertInvocation(jobType, definition, invocation)
    const replay = this.#results.get(invocation.workItemKey)
    if (replay) return replay
    const operation = await this.#driver.execute({
      jobType,
      definition,
      invocation,
      execution: this.#execution,
    })
    if (
      operation.outputArtifact.artifactType !== definition.output ||
      operation.providerRequestCount !== 0 ||
      operation.actualSamRequestCount !== 0 ||
      operation.actualGpuExecutionCount !== 0 ||
      operation.atomicResults.length === 0
    ) throw new Error('Track All canonical operation returned unapproved output or execution authority.')
    const graphItems = new Map(this.#execution.pluginWorkGraph.atomicWorkItems.map((item) => [
      item.workItemKey,
      item,
    ]))
    const atomicResults = operation.atomicResults.map((result) => {
      const item = graphItems.get(result.workItemKey)
      if (
        !item ||
        item.workItemHash !== result.workItemHash ||
        item.stageId !== result.stageId ||
        item.parentJobType !== result.parentJobType ||
        item.operationId !== result.operationId ||
        item.workerClass !== result.workerClass ||
        result.outsideAuthorizedRangeModified ||
        result.outputArtifactRef.ownerUserId !== this.#execution.assignment.ownerUserId ||
        result.outputArtifactRef.workspaceId !== this.#execution.assignment.workspaceId ||
        result.outputArtifactRef.projectId !== this.#execution.assignment.projectId
      ) throw new Error('Track All atomic result differs from the exact approved plugin graph.')
      return result
    })
    const lineage = executionLineage(this.#execution)
    const evidenceCore = {
      schemaVersion: 'track_all_atomic_execution_evidence_v1' as const,
      ...lineage,
      approvedWorkGraphHash: this.#execution.approvedWorkGraph.approvedWorkGraphHash,
      pluginWorkGraphHash: this.#execution.pluginWorkGraph.artifactHash,
      publicWorkItemKey: invocation.workItemKey,
      publicWorkItemHash: invocation.workItemHash,
      routeQualificationReceiptHash: invocation.routeQualificationReceiptHash,
      atomicResults,
      atomicWorkItemHashes: atomicResults.map((result) => result.workItemHash),
      actualToolOperationIds: [...new Set(operation.actualToolOperationIds)],
      actualSamRequestCount: 0 as const,
      actualGpuExecutionCount: 0 as const,
      prePersistedOutputAccepted: false as const,
      privateArtifactsOnly: true as const,
      outsideAuthorizedRangeModified: false as const,
    }
    const atomicEvidence = trackAllAtomicExecutionEvidenceSchema.parse({
      ...evidenceCore,
      artifactHash: hashSkillValue(evidenceCore),
    })
    const atomicEvidenceRef = await this.#artifactStore.putJson({
      artifactType: 'track_all_atomic_execution_evidence_v1',
      value: atomicEvidence,
      ...artifactScope(this.#execution.assignment),
    })
    const result: SkillJobRuntimeAdapterResult = {
      status: 'succeeded',
      outputArtifactTypes: [definition.output],
      evidenceHashes: [
        atomicEvidence.artifactHash,
        ...new Set(atomicResults.flatMap((value) => value.evidenceHashes)),
      ],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      outputArtifacts: [operation.outputArtifact],
    }
    this.#atomicEvidenceRefs.set(invocation.workItemKey, atomicEvidenceRef)
    this.#results.set(invocation.workItemKey, result)
    return result
  }

  atomicEvidenceRef(workItemKey: string): EditSkillArtifactReference {
    const reference = this.#atomicEvidenceRefs.get(workItemKey)
    if (!reference) throw new Error('Track All atomic execution evidence is unavailable for public projection.')
    return reference
  }

  #assertInvocation(
    jobType: TrackAllPublicJobType,
    definition: TrackAllPublicWorkDefinition,
    invocation: SkillJobRuntimeInvocation,
  ): void {
    const publicItem = this.#execution.approvedWorkGraph.workItems.find((item) =>
      item.workItemKey === invocation.workItemKey)
    if (
      invocation.mode !== 'canonical_private_execution_adapter' ||
      invocation.environmentClass !== 'canonical_private' ||
      invocation.binding.adapterClass !== 'canonical_private_execution_adapter' ||
      invocation.binding.environmentClass !== 'canonical_private' ||
      invocation.approvalHash !== this.#execution.approval.approvalHash ||
      invocation.assignmentId !== this.#execution.assignment.assignmentId ||
      invocation.assignmentHash !== this.#execution.assignment.assignmentHash ||
      invocation.binding.jobType !== jobType ||
      invocation.binding.operationId !== definition.operationId ||
      invocation.binding.workerClass !== definition.workerClass ||
      invocation.authorizedPhase !== definition.phase ||
      !publicItem ||
      publicItem.jobType !== jobType ||
      publicItem.operationId !== definition.operationId ||
      publicItem.workerClass !== definition.workerClass ||
      publicItem.workItemHash !== invocation.workItemHash
    ) throw new Error('Track All canonical adapter rejected stale or unapproved public work.')
  }
}

/** One registered executor per assignment; this is routing, not scheduling. */
export class TrackAllCanonicalPrivateExecutorRouter
implements TrackAllCanonicalPrivateWorkExecutor {
  readonly #executors = new Map<string, TrackAllCanonicalPrivateWorkExecutorImpl>()

  register(executor: TrackAllCanonicalPrivateWorkExecutorImpl, assignmentId: string): void {
    if (this.#executors.has(assignmentId)) {
      throw new Error('Track All canonical executor already owns this assignment.')
    }
    this.#executors.set(assignmentId, executor)
  }

  execute(
    jobType: TrackAllPublicJobType,
    definition: TrackAllPublicWorkDefinition,
    input: SkillJobRuntimeInvocation,
  ): Promise<SkillJobRuntimeAdapterResult> {
    const executor = this.#executors.get(input.assignmentId)
    if (!executor) throw new Error('Track All canonical executor is unconfigured for this assignment.')
    return executor.execute(jobType, definition, input)
  }
}

export interface TrackAllCanonicalPrivateRuntimeDependencies {
  artifactStore: EditSkillArtifactStore
  providerAuthority: EditSkillProviderAuthority
  toolRegistry: EditSkillToolOperationRegistry
  qaRegistry: SkillQaRegistry
  qualificationRegistry: SkillQualificationRegistry
  routeQualificationRegistry: SkillRouteQualificationRegistry
  estimatorRegistry: SkillEstimatorRegistry
  artifactSchemaRegistry: EditSkillArtifactSchemaRegistry
  privateArtifactAuthority: true
}

export async function createTrackAllCanonicalPrivateRuntime(
  input: TrackAllCanonicalPrivateRuntimeDependencies,
): Promise<{
  runtime: EditSkillRuntime
  executorRouter: TrackAllCanonicalPrivateExecutorRouter
}> {
  if (input.artifactStore.storageClass !== 'durable' || !input.privateArtifactAuthority) {
    throw new Error('Track All canonical runtime requires explicit durable private artifact authority.')
  }
  const executorRouter = new TrackAllCanonicalPrivateExecutorRouter()
  const { createEditSkillRuntime } = await import('../registry')
  const runtime = createEditSkillRuntime({
    environmentClass: 'canonical_private',
    ...input,
    additionalRuntimeBindings: createTrackAllCanonicalPrivateRuntimeBindings(executorRouter),
  })
  return { runtime, executorRouter }
}

export class TrackAllCanonicalPrivateExecutionCoordinator {
  readonly #runtime: EditSkillRuntime
  readonly #executor: TrackAllCanonicalPrivateWorkExecutorImpl
  readonly #execution: TrackAllCanonicalPrivateExecutionPackage

  constructor(input: {
    runtime: EditSkillRuntime
    executorRouter: TrackAllCanonicalPrivateExecutorRouter
    operationDriver: TrackAllCanonicalPrivateOperationDriver
    execution: TrackAllCanonicalPrivateExecutionPackage
  }) {
    if (input.runtime.environmentClass !== 'canonical_private') {
      throw new Error('Track All coordinator requires the canonical-private runtime environment.')
    }
    this.#runtime = input.runtime
    this.#execution = assertExecutionPackage(input.execution)
    this.#executor = new TrackAllCanonicalPrivateWorkExecutorImpl({
      execution: this.#execution,
      operationDriver: input.operationDriver,
      artifactStore: input.runtime.artifactStore,
    })
    input.executorRouter.register(this.#executor, this.#execution.assignment.assignmentId)
  }

  async executeApprovedGraph(): Promise<{
    workItemResults: readonly EditSkillWorkResult[]
    runtimeDispatchReceiptHashes: readonly string[]
    finalResult: EditSkillResultReceipt
  }> {
    const plugin = this.#runtime.pluginRegistry.resolve(this.#execution.assignment.manifestRef)
    const outputs = new Map<string, EditSkillArtifactReference[]>()
    const results: EditSkillWorkResult[] = []
    const runtimeDispatchReceiptHashes: string[] = []
    for (const workItem of this.#execution.approvedWorkGraph.workItems) {
      const missingDependency = workItem.dependencyKeys.find((key) => !outputs.has(key))
      if (missingDependency) {
        throw new Error(`Track All coordinator encountered unresolved predecessor ${missingDependency}.`)
      }
      const binding = this.#runtime.runtimeBindingRegistry.resolve({
        manifestRef: this.#execution.assignment.manifestRef,
        jobType: workItem.jobType,
        adapterClass: 'canonical_private_execution_adapter',
        environmentClass: 'canonical_private',
      })
      const exactInputArtifactRefs = exactInputs(
        binding.definition.inputArtifactTypes,
        this.#execution,
        outputs,
      )
      const dependencyOutputRefs = workItem.dependencyKeys.map((producerWorkItemKey) => {
        const producer = this.#execution.approvedWorkGraph.workItems.find((item) =>
          item.workItemKey === producerWorkItemKey)!
        const reference = outputs.get(producerWorkItemKey)?.[0]
        if (!reference) throw new Error('Track All predecessor has no exact output artifact.')
        return {
          reference,
          producerWorkItemKey,
          producerWorkItemHash: producer.workItemHash,
        }
      })
      const outcome = await this.#runtime.runtimeDispatcher.dispatchApprovedWorkItemOutcome({
        manifestRef: this.#execution.assignment.manifestRef,
        workItem,
        approval: this.#execution.approval,
        authorizedPhase: binding.definition.allowedPhases[0]!,
        exactInputArtifactRefs,
        dependencyOutputRefs,
        artifactScope: artifactScope(this.#execution.assignment),
      })
      if (outcome.adapterResult.status !== 'succeeded' ||
        !outcome.adapterResult.outputArtifacts) {
        throw new Error('Track All canonical required work failed before output projection.')
      }
      const outputArtifactRefs: EditSkillArtifactReference[] = []
      for (const artifact of outcome.adapterResult.outputArtifacts) {
        outputArtifactRefs.push(await this.#runtime.artifactStore.putJson({
          artifactType: artifact.artifactType,
          value: artifact.value,
          ...artifactScope(this.#execution.assignment),
        }))
      }
      const atomicExecutionEvidenceRef = this.#executor.atomicEvidenceRef(workItem.workItemKey)
      const projectionCore = {
        schemaVersion: 'track_all_public_work_projection_evidence_v1' as const,
        ...executionLineage(this.#execution),
        approvedWorkGraphHash: this.#execution.approvedWorkGraph.approvedWorkGraphHash,
        publicWorkItemKey: workItem.workItemKey,
        publicWorkItemHash: workItem.workItemHash,
        operationId: workItem.operationId,
        workerClass: workItem.workerClass,
        runtimeDispatchReceiptHash: outcome.receipt.receiptHash,
        routeQualificationReceiptHash: outcome.receipt.routeQualificationReceiptHash,
        atomicExecutionEvidenceRef,
        exactInputArtifactRefs,
        exactDependencyOutputRefs: dependencyOutputRefs.map((value) => value.reference),
        exactOutputArtifactRefs: outputArtifactRefs,
        outputCreatedByExecutingAdapter: true as const,
        callerQualificationAccepted: false as const,
        privateArtifactsOnly: true as const,
        outsideAuthorizedRangeModified: false as const,
      }
      const projection = trackAllPublicWorkProjectionEvidenceSchema.parse({
        ...projectionCore,
        artifactHash: hashSkillValue(projectionCore),
      })
      const projectionRef = await this.#runtime.artifactStore.putJson({
        artifactType: 'track_all_public_work_projection_evidence_v1',
        value: projection,
        ...artifactScope(this.#execution.assignment),
      })
      const workResult = createEditSkillWorkResult({
        schemaVersion: 'edit-skill-work-result-v1',
        workItemKey: workItem.workItemKey,
        workItemHash: workItem.workItemHash,
        assignmentId: this.#execution.assignment.assignmentId,
        assignmentHash: this.#execution.assignment.assignmentHash,
        planId: this.#execution.publicPlan.envelope.planId,
        planHash: this.#execution.publicPlan.envelope.planHash,
        manifestRef: this.#execution.assignment.manifestRef,
        authorizedRange: this.#execution.assignment.authorizedRange,
        operationId: workItem.operationId,
        workerClass: workItem.workerClass,
        status: 'succeeded',
        outputArtifactRefs,
        qaLineageKeys: workItem.qaLineageKeys,
        qaEvidenceArtifactRefs: [projectionRef],
        mutationRanges: visibleMutationJob(workItem.jobType)
          ? [this.#execution.assignment.authorizedRange]
          : [],
        callerSelectedExecutable: false,
        outsideAuthorizedRangeModified: false,
      })
      const validated = await plugin.validateWorkItemResult({
        assignment: this.#execution.assignment,
        plan: this.#execution.publicPlan,
        workGraph: this.#execution.approvedWorkGraph,
        result: workResult,
      })
      outputs.set(workItem.workItemKey, [...validated.outputArtifactRefs])
      results.push(validated)
      runtimeDispatchReceiptHashes.push(outcome.receipt.receiptHash)
    }
    const finalResult = await plugin.finalizeSkillResult({
      assignment: this.#execution.assignment,
      plan: this.#execution.publicPlan,
      workGraph: this.#execution.approvedWorkGraph,
      dependencyAcceptances: [],
      workItemResults: results,
    })
    return {
      workItemResults: Object.freeze(results),
      runtimeDispatchReceiptHashes: Object.freeze(runtimeDispatchReceiptHashes),
      finalResult,
    }
  }
}

function assertExecutionPackage(
  input: TrackAllCanonicalPrivateExecutionPackage,
): TrackAllCanonicalPrivateExecutionPackage {
  const assignment = assertSkillAssignment(input.assignment)
  const publicPlan = editSkillPublicPlanSchema.parse(input.publicPlan)
  const plan = trackAllPlanSchema.parse(input.plan)
  const approval = editSkillPlanApprovalSchema.parse(input.approval)
  const approvedWorkGraph = editSkillApprovedWorkGraphSchema.parse(input.approvedWorkGraph)
  const pluginWorkGraph = trackAllWorkGraphArtifactSchema.parse(input.pluginWorkGraph)
  const staleLineage = [
    ['public_plan_assignment', assignment.assignmentHash === publicPlan.envelope.assignmentHash],
    ['approval_assignment', assignment.assignmentHash === approval.assignmentHash],
    ['public_graph_assignment', assignment.assignmentHash === approvedWorkGraph.assignmentHash],
    ['plugin_graph_assignment', assignment.assignmentHash === pluginWorkGraph.assignmentHash],
    ['public_plan_payload', hashSkillValue(plan) === publicPlan.payloadRef.sha256],
    ['public_plan_id', plan.planId === publicPlan.envelope.planId],
    ['approval_plan_hash', publicPlan.envelope.planHash === approval.planHash],
    ['public_graph_plan_hash', publicPlan.envelope.planHash === approvedWorkGraph.planHash],
    ['plugin_graph_plan_hash', plan.planHash === pluginWorkGraph.planHash],
    ['approval_snapshot', approval.approvalHash === pluginWorkGraph.approvedSnapshotHash],
    ['public_plugin_graph_hash', approvedWorkGraph.pluginWorkGraphHash ===
      hashSkillValue(pluginWorkGraph)],
    ['public_plugin_graph_ref', approvedWorkGraph.pluginWorkGraphRef?.sha256 ===
      hashSkillValue(pluginWorkGraph)],
    ['authorized_range', canonicalSkillJson(assignment.authorizedRange) ===
      canonicalSkillJson(pluginWorkGraph.authorizedRange)],
  ].filter(([, valid]) => !valid).map(([key]) => key)
  if (staleLineage.length > 0) throw new Error(
    `Track All canonical execution package has stale lineage: ${staleLineage.join(', ')}.`,
  )
  const refs = input.initialArtifactRefs
  if (new Set(refs.map((reference) => canonicalSkillJson(reference))).size !== refs.length) {
    throw new Error('Track All canonical execution package contains duplicate initial artifacts.')
  }
  return Object.freeze({
    assignment,
    publicPlan,
    plan,
    approval,
    approvedWorkGraph,
    pluginWorkGraph,
    initialArtifactRefs: Object.freeze([...refs]),
  })
}

function exactInputs(
  requiredTypes: readonly string[],
  execution: TrackAllCanonicalPrivateExecutionPackage,
  outputs: ReadonlyMap<string, readonly EditSkillArtifactReference[]>,
): EditSkillArtifactReference[] {
  const candidates = [
    ...execution.initialArtifactRefs,
    execution.publicPlan.payloadRef,
    ...execution.publicPlan.evidenceRefs,
    ...[...outputs.values()].flat(),
  ]
  return requiredTypes.map((artifactType) => {
    const matches = candidates.filter((reference) => reference.artifactType === artifactType)
    const unique = [...new Map(matches.map((reference) => [
      canonicalSkillJson(reference),
      reference,
    ])).values()]
    if (unique.length !== 1) {
      throw new Error(`Track All coordinator requires one exact ${artifactType} input; found ${unique.length}.`)
    }
    return unique[0]!
  })
}

function executionLineage(input: TrackAllCanonicalPrivateExecutionPackage) {
  return {
    ownerUserId: input.assignment.ownerUserId,
    workspaceId: input.assignment.workspaceId,
    projectId: input.assignment.projectId,
    editSessionId: input.assignment.editSessionId,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planHash: input.plan.planHash,
    manifestRef: input.assignment.manifestRef,
    sourceSha256: input.pluginWorkGraph.sourceSha256,
    authorizedRange: input.assignment.authorizedRange,
  }
}

function artifactScope(assignment: SkillAssignment) {
  return {
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
  }
}

function visibleMutationJob(jobType: string): boolean {
  return [
    'track_all.apply_privacy_redaction',
    'track_all.apply_tracked_focus',
    'track_all.prepare_tracked_reframe',
    'track_all.integrate_preview',
  ].includes(jobType)
}
