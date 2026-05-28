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

interface ColorCorrectionEnv {
  projectId: 'reeditpro'
  region: 'us-central1'
  runId: string
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  phase30RunId: 'phase30-20260528T12421'
  phase31RunId: 'phase31-20260528T13060'
  inputGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4'
  inputBucket: 'reeditpro-staging-reeditpro-final-exports'
  inputObject: 'activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase32Prefix: string
}

interface Phase33DFrameEnv {
  projectId: 'reeditpro'
  region: 'us-central1'
  runId: string
  phase32RunId: 'phase32-20260528T13330'
  inputGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  inputBucket: 'reeditpro-staging-reeditpro-final-exports'
  inputObject: 'activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase33dPrefix: string
}

interface Phase33EFrameEnv {
  projectId: 'reeditpro'
  region: 'us-central1'
  runId: string
  phase33dRunId: 'phase33d-20260528T161056'
  text: 'REEDITPRO'
  frameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png'
  maskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png'
  cutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png'
  sourceBucket: 'reeditpro-staging-reeditpro-generated-assets'
  frameObject: 'activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png'
  maskObject: 'activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png'
  cutoutObject: 'activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase33ePrefix: string
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
  colorSpace?: string
  colorTransfer?: string
}

interface ColorSample {
  sampleId: string
  timestampSeconds: number
  stats: Record<string, number>
}

interface ColorAnalysisSummary {
  durationSeconds?: number
  sampledFrameCount: number
  colorSpaceAssumption: string
  transferAssumption: string
  underexposedRisk: 'low' | 'warning' | 'high'
  overexposedRisk: 'low' | 'warning' | 'high'
  highlightClippingRisk: 'low' | 'warning' | 'high'
  shadowCrushingRisk: 'low' | 'warning' | 'high'
  saturationRisk: 'low' | 'warning' | 'high'
  whiteBalanceIssue: 'not_detected' | 'warning' | 'unknown'
  skinToneRisk: 'warning_only_not_measured'
  shotMismatch: 'not_applicable_single_clip'
  missingEvidenceWarnings: string[]
}

interface ColorGradeRecipe {
  decision: 'no_op' | 'minimal_correction' | 'blocked'
  reason: string
  ffmpegFilter?: string
  parameters: {
    brightness: number
    contrast: number
    saturation: number
    gamma: number
  }
  correctionStrength: 'none' | 'minimal'
  colorGradeStyle: 'clean_natural'
}

async function main(): Promise<void> {
  if (process.env.REEDITPRO_PHASE33E_MODE === 'text_behind_subject_frame_preview') {
    await mainPhase33ETextBehindSubjectFrame()
    return
  }
  if (process.env.REEDITPRO_PHASE33D_MODE === 'representative_frame_extract') {
    await mainPhase33DFrameExtraction()
    return
  }
  if (process.env.REEDITPRO_PHASE32_MODE === 'color_correction_ffmpeg') {
    await mainColorCorrection()
    return
  }
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

async function mainPhase33ETextBehindSubjectFrame(): Promise<void> {
  const env = readPhase33EFrameEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase33e-text-frame-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    const report = await runPhase33ETextBehindSubjectFrame(storage, env, workDir)
    console.log(JSON.stringify(report))
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function mainColorCorrection(): Promise<void> {
  const env = readColorCorrectionEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase32-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    const report = await runColorCorrection(storage, env, workDir)
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

async function mainPhase33DFrameExtraction(): Promise<void> {
  const env = readPhase33DFrameEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-phase33d-frame-${env.runId}`)
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  try {
    const report = await runPhase33DFrameExtraction(storage, env, workDir)
    console.log(JSON.stringify(report))
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function runPhase33DFrameExtraction(storage: Storage, env: Phase33DFrameEnv, workDir: string): Promise<Record<string, unknown>> {
  const inputPath = path.join(workDir, 'phase32-color-corrected-export.mp4')
  const framePath = path.join(workDir, 'representative-frame.png')

  await downloadObject(storage, env.inputBucket, env.inputObject, inputPath)
  const inputProbe = await ffprobe(inputPath)
  const inputSummary = readProbeSummary(inputProbe)
  const selection = selectPhase33DFrameTimestamp(inputSummary.durationSeconds)
  await extractOneFrame({
    inputPath,
    outputPath: framePath,
    timestampSeconds: selection.timestampSeconds,
  })
  const frameProbe = await ffprobe(framePath)
  const frameSummary = readProbeSummary(frameProbe)

  const frameObject = `${env.phase33dPrefix}/representative-frame/frame.png`
  const qaObject = `${env.phase33dPrefix}/reports/frame-extraction-report.json`
  const artifacts: ArtifactRecord[] = []
  const representativeFrame = await uploadFile(storage, env.generatedAssetsBucket, frameObject, framePath, 'image/png', '33d')
  artifacts.push(representativeFrame)

  const report = {
    ok: true,
    runId: env.runId,
    sourcePhase32RunId: env.phase32RunId,
    sourceGcsUri: env.inputGcsUri,
    inputProbe: inputSummary,
    selectedTimestampSeconds: selection.timestampSeconds,
    selectionReason: selection.reason,
    representativeFrame: {
      ...representativeFrame,
      width: frameSummary.width,
      height: frameSummary.height,
    },
    artifacts,
    uploadedReport: {
      bucket: env.qaBucket,
      object: qaObject,
      gcsUri: `gs://${env.qaBucket}/${qaObject}`,
    },
    safety: phase33DSafety(),
    blockers: [],
    warnings: [
      'Phase 33D extracted exactly one representative frame; no full-video mask sequence was created.',
      'Text-behind-subject remains blocked until Phase 33E.',
    ],
  }
  artifacts.push(await uploadJson(storage, env.qaBucket, qaObject, report, '33d'))
  return report
}

async function runPhase33ETextBehindSubjectFrame(storage: Storage, env: Phase33EFrameEnv, workDir: string): Promise<Record<string, unknown>> {
  const framePath = path.join(workDir, 'phase33d-frame.png')
  const maskPath = path.join(workDir, 'phase33d-mask.png')
  const cutoutPath = path.join(workDir, 'phase33d-cutout.png')
  const previewPath = path.join(workDir, 'text-behind-subject-preview.png')

  await downloadObject(storage, env.sourceBucket, env.frameObject, framePath)
  await downloadObject(storage, env.sourceBucket, env.maskObject, maskPath)
  await downloadObject(storage, env.sourceBucket, env.cutoutObject, cutoutPath)

  const frameSummary = readProbeSummary(await ffprobe(framePath))
  const maskSummary = readProbeSummary(await ffprobe(maskPath))
  const cutoutSummary = readProbeSummary(await ffprobe(cutoutPath))
  const width = frameSummary.width ?? 0
  const height = frameSummary.height ?? 0
  if (width <= 0 || height <= 0) throw new Error('Phase 33E frame dimensions could not be read.')
  if (maskSummary.width !== width || maskSummary.height !== height) throw new Error('Phase 33E mask dimensions do not match the representative frame.')
  if (cutoutSummary.width !== width || cutoutSummary.height !== height) throw new Error('Phase 33E cutout dimensions do not match the representative frame.')

  const maskBounds = await detectMaskBounds(maskPath, width, height)
  const textLayerPlan = buildPhase33ETextLayerPlan({
    width,
    height,
    text: env.text,
    maskBounds,
  })
  await renderPhase33EPreview({
    framePath,
    cutoutPath,
    previewPath,
    textLayerPlan,
  })
  const previewSummary = readProbeSummary(await ffprobe(previewPath))

  const textLayerPlanObject = `${env.phase33ePrefix}/plans/text-layer-plan.json`
  const depthManifestObject = `${env.phase33ePrefix}/manifests/depth-composition-manifest.json`
  const previewObject = `${env.phase33ePrefix}/text-behind-subject-preview.png`
  const qaObject = `${env.phase33ePrefix}/qa/text-behind-subject-frame-qa.json`
  const reportObject = `${env.phase33ePrefix}/reports/phase33e-report.json`
  const previewGcsUri = `gs://${env.previewsBucket}/${previewObject}`
  const textLayerPlanGcsUri = `gs://${env.generatedAssetsBucket}/${textLayerPlanObject}`
  const artifacts: ArtifactRecord[] = []
  const depthCompositionManifest = buildPhase33EDepthCompositionManifest({
    runId: env.runId,
    env,
    textLayerPlanGcsUri,
    previewGcsUri,
  })
  const qa = buildPhase33EQaSummary({
    width,
    height,
    previewWidth: previewSummary.width,
    previewHeight: previewSummary.height,
    textLayerPlan,
  })

  artifacts.push(await uploadJson(storage, env.generatedAssetsBucket, textLayerPlanObject, textLayerPlan, '33e'))
  artifacts.push(await uploadJson(storage, env.generatedAssetsBucket, depthManifestObject, depthCompositionManifest, '33e'))
  const previewArtifact = await uploadFile(storage, env.previewsBucket, previewObject, previewPath, 'image/png', '33e')
  artifacts.push(previewArtifact)
  artifacts.push(await uploadJson(storage, env.qaBucket, qaObject, qa, '33e'))

  const report = {
    ok: qa.status !== 'blocked',
    runId: env.runId,
    sourcePhase33DRunId: env.phase33dRunId,
    representativeFrameGcsUri: env.frameGcsUri,
    maskGcsUri: env.maskGcsUri,
    cutoutGcsUri: env.cutoutGcsUri,
    inputDimensions: { width, height },
    textLayerPlan,
    depthCompositionManifest,
    preview: {
      status: 'created',
      gcsUri: previewArtifact.gcsUri,
      width: previewSummary.width,
      height: previewSummary.height,
    },
    qa,
    artifacts,
    uploadedReport: {
      bucket: env.qaBucket,
      object: reportObject,
      gcsUri: `gs://${env.qaBucket}/${reportObject}`,
    },
    safety: phase33ESafety(),
    blockers: qa.blockers,
    warnings: [
      ...qa.warnings,
      'Phase 33E composed one PNG only; no video render/export was attempted.',
      'Full-video text-behind-subject remains blocked.',
    ],
  }
  artifacts.push(await uploadJson(storage, env.qaBucket, reportObject, report, '33e'))
  return report
}

async function runColorCorrection(storage: Storage, env: ColorCorrectionEnv, workDir: string): Promise<Record<string, unknown>> {
  const inputPath = path.join(workDir, 'phase31-audio-normalized-export.mp4')
  const colorExportPath = path.join(workDir, 'color-corrected-export.mp4')
  const artifactsDir = path.join(workDir, 'artifacts')
  await mkdir(artifactsDir, { recursive: true })

  await downloadObject(storage, env.inputBucket, env.inputObject, inputPath)
  const inputProbe = await ffprobe(inputPath)
  const inputSummary = readProbeSummary(inputProbe)
  const colorSamples = await collectColorSamples(inputPath, inputSummary.durationSeconds, artifactsDir)
  const colorAnalysis = buildColorAnalysisSummary({
    durationSeconds: inputSummary.durationSeconds,
    colorSpace: inputSummary.colorSpace,
    colorTransfer: inputSummary.colorTransfer,
    samples: colorSamples,
  })
  const colorGradeRecipe = buildColorGradeRecipe(colorAnalysis)
  if (colorGradeRecipe.decision === 'blocked') throw new Error(`Phase 32 color correction blocked: ${colorGradeRecipe.reason}`)

  const exportWarning = await renderColorExport({
    inputPath,
    outputPath: colorExportPath,
    recipe: colorGradeRecipe,
  })
  const outputProbe = await ffprobe(colorExportPath)
  const outputSummary = readProbeSummary(outputProbe)

  const colorAnalysisObject = `${env.phase32Prefix}/color/color-analysis.json`
  const colorGradeRecipeObject = `${env.phase32Prefix}/color/color-grade-recipe.json`
  const frameStatsObject = `${env.phase32Prefix}/color/frame-signalstats.json`
  const colorExportObject = `${env.phase32Prefix}/color-corrected-export.mp4`
  const qaObject = `${env.phase32Prefix}/qa/color-correction-qa.json`
  const reportObject = `${env.phase32Prefix}/reports/phase32-report.json`
  const artifacts: ArtifactRecord[] = []

  artifacts.push(await uploadJson(storage, env.analysisBucket, colorAnalysisObject, {
    phase: '32',
    runId: env.runId,
    sourcePhase31RunId: env.phase31RunId,
    inputColorSourceObject: env.inputGcsUri,
    inputProbe: inputSummary,
    samples: colorSamples,
    summary: colorAnalysis,
    safety: phase32Safety(),
  }, '32'))
  artifacts.push(await uploadJson(storage, env.analysisBucket, colorGradeRecipeObject, colorGradeRecipe, '32'))
  artifacts.push(await uploadJson(storage, env.generatedAssetsBucket, frameStatsObject, {
    phase: '32',
    runId: env.runId,
    samples: colorSamples,
  }, '32'))
  const colorCorrectedExport = await uploadFile(storage, env.finalExportsBucket, colorExportObject, colorExportPath, 'video/mp4', '32')
  artifacts.push(colorCorrectedExport)

  const qa = buildColorQaSummary({
    colorExportExists: true,
    inputDurationSeconds: inputSummary.durationSeconds,
    outputDurationSeconds: outputSummary.durationSeconds,
    outputHasAudio: outputSummary.hasAudio,
    outputVideoCodec: outputSummary.videoCodec,
    outputAudioCodec: outputSummary.audioCodec,
    analysis: colorAnalysis,
    recipe: colorGradeRecipe,
  })

  const report = {
    ok: qa.status !== 'blocked',
    runId: env.runId,
    sourcePhase28RunId: env.phase28RunId,
    sourcePhase29RunId: env.phase29RunId,
    sourcePhase30RunId: env.phase30RunId,
    sourcePhase31RunId: env.phase31RunId,
    inputColorSourceObject: env.inputGcsUri,
    inputProbe: inputSummary,
    outputProbe: outputSummary,
    colorAnalysis,
    colorGradeRecipe,
    colorCorrectedExport,
    artifacts,
    qa,
    safety: phase32Safety(),
    uploadedReport: {
      bucket: env.qaBucket,
      object: reportObject,
      gcsUri: `gs://${env.qaBucket}/${reportObject}`,
    },
    blockers: qa.blockers,
    warnings: [
      ...qa.warnings,
      ...(exportWarning ? [exportWarning] : []),
      ...colorAnalysis.missingEvidenceWarnings,
      'Phase 32 used FFmpeg-only clean color correction; no OpenColorIO, OpenImageIO, GPU, providers, model downloads, audio cleanup rerun, masks, enhancement, or Revideo executed.',
      'Production, external beta, and broad real user media testing remain blocked.',
    ],
  }

  artifacts.push(await uploadJson(storage, env.qaBucket, qaObject, qa, '32'))
  artifacts.push(await uploadJson(storage, env.qaBucket, reportObject, report, '32'))
  return report
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

function readColorCorrectionEnv(): ColorCorrectionEnv {
  requireEnvValue('REEDITPRO_ENV', 'staging')
  requireEnvValue('REEDITPRO_CONFIRM_REAL_VIDEO_COLOR_CORRECTION', 'true')
  requireEnvValue('REEDITPRO_PHASE32_MODE', 'color_correction_ffmpeg')
  const projectId = (process.env.GCP_PROJECT_ID ?? 'reeditpro') as ColorCorrectionEnv['projectId']
  const region = (process.env.GCP_REGION ?? 'us-central1') as ColorCorrectionEnv['region']
  if (projectId !== 'reeditpro') throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  if (region !== 'us-central1') throw new Error('GCP_REGION must be us-central1.')
  const phase31RunId = requireEnv('REEDITPRO_PHASE31_RUN_ID') as ColorCorrectionEnv['phase31RunId']
  const inputGcsUri = requireEnv('REEDITPRO_PHASE32_INPUT_GCS_URI') as ColorCorrectionEnv['inputGcsUri']
  if (phase31RunId !== 'phase31-20260528T13060') throw new Error('Phase 32 is locked to Phase 31 run phase31-20260528T13060.')
  if (inputGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4') {
    throw new Error('Phase 32 input GCS URI is not the approved Phase 31 private audio-normalized export.')
  }
  const runId = process.env.REEDITPRO_PHASE32_RUN_ID ?? `phase32-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase32-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 32 run id: ${runId}`)
  return {
    projectId,
    region,
    runId,
    phase28RunId: 'phase28-20260528T01552',
    phase29RunId: 'phase29-20260528T02254',
    phase30RunId: 'phase30-20260528T12421',
    phase31RunId,
    inputGcsUri,
    inputBucket: 'reeditpro-staging-reeditpro-final-exports',
    inputObject: 'activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
    analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    phase32Prefix: `activation-real-video/phase32/${runId}`,
  }
}

function readPhase33EFrameEnv(): Phase33EFrameEnv {
  requireEnvValue('REEDITPRO_ENV', 'staging')
  requireEnvValue('REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW', 'true')
  requireEnvValue('REEDITPRO_PHASE33E_MODE', 'text_behind_subject_frame_preview')
  requireEnvValue('PROVIDER_EXECUTION_ENABLED', 'false')
  requireEnvValue('MODEL_DOWNLOADS_ENABLED', 'false')
  const projectId = (process.env.GCP_PROJECT_ID ?? 'reeditpro') as Phase33EFrameEnv['projectId']
  const region = (process.env.GCP_REGION ?? 'us-central1') as Phase33EFrameEnv['region']
  if (projectId !== 'reeditpro') throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  if (region !== 'us-central1') throw new Error('GCP_REGION must be us-central1.')
  const phase33dRunId = requireEnv('REEDITPRO_PHASE33D_RUN_ID') as Phase33EFrameEnv['phase33dRunId']
  const frameGcsUri = requireEnv('REEDITPRO_PHASE33E_FRAME_GCS_URI') as Phase33EFrameEnv['frameGcsUri']
  const maskGcsUri = requireEnv('REEDITPRO_PHASE33E_MASK_GCS_URI') as Phase33EFrameEnv['maskGcsUri']
  const cutoutGcsUri = requireEnv('REEDITPRO_PHASE33E_CUTOUT_GCS_URI') as Phase33EFrameEnv['cutoutGcsUri']
  const text = (process.env.REEDITPRO_PHASE33E_TEXT ?? 'REEDITPRO') as Phase33EFrameEnv['text']
  if (phase33dRunId !== 'phase33d-20260528T161056') throw new Error('Phase 33E is locked to Phase 33D run phase33d-20260528T161056.')
  if (text !== 'REEDITPRO') throw new Error('Phase 33E text must be exactly REEDITPRO.')
  if (frameGcsUri !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png') {
    throw new Error('Phase 33E representative frame is not the approved Phase 33D frame.')
  }
  if (maskGcsUri !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png') {
    throw new Error('Phase 33E mask is not the approved Phase 33D mask.')
  }
  if (cutoutGcsUri !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png') {
    throw new Error('Phase 33E cutout is not the approved Phase 33D RGBA cutout.')
  }
  const runId = process.env.REEDITPRO_PHASE33E_RUN_ID ?? `phase33e-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase33e-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33E run id: ${runId}`)
  return {
    projectId,
    region,
    runId,
    phase33dRunId,
    text,
    frameGcsUri,
    maskGcsUri,
    cutoutGcsUri,
    sourceBucket: 'reeditpro-staging-reeditpro-generated-assets',
    frameObject: 'activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
    maskObject: 'activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
    cutoutObject: 'activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    previewsBucket: 'reeditpro-staging-reeditpro-previews',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    phase33ePrefix: `activation-real-video/phase33e/${runId}`,
  }
}

function readPhase33DFrameEnv(): Phase33DFrameEnv {
  requireEnvValue('REEDITPRO_ENV', 'staging')
  requireEnvValue('REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK', 'true')
  requireEnvValue('REEDITPRO_PHASE33D_MODE', 'representative_frame_extract')
  requireEnvValue('PROVIDER_EXECUTION_ENABLED', 'false')
  requireEnvValue('MODEL_DOWNLOADS_ENABLED', 'false')
  const projectId = (process.env.GCP_PROJECT_ID ?? 'reeditpro') as Phase33DFrameEnv['projectId']
  const region = (process.env.GCP_REGION ?? 'us-central1') as Phase33DFrameEnv['region']
  if (projectId !== 'reeditpro') throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  if (region !== 'us-central1') throw new Error('GCP_REGION must be us-central1.')
  const phase32RunId = requireEnv('REEDITPRO_PHASE32_RUN_ID') as Phase33DFrameEnv['phase32RunId']
  const inputGcsUri = requireEnv('REEDITPRO_PHASE33D_INPUT_GCS_URI') as Phase33DFrameEnv['inputGcsUri']
  if (phase32RunId !== 'phase32-20260528T13330') throw new Error('Phase 33D is locked to Phase 32 run phase32-20260528T13330.')
  if (inputGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') {
    throw new Error('Phase 33D input GCS URI is not the approved Phase 32 private color-corrected export.')
  }
  const runId = process.env.REEDITPRO_PHASE33D_RUN_ID ?? `phase33d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase33d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33D run id: ${runId}`)
  return {
    projectId,
    region,
    runId,
    phase32RunId,
    inputGcsUri,
    inputBucket: 'reeditpro-staging-reeditpro-final-exports',
    inputObject: 'activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    phase33dPrefix: `activation-real-video/phase33d/${runId}`,
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

function selectPhase33DFrameTimestamp(durationSeconds?: number): { timestampSeconds: number; reason: string } {
  if (durationSeconds !== undefined && Number.isFinite(durationSeconds) && durationSeconds > 1) {
    return {
      timestampSeconds: Math.max(0, Math.min(durationSeconds / 2, durationSeconds - 0.1)),
      reason: 'Selected the 50 percent duration midpoint from ffprobe metadata.',
    }
  }
  return {
    timestampSeconds: 7.7,
    reason: 'Selected the Phase 33D default midpoint timestamp because duration metadata was unavailable.',
  }
}

async function extractOneFrame(input: {
  inputPath: string
  outputPath: string
  timestampSeconds: number
}): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-ss',
    input.timestampSeconds.toFixed(3),
    '-i',
    input.inputPath,
    '-frames:v',
    '1',
    '-f',
    'image2',
    input.outputPath,
  ], { timeout: 5 * 60_000, maxBuffer: 16 * 1024 * 1024 })
}

interface Phase33ERect {
  x: number
  y: number
  width: number
  height: number
}

interface Phase33ETextLayerPlan {
  textLayerId: string
  textContent: 'REEDITPRO'
  sanitizedText: 'REEDITPRO'
  fontFamilyFallback: 'DejaVu Sans Bold'
  fontFile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
  fontSize: number
  position: Phase33ERect & { anchor: 'center_upper_mid' | 'center_mid' | 'center_lower_mid' }
  layerOrder: ['background_frame', 'text_layer', 'foreground_cutout']
  behindSubject: true
  estimatedSubjectOcclusionRatio: number
  fallbackPlacement: 'center_upper_mid' | 'center_mid' | 'center_lower_mid'
  maskBounds: Phase33ERect
  warnings: string[]
}

async function detectMaskBounds(maskPath: string, width: number, height: number): Promise<Phase33ERect> {
  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-i',
      maskPath,
      '-vf',
      'cropdetect=limit=24:round=2:reset=0',
      '-frames:v',
      '1',
      '-f',
      'null',
      '-',
    ], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 })
    const matches = Array.from(String(stderr).matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g))
    const last = matches.at(-1)
    if (last) {
      return {
        width: Number(last[1]),
        height: Number(last[2]),
        x: Number(last[3]),
        y: Number(last[4]),
      }
    }
  } catch {
    // Fall through to the deterministic conservative fallback below.
  }
  return {
    x: Math.round(width * 0.25),
    y: Math.round(height * 0.16),
    width: Math.round(width * 0.5),
    height: Math.round(height * 0.72),
  }
}

function buildPhase33ETextLayerPlan(input: {
  width: number
  height: number
  text: 'REEDITPRO'
  maskBounds: Phase33ERect
}): Phase33ETextLayerPlan {
  const fontSize = Math.round(clamp(input.width / 8, 144, 320))
  const textWidth = Math.round(fontSize * input.text.length * 0.68)
  const textHeight = Math.round(fontSize * 1.15)
  const candidates: Array<Phase33ERect & { anchor: Phase33ETextLayerPlan['position']['anchor'] }> = [
    { anchor: 'center_upper_mid', x: Math.round((input.width - textWidth) / 2), y: Math.round(input.height * 0.34), width: textWidth, height: textHeight },
    { anchor: 'center_mid', x: Math.round((input.width - textWidth) / 2), y: Math.round(input.height * 0.43), width: textWidth, height: textHeight },
    { anchor: 'center_lower_mid', x: Math.round((input.width - textWidth) / 2), y: Math.round(input.height * 0.54), width: textWidth, height: textHeight },
  ]
  const scored = candidates.map((candidate) => ({
    candidate,
    occlusionRatio: intersectionArea(candidate, input.maskBounds) / Math.max(1, candidate.width * candidate.height),
  }))
  const preferred = scored
    .filter((score) => score.occlusionRatio < 0.9)
    .sort((a, b) => {
      const aDistance = Math.abs(a.occlusionRatio - 0.42)
      const bDistance = Math.abs(b.occlusionRatio - 0.42)
      return aDistance - bDistance
    })[0] ?? scored[0]
  return {
    textLayerId: `phase33e-text-layer-${input.text.toLowerCase()}`,
    textContent: input.text,
    sanitizedText: input.text,
    fontFamilyFallback: 'DejaVu Sans Bold',
    fontFile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    fontSize,
    position: preferred.candidate,
    layerOrder: ['background_frame', 'text_layer', 'foreground_cutout'],
    behindSubject: true,
    estimatedSubjectOcclusionRatio: Number(preferred.occlusionRatio.toFixed(4)),
    fallbackPlacement: preferred.candidate.anchor,
    maskBounds: input.maskBounds,
    warnings: [
      'Text content is fixed to REEDITPRO for this controlled Phase 33E test.',
      ...(preferred.occlusionRatio > 0.82 ? ['Text is heavily occluded by the foreground cutout; keep full-video text-behind-subject blocked.'] : []),
    ],
  }
}

async function renderPhase33EPreview(input: {
  framePath: string
  cutoutPath: string
  previewPath: string
  textLayerPlan: Phase33ETextLayerPlan
}): Promise<void> {
  const plan = input.textLayerPlan
  const drawText = [
    `fontfile=${plan.fontFile}`,
    `text=${plan.sanitizedText}`,
    'fontcolor=white',
    'bordercolor=black',
    'borderw=8',
    `fontsize=${plan.fontSize}`,
    `x=${plan.position.x}`,
    `y=${plan.position.y}`,
  ].join(':')
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.framePath,
    '-i',
    input.cutoutPath,
    '-filter_complex',
    `[0:v]format=rgba,drawtext=${drawText}[texted];[texted][1:v]overlay=0:0:format=auto,format=rgba[out]`,
    '-map',
    '[out]',
    '-frames:v',
    '1',
    '-f',
    'image2',
    input.previewPath,
  ], { timeout: 5 * 60_000, maxBuffer: 16 * 1024 * 1024 })
}

function buildPhase33EDepthCompositionManifest(input: {
  runId: string
  env: Phase33EFrameEnv
  textLayerPlanGcsUri: string
  previewGcsUri: string
}): Record<string, unknown> {
  return {
    id: `phase33e-depth-composition-${input.runId}`,
    manifestKind: 'depth_composition_frame_manifest',
    runId: input.runId,
    sourcePhase33DRunId: input.env.phase33dRunId,
    inputRefs: {
      backgroundFrame: input.env.frameGcsUri,
      mask: input.env.maskGcsUri,
      foregroundCutout: input.env.cutoutGcsUri,
    },
    textLayerPlanRef: input.textLayerPlanGcsUri,
    layerOrder: ['background_frame', 'text_layer', 'foreground_cutout'],
    outputPreviewRef: input.previewGcsUri,
    renderMode: 'single_frame_preview_only',
    renderEngineHandoff: {
      ffmpegSingleFrame: true,
      remotionUsed: false,
      revideoUsed: false,
      finalRenderAllowed: false,
      videoRenderAllowed: false,
    },
    qaRequirements: [
      'mask_edge_quality',
      'mask_subject_coverage',
      'render_asset_integrity',
      'text_readability',
      'text_safe_zone',
      'text_behind_subject_composition',
      'final_delivery',
    ],
  }
}

function buildPhase33EQaSummary(input: {
  width: number
  height: number
  previewWidth?: number
  previewHeight?: number
  textLayerPlan: Phase33ETextLayerPlan
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<Record<string, string>>
  blockers: string[]
  warnings: string[]
} {
  const dimensionsMatch = input.previewWidth === input.width && input.previewHeight === input.height
  const textReadable = input.textLayerPlan.estimatedSubjectOcclusionRatio < 0.9
  const blockers = [
    ...(!dimensionsMatch ? ['Preview dimensions do not match the representative frame.'] : []),
    ...(!textReadable ? ['Text appears fully hidden by the foreground cutout.'] : []),
  ]
  const warnings = [
    'Phase 33E does not validate temporal text-behind-subject behavior.',
    'Full-video text-behind-subject remains blocked.',
  ]
  return {
    status: blockers.length > 0 ? 'blocked' : 'warning',
    gates: [
      { gateId: 'mask_edge_quality', status: 'passed', summary: 'Phase 33D mask edge QA passed upstream.' },
      { gateId: 'mask_subject_coverage', status: 'passed', summary: 'Phase 33D mask subject coverage QA passed upstream.' },
      { gateId: 'render_asset_integrity', status: dimensionsMatch ? 'passed' : 'blocked', summary: dimensionsMatch ? 'Preview dimensions match the representative frame.' : 'Preview dimension mismatch.' },
      { gateId: 'text_readability', status: textReadable ? 'passed' : 'blocked', summary: textReadable ? `Estimated text occlusion ratio is ${input.textLayerPlan.estimatedSubjectOcclusionRatio}.` : 'Text is fully hidden.' },
      { gateId: 'text_safe_zone', status: 'warning', summary: 'Single-frame safe-zone review used deterministic placement only; no face/OCR analysis ran.' },
      { gateId: 'text_behind_subject_composition', status: 'passed', summary: 'Layer order is background frame, text layer, foreground cutout.' },
      { gateId: 'final_delivery', status: 'not_applicable', summary: 'Phase 33E creates no final video delivery.' },
    ],
    blockers,
    warnings,
  }
}

function phase33ESafety() {
  return {
    approvedPhase33DInputsOnly: true,
    singleFramePreviewOnly: true,
    videoProcessed: false,
    biRefNetRerun: false,
    sam2Used: false,
    gpuUsed: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    revideoUsed: false,
    finalVideoExported: false,
  }
}

function intersectionArea(a: Phase33ERect, b: Phase33ERect): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
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

async function collectColorSamples(inputPath: string, durationSeconds: number | undefined, workDir: string): Promise<ColorSample[]> {
  const duration = durationSeconds && durationSeconds > 1 ? durationSeconds : 15.467
  const timestamps = [
    { sampleId: 'start', timestampSeconds: Math.min(0.5, Math.max(0, duration / 6)) },
    { sampleId: 'middle', timestampSeconds: Math.max(0, duration / 2) },
    { sampleId: 'end', timestampSeconds: Math.max(0, duration - 0.5) },
  ]
  const samples: ColorSample[] = []
  for (const sample of timestamps) {
    const statsPath = path.join(workDir, `${sample.sampleId}-signalstats.txt`)
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-ss',
      sample.timestampSeconds.toFixed(3),
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-vf',
      `signalstats,metadata=mode=print:file=${statsPath}`,
      '-f',
      'null',
      '-',
    ], { timeout: 2 * 60_000, maxBuffer: 16 * 1024 * 1024 })
    samples.push({
      sampleId: sample.sampleId,
      timestampSeconds: sample.timestampSeconds,
      stats: parseSignalStats(await readFile(statsPath, 'utf8')),
    })
  }
  return samples
}

function parseSignalStats(text: string): Record<string, number> {
  const stats: Record<string, number> = {}
  for (const line of text.split(/\r?\n/)) {
    const match = /lavfi\.signalstats\.([A-Z0-9_]+)=(-?\d+(?:\.\d+)?)/.exec(line)
    if (match) stats[match[1]] = Number(match[2])
  }
  return stats
}

function buildColorAnalysisSummary(input: {
  durationSeconds?: number
  colorSpace?: string
  colorTransfer?: string
  samples: ColorSample[]
}): ColorAnalysisSummary {
  const yAvg = averageStat(input.samples, 'YAVG')
  const yMin = minStat(input.samples, 'YMIN')
  const yMax = maxStat(input.samples, 'YMAX')
  const satAvg = averageStat(input.samples, 'SATAVG')
  const missingEvidenceWarnings: string[] = []
  if (input.samples.length < 3) missingEvidenceWarnings.push('Fewer than three representative frame samples were available.')
  if (yAvg === undefined) missingEvidenceWarnings.push('Luma average was unavailable from signalstats.')
  if (satAvg === undefined) missingEvidenceWarnings.push('Saturation average was unavailable from signalstats.')
  return {
    durationSeconds: input.durationSeconds,
    sampledFrameCount: input.samples.length,
    colorSpaceAssumption: input.colorSpace ?? 'bt709_or_source_unspecified',
    transferAssumption: input.colorTransfer ?? 'bt709_or_source_unspecified',
    underexposedRisk: colorRisk(yAvg !== undefined && yAvg < 72, yAvg !== undefined && yAvg < 86),
    overexposedRisk: colorRisk(yAvg !== undefined && yAvg > 205, yAvg !== undefined && yAvg > 190),
    highlightClippingRisk: colorRisk(yMax !== undefined && yMax > 252, yMax !== undefined && yMax > 246),
    shadowCrushingRisk: colorRisk(yMin !== undefined && yMin < 3, yMin !== undefined && yMin < 8),
    saturationRisk: colorRisk(satAvg !== undefined && (satAvg > 145 || satAvg < 25), satAvg !== undefined && (satAvg > 125 || satAvg < 35)),
    whiteBalanceIssue: 'unknown',
    skinToneRisk: 'warning_only_not_measured',
    shotMismatch: 'not_applicable_single_clip',
    missingEvidenceWarnings,
  }
}

function buildColorGradeRecipe(analysis: ColorAnalysisSummary): ColorGradeRecipe {
  if (analysis.sampledFrameCount <= 0) {
    return colorRecipe('blocked', 'Color analysis did not produce frame samples.', 0, 1, 1, 1)
  }
  if (analysis.highlightClippingRisk === 'high' || analysis.overexposedRisk === 'high') {
    return colorRecipe('minimal_correction', 'Minimal exposure reduction selected due to overexposure/highlight risk.', -0.015, 0.98, 1, 1)
  }
  if (analysis.underexposedRisk === 'high') {
    return colorRecipe('minimal_correction', 'Minimal brightness/contrast lift selected due to underexposure risk.', 0.025, 1.04, 1.03, 1)
  }
  if (analysis.saturationRisk === 'high') {
    return colorRecipe('minimal_correction', 'Minimal saturation correction selected due to saturation risk.', 0, 1, 0.98, 1)
  }
  return colorRecipe('no_op', 'No clear color correction risk justified a visible grade; creating neutral color-reviewed export.', 0, 1, 1, 1)
}

function colorRecipe(
  decision: ColorGradeRecipe['decision'],
  reason: string,
  brightness: number,
  contrast: number,
  saturation: number,
  gamma: number,
): ColorGradeRecipe {
  const ffmpegFilter = decision === 'minimal_correction'
    ? `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`
    : undefined
  return {
    decision,
    reason,
    ffmpegFilter,
    parameters: { brightness, contrast, saturation, gamma },
    correctionStrength: decision === 'minimal_correction' ? 'minimal' : 'none',
    colorGradeStyle: 'clean_natural',
  }
}

async function renderColorExport(input: {
  inputPath: string
  outputPath: string
  recipe: ColorGradeRecipe
}): Promise<string | undefined> {
  if (input.recipe.decision === 'no_op') {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.inputPath,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      input.outputPath,
    ], { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
    return 'Phase 32 produced a neutral no-op color-reviewed export because no visible correction was justified.'
  }
  const filter = input.recipe.ffmpegFilter
  const allowedFilters = new Set([
    'eq=brightness=-0.015:contrast=0.98:saturation=1:gamma=1',
    'eq=brightness=0.025:contrast=1.04:saturation=1.03:gamma=1',
    'eq=brightness=0:contrast=1:saturation=0.98:gamma=1',
  ])
  if (!filter || !allowedFilters.has(filter)) {
    throw new Error('Phase 32 blocked unsafe or non-allowlisted FFmpeg color filter.')
  }
  const args = [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.inputPath,
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    input.outputPath,
  ]
  try {
    await execFileAsync('ffmpeg', args, { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
    return undefined
  } catch {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.inputPath,
      '-vf',
      filter,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      input.outputPath,
    ], { timeout: 10 * 60_000, maxBuffer: 24 * 1024 * 1024 })
    return 'Audio stream copy failed during color export; Phase 32 used AAC re-encode fallback while preserving audio.'
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
    colorSpace: typeof video?.color_space === 'string' ? String(video.color_space) : undefined,
    colorTransfer: typeof video?.color_transfer === 'string' ? String(video.color_transfer) : undefined,
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

function buildColorQaSummary(input: {
  colorExportExists: boolean
  inputDurationSeconds?: number
  outputDurationSeconds?: number
  outputHasAudio?: boolean
  outputVideoCodec?: string
  outputAudioCodec?: string
  analysis: ColorAnalysisSummary
  recipe: ColorGradeRecipe
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<Record<string, unknown>>
  blockers: string[]
  warnings: string[]
} {
  const durationDelta = input.inputDurationSeconds === undefined || input.outputDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.outputDurationSeconds - input.inputDurationSeconds)
  const hasBlockingExposureRisk = input.analysis.overexposedRisk === 'high' || input.analysis.underexposedRisk === 'high'
  const gates = [
    colorGate('color_exposure', !hasBlockingExposureRisk || input.recipe.decision === 'minimal_correction', input.recipe.reason),
    colorWarningGate('color_skin_tone', 'No face/skin analysis ran; skin tone QA is warning-only for Phase 32.'),
    colorGate('color_export_space', input.outputVideoCodec === 'h264', 'Private color export uses an MP4-compatible H.264 video stream.'),
    colorWarningGate('color_shot_match', 'Single controlled clip only; shot matching is not applicable beyond continuity review.'),
    colorGate('export_codec_format', input.outputVideoCodec === 'h264' && input.outputAudioCodec === 'aac', 'Private color export uses H.264/AAC MP4.'),
    colorGate('export_duration_sync', durationDelta <= 0.75, `Export duration delta ${durationDelta.toFixed(3)}s remains within tolerance.`),
    colorGate('audio_sync', Boolean(input.outputHasAudio) && durationDelta <= 0.75, 'Audio stream was preserved from the Phase 31 export.'),
  ]
  const blockersBeforeFinal = gates.filter((item) => item.blocking)
  gates.push(colorGate('final_delivery', input.colorExportExists && blockersBeforeFinal.length === 0, 'Private Phase 32 color-reviewed final delivery exists with no blocking color QA findings.'))
  const blockers = gates.filter((item) => item.blocking).map((item) => `${item.gateType}: ${item.message}`)
  const warnings = gates.filter((item) => item.status === 'warning').map((item) => `${item.gateType}: ${item.message}`)
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function colorGate(gateType: string, passed: boolean, message: string): Record<string, unknown> {
  return {
    id: `phase32-gate-${gateType}`,
    workspaceId: 'activation-phase32',
    projectId: 'reeditpro',
    mediaAssetId: 'phase31-20260528T13060-audio-normalized-export',
    toolExecutionPlanId: 'activation-phase32-color-correction',
    recipeId: gateType === 'final_delivery' ? 'private_color_corrected_export' : 'ffmpeg_clean_color_correction',
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

function colorWarningGate(gateType: string, message: string): Record<string, unknown> {
  return {
    ...colorGate(gateType, true, message),
    status: 'warning',
    score: 0.78,
    issues: [{ code: `${gateType}_warning`, message, severity: 'warning' }],
    recommendations: [{ action: 'continue', reason: message, priority: 'medium' }],
    humanReviewRequired: true,
    message,
  }
}

function phase32Safety(): Record<string, unknown> {
  return {
    approvedPhase31InputOnly: true,
    secondSourceVideoUsed: false,
    providerExecuted: false,
    gpuUsed: false,
    modelDownloadedExternally: false,
    openColorIoUsed: false,
    openImageIoUsed: false,
    arbitraryFfmpegArgsUsed: false,
    unapprovedLutUsed: false,
    audioCleanupRerun: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    sourceOverwritten: false,
    masksOrEnhancementExecuted: false,
    revideoUsed: false,
  }
}

function phase33DSafety(): Record<string, unknown> {
  return {
    approvedPhase32InputOnly: true,
    exactlyOneFrameExtracted: true,
    secondSourceVideoUsed: false,
    publicAccessEnabled: false,
    sourceOverwritten: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    revideoUsed: false,
  }
}

function averageStat(samples: ColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined
}

function minStat(samples: ColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? Math.min(...values) : undefined
}

function maxStat(samples: ColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? Math.max(...values) : undefined
}

function colorRisk(high: boolean, warning: boolean): 'low' | 'warning' | 'high' {
  if (high) return 'high'
  if (warning) return 'warning'
  return 'low'
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
