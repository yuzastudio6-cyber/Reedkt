import type { RuntimeEnv } from '../config/env'
import type { QwenLongFormSemanticChunkProvider } from '../services/qwen-long-form-semantic-chunk-provider'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'
import {
  executeEditReferenceLongFormSemanticChunkStage,
  type EditReferenceLongFormSemanticChunkStageAuthority,
} from './edit-reference-long-form-semantic-chunk-stage'
import {
  createEditReferenceLongFormSemanticWindowPlan,
  type EditReferenceLongFormSemanticWindowPlan,
} from './edit-reference-long-form-semantic-window-contract'
import {
  dispatchEditReferenceLongFormSemanticWindows,
  type EditReferenceLongFormSemanticWindowDispatchProgress,
  type EditReferenceLongFormSemanticWindowDispatchResult,
  type EditReferenceLongFormSemanticWindowSpecialistRequest,
} from './edit-reference-long-form-semantic-window-dispatcher'
import {
  createEditReferenceLongFormSemanticWindowSpecialistExecutor,
  type ResolveEditReferenceLongFormSemanticWindowRuntime,
} from './edit-reference-long-form-semantic-window-specialist-executor'
import type { EditReferenceLongFormStudyWorkOutput } from './edit-reference-long-form-study-work-output'
import { PrivateEditReferenceLongFormStudyRepository } from './private-edit-reference-long-form-study-repository'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_STAGE_EXECUTOR_VERSION =
  'edit-reference-long-form-semantic-window-stage-executor-v2' as const

export interface ExecuteEditReferenceLongFormSemanticWindowStageOptions {
  readonly env: RuntimeEnv
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
  readonly specialistExecutionScope: 'controlled_test' | 'production'
  readonly resolveSpecialistRuntime: ResolveEditReferenceLongFormSemanticWindowRuntime
  readonly resolveAttemptNumber?: (
    request: Omit<EditReferenceLongFormSemanticWindowSpecialistRequest, 'attemptNumber' | 'submissionIdempotencyKey'>,
  ) => Promise<number>
  readonly semanticChunkAuthority: EditReferenceLongFormSemanticChunkStageAuthority
  readonly semanticChunkProvider?: QwenLongFormSemanticChunkProvider
  readonly onProgress?: (
    progress: EditReferenceLongFormSemanticWindowDispatchProgress,
  ) => Promise<void> | void
  readonly now?: () => string
}

export interface ExecuteEditReferenceLongFormSemanticWindowStageResult {
  readonly output: EditReferenceLongFormStudyWorkOutput
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly dispatch: EditReferenceLongFormSemanticWindowDispatchResult
  readonly originalRemainsImmutable: true
  readonly partialCompletionClaimed: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

/**
 * Product-facing bridge for one semantic section. It reconstructs the exact
 * provider-local window plan from checksummed technical outputs, recovers or
 * executes every durable specialist/window checkpoint, and only then creates
 * the section-level semantic synthesis output.
 *
 * A failed section synthesis can be retried without repeating completed
 * specialist calls because the dispatcher reads the private checkpoints first.
 */
export async function executeEditReferenceLongFormSemanticWindowStage(
  stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteEditReferenceLongFormSemanticWindowStageOptions,
): Promise<ExecuteEditReferenceLongFormSemanticWindowStageResult> {
  if (stageInput.workItem.stageId !== 'semantic_chunk_synthesis' || !stageInput.workItem.chunkId) {
    throw new Error('Semantic-window stage execution requires one semantic chunk work item.')
  }
  const visualOutput = requireDependency(stageInput, 'visual_sampling')
  const sceneOutput = requireDependency(stageInput, 'scene_boundary_scan')
  const speechTranscriptOutput = stageInput.dependencyOutputs.find((output) => (
    output.stageId === 'speech_transcript' && output.chunkId === stageInput.workItem.chunkId
  ))
  const semanticWindowPlan = createEditReferenceLongFormSemanticWindowPlan({
    plan: stageInput.plan,
    chunkId: stageInput.workItem.chunkId,
    visualSamplingOutput: visualOutput,
    sceneBoundaryOutput: sceneOutput,
    speechTranscriptOutput,
  })
  const executeSpecialist = createEditReferenceLongFormSemanticWindowSpecialistExecutor({
    env: options.env,
    stageInput,
    semanticWindowPlan,
    resolveRuntime: options.resolveSpecialistRuntime,
  })
  const dispatch = await dispatchEditReferenceLongFormSemanticWindows({
    scope: options.scope,
    repository: options.repository,
    executionScope: options.specialistExecutionScope,
    runId: stageInput.runId,
    plan: stageInput.plan,
    workItem: stageInput.workItem,
    semanticWindowPlan,
    evidenceOutputDigestsSha256: stageInput.dependencyOutputs.map((output) => output.outputDigestSha256),
    executeSpecialist,
    resolveAttemptNumber: options.resolveAttemptNumber,
    onProgress: options.onProgress,
    now: options.now,
  })
  const output = await executeEditReferenceLongFormSemanticChunkStage(stageInput, {
    specialistAuthorities: dispatch.specialistAuthorities,
    semanticWindowPlan,
    semanticWindowCheckpoints: dispatch.checkpoints,
    provider: options.semanticChunkProvider,
    authority: options.semanticChunkAuthority,
  })
  return {
    output,
    semanticWindowPlan,
    dispatch,
    originalRemainsImmutable: true,
    partialCompletionClaimed: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

export function createEditReferenceLongFormSemanticWindowStageExecutor(
  options: ExecuteEditReferenceLongFormSemanticWindowStageOptions,
): (stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput) => Promise<EditReferenceLongFormStudyWorkOutput> {
  return async (stageInput) => (
    await executeEditReferenceLongFormSemanticWindowStage(stageInput, options)
  ).output
}

function requireDependency(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  stageId: 'visual_sampling' | 'scene_boundary_scan',
): EditReferenceLongFormStudyWorkOutput {
  const output = input.dependencyOutputs.find((candidate) => candidate.stageId === stageId)
  if (!output) throw new Error(`Semantic-window stage execution is missing ${stageId} authority.`)
  return output
}
