import type {
  ProductionRegistryWorkerType,
  ProductionRuntimePolicy,
  ProductionToolProfile,
} from './production-tool-types'

const backendHeavyWorkers: ProductionRegistryWorkerType[] = [
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
]

function isBackendHeavy(profile: ProductionToolProfile): boolean {
  return backendHeavyWorkers.includes(profile.workerType) ||
    profile.inputTypes.some((inputType) => inputType === 'source_media' || inputType === 'proxy_media' || inputType === 'video' || inputType === 'audio') ||
    profile.outputTypes.some((outputType) => outputType === 'processed_video' || outputType === 'processed_audio' || outputType === 'final_export')
}

export function getRuntimePolicyForTool(profile: ProductionToolProfile): ProductionRuntimePolicy {
  const evaluationOnly = profile.productionStatus === 'evaluation_only' || profile.executionMode === 'evaluation_only'
  const frontendPreviewOnly = profile.workerType === 'frontend_preview_only'

  return {
    allowedWorkerTypes: [profile.workerType],
    frontendExecutionAllowed: frontendPreviewOnly && !isBackendHeavy(profile),
    sourceMediaProcessingAllowed: !frontendPreviewOnly && profile.workerType !== 'planning_only',
    productionExecutionAllowed: !evaluationOnly && profile.productionStatus !== 'blocked' && profile.workerType !== 'planning_only',
    approvedSnapshotRequired: profile.workerType !== 'frontend_preview_only' && profile.workerType !== 'planning_only',
    creditReservationRequired: profile.workerType === 'gpu_ai_worker' || profile.workerType === 'render_worker',
    evaluationOnly,
  }
}

export function evaluateRuntimePolicy(
  profile: ProductionToolProfile,
  requestedWorkerType?: ProductionRegistryWorkerType,
): { allowed: boolean; blockingReasons: string[]; warnings: string[] } {
  const policy = getRuntimePolicyForTool(profile)
  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (!policy.productionExecutionAllowed) {
    blockingReasons.push(`${profile.toolId} is not allowed for production execution in Milestone 2 metadata.`)
  }

  if (profile.toolId === 'revideo') {
    blockingReasons.push('Revideo is evaluation-only and blocked from core render execution.')
  }

  if (profile.gpuRequired && requestedWorkerType && requestedWorkerType !== 'gpu_ai_worker') {
    blockingReasons.push(`${profile.toolId} requires GPU execution and cannot run on ${requestedWorkerType}.`)
  }

  if (requestedWorkerType && !policy.allowedWorkerTypes.includes(requestedWorkerType)) {
    blockingReasons.push(`${profile.toolId} is owned by ${profile.workerType}, not ${requestedWorkerType}.`)
  }

  if (profile.workerType === 'frontend_preview_only' && isBackendHeavy(profile)) {
    blockingReasons.push(`${profile.toolId} is frontend-preview-only but is marked with backend-heavy media I/O.`)
  }

  if (profile.workerType === 'planning_only' && isBackendHeavy(profile)) {
    warnings.push(`${profile.toolId} is planning-only with media-like artifacts; future implementation must keep execution backend-owned.`)
  }

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

export function assertRuntimePolicyAllowsProduction(profile: ProductionToolProfile): void {
  const result = evaluateRuntimePolicy(profile)

  if (!result.allowed) {
    throw new Error(result.blockingReasons.join(' '))
  }
}

export function assertRuntimePolicyAllowsWorker(
  profile: ProductionToolProfile,
  workerType: ProductionRegistryWorkerType,
): void {
  const result = evaluateRuntimePolicy(profile, workerType)

  if (!result.allowed) {
    throw new Error(result.blockingReasons.join(' '))
  }
}
