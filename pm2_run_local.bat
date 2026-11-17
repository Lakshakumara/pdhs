@echo off
setlocal
REM ============================================================
REM  pm2_run_local.bat - start/stop PDHS frontend + backend under pm2
REM
REM  FE : Angular dev server  -> http://localhost:4200
REM  BE : NestJS API (dist)   -> http://localhost:3000
REM  LAN: http://192.168.0.101:4200 / :3000
REM
REM  Usage: pm2_run_local.bat [start|stop|restart|status]
REM  (no argument = start)
REM ============================================================

set "FE_DIR=%~dp0"
set "BE_DIR=%~dp0..\pdhs-api"
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=start"

where pm2 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pm2 not found. Install it first: npm install -g pm2
  exit /b 1
)

REM wake the pm2 daemon if it is not running
call pm2 ping >nul 2>&1

if /i "%ACTION%"=="stop"    goto STOP
if /i "%ACTION%"=="restart" goto RESTART
if /i "%ACTION%"=="status"  goto DONE
goto START

:START
echo.
echo === BACKEND  (nestjs-api) ===
pushd "%BE_DIR%"
if not exist "dist\src\main.js" (
  echo dist\src\main.js not found - building backend...
  call npm run build
  if errorlevel 1 (
    popd
    echo [ERROR] backend build failed
    exit /b 1
  )
)
call pm2 list | findstr /c:"nestjs-api" >nul
if errorlevel 1 (
  echo creating nestjs-api...
  call pm2 start dist\src\main.js --name nestjs-api --interpreter node
) else (
  call pm2 list | findstr /c:"nestjs-api" | findstr /r /c:"stopped" /c:"errored" >nul
  if not errorlevel 1 (
    call pm2 start nestjs-api
  ) else (
    echo nestjs-api already online - skipping
  )
)
popd

echo.
echo === FRONTEND  (pdhs-fe) ===
pushd "%FE_DIR%"
if not exist "node_modules\@angular\cli\bin\ng.js" (
  popd
  echo [ERROR] node_modules missing - run: npm install
  exit /b 1
)
call pm2 list | findstr /c:"pdhs-fe" >nul
if errorlevel 1 (
  echo creating pdhs-fe...
  call pm2 start "node_modules\@angular\cli\bin\ng.js" --name pdhs-fe -- serve --port 4200 --host 0.0.0.0
) else (
  call pm2 list | findstr /c:"pdhs-fe" | findstr /r /c:"stopped" /c:"errored" >nul
  if not errorlevel 1 (
    call pm2 start pdhs-fe
  ) else (
    echo pdhs-fe already online - skipping
  )
)
popd

call pm2 save >nul
goto DONE

:STOP
call pm2 stop nestjs-api
call pm2 stop pdhs-fe
goto DONE

:RESTART
call pm2 restart nestjs-api
call pm2 restart pdhs-fe
call pm2 save >nul
goto DONE

:DONE
call pm2 list
echo.
echo FE : http://localhost:4200        LAN: http://192.168.0.101:4200
echo BE : http://localhost:3000        LAN: http://192.168.0.101:3000
echo Logs: pm2 logs pdhs-fe    /    pm2 logs nestjs-api
exit /b 0
