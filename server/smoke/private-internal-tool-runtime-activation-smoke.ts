import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  activateCompletePrivateInternalToolRuntimeSet,
  inspectActivePrivateInternalToolRuntimeSet,
  inspectCompletePrivateInternalToolRuntimeSet,
  privateInternalToolRuntimeActivationSemanticDigest,
} from '../tool-execution/private-internal-tool-runtime-activation'
import {
  listProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'

await assert.rejects(
  () => (
    activateCompletePrivateInternalToolRuntimeSet as unknown as
      (value: unknown) => Promise<unknown>
  )({ callerSelectedTools: ['ffmpeg'] }),
  (error: unknown) =>
    error instanceof Error
    && error.message ===
      'Complete private tool runtime activation accepts no caller input.',
)

const activated = await activateCompletePrivateInternalToolRuntimeSet()
const inspected = await inspectCompletePrivateInternalToolRuntimeSet()
const activeProcessInspection =
  await inspectActivePrivateInternalToolRuntimeSet()
const catalog = listProvenToolIdentityCatalog()

assert.equal(activated.schemaVersion, 'private-internal-tool-runtime-activation-v1')
assert.equal(activated.canonicalToolCount, catalog.length)
assert.ok(
  activated.canonicalToolCount >= 50,
  'Internal readiness must cover the complete current canonical tool set without creating a count cap.',
)
assert.equal(activated.tools.length, activated.canonicalToolCount)
assert.equal(
  new Set(activated.tools.map((tool) => tool.toolId)).size,
  activated.canonicalToolCount,
)
assert.equal(activated.runnerClassCount, 15)
assert.equal(activated.runtimeAuthorityCount, 14)
assert.ok(
  activated.tools.every(
    (tool) => tool.status === 'ready_for_private_internal_execution',
  ),
)
assert.ok(
  activated.runtimeFamilies.every(
    (family) => family.status === 'ready'
    && family.canonicalToolIds.length > 0,
  ),
)
assert.deepEqual(
  [...activated.tools.map((tool) => tool.toolId)].sort(),
  [...catalog.map((tool) => tool.canonicalToolId)].sort(),
)
assert.equal(activated.readiness.allCanonicalToolsReady, true)
assert.equal(activated.readiness.privateInternalExecutionReady, true)
assert.equal(activated.readiness.productReady, false)
assert.equal(activated.readiness.externalBetaReady, false)
assert.equal(activated.readiness.productionReady, false)
assert.equal(activated.reportHash, inspected.reportHash)
assert.equal(activated.reportHash, activeProcessInspection.reportHash)
assert.equal(
  privateInternalToolRuntimeActivationSemanticDigest(activated),
  privateInternalToolRuntimeActivationSemanticDigest(inspected),
)
assert.doesNotMatch(
  JSON.stringify(activated.tools),
  /not_ready|tool_not_ready|package_check_pending/iu,
)

const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
}))
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
let routeReadyToolCount: number

try {
  const response = await fetch(
    `http://127.0.0.1:${address.port}/v1/edit-executions/private-internal-tool-runtime-readiness`,
    { headers: { accept: 'application/json' } },
  )
  assert.equal(response.status, 200)
  const envelope = await response.json() as {
    data?: {
      privateInternalToolRuntimeReadiness?: {
        schemaVersion?: string
        canonicalToolCount?: number
        readyToolCount?: number
        allCanonicalToolsReady?: boolean
        privateInternalExecutionReady?: boolean
        productReady?: boolean
        tools?: { status?: string }[]
      }
    }
  }
  const readiness = envelope.data?.privateInternalToolRuntimeReadiness
  assert.equal(
    readiness?.schemaVersion,
    'private-internal-tool-runtime-readiness-browser-v1',
  )
  assert.equal(readiness?.canonicalToolCount, activated.canonicalToolCount)
  assert.equal(readiness?.readyToolCount, activated.canonicalToolCount)
  assert.equal(readiness?.allCanonicalToolsReady, true)
  assert.equal(readiness?.privateInternalExecutionReady, true)
  assert.equal(readiness?.productReady, false)
  assert.equal(readiness?.tools?.length, activated.canonicalToolCount)
  assert.ok(
    readiness?.tools?.every(
      (tool) => tool.status === 'ready_for_private_internal_execution',
    ),
  )
  routeReadyToolCount = readiness?.readyToolCount ?? 0
} finally {
  server.close()
  await once(server, 'close')
}

console.log(JSON.stringify({
  ok: true,
  canonicalToolCount: activated.canonicalToolCount,
  routeReadyToolCount,
  runnerClassCount: activated.runnerClassCount,
  runtimeAuthorityCount: activated.runtimeAuthorityCount,
  allCanonicalToolsReady: activated.readiness.allCanonicalToolsReady,
  privateInternalExecutionReady:
    activated.readiness.privateInternalExecutionReady,
  productReady: activated.readiness.productReady,
  reportHash: activated.reportHash,
}))
