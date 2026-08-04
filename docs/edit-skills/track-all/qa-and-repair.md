# Track All independent QA and repair

## Evidence boundary

Track All output acceptance is derived from strict, content-addressed
measurements. The QA input has no `passed` field and rejects unknown keys.
Target observations, mask metrics, overlap seams, identity associations, and
integration observations bind exact producer operation IDs and evidence
artifact hashes. Track Graph, sample, box, private-mask, camera, planar, and
identity artifacts must share exact tenant, assignment, plan, source, timing,
manifest, and authorized-range lineage.

Every report contains hashed `SkillQaFinding` records with a validator version
and exact evidence hashes. The report schema independently recomputes the
worst finding disposition; a caller cannot rehash a blocking report as a pass.
The generic QA registry remains fail-closed at `needs_review` and cannot
self-attest Track All acceptance.

## Derived validators

- Target QA measures semantic alignment, forbidden-target similarity, and
  approved minimum/maximum target counts.
- Temporal QA derives active-frame gaps, frame-to-frame jumps, and explicit
  cross-shot reset or uncertainty behavior.
- Mask QA derives coverage, background leakage, flicker, edge error, holes,
  fragmentation, motion-blur protection, and dilation evidence.
- Chunk-seam QA compares actual overlap boxes and masks and detects incomplete
  overlap evidence.
- Identity QA compares selected and alternate association scores and treats an
  unmarked likely switch as critical.
- Camera/planar QA derives camera discontinuity/reset validity, reprojection
  error, surface stability, and confidence.
- Integration QA compares exact assignment, plan, source, timing, range,
  visual ownership, modified frames, fixed layer order, private visibility,
  and final graph lineage.
- Privacy QA remains the higher-assurance decoded-pixel validator described in
  `privacy-redaction.md`; it inspects the flattened private preview and fails
  closed.

Warnings may preserve explicit identity uncertainty. Blocking or critical
findings cannot be finalized as accepted output.

## Bounded repair

The repair director chooses a bounded action from the failed QA evidence; the
caller cannot select the action. Implemented derivations cover positive-point,
negative-point, box, local-retrack, overlap, privacy-mask, identity, planar,
and user-selection repair paths.

The first repair is automatic and deterministic or an approved prompt
refinement. It rejects caller-supplied manual authority. A second repair
requires an exact same-tenant manual approval artifact. A third repair is
impossible. Repair evidence must contain the exact failed report hashes and
the exact Track Graph V2 reference. Acceptance after repair requires newly
derived passing/warning QA; privacy-mask repair projects
`accepted_with_conservative_mask`.

Run:

```sh
npm run test:track-all-independent-qa-repair
```

The smoke proves passed and failed derivations, forged measurement rejection,
raw-boolean rejection, report-disposition integrity, nine repair actions,
manual approval for repair two, and rejection of repair three. It performs no
model, GPU, provider, public-artifact, or production action.
