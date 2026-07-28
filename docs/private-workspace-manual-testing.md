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

To include the existing confined FFmpeg, libass, and Remotion private-review
path after approval:

```bash
npm run dev:private-workspace:review
```

Private-review mode requires a running local Docker engine. It builds and
revalidates the pinned private Remotion image before the API accepts requests,
so its first startup is intentionally slower. The launcher creates a fresh
server-only lease secret for that process and never places it in the browser
environment or status output.

The launcher starts:

- the Express API at `http://127.0.0.1:8787`;
- the Vite app at `http://127.0.0.1:5173`;
- a loopback-only Vite `/v1` proxy so the browser uses the same visible origin instead of calling the API port directly;
- local-test browser auth;
- reviewed `frontend_safe` HTTP transport to the loopback API;
- local private source uploads and private artifacts under `.reeditpro-local-storage/private-workspace`.
- the provider-free local worker mode used by bounded technical media stages.

With `dev:private-workspace:review`, the same API process also activates the
checksum-verified local FFmpeg, libass, and Remotion runtime authorities used
by the canonical approved work graph. The normal command leaves these
resource-heavy runtimes off.

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

Private-review mode supplies its generated internal lease secret only to the
API child. It is not copied to Vite, printed, persisted as plaintext, or
accepted from the browser.

The Express API binds to the selected loopback host, accepts tokenless mock identity only from a loopback caller/origin, and uses the fixed backend identity `mock-user-runtime`. The browser local-test identity remains tab-scoped in `sessionStorage`; its trusted backend mapping is injected only for this loopback development workflow.

The proxy target is accepted only from the launcher's credential-free loopback HTTP origin. Normal `npm run dev` has no API proxy. This avoids cross-port browser restrictions without widening the local authentication boundary.

Provider calls, Google Cloud, Supabase, Stripe, live credit mutation, public delivery, and deployed services remain disabled.
The local worker setting does not mount a semantic specialist runtime or
authorize provider/model execution. Private-review mode enables only the
existing provider-free technical media and composition stages. A target-video
study can therefore complete available technical stages, while unavailable
semantic stages remain explicitly incomplete instead of being replaced with
test fixtures.

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
Steps 9–18 require `npm run dev:private-workspace:review`. In the default mode,
the approved snapshot remains visible but runtime work fails closed.

9. Select **Prepare private handoff** and verify the saved workflow reports that the exact approved handoff is ready.
10. Select **Start private edit** and verify the browser shows a visible in-progress state while the backend advances only the exact approved private work graph.
11. Verify the saved workflow either reports bounded blocker counts or advances to **Private review ready** after required private QA and review assembly pass.
12. Select **Load private review** and verify the exact no-store private video opens with **Download review** available.
13. Either select **Approve private review**, or enter a specific revision direction and select **Request changes**.
14. For a revision, verify the journey reports **Changes are saved**, returns the revision direction to Chat, removes the stale Plan Review and Private Review, and explicitly requires a fresh plan, estimate, approval, and private review.
15. Refresh the saved workflow, then load the immutable history copy to verify the previous review remains available as context without authorizing new work.
16. For an exactly representable bounded revision, prepare the revised plan and verify the browser shows the next plan version with a fresh estimate and an unapproved **Approve plan** action. Confirm that Current Edit Preferences remain locked.
17. Approve the exact replacement plan and verify journey recovery advances to **Approved snapshot available** without automatically requesting an execution package or starting tools, providers, rendering, billing, or delivery.
18. For an acceptance, verify the journey reports **Private review approved** while public delivery remains a separate blocked step.
19. Confirm that external generation, public delivery, production rendering, customer charging, and publishing remain off.
20. Stop both processes with `Ctrl+C`.

The current browser milestone can request backend-owned work-graph advancement and private-review assembly from an immutable approved handoff, integrity-check the exact private MP4, record acceptance or a structured revision, reopen review history, and carry one exactly representable revision into replacement-plan presentation plus fresh approval. The backend reloads and injects revision authority while the browser supplies only bounded canonical identities/hashes and the new plan candidate; neither side reuses the prior approval. The browser never supplies or receives jobs, tools, artifact IDs, commands, paths, credentials, providers, prices, wallet actions, or release authority. Rich or structural revision compilation, public delivery, deployed real-user infrastructure, and broad rich-plan execution remain later gates, so this does not claim production or external-beta completion.

This manual path supplements, but does not replace, `npm run qa:internal-pipeline` and the headless full-stack browser smoke.
