# Canonical Sound execution-integrity audit

> Historical audit: this report describes the version 3 closure baseline. The findings are
> superseded by Sound `4.0.0` and `canonical-sound-final-execution-audit.md`.

Status: `implemented_and_acceptance_qualified`

Audit baseline:

- branch: `codex/canonical-sound-skill`
- inspected head: `43428c62a401ae5dfd22b107d5ec63ca0f42d23b`
- shared kernel: `server/edit-skills/core/`
- canonical Sound service: `server/edit-skills/sound/canonical-sound-skill-service.ts`
- canonical Sound route executor: `server/edit-skills/sound/sound-route-executor.ts`

The prior closure established the correct shared manifest, authority, rational-timebase,
private-media, Mirelo-fixture, continuity, and stable-service foundations. This pass does
not replace those foundations.

## Reproduced execution gaps

1. The route executor dispatches a hand-written local, Mirelo, or no-Sound path and then
   projects every declared route step as completed. It does not require an operation
   handler receipt for every completed step.
2. Completed-step elapsed time is calculated by dividing aggregate local runtime across
   declared steps. Artifact IDs are attached to steps that did not create those artifacts.
3. Planning returns one selected route and execution uses first-item selection for route,
   cue, authorized range, visual dependency, event anchor, and mix automation.
4. One produced artifact causes every authorized audio range to be reported as modified.
5. Operation settings are compiled at execution time from hidden fixed values, including
   gain, fades, stretch, pitch, secondary-layer gain, ducking, and sync tolerance.
6. `create_sound_dna`, generated ambience, synchronization, handoff, whole-video child
   execution, and localized revision do not yet return all required real execution outputs.
7. Mix QA proves attached automation values rather than measuring ducking, headroom,
   fades, channel energy, or pan from decoded rendered audio.
8. Several planning-qualified capabilities can be confused with execution-capable jobs
   because there is no complete machine-readable supported-job acceptance matrix.

## Migration map

1. Add versioned compiled operation specifications and a Sound-owned per-cue/per-range
   execution graph.
2. Add an allowlisted operation-handler registry and execute published route steps in
   validated topological order.
3. Derive unit, step, artifact, mutation-range, timing, cost, provider, QA, and handoff
   results only from actual handler receipts.
4. Execute every admitted unit independently, retain partial-failure state, and preserve
   unaffected artifacts during localized revision.
5. Measure output and mix evidence from decoded artifacts. Keep advanced perceptual and
   material judgments at `needs_review`.
6. Publish a new immutable Sound skill/manifest version, add a complete supported-job
   acceptance matrix, and expose one aggregate `test:sound-acceptance` command.

The real Head of Orchestra and the separate Music skill remain outside this pass.

## Baseline regression evidence

Command executed against `43428c62a` plus the new regression harness:

```text
npm run test:sound-execution-integrity
```

Expected baseline result: failed. The run reproduced all six targeted defect classes:

- completed route steps lacked operation-receipt hashes;
- multi-range replay collided because one first-range output identity was reused;
- Sound DNA lacked measured/declared output separation;
- synchronization performed sync QA instead of producing a placement;
- mix QA lacked decoded output measurements;
- two generated cues produced only one provider attempt/artifact.

The regression harness is retained and must pass after implementation.

## Closure result

Sound now publishes immutable skill/contract version `3.0.0` / `sound.skill_contract.v3`.
Version 2 remains historical evidence and was not mutated in place.

- `server/edit-skills/sound/sound-execution-graph.ts` compiles independent, hash-bound
  units for every affected range, cue, source analysis, synchronization placement,
  provider attempt, no-Sound decision, or explicitly planning-only capability.
- `server/edit-skills/sound/sound-operation-handler-registry.ts` is the publication and
  runtime handler-coverage gate. Required executable route steps cannot publish without
  a registered handler.
- `server/edit-skills/sound/sound-route-executor.ts` topologically executes admitted
  steps, evaluates conditions, enforces dependencies, records timestamps and measured
  elapsed time, and creates a receipt hash only after handler completion.
- Operation parameters are compiled from exact caller directives, approved range/rate,
  request quality policy, planned cue/mix automation, or named published policy. Callers
  cannot supply paths, commands, codecs, filters, provider payloads, or FFmpeg arguments.
- Multi-range output mutations now come only from successful mutation receipts. Partial
  failures preserve successful artifacts and identify the failed unit. Localized revision
  reuses only unaffected, receipt-bound artifacts.
- Sound DNA separates decoded measurements from declared preferences. Synchronization
  returns an applied exact-frame placement manifest. Mix QA includes decoded output and
  input balance measurements.
- Generated ambience and deterministic ambience extension use separate exact routes so
  the local branch is not downgraded by Mirelo fixture qualification.
- The 39-job acceptance matrix records 28 executable jobs and 11 explicitly planning-only
  jobs. No job falls through an untyped generic success path.

Acceptance command:

```text
npm run test:sound-acceptance
```

This command includes the original Sound suite, execution-integrity regressions, and the
complete supported-job matrix. Live Mirelo activation and real Orchestra integration remain
pending by design.
