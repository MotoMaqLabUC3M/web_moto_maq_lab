#!/usr/bin/env bash
# Arranca API + admin (interno) + gateway en :3000 — web en /, admin en /admin/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT="$ROOT/apps/site"
PIDFILE="/tmp/mml-dev.pids"

rm -f "$PIDFILE"
touch "$PIDFILE"

if ss -tln 2>/dev/null | grep -q ':3000 '; then
  echo "El puerto 3000 ya está en uso."
  echo "Para el proceso anterior (p. ej. next dev o python http.server) y vuelve a ejecutar: make dev"
  exit 1
fi

cleanup() {
  echo ""
  echo "Deteniendo servicios de desarrollo…"
  if [[ -f "$PIDFILE" ]]; then
    while read -r pid; do
      kill "$pid" 2>/dev/null || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
  fi
}
trap cleanup EXIT INT TERM

if [[ ! -d "$ROOT/apps/admin/node_modules" ]]; then
  echo "Instalando dependencias del admin…"
  (cd "$ROOT/apps/admin" && npm install)
fi

echo "→ API       http://127.0.0.1:8080"
(cd "$ROOT/apps/api" && go run ./cmd/api) &
echo $! >> "$PIDFILE"

echo "→ Admin     interno :3001 (visible en :3000/admin)"
(cd "$ROOT/apps/admin" && PORT=3001 npm run dev) &
echo $! >> "$PIDFILE"

echo "Esperando API…"
for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:8080/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo ""
echo "════════════════════════════════════════════"
echo "  Web pública:  http://localhost:3000"
echo "  Admin:         http://localhost:3000/admin"
echo "  API:           http://localhost:3000/api/"
echo "════════════════════════════════════════════"
echo "  Ctrl+C para parar todo"
echo ""

MML_SITE_ROOT="$SITE_ROOT" go run "$ROOT/scripts/devgateway/main.go"
