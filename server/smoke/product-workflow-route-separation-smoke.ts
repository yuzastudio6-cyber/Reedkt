import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createLocalInternalProjectHandoff,
  isNormalVideoEditHandoff,
  resolveLocalProductWorkflow,
} from '../../src/lib/local-project-handoff'

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

const retainedLegacyMotion = createLocalInternalProjectHandoff({
  workspaceId: 'workspace-workflow-separation',
  projectId: 'project-retained-motion-storytelling',
  editSessionId: 'storytelling-edit-retained-v1',
  projectName: 'Retained Motion Storytelling Project',
  editName: 'Retained Motion Studio Story',
  category: 'storytelling',
  now: new Date('2026-07-22T19:30:00.000Z'),
})
assert.equal(retainedLegacyMotion.productWorkflow, 'motion_studio.storytelling')
assert.equal(
  retainedLegacyMotion.editorPath,
  '/motion-studio/storytelling/projects/project-retained-motion-storytelling/edits/storytelling-edit-retained-v1',
)

assert.equal(
  resolveLocalProductWorkflow({ editSessionId: 'storytelling-edit-retained-v1' }),
  'motion_studio.storytelling',
)
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

const appSource = readFileSync('src/App.tsx', 'utf8')
const navigationSource = readFileSync('src/data/productContent.ts', 'utf8')
const appShellSource = readFileSync('src/components/AppShell.tsx', 'utf8')
const internalEditStateServiceSource = readFileSync('server/services/internal-edit-state-service.ts', 'utf8')
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
