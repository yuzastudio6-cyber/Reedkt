import type { EditLevelRepositorySummary, EditLevelRepositoryMode } from '../../types'
import { EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS } from '../../types'
import { defaultEditLevelProductionReadiness } from '../../lib/edit-level-production-readiness'
import type { MockDatabase } from '../mock/mock-database'

export function createEditLevelRepositorySummary(
  mode: EditLevelRepositoryMode,
  db?: Pick<
    MockDatabase,
    | 'editLevelProfileCatalog'
    | 'editLevelSelections'
    | 'editLevelRecommendations'
    | 'editLevelReadiness'
    | 'editLevelApplicationLogs'
  >,
): EditLevelRepositorySummary {
  return {
    mode,
    profileCount: db?.editLevelProfileCatalog.length ?? 0,
    selectionCount: db?.editLevelSelections.length ?? 0,
    recommendationCount: db?.editLevelRecommendations.length ?? 0,
    readinessCount: db?.editLevelReadiness.length ?? 0,
    applicationLogCount: db?.editLevelApplicationLogs.length ?? 0,
    productionReady: defaultEditLevelProductionReadiness.productionReady,
    productionReadiness: defaultEditLevelProductionReadiness,
    nextRecommendedPrompt: 'RP-EDITLEVEL-04 - UI Cards + Recommendation',
    warnings: [
      'RP-EDITLEVEL-03 adds mock repository/API/client surfaces only.',
      ...defaultEditLevelProductionReadiness.blockers,
    ],
    sideEffects: { ...EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS },
  }
}
