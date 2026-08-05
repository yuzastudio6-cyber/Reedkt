# Track All public plugin E2E

## Boundary

TRACK-16 qualifies the independently callable public lifecycle through the
generic edit-skill runtime registry. The fixture resolves `track_all@1.0.0`
from the exact manifest reference and uses only:

1. `planAssignment(...)`
2. `acceptDependencyArtifact(...)` when requested
3. `compileApprovedWorkGraph(...)`
4. registered runtime-binding dispatch
5. `validateWorkItemResult(...)`
6. `finalizeSkillResult(...)`

The E2E source contains no direct import of a Track All private mini-skill,
SAM request builder/session owner, FFmpeg command builder, OpenCV runtime, or
Remotion runtime. The public graph binds the persisted
`track_all_work_graph_v1` artifact without exposing those internals.

## Scenarios

The fixed internal matrix covers:

- no action;
- selected license plate;
- all faces except the presenter, including the typed Visual Intelligence
  dependency request/acceptance and a separately replanned grounded route;
- existing Track Graph repair with exact prior graph and repair evidence;
- planar phone screen;
- freeform room region;
- privacy redaction with fail-closed policy authority;
- product focus;
- speaker reframe with the canonical caption reserved-zone authority;
- B-Roll `track_graph_v1` compatibility handoff;
- Captions behind-subject mask/geometry handoff.

Every work item is resolved through the generic binding registry and dispatched
by the internal qualification adapter before a strict injected artifact is
submitted to the public plugin. The fixture artifacts are intentionally marked
and reported as injected lifecycle evidence. They do not claim real SAM 3.1
inference or a canonical-private/production worker execution.

## Fail-closed checks

The public boundary rejects:

- wrong QA lineage;
- output mutation outside the assignment range;
- cross-workspace output substitution;
- forged/missing QA evidence;
- duplicate dependency acceptance;
- an approved graph rebound to another assignment.

Work output validation additionally requires exact assignment, plan, manifest,
range, operation, worker, output type, QA lineage, and accessible content-
addressed evidence. Finalization requires every exact required result once and
every exact dependency acceptance once. Result status is projected from every
public Track All decision rather than defaulting unresolved decisions to
accepted.

## Canonical caption authority

TRACK-16 removed the competing Track All-specific shape for
`caption_reserved_zones_v1`. Track All now consumes the already canonical
shared caption-zone contract and converts its integer-millionth geometry only
inside the private focus/reframe runtime.

## Command

```bash
npm run test:track-all-public-plugin-e2e
```

The command must report 11 complete scenarios, one dependency lifecycle, 57
runtime dispatch receipts, six adversarial public-boundary rejections, zero
private mini-skill imports, zero SAM inference, zero provider requests, zero
public artifacts, and zero production mutations.
