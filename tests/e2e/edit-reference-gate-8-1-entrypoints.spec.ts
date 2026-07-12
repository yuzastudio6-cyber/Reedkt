import { expect, test } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import type { EditReferenceDetailData } from '../../src/types/edit-reference'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const projectId = 'mock-project-edit-chat-foundation'
const projectHomePath = `/projects/${projectId}`
const fixtureRoot = mkdtempSync(join(tmpdir(), 'reeditpro-gate-8-1-e2e-'))
const fixturePath = join(fixtureRoot, 'controlled-reference.mp4')

test.beforeAll(() => {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24',
    '-f', 'lavfi', '-i', 'sine=frequency=550:sample_rate=44100',
    '-t', '1.5', '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'aac', '-shortest', '-y', fixturePath,
  ], { encoding: 'utf8' })
  expect(generated.status, generated.stderr).toBe(0)
})

test.afterAll(() => {
  rmSync(fixtureRoot, { force: true, recursive: true })
})

test.describe('Edit Reference Gate 8.1 application entry points', () => {
  test('studies private media, applies from New Edit, then compares, replaces, and removes through Edit Chat', async ({ page }) => {
    test.setTimeout(210_000)
    page.setDefaultTimeout(12_000)
    await setViewport(page, 1440, 1000)
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')

    const stamp = Date.now()
    const firstName = `Gate 8.1 Local Travel ${stamp}`
    const secondName = `Gate 8.1 Clean Teaching ${stamp}`
    const editName = `Gate 8.1 selector target ${stamp}`
    const firstHandle = `@Gate81LocalTravel${stamp}`
    const secondHandle = `@Gate81CleanTeaching${stamp}`

    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(firstName)
    await page.getByTestId('edit-reference-description').fill('A controlled local-media study for transferable travel storytelling without source-specific footage, identity, captions, sequence, or sound.')
    await page.getByRole('checkbox', { name: 'everything', exact: true }).check()
    await page.getByTestId('save-edit-reference').click()
    await expect(page.getByRole('heading', { name: `${firstName} study` })).toBeVisible()

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByRole('button', { name: 'Video details', exact: true }).click()
    await page.getByTestId('edit-reference-evidence-title').fill('Controlled private reference video')
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await expect(page.getByTestId('edit-reference-video-label')).toHaveValue('controlled-reference.mp4')
    await page.getByLabel('Duration (seconds)').fill('1.5')
    await page.getByLabel('Width').fill('640')
    await page.getByLabel('Height').fill('360')
    await page.getByLabel('Audio').selectOption('yes')
    await page.getByTestId('save-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('video not studied')

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByTestId('edit-reference-evidence-title').fill('Complete target-safe direction')
    await page.getByTestId('edit-reference-evidence-category').selectOption('all_goals')
    await page.getByTestId('edit-reference-evidence-summary').fill(
      'Use a question-led travel story, restrained pacing, warm target-derived color, readable target-authored captions, original target B-roll, speech-safe sound, and original evidence graphics. Never copy exact footage, story sequence, captions, timing, layouts, marks, identity, music, or sound effects.',
    )
    await page.getByTestId('save-edit-reference-evidence').click()
    await page.getByTestId('run-edit-reference-evidence-study').click()

    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText(/locally studied · [1-4] ephemeral frames?/)
    const provenance = page.getByTestId('edit-reference-skill-provenance')
    await expect(provenance).toContainText('Media structure')
    await expect(provenance).toContainText('Representative-frame plan')
    await expect(provenance).toContainText('Verified local')
    await expect(provenance).toContainText(/Degraded · fallback labelled/)
    await expect(provenance).toContainText('Deterministic check')
    await expect(provenance).toContainText(/semantic frame understanding requires/i)
    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Verified local evidence')

    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toContainText('Quality review')
    await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
    await page.getByTestId('approve-edit-reference-dna').click()
    await expect(page.getByText('Ready for a target edit')).toBeVisible()

    await createApprovedReference(workspaceId, `gate-8-1-e2e-second-${stamp}`, secondName)

    await gotoRoute(page, projectHomePath)
    await page.getByTestId('project-home-header').getByRole('button', { name: '+ New Edit' }).click()
    const selector = page.getByTestId('new-edit-reference-selector')
    await expect(selector).toBeVisible()
    await expect(selector.getByRole('radio', { name: new RegExp(escapeRegex(firstName)) })).toBeVisible()
    await selector.getByRole('button', { name: `Inspect ${firstName}` }).click()
    await expect(page.getByTestId('new-edit-reference-inspection')).toContainText(firstName)
    await expect(page.getByTestId('new-edit-reference-inspection')).toContainText('DNA version 1')
    await expect(page.getByTestId('new-edit-reference-inspection')).toContainText(/passed|requires user review/i)
    for (const layer of ['Visual', 'Story', 'Pacing', 'Captions', 'Color', 'B-roll', 'Audio', 'Graphics', 'Safety']) {
      await expect(page.getByTestId('new-edit-reference-inspection')).toContainText(layer)
    }
    await selector.getByRole('radio', { name: new RegExp(escapeRegex(firstName)) }).check()
    await expect(page.getByTestId('new-edit-reference-selected-summary')).toContainText(firstName)
    await expect(page.getByTestId('new-edit-reference-selected-summary')).toContainText('DNA v1')

    await page.getByTestId('new-edit-name-input').fill(editName)
    await page.getByTestId('new-edit-aspect-16:9').click()
    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await page.getByTestId('new-edit-level-premium').click()
    await page.getByTestId('new-edit-reference-instruction').fill('Keep the target product proof and target-authored labels exact; adapt only transferable story judgment.')
    await page.getByTestId('new-edit-source-label-0').fill('Target product walkthrough')
    await page.getByTestId('new-edit-source-notes-0').fill('Preserve the target demonstration order and original product evidence.')
    await page.getByRole('button', { name: 'Create edit' }).click()
    await expect(page.getByTestId('new-edit-success-message')).toContainText(firstName)
    await page.getByTestId('new-edit-success-message').getByRole('link', { name: 'Open Edit Chat' }).click()

    const connection = page.getByTestId('edit-session-edit-reference-connection')
    await expect(connection).toContainText(firstName)
    await expect(connection).toContainText('Selected during New Edit setup')
    await expect(connection).toContainText('approved DNA v1')
    await expect(connection).toContainText('application version 1')

    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(firstName)
    await page.getByTestId('project-edit-brief-open-button').click()
    await expect(page.getByTestId('project-edit-brief-add-marker-button')).toBeEnabled()
    const markerTitle = `Gate 8.1 target proof ${stamp}`
    await page.getByRole('button', { name: /Add Marker/i }).click()
    await page.getByTestId('project-edit-brief-marker-type-picker').selectOption('broll')
    await page.getByTestId('project-edit-brief-marker-priority-picker').selectOption('must_follow')
    await page.getByTestId('project-edit-brief-marker-title-input').fill(markerTitle)
    await page.getByTestId('project-edit-brief-marker-note-input').fill('Preserve the target-owned product proof and keep reusable reference guidance lower priority.')
    await page.getByRole('button', { name: /Save marker/i }).click()
    await expect(page.getByRole('button', { name: new RegExp(escapeRegex(markerTitle)) })).toBeVisible()
    const marker = page.locator('[data-testid^="project-edit-brief-marker-pill-"]').first()
    await marker.click()
    await expect(page.getByTestId('project-edit-brief-marker-context-application')).toContainText('target-adapted hint')
    await page.getByRole('button', { name: /Prepare plan hints/i }).click()
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toContainText(/active hint|held-back hint/i)
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toContainText(/passed|warning/i)
    await page.reload()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(firstName)

    await page.getByTestId('edit-session-route-tab-chat').click()
    await sendChat(page, `Use ${firstHandle} for this edit.`)
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('handled without changing')
    await expect(page.getByTestId('edit-session-message-list')).toContainText('No duplicate application was created')

    await sendChat(page, `Compare ${firstHandle} and ${secondHandle}.`)
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('handled without changing')
    await expect(page.getByTestId('edit-session-message-list')).toContainText('Comparing them did not change this edit')
    await expect(connection).toContainText(firstName)

    await sendChat(page, `Replace the current reference with ${secondHandle}.`)
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('needs your explicit confirmation')
    await expect(page.getByTestId('edit-session-message-list')).toContainText('invalidate the current downstream context')
    await sendChat(page, `Confirm replace with ${secondHandle} but make captions stronger.`)
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('Canonical Edit Reference application updated')
    await expect(connection).toContainText(secondName)
    await expect(connection).toContainText('Applied from Edit Chat')
    await expect(connection).toContainText('application version 2')

    await page.reload()
    await expect(connection).toContainText(secondName)
    await expect(connection).toContainText('Applied from Edit Chat')
    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toContainText(secondName)
    await page.getByTestId('edit-session-route-tab-chat').click()

    await sendChat(page, 'Remove the current edit reference.')
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('needs your explicit confirmation')
    await sendChat(page, 'Confirm remove current edit reference.')
    await expect(page.getByTestId('edit-session-chat-status')).toContainText('Canonical Edit Reference application updated')
    await expect(connection).toContainText('Adapt a reference to this edit')
    await page.reload()
    await expect(connection).toContainText('Adapt a reference to this edit')
    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page.getByTestId('project-edit-brief-preference-application')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-plan-hints')).toHaveCount(0)
    await expect(page.getByTestId('project-edit-brief-preference-qa')).toHaveCount(0)

    await gotoRoute(page, '/preferences?tab=applied-edits')
    const history = page.getByTestId('applied-edits-panel')
    await expect(history).toContainText(firstName)
    await expect(history).toContainText(secondName)
    await expect(history).toContainText('New Edit setup')
    await expect(history).toContainText('Edit Chat')
    await expect(history).toContainText('Replaced')
    await expect(history).toContainText('Removed')

    await setViewport(page, 375, 812)
    await expect(history).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the approved-reference selector bounded, keyboard usable, and 44px reachable', async ({ page }) => {
    page.setDefaultTimeout(12_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoRoute(page, '/preferences')
    const workspaceId = await page.getByTestId('edit-preferences-page').getAttribute('data-workspace-id')
    expect(workspaceId).toBeTruthy()
    if (!workspaceId) throw new Error('Edit Reference workspace identity is missing.')
    const stamp = Date.now()
    const name = `Gate 8.1 Responsive Reference ${stamp}`
    await createApprovedReference(workspaceId, `gate-8-1-responsive-${stamp}`, name)
    await gotoRoute(page, projectHomePath)
    await page.getByTestId('project-home-header').getByRole('button', { name: '+ New Edit' }).click()
    const selector = page.getByTestId('new-edit-reference-selector')
    const radio = selector.getByRole('radio', { name: new RegExp(escapeRegex(name)) })
    const inspect = selector.getByRole('button', { name: `Inspect ${name}` })
    await radio.focus()
    await expect(radio).toBeFocused()
    await radio.press('Space')
    await expect(radio).toBeChecked()
    await inspect.focus()
    await expect(inspect).toBeFocused()
    await inspect.press('Enter')
    await expect(page.getByTestId('new-edit-reference-inspection')).toContainText(name)

    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 1024, height: 900 },
      { width: 768, height: 900 },
      { width: 375, height: 812 },
    ]) {
      await setViewport(page, viewport.width, viewport.height)
      await expect(selector).toBeVisible()
      await expectNoHorizontalOverflow(page)
      const choiceBox = await radio.locator('xpath=ancestor::label').boundingBox()
      const inspectBox = await inspect.boundingBox()
      expect(choiceBox?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(inspectBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
  })
})

async function sendChat(page: import('@playwright/test').Page, message: string): Promise<void> {
  const input = page.getByTestId('edit-session-chat-input')
  await input.fill(message)
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(input).toHaveValue('', { timeout: 20_000 })
  await expect(page.getByTestId('edit-session-message-list')).toContainText(message)
}

async function createReference(workspaceId: string, keyPrefix: string, name: string): Promise<EditReferenceDetailData> {
  return post<EditReferenceDetailData>('/v1/edit-references', `${keyPrefix}-create`, {
    workspaceId,
    name,
    description: 'Gate 8.1 approved comparison fixture.',
    initialGoals: ['visual_language', 'story_and_pacing', 'captions'],
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
