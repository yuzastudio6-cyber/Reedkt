import { buildRenderCommandPlans } from './render-command-plan-builder'
import { buildExportDeliveryQAResults } from './export-delivery-qa-builder'
import { runFfmpegExport } from './ffmpeg-export-runner'
import { runLibassCaptionBurnIn } from './libass-caption-burnin-runner'
import { runRemotionRender } from './remotion-render-runner'
import { buildRenderArtifact } from './render-artifact-writer'
import { validateRenderExecutionPolicy } from './render-execution-policy'
import { validateRenderExecutionInput, validateRenderExecutionManifest } from './render-execution-validator'
import { buildRenderExecutionQAResults } from './render-execution-qa-builder'
import { buildRenderExecutionResult } from './render-execution-result-builder'
import { buildRenderManifestExecution } from './render-manifest-execution-builder'
import type { FinalRenderExecutionInput, FinalRenderExecutionResult, RenderToolExecutionResult, RenderToolSkipReason } from './render-execution-types'

export async function runFinalRenderExecution(input: FinalRenderExecutionInput): Promise<FinalRenderExecutionResult> {
  const policy = validateRenderExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      commandPlans: [],
      renderArtifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons.map((reason): RenderToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
      finalDeliveryAllowed: false,
    }
  }

  const inputValidation = validateRenderExecutionInput(input)
  const executionManifest = buildRenderManifestExecution(input)
  const manifestValidation = validateRenderExecutionManifest(executionManifest)
  const combinedValidation = {
    valid: inputValidation.valid && manifestValidation.valid,
    issues: [...inputValidation.issues, ...manifestValidation.issues],
  }
  const commandPlans = buildRenderCommandPlans({ executionInput: input, executionManifest })
  const toolResults: RenderToolExecutionResult[] = []
  for (const commandPlan of commandPlans) {
    if (commandPlan.tool === 'remotion') toolResults.push(await runRemotionRender({ executionInput: input, executionManifest, commandPlan }))
    if (commandPlan.tool === 'ffmpeg') toolResults.push(await runFfmpegExport({ executionInput: input, executionManifest, commandPlan }))
    if (commandPlan.tool === 'libass') toolResults.push(await runLibassCaptionBurnIn({ executionInput: input, executionManifest, commandPlan }))
  }

  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const plannedArtifacts = await Promise.all([
    buildRenderArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'render_manifest',
      fileName: 'm16a-render-execution-manifest.json',
      payload: executionManifest,
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: true,
      metadata: { executionManifestId: executionManifest.executionManifestId },
    }),
    buildRenderArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType: 'qa_report',
      fileName: 'm16a-final-render-qa.json',
      payload: { commandPlanCount: commandPlans.length, renderMode: input.renderMode },
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: false,
      metadata: { executionManifestId: executionManifest.executionManifestId },
    }),
  ])
  const toolArtifacts = toolResults.flatMap((result) => result.artifact ? [result.artifact] : [])
  const renderArtifacts = [...plannedArtifacts.map((record) => record.artifact), ...toolArtifacts]
  const renderQaResults = buildRenderExecutionQAResults({
    executionInput: input,
    executionManifest,
    validation: combinedValidation,
    outputArtifactIds: renderArtifacts.map((artifact) => artifact.id),
  })
  const finalExportArtifact = renderArtifacts.find((artifact) => artifact.artifactType === 'final_export')
  const exportQaResults = buildExportDeliveryQAResults({
    executionInput: input,
    executionManifest,
    finalExportArtifact,
    upstreamQaResults: [...(input.upstreamQaResults ?? []), ...renderQaResults],
    outputArtifactIds: renderArtifacts.map((artifact) => artifact.id),
  })
  const qaResults = [...renderQaResults, ...exportQaResults]
  const blocked = !combinedValidation.valid ||
    qaResults.some((gate) => gate.blocking) ||
    input.mode === 'production_ready'
  return buildRenderExecutionResult({
    executionInput: input,
    executionManifest,
    commandPlans,
    renderArtifacts,
    qaResults,
    toolResults,
    blocked,
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...toolResults.flatMap((result) => result.warnings),
      'M16A final exports remain private until a later delivery/share policy.',
      ...(input.mode === 'production_ready' ? ['Production-ready final render/export remains blocked until readiness and QA gates pass.'] : []),
    ],
  })
}
