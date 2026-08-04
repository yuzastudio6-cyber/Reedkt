import { z } from 'zod'

import {
  motionStudioStorytellingStableIdSchema,
  motionStudioStorytellingWorkspaceLocationSchema,
  motionStudioStorytellingWorkspaceRoute,
  reeditproParentProjectRoute,
} from '../../../src/lib/motion-studio/contracts/storytelling-workflow'
import type {
  MotionStudioStorytellingWorkspaceLocation,
} from '../../../src/types/motion-studio/storytelling-workflow'
import {
  MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE,
  MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE,
  MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
  MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND,
  MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION,
} from '../../../src/types/motion-studio/storytelling-workflow'
import { sha256CanonicalJson } from '../commands/canonical-json'

const safeEditingCategory = z.string().trim().min(1).max(120)
  .regex(/^[a-z0-9_]+$/u)
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

const sourceInputSchema = z.object({
  authorization: z.object({
    authorizedWorkspaceId: motionStudioStorytellingStableIdSchema,
    currentMembershipVerified: z.literal(true),
    projectAccessVerified: z.literal(true),
    authorizationCheckedBeforeDetail: z.literal(true),
  }).strict(),
  project: z.object({
    id: motionStudioStorytellingStableIdSchema,
    workspaceId: motionStudioStorytellingStableIdSchema,
  }).strict(),
  edit: z.object({
    id: motionStudioStorytellingStableIdSchema,
    workspaceId: motionStudioStorytellingStableIdSchema,
    projectId: motionStudioStorytellingStableIdSchema,
    category: safeEditingCategory,
  }).strict(),
  production: z.object({
    id: motionStudioStorytellingStableIdSchema,
    workspaceId: motionStudioStorytellingStableIdSchema,
    projectId: motionStudioStorytellingStableIdSchema,
    editSessionId: motionStudioStorytellingStableIdSchema,
    moduleId: z.literal('storytelling'),
    moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
    stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
    recordVersion: positiveSafeInteger,
  }).strict(),
  workflowAssociation: z.object({
    workflowId: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_ID),
    sourceAuthority: z.literal('canonical_motion_studio_production'),
    sourceReverified: z.literal(true),
    productionAssociationVerified: z.literal(true),
  }).strict(),
}).strict().superRefine((value, context) => {
  const workspaceId = value.authorization.authorizedWorkspaceId
  if (
    value.project.workspaceId !== workspaceId ||
    value.edit.workspaceId !== workspaceId ||
    value.production.workspaceId !== workspaceId
  ) {
    context.addIssue({
      code: 'custom',
      path: ['authorization'],
      message: 'Storytelling workflow authority is outside the freshly authorized workspace.',
    })
  }
  if (value.edit.projectId !== value.project.id) {
    context.addIssue({
      code: 'custom',
      path: ['edit', 'projectId'],
      message: 'Named Edit does not belong to the exact Project.',
    })
  }
  if (
    value.production.projectId !== value.project.id ||
    value.production.editSessionId !== value.edit.id
  ) {
    context.addIssue({
      code: 'custom',
      path: ['production'],
      message: 'Motion Studio production does not belong to the exact Project and Named Edit.',
    })
  }
})

export type ProjectMotionStudioStorytellingWorkspaceLocationInput =
  z.input<typeof sourceInputSchema>

/**
 * Produces the browser-safe route receipt only after an explicit canonical
 * MotionStudioProduction association is re-read. `edit.category` is parsed as
 * ordinary edit metadata but is deliberately excluded from the workflow
 * binding and cannot select Motion Studio.
 */
export function projectMotionStudioStorytellingWorkspaceLocation(
  input: ProjectMotionStudioStorytellingWorkspaceLocationInput,
): MotionStudioStorytellingWorkspaceLocation {
  const source = sourceInputSchema.parse(input)
  const bindingSource = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION,
    workflowId: source.workflowAssociation.workflowId,
    productionId: source.production.id,
    projectId: source.project.id,
    editSessionId: source.edit.id,
    moduleId: source.production.moduleId,
    moduleCatalogVersion: source.production.moduleCatalogVersion,
    stageProfileId: source.production.stageProfileId,
    bindingRecordVersion: source.production.recordVersion,
    sourceAuthority: source.workflowAssociation.sourceAuthority,
    sourceReverified: source.workflowAssociation.sourceReverified,
    editingCategoryDeterminesWorkflow: false as const,
  }
  const workflowBinding = {
    ...bindingSource,
    bindingDigest: sha256CanonicalJson(bindingSource),
  }
  return motionStudioStorytellingWorkspaceLocationSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION,
    workspaceKind: MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND,
    chatExperience: MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE,
    workflowId: source.workflowAssociation.workflowId,
    productionId: source.production.id,
    projectId: source.project.id,
    editSessionId: source.edit.id,
    libraryRoute: MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE,
    workspaceRoute: motionStudioStorytellingWorkspaceRoute(source.project.id, source.edit.id),
    parentProjectRoute: reeditproParentProjectRoute(source.project.id),
    defaultSurface: 'director_chat',
    normalEditRouteReused: false,
    queryParameterCanPromoteWorkflow: false,
    workflowBinding,
  })
}
