import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { Storage } from '@google-cloud/storage'

const execFileAsync = promisify(execFile)
const storage = new Storage()

const config = {
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'ffmpeg_final_render_hardening',
  sourceVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  phase45ARunId: 'phase45a-20260531T19033',
  phase45APreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
  phase45AReport: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/phase45a-20260531T19033/reports/phase45a-report.json',
  phase45BRunId: 'phase45b-20260531T19552',
  phase45BPreview: 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
  phase45BReport: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/reports/phase45b-report.json',
  phase45CRunId: 'phase45c-20260531T20404',
  phase45COtio: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json',
  phase45CReport: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45c/phase45c-20260531T20404/reports/phase45c-report.json',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefix: 'activation-render-hardening/phase45d',
  exportDurationSeconds: 5.056,
  maxExportDurationSeconds: 6,
  maxWidth: 768,
  maxHeight: 768,
  expectedVideoCodec: 'h264',
  expectedAudioCodec: 'aac',
  expectedContainer: 'mov,mp4,m4a,3gp,3g2,mj2',
}

interface RuntimeEnv {
  runId: string
  sourceVideo: string
  phase45ARunId: string
  phase45APreview: string
  phase45AReport: string
  phase45BRunId: string
  phase45BPreview: string
  phase45BReport: string
  phase45CRunId: string
  phase45COtio: string
  phase45CReport: string
  finalExportsBucket: string
  qaBucket: string
  artifactPrefix: string
  exportDurationSeconds: number
}

interface ArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

async function main(): Promise<void> {
  const env = readEnv()
  validateEnv(env)
  const root = path.join(os.tmpdir(), `reeditpro-final-render-hardening-${env.runId}`)
  await rm(root, { recursive: true, force: true })
  await mkdir(root, { recursive: true })

  try {
    const sourcePath = path.join(root, 'phase32-source.mp4')
    const phase45APreviewPath = path.join(root, 'phase45a-preview.mp4')
    const phase45AReportPath = path.join(root, 'phase45a-report.json')
    const phase45BPreviewPath = path.join(root, 'phase45b-preview.mp4')
    const phase45BReportPath = path.join(root, 'phase45b-report.json')
    const phase45COtioPath = path.join(root, 'phase45c-timeline.json')
    const phase45CReportPath = path.join(root, 'phase45c-report.json')
    const exportPath = path.join(root, 'hardened-review-export.mp4')

    await Promise.all([
      downloadGcs(env.sourceVideo, sourcePath),
      downloadGcs(env.phase45APreview, phase45APreviewPath),
      downloadGcs(env.phase45AReport, phase45AReportPath),
      downloadGcs(env.phase45BPreview, phase45BPreviewPath),
      downloadGcs(env.phase45BReport, phase45BReportPath),
      downloadGcs(env.phase45COtio, phase45COtioPath),
      downloadGcs(env.phase45CReport, phase45CReportPath),
    ])

    const [sourceProbe, phase45APreviewProbe, phase45BPreviewProbe] = await Promise.all([
      ffprobe(sourcePath),
      ffprobe(phase45APreviewPath),
      ffprobe(phase45BPreviewPath),
    ])
    const phase45AReport = JSON.parse(await readFile(phase45AReportPath, 'utf8')) as Record<string, unknown>
    const phase45BReport = JSON.parse(await readFile(phase45BReportPath, 'utf8')) as Record<string, unknown>
    const phase45COtio = JSON.parse(await readFile(phase45COtioPath, 'utf8')) as Record<string, unknown>
    const phase45CReport = JSON.parse(await readFile(phase45CReportPath, 'utf8')) as Record<string, unknown>

    const planSnapshot = buildPlanSnapshot(env)
    const sourceValidation = buildSourceValidation(env, sourceProbe, phase45APreviewProbe, phase45BPreviewProbe)
    const evidenceValidation = buildEvidenceValidation(env, phase45AReport, phase45BReport, phase45COtio, phase45CReport)
    const artifacts: ArtifactRecord[] = []
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, root, 'approved_plan_snapshot'))
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/source/source-validation.json`, sourceValidation, root, 'source_validation'))
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/evidence/evidence-validation.json`, evidenceValidation, root, 'evidence_validation'))

    const ffmpegArgs = buildFfmpegArgs(env, phase45BPreviewPath, exportPath)
    await runAndCapture('ffmpeg', ffmpegArgs, 10 * 60 * 1000)

    const exportProbe = await ffprobe(exportPath)
    const exportStats = await stat(exportPath)
    const exportSha = await sha256File(exportPath)
    const ffprobeValidation = await buildExportValidation(phase45BPreviewProbe, exportProbe, exportPath, exportStats.size, exportSha, ffmpegArgs)
    artifacts.push(await uploadFile(env.finalExportsBucket, `${env.artifactPrefix}/review/hardened-review-export.mp4`, exportPath, 'hardened_review_export'))
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/export/ffprobe-export-validation.json`, ffprobeValidation, root, 'ffprobe_export_validation'))

    const qa = buildQa({
      sourceValidation,
      evidenceValidation,
      ffprobeValidation,
      exportArtifact: artifacts.find((artifact) => artifact.kind === 'hardened_review_export'),
    })
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/qa/final-render-hardening-qa.json`, qa, root, 'qa'))

    const report = {
      ok: qa.status === 'passed',
      phase: '45D',
      runId: env.runId,
      projectId: config.projectId,
      jobName: 'reeditpro-staging-final-render-hardening-job',
      runtimeMode: config.runtimeMode,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF ?? 'not-recorded',
        digest: process.env.REEDITPRO_IMAGE_DIGEST ?? 'not-recorded',
      },
      compute: { mode: 'cpu', cpu: 4, memory: '8Gi', gpuRequested: false },
      source: {
        inputVideoGcsUri: env.sourceVideo,
        durationSeconds: durationSeconds(sourceProbe),
        videoStreamPresent: hasVideoStream(sourceProbe),
        audioStreamPresent: hasAudioStream(sourceProbe),
      },
      evidence: {
        phase45A: {
          runId: env.phase45ARunId,
          previewGcsUri: env.phase45APreview,
          reportGcsUri: env.phase45AReport,
          reportPassed: evidenceValidation.phase45A.reportPassed,
        },
        phase45B: {
          runId: env.phase45BRunId,
          previewGcsUri: env.phase45BPreview,
          reportGcsUri: env.phase45BReport,
          reportPassed: evidenceValidation.phase45B.reportPassed,
        },
        phase45C: {
          runId: env.phase45CRunId,
          otioGcsUri: env.phase45COtio,
          reportGcsUri: env.phase45CReport,
          reportPassed: evidenceValidation.phase45C.reportPassed,
          otioSchemaValid: evidenceValidation.phase45C.otioSchemaValid,
        },
      },
      export: {
        gcsUri: `gs://${env.finalExportsBucket}/${env.artifactPrefix}/review/hardened-review-export.mp4`,
        durationSeconds: ffprobeValidation.durationSeconds,
        width: ffprobeValidation.width,
        height: ffprobeValidation.height,
        videoCodec: ffprobeValidation.videoCodec,
        audioCodec: ffprobeValidation.audioCodec,
        audioStreamPresent: ffprobeValidation.audioStreamPresent,
        videoStreamPresent: ffprobeValidation.videoStreamPresent,
        container: ffprobeValidation.container,
        bitRate: ffprobeValidation.bitRate,
        faststart: ffprobeValidation.faststart,
        unexpectedStreams: ffprobeValidation.unexpectedStreams,
      },
      artifacts,
      qa,
      phase45EReadiness: {
        readyForFullVisualVideoPrivateE2E: qa.status === 'passed',
        reason: qa.status === 'passed'
          ? 'Phase 45D passed; Phase 45E may start full visual-video private E2E only.'
          : `Phase 45E remains blocked: ${qa.blockers.join('; ')}`,
      },
      safety: {
        approvedSourceOnly: env.sourceVideo === config.sourceVideo,
        approvedPhase45AOnly: env.phase45APreview === config.phase45APreview && env.phase45AReport === config.phase45AReport,
        approvedPhase45BOnly: env.phase45BPreview === config.phase45BPreview && env.phase45BReport === config.phase45BReport,
        approvedPhase45COnly: env.phase45COtio === config.phase45COtio && env.phase45CReport === config.phase45CReport,
        arbitraryMediaUsed: false,
        finalDeliveryCreated: false,
        privateReviewOnly: true,
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
    artifacts.push(await uploadJson(env.qaBucket, `${env.artifactPrefix}/reports/phase45d-report.json`, report, root, 'phase45d_report'))
    report.artifacts = artifacts
    console.log(JSON.stringify({ ok: report.ok, runId: env.runId, exportUri: report.export.gcsUri, qaStatus: qa.status }, null, 2))
    if (qa.status !== 'passed') throw new Error(`Phase 45D QA blocked:\n- ${qa.blockers.join('\n- ')}`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

function readEnv(): RuntimeEnv {
  const runId = required('REEDITPRO_PHASE45D_RUN_ID')
  return {
    runId,
    sourceVideo: process.env.REEDITPRO_PHASE45D_INPUT_VIDEO_GCS_URI ?? config.sourceVideo,
    phase45ARunId: process.env.REEDITPRO_PHASE45D_PHASE45A_RUN_ID ?? config.phase45ARunId,
    phase45APreview: process.env.REEDITPRO_PHASE45D_PHASE45A_PREVIEW_GCS_URI ?? config.phase45APreview,
    phase45AReport: process.env.REEDITPRO_PHASE45D_PHASE45A_REPORT_GCS_URI ?? config.phase45AReport,
    phase45BRunId: process.env.REEDITPRO_PHASE45D_PHASE45B_RUN_ID ?? config.phase45BRunId,
    phase45BPreview: process.env.REEDITPRO_PHASE45D_PHASE45B_PREVIEW_GCS_URI ?? config.phase45BPreview,
    phase45BReport: process.env.REEDITPRO_PHASE45D_PHASE45B_REPORT_GCS_URI ?? config.phase45BReport,
    phase45CRunId: process.env.REEDITPRO_PHASE45D_PHASE45C_RUN_ID ?? config.phase45CRunId,
    phase45COtio: process.env.REEDITPRO_PHASE45D_PHASE45C_OTIO_GCS_URI ?? config.phase45COtio,
    phase45CReport: process.env.REEDITPRO_PHASE45D_PHASE45C_REPORT_GCS_URI ?? config.phase45CReport,
    finalExportsBucket: process.env.REEDITPRO_PHASE45D_FINAL_EXPORTS_BUCKET ?? config.finalExportsBucket,
    qaBucket: process.env.REEDITPRO_PHASE45D_QA_BUCKET ?? config.qaBucket,
    artifactPrefix: process.env.REEDITPRO_PHASE45D_ARTIFACT_PREFIX ?? `${config.artifactPrefix}/${runId}`,
    exportDurationSeconds: Number(process.env.REEDITPRO_PHASE45D_EXPORT_DURATION_SECONDS ?? config.exportDurationSeconds),
  }
}

function validateEnv(env: RuntimeEnv): void {
  const blockers: string[] = []
  if (process.env.GCP_PROJECT_ID !== config.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (process.env.GCP_REGION !== config.region) blockers.push('GCP_REGION must be us-central1.')
  if (process.env.REEDITPRO_ENV !== config.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING !== 'true') blockers.push('REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true is required.')
  if (process.env.REEDITPRO_FINAL_RENDER_HARDENING_RUNTIME_MODE !== config.runtimeMode) blockers.push('Runtime mode must be ffmpeg_final_render_hardening.')
  if (env.sourceVideo !== config.sourceVideo) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (env.phase45ARunId !== config.phase45ARunId || env.phase45APreview !== config.phase45APreview || env.phase45AReport !== config.phase45AReport) blockers.push('Only the approved Phase 45A evidence is allowed.')
  if (env.phase45BRunId !== config.phase45BRunId || env.phase45BPreview !== config.phase45BPreview || env.phase45BReport !== config.phase45BReport) blockers.push('Only the approved Phase 45B evidence is allowed.')
  if (env.phase45CRunId !== config.phase45CRunId || env.phase45COtio !== config.phase45COtio || env.phase45CReport !== config.phase45CReport) blockers.push('Only the approved Phase 45C evidence is allowed.')
  if (env.exportDurationSeconds > config.maxExportDurationSeconds) blockers.push('Export duration exceeds the Phase 45D bound.')
  if ((process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production ready must remain false.')
  if ((process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta must remain false.')
  if ((process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production must remain false.')
  if ((process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media must remain false.')
  if (blockers.length) throw new Error(`Phase 45D validation blocked:\n- ${blockers.join('\n- ')}`)
}

function buildPlanSnapshot(env: RuntimeEnv) {
  return {
    planId: 'phase45d-ffmpeg-ffprobe-final-render-hardening-plan-v1',
    phase: '45D',
    track: 'A visual/video',
    runId: env.runId,
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    sourceVideo: env.sourceVideo,
    hardenedInputPreview: env.phase45BPreview,
    priorEvidence: {
      phase45A: { runId: env.phase45ARunId, preview: env.phase45APreview, report: env.phase45AReport },
      phase45B: { runId: env.phase45BRunId, preview: env.phase45BPreview, report: env.phase45BReport },
      phase45C: { runId: env.phase45CRunId, otio: env.phase45COtio, report: env.phase45CReport },
    },
    export: {
      durationSeconds: env.exportDurationSeconds,
      codec: 'h264/aac',
      privateReviewOnly: true,
      finalDeliveryAllowed: false,
    },
    tools: ['ffmpeg', 'ffprobe'],
    blocked: ['final_delivery', 'public_access', 'providers', 'revideo', 'track_b', 'production', 'external_beta', 'paid_production', 'broad_real_media'],
  }
}

function buildSourceValidation(env: RuntimeEnv, sourceProbe: Record<string, unknown>, phase45APreviewProbe: Record<string, unknown>, phase45BPreviewProbe: Record<string, unknown>) {
  return {
    inputVideoGcsUri: env.sourceVideo,
    sourceDurationSeconds: durationSeconds(sourceProbe),
    sourceVideoStreamPresent: hasVideoStream(sourceProbe),
    sourceAudioStreamPresent: hasAudioStream(sourceProbe),
    phase45APreviewGcsUri: env.phase45APreview,
    phase45APreviewDurationSeconds: durationSeconds(phase45APreviewProbe),
    phase45APreviewVideoStreamPresent: hasVideoStream(phase45APreviewProbe),
    phase45BPreviewGcsUri: env.phase45BPreview,
    phase45BPreviewDurationSeconds: durationSeconds(phase45BPreviewProbe),
    phase45BPreviewVideoStreamPresent: hasVideoStream(phase45BPreviewProbe),
    phase45BPreviewAudioStreamPresent: hasAudioStream(phase45BPreviewProbe),
    arbitraryMediaUsed: false,
  }
}

function buildEvidenceValidation(env: RuntimeEnv, phase45AReport: Record<string, unknown>, phase45BReport: Record<string, unknown>, phase45COtio: Record<string, unknown>, phase45CReport: Record<string, unknown>) {
  const phase45CReadiness = isRecord(phase45CReport.phase45DReadiness) ? phase45CReport.phase45DReadiness : {}
  return {
    phase45A: {
      runId: env.phase45ARunId,
      previewGcsUri: env.phase45APreview,
      reportGcsUri: env.phase45AReport,
      reportPassed: reportHasNoBlockers(phase45AReport),
    },
    phase45B: {
      runId: env.phase45BRunId,
      previewGcsUri: env.phase45BPreview,
      reportGcsUri: env.phase45BReport,
      reportPassed: reportHasNoBlockers(phase45BReport),
    },
    phase45C: {
      runId: env.phase45CRunId,
      otioGcsUri: env.phase45COtio,
      reportGcsUri: env.phase45CReport,
      reportPassed: reportHasNoBlockers(phase45CReport),
      phase45DReady: phase45CReadiness.readyForFfmpegFfprobeFinalRenderHardening === true,
      otioSchemaValid: phase45COtio.OTIO_SCHEMA === 'Timeline.1',
    },
  }
}

function buildFfmpegArgs(env: RuntimeEnv, inputPath: string, outputPath: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    inputPath,
    '-t',
    String(env.exportDurationSeconds),
    '-map',
    '0:v:0',
    '-map',
    '0:a:0?',
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-level',
    '4.0',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  ]
}

async function buildExportValidation(inputProbe: Record<string, unknown>, outputProbe: Record<string, unknown>, outputPath: string, outputSizeBytes: number, outputSha256: string, ffmpegArgs: string[]) {
  const video = stream(outputProbe, 'video')
  const audio = stream(outputProbe, 'audio')
  const unexpectedStreams = streams(outputProbe)
    .filter((item) => item.codec_type !== 'video' && item.codec_type !== 'audio')
    .map((item) => String(item.codec_type ?? 'unknown'))
  const format = isRecord(outputProbe.format) ? outputProbe.format : {}
  return {
    ffmpegInvoked: true,
    ffmpegCommandSummary: `ffmpeg ${ffmpegArgs.map((part) => part.includes(os.tmpdir()) ? '[worker-temp-path]' : part).join(' ')}`,
    inputPreviewHadAudio: hasAudioStream(inputProbe),
    durationSeconds: durationSeconds(outputProbe),
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    videoCodec: String(video?.codec_name ?? ''),
    audioCodec: audio ? String(audio.codec_name ?? '') : undefined,
    audioStreamPresent: Boolean(audio),
    videoStreamPresent: Boolean(video),
    container: String(format.format_name ?? ''),
    bitRate: typeof format.bit_rate === 'string' ? Number(format.bit_rate) : undefined,
    faststart: await hasFaststartMoovBeforeMdat(outputPath),
    unexpectedStreams,
    sizeBytes: outputSizeBytes,
    sha256: outputSha256,
    privateReviewOnly: true,
    finalDeliveryCreated: false,
  }
}

function buildQa(input: {
  sourceValidation: ReturnType<typeof buildSourceValidation>
  evidenceValidation: ReturnType<typeof buildEvidenceValidation>
  ffprobeValidation: Awaited<ReturnType<typeof buildExportValidation>>
  exportArtifact?: ArtifactRecord
}) {
  const gate = (gateId: string, passed: boolean, summary: string) => ({ gateId, passed, severity: 'mandatory' as const, summary })
  const outputHasExpectedAudio = input.ffprobeValidation.inputPreviewHadAudio
    ? input.ffprobeValidation.audioStreamPresent && input.ffprobeValidation.audioCodec === config.expectedAudioCodec
    : !input.ffprobeValidation.audioStreamPresent
  const gates = [
    gate('source_integrity', input.sourceValidation.inputVideoGcsUri === config.sourceVideo && input.sourceValidation.sourceVideoStreamPresent, 'Approved Phase 32 source exists and is decodable.'),
    gate('phase45a_evidence', input.evidenceValidation.phase45A.reportPassed, 'Approved Phase 45A report has no blockers.'),
    gate('phase45b_evidence', input.evidenceValidation.phase45B.reportPassed && input.sourceValidation.phase45BPreviewVideoStreamPresent, 'Approved Phase 45B preview/report have no blockers and decode.'),
    gate('phase45c_evidence', input.evidenceValidation.phase45C.reportPassed && input.evidenceValidation.phase45C.phase45DReady && input.evidenceValidation.phase45C.otioSchemaValid, 'Approved Phase 45C OTIO/report are valid and mark Phase45D ready.'),
    gate('ffmpeg_export_invoked', input.ffprobeValidation.ffmpegInvoked, 'FFmpeg export command was invoked.'),
    gate('ffprobe_export_validation', input.ffprobeValidation.videoStreamPresent, 'FFprobe validates the hardened private review export.'),
    gate('codec_container_integrity', input.ffprobeValidation.videoCodec === config.expectedVideoCodec && input.ffprobeValidation.container === config.expectedContainer && input.ffprobeValidation.faststart && input.ffprobeValidation.unexpectedStreams.length === 0, 'Export uses the approved H.264 MP4 container shape with faststart and no unexpected streams.'),
    gate('duration_bounds', input.ffprobeValidation.durationSeconds <= config.maxExportDurationSeconds + 0.25, 'Export duration remains bounded.'),
    gate('audio_video_integrity', input.ffprobeValidation.videoStreamPresent && outputHasExpectedAudio && input.ffprobeValidation.width > 0 && input.ffprobeValidation.height > 0 && input.ffprobeValidation.width <= config.maxWidth && input.ffprobeValidation.height <= config.maxHeight, 'Video dimensions stay bounded and audio is preserved when present.'),
    gate('private_artifacts', Boolean(input.exportArtifact?.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/')), 'Export artifact is written only under the private Phase 45D final-exports prefix.'),
    gate('no_public_access', true, 'No public or signed URL was created.'),
    gate('no_final_delivery', true, 'The artifact is a private review export only, not a user final delivery.'),
    gate('blocked_features', true, 'Production, beta, paid production, broad media, providers, Revideo, and Track B stay blocked.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' as const : 'passed' as const,
    gates,
    blockers,
    warnings: [
      'Phase 45D creates one bounded private hardened review export only.',
      'Final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.',
    ],
  }
}

function reportHasNoBlockers(report: Record<string, unknown>): boolean {
  const qa = isRecord(report.qa) ? report.qa : {}
  const blockers = Array.isArray(qa.blockers) ? qa.blockers : []
  return report.ok === true && qa.status === 'passed' && blockers.length === 0
}

async function downloadGcs(uri: string, destination: string): Promise<void> {
  const { bucket, object } = parseGcsUri(uri)
  await storage.bucket(bucket).file(object).download({ destination })
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, kind: string): Promise<ArtifactRecord> {
  const filePath = path.join(root, `${kind}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return uploadFile(bucket, object, filePath, kind)
}

async function uploadFile(bucket: string, object: string, filePath: string, kind: string): Promise<ArtifactRecord> {
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await storage.bucket(bucket).upload(filePath, { destination: object, resumable: false })
  return {
    id: path.basename(object).replace(/[^a-zA-Z0-9_-]/g, '_'),
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

async function runAndCapture(command: string, args: string[], timeout = 120_000): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, { timeout, maxBuffer: 128 * 1024 * 1024 })
  return `${stdout}${stderr}`
}

async function hasFaststartMoovBeforeMdat(filePath: string): Promise<boolean> {
  const buffer = await readFile(filePath)
  const head = buffer.subarray(0, Math.min(buffer.length, 2 * 1024 * 1024)).toString('latin1')
  const moov = head.indexOf('moov')
  const mdat = head.indexOf('mdat')
  return moov >= 0 && (mdat < 0 || moov < mdat)
}

function parseGcsUri(uri: string): { bucket: string; object: string } {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}

function streams(probe: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(probe.streams) ? probe.streams.filter(isRecord) : []
}

function stream(probe: Record<string, unknown>, type: 'video' | 'audio'): Record<string, unknown> | undefined {
  return streams(probe).find((item) => item.codec_type === type)
}

function hasVideoStream(probe: Record<string, unknown>): boolean {
  return Boolean(stream(probe, 'video'))
}

function hasAudioStream(probe: Record<string, unknown>): boolean {
  return Boolean(stream(probe, 'audio'))
}

function durationSeconds(probe: Record<string, unknown>): number {
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
