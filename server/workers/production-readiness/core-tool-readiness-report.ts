import type { ProductionReadinessStatus } from './production-tool-readiness-types'
import type { CoreToolReadinessCheckResult } from './core-cpu-render-readiness-checks'

export interface CoreToolReadinessReport {
  totalChecks: number
  statuses: Record<ProductionReadinessStatus, number>
  ffmpegStatus: ProductionReadinessStatus
  ffprobeStatus: ProductionReadinessStatus
  ffmpegLgplVerificationStatus: ProductionReadinessStatus
  libassSubtitleSupportStatus: ProductionReadinessStatus
  pythonMediaPackageStatus: ProductionReadinessStatus
  nodeRenderPackageStatus: ProductionReadinessStatus
  openTimelineIoStatus: ProductionReadinessStatus
  launchAudioPackageStatus: ProductionReadinessStatus
  optionalColorPackageStatus: ProductionReadinessStatus
  revideoStatus: ProductionReadinessStatus
  gpuModelToolsExcluded: boolean
  notes: string[]
}

const readinessStatuses: ProductionReadinessStatus[] = [
  'passed',
  'warning',
  'missing',
  'blocked',
  'not_installed',
  'future_only',
  'evaluation_only',
  'needs_license_review',
  'pending_manual_review',
  'not_checked',
]

function emptyStatusCounts(): Record<ProductionReadinessStatus, number> {
  return Object.fromEntries(readinessStatuses.map((status) => [status, 0])) as Record<ProductionReadinessStatus, number>
}

function statusForTool(
  results: CoreToolReadinessCheckResult[],
  toolId: string,
  fallback: ProductionReadinessStatus = 'not_checked',
): ProductionReadinessStatus {
  const result = results.find((item) => item.toolId === toolId)
  return result?.status ?? fallback
}

function aggregateStatus(statuses: ProductionReadinessStatus[]): ProductionReadinessStatus {
  if (statuses.includes('blocked')) return 'blocked'
  if (statuses.includes('missing')) return 'missing'
  if (statuses.includes('not_installed')) return 'not_installed'
  if (statuses.includes('pending_manual_review')) return 'pending_manual_review'
  if (statuses.includes('warning')) return 'warning'
  if (statuses.every((status) => status === 'passed')) return 'passed'
  return 'not_checked'
}

export function buildCoreToolReadinessReport(
  results: CoreToolReadinessCheckResult[],
  gpuModelToolsExcluded = true,
): CoreToolReadinessReport {
  const statuses = emptyStatusCounts()
  for (const result of results) {
    statuses[result.status] += 1
  }

  const pythonCoreStatuses = results
    .filter((result) => result.checkKind === 'python_import' && !result.optional)
    .map((result) => result.status)
  const nodeCoreStatuses = results
    .filter((result) => result.checkKind === 'node_package_metadata' && !result.optional)
    .map((result) => result.status)
  const optionalColorStatuses = results
    .filter((result) => result.toolId === 'openimageio' || result.toolId === 'opencolorio')
    .map((result) => result.status)

  return {
    totalChecks: results.length,
    statuses,
    ffmpegStatus: statusForTool(results, 'ffmpeg'),
    ffprobeStatus: statusForTool(results, 'ffprobe'),
    ffmpegLgplVerificationStatus: statusForTool(results, 'ffmpeg_lgpl_policy', 'pending_manual_review'),
    libassSubtitleSupportStatus: statusForTool(results, 'libass'),
    pythonMediaPackageStatus: aggregateStatus(pythonCoreStatuses),
    nodeRenderPackageStatus: aggregateStatus(nodeCoreStatuses),
    openTimelineIoStatus: statusForTool(results, 'opentimelineio'),
    launchAudioPackageStatus: statusForTool(results, 'audioflux'),
    optionalColorPackageStatus: aggregateStatus(optionalColorStatuses),
    revideoStatus: statusForTool(results, 'revideo', 'evaluation_only'),
    gpuModelToolsExcluded,
    notes: [
      'M10 readiness checks are command/version, Python import, Node package metadata, and manual policy review checks only.',
      'AudioFlux readiness is import-only CPU launch-core evidence and must not process audio in this gate.',
      'FFmpeg and ffprobe checks must not process media.',
      'FFmpeg commercial LGPL-safe build verification remains pending manual legal/build review.',
      'Revideo remains evaluation-only and is not installed as a core render dependency.',
      'GPU/model tools are excluded from M10 core CPU/render readiness.',
    ],
  }
}
