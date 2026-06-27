# Edit Level Tool Routing Architecture

RP-EDITLEVEL-05 implements this as a mock/local routing package. It does not install tools, execute tools, call providers, run media workers, render/export, or reserve/spend credits.

## Routing Matrix

| Tool/seam | Normal | Premium | Ultra Premium |
| --- | --- | --- | --- |
| Qwen 3.7 | Standard reasoning, basic edit plan, simple clarification. | Deep reasoning, style application, marker intent reasoning, source summary reasoning. | Multi-pass reasoning, creative direction, QA explanation, story/pacing decisions, stronger plan synthesis. |
| Qwen2.5-VL-7B-Instruct | Targeted visual context only when needed by marker or ambiguity. | Key moments, marker windows, B-roll opportunities, visible text/layout when relevant. | Scene-level/deeper visual understanding, visual continuity, B-roll strategy, visual style/polish analysis. |
| Speech transcript seam | Optional or targeted when speech clarity is needed. | Recommended / expected when speech exists. | Required when speech exists, with timecoded speaker/speech timing. |
| Audio/SoundSync seam | Basic audio policy, simple music/SFX if requested. | Music/SFX/ambience/ducking recommendations. | Sound design planning, deeper audio continuity, stronger ducking/music/SFX direction. |
| Media extraction seam | Duration, dimensions, aspect ratio, export recommendation. | Metadata plus key moments/keyframe plan. | Scene/keyframe/waveform planning depth, later worker-backed. |
| Graphic/design understanding seam | Basic caption/text safety. | Styled captions/cards/readability. | Motion graphics direction, card/layout consistency, graphic polish. |
| Edit Preference / Preference DNA | Safe style hints. | Strong style/DNA application. | Deep DNA application plus stricter DNA QA. |
| Edit Brief | Edit Brief optional. | Edit Brief recommended for stronger control. | Edit Brief strongly recommended, but not required. |
| DeepSeek V4 Pro | Not used for user reasoning; future coding/tool-code/Remotion draft tasks only. | Same boundary. | Same boundary with larger future tool-code budget only after approval. |
| Credits | Minimal credit estimate only metadata. | Medium credit estimate only metadata. | Highest credit estimate only metadata with lower-cost alternatives. |
| Render/export | Basic render budget future metadata. | Medium render budget future metadata. | Highest render budget future metadata. |

## Controlled Tool Preference

Exact text, labels, charts, maps, captions, diagrams, browser captures, deterministic color/audio processing, and QA should prefer controlled tools and Remotion. AI video should be reserved for generative motion that improves the segment and remains subject to existing Basic/Pro/Premium Veo constraints until runtime migration occurs.

## Boundary

This architecture has no runtime implementation. All tool routing is planning metadata until future approval, credit, backend, worker, and provider gates exist.
