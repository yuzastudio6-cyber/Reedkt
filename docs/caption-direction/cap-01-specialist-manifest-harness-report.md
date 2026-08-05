# CAP-01 — Specialist Manifest, Qualification, and Harness Report

Status: `complete`
Milestone: `CAP-01`
Media produced: none
Direct raster inspection required: no, because this milestone produces only
byte-free contract receipts

## Outcome

CAP-01 publishes the neutral contracts required to build skills before the
future HQ/Orchestra exists. The Caption specialist can now accept bounded
Orchestra-shaped assignments, validate an exact manifest and per-job
qualification snapshot, return typed follow-up requests for missing owner
evidence, resume only after the exact request and injected artifact lineage are
reread, and produce a closed job result.

This is not an Orchestra implementation. There is no reasoning loop, global
dispatcher, cross-skill scheduler, direct peer execution, provider call, media
runtime, artifact creation authority, billing mutation, QA approval, public
delivery, or production promotion.

## Public contracts

- `skill-capability-manifest-v1` remains frozen and readable.
- `skill-capability-manifest-v2` adds:
  `canOwnPrimaryAnalysis`, `invocationPolicy`, `resultContract`,
  `failureSemantics`, and `securityPolicyRef`.
- `skill-qualification-snapshot-v1` qualifies each job and execution mode
  independently; it cannot claim the whole skill or production.
- `orchestra-skill-call-v1` carries exact caller, assignee, job, canonical
  scope, manifest, qualification, artifact, replay, and closed-authority
  bindings.
- `skill-support-request-v1` is HQ-mediated and cannot dispatch a peer.
- `orchestra-skill-job-result-v1` echoes exact scope and qualification lineage
  and keeps all execution/approval/delivery authorities closed.

CAP-11 remains unchanged. A future Living Frame follow-up carries a reference
to the frozen Caption-owned CAP-11 payload; the support request does not become
a second Caption↔Living Frame planner or dispatcher.

## Caption manifest

The manifest declares 41 supported jobs across video, scene, boundary, and
support scopes, plus the complete forbidden-owner list. Caption primary visual
ownership is limited to speech-derived typography. Caption primary analysis is
limited to caption linguistic and typographic reasoning.

CAP-01 qualifies planning contract routing only. Preview and final execution
remain blocked. Advanced visual jobs require Visual Intelligence evidence.
Mask/anchor/occlusion jobs require Track All evidence; Caption never invokes
SAM 3.1 directly.

## Closed-data and replay hardening

All public values are inspected before domain fields are read. Validators reject
inherited fields, accessors, symbols, sparse arrays, cycles, non-finite numbers,
unknown fields, oversized trees, unsafe URL/path/credential-shaped text,
tampered digests, stale manifest or qualification refs, overlapping ranges,
scope mismatch, truthy authority claims, and direct Caption peer callers.

A resumed call must reread the exact captured support request and bind:

- the original call reference;
- the support-request reference;
- canonical scope;
- requested artifact types;
- injected private byte-free artifact refs; and
- the expected owner/producer.

Hash-shaped references without that reread are refused.

## Evidence

`npm run smoke:captions-specialist-cap-01` passes 47 assertions covering:

- v1 backward readability and v2 hash round-trip;
- complete job and capability coverage;
- per-job planning-only qualification;
- video, scene, and boundary invocation;
- Visual Intelligence follow-up and exact resume;
- Track All mask ownership and SAM 3.1 non-ownership;
- explicit unsupported-job behavior;
- private-execution refusal;
- wrong-assignee, stale-manifest, stale-qualification, direct-peer, scope,
  range, authority, injection, digest, inherited, accessor, cyclic, sparse,
  unsafe-text, unknown-field, and duplicate-qualification adversarial cases;
- zero mutation of the harness authority counters.

Focused server typecheck and ESLint pass. The package lock is unchanged. No
media, provider, Docker, Python, Remotion, FFmpeg, model, billing, public, or
production runtime was started.

## Next

CAP-02 publishes the canonical Caption component and validated compatibility
mapping for the internal `caption_design` composite. CAP-03 then mounts the
finished specialist definition into the existing professional-skill registry
without implementing the future Orchestra.
