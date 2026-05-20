import {
  createMockDatabase,
  insertMockRecord,
  type MockDatabase,
} from '../mock/mock-database'
import {
  getDefaultMockRenderTimingManifestScenario,
  getMockRenderTimingManifestScenarioById,
  type MockRenderTimingManifestScenario,
} from '../mock/mock-render-timing-manifest-scenarios'
import {
  buildRenderTimingManifest,
  type BuildRenderTimingManifestResponse,
} from '../services/render-timing-manifest-builder-service'
import type { RenderTimingWorkerReadiness } from '../../types/storytiming'

export type MockRenderTimingManifestNextStep =
  | 'mock_preview_ready'
  | 'resolve_timing_conflicts'
  | 'await_user_review'

export interface MockRenderTimingManifestFlowInput {
  scenario?: MockRenderTimingManifestScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

export interface MockRenderTimingManifestFlowOutput extends BuildRenderTimingManifestResponse {
  nextStep: MockRenderTimingManifestNextStep
  expectedReadiness: RenderTimingWorkerReadiness
  scenario: MockRenderTimingManifestScenario
}

function resolveScenario(input: MockRenderTimingManifestFlowInput): MockRenderTimingManifestScenario {
  if (input.scenario) return input.scenario
  if (input.scenarioId) return getMockRenderTimingManifestScenarioById(input.scenarioId) ?? getDefaultMockRenderTimingManifestScenario()
  return getDefaultMockRenderTimingManifestScenario()
}

function nextStepForReadiness(readiness: RenderTimingWorkerReadiness): MockRenderTimingManifestNextStep {
  if (readiness === 'requires_user_review') return 'await_user_review'
  if (readiness === 'blocked_by_timing_conflicts' || readiness === 'blocked_by_missing_tracks' || readiness === 'blocked_by_missing_assets' || readiness === 'not_ready') {
    return 'resolve_timing_conflicts'
  }
  return 'mock_preview_ready'
}

function persistFlowOutput(
  db: MockDatabase,
  scenario: MockRenderTimingManifestScenario,
  output: BuildRenderTimingManifestResponse,
): void {
  insertMockRecord(db, 'masterTimingMaps', scenario.masterTimingMap)
  scenario.segments.forEach((segment) => insertMockRecord(db, 'storyTimingSegments', segment))
  scenario.events.forEach((event) => insertMockRecord(db, 'timingEvents', event))
  scenario.dependencies.forEach((dependency) => insertMockRecord(db, 'timingDependencies', dependency))
  scenario.conflicts.forEach((conflict) => insertMockRecord(db, 'timingConflicts', conflict))
  scenario.conflictResolutions.forEach((resolution) => insertMockRecord(db, 'timingConflictResolutions', resolution))
  scenario.qaChecks.forEach((check) => insertMockRecord(db, 'storyTimingQAChecks', check))
  if (scenario.qaReport) insertMockRecord(db, 'storyTimingQAReports', scenario.qaReport)
  insertMockRecord(db, 'renderTimingManifests', output.renderTimingManifest)
  insertMockRecord(db, 'renderTimingWorkerInputs', output.workerInput)
}

export function runMockRenderTimingManifestFlow(
  input: MockRenderTimingManifestFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockRenderTimingManifestFlowOutput {
  const scenario = resolveScenario(input)
  const result = buildRenderTimingManifest({
    masterTimingMap: scenario.masterTimingMap,
    segments: scenario.segments,
    events: scenario.events,
    dependencies: scenario.dependencies,
    conflicts: scenario.conflicts,
    conflictResolutions: scenario.conflictResolutions,
    qaReport: scenario.qaReport,
    qaChecks: scenario.qaChecks,
    requiredTrackTypes: scenario.requiredTrackTypes,
    omitTrackTypes: scenario.omitTrackTypes,
    layerOrderOverrides: scenario.layerOrderOverrides,
    requiredAssets: scenario.requiredAssets,
    missingAssets: scenario.missingAssets,
    allowMockAssetPlaceholders: scenario.allowMockAssetPlaceholders,
    workerNotes: scenario.workerNotes,
  })

  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  if (input.persistToMockDatabase) {
    persistFlowOutput(db, scenario, result.data)
  }

  return {
    ...result.data,
    nextStep: nextStepForReadiness(result.data.validation.readiness),
    expectedReadiness: scenario.expectedReadiness,
    scenario,
  }
}

export function runMockRenderManifestReadyFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'render_manifest_ready_for_mock_preview' })
}

export function runMockRenderManifestWarningFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'missing_generated_overlay_asset' })
}

export function runMockRenderManifestBlockedFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'render_manifest_blocked_by_unresolved_timing_conflicts' })
}

export function runMockLakeComoRenderManifestFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'lake_como_lifestyle_manifest' })
}

export function runMockSignatureRenderManifestFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'signature_heavy_manifest' })
}

export function runMockMissingAssetRenderManifestFlow(): MockRenderTimingManifestFlowOutput {
  return runMockRenderTimingManifestFlow({ scenarioId: 'missing_generated_overlay_asset' })
}
