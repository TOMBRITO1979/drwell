# Como Fazer Push para o GitHub

O projeto já foi commitado localmente. Agora você precisa fazer push para o GitHub.

---

## Método 1: HTTPS (Recomendado - Mais Simples)

### Passo 1: Adicionar Remote

```bash
git remote add origin https://github.com/TOMBRITO1979/drwell.git
```

### Passo 2: Renomear Branch (se necessário)

```bash
git branch -M main
```

### Passo 3: Push

```bash
git push -u origin main
```

Quando solicitado:
- **Username**: `TOMBRITO1979`
- **Password**: Use o **token do GitHub** (não a senha da conta!)

**Token**: `[seu-token-github-aqui]`

---

## Método 2: SSH (Mais Seguro)

### Passo 1: Verificar se tem chave SSH

```bash
ls ~/.ssh/id_rsa.pub
```

Se não tiver, gere uma:

```bash
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"
```

### Passo 2: Adicionar chave SSH no GitHub

```bash
# Ver a chave
cat ~/.ssh/id_rsa.pub
```

Copie e adicione em: https://github.com/settings/keys

### Passo 3: Adicionar Remote SSH

```bash
git remote add origin git@github.com:TOMBRITO1979/drwell.git
git branch -M main
git push -u origin main
```

---

## Método 3: GitHub CLI (gh)

Se você tem GitHub CLI instalado:

```bash
gh auth login
gh repo create TOMBRITO1979/drwell --public --source=. --remote=origin
git push -u origin main
```

---

## Verificar Push

Após fazer push, acesse:
https://github.com/TOMBRITO1979/drwell

Você deve ver todos os arquivos!

---

## Próximos Passos

### 1. Configurar Secrets no GitHub (para CI/CD)

**GitHub → Settings → Secrets and variables → Actions → New secret**

Adicione:

**DOCKER_USERNAME**
```
tomautomations
```

**DOCKER_TOKEN**
```
[seu-token-dockerhub-aqui]
```

### 2. Verificar GitHub Actions

Após configurar os secrets, qualquer push para `main` irá:
1. Fazer build da imagem Docker
2. Fazer push para DockerHub automaticamente
3. Imagem ficará disponível em: `tomautomations/drwell:latest`

Veja o workflow em: `.github/workflows/docker-build.yml`

---

## Troubleshooting

### Erro: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/TOMBRITO1979/drwell.git
```

### Erro de autenticação

Use o **token do GitHub** como senha, não sua senha de conta.

Token: `[seu-token-github-aqui]`

### Repositório não existe

Crie o repositório primeiro em:
https://github.com/new

Nome: `drwell`
Tipo: Public
NÃO inicialize com README, .gitignore ou license

---

## Comandos Resumidos

```bash
# Setup
git remote add origin https://github.com/TOMBRITO1979/drwell.git
git branch -M main

# Push
git push -u origin main

# Usar token quando pedir senha
```

Pronto! Seu código estará no GitHub! 🎉
