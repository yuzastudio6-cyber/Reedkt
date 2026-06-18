# Build Command Approval Matrix

| Command | Expected output | Future-safe | Ran now | May process media | May render/export | May commit output | Cleanup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `npm run build:server` | `dist-server` | true | false | false | false | false | `rm -rf dist-server` |
| `npm run build:remotion-worker:mock` | `dist-remotion-worker` | true | false | false | false | false | `rm -rf dist-remotion-worker` |
| `npm run build:staging-fixture-worker` | `dist-staging-fixture-worker` | true | false | false | false | false | `rm -rf dist-staging-fixture-worker` |
| `npm run build:staging-real-video-export-worker` | `dist-staging-real-video-export-worker` | true | false | false | false | false | `rm -rf dist-staging-real-video-export-worker` |

All commands exact: `true`
All outputs exact: `true`
