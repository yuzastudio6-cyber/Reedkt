# ReeditPro App Shell Sizing Rules

This document is a hard QA guide for ReeditPro desktop/web layout work. It exists to prevent clipped cards, hidden composers, squeezed grids, and accidental overflow while preserving the chat-first AI video editor.

## Non-Negotiable Rule

No route may rely on clipping, hidden overflow, or cramped fixed math to look stable. If content is long, it must wrap, truncate intentionally, or scroll inside an obvious panel.

## Required Shell Regions

- Sidebar: stable desktop navigation, tokenized width, independently scrollable when content exceeds viewport height.
- App header/topbar: compact page context and actions, never a giant text-heavy header.
- Project strip: editor project context and status, tokenized minimum height, no overlap with chat content.
- Main content: bounded, calm, and built with `minmax(0, 1fr)` where columns can shrink.
- Preview rail: optional and secondary; it must not squeeze the chat below usable width.
- Composer: sticky inside the editor flow, visible, bounded, and never covering the last chat message.
- Drawer: optional advanced surface with intentional internal scrolling.

## Overflow Rules

- Do not add global `overflow: hidden` to hide layout bugs.
- Use `min-width: 0` on grid and flex children that contain text, buttons, cards, or media.
- Use `overflow-wrap: anywhere` for user text, URLs, filenames, badges, chips, and generated labels.
- Use internal `overflow-y: auto` only for panels, sidebars, drawers, or long inspectors.
- Focus rings must remain visible and not be clipped by parent containers.

## Token Rules

Use layout tokens from `src/styles/tokens.css` for shell sizing:

- `--rp-sidebar-width`
- `--rp-sidebar-compact-width`
- `--rp-topbar-min-height`
- `--rp-project-strip-min-height`
- `--rp-content-max`
- `--rp-editor-max`
- `--rp-chat-thread-max`
- `--rp-preview-rail-width`
- `--rp-preview-rail-min`
- `--rp-composer-max`
- `--rp-composer-bottom-offset`
- `--rp-chat-bottom-safe-space`
- `--rp-shell-padding-inline`
- `--rp-shell-padding-block`

Do not introduce repeated raw shell widths, sticky offsets, or spacing math when a token exists.

## Grid And Flex Rules

- Flexible grid tracks must use `minmax(0, 1fr)`.
- Multi-column route grids must collapse before content becomes squeezed.
- Flex rows with actions must wrap.
- Cards containing long content must have `min-width: 0`.
- Button rows must wrap instead of forcing horizontal page overflow.

## Sticky And Fixed Rules

- Prefer sticky composer/topbar behavior inside the normal page flow.
- Sticky elements need tokenized offsets and a `z-index` only when overlap is intentional.
- Add bottom safe space to scrollable chat threads so the last message can be focused above the composer.
- Do not place route content behind fixed elements.

## Route Checklist

- `/`: marketing shell remains bounded and stacks cleanly; no app-shell mobile flow is introduced.
- `/dashboard`: metrics, workload, and side panels collapse without clipped cards.
- `/projects`: filters, search, project cards, filenames, and status badges wrap safely.
- `/projects/new`: project creation setup and selection grids remain readable at desktop widths.
- `/projects/:projectId`: edit lists, new-edit controls, status badges, and long edit names wrap safely.
- `/projects/:projectId/edits/:editSessionId`: chat thread, composer, upload gate, plan cards, private review, advanced drawer, and timeline stay inside the viewport.
- `/editor`: compatibility edit route uses the same sizing guarantees as the focused project/edit workspace.
- `/preferences`: preference cards and account/testing status wrap safely without exposing production-only controls.
- Retired routes `/wallet`, `/pricing`, `/brand-kit`, `/exports`, `/upload`, `/edit-preferences`, `/settings`, and `/app` must redirect to clean active routes and must not appear as sidebar destinations.

## Editor Checklist

- Chat remains the editor.
- Composer is always visible and not hidden behind route chrome.
- Last chat message can be scrolled above the composer.
- The editor chat thread must mask bottom scroll content so messages/cards disappear while passing behind the floating composer, not after emerging below it.
- Composer fade and occlusion layers are visual helpers; they must not be the only mechanism hiding scroll-under content.
- Plan Review / Credit Approval remains the single approval moment.
- Advanced/developer details remain collapsed or lazy-loaded by default.
- Long user messages, AI responses, URLs, filenames, chips, and badges wrap safely.
- Timeline drawer scrolls internally when tall.

## Desktop QA Widths

Check code and browser layout at:

- `1024px`
- `1280px`
- `1440px`
- `1728px`
- `1920px`

At `1024px`, ReeditPro may stack responsive web layouts, but it must not become a native mobile app flow.

## Browser Zoom

- Confirm at `100%`.
- If practical, confirm at `125%` for app shell, editor composer, and route grids.

## Long Content Checks

Every shell or chat change should account for:

- long user message
- long AI response
- long project title
- long filename
- long URL
- many badges or chips
- long action labels

## Prompt 7 Implementation Notes

- Layout tokens were expanded for sidebar, topbar, project strip, preview rail, composer offset, chat safe space, and shell padding.
- App shell, route grids, export cards, project cards, chat messages, inline cards, composer rows, and timeline drawer gained safer wrapping and sizing guards.
- Browser QA measured all required routes at `1024px`, `1280px`, `1440px`, `1728px`, and `1920px`.
- The first probe found metric badge overflow on `/dashboard` and `/wallet`; the responsive metric grid and badge wrapping fixes resolved it.
- The final probe reported `0` overflow/composer-visibility failures across `45` route/width combinations.
- Browser automation may be unavailable in some Codex sessions; when it is unavailable, document that and rely on code inspection, typecheck, lint, and build.

## Prompt 8 Screenshot And Zoom QA

Screenshot QA was performed with the in-app browser against the Vite dev server.

Saved screenshots:

- `docs/ui-ux-screenshots/prompt-8/editor-1280.png`
- `docs/ui-ux-screenshots/prompt-8/editor-1440.png`
- `docs/ui-ux-screenshots/prompt-8/editor-1920.png`
- `docs/ui-ux-screenshots/prompt-8/dashboard-1280.png`
- `docs/ui-ux-screenshots/prompt-8/dashboard-1440.png`
- `docs/ui-ux-screenshots/prompt-8/projects-1280.png`
- `docs/ui-ux-screenshots/prompt-8/projects-1440.png`
- `docs/ui-ux-screenshots/prompt-8/wallet-1280.png`
- `docs/ui-ux-screenshots/prompt-8/wallet-1440.png`
- `docs/ui-ux-screenshots/prompt-8/exports-1280.png`
- `docs/ui-ux-screenshots/prompt-8/exports-1440.png`
- `docs/ui-ux-screenshots/prompt-8/landing-1440.png`
- `docs/ui-ux-screenshots/prompt-8/projects-new-1440.png`
- `docs/ui-ux-screenshots/prompt-8/pricing-1440.png`
- `docs/ui-ux-screenshots/prompt-8/brand-kit-1440.png`

125% zoom status:

- Native browser zoom was attempted, but the measured viewport scale remained unchanged.
- CSS zoom injection was attempted for QA, but the browser returned: `CSSStyleDeclaration assignment is not available in playwright.evaluate because the DOM is read-only`.
- After the first screenshot batch, zoom-screenshot capture failed with: `Timed out running CDP command "Page.captureScreenshot" for tab 1`.
- As a layout-equivalent zoom proxy, `/editor`, `/dashboard`, `/projects`, `/wallet`, and `/exports` were checked at `1024px` wide, which approximates `1280px` at `125%`.
- The proxy pass reported `0` horizontal overflow and no clipped sampled buttons/cards/messages. The editor composer remained visible.

Remaining layout risk:

- True browser zoom screenshots should be repeated if the browser surface exposes a writable zoom or device-scale control in a future session.
- SFX/music lazy subflows were not exhaustively screenshot-tested after expansion; they remain deferred workflow-specific QA.

## Prompt 8 Editor Visual Reset Results

Editor no-cutoff QA was repeated after the visual reset.

Tested `/editor` widths:

- `1024px`
- `1280px`
- `1440px`
- `1728px`
- `1920px`

Results:

- One editor heading remained: `Premium real estate short`.
- The standard app topbar was not rendered in editor chrome.
- The chat shell measured transparent with no enclosing border.
- Demo scenario and planning progress controls were collapsed by default.
- Initial browser checks found the composer could still visually overlap the source card.
- After the composer was moved into a dedicated bottom row below the scrollable chat thread, targeted post-fix checks at `1024px` and `1440px` confirmed the composer was fully visible and did not overlap the thread.
- No horizontal overflow or sampled left/right clipping was detected.

Regression checks:

- `/dashboard`, `/projects`, `/wallet`, and `/exports` were checked at `1280px`; all reported `0` horizontal overflow.

Zoom:

- True browser zoom/device-scale control was unavailable in this tooling pass.
- `editor-1024.png` is used as the practical `1280px` at `125%` layout proxy and passed no-overflow/composer checks.

Remaining risk:

- Repeat true 125% zoom screenshots when the browser tooling exposes writable zoom controls.
- The final post-fix full-width screenshot recapture was blocked by `Browser is not available: iab`; saved screenshots are retained, and targeted post-fix checks cover the narrow and primary desktop editor widths.
- Add scrolled-state editor screenshots after future card polish and SFX/music expansion work.

## Prompt 9 Scrolled Editor State Results

Prompt 9 exercised the editor interaction flow in the in-app browser and added source/reference/approval card polish.

Results:

- Source sequence rows now use safer grouping and wrapping for filenames, notes, flags, and controls.
- Reference controls now wrap inside the card and keep long URLs inside the editor width.
- Expanded utility panels are bounded with internal scrolling.
- Chat bottom safe space increased to keep final cards and focus states easier to reach.
- The available browser viewport reported no document-level horizontal overflow after source, reference, setup, approval, progress, preview, composer focus, and timeline interactions.

Browser limitation:

- The in-app browser viewport was `599px` wide and did not expose viewport resizing.
- Fixed desktop-width screenshots for `1024px`, `1280px`, `1440px`, `1728px`, and `1920px` were not captured in Prompt 9.
- Desktop no-cutoff confidence relies on the Prompt 8 desktop screenshots plus Prompt 9 code-level no-cutoff checks, typecheck, lint, and production build.

Remaining layout risk:

- Repeat expanded/scrolled-state screenshots at the full desktop QA widths when viewport control is available.

## Revised Prompt 9 Floating Composer Results

The editor shell now treats the composer as a floating chat input instead of a hard bottom row.

Rules added by implementation:

- The editor project header should stay minimal: project title, status, credits/wallet, preview/estimate, and menu only.
- Composer parent wrappers must stay transparent; only the input shell itself should carry a glass surface.
- The composer should be centered inside the chat canvas, not attached to a full-width footer band.
- Chat bottom safe space must account for the floating composer height.
- Utility controls should stay compact and secondary when collapsed.

Implementation results:

- Header surface and spacing were reduced.
- The utility strip collapsed state is now a compact row.
- `.chat-native-shell` no longer creates a visible hard bottom composer row.
- `.chat-composer-float-wrap` keeps the composer in the chat canvas and transparent around the surfaced input.
- In the available browser viewport, no horizontal overflow was measured and the composer remained visible after scrolling into the editor canvas.

Remaining layout risk:

- Fixed-width desktop screenshots for the revised composer are still needed when browser viewport resizing is available.

## Acceptance Checklist

- No horizontal page overflow is introduced.
- No route uses global clipping to mask layout issues.
- No composer or sticky control covers final content.
- Long content wraps or truncates intentionally.
- Focus states remain visible.
- Desktop/web remains the target.

## Prompt 10 Desktop Sizing Results

Prompt 10 used browser viewport override for real desktop editor screenshots at `1024`, `1280`, `1440`, `1728`, and `1920`.

Results:

- `/editor` default state reported `0` horizontal overflow at all five desktop widths.
- Floating composer remained visible at all five desktop widths.
- The composer wrapper remained transparent; no hard footer row returned.
- Minimal editor header stayed compact with one `h1`.
- `scroll-padding-block` was added to the chat thread so deep controls and focus targets have room above the floating composer.
- Non-editor routes `/`, `/dashboard`, `/projects`, `/projects/new`, `/wallet`, `/pricing`, `/brand-kit`, and `/exports` reported `0` horizontal overflow at `1280px`.

### 125% Zoom Status

- The browser exposed viewport override but not true zoom/device-scale control.
- `devicePixelRatio` and visual viewport scale remained `1` during browser probes.
- `1024px` editor capture is treated as a practical `1280px` at `125%` layout proxy.
- Code-level zoom review confirmed the relevant editor surfaces use `min-width: 0`, wrapping rows, auto-fit grids, internal scrolling, and bounded drawer/panel sizing.

### Timeline Drawer Sizing

- The advanced timeline drawer now uses a labelled shell with `grid-template-rows: auto minmax(0, 1fr) auto`.
- Timeline body scrolls internally.
- Timeline content has a dedicated horizontal scroll wrapper.
- Browser metrics at `1440px` reported `0` document-level horizontal overflow with the drawer open.

### SFX / Music Expanded-State Sizing

- SFX and Music/SoundSync expanded flows now use shared `soundflow-panel` and disclosure styles.
- Dense technical detail stacks are collapsed by default and internally scroll when expanded.
- Score grids use auto-fit tracks instead of fixed four-column grids.
- Prompt/provider/cue text wraps inside the chat canvas.

Remaining layout risk:

- True 125% screenshots still need a browser surface with zoom/device-scale control.
- Timeline drawer currently renders below the editor canvas as an editor route sibling; future polish can decide whether it should live inside the chat canvas.

## Prompt 11 SFX/Music And Timeline Canvas Sizing

Prompt 11 kept the compact editor header and floating composer while moving the advanced timeline into the editor canvas.

### Timeline Canvas Placement

- `DetailedTimelineDrawer` remains lazy-loaded, but now renders inside the `ChatNativeEditor` canvas through an inline slot.
- `.timeline-editor-layer` keeps the drawer within the chat thread width and scroll flow.
- Opening the timeline auto-scrolls the drawer into the editor canvas and keeps its bounded body above the floating composer.
- The drawer still uses bounded height, internal body scrolling, and a dedicated horizontal timeline scroll wrapper.
- Browser QA opened the timeline at `1440px` and reported no document-level horizontal overflow.

### SFX / Music Expanded States

- SFX and Music/SoundSync expanded flows now render visible messages through descriptor lists.
- Advanced SFX/Music details remain collapsed under native `details` controls.
- `.soundflow-message-list` and `.soundflow-card-slot` preserve min-width and wrapping behavior inside the wider chat canvas.
- Browser QA opened both flows at `1440px`; no document-level horizontal overflow was measured.

### Desktop Width Results

- `/editor` default state was captured at `1024`, `1280`, `1440`, `1728`, and `1920`.
- All tested editor widths reported `scrollWidth === clientWidth` and no horizontal overflow.
- Non-editor routes checked at `1280` also reported no horizontal overflow.

### 125% Zoom Status

- The browser surface exposed viewport override but not true zoom/device-scale control.
- `devicePixelRatio` and `visualViewport.scale` stayed at `1`.
- `1024px` remains the practical proxy for `1280px` at `125%`, plus code-level review of min-width, wrapping, internal scroll, and bounded drawer sizing.

## Prompt 12 Automated Viewport Sizing

Prompt 12 added Playwright viewport automation for route and editor sizing.

Automated results:

- `/editor` passed no-horizontal-overflow checks at `1024`, `1280`, `1440`, `1728`, and `1920`.
- `/`, `/dashboard`, `/projects`, `/projects/new`, `/wallet`, `/pricing`, `/brand-kit`, and `/exports` passed the same width checks.
- Floating composer was verified as visible after scroll and narrower than a full-width footer.
- Minimal editor header remained compact with only `Premium real estate short` visible as the editor heading.
- Utility expansion, timeline open, SFX expanded, and Music expanded states passed no-overflow checks.

Zoom status:

- `1024px` viewport remains the practical `1280px at 125%` layout proxy.
- Playwright also applied Chromium `Emulation.setPageScaleFactor` at `1.25` and captured `editor-1280-page-scale-125.png`.
- This is practical automated zoom coverage, not a promise of exact parity with every desktop browser zoom implementation.

## Prompt 16 Composer Scroll-Under Rules

Prompt 16 finalizes the editor composer as a ChatGPT-style floating input inside the chat canvas.

Sizing and alignment rules:

- The editor chat canvas is the positioning context for the composer layer and fade.
- The composer must align to the same column model as the chat messages/cards.
- Composer width must be bounded by the chat column, not the full app viewport or sidebar math.
- The surfaced composer shell is the only visible panel; wrapper layers stay transparent.

Scroll-under rules:

- Messages and cards scroll in the main chat thread underneath the composer overlay.
- A subtle bottom fade sits above messages and below the composer to visually soften content passing behind the input.
- The fade layer is non-interactive and `aria-hidden`.
- The composer layer accepts pointer events only on the input shell and controls.

Safe-space rules:

- Chat thread bottom padding and scroll padding must exceed the composer/fade height.
- The last card, source/reference controls, `PlanReviewApprovalCard` actions, preview actions, timeline drawer, SFX details, and Music details must be able to scroll above the composer.
- No global overflow clipping should be used to hide layout issues.

### Prompt 16 Sizing Results

- The chat column and composer now share the same column token model, so the composer aligns with the message/card column rather than the full app viewport.
- The composer layer is bounded inside the editor canvas and remains transparent around the surfaced input shell.
- The bottom fade is bounded to the chat column plus a small width allowance, not a full-viewport footer panel.
- The chat thread uses expanded bottom safe space so plan approval, source/reference controls, preview, timeline, SFX, and Music/SoundSync states can scroll above the composer.
- Automated viewport checks passed for `/editor` at `1024`, `1280`, `1440`, `1728`, and `1920`, with no horizontal overflow.
- The practical `1280px at 125%` proxy passed at `1024px`; Chromium page-scale `1.25` also passed.

## Composer Fix Prompt 1 Shell Reset

Prompt 16 follow-up tightened the distinction between composer layout and composer surface.

- `.chat-composer-shell` is now a transparent layout wrapper only.
- `.chat-composer-input-shell` is the only surfaced glass input and is capped at `--rp-composer-surface-max`.
- `--rp-composer-bottom-offset` is lower (`8px` desktop, `6px` compact) so the composer sits closer to the bottom of the editor canvas.
- `.chat-composer-fade` is bounded to the surfaced composer width plus a small allowance and remains non-interactive.
- Bottom scroll safe space remains large enough for plan approval, source/reference controls, timeline, SFX, and Music/SoundSync expanded states to clear the composer.

## Composer Correction 1B Compact Input Rules

Composer Correction 1B turns the composer from a compact card into a true compact chat input.

- The visible composer surface must be one horizontal input shell, not a stacked form card.
- The visible composer surface should stay below `120px` in the default state.
- Visible label/helper rows are not allowed inside the main composer; labels and rule reminders should be `sr-only` or handled by approval UI.
- The textarea must be integrated into the composer surface with no nested dark card border, no nested shadow, and no resize handle.
- Attachment/reference actions should be compact icon controls inside the same surface.
- Composer bottom offset is `6px` desktop and `4px` compact.
- Scroll-under fade and bottom safe space remain required so final cards/actions can clear the composer.

## Composer Fix 1C True Compact Composer Rules

Composer Fix 1C tightens the final editor composer target.

- The visible composer should read as one compact input rail, not a glass card wrapped around a form.
- Default composer surface height should stay under `76px` in automated QA.
- Composer controls use `36px` compact targets inside the bar, with full accessible labels preserved.
- The textarea uses a transparent one-line default with no nested background, border, shadow, or resize handle.
- The visible `Message ReeditPro` label and approval helper text are not allowed to consume layout rows; they remain assistive-tech-only.
- The composer bottom offset is `4px`; the bar should sit low in the editor canvas without clipping.
- The fade remains subtle and non-interactive, and bottom safe space remains large enough for final card actions to clear the composer.

## Composer Fade Fix 16D Ghost Panel Rule

The composer fade must support scroll-under behavior without reading as another shell.

- `chat-composer-fade` should be a low-alpha radial underlay, not a rectangular dark linear panel.
- Fade height should stay controlled between `72px` and `96px` in automated QA.
- The fade must stay inside the editor canvas so it does not create document horizontal overflow.
- The fade remains `aria-hidden` and `pointer-events: none`.
- The compact composer surface remains the only clearly surfaced composer object.

## Composer Occlusion Mask 16E Rule

Scroll-under content should disappear inside the composer footprint, not remain visible through or around the input rail.

- The composer may remain glassy, but a non-interactive occlusion layer must sit directly behind the input footprint.
- The occlusion layer must match the composer surface width, height, center, and radius so it does not appear as a second panel.
- Inline editor cards should be slightly narrower than the composer rail and centered under the same lane.
- Card-bearing assistant messages may stretch to the chat lane only to center their card stack; text-only assistant messages keep their conversational alignment.
- E2E should fail if inline cards become wider than the composer rail or if the occlusion layer stops matching the input rail.

## Composer Thread Mask Correction Rule

The compact composer is the foreground object; the scrolling chat lane must do the actual disappearance work.

- `.chat-native-thread` uses a bottom `mask-image` / `-webkit-mask-image` gradient.
- Chat content remains fully visible above the input rail, fades as it enters the rail zone, and is transparent before the bottom of the rail.
- `chat-composer-fade` remains a subtle non-interactive polish layer, not a dark footer panel.
- `chat-composer-occlusion` remains aligned to the compact input footprint and blocks content from showing through the glass.
- Bottom safe space must still let source, reference, plan review, timeline, SFX, and Music actions scroll above the composer.

## Card Fix Prompt 2 Width And Density Rules

Prompt 17 formalizes the chat card hierarchy below the floating composer.

- The compact composer remains the strongest and widest input surface in the editor chat lane.
- Normal AI cards should be narrower than the composer rail and use `--rp-chat-card-max`.
- Compact utility/reference cards should use `--rp-chat-card-compact-max` so they read as secondary.
- Source sequence and plan approval cards may use `--rp-chat-card-wide-max`, but they still must stay no wider than the composer rail in E2E.
- Card padding and row gaps should use `--rp-chat-card-padding`, `--rp-chat-card-padding-compact`, `--rp-chat-card-gap`, and `--rp-chat-card-row-gap`.
- Card rows should favor compact information hierarchy over table-like admin density.
- Secondary technical details should be collapsed or disclosed only on demand.
- Long filenames, URLs, notes, prompts, and action rows must wrap or truncate safely without viewport overflow.
- `PlanReviewApprovalCard` remains the strongest approval moment, but its width, chips, credit strip, and action row stay bounded.

## Conversation Rhythm Prompt 3 Spacing Rules

Prompt 18 adds chat cadence rules so the editor reads as a conversation rather than disconnected blocks.

- New role turns use `--rp-chat-turn-gap`.
- Consecutive same-role continuation messages use `--rp-chat-group-gap`.
- Message label spacing uses `--rp-chat-label-gap`.
- Assistant intro text and the first attached card use `--rp-chat-card-attach-gap`.
- Multiple cards in one assistant response use `--rp-chat-card-stack-gap`.
- User bubble padding uses `--rp-chat-bubble-padding-y` and `--rp-chat-bubble-padding-x`.
- Repeated visual labels should be reduced for grouped continuations, but labels should remain available to assistive technology.
- Adjacent message gaps should not create large scroll jumps; bottom composer safe space remains the only intentionally large end-of-thread space.

## Final Editor Polish Prompt 4 Interaction Rules

Final editor polish keeps layout unchanged and verifies the interaction layer.

- Focus rings and focus-within shadows must remain visible for compact composer controls, source controls, reference chips, plan actions, details summaries, and timeline controls.
- Hover states should use restrained border/background/color changes and at most the existing `translateY(-1px)` motion.
- Compact icon buttons must expose clear `aria-label` and `title` text.
- Keyboard focus should never require hidden overflow or clipped parent containers to look clean.
- Screenshot QA for final editor polish lives in `docs/ui-ux-screenshots/prompt-19-final-editor-polish/`.
