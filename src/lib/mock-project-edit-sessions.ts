import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionEventRecord,
  ProjectEditSessionFixtureBundle,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionPreviewStatus,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotKind,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionStatus,
  ProjectEditSessionVersionRecord,
  ProjectEditSessionVersionStatus,
  ProjectEditSessionSourceImportance,
} from '../types/project-edit-session'
import type { UserFacingEditLevel } from '../types/reeditpro'

type MockSessionSpec = {
  id: string
  name: string
  description: string
  status: ProjectEditSessionStatus
  aspectRatio: ProjectEditSessionAspectRatio
  platformTarget: ProjectEditSessionPlatformTarget
  editLevel: UserFacingEditLevel
  approvalStatus: ProjectEditSessionApprovalStatus
  versionStatus: ProjectEditSessionVersionStatus
  previewStatus: ProjectEditSessionPreviewStatus
  hasDna: boolean
  needsReview?: boolean
  hasRevision?: boolean
  previousApprovedEditDerived?: boolean
  customAspectRatio?: { width: number; height: number }
}

const PROJECT_ID = 'mock-project-edit-chat-foundation'
const WORKSPACE_ID = 'mock-workspace-edit-session'
const OWNER_USER_ID = 'mock-user-edit-session-owner'
const MOCK_NOW = '2026-06-21T14:00:00.000Z'

const sessionSpecs: MockSessionSpec[] = [
  {
    id: 'edit-session-vertical-dna',
    name: 'Travel Reel DNA Cut',
    description: '9:16 TikTok/Reel edit with Preference DNA applied.',
    status: 'awaiting_approval',
    aspectRatio: '9:16',
    platformTarget: 'tiktok_reel',
    editLevel: 'premium',
    approvalStatus: 'requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: true,
  },
  {
    id: 'edit-session-youtube-wide',
    name: 'Founder Story YouTube Cut',
    description: '16:9 YouTube standard edit.',
    status: 'setup_ready',
    aspectRatio: '16:9',
    platformTarget: 'youtube_standard',
    editLevel: 'ultra_premium',
    approvalStatus: 'not_requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: false,
  },
  {
    id: 'edit-session-square-ad',
    name: 'Square Product Ad',
    description: '1:1 square ad edit.',
    status: 'awaiting_approval',
    aspectRatio: '1:1',
    platformTarget: 'ad_creative',
    editLevel: 'premium',
    approvalStatus: 'requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: true,
  },
  {
    id: 'edit-session-social-feed',
    name: 'Social Feed Case Study',
    description: '4:5 social feed edit.',
    status: 'setup_ready',
    aspectRatio: '4:5',
    platformTarget: 'instagram_feed',
    editLevel: 'basic',
    approvalStatus: 'not_requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: false,
  },
  {
    id: 'edit-session-legacy-no-dna',
    name: 'Legacy Saved Preference Edit',
    description: 'Legacy no-DNA edit using an older saved preference.',
    status: 'awaiting_approval',
    aspectRatio: '9:16',
    platformTarget: 'instagram_reel',
    editLevel: 'premium',
    approvalStatus: 'requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: false,
  },
  {
    id: 'edit-session-draft-no-approval',
    name: 'Draft Internal Review Edit',
    description: 'Draft Edit Chat with no approval requested.',
    status: 'draft',
    aspectRatio: 'custom',
    customAspectRatio: { width: 1080, height: 1350 },
    platformTarget: 'internal_review',
    editLevel: 'basic',
    approvalStatus: 'not_requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: false,
  },
  {
    id: 'edit-session-approved-preview',
    name: 'Approved Podcast Clip',
    description: 'Approved edit with mock preview ready.',
    status: 'preview_ready',
    aspectRatio: '16:9',
    platformTarget: 'podcast_clip',
    editLevel: 'premium',
    approvalStatus: 'approved',
    versionStatus: 'preview_ready',
    previewStatus: 'preview_ready_mock',
    hasDna: true,
  },
  {
    id: 'edit-session-needs-review',
    name: 'Faith Story Review Cut',
    description: 'Needs-review edit with conservative Preference DNA warning.',
    status: 'needs_review',
    aspectRatio: '9:16',
    platformTarget: 'instagram_reel',
    editLevel: 'premium',
    approvalStatus: 'not_requested',
    versionStatus: 'draft',
    previewStatus: 'blocked',
    hasDna: true,
    needsReview: true,
  },
  {
    id: 'edit-session-revision-requested',
    name: 'Product Demo Revision',
    description: 'Revision-requested edit that resets approval.',
    status: 'revision_requested',
    aspectRatio: '4:5',
    platformTarget: 'linkedin',
    editLevel: 'ultra_premium',
    approvalStatus: 'reset_after_revision',
    versionStatus: 'superseded',
    previewStatus: 'placeholder_mock',
    hasDna: false,
    hasRevision: true,
  },
  {
    id: 'edit-session-previous-approved-derived',
    name: 'Previous Approved Edit Study',
    description: 'Edit Chat derived from a previous approved edit reference.',
    status: 'setup_ready',
    aspectRatio: '1:1',
    platformTarget: 'website',
    editLevel: 'premium',
    approvalStatus: 'not_requested',
    versionStatus: 'draft',
    previewStatus: 'placeholder_mock',
    hasDna: true,
    previousApprovedEditDerived: true,
  },
]

function mockUrl(path: string): string {
  return `/mock/edit-sessions/${path}`
}

function mediaId(sessionId: string, index: number): string {
  return `${sessionId}-media-${index + 1}`
}

function createMessages(spec: MockSessionSpec): ProjectEditSessionMessageRecord[] {
  const baseMessages: ProjectEditSessionMessageRecord[] = [
    {
      id: `${spec.id}-message-user-brief`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'user',
      kind: 'text',
      text: `Create ${spec.name} for ${spec.platformTarget}.`,
      createdAt: '2026-06-21T14:00:00.000Z',
      mockOnly: true,
    },
    {
      id: `${spec.id}-message-source`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'assistant',
      kind: 'source_update',
      text: 'Mock source order captured with primary and b-roll clips.',
      createdAt: '2026-06-21T14:01:00.000Z',
      relatedSnapshotId: `${spec.id}-snapshot-source`,
      mockOnly: true,
    },
    {
      id: `${spec.id}-message-setup`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'assistant',
      kind: spec.hasDna ? 'preference_dna_applied' : 'setup_summary',
      text: spec.hasDna
        ? 'Preference DNA is applied as adapted-not-copied planning guidance.'
        : 'Mock setup summary is ready without Preference DNA.',
      createdAt: '2026-06-21T14:02:00.000Z',
      relatedSnapshotId: `${spec.id}-snapshot-setup`,
      mockOnly: true,
    },
  ]

  if (spec.approvalStatus === 'requested') {
    baseMessages.push({
      id: `${spec.id}-message-approval`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'approval',
      kind: 'approval_request',
      text: 'Plan and estimate are awaiting approval.',
      createdAt: '2026-06-21T14:03:00.000Z',
      relatedVersionId: `${spec.id}-version-1`,
      mockOnly: true,
    })
  }

  if (spec.previewStatus === 'preview_ready_mock') {
    baseMessages.push({
      id: `${spec.id}-message-preview`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'preview',
      kind: 'preview_ready',
      text: 'Mock preview is ready for review.',
      createdAt: '2026-06-21T14:04:00.000Z',
      relatedPreviewId: `${spec.id}-preview-1`,
      mockOnly: true,
    })
  }

  if (spec.hasRevision) {
    baseMessages.push({
      id: `${spec.id}-message-revision`,
      projectId: PROJECT_ID,
      editSessionId: spec.id,
      role: 'revision',
      kind: 'revision_request',
      text: 'Make captions smaller and reduce graphic density.',
      createdAt: '2026-06-21T14:05:00.000Z',
      relatedSnapshotId: `${spec.id}-snapshot-revision`,
      mockOnly: true,
    })
  }

  return baseMessages
}

function createSources(spec: MockSessionSpec): ProjectEditSessionSourceRecord[] {
  const importances: ProjectEditSessionSourceImportance[] = spec.previousApprovedEditDerived
    ? ['primary', 'reference_only']
    : ['primary', 'broll']

  return importances.map((importance, index) => ({
    id: `${spec.id}-source-${index + 1}`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    mediaAssetId: mediaId(spec.id, index),
    sourceOrderIndex: index,
    label: index === 0 ? 'Primary source clip' : importance === 'reference_only' ? 'Previous approved edit reference' : 'B-roll clip',
    notes: index === 0
      ? ['Use as main story source', 'Preserve source order']
      : ['Use selectively', importance === 'reference_only' ? 'Adapt editing language only' : 'Support pacing and cutaways'],
    importance,
    thumbnailUrl: mockUrl(`${spec.id}-source-${index + 1}.jpg`),
    previewUrl: mockUrl(`${spec.id}-source-${index + 1}.mp4`),
    durationSeconds: index === 0 ? 58 : 22,
    mimeType: 'video/mp4',
    mockOnly: true,
  }))
}

function createMemories(spec: MockSessionSpec): ProjectEditSessionMemoryRecord[] {
  const layers: ProjectEditSessionMemoryLayer[] = [
    'session_memory',
    'source_memory',
    'preference_memory',
    ...(spec.hasDna ? ['dna_application_memory' as const] : []),
    ...(spec.hasRevision ? ['revision_memory' as const] : []),
  ]

  return layers.map((layer) => ({
    id: `${spec.id}-memory-${layer}`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    layer,
    summary: `${layer.replace(/_/g, ' ')} for ${spec.name}.`,
    facts: [
      `Aspect ratio: ${spec.aspectRatio}`,
      `Platform target: ${spec.platformTarget}`,
    ],
    preferences: spec.hasDna
      ? ['Use transferable Preference DNA only', 'Keep adapted-not-copied rules active']
      : ['Use mock setup preferences only'],
    warnings: spec.needsReview ? ['Preference DNA requires user review before full application'] : [],
    updatedFromMessageId: `${spec.id}-message-setup`,
    updatedFromRevisionId: spec.hasRevision ? `${spec.id}-revision-1` : undefined,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    mockOnly: true,
    metadata: { architectureOnly: true },
  }))
}

function createSnapshots(spec: MockSessionSpec): ProjectEditSessionSnapshotRecord[] {
  const kinds: ProjectEditSessionSnapshotKind[] = ['created', 'source_updated', 'setup_generated']
  if (spec.approvalStatus === 'approved') kinds.push('plan_approved')
  if (spec.previewStatus === 'preview_ready_mock') kinds.push('preview_created')
  if (spec.hasRevision) kinds.push('revision_requested')

  return kinds.map((kind, index) => ({
    id: `${spec.id}-snapshot-${kind === 'source_updated' ? 'source' : kind === 'setup_generated' ? 'setup' : kind}`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    kind,
    versionNumber: kind === 'version_created' ? 1 : undefined,
    messageId: index === 0 ? `${spec.id}-message-user-brief` : `${spec.id}-message-setup`,
    summary: `${kind.replace(/_/g, ' ')} snapshot for ${spec.name}.`,
    state: {
      status: spec.status,
      aspectRatio: spec.aspectRatio,
      platformTarget: spec.platformTarget,
      mockOnly: true,
    },
    createdAt: MOCK_NOW,
    mockOnly: true,
  }))
}

function createVersion(spec: MockSessionSpec): ProjectEditSessionVersionRecord {
  return {
    id: `${spec.id}-version-1`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    versionNumber: 1,
    status: spec.versionStatus,
    name: `${spec.name} v1`,
    summary: `Mock version package for ${spec.name}.`,
    createdFromSnapshotId: `${spec.id}-snapshot-setup`,
    createdFromMessageId: `${spec.id}-message-setup`,
    previewId: `${spec.id}-preview-1`,
    approvalStatus: spec.approvalStatus,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      previousApprovedEditDerived: spec.previousApprovedEditDerived === true,
      hasPreferenceDna: spec.hasDna,
    },
  }
}

function createPreview(spec: MockSessionSpec): ProjectEditSessionPreviewRecord {
  const ready = spec.previewStatus === 'preview_ready_mock'
  return {
    id: `${spec.id}-preview-1`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    versionId: `${spec.id}-version-1`,
    status: spec.previewStatus,
    thumbnailUrl: mockUrl(`${spec.id}-preview.jpg`),
    previewUrl: ready ? mockUrl(`${spec.id}-preview.mp4`) : undefined,
    aspectRatio: spec.aspectRatio,
    durationSeconds: ready ? 42 : undefined,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: { placeholderOnly: !ready },
  }
}

function createRevision(spec: MockSessionSpec): ProjectEditSessionRevisionRecord[] {
  if (!spec.hasRevision) return []

  return [{
    id: `${spec.id}-revision-1`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    requestedByMessageId: `${spec.id}-message-revision`,
    summary: 'Caption size and graphic density revision requested.',
    userInstruction: 'Make captions smaller and reduce graphic density.',
    resetsApproval: true,
    createdSnapshotId: `${spec.id}-snapshot-revision_requested`,
    createdVersionId: `${spec.id}-version-1`,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: { projectOnlyLearning: true },
  }]
}

function createEvents(spec: MockSessionSpec): ProjectEditSessionEventRecord[] {
  const events: Array<[string, string]> = [
    ['session_created', 'Edit Chat fixture created.'],
    ['source_order_saved', 'Source order fixture saved.'],
    ['setup_package_ready', 'Mock setup package ready.'],
  ]

  if (spec.hasDna) events.push(['preference_dna_applied', 'Preference DNA application metadata attached.'])
  if (spec.hasRevision) events.push(['revision_requested', 'Revision request captured.'])

  return events.map(([eventType, summary], index) => ({
    id: `${spec.id}-event-${index + 1}`,
    projectId: PROJECT_ID,
    editSessionId: spec.id,
    eventType,
    summary,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: { architectureOnly: true },
  }))
}

function createSession(spec: MockSessionSpec): ProjectEditSessionRecord {
  const revisions = spec.hasRevision ? 1 : 0
  const latestPreviewReady = spec.previewStatus === 'preview_ready_mock'
  return {
    id: spec.id,
    projectId: PROJECT_ID,
    workspaceId: WORKSPACE_ID,
    ownerUserId: OWNER_USER_ID,
    name: spec.name,
    description: spec.description,
    status: spec.status,
    aspectRatio: spec.aspectRatio,
    customAspectRatio: spec.customAspectRatio,
    platformTarget: spec.platformTarget,
    thumbnailUrl: mockUrl(`${spec.id}-thumb.jpg`),
    latestPreviewUrl: latestPreviewReady ? mockUrl(`${spec.id}-preview.mp4`) : undefined,
    sourceMediaAssetIds: [mediaId(spec.id, 0), mediaId(spec.id, 1)],
    selectedEditLevel: spec.editLevel,
    selectedEditPreferenceId: spec.hasDna ? 'pref_lifestyle_travel_vlog' : spec.id === 'edit-session-legacy-no-dna' ? 'pref_legacy_saved' : undefined,
    selectedPreferenceVersionId: spec.hasDna ? 'pref_lifestyle_travel_vlog_v2' : undefined,
    selectedEditPreferenceHandle: spec.hasDna ? '@lifestyle-travel-vlog' : spec.id === 'edit-session-legacy-no-dna' ? '@legacy-clean-edit' : undefined,
    preferenceDNAApplicationId: spec.hasDna ? `${spec.id}-dna-application` : undefined,
    dnaStatusLabel: spec.hasDna ? (spec.needsReview ? 'Preference DNA needs review' : 'Preference DNA applied') : undefined,
    dnaQAStatusLabel: spec.hasDna ? (spec.needsReview ? 'requires user review' : 'approved mock') : undefined,
    doNotCopyRulesActive: true,
    messageCount: createMessages(spec).length,
    revisionCount: revisions,
    versionCount: 1,
    previewCount: 1,
    latestSnapshotId: `${spec.id}-snapshot-setup`,
    latestVersionId: `${spec.id}-version-1`,
    latestPreviewId: `${spec.id}-preview-1`,
    approvalStatus: spec.approvalStatus,
    lastOpenedAt: MOCK_NOW,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      editChatUserFacingName: true,
      projectEditSessionDistinctFromEditPreference: true,
      previousApprovedEditDerived: spec.previousApprovedEditDerived === true,
    },
  }
}

export function createMockProjectEditSessionFixtureBundle(): ProjectEditSessionFixtureBundle {
  const sessions = sessionSpecs.map(createSession)
  return {
    sessions,
    messages: sessionSpecs.flatMap(createMessages),
    sources: sessionSpecs.flatMap(createSources),
    memories: sessionSpecs.flatMap(createMemories),
    snapshots: sessionSpecs.flatMap(createSnapshots),
    versions: sessionSpecs.map(createVersion),
    previews: sessionSpecs.map(createPreview),
    revisions: sessionSpecs.flatMap(createRevision),
    events: sessionSpecs.flatMap(createEvents),
  }
}

export const MOCK_PROJECT_EDIT_SESSION_FIXTURE_BUNDLE =
  createMockProjectEditSessionFixtureBundle()

export const MOCK_PROJECT_EDIT_SESSION_PROJECT_ID = PROJECT_ID
