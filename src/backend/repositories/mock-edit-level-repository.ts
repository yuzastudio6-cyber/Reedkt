import type {
  CreateEditLevelReadinessRepositoryInput,
  CreateEditLevelRecommendationRepositoryInput,
  CreateEditLevelSummaryRepositoryInput,
  EditLevelApplicationLogRecord,
  EditLevelProfileCatalogRecord,
  EditLevelReadinessRecord,
  EditLevelRecommendationRecord,
  EditLevelRepository,
  EditLevelSelectionRecord,
  GetEditLevelRecommendationRepositoryInput,
  GetEditLevelRepositoryProfileInput,
  GetEditLevelSelectionRepositoryInput,
  ListEditLevelApplicationLogsRepositoryInput,
  ListEditLevelRecommendationsRepositoryInput,
  NormalizeEditLevelRepositoryInput,
  SaveEditLevelSelectionRepositoryInput,
  UpdateEditLevelSelectionRepositoryInput,
} from '../../types'
import {
  createEditLevelEstimateProfile,
  createEditLevelFallbackPolicy,
  createEditLevelQAProfileDefinition,
  createEditLevelToolRoutingProfile,
  createEditLevelUICardModels,
} from '../../lib/edit-level-profile-mappers'
import { createMockEditLevelRecommendation } from '../../lib/edit-level-recommendation-fixtures'
import {
  createEditLevelEstimateSummary,
  createEditLevelFallbackSummary,
  createEditLevelQAProfileSummary,
  createEditLevelQwenRoutingSummary,
  createEditLevelToolRoutingSummary,
} from '../../lib/edit-level-summary-mappers'
import { normalizeEditLevelInput } from '../../lib/edit-level-compatibility-mappers'
import { EDIT_LEVEL_PROFILES, listEditLevelProfiles, getEditLevelProfile } from '../../lib/mock-edit-level-profiles'
import {
  createEditLevelRepositoryFailure,
  createEditLevelRepositorySideEffectFlags,
  createEditLevelRepositorySuccess,
} from './edit-level-repository'
import { createEditLevelRepositorySummary } from './edit-level-repository-summary-service'
import { createMockDatabase, createMockId, insertMockRecord, nowIso, type MockDatabase } from '../mock/mock-database'

export function seedMockEditLevelProfileCatalog(db: MockDatabase): void {
  if (db.editLevelProfileCatalog.length > 0) return

  for (const profile of EDIT_LEVEL_PROFILES) {
    db.editLevelProfileCatalog.push({
      id: `mock-edit-level-profile-${profile.level}`,
      level: profile.level,
      displayName: profile.displayName,
      profile,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      mockOnly: true,
    })
  }
}

function filterByProjectAndSession<TRecord extends { projectId?: string; sessionId?: string }>(
  records: TRecord[],
  input?: { projectId?: string; sessionId?: string },
): TRecord[] {
  return records.filter((record) => {
    if (input?.projectId && record.projectId !== input.projectId) return false
    if (input?.sessionId && record.sessionId !== input.sessionId) return false
    return true
  })
}

function findProfileRecord(db: MockDatabase, input: GetEditLevelRepositoryProfileInput): EditLevelProfileCatalogRecord | undefined {
  return db.editLevelProfileCatalog.find((record) => record.level === input.level)
}

export function createMockEditLevelRepository(db: MockDatabase = createMockDatabase()): EditLevelRepository {
  seedMockEditLevelProfileCatalog(db)

  return {
    mode: 'mock_local',

    listProfiles: () => createEditLevelRepositorySuccess('mock_local', listEditLevelProfiles()),

    getProfile: (input) => {
      const record = findProfileRecord(db, input)
      const profile = record?.profile ?? getEditLevelProfile(input.level)
      return createEditLevelRepositorySuccess('mock_local', {
        profile,
        found: Boolean(profile),
      })
    },

    normalizeInput: (input: NormalizeEditLevelRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', normalizeEditLevelInput(input.input)),

    createUICards: (input = {}) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelUICardModels(input.recommendedLevel)),

    createRecommendation: (input: CreateEditLevelRecommendationRepositoryInput) => {
      const recommendation = createMockEditLevelRecommendation(input.input)
      const record: EditLevelRecommendationRecord = {
        id: createMockId('edit-level-recommendation'),
        projectId: input.projectId,
        sessionId: input.sessionId,
        input: input.input,
        recommendation,
        createdAt: nowIso(),
        mockOnly: true,
      }
      insertMockRecord(db, 'editLevelRecommendations', record)
      return createEditLevelRepositorySuccess('mock_local', record)
    },

    getRecommendation: (input: GetEditLevelRecommendationRepositoryInput) =>
      createEditLevelRepositorySuccess(
        'mock_local',
        db.editLevelRecommendations.find((record) => record.id === input.id),
      ),

    listRecommendations: (input?: ListEditLevelRecommendationsRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', filterByProjectAndSession(db.editLevelRecommendations, input)),

    saveSelection: (input: SaveEditLevelSelectionRepositoryInput) => {
      const normalization = normalizeEditLevelInput(input.input)
      if (!normalization.ok || !normalization.canonicalLevel) {
        return createEditLevelRepositoryFailure<EditLevelSelectionRecord>(
          'mock_local',
          `Cannot save unsupported edit level input "${input.input.value}".`,
          normalization.notes,
        )
      }

      const record: EditLevelSelectionRecord = {
        id: createMockId('edit-level-selection'),
        projectId: input.projectId,
        sessionId: input.sessionId,
        userId: input.userId,
        selectedLevel: normalization.canonicalLevel,
        inputSource: input.input.inputSource,
        inputValue: input.input.value,
        normalization,
        recommendationId: input.recommendationId,
        lockedForRuntime: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        mockOnly: true,
      }
      insertMockRecord(db, 'editLevelSelections', record)
      return createEditLevelRepositorySuccess('mock_local', record)
    },

    getSelection: (input: GetEditLevelSelectionRepositoryInput) =>
      createEditLevelRepositorySuccess(
        'mock_local',
        db.editLevelSelections.find((record) => record.id === input.id),
      ),

    updateSelection: (input: UpdateEditLevelSelectionRepositoryInput) => {
      const existing = db.editLevelSelections.find((record) => record.id === input.id)
      if (!existing) {
        return createEditLevelRepositoryFailure<EditLevelSelectionRecord>(
          'mock_local',
          `Edit level selection ${input.id} was not found.`,
        )
      }

      const normalization = normalizeEditLevelInput(input.input)
      if (!normalization.ok || !normalization.canonicalLevel) {
        return createEditLevelRepositoryFailure<EditLevelSelectionRecord>(
          'mock_local',
          `Cannot update selection with unsupported edit level input "${input.input.value}".`,
          normalization.notes,
        )
      }

      existing.selectedLevel = normalization.canonicalLevel
      existing.inputSource = input.input.inputSource
      existing.inputValue = input.input.value
      existing.normalization = normalization
      existing.recommendationId = input.recommendationId ?? existing.recommendationId
      existing.updatedAt = nowIso()
      return createEditLevelRepositorySuccess('mock_local', existing)
    },

    clearSelection: (input) => {
      const before = db.editLevelSelections.length
      db.editLevelSelections = db.editLevelSelections.filter((record) => record.id !== input.id)
      return createEditLevelRepositorySuccess('mock_local', {
        cleared: db.editLevelSelections.length < before,
        id: input.id,
      })
    },

    createToolRoutingSummary: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelToolRoutingSummary(input.level)),

    createQwenRoutingSummary: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelQwenRoutingSummary(input.level)),

    createQAProfileSummary: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelQAProfileSummary(input.level)),

    createEstimateSummary: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelEstimateSummary(input.level)),

    createFallbackSummary: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelFallbackSummary(input.level)),

    createToolRoutingProfile: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelToolRoutingProfile(input.level)),

    createQAProfile: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelQAProfileDefinition(input.level)),

    createEstimateProfile: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelEstimateProfile(input.level)),

    createFallbackPolicy: (input: CreateEditLevelSummaryRepositoryInput) =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelFallbackPolicy(input.level)),

    createReadiness: (input: CreateEditLevelReadinessRepositoryInput) => {
      const record: EditLevelReadinessRecord = {
        id: createMockId('edit-level-readiness'),
        projectId: input.projectId,
        sessionId: input.sessionId,
        level: input.level,
        profileReady: Boolean(getEditLevelProfile(input.level)),
        repositoryReady: true,
        apiRouteReady: true,
        clientReady: true,
        productionReady: false,
        createdAt: nowIso(),
        warnings: [
          'Readiness is mock-only and does not authorize runtime planner/UI wiring.',
          'Production persistence, render budget execution, and credit spend remain future work.',
        ],
        mockOnly: true,
      }
      insertMockRecord(db, 'editLevelReadiness', record)
      return createEditLevelRepositorySuccess('mock_local', record, record.warnings)
    },

    getReadiness: (input) =>
      createEditLevelRepositorySuccess(
        'mock_local',
        db.editLevelReadiness.find((record) => record.id === input.id),
      ),

    appendApplicationLog: (input) => {
      const record: EditLevelApplicationLogRecord = {
        id: createMockId('edit-level-log'),
        projectId: input.projectId,
        sessionId: input.sessionId,
        operation: input.operation,
        level: input.level,
        message: input.message,
        createdAt: nowIso(),
        sideEffects: createEditLevelRepositorySideEffectFlags(),
        mockOnly: true,
      }
      insertMockRecord(db, 'editLevelApplicationLogs', record)
      return createEditLevelRepositorySuccess('mock_local', record)
    },

    listApplicationLogs: (input?: ListEditLevelApplicationLogsRepositoryInput) => {
      const scoped = filterByProjectAndSession(db.editLevelApplicationLogs, input)
      const logs = input?.operation
        ? scoped.filter((record) => record.operation === input.operation)
        : scoped
      return createEditLevelRepositorySuccess('mock_local', logs)
    },

    createRepositorySummary: () =>
      createEditLevelRepositorySuccess('mock_local', createEditLevelRepositorySummary('mock_local', db)),
  }
}
