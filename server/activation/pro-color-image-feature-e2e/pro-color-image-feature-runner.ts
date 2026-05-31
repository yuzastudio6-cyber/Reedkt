import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildProColorImageFeatureE2EEnvVars } from './pro-color-image-feature-command-plan'
import { buildProColorImageFeatureE2EIamPlan } from './pro-color-image-feature-iam-plan'
import {
  makeProColorImageFeatureE2ERunId,
  proColorImageFeatureE2EArtifactPrefix,
  proColorImageFeatureE2EConfig,
  validateProColorImageFeatureE2EExecutionEnv,
} from './pro-color-image-feature-e2e-policy'
import type { ApprovedProColorImageFeatureE2EEvidence, ProColorImageFeatureE2EExecutionReport } from './pro-color-image-feature-e2e-types'

const execFileAsync = promisify(execFile)

export async function runProColorImageFeatureE2E(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedProColorImageFeatureE2EEvidence
  executionReport: ProColorImageFeatureE2EExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 40D pro color/image private feature E2E gate.')
  const runId = input.runId ?? makeProColorImageFeatureE2ERunId()
  const artifactPrefix = proColorImageFeatureE2EArtifactPrefix(runId)
  const preflight = await runProColorImageFeatureE2EPreflight()
  if (!preflight.allowed) throw new Error(`Pro color/image feature E2E preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureProColorImageFeatureE2EIamBindings()
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
    proColorImageFeatureE2EConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', proColorImageFeatureE2EConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${proColorImageFeatureE2EConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    proColorImageFeatureE2EConfig.runtimeJobName,
    '--project',
    proColorImageFeatureE2EConfig.projectId,
    '--region',
    proColorImageFeatureE2EConfig.region,
    '--image',
    imageRef,
    '--service-account',
    proColorImageFeatureE2EConfig.serviceAccountEmail,
    `--cpu=${proColorImageFeatureE2EConfig.cpu}`,
    `--memory=${proColorImageFeatureE2EConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildProColorImageFeatureE2EEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    proColorImageFeatureE2EConfig.runtimeJobName,
    '--region',
    proColorImageFeatureE2EConfig.region,
    '--project',
    proColorImageFeatureE2EConfig.projectId,
    '--wait',
  ], 60 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
    ?? lastGcloudValue(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      proColorImageFeatureE2EConfig.runtimeJobName,
      '--region',
      proColorImageFeatureE2EConfig.region,
      '--project',
      proColorImageFeatureE2EConfig.projectId,
      '--limit=1',
      '--format=value(metadata.name)',
    ]))
  const localReportPath = path.join(os.tmpdir(), `reeditpro-pro-color-image-feature-e2e-${runId}`, 'phase40d-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${proColorImageFeatureE2EConfig.qaBucket}/${artifactPrefix}/reports/phase40d-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as ProColorImageFeatureE2EExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const toolStatus = Object.fromEntries(executionReport.tools.map((tool) => [tool.toolId, tool.status])) as ApprovedProColorImageFeatureE2EEvidence['toolResults']
  const evidence: ApprovedProColorImageFeatureE2EEvidence = {
    phase: '40D',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: proColorImageFeatureE2EConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
    planSnapshotUri: executionReport.planSnapshot.gcsUri,
    reviewManifestUri: executionReport.reviewArtifacts.reviewManifestUri,
    contactSheetUri: executionReport.reviewArtifacts.contactSheetUri,
    sample: {
      timestampsSeconds: executionReport.sample.timestampsSeconds,
      width: executionReport.sample.width,
      height: executionReport.sample.height,
      frameCount: executionReport.sample.frameCount,
    },
    artifactPrefix: `gs://${proColorImageFeatureE2EConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    toolResults: {
      ffprobe: toolStatus.ffprobe ?? 'blocked',
      ffmpeg: toolStatus.ffmpeg ?? 'blocked',
      opencolorio: toolStatus.opencolorio ?? 'blocked',
      openimageio: toolStatus.openimageio ?? 'blocked',
      kornia: toolStatus.kornia ?? 'blocked',
    },
    featureReadiness: {
      readyForInternalProColorImageFeatureTesting: verified,
      reason: verified
        ? 'Phase 40D private feature E2E QA passed on bounded approved real-video-derived frames.'
        : 'Internal pro color/image feature testing remains blocked because Phase 40D QA did not pass.',
    },
    phase45AReadiness: {
      readyForLibassCaptionBurnInValidation: verified,
      reason: verified
        ? 'Phase 40D passed; Phase 45A may start libass caption burn-in validation only.'
        : 'Phase 45A remains blocked until Phase 40D feature E2E QA passes.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runProColorImageFeatureE2EPreflight() {
  const [activeAccount, activeProject, projectDescribe, finalExportsBucket, generatedBucket, previewsBucket, qaBucket, tempBucket, serviceAccount, sourceObject, phase40CReportObject, phase40CReportText, jobDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageFeatureE2EConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageFeatureE2EConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageFeatureE2EConfig.previewsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageFeatureE2EConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${proColorImageFeatureE2EConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['iam', 'service-accounts', 'describe', proColorImageFeatureE2EConfig.serviceAccountEmail, '--project', proColorImageFeatureE2EConfig.projectId, '--format=value(email)']),
    runGcloud(['storage', 'objects', 'describe', proColorImageFeatureE2EConfig.approvedInputVideoGcsUri, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', proColorImageFeatureE2EConfig.phase40CReportUri, '--format=value(name)']),
    runGcloud(['storage', 'cat', proColorImageFeatureE2EConfig.phase40CReportUri]),
    runGcloud(['run', 'jobs', 'describe', proColorImageFeatureE2EConfig.runtimeJobName, '--region', proColorImageFeatureE2EConfig.region, '--project', proColorImageFeatureE2EConfig.projectId, '--format=value(metadata.name)'], true),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== proColorImageFeatureE2EConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalExportsBucket) !== proColorImageFeatureE2EConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== proColorImageFeatureE2EConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(previewsBucket) !== proColorImageFeatureE2EConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== proColorImageFeatureE2EConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== proColorImageFeatureE2EConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (lastGcloudValue(serviceAccount) !== proColorImageFeatureE2EConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
  if (!lastGcloudValue(phase40CReportObject)) blockers.push('Approved Phase 40C QA report object is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run pro color/image runtime job does not exist yet and will be created.')
  try {
    const report = parseGcloudJsonObject(phase40CReportText) as { ok?: boolean; qa?: { status?: string; blockers?: string[] } }
    if (report.ok !== true || report.qa?.status !== 'passed') blockers.push('Phase 40C report exists but did not pass without blockers.')
  } catch {
    blockers.push('Phase 40C report could not be parsed as JSON.')
  }

  const validation = validateProColorImageFeatureE2EExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E,
    runtimeMode: process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE ?? proColorImageFeatureE2EConfig.runtimeMode,
    inputVideoGcsUri: process.env.REEDITPRO_PHASE40D_INPUT_VIDEO_GCS_URI ?? proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
    frameCount: proColorImageFeatureE2EConfig.preferredFrameCount,
    frameWidth: proColorImageFeatureE2EConfig.maxFrameWidth,
    frameHeight: proColorImageFeatureE2EConfig.maxFrameHeight,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    fullVideoProcessingEnabled: process.env.FULL_VIDEO_PROCESSING_ENABLED ?? 'false',
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

export function proColorImageFeatureE2EEvidenceToTypeScript(evidence: ApprovedProColorImageFeatureE2EEvidence): string {
  return `import type { ApprovedProColorImageFeatureE2EEvidence } from './pro-color-image-feature-e2e-types'\n\nexport const approvedProColorImageFeatureE2EEvidence: ApprovedProColorImageFeatureE2EEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedProColorImageFeatureE2EEvidence(): ApprovedProColorImageFeatureE2EEvidence {\n  return {\n    ...approvedProColorImageFeatureE2EEvidence,\n    sample: approvedProColorImageFeatureE2EEvidence.sample ? { ...approvedProColorImageFeatureE2EEvidence.sample, timestampsSeconds: [...approvedProColorImageFeatureE2EEvidence.sample.timestampsSeconds] } : undefined,\n    toolResults: { ...approvedProColorImageFeatureE2EEvidence.toolResults },\n    featureReadiness: { ...approvedProColorImageFeatureE2EEvidence.featureReadiness },\n    phase45AReadiness: { ...approvedProColorImageFeatureE2EEvidence.phase45AReadiness },\n    blockers: [...approvedProColorImageFeatureE2EEvidence.blockers],\n    warnings: [...approvedProColorImageFeatureE2EEvidence.warnings],\n  }\n}\n`
}

async function ensureProColorImageFeatureE2EIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildProColorImageFeatureE2EIamPlan()) {
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

function parseGcloudJsonObject(output: string): unknown {
  const trimmed = output.trim()
  if (!trimmed) throw new Error('gcloud output is empty')
  const firstBrace = trimmed.indexOf('{')
  if (firstBrace < 0) throw new Error('gcloud output does not contain a JSON object')
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = firstBrace; index < trimmed.length; index += 1) {
    const char = trimmed[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return JSON.parse(trimmed.slice(firstBrace, index + 1))
    }
  }
  throw new Error('gcloud output contains an unterminated JSON object')
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
