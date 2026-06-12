import { execFile } from 'node:child_process'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { writeVlmRuntimeJsonArtifact, writeVlmRuntimeTextArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  MODEL_PROVIDER_DRY_RUN_DOC_RESULTS_PATH,
  MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
  MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
  MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
  MODEL_PROVIDER_DRY_RUN_IMPLEMENTATION_PROMPT_PATH,
  MODEL_PROVIDER_DRY_RUN_REPORT_DIR,
} from './model-provider-dry-run-policy'
import type { ModelProviderDryRunReports } from './model-provider-dry-run-types'

const execFileAsync = promisify(execFile)

export const MODEL_PROVIDER_DRY_RUN_LOCAL_ARTIFACT_ROOT = '.local-artifacts/activation-model-provider-dry-run'

function reportEntries(reports: ModelProviderDryRunReports): Array<{ fileName: string; value: Record<string, unknown> }> {
  return [
    { fileName: 'model_provider_dry_run_source_audit.json', value: reports.sourceAudit },
    { fileName: 'model_provider_dry_run_policy.json', value: reports.policy },
    { fileName: 'model_provider_dry_run_synthetic_cases.json', value: reports.syntheticCases },
    { fileName: 'model_provider_dry_run_request_redaction.json', value: reports.requestRedaction },
    { fileName: 'model_provider_dry_run_secret_resolution.json', value: reports.secretResolution },
    { fileName: 'model_provider_dry_run_provider_results.json', value: reports.providerResults },
    { fileName: 'model_provider_dry_run_normalized_responses.json', value: reports.normalizedResponses },
    { fileName: 'model_provider_dry_run_schema_validation.json', value: reports.schemaValidation },
    { fileName: 'model_provider_dry_run_response_redaction.json', value: reports.responseRedaction },
    { fileName: 'model_provider_dry_run_cost_usage.json', value: reports.costUsage },
    { fileName: 'model_provider_dry_run_fail_closed.json', value: reports.failClosed },
    { fileName: 'model_provider_dry_run_artifact_manifest.json', value: reports.artifactManifest },
    { fileName: 'model_provider_dry_run_supabase_milestone_sync.json', value: reports.supabaseMilestoneSync },
    { fileName: 'model_provider_dry_run_qa_summary.json', value: reports.qaSummary },
    { fileName: 'model_provider_dry_run_readiness_report.json', value: reports.readinessReport },
  ]
}

export async function writeModelProviderDryRunReports(reports: ModelProviderDryRunReports): Promise<void> {
  for (const entry of reportEntries(reports)) {
    await writeVlmRuntimeJsonArtifact(path.join(MODEL_PROVIDER_DRY_RUN_REPORT_DIR, entry.fileName), entry.value)
  }
}

export async function writeModelProviderDryRunDocs(input: {
  resultsDoc: string
  runbookDoc: string
  policyDoc: string
  qaDoc: string
  implementationPromptDoc: string
}): Promise<void> {
  await writeVlmRuntimeTextArtifact(MODEL_PROVIDER_DRY_RUN_DOC_RESULTS_PATH, input.resultsDoc)
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-runbook.md', input.runbookDoc)
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-policy.md', input.policyDoc)
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-qa-policy.md', input.qaDoc)
  await writeVlmRuntimeTextArtifact(MODEL_PROVIDER_DRY_RUN_IMPLEMENTATION_PROMPT_PATH, input.implementationPromptDoc)
}

export async function writeModelProviderDryRunLocalArtifacts(input: {
  runId: string
  reports: ModelProviderDryRunReports
}): Promise<{ status: 'passed' | 'blocked'; localArtifactDir: string; blocker?: string }> {
  const localArtifactDir = path.join(MODEL_PROVIDER_DRY_RUN_LOCAL_ARTIFACT_ROOT, input.runId)
  try {
    await mkdir(localArtifactDir, { recursive: true })
    for (const entry of reportEntries(input.reports)) {
      await writeFile(path.join(localArtifactDir, entry.fileName), `${JSON.stringify(entry.value, null, 2)}\n`, 'utf8')
    }
    return { status: 'passed', localArtifactDir }
  } catch (error) {
    return {
      status: 'blocked',
      localArtifactDir,
      blocker: `local_private_artifact_write_failed:${error instanceof Error ? error.name : 'unknown_error'}`,
    }
  }
}

export async function uploadModelProviderDryRunLocalArtifacts(input: {
  runId: string
  localArtifactDir: string
}): Promise<{ status: 'passed' | 'blocked'; uploadedPrefixes: string[]; blocker?: string }> {
  const generatedTarget = `${MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX}/${input.runId}/reports`
  const qaTarget = `${MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX}/${input.runId}/reports`
  try {
    await execFileAsync('gcloud', ['storage', 'cp', '--recursive', input.localArtifactDir, generatedTarget], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    })
    await execFileAsync('gcloud', ['storage', 'cp', '--recursive', input.localArtifactDir, qaTarget], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    })
    return { status: 'passed', uploadedPrefixes: [generatedTarget, qaTarget] }
  } catch (error) {
    return {
      status: 'blocked',
      uploadedPrefixes: [],
      blocker: `private_artifact_gcs_upload_failed:${error instanceof Error ? error.name : 'unknown_error'}`,
    }
  }
}

export function buildInitialArtifactManifest(runId: string, execute: boolean) {
  return {
    phase: 'MODEL_DRYRUN_1',
    runId,
    status: execute ? 'pending' : 'skipped',
    privateArtifactsRequiredInExecuteMode: true,
    committedReports: MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    localPrivateArtifactRoot: execute ? MODEL_PROVIDER_DRY_RUN_LOCAL_ARTIFACT_ROOT : null,
    generatedAssetsPrefix: MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
    qaArtifactsPrefix: MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
    rawProviderResponsesCommitted: false,
    secretPayloadsCommitted: false,
    publicArtifactsCreated: false,
    blocker: execute ? null : 'report_only_private_artifact_upload_not_attempted',
  }
}

export function buildCompletedArtifactManifest(input: {
  runId: string
  localStatus: 'passed' | 'blocked'
  uploadStatus: 'passed' | 'blocked' | 'skipped'
  localArtifactDir?: string
  uploadedPrefixes?: string[]
  blockers: string[]
}) {
  return {
    phase: 'MODEL_DRYRUN_1',
    runId: input.runId,
    status: input.localStatus === 'passed' && input.uploadStatus === 'passed' ? 'passed' : 'blocked',
    privateArtifactsRequiredInExecuteMode: true,
    committedReports: MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    localPrivateArtifactDir: input.localArtifactDir,
    uploadedPrefixes: input.uploadedPrefixes ?? [],
    generatedAssetsPrefix: MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
    qaArtifactsPrefix: MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
    rawProviderResponsesCommitted: false,
    secretPayloadsCommitted: false,
    publicArtifactsCreated: false,
    blockers: input.blockers,
  }
}

export async function collectReportFileSummaries() {
  const files = await collectFiles(MODEL_PROVIDER_DRY_RUN_REPORT_DIR)
  return Promise.all(files.map(async (filePath) => {
    const fileStat = await stat(filePath)
    return {
      path: filePath,
      sizeBytes: fileStat.size,
      lineCount: (await readFile(filePath, 'utf8')).split('\n').length - 1,
    }
  }))
}

async function collectFiles(root: string, prefix = ''): Promise<string[]> {
  const dir = path.join(root, prefix)
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(root, relative)
    if (entry.isDirectory()) files.push(...await collectFiles(root, relative))
    else files.push(absolute)
  }
  return files.sort()
}
