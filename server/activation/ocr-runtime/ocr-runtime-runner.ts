import { execFile } from 'node:child_process'
import { access, copyFile, mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildOcrGeneratedFixtureManifest } from './ocr-generated-fixture-registry'
import { collectOcrRuntimeArtifacts, writeOcrRuntimeJsonArtifact } from './ocr-runtime-artifact-manifest-writer'
import { buildOcrModelAssetVerificationReport } from './ocr-runtime-checksum-verifier'
import { safeExtractOcrModelArchive } from './ocr-runtime-extract-models'
import { copyPhase37BOcrAssetsFromPrivateGcs } from './ocr-runtime-gcs-model-resolver'
import { ocrRuntimeConfig, phase37COcrRuntimeArtifactPrefix, validateOcrRuntimeExecutionEnv } from './ocr-runtime-policy'
import { buildOcrRuntimePlan } from './ocr-runtime-report-builder'
import { parseOcrRuntimeExecutionReport } from './ocr-runtime-result-parser'
import type {
  ApprovedOcrRuntimeEvidence,
  OcrRuntimeExecutionResult,
} from './ocr-runtime-types'

const execFileAsync = promisify(execFile)

export async function runOcrRuntimeVerification(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  localRoot?: string
}): Promise<OcrRuntimeExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 37C generated OCR runtime verification flow.')
  const runId = input.runId ?? `phase37c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactPrefix = phase37COcrRuntimeArtifactPrefix(runId)
  const localRoot = input.localRoot ?? path.join(ocrRuntimeConfig.localTempRoot, runId)
  const reportDir = path.join(localRoot, 'reports')
  const fixtureDir = path.join(reportDir, 'fixtures')
  const extractRoot = path.join(localRoot, 'models', 'extracted')

  const preflight = await runOcrRuntimePreflight()
  if (!preflight.allowed) throw new Error(`OCR runtime preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  await rm(localRoot, { recursive: true, force: true })
  await mkdir(reportDir, { recursive: true })
  await mkdir(fixtureDir, { recursive: true })

  const copiedAssets = await copyPhase37BOcrAssetsFromPrivateGcs({ runId, localRoot })
  const verificationReport = await buildOcrModelAssetVerificationReport({ runId, assets: copiedAssets })
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37c_ocr_model_asset_verification.json'), verificationReport)
  if (verificationReport.status !== 'verified') {
    throw new Error(`OCR model asset verification blocked:\n- ${verificationReport.blockers.join('\n- ')}`)
  }

  const detExtract = await safeExtractOcrModelArchive({
    archivePath: path.join(localRoot, 'models', 'raw', 'det', 'PP-OCRv5_mobile_det_infer.tar'),
    extractDir: path.join(extractRoot, 'det'),
    expectedRootPrefix: 'PP-OCRv5_mobile_det_infer/',
  })
  const recExtract = await safeExtractOcrModelArchive({
    archivePath: path.join(localRoot, 'models', 'raw', 'rec', 'PP-OCRv5_mobile_rec_infer.tar'),
    extractDir: path.join(extractRoot, 'rec'),
    expectedRootPrefix: 'PP-OCRv5_mobile_rec_infer/',
  })
  const dictionaryPath = path.join(localRoot, 'models', 'raw', 'dict', 'ppocrv5_dict.txt')

  const createdAt = new Date().toISOString()
  const runtimePlan = buildOcrRuntimePlan(createdAt)
  const fixtureManifest = buildOcrGeneratedFixtureManifest(createdAt)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37c_ocr_runtime_plan.json'), runtimePlan)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37c_generated_fixture_manifest.json'), fixtureManifest)

  const venvPython = await ensureOcrRuntimeVenv(localRoot)
  const workerOutput = await runWorker({
    python: venvPython,
    runId,
    reportDir,
    fixtureDir,
    detectionModelDir: detExtract.modelDir,
    recognitionModelDir: recExtract.modelDir,
    dictionaryPath,
    verificationPath: path.join(reportDir, 'phase_37c_ocr_model_asset_verification.json'),
    fixtureManifestPath: path.join(reportDir, 'phase_37c_generated_fixture_manifest.json'),
  })
  const reportPath = path.join(reportDir, 'phase_37c_generated_ocr_runtime_report.json')
  const executionReport = parseOcrRuntimeExecutionReport(await readFile(reportPath, 'utf8'))
  executionReport.runtime.stderrPreview = [
    executionReport.runtime.stderrPreview,
    workerOutput.stderr.slice(0, 1200),
  ].filter(Boolean).join('\n').slice(0, 3000)

  const objectPrefix = artifactPrefix
  let uploadedArtifacts = await collectOcrRuntimeArtifacts({
    rootDir: reportDir,
    bucket: ocrRuntimeConfig.qaBucket,
    objectPrefix,
  })
  executionReport.artifacts = uploadedArtifacts
  executionReport.uploadedReport = {
    bucket: ocrRuntimeConfig.qaBucket,
    object: `${objectPrefix}/phase_37c_generated_ocr_runtime_report.json`,
    gcsUri: `gs://${ocrRuntimeConfig.qaBucket}/${objectPrefix}/phase_37c_generated_ocr_runtime_report.json`,
  }
  await writeOcrRuntimeJsonArtifact(reportPath, executionReport)
  await writeOcrRuntimeJsonArtifact(path.join(reportDir, 'phase_37c_private_artifact_manifest.json'), {
    phase: '37C',
    runId,
    createdAt: new Date().toISOString(),
    privateOnly: true,
    bucket: ocrRuntimeConfig.qaBucket,
    prefix: objectPrefix,
    artifactCount: uploadedArtifacts.length,
    artifacts: uploadedArtifacts,
    blocked: {
      publicAccess: true,
      signedUrls: true,
      realMedia: true,
      providers: true,
      beta: true,
      production: true,
    },
  })
  uploadedArtifacts = await collectOcrRuntimeArtifacts({
    rootDir: reportDir,
    bucket: ocrRuntimeConfig.qaBucket,
    objectPrefix,
  })
  await uploadOcrRuntimeArtifacts(reportDir, uploadedArtifacts)

  const finalReport = parseOcrRuntimeExecutionReport(await readFile(reportPath, 'utf8'))
  const passed = finalReport.ok && finalReport.qa.status === 'passed'
  const evidence: ApprovedOcrRuntimeEvidence = {
    phase: '37C',
    status: passed ? 'verified' : 'blocked',
    runId,
    modelFamily: 'PP-OCRv5',
    assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
    modelGcsPath: ocrRuntimeConfig.modelGcsPath,
    detectionArchiveSha256: ocrRuntimeConfig.detectionArchiveSha256,
    recognitionArchiveSha256: ocrRuntimeConfig.recognitionArchiveSha256,
    dictionarySha256: ocrRuntimeConfig.dictionarySha256,
    aggregateSha256: ocrRuntimeConfig.aggregateSha256,
    fixtureIds: fixtureManifest.specs.map((fixture) => fixture.fixtureId),
    artifactPrefix: `gs://${ocrRuntimeConfig.qaBucket}/${objectPrefix}/`,
    qaReportUri: `gs://${ocrRuntimeConfig.qaBucket}/${objectPrefix}/phase_37c_ocr_runtime_qa_report.json`,
    phase37DReadiness: {
      readyForControlledRealVideoOcrSafeZone: passed,
      reason: passed
        ? 'Phase 37C verified generated UI/text OCR runtime using private Phase 37B PP-OCRv5 assets; Phase 37D may plan one controlled real-video OCR/caption safe-zone test.'
        : 'Phase 37D remains blocked because Phase 37C generated OCR runtime QA did not pass.',
    },
    blockers: finalReport.qa.blockers,
    warnings: finalReport.warnings,
  }

  if (input.keepTemp !== true) await rm(localRoot, { recursive: true, force: true })

  return {
    evidence,
    executionReport: finalReport,
    localReportPath: reportPath,
    localArtifactDir: reportDir,
    uploadedArtifacts,
  }
}

export async function runOcrRuntimePreflight(): Promise<{
  allowed: boolean
  blockers: string[]
  warnings: string[]
  activeAccount: string
  activeProject: string
}> {
  const assetUris = [
    `${ocrRuntimeConfig.modelGcsPath}det/PP-OCRv5_mobile_det_infer.tar`,
    `${ocrRuntimeConfig.modelGcsPath}rec/PP-OCRv5_mobile_rec_infer.tar`,
    `${ocrRuntimeConfig.modelGcsPath}dict/ppocrv5_dict.txt`,
  ]
  const [
    activeAccount,
    activeProject,
    projectDescribe,
    generatedBucket,
    qaBucket,
    generatedIam,
    qaIam,
    ...objectDescribes
  ] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', ocrRuntimeConfig.projectId, '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${ocrRuntimeConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${ocrRuntimeConfig.qaBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${ocrRuntimeConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${ocrRuntimeConfig.qaBucket}`, '--format=json']),
    ...assetUris.map((uri) => runGcloud(['storage', 'objects', 'describe', uri, '--format=json'])),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== ocrRuntimeConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (!generatedBucket.includes(ocrRuntimeConfig.generatedAssetsBucket)) blockers.push('Generated-assets bucket is not reachable.')
  if (!qaBucket.includes(ocrRuntimeConfig.qaBucket)) blockers.push('QA-artifacts bucket is not reachable.')
  if (/allUsers|allAuthenticatedUsers/.test(generatedIam) || /allUsers|allAuthenticatedUsers/.test(qaIam)) {
    blockers.push('One or more OCR runtime buckets includes a public IAM principal.')
  }
  for (let index = 0; index < objectDescribes.length; index += 1) {
    const parsed = parseGcloudJson(objectDescribes[index]) as Record<string, string | number | undefined>
    const size = Number(parsed.size ?? parsed.contentLength ?? 0)
    if (!Number.isFinite(size) || size <= 0) blockers.push(`Phase 37B OCR asset object is missing or empty: ${assetUris[index]}`)
  }

  const envValidation = validateOcrRuntimeExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    privateGcsReadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ,
    runtimeExecuteConfirmation: process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE,
    artifactUploadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD,
    runtimeMode: process.env.REEDITPRO_OCR_RUNTIME_MODE ?? ocrRuntimeConfig.runtimeMode,
    modelGcsPath: process.env.REEDITPRO_OCR_MODEL_GCS_PATH ?? ocrRuntimeConfig.modelGcsPath,
    aggregateSha256: process.env.REEDITPRO_OCR_AGGREGATE_SHA256 ?? ocrRuntimeConfig.aggregateSha256,
    generatedFixturesOnly: process.env.GENERATED_OCR_FIXTURES_ONLY ?? 'true',
    realMediaInputEnabled: process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false',
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    publicOutputEnabled: process.env.PUBLIC_OUTPUT_ENABLED ?? 'false',
  })

  warnings.push('Phase 37C preflight is read-only for GCS/IAM and does not add bindings.')
  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings: [...envValidation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

export async function runOcrRuntimeDockerBuild(input: { execute: boolean }): Promise<string> {
  if (!input.execute) throw new Error('Pass --docker-build to run the guarded local Docker fallback build.')
  if (process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD=true is required before local Phase 37C Docker fallback build.')
  }
  return runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/arm64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/ocr-runtime/Dockerfile',
    '-t',
    'reeditpro-phase37c-ocr-runtime-local:latest',
    '.',
  ], 45 * 60 * 1000)
}

async function ensureOcrRuntimeVenv(localRoot: string): Promise<string> {
  const venvDir = path.join(localRoot, 'venv')
  const python = path.join(venvDir, 'bin', 'python')
  const basePython = await resolveOcrRuntimePython()
  await runCommand(basePython, ['-m', 'venv', venvDir], 5 * 60 * 1000)
  await runCommand(python, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], 10 * 60 * 1000)
  try {
    await runCommand(python, ['-m', 'pip', 'install', '-r', 'server/workers/ocr-runtime/requirements.ocr.txt'], 45 * 60 * 1000)
  } catch (error) {
    await runCommand(python, ['-m', 'pip', 'install', '--no-deps', '-r', 'server/workers/ocr-runtime/requirements.ocr.txt'], 45 * 60 * 1000)
    await runCommand(python, ['-m', 'pip', 'install', '--no-deps', 'paddlex==3.0.0'], 10 * 60 * 1000)
    await runCommand(python, ['-m', 'pip', 'install', '-r', 'server/workers/ocr-runtime/requirements.ocr-transitive-macos-py312.txt'], 45 * 60 * 1000)
    const maybe = error as { stderr?: string }
    if (maybe.stderr) {
      await writeOcrRuntimeJsonArtifact(path.join(localRoot, 'pip-resolver-fallback.json'), {
        phase: '37C',
        fallback: 'direct_pins_plus_curated_transitives',
        reason: maybe.stderr.slice(0, 3000),
      })
    }
  }
  await seedPaddleXFonts(python)
  return python
}

async function resolveOcrRuntimePython(): Promise<string> {
  const candidates = [
    process.env.REEDITPRO_OCR_RUNTIME_PYTHON,
    '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
    'python3',
  ].filter(Boolean) as string[]
  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      try {
        await access(candidate)
        return candidate
      } catch {
        continue
      }
    }
    return candidate
  }
  return 'python3'
}

async function seedPaddleXFonts(python: string): Promise<void> {
  const sitePackages = (await runCommand(python, ['-c', 'import site; print(site.getsitepackages()[0])'], 60 * 1000)).trim()
  const fontDir = path.join(sitePackages, 'paddlex', 'utils', 'fonts')
  await mkdir(fontDir, { recursive: true })
  const sourceFont = await firstExistingPath([
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Helvetica.ttf',
    '/Library/Fonts/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ])
  if (!sourceFont) return
  await copyFile(sourceFont, path.join(fontDir, 'PingFang-SC-Regular.ttf'))
  await copyFile(sourceFont, path.join(fontDir, 'simfang.ttf'))
}

async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      continue
    }
  }
  return undefined
}

async function runWorker(input: {
  python: string
  runId: string
  reportDir: string
  fixtureDir: string
  detectionModelDir: string
  recognitionModelDir: string
  dictionaryPath: string
  verificationPath: string
  fixtureManifestPath: string
}): Promise<{ stdout: string; stderr: string }> {
  return runCommandWithStderr(input.python, [
    'server/workers/ocr-runtime/run-generated-ocr-fixture.py',
    '--run-id',
    input.runId,
    '--output-dir',
    input.reportDir,
    '--fixture-dir',
    input.fixtureDir,
    '--det-model-dir',
    input.detectionModelDir,
    '--rec-model-dir',
    input.recognitionModelDir,
    '--dict-path',
    input.dictionaryPath,
    '--asset-verification-path',
    input.verificationPath,
    '--fixture-manifest-path',
    input.fixtureManifestPath,
  ], 60 * 60 * 1000)
}

async function uploadOcrRuntimeArtifacts(rootDir: string, artifacts: Array<{ localPath?: string; object?: string }>): Promise<void> {
  if (process.env.REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true is required before uploading Phase 37C private QA artifacts.')
  }
  for (const artifact of artifacts) {
    if (!artifact.localPath || !artifact.object) continue
    const relative = path.relative(rootDir, artifact.localPath)
    if (relative.startsWith('..')) throw new Error(`Refusing to upload artifact outside report dir: ${artifact.localPath}`)
    await runGcloud(['storage', 'cp', artifact.localPath, `gs://${ocrRuntimeConfig.qaBucket}/${artifact.object}`])
  }
}

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args, 5 * 60 * 1000)
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 80 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

async function runCommandWithStderr(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      PYTHONUNBUFFERED: '1',
      PADDLEOCR_HOME: path.join(ocrRuntimeConfig.localTempRoot, '.paddleocr-home'),
      PADDLE_HOME: path.join(ocrRuntimeConfig.localTempRoot, '.paddle-home'),
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      REAL_MEDIA_INPUT_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
    },
  })
  return { stdout, stderr }
}

function lastGcloudValue(output: string): string {
  return output.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}

function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 120)}`)
  return JSON.parse(output.slice(jsonStart))
}

export function ocrRuntimeEvidenceToTypeScript(evidence: ApprovedOcrRuntimeEvidence): string {
  return [
    'import type { ApprovedOcrRuntimeEvidence } from \'./ocr-runtime-types\'',
    '',
    'export const approvedOcrRuntimeEvidence: ApprovedOcrRuntimeEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedOcrRuntimeEvidence(): ApprovedOcrRuntimeEvidence {',
    '  return {',
    '    ...approvedOcrRuntimeEvidence,',
    '    fixtureIds: [...approvedOcrRuntimeEvidence.fixtureIds],',
    '    phase37DReadiness: { ...approvedOcrRuntimeEvidence.phase37DReadiness },',
    '    blockers: [...approvedOcrRuntimeEvidence.blockers],',
    '    warnings: [...approvedOcrRuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
