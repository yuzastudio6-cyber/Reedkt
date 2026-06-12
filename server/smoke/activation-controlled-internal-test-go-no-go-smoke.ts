import { readFileSync } from 'node:fs'
import { buildGoNoGoReport, goNoGoRequiredScripts } from '../activation/controlled-internal-test-go-no-go'

const report = buildGoNoGoReport()
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const scripts = pkg.scripts ?? {}

assert(report.phase === '52G', 'report phase must be 52G')
assert(report.repoOwnershipAudit.implementationAllowed, 'repo ownership audit must allow implementation')
assert(report.decisionPacket.topLevelDecision.positive.includes('go_for_owner_handoff'), 'owner handoff go decision missing')
assert(report.decisionPacket.topLevelDecision.positive.includes('conditional_go_for_non_executing_internal_test_plan'), 'non-executing conditional go decision missing')
assert(report.decisionPacket.topLevelDecision.runtimeGoEmitted === false, 'runtime go must not be emitted')
assert(report.decisionPacket.topLevelDecision.externalBetaGoEmitted === false, 'external beta go must not be emitted')
assert(report.decisionPacket.topLevelDecision.productionGoEmitted === false, 'production go must not be emitted')
assert(report.decisionPacket.workstreamDecisions.length === 12, 'all 12 workstreams must be represented')
assert(report.controlledInternalTestPacket.prohibitedActions.includes('tool execution'), 'controlled internal test packet must block tools')
assert(report.ownerPromptPackets.length === 12, '12 owner prompt packets are required')
assert(report.blockerInventory.some((item) => item.blockerId === 'runtime_execution_blocked'), 'runtime blocker missing')
assert(report.dispatchManifest.sourceOfTruthSummary.some((item) => item.includes('signed URLs are not source of truth')), 'source-of-truth policy missing')
assert(report.syncInput.phaseId === '52G', 'Supabase sync input must target Phase 52G')
assert(report.phase52HReadiness === 'blocked' || report.phase52HReadiness === 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake', 'Phase52H readiness state invalid')
for (const script of goNoGoRequiredScripts) assert(Boolean(scripts[script]), `missing script ${script}`)
assert(report.dispatchManifest.blockedFeatures.includes('production_ready'), 'production gate must be blocked')
assert(report.dispatchManifest.blockedFeatures.includes('external_beta'), 'external beta gate must be blocked')
assert(report.dispatchManifest.blockedFeatures.includes('broad_real_media'), 'broad media gate must be blocked')
assert(report.dispatchManifest.blockedFeatures.includes('worker_execution'), 'worker execution gate must be blocked')

console.log('Phase 52G controlled internal test go/no-go smoke passed.')

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
