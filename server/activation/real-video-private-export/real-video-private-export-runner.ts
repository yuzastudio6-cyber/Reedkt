import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildRealVideoPrivateExportRenderPlan } from './real-video-private-export-render-plan-builder'
import { validateRealVideoPrivateExportEnv } from './real-video-private-export-policy'
import type { RealVideoPrivateExportRuntimeReport } from './real-video-private-export-types'

export const REAL_VIDEO_PRIVATE_EXPORT_LOG_ROOT = 'activation-logs/real-video-private-export/phase30'
export const REAL_VIDEO_PRIVATE_EXPORT_LOCAL_REPORT_PATH = `${REAL_VIDEO_PRIVATE_EXPORT_LOG_ROOT}/phase30-report.json`
export const REAL_VIDEO_PRIVATE_EXPORT_LATEST_RUN_PATH = `${REAL_VIDEO_PRIVATE_EXPORT_LOG_ROOT}/latest-run.json`

export async function executeRealVideoPrivateExport(): Promise<RealVideoPrivateExportRuntimeReport> {
  const blockers = validateRealVideoPrivateExportEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_PRIVATE_EXPORT,
  })
  if (blockers.length > 0) throw new Error(blockers.join(' '))
  throw new Error('Phase 30 execution is performed by the deployed staging render Cloud Run job. Use this CLI for static/report mode and download the job report after execution.')
}

export async function writePhase30CommandPlan(): Promise<string> {
  const runId = `phase30-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const plan = buildRealVideoPrivateExportRenderPlan({ runId })
  const outputPath = path.join(REAL_VIDEO_PRIVATE_EXPORT_LOG_ROOT, 'phase30-command-plan.json')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({
    runId,
    plan,
    execution: 'Cloud Run render job only',
    deploymentImageTag: 'staging-phase30-export-001',
    gpuAllowed: false,
    providerExecutionAllowed: false,
    modelDownloadAllowed: false,
    publicDeliveryAllowed: false,
  }, null, 2)}\n`, 'utf8')
  return outputPath
}
