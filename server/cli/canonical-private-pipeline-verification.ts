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
    'canonical-distributed-media-ingest-contract',
    'smoke:canonical-distributed-media-ingest-state-port',
    'The database-neutral pre-plan technical-ingest contract derives exact upload authority without fabricating a snapshot or reservation, serializes enqueue/claim/lease/checkpoint/terminal/replay semantics, retains attempt-level internal infrastructure cost, and keeps database, cloud dispatch, live GCS bytes, hosted high-ceiling admission, commerce, and production authority false.',
  ),
  step(
    'professional-long-form-object-plan',
    'smoke:professional-long-form-object-plan',
    'A server-owned object-backed plan conserves exact frames across a 30-minute 24-source fixture and a bounded six-hour/512-range capacity fixture, requires chunk QA, continuous program audio, color continuity, one approved 4K estimate, and keeps snapshot wiring, media execution, storage, database, cloud, staging, and production false.',
  ),
  step(
    'offline-media-binary-object-chunk',
    'smoke:offline-media-binary-object-chunk',
    'A fixed server-owned FFmpeg recipe reopens checksum-bound synthetic 4K H.264 MP4 sources, decodes exact approved frame ranges, normalizes frame/color metadata, concatenates approved hard cuts or technical splits, encodes a private VP9 CQ12 Matroska mezzanine, proves byte-deterministic reexecution, and exercises timeline-start plus later nonzero-frame chunks. The same pinned runtime independently re-probes two adjacent VP9 chunks and decodes boundary RGB samples for strict technical-split color continuity; deterministic policy blocks technical mismatches and routes editorial-cut mismatches to review. This remains isolated runtime proof: canonical color-job lease, all-boundary aggregation, attempt cost, reconciliation, cloud, product, and production authority are still false.',
  ),
  step(
    'offline-media-binary-resource-observation',
    'smoke:offline-media-binary-execution',
    'The pinned networkless FFmpeg/FFprobe image captures exact cgroup-v2 CPU and memory counters for each generic media container, strips one nonce-bound terminal marker, aggregates sequential subcontainers into one attempt observation, isolates persisted runtime authority by checkout/release, explicitly closes every private output stream, and fails closed on missing, duplicate, malformed, or non-monotonic evidence. Specialized long-form entrypoints, deployed cloud telemetry, provider cost, customer price, credits, billing, and production remain separate gates.',
  ),
  step(
    'professional-long-form-approved-snapshot-bridge',
    'smoke:professional-long-form-snapshot-bridge',
    'The exact long-form seed, plan, estimate, timing, reservation, controller, and bounded 255-item child graph bind to one approved snapshot while canonical seed/controller persistence, child-job derivation, object storage, media execution, database, cloud, product, and production readiness remain false.',
  ),
  step(
    'canonical-professional-long-form-post-approval',
    'smoke:canonical-professional-long-form-post-approval',
    'A six-hour/512-range 4K seed persists through canonical publication and approval; restart-safe server derivation reopens exact authority, persists a content-addressed 255-child package/placement/queue, and completes eight exact queue jobs: three prerequisite authorities, chunk 1 render/QA, continuous lossless program audio, and a server-selected later chunk 2 render/QA. Before chunk 2 succeeds, one expired started render attempt is selected only by the server, assigned immutable failed internal cost, terminally fenced, retained across restart, replayed exactly after a lost reconciliation response, and retried only under a fresh claim as approved delivery attempt 2. The real attempt-2 render then deliberately exits after one immutable credential-free completion proposal; restart reconciliation reopens exact artifact, terminal, and completed-cost evidence and completes the original claim without rerender, retry, or second cost. One generic fail-closed executor maps every one of the 124 immutable chunk pairs to its exact queue order while callers cannot select chunks. Retained execution proves two representative pairs, including nonzero source-frame trim and a technical split; it does not claim the other 122 pairs completed. The remaining 247 jobs, customer-delivery adoption of the proposal authority, distributed worker-death recovery, live cloud, commerce, product, and production stay blocked.',
  ),
  step(
    'canonical-professional-long-form-cross-chunk-color',
    'smoke:canonical-professional-long-form-cross-chunk-color',
    'A bounded two-chunk canonical graph reopens both independently QA-passed private 4K object chunks, executes strict adjacent-boundary color policy, continuous lossless program audio, private review finalization, and objective review-master QA through all 11 jobs. A separate immutable nine-job customer-delivery package completes its root, both 4K H.264 High encodes, both independent chunk probes, one H.264-stream-copy plus one-time FLAC-to-AAC private MP4 mux, separately leased full decoded-video plus decoded-audio/sync QA, and one exact private-download reconciliation through 9/9 jobs with attempt-level internal cost and restart-safe exact replay. Both synthetic-fixture objective outcomes honestly require review. Acceptance stays blocked until exact hash-chained private watch evidence starts at frame zero, spans all 3,870 frames, satisfies the server-observed 2x elapsed-time ceiling, and binds the immutable review/master; revision needs no watch authority. Actual Express routes prove exact named-edit/snapshot discovery, authenticated review ranges and watch checkpoints, instant-completion refusal, decision replay/conflict handling, accepted private-download rediscovery and ranges, and cross-user denial without returning worker or internal-cost authority. The fixture is deleted after the smoke, and this bounded proof does not mark named-edit UI mounting, the six-hour 255-job graph, distributed durability, cloud, product, or production executed.',
  ),
  step(
    'professional-long-form-customer-delivery-client',
    'smoke:professional-long-form-customer-delivery-client',
    'The frontend-safe client discovers the hidden package identity from exact tenant/project/edit/snapshot authority, strictly validates bounded progress and review receipts, reads authenticated review and accepted-download ranges with integrity headers, records exact watch checkpoints and explicit accept or revision decisions with deterministic idempotency, blocks acceptance until refreshed durable watch authority is complete, rejects stale, foreign, or over-broad responses, and never creates a second export estimate, charge, or credit prompt.',
  ),
  step(
    'professional-long-form-customer-delivery-media-source',
    'smoke:professional-long-form-customer-delivery-media-source',
    'A bounded MediaSource adapter consumes only exact authenticated no-store review ranges, appends at most 8 MiB at a time, applies rolling-buffer backpressure and eviction, rejects authority/codec/range discontinuity, and records seek-aware plausible client coverage without treating it as durable acceptance authority.',
  ),
  step(
    'professional-long-form-customer-delivery-watch-evidence',
    'smoke:professional-long-form-customer-delivery-watch-evidence',
    'A private/local tenant-scoped watch authority starts at frame zero, hash-chains monotonic merged coverage, enforces a server-observed maximum 2x elapsed-time ceiling, rejects instant completion and stale predecessors, survives restart and an interrupted latest-pointer write, replays exact idempotency, denies cross-user disclosure, detects tampering, and is required by exact acceptance while distributed production durability remains false.',
  ),
  step(
    'professional-long-form-customer-delivery-media-source-browser',
    'qa:professional-long-form-customer-delivery-media-source',
    'Actual Chromium uses the real frontend delivery client with bearer and exact workspace/snapshot/review/master authority, saves the frame-zero watch checkpoint, decodes and plays one real fragmented H.264 High/AAC MP4 at 2x from multiple exact 64 KiB responses without a whole-file browser Blob, then submits exact contiguous full-program coverage through the same frontend watch client. The temporary fixture is deleted and no visible named-edit UI or distributed server durability is claimed.',
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
    'Every canonical journey stage is strictly parsed and recovered without private execution material; accepted review recovers exact customer-delivery discovery through the same client while an absent package stays a scoped blocked substate.',
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
    'private-worker-resource-usage-cost-evidence',
    'smoke:private-worker-resource-usage-cost-evidence',
    'All 72 registered tool operations plus the four admitted provider operations expose exact CPU/memory resource evidence contracts, all GPU-capable operations require GPU milliseconds, and completed/failed/unknown private attempts retain create-only internal infrastructure-cost evidence while deployed observers, official cloud rates, provider calls, commerce, and production remain blocked.',
  ),
  step(
    'canonical-embedded-worker-resource-lifecycle',
    'smoke:canonical-private-tool-dispatch',
    'All 50 retained canonical tool/job-adapter identities revalidate under immutable snapshot, package, queue, lease, one-use dispatch, private artifact, QA, reconciliation, and replay authority. The 28 structured Node/Python operations plus generic FFmpeg and FFprobe persist exact embedded CPU/memory and internal infrastructure-cost evidence for the same attempt; specialized runners, deployed observers, official cloud rates, providers, commerce, and production remain blocked.',
  ),
  step(
    'canonical-provider-attempt-consumer-receipt',
    'smoke:canonical-private-provider-work-lifecycle',
    'The exact approved package, queue/lease, one-use provider dispatch, terminal cost, observed worker-resource evidence, and private output readback produce a compact source-verified non-promotable receipt. Exact consumer context, timing, lease aliases, safe terminal outcome, component cost/rate-card provenance, private-object identity, and closed security semantics map without caller invention. The output-set envelope remains current-V1 cardinality with multi-output admission false, and Lyria V1 request-count history remains generation-submission semantics. Provider qualification and transport remain blocked.',
  ),
  step(
    'canonical-multi-output-provider-attempt-consumer-receipt',
    'smoke:canonical-private-multi-output-provider-work-lifecycle',
    'The exact Storytelling Speech operation reuses the canonical approved-package queue, claim/lease, one-use provider dispatch, private candidate store, internal-cost stores, and compact receipt. One injected non-provider attempt retains ordered MP3 and private alignment JSON outputs with checksum readback, exact replay, observed worker-resource cost, failed-attempt cost, and closed credential/request-body/provider/commercial boundaries. Provider transport, immutable provider revision, production rate authority, zero-retention entitlement, cloud persistence, billing, and production promotion remain blocked.',
  ),
  step(
    'canonical-synchronized-foley-provider-attempt-consumer-receipt',
    'smoke:canonical-private-synchronized-foley-provider-lifecycle',
    'The exact synchronized-Foley provider operation reuses the canonical approved-package queue, claim/lease, one-use provider dispatch, private candidate store, component internal-cost stores, and compact receipt. One injected non-provider attempt retains a create-only private MP4 with checksum readback, exact replay, observed worker-resource cost, failed-attempt cost, unknown-outcome reconciliation, and the typed 17-request asynchronous lifecycle ceiling while distinguishing one paid generation submission from continuation requests. Provider transport, secret reads, immutable provider revision, production rate authority, cloud persistence, billing, downstream normalization execution, and production promotion remain blocked.',
  ),
  step(
    'canonical-visual-calibration-provider-attempt-consumer-receipt',
    'smoke:canonical-private-visual-calibration-provider-lifecycle',
    'One exact Gemini Omni Flash visual-calibration operation reuses the canonical approved-package queue, claim/lease, one-use provider dispatch, private candidate store, provider and worker internal-cost stores, and compact source-verified receipt. The injected non-provider proof binds the exact Motion production, style, calibration plan/scenario, reference, first/last frame, and continuity authority to one create-only private MP4, exact replay, failed-attempt cost, unknown-outcome reconciliation, and a typed 15-request primary-only lifecycle. Preview-model immutability, provider account/rate/transport qualification, secret reads, cloud persistence, selection, billing, and production promotion remain blocked.',
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
    schemaVersion: 'canonical-private-pipeline-verification-v36',
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
          databaseNeutralPrePlanDistributedMediaIngestContract: true,
          distributedMediaIngestApprovedPackageAuthorityFabricated: false,
          professionalLongFormObjectBackedPlanningContract: true,
          professionalLongFormApprovedSnapshotBindingContract: true,
          professionalLongFormCanonicalSeedComponentPersistence: true,
          professionalLongFormServerLoadedControllerPersistence: true,
          professionalLongFormChildJobManifestDerivationAndPersistence: true,
          professionalLongFormChildPackagePersistence: true,
          professionalLongFormChildPlacementPersistence: true,
          professionalLongFormChildPackageQueuePersistence: true,
          professionalLongFormFirstChildAuthorizationPersistence: true,
          professionalLongFormFirstChildLeaseAndOneUseExecution: true,
          professionalLongFormFirstChildAttemptInternalCostEvidence: true,
          professionalLongFormFirstChildArtifactQaReconciliationReplay: true,
          professionalLongFormFirstChildDownstreamDependencyEvidence: true,
          professionalLongFormSourceAuthorityAuthorizationPersistence: true,
          professionalLongFormSourceAuthorityLeaseAndOneUseExecution: true,
          professionalLongFormSourceManifestRangeCleanupFrameValidation: true,
          professionalLongFormSourceAuthorityAttemptInternalCostEvidence: true,
          professionalLongFormSourceAuthorityArtifactQaReconciliationReplay: true,
          professionalLongFormSourceAuthorityDirectDownstreamEvidence: true,
          professionalLongFormMasterTimingAuthorizationPersistence: true,
          professionalLongFormMasterTimingLeaseAndOneUseExecution: true,
          professionalLongFormMasterTimingExactComponentAndFrameValidation: true,
          professionalLongFormMasterTimingApprovalAndEstimateCoverage: true,
          professionalLongFormMasterTimingAttemptInternalCostEvidence: true,
          professionalLongFormMasterTimingArtifactQaReconciliationReplay: true,
          professionalLongFormMasterTimingDirectDownstreamEvidence: true,
          professionalLongFormFirstObjectChunkServerSelected: true,
          professionalLongFormFirstObjectChunkExactSourceStaging: true,
          professionalLongFormFirstObjectChunkFixedFfmpegExecution: true,
          professionalLongFormFirstObjectChunkDeterministicMediaBytes: true,
          professionalLongFormFirstObjectChunkCreateOnlyPrivatePersistence: true,
          professionalLongFormFirstObjectChunkIndependentFfprobeQa: true,
          professionalLongFormFirstObjectChunkAttemptInternalCostEvidence: true,
          professionalLongFormFirstObjectChunkReconciliationAndExactReplay: true,
          professionalLongFormFirstObjectChunkApprovedFourKEstimateReused: true,
          professionalLongFormGenericObjectChunkSeriesExecutorVerified: true,
          professionalLongFormAllChunkOperationBindingsVerified: true,
          professionalLongFormRetainedObjectChunkPairProofCount: 2,
          professionalLongFormTotalObjectChunkPairCount: 124,
          professionalLongFormNonzeroSourceFrameExecutionVerified: true,
          professionalLongFormTechnicalSplitExecutionVerified: true,
          professionalLongFormStartedAttemptTimeoutRecoveryVerified: true,
          professionalLongFormStartedAttemptFailedInternalCostRetained: true,
          professionalLongFormStartedAttemptFailureHistoryRestartReadbackVerified: true,
          professionalLongFormStartedAttemptFailureExactReplayVerified: true,
          professionalLongFormStartedAttemptFreshClaimAttemptTwoVerified: true,
          professionalLongFormStartedAttemptAutomaticRetryStarted: false,
          professionalLongFormStartedAttemptCommercialAuthorityIncluded: false,
          professionalLongFormCoreCompletionProposalCreateOnlyPersistence: true,
          professionalLongFormCompletedAttemptRestartReconciliationVerified: true,
          professionalLongFormCompletedAttemptSecondToolExecutionStarted: false,
          professionalLongFormCompletedAttemptSecondInternalCostCreated: false,
          professionalLongFormCompletedAttemptPlaintextClaimCredentialPersisted: false,
          professionalLongFormCompletedAttemptCommercialAuthorityIncluded: false,
          professionalLongFormCompletedAttemptDistributedDatabaseVerified: false,
          offlineCrossChunkColorBoundaryRuntimeVerified: true,
          professionalLongFormBoundedCanonicalCrossChunkColorContinuityVerified: true,
          professionalLongFormBoundedCanonicalCrossChunkColorDependencyGateVerified: true,
          professionalLongFormBoundedCanonicalCrossChunkColorLeaseAndOneUseExecution: true,
          professionalLongFormBoundedCanonicalCrossChunkColorAttemptInternalCostEvidence: true,
          professionalLongFormBoundedCanonicalCrossChunkColorReconciliationAndExactReplay: true,
          professionalLongFormBoundedCanonicalCrossChunkColorChunkProofCount: 2,
          professionalLongFormBoundedCanonicalCrossChunkColorBoundaryProofCount: 1,
          professionalLongFormContinuousProgramAudioAuthorizationPersistence: true,
          professionalLongFormContinuousProgramAudioLeaseHeartbeatAndOneUseExecution: true,
          professionalLongFormContinuousProgramAudioExactSourceStaging: true,
          professionalLongFormContinuousProgramAudioLosslessFlacExecution: true,
          professionalLongFormContinuousProgramAudioCreateOnlyPrivatePersistence: true,
          professionalLongFormContinuousProgramAudioIndependentDecodedSampleQa: true,
          professionalLongFormContinuousProgramAudioAttemptInternalCostEvidence: true,
          professionalLongFormContinuousProgramAudioReconciliationAndExactReplay: true,
          professionalLongFormContinuousProgramAudioApprovedFourKEstimateReused: true,
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
          genericMediaBinaryCgroupV2ResourceObservation: true,
          canonicalEmbeddedResourceUsageOperationCount: 31,
          canonicalFfmpegFfprobeAttemptInternalResourceCostEvidence: true,
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
          professionalLongFormCustomerDeliveryBrowserSafeReceipt: true,
          professionalLongFormCustomerDeliveryExactNamedEditDiscoveryTransport: true,
          professionalLongFormCustomerDeliveryCanonicalJourneyClientRecovery: true,
          professionalLongFormCustomerDeliveryPreDecisionRangeTransport: true,
          professionalLongFormCustomerDeliveryExplicitDecisionTransport: true,
          professionalLongFormCustomerDeliveryAcceptedPrivateDownloadTransport: true,
          professionalLongFormCustomerDeliveryBoundedMediaSourceAdapter: true,
          professionalLongFormCustomerDeliveryActualChromiumPlayback: true,
          professionalLongFormCustomerDeliveryClientObservedFullProgramPlayback: true,
          professionalLongFormCustomerDeliveryDurablePrivateLocalWatchEvidence: true,
          professionalLongFormCustomerDeliveryWatchServerElapsedCeiling: true,
          professionalLongFormCustomerDeliveryAcceptanceRequiresExactWatchEvidence: true,
          professionalLongFormCustomerDeliveryBrowserWatchClientHandshake: true,
          professionalLongFormCustomerDeliverySecondExportEstimateCreated: false,
          professionalLongFormCustomerDeliverySecondExportChargeCreated: false,
          canonicalProviderAttemptConsumerReceiptSourceVerified: true,
          canonicalProviderAttemptConsumerReceiptPromotable: false,
          canonicalProviderAttemptConsumerReceiptMotionMappingComplete: true,
          canonicalProviderAttemptConsumerReceiptVerifiedRuntime: false,
          canonicalProviderAttemptConsumerReceiptMultiOutputAdmission: false,
          legacyProviderRequestCountMeansGenerationSubmission: true,
          synchronizedFoleyLifecycleIdentityFrozen: true,
          synchronizedFoleyPrivateInjectedProviderLifecycleVerified: true,
          synchronizedFoleyPrivateMp4CreateOnlyPersistenceVerified: true,
          synchronizedFoleyFailedAttemptInternalCostRetained: true,
          synchronizedFoleyUnknownOutcomeReconciliationVerified: true,
          synchronizedFoleyTypedLifecycleHttpRequestCeiling: 17,
          synchronizedFoleyCanonicalAuthorizationIssuanceAllowed: false,
          canonicalProviderOperationContractCount: 4,
          visualCalibrationLifecycleIdentityFrozen: true,
          visualCalibrationPrivateInjectedProviderLifecycleVerified: true,
          visualCalibrationPrivateMp4CreateOnlyPersistenceVerified: true,
          visualCalibrationFailedAttemptInternalCostRetained: true,
          visualCalibrationUnknownOutcomeReconciliationVerified: true,
          visualCalibrationTypedLifecycleHttpRequestCeiling: 15,
          visualCalibrationPrimaryRouteOnly: true,
          visualCalibrationExactMotionStyleScenarioFrameContinuityBound: true,
          visualCalibrationOfficialPublicRateSnapshotProductionQualified: false,
          visualCalibrationCanonicalAuthorizationIssuanceAllowed: false,
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
      distributedMediaIngestDatabaseTransactionVerified: false,
      distributedMediaIngestCloudDispatchVerified: false,
      distributedMediaIngestLiveGcsWorkerVerified: false,
      hostedLargeMediaAboveInlineCeilingAllowed: false,
      canonicalPackageStateDatabaseFunctionsExecuted: false,
      canonicalPackageStateRpcLiveClientActivated: false,
      specializedLongFormMediaCgroupResourceObservationVerified: false,
      remotionCgroupResourceObservationVerified: true,
      deployedCloudWorkerResourceObservationVerified: false,
      professionalLongFormRemaining247ChildLeasesVerified: false,
      professionalLongFormStartedAttemptDistributedRecoveryVerified: false,
      professionalLongFormStartedAttemptLiveWorkerTerminationVerified: false,
      professionalLongFormAll124ChunkPairsCompleted: false,
      professionalLongFormRemaining122ChunkPairProofsVerified: false,
      professionalLongFormRemainingChildAttemptCostsVerified: false,
      professionalLongFormRemainingChildDispatchVerified: false,
      professionalLongFormCompleteMediaExecutionVerified: false,
      professionalLongFormOther122ChunkRendersVerified: false,
      professionalLongFormOther122IndependentChunkQaVerified: false,
      professionalLongFormRetainedSixHourCrossChunkColorContinuityVerified: false,
      professionalLongFormFinalizationAndFinalQaVerified: false,
      professionalLongFormObjectStorageVerified: false,
      professionalLongFormCustomerDeliveryNamedEditUiMounted: false,
      professionalLongFormCustomerDeliveryDistributedWatchEvidenceVerified: false,
      professionalLongFormCustomerDeliveryRetainedReviewMediaVerified: false,
      liveGoogleCloudWorkerCompletionVerified: false,
      externalBetaReady: false,
      paidProductionReady: false,
    },
  }
  process.stdout.write(`\n${JSON.stringify(report, null, 2)}\n`)
}
