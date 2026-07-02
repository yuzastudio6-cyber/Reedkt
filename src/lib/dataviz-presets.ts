import type {
  DataVizAnimationType,
  DataVizStyleFamily,
  DataVizToolPreference,
  DataVizVisualType,
  EditLevel,
  EditingCategory,
  OpenSourceToolId,
  SpeakerVisualLayoutMode,
} from '../types/reeditpro'

type DataVizStylePreset = {
  id: DataVizStyleFamily
  label: string
  description: string
  bestUseCases: string[]
  colorPalette: string[]
  highlightColor: string
  labelDensity: 'low' | 'medium' | 'high'
  typographyScale: 'compact' | 'normal' | 'large'
  lineWeight: 'thin' | 'medium' | 'thick'
  cardStyle: string
  documentaryNeutrality: boolean
  brandColorUse: boolean
  playfulElementsAllowed: boolean
  avoidRules: string[]
  qaChecks: string[]
}

type DataVizVisualPreset = {
  id: DataVizVisualType
  label: string
  defaultToolPreference: DataVizToolPreference
  defaultAnimationType: DataVizAnimationType
  preferredLayoutModes: SpeakerVisualLayoutMode[]
  preferredTools: OpenSourceToolId[]
  tierBehavior: Record<EditLevel, string>
  fallback: string[]
  qaChecks: string[]
}

export const dataVizStylePresets: DataVizStylePreset[] = [
  {
    id: 'clean_visual_explain',
    label: 'Clean VisualExplain',
    description: 'Clear structured graphic style for general concepts, lists, and frameworks.',
    bestUseCases: ['education', 'simple explainers', 'framework diagrams'],
    colorPalette: ['brand_blue', 'brand_cyan', 'soft_white'],
    highlightColor: 'brand_cyan',
    labelDensity: 'medium',
    typographyScale: 'normal',
    lineWeight: 'medium',
    cardStyle: 'clean_panel',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: true,
    avoidRules: ['Avoid dense labels.', 'Avoid decorative data that implies exactness.'],
    qaChecks: ['Labels are readable.', 'Caption safe zones remain clear.'],
  },
  {
    id: 'documentary_evidence_diagram',
    label: 'Documentary evidence diagram',
    description: 'Neutral evidence style for claims, timelines, and source-aware documentary visuals.',
    bestUseCases: ['case timelines', 'claims', 'documentary evidence boards'],
    colorPalette: ['muted_slate', 'soft_blue', 'soft_cyan'],
    highlightColor: 'soft_cyan',
    labelDensity: 'medium',
    typographyScale: 'compact',
    lineWeight: 'thin',
    cardStyle: 'evidence_board',
    documentaryNeutrality: true,
    brandColorUse: false,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid sensational colors.', 'Do not frame claims as verified without source.'],
    qaChecks: ['Source-needed claims are flagged.', 'Neutral tone is preserved.'],
  },
  {
    id: 'money_flow_evidence',
    label: 'Money flow evidence',
    description: 'Structured account and money movement style with careful arrows and source status.',
    bestUseCases: ['money flows', 'account flows', 'scam/fraud diagrams'],
    colorPalette: ['brand_blue', 'warning_gold', 'soft_cyan'],
    highlightColor: 'warning_gold',
    labelDensity: 'medium',
    typographyScale: 'compact',
    lineWeight: 'medium',
    cardStyle: 'source_aware_cards',
    documentaryNeutrality: true,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid invented account labels.', 'Avoid unclear arrow direction.'],
    qaChecks: ['Arrow direction is explicit.', 'Money/data confidence is visible.'],
  },
  {
    id: 'business_dashboard',
    label: 'Business dashboard',
    description: 'Professional dashboard/chart style for metrics, growth, revenue, and product analytics.',
    bestUseCases: ['business metrics', 'dashboard visuals', 'SaaS/product results'],
    colorPalette: ['brand_blue', 'brand_cyan', 'brand_violet'],
    highlightColor: 'brand_blue',
    labelDensity: 'medium',
    typographyScale: 'normal',
    lineWeight: 'medium',
    cardStyle: 'dashboard_card',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid fake business metrics.', 'Avoid unreadable axes.'],
    qaChecks: ['Numbers are source-aware.', 'Axes and labels remain readable.'],
  },
  {
    id: 'education_step_by_step',
    label: 'Education step-by-step',
    description: 'Didactic process style for tutorials, lesson steps, frameworks, and clear sequencing.',
    bestUseCases: ['education', 'tutorials', 'process explainers'],
    colorPalette: ['brand_cyan', 'brand_blue', 'soft_white'],
    highlightColor: 'brand_cyan',
    labelDensity: 'medium',
    typographyScale: 'large',
    lineWeight: 'medium',
    cardStyle: 'step_card',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: true,
    avoidRules: ['Avoid too many steps in a lower panel.', 'Avoid tiny labels.'],
    qaChecks: ['Step order is clear.', 'Each label fits its card.'],
  },
  {
    id: 'premium_product_comparison',
    label: 'Premium product comparison',
    description: 'Polished product/feature comparison style with restrained premium spacing.',
    bestUseCases: ['product benefits', 'plan comparisons', 'premium brand videos'],
    colorPalette: ['brand_blue', 'brand_violet', 'soft_white'],
    highlightColor: 'brand_violet',
    labelDensity: 'medium',
    typographyScale: 'normal',
    lineWeight: 'thin',
    cardStyle: 'premium_comparison',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid marketing claims without source.', 'Avoid cramped comparison columns.'],
    qaChecks: ['Feature labels are exact.', 'Comparison hierarchy is readable.'],
  },
  {
    id: 'social_metric_card',
    label: 'Social metric card',
    description: 'Large readable metric/count-up cards for short-form proof and results.',
    bestUseCases: ['social proof', 'count-up metrics', 'short-form results'],
    colorPalette: ['brand_cyan', 'brand_blue', 'soft_white'],
    highlightColor: 'brand_cyan',
    labelDensity: 'low',
    typographyScale: 'large',
    lineWeight: 'thick',
    cardStyle: 'metric_card',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: true,
    avoidRules: ['Avoid fake numbers.', 'Avoid small captions inside the metric card.'],
    qaChecks: ['Metric text is large.', 'Mock/example numbers are marked.'],
  },
  {
    id: 'minimalist_table_card',
    label: 'Minimalist table card',
    description: 'Compact table/list style for pros/cons, features, and structured facts.',
    bestUseCases: ['table cards', 'pros/cons', 'simple comparisons'],
    colorPalette: ['soft_white', 'brand_blue', 'muted_slate'],
    highlightColor: 'brand_blue',
    labelDensity: 'medium',
    typographyScale: 'compact',
    lineWeight: 'thin',
    cardStyle: 'minimal_table',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid dense table cells.', 'Avoid long paragraphs.'],
    qaChecks: ['Rows remain scannable.', 'Table does not collide with captions.'],
  },
  {
    id: 'cinematic_story_diagram',
    label: 'Cinematic story diagram',
    description: 'Story-first relationship/cause-effect style with calmer cinematic reveals.',
    bestUseCases: ['story relationships', 'cause/effect', 'emotional context'],
    colorPalette: ['dark_slate', 'brand_cyan', 'brand_violet'],
    highlightColor: 'brand_violet',
    labelDensity: 'low',
    typographyScale: 'normal',
    lineWeight: 'medium',
    cardStyle: 'cinematic_nodes',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Avoid overstating relationships.', 'Avoid heavy labels during emotional beats.'],
    qaChecks: ['Relationship wording is safe.', 'Motion does not distract from story.'],
  },
  {
    id: 'custom',
    label: 'Custom dataviz',
    description: 'User-directed dataviz style mapped to safe presets plus custom notes.',
    bestUseCases: ['custom chart or diagram direction'],
    colorPalette: ['brand_blue', 'brand_cyan', 'brand_violet'],
    highlightColor: 'brand_cyan',
    labelDensity: 'medium',
    typographyScale: 'normal',
    lineWeight: 'medium',
    cardStyle: 'custom_safe_visual_explain',
    documentaryNeutrality: false,
    brandColorUse: true,
    playfulElementsAllowed: false,
    avoidRules: ['Custom style must preserve exact labels and source safety.'],
    qaChecks: ['Custom styling does not reduce readability.'],
  },
]

export const dataVizVisualPresets: DataVizVisualPreset[] = [
  {
    id: 'money_flow_diagram',
    label: 'Money flow diagram',
    defaultToolPreference: 'd3',
    defaultAnimationType: 'arrow_flow',
    preferredLayoutModes: ['full_evidence_board', 'voiceover_visual_takeover', 'full_graphic_explainer'],
    preferredTools: ['d3', 'remotion'],
    tierBehavior: { basic: 'Use simplified account cards.', pro: 'Use D3/Remotion money flow.', premium: 'Use richer evidence flow and QA.' },
    fallback: ['Use static evidence cards.', 'Use simpler step-by-step flow.'],
    qaChecks: ['Money labels are source-aware.', 'Arrow direction is clear.'],
  },
  {
    id: 'account_flow_diagram',
    label: 'Account flow diagram',
    defaultToolPreference: 'd3',
    defaultAnimationType: 'arrow_flow',
    preferredLayoutModes: ['full_evidence_board', 'voiceover_visual_takeover'],
    preferredTools: ['d3', 'remotion'],
    tierBehavior: { basic: 'Use few account cards.', pro: 'Use controlled arrows and labels.', premium: 'Use richer network/evidence flow.' },
    fallback: ['Use table card.', 'Use simplified evidence board.'],
    qaChecks: ['Accounts are not invented.', 'Claims are safely worded.'],
  },
  {
    id: 'process_step_diagram',
    label: 'Process step diagram',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'step_reveal',
    preferredLayoutModes: ['full_graphic_explainer', 'lower_visual_panel', 'voiceover_visual_takeover'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use simple step cards.', pro: 'Use step reveal with optional D3 support.', premium: 'Use multi-stage sequence build.' },
    fallback: ['Use list card.', 'Use simpler lower panel.'],
    qaChecks: ['Step order is clear.', 'Labels are readable.'],
  },
  {
    id: 'timeline_diagram',
    label: 'Timeline diagram',
    defaultToolPreference: 'd3',
    defaultAnimationType: 'timeline_slide',
    preferredLayoutModes: ['full_evidence_board', 'full_graphic_explainer', 'voiceover_visual_takeover'],
    preferredTools: ['d3', 'remotion'],
    tierBehavior: { basic: 'Use simple timeline cards.', pro: 'Use controlled timeline motion.', premium: 'Use richer case timeline sequence.' },
    fallback: ['Use static timeline card.', 'Use fewer dates.'],
    qaChecks: ['Dates are source-aware.', 'Timeline order is clear.'],
  },
  {
    id: 'before_after_comparison',
    label: 'Before/after comparison',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'card_pop',
    preferredLayoutModes: ['before_after_panel', 'split_screen_comparison'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use simple before/after card.', pro: 'Use split comparison.', premium: 'Use polished comparison sequence.' },
    fallback: ['Use two cards.', 'Use simple metric card.'],
    qaChecks: ['Claims are source-aware.', 'Before/after labels are exact.'],
  },
  {
    id: 'metric_card',
    label: 'Metric card',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'count_up',
    preferredLayoutModes: ['lower_visual_panel', 'full_graphic_explainer'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use simple metric card.', pro: 'Use count-up with QA.', premium: 'Use metric sequence with stronger QA.' },
    fallback: ['Use static number card.', 'Use list card.'],
    qaChecks: ['Metric source is clear.', 'Mock/example value is marked.'],
  },
  {
    id: 'bar_chart',
    label: 'Bar chart',
    defaultToolPreference: 'echarts',
    defaultAnimationType: 'bar_grow',
    preferredLayoutModes: ['full_graphic_explainer', 'voiceover_visual_takeover'],
    preferredTools: ['echarts', 'remotion'],
    tierBehavior: { basic: 'Use simple two/three bar chart.', pro: 'Use ECharts/Remotion chart.', premium: 'Use chart sequence and QA.' },
    fallback: ['Use metric card.', 'Use simple table card.'],
    qaChecks: ['Axis labels are readable.', 'Values are source-aware.'],
  },
  {
    id: 'line_chart',
    label: 'Line chart',
    defaultToolPreference: 'echarts',
    defaultAnimationType: 'line_draw',
    preferredLayoutModes: ['full_graphic_explainer', 'voiceover_visual_takeover'],
    preferredTools: ['echarts', 'remotion'],
    tierBehavior: { basic: 'Use simple trend card.', pro: 'Use line draw chart.', premium: 'Use annotated data story.' },
    fallback: ['Use metric card.', 'Use static trend card.'],
    qaChecks: ['Trend is not invented.', 'Axis labels are readable.'],
  },
  {
    id: 'pie_or_donut_chart',
    label: 'Pie or donut chart',
    defaultToolPreference: 'echarts',
    defaultAnimationType: 'card_pop',
    preferredLayoutModes: ['full_graphic_explainer', 'lower_visual_panel'],
    preferredTools: ['echarts', 'remotion'],
    tierBehavior: { basic: 'Use simple split metric.', pro: 'Use ECharts donut.', premium: 'Use annotated breakdown.' },
    fallback: ['Use table card.', 'Use metric cards.'],
    qaChecks: ['Percentages are exact or marked approximate.', 'Legend is readable.'],
  },
  {
    id: 'table_card',
    label: 'Table card',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'static_hold',
    preferredLayoutModes: ['lower_visual_panel', 'full_graphic_explainer'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use compact table/list.', pro: 'Use structured table card.', premium: 'Use richer table/annotation card.' },
    fallback: ['Use bullet list.', 'Reduce rows.'],
    qaChecks: ['Rows fit safely.', 'Cells remain readable.'],
  },
  {
    id: 'network_graph',
    label: 'Network graph',
    defaultToolPreference: 'd3',
    defaultAnimationType: 'node_pop',
    preferredLayoutModes: ['full_evidence_board', 'voiceover_visual_takeover'],
    preferredTools: ['d3', 'remotion'],
    tierBehavior: { basic: 'Avoid complex networks; use cards.', pro: 'Use simple network only if needed.', premium: 'Use advanced network with QA.' },
    fallback: ['Use money flow diagram.', 'Use evidence board.'],
    qaChecks: ['Relationships are source-aware.', 'Network density stays readable.'],
  },
  {
    id: 'evidence_flow_diagram',
    label: 'Evidence flow diagram',
    defaultToolPreference: 'd3',
    defaultAnimationType: 'sequence_build',
    preferredLayoutModes: ['full_evidence_board', 'voiceover_visual_takeover'],
    preferredTools: ['d3', 'remotion'],
    tierBehavior: { basic: 'Use simple evidence cards.', pro: 'Use controlled evidence flow.', premium: 'Use detailed case flow.' },
    fallback: ['Use static evidence board.', 'Use timeline diagram.'],
    qaChecks: ['Claims are neutral.', 'Source-needed evidence is marked.'],
  },
  {
    id: 'claim_support_diagram',
    label: 'Claim support diagram',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'step_reveal',
    preferredLayoutModes: ['full_evidence_board', 'full_graphic_explainer'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use neutral claim card.', pro: 'Use support diagram.', premium: 'Use evidence sequence with QA.' },
    fallback: ['Use fact card.', 'Use neutral name/card stack.'],
    qaChecks: ['Claim status is clear.', 'Allegations are not verified visually.'],
  },
  {
    id: 'feature_comparison',
    label: 'Feature comparison',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'step_reveal',
    preferredLayoutModes: ['split_screen_comparison', 'full_graphic_explainer'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use simple feature cards.', pro: 'Use clean comparison.', premium: 'Use polished product comparison.' },
    fallback: ['Use list card.', 'Use metric card.'],
    qaChecks: ['Feature facts are exact.', 'Comparison remains readable.'],
  },
  {
    id: 'document_breakdown_card',
    label: 'Document breakdown card',
    defaultToolPreference: 'remotion_only',
    defaultAnimationType: 'highlight_pulse',
    preferredLayoutModes: ['full_evidence_board', 'voiceover_visual_takeover'],
    preferredTools: ['remotion'],
    tierBehavior: { basic: 'Use simple source card.', pro: 'Use highlighted breakdown.', premium: 'Use evidence board sequence.' },
    fallback: ['Use fact card.', 'Use timeline card.'],
    qaChecks: ['Document claims are safely worded.', 'Highlight does not imply unsupported facts.'],
  },
]

export function getDataVizStylePreset(styleFamily: DataVizStyleFamily) {
  return dataVizStylePresets.find((preset) => preset.id === styleFamily) ?? dataVizStylePresets[0]
}

export function getDataVizVisualPreset(visualType: DataVizVisualType) {
  return dataVizVisualPresets.find((preset) => preset.id === visualType) ?? dataVizVisualPresets[0]
}

export function getDefaultDataVizStyleForCategory(params: {
  category: EditingCategory
  customInstructions?: string
}) {
  const text = params.customInstructions?.toLowerCase() ?? ''

  if (/money|scam|account|transfer|fraud|flow/.test(text)) return 'money_flow_evidence'
  if (params.category === 'documentary_case_study') return 'documentary_evidence_diagram'
  if (params.category === 'education_explainer') return /step|process|framework|tutorial/.test(text) ? 'education_step_by_step' : 'clean_visual_explain'
  if (params.category === 'business_brand') return /feature|compare|product|plan/.test(text) ? 'premium_product_comparison' : 'business_dashboard'
  if (params.category === 'lifestyle') return 'minimalist_table_card'
  if (params.category === 'storytelling') return 'cinematic_story_diagram'
  return 'clean_visual_explain'
}

export function getPreferredToolForVisualType(visualType: DataVizVisualType): DataVizToolPreference {
  if (visualType === 'area_chart' || visualType === 'funnel_chart' || visualType === 'gauge_chart') return 'echarts'
  if (visualType === 'hierarchy_tree' || visualType === 'cause_effect_diagram') return 'd3'
  return getDataVizVisualPreset(visualType).defaultToolPreference
}
