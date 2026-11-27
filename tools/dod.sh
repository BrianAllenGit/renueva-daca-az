#!/bin/bash
# Definition-of-done run: icons, metadata validation, Lighthouse (mobile). Docker only; tools are installed inside the throwaway container.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p docs/lighthouse
docker run --rm --ipc=host -v "$PWD":/site:ro -v "$PWD/docs/lighthouse":/out \
  mcr.microsoft.com/playwright:v1.49.1-noble bash -c '
    set -e; mkdir /tmp/a && cd /tmp/a && npm init -y >/dev/null && npm i --silent --no-audit --no-fund playwright@1.49.1 lighthouse@12.2.1 axe-core@4.10.2 >/dev/null 2>&1
    cp /site/tools/*.js . && node icons.js && node validate.js | tee /out/validate.txt && node extra.js | tee /out/extra-console.txt; node calc.js | tee /out/calc-console.txt; chmod -R a+r /out; node lh.js
    chown -R '"$(id -u):$(id -g)"' /out'
mkdir -p docs/screenshots; mv docs/lighthouse/calc-*.png docs/screenshots/ 2>/dev/null || true
for f in favicon-32.png apple-touch-icon.png icon-192.png icon-512.png; do mv docs/lighthouse/$f . ; done
