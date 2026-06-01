import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  audioAiApprovalCommandPlans,
  audioAiFutureScope,
  audioAiLicenseReviews,
  audioAiRiskRegister,
  audioAiToolEvidence,
  buildAudioAiApprovalReport,
} from '../activation/audio-ai-approval'

const report = buildAudioAiApprovalReport()

assert.equal(report.phase, '36A')
assert.equal(report.status, 'blocked_missing_artifact_evidence')
assert.equal(report.approvalDecision, 'blocked_missing_artifact_evidence')
assert.equal(report.futureScope.audioAiPlanningRecommendation, 'deepfilternet_first')
assert.equal(report.evidenceReview.currentState, 'approval_review_only')
assert.equal(report.evidenceReview.noModelWeightsDownloaded, true)
assert.equal(report.evidenceReview.noRuntimeExecuted, true)
assert.equal(report.evidenceReview.noAudioProcessed, true)
assert.equal(report.evidenceReview.provenAudioBaseline.phase, '31')
assert.equal(report.evidenceReview.provenAudioBaseline.runId, 'phase31-20260528T13060')

assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'deepfilternet' && tool.currentStatus === 'planning_recommended'))
assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'rnnoise' && tool.currentStatus === 'fallback_planning_only'))
assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'demucs' && tool.currentStatus === 'restricted_deferred'))
assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'deepfilternet' && tool.licenseName === 'MIT OR Apache-2.0'))
assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'rnnoise' && tool.licenseName === 'BSD-3-Clause'))
assert.ok(audioAiToolEvidence.some((tool) => tool.toolId === 'demucs' && tool.licenseName.includes('pretrained model terms require review')))

assert.ok(audioAiLicenseReviews.some((review) => review.toolId === 'deepfilternet' && review.licenseIdentified))
assert.ok(audioAiLicenseReviews.some((review) => review.toolId === 'rnnoise' && review.licenseIdentified))
assert.ok(audioAiLicenseReviews.some((review) => review.toolId === 'demucs' && review.codexReviewDecision === 'blocked_license_provenance'))

for (const riskId of [
  'license-provenance-incomplete',
  'model-checksum-unavailable',
  'runtime-model-download-risk',
  'dependency-license-risk',
  'speech-intelligibility-degradation',
  'musical-noise-robotic-artifacts',
  'ambience-over-suppression',
  'lip-audio-mismatch',
  'loudness-true-peak-regression',
  'stereo-channel-issues',
  'demucs-leakage-balance-risk',
  'compute-cost-risk',
  'broad-real-media-safety-risk',
  'no-controlled-real-video-ai-audio-qa',
]) {
  assert.ok(audioAiRiskRegister.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `${riskId} blocker risk must exist.`)
}

assert.deepEqual(audioAiFutureScope.phaseSequence.map((phase) => phase.phase), ['36B', '36C', '36D', '36E'])
assert.equal(report.futureScope.deepFilterNetPlanningAllowed, true)
assert.equal(report.futureScope.rnnoiseFallbackPlanningAllowed, true)
assert.equal(report.futureScope.demucsRestrictedPlanningAllowed, true)
assert.equal(report.audioAiDownloadAllowed, false)
assert.equal(report.audioAiRuntimeAllowed, false)
assert.equal(report.realVideoAudioAiCleanupAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)

assert.equal(report.phase36BReadiness.ready, false)
assert.equal(report.phase36BReadiness.nextPhase, 'Phase 36B audio AI download/load')
assert.equal(report.phase36BReadiness.status, 'blocked_missing_artifact_evidence')
assert.ok(report.phase36BReadiness.blockers.length > 0)

const disallowedExecutablePattern = /docker\s+(build|push)|gcloud\s+.*(deploy|execute|jobs)|gsutil\s+|gcloud\s+storage\s+cp|curl\s+|wget\s+|huggingface-cli|snapshot_download|provider|allUsers|allAuthenticatedUsers|Revideo production|ffmpeg\s+/i
for (const commandPlan of audioAiApprovalCommandPlans) {
  assert.equal(commandPlan.requiresHumanApproval, true)
  assert.equal(commandPlan.textOnlyByDefault, true)
  assert.equal(commandPlan.allowedInPhase36A, false)
  assert.equal(commandPlan.executableCommand, null)
  assert.ok(commandPlan.blockedReason)
  assert.ok(commandPlan.commandText.startsWith('TEXT_ONLY'))
  assert.doesNotMatch(commandPlan.commandText, disallowedExecutablePattern)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:audio-ai-approval:plan'], 'tsx server/cli/activation-audio-ai-approval-plan.ts')
assert.equal(packageJson.scripts['activation:audio-ai-approval:report'], 'tsx server/cli/activation-audio-ai-approval-report.ts')
assert.equal(packageJson.scripts['activation:audio-ai-tool:summary'], 'tsx server/cli/activation-audio-ai-tool-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-audio-ai-approval-workflow'], 'tsx server/smoke/activation-audio-ai-approval-workflow-smoke.ts')

const scriptText = [
  packageJson.scripts['activation:audio-ai-approval:plan'],
  packageJson.scripts['activation:audio-ai-approval:report'],
  packageJson.scripts['activation:audio-ai-tool:summary'],
  packageJson.scripts['smoke:activation-audio-ai-approval-workflow'],
].join('\n')
assert.doesNotMatch(scriptText, /docker|gcloud|curl|wget|huggingface-cli|snapshot_download|provider/i)

const roadmap = readFileSync(new URL('../../docs/activation-phase-roadmap.md', import.meta.url), 'utf8')
assert.match(roadmap, /35F\. SAM2 private feature E2E beta-readiness gate/)
assert.match(roadmap, /36A\. Audio AI approval workflow/)
assert.match(roadmap, /36B\. First approved audio AI download\/load/)
assert.match(roadmap, /38A\. FILM\/slow-motion model approval workflow/)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'audio_ai_report_builds',
    'tool_evidence_exists',
    'license_reviews_exist',
    'required_blocker_risks',
    'future_sequence_36b_36c_36d_36e',
    'audio_ai_execution_gates_false',
    'command_plans_text_only_blocked',
    'phase36b_blocked_missing_artifact_evidence',
    'package_scripts',
  ],
}))
