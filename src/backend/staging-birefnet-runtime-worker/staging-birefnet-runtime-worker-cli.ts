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
  phase: '33c' | '33d'
  mode: 'phase33c_generated_image' | 'phase33d_real_video_frame'
  modelManifestId: 'birefnet_main_staging_v1'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main'
  expectedSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7'
  modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4'
  sourcePhase32RunId?: 'phase32-20260528T13330'
  representativeFrameGcsUri?: string
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

interface PythonInferenceOutput {
  ok: boolean
  cudaAvailable: boolean
  deviceName?: string
  fixture: {
    width: number
    height: number
    path: string
    kind?: 'generated_fixture' | 'real_video_frame'
  }
  mask: {
    width: number
    height: number
    nonZeroRatio: number
    meanAlpha: number
    minAlpha: number
    maxAlpha: number
    path: string
    cutoutPath: string
  }
  warnings: string[]
}

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-birefnet-runtime-${env.runId}`)
  const fixturePath = path.join(workDir, 'synthetic-input.png')
  const representativeFramePath = path.join(workDir, 'representative-frame.png')
  const maskPath = path.join(workDir, 'mask.png')
  const cutoutPath = path.join(workDir, 'cutout.png')
  const inferenceOutputPath = path.join(workDir, 'birefnet-output.json')

  await resetWorkDirs(workDir, env.modelRuntimePath)
  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const aggregateSha256 = await verifyChecksums(env.modelRuntimePath, env.expectedSha256)
    const customCodeScan = await scanCustomCode(env.modelRuntimePath)
    if (customCodeScan.blockers.length > 0) throw new Error(`BiRefNet custom code scan blocked: ${customCodeScan.blockers.join('; ')}`)
    if (env.mode === 'phase33d_real_video_frame') {
      await downloadRepresentativeFrame(storage, env, representativeFramePath)
    }
    const inference = await runBiRefNetInference({
      modelPath: env.modelRuntimePath,
      fixturePath,
      inputImagePath: env.mode === 'phase33d_real_video_frame' ? representativeFramePath : undefined,
      inputKind: env.mode === 'phase33d_real_video_frame' ? 'real_video_frame' : 'generated_fixture',
      maskPath,
      cutoutPath,
      outputPath: inferenceOutputPath,
    })

    const artifacts: ArtifactRecord[] = []
    if (env.mode === 'phase33c_generated_image') {
      artifacts.push(await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/synthetic-input.png`, fixturePath, 'image/png', env.runId, env.phase))
    }
    const maskObject = env.phase === '33d' ? `${env.artifactPrefix}/mask/mask.png` : `${env.artifactPrefix}/mask/mask.png`
    const cutoutObject = env.phase === '33d' ? `${env.artifactPrefix}/cutout/cutout.png` : `${env.artifactPrefix}/mask/cutout.png`
    const maskArtifact = await uploadFile(storage, env.generatedAssetsBucket, maskObject, maskPath, 'image/png', env.runId, env.phase)
    const cutoutArtifact = await uploadFile(storage, env.generatedAssetsBucket, cutoutObject, cutoutPath, 'image/png', env.runId, env.phase)
    artifacts.push(maskArtifact, cutoutArtifact)
    const metadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/mask/mask-metadata.json`, {
      phase: env.phase,
      runId: env.runId,
      modelManifestId: env.modelManifestId,
      modelRevision: env.modelRevision,
      modelAggregateSha256: aggregateSha256,
      inference,
      safety: runtimeSafety(env.phase),
      representativeFrameGcsUri: env.representativeFrameGcsUri,
    }, env.runId, env.phase)
    artifacts.push(metadataArtifact)

    const qa = buildMaskQa({
      fixtureWidth: inference.fixture.width,
      fixtureHeight: inference.fixture.height,
      maskWidth: inference.mask.width,
      maskHeight: inference.mask.height,
      nonZeroRatio: inference.mask.nonZeroRatio,
      cutoutProduced: true,
      phase: env.phase,
    })
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/mask-qa.json`, {
      phase: env.phase,
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
      textBehindSubjectAllowed: false,
    }, env.runId, env.phase)
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/${env.phase === '33d' ? 'phase33d-report.json' : 'phase33c-report.json'}`
    const report = {
      ok: inference.ok && qa.status !== 'blocked',
      runId: env.runId,
      sourcePhase32RunId: env.sourcePhase32RunId,
      projectId: env.projectId,
      jobName: env.jobName,
      gpu: {
        requested: true,
        type: 'nvidia-l4',
        count: 1,
        cudaAvailable: inference.cudaAvailable,
        deviceName: inference.deviceName,
      },
      model: {
        manifestId: env.modelManifestId,
        name: 'ZhengPeng7/BiRefNet',
        revision: env.modelRevision,
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        aggregateSha256,
        copiedFiles,
      },
      customCodeScan,
      fixture: {
        generated: env.phase === '33c',
        width: inference.fixture.width,
        height: inference.fixture.height,
        gcsUri: artifacts.find((artifact) => artifact.id.endsWith('synthetic-input.png'))?.gcsUri,
      },
      representativeFrame: env.phase === '33d' ? {
        gcsUri: env.representativeFrameGcsUri,
        width: inference.fixture.width,
        height: inference.fixture.height,
      } : undefined,
      mask: {
        status: inference.ok ? 'completed' : 'failed',
        width: inference.mask.width,
        height: inference.mask.height,
        nonZeroRatio: inference.mask.nonZeroRatio,
        meanAlpha: inference.mask.meanAlpha,
        maskUri: maskArtifact.gcsUri,
        cutoutUri: cutoutArtifact.gcsUri,
        metadataUri: metadataArtifact.gcsUri,
      },
      qa,
      artifacts,
      safety: runtimeSafety(env.phase),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...customCodeScan.warnings, ...inference.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, env.runId, env.phase)
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, env.modelRuntimePath)
  }
}

function readRuntimeEnv(): RuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_BIREFNET_RUNTIME !== 'true') throw new Error('REEDITPRO_CONFIRM_BIREFNET_RUNTIME=true is required.')
  const mode = process.env.REEDITPRO_BIREFNET_RUNTIME_MODE
  if (mode !== 'phase33c_generated_image' && mode !== 'phase33d_real_video_frame') throw new Error('Only phase33c_generated_image or phase33d_real_video_frame mode is allowed.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.HF_HUB_OFFLINE !== '1') throw new Error('HF_HUB_OFFLINE=1 is required.')
  if (process.env.TRANSFORMERS_OFFLINE !== '1') throw new Error('TRANSFORMERS_OFFLINE=1 is required.')
  if (process.env.REEDITPRO_APPROVED_MASK_MODEL_ID !== 'birefnet_main_staging_v1') throw new Error('Only birefnet_main_staging_v1 is allowed.')
  if (process.env.REEDITPRO_MODEL_GCS_PATH !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/') throw new Error('Only the approved private BiRefNet model path is allowed.')
  if (process.env.REEDITPRO_MODEL_RUNTIME_PATH !== '/tmp/reeditpro-model-weights/birefnet/main') throw new Error('Unexpected BiRefNet runtime path.')
  if (process.env.REEDITPRO_MODEL_EXPECTED_SHA256 !== '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7') throw new Error('Unexpected BiRefNet checksum.')
  if (process.env.REEDITPRO_MODEL_REVISION !== 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4') throw new Error('Unexpected BiRefNet revision.')

  const phase = mode === 'phase33d_real_video_frame' ? '33d' : '33c'
  if (phase === '33d') {
    if (process.env.REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK !== 'true') throw new Error('REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK=true is required for Phase 33D.')
    if (process.env.REEDITPRO_PHASE32_RUN_ID !== 'phase32-20260528T13330') throw new Error('Phase 33D is locked to Phase 32 run phase32-20260528T13330.')
  }

  const runId = phase === '33d'
    ? process.env.REEDITPRO_PHASE33D_RUN_ID
    : process.env.REEDITPRO_PHASE33C_RUN_ID ?? `phase33c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!runId) throw new Error('REEDITPRO_PHASE33D_RUN_ID is required for Phase 33D.')
  if (phase === '33c' && !/^phase33c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33C run id: ${runId}`)
  if (phase === '33d' && !/^phase33d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 33D run id: ${runId}`)

  const representativeFrameGcsUri = phase === '33d' ? process.env.REEDITPRO_PHASE33D_INPUT_FRAME_GCS_URI : undefined
  if (phase === '33d') {
    const expectedPrefix = `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/${runId}/representative-frame/`
    if (!representativeFrameGcsUri?.startsWith(expectedPrefix) || !representativeFrameGcsUri.endsWith('/frame.png')) {
      throw new Error('Phase 33D input frame must be the approved private representative frame object for this run.')
    }
  }

  return {
    projectId: 'reeditpro',
    jobName: process.env.K_SERVICE ?? 'reeditpro-staging-birefnet-runtime-job',
    runId,
    phase,
    mode,
    modelManifestId: 'birefnet_main_staging_v1',
    modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/',
    modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main',
    expectedSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
    modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4',
    sourcePhase32RunId: phase === '33d' ? 'phase32-20260528T13330' : undefined,
    representativeFrameGcsUri,
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    artifactPrefix: phase === '33d' ? `activation-real-video/phase33d/${runId}` : `activation-mask-runtime/phase33c/${runId}`,
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
  const checksumObject = `${prefix}file_checksums_sha256.txt`
  const treeManifestObject = `${prefix}model_tree_manifest.json`
  await downloadObject(storage, bucket, checksumObject, path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'))
  await downloadObject(storage, bucket, treeManifestObject, path.join(env.modelRuntimePath, 'model_tree_manifest.json'))
  const treeManifest = JSON.parse(await readFile(path.join(env.modelRuntimePath, 'model_tree_manifest.json'), 'utf8')) as { resolvedRevision?: string; aggregateSha256?: string }
  if (treeManifest.resolvedRevision !== env.modelRevision) throw new Error('BiRefNet model tree manifest revision does not match Phase 33B evidence.')
  if (treeManifest.aggregateSha256 !== env.expectedSha256) throw new Error('BiRefNet model tree manifest checksum does not match Phase 33B evidence.')

  const checksumText = await readFile(path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'), 'utf8')
  const relativePaths = checksumText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/).slice(1).join(' '))
  for (const relativePath of relativePaths) {
    assertSafeRelativePath(relativePath)
    await downloadObject(storage, bucket, `${prefix}${relativePath}`, path.join(env.modelRuntimePath, relativePath))
  }

  return [...relativePaths, 'file_checksums_sha256.txt', 'model_tree_manifest.json']
}

async function verifyChecksums(runtimePath: string, expectedAggregate: string): Promise<string> {
  const checksumText = await readFile(path.join(runtimePath, 'file_checksums_sha256.txt'), 'utf8')
  const aggregate = createHash('sha256').update(checksumText).digest('hex')
  if (aggregate !== expectedAggregate) throw new Error(`Aggregate checksum mismatch: ${aggregate}`)

  for (const line of checksumText.split('\n').filter(Boolean)) {
    const [expected, ...pathParts] = line.trim().split(/\s+/)
    const relativePath = pathParts.join(' ')
    assertSafeRelativePath(relativePath)
    const actual = createHash('sha256').update(await readFile(path.join(runtimePath, relativePath))).digest('hex')
    if (actual !== expected) throw new Error(`Checksum mismatch for ${relativePath}`)
  }
  return aggregate
}

async function scanCustomCode(runtimePath: string): Promise<{
  customCodeFiles: string[]
  executedAllowlist: string[]
  neverImportedFiles: string[]
  blockedPatterns: string[]
  warnings: string[]
  blockers: string[]
}> {
  const customCodeFiles = ['BiRefNet_config.py', 'birefnet.py', 'handler.py']
  const executedAllowlist = ['BiRefNet_config.py', 'birefnet.py']
  const neverImportedFiles = ['handler.py']
  const blockers: string[] = []
  const warnings: string[] = []
  const blockedPatterns = ['requests/network imports in executed files', 'subprocess/shell execution in executed files', 'unsafe writes outside runtime temp paths']
  for (const file of customCodeFiles) {
    const body = await readFile(path.join(runtimePath, file), 'utf8')
    const isExecuted = executedAllowlist.includes(file)
    if (isExecuted && /\b(requests|urllib|socket|httpx)\b/.test(body)) blockers.push(`${file} contains network import/use and is in the executed allowlist.`)
    if (isExecuted && /\b(subprocess|Popen|os\.system|system\(|shutil\.rmtree)\b/.test(body)) blockers.push(`${file} contains shell/destructive execution pattern and is in the executed allowlist.`)
    if (isExecuted && /open\([^)]*,\s*['"][wa]/.test(body)) blockers.push(`${file} contains a write-mode open call and is in the executed allowlist.`)
    if (!isExecuted && /\brequests\b/.test(body)) warnings.push(`${file} contains network helper code and is intentionally never imported in this BiRefNet runtime mode.`)
  }
  return { customCodeFiles, executedAllowlist, neverImportedFiles, blockedPatterns, warnings, blockers }
}

async function runBiRefNetInference(input: {
  modelPath: string
  fixturePath: string
  inputImagePath?: string
  inputKind: 'generated_fixture' | 'real_video_frame'
  maskPath: string
  cutoutPath: string
  outputPath: string
}): Promise<PythonInferenceOutput> {
  const args = [
    '/app/birefnet-runtime/birefnet_local.py',
    '--model-path',
    input.modelPath,
    '--fixture-path',
    input.fixturePath,
    '--input-kind',
    input.inputKind,
    '--mask-path',
    input.maskPath,
    '--cutout-path',
    input.cutoutPath,
    '--output-json',
    input.outputPath,
  ]
  if (input.inputImagePath) args.push('--input-image-path', input.inputImagePath)
  await execFileAsync('python3', args, {
    timeout: 30 * 60_000,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      HF_DATASETS_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonInferenceOutput
}

async function downloadObject(storage: Storage, bucketName: string, objectName: string, targetPath: string): Promise<void> {
  if (bucketName !== 'reeditpro-staging-reeditpro-generated-assets' || !objectName.startsWith('model-weights/birefnet/main/')) {
    throw new Error(`Blocked BiRefNet model object: gs://${bucketName}/${objectName}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
}

async function downloadRepresentativeFrame(storage: Storage, env: RuntimeEnv, targetPath: string): Promise<void> {
  if (env.phase !== '33d' || !env.representativeFrameGcsUri) throw new Error('Representative frame download is only allowed for Phase 33D.')
  const { bucket, object } = parseGcsObject(env.representativeFrameGcsUri)
  const expectedPrefix = `activation-real-video/phase33d/${env.runId}/representative-frame/`
  if (bucket !== env.generatedAssetsBucket || object !== `${expectedPrefix}frame.png`) {
    throw new Error(`Blocked representative frame object: ${env.representativeFrameGcsUri}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination: targetPath })
}

async function uploadFile(
  storage: Storage,
  bucketName: string,
  objectName: string,
  filePath: string,
  contentType: string,
  runId: string,
  phase: '33c' | '33d' = '33c',
): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId, phase)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: {
      contentType,
      metadata: objectMetadata(runId, sha256, phase),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string, phase: '33c' | '33d' = '33c'): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId, phase)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: {
      contentType: 'application/json',
      metadata: objectMetadata(runId, sha256, phase),
    },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

function buildMaskQa(input: {
  fixtureWidth: number
  fixtureHeight: number
  maskWidth: number
  maskHeight: number
  nonZeroRatio: number
  cutoutProduced: boolean
  phase: '33c' | '33d'
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<{ gateId: string; status: string; summary: string }>
  blockers: string[]
  warnings: string[]
} {
  const blockers: string[] = []
  const warnings = [input.phase === '33d'
    ? 'mask_temporal_stability is not_applicable because Phase 33D uses one representative frame only.'
    : 'mask_temporal_stability is not_applicable because Phase 33C uses one generated image only.']
  const dimensionsMatch = input.fixtureWidth === input.maskWidth && input.fixtureHeight === input.maskHeight
  const nonEmpty = input.nonZeroRatio > 0.005
  const notFullFrame = input.nonZeroRatio < 0.995
  if (!dimensionsMatch) blockers.push('Mask dimensions do not match fixture dimensions.')
  if (!nonEmpty) blockers.push('Mask is effectively empty.')
  if (!notFullFrame) blockers.push('Mask is effectively full-frame.')
  const gates = [
    {
      gateId: 'mask_edge_quality',
      status: nonEmpty && notFullFrame ? 'passed' : 'blocked',
      summary: nonEmpty && notFullFrame
        ? input.phase === '33d' ? 'Representative frame mask has foreground/background separation.' : 'Generated fixture mask has foreground/background separation.'
        : 'Mask lacks foreground/background separation.',
    },
    {
      gateId: 'mask_subject_coverage',
      status: nonEmpty && notFullFrame ? 'passed' : 'blocked',
      summary: `Mask non-zero ratio is ${input.nonZeroRatio.toFixed(4)}.`,
    },
    {
      gateId: 'render_asset_integrity',
      status: dimensionsMatch && input.cutoutProduced ? 'passed' : 'blocked',
      summary: dimensionsMatch && input.cutoutProduced ? 'Mask and RGBA cutout artifacts exist with matching dimensions.' : 'Mask/cutout artifact integrity failed.',
    },
    {
      gateId: 'mask_temporal_stability',
      status: 'not_applicable',
      summary: input.phase === '33d'
        ? 'Temporal stability is not claimed for a single representative frame.'
        : 'Temporal stability is not claimed for single-frame generated fixture.',
    },
    ...(input.phase === '33d' ? [{
      gateId: 'text_behind_subject_block',
      status: 'not_applicable',
      summary: 'Text-behind-subject execution is blocked in Phase 33D.',
    }] : []),
  ]
  return { status: blockers.length > 0 ? 'blocked' : 'warning', gates, blockers, warnings }
}

function runtimeSafety(phase: '33c' | '33d' = '33c') {
  if (phase === '33d') {
    return {
      approvedPhase32InputOnly: true,
      representativeFrameOnly: true,
      fullVideoMaskExecuted: false,
      secondSourceVideoUsed: false,
      providerExecuted: false,
      modelDownloadedExternally: false,
      sam2Used: false,
      textBehindSubjectExecuted: false,
      secretValuesUsed: false,
      publicAccessEnabled: false,
      rtxPro6000Used: false,
      revideoUsed: false,
    } as const
  }
  return {
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoFrameUsed: false,
    sam2Used: false,
    textBehindSubjectExecuted: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  } as const
}

function objectMetadata(runId: string, sha256: string, phase: '33c' | '33d'): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase,
    runId,
    sha256,
    generatedFixtureOnly: phase === '33c' ? 'true' : 'false',
    representativeFrameOnly: phase === '33d' ? 'true' : 'false',
    providerExecuted: 'false',
    modelDownloadedExternally: 'false',
    realMediaUsed: phase === '33d' ? 'true' : 'false',
    sam2Used: 'false',
    textBehindSubjectExecuted: 'false',
  }
}

function parseGcsPrefix(uri: string): { bucket: string; prefix: string } {
  if (!uri.startsWith('gs://')) throw new Error(`Expected gs:// URI: ${uri}`)
  const withoutScheme = uri.slice('gs://'.length)
  const slashIndex = withoutScheme.indexOf('/')
  if (slashIndex < 0) return { bucket: withoutScheme, prefix: '' }
  return { bucket: withoutScheme.slice(0, slashIndex), prefix: withoutScheme.slice(slashIndex + 1).replace(/\/?$/, '/') }
}

function parseGcsObject(uri: string): { bucket: string; object: string } {
  if (!uri.startsWith('gs://')) throw new Error(`Expected gs:// URI: ${uri}`)
  const withoutScheme = uri.slice('gs://'.length)
  const slashIndex = withoutScheme.indexOf('/')
  if (slashIndex < 0) throw new Error(`Expected object URI: ${uri}`)
  return { bucket: withoutScheme.slice(0, slashIndex), object: withoutScheme.slice(slashIndex + 1) }
}

function assertSafeRelativePath(relativePath: string): void {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) {
    throw new Error(`Unsafe model relative path: ${relativePath}`)
  }
}

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string, phase: '33c' | '33d'): void {
  const prefix = phase === '33d'
    ? `activation-real-video/phase33d/${runId}/`
    : `activation-mask-runtime/phase33c/${runId}/`
  const allowedBuckets = [
    'reeditpro-staging-reeditpro-generated-assets',
    'reeditpro-staging-reeditpro-qa-artifacts',
    'reeditpro-staging-reeditpro-worker-temp',
  ]
  if (!allowedBuckets.includes(bucketName) || !objectName.startsWith(prefix)) {
    throw new Error(`Blocked Phase ${phase.toUpperCase()} output object: gs://${bucketName}/${objectName}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
