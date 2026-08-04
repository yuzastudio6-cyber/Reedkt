import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'

import { ApiError } from '../../errors/api-error'
import {
  reconcileMotionStudioSpeechSyntheticC3,
  type MotionStudioSpeechSyntheticC3ReconciliationV1,
} from './synthetic-c3-reconciliation'
import {
  compileMotionStudioSpeechSyntheticListeningReview,
  createMotionStudioSpeechSyntheticListeningPlaybackEvent,
  persistMotionStudioSpeechSyntheticListeningReview,
  prepareMotionStudioSpeechSyntheticListeningReview,
  type MotionStudioSpeechSyntheticListeningGate,
  type MotionStudioSpeechSyntheticListeningPlaybackEventV1,
  type MotionStudioSpeechSyntheticListeningReviewV1,
} from './synthetic-listening-review'

const MODE = process.argv[2] ?? 'verify'
const MAXIMUM_PLAYER_BYTES = 4 * 1024 * 1024
const MAXIMUM_PLAYER_STDERR_BYTES = 64 * 1024
const PLAYER_TIMEOUT_MILLISECONDS = 60_000

const GATE_PROMPTS: Readonly<Record<MotionStudioSpeechSyntheticListeningGate, string>> = Object.freeze({
  meaning_fidelity: 'Does the spoken performance preserve the displayed sentence and intended meaning?',
  pronunciation: 'Are every word and phrase understandable, correctly pronounced, and free of distracting speech artifacts?',
  voice_continuity: 'Does this single candidate keep a stable voice, pace, and performance throughout? This does not prove cross-scene continuity.',
  loudness: 'Is the narration comfortably audible and dynamically controlled without obvious pumping, clipping, or distracting level shifts?',
})

async function main(): Promise<void> {
  if (!['verify', 'review'].includes(MODE) || process.argv.length > 3) {
    throw invalid('Usage: tsx synthetic-listening-review-cli.ts [verify|review]')
  }
  const preparation = await prepareMotionStudioSpeechSyntheticListeningReview({
    repositoryRoot: process.cwd(),
  })
  if (MODE === 'verify') {
    process.stdout.write(`${JSON.stringify(safeStatus(preparation), null, 2)}\n`)
    return
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw blocked('Human listening review requires an interactive local terminal.')
  }
  if (preparation.existingReview) {
    const reconciliation = await reconcileMotionStudioSpeechSyntheticC3({ preparation })
    process.stdout.write(`${JSON.stringify({
      ...safeStatus(preparation),
      syntheticC3Reconciliation: safeC3Receipt(reconciliation),
    }, null, 2)}\n`)
    return
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  const playbackEvents: MotionStudioSpeechSyntheticListeningPlaybackEventV1[] = []
  try {
    process.stdout.write('\nMotion Studio private synthetic narration review\n')
    process.stdout.write('This review cannot select a take, mutate a timeline, approve MS-012C, or enable production.\n\n')
    process.stdout.write(`Expected sentence:\n${preparation.syntheticText}\n\n`)
    while (playbackEvents.length === 0) {
      const action = (await terminal.question('Type PLAY to hear the complete private candidate, or QUIT to stop: ')).trim().toUpperCase()
      if (action === 'QUIT') return
      if (action !== 'PLAY') continue
      playbackEvents.push(await playCandidate(preparation, 1))
      process.stdout.write('Private playback completed and its executable/audio digests were reverified.\n')
    }
    while (playbackEvents.length < 3) {
      const replay = (await terminal.question('Replay before recording the review? [yes/no]: ')).trim().toLowerCase()
      if (replay === 'no' || replay === 'n') break
      if (replay !== 'yes' && replay !== 'y') continue
      playbackEvents.push(await playCandidate(preparation, playbackEvents.length + 1))
      process.stdout.write('Private playback completed and verified.\n')
    }
    const reviewerActorId = await promptStableReviewerId(terminal)
    const results: MotionStudioSpeechSyntheticListeningReviewV1['review']['results'][number][] = []
    for (const gate of Object.keys(GATE_PROMPTS) as MotionStudioSpeechSyntheticListeningGate[]) {
      process.stdout.write(`\n${GATE_PROMPTS[gate]}\n`)
      const result = await promptPassFail(terminal)
      const note = await promptBoundedNote(terminal)
      results.push({ gate, result, note })
    }
    const attestation = (await terminal.question(
      '\nType I LISTENED to attest that you personally heard the entire candidate and authored these results: ',
    )).trim()
    if (attestation !== 'I LISTENED') {
      throw blocked('Human listening attestation was not accepted. No review was persisted.')
    }
    const reviewedAt = new Date().toISOString()
    const record = compileMotionStudioSpeechSyntheticListeningReview({
      preparation,
      reviewerActorId,
      playbackEvents,
      results,
      reviewedAt,
      humanAttestationAccepted: true,
    })
    const persisted = await persistMotionStudioSpeechSyntheticListeningReview({ preparation, record })
    const refreshedPreparation = await prepareMotionStudioSpeechSyntheticListeningReview({
      repositoryRoot: process.cwd(),
    })
    const reconciliation = await reconcileMotionStudioSpeechSyntheticC3({
      preparation: refreshedPreparation,
    })
    process.stdout.write(`${JSON.stringify({
      review: safeReviewReceipt(persisted),
      syntheticC3Reconciliation: safeC3Receipt(reconciliation),
    }, null, 2)}\n`)
  } finally {
    terminal.close()
  }
}

async function playCandidate(
  preparation: Awaited<ReturnType<typeof prepareMotionStudioSpeechSyntheticListeningReview>>,
  sequence: number,
): Promise<MotionStudioSpeechSyntheticListeningPlaybackEventV1> {
  const [playerBefore, audioBefore] = await Promise.all([
    hashRegularFile(preparation.playerExecutablePath, MAXIMUM_PLAYER_BYTES, false),
    hashRegularFile(
      preparation.privateAudioPath,
      preparation.reconciliation.normalizedArtifact.byteLength,
      true,
    ),
  ])
  if (
    playerBefore !== preparation.playerExecutableSha256 ||
    audioBefore !== preparation.reconciliation.normalizedArtifact.sha256
  ) throw blocked('Private player or narration bytes changed before playback.')
  const startedAt = new Date().toISOString()
  await spawnFixedPlayer(preparation.playerExecutablePath, preparation.privateAudioPath)
  const completedAt = new Date().toISOString()
  const [playerAfter, audioAfter] = await Promise.all([
    hashRegularFile(preparation.playerExecutablePath, MAXIMUM_PLAYER_BYTES, false),
    hashRegularFile(
      preparation.privateAudioPath,
      preparation.reconciliation.normalizedArtifact.byteLength,
      true,
    ),
  ])
  if (playerAfter !== playerBefore || audioAfter !== audioBefore) {
    throw blocked('Private player or narration bytes changed during playback.')
  }
  return createMotionStudioSpeechSyntheticListeningPlaybackEvent({
    sequence,
    playerExecutableSha256: playerAfter,
    normalizedAudioSha256: audioAfter,
    startedAt,
    completedAt,
  })
}

function spawnFixedPlayer(executable: string, privateAudioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [privateAudioPath], {
      env: {},
      shell: false,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    const stderr: Buffer[] = []
    let stderrBytes = 0
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(blocked('Private narration playback exceeded its fixed timeout.'))
    }, PLAYER_TIMEOUT_MILLISECONDS)
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > MAXIMUM_PLAYER_STDERR_BYTES) child.kill('SIGKILL')
      else stderr.push(chunk)
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (stderrBytes > MAXIMUM_PLAYER_STDERR_BYTES) {
        reject(blocked('Private narration player diagnostics exceeded their fixed bound.'))
        return
      }
      if (code !== 0) {
        const detail = Buffer.concat(stderr).toString('utf8').replace(/[\r\n\t]+/gu, ' ').trim().slice(0, 180)
        reject(blocked(detail ? `Private narration playback failed: ${detail}` : 'Private narration playback failed.'))
        return
      }
      resolve()
    })
  })
}

async function hashRegularFile(path: string, expectedMaximumBytes: number, privateFile: boolean): Promise<string> {
  const stat = await lstat(path).catch(() => undefined)
  if (
    !stat?.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > expectedMaximumBytes ||
    (privateFile && (stat.mode & 0o777) !== 0o600)
  ) throw blocked('Private listening review file authority is invalid.')
  const bytes = await readFile(path)
  if (bytes.byteLength !== stat.size) throw blocked('Private listening review file changed during verification.')
  return createHash('sha256').update(bytes).digest('hex')
}

async function promptStableReviewerId(terminal: ReturnType<typeof createInterface>): Promise<string> {
  while (true) {
    const value = (await terminal.question('Reviewer actor ID (letters, numbers, dot, dash, colon, underscore): ')).trim()
    if (/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)) return value
    process.stdout.write('Enter a stable non-secret reviewer ID.\n')
  }
}

async function promptPassFail(terminal: ReturnType<typeof createInterface>): Promise<'passed' | 'failed'> {
  while (true) {
    const value = (await terminal.question('Result [pass/fail]: ')).trim().toLowerCase()
    if (value === 'pass') return 'passed'
    if (value === 'fail') return 'failed'
  }
}

async function promptBoundedNote(terminal: ReturnType<typeof createInterface>): Promise<string> {
  while (true) {
    const value = (await terminal.question('Short evidence note (4-500 characters, no links or paths): ')).trim()
    if (
      value.length >= 4 && value.length <= 500 &&
      !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(value) &&
      ![...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    ) return value
  }
}

function safeStatus(
  preparation: Awaited<ReturnType<typeof prepareMotionStudioSpeechSyntheticListeningReview>>,
) {
  return {
    schemaVersion: 'motion-studio.speech-synthetic-listening-review-status.v1',
    state: preparation.existingReview ? 'review_complete' : 'ready_for_private_human_listening',
    expectedText: preparation.syntheticText,
    durationMilliseconds: preparation.reconciliation.normalizedArtifact.durationMilliseconds,
    normalizedAudioSha256: preparation.reconciliation.normalizedArtifact.sha256,
    independentTranscriptResultDigest: preparation.independentTranscriptResultDigest,
    browserProjectionAllowed: false,
    fixedLocalPlayerVerified: true,
    existingReview: preparation.existingReview ? safeReviewReceipt(preparation.existingReview) : null,
    selectionCreated: false,
    timelineMutationPerformed: false,
    ms012cAccepted: false,
    productReady: false,
  }
}

function safeReviewReceipt(record: MotionStudioSpeechSyntheticListeningReviewV1) {
  return {
    schemaVersion: 'motion-studio.speech-synthetic-listening-review-receipt.v1',
    state: record.state,
    decision: record.review.decision,
    playbackCount: record.playback.playbackCount,
    gateResults: record.review.results.map(({ gate, result }) => ({ gate, result })),
    reviewedAt: record.review.reviewedAt,
    recordDigest: record.recordDigest,
    browserProjectionAllowed: false,
    selectionCreated: false,
    timelineMutationPerformed: false,
    localComputeCostReconciled: false,
    ms012cAccepted: false,
    productReady: false,
  }
}

function safeC3Receipt(record: MotionStudioSpeechSyntheticC3ReconciliationV1) {
  return {
    schemaVersion: 'motion-studio.speech-synthetic-c3-reconciliation-receipt.v1',
    state: record.state,
    candidateHumanQaPassed: record.effectiveQa.candidateHumanQaPassed,
    passedGateCount: record.effectiveQa.passedCount,
    failedGateCount: record.effectiveQa.failedCount,
    openProductionGateCount: record.effectiveQa.notEvaluatedCount,
    recordDigest: record.recordDigest,
    localComputeCostReconciled: false,
    eligibleForExplicitSelection: false,
    timelineMutationPerformed: false,
    ms012cAccepted: false,
    productReady: false,
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_synthetic_human_listening_review',
  })
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Synthetic listening review failed.'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
