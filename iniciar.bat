@echo off
chcp 65001 >nul
title Comal Dorado - Servidor
echo.
echo  Instalando lo necesario (solo la primera vez)...
python -m pip install flask >nul 2>&1 || py -m pip install flask >nul 2>&1
echo  Abriendo el sitio en tu navegador...
start "" cmd /c "timeout /t 3 >nul & start http://localhost:5000"
echo  Servidor encendido. NO cierres esta ventana mientras uses el sitio.
echo.
python app.py || py app.py
pause
