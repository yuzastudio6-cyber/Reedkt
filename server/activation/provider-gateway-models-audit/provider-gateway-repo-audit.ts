import { existsSync, readFileSync } from 'node:fs'
import type { ProviderGatewayRepoAudit, ProviderGatewayRepoSurface } from './provider-gateway-models-audit-types'

const sourceSurfaces: Array<Omit<ProviderGatewayRepoSurface, 'present' | 'finding'>> = [
  { path: 'README.md', category: 'required_contract' },
  { path: 'AGENTS.md', category: 'required_contract' },
  { path: 'docs/runtime-unlock/runtime-unlock-roadmap.md', category: 'required_contract' },
  { path: 'docs/runtime-unlock/blocked-scope-policy.md', category: 'required_contract' },
  { path: 'docs/runtime-unlock/owner-repo-audit-prompts.md', category: 'required_contract' },
  { path: 'docs/cross-chat/README.md', category: 'required_contract' },
  { path: 'docs/agents/tool-ownership-map.md', category: 'required_contract' },
  { path: 'docs/agents/source-of-truth-policy.md', category: 'required_contract' },
  { path: 'docs/google-cloud/RP-GCP-03-provider-gateway-skeleton.md', category: 'required_contract' },
  { path: 'docs/google-cloud/RP-PROVIDER-VERIFY-01-provider-secret-verification.md', category: 'optional_context' },
  { path: 'docs/provider-gateway-foundation.md', category: 'optional_context' },
  { path: 'docs/tool-call-foundation.md', category: 'optional_context' },
  { path: 'docs/worker-claim-execution-contract-hardening.md', category: 'optional_context' },
  { path: 'docs/observability-audit-abuse-cost-foundation.md', category: 'optional_context' },
  { path: 'docs/compliance-license-security-review-foundation.md', category: 'optional_context' },
  { path: 'docs/supabase-milestone-sync-policy.md', category: 'optional_context' },
  { path: 'docs/supabase-success-milestone-reporting-standard.md', category: 'optional_context' },
  { path: 'src/backend/cloud/provider-gateway-contracts.ts', category: 'implementation_surface' },
  { path: 'src/backend/providers/gateway/provider-gateway-service.ts', category: 'implementation_surface' },
  { path: 'server/services/provider-gateway-service.ts', category: 'implementation_surface' },
  { path: 'server/routes/provider-gateway-routes.ts', category: 'implementation_surface' },
  { path: 'server/config/env.ts', category: 'implementation_surface' },
  { path: 'server/cost-controls/provider-cost-policy.ts', category: 'implementation_surface' },
  { path: 'server/activation/tool-capability-registry-audit/canonical-tool-capability-records.ts', category: 'implementation_surface' },
  { path: 'server/activation/supabase-milestone-sync', category: 'implementation_surface' },
]

export function buildProviderGatewayRepoAudit(): ProviderGatewayRepoAudit {
  const surfaces = sourceSurfaces.map((surface): ProviderGatewayRepoSurface => {
    const present = existsSync(surface.path)
    return {
      ...surface,
      present,
      finding: present ? `${surface.path} is present for PROVIDER-0 audit.` : `${surface.path} is absent; record as an audit gap, not an implementation blocker unless required.`,
    }
  })
  const requiredMissing = surfaces.filter((surface) => surface.category === 'required_contract' && !surface.present).map((surface) => surface.path)
  const providerGatewayContracts = readOptional('src/backend/cloud/provider-gateway-contracts.ts')
  const providerGatewayService = readOptional('server/services/provider-gateway-service.ts')
  const costPolicy = readOptional('server/cost-controls/provider-cost-policy.ts')
  const envConfig = readOptional('server/config/env.ts')
  const runtimeUnlockDocsPresent = existsSync('docs/runtime-unlock/runtime-unlock-roadmap.md') && existsSync('docs/runtime-unlock/blocked-scope-policy.md')
  const providerGatewayMockOnly = /mock_only|real_provider_blocked|Real provider calls are disabled/i.test(providerGatewayContracts + providerGatewayService)
  const realProviderCallsBlocked = /REAL_PROVIDER_CALLS_DISABLED|providersBlockedByDefault:\s*true|providerCallsAllowed\(\)[^{]+{\s*return false/i.test(providerGatewayService + costPolicy)
  const providerGatewayRoutesPresent = existsSync('server/routes/provider-gateway-routes.ts')
  const providerGatewayConfigPresent = /GOOGLE_SECRET_OPENAI_API_KEY_NAME/.test(envConfig) && !/GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME|GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME/.test(envConfig)
  const blockers = requiredMissing.map((repoPath) => `Required source contract missing: ${repoPath}.`)
  const warnings: string[] = []
  if (!providerGatewayConfigPresent) warnings.push('Provider secret env config has no Qwen/DeepSeek reference names yet; PROVIDER-0 intentionally does not add them.')
  return {
    auditId: 'provider0_provider_gateway_repo_audit',
    workstream: 'PROVIDER_GATEWAY_MODELS',
    phase53ARunId: 'phase53a-20260606T171318',
    providerGatewayMockOnly,
    realProviderCallsBlocked,
    providerGatewayRoutesPresent,
    providerGatewayConfigPresent,
    approvedPlanSnapshotRequiredForFutureExecution: /approvedPlanSnapshotId/.test(providerGatewayContracts),
    rawPromptExecutionBlocked: runtimeUnlockDocsPresent,
    signedUrlSourceOfTruthBlocked: runtimeUnlockDocsPresent,
    sourceSurfaces: surfaces,
    findings: [
      'Existing provider gateway contracts are media/generation-route oriented and do not expose Qwen or DeepSeek model routes yet.',
      'Existing server provider gateway service remains fail-closed for real provider calls.',
      'Existing cost controls keep providers blocked by default with zero budgets.',
      'Approved plan snapshots remain the future execution source; raw prompt direct execution is not an accepted runtime path.',
      'Qwen/DeepSeek secret reference env names should be introduced only in a later metadata/secret fixture phase.',
    ],
    blockers,
    warnings,
  }
}

function readOptional(repoPath: string): string {
  try {
    return readFileSync(repoPath, 'utf8')
  } catch {
    return ''
  }
}
