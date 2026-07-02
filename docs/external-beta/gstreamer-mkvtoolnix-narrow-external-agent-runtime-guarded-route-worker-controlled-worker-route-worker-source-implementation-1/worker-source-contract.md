# Worker Source Contract

Worker source ID: `worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered`

Worker source path: `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`

Worker owner: `backend_worker_only`

Worker source mode: `source_file_created_not_registered_not_dispatched`

Worker runtime mode: `disabled_source_contract_only`

Worker registered at runtime: `false`

Queue consumption mode: `not_enabled`

The worker source module is a typed source contract only. It does not consume queue items, start a process, claim leases, run GStreamer, run MKVToolNix, run Docker, run FFmpeg/FFprobe, process media, or write artifacts.

Denied input classes:

- raw chat;
- raw command strings;
- frontend file paths;
- arbitrary private or user media;
- public URL source-of-truth;
- signed URL source-of-truth;
- private/user media execution without a later explicit guarded approval.
