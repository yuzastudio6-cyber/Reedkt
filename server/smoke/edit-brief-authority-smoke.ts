import assert from 'node:assert/strict'
import { mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  buildEditBriefAuthorityPublicationBinding,
  createEditBriefAuthorityService,
} from '../services/edit-brief-authority-service'
import {
  clearPrivateEditBriefAuthorityProcessStateForSmoke,
  editBriefAuthorityRelativePath,
} from '../services/private-edit-brief-authority-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'

const localStorageRoot = '/tmp/reeditpro-edit-brief-authority-smoke'
const workspaceId = 'workspace-edit-brief-smoke'
const userId = 'user-edit-brief-smoke'
const otherUserId = 'other-user-edit-brief-smoke'
const editSessionId = 'edit-session-edit-brief-smoke'

await rm(localStorageRoot, { recursive: true, force: true })
clearLocalProjectMemoryForSmoke()
clearPrivateEditBriefAuthorityProcessStateForSmoke()

const admin = createMembershipAdminClient([
  { workspaceId, userId, role: 'owner' },
  { workspaceId, userId: otherUserId, role: 'editor' },
])
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://edit-brief-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'edit-brief-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'edit-brief-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
const context: ServiceContext = {
  env,
  clients: { admin, public: null },
  requestId: 'edit-brief-authority-smoke',
  auth: {
    userId,
    accessToken: 'verified-edit-brief-smoke-bearer',
    isMockUser: false,
  },
}

const project = (await createProjectService(context).createProject({
  workspaceId,
  name: 'Edit Brief authority smoke',
})).project
const service = createEditBriefAuthorityService(context)

const absent = await service.get(workspaceId, project.id, editSessionId)
assert.equal(absent.authority, undefined)
assert.equal(absent.aggregateRevision, 0)
assert.equal(absent.optionalBriefPresent, false)

const cutMarkerCreated = await service.createMarker({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 0,
  idempotencyKey: 'create-cut-marker-v1',
  marker: {
    markerType: 'cut',
    timeKind: 'range',
    startSeconds: 3,
    endSeconds: 8,
    priority: 'must_follow',
    title: 'Remove repeated sentence',
    note: 'Cut this repeated take while preserving the complete meaning.',
  },
})
assert.equal(cutMarkerCreated.aggregateRevision, 1)
assert.equal(cutMarkerCreated.marker.timingStatus, 'display_seconds_only')
assert.equal(cutMarkerCreated.marker.startFrame, undefined)

const createBriefInput = {
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 1,
  idempotencyKey: 'create-edit-brief-v1',
  brief: {
    goal: 'Create a concise professional product explanation without changing the speaker meaning.',
    audience: 'First-time product users',
    deliverable: 'One private internal review cut',
    mustIncludeNotes: ['Keep the complete setup and result.'],
    avoidNotes: ['Avoid copied reference compositions.'],
    additionalNotes: 'Protect speech clarity over decorative timing.',
    status: 'ready',
  },
}
const briefCreated = await service.createBrief(createBriefInput)
assert.equal(briefCreated.aggregateRevision, 2)
assert.equal(briefCreated.brief.fields.status, 'ready')
const briefReplay = await service.createBrief(createBriefInput)
assert.equal(briefReplay.replayed, true)
assert.equal(briefReplay.aggregateRevision, 2)
assert.equal(briefReplay.brief.id, briefCreated.brief.id)

await expectApiError(
  () => service.setExportSettings({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 2,
    idempotencyKey: 'reject-mismatched-output-frame',
    settings: {
      platformTarget: 'Shorts', aspectRatio: '9:16', resolution: '1920x1080',
      frameRate: 30, confirmationStatus: 'confirmed', confirmationId: 'invalid-frame-confirmation',
    },
  }),
  'VALIDATION_FAILED',
  'Confirmed output dimensions must match the selected aspect ratio.',
)

const recommendedExport = await service.setExportSettings({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 2,
  idempotencyKey: 'recommend-export-v1',
  settings: {
    platformTarget: 'YouTube',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    frameRate: 30,
    confirmationStatus: 'recommended',
  },
})
assert.equal(recommendedExport.aggregateRevision, 3)
assert.equal(recommendedExport.markers[0]?.timingStatus, 'display_seconds_only')

const confirmedExport = await service.setExportSettings({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 3,
  idempotencyKey: 'confirm-export-v1',
  settings: {
    platformTarget: 'YouTube',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    frameRate: 30,
    confirmationStatus: 'confirmed',
    confirmationId: 'user-frame-confirmation-v1',
  },
})
assert.equal(confirmedExport.aggregateRevision, 4)
assert.equal(confirmedExport.markers[0]?.timingStatus, 'frame_authoritative')
assert.equal(confirmedExport.markers[0]?.startFrame, 90)
assert.equal(confirmedExport.markers[0]?.endFrame, 240)

await expectApiError(
  () => service.createMarker({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 4,
    idempotencyKey: 'invalid-range-marker',
    marker: {
      markerType: 'note', timeKind: 'range', startSeconds: 9, endSeconds: 8,
      priority: 'normal', title: 'Invalid', note: 'Invalid range.',
    },
  }),
  'VALIDATION_FAILED',
  'Range markers must reject end-before-start timing.',
)

const concurrentMarkerResults = await Promise.allSettled([
  service.createMarker({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 4,
    idempotencyKey: 'concurrent-note-a',
    marker: { markerType: 'note', timeKind: 'point', startSeconds: 1, priority: 'low', title: 'CAS A', note: 'First concurrent note.' },
  }),
  service.createMarker({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 4,
    idempotencyKey: 'concurrent-note-b',
    marker: { markerType: 'note', timeKind: 'point', startSeconds: 2, priority: 'low', title: 'CAS B', note: 'Second concurrent note.' },
  }),
])
assert.equal(concurrentMarkerResults.filter((entry) => entry.status === 'fulfilled').length, 1)
assert.equal(concurrentMarkerResults.filter((entry) => entry.status === 'rejected').length, 1)
const concurrentWinner = concurrentMarkerResults.find((entry) => entry.status === 'fulfilled')
assert.ok(concurrentWinner && concurrentWinner.status === 'fulfilled')
const concurrentLoser = concurrentMarkerResults.find((entry) => entry.status === 'rejected')
assert.ok(concurrentLoser && concurrentLoser.status === 'rejected' && concurrentLoser.reason instanceof ApiError)
assert.equal(concurrentLoser.reason.code, 'IDEMPOTENCY_CONFLICT')
const concurrentMarkerId = concurrentWinner.value.marker.id

const archivedConcurrentMarker = await service.archiveMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 5,
  idempotencyKey: 'archive-concurrent-marker', markerId: concurrentMarkerId,
})
assert.equal(archivedConcurrentMarker.aggregateRevision, 6)
assert.equal(archivedConcurrentMarker.marker.status, 'archived')

const markerMessage = await service.appendMarkerMessage({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 6,
  idempotencyKey: 'cut-marker-message-v1', markerId: cutMarkerCreated.marker.id,
  role: 'user', content: 'The second sentence is a retake; preserve the full first explanation.',
  clientMessageId: 'client-cut-message-v1', runtimeState: 'mock_local',
})
assert.equal(markerMessage.aggregateRevision, 7)

const draftCutIntent = await service.setMarkerIntent({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 7,
  idempotencyKey: 'cut-marker-intent-v1', markerId: cutMarkerCreated.marker.id,
  intent: {
    action: 'remove_retake',
    instruction: 'Remove only the repeated take and preserve the first complete explanation.',
    requiredPrivateAssetIds: ['source-clip-private-1'],
    confidence: 0.96,
    status: 'draft',
    plannerHints: ['Preserve meaning over pacing.'],
    doNotCopy: ['Do not copy the reference shot order.'],
    runtimeState: 'metadata_only',
  },
})
assert.equal(draftCutIntent.aggregateRevision, 8)
await expectApiError(
  () => service.confirmMarker({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 8,
    idempotencyKey: 'reject-draft-cut-intent', markerId: cutMarkerCreated.marker.id,
  }),
  'VALIDATION_FAILED',
  'A draft structured intent must not become approved marker planning input.',
)
const cutIntent = await service.setMarkerIntent({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 8,
  idempotencyKey: 'confirm-cut-marker-intent-v2', markerId: cutMarkerCreated.marker.id,
  intent: {
    action: draftCutIntent.intent.action,
    instruction: draftCutIntent.intent.instruction,
    requiredPrivateAssetIds: [...draftCutIntent.intent.requiredPrivateAssetIds],
    confidence: draftCutIntent.intent.confidence,
    status: 'confirmed',
    plannerHints: [...draftCutIntent.intent.plannerHints],
    doNotCopy: [...draftCutIntent.intent.doNotCopy],
    runtimeState: draftCutIntent.intent.runtimeState,
  },
})
assert.equal(cutIntent.aggregateRevision, 9)

await expectApiError(
  () => service.addAttachment({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 8,
    idempotencyKey: 'reject-public-location', markerId: cutMarkerCreated.marker.id,
    attachment: {
      privateAssetId: 'source-clip-private-1', label: 'Source clip', kind: 'video',
      url: 'https://public.invalid/source.mp4',
    },
  }),
  'VALIDATION_FAILED',
  'Attachment metadata must reject public or signed asset locations.',
)

const attachment = await service.addAttachment({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 9,
  idempotencyKey: 'attach-private-source-v1', markerId: cutMarkerCreated.marker.id,
  attachment: {
    privateAssetId: 'source-clip-private-1', label: 'Source clip', kind: 'video',
    mimeType: 'video/mp4', durationSeconds: 42, width: 1920, height: 1080,
  },
})
assert.equal(attachment.aggregateRevision, 10)
assert.equal('url' in attachment.attachment, false)

const confirmedCut = await service.confirmMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 10,
  idempotencyKey: 'confirm-cut-marker-v1', markerId: cutMarkerCreated.marker.id,
})
assert.equal(confirmedCut.aggregateRevision, 11)
assert.equal(confirmedCut.marker.status, 'confirmed')

const keepMarker = await service.createMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 11,
  idempotencyKey: 'create-overlapping-keep-v1',
  marker: {
    markerType: 'keep', timeKind: 'range', startSeconds: 5, endSeconds: 7,
    priority: 'must_follow', title: 'Keep proof statement', note: 'Keep this proof statement in full.',
  },
})
assert.equal(keepMarker.aggregateRevision, 12)

await service.setMarkerIntent({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 12,
  idempotencyKey: 'keep-marker-intent-v1', markerId: keepMarker.marker.id,
  intent: {
    action: 'preserve_proof', instruction: 'Keep the proof statement in full.', requiredPrivateAssetIds: [],
    confidence: 0.98, status: 'confirmed', plannerHints: [], doNotCopy: [], runtimeState: 'metadata_only',
  },
})
await service.confirmMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 13,
  idempotencyKey: 'confirm-keep-marker-v1', markerId: keepMarker.marker.id,
})

await expectApiError(
  () => service.buildMarkerContext({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 14,
    idempotencyKey: 'reject-empty-source-context', markerId: cutMarkerCreated.marker.id,
    nearbyWindowSeconds: 30,
    sourceContext: { sourceAssetIds: [], runtimeState: 'metadata_only' },
  }),
  'VALIDATION_FAILED',
  'Empty caller-authored source metadata must not satisfy Marker Context readiness.',
)

await expectApiError(
  () => service.buildMarkerContext({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 14,
    idempotencyKey: 'reject-context-url', markerId: cutMarkerCreated.marker.id,
    nearbyWindowSeconds: 30,
    sourceContext: {
      sourceAssetIds: ['source-clip-private-1'],
      sourceSequenceSummary: 'Fetch https://public.invalid/source.mp4',
      runtimeState: 'metadata_only',
    },
  }),
  'VALIDATION_FAILED',
  'Compact marker context must reject external asset URLs.',
)

const markerContext = await service.buildMarkerContext({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 14,
  idempotencyKey: 'build-cut-marker-context-v1', markerId: cutMarkerCreated.marker.id,
  nearbyWindowSeconds: 30,
  sourceContext: {
    sourceAssetIds: ['source-clip-private-1'],
    sourceDurationSeconds: 42,
    sourceSequenceSummary: 'One source clip in user-confirmed order.',
    transcriptSummary: 'The speaker explains setup, repeats one sentence, and presents proof.',
    visualSummary: 'Single centered speaker with a stable background.',
    audioSummary: 'Clear dialogue; no real alignment worker has run.',
    runtimeState: 'metadata_only',
  },
})
assert.equal(markerContext.aggregateRevision, 15)
assert.equal(markerContext.contextPackage.compact, true)
assert.equal(markerContext.contextPackage.preferenceContext.applicationStatus, 'not_selected')
assert.equal(markerContext.contextPackage.includesRawMedia, false)
assert.equal(markerContext.contextPackage.includesPublicAssetLocations, false)
assert.equal(JSON.stringify(markerContext.contextPackage).includes('https://'), false)

const keepMarkerContext = await service.buildMarkerContext({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 15,
  idempotencyKey: 'build-keep-marker-context-v1', markerId: keepMarker.marker.id,
  nearbyWindowSeconds: 30,
  sourceContext: {
    sourceAssetIds: ['source-clip-private-1'],
    sourceDurationSeconds: 42,
    sourceSequenceSummary: 'One source clip in user-confirmed order.',
    transcriptWindowSummary: 'The proof statement is delivered once in full.',
    visualWindowSummary: 'The speaker remains centered during the proof statement.',
    audioWindowSummary: 'Dialogue remains clear in the marker window.',
    graphicTextSummary: 'No source graphic or text is present in this window.',
    runtimeState: 'metadata_only',
  },
})
assert.equal(keepMarkerContext.aggregateRevision, 16)
assert.equal(keepMarkerContext.contextPackage.contextVersion, 1)
assert.equal(keepMarkerContext.contextPackage.exportContext?.confirmationStatus, 'confirmed')
assert.equal(keepMarkerContext.contextPackage.briefContext?.briefId, briefCreated.brief.id)

const conflictQa = await service.runQa({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 16,
  idempotencyKey: 'run-conflict-qa-v1',
})
assert.equal(conflictQa.aggregateRevision, 17)
assert.equal(conflictQa.qaReport.status, 'needs_user_review')
assert.equal(conflictQa.conflicts.some((entry) => entry.kind === 'cut_keep_overlap'), true)

const blockedPlanHints = await service.createPlanHints({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 17,
  idempotencyKey: 'create-review-plan-hints-v1',
  latestExplicitUserInstruction: 'Preserve the proof statement and remove only the repeated take.',
  approvedProjectOverrides: ['Use restrained captions.'],
})
assert.equal(blockedPlanHints.aggregateRevision, 18)
assert.equal(blockedPlanHints.planHints.readiness, 'needs_user_review')
assert.deepEqual(blockedPlanHints.planHints.instructionPriority, [
  'safety_legal_and_do_not_copy',
  'latest_explicit_user_instruction',
  'confirmed_edit_brief_marker',
  'approved_project_override',
  'selected_preference_dna',
  'general_defaults',
  'deterministic_fallback',
])
assert.deepEqual(blockedPlanHints.planHints.runtimeTruth, {
  plannerExecuted: false,
  editPlanCreated: false,
  providerCallsStarted: false,
  mediaWorkersStarted: false,
  renderStarted: false,
  exportStarted: false,
  creditsReservedOrSpent: false,
})

const movedKeepMarker = await service.updateMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 18,
  idempotencyKey: 'move-keep-marker-v2', markerId: keepMarker.marker.id,
  patch: { startSeconds: 20, endSeconds: 25 },
})
assert.equal(movedKeepMarker.aggregateRevision, 19)
assert.equal(movedKeepMarker.marker.status, 'draft')
assert.equal(movedKeepMarker.marker.startFrame, 600)

await service.confirmMarker({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 19,
  idempotencyKey: 'reconfirm-keep-marker-v2', markerId: keepMarker.marker.id,
})
await service.buildMarkerContext({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 20,
  idempotencyKey: 'rebuild-cut-marker-context-v2', markerId: cutMarkerCreated.marker.id,
  nearbyWindowSeconds: 30,
  sourceContext: {
    sourceAssetIds: ['source-clip-private-1'], sourceDurationSeconds: 42,
    sourceSequenceSummary: 'One source clip in user-confirmed order.',
    transcriptWindowSummary: 'The first explanation is complete before the repeated take.',
    visualWindowSummary: 'The centered speaker remains visually stable.',
    audioWindowSummary: 'Dialogue remains clear.', runtimeState: 'metadata_only',
  },
})
await service.buildMarkerContext({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 21,
  idempotencyKey: 'rebuild-keep-marker-context-v2', markerId: keepMarker.marker.id,
  nearbyWindowSeconds: 30,
  sourceContext: {
    sourceAssetIds: ['source-clip-private-1'], sourceDurationSeconds: 42,
    sourceSequenceSummary: 'One source clip in user-confirmed order.',
    transcriptWindowSummary: 'The proof statement is complete at its revised marker window.',
    visualWindowSummary: 'The speaker remains centered.',
    audioWindowSummary: 'Dialogue remains clear.', runtimeState: 'metadata_only',
  },
})
const passingQa = await service.runQa({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 22,
  idempotencyKey: 'run-passing-qa-v2',
})
assert.equal(passingQa.aggregateRevision, 23)
assert.equal(passingQa.qaReport.status, 'passed')
assert.equal(passingQa.conflicts.length, 0)

const unsafePlanHints = await service.createPlanHints({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 23,
  idempotencyKey: 'reject-copy-plan-input-v2',
  latestExplicitUserInstruction: 'Copy the reference exactly frame-for-frame.',
  approvedProjectOverrides: [],
})
assert.equal(unsafePlanHints.aggregateRevision, 24)
assert.equal(unsafePlanHints.planHints.readiness, 'blocked')
assert.equal(unsafePlanHints.planHints.planInputQaStatus, 'blocked')

const readyPlanHints = await service.createPlanHints({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 24,
  idempotencyKey: 'create-ready-plan-hints-v2',
  latestExplicitUserInstruction: 'Preserve meaning and keep the proof statement.',
  approvedProjectOverrides: ['Use restrained captions.'],
})
assert.equal(readyPlanHints.aggregateRevision, 25)
assert.equal(readyPlanHints.planHints.readiness, 'ready_for_planning')
assert.equal(readyPlanHints.planHints.confirmedMarkerHints.length, 2)
assert.equal(readyPlanHints.planHints.sourceContextRefs.length, 2)
assert.equal(readyPlanHints.planHints.exportTarget?.confirmationStatus, 'confirmed')
assert.equal(readyPlanHints.planHints.briefSummary?.status, 'ready')
assert.equal(readyPlanHints.planHints.preferenceApplicationVersion, 0)
assert.equal(readyPlanHints.planHints.planInputQaStatus, 'passed')
assert.match(readyPlanHints.planHints.planInputHash, /^[a-f0-9]{64}$/)
assert.match(readyPlanHints.planHints.planHintFingerprint, /^[a-f0-9]{64}$/)

const beforeLock = await service.get(workspaceId, project.id, editSessionId)
assert.ok(beforeLock.authority)
const publicationBinding = buildEditBriefAuthorityPublicationBinding(beforeLock.authority)
assert.equal(publicationBinding.aggregateRevision, 25)
assert.equal(publicationBinding.confirmedMarkerCount, 2)
assert.equal(publicationBinding.allActiveMarkersConfirmed, true)
assert.equal(publicationBinding.qaStatus, 'passed')
assert.equal(publicationBinding.qaIsCurrent, true)
assert.equal(publicationBinding.openConflictCount, 0)
assert.equal(publicationBinding.planHintFingerprint, readyPlanHints.planHints.planHintFingerprint)
assert.equal(publicationBinding.planHintsAreCurrent, true)
assert.equal(publicationBinding.hasApprovalBlockers, false)
assert.match(publicationBinding.deterministicHash, /^[a-f0-9]{64}$/)
const publicationBindingRead = await service.getPublicationBinding(workspaceId, project.id, editSessionId)
assert.equal(publicationBindingRead.binding?.deterministicHash, publicationBinding.deterministicHash)

const locked = await service.lockLifecycle({
  workspaceId, projectId: project.id, editSessionId, expectedRevision: 25,
  idempotencyKey: 'lock-approved-snapshot-v1', phase: 'approved_snapshot',
  approvedSnapshotId: 'approved-snapshot-smoke-v1',
  expectedPublicationBindingHash: publicationBinding.deterministicHash,
})
assert.equal(locked.aggregateRevision, 26)
assert.equal(locked.lifecycle.mutable, false)
assert.equal(locked.lifecycle.publicationBindingHash, publicationBinding.deterministicHash)
const lockedAuthority = (await service.get(workspaceId, project.id, editSessionId)).authority
assert.ok(lockedAuthority)
const lockedBinding = buildEditBriefAuthorityPublicationBinding(lockedAuthority)
assert.equal(lockedBinding.aggregateRevision, 26)
assert.equal(lockedBinding.authorityWorkspaceRevision, 25)
assert.equal(lockedBinding.deterministicHash, publicationBinding.deterministicHash)
await expectApiError(
  () => service.updateBrief({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 26,
    idempotencyKey: 'reject-post-lock-edit', patch: { goal: 'Unauthorized post-approval mutation.' },
  }),
  'PLAN_NOT_APPROVED',
  'Approval-time locking must freeze Edit Brief authority.',
)

clearPrivateEditBriefAuthorityProcessStateForSmoke()
clearLocalProjectMemoryForSmoke()
const recovered = await createEditBriefAuthorityService(context).get(workspaceId, project.id, editSessionId)
assert.equal(recovered.aggregateRevision, 26)
assert.equal(recovered.authority?.brief?.id, briefCreated.brief.id)
assert.equal(recovered.authority?.markers.length, 3)

const authorityDirectory = join(localStorageRoot, 'edit-brief-authority', 'private-internal-v1')
assert.equal((await stat(authorityDirectory)).mode & 0o777, 0o700)
const authorityFiles = (await readdir(authorityDirectory)).filter((name) => name.endsWith('.json'))
assert.equal(authorityFiles.length, 1)
assert.equal((await stat(join(authorityDirectory, authorityFiles[0]!))).mode & 0o777, 0o600)

const symlinkSessionId = 'edit-session-edit-brief-symlink'
const symlinkRelativePath = editBriefAuthorityRelativePath({
  ownerUserId: userId, workspaceId, projectId: project.id, editSessionId: symlinkSessionId,
})
const symlinkTarget = join(localStorageRoot, symlinkRelativePath)
const outsideRecord = '/tmp/reeditpro-edit-brief-authority-outside.json'
await writeFile(outsideRecord, '{}\n')
await mkdir(dirname(symlinkTarget), { recursive: true })
await symlink(outsideRecord, symlinkTarget)
await expectApiError(
  () => service.createBrief({
    workspaceId, projectId: project.id, editSessionId: symlinkSessionId, expectedRevision: 0,
    idempotencyKey: 'symlink-refusal-create',
    brief: { goal: 'Must not write through a symbolic link.', mustIncludeNotes: [], avoidNotes: [], status: 'draft' },
  }),
  'VALIDATION_FAILED',
  'Private persistence must refuse symbolic-link targets.',
)

const otherUserContext: ServiceContext = {
  ...context,
  requestId: 'edit-brief-authority-other-user',
  auth: { userId: otherUserId, accessToken: 'verified-other-edit-brief-bearer', isMockUser: false },
}
await expectApiError(
  () => createEditBriefAuthorityService(otherUserContext).get(workspaceId, project.id, editSessionId),
  'PROJECT_NOT_FOUND',
  'A different workspace member must not read another user local exact-edit authority.',
)

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://edit-brief-production-block.supabase.co',
  SUPABASE_ANON_KEY: 'edit-brief-production-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'edit-brief-production-service-role',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'edit-brief-production-internal',
})
await expectApiError(
  () => createEditBriefAuthorityService({ ...context, env: productionEnv }).get(workspaceId, project.id, editSessionId),
  'TOOL_NOT_READY',
  'Production must fail closed until canonical Edit Brief persistence and RLS evidence exist.',
)

const authorityPath = join(authorityDirectory, authorityFiles[0]!)
const tamperedRecord = JSON.parse(await readFile(authorityPath, 'utf8')) as {
  aggregate: { markers: Array<{ note: string }> }
}
tamperedRecord.aggregate.markers[0]!.note = 'Checksum tamper must be detected.'
await writeFile(authorityPath, `${JSON.stringify(tamperedRecord)}\n`)
clearPrivateEditBriefAuthorityProcessStateForSmoke()
await expectApiError(
  () => createEditBriefAuthorityService(context).get(workspaceId, project.id, editSessionId),
  'VALIDATION_FAILED',
  'Checksum tampering must fail closed.',
)

console.log('Edit Brief authority smoke passed.')
console.log(JSON.stringify({
  optionalBrief: true,
  exactSessionScope: true,
  pointAndRangeMarkers: true,
  markerLifecycle: true,
  structuredIntent: true,
  privateAttachmentMetadataOnly: true,
  compactSourceAndPreferenceContext: true,
  deterministicQaAndConflicts: true,
  nonExecutingPlanHints: true,
  masterInstructionPriority: true,
  publicationBinding: true,
  compareAndSwapRevision: true,
  boundedIdempotencyAndAudit: true,
  symlinkSafePrivatePersistence: true,
  checksumIntegrity: true,
  tenantIsolation: true,
  approvalLifecycleLock: true,
  restartRecovery: true,
  productionFailClosed: true,
  providerMediaWorkerRenderCreditSideEffects: false,
}, null, 2))

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
  message: string,
): Promise<void> {
  try {
    await operation()
    assert.fail(message)
  } catch (error) {
    assert.ok(error instanceof ApiError, message)
    assert.equal(error.code, code, message)
  }
}

function createMembershipAdminClient(
  workspaceMemberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') throw new Error(`Unexpected Edit Brief smoke table: ${tableName}`)
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = workspaceMemberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId
          )
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: membership.role,
            } : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
