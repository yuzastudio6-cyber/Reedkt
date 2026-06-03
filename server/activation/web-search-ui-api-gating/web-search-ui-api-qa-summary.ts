import { existsSync, readFileSync } from 'node:fs'
import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness'
import { validateWebSearchUiApiStaticPolicy, webSearchUiApiQaGateIds, webSearchUiApiRequiredScripts } from './web-search-ui-api-gating-policy'
import type {
  WebSearchUiApiArtifact,
  WebSearchUiApiQaGate,
  WebSearchUiApiQaSummary,
  WebSearchUiApiRouteAudit,
  WebSearchUiApiUxState,
  WebSearchUiApiValidationResult,
} from './web-search-ui-api-gating-types'

export function buildWebSearchUiApiQaSummary(input: {
  routeAudit: WebSearchUiApiRouteAudit
  requestValidation: WebSearchUiApiValidationResult
  uxState: WebSearchUiApiUxState
  docsConsistent: boolean
  artifacts?: WebSearchUiApiArtifact[]
  executionBlockers?: string[]
  executionWarnings?: string[]
}): WebSearchUiApiQaSummary {
  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  const policy = validateWebSearchUiApiStaticPolicy()
  const scriptsPresent = packageScriptsPresent([...webSearchUiApiRequiredScripts])
  const artifactPrivacy = (input.artifacts ?? []).every((artifact) =>
    artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.startsWith('http'),
  )
  const providerGateOk = input.requestValidation.request?.providerMode === 'private_fixture_provider' &&
    input.requestValidation.request?.paidProvidersAllowed === false &&
    input.requestValidation.request?.publicSearxngAllowed === false
  const noLive = input.requestValidation.request?.liveSearchRequested === false &&
    input.requestValidation.request?.captureRequested === false &&
    input.requestValidation.request?.extractionRequested === false
  const gates: WebSearchUiApiQaGate[] = [
    gate('phase49h_evidence', phase49H.status === 'completed' && phase49H.webSearchCaptureInternalTestingReady && phase49H.runId === 'phase49h-20260603T020009', 'Canonical Phase 49H evidence is present and ready for internal UI/API gating.'),
    gate('api_route_gating', input.routeAudit.allRoutesGateOnly && input.routeAudit.blockers.length === 0, 'Internal web search API routes are authenticated, internal-only, and gate-only.'),
    gate('request_validation', input.requestValidation.ok, 'Request validator rejects paid providers, public SearXNG, arbitrary URLs, raw prompt execution, broad crawling, public artifacts, signed URLs, production/beta flags, and frontend/browser execution.'),
    gate('provider_gate_integrity', providerGateOk, 'SearXNG remains the default provider and Phase 49I accepts only private fixture provider mode.'),
    gate('ui_scope_integrity', input.uxState.internalUxReady && input.uxState.frontendHeavyExecutionAllowed === false, 'Chat-native UX gate is internal-only and does not expose live execution controls.'),
    gate('frontend_secret_safety', input.uxState.frontendSecretSafe, 'Frontend remains secret-free and display/gate-only.'),
    gate('no_live_search_or_capture', policy.ok && noLive, 'Phase 49I does not run live search, browser capture, Sharp processing, or Readability extraction.'),
    gate('artifact_privacy', artifactPrivacy, 'Phase 49I artifacts are private GCS JSON paths only.'),
    gate('docs_scripts_consistency', input.docsConsistent && scriptsPresent, 'Docs and package scripts expose Phase 49I UI/API gating status.'),
    gate('blocked_features', policy.ok, 'Production, beta, paid providers, public SearXNG, arbitrary URL capture, broad crawling, public artifacts, and signed URL source-of-truth remain blocked.'),
  ]
  const blockers = [
    ...phase49H.blockers,
    ...input.routeAudit.blockers,
    ...input.requestValidation.blockers,
    ...input.uxState.blockers,
    ...policy.blockers,
    ...(input.docsConsistent ? [] : ['Phase 49I docs are missing or inconsistent.']),
    ...(scriptsPresent ? [] : ['Phase 49I package scripts are missing.']),
    ...(artifactPrivacy ? [] : ['Phase 49I artifacts are not all private GCS JSON paths.']),
    ...(input.executionBlockers ?? []),
    ...gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} did not pass.`),
  ]
  const warnings = [
    ...phase49H.warnings,
    ...input.routeAudit.warnings,
    ...input.requestValidation.warnings,
    ...input.uxState.warnings,
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

function gate(gateId: typeof webSearchUiApiQaGateIds[number], passed: boolean, summary: string): WebSearchUiApiQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function packageScriptsPresent(scripts: string[]): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return scripts.every((script) => Boolean(packageJson.scripts?.[script]))
}
