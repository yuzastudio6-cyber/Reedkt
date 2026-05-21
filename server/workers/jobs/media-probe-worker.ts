import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { normalizeStoragePath } from '../../storage/storage-paths'
import { parseCommandLine } from '../tools/tool-check-utils'
import type { WorkerJobRecord } from '../worker-job-loader'
import type { MediaProbeResult } from '../worker-result'
import { loadStorageObject } from './source-media-readiness-worker'

const execFileAsync = promisify(execFile)

export async function runMediaProbeWorker(context: ServiceContext, job: WorkerJobRecord): Promise<MediaProbeResult> {
  if (context.env.storageMode !== 'local') {
    throw new ApiError('MOCK_ONLY', 'Media probe is available only in local storage mode for RP-E2E-READY-01.', 409)
  }

  const storageObject = await loadStorageObject(context, job)
  const localPath = resolveLocalObjectPath(context.env.localStorageRoot, storageObject.bucketName, storageObject.objectPath)
  const parsedCommand = parseCommandLine(context.env.ffprobeBin)
  const result = await execFileAsync(parsedCommand.command, [
    ...parsedCommand.args,
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-print_format',
    'json',
    localPath,
  ], {
    timeout: context.env.toolCheckTimeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })
  const parsed = parseFFprobeOutput(String(result.stdout ?? '{}'))

  return {
    mediaAssetId: storageObject.mediaAssetId,
    storageObjectRecordId: storageObject.id,
    durationSeconds: parsed.durationSeconds,
    width: parsed.width,
    height: parsed.height,
    codecName: parsed.codecName,
    formatName: parsed.formatName,
    sizeBytes: parsed.sizeBytes ?? storageObject.sizeBytes,
    streamCount: parsed.streamCount,
    probeTool: 'ffprobe',
    mockOnly: context.env.mockOnly,
  }
}

function resolveLocalObjectPath(rootDir: string, bucketName: string, objectPath: string): string {
  const absoluteRoot = path.resolve(rootDir)
  const absolutePath = path.resolve(absoluteRoot, normalizeStoragePath(bucketName), normalizeStoragePath(objectPath))
  if (!absolutePath.startsWith(absoluteRoot + path.sep)) {
    throw new ApiError('VALIDATION_FAILED', 'Media probe storage path escapes local storage root.', 400)
  }
  return absolutePath
}

function parseFFprobeOutput(stdout: string): {
  durationSeconds?: number
  width?: number
  height?: number
  codecName?: string
  formatName?: string
  sizeBytes?: number
  streamCount: number
} {
  const data = JSON.parse(stdout) as {
    streams?: Array<Record<string, unknown>>
    format?: Record<string, unknown>
  }
  const streams = Array.isArray(data.streams) ? data.streams : []
  const videoStream = streams.find((stream) => stream.codec_type === 'video')
  const firstStream = streams[0]
  const duration = typeof data.format?.duration === 'string' ? Number(data.format.duration) : undefined
  const size = typeof data.format?.size === 'string' ? Number(data.format.size) : undefined
  return {
    durationSeconds: Number.isFinite(duration) ? duration : undefined,
    width: typeof videoStream?.width === 'number' ? videoStream.width : undefined,
    height: typeof videoStream?.height === 'number' ? videoStream.height : undefined,
    codecName: typeof firstStream?.codec_name === 'string' ? firstStream.codec_name : undefined,
    formatName: typeof data.format?.format_name === 'string' ? data.format.format_name : undefined,
    sizeBytes: Number.isFinite(size) ? size : undefined,
    streamCount: streams.length,
  }
}
