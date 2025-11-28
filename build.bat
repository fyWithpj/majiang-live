@echo off
echo 设置镜像源环境变量...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set CSC_IDENTITY_AUTO_DISCOVERY=false
set npm_config_registry=https://registry.npmmirror.com/
set npm_config_electron_mirror=https://npmmirror.com/mirrors/electron/
set npm_config_electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

echo 开始构建应用...
npm run build

echo 构建完成！
pause
