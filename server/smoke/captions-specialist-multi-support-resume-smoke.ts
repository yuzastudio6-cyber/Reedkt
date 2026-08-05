import assert from 'node:assert/strict'

import {
  createCaptionsHarnessCall,
  runCaptionsInternalHarnessToCompletion,
} from '../internal-testing/captions-specialist-harness'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

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
check(run.resumeSteps.length === 2,
  'The internal harness must perform two bounded mediated resumes.')
check(run.resumeSteps.map((step) =>
  step.selectedSupportRequest.targetSkillKey).join('|')
    === 'visual_intelligence|track_all',
'The harness must satisfy Visual Intelligence before Track All.')
check(run.resumeSteps[0].resumedResult.disposition === 'needs_followup'
  && run.resumeSteps[0].resumedResult.supportRequests.length === 1
  && run.resumeSteps[0].resumedResult.supportRequests[0].targetSkillKey
    === 'track_all',
'After Visual Intelligence injection, only Track All may remain missing.')
check(run.resumeSteps[1].promotedPriorSupportArtifactRefs.length === 1
  && run.resumeSteps[1].promotedPriorSupportArtifactRefs[0].artifactType
    === 'visual_intelligence_report'
  && run.resumeSteps[1].promotedPriorSupportArtifactRefs[0]
    .sourceSupportRequestRef === null,
'The prior authenticated result must become a reread input for the next call.')
check(run.resumeSteps[1].resumedCall.inputArtifactRefs.some((artifact) =>
  artifact.artifactType === 'visual_intelligence_report'
    && artifact.producerSkillKey === 'visual_intelligence'
    && artifact.sourceSupportRequestRef === null),
'The second resume must retain exact Visual Intelligence producer lineage.')
check(run.resumeSteps[1].resumedCall.injectedSupportArtifactRefs.length === 1
  && run.resumeSteps[1].resumedCall.injectedSupportArtifactRefs[0].artifactType
    === 'track_all_mask_binding'
  && run.resumeSteps[1].resumedCall.injectedSupportArtifactRefs[0]
    .producerSkillKey === 'track_all',
'The second resume must inject only the exact Track All result.')
check(run.finalResult.disposition === 'completed'
  && run.completedWithoutDirectPeerDispatch,
'The bounded two-owner flow must complete without peer dispatch.')
check(JSON.stringify(run.authorityStateBefore)
  === JSON.stringify(run.authorityStateAfter),
'The internal coordinator must mutate no timeline, runtime, asset, QA, or billing authority.')
check(run.resumeSteps.every((step) =>
  step.selectedSupportRequest.originalCallRef.id
    === step.resumedCall.resumeOriginCallRef?.id
  && step.selectedSupportRequest.requestId
    === step.resumedCall.resumeOfSupportRequestRef?.id),
'Every resume must bind the exact request and exact immediate origin call.')

const lostPriorEvidence = structuredClone(run.resumeSteps[1].resumedCall)
lostPriorEvidence.inputArtifactRefs = lostPriorEvidence.inputArtifactRefs.filter(
  (artifact) => artifact.artifactType !== 'visual_intelligence_report')
lostPriorEvidence.callDigestSha256 = calculateSkillContractDigest(
  lostPriorEvidence as unknown as Record<string, unknown>,
  'callDigestSha256')
const lostPriorResult = runCaptionsSpecialistJob({
  call: lostPriorEvidence,
  resumeSupportRequest: run.resumeSteps[1].selectedSupportRequest,
})
check(lostPriorResult.disposition === 'needs_followup'
  && lostPriorResult.supportRequests.some((request) =>
    request.targetSkillKey === 'visual_intelligence'),
'A later resume that loses prior owner evidence must fail closed into follow-up.')
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
