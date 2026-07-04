import type {
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionEventRowLike,
  ProjectEditSessionMemoryRowLike,
  ProjectEditSessionMessageRowLike,
  ProjectEditSessionPreviewRowLike,
  ProjectEditSessionRowMappingSummary,
  ProjectEditSessionRevisionRowLike,
  ProjectEditSessionRowLike,
  ProjectEditSessionSnapshotRowLike,
  ProjectEditSessionSourceRowLike,
  ProjectEditSessionVersionRowLike,
} from '../../types/project-edit-session-repository'

function metadata(value: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  return value ?? undefined
}

function nullableObject(value: Record<string, unknown> | undefined): Record<string, unknown> | null {
  return value ?? null
}

export function mapProjectEditSessionRowToRecord(row: ProjectEditSessionRowLike): ProjectEditSessionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    workspaceId: row.workspace_id ?? undefined,
    ownerUserId: row.owner_user_id ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as ProjectEditSessionRecord['status'],
    aspectRatio: row.aspect_ratio as ProjectEditSessionRecord['aspectRatio'],
    customAspectRatio: row.custom_aspect_ratio as ProjectEditSessionRecord['customAspectRatio'],
    platformTarget: row.platform_target as ProjectEditSessionRecord['platformTarget'],
    thumbnailUrl: row.thumbnail_url ?? undefined,
    latestPreviewUrl: row.latest_preview_url ?? undefined,
    sourceMediaAssetIds: row.source_media_asset_ids,
    selectedEditLevel: row.selected_edit_level as ProjectEditSessionRecord['selectedEditLevel'],
    selectedEditPreferenceId: row.selected_edit_preference_id ?? undefined,
    selectedPreferenceVersionId: row.selected_preference_version_id ?? undefined,
    selectedEditPreferenceHandle: row.selected_edit_preference_handle ?? undefined,
    preferenceDNAApplicationId: row.preference_dna_application_id ?? undefined,
    dnaStatusLabel: row.dna_status_label ?? undefined,
    dnaQAStatusLabel: row.dna_qa_status_label ?? undefined,
    doNotCopyRulesActive: row.do_not_copy_rules_active,
    messageCount: row.message_count,
    revisionCount: row.revision_count,
    versionCount: row.version_count,
    previewCount: row.preview_count,
    latestSnapshotId: row.latest_snapshot_id ?? undefined,
    latestVersionId: row.latest_version_id ?? undefined,
    latestPreviewId: row.latest_preview_id ?? undefined,
    approvalStatus: row.approval_status as ProjectEditSessionRecord['approvalStatus'],
    lastOpenedAt: row.last_opened_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionRecordToInsertRow(record: ProjectEditSessionRecord): ProjectEditSessionRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    workspace_id: record.workspaceId ?? null,
    owner_user_id: record.ownerUserId ?? null,
    name: record.name,
    description: record.description ?? null,
    status: record.status,
    aspect_ratio: record.aspectRatio,
    custom_aspect_ratio: record.customAspectRatio ?? null,
    platform_target: record.platformTarget,
    thumbnail_url: record.thumbnailUrl ?? null,
    latest_preview_url: record.latestPreviewUrl ?? null,
    source_media_asset_ids: record.sourceMediaAssetIds,
    selected_edit_level: record.selectedEditLevel ?? null,
    selected_edit_preference_id: record.selectedEditPreferenceId ?? null,
    selected_preference_version_id: record.selectedPreferenceVersionId ?? null,
    selected_edit_preference_handle: record.selectedEditPreferenceHandle ?? null,
    preference_dna_application_id: record.preferenceDNAApplicationId ?? null,
    dna_status_label: record.dnaStatusLabel ?? null,
    dna_qa_status_label: record.dnaQAStatusLabel ?? null,
    do_not_copy_rules_active: record.doNotCopyRulesActive,
    message_count: record.messageCount,
    revision_count: record.revisionCount,
    version_count: record.versionCount,
    preview_count: record.previewCount,
    latest_snapshot_id: record.latestSnapshotId ?? null,
    latest_version_id: record.latestVersionId ?? null,
    latest_preview_id: record.latestPreviewId ?? null,
    approval_status: record.approvalStatus,
    last_opened_at: record.lastOpenedAt ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionMessageRowToRecord(row: ProjectEditSessionMessageRowLike): ProjectEditSessionMessageRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    role: row.role as ProjectEditSessionMessageRecord['role'],
    kind: row.kind as ProjectEditSessionMessageRecord['kind'],
    text: row.text,
    createdAt: row.created_at,
    relatedSnapshotId: row.related_snapshot_id ?? undefined,
    relatedVersionId: row.related_version_id ?? undefined,
    relatedPreviewId: row.related_preview_id ?? undefined,
    metadata: metadata(row.metadata),
    mockOnly: row.mock_only,
  }
}

export function mapProjectEditSessionMessageRecordToInsertRow(record: ProjectEditSessionMessageRecord): ProjectEditSessionMessageRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    role: record.role,
    kind: record.kind,
    text: record.text,
    created_at: record.createdAt,
    related_snapshot_id: record.relatedSnapshotId ?? null,
    related_version_id: record.relatedVersionId ?? null,
    related_preview_id: record.relatedPreviewId ?? null,
    metadata: nullableObject(record.metadata),
    mock_only: record.mockOnly,
  }
}

export function mapProjectEditSessionSourceRowToRecord(row: ProjectEditSessionSourceRowLike): ProjectEditSessionSourceRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    mediaAssetId: row.media_asset_id,
    sourceOrderIndex: row.source_order_index,
    label: row.label ?? undefined,
    notes: row.notes,
    importance: row.importance as ProjectEditSessionSourceRecord['importance'],
    thumbnailUrl: row.thumbnail_url ?? undefined,
    previewUrl: row.preview_url ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    mimeType: row.mime_type ?? undefined,
    mockOnly: row.mock_only,
  }
}

export function mapProjectEditSessionSourceRecordToInsertRow(record: ProjectEditSessionSourceRecord): ProjectEditSessionSourceRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    media_asset_id: record.mediaAssetId,
    source_order_index: record.sourceOrderIndex,
    label: record.label ?? null,
    notes: record.notes,
    importance: record.importance,
    thumbnail_url: record.thumbnailUrl ?? null,
    preview_url: record.previewUrl ?? null,
    duration_seconds: record.durationSeconds ?? null,
    mime_type: record.mimeType ?? null,
    mock_only: record.mockOnly,
  }
}

export function mapProjectEditSessionMemoryRowToRecord(row: ProjectEditSessionMemoryRowLike): ProjectEditSessionMemoryRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    layer: row.layer as ProjectEditSessionMemoryRecord['layer'],
    summary: row.summary,
    facts: row.facts,
    preferences: row.preferences,
    warnings: row.warnings,
    updatedFromMessageId: row.updated_from_message_id ?? undefined,
    updatedFromRevisionId: row.updated_from_revision_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionMemoryRecordToInsertRow(record: ProjectEditSessionMemoryRecord): ProjectEditSessionMemoryRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    layer: record.layer,
    summary: record.summary,
    facts: record.facts,
    preferences: record.preferences,
    warnings: record.warnings,
    updated_from_message_id: record.updatedFromMessageId ?? null,
    updated_from_revision_id: record.updatedFromRevisionId ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionSnapshotRowToRecord(row: ProjectEditSessionSnapshotRowLike): ProjectEditSessionSnapshotRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    kind: row.kind as ProjectEditSessionSnapshotRecord['kind'],
    versionNumber: row.version_number ?? undefined,
    messageId: row.message_id ?? undefined,
    summary: row.summary,
    state: row.state,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
  }
}

export function mapProjectEditSessionSnapshotRecordToInsertRow(record: ProjectEditSessionSnapshotRecord): ProjectEditSessionSnapshotRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    kind: record.kind,
    version_number: record.versionNumber ?? null,
    message_id: record.messageId ?? null,
    summary: record.summary,
    state: record.state,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
  }
}

export function mapProjectEditSessionVersionRowToRecord(row: ProjectEditSessionVersionRowLike): ProjectEditSessionVersionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    versionNumber: row.version_number,
    status: row.status as ProjectEditSessionVersionRecord['status'],
    name: row.name,
    summary: row.summary,
    createdFromSnapshotId: row.created_from_snapshot_id ?? undefined,
    createdFromMessageId: row.created_from_message_id ?? undefined,
    previewId: row.preview_id ?? undefined,
    approvalStatus: row.approval_status as ProjectEditSessionVersionRecord['approvalStatus'],
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionVersionRecordToInsertRow(record: ProjectEditSessionVersionRecord): ProjectEditSessionVersionRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    version_number: record.versionNumber,
    status: record.status,
    name: record.name,
    summary: record.summary,
    created_from_snapshot_id: record.createdFromSnapshotId ?? null,
    created_from_message_id: record.createdFromMessageId ?? null,
    preview_id: record.previewId ?? null,
    approval_status: record.approvalStatus,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionPreviewRowToRecord(row: ProjectEditSessionPreviewRowLike): ProjectEditSessionPreviewRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    versionId: row.version_id ?? undefined,
    status: row.status as ProjectEditSessionPreviewRecord['status'],
    thumbnailUrl: row.thumbnail_url ?? undefined,
    previewUrl: row.preview_url ?? undefined,
    aspectRatio: row.aspect_ratio as ProjectEditSessionPreviewRecord['aspectRatio'],
    durationSeconds: row.duration_seconds ?? undefined,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionPreviewRecordToInsertRow(record: ProjectEditSessionPreviewRecord): ProjectEditSessionPreviewRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    version_id: record.versionId ?? null,
    status: record.status,
    thumbnail_url: record.thumbnailUrl ?? null,
    preview_url: record.previewUrl ?? null,
    aspect_ratio: record.aspectRatio,
    duration_seconds: record.durationSeconds ?? null,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionRevisionRowToRecord(row: ProjectEditSessionRevisionRowLike): ProjectEditSessionRevisionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    requestedByMessageId: row.requested_by_message_id,
    summary: row.summary,
    userInstruction: row.user_instruction,
    resetsApproval: row.resets_approval,
    createdSnapshotId: row.created_snapshot_id ?? undefined,
    createdVersionId: row.created_version_id ?? undefined,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionRevisionRecordToInsertRow(record: ProjectEditSessionRevisionRecord): ProjectEditSessionRevisionRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    requested_by_message_id: record.requestedByMessageId,
    summary: record.summary,
    user_instruction: record.userInstruction,
    resets_approval: record.resetsApproval,
    created_snapshot_id: record.createdSnapshotId ?? null,
    created_version_id: record.createdVersionId ?? null,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionEventRowToRecord(row: ProjectEditSessionEventRowLike): ProjectEditSessionEventRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    eventType: row.event_type,
    summary: row.summary,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionEventRecordToInsertRow(record: ProjectEditSessionEventRecord): ProjectEditSessionEventRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    event_type: record.eventType,
    summary: record.summary,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function createProjectEditSessionRowMappingSummary(input: {
  tableName: string
  sourceId?: string
  mappedId?: string
}): ProjectEditSessionRowMappingSummary {
  return {
    tableName: input.tableName,
    sourceId: input.sourceId,
    mappedId: input.mappedId,
    ok: Boolean(input.sourceId && input.mappedId && input.sourceId === input.mappedId),
    warnings: input.sourceId === input.mappedId ? [] : [`Row mapping mismatch for ${input.tableName}.`],
  }
}
