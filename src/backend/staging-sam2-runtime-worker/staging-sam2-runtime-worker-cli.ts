import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface RuntimeEnv {
  projectId: 'reeditpro'
  jobName: string
  runId: string
  mode: 'generated_synthetic_sequence'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69'
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d'
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  artifactPrefix: string
}

interface RealVideoRuntimeEnv {
  projectId: 'reeditpro'
  jobName: string
  runId: string
  mode: 'real_video_temporal_mask_sample'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69'
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d'
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2'
  inputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  anchorFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png'
  anchorMaskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png'
  anchorCutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png'
  anchorTimestampSeconds: 7.7335
  segmentStartSeconds: 6.9
  segmentEndSeconds: 8.9
  segmentDurationSeconds: 2.0
  frameCount: 10
  maxFrames: 12
  frameWidth: 768
  frameHeight: 432
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  masksBucket: 'reeditpro-staging-reeditpro-masks'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactPrefix: string
}

interface FeatureE2ERuntimeEnv {
  projectId: 'reeditpro'
  jobName: string
  runId: string
  mode: 'sam2_feature_e2e_preview'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69'
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d'
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2'
  inputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  startSeconds: number
  durationSeconds: number
  fps: number
  frameCount: number
  maxFrames: 125
  frameWidth: 768
  frameHeight: 432
  fullControlledClip: boolean
  scopeMode: 'full_controlled_clip_preview' | 'approved_segment_fallback'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  masksBucket: 'reeditpro-staging-reeditpro-masks'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
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

interface PythonRuntimeOutput {
  ok: boolean
  cudaAvailable: boolean
  deviceName?: string
  fixture: {
    width: number
    height: number
    frameCount: number
    framePaths: string[]
    jpegFramePaths: string[]
  }
  prompt: {
    type: 'box'
    box: [number, number, number, number]
    frameIndex: 0
    objectId: 1
  }
  masks: {
    maskPaths: string[]
    overlayPaths: string[]
    perFrame: Array<{
      frameIndex: number
      nonZeroRatio: number
      centroidX?: number
      centroidY?: number
    }>
  }
  runtime: {
    modelId: 'sam2.1_hiera_tiny'
    configName: 'configs/sam2.1/sam2.1_hiera_t.yaml'
    externalModelDownloadAttempted: false
    realMediaUsed: false
  }
  warnings: string[]
}

interface PythonRealVideoRuntimeOutput {
  ok: boolean
  cudaAvailable: boolean
  deviceName?: string
  source: {
    frameDirectory: string
    frameCount: number
    width: number
    height: number
  }
  prompt: {
    source: 'phase33d_mask_bbox'
    type: 'box'
    promptFrameIndex: number
    anchorMaskDimensions: { width: number; height: number }
    frameDimensions: { width: number; height: number }
    sourceBoundingBox: [number, number, number, number]
    scaledBoundingBox: [number, number, number, number]
    objectId: 1
  }
  masks: {
    maskPaths: string[]
    overlayPaths: string[]
    perFrame: Array<{
      frameIndex: number
      nonZeroRatio: number
      centroidX?: number
      centroidY?: number
    }>
  }
  runtime: {
    modelId: 'sam2.1_hiera_tiny'
    configName: 'configs/sam2.1/sam2.1_hiera_t.yaml'
    externalModelDownloadAttempted: false
    realMediaUsed: true
    fullVideoProcessed: false
  }
  warnings: string[]
}

interface PythonFeatureE2ERuntimeOutput {
  ok: boolean
  cudaAvailable: boolean
  deviceName?: string
  source: {
    frameDirectory: string
    frameCount: number
    width: number
    height: number
  }
  prompt: {
    source: 'phase33d_mask_bbox'
    type: 'box'
    promptFrameIndex: number
    anchorMaskDimensions: { width: number; height: number }
    frameDimensions: { width: number; height: number }
    sourceBoundingBox: [number, number, number, number]
    scaledBoundingBox: [number, number, number, number]
    objectId: 1
  }
  masks: {
    maskPaths: string[]
    overlayPaths: string[]
    perFrame: Array<{
      frameIndex: number
      nonZeroRatio: number
      centroidX?: number
      centroidY?: number
    }>
  }
  runtime: {
    modelId: 'sam2.1_hiera_tiny'
    configName: 'configs/sam2.1/sam2.1_hiera_t.yaml'
    externalModelDownloadAttempted: false
    realMediaUsed: true
    fullControlledClipPreview: boolean
    fullResolutionVideoProcessed: false
    productionFullVideoMaskExported: false
  }
  warnings: string[]
}

async function main(): Promise<void> {
  if (process.env.REEDITPRO_SAM2_RUNTIME_MODE === 'sam2_feature_e2e_preview') {
    await mainSam2FeatureE2EPreview()
    return
  }
  if (process.env.REEDITPRO_SAM2_RUNTIME_MODE === 'real_video_temporal_mask_sample') {
    await mainRealVideoTemporalMask()
    return
  }
  await mainGeneratedSyntheticSequence()
}

async function mainGeneratedSyntheticSequence(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-sam2-runtime-${env.runId}`)
  const modelDir = env.modelRuntimePath
  const pythonOutputPath = path.join(workDir, 'sam2-runtime-output.json')

  await resetWorkDirs(workDir, modelDir)
  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const checksumResult = await verifyChecksums(modelDir, env)
    const inference = await runSam2Inference({
      workDir,
      checkpointPath: path.join(modelDir, 'sam2.1_hiera_tiny.pt'),
      outputPath: pythonOutputPath,
    })
    if (!inference.cudaAvailable || !/L4/i.test(inference.deviceName ?? '')) throw new Error(`Phase 35C requires NVIDIA L4 CUDA runtime; got ${inference.deviceName ?? 'unknown GPU'}.`)

    const artifacts: ArtifactRecord[] = []
    const frameArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.fixture.framePaths) {
      const frameName = path.basename(framePath)
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/frames/${frameName}`, framePath, 'image/png', env.runId)
      frameArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const maskArtifacts: ArtifactRecord[] = []
    for (const maskPath of inference.masks.maskPaths) {
      const maskName = path.basename(maskPath)
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/masks/${maskName}`, maskPath, 'image/png', env.runId)
      maskArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const overlayArtifacts: ArtifactRecord[] = []
    for (const overlayPath of inference.masks.overlayPaths) {
      const overlayName = path.basename(overlayPath)
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/overlays/${overlayName}`, overlayPath, 'image/png', env.runId)
      overlayArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const fixtureManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/fixture-manifest.json`, {
      phase: '35C',
      runId: env.runId,
      generatedOnly: true,
      width: inference.fixture.width,
      height: inference.fixture.height,
      frameCount: inference.fixture.frameCount,
      frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
    }, env.runId)
    const promptArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/prompt/prompt-metadata.json`, {
      phase: '35C',
      runId: env.runId,
      generatedOnly: true,
      prompt: inference.prompt,
    }, env.runId)
    const metadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/sam2-runtime-metadata.json`, {
      phase: '35C',
      runId: env.runId,
      modelId: 'sam2.1_hiera_tiny',
      copiedFiles,
      checksumResult,
      inference,
      safety: runtimeSafety(),
    }, env.runId)
    const checksumArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId)
    artifacts.push(fixtureManifestArtifact, promptArtifact, metadataArtifact, checksumArtifact)

    const qa = buildRuntimeQa({
      inference,
      maskCount: maskArtifacts.length,
      overlayCount: overlayArtifacts.length,
      artifactPrefix: env.artifactPrefix,
    })
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/sam2-runtime-qa.json`, {
      phase: '35C',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      fullVideoMaskAllowed: false,
      fullVideoTextBehindSubjectAllowed: false,
    }, env.runId)
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase35c-report.json`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
      gpu: {
        requested: true,
        type: 'nvidia-l4',
        count: 1,
        cudaAvailable: inference.cudaAvailable,
        deviceName: inference.deviceName,
      },
      model: {
        family: 'SAM2 / Segment Anything Model 2',
        modelId: 'sam2.1_hiera_tiny',
        checkpointFileName: 'sam2.1_hiera_tiny.pt',
        configFileName: 'sam2.1_hiera_t.yaml',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        checkpointSha256: checksumResult.checkpointSha256,
        configSha256: checksumResult.configSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      fixture: {
        generated: true,
        width: inference.fixture.width,
        height: inference.fixture.height,
        frameCount: inference.fixture.frameCount,
        promptType: inference.prompt.type,
        promptBox: inference.prompt.box,
        manifestUri: fixtureManifestArtifact.gcsUri,
        promptMetadataUri: promptArtifact.gcsUri,
        frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
      },
      masks: {
        status: inference.ok ? 'completed' : 'failed',
        frameCount: inference.masks.maskPaths.length,
        maskUris: maskArtifacts.map((artifact) => artifact.gcsUri),
        overlayUris: overlayArtifacts.map((artifact) => artifact.gcsUri),
        perFrame: inference.masks.perFrame,
      },
      qa,
      artifacts,
      safety: runtimeSafety(),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...inference.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, env.runId)
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, modelDir)
  }
}

async function mainRealVideoTemporalMask(): Promise<void> {
  const env = readRealVideoRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-sam2-real-video-${env.runId}`)
  const modelDir = env.modelRuntimePath
  const inputDir = path.join(workDir, 'input')
  const framesDir = path.join(workDir, 'segment-frames')
  const pythonOutputPath = path.join(workDir, 'sam2-real-video-temporal-output.json')
  const inputVideoPath = path.join(inputDir, 'color-corrected-export.mp4')
  const anchorFramePath = path.join(inputDir, 'phase33d-anchor-frame.png')
  const anchorMaskPath = path.join(inputDir, 'phase33d-anchor-mask.png')
  const anchorCutoutPath = path.join(inputDir, 'phase33d-anchor-cutout.png')

  await resetWorkDirs(workDir, modelDir)
  await mkdir(inputDir, { recursive: true })
  await mkdir(framesDir, { recursive: true })
  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const checksumResult = await verifyChecksums(modelDir, env)
    await downloadExactGcsUri(storage, env.inputVideoGcsUri, inputVideoPath)
    await downloadExactGcsUri(storage, env.anchorFrameGcsUri, anchorFramePath)
    await downloadExactGcsUri(storage, env.anchorMaskGcsUri, anchorMaskPath)
    await downloadExactGcsUri(storage, env.anchorCutoutGcsUri, anchorCutoutPath)

    const sourceDurationSeconds = await probeVideoDuration(inputVideoPath)
    if (sourceDurationSeconds < env.segmentEndSeconds) throw new Error(`Source video duration ${sourceDurationSeconds}s is shorter than Phase 35D segment end ${env.segmentEndSeconds}s.`)
    const framePaths = await extractBoundedSegmentFrames(inputVideoPath, framesDir, env)
    const inference = await runRealVideoSam2Inference({
      workDir,
      framesDir,
      anchorMaskPath,
      checkpointPath: path.join(modelDir, 'sam2.1_hiera_tiny.pt'),
      outputPath: pythonOutputPath,
    })
    if (!inference.cudaAvailable || !/L4/i.test(inference.deviceName ?? '')) throw new Error(`Phase 35D requires NVIDIA L4 CUDA runtime; got ${inference.deviceName ?? 'unknown GPU'}.`)

    const artifacts: ArtifactRecord[] = []
    const frameArtifacts: ArtifactRecord[] = []
    for (const framePath of framePaths) {
      const frameName = path.basename(framePath)
      const artifact = await uploadRealVideoFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/segment/frames/${frameName}`, framePath, 'image/png', env.runId)
      frameArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const maskArtifacts: ArtifactRecord[] = []
    for (const maskPath of inference.masks.maskPaths) {
      const maskName = path.basename(maskPath)
      const artifact = await uploadRealVideoFile(storage, env.masksBucket, `${env.artifactPrefix}/masks/${maskName}`, maskPath, 'image/png', env.runId)
      maskArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const overlayArtifacts: ArtifactRecord[] = []
    for (const overlayPath of inference.masks.overlayPaths) {
      const overlayName = path.basename(overlayPath)
      const artifact = await uploadRealVideoFile(storage, env.masksBucket, `${env.artifactPrefix}/overlays/${overlayName}`, overlayPath, 'image/png', env.runId)
      overlayArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const segmentManifestArtifact = await uploadRealVideoJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/segment/segment-manifest.json`, {
      phase: '35D',
      runId: env.runId,
      inputVideoGcsUri: env.inputVideoGcsUri,
      sourceDurationSeconds,
      anchorTimestampSeconds: env.anchorTimestampSeconds,
      startSeconds: env.segmentStartSeconds,
      endSeconds: env.segmentEndSeconds,
      durationSeconds: env.segmentDurationSeconds,
      frameCount: framePaths.length,
      width: env.frameWidth,
      height: env.frameHeight,
      fps: env.frameCount / env.segmentDurationSeconds,
      extractionMode: 'bounded_short_segment_only',
      fullVideoProcessed: false,
      frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
    }, env.runId)
    const promptArtifact = await uploadRealVideoJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/prompt/prompt-metadata.json`, {
      phase: '35D',
      runId: env.runId,
      prompt: inference.prompt,
      anchorFrameGcsUri: env.anchorFrameGcsUri,
      anchorMaskGcsUri: env.anchorMaskGcsUri,
      anchorCutoutGcsUri: env.anchorCutoutGcsUri,
      rawChatUsed: false,
    }, env.runId)
    const checksumArtifact = await uploadRealVideoJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId)
    const runtimeMetadataArtifact = await uploadRealVideoJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/sam2-temporal-runtime-metadata.json`, {
      phase: '35D',
      runId: env.runId,
      modelId: 'sam2.1_hiera_tiny',
      copiedFiles,
      checksumResult,
      sourceDurationSeconds,
      inference,
      safety: realVideoRuntimeSafety(),
    }, env.runId)
    const maskMetadataArtifact = await uploadRealVideoJson(storage, env.masksBucket, `${env.artifactPrefix}/metadata/mask-sequence-metadata.json`, {
      phase: '35D',
      runId: env.runId,
      masks: {
        frameCount: maskArtifacts.length,
        maskUris: maskArtifacts.map((artifact) => artifact.gcsUri),
        overlayUris: overlayArtifacts.map((artifact) => artifact.gcsUri),
        perFrame: inference.masks.perFrame,
      },
      source: {
        inputVideoGcsUri: env.inputVideoGcsUri,
        anchorFrameGcsUri: env.anchorFrameGcsUri,
        anchorMaskGcsUri: env.anchorMaskGcsUri,
      },
      fullVideoMaskExecuted: false,
    }, env.runId)
    artifacts.push(segmentManifestArtifact, promptArtifact, checksumArtifact, runtimeMetadataArtifact, maskMetadataArtifact)

    const qa = buildRealVideoRuntimeQa({
      env,
      inference,
      frameCount: frameArtifacts.length,
      maskCount: maskArtifacts.length,
      overlayCount: overlayArtifacts.length,
      artifactPrefix: env.artifactPrefix,
    })
    const qaArtifact = await uploadRealVideoJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/sam2-temporal-mask-qa.json`, {
      phase: '35D',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      fullVideoMaskAllowed: false,
      fullVideoTextBehindSubjectAllowed: false,
      providerAllowed: false,
      revideoAllowed: false,
      filmAllowed: false,
      slowMotionAllowed: false,
    }, env.runId)
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase35d-report.json`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
      source: {
        inputVideoGcsUri: env.inputVideoGcsUri,
        anchorFrameGcsUri: env.anchorFrameGcsUri,
        anchorMaskGcsUri: env.anchorMaskGcsUri,
        anchorCutoutGcsUri: env.anchorCutoutGcsUri,
        sourceDurationSeconds,
      },
      segment: {
        startSeconds: env.segmentStartSeconds,
        endSeconds: env.segmentEndSeconds,
        durationSeconds: env.segmentDurationSeconds,
        frameCount: frameArtifacts.length,
        width: env.frameWidth,
        height: env.frameHeight,
        fps: env.frameCount / env.segmentDurationSeconds,
        frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
        manifestUri: segmentManifestArtifact.gcsUri,
      },
      prompt: {
        ...inference.prompt,
        metadataUri: promptArtifact.gcsUri,
      },
      gpu: {
        requested: true,
        type: 'nvidia-l4',
        count: 1,
        cudaAvailable: inference.cudaAvailable,
        deviceName: inference.deviceName,
      },
      model: {
        family: 'SAM2 / Segment Anything Model 2',
        modelId: 'sam2.1_hiera_tiny',
        checkpointFileName: 'sam2.1_hiera_tiny.pt',
        configFileName: 'sam2.1_hiera_t.yaml',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        checkpointSha256: checksumResult.checkpointSha256,
        configSha256: checksumResult.configSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      masks: {
        status: inference.ok ? 'completed' : 'failed',
        frameCount: maskArtifacts.length,
        maskUris: maskArtifacts.map((artifact) => artifact.gcsUri),
        overlayUris: overlayArtifacts.map((artifact) => artifact.gcsUri),
        perFrame: inference.masks.perFrame,
        metadataUri: maskMetadataArtifact.gcsUri,
      },
      qa,
      artifacts,
      safety: realVideoRuntimeSafety(),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...inference.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadRealVideoJson(storage, env.qaBucket, reportObject, report, env.runId)
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, modelDir)
  }
}

async function mainSam2FeatureE2EPreview(): Promise<void> {
  const env = readFeatureE2ERuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-sam2-feature-e2e-${env.runId}`)
  const modelDir = env.modelRuntimePath
  const inputDir = path.join(workDir, 'input')
  const framesDir = path.join(workDir, 'preview-frames')
  const pythonOutputPath = path.join(workDir, 'sam2-feature-e2e-output.json')
  const inputVideoPath = path.join(inputDir, 'color-corrected-export.mp4')
  const anchorMaskPath = path.join(inputDir, 'phase33d-anchor-mask.png')

  await resetWorkDirs(workDir, modelDir)
  await mkdir(inputDir, { recursive: true })
  await mkdir(framesDir, { recursive: true })
  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const checksumResult = await verifyChecksums(modelDir, env)
    await downloadFeatureGcsUri(storage, env.inputVideoGcsUri, inputVideoPath)
    await downloadFeatureGcsUri(storage, 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png', anchorMaskPath)

    const sourceDurationSeconds = await probeVideoDuration(inputVideoPath)
    if (sourceDurationSeconds < env.startSeconds + env.durationSeconds - 0.05) throw new Error(`Source video duration ${sourceDurationSeconds}s is shorter than Phase 35F preview end ${env.startSeconds + env.durationSeconds}s.`)
    const framePaths = await extractBoundedFeatureFrames(inputVideoPath, framesDir, env)
    const promptFrameIndex = Math.min(framePaths.length - 1, Math.max(0, Math.round((7.7335 - env.startSeconds) * env.fps)))
    const inference = await runFeatureE2ESam2Inference({
      workDir,
      framesDir,
      anchorMaskPath,
      checkpointPath: path.join(modelDir, 'sam2.1_hiera_tiny.pt'),
      outputPath: pythonOutputPath,
      promptFrameIndex,
    })
    if (!inference.cudaAvailable || !/L4/i.test(inference.deviceName ?? '')) throw new Error(`Phase 35F requires NVIDIA L4 CUDA runtime; got ${inference.deviceName ?? 'unknown GPU'}.`)

    const artifacts: ArtifactRecord[] = []
    const frameArtifacts: ArtifactRecord[] = []
    for (const framePath of framePaths) {
      const frameName = path.basename(framePath)
      const artifact = await uploadFeatureFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/frames/${frameName}`, framePath, 'image/png', env.runId)
      frameArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const maskArtifacts: ArtifactRecord[] = []
    for (const maskPath of inference.masks.maskPaths) {
      const maskName = path.basename(maskPath)
      const artifact = await uploadFeatureFile(storage, env.masksBucket, `${env.artifactPrefix}/masks/${maskName}`, maskPath, 'image/png', env.runId)
      maskArtifacts.push(artifact)
      artifacts.push(artifact)
    }
    const overlayArtifacts: ArtifactRecord[] = []
    for (const overlayPath of inference.masks.overlayPaths) {
      const overlayName = path.basename(overlayPath)
      const artifact = await uploadFeatureFile(storage, env.masksBucket, `${env.artifactPrefix}/overlays/${overlayName}`, overlayPath, 'image/png', env.runId)
      overlayArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const previewScope = {
      mode: env.scopeMode,
      startSeconds: env.startSeconds,
      endSeconds: env.startSeconds + env.durationSeconds,
      durationSeconds: env.durationSeconds,
      fps: env.fps,
      frameCount: frameArtifacts.length,
      width: env.frameWidth,
      height: env.frameHeight,
      maxFrames: env.maxFrames,
      fullControlledClip: env.fullControlledClip,
      fallbackReason: env.fullControlledClip ? undefined : 'Phase 35F used the approved segment fallback instead of the full controlled private preview scope.',
      blockers: [],
      warnings: env.fullControlledClip ? ['Bounded private preview scope only; this is not production full-video mask export.'] : ['Segment fallback evidence only.'],
    }
    const frameManifestArtifact = await uploadFeatureJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/preview-scope/preview-scope.json`, {
      phase: '35F',
      runId: env.runId,
      inputVideoGcsUri: env.inputVideoGcsUri,
      sourceDurationSeconds,
      previewScope,
      frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
    }, env.runId)
    const checksumArtifact = await uploadFeatureJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId)
    const runtimeMetadataArtifact = await uploadFeatureJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/sam2-feature-runtime-metadata.json`, {
      phase: '35F',
      runId: env.runId,
      modelId: 'sam2.1_hiera_tiny',
      copiedFiles,
      checksumResult,
      sourceDurationSeconds,
      inference,
      safety: featureRuntimeSafety(),
    }, env.runId)
    const promptArtifact = await uploadFeatureJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/prompt/prompt-metadata.json`, {
      phase: '35F',
      runId: env.runId,
      prompt: inference.prompt,
      rawChatUsed: false,
    }, env.runId)
    const maskMetadataArtifact = await uploadFeatureJson(storage, env.masksBucket, `${env.artifactPrefix}/metadata/mask-sequence-metadata.json`, {
      phase: '35F',
      runId: env.runId,
      previewScope,
      masks: {
        frameCount: maskArtifacts.length,
        maskUris: maskArtifacts.map((artifact) => artifact.gcsUri),
        overlayUris: overlayArtifacts.map((artifact) => artifact.gcsUri),
        perFrame: inference.masks.perFrame,
      },
      productionFullVideoMaskExported: false,
    }, env.runId)
    artifacts.push(frameManifestArtifact, checksumArtifact, runtimeMetadataArtifact, promptArtifact, maskMetadataArtifact)

    const qa = buildFeatureRuntimeQa({
      env,
      inference,
      frameCount: frameArtifacts.length,
      maskCount: maskArtifacts.length,
      overlayCount: overlayArtifacts.length,
      artifactPrefix: env.artifactPrefix,
    })
    const qaArtifact = await uploadFeatureJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/sam2-feature-runtime-qa.json`, {
      phase: '35F',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    }, env.runId)
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase35f-runtime-report.json`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
      source: {
        inputVideoGcsUri: env.inputVideoGcsUri,
        sourceDurationSeconds,
      },
      previewScope,
      prompt: {
        ...inference.prompt,
        metadataUri: promptArtifact.gcsUri,
      },
      gpu: {
        requested: true,
        type: 'nvidia-l4',
        count: 1,
        cudaAvailable: inference.cudaAvailable,
        deviceName: inference.deviceName,
      },
      model: {
        family: 'SAM2 / Segment Anything Model 2',
        modelId: 'sam2.1_hiera_tiny',
        checkpointFileName: 'sam2.1_hiera_tiny.pt',
        configFileName: 'sam2.1_hiera_t.yaml',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        checkpointSha256: checksumResult.checkpointSha256,
        configSha256: checksumResult.configSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      frames: {
        frameCount: frameArtifacts.length,
        frameUris: frameArtifacts.map((artifact) => artifact.gcsUri),
        manifestUri: frameManifestArtifact.gcsUri,
      },
      masks: {
        status: inference.ok ? 'completed' : 'failed',
        frameCount: maskArtifacts.length,
        maskUris: maskArtifacts.map((artifact) => artifact.gcsUri),
        overlayUris: overlayArtifacts.map((artifact) => artifact.gcsUri),
        perFrame: inference.masks.perFrame,
        metadataUri: maskMetadataArtifact.gcsUri,
      },
      qa,
      artifacts,
      safety: featureRuntimeSafety(),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...inference.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadFeatureJson(storage, env.qaBucket, reportObject, report, env.runId)
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, modelDir)
  }
}

function readRuntimeEnv(): RuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_SAM2_RUNTIME !== 'true') throw new Error('REEDITPRO_CONFIRM_SAM2_RUNTIME=true is required.')
  if (process.env.REEDITPRO_SAM2_RUNTIME_MODE !== 'generated_synthetic_sequence') throw new Error('Only generated_synthetic_sequence mode is allowed.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.REAL_MEDIA_INPUT_ENABLED !== 'false') throw new Error('REAL_MEDIA_INPUT_ENABLED=false is required.')
  if (process.env.REEDITPRO_PRODUCTION_READY !== 'false') throw new Error('REEDITPRO_PRODUCTION_READY=false is required.')
  if (process.env.HF_HUB_OFFLINE !== '1') throw new Error('HF_HUB_OFFLINE=1 is required.')
  if (process.env.REEDITPRO_SAM2_MODEL_GCS_PATH !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/') throw new Error('Unexpected SAM2 model GCS path.')
  if (process.env.REEDITPRO_SAM2_MODEL_RUNTIME_PATH !== '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny') throw new Error('Unexpected SAM2 runtime path.')
  if (process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256 !== '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69') throw new Error('Unexpected SAM2 checkpoint checksum.')
  if (process.env.REEDITPRO_SAM2_CONFIG_SHA256 !== 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d') throw new Error('Unexpected SAM2 config checksum.')
  if (process.env.REEDITPRO_SAM2_AGGREGATE_SHA256 !== '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2') throw new Error('Unexpected SAM2 aggregate checksum.')

  const runId = process.env.REEDITPRO_PHASE35C_RUN_ID ?? `phase35c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase35c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35C run id: ${runId}`)

  return {
    projectId: 'reeditpro',
    jobName: process.env.K_SERVICE ?? 'reeditpro-staging-sam2-runtime-job',
    runId,
    mode: 'generated_synthetic_sequence',
    modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
    modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
    checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
    configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
    aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    artifactPrefix: `activation-sam2-runtime/phase35c/${runId}`,
  }
}

function readRealVideoRuntimeEnv(): RealVideoRuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK !== 'true') throw new Error('REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true is required.')
  if (process.env.REEDITPRO_SAM2_RUNTIME_MODE !== 'real_video_temporal_mask_sample') throw new Error('Only real_video_temporal_mask_sample mode is allowed for Phase 35D.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.REAL_MEDIA_INPUT_SCOPE !== 'approved_phase35d_short_segment_only') throw new Error('REAL_MEDIA_INPUT_SCOPE=approved_phase35d_short_segment_only is required.')
  if (process.env.FULL_VIDEO_MASK_ENABLED !== 'false') throw new Error('FULL_VIDEO_MASK_ENABLED=false is required.')
  if (process.env.TEXT_BEHIND_SUBJECT_VIDEO_ENABLED !== 'false') throw new Error('TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false is required.')
  if (process.env.PUBLIC_ACCESS_ENABLED !== 'false') throw new Error('PUBLIC_ACCESS_ENABLED=false is required.')
  if (process.env.REEDITPRO_PRODUCTION_READY !== 'false') throw new Error('REEDITPRO_PRODUCTION_READY=false is required.')
  if (process.env.HF_HUB_OFFLINE !== '1') throw new Error('HF_HUB_OFFLINE=1 is required.')
  if (process.env.REEDITPRO_SAM2_MODEL_GCS_PATH !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/') throw new Error('Unexpected SAM2 model GCS path.')
  if (process.env.REEDITPRO_SAM2_MODEL_RUNTIME_PATH !== '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny') throw new Error('Unexpected SAM2 runtime path.')
  if (process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256 !== '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69') throw new Error('Unexpected SAM2 checkpoint checksum.')
  if (process.env.REEDITPRO_SAM2_CONFIG_SHA256 !== 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d') throw new Error('Unexpected SAM2 config checksum.')
  if (process.env.REEDITPRO_SAM2_AGGREGATE_SHA256 !== '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2') throw new Error('Unexpected SAM2 aggregate checksum.')
  if (process.env.REEDITPRO_PHASE35D_INPUT_VIDEO_GCS_URI !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') throw new Error('Unexpected Phase 35D input video URI.')
  if (process.env.REEDITPRO_PHASE35D_ANCHOR_FRAME_GCS_URI !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png') throw new Error('Unexpected Phase 35D anchor frame URI.')
  if (process.env.REEDITPRO_PHASE35D_ANCHOR_MASK_GCS_URI !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png') throw new Error('Unexpected Phase 35D anchor mask URI.')
  if (process.env.REEDITPRO_PHASE35D_ANCHOR_CUTOUT_GCS_URI !== 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png') throw new Error('Unexpected Phase 35D anchor cutout URI.')
  if (process.env.REEDITPRO_PHASE35D_ANCHOR_TIMESTAMP_SECONDS !== '7.7335') throw new Error('Unexpected Phase 35D anchor timestamp.')
  if (process.env.REEDITPRO_PHASE35D_SEGMENT_START_SECONDS !== '6.9') throw new Error('Unexpected Phase 35D segment start.')
  if (process.env.REEDITPRO_PHASE35D_SEGMENT_END_SECONDS !== '8.9') throw new Error('Unexpected Phase 35D segment end.')
  if (process.env.REEDITPRO_PHASE35D_MAX_SEGMENT_SECONDS !== '2') throw new Error('Unexpected Phase 35D max segment seconds.')
  if (process.env.REEDITPRO_PHASE35D_FRAME_COUNT !== '10') throw new Error('Unexpected Phase 35D frame count.')
  if (process.env.REEDITPRO_PHASE35D_MAX_FRAMES !== '12') throw new Error('Unexpected Phase 35D max frames.')
  if (process.env.REEDITPRO_PHASE35D_FRAME_WIDTH !== '768') throw new Error('Unexpected Phase 35D frame width.')
  if (process.env.REEDITPRO_PHASE35D_FRAME_HEIGHT !== '432') throw new Error('Unexpected Phase 35D frame height.')

  const runId = process.env.REEDITPRO_PHASE35D_RUN_ID ?? `phase35d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase35d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35D run id: ${runId}`)

  return {
    projectId: 'reeditpro',
    jobName: process.env.K_SERVICE ?? 'reeditpro-staging-sam2-runtime-job',
    runId,
    mode: 'real_video_temporal_mask_sample',
    modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
    modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
    checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
    configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
    aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
    inputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    anchorFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
    anchorMaskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
    anchorCutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png',
    anchorTimestampSeconds: 7.7335,
    segmentStartSeconds: 6.9,
    segmentEndSeconds: 8.9,
    segmentDurationSeconds: 2.0,
    frameCount: 10,
    maxFrames: 12,
    frameWidth: 768,
    frameHeight: 432,
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    masksBucket: 'reeditpro-staging-reeditpro-masks',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
    artifactPrefix: `activation-real-video/phase35d/${runId}`,
  }
}

function readFeatureE2ERuntimeEnv(): FeatureE2ERuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_SAM2_FEATURE_E2E !== 'true') throw new Error('REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true is required.')
  if (process.env.REEDITPRO_SAM2_RUNTIME_MODE !== 'sam2_feature_e2e_preview') throw new Error('Only sam2_feature_e2e_preview mode is allowed for Phase 35F.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.REAL_MEDIA_INPUT_SCOPE !== 'approved_phase35f_controlled_preview_only') throw new Error('REAL_MEDIA_INPUT_SCOPE=approved_phase35f_controlled_preview_only is required.')
  if (process.env.FULL_VIDEO_MASK_ENABLED !== 'false') throw new Error('FULL_VIDEO_MASK_ENABLED=false is required.')
  if (process.env.FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED !== 'false') throw new Error('FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED=false is required.')
  if (process.env.TEXT_BEHIND_SUBJECT_VIDEO_ENABLED !== 'false') throw new Error('TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false is required.')
  if (process.env.FINAL_EXPORT_ENABLED !== 'false') throw new Error('FINAL_EXPORT_ENABLED=false is required.')
  if (process.env.REAL_ESRGAN_EXECUTION_ENABLED !== 'false') throw new Error('REAL_ESRGAN_EXECUTION_ENABLED=false is required.')
  if (process.env.PUBLIC_ACCESS_ENABLED !== 'false') throw new Error('PUBLIC_ACCESS_ENABLED=false is required.')
  if (process.env.REEDITPRO_PRODUCTION_READY !== 'false') throw new Error('REEDITPRO_PRODUCTION_READY=false is required.')
  if (process.env.REEDITPRO_EXTERNAL_BETA_READY !== 'false') throw new Error('REEDITPRO_EXTERNAL_BETA_READY=false is required.')
  if (process.env.REEDITPRO_PAID_PRODUCTION_READY !== 'false') throw new Error('REEDITPRO_PAID_PRODUCTION_READY=false is required.')
  if (process.env.REEDITPRO_BROAD_REAL_MEDIA_READY !== 'false') throw new Error('REEDITPRO_BROAD_REAL_MEDIA_READY=false is required.')
  if (process.env.HF_HUB_OFFLINE !== '1') throw new Error('HF_HUB_OFFLINE=1 is required.')
  if (process.env.REEDITPRO_SAM2_MODEL_GCS_PATH !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/') throw new Error('Unexpected SAM2 model GCS path.')
  if (process.env.REEDITPRO_SAM2_MODEL_RUNTIME_PATH !== '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny') throw new Error('Unexpected SAM2 runtime path.')
  if (process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256 !== '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69') throw new Error('Unexpected SAM2 checkpoint checksum.')
  if (process.env.REEDITPRO_SAM2_CONFIG_SHA256 !== 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d') throw new Error('Unexpected SAM2 config checksum.')
  if (process.env.REEDITPRO_SAM2_AGGREGATE_SHA256 !== '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2') throw new Error('Unexpected SAM2 aggregate checksum.')
  if (process.env.REEDITPRO_PHASE35F_SOURCE_GCS_URI !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') throw new Error('Unexpected Phase 35F source URI.')
  if (process.env.REEDITPRO_PHASE35F_TEXT !== 'REEDITPRO') throw new Error('Unexpected Phase 35F text.')
  if (process.env.REEDITPRO_PHASE35F_FRAME_WIDTH !== '768') throw new Error('Unexpected Phase 35F frame width.')
  if (process.env.REEDITPRO_PHASE35F_FRAME_HEIGHT !== '432') throw new Error('Unexpected Phase 35F frame height.')
  if (process.env.REEDITPRO_PHASE35F_MAX_FRAMES !== '125') throw new Error('Unexpected Phase 35F max frames.')

  const runId = process.env.REEDITPRO_PHASE35F_RUN_ID ?? `phase35f-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase35f-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35F run id: ${runId}`)
  const scopeMode = process.env.REEDITPRO_PHASE35F_SCOPE_MODE === 'approved_segment_fallback' ? 'approved_segment_fallback' : 'full_controlled_clip_preview'
  const startSeconds = numberFromRequiredEnv('REEDITPRO_PHASE35F_START_SECONDS')
  const durationSeconds = numberFromRequiredEnv('REEDITPRO_PHASE35F_DURATION_SECONDS')
  const fps = numberFromRequiredEnv('REEDITPRO_PHASE35F_FPS')
  const frameCount = numberFromRequiredEnv('REEDITPRO_PHASE35F_FRAME_COUNT')
  if (fps > 8) throw new Error('Phase 35F FPS must be <= 8.')
  if (frameCount > 125) throw new Error('Phase 35F frame count must be <= 125.')

  return {
    projectId: 'reeditpro',
    jobName: process.env.K_SERVICE ?? 'reeditpro-staging-sam2-runtime-job',
    runId,
    mode: 'sam2_feature_e2e_preview',
    modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
    modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
    checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
    configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
    aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
    inputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    startSeconds,
    durationSeconds,
    fps,
    frameCount,
    maxFrames: 125,
    frameWidth: 768,
    frameHeight: 432,
    fullControlledClip: process.env.REEDITPRO_PHASE35F_FULL_CONTROLLED_CLIP === 'true',
    scopeMode,
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    masksBucket: 'reeditpro-staging-reeditpro-masks',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
    artifactPrefix: `activation-real-video/phase35f/${runId}`,
  }
}

function numberFromRequiredEnv(name: string): number {
  const value = Number(process.env[name])
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number.`)
  return value
}

async function resetWorkDirs(workDir: string, modelRuntimePath: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })
  await rm(modelRuntimePath, { recursive: true, force: true })
  await mkdir(modelRuntimePath, { recursive: true })
}

async function cleanupWorkDirs(workDir: string, modelRuntimePath: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true })
  await rm(modelRuntimePath, { recursive: true, force: true })
}

async function syncApprovedModel(storage: Storage, env: {
  modelGcsPath: string
  modelRuntimePath: string
}): Promise<string[]> {
  const { bucket, prefix } = parseGcsPrefix(env.modelGcsPath)
  const files = ['sam2.1_hiera_tiny.pt', 'sam2.1_hiera_t.yaml', 'file_checksums_sha256.txt', 'model_tree_manifest.json', 'source_evidence.json']
  for (const file of files) {
    await downloadObject(storage, bucket, `${prefix}${file}`, path.join(env.modelRuntimePath, file))
  }
  return files
}

async function verifyChecksums(runtimePath: string, env: {
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
}): Promise<{
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
}> {
  const checkpointSha256 = createHash('sha256').update(await readFile(path.join(runtimePath, 'sam2.1_hiera_tiny.pt'))).digest('hex')
  const configSha256 = createHash('sha256').update(await readFile(path.join(runtimePath, 'sam2.1_hiera_t.yaml'))).digest('hex')
  if (checkpointSha256 !== env.checkpointSha256) throw new Error('SAM2 checkpoint checksum mismatch.')
  if (configSha256 !== env.configSha256) throw new Error('SAM2 config checksum mismatch.')
  const checksumText = await readFile(path.join(runtimePath, 'file_checksums_sha256.txt'), 'utf8')
  const aggregateSha256 = createHash('sha256').update(checksumText).digest('hex')
  if (aggregateSha256 !== env.aggregateSha256) throw new Error('SAM2 aggregate checksum mismatch.')
  const manifest = JSON.parse(await readFile(path.join(runtimePath, 'model_tree_manifest.json'), 'utf8')) as { aggregateSha256?: string }
  if (manifest.aggregateSha256 !== env.aggregateSha256) throw new Error('SAM2 model tree manifest aggregate checksum mismatch.')
  return { checkpointSha256, configSha256, aggregateSha256 }
}

async function runSam2Inference(input: {
  workDir: string
  checkpointPath: string
  outputPath: string
}): Promise<PythonRuntimeOutput> {
  await execFileAsync('python3', [
    '/app/sam2-runtime/sam2_runtime_local.py',
    '--work-dir',
    input.workDir,
    '--checkpoint-path',
    input.checkpointPath,
    '--output-json',
    input.outputPath,
  ], {
    timeout: 30 * 60_000,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REAL_MEDIA_INPUT_ENABLED: 'false',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonRuntimeOutput
}

async function runRealVideoSam2Inference(input: {
  workDir: string
  framesDir: string
  anchorMaskPath: string
  checkpointPath: string
  outputPath: string
}): Promise<PythonRealVideoRuntimeOutput> {
  await execFileAsync('python3', [
    '/app/sam2-runtime/sam2_real_video_temporal.py',
    '--work-dir',
    input.workDir,
    '--frames-dir',
    input.framesDir,
    '--anchor-mask-path',
    input.anchorMaskPath,
    '--checkpoint-path',
    input.checkpointPath,
    '--output-json',
    input.outputPath,
    '--prompt-frame-index',
    '4',
  ], {
    timeout: 45 * 60_000,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REAL_MEDIA_INPUT_SCOPE: 'approved_phase35d_short_segment_only',
      FULL_VIDEO_MASK_ENABLED: 'false',
      TEXT_BEHIND_SUBJECT_VIDEO_ENABLED: 'false',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonRealVideoRuntimeOutput
}

async function runFeatureE2ESam2Inference(input: {
  workDir: string
  framesDir: string
  anchorMaskPath: string
  checkpointPath: string
  outputPath: string
  promptFrameIndex: number
}): Promise<PythonFeatureE2ERuntimeOutput> {
  await execFileAsync('python3', [
    '/app/sam2-runtime/sam2_feature_e2e.py',
    '--work-dir',
    input.workDir,
    '--frames-dir',
    input.framesDir,
    '--anchor-mask-path',
    input.anchorMaskPath,
    '--checkpoint-path',
    input.checkpointPath,
    '--output-json',
    input.outputPath,
    '--prompt-frame-index',
    String(input.promptFrameIndex),
  ], {
    timeout: 90 * 60_000,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REAL_MEDIA_INPUT_SCOPE: 'approved_phase35f_controlled_preview_only',
      FULL_VIDEO_MASK_ENABLED: 'false',
      FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED: 'false',
      TEXT_BEHIND_SUBJECT_VIDEO_ENABLED: 'false',
      FINAL_EXPORT_ENABLED: 'false',
      REAL_ESRGAN_EXECUTION_ENABLED: 'false',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonFeatureE2ERuntimeOutput
}

async function probeVideoDuration(inputVideoPath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    inputVideoPath,
  ], {
    timeout: 5 * 60_000,
    maxBuffer: 10 * 1024 * 1024,
  })
  const duration = Number(stdout.trim())
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Unable to determine source video duration from ffprobe output: ${stdout}`)
  return duration
}

async function extractBoundedSegmentFrames(inputVideoPath: string, framesDir: string, env: RealVideoRuntimeEnv): Promise<string[]> {
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    String(env.segmentStartSeconds),
    '-i',
    inputVideoPath,
    '-t',
    String(env.segmentDurationSeconds),
    '-vf',
    `fps=${env.frameCount / env.segmentDurationSeconds},scale=${env.frameWidth}:${env.frameHeight}`,
    '-frames:v',
    String(env.frameCount),
    path.join(framesDir, 'frame-%03d.png'),
  ], {
    timeout: 10 * 60_000,
    maxBuffer: 128 * 1024 * 1024,
  })
  const files = (await readdir(framesDir))
    .filter((file) => /^frame-\d{3}\.png$/.test(file))
    .sort()
    .map((file) => path.join(framesDir, file))
  if (files.length !== env.frameCount) throw new Error(`Expected ${env.frameCount} extracted frames; found ${files.length}.`)
  if (files.length > env.maxFrames) throw new Error(`Extracted frame count ${files.length} exceeds Phase 35D max ${env.maxFrames}.`)
  return files
}

async function extractBoundedFeatureFrames(inputVideoPath: string, framesDir: string, env: FeatureE2ERuntimeEnv): Promise<string[]> {
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    String(env.startSeconds),
    '-i',
    inputVideoPath,
    '-t',
    String(env.durationSeconds),
    '-vf',
    `fps=${env.fps},scale=${env.frameWidth}:${env.frameHeight}`,
    '-frames:v',
    String(env.frameCount),
    path.join(framesDir, 'frame-%03d.png'),
  ], {
    timeout: 20 * 60_000,
    maxBuffer: 128 * 1024 * 1024,
  })
  const files = (await readdir(framesDir))
    .filter((file) => /^frame-\d{3}\.png$/.test(file))
    .sort()
    .map((file) => path.join(framesDir, file))
  if (files.length !== env.frameCount) throw new Error(`Expected ${env.frameCount} Phase 35F preview frames; found ${files.length}.`)
  if (files.length > env.maxFrames) throw new Error(`Extracted frame count ${files.length} exceeds Phase 35F max ${env.maxFrames}.`)
  return files
}

async function downloadObject(storage: Storage, bucketName: string, objectName: string, targetPath: string): Promise<void> {
  if (bucketName !== 'reeditpro-staging-reeditpro-generated-assets' || !objectName.startsWith('model-weights/sam2/sam2.1-hiera-tiny/')) {
    throw new Error(`Blocked SAM2 model object: gs://${bucketName}/${objectName}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
}

async function downloadExactGcsUri(storage: Storage, gcsUri: string, targetPath: string): Promise<void> {
  const allowed = new Set([
    'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png',
  ])
  if (!allowed.has(gcsUri)) throw new Error(`Blocked Phase 35D input object: ${gcsUri}`)
  const { bucket, prefix } = parseGcsPrefix(gcsUri)
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucket).file(prefix).download({ destination: targetPath })
}

async function downloadFeatureGcsUri(storage: Storage, gcsUri: string, targetPath: string): Promise<void> {
  const allowed = new Set([
    'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
  ])
  if (!allowed.has(gcsUri)) throw new Error(`Blocked Phase 35F input object: ${gcsUri}`)
  const { bucket, prefix } = parseGcsPrefix(gcsUri)
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucket).file(prefix).download({ destination: targetPath })
}

async function uploadFile(storage: Storage, bucketName: string, objectName: string, filePath: string, contentType: string, runId: string): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: {
      contentType,
      metadata: objectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      metadata: objectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

async function uploadRealVideoFile(storage: Storage, bucketName: string, objectName: string, filePath: string, contentType: string, runId: string): Promise<ArtifactRecord> {
  assertRealVideoRuntimeOutput(bucketName, objectName, runId)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: {
      contentType,
      metadata: realVideoObjectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadRealVideoJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string): Promise<ArtifactRecord> {
  assertRealVideoRuntimeOutput(bucketName, objectName, runId)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      metadata: realVideoObjectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

async function uploadFeatureFile(storage: Storage, bucketName: string, objectName: string, filePath: string, contentType: string, runId: string): Promise<ArtifactRecord> {
  assertFeatureRuntimeOutput(bucketName, objectName, runId)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: {
      contentType,
      metadata: featureObjectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadFeatureJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string): Promise<ArtifactRecord> {
  assertFeatureRuntimeOutput(bucketName, objectName, runId)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      metadata: featureObjectMetadata(runId, sha256),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

function buildRuntimeQa(input: {
  inference: PythonRuntimeOutput
  maskCount: number
  overlayCount: number
  artifactPrefix: string
}) {
  const blockers: string[] = []
  const warnings = ['Generated fixture only; this is not real-video temporal QA.']
  const frameCountOk = input.inference.fixture.frameCount === 5
  const dimensionsOk = input.inference.fixture.width === 512 && input.inference.fixture.height === 512
  const maskCountOk = input.maskCount === 5
  const overlayCountOk = input.overlayCount === 5
  const masksNonEmpty = input.inference.masks.perFrame.every((frame) => frame.nonZeroRatio > 0.005 && frame.nonZeroRatio < 0.995)
  const centroids = input.inference.masks.perFrame.map((frame) => frame.centroidX).filter((value): value is number => typeof value === 'number')
  const centroidContinuity = centroids.length === 5 && Math.max(...centroids) - Math.min(...centroids) < 180
  if (!input.inference.cudaAvailable || !/L4/i.test(input.inference.deviceName ?? '')) blockers.push('CUDA/L4 runtime was not confirmed.')
  if (!frameCountOk || !dimensionsOk) blockers.push('Generated fixture dimensions or frame count do not match Phase 35C policy.')
  if (!maskCountOk || !overlayCountOk) blockers.push('Mask/overlay artifact counts do not match generated fixture frame count.')
  if (!masksNonEmpty) blockers.push('One or more masks are empty or effectively full-frame.')
  if (!centroidContinuity) blockers.push('Basic centroid continuity sanity check failed.')
  if (!input.artifactPrefix.startsWith('activation-sam2-runtime/phase35c/')) blockers.push('Artifact prefix is outside the approved Phase 35C private prefix.')
  return {
    status: blockers.length > 0 ? 'blocked' : 'warning',
    gates: [
      { gateId: 'model_artifacts', status: 'passed', summary: 'Approved private SAM2 checkpoint/config copied and checksum verified.' },
      { gateId: 'runtime_integrity', status: input.inference.cudaAvailable ? 'passed' : 'blocked', summary: `CUDA device: ${input.inference.deviceName ?? 'unknown'}.` },
      { gateId: 'fixture_integrity', status: frameCountOk && dimensionsOk ? 'passed' : 'blocked', summary: 'Generated-only 5-frame 512x512 fixture sequence was created.' },
      { gateId: 'mask_artifacts', status: maskCountOk && masksNonEmpty ? 'passed' : 'blocked', summary: `Created ${input.maskCount} masks and ${input.overlayCount} overlays.` },
      { gateId: 'temporal_fixture_consistency', status: centroidContinuity ? 'passed' : 'blocked', summary: 'Basic generated-fixture area/centroid continuity sanity check completed.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Artifacts are written under private staging GCS prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'No real media, providers, Revideo, FILM, slow motion, production, beta, or full-video path executed.' },
    ],
    blockers,
    warnings,
  }
}

function runtimeSafety() {
  return {
    generatedFixtureOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoInputUsed: false,
    fullVideoMaskExecuted: false,
    fullVideoTextBehindSubjectExecuted: false,
    filmUsed: false,
    slowMotionExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    rtxPro6000Used: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  } as const
}

function buildRealVideoRuntimeQa(input: {
  env: RealVideoRuntimeEnv
  inference: PythonRealVideoRuntimeOutput
  frameCount: number
  maskCount: number
  overlayCount: number
  artifactPrefix: string
}) {
  const blockers: string[] = []
  const warnings = [
    'Very short selected segment only; no full-video temporal QA is claimed.',
    'Human visual review is required before broader mask or text-behind-subject use.',
  ]
  const segmentOk = input.env.segmentDurationSeconds <= 2.0 && input.frameCount <= input.env.maxFrames
  const dimensionsOk = input.inference.source.width === input.env.frameWidth && input.inference.source.height === input.env.frameHeight
  const frameCountOk = input.frameCount === input.env.frameCount && input.inference.source.frameCount === input.env.frameCount
  const maskCountOk = input.maskCount === input.env.frameCount && input.inference.masks.maskPaths.length === input.env.frameCount
  const overlayCountOk = input.overlayCount === input.env.frameCount
  const masksNonEmpty = input.inference.masks.perFrame.every((frame) => frame.nonZeroRatio > 0.001 && frame.nonZeroRatio < 0.995)
  const centroids = input.inference.masks.perFrame
    .map((frame) => ({ x: frame.centroidX, y: frame.centroidY }))
    .filter((value): value is { x: number; y: number } => typeof value.x === 'number' && typeof value.y === 'number')
  const centroidContinuity = centroids.length === input.env.frameCount
    && Math.max(...centroids.map((point) => point.x)) - Math.min(...centroids.map((point) => point.x)) < input.env.frameWidth
    && Math.max(...centroids.map((point) => point.y)) - Math.min(...centroids.map((point) => point.y)) < input.env.frameHeight
  if (!input.inference.cudaAvailable || !/L4/i.test(input.inference.deviceName ?? '')) blockers.push('CUDA/L4 runtime was not confirmed.')
  if (!segmentOk) blockers.push('Segment duration or frame count exceeds Phase 35D bounds.')
  if (!dimensionsOk || !frameCountOk) blockers.push('Extracted segment frame dimensions or frame count do not match Phase 35D policy.')
  if (!maskCountOk || !overlayCountOk) blockers.push('Mask/overlay artifact counts do not match extracted frame count.')
  if (!masksNonEmpty) blockers.push('One or more masks are empty or effectively full-frame.')
  if (!centroidContinuity) warnings.push('Basic centroid continuity check is warning-only and needs human visual review.')
  if (input.inference.prompt.source !== 'phase33d_mask_bbox') blockers.push('Prompt was not derived from Phase 33D mask evidence.')
  if (!input.artifactPrefix.startsWith('activation-real-video/phase35d/')) blockers.push('Artifact prefix is outside the approved Phase 35D private prefix.')
  return {
    status: blockers.length > 0 ? 'blocked' : 'warning',
    gates: [
      { gateId: 'source_integrity', status: 'passed', summary: 'Approved Phase 32 input and Phase 33D anchor evidence only.' },
      { gateId: 'segment_bounds', status: segmentOk && dimensionsOk && frameCountOk ? 'passed' : 'blocked', summary: `${input.env.segmentDurationSeconds}s segment, ${input.frameCount} frames, ${input.env.frameWidth}x${input.env.frameHeight}.` },
      { gateId: 'model_artifacts', status: 'passed', summary: 'Approved private SAM2 checkpoint/config copied and checksum verified.' },
      { gateId: 'prompt_integrity', status: input.inference.prompt.source === 'phase33d_mask_bbox' ? 'passed' : 'blocked', summary: `Prompt box ${input.inference.prompt.scaledBoundingBox.join(',')} derived from Phase 33D mask.` },
      { gateId: 'runtime_integrity', status: input.inference.cudaAvailable ? 'passed' : 'blocked', summary: `CUDA device: ${input.inference.deviceName ?? 'unknown'}.` },
      { gateId: 'mask_artifacts', status: maskCountOk && masksNonEmpty ? 'passed' : 'blocked', summary: `Created ${input.maskCount} masks and ${input.overlayCount} overlays.` },
      { gateId: 'temporal_consistency', status: centroidContinuity ? 'warning' : 'warning', summary: 'Basic area/centroid continuity sanity check completed; visual temporal quality remains human-review required.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Artifacts are written under private staging GCS prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'No full-video masks, text-behind-subject video, providers, Revideo, FILM, slow motion, production, beta, or broad media executed.' },
    ],
    blockers,
    warnings,
  }
}

function buildFeatureRuntimeQa(input: {
  env: FeatureE2ERuntimeEnv
  inference: PythonFeatureE2ERuntimeOutput
  frameCount: number
  maskCount: number
  overlayCount: number
  artifactPrefix: string
}) {
  const blockers: string[] = []
  const warnings = [
    'Private bounded preview scope only; external beta and paid production remain blocked.',
    'Human visual review is recommended before any broader SAM2 feature use.',
  ]
  const scopeOk = input.env.frameCount <= input.env.maxFrames
    && input.env.fps <= 8
    && input.env.frameWidth === 768
    && input.env.frameHeight === 432
  const frameCountOk = input.frameCount === input.env.frameCount && input.inference.source.frameCount === input.env.frameCount
  const dimensionsOk = input.inference.source.width === input.env.frameWidth && input.inference.source.height === input.env.frameHeight
  const maskCountOk = input.maskCount === input.env.frameCount && input.inference.masks.maskPaths.length === input.env.frameCount
  const overlayCountOk = input.overlayCount === input.env.frameCount
  const masksNonEmpty = input.inference.masks.perFrame.every((frame) => frame.nonZeroRatio > 0.001 && frame.nonZeroRatio < 0.995)
  const centroids = input.inference.masks.perFrame
    .map((frame) => ({ x: frame.centroidX, y: frame.centroidY }))
    .filter((value): value is { x: number; y: number } => typeof value.x === 'number' && typeof value.y === 'number')
  const centroidContinuity = centroids.length === input.env.frameCount
    && Math.max(...centroids.map((point) => point.x)) - Math.min(...centroids.map((point) => point.x)) < input.env.frameWidth
    && Math.max(...centroids.map((point) => point.y)) - Math.min(...centroids.map((point) => point.y)) < input.env.frameHeight
  if (!input.inference.cudaAvailable || !/L4/i.test(input.inference.deviceName ?? '')) blockers.push('CUDA/L4 runtime was not confirmed.')
  if (!scopeOk || !frameCountOk || !dimensionsOk) blockers.push('Preview scope frame count, FPS, or dimensions do not match Phase 35F policy.')
  if (!maskCountOk || !overlayCountOk) blockers.push('Mask/overlay artifact counts do not match preview frame count.')
  if (!masksNonEmpty) blockers.push('One or more masks are empty or effectively full-frame.')
  if (!centroidContinuity) warnings.push('Basic centroid continuity check is warning-only and needs human visual review.')
  if (input.inference.prompt.source !== 'phase33d_mask_bbox') blockers.push('Prompt was not derived from Phase 33D mask evidence.')
  if (!input.artifactPrefix.startsWith('activation-real-video/phase35f/')) blockers.push('Artifact prefix is outside the approved Phase 35F private prefix.')
  return {
    status: blockers.length > 0 ? 'blocked' : 'warning',
    gates: [
      { gateId: 'source_integrity', status: 'passed', summary: 'Approved controlled Phase 32 private export only.' },
      { gateId: 'plan_snapshot_integrity', status: 'passed', summary: 'The orchestrator creates the approved snapshot before worker execution.' },
      { gateId: 'preview_scope', status: scopeOk && frameCountOk && dimensionsOk ? 'passed' : 'blocked', summary: `${input.env.frameCount} frames at ${input.env.frameWidth}x${input.env.frameHeight}, ${input.env.fps} fps.` },
      { gateId: 'model_integrity', status: 'passed', summary: 'Approved private SAM2 checkpoint/config copied and checksum verified.' },
      { gateId: 'sam2_mask_tracking', status: maskCountOk && masksNonEmpty ? 'passed' : 'blocked', summary: `Created ${input.maskCount} SAM2 masks and ${input.overlayCount} overlays.` },
      { gateId: 'composition_integrity', status: 'not_applicable', summary: 'Composition is performed by the Phase 35F orchestrator after mask generation.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Artifacts are written under private staging GCS prefixes only.' },
      { gateId: 'beta_readiness_evidence', status: input.env.fullControlledClip ? 'warning' : 'warning', summary: input.env.fullControlledClip ? 'Full controlled private preview runtime path completed; composition QA follows in orchestrator.' : 'Segment fallback runtime path completed; full feature readiness remains blocked.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'No providers, Revideo, FILM, slow motion, Real-ESRGAN, public access, production, external beta, paid production, or broad media executed.' },
    ],
    blockers,
    warnings,
  }
}

function realVideoRuntimeSafety() {
  return {
    approvedPhase32VideoOnly: true,
    approvedPhase33DAnchorOnly: true,
    arbitraryRealUserMediaUsed: false,
    fullVideoMaskExecuted: false,
    fullVideoTextBehindSubjectExecuted: false,
    textBehindSubjectVideoExecuted: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    revideoUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    rtxPro6000Used: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  } as const
}

function featureRuntimeSafety() {
  return {
    approvedControlledSourceOnly: true,
    arbitraryRealUserMediaUsed: false,
    full4KProcessingUsed: false,
    fullResolutionVideoProcessed: false,
    productionFullVideoMaskExported: false,
    finalDeliveryExportCreated: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    realEsrganUsed: false,
    revideoUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  } as const
}

function objectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '35c',
    runId,
    sha256,
    generatedFixtureOnly: 'true',
    providerExecuted: 'false',
    realMediaUsed: 'false',
    fullVideoMaskExecuted: 'false',
    publicAccessEnabled: 'false',
  }
}

function realVideoObjectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '35d',
    runId,
    sha256,
    approvedPhase32VideoOnly: 'true',
    approvedPhase33DAnchorOnly: 'true',
    providerExecuted: 'false',
    fullVideoMaskExecuted: 'false',
    textBehindSubjectVideoExecuted: 'false',
    publicAccessEnabled: 'false',
  }
}

function featureObjectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '35f',
    runId,
    sha256,
    approvedControlledSourceOnly: 'true',
    boundedPreviewOnly: 'true',
    providerExecuted: 'false',
    productionFullVideoMaskExported: 'false',
    finalDeliveryExportCreated: 'false',
    publicAccessEnabled: 'false',
  }
}

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const allowedBucket = bucketName === 'reeditpro-staging-reeditpro-generated-assets' || bucketName === 'reeditpro-staging-reeditpro-qa-artifacts'
  if (!allowedBucket) throw new Error(`Blocked Phase 35C output bucket: ${bucketName}`)
  if (!objectName.startsWith(`activation-sam2-runtime/phase35c/${runId}/`)) throw new Error(`Blocked Phase 35C output object: ${objectName}`)
}

function assertRealVideoRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const allowed =
    bucketName === 'reeditpro-staging-reeditpro-generated-assets'
    || bucketName === 'reeditpro-staging-reeditpro-masks'
    || bucketName === 'reeditpro-staging-reeditpro-qa-artifacts'
  if (!allowed) throw new Error(`Blocked Phase 35D output bucket: ${bucketName}`)
  if (!objectName.startsWith(`activation-real-video/phase35d/${runId}/`)) throw new Error(`Blocked Phase 35D output object: ${objectName}`)
}

function assertFeatureRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const allowed =
    bucketName === 'reeditpro-staging-reeditpro-generated-assets'
    || bucketName === 'reeditpro-staging-reeditpro-masks'
    || bucketName === 'reeditpro-staging-reeditpro-qa-artifacts'
  if (!allowed) throw new Error(`Blocked Phase 35F output bucket: ${bucketName}`)
  if (!objectName.startsWith(`activation-real-video/phase35f/${runId}/`)) throw new Error(`Blocked Phase 35F output object: ${objectName}`)
}

function parseGcsPrefix(gcsUri: string): { bucket: string; prefix: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], prefix: match[2] }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})
