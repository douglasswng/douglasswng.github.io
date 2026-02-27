.PHONY: dev dev-network build preview preview-network lint lint-fix

dev:
	npm run dev

dev-network:
	npm run dev:network

build:
	npm run build

preview:
	npm run preview

preview-network:
	npm run preview:network

lint:
	npm run lint

lint-fix:
	npm run lint:fix
