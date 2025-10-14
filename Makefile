.PHONY: help build up down logs restart clean migrate shell test

help:
	@echo "DrWell - Comandos Disponíveis:"
	@echo "  make build     - Construir imagens Docker"
	@echo "  make up        - Iniciar todos os serviços"
	@echo "  make down      - Parar todos os serviços"
	@echo "  make logs      - Ver logs de todos os serviços"
	@echo "  make restart   - Reiniciar todos os serviços"
	@echo "  make clean     - Parar e remover volumes (CUIDADO!)"
	@echo "  make migrate   - Executar migrations do banco"
	@echo "  make shell     - Abrir shell no container da API"
	@echo "  make test      - Executar testes"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ Serviços iniciados!"
	@echo "📝 API: http://localhost/api/v1"
	@echo "📚 Docs: http://localhost/docs"
	@echo "🌸 Flower: http://localhost:5555"
	@echo "🔀 Traefik: http://localhost:8080"

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	@echo "⚠️  ATENÇÃO: Isso irá apagar todos os dados!"
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Volumes removidos"; \
	fi

migrate:
	docker-compose exec api alembic upgrade head

shell:
	docker-compose exec api bash

test:
	docker-compose exec api pytest
