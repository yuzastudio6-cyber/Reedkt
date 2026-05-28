import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateRealVideoColorCorrectionEnv } from './real-video-color-correction-policy'
import { buildRealVideoColorCorrectionPlan } from './real-video-color-plan-builder'
import type { RealVideoColorRuntimeReport } from './real-video-color-correction-types'

export const REAL_VIDEO_COLOR_CORRECTION_LOG_ROOT = 'activation-logs/real-video-color-correction/phase32'
export const REAL_VIDEO_COLOR_CORRECTION_LOCAL_REPORT_PATH = `${REAL_VIDEO_COLOR_CORRECTION_LOG_ROOT}/phase32-report.json`
export const REAL_VIDEO_COLOR_CORRECTION_LATEST_RUN_PATH = `${REAL_VIDEO_COLOR_CORRECTION_LOG_ROOT}/latest-run.json`

export async function executeRealVideoColorCorrection(): Promise<RealVideoColorRuntimeReport> {
  const blockers = validateRealVideoColorCorrectionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_COLOR_CORRECTION,
  })
  if (blockers.length > 0) throw new Error(blockers.join(' '))
  throw new Error('Phase 32 execution is performed by the deployed staging render Cloud Run job. Use this CLI for static/report mode and download the job report after execution.')
}

export async function writePhase32CommandPlan(): Promise<string> {
  const runId = `phase32-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const plan = buildRealVideoColorCorrectionPlan({ runId })
  const outputPath = path.join(REAL_VIDEO_COLOR_CORRECTION_LOG_ROOT, 'phase32-command-plan.json')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({
    runId,
    plan,
    execution: 'Cloud Run render job only',
    deploymentImageTag: 'staging-phase32-color-001',
    gpuAllowed: false,
    providerExecutionAllowed: false,
    modelDownloadAllowed: false,
    openColorIoAllowed: false,
    openImageIoAllowed: false,
    publicDeliveryAllowed: false,
  }, null, 2)}\n`, 'utf8')
  return outputPath
}
