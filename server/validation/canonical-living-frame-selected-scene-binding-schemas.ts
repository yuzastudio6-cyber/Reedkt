import { z } from 'zod'

import {
  LIVING_FRAME_REASON_CODES,
} from '../../src/types/living-frame'
import {
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_DECISIONS,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  livingFrameProfessionalSkillComponentSchema,
} from '../../src/lib/living-frame/living-frame-contract'

const identitySchema = z.string()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const canonicalLivingFrameSelectedSceneSelectorDecisionSchema =
  z.object({
    decision: z.enum(CANONICAL_LIVING_FRAME_SELECTED_SCENE_DECISIONS),
    selectedScenes: z.array(z.object({
      sceneId: identitySchema,
      treatment:
        z.enum(CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS),
    }).strict()).max(128),
    reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  }).strict().superRefine((decision, context) => {
    const sceneIds = new Set(decision.selectedScenes.map(
      (scene) => scene.sceneId,
    ))
    if (sceneIds.size !== decision.selectedScenes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedScenes'],
        message: 'Canonical Living Frame selected scene IDs must be unique.',
      })
    }
    if (
      (decision.decision === 'selected_scenes'
        && decision.selectedScenes.length === 0)
      || (decision.decision === 'deliberate_non_use'
        && decision.selectedScenes.length !== 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['decision'],
        message:
          'Canonical Living Frame selection and selected-scene count disagree.',
      })
    }
  })

const canonicalLivingFrameSelectedSceneAuthorityBoundarySchema =
  z.object({
    serverDerivedPlanningComponent: z.literal(true),
    selectedSceneAuthority: z.literal(true),
    professionalSkillComponentProjectionAuthority: z.literal(true),
    browserSelectionAuthority: z.literal(false),
    rawChatAuthority: z.literal(false),
    masterTimingMutationAuthority: z.literal(false),
    exactFrameAuthority: z.literal(false),
    soundSyncAuthority: z.literal(false),
    estimateAuthority: z.literal(false),
    customerCommercialAuthority: z.literal(false),
    approvalAuthority: z.literal(false),
    snapshotCreationAuthority: z.literal(false),
    workGraphAuthority: z.literal(false),
    queueAuthority: z.literal(false),
    assetManifestAuthority: z.literal(false),
    providerAuthority: z.literal(false),
    toolRouteAuthority: z.literal(false),
    artifactQaAuthority: z.literal(false),
    rendererAuthority: z.literal(false),
    remotionExecutionAuthority: z.literal(false),
    privateReviewAuthority: z.literal(false),
    runtimeAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict()

export const canonicalLivingFrameSelectedSceneBindingSchema =
  z.object({
    schemaVersion:
      z.literal(CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION),
    source:
      z.literal(CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE),
    evidenceClass:
      z.literal(
        'private_internal_server_derived_selected_scene_binding',
      ),
    identity: z.object({
      workspaceId: identitySchema,
      projectId: identitySchema,
      editSessionId: identitySchema,
      handoffId: identitySchema,
      handoffHash: sha256Schema,
      canonicalPlanComponentsHash: sha256Schema,
    }).strict(),
    sourceBindings: z.object({
      deferredLivingFrameComponentDigestSha256: sha256Schema,
      semanticPlanProjectionDigestSha256: sha256Schema,
      selectedSceneAdmissionDigestSha256: sha256Schema,
      semanticProposalBindingDigestSha256: sha256Schema,
      semanticRequestDigestSha256: sha256Schema,
      semanticResultDigestSha256: sha256Schema,
      visualContinuityPackDigestSha256: sha256Schema.nullable(),
      confirmedOutputFrameDigestSha256: sha256Schema,
      currentMasterTimingDigestSha256: sha256Schema,
      selectorDecisionDigestSha256: sha256Schema,
    }).strict(),
    decision: canonicalLivingFrameSelectedSceneSelectorDecisionSchema,
    rejectedCandidateSceneIds: z.array(identitySchema).max(128),
    selectedComponent: livingFrameProfessionalSkillComponentSchema,
    selectedSceneCount: z.number().int().nonnegative().max(128),
    selectedComponentCount: z.number().int().nonnegative().max(4_096),
    deliberateNonUse: z.boolean(),
    authorityBoundary:
      canonicalLivingFrameSelectedSceneAuthorityBoundarySchema,
    deferredParentPreserved: z.literal(true),
    existingCanonicalPlanRemainsAuthority: z.literal(true),
    existingMasterTimingRemainsAuthority: z.literal(true),
    existingSoundSyncRemainsAuthority: z.literal(true),
    existingEstimateApprovalSnapshotPipelineRemainsAuthority:
      z.literal(true),
    existingWorkAssetQaReviewPipelineRemainsAuthority:
      z.literal(true),
    containsRawChatTranscriptMediaBytesPathsOrUrls:
      z.literal(false),
    containsProviderToolWorkQueueCostOrCommercialRoute:
      z.literal(false),
    containsExecutableCodeOrCommands: z.literal(false),
    subjectSpecificRouting: z.literal(false),
    productionReady: z.literal(false),
    bindingDigestSha256: sha256Schema,
  }).strict().superRefine((binding, context) => {
    const selectedSceneIds = new Set(
      binding.decision.selectedScenes.map((scene) => scene.sceneId),
    )
    if (
      binding.selectedSceneCount
        !== binding.selectedComponent.scenePlans.length
      || binding.selectedComponentCount
        !== binding.selectedComponent.scenePlans.reduce(
          (count, scene) => count + scene.components.length,
          0,
        )
      || binding.deliberateNonUse
        !== (binding.decision.decision === 'deliberate_non_use')
      || binding.selectedComponent.scenePlans.some(
        (scene) => !selectedSceneIds.has(scene.sceneId),
      )
      || binding.rejectedCandidateSceneIds.some(
        (sceneId) => selectedSceneIds.has(sceneId),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Canonical Living Frame selected-scene counts or decisions are inconsistent.',
      })
    }
  })

export type CanonicalLivingFrameSelectedSceneBindingSchemaInput =
  z.infer<typeof canonicalLivingFrameSelectedSceneBindingSchema>
