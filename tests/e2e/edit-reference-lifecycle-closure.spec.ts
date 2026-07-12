import { expect, test } from '@playwright/test'
import type { EditReferenceDetailData } from '../../src/types/edit-reference'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-approved-preview'
const editPath = `/projects/${projectId}/edits/${editSessionId}`

test.describe('Edit Reference lifecycle closure', () => {
  test('replaces and removes target guidance while preserving version history and invalidating downstream context', async ({ page }) => {
    test.setTimeout(90_000)
    await setViewport(page, 1440, 1000)
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')

    const stamp = Date.now()
    const firstName = `Measured story system ${stamp}`
    const secondName = `Restrained editorial system ${stamp}`
    const first = await createApprovedReference(workspaceId, `gate7-e2e-first-${stamp}`, firstName)
    await createApprovedReference(workspaceId, `gate7-e2e-second-${stamp}`, secondName)
    const firstDNA = first.detail.dnaVersions.find((candidate) => candidate.status === 'approved')
    expect(firstDNA).toBeTruthy()
    if (!firstDNA) throw new Error('First approved Preference DNA is missing.')

    await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${first.detail.study.id}/preference-dna/${firstDNA.id}/applications`, `gate7-e2e-first-prepare-${stamp}`, {
      workspaceId,
      expectedReferenceRevision: first.detail.reference.revision,
      expectedDNAContentDigest: firstDNA.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext: {
        projectId,
        editSessionId,
        projectName: 'Mock Project Edit Chat Foundation',
        editName: 'Approved Podcast Clip',
        sourceMode: 'voice_first',
        contentType: 'talking_head',
        sourceSummary: 'An approved podcast clip with spoken analysis and a ready preview.',
        currentUserInstruction: 'Protect the approved story and use reusable style only where it supports the target clip and confirmed Brief markers.',
        selectedEditLevel: 'premium',
        aspectRatio: '16:9',
        outputFrameConfirmed: true,
        platformTarget: 'podcast_clip',
        storyRole: 'Preserve the target speaker’s meaning and build a measured supporting visual rhythm',
        budgetPreference: 'balanced',
        directives: { captions: 'adapt', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
        approvedConstraints: [
          'Current instructions and confirmed Edit Brief markers outrank reusable Preference DNA.',
          'Do not copy exact reference shots, timing, layouts, sound, people, logos, or identity.',
        ],
      },
    })

    await gotoRoute(page, editPath)
    const connection = page.getByTestId('edit-session-edit-reference-connection')
    await expect(connection).toContainText(firstName)
    await connection.getByRole('checkbox').check()
    await connection.getByRole('button', { name: 'Finish connection' }).click()
    await expect(connection).toContainText(firstName)
    await expect(connection.getByText('Connected', { exact: true })).toBeVisible()

    await connection.getByRole('button', { name: 'Replace guidance' }).click()
    const replacementPanel = page.getByTestId('edit-session-edit-reference-replace-panel')
    await expect(replacementPanel).toBeVisible()
    const replacementRadios = replacementPanel.getByRole('radio')
    const replacementCount = await replacementRadios.count()
    expect(replacementCount).toBeGreaterThan(0)
    const initiallySelectedRadio = replacementPanel.locator('[role="radio"][aria-checked="true"]')
    await expect(initiallySelectedRadio).toHaveCount(1)
    await expect(initiallySelectedRadio).toBeFocused()
    const initiallySelectedTestId = await initiallySelectedRadio.getAttribute('data-testid')
    await initiallySelectedRadio.press('ArrowDown')
    const keyboardSelectedRadio = replacementPanel.locator('[role="radio"][aria-checked="true"]')
    await expect(keyboardSelectedRadio).toHaveCount(1)
    await expect(keyboardSelectedRadio).toBeFocused()
    if (replacementCount > 1) await expect(keyboardSelectedRadio).not.toHaveAttribute('data-testid', initiallySelectedTestId ?? '')
    await expectNoHorizontalOverflow(page)
    await setViewport(page, 375, 812)
    await expect(replacementPanel).toBeVisible()
    await expectNoHorizontalOverflow(page)
    expect(await replacementPanel.getByRole('button', { name: 'Cancel' }).evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
    await setViewport(page, 1440, 1000)
    await replacementPanel.getByRole('radio', { name: new RegExp(secondName) }).click()
    await replacementPanel.getByRole('checkbox').check()
    await replacementPanel.getByRole('button', { name: 'Replace guidance' }).click()
    await expect(connection).toContainText(secondName)
    await expect(connection.getByText('Connected', { exact: true })).toBeVisible()
    await expect(connection).not.toContainText(firstName)
    await expectNoHorizontalOverflow(page)

    await page.reload()
    await expect(connection).toContainText(secondName)
    await expect(connection.getByText('Connected', { exact: true })).toBeVisible()

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(secondName)
    await page.getByRole('button', { name: /Prepare plan hints/i }).click()
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toBeVisible()

    await page.getByTestId('edit-session-route-tab-chat').click()
    await connection.getByRole('button', { name: 'Remove', exact: true }).click()
    const confirmation = page.getByTestId('edit-session-edit-reference-remove-confirmation')
    await expect(confirmation).toContainText('Remove this guidance from the edit?')
    await expect(confirmation).toHaveAttribute('role', 'alertdialog')
    await expect(confirmation.getByRole('button', { name: 'Keep guidance' })).toBeFocused()
    await confirmation.getByRole('button', { name: 'Remove guidance' }).click()
    await expect(connection).toContainText('Adapt a reference to this edit')
    await expect(page.getByTestId('edit-session-preference-status')).toContainText('No target-adapted Edit Reference is connected')

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-plan-application-log')).toContainText('Previous Edit Reference plan hints are inactive')
    await expectNoHorizontalOverflow(page)

    await gotoRoute(page, '/preferences?tab=applied-edits')
    const applicationCards = page.getByTestId('preference-application-card')
    const firstCard = applicationCards.filter({ has: page.getByText(new RegExp(`^${firstName} · DNA version`)) })
    const secondCard = applicationCards.filter({ has: page.getByText(new RegExp(`^${secondName} · DNA version`)) })
    await expect(firstCard).toContainText('Replaced')
    await expect(firstCard).toContainText('Replaced by application version 2')
    await expect(secondCard).toContainText('Removed')
    await expect(secondCard).toContainText('This version replaced the prior connected guidance')
    await expect(page.getByTestId('applied-edits-panel')).not.toContainText(/application id|content digest|provider|database|gate 7/i)
    await expectNoHorizontalOverflow(page)

    await setViewport(page, 375, 812)
    await expect(firstCard).toBeVisible()
    await expect(secondCard).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

async function createApprovedReference(workspaceId: string, keyPrefix: string, name: string): Promise<EditReferenceDetailData> {
  const created = await post<EditReferenceDetailData>('/v1/edit-references', `${keyPrefix}-create`, {
    workspaceId,
    name,
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'audio_and_sfx', 'b_roll', 'graphics'],
  })
  const studyId = created.detail.study.id
  const evidence = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence`, `${keyPrefix}-evidence`, {
    workspaceId,
    expectedStudyRevision: created.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: `${name} principles`,
    category: 'all_goals',
    summary: 'Use clear hierarchy, meaning-led pacing, readable captions, restrained audio, original graphics, and purposeful B-roll. Never copy exact shots, layouts, timing, music, sound effects, people, logos, or creator identity.',
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
