import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { getPhase39CVlmRuntimeAssets } from './vlm-runtime-phase39b-assets'
import { vlmRuntimeConfig } from './vlm-runtime-policy'

const execFileAsync = promisify(execFile)

export async function describePhase39BVlmObjects(): Promise<Array<{
  relativePath: string
  gcsUri: string
  sizeBytes?: number
  generation?: string
  crc32c?: string
  md5Hash?: string
}>> {
  const described = []
  for (const asset of getPhase39CVlmRuntimeAssets()) {
    const output = await runGcloud(['storage', 'objects', 'describe', asset.gcsUri, '--format=json'])
    const parsed = parseGcloudJson(output) as Record<string, unknown>
    described.push({
      relativePath: asset.relativePath,
      gcsUri: asset.gcsUri,
      sizeBytes: Number(parsed.size ?? parsed.contentLength ?? 0),
      generation: typeof parsed.generation === 'string' ? parsed.generation : undefined,
      crc32c: typeof parsed.crc32c === 'string' ? parsed.crc32c : undefined,
      md5Hash: typeof parsed.md5Hash === 'string' ? parsed.md5Hash : undefined,
    })
  }
  return described
}

export async function copyPhase39BVlmAssetsFromPrivateGcs(input: {
  localRoot: string
}): Promise<string> {
  const modelRoot = path.join(input.localRoot, 'models', 'qwen3-vl-8b-instruct')
  await mkdir(modelRoot, { recursive: true })
  for (const asset of getPhase39CVlmRuntimeAssets()) {
    const localPath = path.join(modelRoot, asset.relativePath)
    await mkdir(path.dirname(localPath), { recursive: true })
    await runGcloud(['storage', 'cp', asset.gcsUri, localPath], 60 * 60 * 1000)
  }
  return modelRoot
}

export async function verifyVlmRuntimeBuckets(): Promise<{
  activeAccount: string
  activeProject: string
  generatedBucketReachable: boolean
  qaBucketReachable: boolean
  publicIamDetected: boolean
  warnings: string[]
}> {
  const warnings: string[] = []
  const activeAccount = lastGcloudValue(await runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']))
  const activeProject = lastGcloudValue(await runGcloud(['config', 'get-value', 'project']))
  const generatedBucket = await runGcloud(['storage', 'buckets', 'describe', `gs://${vlmRuntimeConfig.generatedAssetsBucket}`, '--format=json'])
  const qaBucket = await runGcloud(['storage', 'buckets', 'describe', `gs://${vlmRuntimeConfig.qaBucket}`, '--format=json'])
  const generatedIam = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${vlmRuntimeConfig.generatedAssetsBucket}`, '--format=json'])
  const qaIam = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${vlmRuntimeConfig.qaBucket}`, '--format=json'])
  if (/WARNING|Python 3\.9/.test(generatedBucket + qaBucket)) warnings.push('gcloud emitted local Python warnings; commands are accepted only when JSON parses and exits successfully.')
  return {
    activeAccount,
    activeProject,
    generatedBucketReachable: generatedBucket.includes(vlmRuntimeConfig.generatedAssetsBucket),
    qaBucketReachable: qaBucket.includes(vlmRuntimeConfig.qaBucket),
    publicIamDetected: /allUsers|allAuthenticatedUsers/.test(generatedIam) || /allUsers|allAuthenticatedUsers/.test(qaIam),
    warnings,
  }
}

export async function runGcloud(args: string[], timeout = 5 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync('gcloud', args, {
    timeout,
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

export function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 120)}`)
  const open = output[jsonStart]
  const jsonEnd = open === '{' ? output.lastIndexOf('}') : output.lastIndexOf(']')
  if (jsonEnd < jsonStart) throw new Error(`gcloud JSON was incomplete: ${output.slice(0, 120)}`)
  return JSON.parse(output.slice(jsonStart, jsonEnd + 1))
}

function lastGcloudValue(output: string): string {
  return output.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}
