# ================================================================
# Script de Verification Avant Push
# ClaraVerse V22 - 03 Septembre 2026
# ================================================================

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Verification Avant Push - ClaraVerse V22                       " -ForegroundColor Cyan
Write-Host "  03 Septembre 2026                                              " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Verifier que Git est installe
Write-Host "1. Verification de Git..." -ForegroundColor Yellow
$gitVersion = git --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Git installe: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Git n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    $allGood = $false
}

# 2. Verifier qu'on est dans un repository Git
Write-Host ""
Write-Host "2. Verification du repository Git..." -ForegroundColor Yellow
$isGitRepo = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Repository Git detecte" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Pas de repository Git dans ce dossier" -ForegroundColor Red
    $allGood = $false
}

# 3. Verifier la branche actuelle
Write-Host ""
Write-Host "3. Verification de la branche..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch) {
    Write-Host "  OK Branche actuelle: $currentBranch" -ForegroundColor Green
    if ($currentBranch -ne "main") {
        Write-Host "  ATTENTION: Vous n'etes pas sur la branche 'main'" -ForegroundColor Yellow
        Write-Host "     Le script changera automatiquement de branche" -ForegroundColor Gray
    }
} else {
    Write-Host "  ERREUR Impossible de determiner la branche actuelle" -ForegroundColor Red
    $allGood = $false
}

# 4. Verifier l'etat des fichiers
Write-Host ""
Write-Host "4. Verification de l'etat des fichiers..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    $nbFiles = ($gitStatus | Measure-Object).Count
    Write-Host "  OK $nbFiles fichiers modifies/ajoutes/supprimes" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Details (premiers 10 fichiers):" -ForegroundColor Cyan
    $gitStatus | Select-Object -First 10 | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Gray
    }
    if ($nbFiles -gt 10) {
        Write-Host "     ... et $($nbFiles - 10) autres fichiers" -ForegroundColor Gray
    }
} else {
    Write-Host "  INFO Aucun fichier modifie - Le repository est deja a jour" -ForegroundColor Yellow
    Write-Host "     Vous pouvez quand meme lancer le push pour changer de repository" -ForegroundColor Gray
}

# 5. Verifier le remote actuel
Write-Host ""
Write-Host "5. Verification du repository distant..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Remote actuel:" -ForegroundColor Green
    Write-Host "     $currentRemote" -ForegroundColor Gray
    
    $newRepo = "https://github.com/sekadalle2024/Claraverse_v_22_03_09-2026_persistance_no_isolation_chat_ok.git"
    if ($currentRemote -ne $newRepo) {
        Write-Host ""
        Write-Host "  INFO Le remote sera change vers:" -ForegroundColor Cyan
        Write-Host "     $newRepo" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "  OK Le remote est deja configure pour le bon repository" -ForegroundColor Green
    }
} else {
    Write-Host "  ERREUR Aucun remote 'origin' configure" -ForegroundColor Red
    Write-Host "     Le script le configurera automatiquement" -ForegroundColor Gray
}

# 6. Verifier la connexion Internet
Write-Host ""
Write-Host "6. Verification de la connexion Internet..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName github.com -Count 2 -Quiet 2>&1
if ($ping) {
    Write-Host "  OK Connexion a GitHub OK" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION Impossible de contacter GitHub" -ForegroundColor Yellow
    Write-Host "     Verifiez votre connexion Internet" -ForegroundColor Gray
    $allGood = $false
}

# 7. Verifier l'espace disque
Write-Host ""
Write-Host "7. Verification de l'espace disque..." -ForegroundColor Yellow
$drive = Get-PSDrive -Name (Get-Location).Drive.Name
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -gt 1) {
    Write-Host "  OK Espace libre: $freeSpaceGB GB" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION Espace disque faible: $freeSpaceGB GB" -ForegroundColor Yellow
}

# 8. Estimation de la taille du projet
Write-Host ""
Write-Host "8. Estimation de la taille du projet..." -ForegroundColor Yellow
Write-Host "  Calcul en cours (peut prendre quelques secondes)..." -ForegroundColor Gray
$projectSize = (Get-ChildItem -Path . -Recurse -Force -ErrorAction SilentlyContinue | 
                Where-Object { $_.FullName -notmatch '\\.git\\' } | 
                Measure-Object -Property Length -Sum).Sum
$projectSizeMB = [math]::Round($projectSize / 1MB, 2)
Write-Host "  Taille du projet (hors .git): $projectSizeMB MB" -ForegroundColor Cyan

if ($projectSizeMB -gt 100) {
    Write-Host "  OK Projet > 100 MB: La solution 'Commits Multiples' est appropriee" -ForegroundColor Green
} else {
    Write-Host "  INFO Projet < 100 MB: Un push simple pourrait suffire" -ForegroundColor Gray
    Write-Host "     Mais la solution 'Commits Multiples' fonctionne aussi" -ForegroundColor Gray
}

# 9. Verifier les identifiants Git
Write-Host ""
Write-Host "9. Verification de la configuration Git..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email
if ($gitUser -and $gitEmail) {
    Write-Host "  OK Identifiants Git configures" -ForegroundColor Green
    Write-Host "     Nom: $gitUser" -ForegroundColor Gray
    Write-Host "     Email: $gitEmail" -ForegroundColor Gray
} else {
    Write-Host "  ATTENTION Identifiants Git non configures" -ForegroundColor Yellow
    Write-Host "     Configurez-les avec:" -ForegroundColor Gray
    Write-Host "     git config user.name 'Votre Nom'" -ForegroundColor DarkGray
    Write-Host "     git config user.email 'votre@email.com'" -ForegroundColor DarkGray
}

# Resume final
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  RESUME DE LA VERIFICATION                                      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "OK TOUT EST PRET POUR LE PUSH !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Executez le script de push:" -ForegroundColor White
    Write-Host "     .\push-claraverse-v22-03-sept-2026.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Le script effectuera automatiquement:" -ForegroundColor White
    Write-Host "     - Configuration Git optimale" -ForegroundColor Gray
    Write-Host "     - Changement du remote" -ForegroundColor Gray
    Write-Host "     - Division en 7 commits" -ForegroundColor Gray
    Write-Host "     - Push avec retry automatique" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Duree estimee: 10-15 minutes" -ForegroundColor White
} else {
    Write-Host "ATTENTION: Certaines verifications ont echoue" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Veuillez corriger les problemes ci-dessus avant de continuer" -ForegroundColor White
    Write-Host ""
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
