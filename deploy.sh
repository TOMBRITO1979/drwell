#!/bin/bash

echo "=== Deploy AdvTom para Docker Swarm ==="

# Configurações
VPS_HOST="root@82.29.197.68"
VPS_PASSWORD="Contadeva123@"
STACK_NAME="advtom"

echo "1. Copiando docker-compose.yml para o servidor..."
scp -o StrictHostKeyChecking=no docker-compose.yml $VPS_HOST:/root/advtom-stack.yml

echo "2. Verificando se a rede network_public existe..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "docker network ls | grep network_public || docker network create --driver overlay network_public"

echo "3. Removendo stack antiga (se existir)..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "docker stack rm $STACK_NAME" || true

echo "4. Aguardando remoção completa..."
sleep 10

echo "5. Fazendo deploy da nova stack..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "docker stack deploy -c /root/advtom-stack.yml $STACK_NAME"

echo "6. Verificando status dos serviços..."
sleep 5
ssh -o StrictHostKeyChecking=no $VPS_HOST "docker stack ps $STACK_NAME"

echo ""
echo "=== Deploy concluído! ==="
echo "Frontend: https://r.chatwell.pro"
echo "Backend API: https://rapi.chatwell.pro"
echo ""
echo "Para verificar logs:"
echo "  docker service logs ${STACK_NAME}_backend -f"
echo "  docker service logs ${STACK_NAME}_frontend -f"
