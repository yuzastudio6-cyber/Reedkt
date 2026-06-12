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
  WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_GENERATED_BUCKET,
  WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_OBJECT_PREFIX,
  WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_QA_BUCKET,
  WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
  getWorkerApprovedPlanDryRunGeneratedPrefix,
  getWorkerApprovedPlanDryRunQaPrefix,
} from './worker-approved-plan-dry-run-policy'
import type {
  WorkerApprovedPlanDryRunReportBundle,
  WorkerDryRunArtifactUploadStatus,
} from './worker-approved-plan-dry-run-types'

const execFileAsync = promisify(execFile)

export async function writeWorkerApprovedPlanDryRunArtifacts(
  bundle: WorkerApprovedPlanDryRunReportBundle,
): Promise<void> {
  const reportDir = WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/repo-ownership-audit.json'), bundle.sourceAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'evidence/plan-snapshot-evidence-context.json'), bundle.evidenceContext)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'dry-run/worker-job-batch-plan.json'), bundle.jobBatchPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'dry-run/worker-job-dependency-plan.json'), bundle.dependencyPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'dry-run/simulated-claim-lease-result.json'), bundle.simulatedClaimLeaseResult)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'validation/artifact-scope-validation.json'), bundle.artifactScopeValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'validation/blocked-route-validation.json'), bundle.blockedRouteValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'event-log/worker-event-log-plan.json'), bundle.eventLogPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'gaps/worker-dry-run-gap-map.json'), bundle.gapMap)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'roadmap/worker-dry-run-next-phase-plan.json'), bundle.nextPhasePlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'manifest/worker-approved-plan-dry-run-manifest.json'), bundle.manifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qa/worker-approved-plan-dry-run-qa.json'), bundle.qa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'reports/worker-approved-plan-dry-run-report.json'), bundle.report)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'summary/worker-approved-plan-dry-run-summary.json'), bundle.summary)
  await writeWorkerApprovedPlanDryRunDocs(bundle)
}

export async function uploadWorkerApprovedPlanDryRunPrivateArtifacts(
  bundle: WorkerApprovedPlanDryRunReportBundle,
): Promise<WorkerDryRunArtifactUploadStatus> {
  const runId = String(bundle.report.runId)
  const objectPrefix = `${WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${runId}`
  const generatedArtifacts = [
    { object: 'audit/repo-ownership-audit.json', value: bundle.sourceAudit },
    { object: 'evidence/plan-snapshot-evidence-context.json', value: bundle.evidenceContext },
    { object: 'dry-run/worker-job-batch-plan.json', value: bundle.jobBatchPlan },
    { object: 'dry-run/worker-job-dependency-plan.json', value: bundle.dependencyPlan },
    { object: 'dry-run/simulated-claim-lease-result.json', value: bundle.simulatedClaimLeaseResult },
    { object: 'validation/artifact-scope-validation.json', value: bundle.artifactScopeValidation },
    { object: 'validation/blocked-route-validation.json', value: bundle.blockedRouteValidation },
    { object: 'event-log/worker-event-log-plan.json', value: bundle.eventLogPlan },
    { object: 'gaps/worker-dry-run-gap-map.json', value: bundle.gapMap },
    { object: 'roadmap/worker-dry-run-next-phase-plan.json', value: bundle.nextPhasePlan },
    { object: 'manifest/worker-approved-plan-dry-run-manifest.json', value: bundle.manifest },
  ]
  const qaArtifacts = [
    { object: 'qa/worker-approved-plan-dry-run-qa.json', value: bundle.qa },
    { object: 'reports/worker-approved-plan-dry-run-report.json', value: bundle.report },
  ]
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-worker1-'))
  const uploaded: Array<Record<string, unknown>> = []
  try {
    for (const artifact of generatedArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_GENERATED_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    for (const artifact of qaArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        WORKER_APPROVED_PLAN_DRY_RUN_PRIVATE_QA_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    return {
      status: 'uploaded',
      generatedPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(runId),
      qaPrefix: getWorkerApprovedPlanDryRunQaPrefix(runId),
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
      generatedPrefix: getWorkerApprovedPlanDryRunGeneratedPrefix(runId),
      qaPrefix: getWorkerApprovedPlanDryRunQaPrefix(runId),
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

async function writeWorkerApprovedPlanDryRunDocs(
  bundle: WorkerApprovedPlanDryRunReportBundle,
): Promise<void> {
  const runId = String(bundle.report.runId)
  const status = String(bundle.report.status)
  const decision = String(bundle.report.decision)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/approved-plan-snapshot-dry-run.md', `# Approved-Plan Snapshot Dry-Run

WORKER-1 consumes PLAN-SNAPSHOT-1 candidate evidence and WORKER-0 repo-audit evidence to produce a non-executing Worker Runtime dry-run.

Status: \`${status}\`

Decision: \`${decision}\`

Run ID: \`${runId}\`

Candidate plan: \`${bundle.evidenceContext.candidatePlanId}\`

Approved for runtime: \`false\`

Worker execution: \`false\`
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-job-plan-dry-run.md', `# Worker Job Plan Dry-Run

Batch ID: \`${bundle.jobBatchPlan.batchId}\`

Source plan ID: \`${bundle.jobBatchPlan.sourcePlanId}\`

Jobs: \`${bundle.jobBatchPlan.jobs.length}\`

Dependencies: \`${bundle.jobBatchPlan.dependencies.length}\`

Dry-run only: \`true\`

Worker/tool/provider/route execution: \`false\`
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-claim-lease-dry-run.md', `# Worker Claim Lease Dry-Run

Claim attempted against DB: \`false\`

Simulated claim: \`true\`

Lease duration recommendation: \`${bundle.simulatedClaimLeaseResult.leaseDurationRecommendation}\`

Heartbeat recommendation: \`${bundle.simulatedClaimLeaseResult.heartbeatRecommendation}\`

Transactional RPC required: \`${bundle.simulatedClaimLeaseResult.transactionalRpcRequired}\`

Real runtime blocker: \`${bundle.simulatedClaimLeaseResult.blockerForRealRuntime}\`
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-dry-run-gap-map.md', `# Worker Dry-Run Gap Map

Status: \`${bundle.gapMap.status}\`

TOOL-ROUTE-0 readiness: \`${bundle.gapMap.toolRoute0Readiness}\`

Gaps:

${bundle.gapMap.gaps.map((gap) => `- \`${gap.id}\`: ${gap.description}`).join('\n')}
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-dry-run-next-phase-plan.md', `# Worker Dry-Run Next Phase Plan

Next phase: \`${bundle.nextPhasePlan.phase}\` - ${bundle.nextPhasePlan.title}

Readiness: \`${bundle.nextPhasePlan.readiness}\`

Allowed:

${bundle.nextPhasePlan.allowedActions.map((item) => `- \`${item}\``).join('\n')}

Blocked:

${bundle.nextPhasePlan.blockedActions.map((item) => `- \`${item}\``).join('\n')}
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-tool-route-0-execution-unlock-audit.md', `# TOOL-ROUTE-0 Execution Unlock Audit Prompt

Use WORKER-1 run \`${runId}\` and candidate plan \`${bundle.evidenceContext.candidatePlanId}\` to audit how approved worker dry-run plans map to tool routes.

Inspect the tool capability registry and TOOL-STUDY-0 outputs if present. Produce a route unlock gap map and require owner acceptance for each route family.

Do not execute routes, tools, workers, providers, media processing, browser capture, map rendering, web search, SQL, migrations, schema/RLS changes, Supabase product-row writes, public artifacts, signed URLs, raw prompts, production, external beta, or paid production.
`)

  await writeVlmRuntimeTextArtifact('docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md', `# WORKER-1 Approved-Plan Snapshot Dry-Run Results

Status: \`${status}\`

Decision: \`${decision}\`

Run ID: \`${runId}\`

Branch: \`codex/rp-worker-1-approved-plan-snapshot-dry-run\`

Base: \`codex/rp-worker-0-worker-runtime-jobs-repo-audit\`

PR title: \`[worker] Approved plan snapshot dry run\`

## Source Evidence

WORKER-0 run: \`${bundle.sourceAudit.worker0.runId}\`

WORKER-0 decision: \`${bundle.sourceAudit.worker0.decision}\`

PLAN-SNAPSHOT-1 run: \`${bundle.sourceAudit.planSnapshot1.runId}\`

Candidate plan ID: \`${bundle.evidenceContext.candidatePlanId}\`

MODEL-DRYRUN-1 run: \`${bundle.sourceAudit.modelDryRun1.runId}\`

## Dry-Run Job Batch Plan

Batch ID: \`${bundle.jobBatchPlan.batchId}\`

Jobs: \`${bundle.jobBatchPlan.jobs.length}\`

Dependencies: \`${bundle.jobBatchPlan.dependencies.length}\`

Dry-run only: \`true\`

Approved for runtime: \`false\`

## Simulated Claim Lease

Claim attempted: \`false\`

Simulated claim: \`true\`

Lease duration recommendation: \`${bundle.simulatedClaimLeaseResult.leaseDurationRecommendation}\`

Heartbeat recommendation: \`${bundle.simulatedClaimLeaseResult.heartbeatRecommendation}\`

Real runtime blocker: \`${bundle.simulatedClaimLeaseResult.blockerForRealRuntime}\`

## Artifact Scope Validation

Status: \`${bundle.artifactScopeValidation.status}\`

Private gs:// prefixes only: \`${bundle.artifactScopeValidation.privateGsPrefixesOnly}\`

Public artifacts: \`false\`

Signed URLs source of truth: \`false\`

## Blocked Route Validation

Status: \`${bundle.blockedRouteValidation.status}\`

Blocked route count: \`${bundle.blockedRouteValidation.blockedRoutes.length}\`

All execution blocked: \`${bundle.blockedRouteValidation.allExecutionBlocked}\`

## Event Log Plan

Status: \`${bundle.eventLogPlan.status}\`

Events: \`${bundle.eventLogPlan.eventLogPlan.length}\`

Persist to database: \`false\`

## TOOL-ROUTE-0 Readiness

\`${bundle.nextPhasePlan.readiness}\`

## Artifacts

Generated prefix:

\`${bundle.manifest.generatedArtifactPrefix}\`

QA prefix:

\`${bundle.manifest.qaArtifactPrefix}\`

Private artifact upload status: \`${bundle.manifest.privateArtifactUpload.status}\`

## QA

QA status: \`${bundle.qa.status}\`

QA passed: \`${bundle.qa.passed}\`

## Supabase

Supabase milestone sync: \`${bundle.manifest.supabaseMilestoneSync.status}\`

Supabase update required: \`docs/status only\`

Supabase update status: \`docs_only\`

Supabase environment touched: \`none\`

SQL executed: \`none\`

Migration deployed: \`no\`

Next Supabase action: \`none in WORKER-1\`

## Safety

Worker/tool/provider/runtime execution: \`false\`

Media/browser/map/web execution: \`false\`

SQL/migrations/schema/RLS changes: \`false\`

Supabase product-row writes: \`false\`

Production/external beta/paid production/broad media: \`false\`

Public artifacts or signed URLs: \`false\`

Raw prompts or raw provider responses: \`false\`

## Active Blockers

${bundle.report.activeBlockers && Array.isArray(bundle.report.activeBlockers) && bundle.report.activeBlockers.length > 0
    ? bundle.report.activeBlockers.map((item) => `- \`${String(item)}\``).join('\n')
    : '- None for WORKER-1 dry-run.'}
`)
}
