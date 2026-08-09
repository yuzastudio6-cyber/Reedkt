# Post-CAP-20 terminal private qualification operator runbook

Milestone: `POST-CAP-20-TERMINAL-PRIVATE-QUALIFICATION-RUNBOOK`

Status: `source_complete_external_evidence_and_terminal_campaign_pending`

Target: `caption_specialist_private_internal_qualified`

## Purpose

This runbook freezes the remaining internal-only sequence for qualifying the
Caption specialist. It is not a production rollout plan. It does not authorize
provider calls, GPU spend, customer-credit mutation, billing settlement,
public delivery, or production deployment.

The Caption source surface is implemented for all 41 declared job types and
all five shared-owner composition mounts. Terminal qualification nevertheless
remains false until one exact approved-snapshot campaign consumes actual owner
evidence and passes all nine terminal evidence gates together. Source smokes,
fixtures, manifests, earlier private renders, or evidence from another scope
must not be relabelled as that campaign.

## Required order

### 1. Complete the independent transcript audio-truth review

The existing private review package contains all 11 source segments, all 153
source words, two bounded ASR candidate observations, and exact disagreement
lineage. Neither candidate is audio truth. An independent audio-capable
reviewer must listen to the complete source and every segment in order, then
author the existing
`canonical-caption-transcript-correction-reviewer-submission-v1` input.

The completion operator is:

```text
npm run private:caption-transcript-correction-review-completion
```

It requires these operator-supplied environment bindings:

```text
REEDITPRO_CONFIRM_INDEPENDENT_CAPTION_AUDIO_TRUTH_REVIEW=true
REEDITPRO_CAPTION_REVIEW_COMPLETION_SOURCE_TRANSCRIPT_PATH
REEDITPRO_CAPTION_REVIEW_COMPLETION_REJECTED_INSPECTION_PATH
REEDITPRO_CAPTION_REVIEW_COMPLETION_PACKAGE_PATH
REEDITPRO_CAPTION_REVIEW_COMPLETION_REVIEWER_INPUT_PATH
REEDITPRO_CAPTION_REVIEW_COMPLETION_CANDIDATE_PATHS
REEDITPRO_CAPTION_REVIEW_COMPLETION_OUTPUT_ROOT
```

The reviewer input must not be synthesized from ASR consensus. It must bind
every original source word exactly once and directly attest corrected text,
word timing, meaning, negation, proper names, numbers, and claim-sensitive
terms against the audio. The output root must remain outside Git and browser
state. Completion creates and rereads only the reviewer submission,
independent review, correction artifact, canonical-owner request, and bounded
receipt. The canonical transcript owner must still reconcile and reread the
corrected transcript before the terminal campaign.

Focused source evidence:

- review-package smoke: 22 checks passed;
- review-completion smoke: 23 checks passed;
- live independent listening claim: false until a reviewer submits it.

### 2. Complete the independent Sound listening review

The existing canonical Sound result has a 12-second private final mix. A
qualified audio AI or direct private human must listen to that exact artifact
from beginning to end and assess every requested range for voice clarity,
dialogue masking, cue timing/restraint, and unexpected defects.

The completion operator is:

```text
npm run private:canonical-sound-caption-listening-review
```

It requires:

```text
REEDITPRO_CONFIRM_CAPTION_SOUND_COMPLETE_TIME_REVIEW=true
REEDITPRO_CAPTION_SOUND_REVIEW_INSPECTION_PACKAGE_PATH
REEDITPRO_CAPTION_SOUND_REVIEW_PLAYBACK_ARTIFACT_PATH
REEDITPRO_CAPTION_SOUND_REVIEW_REVIEWER_INPUT_PATH
REEDITPRO_CAPTION_SOUND_REVIEW_OUTPUT_ROOT
```

The reviewer input must use
`canonical-sound-caption-listening-reviewer-input-v1`, with reviewer class
`qualified_audio_ai` or `direct_private_human`. If the reviewed bytes are not
the exact final mix, an exact playback-derivation receipt is also required.
Technical metadata, waveform metrics, or an unbound proxy cannot substitute
for listening. The operator persists and twice rereads the established Sound
owner record; Caption receives no execution, asset, mix, QA-approval, billing,
delivery, or production authority.

Focused source evidence:

- Sound owner smoke: 14 checks passed;
- exact private final-mix SHA-256:
  `124146802168048491f4ef7556f34689b5790a62e6570135e8f16ef634e9c182`;
- live complete-time listening claim: false until a reviewer submits it.

### 3. Execute and admit Visual Intelligence owner evidence

Caption must consume a canonical Visual Intelligence result; it must not call
Gemini or construct provider evidence itself. The current backend owner and
Caption adapter are source-ready for an already-qualified owner result. The
shared live owner path is source-complete through its bounded executor and
durable evidence store, but it has not been executed. The repository has the
strict model/SKU qualification contract, immutable read port, account-effective
rate reader, detailed billing-export reconciliation read port, create-only
billing-observation repository, model/SKU qualification finalizer, and
downstream Visual Intelligence lifecycle.
The billing reader is parameterized, bounded,
requires the exact six-SKU set, rejects missing/extra/stale rows, and does not
claim that billing rows alone prove the absence of concurrent same-SKU traffic.
It does not make a provider call and grants no dispatch, customer-pricing,
credit, or production authority. The repository uses a create-only GCS
precondition and exact generation/etag/digest/canonical-JSON reread. The
finalizer requires two implicit-cache request pairs (standard and long), four
exact guarded provider calls, exact usage/audit/isolation rereads, all six SKU
classes, and create-only qualification persistence. It makes no provider or
billing-export call itself. A create-only project/service/model singleton guard
is now mounted in production-runtime v19; every canonical Visual Intelligence
provider call must acquire it, and the isolated qualification mode excludes
ordinary calls. The shared owner now also has a bounded project-wide Cloud
Audit Data Access window reader, a create-only sanitized audit-observation
repository, exact guard-release reread, a two-route registry contract, an
audit-backed isolation-authority finalizer, and a create-only isolation
authority repository. The reader queries the entire Vertex GenerateContent
service/method window with a five-entry detection page, accepts exactly four
request-reference correlation labels in order, rejects pagination or any
extra call, verifies the exact provider principal, and returns no raw prompt,
media locator, request, or response payload. None of those owners makes a
provider call. The shared owner now also has the canonical bounded live
model/SKU executor and one durable create-only GCS store. The executor consumes
an explicit expiring single-use internal-spend admission, rereads the exact
route registry, holds the shared provider guard across exactly four no-retry
standard/long implicit-cache requests, verifies and persists sanitized
context/result evidence, and seals one terminal attempt. The durable store
proves restart-safe admission, registry, context, result, attempt, and terminal
rereads; it accepts and persists no raw prompt corpus. Focused source fixtures
use an in-memory provider port and make no real provider call.

The remaining Visual Intelligence work is actual operator-approved execution
and post-execution reconciliation. A future authorized run must use the
existing executor and durable store, then wait for Cloud Audit and detailed
billing-export ingestion, create the audit/isolation and billing observations,
apply the admitted internal-spend ceiling to actual cost, and run the existing
model/SKU finalizer. It must not be implemented as a Caption service, accept
caller-authored evidence booleans, bypass the canonical provider/cost lifecycle,
or promote the sanitized executor result by itself. The private release
prefixes still contain no live model/SKU qualification, runtime-component
qualification, or runtime release record.

The Visual Intelligence owner must complete its existing isolated provider
qualification and then execute against the exact terminal approved snapshot,
output frame, scene, authorized range, source artifact, and expected Caption
outcomes. The result must be create-only persisted, exact-reread, projected by
the canonical Caption adapter, and injected through the specialist resume
ledger. Fixture reports and source releases are not acceptable substitutes.

No Caption-specific provider dispatcher may be added.

### 4. Execute the bounded SAM 3.1 qualification and Caption Track All result

The canonical Vertex A100 source/checkpoint route is source-qualified and has
one granted A100 80 GB quota in `us-central1`. Starting it is an external-spend
action and requires explicit authorization immediately before launch.

Before any authorized attempt:

1. rerun `npm run audit:visual-intelligence-live-prerequisites`;
2. reread the exact current package, immutable image release, rate authority,
   route bindings, quota, and active-job count;
3. fail closed on expiration or any source/image/package drift;
4. use one new attempt ID and no automatic retry; and
5. use only the canonical
   `start:sam3_1-source-checkpoint-qualification-vertex` and
   `reconcile:sam3_1-source-checkpoint-qualification-vertex` owners.

The last read-only preflight bounded the maximum two-hour compute plus
prorated boot-disk cost at **$11.672325712**. That observation is not standing
authorization and must be refreshed before launch.

A successful generic source/checkpoint qualification is still not the Caption
Track All gate. The exact terminal scene must subsequently obtain an admitted
Track All result with complete requested-range subject masks, temporal and edge
measurements, exact L4 task-QA authority, independent private scene review,
scale-to-zero reconciliation, create-only evidence persistence, and the
canonical Caption Track All projection.

Caption must never directly invoke SAM 3.1 or reinterpret a runtime-release
manifest as scene evidence.

### 5. Freeze one exact terminal campaign

Only after steps 1-4 have actual rereadable owner evidence may the private
specialist harness freeze one campaign binding:

- owner, workspace, project, edit session, plan version, and approved snapshot;
- immutable canonical transcript and corrected-source lineage;
- exact output ID, confirmed frame, FPS, and MasterTiming/StoryTiming;
- scene and authorized frame ranges;
- Caption plan, approval envelope, execution bundle, work graph, manifest,
  estimate/cost, and private-artifact scope;
- Visual Intelligence, Track All, Sound, and B-roll owner results; and
- idempotency and replay identity.

The campaign must reject crossed output, scene, request, owner, artifact,
snapshot, frame, timing, work, estimate, or result lineage. Preterminal evidence
may inform setup but must not be relabelled as terminal evidence.

### 6. Render, inspect, repair, and rerun

The campaign must render the representative supported Caption job surface with
the existing Remotion, libass, and FFmpeg owners. Deterministic technical QA is
necessary but not sufficient.

Required review sequence:

1. exact output and artifact reread;
2. deterministic Caption QA;
3. actual frame/still and complete-time media inspection;
4. shared qualified postrender visual-AI review for every output;
5. smallest-scope N+1 repair for any rejected phrase, placement, mask, motion,
   sound, accessibility, localization, or export defect;
6. rerender and reinspection under a new evidence version; and
7. independent final QA and private-review decision.

Caption-above-visual ordering remains the default. A StoryTiming-bound explicit
information-owner handoff is the only allowed temporary exception. Caption QA
may propose local repairs but cannot approve independent final QA.

### 7. Publish the private internal qualification projection

The final projection may be created only when the first eight evidence gates
pass in the same exact campaign. It must be create-only persisted, exact-reread,
and replay-stable. Only then may the release manifest state:

```text
caption_specialist_private_internal_qualified
```

It must continue to state that the Orchestra, public production deployment,
customer rollout, billing authority, and global 11-skill integration are not
implemented or authorized.

## Current evidence truth

- declared Caption jobs implemented: 41/41;
- declared source paths present: 41/41;
- shared owner composition mounts present: 5/5;
- terminal-qualified jobs in one exact campaign: 0/41;
- terminal evidence gates satisfied together: 0/9;
- source implementation status: complete for the declared Caption boundary;
- private internal qualification status: in progress;
- production status: out of scope.

## Stop conditions

Stop and request explicit authorization only for:

- paid GPU or provider execution;
- secret or IAM mutation not already covered by a reviewed owner;
- destructive compatibility removal;
- billing or customer-credit mutation;
- public delivery or production deployment; or
- a truly unresolved product decision.

Human or qualified-AI review submissions must record what was actually heard
or seen. Never prefill acceptance flags, infer review from hashes, or promote
technical metadata into professional appearance/listening evidence.
