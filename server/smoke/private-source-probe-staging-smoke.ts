import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  privateSourceProbeScopeHash,
  isPrivateSourceProbeTerminalIntegrityError,
  privateSourceProbeStageErrorWithCleanupFailure,
  stagePrivateSourceForProbe,
  type PrivateSourceProbeStageScope,
} from '../media/private-source-probe-staging'
import { privateSourceProbeAttemptRelativeDirectory } from '../media/private-source-probe-paths'
import { createPrivateDirectoryCreateOnlyWithinRoot } from '../security/private-local-persistence'

const root = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-probe-stage-'))
const outsideRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-probe-outside-'))
const bytes = Buffer.from('bounded private source probe bytes')
const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
const scope: PrivateSourceProbeStageScope = {
  ownerUserId: 'user-private-source-probe',
  workspaceId: 'workspace-private-source-probe',
  projectId: 'project-private-source-probe',
  uploadIntentId: 'upload-private-source-probe',
}

try {
  let streamOpenCount = 0
  const first = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: '../../unsafe source.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => {
      streamOpenCount += 1
      return Readable.from([bytes])
    },
  })

  assert.equal(streamOpenCount, 1, 'Source probe staging must open the storage stream exactly once.')
  assert.equal(first.byteLength, bytes.byteLength)
  assert.equal(first.checksumSha256, checksumSha256)
  assert.deepEqual(await readFile(first.inputPath), bytes, 'FFprobe staging must preserve exact source bytes.')
  assert.equal(path.basename(first.inputPath), 'unsafe-source.mp4', 'Staging must sanitize the source filename.')
  assert.equal(first.inputPath.includes(scope.workspaceId), false, 'Raw workspace identifiers must not appear in probe staging paths.')
  assert.equal(first.inputPath.includes(scope.uploadIntentId), false, 'Raw upload-intent identifiers must not appear in probe staging paths.')
  assert.equal(mode(await lstat(first.inputPath)), 0o600, 'Staged source bytes must use private file permissions.')

  const attemptDirectory = path.dirname(first.inputPath)
  const scopeDirectory = path.dirname(attemptDirectory)
  assert.equal(path.basename(scopeDirectory), privateSourceProbeScopeHash(scope))
  await assertPrivateDirectoryChain(root, attemptDirectory)

  const retry = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: '../../unsafe source.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => Readable.from([bytes]),
  })
  assert.notEqual(retry.inputPath, first.inputPath, 'A retry must use a distinct create-only attempt path.')
  assert.deepEqual(await readFile(first.inputPath), bytes, 'A retry must not replace an earlier staged attempt.')
  assert.deepEqual(await readFile(retry.inputPath), bytes)
  const retryCleanupFirst = retry.cleanup()
  const retryCleanupSecond = retry.cleanup()
  assert.strictEqual(retryCleanupFirst, retryCleanupSecond, 'Concurrent cleanup callers must share one removal promise.')
  await Promise.all([retryCleanupFirst, retryCleanupSecond])
  await retry.cleanup()
  assert.equal(await pathExists(retry.inputPath), false, 'Probe cleanup must be idempotent and remove retry bytes.')
  assert.equal(await pathExists(first.inputPath), true, 'Cleaning a retry must not remove an independent active attempt.')

  await first.cleanup()
  assert.equal(await pathExists(first.inputPath), false, 'Probe cleanup must remove staged source bytes.')
  assert.deepEqual(await readdir(scopeDirectory), [], 'Successful probe cleanup must leave no attempt directories.')

  const collidingAttemptId = '00000000-0000-4000-8000-000000000001'
  const replacementAttemptId = '00000000-0000-4000-8000-000000000002'
  const collidingRelativeDirectory = privateSourceProbeAttemptRelativeDirectory(
    privateSourceProbeScopeHash(scope),
    collidingAttemptId,
  )
  const collidingAttempt = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: root,
    relativePath: collidingRelativeDirectory,
  })
  const collidingSentinel = path.join(collidingAttempt.absolutePath, 'preexisting-sentinel.txt')
  await writeFile(collidingSentinel, 'preexisting-attempt-must-not-be-adopted')
  const attemptIds = [collidingAttemptId, replacementAttemptId]
  const collisionSafeStage = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: 'collision-safe.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => Readable.from([bytes]),
    attemptIdFactory: () => attemptIds.shift() ?? replacementAttemptId,
  })
  assert.equal(path.basename(path.dirname(collisionSafeStage.inputPath)), replacementAttemptId)
  assert.equal(await readFile(collidingSentinel, 'utf8'), 'preexisting-attempt-must-not-be-adopted')
  let collisionLimitStreamOpened = false
  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'collision-limit.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => {
        collisionLimitStreamOpened = true
        return Readable.from([bytes])
      },
      attemptIdFactory: () => collidingAttemptId,
    }),
    'source_probe_stage_attempt_collision_limit',
  )
  assert.equal(collisionLimitStreamOpened, false, 'Collision exhaustion must not open source media.')
  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'invalid-attempt-id.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => Readable.from([bytes]),
      attemptIdFactory: () => 'not-a-canonical-v4-uuid',
    }),
    'source_probe_stage_attempt_id_invalid',
  )
  await collisionSafeStage.cleanup()
  assert.equal(await readFile(collidingSentinel, 'utf8'), 'preexisting-attempt-must-not-be-adopted')
  await rm(collidingAttempt.absolutePath, { recursive: true })

  const activeCollisionAttemptId = '00000000-0000-4000-8000-000000000003'
  const activeCollisionStage = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: 'active-path-collision.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => Readable.from([bytes]),
    attemptIdFactory: () => activeCollisionAttemptId,
  })
  const activeCollisionDirectory = path.dirname(activeCollisionStage.inputPath)
  const displacedActiveCollisionDirectory = `${activeCollisionDirectory}.owned`
  await rename(activeCollisionDirectory, displacedActiveCollisionDirectory)
  let activeCollisionStreamOpened = false
  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'active-path-recreated.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => {
        activeCollisionStreamOpened = true
        return Readable.from([bytes])
      },
      attemptIdFactory: () => activeCollisionAttemptId,
    }),
    'source_probe_stage_active_attempt_collision',
  )
  assert.equal(activeCollisionStreamOpened, false)
  assert.equal(
    await pathExists(activeCollisionDirectory),
    false,
    'A recreated path refused by the active registry must clean only its newly acquired identity.',
  )
  await rename(displacedActiveCollisionDirectory, activeCollisionDirectory)
  await activeCollisionStage.cleanup()

  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'short.mp4',
      expectedSizeBytes: bytes.byteLength + 1,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => Readable.from([bytes]),
    }),
    'source_probe_stage_size_mismatch',
  )
  assert.deepEqual(await readdir(scopeDirectory), [], 'Size mismatch must remove staged bytes and its attempt directory.')

  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'checksum.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: '0'.repeat(64),
      openStream: async () => Readable.from([bytes]),
    }),
    'source_probe_stage_checksum_mismatch',
  )
  assert.deepEqual(await readdir(scopeDirectory), [], 'Checksum mismatch must remove staged bytes and its attempt directory.')

  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'overrun.mp4',
      expectedSizeBytes: bytes.byteLength - 1,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => Readable.from([bytes]),
    }),
    'source_probe_stage_size_mismatch',
  )
  assert.deepEqual(await readdir(scopeDirectory), [], 'Byte-ceiling failure must remove temporary bytes and its attempt directory.')

  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: root,
      scope,
      originalFileName: 'stream-error.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => {
        throw new Error('provider stream intentionally unavailable')
      },
    }),
    'source_probe_stage_failed',
  )
  assert.deepEqual(await readdir(scopeDirectory), [], 'Stream-open failure must leave no attempt directory.')

  const substitutedStage = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: 'ancestor-substitution.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => Readable.from([bytes]),
  })
  const substitutedAttemptDirectory = path.dirname(substitutedStage.inputPath)
  const substitutedScopeDirectory = path.dirname(substitutedAttemptDirectory)
  const substitutedOriginalScopeDirectory = `${substitutedScopeDirectory}.owned`
  const substitutedOutsideScopeDirectory = path.join(outsideRoot, 'substituted-cleanup-scope')
  const substitutedOutsideAttemptDirectory = path.join(
    substitutedOutsideScopeDirectory,
    path.basename(substitutedAttemptDirectory),
  )
  await mkdir(substitutedOutsideAttemptDirectory, { recursive: true })
  const substitutedSentinel = path.join(substitutedOutsideAttemptDirectory, 'sentinel.txt')
  await writeFile(substitutedSentinel, 'outside-cleanup-must-not-run')
  await rename(substitutedScopeDirectory, substitutedOriginalScopeDirectory)
  await symlink(substitutedOutsideScopeDirectory, substitutedScopeDirectory, 'dir')
  await assertStageRejects(
    () => substitutedStage.cleanup(),
    'source_probe_stage_cleanup_failed',
  )
  assert.equal(await readFile(substitutedSentinel, 'utf8'), 'outside-cleanup-must-not-run')
  await unlink(substitutedScopeDirectory)
  await rename(substitutedOriginalScopeDirectory, substitutedScopeDirectory)
  await substitutedStage.cleanup()

  const identityBoundStage = await stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: 'attempt-identity.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: checksumSha256,
    openStream: async () => Readable.from([bytes]),
  })
  const identityBoundAttemptDirectory = path.dirname(identityBoundStage.inputPath)
  const originalIdentityBoundDirectory = `${identityBoundAttemptDirectory}.owned`
  await rename(identityBoundAttemptDirectory, originalIdentityBoundDirectory)
  await mkdir(identityBoundAttemptDirectory, { mode: 0o700 })
  const replacementIdentitySentinel = path.join(identityBoundAttemptDirectory, 'replacement-sentinel.txt')
  await writeFile(replacementIdentitySentinel, 'replacement-attempt-must-not-be-removed')
  await assertStageRejects(
    () => identityBoundStage.cleanup(),
    'source_probe_stage_cleanup_failed',
  )
  assert.equal(await readFile(replacementIdentitySentinel, 'utf8'), 'replacement-attempt-must-not-be-removed')
  await rm(identityBoundAttemptDirectory, { recursive: true })
  await rename(originalIdentityBoundDirectory, identityBoundAttemptDirectory)
  await identityBoundStage.cleanup()

  const terminalIntegrityError = await captureStageError(() => stagePrivateSourceForProbe({
    localStorageRoot: root,
    scope,
    originalFileName: 'terminal-cleanup.mp4',
    expectedSizeBytes: bytes.byteLength,
    expectedChecksumSha256: '0'.repeat(64),
    openStream: async () => Readable.from([bytes]),
  }))
  const terminalCleanupError = privateSourceProbeStageErrorWithCleanupFailure(
    terminalIntegrityError,
    new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'Source media could not be safely staged for metadata probing.',
      409,
      { reason: 'source_probe_stage_cleanup_failed' },
    ),
  )
  assert.equal(
    (terminalCleanupError.details as { reason?: string }).reason,
    'source_probe_stage_checksum_mismatch',
    'Cleanup failure must preserve the original terminal checksum classification.',
  )
  assert.equal(
    (terminalCleanupError.details as { cleanupFailureReason?: string }).cleanupFailureReason,
    'source_probe_stage_cleanup_failed',
    'Terminal mismatch must retain secondary cleanup-failure evidence.',
  )
  assert.equal(isPrivateSourceProbeTerminalIntegrityError(terminalCleanupError), true)

  const symlinkRoot = path.join(root, 'symlink-case')
  await mkdir(symlinkRoot, { mode: 0o700 })
  const outsideSentinel = path.join(outsideRoot, 'sentinel.txt')
  await writeFile(outsideSentinel, 'outside-must-remain-unchanged')
  const outsideEntriesBeforeSymlinkAttempt = (await readdir(outsideRoot)).sort()
  await symlink(outsideRoot, path.join(symlinkRoot, 'upload-probes'), 'dir')
  await assertStageRejects(
    () => stagePrivateSourceForProbe({
      localStorageRoot: symlinkRoot,
      scope,
      originalFileName: 'symlink.mp4',
      expectedSizeBytes: bytes.byteLength,
      expectedChecksumSha256: checksumSha256,
      openStream: async () => Readable.from([bytes]),
    }),
    'source_probe_stage_failed',
  )
  assert.equal(await readFile(outsideSentinel, 'utf8'), 'outside-must-remain-unchanged')
  assert.deepEqual(
    (await readdir(outsideRoot)).sort(),
    outsideEntriesBeforeSymlinkAttempt,
    'Symlink refusal must not mutate the external directory.',
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'storage_stream_opened_once',
      'exact_byte_count_and_sha256_verified',
      'scope_identifiers_hashed_out_of_paths',
      'source_filename_sanitized',
      'private_0700_directory_and_0600_file_modes',
      'create_only_retry_uses_independent_attempt',
      'exclusive_attempt_collision_is_never_adopted_or_cleaned',
      'collision_limit_and_invalid_attempt_id_fail_before_stream_open',
      'active_registry_collision_cleans_only_the_newly_acquired_identity',
      'concurrent_cleanup_callers_share_one_promise',
      'idempotent_cleanup_removes_only_owned_attempt',
      'size_mismatch_fails_closed_and_cleans_up',
      'checksum_mismatch_fails_closed_and_cleans_up',
      'byte_ceiling_fails_closed_and_cleans_up',
      'stream_open_failure_leaves_no_attempt',
      'post_stage_ancestor_symlink_substitution_refused_without_external_deletion',
      'attempt_identity_substitution_refused_without_replacement_deletion',
      'terminal_integrity_reason_survives_cleanup_failure',
      'symlinked_parent_refused_without_external_mutation',
    ],
  }))
} finally {
  await rm(root, { force: true, recursive: true })
  await rm(outsideRoot, { force: true, recursive: true })
}

async function assertStageRejects(
  action: () => Promise<unknown>,
  expectedReason: string,
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ApiError, 'Staging failure must be an API error.')
    assert.equal(error.code, 'UPLOAD_NOT_FINALIZED')
    const details = error.details as { reason?: unknown } | undefined
    assert.equal(details?.reason, expectedReason)
    return true
  })
}

async function captureStageError(action: () => Promise<unknown>): Promise<ApiError> {
  try {
    await action()
  } catch (error) {
    assert.ok(error instanceof ApiError, 'Staging failure must be an API error.')
    return error
  }
  throw new Error('Expected private source probe staging to reject.')
}

async function assertPrivateDirectoryChain(rootPath: string, leafPath: string): Promise<void> {
  const relative = path.relative(rootPath, leafPath)
  let current = rootPath
  assert.equal(mode(await lstat(current)), 0o700, 'Private staging root must use 0700.')
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    const currentStat = await lstat(current)
    assert.equal(currentStat.isDirectory(), true)
    assert.equal(mode(currentStat), 0o700, `Private staging directory must use 0700: ${segment}`)
  }
}

function mode(value: Awaited<ReturnType<typeof lstat>>): number {
  return Number(value.mode) & 0o777
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath)
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}
