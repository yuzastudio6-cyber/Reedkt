import assert from 'node:assert/strict'

import {
  createCaptionsHarnessCall,
  runCaptionsInternalHarnessToCompletion,
} from '../internal-testing/captions-specialist-harness'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}

const call = createCaptionsHarnessCall({
  callId: 'captions.multi-support.occluded.fixture',
  jobType: 'resolve_subject_occluded_typography',
  scopeLevel: 'scene',
})
const run = runCaptionsInternalHarnessToCompletion({ call })

check(run.initialResult.disposition === 'needs_followup',
  'Mask-dependent typography must wait for shared-owner evidence.')
check(run.initialResult.supportRequests.length === 2,
  'The initial call must identify both Visual Intelligence and Track All.')
check(run.initialResult.supportRequests.map((request) =>
  request.targetSkillKey).join('|') === 'visual_intelligence|track_all',
'Support requests must preserve the deterministic dependency order.')
check(run.resumeSteps.length === 1,
  'The generic harness must stop at the first unbound owner response.')
check(run.resumeSteps.map((step) =>
  step.selectedSupportRequest.targetSkillKey).join('|')
    === 'visual_intelligence',
'The harness selects Visual Intelligence first, then refuses its bare ref.')
check(run.resumeSteps[0].resumedResult.disposition === 'blocked'
  && run.resumeSteps[0].resumedResult.reasonCodes.join('|')
    === 'input.visual_intelligence.payload.missing',
'A generic Visual Intelligence artifact cannot be promoted as evidence.')
check(run.finalResult.disposition === 'blocked'
  && !run.completedWithoutDirectPeerDispatch,
'The generic two-owner flow remains blocked without typed owner evidence.')
check(JSON.stringify(run.authorityStateBefore)
  === JSON.stringify(run.authorityStateAfter),
'The internal coordinator must mutate no timeline, runtime, asset, QA, or billing authority.')
check(run.resumeSteps.every((step) =>
  step.selectedSupportRequest.originalCallRef.id
    === step.resumedCall.resumeOriginCallRef?.id
  && step.selectedSupportRequest.requestId
    === step.resumedCall.resumeOfSupportRequestRef?.id),
'Every resume must bind the exact request and exact immediate origin call.')

expectThrow(() => runCaptionsInternalHarnessToCompletion({
  call,
  maximumResumeSteps: 0,
}))
expectThrow(() => runCaptionsInternalHarnessToCompletion({
  call,
  maximumResumeSteps: 33,
}))

console.log(JSON.stringify({
  smoke: 'captions_specialist_multi_support_sequential_resume',
  assertions,
  initialSupportTargets: run.initialResult.supportRequests.map((request) =>
    request.targetSkillKey),
  resumeStepCount: run.resumeSteps.length,
  finalDisposition: run.finalResult.disposition,
  directPeerDispatchOccurred: false,
  timelineOrAssetMutationOccurred: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
