import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildSam2ModelApprovalReport,
  sam2FutureScope,
  sam2LicenseReview,
  sam2ModelApprovalCommandPlans,
  sam2ModelEvidence,
  sam2RiskRegister,
} from '../activation/sam2-model-approval'

const report = buildSam2ModelApprovalReport()

assert.equal(report.phase, '35A')
assert.equal(report.status, 'blocked_pending_human_review')
assert.equal(report.approvalDecision, 'pending_human_review')
assert.equal(report.modelEvidence.modelFamily, 'SAM2 / Segment Anything Model 2')
assert.equal(report.modelEvidence.currentState, 'evaluated_only')
assert.equal(report.modelEvidence.noWeightsDownloaded, true)
assert.equal(report.modelEvidence.noRuntimeExecuted, true)
assert.equal(report.modelEvidence.noTemporalTrackingTested, true)
assert.equal(report.modelEvidence.birefnetOnlyRuntimeProvenSoFar, true)
assert.ok(sam2ModelEvidence.candidates.some((candidate) => candidate.candidateId === 'facebook_sam2_hiera_tiny'))
assert.ok(sam2ModelEvidence.candidates.some((candidate) => candidate.candidateId === 'meta_sam2_official_checkpoints'))
assert.ok(sam2ModelEvidence.candidates.some((candidate) => candidate.sourceEvidence.some((evidence) => evidence.licenseClaim.toLowerCase() === 'apache-2.0')))

assert.equal(sam2LicenseReview.licenseIdentified, true)
assert.equal(sam2LicenseReview.requiresHumanLegalReview, true)
assert.equal(sam2LicenseReview.humanApprovalRecorded, false)
assert.equal(sam2LicenseReview.approvalDecision, 'pending_human_review')

for (const riskId of [
  'license-provenance-incomplete',
  'checkpoint-checksum-unavailable',
  'model-download-not-approved',
  'runtime-image-not-verified',
  'gpu-cost-quota-risk',
  'temporal-mask-drift',
  'identity-object-tracking-drift',
  'occlusion-failures',
  'edge-flicker',
  'hair-fine-detail-instability',
  'fast-motion-instability',
  'mask-bleed-across-objects',
  'full-video-mask-qa-not-proven',
  'text-behind-subject-temporal-artifacts',
  'privacy-subject-extraction-risk',
  'broad-real-media-safety-risk',
]) {
  assert.ok(sam2RiskRegister.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `${riskId} blocker risk must exist.`)
}

assert.deepEqual(sam2FutureScope.phaseSequence.map((phase) => phase.phase), ['35B', '35C', '35D', '35E'])
assert.equal(report.futureScope.sam2PlanningRecommendationAllowed, true)
assert.equal(report.sam2DownloadAllowed, false)
assert.equal(report.sam2RuntimeAllowed, false)
assert.equal(report.sam2TemporalTrackingAllowed, false)
assert.equal(report.sam2FullVideoMaskAllowed, false)
assert.equal(report.fullVideoTextBehindSubjectAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)

assert.equal(report.phase35BReadiness.ready, false)
assert.equal(report.phase35BReadiness.nextPhase, 'Phase 35B SAM2 download/load')
assert.ok(report.phase35BReadiness.blockers.length > 0)

const disallowedExecutablePattern = /docker\s+(build|push)|gcloud\s+.*(deploy|execute|jobs)|gsutil\s+|gcloud\s+storage\s+cp|curl\s+|wget\s+|huggingface-cli|snapshot_download|provider|allUsers|allAuthenticatedUsers|Revideo production/i
for (const commandPlan of sam2ModelApprovalCommandPlans) {
  assert.equal(commandPlan.requiresHumanApproval, true)
  assert.equal(commandPlan.textOnlyByDefault, true)
  assert.equal(commandPlan.allowedInPhase35A, false)
  assert.equal(commandPlan.executableCommand, null)
  assert.ok(commandPlan.blockedReason)
  assert.ok(commandPlan.commandText.startsWith('TEXT_ONLY'))
  assert.doesNotMatch(commandPlan.commandText, disallowedExecutablePattern)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:sam2-model-approval:plan'], 'tsx server/cli/activation-sam2-model-approval-plan.ts')
assert.equal(packageJson.scripts['activation:sam2-model-approval:report'], 'tsx server/cli/activation-sam2-model-approval-report.ts')
assert.equal(packageJson.scripts['activation:sam2-model-weight:summary'], 'tsx server/cli/activation-sam2-model-weight-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-sam2-model-approval-workflow'], 'tsx server/smoke/activation-sam2-model-approval-workflow-smoke.ts')

const scriptText = [
  packageJson.scripts['activation:sam2-model-approval:plan'],
  packageJson.scripts['activation:sam2-model-approval:report'],
  packageJson.scripts['activation:sam2-model-weight:summary'],
  packageJson.scripts['smoke:activation-sam2-model-approval-workflow'],
].join('\n')
assert.doesNotMatch(scriptText, /docker|gcloud|curl|wget|huggingface-cli|snapshot_download|provider/i)

const roadmap = readFileSync(new URL('../../docs/activation-phase-roadmap.md', import.meta.url), 'utf8')
assert.match(roadmap, /34E\. Real-ESRGAN broader-scope policy decision/)
assert.match(roadmap, /35A\. SAM2 model approval workflow/)
assert.match(roadmap, /35B\. SAM2 download\/load/)
assert.match(roadmap, /38A\. FILM\/slow-motion model approval workflow/)
assert.doesNotMatch(roadmap, /35A\.[^\n|]*FILM/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'sam2_report_builds',
    'model_evidence_exists',
    'license_review_exists',
    'required_blocker_risks',
    'future_sequence_35b_35c_35d_35e',
    'sam2_execution_gates_false',
    'command_plans_text_only_blocked',
    'phase35b_blocked_with_reason',
    'package_scripts',
  ],
}))
