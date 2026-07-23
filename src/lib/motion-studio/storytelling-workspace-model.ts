export const STORYTELLING_PRIMARY_WORKSPACES = [
  'chat',
  'story',
  'scenes',
  'preview',
  'review',
] as const

export const STORYTELLING_ADVANCED_WORKSPACES = [
  'timeline',
  'assets',
  'audio',
  'sources',
] as const

export type StorytellingPrimaryWorkspace = typeof STORYTELLING_PRIMARY_WORKSPACES[number]
export type StorytellingAdvancedWorkspace = typeof STORYTELLING_ADVANCED_WORKSPACES[number]
export type StorytellingWorkspace = StorytellingPrimaryWorkspace | StorytellingAdvancedWorkspace

const WORKSPACE_QUERY_VALUES = new Set<StorytellingWorkspace>([
  ...STORYTELLING_PRIMARY_WORKSPACES,
  ...STORYTELLING_ADVANCED_WORKSPACES,
])

const LEGACY_WORKSPACE_ALIASES: Readonly<Record<string, StorytellingWorkspace>> = {
  animatic: 'preview',
  storyboard: 'scenes',
}

export function resolveStorytellingWorkspace(value: string | null | undefined): StorytellingWorkspace {
  if (!value) return 'chat'
  const normalized = value.trim().toLowerCase()
  const alias = LEGACY_WORKSPACE_ALIASES[normalized]
  if (alias) return alias
  return WORKSPACE_QUERY_VALUES.has(normalized as StorytellingWorkspace)
    ? normalized as StorytellingWorkspace
    : 'chat'
}

export function writeStorytellingWorkspaceToSearchParams(
  current: URLSearchParams,
  workspace: StorytellingWorkspace,
): URLSearchParams {
  const next = new URLSearchParams(current)
  next.delete('view')
  next.delete('studio')
  if (workspace === 'chat') next.delete('surface')
  else next.set('surface', workspace)
  return next
}

export function isStorytellingAdvancedWorkspace(
  workspace: StorytellingWorkspace,
): workspace is StorytellingAdvancedWorkspace {
  return (STORYTELLING_ADVANCED_WORKSPACES as readonly string[]).includes(workspace)
}

export function storytellingWorkspaceLabel(workspace: StorytellingWorkspace): string {
  const labels: Record<StorytellingWorkspace, string> = {
    chat: 'Chat',
    story: 'Story',
    scenes: 'Scenes',
    preview: 'Preview',
    review: 'Review',
    timeline: 'Timeline',
    assets: 'Assets',
    audio: 'Audio',
    sources: 'Sources',
  }
  return labels[workspace]
}
