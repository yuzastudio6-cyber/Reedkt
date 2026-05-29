# Web Production Readiness Roadmap

The web app is the launch path. These phases do not mark production, external beta, or broad real media ready by default.

| Phase | Focus | Outcome |
| --- | --- | --- |
| 44A platform boundaries | Create app/package/server boundaries, docs, static report, CLI summary, and smoke coverage. | Web-first product boundary exists; desktop remains deferred. |
| 44B web app structure migration (current) | Establish `apps/web` as canonical while preserving the current root Vite app. | Transitional web structure is documented without desktop runtime or launch claims. |
| 44C web production shell | Build the professional shell for dashboard, projects, editor entry, and review surfaces. | Users can navigate a coherent web product surface. |
| 44D web backend integration | Connect browser-safe flows to server-owned jobs, private artifacts, readiness, and progress. | Web requests work; server owns execution and secrets. |
| 44E web editing E2E | Validate upload, project state, editor shell, timeline, transcripts/captions, jobs, and artifacts end to end. | Internal web editing flow can be tested against approved gates. |
| 44F web review/QA interface | Add QA report, artifact browser, and private export review. | Human review and approval loops are visible in web. |
| 44G internal web beta readiness | Review support, privacy, cost, rollback, security, and operational readiness. | Internal web beta may be considered; external beta remains separate. |

Desktop implementation starts only after the web path is strong enough to justify a second app shell.
