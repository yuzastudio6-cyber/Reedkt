import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TOOL_ROUTE_DRY_RUN_REPORT_DIR,
  TOOL_ROUTE_DRY_RUN_REPORT_PATHS,
} from './tool-route-dry-run-planning-policy'
import type { ToolRouteDryRunBundle } from './tool-route-dry-run-planning-types'

async function writeJsonArtifact(relativePath: string, value: unknown): Promise<void> {
  const outputPath = path.join(TOOL_ROUTE_DRY_RUN_REPORT_DIR, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeTextArtifact(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value)
}

export async function writeToolRouteDryRunArtifacts(bundle: ToolRouteDryRunBundle): Promise<void> {
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.sourceAudit, bundle.sourceAudit)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.ownerStudyContext, bundle.ownerStudyContext)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.workerDryRunContext, bundle.workerDryRunContext)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.routeFamilyPlan, bundle.routeFamilyPlan)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.ownerRoutePlan, bundle.ownerRoutePlan)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.artifactContractMap, bundle.artifactContractMap)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.qaGateMap, bundle.qaGateMap)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.blockedExecutionValidation, bundle.blockedExecutionValidation)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.gapMap, bundle.gapMap)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.nextPhasePlan, bundle.nextPhasePlan)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.qa, bundle.qa)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.report, bundle.report)
  await writeJsonArtifact(TOOL_ROUTE_DRY_RUN_REPORT_PATHS.summary, bundle.summary)
  for (const [filePath, contents] of Object.entries(bundle.docs)) {
    await writeTextArtifact(filePath, contents)
  }
}
