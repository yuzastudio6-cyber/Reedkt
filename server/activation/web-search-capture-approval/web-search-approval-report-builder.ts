import { existsSync, readFileSync } from 'node:fs'
import { webSearchCaptureQaGateIds, webSearchCaptureApprovalConfig, webSearchCaptureRequiredScripts, validateWebSearchCaptureApprovalStaticEnv } from './web-search-capture-approval-policy'
import { buildWebSearchCommandPlans } from './web-search-command-plan'
import { buildWebSearchFutureScope } from './web-search-future-scope'
import { buildWebSearchLicenseReviews } from './web-search-license-review'
import { buildWebSearchProviderScope } from './web-search-provider-scope'
import { buildWebSearchRiskRegister } from './web-search-risk-register'
import { buildWebSearchToolEvidence } from './web-search-tool-evidence'
import type { WebSearchCaptureApprovalReport, WebSearchCaptureQaGate, WebSearchCaptureQaSummary } from './web-search-capture-approval-types'

const requiredDefaultToolIds = ['searxng', 'playwright', 'sharp', 'mozilla-readability'] as const
const optionalPaidProviderIds = ['brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase'] as const

export function buildWebSearchCaptureApprovalReport(): WebSearchCaptureApprovalReport {
  const tools = buildWebSearchToolEvidence()
  const licenseReviews = buildWebSearchLicenseReviews()
  const providerScope = buildWebSearchProviderScope()
  const risks = buildWebSearchRiskRegister()
  const futureScope = buildWebSearchFutureScope()
  const commandPlans = buildWebSearchCommandPlans()
  const envValidation = validateWebSearchCaptureApprovalStaticEnv()
  const scriptsPresent = packageScriptsPresent([...webSearchCaptureRequiredScripts])
  const qa = buildWebSearchCaptureQaSummary({
    tools,
    licenseReviews,
    providerScope,
    risks,
    futureScope,
    commandPlans,
    scriptsPresent,
    envBlockers: envValidation.blockers,
    envWarnings: envValidation.warnings,
  })
  const status = qa.status === 'passed' ? 'approval_review_complete' : 'blocked_pending_evidence'
  const warnings = Array.from(new Set([
    ...qa.warnings,
    'Phase 49A approves architecture/planning only; live search, browser capture, screenshot processing, extraction runtime, paid providers, public artifacts, and production/beta remain blocked.',
  ]))

  return {
    reportId: 'activation-phase-49a-web-search-capture-approval',
    createdAt: new Date().toISOString(),
    phase: '49A',
    status,
    config: webSearchCaptureApprovalConfig,
    tools,
    licenseReviews,
    providerScope,
    risks,
    futureScope,
    commandPlans,
    codexDecision: 'staging_planning_approved_free_open_source_default',
    recommendedPhase49BPath: 'Start with SearXNG private-instance planning and generated/static search fixtures only; no public scraping, paid APIs, or external beta.',
    phase49BReadiness: qa.status === 'passed' ? 'ready_for_private_generated_fixture_planning_only' : 'blocked',
    qa,
    blockers: qa.blockers,
    warnings,
    searxngPlanningAllowed: providerScope.searxngPlanningAllowed,
    playwrightPlanningAllowed: providerScope.playwrightPlanningAllowed,
    sharpPlanningAllowed: providerScope.sharpPlanningAllowed,
    readabilityPlanningAllowed: providerScope.readabilityPlanningAllowed,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeWebSearchCaptureApprovalReport(report: WebSearchCaptureApprovalReport): string {
  return [
    `Web search/capture approval report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Codex decision: ${report.codexDecision}`,
    `Default stack: ${report.tools.filter((tool) => tool.defaultStack).map((tool) => tool.displayName).join(', ')}`,
    `Optional paid providers disabled: ${report.tools.filter((tool) => tool.optionalPaidProvider).every((tool) => tool.disabledByDefault && !tool.providerAllowed)}`,
    `Phase49B readiness: ${report.phase49BReadiness}`,
    `Live search allowed: ${report.liveSearchAllowed}`,
    `Browser capture allowed: ${report.browserCaptureAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Public artifact allowed: ${report.publicArtifactAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealMediaAllowed}`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Future scope:',
    ...report.futureScope.map((phase) => `- Phase ${phase.phaseId}: ${phase.title}`),
  ].join('\n')
}

export function summarizeWebSearchToolSummary(): string {
  const tools = buildWebSearchToolEvidence()
  return [
    'Web search/capture tool summary',
    ...tools.map((tool) => `- ${tool.displayName}: ${tool.defaultStack ? 'default planning stack' : 'optional/disabled'}; license=${tool.license}; runtime=blocked_in_phase49a`),
  ].join('\n')
}

export function buildWebSearchCaptureQaSummary(input: {
  tools: ReturnType<typeof buildWebSearchToolEvidence>
  licenseReviews: ReturnType<typeof buildWebSearchLicenseReviews>
  providerScope: ReturnType<typeof buildWebSearchProviderScope>
  risks: ReturnType<typeof buildWebSearchRiskRegister>
  futureScope: ReturnType<typeof buildWebSearchFutureScope>
  commandPlans: ReturnType<typeof buildWebSearchCommandPlans>
  scriptsPresent: boolean
  envBlockers: string[]
  envWarnings: string[]
}): WebSearchCaptureQaSummary {
  const toolIds = new Set(input.tools.map((tool) => tool.toolId))
  const defaultToolsPresent = requiredDefaultToolIds.every((toolId) => toolIds.has(toolId))
  const optionalProvidersDisabled = optionalPaidProviderIds.every((toolId) => {
    const tool = input.tools.find((entry) => entry.toolId === toolId)
    return !!tool && tool.disabledByDefault && tool.requiresSecret && tool.optionalPaidProvider && tool.providerAllowed === false
  })
  const licenseReviewPassed = input.licenseReviews.length === input.tools.length && input.licenseReviews.every((review) => review.runtimeDecision === 'blocked_in_phase49a')
  const noRuntime = input.providerScope.liveSearchAllowed === false
    && input.providerScope.browserCaptureAllowed === false
    && input.providerScope.screenshotProcessingAllowed === false
    && input.providerScope.readabilityExtractionAllowed === false
  const frontendSafe = input.providerScope.frontendHoldsSearchSecrets === false
    && input.providerScope.frontendRunsHeavyBrowserAutomation === false
    && input.providerScope.workerExecutesRawChat === false
    && input.providerScope.approvedPlanSnapshotsRequired === true
  const noBypass = input.providerScope.captchaBypassAllowed === false
    && input.providerScope.loginBypassAllowed === false
    && input.providerScope.paywallBypassAllowed === false
    && input.providerScope.robotsTermsBypassAllowed === false
  const riskRegisterComplete = input.risks.some((risk) => risk.severity === 'blocker')
    && input.risks.some((risk) => risk.severity === 'warning')
    && ['captcha_bypass', 'paywall_bypass', 'robots_terms_violation', 'public_artifact_exposure', 'frontend_secret_exposure', 'unsafe_user_supplied_url_capture'].every((riskId) => input.risks.some((risk) => risk.riskId === riskId))
  const futureScopeDefined = ['49B', '49C', '49D', '49E', '49F'].every((phaseId) => input.futureScope.some((phase) => phase.phaseId === phaseId))
    && input.commandPlans.every((plan) => plan.textOnlyByDefault && plan.allowedInPhase49A === false && plan.executableCommand === null)
  const blockedFeatures = input.envBlockers.length === 0
    && noRuntime
    && optionalProvidersDisabled
    && input.providerScope.providerAllowed === false
    && input.providerScope.publicArtifactAllowed === false
    && input.providerScope.signedUrlsAsSourceOfTruthAllowed === false
    && noBypass

  const gates: WebSearchCaptureQaGate[] = [
    gate('tool_evidence', defaultToolsPresent, 'SearXNG, Playwright, Sharp, and Mozilla Readability evidence records are present.'),
    gate('license_review', licenseReviewPassed, 'Every tool has a license/source review and runtime remains blocked in Phase 49A.'),
    gate('free_open_source_default', defaultToolsPresent && input.tools.filter((tool) => tool.defaultStack).every((tool) => !tool.optionalPaidProvider), 'Free/open-source stack is the default path.'),
    gate('paid_provider_disabled', optionalProvidersDisabled, 'Brave, Tavily, Exa, Firecrawl, and hosted browser providers are disabled by default.'),
    gate('frontend_secret_safety', frontendSafe, 'Frontend displays results only and holds no provider/search secrets or heavy browser automation.'),
    gate('no_live_search', input.providerScope.liveSearchAllowed === false, 'Live search is blocked in Phase 49A.'),
    gate('no_browser_execution', input.providerScope.browserCaptureAllowed === false, 'Browser capture and screenshot runtime are blocked in Phase 49A.'),
    gate('no_public_artifacts', input.providerScope.publicArtifactAllowed === false && input.providerScope.signedUrlsAsSourceOfTruthAllowed === false, 'Artifacts remain private and signed URLs are not source of truth.'),
    gate('risk_register_complete', riskRegisterComplete, 'Blocker and warning risks are documented with mitigation and evidence required to clear.'),
    gate('future_scope_defined', futureScopeDefined, 'Phases 49B-49F and text-only future command plans are defined.'),
    gate('package_scripts_present', input.scriptsPresent, 'Phase 49A package scripts are present.'),
    gate('blocked_features', blockedFeatures, 'Production, beta, broad media, providers, Revideo, public artifacts, live search, browser capture, and bypass behavior remain blocked.'),
  ]
  const blockers = [
    ...input.envBlockers,
    ...(defaultToolsPresent ? [] : ['Missing required default tool evidence.']),
    ...(licenseReviewPassed ? [] : ['License/source review is incomplete.']),
    ...(optionalProvidersDisabled ? [] : ['One or more optional paid providers are not disabled by default.']),
    ...(frontendSafe ? [] : ['Frontend secret or heavy capture boundary is unsafe.']),
    ...(noRuntime ? [] : ['A live search/capture/extraction runtime gate is enabled.']),
    ...(input.providerScope.publicArtifactAllowed === false ? [] : ['Public artifacts are enabled.']),
    ...(riskRegisterComplete ? [] : ['Risk register is incomplete.']),
    ...(futureScopeDefined ? [] : ['Future scope or text-only command plans are incomplete.']),
    ...(input.scriptsPresent ? [] : ['Required Phase 49A package scripts are missing.']),
    ...(noBypass ? [] : ['Bypass policy leaves CAPTCHA/login/paywall/robots/terms bypass enabled.']),
  ]
  const warnings = [
    ...input.envWarnings,
    'SearXNG AGPL obligations require production legal review before any hosted runtime exposure.',
    'Optional paid APIs require separate provider approval, secret policy, cost controls, and legal review before any use.',
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function gate(gateId: typeof webSearchCaptureQaGateIds[number], passed: boolean, summary: string): WebSearchCaptureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function packageScriptsPresent(scripts: readonly string[]): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return scripts.every((script) => Boolean(packageJson.scripts?.[script]))
}
