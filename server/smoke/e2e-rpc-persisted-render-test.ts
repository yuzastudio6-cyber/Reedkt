import { loadRuntimeEnv } from '../config/env'
import { runPersistedRenderPipelineViaRpcs } from '../services/e2e-service-role-runtime-service'
import type { ServiceContext } from '../types'

const disabledContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
    SUPABASE_E2E_ALLOW_WRITES: 'false',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-rpc-render-disabled',
  auth: { userId: 'e2e-rpc-render-smoke', isMockUser: true },
}

const liveMissingEnvContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    SUPABASE_E2E_SMOKE_MODE: 'live',
    SUPABASE_E2E_ALLOW_WRITES: 'true',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
  }),
  clients: { admin: null, public: null },
  requestId: 'smoke-e2e-rpc-render-live-missing-env',
  auth: { userId: 'e2e-rpc-render-smoke', isMockUser: true },
}

const rpcInput = {
  workspaceId: '00000000-0000-4000-8000-000000000001',
  projectId: '00000000-0000-4000-8000-000000000002',
  chatSessionId: '00000000-0000-4000-8000-000000000003',
  editPlanId: '00000000-0000-4000-8000-000000000004',
  creditWalletId: '00000000-0000-4000-8000-000000000005',
  creditEstimateId: '00000000-0000-4000-8000-000000000006',
  creditApprovalId: '00000000-0000-4000-8000-000000000007',
  approvedByUserId: '00000000-0000-4000-8000-000000000008',
  sourceStorageObjectId: '00000000-0000-4000-8000-000000000009',
  sourceBucketName: 'local-source-media',
  sourceObjectPath: 'workspaces/00000000-0000-4000-8000-000000000001/projects/00000000-0000-4000-8000-000000000002/source-media/00000000-0000-4000-8000-000000000009/source.mp4',
  idempotencyKey: 'rp-e2e-rpc-render-smoke-test',
}

const disabled = await runPersistedRenderPipelineViaRpcs(disabledContext, rpcInput)
const liveMissingEnv = await runPersistedRenderPipelineViaRpcs(liveMissingEnvContext, rpcInput)
const serialized = JSON.stringify({ disabled, liveMissingEnv })
const checks = [
  disabled.ok && disabled.status === 'disabled' ? 'disabled_rpc_render_skips' : undefined,
  !liveMissingEnv.ok && liveMissingEnv.error?.code === 'missing_env' ? 'live_rpc_render_missing_env_fails_clearly' : undefined,
  !serialized.includes('SUPABASE_SERVICE_ROLE_KEY') && !serialized.includes('service_role_key') ? 'no_secret_names_or_values_in_output' : undefined,
  !serialized.includes('signedUrl') && !serialized.includes('signed_url') ? 'no_signed_url_canonical_output' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, disabled, liveMissingEnv }, null, 2))
if (!ok) process.exitCode = 1
