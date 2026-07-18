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
    'professional-long-form-object-plan',
    'smoke:professional-long-form-object-plan',
    'A server-owned object-backed plan conserves exact frames across a 30-minute 24-source fixture and a bounded six-hour/512-range capacity fixture, requires chunk QA, continuous program audio, color continuity, one approved 4K estimate, and keeps snapshot wiring, media execution, storage, database, cloud, staging, and production false.',
  ),
  step(
    'professional-long-form-approved-snapshot-bridge',
    'smoke:professional-long-form-snapshot-bridge',
    'The exact long-form seed, plan, estimate, timing, reservation, controller, and bounded 255-item child graph bind to one approved snapshot while canonical seed/controller persistence, child-job derivation, object storage, media execution, database, cloud, product, and production readiness remain false.',
  ),
  step(
    'canonical-professional-long-form-post-approval',
    'smoke:canonical-professional-long-form-post-approval',
    'A six-hour/512-range 4K seed and one blocked controller persist through real canonical publication and approval; restart-safe server derivation reopens the exact authority and persists a content-addressed 255-child manifest while ordinary package creation, queue promotion, dispatch, media, cloud, commerce, product, and production remain blocked.',
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
    'canonical-durable-package-work-queue',
    'smoke:canonical-private-package-work-queue',
    'The immutable package and resource placement produce a private durable queue with opaque claims, heartbeat, attempt ceilings, restart recovery, terminal replay, and tamper rejection.',
  ),
  step(
    'canonical-package-state-transaction',
    'smoke:canonical-private-package-state-transaction',
    'A server-selected package attempt and dispatch outbox entry share one private write-ahead commit. Accepted-worker completion, pre-commit failure, and accepted-worker lease timeout each use the same crash-consistent boundary for one mutually exclusive terminal receipt; timeout cost identity is loaded from exact private evidence inside the package lock, caller-supplied cost hashes are rejected, and later attempts remain fenced until bounded reconciliation. Retry, exhaustion, user review, versioned internal-cost evidence, real process exits, races, missing/tampered/mismatched cost refusal, projection-drift refusal, and restrictive modes pass while distributed authority remains false.',
  ),
  step(
    'canonical-distributed-package-state-contract',
    'smoke:canonical-distributed-package-state-port',
    'The database-neutral package lifecycle port rejects caller-selected state and cost, serializes claim/start/heartbeat/terminal transitions, replays exact lost responses, terminalizes completion/failure/timeout once, and keeps database, cloud, commerce, and production authority false.',
  ),
  step(
    'canonical-distributed-package-state-rpc-adapter',
    'smoke:canonical-distributed-package-state-rpc-adapter',
    'The locked server-only seven-function RPC transport uses one fixed validated envelope per method, no hidden retry, sanitized errors, and a process-bound injected contract client while SQL, live Supabase/Postgres, distributed durability, and production activation remain false.',
  ),
  step(
    'canonical-cloud-dispatch-handoff',
    'smoke:canonical-cloud-dispatch-handoff',
    'The exact package queue and all 50 proven tools bind to regional Cloud Tasks and Cloud Run Jobs handoff contracts with opaque task bodies, zero hidden job retries, and every live cloud/IAM boundary still fail-closed.',
  ),
  step(
    'canonical-service-identity-verifier',
    'smoke:canonical-service-identity-verifier',
    'A bounded server-owned JWKS snapshot verifies RS256, issuer, audience, service-account principal, subject, issue/expiry time, and token lifetime before producing a non-serializable process identity; live Google key retrieval, IAM, and deployment remain false.',
  ),
  step(
    'canonical-cloud-dispatch-outbox-receivers',
    'smoke:canonical-cloud-dispatch-outbox-receivers',
    'One active package attempt persists one restart-safe opaque outbox record. Exact controller, worker, terminal completion, terminal pre-commit failure, and controller-authenticated accepted-worker timeout contracts bind the accepted principal and attempt. The three currently metered private workloads record a create-only attempt start before execution; a controller-owned package scanner selects expired attempts, finalizes bounded internal cost through immutable lease expiry, and atomically reconciles timeout without automatic retry. Missing, tampered, unsupported, mismatched, changed, and post-commit bindings fail closed without customer commercial authority. Distributed death observation, live cloud calls, and production execution remain false.',
  ),
  step(
    'canonical-multi-source-execution',
    'smoke:canonical-multi-source-final-composition',
    'Three-source execution reaches one baseline plus two directly reference-bound professional color matches, two approved hard-cut boundaries, three exact source-bound voice deliveries, lease, one-use dispatch, private artifacts, QA, reconciliation, ordered color/voice composition, objective continuity at both boundaries, and download evidence.',
  ),
  step(
    'canonical-private-media-streaming-output',
    'smoke:canonical-private-media-streaming-output',
    'Create-only private media persistence accepts and reopens an exact Matroska stream above the legacy 32 MiB whole-buffer ceiling while rejecting replay collisions and checksum poisoning.',
  ),
  step(
    'canonical-private-audio-streaming-output',
    'smoke:canonical-private-audio-streaming-output',
    'Create-only private audio persistence accepts and reopens an exact PCM WAV stream above the legacy 8 MiB whole-buffer ceiling while rejecting replay collisions and checksum poisoning.',
  ),
  step(
    'canonical-professional-color-execution',
    'smoke:canonical-private-color-execution',
    'One exact source-bound professional color plan streams a lossless private Matroska artifact above the legacy 32 MiB whole-buffer ceiling through lease-heartbeated execution, QA, reconciliation, replay, Remotion composition, independent final QA, and private download evidence.',
  ),
  step(
    'bounded-remotion-streaming-output',
    'smoke:offline-remotion-streaming-output',
    'A separate confined runtime, private persistence, byte-range, and streamed-FFprobe proof produces a real UHD Remotion MP4 above the legacy 16 MiB output ceiling; this is not a canonical job-lifecycle claim.',
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
    'signed-in-private-review-regression',
    'smoke:editor-full-stack-private-review',
    'Signed-in project creation, maximum eight-source private upload and probe, exact preferences and Edit Brief, plan revision, one 4K-ceiling approval, immutable handoff, 27-item private work graph, integrity-bound 4K playback, sanitized journey readback, and review acceptance remain connected.',
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
    schemaVersion: 'canonical-private-pipeline-verification-v17',
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
          professionalLongFormObjectBackedPlanningContract: true,
          professionalLongFormApprovedSnapshotBindingContract: true,
          professionalLongFormCanonicalSeedComponentPersistence: true,
          professionalLongFormServerLoadedControllerPersistence: true,
          professionalLongFormChildJobManifestDerivationAndPersistence: true,
          sourceOnlyIntentAuthority: true,
          fourKEstimateDeliveryCeiling: true,
          canonicalBrowserContracts: true,
          canonicalBackendAuthority: true,
          durablePrivatePackageWorkQueue: true,
          durableCompletedJobReplayWithoutExecution: true,
          cooperativeCrossProcessPackageStateLock: true,
          singleHostCrashConsistentPackageQueueOutboxCommit: true,
          singleHostCrashConsistentWorkerCompletionReconciliation: true,
          singleHostCrashConsistentWorkerFailureReconciliation: true,
          singleHostCrashConsistentAcceptedWorkerTimeoutReconciliation: true,
          acceptedWorkerTimeoutFencesLaterAttempt: true,
          durableAcceptedWorkerAttemptStartCostBinding: true,
          controllerOwnedExpiredWorkerTimeoutFinalizer: true,
          databaseNeutralDistributedPackageStateContract: true,
          serverOnlyDistributedPackageStateRpcTransportContract: true,
          automaticTimeoutRetryStarted: false,
          timedOutAttemptInternalProductionCostEvidence: true,
          timedOutAttemptCostEvidenceResolvedFromPrivateStore: true,
          callerSuppliedTimeoutCostHashAccepted: false,
          serverSelectedPackageDeliveryAttempt: true,
          canonicalCloudDispatchHandoffContract: true,
          cryptographicServiceIdentityVerifierCore: true,
          durablePrivateCloudDispatchOutboxReceiverContract: true,
          boundedPrivateMultiSourceExecution: true,
          boundedApprovedHardCutTransitions: true,
          boundedProfessionalVoiceDelivery: true,
          boundedProfessionalColorExecution: true,
          boundedPrivateMediaStreamingOutputAboveLegacyBoundary: true,
          boundedLongRunningLeaseHeartbeat: true,
          boundedPrivateRemotionOutputStreamingAboveLegacyBoundary: true,
          boundedReferenceBoundMultiSourceColorExecution: true,
          boundedThreeSourcePrivateCompositionExecution: true,
          boundedMaximumEightSourcePlanningPublicationCoverage: true,
          activeNamedEditJourneyStates: true,
          versionedToolIdentityEvidence: true,
          ...(full
            ? {
                signedInMaximumEightSourceUploadAndPersistence: true,
                signedInMaximumEightSourcePrivateReviewAccepted: true,
              }
            : {}),
        }
      : {},
    boundaries: {
      localPrivateEvidenceOnly: true,
      providerActivationAuthorized: false,
      liveBillingOrWalletMutationAuthorized: false,
      remoteSupabaseAuthorized: false,
      publicDeliveryAuthorized: false,
      deploymentAuthorized: false,
      distributedPackageQueueOutboxTransactionVerified: false,
      canonicalPackageStateDatabaseFunctionsExecuted: false,
      canonicalPackageStateRpcLiveClientActivated: false,
      professionalLongFormChildPackageQueuePersistenceVerified: false,
      professionalLongFormMediaExecutionVerified: false,
      professionalLongFormObjectStorageVerified: false,
      liveGoogleCloudWorkerCompletionVerified: false,
      externalBetaReady: false,
      paidProductionReady: false,
    },
  }
  process.stdout.write(`\n${JSON.stringify(report, null, 2)}\n`)
}
