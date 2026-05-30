import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildFilmRuntimeEnvVars } from './film-runtime-command-plan'
import { buildFilmRuntimeIamPlan } from './film-runtime-iam-plan'
import { filmRuntimeArtifactPrefix, filmRuntimeConfig, filmRuntimeExpectedFiles, validateFilmRuntimeExecutionEnv } from './film-runtime-policy'
import type { ApprovedFilmRuntimeEvidence, FilmRuntimeExecutionReport } from './film-runtime-types'

const execFileAsync = promisify(execFile)

export async function runFilmRuntimeVerification(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedFilmRuntimeEvidence
  executionReport: FilmRuntimeExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 38C FILM runtime verification flow.')
  const runId = input.runId ?? `phase38c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const artifactPrefix = filmRuntimeArtifactPrefix(runId)
  const preflight = await runFilmRuntimePreflight()
  if (!preflight.allowed) throw new Error(`FILM runtime preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureFilmRuntimeIamBindings()
  await runCommand('npm', ['run', 'build:staging-film-runtime-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/film-runtime/Dockerfile',
    '-t',
    filmRuntimeConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', filmRuntimeConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${filmRuntimeConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    filmRuntimeConfig.runtimeJobName,
    '--project',
    filmRuntimeConfig.projectId,
    '--region',
    filmRuntimeConfig.region,
    '--image',
    imageRef,
    '--service-account',
    filmRuntimeConfig.serviceAccountEmail,
    `--cpu=${filmRuntimeConfig.cpu}`,
    `--memory=${filmRuntimeConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildFilmRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    filmRuntimeConfig.runtimeJobName,
    '--region',
    filmRuntimeConfig.region,
    '--project',
    filmRuntimeConfig.projectId,
    '--wait',
  ], 60 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-film-runtime-${runId}`, 'film-runtime-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${filmRuntimeConfig.qaBucket}/${artifactPrefix}/reports/phase38c-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as FilmRuntimeExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedFilmRuntimeEvidence = {
    phase: '38C',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: filmRuntimeConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    computeMode: filmRuntimeConfig.computeMode,
    artifactId: filmRuntimeConfig.artifactId,
    aggregateSha256: filmRuntimeConfig.aggregateSha256,
    generatedFixture: {
      width: executionReport.fixture.width,
      height: executionReport.fixture.height,
      frameCount: executionReport.fixture.frameCount,
      interpolationTime: executionReport.fixture.interpolationTime,
    },
    interpolatedFrameCount: executionReport.interpolation.interpolatedFrameCount,
    artifactPrefix: `gs://${filmRuntimeConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    phase38DReadiness: {
      readyForControlledSelectedRealVideoSlowMotionSample: verified,
      reason: verified
        ? 'Phase 38C verified FILM runtime on generated synthetic frames only; Phase 38D may plan one controlled selected real-video slow-motion sample.'
        : 'Phase 38D remains blocked because Phase 38C runtime QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runFilmRuntimePreflight() {
  const objectChecks = filmRuntimeExpectedFiles.map((relativePath) => runGcloud(['storage', 'objects', 'describe', `${filmRuntimeConfig.artifactGcsPath}${relativePath}`, '--format=value(size)']))
  const [activeAccount, activeProject, projectDescribe, generatedBucket, qaBucket, tempBucket, manifest, serviceAccount, jobDescribe, ...objects] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${filmRuntimeConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${filmRuntimeConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${filmRuntimeConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', `${filmRuntimeConfig.artifactGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', filmRuntimeConfig.serviceAccountEmail, '--project', filmRuntimeConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', filmRuntimeConfig.runtimeJobName, '--region', filmRuntimeConfig.region, '--project', filmRuntimeConfig.projectId, '--format=value(metadata.name)'], true),
    ...objectChecks,
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== filmRuntimeConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(generatedBucket) !== filmRuntimeConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== filmRuntimeConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== filmRuntimeConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(manifest)) <= 0) blockers.push('Approved FILM model manifest object is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== filmRuntimeConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run FILM runtime job does not exist yet and will be created.')
  objects.forEach((object, index) => {
    if (Number(lastGcloudValue(object)) <= 0) blockers.push(`Approved FILM artifact object is missing or empty: ${filmRuntimeExpectedFiles[index]}`)
  })

  const validation = validateFilmRuntimeExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FILM_RUNTIME,
    runtimeMode: process.env.REEDITPRO_FILM_RUNTIME_MODE ?? filmRuntimeConfig.runtimeMode,
    artifactGcsPath: process.env.REEDITPRO_FILM_ARTIFACT_GCS_PATH ?? filmRuntimeConfig.artifactGcsPath,
    kerasMetadataSha256: process.env.REEDITPRO_FILM_KERAS_METADATA_SHA256 ?? filmRuntimeConfig.kerasMetadataSha256,
    savedModelSha256: process.env.REEDITPRO_FILM_SAVED_MODEL_SHA256 ?? filmRuntimeConfig.savedModelSha256,
    variablesDataSha256: process.env.REEDITPRO_FILM_VARIABLES_DATA_SHA256 ?? filmRuntimeConfig.variablesDataSha256,
    variablesIndexSha256: process.env.REEDITPRO_FILM_VARIABLES_INDEX_SHA256 ?? filmRuntimeConfig.variablesIndexSha256,
    aggregateSha256: process.env.REEDITPRO_FILM_AGGREGATE_SHA256 ?? filmRuntimeConfig.aggregateSha256,
    generatedFramesOnly: process.env.GENERATED_FRAMES_ONLY ?? 'true',
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    realMediaInputEnabled: process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

async function ensureFilmRuntimeIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildFilmRuntimeIamPlan()) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${plan.bucket}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) throw new Error(`Bucket ${plan.bucket} has a public principal in IAM policy.`)
    if (policy.includes(plan.member) && policy.includes(plan.role) && policy.includes(plan.conditionTitle)) {
      changes.push(`existing:${plan.bindingId}`)
      continue
    }
    await runGcloud([
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${plan.bucket}`,
      `--member=${plan.member}`,
      `--role=${plan.role}`,
      `--condition=title=${plan.conditionTitle},expression=${plan.conditionExpression},description=${plan.description}`,
    ])
    changes.push(`added:${plan.bindingId}`)
  }
  return changes
}

async function runGcloud(args: string[], allowFailure = false): Promise<string> {
  try {
    return await runCommand('gcloud', args)
  } catch (error) {
    if (allowFailure) return ''
    throw error
  }
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:/private/tmp/codex-node-runtime/bin:${process.env.PATH ?? ''}`,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

function parseImageDigest(output: string): string {
  const match = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/i) ?? output.match(/"(sha256:[a-f0-9]{64})"/i)
  if (!match) throw new Error(`Could not parse image digest from docker inspect output: ${output.slice(0, 500)}`)
  return match[1]
}

function parseExecutionId(output: string): string | undefined {
  return output.match(/Execution \[([^\]]+)\]/)?.[1] ?? output.match(/executions\/([A-Za-z0-9_-]+)/)?.[1]
}

function lastGcloudValue(output: string): string {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? ''
}

async function deleteAppleDoubleFiles(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.name.startsWith('._')) {
      await rm(entryPath, { force: true, recursive: true })
      return
    }
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') await deleteAppleDoubleFiles(entryPath)
  }))
}

export function filmRuntimeEvidenceToTypeScript(evidence: ApprovedFilmRuntimeEvidence): string {
  return [
    'import type { ApprovedFilmRuntimeEvidence } from \'./film-runtime-types\'',
    '',
    'export const approvedFilmRuntimeEvidence: ApprovedFilmRuntimeEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedFilmRuntimeEvidence(): ApprovedFilmRuntimeEvidence {',
    '  return {',
    '    ...approvedFilmRuntimeEvidence,',
    '    generatedFixture: approvedFilmRuntimeEvidence.generatedFixture ? { ...approvedFilmRuntimeEvidence.generatedFixture } : undefined,',
    '    phase38DReadiness: { ...approvedFilmRuntimeEvidence.phase38DReadiness },',
    '    blockers: [...approvedFilmRuntimeEvidence.blockers],',
    '    warnings: [...approvedFilmRuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
