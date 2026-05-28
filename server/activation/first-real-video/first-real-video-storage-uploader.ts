import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { firstRealVideoConfig, phase28Prefix, validateFirstRealVideoEnv } from './first-real-video-policy'
import { validateFirstRealVideoSource } from './first-real-video-source-validator'
import type { FirstRealVideoUploadResult } from './first-real-video-types'

const execFileAsync = promisify(execFile)
export const FIRST_REAL_VIDEO_LATEST_RUN_PATH = 'activation-logs/first-real-video/phase28/latest-run.json'

export async function uploadFirstRealVideoSource(input: {
  sourceVideoPath?: string
  sourceGcsUri?: string
  repoRoot?: string
}): Promise<FirstRealVideoUploadResult> {
  const envBlockers = validateFirstRealVideoEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FIRST_REAL_VIDEO_SPEECH_CAPTION,
    sourceVideoPath: input.sourceVideoPath,
    sourceGcsUri: input.sourceGcsUri,
  })
  if (envBlockers.length > 0) throw new Error(envBlockers.join(' '))
  const validation = validateFirstRealVideoSource(input)
  if (!validation.allowed) throw new Error(validation.blockers.join(' '))

  const runId = `phase28-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const extension = path.extname(validation.sanitizedFilename).toLowerCase() || '.mov'
  const sourceObject = `${phase28Prefix(runId)}/source-video${extension}`
  const sourceGcsUri = `gs://${firstRealVideoConfig.sourceBucket}/${sourceObject}`

  if (input.sourceVideoPath) {
    await execFileAsync('gcloud', ['storage', 'cp', input.sourceVideoPath, sourceGcsUri], { timeout: 20 * 60_000, maxBuffer: 16 * 1024 * 1024 })
  } else if (input.sourceGcsUri) {
    await execFileAsync('gcloud', ['storage', 'cp', input.sourceGcsUri, sourceGcsUri], { timeout: 20 * 60_000, maxBuffer: 16 * 1024 * 1024 })
  }
  await execFileAsync('gcloud', ['storage', 'objects', 'describe', sourceGcsUri, '--format=json'], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })

  const result: FirstRealVideoUploadResult = {
    runId,
    sourceGcsUri,
    sourceObject,
    sourceBucket: firstRealVideoConfig.sourceBucket,
    sanitizedFilename: validation.sanitizedFilename,
    uploadedAt: new Date().toISOString(),
  }
  await mkdir(path.dirname(FIRST_REAL_VIDEO_LATEST_RUN_PATH), { recursive: true })
  await writeFile(FIRST_REAL_VIDEO_LATEST_RUN_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  return result
}

export async function readLatestFirstRealVideoUpload(): Promise<FirstRealVideoUploadResult | undefined> {
  try {
    return JSON.parse(await readFile(FIRST_REAL_VIDEO_LATEST_RUN_PATH, 'utf8')) as FirstRealVideoUploadResult
  } catch {
    return undefined
  }
}
