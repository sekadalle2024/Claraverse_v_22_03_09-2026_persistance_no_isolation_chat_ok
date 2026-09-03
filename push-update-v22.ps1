# ================================================================
# Script de Mise a Jour Push - ClaraVerse V22
# Date: 03 Septembre 2026
# Push des 19 commits en attente
# ================================================================

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Mise a Jour Push GitHub - ClaraVerse V22                       " -ForegroundColor Cyan
Write-Host "  19 commits en attente                                          " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$repoUrl = "https://github.com/sekadalle2024/Claraverse_v_22_03_09-2026_persistance_no_isolation_chat_ok.git"
$branche = "main"

# Configuration Git optimale
Write-Host "1. Configuration Git optimale..." -ForegroundColor Yellow
git config http.postBuffer 1048576000
git config http.lowSpeedTime 999999
git config http.lowSpeedLimit 0
Write-Host "   [OK] Configuration appliquee" -ForegroundColor Green

# Verification de l'etat
Write-Host ""
Write-Host "2. Verification de l'etat..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   [WARN] Fichiers non commites detectes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    Write-Host "   Voulez-vous les commiter avant le push? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "O" -or $response -eq "o") {
        git add .
        git commit -m "Mise a jour automatique avant push"
        Write-Host "   [OK] Fichiers commites" -ForegroundColor Green
    }
} else {
    Write-Host "   [OK] Aucun fichier non commite" -ForegroundColor Green
}

# Afficher les commits en attente
Write-Host ""
Write-Host "3. Commits en attente de push:" -ForegroundColor Yellow
$commitsAhead = git rev-list --count origin/$branche..$branche 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Nombre de commits: $commitsAhead" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Apercu des commits:" -ForegroundColor Gray
    git log --oneline origin/$branche..$branche
} else {
    Write-Host "   [INFO] Impossible de comparer avec origin (premier push?)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DEBUT DU PUSH                                                  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction de push avec retry
function Push-WithRetry {
    param([int]$maxRetries = 5)
    
    $retry = 0
    while ($retry -lt $maxRetries) {
        Write-Host "Push tentative $($retry + 1)/$maxRetries..." -ForegroundColor Cyan
        
        $startTime = Get-Date
        $pushOutput = git push origin $branche 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Push reussi en $([math]::Round($duration, 1)) secondes !" -ForegroundColor Green
            return $true
        }
        
        Write-Host "[WARN] Erreur detectee:" -ForegroundColor Yellow
        Write-Host $pushOutput -ForegroundColor Gray
        
        $retry++
        if ($retry -lt $maxRetries) {
            $waitTime = 15
            Write-Host "[INFO] Nouvelle tentative dans $waitTime secondes..." -ForegroundColor Yellow
            Start-Sleep -Seconds $waitTime
        }
    }
    
    Write-Host "[ERREUR] Push echoue apres $maxRetries tentatives" -ForegroundColor Red
    return $false
}

# Executer le push
if (Push-WithRetry -maxRetries 5) {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "           PUSH TERMINE AVEC SUCCES                              " -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host ""
    
    # Verification finale
    Write-Host "Verification finale:" -ForegroundColor Yellow
    git status
    Write-Host ""
    
    Write-Host "Repository GitHub:" -ForegroundColor Cyan
    Write-Host "   $repoUrl" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Derniers commits pushes:" -ForegroundColor Cyan
    git log --oneline -10
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Red
    Write-Host "           ECHEC DU PUSH                                         " -ForegroundColor Red
    Write-Host "=================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Utilisez GitHub Desktop pour le push" -ForegroundColor White
    Write-Host "2. Verifiez votre connexion Internet" -ForegroundColor White
    Write-Host "3. Essayez: git push -u origin main --force (ATTENTION: ecrase l'historique distant)" -ForegroundColor White
    Write-Host ""
    exit 1
}
