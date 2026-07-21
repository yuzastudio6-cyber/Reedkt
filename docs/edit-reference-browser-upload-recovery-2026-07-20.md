# Edit Reference browser upload recovery

Date: 2026-07-20
Status: mounted local/private recovery evidence; hosted recovery remains gated

## Outcome

The Edit Reference upload client now keeps one credential-free recovery descriptor in tab-scoped browser storage for the exact workspace, Edit Reference, study, and selected file.

The descriptor contains only:

- hashed scope and sampled-file fingerprints;
- one stable safe idempotency key;
- opaque upload-intent, storage-record, and media-asset identities when available;
- server-verified accepted bytes, total bytes, stage, and update time.

It never stores the raw file name, file bytes, workspace/reference/study identifiers, bearer token, signed URL, upload headers, or provider session credential.

The same file can therefore reuse the same domain idempotency key after an interrupted request. If upload finalization succeeds but attaching the evidence to the study fails, the verified storage and media identities remain recoverable; reselecting the same file attaches them without sending the video again. The descriptor is removed only after the evidence mutation succeeds.

If the evidence transaction commits but its HTTP response is lost, the browser reads the canonical reference back before reporting failure. A matching storage-record and media-asset binding is treated as the completed result, so the user is not invited to create duplicate evidence and the recovery descriptor can be cleared safely.

## Mounted experience

The existing Edit Reference evidence form remains the sole upload surface. It now:

- shows one inline unfinished/verified recovery state;
- asks the user to reselect the same file because browsers do not silently reacquire local file bytes;
- presents one **Resume upload** action after a recoverable transfer failure;
- keeps progress in an accessible live region and uses the existing bounded progress surface;
- states that large resumable transfer is used only after secure storage confirms the capability;
- preserves the original as source truth and treats any smaller copy as study-only.

This follows the ReEditPro resource-state hierarchy and the supporting UI/UX guidance: preserved work, cause-and-recovery copy, one dominant action, semantic status beyond color, no new dashboard or duplicate uploader.

## Evidence

The focused client smoke proves:

- the descriptor is credential-free;
- a same-file retry reuses the exact idempotency key;
- a finalized upload is not sent twice;
- clearing after successful attachment removes the recovery record;
- no live hosted recovery is claimed.

The mounted browser flow interrupts the evidence mutation after a real local/private upload is finalized, reloads the page, reselects the same video, attaches the retained identities, and proves that upload-intent, file-body, and finalize request counts do not increase.

A second mounted failure test lets the evidence transaction commit and then loses only its response. It proves that canonical readback recognizes the committed attachment, creates no second evidence mutation, and clears the browser recovery record.

## Honest remaining boundary

This is tab-scoped browser recovery, not deployed cross-device durability. It still requires the user to reselect the same local file. Hosted large-file recovery remains blocked until the shared backend provides:

- atomic durable upload-intent idempotency before external resumable-session creation;
- secure upload-target reissue/recovery without persisting bearer material;
- distributed finalization and verified offsets;
- deployed Auth/RLS/private-storage evidence;
- same-SHA browser/backend failure and restart proof.

No provider, cloud, Supabase, SQL, billing, deployment, public delivery, or production-readiness gate is activated by this slice.
