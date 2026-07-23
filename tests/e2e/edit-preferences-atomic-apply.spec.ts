import { expect, test } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import { clickWhenReady, gotoRoute } from './helpers/routes'

const projectScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const handoffStorageKey = buildLocalProjectHandoffStorageKey(projectScope)

test('recovers one committed exact-edit Apply after the browser loses its response', async ({ page }) => {
  await gotoRoute(page, '/projects/new')
  await page.getByLabel(/Project name/i).fill(`Atomic preferences ${Date.now()}`)
  await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
  await page.getByLabel(/Edit name/i).fill('Atomic Apply recovery')
  await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
  await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
  await expect(page).toHaveURL(/view=preferences/)

  const advanced = page.getByTestId('current-edit-preferences-advanced')
  if (await advanced.getAttribute('open') === null) await clickWhenReady(advanced.locator('summary'))
  await page.getByTestId('current-edit-preference-mood').selectOption('premium')

  const attempts: Array<{ idempotencyKey: string | null; body: string | null; responseBody: string }> = []
  await page.route(/\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-preferences\/apply$/, async (route) => {
    const response = await route.fetch()
    attempts.push({
      idempotencyKey: route.request().headers()['idempotency-key'] ?? null,
      body: route.request().postData(),
      responseBody: await response.text(),
    })
    if (attempts.length === 1) {
      await route.abort('failed')
      return
    }
    await route.fulfill({ response })
  })

  await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
  await expect(page.getByTestId('current-edit-preferences-pending-apply')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Retry Apply$/i })).toBeVisible()

  const pendingBeforeReload = await page.evaluate(() => Object.keys(window.localStorage)
    .filter((key) => key.includes('exactEditPreferencePendingApply')))
  expect(pendingBeforeReload).toHaveLength(1)

  await page.reload()
  await expect(page.getByTestId('current-edit-preferences-pending-apply')).toBeVisible()
  await clickWhenReady(page.getByRole('button', { name: /^Retry Apply$/i }))
  await expect(page.getByTestId('current-edit-preferences-pending-apply')).toHaveCount(0)
  await expect(page.getByText(/^Current edit is up to date$/i)).toBeVisible()

  expect(attempts).toHaveLength(2)
  expect(attempts[0]?.idempotencyKey).toBeTruthy()
  expect(attempts[1]?.idempotencyKey).toBe(attempts[0]?.idempotencyKey)
  expect(attempts[1]?.body).toBe(attempts[0]?.body)
  expect(JSON.parse(attempts[1]?.responseBody ?? '{}')).toEqual(
    JSON.parse(attempts[0]?.responseBody ?? '{}'),
  )

  const handoff = await page.evaluate((storageKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      handoffs?: LocalInternalProjectHandoff[]
    }
    return envelope.handoffs?.[0]
  }, handoffStorageKey)
  expect(handoff?.setup).toMatchObject({
    moodStyle: 'premium',
    preferenceRevision: 1,
    preferenceOverrideKeys: expect.arrayContaining(['moodStyle']),
  })
  await expect(page.getByTestId('preference-source-moodStyle')).toContainText(/Changed for this edit/i)
  await expect(page.getByRole('button', { name: /^Apply to this edit$/i })).toBeDisabled()
})
