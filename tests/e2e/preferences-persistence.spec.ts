import { expect, test } from '@playwright/test'
import {
  DEFAULT_LOCAL_EDIT_PREFERENCES,
} from '../../src/lib/edit-preferences'
import {
  LEGACY_UNSCOPED_EDIT_PREFERENCE_STORAGE_KEY,
  LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
  buildLocalEditPreferenceStorageKey,
  createEditPreferenceScopeFingerprint,
  type EditPreferenceScope,
} from '../../src/lib/edit-preference-repository'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('identity-scoped Edit Preference library', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1280)
  })

  test('does not let retired defaults storage replace the canonical library', async ({ page }) => {
    const foreignScope: EditPreferenceScope = {
      authMode: 'local_test',
      userId: 'local-test-user-b',
      workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
    }
    const foreignKey = buildLocalEditPreferenceStorageKey(foreignScope)
    const foreignRecord = {
      recordVersion: 2,
      scope: {
        userId: foreignScope.userId,
        workspaceId: foreignScope.workspaceId,
      },
      scopeFingerprint: createEditPreferenceScopeFingerprint(foreignScope),
      preferences: {
        ...DEFAULT_LOCAL_EDIT_PREFERENCES,
        editLevel: 'basic',
        snapshotId: 'foreign-user-preference-snapshot',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
      savedAt: '2026-07-10T12:00:00.000Z',
    }

    await page.goto('/')
    await page.evaluate(({ foreignKeyValue, foreignRecordValue, legacyKey }) => {
      window.localStorage.setItem(foreignKeyValue, JSON.stringify(foreignRecordValue))
      window.localStorage.setItem(legacyKey, JSON.stringify({
        ...foreignRecordValue.preferences,
        editLevel: 'premium',
      }))
    }, {
      foreignKeyValue: foreignKey,
      foreignRecordValue: foreignRecord,
      legacyKey: LEGACY_UNSCOPED_EDIT_PREFERENCE_STORAGE_KEY,
    })

    await gotoRoute(page, '/preferences')
    const workspace = page.getByTestId('edit-preferences-page')
    await expect(workspace).toBeVisible()
    await expect(workspace).toHaveAttribute('data-workspace-id', LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID)
    await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()
    await expect(page.getByTestId('edit-reference-empty-state')).toHaveCount(0)
    await expect(page.getByTestId('preference-edit-level')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Save defaults$/i })).toHaveCount(0)

    expect(await page.evaluate((key) => window.localStorage.getItem(key), foreignKey)).toBe(JSON.stringify(foreignRecord))
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the library protected by the signed-in workspace boundary', async ({ page }) => {
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()

    await page.getByTestId('app-session-identity').getByRole('button', { name: /^Sign out$/i }).click()
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    await expect(page.getByTestId('edit-preferences-page')).toHaveCount(0)
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()

    await page.getByTestId('local-test-sign-in').click()
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
