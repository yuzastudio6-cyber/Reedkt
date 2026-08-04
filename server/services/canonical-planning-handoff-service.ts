import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPlanningHandoffResponseSchema,
  canonicalPlanningHandoffInspectionResponseSchema,
  createCanonicalPlanningHandoffSchema,
  publishCanonicalEditPlanFromHandoffSchema,
  type CanonicalPlanningHandoffInspectionQuery,
  type CreateCanonicalPlanningHandoffBody,
  type PublishCanonicalEditPlanFromHandoffBody,
} from '../validation/canonical-planning-handoff-schemas'
import { confirmedOutputAspectRatioSchema } from '../validation/exact-edit-preference-schemas'
import type {
  SourceBindingManifestCandidate,
  SourceMediaAuthorityExpectation,
} from '../validation/source-media-authority-schemas'
import { canonicalStorytellingStyleAuthorityMatchesScope } from '../validation/canonical-storytelling-style-authority-schemas'
import {
  buildCanonicalIdeaFirstSourceBindingManifestCandidate,
  revalidateCanonicalMotionStudioStorytellingProductionAuthority,
} from './canonical-motion-studio-storytelling-production-authority-service'
import {
  canonicalPlanningHandoffIdempotencyKeyHash,
  canonicalPlanningHandoffPublicationRequestHash,
  createEditPlanningAuthorityService,
} from './edit-planning-authority-service'
import { createProjectService } from './project-service'
import {
  buildCurrentPlanningInputAuthorityExpectation,
  revalidatePlanningInputAuthorityBinding,
  resolvePlanningInputAuthorityBinding,
} from './planning-input-authority-binding-service'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import {
  canonicalPlanningHandoffId,
  persistPrivateCanonicalPlanningHandoff,
  persistLatestPrivateCanonicalPlanningHandoff,
  readLatestPrivateCanonicalPlanningHandoff,
  readPrivateCanonicalPlanningHandoff,
  type CanonicalPlanningHandoffStoreScope,
} from './private-canonical-planning-handoff-store'
import { createSourceMediaAuthorityService } from './source-media-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  readPlanningExactEditPreferenceAuthority,
  recordPlanningExactEditPreferenceEvidence,
} from './planning-exact-edit-preference-authority-port'
import {
  CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  resolveCanonicalExactEditPreferenceInstruction,
} from './canonical-exact-edit-preference-instruction'
import {
  prepareCanonicalEditBriefForPlanning,
} from './canonical-edit-brief-planning-preparation-service'
import {
  revalidateCanonicalLivingFramePlanningBinding,
} from './canonical-living-frame-planning-binding-service'

const publicationLocks = new Map<string, Promise<void>>()
const preparationLocks = new Map<string, Promise<void>>()

export function createCanonicalPlanningHandoffService(context: ServiceContext) {
  return {
    async prepare(input: CreateCanonicalPlanningHandoffBody & {
      projectId: string
      editSessionId: string
    }) {
      const { projectId, editSessionId, ...requestBody } = input
      const parsed = createCanonicalPlanningHandoffSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(projectId) || !safeIdentity(editSessionId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical planning handoff request validation failed.',
          400,
          parsed.success
            ? { routeIdentity: ['Invalid project or edit-session identity.'] }
            : parsed.error.flatten(),
        )
      }
      assertPrivatePlanningHandoffRuntime(context)
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical planning handoff is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(projectId, access.workspaceId)
      if (!canonicalStorytellingStyleAuthorityMatchesScope(
        body.canonicalPlanComponents.motionStudioStorytellingStyleAuthority,
        {
          workspaceId: access.workspaceId,
          projectId,
          editSessionId,
        },
      )) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Storytelling style authority does not match the exact planning handoff scope.',
          409,
        )
      }
      const storytellingProductionAuthority =
        await revalidateCanonicalMotionStudioStorytellingProductionAuthority({
          context,
          authority:
            body.canonicalPlanComponents.motionStudioStorytellingProductionAuthority,
          expectedScope: {
            workspaceId: access.workspaceId,
            projectId,
            editSessionId,
          },
        })
      await revalidateCanonicalLivingFramePlanningBinding({
        components: body.canonicalPlanComponents,
      })
      const expectedSequence = body.orderedSourceItems.map((item) => ({
        sourceSequenceItemId: item.sourceSequenceItemId,
        mediaAssetId: item.mediaAssetId,
        uploadedOrder: item.uploadedOrder,
        checksumSha256: item.checksumSha256,
        required: item.required,
      }))
      if (stableAuthorityStringify(body.canonicalPlanComponents.sourceSequence) !==
        stableAuthorityStringify(expectedSequence)) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical plan source sequence does not match the finalized upload handoff order.',
          409,
        )
      }

      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      return withPreparationLock(scope, async () => {
        const lockedStorytellingProductionAuthority =
          await revalidateCanonicalMotionStudioStorytellingProductionAuthority({
            context,
            authority: storytellingProductionAuthority,
            expectedScope: {
              workspaceId: access.workspaceId,
              projectId,
              editSessionId,
            },
          })
        await revalidateCanonicalLivingFramePlanningBinding({
          components: body.canonicalPlanComponents,
        })
        const sourceCandidate = lockedStorytellingProductionAuthority
          ? buildCanonicalIdeaFirstSourceBindingManifestCandidate(
              lockedStorytellingProductionAuthority,
            )
          : (await createSourceMediaAuthorityService(context).buildManifestCandidate({
              workspaceId: access.workspaceId,
              projectId,
              uploadPurpose: 'source_media',
              orderedItems: body.orderedSourceItems,
            })).sourceBindingManifestCandidate
        const sourceMediaAuthority = sourceExpectationFromCandidate(sourceCandidate)
        await recordVerifiedPlanningEvidence({
          context,
          scope,
          sourceCandidateHash: sourceCandidate.candidateHash,
          components: body.canonicalPlanComponents,
        })
        await prepareCanonicalEditBriefForPlanning({
          context,
          scope,
          sourceCandidate,
          components: body.canonicalPlanComponents,
        })
        const planningInputAuthority =
          await buildCurrentPlanningInputAuthorityExpectation({ context, scope })
        const resolvedPlanningInputAuthority = await resolvePlanningInputAuthorityBinding({
          context,
          scope,
          expectation: planningInputAuthority,
          components: body.canonicalPlanComponents,
        })
        const canonicalPlanComponentsHash = sha256AuthorityValue(body.canonicalPlanComponents)
        const responseWithoutHash = {
          schemaVersion: 'canonical-planning-handoff-response-v1' as const,
          source: 'canonical_planning_handoff_service' as const,
          identity: {
            workspaceId: access.workspaceId,
            projectId,
            editSessionId,
          },
          canonicalPlanComponentsHash,
          sourceBindingManifestCandidate: sourceCandidate,
          sourceMediaAuthority,
          planningInputAuthority,
          resolvedPlanningInputAuthority,
          readiness: lockedStorytellingProductionAuthority
            ? {
                sourceAuthorityMode: 'idea_first_no_uploaded_media' as const,
                finalizedSourceMediaVerified: false as const,
                ideaFirstStorytellingAuthorityVerified: true as const,
                noUploadedMediaExpected: true as const,
                fabricatedUploadRecordCount: 0 as const,
                exactEditPreferencesVerified: true as const,
                preferenceApplicationVerified: true as const,
                editBriefVerified: true as const,
                outputFrameAndCleanupVerified: true as const,
                readyForCanonicalPlanPublication: true as const,
              }
            : {
                sourceAuthorityMode: 'finalized_uploaded_media' as const,
                finalizedSourceMediaVerified: true as const,
                ideaFirstStorytellingAuthorityVerified: false as const,
                exactEditPreferencesVerified: true as const,
                preferenceApplicationVerified: true as const,
                editBriefVerified: true as const,
                outputFrameAndCleanupVerified: true as const,
                readyForCanonicalPlanPublication: true as const,
              },
          noPlanPublished: true as const,
          noSnapshotCreated: true as const,
          noCreditReservation: true as const,
          noToolExecution: true as const,
          noProviderCall: true as const,
          noRender: true as const,
          testOnly: true as const,
        }
        const handoffHash = sha256AuthorityValue(responseWithoutHash)
        const handoff = canonicalPlanningHandoffResponseSchema.parse({
          ...responseWithoutHash,
          handoffHash,
          handoffId: canonicalPlanningHandoffId(handoffHash),
          persistence: {
            privateLocal: true,
            tenantScoped: true,
            createOnly: true,
            checksumProtected: true,
            contentAddressed: true,
            distributed: false,
            productionAuthority: false,
          },
        })
        const persisted = await persistPrivateCanonicalPlanningHandoff({ scope, handoff })
        await persistLatestPrivateCanonicalPlanningHandoff({ scope, handoff: persisted.handoff })
        return persisted.handoff
      })
    },

    async inspectLatest(input: CanonicalPlanningHandoffInspectionQuery & {
      projectId: string
      editSessionId: string
    }) {
      if (
        !safeIdentity(input.workspaceId) ||
        !safeIdentity(input.projectId) ||
        !safeIdentity(input.editSessionId)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Latest canonical planning handoff inspection identity is invalid.',
          400,
        )
      }
      assertPrivatePlanningHandoffRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical planning handoff is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const handoff = await readLatestPrivateCanonicalPlanningHandoff({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      })
      if (!handoff) {
        throw new ApiError(
          'PLAN_NOT_APPROVED',
          'No persisted canonical planning handoff was found for this edit session.',
          404,
        )
      }
      return createCanonicalPlanningHandoffService(context).inspect({
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        handoffId: handoff.handoffId,
      })
    },

    async inspect(input: CanonicalPlanningHandoffInspectionQuery & {
      projectId: string
      editSessionId: string
      handoffId: string
    }) {
      if (
        !safeIdentity(input.workspaceId) ||
        !safeIdentity(input.projectId) ||
        !safeIdentity(input.editSessionId) ||
        !safeIdentity(input.handoffId)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical planning handoff inspection identity is invalid.',
          400,
        )
      }
      assertPrivatePlanningHandoffRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical planning handoff is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      }
      const handoff = await readPrivateCanonicalPlanningHandoff({
        scope,
        handoffId: input.handoffId,
      })
      const existingPublication = await createEditPlanningAuthorityService(context)
        .findCanonicalPlanPublicationByPlanningHandoff(handoff.handoffId, access.workspaceId)
      const responseBase = {
        schemaVersion: 'canonical-planning-handoff-inspection-v1' as const,
        source: 'canonical_planning_handoff_service' as const,
        identity: {
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          handoffId: handoff.handoffId,
        },
        handoffHash: handoff.handoffHash,
        canonicalPlanComponentsHash: handoff.canonicalPlanComponentsHash,
        persistence: handoff.persistence,
        permissions: {
          inspectionOnly: true as const,
          planMutation: false as const,
          snapshotCreation: false as const,
          creditReservation: false as const,
          toolExecution: false as const,
          providerCall: false as const,
          render: false as const,
        },
        pathOrCredentialReturned: false as const,
        testOnly: true as const,
      }
      if (!existingPublication) {
        return canonicalPlanningHandoffInspectionResponseSchema.parse({
          ...responseBase,
          publicationStatus: 'unpublished',
          publication: {
            newPublicationMayBeAttempted: true,
            fullRevalidationRequired: true,
            exactReplayOnly: false,
          },
        })
      }
      if (
        existingPublication.projectId !== input.projectId ||
        existingPublication.editSessionId !== input.editSessionId ||
        existingPublication.binding.handoffHash !== handoff.handoffHash ||
        existingPublication.binding.canonicalPlanComponentsHash !==
          handoff.canonicalPlanComponentsHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical planning handoff publication recovery lineage is inconsistent.',
          409,
        )
      }
      return canonicalPlanningHandoffInspectionResponseSchema.parse({
        ...responseBase,
        publicationStatus: 'published',
        publication: {
          planId: existingPublication.planId,
          planningRequestId: existingPublication.planningRequestId,
          planVersion: existingPublication.planVersion,
          planStatus: existingPublication.planStatus,
          planHash: existingPublication.planHash,
          publicationRequestHash: existingPublication.binding.publicationRequestHash,
          newPublicationMayBeAttempted: false,
          fullRevalidationRequired: true,
          exactReplayOnly: true,
        },
      })
    },

    async publishFromPersistedHandoff(input: PublishCanonicalEditPlanFromHandoffBody & {
      projectId: string
      editSessionId: string
      handoffId: string
      idempotencyKey: string
      requestPath?: string
      livingFrameSelectedScenePublication?: unknown
    }) {
      const {
        projectId,
        editSessionId,
        handoffId,
        idempotencyKey,
        requestPath,
        livingFrameSelectedScenePublication,
        ...requestBody
      } = input
      const parsed = publishCanonicalEditPlanFromHandoffSchema.safeParse(requestBody)
      if (
        !parsed.success ||
        !safeIdentity(projectId) ||
        !safeIdentity(editSessionId) ||
        !safeIdentity(handoffId)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical planning handoff publication request validation failed.',
          400,
          parsed.success
            ? { routeIdentity: ['Invalid project, edit-session, or handoff identity.'] }
            : parsed.error.flatten(),
        )
      }
      assertPrivatePlanningHandoffRuntime(context)
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical planning handoff is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(projectId, access.workspaceId)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      const normalizedIdempotencyKey = requirePublicationIdempotencyKey(idempotencyKey)
      return withPublicationLock(scope, handoffId, async () => {
        const handoff = await readPrivateCanonicalPlanningHandoff({ scope, handoffId })
        if (handoff.handoffHash !== body.expectedHandoffHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical planning handoff hash does not match the persisted authority.',
            409,
          )
        }
        const canonicalPlanComponentsHash = sha256AuthorityValue(body.canonicalPlan.components)
        if (handoff.canonicalPlanComponentsHash !== canonicalPlanComponentsHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical plan components changed after the authenticated planning handoff.',
            409,
          )
        }
        const canonicalPublishBody = {
          workspaceId: access.workspaceId,
          planningRequestId: body.planningRequestId,
          planningInputAuthority: handoff.planningInputAuthority,
          sourceMediaAuthority: handoff.sourceMediaAuthority,
          revisionAuthority: body.revisionAuthority,
          canonicalPlan: body.canonicalPlan,
        }
        const publicationRequestHash = canonicalPlanningHandoffPublicationRequestHash({
          workspaceId: access.workspaceId,
          projectId,
          editSessionId,
          handoffId: handoff.handoffId,
          handoffHash: handoff.handoffHash,
          body: canonicalPublishBody,
          professionalLongFormSeedDraft:
            body.professionalLongFormSeedDraft,
        })
        const idempotencyKeyHash = canonicalPlanningHandoffIdempotencyKeyHash(
          normalizedIdempotencyKey,
        )
        const planningService = createEditPlanningAuthorityService(context)
        const existingPublication = await planningService
          .findCanonicalPlanPublicationByPlanningHandoff(handoff.handoffId, access.workspaceId)
        if (existingPublication && (
          existingPublication.projectId !== projectId ||
          existingPublication.editSessionId !== editSessionId ||
          existingPublication.planningRequestId !== body.planningRequestId ||
          existingPublication.binding.publicationRequestHash !== publicationRequestHash ||
          existingPublication.binding.idempotencyKeyHash !== idempotencyKeyHash
        )) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical planning handoff is already bound to a different plan publication.',
            409,
            { requiredGate: 'one_handoff_one_canonical_plan_publication' },
          )
        }
        await revalidatePlanningInputAuthorityBinding({
          context,
          scope,
          persistedBinding: handoff.resolvedPlanningInputAuthority,
          components: body.canonicalPlan.components,
        })
        await revalidateCanonicalLivingFramePlanningBinding({
          components: body.canonicalPlan.components,
        })

        const result = await planningService.publishCanonicalPlan({
          ...canonicalPublishBody,
          projectId,
          editSessionId,
          idempotencyKey: normalizedIdempotencyKey,
          requestPath,
          livingFrameSelectedScenePublication,
          professionalLongFormSeedDraft:
            body.professionalLongFormSeedDraft,
          planningHandoffBinding: {
            schemaVersion: 'canonical-planning-handoff-publication-binding-v1',
            handoffId: handoff.handoffId,
            handoffHash: handoff.handoffHash,
            canonicalPlanComponentsHash: handoff.canonicalPlanComponentsHash,
            sourceCandidateHash: handoff.sourceBindingManifestCandidate.candidateHash,
            planningInputBindingHash: handoff.resolvedPlanningInputAuthority.bindingHash,
            publicationRequestHash,
            idempotencyKeyHash,
            singlePublication: true,
            privateLocalCreateOnlyAuthority: true,
            revalidatedBeforePublication: true,
            distributedAuthority: false,
            productionAuthority: false,
          },
        })
        return {
          ...result,
          canonicalPlanningHandoff: {
            handoffId: handoff.handoffId,
            handoffHash: handoff.handoffHash,
            canonicalPlanComponentsHash: handoff.canonicalPlanComponentsHash,
            publicationRequestHash,
            boundToPublishedPlan: true as const,
            revalidatedBeforePublication: true as const,
            singlePublication: true as const,
            publicationReplayed: Boolean(existingPublication),
          },
          warnings: [
            ...result.warnings,
            'Publication loaded the tenant-scoped persisted handoff server-side and revalidated its exact planning inputs before freezing the binding into canonical authority.',
            'The persisted handoff is bound to one full canonical publication request and one idempotency key; exact replay is allowed but substitution is rejected.',
          ],
        }
      })
    },
  }
}

async function recordVerifiedPlanningEvidence(input: {
  context: ServiceContext
  scope: CanonicalPlanningHandoffStoreScope
  sourceCandidateHash: string
  components: CreateCanonicalPlanningHandoffBody['canonicalPlanComponents']
}): Promise<void> {
  const current = await readPlanningExactEditPreferenceAuthority({
    context: input.context,
    scope: input.scope,
  })
  const authority = current.authority
  resolveCanonicalExactEditPreferenceInstruction({
    authority,
    components: input.components,
  })

  if (
    input.components.confirmedSettings.preferenceSnapshotId
      !== authority.baseline.preferenceSnapshotId ||
    input.components.confirmedSettings.preferenceRevision
      !== authority.preferenceRevision ||
    input.components.confirmedSettings.preferencePlanningInputRevision
      !== authority.planningInputRevision ||
    input.components.confirmedSettings.preferenceFingerprintSha256
      !== authority.preferenceFingerprintSha256
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical confirmed settings do not match the exact server-owned edit preference authority.',
      409,
    )
  }

  const sourcePreparationEvidenceHash = sha256AuthorityValue({
    sourceCandidateHash: input.sourceCandidateHash,
    sourceCleanupSummary: input.components.sourceCleanupSummary,
    sourceCleanupPlan: input.components.sourceCleanupPlan,
  })
  const confirmedAspectRatio = confirmedOutputAspectRatioSchema.parse(
    input.components.confirmedSettings.aspectRatio,
  )
  const recorded = await recordPlanningExactEditPreferenceEvidence({
    context: input.context,
    scope: input.scope,
    request: {
      schemaVersion: CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION,
      actorUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      expectedPreferenceRevision: authority.preferenceRevision,
      expectedPlanningInputRevision: authority.planningInputRevision,
      expectedPreferenceFingerprintSha256: authority.preferenceFingerprintSha256,
      expectedBaselinePreferenceSnapshotId: authority.baseline.preferenceSnapshotId,
      sourceCandidateHashSha256: input.sourceCandidateHash,
      sourcePreparationEvidenceHashSha256: sourcePreparationEvidenceHash,
      confirmedAspectRatio,
    },
  })
  if (
    recorded.authority.sourcePreparation.status !== 'ready'
    || recorded.authority.sourcePreparation.evidenceHashSha256
      !== sourcePreparationEvidenceHash
    || recorded.authority.frameConfirmation.status !== 'confirmed'
    || recorded.authority.frameConfirmation.aspectRatio !== confirmedAspectRatio
  ) throw new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'Canonical source-preparation evidence was not committed for this plan.',
    503,
  )
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function sourceExpectationFromCandidate(
  candidate: SourceBindingManifestCandidate,
): SourceMediaAuthorityExpectation {
  if (candidate.schemaVersion === 'private-idea-first-source-authority-candidate-v1') {
    return {
      authorityKind: 'idea_first_storytelling_v1',
      authorityRevision: candidate.authorityRevision,
      authorityChecksumSha256: candidate.authorityChecksumSha256,
      sourceSequenceHash: candidate.sourceSequenceHash,
      candidateHash: candidate.candidateHash,
      productionAuthorityHash: candidate.productionAuthorityHash,
      sourceProposalDigest: candidate.sourceProposalDigest,
      sourceArtifactApprovalSnapshotId: candidate.sourceArtifactApprovalSnapshotId,
    }
  }
  return {
    authorityRevision: candidate.authorityRevision,
    authorityChecksumSha256: candidate.authorityChecksumSha256,
    sourceSequenceHash: candidate.sourceSequenceHash,
    candidateHash: candidate.candidateHash,
  }
}

function assertPrivatePlanningHandoffRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Canonical planning handoff is private-internal testing only.', 503)
}

function requirePublicationIdempotencyKey(value: string): string {
  const normalized = value.trim()
  if (
    normalized.length === 0 ||
    normalized.length > 200 ||
    [...normalized].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical publication Idempotency-Key is invalid.', 400)
  }
  return normalized
}

async function withPublicationLock<T>(
  scope: CanonicalPlanningHandoffStoreScope,
  handoffId: string,
  action: () => Promise<T>,
): Promise<T> {
  const key = sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    handoffId,
  })
  const previous = publicationLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  publicationLocks.set(key, current)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (publicationLocks.get(key) === current) publicationLocks.delete(key)
  }
}

async function withPreparationLock<T>(
  scope: CanonicalPlanningHandoffStoreScope,
  action: () => Promise<T>,
): Promise<T> {
  const key = sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  const previous = preparationLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  preparationLocks.set(key, current)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (preparationLocks.get(key) === current) preparationLocks.delete(key)
  }
}
