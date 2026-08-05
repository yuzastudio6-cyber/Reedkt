# Post-CAP-20 Authenticated Multi-Owner Resume

Milestone: `POST-CAP-20-AUTHENTICATED-MULTI-OWNER-RESUME`

Status: `passed_source_fixture`

## Outcome

The standalone Caption specialist harness can now exercise the strict
two-owner `resolve_subject_occluded_typography` path rather than stopping after
injecting a bare artifact reference. The source fixture supplies the exact
Caption-owned Visual Intelligence and Track All request payloads, closed
backend-owned authenticated evidence-record wire shapes, and exact projected
artifact references. Caption admits Visual Intelligence first, promotes that
evidence as a canonical input, admits Track All second, and completes the job.

The ordinary generic harness path is unchanged: bare references still fail
closed and cannot impersonate authenticated owner evidence.

## Files changed

- `server/captions-specialist/captions-specialist-runtime.ts`
- `server/internal-testing/captions-specialist/captions-specialist-harness.ts`
- `server/internal-testing/captions-specialist-authenticated-owner-fixtures.ts`
- `server/smoke/captions-specialist-canonical-resume-read-smoke.ts`
- this report

## Contracts changed

No public wire identity changed. The harness gained an internal-only support
resolver seam. The Caption runtime gained exact reread support for a prior
canonical Visual Intelligence or Track All evidence record when its projected
artifact has been promoted into the next call's canonical inputs.

Promoted evidence is accepted only when the record is closed and digest-valid,
the scene scope matches, the evidence mode is authenticated, and the promoted
artifact ID, version, digest, producer, privacy flags, and canonical-input state
match exactly. A promoted reference without its canonical reread is not enough.

## Existing owners reused

- Visual Intelligence remains the visual-evidence owner.
- Track All and SAM 3.1 remain the mask/tracking runtime owners.
- The canonical backend resume ledger remains the persistence and sequential
  resume owner.
- Caption remains only the bounded consumer and planning owner.

## Duplicate owners avoided

No provider caller, GPU runner, tracker, mask writer, persistence repository,
dispatcher, final-QA owner, billing owner, or production route was added.

## Tests

- strict canonical two-owner resume: passed, 27 assertions;
- generic reference-only multi-support resume: passed and remained blocked;
- post-CAP-20 integration routing: passed, 29 assertions;
- Visual Intelligence spatial adapter: passed, 33 assertions;
- Track All canonical evidence read: passed, 13 assertions;
- CAP-01 harness regression: passed, 49 assertions;
- full server typecheck: passed with the repository compiler heap;
- full lint: passed;
- full build: passed, 2,954 modules.

## Media inspected

No media was generated. This milestone uses source-only closed fixtures and
does not relabel them as a live Gemini, SAM 3.1, GPU, or persisted backend run.
No new direct raster inspection was required.

## Known limitations and scoped blockers

This closes the Caption-owned internal harness/resume behavior gap. It does not
close the external evidence gates: a real end-to-end run still needs actual
persisted owner records, canonical backend work execution, complete-time
qualified visual review, and independent final-QA/private-review reread.

## Next milestone

Recompute the current integration/qualification truth record without mutating
the frozen CAP-20 audit, then continue closing any remaining Caption-owned
consumer or release-projection gaps while shared owners remain external.
