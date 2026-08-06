import assert from 'node:assert/strict'

import {
  isMotionStudioStorytellingHandoff,
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  isVerifiedMotionStudioStorytellingProductionAssociation,
  motionStudioStorytellingWorkspaceLocationSchema,
  ordinaryNamedEditRoute,
  parseMotionStudioStorytellingWorkspaceRoute,
} from '../../src/lib/motion-studio/contracts/storytelling-workflow'
import {
  MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE,
  MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
  MOTION_STUDIO_STORYTELLING_WORKSPACE_ROUTE_TEMPLATE,
} from '../../src/types/motion-studio/storytelling-workflow'
import {
  projectMotionStudioStorytellingWorkspaceLocation,
  type ProjectMotionStudioStorytellingWorkspaceLocationInput,
} from '../motion-studio/storytelling-workspace'

const source = fixture()
const location = projectMotionStudioStorytellingWorkspaceLocation(source)
const ordinaryRoute = ordinaryNamedEditRoute(source.project.id, source.edit.id)

assert.equal(location.workflowId, MOTION_STUDIO_STORYTELLING_WORKFLOW_ID)
assert.equal(location.libraryRoute, MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE)
assert.equal(
  location.workspaceRoute,
  '/motion-studio/storytelling/projects/project-story-001/edits/edit-story-001',
)
assert.notEqual(location.workspaceRoute, ordinaryRoute)
assert.equal(location.defaultSurface, 'director_chat')
assert.equal(location.chatExperience, 'motion_studio_storytelling_director_chat')
assert.equal(location.normalEditRouteReused, false)
assert.equal(location.queryParameterCanPromoteWorkflow, false)
assert.equal(location.workflowBinding.sourceReverified, true)
assert.equal(location.workflowBinding.editingCategoryDeterminesWorkflow, false)
assert.match(location.workflowBinding.bindingDigest, /^[a-f0-9]{64}$/u)
assert.deepEqual(parseMotionStudioStorytellingWorkspaceRoute(location.workspaceRoute), {
  projectId: source.project.id,
  editSessionId: source.edit.id,
})

assert.equal(isMotionStudioStorytellingHandoff({
  editSessionId: 'ordinary-edit-with-storytelling-category',
}), false, 'category-only normal edits must remain normal edits')
assert.equal(isMotionStudioStorytellingHandoff({
  editSessionId: 'storytelling-edit-retained-v1',
}), false, 'legacy identity is never runtime route authority')
assert.equal(isRetainedLegacyMotionStudioStorytellingMigrationCandidate({
  projectId: 'project-retained-v1',
  editSessionId: 'storytelling-edit-retained-v1',
  productWorkflow: undefined,
  editorPath: '/motion-studio/storytelling/projects/project-retained-v1/edits/storytelling-edit-retained-v1',
}), true, 'the exact retained V1 identity and dedicated path may enter only the explicit migration boundary')
assert.equal(isRetainedLegacyMotionStudioStorytellingMigrationCandidate({
  projectId: 'project-retained-v1',
  editSessionId: 'storytelling-edit-retained-v1',
  productWorkflow: undefined,
  editorPath: '/projects/project-retained-v1/edits/storytelling-edit-retained-v1',
}), false, 'a prefix-only ordinary edit is never a migration or Motion route authority')
assert.equal(isMotionStudioStorytellingHandoff({
  editSessionId: 'storytelling-edit-retained-v1',
  productWorkflow: 'video_edit',
}), false, 'an explicit normal workflow must override the retained V1 prefix')
assert.equal(isMotionStudioStorytellingHandoff({
  editSessionId: 'ordinary-edit-explicit-motion',
  productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
}), true)

const exactProductionTuple = {
  projectId: 'project-story-001',
  editSessionId: 'edit-story-001',
  moduleId: 'storytelling',
  moduleCatalogVersion: 'motion-studio-module-catalog-v1',
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
}
assert.equal(isVerifiedMotionStudioStorytellingProductionAssociation({
  projectId: exactProductionTuple.projectId,
  editSessionId: exactProductionTuple.editSessionId,
  productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
}, exactProductionTuple), true, 'signed-in Storytelling requires the parsed workflow plus exact production tuple')
assert.equal(isVerifiedMotionStudioStorytellingProductionAssociation({
  projectId: exactProductionTuple.projectId,
  editSessionId: exactProductionTuple.editSessionId,
}, exactProductionTuple), false, 'an exact production cannot replace the durable signed-in workflow discriminator')
assert.equal(isVerifiedMotionStudioStorytellingProductionAssociation({
  projectId: exactProductionTuple.projectId,
  editSessionId: exactProductionTuple.editSessionId,
  productWorkflow: 'video_edit',
}, exactProductionTuple), false, 'an explicit normal Edit Videos workflow cannot be promoted by a Motion production')
assert.equal(isVerifiedMotionStudioStorytellingProductionAssociation({
  projectId: 'project-other',
  editSessionId: exactProductionTuple.editSessionId,
  productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
}, exactProductionTuple), false, 'cross-project production substitution must fail')
assert.equal(isVerifiedMotionStudioStorytellingProductionAssociation({
  projectId: exactProductionTuple.projectId,
  editSessionId: 'edit-other',
  productWorkflow: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
}, exactProductionTuple), false, 'cross-edit production substitution must fail')

// The ordinary Storytelling video category remains ordinary edit metadata.
// It cannot open Motion Studio without the explicit production association.
const categoryOnly = {
  authorization: source.authorization,
  project: source.project,
  edit: source.edit,
}
assert.throws(() => projectMotionStudioStorytellingWorkspaceLocation(
  categoryOnly as ProjectMotionStudioStorytellingWorkspaceLocationInput,
))

// Changing ordinary edit category does not create, remove, or rewrite the
// already source-verified Motion production binding.
const unrelatedCategory = fixture()
unrelatedCategory.edit.category = 'education_explainer'
const locationWithUnrelatedCategory = projectMotionStudioStorytellingWorkspaceLocation(unrelatedCategory)
assert.equal(locationWithUnrelatedCategory.workspaceRoute, location.workspaceRoute)
assert.equal(
  locationWithUnrelatedCategory.workflowBinding.bindingDigest,
  location.workflowBinding.bindingDigest,
)

// Query strings and historical normal-edit aliases cannot promote an edit to
// the dedicated Motion Storytelling workspace.
for (const invalidRoute of [
  ordinaryRoute,
  `${ordinaryRoute}?studio=story`,
  `${ordinaryRoute}?category=storytelling`,
  `${ordinaryRoute}/motion-studio`,
  '/motion-studio?workflow=storytelling',
  `${location.workspaceRoute}?studio=story`,
  `${location.workspaceRoute}#chat`,
  `${location.workspaceRoute}/`,
  '/motion-studio/storytelling/projects/project-story-001/edits/../edit-story-001',
]) {
  assert.equal(
    parseMotionStudioStorytellingWorkspaceRoute(invalidRoute),
    undefined,
    `Noncanonical route unexpectedly selected Motion Storytelling: ${invalidRoute}`,
  )
}

const crossedProject = fixture()
crossedProject.production.projectId = 'project-other'
assert.throws(() => projectMotionStudioStorytellingWorkspaceLocation(crossedProject))

const crossedEdit = fixture()
crossedEdit.production.editSessionId = 'edit-other'
assert.throws(() => projectMotionStudioStorytellingWorkspaceLocation(crossedEdit))

const unverified = fixture()
unverified.workflowAssociation.sourceReverified = false as true
assert.throws(() => projectMotionStudioStorytellingWorkspaceLocation(unverified))

const callerSelectedWorkflow = fixture()
callerSelectedWorkflow.workflowAssociation.workflowId = 'ordinary.storytelling' as typeof MOTION_STUDIO_STORYTELLING_WORKFLOW_ID
assert.throws(() => projectMotionStudioStorytellingWorkspaceLocation(callerSelectedWorkflow))

const spoofedLocation = structuredClone(location) as unknown as Record<string, unknown>
spoofedLocation.workspaceRoute = ordinaryRoute
assert.equal(motionStudioStorytellingWorkspaceLocationSchema.safeParse(spoofedLocation).success, false)

const queryPromoted = structuredClone(location) as unknown as Record<string, unknown>
queryPromoted.queryParameterCanPromoteWorkflow = true
assert.equal(motionStudioStorytellingWorkspaceLocationSchema.safeParse(queryPromoted).success, false)

const extraAuthority = {
  ...location,
  providerAttemptId: 'provider-attempt-not-browser-safe',
}
assert.equal(motionStudioStorytellingWorkspaceLocationSchema.safeParse(extraAuthority).success, false)

const serialized = JSON.stringify(location)
for (const forbidden of [
  'editCategory', 'provider', 'jobId', 'leaseId', 'credential', 'signedUrl',
  'internalCost', 'customerPrice', 'creditsCharged', 'prompt', 'database',
  'supabase', 'workerCommand', 'rawDiagnostic',
]) {
  assert.equal(serialized.includes(forbidden), false, `Workspace receipt leaked ${forbidden}.`)
}

console.log(JSON.stringify({
  smoke: 'motion-studio-storytelling-workflow-route-contract',
  workflowId: location.workflowId,
  routeTemplate: MOTION_STUDIO_STORYTELLING_WORKSPACE_ROUTE_TEMPLATE,
  libraryRoute: location.libraryRoute,
  dedicatedWorkspaceRoute: location.workspaceRoute,
  ordinaryEditRoute: ordinaryRoute,
  categoryDeterminesWorkflow: false,
  queryCanPromoteWorkflow: false,
  sharedRouterModified: false,
  sharedShellModified: false,
  normalChatModified: false,
  providerRequests: 0,
  remoteMutations: 0,
  customerCommercialMutations: 0,
}, null, 2))

function fixture(): ProjectMotionStudioStorytellingWorkspaceLocationInput {
  const workspaceId = 'workspace-story-001'
  const projectId = 'project-story-001'
  const editSessionId = 'edit-story-001'
  return {
    authorization: {
      authorizedWorkspaceId: workspaceId,
      currentMembershipVerified: true,
      projectAccessVerified: true,
      authorizationCheckedBeforeDetail: true,
    },
    project: {
      id: projectId,
      workspaceId,
    },
    edit: {
      id: editSessionId,
      workspaceId,
      projectId,
      category: 'storytelling',
    },
    production: {
      id: 'production-story-001',
      workspaceId,
      projectId,
      editSessionId,
      moduleId: 'storytelling',
      moduleCatalogVersion: 'motion-studio-module-catalog-v1',
      stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
      recordVersion: 7,
    },
    workflowAssociation: {
      workflowId: MOTION_STUDIO_STORYTELLING_WORKFLOW_ID,
      sourceAuthority: 'canonical_motion_studio_production',
      sourceReverified: true,
      productionAssociationVerified: true,
    },
  }
}
