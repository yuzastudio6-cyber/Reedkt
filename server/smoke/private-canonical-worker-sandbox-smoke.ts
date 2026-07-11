import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import {
  allocatePrivateWorkerOutputPath,
  createPrivateCanonicalWorkerSandbox,
  destroyPrivateCanonicalWorkerSandbox,
  materializeVerifiedPrivateWorkerInput,
  promotePrivateWorkerOutputCreateOnly,
} from '../workers/canonical-runtime/private-worker-sandbox'

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-private-worker-sandbox-'))
const scope = {
  localStorageRoot,
  ownerUserId: 'sandbox-user',
  workspaceId: 'sandbox-workspace',
  projectId: 'sandbox-project',
  editSessionId: 'sandbox-edit-session',
  jobId: 'sandbox-job',
  leaseId: 'sandbox-lease',
}

try {
  const sandbox = await createPrivateCanonicalWorkerSandbox(scope)
  const sourceBytes = Buffer.from('immutable-private-source-bytes')
  const sourceHash = sha256(sourceBytes)
  const materialized = await materializeVerifiedPrivateWorkerInput({
    sandbox,
    inputId: 'source-asset-1',
    extension: 'bin',
    stream: Readable.from(sourceBytes),
    expectedByteLength: sourceBytes.byteLength,
    expectedChecksumSha256: sourceHash,
    maximumBytes: 1_024,
  })
  assert.equal(materialized.byteLength, sourceBytes.byteLength)
  assert.equal(materialized.checksumSha256, sourceHash)
  assert.deepEqual(await readFile(materialized.absolutePath), sourceBytes)
  assert.equal(modeBits((await stat(materialized.absolutePath)).mode), 0o600)

  const output = await allocatePrivateWorkerOutputPath({
    sandbox,
    outputId: 'expected-asset-1-attempt-1',
    extension: 'json',
  })
  const outputBytes = Buffer.from('{"toolResult":"private"}\n')
  await writeFile(output.absolutePath, outputBytes, { flag: 'wx', mode: 0o644 })
  await assert.rejects(
    () => allocatePrivateWorkerOutputPath({
      sandbox,
      outputId: 'expected-asset-1-attempt-1',
      extension: 'json',
    }),
    (error) => hasCode(error, 'IDEMPOTENCY_CONFLICT'),
  )

  const promoted = await promotePrivateWorkerOutputCreateOnly({
    sandbox,
    scratchRelativePath: output.relativePath,
    artifactRelativePath: 'canonical-worker-artifacts/private-v1/expected-asset-1/version-1.json',
    maximumBytes: 4_096,
  })
  assert.deepEqual(await readFile(promoted.absolutePath), outputBytes)
  assert.equal(promoted.byteLength, outputBytes.byteLength)
  assert.equal(promoted.checksumSha256, sha256(outputBytes))
  assert.equal(modeBits((await stat(promoted.absolutePath)).mode), 0o600)
  assert.equal(promoted.absolutePath.startsWith(sandbox.absoluteDirectory), false)

  await assert.rejects(
    () => promotePrivateWorkerOutputCreateOnly({
      sandbox,
      scratchRelativePath: output.relativePath,
      artifactRelativePath: 'canonical-worker-artifacts/private-v1/expected-asset-1/version-1.json',
      maximumBytes: 4_096,
    }),
    (error) => hasCode(error, 'IDEMPOTENCY_CONFLICT'),
  )
  await assert.rejects(
    () => promotePrivateWorkerOutputCreateOnly({
      sandbox,
      scratchRelativePath: '../outside.bin',
      artifactRelativePath: 'canonical-worker-artifacts/private-v1/escape.bin',
      maximumBytes: 4_096,
    }),
    /escapes its sandbox/,
  )

  const mismatchSandbox = await createPrivateCanonicalWorkerSandbox({
    ...scope,
    jobId: 'sandbox-job-mismatch',
    leaseId: 'sandbox-lease-mismatch',
  })
  await assert.rejects(
    () => materializeVerifiedPrivateWorkerInput({
      sandbox: mismatchSandbox,
      inputId: 'source-asset-mismatch',
      extension: 'bin',
      stream: Readable.from(sourceBytes),
      expectedByteLength: sourceBytes.byteLength,
      expectedChecksumSha256: 'f'.repeat(64),
      maximumBytes: 1_024,
    }),
    (error) => hasCode(error, 'UPLOAD_SOURCE_MISMATCH'),
  )
  await assert.rejects(() => lstat(mismatchSandbox.absoluteDirectory), { code: 'ENOENT' })

  await assert.rejects(
    () => destroyPrivateCanonicalWorkerSandbox({
      ...sandbox,
      absoluteDirectory: tmpdir(),
    }),
    /sandbox identity is invalid/,
  )
  await destroyPrivateCanonicalWorkerSandbox(sandbox)
  await assert.rejects(() => lstat(sandbox.absoluteDirectory), { code: 'ENOENT' })

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'server_generated_private_sandbox_identity',
      'streamed_source_size_and_checksum_revalidation',
      'private_input_modes',
      'server_allocated_create_only_output_path',
      'verified_output_atomic_create_only_promotion',
      'artifact_checksum_and_private_modes',
      'artifact_collision_rejected_without_overwrite',
      'sandbox_path_escape_rejected',
      'source_mismatch_destroys_sandbox',
      'forged_sandbox_identity_rejected',
      'sandbox_cleanup',
    ],
  }))
} finally {
  await rm(localStorageRoot, { force: true, recursive: true })
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function modeBits(mode: number): number {
  return mode & 0o777
}

function hasCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}
