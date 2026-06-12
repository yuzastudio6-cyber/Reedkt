import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  uploadWorkerRuntimeJobsAuditPrivateArtifacts,
  writeWorkerRuntimeJobsAuditArtifacts,
} from './worker-runtime-audit-artifacts'
import {
  WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
  getWorkerRuntimeJobsAuditGuardBlockers,
  getWorkerRuntimeJobsAuditRunId,
} from './worker-runtime-audit-policy'
import type { WorkerRuntimeArtifactUploadStatus } from './worker-runtime-audit-types'
import { buildWorkerRuntimeJobsAuditBundle } from './worker-runtime-audit-report-builder'

export * from './approved-plan-intake-audit'
export * from './worker-artifact-scope-audit'
export * from './worker-claim-lease-audit'
export * from './worker-event-log-audit'
export * from './worker-runtime-audit-artifacts'
export * from './worker-runtime-audit-policy'
export * from './worker-runtime-audit-report-builder'
export * from './worker-runtime-audit-types'
export * from './worker-runtime-gap-map'
export * from './worker-runtime-next-phase-plan'
export * from './worker-runtime-source-audit'
export * from './worker-schema-audit'

export async function writeWorkerRuntimeJobsAuditReport(input: {
  runId?: string
} = {}) {
  const runId = input.runId ?? getWorkerRuntimeJobsAuditRunId()
  const bundle = buildWorkerRuntimeJobsAuditBundle({
    runId,
    uploadStatus: readExistingPrivateArtifactUpload(runId),
  })
  await writeWorkerRuntimeJobsAuditArtifacts(bundle)
  return bundle
}

export async function executeWorkerRuntimeJobsAudit(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getWorkerRuntimeJobsAuditRunId()
  if (!input.execute) {
    const bundle = buildWorkerRuntimeJobsAuditBundle({ runId })
    await writeWorkerRuntimeJobsAuditArtifacts(bundle)
    return {
      exitCode: 1,
      summary: {
        ...bundle.summary,
        status: 'blocked',
        decision: 'blocked_unsafe_runtime_execution_flags',
        activeBlockers: ['execution_requires_explicit_execute_flag'],
      },
    }
  }

  const guardBlockers = getWorkerRuntimeJobsAuditGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildWorkerRuntimeJobsAuditBundle({ runId })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_runtime_execution_flags',
      activeBlockers: guardBlockers,
    }
    await writeWorkerRuntimeJobsAuditArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_runtime_execution_flags', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const initialBundle = buildWorkerRuntimeJobsAuditBundle({ runId })
  const initialDecision = String(initialBundle.summary.decision)
  if (initialDecision.startsWith('blocked_')) {
    await writeWorkerRuntimeJobsAuditArtifacts(initialBundle)
    return { exitCode: 1, summary: initialBundle.summary }
  }

  const uploadStatus = await uploadWorkerRuntimeJobsAuditPrivateArtifacts(initialBundle)
  const finalBundle = buildWorkerRuntimeJobsAuditBundle({ runId, uploadStatus })
  await writeWorkerRuntimeJobsAuditArtifacts(finalBundle)
  if (uploadStatus.status !== 'uploaded') {
    const summary = {
      ...finalBundle.summary,
      status: 'blocked',
      decision: 'blocked_private_artifact_upload_failed',
      activeBlockers: ['local_only_private_artifact_limitation', uploadStatus.blocker ?? 'private_artifact_upload_failed'],
    }
    await writeWorkerRuntimeJobsAuditArtifacts({
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

export function readWorkerRuntimeJobsAuditSummary(): Record<string, unknown> {
  const filePath = path.join(
    WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
    'summary/worker-runtime-jobs-audit-summary.json',
  )
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  }
  return buildWorkerRuntimeJobsAuditBundle({ runId: getWorkerRuntimeJobsAuditRunId() }).summary
}

function readExistingPrivateArtifactUpload(runId: string): WorkerRuntimeArtifactUploadStatus | undefined {
  const filePath = path.join(
    WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
    'manifest/worker-runtime-jobs-audit-manifest.json',
  )
  if (!existsSync(filePath)) return undefined
  const manifest = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  if (manifest.runId !== runId) return undefined
  const upload = manifest.privateArtifactUpload
  if (!upload || typeof upload !== 'object' || Array.isArray(upload)) return undefined
  return upload as WorkerRuntimeArtifactUploadStatus
}
