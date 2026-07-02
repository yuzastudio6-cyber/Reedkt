# Browser/App Capture Planning

## Purpose

ReeditPro needs a professional browser/app capture planning layer for videos where the viewer needs to see a website, SaaS dashboard, app interface, product page, article, offer page, ecommerce page, proof page, tutorial screen, UI comparison, or feature walkthrough.

Browser/app visuals are useful when the edit needs proof, clarity, tutorial context, product credibility, or UI walkthrough structure. They should be planned as controlled visual assets and composed into the final edit by ReeditPro, not invented as random AI video.

## Controlled Tools, Not AI Video

Browser/app visuals should generally use:

- Playwright for future page, viewport, element, and screenshot capture planning.
- Sharp for future crop, resize, thumbnail, and format preparation.
- Remotion for final layout, timing, zooms, highlights, browser-frame overlays, speaker PIP, captions, and composition.
- GPT-Image-2 only for illustrative browser-style mockups when exact page capture is not needed.

Wan, Hailuo, and Veo should not be used to invent exact websites, dashboards, UI labels, pricing pages, product pages, evidence pages, or article content. Veo remains Premium-only final fallback for AI video assets, not browser capture.

## Safety And Permission Rules

Browser capture must never be used to bypass authentication, paywalls, CAPTCHAs, robots, rate limits, site restrictions, or access controls. It must not scrape private data, use user credentials without an explicit future approved flow, capture sensitive personal data without consent, create misleading evidence screenshots, or copy protected site visuals beyond allowed use.

For this frontend mock:

- No real browser capture is performed.
- No Playwright installation or execution happens.
- No website access, scraping, login, screenshotting, or browser session processing happens.
- All browser capture plans are planning-only.
- Future production capture should require user-provided or otherwise authorized URLs, uploaded screenshots, or approved internal assets.

## Browser Visual Types

- `website_screenshot`: a general website viewport or page visual.
- `landing_page_capture`: an offer or landing page used as a marketing visual.
- `product_page_capture`: a product page, feature page, pricing card, or sales page.
- `ecommerce_page_capture`: storefront, checkout, cart, product listing, or purchase flow.
- `saas_dashboard_capture`: dashboard, metrics panel, analytics UI, admin UI, or product console.
- `app_screen_capture`: app interface or product screen.
- `article_capture`: article, blog, documentation, or source page.
- `evidence_page_capture`: proof-style page used in documentary or case study contexts.
- `browser_mockup_frame`: illustrative browser frame when exact capture is not needed.
- `before_after_website_comparison`: before/after website or landing page comparison.
- `tutorial_screen_step`: one screen in a tutorial walkthrough.
- `scroll_sequence`: planned scroll/pan through a page.
- `selector_focus`: planned element/selector focus.
- `ui_highlight_zoom`: zoom into a feature or UI element.
- `webpage_timeline_card`: page visual inside a timeline/evidence card.
- `dashboard_metric_card`: extracted dashboard metric or feature card.
- `custom_browser_visual`: custom controlled browser/app visual.

## Capture Modes

- `static_screenshot`: one planned screenshot.
- `element_screenshot`: one planned element capture.
- `full_page_screenshot`: one planned full-page capture.
- `viewport_capture`: one planned viewport capture.
- `scroll_sequence`: planned scroll sequence.
- `step_sequence`: planned multi-step capture sequence.
- `before_after_capture`: planned comparison capture.
- `mock_browser_frame`: illustrative mock frame only.
- `uploaded_screenshot_only`: user-uploaded screenshot used as the source.
- `future_authenticated_capture`: future capture requiring explicit authorization and approval.

## Layout Modes

Browser/app visuals can appear as:

- `full_visual_takeover`: use when the page is the scene.
- `screen_capture_with_speaker_pip`: use for tutorials, product demos, and narrated walkthroughs.
- `side_by_side_speaker_visual`: use for explanations where the speaker and page both matter.
- `lower_visual_panel`: use for vertical social edits with a compact page crop.
- `picture_in_picture_speaker`: use when the page is primary and speaker presence is secondary.
- `split_screen_comparison`: use for before/after or competitor-style comparisons.
- `before_after_panel`: use for direct old/new UI comparisons.
- `voiceover_visual_takeover`: use when narration carries the context and the page fills the canvas.
- `browser_card_inside_evidence_board`: use for documentary/case-study evidence boards.
- `product_feature_callout`: use for product feature highlights and CTA moments.

## Style Families

### `clean_product_demo`

Best use case: polished product explanations. Frame treatment: clean browser shell. Label/highlight style: restrained feature callout. Zoom behavior: smooth zoom into one feature at a time. Caption behavior: concise captions outside the active UI crop. Avoid: clutter, invented UI details, fake claims, fake pricing.

### `saas_dashboard_premium`

Best use case: dashboards and product consoles. Frame treatment: premium dark or neutral browser frame. Label/highlight style: feature-focused outline, glow, or callout. Zoom behavior: controlled metric/feature zooms that preserve readability. Caption behavior: short labels that do not cover dashboard data. Avoid: tiny metrics, fake analytics, private account data, AI-video exact UI invention.

### `documentary_evidence_page`

Best use case: source pages and proof visuals. Frame treatment: neutral browser card or evidence-board card. Label/highlight style: source label plus thin outline or spotlight. Zoom behavior: slow, restrained zooms only when needed for readability. Caption behavior: safe wording such as reported, claimed, source provided, or mock/example. Avoid: sensational marks, fabricated evidence, private data, or implying unverified claims are facts.

### `education_screen_tutorial`

Best use case: tutorials and screen lessons. Frame treatment: readable screen frame with step labels. Label/highlight style: outline, cursor plan, click pulse, or callout. Zoom behavior: step-by-step zooms that keep UI text legible. Caption behavior: captions explain the current action without covering the UI. Avoid: fast scrolling, tiny text, and unexplained cursor motion.

### `ecommerce_product_focus`

Best use case: ecommerce and product pages. Frame treatment: clean product frame or browser card. Label/highlight style: product detail, price area, or CTA callout when authorized. Zoom behavior: zoom into product/CTA areas, not sensitive checkout data. Caption behavior: short labels that avoid price and CTA occlusion. Avoid: fake pricing, fake inventory, private checkout data, or unverified claims.

### `social_browser_card`

Best use case: fast social proof or lightweight page references. Frame treatment: compact browser card. Label/highlight style: one simple source label or callout. Zoom behavior: minimal zoom, favor readable crop changes. Caption behavior: large external captions for vertical readability. Avoid: overloaded vertical frames, unreadable page text, and implied source verification.

### `comparison_before_after`

Best use case: old/new UI or landing page comparisons. Frame treatment: matched split panels. Label/highlight style: before/after labels and neutral diff callouts. Zoom behavior: matched zoom scale across both sides. Caption behavior: concise comparison captions. Avoid: misleading differences, fake results, and mismatched crop scale.

### `neutral_article_capture`

Best use case: articles, docs, and sources. Frame treatment: neutral article/browser frame. Label/highlight style: visible source label plus thin highlight. Zoom behavior: slow readability zoom into the relevant paragraph or headline. Caption behavior: safe wording and clear source context. Avoid: fabricated article text or presenting commentary pages as official sources.

### `dark_mode_dashboard`

Best use case: dark SaaS/product UIs. Frame treatment: dark dashboard frame with token-based accents. Label/highlight style: soft glow or outline. Zoom behavior: restrained feature/metric zoom with safe contrast. Caption behavior: external captions that do not cover dashboard data. Avoid: heavy neon, tiny metrics, and private data exposure.

### `custom`

Best use case: approved custom brand or internal web assets. Frame treatment: project-specific but source-safe. Label/highlight style: approved custom labels. Zoom behavior: match the approved edit style without making source details unreadable. Caption behavior: preserve UI and caption safe zones. Avoid: bypassing source permissions, inventing exact UI, or exposing private data.

## Browser Capture Settings

Planned settings include `url`, `urlPermissionStatus`, `captureMode`, `viewportWidth`, `viewportHeight`, `deviceScaleFactor`, `fullPage`, `selector`, `clipRectangle`, `imageFormat`, `imageQuality`, `waitTimeMs`, `waitForSelector`, `theme`, `scrollPosition`, `browserFrameStyle`, `highlightSelector`, `highlightColor`, `zoomTarget`, `redactionNeeded`, `piiRisk`, `sourceLabel`, and `safeWording`.

## Redaction And Privacy

ReeditPro should plan redaction when a page may contain emails, names, addresses, payment details, tokens, dashboard private metrics, account info, customer records, private analytics, or sensitive documentary data.

Redaction planning should include `redactionNeeded`, redaction targets, blur or block style, QA checks, and user confirmation when the risk is high.

## Documentary / Case Study Evidence Pages

Documentary and case-study browser evidence visuals must be neutral. If source status is unclear, use safe wording such as “source provided,” “reported,” “claimed,” or “example/mock.” Do not fabricate evidence screenshots, present a page as official unless the source supports it, or show real names/private data without appropriate approval.

## Tier Behavior

Basic supports simple uploaded screenshot/card planning, simple browser frames, simple lower panels or full takeovers, and no complex scroll or authenticated capture. Basic must not use Veo.

Pro supports product/dashboard/tutorial capture planning, selector focus, side-by-side/PIP, highlight zooms, and Playwright/Sharp/Remotion planning. Pro must not use Veo.

Premium supports multi-step walkthrough planning, before/after comparison, richer dashboard/evidence sequences, stronger redaction/QA, and future authenticated capture planning only if approved later. Veo remains final fallback only for AI video assets, not browser capture.

## Tool Responsibilities

Playwright plans future browser/page capture, screenshot capture, element capture, page waits, selector planning, and visual regression support.

Sharp plans future crop, resize, format preparation, screenshot thumbnails, and background/panel prep.

Remotion owns browser frame layout, zoom/pan/highlight motion, speaker PIP, side-by-side composition, captions, timing, and final canvas.

OpenCV may later support safe-zone checks, visual collision QA, screenshot readability, and redaction verification.

GPT-Image-2 may create illustrative UI mockups or stylized cards only when exact capture is not required. It must not create exact web evidence/screenshots.

Wan, Hailuo, and Veo are not browser/page screenshot tools.

## Non-Goals

This milestone does not install Playwright, access websites, capture screenshots, scrape pages, use credentials, verify web evidence, process real redactions, run Remotion, run backend workers, call providers, deduct credits, or create export jobs.
