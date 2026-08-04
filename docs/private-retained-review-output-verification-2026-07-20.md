# Private Retained Review Output Verification — 2026-07-20

## Verdict

`PRIVATE_RETAINED_REVIEW_OUTPUT_CREATE_ONLY_MODE_INTEGRITY_REVIEW_GATE_ACCEPTED`

The real-video internal-testing editor now publishes future retained review
runs through one bounded local privacy boundary instead of deleting and
replacing one fixed directory.

This is a single-host internal-testing result. It is not canonical package
execution evidence, deployed private storage, production readiness, public
delivery, or a claim that the retained legacy edit already passes this gate.

## Frozen Contract

`server/internal-testing/private-retained-review-output.ts` provides:

- create-only acquisition of one exact output directory and its device/inode
  identity;
- a unique default run directory under
  `internal-testing-reeditpro-final-runs/`, preserving every earlier review;
- create-only `0600` JSON plan, timeline, manifest, and QA records;
- bounded recursive inspection with directory/file/depth/total-byte ceilings;
- no-follow directory and file opens;
- symbolic-link, special-file, hard-link, traversal, identity-substitution, and
  concurrent metadata/content-change refusal;
- `0700` retained directories and `0600` retained files, including outputs
  initially created by media subprocesses with broader modes;
- streaming SHA-256 verification of the final MP4 without whole-file buffering;
- exact final artifact path, byte length, checksum, and source-of-truth
  reconciliation across the artifact manifest and QA report;
- exact approved-snapshot and credit-reservation lineage across the approved
  plan and timeline;
- an explicit `userCreativeReviewRequired = true` and
  `productReadyClaim = false` disposition; and
- a read-only inspector that can classify legacy output without chmod, create,
  replace, remove, or repair behavior.

`server/cli/internal-testing-real-video-whole-edit.ts` now consumes that
boundary. It no longer recursively removes `outputRoot`. A colliding explicitly
configured output path fails closed, while the default produces a new unique
attempt. A successful run is not reported as private review-ready until the
full mode, integrity, lineage, and review-disposition inspection passes.

## Retained Adversarial Proof

Run:

```bash
npm run smoke:private-retained-review-output
```

The smoke proves:

- read-only classification of an otherwise valid `0755`/`0644` fixture as
  `privacy_permissions_blocked` without changing its modes;
- successful hardening and readback as `private_retained_review_verified`;
- exact final-video SHA-256 and size reconciliation;
- create-only collision refusal with prior bytes preserved;
- post-publication video tamper rejection;
- symlink refusal with the external target content and mode unchanged;
- missing-evidence refusal;
- output-root identity-substitution refusal; and
- static wiring of the real whole-edit CLI to the new boundary with destructive
  fixed-output replacement absent.

No provider request, credential payload read, Google Cloud mutation, Supabase
mutation, customer credit/billing mutation, render, or user Documents write is
performed by this smoke.

## Existing Real Edit — Honest Read-Only Result

The already-retained real edit remains available for owner creative review at:

`/Users/macuser/Documents/test video/ReEditPro final edits/internal-testing-reeditpro-final/internal-testing-reeditpro-final.mp4`

The new read-only inspector verified:

- 39,935,705 bytes;
- SHA-256
  `2e722e2bcca326cbd6ecf2a39b794bb1ceece4a8189841ded07f30a1156b1bc1`;
- artifact-manifest integrity;
- approved-plan/timeline lineage;
- technical QA complete with user creative review still required; and
- no product-ready or public-delivery authority.

Its result is `privacy_permissions_blocked`, because the retained root and
caption-overlay directory are `0755` and retained files are `0644`. The
inspector did not change the root/video mode, inode, size, mtime, or video
checksum. This backend task is not authorized to repair or regenerate files in
the user Documents directory, so it does not call that legacy artifact
host-private.

## Remaining Gates

Still blocked or false:

- a newly regenerated real-video edit through this hardened publication path;
- owner creative review and revision acceptance;
- canonical approved-package/queue/lease/one-use worker lineage for that exact
  retained edit;
- durable distributed watch/review state and cross-instance recovery;
- canonical Supabase/Auth/RLS/Storage persistence;
- private GCS generation-bound object and IAM evidence;
- deployed Gmail notification/delivery;
- provider activation, production rendering, billing, customer charging,
  deployment, and public delivery; and
- full signed-in website acceptance with the exact retained artifact.

No SQL, migration, package-lock, secret, local credential configuration,
provider call, cloud mutation, billing action, deployment, or push is included.
