import { execFile } from 'node:child_process'
import { access, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildVlmGeneratedFixtureManifest } from './vlm-generated-fixture-registry'
import { buildVlmPromptTemplateManifest } from './vlm-prompt-template-registry'
import { collectVlmRuntimeArtifacts, writeVlmRuntimeJsonArtifact } from './vlm-runtime-artifact-manifest-writer'
import { VLM_RUNTIME_EXPECTED_ARTIFACTS } from './vlm-runtime-blocker-policy'
import { buildVlmModelAssetVerificationReport } from './vlm-runtime-checksum-verifier'
import { describePhase39BVlmObjects, copyPhase39BVlmAssetsFromPrivateGcs, parseGcloudJson, runGcloud, verifyVlmRuntimeBuckets } from './vlm-runtime-gcs-model-resolver'
import { phase39CVlmRuntimeArtifactPrefix, validateVlmRuntimeExecutionEnv, vlmRuntimeConfig } from './vlm-runtime-policy'
import {
  buildCostMemoryReport,
  buildHallucinationSafetyReport,
  buildObjectRegionQaReport,
  buildSafeZoneQaReport,
  buildSchemaValidationReport,
  buildVlmRuntimeExecutionReport,
  buildVlmRuntimePlan,
} from './vlm-runtime-report-builder'
import type {
  ApprovedVlmRuntimeEvidence,
  VlmFixtureRuntimeResult,
  VlmRuntimeArtifact,
  VlmRuntimeExecutionResult,
  VlmRuntimePreflightReport,
} from './vlm-runtime-types'

const execFileAsync = promisify(execFile)

export async function runVlmRuntimeVerification(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  localRoot?: string
}): Promise<VlmRuntimeExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 39C generated VLM runtime verification flow.')
  const runId = input.runId ?? `phase39c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const createdAt = new Date().toISOString()
  const localRoot = input.localRoot ?? path.join(vlmRuntimeConfig.localTempRoot, runId)
  const reportDir = path.join(localRoot, 'reports')
  const artifactPrefix = phase39CVlmRuntimeArtifactPrefix(runId)
  let uploadedArtifacts: VlmRuntimeArtifact[] = []
  let modelRoot: string | undefined
  let fixtureResults: VlmFixtureRuntimeResult[] = []
  let runtimeStatus: 'passed' | 'warning' | 'blocked' | 'skipped' = 'blocked'

  await rm(localRoot, { recursive: true, force: true })
  await mkdir(reportDir, { recursive: true })

  const preflight = await runVlmRuntimePreflight(runId)
  const executionBlockers = [...preflight.blockers]
  const executionWarnings = [...preflight.warnings]
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_runtime_plan.json'), buildVlmRuntimePlan(createdAt, runId))
  const fixtureManifest = buildVlmGeneratedFixtureManifest(runId, createdAt)
  const promptTemplateManifest = buildVlmPromptTemplateManifest(runId, createdAt)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_generated_fixture_manifest.json'), fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_prompt_template_manifest.json'), promptTemplateManifest)

  let assetVerification = await buildVlmModelAssetVerificationReport({
    runId,
    metadataOnlyEntries: preflight.modelObjectMetadata,
  })

  if (preflight.allowed) {
    try {
      modelRoot = await copyPhase39BVlmAssetsFromPrivateGcs({ localRoot })
      assetVerification = await buildVlmModelAssetVerificationReport({ runId, localModelRoot: modelRoot })
      if (assetVerification.status !== 'verified') {
        executionBlockers.push(...assetVerification.blockers)
      } else {
        const workerOutput = await runVlmWorker({
          runId,
          reportDir,
          fixtureDir: path.join(reportDir, 'fixtures'),
          modelRoot,
        })
        executionWarnings.push(workerOutput.stderr.slice(0, 3000))
        const runtimeResults = parseRuntimeResults(workerOutput.stdout)
        fixtureResults = runtimeResults.fixtureResults
        runtimeStatus = runtimeResults.runtimeStatus
      }
    } catch (error) {
      runtimeStatus = 'blocked'
      executionBlockers.push(`vlm_runtime_execution_failed:${String(error).slice(0, 500)}`)
    }
  }

  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_model_asset_verification.json'), assetVerification)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_runtime_results.json'), {
    phase: '39C',
    runId,
    runtimeStatus,
    fixtureResults,
    blockers: executionBlockers,
    warnings: executionWarnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_output_schema_validation_report.json'), buildSchemaValidationReport(runId, fixtureResults))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_object_region_qa_report.json'), buildObjectRegionQaReport(runId, fixtureResults))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_safe_zone_qa_report.json'), buildSafeZoneQaReport(runId, fixtureResults))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_hallucination_safety_report.json'), buildHallucinationSafetyReport(runId, fixtureResults))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_vlm_runtime_cost_memory_report.json'), buildCostMemoryReport(runId, preflight.localGpuAvailable, preflight.stagingCloudRunRequested, executionWarnings))

  let finalReport = buildVlmRuntimeExecutionReport({
    runId,
    createdAt,
    assetVerification,
    fixtureResults,
    runtimeStatus,
    blockers: executionBlockers,
    warnings: executionWarnings,
    uploadedArtifacts,
    privateArtifactPrefix: `gs://${vlmRuntimeConfig.qaBucket}/${artifactPrefix}/`,
    localGpuAvailable: preflight.localGpuAvailable,
    stagingCloudRunRequested: preflight.stagingCloudRunRequested,
  })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_generated_vlm_runtime_report.json'), finalReport)

  uploadedArtifacts = await collectVlmRuntimeArtifacts({
    rootDir: reportDir,
    bucket: vlmRuntimeConfig.qaBucket,
    objectPrefix: artifactPrefix,
  })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_private_artifact_manifest.json'), {
    phase: '39C',
    runId,
    createdAt: new Date().toISOString(),
    privateOnly: true,
    bucket: vlmRuntimeConfig.qaBucket,
    prefix: artifactPrefix,
    artifactCount: uploadedArtifacts.length,
    artifacts: uploadedArtifacts,
    blocked: {
      publicAccess: true,
      signedUrls: true,
      providerCalls: true,
      rawPrompts: true,
      realMedia: true,
      beta: true,
      production: true,
      trackA: true,
    },
    blockers: finalReport.blockers,
    warnings: finalReport.warnings,
  })
  uploadedArtifacts = await collectVlmRuntimeArtifacts({
    rootDir: reportDir,
    bucket: vlmRuntimeConfig.qaBucket,
    objectPrefix: artifactPrefix,
  })

  const uploadBlockers: string[] = []
  const uploadWarnings: string[] = []
  if (process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD === 'true') {
    const uploadResult = await uploadAndVerifyVlmRuntimeArtifacts(reportDir, uploadedArtifacts)
    uploadedArtifacts = uploadResult.artifacts
    uploadBlockers.push(...uploadResult.blockers)
    uploadWarnings.push(...uploadResult.warnings)
  } else {
    uploadBlockers.push('private_artifact_upload_confirmation_missing')
  }

  finalReport = buildVlmRuntimeExecutionReport({
    runId,
    createdAt,
    assetVerification,
    fixtureResults,
    runtimeStatus,
    blockers: [...executionBlockers, ...uploadBlockers],
    warnings: [...executionWarnings, ...uploadWarnings],
    uploadedArtifacts,
    privateArtifactPrefix: `gs://${vlmRuntimeConfig.qaBucket}/${artifactPrefix}/`,
    localGpuAvailable: preflight.localGpuAvailable,
    stagingCloudRunRequested: preflight.stagingCloudRunRequested,
  })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_generated_vlm_runtime_report.json'), finalReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39c_private_artifact_manifest.json'), {
    phase: '39C',
    runId,
    createdAt: new Date().toISOString(),
    privateOnly: true,
    bucket: vlmRuntimeConfig.qaBucket,
    prefix: artifactPrefix,
    artifactCount: uploadedArtifacts.length,
    artifacts: uploadedArtifacts,
    blockers: finalReport.blockers,
    warnings: finalReport.warnings,
  })

  const evidence: ApprovedVlmRuntimeEvidence = {
    phase: '39C',
    status: finalReport.ok ? 'verified' : 'blocked',
    runId,
    modelId: vlmRuntimeConfig.modelId,
    revision: vlmRuntimeConfig.modelRevision,
    modelGcsPath: vlmRuntimeConfig.modelGcsPath,
    aggregateSha256: vlmRuntimeConfig.aggregateSha256,
    runtime: 'vllm',
    fallbackRuntime: 'transformers_fallback',
    fixtureIds: fixtureManifest.specs.map((fixture) => fixture.fixtureId),
    artifactPrefix: `gs://${vlmRuntimeConfig.qaBucket}/${artifactPrefix}/`,
    qaReportUri: `gs://${vlmRuntimeConfig.qaBucket}/${artifactPrefix}/phase_39c_generated_vlm_runtime_report.json`,
    vlmToolFamilyBetaStatus: finalReport.vlmToolFamilyBetaStatus,
    phase39DReadiness: finalReport.phase39DReadiness,
    blockers: finalReport.blockers,
    warnings: finalReport.warnings,
  }

  if (input.keepTemp !== true) await rm(localRoot, { recursive: true, force: true })
  return {
    evidence,
    executionReport: finalReport,
    localReportPath: path.join(reportDir, 'phase_39c_generated_vlm_runtime_report.json'),
    localArtifactDir: reportDir,
    uploadedArtifacts,
  }
}

export async function runVlmRuntimePreflight(runId: string): Promise<VlmRuntimePreflightReport & {
  allowed: boolean
  modelObjectMetadata: Awaited<ReturnType<typeof describePhase39BVlmObjects>>
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeAccount = ''
  let activeProject = ''
  let privateGcsReadable = false
  let qaBucketReadable = false
  let modelObjectMetadata: Awaited<ReturnType<typeof describePhase39BVlmObjects>> = []

  try {
    const buckets = await verifyVlmRuntimeBuckets()
    activeAccount = buckets.activeAccount
    activeProject = buckets.activeProject
    privateGcsReadable = buckets.generatedBucketReachable
    qaBucketReadable = buckets.qaBucketReachable
    warnings.push(...buckets.warnings)
    if (buckets.publicIamDetected) blockers.push('phase39c_private_bucket_public_iam_detected')
  } catch (error) {
    blockers.push(`phase39c_gcloud_bucket_preflight_failed:${String(error).slice(0, 300)}`)
  }

  try {
    modelObjectMetadata = await describePhase39BVlmObjects()
    if (modelObjectMetadata.length !== vlmRuntimeConfig.selectedFileCount) blockers.push('phase39c_model_object_metadata_count_mismatch')
  } catch (error) {
    blockers.push(`phase39c_model_object_metadata_unavailable:${String(error).slice(0, 300)}`)
  }

  const envValidation = validateVlmRuntimeExecutionEnv({
    activeProject,
  })
  blockers.push(...envValidation.blockers)
  warnings.push(...envValidation.warnings)

  const localGpuAvailable = await commandSucceeds('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader'])
  const dockerAvailable = await commandSucceeds('docker', ['version', '--format', '{{.Server.Version}}'])
  const stagingCloudRunRequested = (process.env.REEDITPRO_VLM_RUNTIME_MODE ?? 'local') === 'staging_cloud_run_job'
  const stagingCloudRunAllowed = stagingCloudRunRequested
    && process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD === 'true'
    && process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH === 'true'
    && process.env.REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB === 'true'
    && process.env.REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE === 'true'

  if (!localGpuAvailable && !stagingCloudRunAllowed) {
    blockers.push('phase39c_l4_or_local_gpu_runtime_unavailable')
    warnings.push('No local NVIDIA GPU is available and the guarded staging L4 Cloud Run Job path is not fully confirmed; skipping 17.5GB model copy and vLLM startup.')
  }
  if (stagingCloudRunRequested) blockers.push('phase39c_staging_cloud_run_job_execution_not_implemented_in_local_runner')

  return {
    phase: '39C',
    runId,
    activeAccount,
    activeProject,
    localGpuAvailable,
    dockerAvailable,
    stagingCloudRunRequested,
    stagingCloudRunAllowed,
    privateGcsReadable,
    qaBucketReadable,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    allowed: blockers.length === 0,
    modelObjectMetadata,
  }
}

async function runVlmWorker(input: {
  runId: string
  reportDir: string
  fixtureDir: string
  modelRoot: string
}): Promise<{ stdout: string; stderr: string }> {
  const python = await resolvePython()
  await mkdir(input.fixtureDir, { recursive: true })
  const { stdout, stderr } = await execFileAsync(python, [
    'server/workers/vlm-runtime/run-generated-vlm-fixture.py',
    '--run-id',
    input.runId,
    '--output-dir',
    input.reportDir,
    '--fixture-dir',
    input.fixtureDir,
    '--model-dir',
    input.modelRoot,
    '--fixture-manifest-path',
    path.join(input.reportDir, 'phase_39c_generated_fixture_manifest.json'),
    '--prompt-manifest-path',
    path.join(input.reportDir, 'phase_39c_prompt_template_manifest.json'),
  ], {
    timeout: 3 * 60 * 60 * 1000,
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      HF_HOME: path.join(input.reportDir, '..', '.hf-home'),
      HUGGINGFACE_HUB_CACHE: path.join(input.reportDir, '..', '.hf-cache'),
      TRANSFORMERS_CACHE: path.join(input.reportDir, '..', '.transformers-cache'),
      VLLM_CACHE_ROOT: path.join(input.reportDir, '..', '.vllm-cache'),
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      HF_HUB_DISABLE_TELEMETRY: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      REAL_MEDIA_INPUT_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      RAW_VLM_PROMPT_ENABLED: 'false',
    },
  })
  return { stdout, stderr }
}

function parseRuntimeResults(stdout: string): {
  runtimeStatus: 'passed' | 'warning' | 'blocked'
  fixtureResults: VlmFixtureRuntimeResult[]
} {
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean)
  const jsonLine = lines.reverse().find((line) => line.startsWith('{') && line.endsWith('}'))
  if (!jsonLine) throw new Error(`VLM worker did not emit JSON summary. stdout=${stdout.slice(0, 1000)}`)
  const parsed = JSON.parse(jsonLine) as { runtimeStatus?: string; fixtureResults?: VlmFixtureRuntimeResult[] }
  return {
    runtimeStatus: parsed.runtimeStatus === 'passed' || parsed.runtimeStatus === 'warning' ? parsed.runtimeStatus : 'blocked',
    fixtureResults: parsed.fixtureResults ?? [],
  }
}

async function uploadAndVerifyVlmRuntimeArtifacts(rootDir: string, artifacts: VlmRuntimeArtifact[]): Promise<{
  artifacts: VlmRuntimeArtifact[]
  blockers: string[]
  warnings: string[]
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  const verified: VlmRuntimeArtifact[] = []
  for (const artifact of artifacts) {
    if (!artifact.localPath || !artifact.object) continue
    const relative = path.relative(rootDir, artifact.localPath)
    if (relative.startsWith('..')) {
      blockers.push(`refusing_to_upload_artifact_outside_report_dir:${artifact.localPath}`)
      continue
    }
    if (artifact.kind === 'fixture_image') {
      warnings.push(`fixture_image_not_uploaded_by_default:${artifact.id}`)
      continue
    }
    try {
      await runGcloud(['storage', 'cp', artifact.localPath, `gs://${vlmRuntimeConfig.qaBucket}/${artifact.object}`])
      const described = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', `gs://${vlmRuntimeConfig.qaBucket}/${artifact.object}`, '--format=json'])) as Record<string, unknown>
      verified.push({
        ...artifact,
        generation: typeof described.generation === 'string' ? described.generation : undefined,
        metageneration: typeof described.metageneration === 'string' ? described.metageneration : undefined,
        crc32c: typeof described.crc32c === 'string' ? described.crc32c : undefined,
        md5Hash: typeof described.md5Hash === 'string' ? described.md5Hash : undefined,
      })
    } catch (error) {
      blockers.push(`private_artifact_upload_or_verify_failed:${artifact.id}:${String(error).slice(0, 240)}`)
    }
  }
  const expectedUploaded = VLM_RUNTIME_EXPECTED_ARTIFACTS.length
  if (verified.length < expectedUploaded) blockers.push(`private_artifact_upload_incomplete:${verified.length}/${expectedUploaded}`)
  return { artifacts: verified, blockers, warnings }
}

async function commandSucceeds(command: string, args: string[]): Promise<boolean> {
  try {
    await execFileAsync(command, args, { timeout: 30 * 1000 })
    return true
  } catch {
    return false
  }
}

async function resolvePython(): Promise<string> {
  const candidates = [
    process.env.REEDITPRO_VLM_RUNTIME_PYTHON,
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

export function vlmRuntimeEvidenceToTypeScript(evidence: ApprovedVlmRuntimeEvidence): string {
  return [
    'import type { ApprovedVlmRuntimeEvidence } from \'./vlm-runtime-types\'',
    '',
    'export const approvedVlmRuntimeEvidence: ApprovedVlmRuntimeEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedVlmRuntimeEvidence(): ApprovedVlmRuntimeEvidence {',
    '  return {',
    '    ...approvedVlmRuntimeEvidence,',
    '    fixtureIds: [...approvedVlmRuntimeEvidence.fixtureIds],',
    '    phase39DReadiness: { ...approvedVlmRuntimeEvidence.phase39DReadiness },',
    '    blockers: [...approvedVlmRuntimeEvidence.blockers],',
    '    warnings: [...approvedVlmRuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
