# ReeditPro UI/UX Master Plan

## Product Vision

ReeditPro is a website and desktop web app for chat-first AI video editing. The product turns source clips and spoken intent into a planned, credit-aware professional edit. It is not a generic timeline editor, template dashboard, or mobile-first app.

## Non-Negotiable Product Laws

- Website and desktop web app come first. Mobile is future-only and must remain a responsive web accommodation, not a native mobile flow.
- Chat is the editor. Upload, source-order review, goal capture, clarifying questions, plan review, credit approval, progress, preview, revision, and export all originate in chat.
- Plan and credit approval happen before generation, rendering, provider execution, worker jobs, or credit deduction.
- UI must never imply expensive AI work starts before the user approves the edit plan and credit estimate.
- Timeline and advanced controls are secondary. They stay hidden or collapsed unless the user asks or a blocking issue requires review.
- Advanced technical and developer cards stay collapsed by default unless warning, blocking, or required for user action.
- `Preferences` and `Edit Preferences` are one feature. Use `Edit Preferences` in user-facing copy. Saved defaults and current-edit overrides are two scopes of that feature, not separate products.
- Internal testing, Supabase/API readiness, and route diagnostics are not normal Home or Edit Preferences content.

## Visual Direction

- Follow the ReeditPro AI Topology Matrix direction: deep-space foundation, glass surfaces, bounded grid, and restrained cyan, blue, and violet accents.
- Cyan `#00E5FF` is an accent, not a page or app background.
- Preferred background foundation:
  - `#05070D`
  - `#0A1020`
  - `#0F1117`
- Premium means restraint: calm spacing, subtle glow, clear grouping, and quiet hierarchy.
- Avoid generic SaaS cards, bright cyan pages, decorative clutter, card walls, and oversized app headers.

## Spacing And Structure Laws

- Use tokenized 4px rhythm from `src/styles/tokens.css`.
- Main screens should feel spacious, calm, and organized.
- App pages need short headers with direct task framing.
- Page sections should be grouped by workflow, not by arbitrary visual decoration.
- Avoid nested cards unless the inner card is a specific repeated item or modal-like tool.

## Header And Copy Laws

- App headers are concise and operational.
- Marketing headers may be larger, but should still stay specific to ReeditPro and the chat-first AI editing promise.
- Do not use "placeholder" as a user-facing title when "mock", "preview", "local demo", or "future integration" is clearer.
- Never describe subscriptions as unlimited AI editing.
- Always distinguish software access from Reedit Credits.

## Chat Editor Laws

- The chat editor must preserve the sequence: clips, goal, necessary questions, plan, credits, approval, progress, preview, revision, export.
- Required action cards stay expanded while they need input.
- Summary cards can be open by default but must remain concise.
- Advanced, safety, and developer details use progressive disclosure.
- Chat should not become a technical dump or a generic form.

## Composer And Microphone Laws

- Composer layout should feel familiar: attachment controls, labeled message input, secondary voice/reference controls, and one clear send action.
- The microphone icon is intentional. If voice is not connected, it must be disabled or clearly named as unavailable.
- Composer helper copy must reinforce the approval gate.

## Plan Review And Approval Laws

- Plan review cards must clearly separate proposed work, credit estimate, lower-cost options, and approval.
- Approval copy must say plan and credits are approved before work starts.
- Revisions that affect scope, timing, aspect ratio, credits, or provider route require a revised estimate and approval.

## Component Laws

- Use shared components and CSS tokens for buttons, inputs, cards, badges, surfaces, radii, shadows, focus states, and motion.
- One primary action per page region.
- Inputs need labels, placeholder text cannot be the only label, and focus states must be visible.
- Buttons need hover, focus, active, disabled, and reduced-motion-compatible states.
- Status cannot be communicated by color alone.

## Motion And Accessibility Laws

- Motion must be subtle, tokenized, and nonessential.
- `prefers-reduced-motion` must disable nonessential animation.
- Keyboard focus must be visible.
- Icon-only buttons need accessible labels.
- Progress indicators need semantic labels and values where possible.

## Performance Laws

- Keep heavy editor, planning, mock data, and advanced card families out of initial routes when safe.
- Prefer route-level lazy loading before deeper code splitting.
- Do not add heavy visual, animation, WebGL, or UI framework dependencies without explicit approval.
- Each UI milestone must report bundle warnings and likely causes.

## Route Goals

- `/`: explain chat-first AI editing, approval-before-generation, and the project-first app path without exposing retired app surfaces.
- `/dashboard`: resume the latest meaningful edit, surface real user-action states, and start a project. Use a first-project variant when empty; do not show onboarding to returning users.
- `/projects`: help users find projects, create projects, and reopen project edit lists.
- `/projects/new`: create the project shell before any edit, upload, planning, or approval work starts.
- `/projects/:projectId`: show one project's edits and create named edits through the plus/new-edit action.
- `/projects/:projectId/edits/:editSessionId`: keep the focused edit chat/workspace primary: upload gate, optional Edit Brief, prompt, plan, approval, progress, and private review.
- `/editor`: compatibility route for older internal links only; it must render the same focused edit workspace and should not become the primary navigation path.
- `/preferences`: manage Saved Edit Preferences copied into future edits. Visible copy says `Edit Preferences`; internal testing belongs in an environment-gated internal surface.
- Retired routes `/wallet`, `/pricing`, `/brand-kit`, `/exports`, `/upload`, `/edit-preferences`, `/settings`, and `/app` redirect into the clean Project -> Edit flow or Preferences and must not appear in the sidebar.

## Implementation Roadmap

1. Governance docs, route QA, small accessibility and polish fixes.
2. Resume-first Home implementation and visual signoff.
3. Page-level redesigns that preserve product laws and use page-specific composition.
4. Chat editor refinement with stronger plan review and credit approval hierarchy.
5. Edit Brief and one two-scope Edit Preferences architecture after state ownership/invalidation decisions.
6. Deeper bundle splitting for editor planning cards and advanced panels.
7. Backend-connected workflows only after approved backend, billing, storage, provider, and worker milestones.

## PR Quality Gate

Every UI PR must report:

- Product flow impact.
- Approval and credit gate impact.
- Accessibility notes.
- Motion and reduced-motion notes.
- Performance and bundle notes.
- Lint and build results.
