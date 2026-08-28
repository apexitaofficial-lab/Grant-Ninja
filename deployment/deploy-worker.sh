#!/usr/bin/env bash
#
# Update the crawl worker on the Ubuntu server.
#
#   ssh grantninja@your-server
#   cd /srv/grant-ninja && ./deployment/deploy-worker.sh
#
# Deliberately does not run database migrations. Those are applied from a
# developer machine *before* deploying, because a migration is shared with the
# Vercel frontend and must land before either side ships code that uses it.

set -euo pipefail

REPO_DIR="/srv/grant-ninja"
PYTHON_DIR="${REPO_DIR}/python"
SERVICE="grant-ninja-worker"

echo "==> Pulling latest code"
cd "${REPO_DIR}"
git pull --ff-only

echo "==> Installing Python dependencies"
cd "${PYTHON_DIR}"
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt

# Crawl4AI drives a real browser. A dependency bump can expect a newer
# Chromium than the one on disk, and the failure looks like every page timing
# out rather than anything about browsers.
#
# The path is pinned rather than left to HOME. Run this script with sudo and an
# unpinned install lands in /root/.cache, which ProtectHome=true then hides from
# the service — the worker looks for a browser it cannot see, and the symptom is
# every fetch quietly degrading to plain HTTP with no error that mentions
# browsers at all.
echo "==> Ensuring the browser is current"
PLAYWRIGHT_BROWSERS_PATH=/srv/grant-ninja/.cache/ms-playwright \
  .venv/bin/python -m playwright install --with-deps chromium
# Installed as root when this script is run with sudo, so hand it back.
chown -R grantninja:grantninja /srv/grant-ninja/.cache/ms-playwright

echo "==> Checking configuration and database access"
# Fails loudly here, while the old worker is still running, rather than after
# the restart has already taken the crawler down.
.venv/bin/python -m app.health

echo "==> Restarting the worker"
sudo systemctl restart "${SERVICE}"
sleep 3
sudo systemctl status "${SERVICE}" --no-pager --lines=10

echo
echo "==> Done. Follow the log with:"
echo "    journalctl -u ${SERVICE} -f"
