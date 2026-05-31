import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type RuntimeMode = 'generated_fixture_color_image' | 'real_video_sample'

interface BaseRuntimeEnv {
  projectId: 'reeditpro'
  runId: string
  mode: RuntimeMode
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactPrefix: string
}

interface Phase40BRuntimeEnv extends BaseRuntimeEnv {
  mode: 'generated_fixture_color_image'
}

interface Phase40CRuntimeEnv extends BaseRuntimeEnv {
  mode: 'real_video_sample'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  inputVideoGcsUri: string
  phase40BReportGcsUri: string
  timestampsSeconds: number[]
  frameWidth: number
  frameHeight: number
  maxFrameCount: number
}

type RuntimeEnv = Phase40BRuntimeEnv | Phase40CRuntimeEnv

interface PythonToolResult {
  toolId: 'ffprobe' | 'ffmpeg' | 'opencolorio' | 'openimageio' | 'kornia'
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
  fixture?: {
    width: number
    height: number
    frameCount: number
    framePaths: string[]
    manifestPath: string
  }
  source?: {
    inputVideoPath: string
    durationSeconds?: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
    width?: number
    height?: number
  }
  sample?: {
    width: number
    height: number
    frameCount: number
    timestampsSeconds: number[]
    framePaths: string[]
    manifestPath: string
  }
  tools: PythonToolResult[]
  metadataPath: string
  contactSheetPath?: string
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

  if (env.mode === 'generated_fixture_color_image') {
    await runPhase40BGeneratedFixtureMode(storage, env, workDir, outputPath)
    return
  }

  await runPhase40CRealVideoSampleMode(storage, env, workDir, outputPath)
}

async function runPhase40BGeneratedFixtureMode(storage: Storage, env: Phase40BRuntimeEnv, workDir: string, outputPath: string): Promise<void> {
  const pythonOutput = await runLocalRuntime(workDir, outputPath)
  if (!pythonOutput.fixture) throw new Error('Phase 40B generated fixture runtime did not return fixture output.')
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
    image: imageInfo(),
    tools: pythonOutput.tools,
    runtimeDiagnostics: pythonOutput.runtimeDiagnostics,
    safety: phase40BRuntimeSafety(),
  }, 'runtime_metadata')
  artifacts.push(fixtureManifestArtifact, metadataArtifact)

  const qa = buildPhase40BQa(pythonOutput, artifacts, env)
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
    compute: cpuCompute(),
    image: imageInfo(),
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
    safety: phase40BRuntimeSafety(),
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

async function runPhase40CRealVideoSampleMode(storage: Storage, env: Phase40CRuntimeEnv, workDir: string, outputPath: string): Promise<void> {
  const sourcePath = path.join(workDir, 'source', 'phase32-color-corrected-export.mp4')
  const phase40BReportPath = path.join(workDir, 'evidence', 'phase40b-report.json')
  await mkdir(path.dirname(sourcePath), { recursive: true })
  await mkdir(path.dirname(phase40BReportPath), { recursive: true })
  await downloadGcsUri(storage, env.inputVideoGcsUri, sourcePath)
  await downloadGcsUri(storage, env.phase40BReportGcsUri, phase40BReportPath)
  const phase40BReport = JSON.parse(await readFile(phase40BReportPath, 'utf8')) as {
    ok?: boolean
    qa?: { status?: string; blockers?: string[] }
    tools?: Array<{ toolId?: string; status?: string; version?: string; metrics?: Record<string, unknown> }>
  }
  const phase40BBlockers = validatePhase40BReport(phase40BReport)
  if (phase40BBlockers.length) throw new Error(`Phase 40B evidence is not eligible for Phase 40C:\n- ${phase40BBlockers.join('\n- ')}`)

  const planSnapshot = buildPhase40CPlanSnapshot(env)
  const planArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/plan/approved-plan-snapshot.json`, planSnapshot, 'approved_plan_snapshot')
  const pythonOutput = await runLocalRuntime(workDir, outputPath, {
    REEDITPRO_PHASE40C_LOCAL_INPUT_VIDEO: sourcePath,
    REEDITPRO_PHASE40B_LOCAL_REPORT: phase40BReportPath,
  })
  if (!pythonOutput.source || !pythonOutput.sample) throw new Error('Phase 40C real-video runtime did not return source/sample output.')

  const artifacts: ArtifactRecord[] = [planArtifact]
  const frameUris: string[] = []
  for (const framePath of pythonOutput.sample.framePaths) {
    const artifact = await uploadFile(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/frames/input/${path.basename(framePath)}`, framePath, 'image/png', 'input_frame')
    artifacts.push(artifact)
    frameUris.push(artifact.gcsUri)
  }
  for (const tool of pythonOutput.tools) {
    for (const artifactPath of tool.artifacts) {
      const bucket = artifactPath === pythonOutput.contactSheetPath ? env.previewsBucket : env.generatedAssetsBucket
      const object = artifactPath === pythonOutput.contactSheetPath
        ? `${env.artifactPrefix}/contact-sheet/${path.basename(artifactPath)}`
        : `${env.artifactPrefix}/frames/${tool.toolId}/${path.basename(artifactPath)}`
      artifacts.push(await uploadFile(storage, bucket, object, artifactPath, mimeForPath(artifactPath), `${tool.toolId}_artifact`))
    }
  }
  if (pythonOutput.contactSheetPath && !artifacts.some((artifact) => artifact.kind === 'contact_sheet')) {
    artifacts.push(await uploadFile(storage, env.previewsBucket, `${env.artifactPrefix}/contact-sheet/${path.basename(pythonOutput.contactSheetPath)}`, pythonOutput.contactSheetPath, 'image/png', 'contact_sheet'))
  }

  const sourceArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/source/source-validation.json`, {
    phase: '40C',
    runId: env.runId,
    inputVideoGcsUri: env.inputVideoGcsUri,
    sourceRunId: 'phase32-20260528T13330',
    ...pythonOutput.source,
  }, 'source_validation')
  const sampleArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/sample/sample-manifest.json`, {
    phase: '40C',
    runId: env.runId,
    timestampsSeconds: pythonOutput.sample.timestampsSeconds,
    frameCount: pythonOutput.sample.frameCount,
    width: pythonOutput.sample.width,
    height: pythonOutput.sample.height,
    frameUris,
    fullVideoExtractionAllowed: false,
    full4KProcessingAllowed: false,
  }, 'sample_manifest')
  const metadataArtifact = await uploadJson(storage, env.generatedAssetsBucket, `${env.artifactPrefix}/metadata/pro-color-real-video-runtime-metadata.json`, {
    phase: '40C',
    runId: env.runId,
    runtimeMode: env.mode,
    image: imageInfo(),
    tools: pythonOutput.tools,
    runtimeDiagnostics: pythonOutput.runtimeDiagnostics,
    phase40BReport: {
      gcsUri: env.phase40BReportGcsUri,
      ok: phase40BReport.ok === true,
    },
    safety: phase40CRuntimeSafety(),
  }, 'runtime_metadata')
  const reviewManifestArtifact = await uploadJson(storage, env.previewsBucket, `${env.artifactPrefix}/review/private-review-manifest.json`, {
    phase: '40C',
    runId: env.runId,
    contactSheet: artifacts.find((artifact) => artifact.kind === 'contact_sheet')?.gcsUri,
    publicAccessAllowed: false,
    signedUrlsCreated: false,
    finalDeliveryCreated: false,
  }, 'private_review_manifest')
  artifacts.push(sourceArtifact, sampleArtifact, metadataArtifact, reviewManifestArtifact)

  const qa = buildPhase40CQa(pythonOutput, artifacts, env, phase40BReport)
  const qaArtifact = await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/qa/pro-color-image-real-video-qa.json`, {
    phase: '40C',
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
    phase: '40C',
    runId: env.runId,
    projectId: env.projectId,
    jobName: 'reeditpro-staging-pro-color-image-runtime-job',
    runtimeMode: env.mode,
    compute: cpuCompute(),
    image: imageInfo(),
    runtimeDiagnostics: pythonOutput.runtimeDiagnostics,
    source: {
      inputVideoGcsUri: env.inputVideoGcsUri,
      durationSeconds: pythonOutput.source.durationSeconds,
      videoStreamPresent: pythonOutput.source.videoStreamPresent,
      audioStreamPresent: pythonOutput.source.audioStreamPresent,
      sourceRunId: 'phase32-20260528T13330',
    },
    sample: {
      timestampsSeconds: pythonOutput.sample.timestampsSeconds,
      frameCount: pythonOutput.sample.frameCount,
      width: pythonOutput.sample.width,
      height: pythonOutput.sample.height,
      frameUris,
    },
    planSnapshot: {
      approvedPlanSnapshot: true,
      rawPromptExecution: false,
      gcsUri: planArtifact.gcsUri,
    },
    tools: pythonOutput.tools,
    artifacts,
    qa,
    safety: phase40CRuntimeSafety(),
    phase40DReadiness: {
      readyForProColorImagePrivateFeatureE2EReadinessGate: qa.status === 'passed',
      reason: qa.status === 'passed'
        ? 'Phase 40C bounded real-video pro color/image sample passed; Phase 40D may plan a private feature E2E readiness gate only.'
        : 'Phase 40D remains blocked because Phase 40C QA did not pass.',
    },
    blockers: qa.blockers,
    warnings: [
      ...pythonOutput.warnings,
      'Bounded real-video-derived frames only; no full-video color QA or final delivery.',
      'Subjective visual review is recommended before broader use.',
    ],
  }
  await uploadJson(storage, env.qaBucket, `${env.artifactPrefix}/reports/phase40c-report.json`, report, 'phase40c_report')
  console.log(JSON.stringify({
    ok: report.ok,
    runId: env.runId,
    reportUri: `gs://${env.qaBucket}/${env.artifactPrefix}/reports/phase40c-report.json`,
    blockers: qa.blockers,
  }, null, 2))
}

async function runLocalRuntime(workDir: string, outputPath: string, extraEnv: Record<string, string> = {}): Promise<PythonOutput> {
  const { stdout, stderr } = await execFileAsync('python3', ['/app/pro_color_image_runtime_local.py', '--work-dir', workDir, '--output', outputPath], {
    timeout: 15 * 60 * 1000,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      ...extraEnv,
      PYTHONUNBUFFERED: '1',
      REEDITPRO_NETWORK_DISABLED: 'true',
    },
  })
  if (stderr.trim()) console.error(stderr)
  if (stdout.trim()) console.log(stdout)
  return JSON.parse(await readFile(outputPath, 'utf8')) as PythonOutput
}

function buildPhase40BQa(output: PythonOutput, artifacts: ArtifactRecord[], env: Phase40BRuntimeEnv) {
  if (!output.fixture) throw new Error('Phase 40B QA requires fixture output.')
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
  return qaFromGates(blockers, gates, [
    ...output.warnings,
    'Visual quality is deterministic fixture QA only; no controlled real-video sample has been run.',
  ])
}

function buildPhase40CQa(output: PythonOutput, artifacts: ArtifactRecord[], env: Phase40CRuntimeEnv, phase40BReport: { ok?: boolean; qa?: { status?: string } }) {
  if (!output.source || !output.sample) throw new Error('Phase 40C QA requires source and sample output.')
  const toolById = new Map(output.tools.map((tool) => [tool.toolId, tool]))
  const blockers = output.tools.flatMap((tool) => tool.blockers)
  if (env.inputVideoGcsUri !== 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4') blockers.push('Unexpected input video URI.')
  if (output.sample.frameCount > env.maxFrameCount) blockers.push(`Frame count exceeds cap: ${output.sample.frameCount} > ${env.maxFrameCount}.`)
  if (output.sample.width > env.frameWidth || output.sample.height > env.frameHeight) blockers.push(`Sample dimensions exceed cap: ${output.sample.width}x${output.sample.height}.`)
  if (!artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/')
    || artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40c/')
    || artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/'))) {
    blockers.push('One or more artifacts were uploaded outside approved private Phase 40C prefixes.')
  }
  const gates = [
    gate('source_integrity', output.source.videoStreamPresent && output.source.audioStreamPresent && env.inputVideoGcsUri.includes('phase32-20260528T13330'), 'Approved Phase 32 source validated with video and audio streams present.'),
    gate('phase40b_evidence', phase40BReport.ok === true && phase40BReport.qa?.status === 'passed', 'Phase 40B QA report exists and passed.'),
    gate('plan_snapshot_integrity', artifacts.some((artifact) => artifact.kind === 'approved_plan_snapshot'), 'Approved plan snapshot exists and raw prompt execution is false.'),
    gate('sample_bounds', output.sample.frameCount <= env.maxFrameCount && output.sample.width <= env.frameWidth && output.sample.height <= env.frameHeight, 'Frame count and dimensions stayed within Phase 40C bounds.'),
    gate('openimageio_real_frame', toolById.get('openimageio')?.status === 'passed', toolById.get('openimageio')?.blockers.join('; ') || 'OpenImageIO real-frame read/write passed.'),
    gate('opencolorio_real_frame', toolById.get('opencolorio')?.status === 'passed', toolById.get('opencolorio')?.blockers.join('; ') || 'OpenColorIO real-frame raw transform passed.'),
    gate('kornia_real_frame', toolById.get('kornia')?.status === 'passed', toolById.get('kornia')?.blockers.join('; ') || 'Kornia real-frame CPU metrics passed.'),
    gate('artifact_privacy', blockers.every((blocker) => !blocker.includes('outside approved private')), 'Artifacts use private staging GCS prefixes only.'),
    gate('blocked_features', blockedFeaturesStillBlocked(env), 'Full-video processing, final delivery, providers, Revideo, production, beta, and broad media stayed blocked.'),
  ]
  return qaFromGates(blockers, gates, [
    ...output.warnings,
    'Bounded sample only; no full-video color QA.',
    'Subjective visual review is recommended before broader use.',
  ])
}

function qaFromGates(blockers: string[], gates: ReturnType<typeof gate>[], warnings: string[]) {
  const gateBlockers = gates.filter((gateItem) => !gateItem.passed).map((gateItem) => `${gateItem.gateId}: ${gateItem.summary}`)
  return {
    status: blockers.length === 0 && gateBlockers.length === 0 ? 'passed' as const : 'blocked' as const,
    gates,
    blockers: [...blockers, ...gateBlockers],
    warnings,
  }
}

function gate(gateId: string, passed: boolean, summary: string) {
  return { gateId, passed, severity: 'mandatory' as const, summary }
}

function validatePhase40BReport(report: { ok?: boolean; qa?: { status?: string; blockers?: string[] }; tools?: Array<{ toolId?: string; status?: string; version?: string; metrics?: Record<string, unknown> }> }): string[] {
  const blockers: string[] = []
  if (report.ok !== true) blockers.push('Phase 40B report does not have ok=true.')
  if (report.qa?.status !== 'passed') blockers.push('Phase 40B QA status is not passed.')
  for (const toolId of ['opencolorio', 'openimageio', 'kornia']) {
    const tool = report.tools?.find((candidate) => candidate.toolId === toolId)
    if (!tool || tool.status !== 'passed') blockers.push(`Phase 40B ${toolId} result is not passed.`)
  }
  return blockers
}

function buildPhase40CPlanSnapshot(env: Phase40CRuntimeEnv) {
  return {
    planId: 'phase40c-real-video-pro-color-image-sample-plan-v1',
    phase: '40C',
    phase40CRunId: env.runId,
    approvedInputVideo: env.inputVideoGcsUri,
    sourcePhase: 32,
    phase40BRunId: 'phase40b-20260531T10390',
    feature: 'real_video_pro_color_image_sample',
    tools: ['FFprobe', 'FFmpeg', 'OpenColorIO', 'OpenImageIO', 'Kornia'],
    samplePlan: {
      timestampsSeconds: env.timestampsSeconds,
      frameCount: env.timestampsSeconds.length,
      frameWidth: env.frameWidth,
      frameHeight: env.frameHeight,
      reason: 'Bounded beginning, anchor/midpoint, and late-frame sample from the approved Phase 32 private export.',
    },
    processingPlan: [
      'ffprobe validation',
      'ffmpeg frame extraction and downscale',
      'OpenImageIO read/write/metadata validation',
      'OpenColorIO raw identity transform validation',
      'Kornia CPU tensor metrics and grayscale output',
    ],
    outputPrefixes: {
      generatedAssets: `gs://${env.generatedAssetsBucket}/${env.artifactPrefix}/`,
      previews: `gs://${env.previewsBucket}/${env.artifactPrefix}/`,
      qa: `gs://${env.qaBucket}/${env.artifactPrefix}/`,
      workerTemp: `gs://${env.workerTempBucket}/${env.artifactPrefix}/`,
    },
    approval: {
      approvedPlanSnapshot: true,
      rawPromptExecution: false,
    },
    safety: phase40CRuntimeSafety(),
  }
}

function blockedFeaturesStillBlocked(env: RuntimeEnv): boolean {
  if (env.mode === 'generated_fixture_color_image') {
    return (process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') === 'false'
      && (process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') === 'false'
      && (process.env.REVIDEO_ENABLED ?? 'false') === 'false'
      && (process.env.REEDITPRO_PRODUCTION_READY ?? 'false') === 'false'
      && (process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') === 'false'
      && (process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') === 'false'
  }
  return (process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') === 'false'
    && (process.env.REVIDEO_ENABLED ?? 'false') === 'false'
    && (process.env.PUBLIC_ACCESS_ENABLED ?? 'false') === 'false'
    && (process.env.FULL_VIDEO_PROCESSING_ENABLED ?? 'false') === 'false'
    && (process.env.FINAL_DELIVERY_ENABLED ?? 'false') === 'false'
    && (process.env.REEDITPRO_PRODUCTION_READY ?? 'false') === 'false'
    && (process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') === 'false'
    && (process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') === 'false'
}

function cpuCompute() {
  return {
    mode: 'cpu' as const,
    cpu: 4,
    memory: '8Gi',
    gpuRequested: false as const,
  }
}

function imageInfo() {
  return {
    image: process.env.REEDITPRO_IMAGE_REF,
    digest: process.env.REEDITPRO_IMAGE_DIGEST,
  }
}

function phase40BRuntimeSafety() {
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

function phase40CRuntimeSafety() {
  return {
    approvedSourceOnly: true,
    arbitraryMediaUsed: false as const,
    fullVideoProcessed: false as const,
    full4KFramesProcessed: false as const,
    finalDeliveryCreated: false as const,
    providerExecuted: false as const,
    revideoUsed: false as const,
    publicAccessEnabled: false as const,
    productionReadyAllowed: false as const,
    externalBetaAllowed: false as const,
    paidProductionAllowed: false as const,
    broadRealUserMediaAllowed: false as const,
  }
}

function readRuntimeEnv(): RuntimeEnv {
  const mode = mustOneOf('REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE', ['generated_fixture_color_image', 'real_video_sample'] as const)
  if (mode === 'generated_fixture_color_image') return readPhase40BEnv()
  return readPhase40CEnv()
}

function readPhase40BEnv(): Phase40BRuntimeEnv {
  const env: Phase40BRuntimeEnv = {
    projectId: mustEqual('GCP_PROJECT_ID', 'reeditpro'),
    runId: mustMatch('REEDITPRO_PHASE40B_RUN_ID', /^phase40b-[0-9A-Za-z]+$/),
    mode: 'generated_fixture_color_image',
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

function readPhase40CEnv(): Phase40CRuntimeEnv {
  const env: Phase40CRuntimeEnv = {
    projectId: mustEqual('GCP_PROJECT_ID', 'reeditpro'),
    runId: mustMatch('REEDITPRO_PHASE40C_RUN_ID', /^phase40c-[0-9A-Za-z]+$/),
    mode: 'real_video_sample',
    generatedAssetsBucket: mustEqual('REEDITPRO_PHASE40C_GENERATED_ASSETS_BUCKET', 'reeditpro-staging-reeditpro-generated-assets'),
    previewsBucket: mustEqual('REEDITPRO_PHASE40C_PREVIEWS_BUCKET', 'reeditpro-staging-reeditpro-previews'),
    qaBucket: mustEqual('REEDITPRO_PHASE40C_QA_BUCKET', 'reeditpro-staging-reeditpro-qa-artifacts'),
    workerTempBucket: mustEqual('REEDITPRO_PHASE40C_WORKER_TEMP_BUCKET', 'reeditpro-staging-reeditpro-worker-temp'),
    artifactPrefix: mustMatch('REEDITPRO_PHASE40C_ARTIFACT_PREFIX', /^activation-pro-color-image\/phase40c\/phase40c-[0-9A-Za-z]+$/),
    inputVideoGcsUri: mustEqual('REEDITPRO_PHASE40C_INPUT_VIDEO_GCS_URI', 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'),
    phase40BReportGcsUri: mustEqual('REEDITPRO_PHASE40B_REPORT_GCS_URI', 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json'),
    timestampsSeconds: mustNumberList('REEDITPRO_PHASE40C_TIMESTAMPS_SECONDS', [0.5, 7.7335, 14.5]),
    frameWidth: mustNumber('REEDITPRO_PHASE40C_FRAME_WIDTH', 768),
    frameHeight: mustNumber('REEDITPRO_PHASE40C_FRAME_HEIGHT', 432),
    maxFrameCount: mustNumber('REEDITPRO_PHASE40C_MAX_FRAME_COUNT', 5),
  }
  mustEqual('GCP_REGION', 'us-central1')
  mustEqual('REEDITPRO_ENV', 'staging')
  mustEqual('REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE', 'true')
  mustEqual('PROVIDER_EXECUTION_ENABLED', 'false')
  mustEqual('REVIDEO_ENABLED', 'false')
  mustEqual('PUBLIC_ACCESS_ENABLED', 'false')
  mustEqual('FULL_VIDEO_PROCESSING_ENABLED', 'false')
  mustEqual('FINAL_DELIVERY_ENABLED', 'false')
  mustEqual('REEDITPRO_PRODUCTION_READY', 'false')
  mustEqual('REEDITPRO_EXTERNAL_BETA_READY', 'false')
  mustEqual('REEDITPRO_BROAD_REAL_MEDIA_READY', 'false')
  if (!env.artifactPrefix.endsWith(env.runId)) throw new Error('Phase 40C artifact prefix must end with the run ID.')
  if (env.timestampsSeconds.length > env.maxFrameCount) throw new Error('Phase 40C timestamp count must not exceed max frame count.')
  return env
}

function mustEqual<T extends string>(name: string, expected: T): T {
  const actual = process.env[name]
  if (actual !== expected) throw new Error(`${name} must be exactly ${expected}.`)
  return expected
}

function mustOneOf<T extends readonly string[]>(name: string, expected: T): T[number] {
  const actual = process.env[name]
  if (!actual || !expected.includes(actual)) throw new Error(`${name} must be one of ${expected.join(', ')}.`)
  return actual as T[number]
}

function mustMatch(name: string, pattern: RegExp): string {
  const actual = process.env[name]
  if (!actual || !pattern.test(actual)) throw new Error(`${name} is missing or unsafe.`)
  return actual
}

function mustNumber(name: string, expected: number): number {
  const actual = Number(process.env[name])
  if (!Number.isFinite(actual) || actual !== expected) throw new Error(`${name} must be exactly ${expected}.`)
  return actual
}

function mustNumberList(name: string, expected: number[]): number[] {
  const raw = process.env[name]
  const actual = raw?.split(/[;,]/).map((value) => Number(value.trim())) ?? []
  if (actual.length !== expected.length || actual.some((value, index) => !Number.isFinite(value) || Math.abs(value - expected[index]) > 0.0001)) {
    throw new Error(`${name} must be exactly ${expected.join(',')}.`)
  }
  return actual
}

async function downloadGcsUri(storage: Storage, gcsUri: string, destination: string): Promise<void> {
  const parsed = parseGcsUri(gcsUri)
  await storage.bucket(parsed.bucket).file(parsed.object).download({ destination })
}

function parseGcsUri(gcsUri: string): { bucket: string; object: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], object: match[2] }
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
  if (filePath.endsWith('.mp4')) return 'video/mp4'
  return 'application/octet-stream'
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
