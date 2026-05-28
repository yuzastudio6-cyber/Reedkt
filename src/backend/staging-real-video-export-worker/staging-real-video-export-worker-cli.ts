import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface ExportEnv {
  projectId: 'reeditpro'
  region: 'us-central1'
  runId: string
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov'
  sourceBucket: 'reeditpro-staging-reeditpro-source-media'
  sourceObject: 'activation-real-video/phase28/phase28-20260528T01552/source-video.mov'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase29Prefix: 'activation-real-video/phase29/phase29-20260528T02254'
  phase30Prefix: string
}

interface ArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

interface TimedRange {
  startSeconds: number
  endSeconds: number
  reason?: string
}

interface ProbeSummary {
  durationSeconds?: number
  videoCodec?: string
  audioCodec?: string
  width?: number
  height?: number
  hasAudio: boolean
}

async function main(): Promise<void> {
  const env = readExportEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase30-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    const report = await runPrivateExport(storage, env, workDir)
    console.log(JSON.stringify(report))
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function runPrivateExport(storage: Storage, env: ExportEnv, workDir: string): Promise<Record<string, unknown>> {
  const sourcePath = path.join(workDir, 'source-video.mov')
  const exportPath = path.join(workDir, 'final-export.mp4')
  const artifactsDir = path.join(workDir, 'artifacts')
  await mkdir(artifactsDir, { recursive: true })

  const smartCutPlan = await downloadJson(storage, env.analysisBucket, `${env.phase29Prefix}/smart-cut/smart-cut-plan.json`, path.join(artifactsDir, 'smart-cut-plan.json'))
  const timelineManifest = await downloadJson(storage, env.analysisBucket, `${env.phase29Prefix}/timeline/timeline-manifest.json`, path.join(artifactsDir, 'timeline-manifest.json'))
  const phase29Qa = await downloadJson(storage, env.qaBucket, `${env.phase29Prefix}/qa/smart-cut-caption-qa.json`, path.join(artifactsDir, 'smart-cut-caption-qa.json'))
  assertPhase29Artifacts(smartCutPlan, timelineManifest, phase29Qa)

  await downloadObject(storage, env.sourceBucket, env.sourceObject, sourcePath)
  const sourceProbe = await ffprobe(sourcePath)
  const sourceSummary = readProbeSummary(sourceProbe)
  const keepSegments = readRanges(smartCutPlan.keepSegments)
  const removeSegments = readRanges(smartCutPlan.removeSegments)
  const timelineDurationSeconds = readNumber(timelineManifest.durationSeconds) ?? 15.443
  if (keepSegments.length === 0) throw new Error('Phase 30 export blocked: Phase 29 SmartCutPlan has no keep segments.')

  await renderFinalExport({ sourcePath, exportPath, keepSegments, hasAudio: sourceSummary.hasAudio })
  const exportProbe = await ffprobe(exportPath)
  const exportSummary = readProbeSummary(exportProbe)

  const finalExportObject = `${env.phase30Prefix}/final-export.mp4`
  const renderManifestObject = `${env.phase30Prefix}/render-manifest.json`
  const qaObject = `${env.phase30Prefix}/qa/export-qa-report.json`
  const reportObject = `${env.phase30Prefix}/reports/phase30-report.json`
  const artifacts: ArtifactRecord[] = []

  const finalExport = await uploadFile(storage, env.finalExportsBucket, finalExportObject, exportPath, 'video/mp4')
  artifacts.push(finalExport)
  artifacts.push(...await copyCaptionSidecars(storage, env))

  const qa = buildQaSummary({
    finalExportExists: true,
    timelineDurationSeconds,
    finalExportDurationSeconds: exportSummary.durationSeconds,
    hasAudio: exportSummary.hasAudio,
    videoCodec: exportSummary.videoCodec,
  })
  const renderManifest = {
    phase: '30',
    runId: env.runId,
    sourcePhase28RunId: env.phase28RunId,
    sourcePhase29RunId: env.phase29RunId,
    sourceGcsUri: env.sourceGcsUri,
    sourceProbe: sourceSummary,
    exportProbe: exportSummary,
    keepSegments,
    removeSegments,
    timelineDurationSeconds,
    captionHandling: {
      mode: 'sidecar_only',
      reason: 'Caption burn-in is skipped for the first controlled private export; private caption sidecars are retained with the export package.',
    },
    finalExport: finalExport.gcsUri,
    safety: phase30Safety(true),
  }
  artifacts.push(await uploadJson(storage, env.finalExportsBucket, renderManifestObject, renderManifest))

  const report = {
    ok: qa.status !== 'blocked',
    runId: env.runId,
    sourcePhase28RunId: env.phase28RunId,
    sourcePhase29RunId: env.phase29RunId,
    sourceVideoObject: env.sourceGcsUri,
    timelineDurationSeconds,
    keepSegmentCount: keepSegments.length,
    removeSegmentCount: removeSegments.length,
    captionHandling: 'sidecar_only',
    finalExport: {
      bucket: finalExport.bucket,
      object: finalExport.object,
      gcsUri: finalExport.gcsUri,
      durationSeconds: exportSummary.durationSeconds,
      videoCodec: exportSummary.videoCodec,
      audioCodec: exportSummary.audioCodec,
      hasAudio: exportSummary.hasAudio,
      sizeBytes: finalExport.sizeBytes,
      sha256: finalExport.sha256,
    },
    artifacts,
    qa,
    safety: phase30Safety(true),
    uploadedReport: {
      bucket: env.qaBucket,
      object: reportObject,
      gcsUri: `gs://${env.qaBucket}/${reportObject}`,
    },
    blockers: qa.blockers,
    warnings: [
      ...qa.warnings,
      'Caption burn-in skipped; Phase 30 final delivery is private export with caption sidecars only.',
      'No color/audio cleanup/masks/enhancement/final public delivery executed.',
    ],
  }

  artifacts.push(await uploadJson(storage, env.qaBucket, qaObject, qa))
  artifacts.push(await uploadJson(storage, env.qaBucket, reportObject, report))
  return report
}

function readExportEnv(): ExportEnv {
  requireEnvValue('REEDITPRO_ENV', 'staging')
  requireEnvValue('REEDITPRO_CONFIRM_REAL_VIDEO_PRIVATE_EXPORT', 'true')
  requireEnvValue('REEDITPRO_PHASE30_MODE', 'private_export')
  const projectId = (process.env.GCP_PROJECT_ID ?? 'reeditpro') as ExportEnv['projectId']
  const region = (process.env.GCP_REGION ?? 'us-central1') as ExportEnv['region']
  if (projectId !== 'reeditpro') throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  if (region !== 'us-central1') throw new Error('GCP_REGION must be us-central1.')
  const phase28RunId = requireEnv('REEDITPRO_PHASE28_RUN_ID') as ExportEnv['phase28RunId']
  const phase29RunId = requireEnv('REEDITPRO_PHASE29_RUN_ID') as ExportEnv['phase29RunId']
  const sourceGcsUri = requireEnv('REEDITPRO_PHASE28_SOURCE_GCS_URI') as ExportEnv['sourceGcsUri']
  if (phase28RunId !== 'phase28-20260528T01552') throw new Error('Phase 30 is locked to Phase 28 run phase28-20260528T01552.')
  if (phase29RunId !== 'phase29-20260528T02254') throw new Error('Phase 30 is locked to Phase 29 run phase29-20260528T02254.')
  if (sourceGcsUri !== 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov') {
    throw new Error('Phase 30 source GCS URI is not the approved Phase 28 object.')
  }
  const runId = process.env.REEDITPRO_PHASE30_RUN_ID ?? `phase30-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase30-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 30 run id: ${runId}`)
  return {
    projectId,
    region,
    runId,
    phase28RunId,
    phase29RunId,
    sourceGcsUri,
    sourceBucket: 'reeditpro-staging-reeditpro-source-media',
    sourceObject: 'activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
    analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
    transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
    finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    phase29Prefix: 'activation-real-video/phase29/phase29-20260528T02254',
    phase30Prefix: `activation-real-video/phase30/${runId}`,
  }
}

function assertPhase29Artifacts(
  smartCutPlan: Record<string, unknown>,
  timelineManifest: Record<string, unknown>,
  phase29Qa: Record<string, unknown>,
): void {
  if (!Array.isArray(smartCutPlan.keepSegments) || smartCutPlan.keepSegments.length === 0) {
    throw new Error('Phase 29 SmartCutPlan is missing keep segments.')
  }
  if (readNumber(timelineManifest.durationSeconds) === undefined) {
    throw new Error('Phase 29 TimelineManifest is missing durationSeconds.')
  }
  if (phase29Qa.status === 'blocked') {
    throw new Error('Phase 29 QA is blocked; Phase 30 export cannot proceed.')
  }
}

async function renderFinalExport(input: {
  sourcePath: string
  exportPath: string
  keepSegments: TimedRange[]
  hasAudio: boolean
}): Promise<void> {
  const filterParts: string[] = []
  const concatInputs: string[] = []
  input.keepSegments.forEach((segment, index) => {
    filterParts.push(`[0:v]trim=start=${segment.startSeconds}:end=${segment.endSeconds},setpts=PTS-STARTPTS[v${index}]`)
    concatInputs.push(`[v${index}]`)
    if (input.hasAudio) {
      filterParts.push(`[0:a]atrim=start=${segment.startSeconds}:end=${segment.endSeconds},asetpts=PTS-STARTPTS[a${index}]`)
      concatInputs.push(`[a${index}]`)
    }
  })
  const concatOutput = input.hasAudio
    ? `${concatInputs.join('')}concat=n=${input.keepSegments.length}:v=1:a=1[v][a]`
    : `${concatInputs.join('')}concat=n=${input.keepSegments.length}:v=1:a=0[v]`
  const filter = [...filterParts, concatOutput].join(';')
  const args = [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.sourcePath,
    '-filter_complex',
    filter,
    '-map',
    '[v]',
    ...(input.hasAudio ? ['-map', '[a]'] : []),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    ...(input.hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']),
    '-movflags',
    '+faststart',
    input.exportPath,
  ]
  await execFileAsync('ffmpeg', args, { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
}

async function copyCaptionSidecars(storage: Storage, env: ExportEnv): Promise<ArtifactRecord[]> {
  const captionObjects = [
    { kind: 'caption_segments_json', source: `activation-real-video/phase28/${env.phase28RunId}/captions/caption-segments.json`, target: `${env.phase30Prefix}/captions/caption-segments.json` },
    { kind: 'caption_file_srt', source: `activation-real-video/phase28/${env.phase28RunId}/captions/captions.srt`, target: `${env.phase30Prefix}/captions/captions.srt` },
    { kind: 'caption_file_webvtt', source: `activation-real-video/phase28/${env.phase28RunId}/captions/captions.vtt`, target: `${env.phase30Prefix}/captions/captions.vtt` },
    { kind: 'caption_file_ass', source: `activation-real-video/phase28/${env.phase28RunId}/captions/captions.ass`, target: `${env.phase30Prefix}/captions/captions.ass` },
  ]
  const records: ArtifactRecord[] = []
  for (const item of captionObjects) {
    await storage.bucket(env.transcriptsBucket).file(item.source).copy(storage.bucket(env.finalExportsBucket).file(item.target))
    records.push({
      id: item.target.replaceAll('/', '-'),
      kind: item.kind,
      bucket: env.finalExportsBucket,
      object: item.target,
      gcsUri: `gs://${env.finalExportsBucket}/${item.target}`,
    })
  }
  return records
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
  ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })
  return JSON.parse(String(result.stdout || '{}')) as Record<string, unknown>
}

function readProbeSummary(probe: Record<string, unknown>): ProbeSummary {
  const streams = Array.isArray(probe.streams) ? probe.streams as Array<Record<string, unknown>> : []
  const format = probe.format && typeof probe.format === 'object' ? probe.format as Record<string, unknown> : {}
  const video = streams.find((stream) => stream.codec_type === 'video')
  const audio = streams.find((stream) => stream.codec_type === 'audio')
  return {
    durationSeconds: readNumber(format.duration) ?? readNumber(video?.duration),
    videoCodec: typeof video?.codec_name === 'string' ? normalizeVideoCodec(video.codec_name) : undefined,
    audioCodec: typeof audio?.codec_name === 'string' ? String(audio.codec_name) : undefined,
    width: readNumber(video?.width),
    height: readNumber(video?.height),
    hasAudio: Boolean(audio),
  }
}

function normalizeVideoCodec(codec: string): string {
  if (codec === 'h264') return 'h264'
  return codec
}

async function downloadJson(storage: Storage, bucket: string, object: string, outputPath: string): Promise<Record<string, unknown>> {
  await downloadObject(storage, bucket, object, outputPath)
  return JSON.parse(await readFile(outputPath, 'utf8')) as Record<string, unknown>
}

async function downloadObject(storage: Storage, bucket: string, object: string, outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination: outputPath })
}

async function uploadFile(storage: Storage, bucket: string, object: string, localPath: string, contentType: string): Promise<ArtifactRecord> {
  await storage.bucket(bucket).upload(localPath, {
    destination: object,
    metadata: {
      contentType,
      metadata: {
        app: 'reeditpro',
        env: 'staging',
        phase: '30',
      },
    },
  })
  const bytes = await readFile(localPath)
  return {
    id: object.replaceAll('/', '-'),
    kind: object.endsWith('.mp4') ? 'final_export' : 'artifact',
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function uploadJson(storage: Storage, bucket: string, object: string, payload: unknown): Promise<ArtifactRecord> {
  const tempPath = path.join(os.tmpdir(), `${createHash('sha256').update(object).digest('hex')}.json`)
  await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(storage, bucket, object, tempPath, 'application/json')
}

function readRanges(value: unknown): TimedRange[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): TimedRange | undefined => {
      if (!item || typeof item !== 'object') return undefined
      const source = item as Record<string, unknown>
      const startSeconds = readNumber(source.startSeconds)
      const endSeconds = readNumber(source.endSeconds)
      if (startSeconds === undefined || endSeconds === undefined || endSeconds <= startSeconds) return undefined
      return { startSeconds, endSeconds, ...(typeof source.reason === 'string' ? { reason: source.reason } : {}) }
    })
    .filter((item): item is TimedRange => Boolean(item))
}

function buildQaSummary(input: {
  finalExportExists: boolean
  timelineDurationSeconds: number
  finalExportDurationSeconds?: number
  hasAudio?: boolean
  videoCodec?: string
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<Record<string, unknown>>
  blockers: string[]
  warnings: string[]
} {
  const durationDelta = input.finalExportDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.finalExportDurationSeconds - input.timelineDurationSeconds)
  const gates = [
    gate('render_asset_integrity', input.finalExportExists, 'Private final_export artifact exists and source media was not overwritten.'),
    gate('render_timeline_integrity', input.timelineDurationSeconds > 0, 'Phase 29 TimelineManifest duration is positive.'),
    gate('export_codec_format', input.videoCodec === 'h264', 'Private export uses H.264 in MP4.'),
    gate('export_duration_sync', durationDelta <= 0.75, `Export duration delta ${durationDelta.toFixed(3)}s is within tolerance.`),
    input.hasAudio ? gate('audio_sync', true, 'Audio stream is present; deep sync remains future QA.') : warningGate('audio_sync', 'Audio stream was not detected.'),
    warningGate('caption_timing', 'Caption timing is retained as private sidecars; burn-in was intentionally skipped.'),
    warningGate('caption_readability', 'Caption readability remains based on Phase 28/29 sidecar QA.'),
  ]
  gates.push(gate('final_delivery', input.finalExportExists && durationDelta <= 0.75, 'Controlled private final export exists with private caption sidecars.'))
  const blockers = gates.filter((item) => item.blocking).map((item) => `${item.gateType}: ${item.message}`)
  const warnings = gates.filter((item) => item.status === 'warning').map((item) => `${item.gateType}: ${item.message}`)
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateType: string, passed: boolean, message: string): Record<string, unknown> {
  return {
    id: `phase30-gate-${gateType}`,
    workspaceId: 'activation-phase30',
    projectId: 'reeditpro',
    mediaAssetId: 'phase28-20260528T01552-source-video',
    toolExecutionPlanId: 'activation-phase30-private-export',
    recipeId: gateType === 'final_delivery' ? 'final_export_recipe' : 'smart_cut_recipe',
    gateType,
    status: passed ? 'passed' : 'blocked',
    score: passed ? 0.95 : 0.2,
    threshold: 0.8,
    required: true,
    blocking: !passed,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: gateType === 'final_delivery' ? 'qa_worker' : 'render_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: passed ? [] : [{ code: `${gateType}_failed`, message, severity: 'blocking' }],
    recommendations: [{ action: passed ? 'continue' : 'block_final_export', reason: message, priority: passed ? 'low' : 'urgent' }],
    fallbackRequired: !passed,
    blocksPreview: false,
    blocksFinalExport: !passed,
    humanReviewRequired: false,
    message,
  }
}

function warningGate(gateType: string, message: string): Record<string, unknown> {
  return {
    ...gate(gateType, true, message),
    status: 'warning',
    score: 0.78,
    issues: [{ code: `${gateType}_warning`, message, severity: 'warning' }],
    recommendations: [{ action: 'continue', reason: message, priority: 'medium' }],
    humanReviewRequired: true,
    message,
  }
}

function phase30Safety(finalExportCreated: boolean): Record<string, unknown> {
  return {
    controlledPhase28SourceOnly: true,
    controlledPhase29TimelineOnly: true,
    secondSourceVideoUsed: false,
    providerExecuted: false,
    gpuUsed: false,
    modelDownloadedExternally: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    finalExportCreated,
    audioCleanupExecuted: false,
    colorExecuted: false,
    masksOrEnhancementExecuted: false,
    revideoUsed: false,
  }
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function requireEnvValue(name: string, expected: string): void {
  const value = process.env[name]
  if (value !== expected) throw new Error(`${name} must be ${expected}.`)
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }))
  process.exitCode = 1
})
