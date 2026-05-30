import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildSegmentTextBehindSubjectPreviewCompositionPlan } from './segment-text-behind-composition-plan'
import { composeSegmentTextBehindSubjectPreviewFrame } from './segment-text-behind-local-compositor'
import { buildSegmentTextBehindSubjectPreviewExecutionQa } from './segment-text-behind-qa-summary'
import { resolveSegmentTextBehindSubjectPreviewArtifacts } from './segment-text-behind-source-resolver'
import {
  phase35ePrefix,
  segmentTextBehindSubjectPreviewConfig,
  validateSegmentTextBehindSubjectPreviewExecutionEnv,
} from './segment-text-behind-subject-preview-policy'
import type {
  ApprovedSegmentTextBehindSubjectPreviewEvidence,
  SegmentTextBehindSubjectPreviewArtifact,
  SegmentTextBehindSubjectPreviewExecutionReport,
} from './segment-text-behind-subject-preview-types'

const execFileAsync = promisify(execFile)

interface SegmentManifest {
  phase: string
  runId: string
  inputVideoGcsUri: string
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  frameCount: number
  width: number
  height: number
  fps: number
  frameUris: string[]
}

interface PromptMetadata {
  prompt?: {
    source?: string
    type?: string
    promptFrameIndex?: number
    scaledBoundingBox?: [number, number, number, number]
  }
  rawChatUsed?: boolean
}

interface MaskMetadata {
  masks?: {
    frameCount: number
    maskUris: string[]
  }
  fullVideoMaskExecuted?: boolean
}

interface Phase35DReport {
  ok?: boolean
  qa?: {
    status?: string
    blockers?: string[]
  }
  phase35EReadiness?: {
    readyForControlledSegmentTextBehindSubjectPreview?: boolean
  }
}

export async function runSegmentTextBehindSubjectPreview(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedSegmentTextBehindSubjectPreviewEvidence
  executionReport: SegmentTextBehindSubjectPreviewExecutionReport
  localReportPath: string
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 35E segment text-behind-subject preview flow.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE35E_RUN_ID ?? `phase35e-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  phase35ePrefix(runId)
  const preflight = await runSegmentTextBehindSubjectPreviewPreflight()
  if (!preflight.allowed) throw new Error(`Phase 35E segment preview preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const artifacts = resolveSegmentTextBehindSubjectPreviewArtifacts(runId)
  const plan = buildSegmentTextBehindSubjectPreviewCompositionPlan()
  const mediaDir = path.join(os.tmpdir(), `reeditpro-phase35e-media-${runId}`)
  const reportDir = path.join(os.tmpdir(), `reeditpro-phase35e-report-${runId}`)
  const frameDir = path.join(mediaDir, 'frames')
  const maskDir = path.join(mediaDir, 'masks')
  const previewDir = path.join(mediaDir, 'preview-frames')
  await mkdir(frameDir, { recursive: true })
  await mkdir(maskDir, { recursive: true })
  await mkdir(previewDir, { recursive: true })
  await mkdir(reportDir, { recursive: true })

  const uploadedArtifacts: SegmentTextBehindSubjectPreviewArtifact[] = []
  const previewFrameUris: string[] = []
  const sourceFrameMaskMap: Array<{
    frameIndex: number
    sourceFrameUri: string
    sourceMaskUri: string
    previewFrameUri: string
  }> = []

  try {
    for (let index = 0; index < preflight.segmentManifest.frameUris.length; index += 1) {
      const sourceFrameUri = preflight.segmentManifest.frameUris[index]
      const sourceMaskUri = preflight.maskMetadata.masks?.maskUris[index]
      if (!sourceMaskUri) throw new Error(`Missing mask URI for frame index ${index}.`)
      const framePath = path.join(frameDir, `frame-${String(index).padStart(3, '0')}.png`)
      const maskPath = path.join(maskDir, `frame-${String(index).padStart(3, '0')}-mask.png`)
      const previewPath = path.join(previewDir, `frame-${String(index).padStart(3, '0')}-preview.png`)
      await downloadGcsFile(sourceFrameUri, framePath)
      await downloadGcsFile(sourceMaskUri, maskPath)
      await composeSegmentTextBehindSubjectPreviewFrame({
        framePath,
        maskPath,
        outputPath: previewPath,
        plan,
      })
      const previewObject = `${phase35ePrefix(runId)}/preview-frames/frame-${String(index).padStart(3, '0')}-preview.png`
      const artifact = await uploadFile(segmentTextBehindSubjectPreviewConfig.previewsBucket, previewObject, previewPath)
      uploadedArtifacts.push({ id: `preview-frame-${index}`, kind: 'preview_frame', ...artifact })
      previewFrameUris.push(artifact.gcsUri)
      sourceFrameMaskMap.push({ frameIndex: index, sourceFrameUri, sourceMaskUri, previewFrameUri: artifact.gcsUri })
    }

    const textStyleArtifact = await uploadJson(segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket, gcsObjectFromUri(artifacts.textStyle), {
      phase: '35E',
      runId,
      text: plan.text,
      style: plan.textStyle,
      position: plan.position,
      renderer: plan.renderer,
      previewClipStrategy: plan.previewClipStrategy,
    })
    uploadedArtifacts.push({ id: 'text-style', kind: 'text_style', ...textStyleArtifact })

    const sourceFrameMaskMapArtifact = await uploadJson(segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket, gcsObjectFromUri(artifacts.sourceFrameMaskMap), {
      phase: '35E',
      runId,
      sourcePhase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
      frameMaskPairs: sourceFrameMaskMap,
      sourceResolvedFromManifest: true,
    })
    uploadedArtifacts.push({ id: 'source-frame-mask-map', kind: 'source_frame_mask_map', ...sourceFrameMaskMapArtifact })

    const compositionManifestArtifact = await uploadJson(segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket, gcsObjectFromUri(artifacts.compositionManifest), {
      phase: '35E',
      runId,
      manifestKind: 'segment_text_behind_subject_composition_manifest',
      sourcePhase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
      inputRefs: {
        segmentManifest: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`,
        maskMetadata: `${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`,
        promptMetadata: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`,
        phase35DReport: `${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`,
      },
      textLayerPlan: plan,
      outputPreviewFrames: previewFrameUris,
      previewClipGenerated: false,
      renderMode: 'controlled_segment_preview_frames_only',
      renderEngineHandoff: {
        nativeNodePngCompositor: true,
        ffmpegPreviewClip: false,
        remotionUsed: false,
        revideoUsed: false,
        finalRenderAllowed: false,
        fullVideoRenderAllowed: false,
      },
    })
    uploadedArtifacts.push({ id: 'composition-manifest', kind: 'composition_manifest', ...compositionManifestArtifact })

    const qa = buildSegmentTextBehindSubjectPreviewExecutionQa({
      previewFrameCount: previewFrameUris.length,
      maskCount: preflight.maskMetadata.masks?.maskUris.length ?? 0,
      frameCount: preflight.segmentManifest.frameCount,
      width: preflight.segmentManifest.width,
      height: preflight.segmentManifest.height,
      publicAccessEnabled: false,
    })

    const qaArtifact = await uploadJson(segmentTextBehindSubjectPreviewConfig.qaBucket, gcsObjectFromUri(artifacts.qaReport), {
      phase: '35E',
      runId,
      qa,
    })
    uploadedArtifacts.push({ id: 'qa-report', kind: 'qa_report', ...qaArtifact })

    const executionReport: SegmentTextBehindSubjectPreviewExecutionReport = {
      ok: qa.blockers.length === 0,
      runId,
      projectId: 'reeditpro',
      source: {
        phase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
        inputVideoGcsUri: segmentTextBehindSubjectPreviewConfig.approvedInputVideoGcsUri,
        generatedAssetsPrefix: segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix,
        masksPrefix: segmentTextBehindSubjectPreviewConfig.masksInputPrefix,
        qaReportUri: `${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`,
      },
      segment: {
        startSeconds: 6.9,
        endSeconds: 8.9,
        durationSeconds: 2,
        frameCount: 10,
        width: 768,
        height: 432,
        fps: 5,
        frameUris: preflight.segmentManifest.frameUris,
        maskUris: preflight.maskMetadata.masks?.maskUris ?? [],
        segmentManifestUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`,
        maskMetadataUri: `${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`,
        promptMetadataUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`,
      },
      textLayerPlan: plan,
      composition: {
        method: 'native_node_png_alpha_composite',
        previewFrameUris,
        previewClipGenerated: false,
        compositionManifestUri: compositionManifestArtifact.gcsUri,
        sourceFrameMaskMapUri: sourceFrameMaskMapArtifact.gcsUri,
        textStyleUri: textStyleArtifact.gcsUri,
      },
      qa,
      artifacts: uploadedArtifacts,
      safety: {
        approvedPhase35DRunOnly: true,
        approvedFrameMaskManifestsOnly: true,
        arbitraryRealUserMediaUsed: false,
        fullVideoMaskExecuted: false,
        fullVideoTextBehindSubjectExecuted: false,
        finalExportCreated: false,
        providerExecuted: false,
        modelDownloaded: false,
        realEsrganUsed: false,
        revideoUsed: false,
        filmUsed: false,
        slowMotionExecuted: false,
        publicAccessEnabled: false,
        secretValuesUsed: false,
        productionReadyAllowed: false,
        externalBetaAllowed: false,
        broadRealUserMediaAllowed: false,
      },
      uploadedReport: {
        bucket: segmentTextBehindSubjectPreviewConfig.qaBucket,
        object: gcsObjectFromUri(artifacts.phase35EReport),
        gcsUri: artifacts.phase35EReport,
      },
      blockers: qa.blockers,
      warnings: qa.warnings,
    }

    const reportArtifact = await uploadJson(segmentTextBehindSubjectPreviewConfig.qaBucket, gcsObjectFromUri(artifacts.phase35EReport), executionReport)
    executionReport.artifacts.push({ id: 'phase35e-report', kind: 'phase35e_report', ...reportArtifact })
    const localReportPath = path.join(reportDir, 'phase35e-report.json')
    await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

    const verified = executionReport.ok && executionReport.qa.status !== 'blocked'
    const evidence: ApprovedSegmentTextBehindSubjectPreviewEvidence = {
      phase: '35E',
      status: verified ? 'verified' : 'blocked',
      runId,
      sourcePhase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
      selectedSegment: {
        startSeconds: 6.9,
        endSeconds: 8.9,
        durationSeconds: 2,
        frameCount: 10,
        width: 768,
        height: 432,
      },
      text: 'REEDITPRO',
      compositionMethod: 'native_node_png_alpha_composite',
      previewPrefix: artifacts.previewPrefix,
      generatedAssetsPrefix: artifacts.generatedPrefix,
      qaReportUri: artifacts.phase35EReport,
      previewFrameCount: previewFrameUris.length,
      previewClipGenerated: false,
      phase36AReadiness: {
        readyForAudioAiApprovalWorkflow: verified,
        reason: verified
          ? 'Phase 35E produced one controlled private segment text-behind-subject preview with no blocking QA failures; the next roadmap family may move to audio AI approval workflow only.'
          : 'Phase 36A remains blocked because Phase 35E QA did not pass.',
      },
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }

    return { evidence, executionReport, localReportPath }
  } finally {
    await rm(mediaDir, { recursive: true, force: true })
  }
}

export async function runSegmentTextBehindSubjectPreviewPreflight() {
  const [activeAccount, activeProject, projectDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
  ])
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  const blockers: string[] = []
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== segmentTextBehindSubjectPreviewConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')

  const validation = validateSegmentTextBehindSubjectPreviewExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW,
    phase35DRunId: process.env.REEDITPRO_PHASE35D_RUN_ID ?? segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
    text: process.env.REEDITPRO_PHASE35E_TEXT ?? segmentTextBehindSubjectPreviewConfig.approvedText,
    segmentDurationSeconds: segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds,
    frameCount: segmentTextBehindSubjectPreviewConfig.approvedFrameCount,
    generatedAssetsInputPrefix: segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix,
    masksInputPrefix: segmentTextBehindSubjectPreviewConfig.masksInputPrefix,
    qaInputPrefix: segmentTextBehindSubjectPreviewConfig.qaInputPrefix,
    outputPreviewPrefix: segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix,
    outputGeneratedAssetsPrefix: segmentTextBehindSubjectPreviewConfig.outputGeneratedAssetsPrefix,
    outputQaPrefix: segmentTextBehindSubjectPreviewConfig.outputQaPrefix,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBeta: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMedia: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    fullVideoTextBehindSubjectEnabled: process.env.FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED ?? 'false',
    fullVideoMaskEnabled: process.env.FULL_VIDEO_MASK_ENABLED ?? 'false',
    finalExportEnabled: process.env.FINAL_EXPORT_ENABLED ?? 'false',
  })

  const buckets = [
    segmentTextBehindSubjectPreviewConfig.generatedAssetsBucket,
    segmentTextBehindSubjectPreviewConfig.masksBucket,
    segmentTextBehindSubjectPreviewConfig.previewsBucket,
    segmentTextBehindSubjectPreviewConfig.qaBucket,
    segmentTextBehindSubjectPreviewConfig.workerTempBucket,
  ]
  for (const bucketName of buckets) {
    await assertBucketPrivate(bucketName, blockers)
  }

  const segmentManifestUri = `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`
  const promptMetadataUri = `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`
  const maskMetadataUri = `${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`
  const phase35DReportUri = `${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`
  const segmentManifest = await downloadJson<SegmentManifest>(segmentManifestUri)
  const promptMetadata = await downloadJson<PromptMetadata>(promptMetadataUri)
  const maskMetadata = await downloadJson<MaskMetadata>(maskMetadataUri)
  const phase35DReport = await downloadJson<Phase35DReport>(phase35DReportUri)

  if (segmentManifest.runId !== segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId) blockers.push('Segment manifest run id does not match the approved Phase 35D run.')
  if (segmentManifest.inputVideoGcsUri !== segmentTextBehindSubjectPreviewConfig.approvedInputVideoGcsUri) blockers.push('Segment manifest input video is not the approved Phase 32 private export.')
  if (segmentManifest.frameCount !== segmentTextBehindSubjectPreviewConfig.approvedFrameCount) blockers.push('Segment manifest frame count is not 10.')
  if (segmentManifest.width !== segmentTextBehindSubjectPreviewConfig.approvedFrameWidth || segmentManifest.height !== segmentTextBehindSubjectPreviewConfig.approvedFrameHeight) blockers.push('Segment manifest dimensions are not 768x432.')
  if (segmentManifest.durationSeconds > segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds) blockers.push('Segment manifest duration exceeds 2.0 seconds.')
  if (promptMetadata.rawChatUsed) blockers.push('Phase 35D prompt metadata reports raw chat usage.')
  if (promptMetadata.prompt?.source !== 'phase33d_mask_bbox') blockers.push('Phase 35D prompt source is not the Phase 33D mask bbox.')
  if (maskMetadata.fullVideoMaskExecuted) blockers.push('Mask metadata reports full-video mask execution.')
  if ((maskMetadata.masks?.frameCount ?? 0) !== segmentTextBehindSubjectPreviewConfig.approvedFrameCount) blockers.push('Mask metadata frame count is not 10.')
  if ((maskMetadata.masks?.maskUris.length ?? 0) !== segmentManifest.frameUris.length) blockers.push('Mask URI count does not match segment frame URI count.')
  if (phase35DReport.ok === false) blockers.push('Phase 35D report did not return ok=true.')
  if ((phase35DReport.qa?.blockers ?? []).length > 0) blockers.push('Phase 35D report has QA blockers.')
  if (phase35DReport.phase35EReadiness?.readyForControlledSegmentTextBehindSubjectPreview === false) blockers.push('Phase 35D report does not permit Phase 35E controlled segment preview readiness.')

  await Promise.all([
    ...segmentManifest.frameUris.map((uri) => assertObjectExists(uri, blockers)),
    ...(maskMetadata.masks?.maskUris ?? []).map((uri) => assertObjectExists(uri, blockers)),
  ])

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: validation.warnings,
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    segmentManifest,
    promptMetadata,
    maskMetadata,
    phase35DReport,
  }
}

export function segmentTextBehindSubjectPreviewEvidenceToTypeScript(evidence: ApprovedSegmentTextBehindSubjectPreviewEvidence): string {
  return [
    'import { segmentTextBehindSubjectPreviewConfig } from \'./segment-text-behind-subject-preview-policy\'',
    'import type { ApprovedSegmentTextBehindSubjectPreviewEvidence } from \'./segment-text-behind-subject-preview-types\'',
    '',
    'export const approvedSegmentTextBehindSubjectPreviewEvidence: ApprovedSegmentTextBehindSubjectPreviewEvidence = {',
    `  phase: '35E',`,
    `  status: '${evidence.status}',`,
    evidence.runId ? `  runId: '${evidence.runId}',` : undefined,
    '  sourcePhase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,',
    `  selectedSegment: ${JSON.stringify(evidence.selectedSegment, null, 2).replace(/\n/g, '\n  ')},`,
    '  text: segmentTextBehindSubjectPreviewConfig.approvedText,',
    evidence.compositionMethod ? `  compositionMethod: '${evidence.compositionMethod}',` : undefined,
    evidence.previewPrefix ? `  previewPrefix: '${evidence.previewPrefix}',` : undefined,
    evidence.generatedAssetsPrefix ? `  generatedAssetsPrefix: '${evidence.generatedAssetsPrefix}',` : undefined,
    evidence.qaReportUri ? `  qaReportUri: '${evidence.qaReportUri}',` : undefined,
    evidence.previewFrameCount !== undefined ? `  previewFrameCount: ${evidence.previewFrameCount},` : undefined,
    evidence.previewClipGenerated !== undefined ? `  previewClipGenerated: ${evidence.previewClipGenerated},` : undefined,
    `  phase36AReadiness: ${JSON.stringify(evidence.phase36AReadiness, null, 2).replace(/\n/g, '\n  ')},`,
    `  blockers: ${JSON.stringify(evidence.blockers, null, 2).replace(/\n/g, '\n  ')},`,
    `  warnings: ${JSON.stringify(evidence.warnings, null, 2).replace(/\n/g, '\n  ')},`,
    '}',
    '',
    'export function getApprovedSegmentTextBehindSubjectPreviewEvidence(): ApprovedSegmentTextBehindSubjectPreviewEvidence {',
    '  return {',
    '    ...approvedSegmentTextBehindSubjectPreviewEvidence,',
    '    selectedSegment: { ...approvedSegmentTextBehindSubjectPreviewEvidence.selectedSegment },',
    '    phase36AReadiness: { ...approvedSegmentTextBehindSubjectPreviewEvidence.phase36AReadiness },',
    '    blockers: [...approvedSegmentTextBehindSubjectPreviewEvidence.blockers],',
    '    warnings: [...approvedSegmentTextBehindSubjectPreviewEvidence.warnings],',
    '  }',
    '}',
    '',
  ].filter((line): line is string => line !== undefined).join('\n')
}

async function assertBucketPrivate(bucketName: string, blockers: string[]): Promise<void> {
  try {
    const bucketNameResult = lastGcloudValue(await runGcloud(['storage', 'buckets', 'describe', `gs://${bucketName}`, '--format=value(name)']))
    if (bucketNameResult !== bucketName) blockers.push(`Bucket ${bucketName} is not reachable.`)
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucketName}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) blockers.push(`Bucket ${bucketName} has a public principal in IAM policy.`)
  } catch (error) {
    blockers.push(`Could not verify bucket ${bucketName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function assertObjectExists(uri: string, blockers: string[]): Promise<void> {
  try {
    const size = lastGcloudValue(await runGcloud(['storage', 'objects', 'describe', uri, '--format=value(size)']))
    if (Number(size) <= 0) blockers.push(`Object ${uri} is missing or empty.`)
  } catch (error) {
    blockers.push(`Could not verify object ${uri}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function downloadJson<T>(uri: string): Promise<T> {
  const contents = await runGcloud(['storage', 'cat', uri])
  return parseJsonOutput<T>(contents)
}

async function downloadGcsFile(uri: string, destination: string): Promise<void> {
  await runGcloud(['storage', 'cp', uri, destination])
}

async function uploadJson(
  bucket: string,
  object: string,
  payload: unknown,
): Promise<Omit<SegmentTextBehindSubjectPreviewArtifact, 'id' | 'kind'>> {
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const uploadPath = path.join(os.tmpdir(), `reeditpro-phase35e-upload-${process.pid}-${Date.now()}.json`)
  await writeFile(uploadPath, body)
  await runGcloud(['storage', 'cp', uploadPath, `gs://${bucket}/${object}`])
  await rm(uploadPath, { force: true })
  return {
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: body.byteLength,
    sha256: sha256(body),
  }
}

async function uploadFile(
  bucket: string,
  object: string,
  sourcePath: string,
): Promise<Omit<SegmentTextBehindSubjectPreviewArtifact, 'id' | 'kind'>> {
  const body = await readFile(sourcePath)
  await runGcloud(['storage', 'cp', sourcePath, `gs://${bucket}/${object}`])
  return {
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: body.byteLength,
    sha256: sha256(body),
  }
}

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args)
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/private/tmp/codex-node-runtime/bin:${process.env.PATH ?? ''}`,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

function gcsObjectFromUri(uri: string): string {
  return parseGcsUri(uri).object
}

function parseGcsUri(uri: string): { bucket: string; object: string } {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}

function parseJsonOutput<T>(output: string): T {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error(`Could not parse JSON output: ${output.slice(0, 500)}`)
  return JSON.parse(output.slice(start, end + 1)) as T
}

function lastGcloudValue(output: string): string {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? ''
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}
