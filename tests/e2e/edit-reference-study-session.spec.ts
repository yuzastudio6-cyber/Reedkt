import { expect, test } from '@playwright/test'
import { gotoRoute } from './helpers/routes'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`

test.describe('Edit Reference durable study session', () => {
  test('creates, chats, reloads, and keeps future gates truthful', async ({ page }) => {
    const referenceName = `Evidence-first documentary ${Date.now()}`
    await gotoRoute(page, '/preferences')

    await expect(page.getByTestId('edit-preference-tab-edit-references')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-preferences-sidebar-link')).toContainText('Edit Preferences')
    await expect(page.getByTestId('edit-preferences-page')).not.toContainText(/Gate 1|backend-local|No model calls|Supabase|localStorage|provider payload/i)

    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(referenceName)
    await page.getByTestId('edit-reference-description').fill('Learn evidence-first pacing and restrained maps. Never copy exact layouts, marks, fonts, or publisher identity.')
    await page.getByTestId('save-edit-reference').click()

    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByText('Study evidence not complete')).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()
    await expect(page.getByText('QA not run').first()).toBeVisible()
    await expect(page.getByText('Study setup').first()).toBeVisible()

    const direction = 'Keep location and evidence legible. Use tension through pacing, not through copying branded compositions.'
    await page.getByTestId('edit-reference-study-message').fill(direction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByText(direction)).toBeVisible()
    await expect(page.getByText(/Add reference evidence when you are ready/)).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByText(direction)).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()

    await page.getByTestId('edit-preference-tab-applied-edits').click()
    await expect(page.getByTestId('applied-edits-panel')).not.toContainText(referenceName)
    await page.getByTestId('edit-preference-tab-safety-privacy').click()
    await expect(page.getByTestId('safety-privacy-panel')).toContainText('Creating or discussing a reference never starts production')
    await expect(page.getByTestId('safety-privacy-panel')).toContainText('never copied blindly')
  })

  test('preserves legacy defaults under the secondary workspace tab', async ({ page }) => {
    await gotoRoute(page, '/edit-preferences')
    await page.getByTestId('edit-preference-tab-workspace-defaults').click()
    await expect(page.getByTestId('workspace-defaults-panel')).toBeVisible()
    await expect(page.getByTestId('workspace-defaults-legacy-page')).toBeVisible()
    await expect(page.getByTestId('new-edit-preference-button')).toBeVisible()
  })

  test('saves evidence, studies it truthfully, and restores findings after reload', async ({ page }) => {
    const referenceName = `Evidence study ${Date.now()}`
    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(referenceName)
    await page.getByTestId('edit-reference-description').fill('Preserve restrained editorial judgment without copying reference-specific details.')
    await page.getByTestId('save-edit-reference').click()

    await page.getByTestId('add-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-evidence-form')).toBeVisible()
    await page.getByTestId('edit-reference-evidence-title').fill('Measured documentary direction')
    await page.getByTestId('edit-reference-evidence-summary').fill('Use measured pacing, clear evidence cards, readable captions, and original compositions. Never copy a logo, exact layout, or creator identity.')
    await page.getByTestId('save-edit-reference-evidence').click()

    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Measured documentary direction')
    await expect(page.getByText('Study the saved evidence', { exact: true })).toBeVisible()
    await page.getByTestId('run-edit-reference-evidence-study').click()

    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Latest study findings')
    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Saved evidence is framed as transferable editing judgment')
    await expect(page.getByText('evidence ready').first()).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()
    await expect(page.getByText('QA not run').first()).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-action')).toContainText('Evidence is ready for Preference DNA')
    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('evidence-linked rules')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Do-not-copy Rules')
    await expect(page.getByText('Version 1 · review required')).toBeVisible()
    await expect(page.getByText('QA not run').first()).toBeVisible()
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toContainText('Quality review')
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toContainText('Evidence confidence')
    await expect(page.getByTestId('edit-preferences-page')).not.toContainText(/QA result ID|content digest|evidence digest|SHA-256|provider|worker|render job|credit action/i)
    await expect(page.getByText('QA review required')).toBeVisible()
    await expect(page.getByTestId('approve-edit-reference-dna')).toBeDisabled()
    await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
    await page.getByTestId('approve-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Approved reusable guidance')
    await expect(page.getByTestId('edit-reference-target-ready')).toContainText('Choose this reference from a project edit')
    await expect(page.getByText('Version 1 · approved')).toBeVisible()
    await expect(page.getByText('Review acknowledged')).toBeVisible()
    await expect(page.getByText('Ready for a target edit')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Measured documentary direction')
    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Latest study findings')
    await expect(page.getByText('Transferability checked')).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Approved reusable guidance')
    await expect(page.getByText('Ready for a target edit')).toBeVisible()

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByTestId('edit-reference-evidence-title').fill('Measured documentary direction v2')
    await page.getByTestId('edit-reference-evidence-summary').fill('Use a more deliberate pace, original evidence compositions, and readable labels designed for the target edit.')
    await page.getByTestId('edit-reference-evidence-correction').selectOption({ label: 'Measured documentary direction' })
    await page.getByTestId('save-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toHaveCount(0)
    await expect(page.getByText('Version 1 · approved')).toBeVisible()
    await page.getByTestId('run-edit-reference-evidence-study').click()
    await expect(page.getByTestId('edit-reference-dna-action')).toBeVisible()
    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 2')
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toBeVisible()
    await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
    await page.getByTestId('approve-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Approved reusable guidance')

    await page.reload()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 2')
    await expect(page.getByText('Version 2 · approved')).toBeVisible()
    await expect(page.getByText('Ready for a target edit')).toBeVisible()

    const workspaceForApi = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceForApi).toBeTruthy()
    if (!workspaceForApi) throw new Error('Edit Reference workspace identity is missing from the test surface.')
    const referencesResponse = await fetch(`${apiBaseUrl}/v1/edit-references?workspaceId=${encodeURIComponent(workspaceForApi)}`)
    const referencesPayload = await referencesResponse.json() as { ok: true; data: { references: Array<{ reference: { id: string; name: string } }> } }
    const reference = referencesPayload.data.references.find((item) => item.reference.name === referenceName)?.reference
    expect(reference).toBeTruthy()
    const detailResponse = await fetch(`${apiBaseUrl}/v1/edit-references/${reference!.id}?workspaceId=${encodeURIComponent(workspaceForApi)}`)
    const detailPayload = await detailResponse.json() as { ok: true; data: { detail: import('../../src/types/edit-reference').EditReferenceDetail } }
    const approvedDNA = detailPayload.data.detail.dnaVersions.find((record) => record.status === 'approved')
    expect(approvedDNA).toBeTruthy()
    const applicationResponse = await fetch(`${apiBaseUrl}/v1/edit-reference-studies/${detailPayload.data.detail.study.id}/preference-dna/${approvedDNA!.id}/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': `e2e-target-application-${Date.now()}` },
      body: JSON.stringify({
        workspaceId: workspaceForApi,
        expectedReferenceRevision: detailPayload.data.detail.reference.revision,
        expectedDNAContentDigest: approvedDNA!.contentDigest,
        acknowledgeAdaptNotCopy: true,
        targetContext: {
          projectId: 'project-e2e-voice-tutorial',
          editSessionId: `edit-e2e-voice-tutorial-${Date.now()}`,
          projectName: 'Creator education series',
          editName: 'Voice-first camera tutorial',
          sourceMode: 'voice_first',
          contentType: 'tutorial',
          sourceSummary: 'A presenter explains a camera workflow with screen recordings and spoken steps.',
          currentUserInstruction: 'Keep every spoken step clear, preserve source order, require captions, and avoid decorative sound effects.',
          selectedEditLevel: 'normal',
          aspectRatio: '16:9',
          outputFrameConfirmed: true,
          platformTarget: 'youtube_standard',
          storyRole: 'Teach the workflow in the order it is demonstrated',
          budgetPreference: 'efficient',
          directives: { captions: 'required', music: 'adapt', sfx: 'avoid', sourceOrder: 'preserve' },
          approvedConstraints: ['Speech clarity outranks beat alignment.', 'Do not remove required tutorial steps.'],
        },
      }),
    })
    expect(applicationResponse.ok).toBe(true)

    await page.getByTestId('edit-preference-tab-applied-edits').click()
    const applicationCard = page.getByTestId('preference-application-card').filter({ hasText: 'Voice-first camera tutorial' })
    await expect(applicationCard).toContainText('Prepared')
    await expect(applicationCard).toContainText('voice first')
    await expect(applicationCard).toContainText('16:9')
    await expect(applicationCard).toContainText('target edit, its approved plan, and production state have not changed')
    await applicationCard.getByText('Review target-specific guidance').click()
    await expect(applicationCard).toContainText(/speech meaning|spoken step/i)
    await expect(applicationCard).toContainText('Protected boundaries')
    await expect(page.getByTestId('applied-edits-panel')).not.toContainText(/content digest|target context digest|provider|worker|render job|credit action|Gate 5/i)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the study workspace usable at the compact desktop breakpoint', async ({ page }) => {
    await setViewport(page, 780, 900)
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preference-tab-edit-references')).toBeVisible()
    await expect(page.getByTestId('new-edit-reference')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps navigation, focus, and controls accessible on a 375px viewport', async ({ page }) => {
    await setViewport(page, 375, 812)
    await gotoRoute(page, '/preferences')
    await expectNoHorizontalOverflow(page)

    const skipLink = page.getByTestId('skip-to-main-content')
    await skipLink.focus()
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#app-main-content')).toBeFocused()

    const firstTab = page.getByTestId('edit-preference-tab-edit-references')
    await firstTab.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('edit-preference-tab-workspace-defaults')).toBeFocused()
    await expect(page.getByTestId('edit-preference-tab-workspace-defaults')).toHaveAttribute('aria-selected', 'true')

    await page.getByTestId('edit-preference-tab-edit-references').click()
    const targetHeights = await Promise.all([
      page.getByTestId('edit-preference-tab-edit-references').evaluate((element) => element.getBoundingClientRect().height),
      page.getByTestId('new-edit-reference').evaluate((element) => element.getBoundingClientRect().height),
      page.getByRole('button', { name: 'Reload Edit References' }).evaluate((element) => element.getBoundingClientRect().height),
    ])
    expect(targetHeights.every((height) => height >= 44)).toBe(true)
  })
})
