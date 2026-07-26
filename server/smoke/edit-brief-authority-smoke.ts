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
  createEditBriefPrivateWorkspaceRuntimePort,
} from '../services/edit-brief-private-workspace-runtime-port'
import { prepareCanonicalEditBriefForPlanning } from '../services/canonical-edit-brief-planning-preparation-service'
import {
  clearPrivateEditBriefAuthorityProcessStateForSmoke,
  editBriefAuthorityRelativePath,
} from '../services/private-edit-brief-authority-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'
import { canonicalPlanComponentsSchema } from '../validation/edit-planning-authority-schemas'
import { sourceBindingManifestCandidateSchema } from '../validation/source-media-authority-schemas'
import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'

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

await expectApiError(
  () => service.setExportSettings({
    workspaceId, projectId: project.id, editSessionId, expectedRevision: 2,
    idempotencyKey: 'reject-mismatched-resolution-profile',
    settings: {
      platformTarget: 'YouTube', aspectRatio: '16:9', resolution: '1920x1080',
      resolutionProfileId: 'uhd_2160', frameRate: 30, confirmationStatus: 'recommended',
    },
  }),
  'VALIDATION_FAILED',
  'A registered professional resolution profile must use its exact aspect-aware frame.',
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
    resolutionProfileId: 'hd_1080',
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
    resolutionProfileId: 'hd_1080',
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

const planningStorageRoot = '/tmp/reeditpro-edit-brief-planning-preparation-smoke'
await rm(planningStorageRoot, { recursive: true, force: true })
clearPrivateEditBriefAuthorityProcessStateForSmoke()
clearLocalProjectMemoryForSmoke()
const planningContext: ServiceContext = {
  ...context,
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: planningStorageRoot,
    SUPABASE_URL: 'https://edit-brief-planning-smoke.supabase.co',
    SUPABASE_ANON_KEY: 'edit-brief-planning-smoke-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'edit-brief-planning-smoke-service-role',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  }),
  requestId: 'edit-brief-planning-preparation-smoke',
}
const planningProject = (await createProjectService(planningContext).createProject({
  workspaceId,
  name: 'Edit Brief canonical planning preparation',
})).project
const planningEditSessionId = 'edit-session-brief-canonical-planning'
const planningService = createEditBriefAuthorityService(planningContext)
const richBrief = await planningService.createBrief({
  workspaceId,
  projectId: planningProject.id,
  editSessionId: planningEditSessionId,
  expectedRevision: 0,
  idempotencyKey: 'create-rich-planning-brief-v1',
  brief: {
    goal: 'Build a precise professional launch edit with source-timeline direction.',
    audience: 'Product leaders',
    deliverable: 'Private 4K review',
    mustIncludeNotes: ['Keep the complete proof statement.'],
    avoidNotes: ['Do not cover the product label.'],
    additionalNotes: 'Speech clarity outranks decorative timing.',
    targetPlatforms: ['youtube'],
    targetDurationMs: 30_000,
    styleKeywords: ['restrained', 'confident'],
    pacingPreference: 'tight',
    captionPreference: 'premium_subtle',
    musicPreference: 'subtle',
    bRollPreference: 'Use only source-supported product details.',
    mustUseAssetIds: ['media-source-planning-1'],
    avoidAssetIds: [],
    brandNotes: 'Keep the brand cyan accent restrained.',
    specialInstructions: 'End on the verified result without changing meaning.',
    userProvidedReferenceUrls: ['https://example.com/approved-reference'],
    status: 'ready',
  },
})
assert.equal(richBrief.aggregateRevision, 1)
assert.deepEqual(richBrief.brief.fields.targetPlatforms, ['youtube'])
assert.equal(richBrief.brief.fields.targetDurationMs, 30_000)
assert.equal(richBrief.brief.fields.captionPreference, 'premium_subtle')
assert.deepEqual(richBrief.brief.fields.styleKeywords, ['restrained', 'confident'])

const planningMarker = await planningService.createMarker({
  workspaceId,
  projectId: planningProject.id,
  editSessionId: planningEditSessionId,
  expectedRevision: 1,
  idempotencyKey: 'create-canonical-planning-marker-v1',
  marker: {
    markerType: 'keep',
    timeKind: 'range',
    startSeconds: 5,
    endSeconds: 11,
    priority: 'must_follow',
    title: 'Protect the proof statement',
    note: 'Keep this entire proof statement and use only restrained supporting graphics.',
  },
})
await planningService.confirmMarker({
  workspaceId,
  projectId: planningProject.id,
  editSessionId: planningEditSessionId,
  expectedRevision: 2,
  idempotencyKey: 'confirm-canonical-planning-marker-v1',
  markerId: planningMarker.marker.id,
})

const sourceCandidate = sourceBindingManifestCandidateSchema.parse({
  schemaVersion: 'private-source-binding-manifest-candidate-v1',
  authorityStatus: 'unapproved_manifest_candidate',
  executionAuthorized: false,
  approvedSnapshotMutated: false,
  noRuntimeSideEffects: true,
  workspaceId,
  projectId: planningProject.id,
  uploadPurpose: 'source_media',
  authorityRevision: 7,
  authorityChecksumSha256: '1'.repeat(64),
  sourceSequenceHash: '2'.repeat(64),
  bindings: [{
    sourceSequenceItemId: 'source-sequence-planning-1',
    mediaAssetId: 'media-source-planning-1',
    uploadedOrder: 1,
    required: true,
    uploadIntentId: 'upload-intent-planning-1',
    storageObjectRecordId: 'storage-record-planning-1',
    storageProvider: 'local_private',
    mimeType: 'video/mp4',
    sizeBytes: 4_096,
    checksumSha256: '3'.repeat(64),
    storageIdentityHash: '4'.repeat(64),
    bindingHash: '5'.repeat(64),
  }],
  requiredBindingCount: 1,
  candidateHash: '6'.repeat(64),
})
const canonicalComponents = canonicalPlanComponentsSchema.parse({
  compiledIntent: {
    goal: 'Create a professional launch edit.',
    explicitInstructions: ['Keep the proof statement and protect speech clarity.'],
  },
  professionalEditingDirective: {
    pacing: 'restrained',
    mustFollowRules: ['Preserve meaning.'],
  },
  confirmedSettings: {
    aspectRatio: '16:9',
    outputFrame: { width: 3840, height: 2160, fps: 30 },
    outputFramePurpose: 'private_canonical_4k_master_review',
    professionalExportCoverage: buildProfessionalExportCreditCoverage({
      durationSeconds: 30,
      outputFps: 30,
      approvedAspectRatio: '16:9',
    }),
    outputFrameConfirmed: true,
    sourceOrderConfirmed: true,
    sourceCleanupConfirmed: true,
    editLevel: 'basic',
    targetPlatform: 'youtube',
    preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
    preferenceRevision: 0,
    preferencePlanningInputRevision: 0,
    preferenceFingerprintSha256: '7'.repeat(64),
  },
  sourceSequence: [{
    sourceSequenceItemId: 'source-sequence-planning-1',
    mediaAssetId: 'media-source-planning-1',
    uploadedOrder: 1,
    checksumSha256: '3'.repeat(64),
    required: true,
  }],
  sourceCleanupSummary: {
    status: 'confirmed',
    cleanupPreference: 'balanced_cleanup',
    trimValidationStatus: 'passed',
    meaningValidationStatus: 'passed',
    userReviewRequired: false,
  },
  sourceCleanupPlan: {
    status: 'confirmed',
    decisions: [{
      decisionId: 'cleanup-planning-1',
      sourceSequenceItemId: 'source-sequence-planning-1',
      action: 'preserve',
      startFrame: 0,
      endFrameExclusive: 1_260,
      reason: 'Preserve the source while the exact marker protects the proof statement.',
      confidence: 0.99,
      meaningPreservationStatus: 'passed',
      userReviewStatus: 'not_required',
    }],
  },
  masterTimingPlan: {
    status: 'ready',
    timingBase: {
      fps: 30,
      sourceDurationSeconds: 42,
      finalDurationSeconds: 30,
      totalFrames: 900,
    },
  },
  captionVisualCueTimingPlan: { status: 'synced', collisionCount: 0 },
  soundSyncTransitionTimingPlan: { status: 'not_needed', speechPriority: true },
  timingValidationPlan: { overallStatus: 'passed', approvalBlocked: false },
  timingSummary: {
    validationStatus: 'passed',
    approvalBlocked: false,
    fps: 30,
    totalFrames: 900,
  },
  segments: [{
    segmentId: 'segment-planning-1',
    startFrame: 0,
    endFrameExclusive: 900,
    operationIds: ['operation-planning-1'],
  }],
  visualAssetPlan: { assets: [], randomBrollAllowed: false },
  colorPipelinePlan: { status: 'not_provided' },
  rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
  toolStrategyPlan: { toolIds: [], exactOperationIds: [] },
  qaPlan: { status: 'passed', checks: ['intent', 'timing', 'source_order', 'frame'] },
  qaSummary: { status: 'passed', approvalBlocked: false },
  providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
  fallbackPolicy: { unapprovedFallbackAllowed: false },
})

const optionalBriefAbsent = await prepareCanonicalEditBriefForPlanning({
  context: { ...planningContext, env: productionEnv },
  scope: {
    localStorageRoot: '/tmp/reeditpro-edit-brief-optional-absence-smoke',
    ownerUserId: userId,
    workspaceId,
    projectId: planningProject.id,
    editSessionId: 'edit-session-without-edit-brief',
  },
  sourceCandidate,
  components: canonicalComponents,
})
assert.deepEqual(optionalBriefAbsent, {
  optionalBriefPresent: false,
  aggregateRevision: 0,
  confirmedMarkerCount: 0,
  qaStatus: 'not_run',
  planHintReadiness: 'not_created',
  sourceAuthorityVerified: false,
})

const preparedBrief = await prepareCanonicalEditBriefForPlanning({
  context: planningContext,
  scope: {
    localStorageRoot: planningStorageRoot,
    ownerUserId: userId,
    workspaceId,
    projectId: planningProject.id,
    editSessionId: planningEditSessionId,
  },
  sourceCandidate,
  components: canonicalComponents,
})
assert.equal(preparedBrief.optionalBriefPresent, true)
assert.equal(preparedBrief.confirmedMarkerCount, 1)
assert.equal(preparedBrief.qaStatus, 'passed')
assert.equal(preparedBrief.planHintReadiness, 'ready_for_planning')
assert.equal(preparedBrief.sourceAuthorityVerified, true)
const preparedAuthority = (await planningService.get(
  workspaceId,
  planningProject.id,
  planningEditSessionId,
)).authority
assert.ok(preparedAuthority)
assert.equal(preparedAuthority.exportSettings?.resolution, '3840x2160')
assert.equal(preparedAuthority.exportSettings?.confirmationStatus, 'confirmed')
assert.equal(preparedAuthority.markers[0]?.timingStatus, 'frame_authoritative')
assert.equal(preparedAuthority.markers[0]?.startFrame, 150)
assert.equal(preparedAuthority.markers[0]?.endFrame, 330)
assert.equal(preparedAuthority.contextPackages.length, 1)
assert.equal(
  preparedAuthority.contextPackages[0]?.sourceAuthorityStatus,
  'verified_canonical_source_manifest',
)
assert.equal(
  preparedAuthority.contextPackages[0]?.sourceContext.sourceCandidateHashSha256,
  sourceCandidate.candidateHash,
)
assert.equal(
  preparedAuthority.contextPackages[0]?.sourceContext.sourceDurationSeconds,
  42,
)
assert.equal(
  preparedAuthority.planHintPackages.at(-1)?.sourceContextRefs[0]?.sourceAuthorityStatus,
  'verified_canonical_source_manifest',
)

const privateWorkspaceStorageRoot =
  '/tmp/reeditpro-edit-brief-private-workspace-runtime-smoke'
await rm(privateWorkspaceStorageRoot, { recursive: true, force: true })
clearLocalProjectMemoryForSmoke()
clearPrivateEditBriefAuthorityProcessStateForSmoke()
const privateWorkspacePort = createEditBriefPrivateWorkspaceRuntimePort()
const privateWorkspaceEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'mock',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: privateWorkspaceStorageRoot,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const privateWorkspaceContext: ServiceContext = {
  env: privateWorkspaceEnv,
  clients: { admin: null, public: null },
  requestId: 'edit-brief-private-workspace-runtime-smoke',
  auth: {
    userId: 'mock-user-runtime',
    isMockUser: true,
  },
  editBriefPrivateWorkspaceRuntimePort: privateWorkspacePort,
}
const privateWorkspaceProject = (
  await createProjectService(privateWorkspaceContext).createProject({
    workspaceId: 'workspace-private-edit-brief-smoke',
    name: 'Private workspace Edit Brief',
  })
).project
const privateWorkspaceService =
  createEditBriefAuthorityService(privateWorkspaceContext)
const privateMarkerInput = {
  workspaceId: privateWorkspaceProject.workspaceId,
  projectId: privateWorkspaceProject.id,
  editSessionId: 'edit-session-private-workspace-smoke',
  expectedRevision: 0,
  idempotencyKey: 'private-workspace-marker-v1',
  marker: {
    markerType: 'note' as const,
    timeKind: 'point' as const,
    startSeconds: 1,
    priority: 'normal' as const,
    title: 'Private workspace marker',
    note: 'Persist this exact local marker without granting production authority.',
  },
}
const privateMarker = await privateWorkspaceService.createMarker(
  privateMarkerInput,
)
assert.equal(privateMarker.aggregateRevision, 1)
assert.equal(privateMarker.marker.status, 'draft')
clearLocalProjectMemoryForSmoke()
clearPrivateEditBriefAuthorityProcessStateForSmoke()
const privateWorkspaceRestartedService =
  createEditBriefAuthorityService(privateWorkspaceContext)
const privateWorkspaceRestarted = await privateWorkspaceRestartedService.get(
  privateWorkspaceProject.workspaceId,
  privateWorkspaceProject.id,
  privateMarkerInput.editSessionId,
)
assert.equal(privateWorkspaceRestarted.aggregateRevision, 1)
assert.equal(privateWorkspaceRestarted.authority?.markers.length, 1)
const privateMarkerReplay = await privateWorkspaceRestartedService.createMarker(
  privateMarkerInput,
)
assert.equal(privateMarkerReplay.replayed, true)
assert.equal(privateMarkerReplay.marker.id, privateMarker.marker.id)

await expectApiError(
  () => createEditBriefAuthorityService({
    ...privateWorkspaceContext,
    editBriefPrivateWorkspaceRuntimePort: undefined,
  }).get(
    privateWorkspaceProject.workspaceId,
    privateWorkspaceProject.id,
    privateMarkerInput.editSessionId,
  ),
  'TOOL_NOT_READY',
  'Local environment flags alone must not enable private Edit Brief authority.',
)
await expectApiError(
  () => createEditBriefAuthorityService({
    ...privateWorkspaceContext,
    editBriefPrivateWorkspaceRuntimePort: {
      ...privateWorkspacePort,
    },
  }).get(
    privateWorkspaceProject.workspaceId,
    privateWorkspaceProject.id,
    privateMarkerInput.editSessionId,
  ),
  'TOOL_NOT_READY',
  'A caller-shaped private workspace runtime port must fail closed.',
)
await expectApiError(
  () => createEditBriefAuthorityService({
    ...privateWorkspaceContext,
    env: productionEnv,
  }).get(
    privateWorkspaceProject.workspaceId,
    privateWorkspaceProject.id,
    privateMarkerInput.editSessionId,
  ),
  'TOOL_NOT_READY',
  'A genuine local private port must not promote into production.',
)
await rm(privateWorkspaceStorageRoot, { recursive: true, force: true })

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
  privateWorkspaceRuntimeMounted: true,
  privateWorkspaceRuntimeNotPromotable: true,
  richBriefFieldsPersisted: true,
  canonicalSourceFrameQaAndPlanHintPreparation: true,
  optionalBriefAbsenceDoesNotRequireBriefRuntime: true,
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
