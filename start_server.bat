@echo off

::check cocos2d javascript
if not exist ".\cocos2d javascript\" (
    echo You must install cocos2d javascript in this directory first
    pause
) else (
    call ".\cocos2d javascript\bin\Serve project.exe" .
)

