# Script de test - Isolation des chats
# Date: 28 août 2026

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tests - Isolation des Chats         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Ouverture de la page de test..." -ForegroundColor Yellow
Write-Host ""

$testFile = Join-Path $PSScriptRoot "test-isolation-chats.html"

if (Test-Path $testFile) {
    # Ouvrir dans le navigateur par défaut
    Start-Process $testFile
    Write-Host "[OK] Page de test ouverte dans le navigateur" -ForegroundColor Green
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir la console du navigateur (F12)" -ForegroundColor White
    Write-Host "  2. Exécuter les tests suivants:" -ForegroundColor White
    Write-Host ""
    Write-Host "Test 1 - ChatId unique:" -ForegroundColor Yellow
    Write-Host "  window.chatIdDetector.getCurrentChatId()" -ForegroundColor Gray
    Write-Host "  => Devrait afficher un ID type: chat_1735390000000_abc1234" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Test 2 - Isolation des tables:" -ForegroundColor Yellow
    Write-Host "  // Créer des tables dans le chat actuel" -ForegroundColor Gray
    Write-Host "  const chatA = window.chatIdDetector.getCurrentChatId()" -ForegroundColor Gray
    Write-Host "  " -ForegroundColor Gray
    Write-Host "  // Simuler un nouveau chat" -ForegroundColor Gray
    Write-Host "  window.chatIdDetector.reset()" -ForegroundColor Gray
    Write-Host "  const chatB = window.chatIdDetector.getCurrentChatId()" -ForegroundColor Gray
    Write-Host "  " -ForegroundColor Gray
    Write-Host "  // Vérifier que les IDs sont différents" -ForegroundColor Gray
    Write-Host "  console.log('Chat A:', chatA)" -ForegroundColor Gray
    Write-Host "  console.log('Chat B:', chatB)" -ForegroundColor Gray
    Write-Host "  console.log('Différents?', chatA !== chatB) // true" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Test 3 - Vérifier IndexedDB:" -ForegroundColor Yellow
    Write-Host "  const req = indexedDB.open('clara_db', 12)" -ForegroundColor Gray
    Write-Host "  req.onsuccess = () => {" -ForegroundColor Gray
    Write-Host "    const db = req.result" -ForegroundColor Gray
    Write-Host "    const tx = db.transaction(['clara_generated_tables'], 'readonly')" -ForegroundColor Gray
    Write-Host "    const store = tx.objectStore('clara_generated_tables')" -ForegroundColor Gray
    Write-Host "    const getAll = store.getAll()" -ForegroundColor Gray
    Write-Host "    getAll.onsuccess = () => {" -ForegroundColor Gray
    Write-Host "      const tables = getAll.result" -ForegroundColor Gray
    Write-Host "      console.log('Tables par sessionId:', tables.map(t => t.sessionId))" -ForegroundColor Gray
    Write-Host "      // Devrait montrer des sessionIds avec chatId différents" -ForegroundColor Gray
    Write-Host "    }" -ForegroundColor Gray
    Write-Host "  }" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[ERREUR] Fichier de test introuvable: $testFile" -ForegroundColor Red
    Write-Host "[INFO] Créez d'abord test-isolation-chats.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
