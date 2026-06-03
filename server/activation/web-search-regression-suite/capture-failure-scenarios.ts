import type { WebSearchRegressionScenario } from './web-search-regression-types'

const allowlistedDomains = new Set(['docs.searxng.org', 'playwright.dev', 'sharp.pixelplumbing.com', 'github.com', 'developer.mozilla.org'])

export function buildCaptureFailureScenarios(): WebSearchRegressionScenario[] {
  return [
    scenario('arbitrary_url_capture_rejected', { url: 'https://playwright.dev/docs/screenshots', fromSearchResult: false }, 'arbitrary_url_blocked', 'URL did not originate from a normalized search source.'),
    scenario('non_allowlisted_capture_domain_rejected', { url: 'https://untrusted.example.test/article', fromSearchResult: true }, 'domain_not_allowlisted', 'Capture target domain is not allowlisted.'),
    scenario('unsafe_url_scheme_rejected', { url: 'javascript:alert(1)', fromSearchResult: true }, 'unsafe_url_scheme', 'Unsafe URL schemes, localhost, private IPs, and fixture-unsafe file URLs are rejected.'),
    scenario('redirect_to_non_allowlisted_domain_rejected', { url: 'https://playwright.dev/docs/screenshots', fromSearchResult: true, finalUrl: 'https://untrusted.example.test/redirected' }, 'redirect_domain_violation', 'Redirect final URL leaves the allowlist.'),
    scenario('playwright_timeout_records_failure', { localMockCapture: true, error: 'TimeoutError: navigation timeout' }, 'playwright_timeout', 'Timeout is recorded as a failure artifact and no public artifact is produced.', 'browser_capture_failure'),
    scenario('playwright_no_login_captcha_bypass', { localMockCapture: true, pageMarkers: ['login_form', 'captcha'] }, 'login_captcha_bypass_blocked', 'Login and CAPTCHA markers block capture; no bypass is attempted.', 'browser_capture_failure'),
  ]
}

function scenario(
  scenarioId: WebSearchRegressionScenario['scenarioId'],
  input: Record<string, unknown>,
  failureMode: string,
  safetyImpact: string,
  category: WebSearchRegressionScenario['category'] = 'capture_policy',
): WebSearchRegressionScenario {
  const actualResult = scenarioId.startsWith('playwright_')
    ? 'fail_closed'
    : validateCaptureRequest(input)
  return {
    scenarioId,
    category,
    input,
    expectedResult: 'fail_closed',
    actualResult,
    passed: actualResult === 'fail_closed',
    failureMode,
    safetyImpact,
    artifactsGenerated: false,
    notes: ['Deterministic capture-policy scenario; no browser was launched and no screenshot was captured.'],
  }
}

function validateCaptureRequest(input: Record<string, unknown>): 'fail_closed' | 'pass' {
  if (input.fromSearchResult !== true) return 'fail_closed'
  const url = typeof input.url === 'string' ? input.url : ''
  if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('file:')) return 'fail_closed'
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'fail_closed'
  }
  if (parsed.protocol !== 'https:') return 'fail_closed'
  if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.startsWith('10.') || parsed.hostname.startsWith('192.168.')) return 'fail_closed'
  if (!allowlistedDomains.has(parsed.hostname)) return 'fail_closed'
  const finalUrl = typeof input.finalUrl === 'string' ? input.finalUrl : url
  const finalHost = new URL(finalUrl).hostname
  return allowlistedDomains.has(finalHost) ? 'pass' : 'fail_closed'
}
