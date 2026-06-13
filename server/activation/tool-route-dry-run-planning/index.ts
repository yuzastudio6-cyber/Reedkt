import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { writeToolRouteDryRunArtifacts } from './tool-route-dry-run-artifacts'
import {
  TOOL_ROUTE_DRY_RUN_REPORT_DIR,
  getToolRouteDryRunGuardBlockers,
  getToolRouteDryRunRunId,
} from './tool-route-dry-run-planning-policy'
import { buildToolRouteDryRunBundle } from './tool-route-dry-run-report-builder'

export * from './tool-route-artifact-contract-map-builder'
export * from './tool-route-blocked-execution-validator'
export * from './tool-route-dry-run-artifacts'
export * from './tool-route-dry-run-gap-map'
export * from './tool-route-dry-run-next-phase-plan'
export * from './tool-route-dry-run-planning-policy'
export * from './tool-route-dry-run-planning-types'
export * from './tool-route-dry-run-report-builder'
export * from './tool-route-dry-run-source-audit'
export * from './tool-route-family-dry-run-builder'
export * from './tool-route-owner-route-builder'
export * from './tool-route-owner-study-loader'
export * from './tool-route-qa-gate-map-builder'
export * from './tool-route-worker-dry-run-loader'

function readExistingExecutionStatus(runId: string): 'not_attempted' | 'completed_local_docs_only' | undefined {
  const summaryPath = path.join(
    TOOL_ROUTE_DRY_RUN_REPORT_DIR,
    'summary/tool-route-dry-run-planning-summary.json',
  )
  if (!existsSync(summaryPath)) return undefined
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  if (summary.runId !== runId) return undefined
  return summary.executionStatus === 'completed_local_docs_only'
    ? 'completed_local_docs_only'
    : 'not_attempted'
}

export async function writeToolRouteDryRunReport(input: { runId?: string } = {}) {
  const runId = input.runId ?? getToolRouteDryRunRunId()
  const bundle = buildToolRouteDryRunBundle({
    runId,
    executionStatus: readExistingExecutionStatus(runId),
  })
  await writeToolRouteDryRunArtifacts(bundle)
  return bundle
}

export function readToolRouteDryRunSummary(): Record<string, unknown> {
  const summaryPath = path.join(
    TOOL_ROUTE_DRY_RUN_REPORT_DIR,
    'summary/tool-route-dry-run-planning-summary.json',
  )
  if (existsSync(summaryPath)) {
    return JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  }
  return buildToolRouteDryRunBundle({ runId: getToolRouteDryRunRunId() }).summary
}

export async function executeToolRouteDryRun(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getToolRouteDryRunRunId()
  if (!input.execute) {
    const bundle = buildToolRouteDryRunBundle({ runId, executionStatus: 'not_attempted' })
    await writeToolRouteDryRunArtifacts(bundle)
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

  const guardBlockers = getToolRouteDryRunGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildToolRouteDryRunBundle({ runId, executionStatus: 'not_attempted' })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_execution_scope',
      activeBlockers: guardBlockers,
    }
    await writeToolRouteDryRunArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_execution_scope', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const bundle = buildToolRouteDryRunBundle({ runId, executionStatus: 'completed_local_docs_only' })
  await writeToolRouteDryRunArtifacts(bundle)
  return {
    exitCode: bundle.activeBlockers.length > 0 ? 1 : 0,
    summary: bundle.summary,
  }
}
