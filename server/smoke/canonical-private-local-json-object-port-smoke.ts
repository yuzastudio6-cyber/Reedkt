import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-private-json-port-'))
let checks = 0

try {
  const port = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: root,
  })
  const objectPath = 'private/smoke/caption/object-v1.json'
  const body = Buffer.from('{"caption":"ready"}', 'utf8')
  const contentSha256 = digest(body)

  assert.equal(await port.createOnly({
    objectPath,
    body,
    contentSha256,
  }), 'created')
  checks += 1
  assert.equal(await port.createOnly({
    objectPath,
    body,
    contentSha256,
  }), 'already_exists')
  checks += 1
  assert.deepEqual(await port.readExact(objectPath), body)
  checks += 1
  assert.equal(await port.readExact('private/smoke/caption/missing.json'), null)
  checks += 1

  const crossed = Buffer.from('{"caption":"crossed"}', 'utf8')
  await assert.rejects(() => port.createOnly({
    objectPath,
    body: crossed,
    contentSha256: digest(crossed),
  }), /different bytes|collision|mismatch/u)
  checks += 1
  await assert.rejects(() => port.createOnly({
    objectPath: '../caption.json',
    body,
    contentSha256,
  }), /path is invalid/u)
  checks += 1
  await assert.rejects(() => port.createOnly({
    objectPath: 'private/smoke/caption/bad-hash.json',
    body,
    contentSha256: '0'.repeat(64),
  }), /input is invalid/u)
  checks += 1

  console.log(JSON.stringify({
    smoke: 'canonical-private-local-json-object-port',
    status: 'passed',
    checks,
    createOnlyCollisionRefused: true,
    exactRereadVerified: true,
    distributedDurabilityClaimed: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function digest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
