import { buildContainerReadinessCommandPlans } from './container-readiness-command-plan'
import { evaluateContainerReadinessBlockers } from './container-readiness-blocker-policy'
import {
  containerReadinessImageExpectations,
  containerReadinessImageOrder,
} from './container-readiness-expected-tools'
import type {
  BuildContainerReadinessReportInput,
  ContainerImageReadinessResult,
  ContainerModelWeightReadinessResult,
  ContainerReadinessExpectedTool,
  ContainerReadinessImageId,
  ContainerReadinessManualReviewItem,
  ContainerReadinessNextAction,
  ContainerReadinessReport,
  ContainerReadinessStatus,
  ContainerReadinessToolId,
  ContainerToolReadinessResult,
  ParsedContainerReadinessLog,
} from './container-readiness-types'

export const CONTAINER_READINESS_REPORT_ID = 'activation-phase-21-container-readiness-report'

export function buildContainerReadinessReport(
  input: BuildContainerReadinessReportInput = {},
): ContainerReadinessReport {
  const mode = input.mode ?? (input.parsedLogs && input.parsedLogs.length > 0 ? 'report_from_logs' : 'static_plan')
  const parsedLogs = input.parsedLogs ?? []
  const imageReadinessResults = buildImageReadinessResults(parsedLogs)
  const toolReadinessResults = imageReadinessResults.flatMap(buildToolReadinessResults)
  const modelWeightReadinessResults = buildModelWeightReadinessResults(toolReadinessResults)
  const manualReviewItems = buildManualReviewItems(toolReadinessResults)
  const evaluation = evaluateContainerReadinessBlockers({
    imageReadinessResults,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  })
  const unknownLogBlockers = parsedLogs
    .filter((parsedLog) => !parsedLog.imageId)
    .map((parsedLog) => ({
      id: 'unknown-readiness-log',
      imageId: 'unknown' as const,
      summary: parsedLog.warnings.find((warning) => warning.includes('Could not infer image')) ??
        'Readiness log could not be tied to a known image.',
    }))
  const blockers = [...evaluation.blockers, ...unknownLogBlockers]
  const phase22Readiness = unknownLogBlockers.length > 0
    ? {
        ...evaluation.phase22Readiness,
        readyForGcpStagingFoundationSetup: false,
        blockers: [...evaluation.phase22Readiness.blockers, ...unknownLogBlockers.map((blocker) => blocker.summary)],
      }
    : evaluation.phase22Readiness
  const phase23Readiness = unknownLogBlockers.length > 0
    ? {
        ...evaluation.phase23Readiness,
        readyForArtifactRegistryPush: false,
        blockers: [...evaluation.phase23Readiness.blockers, ...unknownLogBlockers.map((blocker) => blocker.summary)],
      }
    : evaluation.phase23Readiness

  return {
    reportId: CONTAINER_READINESS_REPORT_ID,
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode,
    imageTag: input.imageTag,
    imageReadinessResults,
    toolReadinessResults,
    modelWeightReadinessResults,
    manualReviewItems,
    blockers,
    warnings: evaluation.warnings,
    commandPlans: buildContainerReadinessCommandPlans(input.imageTag),
    phase22Readiness,
    phase23Readiness,
    nextActions: buildNextActions(phase22Readiness.readyForGcpStagingFoundationSetup, phase23Readiness.readyForArtifactRegistryPush),
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
    dockerExecuted: false,
    gcloudExecuted: false,
    providerExecuted: false,
    modelDownloadExecuted: false,
    mediaProcessingExecuted: false,
  }
}

function buildImageReadinessResults(parsedLogs: ParsedContainerReadinessLog[]): ContainerImageReadinessResult[] {
  const logsByImage = new Map<ContainerReadinessImageId, ParsedContainerReadinessLog[]>()
  for (const parsedLog of parsedLogs) {
    if (!parsedLog.imageId) continue
    logsByImage.set(parsedLog.imageId, [...(logsByImage.get(parsedLog.imageId) ?? []), parsedLog])
  }

  return containerReadinessImageOrder.map((imageId) => {
    const logs = logsByImage.get(imageId) ?? []
    return logs.length > 0 ? resultFromParsedLogs(imageId, logs) : notCheckedImageResult(imageId)
  })
}

function resultFromParsedLogs(
  imageId: ContainerReadinessImageId,
  logs: ParsedContainerReadinessLog[],
): ContainerImageReadinessResult {
  const expectation = requiredExpectation(imageId)
  const latestLog = logs[logs.length - 1]
  const mergedToolStatuses = mergeToolStatuses(logs)
  const passedTools: ContainerReadinessToolId[] = []
  const missingTools: ContainerReadinessToolId[] = []
  const optionalMissingTools: ContainerReadinessToolId[] = []
  const blockedTools: ContainerReadinessToolId[] = []
  const manualReviewTools: ContainerReadinessToolId[] = []

  for (const expectedTool of expectation.expectedTools) {
    const status = mergedToolStatuses.get(expectedTool.toolId) ?? expectedTool.defaultStatusWhenMissing
    if (status === 'passed' || status === 'warning') passedTools.push(expectedTool.toolId)
    if (status === 'missing' || status === 'failed') missingTools.push(expectedTool.toolId)
    if (status === 'optional_missing') optionalMissingTools.push(expectedTool.toolId)
    if (status === 'blocked' || status === 'model_weight_blocked' || status === 'model_weight_missing') blockedTools.push(expectedTool.toolId)
    if (status === 'pending_manual_review' || status === 'source_install_review_required') manualReviewTools.push(expectedTool.toolId)
  }

  const forbiddenFindings = logs.flatMap((log) => log.forbiddenFindings)
  const readinessEvidenceStatus = statusFromLogs(logs, expectation.expectedTools)

  return {
    imageId,
    imageName: latestLog.imageName,
    imageDigest: latestLog.imageDigest,
    buildEvidenceStatus: readinessEvidenceStatus === 'blocked' || readinessEvidenceStatus === 'failed' ? 'blocked' : 'passed',
    readinessEvidenceStatus,
    expectedTools: expectation.expectedTools,
    passedTools,
    missingTools,
    optionalMissingTools,
    blockedTools,
    manualReviewTools,
    forbiddenFindings,
    productionAllowed: false,
    stagingAllowed: imageId !== 'gpu-worker' && forbiddenFindings.length === 0 && !['blocked', 'failed'].includes(readinessEvidenceStatus),
    notes: expectation.notes,
  }
}

function notCheckedImageResult(imageId: ContainerReadinessImageId): ContainerImageReadinessResult {
  const expectation = requiredExpectation(imageId)
  return {
    imageId,
    buildEvidenceStatus: 'not_checked',
    readinessEvidenceStatus: 'not_checked',
    expectedTools: expectation.expectedTools,
    passedTools: [],
    missingTools: [],
    optionalMissingTools: [],
    blockedTools: [],
    manualReviewTools: [],
    forbiddenFindings: [],
    productionAllowed: false,
    stagingAllowed: false,
    notes: expectation.notes,
  }
}

function buildToolReadinessResults(imageResult: ContainerImageReadinessResult): ContainerToolReadinessResult[] {
  return imageResult.expectedTools.map((expectedTool) => {
    const status = statusForTool(imageResult, expectedTool)
    return {
      imageId: imageResult.imageId,
      toolId: expectedTool.toolId,
      displayName: expectedTool.displayName,
      status,
      requiredForPhase23: expectedTool.requiredForPhase23,
      requiredForGpuPhase: expectedTool.requiredForGpuPhase,
      warnings: warningsForTool(status, expectedTool),
      blockers: blockersForTool(status, expectedTool),
    }
  })
}

function buildModelWeightReadinessResults(
  toolResults: ContainerToolReadinessResult[],
): ContainerModelWeightReadinessResult[] {
  return toolResults
    .filter((result) => result.toolId === 'model-weight-directories')
    .map((result) => ({
      imageId: result.imageId,
      toolId: result.toolId,
      status: result.status === 'not_checked' ? 'model_weight_blocked' : result.status,
      blocksGpuPhase: true,
      warnings: ['Model-weight directories are placeholders only until model/license approval.'],
      blockers: ['Model weights must not be downloaded or used before approval.'],
    }))
}

function buildManualReviewItems(
  toolResults: ContainerToolReadinessResult[],
): ContainerReadinessManualReviewItem[] {
  return toolResults
    .filter((result) => ['pending_manual_review', 'source_install_review_required'].includes(result.status))
    .map((result) => ({
      id: `manual-review-${result.imageId}-${result.toolId}`,
      imageId: result.imageId,
      toolId: result.toolId,
      summary: `${result.displayName} is ${result.status}.`,
      status: result.status,
    }))
}

function mergeToolStatuses(logs: ParsedContainerReadinessLog[]): Map<ContainerReadinessToolId, ContainerReadinessStatus> {
  const statuses = new Map<ContainerReadinessToolId, ContainerReadinessStatus>()
  for (const log of logs) {
    for (const toolResult of log.toolResults) {
      statuses.set(toolResult.toolId, toolResult.status)
    }
  }
  return statuses
}

function statusFromLogs(
  logs: ParsedContainerReadinessLog[],
  expectedTools: ContainerReadinessExpectedTool[],
): ContainerReadinessStatus {
  if (logs.some((log) => log.forbiddenFindings.length > 0 || log.parsedStatus === 'blocked')) return 'blocked'
  if (logs.some((log) => log.parsedStatus === 'failed')) return 'failed'

  const statuses = mergeToolStatuses(logs)
  const requiredMissing = expectedTools.some((tool) => {
    if (!tool.requiredForPhase23) return false
    const status = statuses.get(tool.toolId) ?? tool.defaultStatusWhenMissing
    return ['missing', 'failed', 'blocked', 'model_weight_missing', 'model_weight_blocked'].includes(status)
  })

  if (requiredMissing) return 'failed'
  if (logs.some((log) => log.parsedStatus === 'warning') || expectedTools.some((tool) => ['pending_manual_review', 'source_install_review_required', 'optional_missing'].includes(statuses.get(tool.toolId) ?? tool.defaultStatusWhenMissing))) {
    return 'warning'
  }
  if (logs.some((log) => log.parsedStatus === 'passed')) return 'passed'
  return 'not_checked'
}

function statusForTool(
  imageResult: ContainerImageReadinessResult,
  expectedTool: ContainerReadinessExpectedTool,
): ContainerReadinessStatus {
  if (imageResult.passedTools.includes(expectedTool.toolId)) return 'passed'
  if (imageResult.missingTools.includes(expectedTool.toolId)) return 'missing'
  if (imageResult.optionalMissingTools.includes(expectedTool.toolId)) return 'optional_missing'
  if (imageResult.blockedTools.includes(expectedTool.toolId)) return expectedTool.modelWeightRelated ? 'model_weight_blocked' : 'blocked'
  if (imageResult.manualReviewTools.includes(expectedTool.toolId)) {
    return expectedTool.sourceInstallReviewRequired ? 'source_install_review_required' : 'pending_manual_review'
  }
  return imageResult.readinessEvidenceStatus === 'not_checked' ? 'not_checked' : expectedTool.defaultStatusWhenMissing
}

function warningsForTool(
  status: ContainerReadinessStatus,
  expectedTool: ContainerReadinessExpectedTool,
): string[] {
  const warnings: string[] = []
  if (['pending_manual_review', 'source_install_review_required', 'optional_missing'].includes(status)) {
    warnings.push(`${expectedTool.displayName} is ${status}.`)
  }
  if (expectedTool.modelWeightRelated) {
    warnings.push('Model weights remain blocked until approval.')
  }
  return warnings
}

function blockersForTool(
  status: ContainerReadinessStatus,
  expectedTool: ContainerReadinessExpectedTool,
): string[] {
  if (!expectedTool.requiredForPhase23) return []
  if (['missing', 'failed', 'blocked', 'model_weight_missing', 'model_weight_blocked'].includes(status)) {
    return [`${expectedTool.displayName} blocks Phase 23 because status is ${status}.`]
  }
  return []
}

function requiredExpectation(imageId: ContainerReadinessImageId) {
  const expectation = containerReadinessImageExpectations.find((candidate) => candidate.imageId === imageId)
  if (!expectation) throw new Error(`Missing readiness expectation for ${imageId}.`)
  return expectation
}

function buildNextActions(
  phase22Ready: boolean,
  phase23Ready: boolean,
): ContainerReadinessNextAction[] {
  return [
    {
      id: 'review-readiness-plan',
      title: 'Review readiness command plan',
      summary: 'Confirm human-run commands, image variables, and safety boundaries before any container readiness check.',
    },
    {
      id: 'collect-readiness-logs',
      title: 'Collect readiness logs',
      summary: 'After humans run readiness commands, pass local text logs to activation:container-readiness:report.',
    },
    {
      id: 'phase22-staging-foundation',
      title: phase22Ready ? 'Prepare Phase 22 staging foundation' : 'Resolve Phase 22 blockers',
      summary: phase22Ready
        ? 'Staging foundation setup can be planned; this does not deploy, push images, or unblock beta.'
        : 'Resolve forbidden readiness evidence before staging foundation setup planning.',
    },
    {
      id: 'phase23-image-push',
      title: phase23Ready ? 'Prepare Phase 23 image push review' : 'Keep Phase 23 blocked',
      summary: phase23Ready
        ? 'Required non-GPU image readiness evidence is present; GPU may remain deferred for non-GPU staging.'
        : 'Phase 23 remains blocked until required non-GPU build/readiness evidence is passing.',
    },
  ]
}
