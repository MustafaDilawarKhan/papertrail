# Paper Trail — developer shortcuts
# Works with `make` in Git Bash, WSL, macOS, or Linux.
# On a fresh Windows install: `winget install GnuWin32.Make` or just copy the
# commands out of this file and paste them into PowerShell.

COMPOSE_DEV = docker compose -f docker-compose.dev.yml
COMPOSE_PROD = docker compose -f docker-compose.yml

.DEFAULT_GOAL := help

.PHONY: help dev dev-build dev-rebuild down logs logs-backend logs-frontend ps migrate shell-backend test prune prod prod-build

help: ## Show this help.
	@echo "Paper Trail — developer commands"
	@echo ""
	@echo "  make dev          Start backend + frontend (uses cached image if available)"
	@echo "  make dev-build    Start with image rebuild (run after requirements.txt or Dockerfile changes)"
	@echo "  make dev-rebuild  Force-rebuild from scratch (no cache) then start"
	@echo "  make down         Stop the stack and remove containers"
	@echo "  make logs         Tail logs from all services"
	@echo "  make logs-backend Tail backend logs only"
	@echo "  make migrate      Run the DB migration manually (also runs automatically on 'make dev')"
	@echo "  make shell-backend  Open a bash shell inside the backend container"
	@echo "  make ps           Show running container status"
	@echo "  make prune        docker system prune -af (clears unused images/volumes)"
	@echo "  make prod         Start the production stack"
	@echo "  make prod-build   Build + start the production stack"

dev: ## Start backend + frontend with hot reload.
	$(COMPOSE_DEV) up

dev-build: ## Start dev stack with rebuild (use when deps changed).
	$(COMPOSE_DEV) up --build

dev-rebuild: ## Force-rebuild from scratch (slow, ~5 min).
	$(COMPOSE_DEV) build --no-cache
	$(COMPOSE_DEV) up

down: ## Stop and remove dev containers.
	$(COMPOSE_DEV) down

logs: ## Tail all logs.
	$(COMPOSE_DEV) logs -f

logs-backend: ## Tail backend logs only.
	$(COMPOSE_DEV) logs -f backend

logs-frontend: ## Tail frontend logs only.
	$(COMPOSE_DEV) logs -f frontend

migrate: ## Run the DB migration manually (rare — it auto-runs on every 'make dev').
	$(COMPOSE_DEV) run --rm migrate

shell-backend: ## Bash inside the backend container.
	$(COMPOSE_DEV) exec backend bash

ps: ## Status of running containers.
	$(COMPOSE_DEV) ps

prune: ## Free disk space — drops unused Docker images, networks, build cache.
	docker system prune -af

prod: ## Start the production stack (no hot reload).
	$(COMPOSE_PROD) up

prod-build: ## Rebuild + start production stack.
	$(COMPOSE_PROD) up --build
