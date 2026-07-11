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

test.describe('identity and workspace scoped edit preferences', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1280)
  })

  test('ignores another identity and keeps preferences inaccessible after sign-out', async ({ page }) => {
    const currentScope: EditPreferenceScope = {
      authMode: 'local_test',
      userId: 'local-test-user',
      workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
    }
    const otherIdentityScope: EditPreferenceScope = {
      authMode: 'local_test',
      userId: 'local-test-user-b',
      workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
    }
    const foreignKey = buildLocalEditPreferenceStorageKey(otherIdentityScope)
    const foreignRecord = {
      recordVersion: 2,
      scope: {
        userId: otherIdentityScope.userId,
        workspaceId: otherIdentityScope.workspaceId,
      },
      scopeFingerprint: createEditPreferenceScopeFingerprint(otherIdentityScope),
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
    await expect(page.getByTestId('preference-edit-level')).toHaveValue('pro')
    await expect(page.getByTestId('preference-persistence-status')).toContainText(/signed-in test workspace/i)
    await expect(page.getByTestId('internal-testing-details')).toHaveCount(0)

    await page.getByTestId('preference-edit-level').selectOption('basic')
    await page.getByRole('button', { name: /^Save defaults$/i }).click()
    await expect(page.getByTestId('preference-persistence-status')).toContainText(/Edit Preferences saved for this signed-in test workspace/i)

    const currentKey = buildLocalEditPreferenceStorageKey(currentScope)
    const storedRecords = await page.evaluate(({ currentKeyValue, foreignKeyValue }) => ({
      current: window.localStorage.getItem(currentKeyValue),
      foreign: window.localStorage.getItem(foreignKeyValue),
    }), { currentKeyValue: currentKey, foreignKeyValue: foreignKey })

    expect(storedRecords.current).toBeTruthy()
    expect(JSON.parse(storedRecords.current ?? '{}')).toMatchObject({
      recordVersion: 2,
      scope: {
        userId: currentScope.userId,
        workspaceId: currentScope.workspaceId,
      },
      preferences: { editLevel: 'basic' },
    })
    expect(JSON.parse(storedRecords.foreign ?? '{}')).toEqual(foreignRecord)

    await page.getByTestId('app-session-identity').getByRole('button', { name: /^Sign out$/i }).click()
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    await expect(page.getByTestId('edit-preferences-form')).toHaveCount(0)
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()
    expect(await page.evaluate((key) => window.localStorage.getItem(key), currentKey)).toBeTruthy()

    await page.getByTestId('local-test-sign-in').click()
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByTestId('preference-edit-level')).toHaveValue('basic')
    await expectNoHorizontalOverflow(page)
  })

  test('preserves a failed save draft and succeeds after refresh and retry', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem
      let remainingPreferenceSaveFailures = 2

      Storage.prototype.setItem = function setItemWithBoundedPreferenceFailure(key, value) {
        if (
          remainingPreferenceSaveFailures > 0
          && key.startsWith('reeditpro.localEditPreferences.v2.')
        ) {
          remainingPreferenceSaveFailures -= 1
          throw new DOMException('Bounded preference save failure for resilience QA.', 'QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      }
    })

    await gotoRoute(page, '/preferences')
    const editLevel = page.getByTestId('preference-edit-level')
    const saveButton = page.getByRole('button', { name: /^Save defaults$/i })

    await editLevel.selectOption('basic')
    await saveButton.click()

    await expect(page.getByTestId('preference-persistence-error')).toBeVisible()
    await expect(page.getByTestId('preference-persistence-status')).toContainText(/Your draft is still here/i)
    await expect(editLevel).toHaveValue('basic')
    await expect(page.getByRole('button', { name: /^Retry save$/i })).toBeVisible()

    await page.getByRole('button', { name: /^Refresh saved version$/i }).click()
    await expect(page.getByTestId('preference-persistence-status')).toContainText(/unsaved draft is still here/i)
    await expect(editLevel).toHaveValue('basic')

    await saveButton.click()
    await expect(page.getByTestId('preference-persistence-error')).toBeVisible()
    await expect(editLevel).toHaveValue('basic')
    await page.getByRole('button', { name: /^Retry save$/i }).click()

    await expect(page.getByTestId('preference-persistence-error')).toHaveCount(0)
    await expect(page.getByTestId('preference-persistence-status')).toContainText(/Edit Preferences saved for this signed-in test workspace/i)
    await expect(editLevel).toHaveValue('basic')
    await expect(saveButton).toHaveCount(0)

    const currentScope: EditPreferenceScope = {
      authMode: 'local_test',
      userId: 'local-test-user',
      workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
    }
    const currentKey = buildLocalEditPreferenceStorageKey(currentScope)
    const storedRecord = await page.evaluate((key) => window.localStorage.getItem(key), currentKey)

    expect(storedRecord).toBeTruthy()
    expect(JSON.parse(storedRecord ?? '{}')).toMatchObject({
      scope: {
        userId: currentScope.userId,
        workspaceId: currentScope.workspaceId,
      },
      preferences: { editLevel: 'basic' },
    })
    await expectNoHorizontalOverflow(page)
  })

  test('guards unsaved defaults across sidebar navigation and sign-out', async ({ page }) => {
    await gotoRoute(page, '/preferences')
    const editLevel = page.getByTestId('preference-edit-level')
    await editLevel.selectOption('basic')

    const navigationDialogPromise = page.waitForEvent('dialog')
    const navigationClickPromise = page.getByRole('link', { name: /^Home$/i }).click()
    const navigationDialog = await navigationDialogPromise
    expect(navigationDialog.message()).toMatch(/Discard unsaved Edit Preferences/i)
    await navigationDialog.dismiss()
    await navigationClickPromise
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(editLevel).toHaveValue('basic')

    const signOutDialogPromise = page.waitForEvent('dialog')
    const signOutClickPromise = page.getByTestId('app-session-identity').getByRole('button', { name: /^Sign out$/i }).click()
    const signOutDialog = await signOutDialogPromise
    expect(signOutDialog.message()).toMatch(/Discard unsaved Edit Preferences/i)
    await signOutDialog.dismiss()
    await signOutClickPromise
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(editLevel).toHaveValue('basic')

    const acceptedNavigationPromise = page.waitForEvent('dialog')
    const acceptedClickPromise = page.getByRole('link', { name: /^Home$/i }).click()
    await (await acceptedNavigationPromise).accept()
    await acceptedClickPromise
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
