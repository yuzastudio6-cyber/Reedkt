import { ProductionWorkflowArtifactStore } from './production-workflow-artifact-store'
import { buildProductionWorkflowFixture } from './production-workflow-fixture-builder'
import { buildProductionWorkflowReport } from './production-workflow-report-builder'
import { runProductionWorkflowStage } from './production-workflow-stage-runner'
import type { ProductionWorkflowScenario } from './production-workflow-scenario-types'
import type { ProductionWorkflowMode, ProductionWorkflowReport, ProductionWorkflowStageResult } from './production-workflow-types'
import { workflowNow } from './production-workflow-types'

export interface RunProductionWorkflowInput {
  scenario: ProductionWorkflowScenario
  mode?: ProductionWorkflowMode
  revideoRequested?: boolean
  signedUrlDetected?: boolean
  rawPromptDetected?: boolean
}

export async function runProductionWorkflowScenario(input: RunProductionWorkflowInput): Promise<ProductionWorkflowReport> {
  const mode = input.mode ?? input.scenario.mode
  const startedAt = workflowNow()
  const fixture = buildProductionWorkflowFixture(input.scenario)
  const artifactStore = new ProductionWorkflowArtifactStore()
  const stageResults: ProductionWorkflowStageResult[] = []

  for (const stage of input.scenario.expectedStages) {
    const stageResult = await runProductionWorkflowStage(stage, {
      scenario: input.scenario,
      fixture,
      artifactStore,
      mode,
    })
    stageResults.push(stageResult)
  }

  return buildProductionWorkflowReport({
    scenario: input.scenario,
    mode,
    startedAt,
    artifactStore,
    stageResults,
    revideoRequested: input.revideoRequested,
    signedUrlDetected: input.signedUrlDetected,
    rawPromptDetected: input.rawPromptDetected,
  })
}
