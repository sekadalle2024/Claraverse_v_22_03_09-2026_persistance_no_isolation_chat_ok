# DIAGNOSTIC AUTOMATIQUE - PERSISTANCE CHAT

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "     DIAGNOSTIC PERSISTANCE CHAT - 29 AOUT 2026" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# VERIFICATION DU SERVEUR
Write-Host "1. Verification du serveur de developpement..." -ForegroundColor Yellow
Write-Host ""

$viteProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*vite*" -or $_.CommandLine -like "*vite*"
}

if ($viteProcess) {
    Write-Host "   OK - Serveur detecte (PID: $($viteProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Aucun serveur Vite detecte" -ForegroundColor Red
    Write-Host "   -> Lancez : npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# VERIFICATION DES FICHIERS CLES
Write-Host "2. Verification des fichiers de persistance..." -ForegroundColor Yellow
Write-Host ""

$fichiers = @(
    "src\services\flowiseTableBridge.ts",
    "src\components\Clara_Components\FlowiseChatContainer.tsx",
    "index.html"
)

foreach ($fichier in $fichiers) {
    if (Test-Path $fichier) {
        Write-Host "   OK - $fichier" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR - $fichier MANQUANT" -ForegroundColor Red
    }
}

Write-Host ""

# VERIFICATION LOCALSTORAGE
Write-Host "3. Instructions pour verifier localStorage..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   -> Ouvrez la Console (F12)" -ForegroundColor Cyan
Write-Host "   -> Tapez : localStorage" -ForegroundColor Cyan
Write-Host "   -> Cherchez : 'flowise_messages_*'" -ForegroundColor Cyan
Write-Host ""
Write-Host "   COPIEZ LA SORTIE ICI :" -ForegroundColor Yellow
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# TEST DE CREATION DE CHAT
Write-Host "4. Test de creation de chat..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Actions a faire :" -ForegroundColor Cyan
Write-Host "   1. Ouvrez l'application" -ForegroundColor White
Write-Host "   2. Creez un nouveau chat" -ForegroundColor White
Write-Host "   3. Envoyez un message test" -ForegroundColor White
Write-Host "   4. Rechargez la page (F5)" -ForegroundColor White
Write-Host ""
Write-Host "   QUESTION : Le chat est-il toujours la apres rechargement ?" -ForegroundColor Yellow
Write-Host "   [ ] OUI - Le chat est persiste" -ForegroundColor Green
Write-Host "   [ ] NON - Le chat disparait" -ForegroundColor Red
Write-Host ""

# VERIFICATION DES ERREURS CONSOLE
Write-Host "5. Verification des erreurs..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   -> Ouvrez la Console (F12)" -ForegroundColor Cyan
Write-Host "   -> Onglet 'Console'" -ForegroundColor Cyan
Write-Host "   -> Creez un chat et envoyez un message" -ForegroundColor Cyan
Write-Host ""
Write-Host "   COPIEZ TOUTES LES ERREURS EN ROUGE ICI :" -ForegroundColor Yellow
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# VERIFICATION RESEAU
Write-Host "6. Verification des appels reseau..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   -> F12 -> Onglet 'Network'" -ForegroundColor Cyan
Write-Host "   -> Creez un chat" -ForegroundColor Cyan
Write-Host "   -> Regardez si vous voyez des appels vers :" -ForegroundColor Cyan
Write-Host "      * flowise" -ForegroundColor White
Write-Host "      * localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "   Voyez-vous des erreurs 404, 500, ou CORS ?" -ForegroundColor Yellow
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host "   ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# RESUME
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "RESUME DU DIAGNOSTIC" -ForegroundColor Yellow
Write-Host ""
Write-Host "Remplissez ce formulaire et envoyez-moi :" -ForegroundColor White
Write-Host ""
Write-Host "SYMPTOMES OBSERVES :" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "[ ] Les chats disparaissent apres rechargement" -ForegroundColor White
Write-Host "[ ] Les messages ne sont pas sauvegardes" -ForegroundColor White
Write-Host "[ ] Les chats se melangent" -ForegroundColor White
Write-Host "[ ] Impossible de creer un nouveau chat" -ForegroundColor White
Write-Host "[ ] Autre : _____________________" -ForegroundColor White
Write-Host ""
Write-Host "ERREURS DANS LA CONSOLE :" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host "CONTENU DE LOCALSTORAGE :" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ENVOYEZ-MOI CES INFORMATIONS POUR UN DIAGNOSTIC PRECIS !" -ForegroundColor Yellow
Write-Host ""
