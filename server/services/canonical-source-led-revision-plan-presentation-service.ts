import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import {
  canonicalSourceLedCaptionRevisionPresentationSchema,
  presentCanonicalSourceLedCaptionRevisionSchema,
  type PresentCanonicalSourceLedCaptionRevisionBody,
} from '../validation/canonical-source-led-revision-plan-presentation-schemas'
import {
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import { compileCanonicalSourceLedPlan } from './canonical-source-led-plan-compiler'
import {
  buildServerPlannerInput,
  resolveExactFinalizedSource,
} from './canonical-source-led-plan-presentation-service'
import {
  createCanonicalSourceLedChatPlanBinding,
  readCanonicalSourceLedChatDirectionsForPlanning,
} from './canonical-source-led-chat-direction-service'
import { createCanonicalPrivateReviewDecisionService } from './canonical-private-review-decision-service'
import { createCanonicalRevisionPlanPresentationCoordinatorService } from './canonical-revision-plan-presentation-coordinator-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { createProjectService } from './project-service'
import {
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'
import {
  readPrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import {
  readPrivateUploadMediaAuthorityAggregate,
} from './private-upload-media-authority-store'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const REQUIRED_PRESERVATION_RULES = new Set([
  'source_order',
  'source_meaning',
  'important_clips',
  'approved_aspect_ratio',
  'edit_preferences',
  'edit_brief',
])

export function createCanonicalSourceLedRevisionPlanPresentationService(
  context: ServiceContext,
) {
  return {
    async present(input: PresentCanonicalSourceLedCaptionRevisionBody & {
      projectId: string
      editSessionId: string
      idempotencyKey: string
    }) {
      const {
        projectId,
        editSessionId,
        idempotencyKey,
        ...requestBody
      } = input
      const parsed =
        presentCanonicalSourceLedCaptionRevisionSchema.safeParse(requestBody)
      if (
        !parsed.success ||
        !safeIdentity(projectId) ||
        !safeIdentity(editSessionId) ||
        !validIdempotencyKey(idempotencyKey)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Server-derived source-led revision request validation failed.',
          400,
          parsed.success
            ? {
                routeIdentity: [
                  'Invalid project, edit-session, or idempotency identity.',
                ],
              }
            : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(
        context,
        body.workspaceId,
        'write',
      )
      if (access.userId !== actorUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Source-led revision planning is outside this workspace.',
          403,
        )
      }
      const project = (await createProjectService(context).getProject(
        projectId,
        access.workspaceId,
      )).project

      const completedRevision =
        await createCanonicalPrivateReviewDecisionService(
          context,
        ).getCompletedRevision({
          workspaceId: access.workspaceId,
          reviewAssemblyId: body.expectedReviewAssemblyId,
        })
      const decision = completedRevision.decision
      const revisionIntent = completedRevision.revisionIntent
      if (
        decision.identity.workspaceId !== access.workspaceId ||
        decision.identity.projectId !== projectId ||
        decision.identity.editSessionId !== editSessionId ||
        decision.identity.packageRecordId !== body.expectedPackageRecordId ||
        decision.identity.reviewAssemblyId !==
          body.expectedReviewAssemblyId ||
        decision.manifest.manifestSha256 !==
          body.expectedDecisionManifestSha256 ||
        decision.authority.finalArtifactSha256 !==
          body.expectedFinalArtifactSha256 ||
        !decision.revisionHandoff
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The source-led revision does not match the exact completed review decision.',
          409,
          { requiredGate: 'exact_source_led_private_review_revision' },
        )
      }
      assertBoundedCaptionRevision(revisionIntent)

      const priorAuthority = await createEditPlanningAuthorityService(
        context,
      ).loadApprovedExecutionAuthority(
        decision.identity.approvedPlanSnapshotId,
        access.workspaceId,
      )
      if (
        priorAuthority.snapshot.projectId !== projectId ||
        priorAuthority.snapshot.editSessionId !== editSessionId ||
        priorAuthority.snapshot.planId !== decision.authority.approvedPlanId ||
        priorAuthority.snapshot.planVersion !==
          decision.authority.approvedPlanVersion ||
        priorAuthority.snapshot.snapshotHash !==
          decision.authority.approvedSnapshotHash ||
        priorAuthority.plan.planHash !== decision.authority.approvedPlanHash ||
        priorAuthority.estimate.estimateHash !==
          decision.authority.approvedEstimateHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The prior approved source-led snapshot no longer matches the revision decision.',
          409,
          { requiredGate: 'exact_prior_source_led_snapshot' },
        )
      }
      const sourceSequence = [...priorAuthority.components.sourceSequence]
        .sort((left, right) => left.uploadedOrder - right.uploadedOrder)
      if (
        sourceSequence.length < 1 ||
        sourceSequence.length > 8 ||
        sourceSequence.some((item, index) =>
          item.uploadedOrder !== index + 1 ||
          !item.checksumSha256)
      ) {
        throw blocked(
          'The approved source-led sequence is not eligible for bounded revision.',
        )
      }

      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      const exactPreferenceResolution =
        await readPlanningExactEditPreferenceAuthority({ context, scope })
      const preference = exactPreferenceResolution.authority
      if (
        !preference.locked ||
        preference.frameConfirmation.status !== 'confirmed' ||
        preference.frameConfirmation.aspectRatio !==
          priorAuthority.components.confirmedSettings.aspectRatio ||
        preference.baseline.preferenceSnapshotId !==
          priorAuthority.components.confirmedSettings.preferenceSnapshotId ||
        preference.preferenceRevision !==
          priorAuthority.components.confirmedSettings.preferenceRevision ||
        preference.planningInputRevision !==
          priorAuthority.components.confirmedSettings
            .preferencePlanningInputRevision ||
        preference.preferenceFingerprintSha256 !==
          priorAuthority.components.confirmedSettings
            .preferenceFingerprintSha256
      ) {
        throw blocked(
          'The exact locked Edit Preferences no longer match the approved source-led snapshot.',
        )
      }
      const chatDirections =
        await readCanonicalSourceLedChatDirectionsForPlanning({
          scope,
          authority: preference,
          confirmedAspectRatio: preference.frameConfirmation.aspectRatio,
        })

      const editBriefAggregate =
        await readPrivateEditBriefAuthorityAggregate(scope)
      const editBrief = editBriefAggregate?.brief
      if (
        !editBriefAggregate ||
        !editBrief ||
        editBrief.fields.status !== 'ready' ||
        editBriefAggregate.lifecycle.phase !== 'approved_snapshot' ||
        editBriefAggregate.lifecycle.mutable !== false
      ) {
        throw blocked(
          'The immutable approved Edit Brief is required for source-led revision.',
        )
      }
      const activeConfirmedMarkers = editBriefAggregate.markers.filter(
        (marker) =>
          marker.status === 'confirmed',
      )
      const captionMarkers = activeConfirmedMarkers.filter(
        (marker) => marker.markerType === 'caption',
      )
      const unsupportedMarkers = activeConfirmedMarkers.filter(
        (marker) =>
          marker.markerType !== 'caption' &&
          marker.markerType !== 'keep',
      )
      if (
        captionMarkers.length !== 1 ||
        unsupportedMarkers.length > 0 ||
        captionMarkers[0]!.note.trim() ===
          revisionIntent.captionReplacementText
      ) {
        throw blocked(
          'The bounded source-led revision requires one changed caption and no unsupported markers.',
        )
      }

      const uploadAggregate =
        await readPrivateUploadMediaAuthorityAggregate({
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: actorUserId,
          workspaceId: access.workspaceId,
        })
      if (!uploadAggregate) {
        throw blocked(
          'Finalized source-media authority is missing during revision.',
        )
      }
      const selectedSources = sourceSequence.map((source, index) =>
        resolveExactFinalizedSource({
          aggregate: uploadAggregate,
          actorUserId,
          workspaceId: access.workspaceId,
          projectId,
          mediaAssetId: source.mediaAssetId,
          uploadedOrder: index + 1,
        }))
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
        authority: preference,
        confirmedAspectRatio: preference.frameConfirmation.aspectRatio,
        sourceMediaAssets,
        editBriefAggregate,
        chatInstructionHistory: chatDirections.instructionHistory,
      })
      const compiled = compileCanonicalSourceLedPlan({
        plannerInput,
        sourceMediaAssets,
        editBrief,
        confirmedCaptionMarkers: [{
          ...captionMarkers[0]!,
          note: revisionIntent.captionReplacementText!,
        }],
      })
      const publication = compiled.canonicalDraft.publication
      if (!publication) {
        throw blocked(
          'The revised source-led plan did not produce a publishable canonical package.',
        )
      }
      const chatPlanBinding = createCanonicalSourceLedChatPlanBinding({
        scope,
        directions: chatDirections,
      })
      const compiledIntentWithChatAuthority = {
        ...compiled.canonicalDraft.components.compiledIntent,
        canonicalSourceLedChatAuthority: { ...chatPlanBinding },
      }
      compiled.canonicalDraft.components.compiledIntent =
        compiledIntentWithChatAuthority
      publication.canonicalPlan.components.compiledIntent =
        structuredClone(compiledIntentWithChatAuthority)
      const canonicalPlan =
        publishCanonicalEditPlanSchema.shape.canonicalPlan.parse(
          publication.canonicalPlan,
        )
      assertImmutableSourceLedRevision({
        priorComponents: priorAuthority.components,
        revisedComponents: canonicalPlan.components,
      })

      const revisionPresentation =
        await createCanonicalRevisionPlanPresentationCoordinatorService(
          context,
        ).present({
          workspaceId: access.workspaceId,
          expectedPackageRecordId: body.expectedPackageRecordId,
          expectedReviewAssemblyId: body.expectedReviewAssemblyId,
          expectedDecisionManifestSha256:
            body.expectedDecisionManifestSha256,
          expectedFinalArtifactSha256: body.expectedFinalArtifactSha256,
          purpose: 'present_canonical_revision_plan',
          orderedSourceItems: compiled.canonicalDraft.orderedSourceItems,
          canonicalPlan,
          projectId,
          editSessionId,
          idempotencyKey,
        })

      const response =
        canonicalSourceLedCaptionRevisionPresentationSchema.parse({
          schemaVersion:
            'canonical-source-led-caption-revision-presentation-v1',
          source:
            'canonical_source_led_caption_revision_plan_presentation_service',
          purpose:
            'present_server_derived_source_led_caption_revision',
          identity: {
            workspaceId: access.workspaceId,
            projectId,
            editSessionId,
            priorReviewAssemblyId: body.expectedReviewAssemblyId,
            priorApprovedSnapshotId:
              priorAuthority.snapshot.snapshotId,
          },
          derivation: {
            exactRevisionDecisionReread: true,
            priorApprovedSnapshotReread: true,
            finalizedSourceObjectsReread: true,
            exactLockedPreferencesReread: true,
            immutableEditBriefReread: true,
            chatDirectionReread: true,
            chatDirectionCount: chatDirections.instructionHistory.length,
            chatThreadRevision: chatDirections.threadRevision,
            chatDirectionAuthorityDigestSha256:
              chatDirections.authorityDigestSha256,
            exactCaptionReplacementApplied: true,
            revisionIntentHash:
              decision.revisionHandoff.revisionIntentHash,
            sourceCount: sourceMediaAssets.length,
            captionCueCount: 1,
            browserPlanAccepted: false,
            browserTimingAccepted: false,
            browserEstimateAccepted: false,
            browserWorkGraphAccepted: false,
            browserCaptionTextAcceptedAtPlanning: false,
          },
          revisionPresentation: revisionPresentation.receipt,
          permissions: {
            replacementPlanPresented: true,
            freshApprovalRequired: true,
            snapshotCreated: false,
            creditReserved: false,
            workGraphStarted: false,
            toolExecutionStarted: false,
            renderStarted: false,
            deliveryStarted: false,
          },
          testOnly: true,
        })
      return {
        presentation: response,
        warnings: [
          ...revisionPresentation.warnings,
          'The backend re-read the exact saved revision text and rebuilt the bounded source-led plan without accepting a browser plan, timing map, estimate, work graph, or caption at planning time.',
        ],
      }
    },
  }
}

function assertBoundedCaptionRevision(
  revisionIntent: {
    changeCategories: string[]
    mustPreserve: string[]
    captionReplacementText?: string
  },
): void {
  const preservation = new Set(revisionIntent.mustPreserve)
  if (
    revisionIntent.changeCategories.length !== 1 ||
    revisionIntent.changeCategories[0] !== 'caption' ||
    typeof revisionIntent.captionReplacementText !== 'string' ||
    preservation.size !== REQUIRED_PRESERVATION_RULES.size ||
    [...REQUIRED_PRESERVATION_RULES].some(
      (rule) => !preservation.has(rule),
    )
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'This bounded server revision route currently supports one exact caption replacement while preserving source, frame, preferences, and Edit Brief authority.',
      409,
      { requiredGate: 'bounded_source_led_caption_revision' },
    )
  }
}

function assertImmutableSourceLedRevision(input: {
  priorComponents: {
    confirmedSettings: unknown
    sourceSequence: unknown
    sourceCleanupSummary: unknown
    sourceCleanupPlan: unknown
  }
  revisedComponents: {
    confirmedSettings: unknown
    sourceSequence: unknown
    sourceCleanupSummary: unknown
    sourceCleanupPlan: unknown
  }
}): void {
  for (const field of [
    'confirmedSettings',
    'sourceSequence',
    'sourceCleanupSummary',
    'sourceCleanupPlan',
  ] as const) {
    if (
      stableAuthorityStringify(input.priorComponents[field]) !==
      stableAuthorityStringify(input.revisedComponents[field])
    ) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        `Server-derived caption revision changed immutable ${field} authority.`,
        409,
      )
    }
  }
}

function blocked(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'server_derived_source_led_revision',
  })
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) &&
    !value.includes('..')
}

function validIdempotencyKey(value: string): boolean {
  const normalized = value.trim()
  return normalized.length >= 8 && normalized.length <= 240 &&
    !Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
}
