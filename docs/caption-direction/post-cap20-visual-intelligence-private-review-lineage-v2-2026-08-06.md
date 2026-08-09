# POST-CAP-20 Visual Intelligence private-review lineage V2

Milestone: `POST-CAP-20-VISUAL-INTELLIGENCE-PRIVATE-REVIEW-LINEAGE-V2`

Status: source-complete; no provider, media, review, billing, public-delivery,
or production runtime executed by this milestone

## Outcome

The active provider-neutral Visual Intelligence result now remains exact from
its canonical result repository through Caption private review and terminal
qualification. It is no longer projected downstream under the retired Qwen
evidence identity.

The frozen private-review projection V1 remains readable for historical Qwen
records. Active `visual_intelligence.inspect_edit` results use the additive
`canonical-caption-private-review-evidence-projection-v2`, whose source lineage
contains:

- owner: `visual_intelligence`;
- exact result ID;
- version `canonical-caption-postrender-visual-intelligence-result-v1`; and
- the exact result digest, normalized only from `sha256:<hex>` to the shared
  domain-ref `<hex>` representation.

The parser verifies a closed tree, recomputes the projection digest, and then
requires the active owner and active result version semantically. A
digest-valid record that substitutes the historical Qwen evidence version is
rejected. Terminal qualification and the canonical qualification-run evidence
reader use the same version-aware projection helper, so neither path can
silently manufacture a Qwen ref from a Visual Intelligence result.

## Files changed

- `src/types/canonical-caption-private-review-evidence-projection.ts`
- `src/types/canonical-caption-terminal-evidence-assembly.ts`
- `src/types/canonical-caption-terminal-qualification.ts`
- `server/services/canonical-caption-private-review-evidence-service.ts`
- `server/services/canonical-caption-qualification-run-evidence-reader.ts`
- `server/services/canonical-caption-terminal-evidence-assembly-service.ts`
- `server/services/canonical-caption-terminal-qualification-service.ts`
- `server/captions-specialist/caption-terminal-qualification.ts`
- `server/captions-specialist/caption-terminal-qualification-v2.ts`
- `server/captions-specialist/caption-terminal-qualification-v3.ts`
- focused regression fixtures and this report

## Contracts added or changed

- Added `canonical-caption-private-review-evidence-projection-v2`.
- Preserved `canonical-caption-private-review-evidence-projection-v1`
  unchanged as the historical compatibility lane.
- Widened the active qualification-run reader and terminal projection helpers
  to read the explicit V1/V2 union. The older
  `canonical-caption-terminal-evidence-bundle-v1` lane remains V1-only and
  explicitly rejects a V2 private-review projection, so no existing persisted
  terminal-bundle identity was silently changed.

## Existing owners reused

- Visual Intelligence remains the active semantic visual-review owner.
- Deterministic complete-time technical QA remains separate.
- Canonical private review remains the independent review owner.
- Caption remains a read/project/qualification consumer and gains no provider,
  review-decision, final-QA, repair, asset, billing, delivery, or production
  authority.

## Duplicate owners avoided

No Caption Qwen dispatcher, model runtime, review service, final-QA service, or
second terminal evidence owner was added. The historical Qwen lane is
read-only compatibility evidence; it is not a fallback for new work.

## Tests

Focused coverage verifies:

- active Visual Intelligence result to private-review V2 identity: 30 checks;
- historical authenticated-read/private-review V1 compatibility: 24 checks;
- terminal projection V1/V2 lineage and relabel refusal: 39 checks;
- canonical V1 terminal bundle refuses a V2 projection instead of silently
  widening its wire contract: 18 checks;
- terminal V3 owner-set compatibility: 12 checks;
- complete Caption source-integration aggregate: 42 suites passed;
- server typecheck with the repository's required expanded Node heap;
- full repository lint;
- production build: 2,969 modules transformed; and
- `git diff --check`, with `package-lock.json` unchanged.

The milestone report does not claim live Gemini inference, a completed
canonical private review, terminal Caption qualification, or professional
appearance. Those remain dependent on exact real owner evidence for one common
approved run.

## Media inspected

None. This milestone changes evidence lineage only and starts no media runtime.

## Visible defects and repairs

No new visual claim was made. The source defect was a false version label in
downstream evidence. It was repaired with an additive versioned projection and
strict semantic validation.

## Known limitations and scoped blockers

The current integration truth remains 0/41 terminally qualified jobs and 0/9
terminal gates complete. A real approved run still needs the actual canonical
Visual Intelligence result, deterministic QA, independent private review, and
the other shared-owner evidence before terminal qualification may be created.

## Next milestone

Continue the remaining internal end-to-end owner evidence and terminal run
integration without waiting for public SaaS production readiness.
