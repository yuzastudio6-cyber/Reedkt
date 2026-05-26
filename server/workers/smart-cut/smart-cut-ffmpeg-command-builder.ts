import path from 'node:path'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  assertOutputPathInsideRoot,
  assertSourceNotOverwritten,
} from '../media/media-path-safety'
import type {
  SmartCutExecutionPlan,
  SmartCutFfmpegCommand,
  SmartCutFfmpegCommandPlan,
  SmartCutTimelineExecutionInput,
} from './smart-cut-execution-types'

export function buildSmartCutFfmpegCommandPlan(input: {
  executionPlan: SmartCutExecutionPlan
  executionInput: SmartCutTimelineExecutionInput
}): SmartCutFfmpegCommandPlan {
  const { executionInput, executionPlan } = input
  validateCommandInput(executionInput)

  const command = executionInput.ffmpegBin ?? 'ffmpeg'
  const timeoutMs = executionInput.timeoutMs ?? 30_000
  const previewEnabled = executionInput.mode === 'local_dev' && executionInput.enableProxyPreview === true
  const sourcePath = executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath ?? '__LOCAL_PROXY_SOURCE_REQUIRED__'
  const outputRoot = executionInput.outputDirectory
  const tempDirectory = outputRoot
    ? assertOutputPathInsideRoot(path.join(outputRoot, 'm14-smart-cut-temp'), outputRoot)
    : '__SAFE_OUTPUT_ROOT_REQUIRED__/m14-smart-cut-temp'
  const expectedPreviewOutputPath = outputRoot
    ? assertOutputPathInsideRoot(path.join(outputRoot, `${executionPlan.executionPlanId}-preview.mp4`), outputRoot)
    : '__SAFE_OUTPUT_ROOT_REQUIRED__/smart-cut-preview.mp4'
  const concatListPath = outputRoot
    ? assertOutputPathInsideRoot(path.join(tempDirectory, 'concat-list.txt'), outputRoot)
    : `${tempDirectory}/concat-list.txt`

  if (executionInput.sourceVideoLocalPath && outputRoot) {
    assertSourceNotOverwritten(executionInput.sourceVideoLocalPath, expectedPreviewOutputPath)
  }
  if (executionInput.proxyVideoLocalPath && outputRoot) {
    assertSourceNotOverwritten(executionInput.proxyVideoLocalPath, expectedPreviewOutputPath)
  }

  const trimCommands = executionPlan.cutOperations
    .filter((operation) => operation.operationType === 'trim_segment')
    .map((operation, index): SmartCutFfmpegCommand => {
      const outputPath = outputRoot
        ? assertOutputPathInsideRoot(path.join(tempDirectory, `segment-${index + 1}.mp4`), outputRoot)
        : `${tempDirectory}/segment-${index + 1}.mp4`
      return {
        operationId: operation.operationId,
        operationType: 'trim_segment',
        command,
        expectedOutputPath: outputPath,
        args: [
          '-hide_banner',
          '-nostdin',
          '-n',
          '-ss',
          String(Math.max(0, operation.sourceStartSeconds)),
          '-i',
          sourcePath,
          '-t',
          String(Math.max(0.001, operation.durationSeconds)),
          '-map',
          '0',
          '-c',
          'copy',
          outputPath,
        ],
        summary: `Preview-only trim for ${operation.operationId}.`,
      }
    })

  const concatCommand: SmartCutFfmpegCommand = {
    operationId: 'concat-kept-segments',
    operationType: 'concatenate_segments',
    command,
    expectedOutputPath: expectedPreviewOutputPath,
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c',
      'copy',
      expectedPreviewOutputPath,
    ],
    summary: 'Preview-only concat for kept proxy segments.',
  }

  return {
    planId: `ffmpeg-plan-${executionPlan.executionPlanId}`,
    mode: executionInput.mode,
    previewEnabled,
    finalExportAllowed: false,
    command,
    commands: [...trimCommands, concatCommand],
    concatListPath,
    tempDirectory,
    expectedPreviewOutputPath,
    timeoutMs,
    executes: false,
    safetyNotes: [
      'Command plan is allowlisted and does not execute by itself.',
      'Uses preview/proxy trim and concat only.',
      'No final export, Remotion render, arbitrary args, or source overwrite is allowed in M14.',
    ],
  }
}

function validateCommandInput(input: SmartCutTimelineExecutionInput): void {
  if (input.allowFinalExport === true) {
    throw new Error('M14 FFmpeg command builder refuses final export.')
  }
  if (input.arbitraryFfmpegArgs && input.arbitraryFfmpegArgs.length > 0) {
    throw new Error('M14 FFmpeg command builder rejects arbitrary FFmpeg args.')
  }

  for (const [label, value] of [
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['ffmpegBin', input.ffmpegBin],
  ] as const) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}
