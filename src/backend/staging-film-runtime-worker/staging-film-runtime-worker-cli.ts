import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface GeneratedRuntimeEnv {
  projectId: 'reeditpro'
  jobName: 'reeditpro-staging-film-runtime-job'
  runId: string
  mode: 'generated_frame_interpolation'
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/'
  artifactRuntimePath: '/tmp/reeditpro-model-weights/film/film-net-style-saved-model'
  kerasMetadataSha256: '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853'
  savedModelSha256: '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985'
  variablesDataSha256: '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9'
  variablesIndexSha256: 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5'
  aggregateSha256: '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefix: string
}

interface RealVideoRuntimeEnv extends Omit<GeneratedRuntimeEnv, 'runId' | 'mode' | 'artifactPrefix'> {
  runId: string
  mode: 'real_video_slowmotion_sample'
  inputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  planSnapshotGcsUri: string
  segmentStartSeconds: 6.9835
  segmentEndSeconds: 8.4835
  segmentDurationSeconds: 1.5
  sourceFrameFps: 6
  sourceFrameCount: 9
  maxSourceFrames: 12
  frameWidth: 512
  frameHeight: 288
  outputFrameCount: 17
  maxOutputFrames: 24
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactPrefix: string
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

interface PythonGeneratedOutput {
  ok: boolean
  tensorflowVersion: string
  modelLoaded: boolean
  networkBlocked: boolean
  fixture: {
    width: number
    height: number
    frameCount: 2
    framePaths: string[]
    interpolationTime: 0.5
  }
  interpolation: {
    interpolatedFramePaths: string[]
    metrics: {
      meanAbsoluteDiffFromFrameA: number
      meanAbsoluteDiffFromFrameB: number
      outputStddev: number
    }
  }
  runtime: {
    externalModelDownloadAttempted: false
    realMediaUsed: false
    fullVideoInterpolationExecuted: false
    slowMotionExecuted: false
  }
  warnings: string[]
}

interface PythonRealVideoOutput {
  ok: boolean
  tensorflowVersion: string
  modelLoaded: boolean
  networkBlocked: boolean
  sourceFrames: {
    width: number
    height: number
    frameCount: number
    framePaths: string[]
    interpolationTime: 0.5
  }
  interpolation: {
    interpolatedFramePaths: string[]
    previewFramePaths: string[]
    metrics: {
      meanMidpointDiffFromPreviousSource: number
      meanMidpointDiffFromNextSource: number
      meanOutputStddev: number
    }
  }
  runtime: {
    externalModelDownloadAttempted: false
    fullVideoInterpolationExecuted: false
    audioStretchExecuted: false
    finalDeliveryCreated: false
  }
  warnings: string[]
}

interface ProbeResult {
  durationSeconds: number
  hasAudio: boolean
  width: number
  height: number
}

const expectedFiles = [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
] as const

async function main(): Promise<void> {
  const mode = process.env.REEDITPRO_FILM_RUNTIME_MODE
  if (mode === 'generated_frame_interpolation') {
    await mainGeneratedFrameInterpolation()
    return
  }
  if (mode === 'real_video_slowmotion_sample') {
    await mainRealVideoSlowmotionSample()
    return
  }
  throw new Error(`Blocked FILM runtime mode: ${mode ?? 'missing'}`)
}

async function mainGeneratedFrameInterpolation(): Promise<void> {
  const env = readGeneratedRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-film-runtime-${env.runId}`)
  const modelDir = env.artifactRuntimePath
  const pythonOutputPath = path.join(workDir, 'film-runtime-output.json')

  await resetWorkDirs(workDir, modelDir)
  try {
    const copiedFiles = await syncApprovedModel(storage, env, modelDir)
    const checksumResult = await verifyChecksums(modelDir, env)
    const inference = await runGeneratedFilmInterpolation({
      workDir,
      modelPath: path.join(modelDir, 'film_net/Style/saved_model'),
      outputPath: pythonOutputPath,
    })

    const artifacts: ArtifactRecord[] = []
    const frameArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.fixture.framePaths) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/${path.basename(framePath)}`, framePath, 'image/png', env.runId, '38C')
      frameArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const interpolationArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.interpolation.interpolatedFramePaths) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/${path.basename(framePath)}`, framePath, 'image/png', env.runId, '38C')
      interpolationArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const fixtureManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/fixture-manifest.json`, {
      phase: '38C',
      runId: env.runId,
      generatedFramesOnly: true,
      width: inference.fixture.width,
      height: inference.fixture.height,
      frameCount: inference.fixture.frameCount,
      interpolationTime: inference.fixture.interpolationTime,
      frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
      subject: 'Generated geometric subject moving across a synthetic background.',
    }, env.runId, '38C')
    const interpolationManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/interpolation-sequence-manifest.json`, {
      phase: '38C',
      runId: env.runId,
      interpolationTime: inference.fixture.interpolationTime,
      interpolatedFrameUris: interpolationArtifacts.map((artifact) => artifact.gcsUri),
      metrics: inference.interpolation.metrics,
    }, env.runId, '38C')
    const checksumArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId, '38C')
    const runtimeMetadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/film-runtime-metadata.json`, {
      phase: '38C',
      runId: env.runId,
      tensorflowVersion: inference.tensorflowVersion,
      modelLoaded: inference.modelLoaded,
      networkBlocked: inference.networkBlocked,
      copiedFiles,
      checksumResult,
      safety: generatedRuntimeSafety(),
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
    }, env.runId, '38C')
    artifacts.push(fixtureManifestArtifact, interpolationManifestArtifact, checksumArtifact, runtimeMetadataArtifact)

    const qa = buildGeneratedQa(env, inference, frameArtifacts.length, interpolationArtifacts.length)
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/film-runtime-qa.json`, {
      phase: '38C',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    }, env.runId, '38C')
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase38c-report.json`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
      compute: {
        mode: 'cpu',
        cpu: 4,
        memory: '8Gi',
        gpuRequested: false,
      },
      model: {
        toolId: 'film',
        artifactId: 'film_net_style_saved_model',
        gcsPath: env.artifactGcsPath,
        runtimePath: env.artifactRuntimePath,
        kerasMetadataSha256: checksumResult.kerasMetadataSha256,
        savedModelSha256: checksumResult.savedModelSha256,
        variablesDataSha256: checksumResult.variablesDataSha256,
        variablesIndexSha256: checksumResult.variablesIndexSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      fixture: {
        generated: true,
        width: inference.fixture.width,
        height: inference.fixture.height,
        frameCount: 2,
        interpolationTime: 0.5,
        frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
        manifestUri: fixtureManifestArtifact.gcsUri,
      },
      interpolation: {
        status: inference.ok ? 'completed' : 'failed',
        interpolatedFrameCount: interpolationArtifacts.length,
        interpolatedFrameUris: interpolationArtifacts.map((artifact) => artifact.gcsUri),
        metrics: inference.interpolation.metrics,
      },
      qa,
      artifacts,
      safety: generatedRuntimeSafety(),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...inference.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, env.runId, '38C')
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, modelDir)
  }
}

async function mainRealVideoSlowmotionSample(): Promise<void> {
  const env = readRealVideoRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-film-real-video-${env.runId}`)
  const modelDir = env.artifactRuntimePath
  const videoPath = path.join(workDir, 'source', 'color-corrected-export.mp4')
  const framesDir = path.join(workDir, 'segment-frames')
  const pythonOutputPath = path.join(workDir, 'film-real-video-output.json')
  const previewMp4Path = path.join(workDir, 'preview', 'film-slowmotion-preview.mp4')

  await resetWorkDirs(workDir, modelDir)
  try {
    const copiedFiles = await syncApprovedModel(storage, env, modelDir)
    const checksumResult = await verifyChecksums(modelDir, env)
    const planSnapshot = await downloadJson(storage, env.planSnapshotGcsUri)
    validatePlanSnapshot(env, planSnapshot)
    await downloadGcsUri(storage, env.inputVideoGcsUri, videoPath)
    const sourceProbe = await ffprobeVideo(videoPath)
    const extractedFrames = await extractSegmentFrames(env, videoPath, framesDir)
    const inference = await runRealVideoFilmInterpolation({
      framesDir,
      workDir,
      modelPath: path.join(modelDir, 'film_net/Style/saved_model'),
      outputPath: pythonOutputPath,
    })
    const previewResult = await assemblePreviewMp4(inference.interpolation.previewFramePaths, previewMp4Path)

    const artifacts: ArtifactRecord[] = []
    const sourceFrameArtifacts: ArtifactRecord[] = []
    for (const framePath of extractedFrames) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/segment/frames/${path.basename(framePath)}`, framePath, 'image/png', env.runId, '38D')
      sourceFrameArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const interpolatedArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.interpolation.interpolatedFramePaths) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/${path.basename(framePath)}`, framePath, 'image/png', env.runId, '38D')
      interpolatedArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const previewFrameArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.interpolation.previewFramePaths) {
      const artifact = await uploadFile(storage, env.previewsBucket, `${env.artifactPrefix}/preview-frames/${path.basename(framePath)}`, framePath, 'image/png', env.runId, '38D')
      previewFrameArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    let previewMp4Artifact: ArtifactRecord | undefined
    if (previewResult.status === 'completed') {
      previewMp4Artifact = await uploadFile(storage, env.previewsBucket, `${env.artifactPrefix}/preview/film-slowmotion-preview.mp4`, previewMp4Path, 'video/mp4', env.runId, '38D')
      artifacts.push(previewMp4Artifact)
    }

    const planSnapshotArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/plan/approved-plan-snapshot-copy.json`, planSnapshot, env.runId, '38D')
    const sourceValidationArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/source/source-validation.json`, {
      phase: '38D',
      runId: env.runId,
      inputVideoGcsUri: env.inputVideoGcsUri,
      sourceProbe,
      approvedSourceOnly: true,
    }, env.runId, '38D')
    const segmentManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/segment/segment-manifest.json`, {
      phase: '38D',
      runId: env.runId,
      startSeconds: env.segmentStartSeconds,
      endSeconds: env.segmentEndSeconds,
      durationSeconds: env.segmentDurationSeconds,
      sourceFrameFps: env.sourceFrameFps,
      sourceFrameCount: sourceFrameArtifacts.length,
      width: env.frameWidth,
      height: env.frameHeight,
      sourceFrameUris: sourceFrameArtifacts.map((artifact) => artifact.gcsUri),
      reason: 'Deterministic segment centered on approved visual anchor timestamp 7.7335s.',
    }, env.runId, '38D')
    const interpolationManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/interpolation-sequence-manifest.json`, {
      phase: '38D',
      runId: env.runId,
      pairwiseMidpointOnly: true,
      interpolationTime: 0.5,
      interpolatedFrameUris: interpolatedArtifacts.map((artifact) => artifact.gcsUri),
      previewFrameUris: previewFrameArtifacts.map((artifact) => artifact.gcsUri),
      metrics: inference.interpolation.metrics,
    }, env.runId, '38D')
    const checksumArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId, '38D')
    const runtimeMetadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/film-real-video-runtime-metadata.json`, {
      phase: '38D',
      runId: env.runId,
      tensorflowVersion: inference.tensorflowVersion,
      modelLoaded: inference.modelLoaded,
      networkBlocked: inference.networkBlocked,
      copiedFiles,
      checksumResult,
      sourceProbe,
      previewResult,
      safety: realVideoRuntimeSafety(),
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
    }, env.runId, '38D')
    artifacts.push(planSnapshotArtifact, sourceValidationArtifact, segmentManifestArtifact, interpolationManifestArtifact, checksumArtifact, runtimeMetadataArtifact)

    const qa = buildRealVideoQa(env, inference, sourceProbe, sourceFrameArtifacts.length, interpolatedArtifacts.length, previewFrameArtifacts.length, previewResult)
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/film-real-video-slowmotion-qa.json`, {
      phase: '38D',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    }, env.runId, '38D')
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase38d-report.json`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
      compute: {
        mode: 'cpu',
        cpu: 4,
        memory: '8Gi',
        gpuRequested: false,
      },
      source: {
        inputVideoGcsUri: env.inputVideoGcsUri,
        durationSeconds: sourceProbe.durationSeconds,
        hasAudio: sourceProbe.hasAudio,
        width: sourceProbe.width,
        height: sourceProbe.height,
      },
      planSnapshot: {
        gcsUri: env.planSnapshotGcsUri,
        rawPromptExecution: false,
        validated: true,
      },
      segment: {
        startSeconds: env.segmentStartSeconds,
        endSeconds: env.segmentEndSeconds,
        durationSeconds: env.segmentDurationSeconds,
        sourceFrameFps: env.sourceFrameFps,
        sourceFrameCount: sourceFrameArtifacts.length,
        width: env.frameWidth,
        height: env.frameHeight,
        sourceFrameUris: sourceFrameArtifacts.map((artifact) => artifact.gcsUri),
        manifestUri: segmentManifestArtifact.gcsUri,
      },
      model: {
        artifactId: 'film_net_style_saved_model',
        gcsPath: env.artifactGcsPath,
        runtimePath: env.artifactRuntimePath,
        kerasMetadataSha256: checksumResult.kerasMetadataSha256,
        savedModelSha256: checksumResult.savedModelSha256,
        variablesDataSha256: checksumResult.variablesDataSha256,
        variablesIndexSha256: checksumResult.variablesIndexSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      interpolation: {
        status: inference.ok ? 'completed' : 'failed',
        interpolatedFrameCount: interpolatedArtifacts.length,
        outputFrameCount: previewFrameArtifacts.length,
        interpolatedFrameUris: interpolatedArtifacts.map((artifact) => artifact.gcsUri),
        previewFrameUris: previewFrameArtifacts.map((artifact) => artifact.gcsUri),
        metrics: inference.interpolation.metrics,
      },
      preview: {
        previewFrameCount: previewFrameArtifacts.length,
        previewMp4Status: previewResult.status,
        previewMp4Uri: previewMp4Artifact?.gcsUri,
        blocker: previewResult.blocker,
      },
      qa,
      artifacts,
      safety: realVideoRuntimeSafety(),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...inference.warnings, ...qa.warnings, previewResult.blocker].filter(Boolean))),
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, env.runId, '38D')
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, modelDir)
  }
}

function readGeneratedRuntimeEnv(): GeneratedRuntimeEnv {
  const runId = requireString('REEDITPRO_PHASE38C_RUN_ID')
  const env = {
    projectId: 'reeditpro',
    jobName: 'reeditpro-staging-film-runtime-job',
    runId,
    mode: requireString('REEDITPRO_FILM_RUNTIME_MODE'),
    artifactGcsPath: requireString('REEDITPRO_FILM_ARTIFACT_GCS_PATH'),
    artifactRuntimePath: requireString('REEDITPRO_FILM_ARTIFACT_RUNTIME_PATH'),
    kerasMetadataSha256: requireString('REEDITPRO_FILM_KERAS_METADATA_SHA256'),
    savedModelSha256: requireString('REEDITPRO_FILM_SAVED_MODEL_SHA256'),
    variablesDataSha256: requireString('REEDITPRO_FILM_VARIABLES_DATA_SHA256'),
    variablesIndexSha256: requireString('REEDITPRO_FILM_VARIABLES_INDEX_SHA256'),
    aggregateSha256: requireString('REEDITPRO_FILM_AGGREGATE_SHA256'),
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    artifactPrefix: `activation-film-runtime/phase38c/${runId}`,
  } as GeneratedRuntimeEnv
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_FILM_RUNTIME !== 'true') throw new Error('REEDITPRO_CONFIRM_FILM_RUNTIME=true is required.')
  if (env.mode !== 'generated_frame_interpolation') throw new Error(`Blocked FILM runtime mode: ${env.mode}`)
  if (env.artifactGcsPath !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/') throw new Error('Only the approved Phase 38B FILM artifact path is allowed.')
  if (process.env.GENERATED_FRAMES_ONLY !== 'true') throw new Error('GENERATED_FRAMES_ONLY=true is required.')
  if ((process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') throw new Error('Provider execution must be disabled.')
  if ((process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') throw new Error('Real media input must be disabled.')
  if ((process.env.REVIDEO_ENABLED ?? 'false') !== 'false') throw new Error('Revideo must be disabled.')
  if ((process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') throw new Error('Production ready must remain false.')
  if ((process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') throw new Error('External beta must remain false.')
  if ((process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') throw new Error('Broad real media must remain false.')
  assertExpectedHashes(env)
  assertSafeRunId(runId, '38C')
  return env
}

function readRealVideoRuntimeEnv(): RealVideoRuntimeEnv {
  const runId = requireString('REEDITPRO_PHASE38D_RUN_ID')
  const env = {
    projectId: 'reeditpro',
    jobName: 'reeditpro-staging-film-runtime-job',
    runId,
    mode: requireString('REEDITPRO_FILM_RUNTIME_MODE'),
    inputVideoGcsUri: requireString('REEDITPRO_PHASE38D_INPUT_VIDEO_GCS_URI'),
    planSnapshotGcsUri: requireString('REEDITPRO_PHASE38D_PLAN_SNAPSHOT_GCS_URI'),
    segmentStartSeconds: Number(requireString('REEDITPRO_PHASE38D_SEGMENT_START_SECONDS')),
    segmentEndSeconds: Number(requireString('REEDITPRO_PHASE38D_SEGMENT_END_SECONDS')),
    segmentDurationSeconds: Number(requireString('REEDITPRO_PHASE38D_SEGMENT_DURATION_SECONDS')),
    sourceFrameFps: Number(requireString('REEDITPRO_PHASE38D_SOURCE_FRAME_FPS')),
    sourceFrameCount: Number(requireString('REEDITPRO_PHASE38D_SOURCE_FRAME_COUNT')),
    maxSourceFrames: Number(requireString('REEDITPRO_PHASE38D_MAX_SOURCE_FRAMES')),
    frameWidth: Number(requireString('REEDITPRO_PHASE38D_FRAME_WIDTH')),
    frameHeight: Number(requireString('REEDITPRO_PHASE38D_FRAME_HEIGHT')),
    outputFrameCount: Number(requireString('REEDITPRO_PHASE38D_OUTPUT_FRAME_COUNT')),
    maxOutputFrames: Number(requireString('REEDITPRO_PHASE38D_MAX_OUTPUT_FRAMES')),
    artifactGcsPath: requireString('REEDITPRO_FILM_ARTIFACT_GCS_PATH'),
    artifactRuntimePath: requireString('REEDITPRO_FILM_ARTIFACT_RUNTIME_PATH'),
    kerasMetadataSha256: requireString('REEDITPRO_FILM_KERAS_METADATA_SHA256'),
    savedModelSha256: requireString('REEDITPRO_FILM_SAVED_MODEL_SHA256'),
    variablesDataSha256: requireString('REEDITPRO_FILM_VARIABLES_DATA_SHA256'),
    variablesIndexSha256: requireString('REEDITPRO_FILM_VARIABLES_INDEX_SHA256'),
    aggregateSha256: requireString('REEDITPRO_FILM_AGGREGATE_SHA256'),
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    previewsBucket: 'reeditpro-staging-reeditpro-previews',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
    artifactPrefix: `activation-film-runtime/phase38d/${runId}`,
  } as RealVideoRuntimeEnv
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV must be staging.')
  if (process.env.REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION !== 'true') throw new Error('REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true is required.')
  if (env.mode !== 'real_video_slowmotion_sample') throw new Error(`Blocked FILM runtime mode: ${env.mode}`)
  if (env.inputVideoGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') throw new Error('Only the approved Phase 32 private export is allowed.')
  if (env.artifactGcsPath !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/') throw new Error('Only the approved Phase 38B FILM artifact path is allowed.')
  if (env.segmentStartSeconds !== 6.9835 || env.segmentEndSeconds !== 8.4835 || env.segmentDurationSeconds > 1.5) throw new Error('Phase 38D segment bounds are not approved.')
  if (env.sourceFrameFps !== 6 || env.sourceFrameCount !== 9 || env.maxSourceFrames > 12) throw new Error('Phase 38D source frame plan is not approved.')
  if (env.frameWidth > 512 || env.frameHeight > 288 || env.outputFrameCount > 17 || env.maxOutputFrames > 24) throw new Error('Phase 38D frame dimensions/output count are not approved.')
  if ((process.env.MODEL_DOWNLOADS_ENABLED ?? 'false') !== 'false') throw new Error('Runtime model downloads must be disabled.')
  if ((process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') throw new Error('Provider execution must be disabled.')
  if ((process.env.FULL_VIDEO_INTERPOLATION_ENABLED ?? 'false') !== 'false') throw new Error('Full-video interpolation must be disabled.')
  if ((process.env.AUDIO_STRETCH_ENABLED ?? 'false') !== 'false') throw new Error('Audio stretch must be disabled.')
  if ((process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') throw new Error('Final delivery must be disabled.')
  if ((process.env.REVIDEO_ENABLED ?? 'false') !== 'false') throw new Error('Revideo must be disabled.')
  if ((process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') throw new Error('Public access must be disabled.')
  if ((process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') throw new Error('Production ready must remain false.')
  if ((process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') throw new Error('External beta must remain false.')
  if ((process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') throw new Error('Broad real media must remain false.')
  assertExpectedHashes(env)
  assertSafeRunId(runId, '38D')
  return env
}

async function syncApprovedModel(storage: Storage, env: GeneratedRuntimeEnv | RealVideoRuntimeEnv, modelDir: string): Promise<string[]> {
  const { bucket, prefix } = parseGcsPrefix(env.artifactGcsPath)
  const copied: string[] = []
  for (const relativePath of expectedFiles) {
    const destination = path.join(modelDir, relativePath)
    await mkdir(path.dirname(destination), { recursive: true })
    await storage.bucket(bucket).file(`${prefix}${relativePath}`).download({ destination })
    copied.push(relativePath)
  }
  return copied
}

async function verifyChecksums(modelDir: string, env: GeneratedRuntimeEnv | RealVideoRuntimeEnv) {
  const results = {
    kerasMetadataSha256: await sha256File(path.join(modelDir, 'film_net/Style/saved_model/keras_metadata.pb')),
    savedModelSha256: await sha256File(path.join(modelDir, 'film_net/Style/saved_model/saved_model.pb')),
    variablesDataSha256: await sha256File(path.join(modelDir, 'film_net/Style/saved_model/variables/variables.data-00000-of-00001')),
    variablesIndexSha256: await sha256File(path.join(modelDir, 'film_net/Style/saved_model/variables/variables.index')),
    aggregateSha256: '',
    copiedFromPrivateGcs: true,
    externalModelDownloadAttempted: false,
  }
  const checksumManifest = [
    `${results.kerasMetadataSha256}  film_net/Style/saved_model/keras_metadata.pb`,
    `${results.savedModelSha256}  film_net/Style/saved_model/saved_model.pb`,
    `${results.variablesDataSha256}  film_net/Style/saved_model/variables/variables.data-00000-of-00001`,
    `${results.variablesIndexSha256}  film_net/Style/saved_model/variables/variables.index`,
  ].join('\n') + '\n'
  results.aggregateSha256 = createHash('sha256').update(checksumManifest).digest('hex')
  if (results.kerasMetadataSha256 !== env.kerasMetadataSha256) throw new Error('keras_metadata.pb checksum mismatch.')
  if (results.savedModelSha256 !== env.savedModelSha256) throw new Error('saved_model.pb checksum mismatch.')
  if (results.variablesDataSha256 !== env.variablesDataSha256) throw new Error('variables.data checksum mismatch.')
  if (results.variablesIndexSha256 !== env.variablesIndexSha256) throw new Error('variables.index checksum mismatch.')
  if (results.aggregateSha256 !== env.aggregateSha256) throw new Error(`FILM aggregate checksum mismatch: ${results.aggregateSha256}`)
  return results
}

async function runGeneratedFilmInterpolation(input: { workDir: string; modelPath: string; outputPath: string }): Promise<PythonGeneratedOutput> {
  await execFileAsync('python3', [
    '/app/film-runtime/film_runtime_local.py',
    '--model-path',
    input.modelPath,
    '--work-dir',
    input.workDir,
    '--output-json',
    input.outputPath,
    '--width',
    '256',
    '--height',
    '256',
    '--time',
    '0.5',
  ], {
    timeout: 20 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REAL_MEDIA_INPUT_ENABLED: 'false',
      TF_CPP_MIN_LOG_LEVEL: '1',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonGeneratedOutput
}

async function runRealVideoFilmInterpolation(input: { framesDir: string; workDir: string; modelPath: string; outputPath: string }): Promise<PythonRealVideoOutput> {
  await execFileAsync('python3', [
    '/app/film-runtime/film_real_video_slowmotion.py',
    '--model-path',
    input.modelPath,
    '--frames-dir',
    input.framesDir,
    '--work-dir',
    input.workDir,
    '--output-json',
    input.outputPath,
    '--time',
    '0.5',
  ], {
    timeout: 40 * 60 * 1000,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      FULL_VIDEO_INTERPOLATION_ENABLED: 'false',
      AUDIO_STRETCH_ENABLED: 'false',
      FINAL_DELIVERY_ENABLED: 'false',
      TF_CPP_MIN_LOG_LEVEL: '1',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonRealVideoOutput
}

function buildGeneratedQa(env: GeneratedRuntimeEnv, inference: PythonGeneratedOutput, frameCount: number, interpolatedFrameCount: number) {
  const blockers: string[] = []
  const warnings = [...inference.warnings, 'Generated-frame fixture only; no real-video slow motion QA yet.']
  if (frameCount !== 2) blockers.push('Expected exactly two generated input frames.')
  if (interpolatedFrameCount !== 1) blockers.push('Expected exactly one interpolated midpoint frame.')
  if (!inference.modelLoaded) blockers.push('FILM SavedModel did not load.')
  if (inference.runtime.externalModelDownloadAttempted) blockers.push('Runtime attempted an external model download.')
  if (inference.runtime.realMediaUsed) blockers.push('Runtime used real media.')
  if (inference.interpolation.metrics.outputStddev <= 0.001) blockers.push('Interpolated frame appears blank or constant.')
  if (inference.interpolation.metrics.meanAbsoluteDiffFromFrameA <= 0.001 || inference.interpolation.metrics.meanAbsoluteDiffFromFrameB <= 0.001) warnings.push('Interpolated frame is very close to one source frame; generated fixture visual review is still required.')

  const gates = [
    { gateId: 'model_artifacts', status: 'passed', summary: `Private Phase 38B FILM artifact hashes matched aggregate ${env.aggregateSha256}.` },
    { gateId: 'runtime_integrity', status: inference.ok && inference.modelLoaded ? 'passed' : 'blocked', summary: `TensorFlow ${inference.tensorflowVersion} loaded FILM SavedModel and returned an image tensor.` },
    { gateId: 'fixture_integrity', status: frameCount === 2 ? 'passed' : 'blocked', summary: 'Generated two bounded 256x256 RGB PNG frames.' },
    { gateId: 'interpolated_frame_artifacts', status: interpolatedFrameCount === 1 && inference.interpolation.metrics.outputStddev > 0.001 ? 'passed' : 'blocked', summary: 'One private interpolated midpoint frame was produced.' },
    { gateId: 'motion_sanity', status: blockers.length === 0 ? 'passed' : 'warning', summary: 'Basic generated-frame midpoint non-empty/difference sanity checks completed.' },
    { gateId: 'artifact_privacy', status: 'passed', summary: `Outputs are written under private GCS prefix gs://${env.generatedAssetsBucket}/${env.artifactPrefix}/ and QA prefix gs://${env.qaBucket}/${env.artifactPrefix}/.` },
    { gateId: 'blocked_features', status: 'passed', summary: 'No real video, full-video interpolation, slow-motion feature, provider, Revideo, public access, production, beta, or broad-media scope was enabled.' },
  ] as const

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function buildRealVideoQa(env: RealVideoRuntimeEnv, inference: PythonRealVideoOutput, sourceProbe: ProbeResult, sourceFrameCount: number, interpolatedFrameCount: number, previewFrameCount: number, previewResult: { status: 'completed' | 'blocked'; blocker?: string }) {
  const blockers: string[] = []
  const warnings = [...inference.warnings, 'Very short selected segment only; human visual review is required before broader use.']
  if (env.inputVideoGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') blockers.push('Runtime source input was not the approved Phase 32 export.')
  if (sourceProbe.durationSeconds < env.segmentEndSeconds) blockers.push('Source video duration is shorter than the approved segment end.')
  if (sourceFrameCount !== env.sourceFrameCount) blockers.push(`Expected ${env.sourceFrameCount} extracted source frames.`)
  if (interpolatedFrameCount !== env.sourceFrameCount - 1) blockers.push('Expected one interpolated midpoint per adjacent source frame pair.')
  if (previewFrameCount !== env.outputFrameCount) blockers.push(`Expected ${env.outputFrameCount} preview frames.`)
  if (!inference.modelLoaded) blockers.push('FILM SavedModel did not load.')
  if (inference.runtime.externalModelDownloadAttempted) blockers.push('Runtime attempted an external model download.')
  if (inference.runtime.fullVideoInterpolationExecuted) blockers.push('Runtime attempted full-video interpolation.')
  if (inference.runtime.audioStretchExecuted) blockers.push('Runtime attempted audio stretch.')
  if (inference.runtime.finalDeliveryCreated) blockers.push('Runtime attempted final delivery output.')
  if (inference.interpolation.metrics.meanOutputStddev <= 0.001) blockers.push('Interpolated frames appear blank or constant.')
  if (previewResult.status === 'blocked' && previewResult.blocker) warnings.push(`Preview MP4 blocked: ${previewResult.blocker}`)

  const gates = [
    { gateId: 'source_integrity', status: env.inputVideoGcsUri.endsWith('color-corrected-export.mp4') ? 'passed' : 'blocked', summary: 'Only the approved Phase 32 private export was downloaded.' },
    { gateId: 'plan_snapshot_integrity', status: 'passed', summary: 'Approved plan snapshot was downloaded and validated before processing.' },
    { gateId: 'segment_bounds', status: sourceFrameCount === env.sourceFrameCount && env.segmentDurationSeconds <= 1.5 ? 'passed' : 'blocked', summary: `Extracted ${sourceFrameCount} source frames at ${env.frameWidth}x${env.frameHeight} from a ${env.segmentDurationSeconds}s segment.` },
    { gateId: 'model_artifacts', status: 'passed', summary: `Private Phase 38B FILM artifact hashes matched aggregate ${env.aggregateSha256}.` },
    { gateId: 'runtime_integrity', status: inference.ok && inference.modelLoaded ? 'passed' : 'blocked', summary: `TensorFlow ${inference.tensorflowVersion} loaded FILM SavedModel and interpolated frame pairs.` },
    { gateId: 'interpolated_artifacts', status: interpolatedFrameCount === env.sourceFrameCount - 1 && previewFrameCount === env.outputFrameCount ? 'passed' : 'blocked', summary: `Produced ${interpolatedFrameCount} midpoint frames and ${previewFrameCount} preview frames.` },
    { gateId: 'motion_sanity', status: blockers.length === 0 ? 'passed' : 'warning', summary: 'Basic midpoint non-empty/difference sanity checks completed.' },
    { gateId: 'preview_artifacts', status: previewFrameCount === env.outputFrameCount ? 'passed' : 'blocked', summary: previewResult.status === 'completed' ? 'Preview frames and optional silent MP4 were generated.' : 'Preview frames were generated; optional MP4 assembly is blocked.' },
    { gateId: 'artifact_privacy', status: 'passed', summary: `Outputs are under private generated, preview, and QA prefixes for ${env.artifactPrefix}.` },
    { gateId: 'blocked_features', status: 'passed', summary: 'Full-video interpolation, final delivery, audio stretch, providers, Revideo, Track B tools, public access, production, beta, and broad media remained blocked.' },
  ] as const

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

async function downloadJson(storage: Storage, gcsUri: string): Promise<unknown> {
  const { bucket, object } = parseGcsObject(gcsUri)
  const [body] = await storage.bucket(bucket).file(object).download()
  return JSON.parse(body.toString('utf8')) as unknown
}

function validatePlanSnapshot(env: RealVideoRuntimeEnv, snapshot: unknown): void {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Plan snapshot is not an object.')
  const value = snapshot as Record<string, unknown>
  if (value.phase !== '38D') throw new Error('Plan snapshot phase must be 38D.')
  if (value.runId !== env.runId) throw new Error('Plan snapshot run ID does not match runtime run ID.')
  if (value.rawPromptExecution !== false) throw new Error('Plan snapshot must set rawPromptExecution=false.')
  if (value.approvedSource !== env.inputVideoGcsUri) throw new Error('Plan snapshot approved source does not match Phase 32 input.')
  const segment = value.segment as Record<string, unknown> | undefined
  if (!segment) throw new Error('Plan snapshot segment is missing.')
  if (segment.startSeconds !== env.segmentStartSeconds || segment.endSeconds !== env.segmentEndSeconds) throw new Error('Plan snapshot segment bounds do not match policy.')
  if (segment.sourceFrameCount !== env.sourceFrameCount || segment.frameWidth !== env.frameWidth || segment.frameHeight !== env.frameHeight) throw new Error('Plan snapshot frame plan does not match policy.')
  const blockedFeatures = value.blockedFeatures as Record<string, unknown> | undefined
  for (const key of ['fullVideoInterpolationAllowed', 'finalDeliveryAllowed', 'audioStretchAllowed', 'providerAllowed', 'revideoAllowed', 'productionReadyAllowed', 'externalBetaAllowed', 'broadRealUserMediaAllowed']) {
    if (blockedFeatures?.[key] !== false) throw new Error(`Plan snapshot must keep ${key}=false.`)
  }
}

async function downloadGcsUri(storage: Storage, gcsUri: string, destination: string): Promise<void> {
  const { bucket, object } = parseGcsObject(gcsUri)
  await mkdir(path.dirname(destination), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination })
}

async function ffprobeVideo(videoPath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    videoPath,
  ], { timeout: 2 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 })
  const probe = JSON.parse(stdout) as { format?: { duration?: string }; streams?: Array<{ codec_type?: string; width?: number; height?: number }> }
  const videoStream = probe.streams?.find((stream) => stream.codec_type === 'video')
  if (!videoStream?.width || !videoStream.height) throw new Error('ffprobe did not find a video stream.')
  return {
    durationSeconds: Number(probe.format?.duration ?? 0),
    hasAudio: Boolean(probe.streams?.some((stream) => stream.codec_type === 'audio')),
    width: videoStream.width,
    height: videoStream.height,
  }
}

async function extractSegmentFrames(env: RealVideoRuntimeEnv, videoPath: string, framesDir: string): Promise<string[]> {
  await mkdir(framesDir, { recursive: true })
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(env.segmentStartSeconds),
    '-t',
    String(env.segmentDurationSeconds),
    '-i',
    videoPath,
    '-vf',
    `fps=${env.sourceFrameFps},scale=${env.frameWidth}:${env.frameHeight}:flags=lanczos`,
    '-frames:v',
    String(env.sourceFrameCount),
    '-start_number',
    '0',
    path.join(framesDir, 'frame-%03d.png'),
  ], { timeout: 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 })
  const frames = await listFiles(framesDir, /^frame-\d{3}\.png$/)
  if (frames.length !== env.sourceFrameCount) throw new Error(`Expected ${env.sourceFrameCount} extracted frames, found ${frames.length}.`)
  return frames
}

async function assemblePreviewMp4(previewFrames: string[], previewMp4Path: string): Promise<{ status: 'completed' | 'blocked'; blocker?: string }> {
  if (!previewFrames.length) return { status: 'blocked', blocker: 'No preview frames were available for MP4 assembly.' }
  await mkdir(path.dirname(previewMp4Path), { recursive: true })
  const previewDir = path.dirname(previewFrames[0])
  try {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      '6',
      '-i',
      path.join(previewDir, 'frame-%03d-preview.png'),
      '-an',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      previewMp4Path,
    ], { timeout: 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 })
    return { status: 'completed' }
  } catch (error) {
    return { status: 'blocked', blocker: error instanceof Error ? error.message.slice(0, 500) : String(error) }
  }
}

async function uploadFile(storage: Storage, bucketName: string, objectName: string, filePath: string, contentType: string, runId: string, phase: '38C' | '38D'): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId, phase)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: { contentType, metadata: objectMetadata(runId, sha256, phase) },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string, phase: '38C' | '38D'): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId, phase)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: { contentType: 'application/json', metadata: objectMetadata(runId, sha256, phase) },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string, phase: '38C' | '38D'): void {
  if (phase === '38C') {
    const allowedBuckets = new Set(['reeditpro-staging-reeditpro-generated-assets', 'reeditpro-staging-reeditpro-qa-artifacts'])
    if (!allowedBuckets.has(bucketName)) throw new Error(`Blocked output bucket: ${bucketName}`)
    if (!objectName.startsWith(`activation-film-runtime/phase38c/${runId}/`)) throw new Error(`Blocked output object prefix: ${objectName}`)
  } else {
    const allowedBuckets = new Set(['reeditpro-staging-reeditpro-generated-assets', 'reeditpro-staging-reeditpro-previews', 'reeditpro-staging-reeditpro-qa-artifacts'])
    if (!allowedBuckets.has(bucketName)) throw new Error(`Blocked output bucket: ${bucketName}`)
    if (!objectName.startsWith(`activation-film-runtime/phase38d/${runId}/`)) throw new Error(`Blocked output object prefix: ${objectName}`)
  }
  if (/public|signed-url|production|external-beta/i.test(objectName)) throw new Error(`Unsafe output object name: ${objectName}`)
}

function objectMetadata(runId: string, sha256: string, phase: '38C' | '38D'): Record<string, string> {
  return {
    phase,
    runId,
    sha256,
    realVideoShortSegmentOnly: phase === '38D' ? 'true' : 'false',
    generatedFramesOnly: phase === '38C' ? 'true' : 'false',
    publicAccessEnabled: 'false',
  }
}

function generatedRuntimeSafety() {
  return {
    generatedFramesOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoInputUsed: false,
    realVideoSlowMotionExecuted: false,
    fullVideoInterpolationExecuted: false,
    slowMotionExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

function realVideoRuntimeSafety() {
  return {
    realVideoShortSegmentOnly: true,
    approvedSourceOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    fullVideoInterpolationExecuted: false,
    audioStretchExecuted: false,
    finalDeliveryCreated: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

function parseGcsPrefix(gcsUri: string): { bucket: string; prefix: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], prefix: match[2] }
}

function parseGcsObject(gcsUri: string): { bucket: string; object: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], object: match[2] }
}

async function listFiles(directory: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(directory)
  return entries
    .filter((entry) => pattern.test(entry))
    .sort()
    .map((entry) => path.join(directory, entry))
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath)
  return createHash('sha256').update(bytes).digest('hex')
}

function assertExpectedHashes(env: GeneratedRuntimeEnv | RealVideoRuntimeEnv): void {
  if (env.kerasMetadataSha256 !== '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853') throw new Error('Unexpected keras_metadata.pb checksum.')
  if (env.savedModelSha256 !== '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985') throw new Error('Unexpected saved_model.pb checksum.')
  if (env.variablesDataSha256 !== '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9') throw new Error('Unexpected variables data checksum.')
  if (env.variablesIndexSha256 !== 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5') throw new Error('Unexpected variables index checksum.')
  if (env.aggregateSha256 !== '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b') throw new Error('Unexpected aggregate checksum.')
}

function assertSafeRunId(runId: string, phase: '38C' | '38D'): void {
  const pattern = phase === '38C' ? /^phase38c-[0-9A-Za-z]+$/ : /^phase38d-[0-9A-Za-z]+$/
  if (!pattern.test(runId)) throw new Error(`Unsafe run ID: ${runId}`)
}

function requireString(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

async function resetWorkDirs(workDir: string, modelDir: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await rm(modelDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })
  await mkdir(modelDir, { recursive: true })
}

async function cleanupWorkDirs(workDir: string, modelDir: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await rm(modelDir, { recursive: true, force: true })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
