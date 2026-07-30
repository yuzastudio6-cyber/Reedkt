# Caption Lifecycle

## Canonical states

| State | Meaning | Typical next state |
| --- | --- | --- |
| `strategy_draft` | Intent and initial caption role are being compiled. | `strategy_reviewable` |
| `strategy_reviewable` | Strategy, restraint, estimate impact, and approval envelope are user-reviewable. | `strategy_approved` or `strategy_draft` |
| `strategy_approved` | Strategy is inside the approved planning context. | `opportunities_mapped` |
| `opportunities_mapped` | Candidate scenes, roles, and integration classes are recorded. | `space_reserved` |
| `space_reserved` | Structural time/space and visual-system handoffs are reserved. | `blocking_ready` |
| `blocking_ready` | Approximate edit-time caption blocking is available and labeled non-final. | `awaiting_picture_lock` |
| `awaiting_picture_lock` | Exact choreography is prohibited pending stable dependencies. | `finish_readiness_blocked` or `finish_ready` |
| `finish_readiness_blocked` | One or more required finish dependencies are unavailable or stale. | `finish_ready` or `revision_required` |
| `finish_ready` | Picture lock, frame, transcript, visual proxy, masks, fonts, and output inputs meet the gate. | `choreography_resolving` |
| `choreography_resolving` | Semantic phrases, tracks, layout, depth, motion, and handoffs are resolving. | `choreography_resolved` |
| `choreography_resolved` | The deterministic caption scene is valid but final frames are not yet authoritative. | `storytiming_locked` |
| `storytiming_locked` | StoryTiming has resolved every final caption/motion/handoff frame. | `sound_handoff_ready` |
| `sound_handoff_ready` | Caption motion is locked and eligible cues can enter SoundSync. | `render_ready` |
| `render_ready` | Snapshot, assets, fonts, audio dependencies, render specs, and preflight QA are ready. | `rendered` |
| `rendered` | Required creative and delivery artifacts are in the asset manifest. | `qa_warning`, `qa_failed`, or `qa_passed` |
| `qa_warning` | Nonblocking findings require an explicit accepted warning or local repair. | `qa_passed` or `revision_required` |
| `qa_failed` | Required QA failed and delivery is blocked. | `revision_required` |
| `qa_passed` | Required caption/render/export QA passed. | `delivery_ready` |
| `delivery_ready` | Every approved projection and packaging requirement is ready. | `stale` or `superseded` |
| `stale` | At least one referenced dependency version no longer matches. | `revision_required` or `superseded` |
| `revision_required` | Scoped repair, regeneration, or reapproval is required. | the narrowest valid earlier state |
| `superseded` | A newer immutable plan/version replaced this record. | none |

## Transition rules

- Lifecycle transitions are append-audited; approved versions are never overwritten.
- Strategy approval does not authorize generation; existing plan and credit approval gates still apply.
- `finish_ready` requires a real PictureLockManifest, not an inferred UI flag.
- `storytiming_locked` freezes caption motion timing before `sound_handoff_ready`.
- Any dependency hash/version mismatch moves affected results to `stale`.
- Local repair may re-enter the narrowest safe prior state; it must not silently widen scope.
- Delivery readiness requires creative and accessible projections defined by the approval envelope.

Earlier exploratory names such as `strategy_review`, `reservation_planned`,
`waiting_for_picture_lock`, `motion_locked`, `sound_locked`, and `qa_review` are
not separate target states. If any prototype introduces them, a version adapter
must map them to the canonical states above.
