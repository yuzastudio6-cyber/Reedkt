import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface RuntimeEnv {
  projectId: string
  jobName: string
  modelManifestId: string
  modelGcsPath: string
  modelRuntimePath: string
  expectedSha256: string
  reportBucket: string
}

interface TranscriptionOutput {
  status: 'completed' | 'failed'
  language?: string
  segments: Array<{ text: string }>
  fullText: string
  warnings: string[]
}

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const runId = `phase27a-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-speech-runtime-${runId}`)
  const fixturePath = path.join(workDir, 'generated-audio.wav')
  const outputPath = path.join(workDir, 'faster-whisper-output.json')

  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })
  await rm(env.modelRuntimePath, { recursive: true, force: true })
  await mkdir(env.modelRuntimePath, { recursive: true })

  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const aggregateSha256 = await verifyChecksums(env.modelRuntimePath, env.expectedSha256)
    await generateFixtureAudio(fixturePath)
    const transcription = await runFasterWhisper(env.modelRuntimePath, fixturePath, outputPath)
    const reportObject = `activation-speech-runtime/phase27a/${runId}/speech-runtime-report.json`
    const report = {
      ok: transcription.status === 'completed',
      runId,
      projectId: env.projectId,
      jobName: env.jobName,
      model: {
        manifestId: env.modelManifestId,
        name: 'Systran/faster-whisper-tiny',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        aggregateSha256,
        copiedFiles,
      },
      fixture: {
        generated: true,
        path: fixturePath,
        durationSeconds: 2,
      },
      transcription: {
        status: transcription.status,
        segmentCount: transcription.segments.length,
        fullText: transcription.fullText,
        language: transcription.language,
        warnings: transcription.warnings,
      },
      safety: {
        providerExecuted: false,
        modelDownloadedExternally: false,
        realUserMediaUsed: false,
        gpuUsed: false,
        secretValuesUsed: false,
      },
      uploadedReport: {
        bucket: env.reportBucket,
        object: reportObject,
      },
      warnings: transcription.warnings,
    }
    await uploadJson(storage, env.reportBucket, reportObject, report)
    console.log(JSON.stringify(report))
  } finally {
    await rm(workDir, { recursive: true, force: true })
    await rm(env.modelRuntimePath, { recursive: true, force: true })
  }
}

function readRuntimeEnv(): RuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME !== 'true') throw new Error('REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME=true is required.')
  if (process.env.REEDITPRO_STAGING_SPEECH_RUNTIME !== 'true') throw new Error('REEDITPRO_STAGING_SPEECH_RUNTIME=true is required.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.HF_HUB_OFFLINE !== '1') throw new Error('HF_HUB_OFFLINE=1 is required.')

  const modelManifestId = process.env.REEDITPRO_APPROVED_MODEL_ID
  const modelGcsPath = process.env.REEDITPRO_MODEL_GCS_PATH
  const modelRuntimePath = process.env.REEDITPRO_MODEL_RUNTIME_PATH
  const expectedSha256 = process.env.REEDITPRO_MODEL_EXPECTED_SHA256
  if (modelManifestId !== 'faster_whisper_tiny_staging_v1') throw new Error('Only faster_whisper_tiny_staging_v1 is allowed.')
  if (modelGcsPath !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/') throw new Error('Only the approved private tiny model GCS path is allowed.')
  if (modelRuntimePath !== '/tmp/reeditpro-model-weights/faster-whisper/tiny') throw new Error('Unexpected runtime model path.')
  if (expectedSha256 !== '331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5') throw new Error('Unexpected model checksum.')

  return {
    projectId: process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'reeditpro',
    jobName: process.env.K_SERVICE ?? 'reeditpro-staging-speech-runtime-job',
    modelManifestId,
    modelGcsPath,
    modelRuntimePath,
    expectedSha256,
    reportBucket: 'reeditpro-staging-reeditpro-worker-temp',
  }
}

async function syncApprovedModel(storage: Storage, env: RuntimeEnv): Promise<string[]> {
  const { bucket, prefix } = parseGcsPrefix(env.modelGcsPath)
  const checksumObject = `${prefix}file_checksums_sha256.txt`
  const treeManifestObject = `${prefix}model_tree_manifest.json`
  await downloadObject(storage, bucket, checksumObject, path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'))
  await downloadObject(storage, bucket, treeManifestObject, path.join(env.modelRuntimePath, 'model_tree_manifest.json'))

  const checksumText = await readFile(path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'), 'utf8')
  const relativePaths = checksumText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/).slice(1).join(' '))
  for (const relativePath of relativePaths) {
    assertSafeRelativePath(relativePath)
    await downloadObject(storage, bucket, `${prefix}${relativePath}`, path.join(env.modelRuntimePath, relativePath))
  }

  return [...relativePaths, 'file_checksums_sha256.txt', 'model_tree_manifest.json']
}

async function verifyChecksums(runtimePath: string, expectedAggregate: string): Promise<string> {
  const checksumText = await readFile(path.join(runtimePath, 'file_checksums_sha256.txt'), 'utf8')
  const aggregate = createHash('sha256').update(checksumText).digest('hex')
  if (aggregate !== expectedAggregate) throw new Error(`Aggregate checksum mismatch: ${aggregate}`)

  for (const line of checksumText.split('\n').filter(Boolean)) {
    const [expected, ...pathParts] = line.trim().split(/\s+/)
    const relativePath = pathParts.join(' ')
    assertSafeRelativePath(relativePath)
    const actual = createHash('sha256').update(await readFile(path.join(runtimePath, relativePath))).digest('hex')
    if (actual !== expected) throw new Error(`Checksum mismatch for ${relativePath}`)
  }
  return aggregate
}

async function generateFixtureAudio(fixturePath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=16000:cl=mono',
    '-t',
    '2',
    '-c:a',
    'pcm_s16le',
    fixturePath,
  ], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 })
}

async function runFasterWhisper(modelPath: string, fixturePath: string, outputPath: string): Promise<TranscriptionOutput> {
  const scriptPath = '/app/speech-runtime/faster_whisper_local.py'
  await execFileAsync('python3', [
    scriptPath,
    '--model-path',
    modelPath,
    '--audio-path',
    fixturePath,
    '--output-json',
    outputPath,
    '--device',
    'cpu',
    '--compute-type',
    'int8',
    '--word-timestamps',
  ], {
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
    },
  })
  return JSON.parse(await readFile(outputPath, 'utf8')) as TranscriptionOutput
}

async function downloadObject(storage: Storage, bucketName: string, objectName: string, targetPath: string): Promise<void> {
  if (!objectName.startsWith('model-weights/faster-whisper/tiny/')) throw new Error(`Blocked model object: ${objectName}`)
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
}

async function uploadJson(storage: Storage, bucketName: string, objectName: string, payload: unknown): Promise<void> {
  await storage.bucket(bucketName).file(objectName).save(`${JSON.stringify(payload, null, 2)}\n`, {
    contentType: 'application/json',
    resumable: false,
    metadata: {
      metadata: {
        phase: '27a',
        generatedFixtureOnly: 'true',
        providerExecuted: 'false',
        modelDownloadedExternally: 'false',
      },
    },
  })
}

function parseGcsPrefix(gcsPath: string): { bucket: string; prefix: string } {
  const match = /^gs:\/\/([^/]+)\/(.+\/)$/.exec(gcsPath)
  if (!match) throw new Error('Invalid GCS model path.')
  return { bucket: match[1], prefix: match[2] }
}

function assertSafeRelativePath(relativePath: string): void {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..') || /https?:\/\//i.test(relativePath)) {
    throw new Error(`Unsafe model file path: ${relativePath}`)
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    providerExecuted: false,
    modelDownloadedExternally: false,
    realUserMediaUsed: false,
    gpuUsed: false,
  }))
  process.exitCode = 1
})
