import { createHash } from 'node:crypto'

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
import type {
  CanonicalCaptionSpecialistPlanningProjection,
} from '../../src/types/canonical-caption-specialist-planning'
import { createCanonicalPlanPresentationCoordinatorService } from './canonical-plan-presentation-coordinator-service'
import { createCanonicalPlanningHandoffService } from './canonical-planning-handoff-service'
import {
  compileCanonicalSourceLedPlan,
} from './canonical-source-led-plan-compiler'
import {
  buildCanonicalSourceLedProfessionalLongFormSeedDraft,
} from './canonical-source-led-professional-long-form-publication'
import { createProjectService } from './project-service'
import {
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'
import {
  createCanonicalSourceLedChatPlanBinding,
  readCanonicalSourceLedChatDirectionsForPlanning,
} from './canonical-source-led-chat-direction-service'
import {
  readPrivateEditBriefAuthorityAggregate,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import {
  readPrivateUploadMediaAuthorityAggregate,
} from './private-upload-media-authority-store'
import {
  readOrReconcileCanonicalSourceCleanupAuthority,
  type CanonicalSourceAnalysisPlanningScope,
} from './canonical-source-led-orchestra-planning-reconciliation'
import { createSourceMediaAuthorityService } from './source-media-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  applyCanonicalCaptionSourceLedProfessionalPlanning,
  createCanonicalCaptionSourceLedProfessionalPlanningRequest,
  readCanonicalCaptionSourceLedProfessionalPlanning,
} from '../captions-specialist/caption-source-led-professional-planning'
import {
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort,
} from '../captions-specialist/caption-source-led-professional-planning-owner'

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
      const chatDirections =
        await readCanonicalSourceLedChatDirectionsForPlanning({
          scope,
          authority,
          confirmedAspectRatio: body.confirmedAspectRatio,
        })

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
      const editBrief = resolveOptionalReadySourceLedEditBrief(editBriefAggregate)
      const selectedMediaAssetIds = new Set(body.orderedMediaAssetIds)
      const unsupportedRequiredAssets = (editBrief?.fields.mustUseAssetIds ?? [])
        .filter((assetId) => !selectedMediaAssetIds.has(assetId))
      const explicitlyAvoidedSelectedAssets = (editBrief?.fields.avoidAssetIds ?? [])
        .filter((assetId) => selectedMediaAssetIds.has(assetId))
      const bRollPreferenceDisposition =
        classifySourceLedBRollPreference(editBrief?.fields.bRollPreference)
      if (
        unsupportedRequiredAssets.length > 0 ||
        explicitlyAvoidedSelectedAssets.length > 0 ||
        (editBrief?.fields.userProvidedReferenceUrls?.length ?? 0) > 0 ||
        bRollPreferenceDisposition === 'asset_planning_required'
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The current Edit Brief needs the later asset/reference planning route.',
          409,
          {
            requiredGate: 'server_asset_and_reference_planning',
            unsupportedRequiredAssetCount: unsupportedRequiredAssets.length,
            avoidedSelectedAssetCount: explicitlyAvoidedSelectedAssets.length,
            bRollPreferenceDisposition,
          },
        )
      }
      const confirmedMarkers = (editBriefAggregate?.markers ?? []).filter(
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
        editBriefAggregate,
        chatInstructionHistory: chatDirections.instructionHistory,
      })
      const cleanupScope = {
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
        planningDirectionDigestSha256:
          sha256(plannerInput.customInstructions),
        userInstructionDigestSha256:
          chatDirections.authorityDigestSha256,
        sources: selectedSources.map(({ mediaAsset }, index) => ({
          sourceSequenceItemId: mediaAsset.id,
          mediaAssetId: mediaAsset.id,
          uploadedOrder: index + 1,
          checksumSha256: mediaAsset.checksumSha256,
        })),
      }
      const sourceCleanupAuthorityRead =
        context.canonicalSourceCleanupAuthorityReadPort
          ? context.canonicalSourceLedOrchestraPlanningReconciliationPort
            ? await readOrReconcileCanonicalSourceCleanupAuthority({
                readPort: context.canonicalSourceCleanupAuthorityReadPort,
                reconciliationPort:
                  context
                    .canonicalSourceLedOrchestraPlanningReconciliationPort,
                cleanupScope,
                planningScope: buildCanonicalSourceAnalysisPlanningScope({
                  ownerUserId: actorUserId,
                  workspaceId: access.workspaceId,
                  projectId,
                  editSessionId,
                  planningDirection: plannerInput.customInstructions,
                  planningDirectionDigestSha256:
                    cleanupScope.planningDirectionDigestSha256,
                  userInstructionDigestSha256:
                    cleanupScope.userInstructionDigestSha256,
                  selectedSources,
                }),
              })
            : await context.canonicalSourceCleanupAuthorityReadPort
                .readForPlanning(cleanupScope)
          : undefined
      if (sourceCleanupAuthorityRead?.status === 'not_found') {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Whole-video Visual Intelligence cleanup evidence is not ready for these exact sources and instructions.',
          409,
          {
            requiredGate:
              'canonical_whole_video_visual_intelligence_cleanup_authority',
          },
        )
      }

      const captionMarkers = confirmedMarkers.filter(
        (marker) => marker.markerType === 'caption',
      )
      const confirmedCaptionMarkerSetRef = captionMarkers.length > 0
        ? (() => {
            const contentHash = sha256(JSON.stringify(captionMarkers.map(
              (marker) => ({
                markerId: marker.id,
                revision: marker.revision,
                startFrame: marker.startFrame,
                endFrame: marker.endFrame,
                frameRate: marker.frameRate,
                priority: marker.priority,
                status: marker.status,
                timingStatus: marker.timingStatus,
                titleHash: sha256(marker.title),
                noteHash: sha256(marker.note),
              }),
            )))
            return {
              id: `caption-marker-set.${contentHash.slice(0, 32)}`,
              version: 'canonical-confirmed-caption-marker-set-v1',
              contentHash,
            }
          })()
        : null
      const compilePlan = (
        selectedCaptionMarkers: typeof captionMarkers,
      ) => compileCanonicalSourceLedPlan({
        plannerInput,
        sourceMediaAssets,
        editBrief,
        confirmedCaptionMarkers: selectedCaptionMarkers,
        ...(sourceCleanupAuthorityRead?.status === 'ready'
          ? { sourceCleanupAuthority: sourceCleanupAuthorityRead.authority }
          : {}),
      })
      let compiled: ReturnType<typeof compileCanonicalSourceLedPlan>
      try {
        compiled = compilePlan(captionMarkers)
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
      let publication =
        compiled.canonicalDraft.publication ??
        compiled.professionalLongFormPublication
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
      const chatPlanBinding = createCanonicalSourceLedChatPlanBinding({
        scope,
        directions: chatDirections,
      })
      const attachChatAuthority = () => {
        const compiledIntentWithChatAuthority = {
          ...compiled.canonicalDraft.components.compiledIntent,
          canonicalSourceLedChatAuthority: { ...chatPlanBinding },
        }
        compiled.canonicalDraft.components.compiledIntent =
          compiledIntentWithChatAuthority
        publication!.canonicalPlan.components.compiledIntent =
          structuredClone(compiledIntentWithChatAuthority)
      }
      attachChatAuthority()

      let captionProfessionalPlanningProjection:
        CanonicalCaptionSpecialistPlanningProjection | undefined
      {
        let baseComponents = canonicalPlanComponentsSchema.parse(
          compiled.canonicalDraft.components,
        )
        const createCaptionPlanningRequest = () => {
          const outputIdentitySuffix = sha256(JSON.stringify({
            workspaceId: access.workspaceId,
            projectId,
            editSessionId,
            planningRequestId: publication!.planningRequestIdSeed,
            confirmedAspectRatio: body.confirmedAspectRatio,
          })).slice(0, 32)
          return createCanonicalCaptionSourceLedProfessionalPlanningRequest({
            canonicalScope: {
              ownerUserId: actorUserId,
              workspaceId: access.workspaceId,
              projectId,
              editSessionId,
              planningRequestId: publication!.planningRequestIdSeed,
              outputId: `caption-output.${outputIdentitySuffix}`,
            },
            components: baseComponents,
            confirmedCaptionMarkerSetRef,
          })
        }
        const readCaptionPlanning = async () => {
          const request = createCaptionPlanningRequest()
          const port =
            context.canonicalCaptionSourceLedProfessionalPlanningReadPort ??
            createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
              plannerInput,
              components: baseComponents,
              ...(sourceCleanupAuthorityRead?.status === 'ready'
                ? {
                    sourceCleanupAuthority:
                      sourceCleanupAuthorityRead.authority,
                  }
                : {}),
              confirmedCaptionMarkerSetRef,
            })
          return {
            request,
            read: await readCanonicalCaptionSourceLedProfessionalPlanning({
              port,
              request,
            }),
          }
        }
        let captionPlanningResult = await readCaptionPlanning()
        let captionPlanningRequest = captionPlanningResult.request
        let captionPlanningRead = captionPlanningResult.read
        if (captionPlanningRead.status === 'blocked_requested') {
          throw new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'Professional Caption planning was requested but its exact canonical owner evidence is not ready.',
            409,
            {
              requiredGate:
                'canonical_caption_source_led_professional_planning_authority',
              blockerCodes: captionPlanningRead.blockerCodes,
            },
          )
        }
        if (captionPlanningRead.status === 'ready') {
          if (captionMarkers.length > 0) {
            if (captionPlanningRead.authority.selectionDisposition ===
              'no_captions') {
              throw new ApiError(
                'JOB_DEPENDENCY_NOT_READY',
                'The professional no_captions restraint conflicts with confirmed Caption markers.',
                409,
                {
                  requiredGate:
                    'canonical_caption_selection_and_marker_reconciliation',
                },
              )
            }
            try {
              compiled = compilePlan([])
            } catch (error) {
              throw new ApiError(
                'JOB_DEPENDENCY_NOT_READY',
                error instanceof Error
                  ? error.message
                  : 'The professional Caption plan could not retire the legacy marker lane.',
                409,
                {
                  requiredGate:
                    'canonical_caption_legacy_lane_retirement_recompile',
                },
                { cause: error },
              )
            }
            publication = compiled.canonicalDraft.publication ??
              compiled.professionalLongFormPublication
            if (!publication) {
              throw new ApiError(
                'JOB_DEPENDENCY_NOT_READY',
                'The Caption-clean source-led plan did not produce a publishable canonical package.',
                409,
                {
                  requiredGate:
                    'publishable_caption_clean_source_led_plan',
                },
              )
            }
            attachChatAuthority()
            baseComponents = canonicalPlanComponentsSchema.parse(
              compiled.canonicalDraft.components,
            )
            captionPlanningResult = await readCaptionPlanning()
            captionPlanningRequest = captionPlanningResult.request
            const reread = captionPlanningResult.read
            if (
              reread.status !== 'ready' ||
              reread.authority.selectionDisposition !==
                captionPlanningRead.authority.selectionDisposition
            ) {
              throw new ApiError(
                'JOB_DEPENDENCY_NOT_READY',
                'Professional Caption planning changed after the legacy caption lane was removed.',
                409,
                {
                  requiredGate:
                    'canonical_caption_professional_plan_stable_recompile_reread',
                },
              )
            }
            captionPlanningRead = reread
          }
          const applied =
            applyCanonicalCaptionSourceLedProfessionalPlanning({
              request: captionPlanningRequest,
              authority: captionPlanningRead.authority,
              components: baseComponents,
              estimate: publication.canonicalPlan.estimate,
              workItems: publication.canonicalPlan.workItems,
            })
          const validatedAppliedPlan =
            publishCanonicalEditPlanSchema.shape.canonicalPlan.parse({
              ...publication.canonicalPlan,
              components: applied.components,
              estimate: applied.estimate,
              workItems: applied.workItems,
            })
          publication.canonicalPlan = structuredClone(
            validatedAppliedPlan,
          ) as unknown as typeof publication.canonicalPlan
          compiled.canonicalDraft.components = structuredClone(
            publication.canonicalPlan.components,
          )
          compiled.canonicalDraft.estimate = structuredClone(
            publication.canonicalPlan.estimate,
          )
          captionProfessionalPlanningProjection = applied.projection
        }
      }

      const canonicalPlanComponents = canonicalPlanComponentsSchema.parse(
        compiled.canonicalDraft.components,
      )
      const handoff = await createCanonicalPlanningHandoffService(context).prepare({
        workspaceId: access.workspaceId,
        purpose: 'prepare_canonical_planning_handoff',
        orderedSourceItems: compiled.canonicalDraft.orderedSourceItems,
        canonicalPlanComponents,
        projectId,
        editSessionId,
      })
      const canonicalPlan =
        publishCanonicalEditPlanSchema.shape.canonicalPlan.parse(
          publication.canonicalPlan,
        )
      const professionalLongFormSeedDraft =
        compiled.professionalLongFormPublication
          ? buildCanonicalSourceLedProfessionalLongFormSeedDraft({
              workspaceId: access.workspaceId,
              projectId,
              editSessionId,
              planningRequestId: publication.planningRequestIdSeed,
              components: canonicalPlanComponents,
              sourceObjects: selectedSources.map(
                ({ mediaAsset, storageObject }) => ({
                  sourceSequenceItemId: mediaAsset.id,
                  mediaAssetId: mediaAsset.id,
                  storageProvider: storageObject.storageProvider,
                  generation: storageObject.generation,
                  region: storageObject.region,
                  sizeBytes: storageObject.sizeBytes,
                  checksumSha256: storageObject.checksumSha256,
                }),
              ),
            })
          : undefined
      const presentation =
        await createCanonicalPlanPresentationCoordinatorService(context).present({
          workspaceId: access.workspaceId,
          planningRequestId: publication.planningRequestIdSeed,
          canonicalPlan,
          expectedHandoffHash: handoff.handoffHash,
          projectId,
          editSessionId,
          handoffId: handoff.handoffId,
          ...(professionalLongFormSeedDraft
            ? { professionalLongFormSeedDraft }
            : {}),
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
          chatDirectionAuthority:
            'server_reverified_named_edit_chat' as const,
          chatDirectionCount: chatDirections.instructionHistory.length,
          chatThreadRevision: chatDirections.threadRevision,
          chatDirectionAuthorityDigestSha256:
            chatDirections.authorityDigestSha256,
          confirmedAspectRatio: body.confirmedAspectRatio,
          requestAcceptedBrowserPlan: false as const,
          requestAcceptedBrowserTiming: false as const,
          requestAcceptedBrowserEstimate: false as const,
          requestAcceptedBrowserWorkGraph: false as const,
          sourceObjectReread: true as const,
          exactPreferenceReread: true as const,
          editBriefReread: true as const,
          chatDirectionReread: true as const,
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
          ...(captionProfessionalPlanningProjection
            ? [
                'The canonical source-led plan includes exact Caption specialist selection/restraint, early planning, estimate, and typed work assignments; approval, execution, rendered QA, complete-time visual review, and private review remain downstream.',
              ]
            : []),
          compiled.evidence.sourceRangePolicy ===
            'head_intelligence_verified_visual_intelligence_cleanup'
            ? 'This source-led plan uses only exact Head Intelligence keep/remove decisions bound to complete transcript and whole-video Visual Intelligence evidence.'
            : compiled.professionalLongFormPublication
              ? 'This professional long-form source-led plan preserves every verified source frame and delegates chunk derivation, QA, and merge authority to the existing post-approval controller.'
              : 'This bounded server planner preserves every verified source frame and supports only exact confirmed captions.',
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
    mediaAsset.storageGeneration !== storageObject.generation ||
    mediaAsset.storageEtag !== storageObject.etag ||
    mediaAsset.storageMetageneration !== storageObject.metageneration ||
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

function buildCanonicalSourceAnalysisPlanningScope(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningDirection: string
  planningDirectionDigestSha256: string
  userInstructionDigestSha256: string
  selectedSources: readonly {
    mediaAsset: {
      id: string
      storageProvider: 'local_private' | 'google_cloud_storage'
      storageBucket: string
      storagePath: string
      mimeType: string
      sizeBytes: number
      checksumSha256: string
      storageGeneration?: string
      storageEtag?: string
    }
    storageObject: {
      storageProvider: 'local_private' | 'google_cloud_storage'
      bucketName: string
      objectPath: string
      mimeType: string
      sizeBytes: number
      checksumSha256: string
      generation?: string
      etag?: string
    }
  }[]
}): CanonicalSourceAnalysisPlanningScope {
  const sources = input.selectedSources.map(
    ({ mediaAsset, storageObject }, index) => {
      if (
        mediaAsset.storageProvider !== 'google_cloud_storage'
        || storageObject.storageProvider !== 'google_cloud_storage'
        || mediaAsset.mimeType !== 'video/mp4'
        || storageObject.mimeType !== 'video/mp4'
        || !mediaAsset.storageGeneration
        || !mediaAsset.storageEtag
        || !storageObject.generation
        || !storageObject.etag
      ) throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'Whole-video Visual Intelligence requires an exact finalized Google Cloud source identity before Orchestra preparation.',
        409,
        {
          requiredGate:
            'canonical_source_analysis_gcs_generation_etag_authority',
          mediaAssetId: mediaAsset.id,
        },
      )
      return {
        sourceSequenceItemId: mediaAsset.id,
        mediaAssetId: mediaAsset.id,
        uploadedOrder: index + 1,
        storageProvider: 'google_cloud_storage' as const,
        storageBucket: storageObject.bucketName,
        storagePath: storageObject.objectPath,
        contentType: 'video/mp4' as const,
        checksumSha256: storageObject.checksumSha256,
        byteLength: storageObject.sizeBytes,
        storageGeneration: storageObject.generation,
        storageEtag: storageObject.etag,
      }
    },
  )
  return {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    planningDirection: input.planningDirection,
    planningDirectionDigestSha256:
      input.planningDirectionDigestSha256,
    userInstructionDigestSha256: input.userInstructionDigestSha256,
    sources,
  }
}

function resolveOptionalReadySourceLedEditBrief(
  aggregate: PrivateEditBriefAuthorityAggregate | undefined,
) {
  if (!aggregate?.brief) return undefined
  if (
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
  editBriefAggregate?: PrivateEditBriefAuthorityAggregate
  chatInstructionHistory?: readonly string[]
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
  const brief = input.editBriefAggregate?.brief
  const instructions = [
    ...(brief ? [`Edit Brief goal: ${brief.fields.goal}`] : []),
    ...(brief?.fields.mustIncludeNotes ?? []).map((note) => `Must include: ${note}`),
    ...(brief?.fields.avoidNotes ?? []).map((note) => `Avoid: ${note}`),
    ...(brief?.fields.additionalNotes
      ? [`Additional direction: ${brief.fields.additionalNotes}`]
      : []),
    ...(brief?.fields.specialInstructions
      ? [`Special instruction: ${brief.fields.specialInstructions}`]
      : []),
    ...(brief?.fields.bRollPreference
      ? [`B-roll direction: ${brief.fields.bRollPreference}`]
      : []),
    ...(input.editBriefAggregate?.markers ?? [])
      .filter((marker) =>
        marker.status === 'confirmed' && marker.markerType === 'keep')
      .map((marker) => `Confirmed keep range: ${marker.note}`),
    ...(input.chatInstructionHistory ?? []).map(
      (direction) => `Chat direction: ${direction}`,
    ),
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export type SourceLedBRollPreferenceDisposition =
  | 'not_specified'
  | 'explicit_non_use'
  | 'asset_planning_required'

/**
 * The bounded source-led route may accept an explicit instruction to use no
 * B-roll. Any positive, conditional, or ambiguous B-roll direction still
 * requires the richer asset planner.
 */
export function classifySourceLedBRollPreference(
  value: string | undefined,
): SourceLedBRollPreferenceDisposition {
  const normalized = value
    ?.normalize('NFKC')
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return 'not_specified'

  const canonicalNonUseValues = new Set([
    'none',
    'no_b_roll',
    'no-b-roll',
    'source_only',
    'source-only',
    'source only',
    'source footage only',
    'uploaded footage only',
  ])
  if (canonicalNonUseValues.has(normalized)) return 'explicit_non_use'

  const explicitNonUse =
    /\bno (?:any |added |additional |extra |new )?b[ -]?roll\b/.test(
      normalized,
    ) ||
    /\bwithout (?:any |added |additional |extra |new )?b[ -]?roll\b/.test(
      normalized,
    ) ||
    /\b(?:do not|don't|dont|never) (?:add|use|include|insert|generate|create) (?:any |added |additional |extra |new )?b[ -]?roll\b/.test(
      normalized,
    ) ||
    /\b(?:omit|exclude|disable) (?:all |any )?b[ -]?roll\b/.test(
      normalized,
    ) ||
    /\b(?:source(?: footage)?|uploaded footage) only\b/.test(normalized) ||
    /\bonly (?:use )?(?:the )?(?:uploaded )?source(?: footage)?(?![-\w])/.test(
      normalized,
    )
  if (!explicitNonUse) return 'asset_planning_required'

  const withoutDeferredApprovalClause = normalized
    .replace(
      /\bunless (?:the )?user (?:later )?approves?(?: (?:it|a revision))?\b/g,
      '',
    )
    .replace(/\bunless (?:later )?approved\b/g, '')
  const hasPositiveOrConditionalException =
    /\b(?:except|unless|only when|only if|when needed|when useful|where useful|as needed|if needed|if useful|but (?:add|use|include|insert|generate|create))\b/.test(
      withoutDeferredApprovalClause,
    )

  return hasPositiveOrConditionalException
    ? 'asset_planning_required'
    : 'explicit_non_use'
}
