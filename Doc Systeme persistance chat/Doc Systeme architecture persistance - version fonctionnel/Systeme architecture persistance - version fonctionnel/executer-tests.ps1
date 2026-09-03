# Script PowerShell pour lancer les tests de persistance des tables
# Date: 28 août 2026

Write-Host "" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tests - Systeme de Persistance      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Ouverture de la page de test..." -ForegroundColor Yellow
Write-Host ""

$testFile = Join-Path $PSScriptRoot "test-persistence-tables.html"

if (Test-Path $testFile) {
    # Ouvrir dans le navigateur par défaut
    Start-Process $testFile
    Write-Host "[OK] Page de test ouverte dans le navigateur" -ForegroundColor Green
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "  1. Dans la page qui s'est ouverte, cliquez sur 'Lancer tous les tests'" -ForegroundColor White
    Write-Host "  2. Observez les resultats (vert = reussi, rouge = echoue)" -ForegroundColor White
    Write-Host "  3. Ouvrez la console (F12) pour plus de details" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour tester dans ClaraVerse reel:" -ForegroundColor Cyan
    Write-Host "  1. Demarrez: npm run dev" -ForegroundColor White
    Write-Host "  2. Ouvrez: http://localhost:5173" -ForegroundColor White
    Write-Host "  3. Consultez: RESULTATS_TESTS.md (scenarios de test)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[ERREUR] Fichier de test introuvable: $testFile" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
