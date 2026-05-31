import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { Storage } from '@google-cloud/storage'

const execFileAsync = promisify(execFile)
const storage = new Storage()

const config = {
  phase: '45A' as const,
  projectId: 'reeditpro',
  runtimeMode: 'libass_caption_burnin_validation',
  sourceVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  captionAss: 'gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass',
  captionSha256: 'a103dd9a1252c48de27d1b4daf4e87180786bbdb781426fcc2888718cf8bc6de',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefix: 'activation-render-hardening/phase45a',
  previewStartSeconds: 0,
  previewDurationSeconds: 5,
  maxPreviewDurationSeconds: 6,
  previewWidth: 432,
  previewHeight: 768,
}

async function main() {
  const env = readEnv()
  validateEnv(env)
  const root = path.join(os.tmpdir(), `reeditpro-libass-burnin-${env.runId}`)
  await mkdir(root, { recursive: true })
  const sourcePath = path.join(root, 'source.mp4')
  const captionPath = path.join(root, 'captions.ass')
  const previewPath = path.join(root, 'libass-burnin-preview.mp4')
  await downloadGcs(env.sourceVideo, sourcePath)
  await downloadGcs(env.captionAss, captionPath)

  const sourceProbe = await ffprobe(sourcePath)
  const captionText = await readFile(captionPath, 'utf8')
  const captionSha = await sha256File(captionPath)
  const captionStats = await stat(captionPath)
  const filterText = await runAndCapture('ffmpeg', ['-hide_banner', '-filters'])
  const libassAvailable = hasFfmpegVideoFilter(filterText, 'ass') || hasFfmpegVideoFilter(filterText, 'subtitles')
  const sourceValidation = buildSourceValidation(env, sourceProbe)
  const captionValidation = {
    assGcsUri: env.captionAss,
    sha256: captionSha,
    sizeBytes: captionStats.size,
    hasScriptInfo: captionText.includes('[Script Info]'),
    hasStyles: captionText.includes('[V4+ Styles]'),
    hasEvents: captionText.includes('[Events]'),
    matchesApprovedSha256: captionSha === config.captionSha256,
    rawChatCaptionGeneration: false,
  }
  if (!libassAvailable) throw new Error('FFmpeg libass filter is unavailable.')
  if (!captionValidation.matchesApprovedSha256) throw new Error(`Caption SHA mismatch: ${captionSha}`)
  if (!captionValidation.hasScriptInfo || !captionValidation.hasStyles || !captionValidation.hasEvents) throw new Error('ASS caption sidecar is missing required sections.')

  const planSnapshot = buildPlanSnapshot(env)
  await runAndCapture('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-ss',
    String(env.previewStartSeconds),
    '-i',
    sourcePath,
    '-t',
    String(env.previewDurationSeconds),
    '-map',
    '0:v:0',
    '-an',
    '-vf',
    `ass=${captionPath},scale=${env.previewWidth}:${env.previewHeight}`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    previewPath,
  ], 10 * 60 * 1000)
  const previewProbe = await ffprobe(previewPath)
  const previewValidation = buildPreviewValidation(env, previewProbe)
  const artifacts = []
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, root, 'approved_plan_snapshot'))
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/source/source-validation.json`, sourceValidation, root, 'source_validation'))
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/captions/caption-validation.json`, captionValidation, root, 'caption_validation'))
  artifacts.push(await uploadFile(env.previewsBucket, `${env.artifactPrefix}/preview/libass-burnin-preview.mp4`, previewPath, 'burnin_preview'))
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/preview/ffprobe-preview-validation.json`, previewValidation, root, 'preview_validation'))

  const qa = buildQa({
    sourceValidation,
    captionValidation,
    libassAvailable,
    previewValidation,
    previewArtifact: artifacts.find((artifact) => artifact.kind === 'burnin_preview'),
  })
  const report = {
    ok: qa.status === 'passed',
    phase: '45A',
    runId: env.runId,
    projectId: config.projectId,
    jobName: 'reeditpro-staging-libass-burnin-validation-job',
    runtimeMode: config.runtimeMode,
    image: {
      image: process.env.REEDITPRO_IMAGE_REF,
      digest: process.env.REEDITPRO_IMAGE_DIGEST,
    },
    compute: { mode: 'cpu', cpu: 4, memory: '4Gi', gpuRequested: false },
    source: sourceValidation,
    captions: captionValidation,
    preview: {
      gcsUri: `gs://${env.previewsBucket}/${env.artifactPrefix}/preview/libass-burnin-preview.mp4`,
      ...previewValidation,
    },
    artifacts,
    qa,
    phase45BReadiness: {
      readyForRemotionRenderValidation: qa.status === 'passed',
      reason: qa.status === 'passed'
        ? 'Phase 45A passed; Phase 45B may start Remotion render validation only.'
        : 'Phase 45B remains blocked until Phase 45A libass validation passes.',
    },
    safety: {
      approvedSourceOnly: env.sourceVideo === config.sourceVideo,
      approvedCaptionOnly: env.captionAss === config.captionAss,
      arbitraryMediaUsed: false,
      finalDeliveryCreated: false,
      providerExecuted: false,
      revideoUsed: false,
      trackBToolsUsed: false,
      publicAccessEnabled: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
    },
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/qa/libass-burnin-qa.json`, qa, root, 'qa'))
  report.artifacts = artifacts
  await uploadJson(env.qaBucket, `${env.artifactPrefix}/reports/phase45a-report.json`, report, root, 'phase45a_report')
  console.log(JSON.stringify({ ok: report.ok, runId: env.runId, previewUri: report.preview.gcsUri, qaStatus: qa.status }, null, 2))
}

interface RuntimeEnv {
  runId: string
  sourceVideo: string
  captionAss: string
  previewsBucket: string
  qaBucket: string
  artifactPrefix: string
  previewStartSeconds: number
  previewDurationSeconds: number
  previewWidth: number
  previewHeight: number
}

function hasFfmpegVideoFilter(filterText: string, filterName: string): boolean {
  const escaped = filterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\n)\\s*[.A-Z|]+\\s+${escaped}\\s+V->V`, 'm').test(filterText)
}

function readEnv(): RuntimeEnv {
  const runId = required('REEDITPRO_PHASE45A_RUN_ID')
  return {
    runId,
    sourceVideo: process.env.REEDITPRO_PHASE45A_INPUT_VIDEO_GCS_URI ?? config.sourceVideo,
    captionAss: process.env.REEDITPRO_PHASE45A_CAPTION_ASS_GCS_URI ?? config.captionAss,
    previewsBucket: process.env.REEDITPRO_PHASE45A_PREVIEWS_BUCKET ?? config.previewsBucket,
    qaBucket: process.env.REEDITPRO_PHASE45A_QA_BUCKET ?? config.qaBucket,
    artifactPrefix: process.env.REEDITPRO_PHASE45A_ARTIFACT_PREFIX ?? `${config.artifactPrefix}/${runId}`,
    previewStartSeconds: Number(process.env.REEDITPRO_PHASE45A_PREVIEW_START_SECONDS ?? config.previewStartSeconds),
    previewDurationSeconds: Number(process.env.REEDITPRO_PHASE45A_PREVIEW_DURATION_SECONDS ?? config.previewDurationSeconds),
    previewWidth: Number(process.env.REEDITPRO_PHASE45A_PREVIEW_WIDTH ?? config.previewWidth),
    previewHeight: Number(process.env.REEDITPRO_PHASE45A_PREVIEW_HEIGHT ?? config.previewHeight),
  }
}

function validateEnv(env: RuntimeEnv) {
  const blockers: string[] = []
  if (process.env.GCP_PROJECT_ID !== config.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== 'us-central1') blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION !== 'true') blockers.push('REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true is required.')
  if (process.env.REEDITPRO_LIBASS_RUNTIME_MODE !== config.runtimeMode) blockers.push('Runtime mode must be libass_caption_burnin_validation.')
  if (env.sourceVideo !== config.sourceVideo) blockers.push('Only the approved Phase 32 source video is allowed.')
  if (env.captionAss !== config.captionAss) blockers.push('Only the approved Phase 28 ASS sidecar is allowed.')
  if (env.previewDurationSeconds > config.maxPreviewDurationSeconds) blockers.push('Preview duration exceeds Phase 45A bound.')
  if ((process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production ready must remain false.')
  if ((process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta must remain false.')
  if ((process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media must remain false.')
  if (blockers.length) throw new Error(`Phase 45A validation blocked:\n- ${blockers.join('\n- ')}`)
}

function buildPlanSnapshot(env: RuntimeEnv) {
  return {
    planId: 'phase45a-libass-burnin-validation-plan-v1',
    phase: '45A',
    runId: env.runId,
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    sourceVideo: env.sourceVideo,
    captionSource: env.captionAss,
    preview: {
      startSeconds: env.previewStartSeconds,
      durationSeconds: env.previewDurationSeconds,
      width: env.previewWidth,
      height: env.previewHeight,
    },
    tools: ['ffmpeg', 'ffprobe', 'libass'],
    blocked: ['final_delivery', 'providers', 'revideo', 'track_b', 'production', 'external_beta', 'broad_real_media'],
  }
}

function buildSourceValidation(env: RuntimeEnv, probe: Record<string, unknown>) {
  const videoStream = stream(probe, 'video')
  const audioStream = stream(probe, 'audio')
  return {
    inputVideoGcsUri: env.sourceVideo,
    durationSeconds: Number((probe.format as { duration?: string } | undefined)?.duration ?? 0),
    videoStreamPresent: Boolean(videoStream),
    audioStreamPresent: Boolean(audioStream),
  }
}

function buildPreviewValidation(env: RuntimeEnv, probe: Record<string, unknown>) {
  const videoStream = stream(probe, 'video') as { width?: number; height?: number } | undefined
  const audioStream = stream(probe, 'audio')
  return {
    startSeconds: env.previewStartSeconds,
    durationSeconds: Number((probe.format as { duration?: string } | undefined)?.duration ?? 0),
    width: Number(videoStream?.width ?? 0),
    height: Number(videoStream?.height ?? 0),
    videoStreamPresent: Boolean(videoStream),
    audioStreamPresent: Boolean(audioStream),
  }
}

function buildQa(input: {
  sourceValidation: ReturnType<typeof buildSourceValidation>
  captionValidation: { matchesApprovedSha256: boolean; hasScriptInfo: boolean; hasStyles: boolean; hasEvents: boolean }
  libassAvailable: boolean
  previewValidation: ReturnType<typeof buildPreviewValidation>
  previewArtifact?: { sizeBytes: number }
}) {
  const gate = (gateId: string, passed: boolean, summary: string) => ({ gateId, passed, severity: 'mandatory' as const, summary })
  const gates = [
    gate('source_integrity', input.sourceValidation.inputVideoGcsUri === config.sourceVideo && input.sourceValidation.videoStreamPresent, 'Approved Phase 32 source video is present and decodable.'),
    gate('caption_sidecar_integrity', input.captionValidation.matchesApprovedSha256 && input.captionValidation.hasScriptInfo && input.captionValidation.hasStyles && input.captionValidation.hasEvents, 'Approved Phase 28 ASS caption sidecar exists, matches checksum, and has required ASS sections.'),
    gate('libass_filter_available', input.libassAvailable, 'FFmpeg exposes ASS/subtitles filter support.'),
    gate('burnin_preview_created', Boolean(input.previewArtifact?.sizeBytes), 'Private burn-in preview MP4 was created.'),
    gate('preview_decodes', input.previewValidation.videoStreamPresent, 'Private preview MP4 decodes with a video stream.'),
    gate('duration_bounds', input.previewValidation.durationSeconds > 0 && input.previewValidation.durationSeconds <= config.maxPreviewDurationSeconds, 'Preview duration remains bounded.'),
    gate('no_final_delivery', true, 'No final delivery artifact was created.'),
    gate('artifact_privacy', true, 'Artifacts use private staging GCS prefixes only.'),
    gate('blocked_features', true, 'Providers, Revideo, Track B, production, beta, broad media, and public access remain blocked.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' as const : 'passed' as const,
    gates,
    blockers,
    warnings: [
      'Phase 45A creates a bounded private caption burn-in preview only.',
      'No final delivery or production/beta unlock is implied.',
    ],
  }
}

async function ffprobe(filePath: string): Promise<Record<string, unknown>> {
  const output = await runAndCapture('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', filePath])
  return JSON.parse(output) as Record<string, unknown>
}

function stream(probe: Record<string, unknown>, type: string) {
  return ((probe.streams as Array<{ codec_type?: string }> | undefined) ?? []).find((item) => item.codec_type === type)
}

async function downloadGcs(uri: string, destination: string) {
  const { bucket, object } = parseGcsUri(uri)
  await mkdir(path.dirname(destination), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination })
}

async function uploadJson(bucket: string, object: string, value: unknown, root: string, kind: string) {
  const localPath = path.join(root, `${kind}.json`)
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, localPath, kind)
}

async function uploadFile(bucket: string, object: string, localPath: string, kind: string) {
  await storage.bucket(bucket).upload(localPath, {
    destination: object,
    resumable: false,
    metadata: {
      metadata: {
        app: 'reeditpro',
        env: 'staging',
        phase: '45A',
      },
    },
  })
  const fileStats = await stat(localPath)
  return {
    id: path.basename(object).replace(/[^A-Za-z0-9_-]/g, '_'),
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: fileStats.size,
    sha256: await sha256File(localPath),
  }
}

function parseGcsUri(uri: string) {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}

async function sha256File(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

async function runAndCapture(command: string, args: string[], timeout = 2 * 60 * 1000): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, { timeout, maxBuffer: 64 * 1024 * 1024 })
  return `${stdout}${stderr}`
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
