import type { z } from 'zod'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  addEditBriefAttachmentSchema,
  appendEditBriefMarkerMessageSchema,
  buildEditBriefMarkerContextSchema,
  createEditBriefMarkerSchema,
  createEditBriefPlanHintsSchema,
  createEditBriefSchema,
  editBriefMarkerActionSchema,
  editBriefMarkerFieldsSchema,
  editBriefScopeIdSchema,
  lockEditBriefLifecycleSchema,
  runEditBriefQaSchema,
  setEditBriefExportSettingsSchema,
  setEditBriefMarkerIntentSchema,
  updateEditBriefMarkerSchema,
  updateEditBriefSchema,
} from '../validation/edit-brief-authority-schemas'
import {
  createEditBriefAuthorityId,
  editBriefAuthorityHash,
  editBriefPlanHintFingerprint,
  editBriefPlanInputHash,
  MAX_EDIT_BRIEF_ATTACHMENTS,
  MAX_EDIT_BRIEF_AUDIT_EVENTS,
  MAX_EDIT_BRIEF_CONTEXT_PACKAGES,
  MAX_EDIT_BRIEF_IDEMPOTENCY_RECORDS,
  MAX_EDIT_BRIEF_INTENTS,
  MAX_EDIT_BRIEF_MARKERS,
  MAX_EDIT_BRIEF_MESSAGES,
  MAX_EDIT_BRIEF_PLAN_HINT_PACKAGES,
  MAX_EDIT_BRIEF_QA_REPORTS,
  mutatePrivateEditBriefAuthorityAggregate,
  PREFERENCE_INSTRUCTION_PRIORITY,
  readPrivateEditBriefAuthorityAggregate,
  stableEditBriefAuthorityValue,
  type EditBriefAttachmentRecord,
  type EditBriefAuthorityScope,
  type EditBriefConflictRecord,
  type EditBriefMarkerContextPackage,
  type EditBriefMarkerIntentRecord,
  type EditBriefMarkerRecord,
  type EditBriefPlanHintPackage,
  type EditBriefPlanHintFingerprintPayload,
  type EditBriefPreferenceContext,
  type EditBriefQaFinding,
  type EditBriefQaReport,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import { createPreferenceIntelligenceService } from './preference-intelligence-service'
import { readPrivateEditAuthorityAggregate } from './private-edit-authority-store'
import { createProjectService } from './project-service'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const EDIT_BRIEF_AUTHORITY_CAPABILITY = {
  persistence: 'mock_local',
  briefAndMarkers: 'mock_local',
  contextAssembly: 'metadata_only',
  qa: 'metadata_only',
  planHints: 'metadata_only',
  plannerExecution: 'future_gated',
  providerExecution: 'future_gated',
  mediaWorkers: 'future_gated',
  renderAndExport: 'future_gated',
  creditMutation: 'future_gated',
  productionReady: false,
} as const

const DEFAULT_DO_NOT_COPY_RULES = [
  'Do not copy an exact shot sequence, caption wording, scene order, or distinctive reference composition.',
  'Do not copy creator identity, faces, logos, brand marks, watermarks, copyrighted music, or proprietary graphics.',
  'Transfer professional editing principles only and adapt them to this edit source and the latest explicit instruction.',
] as const

export interface EditBriefAuthorityPublicationBinding {
  schemaVersion: 'edit-brief-authority-publication-binding-v1'
  workspaceId: string
  projectId: string
  editSessionId: string
  aggregateRevision: number
  authorityWorkspaceRevision: number
  workspaceFingerprint: string
  authorityInputHash: string
  markerFingerprint: string
  confirmedMarkerFingerprint: string
  activeMarkerCount: number
  confirmedMarkerCount: number
  allActiveMarkersConfirmed: boolean
  outputFrameConfirmed: boolean
  qaReportId?: string
  qaStatus: EditBriefQaReport['status'] | 'not_run'
  qaIsCurrent: boolean
  openConflictCount: number
  conflictFingerprint: string
  planHintPackageId?: string
  planHintFingerprint?: string
  planHintReadiness: EditBriefPlanHintPackage['readiness'] | 'not_created'
  planInputQaStatus: EditBriefPlanHintPackage['planInputQaStatus'] | 'not_run'
  preferenceId?: string
  preferenceDNAId?: string
  preferenceDNAVersion?: number
  preferenceFingerprint?: string
  planHintsAreCurrent: boolean
  hasApprovalBlockers: boolean
  deterministicHash: string
}

type PreferenceContextResult = {
  applicationStatus: 'applied' | 'cleared' | 'not_selected'
  applicationVersion: number
  context?: EditBriefPreferenceContext['context']
  doNotCopyRules: string[]
  instructionPriority: typeof PREFERENCE_INSTRUCTION_PRIORITY
}

export function createEditBriefAuthorityService(context: ServiceContext) {
  return {
    async get(workspaceId: string, projectId: string, editSessionId: string) {
      const scope = await authorizeScope(context, workspaceId, projectId, editSessionId, 'read')
      const aggregate = await readPrivateEditBriefAuthorityAggregate(scope)
      return resultEnvelope({
        authority: aggregate ? cloneJson(aggregate) : undefined,
        aggregateRevision: aggregate?.revision ?? 0,
        optionalBriefPresent: Boolean(aggregate?.brief),
      })
    },

    async getPublicationBinding(workspaceId: string, projectId: string, editSessionId: string) {
      const scope = await authorizeScope(context, workspaceId, projectId, editSessionId, 'read')
      const aggregate = await readPrivateEditBriefAuthorityAggregate(scope)
      return resultEnvelope({
        binding: aggregate ? buildEditBriefAuthorityPublicationBinding(aggregate) : undefined,
        optionalBriefPresent: Boolean(aggregate?.brief),
      })
    },

    async createBrief(input: unknown) {
      const body = parse(createEditBriefSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('create_brief', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'create_brief', body.idempotencyKey, requestHash, 'brief', (id) => {
          if (aggregate.brief?.id !== id) throw replayUnavailable()
          return { brief: cloneJson(aggregate.brief), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          if (aggregate.brief) throw new ApiError('IDEMPOTENCY_CONFLICT', 'This edit already has an Edit Brief.', 409)
          assertMutationCapacity(aggregate)
          const brief = {
            id: createEditBriefAuthorityId('edit_brief'), revision: 1, fields: body.brief,
            createdAt: timestamp, updatedAt: timestamp,
          }
          aggregate.brief = brief
          for (const marker of aggregate.markers) marker.briefId = brief.id
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'create_brief', body.idempotencyKey, requestHash, brief.id, 'brief', timestamp)
          return { result: { brief: cloneJson(brief), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async updateBrief(input: unknown) {
      const body = parse(updateEditBriefSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('update_brief', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'update_brief', body.idempotencyKey, requestHash, 'brief', (id) => {
          if (aggregate.brief?.id !== id) throw replayUnavailable()
          return { brief: cloneJson(aggregate.brief), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const brief = requireBrief(aggregate)
          assertMutationCapacity(aggregate)
          brief.fields = {
            ...brief.fields,
            ...body.patch,
            audience: body.patch.audience === null ? undefined : body.patch.audience ?? brief.fields.audience,
            deliverable: body.patch.deliverable === null ? undefined : body.patch.deliverable ?? brief.fields.deliverable,
            additionalNotes: body.patch.additionalNotes === null ? undefined : body.patch.additionalNotes ?? brief.fields.additionalNotes,
          }
          brief.revision += 1
          brief.updatedAt = timestamp
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'update_brief', body.idempotencyKey, requestHash, brief.id, 'brief', timestamp)
          return { result: { brief: cloneJson(brief), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async setExportSettings(input: unknown) {
      const body = parse(setEditBriefExportSettingsSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('set_export_settings', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'set_export_settings', body.idempotencyKey, requestHash, 'export_settings', () => ({
          exportSettings: cloneJson(aggregate.exportSettings), markers: cloneJson(aggregate.markers),
          aggregateRevision: aggregate.revision, replayed: true,
        })),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          assertMutationCapacity(aggregate)
          const revision = (aggregate.exportSettings?.revision ?? 0) + 1
          aggregate.exportSettings = { ...body.settings, revision, updatedAt: timestamp }
          aggregate.markers = aggregate.markers.map((marker) => frameMarker(marker, aggregate.exportSettings!, timestamp))
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'set_export_settings', body.idempotencyKey, requestHash, `export-settings-v${revision}`, 'export_settings', timestamp)
          return {
            result: { exportSettings: cloneJson(aggregate.exportSettings), markers: cloneJson(aggregate.markers), aggregateRevision: aggregate.revision + 1, replayed: false },
            changed: true,
          }
        },
      })
      return resultEnvelope(result)
    },

    async createMarker(input: unknown) {
      const body = parse(createEditBriefMarkerSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('create_marker', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'create_marker', body.idempotencyKey, requestHash, 'marker', (id) => ({
          marker: cloneJson(requireMarker(aggregate, id)), aggregateRevision: aggregate.revision, replayed: true,
        })),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          if (aggregate.markers.length >= MAX_EDIT_BRIEF_MARKERS) throw capacityError('marker')
          assertMutationCapacity(aggregate)
          const marker = frameMarker({
            id: createEditBriefAuthorityId('edit_marker'), editSessionId: scope.editSessionId,
            briefId: aggregate.brief?.id, revision: 1, status: 'draft', ...body.marker,
            timingStatus: 'display_seconds_only', createdAt: timestamp, updatedAt: timestamp,
          }, aggregate.exportSettings, timestamp)
          aggregate.markers.push(marker)
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'create_marker', body.idempotencyKey, requestHash, marker.id, 'marker', timestamp)
          return { result: { marker: cloneJson(marker), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async updateMarker(input: unknown) {
      const body = parse(updateEditBriefMarkerSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('update_marker', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'update_marker', body.idempotencyKey, requestHash, 'marker', (id) => ({
          marker: cloneJson(requireMarker(aggregate, id)), aggregateRevision: aggregate.revision, replayed: true,
        })),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const marker = requireMarker(aggregate, body.markerId)
          if (marker.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived markers must be reopened before editing.', 409)
          assertMutationCapacity(aggregate)
          const markerPatch = { ...body.patch }
          if (markerPatch.endSeconds === null) delete markerPatch.endSeconds
          const merged = editBriefMarkerFieldsSchema.parse({
            markerType: marker.markerType, timeKind: marker.timeKind, startSeconds: marker.startSeconds,
            endSeconds: body.patch.endSeconds === null ? undefined : marker.endSeconds,
            priority: marker.priority, title: marker.title, note: marker.note,
            ...markerPatch,
          })
          Object.assign(marker, merged, { status: 'draft' as const, confirmedAt: undefined, revision: marker.revision + 1 })
          frameMarker(marker, aggregate.exportSettings, timestamp)
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'update_marker', body.idempotencyKey, requestHash, marker.id, 'marker', timestamp)
          return { result: { marker: cloneJson(marker), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async confirmMarker(input: unknown) {
      return markerStatusMutation(context, input, 'confirm_marker')
    },

    async archiveMarker(input: unknown) {
      return markerStatusMutation(context, input, 'archive_marker')
    },

    async reopenMarker(input: unknown) {
      return markerStatusMutation(context, input, 'reopen_marker')
    },

    async appendMarkerMessage(input: unknown) {
      const body = parse(appendEditBriefMarkerMessageSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('append_marker_message', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'append_marker_message', body.idempotencyKey, requestHash, 'marker_message', (id) => {
          const message = aggregate.markerMessages.find((entry) => entry.id === id)
          if (!message) throw replayUnavailable()
          return { message: cloneJson(message), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const marker = requireActiveMarker(aggregate, body.markerId)
          if (aggregate.markerMessages.length >= MAX_EDIT_BRIEF_MESSAGES) throw capacityError('marker message')
          if (body.clientMessageId && aggregate.markerMessages.some((entry) => entry.clientMessageId === body.clientMessageId)) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'clientMessageId already belongs to another marker message.', 409)
          }
          assertMutationCapacity(aggregate)
          const message = {
            id: createEditBriefAuthorityId('marker_message'), markerId: body.markerId, role: body.role,
            content: body.content, clientMessageId: body.clientMessageId, runtimeState: body.runtimeState, createdAt: timestamp,
          }
          aggregate.markerMessages.push(message)
          resetMarkerConfirmation(marker, timestamp)
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'append_marker_message', body.idempotencyKey, requestHash, message.id, 'marker_message', timestamp)
          return { result: { message: cloneJson(message), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async setMarkerIntent(input: unknown) {
      const body = parse(setEditBriefMarkerIntentSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('set_marker_intent', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'set_marker_intent', body.idempotencyKey, requestHash, 'marker_intent', (id) => {
          const intent = aggregate.markerIntents.find((entry) => entry.id === id)
          if (!intent) throw replayUnavailable()
          return { intent: cloneJson(intent), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const marker = requireActiveMarker(aggregate, body.markerId)
          const existing = aggregate.markerIntents.find((entry) => entry.markerId === marker.id)
          if (!existing && aggregate.markerIntents.length >= MAX_EDIT_BRIEF_INTENTS) throw capacityError('marker intent')
          assertMutationCapacity(aggregate)
          const intent: EditBriefMarkerIntentRecord = {
            ...body.intent, id: existing?.id ?? createEditBriefAuthorityId('marker_intent'), markerId: marker.id,
            revision: (existing?.revision ?? 0) + 1, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
          }
          if (existing) aggregate.markerIntents.splice(aggregate.markerIntents.indexOf(existing), 1, intent)
          else aggregate.markerIntents.push(intent)
          resetMarkerConfirmation(marker, timestamp)
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'set_marker_intent', body.idempotencyKey, requestHash, intent.id, 'marker_intent', timestamp)
          return { result: { intent: cloneJson(intent), marker: cloneJson(marker), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async addAttachment(input: unknown) {
      const body = parse(addEditBriefAttachmentSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('add_attachment', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'add_attachment', body.idempotencyKey, requestHash, 'attachment', (id) => {
          const attachment = aggregate.attachments.find((entry) => entry.id === id)
          if (!attachment) throw replayUnavailable()
          return { attachment: cloneJson(attachment), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const marker = requireActiveMarker(aggregate, body.markerId)
          if (aggregate.attachments.length >= MAX_EDIT_BRIEF_ATTACHMENTS) throw capacityError('attachment')
          if (aggregate.attachments.some((entry) => entry.markerId === body.markerId && entry.privateAssetId === body.attachment.privateAssetId)) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'This private asset is already attached to the marker.', 409)
          }
          assertMutationCapacity(aggregate)
          const attachment: EditBriefAttachmentRecord = {
            ...body.attachment, id: createEditBriefAuthorityId('marker_attachment'), markerId: body.markerId, createdAt: timestamp,
          }
          aggregate.attachments.push(attachment)
          resetMarkerConfirmation(marker, timestamp)
          invalidateDerived(aggregate)
          appendMutationEvidence(aggregate, scope, 'add_attachment', body.idempotencyKey, requestHash, attachment.id, 'attachment', timestamp)
          return { result: { attachment: cloneJson(attachment), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async buildMarkerContext(input: unknown) {
      const body = parse(buildEditBriefMarkerContextSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const preferenceContext = await loadPreferenceContext(context, scope, 'marker_chat')
      const requestHash = mutationHash('build_marker_context', scope, { ...body, preferenceContext })
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'build_marker_context', body.idempotencyKey, requestHash, 'context_package', (id) => {
          const contextPackage = aggregate.contextPackages.find((entry) => entry.id === id)
          if (!contextPackage) throw replayUnavailable()
          return { contextPackage: cloneJson(contextPackage), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          const marker = requireActiveMarker(aggregate, body.markerId)
          assertMutationCapacity(aggregate)
          const nearbyMarkers = aggregate.markers
            .filter((candidate) => candidate.id !== marker.id && candidate.status !== 'archived' && markerDistanceSeconds(marker, candidate) <= body.nearbyWindowSeconds)
            .sort((left, right) => left.startSeconds - right.startSeconds)
            .slice(0, 50)
            .map((candidate) => ({
              markerId: candidate.id, markerType: candidate.markerType, startSeconds: candidate.startSeconds,
              endSeconds: candidate.endSeconds, status: candidate.status, title: candidate.title,
            }))
          const attachmentMetadata = aggregate.attachments.filter((entry) => entry.markerId === marker.id).slice(0, 128)
            .map((entry) => ({
              id: entry.id, privateAssetId: entry.privateAssetId, label: entry.label, kind: entry.kind, mimeType: entry.mimeType,
            }))
          const latestQaWarnings = latestCurrentQa(aggregate)?.findings
            .filter((finding) => finding.severity !== 'blocking')
            .slice(0, 128)
            .map((finding) => finding.message) ?? []
          const latestUserMessage = [...aggregate.markerMessages].reverse().find((message) =>
            message.markerId === marker.id && message.role === 'user'
          )?.content
          const intentRecord = aggregate.markerIntents.find((entry) => entry.markerId === marker.id)
          const currentIntent = intentRecord ? {
            action: intentRecord.action,
            instruction: intentRecord.instruction,
            visualBehavior: intentRecord.visualBehavior,
            audioBehavior: intentRecord.audioBehavior,
            captionBehavior: intentRecord.captionBehavior,
            requiredPrivateAssetIds: [...intentRecord.requiredPrivateAssetIds],
            confidence: intentRecord.confidence,
            status: intentRecord.status,
            plannerHints: [...intentRecord.plannerHints],
            doNotCopy: [...intentRecord.doNotCopy],
            runtimeState: intentRecord.runtimeState,
          } : undefined
          const contextVersion = aggregate.contextPackages
            .filter((entry) => entry.markerId === marker.id)
            .reduce((highest, entry) => Math.max(highest, entry.contextVersion), 0) + 1
          const packagePayload = {
            contextVersion, markerId: marker.id, markerRevision: marker.revision, authorityRevision: aggregate.revision,
            nearbyWindowSeconds: body.nearbyWindowSeconds,
            marker: {
              markerType: marker.markerType, timeKind: marker.timeKind, startSeconds: marker.startSeconds,
              endSeconds: marker.endSeconds, startFrame: marker.startFrame, endFrame: marker.endFrame,
              status: marker.status, title: marker.title, note: marker.note,
            },
            nearbyMarkers,
            sourceContext: body.sourceContext,
            sourceAuthorityStatus: 'unverified_private_internal_metadata' as const,
            briefContext: aggregate.brief ? {
              briefId: aggregate.brief.id,
              briefRevision: aggregate.brief.revision,
              fields: cloneJson(aggregate.brief.fields),
            } : undefined,
            exportContext: aggregate.exportSettings ? {
              revision: aggregate.exportSettings.revision,
              platformTarget: aggregate.exportSettings.platformTarget,
              aspectRatio: aggregate.exportSettings.aspectRatio,
              customWidth: aggregate.exportSettings.customWidth,
              customHeight: aggregate.exportSettings.customHeight,
              resolution: aggregate.exportSettings.resolution,
              frameRate: aggregate.exportSettings.frameRate,
              confirmationStatus: aggregate.exportSettings.confirmationStatus,
            } : undefined,
            latestUserMessage,
            currentIntent,
            preferenceContext,
            attachmentMetadata,
            latestQaWarnings,
            doNotCopyRules: uniqueStrings([...DEFAULT_DO_NOT_COPY_RULES, ...preferenceContext.doNotCopyRules]).slice(0, 128),
            runtimeState: 'metadata_only' as const, compact: true as const, includesRawMedia: false as const,
            includesFullChat: false as const, includesPublicAssetLocations: false as const,
          }
          const contextPackage: EditBriefMarkerContextPackage = {
            id: createEditBriefAuthorityId('marker_context'), ...packagePayload,
            contextHash: editBriefAuthorityHash({ ...packagePayload, authorityRevision: undefined }), createdAt: timestamp,
          }
          aggregate.conflicts = []
          aggregate.qaReports = []
          aggregate.planHintPackages = []
          appendBounded(aggregate.contextPackages, contextPackage, MAX_EDIT_BRIEF_CONTEXT_PACKAGES)
          appendMutationEvidence(aggregate, scope, 'build_marker_context', body.idempotencyKey, requestHash, contextPackage.id, 'context_package', timestamp)
          return { result: { contextPackage: cloneJson(contextPackage), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async runQa(input: unknown) {
      const body = parse(runEditBriefQaSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const requestHash = mutationHash('run_qa', scope, body)
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'run_qa', body.idempotencyKey, requestHash, 'qa_report', (id) => {
          const qaReport = aggregate.qaReports.find((entry) => entry.id === id)
          if (!qaReport) throw replayUnavailable()
          return { qaReport: cloneJson(qaReport), conflicts: cloneJson(aggregate.conflicts), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          assertMutationCapacity(aggregate)
          const { findings, conflicts } = evaluateQa(aggregate, timestamp)
          aggregate.conflicts = conflicts
          const status = qaStatus(findings)
          const qaReport: EditBriefQaReport = {
            id: createEditBriefAuthorityId('edit_brief_qa'), authorityInputHash: authorityInputHash(aggregate),
            status, findings, conflictIds: conflicts.map((entry) => entry.id), runtimeState: 'metadata_only',
            deterministicOnly: true, createdAt: timestamp,
          }
          appendBounded(aggregate.qaReports, qaReport, MAX_EDIT_BRIEF_QA_REPORTS)
          aggregate.planHintPackages = []
          appendMutationEvidence(aggregate, scope, 'run_qa', body.idempotencyKey, requestHash, qaReport.id, 'qa_report', timestamp)
          return { result: { qaReport: cloneJson(qaReport), conflicts: cloneJson(conflicts), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async createPlanHints(input: unknown) {
      const body = parse(createEditBriefPlanHintsSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const preferenceContext = await loadPreferenceContext(context, scope, 'planner')
      const requestHash = mutationHash('create_plan_hints', scope, { ...body, preferenceContext })
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'create_plan_hints', body.idempotencyKey, requestHash, 'plan_hint_package', (id) => {
          const planHints = aggregate.planHintPackages.find((entry) => entry.id === id)
          if (!planHints) throw replayUnavailable()
          return { planHints: cloneJson(planHints), aggregateRevision: aggregate.revision, replayed: true }
        }),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          assertMutationCapacity(aggregate)
          const qa = latestCurrentQa(aggregate)
          const preferenceBinding = buildPreferenceBinding(preferenceContext)
          const planInputFindings: string[] = []
          if (body.latestExplicitUserInstruction && hasExactCopyRisk(body.latestExplicitUserInstruction)) {
            planInputFindings.push('Latest explicit user instruction requests an unsafe exact-copy treatment.')
          }
          if (body.approvedProjectOverrides.some(hasExactCopyRisk)) {
            planInputFindings.push('An approved project override requests an unsafe exact-copy treatment.')
          }
          if (preferenceContext.context?.qaStatus === 'blocked') {
            planInputFindings.push('Selected Preference DNA is blocked by its own QA state.')
          }
          const baseReadiness: EditBriefPlanHintPackage['readiness'] = !qa || qa.status === 'blocked'
            ? 'blocked'
            : qa.status === 'needs_user_review' || qa.status === 'warning'
              ? 'needs_user_review'
              : 'ready_for_planning'
          const readiness: EditBriefPlanHintPackage['readiness'] = planInputFindings.length > 0
            ? 'blocked'
            : baseReadiness
          const confirmedMarkerHints = aggregate.markers
            .filter((marker) => marker.status === 'confirmed')
            .sort((left, right) => left.startSeconds - right.startSeconds)
            .map((marker) => {
              const intent = aggregate.markerIntents.find((entry) => entry.markerId === marker.id)
              return {
                markerId: marker.id, markerType: marker.markerType, startSeconds: marker.startSeconds,
                endSeconds: marker.endSeconds, startFrame: marker.startFrame, endFrame: marker.endFrame,
                instruction: intent?.instruction ?? marker.note, requiredPrivateAssetIds: intent?.requiredPrivateAssetIds ?? [],
              }
            })
          const sourceContextRefs = latestContextPackagesByMarker(aggregate)
            .filter((contextPackage) => confirmedMarkerHints.some((marker) => marker.markerId === contextPackage.markerId))
            .map((contextPackage) => ({
              markerId: contextPackage.markerId,
              contextPackageId: contextPackage.id,
              contextVersion: contextPackage.contextVersion,
              contextHash: contextPackage.contextHash,
              runtimeState: contextPackage.runtimeState,
              sourceAuthorityStatus: contextPackage.sourceAuthorityStatus,
            }))
          const qaWarnings = qa?.findings
            .filter((finding) => finding.severity !== 'blocking')
            .map((finding) => finding.message)
            .slice(0, 1_000) ?? []
          const selectedPreferenceInstructions = Object.values(preferenceContext.context?.relevantRules ?? {}).flat()
          const orderedInstructionSources: EditBriefPlanHintPackage['orderedInstructionSources'] = [
            { priority: 1, source: 'safety_legal_and_do_not_copy', instructions: uniqueStrings([...DEFAULT_DO_NOT_COPY_RULES, ...preferenceContext.doNotCopyRules]) },
            { priority: 2, source: 'latest_explicit_user_instruction', instructions: body.latestExplicitUserInstruction ? [body.latestExplicitUserInstruction] : [] },
            { priority: 3, source: 'confirmed_edit_brief_marker', instructions: confirmedMarkerHints.map((entry) => entry.instruction) },
            { priority: 4, source: 'approved_project_override', instructions: uniqueStrings(body.approvedProjectOverrides) },
            { priority: 5, source: 'selected_preference_dna', instructions: uniqueStrings(selectedPreferenceInstructions) },
            { priority: 6, source: 'general_defaults', instructions: ['Apply ReeditPro professional quality, speech clarity, meaning preservation, and confirmed output-frame rules.'] },
            { priority: 7, source: 'deterministic_fallback', instructions: ['When higher-priority instructions are silent, choose the lowest-risk deterministic professional edit behavior.'] },
          ]
          const fingerprintPayload: EditBriefPlanHintFingerprintPayload = {
            authorityInputHash: authorityInputHash(aggregate),
            planInputHash: '',
            planInputQaStatus: planInputFindings.length > 0 ? 'blocked' : 'passed',
            planInputFindings,
            qaReportId: qa?.id,
            readiness,
            instructionPriority: PREFERENCE_INSTRUCTION_PRIORITY,
            orderedInstructionSources,
            confirmedMarkerHints,
            sourceContextRefs,
            qaWarnings,
            exportTarget: aggregate.exportSettings ? {
              platformTarget: aggregate.exportSettings.platformTarget,
              aspectRatio: aggregate.exportSettings.aspectRatio,
              resolution: aggregate.exportSettings.resolution,
              frameRate: aggregate.exportSettings.frameRate,
              confirmationStatus: aggregate.exportSettings.confirmationStatus,
            } : undefined,
            preferenceApplicationVersion: preferenceContext.applicationVersion,
            preferenceBinding,
            briefSummary: aggregate.brief ? cloneJson(aggregate.brief.fields) : undefined,
            runtimeTruth: {
              plannerExecuted: false, editPlanCreated: false, providerCallsStarted: false, mediaWorkersStarted: false,
              renderStarted: false, exportStarted: false, creditsReservedOrSpent: false,
            },
            runtimeState: 'metadata_only',
          }
          fingerprintPayload.planInputHash = editBriefPlanInputHash(fingerprintPayload)
          const planHints: EditBriefPlanHintPackage = {
            id: createEditBriefAuthorityId('plan_hints'),
            ...fingerprintPayload,
            planHintFingerprint: editBriefPlanHintFingerprint(fingerprintPayload),
            createdAt: timestamp,
          }
          appendBounded(aggregate.planHintPackages, planHints, MAX_EDIT_BRIEF_PLAN_HINT_PACKAGES)
          appendMutationEvidence(aggregate, scope, 'create_plan_hints', body.idempotencyKey, requestHash, planHints.id, 'plan_hint_package', timestamp)
          return { result: { planHints: cloneJson(planHints), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },

    async lockLifecycle(input: unknown) {
      const body = parse(lockEditBriefLifecycleSchema, input)
      const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
      const currentPreferenceBinding = buildPreferenceBinding(await loadPreferenceContext(context, scope, 'planner'))
      const requestHash = mutationHash('lock_lifecycle', scope, { ...body, currentPreferenceBinding })
      const timestamp = nowIso()
      const result = await mutatePrivateEditBriefAuthorityAggregate({
        scope, expectedRevision: body.expectedRevision, now: timestamp,
        replay: (aggregate) => replayEntity(aggregate, 'lock_lifecycle', body.idempotencyKey, requestHash, 'lifecycle', () => ({
          lifecycle: cloneJson(aggregate.lifecycle), aggregateRevision: aggregate.revision, replayed: true,
        })),
        mutation: (aggregate) => {
          assertMutable(aggregate)
          assertMutationCapacity(aggregate)
          const binding = buildEditBriefAuthorityPublicationBinding(aggregate)
          if (binding.deterministicHash !== body.expectedPublicationBindingHash) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'Edit Brief publication binding changed before approval locking.', 409, {
              expectedPublicationBindingHash: body.expectedPublicationBindingHash,
              currentPublicationBindingHash: binding.deterministicHash,
              currentAggregateRevision: aggregate.revision,
            })
          }
          if (
            !binding.preferenceFingerprint
            || binding.preferenceFingerprint !== currentPreferenceBinding.fingerprint
          ) {
            throw new ApiError('PLAN_NOT_APPROVED', 'Applied Preference DNA changed after Plan Hints were compiled; rebuild Plan Hints and publication binding.', 409, {
              boundPreferenceFingerprint: binding.preferenceFingerprint,
              currentPreferenceFingerprint: currentPreferenceBinding.fingerprint,
            })
          }
          if (binding.hasApprovalBlockers || binding.qaStatus !== 'passed' || !binding.qaIsCurrent) {
            throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief authority cannot lock until its exact publication binding is blocker-free with current passing QA.', 409, {
              qaStatus: binding.qaStatus,
              openConflictCount: binding.openConflictCount,
              allActiveMarkersConfirmed: binding.allActiveMarkersConfirmed,
              outputFrameConfirmed: binding.outputFrameConfirmed,
            })
          }
          aggregate.lifecycle = {
            phase: body.phase,
            mutable: false,
            approvedSnapshotId: body.approvedSnapshotId,
            publicationBindingHash: binding.deterministicHash,
            authorityInputHash: binding.authorityInputHash,
            authorityRevisionAtLock: aggregate.revision,
            lockedAt: timestamp,
          }
          appendMutationEvidence(aggregate, scope, 'lock_lifecycle', body.idempotencyKey, requestHash, body.approvedSnapshotId ?? body.phase, 'lifecycle', timestamp)
          return { result: { lifecycle: cloneJson(aggregate.lifecycle), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
        },
      })
      return resultEnvelope(result)
    },
  }
}

async function markerStatusMutation(
  context: ServiceContext,
  input: unknown,
  operation: 'confirm_marker' | 'archive_marker' | 'reopen_marker',
) {
  const body = parse(editBriefMarkerActionSchema, input)
  const scope = await authorizeScope(context, body.workspaceId, body.projectId, body.editSessionId, 'write')
  const requestHash = mutationHash(operation, scope, body)
  const timestamp = nowIso()
  const result = await mutatePrivateEditBriefAuthorityAggregate({
    scope, expectedRevision: body.expectedRevision, now: timestamp,
    replay: (aggregate) => replayEntity(aggregate, operation, body.idempotencyKey, requestHash, 'marker', (id) => ({
      marker: cloneJson(requireMarker(aggregate, id)), aggregateRevision: aggregate.revision, replayed: true,
    })),
    mutation: (aggregate) => {
      assertMutable(aggregate)
      const marker = requireMarker(aggregate, body.markerId)
      assertMutationCapacity(aggregate)
      if (operation === 'confirm_marker') {
        if (marker.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived markers must be reopened before confirmation.', 409)
        const intent = aggregate.markerIntents.find((entry) => entry.markerId === marker.id)
        if (intent && intent.status !== 'confirmed') {
          throw new ApiError('VALIDATION_FAILED', 'Marker structured intent must be confirmed before marker confirmation.', 409)
        }
        marker.status = 'confirmed'
        marker.confirmedAt = timestamp
        marker.archivedAt = undefined
      } else if (operation === 'archive_marker') {
        marker.status = 'archived'
        marker.archivedAt = timestamp
        marker.confirmedAt = undefined
      } else {
        if (marker.status !== 'archived') throw new ApiError('VALIDATION_FAILED', 'Only archived markers can be reopened.', 409)
        marker.status = 'draft'
        marker.archivedAt = undefined
        marker.confirmedAt = undefined
      }
      marker.revision += 1
      marker.updatedAt = timestamp
      invalidateDerived(aggregate)
      appendMutationEvidence(aggregate, scope, operation, body.idempotencyKey, requestHash, marker.id, 'marker', timestamp)
      return { result: { marker: cloneJson(marker), aggregateRevision: aggregate.revision + 1, replayed: false }, changed: true }
    },
  })
  return resultEnvelope(result)
}

async function authorizeScope(
  context: ServiceContext,
  workspaceIdInput: string,
  projectIdInput: string,
  editSessionIdInput: string,
  operation: 'read' | 'write',
): Promise<EditBriefAuthorityScope> {
  requireRuntime(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Edit Brief authority requires a verified bearer-authenticated user.', 401)
  }
  const workspaceId = parseExactScopeId(workspaceIdInput, 'workspace')
  const projectId = parseExactScopeId(projectIdInput, 'project')
  const editSessionId = parseExactScopeId(editSessionIdInput, 'edit session')
  const access = await authorizeWorkspaceAccess(context, workspaceId, operation)
  const project = (await createProjectService(context).getProject(projectId, access.workspaceId)).project
  if (project.id !== projectId || project.workspaceId !== access.workspaceId) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Project tenancy evidence did not match this exact edit session.', 404)
  }
  if (operation === 'write') {
    const canonicalAuthority = await readPrivateEditAuthorityAggregate({
      localStorageRoot: context.env.localStorageRoot,
      ownerUserId: access.userId,
      workspaceId: access.workspaceId,
    })
    const canonicalLock = Boolean(canonicalAuthority?.plans.some((plan) =>
      plan.projectId === projectId && plan.editSessionId === editSessionId
      && (plan.status === 'approved' || plan.status === 'cancellation_pending')
    ))
    if (canonicalLock) {
      throw new ApiError(
        'PLAN_NOT_APPROVED',
        'Edit Brief authority is frozen by the canonical approved plan. Create a Chat-led revision and new plan version.',
        409,
        { requiredFlow: 'chat_led_revision_replanning_and_new_approval' },
      )
    }
  }
  return {
    localStorageRoot: context.env.localStorageRoot, ownerUserId: access.userId,
    workspaceId: access.workspaceId, projectId: project.id, editSessionId,
  }
}

function requireRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv !== 'production'
    && context.env.mode === 'local'
    && context.env.workerRuntimeMode === 'local'
    && context.env.storageMode === 'local'
    && context.env.allowInternalTestExecutionWithSupabase
    && context.clients.admin
  ) return
  throw new ApiError('TOOL_NOT_READY', 'Edit Brief authority is blocked until canonical tenant-bound persistence and lifecycle transactions are deployed.', 503, {
    requiredGates: [
      'canonical_edit_brief_and_marker_schema', 'two_user_two_workspace_rls_evidence',
      'exact_edit_session_foreign_key_authority', 'atomic_compare_and_swap_rpc',
      'approval_lock_transaction_coupling', 'durable_idempotency_and_audit',
    ],
  })
}

async function loadPreferenceContext(
  context: ServiceContext,
  scope: EditBriefAuthorityScope,
  audience: 'marker_chat' | 'planner',
): Promise<PreferenceContextResult> {
  const result = await createPreferenceIntelligenceService(context).getContextPackage(
    scope.workspaceId, scope.projectId, scope.editSessionId, audience,
  )
  const applicationStatus = result.applicationStatus === 'applied' || result.applicationStatus === 'cleared'
    ? result.applicationStatus
    : 'not_selected'
  return {
    applicationStatus,
    applicationVersion: result.applicationVersion,
    context: result.context,
    doNotCopyRules: [...result.doNotCopyRules].slice(0, 128),
    instructionPriority: PREFERENCE_INSTRUCTION_PRIORITY,
  }
}

function buildPreferenceBinding(
  preferenceContext: PreferenceContextResult,
): EditBriefPlanHintPackage['preferenceBinding'] {
  const bindingWithoutFingerprint = {
    applicationStatus: preferenceContext.applicationStatus,
    applicationVersion: preferenceContext.applicationVersion,
    preferenceId: preferenceContext.context?.preferenceId,
    preferenceDNAId: preferenceContext.context?.preferenceDNAId,
    preferenceDNAVersion: preferenceContext.context?.preferenceDNAVersion,
  }
  return {
    ...bindingWithoutFingerprint,
    fingerprint: editBriefAuthorityHash({
      ...bindingWithoutFingerprint,
      context: preferenceContext.context,
      doNotCopyRules: preferenceContext.doNotCopyRules,
      instructionPriority: preferenceContext.instructionPriority,
    }),
  }
}

function frameMarker(
  marker: EditBriefMarkerRecord,
  settings: PrivateEditBriefAuthorityAggregate['exportSettings'],
  timestamp: string,
): EditBriefMarkerRecord {
  marker.updatedAt = timestamp
  if (!settings || settings.confirmationStatus !== 'confirmed') {
    marker.timingStatus = 'display_seconds_only'
    marker.startFrame = undefined
    marker.endFrame = undefined
    marker.frameRate = undefined
    return marker
  }
  marker.timingStatus = 'frame_authoritative'
  marker.frameRate = settings.frameRate
  marker.startFrame = Math.round(marker.startSeconds * settings.frameRate)
  marker.endFrame = marker.endSeconds === undefined
    ? undefined
    : Math.max(marker.startFrame + 1, Math.round(marker.endSeconds * settings.frameRate))
  return marker
}

function resetMarkerConfirmation(marker: EditBriefMarkerRecord, timestamp: string): void {
  marker.status = 'draft'
  marker.confirmedAt = undefined
  marker.revision += 1
  marker.updatedAt = timestamp
}

function evaluateQa(
  aggregate: PrivateEditBriefAuthorityAggregate,
  timestamp: string,
): { findings: EditBriefQaFinding[]; conflicts: EditBriefConflictRecord[] } {
  const findings: EditBriefQaFinding[] = []
  const activeMarkers = aggregate.markers.filter((marker) => marker.status !== 'archived')
  const contextByMarker = new Map(latestContextPackagesByMarker(aggregate).map((entry) => [entry.markerId, entry]))
  if (aggregate.brief && aggregate.brief.fields.status !== 'ready') {
    findings.push({ code: 'brief_not_ready', severity: 'warning', message: 'The optional Edit Brief is still a draft.', markerIds: [] })
  }
  if (aggregate.brief && hasExactCopyRisk([
    aggregate.brief.fields.goal,
    aggregate.brief.fields.audience,
    aggregate.brief.fields.deliverable,
    ...aggregate.brief.fields.mustIncludeNotes,
    ...aggregate.brief.fields.avoidNotes,
    aggregate.brief.fields.additionalNotes,
  ].filter(Boolean).join(' '))) {
    findings.push({
      code: 'exact_copy_risk',
      severity: 'blocking',
      message: 'The Edit Brief requests an unsafe exact-copy treatment and must be rewritten as transferable editing principles.',
      markerIds: [],
    })
  }
  if (!aggregate.exportSettings || aggregate.exportSettings.confirmationStatus !== 'confirmed') {
    findings.push({ code: 'export_frame_unconfirmed', severity: 'blocking', message: 'Output aspect ratio and frame rate require explicit user confirmation before approval.', markerIds: [] })
  }
  for (const marker of activeMarkers) {
    const markerContext = contextByMarker.get(marker.id)
    if (!markerContext) {
      findings.push({
        code: 'source_context_gap',
        severity: 'warning',
        message: `Marker "${marker.title}" has no current compact source context package.`,
        markerIds: [marker.id],
      })
    } else if (
      markerContext.sourceContext.sourceDurationSeconds !== undefined
      && (marker.endSeconds ?? marker.startSeconds) > markerContext.sourceContext.sourceDurationSeconds
    ) {
      findings.push({
        code: 'marker_time_out_of_bounds',
        severity: 'blocking',
        message: `Marker "${marker.title}" extends beyond the verified source duration.`,
        markerIds: [marker.id],
      })
    }
    if (marker.status !== 'confirmed') {
      findings.push({
        code: 'marker_unconfirmed',
        severity: 'needs_user_review',
        message: `Marker "${marker.title}" is still a draft and must be confirmed or archived before approval.`,
        markerIds: [marker.id],
      })
    }
    if (marker.timingStatus !== 'frame_authoritative') {
      findings.push({ code: 'marker_frame_timing_missing', severity: 'blocking', message: `Marker "${marker.title}" has display seconds only; confirmed frame timing is required.`, markerIds: [marker.id] })
    }
    const intent = aggregate.markerIntents.find((entry) => entry.markerId === marker.id)
    if (intent?.status === 'needs_clarification') {
      findings.push({ code: 'marker_needs_clarification', severity: 'needs_user_review', message: `Marker "${marker.title}" still needs user clarification.`, markerIds: [marker.id] })
    } else if (intent?.status === 'draft') {
      findings.push({
        code: 'marker_intent_unconfirmed',
        severity: 'needs_user_review',
        message: `Marker "${marker.title}" has a draft structured intent that must be confirmed before approval.`,
        markerIds: [marker.id],
      })
    }
    if (intent) {
      const attached = new Set(aggregate.attachments.filter((entry) => entry.markerId === marker.id).map((entry) => entry.privateAssetId))
      const missing = intent.requiredPrivateAssetIds.filter((id) => !attached.has(id))
      if (missing.length > 0) {
        findings.push({ code: 'required_private_asset_missing', severity: 'blocking', message: `Marker "${marker.title}" is missing ${missing.length} required private asset attachment(s).`, markerIds: [marker.id] })
      }
    }
    const copyRiskText = [
      marker.title,
      marker.note,
      intent?.instruction,
      ...(intent?.plannerHints ?? []),
      ...aggregate.markerMessages.filter((message) => message.markerId === marker.id && message.role === 'user').map((message) => message.content),
    ].filter(Boolean).join(' ')
    if (hasExactCopyRisk(copyRiskText)) {
      findings.push({ code: 'exact_copy_risk', severity: 'blocking', message: `Marker "${marker.title}" requests an unsafe exact-copy treatment and must be rewritten as transferable editing principles.`, markerIds: [marker.id] })
    }
  }
  const conflicts: EditBriefConflictRecord[] = []
  for (let leftIndex = 0; leftIndex < activeMarkers.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activeMarkers.length; rightIndex += 1) {
      const left = activeMarkers[leftIndex]!
      const right = activeMarkers[rightIndex]!
      if (!markersOverlap(left, right)) continue
      const cutKeep = new Set([left.markerType, right.markerType])
      const sameMustFollowType = left.priority === 'must_follow' && right.priority === 'must_follow'
        && left.markerType === right.markerType && normalizedMarkerInstruction(aggregate, left) !== normalizedMarkerInstruction(aggregate, right)
      const kind = cutKeep.has('cut') && cutKeep.has('keep')
        ? 'cut_keep_overlap' as const
        : sameMustFollowType ? 'must_follow_action_overlap' as const : undefined
      if (!kind) continue
      const conflict: EditBriefConflictRecord = {
        id: `marker_conflict_${editBriefAuthorityHash({ leftMarkerId: left.id, rightMarkerId: right.id, kind }).slice(0, 32)}`,
        leftMarkerId: left.id, rightMarkerId: right.id,
        kind, status: 'open', createdAt: timestamp,
      }
      conflicts.push(conflict)
      findings.push({
        code: 'marker_instruction_conflict',
        severity: kind === 'must_follow_action_overlap' ? 'blocking' : 'needs_user_review',
        message: kind === 'cut_keep_overlap'
          ? 'Overlapping Cut and Keep markers require user resolution.'
          : 'Overlapping must-follow markers in the same editing category disagree.',
        markerIds: [left.id, right.id],
      })
    }
  }
  const findingOverflow = findings.length > 1_000
  const conflictOverflow = conflicts.length > MAX_EDIT_BRIEF_MARKERS * 4
  const boundedFindings = findings.slice(0, findingOverflow || conflictOverflow ? 999 : 1_000)
  if (findingOverflow || conflictOverflow) {
    boundedFindings.push({
      code: 'marker_instruction_conflict',
      severity: 'blocking',
      message: 'Deterministic QA exceeded its bounded finding capacity; reduce or consolidate markers before approval.',
      markerIds: [],
    })
  }
  return { findings: boundedFindings, conflicts: conflicts.slice(0, MAX_EDIT_BRIEF_MARKERS * 4) }
}

export function buildEditBriefAuthorityPublicationBinding(
  aggregate: PrivateEditBriefAuthorityAggregate,
): EditBriefAuthorityPublicationBinding {
  const inputHash = authorityInputHash(aggregate)
  const activeMarkers = aggregate.markers.filter((marker) => marker.status !== 'archived')
  const confirmedMarkers = activeMarkers.filter((marker) => marker.status === 'confirmed')
  const currentQa = [...aggregate.qaReports].reverse().find((report) => report.authorityInputHash === inputHash)
  const currentPlanHints = [...aggregate.planHintPackages].reverse().find((planHints) =>
    planHints.authorityInputHash === inputHash
  )
  const publicationAuthorityRevision = aggregate.lifecycle.authorityRevisionAtLock ?? aggregate.revision
  const bindingWithoutHash = {
    schemaVersion: 'edit-brief-authority-publication-binding-v1' as const,
    workspaceId: aggregate.workspaceId,
    projectId: aggregate.projectId,
    editSessionId: aggregate.editSessionId,
    aggregateRevision: aggregate.revision,
    authorityWorkspaceRevision: publicationAuthorityRevision,
    workspaceFingerprint: editBriefAuthorityHash({
      ownerUserId: aggregate.ownerUserId,
      workspaceId: aggregate.workspaceId,
      projectId: aggregate.projectId,
      editSessionId: aggregate.editSessionId,
    }),
    authorityInputHash: inputHash,
    markerFingerprint: editBriefAuthorityHash(activeMarkers),
    confirmedMarkerFingerprint: editBriefAuthorityHash(confirmedMarkers),
    activeMarkerCount: activeMarkers.length,
    confirmedMarkerCount: confirmedMarkers.length,
    allActiveMarkersConfirmed: activeMarkers.every((marker) => marker.status === 'confirmed'),
    outputFrameConfirmed: aggregate.exportSettings?.confirmationStatus === 'confirmed',
    qaReportId: currentQa?.id,
    qaStatus: currentQa?.status ?? 'not_run' as const,
    qaIsCurrent: Boolean(currentQa),
    openConflictCount: aggregate.conflicts.length,
    conflictFingerprint: editBriefAuthorityHash(aggregate.conflicts.map((conflict) => ({
      leftMarkerId: conflict.leftMarkerId,
      rightMarkerId: conflict.rightMarkerId,
      kind: conflict.kind,
      status: conflict.status,
    }))),
    planHintPackageId: currentPlanHints?.id,
    planHintFingerprint: currentPlanHints?.planHintFingerprint,
    planHintReadiness: currentPlanHints?.readiness ?? 'not_created' as const,
    planInputQaStatus: currentPlanHints?.planInputQaStatus ?? 'not_run' as const,
    preferenceId: currentPlanHints?.preferenceBinding.preferenceId,
    preferenceDNAId: currentPlanHints?.preferenceBinding.preferenceDNAId,
    preferenceDNAVersion: currentPlanHints?.preferenceBinding.preferenceDNAVersion,
    preferenceFingerprint: currentPlanHints?.preferenceBinding.fingerprint,
    planHintsAreCurrent: Boolean(currentPlanHints),
    hasApprovalBlockers: !currentQa
      || currentQa.status !== 'passed'
      || !currentPlanHints
      || currentPlanHints.readiness !== 'ready_for_planning'
      || currentPlanHints.planInputQaStatus !== 'passed'
      || aggregate.conflicts.length > 0
      || !aggregate.exportSettings
      || aggregate.exportSettings.confirmationStatus !== 'confirmed'
      || !activeMarkers.every((marker) => marker.status === 'confirmed'),
  }
  return {
    ...bindingWithoutHash,
    deterministicHash: editBriefAuthorityHash({
      ...bindingWithoutHash,
      aggregateRevision: publicationAuthorityRevision,
    }),
  }
}

export function editBriefAuthorityInputHash(aggregate: PrivateEditBriefAuthorityAggregate): string {
  return authorityInputHash(aggregate)
}

function authorityInputHash(aggregate: PrivateEditBriefAuthorityAggregate): string {
  return editBriefAuthorityHash({
    brief: aggregate.brief, exportSettings: aggregate.exportSettings, markers: aggregate.markers,
    markerMessages: aggregate.markerMessages, markerIntents: aggregate.markerIntents,
    attachments: aggregate.attachments,
    markerContextHashes: latestContextPackagesByMarker(aggregate).map((contextPackage) => ({
      markerId: contextPackage.markerId,
      contextVersion: contextPackage.contextVersion,
      contextHash: contextPackage.contextHash,
    })),
  })
}

function latestContextPackagesByMarker(
  aggregate: PrivateEditBriefAuthorityAggregate,
): EditBriefMarkerContextPackage[] {
  const latestByMarker = new Map<string, EditBriefMarkerContextPackage>()
  for (const contextPackage of aggregate.contextPackages) {
    const current = latestByMarker.get(contextPackage.markerId)
    if (!current || contextPackage.contextVersion > current.contextVersion) {
      latestByMarker.set(contextPackage.markerId, contextPackage)
    }
  }
  return [...latestByMarker.values()].sort((left, right) => left.markerId.localeCompare(right.markerId))
}

function latestCurrentQa(aggregate: PrivateEditBriefAuthorityAggregate): EditBriefQaReport | undefined {
  const inputHash = authorityInputHash(aggregate)
  return [...aggregate.qaReports].reverse().find((report) => report.authorityInputHash === inputHash)
}

function invalidateDerived(aggregate: PrivateEditBriefAuthorityAggregate): void {
  aggregate.contextPackages = []
  aggregate.conflicts = []
  aggregate.qaReports = []
  aggregate.planHintPackages = []
}

function appendMutationEvidence(
  aggregate: PrivateEditBriefAuthorityAggregate,
  scope: EditBriefAuthorityScope,
  operation: string,
  idempotencyKey: string,
  requestHash: string,
  responseEntityId: string,
  responseEntityKind: string,
  timestamp: string,
): void {
  const committedRevision = aggregate.revision + 1
  aggregate.idempotencyRecords.push({
    operation, idempotencyKey, requestHash, responseEntityId, responseEntityKind, committedRevision, completedAt: timestamp,
  })
  aggregate.auditEvents.push({
    id: createEditBriefAuthorityId('edit_brief_audit'), eventType: operation, actorUserId: scope.ownerUserId,
    entityId: responseEntityId, aggregateRevision: committedRevision, createdAt: timestamp,
  })
}

function replayEntity<T>(
  aggregate: PrivateEditBriefAuthorityAggregate,
  operation: string,
  idempotencyKey: string,
  requestHash: string,
  responseEntityKind: string,
  build: (entityId: string) => T,
): T | undefined {
  const reused = aggregate.idempotencyRecords.find((record) => record.idempotencyKey === idempotencyKey)
  if (!reused) return undefined
  if (reused.operation !== operation || reused.requestHash !== requestHash || reused.responseEntityKind !== responseEntityKind) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency key was reused with a different Edit Brief mutation.', 409)
  }
  if (reused.committedRevision !== aggregate.revision) throw replayUnavailable()
  return build(reused.responseEntityId)
}

function assertMutationCapacity(aggregate: PrivateEditBriefAuthorityAggregate): void {
  if (aggregate.idempotencyRecords.length >= MAX_EDIT_BRIEF_IDEMPOTENCY_RECORDS) throw capacityError('idempotency record')
  if (aggregate.auditEvents.length >= MAX_EDIT_BRIEF_AUDIT_EVENTS) throw capacityError('audit event')
}

function appendBounded<T>(collection: T[], value: T, maximum: number): void {
  collection.push(value)
  if (collection.length > maximum) collection.splice(0, collection.length - maximum)
}

function assertMutable(aggregate: PrivateEditBriefAuthorityAggregate): void {
  if (!aggregate.lifecycle.mutable || aggregate.lifecycle.phase !== 'planning') {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit Brief authority is immutable after approval locking; create a Chat-led revision and new plan version.', 409, {
      lifecyclePhase: aggregate.lifecycle.phase,
      requiredFlow: 'chat_led_revision_replanning_and_new_approval',
    })
  }
}

function requireBrief(aggregate: PrivateEditBriefAuthorityAggregate) {
  if (!aggregate.brief) throw new ApiError('VALIDATION_FAILED', 'This exact edit does not have an Edit Brief.', 404)
  return aggregate.brief
}

function requireMarker(aggregate: PrivateEditBriefAuthorityAggregate, markerId: string): EditBriefMarkerRecord {
  const marker = aggregate.markers.find((entry) => entry.id === markerId)
  if (!marker) throw new ApiError('VALIDATION_FAILED', 'Edit Brief marker was not found in this exact edit session.', 404)
  return marker
}

function requireActiveMarker(aggregate: PrivateEditBriefAuthorityAggregate, markerId: string): EditBriefMarkerRecord {
  const marker = requireMarker(aggregate, markerId)
  if (marker.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived markers must be reopened first.', 409)
  return marker
}

function markerDistanceSeconds(left: EditBriefMarkerRecord, right: EditBriefMarkerRecord): number {
  const leftEnd = left.endSeconds ?? left.startSeconds
  const rightEnd = right.endSeconds ?? right.startSeconds
  if (left.startSeconds <= rightEnd && right.startSeconds <= leftEnd) return 0
  return Math.min(Math.abs(left.startSeconds - rightEnd), Math.abs(right.startSeconds - leftEnd))
}

function markersOverlap(left: EditBriefMarkerRecord, right: EditBriefMarkerRecord): boolean {
  return left.startSeconds <= (right.endSeconds ?? right.startSeconds)
    && right.startSeconds <= (left.endSeconds ?? left.startSeconds)
}

function normalizedMarkerInstruction(aggregate: PrivateEditBriefAuthorityAggregate, marker: EditBriefMarkerRecord): string {
  return (aggregate.markerIntents.find((entry) => entry.markerId === marker.id)?.instruction ?? marker.note)
    .trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

function hasExactCopyRisk(value: string): boolean {
  const normalized = value.toLocaleLowerCase()
  const positivePattern = /\b(frame[ -]?for[ -]?frame|copy (it |this |the )?exactly|exact(ly)? (copy|duplicate|replica)|identical (shot|sequence|edit)|replicate (it |this |the )?exactly)\b/g
  for (const match of normalized.matchAll(positivePattern)) {
    const matchIndex = match.index ?? 0
    const prefix = normalized.slice(Math.max(0, matchIndex - 48), matchIndex)
    if (!/\b(do not|don't|avoid|never)\b[^.!?]{0,40}$/.test(prefix)) return true
  }
  return false
}

function qaStatus(findings: EditBriefQaFinding[]): EditBriefQaReport['status'] {
  if (findings.some((finding) => finding.severity === 'blocking')) return 'blocked'
  if (findings.some((finding) => finding.severity === 'needs_user_review')) return 'needs_user_review'
  if (findings.some((finding) => finding.severity === 'warning')) return 'warning'
  return 'passed'
}

function mutationHash(operation: string, scope: EditBriefAuthorityScope, body: unknown): string {
  return editBriefAuthorityHash({
    operation, ownerUserId: scope.ownerUserId, workspaceId: scope.workspaceId,
    projectId: scope.projectId, editSessionId: scope.editSessionId, body,
  })
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const normalized = value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function parseExactScopeId(value: string, label: string): string {
  const parsed = editBriefScopeIdSchema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `A safe ${label} ID is required.`, 400)
  return parsed.data
}

function parse<TSchema extends z.ZodType>(schema: TSchema, input: unknown): z.infer<TSchema> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Edit Brief authority request validation failed.', 400, {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }
  return parsed.data
}

function capacityError(recordType: string): ApiError {
  return new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', `Private Edit Brief ${recordType} capacity was reached.`, 503)
}

function replayUnavailable(): ApiError {
  return new ApiError('IDEMPOTENCY_REPLAY_UNAVAILABLE', 'The idempotent response was superseded by a later exact-edit revision.', 409)
}

function resultEnvelope<T>(data: T) {
  return {
    ...data,
    capability: EDIT_BRIEF_AUTHORITY_CAPABILITY,
    warnings: [
      'Edit Brief authority uses symlink-safe private single-host internal-test persistence only.',
      'Plan Hints are non-executing metadata. No planner, provider, media worker, render, export, billing, or credit side effect occurred.',
      'Marker source summaries remain unverified private internal metadata until canonical source-media lineage is resolved server-side.',
      'A canonical EditSession foreign-key authority and production RLS/CAS transactions remain required.',
    ],
  }
}

function cloneJson<T>(value: T): T {
  return stableEditBriefAuthorityValue(value)
}
