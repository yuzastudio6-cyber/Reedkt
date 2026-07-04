import type {
  ProjectEditSessionCardModel,
  ProjectEditSessionFixtureBundle,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'
import {
  createMockProjectEditSessionFixtureBundle,
} from '../../lib/mock-project-edit-sessions'
import {
  createProjectEditSessionBundleSummary,
  createProjectEditSessionCardModels,
  createProjectEditSessionLatestActivitySummary,
} from '../../lib/project-edit-session-fixture-mappers'
import {
  createProjectEditSessionDebugSummary,
  createProjectEditSessionMemorySummary,
  createProjectEditSessionPreviewSummary,
  createProjectEditSessionReadableSummary,
  createProjectEditSessionRevisionSummary,
  createProjectEditSessionVersionSummary,
} from '../../lib/project-edit-session-summary-mappers'
import { MOCK_PROJECT_EDIT_SESSION_SCENARIOS } from '../mock/mock-project-edit-session-scenarios'

export type MockProjectEditSessionNextStep =
  'RP-EDITSESSION-03 — Mock Repository Layer'

export interface MockProjectEditSessionFlowResult {
  bundle: ProjectEditSessionFixtureBundle
  sessions: ProjectEditSessionRecord[]
  cardModels: ProjectEditSessionCardModel[]
  messages: ProjectEditSessionMessageRecord[]
  memories: ProjectEditSessionMemoryRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  summary: Record<string, unknown>
  warnings: string[]
  nextStep: MockProjectEditSessionNextStep
}

const NEXT_STEP: MockProjectEditSessionNextStep =
  'RP-EDITSESSION-03 — Mock Repository Layer'

function createBaseFlowResult(
  summary: Record<string, unknown>,
): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  const cardModels = createProjectEditSessionCardModels(bundle.sessions)
  const debugSummary = createProjectEditSessionDebugSummary(bundle)

  return {
    bundle,
    sessions: bundle.sessions,
    cardModels,
    messages: bundle.messages,
    memories: bundle.memories,
    versions: bundle.versions,
    previews: bundle.previews,
    revisions: bundle.revisions,
    summary: {
      scenarioCount: MOCK_PROJECT_EDIT_SESSION_SCENARIOS.length,
      bundleSummary: createProjectEditSessionBundleSummary(bundle),
      ...summary,
    },
    warnings: debugSummary.warnings,
    nextStep: NEXT_STEP,
  }
}

export function runMockProjectEditSessionFixtureFlow(): MockProjectEditSessionFlowResult {
  return createBaseFlowResult({
    flow: 'fixture',
    description: 'Loads deterministic ProjectEditSession fixture bundle.',
  })
}

export function runMockProjectEditSessionCardModelFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  const cardModels = createProjectEditSessionCardModels(bundle.sessions)
  return createBaseFlowResult({
    flow: 'card_model',
    cardModels,
    shapes: cardModels.map((card) => ({ id: card.id, shape: card.cardShape })),
  })
}

export function runMockProjectEditSessionMessageFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  return createBaseFlowResult({
    flow: 'message',
    messageCount: bundle.messages.length,
    latestActivity: bundle.sessions.map((session) =>
      createProjectEditSessionLatestActivitySummary(session, bundle.messages, bundle.events),
    ),
  })
}

export function runMockProjectEditSessionMemoryFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  return createBaseFlowResult({
    flow: 'memory',
    memorySummary: createProjectEditSessionMemorySummary(bundle.memories),
    memoryLayers: Array.from(new Set(bundle.memories.map((memory) => memory.layer))).sort(),
  })
}

export function runMockProjectEditSessionVersionPreviewFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  return createBaseFlowResult({
    flow: 'version_preview',
    versionSummary: createProjectEditSessionVersionSummary(bundle.versions),
    previewSummary: createProjectEditSessionPreviewSummary(bundle.previews),
  })
}

export function runMockProjectEditSessionRevisionFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  return createBaseFlowResult({
    flow: 'revision',
    revisionSummary: createProjectEditSessionRevisionSummary(bundle.revisions),
    revisionCount: bundle.revisions.length,
  })
}

export function runMockProjectEditSessionSummaryFlow(): MockProjectEditSessionFlowResult {
  const bundle = createMockProjectEditSessionFixtureBundle()
  return createBaseFlowResult({
    flow: 'summary',
    readable: bundle.sessions.map(createProjectEditSessionReadableSummary),
    debug: createProjectEditSessionDebugSummary(bundle),
  })
}
