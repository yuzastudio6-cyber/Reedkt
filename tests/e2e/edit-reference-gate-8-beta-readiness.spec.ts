import { expect, test } from '@playwright/test'
import type { EditReferenceDetailData } from '../../src/types/edit-reference'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-revision-requested'
const editPath = `/projects/${projectId}/edits/${editSessionId}/chat`

test.describe('Edit Reference Gate 8 beta readiness', () => {
  test('completes the full private study, target adaptation, downstream, replacement, removal, and audit journey', async ({ page }) => {
    test.setTimeout(150_000)
    await setViewport(page, 1440, 1000)
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')

    const stamp = Date.now()
    const firstName = `Gate 8 adaptable story system ${stamp}`
    const secondName = `Gate 8 restrained product system ${stamp}`

    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(firstName)
    await page.getByTestId('edit-reference-description').fill(
      'Learn transferable story, visual, caption, color, B-roll, audio, and graphic judgment while keeping every source-specific asset and identity out of the target edit.',
    )
    await page.getByRole('checkbox', { name: 'everything', exact: true }).check()
    await page.getByTestId('save-edit-reference').click()
    await expect(page.getByRole('heading', { name: `${firstName} study` })).toBeVisible()
    await expect(page.getByRole('button', { name: `${firstName}, selected`, exact: true })).toHaveAttribute('aria-pressed', 'true')

    const direction = 'Prioritize meaning-led pacing, restrained hierarchy, readable target-authored captions, speech-safe audio, purposeful target B-roll, and original target graphics.'
    await page.getByTestId('edit-reference-study-message').fill(direction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByText(direction)).toBeVisible()
    await expect(page.locator('.edit-reference-message-list')).not.toHaveAttribute('aria-live', 'polite')

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByTestId('edit-reference-evidence-title').fill('Gate 8 complete creative evidence')
    await page.getByTestId('edit-reference-evidence-summary').fill(
      'Use a question-led story, measured pacing, warm natural color, readable target-authored captions, purposeful target B-roll, restrained speech-safe music and SFX, and original evidence graphics. Never copy source footage, exact timing, captions, layouts, marks, people, voices, music, sound effects, or creator identity.',
    )
    await page.getByTestId('save-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Gate 8 complete creative evidence')

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByRole('button', { name: 'Video details', exact: true }).click()
    await page.getByTestId('edit-reference-evidence-title').fill('Gate 8 reference video details')
    await page.getByTestId('edit-reference-video-label').fill('Reference-led educational story sample')
    await page.getByLabel('Duration (seconds)').fill('67')
    await page.getByLabel('Width').fill('1920')
    await page.getByLabel('Height').fill('1080')
    await page.getByLabel('Rights basis').selectOption('reference_only')
    await page.getByLabel('Audio').selectOption('yes')
    await page.getByTestId('save-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Gate 8 reference video details')
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('video not studied')
    await page.getByTestId('run-edit-reference-evidence-study').click()

    const findings = page.getByTestId('edit-reference-study-findings')
    await expect(findings).toContainText('Latest study findings')
    for (const label of ['visual language', 'story and pacing', 'captions', 'color', 'b roll', 'audio and sfx', 'graphics']) {
      await expect(findings).toContainText(label)
    }
    await expect(findings).toContainText('Not analyzed')

    const correction = 'Correct the saved evidence: keep the target story question-led, but use cooler target-derived color, sparse target-authored labels, no decorative SFX, and only original target footage and layouts.'
    await page.getByTestId('edit-reference-study-correction-source').selectOption({ label: 'Replace “Gate 8 complete creative evidence” with this message' })
    await page.getByTestId('edit-reference-study-message').fill(correction)
    await expect(page.getByTestId('send-edit-reference-study-message')).toContainText('Save correction')
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByText(correction)).toBeVisible()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Superseded by a correction')
    await expect(findings).toContainText('Previous findings need refresh')
    await page.getByTestId('run-edit-reference-evidence-study').click()
    await expect(findings).toContainText('Latest study findings')
    await expect(findings).toContainText('cooler target-derived color')

    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Do-not-copy Rules')
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toContainText('Quality review')
    await expect(page.getByTestId('approve-edit-reference-dna')).toBeDisabled()
    await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
    await page.getByTestId('approve-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-target-ready')).toContainText('Choose this reference from a project edit')
    await expect(page.getByText('Ready for a target edit')).toBeVisible()

    await createApprovedReference(workspaceId, `gate8-e2e-second-${stamp}`, secondName)

    await gotoRoute(page, editPath)
    const connection = page.getByTestId('edit-session-edit-reference-connection')
    await expect(connection).toContainText('Adapt a reference to this edit')
    const firstOption = connection.getByRole('radio', { name: new RegExp(firstName) })
    await firstOption.click()
    await connection.getByLabel('Current direction for this edit').fill(
      'Preserve the product demonstration order, exact target labels, and confirmed Brief marker. Use reference judgment only where it supports the target proof.',
    )
    await connection.getByRole('checkbox', { name: /confirm this Edit Chat’s saved output frame/i }).check()
    await connection.getByRole('button', { name: 'Adapt to this edit' }).click()
    await expect(connection).toContainText(firstName)
    await expect(connection.getByText('Connected', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(connection).toContainText('adapted')
    await expect(connection).toContainText('held back')
    await expect(connection).toContainText('Current instructions and confirmed Edit Brief markers stay above')
    await expectNoHorizontalOverflow(page)

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(firstName)
    const marker = page.locator('[data-testid^="project-edit-brief-marker-pill-"]').first()
    await marker.click()
    await expect(page.getByTestId('project-edit-brief-marker-context-application')).toContainText('target-adapted hint')
    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill(
      'Keep the target cut decision and product proof above reusable pacing guidance.',
    )
    await page.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-status')).toContainText(/Local fallback|understood this marker|used the marker video context/i)
    await page.getByRole('button', { name: 'Run marker QA' }).click()
    await expect(page.getByTestId('project-edit-brief-marker-preference-qa')).toContainText('Edit Reference context')
    await page.getByRole('button', { name: /Prepare plan hints/i }).click()
    await expect(page.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toContainText(/held-back hint/i)
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toContainText(/passed|warning/i)

    await page.reload()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(firstName)
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toBeVisible()

    await page.getByTestId('edit-session-route-tab-chat').click()
    await connection.getByRole('button', { name: 'Replace guidance' }).click()
    const replacementPanel = page.getByTestId('edit-session-edit-reference-replace-panel')
    await replacementPanel.getByRole('radio', { name: new RegExp(secondName) }).click()
    await replacementPanel.getByLabel('Current direction for this edit').fill(
      'Keep the target demonstration and proof exact; adapt only restrained hierarchy and readable labels.',
    )
    await replacementPanel.getByRole('checkbox', { name: /confirm this Edit Chat’s saved output frame/i }).check()
    await replacementPanel.getByRole('button', { name: 'Replace guidance' }).click()
    await expect(connection).toContainText(secondName)
    await expect(connection).not.toContainText(firstName)
    await expect(connection.getByText('Connected', { exact: true })).toBeVisible()

    await page.reload()
    await expect(connection).toContainText(secondName)
    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(secondName)
    await page.getByRole('button', { name: /Prepare plan hints/i }).click()
    await expect(page.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await page.getByTestId('edit-session-route-tab-chat').click()
    await connection.getByRole('button', { name: 'Remove', exact: true }).click()
    const confirmation = page.getByTestId('edit-session-edit-reference-remove-confirmation')
    await expect(confirmation).toHaveAttribute('role', 'alertdialog')
    await expect(confirmation.getByRole('button', { name: 'Keep guidance' })).toBeFocused()
    await confirmation.getByRole('button', { name: 'Remove guidance' }).click()
    await expect(connection).toContainText('Adapt a reference to this edit')

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-plan-application-log')).toContainText('Previous Edit Reference plan hints are inactive')

    await gotoRoute(page, '/preferences?tab=applied-edits')
    const applicationCards = page.getByTestId('preference-application-card')
    const firstCard = applicationCards.filter({ has: page.getByText(new RegExp(`^${escapeRegex(firstName)} · DNA version`)) })
    const secondCard = applicationCards.filter({ has: page.getByText(new RegExp(`^${escapeRegex(secondName)} · DNA version`)) })
    await expect(firstCard).toContainText('Replaced')
    await expect(secondCard).toContainText('Removed')
    await expect(page.getByTestId('applied-edits-panel')).not.toContainText(/content digest|provider call|worker job|credit action/i)

    await setViewport(page, 375, 812)
    await expect(firstCard).toBeVisible()
    await expect(secondCard).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('ignores a delayed stale reference response after a newer selection wins', async ({ page }) => {
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')

    const stamp = Date.now()
    const delayedName = `Delayed reference ${stamp}`
    const winningName = `Winning reference ${stamp}`
    const delayed = await createReference(workspaceId, `gate8-stale-delayed-${stamp}`, delayedName)
    const winning = await createReference(workspaceId, `gate8-stale-winning-${stamp}`, winningName)
    await page.getByRole('button', { name: 'Reload Edit References' }).click()
    await expect(page.getByTestId(`edit-reference-card-${delayed.detail.reference.id}`)).toBeVisible()
    await expect(page.getByTestId(`edit-reference-card-${winning.detail.reference.id}`)).toBeVisible()

    let delayedOnce = false
    await page.route((url) => url.pathname === `/v1/edit-references/${delayed.detail.reference.id}`, async (route) => {
      if (!delayedOnce) {
        delayedOnce = true
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      await route.continue()
    })

    await page.getByTestId(`edit-reference-card-${delayed.detail.reference.id}`).click()
    await page.waitForTimeout(25)
    await page.getByTestId(`edit-reference-card-${winning.detail.reference.id}`).click()
    await expect(page.getByRole('heading', { name: `${winningName} study` })).toBeVisible()
    await page.waitForTimeout(650)
    await expect(page.getByRole('heading', { name: `${winningName} study` })).toBeVisible()
    await expect(page.getByRole('heading', { name: `${delayedName} study` })).toHaveCount(0)
    await expect(page.getByTestId(`edit-reference-card-${winning.detail.reference.id}`)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(`edit-reference-card-${delayed.detail.reference.id}`)).toHaveAttribute('aria-pressed', 'false')
  })
})

async function createReference(workspaceId: string, keyPrefix: string, name: string): Promise<EditReferenceDetailData> {
  return post<EditReferenceDetailData>('/v1/edit-references', `${keyPrefix}-create`, {
    workspaceId,
    name,
    initialGoals: ['visual_language', 'story_and_pacing'],
  })
}

async function createApprovedReference(workspaceId: string, keyPrefix: string, name: string): Promise<EditReferenceDetailData> {
  const created = await createReference(workspaceId, keyPrefix, name)
  const studyId = created.detail.study.id
  const evidence = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence`, `${keyPrefix}-evidence`, {
    workspaceId,
    expectedStudyRevision: created.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: `${name} principles`,
    category: 'all_goals',
    summary: 'Use restrained hierarchy, target-authored labels, meaning-led pacing, original graphics, and speech-safe audio. Never copy exact footage, timing, layouts, music, sound effects, identity, or marks.',
    intendedUse: 'transferable',
  })
  const studied = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence-study`, `${keyPrefix}-study`, {
    workspaceId,
    expectedStudyRevision: evidence.detail.study.revision,
  })
  const synthesized = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna`, `${keyPrefix}-dna`, {
    workspaceId,
    expectedStudyRevision: studied.detail.study.revision,
  })
  const dna = synthesized.detail.dnaVersions[0]
  expect(dna).toBeTruthy()
  if (!dna) throw new Error('Synthesized Preference DNA is missing.')
  const quality = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, `${keyPrefix}-qa`, {
    workspaceId,
    expectedStudyRevision: synthesized.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
  })
  const qa = quality.detail.dnaQaResults[0]
  expect(qa).toBeTruthy()
  if (!qa) throw new Error('Preference DNA quality result is missing.')
  return post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, `${keyPrefix}-approve`, {
    workspaceId,
    expectedStudyRevision: quality.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qa.status === 'requires_user_review',
  })
}

async function post<T>(path: string, key: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { ok: true; data: T } | { error: { code: string; message: string } }
  expect(response.ok, JSON.stringify(payload)).toBe(true)
  if (!('ok' in payload) || payload.ok !== true) throw new Error(payload.error?.message ?? 'Edit Reference API request failed.')
  return payload.data
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
