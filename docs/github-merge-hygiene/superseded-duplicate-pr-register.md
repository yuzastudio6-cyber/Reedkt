# Superseded And Duplicate PR Register

Snapshot time: `2026-06-12T20:27:09Z`

This register proposes cleanup decisions. It does not close, retarget, or merge anything.

| PR | Current State | Proposed Disposition | Reason |
| --- | --- | --- | --- |
| #323 | open draft | candidate superseded | Earlier provider dry-run fix appears overtaken by #322 auth repair, #330 timeout calibration, and #331 full synthetic dry-run |
| #326 | open draft | candidate superseded | Secret setup verification appears overtaken by later Secret Manager evidence in #322/#330/#331 |
| #329 | open draft | candidate superseded | DashScope rerun appears overtaken by #322 repair and #331 full run |
| #332 | open draft | candidate superseded | Plan snapshot source mismatch appears overtaken by #334 PLAN-SNAPSHOT-1 |
| #333 | open draft | defer or supersede | MODEL-DRYRUN-2 is future work unless promoted after #331 lands |
| #335 | open draft | candidate superseded | Readiness fix appears overtaken by #334 |
| #336 | open draft | defer or supersede | MODEL-DRYRUN-2A guardrail work is separate future work unless promoted |
| #337 | open ready | needs human review | Parallel plan snapshot dry-run validation is non-draft and mergeable, but its relationship to #334/#343 must be reviewed |
| #338 | open draft | candidate superseded | Runtime unlock repo audit appears overtaken by #340 and/or merged alternate chain |
| #339 | open draft | candidate superseded | PLAN-SNAPSHOT-0 appears overtaken by #334 PLAN-SNAPSHOT-1 |
| #344 | open draft | candidate superseded | WORKER-0 alternate appears overtaken by #340 and/or merged alternate chain |
| #345 | open draft | candidate superseded | WORKER-1 alternate appears overtaken by #343 and/or merged alternate chain |
| #341 | merged | historical reference | Merged alternate worker repo audit, compare before closing related drafts |
| #342 | merged | historical reference | Merged alternate worker dry-run approval, compare before closing related drafts |
| #346 | merged | historical reference | Merged alternate worker no-op dry-run execution, compare before closing related drafts |

## Cleanup Rule

Only close or supersede a PR after a human confirms that its evidence is either included in the accepted chain or intentionally deferred. Draft status alone is not enough to close a PR.
