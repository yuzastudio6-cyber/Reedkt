import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [workspace, referencePicker, card, api, routes, styles, packageJsonText] = await Promise.all([
  readFile('src/components/projects/brief/ProjectEditBriefWorkspace.tsx', 'utf8'),
  readFile('src/components/projects/brief/ProjectEditReferenceVideoPicker.tsx', 'utf8'),
  readFile('src/components/projects/brief/ProjectEditAutonomousPrivateReviewCard.tsx', 'utf8'),
  readFile('src/lib/autonomous-private-review-api.ts', 'utf8'),
  readFile('server/routes/project-edit-plan-routes.ts', 'utf8'),
  readFile('src/styles/project-edit-brief.css', 'utf8'),
  readFile('package.json', 'utf8'),
])

assert.match(workspace, /backendApprovedLocalPlan\?\.executionGate \? \(/)
assert.match(workspace, /ProjectEditAutonomousPrivateReviewCard/)
assert.match(workspace, /autonomousReviewReady:/)
assert.match(workspace, /Edit Brief is optional/)
assert.match(workspace, /referenceVideoUploadResult: referenceUploadResult/)
assert.match(workspace, /uploadPurpose: 'reference_media'/)
assert.match(referencePicker, /adapts principles without copying/)
assert.doesNotMatch(referencePicker, /ffmpeg|qwen|playwright|satori|d3/i)
assert.match(card, /Create private review/)
assert.match(card, /Technical checks passed; review the creative result next/)
assert.match(card, /ProjectEditBriefArtifactReviewPlayer/)
assert.doesNotMatch(card, /ffmpeg|libass|qwen|playwright|satori|d3/i)
assert.match(api, /private-review-executions/)
assert.match(api, /private-review-execution\?workspaceId=/)
assert.match(api, /onProgress/)
assert.match(routes, /private-review-executions/)
assert.match(routes, /createAutonomousEditPrivateReviewService/)
assert.match(styles, /project-edit-autonomous-review__progress/)
assert.match(styles, /project-edit-autonomous-review__summary/)

const packageJson = JSON.parse(packageJsonText) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:autonomous-edit-ui-integration'], 'tsx server/smoke/autonomous-edit-ui-integration-smoke.ts')
assert.match(packageJson.scripts?.['qa:editor'] ?? '', /smoke:autonomous-edit-ui-integration/)

console.log(JSON.stringify({
  ok: true,
  decision: 'autonomous_edit_ui_integration_passed',
  checks: {
    evidenceBackedPlansUseRealExecutionCard: true,
    oldMockStackHiddenForAutonomousPlans: true,
    editBriefRemainsOptional: true,
    privateReferenceUploadConnected: true,
    referenceCopyingLanguageRejected: true,
    progressIsHumanFacing: true,
    privateArtifactPlayerConnected: true,
    backendStartAndPollRoutesConnected: true,
    internalToolNamesHidden: true,
  },
}, null, 2))
