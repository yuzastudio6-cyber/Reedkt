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
  WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_GENERATED_BUCKET,
  WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_OBJECT_PREFIX,
  WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_QA_BUCKET,
  WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
  getWorkerRuntimeJobsAuditGeneratedPrefix,
  getWorkerRuntimeJobsAuditQaPrefix,
} from './worker-runtime-audit-policy'
import type {
  WorkerRuntimeArtifactUploadStatus,
  WorkerRuntimeJobsAuditReportBundle,
} from './worker-runtime-audit-types'

const execFileAsync = promisify(execFile)

export async function writeWorkerRuntimeJobsAuditArtifacts(
  bundle: WorkerRuntimeJobsAuditReportBundle,
): Promise<void> {
  const reportDir = WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/repo-ownership-audit.json'), bundle.sourceAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/worker-schema-audit.json'), bundle.workerSchemaAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/approved-plan-intake-audit.json'), bundle.approvedPlanIntakeAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/worker-claim-lease-audit.json'), bundle.workerClaimLeaseAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/worker-artifact-scope-audit.json'), bundle.workerArtifactScopeAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'audit/worker-event-log-audit.json'), bundle.workerEventLogAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'gaps/worker-runtime-gap-map.json'), bundle.gapMap)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'roadmap/worker-runtime-next-phase-plan.json'), bundle.nextPhasePlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'manifest/worker-runtime-jobs-audit-manifest.json'), bundle.manifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qa/worker-runtime-jobs-audit-qa.json'), bundle.qa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'reports/worker-runtime-jobs-audit-report.json'), bundle.report)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'summary/worker-runtime-jobs-audit-summary.json'), bundle.summary)
  await writeWorkerRuntimeJobsAuditDocs(bundle)
}

export async function uploadWorkerRuntimeJobsAuditPrivateArtifacts(
  bundle: WorkerRuntimeJobsAuditReportBundle,
): Promise<WorkerRuntimeArtifactUploadStatus> {
  const runId = String(bundle.report.runId)
  const objectPrefix = `${WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_OBJECT_PREFIX}/${runId}`
  const generatedArtifacts = [
    { object: 'audit/repo-ownership-audit.json', value: bundle.sourceAudit },
    { object: 'audit/worker-schema-audit.json', value: bundle.workerSchemaAudit },
    { object: 'audit/approved-plan-intake-audit.json', value: bundle.approvedPlanIntakeAudit },
    { object: 'audit/worker-claim-lease-audit.json', value: bundle.workerClaimLeaseAudit },
    { object: 'audit/worker-artifact-scope-audit.json', value: bundle.workerArtifactScopeAudit },
    { object: 'audit/worker-event-log-audit.json', value: bundle.workerEventLogAudit },
    { object: 'gaps/worker-runtime-gap-map.json', value: bundle.gapMap },
    { object: 'roadmap/worker-runtime-next-phase-plan.json', value: bundle.nextPhasePlan },
    { object: 'manifest/worker-runtime-jobs-audit-manifest.json', value: bundle.manifest },
  ]
  const qaArtifacts = [
    { object: 'qa/worker-runtime-jobs-audit-qa.json', value: bundle.qa },
    { object: 'reports/worker-runtime-jobs-audit-report.json', value: bundle.report },
  ]
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-worker0-'))
  const uploaded: Array<Record<string, unknown>> = []
  try {
    for (const artifact of generatedArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_GENERATED_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    for (const artifact of qaArtifacts) {
      uploaded.push(await uploadJsonArtifact(
        tmpDir,
        WORKER_RUNTIME_JOBS_AUDIT_PRIVATE_QA_BUCKET,
        objectPrefix,
        artifact.object,
        artifact.value,
      ))
    }
    return {
      status: 'uploaded',
      generatedPrefix: getWorkerRuntimeJobsAuditGeneratedPrefix(runId),
      qaPrefix: getWorkerRuntimeJobsAuditQaPrefix(runId),
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
      generatedPrefix: getWorkerRuntimeJobsAuditGeneratedPrefix(runId),
      qaPrefix: getWorkerRuntimeJobsAuditQaPrefix(runId),
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

async function writeWorkerRuntimeJobsAuditDocs(
  bundle: WorkerRuntimeJobsAuditReportBundle,
): Promise<void> {
  const runId = String(bundle.report.runId)
  const status = String(bundle.report.status)
  const decision = String(bundle.report.decision)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-runtime-jobs-repo-audit.md', `# Worker Runtime Jobs Repo Audit

WORKER-0 audits the Worker Runtime Jobs source surface against PLAN-SNAPSHOT-1 candidate evidence.

Status: \`${status}\`

Decision: \`${decision}\`

Run ID: \`${runId}\`

Source evidence: PR #334, run \`${bundle.sourceAudit.sourceRunId}\`, decision \`${bundle.sourceAudit.sourceDecision}\`.

This phase is repo-audit-only. It does not execute workers, tools, providers, routes, runtime paths, SQL, migrations, schema/RLS changes, media, browser/map/web workflows, production, external beta, public artifacts, signed URLs, raw prompts, or Supabase product-row writes.

WORKER-1 readiness: \`${bundle.nextPhasePlan.readiness}\`.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/approved-plan-snapshot-intake-audit.md', `# Approved-Plan Snapshot Intake Audit

PLAN-SNAPSHOT-1 candidate plan: \`${bundle.sourceAudit.candidatePlanId}\`

Execution status: \`${bundle.sourceAudit.planSnapshotExecutionStatus}\`

Approved for runtime: \`false\`

Intake status: \`${bundle.approvedPlanIntakeAudit.status}\`

The candidate contract is compatible for review-only Worker Runtime planning. It is not approved for runtime, worker dispatch, credit reservation/spend, route execution, provider execution, tool execution, media processing, public artifact delivery, or signed URL source-of-truth usage.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-claim-lease-gap-map.md', `# Worker Claim Lease Gap Map

Claim/lease audit status: \`${bundle.workerClaimLeaseAudit.status}\`

Claim execution status: \`${bundle.workerClaimLeaseAudit.claimExecutionStatus}\`

Transaction/RPC race-window TODOs present: \`${bundle.workerClaimLeaseAudit.transactionRpcRaceWindowTodosPresent}\`

Future real-runtime blockers:

${bundle.workerClaimLeaseAudit.futureRuntimeBlockers.map((item) => `- \`${item}\``).join('\n')}

WORKER-1 may simulate claim, lease, heartbeat, and event states as local/private JSON evidence only. Real service-role worker claims remain blocked until a later approved transactional backend runtime.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-artifact-scope-policy.md', `# Worker Artifact Scope Policy

WORKER-0 artifact scope status: \`${bundle.workerArtifactScopeAudit.status}\`

Private GCS refs only: \`${bundle.workerArtifactScopeAudit.privateGcsRefsOnly}\`

Public artifacts allowed: \`false\`

Signed URLs source of truth: \`false\`

Generated prefix:

\`${bundle.manifest.generatedArtifactPrefix}\`

QA prefix:

\`${bundle.manifest.qaArtifactPrefix}\`

Worker Runtime evidence must use private \`gs://\` refs and sanitized JSON. Signed URLs may not become source of truth, and public artifacts are not allowed in WORKER-0 or WORKER-1 dry-run scope.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime/worker-runtime-next-phase-plan.md', `# Worker Runtime Next Phase Plan

Next phase: \`${bundle.nextPhasePlan.phase}\` - ${bundle.nextPhasePlan.title}

Readiness: \`${bundle.nextPhasePlan.readiness}\`

Allowed in WORKER-1:

${bundle.nextPhasePlan.allowedActions.map((item) => `- \`${item}\``).join('\n')}

Blocked in WORKER-1:

${bundle.nextPhasePlan.blockedActions.map((item) => `- \`${item}\``).join('\n')}

Real runtime execution requires a superseding approval: \`${bundle.nextPhasePlan.supersedingApprovalRequiredForRealRuntime}\`
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-worker-1-approved-plan-snapshot-dry-run.md', `# WORKER-1 Approved-Plan Snapshot Dry-Run Prompt

Implement WORKER-1 as a non-executing approved-plan snapshot worker dry-run based on WORKER-0 run \`${runId}\` and PLAN-SNAPSHOT-1 run \`${bundle.sourceAudit.sourceRunId}\`.

Use only committed candidate-only plan snapshot evidence. Build local/private JSON artifacts for simulated worker job payloads, claim/lease transitions, heartbeat checks, dependency readiness, event-log entries, private artifact references, and owner handoffs.

Do not execute workers, tools, routes, providers, model calls, media processing, browser/map/web workflows, SQL, migrations, schema/RLS changes, Supabase product-row writes, Docker/Cloud Run, production, external beta, public artifacts, signed URLs, raw prompts, or raw provider responses.

WORKER-1 success requires all simulations to remain review-only and to keep future real-runtime blockers visible.
`)

  await writeVlmRuntimeTextArtifact('docs/activation-phase-worker-0-worker-runtime-jobs-audit-results.md', `# WORKER-0 Worker Runtime Jobs Repo Audit Results

Status: \`${status}\`

Decision: \`${decision}\`

Run ID: \`${runId}\`

Branch: \`codex/rp-worker-0-worker-runtime-jobs-repo-audit\`

Base: \`codex/rp-plan-snapshot-1-provider-output-contract\`

PR title: \`[worker] Worker Runtime Jobs repo audit\`

## Source Evidence

PLAN-SNAPSHOT-1 PR: \`#334\`

PLAN-SNAPSHOT-1 run: \`${bundle.sourceAudit.sourceRunId}\`

PLAN-SNAPSHOT-1 decision: \`${bundle.sourceAudit.sourceDecision}\`

Candidate plan ID: \`${bundle.sourceAudit.candidatePlanId}\`

Execution status: \`${bundle.sourceAudit.planSnapshotExecutionStatus}\`

Approved for runtime: \`false\`

## Worker Schema

Schema audit: \`${bundle.workerSchemaAudit.status}\`

Tables present: \`${bundle.workerSchemaAudit.requiredTables.filter((item) => item.status === 'present').length}\`

Functions present: \`${bundle.workerSchemaAudit.requiredFunctions.filter((item) => item.status === 'present').length}\`

Readiness: \`${bundle.workerSchemaAudit.workerSchemaReadiness}\`

## Claim And Lease

Claim/lease audit: \`${bundle.workerClaimLeaseAudit.status}\`

Claim execution status: \`${bundle.workerClaimLeaseAudit.claimExecutionStatus}\`

Transaction/RPC race-window TODOs present: \`${bundle.workerClaimLeaseAudit.transactionRpcRaceWindowTodosPresent}\`

## Artifact Scope

Artifact scope audit: \`${bundle.workerArtifactScopeAudit.status}\`

Private GCS refs only: \`${bundle.workerArtifactScopeAudit.privateGcsRefsOnly}\`

Public artifacts: \`false\`

Signed URLs source of truth: \`false\`

## Event Log

Event log audit: \`${bundle.workerEventLogAudit.status}\`

Event log readiness: \`${bundle.workerEventLogAudit.eventLogReadiness}\`

## WORKER-1 Readiness

WORKER-1 readiness: \`${bundle.nextPhasePlan.readiness}\`

Gap count: \`${bundle.gapMap.gaps.length}\`

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

Next Supabase action: \`none in WORKER-0\`

## Safety

Worker/tool/provider/runtime execution: \`false\`

Media/browser/map/web execution: \`false\`

SQL/migrations/schema/RLS changes: \`false\`

Supabase product-row writes: \`false\`

Production/external beta/broad media: \`false\`

Public artifacts or signed URLs: \`false\`

Raw prompts or raw provider responses: \`false\`

## Active Blockers

${bundle.report.activeBlockers && Array.isArray(bundle.report.activeBlockers) && bundle.report.activeBlockers.length > 0
    ? bundle.report.activeBlockers.map((item) => `- \`${String(item)}\``).join('\n')
    : '- None for WORKER-0 repo audit.'}
`)
}
