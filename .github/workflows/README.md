# Workflows

## publish.yml

Triggered by any `v*` tag push. Builds the library and publishes to npm, then creates a GitHub Release.

### Authentication — npm Trusted Publishing (OIDC)

This workflow uses **npm Trusted Publishing** (granular OIDC tokens) — no long-lived npm secret is stored in GitHub. npm fetches a short-lived publish token automatically when `--provenance` is passed and the job has `id-token: write` permission.

**What makes this work:**

- `permissions.id-token: write` — lets the runner request an OIDC token from GitHub
- `npm publish --provenance` — triggers npm to exchange the OIDC token for a granular publish token and attach a signed provenance statement
- `NODE_AUTH_TOKEN: ""` — intentionally empty; prevents any stale token in the environment from being picked up while still satisfying npm's env-var check
- **No `registry-url` in `setup-node`** — adding `registry-url` causes `setup-node` to write an `.npmrc` that routes auth through `NODE_AUTH_TOKEN`, which breaks the OIDC flow. Leave it out.
- **Node 24 (not `npm install -g npm@latest`)** — Node 24 ships with npm 10.x, which supports OIDC Trusted Publishing. Avoid `npm install -g npm@latest`; since npm 12 was released it installs a version with broken sigstore bundling that causes `Cannot find module 'sigstore'` at publish time.

**What to configure on npmjs.com:**

The package must have Trusted Publishing enabled for this repository under  
`npmjs.com → package → Settings → Publishing → Trusted Publishers`.