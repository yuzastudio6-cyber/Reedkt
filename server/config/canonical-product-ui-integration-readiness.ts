import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const CANONICAL_PRODUCT_UI_INTEGRATION_CONTRACT_VERSION =
  'canonical-product-ui-integration-readiness-v1' as const

export const CANONICAL_PRODUCT_UI_SOURCE_PATHS = [
  'src/App.tsx',
  'src/pages/PreferencesPage.tsx',
  'src/components/preferences/EditReferenceWorkspacePage.tsx',
  'src/lib/edit-reference-api-client.ts',
  'src/lib/edit-reference-media-upload-client.ts',
  'src/pages/EditorPage.tsx',
  'src/components/editor/ChatNativeEditor.tsx',
  'src/components/editor/MinimalProjectHeader.tsx',
  'src/components/editor/CurrentEditPreferencesWorkspace.tsx',
  'src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx',
] as const

export type CanonicalProductUiSourcePath = typeof CANONICAL_PRODUCT_UI_SOURCE_PATHS[number]

export type CanonicalProductUiSourceSnapshot = Record<CanonicalProductUiSourcePath, string | undefined>

export type CanonicalProductUiIntegrationCheckId =
  | 'canonical_route_authority'
  | 'preferences_library_entrypoint'
  | 'preferences_study_workspace'
  | 'preferences_frontend_api_boundary'
  | 'preferences_resumable_private_upload'
  | 'named_edit_chat_shell'
  | 'exact_edit_preferences_deep_link'
  | 'exact_edit_preference_application'
  | 'exact_target_study_and_application_status'
  | 'workspace_navigation_accessibility'
  | 'single_editor_and_preference_authority'

export interface CanonicalProductUiIntegrationCheck {
  id: CanonicalProductUiIntegrationCheckId
  ok: boolean
  paths: CanonicalProductUiSourcePath[]
  message: string
}

export interface CanonicalProductUiIntegrationReadinessReport {
  schemaVersion: 1
  contractVersion: typeof CANONICAL_PRODUCT_UI_INTEGRATION_CONTRACT_VERSION
  ok: boolean
  decision:
    | 'ready_for_protected_internal_testing_build'
    | 'blocked_noncanonical_product_ui_integration'
  evidenceClass: 'source_verified_static_ui_integration_only'
  sourceDigestSha256: string
  sourceFiles: Array<{
    path: CanonicalProductUiSourcePath
    present: boolean
    sizeBytes: number
    sha256?: string
  }>
  checks: CanonicalProductUiIntegrationCheck[]
  blockers: CanonicalProductUiIntegrationCheckId[]
  boundaries: {
    sourceReadOnly: true
    browserExecuted: false
    authenticatedSessionVerified: false
    backendRuntimeVerified: false
    providerCalled: false
    secretRead: false
    cloudMutated: false
    supabaseMutated: false
    billingMutated: false
    deploymentPerformed: false
    productionReady: false
  }
  nextStep:
    | 'integrate_verified_edit_preferences_handoff_then_rerun_strict_gate'
    | 'run_bounded_browser_and_backend_integration_verification'
}

export function readCanonicalProductUiSourceSnapshot(
  rootDirectory = process.cwd(),
): CanonicalProductUiSourceSnapshot {
  return Object.fromEntries(CANONICAL_PRODUCT_UI_SOURCE_PATHS.map((path) => {
    try {
      return [path, readFileSync(resolve(rootDirectory, path), 'utf8')]
    } catch {
      return [path, undefined]
    }
  })) as CanonicalProductUiSourceSnapshot
}

export function evaluateCanonicalProductUiIntegrationReadiness(
  source: CanonicalProductUiSourceSnapshot,
): CanonicalProductUiIntegrationReadinessReport {
  const app = text(source, 'src/App.tsx')
  const preferencesPage = text(source, 'src/pages/PreferencesPage.tsx')
  const preferenceWorkspace = text(source, 'src/components/preferences/EditReferenceWorkspacePage.tsx')
  const preferenceApiClient = text(source, 'src/lib/edit-reference-api-client.ts')
  const preferenceUploadClient = text(source, 'src/lib/edit-reference-media-upload-client.ts')
  const editorPage = text(source, 'src/pages/EditorPage.tsx')
  const chatEditor = text(source, 'src/components/editor/ChatNativeEditor.tsx')
  const projectHeader = text(source, 'src/components/editor/MinimalProjectHeader.tsx')
  const currentPreferences = text(source, 'src/components/editor/CurrentEditPreferencesWorkspace.tsx')
  const targetStudySupplement = text(
    source,
    'src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx',
  )

  const checks: CanonicalProductUiIntegrationCheck[] = [
    check(
      'canonical_route_authority',
      count(app, /<Route\s+path=["']\/preferences["']\s+element=\{<PreferencesPage\s*\/>\}\s*\/>/g) === 1
        && count(app, /<Route\s+path=["']\/projects\/:projectId\/edits\/:editSessionId["']\s+element=\{<EditorPage\s*\/>\}\s*\/>/g) === 1,
      ['src/App.tsx'],
      'The protected router must expose exactly one Saved Edit Preferences route and one exact named-edit route.',
    ),
    check(
      'preferences_library_entrypoint',
      hasAll(preferencesPage, [
        'EditReferenceWorkspacePage',
        "../components/preferences/EditReferenceWorkspacePage",
        '<EditReferenceWorkspacePage />',
      ])
        && hasNone(preferencesPage, [
          'createEditPreferenceRepository',
          'LocalEditPreferenceDefaults',
          'buildInternalTestingReadinessReport',
          'summarizeLocalEditPreferences',
        ]),
      ['src/pages/PreferencesPage.tsx'],
      '/preferences must mount the library-first Edit Reference workspace rather than the retired generic defaults/settings form.',
    ),
    check(
      'preferences_study_workspace',
      hasAll(preferenceWorkspace, [
        'export function EditReferenceWorkspacePage',
        'createEditReferenceApiClient',
        'uploadEditReferenceMedia',
        'data-edit-reference-workspace="true"',
        'New preference',
        'role="tablist"',
        'role="tabpanel"',
        'useSearchParams',
      ]),
      ['src/components/preferences/EditReferenceWorkspacePage.tsx'],
      'The saved preference surface must expose one query-addressable library, creation, study, evidence, DNA, QA, and approval workspace.',
    ),
    check(
      'preferences_frontend_api_boundary',
      hasAll(preferenceApiClient, [
        'export interface EditReferenceApiClient',
        'createEditReferenceApiClient',
        'idempotency-key',
        'startLongFormStudy',
        'controlLongFormStudy',
        'synthesizePreferenceDNA',
        'runPreferenceDNAQA',
        'approvePreferenceDNA',
        'startTargetVideoUnderstanding',
        'createPreferenceApplication',
        'connectPreferenceApplication',
        'clearPreferenceApplication',
      ]) && hasNone(preferenceApiClient, ['SUPABASE_SERVICE_ROLE_KEY', 'service_role']),
      ['src/lib/edit-reference-api-client.ts'],
      'The browser must use one idempotent frontend-safe client for study, DNA approval, target understanding, and application lifecycle calls.',
    ),
    check(
      'preferences_resumable_private_upload',
      hasAll(preferenceUploadClient, [
        'uploadFileToTemporaryTarget',
        'resumable_content_range_v1',
        'managed_segmented_content_range_v1',
        '/upload-intents',
        '/finalize',
        'idempotency-key',
        'checksumSha256',
        'storageObjectRecord',
      ]) && hasNone(preferenceUploadClient, ['SUPABASE_SERVICE_ROLE_KEY', 'service_role']),
      ['src/lib/edit-reference-media-upload-client.ts'],
      'Reference media must cross the resumable private upload-intent/finalize boundary with checksum readback.',
    ),
    check(
      'named_edit_chat_shell',
      hasAll(editorPage, [
        "import { ChatNativeEditor } from '../components/editor/ChatNativeEditor'",
        'NamedEditWorkspaceBoundary',
        '<ChatNativeEditor',
      ]),
      ['src/pages/EditorPage.tsx'],
      'The exact named-edit route must resolve scoped state before mounting the canonical ChatNativeEditor.',
    ),
    check(
      'exact_edit_preferences_deep_link',
      hasAll(chatEditor, [
        'useSearchParams',
        "searchParams.get('view') === 'preferences'",
        "nextSearchParams.set('view', 'preferences')",
        '<CurrentEditPreferencesWorkspace',
        "activeWorkspaceView === 'preferences'",
      ]),
      ['src/components/editor/ChatNativeEditor.tsx'],
      'Current Edit Preferences must remain a query-addressable view inside the exact named edit, with Chat as the default editor.',
    ),
    check(
      'exact_edit_preference_application',
      hasAll(currentPreferences, [
        'createEditReferenceApiClient',
        'CurrentEditReferenceStudySupplement',
        '<CurrentEditReferenceStudySupplement',
        'data-testid="current-edit-preferences-form"',
        'Study this video before applying the selected preference.',
      ]),
      ['src/components/editor/CurrentEditPreferencesWorkspace.tsx'],
      'The exact-edit preference view must bind approved references to target study and explicit application rather than a second defaults-only form.',
    ),
    check(
      'exact_target_study_and_application_status',
      hasAll(targetStudySupplement, [
        'ProjectEditReferenceTargetStudy',
        'CurrentEditReferenceApplicationStatus',
        'EditReferenceApprovedGuidanceSummary',
        'CurrentEditReferenceTargetAuthority',
        'Study completion never applies or connects guidance automatically.',
      ]),
      ['src/components/editor/edit-reference/CurrentEditReferenceStudySupplement.tsx'],
      'The exact target must have visible study/application status and an explicit no-silent-application boundary.',
    ),
    check(
      'workspace_navigation_accessibility',
      hasAll(projectHeader, [
        "activeWorkspaceView?: 'chat' | 'preferences'",
        "aria-current={activeWorkspaceView === 'preferences' ? 'page' : undefined}",
        'data-testid="current-edit-preferences-trigger"',
      ]),
      ['src/components/editor/MinimalProjectHeader.tsx'],
      'The named-edit header must expose one keyboard-readable active Chat/Edit Preferences destination without changing edit identity.',
    ),
    check(
      'single_editor_and_preference_authority',
      hasNone(app, [
        'ProjectEditSessionChatPage',
        'path="/chat"',
        'path="/brief"',
        'path="/current-edit-preferences"',
      ])
        && count(preferencesPage, /export\s+function\s+PreferencesPage/g) === 1
        && count(editorPage, /export\s+function\s+EditorPage/g) === 1,
      ['src/App.tsx', 'src/pages/PreferencesPage.tsx', 'src/pages/EditorPage.tsx'],
      'Release source must retain one mounted editor, one Saved Edit Preferences entrypoint, and no duplicate chat/brief/preference product routes.',
    ),
  ]

  const sourceFiles = CANONICAL_PRODUCT_UI_SOURCE_PATHS.map((path) => {
    const contents = source[path]
    return contents === undefined
      ? { path, present: false, sizeBytes: 0 }
      : {
          path,
          present: true,
          sizeBytes: Buffer.byteLength(contents, 'utf8'),
          sha256: sha256(contents),
        }
  })
  const sourceDigestSha256 = sha256(JSON.stringify(sourceFiles.map((file) => ({
    path: file.path,
    present: file.present,
    sizeBytes: file.sizeBytes,
    sha256: 'sha256' in file ? file.sha256 : undefined,
  }))))
  const blockers = checks.filter((item) => !item.ok).map((item) => item.id)
  const ok = blockers.length === 0

  return {
    schemaVersion: 1,
    contractVersion: CANONICAL_PRODUCT_UI_INTEGRATION_CONTRACT_VERSION,
    ok,
    decision: ok
      ? 'ready_for_protected_internal_testing_build'
      : 'blocked_noncanonical_product_ui_integration',
    evidenceClass: 'source_verified_static_ui_integration_only',
    sourceDigestSha256,
    sourceFiles,
    checks,
    blockers,
    boundaries: {
      sourceReadOnly: true,
      browserExecuted: false,
      authenticatedSessionVerified: false,
      backendRuntimeVerified: false,
      providerCalled: false,
      secretRead: false,
      cloudMutated: false,
      supabaseMutated: false,
      billingMutated: false,
      deploymentPerformed: false,
      productionReady: false,
    },
    nextStep: ok
      ? 'run_bounded_browser_and_backend_integration_verification'
      : 'integrate_verified_edit_preferences_handoff_then_rerun_strict_gate',
  }
}

function check(
  id: CanonicalProductUiIntegrationCheckId,
  ok: boolean,
  paths: CanonicalProductUiSourcePath[],
  message: string,
): CanonicalProductUiIntegrationCheck {
  return { id, ok, paths, message }
}

function text(source: CanonicalProductUiSourceSnapshot, path: CanonicalProductUiSourcePath): string {
  return source[path] ?? ''
}

function hasAll(value: string, required: string[]): boolean {
  return value.length > 0 && required.every((item) => value.includes(item))
}

function hasNone(value: string, forbidden: string[]): boolean {
  return forbidden.every((item) => !value.includes(item))
}

function count(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
