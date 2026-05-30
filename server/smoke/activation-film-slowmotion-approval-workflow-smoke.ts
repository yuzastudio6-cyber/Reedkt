import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildFilmSlowmotionApprovalReport,
  filmFutureScope,
  filmLicenseReview,
  filmModelEvidence,
  filmRiskRegister,
  filmSlowmotionCommandPlans,
} from '../activation/film-slowmotion-approval'

const report = buildFilmSlowmotionApprovalReport()

assert.equal(report.phase, '38A')
assert.equal(report.track, 'A visual/video')
assert.equal(report.status, 'approval_review_complete')
assert.equal(report.stagingPlanningDecision, 'staging_planning_approved')
assert.equal(report.modelEvidence.toolFamily, 'FILM / frame interpolation / slow motion')
assert.equal(report.modelEvidence.noWeightsDownloaded, true)
assert.equal(report.modelEvidence.noRuntimeExecuted, true)
assert.equal(report.modelEvidence.noMediaProcessed, true)
assert.equal(report.modelEvidence.repoArchivedReadOnly, true)
assert.ok(filmModelEvidence.sourceEvidence.some((evidence) => evidence.evidenceId === 'film-official-github-repo'))
assert.ok(filmModelEvidence.sourceEvidence.some((evidence) => evidence.evidenceId === 'film-apache-2-license'))
assert.ok(filmModelEvidence.sourceEvidence.some((evidence) => evidence.evidenceId === 'film-readme-pretrained-tf2-saved-models'))
assert.ok(filmModelEvidence.checkpointCandidates.some((candidate) => candidate.modelPath === 'film_net/Style/saved_model'))

assert.equal(filmLicenseReview.licenseIdentified, true)
assert.equal(filmLicenseReview.licenseName, 'Apache-2.0')
assert.equal(filmLicenseReview.commercialUseAllowed, true)
assert.equal(filmLicenseReview.redistributionAllowed, true)
assert.equal(filmLicenseReview.checkpointUseAllowed, true)
assert.equal(filmLicenseReview.requiresHumanLegalReview, false)
assert.equal(filmLicenseReview.codexDecision, 'staging_planning_approved')

for (const riskId of [
  'license-provenance-incomplete',
  'checkpoint-checksum-unavailable',
  'runtime-model-download-risk',
  'dependency-license-risk',
  'motion-hallucination',
  'hand-face-body-warping',
  'ghosting-double-exposure',
  'flicker-temporal-inconsistency',
  'text-logo-distortion',
  'motion-boundary-artifacts',
  'audio-video-sync-drift',
  'frame-count-duration-mismatch',
  'compute-gpu-cost-risk',
  'synthetic-frame-disclosure-risk',
  'no-generated-frame-runtime-qa',
  'no-controlled-real-video-slowmotion-qa',
  'broad-real-media-safety-risk',
]) {
  assert.ok(filmRiskRegister.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `${riskId} blocker risk must exist.`)
}

assert.deepEqual(filmFutureScope.phaseSequence.map((phase) => phase.phase), ['38B', '38C', '38D', '38E'])
assert.equal(report.filmPlanningAllowed, true)
assert.equal(report.filmDownloadAllowed, false)
assert.equal(report.filmRuntimeAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.realVideoSlowMotionAllowed, false)
assert.equal(report.fullVideoInterpolationAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.phase38BReadiness.ready, true)
assert.equal(report.phase38BReadiness.nextPhase, 'Phase 38B FILM download/load')
assert.ok(report.phase38BReadiness.reason.includes('download/load planning'))

const disallowedExecutablePattern = /docker\s+(build|push)|gcloud\s+.*(deploy|execute|jobs)|gsutil\s+|gcloud\s+storage\s+cp|curl\s+|wget\s+|provider|allUsers|allAuthenticatedUsers|revideo|film\s+|python\s+-m\s+eval|ffmpeg\s+/i
for (const commandPlan of filmSlowmotionCommandPlans) {
  assert.equal(commandPlan.textOnlyByDefault, true)
  assert.equal(commandPlan.allowedInPhase38A, false)
  assert.equal(commandPlan.executableCommand, null)
  assert.ok(commandPlan.blockedReason)
  assert.ok(commandPlan.commandText.startsWith('TEXT_ONLY'))
  assert.doesNotMatch(commandPlan.commandText, disallowedExecutablePattern)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:film-slowmotion-approval:plan'], 'tsx server/cli/activation-film-slowmotion-approval-plan.ts')
assert.equal(packageJson.scripts['activation:film-slowmotion-approval:report'], 'tsx server/cli/activation-film-slowmotion-approval-report.ts')
assert.equal(packageJson.scripts['activation:film-tool:summary'], 'tsx server/cli/activation-film-tool-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-film-slowmotion-approval-workflow'], 'tsx server/smoke/activation-film-slowmotion-approval-workflow-smoke.ts')

const scriptText = [
  packageJson.scripts['activation:film-slowmotion-approval:plan'],
  packageJson.scripts['activation:film-slowmotion-approval:report'],
  packageJson.scripts['activation:film-tool:summary'],
  packageJson.scripts['smoke:activation-film-slowmotion-approval-workflow'],
].join('\n')
assert.doesNotMatch(scriptText, /docker|gcloud|curl|wget|provider|revideo/i)

const roadmap = readFileSync(new URL('../../docs/activation-phase-roadmap.md', import.meta.url), 'utf8')
assert.match(roadmap, /38A\. FILM\/slow-motion approval workflow/)
assert.match(roadmap, /38B\. FILM download\/load/)
assert.match(roadmap, /38C\. FILM generated-frame runtime verification/)
assert.match(roadmap, /38D\. Controlled selected real-video slow-motion sample/)
assert.match(roadmap, /38E\. FILM private feature E2E readiness gate/)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'film_report_builds',
    'film_evidence_exists',
    'license_review_exists',
    'required_blocker_risks',
    'future_sequence_38b_38c_38d_38e',
    'film_execution_gates_false',
    'command_plans_text_only_blocked',
    'phase38b_ready_with_limited_reason',
    'package_scripts',
  ],
}))
