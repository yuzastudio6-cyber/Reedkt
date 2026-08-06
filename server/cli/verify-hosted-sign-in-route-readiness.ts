import { chromium, type Page } from '@playwright/test'

type HostedSignInRouteDecision =
  | 'hosted_sign_in_route_readiness_passed_ready_for_interactive_google_session_verification'
  | 'hosted_sign_in_route_readiness_blocked_missing_confirmation'
  | 'hosted_sign_in_route_readiness_blocked_missing_url'
  | 'hosted_sign_in_route_readiness_blocked_invalid_url'
  | 'hosted_sign_in_route_readiness_blocked_unreachable'
  | 'hosted_sign_in_route_readiness_blocked_sign_in_surface_missing'
  | 'hosted_sign_in_route_readiness_blocked_google_primary_action_missing'
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
  googlePrimaryActionFound?: boolean
  emailPasswordFallbackFound?: boolean
  supabasePublicEnvConfigured?: boolean
  appSubdomainReferenceFound?: boolean
  authMode: 'hosted_browser_route_readiness_only'
  credentialsSubmitted: false
  providerRedirectFollowed: false
  serviceRoleUsed: false
  tokenPrinted: false
  passwordPrinted: false
  warnings: string[]
  nextStep: string
}

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE'
const fixedBoundary = {
  authMode: 'hosted_browser_route_readiness_only' as const,
  credentialsSubmitted: false as const,
  providerRedirectFollowed: false as const,
  serviceRoleUsed: false as const,
  tokenPrinted: false as const,
  passwordPrinted: false as const,
}

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

function output(result: HostedSignInRouteResult): void {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exitCode = result.ok ? 0 : 1
}

function isLoopbackHostname(value: string): boolean {
  const normalized = value.toLowerCase()
  if (normalized === 'localhost' || normalized === '::1') return true
  const parts = normalized.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function normalizeBaseUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl)
    if (
      parsed.username
      || parsed.password
      || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopbackHostname(parsed.hostname)))
    ) {
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
  return new URL('sign-in?returnTo=/dashboard', baseUrl).toString()
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Hosted sign-in route verification failed.'
  return message
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/(access_token|refresh_token|token|apikey|api[_-]?key|secret|password)=\S+/gi, '$1=[redacted]')
}

async function readSurface(page: Page, targetBaseUrl: string, targetSignInUrl: string): Promise<HostedSignInRouteResult> {
  await page.goto(targetSignInUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const signInCardFound = await page.getByTestId('sign-in-card')
    .waitFor({ timeout: 15_000 })
    .then(() => true)
    .catch(() => false)

  const bodyText = await page.locator('body').innerText({ timeout: 10_000 })
  const signInSurfaceFound = signInCardFound
    && /pick up exactly where you left off/i.test(bodyText)
    && /continue to reeditpro/i.test(bodyText)
    && /no production billing or public delivery/i.test(bodyText)
  const googlePrimaryActionFound = await page.getByTestId('google-sign-in').isVisible().catch(() => false)
  const emailPasswordFallbackFound = await page.getByTestId('auth-password-toggle').isVisible().catch(() => false)
  const supabasePublicEnvConfigured = googlePrimaryActionFound
  const appSubdomainReferenceFound = /app\.reeditpro\.com/i.test(bodyText)
  const common = {
    ...fixedBoundary,
    targetBaseUrl,
    targetSignInUrl,
    finalUrl: page.url(),
    signInSurfaceFound,
    googlePrimaryActionFound,
    emailPasswordFallbackFound,
    supabasePublicEnvConfigured,
    appSubdomainReferenceFound,
  }

  if (!signInSurfaceFound) {
    return {
      ...common,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_sign_in_surface_missing',
      message: 'The hosted page loaded, but the current ReEditPro sign-in surface was not present.',
      warnings: [],
      nextStep: 'deploy_current_app_shell_and_recheck_sign_in_route',
    }
  }

  if (!googlePrimaryActionFound || !emailPasswordFallbackFound) {
    const expectConfigured = process.env.REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED === 'true'
    return {
      ...common,
      ok: false,
      decision: expectConfigured
        ? 'hosted_sign_in_route_readiness_blocked_supabase_public_env_missing'
        : 'hosted_sign_in_route_readiness_blocked_google_primary_action_missing',
      message: expectConfigured
        ? 'The hosted sign-in page is reachable, but its browser-safe Supabase configuration did not enable the Google sign-in surface.'
        : 'The hosted sign-in page is reachable, but the Google-first action and email/password fallback are not both present.',
      warnings: ['Deploy with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_REEDITPRO_AUTH_MODE=supabase.'],
      nextStep: 'rerun_pages_deploy_with_reviewed_google_sign_in_build_configuration',
    }
  }

  if (appSubdomainReferenceFound && !targetBaseUrl.startsWith('https://app.reeditpro.com/')) {
    return {
      ...common,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_unexpected_app_subdomain_reference',
      message: 'The hosted sign-in page references app.reeditpro.com before the verifier is targeting that origin.',
      warnings: [],
      nextStep: 'remove_or_configure_app_reeditpro_subdomain_reference',
    }
  }

  return {
    ...common,
    ok: true,
    decision: 'hosted_sign_in_route_readiness_passed_ready_for_interactive_google_session_verification',
    message: 'The hosted Google-first sign-in surface is reachable with its accessible email/password fallback.',
    warnings: [
      'No provider redirect was followed and no credentials were submitted.',
      'Run a real interactive Google sign-in and protected-session readback before claiming Gmail sign-in end to end.',
    ],
    nextStep: 'complete_interactive_google_sign_in_session_reload_and_sign_out_readback',
  }
}

async function main(): Promise<HostedSignInRouteResult> {
  const confirm = clean(process.env.REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS)
  const rawBaseUrl = readEnv('REEDITPRO_HOSTED_APP_URL', 'PLAYWRIGHT_HOSTED_APP_BASE_URL', 'PLAYWRIGHT_BASE_URL')

  if (confirm !== CONFIRM_VALUE) {
    return {
      ...fixedBoundary,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_missing_confirmation',
      message: 'Hosted sign-in route readiness requires explicit confirmation.',
      warnings: [],
      nextStep: 'set_REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS',
    }
  }

  if (!rawBaseUrl) {
    return {
      ...fixedBoundary,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_missing_url',
      message: 'Set REEDITPRO_HOSTED_APP_URL to the deployed app base URL.',
      warnings: ['This verifier never uses tester credentials.'],
      nextStep: 'provide_hosted_app_base_url',
    }
  }

  const targetBaseUrl = normalizeBaseUrl(rawBaseUrl)
  if (!targetBaseUrl) {
    return {
      ...fixedBoundary,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_invalid_url',
      message: 'REEDITPRO_HOSTED_APP_URL must use HTTPS, or exact loopback HTTP for local verification, and must not contain credentials.',
      targetBaseUrl: rawBaseUrl,
      warnings: [],
      nextStep: 'fix_hosted_app_base_url',
    }
  }

  const targetSignInUrl = signInUrlFor(targetBaseUrl)
  const browser = await chromium.launch({ headless: true })
  try {
    return await readSurface(await browser.newPage(), targetBaseUrl, targetSignInUrl)
  } catch (error) {
    return {
      ...fixedBoundary,
      ok: false,
      decision: 'hosted_sign_in_route_readiness_blocked_unreachable',
      message: safeErrorMessage(error),
      targetBaseUrl,
      targetSignInUrl,
      warnings: ['Use the reviewed GitHub Pages URL until custom app DNS is configured.'],
      nextStep: 'fix_hosted_app_dns_or_pages_deployment',
    }
  } finally {
    await browser.close().catch(() => undefined)
  }
}

void main()
  .then(output)
  .catch((error: unknown) => output({
    ...fixedBoundary,
    ok: false,
    decision: 'hosted_sign_in_route_readiness_blocked_unreachable',
    message: safeErrorMessage(error),
    warnings: [],
    nextStep: 'inspect_hosted_sign_in_verifier_failure',
  }))
