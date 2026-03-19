# Seletor de Envio de Repositorio (Cobaia vs. Base)

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   SELETOR DE DESTINO GIT (SOCIAL OS)" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

Write-Host "Para qual repositorio voce deseja enviar suas alteracoes?" -ForegroundColor White
Write-Host "1) pra-valer (O COBAIA - Testes e Experimentos)" -ForegroundColor Yellow
Write-Host "2) base      (O BACKUP - Versao Estavel/DNA)" -ForegroundColor Green
Write-Host "q) Sair sem enviar" -ForegroundColor Red

$choice = Read-Host "`nEscolha (1, 2 ou q)"

switch ($choice) {
    "1" {
        Write-Host "`nEnviando para o COBAIA (pra-valer)...`n" -ForegroundColor Yellow
        git push pra-valer main
    }
    "2" {
        Write-Host "`nEnviando para o BACKUP (base)...`n" -ForegroundColor Green
        git push base main
    }
    "q" {
        Write-Host "`nEnvio cancelado.`n" -ForegroundColor Red
        exit
    }
    Default {
        Write-Host "`nEscolha invalida. Operacao cancelada.`n" -ForegroundColor Red
    }
}
