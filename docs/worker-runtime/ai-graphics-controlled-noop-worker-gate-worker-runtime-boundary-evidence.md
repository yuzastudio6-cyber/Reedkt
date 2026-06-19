# Worker Runtime Boundary Evidence

The executor imports only `node:crypto`, `node:fs`, `node:path`, and `node:url`.

It does not import Worker Runtime modules, route handlers, tool runtimes, provider clients, Supabase clients, browser/WebGL/canvas modules, media/render code, storage clients, or network-capable application code.
