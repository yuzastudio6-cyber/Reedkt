import { Storage } from '@google-cloud/storage'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const PROJECT_ID = 'reeditpro'
const ENVIRONMENT = 'staging'
const RUNTIME_MODE = 'generated_audio'
const TOOL_ID = 'deepfilternet'
const TOOL_VERSION = 'v0.5.6'
const ARTIFACT_GCS_PATH = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
const CLI_FILE_NAME = 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
const MODEL_ARCHIVE_FILE_NAME = 'DeepFilterNet3_onnx.tar.gz'
const CHECKSUM_FILE_NAME = 'file_checksums_sha256.txt'
const MANIFEST_FILE_NAME = 'model_tree_manifest.json'
const CLI_SHA256 = '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
const MODEL_ARCHIVE_SHA256 = 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
const AGGREGATE_SHA256 = 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'
const GENERATED_ASSETS_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
const ANALYSIS_BUCKET = 'reeditpro-staging-reeditpro-analysis-artifacts'
const QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
const REPORT_PREFIX = 'activation-audio-ai/phase36c'
const SAMPLE_RATE = 48000
const CHANNELS = 1
const DURATION_SECONDS = 10

type QaStatus = 'passed' | 'warning' | 'blocked'

interface ArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

interface AudioMetrics {
  sampleRate: number
  channels: number
  durationSeconds: number
  sampleCount: number
  peakAbs: number
  rms: number
  clippingSampleCount: number
  peakDbfs: number
  rmsDbfs: number
}

interface QaGate {
  gateId:
    | 'model_artifacts'
    | 'runtime_integrity'
    | 'fixture_integrity'
    | 'enhanced_audio_artifacts'
    | 'audio_safety_metrics'
    | 'artifact_privacy'
    | 'blocked_features'
  status: QaStatus
  summary: string
}

interface ChecksumVerification {
  cliSha256: string
  modelArchiveSha256: string
  aggregateSha256: string
  manifestAggregateSha256?: string
  copiedFiles: string[]
  checksumsMatch: boolean
  noExternalArtifactDownload: true
  noAlternateModel: true
}

interface RuntimeEnv {
  runId: string
  projectId: string
  jobName: string
  imageRef?: string
  imageDigest?: string
  artifactRuntimePath: string
}

async function main(): Promise<void> {
  const env = readRuntimeEnv()
  const storage = new Storage({ projectId: env.projectId })
  const artifactPrefix = `${REPORT_PREFIX}/${env.runId}`
  const workDir = path.join(os.tmpdir(), `reeditpro-deepfilternet-runtime-${env.runId}`)
  const artifactRuntimePath = env.artifactRuntimePath
  const fixtureDir = path.join(workDir, 'fixture')
  const enhancedDir = path.join(workDir, 'enhanced')
  const metadataDir = path.join(workDir, 'metadata')
  const analysisDir = path.join(workDir, 'analysis')
  const cleanReferencePath = path.join(fixtureDir, 'generated-clean-reference.wav')
  const noisyInputPath = path.join(fixtureDir, 'generated-noisy-input.wav')
  const fixtureManifestPath = path.join(fixtureDir, 'audio-fixture-manifest.json')
    const renamedEnhancedPath = path.join(enhancedDir, 'deepfilternet-enhanced.wav')
  const checksumVerificationPath = path.join(metadataDir, 'model-checksum-verification.json')
  const runtimeMetadataPath = path.join(metadataDir, 'deepfilternet-runtime-metadata.json')
  const inputMetricsPath = path.join(analysisDir, 'input-metrics.json')
  const outputMetricsPath = path.join(analysisDir, 'output-metrics.json')
  const comparisonMetricsPath = path.join(analysisDir, 'comparison-metrics.json')
  const qaPath = path.join(workDir, 'deepfilternet-runtime-qa.json')
  const reportPath = path.join(workDir, 'phase36c-report.json')

  await resetWorkDirs(workDir, artifactRuntimePath)
  try {
    const checksumVerification = await syncAndVerifyArtifacts(storage, artifactRuntimePath)
    await mkdir(fixtureDir, { recursive: true })
    await mkdir(enhancedDir, { recursive: true })
    await mkdir(metadataDir, { recursive: true })
    await mkdir(analysisDir, { recursive: true })

    const fixtureManifest = await generateFixtureAudio({
      cleanReferencePath,
      noisyInputPath,
      manifestPath: fixtureManifestPath,
      runId: env.runId,
    })

    const cliPath = path.join(artifactRuntimePath, CLI_FILE_NAME)
    const modelArchivePath = path.join(artifactRuntimePath, MODEL_ARCHIVE_FILE_NAME)
    const runtimeStartedAt = new Date().toISOString()
    const runtimeResult = await runDeepFilterNet(cliPath, modelArchivePath, enhancedDir, noisyInputPath)
    if (runtimeResult.exitCode === 0) {
      const producedOutputPath = await findProducedEnhancedWav(enhancedDir)
      if (producedOutputPath !== renamedEnhancedPath) await rename(producedOutputPath, renamedEnhancedPath)
    }

    const inputMetrics = await readAudioMetrics(noisyInputPath)
    const outputMetrics = runtimeResult.exitCode === 0 ? await readAudioMetrics(renamedEnhancedPath) : undefined
    const comparisonMetrics = outputMetrics ? compareAudioMetrics(inputMetrics, outputMetrics) : undefined
    const artifacts: ArtifactRecord[] = []

    await writeJson(checksumVerificationPath, checksumVerification)
    await writeJson(inputMetricsPath, inputMetrics)
    if (outputMetrics) await writeJson(outputMetricsPath, outputMetrics)
    if (comparisonMetrics) await writeJson(comparisonMetricsPath, comparisonMetrics)

    const runtimeMetadata = {
      phase: '36C',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      imageRef: env.imageRef,
      imageDigest: env.imageDigest,
      runtimeMode: RUNTIME_MODE,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      runtimeStartedAt,
      runtimeCompletedAt: new Date().toISOString(),
      cliCommand: 'deep-filter --model <local DeepFilterNet3_onnx.tar.gz> --out-dir <enhanced-dir> <generated-noisy-input.wav>',
      cpuOnly: true,
      generatedAudioOnly: true,
      realMediaUsed: false,
      providerExecuted: false,
      rnnoiseUsed: false,
      demucsUsed: false,
    }
    await writeJson(runtimeMetadataPath, runtimeMetadata)

    artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/fixture/generated-clean-reference.wav`, cleanReferencePath, 'audio/wav'))
    artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/fixture/generated-noisy-input.wav`, noisyInputPath, 'audio/wav'))
    artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/fixture/audio-fixture-manifest.json`, fixtureManifestPath, 'application/json'))
    if (runtimeResult.exitCode === 0) {
      artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/enhanced/deepfilternet-enhanced.wav`, renamedEnhancedPath, 'audio/wav'))
    }
    artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/metadata/model-checksum-verification.json`, checksumVerificationPath, 'application/json'))
    artifacts.push(await uploadFile(storage, GENERATED_ASSETS_BUCKET, `${artifactPrefix}/metadata/deepfilternet-runtime-metadata.json`, runtimeMetadataPath, 'application/json'))
    artifacts.push(await uploadFile(storage, ANALYSIS_BUCKET, `${artifactPrefix}/audio-metrics/input-metrics.json`, inputMetricsPath, 'application/json'))
    if (outputMetrics) artifacts.push(await uploadFile(storage, ANALYSIS_BUCKET, `${artifactPrefix}/audio-metrics/output-metrics.json`, outputMetricsPath, 'application/json'))
    if (comparisonMetrics) artifacts.push(await uploadFile(storage, ANALYSIS_BUCKET, `${artifactPrefix}/audio-metrics/comparison-metrics.json`, comparisonMetricsPath, 'application/json'))

    const qa = buildQa({
      checksumVerification,
      runtimeResult,
      fixtureManifest,
      inputMetrics,
      outputMetrics,
      comparisonMetrics,
      artifacts,
    })
    await writeJson(qaPath, {
      phase: '36C',
      runId: env.runId,
      ...qa,
      realVideoInputAllowed: false,
      realMediaAudioAiAllowed: false,
      rnnoiseAllowed: false,
      demucsAllowed: false,
      providerAllowed: false,
      revideoAllowed: false,
      filmAllowed: false,
      slowMotionAllowed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
    })
    artifacts.push(await uploadFile(storage, QA_BUCKET, `${artifactPrefix}/qa/deepfilternet-runtime-qa.json`, qaPath, 'application/json'))

    const report = {
      ok: runtimeResult.exitCode === 0 && qa.status !== 'blocked',
      runId: env.runId,
      projectId: env.projectId,
      jobName: env.jobName,
      executionId: process.env.CLOUD_RUN_EXECUTION,
      image: {
        image: env.imageRef ?? process.env.K_SERVICE,
        digest: env.imageDigest,
      },
      runtime: {
        mode: RUNTIME_MODE,
        cpuOnly: true,
        cliExecutable: true,
        exitCode: runtimeResult.exitCode,
        stderrPreview: runtimeResult.stderr.slice(0, 2000),
      },
      model: {
        toolId: TOOL_ID,
        toolVersion: TOOL_VERSION,
        artifactGcsPath: ARTIFACT_GCS_PATH,
        runtimePath: artifactRuntimePath,
        cliFileName: CLI_FILE_NAME,
        modelArchiveFileName: MODEL_ARCHIVE_FILE_NAME,
        cliSha256: checksumVerification.cliSha256,
        modelArchiveSha256: checksumVerification.modelArchiveSha256,
        aggregateSha256: checksumVerification.aggregateSha256,
        copiedFiles: checksumVerification.copiedFiles,
      },
      fixture: {
        generated: true,
        generatedAudioOnly: true,
        sampleRate: SAMPLE_RATE,
        channels: CHANNELS,
        durationSeconds: DURATION_SECONDS,
        cleanReferenceUri: `gs://${GENERATED_ASSETS_BUCKET}/${artifactPrefix}/fixture/generated-clean-reference.wav`,
        noisyInputUri: `gs://${GENERATED_ASSETS_BUCKET}/${artifactPrefix}/fixture/generated-noisy-input.wav`,
        manifestUri: `gs://${GENERATED_ASSETS_BUCKET}/${artifactPrefix}/fixture/audio-fixture-manifest.json`,
      },
      enhancedAudio: {
        status: runtimeResult.exitCode === 0 ? 'completed' : 'failed',
        enhancedAudioUri: runtimeResult.exitCode === 0
          ? `gs://${GENERATED_ASSETS_BUCKET}/${artifactPrefix}/enhanced/deepfilternet-enhanced.wav`
          : undefined,
        inputMetrics,
        outputMetrics,
        comparisonMetrics,
      },
      qa,
      artifacts,
      safety: {
        generatedAudioOnly: true,
        providerExecuted: false,
        modelDownloadedExternally: false,
        realMediaUsed: false,
        realVideoInputUsed: false,
        realAudioInputUsed: false,
        rnnoiseUsed: false,
        demucsUsed: false,
        filmUsed: false,
        slowMotionExecuted: false,
        revideoUsed: false,
        publicAccessEnabled: false,
        secretValuesUsed: false,
        productionReadyAllowed: false,
        externalBetaAllowed: false,
        broadRealUserMediaAllowed: false,
      },
      uploadedReport: {
        bucket: QA_BUCKET,
        object: `${artifactPrefix}/reports/phase36c-report.json`,
        gcsUri: `gs://${QA_BUCKET}/${artifactPrefix}/reports/phase36c-report.json`,
      },
      warnings: [
        'Phase 36C uses generated synthetic audio only; no real-video audio cleanup is approved until Phase 36D.',
        'Metrics are deterministic runtime sanity checks, not subjective audio quality approval.',
      ],
    }

    await writeJson(reportPath, report)
    artifacts.push(await uploadFile(storage, QA_BUCKET, `${artifactPrefix}/reports/phase36c-report.json`, reportPath, 'application/json'))
    console.log(JSON.stringify(report))
  } finally {
    await resetWorkDirs(workDir, artifactRuntimePath)
  }
}

function readRuntimeEnv(): RuntimeEnv {
  requireEnvValue('REEDITPRO_ENV', ENVIRONMENT)
  requireEnvValue('REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME', 'true')
  requireEnvValue('REEDITPRO_DEEPFILTERNET_RUNTIME_MODE', RUNTIME_MODE)
  requireEnvValue('REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH', ARTIFACT_GCS_PATH)
  requireEnvValue('REEDITPRO_DEEPFILTERNET_CLI_SHA256', CLI_SHA256)
  requireEnvValue('REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256', MODEL_ARCHIVE_SHA256)
  requireEnvValue('REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256', AGGREGATE_SHA256)
  requireEnvValue('GENERATED_AUDIO_ONLY', 'true')
  requireEnvValue('PROVIDER_EXECUTION_ENABLED', 'false')
  requireEnvValue('REAL_MEDIA_INPUT_ENABLED', 'false')
  requireEnvValue('RNNOISE_ENABLED', 'false')
  requireEnvValue('DEMUCS_ENABLED', 'false')
  requireEnvValue('REEDITPRO_PRODUCTION_READY', 'false')
  requireOptionalFalse('REEDITPRO_EXTERNAL_BETA_READY')
  requireOptionalFalse('REEDITPRO_BROAD_REAL_MEDIA_READY')
  requireOptionalFalse('MODEL_DOWNLOADS_ENABLED')
  const projectId = process.env.GCP_PROJECT_ID ?? PROJECT_ID
  if (projectId !== PROJECT_ID) throw new Error('GCP_PROJECT_ID must be exactly reeditpro.')
  const runId = process.env.REEDITPRO_PHASE36C_RUN_ID ?? `phase36c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  if (!/^phase36c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 36C run id: ${runId}`)
  return {
    runId,
    projectId,
    jobName: process.env.CLOUD_RUN_JOB ?? 'reeditpro-staging-deepfilternet-runtime-job',
    imageRef: process.env.REEDITPRO_IMAGE_REF,
    imageDigest: process.env.REEDITPRO_IMAGE_DIGEST,
    artifactRuntimePath: process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH ?? '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6',
  }
}

function requireEnvValue(name: string, expected: string): void {
  const actual = process.env[name]
  if (actual !== expected) throw new Error(`${name} must be exactly ${expected}.`)
}

function requireOptionalFalse(name: string): void {
  const actual = process.env[name]
  if (actual !== undefined && actual !== 'false') throw new Error(`${name} must remain false when set.`)
}

async function syncAndVerifyArtifacts(storage: Storage, runtimePath: string): Promise<ChecksumVerification> {
  await mkdir(runtimePath, { recursive: true })
  const copiedFiles: string[] = []
  for (const fileName of [CLI_FILE_NAME, MODEL_ARCHIVE_FILE_NAME, CHECKSUM_FILE_NAME, MANIFEST_FILE_NAME]) {
    const destination = path.join(runtimePath, fileName)
    await downloadGcsObject(storage, `${ARTIFACT_GCS_PATH}${fileName}`, destination)
    copiedFiles.push(fileName)
  }
  const cliPath = path.join(runtimePath, CLI_FILE_NAME)
  const modelArchivePath = path.join(runtimePath, MODEL_ARCHIVE_FILE_NAME)
  const cliSha256 = await sha256File(cliPath)
  const modelArchiveSha256 = await sha256File(modelArchivePath)
  const aggregateSha256 = buildAggregateChecksum([
    { relativePath: CLI_FILE_NAME, sha256: cliSha256 },
    { relativePath: MODEL_ARCHIVE_FILE_NAME, sha256: modelArchiveSha256 },
  ])
  const manifest = JSON.parse(await readFile(path.join(runtimePath, MANIFEST_FILE_NAME), 'utf8')) as {
    aggregateSha256?: string
    fileSha256?: Record<string, string>
  }
  const checksumsMatch =
    cliSha256 === CLI_SHA256 &&
    modelArchiveSha256 === MODEL_ARCHIVE_SHA256 &&
    aggregateSha256 === AGGREGATE_SHA256 &&
    manifest.aggregateSha256 === AGGREGATE_SHA256 &&
    manifest.fileSha256?.[CLI_FILE_NAME] === CLI_SHA256 &&
    manifest.fileSha256?.[MODEL_ARCHIVE_FILE_NAME] === MODEL_ARCHIVE_SHA256
  if (!checksumsMatch) {
    throw new Error(`DeepFilterNet artifact checksum verification failed: ${JSON.stringify({
      cliSha256,
      modelArchiveSha256,
      aggregateSha256,
      manifestAggregateSha256: manifest.aggregateSha256,
    })}`)
  }
  await chmod(cliPath, 0o755)
  return {
    cliSha256,
    modelArchiveSha256,
    aggregateSha256,
    manifestAggregateSha256: manifest.aggregateSha256,
    copiedFiles,
    checksumsMatch,
    noExternalArtifactDownload: true,
    noAlternateModel: true,
  }
}

async function generateFixtureAudio(input: {
  cleanReferencePath: string
  noisyInputPath: string
  manifestPath: string
  runId: string
}) {
  const sampleCount = SAMPLE_RATE * DURATION_SECONDS
  const clean = new Float32Array(sampleCount)
  const noisy = new Float32Array(sampleCount)
  let seed = 36_360
  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / SAMPLE_RATE
    const envelope = Math.min(1, t / 0.25, (DURATION_SECONDS - t) / 0.35)
    const phrase = Math.sin(2 * Math.PI * 185 * t) * 0.2 +
      Math.sin(2 * Math.PI * 370 * t) * 0.08 +
      Math.sin(2 * Math.PI * (245 + 18 * Math.sin(2 * Math.PI * 0.35 * t)) * t) * 0.07
    const pauseGate = Math.sin(2 * Math.PI * 0.8 * t) > -0.65 ? 1 : 0.35
    seed = (1664525 * seed + 1013904223) >>> 0
    const random = (seed / 0xffffffff) * 2 - 1
    const hum = Math.sin(2 * Math.PI * 60 * t) * 0.035
    const broadbandNoise = random * 0.055
    clean[index] = clamp(phrase * envelope * pauseGate, -0.95, 0.95)
    noisy[index] = clamp(clean[index] + hum + broadbandNoise, -0.95, 0.95)
  }
  await writePcm16Wav(input.cleanReferencePath, clean, SAMPLE_RATE, CHANNELS)
  await writePcm16Wav(input.noisyInputPath, noisy, SAMPLE_RATE, CHANNELS)
  const manifest = {
    phase: '36C',
    runId: input.runId,
    generatedAudioOnly: true,
    sampleRate: SAMPLE_RATE,
    channels: CHANNELS,
    durationSeconds: DURATION_SECONDS,
    format: 'wav',
    cleanReferenceGenerated: true,
    noiseProfile: 'deterministic low-amplitude broadband noise plus 60Hz hum over synthetic speech-like tones',
    realMediaUsed: false,
    providerExecuted: false,
  }
  await writeJson(input.manifestPath, manifest)
  return manifest
}

async function runDeepFilterNet(cliPath: string, modelArchivePath: string, outputDir: string, noisyInputPath: string): Promise<{
  exitCode: number
  stdout: string
  stderr: string
}> {
  try {
    const { stdout, stderr } = await execFileAsync(cliPath, ['--model', modelArchivePath, '--out-dir', outputDir, noisyInputPath], {
      timeout: 4 * 60 * 1000,
      maxBuffer: 8 * 1024 * 1024,
      env: {
        ...process.env,
        PROVIDER_EXECUTION_ENABLED: 'false',
        MODEL_DOWNLOADS_ENABLED: 'false',
        REAL_MEDIA_INPUT_ENABLED: 'false',
        RNNOISE_ENABLED: 'false',
        DEMUCS_ENABLED: 'false',
      },
    })
    return { exitCode: 0, stdout, stderr }
  } catch (error) {
    const childError = error as { code?: number; stdout?: string; stderr?: string; message?: string }
    return {
      exitCode: typeof childError.code === 'number' ? childError.code : 1,
      stdout: childError.stdout ?? '',
      stderr: childError.stderr ?? childError.message ?? 'DeepFilterNet execution failed.',
    }
  }
}

async function findProducedEnhancedWav(enhancedDir: string): Promise<string> {
  const entries = await readdir(enhancedDir)
  const wavFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.wav'))
  if (wavFiles.length !== 1) throw new Error(`Expected exactly one enhanced WAV from DeepFilterNet, found ${wavFiles.length}: ${wavFiles.join(', ')}`)
  return path.join(enhancedDir, wavFiles[0])
}

function buildQa(input: {
  checksumVerification: ChecksumVerification
  runtimeResult: { exitCode: number; stderr: string }
  fixtureManifest: { generatedAudioOnly: boolean; sampleRate: number; durationSeconds: number }
  inputMetrics: AudioMetrics
  outputMetrics?: AudioMetrics
  comparisonMetrics?: Record<string, number | string | boolean>
  artifacts: ArtifactRecord[]
}) {
  const gates: QaGate[] = [
    {
      gateId: 'model_artifacts',
      status: input.checksumVerification.checksumsMatch ? 'passed' : 'blocked',
      summary: 'Approved Phase 36B CLI and ONNX archive were copied from private GCS and SHA-256 verified.',
    },
    {
      gateId: 'runtime_integrity',
      status: input.runtimeResult.exitCode === 0 ? 'passed' : 'blocked',
      summary: input.runtimeResult.exitCode === 0
        ? 'Approved DeepFilterNet CLI completed successfully in CPU-only Cloud Run job.'
        : `DeepFilterNet CLI failed with exit code ${input.runtimeResult.exitCode}.`,
    },
    {
      gateId: 'fixture_integrity',
      status: input.fixtureManifest.generatedAudioOnly && input.fixtureManifest.sampleRate === SAMPLE_RATE && input.fixtureManifest.durationSeconds === DURATION_SECONDS ? 'passed' : 'blocked',
      summary: 'Generated 48 kHz mono synthetic clean/noisy WAV fixture; no real media input used.',
    },
    {
      gateId: 'enhanced_audio_artifacts',
      status: input.outputMetrics ? 'passed' : 'blocked',
      summary: input.outputMetrics
        ? 'Enhanced WAV artifact exists and decoded for metrics.'
        : 'Enhanced WAV artifact is missing or could not be decoded.',
    },
    {
      gateId: 'audio_safety_metrics',
      status: input.outputMetrics && input.outputMetrics.clippingSampleCount === 0 ? 'passed' : input.outputMetrics ? 'warning' : 'blocked',
      summary: input.outputMetrics
        ? 'RMS, peak dBFS, duration, and clipping metrics were recorded for input and enhanced output.'
        : 'Output audio metrics were unavailable.',
    },
    {
      gateId: 'artifact_privacy',
      status: input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-')) ? 'passed' : 'blocked',
      summary: 'Artifacts were written only to private staging GCS buckets; no public URLs or signed URLs are produced.',
    },
    {
      gateId: 'blocked_features',
      status: 'passed',
      summary: 'Real media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, production, beta, and broad-media paths remain blocked.',
    },
  ]
  const blockers = gates.filter((gate) => gate.status === 'blocked').map((gate) => `${gate.gateId}: ${gate.summary}`)
  const warnings = [
    ...gates.filter((gate) => gate.status === 'warning').map((gate) => `${gate.gateId}: ${gate.summary}`),
    'Generated fixture verification does not prove real-video audio cleanup quality.',
  ]
  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

async function downloadGcsObject(storage: Storage, gcsUri: string, destination: string): Promise<void> {
  const { bucket, object } = parseGcsUri(gcsUri)
  await mkdir(path.dirname(destination), { recursive: true })
  await storage.bucket(bucket).file(object).download({ destination })
}

async function uploadFile(storage: Storage, bucket: string, object: string, localPath: string, contentType: string): Promise<ArtifactRecord> {
  await storage.bucket(bucket).upload(localPath, {
    destination: object,
    contentType,
    resumable: false,
    metadata: {
      metadata: {
        phase: '36C',
        publicAccess: 'false',
      },
    },
  })
  const [metadata] = await storage.bucket(bucket).file(object).getMetadata()
  return {
    id: path.basename(object).replace(/[^A-Za-z0-9_-]/g, '-'),
    kind: contentType,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: Number(metadata.size ?? 0),
    sha256: contentType === 'audio/wav' || contentType === 'application/json' ? await sha256File(localPath) : undefined,
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function writePcm16Wav(filePath: string, samples: Float32Array, sampleRate: number, channels: number): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
  buffer.writeUInt16LE(channels * bytesPerSample, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[index], -1, 1) * 32767), 44 + index * 2)
  }
  await writeFile(filePath, buffer)
}

async function readAudioMetrics(filePath: string): Promise<AudioMetrics> {
  const buffer = await readFile(filePath)
  const parsed = parsePcm16Wav(buffer)
  let sumSquares = 0
  let peakAbs = 0
  let clippingSampleCount = 0
  for (const sample of parsed.samples) {
    const abs = Math.abs(sample)
    peakAbs = Math.max(peakAbs, abs)
    sumSquares += sample * sample
    if (abs >= 32760) clippingSampleCount += 1
  }
  const rmsInt = Math.sqrt(sumSquares / parsed.samples.length)
  const peakNormalized = peakAbs / 32768
  const rmsNormalized = rmsInt / 32768
  return {
    sampleRate: parsed.sampleRate,
    channels: parsed.channels,
    durationSeconds: Number((parsed.frameCount / parsed.sampleRate).toFixed(6)),
    sampleCount: parsed.samples.length,
    peakAbs: Number(peakNormalized.toFixed(6)),
    rms: Number(rmsNormalized.toFixed(6)),
    clippingSampleCount,
    peakDbfs: toDbfs(peakNormalized),
    rmsDbfs: toDbfs(rmsNormalized),
  }
}

function parsePcm16Wav(buffer: Buffer): {
  sampleRate: number
  channels: number
  frameCount: number
  samples: Int16Array
} {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Expected PCM16 WAV RIFF/WAVE file.')
  }
  let offset = 12
  let channels = 0
  let sampleRate = 0
  let dataOffset = 0
  let dataSize = 0
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const chunkDataOffset = offset + 8
    if (chunkId === 'fmt ') {
      const audioFormat = buffer.readUInt16LE(chunkDataOffset)
      channels = buffer.readUInt16LE(chunkDataOffset + 2)
      sampleRate = buffer.readUInt32LE(chunkDataOffset + 4)
      const bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14)
      if (audioFormat !== 1 || bitsPerSample !== 16) throw new Error('Only PCM16 WAV files are supported for Phase 36C metrics.')
    } else if (chunkId === 'data') {
      dataOffset = chunkDataOffset
      dataSize = chunkSize
      break
    }
    offset = chunkDataOffset + chunkSize + (chunkSize % 2)
  }
  if (!sampleRate || !channels || !dataOffset || !dataSize) throw new Error('Invalid WAV file: missing fmt or data chunk.')
  const sampleCount = dataSize / 2
  const samples = new Int16Array(sampleCount)
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = buffer.readInt16LE(dataOffset + index * 2)
  }
  return {
    sampleRate,
    channels,
    frameCount: sampleCount / channels,
    samples,
  }
}

function compareAudioMetrics(input: AudioMetrics, output: AudioMetrics): Record<string, number | string | boolean> {
  return {
    inputRmsDbfs: input.rmsDbfs,
    outputRmsDbfs: output.rmsDbfs,
    inputPeakDbfs: input.peakDbfs,
    outputPeakDbfs: output.peakDbfs,
    durationDeltaSeconds: Number(Math.abs(input.durationSeconds - output.durationSeconds).toFixed(6)),
    outputClippingSampleCount: output.clippingSampleCount,
    rmsDeltaDb: Number((output.rmsDbfs - input.rmsDbfs).toFixed(3)),
    outputDecoded: true,
    interpretation: 'Generated-audio runtime sanity metric only; subjective quality and real media cleanup remain unapproved.',
  }
}

function toDbfs(value: number): number {
  if (value <= 0) return -120
  return Number((20 * Math.log10(value)).toFixed(3))
}

function buildAggregateChecksum(entries: { relativePath: string; sha256: string }[]): string {
  const content = [...entries]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256}  ${entry.relativePath}`)
    .join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

async function sha256File(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

function parseGcsUri(gcsUri: string): { bucket: string; object: string } {
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  return { bucket: match[1], object: match[2] }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

async function resetWorkDirs(...dirs: string[]): Promise<void> {
  for (const dir of dirs) {
    if (!dir.startsWith(os.tmpdir()) && !dir.startsWith('/tmp/')) throw new Error(`Refusing to remove non-temp directory: ${dir}`)
    await rm(dir, { recursive: true, force: true })
  }
}

await main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const runId = process.env.REEDITPRO_PHASE36C_RUN_ID ?? `phase36c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const storage = new Storage({ projectId: PROJECT_ID })
  const reportObject = `${REPORT_PREFIX}/${runId}/reports/phase36c-report.json`
  const report = {
    ok: false,
    runId,
    projectId: PROJECT_ID,
    jobName: process.env.CLOUD_RUN_JOB ?? 'reeditpro-staging-deepfilternet-runtime-job',
    runtime: {
      mode: RUNTIME_MODE,
      cpuOnly: true,
      cliExecutable: false,
      exitCode: 1,
      stderrPreview: message,
    },
    model: {
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      artifactGcsPath: ARTIFACT_GCS_PATH,
      runtimePath: process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH ?? '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6',
      cliFileName: CLI_FILE_NAME,
      modelArchiveFileName: MODEL_ARCHIVE_FILE_NAME,
      cliSha256: CLI_SHA256,
      modelArchiveSha256: MODEL_ARCHIVE_SHA256,
      aggregateSha256: AGGREGATE_SHA256,
      copiedFiles: [],
    },
    fixture: {
      generated: true,
      generatedAudioOnly: true,
      sampleRate: SAMPLE_RATE,
      channels: CHANNELS,
      durationSeconds: DURATION_SECONDS,
      cleanReferenceUri: '',
      noisyInputUri: '',
      manifestUri: '',
    },
    enhancedAudio: {
      status: 'failed',
      inputMetrics: {
        sampleRate: SAMPLE_RATE,
        channels: CHANNELS,
        durationSeconds: 0,
        sampleCount: 0,
        peakAbs: 0,
        rms: 0,
        clippingSampleCount: 0,
        peakDbfs: -120,
        rmsDbfs: -120,
      },
    },
    qa: {
      status: 'blocked',
      gates: [
        { gateId: 'runtime_integrity', status: 'blocked', summary: message },
      ],
      blockers: [message],
      warnings: stack ? [stack.slice(0, 1000)] : [],
    },
    artifacts: [],
    safety: {
      generatedAudioOnly: true,
      providerExecuted: false,
      modelDownloadedExternally: false,
      realMediaUsed: false,
      realVideoInputUsed: false,
      realAudioInputUsed: false,
      rnnoiseUsed: false,
      demucsUsed: false,
      filmUsed: false,
      slowMotionExecuted: false,
      revideoUsed: false,
      publicAccessEnabled: false,
      secretValuesUsed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
    },
    uploadedReport: {
      bucket: QA_BUCKET,
      object: reportObject,
      gcsUri: `gs://${QA_BUCKET}/${reportObject}`,
    },
    warnings: ['Phase 36C failed before successful generated-audio runtime verification.'],
  }
  try {
    await storage.bucket(QA_BUCKET).file(reportObject).save(`${JSON.stringify(report, null, 2)}\n`, {
      contentType: 'application/json',
      resumable: false,
    })
  } catch {
    // If GCS is unavailable, Cloud Run logs still expose the failure JSON below.
  }
  console.log(JSON.stringify(report))
  process.exitCode = 1
})
