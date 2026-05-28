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

interface AudioCleanupEnv {
  projectId: 'reeditpro'
  region: 'us-central1'
  runId: string
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  phase30RunId: 'phase30-20260528T12421'
  inputGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4'
  inputBucket: 'reeditpro-staging-reeditpro-final-exports'
  inputObject: 'activation-real-video/phase30/phase30-20260528T12421/final-export.mp4'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase31Prefix: string
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
  if (process.env.REEDITPRO_PHASE31_MODE === 'audio_cleanup_loudness') {
    await mainAudioCleanup()
    return
  }
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

async function mainAudioCleanup(): Promise<void> {
  const env = readAudioCleanupEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase31-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    const report = await runAudioCleanup(storage, env, workDir)
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

async function runAudioCleanup(storage: Storage, env: AudioCleanupEnv, workDir: string): Promise<Record<string, unknown>> {
  const inputPath = path.join(workDir, 'phase30-final-export.mp4')
  const normalizedAudioPath = path.join(workDir, 'normalized-audio.m4a')
  const normalizedExportPath = path.join(workDir, 'audio-normalized-export.mp4')
  const artifactsDir = path.join(workDir, 'artifacts')
  await mkdir(artifactsDir, { recursive: true })

  await downloadObject(storage, env.inputBucket, env.inputObject, inputPath)
  const inputProbe = await ffprobe(inputPath)
  const inputSummary = readProbeSummary(inputProbe)
  if (!inputSummary.hasAudio) throw new Error('Phase 31 audio cleanup blocked: Phase 30B final export has no audio stream.')

  const loudnessBefore = await measureLoudness(inputPath)
  await normalizeAudio({ inputPath, outputPath: normalizedAudioPath, loudnessBefore })
  const loudnessAfter = await measureLoudness(normalizedAudioPath)
  const muxWarning = await muxNormalizedExport({
    inputPath,
    normalizedAudioPath,
    outputPath: normalizedExportPath,
  })
  const outputProbe = await ffprobe(normalizedExportPath)
  const outputSummary = readProbeSummary(outputProbe)

  const normalizedAudioObject = `${env.phase31Prefix}/audio/normalized-audio.m4a`
  const loudnessObject = `${env.phase31Prefix}/audio/loudness-report.json`
  const normalizedExportObject = `${env.phase31Prefix}/audio-normalized-export.mp4`
  const qaObject = `${env.phase31Prefix}/qa/audio-cleanup-qa.json`
  const reportObject = `${env.phase31Prefix}/reports/phase31-report.json`
  const artifacts: ArtifactRecord[] = []

  const normalizedAudio = await uploadFile(storage, env.generatedAssetsBucket, normalizedAudioObject, normalizedAudioPath, 'audio/mp4', '31')
  const normalizedExport = await uploadFile(storage, env.finalExportsBucket, normalizedExportObject, normalizedExportPath, 'video/mp4', '31')
  artifacts.push(normalizedAudio)
  artifacts.push(normalizedExport)

  const loudnessReport = {
    phase: '31',
    runId: env.runId,
    sourcePhase30RunId: env.phase30RunId,
    inputFinalExportObject: env.inputGcsUri,
    targets: {
      integratedLufs: -16,
      truePeakDbtp: -1.5,
      loudnessRange: 11,
    },
    before: loudnessBefore,
    after: loudnessAfter,
    muxWarning,
    safety: phase31Safety(),
  }
  artifacts.push(await uploadJson(storage, env.generatedAssetsBucket, loudnessObject, loudnessReport, '31'))

  const qa = buildAudioCleanupQaSummary({
    normalizedExportExists: true,
    inputDurationSeconds: inputSummary.durationSeconds,
    outputDurationSeconds: outputSummary.durationSeconds,
    outputHasAudio: outputSummary.hasAudio,
    outputVideoCodec: outputSummary.videoCodec,
    outputAudioCodec: outputSummary.audioCodec,
    loudnessAfter: loudnessAfter.integratedLufs,
    truePeakAfter: loudnessAfter.truePeakDbtp,
  })

  const report = {
    ok: qa.status !== 'blocked',
    runId: env.runId,
    sourcePhase28RunId: env.phase28RunId,
    sourcePhase29RunId: env.phase29RunId,
    sourcePhase30RunId: env.phase30RunId,
    inputFinalExportObject: env.inputGcsUri,
    inputProbe: inputSummary,
    outputProbe: outputSummary,
    loudnessBefore,
    loudnessAfter,
    normalizedAudio,
    normalizedExport,
    artifacts,
    qa,
    safety: phase31Safety(),
    uploadedReport: {
      bucket: env.qaBucket,
      object: reportObject,
      gcsUri: `gs://${env.qaBucket}/${reportObject}`,
    },
    blockers: qa.blockers,
    warnings: [
      ...qa.warnings,
      ...(muxWarning ? [muxWarning] : []),
      'Phase 31 used FFmpeg loudness normalization only; no DeepFilterNet, RNNoise, Demucs, providers, GPU, model downloads, color, masks, enhancement, or Revideo executed.',
      'Production, external beta, and broad real user media testing remain blocked.',
    ],
  }

  artifacts.push(await uploadJson(storage, env.qaBucket, qaObject, qa, '31'))
  artifacts.push(await uploadJson(storage, env.qaBucket, reportObject, report, '31'))
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

function readAudioCleanupEnv(): AudioCleanupEnv {
  requireEnvValue('REEDITPRO_ENV', 'staging')
  requireEnvValue('REEDITPRO_CONFIRM_REAL_VIDEO_AUDIO_CLEANUP', 'true')
  requireEnvValue('REEDITPRO_PHASE31_MODE', 'audio_cleanup_loudness')
  const projectId = (process.env.GCP_PROJECT_ID ?? 'reeditpro') as AudioCleanupEnv['projectId']
  const region = (process.env.GCP_REGION ?? 'us-central1') as AudioCleanupEnv['region']
  if (projectId !== 'reeditpro') throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  if (region !== 'us-central1') throw new Error('GCP_REGION must be us-central1.')
  const phase30RunId = requireEnv('REEDITPRO_PHASE30_RUN_ID') as AudioCleanupEnv['phase30RunId']
  const inputGcsUri = requireEnv('REEDITPRO_PHASE31_INPUT_GCS_URI') as AudioCleanupEnv['inputGcsUri']
  if (phase30RunId !== 'phase30-20260528T12421') throw new Error('Phase 31 is locked to Phase 30 run phase30-20260528T12421.')
  if (inputGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4') {
    throw new Error('Phase 31 input GCS URI is not the approved Phase 30B private final export.')
  }
  const runId = process.env.REEDITPRO_PHASE31_RUN_ID ?? `phase31-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase31-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 31 run id: ${runId}`)
  return {
    projectId,
    region,
    runId,
    phase28RunId: 'phase28-20260528T01552',
    phase29RunId: 'phase29-20260528T02254',
    phase30RunId,
    inputGcsUri,
    inputBucket: 'reeditpro-staging-reeditpro-final-exports',
    inputObject: 'activation-real-video/phase30/phase30-20260528T12421/final-export.mp4',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    phase31Prefix: `activation-real-video/phase31/${runId}`,
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

async function measureLoudness(inputPath: string): Promise<{
  integratedLufs?: number
  truePeakDbtp?: number
  loudnessRange?: number
  threshold?: number
  targetOffset?: number
  raw: Record<string, unknown>
}> {
  const result = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-i',
    inputPath,
    '-af',
    'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
    '-f',
    'null',
    '-',
  ], { timeout: 5 * 60_000, maxBuffer: 24 * 1024 * 1024 })
  const raw = parseLoudnormJson(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  return mapLoudnessStats(raw)
}

async function normalizeAudio(input: {
  inputPath: string
  outputPath: string
  loudnessBefore: { raw: Record<string, unknown> }
}): Promise<void> {
  const raw = input.loudnessBefore.raw
  const measuredI = readRequiredLoudnormValue(raw, 'input_i')
  const measuredTp = readRequiredLoudnormValue(raw, 'input_tp')
  const measuredLra = readRequiredLoudnormValue(raw, 'input_lra')
  const measuredThresh = readRequiredLoudnormValue(raw, 'input_thresh')
  const offset = readRequiredLoudnormValue(raw, 'target_offset')
  const filter = [
    'loudnorm=I=-16',
    'TP=-1.5',
    'LRA=11',
    `measured_I=${measuredI}`,
    `measured_TP=${measuredTp}`,
    `measured_LRA=${measuredLra}`,
    `measured_thresh=${measuredThresh}`,
    `offset=${offset}`,
    'linear=true',
    'print_format=json',
  ].join(':')
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.inputPath,
    '-vn',
    '-af',
    filter,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    input.outputPath,
  ], { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
}

async function muxNormalizedExport(input: {
  inputPath: string
  normalizedAudioPath: string
  outputPath: string
}): Promise<string | undefined> {
  const streamCopyArgs = [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.inputPath,
    '-i',
    input.normalizedAudioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    input.outputPath,
  ]
  try {
    await execFileAsync('ffmpeg', streamCopyArgs, { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
    return undefined
  } catch {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.inputPath,
      '-i',
      input.normalizedAudioPath,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-movflags',
      '+faststart',
      input.outputPath,
    ], { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
    return 'Video stream copy mux failed; Phase 31 used safe H.264 re-encode fallback with normalized audio.'
  }
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

async function uploadFile(storage: Storage, bucket: string, object: string, localPath: string, contentType: string, phase = '30'): Promise<ArtifactRecord> {
  await storage.bucket(bucket).upload(localPath, {
    destination: object,
    metadata: {
      contentType,
      metadata: {
        app: 'reeditpro',
        env: 'staging',
        phase,
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

async function uploadJson(storage: Storage, bucket: string, object: string, payload: unknown, phase = '30'): Promise<ArtifactRecord> {
  const tempPath = path.join(os.tmpdir(), `${createHash('sha256').update(object).digest('hex')}.json`)
  await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(storage, bucket, object, tempPath, 'application/json', phase)
}

function buildAudioCleanupQaSummary(input: {
  normalizedExportExists: boolean
  inputDurationSeconds?: number
  outputDurationSeconds?: number
  outputHasAudio?: boolean
  outputVideoCodec?: string
  outputAudioCodec?: string
  loudnessAfter?: number
  truePeakAfter?: number
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<Record<string, unknown>>
  blockers: string[]
  warnings: string[]
} {
  const durationDelta = input.inputDurationSeconds === undefined || input.outputDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.outputDurationSeconds - input.inputDurationSeconds)
  const loudnessDelta = input.loudnessAfter === undefined ? Number.POSITIVE_INFINITY : Math.abs(input.loudnessAfter - -16)
  const truePeak = input.truePeakAfter ?? Number.POSITIVE_INFINITY
  const gates = [
    audioGate('audio_loudness', loudnessDelta <= 1.5 && truePeak <= -0.1, `Normalized audio measured ${formatNumber(input.loudnessAfter)} LUFS with true peak ${formatNumber(input.truePeakAfter)} dBTP.`),
    audioGate('audio_sync', Boolean(input.outputHasAudio) && durationDelta <= 0.75, `Output duration delta ${durationDelta.toFixed(3)}s remains within tolerance.`),
    audioWarningGate('audio_naturalness', 'Phase 31 uses deterministic FFmpeg loudness only; perceptual listening QA remains manual/future.'),
    audioWarningGate('music_over_voice', 'No music-over-voice classifier ran; Phase 31 records this as warning-only.'),
    audioGate('export_codec_format', input.outputVideoCodec === 'h264' && input.outputAudioCodec === 'aac', 'Private normalized export uses H.264/AAC MP4.'),
    audioGate('export_duration_sync', durationDelta <= 0.75, `Export duration is close to the Phase 30B duration (${durationDelta.toFixed(3)}s delta).`),
  ]
  const blockersBeforeFinal = gates.filter((item) => item.blocking)
  gates.push(audioGate('final_delivery', input.normalizedExportExists && blockersBeforeFinal.length === 0, 'Private Phase 31 audio-normalized final delivery exists with no blocking audio QA findings.'))
  const blockers = gates.filter((item) => item.blocking).map((item) => `${item.gateType}: ${item.message}`)
  const warnings = gates.filter((item) => item.status === 'warning').map((item) => `${item.gateType}: ${item.message}`)
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function audioGate(gateType: string, passed: boolean, message: string): Record<string, unknown> {
  return {
    id: `phase31-gate-${gateType}`,
    workspaceId: 'activation-phase31',
    projectId: 'reeditpro',
    mediaAssetId: 'phase30-20260528T12421-final-export',
    toolExecutionPlanId: 'activation-phase31-audio-cleanup',
    recipeId: gateType === 'final_delivery' ? 'private_audio_normalized_export' : 'ffmpeg_loudness_normalization',
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

function audioWarningGate(gateType: string, message: string): Record<string, unknown> {
  return {
    ...audioGate(gateType, true, message),
    status: 'warning',
    score: 0.78,
    issues: [{ code: `${gateType}_warning`, message, severity: 'warning' }],
    recommendations: [{ action: 'continue', reason: message, priority: 'medium' }],
    humanReviewRequired: true,
    message,
  }
}

function parseLoudnormJson(output: string): Record<string, unknown> {
  const start = output.lastIndexOf('{')
  const end = output.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('FFmpeg loudnorm JSON output was not found.')
  return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>
}

function mapLoudnessStats(raw: Record<string, unknown>): {
  integratedLufs?: number
  truePeakDbtp?: number
  loudnessRange?: number
  threshold?: number
  targetOffset?: number
  raw: Record<string, unknown>
} {
  return {
    integratedLufs: readNumber(raw.input_i),
    truePeakDbtp: readNumber(raw.input_tp),
    loudnessRange: readNumber(raw.input_lra),
    threshold: readNumber(raw.input_thresh),
    targetOffset: readNumber(raw.target_offset),
    raw,
  }
}

function readRequiredLoudnormValue(raw: Record<string, unknown>, key: string): string {
  const value = raw[key]
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  throw new Error(`FFmpeg loudnorm output is missing ${key}.`)
}

function formatNumber(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'unknown' : value.toFixed(2)
}

function phase31Safety(): Record<string, unknown> {
  return {
    approvedPhase30InputOnly: true,
    secondSourceVideoUsed: false,
    providerExecuted: false,
    gpuUsed: false,
    modelDownloadedExternally: false,
    deepFilterNetUsed: false,
    rnnoiseUsed: false,
    demucsUsed: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    sourceOverwritten: false,
    colorExecuted: false,
    masksOrEnhancementExecuted: false,
    revideoUsed: false,
  }
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
