import { existsSync, readFileSync } from 'node:fs'
import type { RuntimeUnlockSourceAudit } from './runtime-unlock-roadmap-types'
import { runtimeUnlockConfig } from './runtime-unlock-roadmap-policy'

const requiredContracts = [
  'README.md',
  'AGENTS.md',
  'docs/cross-chat/README.md',
  'docs/cross-chat/owner-response-tracking-ledger.md',
  'docs/agents/reeditpro-agent-architecture.md',
  'docs/agents/source-of-truth-policy.md',
  'docs/activation-phase-52h-cross-workstream-handoff-tracking-results.md',
  'server/activation/cross-workstream-handoff-tracking',
  'server/activation/controlled-internal-test-go-no-go',
  'server/activation/supabase-milestone-sync',
  'package.json',
  'server/activation/index.ts',
] as const

const optionalFoundationDocs = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/production-architecture-freeze.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/future-worker-lanes.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/provider-gateway-foundation.md',
  'docs/render-preview-export-foundation.md',
  'docs/media-readiness-probe-timing-foundation.md',
  'docs/compliance-license-security-review-foundation.md',
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
] as const

export function buildRuntimeUnlockSourceAudit(): RuntimeUnlockSourceAudit {
  const required = Object.fromEntries(requiredContracts.map((contract) => [contract, existsSync(contract)]))
  const optional = Object.fromEntries(optionalFoundationDocs.map((doc) => [doc, existsSync(doc)]))
  const blockers = Object.entries(required).filter(([, present]) => !present).map(([contract]) => `Missing required Phase 53A source contract: ${contract}.`)
  const warnings = Object.entries(optional).filter(([, present]) => !present).map(([doc]) => `${doc} is absent on this activation base and recorded as an audit gap.`)
  const phase52HText = safeRead('docs/activation-phase-52h-cross-workstream-handoff-tracking-results.md')
  const phase52HEvidencePresent = phase52HText.includes(runtimeUnlockConfig.canonicalPhase52HRunId) && phase52HText.includes('Status: completed') && phase52HText.includes('Supabase milestone sync')
  if (!phase52HEvidencePresent) blockers.push(`Phase 52H evidence for ${runtimeUnlockConfig.canonicalPhase52HRunId} is missing or incomplete.`)
  const duplicateRuntimeUnlockImplementationDetected = existsSync('server/activation/runtime-unlock-roadmap') && existsSync('docs/runtime-unlock')
  return {
    auditId: 'phase53a_repo_ownership_audit',
    phase52HRunId: runtimeUnlockConfig.canonicalPhase52HRunId,
    phase52HEvidencePresent,
    phase52HStatus: phase52HEvidencePresent ? 'completed' : 'missing',
    phase52HSupabaseSync: phase52HText.includes('Supabase milestone sync: completed') || phase52HText.includes('Supabase milestone sync') ? 'completed' : 'unknown',
    requiredContracts: required,
    optionalFoundationDocs: optional,
    ownershipFindings: [
      'Phase 53A is owned by shared coordination / runtime unlock planning.',
      'Phase 53A defines unlock tracks and owner repo-audit prompts only.',
      'Owner implementation, runtime execution, schema/RLS changes, providers, workers, and production/beta unlocks remain out of scope.',
    ],
    duplicateRuntimeUnlockImplementationDetected,
    blockers,
    warnings,
  }
}

function safeRead(path: string): string {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}
