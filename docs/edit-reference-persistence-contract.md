# Edit Reference Persistence Contract

Status: `gate_7_backend_local_contract_complete`

This contract defines one canonical persistence architecture for Edit Reference. Gate 1 implements its backend-local durable lane. Production database persistence remains fail-closed until the canonical Supabase chain, RLS, tenancy, and transaction evidence pass.

## Required Records

- `EditReference`
- `PreferenceStudySession`
- `PreferenceStudyMessage`
- `PreferenceEvidence`
- `PreferenceAsset`
- `PreferenceSkillRun`
- `PreferenceDNAVersion`
- `PreferenceDNAQAResult`
- `PreferenceApplication`
- `PreferenceUsageLog`

Gate 1 fully persists references, study sessions, and study messages. Gate 2 adds evidence, assets, and skill runs. Gate 3 adds immutable Preference DNA candidates. Gate 4 adds exact-version QA results and approval snapshots. Gate 5 adds immutable target-context adaptation records with an explicit not-connected boundary. Gate 6 adds the exact mock Project Edit Session receipt, deterministic downstream context, and connected lifecycle while reusing the existing mock Project Edit Session and Edit Brief repositories. Gate 7 closes replacement/removal, immutable lifecycle history, and downstream invalidation/replan behavior. Production-database authority remains fail-closed.

## Scope And Identity

Every record is scoped through:

```text
authenticated user
→ workspace
→ Edit Reference
→ study / evidence / DNA / application child
```

Requirements:

- Stable IDs, never display-name identity.
- Workspace/user scope cannot be caller-swapped after authorization.
- Parent/child IDs must agree with the same aggregate scope.
- Target applications additionally bind project and edit-session identity.
- Browser DTOs omit owner internals, storage paths, signed URLs, secrets, raw provider payloads, and raw frame bytes.

## Repository Layers

```text
public types
→ repository interface
→ private backend-local durable repository (Gate 1)
→ production repository seam (disabled)
→ domain service
→ authenticated backend routes
→ browser-safe API client
→ browser-safe UI adapter
→ React UI
```

React must not import `server/` or backend-only runtime code. Browser localStorage may hold transient UI preferences or drafts only; it is not authority for Edit References, studies, messages, evidence, DNA, QA, applications, or usage.

## Adapted Existing Pattern

The strongest read-only reference implementation is `server/services/private-preference-intelligence-store.ts` plus `server/security/private-local-persistence.ts`. Gate 1 should adapt these properties:

- one workspace/user-scoped aggregate;
- private directory/file modes;
- root confinement and traversal/symlink rejection;
- atomic same-directory replacement;
- checksum validation;
- process serialization for one local host;
- bounded aggregate size;
- bounded idempotency/audit records;
- exact response snapshots for safe replay;
- parse/validate on every read;
- fail-closed production seam.

Do not copy its legacy names or bypass canonical public contracts. The target's existing MockDatabase Preference Video DNA repository becomes fixture/compatibility support, not another durable source of truth.

## Backend-Local Aggregate

Recommended record envelope:

```text
recordVersion
source
ownerUserId
workspaceId
scopeHash
revision
references[]
studySessions[]
studyMessages[]
evidence[]
assets[]
skillRuns[]
dnaVersions[]
dnaQaResults[]
applications[]
usageLogs[]
idempotencyRecords[]
auditEvents[]
createdAt
updatedAt
checksumSha256
```

Private files use project-configured local storage outside browser assets. Store a server-owned relative key in logs, never an authoritative public URL.

## Gate 1 Study Lifecycle

Allowed states:

- `draft`
- `collecting_evidence`
- `ready_to_study`
- `studying`
- `needs_clarification`
- `evidence_ready`
- `dna_ready`
- `qa_blocked`
- `needs_user_review`
- `approved`
- `applied`
- `archived`
- `failed`

Gate 1 permits only transitions it can truthfully support, including:

```text
draft -> collecting_evidence | archived
collecting_evidence -> ready_to_study | needs_clarification | archived
ready_to_study -> collecting_evidence | needs_clarification | archived
needs_clarification -> collecting_evidence | ready_to_study | archived
```

Gate 2 expands the server-owned path for authenticated evidence mutations and deterministic study orchestration:

```text
collecting_evidence | needs_clarification | evidence_ready | needs_user_review
  -> ready_to_study (new or corrected evidence)

ready_to_study
  -> evidence_ready | needs_clarification | needs_user_review (study orchestration)
```

Gate 2 does not transition to `dna_ready`, `qa_blocked`, `approved`, `applied`, or production states. It records synchronous skill runs and a final evidence status atomically; it does not claim a queued worker or live media/model run.

Gate 3 adds one server-owned transition:

```text
evidence_ready
  -> dna_ready (append review-required DNA version)
```

The mutation freezes exact evidence revisions and digests, appends mandatory do-not-copy rules, supersedes earlier non-approved candidates, updates reference/study DNA status, and writes chat/usage/audit records atomically. It does not transition to `qa_blocked`, `approved`, `applied`, or any production state.

Gate 4 adds two server-owned transitions:

```text
dna_ready
  -> qa_blocked | needs_user_review (append exact-version QA result)

needs_user_review
  -> approved (approve the exact non-blocked QA-reviewed DNA version)
```

The QA mutation binds one immutable result to the exact DNA content and evidence digests. Blocking checks cannot be overridden. A non-blocking review result requires explicit acknowledgement. Approval writes an immutable approval snapshot, retains prior version/QA/approval history, and starts no application or production action.

Gate 5 appends one target application without changing the approved study lifecycle:

```text
approved DNA + exact target context
  -> prepared PreferenceApplication (target integration remains not_connected)
```

The mutation binds the exact reference, study, DNA digest, approval, QA result, target project/edit, target-context digest, adapted decisions, hint groups, precedence policy, and do-not-copy rules. It increments reference revision for compare-and-swap concurrency, but does not mutate the target edit, approved plan, downstream contexts, study approval, or production state.

Gate 6 connects that exact application through a recoverable two-authority backend-local sequence:

```text
prepared PreferenceApplication
  -> stage inactive bounded context in canonical mock Project Edit Session
  -> validate deterministic target-session receipt
  -> connected PreferenceApplication with verified mock target identity
  -> activate the exact bounded context in Project Edit Session and Edit Brief
```

The stage mutation may reset requested/approved mock approval and append session memory, history, and snapshot records. It cannot make the context active. The authenticated Edit Reference mutation validates reference revision, application digest, target identity, confirmed frame, platform, edit level, approval-reset behavior, application/context hashes, and receipt timestamps before storing the exact context and connection receipt atomically. Only that connected server record may be activated downstream. Activation remains planning context only and cannot mutate an approved plan or start production.

Gate 7 adds two exact lifecycle transitions:

```text
connected PreferenceApplication A
  -> invalidate exact A context and reset requested/approved session approval
  -> append prepared PreferenceApplication B at applicationVersion + 1
  -> mark A replaced and link A <-> B immutably

connected PreferenceApplication
  -> invalidate exact context and reset requested/approved session approval
  -> mark application cleared while retaining history
```

Both transitions require a deterministic downstream invalidation receipt that binds the exact workspace, project, edit session, application, context hash, reason, approval-reset result, and all-false production side-effect flags. Replacement additionally requires the exact replaced-reference revision and approved replacement DNA authority. The downstream session, Edit Brief, Marker/Plan/QA consumers stop using the old context and retain only bounded replan-required history. Recovery may restore only a currently connected server application; replaced or cleared context can never reactivate.

## Versioning And Concurrency

- Aggregate revision increments once per committed mutation.
- Reference revision and study revision increment only when their record changes.
- Requests send expected revision for compare-and-swap updates.
- A stale expected revision returns conflict without mutation.
- Created/updated timestamps are server-owned ISO timestamps.
- Study messages are append-only in normal operation.
- Approved DNA versions, QA decisions, and approval snapshots are immutable; later corrections create new versions.
- Gate 3 DNA candidates are content-immutable: evidence revision links, rules, layers, conflicts, confidence, and content digest cannot be edited in place. Only lifecycle status may later change under a named QA/approval transition.
- Adding or correcting evidence immediately marks an active unapproved candidate `superseded`; it never deletes or rewrites that version, and the stale candidate cannot remain actionable.
- Adding or correcting evidence after approval resets active study readiness without rewriting the approved historical artifact. A later approved version marks the prior approved lifecycle status `superseded` while retaining its content, QA result, and approval snapshot.
- Evidence corrections append a new evidence record linked to the exact superseded record; the original remains durable and later orchestration uses only the active successor.
- Application version is monotonic and replacement/clear events are retained.
- One connected application is permitted per exact target project/edit. Gate 7 retains replaced/cleared records, monotonic application versions, exact invalidation receipts, and immutable previous/next links.

## Idempotency

Every mutation requires:

- Request ID for tracing.
- Idempotency key.
- Operation name.
- Authenticated scope.
- Canonical request hash.
- Exact bounded response snapshot or explicit replay-unavailable state.

Rules:

- Same key + same scope/operation/hash returns the exact committed response without repeating the mutation.
- Same key + different hash returns conflict.
- User-message append also uses a stable `clientMessageId`; duplicate message identity cannot create a second record.
- Ambiguous failures fail closed rather than rerunning.
- Idempotency records are bounded and never silently evict an active record.
- Production requires a route-specific database transaction/RPC; backend-local evidence is not distributed production idempotency.

## Validation And Limits

- Safe ID charset and length.
- Reference name 1–120 characters.
- Description at most 2,000 characters.
- Study title 1–160 characters.
- Message content 1–8,000 characters.
- Initial goals come from the approved typed list and are unique/bounded.
- Roles are `user`, `assistant`, or `system`; browser users may append only `user` messages.
- Status is an exact enum and transitions use the server transition map.
- Aggregate, collection, audit, idempotency, and response sizes are bounded.
- Stored records validate scope, version, unique IDs, timestamps, revisions, parent links, side-effect fields, and checksum on every read.

## Deterministic Assistant Messages

Gate 1 may create only deterministic system/assistant setup messages from server-owned templates, such as asking which editing dimensions matter and which reference-specific details must never transfer. Those messages are stored with runtime source `deterministic_setup`, not model/provider provenance.

No provider/model/media/worker/render/credit action is permitted.

## Production Repository Seam

The production seam reports `blocked_by_migration_baseline` and performs no read/write while:

- the raw migration chain is ambiguous;
- canonical tables and composite tenant bindings are unapproved;
- RLS and two-user/two-workspace tests are missing;
- route-specific atomic idempotency transactions are missing;
- live catalog/storage/security evidence is missing.

Gates 1–7 add no SQL migration. Migration baseline/current remain 21.

## Persistence Acceptance

Gate 7 persistence passes only when the earlier gates remain passing and:

- create/list/get/update/reference and create/get/update-study operations read back from a recreated repository/service;
- messages survive process/repository recreation and browser reload;
- identical idempotent append produces one message;
- stale revision and invalid transition fail without data change;
- checksum/scope/path corruption fails closed;
- the storage file/directory modes and atomic replacement are verified;
- no browser localStorage is used as canonical authority;
- no production/Supabase claim is made.
- one QA result is stored per exact DNA version and survives repository recreation;
- QA checks, IDs, links, status derivation, and content digest validate on every read;
- blocked QA cannot be approved, while review-only QA requires explicit acknowledgement;
- approval is bound to the exact version/digest/QA result and survives reload;
- corrected evidence produces a separately reviewed and approved later version without mutating prior history;
- QA and approval emit no provider, media, worker, generation, render, credit, application, or remote-persistence side effect.
- applications bind one exact approved DNA version and one exact target project/edit;
- target context and application content digests validate after repository recreation;
- each DNA rule has one adapted, context-only, or held-back decision;
- do-not-copy rules are always held back and target `avoid` directives outrank DNA;
- the same DNA produces different guidance for voice-first and silent-visual targets;
- application replay cannot duplicate records, and a second active application for the same target fails closed;
- the staged Project Edit Session context remains inactive until the exact backend-local application connects;
- mismatched project/edit/frame/platform/level/digest/context/approval receipts fail without mutation;
- the connected application stores the recomputed bounded context and exact mock receipt and validates them on every read;
- activation writes the same exact context into existing Project Edit Session and Edit Brief persistence without creating a second source of truth;
- server/repository recreation and browser reload restore the exact connected context;
- confirmed Edit Brief markers hold back matching DNA hints while retaining provenance;
- replacement invalidates the exact connected context before creating the monotonic next version and stores immutable bidirectional links;
- removal marks the exact application cleared, retains usage/audit history, and cannot be repeated as a second successful mutation;
- invalidation resets requested/approved Project Edit Session approval when required without rewriting an approved plan;
- Edit Brief and Plan Hint consumers remove the active old context, retain bounded inactive history, and require replan;
- idempotent replay cannot duplicate a replacement, clear, usage event, or application version;
- repository recreation and browser reload never reactivate a replaced or cleared context;
- approved-plan mutation, provider, media, worker, render, credit, and remote-persistence side effects remain false.
