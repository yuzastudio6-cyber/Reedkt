import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import { createEditReferenceDeterministicHash } from './edit-reference-deterministic-hash'
import { mapLegacyRuntimeEditLevelToCanonical } from './edit-level-ui-adapter'
import { createProjectEditSessionCardModel } from './project-edit-session-fixture-mappers'
import type { ProjectEditBriefBackendLocalRecord } from './project-edit-brief-backend-local'
import type { EditBriefState } from '../types/edit-brief-state'
import type {
  AspectRatio,
  EditLevel,
  TargetPlatform,
} from '../types/reeditpro'
import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionRecord,
  ProjectEditSessionSourceRecord,
} from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'

export type CurrentEditReferenceActiveAuthorityBlockReason =
  | 'source_or_brief_missing'
  | 'frame_unconfirmed'
  | 'authority_mismatch'

export interface CurrentEditReferenceActiveEditorAuthority {
  bundle: ProjectEditSessionBundleRecord
  currentUserInstruction: string
  editBrief: ProjectEditBriefBackendLocalRecord
  workspaceId: string
}

export type CurrentEditReferenceActiveEditorAuthorityResolution =
  | {
      ready: true
      authority: CurrentEditReferenceActiveEditorAuthority
      source: ApprovedEditExecutionUploadedMediaSourceAssetClientInput
      briefText: string
    }
  | {
      ready: false
      blockReason: CurrentEditReferenceActiveAuthorityBlockReason
      message: string
    }

export function createCurrentEditReferenceBackendBriefText(state: EditBriefState): string {
  const brief = state.editBrief
  const rows = [
    ['Status', brief.status],
    ['Goal', brief.goal],
    ['Audience', brief.audience],
    ['Platforms', brief.targetPlatforms.join(', ')],
    ['Target duration', brief.targetDurationMs ? `${brief.targetDurationMs} ms` : undefined],
    ['Style direction', brief.styleKeywords.join(', ')],
    ['Pacing', brief.pacingPreference],
    ['Captions', brief.captionPreference],
    ['Music', brief.musicPreference],
    ['B-roll', brief.bRollPreference],
    ['Must include', brief.mustIncludeNotes.join(' | ')],
    ['Avoid', brief.avoidNotes.join(' | ')],
    ['Brand direction', brief.brandNotes],
    ['Special instructions', brief.specialInstructions],
    ['Must-use asset set', fingerprintPrivateIdentifiers(brief.mustUseAssetIds)],
    ['Avoid-asset set', fingerprintPrivateIdentifiers(brief.avoidAssetIds)],
    ['Reference-link set', fingerprintPrivateIdentifiers(brief.userProvidedReferenceUrls ?? [])],
    ['Brief version', String(brief.version)],
  ] as const

  return rows
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}: ${value?.trim()}`)
    .join('\n')
}

export function resolveCurrentEditReferenceActiveEditorAuthority(input: {
  aspectRatio: AspectRatio
  aspectRatioConfirmed: boolean
  backendBrief?: ProjectEditBriefBackendLocalRecord
  createdAt: string
  currentUserInstruction: string
  editBriefState?: EditBriefState
  editLevel: EditLevel
  editName: string
  editSessionId: string
  ownerUserId?: string
  projectId: string
  projectName: string
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  targetPlatform: TargetPlatform
  updatedAt: string
  workspaceId: string
}): CurrentEditReferenceActiveEditorAuthorityResolution {
  const mappedAspectRatio = projectEditSessionAspectRatio(input.aspectRatio)
  if (!input.aspectRatioConfirmed || mappedAspectRatio === 'custom') {
    return blocked(
      'frame_unconfirmed',
      'Confirm a supported 9:16, 16:9, 1:1, or 4:5 output frame before studying this video.',
    )
  }

  if (!input.editBriefState || input.editBriefState.editBrief.status !== 'ready') {
    return blocked(
      'source_or_brief_missing',
      'Mark the existing Edit Brief ready before starting whole-video study.',
    )
  }

  const sourceResolution = resolveCurrentEditReferenceTargetSource(input.sourceMediaAssets)
  if (!sourceResolution.ok) return blocked('source_or_brief_missing', sourceResolution.message)

  const briefText = createCurrentEditReferenceBackendBriefText(input.editBriefState)
  if (!briefText.trim()) {
    return blocked('source_or_brief_missing', 'Add direction to the Edit Brief before starting whole-video study.')
  }

  const backendBrief = input.backendBrief
  if (!backendBrief || backendBrief.readbackVerified !== true) {
    return blocked(
      'source_or_brief_missing',
      'Save and verify the ready Edit Brief before starting whole-video study.',
    )
  }

  const exactBriefMatches = backendBrief.workspaceId === input.workspaceId
    && backendBrief.projectId === input.projectId
    && backendBrief.editSessionId === input.editSessionId
    && backendBrief.briefText === briefText
    && backendBrief.sourceStorageObjectRecordId === sourceResolution.source.storageObjectRecordId
    && backendBrief.sourceMediaAssetId === sourceResolution.source.mediaAssetId
    && Number.isInteger(backendBrief.revisionNumber)
    && backendBrief.revisionNumber >= 1
    && /^[a-f0-9]{64}$/.test(backendBrief.contentDigestSha256)

  if (!exactBriefMatches) {
    return blocked(
      'authority_mismatch',
      'The source or Edit Brief changed after verification. Mark the current Brief ready again before studying this video.',
    )
  }

  const session = createSession({
    ...input,
    aspectRatio: mappedAspectRatio,
    source: sourceResolution.source,
  })
  const source = createSessionSource(input.projectId, input.editSessionId, sourceResolution.source)
  const bundle: ProjectEditSessionBundleRecord = {
    session,
    messages: [],
    sources: [source],
    memories: [],
    snapshots: [],
    versions: [],
    previews: [],
    revisions: [],
    events: [],
    cardModel: createProjectEditSessionCardModel(session),
    mockOnly: true,
    warnings: [
      'This exact-edit bundle is a browser-local integration snapshot. It does not prove production persistence, provider execution, rendering, billing, or public delivery.',
    ],
  }

  return {
    ready: true,
    authority: {
      bundle,
      currentUserInstruction: input.currentUserInstruction.trim(),
      editBrief: backendBrief,
      workspaceId: input.workspaceId,
    },
    source: sourceResolution.source,
    briefText,
  }
}

export function resolveCurrentEditReferenceTargetSource(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
): { ok: true; source: ApprovedEditExecutionUploadedMediaSourceAssetClientInput } | { ok: false; message: string } {
  const eligible = sourceMediaAssets.filter((source) => (
    source.privateArtifact === true
    && source.publicUrl === null
    && source.signedUrl === null
    && source.mimeType.toLowerCase().startsWith('video/')
    && Boolean(source.storageObjectRecordId?.trim())
    && Boolean(source.mediaAssetId.trim())
    && source.byteSize > 0
  ))

  if (eligible.length === 0) {
    return {
      ok: false,
      message: 'Finish the private video upload before starting whole-video study.',
    }
  }
  if (eligible.length > 1) {
    return {
      ok: false,
      message: 'This study contract currently requires one exact target video. Choose a single assembled source before applying an Edit Reference.',
    }
  }
  return { ok: true, source: eligible[0] }
}

function createSession(input: {
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>
  createdAt: string
  currentUserInstruction: string
  editLevel: EditLevel
  editName: string
  editSessionId: string
  ownerUserId?: string
  projectId: string
  projectName: string
  source: ApprovedEditExecutionUploadedMediaSourceAssetClientInput
  targetPlatform: TargetPlatform
  updatedAt: string
  workspaceId: string
}): ProjectEditSessionRecord {
  return {
    id: input.editSessionId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    name: input.editName,
    description: input.currentUserInstruction.trim() || `${input.projectName} edit`,
    status: 'setup_ready',
    aspectRatio: input.aspectRatio,
    platformTarget: projectEditSessionPlatform(input.targetPlatform, input.aspectRatio),
    sourceMediaAssetIds: [input.source.mediaAssetId],
    selectedEditLevel: mapLegacyRuntimeEditLevelToCanonical(input.editLevel),
    doNotCopyRulesActive: true,
    messageCount: 0,
    revisionCount: 0,
    versionCount: 0,
    previewCount: 0,
    approvalStatus: 'not_requested',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    mockOnly: true,
    metadata: {
      exactActiveEditorAuthority: true,
      sourceStorageObjectRecordId: input.source.storageObjectRecordId,
      sourceChecksumSha256: input.source.checksumSha256,
      providerExecutionAuthorized: false,
      creditMutationAuthorized: false,
    },
  }
}

function createSessionSource(
  projectId: string,
  editSessionId: string,
  source: ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
): ProjectEditSessionSourceRecord {
  return {
    id: source.sourceSequenceItemId ?? source.uploadedClipId ?? source.mediaAssetId,
    projectId,
    editSessionId,
    mediaAssetId: source.mediaAssetId,
    sourceOrderIndex: source.uploadedOrder,
    label: source.fileName,
    notes: ['Exact private target source for Edit Reference study.'],
    importance: 'primary',
    durationSeconds: source.sourceMetadata?.durationSeconds,
    mimeType: source.mimeType,
    mockOnly: true,
  }
}

function projectEditSessionAspectRatio(aspectRatio: AspectRatio): ProjectEditSessionAspectRatio {
  return aspectRatio === '9:16' || aspectRatio === '16:9' || aspectRatio === '1:1' || aspectRatio === '4:5'
    ? aspectRatio
    : 'custom'
}

function projectEditSessionPlatform(
  platform: TargetPlatform,
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>,
): ProjectEditSessionPlatformTarget {
  if (platform === 'tiktok_reels_shorts') return 'tiktok_reel'
  if (platform === 'youtube') return aspectRatio === '9:16' ? 'youtube_shorts' : 'youtube_standard'
  if (platform === 'website' || platform === 'course_training') return 'website'
  if (platform === 'client_review') return 'internal_review'
  return 'custom'
}

function fingerprintPrivateIdentifiers(values: string[]): string | undefined {
  const normalized = values.map((value) => value.trim()).filter(Boolean).sort()
  return normalized.length > 0
    ? `${normalized.length} item(s), fingerprint ${createEditReferenceDeterministicHash(normalized)}`
    : undefined
}

function blocked(
  blockReason: CurrentEditReferenceActiveAuthorityBlockReason,
  message: string,
): CurrentEditReferenceActiveEditorAuthorityResolution {
  return { ready: false, blockReason, message }
}
