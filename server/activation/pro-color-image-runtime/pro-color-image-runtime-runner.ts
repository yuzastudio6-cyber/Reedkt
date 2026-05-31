import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildProColorImageRuntimeEnvVars } from './pro-color-image-runtime-command-plan'
import { buildProColorImageRuntimeIamPlan } from './pro-color-image-runtime-iam-plan'
import { makeProColorImageRunId, proColorImageRuntimeArtifactPrefix, proColorImageRuntimeConfig, validateProColorImageRuntimeExecutionEnv } from './pro-color-image-runtime-policy'
import type { ApprovedProColorImageRuntimeEvidence, ProColorImageRuntimeExecutionReport } from './pro-color-image-runtime-types'

const execFileAsync = promisify(execFile)

export async function runProColorImageRuntimeVerification(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedProColorImageRuntimeEvidence
  executionReport: ProColorImageRuntimeExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 40B pro color/image generated-fixture runtime verification flow.')
  const runId = input.runId ?? makeProColorImageRunId()
  const artifactPrefix = proColorImageRuntimeArtifactPrefix(runId)
  const preflight = await runProColorImageRuntimePreflight()
  if (!preflight.allowed) throw new Error(`Pro color/image runtime preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureProColorImageRuntimeIamBindings()
  await runCommand('npm', ['run', 'build:staging-pro-color-image-runtime-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/pro-color-image-runtime/Dockerfile',
    '-t',
    proColorImageRuntimeConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', proColorImageRuntimeConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${proColorImageRuntimeConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    proColorImageRuntimeConfig.runtimeJobName,
    '--project',
    proColorImageRuntimeConfig.projectId,
    '--region',
    proColorImageRuntimeConfig.region,
    '--image',
    imageRef,
    '--service-account',
    proColorImageRuntimeConfig.serviceAccountEmail,
    `--cpu=${proColorImageRuntimeConfig.cpu}`,
    `--memory=${proColorImageRuntimeConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildProColorImageRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    proColorImageRuntimeConfig.runtimeJobName,
    '--region',
    proColorImageRuntimeConfig.region,
    '--project',
    proColorImageRuntimeConfig.projectId,
    '--wait',
  ], 60 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-pro-color-image-runtime-${runId}`, 'pro-color-image-runtime-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${proColorImageRuntimeConfig.qaBucket}/${artifactPrefix}/reports/phase40b-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as ProColorImageRuntimeExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const toolStatus = Object.fromEntries(executionReport.tools.map((tool) => [tool.toolId, tool.status])) as ApprovedProColorImageRuntimeEvidence['toolResults']
  const evidence: ApprovedProColorImageRuntimeEvidence = {
    phase: '40B',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: proColorImageRuntimeConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    computeMode: 'cpu',
    fixture: {
      width: executionReport.fixture.width,
      height: executionReport.fixture.height,
      frameCount: executionReport.fixture.frameCount,
    },
    artifactPrefix: `gs://${proColorImageRuntimeConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    toolResults: {
      opencolorio: toolStatus.opencolorio ?? 'blocked',
      openimageio: toolStatus.openimageio ?? 'blocked',
      kornia: toolStatus.kornia ?? 'blocked',
    },
    phase40CReadiness: {
      readyForControlledRealVideoProColorImageSample: verified,
      reason: verified
        ? 'Phase 40B verified OpenColorIO, OpenImageIO, and Kornia on generated fixtures only; Phase 40C may plan one controlled real-video pro color/image sample.'
        : 'Phase 40C remains blocked because Phase 40B runtime QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runProColorImageRuntimePreflight() {
  const [activeAccount, activeProject, projectDescribe, generatedBucket, qaBucket, tempBucket, serviceAccount, jobDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageRuntimeConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageRuntimeConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageRuntimeConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['iam', 'service-accounts', 'describe', proColorImageRuntimeConfig.serviceAccountEmail, '--project', proColorImageRuntimeConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', proColorImageRuntimeConfig.runtimeJobName, '--region', proColorImageRuntimeConfig.region, '--project', proColorImageRuntimeConfig.projectId, '--format=value(metadata.name)'], true),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== proColorImageRuntimeConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(generatedBucket) !== proColorImageRuntimeConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== proColorImageRuntimeConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== proColorImageRuntimeConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (lastGcloudValue(serviceAccount) !== proColorImageRuntimeConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run pro color/image runtime job does not exist yet and will be created.')

  const validation = validateProColorImageRuntimeExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME,
    runtimeMode: process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE ?? proColorImageRuntimeConfig.runtimeMode,
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

async function ensureProColorImageRuntimeIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildProColorImageRuntimeIamPlan()) {
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

export function proColorImageRuntimeEvidenceToTypeScript(evidence: ApprovedProColorImageRuntimeEvidence): string {
  return [
    "import type { ApprovedProColorImageRuntimeEvidence } from './pro-color-image-runtime-types'",
    '',
    `export const approvedProColorImageRuntimeEvidence: ApprovedProColorImageRuntimeEvidence = ${JSON.stringify(evidence, null, 2)}`,
    '',
    'export function getApprovedProColorImageRuntimeEvidence(): ApprovedProColorImageRuntimeEvidence {',
    '  return {',
    '    ...approvedProColorImageRuntimeEvidence,',
    '    fixture: approvedProColorImageRuntimeEvidence.fixture ? { ...approvedProColorImageRuntimeEvidence.fixture } : undefined,',
    '    toolResults: { ...approvedProColorImageRuntimeEvidence.toolResults },',
    '    phase40CReadiness: { ...approvedProColorImageRuntimeEvidence.phase40CReadiness },',
    '    blockers: [...approvedProColorImageRuntimeEvidence.blockers],',
    '    warnings: [...approvedProColorImageRuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
