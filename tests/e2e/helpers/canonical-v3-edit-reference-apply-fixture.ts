import { createHash, randomUUID } from 'node:crypto'

import {
  createPreferenceApplicationTargetContext,
} from '../../../src/lib/project-edit-session-edit-reference-integration'
import {
  createExactEditPreferenceApplyOperation,
} from '../../../src/lib/exact-edit-preference-apply-client'
import {
  createCurrentEditReferenceBackendBriefText,
  resolveCurrentEditReferenceActiveEditorAuthority,
} from '../../../src/lib/current-edit-reference-active-editor-authority'
import {
  createLocalInternalProjectHandoff,
  type LocalInternalEditPreferenceBaseline,
  type LocalInternalProjectHandoff,
} from '../../../src/lib/local-project-handoff'
import { getCurrentEditPreferenceOverrideKeys } from '../../../src/lib/current-edit-preferences'
import {
  createInitialEditBriefState,
  markEditBriefReady,
  updateEditBriefAudience,
  updateEditBriefCaptionPreference,
  updateEditBriefGoal,
  updateEditBriefMusicPreference,
  updateEditBriefPacingPreference,
  updateEditBriefPlatforms,
  updateEditBriefStyleKeywords,
} from '../../../src/lib/edit-brief/edit-brief-operations'
import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../../src/lib/approved-edit-execution-package-client'
import { loadRuntimeEnv } from '../../../server/config/env'
import {
  prepareEditReferenceLongFormStudyRun,
} from '../../../server/edit-references/edit-reference-long-form-study-binding'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
} from '../../../server/edit-references/edit-reference-long-form-study-contract'
import {
  createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory,
} from '../../../server/services/edit-reference-canonical-v3-local-exact-edit-brief-runtime-port-factory'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory,
} from '../../../server/services/edit-reference-canonical-v3-local-long-form-runtime-port-factory'
import {
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory,
} from '../../../server/services/edit-reference-canonical-v3-local-target-understanding-package-runtime-port-factory'
import {
  createEditReferenceLocalSupabaseHttpRpcClient,
} from '../../../server/edit-references/edit-reference-local-supabase-http-rpc-client'
import {
  createEditReferenceLocalSupabaseRpcAdapter,
  createEditReferenceLocalSupabaseRpcCapability,
} from '../../../server/edit-references/edit-reference-local-supabase-rpc-adapter'
import {
  completeCanonicalV3PrePlanStudyFixture,
} from '../../../server/smoke/fixtures/complete-canonical-v3-pre-plan-study-fixture'
import {
  createReadyTargetVideoUnderstandingFixture,
} from '../../../server/smoke/fixtures/ready-target-video-understanding-fixture'

export interface CanonicalV3MountedEditReferenceApplyFixtureInput {
  readonly apiBaseUrl: string
  readonly endpointOrigin: string
  readonly anonKey: string
  readonly authenticatedAccessToken: string
  readonly localInternalSigningSecret: string
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly fixtureKey: string
}

export interface CanonicalV3MountedEditReferenceApplyFixtureResult {
  readonly handoff: LocalInternalProjectHandoff
  readonly runId: string
  readonly totalWorkItemCount: number
  readonly targetPackageId: string
  readonly targetPackageDigestSha256: string
}

/**
 * Test-only bridge for the mounted browser proof. It uses the same request-
 * scoped local PostgREST ports as the product server, persists a real exact
 * Brief and target package, and completes the server-derived work graph with
 * controlled private outputs. It creates no browser mutation authority and
 * performs no provider, cloud, billing, or remote operation.
 */
export async function prepareCanonicalV3MountedEditReferenceApplyFixture(
  input: CanonicalV3MountedEditReferenceApplyFixtureInput,
): Promise<CanonicalV3MountedEditReferenceApplyFixtureResult> {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') {
    throw new Error('The mounted Apply fixture requires the isolated canonical V3 loopback stack.')
  }

  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: input.localStorageRoot,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const now = new Date().toISOString()
  const sourceStorageObjectRecordId = randomUUID()
  const sourceMediaAssetId = randomUUID()
  const sourceChecksumSha256 = sha256(`mounted-target-source:${input.fixtureKey}`)
  const source: ApprovedEditExecutionUploadedMediaSourceAssetClientInput = {
    mediaAssetId: sourceMediaAssetId,
    storageObjectRecordId: sourceStorageObjectRecordId,
    sourceSequenceItemId: randomUUID(),
    uploadedClipId: randomUUID(),
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'source-media',
    storagePath: `private/canonical-v3/${input.workspaceId}/${sourceMediaAssetId}.mp4`,
    fileName: 'canonical-v3-target-documentary.mp4',
    mimeType: 'video/mp4',
    byteSize: 512 * 1024 * 1024,
    checksumSha256: sourceChecksumSha256,
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'local_ffprobe',
      durationSeconds: 120,
      width: 1920,
      height: 1080,
      videoCodec: 'h264',
      audioCodec: 'aac',
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      streamCount: 2,
      hasVideo: true,
      hasAudio: true,
    },
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }

  let editBriefState = createInitialEditBriefState({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.ownerUserId,
  })
  editBriefState = updateEditBriefGoal(
    editBriefState,
    'Preserve the factual sequence and adapt approved editing intelligence to this exact video.',
  )
  editBriefState = updateEditBriefAudience(editBriefState, 'Documentary viewers')
  editBriefState = updateEditBriefPlatforms(editBriefState, ['youtube'])
  editBriefState = updateEditBriefStyleKeywords(editBriefState, [
    'restrained',
    'evidence-led',
    'speech-safe',
  ])
  editBriefState = updateEditBriefPacingPreference(editBriefState, 'natural')
  editBriefState = updateEditBriefCaptionPreference(editBriefState, 'premium_subtle')
  editBriefState = updateEditBriefMusicPreference(editBriefState, 'subtle')
  editBriefState = markEditBriefReady(editBriefState)

  const briefText = createCurrentEditReferenceBackendBriefText(editBriefState)
  const exactBriefFactory =
    createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory({
      endpointOrigin: input.endpointOrigin,
      anonKey: input.anonKey,
      localInternalSigningSecret: input.localInternalSigningSecret,
    })
  const exactBrief = exactBriefFactory.createForAuthenticatedRequest({
    env,
    authority: {
      ownerUserId: input.ownerUserId,
      authenticatedAccessToken: input.authenticatedAccessToken,
      isMockUser: false,
    },
  })
  const savedBrief = await exactBrief.save({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    briefText,
    sourceStorageObjectRecordId,
    sourceMediaAssetId,
    idempotencyKey: `mounted-brief-${input.fixtureKey}`,
  })

  const baseline: LocalInternalEditPreferenceBaseline = {
    editLevel: 'pro',
    workflowType: 'testimonial_case_study',
    cleanupPreference: 'balanced_cleanup',
    visualPreference: 'balanced_visual_mix',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
    snapshotId: `canonical-v3-baseline-${sha256(input.fixtureKey).slice(0, 32)}`,
    capturedAt: now,
    persistenceSource: 'authenticated_private_internal_backend',
    provenance: 'saved_edit_preferences',
  }
  const exactPreferenceClient = createEditReferenceLocalSupabaseHttpRpcClient({
    endpointOrigin: input.endpointOrigin,
    anonKey: input.anonKey,
    authenticatedAccessToken: input.authenticatedAccessToken,
  })
  const exactPreferenceAdapter = createEditReferenceLocalSupabaseRpcAdapter({
    client: exactPreferenceClient,
    capability: createEditReferenceLocalSupabaseRpcCapability({
      client: exactPreferenceClient,
      endpointOrigin: input.endpointOrigin,
    }),
  })
  const preferenceAuthorityScope = {
    actorUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    selectedApplicationId: null,
  }
  let exactPreferenceAuthority = await exactPreferenceAdapter
    .readExactEditApplyAuthority(preferenceAuthorityScope)
  if (exactPreferenceAuthority.values.editLevel !== 'premium') {
    const operation = createExactEditPreferenceApplyOperation({
      authority: exactPreferenceAuthority,
      values: {
        ...exactPreferenceAuthority.values,
        editLevel: 'premium',
      },
      referenceMutation: null,
    })
    const response = await fetch(
      `${input.apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}`
        + `/edit-sessions/${encodeURIComponent(input.editSessionId)}`
        + '/edit-preferences/apply',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${input.authenticatedAccessToken}`,
          'content-type': 'application/json',
          'idempotency-key': `mounted-full-capability-${input.fixtureKey}`,
        },
        body: JSON.stringify(operation),
        signal: AbortSignal.timeout(15_000),
      },
    )
    const body = await response.text()
    if (!response.ok) {
      throw new Error(`Mounted full-capability authority failed: ${response.status} ${body}`)
    }
    exactPreferenceAuthority = await exactPreferenceAdapter
      .readExactEditApplyAuthority(preferenceAuthorityScope)
    if (exactPreferenceAuthority.values.editLevel !== 'premium') {
      throw new Error('Mounted full-capability authority was not recovered after exact reread.')
    }
  }
  const currentPreferences = exactPreferenceAuthority.values
  const createdHandoff = createLocalInternalProjectHandoff({
    projectName: 'Canonical V3 documentary project',
    editName: 'Canonical V3 target application',
    category: 'documentary_case_study',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    now: new Date(now),
    setup: {
      // The mounted browser rereads the canonical source-led Chat before it
      // accepts this package. This isolated fixture has no saved Chat
      // directions, so bind the package to that exact empty authority instead
      // of inventing a browser-local instruction that becomes stale on reread.
      customInstructions: '',
      sourceOrderConfirmed: true,
      cleanupPreference: currentPreferences.cleanupPreference,
      cleanupPreferenceConfirmed: true,
      aspectRatio: '16:9',
      aspectRatioConfirmed: true,
      aspectRatioSource: 'user_selected',
      editLevel: currentPreferences.editLevel,
      editLevelConfirmed: true,
      visualPreference: currentPreferences.visualPreference,
      visualPreferenceConfirmed: true,
      targetPlatform: currentPreferences.targetPlatform,
      workflowType: currentPreferences.workflowType,
      moodStyle: currentPreferences.moodStyle,
      creditPreference: currentPreferences.creditPreference,
      preferenceDefaultsApplied: true,
      preferenceSnapshotId: baseline.snapshotId,
      preferenceSnapshotAppliedAt: now,
      preferencePersistenceSource: baseline.persistenceSource,
      preferenceBaseline: baseline,
      preferenceOverrideKeys: getCurrentEditPreferenceOverrideKeys(
        currentPreferences,
        baseline,
      ),
      preferenceRevision: exactPreferenceAuthority.preferenceRevision,
      preferenceUpdatedAt: now,
    },
  })
  const handoff: LocalInternalProjectHandoff = {
    ...createdHandoff,
    stage: 'source_uploaded',
    sourceFileCount: 1,
    sourceMediaAssets: [source],
    editBriefState,
    updatedAt: now,
  }

  const authority = resolveCurrentEditReferenceActiveEditorAuthority({
    aspectRatio: '16:9',
    aspectRatioConfirmed: true,
    backendBrief: { ...savedBrief.record, readbackVerified: true },
    createdAt: handoff.createdAt,
    currentUserInstruction: handoff.setup?.customInstructions ?? '',
    editBriefState,
    editLevel: currentPreferences.editLevel,
    editName: handoff.editName ?? 'Canonical V3 target application',
    editSessionId: input.editSessionId,
    ownerUserId: input.ownerUserId,
    projectId: input.projectId,
    projectName: handoff.projectName,
    sourceMediaAssets: [source],
    targetPlatform: currentPreferences.targetPlatform,
    updatedAt: handoff.updatedAt,
    workspaceId: input.workspaceId,
  })
  if (!authority.ready) throw new Error(`Mounted target authority failed: ${authority.message}`)

  const targetContext = createPreferenceApplicationTargetContext({
    bundle: authority.authority.bundle,
    currentUserInstruction: authority.authority.currentUserInstruction,
    outputFrameConfirmed: true,
  })
  const plan = createEditReferenceLongFormStudyPlan({
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    source: {
      privateMediaArtifactId: sourceStorageObjectRecordId,
      mediaChecksumSha256: sourceChecksumSha256,
      durationSeconds: source.sourceMetadata?.durationSeconds ?? 120,
      sizeBytes: source.byteSize,
      mimeType: source.mimeType,
      hasAudio: true,
    },
    includeCaptionOcr: true,
    createdAt: now,
  })
  const runId = `mounted-target-${input.fixtureKey}`
  const preparedRun = prepareEditReferenceLongFormStudyRun({
    plan,
    run: createEditReferenceLongFormStudyRun({ runId, plan, createdAt: now }),
    ingestIntegrityDigestSha256: sha256(`mounted-ingest:${input.fixtureKey}`),
    mediaProbeDigestSha256: sha256(`mounted-probe:${input.fixtureKey}`),
    mediaProbeObservedWallClockMs: 800,
    now,
  })
  const longFormFactory =
    createEditReferenceCanonicalV3LocalLongFormRuntimePortFactory({
      endpointOrigin: input.endpointOrigin,
      anonKey: input.anonKey,
      localInternalSigningSecret: input.localInternalSigningSecret,
    })
  const longFormRuntime = longFormFactory.createForAuthenticatedRequest({
    env,
    authority: {
      ownerUserId: input.ownerUserId,
      authenticatedAccessToken: input.authenticatedAccessToken,
      isMockUser: false,
    },
  })
  const createdStudy = await longFormRuntime.create({
    scope: {
      localStorageRoot: input.localStorageRoot,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
    },
    plan,
    run: preparedRun,
    sourceBinding: {
      sourceAuthority: 'target_source_media',
      sourceAssetId: randomUUID(),
      sourceStorageObjectRecordId,
      sourceMediaAssetId,
      sourceStorageObjectId: source.storagePath,
      sourceStorageGeneration: '1',
      sourceStorageEtag: `mounted-${sha256(input.fixtureKey).slice(0, 24)}`,
      targetProjectId: input.projectId,
      targetEditSessionId: input.editSessionId,
      targetEditBriefId: savedBrief.record.id,
      targetEditBriefRevision: savedBrief.record.revisionNumber,
      targetEditBriefDigestSha256: savedBrief.record.contentDigestSha256,
    },
  })
  const completed = await completeCanonicalV3PrePlanStudyFixture({
    endpointOrigin: input.endpointOrigin,
    anonKey: input.anonKey,
    authenticatedAccessToken: input.authenticatedAccessToken,
    localInternalSigningSecret: input.localInternalSigningSecret,
    runId,
  })
  if (completed.run.state !== 'completed') {
    throw new Error('The mounted target study did not reach its durable completed state.')
  }

  const targetPackage = createReadyTargetVideoUnderstandingFixture({
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    targetContext,
    fixtureKey: input.fixtureKey,
    durationSeconds: plan.source.durationSeconds,
    sourceBinding: {
      storageObjectRecordId: sourceStorageObjectRecordId,
      mediaAssetId: sourceMediaAssetId,
      checksumSha256: sourceChecksumSha256,
      sizeBytes: source.byteSize,
      mimeType: source.mimeType,
    },
    editBriefBinding: {
      id: savedBrief.record.id,
      revision: savedBrief.record.revisionNumber,
      digestSha256: savedBrief.record.contentDigestSha256,
    },
    studyBinding: {
      runId: completed.run.runId,
      runRevision: completed.run.revision,
      planId: completed.run.planId,
      planDigestSha256: completed.run.planDigestSha256,
      totalWorkItemCount: completed.run.totalWorkItemCount,
      chunkCount: createdStudy.plan.chunks.length,
    },
  })
  const targetFactory =
    createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory({
      endpointOrigin: input.endpointOrigin,
      anonKey: input.anonKey,
      localInternalSigningSecret: input.localInternalSigningSecret,
    })
  const targetPort = targetFactory.createForAuthenticatedRequest({
    env,
    authority: {
      ownerUserId: input.ownerUserId,
      authenticatedAccessToken: input.authenticatedAccessToken,
      isMockUser: false,
    },
  })
  const savedTarget = await targetPort.save({
    scope: {
      localStorageRoot: input.localStorageRoot,
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
    },
    package: targetPackage,
  })
  if (savedTarget.disposition !== 'created') {
    throw new Error('The mounted target package unexpectedly reused an earlier fixture.')
  }

  return {
    handoff,
    runId,
    totalWorkItemCount: completed.run.totalWorkItemCount,
    targetPackageId: targetPackage.packageId,
    targetPackageDigestSha256: targetPackage.packageDigestSha256,
  }
}

function sha256(value: unknown): string {
  return createHash('sha256').update(String(value)).digest('hex')
}
