# Chart + Diagram Settings Catalog

This catalog defines planned settings for chart, diagram, data visual, money-flow, timeline, comparison, and VisualExplain planning. These are structured planning settings only; no chart tool runs in this milestone.

## Data Settings

- `dataSourceType`
- `dataConfidence`
- `sourceLabel`
- `sourceNeeded`
- `safeWording`
- `dataRows`
- `dataSeries`
- `categories`
- `values`
- `units`
- `currency`
- `percentageFormat`
- `dateFormat`
- `mockDataFlag`
- `verifiedDataFlag`

## Chart Settings

- `chartType`
- `xAxis`
- `yAxis`
- `series`
- `legend`
- `tooltip`
- `grid`
- `axisLabelStyle`
- `valueLabelStyle`
- `colorPalette`
- `highlightColor`
- `annotationStyle`
- `responsiveSize`
- `labelDensity`
- `labelPlacement`

## Diagram Settings

- `diagramType`
- `nodes`
- `edges`
- `nodeStyle`
- `edgeStyle`
- `arrowStyle`
- `flowDirection`
- `grouping`
- `hierarchyLevel`
- `connectionLabelStyle`
- `emphasisNodeIds`
- `emphasisEdgeIds`
- `layoutAlgorithm`
- `spacing`
- `complexityLevel`

## Animation Settings

- `animationType`
- `animationDuration`
- `revealOrder`
- `stepRevealTiming`
- `countUpDuration`
- `lineDrawDuration`
- `arrowFlowDuration`
- `nodePopTiming`
- `highlightPulseTiming`
- `transitionIn`
- `transitionOut`
- `soundSyncCueId`

## Layout Settings

- `layoutMode`
- `frameTemplate`
- `visualZone`
- `speakerZone`
- `captionSafeZone`
- `safeMargins`
- `panelBackgroundColor`
- `labelAvoidZones`
- `maxLabelCount`
- `compactMode`
- `fullTakeoverMode`

## Style Settings

- `diagramStyleFamily`
- `typographyScale`
- `cardStyle`
- `borderStyle`
- `shadowStyle`
- `lineWeight`
- `cornerRadius`
- `documentaryNeutrality`
- `brandColorUse`
- `seriousnessLevel`
- `playfulElementsAllowed`

## Tier Presets

Basic:

- `simple_metric_card`
- `simple_before_after_card`
- `simple_step_card`
- `lower_panel_list_card`

Pro:

- `money_flow_diagram`
- `process_step_diagram`
- `timeline_diagram`
- `business_bar_line_chart`
- `feature_comparison_card`
- `evidence_flow_diagram`

Premium:

- `advanced_money_network`
- `complex_case_timeline`
- `premium_dashboard_chart`
- `multi_stage_process_diagram`
- `data_story_sequence`
- `future_vega_lite_spec`

## QA Thresholds

- label readability
- maximum label density
- chart not covering face/captions
- axis and number correctness
- source-needed warning
- mock data warning
- claim status warning
- arrow direction accuracy
- chart color contrast
- panel background consistency

## Planning Boundary

Settings are stored as planning intent for future approved workers. They do not install D3, ECharts, Vega-Lite, execute tools, verify external data, render charts, or bypass approval.
