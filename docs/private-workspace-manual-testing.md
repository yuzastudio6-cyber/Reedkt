# Private Workspace Manual Testing

Status: `implemented_local_private_single_host_only`

## Purpose

The private workspace launcher gives a tester one command for the current signed-in ReeditPro browser journey while keeping the API, browser app, uploads, and persisted artifacts on one loopback-only development host.

It is not a staging environment, deployed multi-user runtime, external beta, production auth system, provider runtime, billing runtime, or public delivery path.

## Start

From the repository root:

```bash
npm run dev:private-workspace
```

The launcher starts:

- the Express API at `http://127.0.0.1:8787`;
- the Vite app at `http://127.0.0.1:5173`;
- a loopback-only Vite `/v1` proxy so the browser uses the same visible origin instead of calling the API port directly;
- local-test browser auth;
- reviewed `frontend_safe` HTTP transport to the loopback API;
- local private source uploads and private artifacts under `.reeditpro-local-storage/private-workspace`.

Open the printed `/sign-in` URL and select **Enter test workspace**. No bearer token, JWT, Supabase session, API key, or provider credential is created by this flow.

Stop both services with `Ctrl+C`. The launcher supervises both children and releases both loopback ports on shutdown.

Normal `npm run dev` is unchanged and remains the frontend-only development command.

## Safety Boundary

The launcher fails closed when:

- `NODE_ENV=production`;
- the requested host is not `127.0.0.1`, `localhost`, or `::1`;
- web and API ports are invalid or collide;
- either loopback port is already occupied;
- the private API does not resolve to explicit local/mock auth and local storage.

The child environments are intentionally rebuilt from a small OS-only allowlist. Supabase, Google Cloud, provider, Stripe, and secret-reference variables are set to empty values. The Vite process uses an isolated empty `envDir`, so repository `.env` files cannot silently activate a different browser runtime for this command.

The Express API binds to the selected loopback host, accepts tokenless mock identity only from a loopback caller/origin, and uses the fixed backend identity `mock-user-runtime`. The browser local-test identity remains tab-scoped in `sessionStorage`; its trusted backend mapping is injected only for this loopback development workflow.

The proxy target is accepted only from the launcher's credential-free loopback HTTP origin. Normal `npm run dev` has no API proxy. This avoids cross-port browser restrictions without widening the local authentication boundary.

Provider calls, Google Cloud, Supabase, Stripe, live credit mutation, public delivery, and deployed services remain disabled.

## Non-starting Checks

Validate the launcher configuration without binding ports or starting processes:

```bash
npm run dev:private-workspace:check
```

Run the focused safety smoke:

```bash
npm run smoke:private-workspace-launcher
```

The smoke verifies loopback-only configuration, production rejection, port validation, isolated storage selection, local-test auth, frontend-safe transport, local uploads, credential scrubbing, and a secret-free check summary.

## Optional Local Port Overrides

When the default ports are already used by another local process:

```bash
REEDITPRO_PRIVATE_WORKSPACE_WEB_PORT=5273 \
REEDITPRO_PRIVATE_WORKSPACE_API_PORT=8887 \
npm run dev:private-workspace
```

`REEDITPRO_PRIVATE_WORKSPACE_HOST` may be set only to a loopback host. Non-loopback values such as `0.0.0.0` fail before any process starts.

## Manual Journey

Use this runtime to exercise the current active product only:

1. Start the private workspace.
2. Open `/sign-in` and start the local test session.
3. Create or open a project.
4. Create or open a named edit.
5. Upload source media in the focused edit workspace.
6. Complete source preparation and the optional inline Edit Brief.
7. Review the edit plan and credit estimate.
8. Approve before any gated private execution begins.
9. Review the private result or request a revision.
10. Stop both processes with `Ctrl+C`.

This manual path supplements, but does not replace, `npm run qa:internal-pipeline` and the headless full-stack browser smoke.
