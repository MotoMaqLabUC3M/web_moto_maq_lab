#!/usr/bin/env bash
# Genera deploy/.env.production con secretos aleatorios (NO commitear).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$ROOT/.env.production.example"
OUTPUT="$ROOT/.env.production"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "No se encontró $TEMPLATE" >&2
  exit 1
fi

if [[ -f "$OUTPUT" ]]; then
  echo "Ya existe $OUTPUT"
  echo "Bórralo primero si quieres regenerar secretos: rm $OUTPUT"
  exit 1
fi

jwt_secret="$(openssl rand -base64 48 | tr -d '\n/+=' | head -c 48)"
postgres_pw="$(openssl rand -hex 24)"
admin_pw="$(openssl rand -base64 18 | tr -d '\n/+=' | head -c 20)"

sed \
  -e "s|__CAMBIAR_JWT_SECRET_MIN_32_CHARS__|${jwt_secret}|g" \
  -e "s|__CAMBIAR_POSTGRES_PASSWORD__|${postgres_pw}|g" \
  -e "s|__CAMBIAR_ADMIN_PASSWORD__|${admin_pw}|g" \
  "$TEMPLATE" > "$OUTPUT"

chmod 600 "$OUTPUT"

echo "✓ Creado: $OUTPUT (permisos 600 — solo tu usuario)"
echo ""
echo "Siguiente:"
echo "  1. Revisa/edita dominio, STORAGE_DRIVER, R2 si aplica"
echo "  2. Copia el contenido a Coolify → Environment Variables"
echo "  3. Guarda ADMIN_PASSWORD en un gestor de contraseñas"
echo "  4. Opcional: rm $OUTPUT tras pegar en Coolify"
