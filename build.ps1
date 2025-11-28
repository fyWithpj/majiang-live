# PowerShell 构建脚本
# 设置镜像源环境变量
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"

Write-Host "已设置镜像源环境变量:" -ForegroundColor Green
Write-Host "ELECTRON_MIRROR=$env:ELECTRON_MIRROR" -ForegroundColor Cyan
Write-Host "ELECTRON_BUILDER_BINARIES_MIRROR=$env:ELECTRON_BUILDER_BINARIES_MIRROR" -ForegroundColor Cyan
Write-Host "CSC_IDENTITY_AUTO_DISCOVERY=$env:CSC_IDENTITY_AUTO_DISCOVERY" -ForegroundColor Cyan
Write-Host ""

Write-Host "开始构建应用..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "构建完成！" -ForegroundColor Green
} else {
    Write-Host "构建失败！" -ForegroundColor Red
}

