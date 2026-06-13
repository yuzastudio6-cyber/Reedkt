# SOUND_MUSIC_AUDIO Routing Policy

Decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

## Routing Choices

| Need | Route | Use When | Do Not Use When | Output |
| --- | --- | --- | --- | --- |
| Restraint or trust | Silence | Speech, authenticity, documentary gravity, or product clarity matters more than polish. | The approved plan explicitly needs cue or ambience. | Silence recommendation with reason. |
| Environmental context | Ambience | Setting/mood support is useful and source confidence is safe. | Location or scene details are uncertain and ambience would imply facts. | Ambience cue manifest. |
| Emotional pacing | Music cue planning | A music bed or accent supports mood, pacing, or structure without masking speech. | Voice clarity would suffer, rights/provenance are unclear, or cost is not approved. | Music cue plan. |
| Continuous support | Audio bed planning | A restrained bed can sit under voice with ducking requirements. | Speech density is high or silence is better. | Audio bed manifest. |
| Cut or reveal support | Transition sounds | A cut, reveal, title, map move, graphic motion, or scene change has a planned cue reason. | Cue would be decorative, random, or over speech. | Transition cue manifest. |
| Motion emphasis | Whooshes, hits, risers | Motion, impact, or reveal is meaningful and intensity can be bounded. | Generic retention trick or sensitive quiet section. | Cue family manifest. |
| Beat support | Beat emphasis cue planning | Beat emphasis improves timing and does not override speech clarity. | Beat snap would cut words or distort meaning. | Beat emphasis plan. |
| Cleanup or analysis | Track B handoff | Audio cleanup, loudness metadata, environment analysis, or media-derived issue classification is needed. | The request is final mix/export, provider generation, or billing. | `track_b_audio_processing_handoff`. |
| Composition/export context | Track A handoff | Cue/layer/mix metadata must inform final composition planning. | Any real render/export would be implied. | `track_a_final_composition_handoff`. |
| Motion timing context | AI Tools handoff | Graphics/motion timing should know a sound cue or rhythm intent. | Audio truth or final audio output is needed. | Review-only timing context. |
| Future provider question | Provider Gateway review | Mirelo, MMAudio, Lyria, or another generation route needs policy/cost/schema review. | A direct provider/model call would be required. | `provider_gateway_future_audio_generation_handoff`. |
| Cost and credits | Billing/cost review | Future audio generation or processing may affect credits or approval. | Billing mutation or Stripe action would be required. | `billing_future_audio_credit_handoff`. |

## Safe Decision Rules

- Speech clarity outranks beat alignment, decorative SFX, emotional scoring, transition sound, and music energy.
- SFX must support a planned visual/story cue and must not be random.
- Music and ambience must be restrained for documentary, case-study, tutorial, and product contexts unless the user explicitly approves a safe style.
- Audio output in this phase is planning/manifests only.
- Future provider audio generation is reviewed by Provider Gateway and Billing before any execution milestone.
- Future processing, cleanup, loudness, and analysis routes require Worker Runtime and Track B approval before execution.
- Track A owns final composition and export after approved manifests, checksums, QA, and worker/runtime gates.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
