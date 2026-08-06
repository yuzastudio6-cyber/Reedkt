import { expect, test } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const scope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const storageKey = buildLocalProjectHandoffStorageKey(scope)
const scopeFingerprint = createProjectPersistenceScopeFingerprint(scope)

test.describe('home edit recovery truth', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1280)
  })

  test('does not turn an unconfigured recovery connection into false edit absence', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    const recovery = page.getByTestId('home-recovery-not-configured')
    await expect(recovery).toBeVisible()
    await expect(recovery).toContainText(/No saved edit is available in this browser/i)
    await expect(recovery.getByRole('button', { name: /Retry recovery/i })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Create your first project/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Create project/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Needs your attention/i })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Your latest edits/i })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the last trusted scoped edit available when account recovery is not configured', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    const now = new Date().toISOString()
    const handoff: LocalInternalProjectHandoff = {
      id: 'dashboard-recovery-edit',
      workspaceId: scope.workspaceId,
      projectId: 'dashboard-recovery-project',
      editSessionId: 'dashboard-recovery-edit',
      projectName: 'Recovery project',
      editName: 'Calm launch edit',
      category: 'storytelling',
      editorPath: '/projects/dashboard-recovery-project/edits/dashboard-recovery-edit',
      stage: 'created',
      sourceFileCount: 0,
      createdAt: now,
      updatedAt: now,
      persistence: 'browser_local_internal_testing',
    }

    await page.evaluate(({ envelopeKey, fingerprint, savedHandoff, savedScope }) => {
      window.localStorage.setItem(envelopeKey, JSON.stringify({
        recordVersion: 2,
        scope: savedScope,
        scopeFingerprint: fingerprint,
        handoffs: [savedHandoff],
        savedAt: savedHandoff.updatedAt,
      }))
    }, {
      envelopeKey: storageKey,
      fingerprint: scopeFingerprint,
      savedHandoff: handoff,
      savedScope: scope,
    })
    await page.reload()

    await expect(page.getByRole('link', { name: /Upload source/i })).toHaveAttribute(
      'href',
      /^\/projects\/dashboard-recovery-project\/edits\/dashboard-recovery-edit(?:\?|$)/,
    )
    await expect(page.getByTestId('testing-home-latest-edit')).toContainText('Calm launch edit')
    await expect(page.getByTestId('testing-home-latest-edit')).toContainText('Source needed')
    const recovery = page.getByTestId('home-recovery-not-configured')
    await expect(recovery).toContainText(/Showing this browser’s saved edit/i)
    await expect(recovery).toContainText(/last trusted browser copy remains available/i)
    await expectNoHorizontalOverflow(page)
  })

  test('prioritizes the latest edit, other attention states, and recent work without a card wall', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    const timestamp = Date.now()
    const handoffs: LocalInternalProjectHandoff[] = [
      {
        id: 'home-latest-edit',
        workspaceId: scope.workspaceId,
        projectId: 'home-latest-project',
        editSessionId: 'home-latest-edit',
        projectName: 'Founder launch',
        editName: 'Launch story master',
        category: 'business_brand',
        editorPath: '/projects/home-latest-project/edits/home-latest-edit',
        stage: 'plan_approved',
        sourceFileCount: 3,
        sourceMediaAssets: [createSourceAsset('home-latest')],
        approvedSnapshotId: 'approved-home-latest',
        createdAt: new Date(timestamp - 240_000).toISOString(),
        updatedAt: new Date(timestamp).toISOString(),
        persistence: 'browser_local_internal_testing',
      },
      {
        id: 'home-attention-source',
        workspaceId: scope.workspaceId,
        projectId: 'home-attention-project',
        editSessionId: 'home-attention-source',
        projectName: 'Product walkthrough',
        editName: 'Feature demo cut',
        category: 'education_explainer',
        editorPath: '/projects/home-attention-project/edits/home-attention-source',
        stage: 'source_uploaded',
        sourceFileCount: 2,
        sourceMediaAssets: [createSourceAsset('home-attention-source')],
        createdAt: new Date(timestamp - 360_000).toISOString(),
        updatedAt: new Date(timestamp - 60_000).toISOString(),
        persistence: 'browser_local_internal_testing',
      },
      {
        id: 'home-attention-review',
        workspaceId: scope.workspaceId,
        projectId: 'home-review-project',
        editSessionId: 'home-attention-review',
        projectName: 'Customer proof',
        editName: 'Case study review',
        category: 'documentary_case_study',
        editorPath: '/projects/home-review-project/edits/home-attention-review',
        stage: 'private_review_ready',
        sourceFileCount: 5,
        sourceMediaAssets: [createSourceAsset('home-attention-review')],
        approvedSnapshotId: 'approved-home-attention-review',
        createdAt: new Date(timestamp - 480_000).toISOString(),
        updatedAt: new Date(timestamp - 120_000).toISOString(),
        persistence: 'browser_local_internal_testing',
      },
      {
        id: 'home-recent-complete',
        workspaceId: scope.workspaceId,
        projectId: 'home-complete-project',
        editSessionId: 'home-recent-complete',
        projectName: 'Creator campaign',
        editName: 'Weekend recap',
        category: 'lifestyle',
        editorPath: '/projects/home-complete-project/edits/home-recent-complete',
        stage: 'internal_edit_complete',
        sourceFileCount: 4,
        sourceMediaAssets: [createSourceAsset('home-recent-complete')],
        approvedSnapshotId: 'approved-home-recent-complete',
        createdAt: new Date(timestamp - 600_000).toISOString(),
        updatedAt: new Date(timestamp - 180_000).toISOString(),
        persistence: 'browser_local_internal_testing',
      },
    ]

    await page.evaluate(({ envelopeKey, fingerprint, savedHandoffs, savedScope }) => {
      window.localStorage.setItem(envelopeKey, JSON.stringify({
        recordVersion: 2,
        scope: savedScope,
        scopeFingerprint: fingerprint,
        handoffs: savedHandoffs,
        savedAt: savedHandoffs[0].updatedAt,
      }))
    }, {
      envelopeKey: storageKey,
      fingerprint: scopeFingerprint,
      savedHandoffs: handoffs,
      savedScope: scope,
    })
    await page.reload()

    await expect(page.getByTestId('testing-home-latest-edit')).toContainText('Launch story master')
    await expect(page.getByRole('link', { name: /View progress/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Needs your attention/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Prepare footage: Feature demo cut/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Open review: Case study review/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Your latest edits/i })).toBeVisible()
    await expect(page.getByText('Weekend recap')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

function createSourceAsset(id: string): NonNullable<LocalInternalProjectHandoff['sourceMediaAssets']>[number] {
  return {
    mediaAssetId: `media-${id}`,
    sourceSequenceItemId: `sequence-${id}`,
    uploadedClipId: `clip-${id}`,
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'source-media',
    storagePath: `private/source/${id}.mp4`,
    fileName: `${id}.mp4`,
    mimeType: 'video/mp4',
    byteSize: 4096,
    checksumSha256: 'a'.repeat(64),
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }
}
