@echo off
REM DrWell - Script de Build e Push para DockerHub (Windows)

echo ========================================
echo DrWell - Build e Push Docker Image
echo ========================================
echo.

REM Configuracoes
set DOCKER_USERNAME=tomautomations
set IMAGE_NAME=drwell
set VERSION=latest
set FULL_IMAGE_NAME=%DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%

echo Imagem: %FULL_IMAGE_NAME%
echo.

REM 1. Build da imagem
echo [1/4] Fazendo build da imagem...
docker build -f Dockerfile.production -t %FULL_IMAGE_NAME% .
if %ERRORLEVEL% NEQ 0 (
    echo Erro no build!
    exit /b 1
)
echo Build concluido com sucesso!
echo.

REM 2. Test da imagem
echo [2/4] Testando a imagem...
docker run --rm %FULL_IMAGE_NAME% python -c "import app; print('App importado com sucesso')"
if %ERRORLEVEL% NEQ 0 (
    echo Erro no teste!
    exit /b 1
)
echo Teste concluido com sucesso!
echo.

REM 3. Login no DockerHub
echo [3/4] Fazendo login no DockerHub...
echo Por favor, faca login quando solicitado
docker login -u %DOCKER_USERNAME%
if %ERRORLEVEL% NEQ 0 (
    echo Erro no login!
    exit /b 1
)
echo Login concluido com sucesso!
echo.

REM 4. Push da imagem
echo [4/4] Fazendo push da imagem...
docker push %FULL_IMAGE_NAME%
if %ERRORLEVEL% NEQ 0 (
    echo Erro no push!
    exit /b 1
)
echo Push concluido com sucesso!
echo.

echo ========================================
echo Processo concluido com sucesso!
echo ========================================
echo.
echo Imagem disponivel em: %FULL_IMAGE_NAME%
echo.
echo Para usar no Swarm:
echo   docker stack deploy -c docker-stack.yml drwell
echo.

pause
