import type { CanonicalEditBriefScope } from './edit-brief-authority-client'

const MAX_BROWSER_MEMORY_PREVIEWS = 12
const PREVIEW_REGISTRY = Symbol.for('reeditpro.editBrief.localPreviewFiles')

/**
 * Keeps a user-selected source File alive only within the current browser
 * JavaScript session. It survives React remounts, but never enters
 * localStorage, sessionStorage, IndexedDB, a request body, or a durable
 * planning record. A full page reload intentionally requires re-selection.
 */
export function readEditBriefLocalPreviewFile(
  scope: CanonicalEditBriefScope,
): File | undefined {
  return previewRegistry().get(scopeKey(scope))
}

export function saveEditBriefLocalPreviewFile(
  scope: CanonicalEditBriefScope,
  file: File,
): void {
  const key = scopeKey(scope)
  const previewFiles = previewRegistry()
  previewFiles.delete(key)
  previewFiles.set(key, file)
  while (previewFiles.size > MAX_BROWSER_MEMORY_PREVIEWS) {
    const oldest = previewFiles.keys().next().value
    if (typeof oldest !== 'string') break
    previewFiles.delete(oldest)
  }
}

export function clearEditBriefLocalPreviewFile(
  scope: CanonicalEditBriefScope,
): void {
  previewRegistry().delete(scopeKey(scope))
}

function scopeKey(scope: CanonicalEditBriefScope): string {
  return JSON.stringify([
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ])
}

function previewRegistry(): Map<string, File> {
  const runtime = globalThis as unknown as Record<symbol, unknown>
  const existing = runtime[PREVIEW_REGISTRY]
  if (existing instanceof Map) return existing as Map<string, File>
  const created = new Map<string, File>()
  runtime[PREVIEW_REGISTRY] = created
  return created
}
