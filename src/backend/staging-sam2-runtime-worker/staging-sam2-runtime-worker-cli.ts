import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm } from 'node:fs/promises'
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

async function main(): Promise<void> {
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

async function syncApprovedModel(storage: Storage, env: RuntimeEnv): Promise<string[]> {
  const { bucket, prefix } = parseGcsPrefix(env.modelGcsPath)
  const files = ['sam2.1_hiera_tiny.pt', 'sam2.1_hiera_t.yaml', 'file_checksums_sha256.txt', 'model_tree_manifest.json', 'source_evidence.json']
  for (const file of files) {
    await downloadObject(storage, bucket, `${prefix}${file}`, path.join(env.modelRuntimePath, file))
  }
  return files
}

async function verifyChecksums(runtimePath: string, env: RuntimeEnv): Promise<{
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

async function downloadObject(storage: Storage, bucketName: string, objectName: string, targetPath: string): Promise<void> {
  if (bucketName !== 'reeditpro-staging-reeditpro-generated-assets' || !objectName.startsWith('model-weights/sam2/sam2.1-hiera-tiny/')) {
    throw new Error(`Blocked SAM2 model object: gs://${bucketName}/${objectName}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
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

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const allowedBucket = bucketName === 'reeditpro-staging-reeditpro-generated-assets' || bucketName === 'reeditpro-staging-reeditpro-qa-artifacts'
  if (!allowedBucket) throw new Error(`Blocked Phase 35C output bucket: ${bucketName}`)
  if (!objectName.startsWith(`activation-sam2-runtime/phase35c/${runId}/`)) throw new Error(`Blocked Phase 35C output object: ${objectName}`)
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
