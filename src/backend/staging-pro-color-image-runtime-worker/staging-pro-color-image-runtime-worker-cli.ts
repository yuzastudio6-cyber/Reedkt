import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface RuntimeEnv {
  projectId: 'reeditpro'
  runId: string
  mode: 'generated_fixture_color_image'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactPrefix: string
}

interface PythonToolResult {
  toolId: 'opencolorio' | 'openimageio' | 'kornia'
  status: 'passed' | 'blocked'
  version?: string
  operation: string
  artifacts: string[]
  metrics: Record<string, number | string | boolean>
  blockers: string[]
  warnings: string[]
}

interface PythonOutput {
  ok: boolean
  runtimeDiagnostics: {
    pythonVersion: string
    pythonExecutable: string
    numpyVersion: string
    pillowVersion: string
  }
  fixture: {
    width: number
    height: number
    frameCount: number
    framePaths: string[]
    manifestPath: string
  }
  tools: PythonToolResult[]
  metadataPath: string
  warnings: string[]
}

interface ArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const workDir = path.join(os.tmpdir(), `reeditpro-pro-color-image-runtime-${env.runId}`)
  const outputPath = path.join(workDir, 'pro-color-image-runtime-output.json')
  await rm(workDir, { recursive: true, force: true })
  await mkdir(workDir, { recursive: true })

  const pythonOutput = await runLocalRuntime(workDir, outputPath)
  const artifacts: ArtifactRecord[] = []
  const frameUris: string[] = []

  for (const framePath of pythonOutput.fixture.framePaths) {
    const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixtures/${path.basename(framePath)}`, framePath, 'image/png', 'generated_fixture')
    artifacts.push(artifact)
    frameUris.push(artifact.gcsUri)
  }

  for (const tool of pythonOutput.tools) {
    for (const artifactPath of tool.artifacts) {
      artifacts.push(await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/tool-artifacts/${tool.toolId}/${path.basename(artifactPath)}`, artifactPath, mimeForPath(artifactPath), `${tool.toolId}_artifact`))
    }
  }

  const fixtureManifestArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/fixtures/fixture-manifest.json`, {
    phase: '40B',
    runId: env.runId,
    generatedFixtureOnly: true,
    width: pythonOutput.fixture.width,
    height: pythonOutput.fixture.height,
    frameCount: pythonOutput.fixture.frameCount,
    frameUris,
    fixtures: ['color_bars', 'gradient_ramp', 'alpha_checker_patch'],
    realVideoUsed: false,
    userMediaUsed: false,
  }, 'fixture_manifest')
  const metadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/pro-color-image-runtime-metadata.json`, {
    phase: '40B',
    runId: env.runId,
    runtimeMode: env.mode,
    image: {
      image: process.env.REEDITPRO_IMAGE_REF,
      digest: process.env.REEDITPRO_IMAGE_DIGEST,
    },
    tools: pythonOutput.tools,
    runtimeDiagnostics: pythonOutput.runtimeDiagnostics,
    safety: runtimeSafety(),
  }, 'runtime_metadata')
  artifacts.push(fixtureManifestArtifact, metadataArtifact)

  const qa = buildQa(pythonOutput, artifacts, env)
  const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/pro-color-image-runtime-qa.json`, {
    phase: '40B',
    runId: env.runId,
    ...qa,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }, 'qa')
  artifacts.push(qaArtifact)

  const report = {
    ok: qa.status === 'passed',
    phase: '40B',
    runId: env.runId,
    projectId: env.projectId,
    jobName: 'reeditpro-staging-pro-color-image-runtime-job',
    runtimeMode: env.mode,
    compute: {
      mode: 'cpu',
      cpu: 4,
      memory: '8Gi',
      gpuRequested: false,
    },
    image: {
      image: process.env.REEDITPRO_IMAGE_REF,
      digest: process.env.REEDITPRO_IMAGE_DIGEST,
    },
    runtimeDiagnostics: pythonOutput.runtimeDiagnostics,
    fixture: {
      generated: true,
      width: pythonOutput.fixture.width,
      height: pythonOutput.fixture.height,
      frameCount: pythonOutput.fixture.frameCount,
      frameUris,
    },
    tools: pythonOutput.tools,
    artifacts,
    qa,
    safety: runtimeSafety(),
    phase40CReadiness: {
      readyForControlledRealVideoProColorImageSample: qa.status === 'passed',
      reason: qa.status === 'passed'
        ? 'Phase 40B generated-fixture runtime QA passed; Phase 40C may plan one controlled real-video pro color/image sample only.'
        : 'Phase 40C remains blocked because Phase 40B generated-fixture runtime QA did not pass.',
    },
    warnings: [
      ...pythonOutput.warnings,
      'Generated image fixtures only; no real-video pro color/image QA yet.',
    ],
  }
  await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/reports/phase40b-report.json`, report, 'phase40b_report')
  console.log(JSON.stringify({
    ok: report.ok,
    runId: env.runId,
    reportUri: `gs://${env.qaBucket}/${env.artifactPrefix}/reports/phase40b-report.json`,
    blockers: qa.blockers,
  }, null, 2))
}

async function runLocalRuntime(workDir: string, outputPath: string): Promise<PythonOutput> {
  const { stdout, stderr } = await execFileAsync('python3', ['/app/pro_color_image_runtime_local.py', '--work-dir', workDir, '--output', outputPath], {
    timeout: 10 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      REEDITPRO_NETWORK_DISABLED: 'true',
    },
  })
  if (stderr.trim()) console.error(stderr)
  if (stdout.trim()) console.log(stdout)
  return JSON.parse(await readFile(outputPath, 'utf8')) as PythonOutput
}

function buildQa(output: PythonOutput, artifacts: ArtifactRecord[], env: RuntimeEnv) {
  const toolById = new Map(output.tools.map((tool) => [tool.toolId, tool]))
  const blockers = output.tools.flatMap((tool) => tool.blockers)
  if (output.fixture.frameCount !== 3) blockers.push(`Expected 3 generated fixtures, got ${output.fixture.frameCount}.`)
  if (!artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/')
    || artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/'))) {
    blockers.push('One or more artifacts were uploaded outside approved private Phase 40B prefixes.')
  }
  const gates = [
    gate('tool_runtime_integrity', output.tools.every((tool) => tool.status === 'passed'), 'OpenColorIO, OpenImageIO, and Kornia imports/operations completed.'),
    gate('fixture_integrity', output.fixture.frameCount === 3 && output.fixture.width === 256 && output.fixture.height === 256, 'Generated color bars, gradient, and alpha checker fixtures are bounded at 256x256.'),
    gate('opencolorio_result', toolById.get('opencolorio')?.status === 'passed', toolById.get('opencolorio')?.blockers.join('; ') || 'OpenColorIO generated/raw identity transform passed.'),
    gate('openimageio_result', toolById.get('openimageio')?.status === 'passed', toolById.get('openimageio')?.blockers.join('; ') || 'OpenImageIO read/write/metadata inspection passed.'),
    gate('kornia_result', toolById.get('kornia')?.status === 'passed', toolById.get('kornia')?.blockers.join('; ') || 'Kornia CPU transform and metrics passed.'),
    gate('image_artifact_integrity', artifacts.filter((artifact) => artifact.kind === 'generated_fixture').length === 3, 'Generated image artifacts were uploaded and locally hashed.'),
    gate('metadata_integrity', artifacts.some((artifact) => artifact.kind === 'fixture_manifest') && artifacts.some((artifact) => artifact.kind === 'runtime_metadata'), 'Fixture manifest and runtime metadata were uploaded.'),
    gate('color_transform_safety', toolById.get('opencolorio')?.metrics.maxAbsDiff === 0, 'Identity color transform produced no numeric drift.'),
    gate('artifact_privacy', blockers.every((blocker) => !blocker.includes('outside approved private')), 'Artifacts use private staging GCS prefixes only.'),
    gate('blocked_features', blockedFeaturesStillBlocked(env), 'Real media, providers, Revideo, final delivery, production, beta, and broad media stayed blocked.'),
  ]
  const gateBlockers = gates.filter((gateItem) => !gateItem.passed).map((gateItem) => `${gateItem.gateId}: ${gateItem.summary}`)
  return {
    status: blockers.length === 0 && gateBlockers.length === 0 ? 'passed' as const : 'blocked' as const,
    gates,
    blockers: [...blockers, ...gateBlockers],
    warnings: [
      ...output.warnings,
      'Visual quality is deterministic fixture QA only; no controlled real-video sample has been run.',
    ],
  }
}

function gate(gateId: string, passed: boolean, summary: string) {
  return { gateId, passed, severity: 'mandatory' as const, summary }
}

function blockedFeaturesStillBlocked(env: RuntimeEnv): boolean {
  return env.mode === 'generated_fixture_color_image'
    && (process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') === 'false'
    && (process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') === 'false'
    && (process.env.REVIDEO_ENABLED ?? 'false') === 'false'
    && (process.env.REEDITPRO_PRODUCTION_READY ?? 'false') === 'false'
    && (process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') === 'false'
    && (process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') === 'false'
}

function runtimeSafety() {
  return {
    realMediaUsed: false,
    realVideoUsed: false,
    userMediaUsed: false,
    providerExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    finalDeliveryCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

function readRuntimeEnv(): RuntimeEnv {
  const env: RuntimeEnv = {
    projectId: mustEqual('GCP_PROJECT_ID', 'reeditpro'),
    runId: mustMatch('REEDITPRO_PHASE40B_RUN_ID', /^phase40b-[0-9A-Za-z]+$/),
    mode: mustEqual('REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE', 'generated_fixture_color_image'),
    generatedAssetsBucket: mustEqual('REEDITPRO_PHASE40B_GENERATED_ASSETS_BUCKET', 'reeditpro-staging-reeditpro-generated-assets'),
    qaBucket: mustEqual('REEDITPRO_PHASE40B_QA_BUCKET', 'reeditpro-staging-reeditpro-qa-artifacts'),
    workerTempBucket: mustEqual('REEDITPRO_PHASE40B_WORKER_TEMP_BUCKET', 'reeditpro-staging-reeditpro-worker-temp'),
    artifactPrefix: mustMatch('REEDITPRO_PHASE40B_ARTIFACT_PREFIX', /^activation-pro-color-image\/phase40b\/phase40b-[0-9A-Za-z]+$/),
  }
  mustEqual('GCP_REGION', 'us-central1')
  mustEqual('REEDITPRO_ENV', 'staging')
  mustEqual('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME', 'true')
  mustEqual('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_KORNIA_TORCH_FIX', 'true')
  mustEqual('PROVIDER_EXECUTION_ENABLED', 'false')
  mustEqual('REAL_MEDIA_INPUT_ENABLED', 'false')
  mustEqual('REVIDEO_ENABLED', 'false')
  mustEqual('REEDITPRO_PRODUCTION_READY', 'false')
  mustEqual('REEDITPRO_EXTERNAL_BETA_READY', 'false')
  mustEqual('REEDITPRO_BROAD_REAL_MEDIA_READY', 'false')
  if (!env.artifactPrefix.endsWith(env.runId)) throw new Error('Phase 40B artifact prefix must end with the run ID.')
  return env
}

function mustEqual<T extends string>(name: string, expected: T): T {
  const actual = process.env[name]
  if (actual !== expected) throw new Error(`${name} must be exactly ${expected}.`)
  return expected
}

function mustMatch(name: string, pattern: RegExp): string {
  const actual = process.env[name]
  if (!actual || !pattern.test(actual)) throw new Error(`${name} is missing or unsafe.`)
  return actual
}

async function uploadJson(storage: Storage, bucket: string, object: string, data: unknown, kind: string): Promise<ArtifactRecord> {
  const payload = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await storage.bucket(bucket).file(object).save(payload, {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'no-store' },
  })
  return {
    id: path.basename(object).replace(/[^A-Za-z0-9_-]/g, '_'),
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: payload.length,
    sha256: createHash('sha256').update(payload).digest('hex'),
  }
}

async function uploadFile(storage: Storage, bucket: string, object: string, filePath: string, contentType: string, kind: string): Promise<ArtifactRecord> {
  await storage.bucket(bucket).upload(filePath, {
    destination: object,
    resumable: false,
    metadata: {
      contentType,
      cacheControl: 'no-store',
    },
  })
  return {
    id: path.basename(filePath).replace(/[^A-Za-z0-9_-]/g, '_'),
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: (await stat(filePath)).size,
    sha256: createHash('sha256').update(await readFile(filePath)).digest('hex'),
  }
}

function mimeForPath(filePath: string): string {
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
