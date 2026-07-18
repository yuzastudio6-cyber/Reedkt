import { createHash } from 'node:crypto'
import { chromium, type Browser, type Page } from '@playwright/test'

type InteractiveGoogleSessionDecision =
  | 'interactive_google_session_verification_passed_ready_for_signed_in_pipeline_testing'
  | 'interactive_google_session_verification_blocked_missing_confirmation'
  | 'interactive_google_session_verification_blocked_invalid_configuration'
  | 'interactive_google_session_verification_blocked_noninteractive_environment'
  | 'interactive_google_session_verification_blocked_browser_launch'
  | 'interactive_google_session_verification_blocked_sign_in_surface'
  | 'interactive_google_session_verification_blocked_provider_flow'
  | 'interactive_google_session_verification_blocked_callback'
  | 'interactive_google_session_verification_blocked_google_identity'
  | 'interactive_google_session_verification_blocked_reload'
  | 'interactive_google_session_verification_blocked_gateway_readback'
  | 'interactive_google_session_verification_blocked_sign_out'

interface InteractiveGoogleSessionResult {
  ok: boolean
  decision: InteractiveGoogleSessionDecision
  message: string
  appOrigin?: string
  appBasePath?: string
  expectedSupabaseOrigin?: string
  expectedGatewayOrigin?: string
  expectedEmailHash?: string
  signInSurfaceObserved?: boolean
  reeditproGoogleActionClicked?: boolean
  supabaseAuthorizeOriginObserved?: boolean
  googleAccountOriginObserved?: boolean
  callbackReturnedToExactApp?: boolean
  googleSessionLabelObserved?: boolean
  expectedIdentityObserved?: boolean
  supabaseSessionRecordObserved?: boolean
  protectedDashboardSurvivedReload?: boolean
  protectedProjectsRouteReached?: boolean
  authenticatedGatewayResponseObserved?: boolean
  authenticatedGatewayStatusCode?: number
  signOutCompleted?: boolean
  protectedRouteDeniedAfterSignOut?: boolean
  activeSupabaseSessionRecordCountAfterSignOut?: number
  interactiveUserActionRequired: true
  credentialsEnteredByAutomation: false
  googleCredentialsRead: false
  browserStorageExported: false
  storageStateWritten: false
  traceRecorded: false
  screenshotRecorded: false
  serviceRoleUsed: false
  tokenPrinted: false
  passwordPrinted: false
  warnings: string[]
  nextStep: string
}

interface InteractiveGoogleSessionConfig {
  hostedAppBaseUrl: string
  appOrigin: string
  appBasePath: string
  signInUrl: string
  signInPath: string
  dashboardUrl: string
  projectsUrl: string
  expectedSupabaseOrigin: string
  expectedGatewayOrigin: string
  expectedEmail: string
  expectedEmailHash: string
  timeoutMs: number
}

interface VerificationEvidence {
  signInSurfaceObserved: boolean
  reeditproGoogleActionClicked: boolean
  supabaseAuthorizeOriginObserved: boolean
  googleAccountOriginObserved: boolean
  callbackReturnedToExactApp: boolean
  googleSessionLabelObserved: boolean
  expectedIdentityObserved: boolean
  supabaseSessionRecordObserved: boolean
  protectedDashboardSurvivedReload: boolean
  protectedProjectsRouteReached: boolean
  authenticatedGatewayResponseObserved: boolean
  authenticatedGatewayStatusCode?: number
  signOutCompleted: boolean
  protectedRouteDeniedAfterSignOut: boolean
  activeSupabaseSessionRecordCountAfterSignOut?: number
}

const CONFIRM_VALUE = 'VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION'
const GOOGLE_ACCOUNT_ORIGIN = 'https://accounts.google.com'
const ALLOWED_HOSTED_BASE_URLS = new Set([
  'https://yuzastudio6-cyber.github.io/Reedkt/',
  'https://app.reeditpro.com/',
])

const fixedBoundary = {
  interactiveUserActionRequired: true as const,
  credentialsEnteredByAutomation: false as const,
  googleCredentialsRead: false as const,
  browserStorageExported: false as const,
  storageStateWritten: false as const,
  traceRecorded: false as const,
  screenshotRecorded: false as const,
  serviceRoleUsed: false as const,
  tokenPrinted: false as const,
  passwordPrinted: false as const,
}

class VerificationBlocked extends Error {
  readonly decision: InteractiveGoogleSessionDecision
  readonly nextStep: string

  constructor(
    decision: InteractiveGoogleSessionDecision,
    nextStep: string,
    message: string,
  ) {
    super(message)
    this.name = 'VerificationBlocked'
    this.decision = decision
    this.nextStep = nextStep
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16)
}

function normalizeHostedAppBaseUrl(rawValue: string): string | undefined {
  try {
    const parsed = new URL(rawValue)
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
      || parsed.port
    ) return undefined
    parsed.pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
    const normalized = parsed.toString()
    return ALLOWED_HOSTED_BASE_URLS.has(normalized) ? normalized : undefined
  } catch {
    return undefined
  }
}

function normalizeSupabaseOrigin(rawValue: string): string | undefined {
  try {
    const parsed = new URL(rawValue)
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.port
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash
      || !/^[a-z0-9]+[.]supabase[.]co$/.test(parsed.hostname)
    ) return undefined
    return parsed.origin
  } catch {
    return undefined
  }
}

function normalizeGatewayOrigin(rawValue: string): string | undefined {
  try {
    const parsed = new URL(rawValue)
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.port
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash
      || !/^[a-z0-9-]+(?:[.][a-z0-9-]+)*[.]gateway[.]dev$/.test(parsed.hostname)
    ) return undefined
    return parsed.origin
  } catch {
    return undefined
  }
}

function parseTimeoutSeconds(rawValue: string | undefined): number | undefined {
  if (!rawValue) return 600
  if (!/^[0-9]+$/.test(rawValue)) return undefined
  const seconds = Number(rawValue)
  return seconds >= 60 && seconds <= 900 ? seconds : undefined
}

function routeUrl(baseUrl: string, route: string): string {
  return new URL(route.replace(/^\//, ''), baseUrl).toString()
}

function readConfig(): InteractiveGoogleSessionConfig | InteractiveGoogleSessionResult {
  if (clean(process.env.REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION) !== CONFIRM_VALUE) {
    return blockedResult(
      'interactive_google_session_verification_blocked_missing_confirmation',
      'Interactive Google session verification requires the exact owner confirmation.',
      'set_REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION',
    )
  }

  if (process.env.CI === 'true') {
    return blockedResult(
      'interactive_google_session_verification_blocked_noninteractive_environment',
      'Interactive Google session verification cannot run in CI because the account and consent UI must remain under owner control.',
      'run_on_owner_local_machine_after_credential_free_ci_readiness_passes',
    )
  }

  const hostedAppBaseUrl = normalizeHostedAppBaseUrl(clean(process.env.REEDITPRO_HOSTED_APP_URL) ?? '')
  const expectedSupabaseOrigin = normalizeSupabaseOrigin(clean(process.env.REEDITPRO_EXPECTED_SUPABASE_ORIGIN) ?? '')
  const expectedGatewayOrigin = normalizeGatewayOrigin(clean(process.env.REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN) ?? '')
  const expectedEmail = clean(process.env.REEDITPRO_EXPECTED_GOOGLE_EMAIL)?.toLowerCase()
  const timeoutSeconds = parseTimeoutSeconds(clean(process.env.REEDITPRO_INTERACTIVE_GOOGLE_SESSION_TIMEOUT_SECONDS))

  if (
    !hostedAppBaseUrl
    || !expectedSupabaseOrigin
    || !expectedGatewayOrigin
    || !expectedEmail
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail)
    || timeoutSeconds === undefined
  ) {
    return blockedResult(
      'interactive_google_session_verification_blocked_invalid_configuration',
      'Provide the exact approved hosted app, public Supabase origin, activation-evidence gateway origin, expected Google email, and a 60-900 second timeout.',
      'fix_interactive_google_session_configuration',
    )
  }

  const parsedApp = new URL(hostedAppBaseUrl)
  return {
    hostedAppBaseUrl,
    appOrigin: parsedApp.origin,
    appBasePath: parsedApp.pathname,
    signInUrl: routeUrl(hostedAppBaseUrl, 'sign-in?returnTo=/dashboard'),
    signInPath: new URL(routeUrl(hostedAppBaseUrl, 'sign-in')).pathname,
    dashboardUrl: routeUrl(hostedAppBaseUrl, 'dashboard'),
    projectsUrl: routeUrl(hostedAppBaseUrl, 'projects'),
    expectedSupabaseOrigin,
    expectedGatewayOrigin,
    expectedEmail,
    expectedEmailHash: emailHash(expectedEmail),
    timeoutMs: timeoutSeconds * 1000,
  }
}

function blankEvidence(): VerificationEvidence {
  return {
    signInSurfaceObserved: false,
    reeditproGoogleActionClicked: false,
    supabaseAuthorizeOriginObserved: false,
    googleAccountOriginObserved: false,
    callbackReturnedToExactApp: false,
    googleSessionLabelObserved: false,
    expectedIdentityObserved: false,
    supabaseSessionRecordObserved: false,
    protectedDashboardSurvivedReload: false,
    protectedProjectsRouteReached: false,
    authenticatedGatewayResponseObserved: false,
    signOutCompleted: false,
    protectedRouteDeniedAfterSignOut: false,
  }
}

function blockedResult(
  decision: InteractiveGoogleSessionDecision,
  message: string,
  nextStep: string,
  config?: InteractiveGoogleSessionConfig,
  evidence: VerificationEvidence = blankEvidence(),
): InteractiveGoogleSessionResult {
  return {
    ...fixedBoundary,
    ...evidence,
    ok: false,
    decision,
    message,
    appOrigin: config?.appOrigin,
    appBasePath: config?.appBasePath,
    expectedSupabaseOrigin: config?.expectedSupabaseOrigin,
    expectedGatewayOrigin: config?.expectedGatewayOrigin,
    expectedEmailHash: config?.expectedEmailHash,
    warnings: [
      'No Google credential, access token, refresh token, browser storage value, service-role value, trace, screenshot, video, or storage state was captured.',
    ],
    nextStep,
  }
}

function successResult(
  config: InteractiveGoogleSessionConfig,
  evidence: VerificationEvidence,
): InteractiveGoogleSessionResult {
  return {
    ...fixedBoundary,
    ...evidence,
    ok: true,
    decision: 'interactive_google_session_verification_passed_ready_for_signed_in_pipeline_testing',
    message: 'The owner-controlled Google session, exact callback, protected reload, authenticated private gateway readback, and sign-out all passed.',
    appOrigin: config.appOrigin,
    appBasePath: config.appBasePath,
    expectedSupabaseOrigin: config.expectedSupabaseOrigin,
    expectedGatewayOrigin: config.expectedGatewayOrigin,
    expectedEmailHash: config.expectedEmailHash,
    warnings: [
      'This proves the signed-in authentication and private API transport gate only; upload, planning, approval, execution, QA, review, and export still require their own staged journey evidence.',
      'No customer billing, provider activation, public delivery, external beta, or production authority was enabled.',
    ],
    nextStep: 'run_signed_in_large_source_private_edit_journey',
  }
}

function assertVerification(
  condition: unknown,
  decision: InteractiveGoogleSessionDecision,
  nextStep: string,
  message: string,
): asserts condition {
  if (!condition) throw new VerificationBlocked(decision, nextStep, message)
}

function isSensitiveAuthMaterialInUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl)
    const sensitiveKeys = new Set([
      'access_token',
      'refresh_token',
      'code',
      'error',
      'error_code',
      'error_description',
      'token',
    ])
    for (const key of parsed.searchParams.keys()) {
      if (sensitiveKeys.has(key.toLowerCase())) return true
    }
    return /(?:access_token|refresh_token|error_description|(?:^|[&#])code=)/i.test(parsed.hash)
  } catch {
    return true
  }
}

async function activeSupabaseSessionRecordCount(page: Page): Promise<number> {
  return page.evaluate(() => Object.keys(window.localStorage)
    .filter((key) => /^sb-[a-z0-9-]+-auth-token$/i.test(key)).length)
}

async function waitForGatewaySuccess(statuses: number[], timeoutMs: number): Promise<number | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const success = statuses.find((status) => status >= 200 && status < 300)
    if (success !== undefined) return success
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return undefined
}

async function runInteractiveVerification(
  browser: Browser,
  config: InteractiveGoogleSessionConfig,
  evidence: VerificationEvidence,
): Promise<InteractiveGoogleSessionResult> {
  const context = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  const gatewayStatuses: number[] = []

  page.on('framenavigated', (frame) => {
    if (frame !== page.mainFrame()) return
    try {
      const navigated = new URL(frame.url())
      if (
        navigated.origin === config.expectedSupabaseOrigin
        && navigated.pathname === '/auth/v1/authorize'
      ) evidence.supabaseAuthorizeOriginObserved = true
      if (navigated.origin === GOOGLE_ACCOUNT_ORIGIN) evidence.googleAccountOriginObserved = true
      if (
        evidence.googleAccountOriginObserved
        && navigated.origin === config.appOrigin
        && navigated.pathname === config.signInPath
      ) evidence.callbackReturnedToExactApp = true
    } catch {
      // Non-URL browser documents do not contribute evidence.
    }
  })

  page.on('response', (response) => {
    try {
      const responseUrl = new URL(response.url())
      if (
        responseUrl.origin === config.expectedGatewayOrigin
        && responseUrl.pathname === '/v1/projects'
        && response.request().method() === 'GET'
      ) gatewayStatuses.push(response.status())
    } catch {
      // Malformed response URLs cannot satisfy gateway evidence.
    }
  })

  try {
    await page.goto(config.signInUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const signInCard = page.getByTestId('sign-in-card')
    await signInCard.waitFor({ timeout: 15_000 })
    const googleAction = page.getByTestId('google-sign-in')
    assertVerification(
      await googleAction.isVisible(),
      'interactive_google_session_verification_blocked_sign_in_surface',
      'redeploy_reviewed_google_first_sign_in_surface',
      'The reviewed Google sign-in action was not visible.',
    )
    evidence.signInSurfaceObserved = true

    process.stderr.write(
      'ReEditPro opened a fresh browser. Complete Google account selection and consent in that browser; the verifier never reads or enters your Google credentials.\n',
    )
    await googleAction.click()
    evidence.reeditproGoogleActionClicked = true

    await page.getByTestId('app-session-identity').waitFor({ timeout: config.timeoutMs })
    assertVerification(
      evidence.supabaseAuthorizeOriginObserved && evidence.googleAccountOriginObserved,
      'interactive_google_session_verification_blocked_provider_flow',
      'verify_google_provider_and_supabase_callback_configuration',
      'The expected Supabase authorize and Google account origins were not both observed.',
    )
    assertVerification(
      evidence.callbackReturnedToExactApp && !isSensitiveAuthMaterialInUrl(page.url()),
      'interactive_google_session_verification_blocked_callback',
      'fix_exact_hosted_callback_and_url_cleanup',
      'The Google flow did not return through the exact clean hosted callback.',
    )

    const sessionIdentity = page.getByTestId('app-session-identity')
    const sessionText = await sessionIdentity.innerText()
    evidence.googleSessionLabelObserved = /Google session/i.test(sessionText)
    evidence.expectedIdentityObserved = sessionText.toLowerCase().includes(config.expectedEmail)
    evidence.supabaseSessionRecordObserved = await activeSupabaseSessionRecordCount(page) > 0
    assertVerification(
      evidence.googleSessionLabelObserved
      && evidence.expectedIdentityObserved
      && evidence.supabaseSessionRecordObserved,
      'interactive_google_session_verification_blocked_google_identity',
      'sign_out_and_repeat_with_the_expected_google_account',
      'The returned session did not match the expected Google-backed identity.',
    )

    await page.goto(config.dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.getByTestId('app-session-identity').waitFor({ timeout: 15_000 })
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
    const reloadedIdentity = page.getByTestId('app-session-identity')
    await reloadedIdentity.waitFor({ timeout: 15_000 })
    evidence.protectedDashboardSurvivedReload = /Google session/i.test(await reloadedIdentity.innerText())
      && !isSensitiveAuthMaterialInUrl(page.url())
    assertVerification(
      evidence.protectedDashboardSurvivedReload,
      'interactive_google_session_verification_blocked_reload',
      'inspect_supabase_session_persistence_and_guarded_route_recovery',
      'The protected dashboard did not survive a clean reload.',
    )

    await page.goto(config.projectsUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.getByTestId('app-session-identity').waitFor({ timeout: 15_000 })
    evidence.protectedProjectsRouteReached = new URL(page.url()).pathname === new URL(config.projectsUrl).pathname
    const gatewayStatus = await waitForGatewaySuccess(gatewayStatuses, 20_000)
    evidence.authenticatedGatewayStatusCode = gatewayStatus ?? gatewayStatuses.at(-1)
    evidence.authenticatedGatewayResponseObserved = gatewayStatus !== undefined
    assertVerification(
      evidence.protectedProjectsRouteReached && evidence.authenticatedGatewayResponseObserved,
      'interactive_google_session_verification_blocked_gateway_readback',
      'inspect_gateway_user_authority_tenant_bootstrap_and_projects_readback',
      'The Google session did not receive a successful protected projects response from the exact private gateway.',
    )

    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.getByTestId('sign-in-card').waitFor({ timeout: 15_000 })
    evidence.signOutCompleted = true
    await page.goto(config.dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.getByTestId('sign-in-card').waitFor({ timeout: 15_000 })
    evidence.protectedRouteDeniedAfterSignOut = new URL(page.url()).pathname === config.signInPath
    evidence.activeSupabaseSessionRecordCountAfterSignOut = await activeSupabaseSessionRecordCount(page)
    assertVerification(
      evidence.protectedRouteDeniedAfterSignOut
      && evidence.activeSupabaseSessionRecordCountAfterSignOut === 0,
      'interactive_google_session_verification_blocked_sign_out',
      'inspect_supabase_sign_out_and_guarded_route_invalidation',
      'Sign-out did not clear the session and re-protect the dashboard.',
    )

    return successResult(config, evidence)
  } finally {
    await context.close().catch(() => undefined)
  }
}

async function main(): Promise<InteractiveGoogleSessionResult> {
  const config = readConfig()
  if ('ok' in config) return config

  const evidence = blankEvidence()
  let browser: Browser | undefined
  try {
    browser = await chromium.launch({ headless: false })
  } catch {
    return blockedResult(
      'interactive_google_session_verification_blocked_browser_launch',
      'The headed Playwright browser could not be opened.',
      'install_playwright_chromium_and_run_from_owner_desktop',
      config,
      evidence,
    )
  }

  try {
    return await runInteractiveVerification(browser, config, evidence)
  } catch (error) {
    if (error instanceof VerificationBlocked) {
      return blockedResult(error.decision, error.message, error.nextStep, config, evidence)
    }
    return blockedResult(
      evidence.reeditproGoogleActionClicked
        ? 'interactive_google_session_verification_blocked_provider_flow'
        : 'interactive_google_session_verification_blocked_sign_in_surface',
      'The interactive Google session verification did not reach its next safe evidence boundary.',
      evidence.reeditproGoogleActionClicked
        ? 'inspect_google_consent_callback_and_hosted_session_state'
        : 'inspect_hosted_sign_in_surface_and_browser_launch',
      config,
      evidence,
    )
  } finally {
    await browser.close().catch(() => undefined)
  }
}

void main()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exitCode = result.ok ? 0 : 1
  })
  .catch(() => {
    const result = blockedResult(
      'interactive_google_session_verification_blocked_browser_launch',
      'Interactive Google session verification failed before a safe browser boundary was established.',
      'inspect_owner_desktop_playwright_runtime',
    )
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exitCode = 1
  })
