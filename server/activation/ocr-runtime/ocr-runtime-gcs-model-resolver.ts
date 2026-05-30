import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { getPhase37COcrRuntimeAssets } from './ocr-runtime-phase37b-assets'
import { ocrRuntimeConfig } from './ocr-runtime-policy'

const execFileAsync = promisify(execFile)

export async function copyPhase37BOcrAssetsFromPrivateGcs(input: {
  runId: string
  localRoot?: string
}): Promise<Array<ReturnType<typeof getPhase37COcrRuntimeAssets>[number] & { localPath: string }>> {
  const localRoot = input.localRoot ?? path.join(ocrRuntimeConfig.localTempRoot, input.runId)
  const rawRoot = path.join(localRoot, 'models', 'raw')
  const copied = []
  for (const asset of getPhase37COcrRuntimeAssets()) {
    const localPath = path.join(rawRoot, asset.relativePath)
    await mkdir(path.dirname(localPath), { recursive: true })
    await runGcloud(['storage', 'cp', asset.gcsUri, localPath])
    copied.push({ ...asset, localPath })
  }
  return copied
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gcloud', args, {
    maxBuffer: 30 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}
