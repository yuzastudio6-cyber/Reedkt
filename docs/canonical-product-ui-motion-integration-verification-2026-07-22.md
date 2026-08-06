# Canonical Product UI and Motion Integration Verification

Date: 2026-07-22

## Scope

This bounded integration reconciles the canonical backend lineage with the
approved normal Edit Chat, Edit Preferences, and Motion Studio Storytelling
frontend. It preserves one product shell and makes the workflow distinction
explicit:

- `Projects` remains the project-container library.
- `Edit Videos` opens the normal named-edit library.
- `/projects/:projectId/edits/:editSessionId` mounts `EditorPage` and the normal
  `ChatNativeEditor` editing workflow.
- `Motion Studio` opens its own library.
- `/motion-studio/storytelling/projects/:projectId/edits/:editSessionId` mounts
  the dedicated Storytelling Director workflow and never mounts the normal
  Edit Chat.
- `Edit Preferences` remains the single `/preferences` library and its
  exact-edit CTA returns to `/edit-videos`.

The shared canonical planning, estimate, approval, immutable snapshot, package,
queue, lease, private artifact, QA, internal-cost, and recovery authorities are
reused. No second Motion or Edit Preferences authority is introduced.

## Reconciled source

- Backend parent: `a2886858a7069c098553df12ed94b6adbc2b3672`.
- Frozen product UI source: `06decfa0d39f4a149a593ce13d5ad27fddab6e50`.
- Frozen prepared-script animatic runtime source: `7cd70a6d`.
- Frozen mounted Storytelling handoff artifacts were retained as
  `MOUNTED_STORYTELLING_UI_ACCEPTANCE_2026-07-21.md`,
  `STORYTELLING_FRONTEND_EXPORT_HANDOFF_2026-07-22.md`, and their two focused
  route/library smokes.

The integration preserves the newer backend's forward-only lifecycle,
provider-attempt, planning-authority, completed-attempt recovery, security, and
media-resource evidence instead of overwriting those files with an older
feature checkout.

## Speech and animatic execution

Storytelling Speech normalization uses only the existing strong server-injected
FFmpeg contract:

- operation: `tool.ffmpeg.execute_approved_media_recipe.v1`;
- recipe: `approved_storytelling_speech_take_normalization_v1`;
- exact production, provider output, Prepared Script segment, scene, Voice
  Bible, spoken-text, timing, source-authority, alignment, frame, and audio
  lineage is required;
- decoded PCM channel/sample/rate/count/duration facts must match the canonical
  runtime evidence;
- pipe-produced PCM is finalized into an exact bounded RIFF/WAVE artifact before
  hashing and persistence.

The prepared-script animatic reopens the exact private narration WAV through the
canonical dependency artifact reader and executes under the existing Remotion
queue/lease/one-use dispatch. Its QA keeps exact H.264/frame/color/video-duration
requirements and permits only the AAC encoder's single-packet tail:

- exactly one AAC stream;
- 48 kHz stereo;
- start time zero;
- audio/format duration from the exact frame duration through at most one
  1024-sample AAC packet.

Silent Remotion profiles retain exact format-duration equality.

## Verified evidence

The following checks passed on the integrated working tree before freeze:

- `npm run typecheck:server`;
- `npm run build`;
- `npm run lint`;
- `npm run check:frontend-boundary` — 966 files;
- `npm run check:secrets` — 5,488 files, no secret values printed;
- normal editor Chromium — 20/20;
- editor keyboard Chromium — 4/4;
- Motion Studio Chromium — 61/61;
- mounted Storytelling library create/recovery smoke;
- Storytelling workflow/route separation smoke;
- Storytelling Speech post-response smoke;
- offline media-binary execution smoke;
- `npm run smoke:canonical-private-tool-dispatch` — exit 0, all 50 exact tool
  identities revalidated, including prepared-script animatic dependency WAV,
  lease, dispatch, QA, internal cost, and replay.

## Honest remaining gates

This integration is protected local/internal evidence. It does not claim the
following work is complete:

- the authoritative 57-phase canonical plus six full-boundary aggregate on the
  final clean commit;
- complete execution of the routine two-hour 127-job long-form graph (the
  current bounded proof executes eight representative jobs);
- two consecutive clean-SHA break/fix acceptance runs;
- deployed Supabase/Auth/RLS/private storage, reviewed pinned Secret Manager
  bindings, live provider qualification, distributed workers, billing,
  deployment, public delivery, or production readiness.

No provider request, Secret Manager payload read, remote Supabase/cloud
mutation, billing, deployment, push, or public-delivery action was performed by
this integration.
