import { expect, type Page } from '@playwright/test'
import { stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../../src/lib/local-project-handoff'
import {
  clickWhenReady,
  createPlanFromUploadedEditorSources,
  gotoRoute,
} from './routes'

const localTestScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const localHandoffStorageKey = buildLocalProjectHandoffStorageKey(localTestScope)

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
  await gotoRoute(page, '/projects/new')
  await expect(page.getByTestId('app-session-identity')).toContainText('Local test user')
  await expect(page.getByRole('heading', { level: 1, name: /^New project$/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /What are you working on/i })).toBeVisible()
  await page.getByLabel(/Project name/i).fill(input.projectName)
  await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())

  await expect(page).toHaveURL(/\/projects\/[^/?]+$/)
  await expect(page.getByRole('heading', { level: 1, name: input.projectName })).toBeVisible()
  await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
  await expect(page.getByTestId('new-edit-dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Name this edit/i })).toBeVisible()
  await page.getByLabel(/Edit name/i).fill(input.editName)
  await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())

  await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+(?:\?.*)?$/)
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('editor-header')).toContainText(input.editName)
  await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
  await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()

  const url = new URL(page.url())
  const routeMatch = url.pathname.match(/^\/projects\/([^/]+)\/edits\/([^/]+)$/)
  expect(routeMatch).not.toBeNull()

  return {
    projectId: decodeURIComponent(routeMatch?.[1] ?? ''),
    editSessionId: decodeURIComponent(routeMatch?.[2] ?? ''),
    projectName: input.projectName,
    editName: input.editName,
  }
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
  const finalizeResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && /^\/v1\/upload-intents\/[^/]+\/finalize$/.test(url.pathname)
  }, { timeout: timeoutMs })

  await page.getByTestId('edit-upload-gate-input').setInputFiles(input.fixturePath)
  const finalized = await finalizeResponse
  expect(finalized.ok()).toBe(true)
  const finalizedEnvelope = await finalized.json() as {
    ok?: boolean
    data?: {
      mediaAsset?: {
        fileName?: string
        status?: string
      }
    }
  }
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
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await expect(
      page.locator('article[data-message-type="user_message"]').filter({ hasText: input.prompt }),
    ).toBeVisible()
  }

  if (input.sourceAlreadyPrepared) {
    await expect(page.getByTestId('planning-preparation')).toContainText(/Ready to create the plan/i)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }).first())
    await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible({
      timeout: timeoutMs,
    })
  } else {
    await createPlanFromUploadedEditorSources(page)
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
