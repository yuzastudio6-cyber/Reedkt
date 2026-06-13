import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { writeToolRouteFixtureArtifacts } from './tool-route-fixture-artifacts'
import {
  TOOL_ROUTE_FIXTURE_REPORT_DIR,
  getToolRouteFixtureGuardBlockers,
  getToolRouteFixtureRunId,
} from './tool-route-fixture-planning-policy'
import { buildToolRouteFixturePlanningBundle } from './tool-route-fixture-report-builder'

export * from './fixture-blocked-execution-validator'
export * from './fixture-input-output-contract-builder'
export * from './fixture-qa-gate-map-builder'
export * from './generated-local-fixture-catalog-builder'
export * from './owner-fixture-handoff-map-builder'
export * from './tool-route-1-evidence-loader'
export * from './tool-route-fixture-artifacts'
export * from './tool-route-fixture-gap-map'
export * from './tool-route-fixture-next-phase-plan'
export * from './tool-route-fixture-planning-policy'
export * from './tool-route-fixture-planning-types'
export * from './tool-route-fixture-report-builder'
export * from './tool-route-fixture-source-audit'
export * from './tool-study-fixture-evidence-loader'

function readExistingExecutionStatus(runId: string): 'not_attempted' | 'completed_local_docs_only' | undefined {
  const summaryPath = path.join(
    TOOL_ROUTE_FIXTURE_REPORT_DIR,
    'summary/tool-route-generated-local-fixture-planning-summary.json',
  )
  if (!existsSync(summaryPath)) return undefined
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  if (summary.runId !== runId) return undefined
  return summary.executionStatus === 'completed_local_docs_only'
    ? 'completed_local_docs_only'
    : 'not_attempted'
}

export async function writeToolRouteFixturePlanningReport(input: { runId?: string } = {}) {
  const runId = input.runId ?? getToolRouteFixtureRunId()
  const bundle = buildToolRouteFixturePlanningBundle({
    runId,
    executionStatus: readExistingExecutionStatus(runId),
  })
  await writeToolRouteFixtureArtifacts(bundle)
  return bundle
}

export function readToolRouteFixturePlanningSummary(): Record<string, unknown> {
  const summaryPath = path.join(
    TOOL_ROUTE_FIXTURE_REPORT_DIR,
    'summary/tool-route-generated-local-fixture-planning-summary.json',
  )
  if (existsSync(summaryPath)) {
    return JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
  }
  return buildToolRouteFixturePlanningBundle({ runId: getToolRouteFixtureRunId() }).summary
}

export async function executeToolRouteFixturePlanning(input: {
  execute: boolean
  runId?: string
}): Promise<{ exitCode: number; summary: Record<string, unknown> }> {
  const runId = input.runId ?? getToolRouteFixtureRunId()
  if (!input.execute) {
    const bundle = buildToolRouteFixturePlanningBundle({ runId, executionStatus: 'not_attempted' })
    await writeToolRouteFixtureArtifacts(bundle)
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

  const guardBlockers = getToolRouteFixtureGuardBlockers()
  if (guardBlockers.length > 0) {
    const bundle = buildToolRouteFixturePlanningBundle({ runId, executionStatus: 'not_attempted' })
    const summary = {
      ...bundle.summary,
      status: 'blocked',
      decision: 'blocked_unsafe_execution_scope',
      activeBlockers: guardBlockers,
    }
    await writeToolRouteFixtureArtifacts({
      ...bundle,
      summary,
      report: { ...bundle.report, ...summary },
      qa: { ...bundle.qa, status: 'blocked', decision: 'blocked_unsafe_execution_scope', passed: false },
    })
    return { exitCode: 1, summary }
  }

  const bundle = buildToolRouteFixturePlanningBundle({
    runId,
    executionStatus: 'completed_local_docs_only',
  })
  await writeToolRouteFixtureArtifacts(bundle)
  return {
    exitCode: bundle.activeBlockers.length > 0 ? 1 : 0,
    summary: bundle.summary,
  }
}
