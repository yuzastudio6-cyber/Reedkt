import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  buildFilmSlowMotionReviewReport,
  renderFilmSlowMotionReviewReportMarkdown,
} from '../activation/film-slowmotion-review'

const report = buildFilmSlowMotionReviewReport()
const markdown = renderFilmSlowMotionReviewReportMarkdown(report)

assert.equal(report.phase, '34E', 'Phase 34E report must build.')
assert.equal(report.status, 'review_complete', 'Phase 34E review must complete as a static report.')
assert.equal(report.policy.filmDownloadAllowed, false, 'FILM download must remain blocked.')
assert.equal(report.policy.filmRuntimeAllowed, false, 'FILM runtime must remain blocked.')
assert.equal(report.policy.slowMotionAllowed, false, 'Slow motion must remain blocked.')
assert.equal(report.policy.slowMotionExecutionAllowed, false, 'Slow-motion execution must remain blocked.')
assert.equal(report.policy.fullVideoInterpolationAllowed, false, 'Full-video interpolation must remain blocked.')
assert.equal(report.policy.productionReadyAllowed, false, 'Production readiness must remain blocked.')
assert.equal(report.policy.externalBetaAllowed, false, 'External beta must remain blocked.')
assert.equal(report.policy.broadRealUserMediaAllowed, false, 'Broad real user media must remain blocked.')
assert.equal(report.policy.providersAllowed, false, 'Provider calls must remain blocked.')
assert.equal(report.policy.revideoAllowed, false, 'Revideo must remain blocked.')
assert.equal(report.modelEvidence.downloadAllowed, false, 'Model evidence must block downloads.')
assert.equal(report.modelEvidence.runtimeAllowed, false, 'Model evidence must block runtime.')
assert.equal(report.modelEvidence.filmApproved, false, 'FILM must not be approved.')
assert.equal(report.modelEvidence.checkpointApproved, false, 'FILM checkpoint must not be approved.')
assert.equal(report.futureBoundedTestScope.filmDownloadAllowed, false, 'Future test scope must keep download blocked.')
assert.equal(report.futureBoundedTestScope.filmRuntimeAllowed, false, 'Future test scope must keep runtime blocked.')
assert.equal(report.futureBoundedTestScope.slowMotionExecutionAllowed, false, 'Future test scope must keep execution blocked.')
assert.equal(report.futureBoundedTestScope.fullVideoInterpolationAllowed, false, 'Future test scope must block full-video interpolation.')
assert.equal(report.futureBoundedTestScope.productionReadyAllowed, false, 'Future test scope must block production.')
assert.equal(report.futureBoundedTestScope.externalBetaAllowed, false, 'Future test scope must block external beta.')
assert.equal(report.futureBoundedTestScope.broadRealUserMediaAllowed, false, 'Future test scope must block broad real media.')
assert.ok(report.riskRegister.filter((risk) => risk.severity === 'blocker').length >= 12, 'Risk register must include required blocking risks.')
assert.ok(report.riskRegister.some((risk) => risk.riskId === 'film_hand_face_body_warping'), 'Risk register must include subject warping.')
assert.ok(report.riskRegister.some((risk) => risk.riskId === 'film_ghosting_double_exposure'), 'Risk register must include ghosting.')
assert.ok(report.riskRegister.some((risk) => risk.severity === 'warning'), 'Risk register must include warning-only future risks.')

for (const commandPlan of report.commandPlans) {
  assert.equal(commandPlan.requiresHumanApproval, true, `${commandPlan.planId} must require human approval.`)
  assert.equal(commandPlan.textOnlyByDefault, true, `${commandPlan.planId} must be text-only by default.`)
  assert.equal(commandPlan.allowedInPhase34E, false, `${commandPlan.planId} must be blocked in Phase 34E.`)
  assert.equal(commandPlan.executableCommand, null, `${commandPlan.planId} must not contain an executable command.`)
  assert.ok(commandPlan.blockedReason.length > 0, `${commandPlan.planId} must explain why it is blocked.`)
}

const serializedPlans = JSON.stringify(report.commandPlans).toLowerCase()
const forbiddenExecutablePatterns = [
  /\bdocker\s+build\b/,
  /\bdocker\s+push\b/,
  /\bgcloud\s+run\s+deploy\b/,
  /\bgcloud\s+run\s+jobs\s+execute\b/,
  /\bcurl\b.*\bhttp/,
  /\bwget\b/,
  /\bgsutil\s+cp\b/,
  /\ballusers\b/,
  /\ballauthenticatedusers\b/,
  /\bproviderapikey\b/,
  /\bsecretvalue\b/,
  /\bapi[_-]?key\b/,
  /\brevideo\b.*\bexecute\b/,
]

for (const pattern of forbiddenExecutablePatterns) {
  assert.equal(pattern.test(serializedPlans), false, `Future command plans must not contain executable forbidden pattern ${pattern}.`)
}

assert.ok(markdown.includes('No model download'), 'Markdown report must state no model download occurred.')
assert.ok(markdown.includes('full-video interpolation'), 'Markdown report must state full-video interpolation remains blocked.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  scripts?: Record<string, string>
}

assert.equal(packageJson.scripts?.['activation:film-slowmotion-review:plan'], 'tsx server/cli/activation-film-slowmotion-review-plan.ts', 'Plan package script must exist.')
assert.equal(packageJson.scripts?.['activation:film-slowmotion-review:report'], 'tsx server/cli/activation-film-slowmotion-review-report.ts', 'Report package script must exist.')
assert.equal(packageJson.scripts?.['smoke:activation-film-slowmotion-review'], 'tsx server/smoke/activation-film-slowmotion-review-smoke.ts', 'Smoke package script must exist.')
assert.equal(report.packageLockChangeRequired, false, 'package-lock.json is not required to change.')

console.log('activation-film-slowmotion-review-smoke passed')
