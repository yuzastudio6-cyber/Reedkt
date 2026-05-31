import { Storage } from '@google-cloud/storage'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const storage = new Storage()

const config = {
  projectId: 'reeditpro',
  runtimeMode: 'remotion_render_validation',
  sourceVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  phase45ARunId: 'phase45a-20260531T19033',
  phase45APreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  phase45AReport: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefix: 'activation-render-hardening/phase45b',
  previewDurationSeconds: 5,
  maxPreviewDurationSeconds: 5,
  previewWidth: 432,
  previewHeight: 768,
  previewFps: 30,
}

interface RuntimeEnv {
  runId: string
  sourceVideo: string
  phase45ARunId: string
  phase45APreview: string
  phase45AReport: string
  previewsBucket: string
  qaBucket: string
  artifactPrefix: string
  previewDurationSeconds: number
  previewWidth: number
  previewHeight: number
  previewFps: number
}

async function main(): Promise<void> {
  const env = readEnv()
  validateEnv(env)
  const root = path.join(os.tmpdir(), `reeditpro-remotion-render-${env.runId}`)
  const remotionRoot = path.join(process.cwd(), `.remotion-phase45b-${env.runId}`)
  await rm(root, { recursive: true, force: true })
  await rm(remotionRoot, { recursive: true, force: true })
  await mkdir(root, { recursive: true })
  await mkdir(remotionRoot, { recursive: true })

  const sourcePath = path.join(root, 'phase32-source.mp4')
  const phase45APreviewPath = path.join(root, 'phase45a-libass-preview.mp4')
  const phase45AReportPath = path.join(root, 'phase45a-report.json')
  const remotionPreviewPath = path.join(root, 'remotion-render-preview.mp4')
  await downloadGcs(env.sourceVideo, sourcePath)
  await downloadGcs(env.phase45APreview, phase45APreviewPath)
  await downloadGcs(env.phase45AReport, phase45AReportPath)

  const sourceProbe = await ffprobe(sourcePath)
  const phase45APreviewProbe = await ffprobe(phase45APreviewPath)
  const phase45AReport = JSON.parse(await readFile(phase45AReportPath, 'utf8')) as Record<string, unknown>
  const phase45AValidation = validatePhase45AReport(phase45AReport, env)
  const planSnapshot = buildPlanSnapshot(env)
  const artifacts = [
    await uploadJson(env.qaBucket, `${env.artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, root, 'approved_plan_snapshot'),
    await uploadJson(env.qaBucket, `${env.artifactPrefix}/source/source-validation.json`, buildSourceValidation(env, sourceProbe, phase45APreviewProbe), root, 'source_validation'),
  ]

  const compositionId = 'ReeditProPhase45BPreview'
  const remotionPublicDir = path.join(remotionRoot, 'public')
  const publicPreviewFileName = 'phase45a-libass-preview.mp4'
  await mkdir(remotionPublicDir, { recursive: true })
  await copyFile(phase45APreviewPath, path.join(remotionPublicDir, publicPreviewFileName))
  await writeRemotionComposition({
    root: remotionRoot,
    sourceFileName: publicPreviewFileName,
    compositionId,
    width: env.previewWidth,
    height: env.previewHeight,
    fps: env.previewFps,
    durationFrames: Math.round(env.previewDurationSeconds * env.previewFps),
  })
  const remotionVersion = await getRemotionVersion()
  const remotionCommand = [
    'render',
    path.join(remotionRoot, 'Root.tsx'),
    compositionId,
    remotionPreviewPath,
    '--codec',
    'h264',
    '--pixel-format',
    'yuv420p',
    '--concurrency',
    '1',
    '--disable-web-security',
    '--browser-executable=/usr/bin/chromium',
    '--public-dir',
    remotionPublicDir,
    '--log',
    'verbose',
  ]
  await runAndCapture(path.join(process.cwd(), 'node_modules/.bin/remotion'), remotionCommand, 10 * 60 * 1000)

  const previewStats = await stat(remotionPreviewPath)
  const previewSha = await sha256File(remotionPreviewPath)
  const previewProbe = await ffprobe(remotionPreviewPath)
  const renderMetadata = {
    remotionInvoked: true,
    remotionVersion,
    compositionId,
    width: env.previewWidth,
    height: env.previewHeight,
    fps: env.previewFps,
    durationSeconds: env.previewDurationSeconds,
    durationFrames: Math.round(env.previewDurationSeconds * env.previewFps),
    inputPreview: env.phase45APreview,
    outputLocalSizeBytes: previewStats.size,
    outputLocalSha256: previewSha,
    commandSummary: `remotion ${remotionCommand.map((part) => part.includes(root) || part.includes(remotionRoot) ? '[worker-temp-path]' : part).join(' ')}`,
  }
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/metadata/remotion-render-metadata.json`, renderMetadata, root, 'render_metadata'))
  artifacts.push(await uploadFile(env.previewsBucket, `${env.artifactPrefix}/preview/remotion-render-preview.mp4`, remotionPreviewPath, 'remotion_preview'))
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/preview/ffprobe-preview-validation.json`, buildPreviewValidation(previewProbe), root, 'preview_validation'))

  const qa = buildQa({
    sourceProbe,
    phase45APreviewProbe,
    phase45AValidation,
    remotionInvoked: true,
    previewProbe,
    previewStats,
    artifacts,
    env,
  })
  const report = {
    ok: qa.status === 'passed',
    phase: '45B',
    runId: env.runId,
    projectId: config.projectId,
    jobName: 'reeditpro-staging-remotion-render-validation-job',
    runtimeMode: config.runtimeMode,
    image: {
      image: process.env.REEDITPRO_IMAGE_REF ?? 'not-recorded',
      digest: process.env.REEDITPRO_IMAGE_DIGEST ?? 'not-recorded',
    },
    compute: {
      mode: 'cpu',
      cpu: 4,
      memory: '8Gi',
      gpuRequested: false,
    },
    source: {
      inputVideoGcsUri: env.sourceVideo,
      durationSeconds: durationSeconds(sourceProbe),
      videoStreamPresent: hasVideoStream(sourceProbe),
      audioStreamPresent: hasAudioStream(sourceProbe),
    },
    phase45A: {
      runId: env.phase45ARunId,
      previewGcsUri: env.phase45APreview,
      reportGcsUri: env.phase45AReport,
      qaPassed: phase45AValidation.qaPassed,
      phase45BReady: phase45AValidation.phase45BReady,
    },
    render: renderMetadata,
    preview: {
      gcsUri: `gs://${env.previewsBucket}/${env.artifactPrefix}/preview/remotion-render-preview.mp4`,
      durationSeconds: durationSeconds(previewProbe),
      width: videoWidth(previewProbe),
      height: videoHeight(previewProbe),
      videoStreamPresent: hasVideoStream(previewProbe),
      audioStreamPresent: hasAudioStream(previewProbe),
    },
    artifacts,
    qa,
    phase45CReadiness: {
      readyForOpenTimelineIoValidation: qa.status === 'passed',
      reason: qa.status === 'passed'
        ? 'Phase 45B passed; Phase 45C may start OpenTimelineIO timeline validation only.'
        : 'Phase 45C remains blocked until Phase 45B Remotion render validation passes.',
    },
    safety: {
      approvedSourceOnly: env.sourceVideo === config.sourceVideo,
      approvedPhase45AOnly: env.phase45APreview === config.phase45APreview && env.phase45AReport === config.phase45AReport,
      arbitraryMediaUsed: false,
      finalDeliveryCreated: false,
      providerExecuted: false,
      revideoUsed: false,
      trackBToolsUsed: false,
      publicAccessEnabled: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    },
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/qa/remotion-render-qa.json`, qa, root, 'qa'))
  report.artifacts = artifacts
  await uploadJson(env.qaBucket, `${env.artifactPrefix}/reports/phase45b-report.json`, report, root, 'phase45b_report')
  await rm(remotionRoot, { recursive: true, force: true })
  await rm(root, { recursive: true, force: true })
  if (qa.status !== 'passed') throw new Error(`Phase 45B QA blocked:\n- ${qa.blockers.join('\n- ')}`)
}

function readEnv(): RuntimeEnv {
  const runId = required('REEDITPRO_PHASE45B_RUN_ID')
  return {
    runId,
    sourceVideo: process.env.REEDITPRO_PHASE45B_INPUT_VIDEO_GCS_URI ?? config.sourceVideo,
    phase45ARunId: process.env.REEDITPRO_PHASE45B_PHASE45A_RUN_ID ?? config.phase45ARunId,
    phase45APreview: process.env.REEDITPRO_PHASE45B_PHASE45A_PREVIEW_GCS_URI ?? config.phase45APreview,
    phase45AReport: process.env.REEDITPRO_PHASE45B_PHASE45A_REPORT_GCS_URI ?? config.phase45AReport,
    previewsBucket: process.env.REEDITPRO_PHASE45B_PREVIEWS_BUCKET ?? config.previewsBucket,
    qaBucket: process.env.REEDITPRO_PHASE45B_QA_BUCKET ?? config.qaBucket,
    artifactPrefix: process.env.REEDITPRO_PHASE45B_ARTIFACT_PREFIX ?? `${config.artifactPrefix}/${runId}`,
    previewDurationSeconds: Number(process.env.REEDITPRO_PHASE45B_PREVIEW_DURATION_SECONDS ?? config.previewDurationSeconds),
    previewWidth: Number(process.env.REEDITPRO_PHASE45B_PREVIEW_WIDTH ?? config.previewWidth),
    previewHeight: Number(process.env.REEDITPRO_PHASE45B_PREVIEW_HEIGHT ?? config.previewHeight),
    previewFps: Number(process.env.REEDITPRO_PHASE45B_PREVIEW_FPS ?? config.previewFps),
  }
}

function validateEnv(env: RuntimeEnv) {
  const blockers: string[] = []
  if (process.env.GCP_PROJECT_ID !== config.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== 'us-central1') blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION !== 'true') blockers.push('REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION=true is required.')
  if (process.env.REEDITPRO_REMOTION_RENDER_RUNTIME_MODE !== config.runtimeMode) blockers.push('Runtime mode must be remotion_render_validation.')
  if (env.sourceVideo !== config.sourceVideo) blockers.push('Only the approved Phase 32 source video is allowed.')
  if (env.phase45ARunId !== config.phase45ARunId) blockers.push('Only the approved Phase 45A run is allowed.')
  if (env.phase45APreview !== config.phase45APreview) blockers.push('Only the approved Phase 45A preview is allowed.')
  if (env.phase45AReport !== config.phase45AReport) blockers.push('Only the approved Phase 45A report is allowed.')
  if (env.previewDurationSeconds > config.maxPreviewDurationSeconds) blockers.push('Preview duration exceeds Phase 45B bound.')
  if ((process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production ready must remain false.')
  if ((process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta must remain false.')
  if ((process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production must remain false.')
  if ((process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media must remain false.')
  if (blockers.length) throw new Error(`Phase 45B validation blocked:\n- ${blockers.join('\n- ')}`)
}

function buildPlanSnapshot(env: RuntimeEnv) {
  return {
    planId: 'phase45b-remotion-render-validation-plan-v1',
    phase: '45B',
    runId: env.runId,
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    sourceVideo: env.sourceVideo,
    phase45AEvidence: {
      runId: env.phase45ARunId,
      preview: env.phase45APreview,
      report: env.phase45AReport,
    },
    preview: {
      durationSeconds: env.previewDurationSeconds,
      width: env.previewWidth,
      height: env.previewHeight,
      fps: env.previewFps,
    },
    tools: ['remotion', 'ffprobe'],
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    trackBAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

function buildSourceValidation(env: RuntimeEnv, sourceProbe: Record<string, unknown>, phase45APreviewProbe: Record<string, unknown>) {
  return {
    sourceVideo: env.sourceVideo,
    sourceDurationSeconds: durationSeconds(sourceProbe),
    sourceVideoStreamPresent: hasVideoStream(sourceProbe),
    sourceAudioStreamPresent: hasAudioStream(sourceProbe),
    phase45APreview: env.phase45APreview,
    phase45APreviewDurationSeconds: durationSeconds(phase45APreviewProbe),
    phase45APreviewVideoStreamPresent: hasVideoStream(phase45APreviewProbe),
    phase45APreviewAudioStreamPresent: hasAudioStream(phase45APreviewProbe),
    arbitraryMediaUsed: false,
  }
}

function validatePhase45AReport(report: Record<string, unknown>, env: RuntimeEnv) {
  const qa = isRecord(report.qa) ? report.qa : {}
  const readiness = isRecord(report.phase45BReadiness) ? report.phase45BReadiness : {}
  return {
    runIdMatches: report.runId === env.phase45ARunId,
    ok: report.ok === true,
    qaPassed: qa.status === 'passed',
    phase45BReady: readiness.readyForRemotionRenderValidation === true,
    noBlockers: Array.isArray(qa.blockers) && qa.blockers.length === 0,
  }
}

async function writeRemotionComposition(input: {
  root: string
  sourceFileName: string
  compositionId: string
  width: number
  height: number
  fps: number
  durationFrames: number
}) {
  const rootSource = `import React from 'react'
import { AbsoluteFill, Composition, OffthreadVideo, registerRoot, staticFile } from 'remotion'

const source = staticFile(${JSON.stringify(input.sourceFileName)})

function Phase45BPreview() {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <OffthreadVideo
        src={source}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  )
}

export default function Root() {
  return (
    <Composition
      id=${JSON.stringify(input.compositionId)}
      component={Phase45BPreview}
      durationInFrames={${input.durationFrames}}
      fps={${input.fps}}
      width={${input.width}}
      height={${input.height}}
    />
  )
}

registerRoot(Root)
`
  await writeFile(path.join(input.root, 'Root.tsx'), rootSource, 'utf8')
}

function buildPreviewValidation(previewProbe: Record<string, unknown>) {
  return {
    durationSeconds: durationSeconds(previewProbe),
    width: videoWidth(previewProbe),
    height: videoHeight(previewProbe),
    videoStreamPresent: hasVideoStream(previewProbe),
    audioStreamPresent: hasAudioStream(previewProbe),
  }
}

function buildQa(input: {
  sourceProbe: Record<string, unknown>
  phase45APreviewProbe: Record<string, unknown>
  phase45AValidation: ReturnType<typeof validatePhase45AReport>
  remotionInvoked: boolean
  previewProbe: Record<string, unknown>
  previewStats: { size: number }
  artifacts: Array<{ gcsUri: string }>
  env: RuntimeEnv
}) {
  const privatePrefix = 'gs://reeditpro-staging-reeditpro-'
  const gate = (gateId: string, passed: boolean, summary: string) => ({ gateId, passed, severity: 'mandatory' as const, summary })
  const gates = [
    gate('source_integrity', hasVideoStream(input.sourceProbe) && hasVideoStream(input.phase45APreviewProbe), 'Approved Phase 32 source and Phase 45A preview are present and decodable.'),
    gate('phase45a_evidence', input.phase45AValidation.runIdMatches && input.phase45AValidation.ok && input.phase45AValidation.qaPassed && input.phase45AValidation.phase45BReady && input.phase45AValidation.noBlockers, 'Approved Phase 45A report has no blockers and marks Phase45B ready.'),
    gate('remotion_render_invoked', input.remotionInvoked, 'Remotion render command was invoked by the validation worker.'),
    gate('render_preview_created', input.previewStats.size > 0, 'Private Remotion preview MP4 was created.'),
    gate('ffprobe_preview_validation', hasVideoStream(input.previewProbe), 'Private Remotion preview MP4 decodes with a video stream.'),
    gate('duration_bounds', durationSeconds(input.previewProbe) <= config.maxPreviewDurationSeconds + 0.25, 'Preview duration remains bounded to 5 seconds or less.'),
    gate('private_artifacts', input.artifacts.every((artifact) => artifact.gcsUri.startsWith(privatePrefix)), 'Artifacts use private staging GCS prefixes only.'),
    gate('no_final_delivery', true, 'No final delivery artifact was created.'),
    gate('blocked_features', true, 'Providers, Revideo, Track B, production, beta, paid production, broad media, and public access remain blocked.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' as const : 'passed' as const,
    gates,
    blockers,
    warnings: [
      'Phase 45B creates a bounded private Remotion render preview only.',
      'No final delivery or production/beta unlock is implied.',
    ],
  }
}

async function downloadGcs(uri: string, destination: string) {
  const { bucket, object } = parseGcsUri(uri)
  await storage.bucket(bucket).file(object).download({ destination })
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, kind: string) {
  const filePath = path.join(root, `${kind}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, kind: string) {
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await storage.bucket(bucket).upload(filePath, { destination: object, resumable: false })
  return {
    id: `${path.basename(object).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256,
  }
}

async function ffprobe(filePath: string): Promise<Record<string, unknown>> {
  const output = await runAndCapture('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath])
  return JSON.parse(output) as Record<string, unknown>
}

async function getRemotionVersion(): Promise<string | undefined> {
  try {
    return (await runAndCapture(path.join(process.cwd(), 'node_modules/.bin/remotion'), ['--version'])).trim()
  } catch {
    return undefined
  }
}

async function runAndCapture(command: string, args: string[], timeout = 120_000): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `${process.cwd()}/node_modules/.bin:${process.env.PATH ?? ''}`,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium',
      CHROME_BIN: process.env.CHROME_BIN ?? '/usr/bin/chromium',
      CHROME_EXECUTABLE: process.env.CHROME_EXECUTABLE ?? '/usr/bin/chromium',
      REMOTION_DISABLE_UPDATE_CHECK: '1',
    },
  })
  return `${stdout}${stderr}`
}

function parseGcsUri(uri: string): { bucket: string; object: string } {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}

function streams(probe: Record<string, unknown>) {
  return Array.isArray(probe.streams) ? probe.streams.filter(isRecord) : []
}

function hasVideoStream(probe: Record<string, unknown>) {
  return streams(probe).some((stream) => stream.codec_type === 'video')
}

function hasAudioStream(probe: Record<string, unknown>) {
  return streams(probe).some((stream) => stream.codec_type === 'audio')
}

function videoWidth(probe: Record<string, unknown>) {
  return Number(streams(probe).find((stream) => stream.codec_type === 'video')?.width ?? 0)
}

function videoHeight(probe: Record<string, unknown>) {
  return Number(streams(probe).find((stream) => stream.codec_type === 'video')?.height ?? 0)
}

function durationSeconds(probe: Record<string, unknown>) {
  const format = isRecord(probe.format) ? probe.format : {}
  const value = typeof format.duration === 'string' ? Number(format.duration) : 0
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
