# Chat Planning UX Architecture

## Purpose

ReeditPro planning is deep, but the user should experience it as a guided AI chat. The chat should show required decisions, concise summaries, approval-critical information, and advanced details only when they are useful or expanded.

The product should not feel like a giant technical dump. The planning stack can contain intent, segment operations, visual assets, renderer plans, QA, prompts, validation, and regression checks, but those details should be organized so the approval path stays obvious.

## Planning phases

### Phase 1: Start

- Selected editing category
- Uploaded or demo clips
- AI greeting
- Demo scenario context in the prototype

### Phase 2: Source sequence

- Clips attached
- Source order review
- Reorder clips
- Confirm source order

### Phase 3: Edit setup

- Output format and frame
- Edit level
- Visual preference
- Optional reference video
- Custom instructions

### Phase 4: Understanding

- Compiled intent
- What the AI understood
- Must-follow rules
- Avoid rules
- Clarifying questions

### Phase 5: Plan

- Edit plan summary
- Segment edit operations summary
- Visual story plan summary
- Renderer and frame summary

### Phase 6: Safety and QA

- Character consistency if needed
- Documentary fact safety if needed
- QA plan summary
- Validation status

### Phase 7: Credits and approval

- Credit estimate
- Lower-cost alternatives
- Approve plan and credits

### Phase 8: Execution preview

- Mock progress after approval
- Preview-ready state

## Card priority

### required_user_action

- Source sequence confirmation
- Format and frame choice
- Edit level choice
- Clarifying questions
- Credit approval

These cards are expanded by default while they need input.

### user_summary

- Planning context
- Compiled intent
- Edit plan summary
- Credit estimate

These cards are expanded by default, but should stay concise.

### advanced_plan_detail

- Segment operations
- Visual asset plan
- Renderer plan
- QA plan when clean

These cards are available but collapsed by default after showing a one-line summary.

### safety_detail

- Character consistency
- Documentary fact safety
- QA plan
- Plan validation

Safety cards expand when they contain an active concern, warning, blocking issue, source-needed claim, real-person caution, or primary character planning.

### developer_detail

- Provider prompt preview
- Planner regression checks
- Provider routes
- Approved snapshot internals

Developer-heavy cards are collapsed by default and hidden from Guided mode unless they contain a warning or blocker.

## Default collapse behavior

Required user action cards are expanded until confirmed. User summary cards are expanded by default. Advanced plan detail cards are collapsed by default and expose compact summaries. Safety cards expand only when active or high severity. Developer detail cards are collapsed by default and grouped as advanced planning details.

## Approval path

The approval path should be obvious:

1. Confirm clips.
2. Confirm format and frame.
3. Confirm edit level.
4. Review what ReeditPro understood.
5. Review the edit plan summary.
6. Review credits.
7. Approve plan and credits.

Technical cards should not block visual clarity unless validation finds a blocking issue. Mock progress must still start only after plan and credit approval.

## Display modes

Guided mode shows required user actions, user summaries, and active safety concerns. Advanced details remain collapsed, and developer-only details stay hidden unless they carry warnings or blockers.

Detailed mode shows required, summary, advanced, and safety cards. Developer cards are available but remain collapsed.

Developer mode shows every planning card, including prompt preview and regression checks.

## Premium UX principle

The chat should feel guided, calm, professional, modular, and not overwhelming. It should not become a generic SaaS form, a timeline-first editor, or a wall of technical cards. Every new planning card should declare its phase, priority, default expansion behavior, and whether it is required before approval.
