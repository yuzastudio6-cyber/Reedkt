# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1

Implement the next guarded GStreamer/MKVToolNix external-agent execution step only after reading the confirmed dry-run 1R packet:

`docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/`

The next step may design a service-role-only guarded route or worker adapter for the approved contract envelope. It must remain disabled or confirmation-gated until negative tests prove fail-closed behavior.

Required inherited constraints:

- workers execute approved snapshots only;
- no raw command strings;
- command templates only;
- private input manifest with checksum required;
- output manifest and QA schema required;
- cleanup, retention, failure, and audit references required;
- no public URL or signed URL source-of-truth;
- no arbitrary private/user media;
- no final render/export;
- no Supabase mutation or SQL unless a separate explicit Supabase route/migration packet authorizes it;
- no GStreamer or MKVToolNix runtime execution until a later explicit confirmed runtime packet authorizes it.
