# Server Surface

Packet: `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1`

The deployed backend image previously built and copied only `dist-server`, so authenticated browser paths on `reeditpro-staging-api` returned JSON `404` responses instead of HTML.

This packet adds a bounded browser surface to the existing mock-safe Node server:

- Browser HTML routes: `/`, `/dashboard`, `/projects`, and `/editor` resolve to `dist/index.html`.
- Static assets under `/assets/*` resolve to files in the built frontend bundle.
- `/api/*`, `/v1/*`, `/health`, and `/ready` remain API/readiness paths and are not served by the static fallback.
- Missing static files fail closed to the existing JSON not-found response.
- The server uses `REEDITPRO_WEB_DIST_DIR` for local proof and defaults to `dist` in the runtime image.

The backend Dockerfile packages the UI by building the frontend before the server and copying `dist` into the runtime image:

- `RUN npm run build && npm run build:server`
- `COPY --from=build /app/dist ./dist`

This packet does not deploy Cloud Run. It prepares source for the next guarded staging deploy and UI flow resmoke.
