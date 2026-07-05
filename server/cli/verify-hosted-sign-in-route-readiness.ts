import { chromium } from '@playwright/test'

type HostedSignInRouteDecision =
  | 'hosted_sign_in_route_readiness_passed_ready_for_browser_sign_in_verification'
  | 'hosted_sign_in_route_readiness_blocked_missing_confirmation'
  | 'hosted_sign_in_route_readiness_blocked_missing_url'
  | 'hosted_sign_in_route_readiness_blocked_invalid_url'
  | 'hosted_sign_in_route_readiness_blocked_unreachable'
  | 'hosted_sign_in_route_readiness_blocked_sign_in_surface_missing'
  | 'hosted_sign_in_route_readiness_blocked_internal_testing_handoff_missing'
  | 'hosted_sign_in_route_readiness_blocked_supabase_public_env_missing'
  | 'hosted_sign_in_route_readiness_blocked_unexpected_app_subdomain_reference'

interface HostedSignInRouteResult {
  ok: boolean
  decision: HostedSignInRouteDecision
  message: string
  targetBaseUrl?: string
  targetSignInUrl?: string
  finalUrl?: string
  signInSurfaceFound?: boolean
  internalTestingHandoffFound?: boolean
  supabasePublicEnvConfigured?: boolean
  appSubdomainReferenceFound?: boolean
  authMode: 'hosted_browser_route_readiness_only'
  credentialsSubmitted: false
  serviceRoleUsed: false
  tokenPrinted: false
  passwordPrinted: false
  warnings: string[]
  nextStep: string
}

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE'

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = clean(process.env[key])
    if (value) return value
  }
  return undefined
}

function output(result: HostedSignInRouteResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function normalizeBaseUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      return undefined
    }

    parsed.hash = ''
    parsed.search = ''
    parsed.pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
    return parsed.toString()
  } catch {
    return undefined
  }
}

function signInUrlFor(baseUrl: string): string {
  return new URL('sign-in?redirect=/internal-testing', baseUrl).toString()
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Hosted sign-in route verification failed.'
  return message
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/(access_token|refresh_token|token|apikey|api[_-]?key|secret|password)=\S+/gi, '$1=[redacted]')
}

async function main() {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS)
  const rawBaseUrl = readEnv('REEDITPRO_HOSTED_APP_URL', 'PLAYWRIGHT_HOSTED_APP_BASE_URL', 'PLAYWRIGHT_BASE_URL')
  const expectConfigured = process.env.REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED === 'true'

  if (confirm !== CONFIRM_VALUE) {
    output({
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_missing_confirmation',
      message: 'Hosted sign-in route readiness requires explicit confirmation.',
      authMode: 'hosted_browser_route_readiness_only',
      credentialsSubmitted: false,
      serviceRoleUsed: false,
      tokenPrinted: false,
      passwordPrinted: false,
      warnings: [],
      nextStep: 'set_REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS',
    })
  }

  if (!rawBaseUrl) {
    output({
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_missing_url',
      message: 'Set REEDITPRO_HOSTED_APP_URL to the deployed app base URL, such as https://yuzastudio6-cyber.github.io/Reedkt/.',
      authMode: 'hosted_browser_route_readiness_only',
      credentialsSubmitted: false,
      serviceRoleUsed: false,
      tokenPrinted: false,
      passwordPrinted: false,
      warnings: ['This verifier does not use tester credentials.'],
      nextStep: 'provide_hosted_app_base_url',
    })
  }

  const targetBaseUrl = normalizeBaseUrl(rawBaseUrl)
  if (!targetBaseUrl) {
    output({
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_invalid_url',
      message: 'REEDITPRO_HOSTED_APP_URL must be an HTTPS URL, or localhost/127.0.0.1 for local verification.',
      targetBaseUrl: rawBaseUrl,
      authMode: 'hosted_browser_route_readiness_only',
      credentialsSubmitted: false,
      serviceRoleUsed: false,
      tokenPrinted: false,
      passwordPrinted: false,
      warnings: [],
      nextStep: 'fix_hosted_app_base_url',
    })
  }

  const targetSignInUrl = signInUrlFor(targetBaseUrl)
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    await page.goto(targetSignInUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.getByRole('heading', { name: /sign in to test the reeditpro app/i }).waitFor({ timeout: 15_000 })

    const bodyText = await page.locator('body').innerText({ timeout: 10_000 })
    const signInSurfaceFound = /sign in to test the reeditpro app/i.test(bodyText)
      && /frontend anon auth only/i.test(bodyText)
      && /no service-role secrets/i.test(bodyText)
      && /no tool execution on sign-in/i.test(bodyText)
    const supabasePublicEnvConfigured = /private testing sign-in/i.test(bodyText) && !/supabase env is missing/i.test(bodyText)
    const appSubdomainReferenceFound = /app\.reeditpro\.com/i.test(bodyText)
    const handoff = page.getByRole('link', { name: /open testing/i })
    const handoffHref = await handoff.getAttribute('href').catch(() => null)
    const internalTestingHandoffFound = Boolean(handoffHref && new URL(handoffHref, page.url()).pathname.endsWith('/internal-testing'))

    if (!signInSurfaceFound) {
      output({
        ok: false,
        decision: 'hosted_sign_in_route_readiness_blocked_sign_in_surface_missing',
        message: 'The hosted page loaded, but the expected ReEditPro sign-in safety surface was not present.',
        targetBaseUrl,
        targetSignInUrl,
        finalUrl: page.url(),
        signInSurfaceFound,
        internalTestingHandoffFound,
        supabasePublicEnvConfigured,
        appSubdomainReferenceFound,
        authMode: 'hosted_browser_route_readiness_only',
        credentialsSubmitted: false,
        serviceRoleUsed: false,
        tokenPrinted: false,
        passwordPrinted: false,
        warnings: [],
        nextStep: 'deploy_current_app_shell_and_recheck_sign_in_route',
      })
    }

    if (!internalTestingHandoffFound) {
      output({
        ok: false,
        decision: 'hosted_sign_in_route_readiness_blocked_internal_testing_handoff_missing',
        message: 'The hosted sign-in page is present, but the Open testing handoff does not point to /internal-testing.',
        targetBaseUrl,
        targetSignInUrl,
        finalUrl: page.url(),
        signInSurfaceFound,
        internalTestingHandoffFound,
        supabasePublicEnvConfigured,
        appSubdomainReferenceFound,
        authMode: 'hosted_browser_route_readiness_only',
        credentialsSubmitted: false,
        serviceRoleUsed: false,
        tokenPrinted: false,
        passwordPrinted: false,
        warnings: [],
        nextStep: 'fix_sign_in_internal_testing_handoff',
      })
    }

    if (appSubdomainReferenceFound) {
      output({
        ok: false,
        decision: 'hosted_sign_in_route_readiness_blocked_unexpected_app_subdomain_reference',
        message: 'The hosted sign-in page still references app.reeditpro.com in visible UI text. Use the deployed base URL until DNS is configured.',
        targetBaseUrl,
        targetSignInUrl,
        finalUrl: page.url(),
        signInSurfaceFound,
        internalTestingHandoffFound,
        supabasePublicEnvConfigured,
        appSubdomainReferenceFound,
        authMode: 'hosted_browser_route_readiness_only',
        credentialsSubmitted: false,
        serviceRoleUsed: false,
        tokenPrinted: false,
        passwordPrinted: false,
        warnings: [],
        nextStep: 'remove_or_configure_app_reeditpro_subdomain_reference',
      })
    }

    if (expectConfigured && !supabasePublicEnvConfigured) {
      output({
        ok: false,
        decision: 'hosted_sign_in_route_readiness_blocked_supabase_public_env_missing',
        message: 'The hosted sign-in page is reachable, but it reports missing public Supabase env.',
        targetBaseUrl,
        targetSignInUrl,
        finalUrl: page.url(),
        signInSurfaceFound,
        internalTestingHandoffFound,
        supabasePublicEnvConfigured,
        appSubdomainReferenceFound,
        authMode: 'hosted_browser_route_readiness_only',
        credentialsSubmitted: false,
        serviceRoleUsed: false,
        tokenPrinted: false,
        passwordPrinted: false,
        warnings: ['The Pages deployment must inline VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for hosted sign-in.'],
        nextStep: 'rerun_pages_deploy_with_public_supabase_env',
      })
    }

    output({
      ok: true,
      decision: 'hosted_sign_in_route_readiness_passed_ready_for_browser_sign_in_verification',
      message: 'Hosted sign-in route is reachable, shows the ReEditPro auth safety surface, and links to internal testing.',
      targetBaseUrl,
      targetSignInUrl,
      finalUrl: page.url(),
      signInSurfaceFound,
      internalTestingHandoffFound,
      supabasePublicEnvConfigured,
      appSubdomainReferenceFound,
      authMode: 'hosted_browser_route_readiness_only',
      credentialsSubmitted: false,
      serviceRoleUsed: false,
      tokenPrinted: false,
      passwordPrinted: false,
      warnings: supabasePublicEnvConfigured
        ? ['No credentials were submitted; run internal-testing:verify-browser-sign-in next with env credentials.']
        : ['Public Supabase env was not required for this run; set REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED=true to enforce it.'],
      nextStep: 'run_internal_testing_verify_browser_sign_in_with_tester_credentials',
    })
  } catch (error) {
    output({
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_unreachable',
      message: safeErrorMessage(error),
      targetBaseUrl,
      targetSignInUrl,
      authMode: 'hosted_browser_route_readiness_only',
      credentialsSubmitted: false,
      serviceRoleUsed: false,
      tokenPrinted: false,
      passwordPrinted: false,
      warnings: ['If this targets app.reeditpro.com, configure DNS first or use the GitHub Pages URL for internal testing.'],
      nextStep: 'fix_hosted_app_dns_or_pages_deployment',
    })
  } finally {
    await browser.close().catch(() => undefined)
  }
}

void main()
