import type { WebSearchCommandPlan } from './web-search-capture-approval-types'

export function buildWebSearchCommandPlans(): WebSearchCommandPlan[] {
  return [
    plan('phase49b-searxng-endpoint-validation', '49B', 'SearXNG endpoint validation', 'TEXT ONLY: validate a future private SearXNG endpoint variable against a generated/static search fixture.'),
    plan('phase49b-generated-search-fixture', '49B', 'Generated search fixture', 'TEXT ONLY: create deterministic source-result records without public web requests.'),
    plan('phase49c-playwright-capture-fixture', '49C', 'Playwright capture fixture', 'TEXT ONLY: launch a browser only against a local generated page in a later approved phase.'),
    plan('phase49c-sharp-post-processing-fixture', '49C', 'Sharp post-processing fixture', 'TEXT ONLY: resize/crop/contact-sheet a future generated screenshot fixture.'),
    plan('phase49d-readability-extraction-fixture', '49D', 'Readability extraction fixture', 'TEXT ONLY: extract title/text/metadata from a local static HTML fixture and sanitize output.'),
    plan('phase49e-controlled-search-capture-e2e', '49E', 'Controlled search/capture private E2E', 'TEXT ONLY: use approved private SearXNG endpoint, bounded result count, allowlist/domain policy, private screenshots, source manifest, and citations.'),
  ]
}

function plan(commandId: string, phase: WebSearchCommandPlan['phase'], purpose: string, commandText: string): WebSearchCommandPlan {
  return {
    commandId,
    phase,
    purpose,
    textOnlyByDefault: true,
    allowedInPhase49A: false,
    blockedReason: 'Phase 49A is approval/planning only and does not execute search, browser capture, Docker, GCP, provider calls, public web requests, screenshots, or extraction.',
    executableCommand: null,
    commandText,
  }
}
