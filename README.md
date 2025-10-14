# DrWell - CRM para Advogados

Sistema de gerenciamento para escritórios de advocacia com integração automática com as APIs do DataJud (CNJ) para acompanhamento de processos judiciais.

## Funcionalidades

- Cadastro de escritórios de advocacia (usuário Master)
- Gestão de advogados funcionários com permissões
- Cadastro e gerenciamento de clientes
- Cadastro e acompanhamento de processos judiciais
- Sincronização automática com APIs DataJud (70+ tribunais)
- Histórico completo de movimentações processuais
- Gestão financeira
- Kanban de prazos
- Templates de documentos

## Tecnologias

- **Backend**: FastAPI (Python 3.11)
- **Banco de Dados**: PostgreSQL 15
- **Cache/Broker**: Redis 7
- **Jobs Assíncronos**: Celery + Celery Beat
- **Reverse Proxy**: Traefik v2
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Monitoramento**: Flower (Celery tasks)

## Estrutura do Projeto

```
drwell/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/      # Rotas da API
│   │       │   ├── auth.py
│   │       │   ├── users.py
│   │       │   ├── law_firms.py
│   │       │   ├── lawyers.py
│   │       │   ├── clients.py
│   │       │   ├── processes.py
│   │       │   └── financial.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py          # Configurações
│   │   ├── database.py        # Conexão DB
│   │   └── security.py        # JWT/Auth
│   ├── models/                # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── law_firm.py
│   │   ├── lawyer.py
│   │   ├── client.py
│   │   ├── process.py
│   │   ├── process_movement.py
│   │   └── financial.py
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Lógica de negócio
│   │   └── datajud_service.py
│   ├── workers/               # Celery tasks
│   │   ├── celery_app.py
│   │   └── tasks.py
│   └── main.py                # Aplicação FastAPI
├── alembic/                   # Migrations
├── docker/
│   └── traefik/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

## Instalação e Configuração

### Pré-requisitos

- Docker
- Docker Compose
- Git

### 1. Clone o repositório

```bash
git clone <repository-url>
cd drwell
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:
- `SECRET_KEY`: Chave secreta para JWT (gere uma aleatória)
- `POSTGRES_PASSWORD`: Senha do PostgreSQL
- `REDIS_PASSWORD`: Senha do Redis
- `DATAJUD_API_KEY`: Sua chave da API DataJud

### 3. Inicie os containers

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver status dos containers
docker-compose ps
```

### 4. Execute as migrations do banco de dados

```bash
# Criar a primeira migration
docker-compose exec api alembic revision --autogenerate -m "Initial migration"

# Aplicar migrations
docker-compose exec api alembic upgrade head
```

## Serviços Disponíveis

Após iniciar, os seguintes serviços estarão disponíveis:

- **API FastAPI**: http://localhost/api/v1
- **Documentação (Swagger)**: http://localhost/docs
- **Traefik Dashboard**: http://localhost:8080
- **Flower (Celery Monitor)**: http://localhost:5555
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## API Endpoints

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/refresh` - Refresh token

### Escritórios
- `GET /api/v1/law-firms` - Listar escritórios
- `POST /api/v1/law-firms` - Criar escritório
- `GET /api/v1/law-firms/{id}` - Detalhes do escritório
- `PUT /api/v1/law-firms/{id}` - Atualizar escritório

### Advogados
- `GET /api/v1/lawyers` - Listar advogados
- `POST /api/v1/lawyers` - Cadastrar advogado
- `GET /api/v1/lawyers/{id}` - Detalhes do advogado
- `PUT /api/v1/lawyers/{id}` - Atualizar advogado
- `DELETE /api/v1/lawyers/{id}` - Deletar advogado

### Clientes
- `GET /api/v1/clients` - Listar clientes
- `POST /api/v1/clients` - Cadastrar cliente
- `GET /api/v1/clients/{id}` - Detalhes do cliente
- `PUT /api/v1/clients/{id}` - Atualizar cliente
- `DELETE /api/v1/clients/{id}` - Deletar cliente

### Processos
- `GET /api/v1/processes` - Listar processos
- `POST /api/v1/processes` - Cadastrar processo
- `GET /api/v1/processes/{id}` - Detalhes do processo
- `GET /api/v1/processes/{id}/history` - Histórico de movimentações
- `POST /api/v1/processes/{id}/sync` - Sincronizar com DataJud
- `PUT /api/v1/processes/{id}` - Atualizar processo

### Financeiro
- `GET /api/v1/financial` - Listar registros
- `POST /api/v1/financial` - Criar registro
- `GET /api/v1/financial/summary` - Resumo financeiro
- `GET /api/v1/financial/{id}` - Detalhes do registro
- `PUT /api/v1/financial/{id}` - Atualizar registro

## Integração com DataJud

O sistema se integra automaticamente com as APIs públicas do DataJud (CNJ) para:

- Buscar dados de processos
- Sincronizar movimentações
- Manter histórico atualizado

### Tribunais Suportados

- **27 Tribunais de Justiça** (TJ - Estados)
- **24 Tribunais Regionais do Trabalho** (TRT)
- **6 Tribunais Regionais Federais** (TRF)
- **Tribunais Superiores** (TST, TSE, STJ)

### Sincronização Automática

O sistema executa sincronizações automáticas através de jobs Celery:

- **A cada hora**: Sincroniza todos os processos ativos
- **Sob demanda**: Através do endpoint `/processes/{id}/sync`

## Jobs Assíncronos (Celery)

### Tasks Configuradas

1. **sync_process** - Sincroniza um processo específico
2. **sync_all_processes** - Sincroniza todos os processos ativos
3. **clean_old_logs** - Limpa logs antigos (diariamente às 3h)
4. **send_deadline_notifications** - Notificações de prazos

### Monitoramento

Acesse o Flower para monitorar as tasks: http://localhost:5555

## Desenvolvimento

### Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Rebuild após mudanças no código
docker-compose up -d --build

# Ver logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f celery_worker

# Entrar no container da API
docker-compose exec api bash

# Executar migrations
docker-compose exec api alembic upgrade head

# Criar nova migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Acessar PostgreSQL
docker-compose exec postgres psql -U drwell -d drwell_db

# Acessar Redis
docker-compose exec redis redis-cli -a redis_secret
```

### Estrutura de Banco de Dados

**Principais Tabelas:**

- `law_firms` - Escritórios de advocacia
- `users` - Usuários do sistema
- `lawyers` - Advogados
- `clients` - Clientes
- `processes` - Processos judiciais
- `process_movements` - Movimentações dos processos
- `financial_records` - Registros financeiros

## Deploy em Produção (Docker Swarm)

### 1. Inicialize o Swarm

```bash
docker swarm init
```

### 2. Deploy do stack

```bash
docker stack deploy -c docker-compose.yml drwell
```

### 3. Verifique os serviços

```bash
docker service ls
docker service logs drwell_api
```

## Segurança

### Recomendações para Produção:

1. **Altere todas as senhas** em `.env`
2. **Configure CORS** adequadamente
3. **Use HTTPS** (Traefik com Let's Encrypt)
4. **Configure backup** do PostgreSQL
5. **Monitore logs** e erros
6. **Limite rate limiting** na API
7. **Configure firewall** adequadamente

## Troubleshooting

### Containers não iniciam

```bash
docker-compose down -v
docker-compose up -d --build
```

### Erro de conexão com banco de dados

Verifique se o PostgreSQL está rodando:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Celery não processa tasks

```bash
docker-compose logs celery_worker
docker-compose restart celery_worker
```

## Próximos Passos

- [ ] Implementar autenticação JWT completa
- [ ] Criar interface frontend (React/Vue)
- [ ] Implementar Kanban de prazos
- [ ] Sistema de templates de documentos
- [ ] Notificações por email/SMS
- [ ] Relatórios e dashboards
- [ ] Integração com sistemas de pagamento

## Licença

[Definir licença]

## Suporte

Para dúvidas e suporte, entre em contato através de [seu email/contato]

---

**DrWell** - Sistema de Gestão para Escritórios de Advocacia
