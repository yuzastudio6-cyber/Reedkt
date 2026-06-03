import { existsSync, readFileSync } from 'node:fs'
import { braveSearchQaGateIds, braveSearchRequiredDocs, braveSearchRequiredScripts, validateBraveSearchFallbackStaticPolicy } from './brave-search-fallback-policy'
import type {
  BraveSearchCommandPlan,
  BraveSearchCostPolicy,
  BraveSearchProviderEvidence,
  BraveSearchQaGate,
  BraveSearchQaSummary,
  BraveSearchSecretPolicy,
  BraveSearchStorageRightsPolicy,
  SearchProviderRouterModePolicy,
  SearxngConfidenceResult,
} from './brave-search-fallback-types'

export function buildBraveSearchQaSummary(input: {
  evidence: BraveSearchProviderEvidence
  costPolicy: BraveSearchCostPolicy
  secretPolicy: BraveSearchSecretPolicy
  storageRightsPolicy: BraveSearchStorageRightsPolicy
  confidenceExamples: SearxngConfidenceResult[]
  providerRouterModes: SearchProviderRouterModePolicy[]
  commandPlan: BraveSearchCommandPlan[]
}): BraveSearchQaSummary {
  const staticPolicy = validateBraveSearchFallbackStaticPolicy()
  const scriptsPresent = packageScriptsPresent([...braveSearchRequiredScripts])
  const docsPresent = braveSearchRequiredDocs.every((doc) => existsSync(doc))
  const secretTextSafe = trackedTextHasNoSecretValue()
  const defaultProviderOk = input.providerRouterModes.some((mode) => mode.mode === 'searxng_only' && mode.defaultMode && mode.allowedInPhase49J)
    && input.evidence.defaultEnabled === false
    && input.evidence.providerAllowedInPhase49J === false
  const costOk = input.costPolicy.braveSearchEnabledDefault === false
    && input.costPolicy.dailyLimitDefault === 0
    && input.costPolicy.monthlyBudgetUsdDefault === 0
    && input.costPolicy.maxResults === 5
    && input.costPolicy.maxQueriesPerRun === 1
    && input.costPolicy.unboundedRetriesAllowed === false
  const storageOk = input.storageRightsPolicy.storeRawBraveResponseDefault === false
    && input.storageRightsPolicy.storeBraveSnippetsDefault === false
    && input.storageRightsPolicy.rawPersistenceRequiresStorageRights
  const confidenceOk = input.confidenceExamples.some((result) => result.confidenceLevel === 'high' && !result.braveFallbackRecommended)
    && input.confidenceExamples.some((result) => result.confidenceLevel === 'low' && result.braveFallbackRecommended)
  const routerOk = input.providerRouterModes.length === 4
    && input.providerRouterModes.filter((mode) => mode.allowedInPhase49J).every((mode) => mode.mode === 'searxng_only')
    && input.providerRouterModes.every((mode) => mode.braveExecutionAllowed === false)
  const paidProviderBlocked = input.evidence.liveApiCallAllowedInPhase49J === false
    && input.commandPlan.every((command) => command.commandId !== 'brave-live-api-call' || command.allowedInPhase49J === false)

  const gates: BraveSearchQaGate[] = [
    gate('brave_provider_evidence', input.evidence.endpoint.includes('/web/search') && input.evidence.apiAuthHeader === 'X-Subscription-Token' && input.evidence.pricingKnown && input.evidence.storageRightsRequiredForRawPersistence, 'Brave endpoint, auth header, pricing, free credits, and storage-rights evidence are recorded.'),
    gate('default_provider_integrity', defaultProviderOk, 'SearXNG remains default and Brave is disabled by default.'),
    gate('secret_safety', input.secretPolicy.frontendExposureAllowed === false && input.secretPolicy.loggingAllowed === false && secretTextSafe, 'Only the Brave secret name is documented; no value is stored, logged, or exposed to frontend.'),
    gate('cost_policy', costOk, 'Budget defaults block Brave execution and future result/query limits are bounded.'),
    gate('storage_rights_policy', storageOk, 'Raw Brave response and snippet persistence are blocked unless storage rights are approved.'),
    gate('confidence_policy', confidenceOk, 'SearXNG confidence scoring and fallback reason codes exist.'),
    gate('provider_router_policy', routerOk, 'Provider modes exist and only searxng_only is allowed in Phase 49J.'),
    gate('paid_provider_blocked', paidProviderBlocked, 'No Brave API call or other paid provider call is allowed in Phase 49J.'),
    gate('blocked_features', staticPolicy.ok && scriptsPresent && docsPresent, 'Live search, browser capture, extraction, GCP mutation, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...staticPolicy.blockers,
    ...(scriptsPresent ? [] : ['Required Phase 49J package scripts are missing.']),
    ...(docsPresent ? [] : ['Required Phase 49J docs are missing.']),
    ...(secretTextSafe ? [] : ['A Brave API key-like value appears in tracked policy text.']),
    ...gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} did not pass.`),
  ]
  const warnings = [
    ...staticPolicy.warnings,
    ...input.storageRightsPolicy.warnings,
    'Phase 49K may use Brave-shaped fixtures only; live Brave API execution remains blocked until a later explicit secret-backed phase.',
  ]

  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: typeof braveSearchQaGateIds[number], passed: boolean, summary: string): BraveSearchQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function packageScriptsPresent(scripts: string[]): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return scripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function trackedTextHasNoSecretValue(): boolean {
  const files = [
    'server/activation/brave-search-fallback-policy/brave-search-secret-policy.ts',
    'docs/activation-brave-search-fallback-policy.md',
    'docs/activation-brave-search-fallback-policy-runbook.md',
  ]
  return files.every((file) => {
    if (!existsSync(file)) return true
    const text = readFileSync(file, 'utf8')
    return !/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(text) && !/X-Subscription-Token:\s*(?!<)[A-Za-z0-9_-]{12,}/.test(text)
  })
}
