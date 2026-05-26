import type { QualityGateType, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkflowFixturePolicy, ProductionWorkflowMode, ProductionWorkflowStage } from './production-workflow-types'

export interface ProductionWorkflowScenario {
  scenarioId: string
  displayName: string
  description: string
  mode: ProductionWorkflowMode
  targetPlatform: 'tiktok' | 'reels' | 'shorts' | 'youtube' | 'podcast' | 'web'
  aspectRatio: '9:16' | '16:9' | '1:1'
  expectedStages: ProductionWorkflowStage[]
  requiredArtifacts: ToolArtifactType[]
  requiredQAGates: QualityGateType[]
  allowedLocalDevTools: Array<'ffmpeg' | 'ffprobe' | 'remotion' | 'libass'>
  expectedBlockers: string[]
  expectedWarnings: string[]
  fixturePolicy: ProductionWorkflowFixturePolicy
  finalExportExpected: boolean
  productionReadyExpected: false
  notes: string[]
}

export function defaultFixturePolicy(notes: string[] = []): ProductionWorkflowFixturePolicy {
  return {
    generatedFixtureOnly: true,
    allowLocalDevGeneratedFixture: false,
    allowUserMedia: false,
    cleanupRequired: true,
    notes,
  }
}
