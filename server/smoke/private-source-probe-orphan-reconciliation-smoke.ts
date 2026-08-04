import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  utimes,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS,
  isPrivateSourceProbeReconciliationError,
  reconcilePrivateSourceProbeOrphans,
} from '../media/private-source-probe-orphan-reconciler'
import {
  privateSourceProbeAttemptRelativeDirectory,
  privateSourceProbeScopeRelativeDirectory,
  privateSourceProbeVersionRelativeDirectory,
} from '../media/private-source-probe-paths'
import {
  privateSourceProbeScopeHash,
  stagePrivateSourceForProbe,
  type PrivateSourceProbeStageScope,
} from '../media/private-source-probe-staging'
import { createPrivateDirectoryCreateOnlyWithinRoot } from '../security/private-local-persistence'

const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-probe-orphans-'))
const outsideRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-source-probe-orphans-outside-'))
const realNowMs = Date.now()
const nowMs = realNowMs + (72 * 60 * 60 * 1_000)
const cutoffMs = nowMs - PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS
const staleActivityMs = cutoffMs - (60 * 60 * 1_000)
const recentActivityMs = nowMs - (60 * 60 * 1_000)
const futureActivityMs = nowMs + (60 * 60 * 1_000)
const maintenanceAuthority = {
  kind: 'private_single_process_local_storage_maintenance' as const,
  requestServingStopped: true as const,
  exclusiveLocalStorageRootConfirmed: true as const,
}

try {
  const missingRoot = path.join(fixtureRoot, 'missing-root')
  const missingReport = await reconcilePrivateSourceProbeOrphans({
    localStorageRoot: missingRoot,
    nowMs,
  })
  assert.equal(missingReport.scopeCount, 0)
  assert.equal(await pathExists(missingRoot), false, 'Inspection must not create a missing private root.')

  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: missingRoot,
      staleAfterMs: PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS - 1,
      nowMs,
    }),
    'private_source_probe_reconciliation_age_below_minimum',
  )
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: missingRoot,
      mode: 'delete_stale',
      nowMs,
    }),
    'private_source_probe_reconciliation_maintenance_authority_required',
  )

  const classificationRoot = await privateRoot('classification')
  const scopeHash = '1'.repeat(64)
  const staleFinal = await createAttempt(classificationRoot, scopeHash, uuid(1), ['source.mp4'])
  const staleEmpty = await createAttempt(classificationRoot, scopeHash, uuid(2))
  const staleTemporary = await createAttempt(classificationRoot, scopeHash, uuid(3), [
    '.source.mp4.create.lock',
    '.source.mp4.upload.tmp',
  ])
  const recentAttempt = await createAttempt(classificationRoot, scopeHash, uuid(4), ['recent.mp4'])
  const cutoffEqualAttempt = await createAttempt(classificationRoot, scopeHash, uuid(5), ['cutoff.mp4'])
  const futureAttempt = await createAttempt(classificationRoot, scopeHash, uuid(6), ['future.mp4'])
  const freshFileAttempt = await createAttempt(classificationRoot, scopeHash, uuid(7), ['fresh-file.mp4'])

  await setAttemptActivity(staleFinal, staleActivityMs)
  await setAttemptActivity(staleEmpty, staleActivityMs)
  await setAttemptActivity(staleTemporary, staleActivityMs)
  await setAttemptActivity(recentAttempt, recentActivityMs)
  await setAttemptActivity(cutoffEqualAttempt, cutoffMs)
  await setAttemptActivity(futureAttempt, futureActivityMs)
  await setAttemptActivity(freshFileAttempt, staleActivityMs, { 'fresh-file.mp4': recentActivityMs })

  const activeScope: PrivateSourceProbeStageScope = {
    ownerUserId: 'private-owner-redaction-sentinel',
    workspaceId: 'private-workspace-redaction-sentinel',
    projectId: 'private-project-redaction-sentinel',
    uploadIntentId: 'private-upload-redaction-sentinel',
  }
  const activeBytes = Buffer.from('active private probe bytes')
  const activeStage = await stagePrivateSourceForProbe({
    localStorageRoot: classificationRoot,
    scope: activeScope,
    originalFileName: 'active-private-source.mp4',
    expectedSizeBytes: activeBytes.byteLength,
    expectedChecksumSha256: createHash('sha256').update(activeBytes).digest('hex'),
    openStream: async () => Readable.from([activeBytes]),
  })

  const inspectReport = await reconcilePrivateSourceProbeOrphans({
    localStorageRoot: classificationRoot,
    nowMs,
  })
  assert.equal(inspectReport.mode, 'inspect_only')
  assert.equal(inspectReport.staleCandidateCount, 3)
  assert.equal(inspectReport.activeAttemptSkippedCount, 1)
  assert.equal(inspectReport.recentAttemptSkippedCount, 3)
  assert.equal(inspectReport.futureDatedAttemptSkippedCount, 1)
  assert.equal(inspectReport.removedAttemptCount, 0)
  assert.equal(await pathExists(staleFinal.absolutePath), true, 'Inspect-only mode must never remove candidates.')

  const serializedReport = JSON.stringify(inspectReport)
  for (const privateValue of [
    classificationRoot,
    scopeHash,
    privateSourceProbeScopeHash(activeScope),
    activeScope.ownerUserId,
    activeScope.workspaceId,
    activeScope.projectId,
    activeScope.uploadIntentId,
    'source.mp4',
    'active-private-source.mp4',
  ]) {
    assert.equal(serializedReport.includes(privateValue), false, 'Reports must contain aggregate evidence only.')
  }

  const deleteReport = await reconcilePrivateSourceProbeOrphans({
    localStorageRoot: classificationRoot,
    mode: 'delete_stale',
    nowMs,
    maintenanceAuthority,
  })
  assert.equal(deleteReport.removedAttemptCount, 3)
  assert.equal(deleteReport.deletionAuthorityUsed, true)
  assert.equal(await pathExists(staleFinal.absolutePath), false)
  assert.equal(await pathExists(staleEmpty.absolutePath), false)
  assert.equal(await pathExists(staleTemporary.absolutePath), false)
  assert.equal(await pathExists(recentAttempt.absolutePath), true)
  assert.equal(await pathExists(cutoffEqualAttempt.absolutePath), true)
  assert.equal(await pathExists(futureAttempt.absolutePath), true)
  assert.equal(await pathExists(freshFileAttempt.absolutePath), true)
  assert.equal(await pathExists(activeStage.inputPath), true, 'An active attempt must never be reconciled.')
  await activeStage.cleanup()

  const unknownVersionRoot = await privateRoot('unknown-version')
  const unknownVersionSentinel = path.join(
    unknownVersionRoot,
    'upload-probes',
    'unknown-version',
    'sentinel.txt',
  )
  await mkdir(path.dirname(unknownVersionSentinel), { recursive: true, mode: 0o700 })
  await writeFile(unknownVersionSentinel, 'unknown-version-must-remain')
  const unknownVersionReport = await reconcilePrivateSourceProbeOrphans({
    localStorageRoot: unknownVersionRoot,
    mode: 'delete_stale',
    nowMs,
    maintenanceAuthority,
  })
  assert.equal(unknownVersionReport.attemptCount, 0)
  assert.equal(await readFile(unknownVersionSentinel, 'utf8'), 'unknown-version-must-remain')

  const malformedScopeRoot = await privateRoot('malformed-scope')
  const validBeforeMalformed = await createAttempt(malformedScopeRoot, '0'.repeat(64), uuid(8), ['valid.mp4'])
  await setAttemptActivity(validBeforeMalformed, staleActivityMs)
  await mkdir(
    path.join(malformedScopeRoot, privateSourceProbeVersionRelativeDirectory(), 'malformed-scope-name'),
    { recursive: true, mode: 0o700 },
  )
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: malformedScopeRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    'private_source_probe_reconciliation_scope_name_invalid',
  )
  assert.equal(await pathExists(validBeforeMalformed.absolutePath), true, 'Preflight refusal must delete nothing.')

  const malformedAttemptRoot = await privateRoot('malformed-attempt')
  const malformedAttemptScope = '2'.repeat(64)
  const validBeforeMalformedAttempt = await createAttempt(
    malformedAttemptRoot,
    malformedAttemptScope,
    uuid(9),
    ['valid.mp4'],
  )
  await setAttemptActivity(validBeforeMalformedAttempt, staleActivityMs)
  await mkdir(
    path.join(
      malformedAttemptRoot,
      privateSourceProbeScopeRelativeDirectory(malformedAttemptScope),
      'malformed-attempt-name',
    ),
    { mode: 0o700 },
  )
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: malformedAttemptRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    'private_source_probe_reconciliation_attempt_name_invalid',
  )
  assert.equal(await pathExists(validBeforeMalformedAttempt.absolutePath), true)

  const symlinkAttemptRoot = await privateRoot('attempt-symlink')
  const symlinkAttemptScope = '3'.repeat(64)
  const symlinkAttemptScopePath = path.join(
    symlinkAttemptRoot,
    privateSourceProbeScopeRelativeDirectory(symlinkAttemptScope),
  )
  await mkdir(symlinkAttemptScopePath, { recursive: true, mode: 0o700 })
  const outsideAttemptSentinel = path.join(outsideRoot, 'attempt-symlink-sentinel.txt')
  await writeFile(outsideAttemptSentinel, 'outside-attempt-must-remain')
  await symlink(outsideRoot, path.join(symlinkAttemptScopePath, uuid(10)), 'dir')
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: symlinkAttemptRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    'private_source_probe_reconciliation_private_inspection_entry_not_regular_directory',
  )
  assert.equal(await readFile(outsideAttemptSentinel, 'utf8'), 'outside-attempt-must-remain')

  const symlinkFileRoot = await privateRoot('file-symlink')
  const symlinkFileAttempt = await createAttempt(symlinkFileRoot, '4'.repeat(64), uuid(11))
  const outsideFileSentinel = path.join(outsideRoot, 'file-symlink-sentinel.txt')
  await writeFile(outsideFileSentinel, 'outside-file-must-remain')
  await symlink(outsideFileSentinel, path.join(symlinkFileAttempt.absolutePath, 'source.mp4'))
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: symlinkFileRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    'private_source_probe_reconciliation_private_inspection_entry_not_regular_file',
  )
  assert.equal(await readFile(outsideFileSentinel, 'utf8'), 'outside-file-must-remain')

  const nestedDirectoryRoot = await privateRoot('nested-directory')
  const nestedDirectoryAttempt = await createAttempt(nestedDirectoryRoot, '5'.repeat(64), uuid(12))
  await mkdir(path.join(nestedDirectoryAttempt.absolutePath, 'nested'), { mode: 0o700 })
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: nestedDirectoryRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    'private_source_probe_reconciliation_private_inspection_entry_not_regular_file',
  )
  assert.equal(await pathExists(nestedDirectoryAttempt.absolutePath), true)

  const deleteLimitRoot = await privateRoot('delete-limit')
  const firstOverLimit = await createAttempt(deleteLimitRoot, '6'.repeat(64), uuid(13), ['first.mp4'])
  const secondOverLimit = await createAttempt(deleteLimitRoot, '6'.repeat(64), uuid(14), ['second.mp4'])
  await setAttemptActivity(firstOverLimit, staleActivityMs)
  await setAttemptActivity(secondOverLimit, staleActivityMs)
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: deleteLimitRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
      limits: { maximumDeletes: 1 },
    }),
    'private_source_probe_reconciliation_delete_limit_exceeded',
  )
  assert.equal(await pathExists(firstOverLimit.absolutePath), true)
  assert.equal(await pathExists(secondOverLimit.absolutePath), true)

  const entryLimitRoot = await privateRoot('entry-limit')
  const entryLimitAttempt = await createAttempt(entryLimitRoot, '7'.repeat(64), uuid(15), ['one', 'two'])
  await setAttemptActivity(entryLimitAttempt, staleActivityMs)
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: entryLimitRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
      limits: { maximumEntriesPerAttempt: 1 },
    }),
    'private_source_probe_reconciliation_private_inspection_entry_limit_exceeded',
  )
  assert.equal(await pathExists(entryLimitAttempt.absolutePath), true)

  const identityRaceRoot = await privateRoot('identity-race')
  const identityRaceAttempt = await createAttempt(identityRaceRoot, '8'.repeat(64), uuid(16), ['owned.mp4'])
  await setAttemptActivity(identityRaceAttempt, staleActivityMs)
  const originalIdentityRacePath = `${identityRaceAttempt.absolutePath}.owned`
  const replacementSentinel = path.join(identityRaceAttempt.absolutePath, 'replacement.txt')
  await assertReconciliationRejects(
    () => reconcilePrivateSourceProbeOrphans({
      localStorageRoot: identityRaceRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
      onPreflightComplete: async () => {
        await rename(identityRaceAttempt.absolutePath, originalIdentityRacePath)
        await mkdir(identityRaceAttempt.absolutePath, { mode: 0o700 })
        await writeFile(replacementSentinel, 'replacement-attempt-must-remain')
      },
    }),
    'private_source_probe_reconciliation_private_inspection_directory_identity_changed',
  )
  assert.equal(await readFile(replacementSentinel, 'utf8'), 'replacement-attempt-must-remain')
  assert.equal(await pathExists(originalIdentityRacePath), true)

  const serializedRoot = await privateRoot('serialized')
  const serializedAttempt = await createAttempt(serializedRoot, '9'.repeat(64), uuid(17), ['source.mp4'])
  await setAttemptActivity(serializedAttempt, staleActivityMs)
  const overlappingReports = await Promise.all([
    reconcilePrivateSourceProbeOrphans({
      localStorageRoot: serializedRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
    reconcilePrivateSourceProbeOrphans({
      localStorageRoot: serializedRoot,
      mode: 'delete_stale',
      nowMs,
      maintenanceAuthority,
    }),
  ])
  assert.deepEqual(
    overlappingReports.map((report) => report.removedAttemptCount).sort((left, right) => left - right),
    [0, 1],
    'Overlapping local reconcilers must serialize and remove an orphan only once.',
  )
  assert.equal(await pathExists(serializedAttempt.absolutePath), false)

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'missing_root_inspection_is_non_creating',
      'minimum_24_hour_age_enforced',
      'delete_requires_explicit_single_process_maintenance_authority',
      'inspect_only_reports_without_deleting',
      'stale_final_empty_and_temporary_attempts_removed',
      'recent_cutoff_equal_future_and_fresh_file_attempts_retained',
      'process_local_active_attempt_retained',
      'aggregate_report_redacts_paths_scope_hashes_names_and_tenant_ids',
      'unknown_versions_untouched',
      'malformed_names_fail_before_any_delete',
      'attempt_and_file_symlinks_refused_without_external_mutation',
      'nested_attempt_content_refused',
      'entry_and_delete_bounds_fail_before_deletion',
      'identity_replacement_between_preflight_and_delete_is_preserved',
      'overlapping_local_reconcilers_serialize',
    ],
  }))
} finally {
  await rm(fixtureRoot, { force: true, recursive: true })
  await rm(outsideRoot, { force: true, recursive: true })
}

async function privateRoot(name: string): Promise<string> {
  const root = path.join(fixtureRoot, name)
  await mkdir(root, { mode: 0o700 })
  return root
}

async function createAttempt(
  root: string,
  scopeHash: string,
  attemptId: string,
  fileNames: string[] = [],
): Promise<{ absolutePath: string; relativePath: string; fileNames: string[] }> {
  const relativePath = privateSourceProbeAttemptRelativeDirectory(scopeHash, attemptId)
  const created = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: root,
    relativePath,
  })
  for (const fileName of fileNames) {
    await writeFile(path.join(created.absolutePath, fileName), `fixture:${fileName}`)
  }
  return { absolutePath: created.absolutePath, relativePath, fileNames }
}

async function setAttemptActivity(
  attempt: { absolutePath: string; fileNames: string[] },
  directoryAndDefaultFileTimeMs: number,
  fileOverrides: Record<string, number> = {},
): Promise<void> {
  for (const fileName of attempt.fileNames) {
    const activityMs = fileOverrides[fileName] ?? directoryAndDefaultFileTimeMs
    await setActivity(path.join(attempt.absolutePath, fileName), activityMs)
  }
  await setActivity(attempt.absolutePath, directoryAndDefaultFileTimeMs)
}

async function setActivity(targetPath: string, activityMs: number): Promise<void> {
  const timestamp = new Date(activityMs)
  await utimes(targetPath, timestamp, timestamp)
}

async function assertReconciliationRejects(
  action: () => Promise<unknown>,
  expectedReason: string,
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ApiError, 'Reconciliation refusal must be an API error.')
    assert.equal(isPrivateSourceProbeReconciliationError(error), true)
    const details = error.details as { reason?: unknown } | undefined
    assert.equal(details?.reason, expectedReason)
    return true
  })
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

function uuid(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`
}
