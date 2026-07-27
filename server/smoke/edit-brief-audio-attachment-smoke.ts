import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createEditBriefAuthorityService } from '../services/edit-brief-authority-service'
import {
  createEditBriefPrivateWorkspaceRuntimePort,
} from '../services/edit-brief-private-workspace-runtime-port'
import {
  clearPrivateEditBriefAuthorityProcessStateForSmoke,
  readPrivateEditBriefAuthorityAggregate,
} from '../services/private-edit-brief-authority-store'
import {
  assertEditBriefAudioPlanningMatchesCanonical,
} from '../services/planning-input-authority-binding-service'
import {
  clearPrivateUploadMediaAuthorityProcessStateForSmoke,
} from '../services/private-upload-media-authority-store'
import {
  clearLocalProjectMemoryForSmoke,
  createProjectService,
} from '../services/project-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import {
  buildCanonicalEditBriefAudioPlanningBinding,
} from '../../src/lib/canonical-edit-brief-audio-planning'
import {
  canonicalEditBriefAudioPlanningSchema,
} from '../validation/edit-planning-authority-schemas'

const root = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-edit-brief-audio-'))
const workspaceId = 'workspace-edit-brief-audio'
const editSessionId = 'edit-session-edit-brief-audio'
const ownerUserId = 'edit-brief-audio-owner'

clearLocalProjectMemoryForSmoke()
clearPrivateEditBriefAuthorityProcessStateForSmoke()
clearPrivateUploadMediaAuthorityProcessStateForSmoke()

const context: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: root,
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  }),
  clients: { admin: null, public: null },
  requestId: 'edit-brief-audio-attachment-smoke',
  auth: { userId: ownerUserId, isMockUser: true },
  editBriefPrivateWorkspaceRuntimePort: createEditBriefPrivateWorkspaceRuntimePort(),
}

try {
  const projectService = createProjectService(context)
  const project = (await projectService.createProject({
    workspaceId,
    name: 'Edit Brief audio attachment',
  })).project
  const wrongProject = (await projectService.createProject({
    workspaceId,
    name: 'Wrong Edit Brief audio project',
  })).project
  const service = createEditBriefAuthorityService(context)

  await service.createBrief({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 0,
    idempotencyKey: 'create-audio-brief',
    brief: {
      goal: 'Use the supplied music cue under the opening while protecting speech clarity.',
      mustIncludeNotes: [],
      avoidNotes: [],
      status: 'ready',
    },
  })
  await service.setExportSettings({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 1,
    idempotencyKey: 'confirm-audio-frame',
    settings: {
      platformTarget: 'YouTube',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      resolutionProfileId: 'hd_1080',
      frameRate: 30,
      confirmationStatus: 'confirmed',
      confirmationId: 'audio-frame-confirmation',
    },
  })
  const musicMarker = await service.createMarker({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 2,
    idempotencyKey: 'create-music-marker',
    marker: {
      markerType: 'music',
      timeKind: 'range',
      startSeconds: 0,
      endSeconds: 2,
      priority: 'high',
      title: 'Opening music',
      note: 'Use this uploaded music quietly beneath the opening narration.',
    },
  })
  const noteMarker = await service.createMarker({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 3,
    idempotencyKey: 'create-note-marker',
    marker: {
      markerType: 'note',
      timeKind: 'point',
      startSeconds: 1,
      priority: 'low',
      title: 'Ordinary note',
      note: 'This marker must not accept a private audio attachment.',
    },
  })
  await service.setMarkerIntent({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 4,
    idempotencyKey: 'set-music-intent',
    markerId: musicMarker.marker.id,
    intent: {
      action: 'use_user_music',
      instruction: 'Use the uploaded music quietly beneath the opening narration.',
      audioBehavior: 'Protect narration and keep the cue restrained.',
      requiredPrivateAssetIds: [],
      confidence: 1,
      status: 'confirmed',
      plannerHints: ['Speech clarity outranks music energy.'],
      doNotCopy: [],
      runtimeState: 'metadata_only',
    },
  })

  const music = await uploadAndFinalizeAudio({
    context,
    workspaceId,
    projectId: project.id,
    fileName: 'opening-music.wav',
    uploadPurpose: 'reference_media',
  })
  const sourcePurposeAudio = await uploadAndFinalizeAudio({
    context,
    workspaceId,
    projectId: project.id,
    fileName: 'source-purpose.wav',
    uploadPurpose: 'source_media',
  })
  const wrongProjectAudio = await uploadAndFinalizeAudio({
    context,
    workspaceId,
    projectId: wrongProject.id,
    fileName: 'wrong-project.wav',
    uploadPurpose: 'reference_media',
  })

  await expectApiError(
    () => service.addFinalizedAudioAttachment({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: 5,
      idempotencyKey: 'reject-caller-audio-metadata',
      markerId: musicMarker.marker.id,
      privateAssetId: music.mediaAsset.id,
      label: 'Caller-selected label',
    }),
    'VALIDATION_FAILED',
  )
  await expectApiError(
    () => service.addFinalizedAudioAttachment({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: 5,
      idempotencyKey: 'reject-note-audio',
      markerId: noteMarker.marker.id,
      privateAssetId: music.mediaAsset.id,
    }),
    'VALIDATION_FAILED',
  )
  await expectApiError(
    () => service.addFinalizedAudioAttachment({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: 5,
      idempotencyKey: 'reject-source-purpose-audio',
      markerId: musicMarker.marker.id,
      privateAssetId: sourcePurposeAudio.mediaAsset.id,
    }),
    'UPLOAD_NOT_FINALIZED',
  )
  await expectApiError(
    () => service.addFinalizedAudioAttachment({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: 5,
      idempotencyKey: 'reject-cross-project-audio',
      markerId: musicMarker.marker.id,
      privateAssetId: wrongProjectAudio.mediaAsset.id,
    }),
    'UPLOAD_NOT_FINALIZED',
  )

  const attachInput = {
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 5,
    idempotencyKey: 'attach-finalized-music',
    markerId: musicMarker.marker.id,
    privateAssetId: music.mediaAsset.id,
  }
  const attached = await service.addFinalizedAudioAttachment(attachInput)
  assert.equal(attached.aggregateRevision, 6)
  assert.equal(attached.attachment.markerId, musicMarker.marker.id)
  assert.equal(attached.attachment.privateAssetId, music.mediaAsset.id)
  assert.equal(attached.attachment.label, 'Uploaded soundtrack')
  assert.equal(attached.attachment.kind, 'audio')
  assert.equal(attached.attachment.mimeType, 'audio/wav')
  assert.ok((attached.attachment.durationSeconds ?? 0) > 0)
  assert.equal('fileName' in attached.attachment, false)
  assert.equal('checksumSha256' in attached.attachment, false)
  assert.equal('storagePath' in attached.attachment, false)
  assert.equal('url' in attached.attachment, false)

  const replay = await service.addFinalizedAudioAttachment(attachInput)
  assert.equal(replay.replayed, true)
  assert.equal(replay.aggregateRevision, 6)
  assert.equal(replay.attachment.id, attached.attachment.id)

  await expectApiError(
    () => service.addFinalizedAudioAttachment({
      ...attachInput,
      expectedRevision: 6,
      idempotencyKey: 'reject-second-music-attachment',
    }),
    'IDEMPOTENCY_CONFLICT',
  )
  await expectApiError(
    () => service.updateMarker({
      workspaceId,
      projectId: project.id,
      editSessionId,
      expectedRevision: 6,
      idempotencyKey: 'reject-changing-audio-marker-kind',
      markerId: musicMarker.marker.id,
      patch: { markerType: 'note' },
    }),
    'VALIDATION_FAILED',
  )

  await service.archiveMarker({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 6,
    idempotencyKey: 'archive-note-marker',
    markerId: noteMarker.marker.id,
  })
  await service.confirmMarker({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 7,
    idempotencyKey: 'confirm-music-marker',
    markerId: musicMarker.marker.id,
  })
  await service.buildMarkerContext({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 8,
    idempotencyKey: 'build-music-marker-context',
    markerId: musicMarker.marker.id,
    nearbyWindowSeconds: 10,
    sourceContext: {
      sourceAssetIds: ['source-video-private-1'],
      sourceDurationSeconds: 5,
      sourceSequenceSummary: 'One source video in confirmed order.',
      transcriptWindowSummary: 'Opening narration occupies the music marker window.',
      audioWindowSummary: 'Narration remains the primary audible element.',
      runtimeState: 'metadata_only',
    },
  })
  const qa = await service.runQa({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 9,
    idempotencyKey: 'qa-music-marker',
  })
  assert.equal(qa.qaReport.status, 'passed')
  const hints = await service.createPlanHints({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 10,
    idempotencyKey: 'plan-hints-with-music',
    latestExplicitUserInstruction: 'Use the uploaded cue and protect narration.',
    approvedProjectOverrides: [],
  })
  assert.equal(hints.planHints.readiness, 'ready_for_planning')
  assert.equal(hints.planHints.confirmedMarkerHints.length, 1)
  assert.deepEqual(
    hints.planHints.confirmedMarkerHints[0]?.requiredPrivateAssetIds,
    [music.mediaAsset.id],
  )

  const readback = await service.get(workspaceId, project.id, editSessionId)
  assert.ok(readback.authority)
  assert.equal(readback.authority.attachments.length, 1)
  const serialized = JSON.stringify(readback.authority)
  assert.equal(serialized.includes(music.mediaAsset.storagePath), false)
  assert.equal(serialized.includes(music.mediaAsset.storageBucket), false)
  assert.ok(music.mediaAsset.checksumSha256)
  assert.equal(serialized.includes(music.mediaAsset.checksumSha256), false)

  const planningInput = {
    attachmentId: attached.attachment.id,
    markerId: musicMarker.marker.id,
    markerType: 'music' as const,
    markerTimeKind: 'range' as const,
    privateAssetId: music.mediaAsset.id,
    startSeconds: 0,
    endSeconds: 2,
    durationSeconds: attached.attachment.durationSeconds!,
    mimeType: 'audio/wav' as const,
  }
  const planning = buildCanonicalEditBriefAudioPlanningBinding({
    audioInputs: [planningInput],
    fps: 30,
    totalFrames: 150,
  })
  assert.equal(planning.ok, true)
  assert.ok(planning.ok && planning.binding)
  const parsedPlanning = canonicalEditBriefAudioPlanningSchema.parse(
    planning.ok ? planning.binding : undefined,
  )
  assert.equal(parsedPlanning.items[0]?.startFrame, 0)
  assert.equal(parsedPlanning.items[0]?.endFrameExclusive, 60)
  assert.equal(parsedPlanning.items[0]?.sourceDurationFrames, 15)
  assert.equal(parsedPlanning.items[0]?.placementDurationFrames, 60)
  assert.equal(parsedPlanning.items[0]?.fillPolicy, 'loop_or_trim_to_window')
  assert.equal(
    parsedPlanning.items[0]?.mixProfileId,
    'speech_safe_uploaded_music_bed_v1',
  )
  assert.equal(parsedPlanning.runtimeAuthority, false)
  assert.equal(parsedPlanning.approvalAuthority, false)
  assert.equal(
    JSON.stringify(parsedPlanning).includes(music.mediaAsset.checksumSha256),
    false,
  )
  assert.equal(
    canonicalEditBriefAudioPlanningSchema.safeParse({
      ...parsedPlanning,
      runtimeAuthority: true,
    }).success,
    false,
  )
  assert.equal(
    canonicalEditBriefAudioPlanningSchema.safeParse({
      ...parsedPlanning,
      rawAudioPath: music.mediaAsset.storagePath,
    }).success,
    false,
  )
  assert.equal(
    buildCanonicalEditBriefAudioPlanningBinding({
      audioInputs: [{ ...planningInput, privateAssetId: 'forged asset id' }],
      fps: 30,
      totalFrames: 150,
    }).ok,
    false,
  )
  const privateAggregate = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot: root,
    ownerUserId,
    workspaceId,
    projectId: project.id,
    editSessionId,
  })
  assert.ok(privateAggregate)
  const canonicalTiming = {
    validationStatus: 'passed' as const,
    approvalBlocked: false as const,
    fps: 30,
    totalFrames: 150,
  }
  assert.doesNotThrow(() => assertEditBriefAudioPlanningMatchesCanonical(
    privateAggregate!,
    {
      editBriefAudioPlanning: parsedPlanning,
      timingSummary: canonicalTiming,
    },
  ))
  expectSyncApiError(
    () => assertEditBriefAudioPlanningMatchesCanonical(
      privateAggregate!,
      { timingSummary: canonicalTiming },
    ),
    'IDEMPOTENCY_CONFLICT',
  )
  expectSyncApiError(
    () => assertEditBriefAudioPlanningMatchesCanonical(
      privateAggregate!,
      {
        editBriefAudioPlanning: {
          ...parsedPlanning,
          items: parsedPlanning.items.map((item) => ({
            ...item,
            privateAssetId: 'forged-private-audio',
          })),
        },
        timingSummary: canonicalTiming,
      },
    ),
    'IDEMPOTENCY_CONFLICT',
  )
  expectSyncApiError(
    () => assertEditBriefAudioPlanningMatchesCanonical(
      privateAggregate!,
      {
        editBriefAudioPlanning: parsedPlanning,
        timingSummary: { ...canonicalTiming, totalFrames: 149 },
      },
    ),
    'IDEMPOTENCY_CONFLICT',
  )

  console.log(JSON.stringify({
    smoke: 'edit-brief-audio-attachment',
    status: 'passed',
    finalizedAudioOnly: true,
    markerScoped: true,
    planningFingerprintBound: true,
    canonicalPlanningPlacementBound: true,
    serverRereadRequired: true,
    omissionAndSubstitutionRejected: true,
    callerMetadataRejected: true,
    privateLocationsOmitted: true,
    providerCallsStarted: false,
    mediaWorkersStarted: false,
    renderStarted: false,
    creditsReservedOrSpent: false,
  }, null, 2))
} finally {
  clearLocalProjectMemoryForSmoke()
  clearPrivateEditBriefAuthorityProcessStateForSmoke()
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  await rm(root, { recursive: true, force: true })
}

async function uploadAndFinalizeAudio(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  fileName: string
  uploadPurpose: 'source_media' | 'reference_media'
}) {
  const bytes = createPcmWav({ durationSeconds: 0.5, sampleRate: 48_000 })
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  const service = createUploadService(input.context)
  const created = await service.createUploadIntent({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    uploadPurpose: input.uploadPurpose,
    originalFileName: input.fileName,
    mimeType: 'audio/wav',
    expectedSizeBytes: bytes.byteLength,
    checksumSha256,
  })
  await service.uploadLocalObject(
    created.uploadIntent.id,
    input.workspaceId,
    bytes,
    'audio/wav',
    bytes.byteLength,
  )
  const finalized = await service.finalizeUploadIntent({
    workspaceId: input.workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
  assert.equal(finalized.mediaAsset.sourceMetadata?.probeStatus, 'probed')
  assert.equal(finalized.mediaAsset.sourceMetadata?.hasAudio, true)
  assert.equal(finalized.mediaAsset.sourceMetadata?.hasVideo, false)
  return finalized
}

function createPcmWav(input: { durationSeconds: number; sampleRate: number }): Buffer {
  const sampleCount = Math.round(input.durationSeconds * input.sampleRate)
  const dataByteLength = sampleCount * 2
  const bytes = Buffer.alloc(44 + dataByteLength)
  bytes.write('RIFF', 0, 'ascii')
  bytes.writeUInt32LE(36 + dataByteLength, 4)
  bytes.write('WAVE', 8, 'ascii')
  bytes.write('fmt ', 12, 'ascii')
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(input.sampleRate, 24)
  bytes.writeUInt32LE(input.sampleRate * 2, 28)
  bytes.writeUInt16LE(2, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36, 'ascii')
  bytes.writeUInt32LE(dataByteLength, 40)
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const value = Math.round(Math.sin((sample / input.sampleRate) * Math.PI * 2 * 440) * 8_000)
    bytes.writeInt16LE(value, 44 + sample * 2)
  }
  return bytes
}

async function expectApiError(
  action: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  let error: unknown
  try {
    await action()
  } catch (caught) {
    error = caught
  }
  assert.ok(error instanceof ApiError)
  assert.equal(error.code, expectedCode)
}

function expectSyncApiError(
  action: () => unknown,
  expectedCode: ApiError['code'],
): void {
  let error: unknown
  try {
    action()
  } catch (caught) {
    error = caught
  }
  assert.ok(error instanceof ApiError)
  assert.equal(error.code, expectedCode)
}
