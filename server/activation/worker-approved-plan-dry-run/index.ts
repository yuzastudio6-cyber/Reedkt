import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  uploadWorkerApprovedPlanDryRunPrivateArtifacts,
  writeWorkerApprovedPlanDryRunArtifacts,
} from './worker-dry-run-artifacts'
import {
  WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
  getWorkerApprovedPlanDryRunGuardBlockers,
  getWorkerApprovedPlanDryRunRunId,
} from './worker-approved-plan-dry-run-policy'
import type { WorkerDryRunArtifactUploadStatus } from './worker-approved-plan-dry-run-types'
import { buildWorkerApprovedPlanDryRunBundle } from './worker-dry-run-report-builder'

export * from './approved-plan-snapshot-dry-run-validator'
export * from './approved-plan-snapshot-loader'
export * from './worker-approved-plan-dry-run-policy'
export * from './worker-approved-plan-dry-run-types'
export * from './worker-artifact-scope-validator'
export * from './worker-blocked-route-validator'
export * from './worker-claim-lease-simulator'
export * from './worker-dry-run-artifacts'
export * from './worker-dry-run-gap-map'
export * from './worker-dry-run-next-phase-plan'
export * from './worker-dry-run-report-builder'
export * from './worker-dry-run-source-audit'
export * from './worker-event-log-plan-builder'
export * from './worker-job-plan-builder'

export async function writeWorkerApprovedPlanDryRunReport(input: {
  runId?: string
} = {}) {
  const runId = input.runId ?? getWorkerApprovedPlanDryRunRunId()
  const bundle = buildWorkerApprovedPlanDryRunBundle({
    runId,
    uploadStatus: readExistingPrivateArtifactUpload(runId),
  })
  await writeWorkerApprovedPlanDryRunArtifacts(bundle)
  return bundle
}

export async function executeWorkerApprovedPlanDryRun(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getWorkerApprovedPlanDryRunRunId()
  if (!input.execute) {
    const bundle = buildWorkerApprovedPlanDryRunBundle({ runId })
    await writeWorkerApprovedPlanDryRunArtifacts(bundle)
    return {
      exitCode: 1,
      summary: {
        ...bundle.summary,
        status: 'blocked',
        decision: 'blocked_unsafe_dry_run_scope',
        activeBlockers: ['execution_requires_explicit_execute_flag'],
      },
    }
  }

  const guardBlockers = getWorkerApprovedPlanDryRunGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildWorkerApprovedPlanDryRunBundle({ runId })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_dry_run_scope',
      activeBlockers: guardBlockers,
    }
    await writeWorkerApprovedPlanDryRunArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_dry_run_scope', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const initialBundle = buildWorkerApprovedPlanDryRunBundle({ runId })
  const initialDecision = String(initialBundle.summary.decision)
  if (initialDecision.startsWith('blocked_')) {
    await writeWorkerApprovedPlanDryRunArtifacts(initialBundle)
    return { exitCode: 1, summary: initialBundle.summary }
  }

  const uploadStatus = await uploadWorkerApprovedPlanDryRunPrivateArtifacts(initialBundle)
  const finalBundle = buildWorkerApprovedPlanDryRunBundle({ runId, uploadStatus })
  await writeWorkerApprovedPlanDryRunArtifacts(finalBundle)
  if (uploadStatus.status !== 'uploaded') {
    const summary = {
      ...finalBundle.summary,
      status: 'blocked',
      decision: 'blocked_private_artifact_upload_failed',
      activeBlockers: ['local_only_private_artifact_limitation', uploadStatus.blocker ?? 'private_artifact_upload_failed'],
    }
    await writeWorkerApprovedPlanDryRunArtifacts({
      ...finalBundle,
      summary,
      report: { ...finalBundle.report, ...summary },
      qa: { ...finalBundle.qa, status: 'blocked', decision: 'blocked_private_artifact_upload_failed', passed: false },
    })
    return { exitCode: 1, summary }
  }

  return {
    exitCode: 0,
    summary: finalBundle.summary,
  }
}

export function readWorkerApprovedPlanDryRunSummary(): Record<string, unknown> {
  const filePath = path.join(
    WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
    'summary/worker-approved-plan-dry-run-summary.json',
  )
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  }
  return buildWorkerApprovedPlanDryRunBundle({ runId: getWorkerApprovedPlanDryRunRunId() }).summary
}

function readExistingPrivateArtifactUpload(runId: string): WorkerDryRunArtifactUploadStatus | undefined {
  const filePath = path.join(
    WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
    'manifest/worker-approved-plan-dry-run-manifest.json',
  )
  if (!existsSync(filePath)) return undefined
  const manifest = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  if (manifest.runId !== runId) return undefined
  const upload = manifest.privateArtifactUpload
  if (!upload || typeof upload !== 'object' || Array.isArray(upload)) return undefined
  return upload as WorkerDryRunArtifactUploadStatus
}
