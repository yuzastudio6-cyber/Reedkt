import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerRevisionRecord,
  ProjectEditBriefRecord,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefApplicationLogRowLike,
  ProjectEditBriefMarkerAttachmentRowLike,
  ProjectEditBriefMarkerConfirmationRowLike,
  ProjectEditBriefMarkerConflictRowLike,
  ProjectEditBriefMarkerIntentRowLike,
  ProjectEditBriefMarkerMessageRowLike,
  ProjectEditBriefMarkerRevisionRowLike,
  ProjectEditBriefMarkerRowLike,
  ProjectEditBriefRowLike,
  ProjectEditBriefRowMappingSummary,
  ProjectEditSessionExportSettingsRowLike,
} from '../../types/project-edit-brief-repository'

function metadata(value: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  return value ?? undefined
}

function nullableObject(value: Record<string, unknown> | undefined): Record<string, unknown> | null {
  return value ?? null
}

export function mapProjectEditBriefRowToRecord(row: ProjectEditBriefRowLike): ProjectEditBriefRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    status: row.status as ProjectEditBriefRecord['status'],
    availability: row.availability as ProjectEditBriefRecord['availability'],
    title: row.title,
    summary: row.summary ?? undefined,
    markerCount: row.marker_count,
    confirmedMarkerCount: row.confirmed_marker_count,
    conflictCount: row.conflict_count,
    needsAssetCount: row.needs_asset_count,
    needsClarificationCount: row.needs_clarification_count,
    exportSettingsId: row.export_settings_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at ?? undefined,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefRecordToInsertRow(record: ProjectEditBriefRecord): ProjectEditBriefRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    status: record.status,
    availability: record.availability,
    title: record.title,
    summary: record.summary ?? null,
    marker_count: record.markerCount,
    confirmed_marker_count: record.confirmedMarkerCount,
    conflict_count: record.conflictCount,
    needs_asset_count: record.needsAssetCount,
    needs_clarification_count: record.needsClarificationCount,
    export_settings_id: record.exportSettingsId ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    last_opened_at: record.lastOpenedAt ?? null,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerRowToRecord(row: ProjectEditBriefMarkerRowLike): ProjectEditBriefMarkerRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerType: row.marker_type as ProjectEditBriefMarkerRecord['markerType'],
    status: row.status as ProjectEditBriefMarkerRecord['status'],
    priority: row.priority as ProjectEditBriefMarkerRecord['priority'],
    timeMode: row.time_mode as ProjectEditBriefMarkerRecord['timeMode'],
    startTimeSeconds: row.start_time_seconds,
    endTimeSeconds: row.end_time_seconds ?? undefined,
    title: row.title,
    userNote: row.user_note,
    aiMode: row.ai_mode as ProjectEditBriefMarkerRecord['aiMode'],
    intentId: row.intent_id ?? undefined,
    attachmentCount: row.attachment_count,
    messageCount: row.message_count,
    qaStatus: row.qa_status as ProjectEditBriefMarkerRecord['qaStatus'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerRecordToInsertRow(record: ProjectEditBriefMarkerRecord): ProjectEditBriefMarkerRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_type: record.markerType,
    status: record.status,
    priority: record.priority,
    time_mode: record.timeMode,
    start_time_seconds: record.startTimeSeconds,
    end_time_seconds: record.endTimeSeconds ?? null,
    title: record.title,
    user_note: record.userNote,
    ai_mode: record.aiMode,
    intent_id: record.intentId ?? null,
    attachment_count: record.attachmentCount,
    message_count: record.messageCount,
    qa_status: record.qaStatus,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerAttachmentRowToRecord(row: ProjectEditBriefMarkerAttachmentRowLike): ProjectEditBriefMarkerAttachmentRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    attachmentKind: row.attachment_kind as ProjectEditBriefMarkerAttachmentRecord['attachmentKind'],
    status: row.status as ProjectEditBriefMarkerAttachmentRecord['status'],
    label: row.label,
    mediaAssetId: row.media_asset_id ?? undefined,
    referenceUrl: row.reference_url ?? undefined,
    referenceLabel: row.reference_label ?? undefined,
    notes: row.notes,
    previewLabel: row.preview_label ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapProjectEditBriefMarkerAttachmentRecordToInsertRow(record: ProjectEditBriefMarkerAttachmentRecord): ProjectEditBriefMarkerAttachmentRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    attachment_kind: record.attachmentKind,
    status: record.status,
    label: record.label,
    media_asset_id: record.mediaAssetId ?? null,
    reference_url: record.referenceUrl ?? null,
    reference_label: record.referenceLabel ?? null,
    notes: record.notes,
    preview_label: record.previewLabel ?? null,
    duration_seconds: record.durationSeconds ?? null,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }
}

export function mapProjectEditBriefMarkerMessageRowToRecord(row: ProjectEditBriefMarkerMessageRowLike): ProjectEditBriefMarkerMessageRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    role: row.role as ProjectEditBriefMarkerMessageRecord['role'],
    kind: row.kind as ProjectEditBriefMarkerMessageRecord['kind'],
    text: row.text,
    createdAt: row.created_at,
    relatedIntentId: row.related_intent_id ?? undefined,
    relatedAttachmentId: row.related_attachment_id ?? undefined,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerMessageRecordToInsertRow(record: ProjectEditBriefMarkerMessageRecord): ProjectEditBriefMarkerMessageRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    role: record.role,
    kind: record.kind,
    text: record.text,
    created_at: record.createdAt,
    related_intent_id: record.relatedIntentId ?? null,
    related_attachment_id: record.relatedAttachmentId ?? null,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerIntentRowToRecord(row: ProjectEditBriefMarkerIntentRowLike): ProjectEditBriefMarkerIntentRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    action: row.action as ProjectEditBriefMarkerIntentRecord['action'],
    status: row.status as ProjectEditBriefMarkerIntentRecord['status'],
    instruction: row.instruction,
    timeRangeLabel: row.time_range_label,
    startTimeSeconds: row.start_time_seconds,
    endTimeSeconds: row.end_time_seconds ?? undefined,
    visualBehavior: row.visual_behavior as ProjectEditBriefMarkerIntentRecord['visualBehavior'],
    audioBehavior: row.audio_behavior as ProjectEditBriefMarkerIntentRecord['audioBehavior'],
    captionBehavior: row.caption_behavior as ProjectEditBriefMarkerIntentRecord['captionBehavior'],
    assetRequirement: row.asset_requirement ?? undefined,
    providedAssetIds: row.provided_asset_ids,
    priority: row.priority as ProjectEditBriefMarkerIntentRecord['priority'],
    confidence: row.confidence as ProjectEditBriefMarkerIntentRecord['confidence'],
    blockingNeeds: row.blocking_needs,
    doNotCopyNotes: row.do_not_copy_notes,
    plannerHints: row.planner_hints,
    latestUserMessageId: row.latest_user_message_id ?? undefined,
    latestConfirmationId: row.latest_confirmation_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerIntentRecordToInsertRow(record: ProjectEditBriefMarkerIntentRecord): ProjectEditBriefMarkerIntentRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    action: record.action,
    status: record.status,
    instruction: record.instruction,
    time_range_label: record.timeRangeLabel,
    start_time_seconds: record.startTimeSeconds,
    end_time_seconds: record.endTimeSeconds ?? null,
    visual_behavior: record.visualBehavior,
    audio_behavior: record.audioBehavior,
    caption_behavior: record.captionBehavior,
    asset_requirement: record.assetRequirement ?? null,
    provided_asset_ids: record.providedAssetIds,
    priority: record.priority,
    confidence: record.confidence,
    blocking_needs: record.blockingNeeds,
    do_not_copy_notes: record.doNotCopyNotes,
    planner_hints: record.plannerHints,
    latest_user_message_id: record.latestUserMessageId ?? null,
    latest_confirmation_id: record.latestConfirmationId ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerConfirmationRowToRecord(row: ProjectEditBriefMarkerConfirmationRowLike): ProjectEditBriefMarkerConfirmationRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    intentId: row.intent_id,
    summary: row.summary,
    confirmedByUser: row.confirmed_by_user,
    aiMode: row.ai_mode as ProjectEditBriefMarkerConfirmationRecord['aiMode'],
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerConfirmationRecordToInsertRow(record: ProjectEditBriefMarkerConfirmationRecord): ProjectEditBriefMarkerConfirmationRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    intent_id: record.intentId,
    summary: record.summary,
    confirmed_by_user: record.confirmedByUser,
    ai_mode: record.aiMode,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerConflictRowToRecord(row: ProjectEditBriefMarkerConflictRowLike): ProjectEditBriefMarkerConflictRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    relatedMarkerId: row.related_marker_id ?? undefined,
    qaStatus: row.qa_status as ProjectEditBriefMarkerConflictRecord['qaStatus'],
    title: row.title,
    summary: row.summary,
    recommendedResolution: row.recommended_resolution,
    blocksPlan: row.blocks_plan,
    requiresUserReview: row.requires_user_review,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerConflictRecordToInsertRow(record: ProjectEditBriefMarkerConflictRecord): ProjectEditBriefMarkerConflictRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    related_marker_id: record.relatedMarkerId ?? null,
    qa_status: record.qaStatus,
    title: record.title,
    summary: record.summary,
    recommended_resolution: record.recommendedResolution,
    blocks_plan: record.blocksPlan,
    requires_user_review: record.requiresUserReview,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefMarkerRevisionRowToRecord(row: ProjectEditBriefMarkerRevisionRowLike): ProjectEditBriefMarkerRevisionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id,
    previousIntentId: row.previous_intent_id ?? undefined,
    newIntentId: row.new_intent_id ?? undefined,
    summary: row.summary,
    reason: row.reason,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefMarkerRevisionRecordToInsertRow(record: ProjectEditBriefMarkerRevisionRecord): ProjectEditBriefMarkerRevisionRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId,
    previous_intent_id: record.previousIntentId ?? null,
    new_intent_id: record.newIntentId ?? null,
    summary: record.summary,
    reason: record.reason,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditBriefApplicationLogRowToRecord(row: ProjectEditBriefApplicationLogRowLike): ProjectEditBriefApplicationLogRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    briefId: row.brief_id,
    markerId: row.marker_id ?? undefined,
    summary: row.summary,
    appliedToPlan: row.applied_to_plan,
    createdAt: row.created_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditBriefApplicationLogRecordToInsertRow(record: ProjectEditBriefApplicationLogRecord): ProjectEditBriefApplicationLogRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    brief_id: record.briefId,
    marker_id: record.markerId ?? null,
    summary: record.summary,
    applied_to_plan: record.appliedToPlan,
    created_at: record.createdAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function mapProjectEditSessionExportSettingsRowToRecord(row: ProjectEditSessionExportSettingsRowLike): ProjectEditSessionExportSettingsRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    source: row.source as ProjectEditSessionExportSettingsRecord['source'],
    platformTarget: row.platform_target as ProjectEditSessionExportSettingsRecord['platformTarget'],
    aspectRatio: row.aspect_ratio as ProjectEditSessionExportSettingsRecord['aspectRatio'],
    customAspectRatio: row.custom_aspect_ratio as ProjectEditSessionExportSettingsRecord['customAspectRatio'],
    resolution: row.resolution as ProjectEditSessionExportSettingsRecord['resolution'],
    frameRate: row.frame_rate as ProjectEditSessionExportSettingsRecord['frameRate'],
    format: row.format as ProjectEditSessionExportSettingsRecord['format'],
    codec: row.codec as ProjectEditSessionExportSettingsRecord['codec'],
    audioCodec: row.audio_codec as ProjectEditSessionExportSettingsRecord['audioCodec'],
    audioLoudnessTarget: row.audio_loudness_target ?? undefined,
    captionSafeArea: row.caption_safe_area,
    safeZonePreset: row.safe_zone_preset ?? undefined,
    deliveryPreset: row.delivery_preset as ProjectEditSessionExportSettingsRecord['deliveryPreset'],
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockOnly: row.mock_only,
    metadata: metadata(row.metadata),
  }
}

export function mapProjectEditSessionExportSettingsRecordToInsertRow(record: ProjectEditSessionExportSettingsRecord): ProjectEditSessionExportSettingsRowLike {
  return {
    id: record.id,
    project_id: record.projectId,
    edit_session_id: record.editSessionId,
    source: record.source,
    platform_target: record.platformTarget,
    aspect_ratio: record.aspectRatio,
    custom_aspect_ratio: record.customAspectRatio ?? null,
    resolution: record.resolution,
    frame_rate: record.frameRate,
    format: record.format,
    codec: record.codec,
    audio_codec: record.audioCodec,
    audio_loudness_target: record.audioLoudnessTarget ?? null,
    caption_safe_area: record.captionSafeArea,
    safe_zone_preset: record.safeZonePreset ?? null,
    delivery_preset: record.deliveryPreset,
    summary: record.summary,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    mock_only: record.mockOnly,
    metadata: nullableObject(record.metadata),
  }
}

export function createProjectEditBriefRowMappingSummary(input: {
  tableName: string
  sourceId?: string
  mappedId?: string
  ok?: boolean
  warnings?: string[]
}): ProjectEditBriefRowMappingSummary {
  return {
    tableName: input.tableName,
    sourceId: input.sourceId,
    mappedId: input.mappedId,
    ok: input.ok ?? input.sourceId === input.mappedId,
    warnings: input.warnings ?? [],
  }
}
