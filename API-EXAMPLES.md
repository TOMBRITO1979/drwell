# DrWell - Exemplos de Uso da API

Exemplos práticos de como usar a API DrWell.

---

## 🔐 Autenticação

### 1. Registrar Novo Usuário (Escritório Master)

```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escritorio.com",
    "username": "admin",
    "password": "SenhaSegura123!",
    "full_name": "Administrador",
    "role": "master"
  }'
```

### 2. Login

```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=SenhaSegura123!"
```

Resposta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Salve o token!** Use em todas as próximas requisições:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🏢 Escritórios de Advocacia

### Criar Escritório

```bash
curl -X POST "https://seu-dominio.com/api/v1/law-firms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Silva & Advogados Associados",
    "cnpj": "12.345.678/0001-90",
    "oab_number": "OAB/SP 123456",
    "email": "contato@silvaadvogados.com",
    "phone": "(11) 3333-4444",
    "address": "Av. Paulista, 1000",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01310-100"
  }'
```

### Listar Escritórios

```bash
curl -X GET "https://seu-dominio.com/api/v1/law-firms" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👨‍⚖️ Advogados

### Cadastrar Advogado

```bash
curl -X POST "https://seu-dominio.com/api/v1/lawyers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Dr. João Silva",
    "cpf": "123.456.789-00",
    "oab_number": "SP123456",
    "oab_state": "SP",
    "email": "joao.silva@escritorio.com",
    "phone": "(11) 99999-8888",
    "is_partner": true,
    "law_firm_id": 1
  }'
```

### Listar Advogados

```bash
curl -X GET "https://seu-dominio.com/api/v1/lawyers" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👤 Clientes

### Cadastrar Cliente (Pessoa Física)

```bash
curl -X POST "https://seu-dominio.com/api/v1/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_type": "individual",
    "name": "Maria Oliveira",
    "cpf_cnpj": "987.654.321-00",
    "rg": "12.345.678-9",
    "email": "maria@email.com",
    "phone": "(11) 98765-4321",
    "mobile_phone": "(11) 98765-4321",
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01234-567",
    "occupation": "Professora",
    "law_firm_id": 1
  }'
```

### Cadastrar Cliente (Pessoa Jurídica)

```bash
curl -X POST "https://seu-dominio.com/api/v1/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_type": "company",
    "name": "Empresa XYZ Ltda",
    "cpf_cnpj": "12.345.678/0001-90",
    "email": "contato@xyz.com",
    "phone": "(11) 3333-4444",
    "address": "Av. Comercial, 500",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01234-567",
    "law_firm_id": 1
  }'
```

---

## ⚖️ Processos Judiciais

### Cadastrar Processo

```bash
curl -X POST "https://seu-dominio.com/api/v1/processes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "00008323520184013202",
    "internal_code": "PROC-2024-001",
    "court_type": "trf",
    "court_name": "TRF1 - Tribunal Regional Federal da 1ª Região",
    "court_state": "AM",
    "court_city": "Tefé",
    "subject": "Previdenciário - Concessão de Benefício",
    "description": "Pedido de concessão de aposentadoria por idade",
    "process_class": "Procedimento do Juizado Especial Cível",
    "filing_date": "2018-10-29",
    "deadline": "2024-12-31",
    "datajud_endpoint": "api_publica_trf1",
    "auto_sync_enabled": true,
    "sync_interval_hours": 24,
    "law_firm_id": 1,
    "client_id": 1,
    "responsible_lawyer_id": 1
  }'
```

### Listar Processos

```bash
curl -X GET "https://seu-dominio.com/api/v1/processes" \
  -H "Authorization: Bearer $TOKEN"
```

### Obter Detalhes do Processo

```bash
curl -X GET "https://seu-dominio.com/api/v1/processes/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Sincronizar Processo com DataJud

```bash
curl -X POST "https://seu-dominio.com/api/v1/processes/1/sync" \
  -H "Authorization: Bearer $TOKEN"
```

### Ver Histórico de Movimentações

```bash
curl -X GET "https://seu-dominio.com/api/v1/processes/1/history" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💰 Financeiro

### Criar Registro Financeiro (Honorários a Receber)

```bash
curl -X POST "https://seu-dominio.com/api/v1/financial" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "receivable",
    "description": "Honorários - Processo 00008323520184013202",
    "amount": 5000.00,
    "payment_status": "pending",
    "due_date": "2024-12-15",
    "invoice_number": "INV-2024-001",
    "law_firm_id": 1,
    "client_id": 1,
    "process_id": 1
  }'
```

### Registrar Recebimento

```bash
curl -X POST "https://seu-dominio.com/api/v1/financial" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "received",
    "description": "Recebimento - Honorários Processo PROC-2024-001",
    "amount": 5000.00,
    "payment_status": "paid",
    "due_date": "2024-12-15",
    "payment_date": "2024-12-14",
    "payment_method": "PIX",
    "invoice_number": "INV-2024-001",
    "law_firm_id": 1,
    "client_id": 1,
    "process_id": 1
  }'
```

### Registrar Despesa

```bash
curl -X POST "https://seu-dominio.com/api/v1/financial" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "expense",
    "description": "Custas processuais - TRF1",
    "amount": 150.00,
    "payment_status": "paid",
    "payment_date": "2024-11-20",
    "payment_method": "Boleto",
    "law_firm_id": 1,
    "process_id": 1
  }'
```

### Obter Resumo Financeiro

```bash
curl -X GET "https://seu-dominio.com/api/v1/financial/summary" \
  -H "Authorization: Bearer $TOKEN"
```

Resposta:
```json
{
  "total_receivable": 15000.00,
  "total_received": 8500.00,
  "total_pending": 6500.00
}
```

---

## 🔍 Consulta de Processo na API DataJud

Exemplo direto na API do CNJ:

```bash
curl -X POST "https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search" \
  -H "Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "numeroProcesso": "00008323520184013202"
      }
    }
  }'
```

**O DrWell faz isso automaticamente!** Basta cadastrar o processo e habilitar `auto_sync_enabled: true`.

---

## 📊 Workflow Completo

### Fluxo de Trabalho Típico:

```bash
# 1. Login
TOKEN=$(curl -s -X POST "https://seu-dominio.com/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=senha" | jq -r '.access_token')

# 2. Criar Cliente
CLIENT_ID=$(curl -s -X POST "https://seu-dominio.com/api/v1/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cliente Teste","cpf_cnpj":"123.456.789-00",...}' \
  | jq -r '.id')

# 3. Criar Processo
PROCESS_ID=$(curl -s -X POST "https://seu-dominio.com/api/v1/processes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"process_number\":\"00008323520184013202\",\"client_id\":$CLIENT_ID,...}" \
  | jq -r '.id')

# 4. Sincronizar com DataJud
curl -X POST "https://seu-dominio.com/api/v1/processes/$PROCESS_ID/sync" \
  -H "Authorization: Bearer $TOKEN"

# 5. Ver Movimentações
curl -X GET "https://seu-dominio.com/api/v1/processes/$PROCESS_ID/history" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testando via Swagger UI

A maneira mais fácil de testar a API:

1. Acesse: `https://seu-dominio.com/docs`
2. Clique em **Authorize** (canto superior direito)
3. Faça login e cole o token
4. Teste os endpoints interativamente!

---

## 📱 Integração com Ferramentas

### Postman

Importe a coleção:
1. No Postman: Import → Link
2. Use: `https://seu-dominio.com/api/v1/openapi.json`

### Insomnia

Semelhante ao Postman:
1. Import/Export → From URL
2. Use: `https://seu-dominio.com/api/v1/openapi.json`

---

## 🔄 Webhooks (Futuro)

Em desenvolvimento:
- Notificações de novas movimentações processuais
- Alertas de prazos vencendo
- Atualizações financeiras

---

Para mais informações, consulte a documentação completa em:
- **Swagger UI**: https://seu-dominio.com/docs
- **ReDoc**: https://seu-dominio.com/redoc
