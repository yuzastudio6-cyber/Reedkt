import {
  audioNoiseMusicOverlapScenario,
  finalRenderExportScenario,
  lowQualityEnhancementScenario,
  mixedColorMulticlipScenario,
  podcastRepeatedTakesScenario,
  productionBlockedReadinessScenario,
  screenRecordingCaptionSafeScenario,
  talkingHeadCleanEditScenario,
  textBehindSubjectScenario,
} from './scenarios'
import type { ProductionWorkflowScenario } from './production-workflow-scenario-types'

export const productionWorkflowScenarios: ProductionWorkflowScenario[] = [
  talkingHeadCleanEditScenario,
  podcastRepeatedTakesScenario,
  screenRecordingCaptionSafeScenario,
  textBehindSubjectScenario,
  lowQualityEnhancementScenario,
  mixedColorMulticlipScenario,
  audioNoiseMusicOverlapScenario,
  finalRenderExportScenario,
  productionBlockedReadinessScenario,
]

export function getProductionWorkflowScenario(scenarioId: string): ProductionWorkflowScenario {
  const scenario = productionWorkflowScenarios.find((item) => item.scenarioId === scenarioId)
  if (!scenario) throw new Error(`Unknown production E2E workflow scenario: ${scenarioId}`)
  return scenario
}
