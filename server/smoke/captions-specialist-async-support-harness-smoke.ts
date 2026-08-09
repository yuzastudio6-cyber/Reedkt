import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCaptionsAuthenticatedOwnerFixture,
} from '../internal-testing/captions-specialist-authenticated-owner-fixtures'
import {
  CAPTIONS_INTERNAL_ASYNC_HARNESS_VERSION,
  createCaptionsHarnessCall,
  runCaptionsInternalHarnessToCompletionAsync,
} from '../internal-testing/captions-specialist-harness'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function approvedCall(jobType:
  | 'resolve_subject_occluded_typography'
  | 'resolve_object_anchored_typography'
  | 'resolve_environmental_typography' =
    'resolve_subject_occluded_typography') {
  return createCaptionsHarnessCall({
    callId: `captions.async-owner-harness.${jobType}`,
    jobType,
    scopeLevel: 'scene',
    runtimeProfile: 'post_cap20_integration',
    approvedSnapshotRef: {
      id: 'snapshot.caption.async-owner-harness.v1',
      version: 'approved-plan-snapshot-v1',
      contentHash: hash('snapshot.caption.async-owner-harness.v1'),
    },
  })
}

const call = approvedCall()
const originalCallJson = JSON.stringify(call)
const fixture = createCaptionsAuthenticatedOwnerFixture(call)
const ownerOrder: string[] = []
const run = await runCaptionsInternalHarnessToCompletionAsync({
  call,
  initialRuntimeEvidence: fixture.initialRuntimeEvidence,
  resolveSupportRequest: async (context) => {
    await Promise.resolve()
    ownerOrder.push(context.selectedSupportRequest.targetSkillKey)
    return fixture.resolveSupportRequest(context)
  },
})

check(run.harnessVersion === CAPTIONS_INTERNAL_ASYNC_HARNESS_VERSION,
  'the async qualification path has its own explicit internal version')
check(ownerOrder.join('|') === 'visual_intelligence|track_all',
  'independent owner resolution preserves the deterministic support order')
check(run.resumeSteps.length === 2
  && run.finalResult.disposition === 'completed',
  'the async harness resumes the exact two-owner Caption job to completion')
check(run.finalResult.reasonCodes.includes(
  'visual_intelligence.authenticated_admission.accepted')
  && run.finalResult.reasonCodes.includes(
    'track_all.authenticated_admission.accepted'),
  'Caption admits both exact authenticated owner records')
check(run.completedWithoutDirectPeerDispatch
  && run.independentlyExecutedSupportResolverRequired
  && !run.implicitFixtureArtifactInjectionAllowed
  && !run.centralOrchestraImplemented,
  'the async runner remains an explicit test harness rather than Orchestra')
check(JSON.stringify(run.authorityStateBefore)
  === JSON.stringify(run.authorityStateAfter)
  && Object.values(run.authorityStateAfter).every((value) => value === 0),
  'independent owner resolution grants Caption no mutation authority')
check(JSON.stringify(call) === originalCallJson,
  'the asynchronous owner cannot mutate the original specialist call')
check(run.resumeSteps.every((step) =>
  step.resumedCall.injectedSupportArtifactRefs.every((artifact) =>
    artifact.producerSkillKey
      === step.selectedSupportRequest.targetSkillKey
    && artifact.sourceSupportRequestRef?.id
      === step.selectedSupportRequest.requestId
    && artifact.sourceSupportRequestRef?.contentHash
      === step.selectedSupportRequest.requestDigestSha256)),
  'every injected artifact binds the exact selected owner and request digest')

for (const jobType of [
  'resolve_object_anchored_typography',
  'resolve_environmental_typography',
] as const) {
  const advancedCall = approvedCall(jobType)
  const advancedFixture = createCaptionsAuthenticatedOwnerFixture(advancedCall)
  const advancedRun = await runCaptionsInternalHarnessToCompletionAsync({
    call: advancedCall,
    initialRuntimeEvidence: advancedFixture.initialRuntimeEvidence,
    resolveSupportRequest: async (context) =>
      advancedFixture.resolveSupportRequest(context),
  })
  check(advancedRun.finalResult.disposition === 'completed'
    && advancedRun.resumeSteps.length === 2,
  `${jobType} completes the exact Visual Intelligence to Track All chain`)
}

await assert.rejects(async () => {
  const badCall = approvedCall()
  const badFixture = createCaptionsAuthenticatedOwnerFixture(badCall)
  await runCaptionsInternalHarnessToCompletionAsync({
    call: badCall,
    initialRuntimeEvidence: badFixture.initialRuntimeEvidence,
    resolveSupportRequest: undefined as never,
  })
})
assertions += 1

await assert.rejects(async () => {
  const badCall = approvedCall()
  const badFixture = createCaptionsAuthenticatedOwnerFixture(badCall)
  await runCaptionsInternalHarnessToCompletionAsync({
    call: badCall,
    initialRuntimeEvidence: badFixture.initialRuntimeEvidence,
    resolveSupportRequest: async (context) => {
      const resolution = badFixture.resolveSupportRequest(context)
      return {
        ...resolution,
        injectedSupportArtifactRefs: [],
      }
    },
  })
})
assertions += 1

await assert.rejects(async () => {
  const badCall = approvedCall()
  const badFixture = createCaptionsAuthenticatedOwnerFixture(badCall)
  await runCaptionsInternalHarnessToCompletionAsync({
    call: badCall,
    initialRuntimeEvidence: badFixture.initialRuntimeEvidence,
    resolveSupportRequest: async (context) => {
      const resolution = badFixture.resolveSupportRequest(context)
      return {
        ...resolution,
        injectedSupportArtifactRefs:
          resolution.injectedSupportArtifactRefs.map((artifact) => ({
            ...artifact,
            producerSkillKey: 'captions',
          })),
      }
    },
  })
})
assertions += 1

await assert.rejects(async () => {
  const badCall = approvedCall()
  const badFixture = createCaptionsAuthenticatedOwnerFixture(badCall)
  await runCaptionsInternalHarnessToCompletionAsync({
    call: badCall,
    maximumResumeSteps: 1,
    initialRuntimeEvidence: badFixture.initialRuntimeEvidence,
    resolveSupportRequest: async (context) =>
      badFixture.resolveSupportRequest(context),
  })
})
assertions += 1

await assert.rejects(async () => {
  const badCall = approvedCall()
  const badFixture = createCaptionsAuthenticatedOwnerFixture(badCall)
  await runCaptionsInternalHarnessToCompletionAsync({
    call: badCall,
    initialRuntimeEvidence: badFixture.initialRuntimeEvidence,
    resolveSupportRequest: async (context) => {
      const resolution = badFixture.resolveSupportRequest(context)
      const crossed = structuredClone(resolution)
      crossed.injectedSupportArtifactRefs[0]!.sourceSupportRequestRef = {
        id: 'crossed.support.request',
        version: context.selectedSupportRequest.schemaVersion,
        contentHash: hash('crossed.support.request'),
      }
      return crossed
    },
  })
})
assertions += 1

console.log(JSON.stringify({
  smoke: 'captions_specialist_async_support_harness',
  assertions,
  ownerOrder,
  resumeSteps: run.resumeSteps.length,
  finalDisposition: run.finalResult.disposition,
  independentlyExecutedSupportResolverRequired:
    run.independentlyExecutedSupportResolverRequired,
  implicitFixtureArtifactInjectionAllowed:
    run.implicitFixtureArtifactInjectionAllowed,
  centralOrchestraImplemented: run.centralOrchestraImplemented,
  result: 'passed',
}, null, 2))
