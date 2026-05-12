# Intent-Led Edit Planning

## Core Principle

ReeditPro plans before it edits. The AI must understand user intent, source footage, transcript, reference DNA, platform, edit level, and credit budget before proposing generation.

Expensive AI editing, rendering, or generation must not start until the user approves the edit plan and credit estimate.

## Full Upload-To-Plan Flow

1. User uploads clips in source order.
2. User chooses video type from dropdown.
3. User chooses edit level.
4. User chooses mood/style if needed.
5. User adds optional reference video.
6. User writes custom instructions.
7. AI analyzes uploaded clips.
8. AI analyzes transcript/speech.
9. AI analyzes visual footage.
10. AI analyzes reference video if provided.
11. AI creates Source Sequence Map.
12. AI creates Reference DNA if relevant.
13. AI chooses an edit strategy.
14. AI routes signature systems per segment.
15. AI creates edit plan.
16. AI shows credit estimate.
17. User approves or requests changes.
18. Only after approval does generation/editing begin.

## Uploaded Clip Order

Uploaded clip order means:

> This is the source sequence — the order the user filmed the clips or believes they belong.

The AI should respect uploaded order as important context, but uploaded order is not automatically the final edit order.

The AI should create:

1. **Source Sequence Map**: raw uploaded order and what each clip appears to contain.
2. **Recommended Edit Structure**: AI's proposed final structure based on the user's goal.

The final edit order should not be changed without showing the plan first.

## User Intent Priority

User instruction wins. If the user says "simple edit, no hook," the AI should not force a hook. If the user asks for no visual overlays, the planner should not add Stroke Motion, VisualExplain, or Real Motion unless it asks and receives approval.

The planner should use dropdown and edit level as context, not as hard commands.

## Reference Video DNA

If a user pastes or uploads a reference video, AI should study it but not copy it shot-for-shot.

Reference DNA should extract:

- Topic
- Opening style
- Pacing
- Music intro
- Beat changes
- Transition style
- Caption style
- Visual effect style
- Use of Stroke Motion
- Use of Graphic Design / VisualExplain
- Use of Real Motion-style overlays
- Mood and tone
- Why the reference edit works

## Hook Decision System

Not every video needs a hook. Hook policy should be decided by user intent, workflow profile, platform, and goal.

Hook policies:

- Required
- Recommended
- Optional
- Not needed
- Avoid

Examples:

- Social Short / Viral Clip: recommended or required depending on user goal.
- Marketing Ad: usually required.
- Simple Clean Edit: not needed or avoid.
- Course / Training style content: optional or not needed.
- Real Estate / Property Tour: optional depending on whether the user wants luxury/natural or social performance.
- Vlog / Lifestyle: natural hook or optional.

## Edit Strategy Selection

The AI should choose an edit strategy based on:

- User goal.
- Platform.
- Edit level.
- Clip quality and order.
- Transcript structure.
- Visual footage.
- Reference DNA.
- Credit budget.
- Whether the result should feel simple, social, educational, premium, cinematic, natural, or direct-response.

## Signature Routing

All video types can use:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- None

The dropdown gives workflow context only. The AI decides per segment whether a visual or audio system improves the video.

The edit plan should state:

- Segment.
- Recommended system.
- Reason.
- Timing.
- Credit impact.
- Whether generation is optional or recommended.

## Credit Estimate

Before generation, ReeditPro must show a credit estimate covering:

- Transcript and planning work if credit-bearing.
- Stroke Motion.
- Graphic Design / VisualExplain.
- Real Motion.
- SoundSync.
- Rendering/export.
- Regeneration or optional alternatives when relevant.

## Approval Before Editing

The user must approve or request changes before generation starts.

The approval gate should protect:

- User credits.
- User creative intent.
- Source clip order.
- Final edit structure.
- Visual system usage.
- Real Motion cost.
- Rendering cost.
