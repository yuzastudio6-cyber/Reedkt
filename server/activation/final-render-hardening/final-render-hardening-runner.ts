import { execFile } from 'node:child_process'
import { readdir, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { getApprovedLibassBurninEvidence } from '../libass-burnin-validation'
import { getApprovedOpenTimelineIoEvidence } from '../opentimelineio-validation'
import { getApprovedRemotionRenderEvidence } from '../remotion-render-validation'
import { buildFinalRenderHardeningEnvVars } from './final-render-hardening-command-plan'
import { buildFinalRenderHardeningIamPlan } from './final-render-hardening-iam-plan'
import {
  finalRenderHardeningArtifactPrefix,
  finalRenderHardeningConfig,
  makeFinalRenderHardeningRunId,
  validateFinalRenderHardeningExecutionEnv,
} from './final-render-hardening-policy'
import { finalRenderHardeningEvidenceToTypeScript } from './final-render-hardening-report-builder'
import type { ApprovedFinalRenderHardeningEvidence, FinalRenderHardeningExecutionReport } from './final-render-hardening-types'

const execFileAsync = promisify(execFile)

export async function runFinalRenderHardening(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45D FFmpeg/FFprobe final render hardening.')
  const runId = input.runId ?? makeFinalRenderHardeningRunId()
  const artifactPrefix = finalRenderHardeningArtifactPrefix(runId)
  const preflight = await runFinalRenderHardeningPreflight()
  if (!preflight.allowed) throw new Error(`Final render hardening preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureFinalRenderHardeningIamBindings()
  await runCommand('npm', ['run', 'build:staging-final-render-hardening-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/final-render-hardening/Dockerfile',
    '-t',
    finalRenderHardeningConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 2 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', finalRenderHardeningConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${finalRenderHardeningConfig.runtimeImageRepository}@${imageDigest}`

  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    finalRenderHardeningConfig.runtimeJobName,
    '--project',
    finalRenderHardeningConfig.projectId,
    '--region',
    finalRenderHardeningConfig.region,
    '--image',
    imageRef,
    '--service-account',
    finalRenderHardeningConfig.serviceAccountEmail,
    `--cpu=${finalRenderHardeningConfig.cpu}`,
    `--memory=${finalRenderHardeningConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildFinalRenderHardeningEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    finalRenderHardeningConfig.runtimeJobName,
    '--region',
    finalRenderHardeningConfig.region,
    '--project',
    finalRenderHardeningConfig.projectId,
    '--wait',
  ], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
    ?? lastGcloudValue(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      finalRenderHardeningConfig.runtimeJobName,
      '--region',
      finalRenderHardeningConfig.region,
      '--project',
      finalRenderHardeningConfig.projectId,
      '--limit=1',
      '--format=value(metadata.name)',
    ]))

  const localReportPath = path.join(os.tmpdir(), `reeditpro-final-render-hardening-${runId}`, 'phase45d-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${finalRenderHardeningConfig.qaBucket}/${artifactPrefix}/reports/phase45d-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as FinalRenderHardeningExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const evidence: ApprovedFinalRenderHardeningEvidence = {
    phase: '45D',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: finalRenderHardeningConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: finalRenderHardeningConfig.approvedInputVideoGcsUri,
    phase45APreview: finalRenderHardeningConfig.approvedPhase45APreviewGcsUri,
    phase45BPreview: finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri,
    phase45COtio: finalRenderHardeningConfig.approvedPhase45COtioGcsUri,
    hardenedReviewExportUri: executionReport.export.gcsUri,
    ffprobeValidationUri: `gs://${finalRenderHardeningConfig.qaBucket}/${artifactPrefix}/export/ffprobe-export-validation.json`,
    qaReportUri: reportUri,
    toolResults: {
      ffmpeg: executionReport.qa.gates.some((gate) => gate.gateId === 'ffmpeg_export_invoked' && gate.passed) ? 'passed' : 'blocked',
      ffprobe: executionReport.qa.gates.some((gate) => gate.gateId === 'ffprobe_export_validation' && gate.passed) ? 'passed' : 'blocked',
    },
    phase45EReadiness: executionReport.phase45EReadiness,
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges, evidenceModule: finalRenderHardeningEvidenceToTypeScript(evidence) }
}

export async function runFinalRenderHardeningPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  try {
    const [activeAccount, activeProject, projectDescribe, finalExportsBucket, previewsBucket, generatedAssetsBucket, qaBucket, serviceAccount, sourceObject, phase45APreviewObject, phase45AReportObject, phase45BPreviewObject, phase45BReportObject, phase45COtioObject, phase45CReportObject] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', finalRenderHardeningConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${finalRenderHardeningConfig.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${finalRenderHardeningConfig.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${finalRenderHardeningConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${finalRenderHardeningConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['iam', 'service-accounts', 'describe', finalRenderHardeningConfig.serviceAccountEmail, '--project', finalRenderHardeningConfig.projectId, '--format=value(email)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedInputVideoGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45APreviewGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45AReportGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45BReportGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45COtioGcsUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', finalRenderHardeningConfig.approvedPhase45CReportGcsUri, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (lastGcloudValue(projectDescribe) !== finalRenderHardeningConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(finalExportsBucket) !== finalRenderHardeningConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== finalRenderHardeningConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(generatedAssetsBucket) !== finalRenderHardeningConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== finalRenderHardeningConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (lastGcloudValue(serviceAccount) !== finalRenderHardeningConfig.serviceAccountEmail) blockers.push('Render service account is not reachable.')
    if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
    if (!lastGcloudValue(phase45APreviewObject)) blockers.push('Approved Phase 45A preview object is not reachable.')
    if (!lastGcloudValue(phase45AReportObject)) blockers.push('Approved Phase 45A report object is not reachable.')
    if (!lastGcloudValue(phase45BPreviewObject)) blockers.push('Approved Phase 45B preview object is not reachable.')
    if (!lastGcloudValue(phase45BReportObject)) blockers.push('Approved Phase 45B report object is not reachable.')
    if (!lastGcloudValue(phase45COtioObject)) blockers.push('Approved Phase 45C OTIO object is not reachable.')
    if (!lastGcloudValue(phase45CReportObject)) blockers.push('Approved Phase 45C report object is not reachable.')
    await assertNoPublicBucketPrincipals([finalRenderHardeningConfig.finalExportsBucket, finalRenderHardeningConfig.previewsBucket, finalRenderHardeningConfig.generatedAssetsBucket, finalRenderHardeningConfig.qaBucket], blockers)
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  try {
    await runGcloud([
      'run',
      'jobs',
      'describe',
      finalRenderHardeningConfig.runtimeJobName,
      '--region',
      finalRenderHardeningConfig.region,
      '--project',
      finalRenderHardeningConfig.projectId,
      '--format=value(metadata.name)',
    ])
  } catch {
    warnings.push('Phase 45D Cloud Run job does not exist yet and will be created by the runner.')
  }

  const validation = validateFinalRenderHardeningExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING,
    runtimeMode: process.env.REEDITPRO_FINAL_RENDER_HARDENING_RUNTIME_MODE ?? finalRenderHardeningConfig.runtimeMode,
    sourceVideo: process.env.REEDITPRO_PHASE45D_INPUT_VIDEO_GCS_URI ?? finalRenderHardeningConfig.approvedInputVideoGcsUri,
    phase45APreview: process.env.REEDITPRO_PHASE45D_PHASE45A_PREVIEW_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45APreviewGcsUri,
    phase45AReport: process.env.REEDITPRO_PHASE45D_PHASE45A_REPORT_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45AReportGcsUri,
    phase45BPreview: process.env.REEDITPRO_PHASE45D_PHASE45B_PREVIEW_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri,
    phase45BReport: process.env.REEDITPRO_PHASE45D_PHASE45B_REPORT_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45BReportGcsUri,
    phase45COtio: process.env.REEDITPRO_PHASE45D_PHASE45C_OTIO_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45COtioGcsUri,
    phase45CReport: process.env.REEDITPRO_PHASE45D_PHASE45C_REPORT_GCS_URI ?? finalRenderHardeningConfig.approvedPhase45CReportGcsUri,
    exportDurationSeconds: finalRenderHardeningConfig.exportDurationSeconds,
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

async function ensureFinalRenderHardeningIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildFinalRenderHardeningIamPlan()) {
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

function parseImageDigest(output: string): string {
  const digest = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/)?.[1]
    ?? output.match(/(sha256:[a-f0-9]{64})/)?.[1]
  if (!digest) throw new Error('Unable to parse image digest from docker buildx imagetools inspect output.')
  return digest
}

function parseExecutionId(output: string): string | undefined {
  return output.match(/Executing job.*?execution\s+\[([^\]]+)]/i)?.[1]
    ?? output.match(/Execution\s+\[([^\]]+)]/i)?.[1]
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (policy.includes('allUsers') || policy.includes('allAuthenticatedUsers')) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

async function deleteAppleDoubleFiles(root: string): Promise<void> {
  const entries = await readdir(root, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name)
    if (entry.name === 'node_modules' || entry.name === '.git') return
    if (entry.name.startsWith('._')) {
      await rm(fullPath, { recursive: true, force: true })
      return
    }
    if (entry.isDirectory()) await deleteAppleDoubleFiles(fullPath)
  }))
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const result = await execFileAsync(command, args, { timeout, maxBuffer: 256 * 1024 * 1024 })
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}

export function buildFinalRenderHardeningEvidencePrerequisiteSummary() {
  return {
    phase45A: getApprovedLibassBurninEvidence(),
    phase45B: getApprovedRemotionRenderEvidence(),
    phase45C: getApprovedOpenTimelineIoEvidence(),
  }
}
