import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildToolCapabilityRegistrySummary, toolCapabilityRecords } from './canonical-tool-capability-records'
import { buildToolCapabilityRegistryCommandPlan } from './tool-capability-registry-command-plan'
import { buildToolCapabilityRegistryIamPlan } from './tool-capability-registry-iam-plan'
import { buildToolCapabilityRegistryQaSummary } from './tool-capability-registry-qa-summary'
import { validateToolCapabilityRegistry } from './tool-capability-registry-validator'
import type { ToolCapabilityRegistryExecutionReport, ToolCapabilityRegistryReport } from './tool-capability-registry-types'

export const TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'tool-capability-registry-audit',
  'phase52b',
  'job-execution',
  'phase52b-report.json',
)

export function buildToolCapabilityRegistryReport(): ToolCapabilityRegistryReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-52b-tool-capability-registry-audit',
      createdAt: new Date().toISOString(),
      phase: '52B',
      status: executionReport.ok ? 'completed' : 'blocked',
      registry: executionReport.registry,
      registrySummary: executionReport.registrySummary,
      validation: executionReport.validation,
      qa: executionReport.qa,
      commandPlan: executionReport.commandPlan,
      iamPlan: executionReport.iamPlan,
      executionReport,
      phase52CReadiness: executionReport.phase52CReadiness,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const validation = validateToolCapabilityRegistry(toolCapabilityRecords)
  const qa = buildToolCapabilityRegistryQaSummary({
    packageScripts: readToolCapabilityRegistryPackageScripts(),
    validation,
    executionMode: false,
  })
  return {
    reportId: 'activation-phase-52b-tool-capability-registry-audit',
    createdAt: new Date().toISOString(),
    phase: '52B',
    status: 'planned',
    registry: toolCapabilityRecords,
    registrySummary: buildToolCapabilityRegistrySummary(toolCapabilityRecords),
    validation,
    qa,
    commandPlan: buildToolCapabilityRegistryCommandPlan(),
    iamPlan: buildToolCapabilityRegistryIamPlan(),
    phase52CReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeToolCapabilityRegistryReport(report: ToolCapabilityRegistryReport): string {
  const lines = [
    `Phase ${report.phase} tool capability registry audit`,
    `Status: ${report.status}`,
    `Records: ${report.registrySummary.totalRecords}`,
    `Track A: ${report.registrySummary.byTrack.track_a_visual_video}`,
    `Web search: ${report.registrySummary.byTrack.web_search}`,
    `Map/geospatial: ${report.registrySummary.byTrack.map_geospatial}`,
    `Supabase: ${report.registrySummary.byTrack.supabase}`,
    `AI Tools placeholders: ${report.registrySummary.byTrack.ai_tools}`,
    `Track B placeholders/status: ${report.registrySummary.byTrack.track_b}`,
    `QA: ${report.qa.status}`,
    `Phase52C readiness: ${report.phase52CReadiness}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Supabase sync: ${report.executionReport.supabaseSyncResult.status}`)
    lines.push(`Tool capability readback: ${report.executionReport.supabaseSyncResult.toolCapabilityReadbackCount}/${report.executionReport.supabaseSyncResult.toolCapabilityReadbackExpected}`)
  }
  if (report.blockers.length) lines.push(`Blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readToolCapabilityRegistryPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

function readLatestExecutionReport(): ToolCapabilityRegistryExecutionReport | undefined {
  if (!existsSync(TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(TOOL_CAPABILITY_REGISTRY_LOCAL_REPORT_PATH, 'utf8')) as ToolCapabilityRegistryExecutionReport
  } catch {
    return undefined
  }
}
