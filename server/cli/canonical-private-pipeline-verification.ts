import { spawn } from 'node:child_process'

type VerificationStep = {
  id: string
  script: string
  evidence: string
  env?: Record<string, string>
}

type VerificationStepResult = VerificationStep & {
  durationMs: number
  exitCode: number
}

const full = process.argv.includes('--full')

const canonicalSteps: VerificationStep[] = [
  step(
    'planning-input-safety',
    'smoke:planning-input-safety',
    'Structured intent, Edit Brief transfer, preference provenance, source order, and immutable approval inputs.',
  ),
  step(
    'exact-edit-preferences',
    'smoke:exact-edit-preference-authority',
    'Tenant-scoped exact-edit baseline, revision, optimistic update, derived evidence, lock, and replay authority.',
  ),
  step(
    'edit-brief-authority',
    'smoke:edit-brief-authority',
    'Exact-edit brief persistence, planning binding, approval locking, and revision-safe authority.',
  ),
  step(
    'private-source-authority',
    'smoke:private-source-media-authority',
    'Finalized source identity, checksum, source order, project scope, and immutable source authority.',
  ),
  step(
    'large-media-private-4k-pipeline',
    'smoke:large-media-private-4k-pipeline',
    'A real resumable-sized 4K source crosses interrupted chunk recovery, backend byte verification, generation-bound private finalization, durable replay, and immutable-master proxy lineage.',
  ),
  step(
    'professional-export-policy',
    'smoke:professional-export',
    'One approved 4K UHD delivery ceiling covers 1080p, 2K, and 4K exports without a second estimate.',
  ),
  step(
    'edit-brief-export-settings',
    'smoke:project-edit-brief-export-settings',
    'Edit Brief export settings preserve the exact approved delivery profile and estimate coverage.',
  ),
  step(
    'browser-planning-publication',
    'smoke:canonical-planning-publication-client',
    'Frontend-safe exact preference synchronization, planning handoff, plan presentation, retries, and response validation.',
  ),
  step(
    'browser-plan-approval',
    'smoke:canonical-plan-approval-client',
    'Visible plan, estimate, version, hash, and maximum-credit identity bind to the separate approval action.',
  ),
  step(
    'browser-execution-package-request',
    'smoke:canonical-execution-package-request-client',
    'The signed-in browser requests an opaque execution handoff without receiving jobs, tools, paths, or credentials.',
  ),
  step(
    'browser-private-edit-preparation',
    'smoke:canonical-private-edit-preparation-client',
    'The signed-in browser advances only the server-owned approved package and receives bounded progress/review state.',
  ),
  step(
    'browser-private-review',
    'smoke:canonical-private-review-client',
    'Private review bytes, integrity checks, acceptance, revision, and history recovery stay authority-bound.',
  ),
  step(
    'browser-journey-recovery',
    'smoke:canonical-edit-journey-client',
    'Every canonical journey stage is strictly parsed and recovered without private execution material.',
  ),
  step(
    'canonical-backend-authority',
    'smoke:canonical-execution-readiness',
    'Real local backend upload, planning, publication, approval, reservation, snapshot, jobs, package, and readiness authority.',
  ),
  step(
    'canonical-multi-source-execution',
    'smoke:canonical-multi-source-final-composition',
    'Bounded ordered multi-source execution reaches approved hard-cut boundaries, exact source-bound voice delivery, lease, one-use dispatch, private artifacts, QA, reconciliation, ordered voice replacement, and download evidence.',
  ),
  step(
    'canonical-professional-color-execution',
    'smoke:canonical-private-color-execution',
    'One exact source-bound professional color plan reaches bounded pixel analysis and correction, lossless private Matroska persistence, QA, reconciliation, replay, Remotion composition, independent final QA, and private download evidence.',
  ),
  step(
    'canonical-named-edit-ui',
    'qa:canonical-journey-ui',
    'The active named-edit browser exposes accessible loading, error, retry, approval, preparation, review, and revision states.',
    { PLAYWRIGHT_REUSE_SERVER: 'false' },
  ),
  step(
    'proven-tool-identities',
    'report:proven-tools',
    'The versioned tool identity report remains the evidence source for private canonical lifecycle and job-adapter readiness.',
  ),
]

const fullBoundarySteps: VerificationStep[] = [
  step(
    'auth-runtime-boundary',
    'smoke:auth-runtime-boundary',
    'Authentication and private runtime modes fail closed outside their reviewed local/internal boundary.',
  ),
  step(
    'project-persistence-tenancy',
    'smoke:project-persistence-tenancy',
    'Project persistence is scoped to the exact signed-in workspace and owner authority.',
  ),
  step(
    'project-state-tenancy',
    'smoke:project-state-tenancy',
    'Named-edit state cannot cross user, workspace, project, or edit-session identity.',
  ),
  step(
    'approved-tool-work-manifest',
    'smoke:approved-tool-work-manifest',
    'Approved operations, tool identities, outputs, blockers, and evidence remain snapshot-bound.',
  ),
  step(
    'private-playwright-capture',
    'smoke:private-playwright-capture',
    'The bounded browser-capture capability revalidates server authority before private execution.',
  ),
  step(
    'legacy-private-review-regression',
    'smoke:editor-full-stack-private-review',
    'Signed-in project creation, two-source private upload, persistence, preference synchronization, and fail-closed rich-plan behavior remain regression-safe.',
  ),
]

const steps = full
  ? [...fullBoundarySteps.slice(0, -1), ...canonicalSteps, fullBoundarySteps.at(-1)!]
  : canonicalSteps
const results: VerificationStepResult[] = []
const startedAt = new Date()

for (const [index, verification] of steps.entries()) {
  process.stdout.write(
    `\n[canonical-pipeline ${index + 1}/${steps.length}] ${verification.id}: ${verification.evidence}\n`,
  )
  const stepStartedAt = Date.now()
  const exitCode = await runNpmScript(verification)
  const result = {
    ...verification,
    durationMs: Date.now() - stepStartedAt,
    exitCode,
  }
  results.push(result)
  if (exitCode !== 0) {
    printReport('failed', startedAt, results, verification.id)
    process.exitCode = exitCode
    break
  }
}

if (results.length === steps.length && results.every((result) => result.exitCode === 0)) {
  printReport('passed', startedAt, results)
}

function step(
  id: string,
  script: string,
  evidence: string,
  env?: Record<string, string>,
): VerificationStep {
  return { id, script, evidence, ...(env ? { env } : {}) }
}

function runNpmScript(verification: VerificationStep): Promise<number> {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return new Promise((resolve) => {
    const child = spawn(npmCommand, ['run', verification.script], {
      cwd: process.cwd(),
      env: { ...process.env, ...verification.env },
      stdio: 'inherit',
      shell: false,
    })
    child.once('error', (error) => {
      process.stderr.write(
        `[canonical-pipeline] ${verification.id} could not start: ${error.message}\n`,
      )
      resolve(1)
    })
    child.once('exit', (code, signal) => {
      if (signal) {
        process.stderr.write(
          `[canonical-pipeline] ${verification.id} stopped by ${signal}.\n`,
        )
        resolve(1)
        return
      }
      resolve(code ?? 1)
    })
  })
}

function printReport(
  status: 'passed' | 'failed',
  runStartedAt: Date,
  completedSteps: VerificationStepResult[],
  failedStepId?: string,
): void {
  const finishedAt = new Date()
  const report = {
    schemaVersion: 'canonical-private-pipeline-verification-v1',
    status,
    mode: full ? 'full_internal_regression' : 'canonical_private_pipeline',
    startedAt: runStartedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - runStartedAt.getTime(),
    completedStepCount: completedSteps.filter((result) => result.exitCode === 0).length,
    plannedStepCount: steps.length,
    failedStepId: failedStepId ?? null,
    steps: completedSteps.map(({ id, script, evidence, durationMs, exitCode }) => ({
      id,
      script,
      evidence,
      durationMs,
      exitCode,
    })),
    verifiedClaims: status === 'passed'
      ? {
          exactSourcePreferenceBriefAuthority: true,
          resumableSized4kPrivateSourcePipeline: true,
          sourceOnlyIntentAuthority: true,
          fourKEstimateDeliveryCeiling: true,
          canonicalBrowserContracts: true,
          canonicalBackendAuthority: true,
          boundedPrivateMultiSourceExecution: true,
          boundedApprovedHardCutTransitions: true,
          boundedProfessionalVoiceDelivery: true,
          boundedProfessionalColorExecution: true,
          activeNamedEditJourneyStates: true,
          versionedToolIdentityEvidence: true,
          ...(full ? { signedInTwoSourceUploadAndPersistence: true } : {}),
        }
      : {},
    boundaries: {
      localPrivateEvidenceOnly: true,
      providerActivationAuthorized: false,
      liveBillingOrWalletMutationAuthorized: false,
      remoteSupabaseAuthorized: false,
      publicDeliveryAuthorized: false,
      deploymentAuthorized: false,
      externalBetaReady: false,
      paidProductionReady: false,
    },
  }
  process.stdout.write(`\n${JSON.stringify(report, null, 2)}\n`)
}
