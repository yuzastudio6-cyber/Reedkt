import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildLibassBurninEnvVars } from './libass-burnin-validation-command-plan'
import { buildLibassBurninIamPlan } from './libass-burnin-validation-iam-plan'
import {
  libassBurninArtifactPrefix,
  libassBurninValidationConfig,
  makeLibassBurninRunId,
  validateLibassBurninExecutionEnv,
} from './libass-burnin-validation-policy'
import { libassBurninEvidenceToTypeScript } from './libass-burnin-validation-report-builder'
import type { ApprovedLibassBurninEvidence, LibassBurninExecutionReport } from './libass-burnin-validation-types'

const execFileAsync = promisify(execFile)

export async function runLibassBurninValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45A libass burn-in validation.')
  const runId = input.runId ?? makeLibassBurninRunId()
  const artifactPrefix = libassBurninArtifactPrefix(runId)
  const preflight = await runLibassBurninPreflight()
  if (!preflight.allowed) throw new Error(`Libass burn-in preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureLibassBurninIamBindings()
  await runCommand('npm', ['run', 'build:staging-libass-burnin-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/libass-burnin-validation/Dockerfile',
    '-t',
    libassBurninValidationConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 2 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', libassBurninValidationConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${libassBurninValidationConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    libassBurninValidationConfig.runtimeJobName,
    '--project',
    libassBurninValidationConfig.projectId,
    '--region',
    libassBurninValidationConfig.region,
    '--image',
    imageRef,
    '--service-account',
    libassBurninValidationConfig.serviceAccountEmail,
    `--cpu=${libassBurninValidationConfig.cpu}`,
    `--memory=${libassBurninValidationConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildLibassBurninEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    libassBurninValidationConfig.runtimeJobName,
    '--region',
    libassBurninValidationConfig.region,
    '--project',
    libassBurninValidationConfig.projectId,
    '--wait',
  ], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
    ?? lastGcloudValue(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      libassBurninValidationConfig.runtimeJobName,
      '--region',
      libassBurninValidationConfig.region,
      '--project',
      libassBurninValidationConfig.projectId,
      '--limit=1',
      '--format=value(metadata.name)',
    ]))

  const localReportPath = path.join(os.tmpdir(), `reeditpro-libass-burnin-${runId}`, 'phase45a-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${libassBurninValidationConfig.qaBucket}/${artifactPrefix}/reports/phase45a-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as LibassBurninExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const evidence: ApprovedLibassBurninEvidence = {
    phase: '45A',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: libassBurninValidationConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: libassBurninValidationConfig.approvedInputVideoGcsUri,
    captionSource: libassBurninValidationConfig.approvedCaptionAssGcsUri,
    previewUri: executionReport.preview.gcsUri,
    qaReportUri: reportUri,
    toolResults: {
      ffmpeg: executionReport.qa.gates.some((gate) => gate.gateId === 'burnin_preview_created' && gate.passed) ? 'passed' : 'blocked',
      ffprobe: executionReport.qa.gates.some((gate) => gate.gateId === 'preview_decodes' && gate.passed) ? 'passed' : 'blocked',
      libass: executionReport.qa.gates.some((gate) => gate.gateId === 'libass_filter_available' && gate.passed) ? 'passed' : 'blocked',
    },
    phase45BReadiness: executionReport.phase45BReadiness,
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges, evidenceModule: libassBurninEvidenceToTypeScript(evidence) }
}

export async function runLibassBurninPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  try {
    const [activeAccount, activeProject, projectDescribe, finalExportsBucket, transcriptsBucket, previewsBucket, qaBucket, serviceAccount, sourceObject, captionObject, phase40DReportObject] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', libassBurninValidationConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${libassBurninValidationConfig.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${libassBurninValidationConfig.transcriptsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${libassBurninValidationConfig.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${libassBurninValidationConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['iam', 'service-accounts', 'describe', libassBurninValidationConfig.serviceAccountEmail, '--project', libassBurninValidationConfig.projectId, '--format=value(email)']),
      runGcloud(['storage', 'objects', 'describe', libassBurninValidationConfig.approvedInputVideoGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', libassBurninValidationConfig.approvedCaptionAssGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', libassBurninValidationConfig.phase40DReportUri, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (lastGcloudValue(projectDescribe) !== libassBurninValidationConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(finalExportsBucket) !== libassBurninValidationConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(transcriptsBucket) !== libassBurninValidationConfig.transcriptsBucket) blockers.push('Transcripts bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== libassBurninValidationConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== libassBurninValidationConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (lastGcloudValue(serviceAccount) !== libassBurninValidationConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
    if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
    if (!lastGcloudValue(captionObject)) blockers.push('Approved Phase 28 ASS caption object is not reachable.')
    if (!lastGcloudValue(phase40DReportObject)) blockers.push('Phase 40D report object is not reachable.')
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateLibassBurninExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION,
    runtimeMode: process.env.REEDITPRO_LIBASS_RUNTIME_MODE ?? libassBurninValidationConfig.runtimeMode,
    sourceVideo: process.env.REEDITPRO_PHASE45A_INPUT_VIDEO_GCS_URI ?? libassBurninValidationConfig.approvedInputVideoGcsUri,
    captionSource: process.env.REEDITPRO_PHASE45A_CAPTION_ASS_GCS_URI ?? libassBurninValidationConfig.approvedCaptionAssGcsUri,
    previewDurationSeconds: libassBurninValidationConfig.previewDurationSeconds,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    trackBEnabled: process.env.TRACK_B_TOOLS_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
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

async function ensureLibassBurninIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildLibassBurninIamPlan()) {
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

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args)
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
  return output.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
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
