# Script para adicionar Node.js ao PATH da sessão atual
# Detecta automaticamente a localização do Node.js
#usar esse código pra funcionar : 
# Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; & "A:\sist-ger-sala\setup-node.ps1"
$nodePath = if (Get-Command node -ErrorAction SilentlyContinue) {
    Split-Path (Get-Command node).Source
} else {
    # Fallback para localização padrão do Windows
    "C:\Program Files\nodejs"
}

if (-Not (Test-Path $nodePath)) {
    Write-Host "Aviso: Node.js não encontrado em $nodePath" -ForegroundColor Yellow
    Write-Host "Certifique-se de que Node.js está instalado e no PATH do sistema" -ForegroundColor Yellow
    exit 1
}

$env:PATH = "$env:PATH;$nodePath"
Write-Host "Node.js adicionado ao PATH da sessão atual" -ForegroundColor Green
Write-Host "Testando..." -ForegroundColor Green
Write-Host ""

node --version
npm --version

Write-Host ""
Write-Host "Node.js e npm prontos para uso!" -ForegroundColor Green



