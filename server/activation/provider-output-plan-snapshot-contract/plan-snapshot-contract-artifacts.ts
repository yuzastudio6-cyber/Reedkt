import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_GENERATED_BUCKET,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_OBJECT_PREFIX,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_QA_BUCKET,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
  getProviderOutputPlanSnapshotGeneratedPrefix,
  getProviderOutputPlanSnapshotQaPrefix,
} from './provider-output-plan-snapshot-policy'
import type { ProviderOutputPlanSnapshotReportBundle } from './provider-output-plan-snapshot-types'

const execFileAsync = promisify(execFile)

export async function writeProviderOutputPlanSnapshotContractArtifacts(
  bundle: ProviderOutputPlanSnapshotReportBundle,
): Promise<void> {
  const reportDir = PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/repo-ownership-audit.json'), bundle.sourceAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'evidence/provider-output-evidence-context.json'), bundle.evidenceContext)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plans/candidate-approved-plan-snapshot.json'), bundle.candidateSnapshot)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'validation/plan-snapshot-schema-validation.json'), bundle.schemaValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'validation/execution-block-validation.json'), bundle.executionBlockValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'routing/owner-route-map.json'), bundle.ownerRouteMap)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'handoff/worker-runtime-handoff.json'), bundle.workerRuntimeHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'handoff/owner-review-handoff.json'), bundle.ownerReviewHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'manifest/provider-output-plan-snapshot-contract-manifest.json'), bundle.manifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qa/provider-output-plan-snapshot-contract-qa.json'), bundle.qa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'reports/provider-output-plan-snapshot-contract-report.json'), bundle.report)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'summary/provider-output-plan-snapshot-contract-summary.json'), bundle.summary)
  await writeProviderOutputPlanSnapshotDocs(bundle)
}

export async function uploadProviderOutputPlanSnapshotPrivateArtifacts(
  bundle: ProviderOutputPlanSnapshotReportBundle,
): Promise<Record<string, unknown>> {
  const runId = String(bundle.report.runId)
  const objectPrefix = `${PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_OBJECT_PREFIX}/${runId}`
  const generatedArtifacts = [
    { object: 'audit/repo-ownership-audit.json', value: bundle.sourceAudit },
    { object: 'evidence/provider-output-evidence-context.json', value: bundle.evidenceContext },
    { object: 'plans/candidate-approved-plan-snapshot.json', value: bundle.candidateSnapshot },
    { object: 'validation/plan-snapshot-schema-validation.json', value: bundle.schemaValidation },
    { object: 'validation/execution-block-validation.json', value: bundle.executionBlockValidation },
    { object: 'routing/owner-route-map.json', value: bundle.ownerRouteMap },
    { object: 'handoff/worker-runtime-handoff.json', value: bundle.workerRuntimeHandoff },
    { object: 'handoff/owner-review-handoff.json', value: bundle.ownerReviewHandoff },
    { object: 'manifest/provider-output-plan-snapshot-contract-manifest.json', value: bundle.manifest },
  ]
  const qaArtifacts = [
    { object: 'qa/provider-output-plan-snapshot-contract-qa.json', value: bundle.qa },
    { object: 'reports/provider-output-plan-snapshot-contract-report.json', value: bundle.report },
  ]

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-plansnapshot1-'))
  const uploaded: Array<Record<string, unknown>> = []
  try {
    for (const artifact of generatedArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_GENERATED_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    for (const artifact of qaArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        PROVIDER_OUTPUT_PLAN_SNAPSHOT_PRIVATE_QA_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    return {
      status: 'uploaded',
      generatedPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(runId),
      qaPrefix: getProviderOutputPlanSnapshotQaPrefix(runId),
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawPromptPayloadsStored: false,
      rawProviderResponsesStored: false,
      secretPayloadsStored: false,
    }
  } catch (error) {
    return {
      status: 'blocked_private_artifact_upload_failed',
      generatedPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(runId),
      qaPrefix: getProviderOutputPlanSnapshotQaPrefix(runId),
      blocker: error instanceof Error ? error.message : 'private_artifact_upload_failed',
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawPromptPayloadsStored: false,
      rawProviderResponsesStored: false,
      secretPayloadsStored: false,
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

async function uploadJsonArtifact(
  tmpDir: string,
  bucket: string,
  objectPrefix: string,
  object: string,
  value: unknown,
) {
  const localPath = path.join(tmpDir, object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const destination = `gs://${bucket}/${objectPrefix}/${object}`
  await execFileAsync('gcloud', ['storage', 'cp', '--quiet', localPath, destination], {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env },
  })
  return {
    bucket,
    object: `${objectPrefix}/${object}`,
    gcsUri: destination,
    private: true,
  }
}

async function writeProviderOutputPlanSnapshotDocs(
  bundle: ProviderOutputPlanSnapshotReportBundle,
): Promise<void> {
  const runId = String(bundle.report.runId)
  const decision = String(bundle.report.decision)
  const status = String(bundle.report.status)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration/provider-output-plan-snapshot-contract-policy.md', `# Provider Output Plan Snapshot Contract Policy

PLAN-SNAPSHOT-1 converts committed MODEL-DRYRUN-1 sanitized provider outputs into candidate-only approved-plan snapshot evidence.

Source run: \`${bundle.evidenceContext.sourceProviderRunId}\`

Source decision: \`${bundle.evidenceContext.sourceDecision}\`

Allowed input: committed sanitized JSON reports from PR #331 only.

Blocked inputs and actions: Qwen calls, DeepSeek calls, provider calls, tools, workers, routes, media, browser, map, web, SQL, migrations, schema/RLS changes, Docker, Cloud Run, production, external beta, public artifacts, signed URLs, raw prompts, raw provider responses, and secret payloads.

The candidate snapshot has \`executionStatus: "candidate_only"\` and \`approvedForRuntime: false\`. Worker Runtime receives a review handoff only.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration/provider-output-plan-snapshot-contract-runbook.md', `# Provider Output Plan Snapshot Contract Runbook

Use \`npm run activation:provider-output-plan-snapshot-contract:report\` for local report generation.

Guarded execution requires \`--execute\`, \`GCP_PROJECT_ID=reeditpro\`, \`GCP_REGION=us-central1\`, \`REEDITPRO_ENV=staging\`, and \`REEDITPRO_CONFIRM_PROVIDER_OUTPUT_PLAN_SNAPSHOT_CONTRACT=true\`.

Guarded execution uploads private JSON only to the PLAN-SNAPSHOT-1 generated and QA GCS prefixes. It does not call providers, execute runtime paths, write Supabase rows, run SQL, deploy migrations, or create public artifacts.
`)

  await writeVlmRuntimeTextArtifact('docs/activation-phase-provider-output-plan-snapshot-contract-results.md', `# PLAN-SNAPSHOT-1 Provider Output To Approved-Plan Snapshot Contract Results

Status: \`${status}\`

Decision: \`${decision}\`

Run ID: \`${runId}\`

Branch: \`codex/rp-plan-snapshot-1-provider-output-contract\`

Base: \`codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run\`

PR title: \`[plan] Provider output approved-plan snapshot contract\`

## Source Evidence

MODEL-DRYRUN-1 run: \`${bundle.evidenceContext.sourceProviderRunId}\`

MODEL-DRYRUN-1 decision: \`${bundle.evidenceContext.sourceDecision}\`

Qwen schema: \`${bundle.evidenceContext.qwen?.schemaId ?? 'missing'}\`

DeepSeek schema: \`${bundle.evidenceContext.deepseek?.schemaId ?? 'missing'}\`

Raw provider responses, raw prompt payloads, and secret payloads stored: \`false\`

## Candidate Snapshot

Candidate plan ID: \`${bundle.candidateSnapshot.planId}\`

Execution status: \`${bundle.candidateSnapshot.executionStatus}\`

Approved for runtime: \`false\`

Selected intents: \`${bundle.candidateSnapshot.selectedIntents.length}\`

Implementation proposal refs: \`${bundle.candidateSnapshot.implementationProposalRefs.length}\`

Owner routes: \`${bundle.candidateSnapshot.ownerRoutes.length}\`

## Validation

Schema validation: \`${bundle.schemaValidation.status}\`

Execution block validation: \`${bundle.executionBlockValidation.status}\`

Worker Runtime handoff: \`${bundle.workerRuntimeHandoff.status}\`

QA: \`${bundle.qa.status}\`

## Artifacts

Generated prefix:

\`${bundle.candidateSnapshot.artifactPolicy.privateGeneratedPrefix}\`

QA prefix:

\`${bundle.candidateSnapshot.artifactPolicy.privateQaPrefix}\`

Private artifact upload status: \`${String(bundle.manifest.privateArtifactUpload && (bundle.manifest.privateArtifactUpload as Record<string, unknown>).status)}\`

## Supabase

Supabase milestone sync: \`${bundle.candidateSnapshot.supabaseMilestoneSyncPolicy.status}\`

Supabase update required: \`no\`

Supabase environment touched: \`none\`

SQL executed: \`none\`

Migration deployed: \`no\`

## Safety

Qwen/DeepSeek/provider calls executed: \`false\`

Tools/workers/routes/runtime executed: \`false\`

Media/browser/map/web executed: \`false\`

Public artifacts or signed URLs: \`false\`

Production/external beta/broad media: \`false\`

## Next Step

Worker Runtime may review the candidate-only contract. The snapshot is not runtime approved and cannot be used to dispatch workers or reserve/spend credits.
`)
}
