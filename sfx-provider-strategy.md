# SFX Provider Strategy

## Purpose

This document defines the future provider strategy for ReeditPro SoundSync SFX Director. It is architecture only and does not integrate Mirelo, MMAudio, provider SDKs, API keys, Secret Manager reads, Supabase, workers, or rendering.

## Routing Priority

Future routing should consider:

1. No SFX if sound does not improve the edit.
2. Approved internal library when a safe, reusable, high-quality match exists.
3. MMAudio V for draft, cheap fallback, Basic/Pro helper sounds, or video-synced experiments.
4. Mirelo SFX V1.5 for production-quality final SFX and premium/key moments.

The SFX Director must justify every generated or selected sound with an edit-layer reason, timing anchor, mix profile, QA checklist, and credit impact.

## Mirelo SFX V1.5

Mirelo SFX V1.5 is the future production SFX provider.

Use for:

- production-quality final SFX
- important transitions
- Stroke Motion final draw/morph sounds
- Graphic Design reveal sounds
- Real Motion object sounds
- title/chapter hits
- premium signature edits
- high-quality final polish moments

Mirelo should be used when the final deliverable needs a professional, clean, subtle, high-quality sound that will survive QA. Do not claim exact Mirelo API behavior until provider docs and tests exist.

## MMAudio V

MMAudio V is the future Basic/Pro fallback, draft audio, and video-synced helper.

Use for:

- cheap draft SFX
- Basic and Pro fallback SFX
- video-synced movement/sound ideas
- quick draft audio for timing experiments
- inexpensive generation when final production SFX is not required
- ambience/movement prototypes when video context matters

MMAudio should help the planner experiment with timing and movement context. It is not the default final production provider for important signature polish.

## Internal Library

At launch, ReeditPro may not have a sound library. That is acceptable.

Starting workflow:

`generate SFX per project -> store project-only -> trim/mix/QA -> use if passed -> mark as library candidate if reusable`

Eventually, ReeditPro should search the approved internal library first. If no good match exists, generate a new sound, QA it, use it project-only, and promote only after reuse review.

## No SFX

No SFX is always valid. The Director should prefer no SFX when sound does not improve clarity, emotion, pacing, or polish.

Use no SFX for:

- dialogue-heavy moments
- emotional pauses
- serious/faith teaching where sound would feel cheap
- natural scenes where ambience already works
- simple clean edits
- user requests for no SFX
- moments where music already carries the transition

## Provider Routing By Edit Level

| Edit level | Default SFX strategy |
| --- | --- |
| Basic | No SFX or approved library first; MMAudio only when a cheap subtle cue is justified. |
| Pro | Library first, MMAudio fallback/draft for useful transition or reveal cues, Mirelo only for clearly important production moments. |
| Signature | Mirelo for key Stroke Motion, Graphic Design, Real Motion, title, and transition moments; library for common cues; MMAudio for draft timing. |
| Premium | Mirelo for key production SFX; library for common SFX; MMAudio for synced helper or inexpensive prototypes. |

Basic/Pro should avoid high-density SFX and expensive production generation unless user intent and credit approval justify it.

## Prompt Adapter Differences

The future provider layer should use provider-specific prompt adapters.

### MMAudio Prompt Style

MMAudio is video-conditioned, so prompts should usually be short:

`target sound source + texture + intensity`

Examples:

- `soft transition whoosh`
- `subtle graphic reveal sound`
- `gentle line drawing sound`
- `light title card hit`
- `quiet object movement`
- `soft ambient bridge`
- `boat ambience and soft water movement`

Do not default to long cinematic paragraphs for MMAudio.

### Mirelo Prompt Style

Mirelo is the production SFX provider, but exact prompt behavior is unconfirmed. Future prompt adapters should be tested before production.

Example prompts:

- `Soft premium transition whoosh, clean airy movement, subtle luxury tone, short smooth tail, no harsh riser, no cartoon, no sci-fi.`
- `Subtle graphic card reveal sound, clean digital polish, light pop, soft tail, low intensity, professional corporate/luxury feel.`
- `Gentle stroke drawing sound, soft pencil-like line trace, light texture, no loud scratch, no cartoon effect, short clean tail.`
- `Soft Real Motion object settle sound, realistic small object movement, room-matched, low volume, no heavy impact, no cinematic boom.`

## Mirelo Prompt Test Matrix

Future tests should compare:

| Style | Example direction | What to measure |
| --- | --- | --- |
| `simple_keyword` | `premium transition whoosh` | Whether simple labels produce clean usable sounds. |
| `short_phrase` | `soft premium transition whoosh with clean tail` | Whether short phrases improve intent without overfitting. |
| `tag_list` | `soft, airy, premium, short tail, no cartoon` | Whether comma tags improve style control. |
| `structured_sentence` | Full sentence with positive and negative constraints | Whether longer prompts improve production quality. |

Measure prompt following, transient quality, tail cleanliness, artifact rate, trim usefulness, volume consistency, and QA pass rate.

## MMAudio Prompt Length Test Matrix

Future tests should compare:

| Style | Example direction | What to measure |
| --- | --- | --- |
| `two_word` | `soft whoosh` | Whether minimal prompts align with video movement. |
| `short_phrase` | `subtle graphic reveal sound` | Whether concise prompts improve target specificity. |
| `source_texture_intensity` | `line drawing soft pencil subtle` | Whether source/texture/intensity tokens help. |
| `long_sentence` | Full descriptive sentence | Whether long prompts help or degrade video-conditioned results. |

Measure sync to video, hit timing, movement relevance, artifacts, trim usability, and final mix usefulness.

## Provider Secrets

Future provider records may store secret reference names only. Raw provider keys must not be stored in source control, frontend code, database rows, logs, worker payloads, or docs.

## RP-SFX-05 Mock Prompt Adapters

RP-SFX-05 turns provider routes into mock prompt plans only. MMAudio uses short video-conditioned prompts, Mirelo uses structured production prompts by default, and internal library search uses tags. These prompt plans do not call providers or imply audio was generated.

## RP-SFX-12 Mock-First Provider Adapter

RP-SFX-12 adds a provider adapter layer with `mock`, `disabled`, and fail-closed `real` modes. It defines ReeditPro-owned request/response contracts, mock Mirelo/MMAudio/internal-library clients, response parsing, and safety gates. It still does not call real provider APIs, import SDKs, read secrets, create audio files, or assume undocumented provider schemas.

## Approval And Cost

SFX generation must be included in the credit estimate before generation. Production Mirelo generation may cost more than draft MMAudio generation or library reuse. No expensive SFX generation should run before plan approval, credit approval, and credit reservation.

## RP-FIX-14 Project Flow Routing

RP-FIX-14 makes this provider strategy visible inside the mock project editing flow. Project SFX now routes each planned cue to internal library, Mirelo SFX V1.5, MMAudio V fallback, or no SFX, then creates prompt plans and credit-gated mock worker jobs.

The route remains mock-only. Mirelo and MMAudio are not called, and real provider execution remains backend/worker future work.
