import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type RuntimeMode = 'phase27a_fixture' | 'phase28_real_video'

interface SharedRuntimeEnv {
  projectId: string
  jobName: string
  modelManifestId: string
  modelGcsPath: string
  modelRuntimePath: string
  expectedSha256: string
  phase27ReportBucket: string
}

interface Phase28RuntimeEnv extends SharedRuntimeEnv {
  runId: string
  sourceGcsUri: string
  sourceBucket: string
  sourceObject: string
  sanitizedFilename: string
  artifactPrefix: string
  analysisBucket: string
  transcriptsBucket: string
  qaBucket: string
}

interface WordOutput {
  word: string
  start: number
  end: number
  probability?: number
}

interface SegmentOutput {
  id?: string
  start: number
  end: number
  text: string
  words?: WordOutput[]
}

interface TranscriptionOutput {
  status: 'completed' | 'failed'
  language?: string
  segments: SegmentOutput[]
  fullText: string
  warnings: string[]
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

interface CaptionSegment {
  id: string
  startSeconds: number
  endSeconds: number
  text: string
  lines: string[]
}

async function main(): Promise<void> {
  const mode = readRuntimeMode()
  if (mode === 'phase28_real_video') await runPhase28RealVideo()
  else await runPhase27Fixture()
}

async function runPhase27Fixture(): Promise<void> {
  const env = readSharedRuntimeEnv()
  requireEnvValue('REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME', 'true')
  requireEnvValue('REEDITPRO_STAGING_SPEECH_RUNTIME', 'true')

  const runId = `phase27a-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-speech-runtime-${runId}`)
  const fixturePath = path.join(workDir, 'generated-audio.wav')
  const outputPath = path.join(workDir, 'faster-whisper-output.json')

  await resetWorkDirs(workDir, env.modelRuntimePath)
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
        bucket: env.phase27ReportBucket,
        object: reportObject,
      },
      warnings: transcription.warnings,
    }
    await uploadJson(storage, env.phase27ReportBucket, reportObject, report, { phase: '27a' })
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, env.modelRuntimePath)
  }
}

async function runPhase28RealVideo(): Promise<void> {
  const env = readPhase28RuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase28-${env.runId}`)
  const sourcePath = path.join(workDir, `source${path.extname(env.sanitizedFilename).toLowerCase() || '.mov'}`)
  const audioPath = path.join(workDir, 'source-audio.wav')
  const transcriptionPath = path.join(workDir, 'transcript.json')
  const wordsPath = path.join(workDir, 'word-timestamps.json')
  const captionsPath = path.join(workDir, 'caption-segments.json')
  const srtPath = path.join(workDir, 'captions.srt')
  const webvttPath = path.join(workDir, 'captions.vtt')
  const assPath = path.join(workDir, 'captions.ass')
  const whisperOutputPath = path.join(workDir, 'faster-whisper-output.json')

  await resetWorkDirs(workDir, env.modelRuntimePath)
  try {
    const artifacts: ArtifactRecord[] = [{
      id: 'source-video',
      kind: 'source_video',
      bucket: env.sourceBucket,
      object: env.sourceObject,
      gcsUri: env.sourceGcsUri,
    }]
    await downloadObject(storage, env.sourceBucket, env.sourceObject, sourcePath)
    const probe = await ffprobe(sourcePath)
    const media = readMediaSummary(probe)
    const mediaProbeArtifact = await uploadJson(storage, env.analysisBucket, `${env.artifactPrefix}/analysis/media-probe.json`, {
      phase: '28',
      runId: env.runId,
      sourceGcsUri: env.sourceGcsUri,
      probe,
      providerExecuted: false,
      gpuUsed: false,
      finalExportCreated: false,
    }, { phase: '28', runId: env.runId })
    artifacts.push(mediaProbeArtifact)
    if (!media.hasAudio) throw new Error('Phase 28 source video has no audio stream.')

    await extractAudio(sourcePath, audioPath)
    artifacts.push(await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/audio/source-audio.wav`, audioPath, 'audio/wav', env.runId))

    await syncApprovedModel(storage, env)
    const aggregateSha256 = await verifyChecksums(env.modelRuntimePath, env.expectedSha256)
    const transcription = await runFasterWhisper(env.modelRuntimePath, audioPath, whisperOutputPath)
    const words = transcription.segments.flatMap((segment) => segment.words ?? [])
    const captionSegments = buildCaptionSegments(transcription.segments)
    await writeFile(transcriptionPath, `${JSON.stringify({
      phase: '28',
      runId: env.runId,
      sourceGcsUri: env.sourceGcsUri,
      model: env.modelManifestId,
      language: transcription.language,
      fullText: transcription.fullText,
      segments: transcription.segments,
    }, null, 2)}\n`, 'utf8')
    await writeFile(wordsPath, `${JSON.stringify({ phase: '28', runId: env.runId, words }, null, 2)}\n`, 'utf8')
    await writeFile(captionsPath, `${JSON.stringify({ phase: '28', runId: env.runId, segments: captionSegments }, null, 2)}\n`, 'utf8')
    await writeFile(srtPath, renderSrt(captionSegments), 'utf8')
    await writeFile(webvttPath, renderWebVtt(captionSegments), 'utf8')
    await writeFile(assPath, renderAss(captionSegments), 'utf8')

    artifacts.push(await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/transcripts/transcript.json`, transcriptionPath, 'application/json', env.runId))
    artifacts.push(await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/transcripts/word-timestamps.json`, wordsPath, 'application/json', env.runId))
    artifacts.push(await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/captions/caption-segments.json`, captionsPath, 'application/json', env.runId))
    const srtArtifact = await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/captions/captions.srt`, srtPath, 'application/x-subrip', env.runId)
    const vttArtifact = await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/captions/captions.vtt`, webvttPath, 'text/vtt', env.runId)
    const assArtifact = await uploadFile(storage, env.transcriptsBucket, `${env.artifactPrefix}/captions/captions.ass`, assPath, 'text/plain', env.runId)
    artifacts.push(srtArtifact, vttArtifact, assArtifact)

    const qa = buildCaptionQa(transcription, captionSegments)
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/caption-qa.json`, {
      phase: '28',
      runId: env.runId,
      ...qa,
      finalDeliveryAllowed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      realUserMediaTestingAllowed: false,
    }, { phase: '28', runId: env.runId })
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase28-report.json`
    const report = {
      ok: transcription.status === 'completed' && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      source: {
        sourceGcsUri: env.sourceGcsUri,
        sanitizedFilename: env.sanitizedFilename,
        durationSeconds: media.durationSeconds,
        width: media.width,
        height: media.height,
        hasAudio: media.hasAudio,
      },
      model: {
        manifestId: env.modelManifestId,
        name: 'Systran/faster-whisper-tiny',
        revision: 'd90ca5fe260221311c53c58e660288d3deb8d356',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        aggregateSha256,
      },
      speechRuntime: {
        status: transcription.status,
        language: transcription.language,
        transcriptSegmentCount: transcription.segments.length,
        wordTimestampCount: words.length,
        fullTranscriptPreview: transcription.fullText.slice(0, 240),
      },
      captions: {
        captionSegmentCount: captionSegments.length,
        srtUri: srtArtifact.gcsUri,
        webvttUri: vttArtifact.gcsUri,
        assUri: assArtifact.gcsUri,
      },
      qa,
      artifacts,
      safety: {
        controlledPhase28SourceOnly: true,
        arbitraryRealMediaUsed: false,
        providerExecuted: false,
        gpuUsed: false,
        modelDownloadedExternally: false,
        secretValuesUsed: false,
        publicAccessEnabled: false,
        finalExportCreated: false,
        smartCutExecuted: false,
        audioCleanupExecuted: false,
        colorExecuted: false,
        masksOrEnhancementExecuted: false,
      },
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: qa.warnings,
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, { phase: '28', runId: env.runId })
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, env.modelRuntimePath)
  }
}

function readRuntimeMode(): RuntimeMode {
  const mode = process.env.REEDITPRO_SPEECH_RUNTIME_MODE
  if (!mode) return 'phase27a_fixture'
  if (mode === 'phase27a_fixture' || mode === 'phase28_real_video') return mode
  throw new Error(`Unsupported speech runtime mode: ${mode}`)
}

function readSharedRuntimeEnv(): SharedRuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
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
    phase27ReportBucket: 'reeditpro-staging-reeditpro-worker-temp',
  }
}

function readPhase28RuntimeEnv(): Phase28RuntimeEnv {
  const shared = readSharedRuntimeEnv()
  requireEnvValue('REEDITPRO_CONFIRM_FIRST_REAL_VIDEO_SPEECH_CAPTION', 'true')
  const runId = requireEnv('REEDITPRO_PHASE28_RUN_ID')
  if (!/^phase28-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 28 run id: ${runId}`)
  const sourceGcsUri = requireEnv('REEDITPRO_PHASE28_SOURCE_GCS_URI')
  const source = parseGcsUri(sourceGcsUri)
  const artifactPrefix = process.env.REEDITPRO_PHASE28_ARTIFACT_PREFIX ?? `activation-real-video/phase28/${runId}`
  assertPhase28Object(artifactPrefix, runId)
  if (source.bucket !== 'reeditpro-staging-reeditpro-source-media') throw new Error('Phase 28 source must use the staging source-media bucket.')
  assertPhase28Object(source.object, runId)
  return {
    ...shared,
    runId,
    sourceGcsUri,
    sourceBucket: source.bucket,
    sourceObject: source.object,
    sanitizedFilename: process.env.REEDITPRO_PHASE28_SOURCE_FILENAME ?? 'source-video.mov',
    artifactPrefix,
    analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
    transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  }
}

async function resetWorkDirs(workDir: string, modelRuntimePath: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })
  await rm(modelRuntimePath, { recursive: true, force: true })
  await mkdir(modelRuntimePath, { recursive: true })
}

async function cleanupWorkDirs(workDir: string, modelRuntimePath: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await rm(modelRuntimePath, { recursive: true, force: true })
}

async function syncApprovedModel(storage: Storage, env: SharedRuntimeEnv): Promise<string[]> {
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

async function ffprobe(inputPath: string): Promise<Record<string, unknown>> {
  const result = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-of',
    'json',
    inputPath,
  ], { timeout: 60_000, maxBuffer: 16 * 1024 * 1024 })
  return JSON.parse(String(result.stdout || '{}')) as Record<string, unknown>
}

async function extractAudio(sourcePath: string, audioPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    sourcePath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-c:a',
    'pcm_s16le',
    audioPath,
  ], { timeout: 20 * 60_000, maxBuffer: 16 * 1024 * 1024 })
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

async function runFasterWhisper(modelPath: string, audioPath: string, outputPath: string): Promise<TranscriptionOutput> {
  const scriptPath = '/app/speech-runtime/faster_whisper_local.py'
  await execFileAsync('python3', [
    scriptPath,
    '--model-path',
    modelPath,
    '--audio-path',
    audioPath,
    '--output-json',
    outputPath,
    '--device',
    'cpu',
    '--compute-type',
    'int8',
    '--word-timestamps',
  ], {
    timeout: 30 * 60_000,
    maxBuffer: 32 * 1024 * 1024,
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
  if (bucketName === 'reeditpro-staging-reeditpro-generated-assets' && !objectName.startsWith('model-weights/faster-whisper/tiny/')) {
    throw new Error(`Blocked model object: ${objectName}`)
  }
  if (bucketName === 'reeditpro-staging-reeditpro-source-media' && !objectName.startsWith('activation-real-video/phase28/')) {
    throw new Error(`Blocked source object: ${objectName}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
}

async function uploadFile(
  storage: Storage,
  bucketName: string,
  objectName: string,
  filePath: string,
  contentType: string,
  runId: string,
): Promise<ArtifactRecord> {
  assertPhase28Object(objectName, runId)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: {
      contentType,
      metadata: objectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadJson(
  storage: Storage,
  bucketName: string,
  objectName: string,
  payload: unknown,
  metadata: { phase: '27a' | '28'; runId?: string },
): Promise<ArtifactRecord> {
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      metadata: metadata.phase === '28' && metadata.runId ? objectMetadata(metadata.runId, sha256) : { phase: metadata.phase, sha256 },
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

function objectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '28',
    runId,
    sha256,
    controlledPhase28SourceOnly: 'true',
    providerExecuted: 'false',
    modelDownloadedExternally: 'false',
    gpuUsed: 'false',
  }
}

function readMediaSummary(probe: Record<string, unknown>): { durationSeconds?: number; width?: number; height?: number; hasAudio: boolean } {
  const streams = Array.isArray(probe.streams) ? probe.streams as Array<Record<string, unknown>> : []
  const video = streams.find((stream) => stream.codec_type === 'video')
  const audio = streams.find((stream) => stream.codec_type === 'audio')
  const format = probe.format as { duration?: string } | undefined
  const duration = Number(format?.duration)
  const width = Number(video?.width)
  const height = Number(video?.height)
  return {
    durationSeconds: Number.isFinite(duration) ? duration : undefined,
    width: Number.isFinite(width) ? width : undefined,
    height: Number.isFinite(height) ? height : undefined,
    hasAudio: Boolean(audio),
  }
}

function buildCaptionSegments(segments: SegmentOutput[]): CaptionSegment[] {
  return segments
    .map((segment, index) => {
      const text = normalizeCaptionText(segment.text)
      return {
        id: `caption-${index + 1}`,
        startSeconds: roundTime(segment.start),
        endSeconds: roundTime(Math.max(segment.end, segment.start + 0.5)),
        text,
        lines: wrapCaptionText(text),
      }
    })
    .filter((segment) => segment.text.length > 0)
}

function buildCaptionQa(transcription: TranscriptionOutput, captions: CaptionSegment[]): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<{ gateId: string; status: 'passed' | 'warning' | 'blocked'; summary: string }>
  blockers: string[]
  warnings: string[]
} {
  const blockers: string[] = []
  const warnings: string[] = []
  const gates = [
    {
      gateId: 'transcript_alignment',
      status: transcription.status === 'completed' ? 'passed' as const : 'blocked' as const,
      summary: transcription.status === 'completed' ? 'faster-whisper completed with local approved model.' : 'Transcription did not complete.',
    },
    {
      gateId: 'caption_timing',
      status: captions.every((caption) => caption.endSeconds > caption.startSeconds) ? 'passed' as const : 'blocked' as const,
      summary: captions.length > 0 ? 'Caption segments have positive durations.' : 'No caption segments were produced.',
    },
    {
      gateId: 'caption_readability',
      status: captions.every((caption) => caption.lines.length <= 2 && caption.lines.every((line) => line.length <= 42)) ? 'passed' as const : 'warning' as const,
      summary: 'Caption lines are constrained to two lines where possible.',
    },
    {
      gateId: 'caption_safe_zone',
      status: 'warning' as const,
      summary: 'Face/OCR safe-zone analysis was not run in Phase 28; caption files are generated but not burned into video.',
    },
  ]
  if (transcription.status !== 'completed') blockers.push('Transcription did not complete.')
  if (captions.some((caption) => caption.endSeconds <= caption.startSeconds)) blockers.push('One or more caption segments has invalid timing.')
  if (captions.length === 0) warnings.push('No caption text was produced; this may indicate no speech or unclear speech in the source audio.')
  warnings.push('Caption safe-zone QA is warning-only because Phase 28 does not run face/OCR analysis or final render.')
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function renderSrt(captions: CaptionSegment[]): string {
  return captions.map((caption, index) => [
    String(index + 1),
    `${formatSrtTime(caption.startSeconds)} --> ${formatSrtTime(caption.endSeconds)}`,
    caption.lines.join('\n'),
    '',
  ].join('\n')).join('\n')
}

function renderWebVtt(captions: CaptionSegment[]): string {
  return `WEBVTT\n\n${captions.map((caption) => [
    `${formatVttTime(caption.startSeconds)} --> ${formatVttTime(caption.endSeconds)}`,
    caption.lines.join('\n'),
    '',
  ].join('\n')).join('\n')}`
}

function renderAss(captions: CaptionSegment[]): string {
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    'PlayResY: 1080',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,54,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,1,2,100,100,90,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const events = captions.map((caption) => `Dialogue: 0,${formatAssTime(caption.startSeconds)},${formatAssTime(caption.endSeconds)},Default,,0,0,0,,${caption.lines.map((line) => line.replace(/[{}]/g, '')).join('\\N')}`)
  return `${[...header, ...events].join('\n')}\n`
}

function wrapCaptionText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= 42) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word.slice(0, 42)
    }
    if (lines.length === 1 && current.length > 34) {
      lines.push(current)
      current = ''
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function normalizeCaptionText(text: string): string {
  return text.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
}

function formatSrtTime(seconds: number): string {
  return formatTime(seconds, ',')
}

function formatVttTime(seconds: number): string {
  return formatTime(seconds, '.')
}

function formatAssTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const wholeSeconds = Math.floor(seconds % 60)
  const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100)
  return `${hours}:${pad2(minutes)}:${pad2(wholeSeconds)}.${pad2(centiseconds)}`
}

function formatTime(seconds: number, millisSeparator: ',' | '.'): string {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const wholeSeconds = Math.floor(safeSeconds % 60)
  const millis = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 1000)
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(wholeSeconds)}${millisSeparator}${String(millis).padStart(3, '0')}`
}

function roundTime(value: number): number {
  return Math.max(0, Math.round(value * 1000) / 1000)
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function parseGcsPrefix(gcsPath: string): { bucket: string; prefix: string } {
  const match = /^gs:\/\/([^/]+)\/(.+\/)$/.exec(gcsPath)
  if (!match) throw new Error('Invalid GCS model path.')
  return { bucket: match[1], prefix: match[2] }
}

function parseGcsUri(gcsUri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gcsUri)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], object: match[2] }
}

function assertSafeRelativePath(relativePath: string): void {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..') || /https?:\/\//i.test(relativePath)) {
    throw new Error(`Unsafe model file path: ${relativePath}`)
  }
}

function assertPhase28Object(objectName: string, runId: string): void {
  const prefix = `activation-real-video/phase28/${runId}`
  if (!objectName.startsWith(prefix)) throw new Error(`Object must stay under ${prefix}: ${objectName}`)
  if (objectName.includes('..') || objectName.startsWith('/') || /https?:\/\//i.test(objectName)) {
    throw new Error(`Unsafe Phase 28 object path: ${objectName}`)
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function requireEnvValue(name: string, expected: string): void {
  if (process.env[name] !== expected) throw new Error(`${name}=${expected} is required.`)
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    providerExecuted: false,
    modelDownloadedExternally: false,
    arbitraryRealMediaUsed: false,
    gpuUsed: false,
    secretValuesUsed: false,
  }))
  process.exitCode = 1
})
