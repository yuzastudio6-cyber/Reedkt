import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateRealVideoAudioCleanupEnv } from './real-video-audio-cleanup-policy'
import { buildRealVideoAudioCleanupPlan } from './real-video-audio-normalization-runner'
import type { RealVideoAudioCleanupRuntimeReport } from './real-video-audio-cleanup-types'

export const REAL_VIDEO_AUDIO_CLEANUP_LOG_ROOT = 'activation-logs/real-video-audio-cleanup/phase31'
export const REAL_VIDEO_AUDIO_CLEANUP_LOCAL_REPORT_PATH = `${REAL_VIDEO_AUDIO_CLEANUP_LOG_ROOT}/phase31-report.json`
export const REAL_VIDEO_AUDIO_CLEANUP_LATEST_RUN_PATH = `${REAL_VIDEO_AUDIO_CLEANUP_LOG_ROOT}/latest-run.json`

export async function executeRealVideoAudioCleanup(): Promise<RealVideoAudioCleanupRuntimeReport> {
  const blockers = validateRealVideoAudioCleanupEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_AUDIO_CLEANUP,
  })
  if (blockers.length > 0) throw new Error(blockers.join(' '))
  throw new Error('Phase 31 execution is performed by the deployed staging render Cloud Run job. Use this CLI for static/report mode and download the job report after execution.')
}

export async function writePhase31CommandPlan(): Promise<string> {
  const runId = `phase31-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const plan = buildRealVideoAudioCleanupPlan({ runId })
  const outputPath = path.join(REAL_VIDEO_AUDIO_CLEANUP_LOG_ROOT, 'phase31-command-plan.json')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({
    runId,
    plan,
    execution: 'Cloud Run render job only',
    deploymentImageTag: 'staging-phase31-audio-001',
    gpuAllowed: false,
    providerExecutionAllowed: false,
    modelDownloadAllowed: false,
    publicDeliveryAllowed: false,
  }, null, 2)}\n`, 'utf8')
  return outputPath
}
