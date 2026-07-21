import { expect, test, type Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  findPlanReview,
  gotoRoute,
  uploadEditorGateSourceVideo,
} from './helpers/routes'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

const projectScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const handoffStorageKey = buildLocalProjectHandoffStorageKey(projectScope)

async function createNamedEdit(page: Page, label: string) {
  await gotoRoute(page, '/projects/new')
  await page.getByLabel(/Project name/i).fill(`Preference project ${label} ${Date.now()}`)
  await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
  await page.getByLabel(/Edit name/i).fill(`Preference edit ${label}`)
  await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
  await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
}

async function readHandoff(page: Page): Promise<LocalInternalProjectHandoff | undefined> {
  return page.evaluate((storageKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      handoffs?: LocalInternalProjectHandoff[]
    }
    return envelope.handoffs?.[0]
  }, handoffStorageKey)
}

async function openAdvancedPreferences(page: Page) {
  const advanced = page.getByTestId('current-edit-preferences-advanced')
  if (await advanced.getAttribute('open') === null) {
    await clickWhenReady(advanced.locator('summary'))
  }
}

async function expectCurrentEditPreferencesApplied(page: Page) {
  await expect(page.getByText(/^Current edit is up to date$/i)).toBeVisible()
}

test.describe('saved and current Edit Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('captures an immutable baseline, applies exact-edit overrides, and resets to the original defaults', async ({ page }) => {
    await createNamedEdit(page, 'inheritance')
    const created = await readHandoff(page)
    if (!created?.setup.preferenceBaseline) throw new Error('The named edit did not preserve its immutable preference baseline.')
    const baseline = created.setup.preferenceBaseline
    expect(created.setup.preferenceRevision).toBe(0)
    expect(baseline.provenance).toBe('saved_edit_preferences')

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page).toHaveURL(/view=preferences/)
    await expect(page.getByTestId('editor-chat-canvas')).toBeHidden()
    const preferencesForm = page.getByTestId('current-edit-preferences-form')
    await expect(preferencesForm).toBeVisible()
    await openAdvancedPreferences(page)
    await expect(preferencesForm.locator('.current-edit-preference-group')).toHaveCount(3)
    await expect(preferencesForm.locator('.current-edit-preference-field')).toHaveCount(7)
    expect(await preferencesForm.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(Math.round((await preferencesForm.boundingBox())?.width ?? 0)).toBeLessThanOrEqual(1080)
    const firstPreferenceGrid = preferencesForm.locator('.current-edit-preference-grid').first()
    expect(await firstPreferenceGrid.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    await expect(page.getByTestId('current-edit-preference-edit-level')).toHaveValue(baseline.editLevel)
    await expect(page.getByTestId('preference-source-editLevel')).toContainText(/Inherited/i)

    await page.getByTestId('current-edit-preference-mood').selectOption('premium')
    const resetAllButton = page.getByRole('button', { name: /^Use all original defaults$/i })
    await expect(resetAllButton).toBeEnabled()
    await clickWhenReady(resetAllButton)
    await expect(page.getByTestId('current-edit-preference-mood')).toHaveValue(baseline.moodStyle)
    await expect(page.getByRole('button', { name: /^Apply to this edit$/i })).toHaveCount(0)

    await page.getByTestId('current-edit-preference-mood').selectOption('premium')
    await page.getByTestId('current-edit-preference-cleanup').selectOption('light_cleanup')
    await expect(page.getByTestId('preference-material-change-warning')).toContainText(/shape the next plan/i)
    const preferenceActions = preferencesForm.locator('.current-edit-preferences-actions')
    await expect(preferenceActions).toBeVisible()
    expect(await preferenceActions.evaluate((element) => getComputedStyle(element).position)).toBe('sticky')

    await page.evaluate(() => window.history.back())
    const historyGuard = page.getByRole('alertdialog', { name: /Discard unapplied changes/i })
    await expect(historyGuard).toBeVisible()
    await expect(historyGuard).toContainText(/Apply these choices to this edit, or discard the draft before leaving/i)
    await clickWhenReady(historyGuard.getByRole('button', { name: /^Keep editing$/i }))
    await expect(page).toHaveURL(/view=preferences/)
    await expect(page.getByTestId('current-edit-preference-mood')).toHaveValue('premium')

    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
    await expect(page.getByTestId('current-edit-preferences-leave-guard')).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /^Keep editing$/i }))
    await expect(page).toHaveURL(/view=preferences/)

    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expectCurrentEditPreferencesApplied(page)
    await expect(page.getByTestId('preference-source-moodStyle')).toContainText(/Changed for this edit/i)

    const overridden = await readHandoff(page)
    expect(overridden?.setup).toMatchObject({
      cleanupPreference: 'light_cleanup',
      moodStyle: 'premium',
      preferenceOverrideKeys: expect.arrayContaining(['cleanupPreference', 'moodStyle']),
      preferenceRevision: 1,
      preferenceBaseline: {
        cleanupPreference: baseline.cleanupPreference,
        moodStyle: baseline.moodStyle,
      },
    })

    await page.reload()
    await expect(page.getByTestId('current-edit-preferences-form')).toBeVisible()
    await openAdvancedPreferences(page)
    await expect(page.getByTestId('current-edit-preference-mood')).toHaveValue('premium')
    await expect(page.getByTestId('preference-source-moodStyle')).toContainText(/Changed for this edit/i)

    await clickWhenReady(page.getByTestId('preference-reset-moodStyle'))
    await clickWhenReady(page.getByTestId('preference-reset-cleanupPreference'))
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expect(page.getByText(/Using the saved defaults copied into this edit/i)).toBeVisible()

    const reset = await readHandoff(page)
    expect(reset?.setup).toMatchObject({
      cleanupPreference: baseline.cleanupPreference,
      moodStyle: baseline.moodStyle,
      preferenceRevision: 2,
    })
    expect(reset?.setup.preferenceOverrideKeys).not.toContain('cleanupPreference')
    expect(reset?.setup.preferenceOverrideKeys).not.toContain('moodStyle')
    await expect(page.getByTestId('preference-source-moodStyle')).toContainText(/Inherited/i)

    await setViewport(page, 700)
    expect(
      await firstPreferenceGrid.evaluate((element) => (
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
      )),
    ).toBe(1)
    expect(
      await preferencesForm.locator('.current-edit-preferences-heading').evaluate((element) => (
        getComputedStyle(element).flexDirection
      )),
    ).toBe('column')
    await expectNoHorizontalOverflow(page)
  })

  test('clears a stale draft plan and requires source prep again when cleanup changes', async ({ page }) => {
    test.fail(
      true,
      'Canonical planning still reads the retired exact-preference store instead of the V3/V6 atomic authority.',
    )
    await createNamedEdit(page, 'replan')
    await uploadEditorGateSourceVideo(page, 'current-preferences-source.mp4')
    await page.getByTestId('chat-composer-textarea').fill('Create a concise product update with a calm, premium finish.')
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))
    await expect(await findPlanReview(page)).toBeVisible()

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await openAdvancedPreferences(page)
    await page.getByTestId('current-edit-preference-cleanup').selectOption('light_cleanup')
    await expect(page.getByTestId('preference-material-change-warning')).toContainText(/fresh plan and estimate/i)
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expectCurrentEditPreferencesApplied(page)
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))

    await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
    await expect(page.getByTestId('planning-preparation')).toContainText(/Prepare the source/i)
    await expect(page.getByText(/previous draft plan and estimate were cleared/i)).toBeVisible()

    const invalidated = await readHandoff(page)
    expect(invalidated).toMatchObject({
      stage: 'source_uploaded',
      setup: {
        cleanupPreference: 'light_cleanup',
        preferenceRevision: 1,
      },
    })
    expect(invalidated?.approvedSnapshotId).toBeUndefined()
    expect(invalidated?.approvedCreditReservationId).toBeUndefined()
    expect(invalidated?.privateReview).toBeUndefined()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps approved preferences read-only and routes changes through Chat revision', async ({ page }) => {
    test.fail(
      true,
      'Plan approval remains fail-closed until canonical planning consumes the V3/V6 exact-preference authority.',
    )
    await createNamedEdit(page, 'approved')
    await uploadEditorGateSourceVideo(page, 'approved-preferences-source.mp4')
    await page.getByTestId('chat-composer-textarea').fill('Create a clean founder update and preserve the core explanation.')
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))
    await expect(await findPlanReview(page)).toBeVisible()
    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('private-review')).toBeVisible({ timeout: 10_000 })

    const approvedBeforeOpen = await readHandoff(page)
    expect(approvedBeforeOpen?.approvedSnapshotId).toBeTruthy()

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page.getByTestId('current-edit-preferences-locked')).toBeVisible()
    await openAdvancedPreferences(page)
    await expect(page.getByTestId('current-edit-preference-edit-level')).toBeDisabled()
    await expect(page.getByRole('button', { name: /^Apply to this edit$/i })).toBeDisabled()

    const approvedAfterOpen = await readHandoff(page)
    expect(approvedAfterOpen?.approvedSnapshotId).toBe(approvedBeforeOpen?.approvedSnapshotId)
    expect(approvedAfterOpen?.approvedCreditReservationId).toBe(approvedBeforeOpen?.approvedCreditReservationId)

    await clickWhenReady(page.getByTestId('current-edit-preferences-locked').getByRole('button', { name: /^Return to Chat$/i }))
    await expect(page.getByTestId('private-review')).toBeVisible()
    await expect(page).not.toHaveURL(/view=preferences/)

    await page.getByTestId('chat-composer-textarea').fill('Use the product demo workflow, light cleanup, premium mood, and save credits.')
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await expect(page.getByText(/previous plan is cleared.*cleanup direction must be planned again/i)).toBeVisible()

    const revised = await readHandoff(page)
    expect(revised).toMatchObject({
      stage: 'source_uploaded',
      setup: {
        workflowType: 'product_demo',
        cleanupPreference: 'light_cleanup',
        cleanupPreferenceConfirmed: true,
        moodStyle: 'premium',
        creditPreference: 'low_credit_cost',
      },
      revisionPlanContext: {
        previousApprovedSnapshotId: approvedBeforeOpen?.approvedSnapshotId,
        previousCreditReservationId: approvedBeforeOpen?.approvedCreditReservationId,
        freshPlanRequired: true,
        freshPrivateReviewRequired: true,
      },
    })
    expect(revised?.approvedSnapshotId).toBeUndefined()
    expect(revised?.approvedCreditReservationId).toBeUndefined()
    await expectNoHorizontalOverflow(page)
  })

  test('does not confirm untouched setup gates when only a non-gate preference changes', async ({ page }) => {
    await createNamedEdit(page, 'unconfirmed-defaults')
    await page.evaluate((storageKey) => {
      const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
        handoffs?: LocalInternalProjectHandoff[]
      }
      const handoff = envelope.handoffs?.[0]
      if (!handoff) throw new Error('The exact named-edit handoff was not found.')
      handoff.setup.editLevelConfirmed = false
      handoff.setup.cleanupPreferenceConfirmed = false
      handoff.setup.visualPreferenceConfirmed = false
      window.localStorage.setItem(storageKey, JSON.stringify(envelope))
    }, handoffStorageKey)
    await page.reload()
    const initial = await readHandoff(page)
    expect(initial?.setup).toMatchObject({
      editLevelConfirmed: false,
      cleanupPreferenceConfirmed: false,
      visualPreferenceConfirmed: false,
    })

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await openAdvancedPreferences(page)
    await page.getByTestId('current-edit-preference-mood').selectOption('premium')
    await clickWhenReady(page.getByRole('button', { name: /^Apply to this edit$/i }))
    await expectCurrentEditPreferencesApplied(page)

    const updated = await readHandoff(page)
    expect(updated?.setup).toMatchObject({
      moodStyle: 'premium',
      editLevelConfirmed: false,
      cleanupPreferenceConfirmed: false,
      visualPreferenceConfirmed: false,
    })
  })
})
