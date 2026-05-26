import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { assertOutputPathInsideRoot } from '../media/media-path-safety'
import { buildSmartCutPreviewArtifact } from './smart-cut-execution-artifact-writer'
import type { SmartCutFfmpegCommandPlan, SmartCutPreviewResult, SmartCutTimelineExecutionInput } from './smart-cut-execution-types'

const execFileAsync = promisify(execFile)

export async function runSmartCutProxyPreview(input: {
  executionInput: SmartCutTimelineExecutionInput
  commandPlan: SmartCutFfmpegCommandPlan
}): Promise<SmartCutPreviewResult> {
  const { executionInput, commandPlan } = input

  if (executionInput.mode !== 'local_dev' || executionInput.enableProxyPreview !== true) {
    return { status: 'skipped', commandPlan, skipReason: 'proxy_preview_disabled_or_not_local_dev' }
  }

  const sourcePath = executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', commandPlan, skipReason: 'proxy_source_missing' }
  }

  if (!executionInput.outputDirectory || !commandPlan.tempDirectory || !commandPlan.concatListPath || !commandPlan.expectedPreviewOutputPath) {
    return { status: 'skipped', commandPlan, skipReason: 'safe_output_paths_missing' }
  }

  try {
    await execFileAsync(commandPlan.command, ['-version'], {
      timeout: Math.min(commandPlan.timeoutMs, 5_000),
      maxBuffer: 512 * 1024,
      windowsHide: true,
    })
  } catch {
    return { status: 'skipped', commandPlan, skipReason: 'ffmpeg_unavailable' }
  }

  await mkdir(commandPlan.tempDirectory, { recursive: true })

  try {
    const trimCommands = commandPlan.commands.filter((command) => command.operationType === 'trim_segment')
    for (const command of trimCommands) {
      await execFileAsync(command.command, command.args, {
        timeout: commandPlan.timeoutMs,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      })
    }

    const concatList = trimCommands
      .map((command) => `file '${String(command.expectedOutputPath).replace(/'/g, "'\\''")}'`)
      .join('\n')
    const concatListPath = assertOutputPathInsideRoot(commandPlan.concatListPath, executionInput.outputDirectory)
    await writeFile(concatListPath, `${concatList}\n`, 'utf8')

    const concatCommand = commandPlan.commands.find((command) => command.operationType === 'concatenate_segments')
    if (!concatCommand) throw new Error('Concat command missing from preview command plan.')

    await execFileAsync(concatCommand.command, concatCommand.args, {
      timeout: commandPlan.timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    })

    const previewPath = commandPlan.expectedPreviewOutputPath
    const artifact = buildSmartCutPreviewArtifact({
      workspaceId: executionInput.workspaceId,
      projectId: executionInput.projectId,
      mediaAssetId: executionInput.mediaAssetId,
      previewLocalPath: previewPath,
    })

    await rm(commandPlan.tempDirectory, { recursive: true, force: true })

    return {
      status: 'created',
      previewLocalPath: previewPath,
      artifact,
      commandPlan,
    }
  } catch (error) {
    await rm(commandPlan.tempDirectory, { recursive: true, force: true })
    return {
      status: 'failed',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : 'Smart cut proxy preview failed.',
    }
  }
}

export function buildGeneratedFixturePreviewPath(outputDirectory: string, fileName = 'm14-generated-proxy-preview.mp4'): string {
  return path.join(outputDirectory, fileName)
}
