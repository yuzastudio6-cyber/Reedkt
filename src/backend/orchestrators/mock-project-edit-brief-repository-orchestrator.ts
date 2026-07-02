import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefRepositoryResult,
  ProjectEditBriefRepositorySummary,
} from '../../types/project-edit-brief-repository'
import { createMockDatabase } from '../mock/mock-database'
import { MockProjectEditBriefRepository } from '../repositories/mock-project-edit-brief-repository'
import { SupabaseProjectEditBriefRepository } from '../repositories/supabase-project-edit-brief-repository'
import { MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS } from '../repositories/mock-project-edit-brief-repository-scenarios'
import {
  createProjectEditBriefBundleSummaryFromRepository,
  createProjectEditBriefRepositoryReadinessSummary,
  createProjectEditBriefRepositorySummary,
} from '../repositories/project-edit-brief-repository-summary-service'
import {
  validateProjectEditBriefBundle,
  validateProjectEditBriefRepositoryResultSafety,
} from '../repositories/project-edit-brief-repository-validation-service'
import {
  mapProjectEditBriefMarkerRecordToInsertRow,
  mapProjectEditBriefMarkerRowToRecord,
  mapProjectEditBriefRecordToInsertRow,
  mapProjectEditBriefRowToRecord,
  mapProjectEditSessionExportSettingsRecordToInsertRow,
  mapProjectEditSessionExportSettingsRowToRecord,
} from '../repositories/project-edit-brief-row-mappers'

export interface MockProjectEditBriefRepositoryOrchestratorResult {
  ok: boolean
  nextStep: 'RP-EDITBRIEF-04 — API Routes + Client Layer'
  summary: string[]
  scenarioCount: number
  repositorySummary: ProjectEditBriefRepositorySummary
  flows: {
    fixtureSeeding: ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>
    createdBrief: ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>
    timeline: ProjectEditBriefRepositoryResult<ProjectEditBriefTimelineMarkerModel[]>
    drawer: ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerDrawerModel>
    bundle: ProjectEditBriefRepositoryResult<ProjectEditBriefBundleRecord>
    exportSettings: ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>
    disabledSupabase: ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>
  }
}

export async function runMockProjectEditBriefRepositoryOrchestrator(): Promise<MockProjectEditBriefRepositoryOrchestratorResult> {
  const db = createMockDatabase()
  const repository = new MockProjectEditBriefRepository(db, {
    projectId: 'mock-project-edit-chat-foundation',
  })
  const seededBriefId = db.projectEditBriefs.find((brief) => brief.markerCount > 0)?.id ?? db.projectEditBriefs[0]?.id ?? 'missing-seeded-brief'
  const seededMarkerId = db.projectEditBriefMarkers[0]?.id ?? 'missing-seeded-marker'

  const fixtureSeeding = await repository.getEditBrief(seededBriefId)
  const createdBrief = await repository.createEditBrief({
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: 'edit-session-orchestrator-brief',
    title: 'Repository Orchestrator Brief',
    summary: 'Mock repository orchestrator creates this Edit Brief without API or UI runtime changes.',
  })
  const exportSettings = await repository.recommendExportSettings({
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: createdBrief.data?.editSessionId ?? 'edit-session-orchestrator-brief',
    platformTarget: 'instagram_reel',
  })
  const timeline = await repository.createTimelineMarkerModels(seededBriefId)
  const drawer = await repository.createMarkerDrawerModel(seededMarkerId)
  const bundle = await repository.createBriefBundle(seededBriefId)
  const disabledSupabase = await new SupabaseProjectEditBriefRepository().getEditBrief('disabled-supabase-brief')

  const rowMappingOk = Boolean(fixtureSeeding.data && mapProjectEditBriefRowToRecord(
    mapProjectEditBriefRecordToInsertRow(fixtureSeeding.data),
  ).id === fixtureSeeding.data.id)
    && Boolean(db.projectEditBriefMarkers[0] && mapProjectEditBriefMarkerRowToRecord(
      mapProjectEditBriefMarkerRecordToInsertRow(db.projectEditBriefMarkers[0]),
    ).id === db.projectEditBriefMarkers[0].id)
    && Boolean(exportSettings.data && mapProjectEditSessionExportSettingsRowToRecord(
      mapProjectEditSessionExportSettingsRecordToInsertRow(exportSettings.data),
    ).id === exportSettings.data.id)

  const validationOk = [
    fixtureSeeding,
    createdBrief,
    timeline,
    drawer,
    bundle,
    exportSettings,
    disabledSupabase,
  ].every((result) => validateProjectEditBriefRepositoryResultSafety(result as ProjectEditBriefRepositoryResult<unknown>).ok)
    && (bundle.data ? validateProjectEditBriefBundle(bundle.data).ok : false)

  const repositorySummary = createProjectEditBriefRepositorySummary(repository.context, 7)
  const summary = [
    ...createProjectEditBriefRepositoryReadinessSummary(repository.context),
    ...(bundle.data ? createProjectEditBriefBundleSummaryFromRepository(bundle.data) : []),
    `Row mapper round trips ok=${rowMappingOk}.`,
    `Repository validation ok=${validationOk}.`,
    `Scenario count=${MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.length}.`,
  ]

  return {
    ok: Boolean(fixtureSeeding.ok && createdBrief.ok && timeline.ok && drawer.ok && bundle.ok && exportSettings.ok && !disabledSupabase.ok && rowMappingOk && validationOk),
    nextStep: 'RP-EDITBRIEF-04 — API Routes + Client Layer',
    summary,
    scenarioCount: MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.length,
    repositorySummary,
    flows: {
      fixtureSeeding,
      createdBrief,
      timeline,
      drawer,
      bundle,
      exportSettings,
      disabledSupabase,
    },
  }
}
