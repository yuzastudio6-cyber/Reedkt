import { buildSmartCutPlan } from './smart-cut-plan-builder'
import { buildSmartCutExecutionPlan } from './smart-cut-execution-plan-builder'
import { buildSmartCutFfmpegCommandPlan } from './smart-cut-ffmpeg-command-builder'
import { validateSmartCutTimelineExecutionPolicy } from './smart-cut-execution-policy'
import { validateSmartCutExecutionPlan, validateSmartCutPlanForExecution } from './smart-cut-execution-validator'
import { runSmartCutProxyPreview } from './smart-cut-preview-runner'
import { buildSmartCutExecutionQAResults } from './smart-cut-execution-qa-builder'
import type {
  SmartCutTimelineExecutionInput,
  SmartCutTimelineExecutionResult,
} from './smart-cut-execution-types'

export async function runSmartCutExecution(input: SmartCutTimelineExecutionInput): Promise<SmartCutTimelineExecutionResult> {
  const policy = validateSmartCutTimelineExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      artifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons,
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    }
  }

  const smartCutPlan = input.smartCutPlan ?? buildSmartCutPlan({
    mode: 'dry_run',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    mediaDurationSeconds: input.mediaDurationSeconds ?? 8,
  })
  const planValidation = validateSmartCutPlanForExecution({ plan: smartCutPlan, executionInput: input })
  const executionPlan = buildSmartCutExecutionPlan({ smartCutPlan, executionInput: input })
  const executionValidation = validateSmartCutExecutionPlan({ executionPlan, executionInput: input })
  const combinedValidation = {
    valid: planValidation.valid && executionValidation.valid,
    issues: [...planValidation.issues, ...executionValidation.issues],
  }
  const commandPlan = buildSmartCutFfmpegCommandPlan({ executionPlan, executionInput: input })
  const previewResult = await runSmartCutProxyPreview({ executionInput: input, commandPlan })
  const qaResults = buildSmartCutExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    executionPlan,
    validation: combinedValidation,
    previewResult,
  })

  const blocked = !combinedValidation.valid || input.mode === 'production_ready'

  return {
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    executionPlan,
    ffmpegCommandPlan: commandPlan,
    previewArtifact: previewResult.artifact,
    artifacts: previewResult.artifact ? [previewResult.artifact] : [],
    qaResults,
    skippedReasons: previewResult.status === 'skipped' && previewResult.skipReason ? [previewResult.skipReason] : [],
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...previewResult.status === 'failed' && previewResult.errorMessage ? [previewResult.errorMessage] : [],
      ...(input.mode === 'production_ready' ? ['Production-ready smart cut execution remains blocked until M12 readiness and M14 gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking'),
    blocksFinalExport: true,
  }
}
