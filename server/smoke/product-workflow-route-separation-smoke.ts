import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createLocalInternalProjectHandoff,
  isNormalVideoEditHandoff,
  resolveLocalProductWorkflow,
} from '../../src/lib/local-project-handoff'
import {
  isRetainedLegacyMotionStudioStorytellingMigrationCandidate,
  motionStudioStorytellingWorkspaceRoute,
} from '../../src/lib/motion-studio/contracts/storytelling-workflow'
import {
  projectRetainedLegacyStorytellingWorkflowMigration,
  type InternalEditStateRecord,
} from '../services/internal-edit-state-service'

const normalStorytelling = createLocalInternalProjectHandoff({
  workspaceId: 'workspace-workflow-separation',
  projectId: 'project-normal-storytelling',
  editSessionId: 'edit-normal-storytelling',
  projectName: 'Normal Storytelling Project',
  editName: 'Normal Storytelling Edit',
  category: 'storytelling',
  now: new Date('2026-07-22T19:30:00.000Z'),
})
assert.equal(normalStorytelling.productWorkflow, 'video_edit')
assert.equal(isNormalVideoEditHandoff(normalStorytelling), true)

const explicitMotion = createLocalInternalProjectHandoff({
  workspaceId: 'workspace-workflow-separation',
  projectId: 'project-motion-storytelling',
  editSessionId: 'motion-production-edit',
  projectName: 'Motion Storytelling Project',
  editName: 'Motion Studio Story',
  category: 'storytelling',
  productWorkflow: 'motion_studio.storytelling',
  now: new Date('2026-07-22T19:30:00.000Z'),
})
assert.equal(explicitMotion.productWorkflow, 'motion_studio.storytelling')
assert.equal(isNormalVideoEditHandoff(explicitMotion), false)
assert.equal(
  explicitMotion.editorPath,
  '/motion-studio/storytelling/projects/project-motion-storytelling/edits/motion-production-edit',
)

const prefixOnlyOrdinaryEdit = createLocalInternalProjectHandoff({
  workspaceId: 'workspace-workflow-separation',
  projectId: 'project-retained-motion-storytelling',
  editSessionId: 'storytelling-edit-retained-v1',
  projectName: 'Retained Motion Storytelling Project',
  editName: 'Retained Motion Studio Story',
  category: 'storytelling',
  now: new Date('2026-07-22T19:30:00.000Z'),
})
assert.equal(prefixOnlyOrdinaryEdit.productWorkflow, 'video_edit')
assert.equal(isNormalVideoEditHandoff(prefixOnlyOrdinaryEdit), true)
assert.match(
  prefixOnlyOrdinaryEdit.editorPath,
  /^\/projects\/project-retained-motion-storytelling\/edits\/storytelling-edit-retained-v1\?/u,
)

assert.equal(
  resolveLocalProductWorkflow({ editSessionId: 'storytelling-edit-retained-v1' }),
  'video_edit',
)
assert.equal(isRetainedLegacyMotionStudioStorytellingMigrationCandidate({
  projectId: 'project-retained-motion-storytelling',
  editSessionId: 'storytelling-edit-retained-v1',
  productWorkflow: undefined,
  editorPath: motionStudioStorytellingWorkspaceRoute(
    'project-retained-motion-storytelling',
    'storytelling-edit-retained-v1',
  ),
}), true, 'only the exact retained dedicated route may enter the production-verified migration boundary')
assert.equal(isRetainedLegacyMotionStudioStorytellingMigrationCandidate(prefixOnlyOrdinaryEdit), false)
assert.equal(
  resolveLocalProductWorkflow({
    editSessionId: 'storytelling-edit-explicit-normal',
    productWorkflow: 'video_edit',
  }),
  'video_edit',
)
assert.equal(
  resolveLocalProductWorkflow({ editSessionId: 'normal-documentary-edit' }),
  'video_edit',
)

const retainedSourceUpdatedAt = '2026-07-22T19:30:00.000Z'
const retainedRecord: InternalEditStateRecord = {
  recordVersion: 'private-internal-edit-state-v2',
  source: 'frontend_scoped_internal_project_handoff',
  workspaceId: 'workspace-workflow-separation',
  projectId: 'project-retained-motion-storytelling',
  editSessionId: 'storytelling-edit-retained-v1',
  userId: 'user-workflow-separation',
  handoff: {
    id: 'storytelling-edit-retained-v1',
    workspaceId: 'workspace-workflow-separation',
    projectId: 'project-retained-motion-storytelling',
    editSessionId: 'storytelling-edit-retained-v1',
    projectName: 'Retained Motion Storytelling Project',
    editName: 'Retained Motion Studio Story',
    category: 'storytelling',
    editorPath: motionStudioStorytellingWorkspaceRoute(
      'project-retained-motion-storytelling',
      'storytelling-edit-retained-v1',
    ),
    stage: 'created',
    sourceFileCount: 0,
    createdAt: retainedSourceUpdatedAt,
    updatedAt: retainedSourceUpdatedAt,
    persistence: 'browser_local_internal_testing',
  },
  createdAt: retainedSourceUpdatedAt,
  updatedAt: retainedSourceUpdatedAt,
  mockOnly: true,
}
const exactProduction = {
  id: 'production-retained-motion-storytelling',
  projectId: retainedRecord.projectId,
  editSessionId: retainedRecord.editSessionId,
  moduleId: 'storytelling',
  moduleCatalogVersion: 'motion-studio-module-catalog-v1',
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
  recordVersion: 7,
  updatedAt: '2026-07-22T19:31:00.000Z',
}
const migrated = projectRetainedLegacyStorytellingWorkflowMigration({
  existing: retainedRecord,
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:32:00.000Z',
  production: exactProduction,
})
assert.equal(migrated.internalEditState.handoff.productWorkflow, 'motion_studio.storytelling')
assert.equal(migrated.receipt.productionId, exactProduction.id)
assert.match(migrated.receipt.productionAuthorityHash, /^[a-f0-9]{64}$/u)
assert.equal(migrated.receipt.providerCalled, false)
assert.equal(migrated.receipt.generationStarted, false)
assert.match(migrated.receipt.receiptDigest, /^[a-f0-9]{64}$/u)
const migrationReplay = projectRetainedLegacyStorytellingWorkflowMigration({
  existing: migrated.internalEditState,
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:33:00.000Z',
  production: exactProduction,
})
assert.equal(migrationReplay.receipt.receiptDigest, migrated.receipt.receiptDigest)
assert.throws(() => projectRetainedLegacyStorytellingWorkflowMigration({
  existing: migrated.internalEditState,
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'changed-migration-key',
  now: '2026-07-22T19:33:00.000Z',
  production: exactProduction,
}), /did not match the committed request/u)
assert.throws(() => projectRetainedLegacyStorytellingWorkflowMigration({
  existing: retainedRecord,
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:32:00.000Z',
  production: { ...exactProduction, projectId: 'project-crossed' },
}), /did not match the retained Project and Named Edit/u)
assert.throws(() => projectRetainedLegacyStorytellingWorkflowMigration({
  existing: retainedRecord,
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:32:00.000Z',
  production: { ...exactProduction, moduleCatalogVersion: 'retired-catalog' },
}), /did not match the retained Project and Named Edit/u)
assert.throws(() => projectRetainedLegacyStorytellingWorkflowMigration({
  existing: retainedRecord,
  expectedHandoffUpdatedAt: '2026-07-22T19:29:00.000Z',
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:32:00.000Z',
  production: exactProduction,
}), /changed before migration/u)
assert.throws(() => projectRetainedLegacyStorytellingWorkflowMigration({
  existing: {
    ...migrated.internalEditState,
    storytellingWorkflowMigration: {
      ...migrated.receipt,
      productionAuthorityHash: '0'.repeat(64),
    },
  },
  expectedHandoffUpdatedAt: retainedSourceUpdatedAt,
  idempotencyKey: 'retained-storytelling-migration-key',
  now: '2026-07-22T19:33:00.000Z',
  production: exactProduction,
}), /receipt is invalid/u)

const appSource = readFileSync('src/App.tsx', 'utf8')
const navigationSource = readFileSync('src/data/productContent.ts', 'utf8')
const appShellSource = readFileSync('src/components/AppShell.tsx', 'utf8')
const internalEditStateServiceSource = readFileSync('server/services/internal-edit-state-service.ts', 'utf8')
const internalEditStateRouteSource = readFileSync('server/routes/internal-edit-state-routes.ts', 'utf8')
const editorPageSource = readFileSync('src/pages/EditorPage.tsx', 'utf8')
const editReferenceWorkspaceSource = readFileSync(
  'src/components/preferences/EditReferenceWorkspacePage.tsx',
  'utf8',
)

assert.match(appSource, /path="\/projects" element=\{<ProjectsPage \/>\}/)
assert.match(appSource, /path="\/edit-videos" element=\{<EditVideosPage \/>\}/)
assert.match(appSource, /path="\/projects\/:projectId\/edits\/:editSessionId" element=\{<EditorPage \/>\}/)
assert.match(navigationSource, /label: 'Projects', to: '\/projects'/)
assert.match(navigationSource, /label: 'Edit Videos', to: '\/edit-videos'/)
assert.match(appShellSource, /path === '\/edit-videos' && isNamedEditRoute/)
assert.match(appShellSource, /path === '\/motion-studio' && isMotionStudioRoute/)
assert.doesNotMatch(appShellSource, /category\s*===\s*['"]storytelling['"]/)
assert.match(internalEditStateServiceSource, /Internal edit state route does not match its product workflow\./)
assert.match(internalEditStateServiceSource, /motion_studio\.storytelling/)
assert.doesNotMatch(internalEditStateServiceSource, /productWorkflow === undefined && input\.editSessionId\.startsWith/)
assert.match(internalEditStateServiceSource, /migrateRetainedStorytellingWorkflow/)
assert.match(
  internalEditStateRouteSource,
  /requireAuth,\s*requireInternalEditStateMigrationAccess,\s*requireSensitiveIdempotencyKey,/u,
)
assert.match(editorPageSource, /isVerifiedMotionStudioStorytellingProductionAssociation/)
assert.match(editorPageSource, /No normal Edit Chat, replacement production, planning, generation, or credit action was started\./)
assert.match(
  editReferenceWorkspaceSource,
  /to="\/edit-videos" variant="secondary">Choose a project edit<\/Button>/,
)

console.log(JSON.stringify({
  ok: true,
  contract: 'reeditpro-product-workflow-route-separation-v1',
  projectsRoute: '/projects',
  editVideosRoute: '/edit-videos',
  normalEditRoute: '/projects/:projectId/edits/:editSessionId',
  motionWorkflowId: 'motion_studio.storytelling',
  motionLibraryRoute: '/motion-studio/storytelling',
  motionWorkspaceRoute: '/motion-studio/storytelling/projects/:projectId/edits/:editSessionId',
  editingCategoryDeterminesWorkflow: false,
  providerCalled: false,
  cloudMutated: false,
  productionReady: false,
}, null, 2))
