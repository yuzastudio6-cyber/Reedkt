# Phase 39C-Q-SO3 VLM Decomposed QA Policy

SO3 decomposes VLM QA before the original generated fixtures run:

- P0 verifies generated image transport and hashes.
- P1 captures freeform traces as diagnostic-only evidence.
- P2 scores labels-only structured output.
- P3 scores coarse-region structured output with `top`, `bottom`, `left`, `right`, `center`, `lower_third`, and `upper_third`.
- P4 checks safe-zone decisions and blocks `unknown`.
- P5 composes the canonical decision only from P2, P3, and P4.

Pass thresholds are intentionally simple: canary label recall >= `0.80`, canary coarse-region accuracy >= `0.80`, original generated fixture label recall >= `0.60`, original generated fixture coarse-region accuracy >= `0.60`, no unknown safe-zone decisions, and manual-review behavior for the ambiguous fixture.

Run `phase39cq-so3-20260601T154510` did not pass this policy. No candidate reached the threshold, so the original generated fixtures were intentionally not run.
