# Caption specialist backend-base reconciliation — 2026-08-05

Milestone: post-CAP-20 canonical backend workflow integration

Status: `merged_and_source_verified`

## Outcome

The Caption specialist branch now contains the current published
`codex/backend-workflow-pipeline-continuation` base at
`98f8fa08bc010188a808bbf93cd555fa0a8d1568` instead of remaining on the older
Track All integration cutoff. The reviewed merge commit is
`b3e5fb5c08544ec9408a953314634ff9279cefe3`.

The reconciliation preserves both sides of the one-writer boundary:

- the backend's L4 Track All task-QA start, evidence-finalization, immutable
  image, funded GPU lifecycle, scale-to-zero, cost, and route owners; and
- Caption's Track All evidence projection, Caption evidence finalization,
  postrender visual-QA read ports, qualification campaign, and terminal
  evidence consumers.

No backend owner was copied or reimplemented inside Caption. No Caption route
became a second GPU, provider, mask, work, asset, cost, QA, delivery, or
production owner.

## Merge review

The merge had 13 focused conflicts. Six Track All owner/runtime/smoke files
were resolved to the newer backend implementation because the backend changes
are strict additive supersets of the older Caption-branch copies. Seven shared
registry/application files were resolved as unions so neither the new backend
ports nor the existing Caption ports were removed.

The combined application exposes:

- the authenticated SAM 3.1 GPU start port;
- the authenticated L4 task-QA start port;
- the backend task-QA evidence finalizer;
- the Caption Track All evidence finalizer;
- Caption postrender visual-QA evidence/read ports; and
- the existing closed Caption private-qualification composition.

`package-lock.json` did not change.

## B-roll qualification refresh

The merge correctly invalidated the generated B-roll qualification receipt.
It was not bypassed or hand-edited. The canonical generator reran all 30
commands and 36 fixtures against the exact merge commit and published a new
generated artifact with:

- tested commit:
  `b3e5fb5c08544ec9408a953314634ff9279cefe3`;
- relevant source tree:
  `15a2ba5e5af254aacaf7ef8600a8343c1d4430fd0bdc99ed4308d7c3959dd8df`;
- dependency authority set:
  `bf23b799a3150286d16bb479cad4be3b191ac07a1ae8a10894ffa5615ed41578`;
- receipt:
  `ecc33062f3523abe8899fd5b0984f46d0276b7d022aa41ffa993cda559ad5872`;
  and
- artifact:
  `fbbfe9b5759d08334c2e0f6b0d50ad05bb005f5daacca1f377e8441a019d578a`.

The result remains `internal_execution_qualified` with zero provider requests,
public artifacts, or production mutations.

## Verification

Passed after conflict resolution:

- server typecheck with the repository compiler heap;
- full lint;
- full build, 2,969 modules;
- frontend/server boundary, 1,135 files;
- current-tree secret scan, 6,709 files;
- reachable-history secret scan, 14,756 blobs;
- canonical Caption private-qualification campaign, 7 checks;
- canonical Caption Track All support, 28 bridge assertions plus its 37-cost
  and 68-task-owner prerequisite checks;
- authenticated Track All start/finalization routes, 80 checks;
- Track All production composition, 55 checks;
- L4 task-QA owner, 20 checks;
- Caption source integration aggregate, 37 suites;
- Sound acceptance; and
- Visual Intelligence/GPU source release, 96 smokes.

The source aggregate still reports 41/41 Caption implementations and 41/41
private-run source paths. It also correctly reports 0/41 terminally qualified
jobs and no persisted multi-run qualification catalog. Integrating a newer
backend source owner does not relabel source evidence as a completed real
Caption run.

## 2026-08-06 follow-up reconciliation

The backend branch advanced by one additive Track All L4 supply-chain repair
commit, `2af9aa916d0f31c8cbf82d8146767fadfed49c8c`. It was merged without conflict
at `c31aba34f3c02741cf717ecf7dfbd31e0cff3b67`. The merge changes only the
existing backend-owned Track All runner, task-QA qualification, and their
smokes; it does not create or move a Caption owner.

The first GitHub rerun also proved that the full server typecheck exceeded
Node's default approximately 4 GB heap after the combined source tree grew.
The two PR workflows that execute the full server typecheck now provide an
8 GB compiler heap. The TypeScript command itself, its project, and its failure
semantics are unchanged. The exact full server typecheck passes locally with
that bound.

Because `.github/workflows/ui-qa.yml` is deliberately part of B-roll's
qualification source fingerprint, that CI correction invalidated the prior
generated evidence. The fail-closed rejection was preserved. The canonical
qualification generator reran all 30 commands and 36 fixtures against the
updated tree and emitted:

- tested commit:
  `c31aba34f3c02741cf717ecf7dfbd31e0cff3b67`;
- relevant source tree:
  `19d460a9f477c2e9100ed49e05ac784c4e9b10fdfb9c7a87f5bd85ddd610f342`;
- dependency authority set:
  `bf23b799a3150286d16bb479cad4be3b191ac07a1ae8a10894ffa5615ed41578`;
- receipt:
  `dba7c090c3f4d66589a58572f2bd724f8c6f74c26842628b6e74e73127fe377f`;
  and
- artifact:
  `1ea85531f1738a394abeaffb9f79b7e6fcdf1dc49f41c948237edd78e5a32ec9`.

The post-refresh canonical Sound acceptance suite passes locally. The result
still claims only `internal_execution_qualified`; provider, customer-credit,
public-delivery, and production authority remain false.

## Media and authority boundary

This reconciliation generated no new Caption media and required no new visual
inspection. It started no live Gemini provider, GPU job, model checkpoint
download, customer-credit mutation, public delivery, or production action.

The next terminal step remains representative approved Caption runs with
actual persisted Transcript, Visual Intelligence, Track All, SoundSync,
B-roll, complete-time visual review, independent final QA, and accepted
private-review evidence assembled through the existing V5 campaign.
