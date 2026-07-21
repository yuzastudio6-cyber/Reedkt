import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createEditReferenceProductionApplicationLifecycleRequest,
} from '../edit-references/edit-reference-production-application-lifecycle'
import {
  createEditReferenceLocalSupabaseRpcAdapter,
  createEditReferenceLocalSupabaseRpcCapability,
  assertEditReferenceLocalSupabaseRpcAdapterIsNotProduction,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import { createEditReferenceProductionOutputFrameAuthority } from '../edit-references/edit-reference-production-output-frame-authority'
import type { EditReferenceProductionRpcClient } from '../edit-references/edit-reference-production-rpc-adapter'

const databaseUrl = process.env.REEDITPRO_CANONICAL_V3_DATABASE_URL
  ?? 'postgresql://postgres:postgres@127.0.0.1:57432/postgres'
const parsedDatabaseUrl = new URL(databaseUrl)
if (
  parsedDatabaseUrl.protocol !== 'postgresql:'
  || parsedDatabaseUrl.hostname !== '127.0.0.1'
  || parsedDatabaseUrl.port !== '57432'
  || parsedDatabaseUrl.pathname !== '/postgres'
) throw new Error('local_rpc_smoke_database_url_not_canonical_loopback')

const frame = createEditReferenceProductionOutputFrameAuthority({
  repositoryAuthority: 'supabase_rls_transactional',
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: 'aaaaaaaa-1000-4000-8000-000000000001',
  editSessionId: 'aaaaaaaa-2000-4000-8000-000000000001',
  exactEditPreferenceRecordRevision: 0,
  planningInputRevision: 0,
  confirmationId: 'aaaaaaaa-8000-4000-8000-000000000001',
  aspectRatio: '16:9',
  confirmedAt: '2026-07-21T12:00:00.000Z',
})
const request = createEditReferenceProductionApplicationLifecycleRequest({
  mutation: 'apply',
  actorUserId: '11111111-1111-4111-8111-111111111111',
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: 'aaaaaaaa-1000-4000-8000-000000000001',
  editSessionId: 'aaaaaaaa-2000-4000-8000-000000000001',
  editReferenceId: 'aaaaaaaa-3000-4000-8000-000000000001',
  studySessionId: 'aaaaaaaa-4000-4000-8000-000000000001',
  dnaVersionId: 'aaaaaaaa-5000-4000-8000-000000000001',
  applicationId: 'aaaaaaaa-7000-4000-8000-000000000001',
  expectedCurrentApplicationId: null,
  expectedReferenceRevision: 1,
  expectedPlanningInputRevision: 0,
  applicationContentDigestSha256: '7'.repeat(64),
  applicationContextHashSha256: '8'.repeat(64),
  targetUnderstandingPackageDigestSha256: '9'.repeat(64),
  outputFrameConfirmation: frame,
  idempotencyKeyHashSha256: 'a'.repeat(64),
  requestedAt: '2026-07-21T12:01:00.000Z',
})

const fixturePath = resolve('database/canonical-v3-local/tests/_fixture.sql')
readFileSync(fixturePath)
const sqlRequest = JSON.stringify(request).replaceAll("'", "''")
const proofSql = String.raw`
\set ON_ERROR_STOP on
begin;
\i '${fixturePath.replaceAll("'", "''")}'
set local role authenticated;
do $claims$
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
    true
  );
end;
$claims$;
create temporary table local_rpc_proof (receipt jsonb not null) on commit drop;
insert into local_rpc_proof (receipt)
select lifecycle_receipt
from public.mutate_edit_reference_application_lifecycle_v3(
  'edit-reference-production-persistence-contract-v6',
  '${sqlRequest}'::jsonb
) lifecycle_receipt;
select jsonb_build_object(
  'receipt', local_rpc_proof.receipt,
  'read', authority_read.read_result
)::text
from local_rpc_proof
cross join lateral public.read_exact_edit_reference_application_state_v2(
  'edit-reference-production-persistence-contract-v6',
  'edit-reference-production-planning-authority-read-v2',
  '{"actorUserId":"11111111-1111-4111-8111-111111111111","workspaceId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","projectId":"aaaaaaaa-1000-4000-8000-000000000001","editSessionId":"aaaaaaaa-2000-4000-8000-000000000001"}'::jsonb
) authority_read(read_result);
rollback;
`
const psqlOutput = execFileSync(
  process.env.PSQL_BIN ?? 'psql',
  [databaseUrl, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'],
  { input: proofSql, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
).trim()
const proof = JSON.parse(psqlOutput) as { receipt: unknown; read: unknown }

const calls: string[] = []
const proofClient: EditReferenceProductionRpcClient = {
  async rpc(functionName) {
    calls.push(functionName)
    if (functionName === 'mutate_edit_reference_application_lifecycle_v3') {
      return { data: [proof.receipt], error: null }
    }
    if (functionName === 'read_exact_edit_reference_application_state_v2') {
      return { data: [proof.read], error: null }
    }
    return { data: null, error: { code: 'UNEXPECTED_LOCAL_RPC' } }
  },
}
const capability = createEditReferenceLocalSupabaseRpcCapability({
  client: proofClient,
  endpointOrigin: 'http://127.0.0.1:57431',
})
const adapter = createEditReferenceLocalSupabaseRpcAdapter({ client: proofClient, capability })
const receipt = await adapter.mutateApplicationLifecycle(request)
const read = await adapter.planningAuthorityReader.readExactApplicationState({
  actorUserId: request.actorUserId,
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
})

const validatedResultChecks = {
  receiptMutation: receipt.mutation,
  readCurrentState: read.currentState,
  receiptDigestMatchesRead: read.lifecycleReceipt?.receiptDigestSha256 === receipt.receiptDigestSha256,
  rpcCallOrder: calls.join('|'),
  loopbackOnly: adapter.loopbackOnly,
  remoteDatabaseMutationAllowed: adapter.remoteDatabaseMutationAllowed,
  productionAuthority: adapter.productionAuthority,
}
if (
  receipt.mutation !== 'apply'
  || read.currentState !== 'connected'
  || read.lifecycleReceipt?.receiptDigestSha256 !== receipt.receiptDigestSha256
  || calls.join('|') !== 'mutate_edit_reference_application_lifecycle_v3|read_exact_edit_reference_application_state_v2'
  || adapter.loopbackOnly !== true
  || adapter.remoteDatabaseMutationAllowed !== false
  || adapter.productionAuthority !== false
) throw new Error(`local_rpc_smoke_validated_result_invalid:${JSON.stringify(validatedResultChecks)}`)

let productionRejected = false
try {
  assertEditReferenceLocalSupabaseRpcAdapterIsNotProduction(adapter)
} catch {
  productionRejected = true
}
if (!productionRejected) throw new Error('local_rpc_smoke_production_promotion_allowed')

let remoteRejected = false
try {
  createEditReferenceLocalSupabaseRpcCapability({
    client: proofClient,
    endpointOrigin: 'https://example.supabase.co',
  })
} catch {
  remoteRejected = true
}
if (!remoteRejected) throw new Error('local_rpc_smoke_remote_endpoint_allowed')

console.log(JSON.stringify({
  ok: true,
  schemaVersion: adapter.schemaVersion,
  validatedRpcCalls: calls,
  sqlReceiptDigestSha256: receipt.receiptDigestSha256,
  currentState: read.currentState,
  localOnly: true,
  productionAuthority: false,
}, null, 2))
