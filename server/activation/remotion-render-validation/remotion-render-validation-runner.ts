import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildRemotionRenderEnvVars } from './remotion-render-validation-command-plan'
import { buildRemotionRenderIamPlan } from './remotion-render-validation-iam-plan'
import {
  makeRemotionRenderRunId,
  remotionRenderArtifactPrefix,
  remotionRenderValidationConfig,
  validateRemotionRenderExecutionEnv,
} from './remotion-render-validation-policy'
import { remotionRenderEvidenceToTypeScript } from './remotion-render-validation-report-builder'
import type { ApprovedRemotionRenderEvidence, RemotionRenderExecutionReport } from './remotion-render-validation-types'

const execFileAsync = promisify(execFile)

export async function runRemotionRenderValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45B Remotion render validation.')
  const runId = input.runId ?? makeRemotionRenderRunId()
  const artifactPrefix = remotionRenderArtifactPrefix(runId)
  const preflight = await runRemotionRenderPreflight()
  if (!preflight.allowed) throw new Error(`Remotion render validation preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureRemotionRenderIamBindings()
  await runCommand('npm', ['run', 'build:staging-remotion-render-validation-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/remotion-render-validation/Dockerfile',
    '-t',
    remotionRenderValidationConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 2 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', remotionRenderValidationConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${remotionRenderValidationConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    remotionRenderValidationConfig.runtimeJobName,
    '--project',
    remotionRenderValidationConfig.projectId,
    '--region',
    remotionRenderValidationConfig.region,
    '--image',
    imageRef,
    '--service-account',
    remotionRenderValidationConfig.serviceAccountEmail,
    `--cpu=${remotionRenderValidationConfig.cpu}`,
    `--memory=${remotionRenderValidationConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRemotionRenderEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    remotionRenderValidationConfig.runtimeJobName,
    '--region',
    remotionRenderValidationConfig.region,
    '--project',
    remotionRenderValidationConfig.projectId,
    '--wait',
  ], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
    ?? lastGcloudValue(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      remotionRenderValidationConfig.runtimeJobName,
      '--region',
      remotionRenderValidationConfig.region,
      '--project',
      remotionRenderValidationConfig.projectId,
      '--limit=1',
      '--format=value(metadata.name)',
    ]))

  const localReportPath = path.join(os.tmpdir(), `reeditpro-remotion-render-${runId}`, 'phase45b-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${remotionRenderValidationConfig.qaBucket}/${artifactPrefix}/reports/phase45b-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as RemotionRenderExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const evidence: ApprovedRemotionRenderEvidence = {
    phase: '45B',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: remotionRenderValidationConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: remotionRenderValidationConfig.approvedInputVideoGcsUri,
    phase45APreview: remotionRenderValidationConfig.approvedPhase45APreviewGcsUri,
    remotionPreviewUri: executionReport.preview.gcsUri,
    qaReportUri: reportUri,
    toolResults: {
      remotion: executionReport.qa.gates.some((gate) => gate.gateId === 'remotion_render_invoked' && gate.passed) ? 'passed' : 'blocked',
      ffprobe: executionReport.qa.gates.some((gate) => gate.gateId === 'ffprobe_preview_validation' && gate.passed) ? 'passed' : 'blocked',
    },
    phase45CReadiness: executionReport.phase45CReadiness,
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges, evidenceModule: remotionRenderEvidenceToTypeScript(evidence) }
}

export async function runRemotionRenderPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  try {
    const [activeAccount, activeProject, projectDescribe, finalExportsBucket, previewsBucket, qaBucket, serviceAccount, sourceObject, phase45APreviewObject, phase45AReportObject] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', remotionRenderValidationConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${remotionRenderValidationConfig.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${remotionRenderValidationConfig.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${remotionRenderValidationConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['iam', 'service-accounts', 'describe', remotionRenderValidationConfig.serviceAccountEmail, '--project', remotionRenderValidationConfig.projectId, '--format=value(email)']),
      runGcloud(['storage', 'objects', 'describe', remotionRenderValidationConfig.approvedInputVideoGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', remotionRenderValidationConfig.approvedPhase45APreviewGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', remotionRenderValidationConfig.approvedPhase45AReportGcsUri, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (lastGcloudValue(projectDescribe) !== remotionRenderValidationConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(finalExportsBucket) !== remotionRenderValidationConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== remotionRenderValidationConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== remotionRenderValidationConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (lastGcloudValue(serviceAccount) !== remotionRenderValidationConfig.serviceAccountEmail) blockers.push('Render service account is not reachable.')
    if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
    if (!lastGcloudValue(phase45APreviewObject)) blockers.push('Approved Phase 45A preview object is not reachable.')
    if (!lastGcloudValue(phase45AReportObject)) blockers.push('Approved Phase 45A report object is not reachable.')
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  try {
    await runGcloud([
      'run',
      'jobs',
      'describe',
      remotionRenderValidationConfig.runtimeJobName,
      '--region',
      remotionRenderValidationConfig.region,
      '--project',
      remotionRenderValidationConfig.projectId,
      '--format=value(metadata.name)',
    ])
  } catch {
    warnings.push('Phase 45B Cloud Run job does not exist yet and will be created by the runner.')
  }

  const validation = validateRemotionRenderExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION,
    runtimeMode: process.env.REEDITPRO_REMOTION_RENDER_RUNTIME_MODE ?? remotionRenderValidationConfig.runtimeMode,
    sourceVideo: process.env.REEDITPRO_PHASE45B_INPUT_VIDEO_GCS_URI ?? remotionRenderValidationConfig.approvedInputVideoGcsUri,
    phase45APreview: process.env.REEDITPRO_PHASE45B_PHASE45A_PREVIEW_GCS_URI ?? remotionRenderValidationConfig.approvedPhase45APreviewGcsUri,
    phase45AReport: process.env.REEDITPRO_PHASE45B_PHASE45A_REPORT_GCS_URI ?? remotionRenderValidationConfig.approvedPhase45AReportGcsUri,
    previewDurationSeconds: remotionRenderValidationConfig.previewDurationSeconds,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    trackBEnabled: process.env.TRACK_B_TOOLS_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
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

async function ensureRemotionRenderIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildRemotionRenderIamPlan()) {
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
