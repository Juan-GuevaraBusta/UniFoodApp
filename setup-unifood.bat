@echo off
echo 🍕 Configurando UniFood con AWS Amplify...

echo 🧹 Limpiando configuraciones anteriores...
if exist ".amplify" rmdir /s /q ".amplify"
if exist "amplify_outputs.json" del "amplify_outputs.json"

echo 📦 Verificando dependencias...
call npm install

echo 🚀 Configurando Amplify sandbox...
call npx ampx sandbox

echo ⏳ Esperando configuración...
:wait_loop
if not exist "amplify_outputs.json" (
    echo Esperando amplify_outputs.json...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo ✅ ¡UniFood configurado correctamente!
pause