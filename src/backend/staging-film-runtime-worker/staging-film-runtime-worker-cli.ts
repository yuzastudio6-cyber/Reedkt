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

const expectedFiles = [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
] as const

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-film-runtime-${env.runId}`)
  const modelDir = env.artifactRuntimePath
  const pythonOutputPath = path.join(workDir, 'film-runtime-output.json')

  await resetWorkDirs(workDir, modelDir)
  try {
    const copiedFiles = await syncApprovedModel(storage, env, modelDir)
    const checksumResult = await verifyChecksums(modelDir, env)
    const inference = await runFilmInterpolation({
      workDir,
      modelPath: path.join(modelDir, 'film_net/Style/saved_model'),
      outputPath: pythonOutputPath,
    })

    const artifacts: ArtifactRecord[] = []
    const frameArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.fixture.framePaths) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixture/${path.basename(framePath)}`, framePath, 'image/png', env.runId)
      frameArtifacts.push(artifact)
      artifacts.push(artifact)
    }

    const interpolationArtifacts: ArtifactRecord[] = []
    for (const framePath of inference.interpolation.interpolatedFramePaths) {
      const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/${path.basename(framePath)}`, framePath, 'image/png', env.runId)
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
    }, env.runId)
    const interpolationManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/interpolated/interpolation-sequence-manifest.json`, {
      phase: '38C',
      runId: env.runId,
      interpolationTime: inference.fixture.interpolationTime,
      interpolatedFrameUris: interpolationArtifacts.map((artifact) => artifact.gcsUri),
      metrics: inference.interpolation.metrics,
    }, env.runId)
    const checksumArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/model-checksum-verification.json`, checksumResult, env.runId)
    const runtimeMetadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/film-runtime-metadata.json`, {
      phase: '38C',
      runId: env.runId,
      tensorflowVersion: inference.tensorflowVersion,
      modelLoaded: inference.modelLoaded,
      networkBlocked: inference.networkBlocked,
      copiedFiles,
      checksumResult,
      safety: runtimeSafety(),
      image: {
        image: process.env.REEDITPRO_IMAGE_REF,
        digest: process.env.REEDITPRO_IMAGE_DIGEST,
      },
    }, env.runId)
    artifacts.push(fixtureManifestArtifact, interpolationManifestArtifact, checksumArtifact, runtimeMetadataArtifact)

    const qa = buildQa(env, inference, frameArtifacts.length, interpolationArtifacts.length)
    const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/film-runtime-qa.json`, {
      phase: '38C',
      runId: env.runId,
      ...qa,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    }, env.runId)
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
  } as RuntimeEnv
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
  assertSafeRunId(runId)
  return env
}

async function syncApprovedModel(storage: Storage, env: RuntimeEnv, modelDir: string): Promise<string[]> {
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

async function verifyChecksums(modelDir: string, env: RuntimeEnv) {
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

async function runFilmInterpolation(input: { workDir: string; modelPath: string; outputPath: string }): Promise<PythonRuntimeOutput> {
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
  return JSON.parse(await readFile(input.outputPath, 'utf8')) as PythonRuntimeOutput
}

function buildQa(env: RuntimeEnv, inference: PythonRuntimeOutput, frameCount: number, interpolatedFrameCount: number) {
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

async function uploadFile(storage: Storage, bucketName: string, objectName: string, filePath: string, contentType: string, runId: string): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId)
  const bytes = await readFile(filePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  await storage.bucket(bucketName).upload(filePath, {
    destination: objectName,
    metadata: { contentType, metadata: objectMetadata(runId, sha256) },
  })
  return { id: objectName.replaceAll('/', '-'), kind: contentType, bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: bytes.length, sha256 }
}

async function uploadJson(storage: Storage, bucketName: string, objectName: string, payload: unknown, runId: string): Promise<ArtifactRecord> {
  assertRuntimeOutput(bucketName, objectName, runId)
  const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`)
  const sha256 = createHash('sha256').update(body).digest('hex')
  await storage.bucket(bucketName).file(objectName).save(body, {
    resumable: false,
    metadata: { contentType: 'application/json', metadata: objectMetadata(runId, sha256) },
  })
  return { id: objectName.replaceAll('/', '-'), kind: 'application/json', bucket: bucketName, object: objectName, gcsUri: `gs://${bucketName}/${objectName}`, sizeBytes: body.length, sha256 }
}

function assertRuntimeOutput(bucketName: string, objectName: string, runId: string): void {
  const allowedBuckets = new Set([
    'reeditpro-staging-reeditpro-generated-assets',
    'reeditpro-staging-reeditpro-qa-artifacts',
  ])
  if (!allowedBuckets.has(bucketName)) throw new Error(`Blocked output bucket: ${bucketName}`)
  if (!objectName.startsWith(`activation-film-runtime/phase38c/${runId}/`)) throw new Error(`Blocked output object prefix: ${objectName}`)
  if (/public|signed-url|production|external-beta/i.test(objectName)) throw new Error(`Unsafe output object name: ${objectName}`)
}

function objectMetadata(runId: string, sha256: string): Record<string, string> {
  return {
    phase: '38C',
    runId,
    sha256,
    generatedFramesOnly: 'true',
    realMediaUsed: 'false',
    publicAccessEnabled: 'false',
  }
}

function runtimeSafety() {
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

function parseGcsPrefix(gcsUri: string): { bucket: string; prefix: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], prefix: match[2] }
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath)
  return createHash('sha256').update(bytes).digest('hex')
}

function assertExpectedHashes(env: RuntimeEnv): void {
  if (env.kerasMetadataSha256 !== '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853') throw new Error('Unexpected keras_metadata.pb checksum.')
  if (env.savedModelSha256 !== '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985') throw new Error('Unexpected saved_model.pb checksum.')
  if (env.variablesDataSha256 !== '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9') throw new Error('Unexpected variables data checksum.')
  if (env.variablesIndexSha256 !== 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5') throw new Error('Unexpected variables index checksum.')
  if (env.aggregateSha256 !== '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b') throw new Error('Unexpected aggregate checksum.')
}

function assertSafeRunId(runId: string): void {
  if (!/^phase38c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe run ID: ${runId}`)
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
