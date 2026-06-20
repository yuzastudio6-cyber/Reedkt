import type {
  ProductionToolId,
} from '../tool-registry'
import {
  buildFallbackPlanForPipeline,
} from './fallback-planner'
import type {
  PipelineFallbackPlan,
} from './fallback-planner'
import {
  buildQualityGatePlan,
} from './quality-gate-planner'
import type {
  ToolCallingQualityGatePlan,
} from './quality-gate-planner'
import {
  buildAdapterPlanForPipeline,
} from './adapter-planner'
import type {
  ToolAdapterPipelinePlan,
  ToolCallingWorkerRouteBridgePlan,
} from './adapter-contract-types'
import {
  buildSafeCommandPlansForAdapterPlans,
} from './safe-command-plan-builder'
import {
  validateSafeCommandPlans,
} from './safe-command-plan-validator'
import type {
  SafeCommandPlan,
  SafeCommandPlanValidationSummary,
} from './safe-command-plan-types'
import {
  buildSyntheticFixturePlansForCommandPlans,
} from './synthetic-fixture-planner'
import {
  validateSyntheticFixturePlans,
} from './synthetic-fixture-plan-validator'
import type {
  SyntheticFixturePlan,
  SyntheticFixturePlanValidationSummary,
} from './synthetic-fixture-plan-types'
import {
  materializeSyntheticFixtureDryRuns,
} from './synthetic-fixture-dry-run-materializer'
import {
  validateSyntheticFixtureDryRunResults,
} from './synthetic-fixture-dry-run-validator'
import type {
  SyntheticFixtureDryRunResult,
  SyntheticFixtureDryRunValidationSummary,
} from './synthetic-fixture-dry-run-types'
import {
  buildBinaryFixtureGenerationPlans,
  runBinaryFixtureGenerationPlans,
} from './binary-fixture-generation-runner'
import {
  validateBinaryFixtureGenerationResults,
} from './binary-fixture-generation-validator'
import type {
  BinaryFixtureGenerationPlan,
  BinaryFixtureGenerationResult,
  BinaryFixtureGenerationValidationSummary,
} from './binary-fixture-generation-types'
import {
  runControlledLowRiskReadinessProbes,
} from './controlled-low-risk-execution-runner'
import type {
  ControlledLowRiskReadinessProbeRun,
} from './controlled-low-risk-execution-types'
import {
  composePipelineForOperations,
  getPatternOperations,
} from './pipeline-composer'
import type {
  PipelinePatternId,
  ToolCallingPipeline,
} from './pipeline-composer'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolCallingMediaContext,
  ToolCallingMode,
  ToolCallingQualityTarget,
  ToolCallingRankingContext,
} from './tool-capability-card-types'

export interface BuildToolCallingPlanRequest {
  projectId: string
  mode: ToolCallingMode
  qualityTarget: ToolCallingQualityTarget
  requestedPatternId?: PipelinePatternId
  requestedOperations?: readonly ToolCallingOperationId[]
  userPreferenceTags?: readonly string[]
  mediaContext?: ToolCallingMediaContext
}

export interface ToolCallingPlanDiagnostics {
  sourceRegistry: 'server/tool-registry'
  sourceQAPolicy: 'server/tool-registry/tool-qa-policy.ts'
  sourceFallbackPolicy: 'server/tool-registry/tool-fallback-policy.ts'
  planningOnly: true
  executesTools: false
  operationCount: number
  pipelineStepCount: number
  selectedToolCount: number
  fallbackToolCount: number
  qualityGateCount: number
  warnings: readonly string[]
}

export interface ToolCallingPlan {
  planId: string
  mode: ToolCallingMode
  qualityTarget: ToolCallingQualityTarget
  operations: readonly ToolCallingOperationId[]
  pipeline: ToolCallingPipeline
  selectedTools: readonly ProductionToolId[]
  fallbackPlan: PipelineFallbackPlan
  qualityGatePlan: ToolCallingQualityGatePlan
  diagnostics: ToolCallingPlanDiagnostics
  executesTools: false
}

export interface ToolCallingPlanWithAdapters extends ToolCallingPlan {
  adapterPlan: ToolAdapterPipelinePlan
  workerRouteBridgePlan: readonly ToolCallingWorkerRouteBridgePlan[]
}

export interface ToolCallingPlanWithAdaptersAndCommandPlans extends ToolCallingPlanWithAdapters {
  safeCommandPlans: readonly SafeCommandPlan[]
  commandPlanValidationSummary: SafeCommandPlanValidationSummary
}

export interface ToolCallingPlanWithAdaptersCommandPlansAndFixtures extends ToolCallingPlanWithAdaptersAndCommandPlans {
  syntheticFixturePlans: readonly SyntheticFixturePlan[]
  fixtureValidationSummary: SyntheticFixturePlanValidationSummary
}

export interface ToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun extends ToolCallingPlanWithAdaptersCommandPlansAndFixtures {
  syntheticFixtureDryRunResults: readonly SyntheticFixtureDryRunResult[]
  dryRunValidationSummary: SyntheticFixtureDryRunValidationSummary
}

export interface ToolCallingPlanWithAdaptersCommandPlansFixturesDryRunAndBinaryFixtures extends ToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun {
  binaryFixtureGenerationPlans: readonly BinaryFixtureGenerationPlan[]
  binaryFixtureGenerationResults: readonly BinaryFixtureGenerationResult[]
  binaryFixtureValidationSummary: BinaryFixtureGenerationValidationSummary
}

function stableHash(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function uniqueOperations(
  patternId?: PipelinePatternId,
  requestedOperations: readonly ToolCallingOperationId[] = [],
): ToolCallingOperationId[] {
  const baseOperations = patternId ? getPatternOperations(patternId) : []
  return [...new Set([...baseOperations, ...requestedOperations])]
}

function buildRankingContext(request: BuildToolCallingPlanRequest): ToolCallingRankingContext {
  return {
    mode: request.mode,
    qualityTarget: request.qualityTarget,
    userPreferenceTags: request.userPreferenceTags,
    mediaContext: request.mediaContext,
  }
}

export function buildToolCallingPlan(request: BuildToolCallingPlanRequest): ToolCallingPlan {
  const operations = uniqueOperations(request.requestedPatternId, request.requestedOperations)
  if (operations.length === 0) {
    throw new Error('Tool-calling plan requires requestedPatternId or requestedOperations.')
  }

  const context = buildRankingContext(request)
  const pipeline = composePipelineForOperations(operations, context, request.requestedPatternId)
  const selectedTools = [...new Set(pipeline.steps.map((step) => step.selectedToolId))].sort()
  const fallbackPlan = buildFallbackPlanForPipeline(pipeline)
  const qualityGatePlan = buildQualityGatePlan(pipeline)
  const fallbackToolCount = new Set(fallbackPlan.tools.flatMap((toolPlan) => toolPlan.fallbackToolIds)).size
  const planKey = [
    request.projectId,
    request.mode,
    request.qualityTarget,
    request.requestedPatternId ?? 'custom',
    operations.join(','),
    request.userPreferenceTags?.join(',') ?? 'no_tags',
  ].join('|')

  return {
    planId: `tool_calling_plan_${stableHash(planKey)}`,
    mode: request.mode,
    qualityTarget: request.qualityTarget,
    operations,
    pipeline,
    selectedTools,
    fallbackPlan,
    qualityGatePlan,
    diagnostics: {
      sourceRegistry: 'server/tool-registry',
      sourceQAPolicy: 'server/tool-registry/tool-qa-policy.ts',
      sourceFallbackPolicy: 'server/tool-registry/tool-fallback-policy.ts',
      planningOnly: true,
      executesTools: false,
      operationCount: operations.length,
      pipelineStepCount: pipeline.steps.length,
      selectedToolCount: selectedTools.length,
      fallbackToolCount,
      qualityGateCount: qualityGatePlan.gateTypes.length,
      warnings: [],
    },
    executesTools: false,
  }
}

export function buildToolCallingPlanWithAdapters(request: BuildToolCallingPlanRequest): ToolCallingPlanWithAdapters {
  const plan = buildToolCallingPlan(request)
  const adapterPlan = buildAdapterPlanForPipeline(plan.pipeline)

  return {
    ...plan,
    adapterPlan,
    workerRouteBridgePlan: adapterPlan.workerRouteBridgePlans,
    executesTools: false,
  }
}

export function buildToolCallingPlanWithAdaptersAndCommandPlans(
  request: BuildToolCallingPlanRequest,
): ToolCallingPlanWithAdaptersAndCommandPlans {
  const plan = buildToolCallingPlanWithAdapters(request)
  const safeCommandPlans = buildSafeCommandPlansForAdapterPlans(plan.adapterPlan.adapterPlans)
  const commandPlanValidationSummary = validateSafeCommandPlans(safeCommandPlans)

  return {
    ...plan,
    safeCommandPlans,
    commandPlanValidationSummary,
    executesTools: false,
  }
}

export function buildToolCallingPlanWithAdaptersCommandPlansAndFixtures(
  request: BuildToolCallingPlanRequest,
): ToolCallingPlanWithAdaptersCommandPlansAndFixtures {
  const plan = buildToolCallingPlanWithAdaptersAndCommandPlans(request)
  const syntheticFixturePlans = buildSyntheticFixturePlansForCommandPlans(plan.safeCommandPlans)
  const fixtureValidationSummary = validateSyntheticFixturePlans(syntheticFixturePlans)

  return {
    ...plan,
    syntheticFixturePlans,
    fixtureValidationSummary,
    executesTools: false,
  }
}

export function buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun(
  request: BuildToolCallingPlanRequest,
): ToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun {
  const plan = buildToolCallingPlanWithAdaptersCommandPlansAndFixtures(request)
  const syntheticFixtureDryRunResults = materializeSyntheticFixtureDryRuns(plan.syntheticFixturePlans)
  const dryRunValidationSummary = validateSyntheticFixtureDryRunResults(syntheticFixtureDryRunResults)

  return {
    ...plan,
    syntheticFixtureDryRunResults,
    dryRunValidationSummary,
    executesTools: false,
  }
}

export async function buildToolCallingPlanWithAdaptersCommandPlansFixturesDryRunAndBinaryFixtures(
  request: BuildToolCallingPlanRequest,
): Promise<ToolCallingPlanWithAdaptersCommandPlansFixturesDryRunAndBinaryFixtures> {
  const plan = buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun(request)
  const binaryFixtureGenerationPlans = buildBinaryFixtureGenerationPlans(plan.syntheticFixtureDryRunResults)
  const binaryFixtureGenerationResults = await runBinaryFixtureGenerationPlans(binaryFixtureGenerationPlans, {
    cleanup: true,
  })
  const binaryFixtureValidationSummary = validateBinaryFixtureGenerationResults(
    binaryFixtureGenerationResults,
    binaryFixtureGenerationPlans,
  )

  return {
    ...plan,
    binaryFixtureGenerationPlans,
    binaryFixtureGenerationResults,
    binaryFixtureValidationSummary,
    executesTools: false,
  }
}

export async function runToolCallingControlledLowRiskReadinessProbes(): Promise<ControlledLowRiskReadinessProbeRun> {
  return runControlledLowRiskReadinessProbes()
}
