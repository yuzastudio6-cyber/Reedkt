# Canonical Professional Long-Form Completed-Attempt Reconciliation — 2026-07-21

Status: `local_private_core_graph_completion_crash_recovery_verified`

## Outcome

The core 255-job professional long-form queue no longer loses a successful
tool result when its worker exits after private artifact/QA/terminal/cost
evidence is committed but before the queue completion write returns.

Every core long-form executor now routes terminal completion through one
shared authority. Before the queue changes, it persists one immutable,
create-only completion proposal bound to the exact approved snapshot, package,
job, authorization, exact attempt start, claim hashes, professional completion,
private evidence references, canonical result, and completed internal-cost
record. The proposal persists no plaintext claim credential.

A server-owned recovery service accepts only workspace and approved snapshot
identity. It selects an incomplete terminal attempt by canonical queue order,
reopens the exact proposal, terminal and referenced JSON evidence, re-hashes
the actual private Matroska/FLAC output for media-producing completions,
reopens the completed attempt-cost record, and completes the original queue
claim without starting another tool attempt. Callers cannot select a job,
attempt, claim, artifact, operation, or cost record.

## Covered Core Executors

The shared completion boundary is used by:

- snapshot-validation root;
- exact source authority;
- Master Timing validation;
- every object-chunk render and paired independent QA job;
- continuous program audio;
- cross-chunk color continuity;
- private master assembly; and
- private master QA.

The separate nine-job customer-delivery package is intentionally not included
in this slice. Its completion lifecycle remains independently verified but
needs a later one-writer reconciliation onto this same proposal authority.

## Fail-Closed Rules

- A proposal can be recorded only while the exact live claim credential,
  authorization, attempt, definition, output, and internal-cost evidence pass.
- Recovery can finish an active or expired exact claim, but cannot substitute a
  different claim hash, delivery attempt, queue definition, result, or evidence
  reference.
- Completed cost without a durable proposal is blocked for operator
  reconciliation; it is never reclassified as a retryable failure.
- Failed cost cannot satisfy completion; completed cost cannot satisfy the
  failed-attempt retry path.
- The terminal record hash, canonical result, operation, attempt, artifact/QA
  references, and cost hash must all agree.
- Media-producing completion recovery requires the exact private object to
  remain present with its committed byte length and SHA-256. Missing or changed
  chunk video, continuous program audio, or assembled master output blocks
  queue completion.
- Queue completion remains immutable and exact replay cannot create another
  event, attempt, tool run, artifact, or cost record.
- The approved snapshot, estimate, reservation, customer price, credits,
  service fee, wallet, and billing state are not mutated.

## Retained Proof

Commit `170ee673a75e7ac375013f6d55ff588bf19b258c` retains 111/111 passing
checks on the actual six-hour, 512-range, 124-chunk, 255-job fixture. The
routine command now selects the two-hour profile; the explicit
`smoke:canonical-professional-long-form-post-approval:release-six-hour` command
re-runs this maximum-duration release stress profile. Both profiles execute a
real later 4K object-chunk render as approved delivery attempt 2,
persists its terminal proposal, then deliberately throws as if the worker
process exited before queue completion. After clearing process state, the
server-owned reconciler:

1. rejects caller-selected recovery fields;
2. reopens the immutable proposal, actual private Matroska output, and all
   exact terminal/cost references;
3. commits the original attempt without the plaintext claim credential;
4. retains the same completed attempt-2 internal cost;
5. leaves zero leased jobs and creates no retry or second render;
6. returns no duplicate work on the next server-owned scan; and
7. lets the ordinary executor reopen the recovered render and execute only its
   still-pending independent QA job.

The frozen six-hour graph remains honestly 8/255 complete, 247 queued, with
nine total delivery attempts and one earlier failed attempt-1 timeout. The
routine profile is honestly 8/127 complete and 119 queued. The completion
recovery adds reliability evidence, not another job or capability claim.

Additional regressions remain green:

- `npm run smoke:canonical-private-package-work-queue`;
- `npm run smoke:canonical-private-package-state-transaction`;
- server TypeScript and focused lint; and
- exact queue/completion immutability and cloud-dispatch transaction proofs.

## Readiness Boundary

Verified only for private, single-host retained evidence:

- create-only completion proposal persistence and restart readback;
- successful post-terminal process-crash recovery without rerun;
- exact completed internal production cost retention; and
- core-graph queue continuation after reconciliation.

Still false:

- Postgres-backed atomic proposal/queue commit and multi-replica ownership;
- deployed worker death detection, quiescence, and duplicate-process fencing;
- GCS private-object revalidation and Cloud Run worker recovery;
- customer-delivery adoption of this exact proposal authority;
- execution of the remaining 119 routine jobs or 247 six-hour release jobs;
- provider, billing, deployment, public delivery, product, external-beta, or
  production readiness.
