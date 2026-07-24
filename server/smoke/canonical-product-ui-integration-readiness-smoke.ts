import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CANONICAL_PRODUCT_UI_INTEGRATION_CONTRACT_VERSION,
  CANONICAL_PRODUCT_UI_SOURCE_PATHS,
  evaluateCanonicalProductUiIntegrationReadiness,
  readCanonicalProductUiSourceSnapshot,
  type CanonicalProductUiSourceSnapshot,
} from '../config/canonical-product-ui-integration-readiness'

const root = process.cwd()
const readySource = canonicalReadyFixture()
const ready = evaluateCanonicalProductUiIntegrationReadiness(readySource)

assert.equal(ready.ok, true)
assert.equal(ready.schemaVersion, 1)
assert.equal(ready.contractVersion, CANONICAL_PRODUCT_UI_INTEGRATION_CONTRACT_VERSION)
assert.equal(ready.decision, 'ready_for_protected_internal_testing_build')
assert.equal(ready.evidenceClass, 'source_verified_static_ui_integration_only')
assert.deepEqual(ready.blockers, [])
assert.equal(ready.checks.length, 11)
assert.equal(ready.sourceFiles.length, CANONICAL_PRODUCT_UI_SOURCE_PATHS.length)
assert.match(ready.sourceDigestSha256, /^[0-9a-f]{64}$/)
assert.equal(ready.boundaries.sourceReadOnly, true)
assert.equal(ready.boundaries.providerCalled, false)
assert.equal(ready.boundaries.secretRead, false)
assert.equal(ready.boundaries.cloudMutated, false)
assert.equal(ready.boundaries.supabaseMutated, false)
assert.equal(ready.boundaries.billingMutated, false)
assert.equal(ready.boundaries.deploymentPerformed, false)
assert.equal(ready.boundaries.productionReady, false)

const genericSettings = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/pages/PreferencesPage.tsx': `
    import { createEditPreferenceRepository } from '../lib/edit-preference-repository'
    import type { LocalEditPreferenceDefaults } from '../lib/edit-preferences'
    export function PreferencesPage() { return <form>Generic settings</form> }
  `,
})
assert.equal(genericSettings.ok, false)
assert.ok(genericSettings.blockers.includes('preferences_library_entrypoint'))

const missingUpload = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/lib/edit-reference-media-upload-client.ts': undefined,
})
assert.equal(missingUpload.ok, false)
assert.ok(missingUpload.blockers.includes('preferences_resumable_private_upload'))
assert.equal(
  missingUpload.sourceFiles.find((file) => file.path === 'src/lib/edit-reference-media-upload-client.ts')?.present,
  false,
)

const duplicateRoute = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/App.tsx': `${readySource['src/App.tsx']}\n<Route path="/preferences" element={<PreferencesPage />} />`,
})
assert.equal(duplicateRoute.ok, false)
assert.ok(duplicateRoute.blockers.includes('canonical_route_authority'))

const brokenDeepLink = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/components/editor/ChatNativeEditor.tsx': readySource['src/components/editor/ChatNativeEditor.tsx']
    ?.replace("searchParams.get('view') === 'preferences'", "searchParams.get('view') === 'settings'"),
})
assert.equal(brokenDeepLink.ok, false)
assert.ok(brokenDeepLink.blockers.includes('exact_edit_preferences_deep_link'))

const silentApplication = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx': readySource[
    'src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx'
  ]?.replace(
    'Study completion never applies or connects guidance automatically.',
    'Study complete.',
  ),
})
assert.equal(silentApplication.ok, false)
assert.ok(silentApplication.blockers.includes('exact_target_study_and_application_status'))

const duplicateEditor = evaluateCanonicalProductUiIntegrationReadiness({
  ...readySource,
  'src/App.tsx': `${readySource['src/App.tsx']}\n<Route path="/chat" element={<ProjectEditSessionChatPage />} />`,
})
assert.equal(duplicateEditor.ok, false)
assert.ok(duplicateEditor.blockers.includes('single_editor_and_preference_authority'))

const tamperedSource = {
  ...readySource,
  'src/components/preferences/EditReferenceWorkspacePage.tsx': `${readySource[
    'src/components/preferences/EditReferenceWorkspacePage.tsx'
  ]}\n// tampered`,
}
const tampered = evaluateCanonicalProductUiIntegrationReadiness(tamperedSource)
assert.equal(tampered.ok, true)
assert.notEqual(tampered.sourceDigestSha256, ready.sourceDigestSha256)

const current = evaluateCanonicalProductUiIntegrationReadiness(
  readCanonicalProductUiSourceSnapshot(root),
)
assert.match(current.sourceDigestSha256, /^[0-9a-f]{64}$/)
assert.equal(current.sourceFiles.every((file) => !file.sha256 || /^[0-9a-f]{64}$/.test(file.sha256)), true)

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}
assert.equal(
  packageJson.scripts?.['internal-testing:verify-canonical-product-ui-integration-readiness'],
  'tsx server/cli/verify-canonical-product-ui-integration-readiness.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:canonical-product-ui-integration-readiness'],
  'tsx server/smoke/canonical-product-ui-integration-readiness-smoke.ts',
)

const cliPath = 'server/cli/verify-canonical-product-ui-integration-readiness.ts'
const tsxExecutable = join(root, 'node_modules', '.bin', 'tsx')
const auditEnvironment = { ...process.env }
delete auditEnvironment.REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY
const audit = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: auditEnvironment,
  encoding: 'utf8',
})
assert.equal(audit.status, 0, audit.stderr || 'Non-strict UI integration audit should exit zero.')
const auditReport = JSON.parse(audit.stdout) as { ok?: boolean; decision?: string }
assert.equal(auditReport.ok, current.ok)
assert.equal(auditReport.decision, current.decision)

const strict = spawnSync(tsxExecutable, [cliPath], {
  cwd: root,
  env: {
    ...auditEnvironment,
    REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY: 'true',
  },
  encoding: 'utf8',
})
assert.equal(strict.status, current.ok ? 0 : 1)
const strictReport = JSON.parse(strict.stdout) as { ok?: boolean; decision?: string }
assert.equal(strictReport.ok, current.ok)
assert.equal(strictReport.decision, current.decision)

const gatewayWorkflow = readFileSync(
  join(root, '.github/workflows/beta-readiness-api-staging-deploy.yml'),
  'utf8',
)
const pagesWorkflow = readFileSync(
  join(root, '.github/workflows/app-internal-testing-pages-deploy.yml'),
  'utf8',
)
assertStrictWorkflowGate(
  gatewayWorkflow,
  '- name: Require canonical product UI integration before cloud activation',
  '- name: Authenticate to Google Cloud with keyless OIDC',
)
assertStrictWorkflowGate(
  pagesWorkflow,
  '- name: Require canonical product UI integration before signed-in app build',
  '- name: Build signed-in static app against verified gateway',
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'canonical-product-ui-integration-readiness',
  readyFixtureDecision: ready.decision,
  currentDecision: current.decision,
  currentBlockers: current.blockers,
  currentSourceDigestSha256: current.sourceDigestSha256,
  adversarialCases: [
    'retired_generic_settings_page_rejected',
    'missing_resumable_private_upload_rejected',
    'duplicate_preferences_route_rejected',
    'broken_exact_edit_deep_link_rejected',
    'silent_preference_application_rejected',
    'duplicate_editor_route_rejected',
    'source_tamper_changes_digest',
    'audit_mode_reports_without_promoting',
    'strict_mode_matches_source_readiness',
    'gateway_and_pages_mutation_build_lanes_fail_closed',
  ],
}, null, 2))

function assertStrictWorkflowGate(workflow: string, gateName: string, protectedStepName: string): void {
  const gateIndex = workflow.indexOf(gateName)
  const protectedStepIndex = workflow.indexOf(protectedStepName)
  assert.ok(gateIndex >= 0, `Missing workflow gate: ${gateName}`)
  assert.ok(protectedStepIndex > gateIndex, `${gateName} must run before ${protectedStepName}`)
  const gate = workflow.slice(gateIndex, protectedStepIndex)
  assert.match(gate, /REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY: "true"/)
  assert.match(gate, /npm run smoke:canonical-product-ui-integration-readiness/)
  assert.match(gate, /npm run internal-testing:verify-canonical-product-ui-integration-readiness/)
}

function canonicalReadyFixture(): CanonicalProductUiSourceSnapshot {
  return {
    'src/App.tsx': `
      const PreferencesPage = lazy(() => import('./pages/PreferencesPage'))
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/projects/:projectId/edits/:editSessionId" element={<EditorPage />} />
    `,
    'src/pages/PreferencesPage.tsx': `
      import { EditReferenceWorkspacePage } from '../components/preferences/EditReferenceWorkspacePage'
      export function PreferencesPage() { return <EditReferenceWorkspacePage /> }
    `,
    'src/components/preferences/EditReferenceWorkspacePage.tsx': `
      import { useSearchParams } from 'react-router'
      import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
      import { uploadEditReferenceMedia } from '../../lib/edit-reference-media-upload-client'
      export function EditReferenceWorkspacePage() {
        return <section data-edit-reference-workspace="true"><div role="tablist">Library</div><div role="tabpanel">New preference</div></section>
      }
    `,
    'src/lib/edit-reference-api-client.ts': `
      export interface EditReferenceApiClient {
        startLongFormStudy: unknown
        controlLongFormStudy: unknown
        synthesizePreferenceDNA: unknown
        runPreferenceDNAQA: unknown
        approvePreferenceDNA: unknown
        startTargetVideoUnderstanding: unknown
        createPreferenceApplication: unknown
        connectPreferenceApplication: unknown
        clearPreferenceApplication: unknown
      }
      export function createEditReferenceApiClient() { return { headers: { 'idempotency-key': 'fixture' } } }
    `,
    'src/lib/edit-reference-media-upload-client.ts': `
      import { uploadFileToTemporaryTarget } from './resumable-file-upload'
      type Protocol = 'resumable_content_range_v1' | 'managed_segmented_content_range_v1'
      const createPath = '/upload-intents'
      const finalizePath = '/finalize'
      const header = 'idempotency-key'
      const checksumSha256 = 'fixture'
      const storageObjectRecord = { checksumSha256 }
    `,
    'src/pages/EditorPage.tsx': `
      import { ChatNativeEditor } from '../components/editor/ChatNativeEditor'
      export function EditorPage() { return <NamedEditWorkspaceBoundary /> }
      function NamedEditWorkspaceBoundary() { return <ChatNativeEditor /> }
    `,
    'src/components/editor/ChatNativeEditor.tsx': `
      import { useSearchParams } from 'react-router'
      const activeWorkspaceView = searchParams.get('view') === 'preferences' ? 'preferences' : 'chat'
      nextSearchParams.set('view', 'preferences')
      const view = activeWorkspaceView === 'preferences'
        ? <CurrentEditPreferencesWorkspace />
        : <section>Chat</section>
    `,
    'src/components/editor/MinimalProjectHeader.tsx': `
      type Props = { activeWorkspaceView?: 'chat' | 'preferences' }
      <button aria-current={activeWorkspaceView === 'preferences' ? 'page' : undefined} data-testid="current-edit-preferences-trigger" />
    `,
    'src/components/editor/CurrentEditPreferencesWorkspace.tsx': `
      import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
      import { CurrentEditReferenceStudySupplement } from './edit-reference/CurrentEditReferenceStudySupplement'
      <section data-testid="current-edit-preferences-form">
        Study this video before applying the selected preference.
        <CurrentEditReferenceStudySupplement />
      </section>
    `,
    'src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx': `
      import { ProjectEditReferenceTargetStudy } from './ProjectEditReferenceTargetStudy'
      import { CurrentEditReferenceApplicationStatus } from './CurrentEditReferenceApplicationStatus'
      import { EditReferenceApprovedGuidanceSummary } from './EditReferenceApprovedGuidanceSummary'
      export interface CurrentEditReferenceTargetAuthority {}
      Study completion never applies or connects guidance automatically.
    `,
  }
}
