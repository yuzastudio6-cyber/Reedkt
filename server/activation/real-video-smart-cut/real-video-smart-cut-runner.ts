import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { loadPhase28Artifacts, normalizePhase28Artifacts } from './real-video-smart-cut-artifact-loader'
import { buildRealVideoSmartCutTimeline } from './real-video-caption-timeline-builder'
import { realVideoSmartCutConfig, phase29Prefix, validateRealVideoSmartCutEnv } from './real-video-smart-cut-policy'
import { resolvePhase29PreviewStatus } from './real-video-smart-cut-preview-runner'
import { buildPhase29QaSummary } from './real-video-smart-cut-qa-summary'
import type { RealVideoSmartCutArtifact, RealVideoSmartCutRuntimeReport } from './real-video-smart-cut-types'

const execFileAsync = promisify(execFile)

export const REAL_VIDEO_SMART_CUT_LOG_ROOT = 'activation-logs/real-video-smart-cut/phase29'
export const REAL_VIDEO_SMART_CUT_LOCAL_REPORT_PATH = `${REAL_VIDEO_SMART_CUT_LOG_ROOT}/phase29-report.json`
export const REAL_VIDEO_SMART_CUT_LATEST_RUN_PATH = `${REAL_VIDEO_SMART_CUT_LOG_ROOT}/latest-run.json`

export async function executeRealVideoSmartCut(): Promise<RealVideoSmartCutRuntimeReport> {
  const envBlockers = validateRealVideoSmartCutEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_SMART_CUT,
  })
  if (envBlockers.length > 0) throw new Error(envBlockers.join(' '))

  const runId = `phase29-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const runPrefix = phase29Prefix(runId)
  const runRoot = path.join(REAL_VIDEO_SMART_CUT_LOG_ROOT, runId)
  const artifactRoot = path.join(runRoot, 'artifacts')
  const phase28DownloadRoot = path.join(runRoot, 'phase28-artifacts')
  await rm(runRoot, { recursive: true, force: true })
  await mkdir(artifactRoot, { recursive: true })

  const loaded = await loadPhase28Artifacts({ workDir: phase28DownloadRoot })
  const normalized = normalizePhase28Artifacts(loaded)
  if (normalized.sourceGcsUri !== realVideoSmartCutConfig.sourceGcsUri) {
    throw new Error('Phase 29 source object does not match the approved Phase 28 source.')
  }

  const preview = resolvePhase29PreviewStatus()
  const build = await buildRealVideoSmartCutTimeline(normalized)
  const qa = buildPhase29QaSummary({
    normalized,
    qaResults: build.qaResults,
    previewSkippedReason: preview.reason,
  })
  const artifacts: RealVideoSmartCutArtifact[] = []

  artifacts.push(await uploadJsonArtifact({
    payload: build.smartCutPlan,
    localPath: path.join(artifactRoot, 'smart-cut-plan.json'),
    bucket: realVideoSmartCutConfig.analysisBucket,
    objectName: `${runPrefix}/smart-cut/smart-cut-plan.json`,
    kind: 'application/json',
  }))
  artifacts.push(await uploadJsonArtifact({
    payload: build.timelineManifest,
    localPath: path.join(artifactRoot, 'timeline-manifest.json'),
    bucket: realVideoSmartCutConfig.analysisBucket,
    objectName: `${runPrefix}/timeline/timeline-manifest.json`,
    kind: 'application/json',
  }))
  artifacts.push(await uploadJsonArtifact({
    payload: build.otioManifest,
    localPath: path.join(artifactRoot, 'opentimelineio-style.json'),
    bucket: realVideoSmartCutConfig.analysisBucket,
    objectName: `${runPrefix}/timeline/opentimelineio-style.json`,
    kind: 'application/json',
  }))
  artifacts.push(await uploadJsonArtifact({
    payload: build.hyperframeBridge,
    localPath: path.join(artifactRoot, 'hyperframe-bridge.json'),
    bucket: realVideoSmartCutConfig.analysisBucket,
    objectName: `${runPrefix}/timeline/hyperframe-bridge.json`,
    kind: 'application/json',
  }))
  artifacts.push(await uploadJsonArtifact({
    payload: build.remotionManifest,
    localPath: path.join(artifactRoot, 'remotion-composition-manifest.json'),
    bucket: realVideoSmartCutConfig.analysisBucket,
    objectName: `${runPrefix}/timeline/remotion-composition-manifest.json`,
    kind: 'application/json',
  }))
  artifacts.push(await uploadJsonArtifact({
    payload: qa,
    localPath: path.join(artifactRoot, 'smart-cut-caption-qa.json'),
    bucket: realVideoSmartCutConfig.qaBucket,
    objectName: `${runPrefix}/qa/smart-cut-caption-qa.json`,
    kind: 'application/json',
  }))

  const reportObject = `${runPrefix}/reports/phase29-report.json`
  const report: RealVideoSmartCutRuntimeReport = {
    ok: qa.status !== 'blocked',
    runId,
    sourcePhase28RunId: realVideoSmartCutConfig.phase28RunId,
    sourceVideoObject: normalized.sourceGcsUri,
    sourceDurationSeconds: normalized.sourceDurationSeconds,
    transcriptSegmentCount: normalized.transcriptSegments.length,
    wordTimestampCount: normalized.wordTimestamps.length,
    captionSegmentCount: normalized.captionSegments.length,
    smartCut: {
      intent: build.smartCutPlan.intent,
      aggressiveness: build.smartCutPlan.aggressiveness,
      keepSegmentCount: build.smartCutPlan.keepSegments.length,
      removeSegmentCount: build.smartCutPlan.removeSegments.length,
      protectedSegmentCount: build.smartCutPlan.protectedSegments.length,
      targetDurationSeconds: build.executionPlan.targetDurationSeconds,
      previewStatus: preview.status,
      previewReason: preview.reason,
    },
    timeline: {
      durationSeconds: build.timelineManifest.durationSeconds,
      clipCount: build.timelineManifest.clips.length,
      captionLayerCount: build.timelineManifest.captionLayers.length,
    },
    artifacts,
    qa,
    safety: {
      controlledPhase28SourceOnly: true,
      secondSourceVideoUsed: false,
      providerExecuted: false,
      gpuUsed: false,
      modelDownloadedExternally: false,
      secretValuesUsed: false,
      publicAccessEnabled: false,
      finalExportCreated: false,
      audioCleanupExecuted: false,
      colorExecuted: false,
      masksOrEnhancementExecuted: false,
    },
    uploadedReport: {
      bucket: realVideoSmartCutConfig.qaBucket,
      object: reportObject,
      gcsUri: `gs://${realVideoSmartCutConfig.qaBucket}/${reportObject}`,
    },
    warnings: qa.warnings,
  }

  const reportArtifact = await uploadJsonArtifact({
    payload: report,
    localPath: path.join(artifactRoot, 'phase29-report.json'),
    bucket: realVideoSmartCutConfig.qaBucket,
    objectName: reportObject,
    kind: 'application/json',
  })
  report.artifacts.push(reportArtifact)
  await writeFile(REAL_VIDEO_SMART_CUT_LOCAL_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(REAL_VIDEO_SMART_CUT_LATEST_RUN_PATH, `${JSON.stringify({ runId, reportGcsUri: report.uploadedReport.gcsUri }, null, 2)}\n`, 'utf8')
  await uploadJsonArtifact({
    payload: report,
    localPath: path.join(artifactRoot, 'phase29-report-final.json'),
    bucket: realVideoSmartCutConfig.qaBucket,
    objectName: reportObject,
    kind: 'application/json',
  })
  return report
}

async function uploadJsonArtifact(input: {
  payload: unknown
  localPath: string
  bucket: string
  objectName: string
  kind: string
}): Promise<RealVideoSmartCutArtifact> {
  await mkdir(path.dirname(input.localPath), { recursive: true })
  const body = Buffer.from(`${JSON.stringify(input.payload, null, 2)}\n`)
  await writeFile(input.localPath, body)
  const sha256 = createHash('sha256').update(body).digest('hex')
  const gcsUri = `gs://${input.bucket}/${input.objectName}`
  await execFileAsync('gcloud', ['storage', 'cp', input.localPath, gcsUri], {
    timeout: 2 * 60_000,
    maxBuffer: 8 * 1024 * 1024,
  })
  await execFileAsync('gcloud', ['storage', 'objects', 'describe', gcsUri, '--format=json'], {
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
  })
  const bytes = await readFile(input.localPath)
  return {
    id: input.objectName.replaceAll('/', '-'),
    kind: input.kind,
    bucket: input.bucket,
    object: input.objectName,
    gcsUri,
    sizeBytes: bytes.length,
    sha256,
  }
}
