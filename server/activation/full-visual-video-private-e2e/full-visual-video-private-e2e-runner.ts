import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  fullVisualVideoPrivateE2eArtifactPrefix,
  fullVisualVideoPrivateE2eConfig,
  makeFullVisualVideoPrivateE2eRunId,
  validateFullVisualVideoPrivateE2eExecutionEnv,
} from './full-visual-video-private-e2e-policy'
import { fullVisualVideoPrivateE2eEvidenceToTypeScript } from './full-visual-video-private-e2e-report-builder'
import type {
  ApprovedFullVisualVideoPrivateE2eEvidence,
  FullVisualVideoPrivateE2eArtifact,
  FullVisualVideoPrivateE2eExecutionReport,
  FullVisualVideoPrivateE2eQaGate,
  FullVisualVideoPrivateE2eQaSummary,
} from './full-visual-video-private-e2e-types'

const execFileAsync = promisify(execFile)

interface GcsObjectMetadata {
  name?: string
  bucket?: string
  size?: string | number
}

export async function runFullVisualVideoPrivateE2e(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45E full visual-video private E2E.')
  const runId = input.runId ?? makeFullVisualVideoPrivateE2eRunId()
  const artifactPrefix = fullVisualVideoPrivateE2eArtifactPrefix(runId)
  const preflight = await runFullVisualVideoPrivateE2ePreflight()
  if (!preflight.allowed) throw new Error(`Full visual-video private E2E preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const localRoot = path.join(os.tmpdir(), `reeditpro-full-visual-video-private-e2e-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  const config = fullVisualVideoPrivateE2eConfig
    const [sourceMetadata, phase45APreviewMetadata, phase45BPreviewMetadata, phase45COtioMetadata, phase45DReviewExportMetadata] = await Promise.all([
      describeGcsObject(config.approvedInputVideoGcsUri),
      describeGcsObject(config.approvedPhase45APreviewGcsUri),
      describeGcsObject(config.approvedPhase45BPreviewGcsUri),
      describeGcsObject(config.approvedPhase45COtioGcsUri),
      describeGcsObject(config.approvedPhase45DReviewExportGcsUri),
    ])

    const [phase45AReport, phase45BReport, phase45COtio, phase45CReport, phase45DFfprobeValidation, phase45DReport] = await Promise.all([
      readJsonFromGcs(config.approvedPhase45AReportGcsUri, localRoot, 'phase45a-report'),
      readJsonFromGcs(config.approvedPhase45BReportGcsUri, localRoot, 'phase45b-report'),
      readJsonFromGcs(config.approvedPhase45COtioGcsUri, localRoot, 'phase45c-otio'),
      readJsonFromGcs(config.approvedPhase45CReportGcsUri, localRoot, 'phase45c-report'),
      readJsonFromGcs(config.approvedPhase45DFfprobeValidationGcsUri, localRoot, 'phase45d-ffprobe-validation'),
      readJsonFromGcs(config.approvedPhase45DReportGcsUri, localRoot, 'phase45d-report'),
    ])

    const reviewExportPath = path.join(localRoot, 'phase45d-hardened-review-export.mp4')
    await downloadGcs(config.approvedPhase45DReviewExportGcsUri, reviewExportPath)
    const reviewProbe = await ffprobe(reviewExportPath)
    const reviewStats = await stat(reviewExportPath)
    const reviewSha256 = await sha256File(reviewExportPath)
    const reviewValidation = await buildReviewExportValidation(reviewProbe, reviewExportPath, reviewStats.size, reviewSha256)

    const planSnapshot = buildPlanSnapshot(runId)
    const sourceValidation = buildSourceValidation(sourceMetadata, phase45APreviewMetadata, phase45BPreviewMetadata, phase45COtioMetadata, phase45DReviewExportMetadata)
    const evidenceValidation = buildEvidenceValidation(phase45AReport, phase45BReport, phase45COtio, phase45CReport, phase45DFfprobeValidation, phase45DReport)
    const reviewManifest = buildReviewManifest(runId, reviewValidation, evidenceValidation)
    const artifacts: FullVisualVideoPrivateE2eArtifact[] = []

    artifacts.push(await uploadJson(config.generatedAssetsBucket, `${artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, localRoot, 'approved_plan_snapshot'))
    artifacts.push(await uploadJson(config.generatedAssetsBucket, `${artifactPrefix}/source/source-validation.json`, sourceValidation, localRoot, 'source_validation'))
    artifacts.push(await uploadJson(config.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-validation.json`, evidenceValidation, localRoot, 'evidence_validation'))
    const manifestArtifact = await uploadJson(config.generatedAssetsBucket, `${artifactPrefix}/review/e2e-review-manifest.json`, reviewManifest, localRoot, 'e2e_review_manifest')
    artifacts.push(manifestArtifact)
    artifacts.push(await uploadJson(config.generatedAssetsBucket, `${artifactPrefix}/review/ffprobe-review-export-validation.json`, reviewValidation, localRoot, 'ffprobe_review_export_validation'))

    const qa = buildQa({
      sourceValidation,
      evidenceValidation,
      reviewValidation,
      manifestArtifact,
      artifacts,
      publicAccessBlocked: preflight.publicAccessBlocked,
    })
    artifacts.push(await uploadJson(config.qaBucket, `${artifactPrefix}/qa/full-visual-video-private-e2e-qa.json`, qa, localRoot, 'qa'))

    const executionReport: FullVisualVideoPrivateE2eExecutionReport = {
      ok: qa.status === 'passed',
      phase: '45E',
      runId,
      projectId: config.projectId,
      runtimeMode: config.runtimeMode,
      source: {
        inputVideoGcsUri: config.approvedInputVideoGcsUri,
        objectExists: Boolean(sourceMetadata.name),
        sizeBytes: sizeBytes(sourceMetadata),
      },
      evidence: {
        phase45A: {
          runId: config.approvedPhase45ARunId,
          previewGcsUri: config.approvedPhase45APreviewGcsUri,
          reportGcsUri: config.approvedPhase45AReportGcsUri,
          reportPassed: evidenceValidation.phase45A.reportPassed,
        },
        phase45B: {
          runId: config.approvedPhase45BRunId,
          previewGcsUri: config.approvedPhase45BPreviewGcsUri,
          reportGcsUri: config.approvedPhase45BReportGcsUri,
          reportPassed: evidenceValidation.phase45B.reportPassed,
        },
        phase45C: {
          runId: config.approvedPhase45CRunId,
          otioGcsUri: config.approvedPhase45COtioGcsUri,
          reportGcsUri: config.approvedPhase45CReportGcsUri,
          reportPassed: evidenceValidation.phase45C.reportPassed,
          otioSchemaValid: evidenceValidation.phase45C.otioSchemaValid,
        },
        phase45D: {
          runId: config.approvedPhase45DRunId,
          reviewExportGcsUri: config.approvedPhase45DReviewExportGcsUri,
          reportGcsUri: config.approvedPhase45DReportGcsUri,
          ffprobeValidationGcsUri: config.approvedPhase45DFfprobeValidationGcsUri,
          reportPassed: evidenceValidation.phase45D.reportPassed,
        },
      },
      canonicalPrivateReviewExport: {
        gcsUri: config.approvedPhase45DReviewExportGcsUri,
        durationSeconds: reviewValidation.durationSeconds,
        width: reviewValidation.width,
        height: reviewValidation.height,
        videoCodec: reviewValidation.videoCodec,
        audioCodec: reviewValidation.audioCodec,
        videoStreamPresent: reviewValidation.videoStreamPresent,
        audioStreamPresent: reviewValidation.audioStreamPresent,
        container: reviewValidation.container,
        faststart: reviewValidation.faststart,
        unexpectedStreams: reviewValidation.unexpectedStreams,
        sizeBytes: reviewStats.size,
        sha256: reviewSha256,
      },
      e2eReviewManifestGcsUri: manifestArtifact.gcsUri,
      artifacts,
      qa,
      trackAVisualVideoReadiness: {
        readyForInternalPrivateVisualVideoTesting: qa.status === 'passed',
        reason: qa.status === 'passed'
          ? 'Phase 45E passed; Track A visual-video is ready for internal private visual-video testing only.'
          : `Track A visual-video internal private testing remains blocked: ${qa.blockers.join('; ')}`,
      },
      safety: {
        approvedSourceOnly: true,
        approvedPhase45AOnly: true,
        approvedPhase45BOnly: true,
        approvedPhase45COnly: true,
        approvedPhase45DOnly: true,
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
    await uploadJson(config.qaBucket, `${artifactPrefix}/reports/phase45e-report.json`, executionReport, localRoot, 'phase45e_report')

    const localReportPath = path.join(localRoot, 'phase45e-report.json')
    await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

    const evidence: ApprovedFullVisualVideoPrivateE2eEvidence = {
      phase: '45E',
      status: executionReport.ok && qa.status === 'passed' ? 'verified' : 'blocked',
      runId,
      sourceInputVideo: config.approvedInputVideoGcsUri,
      canonicalPrivateReviewExportUri: config.approvedPhase45DReviewExportGcsUri,
      e2eReviewManifestUri: manifestArtifact.gcsUri,
      ffprobeReviewExportValidationUri: `gs://${config.generatedAssetsBucket}/${artifactPrefix}/review/ffprobe-review-export-validation.json`,
      qaReportUri: `gs://${config.qaBucket}/${artifactPrefix}/reports/phase45e-report.json`,
      toolResults: {
        evidencePackage: qa.gates.some((gate) => gate.gateId === 'evidence_manifest_created' && gate.passed) ? 'passed' : 'blocked',
        ffprobe: qa.gates.some((gate) => gate.gateId === 'ffprobe_review_export_validation' && gate.passed) ? 'passed' : 'blocked',
      },
      trackAVisualVideoReadiness: executionReport.trackAVisualVideoReadiness,
      blockers: qa.blockers,
      warnings: qa.warnings,
    }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active gcloud account preflight and private GCS uploads passed'],
    evidenceModule: fullVisualVideoPrivateE2eEvidenceToTypeScript(evidence),
  }
}

export async function runFullVisualVideoPrivateE2ePreflight() {
  const config = fullVisualVideoPrivateE2eConfig
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, finalExportsBucket, previewsBucket, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', config.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${config.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${config.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${config.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${config.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== config.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== config.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(finalExportsBucket) !== config.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== config.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(generatedAssetsBucket) !== config.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== config.qaBucket) blockers.push('QA bucket is not reachable.')

    await Promise.all([
      describeGcsObject(config.approvedInputVideoGcsUri),
      describeGcsObject(config.approvedPhase45APreviewGcsUri),
      describeGcsObject(config.approvedPhase45AReportGcsUri),
      describeGcsObject(config.approvedPhase45BPreviewGcsUri),
      describeGcsObject(config.approvedPhase45BReportGcsUri),
      describeGcsObject(config.approvedPhase45COtioGcsUri),
      describeGcsObject(config.approvedPhase45CReportGcsUri),
      describeGcsObject(config.approvedPhase45DReviewExportGcsUri),
      describeGcsObject(config.approvedPhase45DFfprobeValidationGcsUri),
      describeGcsObject(config.approvedPhase45DReportGcsUri),
    ])
    await runCommand(resolveFfprobeCommand(), ['-version'])
    await assertNoPublicBucketPrincipals([config.finalExportsBucket, config.previewsBucket, config.generatedAssetsBucket, config.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateFullVisualVideoPrivateE2eExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    trackBEnabled: process.env.TRACK_B_TOOLS_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
  }
}

function buildPlanSnapshot(runId: string) {
  const config = fullVisualVideoPrivateE2eConfig
  return {
    planId: 'phase45e-full-visual-video-private-e2e-plan-v1',
    phase: '45E',
    track: config.track,
    runId,
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    sourceVideo: config.approvedInputVideoGcsUri,
    canonicalPrivateReviewExport: config.approvedPhase45DReviewExportGcsUri,
    evidenceChain: {
      phase45A: { runId: config.approvedPhase45ARunId, preview: config.approvedPhase45APreviewGcsUri, report: config.approvedPhase45AReportGcsUri },
      phase45B: { runId: config.approvedPhase45BRunId, preview: config.approvedPhase45BPreviewGcsUri, report: config.approvedPhase45BReportGcsUri },
      phase45C: { runId: config.approvedPhase45CRunId, otio: config.approvedPhase45COtioGcsUri, report: config.approvedPhase45CReportGcsUri },
      phase45D: { runId: config.approvedPhase45DRunId, reviewExport: config.approvedPhase45DReviewExportGcsUri, ffprobeValidation: config.approvedPhase45DFfprobeValidationGcsUri, report: config.approvedPhase45DReportGcsUri },
    },
    outputs: ['private_e2e_review_manifest', 'ffprobe_review_export_validation', 'qa_report', 'phase45e_report'],
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

function buildSourceValidation(source: GcsObjectMetadata, phase45APreview: GcsObjectMetadata, phase45BPreview: GcsObjectMetadata, phase45COtio: GcsObjectMetadata, phase45DReviewExport: GcsObjectMetadata) {
  const config = fullVisualVideoPrivateE2eConfig
  return {
    sourceVideo: config.approvedInputVideoGcsUri,
    sourceObjectExists: Boolean(source.name),
    sourceSizeBytes: sizeBytes(source),
    phase45APreviewObjectExists: Boolean(phase45APreview.name),
    phase45BPreviewObjectExists: Boolean(phase45BPreview.name),
    phase45COtioObjectExists: Boolean(phase45COtio.name),
    phase45DReviewExportObjectExists: Boolean(phase45DReviewExport.name),
    approvedSourceOnly: true,
    arbitraryMediaUsed: false,
  }
}

function buildEvidenceValidation(phase45AReport: Record<string, unknown>, phase45BReport: Record<string, unknown>, phase45COtio: Record<string, unknown>, phase45CReport: Record<string, unknown>, phase45DFfprobeValidation: Record<string, unknown>, phase45DReport: Record<string, unknown>) {
  const config = fullVisualVideoPrivateE2eConfig
  const phase45DReadiness = isRecord(phase45DReport.phase45EReadiness) ? phase45DReport.phase45EReadiness : {}
  return {
    phase45A: {
      runId: config.approvedPhase45ARunId,
      previewGcsUri: config.approvedPhase45APreviewGcsUri,
      reportGcsUri: config.approvedPhase45AReportGcsUri,
      reportPassed: reportHasNoBlockers(phase45AReport),
    },
    phase45B: {
      runId: config.approvedPhase45BRunId,
      previewGcsUri: config.approvedPhase45BPreviewGcsUri,
      reportGcsUri: config.approvedPhase45BReportGcsUri,
      reportPassed: reportHasNoBlockers(phase45BReport),
    },
    phase45C: {
      runId: config.approvedPhase45CRunId,
      otioGcsUri: config.approvedPhase45COtioGcsUri,
      reportGcsUri: config.approvedPhase45CReportGcsUri,
      reportPassed: reportHasNoBlockers(phase45CReport),
      otioSchemaValid: phase45COtio.OTIO_SCHEMA === 'Timeline.1',
    },
    phase45D: {
      runId: config.approvedPhase45DRunId,
      reviewExportGcsUri: config.approvedPhase45DReviewExportGcsUri,
      reportGcsUri: config.approvedPhase45DReportGcsUri,
      ffprobeValidationGcsUri: config.approvedPhase45DFfprobeValidationGcsUri,
      reportPassed: reportHasNoBlockers(phase45DReport),
      phase45EReady: phase45DReadiness.readyForFullVisualVideoPrivateE2E === true,
      ffprobeValidationPassed: phase45DFfprobeValidation.videoStreamPresent === true && phase45DFfprobeValidation.videoCodec === config.expectedVideoCodec,
    },
  }
}

function buildReviewManifest(runId: string, reviewValidation: Awaited<ReturnType<typeof buildReviewExportValidation>>, evidenceValidation: ReturnType<typeof buildEvidenceValidation>) {
  const config = fullVisualVideoPrivateE2eConfig
  return {
    manifestId: 'phase45e-full-visual-video-private-e2e-review-manifest-v1',
    phase: '45E',
    runId,
    sourceVideo: config.approvedInputVideoGcsUri,
    canonicalPrivateReviewExport: config.approvedPhase45DReviewExportGcsUri,
    reviewExportValidation: reviewValidation,
    evidenceValidation,
    privateReviewOnly: true,
    finalDeliveryCreated: false,
    publicUrlsCreated: false,
    signedUrlsCreated: false,
    providerExecuted: false,
    revideoUsed: false,
    trackBToolsUsed: false,
  }
}

async function buildReviewExportValidation(probe: Record<string, unknown>, filePath: string, size: number, sha256: string) {
  const video = stream(probe, 'video')
  const audio = stream(probe, 'audio')
  const format = isRecord(probe.format) ? probe.format : {}
  const unexpectedStreams = streams(probe)
    .filter((item) => item.codec_type !== 'video' && item.codec_type !== 'audio')
    .map((item) => String(item.codec_type ?? 'unknown'))
  return {
    gcsUri: fullVisualVideoPrivateE2eConfig.approvedPhase45DReviewExportGcsUri,
    durationSeconds: durationSeconds(probe),
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    videoCodec: String(video?.codec_name ?? ''),
    audioCodec: audio ? String(audio.codec_name ?? '') : undefined,
    videoStreamPresent: Boolean(video),
    audioStreamPresent: Boolean(audio),
    container: String(format.format_name ?? ''),
    faststart: await hasFaststartMoovBeforeMdat(filePath),
    unexpectedStreams,
    sizeBytes: size,
    sha256,
    privateReviewOnly: true,
    finalDeliveryCreated: false,
  }
}

function buildQa(input: {
  sourceValidation: ReturnType<typeof buildSourceValidation>
  evidenceValidation: ReturnType<typeof buildEvidenceValidation>
  reviewValidation: Awaited<ReturnType<typeof buildReviewExportValidation>>
  manifestArtifact: FullVisualVideoPrivateE2eArtifact
  artifacts: FullVisualVideoPrivateE2eArtifact[]
  publicAccessBlocked: boolean
}): FullVisualVideoPrivateE2eQaSummary {
  const config = fullVisualVideoPrivateE2eConfig
  const gate = (gateId: FullVisualVideoPrivateE2eQaGate['gateId'], passed: boolean, summary: string): FullVisualVideoPrivateE2eQaGate => ({ gateId, passed, severity: 'mandatory', summary })
  const artifactUris = [...input.artifacts, input.manifestArtifact].map((artifact) => artifact.gcsUri)
  const reviewExportOk = input.reviewValidation.gcsUri === config.approvedPhase45DReviewExportGcsUri
    && input.reviewValidation.sizeBytes > 0
    && input.reviewValidation.videoStreamPresent
    && input.reviewValidation.audioStreamPresent
    && input.reviewValidation.videoCodec === config.expectedVideoCodec
    && input.reviewValidation.audioCodec === config.expectedAudioCodec
    && input.reviewValidation.durationSeconds <= config.maxReviewDurationSeconds + 0.25
    && input.reviewValidation.width <= config.maxWidth
    && input.reviewValidation.height <= config.maxHeight

  const gates = [
    gate('source_integrity', input.sourceValidation.sourceObjectExists && input.sourceValidation.sourceVideo === config.approvedInputVideoGcsUri && input.sourceValidation.approvedSourceOnly, 'Approved Phase 32 source object exists and no arbitrary media is used.'),
    gate('phase45a_libass_evidence', input.evidenceValidation.phase45A.reportPassed && input.sourceValidation.phase45APreviewObjectExists, 'Approved Phase 45A libass evidence exists and report passed.'),
    gate('phase45b_remotion_evidence', input.evidenceValidation.phase45B.reportPassed && input.sourceValidation.phase45BPreviewObjectExists, 'Approved Phase 45B Remotion evidence exists and report passed.'),
    gate('phase45c_otio_evidence', input.evidenceValidation.phase45C.reportPassed && input.evidenceValidation.phase45C.otioSchemaValid && input.sourceValidation.phase45COtioObjectExists, 'Approved Phase 45C OTIO evidence exists, schema is valid, and report passed.'),
    gate('phase45d_ffmpeg_ffprobe_evidence', input.evidenceValidation.phase45D.reportPassed && input.evidenceValidation.phase45D.phase45EReady && input.evidenceValidation.phase45D.ffprobeValidationPassed && input.sourceValidation.phase45DReviewExportObjectExists, 'Approved Phase 45D FFmpeg/FFprobe evidence passed and marks Phase45E ready.'),
    gate('private_review_export_integrity', reviewExportOk, 'Canonical private Phase 45D review export is non-empty, bounded, and has expected audio/video streams.'),
    gate('ffprobe_review_export_validation', input.reviewValidation.videoStreamPresent && input.reviewValidation.audioStreamPresent && input.reviewValidation.faststart && input.reviewValidation.unexpectedStreams.length === 0, 'FFprobe validates the canonical private review export.'),
    gate('evidence_manifest_created', input.manifestArtifact.sizeBytes > 0 && input.manifestArtifact.gcsUri.startsWith(`gs://${config.generatedAssetsBucket}/${config.reportObjectPrefix}/`), 'Private E2E review manifest was created under the Phase 45E generated-assets prefix.'),
    gate('artifact_privacy', artifactUris.every((uri) => uri.startsWith('gs://reeditpro-staging-reeditpro-')), 'All Phase 45E artifacts use private staging GCS prefixes only.'),
    gate('no_public_access', input.publicAccessBlocked, 'No public bucket principals or public/signed URL outputs are used.'),
    gate('no_final_delivery', true, 'No new user final delivery export was created; Phase 45D remains the canonical private review export.'),
    gate('blocked_features', true, 'Production, beta, paid production, broad media, providers, Revideo, and Track B stay blocked.'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: [
      'Phase 45E assembles a private visual-video E2E evidence package only.',
      'Final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.',
    ],
  }
}

async function describeGcsObject(uri: string): Promise<GcsObjectMetadata> {
  return parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', uri, '--format=json'])) as GcsObjectMetadata
}

async function readJsonFromGcs(uri: string, root: string, name: string): Promise<Record<string, unknown>> {
  const filePath = path.join(root, `${name}.json`)
  await downloadGcs(uri, filePath)
  return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
}

async function downloadGcs(uri: string, destination: string): Promise<void> {
  await runCommand('gcloud', ['storage', 'cp', uri, destination])
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, kind: string): Promise<FullVisualVideoPrivateE2eArtifact> {
  const filePath = path.join(root, `${kind}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await runCommand('gcloud', ['storage', 'cp', filePath, `gs://${bucket}/${object}`])
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
  const output = await runCommand(resolveFfprobeCommand(), ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath])
  return JSON.parse(output) as Record<string, unknown>
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

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const result = await execFileAsync(command, args, { timeout, maxBuffer: 128 * 1024 * 1024 })
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

function reportHasNoBlockers(report: Record<string, unknown>): boolean {
  const qa = isRecord(report.qa) ? report.qa : {}
  const blockers = Array.isArray(qa.blockers) ? qa.blockers : []
  return report.ok === true && qa.status === 'passed' && blockers.length === 0
}

function sizeBytes(metadata: GcsObjectMetadata): number {
  const value = typeof metadata.size === 'number' ? metadata.size : Number(metadata.size ?? 0)
  return Number.isFinite(value) ? value : 0
}

async function hasFaststartMoovBeforeMdat(filePath: string): Promise<boolean> {
  const buffer = await readFile(filePath)
  const head = buffer.subarray(0, Math.min(buffer.length, 2 * 1024 * 1024)).toString('latin1')
  const moov = head.indexOf('moov')
  const mdat = head.indexOf('mdat')
  return moov >= 0 && (mdat < 0 || moov < mdat)
}

function streams(probe: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(probe.streams) ? probe.streams.filter(isRecord) : []
}

function stream(probe: Record<string, unknown>, type: 'video' | 'audio'): Record<string, unknown> | undefined {
  return streams(probe).find((item) => item.codec_type === type)
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

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}

function resolveFfprobeCommand(): string {
  return process.env.FFPROBE_BIN || 'ffprobe'
}

function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const start = [objectStart, arrayStart].filter((index) => index >= 0).sort((a, b) => a - b)[0]
  if (start === undefined) throw new Error(`gcloud output did not include JSON: ${output.slice(0, 160)}`)
  return JSON.parse(output.slice(start))
}
