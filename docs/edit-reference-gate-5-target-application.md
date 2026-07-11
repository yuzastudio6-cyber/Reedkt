# Edit Reference Gate 5 — Target Adaptation And Preference Application

Status: `implemented_backend_local`

Gate 5 prepares one exact approved Preference DNA version for one exact target project/edit. It creates durable, target-specific guidance while preserving the boundary that the target edit, approved plan, downstream context, production state, providers, workers, rendering, and credits remain unchanged.

## Outcome

Gate 5 adds:

- `PreferenceApplicationTargetContextSnapshot`
- `PreferenceApplicationAdaptedDecisionRecord`
- `PreferenceApplicationHintGroupRecord`
- expanded immutable `PreferenceApplicationRecord`
- deterministic target-adaptation service
- authenticated create/list routes
- browser-safe API client methods
- real Applied Edits records and responsive review cards
- exact approved-version, idempotency, tenant, persistence, privacy, and target-pair tests

Gate 5 does not connect the prepared application to Project Edit Session, Edit Brief, Marker Context, Marker Chat, Plan Hints, QA, or an approved plan. Gate 6 owns that downstream integration.

## Exact Authority

An application may be prepared only when all of these are true:

1. The requested DNA version belongs to the requested Study.
2. Its stored content digest matches the caller's exact expected digest.
3. The DNA version is approved and has an immutable approval snapshot.
4. Its exact QA result belongs to that version and is not blocked.
5. The caller confirms adapt-not-copy.
6. The target output frame is confirmed.
7. No other active prepared application already owns the exact target project/edit pair.

Display names never replace stable project, edit, reference, study, DNA, QA, or approval identity. Gate 5 records caller-confirmed target identifiers but marks them unverified until Gate 6 resolves them against the canonical Project Edit Session repository.

## Target Context Snapshot

The immutable target context captures:

- exact project and edit identity plus user-facing labels
- source mode and content type
- source summary
- current user instruction
- user-facing edit level
- confirmed aspect ratio
- platform target
- story role
- budget preference
- caption, music, SFX, and source-order directives
- approved constraints

The context receives its own SHA-256 digest. The application digest then binds the exact DNA/approval/QA authority, target snapshot, adaptation decisions, hint groups, copy boundaries, precedence, and summary.

## Precedence

Every decision records one explicit precedence source. The immutable policy is:

```text
safety, platform, tier, confirmed frame, credit/cost policy, and approved constraints
→ current user instruction
→ target source and story context
→ approved Preference DNA
```

Concrete behavior includes:

- DNA `do_not_copy` rules always become `blocked_from_transfer`.
- A direct-copy request in the current target instruction or approved-constraint input fails closed before an application is stored.
- DNA context-only rules remain review context and never become instructions.
- A target `avoid` directive blocks the corresponding caption/music/SFX preference.
- Required target directives shape the adaptation before the reusable preference.
- Source-order preservation overrides a reusable structure preference.
- Normal transferable rules are rewritten for the target source mode, story role, frame, platform, edit level, and budget.

## Target-Pair Proof

The canonical Gate 5 fixture uses the same approved DNA for:

1. a voice-first 16:9 YouTube tutorial; and
2. a silent 9:16 lifestyle montage.

The tutorial receives speech-led pacing, required target-authored captions, preserved instructional order, restrained music, and no decorative SFX. The montage receives visual-action pacing, no speech captions, required target-cleared music, and target-specific tactile sound cues. Both retain the same high-level DNA provenance and universal copy boundaries while producing different target-context and content digests.

## API

```text
GET  /v1/edit-reference-applications?workspaceId=...
POST /v1/edit-reference-studies/:studyId/preference-dna/:dnaVersionId/applications
```

The mutation requires a durable idempotency key and exact expected reference revision. Same key/same payload returns the exact stored response. Same target with another active prepared application fails closed until the later replace/clear workflow is used.

## Persistence And Privacy

The private aggregate validates on every read:

- exact reference/study/DNA/QA/approval links
- one active prepared application per target edit
- monotonic target application versions
- target-context and content digests
- one decision for every DNA rule
- do-not-copy and context-only decision invariants
- hint-group links
- precedence order
- timestamps, enums, bounds, scope, unique IDs, and all false side-effect flags

Browser records do not expose storage paths, signed URLs, credentials, raw frames, provider payloads, or internal runtime configuration. The normal UI shows names, target context, adaptation counts, target-specific guidance, and the honest connection boundary; it does not show hashes or internal record IDs.

## UI And Design Authority

The Gate 5 UI follows:

1. `design.md` and `design-system/`
2. current ReEditPro UI/UX architecture documents
3. UI UX Pro Max as subordinate critique guidance

The Study Chat stays primary. An approved DNA card offers one clear route back to Projects. Applied Edits uses bounded cards, semantic badges, collapsed detail, visible copy-safety boundaries, 44px interactive targets, responsive one-column behavior, and no page-level horizontal overflow.

## No-Production Boundary

Every Gate 5 application stores all of these as `false`:

- target edit mutation
- approved plan mutation
- downstream context write
- provider/model call
- file-byte read or external fetch
- media processing
- worker, generation, or render job
- credit reservation or spend

The application status is `prepared` and target integration is `not_connected`. It must never be described as already changing the edit.

## Verification

Primary evidence:

- `npm run smoke:edit-reference-target-application`
- `npm run smoke:edit-reference-api-client`
- `npm run smoke:edit-reference-ui`
- focused Edit Reference Playwright suite
- prior Gate 1–4 smokes
- frontend boundary, lint, client/server builds, full Chromium suite, scope/secret inspection, and post-gate control-plane audit

Production Supabase persistence remains blocked by the existing migration baseline. Gate 5 adds no migration and makes no remote mutation.
