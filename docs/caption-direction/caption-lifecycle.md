# Caption Lifecycle

## States

| State | Meaning | Allowed next states |
| --- | --- | --- |
| `strategy_draft` | Intent and initial role are being compiled. | `strategy_review`, `superseded` |
| `strategy_review` | User-facing strategy, restraint, and estimate impact are reviewable. | `strategy_approved`, `strategy_draft`, `superseded` |
| `strategy_approved` | Caption strategy is part of the approved planning context. | `reservation_planned`, `stale` |
| `reservation_planned` | Space, structural timing, and approximate blocking needs are recorded. | `editing_in_progress`, `stale` |
| `editing_in_progress` | Main edit consumes reservations. | `waiting_for_picture_lock`, `stale` |
| `waiting_for_picture_lock` | Final choreography is prohibited pending stable dependencies. | `finish_ready`, `stale` |
| `finish_ready` | Picture lock, frame, occupancy inputs, transcript, masks, and visuals meet the finish gate. | `choreography_draft`, `stale` |
| `choreography_draft` | Phrases, tracks, placement, depth, and motion are proposed. | `timing_resolution`, `revision_required`, `stale` |
| `timing_resolution` | Caption requirements are being resolved by StoryTiming. | `motion_locked`, `revision_required`, `stale` |
| `motion_locked` | Caption motion frames/spec are frozen for sound planning. | `sound_locked`, `revision_required`, `stale` |
| `sound_locked` | SoundSync handoff/mix dependencies are frozen. | `render_ready`, `revision_required`, `stale` |
| `render_ready` | Approved snapshot, assets, fonts, renderer, and QA prerequisites are ready. | `rendered`, `stale` |
| `rendered` | Creative and delivery artifacts exist in the asset manifest. | `qa_review`, `revision_required` |
| `qa_review` | Required caption and export QA is running or reviewable. | `delivery_ready`, `revision_required` |
| `delivery_ready` | All required projections and QA gates passed. | `stale`, `superseded` |
| `stale` | A dependency version changed. | `revision_required`, `superseded` |
| `revision_required` | Scoped regeneration/reapproval/repair is needed. | earlier appropriate state, `superseded` |
| `superseded` | A newer plan/version replaced this record. | none |

## Transition rules

- Lifecycle transitions are append-audited; approved versions are never overwritten.
- Strategy approval does not authorize generation; existing plan and credit approval gates still apply.
- `finish_ready` requires a real PictureLockManifest, not an inferred UI flag.
- `motion_locked` freezes caption motion before sound choreography.
- Any dependency hash/version mismatch moves affected results to `stale`.
- Local repair may re-enter the narrowest safe prior state; it must not silently widen scope.
- Delivery readiness requires creative and accessible projections defined by the approval envelope.
