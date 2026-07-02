import { buildMaskTaskPlan } from './mask-task-plan-builder'
import { validateMaskExecutionPolicy } from './mask-execution-policy'
import { validateMaskExecutionInput, validateMaskTaskPlan } from './mask-execution-validator'
import { runBackgroundRemovalExecution } from './background-removal-execution-runner'
import { buildMaskFallbackDecisions } from './mask-fallback-policy'
import { buildMaskArtifact } from './mask-artifact-writer'
import { buildMaskExecutionQAResults } from './mask-execution-qa-builder'
import { buildMaskExecutionResult } from './mask-execution-result-builder'
import { runTextBehindSubject } from '../text-behind-subject/text-behind-subject-runner'
import type { MaskExecutionInput, MaskExecutionResult, MaskToolSkipReason } from './mask-execution-types'

export async function runMaskExecution(input: MaskExecutionInput): Promise<MaskExecutionResult> {
  const policy = validateMaskExecutionPolicy(input)
  if (!policy.allowed) {
    return buildMaskExecutionResult({
      mode: input.mode,
      status: 'blocked',
      maskArtifacts: [],
      qaResults: [],
      fallbackDecisions: [],
      skippedReasons: policy.blockingReasons.map((reason): MaskToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    })
  }

  const inputValidation = validateMaskExecutionInput(input)
  const taskPlan = buildMaskTaskPlan(input)
  const planValidation = validateMaskTaskPlan(taskPlan)
  const combinedValidation = {
    valid: inputValidation.valid && planValidation.valid,
    issues: [...inputValidation.issues, ...planValidation.issues],
  }
  const toolResults = await runBackgroundRemovalExecution({ executionInput: input, taskPlan })
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'

  const plannedMaskArtifacts = await Promise.all(taskPlan.expectedArtifacts
    .filter((artifactType) => artifactType !== 'preview_video' && artifactType !== 'render_manifest')
    .map((artifactType) => buildMaskArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType,
      fileName: fileNameForArtifact(artifactType),
      payload: artifactType === 'qa_report' ? undefined : { taskPlanId: taskPlan.taskPlanId, plannedOnly: true, artifactType },
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      contentType: artifactType === 'qa_report' ? 'application/json' : undefined,
      sourceOfTruth: artifactType !== 'qa_report',
      metadata: {
        taskPlanId: taskPlan.taskPlanId,
        plannedOnly: true,
      },
    })))

  const maskArtifacts = [
    ...plannedMaskArtifacts.map((record) => record.artifact),
    ...toolResults.flatMap((result) => [
      ...(result.artifact ? [result.artifact] : []),
      ...(result.artifacts ?? []),
    ]),
  ]
  const fallbackDecisions = buildMaskFallbackDecisions({
    taskPlan,
    maskConfidence: input.maskConfidenceHint,
    temporalStabilityScore: input.motionRequiresTracking ? 0.68 : 0.82,
  })

  const textResult = input.maskIntent === 'text_behind_subject' && input.textBehindSubject
    ? await runTextBehindSubject({
        executionInput: {
          ...input.textBehindSubject,
          mode: input.mode,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          mediaAssetId: input.mediaAssetId,
          approvedSnapshotId: input.approvedSnapshotId,
          toolExecutionPlanId: input.toolExecutionPlanId,
          idempotencyKey: input.idempotencyKey,
          foregroundMaskArtifactId: input.textBehindSubject.foregroundMaskArtifactId ?? maskArtifacts.find((artifact) => artifact.artifactType === 'mask_image')?.id,
          maskSequenceArtifactId: input.textBehindSubject.maskSequenceArtifactId ?? maskArtifacts.find((artifact) => artifact.artifactType === 'mask_sequence')?.id,
          sourceVideoArtifactId: input.textBehindSubject.sourceVideoArtifactId ?? input.sourceVideoArtifactId,
          proxyVideoArtifactId: input.textBehindSubject.proxyVideoArtifactId ?? input.proxyVideoArtifactId,
          outputDirectory: input.textBehindSubject.outputDirectory ?? input.outputDirectory,
          maskConfidence: input.textBehindSubject.maskConfidence ?? input.maskConfidenceHint,
        },
        maskArtifactIds: maskArtifacts.map((artifact) => artifact.id),
      })
    : undefined

  if (textResult?.manifestArtifact) maskArtifacts.push(textResult.manifestArtifact)

  const qaResults = [
    ...buildMaskExecutionQAResults({
      executionInput: input,
      taskPlan,
      validation: combinedValidation,
      toolResults,
      outputArtifactIds: maskArtifacts.map((artifact) => artifact.id),
    }),
    ...(textResult?.qaResults ?? []),
  ]
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa || input.mode === 'production_ready'

  return buildMaskExecutionResult({
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    maskTaskPlan: taskPlan,
    maskArtifacts,
    textLayerPlan: textResult?.textLayerPlan,
    depthCompositionManifest: textResult?.depthCompositionManifest,
    previewArtifact: maskArtifacts.find((artifact) => artifact.artifactType === 'preview_video'),
    qaResults,
    fallbackDecisions,
    skippedReasons: toolResults.flatMap((result) => result.skipReason ? [result.skipReason] : []),
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...taskPlan.warnings,
      ...toolResults.flatMap((result) => result.warnings),
      ...(textResult?.warnings ?? []),
      'Milestone 15C does not final render/export masks or compositions.',
      ...(input.mode === 'production_ready' ? ['Production-ready mask execution remains blocked until readiness/model-weight/QA gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking') || blockingQa || fallbackDecisions.some((decision) => decision.blocksPreview),
    blocksFinalExport: true,
  })
}

function fileNameForArtifact(artifactType: 'mask_image' | 'mask_sequence' | 'rgba_cutout' | 'qa_report' | 'preview_video' | 'render_manifest'): string {
  switch (artifactType) {
    case 'mask_image':
      return 'm15c-mask-image.png'
    case 'mask_sequence':
      return 'm15c-mask-sequence.json'
    case 'rgba_cutout':
      return 'm15c-rgba-cutout.png'
    case 'preview_video':
      return 'm15c-mask-preview.mp4'
    case 'render_manifest':
      return 'm15c-depth-composition-manifest.json'
    case 'qa_report':
      return 'm15c-mask-qa.json'
  }
}
