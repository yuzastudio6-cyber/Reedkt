import { z } from 'zod'

import type {
  MotionStudioStorytellingWorkflowBinding,
  MotionStudioStorytellingWorkspaceLocation,
  MotionStudioStorytellingWorkspaceRouteIdentity,
} from '../../../types/motion-studio/storytelling-workflow'
import {
  MOTION_STUDIO_MODULE_CATALOG_VERSION,
  MOTION_STUDIO_STORYTELLING_STAGE_PROFILE_ID,
} from './constants'
import {
  MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE,
  MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE,
  MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
  MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND,
  MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION,
} from '../../../types/motion-studio/storytelling-workflow'

export const motionStudioStorytellingStableIdSchema = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

export const motionStudioStorytellingWorkflowBindingSchema:
z.ZodType<MotionStudioStorytellingWorkflowBinding> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_BINDING_VERSION),
  workflowId: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_ID),
  productionId: motionStudioStorytellingStableIdSchema,
  projectId: motionStudioStorytellingStableIdSchema,
  editSessionId: motionStudioStorytellingStableIdSchema,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  bindingRecordVersion: positiveSafeInteger,
  bindingDigest: sha256,
  sourceAuthority: z.literal('canonical_motion_studio_production'),
  sourceReverified: z.literal(true),
  editingCategoryDeterminesWorkflow: z.literal(false),
}).strict()

export const motionStudioStorytellingWorkspaceLocationSchema:
z.ZodType<MotionStudioStorytellingWorkspaceLocation> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_WORKSPACE_LOCATION_VERSION),
  workspaceKind: z.literal(MOTION_STUDIO_STORYTELLING_WORKSPACE_KIND),
  chatExperience: z.literal(MOTION_STUDIO_STORYTELLING_CHAT_EXPERIENCE),
  workflowId: z.literal(MOTION_STUDIO_STORYTELLING_WORKFLOW_ID),
  productionId: motionStudioStorytellingStableIdSchema,
  projectId: motionStudioStorytellingStableIdSchema,
  editSessionId: motionStudioStorytellingStableIdSchema,
  libraryRoute: z.literal(MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE),
  workspaceRoute: z.string().min(1).max(768),
  parentProjectRoute: z.string().min(1).max(512),
  defaultSurface: z.literal('director_chat'),
  normalEditRouteReused: z.literal(false),
  queryParameterCanPromoteWorkflow: z.literal(false),
  workflowBinding: motionStudioStorytellingWorkflowBindingSchema,
}).strict().superRefine((value, context) => {
  const binding = value.workflowBinding
  if (
    value.productionId !== binding.productionId ||
    value.projectId !== binding.projectId ||
    value.editSessionId !== binding.editSessionId ||
    value.workflowId !== binding.workflowId
  ) {
    context.addIssue({
      code: 'custom',
      path: ['workflowBinding'],
      message: 'Storytelling workspace and workflow binding must identify one exact production tuple.',
    })
  }
  if (value.workspaceRoute !== motionStudioStorytellingWorkspaceRoute(value.projectId, value.editSessionId)) {
    context.addIssue({
      code: 'custom',
      path: ['workspaceRoute'],
      message: 'Storytelling must use the dedicated Motion Studio workspace route.',
    })
  }
  if (value.parentProjectRoute !== reeditproParentProjectRoute(value.projectId)) {
    context.addIssue({
      code: 'custom',
      path: ['parentProjectRoute'],
      message: 'Parent Project route must be derived from the exact Project identity.',
    })
  }
})

export function motionStudioStorytellingWorkspaceRoute(
  projectId: string,
  editSessionId: string,
): string {
  const project = motionStudioStorytellingStableIdSchema.parse(projectId)
  const edit = motionStudioStorytellingStableIdSchema.parse(editSessionId)
  return `/motion-studio/storytelling/projects/${encodeURIComponent(project)}/edits/${encodeURIComponent(edit)}`
}

export function reeditproParentProjectRoute(projectId: string): string {
  const project = motionStudioStorytellingStableIdSchema.parse(projectId)
  return `/projects/${encodeURIComponent(project)}`
}

export function ordinaryNamedEditRoute(projectId: string, editSessionId: string): string {
  const project = motionStudioStorytellingStableIdSchema.parse(projectId)
  const edit = motionStudioStorytellingStableIdSchema.parse(editSessionId)
  return `/projects/${encodeURIComponent(project)}/edits/${encodeURIComponent(edit)}`
}

const LEGACY_MOTION_STUDIO_STORYTELLING_EDIT_PREFIX = 'storytelling-edit-'

/**
 * Resolves only the explicit product-workflow discriminator. Editing category,
 * route state, and historical edit-id prefixes are intentionally not accepted
 * as runtime workflow authority.
 */
export function isMotionStudioStorytellingHandoff(input: {
  editSessionId: string
  productWorkflow?: unknown
}): boolean {
  return input.productWorkflow === MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
}

/**
 * Identifies only a retained pre-discriminator Motion record at the explicit
 * migration boundary. This predicate never authorizes a route or workspace;
 * migration must still re-read the exact canonical production tuple, persist
 * the discriminator, and re-read the migrated handoff.
 */
export function isRetainedLegacyMotionStudioStorytellingMigrationCandidate(input: {
  editorPath: unknown
  editSessionId: string
  productWorkflow?: unknown
  projectId: string
}): boolean {
  return input.productWorkflow === undefined &&
    input.editSessionId.startsWith(LEGACY_MOTION_STUDIO_STORYTELLING_EDIT_PREFIX) &&
    input.editorPath === motionStudioStorytellingWorkspaceRoute(input.projectId, input.editSessionId)
}

export function isExactMotionStudioStorytellingProductionTuple(
  handoff: { projectId: string; editSessionId: string },
  production: {
    projectId: string
    editSessionId: string
    moduleId: unknown
    moduleCatalogVersion: unknown
    stageProfileId: unknown
  },
): boolean {
  return production.projectId === handoff.projectId &&
    production.editSessionId === handoff.editSessionId &&
    production.moduleId === 'storytelling' &&
    production.moduleCatalogVersion === MOTION_STUDIO_MODULE_CATALOG_VERSION &&
    production.stageProfileId === MOTION_STUDIO_STORYTELLING_STAGE_PROFILE_ID
}

/**
 * Accepts a Storytelling association only when both independent authorities
 * agree: the parsed Project/Named Edit workflow discriminator and the exact
 * re-read Motion Studio production tuple. Category and route/query state are
 * intentionally absent from this decision.
 */
export function isVerifiedMotionStudioStorytellingProductionAssociation(
  handoff: {
    projectId: string
    editSessionId: string
    productWorkflow?: unknown
  },
  production: {
    projectId: string
    editSessionId: string
    moduleId: unknown
    moduleCatalogVersion: unknown
    stageProfileId: unknown
  },
): boolean {
  return isMotionStudioStorytellingHandoff(handoff) &&
    isExactMotionStudioStorytellingProductionTuple(handoff, production)
}

/**
 * Parses only the canonical dedicated pathname. Queries, fragments, legacy
 * nested edit paths, and the ordinary Edit Chat route never promote a record
 * into Motion Studio.
 */
export function parseMotionStudioStorytellingWorkspaceRoute(
  pathname: string,
): MotionStudioStorytellingWorkspaceRouteIdentity | undefined {
  if (pathname.includes('?') || pathname.includes('#')) return undefined
  const match = /^\/motion-studio\/storytelling\/projects\/([^/]+)\/edits\/([^/]+)$/u.exec(pathname)
  if (!match) return undefined
  try {
    const projectId = decodeURIComponent(match[1])
    const editSessionId = decodeURIComponent(match[2])
    motionStudioStorytellingStableIdSchema.parse(projectId)
    motionStudioStorytellingStableIdSchema.parse(editSessionId)
    if (motionStudioStorytellingWorkspaceRoute(projectId, editSessionId) !== pathname) return undefined
    return { projectId, editSessionId }
  } catch {
    return undefined
  }
}
