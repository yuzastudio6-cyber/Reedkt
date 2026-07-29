import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  presentCanonicalSourceLedPlanSchema,
  type PresentCanonicalSourceLedPlanBody,
} from '../validation/canonical-source-led-plan-presentation-schemas'
import {
  canonicalPlanComponentsSchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type {
  AspectRatio,
  FrameTemplateType,
  PlannerInput,
} from '../../src/types/reeditpro'
import { createCanonicalPlanPresentationCoordinatorService } from './canonical-plan-presentation-coordinator-service'
import { createCanonicalPlanningHandoffService } from './canonical-planning-handoff-service'
import {
  compileCanonicalSourceLedPlan,
} from './canonical-source-led-plan-compiler'
import { createProjectService } from './project-service'
import {
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'
import {
  readPrivateEditBriefAuthorityAggregate,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import {
  readPrivateUploadMediaAuthorityAggregate,
} from './private-upload-media-authority-store'
import { createSourceMediaAuthorityService } from './source-media-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalSourceLedPlanPresentationService(
  context: ServiceContext,
) {
  return {
    async present(input: PresentCanonicalSourceLedPlanBody & {
      projectId: string
      editSessionId: string
    }) {
      const {
        projectId,
        editSessionId,
        ...requestBody
      } = input
      const parsed = presentCanonicalSourceLedPlanSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(projectId) || !safeIdentity(editSessionId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Server-derived source-led plan request validation failed.',
          400,
          parsed.success
            ? { routeIdentity: ['Invalid project or edit-session identity.'] }
            : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Source-led planning is outside this workspace.',
          403,
        )
      }
      const project = (await createProjectService(context).getProject(
        projectId,
        access.workspaceId,
      )).project
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      const exactPreferenceResolution =
        await readPlanningExactEditPreferenceAuthority({ context, scope })
      const authority = exactPreferenceResolution.authority
      if (
        authority.locked ||
        authority.lifecyclePhase !== 'planning'
      ) {
        throw new ApiError(
          'PLAN_NOT_APPROVED',
          'Source-led planning requires one unlocked planning-phase edit.',
          409,
          {
            lifecyclePhase: authority.lifecyclePhase,
            locked: authority.locked,
          },
        )
      }
      if (
        authority.frameConfirmation.status === 'confirmed' &&
        authority.frameConfirmation.aspectRatio !== body.confirmedAspectRatio
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The confirmed output frame changed after exact edit authority was recorded.',
          409,
          {
            recordedAspectRatio: authority.frameConfirmation.aspectRatio,
            requestedAspectRatio: body.confirmedAspectRatio,
          },
        )
      }

      const uploadAggregate = await readPrivateUploadMediaAuthorityAggregate({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
      })
      if (!uploadAggregate) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'No finalized source-media authority exists for this workspace.',
          409,
        )
      }
      const selectedSources = body.orderedMediaAssetIds.map((mediaAssetId, index) =>
        resolveExactFinalizedSource({
          aggregate: uploadAggregate,
          actorUserId,
          workspaceId: access.workspaceId,
          projectId,
          mediaAssetId,
          uploadedOrder: index + 1,
        }))
      const orderedSourceItems = selectedSources.map(({ mediaAsset }, index) => ({
        sourceSequenceItemId: mediaAsset.id,
        mediaAssetId: mediaAsset.id,
        uploadedOrder: index + 1,
        checksumSha256: mediaAsset.checksumSha256,
        required: true,
      }))
      await createSourceMediaAuthorityService(context).buildManifestCandidate({
        workspaceId: access.workspaceId,
        projectId,
        uploadPurpose: 'source_media',
        orderedItems: orderedSourceItems,
      })

      const editBriefAggregate = await readPrivateEditBriefAuthorityAggregate(scope)
      const editBrief = requireReadySourceLedEditBrief(editBriefAggregate)
      const selectedMediaAssetIds = new Set(body.orderedMediaAssetIds)
      const unsupportedRequiredAssets = (editBrief.fields.mustUseAssetIds ?? [])
        .filter((assetId) => !selectedMediaAssetIds.has(assetId))
      const explicitlyAvoidedSelectedAssets = (editBrief.fields.avoidAssetIds ?? [])
        .filter((assetId) => selectedMediaAssetIds.has(assetId))
      if (
        unsupportedRequiredAssets.length > 0 ||
        explicitlyAvoidedSelectedAssets.length > 0 ||
        (editBrief.fields.userProvidedReferenceUrls?.length ?? 0) > 0 ||
        Boolean(editBrief.fields.bRollPreference?.trim())
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The current Edit Brief needs the later asset/reference planning route.',
          409,
          {
            requiredGate: 'server_asset_and_reference_planning',
            unsupportedRequiredAssetCount: unsupportedRequiredAssets.length,
            avoidedSelectedAssetCount: explicitlyAvoidedSelectedAssets.length,
          },
        )
      }
      const confirmedMarkers = editBriefAggregate!.markers.filter(
        (marker) => marker.status === 'confirmed',
      )
      const unsupportedMarkers = confirmedMarkers.filter(
        (marker) => marker.markerType !== 'caption' && marker.markerType !== 'keep',
      )
      if (unsupportedMarkers.length > 0) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The current confirmed Edit Brief markers require a richer server planner.',
          409,
          {
            requiredGate: 'server_semantic_marker_planning',
            unsupportedMarkerTypes: Array.from(
              new Set(unsupportedMarkers.map((marker) => marker.markerType)),
            ).sort(),
          },
        )
      }

      const sourceMediaAssets = selectedSources.map(
        ({ mediaAsset, storageObject }, index):
          ApprovedEditExecutionUploadedMediaSourceAssetClientInput => ({
          mediaAssetId: mediaAsset.id,
          storageObjectRecordId: storageObject.id,
          sourceSequenceItemId: mediaAsset.id,
          uploadedClipId: mediaAsset.id,
          uploadedOrder: index + 1,
          storageProvider: mediaAsset.storageProvider,
          storageBucket: mediaAsset.storageBucket,
          storagePath: mediaAsset.storagePath,
          fileName: mediaAsset.fileName,
          mimeType: mediaAsset.mimeType,
          byteSize: mediaAsset.sizeBytes,
          checksumSha256: mediaAsset.checksumSha256,
          sourceMetadata: mediaAsset.sourceMetadata,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        }),
      )
      const plannerInput = buildServerPlannerInput({
        projectName: project.name,
        authority,
        confirmedAspectRatio: body.confirmedAspectRatio,
        sourceMediaAssets,
        editBriefAggregate: editBriefAggregate!,
      })

      let compiled: ReturnType<typeof compileCanonicalSourceLedPlan>
      try {
        compiled = compileCanonicalSourceLedPlan({
          plannerInput,
          sourceMediaAssets,
          editBrief,
          confirmedCaptionMarkers: confirmedMarkers.filter(
            (marker) => marker.markerType === 'caption',
          ),
        })
      } catch (error) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          error instanceof Error
            ? error.message
            : 'The server-derived source-led plan is not ready.',
          409,
          { requiredGate: 'bounded_server_source_led_plan' },
          { cause: error },
        )
      }
      const publication = compiled.canonicalDraft.publication
      if (!publication) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The server-derived plan did not produce a publishable canonical package.',
          409,
          {
            requiredGate: 'publishable_canonical_source_led_plan',
            blockerCount: compiled.canonicalDraft.publicationBlockers.length,
          },
        )
      }

      const handoff = await createCanonicalPlanningHandoffService(context).prepare({
        workspaceId: access.workspaceId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: compiled.canonicalDraft.orderedSourceItems,
        canonicalPlanComponents: canonicalPlanComponentsSchema.parse(
          compiled.canonicalDraft.components,
        ),
        projectId,
        editSessionId,
      })
      const canonicalPlan =
        publishCanonicalEditPlanSchema.shape.canonicalPlan.parse(
          publication.canonicalPlan,
        )
      const presentation =
        await createCanonicalPlanPresentationCoordinatorService(context).present({
          workspaceId: access.workspaceId,
          planningRequestId: publication.planningRequestIdSeed,
          canonicalPlan,
          expectedHandoffHash: handoff.handoffHash,
          projectId,
          editSessionId,
          handoffId: handoff.handoffId,
        })

      return {
        schemaVersion: 'canonical-source-led-plan-presentation-v1' as const,
        source: 'canonical_source_led_plan_presentation_service' as const,
        identity: {
          workspaceId: access.workspaceId,
          projectId,
          editSessionId,
          handoffId: handoff.handoffId,
          handoffHash: handoff.handoffHash,
        },
        derivation: {
          ...compiled.evidence,
          confirmedAspectRatio: body.confirmedAspectRatio,
          requestAcceptedBrowserPlan: false as const,
          requestAcceptedBrowserTiming: false as const,
          requestAcceptedBrowserEstimate: false as const,
          requestAcceptedBrowserWorkGraph: false as const,
          sourceObjectReread: true as const,
          exactPreferenceReread: true as const,
          editBriefReread: true as const,
        },
        publicationRequest: presentation.publicationRequest,
        newlyPresented: presentation.newlyPresented,
        permissions: {
          planPresentedForReview: presentation.publicationRequest.publicationStatus === 'published',
          approvalGranted: false as const,
          snapshotCreated: false as const,
          creditReserved: false as const,
          toolExecution: false as const,
          providerCall: false as const,
          render: false as const,
          delivery: false as const,
        },
        warnings: [
          ...compiled.canonicalDraft.warnings,
          ...presentation.warnings,
          'This bounded server planner preserves every verified source frame and supports only exact confirmed captions.',
        ],
        testOnly: true as const,
      }
    },
  }
}

export function resolveExactFinalizedSource(input: {
  aggregate: NonNullable<
    Awaited<ReturnType<typeof readPrivateUploadMediaAuthorityAggregate>>
  >
  actorUserId: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  uploadedOrder: number
}) {
  const mediaAsset = input.aggregate.mediaAssets.find(
    (record) => record.id === input.mediaAssetId,
  )
  const uploadIntent = mediaAsset
    ? input.aggregate.uploadIntents.find(
        (record) => record.id === mediaAsset.uploadIntentId,
      )
    : undefined
  const storageObjectId = mediaAsset
    ? input.aggregate.storageObjectIdByMediaAssetId[mediaAsset.id]
    : undefined
  const storageObject = input.aggregate.storageObjects.find(
    (record) => record.id === storageObjectId,
  )
  if (
    !mediaAsset ||
    !uploadIntent ||
    !storageObject ||
    uploadIntent.status !== 'finalized' ||
    mediaAsset.status !== 'uploaded' ||
    storageObject.status !== 'ready' ||
    uploadIntent.requestedByUserId !== input.actorUserId ||
    uploadIntent.workspaceId !== input.workspaceId ||
    uploadIntent.projectId !== input.projectId ||
    uploadIntent.uploadPurpose !== 'source_media' ||
    uploadIntent.mediaAssetId !== mediaAsset.id ||
    mediaAsset.workspaceId !== input.workspaceId ||
    mediaAsset.projectId !== input.projectId ||
    mediaAsset.uploadPurpose !== 'source_media' ||
    mediaAsset.integrityVerified !== true ||
    storageObject.workspaceId !== input.workspaceId ||
    storageObject.projectId !== input.projectId ||
    storageObject.uploadPurpose !== 'source_media' ||
    storageObject.objectPurpose !== 'source_media' ||
    storageObject.integrityVerified !== true ||
    input.aggregate.mediaAssetIdByUploadIntentId[uploadIntent.id] !== mediaAsset.id ||
    input.aggregate.storageObjectIdByUploadIntentId[uploadIntent.id] !== storageObject.id ||
    input.aggregate.storageObjectIdByMediaAssetId[mediaAsset.id] !== storageObject.id ||
    mediaAsset.storageObjectRecordId !== storageObject.id ||
    storageObject.mediaAssetId !== mediaAsset.id ||
    storageObject.uploadIntentId !== uploadIntent.id ||
    mediaAsset.storageProvider !== storageObject.storageProvider ||
    mediaAsset.storageBucket !== storageObject.bucketName ||
    mediaAsset.storagePath !== storageObject.objectPath ||
    uploadIntent.targetBucket !== storageObject.bucketName ||
    uploadIntent.targetPath !== storageObject.objectPath ||
    mediaAsset.mimeType !== storageObject.mimeType ||
    mediaAsset.sizeBytes !== storageObject.sizeBytes ||
    mediaAsset.checksumSha256 !== storageObject.checksumSha256 ||
    (uploadIntent.checksumSha256 !== undefined &&
      uploadIntent.checksumSha256 !== mediaAsset.checksumSha256) ||
    (uploadIntent.expectedSizeBytes !== undefined &&
      uploadIntent.expectedSizeBytes !== mediaAsset.sizeBytes)
  ) {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      `Source ${input.uploadedOrder} does not match finalized private upload authority.`,
      409,
      { mediaAssetId: input.mediaAssetId },
    )
  }
  return { mediaAsset, uploadIntent, storageObject }
}

function requireReadySourceLedEditBrief(
  aggregate: PrivateEditBriefAuthorityAggregate | undefined,
) {
  if (
    !aggregate ||
    !aggregate.brief ||
    aggregate.brief.fields.status !== 'ready' ||
    aggregate.lifecycle.phase !== 'planning' ||
    aggregate.lifecycle.mutable !== true
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'A current mutable ready Edit Brief is required before server planning.',
      409,
      { requiredGate: 'ready_edit_brief' },
    )
  }
  return aggregate.brief
}

export function buildServerPlannerInput(input: {
  projectName: string
  authority: Awaited<
    ReturnType<typeof readPlanningExactEditPreferenceAuthority>
  >['authority']
  confirmedAspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3'
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  editBriefAggregate: PrivateEditBriefAuthorityAggregate
}): PlannerInput {
  const { authority } = input
  if (
    authority.frameConfirmation.status === 'confirmed' &&
    authority.frameConfirmation.aspectRatio !== input.confirmedAspectRatio
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'The requested output frame does not match exact edit authority.',
      409,
    )
  }
  const values = authority.values
  const brief = input.editBriefAggregate.brief!
  const instructions = [
    `Edit Brief goal: ${brief.fields.goal}`,
    ...(brief.fields.mustIncludeNotes ?? []).map((note) => `Must include: ${note}`),
    ...(brief.fields.avoidNotes ?? []).map((note) => `Avoid: ${note}`),
    ...(brief.fields.additionalNotes
      ? [`Additional direction: ${brief.fields.additionalNotes}`]
      : []),
    ...(brief.fields.specialInstructions
      ? [`Special instruction: ${brief.fields.specialInstructions}`]
      : []),
    ...input.editBriefAggregate.markers
      .filter((marker) =>
        marker.status === 'confirmed' && marker.markerType === 'keep')
      .map((marker) => `Confirmed keep range: ${marker.note}`),
  ]
  const clips = input.sourceMediaAssets.map((source, index) => {
    const sourceFrames = Math.round(
      (source.sourceMetadata?.durationSeconds ?? 0) * 30,
    )
    return {
      id: source.mediaAssetId,
      uploadedOrder: index + 1,
      fileName: source.fileName,
      duration: String(sourceFrames / 30),
      detectedType: 'Server-verified finalized uploaded video',
      notes:
        'Private uploaded source with server-computed checksum and FFprobe metadata.',
      sourceRole: 'main_story' as const,
      isImportant: true,
      isOptional: false,
    }
  })
  const aspectRatio = input.confirmedAspectRatio as AspectRatio
  return {
    projectName: input.projectName,
    targetPlatform: values.targetPlatform,
    aspectRatio,
    aspectRatioConfirmed: true,
    aspectRatioSource: 'user_selected',
    frameTemplateType: frameTemplateForAspectRatio(aspectRatio),
    editingCategory: values.workflowType,
    workflowType: values.workflowType,
    editLevel: values.editLevel,
    structurePreference: 'preserve_source_order',
    moodStyle: values.moodStyle,
    visualPreference: values.visualPreference,
    referenceUrl: '',
    customInstructions: instructions.join('\n'),
    userInstructionHistory: instructions,
    creditPreference: values.creditPreference,
    clips,
    sourceSequenceMode: clips.length === 1
      ? 'single_complete_video'
      : 'multi_clip_story_order',
    sourceOrderConfirmed: true,
    cleanupPreference: values.cleanupPreference,
    cleanupPreferenceConfirmed: true,
    preferenceDefaultsApplied: true,
    preferenceSnapshotId: authority.baseline.preferenceSnapshotId,
    preferenceSnapshotAppliedAt: authority.baseline.capturedAt,
    preferencePersistenceSource: 'authenticated_private_internal_backend',
    currentEditPreferenceOverrideKeys: [],
    currentEditPreferenceAuthorityValues: { ...values },
    currentEditPreferenceRecordRevision: authority.recordRevision,
    currentEditPreferenceRevision: authority.preferenceRevision,
    currentEditPreferencePlanningInputRevision: authority.planningInputRevision,
    currentEditPreferenceFingerprintSha256:
      authority.preferenceFingerprintSha256,
  }
}

function frameTemplateForAspectRatio(
  aspectRatio: AspectRatio,
): FrameTemplateType {
  if (aspectRatio === '9:16') return 'vertical_story_frame'
  if (aspectRatio === '16:9') return 'horizontal_wide_frame'
  if (aspectRatio === '1:1') return 'square_social_frame'
  if (aspectRatio === '4:5') return 'portrait_feed_lower_panel'
  if (aspectRatio === '4:3') return 'classic_documentary_center_panel'
  return 'let_ai_decide'
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)
    && !value.includes('..')
}
