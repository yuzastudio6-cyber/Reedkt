import { expect, test } from '@playwright/test'
import type { EditReferenceDetailData } from '../../src/types/edit-reference'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-square-ad'
const editPath = `/projects/${projectId}/edits/${editSessionId}`

test.describe('Edit Reference downstream integration', () => {
  test('connects exact target guidance through Edit Chat, Brief, Marker, Plan Hints, QA, and reload', async ({ page }) => {
    test.setTimeout(75_000)
    await setViewport(page, 1440, 1000)
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')

    const referenceName = `Founder story restraint ${Date.now()}`
    const created = await post<EditReferenceDetailData>('/v1/edit-references', `gate6-e2e-create-${Date.now()}`, {
      workspaceId,
      name: referenceName,
      initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'audio_and_sfx', 'b_roll', 'graphics'],
    })
    const studyId = created.detail.study.id
    const evidence = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence`, `gate6-e2e-evidence-${Date.now()}`, {
      workspaceId,
      expectedStudyRevision: created.detail.study.revision,
      sourceType: 'manual_user_evidence',
      title: 'Founder story creative principles',
      category: 'all_goals',
      summary: 'Use a clear evidence-led story, measured pacing, readable captions, restrained sound, original graphics, and purposeful B-roll. Never copy exact shots, timing, layouts, music, sound effects, people, logos, or creator identity.',
      intendedUse: 'transferable',
    })
    const studied = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/evidence-study`, `gate6-e2e-study-${Date.now()}`, {
      workspaceId,
      expectedStudyRevision: evidence.detail.study.revision,
    })
    const synthesized = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna`, `gate6-e2e-dna-${Date.now()}`, {
      workspaceId,
      expectedStudyRevision: studied.detail.study.revision,
    })
    const dna = synthesized.detail.dnaVersions[0]
    expect(dna).toBeTruthy()
    const quality = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, `gate6-e2e-qa-${Date.now()}`, {
      workspaceId,
      expectedStudyRevision: synthesized.detail.study.revision,
      expectedDNAContentDigest: dna.contentDigest,
    })
    const qa = quality.detail.dnaQaResults[0]
    expect(qa).toBeTruthy()
    const approved = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, `gate6-e2e-approve-${Date.now()}`, {
      workspaceId,
      expectedStudyRevision: quality.detail.study.revision,
      expectedDNAContentDigest: dna.contentDigest,
      qaResultId: qa.id,
      acknowledgeAdaptNotCopy: true,
      acknowledgeQAReview: qa.status === 'requires_user_review',
    })
    const prepared = await post<EditReferenceDetailData>(`/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/applications`, `gate6-e2e-prepare-${Date.now()}`, {
      workspaceId,
      expectedReferenceRevision: approved.detail.reference.revision,
      expectedDNAContentDigest: dna.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext: {
        projectId,
        editSessionId,
        projectName: 'Mock Project Edit Chat Foundation',
        editName: 'Square Product Ad',
        sourceMode: 'mixed',
        contentType: 'product_demo',
        sourceSummary: 'Product source clips with spoken benefits and supporting square-format visuals.',
        currentUserInstruction: 'Keep the product claim clear and preserve the confirmed caption marker. Confirmed Edit Brief markers must outrank reusable style guidance.',
        selectedEditLevel: 'premium',
        aspectRatio: '1:1',
        outputFrameConfirmed: true,
        platformTarget: 'ad_creative',
        storyRole: 'Build a concise product ad from the target source and its own verified claims',
        budgetPreference: 'balanced',
        directives: { captions: 'adapt', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
        approvedConstraints: [
          'Current instructions and confirmed Edit Brief markers outrank reusable Preference DNA.',
          'Do not copy exact reference shots, timing, layouts, sound, identity, or footage.',
        ],
      },
    })
    const preparedApplication = prepared.detail.applications.find(
      (application) => application.editSessionId === editSessionId,
    )
    expect(preparedApplication).toBeTruthy()
    if (!preparedApplication) throw new Error('Prepared Preference Application is missing.')

    await gotoRoute(page, editPath)
    const connection = page.getByTestId('edit-session-edit-reference-connection')
    await expect(connection).toContainText(referenceName)
    await expect(page.getByTestId('edit-session-edit-reference-staged')).toContainText(
      'Target adaptation is prepared',
    )
    await connection.getByRole('checkbox').check()
    await connection.getByRole('button', { name: 'Finish connection' }).click()
    await expect(connection).toContainText('Connected mock-locally')
    await expect(connection).toContainText('adapted')
    await expect(connection).toContainText('held back')
    await expect(page.getByTestId('edit-session-preference-status')).toContainText('connected mock-locally')
    await expect(page.getByTestId('edit-session-chat-page')).not.toContainText(
      /content digest|target context digest|application id|provider call made/i,
    )
    await expect(page.getByTestId('edit-session-chat-page')).not.toContainText(preparedApplication.id)
    await expect(page.getByTestId('edit-session-chat-page')).not.toContainText(
      preparedApplication.targetContextDigest,
    )
    await expectNoHorizontalOverflow(page)

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(referenceName)
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText('confirmed Edit Brief markers')
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toContainText('Lower priority')
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toContainText(/passed|warning/i)

    const marker = page.locator('[data-testid^="project-edit-brief-marker-pill-"]').first()
    await marker.click()
    await expect(page.getByTestId('project-edit-brief-marker-context-application')).toContainText('target-adapted hint')
    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill('Keep this marker instruction first and use the reusable pacing only where it supports the target story.')
    await page.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-status')).toContainText(/Local fallback|understood this marker|used the marker video context/i)
    await page.getByRole('button', { name: 'Run marker QA' }).click()
    await expect(page.getByTestId('project-edit-brief-marker-preference-qa')).toContainText('Edit Reference context')
    await page.getByRole('button', { name: /Prepare plan hints/i }).click()
    await expect(page.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toContainText(/held-back hint/i)
    await expectNoHorizontalOverflow(page)

    await page.reload()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(referenceName)
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the connected integration responsive at 375px', async ({ page }) => {
    await setViewport(page, 375, 812)
    await gotoRoute(page, editPath)
    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

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
