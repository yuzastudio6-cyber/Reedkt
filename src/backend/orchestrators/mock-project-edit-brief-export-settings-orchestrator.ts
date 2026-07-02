import {
  createProjectEditBriefExportSettingsRecommendation,
} from '../project-edit-brief-export-settings/project-edit-brief-export-settings-recommendation-service'
import {
  validateProjectEditBriefExportSettingsRecord,
} from '../project-edit-brief-export-settings/project-edit-brief-export-settings-validation-service'
import {
  createProjectEditBriefExportSettingsReadableSummary,
  createProjectEditBriefExportSettingsReadinessSummary,
} from '../project-edit-brief-export-settings/project-edit-brief-export-settings-summary-service'
import {
  listMockProjectEditBriefExportSettingsScenarios,
} from '../project-edit-brief-export-settings/mock-project-edit-brief-export-settings-scenarios'
import type { ProjectEditBriefExportSettingsOrchestratorResult } from '../../types/project-edit-brief-export-settings'

export function runMockProjectEditBriefExportSettingsRecommendationFlow(): ProjectEditBriefExportSettingsOrchestratorResult {
  const recommendation = createProjectEditBriefExportSettingsRecommendation({
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: 'edit-session-youtube-wide',
    platformTarget: 'youtube_standard',
    aspectRatio: '16:9',
  })
  const validation = validateProjectEditBriefExportSettingsRecord(recommendation.exportSettings)
  return {
    ok: validation.ok,
    scenarioCount: listMockProjectEditBriefExportSettingsScenarios().length,
    recommendation,
    validation,
    readableSummary: createProjectEditBriefExportSettingsReadableSummary(recommendation.exportSettings),
    readinessSummary: createProjectEditBriefExportSettingsReadinessSummary(validation),
    nextStep: 'RP-EDITBRIEF-10 — Marker QA + Conflict Detection',
    mockOnly: true,
    providerCallMade: false,
    modelCallMade: false,
    supabaseReadMade: false,
    supabaseWriteMade: false,
    storageReadMade: false,
    storageWriteMade: false,
    signedUrlCreated: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    exportJobCreated: false,
    creditReservedOrSpent: false,
  }
}
