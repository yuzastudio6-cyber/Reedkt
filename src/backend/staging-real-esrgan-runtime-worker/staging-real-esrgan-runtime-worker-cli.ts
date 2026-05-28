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
  mode: 'phase34c_generated_image'
  modelManifestId: 'real_esrgan_x4plus_staging_v1'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus'
  expectedFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1'
  expectedAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5'
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

interface PythonEnhancementOutput {
  ok: boolean
  cudaAvailable: boolean
  deviceName?: string
  fixture: {
    width: number
    height: number
    path: string
    kind: 'generated_fixture'
  }
  enhanced: {
    width: number
    height: number
    scale: number
    path: string
    sizeBytes: number
  }
  runtime: {
    modelName: 'RealESRGAN_x4plus'
    tile: 64
    faceEnhanceRan: false
    gfpganImported: false
    filmUsed: false
    modelDownloadedExternally: false
  }
  warnings: string[]
}

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-real-esrgan-runtime-${env.runId}`)
  const fixturePath = path.join(workDir, 'synthetic-input.png')
  const enhancedPath = path.join(workDir, 'enhanced.png')
  const pythonOutputPath = path.join(workDir, 'real-esrgan-output.json')

  await resetWorkDirs(workDir, env.modelRuntimePath)
  try {
    const copiedFiles = await syncApprovedModel(storage, env)
    const checksumResult = await verifyChecksums(env.modelRuntimePath, env.expectedFileSha256, env.expectedAggregateSha256)
    const modelScan = await scanRuntimeModelFiles(env.modelRuntimePath)
    if (modelScan.blockers.length > 0) throw new Error(`Real-ESRGAN model scan blocked: ${modelScan.blockers.join('; ')}`)
    const enhancement = await runRealEsrganInference({
      modelPath: path.join(env.modelRuntimePath, 'RealESRGAN_x4plus.pth'),
      fixturePath,
      enhancedPath,
      outputPath: pythonOutputPath,
    })

    const artifacts: ArtifactRecord[] = []
    const fixtureArtifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/synthetic-input.png`, fixturePath, 'image/png', env.runId)
    const enhancedArtifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/enhanced/enhanced.png`, enhancedPath, 'image/png', env.runId)
    artifacts.push(fixtureArtifact, enhancedArtifact)
    const metadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/enhancement-metadata.json`, {
      phase: '34c',
      runId: env.runId,
      modelManifestId: env.modelManifestId,
      modelFileSha256: checksumResult.fileSha256,
      modelAggregateSha256: checksumResult.aggregateSha256,
      copiedFiles,
      modelScan,
      enhancement,
      safety: runtimeSafety(modelScan, enhancement),
    }, env.runId)
    artifacts.push(metadataArtifact)

    const qa = buildEnhancementQa({
      inputWidth: enhancement.fixture.width,
      inputHeight: enhancement.fixture.height,
      outputWidth: enhancement.enhanced.width,
      outputHeight: enhancement.enhanced.height,
      outputSizeBytes: enhancedArtifact.sizeBytes ?? enhancement.enhanced.sizeBytes,
      enhancedProduced: true,
      faceEnhanceRan: enhancement.runtime.faceEnhanceRan,
      disallowedWeightsPresent: modelScan.disallowedWeightsPresent,
    })
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/enhancement-qa.json`, {
      phase: '34c',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
      fullVideoEnhancementAllowed: false,
      slowMotionAllowed: false,
    }, env.runId)
    artifacts.push(qaArtifact)

    const reportObject = `${env.artifactPrefix}/reports/phase34c-report.json`
    const report = {
      ok: enhancement.ok && qa.status !== 'blocked',
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
        cudaAvailable: enhancement.cudaAvailable,
        deviceName: enhancement.deviceName,
      },
      model: {
        manifestId: env.modelManifestId,
        name: 'RealESRGAN_x4plus',
        releaseVersion: 'v0.1.0',
        sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
        gcsPath: env.modelGcsPath,
        runtimePath: env.modelRuntimePath,
        fileSha256: checksumResult.fileSha256,
        aggregateSha256: checksumResult.aggregateSha256,
        copiedFiles,
      },
      fixture: {
        generated: true,
        width: enhancement.fixture.width,
        height: enhancement.fixture.height,
        gcsUri: fixtureArtifact.gcsUri,
      },
      enhanced: {
        status: enhancement.ok ? 'completed' : 'failed',
        width: enhancement.enhanced.width,
        height: enhancement.enhanced.height,
        scale: enhancement.enhanced.scale,
        gcsUri: enhancedArtifact.gcsUri,
        metadataUri: metadataArtifact.gcsUri,
        sizeBytes: enhancedArtifact.sizeBytes,
        sha256: enhancedArtifact.sha256,
      },
      qa,
      artifacts,
      safety: runtimeSafety(modelScan, enhancement),
      uploadedReport: {
        bucket: env.qaBucket,
        object: reportObject,
        gcsUri: `gs://${env.qaBucket}/${reportObject}`,
      },
      warnings: Array.from(new Set([...modelScan.warnings, ...enhancement.warnings, ...qa.warnings])),
    }
    const reportArtifact = await uploadJson(storage, env.qaBucket, reportObject, report, env.runId)
    report.artifacts.push(reportArtifact)
    console.log(JSON.stringify(report))
  } finally {
    await cleanupWorkDirs(workDir, env.modelRuntimePath)
  }
}

function readRuntimeEnv(): RuntimeEnv {
  if (process.env.REEDITPRO_ENV !== 'staging') throw new Error('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_REAL_ESRGAN_RUNTIME !== 'true') throw new Error('REEDITPRO_CONFIRM_REAL_ESRGAN_RUNTIME=true is required.')
  if (process.env.REEDITPRO_REAL_ESRGAN_RUNTIME_MODE !== 'phase34c_generated_image') throw new Error('Only phase34c_generated_image mode is allowed.')
  if (process.env.PROVIDER_EXECUTION_ENABLED !== 'false') throw new Error('PROVIDER_EXECUTION_ENABLED=false is required.')
  if (process.env.MODEL_DOWNLOADS_ENABLED !== 'false') throw new Error('MODEL_DOWNLOADS_ENABLED=false is required.')
  if (process.env.REAL_ESRGAN_FACE_ENHANCE !== 'false') throw new Error('REAL_ESRGAN_FACE_ENHANCE=false is required.')
  if (process.env.REEDITPRO_APPROVED_ENHANCEMENT_MODEL_ID !== 'real_esrgan_x4plus_staging_v1') throw new Error('Only real_esrgan_x4plus_staging_v1 is allowed.')
  if (process.env.REEDITPRO_MODEL_GCS_PATH !== 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/') throw new Error('Only the approved private Real-ESRGAN model path is allowed.')
  if (process.env.REEDITPRO_MODEL_RUNTIME_PATH !== '/tmp/reeditpro-model-weights/real-esrgan/x4plus') throw new Error('Unexpected Real-ESRGAN runtime path.')
  if (process.env.REEDITPRO_MODEL_EXPECTED_FILE_SHA256 !== '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1') throw new Error('Unexpected RealESRGAN_x4plus file checksum.')
  if (process.env.REEDITPRO_MODEL_EXPECTED_AGGREGATE_SHA256 !== '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5') throw new Error('Unexpected RealESRGAN_x4plus aggregate checksum.')
  const runId = process.env.REEDITPRO_PHASE34C_RUN_ID ?? `phase34c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  if (!/^phase34c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 34C run id: ${runId}`)

  return {
    projectId: 'reeditpro',
    jobName: process.env.K_SERVICE ?? process.env.CLOUD_RUN_JOB ?? 'reeditpro-staging-real-esrgan-runtime-job',
    runId,
    mode: 'phase34c_generated_image',
    modelManifestId: 'real_esrgan_x4plus_staging_v1',
    modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/',
    modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus',
    expectedFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
    expectedAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5',
    generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
    qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    artifactPrefix: `activation-enhancement-runtime/phase34c/${runId}`,
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
  await downloadModelObject(storage, bucket, checksumObject, path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'))
  await downloadModelObject(storage, bucket, treeManifestObject, path.join(env.modelRuntimePath, 'model_tree_manifest.json'))
  const treeManifest = JSON.parse(await readFile(path.join(env.modelRuntimePath, 'model_tree_manifest.json'), 'utf8')) as {
    modelName?: string
    releaseVersion?: string
    fileSha256?: string
    aggregateSha256?: string
    modelWeightFiles?: string[]
  }
  if (treeManifest.modelName !== 'RealESRGAN_x4plus') throw new Error('Real-ESRGAN model tree manifest model name does not match Phase 34B evidence.')
  if (treeManifest.releaseVersion !== 'v0.1.0') throw new Error('Real-ESRGAN model tree manifest release does not match Phase 34B evidence.')
  if (treeManifest.fileSha256 !== env.expectedFileSha256) throw new Error('Real-ESRGAN model tree manifest file checksum does not match Phase 34B evidence.')
  if (treeManifest.aggregateSha256 !== env.expectedAggregateSha256) throw new Error('Real-ESRGAN model tree manifest aggregate checksum does not match Phase 34B evidence.')
  if (treeManifest.modelWeightFiles?.length !== 1 || treeManifest.modelWeightFiles[0] !== 'RealESRGAN_x4plus.pth') throw new Error('Real-ESRGAN model tree manifest must include only RealESRGAN_x4plus.pth.')

  const checksumText = await readFile(path.join(env.modelRuntimePath, 'file_checksums_sha256.txt'), 'utf8')
  const relativePaths = checksumText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/).slice(1).join(' '))
  if (relativePaths.length !== 1 || relativePaths[0] !== 'RealESRGAN_x4plus.pth') {
    throw new Error(`Only RealESRGAN_x4plus.pth may be copied; got ${relativePaths.join(', ')}`)
  }
  for (const relativePath of relativePaths) {
    assertSafeRelativePath(relativePath)
    await downloadModelObject(storage, bucket, `${prefix}${relativePath}`, path.join(env.modelRuntimePath, relativePath))
  }

  return [...relativePaths, 'file_checksums_sha256.txt', 'model_tree_manifest.json']
}

async function verifyChecksums(runtimePath: string, expectedFileSha256: string, expectedAggregateSha256: string): Promise<{ fileSha256: string; aggregateSha256: string }> {
  const checksumText = await readFile(path.join(runtimePath, 'file_checksums_sha256.txt'), 'utf8')
  const aggregateSha256 = createHash('sha256').update(checksumText).digest('hex')
  if (aggregateSha256 !== expectedAggregateSha256) throw new Error(`Aggregate checksum mismatch: ${aggregateSha256}`)
  const line = checksumText.split('\n').find(Boolean)
  if (!line) throw new Error('Checksum manifest is empty.')
  const [manifestSha256, ...pathParts] = line.trim().split(/\s+/)
  const relativePath = pathParts.join(' ')
  if (relativePath !== 'RealESRGAN_x4plus.pth') throw new Error(`Unexpected checksum manifest path: ${relativePath}`)
  if (manifestSha256 !== expectedFileSha256) throw new Error(`Checksum manifest does not match expected file checksum: ${manifestSha256}`)
  const fileSha256 = createHash('sha256').update(await readFile(path.join(runtimePath, relativePath))).digest('hex')
  if (fileSha256 !== expectedFileSha256) throw new Error(`File checksum mismatch for ${relativePath}: ${fileSha256}`)
  return { fileSha256, aggregateSha256 }
}

async function scanRuntimeModelFiles(runtimePath: string): Promise<{
  copiedModelFiles: string[]
  disallowedWeightsPresent: boolean
  warnings: string[]
  blockers: string[]
}> {
  const manifest = JSON.parse(await readFile(path.join(runtimePath, 'model_tree_manifest.json'), 'utf8')) as { modelWeightFiles?: string[] }
  const copiedModelFiles = manifest.modelWeightFiles ?? []
  const blockers: string[] = []
  const warnings = ['Real-ESRGAN package dependencies may include GFPGAN/facexlib libraries, but no GFPGAN/facexlib weights are allowed or used.']
  const allowed = new Set(['RealESRGAN_x4plus.pth'])
  for (const file of copiedModelFiles) {
    if (!allowed.has(file)) blockers.push(`Disallowed model weight listed in manifest: ${file}`)
    if (/film|gfpgan|facexlib|anime|x2plus|general|sam2|birefnet|deepfilter|demucs|paddle/i.test(file)) blockers.push(`Blocked model weight name found: ${file}`)
  }
  return {
    copiedModelFiles,
    disallowedWeightsPresent: blockers.length > 0,
    warnings,
    blockers,
  }
}

async function runRealEsrganInference(input: {
  modelPath: string
  fixturePath: string
  enhancedPath: string
  outputPath: string
}): Promise<PythonEnhancementOutput> {
  await execFileAsync('python3', [
    '/app/real-esrgan-runtime/real_esrgan_local.py',
    '--model-path',
    input.modelPath,
    '--fixture-path',
    input.fixturePath,
    '--enhanced-path',
    input.enhancedPath,
    '--output-json',
    input.outputPath,
  ], {
    timeout: 30 * 60_000,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REAL_ESRGAN_FACE_ENHANCE: 'false',
      TORCH_HOME: '/tmp/reeditpro-no-runtime-downloads',
      XDG_CACHE_HOME: '/tmp/reeditpro-no-runtime-downloads',
    },
  })
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonEnhancementOutput
}

async function downloadModelObject(storage: Storage, bucketName: string, objectName: string, targetPath: string): Promise<void> {
  if (bucketName !== 'reeditpro-staging-reeditpro-generated-assets' || !objectName.startsWith('model-weights/real-esrgan/x4plus/')) {
    throw new Error(`Blocked Real-ESRGAN model object: gs://${bucketName}/${objectName}`)
  }
  await mkdir(path.dirname(targetPath), { recursive: true })
  await storage.bucket(bucketName).file(objectName).download({ destination: targetPath })
}

async function uploadFile(
  storage: Storage,
  bucketName: string,
  objectName: string,
  filePath: string,
  contentType: string,
  runId: string,
): Promise<ArtifactRecord> {
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

function buildEnhancementQa(input: {
  inputWidth: number
  inputHeight: number
  outputWidth: number
  outputHeight: number
  outputSizeBytes: number
  enhancedProduced: boolean
  faceEnhanceRan: boolean
  disallowedWeightsPresent: boolean
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: Array<{ gateId: string; status: string; summary: string }>
  blockers: string[]
  warnings: string[]
} {
  const blockers: string[] = []
  const warnings = ['Phase 34C uses one generated synthetic image only and does not claim real-video enhancement quality.']
  const dimensionsX4 = input.outputWidth === input.inputWidth * 4 && input.outputHeight === input.inputHeight * 4
  const outputNonEmpty = input.outputSizeBytes > 0
  if (!input.enhancedProduced) blockers.push('Enhanced image was not produced.')
  if (!dimensionsX4) blockers.push('Enhanced image dimensions are not x4.')
  if (!outputNonEmpty) blockers.push('Enhanced image is empty.')
  if (input.faceEnhanceRan) blockers.push('GFPGAN/face enhancement ran.')
  if (input.disallowedWeightsPresent) blockers.push('Disallowed model weights were present.')
  const gates = [
    {
      gateId: 'enhancement_artifacts',
      status: input.enhancedProduced && dimensionsX4 && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && dimensionsX4 && outputNonEmpty
        ? `Enhanced PNG exists and is ${input.outputWidth}x${input.outputHeight}.`
        : 'Enhanced artifact creation or dimensions failed.',
    },
    {
      gateId: 'render_asset_integrity',
      status: input.enhancedProduced && outputNonEmpty ? 'passed' : 'blocked',
      summary: input.enhancedProduced && outputNonEmpty ? 'Fixture, enhanced image, metadata, QA, and report artifacts were generated.' : 'Artifact integrity failed.',
    },
    {
      gateId: 'sample_first_policy',
      status: 'passed',
      summary: 'Only a generated synthetic fixture was processed; no real media or full video was used.',
    },
    {
      gateId: 'runtime_safety',
      status: !input.faceEnhanceRan && !input.disallowedWeightsPresent ? 'passed' : 'blocked',
      summary: !input.faceEnhanceRan && !input.disallowedWeightsPresent
        ? 'No provider, runtime model download, GFPGAN/facexlib weight, or face enhancement use was reported.'
        : 'Runtime safety guard failed.',
    },
  ]
  return { status: blockers.length > 0 ? 'blocked' : 'warning', gates, blockers, warnings }
}

function runtimeSafety(
  modelScan: { disallowedWeightsPresent: boolean; copiedModelFiles: string[] },
  enhancement: PythonEnhancementOutput,
) {
  const names = modelScan.copiedModelFiles.join(' ')
  return {
    providerExecuted: false,
    modelDownloadedExternally: enhancement.runtime.modelDownloadedExternally,
    realMediaUsed: false,
    realVideoFrameUsed: false,
    filmUsed: enhancement.runtime.filmUsed,
    slowMotionExecuted: false,
    fullVideoEnhancementExecuted: false,
    faceEnhanceRan: enhancement.runtime.faceEnhanceRan,
    gfpganWeightsPresent: /gfpgan/i.test(names),
    facexlibWeightsPresent: /facexlib/i.test(names),
    alternateRealEsrganWeightsPresent: /anime|x2plus|general|realesrnet/i.test(names),
    secretValuesUsed: false,
    publicAccessEnabled: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  } as const
}

function objectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    app: 'reeditpro',
    env: 'staging',
    phase: '34c',
    runId,
    sha256,
    generatedFixtureOnly: 'true',
    realMediaUsed: 'false',
    providerExecuted: 'false',
    modelDownloadedExternally: 'false',
    filmUsed: 'false',
    slowMotionExecuted: 'false',
    fullVideoEnhancementExecuted: 'false',
    faceEnhanceRan: 'false',
  }
}

function parseGcsPrefix(uri: string): { bucket: string; prefix: string } {
  if (!uri.startsWith('gs://')) throw new Error(`Expected gs:// URI: ${uri}`)
  const withoutScheme = uri.slice('gs://'.length)
  const slashIndex = withoutScheme.indexOf('/')
  if (slashIndex < 0) return { bucket: withoutScheme, prefix: '' }
  return { bucket: withoutScheme.slice(0, slashIndex), prefix: withoutScheme.slice(slashIndex + 1).replace(/\/?$/, '/') }
}

function assertSafeRelativePath(relativePath: string): void {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) {
    throw new Error(`Unsafe model relative path: ${relativePath}`)
  }
}

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const prefix = `activation-enhancement-runtime/phase34c/${runId}/`
  const allowedBuckets = [
    'reeditpro-staging-reeditpro-generated-assets',
    'reeditpro-staging-reeditpro-qa-artifacts',
    'reeditpro-staging-reeditpro-worker-temp',
  ]
  if (!allowedBuckets.includes(bucketName) || !objectName.startsWith(prefix)) {
    throw new Error(`Blocked Phase 34C output object: gs://${bucketName}/${objectName}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
