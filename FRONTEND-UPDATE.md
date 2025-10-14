# DrWell - Atualização com Interface Web Moderna

## ✅ O Que Foi Criado:

### Interface Web Completa:
- ✅ **Página de Login/Registro** - Design moderno e responsivo
- ✅ **Dashboard Principal** - Com estatísticas e cards
- ✅ **Gestão de Clientes** - Listar, criar, editar, deletar
- ✅ **Gestão de Processos** - Com sincronização DataJud CNJ
- ✅ **Gestão de Advogados** - CRUD completo
- ✅ **Gestão de Escritórios** - CRUD completo
- ✅ **Design Responsivo** - Funciona em desktop e mobile

### Tecnologias Usadas:
- Tailwind CSS para estilização moderna
- FontAwesome para ícones
- JavaScript puro (sem frameworks complexos)
- Integração completa com a API REST

---

## 🚀 Como Atualizar no Portainer:

### Opção 1: Atualizar via Portainer (Recomendado)

1. **Acesse o Portainer**
2. Vá em: **Stacks → drwell → Editor**
3. Clique em **Update the stack**
4. **Marque a opção**: `Pull latest image version`
5. Clique em **Update**

Aguarde 1-2 minutos enquanto o Docker baixa a nova imagem e reinicia os serviços.

---

### Opção 2: Atualizar via SSH

```bash
# Atualizar todos os serviços para a nova imagem
docker service update --image tomautomations/drwell:latest --force drwell_api
docker service update --image tomautomations/drwell:latest --force drwell_celery_worker
docker service update --image tomautomations/drwell:latest --force drwell_celery_beat
docker service update --image tomautomations/drwell:latest --force drwell_flower
```

---

## 🎨 Como Acessar a Nova Interface:

### 1. Página Inicial (Login/Registro)
```
https://crm.chatwell.org/
```

Agora ao acessar esta URL, você verá uma **página de login moderna** em vez do JSON!

### 2. Dashboard
Após fazer login, você será redirecionado automaticamente para:
```
https://crm.chatwell.org/dashboard.html
```

---

## 📱 Funcionalidades da Interface:

### Página de Login/Registro

**Login:**
- Campo de usuário/email
- Campo de senha
- Botão "Entrar"

**Registro:**
- Nome completo
- Nome de usuário
- Email
- Senha
- Tipo de conta (Master, Advogado, Assistente)

### Dashboard

**Cards de Estatísticas:**
- Total de Clientes
- Processos Ativos
- Advogados
- Escritórios

**Navegação Lateral:**
- Dashboard
- Clientes
- Processos
- Advogados
- Escritórios

### Gestão de Clientes

- ✅ Listar todos os clientes
- ✅ Criar novo cliente
- ✅ Visualizar detalhes
- ✅ Editar cliente
- ✅ Deletar cliente

### Gestão de Processos

- ✅ Listar todos os processos
- ✅ Criar novo processo
- ✅ **Sincronizar com DataJud CNJ** (botão de sync)
- ✅ Visualizar detalhes
- ✅ Editar processo
- ✅ Deletar processo

### Gestão de Advogados

- ✅ Listar todos os advogados
- ✅ Criar novo advogado
- ✅ Visualizar detalhes
- ✅ Editar advogado
- ✅ Deletar advogado

### Gestão de Escritórios

- ✅ Listar todos os escritórios
- ✅ Criar novo escritório
- ✅ Visualizar detalhes
- ✅ Editar escritório
- ✅ Deletar escritório

---

## 🎯 Testando a Nova Interface:

### 1. Criar sua primeira conta

1. Acesse: `https://crm.chatwell.org/`
2. Clique em **"crie uma nova conta"**
3. Preencha os dados:
   - Nome completo
   - Nome de usuário
   - Email
   - Senha (mínimo 6 caracteres)
   - Tipo: **Master**
4. Clique em **"Criar Conta"**

Você será automaticamente logado e redirecionado para o dashboard!

### 2. Explorar o Dashboard

- Veja os cards com estatísticas
- Navegue pelos menus laterais
- Teste criar um cliente novo
- Teste criar um processo
- Teste sincronizar um processo com DataJud

### 3. Testar Sincronização DataJud

1. Crie um processo com número real
2. Clique no ícone de **sincronização** (🔄)
3. O sistema buscará as movimentações no DataJud CNJ
4. Você verá uma mensagem com quantas movimentações foram encontradas

---

## 📐 Design e Cores:

- **Cor Principal**: Indigo (#4F46E5)
- **Cor Secundária**: Purple (#9333EA)
- **Background**: Gradiente azul claro
- **Cards**: Brancos com sombra
- **Ícones**: FontAwesome 6

---

## 🔐 Segurança:

- ✅ Token JWT armazenado no localStorage
- ✅ Todas as requisições incluem o token de autenticação
- ✅ Redirecionamento automático se não estiver logado
- ✅ Logout limpa todos os dados locais

---

## 📱 Responsividade:

A interface foi criada com **Tailwind CSS** e é totalmente responsiva:

- ✅ **Desktop** (1920x1080+)
- ✅ **Laptop** (1366x768)
- ✅ **Tablet** (768x1024)
- ✅ **Mobile** (375x667)

No mobile, o menu lateral aparece como um botão hambúrguer.

---

## 🚨 Troubleshooting:

### Página ainda mostra JSON

Se após atualizar você ainda ver o JSON:

1. **Limpe o cache do navegador**:
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Firefox: `Ctrl + Shift + Delete`
   - Selecione "Cache" e limpe

2. **Teste em modo anônimo**:
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`

3. **Force reload**:
   - `Ctrl + F5` ou `Ctrl + Shift + R`

### Erro de autenticação

Se aparecer erro ao fazer login:

1. Verifique se o serviço da API está rodando:
   ```bash
   docker service ls | grep drwell_api
   ```

2. Veja os logs:
   ```bash
   docker service logs -f drwell_api
   ```

### Interface não carrega

1. Verifique se os arquivos estáticos foram copiados:
   ```bash
   docker exec -it $(docker ps -q -f name=drwell_api | head -1) ls -la /app/app/static/
   ```

2. Deve mostrar:
   ```
   index.html
   dashboard.html
   js/
   css/
   ```

---

## 🎉 Pronto!

Agora você tem uma interface web moderna e completa para o DrWell!

**URLs importantes:**
- Login: `https://crm.chatwell.org/`
- Dashboard: `https://crm.chatwell.org/dashboard.html`
- API Docs: `https://crm.chatwell.org/docs`
- Flower: `https://flower.chatwell.org`

---

## 🔄 Próximas Melhorias (Opcional):

Se quiser, posso adicionar:
- ✨ Modals para criar/editar (agora estão com alert)
- 📊 Gráficos e relatórios
- 🔔 Notificações em tempo real
- 📄 Gerador de PDF
- 📧 Envio de emails
- 💬 Chat interno
- 📅 Calendário de prazos

---

**Desenvolvido com ❤️ para facilitar a gestão de escritórios de advocacia!**
