# B-roll candidate QA and refinement

Status: private internal execution implemented; production semantic QA and the
live paid refinement canary are not qualified.

## Candidate lineage

Every generated candidate is adapted from an exact provider attempt into a
`b_roll_candidate_attempt_evidence_v1`. The evidence binds the initial request
package, assignment, plan, provider route/model alias, attempt identity,
private MP4 identity/checksum, provider and infrastructure cost, interaction
digest, and zero retry/fallback counters. Provider completion alone never
accepts a candidate.

Candidate versions are immutable create-only records. A candidate set is bound
to one manifest, assignment, plan, concept, and exact authorized frame range.
Version 1 is the initial candidate; version 2 is the only permitted refinement.
There is no mutable "latest" record and no third version path. Exact replay
returns the committed version and rejects changed bytes or QA evidence.

## Technical and objective QA

The exact private MP4 is processed by the pinned FFmpeg 8.1.2 image with
network disabled, a read-only root filesystem, dropped capabilities, and
server-derived commands only. The pipeline performs:

- FFprobe container, stream, duration, frame-count, FPS, and resolution
  inspection;
- exact first/last decoded-frame extraction;
- complete decoded-frame objective QA for container integrity, black frames,
  frozen frames, motion signal, and reference-frame integrity;
- deterministic exact-duration `approved_trim_transcode_v1` normalization to a
  private create-only FFV1/NUT artifact with audio removed.

The private objective-QA runner accepts the exact internal pair
`provider.google.generate_b_roll_candidate.v1` /
`provider_b_roll_candidate_video_mp4` in addition to its original visual
calibration pair. That MP4 identity is an internal provider-output role, not
an active public plugin artifact. Public work results expose only the strict
`b_roll_candidate_media_manifest_v1` reference; raw bytes remain in the
private binary/object store. Cross-pair substitutions remain invalid.

## Semantic, proof, and audio QA

Semantic/visual observations bind the candidate checksum, assignment, plan,
concept, and range. They cover semantic alignment, generated-image integrity,
subject/object consistency, plausible motion, camera intent, crop safety,
proof misrepresentation, content safety, and user-confirmation need. Current
qualification uses hashed internal injected observations and is explicitly
`productionQualified: false`; this does not claim a live production visual
intelligence worker.

The public skill contract separately requires a model-neutral
`visual_intelligence_candidate_qa_v1` artifact before a generated or
provider-edited candidate can receive semantic acceptance. Missing evidence
returns `needs_other_skill`; tenant, candidate checksum, assignment, plan,
range, producer manifest, and qualification substitutions fail closed.
Injected observations remain internal-only and can never satisfy production
acceptance.

Generated media is always recorded as non-proof. Automatic selection and
timeline mutation are false. The B-roll audio disposition is explicit, and
generated audio is removed from the normalized visual artifact. Ambient or
extraction dispositions require a Sound handoff; generated audio can never
silently enter the final mix.

## Verdict and fallback policy

The deterministic director can return `accepted`,
`accepted_after_normalization`, `needs_refinement`,
`fallback_to_existing_source`, `use_no_broll`, `needs_user_confirmation`,
`blocked`, or `failed`. Safety/proof failures do not become accepted through
normalization. A failed refined version falls back to one eligible approved
source when available, otherwise to professional no-action. Alternate provider
fallback is never used.

## One-turn refinement

A refinement authority exists only when immutable version 1 has a
`needs_refinement` QA report. It binds the prior candidate ref/hash, prior QA
ref/hash, prior attempt, interaction digest, exact route/model, concept,
duration, aspect ratio, and frame range. It issues a new attempt identity and
cost record, permits one submission, and permits no retry, route change,
concept change, range change, or alternate provider. Route changes require a
new estimate, concept changes a new plan, and range changes a fresh orchestra
assignment.

The official Gemini request builder uses `previous_interaction_id` and rejects
a raw interaction identity that does not match the private digest. The injected
refinement executor produces a distinct create-only private MP4 and exact
attempt/cost evidence without making a provider request. The live paid
refinement path remains behind the same external canary prerequisites as the
initial transport and is not claimed as executed.

Validation command:

`npm run smoke:b-roll-candidate-qa`

It proves a technically valid first candidate rejected for camera-intent drift,
one official-contract refinement request, one immutable injected refinement,
accepted normalized version 2, exact replay, second-refinement rejection,
source/no-action fallbacks, Sound handoff, forged observation rejection,
concept substitution rejection, and zero actual provider requests.
