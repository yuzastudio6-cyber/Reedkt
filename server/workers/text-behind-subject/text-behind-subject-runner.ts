import { buildMaskArtifact } from '../masks/mask-artifact-writer'
import { buildDepthCompositionManifest } from './depth-composition-manifest-builder'
import { buildTextLayerPlan } from './text-layer-plan-builder'
import { buildTextBehindSubjectQAResults } from './text-behind-subject-qa-builder'
import type { TextBehindSubjectExecutionInput, TextBehindSubjectResult } from './text-behind-subject-types'

export async function runTextBehindSubject(input: {
  executionInput: TextBehindSubjectExecutionInput
  maskArtifactIds: string[]
}): Promise<TextBehindSubjectResult> {
  const textLayerPlan = buildTextLayerPlan(input.executionInput)
  const depthCompositionManifest = buildDepthCompositionManifest({
    executionInput: input.executionInput,
    textLayerPlan,
    maskArtifactIds: input.maskArtifactIds,
  })
  const qaResults = buildTextBehindSubjectQAResults({
    executionInput: input.executionInput,
    textLayerPlan,
    depthCompositionManifest,
  })
  const artifactRecord = await buildMaskArtifact({
    workspaceId: input.executionInput.workspaceId,
    projectId: input.executionInput.projectId,
    mediaAssetId: input.executionInput.mediaAssetId,
    artifactType: 'render_manifest',
    fileName: 'm15c-depth-composition-manifest.json',
    payload: depthCompositionManifest,
    outputDirectory: input.executionInput.outputDirectory,
    mode: input.executionInput.mode === 'local_dev' ? 'local_dev' : input.executionInput.mode === 'container_ready' ? 'container_ready' : input.executionInput.mode === 'production_ready' ? 'production_ready' : 'dry_run',
    contentType: 'application/json',
    sourceOfTruth: true,
    metadata: {
      manifestKind: 'depth_composition_manifest',
      remotionMetadataOnly: true,
      hyperframeMetadataOnly: true,
      revideoUsed: false,
    },
  })
  return {
    textLayerPlan,
    depthCompositionManifest,
    manifestArtifact: artifactRecord.artifact,
    qaResults,
    warnings: textLayerPlan.warnings,
    blocksPreview: qaResults.some((gate) => gate.blocksPreview),
  }
}
