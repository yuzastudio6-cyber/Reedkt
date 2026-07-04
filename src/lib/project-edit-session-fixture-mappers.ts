import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionCardModel,
  ProjectEditSessionCardShape,
  ProjectEditSessionEventRecord,
  ProjectEditSessionFixtureBundle,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionRecord,
} from '../types/project-edit-session'

export function getProjectEditSessionCardShape(
  aspectRatio: ProjectEditSessionAspectRatio,
): ProjectEditSessionCardShape {
  if (aspectRatio === '9:16') return 'vertical'
  if (aspectRatio === '16:9') return 'wide'
  if (aspectRatio === '1:1') return 'square'
  if (aspectRatio === '4:5') return 'social'
  return 'custom'
}

export function createProjectEditSessionBadges(
  session: ProjectEditSessionRecord,
): string[] {
  const badges = [
    session.status.replace(/_/g, ' '),
    session.aspectRatio,
    session.platformTarget.replace(/_/g, ' '),
  ]

  if (session.approvalStatus === 'approved') badges.push('approved')
  if (session.approvalStatus === 'requested') badges.push('awaiting approval')
  if (session.approvalStatus === 'reset_after_revision') badges.push('approval reset')
  if (session.latestPreviewUrl) badges.push('preview ready')
  if (session.revisionCount > 0) badges.push(`${session.revisionCount} revision`)
  if (session.preferenceDNAApplicationId) badges.push('Preference DNA')
  if (session.doNotCopyRulesActive) badges.push('do-not-copy active')

  return Array.from(new Set(badges))
}

export function createProjectEditSessionCardModel(
  session: ProjectEditSessionRecord,
): ProjectEditSessionCardModel {
  return {
    id: session.id,
    projectId: session.projectId,
    name: session.name,
    status: session.status,
    aspectRatio: session.aspectRatio,
    platformTarget: session.platformTarget,
    thumbnailUrl: session.thumbnailUrl,
    latestPreviewUrl: session.latestPreviewUrl,
    selectedEditPreferenceName: session.selectedEditPreferenceHandle
      ? session.selectedEditPreferenceHandle.replace(/^@/, '').replace(/-/g, ' ')
      : undefined,
    selectedEditPreferenceHandle: session.selectedEditPreferenceHandle,
    dnaStatusLabel: session.dnaStatusLabel,
    dnaQAStatusLabel: session.dnaQAStatusLabel,
    badges: createProjectEditSessionBadges(session),
    messageCount: session.messageCount,
    revisionCount: session.revisionCount,
    versionCount: session.versionCount,
    lastEditedAt: session.updatedAt,
    cardShape: getProjectEditSessionCardShape(session.aspectRatio),
    mockOnly: session.mockOnly,
  }
}

export function createProjectEditSessionCardModels(
  sessions: ProjectEditSessionRecord[],
): ProjectEditSessionCardModel[] {
  return sessions.map(createProjectEditSessionCardModel)
}

export function createProjectEditSessionLatestActivitySummary(
  session: ProjectEditSessionRecord,
  messages: ProjectEditSessionMessageRecord[] = [],
  events: ProjectEditSessionEventRecord[] = [],
): string {
  const sessionMessages = messages
    .filter((message) => message.editSessionId === session.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const sessionEvents = events
    .filter((event) => event.editSessionId === session.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const latestMessage = sessionMessages.at(-1)
  const latestEvent = sessionEvents.at(-1)

  if (latestMessage) return `${latestMessage.kind.replace(/_/g, ' ')}: ${latestMessage.text}`
  if (latestEvent) return `${latestEvent.eventType.replace(/_/g, ' ')}: ${latestEvent.summary}`
  return `${session.name} was last updated at ${session.updatedAt}.`
}

export function createProjectEditSessionBundleSummary(
  bundle: ProjectEditSessionFixtureBundle,
): {
  sessionCount: number
  messageCount: number
  sourceCount: number
  memoryCount: number
  snapshotCount: number
  versionCount: number
  previewCount: number
  revisionCount: number
  eventCount: number
  dnaBackedCount: number
  legacyNoDnaCount: number
  mockOnly: boolean
} {
  return {
    sessionCount: bundle.sessions.length,
    messageCount: bundle.messages.length,
    sourceCount: bundle.sources.length,
    memoryCount: bundle.memories.length,
    snapshotCount: bundle.snapshots.length,
    versionCount: bundle.versions.length,
    previewCount: bundle.previews.length,
    revisionCount: bundle.revisions.length,
    eventCount: bundle.events.length,
    dnaBackedCount: bundle.sessions.filter((session) => Boolean(session.preferenceDNAApplicationId)).length,
    legacyNoDnaCount: bundle.sessions.filter((session) => !session.preferenceDNAApplicationId).length,
    mockOnly: [
      ...bundle.sessions,
      ...bundle.messages,
      ...bundle.sources,
      ...bundle.memories,
      ...bundle.snapshots,
      ...bundle.versions,
      ...bundle.previews,
      ...bundle.revisions,
      ...bundle.events,
    ].every((record) => record.mockOnly === true),
  }
}
