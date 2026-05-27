@echo off
cd /d "%~dp0"
echo.
echo  ============================================
echo    Industrias AP -- Optimizer Service v2.0
echo    MaxRects + Guillotina + Algoritmo Genetico
echo  ============================================
echo.

REM ─── Buscar Python ───────────────────────────────────────────────────────
set PYTHON_EXE=

for %%p in (
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python313\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\python.exe"
    "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python39\python.exe"
    "C:\Users\%USERNAME%\anaconda3\python.exe"
    "C:\Users\%USERNAME%\miniconda3\python.exe"
    "C:\ProgramData\Anaconda3\python.exe"
    "C:\Python312\python.exe"
    "C:\Python311\python.exe"
    "C:\Python310\python.exe"
) do (
    if exist %%p (
        set PYTHON_EXE=%%p
        goto :found_python
    )
)

REM Ultimo intento: buscar en PATH
where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_EXE=python
    goto :found_python
)

echo  ERROR: Python no encontrado.
echo.
echo  Para instalar Python:
echo    1. Ir a https://www.python.org/downloads/
echo    2. Descargar Python 3.11 o superior
echo    3. Ejecutar el instalador y marcar "Add Python to PATH"
echo    4. Cerrar y volver a abrir esta ventana
echo.
pause
exit /b 1

:found_python
echo  Python encontrado: %PYTHON_EXE%
echo.

REM ─── Crear entorno virtual si no existe ──────────────────────────────────
if not exist venv (
    echo  [1/3] Creando entorno virtual...
    %PYTHON_EXE% -m venv venv
    if errorlevel 1 (
        echo  ERROR al crear el entorno virtual.
        pause
        exit /b 1
    )
)

REM ─── Instalar dependencias ────────────────────────────────────────────────
echo  [2/3] Instalando dependencias (fastapi, uvicorn)...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
if errorlevel 1 (
    echo  ERROR al instalar dependencias.
    pause
    exit /b 1
)

REM ─── Iniciar servicio ────────────────────────────────────────────────────
echo  [3/3] Iniciando servicio en http://localhost:8001
echo.
echo  IMPORTANTE: Mantene esta ventana abierta mientras usas el optimizador.
echo  El backend lo detectara automaticamente y usara el motor avanzado.
echo  Para cerrar: Ctrl+C
echo.

uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
pause
