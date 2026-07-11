# ReeditPro Chat Message Architecture

ReeditPro is chat-native: the chat is the editor. This document defines the structured message model that current mock UI and future backend AI responses should share.

## Goal

Represent user input, AI answers, setup questions, plan review, credit approval, progress, preview, revision, errors, attachments, and reference events as typed chat messages instead of unrelated hardcoded JSX blocks.

Cards may still render as JSX children during migration, but each visible chat moment should map to a message role, type, status, and accessibility behavior.

## Roles

Use the existing `ChatMessageRole` union from `src/types/projects-chat.ts`:

- `user`
- `assistant`
- `system`
- `agent`
- `worker`

Legacy `role="ai"` is accepted by `ChatMessage` only as a frontend compatibility alias for `assistant`.

## Message Types

`ReeditProChatMessageType` supports:

- `user_message`
- `assistant_message`
- `assistant_question`
- `assistant_plan_review`
- `assistant_credit_approval`
- `assistant_progress_update`
- `assistant_preview_ready`
- `assistant_revision_response`
- `assistant_error`
- `system_status`
- `attachment_event`
- `reference_event`

## Statuses

`ReeditProChatMessageStatus` supports:

- `idle`
- `pending`
- `loading`
- `success`
- `warning`
- `error`
- `approved`
- `generating`
- `preview_ready`

Statuses must not be color-only. Use clear copy, labels, icons, or semantic placement.

## Required Message Fields

A structured message should include:

- `id`
- `role`
- `type`
- optional `content`
- optional `status`
- optional `cardType`
- optional `actionIds`
- optional `createdAt`
- optional `order`
- optional `ariaLive`
- optional `accessibilityLabel`
- optional typed metadata

Use `JSONObject` or narrow object shapes. Avoid `any`.

## Card Attachment Rules

- Plan Review / Credit Approval attaches to `assistant_plan_review` or `assistant_credit_approval`.
- Source Sequence attaches to `assistant_message`.
- Setup questions attach to `assistant_question`.
- Reference prompts/results attach to `reference_event` or `assistant_message`.
- Progress attaches to `assistant_progress_update`.
- Preview attaches to `assistant_preview_ready`.
- Errors attach to `assistant_error`.
- Advanced/developer diagnostics remain lazy and collapsed unless warning/blocking.

Cards may remain JSX children while the app migrates, but they should be rendered inside a typed `ChatMessage`.

## Composer Behavior

- Empty sends are ignored.
- Accepted sends create a `user_message` immediately.
- Local mock responses may create an `assistant_revision_response`.
- Input clears only after the local message is accepted.
- Normal textarea newline behavior stays intact.
- `Cmd/Ctrl+Enter` may send.
- Voice input remains mock/disabled until a real voice milestone.

## Approval And Generation Laws

- Plan and credit approval must happen before mock progress or future generation.
- Approval failures produce `assistant_error`.
- Approval failures do not set approved state.
- Approval failures do not start progress.
- Approval failures do not imply credits were used.
- `PlanReviewApprovalCard` remains the single approval moment.

## Accessibility

- The chat thread needs a clear accessible label.
- Do not put aggressive live regions on the entire thread.
- Use per-message `ariaLive="polite"` for progress and revision responses.
- Use `ariaLive="assertive"` only for actionable errors.
- Icon-only actions need labels.
- Advanced toggles need expanded/collapsed semantics.
- Focus must not be hidden under sticky composer or project chrome.

## Do

- Keep Guided mode calm and user-facing.
- Attach technical cards to structured assistant messages.
- Keep advanced/developer details lazy.
- Use compact, actionable error copy.
- Preserve user trust around credits and approval.

## Do Not

- Do not make raw chat text the only planning input.
- Do not imply generation starts before approval.
- Do not create a separate non-chat workflow for core editing.
- Do not overuse `aria-live`.
- Do not expose provider, regression, or backend diagnostics by default.

## Prompt 7 Implementation Notes

- `src/types/projects-chat.ts` now contains structured ReeditPro chat message, type, status, card, and action unions.
- `ChatMessage` accepts structured role/type/status/live props and keeps legacy `ai` compatibility.
- `ChatThread` no longer sets live behavior on the whole thread.
- `ChatNativeEditor` now maps core visible blocks to typed messages while keeping cards as children.
- User sends create typed `user_message` events and local assistant revision acknowledgements.
- Approval-core failures render as `assistant_error` and explicitly state no credits were approved or used.

## Prompt 8 Chat Renderer Audit

Current structured model:

- `src/types/projects-chat.ts` defines `ReeditProChatMessageType`, `ReeditProChatMessageStatus`, `ReeditProChatCardType`, `ReeditProChatActionId`, `ReeditProChatCard`, `ReeditProChatAction`, and `ReeditProChatMessage`.
- `ChatMessage` accepts structured `id`, `role`, `type`, `status`, `ariaLive`, and label props, with legacy `role="ai"` still supported for older lazy subflows.
- `ChatThread` provides the accessible chat-region label and intentionally avoids thread-wide live-region behavior.
- Main editor messages are now rendered through `ChatMessageList` and `ChatMessageRenderer`.

Migrated editor blocks:

- Demo scenario selector and scenario summary are typed `system_status` messages.
- Initial greeting, setup acknowledgements, source sequence, footage prep, setup questions, timing summaries, video-understanding summaries, adaptive strategy, compiled intent, plan review, timeline link, progress, and preview are typed descriptors.
- User sends create structured runtime `user_message` descriptors.
- Local mock assistant acknowledgements create `assistant_revision_response` descriptors.
- Approval failures create `assistant_error` descriptors with `ariaLive="assertive"`.
- Approved mock progress creates `assistant_progress_update`; preview readiness creates `assistant_preview_ready`.

Card-slot approach:

- Cards remain typed JSX slots attached to messages through `message.cards`.
- `ChatMessageRenderer` and `ChatMessageList` do not import planner modules, advanced diagnostics, SFX, music, or footage-prep modules.
- `ChatNativeEditor` owns the card-slot renderers so existing handlers, lazy boundaries, and approval gates stay intact.
- `PlanReviewApprovalCard` remains the single visible approval moment.

Backend-readiness notes:

- Message descriptors now carry stable IDs, role/type/status, optional cards, optional actions, metadata, and live-region intent.
- Future backend AI responses can map backend records to the same renderer without changing the visual shell.
- Runtime message builders are lightweight and planner-free, so they can later be shared by API response adapters.
- Pure JSON card payloads, backend streaming deltas, voice-message objects, real upload objects, and persisted cross-project chat history remain future work.

SFX/music status:

- SFX and music flows remain lazy-loaded and are not imported into the default editor route.
- Their existing chat-like messages now use structured `ChatMessage` props where safe.
- A deeper descriptor-list migration for SFX/music is deferred because those flows have separate local state and larger workflow payloads.

## Prompt 8 Editor Visual Reset Notes

- The visual reset preserved `ChatMessageList`, `ChatMessageRenderer`, message builders, typed message descriptors, and typed card slots.
- Demo scenario and planning progress controls moved out of the default conversation into a collapsed editor utility strip, but remain available without changing message contracts.
- The main conversation still renders greeting, attachment/source sequence, required questions, reference, compiled intent, plan review, runtime user/revision/error messages, progress, preview, and timeline link as structured messages.
- `PlanReviewApprovalCard` remains attached to the `assistant_plan_review` message and remains the single approval action surface.
- Per-message `ariaLive` behavior remains unchanged: errors can be assertive, progress/preview/revision can be polite, and static messages stay quiet.

## Prompt 9 Interaction Polish Notes

- The visual and interaction polish preserved the descriptor-driven chat thread, `ChatMessageList`, `ChatMessageRenderer`, message builders, per-message live regions, and typed card slots.
- Source sequence, reference controls, plan review, progress, preview, revision responses, and approval errors remain attached to structured messages rather than scattered outside the chat renderer.
- Reference attach/skip/edit controls were added inside the existing reference card slot. Focus chips are local UI metadata in Prompt 9 and do not change backend-ready message contracts.
- Approval failure still renders as `assistant_error`; approved progress still renders as `assistant_progress_update`; preview readiness still renders as `assistant_preview_ready`.
- Future backend message work can map reference focus chips into typed metadata once the backend contract exists.

## Revised Prompt 9 Floating Composer Notes

- The floating composer and minimal header pass did not change message descriptors, card slots, message builders, `ChatMessageList`, or `ChatMessageRenderer`.
- The plan review, progress, preview, revision, reference, and error messages remain structured chat messages.
- The composer remains the same mock-safe input path: empty sends are ignored, normal sends create a user message plus assistant revision response, and approval still happens only through `PlanReviewApprovalCard`.
- Per-message live-region behavior remains unchanged.

## Deferred Work

- Convert nested SFX/music subflows to full descriptor-list rendering.
- Convert typed JSX card slots to backend-fed card payloads where safe.
- Add streaming assistant deltas only after backend AI/message contracts exist.
- Add persistent chat session storage only after backend/database message contracts exist.

## Prompt 10 Expanded Flow Notes

Prompt 10 preserved the structured chat architecture while polishing expanded SFX and Music/SoundSync flows.

- Main editor messages still render through typed descriptors, `ChatMessageList`, `ChatMessageRenderer`, and card slots.
- Approval failure remains `assistant_error`.
- Main progress remains `assistant_progress_update`.
- Preview readiness remains `assistant_preview_ready`.
- SFX and Music/SoundSync remain lazy-loaded optional subflows.
- SFX and Music/SoundSync still use local state and direct structured `ChatMessage` components rather than the main descriptor-list renderer.
- Dense SFX technical cards are grouped behind `SFX planning details` so the expanded flow does not become a default card wall.
- Detailed music cue cards and Lyria prompt preview are grouped behind `Music cue details`.
- Plan/credit approval behavior inside those subflows is unchanged and remains mock-only.

Remaining migration plan:

- Convert SFX/music subflows to builder-created message descriptors once their local approval/progress state can be represented cleanly.
- Keep generic renderers free of SFX/music imports so lazy boundaries remain intact.
- Convert SFX/music technical detail cards to typed backend payloads only after backend message/card contracts exist.

## Prompt 11 SFX/Music Descriptor Migration Audit

Main editor status:

- `ChatNativeEditor` renders the primary editor conversation through descriptor objects, `ChatMessageList`, `ChatMessageRenderer`, and typed card slots.
- The main renderer remains lightweight and does not import SFX, music, advanced diagnostics, timeline internals, provider code, or planner-heavy modules.

SFX status before migration:

- `SFXPlanChatFlow` was lazy-loaded and optional, but rendered its own sequence with direct structured `ChatMessage` components.
- User-facing SFX summaries were the director plan, SFX credit estimate, progress, QA/revision state, and local revision acknowledgements.
- Advanced-only SFX details were project integration, events, provider route, prompt preview, timing/trim, mix, QA detail, and library candidate notes.
- Approval-critical SFX cards were the director plan approval and SFX credit estimate.
- Provider route, prompts, library candidates, timing diagnostics, mix, and QA detail were appropriate to keep behind `SFX planning details`.

Music/SoundSync status before migration:

- `MusicPlanChatFlow` was lazy-loaded and optional, but rendered direct structured `ChatMessage` components instead of a descriptor list.
- User-facing Music/SoundSync summaries were context, cue sheet approval, music credit estimate, progress, QA/mix, revision options, and local revision acknowledgements.
- Advanced-only music details were detailed cue cards and Lyria prompt preview.
- Approval-critical music cards were the cue sheet plan approval and music credit estimate.
- Detailed cue cards and Lyria prompt preview were appropriate to keep behind `Music cue details`.

Migration classification:

- SFX descriptor migration now covers assistant intro/plan summary, SFX credit estimate, progress, revision response, and revision options.
- Music descriptor migration now covers context summary, cue sheet plan, credit estimate, progress, QA/mix/revision result, and revision response.
- Existing SFX/Music visual cards remain JSX card slots attached to typed message descriptors.
- Deep backend JSON payload rendering for SFX/Music cards remains deferred.

## Prompt 11 Migration Results

- Added explicit SFX/Music card type literals to the typed card model without adding new message types.
- Added lightweight SFX/Music message builder helpers that produce descriptors only and import no visual cards or heavy planning modules.
- `SFXPlanChatFlow` now builds a local descriptor list and renders it through `ChatMessageList`.
- `MusicPlanChatFlow` now builds a local descriptor list and renders it through `ChatMessageList`.
- SFX/Music advanced details remain collapsed by default through native `details` controls attached as advanced card slots.
- The advanced timeline is now passed into `ChatNativeEditor` as an inline canvas slot, preserving lazy loading while making the drawer feel part of the editor workspace.

Backend-readiness implication:

- SFX/Music can now follow the same future backend mapping path as the main editor: backend message records can become descriptors, while rich cards continue as controlled typed card slots until payload schemas mature.
- Future streaming should emit message-level deltas first and leave SFX/Music technical card payload streaming deferred until backend contracts define those payloads.

## Prompt 16 Composer Scroll-Under Notes

Prompt 16 changed the editor canvas layering only. It did not change message descriptors, typed card slots, runtime message builders, or the renderer path.

- Main editor messages still render through `ChatMessageList` and `ChatMessageRenderer`.
- SFX and Music/SoundSync still render through local descriptor lists and stay lazy-loaded.
- Plan review, approval errors, progress, preview, revision responses, source sequence, reference, timeline, SFX, and Music/SoundSync cards remain attached to structured messages.
- The composer fade/layer sits outside the message list and does not create extra chat records or aria-live noise.
- Messages and cards can now scroll visually under the composer overlay while remaining semantically unchanged.

## Card Fix Prompt 2 Message/Card Hierarchy

Prompt 17 changes only the visual density and width of typed card slots. The structured chat architecture remains unchanged.

- Main editor messages still render through typed descriptors, `ChatMessageList`, `ChatMessageRenderer`, and card slots.
- Source sequence, reference DNA, plan review, planning progress, preview, SFX, and Music/SoundSync cards remain attached to assistant messages rather than becoming independent dashboard panels.
- Text-only assistant messages keep a readable conversational measure.
- Card-bearing assistant messages may center a bounded card stack so cards align with the compact composer lane.
- Normal AI cards are intentionally narrower than the composer; source and approval cards are allowed wider treatment but remain bounded.
- Secondary and technical details should use progressive disclosure where possible, as with source-mode options and reference DNA details.
- Approval descriptors and approval failure descriptors are unchanged; only card layout and density changed.

## Conversation Rhythm Prompt 3 Visual Grouping

Prompt 18 keeps the descriptor architecture unchanged and adds only render-time visual grouping.

- `ChatMessageList` computes grouping from adjacent message roles; message records are not mutated.
- Rendered messages expose `data-role`, `data-group-position`, and `data-compact-label` for QA and CSS.
- `single` and `first` messages show the normal subtle role label.
- `middle` and `last` messages visually clip the repeated label while keeping label text in the DOM.
- Card-bearing assistant messages keep intro text and cards in the same message body so cards remain attached to the assistant response.
- Text-only assistant messages remain conversational and narrower than structured cards.
- SFX/Music descriptor lists inherit the same rhythm because they use `ChatMessageList`.

## Final Editor Polish Prompt 4 Interaction Preservation

Prompt 19 keeps the structured chat architecture unchanged.

- Message descriptors, card slots, grouping attributes, and renderer boundaries are unchanged.
- Keyboard/focus tests operate against rendered controls and do not add hidden debug controls.
- Composer keyboard send still creates a normal user message and does not trigger approval or generation.
- Approval, progress, preview, SFX, Music, and timeline cards remain attached to typed chat messages.
- Details disclosures remain progressive UI inside existing card slots rather than new message types.

## Prompt 21 Copy Density Preservation

Prompt 21 changes wording only. Message descriptors, message ids, card slots, data-testid values, grouping attributes, lazy SFX/Music boundaries, approval gates, and renderer boundaries remain unchanged.

- Main assistant messages use shorter user-facing guidance while keeping the same descriptor order.
- Source, reference, plan review, progress, preview, SFX, and Music cards remain attached to the same assistant messages.
- Composer label/helper text remains visually hidden and accessible; the visible composer structure is unchanged.
- Approval failure remains an `assistant_error` message and still states that no credits were approved or used.
- Advanced/provider/developer wording may remain technical when it is inside explicit details surfaces.
