import { execFile } from 'node:child_process'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { sha256File } from '../ocr-runtime'
import { getSelectedControlledRealVideoOcrSafeZoneSample } from './controlled-real-video-chain-registry'
import { controlledRealVideoOcrExecutionConfig } from './controlled-real-video-ocr-execution-policy'
import type {
  ControlledRealVideoGcsObjectMetadata,
  ControlledRealVideoLocalSourceCopy,
} from './controlled-real-video-ocr-execution-types'

const execFileAsync = promisify(execFile)

export function parseControlledGcsUri(gcsUri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gcsUri)
  if (!match) throw new Error(`Expected private gs:// URI, got: ${gcsUri}`)
  return { bucket: match[1], object: match[2] }
}

export async function describeControlledGcsObject(gcsUri: string): Promise<ControlledRealVideoGcsObjectMetadata> {
  const parsed = parseControlledGcsUri(gcsUri)
  const output = await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])
  const metadata = parseGcloudJson(output)
  return {
    gcsUri,
    bucket: parsed.bucket,
    object: parsed.object,
    sizeBytes: Number(metadata.size ?? metadata.contentLength ?? 0),
    generation: stringValue(metadata.generation),
    crc32c: stringValue(metadata.crc32c),
    md5Hash: stringValue(metadata.md5Hash),
    contentType: stringValue(metadata.contentType),
    updated: stringValue(metadata.updated),
  }
}

export async function copyApprovedControlledRealVideoSourceFromPrivateGcs(input: {
  runId: string
  localRoot: string
}): Promise<ControlledRealVideoLocalSourceCopy> {
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const sourceMetadata = await describeControlledGcsObject(sample.sourceGcsUri)
  if (sourceMetadata.sizeBytes !== controlledRealVideoOcrExecutionConfig.sourceObjectSizeBytes) {
    throw new Error(`Phase 37D source object size mismatch: expected ${controlledRealVideoOcrExecutionConfig.sourceObjectSizeBytes}, got ${sourceMetadata.sizeBytes}.`)
  }
  if (sourceMetadata.contentType && sourceMetadata.contentType !== controlledRealVideoOcrExecutionConfig.sourceContentType) {
    throw new Error(`Phase 37D source content-type mismatch: expected ${controlledRealVideoOcrExecutionConfig.sourceContentType}, got ${sourceMetadata.contentType}.`)
  }

  const localSourceDir = path.join(input.localRoot, 'source')
  await mkdir(localSourceDir, { recursive: true })
  const localPath = path.join(localSourceDir, controlledRealVideoOcrExecutionConfig.sourceLocalFileName)
  await copyPrivateGcsObject(sample.sourceGcsUri, localPath)
  const fileStat = await stat(localPath)
  const actualSha256 = await sha256File(localPath)
  return {
    gcs: sourceMetadata,
    localPath,
    sizeBytes: fileStat.size,
    expectedSha256: sample.sourceSha256,
    actualSha256,
    verified: fileStat.size === sourceMetadata.sizeBytes && actualSha256 === sample.sourceSha256,
  }
}

export async function runControlledGcloud(args: string[], timeout = 5 * 60 * 1000): Promise<string> {
  return runGcloud(args, timeout)
}

export function parseControlledGcloudJson(output: string): Record<string, unknown> {
  return parseGcloudJson(output)
}

async function runGcloud(args: string[], timeout = 5 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync('gcloud', args, {
    timeout,
    maxBuffer: 80 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

async function copyPrivateGcsObject(gcsUri: string, localPath: string): Promise<void> {
  try {
    await execFileAsync('gsutil', ['cp', gcsUri, localPath], {
      timeout: 10 * 60 * 1000,
      maxBuffer: 80 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    })
  } catch (error) {
    const maybe = error as { code?: string }
    if (maybe.code !== 'ENOENT') throw error
    await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
  }
}

function parseGcloudJson(output: string): Record<string, unknown> {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 160)}`)
  const parsed = JSON.parse(output.slice(jsonStart)) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('gcloud JSON response was not an object.')
  return parsed as Record<string, unknown>
}

function stringValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  return String(value)
}
