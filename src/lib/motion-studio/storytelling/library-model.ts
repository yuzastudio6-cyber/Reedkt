import type { LocalInternalProjectHandoff } from '../../local-project-handoff'
import {
  isMotionStudioStorytellingHandoff,
  motionStudioStorytellingWorkspaceRoute,
} from '../contracts/storytelling-workflow'

export type StorytellingLibraryItemTone = 'current' | 'attention' | 'verified' | 'quiet'

export interface StorytellingLibraryItem {
  projectId: string
  projectName: string
  editSessionId: string
  /** @deprecated Use workspacePath. Retained until the shared Project page seam is reconciled. */
  editorPath: string
  workspacePath: string
  title: string
  description: string
  statusLabel: string
  tone: StorytellingLibraryItemTone
  updatedAt: string
  sourceFileCount: number
  preferenceDefaultsApplied: boolean
}

/**
 * Projects and named edits stay in the shared product registry, while the
 * explicit product workflow determines whether Motion Studio owns the entry.
 * The exact retained V1 edit-id prefix is accepted only when an explicit
 * workflow discriminator is absent. Category never selects Motion Studio.
 */
export function createStorytellingLibraryItems(
  edits: readonly LocalInternalProjectHandoff[],
  options: { allowLegacyMigration?: boolean } = {},
): StorytellingLibraryItem[] {
  return edits
    .filter((edit) => isMotionStudioStorytellingHandoff(edit as LocalInternalProjectHandoff & {
      productWorkflow?: unknown
    }, options))
    .map((edit) => {
      const presentation = storytellingStagePresentation(edit)
      const workspacePath = motionStudioStorytellingWorkspaceRoute(edit.projectId, edit.editSessionId)
      return {
        projectId: edit.projectId,
        projectName: edit.projectName,
        editSessionId: edit.editSessionId,
        editorPath: workspacePath,
        workspacePath,
        title: edit.editName ?? edit.projectName,
        description: presentation.description,
        statusLabel: presentation.statusLabel,
        tone: presentation.tone,
        updatedAt: edit.updatedAt,
        sourceFileCount: edit.sourceFileCount,
        preferenceDefaultsApplied: Boolean(edit.setup?.preferenceDefaultsApplied),
      }
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function storytellingStagePresentation(edit: LocalInternalProjectHandoff): Pick<
  StorytellingLibraryItem,
  'description' | 'statusLabel' | 'tone'
> {
  switch (edit.stage) {
    case 'created':
      return {
        description: 'Continue in Director Chat to describe the story, add material, or start from a prepared script.',
        statusLabel: 'Ready to begin',
        tone: 'current',
      }
    case 'source_uploaded':
      return {
        description: 'Source material is ready. Continue the Director conversation and prepare the story plan.',
        statusLabel: 'Planning',
        tone: 'current',
      }
    case 'plan_approved':
      return {
        description: 'The approved plan is moving through its private production workflow.',
        statusLabel: 'In production',
        tone: 'current',
      }
    case 'private_review_ready':
    case 'private_review_verified':
    case 'revision_preview_ready':
      return {
        description: 'A private result is ready for review in the exact named edit.',
        statusLabel: 'Review needed',
        tone: 'attention',
      }
    case 'revision_requested':
      return {
        description: 'Requested changes are waiting to be discussed and replanned in Director Chat.',
        statusLabel: 'Changes requested',
        tone: 'attention',
      }
    case 'private_review_accepted':
      return {
        description: 'The current private review is approved and remains available in the named edit.',
        statusLabel: 'Approved',
        tone: 'verified',
      }
    case 'internal_edit_complete':
      return {
        description: 'This story completed its current verified private workflow.',
        statusLabel: 'Complete',
        tone: 'verified',
      }
    default:
      return {
        description: 'Continue this story in its dedicated Storytelling Director Chat.',
        statusLabel: 'Available',
        tone: 'quiet',
      }
  }
}

export function formatStorytellingLibraryUpdate(value: string, now = Date.now()): string {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Updated recently'

  const elapsedSeconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (elapsedSeconds < 60) return 'Updated just now'
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `Updated ${elapsedHours}h ago`
  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `Updated ${elapsedDays}d ago`
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(timestamp)}`
}
