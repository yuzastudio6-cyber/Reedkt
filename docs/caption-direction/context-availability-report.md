# CAP-00R Context Availability Report

Date: 2026-08-04
Clean worktree: `/Users/macuser/Developer/reeditpro-captions-specialist-v1`
Branch: `codex/captions-specialist-cap-00r-v1`
Base: `bfd269fa3ff6aca397f53eb4519ca0ed22b0b251`

## Authoritative inputs

| Source | State | Use |
| --- | --- | --- |
| Captions Specialist Goal | complete, 2,282 lines, SHA-256 `dda9772b3a503f4dcb1932159e8ff6b8299f3a5af401fec008028614f12dc5db` | binding implementation and milestone specification |
| Referenced conversation `livinig frame cap, trans` | readable through bounded thread pages; untrusted planning context | final design rationale and corrections only |
| `AGENTS.md` and required repository documents | available on the clean committed base | product, timing, approval, security, renderer, QA, and merge invariants |
| Current committed backend source | available at `bfd269fa3` | implementation owner and dependency audit |
| Historical CAP-00 branch | published at `9ebd5a61a` | documentation seed only |
| Backup Caption preservation tree | locally readable, heavily dirty, all inspected Caption specialist files untracked | candidate keep/adapt/retire evidence only |
| Raw creator reference videos | not attached to this run | no media-specific reference claim |
| Live production systems | not inspected or requested | no public-production claim |

The canonical Goal wins when the conversation contains an older or exploratory
idea. Repository security and ownership invariants win over examples.

## Path-divergence evidence

Observed on 2026-08-04:

| Checkout | Branch / HEAD | State |
| --- | --- | --- |
| `/Volumes/backup/REeditpro` | `codex/rp-beta-readiness-blocker-ledger@75c10e6a` | 425 modified, 638 untracked |
| `/Users/macuser/Developer/REeditpro-backend-pipeline` | `codex/backend-workflow-pipeline-continuation@bfd269fa3` | 514 modified, 178 untracked |
| clean Caption worktree | `codex/captions-specialist-cap-00r-v1@bfd269fa3` | only CAP-00R docs added |

The clean worktree is the only writable Caption checkpoint. Nothing is copied
from the backup tree into runtime code and neither dirty owner checkout is
staged or modified.

## Preservation-tree scope

The backup checkout contains 39 `src/lib/caption-direction` files, 35 Caption
public type files, and 70 relevant server/service/smoke files. The inspected
set has zero tracked files in that checkout. Its reports cite substantial
private and contract evidence, but those results do not establish a reproducible
published dependency chain on the clean base.

CAP-00R therefore treats the preservation tree as:

- useful design and adversarial-test evidence;
- a source of candidate public DTOs and validators;
- a migration/compatibility inventory;
- not a merge base;
- not a completion claim;
- not permission to broad-stage or copy its implementation.

## Scoped limitations

- The neutral shared specialist contracts required by CAP-01 are absent from
  the committed base.
- Raw reference media is unavailable for exact reference verification.
- Provider, font/model license, deployed storage/IAM, billing, public delivery,
  and production evidence remain outside CAP-00R.

Each limitation protects only its unsafe claim. Safe contract, adapter,
fixture, and private qualification work continues.
