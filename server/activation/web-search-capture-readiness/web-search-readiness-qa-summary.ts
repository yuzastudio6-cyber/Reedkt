import { webSearchCaptureReadinessQaGateIds, webSearchCaptureReadinessRequiredScripts, webSearchCaptureReadinessSafetyFlags, validateWebSearchCaptureReadinessStaticPolicy } from './web-search-capture-readiness-policy'
import { summarizeArtifactPrivacy } from './web-search-artifact-verifier'
import type {
  WebSearchArtifactVerificationEntry,
  WebSearchEvidenceChain,
  WebSearchProviderGateAudit,
  WebSearchReadinessQaGate,
  WebSearchReadinessQaSummary,
  WebSearchServiceAccessAudit,
} from './web-search-capture-readiness-types'
import { existsSync, readFileSync } from 'node:fs'

export function buildWebSearchReadinessQaSummary(input: {
  evidenceChain: WebSearchEvidenceChain
  providerGateAudit: WebSearchProviderGateAudit
  artifactVerification: WebSearchArtifactVerificationEntry[]
  serviceAccessAudit: WebSearchServiceAccessAudit
  docsConsistent: boolean
  executionBlockers?: string[]
  executionWarnings?: string[]
}): WebSearchReadinessQaSummary {
  const policy = validateWebSearchCaptureReadinessStaticPolicy()
  const artifactPrivacy = summarizeArtifactPrivacy(input.artifactVerification)
  const scriptsPresent = packageScriptsPresent([...webSearchCaptureReadinessRequiredScripts])
  const phaseEvidenceOk = input.evidenceChain.trackStatus === 'ready_for_internal_testing'
    && input.evidenceChain.phases.length === 7
    && input.evidenceChain.phases.every((phase) => phase.blockers.length === 0)
  const serviceReady = input.serviceAccessAudit.exists
    && !input.serviceAccessAudit.allUsersPresent
    && !input.serviceAccessAudit.allAuthenticatedUsersPresent
    && !input.serviceAccessAudit.publicUnauthenticatedAccess
    && input.serviceAccessAudit.blockers.length === 0
  const providerScope = input.providerGateAudit.defaultProvider === 'searxng'
    && input.providerGateAudit.privateSearxngRequired
    && !input.providerGateAudit.publicSearxngInstancesAllowed
    && !input.providerGateAudit.paidProvidersAllowed
    && !input.providerGateAudit.providerFallbackAllowed
  const frontendSafe = !input.providerGateAudit.frontendSecretsAllowed && input.providerGateAudit.workerOnlyRuntimeRequired
  const blockedFlagsOk = policy.ok
  const gates: WebSearchReadinessQaGate[] = [
    gate('phase_evidence_chain', phaseEvidenceOk, 'Phase 49A-49G evidence exists, is completed/approved, and has no active blockers.'),
    gate('private_searxng_ready', serviceReady, 'Private authenticated SearXNG Cloud Run service exists and has no public invoker principal.'),
    gate('provider_scope_integrity', providerScope, 'SearXNG remains default; paid providers, public instances, and provider fallback remain disabled.'),
    gate('controlled_search_scope', !webSearchCaptureReadinessSafetyFlags.liveSearchDuringPhase49H && !webSearchCaptureReadinessSafetyFlags.broadCrawlingAllowed, 'Phase 49H is bounded/internal evidence audit only; no new search or broad crawling runs.'),
    gate('capture_scope_integrity', !webSearchCaptureReadinessSafetyFlags.browserCaptureDuringPhase49H && !webSearchCaptureReadinessSafetyFlags.arbitraryUrlCaptureAllowed, 'Allowlisted capture evidence is audited only; new browser capture and arbitrary URL capture are blocked.'),
    gate('extraction_scope_integrity', !webSearchCaptureReadinessSafetyFlags.readabilityExtractionDuringPhase49H, 'Readability extraction evidence is audited only; new extraction is blocked.'),
    gate('artifact_privacy', artifactPrivacy.passed, 'All required artifacts use private GCS paths and no signed/public URL source of truth.'),
    gate('frontend_secret_safety', frontendSafe, 'Frontend remains display-only with no provider secrets or heavy capture execution.'),
    gate('failure_policy', blockedFlagsOk, 'Failure policy is fail-closed and does not permit public/paid/arbitrary fallbacks.'),
    gate('readiness_docs_consistency', input.docsConsistent && scriptsPresent, 'Readiness docs and package scripts expose Phase 49H internal-readiness-only status.'),
    gate('blocked_features', blockedFlagsOk, 'Production, beta, paid providers, public SearXNG, broad crawling, public artifacts, and final delivery remain blocked.'),
  ]
  const blockers = [
    ...input.evidenceChain.blockers,
    ...input.providerGateAudit.blockers,
    ...input.serviceAccessAudit.blockers,
    ...artifactPrivacy.blockers,
    ...policy.blockers,
    ...(input.docsConsistent ? [] : ['Phase 49H readiness docs are missing or inconsistent.']),
    ...(scriptsPresent ? [] : ['Phase 49H package scripts are missing.']),
    ...(input.executionBlockers ?? []),
    ...gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} did not pass.`),
  ]
  const warnings = [
    ...input.evidenceChain.warnings,
    ...input.providerGateAudit.warnings,
    ...input.serviceAccessAudit.warnings,
    ...artifactPrivacy.warnings,
    ...policy.warnings,
    ...(input.executionWarnings ?? []),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: typeof webSearchCaptureReadinessQaGateIds[number], passed: boolean, summary: string): WebSearchReadinessQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function packageScriptsPresent(scripts: string[]): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return scripts.every((script) => Boolean(packageJson.scripts?.[script]))
}
