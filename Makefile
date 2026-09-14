.PHONY: dev api-dev api-build admin-dev admin-build admin-install docker-dev docker-prod import-legacy site-dev

dev:
	bash scripts/dev.sh

site-dev:
	cd apps/site && python3 -m http.server 5500

api-dev:
	cd apps/api && go run ./cmd/api

api-build:
	cd apps/api && go build -o ../../bin/motomaqlab-api ./cmd/api

admin-install:
	cd apps/admin && npm install

admin-dev: admin-install
	cd apps/admin && PORT=3001 npm run dev

admin-build: admin-install
	cd apps/admin && npm run build

docker-dev:
	cd deploy && docker compose -f docker-compose.dev.yml up --build

docker-prod:
	cd deploy && docker compose up -d --build

import-legacy:
	cd apps/api && go run ./cmd/import -site ../site

site-generate:
	cd apps/site && python3 scripts/generate_team_html.py && python3 scripts/generate_sitemap.py && python3 scripts/generate_detail_pages.py
