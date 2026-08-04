import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { resolveCompleteProfessionalToolOperationSpec } from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { CanonicalWorkItemInput } from '../validation/edit-planning-authority-schemas'

export const CANONICAL_ATOMIC_EXECUTION_DESCRIPTOR_VERSION =
  'canonical-atomic-tool-execution-descriptor-v1' as const
export const CANONICAL_ATOMIC_WORK_ITEM_AUTHORITY_VERSION =
  'canonical-atomic-work-item-authority-v1' as const
export const CANONICAL_WORK_ITEM_COMPILATION_VERSION =
  'canonical-work-item-compilation-v1' as const

const safeKey = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

const atomicStepSchema = z.object({
  stepKey: safeKey,
  toolId: safeKey,
  operationId: safeKey,
  workerClass: safeKey,
  expectedOutputKey: safeKey,
  executionInput: z.record(z.string(), z.unknown()),
  dependencyStepKeys: z.array(safeKey).max(64).default([]),
  maximumCreditBudget: z.number().int().nonnegative().max(10_000_000),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  attemptTimeoutSeconds: z.number().int().min(30).max(14_400).optional(),
  scheduledDelaySeconds: z.number().int().min(0).max(2_592_000).optional(),
}).strict()

export const canonicalAtomicExecutionDescriptorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_ATOMIC_EXECUTION_DESCRIPTOR_VERSION),
  steps: z.array(atomicStepSchema).min(1).max(64),
}).strict()

type AtomicExecutionDescriptor = z.infer<typeof canonicalAtomicExecutionDescriptorSchema>

interface PreparedSourceWorkItem {
  source: CanonicalWorkItemInput
  sourceHash: string
  descriptor?: AtomicExecutionDescriptor
  compiledKeyByStep: Map<string, string>
  terminalCompiledKeys: string[]
}

export interface CanonicalWorkItemCompilationEvidence {
  schemaVersion: typeof CANONICAL_WORK_ITEM_COMPILATION_VERSION
  sourceWorkItemCount: number
  compiledWorkItemCount: number
  decomposedSourceWorkItemCount: number
  sourceWorkGraphHash: string
  compiledWorkGraphDraftHash: string
  mappings: Array<{
    sourceWorkItemKey: string
    sourceWorkItemHash: string
    compiledWorkItemKeys: string[]
    terminalCompiledWorkItemKeys: string[]
    steps: Array<{
      stepKey: string
      compiledWorkItemKey: string
      toolId: string
      operationId: string
      expectedOutputKey: string
      dependencyStepKeys: string[]
    }>
  }>
  compilationHash: string
}

export function compileCanonicalWorkItems(
  sourceWorkItems: CanonicalWorkItemInput[],
): {
  workItems: CanonicalWorkItemInput[]
  evidence: CanonicalWorkItemCompilationEvidence
} {
  assertSourceGraph(sourceWorkItems)
  const prepared = sourceWorkItems.map(prepareSourceWorkItem)
  const preparedBySourceKey = new Map(prepared.map((item) => [item.source.workItemKey, item]))
  const compiled: CanonicalWorkItemInput[] = []

  for (const item of prepared) {
    const externalDependencyKeys = unique(item.source.dependencyKeys.flatMap((sourceDependencyKey) => {
      const dependency = preparedBySourceKey.get(sourceDependencyKey)
      if (!dependency) {
        throw invalidCompilation('Canonical source work graph contains an unknown dependency.', {
          workItemKey: item.source.workItemKey,
          dependencyKey: sourceDependencyKey,
        })
      }
      return dependency.terminalCompiledKeys
    }))

    if (!item.descriptor) {
      compiled.push({
        ...structuredClone(item.source),
        dependencyKeys: externalDependencyKeys,
      })
      continue
    }

    const outputByKey = new Map(item.source.expectedOutputs.map((output) => [output.outputKey, output]))
    for (const step of item.descriptor.steps) {
      const expectedOutput = outputByKey.get(step.expectedOutputKey)
      if (!expectedOutput) {
        throw invalidCompilation('Canonical atomic step output mapping is missing.', {
          workItemKey: item.source.workItemKey,
          stepKey: step.stepKey,
        })
      }
      const compiledWorkItemKey = item.compiledKeyByStep.get(step.stepKey)!
      const internalDependencies = step.dependencyStepKeys.map((dependencyStepKey) =>
        item.compiledKeyByStep.get(dependencyStepKey)!)
      const atomicAuthority = {
        schemaVersion: CANONICAL_ATOMIC_WORK_ITEM_AUTHORITY_VERSION,
        sourceWorkItemKey: item.source.workItemKey,
        sourceWorkItemHash: item.sourceHash,
        stepKey: step.stepKey,
        toolId: step.toolId,
        operationId: step.operationId,
        expectedOutputKey: step.expectedOutputKey,
      }
      compiled.push({
        workItemKey: compiledWorkItemKey,
        workItemType: item.source.workItemType,
        workerClass: step.workerClass,
        executionInput: {
          ...structuredClone(step.executionInput),
          canonicalAtomicAuthority: atomicAuthority,
        },
        sourceSequenceItemIds: [...item.source.sourceSequenceItemIds],
        sourceCleanupDecisionIds: [...item.source.sourceCleanupDecisionIds],
        expectedOutputs: [{
          ...expectedOutput,
          segmentIds: [...expectedOutput.segmentIds],
          timingIds: [...expectedOutput.timingIds],
          rendererLayerIds: [...expectedOutput.rendererLayerIds],
        }],
        dependencyKeys: unique([...externalDependencyKeys, ...internalDependencies]),
        approvedToolIds: [step.toolId],
        providerExecutionMode: 'none',
        fallbackPolicy: structuredClone(item.source.fallbackPolicy),
        maxAttempts: step.maxAttempts ?? item.source.maxAttempts,
        attemptTimeoutSeconds:
          step.attemptTimeoutSeconds ?? item.source.attemptTimeoutSeconds,
        scheduledDelaySeconds:
          step.scheduledDelaySeconds ?? item.source.scheduledDelaySeconds,
        maximumCreditBudget: step.maximumCreditBudget,
        required: item.source.required && expectedOutput.required,
      })
    }
  }

  if (compiled.length > 256 || new Set(compiled.map((item) => item.workItemKey)).size !== compiled.length) {
    throw invalidCompilation('Canonical atomic work-item compilation exceeded graph identity limits.', {
      compiledWorkItemCount: compiled.length,
    })
  }

  const mappings = prepared.flatMap((item) => item.descriptor ? [{
    sourceWorkItemKey: item.source.workItemKey,
    sourceWorkItemHash: item.sourceHash,
    compiledWorkItemKeys: item.descriptor.steps.map((step) => item.compiledKeyByStep.get(step.stepKey)!),
    terminalCompiledWorkItemKeys: [...item.terminalCompiledKeys],
    steps: item.descriptor.steps.map((step) => ({
      stepKey: step.stepKey,
      compiledWorkItemKey: item.compiledKeyByStep.get(step.stepKey)!,
      toolId: step.toolId,
      operationId: step.operationId,
      expectedOutputKey: step.expectedOutputKey,
      dependencyStepKeys: [...step.dependencyStepKeys],
    })),
  }] : [])
  const evidenceWithoutHash = {
    schemaVersion: CANONICAL_WORK_ITEM_COMPILATION_VERSION,
    sourceWorkItemCount: sourceWorkItems.length,
    compiledWorkItemCount: compiled.length,
    decomposedSourceWorkItemCount: mappings.length,
    sourceWorkGraphHash: sha256AuthorityValue(sourceWorkItems),
    compiledWorkGraphDraftHash: sha256AuthorityValue(compiled),
    mappings,
  }
  return {
    workItems: compiled,
    evidence: {
      ...evidenceWithoutHash,
      compilationHash: sha256AuthorityValue(evidenceWithoutHash),
    },
  }
}

function prepareSourceWorkItem(source: CanonicalWorkItemInput): PreparedSourceWorkItem {
  if (
    new Set(source.expectedOutputs.map((output) => output.outputKey)).size !==
      source.expectedOutputs.length ||
    new Set(source.approvedToolIds).size !== source.approvedToolIds.length
  ) {
    throw invalidCompilation('Canonical source work-item output and tool identities must be unique.', {
      workItemKey: source.workItemKey,
    })
  }
  const rawDescriptor = source.executionInput.canonicalAtomicExecution
  const requiredOutputCount = source.expectedOutputs.filter((output) => output.required).length
  const requiresAtomicCompilation = source.approvedToolIds.length > 1 || requiredOutputCount > 1
  if (!requiresAtomicCompilation) {
    if (rawDescriptor !== undefined) {
      throw invalidCompilation(
        'Canonical atomic execution metadata is allowed only when an approved work item requires decomposition.',
        { workItemKey: source.workItemKey },
      )
    }
    return {
      source,
      sourceHash: sha256AuthorityValue(source),
      compiledKeyByStep: new Map(),
      terminalCompiledKeys: [source.workItemKey],
    }
  }
  if (source.approvedToolIds.length === 0) {
    throw notReady(
      'Tool-free canonical work items with multiple required outputs need a separately approved internal-step compiler.',
      'canonical_atomic_internal_work_item_compiler',
      source.workItemKey,
    )
  }
  if (source.approvedProviderRoute || source.providerExecutionMode !== 'none') {
    throw notReady(
      'Provider-backed grouped work cannot be compiled into private tool jobs.',
      'canonical_provider_atomic_work_item_compiler',
      source.workItemKey,
    )
  }
  if (['render_final_export', 'run_final_qa'].includes(source.workItemType)) {
    throw notReady(
      'Terminal render and final-QA authority must remain one unambiguous canonical job.',
      'canonical_terminal_multi_step_review_contract',
      source.workItemKey,
    )
  }
  const parsed = canonicalAtomicExecutionDescriptorSchema.safeParse(rawDescriptor)
  if (!parsed.success) {
    throw notReady(
      'Grouped canonical tool work requires an explicit valid atomic execution descriptor.',
      'canonical_atomic_work_item_step_contract',
      source.workItemKey,
      parsed.error.flatten(),
    )
  }
  const descriptor = parsed.data
  validateAtomicDescriptor(source, descriptor)
  const compiledKeyByStep = new Map(descriptor.steps.map((step) => [
    step.stepKey,
    atomicWorkItemKey(source.workItemKey, step.stepKey),
  ]))
  const dependedOnStepKeys = new Set(descriptor.steps.flatMap((step) => step.dependencyStepKeys))
  return {
    source,
    sourceHash: sha256AuthorityValue(source),
    descriptor,
    compiledKeyByStep,
    terminalCompiledKeys: descriptor.steps
      .filter((step) => !dependedOnStepKeys.has(step.stepKey))
      .map((step) => compiledKeyByStep.get(step.stepKey)!),
  }
}

function validateAtomicDescriptor(
  source: CanonicalWorkItemInput,
  descriptor: AtomicExecutionDescriptor,
): void {
  const stepKeys = descriptor.steps.map((step) => step.stepKey)
  const outputKeys = descriptor.steps.map((step) => step.expectedOutputKey)
  if (
    new Set(source.approvedToolIds).size !== source.approvedToolIds.length ||
    new Set(stepKeys).size !== stepKeys.length ||
    new Set(outputKeys).size !== outputKeys.length ||
    descriptor.steps.some((step) =>
      step.dependencyStepKeys.includes(step.stepKey) ||
      new Set(step.dependencyStepKeys).size !== step.dependencyStepKeys.length ||
      step.dependencyStepKeys.some((dependency) => !stepKeys.includes(dependency)))
  ) {
    throw invalidCompilation('Canonical atomic step identities or dependencies are invalid.', {
      workItemKey: source.workItemKey,
    })
  }
  assertAcyclicSteps(source.workItemKey, descriptor)

  const sourceOutputKeys = [...source.expectedOutputs.map((output) => output.outputKey)].sort()
  const mappedOutputKeys = [...outputKeys].sort()
  if (!sameStrings(sourceOutputKeys, mappedOutputKeys)) {
    throw invalidCompilation('Canonical atomic steps must map every expected output exactly once.', {
      workItemKey: source.workItemKey,
      expectedOutputKeys: sourceOutputKeys,
    })
  }

  const sourceTools = [...source.approvedToolIds].sort()
  const stepTools = unique(descriptor.steps.map((step) => step.toolId)).sort()
  if (!sameStrings(sourceTools, stepTools)) {
    throw invalidCompilation('Canonical atomic steps must use exactly the source work item tools.', {
      workItemKey: source.workItemKey,
      approvedToolIds: sourceTools,
    })
  }
  const expectedOperationIds = sourceTools.map((toolId) => {
    const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
    if (
      !spec ||
      spec.canonicalToolId !== toolId ||
      spec.disposition !== 'edit_operation_candidate' ||
      spec.policyBlocks.length > 0 ||
      spec.allowedOperationIds.length !== 1
    ) {
      throw notReady(
        'Canonical atomic step references a non-callable or ambiguous tool operation.',
        'canonical_tool_operation_contract',
        source.workItemKey,
        { toolId },
      )
    }
    return spec.allowedOperationIds[0]!
  }).sort()
  const rawSourceOperationIds = source.executionInput.approvedToolOperationIds
  if (
    !Array.isArray(rawSourceOperationIds) ||
    rawSourceOperationIds.some((operationId) => typeof operationId !== 'string') ||
    !sameStrings(expectedOperationIds, [...rawSourceOperationIds as string[]].sort())
  ) {
    throw invalidCompilation('Grouped canonical work item operation authority is inconsistent.', {
      workItemKey: source.workItemKey,
      expectedOperationIds,
    })
  }
  for (const step of descriptor.steps) {
    const spec = resolveCompleteProfessionalToolOperationSpec(step.toolId)
    const stepOperationIds = step.executionInput.approvedToolOperationIds
    if (
      !spec ||
      spec.allowedOperationIds.length !== 1 ||
      spec.allowedOperationIds[0] !== step.operationId ||
      !Array.isArray(stepOperationIds) ||
      stepOperationIds.length !== 1 ||
      stepOperationIds[0] !== step.operationId ||
      step.executionInput.canonicalAtomicExecution !== undefined ||
      step.executionInput.canonicalAtomicAuthority !== undefined
    ) {
      throw invalidCompilation('Canonical atomic step execution authority is inconsistent.', {
        workItemKey: source.workItemKey,
        stepKey: step.stepKey,
      })
    }
  }

  const stepBudget = descriptor.steps.reduce((total, step) => total + step.maximumCreditBudget, 0)
  if (stepBudget !== source.maximumCreditBudget) {
    throw invalidCompilation('Canonical atomic step budgets must exactly conserve the approved work-item budget.', {
      workItemKey: source.workItemKey,
      sourceMaximumCreditBudget: source.maximumCreditBudget,
      atomicMaximumCreditBudget: stepBudget,
    })
  }
}

function assertSourceGraph(sourceWorkItems: CanonicalWorkItemInput[]): void {
  const sourceKeys = sourceWorkItems.map((item) => item.workItemKey)
  if (new Set(sourceKeys).size !== sourceKeys.length) {
    throw invalidCompilation('Canonical source work-item keys must be unique.')
  }
  for (const item of sourceWorkItems) {
    if (
      new Set(item.dependencyKeys).size !== item.dependencyKeys.length ||
      item.dependencyKeys.includes(item.workItemKey) ||
      item.dependencyKeys.some((dependency) => !sourceKeys.includes(dependency))
    ) {
      throw invalidCompilation('Canonical source work graph dependencies are invalid.', {
        workItemKey: item.workItemKey,
      })
    }
  }
  const byKey = new Map(sourceWorkItems.map((item) => [item.workItemKey, item]))
  assertAcyclicGraph(sourceKeys, (key) => byKey.get(key)?.dependencyKeys ?? [], 'source work graph')
}

function assertAcyclicSteps(workItemKey: string, descriptor: AtomicExecutionDescriptor): void {
  const byKey = new Map(descriptor.steps.map((step) => [step.stepKey, step]))
  assertAcyclicGraph(
    descriptor.steps.map((step) => step.stepKey),
    (key) => byKey.get(key)?.dependencyStepKeys ?? [],
    `atomic steps for ${workItemKey}`,
  )
}

function assertAcyclicGraph(
  keys: string[],
  dependencies: (key: string) => string[],
  label: string,
): void {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (key: string) => {
    if (visiting.has(key)) throw invalidCompilation(`Canonical ${label} contains a dependency cycle.`, { key })
    if (visited.has(key)) return
    visiting.add(key)
    for (const dependency of dependencies(key)) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }
  for (const key of keys) visit(key)
}

function atomicWorkItemKey(sourceWorkItemKey: string, stepKey: string): string {
  return `atomic:${sha256AuthorityValue({
    schemaVersion: CANONICAL_ATOMIC_WORK_ITEM_AUTHORITY_VERSION,
    sourceWorkItemKey,
    stepKey,
  }).slice(0, 48)}`
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function notReady(
  message: string,
  requiredGate: string,
  workItemKey: string,
  details?: unknown,
): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate,
    workItemKey,
    ...(details === undefined ? {} : { details }),
  })
}

function invalidCompilation(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, details)
}
