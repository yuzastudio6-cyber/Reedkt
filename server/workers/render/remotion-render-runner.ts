import { existsSync } from 'node:fs'
import { buildRenderArtifactRecord } from './render-artifact-writer'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest, RenderToolExecutionResult } from './render-execution-types'

export async function runRemotionRender(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  commandPlan: RenderCommandPlan
}): Promise<RenderToolExecutionResult> {
  if (input.commandPlan.tool !== 'remotion') {
    return skipped(input.commandPlan, 'remotion_not_selected', 'Remotion command plan was not selected.')
  }
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableRemotionLocalRender !== true) {
    return skipped(input.commandPlan, 'remotion_disabled_or_not_local_dev', 'Remotion runs only when explicitly enabled in local-dev.')
  }
  if (!input.executionInput.outputDirectory || !existsSync(input.executionInput.outputDirectory)) {
    return skipped(input.commandPlan, 'remotion_output_root_missing', 'Safe local output directory is unavailable.')
  }
  return {
    status: 'skipped',
    tool: 'remotion',
    commandPlan: input.commandPlan,
    skipReason: { code: 'remotion_execution_not_enabled_in_m16a_smoke', message: 'M16A smoke paths keep Remotion execution skip-safe.', tool: 'remotion' },
    warnings: ['Remotion local render is command-planned only unless a later reviewed worker path enables it.'],
  }
}

function skipped(commandPlan: RenderCommandPlan, code: string, message: string): RenderToolExecutionResult {
  return { status: 'skipped', tool: 'remotion', commandPlan, skipReason: { code, message, tool: 'remotion' }, warnings: [] }
}

export function buildRemotionOutputArtifact(input: {
  executionInput: FinalRenderExecutionInput
}): ReturnType<typeof buildRenderArtifactRecord> {
  return buildRenderArtifactRecord({
    workspaceId: input.executionInput.workspaceId,
    projectId: input.executionInput.projectId,
    mediaAssetId: input.executionInput.mediaAssetId,
    artifactType: input.executionInput.renderMode === 'final_export' ? 'final_export' : 'preview_video',
    fileName: input.executionInput.renderMode === 'final_export' ? 'remotion-final-export.mp4' : 'remotion-preview.mp4',
    sourceOfTruth: input.executionInput.renderMode === 'final_export',
    previewAllowed: input.executionInput.renderMode !== 'final_export',
    metadata: { tool: 'remotion', plannedOnly: true },
  })
}
