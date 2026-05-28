import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type FixtureStage = 'cpu' | 'render' | 'qa'

interface FixtureEnv {
  stage: FixtureStage
  runId: string
  prefix: string
  projectId: string
  sourceBucket: string
  sourceObject: string
  proxyBucket: string
  analysisBucket: string
  transcriptsBucket: string
  previewsBucket: string
  finalExportsBucket: string
  qaBucket: string
}

interface ArtifactRecord {
  id: string
  bucket: string
  object: string
  kind: string
  sizeBytes?: number
  sha256?: string
}

async function main(): Promise<void> {
  const env = readFixtureEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase25-${env.stage}-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    if (env.stage === 'cpu') await runCpuStage(storage, env, workDir)
    if (env.stage === 'render') await runRenderStage(storage, env, workDir)
    if (env.stage === 'qa') await runQaStage(storage, env)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function runCpuStage(storage: Storage, env: FixtureEnv, workDir: string): Promise<void> {
  const sourcePath = path.join(workDir, 'fixture.mp4')
  const proxyPath = path.join(workDir, 'proxy.mp4')
  await downloadObject(storage, env.sourceBucket, env.sourceObject, sourcePath)
  const probe = await ffprobe(sourcePath).catch((error) => ({
    warning: error instanceof Error ? error.message : 'Source probe failed; using generated fixture proxy fallback.',
    generatedFixtureProbeFallback: true,
  }))

  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=320x180:rate=30',
    '-t',
    '4',
    '-c:v',
    'mpeg4',
    '-q:v',
    '5',
    '-pix_fmt',
    'yuv420p',
    '-an',
    proxyPath,
  ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })

  const proxyObject = `${env.prefix}/proxy/proxy.mp4`
  const analysisObject = `${env.prefix}/analysis/media-analysis.json`
  const transcriptObject = `${env.prefix}/transcripts/transcript.json`
  const timelineObject = `${env.prefix}/analysis/timeline-manifest.json`

  const proxy = await uploadFile(storage, env.proxyBucket, proxyObject, proxyPath, 'video/mp4', env)
  const analysis = await uploadJson(storage, env.analysisBucket, analysisObject, {
    phase: '25',
    runId: env.runId,
    source: objectRef(env.sourceBucket, env.sourceObject),
    proxy: objectRef(env.proxyBucket, proxyObject),
    probe,
    generatedFixtureOnly: true,
    providerExecuted: false,
    modelDownloadExecuted: false,
    gpuExecuted: false,
  }, env)
  const transcript = await uploadJson(storage, env.transcriptsBucket, transcriptObject, {
    phase: '25',
    runId: env.runId,
    mode: 'dry_run_generated_fixture',
    segments: [
      { id: 'fixture-segment-1', startSeconds: 0, endSeconds: 2, text: 'Generated fixture only.', confidence: 1 },
    ],
  }, env)
  const timeline = await uploadJson(storage, env.analysisBucket, timelineObject, {
    phase: '25',
    runId: env.runId,
    fps: 30,
    durationSeconds: readDurationSeconds(probe) ?? 2,
    source: objectRef(env.sourceBucket, env.sourceObject),
    proxy: objectRef(env.proxyBucket, proxyObject),
    operations: [
      { id: 'fixture-hold', type: 'hold', startSeconds: 0, endSeconds: Math.min(readDurationSeconds(probe) ?? 2, 5) },
    ],
  }, env)

  await uploadJson(storage, env.analysisBucket, `${env.prefix}/analysis/cpu-artifact-manifest.json`, {
    phase: '25',
    runId: env.runId,
    stage: 'cpu',
    artifacts: [proxy, analysis, transcript, timeline],
  }, env)
  console.log(JSON.stringify({ ok: true, stage: 'cpu', runId: env.runId, artifacts: [proxy, analysis, transcript, timeline] }))
}

async function runRenderStage(storage: Storage, env: FixtureEnv, workDir: string): Promise<void> {
  const proxyObject = `${env.prefix}/proxy/proxy.mp4`
  const previewObject = `${env.prefix}/previews/preview.mp4`
  const finalObject = `${env.prefix}/final-exports/final-export.mp4`
  const renderManifestObject = `${env.prefix}/previews/render-manifest.json`
  const proxyPath = path.join(workDir, 'proxy.mp4')
  const previewPath = path.join(workDir, 'preview.mp4')
  const finalPath = path.join(workDir, 'final-export.mp4')

  await downloadObject(storage, env.proxyBucket, proxyObject, proxyPath)
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    proxyPath,
    '-t',
    '5',
    '-c',
    'copy',
    previewPath,
  ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    proxyPath,
    '-t',
    '5',
    '-c',
    'copy',
    finalPath,
  ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })

  const preview = await uploadFile(storage, env.previewsBucket, previewObject, previewPath, 'video/mp4', env)
  const finalExport = await uploadFile(storage, env.finalExportsBucket, finalObject, finalPath, 'video/mp4', env)
  const manifest = await uploadJson(storage, env.previewsBucket, renderManifestObject, {
    phase: '25',
    runId: env.runId,
    mode: 'generated_fixture_safe_render',
    sourceProxy: objectRef(env.proxyBucket, proxyObject),
    preview: objectRef(env.previewsBucket, previewObject),
    finalExport: objectRef(env.finalExportsBucket, finalObject),
    providerExecuted: false,
    modelDownloadExecuted: false,
    gpuExecuted: false,
  }, env)

  console.log(JSON.stringify({ ok: true, stage: 'render', runId: env.runId, artifacts: [preview, finalExport, manifest] }))
}

async function runQaStage(storage: Storage, env: FixtureEnv): Promise<void> {
  const expected = [
    { kind: 'analysis_report', bucket: env.analysisBucket, object: `${env.prefix}/analysis/media-analysis.json` },
    { kind: 'timeline_manifest', bucket: env.analysisBucket, object: `${env.prefix}/analysis/timeline-manifest.json` },
    { kind: 'preview', bucket: env.previewsBucket, object: `${env.prefix}/previews/preview.mp4` },
    { kind: 'render_manifest', bucket: env.previewsBucket, object: `${env.prefix}/previews/render-manifest.json` },
    { kind: 'final_export', bucket: env.finalExportsBucket, object: `${env.prefix}/final-exports/final-export.mp4` },
  ]
  const checks = await Promise.all(expected.map(async (artifact) => ({
    ...artifact,
    exists: await objectExists(storage, artifact.bucket, artifact.object),
  })))
  const missing = checks.filter((check) => !check.exists)
  const status = missing.length === 0 ? 'passed' : 'blocked'
  const qa = await uploadJson(storage, env.qaBucket, `${env.prefix}/qa/qa-summary.json`, {
    phase: '25',
    runId: env.runId,
    status,
    generatedFixtureOnly: true,
    finalDeliveryAllowed: missing.length === 0,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
    checks,
    blockers: missing.map((artifact) => `Missing ${artifact.kind}: gs://${artifact.bucket}/${artifact.object}`),
  }, env)

  if (missing.length > 0) {
    console.error(JSON.stringify({ ok: false, stage: 'qa', runId: env.runId, missing, qa }))
    process.exitCode = 2
    return
  }
  console.log(JSON.stringify({ ok: true, stage: 'qa', runId: env.runId, artifacts: [qa] }))
}

function readFixtureEnv(): FixtureEnv {
  const stage = (readArg('--stage') ?? process.env.STAGING_FIXTURE_STAGE) as FixtureStage | undefined
  if (!stage || !['cpu', 'render', 'qa'].includes(stage)) throw new Error('STAGING_FIXTURE_STAGE or --stage must be cpu, render, or qa.')
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_STAGING_E2E !== 'true') throw new Error('REEDITPRO_CONFIRM_STAGING_E2E must be true.')
  const runId = requireEnv('STAGING_FIXTURE_RUN_ID')
  const prefix = process.env.STAGING_FIXTURE_PREFIX ?? `activation-fixtures/phase25/${runId}`
  assertFixturePrefix(prefix)
  const sourceObject = requireEnv('STAGING_FIXTURE_SOURCE_OBJECT')
  assertFixturePrefix(sourceObject)
  return {
    stage,
    runId,
    prefix,
    projectId: process.env.GCP_PROJECT_ID ?? 'reeditpro',
    sourceBucket: requireEnv('STAGING_FIXTURE_SOURCE_BUCKET'),
    sourceObject,
    proxyBucket: requireEnv('STAGING_FIXTURE_PROXY_BUCKET'),
    analysisBucket: requireEnv('STAGING_FIXTURE_ANALYSIS_BUCKET'),
    transcriptsBucket: requireEnv('STAGING_FIXTURE_TRANSCRIPTS_BUCKET'),
    previewsBucket: requireEnv('STAGING_FIXTURE_PREVIEWS_BUCKET'),
    finalExportsBucket: requireEnv('STAGING_FIXTURE_FINAL_EXPORTS_BUCKET'),
    qaBucket: requireEnv('STAGING_FIXTURE_QA_BUCKET'),
  }
}

async function ffprobe(inputPath: string): Promise<Record<string, unknown>> {
  const result = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-of',
    'json',
    inputPath,
  ], { timeout: 30_000, maxBuffer: 8 * 1024 * 1024 })
  return JSON.parse(String(result.stdout || '{}')) as Record<string, unknown>
}

async function downloadObject(storage: Storage, bucket: string, object: string, outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination: outputPath })
}

async function uploadFile(
  storage: Storage,
  bucket: string,
  object: string,
  filePath: string,
  contentType: string,
  env: FixtureEnv,
): Promise<ArtifactRecord> {
  assertFixturePrefix(object)
  const bytes = await readFile(filePath)
  await storage.bucket(bucket).upload(filePath, {
    destination: object,
    metadata: {
      contentType,
      metadata: objectMetadata(env, createHash('sha256').update(bytes).digest('hex')),
    },
  })
  return { id: object.replaceAll('/', '-'), bucket, object, kind: contentType, sizeBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

async function uploadJson(storage: Storage, bucket: string, object: string, value: unknown, env: FixtureEnv): Promise<ArtifactRecord> {
  assertFixturePrefix(object)
  const body = Buffer.from(`${JSON.stringify(value, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucket).file(object).save(body, {
    metadata: {
      contentType: 'application/json',
      metadata: objectMetadata(env, sha256),
    },
  })
  return { id: object.replaceAll('/', '-'), bucket, object, kind: 'application/json', sizeBytes: body.length, sha256 }
}

async function objectExists(storage: Storage, bucket: string, object: string): Promise<boolean> {
  const [exists] = await storage.bucket(bucket).file(object).exists()
  return exists
}

function objectMetadata(env: FixtureEnv, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '25',
    fixtureRunId: env.runId,
    sha256,
    generatedFixtureOnly: 'true',
  }
}

function readDurationSeconds(probe: Record<string, unknown>): number | undefined {
  const format = probe.format as { duration?: string } | undefined
  const duration = Number(format?.duration)
  return Number.isFinite(duration) ? duration : undefined
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function assertFixturePrefix(value: string): void {
  if (!value.startsWith('activation-fixtures/phase25/')) {
    throw new Error(`Fixture paths must stay under activation-fixtures/phase25/: ${value}`)
  }
  if (value.includes('..') || value.startsWith('/') || /https?:\/\//i.test(value)) {
    throw new Error(`Unsafe fixture path: ${value}`)
  }
}

function objectRef(bucket: string, object: string): string {
  return `gs://${bucket}/${object}`
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error)
  process.exitCode = 1
})
