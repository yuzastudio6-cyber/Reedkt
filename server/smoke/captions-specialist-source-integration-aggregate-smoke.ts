import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
  parseCaptionCurrentJobReadinessLedgerV2,
} from '../captions-specialist/caption-current-job-readiness'

const sourceOnlyScripts = [
  'smoke:captions-specialist-cap-20-aggregate',
  'smoke:captions-specialist-cap-14-real-source',
  'smoke:captions-specialist-goal-completion-audit',
  'smoke:captions-specialist-integration-routing',
  'smoke:captions-specialist-shared-owner-integration',
  'smoke:captions-specialist-multi-support-resume',
  'smoke:captions-specialist-broll-owner-read-adapter',
  'smoke:captions-specialist-canonical-resume-read',
  'smoke:captions-specialist-canonical-transcript-authenticated-read',
  'smoke:captions-specialist-visual-intelligence-spatial-adapter',
  'smoke:captions-specialist-canonical-track-all-evidence-read',
  'smoke:captions-specialist-current-integration-readiness',
  'smoke:captions-specialist-current-job-readiness',
  'smoke:captions-specialist-terminal-qualification',
  'smoke:canonical-caption-specialist-planning',
  'smoke:canonical-caption-specialist-execution',
  'smoke:canonical-specialist-support-resume',
  'smoke:canonical-caption-transcript-support',
  'smoke:canonical-caption-reviewed-transcript-correction',
  'smoke:canonical-caption-reviewed-transcript-correction-owner',
  'smoke:canonical-caption-visual-intelligence-support',
  'smoke:canonical-caption-track-all-support',
  'smoke:canonical-caption-soundsync-support',
  'smoke:canonical-caption-broll-support',
  'smoke:canonical-sound-caption-owner',
  'smoke:canonical-caption-shared-owner-composition',
  'smoke:canonical-caption-postrender-visual-qa-authenticated-read',
  'smoke:canonical-caption-terminal-qualification',
] as const

const results = sourceOnlyScripts.map((script) => {
  const result = spawnSync('npm', ['run', script], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  })
  assert.equal(result.error, undefined, `${script} failed to start.`)
  assert.equal(result.signal, null,
    `${script} was terminated by ${result.signal}.`)
  assert.equal(result.status, 0,
    `${script} failed.\n${result.stdout}\n${result.stderr}`)
  assert.equal(result.stderr.length, 0, `${script} wrote to stderr.`)
  return {
    script,
    status: 'passed' as const,
    stdoutBytes: Buffer.byteLength(result.stdout, 'utf8'),
  }
})

assert.equal(results.length, sourceOnlyScripts.length)
assert.ok(results.every((result) => result.status === 'passed'))
const current = parseCaptionCurrentJobReadinessLedgerV2(
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2)

console.log(JSON.stringify({
  smoke: 'captions_specialist_source_integration_aggregate',
  status: 'passed',
  sourceSuites: results.length,
  historicalMilestonesCovered: 20,
  currentCaptionJobImplementations:
    current.counts.captionOwnedImplementationsComplete,
  sourcePathsReadyForPrivateEvidenceRun:
    current.counts.sourcePathsReadyForPrivateEvidenceRun,
  jobsWaitingOnCanonicalOwnerMount:
    current.counts.jobsWaitingOnCanonicalOwnerMount,
  canonicalOwnersPending: current.ownerMounts.filter((owner) =>
    !owner.canonicalCompositionMountImplemented).map((owner) => owner.ownerKey),
  terminalQualifiedJobsFromCurrentCanonicalRun:
    current.counts.terminalPrivateInternalQualifiedJobs,
  mediaRuntimeStarted: false,
  providerOrModelCallMade: false,
  dockerRuntimeStarted: false,
  currentTerminalStatusClaimed: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}, null, 2))
