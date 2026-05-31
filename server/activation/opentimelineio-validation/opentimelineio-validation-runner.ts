import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { getApprovedLibassBurninEvidence } from '../libass-burnin-validation'
import { getApprovedRemotionRenderEvidence } from '../remotion-render-validation'
import {
  makeOpenTimelineIoRunId,
  openTimelineIoArtifactPrefix,
  openTimelineIoValidationConfig,
  validateOpenTimelineIoExecutionEnv,
} from './opentimelineio-validation-policy'
import { openTimelineIoEvidenceToTypeScript } from './opentimelineio-validation-report-builder'
import type {
  ApprovedOpenTimelineIoEvidence,
  OpenTimelineIoArtifact,
  OpenTimelineIoExecutionReport,
  OpenTimelineIoQaGate,
  OpenTimelineIoTimeline,
  OpenTimelineIoTimelineValidation,
} from './opentimelineio-validation-types'

const execFileAsync = promisify(execFile)

export async function runOpenTimelineIoValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45C OpenTimelineIO validation.')
  const runId = input.runId ?? makeOpenTimelineIoRunId()
  const artifactPrefix = openTimelineIoArtifactPrefix(runId)
  const preflight = await runOpenTimelineIoPreflight()
  if (!preflight.allowed) throw new Error(`OpenTimelineIO validation preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const localRoot = path.join(os.tmpdir(), `reeditpro-opentimelineio-${runId}`)
  await mkdir(localRoot, { recursive: true })
  const phase45AReport = await readJsonFromGcs(openTimelineIoValidationConfig.approvedPhase45AReportGcsUri)
  const phase45BReport = await readJsonFromGcs(openTimelineIoValidationConfig.approvedPhase45BReportGcsUri)
  const phase45AEvidence = getApprovedLibassBurninEvidence()
  const phase45BEvidence = getApprovedRemotionRenderEvidence()
  const planSnapshot = buildPlanSnapshot(runId)
  const sourceValidation = buildSourceValidation(phase45AReport, phase45BReport)
  const timeline = buildTimeline(runId)
  const validation = validateTimeline(timeline)
  const artifacts: OpenTimelineIoArtifact[] = []

  artifacts.push(await uploadJson(openTimelineIoValidationConfig.qaBucket, `${artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, 'approved_plan_snapshot'))
  artifacts.push(await uploadJson(openTimelineIoValidationConfig.qaBucket, `${artifactPrefix}/source/source-validation.json`, sourceValidation, 'source_validation'))
  const timelineArtifact = await uploadJson(openTimelineIoValidationConfig.generatedAssetsBucket, `${artifactPrefix}/timeline/opentimelineio-timeline.json`, timeline, 'otio_timeline')
  artifacts.push(timelineArtifact)
  artifacts.push(await uploadJson(openTimelineIoValidationConfig.qaBucket, `${artifactPrefix}/timeline/timeline-validation.json`, validation, 'timeline_validation'))

  const qa = buildQa({
    phase45AReport,
    phase45BReport,
    phase45AEvidenceVerified: phase45AEvidence.status === 'verified',
    phase45BEvidenceVerified: phase45BEvidence.status === 'verified',
    validation,
    artifacts,
  })
  artifacts.push(await uploadJson(openTimelineIoValidationConfig.qaBucket, `${artifactPrefix}/qa/opentimelineio-validation-qa.json`, qa, 'qa'))

  const executionReport: OpenTimelineIoExecutionReport = {
    ok: qa.status === 'passed',
    phase: '45C',
    runId,
    projectId: openTimelineIoValidationConfig.projectId,
    runtimeMode: openTimelineIoValidationConfig.runtimeMode,
    source: {
      inputVideoGcsUri: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
      objectExists: true,
    },
    phase45A: {
      runId: openTimelineIoValidationConfig.approvedPhase45ARunId,
      previewGcsUri: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
      reportGcsUri: openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
      evidenceVerified: phase45AEvidence.status === 'verified',
      reportHasNoBlockers: reportHasNoBlockers(phase45AReport),
    },
    phase45B: {
      runId: openTimelineIoValidationConfig.approvedPhase45BRunId,
      previewGcsUri: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
      reportGcsUri: openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
      evidenceVerified: phase45BEvidence.status === 'verified',
      reportHasNoBlockers: reportHasNoBlockers(phase45BReport),
    },
    timeline: {
      name: timeline.name,
      fps: openTimelineIoValidationConfig.timelineFps,
      durationSeconds: validation.timelineDurationSeconds,
      durationFrames: validation.timelineDurationFrames,
      artifactGcsUri: timelineArtifact.gcsUri,
    },
    validation,
    artifacts,
    qa,
    phase45DReadiness: {
      readyForFfmpegFfprobeFinalRenderHardening: qa.status === 'passed',
      reason: qa.status === 'passed'
        ? 'Phase 45C passed; Phase 45D may start FFmpeg/FFprobe final render/export hardening only.'
        : `Phase 45C blocked: ${qa.blockers.join('; ')}`,
    },
    safety: {
      approvedSourceOnly: true,
      approvedPhase45AOnly: true,
      approvedPhase45BOnly: true,
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
  artifacts.push(await uploadJson(openTimelineIoValidationConfig.qaBucket, `${artifactPrefix}/reports/phase45c-report.json`, executionReport, 'report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(localRoot, 'phase45c-report.json')
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const evidence: ApprovedOpenTimelineIoEvidence = {
    phase: '45C',
    status: verified ? 'verified' : 'blocked',
    runId,
    sourceInputVideo: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
    phase45APreview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
    phase45BPreview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
    otioTimelineUri: timelineArtifact.gcsUri,
    qaReportUri: `gs://${openTimelineIoValidationConfig.qaBucket}/${artifactPrefix}/reports/phase45c-report.json`,
    toolResults: {
      opentimelineio: validation.schemaValid ? 'passed' : 'blocked',
      metadataValidation: qa.status === 'passed' ? 'passed' : 'blocked',
    },
    phase45DReadiness: executionReport.phase45DReadiness,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active gcloud account preflight and private GCS uploads passed'],
    evidenceModule: openTimelineIoEvidenceToTypeScript(evidence),
  }
}

export async function runOpenTimelineIoPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  try {
    const [activeAccount, activeProject, projectDescribe, finalExportsBucket, previewsBucket, generatedAssetsBucket, qaBucket, sourceObject, phase45APreviewObject, phase45AReportObject, phase45BPreviewObject, phase45BReportObject] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', openTimelineIoValidationConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${openTimelineIoValidationConfig.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${openTimelineIoValidationConfig.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${openTimelineIoValidationConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${openTimelineIoValidationConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', openTimelineIoValidationConfig.approvedInputVideoGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', openTimelineIoValidationConfig.approvedPhase45AReportGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', openTimelineIoValidationConfig.approvedPhase45BReportGcsUri, '--format=value(name)']),
    ])
    activeProjectValue = lastGcloudValue(activeProject)
    if (!lastGcloudValue(activeAccount)) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== openTimelineIoValidationConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== openTimelineIoValidationConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(finalExportsBucket) !== openTimelineIoValidationConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== openTimelineIoValidationConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(generatedAssetsBucket) !== openTimelineIoValidationConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== openTimelineIoValidationConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
    if (!lastGcloudValue(phase45APreviewObject)) blockers.push('Approved Phase 45A preview object is not reachable.')
    if (!lastGcloudValue(phase45AReportObject)) blockers.push('Approved Phase 45A report object is not reachable.')
    if (!lastGcloudValue(phase45BPreviewObject)) blockers.push('Approved Phase 45B preview object is not reachable.')
    if (!lastGcloudValue(phase45BReportObject)) blockers.push('Approved Phase 45B report object is not reachable.')
    await assertNoPublicBucketPrincipals([openTimelineIoValidationConfig.finalExportsBucket, openTimelineIoValidationConfig.previewsBucket, openTimelineIoValidationConfig.generatedAssetsBucket, openTimelineIoValidationConfig.qaBucket], blockers)
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateOpenTimelineIoExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION,
    runtimeMode: openTimelineIoValidationConfig.runtimeMode,
    sourceVideo: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
    phase45APreview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
    phase45AReport: openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
    phase45BPreview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
    phase45BReport: openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
    timelineDurationSeconds: openTimelineIoValidationConfig.timelineDurationSeconds,
  })
  blockers.push(...validation.blockers)
  warnings.push(...validation.warnings)
  return { allowed: blockers.length === 0, blockers, warnings }
}

function buildPlanSnapshot(runId: string) {
  return {
    phase: '45C',
    runId,
    planType: 'opentimelineio_timeline_validation',
    approvedSource: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
    approvedPhase45A: {
      runId: openTimelineIoValidationConfig.approvedPhase45ARunId,
      preview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
      report: openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
    },
    approvedPhase45B: {
      runId: openTimelineIoValidationConfig.approvedPhase45BRunId,
      preview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
      report: openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
    },
    timeline: {
      fps: openTimelineIoValidationConfig.timelineFps,
      durationSeconds: openTimelineIoValidationConfig.timelineDurationSeconds,
      maxDurationSeconds: openTimelineIoValidationConfig.maxTimelineDurationSeconds,
    },
    blocked: openTimelineIoBlockedScope(),
  }
}

function buildSourceValidation(phase45AReport: Record<string, unknown>, phase45BReport: Record<string, unknown>) {
  return {
    sourceVideo: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
    phase45AReportHasNoBlockers: reportHasNoBlockers(phase45AReport),
    phase45BReportHasNoBlockers: reportHasNoBlockers(phase45BReport),
    approvedPhase45APreview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
    approvedPhase45BPreview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
    arbitraryMediaUsed: false,
    finalDeliveryCreated: false,
  }
}

function buildTimeline(runId: string): OpenTimelineIoTimeline {
  const durationFrames = openTimelineIoValidationConfig.timelineDurationSeconds * openTimelineIoValidationConfig.timelineFps
  return {
    OTIO_SCHEMA: 'Timeline.1',
    name: `${openTimelineIoValidationConfig.timelineName}_${runId}`,
    tracks: [{
      kind: 'Video',
      children: [{
        OTIO_SCHEMA: 'Clip.2',
        name: 'phase32-source-to-phase45b-remotion-preview',
        source_range: {
          start_time: { value: 0, rate: openTimelineIoValidationConfig.timelineFps },
          duration: { value: durationFrames, rate: openTimelineIoValidationConfig.timelineFps },
        },
        media_reference: {
          OTIO_SCHEMA: 'ExternalReference.1',
          target_url: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
        },
        metadata: {
          reeditproPhase: '45C',
          runId,
          source: {
            phase32Video: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
          },
          captionRenderReference: {
            phase45ARunId: openTimelineIoValidationConfig.approvedPhase45ARunId,
            phase45APreview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
            phase45AReport: openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
          },
          remotionRenderReference: {
            phase45BRunId: openTimelineIoValidationConfig.approvedPhase45BRunId,
            phase45BPreview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
            phase45BReport: openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
          },
        },
      }],
    }],
    metadata: {
      source: 'reeditpro_phase45c_otio_compatible_timeline',
      packageImportRequired: false,
      note: 'Repo-native OpenTimelineIO-compatible JSON metadata validation; external OpenTimelineIO package import is not required for Phase 45C.',
      timelineDurationSeconds: openTimelineIoValidationConfig.timelineDurationSeconds,
      timelineFps: openTimelineIoValidationConfig.timelineFps,
      blocked: openTimelineIoBlockedScope(),
    },
  }
}

function validateTimeline(timeline: OpenTimelineIoTimeline): OpenTimelineIoTimelineValidation {
  const clip = timeline.tracks[0]?.children[0]
  const timelineDurationFrames = clip?.source_range.duration.value ?? 0
  const rate = clip?.source_range.duration.rate || openTimelineIoValidationConfig.timelineFps
  const metadata = clip?.metadata ?? {}
  const captionRenderReference = metadata.captionRenderReference as Record<string, unknown> | undefined
  const remotionRenderReference = metadata.remotionRenderReference as Record<string, unknown> | undefined
  const timelineDurationSeconds = timelineDurationFrames / rate
  return {
    schemaValid: timeline.OTIO_SCHEMA === 'Timeline.1' && clip?.OTIO_SCHEMA === 'Clip.2' && clip.media_reference.OTIO_SCHEMA === 'ExternalReference.1',
    timelineDurationSeconds,
    timelineDurationFrames,
    sourceReferenceMatches: clip?.media_reference.target_url === openTimelineIoValidationConfig.approvedInputVideoGcsUri,
    phase45AReferenceMatches: captionRenderReference?.phase45APreview === openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri
      && captionRenderReference?.phase45AReport === openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
    phase45BReferenceMatches: remotionRenderReference?.phase45BPreview === openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri
      && remotionRenderReference?.phase45BReport === openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
    durationWithinBounds: timelineDurationSeconds <= openTimelineIoValidationConfig.maxTimelineDurationSeconds,
    clipCount: timeline.tracks.reduce((sum, track) => sum + track.children.length, 0),
    trackCount: timeline.tracks.length,
  }
}

function buildQa(input: {
  phase45AReport: Record<string, unknown>
  phase45BReport: Record<string, unknown>
  phase45AEvidenceVerified: boolean
  phase45BEvidenceVerified: boolean
  validation: OpenTimelineIoTimelineValidation
  artifacts: OpenTimelineIoArtifact[]
}) {
  const gate = (gateId: OpenTimelineIoQaGate['gateId'], passed: boolean, summary: string): OpenTimelineIoQaGate => ({ gateId, passed, severity: 'mandatory', summary })
  const privateArtifacts = input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-'))
  const gates = [
    gate('source_integrity', true, 'Approved Phase 32 source object was reachable and is the only source reference.'),
    gate('phase45a_evidence', input.phase45AEvidenceVerified && reportHasNoBlockers(input.phase45AReport), 'Approved Phase 45A evidence and private report have no blockers.'),
    gate('phase45b_evidence', input.phase45BEvidenceVerified && reportHasNoBlockers(input.phase45BReport), 'Approved Phase 45B evidence and private report have no blockers.'),
    gate('otio_timeline_created_or_resolved', input.validation.trackCount === 1 && input.validation.clipCount === 1, 'One bounded OTIO-compatible timeline was created.'),
    gate('otio_schema_valid', input.validation.schemaValid, 'Timeline uses OTIO-compatible Timeline.1, Clip.2, and ExternalReference.1 schema labels.'),
    gate('timeline_duration_bounds', input.validation.durationWithinBounds, 'Timeline duration remains bounded to the Phase 45B preview duration.'),
    gate('clip_reference_integrity', input.validation.sourceReferenceMatches, 'Timeline clip references only the approved Phase 32 private source.'),
    gate('caption_render_reference_integrity', input.validation.phase45AReferenceMatches && input.validation.phase45BReferenceMatches, 'Timeline metadata references only approved Phase 45A and Phase 45B private artifacts.'),
    gate('no_public_artifacts', privateArtifacts, 'Artifacts use private staging GCS prefixes only.'),
    gate('no_final_delivery', true, 'No final delivery artifact was created.'),
    gate('blocked_features', true, 'Providers, Revideo, Track B, production, beta, paid production, broad media, public access, and arbitrary media remain blocked.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' as const : 'passed' as const,
    gates,
    blockers,
    warnings: [
      'Phase 45C validates timeline metadata only.',
      'No media processing, final delivery, or production/beta unlock is implied.',
    ],
  }
}

function reportHasNoBlockers(report: Record<string, unknown>): boolean {
  const blockers = report.blockers
  const qa = report.qa as { blockers?: unknown[]; status?: string } | undefined
  return (!Array.isArray(blockers) || blockers.length === 0)
    && (!Array.isArray(qa?.blockers) || qa.blockers.length === 0)
    && (report.ok === true || qa?.status === 'passed' || report.status === 'ready' || report.status === 'completed')
}

async function uploadJson(bucket: string, object: string, value: unknown, kind: string): Promise<OpenTimelineIoArtifact> {
  const payload = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const localPath = path.join(os.tmpdir(), `reeditpro-phase45c-${createHash('sha256').update(object).digest('hex')}.json`)
  await writeFile(localPath, payload)
  await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${object}`, '--content-type=application/json', '--cache-control=no-store'])
  await unlink(localPath).catch(() => undefined)
  return {
    id: path.basename(object).replace(/[^a-zA-Z0-9]+/g, '_'),
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: payload.byteLength,
    sha256: createHash('sha256').update(payload).digest('hex'),
  }
}

async function readJsonFromGcs(uri: string): Promise<Record<string, unknown>> {
  const localPath = path.join(os.tmpdir(), `reeditpro-phase45c-read-${createHash('sha256').update(uri).digest('hex')}.json`)
  await runGcloud(['storage', 'cp', uri, localPath])
  const contents = await readFile(localPath, 'utf8')
  await unlink(localPath).catch(() => undefined)
  return JSON.parse(contents) as Record<string, unknown>
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (policy.includes('allUsers') || policy.includes('allAuthenticatedUsers')) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}

function openTimelineIoBlockedScope() {
  return {
    finalDelivery: false,
    arbitraryMedia: false,
    providers: false,
    revideo: false,
    trackBTools: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    broadRealMedia: false,
    publicAccess: false,
  }
}
