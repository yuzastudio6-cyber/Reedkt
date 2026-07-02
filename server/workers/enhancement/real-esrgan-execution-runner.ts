import { existsSync } from 'node:fs'
import { buildEnhancementArtifactRecord } from './enhancement-artifact-writer'
import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolCommandPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export function buildRealEsrganCommandPlan(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): EnhancementToolCommandPlan {
  return {
    tool: 'real_esrgan',
    command: 'python',
    args: [
      '-m',
      'realesrgan',
      '--input',
      input.executionInput.sourceImageLocalPath ?? input.executionInput.proxyVideoLocalPath ?? '[private-artifact-ref]',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/enhanced-sample` : '[worker-temp-enhanced-sample]',
      '--scale',
      String(input.taskPlan.targetScale),
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/enhanced-sample` : undefined,
    executes: false,
    summary: 'Real-ESRGAN sample-first enhancement command plan; no model download and no execution by builder.',
  }
}

export async function runRealEsrganEnhancement(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): Promise<EnhancementToolExecutionResult> {
  const commandPlan = buildRealEsrganCommandPlan(input)
  const executionInput = input.executionInput
  if (input.taskPlan.primaryTool === 'none') {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'enhancement_not_recommended', message: 'No source quality issue or approved enhancement request exists.', tool: 'real_esrgan' }, warnings: [] }
  }
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelEnhancementExecution !== true) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_disabled_or_not_local_dev', message: 'Real-ESRGAN runs only in explicit local-dev model execution.', tool: 'real_esrgan' }, warnings: [] }
  }
  if (!executionInput.realEsrganModelLocalPath || !existsSync(executionInput.realEsrganModelLocalPath)) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_model_missing', message: 'Real-ESRGAN model is not available locally; no download attempted.', tool: 'real_esrgan' }, warnings: [] }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_source_missing', message: 'Safe local source media/frame is missing.', tool: 'real_esrgan' }, warnings: [] }
  }
  return {
    status: 'planned',
    tool: 'real_esrgan',
    commandPlan,
    artifact: buildEnhancementArtifactRecord({
      workspaceId: executionInput.workspaceId,
      projectId: executionInput.projectId,
      mediaAssetId: executionInput.mediaAssetId,
      artifactType: input.taskPlan.expectedArtifacts.includes('enhanced_video') ? 'enhanced_video' : 'representative_frame',
      fileName: input.taskPlan.expectedArtifacts.includes('enhanced_video') ? 'real-esrgan-enhanced-sample.mp4' : 'real-esrgan-enhanced-frame.png',
      sourceOfTruth: true,
      metadata: { tool: 'real_esrgan', plannedOnly: true, sampleFirst: true },
    }),
    warnings: ['Real-ESRGAN local-dev execution is scaffolded only; no inference is run by M15D smoke paths.'],
  }
}
