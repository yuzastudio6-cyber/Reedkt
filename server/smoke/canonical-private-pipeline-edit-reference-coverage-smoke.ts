import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const cliSource = readFileSync(
  join(root, 'server/cli/canonical-private-pipeline-verification.ts'),
  'utf8',
)
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}

const canonicalStart = cliSource.indexOf('const canonicalSteps: VerificationStep[] = [')
const canonicalEnd = cliSource.indexOf('const fullBoundarySteps: VerificationStep[] = [')
assert.ok(canonicalStart >= 0, 'Canonical pipeline step list is missing.')
assert.ok(canonicalEnd > canonicalStart, 'Canonical pipeline step list is malformed.')
const canonicalSource = cliSource.slice(canonicalStart, canonicalEnd)

const expectedSteps = [
  ['canonical-edit-reference-ui-integration', 'smoke:canonical-product-ui-integration-readiness'],
  ['canonical-edit-reference-atomic-apply', 'smoke:edit-reference-exact-edit-apply-runtime'],
  [
    'canonical-exact-edit-preference-planning-authority',
    'smoke:planning-exact-edit-preference-authority-port',
  ],
  [
    'canonical-preference-application-planning-authority',
    'smoke:planning-preference-application-authority-port',
  ],
  [
    'canonical-edit-reference-domain-repository-runtime',
    'smoke:edit-reference-mounted-domain-repository-runtime',
  ],
  [
    'canonical-edit-reference-study-chat-runtime',
    'smoke:edit-reference-mounted-study-chat-runtime',
  ],
  [
    'canonical-edit-reference-long-form-runtime',
    'smoke:edit-reference-mounted-long-form-runtime',
  ],
  [
    'canonical-distributed-pre-plan-study-contract',
    'smoke:canonical-distributed-pre-plan-study-state-port',
  ],
  [
    'canonical-distributed-pre-plan-study-rpc-transport',
    'smoke:canonical-distributed-pre-plan-study-rpc-adapter',
  ],
] as const

const parsedSteps = [...canonicalSource.matchAll(/step\(\s*'([^']+)'\s*,\s*'([^']+)'/g)]
  .map((match) => ({ id: match[1]!, script: match[2]! }))
const stepIds = parsedSteps.map((entry) => entry.id)
assert.equal(new Set(stepIds).size, stepIds.length, 'Canonical pipeline step IDs must be unique.')

for (const [id, script] of expectedSteps) {
  assert.equal(
    parsedSteps.filter((entry) => entry.id === id && entry.script === script).length,
    1,
    `${id} must be present exactly once with ${script}.`,
  )
  assert.equal(
    packageJson.scripts?.[script],
    expectedScriptCommand(script),
    `${script} must resolve to the reviewed smoke entrypoint.`,
  )
}

assert.match(cliSource, /schemaVersion: 'canonical-private-pipeline-verification-v39'/)
for (const claim of [
  'canonicalEditReferenceUiIntegrationSourceVerified: true',
  'canonicalEditReferenceExactEditAtomicApplyContract: true',
  'canonicalExactEditPreferencePlanningAuthorityContract: true',
  'canonicalPreferenceApplicationPlanningAuthorityContract: true',
  'canonicalEditReferenceDomainRepositoryRuntimeSelectionContract: true',
  'canonicalEditReferenceStudyChatMountedRuntimeContract: true',
  'canonicalEditReferenceLongFormMountedRuntimeContract: true',
  'canonicalEditReferenceDistributedPrePlanStateContract: true',
  'canonicalEditReferenceDistributedPrePlanRpcTransportContract: true',
]) {
  assert.equal(cliSource.includes(claim), true, `Missing verified claim: ${claim}`)
}
for (const boundary of [
  'editReferenceLiveDomainRepositoryVerified: false',
  'editReferenceLiveStudyChatReasoningRuntimeVerified: false',
  'editReferenceLiveLongFormRuntimeVerified: false',
  'editReferenceDistributedPrePlanDatabaseVerified: false',
  'editReferenceDistributedPrePlanWorkerDispatchVerified: false',
  'editReferenceProductionReady: false',
]) {
  assert.equal(cliSource.includes(boundary), true, `Missing fail-closed boundary: ${boundary}`)
}

assert.match(cliSource, /professionalLongFormRoutineVerificationProfileId: 'routine_two_hour'/)
assert.match(cliSource, /professionalLongFormRoutineDurationSeconds: 7_200/)
assert.match(cliSource, /professionalLongFormReleaseStressProfileId: 'release_six_hour'/)
assert.match(cliSource, /professionalLongFormReleaseStressDurationSeconds: 21_600/)
assert.match(cliSource, /professionalLongFormReleaseStressExecutedInThisRun: false/)
assert.equal(
  canonicalSource.includes("'smoke:canonical-professional-long-form-post-approval:release-six-hour'"),
  false,
  'Routine canonical verification must not execute the six-hour release-stress script.',
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'canonical-private-pipeline-edit-reference-coverage-smoke-v1',
  editReferenceStepCount: expectedSteps.length,
  canonicalStepCount: parsedSteps.length,
  routineLongFormProfile: 'routine_two_hour',
  releaseStressProfile: 'release_six_hour',
  releaseStressExecutedByRoutinePipeline: false,
  productionReady: false,
}, null, 2))

function expectedScriptCommand(script: string): string {
  const commands: Record<string, string> = {
    'smoke:canonical-product-ui-integration-readiness':
      'tsx server/smoke/canonical-product-ui-integration-readiness-smoke.ts',
    'smoke:edit-reference-exact-edit-apply-runtime':
      'tsx server/smoke/edit-reference-exact-edit-apply-runtime-port-smoke.ts',
    'smoke:planning-exact-edit-preference-authority-port':
      'tsx server/smoke/planning-exact-edit-preference-authority-port-smoke.ts',
    'smoke:planning-preference-application-authority-port':
      'tsx server/smoke/planning-preference-application-authority-port-smoke.ts',
    'smoke:edit-reference-mounted-domain-repository-runtime':
      'tsx server/smoke/edit-reference-mounted-domain-repository-runtime-port-smoke.ts',
    'smoke:edit-reference-mounted-study-chat-runtime':
      'tsx server/smoke/edit-reference-mounted-study-chat-runtime-port-smoke.ts',
    'smoke:edit-reference-mounted-long-form-runtime':
      'tsx server/smoke/edit-reference-mounted-long-form-runtime-port-smoke.ts',
    'smoke:canonical-distributed-pre-plan-study-state-port':
      'tsx server/smoke/canonical-distributed-pre-plan-study-state-port-smoke.ts',
    'smoke:canonical-distributed-pre-plan-study-rpc-adapter':
      'tsx server/smoke/canonical-distributed-pre-plan-study-state-rpc-adapter-smoke.ts',
  }
  const command = commands[script]
  assert.ok(command, `No reviewed command fixture exists for ${script}.`)
  return command
}
