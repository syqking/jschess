@echo off
set COCOS_DIR=%~dp0..
set UNIX_COCOS_DIR=%COCOS_DIR:\=/%

REM There has to be a better way to do this...
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:A:=/cygdrive/a%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:B:=/cygdrive/b%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:C:=/cygdrive/c%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:D:=/cygdrive/d%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:E:=/cygdrive/e%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:F:=/cygdrive/f%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:G:=/cygdrive/g%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:H:=/cygdrive/h%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:I:=/cygdrive/i%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:J:=/cygdrive/j%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:K:=/cygdrive/k%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:L:=/cygdrive/l%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:M:=/cygdrive/m%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:N:=/cygdrive/n%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:O:=/cygdrive/o%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:P:=/cygdrive/p%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:Q:=/cygdrive/q%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:R:=/cygdrive/r%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:S:=/cygdrive/s%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:T:=/cygdrive/t%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:U:=/cygdrive/u%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:V:=/cygdrive/v%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:W:=/cygdrive/w%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:X:=/cygdrive/x%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:Y:=/cygdrive/y%
set UNIX_COCOS_DIR=%UNIX_COCOS_DIR:Z:=/cygdrive/z%

"%COCOS_DIR%\support\node-builds\node-cygwin" "%UNIX_COCOS_DIR%/bin/cocos.js" %1 %2 %3 %4 %5 %6 %7 %8 %9
