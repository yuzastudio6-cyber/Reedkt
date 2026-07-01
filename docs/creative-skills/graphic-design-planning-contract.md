# Graphic Design Planning Contract

## Purpose

This document defines the graphic-design-specific planning contract for future ReeditPro Graphic Design / VisualExplain skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, package changes, Supabase connections, SQL, credentials, browser/WebGL/canvas runtime, Playwright execution, AI calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It inherits screen/composition safety from [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) wherever graphic design becomes a visual layer in the frame.

This document defines graphic-design-specific fields and rules that future docs, types, schema, workers, and QA systems must follow when Graphic Design / VisualExplain work is eventually implemented.

## Graphic Design / VisualExplain Doctrine

Graphic Design / VisualExplain is not "put text on screen."

Graphic design must not be random decoration. It should clarify ideas, structure information, highlight proof, explain concepts, frame product features, support story meaning, or create premium visual emphasis.

Graphic design should use hierarchy, spacing, layout, readability, and restraint. A graphic should support the speaker or footage, not fight it. A premium graphic system can be visually rich, but every element needs a job. A no-graphic decision can be professional when the footage or emotion already carries the moment.

Core principle:

"Every graphic must know what viewer understanding it improves."

## Universal And Overlay Contract Inheritance

Every `GraphicDesignSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope where relevant.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

Graphic design plans inherit these visual-layer concepts from RP-SKILLS-04 when the graphic appears in frame:

- Overlay role.
- Screen zone.
- Safe area.
- Face/object/caption collision planning.
- Edge treatment.
- Blend, opacity, shadow, and contact behavior.
- Layer order.
- Aspect ratio behavior.
- Source status and redaction where relevant.

The graphic design contract adds:

- Information hierarchy.
- Graphic role.
- Layout family.
- Text/content structure.
- Typography intent.
- Design density.
- Visual system/style intent.
- Diagram, card, callout, comparison, and proof structure.
- Relationship to captions and spoken transcript.
- Source/proof safety.
- Graphic-specific QA.

Do not duplicate the full universal or overlay/compositing contracts except when referencing inheritance.

## Graphic Design Roles

These roles are planning guidance, not hard-coded execution.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `no_graphic_design` | Intentional absence of graphic design. | Emotional moments, strong source footage, clean edits. | When a concept genuinely needs structure. | `none` | A valid professional decision. |
| `lower_third_identity` | Name, role, place, or context label. | Interviews, testimonials, personal brand. | Dense captions or emotional close-ups. | `none` / `low` | Must coordinate with captions. |
| `title_or_chapter_card` | Section title or chapter marker. | Education, podcasts, webinars, case studies. | Fast proof beats or overuse. | `low` | May coordinate with transitions and SFX. |
| `key_phrase_card` | Designed emphasis for one important phrase. | Social clips, marketing, education. | Repeating captions without added value. | `low` | Should clarify or punctuate. |
| `feature_callout` | Label or mini-card tied to a product/detail. | Product demos, property tours, tutorials. | Covering the feature or action. | `low` | Needs object/screen relationship. |
| `product_feature_breakdown` | Structured feature card or panel. | Product demos, SaaS, launch videos. | Unverified feature claims. | `low` / `medium` | Source status matters. |
| `proof_card` | Claim, result, quote, statistic, or evidence card. | Case studies, ads, business proof. | Unknown source or sensitive data. | `low` / `medium` | Needs safe wording and source status. |
| `testimonial_quote_card` | Quote or customer statement card. | Testimonials and case studies. | Invented quote or unsupported attribution. | `low` / `medium` | Must preserve authenticity. |
| `offer_or_cta_card` | Offer, call to action, deadline, or next step. | Ads, launches, sales clips. | Unapproved price/claim or too much text. | `low` / `medium` | Exact offer text should be user/source-provided. |
| `comparison_layout` | Side-by-side or multi-option comparison. | Before/after, pricing tiers, pros/cons. | Dense short-form screen or unverifiable facts. | `medium` | Read time is critical. |
| `before_after_layout` | Explicit before/after structure. | Product transformation, property renovation, results. | Unsupported result claims. | `medium` | Source/proof safety required. |
| `framework_diagram` | Named framework or concept map. | Education, consulting, business explainers. | Too many nodes for duration. | `medium` | Exact text and arrows should be controlled. |
| `step_by_step_layout` | Ordered steps or sequence. | Tutorials, recipes, onboarding. | When action footage already explains it. | `low` / `medium` | Must match transcript order. |
| `process_diagram` | Flow, pipeline, funnel, or system view. | Explainers, SaaS, operations, finance. | Unverified or overly complex flows. | `medium` | Controlled diagram tools may be best later. |
| `timeline_card` | Sequence of events or milestones. | Case studies, documentaries, history. | Unclear dates or crowded labels. | `medium` | Source chronology must be safe. |
| `data_chart_card` | Chart, metric, graph, or data display. | Business proof, finance, analytics. | Invented data or tiny unreadable labels. | `medium` | Exact data should use verified/controlled sources. |
| `metric_card` | One or a few standout numbers. | Ads, proof, product results. | Unverified claims or missing context. | `low` / `medium` | Include source/context when needed. |
| `map_or_location_card` | Map, location, route, or geography card. | Travel, real estate, logistics. | Invented routes or private addresses. | `medium` | Source and privacy matter. |
| `browser_app_annotation` | Graphic annotation over screen/app/browser content. | SaaS demos, tutorials, dashboards. | Invented exact UI or private data. | `medium` | Requires source/redaction planning. |
| `UI_feature_label` | UI label attached to app controls or screen areas. | Product walkthroughs, tutorials. | Unverified labels or changing UI. | `low` / `medium` | Use actual source content. |
| `educational_label_system` | Reusable labels for concepts/examples. | Lessons, explainers, training. | Too many labels at once. | `low` / `medium` | Hierarchy and captions must align. |
| `icon_and_label_system` | Icon plus label vocabulary. | Social, product, education, brand moments. | Generic icon clutter. | `low` / `medium` | Icons need purpose. |
| `visual_metaphor_panel` | Designed metaphor or symbolic panel. | Complex ideas, brand storytelling. | When literal proof is needed. | `medium` / `high` | Must not replace clarity. |
| `social_proof_stack` | Stack of logos, quotes, reviews, or proof points. | Marketing, case studies, launch clips. | Unverified logos/reviews. | `medium` | Permission/source checks may apply later. |
| `compliance_or_disclaimer_card` | Legal, medical, finance, claim, or caution text. | Sensitive claims or regulated topics. | Tiny unreadable disclaimer. | `low` / `medium` | Must be readable if included. |
| `brand_style_moment` | Polished branded graphic beat. | Premium intro, CTA, launch, signature moment. | Decorative-only design. | `medium` / `high` | Brand/context should drive style. |

## When To Use Graphic Design

Graphic Design / VisualExplain is appropriate when:

- A spoken concept needs structure.
- The viewer needs clarity or hierarchy.
- A product feature needs naming or explanation.
- Proof, result, or metric needs emphasis.
- A testimonial needs identity or context.
- A marketing offer or CTA needs framing.
- Education/explainer content needs a diagram or labels.
- Browser/app visual needs annotations.
- Comparison or before/after content needs layout.
- B-roll needs a context label.
- A complex idea needs simplification.
- User edit preference supports graphic design.
- Reference DNA suggests graphic language without copying.
- Platform benefits from readable visual information.
- A premium brand moment needs polished graphic treatment.

## When To Avoid Graphic Design

Graphic Design / VisualExplain should be avoided or minimized when:

- The user requested no extra visuals.
- Footage already communicates clearly.
- The graphic would repeat spoken words without adding clarity.
- The graphic would cover face, expression, product, or action.
- The graphic would collide with captions or 3D/Real Motion.
- The graphic would make a premium edit feel cluttered.
- Graphic density is too high for platform/aspect ratio.
- Source/proof is unclear.
- The graphic would imply unverified evidence.
- A serious emotional pause needs restraint.
- The same card/layout pattern has been overused.
- Credit budget does not justify complex generated graphics.
- The graphic is only decoration.
- Exact data/source cannot be verified.

## Information Hierarchy Model

Graphic information hierarchy levels:

| Level | Meaning |
| --- | --- |
| `primary_message` | The main idea the viewer should understand immediately. |
| `secondary_support` | Supporting copy, detail, or proof that helps the main idea. |
| `tertiary_detail` | Optional detail that should not compete with the main line. |
| `label` | Short naming or identification text. |
| `source_or_context_note` | Source, context, or attribution note. |
| `disclaimer_or_caution` | Required caution, qualification, or claim note. |
| `CTA` | Action the viewer should take. |

The primary message should be immediately readable. Secondary support should not compete with the main line. Tertiary detail should be used carefully on short-form video. Source/context/disclaimer text must be readable if used. Hierarchy must reflect platform, duration, and viewer attention. A graphic should not attempt to say everything.

## GraphicInformationHierarchyPlan Pseudo-Record

`GraphicInformationHierarchyPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `primary_message` | Required | Main readable message. | `Three steps to protect your account` |
| `secondary_support` | Optional | Supporting line or proof. | `Check the sender, link, and login page.` |
| `tertiary_detail` | Optional | Extra detail when duration allows. | `Use a password manager to confirm domains.` |
| `label_text` | Optional | Short label or category. | `Security checklist` |
| `source_or_context_note` | Required when relevant | Source, attribution, or context note. | `Based on the user's transcript claim.` |
| `disclaimer_text` | Required when relevant | Disclaimer or caution text. | `Example only; not legal advice.` |
| `CTA_text` | Optional | Call-to-action text. | `Download the checklist` |
| `hierarchy_reason` | Required | Why this hierarchy fits the beat. | `The viewer needs the three actions, not all background detail.` |
| `expected_read_time_seconds` | Required | Estimated reading time. | `2.5` |
| `must_match_transcript` | Required | Whether wording must match speech exactly. | `false` |
| `exact_text_required` | Required | Whether exact text/source is required. | `true for CTA and metric` |

## Layout Families

Layout selection must respect screen zones, safe areas, collision rules, layer order, and source status from RP-SKILLS-04.

| Layout family | What it is | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `lower_third_layout` | Identity or context band. | Names, roles, locations. | Caption-heavy moments. | Keep compact. |
| `title_card_layout` | Full or partial title card. | Chapter breaks, lessons, podcasts. | Fast proof moments. | Can pair with transition. |
| `side_card_layout` | Card on left or right side. | Talking head plus explanation. | Tight vertical frames with centered face. | Use safe side space. |
| `top_band_layout` | Band across top. | Section labels, location, short context. | Platform UI conflicts. | Needs headroom check. |
| `bottom_band_layout` | Band across bottom. | Captions-free moments, offers. | Caption collisions. | Captions usually win. |
| `split_screen_layout` | Frame split into source and graphic. | Product demos, comparison, education. | Emotional close-ups. | Needs aspect-ratio planning. |
| `picture_in_picture_label_layout` | PIP plus label/caption. | Speaker with B-roll or screen. | Small unreadable source. | Coordinate with B-roll. |
| `callout_pin_layout` | Pin/line/label attached to object/UI. | Features, tutorials, property details. | Weak anchor or tracking need. | Avoid covering target. |
| `modular_card_stack` | Multiple stacked cards. | Steps, proof points, social posts. | Short duration with too much text. | Stagger later via motion design. |
| `grid_layout` | Cards in rows/columns. | Comparisons, options, feature sets. | Mobile clutter. | Use sparingly on 9:16. |
| `comparison_columns` | Side-by-side columns. | Before/after, pros/cons, tiers. | Long text or tiny labels. | Strong hierarchy required. |
| `before_after_split` | Before/after split. | Transformations, results, renovations. | Unverified before/after. | Source/proof safety required. |
| `timeline_layout` | Ordered events over time. | Case studies, history, process. | Unknown dates or dense events. | Use source notes. |
| `step_ladder_layout` | Step sequence with vertical/horizontal climb. | Tutorials, frameworks. | Too many steps. | Match transcript order. |
| `flow_diagram_layout` | Nodes, arrows, process flow. | Systems, finance, workflows. | Unverified relationships. | Controlled diagram tools later. |
| `radial_or_orbit_layout` | Center concept with orbiting items. | Frameworks, brand explainers. | Dense labels or serious proof. | Needs generous space. |
| `dashboard_metric_layout` | Metrics in dashboard-like cards. | Analytics, SaaS, business results. | Invented dashboards or metrics. | Exact data required. |
| `browser_annotation_layout` | Annotation over/around browser/app frame. | Product walkthroughs. | Unapproved screen content. | Source status and redaction required. |
| `evidence_board_layout` | Evidence items organized visually. | Documentary/case study. | Sensational or unclear proof. | Neutral wording matters. |
| `product_callout_layout` | Product image/video with labels. | Product demos and launches. | Covering hands/action. | Object-safe placement. |
| `full_frame_takeover` | Graphic temporarily takes whole frame. | Hero title, diagram, CTA. | Speech-heavy or emotional moments. | Needs read-time and transition plan. |
| `minimal_label_only` | One small label. | Clean edits, context, B-roll. | Complex ideas needing structure. | Often best for restraint. |

## Typography Intent Model

This document does not define actual fonts or tokens. Future UI/design work must respect `design.md`.

Typography planning concepts:

| Concept | Planning intent |
| --- | --- |
| `readability_priority` | How strongly readability dominates style. |
| `font_personality` | Tone such as premium, educational, corporate, playful, cinematic, or social. |
| `weight_intent` | Light, regular, medium, bold, or mixed emphasis. |
| `size_intent` | Relative sizing for hierarchy and platform. |
| `line_break_strategy` | How copy breaks into readable chunks. |
| `contrast_strategy` | Contrast against footage and panels. |
| `emphasis_strategy` | How key words/numbers are emphasized. |
| `casing_strategy` | Sentence case, title case, all caps, or mixed. |
| `numeric_display_strategy` | How numbers, metrics, prices, and percentages appear. |
| `accessibility_notes` | Legibility, contrast, motion sensitivity, and language notes. |
| `platform_readability_notes` | Mobile/desktop/short-form readability constraints. |

The planner should describe typography intent, not invent random brand styling. Text must remain readable at target platform and aspect ratio.

## Graphic Density Model

Density should match edit preference, platform, and segment meaning. Rich graphics can be professional when the segment earns them. Overcrowding is amateur. Under-designing a premium/wow moment can also be a miss.

| Density | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No graphic design. | Emotional close-up, strong source footage. | Can miss needed explanation. | No graphic during client emotion. |
| `minimal` | One small label or lower third. | Clean edits, brief context. | May under-explain complex ideas. | Minimal lower third. |
| `restrained` | Polished but quiet graphic support. | Premium real estate, testimonial, product note. | Can feel too subtle for education. | Soft feature label. |
| `balanced` | Clear graphic system with limited elements. | Education, social, product demos. | Can crowd captions if unmanaged. | Three-step card with captions below. |
| `rich` | Layered cards, labels, diagrams, or proof. | Complex explainers and high-value ads. | Busy/template feeling. | Product demo with callouts and proof card. |
| `hero` | Graphic is the main visual moment. | Framework reveal, major CTA, proof result. | Expensive and distracting if unearned. | Full-frame premium offer card. |

## Visual System / Style Intent

Style intent should come from user instructions, edit preference, workflow, brand context, and Reference DNA. Reference DNA guides style but must not be copied shot-for-shot or cloned exactly.

| Style intent | Meaning | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `clean_minimal` | Sparse, quiet, highly readable. | Clean edits, professional talking head. | High-energy social if too plain. | Restraint-first. |
| `premium_glass` | Translucent, spacious, polished. | Luxury, tech, premium property. | Busy footage or low contrast. | Must remain readable. |
| `editorial_modern` | Magazine-like structure and type hierarchy. | Thought leadership, documentaries. | Fast CTA moments. | Strong hierarchy. |
| `bold_social` | High contrast, energetic, direct. | Shorts, ads, viral clips. | Serious/emotional content. | Readability over noise. |
| `educational_clear` | Simple structure for learning. | Lessons, frameworks, step-by-step. | Premium brand moments needing atmosphere. | Clarity wins. |
| `corporate_polished` | Trust-building, clean business style. | SaaS, enterprise, finance. | Playful creator content. | Avoid gimmicks. |
| `cinematic_subtle` | Minimal text with filmic support. | Documentary, testimonial, real estate. | Dense explainers. | Let footage breathe. |
| `playful_shapes` | Friendly shapes/icons/labels. | Youth, lifestyle, creator education. | Serious proof or legal-sensitive claims. | Use with intent. |
| `luxury_real_estate` | Spacious, refined property language. | Property tours and premium listings. | Fast social clutter. | Soft labels, restrained cards. |
| `tech_product` | Clean UI/product-forward design. | SaaS, app demos, launch clips. | Organic lifestyle footage unless intentional. | Source status matters. |
| `documentary_evidence` | Neutral fact/proof style. | Case studies, investigations, evidence. | Sensational claims. | Facts separated from interpretation. |
| `browser_ui_clean` | Browser/app native-feeling annotations. | Tutorials and product walkthroughs. | Invented screens. | Exact UI cannot be invented. |
| `custom_brand_aligned` | User/brand-specific design intent. | Brand kit or enterprise projects. | No brand context available. | Does not create tokens here. |

## Graphic Content / Source / Proof Safety

Graphic planning must classify content/source status:

| Source status | Planning rule |
| --- | --- |
| `user_provided_text` | Use exact text where provided and approved. |
| `transcript_derived_text` | Summarize or quote only with transcript alignment. |
| `inferred_summary` | Use safe wording and avoid unsupported facts. |
| `verified_source` | Use source with provenance and context. |
| `claimed_source` | Treat as claim; use cautious wording. |
| `unknown_source` | Avoid proof claims or request confirmation later. |
| `mock_only` | Label/handle as mock, not evidence. |
| `needs_user_confirmation` | Do not present as final proof. |
| `sensitive_or_private_data` | Protect private data. |
| `redaction_required` | Plan redaction before visual use. |
| `safe_wording_required` | Avoid absolute claims and unsupported certainty. |

Rules:

- Do not invent exact metrics, prices, UI labels, testimonials, claims, dashboards, evidence pages, or product facts.
- If a graphic summarizes a claim from the user/transcript, label the source status when necessary.
- Browser/app graphics must respect browser/app capture planning boundaries.
- Sensitive data requires redaction planning.
- Unverified proof should use safe wording.
- Compliance/disclaimer needs must be captured if the user or content implies claims sensitivity.

Requested browser-capture reading files are not present in this repo snapshot: `browser-app-capture-planning.md`, `browser-capture-settings-catalog.md`, and `src/lib/browser-capture-planner.ts`. Future browser/app graphic work should reconcile that absence before claiming a browser capture planning contract exists.

## Relationship To Captions

Graphic Design / VisualExplain coordinates with captions:

- Captions may carry speech; graphics should not duplicate every caption.
- Graphic text and captions must not compete for the same safe zone.
- Caption density may reduce during a hero graphic moment.
- Graphic labels may replace caption emphasis only if speech remains accessible.
- Captions must remain readable.
- Graphic animation should not distract from reading captions.
- Keyword emphasis should not conflict with graphic hierarchy.

Full caption contract belongs to RP-SKILLS-09.

## Relationship To Overlays And Compositing

Graphic design uses RP-SKILLS-04 for:

- Screen zone.
- Edge treatment.
- Safe area.
- Face/object/caption collision.
- Blend, opacity, shadow, and contact behavior.
- Layer order.
- Aspect ratio.
- Source status and redaction.

This document defines graphic-specific usage. It does not duplicate the full overlay/compositing contract.

## Relationship To Motion Design

Graphic design can be static or animated later. Motion design may define:

- Reveal timing.
- Slide/fade/draw-on.
- Staggered cards.
- Diagram build.
- Chart count-up.
- Callout pin motion.
- Emphasis pulse.
- Exit behavior.

Motion must support hierarchy. Animated graphics should not become random movement. Full motion design contract belongs to RP-SKILLS-06.

## Relationship To 3D Visuals

Graphic design coordinates with 3D:

- A 3D hero visual may need reduced graphic text.
- Graphic labels can annotate 3D objects.
- A 3D product breakout may use graphic callout labels.
- Graphic panels can be a lower-cost alternative to 3D.
- 3D should not fight dense text.
- Graphic design can frame a 3D moment with title/CTA only.

Full 3D visual contract belongs to RP-SKILLS-07.

## Relationship To B-Roll And Browser/App Visuals

Graphic design coordinates with B-roll and browser/app visuals:

- B-roll may need labels, proof cards, or context frames.
- Browser/app captures may need annotation graphics.
- Exact screen content must not be AI-invented.
- Source status and redaction matter.
- A graphic can become a screen-safe frame around B-roll or browser visuals.
- Full B-roll contract belongs to RP-SKILLS-08.
- Browser/app capture planning remains a separate source-of-truth.

## Relationship To SoundSync / Music / SFX

Graphic reveals can have subtle SFX if useful. SFX should not be automatic and must not hit under important speech. Music beats may anchor graphic reveal timing. Some graphics should appear silently for seriousness or premium restraint.

Full sound/music contract belongs to RP-SKILLS-10.

## Relationship To Workflow Context

| Workflow context | Likely graphic behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | No graphic or minimal lower third. | Heavy cards, diagrams, generated assets. | Clean can be professional. |
| Social Short / Viral Clip | Key phrase cards, bold labels, proof snippets. | Overcrowded text or unreadable motion. | Platform readability matters. |
| Talking Head / Personal Brand | Lower thirds, quote cards, restrained proof. | Hiding expression or trust signals. | Speaker remains primary. |
| Podcast Clip | Chapter cards, quote cards, proof/context panels. | Dense visual systems under fast speech. | Rhythm comes from speech. |
| Vlog / Lifestyle | Location/product labels and light context cards. | Corporate diagram language. | Keep natural footage primary. |
| Product Demo | Feature breakdowns, UI labels, browser annotations. | Invented UI or covering demo action. | Source status required. |
| Real Estate / Property Tour | Soft feature callouts and premium labels. | Flashy social cards. | Spatial calm matters. |
| Education / Explainer | Framework diagrams, steps, labels, comparisons. | Decorative cards that do not teach. | Clarity and hierarchy win. |
| Marketing Ad | Offer, CTA, proof, social proof, feature cards. | Unsupported claims or generic templates. | Approval for premium/generated work. |
| Testimonial / Case Study | Quote card, identity, result/proof card. | Hiding emotion or inventing claims. | Authenticity matters. |
| Custom / Let AI Decide | Score against clarity, preference, platform, source, and budget. | Defaulting to graphic design without reason. | Explain the plan. |

## Relationship To Edit Preference

Direct user instruction overrides defaults.

| Edit preference | Graphic design guidance |
| --- | --- |
| No extra visuals | Avoid graphics except required labels/identity if user approves. |
| Keep visuals minimal | Small labels/lower thirds only where useful. |
| Balanced visual mix | Graphics support key moments without taking over. |
| More graphic design | Stronger callouts, diagrams, cards, and layouts where they clarify. |
| More Stroke Motion | Keep graphics from competing with story animation. |
| Real Motion if useful | Graphics may annotate Real Motion/3D but should not clutter. |
| Premium/luxury | Restrained, spacious, polished graphic language. |
| Energetic/social | Bolder graphic rhythm if readability stays high. |
| Educational | Clear hierarchy, diagrams, labels, frameworks. |
| Corporate | Clean, trust-building, not gimmicky. |

## GraphicDesignTimingPlan Pseudo-Record

`GraphicDesignTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `graphic_start_seconds` | Required | Start time for the graphic. | `18.2` |
| `graphic_end_seconds` | Required | End time for the graphic. | `22.0` |
| `duration_seconds` | Required | Planned duration. | `3.8` |
| `entry_timing` | Required | How the graphic appears. | `after_concept_phrase` |
| `hold_timing` | Required | How long the graphic remains readable. | `hold_through_three_steps` |
| `exit_timing` | Required | How the graphic leaves. | `exit_before_next_question` |
| `transcript_anchor_text` | Optional | Spoken phrase anchor. | `"three things to check"` |
| `transcript_anchor_id` | Optional | Transcript anchor reference. | `transcript_05_phrase_01` |
| `story_beat_anchor_id` | Optional | Story beat anchor. | `beat_framework_intro` |
| `music_beat_anchor` | Optional | Music cue/beat anchor. | `downbeat_08` |
| `caption_relationship_timing` | Required | Relationship to captions. | `caption density reduced during card hold` |
| `transition_relationship` | Required | Relationship to transitions. | `card clears before graphic wipe` |
| `read_time_seconds` | Required | Estimated read time. | `2.9` |
| `pre_entry_buffer` | Optional | Buffer before entry. | `0.2s` |
| `post_exit_buffer` | Optional | Buffer after exit. | `0.3s` |
| `sync_precision_needed` | Required | Needed precision. | `phrase` |

## GraphicDesignStructurePlan Pseudo-Record

`GraphicDesignStructurePlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `graphic_role` | Required | Planned graphic role. | `framework_diagram` |
| `layout_family` | Required | Layout family. | `flow_diagram_layout` |
| `visual_style_intent` | Required | Style intent. | `educational_clear` |
| `information_hierarchy` | Required | Hierarchy plan reference or summary. | `primary concept plus three labels` |
| `primary_message` | Required | Main line. | `Follow the money` |
| `secondary_support` | Optional | Supporting text. | `Three account hops reveal the pattern.` |
| `supporting_elements` | Optional | Icons, arrows, chips, cards, lines. | `three account nodes, arrows, warning label` |
| `icon_or_shape_system` | Optional | Shape/icon strategy. | `simple numbered circles and arrows` |
| `data_or_metric_elements` | Optional | Data/metric elements. | `none; no numbers claimed` |
| `source_or_context_note` | Required when relevant | Source/context text. | `Illustrative flow based on transcript.` |
| `typography_intent` | Required | Typography plan. | `bold primary, medium labels, high contrast` |
| `density_level` | Required | Graphic density. | `balanced` |
| `readability_strategy` | Required | How text remains readable. | `short labels, 3.5s hold, high contrast` |
| `caption_relationship` | Required | Relationship to captions. | `captions pause keyword emphasis during diagram hold` |
| `overlay_composition_reference` | Required | Link to overlay/safe-zone plan concept. | `side_card_layout, caption_safe_zone preserved` |
| `motion_design_relationship` | Required | Static/animated relationship. | `future staggered arrow build, no runtime now` |
| `source_status` | Required | Source/proof status. | `transcript_derived_text` |
| `approval_notes` | Required | Approval/credit notes. | `low credit static card; no generation approval needed` |

## GraphicDesignSkillPlan Pseudo-Record

`GraphicDesignSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code. It includes universal fields by reference and adds graphic-design-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable graphic design plan identifier. | `graphic_segment_05_framework` |
| `project_id` | Required | Project that owns the plan. | `project_training_video` |
| `edit_plan_id` | Required | Edit plan containing the graphic. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Segment where graphic is planned. | `segment_05` |
| `skill_key` | Required | Skill key. | `graphic_design_visual_explain` |
| `graphic_role` | Required | Graphic role. | `framework_diagram` |
| `graphic_purpose` | Required | What the graphic improves. | `Makes the three-step framework understandable.` |
| `planning_reason` | Required | Editorial reason. | `The speaker lists three checks quickly, so a diagram helps retention.` |
| `restraint_decision` | Required | Universal restraint decision. | `use_full` |
| `visual_density_level` | Required | Density level. | `balanced` |
| `layout_family` | Required | Layout family. | `step_ladder_layout` |
| `visual_style_intent` | Required | Visual style intent. | `educational_clear` |
| `primary_message` | Required | Primary message. | `3 checks before you click` |
| `secondary_support` | Optional | Secondary message. | `Sender, link, login page` |
| `information_hierarchy_summary` | Required | Hierarchy summary. | `Primary headline plus three labels, no tertiary detail.` |
| `typography_intent` | Required | Typography intent. | `large headline, medium labels, high contrast` |
| `readability_strategy` | Required | Readability strategy. | `short lines, 3s hold, central safe zone` |
| `screen_zone` | Required | Screen zone inherited from overlay contract. | `right_third` |
| `safe_area_strategy` | Required | Safe-area plan. | `avoid face and bottom captions` |
| `caption_relationship` | Required | Caption relationship. | `captions stay lower safe, no duplicate keywords` |
| `overlay_composition_plan_id` | Optional | Future overlay composition plan reference. | `overlay_comp_segment_05` |
| `source_status` | Required | Source/proof status. | `transcript_derived_text` |
| `proof_or_claim_safety_notes` | Required when relevant | Claim/source safety notes. | `No exact metric; illustrative only.` |
| `motion_design_relationship` | Required | Motion relationship. | `static now; future simple step reveal` |
| `audio_relationship_summary` | Required when relevant | SoundSync/SFX/music relationship. | `No SFX under speech; optional soft reveal after phrase.` |
| `credit_impact` | Required | Credit impact. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | QA checks. | `readability, caption_safe, hierarchy_clear` |
| `revision_options` | Required | Safe revision choices. | `simplify, move, reduce text, remove` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved plan by ID; no prompt-only execution.` |
| `must_follow_rules` | Required | Non-negotiable constraints. | `Do not invent metrics; do not cover captions.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid generic text box and copied reference layout.` |
| `status` | Required | Planning status. | `selected` |
| `metadata_json` | Optional | Documentation-only placeholder. | `{ "source": "docs-only example" }` |

## Graphic Design Scoring Model

Future planners should score graphic design candidates before selecting or rejecting them.

Positive signals:

- Concept needs clarity.
- Proof/result needs emphasis.
- Product feature needs label.
- Viewer needs hierarchy.
- Workflow context benefits from graphics.
- User preference supports graphic design.
- Safe screen space exists.
- Reference DNA suggests graphic language without copying.
- Graphic improves comprehension.
- Graphic can be read within available time.
- Graphic can coexist with captions and speaker.

Negative signals:

- User requested no/minimal visuals.
- Graphic duplicates captions without added value.
- Face/product/action/caption collision.
- Clutter risk.
- Repeated layout family.
- Text too dense for duration/platform.
- Source/proof ambiguity.
- Compliance/claim sensitivity.
- Credit budget too low.
- Tone mismatch.
- Graphic would be decoration only.

Pseudo formula:

```text
graphic_design_score =
  clarity_gain
+ hierarchy_need
+ proof_or_feature_need
+ screen_fit
+ user_preference_fit
+ workflow_fit
+ reference_dna_fit
+ visual_polish_gain
- readability_risk
- collision_risk
- clutter_risk
- repetition_penalty
- source_status_risk
- credit_penalty
- tone_mismatch
```

A high score does not bypass approval, credit, QA, source safety, or StoryTiming.

## Credit And Approval Behavior

| Graphic type | Typical credit behavior |
| --- | --- |
| Simple lower third / static label | `none` / `low` |
| Static graphic card | `low` |
| Animated graphic card | `low` / `medium` |
| Comparison layout | `medium` |
| Diagram/framework layout | `medium` |
| Data/chart card with verified data | `medium` |
| Browser/app annotation with redaction planning | `medium` |
| Complex motion graphic design | `medium` / `high` |
| Generated custom graphic asset | `high` / `premium` |
| Graphics with tracking/masking/advanced compositing | `high` / `premium` |

Rules:

- Premium graphics must be itemized.
- Heavy generated graphics require estimate and approval.
- Optional heavy graphics should have lower-cost alternatives.
- No generation before approval.
- If source verification, redaction, or manual review increases complexity, reflect that in the plan.

## Graphic Design QA

Graphic-design-specific QA checks:

- Graphic has story/meaning reason.
- Graphic improves viewer understanding.
- Hierarchy is clear.
- Primary message readable.
- Read time fits duration.
- Text does not duplicate captions without purpose.
- Captions remain readable.
- Face/expression protected.
- Important product/action protected.
- Screen zone fits aspect ratio/platform UI.
- Layout not overcrowded.
- Style matches user preference.
- Reference not copied.
- Source/proof status handled.
- Sensitive data/redaction handled where needed.
- Claim/disclaimer concerns handled.
- Credit/approval compliance.
- Graphic does not feel generic/template-like.
- Graphic is not repeated mechanically.

Blocking examples:

- Premium generated graphic without approval.
- Graphic makes unverified factual claim.
- Sensitive data visible without redaction plan.
- Graphic covers face, captions, product, or action.
- Graphic contradicts user "no extra visuals" instruction.
- Text unreadable at target platform.

Warning examples:

- Graphic may be too dense.
- Hierarchy could be clearer.
- Layout family repeated too often.
- Style may feel too generic.
- Source note may need clearer wording.

## Revision Behavior

Safe revision options:

- Remove graphic.
- Make graphic simpler.
- Make graphic more premium.
- Make graphic more educational.
- Make graphic less dense.
- Reduce text.
- Change layout family.
- Move graphic to safe zone.
- Increase readability.
- Soften edge through overlay contract.
- Replace graphic with caption emphasis.
- Replace 3D with graphic design card.
- Replace complex generated graphic with static card.
- Add source/context note.
- Lower credit cost.
- Regenerate concept options later.

Revision requires a new credit estimate and approval when it adds premium generation, changes provider/tool dependency, increases credit impact, adds advanced motion/tracking/masking/compositing, introduces new source/proof claims, changes approved timing materially, or adds new SFX/music/render work. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but do not imply execution without approval.

## Examples

### Example 1: Simple Clean Talking Head

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `no_graphic_design` or `lower_third_identity` |
| `planning_reason` | The speaker's face carries trust; only a minimal identity lower third is useful. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Lower third appears once after intro, then clears before dense captions. |
| `structure_summary` | Name and role only. |
| `layout_family` | `lower_third_layout` |
| `hierarchy_summary` | Primary: name; secondary: role. |
| `caption_relationship` | Captions remain lower center after lower third clears. |
| `overlay_composition_reference` | Lower-third safe zone, face-safe. |
| `credit_impact` | `none` / `low` |
| `approval_required` | `false` |
| `QA checks` | Face safe, caption safe, readable, no random decoration. |

### Example 2: Premium Real Estate Feature Callout

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `feature_callout` |
| `planning_reason` | The narrator names a premium finish while the camera pans; a restrained label helps viewers notice it. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Enter after feature phrase, hold 2 seconds, exit before next room. |
| `structure_summary` | One label plus short context note. |
| `layout_family` | `callout_pin_layout` |
| `hierarchy_summary` | Primary: feature name; secondary: material/context. |
| `caption_relationship` | Captions stay below, callout stays upper right. |
| `overlay_composition_reference` | Object-safe zone and soft-edge overlay behavior from RP-SKILLS-04. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Product/action safe, caption safe, luxury restraint. |

### Example 3: Product Feature Breakdown

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `product_feature_breakdown` |
| `planning_reason` | The app feature has three parts; a structured card makes the workflow clear. |
| `restraint_decision` | `use_full` |
| `timing_summary` | Starts after "here is how it works"; holds through three items. |
| `structure_summary` | Headline, three short feature labels, no invented UI. |
| `layout_family` | `side_card_layout` |
| `hierarchy_summary` | Primary: feature name; secondary: three benefits. |
| `caption_relationship` | Captions reduced to speech essentials during card hold. |
| `overlay_composition_reference` | Right third, source UI remains visible. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `true` if generated custom graphics are proposed. |
| `QA checks` | Source status, feature wording, caption safe, read time. |

### Example 4: Education Framework Diagram

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `framework_diagram` |
| `planning_reason` | The instructor introduces a framework; diagram structure helps learners retain the steps. |
| `restraint_decision` | `use_full` |
| `timing_summary` | Enter after framework name; hold 4 seconds; exit after summary line. |
| `structure_summary` | Central concept with three labeled steps. |
| `layout_family` | `step_ladder_layout` |
| `hierarchy_summary` | Primary: framework title; secondary: three steps. |
| `caption_relationship` | Captions avoid duplicating diagram labels. |
| `overlay_composition_reference` | Full-frame takeover only during caption-light hold. |
| `credit_impact` | `medium` |
| `approval_required` | `false` for static plan; `true` for generated custom art. |
| `QA checks` | Hierarchy, read time, no random diagram, source wording. |

### Example 5: Marketing Offer / CTA Card

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `offer_or_cta_card` |
| `planning_reason` | The ad needs one clear action after the proof statement. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Beat-aligned entry after proof phrase; hold 1.8 seconds. |
| `structure_summary` | Offer headline, one support line, CTA. |
| `layout_family` | `full_frame_takeover` |
| `hierarchy_summary` | Primary: offer; secondary: deadline; CTA button text. |
| `caption_relationship` | Captions pause during silent CTA card or move above if speech continues. |
| `overlay_composition_reference` | Center safe with platform UI margin. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `true` if exact price/offer was not user-provided. |
| `QA checks` | Claim safety, read time, approval, caption safe. |

### Example 6: Testimonial Quote Card

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `testimonial_quote_card` |
| `planning_reason` | The customer quote is the proof moment; a card preserves the line while keeping attribution cautious. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Appears after the quote is spoken; holds through reaction shot. |
| `structure_summary` | Short quote, first name/role if provided, context note. |
| `layout_family` | `side_card_layout` |
| `hierarchy_summary` | Primary: quote; secondary: attribution/context. |
| `caption_relationship` | Captions keep speech accessible and avoid covering card. |
| `overlay_composition_reference` | Face-safe side panel. |
| `credit_impact` | `low` |
| `approval_required` | `true` if attribution/source is uncertain. |
| `QA checks` | Authenticity, source status, face safe, no invented quote. |

### Example 7: Browser/App Annotation

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `browser_app_annotation` |
| `planning_reason` | The screen demo needs one annotation to show where the feature lives without inventing the interface. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Enters after "click reports"; exits before screen change. |
| `structure_summary` | One UI label and arrow, redaction note for email area. |
| `layout_family` | `browser_annotation_layout` |
| `hierarchy_summary` | Primary: feature label; source/redaction note internal to plan. |
| `caption_relationship` | Captions remain below browser frame. |
| `overlay_composition_reference` | Browser frame zone with redaction plan. |
| `credit_impact` | `medium` |
| `approval_required` | `true` if source capture or generated UI asset is proposed. |
| `QA checks` | No invented UI, redaction, caption safe, source status. |

### Example 8: Lower-Cost Alternative To 3D

| Field | Example |
| --- | --- |
| `skill_key` | `graphic_design_visual_explain` |
| `graphic_role` | `product_feature_breakdown` |
| `planning_reason` | A 3D hero was considered, but a clear graphic card explains the feature at lower cost. |
| `restraint_decision` | `replace_with_simpler_skill` |
| `timing_summary` | Card appears during product explanation instead of 3D reveal. |
| `structure_summary` | Product name, two benefits, no generated 3D object. |
| `layout_family` | `modular_card_stack` |
| `hierarchy_summary` | Primary: feature; secondary: two benefits. |
| `caption_relationship` | Captions stay readable and simpler during card. |
| `overlay_composition_reference` | Safe side card, no face overlap. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `false` unless custom generated graphic asset is proposed. |
| `QA checks` | Lower-cost rationale, readability, no unsupported claims, no clutter. |

## Anti-Patterns

Avoid these graphic design planning failures:

- Graphic name only.
- Generic text box everywhere.
- Same card repeated mechanically.
- Graphic duplicates captions without purpose.
- Graphic hides face/expression.
- Graphic hides product/action.
- Graphic too dense to read.
- Graphic ignores aspect ratio/platform UI.
- Graphic uses unverified metrics or claims.
- Browser/app graphic invents exact screen details.
- Sensitive data shown without redaction/source plan.
- Typography intent missing.
- Hierarchy missing.
- Layout chosen before creative concept.
- Generated graphic without credit estimate.
- Premium graphic without approval.
- Reference graphic copied exactly.
- Worker execution from raw prompt only.

## Future Implementation Notes

Possible future records/tables/types:

- `graphic_design_plans`
- `graphic_design_structure_plans`
- `graphic_design_timing_plans`
- `graphic_design_source_safety_plans`
- `graphic_design_qa_requirements`
- `edit_plan_skill_routes` with `skill_key = graphic_design_visual_explain`
- `overlay_compositing_plans`
- `storytiming_coordination_records`

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future motion design, 3D, B-roll, caption, SoundSync, and StoryTiming contracts should reference this graphic design contract when graphic information structure is needed.

## Duplicate And Overlap Notes

Existing Graphic Design / VisualExplain ownership already appears in:

- `design.md`
- `signature-systems.md`
- `visual-storytelling-architecture.md`
- `provider-prompt-architecture.md`
- `generation-provider-architecture.md`
- `open-source-tool-registry.md`
- `docs/storytiming-planner-service.md`
- `docs/storytiming-render-manifest-plan.md`
- `docs/storytiming-qa-plan.md`
- `docs/generation-credit-gate.md`
- `docs/sfx-director-service.md`
- `docs/sfx-provider-prompting.md`
- `docs/sfx-timing-trim-alignment.md`
- `src/types/signature-systems.ts`
- `src/types/generation.ts`
- `src/types/reeditpro.ts`
- `src/lib/mock-planner.ts`
- `src/lib/prompt-builders.ts`
- `src/lib/provider-router.ts`
- `src/lib/adaptive-edit-strategy.ts`
- `src/lib/dataviz-planner.ts`
- `src/lib/planner-validation.ts`
- `src/lib/render-strategy-planner.ts`
- `docs/creative-skills/skill-planning-contracts.md`
- `docs/creative-skills/overlay-compositing-planning-contract.md`

This contract is the Graphic Design / VisualExplain planning doctrine and specialized field envelope. It must not create a parallel signature routing, data-viz, provider prompt, StoryTiming, SFX, frame layout, overlay/compositing, tool registry, worker, QA, credit, or Supabase lane.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-06 - Motion Design Planning Contract`

Scope:

Docs-only motion design planning contract that inherits the universal, transition, overlay/compositing, and graphic design contracts where relevant and defines motion roles, motion energy, easing intent, reveal/hold/exit behavior, rhythm, timing anchors, repetition avoidance, animation support for graphics/overlays/captions/3D, and motion design QA.
