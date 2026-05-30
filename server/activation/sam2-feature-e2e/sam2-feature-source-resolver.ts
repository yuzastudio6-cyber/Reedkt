import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { sam2FeatureE2EConfig } from './sam2-feature-e2e-policy'
import type { Sam2FeatureSourceValidation } from './sam2-feature-e2e-types'

const execFileAsync = promisify(execFile)
type LocalSourceCandidate = Sam2FeatureSourceValidation['localCandidatesChecked'][number]

export async function resolveSam2FeatureSource(): Promise<Sam2FeatureSourceValidation> {
  const localCandidates: LocalSourceCandidate[] = await Promise.all(sam2FeatureE2EConfig.approvedLocalSourceCandidates.map(async (candidate): Promise<LocalSourceCandidate> => {
    if (!existsSync(candidate)) {
      return { path: candidate, exists: false, selected: false }
    }
    try {
      const probe = await probeLocalVideo(candidate)
      const matchedApprovedEvidence = Math.abs(probe.durationSeconds - 16.083333) < 0.2
        && probe.width === 3840
        && probe.height === 2160
        && probe.hasAudio
      return { path: candidate, exists: true, selected: false, ...probe, matchedApprovedEvidence }
    } catch (error) {
      return { path: candidate, exists: true, selected: false, warning: error instanceof Error ? error.message : String(error) }
    }
  }))
  const matchingLocal = localCandidates.find((candidate) => candidate.exists && candidate.matchedApprovedEvidence)

  if (matchingLocal) {
    return {
      selectedSource: matchingLocal.path,
      sourceMode: 'verified_local_source',
      approvedPreviewSource: sam2FeatureE2EConfig.approvedPreviewSource,
      approvedGcsSource: sam2FeatureE2EConfig.approvedGcsSource,
      localCandidatesChecked: localCandidates.map((candidate) => ({
        ...candidate,
        selected: candidate.path === matchingLocal.path,
      })),
      durationSeconds: matchingLocal.durationSeconds ?? 16.083333,
      width: matchingLocal.width ?? 3840,
      height: matchingLocal.height ?? 2160,
      hasAudio: matchingLocal.hasAudio ?? true,
      privateSourceOnly: true,
      blockers: [],
      warnings: [
        'Local source matched approved original source evidence; Phase 35F still uses the Phase 32 private export for bounded preview execution by default.',
      ],
    }
  }

  return {
    selectedSource: sam2FeatureE2EConfig.approvedPreviewSource,
    sourceMode: 'approved_gcs_export',
    approvedPreviewSource: sam2FeatureE2EConfig.approvedPreviewSource,
    approvedGcsSource: sam2FeatureE2EConfig.approvedGcsSource,
    localCandidatesChecked: localCandidates,
    durationSeconds: sam2FeatureE2EConfig.controlledPreviewDurationSeconds,
    width: 768,
    height: 432,
    hasAudio: true,
    privateSourceOnly: true,
    blockers: [],
    warnings: [
      'No matching approved local source was selected; using the approved private Phase 32 color-corrected export.',
    ],
  }
}

async function probeLocalVideo(filePath: string): Promise<{
  durationSeconds: number
  width: number
  height: number
  hasAudio: boolean
}> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ], {
    timeout: 2 * 60_000,
    maxBuffer: 20 * 1024 * 1024,
  })
  const probe = JSON.parse(stdout) as {
    format?: { duration?: string }
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>
  }
  const durationSeconds = Number(probe.format?.duration)
  const videoStream = probe.streams?.find((stream) => stream.codec_type === 'video')
  const hasAudio = Boolean(probe.streams?.some((stream) => stream.codec_type === 'audio'))
  if (!Number.isFinite(durationSeconds) || !videoStream?.width || !videoStream.height) throw new Error(`Could not probe local video evidence for ${filePath}.`)
  return {
    durationSeconds,
    width: videoStream.width,
    height: videoStream.height,
    hasAudio,
  }
}
