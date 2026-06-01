import type { WebSearchProviderScope } from './web-search-capture-approval-types'

export function buildWebSearchProviderScope(): WebSearchProviderScope {
  return {
    searxngPlanningAllowed: true,
    playwrightPlanningAllowed: true,
    sharpPlanningAllowed: true,
    readabilityPlanningAllowed: true,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    screenshotProcessingAllowed: false,
    readabilityExtractionAllowed: false,
    braveSearchAllowed: false,
    tavilyAllowed: false,
    exaAllowed: false,
    firecrawlAllowed: false,
    hostedBrowserAllowed: false,
    providerAllowed: false,
    frontendHoldsSearchSecrets: false,
    frontendRunsHeavyBrowserAutomation: false,
    workerExecutesRawChat: false,
    approvedPlanSnapshotsRequired: true,
    publicArtifactAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    captchaBypassAllowed: false,
    loginBypassAllowed: false,
    paywallBypassAllowed: false,
    robotsTermsBypassAllowed: false,
  }
}
