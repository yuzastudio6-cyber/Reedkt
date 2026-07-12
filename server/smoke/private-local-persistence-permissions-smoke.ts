import assert from 'node:assert/strict'
import { open } from 'node:fs/promises'
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import {
  ensurePrivateDirectoryWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileAtomicWithinRoot,
  writePrivateStreamAtomicWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'

const rootPath = await mkdtemp(join(tmpdir(), 'reeditpro-private-local-persistence-'))

try {
  await chmod(rootPath, 0o777)
  const textRelativePath = join('private-registry', 'records', 'record.json')
  const textPath = join(rootPath, textRelativePath)
  await mkdir(dirname(textPath), { recursive: true, mode: 0o777 })
  await chmod(join(rootPath, 'private-registry'), 0o777)
  await chmod(dirname(textPath), 0o777)
  await writeFile(textPath, 'old-record\n', { mode: 0o666 })
  await chmod(textPath, 0o666)

  const oldHandle = await open(textPath, 'r')
  await writePrivateTextFileAtomicWithinRoot({
    rootPath,
    relativePath: textRelativePath,
    content: 'new-record\n',
  })
  try {
    assert.equal(await oldHandle.readFile('utf8'), 'old-record\n')
  } finally {
    await oldHandle.close()
  }

  assert.equal(await readFile(textPath, 'utf8'), 'new-record\n')
  assert.equal(await readPrivateTextFileIfExistsWithinRoot({ rootPath, relativePath: textRelativePath }), 'new-record\n')
  assert.equal(modeBits((await stat(textPath)).mode), 0o600)
  assert.equal(modeBits((await stat(rootPath)).mode), 0o700)
  assert.equal(modeBits((await stat(join(rootPath, 'private-registry'))).mode), 0o700)
  assert.equal(modeBits((await stat(dirname(textPath))).mode), 0o700)
  assert.deepEqual((await readdir(dirname(textPath))).filter((name) => name.endsWith('.tmp')), [])

  const legacyRelativePath = join('legacy-private-registry', 'records', 'legacy.json')
  const legacyPath = join(rootPath, legacyRelativePath)
  await mkdir(dirname(legacyPath), { recursive: true, mode: 0o777 })
  await chmod(join(rootPath, 'legacy-private-registry'), 0o777)
  await chmod(dirname(legacyPath), 0o777)
  await writeFile(legacyPath, 'legacy-record\n', { mode: 0o666 })
  await chmod(legacyPath, 0o666)
  assert.equal(
    await readPrivateTextFileIfExistsWithinRoot({ rootPath, relativePath: legacyRelativePath }),
    'legacy-record\n',
  )
  assert.equal(modeBits((await stat(legacyPath)).mode), 0o600)
  assert.equal(modeBits((await stat(join(rootPath, 'legacy-private-registry'))).mode), 0o700)
  assert.equal(modeBits((await stat(dirname(legacyPath))).mode), 0o700)

  const bufferRelativePath = join('private-registry', 'records', 'buffer.bin')
  const bufferPath = await writePrivateFileAtomicWithinRoot({
    rootPath,
    relativePath: bufferRelativePath,
    content: Buffer.from([0, 1, 2, 3]),
  })
  assert.deepEqual(await readFile(bufferPath), Buffer.from([0, 1, 2, 3]))
  assert.equal(modeBits((await stat(bufferPath)).mode), 0o600)

  const streamRelativePath = join('private-artifacts', 'staged-source.bin')
  const streamPath = join(rootPath, streamRelativePath)
  await mkdir(dirname(streamPath), { recursive: true, mode: 0o777 })
  await chmod(dirname(streamPath), 0o777)
  await writeFile(streamPath, 'old-stream-content', { mode: 0o666 })
  await chmod(streamPath, 0o666)
  const oldStreamHandle = await open(streamPath, 'r')
  await writePrivateStreamAtomicWithinRoot({
    rootPath,
    relativePath: streamRelativePath,
    stream: Readable.from(Buffer.from('new-stream-content')),
  })
  try {
    assert.equal(await oldStreamHandle.readFile('utf8'), 'old-stream-content')
  } finally {
    await oldStreamHandle.close()
  }
  assert.equal(await readFile(streamPath, 'utf8'), 'new-stream-content')
  assert.equal(modeBits((await stat(streamPath)).mode), 0o600)
  assert.equal(modeBits((await stat(dirname(streamPath))).mode), 0o700)
  assert.deepEqual((await readdir(dirname(streamPath))).filter((name) => name.endsWith('.tmp')), [])

  const createOnlyStreamRelativePath = join('private-artifacts', 'create-only-source.bin')
  const createOnlyStream = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath,
    relativePath: createOnlyStreamRelativePath,
    stream: Readable.from(Buffer.from('create-only-stream-content')),
    maximumBytes: 1_024,
  })
  assert.equal(createOnlyStream.byteLength, Buffer.byteLength('create-only-stream-content'))
  assert.equal(createOnlyStream.checksumSha256, 'da6942e06df678c14a6e9b7d7c732078f703fc993465c66730424f8669fe9ba2')
  assert.equal(await readFile(createOnlyStream.absolutePath, 'utf8'), 'create-only-stream-content')
  assert.equal(modeBits((await stat(createOnlyStream.absolutePath)).mode), 0o600)
  await assert.rejects(
    () => writePrivateStreamCreateOnlyWithinRoot({
      rootPath,
      relativePath: createOnlyStreamRelativePath,
      stream: Readable.from(Buffer.from('replacement-must-not-win')),
      maximumBytes: 1_024,
    }),
    (error) => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'IDEMPOTENCY_CONFLICT'),
  )
  assert.equal(await readFile(createOnlyStream.absolutePath, 'utf8'), 'create-only-stream-content')

  const oversizedRelativePath = join('private-artifacts', 'oversized-source.bin')
  await assert.rejects(
    () => writePrivateStreamCreateOnlyWithinRoot({
      rootPath,
      relativePath: oversizedRelativePath,
      stream: Readable.from(Buffer.from('too-many-bytes')),
      maximumBytes: 4,
    }),
    (error) => Boolean(error && typeof error === 'object' && 'status' in error && error.status === 413),
  )
  await assert.rejects(() => lstat(join(rootPath, oversizedRelativePath)), { code: 'ENOENT' })
  assert.deepEqual(
    (await readdir(join(rootPath, 'private-artifacts'))).filter((name) => name.includes('oversized-source')),
    [],
  )

  const privateDirectory = await ensurePrivateDirectoryWithinRoot({
    rootPath,
    relativePath: join('private-artifacts', 'nested', 'worker-output'),
  })
  assert.equal(modeBits((await stat(privateDirectory)).mode), 0o700)
  assert.equal(modeBits((await stat(dirname(privateDirectory))).mode), 0o700)

  const outsideFile = join(rootPath, 'outside-do-not-touch.json')
  await writeFile(outsideFile, 'outside\n', { mode: 0o600 })
  const linkedFile = join(rootPath, 'private-registry', 'records', 'linked.json')
  await symlink(outsideFile, linkedFile)
  await assert.rejects(
    () => writePrivateTextFileAtomicWithinRoot({
      rootPath,
      relativePath: join('private-registry', 'records', 'linked.json'),
      content: 'must-not-write\n',
    }),
    /unsafe filesystem path/,
  )
  await assert.rejects(
    () => writePrivateTextFileAtomicWithinRoot({
      rootPath,
      relativePath: 'private-registry/../normalized-traversal.json',
      content: 'must-not-write\n',
    }),
    /unsafe filesystem path/,
  )
  await assert.rejects(
    () => readPrivateTextFileIfExistsWithinRoot({
      rootPath,
      relativePath: join('private-registry', 'records', 'linked.json'),
    }),
    /unsafe filesystem path/,
  )
  assert.equal(await readFile(outsideFile, 'utf8'), 'outside\n')

  const outsideDirectory = await mkdtemp(join(tmpdir(), 'reeditpro-private-local-outside-'))
  try {
    const linkedDirectory = join(rootPath, 'linked-directory')
    await symlink(outsideDirectory, linkedDirectory)
    await assert.rejects(
      () => writePrivateTextFileAtomicWithinRoot({
        rootPath,
        relativePath: join('linked-directory', 'escaped.json'),
        content: 'must-not-write\n',
      }),
      /unsafe filesystem path/,
    )
    await assert.rejects(() => lstat(join(outsideDirectory, 'escaped.json')), { code: 'ENOENT' })
  } finally {
    await rm(outsideDirectory, { recursive: true, force: true })
  }

  await assert.rejects(
    () => writePrivateTextFileAtomicWithinRoot({
      rootPath,
      relativePath: join('..', 'escaped.json'),
      content: 'must-not-write\n',
    }),
    /unsafe filesystem path/,
  )

  for (const servicePath of [
    'server/services/credit-gate-service.ts',
    'server/services/approved-snapshot-service.ts',
    'server/services/approved-edit-execution-package-service.ts',
    'server/services/private-canonical-work-graph-progress-store.ts',
    'server/workers/audio/audio-execution-artifact-writer.ts',
    'server/workers/captions/caption-file-builder.ts',
    'server/workers/color/color-artifact-writer.ts',
    'server/workers/enhancement/enhancement-artifact-writer.ts',
    'server/workers/masks/mask-artifact-writer.ts',
    'server/workers/render/render-artifact-writer.ts',
    'server/workers/slow-motion/slow-motion-artifact-writer.ts',
    'server/workers/smart-cut/smart-cut-execution-artifact-writer.ts',
    'server/workers/timeline/timeline-artifact-builder.ts',
  ]) {
    const source = await readFile(join(process.cwd(), servicePath), 'utf8')
    assert.doesNotMatch(source, /\bawait\s+(?:mkdir|writeFile)\s*\(/)
    assert.doesNotMatch(source, /\bcreateWriteStream\s*\(/)
    assert.match(source, /private-local-persistence/)
  }

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'private_directory_mode_0700',
      'private_file_mode_0600',
      'atomic_existing_text_replacement',
      'atomic_existing_stream_replacement',
      'atomic_create_only_stream_with_sha256_and_byte_ceiling',
      'create_only_stream_collision_rejected_without_overwrite',
      'oversized_stream_rejected_without_partial_target',
      'existing_private_read_hardens_file_and_directory_modes',
      'temporary_files_cleaned',
      'path_traversal_rejected',
      'target_symlink_rejected_without_external_mutation',
      'parent_symlink_rejected_without_external_mutation',
      'private_registry_reads_refuse_symlinks',
      'named_private_persistence_services_use_shared_hardened_boundary',
    ],
  }, null, 2))
} finally {
  await rm(rootPath, { recursive: true, force: true })
}

function modeBits(mode: number): number {
  return mode & 0o777
}
