import type { ProjectEditBriefBackendLocalRecord } from './project-edit-brief-backend-local'
import type {
  ProjectEditPlanApprovalModel,
  ProjectEditPlanBackendApprovalResult,
  ProjectEditPlanBackendLocalRecord,
} from './project-edit-plan-approval'
import type {
  ProjectSourceVideoEditAssemblySummary,
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBriefLineage,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalFinalExportResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQACheck,
  ProjectSourceVideoProfessionalQACheckId,
  ProjectSourceVideoProfessionalQAResult,
} from '../types/project-source-video'
import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionRecord,
  ProjectEditSessionStatus,
} from '../types/project-edit-session'

type BackendLocalCheckpoint = {
  checkpointKind?: string
  recordedAt?: string
  status?: ProjectEditSessionStatus
  approvalStatus?: ProjectEditSessionApprovalStatus
  sourceMediaAssetId?: string
  latestSnapshotId?: string
  latestPreviewId?: string
  latestPreviewUrl?: string
  metadata?: Record<string, unknown>
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function checkpointValue(session: ProjectEditSessionRecord | undefined, key: string): BackendLocalCheckpoint | undefined {
  return objectValue(session?.metadata?.[key]) as BackendLocalCheckpoint | undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function briefLineageValue(value: unknown): ProjectSourceVideoBriefLineage | undefined {
  const record = objectValue(value)
  if (!record) return undefined
  const briefId = stringValue(record.briefId)
  const revisionNumber = numberValue(record.revisionNumber)
  const briefFingerprint = stringValue(record.briefFingerprint)
  if (!briefId || !revisionNumber || !briefFingerprint) return undefined
  return {
    briefId,
    revisionNumber,
    briefFingerprint,
  }
}

function outputFrameValue(value: unknown): ProjectSourceVideoEditAssemblySummary['outputFrame'] | undefined {
  const record = objectValue(value)
  if (!record) return undefined
  const aspectRatio = stringValue(record.aspectRatio)
  const platformTarget = stringValue(record.platformTarget)
  const width = numberValue(record.width)
  const height = numberValue(record.height)
  const source = stringValue(record.source)
  if (!aspectRatio || !platformTarget || !width || !height || !source || record.confirmed !== true) return undefined
  return {
    aspectRatio,
    platformTarget,
    width,
    height,
    confirmed: true,
    source,
  }
}

function editAssemblyValue(value: unknown): ProjectSourceVideoEditAssemblySummary | undefined {
  const record = objectValue(value)
  if (!record) return undefined
  const planId = stringValue(record.planId)
  const briefLineage = briefLineageValue(record.briefLineage)
  const title = stringValue(record.title)
  const summary = stringValue(record.summary)
  const mode = stringValue(record.mode)
  const rawSteps = Array.isArray(record.steps) ? record.steps : []
  const steps = rawSteps
    .map((step) => {
      const stepRecord = objectValue(step)
      const label = stringValue(stepRecord?.label)
      const stepSummary = stringValue(stepRecord?.summary)
      return label && stepSummary ? { label, summary: stepSummary } : undefined
    })
    .filter(Boolean) as ProjectSourceVideoEditAssemblySummary['steps']
  const operationsApplied = Array.isArray(record.operationsApplied)
    ? record.operationsApplied.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  const professionalOperationLabels = Array.isArray(record.professionalOperationLabels)
    ? record.professionalOperationLabels.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : undefined
  const requiredQaChecks = Array.isArray(record.requiredQaChecks)
    ? record.requiredQaChecks.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : undefined
  const planStepCount = numberValue(record.planStepCount) ?? steps.length

  if (!planId || !briefLineage || !title || !summary || (mode !== 'clean_internal_preview' && mode !== 'private_final_export') || steps.length === 0) {
    return undefined
  }

  return {
    planId,
    briefLineage,
    title,
    summary,
    steps,
    sourceDurationSeconds: numberValue(record.sourceDurationSeconds),
    sourceAspectRatio: stringValue(record.sourceAspectRatio),
    outputFrame: outputFrameValue(record.outputFrame),
    mode,
    operationsApplied,
    professionalOperationCount: numberValue(record.professionalOperationCount),
    professionalOperationLabels,
    requiredQaChecks,
    planStepCount,
    productReady: false,
  }
}

function professionalQAValue(value: unknown): ProjectSourceVideoProfessionalQAResult | undefined {
  const record = objectValue(value)
  if (!record) return undefined
  const status = stringValue(record.status)
  const blockers = Array.isArray(record.blockers)
    ? record.blockers.filter((item): item is ProjectSourceVideoProfessionalQACheckId => typeof item === 'string')
    : []
  const checks = Array.isArray(record.checks)
    ? record.checks.map((item) => {
        const checkRecord = objectValue(item)
        const id = stringValue(checkRecord?.id)
        const label = stringValue(checkRecord?.label)
        const blocker = stringValue(checkRecord?.blocker)
        const passed = checkRecord?.passed === true
        if (!id || !label || !blocker) return undefined
        return { id, label, blocker, passed } as ProjectSourceVideoProfessionalQACheck
      }).filter(Boolean) as ProjectSourceVideoProfessionalQACheck[]
    : []
  const id = stringValue(record.id)
  const workspaceId = stringValue(record.workspaceId)
  const editPlanId = stringValue(record.editPlanId)
  const renderId = stringValue(record.renderId)
  const approvedPlanSnapshotId = stringValue(record.approvedPlanSnapshotId)
  const creditReservationId = stringValue(record.creditReservationId)
  const previewReviewId = stringValue(record.previewReviewId)
  const sourceStorageObjectRecordId = stringValue(record.sourceStorageObjectRecordId) ?? 'source-storage-missing'
  const briefLineage = briefLineageValue(record.briefLineage)
  const createdAt = stringValue(record.createdAt)
  if (!id || !workspaceId || !editPlanId || !renderId || !approvedPlanSnapshotId || !creditReservationId || !previewReviewId || !briefLineage || !createdAt || (status !== 'passed' && status !== 'blocked')) {
    return undefined
  }

  return {
    id,
    workspaceId,
    editPlanId,
    renderId,
    approvedPlanSnapshotId,
    creditReservationId,
    previewReviewId,
    sourceStorageObjectRecordId,
    briefLineage,
    status,
    createdAt,
    checks,
    blockers,
    finalExportStarted: false,
    publicDeliveryEnabled: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    mediaProcessingStarted: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: ['Restored professional QA checkpoint metadata from the edit-session checkpoint.'],
  }
}

export function createSourceUploadCheckpointMetadata(result: ProjectSourceVideoBackendUploadResult): Record<string, unknown> {
  return {
    uploadIntentId: result.uploadIntentId,
    storageObjectRecordId: result.storageObjectRecordId,
    mediaAssetId: result.mediaAssetId,
    bucketName: result.bucketName,
    objectPath: result.objectPath,
    fileName: result.fileName,
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    checksumSha256: result.checksumSha256,
    uploadedAt: result.uploadedAt,
    backendLocalUploadMade: true,
    browserFileBytesSent: result.browserFileBytesSent,
    fileBytesReadByBackend: result.fileBytesReadByBackend,
    storageWriteMade: result.storageWriteMade,
    mediaProcessingStarted: false,
    productReady: false,
  }
}

export function createBriefSavedCheckpointMetadata(input: {
  brief: ProjectEditBriefBackendLocalRecord
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
}): Record<string, unknown> {
  return {
    briefId: input.brief.id,
    briefRevisionNumber: input.brief.revisionNumber,
    sourceStorageObjectRecordId: input.sourceVideoUploadResult?.storageObjectRecordId,
    backendLocalBriefStored: true,
    productReady: false,
  }
}

export function createBriefDraftChangedCheckpointMetadata(input: {
  previousBrief?: ProjectEditBriefBackendLocalRecord
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
}): Record<string, unknown> {
  return {
    resetReason: 'brief_changed',
    previousBriefId: input.previousBrief?.id,
    previousBriefRevisionNumber: input.previousBrief?.revisionNumber,
    preservedSourceStorageObjectRecordId: input.sourceVideoUploadResult?.storageObjectRecordId,
    preservedSourceMediaAssetId: input.sourceVideoUploadResult?.mediaAssetId,
    changedAt: new Date().toISOString(),
    backendLocalBriefDraftChanged: true,
    downstreamPlanPreviewQaExportCleared: true,
    sourceUploadPreserved: Boolean(input.sourceVideoUploadResult),
    noMediaProcessingStarted: true,
    noProviderCallMade: true,
    noRenderStarted: true,
    noCreditReservedOrSpent: true,
    productReady: false,
  }
}

export function createPlanApprovedCheckpointMetadata(result: ProjectEditPlanBackendApprovalResult): Record<string, unknown> {
  return {
    editPlanId: result.localEditPlan.editPlanId,
    creditEstimateId: result.localEditPlan.creditEstimateId,
    localEditPlanRecordId: result.localEditPlan.id,
    approvedAt: result.localEditPlan.approvedAt,
    briefLineage: result.localEditPlan.briefLineage,
    backendLocalPlanStored: true,
    providerCallMade: false,
    productReady: false,
  }
}

export function createPreviewReadyCheckpointMetadata(result: ProjectSourceVideoLocalEditPreviewResult): Record<string, unknown> {
  return {
    editPlanId: result.editPlanId,
    briefLineage: result.briefLineage,
    creditEstimateId: result.creditEstimateId,
    approvedPlanSnapshotId: result.approvedPlanSnapshotId,
    creditApprovalId: result.creditApprovalId,
    creditReservationId: result.creditReservationId,
    renderJobId: result.renderJobId,
    renderId: result.renderId,
    sourceStorageObjectRecordId: result.sourceStorageObjectRecordId,
    previewStorageObjectId: result.previewStorageObjectId,
    outputBucketName: result.outputBucketName,
    outputObjectPath: result.outputObjectPath,
    durationSeconds: result.durationSeconds,
    sizeBytes: result.sizeBytes,
    checksumSha256: result.checksumSha256,
    editAssembly: result.editAssembly,
    qwenMainBrainLabel: result.qwenMainBrainLabel,
    previewOnly: true,
    productReady: false,
  }
}

export function createPreviewReviewedCheckpointMetadata(result: ProjectSourceVideoPreviewReviewResult): Record<string, unknown> {
  return {
    previewReviewId: result.id,
    workspaceId: result.workspaceId,
    renderId: result.renderId,
    reviewStatus: result.reviewStatus,
    notes: result.notes,
    finalExportStarted: false,
    productReady: false,
  }
}

export function createProfessionalQACheckpointMetadata(result: ProjectSourceVideoProfessionalQAResult): Record<string, unknown> {
  return {
    professionalQAId: result.id,
    workspaceId: result.workspaceId,
    editPlanId: result.editPlanId,
    renderId: result.renderId,
    approvedPlanSnapshotId: result.approvedPlanSnapshotId,
    creditReservationId: result.creditReservationId,
    previewReviewId: result.previewReviewId,
    sourceStorageObjectRecordId: result.sourceStorageObjectRecordId,
    briefLineage: result.briefLineage,
    status: result.status,
    createdAt: result.createdAt,
    checks: result.checks,
    blockers: result.blockers,
    finalExportStarted: false,
    publicDeliveryEnabled: false,
    productReady: false,
  }
}

export function createFinalExportReadyCheckpointMetadata(result: ProjectSourceVideoLocalFinalExportResult): Record<string, unknown> {
  return {
    editPlanId: result.editPlanId,
    briefLineage: result.briefLineage,
    approvedPlanSnapshotId: result.approvedPlanSnapshotId,
    creditReservationId: result.creditReservationId,
    renderJobId: result.renderJobId,
    renderId: result.renderId,
    sourceStorageObjectRecordId: result.sourceStorageObjectRecordId,
    finalExportStorageObjectId: result.finalExportStorageObjectId,
    qaReportId: result.qaReportId,
    outputBucketName: result.outputBucketName,
    outputObjectPath: result.outputObjectPath,
    durationSeconds: result.durationSeconds,
    sizeBytes: result.sizeBytes,
    checksumSha256: result.checksumSha256,
    editAssembly: result.editAssembly,
    previewReviewId: result.previewReviewId,
    professionalQA: result.professionalQA,
    finalExportStarted: result.finalExportStarted,
    publicDeliveryEnabled: result.publicDeliveryEnabled,
    productReady: false,
  }
}

export function restoreBackendUploadResult(session: ProjectEditSessionRecord | undefined): ProjectSourceVideoBackendUploadResult | undefined {
  const checkpoint = checkpointValue(session, 'backendLocalSourceUpload')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata) return undefined

  const storageObjectRecordId = stringValue(metadata.storageObjectRecordId)
  const bucketName = stringValue(metadata.bucketName)
  const objectPath = stringValue(metadata.objectPath)
  const fileName = stringValue(metadata.fileName)
  const mimeType = stringValue(metadata.mimeType)
  const sizeBytes = numberValue(metadata.sizeBytes)
  if (!storageObjectRecordId || !bucketName || !objectPath || !fileName || !mimeType || !sizeBytes) return undefined

  return {
    status: 'uploaded',
    uploadIntentId: stringValue(metadata.uploadIntentId) ?? 'backend-local-restored-upload-intent',
    storageObjectRecordId,
    mediaAssetId: stringValue(metadata.mediaAssetId) ?? checkpoint?.sourceMediaAssetId,
    bucketName,
    objectPath,
    fileName,
    mimeType,
    sizeBytes,
    checksumSha256: stringValue(metadata.checksumSha256),
    uploadedAt: stringValue(metadata.uploadedAt) ?? checkpoint?.recordedAt ?? new Date(0).toISOString(),
    backendLocalUploadMade: true,
    browserFileBytesSent: true,
    fileBytesReadByBackend: true,
    storageWriteMade: true,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    providerCallMade: false,
    renderJobCreated: false,
    exportJobCreated: false,
    creditReservedOrSpent: false,
    productReady: false,
    warnings: ['Restored backend-local source upload metadata from the edit-session checkpoint.'],
  }
}

export function restorePreviewResult(session: ProjectEditSessionRecord | undefined): ProjectSourceVideoLocalEditPreviewResult | undefined {
  const checkpoint = checkpointValue(session, 'backendLocalPreview')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata) return undefined

  const editPlanId = stringValue(metadata.editPlanId)
  const creditEstimateId = stringValue(metadata.creditEstimateId)
  const approvedPlanSnapshotId = stringValue(metadata.approvedPlanSnapshotId) ?? checkpoint?.latestSnapshotId
  const creditApprovalId = stringValue(metadata.creditApprovalId)
  const creditReservationId = stringValue(metadata.creditReservationId)
  const renderJobId = stringValue(metadata.renderJobId)
  const sourceStorageObjectRecordId = stringValue(metadata.sourceStorageObjectRecordId)
  const briefLineage = briefLineageValue(metadata.briefLineage)
  if (!editPlanId || !briefLineage || !creditEstimateId || !approvedPlanSnapshotId || !creditApprovalId || !creditReservationId || !renderJobId || !sourceStorageObjectRecordId) {
    return undefined
  }

  return {
    status: 'preview_ready',
    editPlanId,
    briefLineage,
    creditEstimateId,
    approvedPlanSnapshotId,
    creditApprovalId,
    creditReservationId,
    renderJobId,
    renderId: stringValue(metadata.renderId) ?? checkpoint?.latestPreviewId,
    sourceStorageObjectRecordId,
    previewStorageObjectId: stringValue(metadata.previewStorageObjectId),
    outputBucketName: stringValue(metadata.outputBucketName),
    outputObjectPath: stringValue(metadata.outputObjectPath),
    durationSeconds: numberValue(metadata.durationSeconds),
    sizeBytes: numberValue(metadata.sizeBytes),
    checksumSha256: stringValue(metadata.checksumSha256),
    editAssembly: editAssemblyValue(metadata.editAssembly),
    qwenMainBrainLabel: stringValue(metadata.qwenMainBrainLabel) ?? 'ReEditPro Qwen main brain',
    approvedSnapshotCreated: true,
    mockCreditApprovalCreated: true,
    mockCreditReservationCreated: true,
    localPlanApproved: true,
    workerJobCreated: true,
    mediaProcessingStarted: true,
    renderJobCreated: true,
    previewOnly: true,
    providerCallMade: false,
    qwenCallMade: false,
    exportJobCreated: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: ['Restored preview-only internal smoke metadata from the edit-session checkpoint.'],
  }
}

export function restorePreviewReviewResult(session: ProjectEditSessionRecord | undefined): ProjectSourceVideoPreviewReviewResult | undefined {
  const checkpoint = checkpointValue(session, 'backendLocalPreviewReview')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata) return undefined

  const reviewStatus = stringValue(metadata.reviewStatus)
  const renderId = stringValue(metadata.renderId) ?? checkpoint?.latestPreviewId
  const reviewId = stringValue(metadata.previewReviewId)
  if (!reviewId || !renderId || (reviewStatus !== 'approved' && reviewStatus !== 'changes_requested')) return undefined

  return {
    id: reviewId,
    renderId,
    workspaceId: stringValue(metadata.workspaceId) ?? 'mock-workspace',
    reviewStatus,
    notes: stringValue(metadata.notes),
    createdAt: checkpoint?.recordedAt,
    mockOnly: true,
    finalExportStarted: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: ['Restored preview review metadata from the edit-session checkpoint.'],
  }
}

export function restoreProfessionalQAResult(session: ProjectEditSessionRecord | undefined): ProjectSourceVideoProfessionalQAResult | undefined {
  const checkpoint = checkpointValue(session, 'backendLocalProfessionalQA')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata) return undefined

  return professionalQAValue({
    ...metadata,
    id: stringValue(metadata.professionalQAId),
    createdAt: stringValue(metadata.createdAt) ?? checkpoint?.recordedAt,
  })
}

export function restoreFinalExportResult(session: ProjectEditSessionRecord | undefined): ProjectSourceVideoLocalFinalExportResult | undefined {
  const checkpoint = checkpointValue(session, 'backendLocalFinalExport')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata) return undefined

  const editPlanId = stringValue(metadata.editPlanId)
  const approvedPlanSnapshotId = stringValue(metadata.approvedPlanSnapshotId) ?? checkpoint?.latestSnapshotId
  const creditReservationId = stringValue(metadata.creditReservationId)
  const renderJobId = stringValue(metadata.renderJobId)
  const sourceStorageObjectRecordId = stringValue(metadata.sourceStorageObjectRecordId)
  const previewReviewId = stringValue(metadata.previewReviewId)
  const briefLineage = briefLineageValue(metadata.briefLineage)
  if (!editPlanId || !briefLineage || !approvedPlanSnapshotId || !creditReservationId || !renderJobId || !sourceStorageObjectRecordId || !previewReviewId) {
    return undefined
  }

  return {
    status: 'final_export_ready',
    editPlanId,
    briefLineage,
    approvedPlanSnapshotId,
    creditReservationId,
    renderJobId,
    renderId: stringValue(metadata.renderId),
    sourceStorageObjectRecordId,
    finalExportStorageObjectId: stringValue(metadata.finalExportStorageObjectId),
    qaReportId: stringValue(metadata.qaReportId),
    outputBucketName: stringValue(metadata.outputBucketName),
    outputObjectPath: stringValue(metadata.outputObjectPath),
    durationSeconds: numberValue(metadata.durationSeconds),
    sizeBytes: numberValue(metadata.sizeBytes),
    checksumSha256: stringValue(metadata.checksumSha256),
    editAssembly: editAssemblyValue(metadata.editAssembly),
    previewReviewId,
    professionalQA: professionalQAValue(metadata.professionalQA),
    finalExportStarted: true,
    publicDeliveryEnabled: false,
    providerCallMade: false,
    qwenCallMade: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: ['Restored private backend-local final export metadata from the edit-session checkpoint.'],
  }
}

export function createRestoredApprovedLocalPlan(input: {
  approvedPlan: ProjectEditPlanApprovalModel
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
  session?: ProjectEditSessionRecord
}): ProjectEditPlanBackendApprovalResult | undefined {
  const checkpoint = checkpointValue(input.session, 'backendLocalPlan')
  const metadata = objectValue(checkpoint?.metadata)
  if (!metadata || !input.approvedPlan.approved) return undefined
  const briefLineage = briefLineageValue(metadata.briefLineage)
  if (!briefLineage) return undefined

  const record: ProjectEditPlanBackendLocalRecord = {
    id: stringValue(metadata.localEditPlanRecordId) ?? 'backend-local-restored-edit-plan',
    editPlanId: stringValue(metadata.editPlanId) ?? input.approvedPlan.planId,
    creditEstimateId: stringValue(metadata.creditEstimateId) ?? `${input.approvedPlan.planId}-credit-estimate`,
    workspaceId: input.session?.workspaceId ?? 'mock-workspace',
    projectId: input.approvedPlan.projectId,
    editSessionId: input.approvedPlan.editSessionId,
    approvedAt: checkpoint?.recordedAt ?? new Date(0).toISOString(),
    status: 'approved',
    approvedLocalPlan: {
      approved: true,
      briefLineage,
      creditEstimate: input.approvedPlan.creditEstimate,
      operationManifest: input.approvedPlan.operationManifest,
      planId: input.approvedPlan.planId,
      steps: input.approvedPlan.steps,
      summary: input.approvedPlan.summary,
      title: input.approvedPlan.title,
    },
    briefLineage,
    source: {
      storageObjectRecordId: input.sourceVideoUploadResult.storageObjectRecordId,
      mediaAssetId: input.sourceVideoUploadResult.mediaAssetId,
      bucketName: input.sourceVideoUploadResult.bucketName,
      objectPath: input.sourceVideoUploadResult.objectPath,
      fileName: input.sourceVideoUploadResult.fileName,
      mimeType: input.sourceVideoUploadResult.mimeType,
      sizeBytes: input.sourceVideoUploadResult.sizeBytes,
      checksumSha256: input.sourceVideoUploadResult.checksumSha256,
    },
    backendLocalPlanStored: true,
    readbackVerified: true,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    mockOnly: true,
    warnings: ['Restored backend-local approved plan metadata from the edit-session checkpoint.'],
  }

  return {
    localEditPlan: record,
    readback: record,
    warnings: record.warnings,
  }
}
