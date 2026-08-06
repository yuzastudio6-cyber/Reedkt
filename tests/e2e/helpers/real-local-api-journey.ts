import { expect, type Page } from '@playwright/test'
import { stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../../src/lib/local-project-handoff'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  gotoRoute,
} from './routes'

const usesSupabaseAuth =
  process.env.PLAYWRIGHT_REAL_LOCAL_API_AUTH_MODE === 'supabase'
const expectsCanonicalDurableUploadTarget =
  process.env.PLAYWRIGHT_CANONICAL_DURABLE_UPLOAD_TARGET_EXPECTED === 'true'
const journeyUserId = usesSupabaseAuth
  ? requiredJourneyEnvironment('PLAYWRIGHT_REAL_LOCAL_API_USER_ID')
  : 'local-test-user'
const journeyWorkspaceId = usesSupabaseAuth
  ? requiredJourneyEnvironment('PLAYWRIGHT_REAL_LOCAL_API_WORKSPACE_ID')
  : 'workspace-internal-testing'
const journeyIdentityLabel = usesSupabaseAuth
  ? process.env.PLAYWRIGHT_REAL_LOCAL_API_IDENTITY_LABEL?.trim() || 'Owner A'
  : 'Local test user'
const journeyScope = usesSupabaseAuth
  ? {
      authMode: 'supabase' as const,
      userId: journeyUserId,
      workspaceId: journeyWorkspaceId,
    }
  : {
      authMode: 'local_test' as const,
      userId: journeyUserId,
      workspaceId: journeyWorkspaceId,
    }
const localHandoffStorageKey = buildLocalProjectHandoffStorageKey(journeyScope)

export type ActiveProjectEdit = {
  projectId: string
  editSessionId: string
  projectName: string
  editName: string
}

export type UploadedActiveSource = {
  handoff: LocalInternalProjectHandoff
  storageBucket: string
  storagePath: string
}

type PrivateAssistantAttemptEvidence = {
  source?: string
  status?: string
  routeId?: string
  providerModel?: string
  credentialVersion?: number | null
  providerCallMade?: boolean
  modelCallMade?: boolean
}

type PrivateAssistantRuntimeEvidence = PrivateAssistantAttemptEvidence & {
  credentialSource?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  fallbackFrom?: PrivateAssistantAttemptEvidence
  fallbackTrigger?: string
}

type SourceLedChatResponseEnvelope = {
  data?: {
    canonicalSourceLedChat?: {
      providerModelCalled?: boolean
      revision?: number
    }
    exchange?: {
      exchangeId?: string
      clientMessageId?: string
      revision?: number
      assistantRuntime?: PrivateAssistantRuntimeEvidence
    }
    replayed?: boolean
  }
}

const privateAssistantFallbackTriggerByStatus: Readonly<Record<string, string>> =
  Object.freeze({
    credential_unavailable: 'provider_unavailable',
    model_unavailable: 'provider_unavailable',
    rate_limited: 'provider_rate_limited',
    outcome_unknown: 'provider_timeout',
    provider_failed: 'transient_provider_error',
    invalid_response: 'malformed_structured_output',
  })

function isVerifiedPrivateAssistantRuntime(
  runtime: PrivateAssistantRuntimeEvidence | undefined,
): boolean {
  if (
    runtime?.status !== 'completed'
    || runtime.credentialSource !== 'google_secret_manager_pinned_version'
    || runtime.credentialVersion !== 2
    || runtime.providerCallMade !== true
    || runtime.modelCallMade !== true
    || !runtime.usage
    || !Number.isInteger(runtime.usage.promptTokens)
    || !Number.isInteger(runtime.usage.completionTokens)
    || !Number.isInteger(runtime.usage.totalTokens)
    || Number(runtime.usage.promptTokens) < 0
    || Number(runtime.usage.completionTokens) < 0
    || Number(runtime.usage.promptTokens)
      + Number(runtime.usage.completionTokens)
      !== Number(runtime.usage.totalTokens)
  ) return false

  if (
    runtime.source === 'kimi_k3'
    && runtime.routeId === 'kimi_k3_primary'
    && runtime.providerModel === 'kimi-k3'
  ) {
    return runtime.fallbackFrom === undefined
      && runtime.fallbackTrigger === undefined
  }

  const fallback = runtime.fallbackFrom
  const expectedFallbackTrigger = fallback?.status
    ? privateAssistantFallbackTriggerByStatus[fallback.status]
    : undefined
  return runtime.source === 'gpt_5_6_terra'
    && runtime.routeId === 'gpt_5_6_terra_fallback'
    && runtime.providerModel === 'gpt-5.6-terra'
    && fallback?.source === 'kimi_k3'
    && fallback.routeId === 'kimi_k3_primary'
    && fallback.providerModel === 'kimi-k3'
    && fallback.status !== undefined
    && fallback.status !== 'completed'
    && fallback.status !== 'credential_rejected'
    && expectedFallbackTrigger !== undefined
    && expectedFallbackTrigger === runtime.fallbackTrigger
}

function privateAssistantRuntimeSummary(
  runtime: PrivateAssistantRuntimeEvidence | undefined,
): string {
  return JSON.stringify({
    source: runtime?.source ?? null,
    status: runtime?.status ?? null,
    routeId: runtime?.routeId ?? null,
    providerModel: runtime?.providerModel ?? null,
    credentialVersion: runtime?.credentialVersion ?? null,
    providerCallMade: runtime?.providerCallMade ?? false,
    modelCallMade: runtime?.modelCallMade ?? false,
    fallbackStatus: runtime?.fallbackFrom?.status ?? null,
    fallbackTrigger: runtime?.fallbackTrigger ?? null,
  })
}

function assertVerifiedPrivateAssistantResponse(
  body: SourceLedChatResponseEnvelope,
): void {
  const runtime = body.data?.exchange?.assistantRuntime
  expect(
    body.data?.canonicalSourceLedChat?.providerModelCalled,
    `The persisted Chat thread lacked verified model-call evidence. Runtime: ${privateAssistantRuntimeSummary(runtime)}`,
  ).toBe(true)
  expect(
    isVerifiedPrivateAssistantRuntime(runtime),
    `The private Chat response was not a completed Kimi primary or eligible Terra fallback. Runtime: ${privateAssistantRuntimeSummary(runtime)}`,
  ).toBe(true)
}

export async function expectLocalApiHealth(apiBaseUrl: string): Promise<void> {
  const healthResponse = await fetch(`${apiBaseUrl}/health`)
  expect(healthResponse.ok).toBe(true)
  const health = await healthResponse.json() as {
    data?: {
      service?: string
      status?: string
    }
  }
  expect(health.data?.service).toBe('reeditpro-api')
  expect(health.data?.status).toBe('ok')
}

export async function signInAndCreateActiveProjectEdit(
  page: Page,
  input: {
    projectName: string
    editName: string
  },
): Promise<ActiveProjectEdit> {
  await signInForRealLocalApiJourney(page)
  await gotoRoute(page, '/projects/new')
  await expect(page.getByTestId('app-session-identity')).toContainText(
    journeyIdentityLabel,
  )
  await expect(page.getByRole('heading', { level: 1, name: /^New project$/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /What are you working on/i })).toBeVisible()
  await page.getByLabel(/Project name/i).fill(input.projectName)
  const projectCreateResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST' && url.pathname === '/v1/projects'
  })
  await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())

  const projectCreateResult = await projectCreateResponse
  const projectCreateBody = await projectCreateResult.text()
  expect(
    projectCreateResult.ok(),
    `POST /v1/projects returned ${projectCreateResult.status()}: ${projectCreateBody}`,
  ).toBe(true)
  await expect(page).toHaveURL(/\/projects\/(?!new(?:[/?]|$))[^/?]+$/)
  await expect(page.getByRole('heading', { level: 1, name: input.projectName })).toBeVisible()
  await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
  await expect(page.getByTestId('new-edit-dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Name this edit/i })).toBeVisible()
  await expect(page.getByTestId('new-edit-level-picker')).toHaveCount(0)
  await page.getByLabel(/Edit name/i).fill(input.editName)
  const editStateSaveResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'PUT'
      && /^\/v1\/projects\/[^/]+\/internal-edit-state$/.test(url.pathname)
  })
  await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

  await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+(?:\?.*)?$/)
  const editUrl = new URL(page.url())
  const editRouteMatch = editUrl.pathname.match(
    /^\/projects\/([^/]+)\/edits\/([^/]+)$/,
  )
  expect(editRouteMatch).not.toBeNull()
  const projectId = decodeURIComponent(editRouteMatch?.[1] ?? '')
  const editSessionId = decodeURIComponent(editRouteMatch?.[2] ?? '')
  const persistedBrowserHandoffs = await page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as {
      handoffs?: Array<{
        projectId?: string
        editSessionId?: string
      }>
    }
    return parsed.handoffs ?? []
  }, localHandoffStorageKey)
  expect(
    persistedBrowserHandoffs,
    `The scoped browser handoff was missing after creating edit ${editSessionId}.`,
  ).toContainEqual(expect.objectContaining({ projectId, editSessionId }))
  const editStateSaveResult = await editStateSaveResponse
  const editStateSaveBody = await editStateSaveResult.text()
  expect(
    editStateSaveResult.ok(),
    `PUT /v1/projects/:projectId/internal-edit-state returned ${editStateSaveResult.status()}: ${editStateSaveBody}`,
  ).toBe(true)
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('editor-header')).toContainText(input.editName)
  await expect(page.getByTestId('edit-level-inline-card')).toHaveCount(0)
  await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
  await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()

  return {
    projectId,
    editSessionId,
    projectName: input.projectName,
    editName: input.editName,
  }
}

async function signInForRealLocalApiJourney(page: Page): Promise<void> {
  if (!usesSupabaseAuth) return

  const email = requiredJourneyEnvironment(
    'PLAYWRIGHT_REAL_LOCAL_API_AUTH_EMAIL',
  )
  const password = requiredJourneyEnvironment(
    'PLAYWRIGHT_REAL_LOCAL_API_AUTH_PASSWORD',
  )
  await page.goto('/sign-in?returnTo=/projects/new')
  await page.waitForLoadState('domcontentloaded')
  const signInCard = page.getByTestId('sign-in-card')
  await expect(signInCard).toBeVisible({ timeout: 30_000 })
  const passwordFallback = signInCard.getByTestId('auth-password-toggle')
  await expect(passwordFallback).toBeVisible({ timeout: 30_000 })
  await passwordFallback.click()
  await signInCard.getByLabel('Email').fill(email)
  await signInCard.getByLabel('Password').fill(password)
  await signInCard.getByTestId('auth-submit-button').click()
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('app-session-identity')).toContainText(
    journeyIdentityLabel,
  )
}

export async function uploadActiveEditorSource(
  page: Page,
  input: {
    edit: ActiveProjectEdit
    fixturePath: string
    localStorageRoot: string
    timeoutMs?: number
  },
): Promise<UploadedActiveSource> {
  const timeoutMs = input.timeoutMs ?? 120_000
  const fixtureFileName = basename(input.fixturePath)
  const createIntentResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname ===
        `/v1/projects/${encodeURIComponent(input.edit.projectId)}/upload-intents`
  }, { timeout: timeoutMs }).then(async (response) => ({
    response,
    envelope: await response.json() as {
      ok?: boolean
      warnings?: string[]
    },
  }))
  const finalizeResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && /^\/v1\/upload-intents\/[^/]+\/finalize$/.test(url.pathname)
  }, { timeout: timeoutMs }).then(async (response) => ({
    response,
    envelope: await response.json() as {
      ok?: boolean
      data?: {
        mediaAsset?: {
          fileName?: string
          status?: string
        }
      }
    },
  }))

  await page.getByTestId('edit-upload-gate-input').setInputFiles(input.fixturePath)
  const [createdResult, finalizedResult] = await Promise.all([
    createIntentResponse,
    finalizeResponse,
  ])
  const { response: created, envelope: createdEnvelope } = createdResult
  const { response: finalized, envelope: finalizedEnvelope } = finalizedResult
  expect(created.ok()).toBe(true)
  expect(createdEnvelope.ok).toBe(true)
  if (expectsCanonicalDurableUploadTarget) {
    expect(createdEnvelope.warnings).toContain(
      'Canonical durable target disposition: issued.',
    )
  }
  expect(finalized.ok()).toBe(true)
  expect(finalizedEnvelope.ok).toBe(true)
  expect(finalizedEnvelope.data?.mediaAsset?.fileName).toBe(fixtureFileName)
  expect(finalizedEnvelope.data?.mediaAsset?.status).toMatch(/uploaded|ready|finalized/i)

  const sourceSummary = page.getByTestId('source-summary')
  await expect(sourceSummary).toBeVisible({ timeout: timeoutMs })
  await expect(sourceSummary).toContainText(fixtureFileName, { timeout: timeoutMs })
  await expect(page.getByTestId('edit-upload-gate')).toHaveCount(0)
  await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
  await expect(page.getByText(/source file is ready in uploaded order/i)).toBeVisible()
  await expect(page.getByText(/source remains private, and no editing or credits were used/i)).toBeVisible()

  await expect.poll(
    async () => (await readActiveHandoff(page, input.edit))?.sourceMediaAssets?.length ?? 0,
    { timeout: timeoutMs },
  ).toBe(1)

  const handoff = await readActiveHandoff(page, input.edit)
  expect(handoff).toBeDefined()
  expect(handoff).toMatchObject({
    projectId: input.edit.projectId,
    editSessionId: input.edit.editSessionId,
    projectName: input.edit.projectName,
    editName: input.edit.editName,
    stage: 'source_uploaded',
    sourceFileCount: 1,
  })
  const sourceAsset = handoff?.sourceMediaAssets?.[0]
  expect(sourceAsset).toMatchObject({
    fileName: fixtureFileName,
    mimeType: 'video/mp4',
    uploadedOrder: 1,
    storageProvider: 'local_private',
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  })
  expect(sourceAsset?.checksumSha256).toMatch(/^[a-f0-9]{64}$/i)
  expect(sourceAsset?.sourceMetadata).toMatchObject({
    probeStatus: 'probed',
    hasVideo: true,
  })
  expect(sourceAsset?.sourceMetadata?.width).toBeGreaterThan(0)
  expect(sourceAsset?.sourceMetadata?.height).toBeGreaterThan(0)
  expect(sourceAsset?.sourceMetadata?.durationSeconds).toBeGreaterThan(0)
  expect(sourceAsset?.storageBucket).toBeTruthy()
  expect(sourceAsset?.storagePath).toBeTruthy()

  const fixtureStat = await stat(input.fixturePath)
  const objectStat = await stat(join(
    process.cwd(),
    input.localStorageRoot,
    sourceAsset?.storageBucket ?? 'missing-bucket',
    sourceAsset?.storagePath ?? 'missing-path',
  ))
  expect(objectStat.size).toBe(fixtureStat.size)
  expect(sourceAsset?.byteSize).toBe(fixtureStat.size)

  return {
    handoff: handoff!,
    storageBucket: sourceAsset!.storageBucket!,
    storagePath: sourceAsset!.storagePath!,
  }
}

export async function createAndApproveActivePlan(
  page: Page,
  input: {
    prompt?: string
    sourceAlreadyPrepared?: boolean
    timeoutMs?: number
  } = {},
): Promise<'canonical_approved_snapshot' | 'private_review_ready'> {
  const timeoutMs = input.timeoutMs ?? 60_000
  if (input.prompt) {
    await page.getByTestId('chat-composer-textarea').fill(input.prompt)
    const chatResponse = page.waitForResponse((response) => {
      const request = response.request()
      return request.method() === 'POST'
        && /\/source-led-chat(?:\?|$)/.test(request.url())
    }, { timeout: timeoutMs })
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    let persistedChatResponse = await chatResponse
    let persistedChatBody =
      await persistedChatResponse.json() as SourceLedChatResponseEnvelope
    expect(
      persistedChatResponse.ok(),
      `POST source-led-chat returned ${persistedChatResponse.status()}.`,
    ).toBe(true)
    const privateAssistantExpected =
      process.env.PLAYWRIGHT_KIMI_CHAT_EXPECTED === 'true'
    if (
      privateAssistantExpected
      && !isVerifiedPrivateAssistantRuntime(
        persistedChatBody.data?.exchange?.assistantRuntime,
      )
    ) {
      const initialExchange = persistedChatBody.data?.exchange
      expect(initialExchange?.exchangeId).toBeTruthy()
      expect(initialExchange?.clientMessageId).toBeTruthy()
      expect(initialExchange?.revision).toBeGreaterThan(0)
      await expect(page.getByTestId('chat-composer-textarea')).toHaveValue(
        input.prompt,
        { timeout: timeoutMs },
      )
      await expect(page.getByTestId('chat-composer-send')).toHaveAccessibleName(
        /^Retry AI reply$/,
        { timeout: timeoutMs },
      )

      const retryResponse = page.waitForResponse((response) => {
        const request = response.request()
        return request.method() === 'POST'
          && /\/source-led-chat(?:\?|$)/.test(request.url())
      }, { timeout: timeoutMs })
      await clickWhenReady(page.getByTestId('chat-composer-send'))
      persistedChatResponse = await retryResponse
      persistedChatBody =
        await persistedChatResponse.json() as SourceLedChatResponseEnvelope
      expect(
        persistedChatResponse.ok(),
        `POST source-led-chat retry returned ${persistedChatResponse.status()}.`,
      ).toBe(true)
      expect(persistedChatBody.data?.replayed).toBe(false)
      expect(persistedChatBody.data?.exchange).toMatchObject({
        exchangeId: initialExchange?.exchangeId,
        clientMessageId: initialExchange?.clientMessageId,
        revision: initialExchange?.revision,
      })
    }
    if (privateAssistantExpected) {
      assertVerifiedPrivateAssistantResponse(persistedChatBody)
    }
    await expect(
      page.locator('article[data-message-type="user_message"]').filter({ hasText: input.prompt }),
    ).toBeVisible()
    const verifiedAssistantReply = page
      .locator('article[data-message-type="assistant_revision_response"]')
      .last()
    await expect(verifiedAssistantReply).toBeVisible({ timeout: timeoutMs })
    await expect(verifiedAssistantReply).toHaveAttribute(
      'data-message-status',
      /^(?:pending|success)$/,
      { timeout: timeoutMs },
    )
    await expect(verifiedAssistantReply).not.toContainText(
      /AI response could not be verified|private AI service is available/i,
    )
  }

  if (input.sourceAlreadyPrepared) {
    await expect(page.getByTestId('planning-preparation')).toContainText(/Ready to create the plan/i)
    const sourceLedPlanPresentation = page.waitForResponse((response) => {
      const request = response.request()
      return request.method() === 'POST'
        && /\/source-led-plan-presentations(?:\?|$)/.test(request.url())
    }, { timeout: timeoutMs })
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }).first())
    const sourceLedPlanPresentationResponse = await sourceLedPlanPresentation
    if (!sourceLedPlanPresentationResponse.ok()) {
      throw new Error(
        `Canonical source-led plan presentation failed (${sourceLedPlanPresentationResponse.status()}): ${await sourceLedPlanPresentationResponse.text()}`,
      )
    }
    await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible({
      timeout: timeoutMs,
    })
  } else {
    await applySupportedSourceOnlyPreferences(page)
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }).first())
    await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible({
      timeout: timeoutMs,
    })
    await expect(page.getByTestId('planning-preparation')).toContainText(
      /Ready to create the plan/i,
      { timeout: timeoutMs },
    )
    await prepareCurrentSourceLedEditBrief(page, { timeoutMs })
    const sourceLedPlanPresentation = page.waitForResponse((response) => {
      const request = response.request()
      return request.method() === 'POST'
        && /\/source-led-plan-presentations(?:\?|$)/.test(request.url())
    }, { timeout: timeoutMs })
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }).first())
    const sourceLedPlanPresentationResponse = await sourceLedPlanPresentation
    if (!sourceLedPlanPresentationResponse.ok()) {
      throw new Error(
        `Canonical source-led plan presentation failed (${sourceLedPlanPresentationResponse.status()}): ${await sourceLedPlanPresentationResponse.text()}`,
      )
    }
    await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible({
      timeout: timeoutMs,
    })
  }
  await expect(page.getByTestId('plan-review-card')).toBeVisible({ timeout: timeoutMs })
  await expect(page.getByTestId('plan-review-card')).toContainText(/estimated credits/i)
  const canonicalSaveStatus = page.locator(
    '[data-testid^="canonical-planning-save-"]',
  )
  await expect(canonicalSaveStatus).toBeVisible({ timeout: timeoutMs })
  await expect(canonicalSaveStatus).not.toHaveAttribute(
    'data-testid',
    'canonical-planning-save-saving',
    { timeout: timeoutMs },
  )
  const canonicalSaveTestId = await canonicalSaveStatus.getAttribute('data-testid')
  if (
    canonicalSaveTestId
    !== 'canonical-planning-save-plan-published-waiting-for-approval'
  ) {
    throw new Error(
      `Canonical plan publication did not reach approval: ${canonicalSaveTestId ?? 'missing status'} — ${(await canonicalSaveStatus.innerText()).replaceAll(/\s+/g, ' ').trim()}`,
    )
  }
  await expect(page.getByTestId('plan-review-approve')).toBeEnabled({ timeout: timeoutMs })
  await clickWhenReady(page.getByTestId('plan-review-approve'))

  const canonicalApproved = page.locator(
    '[data-testid="canonical-journey-status"][data-journey-stage="approved_snapshot_available"]',
  )
  const privateReview = page.getByTestId('private-review')
  await expect(canonicalApproved.or(privateReview)).toBeVisible({ timeout: timeoutMs })

  if (await canonicalApproved.isVisible()) {
    await expect(canonicalApproved).toContainText(/Approval is safely recorded/i)
    return 'canonical_approved_snapshot'
  }

  await expect(privateReview).toContainText(/Review the edit|Private review/i)
  return 'private_review_ready'
}

export async function applySupportedSourceOnlyPreferences(page: Page): Promise<void> {
  await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
  const advancedPreferences = page.getByTestId(
    'current-edit-preferences-advanced',
  )
  await expect(advancedPreferences).toBeVisible()
  await expect(
    page.getByTestId('current-edit-preference-edit-level'),
  ).toHaveCount(0)
  if (await advancedPreferences.getAttribute('open') === null) {
    await clickWhenReady(advancedPreferences.locator('summary'))
  }
  await page
    .getByTestId('current-edit-preference-workflow')
    .selectOption('simple_clean_edit')
  await page
    .getByTestId('current-edit-preference-visual-direction')
    .selectOption('no_extra_visuals')
  await page
    .getByTestId('current-edit-preference-cleanup')
    .selectOption('preserve_natural')
  await clickWhenReady(
    page.getByRole('button', { name: /^Apply to this edit$/i }),
  )
  await expect(page.getByText(/^Current edit is up to date$/i)).toBeVisible()
  await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
}

export async function prepareCurrentSourceLedEditBrief(
  page: Page,
  input: {
    timeoutMs: number
    goal?: string
  },
): Promise<void> {
  const route = new URL(page.url()).pathname.match(
    /^\/projects\/([^/]+)\/edits\/([^/]+)$/,
  )
  expect(route).not.toBeNull()
  const projectId = decodeURIComponent(route?.[1] ?? '')
  const editSessionId = decodeURIComponent(route?.[2] ?? '')
  const handoff = await readActiveHandoff(page, { projectId, editSessionId })
  const sourceDurationSeconds = handoff?.sourceMediaAssets?.reduce(
    (total, source) => total + (source.sourceMetadata?.durationSeconds ?? 0),
    0,
  ) ?? 0
  expect(sourceDurationSeconds).toBeGreaterThan(0)
  // Preserve the exact FFprobe display duration here. The canonical
  // source-led compiler owns projection onto the confirmed 30 fps output
  // frame grid. Rounding down in the browser can drop the final output frame
  // for fractional-frame source durations.
  const captionEndSeconds = sourceDurationSeconds
  const captionTitle = 'Protect the complete source'
  const captionText = 'Keep the complete source clear and readable.'

  await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
  await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
  const workspace = page.getByTestId('editor-edit-brief-canvas')
  await expect(workspace).toBeVisible({ timeout: input.timeoutMs })
  const directionDetails = workspace.getByTestId('edit-brief-direction-details')
  if (await directionDetails.getAttribute('open') === null) {
    await clickWhenReady(directionDetails.locator('summary'))
  }
  const authorityStatus = workspace.getByTestId('edit-brief-authority-status')
  await expect(authorityStatus).toContainText('Saved', {
    timeout: input.timeoutMs,
  })

  await workspace.getByLabel('Timeline playhead').fill('0')
  await clickWhenReady(workspace.getByTestId('edit-brief-add-direction'))
  const markerPopover = page.getByTestId('edit-brief-marker-popover')
  await expect(markerPopover).toBeVisible()
  await clickWhenReady(
    markerPopover.locator('summary').filter({ hasText: 'More options' }),
  )
  await markerPopover.getByLabel('Type').selectOption('caption')
  await markerPopover.getByLabel('Priority').selectOption('must_follow')
  await markerPopover.getByLabel('Starts at').fill('0')
  await markerPopover.getByLabel('Timing').selectOption('range')
  await markerPopover.getByLabel('Ends at').fill(String(captionEndSeconds))
  await markerPopover.getByLabel('Short label (optional)').fill(captionTitle)
  await markerPopover.getByLabel(/What should happen here/i).fill(captionText)

  const markerCreate = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && /\/edit-brief\/markers(?:\?|$)/.test(request.url())
  }, { timeout: input.timeoutMs })
  await clickWhenReady(
    markerPopover.getByRole('button', { name: 'Add direction' }),
  )
  const markerCreateResponse = await markerCreate
  expect(markerCreateResponse.status()).toBe(201)
  await expect(authorityStatus).toContainText('Saved', {
    timeout: input.timeoutMs,
  })

  await workspace
    .getByTestId('edit-brief-goal-input')
    .fill(
      input.goal ??
        'Preserve the complete source meaning and produce a restrained, professional private review.',
    )
  await page.waitForTimeout(900)
  await expect(authorityStatus).toContainText('Saved', {
    timeout: input.timeoutMs,
  })

  const readyWrite = page.waitForResponse((response) => {
    const request = response.request()
    return ['POST', 'PATCH'].includes(request.method())
      && /\/edit-brief(?:\?|$)/.test(request.url())
      && (request.postData() ?? '').includes('"status":"ready"')
      && response.ok()
  }, { timeout: input.timeoutMs })
  const exactLocalBriefWrite = page.waitForResponse((response) => {
    const request = response.request()
    const url = new URL(request.url())
    return request.method() === 'POST'
      && /^\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/local-brief$/.test(
        url.pathname,
      )
  }, { timeout: input.timeoutMs })
  await clickWhenReady(workspace.getByTestId('edit-brief-mark-ready'))
  await readyWrite
  await expect(authorityStatus).toContainText('Saved', {
    timeout: input.timeoutMs,
  })

  let confirmButton = markerPopover.getByRole('button', {
    name: 'Confirm for plan',
  })
  if (await confirmButton.count() === 0) {
    await clickWhenReady(
      workspace.getByRole('button', {
        name: new RegExp(captionTitle, 'i'),
      }),
    )
    await expect(markerPopover).toBeVisible({ timeout: input.timeoutMs })
    confirmButton = markerPopover.getByRole('button', {
      name: 'Confirm for plan',
    })
  }
  await expect(confirmButton).toBeEnabled({ timeout: input.timeoutMs })
  const markerConfirm = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && /\/edit-brief\/markers\/[^/]+\/confirm(?:\?|$)/.test(request.url())
  }, { timeout: input.timeoutMs })
  await clickWhenReady(confirmButton)
  expect((await markerConfirm).status()).toBe(200)
  const exactLocalBriefWriteResponse = await exactLocalBriefWrite
  const exactLocalBriefWriteBody = await exactLocalBriefWriteResponse.text()
  expect(
    exactLocalBriefWriteResponse.ok(),
    `POST /v1/projects/:projectId/edit-sessions/:editSessionId/local-brief returned ${exactLocalBriefWriteResponse.status()}: ${exactLocalBriefWriteBody}`,
  ).toBe(true)
  await expect(authorityStatus).toContainText('Saved', {
    timeout: input.timeoutMs,
  })

  await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
  await expect(page).not.toHaveURL(/[?&]view=brief(?:&|$)/)
  await expect(page.getByRole('button', { name: /^Create edit plan$/i }).first())
    .toBeEnabled({ timeout: input.timeoutMs })
}

export async function readActiveHandoff(
  page: Page,
  edit: Pick<ActiveProjectEdit, 'projectId' | 'editSessionId'>,
): Promise<LocalInternalProjectHandoff | undefined> {
  return page.evaluate(({ storageKey, projectId, editSessionId }) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      handoffs?: LocalInternalProjectHandoff[]
    }
    return envelope.handoffs?.find((candidate) =>
      candidate.projectId === projectId && candidate.editSessionId === editSessionId,
    )
  }, {
    storageKey: localHandoffStorageKey,
    projectId: edit.projectId,
    editSessionId: edit.editSessionId,
  })
}

function requiredJourneyEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Real local API journey environment is missing ${name}.`)
  }
  return value
}
