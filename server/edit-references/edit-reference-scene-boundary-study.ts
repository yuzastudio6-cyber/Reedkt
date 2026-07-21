import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)

export interface EditReferenceSceneBoundaryStudyResult {
  status: 'verified_local_bounded' | 'blocked' | 'not_run'
  threshold: number
  maxBoundaryCount: number
  scannedDurationSeconds: number
  coverage: 'full' | 'partial' | 'not_run'
  boundaryTimesSeconds: number[]
  boundaryCount: number
  blockerCode?: string
  blockerMessage?: string
  semanticSceneAnalysisRan: false
  rawProcessOutputPersisted: false
}

/**
 * Produces bounded technical discontinuity candidates for Edit Reference B1.
 * It never interprets story scenes, editorial intent, or approved cut points.
 */
export async function runEditReferenceSceneBoundaryStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  threshold?: number
  maxBoundaryCount?: number
  maxScanDurationSeconds?: number
}): Promise<EditReferenceSceneBoundaryStudyResult> {
  const threshold = boundedNumber(input.threshold, 0.32, 0.05, 0.95)
  const maxBoundaryCount = Math.round(boundedNumber(input.maxBoundaryCount, 24, 1, 50))
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = Number(Math.min(sourceDurationSeconds, maxScanDurationSeconds).toFixed(3))

  if (scannedDurationSeconds <= 0) {
    return blockedResult({
      threshold,
      maxBoundaryCount,
      blockerCode: 'scene_boundary_duration_unavailable',
      blockerMessage: 'A bounded scene-change scan needs a verified positive media duration.',
    })
  }

  const coverage: EditReferenceSceneBoundaryStudyResult['coverage'] = sourceDurationSeconds <= maxScanDurationSeconds + 0.001
    ? 'full'
    : 'partial'

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const args = [
      '-hide_banner',
      '-nostdin',
      '-loglevel',
      'error',
      '-i',
      input.sourceLocalPath,
      '-t',
      String(scannedDurationSeconds),
      '-map',
      '0:v:0',
      '-vf',
      `select='gt(scene,${threshold})',metadata=print:file=-`,
      '-frames:v',
      String(maxBoundaryCount),
      '-an',
      '-f',
      'null',
      '-',
    ]
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceSceneBoundaryArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
    })
    const boundaryTimesSeconds = parseBoundaryTimes(
      output.stdout,
      scannedDurationSeconds,
      maxBoundaryCount,
    )

    return {
      status: 'verified_local_bounded',
      threshold,
      maxBoundaryCount,
      scannedDurationSeconds,
      coverage,
      boundaryTimesSeconds,
      boundaryCount: boundaryTimesSeconds.length,
      semanticSceneAnalysisRan: false,
      rawProcessOutputPersisted: false,
    }
  } catch {
    return blockedResult({
      threshold,
      maxBoundaryCount,
      blockerCode: 'ffmpeg_scene_boundary_scan_failed',
      blockerMessage: 'The bounded FFmpeg scene-change scan did not complete. No raw process output was persisted.',
      scannedDurationSeconds,
      coverage,
    })
  }
}

export function createNotRunEditReferenceSceneBoundaryResult(): EditReferenceSceneBoundaryStudyResult {
  return {
    status: 'not_run',
    threshold: 0.32,
    maxBoundaryCount: 24,
    scannedDurationSeconds: 0,
    coverage: 'not_run',
    boundaryTimesSeconds: [],
    boundaryCount: 0,
    semanticSceneAnalysisRan: false,
    rawProcessOutputPersisted: false,
  }
}

function parseBoundaryTimes(
  stdout: string,
  scannedDurationSeconds: number,
  maxBoundaryCount: number,
): number[] {
  const times = new Set<number>()
  for (const match of stdout.matchAll(/\bpts_time:([0-9]+(?:\.[0-9]+)?)/g)) {
    const value = Number(match[1])
    if (!Number.isFinite(value) || value <= 0 || value > scannedDurationSeconds + 0.05) continue
    times.add(Number(value.toFixed(3)))
    if (times.size >= maxBoundaryCount) break
  }
  return [...times].sort((left, right) => left - right)
}

function blockedResult(input: {
  threshold: number
  maxBoundaryCount: number
  blockerCode: string
  blockerMessage: string
  scannedDurationSeconds?: number
  coverage?: EditReferenceSceneBoundaryStudyResult['coverage']
}): EditReferenceSceneBoundaryStudyResult {
  return {
    status: 'blocked',
    threshold: input.threshold,
    maxBoundaryCount: input.maxBoundaryCount,
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    boundaryTimesSeconds: [],
    boundaryCount: 0,
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    semanticSceneAnalysisRan: false,
    rawProcessOutputPersisted: false,
  }
}

function boundedNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.max(minimum, Math.min(maximum, value))
}
