import { expect, test } from '@playwright/test'
import { expectCardAttachedToAssistantMessage, expectChatCardNotTooWide, expectChatCardsFitUnderComposer, expectChatRhythmStable, expectComposerFadeLayer, expectCompactComposerSurface, expectFloatingComposerAligned, expectMessageLabelsNotOvercrowded, expectNoCardHorizontalOverflow, expectNoExcessiveVerticalGaps, expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { installActiveProductRouteFixture, missingNamedEditPath } from './helpers/active-product'
import { checkedRoutes, gotoRoute, legacyRedirectRoutes, viewportWidths } from './helpers/routes'

const retiredAppSurfacePattern = /Credit wallet preview|Export queue|Brand Kit|View pricing|See pricing|mock jobs/i

test.describe('route viewport QA', () => {
  for (const route of checkedRoutes) {
    for (const width of viewportWidths) {
      test(`${route.label} has no horizontal overflow at ${width}px`, async ({ page }) => {
        await setViewport(page, width)
        await gotoRoute(page, route.path)

        const bodyText = await page.locator('body').innerText()
        expect(bodyText.trim().length, `${route.path} should not render blank`).toBeGreaterThan(20)

        const appMain = page.getByTestId('app-main')
        if (await appMain.count()) {
          await expect(appMain).toBeVisible()
          const links = page.getByTestId('app-sidebar').getByRole('link')
          await expect(links).toHaveCount(3)
          await expect(links.nth(0)).toContainText('Home')
          await expect(links.nth(1)).toContainText('Projects')
          await expect(links.nth(2)).toContainText('Preferences')
          await expect(page.getByRole('link', { name: /wallet|pricing|brand kit|exports|upload/i })).toHaveCount(0)
        }
        await expect(page.locator('body')).not.toContainText(retiredAppSurfacePattern)

        await expectNoHorizontalOverflow(page)

        if (route.path === '/editor') {
          const editorHeader = page.getByTestId('editor-header')
          await expect(editorHeader).toBeVisible({ timeout: 15_000 })
          await expect(editorHeader.getByRole('heading', { level: 1 })).toBeVisible()
          await expect(editorHeader).toContainText(/edit/i)
          await expect(page.getByRole('heading', { name: 'Chat-native editor' })).toHaveCount(0)
          await expectComposerFadeLayer(page)
          await expectFloatingComposerAligned(page)
          await expectCompactComposerSurface(page)
          await expectChatCardsFitUnderComposer(page)
          await expectChatCardNotTooWide(page, page.getByTestId('source-sequence-card'), 'source sequence card')
          await expectChatRhythmStable(page)
          await expectMessageLabelsNotOvercrowded(page)
          await expectCardAttachedToAssistantMessage(page)
          await expectNoExcessiveVerticalGaps(page)
          await expectNoCardHorizontalOverflow(page)

          await page.getByTestId('chat-thread').evaluate((element) => {
            element.scrollTop = element.scrollHeight
          })
          await expectFloatingComposerAligned(page)
          await expectCompactComposerSurface(page)
          await expectChatCardsFitUnderComposer(page)
          await expectNoCardHorizontalOverflow(page)
          await expectNoHorizontalOverflow(page)
        }
      })
    }
  }

  test.describe('dynamic active resource routes', () => {
    for (const width of viewportWidths) {
      test(`project detail has no horizontal overflow at ${width}px`, async ({ page }) => {
        const fixture = await installActiveProductRouteFixture(page, `project-${width}`)
        await setViewport(page, width)
        await gotoRoute(page, fixture.projectPath)

        await expect(page.getByRole('heading', { level: 1, name: fixture.project.name })).toBeVisible()
        await expect(page.getByTestId('project-edit-list')).toContainText(fixture.edit.editName ?? '')
        await expect(page.getByRole('link', { name: /Upload source/i })).toBeVisible()
        await expectNoHorizontalOverflow(page)
      })

      test(`named edit upload gate has no horizontal overflow at ${width}px`, async ({ page }) => {
        const fixture = await installActiveProductRouteFixture(page, `named-edit-${width}`)
        await setViewport(page, width)
        await gotoRoute(page, fixture.editPath)

        await expect(page.getByTestId('editor-page')).toBeVisible()
        const editorHeader = page.getByTestId('editor-header')
        const projectBackLink = page.getByTestId('editor-project-back')
        await expect(editorHeader).toContainText(fixture.edit.editName ?? '')
        await expect(projectBackLink).toBeVisible()
        await expect(projectBackLink).toContainText(fixture.project.name)
        await expect(projectBackLink).toHaveAttribute('href', fixture.projectPath)
        await expect(page.getByTestId('edit-workspace-view-chat')).toHaveAttribute('aria-current', 'page')
        const headerCopyWidth = await editorHeader.locator('.chat-native-header-copy').evaluate((element) =>
          Math.round(element.getBoundingClientRect().width))
        expect(headerCopyWidth, 'project and edit identity must retain usable header width').toBeGreaterThanOrEqual(180)
        await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
        await expect(page.getByRole('button', { name: /Choose source video/i })).toBeVisible()
        await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
        if (width > 1220) {
          await expect(page.getByTestId('edit-preview-rail')).toBeVisible()
        } else {
          await expect(page.getByTestId('edit-preview-rail')).toBeHidden()
        }
        await expectNoHorizontalOverflow(page)
      })

      test(`named edit recovery error has no horizontal overflow at ${width}px`, async ({ page }) => {
        await setViewport(page, width)
        await gotoRoute(page, missingNamedEditPath(`recovery-${width}`))

        const recoveryError = page.getByTestId('named-edit-route-not-found')
        await expect(recoveryError).toBeVisible()
        await expect(recoveryError).toContainText(/Edit not found/i)
        await expect(recoveryError.getByRole('link', { name: /Back to project/i })).toBeVisible()
        await expect(page.getByTestId('editor-page')).toHaveCount(0)
        await expectNoHorizontalOverflow(page)
      })
    }

    test('named edit returns to the exact parent project', async ({ page }) => {
      const fixture = await installActiveProductRouteFixture(page, 'named-edit-back-navigation')
      await setViewport(page, 1280)
      await gotoRoute(page, fixture.editPath)

      await expect(page.getByTestId('editor-project-back')).toHaveAccessibleName(
        `Back to project: ${fixture.project.name}`,
      )
      await page.getByTestId('current-edit-preferences-trigger').click()
      await expect(page).toHaveURL(/\?view=preferences$/)
      await expect(page.getByTestId('current-edit-preferences-trigger')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByTestId('edit-workspace-view-chat')).not.toHaveAttribute('aria-current', 'page')
      await expect(page.getByTestId('editor-project-back')).toContainText(fixture.project.name)
      await page.getByTestId('editor-project-back').click()

      await expect(page).toHaveURL(new RegExp(`${fixture.projectPath}$`))
      await expect(page.getByRole('heading', { level: 1, name: fixture.project.name })).toBeVisible()
      await expect(page.getByTestId('project-edit-list')).toContainText(fixture.edit.editName ?? '')
    })
  })

  test.describe('legacy app route redirects', () => {
    for (const route of legacyRedirectRoutes) {
      test(`${route.label} redirects to the clean app flow`, async ({ page }) => {
        await setViewport(page, 1280)
        await gotoRoute(page, route.path)

        await expect(page).toHaveURL(new RegExp(`${route.expectedPath.replace('/', '\\/')}$`))
        await expect(page.locator('body')).not.toContainText(retiredAppSurfacePattern)

        const appMain = page.getByTestId('app-main')
        await expect(appMain).toBeVisible()
        const links = page.getByTestId('app-sidebar').getByRole('link')
        await expect(links).toHaveCount(3)
        await expect(links.nth(0)).toContainText('Home')
        await expect(links.nth(1)).toContainText('Projects')
        await expect(links.nth(2)).toContainText('Preferences')
        await expect(page.getByRole('link', { name: /wallet|pricing|brand kit|exports|upload/i })).toHaveCount(0)
        await expectNoHorizontalOverflow(page)
      })
    }
  })
})
