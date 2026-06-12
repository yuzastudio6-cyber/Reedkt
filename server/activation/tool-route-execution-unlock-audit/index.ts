import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { writeToolRouteAuditArtifacts } from './tool-route-audit-artifacts'
import {
  TOOL_ROUTE_AUDIT_REPORT_DIR,
  getToolRouteAuditGuardBlockers,
  getToolRouteAuditRunId,
} from './tool-route-audit-policy'
import { buildToolRouteAuditBundle } from './tool-route-audit-report-builder'

export * from './tool-route-audit-artifacts'
export * from './tool-route-audit-policy'
export * from './tool-route-audit-report-builder'
export * from './tool-route-audit-types'
export * from './tool-route-blocked-use-register'
export * from './tool-route-family-map'
export * from './tool-route-gap-map'
export * from './tool-route-next-phase-plan'
export * from './tool-route-owner-prompt-builder'
export * from './tool-route-source-audit'
export * from './tool-study-prerequisite-map'
export * from './worker-dry-run-route-resolver'

function readExistingExecutionStatus(runId: string): 'not_attempted' | 'completed_local_docs_only' | undefined {
  const summaryPath = path.join(
    TOOL_ROUTE_AUDIT_REPORT_DIR,
    'summary/tool-route-execution-unlock-audit-summary.json',
  )
  if (!existsSync(summaryPath)) return undefined
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  if (summary.runId !== runId) return undefined
  return summary.executionStatus === 'completed_local_docs_only'
    ? 'completed_local_docs_only'
    : 'not_attempted'
}

export async function writeToolRouteAuditReport(input: { runId?: string } = {}) {
  const runId = input.runId ?? getToolRouteAuditRunId()
  const bundle = buildToolRouteAuditBundle({
    runId,
    executionStatus: readExistingExecutionStatus(runId),
  })
  await writeToolRouteAuditArtifacts(bundle)
  return bundle
}

export function readToolRouteAuditSummary(): Record<string, unknown> {
  const summaryPath = path.join(
    TOOL_ROUTE_AUDIT_REPORT_DIR,
    'summary/tool-route-execution-unlock-audit-summary.json',
  )
  if (existsSync(summaryPath)) {
    return JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  }
  return buildToolRouteAuditBundle({ runId: getToolRouteAuditRunId() }).summary
}

export async function executeToolRouteAudit(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getToolRouteAuditRunId()
  if (!input.execute) {
    const bundle = buildToolRouteAuditBundle({ runId, executionStatus: 'not_attempted' })
    await writeToolRouteAuditArtifacts(bundle)
    return {
      exitCode: 1,
      summary: {
        ...bundle.summary,
        status: 'blocked',
        decision: 'blocked_unsafe_execution_scope',
        activeBlockers: ['execution_requires_explicit_execute_flag'],
      },
    }
  }

  const guardBlockers = getToolRouteAuditGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildToolRouteAuditBundle({ runId, executionStatus: 'not_attempted' })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_execution_scope',
      activeBlockers: guardBlockers,
    }
    await writeToolRouteAuditArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_execution_scope', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const bundle = buildToolRouteAuditBundle({ runId, executionStatus: 'completed_local_docs_only' })
  await writeToolRouteAuditArtifacts(bundle)
  return {
    exitCode: bundle.activeBlockers.length > 0 ? 1 : 0,
    summary: bundle.summary,
  }
}
