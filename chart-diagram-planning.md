# Chart + Diagram Planning

## Purpose

ReeditPro needs a professional chart and diagram planning layer for videos where viewers need to understand money movement, account flows, process steps, timelines, comparisons, metrics, before/after results, business performance, product benefits, education frameworks, scam/fraud evidence flows, organization relationships, cause-and-effect, data trends, lists, and structured ideas.

The goal is to choose controlled chart/diagram planning when exact information matters. Charts and diagrams should be built from structured data/specs and composed by Remotion, not invented as AI video.

## Controlled Tools, Not AI Video

Chart/diagram visuals should generally use:

- D3 for custom diagrams, money flows, networks, process diagrams, timelines, and custom SVG/data motion.
- ECharts for standard bar, line, pie, area, funnel, gauge, dashboard cards, and business metric charts.
- Vega-Lite as a future AI-friendly JSON chart-spec option.
- Remotion for final composition, layer timing, card reveals, caption-safe placement, transitions, and motion.
- GPT-Image-2 only for polished decorative or illustrative card frames when exact data is not at risk.

AI video should not invent exact charts, numbers, arrows, names, accounts, labels, timelines, or diagrams.

## Visual Types

- `money_flow_diagram`
- `account_flow_diagram`
- `process_step_diagram`
- `timeline_diagram`
- `before_after_comparison`
- `metric_card`
- `bar_chart`
- `line_chart`
- `area_chart`
- `pie_or_donut_chart`
- `funnel_chart`
- `gauge_chart`
- `table_card`
- `network_graph`
- `hierarchy_tree`
- `cause_effect_diagram`
- `pros_cons_comparison`
- `feature_comparison`
- `evidence_flow_diagram`
- `claim_support_diagram`
- `document_breakdown_card`
- `custom_visual_explain`

## Style Families

- `clean_visual_explain`: general diagrams, frameworks, and structured concepts with clear labels and restrained motion.
- `documentary_evidence_diagram`: serious evidence, claims, timelines, and source-aware graphics with neutral tone.
- `money_flow_evidence`: account and money movement diagrams with careful arrows, labels, and source status.
- `business_dashboard`: business metrics, performance, dashboard cards, and professional charts.
- `education_step_by_step`: process, steps, frameworks, tutorials, and classroom-style explainers.
- `premium_product_comparison`: feature comparisons, plan comparisons, product benefits, and polished brand visuals.
- `social_metric_card`: short-form metric cards and count-up moments with high readability.
- `minimalist_table_card`: lists, tables, pros/cons, and compact structured facts.
- `cinematic_story_diagram`: story-driven relationship or cause/effect diagrams with cinematic pacing.
- `custom`: user-directed style mapped to a safe known style plus custom notes.

## Layout Modes

Charts and diagrams can use existing ReeditPro layout modes:

- `full_graphic_explainer` for detailed diagrams that need the full visual area.
- `voiceover_visual_takeover` when the visual should carry the explanation while the speaker continues.
- `lower_visual_panel` for simple metric cards, lists, and short labels.
- `side_by_side_speaker_visual` when the speaker should stay visible next to a diagram.
- `picture_in_picture_speaker` when the diagram is primary and the speaker is a small anchor.
- `full_evidence_board` for documentary/evidence grouping.
- `split_screen_comparison` for product, feature, plan, or pros/cons comparison.
- `before_after_panel` for transformation or result comparisons.
- `screen_capture_with_speaker_pip` when a dashboard/screen capture anchors the chart.
- depth-aware overlay only when useful and safe.

## Exactness Rule

If a visual includes exact numbers, names, dates, labels, money amounts, arrows, accounts, claims, percentages, company facts, product facts, legal claims, or documentary claims, the visual should be tool-controlled or Remotion-controlled.

AI video may support organic story motion, but it should not be used for precise charts, data, labels, timelines, arrows, accounts, or diagrams.

## Data And Source Certainty

For Documentary / Case Study, finance, business, legal, scam/fraud, evidence, and money visuals:

- Data should include source status.
- Unverified data should be labeled as claimed, reported, approximate, or source-needed.
- Unknown data should trigger source-needed notes.
- Allegations must not be shown as verified facts.
- The planner should not invent numbers.
- Mock/demo data must be clearly marked as mock.
- Fictional story data must be clearly marked as fictional.

## Planned Settings

Chart and diagram settings include:

- chart or diagram type
- data source type and confidence
- label density and placement
- value display, axes, grid, nodes, edges, arrows, and annotations
- color palette and highlight color
- animation type, duration, reveal order, count-up, line draw, arrow flow, and emphasis timing
- safe label zones, caption safe zone, and panel background color

## Tier Behavior

Basic supports simple metric cards, list/table cards, before/after cards, simple step cards, lower-panel diagrams, and low-density labels. Basic never uses Veo.

Pro supports money-flow diagrams, process diagrams, business charts, timeline cards, D3/ECharts/Remotion planning, and richer VisualExplain scenes. Pro never uses Veo.

Premium supports advanced money/evidence flows, relationship diagrams, richer motion design, stronger QA, custom data visuals, and future Vega-Lite/spec planning. Veo remains final fallback only for unrelated AI video assets, not chart rendering.

## Tool Responsibilities

D3 plans custom diagrams, network/money flows, custom timelines, arrow/path motion, and SVG/data motion.

ECharts plans standard charts, business/finance charts, dashboard-style visuals, and quick professional chart cards.

Vega-Lite is a future structured JSON spec option for repeatable chart planning.

Remotion owns final layout, layer timing, captions, panels, card reveals, placement, transitions, and voiceover visual takeover.

GPT-Image-2 can create designed card frames and illustrative non-exact backgrounds, but not the exact data source of truth.

Wan, Hailuo, and Veo are not for exact charts or diagrams. Veo remains Premium-only final fallback for AI video assets, not chart/diagram rendering.

## Non-Goals

This milestone does not install D3, ECharts, or Vega-Lite; render charts; create or verify real data; call APIs; execute tools; run Remotion; or implement backend/render/export work.
