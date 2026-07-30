# Living Frame canonical MasterTiming and SoundSync binding

Living Frame remains an optional WeEditPro editing skill inside the single
canonical edit pipeline. It does not own a second clock, caption timeline, or
audio timing system.

`canonical-living-frame-timing-binding-v1` is a private server-derived
extension of the existing MasterTiming and SoundSync authority. For each
selected scene it:

- rereads the exact selected-scene publication and execution requirements;
- binds one exact current canonical segment and confirmed frame rate;
- derives one bounded visual range using the existing segment visual-timing
  policy;
- resolves the ordered `prepare`, `activate`, `demonstrate`, `resolve`, and
  `settle` requests into exact frame ranges;
- resolves each requested SoundSync cue into a bounded exact frame range;
- preserves speech priority and the existing caption plane above Living Frame;
  and
- freezes its content-addressed reference into the existing canonical timing
  hash.

The visual policy reserves segment edge frames for preparation and attention
restoration, uses the existing two-second/45-frame preferred visual window,
and divides the active range into reveal, hold, and exit. It rejects short,
out-of-range, duplicate-segment, stale, or malformed inputs instead of
inventing timing.

Exact cue placement is not an audio mix. SoundSync still owns the audio timing
system, and downstream audio-asset, loudness, ducking, narration-protection,
mix QA, and private-review evidence remain required. The binding does not
modify MasterTiming or SoundSync, create work items or assets, estimate cost,
approve a plan, render, dispatch a worker, or authorize production.

The current v1 compiler assigns cue slots by request order across the visual
range. That is an exact-frame calculation, but it is not yet proof of a
meaning-bound cue. Living Frame choreography v2 now requires every sound
request to bind exactly once to an approved attention event and, when
component-linked, to motion from that component. The canonical timing owner
must consume that semantic trigger instead of relying on even index spacing
before these cue placements can be considered professionally choreographed.
Until then, exact mix and semantic cue-readiness remain open.

The separate read-only
`living-frame-semantic-sound-timing-reconciliation-v1` now independently
recompiles this binding and compares each exact cue range with the semantic
phase required by its choreography trigger. It proves one phase-compatible
handoff case and one real `hold` → `demonstrate` conflict where v1 order
spacing places the cue in `activate`. It never changes the canonical cue,
claims an exact hit frame, or becomes a SoundSync owner.

The record contains no caption text, transcript, audio, media bytes, paths,
URLs, credentials, provider prompt, model route, or subject-specific logic.
