import type {
  EditLevelRepositoryMode,
  EditLevelRepositoryResult,
  EditLevelRepositorySideEffectFlags,
} from '../../types'
import { EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS } from '../../types'

export const EDIT_LEVEL_REPOSITORY_WARNINGS = [
  'Edit Level repository is mock-only in RP-EDITLEVEL-03.',
  'No production repository, Supabase query, provider call, media processing, render job, worker job, or credit operation is performed.',
]

export function createEditLevelRepositorySideEffectFlags(): EditLevelRepositorySideEffectFlags {
  return { ...EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS }
}

export function createEditLevelRepositorySuccess<TData>(
  mode: EditLevelRepositoryMode,
  data: TData,
  warnings: string[] = [],
): EditLevelRepositoryResult<TData> {
  return {
    ok: true,
    mode,
    data,
    warnings: [...EDIT_LEVEL_REPOSITORY_WARNINGS, ...warnings],
    ...createEditLevelRepositorySideEffectFlags(),
  }
}

export function createEditLevelRepositoryFailure<TData>(
  mode: EditLevelRepositoryMode,
  error: string,
  warnings: string[] = [],
): EditLevelRepositoryResult<TData> {
  return {
    ok: false,
    mode,
    error,
    warnings: [...EDIT_LEVEL_REPOSITORY_WARNINGS, ...warnings],
    ...createEditLevelRepositorySideEffectFlags(),
  }
}
