# Edit Reference Skill And Provenance Report

Status: `verified_with_external_runtime_limits`

Registry authority: `docs/edit-reference-skill-registry.md`

Capability readiness and per-study execution are separate. `verified_live` means a server adapter and prior live proof exist; it does not mean Gate 8 called that provider. Gate 8 intentionally used deterministic/manual fallbacks and blocked states, made no paid provider call, and recorded that exact runtime source in each `PreferenceSkillRun`.

## Registry Summary

| ID | Skill family | Registry readiness | Gate 8 study execution | Typed contract | Behavioral proof | Safe fallback/failure | Privacy/provenance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SK-01 | Media Structure | degraded | verified local metadata normalization; deeper study blocked | Yes | source-understanding and media-foundation smokes | `media_not_studied` | private ID/metadata only |
| SK-02 | Visual Language | verified_live | deterministic visual fallback; live adapter not called | Yes | Qwen visual adapter historical proof, runtime/leakage checks, evidence smoke | labelled deterministic fallback | ephemeral bounded samples required for live use |
| SK-03 | Story And Editorial Structure | verified_live | deterministic structured fallback; live adapter not called | Yes | Qwen reasoning bridge historical proof, runtime/leakage checks, evidence smoke | labelled fallback/questions | bounded evidence summaries only |
| SK-04 | Caption Design | verified_mock | manual evidence fallback | Yes | Preference Video Study, DNA, QA, browser findings | manual/low-confidence evidence | no copied caption wording/screenshots |
| SK-05 | Color Treatment | verified_mock | manual evidence fallback | Yes | DNA/QA and real-color boundary proof | broad mood only; no invented LUT | no raw private frames in browser |
| SK-06 | Speech And Pacing | blocked | blocked with exact missing transcript/audio reason | Yes | evidence partial-failure smoke and speech-caption boundary proof | clarification/metadata only | bounded transcript excerpts when future-approved |
| SK-07 | Audio And Sound Design | verified_mock | manual evidence fallback | Yes | Preference Video/DNA/QA and audio planner smokes | label real analysis not run | no songs, lyrics, raw provider audio |
| SK-08 | Graphics And Motion | verified_mock | manual evidence fallback | Yes | DNA/QA and browser findings | conservative user-described rules | exact UI/brand/layout is non-transferable |
| SK-09 | Transferability And Do-Not-Copy | verified_mock | deterministic classifier completed | Yes | evidence, DNA QA, target and 3-case adaptation smokes | fail closed to review | every decision links evidence/rules |
| SK-10 | Preference DNA Synthesis | verified_mock | deterministic builder completed | Yes | synthesis and immutability smokes | no approvable version if unsafe | exact evidence revisions/digests |
| SK-11 | Preference DNA QA | verified_mock | deterministic QA completed | Yes | 12-check QA/approval smoke | blocking result cannot approve | exact DNA/QA/evidence identity |
| SK-12 | Target-Video Adaptation | verified_mock | deterministic target adaptation completed | Yes | target, downstream, lifecycle, and adaptation smokes | legacy/no-reference fail-safe lane | exact target/DNA/context/decision digests |

Readiness totals:

- `verified_live`: 2
- `verified_local`: 0 registry entries (local execution is captured per run)
- `verified_mock`: 8
- `degraded`: 1
- `blocked`: 1
- `not_implemented`: 0 registry entries

## Required Provenance Fields

Every study execution records:

- stable skill ID and orchestration ID;
- exact study/reference/workspace identity;
- status: completed, fallback, or blocked;
- runtime source and fallback flag;
- tool IDs and evidence input/output IDs;
- bounded reasons, warnings, and notes;
- start/end timestamps;
- provider/model metadata only when an adapter actually runs;
- media-study status without implying raw media analysis;
- immutable evidence revision links consumed by DNA.

Browser DTOs omit secrets, provider headers, raw prompts/payloads, raw frames, filesystem paths, signed URLs, and unrelated project history.

## Gate 8 Proof Commands

Commands run without live provider activation:

```text
npm run smoke:edit-reference-evidence-study
npm run smoke:edit-reference-dna-synthesis
npm run smoke:edit-reference-dna-qa-approval
npm run smoke:edit-reference-target-application
npm run smoke:edit-reference-adaptation-proof
npm run smoke:source-video-understanding-package
npm run smoke:prod-media-foundation
npm run smoke:qwen-runtime-boundary
npm run smoke:qwen25vl-runtime
npm run check:qwen-runtime-boundary
npm run check:qwen-secret-leakage
npm run check:qwen25vl-secret-leakage
npm run smoke:prod-security-privacy
```

The two `verified_live` provider proof commands were not rerun because Gate 8 explicitly prohibited new paid calls merely to improve a label. Their adapters, typed contracts, historical proof commands, safe fallback behavior, secret checks, and provenance policies remain registered. Edit Reference per-study execution remained fallback/blocked and never presented itself as live.

## Final Skill Decision

The skill system is sufficient for honest backend-local beta testing and PR review because every selected goal returns typed evidence or a named blocked/fallback state and independent work continues after partial failure. It is not production-ready media study. Live/production status remains external until capability-specific adapters are connected to approved private media, credentials, rate/cost controls, privacy limits, operational tracing, and production persistence.
