import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import {
  evaluateCanonicalProductUiIntegrationReadiness,
  readCanonicalProductUiSourceSnapshot,
} from './canonical-product-ui-integration-readiness'
import {
  listProvenToolIdentityCatalog,
  summarizeProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'

export const PROTECTED_INTERNAL_TESTING_RELEASE_CANDIDATE_ADMISSION_VERSION =
  'protected-internal-testing-release-candidate-admission-v1' as const

export const PROTECTED_INTERNAL_TESTING_SOURCE_REF =
  'codex/backend-workflow-pipeline-continuation' as const

const REQUIRED_PACKAGE_SCRIPTS = Object.freeze({
  'smoke:canonical-product-ui-integration-readiness':
    'tsx server/smoke/canonical-product-ui-integration-readiness-smoke.ts',
  'smoke:canonical-private-pipeline-edit-reference-coverage':
    'tsx server/smoke/canonical-private-pipeline-edit-reference-coverage-smoke.ts',
  'smoke:proven-tool-identities':
    'tsx server/smoke/proven-tool-identity-catalog-smoke.ts',
  'smoke:canonical-professional-long-form-post-approval':
    'tsx server/smoke/canonical-professional-long-form-post-approval-smoke.ts',
  'smoke:canonical-professional-long-form-post-approval:release-six-hour':
    'tsx server/smoke/canonical-professional-long-form-post-approval-smoke.ts --release-six-hour',
  'smoke:app-internal-testing-pages-deploy-readiness':
    'tsx server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts',
  'smoke:google-api-gateway-readiness':
    'tsx server/smoke/google-api-gateway-readiness-smoke.ts',
  'smoke:signed-in-private-media-storage-readiness':
    'tsx server/smoke/signed-in-private-media-storage-readiness-smoke.ts',
  'smoke:protected-internal-testing-release-candidate-admission':
    'tsx server/smoke/protected-internal-testing-release-candidate-admission-smoke.ts',
  'internal-testing:verify-protected-release-candidate':
    'tsx server/cli/verify-protected-internal-testing-release-candidate.ts',
})

const DEDICATED_BROWSER_SUITES = [
  'canonical-journey-ui.spec.ts',
  'edit-preferences-atomic-apply.spec.ts',
  'edit-preferences-current-edit.spec.ts',
  'edit-reference-canonical-real-file-flow.spec.ts',
  'edit-reference-canonical-v3-local-browser.spec.ts',
  'edit-reference-long-form-review.spec.ts',
  'google-oauth-sign-in.spec.ts',
  'professional-long-form-customer-delivery-media-source.spec.ts',
] as const

const ACTIVATION_WORKFLOWS = [
  '.github/workflows/signed-in-private-media-storage-staging-activation.yml',
  '.github/workflows/beta-readiness-api-staging-deploy.yml',
  '.github/workflows/app-internal-testing-pages-deploy.yml',
] as const

export type ProtectedInternalTestingReleaseCandidateGateId =
  | 'explicit_expected_source_identity'
  | 'canonical_source_ref'
  | 'exact_source_sha'
  | 'resolved_source_tree'
  | 'clean_source_worktree'
  | 'appledouble_absent'
  | 'canonical_product_ui_source'
  | 'standard_browser_suite_isolated'
  | 'dedicated_browser_suites_separated'
  | 'routine_two_hour_profile'
  | 'release_six_hour_profile_retained'
  | 'release_six_hour_excluded_from_routine'
  | 'tool_catalog_partition'
  | 'fifty_canonical_tool_identities'
  | 'fifty_canonical_job_adapters'
  | 'tool_product_promotion_absent'
  | 'canonical_v3_local_manifest_integrity'
  | 'canonical_v3_local_only_boundary'
  | 'raw_migration_baseline_blocked'
  | 'required_source_readiness_scripts'
  | 'storage_workflow_source_admission'
  | 'gateway_workflow_source_admission'
  | 'pages_workflow_source_admission'

export interface ProtectedInternalTestingReleaseCandidateSnapshot {
  expectedSourceRef: string
  expectedSourceSha: string
  source: {
    headSha: string
    treeSha: string
    statusPorcelain: string
    appleDoublePaths: string[]
  }
  canonicalProductUi: {
    ok: boolean
    sourceDigestSha256: string
    checkCount: number
  }
  browser: {
    standardSuiteIsolated: boolean
    dedicatedSuitesSeparated: boolean
    dedicatedSuiteCount: number
  }
  longForm: {
    routineProfileId: 'routine_two_hour' | 'unverified'
    routineDurationSeconds: number | null
    routineChildJobCount: number | null
    releaseStressProfileId: 'release_six_hour' | 'unverified'
    releaseStressDurationSeconds: number | null
    releaseStressChildJobCount: number | null
    releaseStressRetained: boolean
    releaseStressExecutedByRoutinePipeline: boolean
  }
  tools: {
    catalogVersion: string
    totalRegistryProfiles: number
    callableCandidateCount: number
    intentionallyNonExecutableCount: number
    confinedRunnerVerifiedCount: number
    canonicalEndToEndVerifiedCount: number
    canonicalJobAdapterVerifiedCount: number
    allProductPromotionGatesFalse: boolean
  }
  canonicalV3Local: {
    manifestPresent: boolean
    manifestDigestSha256: string | null
    manifestIntegrityVerified: boolean
    schemaVersion: string | null
    executionScope: string | null
    rawMigrationBaselineStatus: string | null
    remoteMutationAllowed: boolean | null
    productionAuthority: boolean | null
    migrationCount: number
    verifiedFileCount: number
  }
  sourceContracts: {
    rawMigrationBaselineDocumentBlocked: boolean
    requiredPackageScriptsExact: boolean
    workflowAdmission: Record<typeof ACTIVATION_WORKFLOWS[number], boolean>
  }
}

export interface ProtectedInternalTestingReleaseCandidateAdmissionReport {
  schemaVersion: 1
  contractVersion: typeof PROTECTED_INTERNAL_TESTING_RELEASE_CANDIDATE_ADMISSION_VERSION
  ok: boolean
  decision:
    | 'admitted_for_owner_authorized_same_sha_protected_internal_testing_activation'
    | 'blocked_before_protected_internal_testing_activation'
  evidenceClass: 'source_verified_same_sha_admission_only'
  source: {
    expectedRef: string
    expectedSha: string
    headSha: string
    treeSha: string
    clean: boolean
  }
  gates: Record<ProtectedInternalTestingReleaseCandidateGateId, boolean>
  blockers: ProtectedInternalTestingReleaseCandidateGateId[]
  counts: {
    canonicalUiChecks: number
    dedicatedBrowserSuites: number
    toolRegistryProfiles: number
    callableToolCandidates: number
    confinedRunnerProofs: number
    canonicalEndToEndToolProofs: number
    canonicalJobAdapterProofs: number
    canonicalV3LocalMigrations: number
    canonicalV3ManifestVerifiedFiles: number
  }
  evidence: {
    canonicalUiSourceDigestSha256: string
    canonicalToolCatalogVersion: string
    canonicalV3ManifestDigestSha256: string | null
    routineLongForm: {
      profileId: ProtectedInternalTestingReleaseCandidateSnapshot['longForm']['routineProfileId']
      durationSeconds: number | null
      childJobCount: number | null
    }
    releaseStressLongForm: {
      profileId: ProtectedInternalTestingReleaseCandidateSnapshot['longForm']['releaseStressProfileId']
      durationSeconds: number | null
      childJobCount: number | null
      executedByThisAdmission: false
    }
  }
  externalGates: {
    remoteSupabaseSchemaAndRlsVerified: false
    remoteSupabaseGoogleOAuthConfigured: false
    liveGmailSessionVerified: false
    gcsStorageActivationVerified: false
    cloudRunGatewayActivationVerified: false
    distributedWorkersVerified: false
    providerExecutionVerified: false
    customerBillingEnabled: false
    pagesDeploymentVerified: false
    publicDeliveryEnabled: false
    productionReady: false
  }
  boundaries: {
    sourceOnly: true
    browserExecutedInThisAdmission: false
    databaseStarted: false
    localDatabaseMutated: false
    networkAccessed: false
    credentialsRead: false
    providerCalled: false
    cloudMutated: false
    supabaseContacted: false
    billingMutated: false
    deploymentPerformed: false
    sixHourStressExecuted: false
  }
  receiptSha256: string
  nextStep:
    | 'run_owner_authorized_same_sha_storage_gateway_pages_and_interactive_google_session_sequence'
    | 'repair_source_admission_blockers_and_rerun'
}

export function readProtectedInternalTestingReleaseCandidateSnapshot(
  rootDirectory: string,
  expectedSourceRef: string,
  expectedSourceSha: string,
): ProtectedInternalTestingReleaseCandidateSnapshot {
  const packageScripts = readPackageScripts(rootDirectory)
  const playwright = readText(rootDirectory, 'playwright.config.ts')
  const longFormSmoke = readText(
    rootDirectory,
    'server/smoke/canonical-professional-long-form-post-approval-smoke.ts',
  )
  const pipelineCli = readText(
    rootDirectory,
    'server/cli/canonical-private-pipeline-verification.ts',
  )
  const baselineDocument = readText(
    rootDirectory,
    'docs/supabase-migration-baseline-reconciliation.md',
  )
  const uiReport = evaluateCanonicalProductUiIntegrationReadiness(
    readCanonicalProductUiSourceSnapshot(rootDirectory),
  )
  const toolSummary = summarizeProvenToolIdentityCatalog()
  const allProductPromotionGatesFalse = listProvenToolIdentityCatalog().every((record) =>
    record.readiness.productReady === false
      && record.readiness.externalBetaReady === false
      && record.readiness.productionReady === false)
  const canonicalV3Local = readCanonicalV3ManifestEvidence(rootDirectory)

  return {
    expectedSourceRef,
    expectedSourceSha,
    source: {
      headSha: runGit(rootDirectory, ['rev-parse', 'HEAD']),
      treeSha: runGit(rootDirectory, ['rev-parse', 'HEAD^{tree}']),
      statusPorcelain: runGit(
        rootDirectory,
        ['status', '--porcelain', '--untracked-files=all'],
      ),
      appleDoublePaths: runGit(
        rootDirectory,
        ['ls-files', '--cached', '--others', '--exclude-standard'],
      ).split('\n').filter((path) => path.length > 0 && basename(path).startsWith('._')),
    },
    canonicalProductUi: {
      ok: uiReport.ok,
      sourceDigestSha256: uiReport.sourceDigestSha256,
      checkCount: uiReport.checks.length,
    },
    browser: {
      standardSuiteIsolated:
        /PLAYWRIGHT_PORT\s*\?\?\s*5203/u.test(playwright)
        && /PLAYWRIGHT_REUSE_SERVER[\s\S]{0,180}\?\s*false/u.test(playwright)
        && playwright.includes('--strictPort'),
      dedicatedSuitesSeparated: DEDICATED_BROWSER_SUITES.every((suite) =>
        playwright.includes(suite)),
      dedicatedSuiteCount: DEDICATED_BROWSER_SUITES.length,
    },
    longForm: {
      routineProfileId:
        /id:\s*'routine_two_hour'/u.test(longFormSmoke) ? 'routine_two_hour' : 'unverified',
      routineDurationSeconds:
        /durationSeconds:\s*2\s*\*\s*60\s*\*\s*60/u.test(longFormSmoke)
          && /professionalLongFormRoutineDurationSeconds:\s*7_200/u.test(pipelineCli)
          ? 7_200
          : null,
      routineChildJobCount:
        /professionalLongFormRoutineChildJobCount:\s*127/u.test(pipelineCli) ? 127 : null,
      releaseStressProfileId:
        /id:\s*'release_six_hour'/u.test(longFormSmoke) ? 'release_six_hour' : 'unverified',
      releaseStressDurationSeconds:
        /professionalLongFormReleaseStressDurationSeconds:\s*21_600/u.test(pipelineCli)
          ? 21_600
          : null,
      releaseStressChildJobCount:
        /professionalLongFormReleaseStressChildJobCount:\s*255/u.test(pipelineCli) ? 255 : null,
      releaseStressRetained:
        packageScripts['smoke:canonical-professional-long-form-post-approval:release-six-hour']
          === REQUIRED_PACKAGE_SCRIPTS[
            'smoke:canonical-professional-long-form-post-approval:release-six-hour'
          ],
      releaseStressExecutedByRoutinePipeline:
        !/professionalLongFormReleaseStressExecutedInThisRun:\s*false/u.test(pipelineCli)
        || canonicalPipelineStepSource(pipelineCli).includes(
          "'smoke:canonical-professional-long-form-post-approval:release-six-hour'",
        ),
    },
    tools: {
      catalogVersion: toolSummary.schemaVersion,
      totalRegistryProfiles: toolSummary.totalRegistryProfiles,
      callableCandidateCount: toolSummary.callableCandidateCount,
      intentionallyNonExecutableCount: toolSummary.intentionallyNonExecutableCount,
      confinedRunnerVerifiedCount: toolSummary.confinedRunnerVerifiedCount,
      canonicalEndToEndVerifiedCount: toolSummary.canonicalEndToEndVerifiedCount,
      canonicalJobAdapterVerifiedCount: toolSummary.canonicalJobAdapterVerifiedCount,
      allProductPromotionGatesFalse,
    },
    canonicalV3Local,
    sourceContracts: {
      rawMigrationBaselineDocumentBlocked:
        /Status:\s*`blocked_by_parallel_foundations`/u.test(baselineDocument),
      requiredPackageScriptsExact: Object.entries(REQUIRED_PACKAGE_SCRIPTS).every(
        ([name, command]) => packageScripts[name] === command,
      ),
      workflowAdmission: Object.fromEntries(ACTIVATION_WORKFLOWS.map((path) => [
        path,
        workflowHasAdmissionBeforeEffect(readText(rootDirectory, path), path),
      ])) as Record<typeof ACTIVATION_WORKFLOWS[number], boolean>,
    },
  }
}

export function evaluateProtectedInternalTestingReleaseCandidateAdmission(
  snapshot: ProtectedInternalTestingReleaseCandidateSnapshot,
): ProtectedInternalTestingReleaseCandidateAdmissionReport {
  const gates: Record<ProtectedInternalTestingReleaseCandidateGateId, boolean> = {
    explicit_expected_source_identity:
      snapshot.expectedSourceRef.length > 0 && /^[a-f0-9]{40}$/u.test(snapshot.expectedSourceSha),
    canonical_source_ref: snapshot.expectedSourceRef === PROTECTED_INTERNAL_TESTING_SOURCE_REF,
    exact_source_sha:
      /^[a-f0-9]{40}$/u.test(snapshot.source.headSha)
      && snapshot.expectedSourceSha === snapshot.source.headSha,
    resolved_source_tree: /^[a-f0-9]{40}$/u.test(snapshot.source.treeSha),
    clean_source_worktree: snapshot.source.statusPorcelain.length === 0,
    appledouble_absent: snapshot.source.appleDoublePaths.length === 0,
    canonical_product_ui_source: snapshot.canonicalProductUi.ok,
    standard_browser_suite_isolated: snapshot.browser.standardSuiteIsolated,
    dedicated_browser_suites_separated: snapshot.browser.dedicatedSuitesSeparated,
    routine_two_hour_profile:
      snapshot.longForm.routineProfileId === 'routine_two_hour'
      && snapshot.longForm.routineDurationSeconds === 7_200
      && snapshot.longForm.routineChildJobCount === 127,
    release_six_hour_profile_retained:
      snapshot.longForm.releaseStressProfileId === 'release_six_hour'
      && snapshot.longForm.releaseStressDurationSeconds === 21_600
      && snapshot.longForm.releaseStressChildJobCount === 255
      && snapshot.longForm.releaseStressRetained,
    release_six_hour_excluded_from_routine:
      snapshot.longForm.releaseStressExecutedByRoutinePipeline === false,
    tool_catalog_partition:
      snapshot.tools.totalRegistryProfiles === 50
      && snapshot.tools.callableCandidateCount === 50
      && snapshot.tools.intentionallyNonExecutableCount === 0
      && snapshot.tools.confinedRunnerVerifiedCount === 50
      && snapshot.tools.callableCandidateCount
        + snapshot.tools.intentionallyNonExecutableCount
        === snapshot.tools.totalRegistryProfiles,
    fifty_canonical_tool_identities: snapshot.tools.canonicalEndToEndVerifiedCount >= 50,
    fifty_canonical_job_adapters: snapshot.tools.canonicalJobAdapterVerifiedCount >= 50,
    tool_product_promotion_absent: snapshot.tools.allProductPromotionGatesFalse,
    canonical_v3_local_manifest_integrity:
      snapshot.canonicalV3Local.manifestPresent
      && snapshot.canonicalV3Local.manifestIntegrityVerified,
    canonical_v3_local_only_boundary:
      snapshot.canonicalV3Local.schemaVersion === 'reeditpro-canonical-v3-local-manifest-v1'
      && snapshot.canonicalV3Local.executionScope === 'local_only'
      && snapshot.canonicalV3Local.remoteMutationAllowed === false
      && snapshot.canonicalV3Local.productionAuthority === false,
    raw_migration_baseline_blocked:
      snapshot.canonicalV3Local.rawMigrationBaselineStatus === 'blocked_by_parallel_foundations'
      && snapshot.sourceContracts.rawMigrationBaselineDocumentBlocked,
    required_source_readiness_scripts: snapshot.sourceContracts.requiredPackageScriptsExact,
    storage_workflow_source_admission:
      snapshot.sourceContracts.workflowAdmission[
        '.github/workflows/signed-in-private-media-storage-staging-activation.yml'
      ],
    gateway_workflow_source_admission:
      snapshot.sourceContracts.workflowAdmission[
        '.github/workflows/beta-readiness-api-staging-deploy.yml'
      ],
    pages_workflow_source_admission:
      snapshot.sourceContracts.workflowAdmission[
        '.github/workflows/app-internal-testing-pages-deploy.yml'
      ],
  }
  const blockers = (Object.entries(gates) as Array<[
    ProtectedInternalTestingReleaseCandidateGateId,
    boolean,
  ]>).filter(([, ok]) => !ok).map(([id]) => id)
  const ok = blockers.length === 0

  const reportWithoutDigest = {
    schemaVersion: 1 as const,
    contractVersion: PROTECTED_INTERNAL_TESTING_RELEASE_CANDIDATE_ADMISSION_VERSION,
    ok,
    decision: ok
      ? 'admitted_for_owner_authorized_same_sha_protected_internal_testing_activation' as const
      : 'blocked_before_protected_internal_testing_activation' as const,
    evidenceClass: 'source_verified_same_sha_admission_only' as const,
    source: {
      expectedRef: snapshot.expectedSourceRef,
      expectedSha: snapshot.expectedSourceSha,
      headSha: snapshot.source.headSha,
      treeSha: snapshot.source.treeSha,
      clean: snapshot.source.statusPorcelain.length === 0,
    },
    gates,
    blockers,
    counts: {
      canonicalUiChecks: snapshot.canonicalProductUi.checkCount,
      dedicatedBrowserSuites: snapshot.browser.dedicatedSuiteCount,
      toolRegistryProfiles: snapshot.tools.totalRegistryProfiles,
      callableToolCandidates: snapshot.tools.callableCandidateCount,
      confinedRunnerProofs: snapshot.tools.confinedRunnerVerifiedCount,
      canonicalEndToEndToolProofs: snapshot.tools.canonicalEndToEndVerifiedCount,
      canonicalJobAdapterProofs: snapshot.tools.canonicalJobAdapterVerifiedCount,
      canonicalV3LocalMigrations: snapshot.canonicalV3Local.migrationCount,
      canonicalV3ManifestVerifiedFiles: snapshot.canonicalV3Local.verifiedFileCount,
    },
    evidence: {
      canonicalUiSourceDigestSha256: snapshot.canonicalProductUi.sourceDigestSha256,
      canonicalToolCatalogVersion: snapshot.tools.catalogVersion,
      canonicalV3ManifestDigestSha256: snapshot.canonicalV3Local.manifestDigestSha256,
      routineLongForm: {
        profileId: snapshot.longForm.routineProfileId,
        durationSeconds: snapshot.longForm.routineDurationSeconds,
        childJobCount: snapshot.longForm.routineChildJobCount,
      },
      releaseStressLongForm: {
        profileId: snapshot.longForm.releaseStressProfileId,
        durationSeconds: snapshot.longForm.releaseStressDurationSeconds,
        childJobCount: snapshot.longForm.releaseStressChildJobCount,
        executedByThisAdmission: false as const,
      },
    },
    externalGates: {
      remoteSupabaseSchemaAndRlsVerified: false as const,
      remoteSupabaseGoogleOAuthConfigured: false as const,
      liveGmailSessionVerified: false as const,
      gcsStorageActivationVerified: false as const,
      cloudRunGatewayActivationVerified: false as const,
      distributedWorkersVerified: false as const,
      providerExecutionVerified: false as const,
      customerBillingEnabled: false as const,
      pagesDeploymentVerified: false as const,
      publicDeliveryEnabled: false as const,
      productionReady: false as const,
    },
    boundaries: {
      sourceOnly: true as const,
      browserExecutedInThisAdmission: false as const,
      databaseStarted: false as const,
      localDatabaseMutated: false as const,
      networkAccessed: false as const,
      credentialsRead: false as const,
      providerCalled: false as const,
      cloudMutated: false as const,
      supabaseContacted: false as const,
      billingMutated: false as const,
      deploymentPerformed: false as const,
      sixHourStressExecuted: false as const,
    },
    nextStep: ok
      ? 'run_owner_authorized_same_sha_storage_gateway_pages_and_interactive_google_session_sequence' as const
      : 'repair_source_admission_blockers_and_rerun' as const,
  }

  return {
    ...reportWithoutDigest,
    receiptSha256: sha256StableValue(reportWithoutDigest),
  }
}

function readCanonicalV3ManifestEvidence(
  rootDirectory: string,
): ProtectedInternalTestingReleaseCandidateSnapshot['canonicalV3Local'] {
  const manifestRelativePath = 'database/canonical-v3-local/manifest.json'
  const manifestText = readText(rootDirectory, manifestRelativePath)
  if (!manifestText) return missingManifestEvidence()

  let manifest: Record<string, unknown>
  try {
    const parsed = JSON.parse(manifestText) as unknown
    if (!isRecord(parsed)) return missingManifestEvidence()
    manifest = parsed
  } catch {
    return missingManifestEvidence()
  }

  const files = arrayOfManifestEntries(manifest.files)
  const repositoryFiles = arrayOfManifestEntries(manifest.repositoryFiles)
  const allEntriesValid = files !== null
    && repositoryFiles !== null
    && files.every((entry) => verifyManifestEntry(
      join(rootDirectory, 'database/canonical-v3-local'),
      entry,
    ))
    && repositoryFiles.every((entry) => verifyManifestEntry(rootDirectory, entry))
  const migrationEntries = files?.filter((entry) =>
    entry.path.startsWith('supabase/migrations/') && entry.path.endsWith('.sql')) ?? []
  const actualMigrations = safeReadDirectory(
    join(rootDirectory, 'database/canonical-v3-local/supabase/migrations'),
  ).filter((name) => name.endsWith('.sql')).sort()
  const declaredMigrations = migrationEntries.map((entry) => basename(entry.path)).sort()
  const migrationsExact = actualMigrations.length === declaredMigrations.length
    && actualMigrations.every((name, index) => name === declaredMigrations[index])

  return {
    manifestPresent: true,
    manifestDigestSha256: sha256Text(manifestText),
    manifestIntegrityVerified: allEntriesValid && migrationsExact,
    schemaVersion: stringValue(manifest.schemaVersion),
    executionScope: stringValue(manifest.executionScope),
    rawMigrationBaselineStatus: stringValue(manifest.rawMigrationBaselineStatus),
    remoteMutationAllowed: booleanValue(manifest.remoteMutationAllowed),
    productionAuthority: booleanValue(manifest.productionAuthority),
    migrationCount: actualMigrations.length,
    verifiedFileCount: (files?.length ?? 0) + (repositoryFiles?.length ?? 0),
  }
}

function missingManifestEvidence(): ProtectedInternalTestingReleaseCandidateSnapshot['canonicalV3Local'] {
  return {
    manifestPresent: false,
    manifestDigestSha256: null,
    manifestIntegrityVerified: false,
    schemaVersion: null,
    executionScope: null,
    rawMigrationBaselineStatus: null,
    remoteMutationAllowed: null,
    productionAuthority: null,
    migrationCount: 0,
    verifiedFileCount: 0,
  }
}

function workflowHasAdmissionBeforeEffect(
  workflow: string,
  path: typeof ACTIVATION_WORKFLOWS[number],
): boolean {
  const installIndex = workflow.indexOf('npm ci --no-audit --no-fund --progress=false')
  const smokeIndex = workflow.indexOf(
    'npm run smoke:protected-internal-testing-release-candidate-admission',
  )
  const admissionIndex = workflow.indexOf('npm run internal-testing:verify-protected-release-candidate')
  const expectedEnv = [
    'REEDITPRO_INTERNAL_TESTING_SOURCE_REF: ${{ inputs.source_ref }}',
    'REEDITPRO_INTERNAL_TESTING_SOURCE_SHA: ${{ inputs.source_sha }}',
  ].every((value) => workflow.includes(value))
  const effectMarker = path === '.github/workflows/app-internal-testing-pages-deploy.yml'
    ? '- name: Build signed-in static app against verified gateway'
    : '- name: Authenticate to Google Cloud with keyless OIDC'
  const effectIndex = workflow.indexOf(effectMarker)
  return installIndex >= 0
    && smokeIndex > installIndex
    && admissionIndex > smokeIndex
    && effectIndex > admissionIndex
    && expectedEnv
}

function canonicalPipelineStepSource(source: string): string {
  const start = source.indexOf('const canonicalSteps: VerificationStep[] = [')
  const end = source.indexOf('const fullBoundarySteps: VerificationStep[] = [')
  return start >= 0 && end > start ? source.slice(start, end) : ''
}

function readPackageScripts(rootDirectory: string): Record<string, string> {
  try {
    const parsed = JSON.parse(readText(rootDirectory, 'package.json')) as unknown
    if (!isRecord(parsed) || !isRecord(parsed.scripts)) return {}
    return Object.fromEntries(Object.entries(parsed.scripts).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ))
  } catch {
    return {}
  }
}

function readText(rootDirectory: string, relativePath: string): string {
  try {
    return readFileSync(join(rootDirectory, relativePath), 'utf8')
  } catch {
    return ''
  }
}

function runGit(rootDirectory: string, args: string[]): string {
  const candidates = [
    process.env.REEDITPRO_GIT_BINARY,
    join(
      homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git',
    ),
    'git',
  ].filter((candidate, index, all): candidate is string =>
    typeof candidate === 'string'
      && candidate.length > 0
      && all.indexOf(candidate) === index)
  for (const candidate of candidates) {
    try {
      return execFileSync(candidate, args, {
        cwd: rootDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      // Try the next reviewed local/host Git binary. Failure remains fail-closed.
    }
  }
  return ''
}

function safeReadDirectory(path: string): string[] {
  try {
    return readdirSync(path)
  } catch {
    return []
  }
}

interface ManifestEntry {
  path: string
  sha256: string
}

function arrayOfManifestEntries(value: unknown): ManifestEntry[] | null {
  if (!Array.isArray(value)) return null
  const entries: ManifestEntry[] = []
  for (const candidate of value) {
    if (!isRecord(candidate)) return null
    const path = stringValue(candidate.path)
    const sha256 = stringValue(candidate.sha256)
    if (
      path === null
      || sha256 === null
      || path.startsWith('/')
      || path.split('/').includes('..')
      || !/^[a-f0-9]{64}$/u.test(sha256)
    ) return null
    entries.push({ path, sha256 })
  }
  return entries
}

function verifyManifestEntry(rootDirectory: string, entry: ManifestEntry): boolean {
  try {
    return sha256Buffer(readFileSync(join(rootDirectory, entry.path))) === entry.sha256
  } catch {
    return false
  }
}

function sha256StableValue(value: unknown): string {
  return sha256Text(JSON.stringify(stableJsonValue(value)))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableJsonValue(nested)]))
  }
  return value
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Buffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}
