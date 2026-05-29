# Web Job And Artifact UI Policy

Phase 44C adds job and artifact visibility for the web shell using mock-safe
fixtures only.

Job views may show completed, warning, blocked, and future queued states. They
must not trigger Cloud Run jobs, worker leases, media analysis, provider calls,
or render/export work from the browser.

Artifact views may show private source media, transcripts, captions, timeline
manifests, private exports, masks, previews, and QA reports. Model-weight
artifacts are not user-facing. Artifacts are private by default, and public
delivery/share controls remain disabled until later launch gates explicitly pass.
