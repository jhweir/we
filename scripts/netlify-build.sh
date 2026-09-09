#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Netlify build wrapper — builds @coasys/ad4m from source (dev branch) and
# links it into the WE workspace before running the normal build.
#
# Why: WE's pnpm override pins a published pre-release tag of the SDK. New
# SDK features (batch RPC endpoints, performance fixes) land on ad4m's dev
# branch well before a new tag is cut. This script closes that gap for the
# deployed preview site so testing always runs against the latest SDK.
#
# The GitHub Actions CI is unaffected — it still builds against the published
# version, which is the right thing for merge-gating.
# ---------------------------------------------------------------------------
set -euo pipefail

echo "── Environment"
echo "  node: $(node --version)"
echo "  npm:  $(npm --version)"
echo "  pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"
echo "  git:  $(git --version)"
echo "  pwd:  $PWD"

AD4M_BRANCH="${AD4M_BRANCH:-dev}"
AD4M_DIR="/tmp/ad4m-sdk"
WE_ROOT="$PWD"

echo "── Clone coasys/ad4m (branch: $AD4M_BRANCH)"
rm -rf "$AD4M_DIR"
git clone --depth 1 --branch "$AD4M_BRANCH" \
  https://github.com/coasys/ad4m.git "$AD4M_DIR"
echo "  revision: $(git -C "$AD4M_DIR" rev-parse --short HEAD)"

echo "── Build @coasys/ad4m from source"
# AD4M's root package.json declares `workspaces` — npm walks up from core/,
# finds it, and tries to resolve every sibling (ui, connect, …) which use
# pnpm's `workspace:*` protocol. Strip the workspace context so npm treats
# core/ as a standalone package.
rm -f "$AD4M_DIR/package.json" "$AD4M_DIR/pnpm-workspace.yaml"
cd "$AD4M_DIR/core"
npm install --ignore-scripts
npx patch-package
npx tsc
npx rollup -c rollup.config.js
echo "  built: $(ls lib/index.cjs 2>/dev/null && echo 'ok' || echo 'MISSING')"

echo "── Link local SDK into WE workspace"
cd "$WE_ROOT"

# Rewrite the pnpm override to point at the local build.
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.pnpm.overrides['@coasys/ad4m'] = 'link:${AD4M_DIR}/core';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('  override:', pkg.pnpm.overrides['@coasys/ad4m']);
"

# Re-resolve with the rewritten override. --no-frozen-lockfile because the
# lockfile no longer matches the manifest (expected — the override changed).
pnpm install --no-frozen-lockfile

echo "── Build WE"
NODE_OPTIONS='--max-old-space-size=8192' pnpm build
