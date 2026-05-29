import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealEsrganPolicyDecisionReport,
  phase34DRealEsrganEvidence,
  realEsrganNextSampleScope,
  realEsrganPolicyCommandPlans,
  realEsrganPolicyRiskRegister,
} from '../activation/real-esrgan-policy-decision'

const report = buildRealEsrganPolicyDecisionReport()

assert.equal(report.phase, '34E')
assert.equal(report.status, 'policy_complete / broader_execution_blocked')
assert.equal(report.phase34DEvidence.phase34DRunId, 'phase34d-20260528T20300')
assert.equal(report.phase34DEvidence.sourcePhase33DRunId, 'phase33d-20260528T161056')
assert.equal(report.phase34DEvidence.sourceFrameDimensions.width, 2160)
assert.equal(report.phase34DEvidence.sourceFrameDimensions.height, 3840)
assert.equal(report.phase34DEvidence.sampleCrop.x, 824)
assert.equal(report.phase34DEvidence.sampleCrop.y, 1664)
assert.equal(report.phase34DEvidence.sampleCrop.width, 512)
assert.equal(report.phase34DEvidence.sampleCrop.height, 512)
assert.equal(report.phase34DEvidence.enhancedSample.width, 2048)
assert.equal(report.phase34DEvidence.enhancedSample.height, 2048)
assert.equal(report.phase34DEvidence.model.name, 'RealESRGAN_x4plus')
assert.equal(report.phase34DEvidence.model.manifestId, 'real_esrgan_x4plus_staging_v1')
assert.equal(report.phase34DEvidence.model.modelFileSha256, '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1')
assert.equal(report.phase34DEvidence.model.aggregateSha256, '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5')
assert.equal(report.phase34DEvidence.runtime.pinnedLinuxAmd64Digest, 'sha256:80a032a299a3b4c5b8a6e2f3622668a22ab651d568c29d31aa9c884b04b231e2')

assert.equal(phase34DRealEsrganEvidence.safetyConfirmations.exactlyOneBoundedSample, true)
assert.equal(report.phase34DEvidence.safetyConfirmations.fullFrameEnhanced, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.fullVideoEnhanced, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.filmUsed, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.slowMotionUsed, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.providerExecuted, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.publicAccessEnabled, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.modelDownloadedExternally, false)
assert.equal(report.phase34DEvidence.safetyConfirmations.gfpganFaceEnhanceRan, false)

assert.equal(report.humanVisualReview.humanVisualReviewRequired, true)
assert.equal(report.humanVisualReview.humanVisualReviewCompleted, false)
assert.equal(report.humanVisualReview.humanApprovalForFullFrame, false)
assert.equal(report.humanVisualReview.humanApprovalForFullVideo, false)

assert.equal(report.realEsrganFullFrameAllowed, false)
assert.equal(report.realEsrganFullVideoAllowed, false)
assert.equal(report.blindFullVideoEnhancementAllowed, false)
assert.equal(realEsrganNextSampleScope.realEsrganAdditionalBoundedSamplePlanningAllowed, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.publicAccessAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.phase35AReadiness.nextPhase, 'Phase 35A SAM2 model approval workflow')

assert.ok(realEsrganPolicyRiskRegister.some((risk) => risk.riskId === 'one-crop-only-evidence' && risk.severity === 'blocker'))
assert.ok(realEsrganPolicyRiskRegister.some((risk) => risk.riskId === 'no-human-visual-approval-yet' && risk.severity === 'blocker'))
assert.ok(realEsrganPolicyRiskRegister.some((risk) => risk.riskId === 'future-sample-selection-bias' && risk.severity === 'warning'))

for (const commandPlan of realEsrganPolicyCommandPlans) {
  assert.equal(commandPlan.textOnlyByDefault, true)
  assert.ok(commandPlan.commandString.startsWith('TEXT_ONLY'))
  assert.doesNotMatch(commandPlan.commandString, /docker\s+(build|push)|gcloud\s+.*(deploy|execute|jobs)|curl\s+|wget\s+|huggingface-cli|snapshot_download|allUsers|allAuthenticatedUsers|Revideo production/i)
  if (commandPlan.allowedInPhase34E === false) {
    assert.ok(commandPlan.blockedReason)
  }
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:real-esrgan-policy-decision'], 'tsx server/cli/activation-real-esrgan-policy-decision.ts')
assert.equal(packageJson.scripts['activation:real-esrgan-policy-decision:report'], 'tsx server/cli/activation-real-esrgan-policy-decision-report.ts')
assert.equal(packageJson.scripts['smoke:activation-real-esrgan-policy-decision'], 'tsx server/smoke/activation-real-esrgan-policy-decision-smoke.ts')

const roadmap = readFileSync(new URL('../../docs/activation-phase-roadmap.md', import.meta.url), 'utf8')
assert.match(roadmap, /34E\. Real-ESRGAN broader-scope policy decision/)
assert.match(roadmap, /35A\. SAM2 model approval workflow/)
assert.match(roadmap, /38A\. FILM\/slow-motion model approval workflow/)
assert.doesNotMatch(roadmap, /34E\.[^\n|]*FILM/i)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase34d_evidence_present',
    'exactly_one_bounded_sample',
    'full_frame_and_full_video_blocked',
    'human_visual_review_required',
    'additional_bounded_sample_planning_only',
    'film_not_phase34e',
    'slow_motion_blocked',
    'production_beta_broad_media_blocked',
    'phase35a_sam2_next',
    'safe_text_only_command_plans',
    'package_scripts',
  ],
}))
