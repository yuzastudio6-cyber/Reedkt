# Dockerfile Build Context Review

| Directory | Dockerfile COPY | Exists now | Blocked by .dockerignore | Ignored by .gitignore | Generator |
| --- | --- | --- | --- | --- | --- |
| `dist-server` | `COPY dist-server ./dist-server` | true | false | true | `build:server` |
| `dist-remotion-worker` | `COPY dist-remotion-worker ./dist-remotion-worker` | false | false | true | `build:remotion-worker:mock` |
| `dist-staging-fixture-worker` | `COPY dist-staging-fixture-worker ./dist-staging-fixture-worker` | false | false | true | `build:staging-fixture-worker` |
| `dist-staging-real-video-export-worker` | `COPY dist-staging-real-video-export-worker ./dist-staging-real-video-export-worker` | false | false | false | `build:staging-real-video-export-worker` |

- Dockerfile too broad for version-probe-only purpose: `true`
- Slim probe Dockerfile would be safer: `true`
- Mutation occurred: `false`
