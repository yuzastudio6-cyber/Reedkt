# Edit Level Tool Routing Audit

This is a tool routing audit only. It does not install tools, execute tools, call Qwen 3.7, call Qwen2.5-VL, call DeepSeek, run workers, process media, reserve credits, or render/export.

## Level Routing Matrix

| Tool/seam | Normal | Premium | Ultra Premium |
| --- | --- | --- | --- |
| Qwen 3.7 | Main reasoning brain with standard planning pass, Marker Chat final decision, basic QA explanation. | Deeper planning pass for stronger story, pacing, Preference DNA reasoning, and Edit Brief marker priority. | Multi-pass reasoning for studio-level treatment, strict QA explanation, deeper Preference DNA and plan revision reasoning. |
| Qwen2.5-VL | Targeted visual/video clarification only when marker or visible context needs it. | Key visual moments, marker windows, visible objects/actions/text/layout summaries. | Scene-level visual understanding, deeper object/action/text/layout summaries, higher confidence requirements. |
| Speech transcript seam | Use transcript when speech exists; basic timecoded context where available. | Timecoded transcript expected when speech exists; supports stronger pacing, captions, and marker priority. | Transcript plus speech timing expected; supports frame-aware captions, meaning preservation, and sound design. |
| Audio/SoundSync seam | Basic professional cleanup, loudness, simple music/ducking recommendations, minimal SFX. | Music/SFX/ducking recommendations with speech-first timing and medium cue budget. | Sound design planning, speech-safe beat/ducking/SFX strategy, strict QA, highest cue budget. |
| Media extraction seam | Duration, dimensions, aspect ratio, basic sampled-frame/keyframe plan. | More sampled key moments and marker-window extraction plan. | Scene-level sampling and waveform/keyframe plan for deeper routing. |
| Graphic/design understanding seam | Only essential visible text/layout/readability checks. | Styled captions/cards and design polish for key beats. | Graphic/text/layout understanding, advanced captions/cards/motion direction, stricter collision/readability QA. |
| Preference DNA | Safe style hints. | Stronger application to pacing, captions, color, sound, and visual restraint. | Deep application across story, visual identity, sound, and QA. |
| Edit Brief | Optional. | Recommended and prioritized when present. | Strongly recommended; missing brief should create a planning warning, not a generic approval blocker in RP-EDITLEVEL-00. |
| DeepSeek V4 Pro | Coding/tool-code/Remotion draft work only, not user reasoning. | Same boundary. | Same boundary with larger future tool-code budget only after approval. |
| Render/export future | Basic render budget metadata only. | Medium future render pass budget metadata. | Highest future render pass budget metadata. |
| Credit future | Minimal tool budget estimate. | Medium tool budget estimate. | Highest tool budget estimate and lower-cost alternatives. |

## Existing Reuse

Existing `src/lib/tool-strategy-planner.ts`, `src/lib/render-strategy-planner.ts`, `src/lib/credit-estimator.ts`, `src/lib/model-routing-policy.ts`, `src/lib/provider-router.ts`, and `src/lib/edit-qa-planner.ts` already understand parts of level-sensitive planning. RP-EDITLEVEL-00 documents that future routing should feed these through an `EditLevelProfile`, not raw chat text.
