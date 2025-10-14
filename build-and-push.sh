#!/bin/bash

# DrWell - Script de Build e Push para DockerHub
# Este script faz build da imagem e envia para o DockerHub

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DrWell - Build e Push Docker Image${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Configurações
DOCKER_USERNAME="${DOCKER_USERNAME:-tomautomations}"
IMAGE_NAME="drwell"
VERSION="${VERSION:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo -e "${YELLOW}Imagem:${NC} ${FULL_IMAGE_NAME}\n"

# 1. Build da imagem
echo -e "${YELLOW}[1/4] Fazendo build da imagem...${NC}"
docker build -f Dockerfile.production -t ${FULL_IMAGE_NAME} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build concluído com sucesso!${NC}\n"
else
    echo -e "${RED}✗ Erro no build!${NC}"
    exit 1
fi

# 2. Test da imagem
echo -e "${YELLOW}[2/4] Testando a imagem...${NC}"
docker run --rm ${FULL_IMAGE_NAME} python -c "import app; print('✓ App importado com sucesso')"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Teste concluído com sucesso!${NC}\n"
else
    echo -e "${RED}✗ Erro no teste!${NC}"
    exit 1
fi

# 3. Login no DockerHub
echo -e "${YELLOW}[3/4] Fazendo login no DockerHub...${NC}"
if [ -z "$DOCKER_TOKEN" ]; then
    echo -e "${YELLOW}DOCKER_TOKEN não definido. Fazendo login interativo...${NC}"
    docker login -u ${DOCKER_USERNAME}
else
    echo ${DOCKER_TOKEN} | docker login -u ${DOCKER_USERNAME} --password-stdin
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Login concluído com sucesso!${NC}\n"
else
    echo -e "${RED}✗ Erro no login!${NC}"
    exit 1
fi

# 4. Push da imagem
echo -e "${YELLOW}[4/4] Fazendo push da imagem...${NC}"
docker push ${FULL_IMAGE_NAME}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Push concluído com sucesso!${NC}\n"
else
    echo -e "${RED}✗ Erro no push!${NC}"
    exit 1
fi

# Tag como latest se for uma versão específica
if [ "$VERSION" != "latest" ]; then
    echo -e "${YELLOW}Criando tag 'latest'...${NC}"
    docker tag ${FULL_IMAGE_NAME} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    echo -e "${GREEN}✓ Tag 'latest' criada e enviada!${NC}\n"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Processo concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "Imagem disponível em: ${GREEN}${FULL_IMAGE_NAME}${NC}"
echo -e "\nPara usar no Swarm:"
echo -e "  docker stack deploy -c docker-stack.yml drwell\n"
