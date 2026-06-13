import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TOOL_ROUTE_FIXTURE_REPORT_DIR,
  TOOL_ROUTE_FIXTURE_REPORT_PATHS,
} from './tool-route-fixture-planning-policy'
import type { ToolRouteFixturePlanningBundle } from './tool-route-fixture-planning-types'

async function writeJsonArtifact(relativePath: string, value: unknown): Promise<void> {
  const outputPath = path.join(TOOL_ROUTE_FIXTURE_REPORT_DIR, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeTextArtifact(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value)
}

export async function writeToolRouteFixtureArtifacts(
  bundle: ToolRouteFixturePlanningBundle,
): Promise<void> {
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.sourceAudit, bundle.sourceAudit)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.toolRoute1Evidence, bundle.toolRoute1Evidence)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.toolStudyEvidence, bundle.toolStudyEvidence)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.fixtureCatalog, bundle.fixtureCatalog)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.inputOutputContractMap, bundle.inputOutputContractMap)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.ownerFixtureHandoffMap, bundle.ownerFixtureHandoffMap)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.qaGateMap, bundle.qaGateMap)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.blockedExecutionValidation, bundle.blockedExecutionValidation)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.gapMap, bundle.gapMap)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.nextPhasePlan, bundle.nextPhasePlan)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.qa, bundle.qa)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.report, bundle.report)
  await writeJsonArtifact(TOOL_ROUTE_FIXTURE_REPORT_PATHS.summary, bundle.summary)
  for (const [filePath, contents] of Object.entries(bundle.docs)) {
    await writeTextArtifact(filePath, contents)
  }
}
