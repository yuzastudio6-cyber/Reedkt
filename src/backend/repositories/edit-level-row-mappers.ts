import type {
  EditLevelApplicationLogRecord,
  EditLevelProfileCatalogRecord,
  EditLevelReadinessRecord,
  EditLevelRecommendationRecord,
  EditLevelSelectionRecord,
} from '../../types'

export type EditLevelProfileCatalogRow = EditLevelProfileCatalogRecord
export type EditLevelSelectionRow = EditLevelSelectionRecord
export type EditLevelRecommendationRow = EditLevelRecommendationRecord
export type EditLevelReadinessRow = EditLevelReadinessRecord
export type EditLevelApplicationLogRow = EditLevelApplicationLogRecord

export function mapEditLevelProfileCatalogRecordToRow(record: EditLevelProfileCatalogRecord): EditLevelProfileCatalogRow {
  return { ...record }
}

export function mapEditLevelSelectionRecordToRow(record: EditLevelSelectionRecord): EditLevelSelectionRow {
  return { ...record }
}

export function mapEditLevelRecommendationRecordToRow(record: EditLevelRecommendationRecord): EditLevelRecommendationRow {
  return { ...record }
}

export function mapEditLevelReadinessRecordToRow(record: EditLevelReadinessRecord): EditLevelReadinessRow {
  return { ...record }
}

export function mapEditLevelApplicationLogRecordToRow(record: EditLevelApplicationLogRecord): EditLevelApplicationLogRow {
  return { ...record, sideEffects: { ...record.sideEffects } }
}
