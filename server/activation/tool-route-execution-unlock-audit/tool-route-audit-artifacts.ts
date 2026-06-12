import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TOOL_ROUTE_AUDIT_REPORT_DIR,
  TOOL_ROUTE_AUDIT_REPORT_PATHS,
} from './tool-route-audit-policy'
import type { ToolRouteAuditBundle } from './tool-route-audit-types'

async function writeJsonArtifact(relativePath: string, value: unknown): Promise<void> {
  const outputPath = path.join(TOOL_ROUTE_AUDIT_REPORT_DIR, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeTextArtifact(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value)
}

export async function writeToolRouteAuditArtifacts(bundle: ToolRouteAuditBundle): Promise<void> {
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.sourceAudit, bundle.sourceAudit)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.routeResolution, bundle.routeResolution)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.familyMap, bundle.familyMap)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.prerequisiteMap, bundle.prerequisiteMap)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.blockedUseRegister, bundle.blockedUseRegister)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.ownerPromptMap, bundle.ownerPromptMap)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.gapMap, bundle.gapMap)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.nextPhasePlan, bundle.nextPhasePlan)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.qa, bundle.qa)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.report, bundle.report)
  await writeJsonArtifact(TOOL_ROUTE_AUDIT_REPORT_PATHS.summary, bundle.summary)
  for (const [filePath, contents] of Object.entries(bundle.docs)) {
    await writeTextArtifact(filePath, contents)
  }
}
