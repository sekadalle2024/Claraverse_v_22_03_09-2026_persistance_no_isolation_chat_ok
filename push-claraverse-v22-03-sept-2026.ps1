# ================================================================
# Script de Push ClaraVerse vers GitHub
# Version: V22 - 03 Septembre 2026
# Repository: https://github.com/sekadalle2024/Claraverse_v_22_03_09-2026_persistance_no_isolation_chat_ok.git
# Solution: Commits Multiples pour projet > 140 MB
# ================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Push ClaraVerse V22 - 03 Septembre 2026                        " -ForegroundColor Cyan
Write-Host "  Persistance No Isolation Chat OK                               " -ForegroundColor Cyan
Write-Host "  Solution: Commits Multiples pour projet > 140 MB               " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$repoUrl = "https://github.com/sekadalle2024/Claraverse_v_22_03_09-2026_persistance_no_isolation_chat_ok.git"
$branche = "main"
$commitPrefix = "Sauvegarde ClaraVerse V22 - 03 Sept 2026"

# Fonction pour push avec retry
function Push-WithRetry {
    param(
        [string]$message,
        [int]$maxRetries = 3
    )
    
    $retry = 0
    while ($retry -lt $maxRetries) {
        Write-Host "  Push tentative $($retry + 1)/$maxRetries..." -ForegroundColor Gray
        
        $pushOutput = git push origin $branche 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Push reussi: $message" -ForegroundColor Green
            return $true
        }
        
        Write-Host "  [WARN] Erreur: $pushOutput" -ForegroundColor Yellow
        
        $retry++
        if ($retry -lt $maxRetries) {
            Write-Host "  [INFO] Nouvelle tentative dans 10 secondes..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }
    
    Write-Host "  [ERREUR] Push echoue apres $maxRetries tentatives" -ForegroundColor Red
    return $false
}

# Etape 1: Verifier l'etat actuel
Write-Host "1. Verification de l'etat Git..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    $nbFiles = ($gitStatus | Measure-Object).Count
    Write-Host "  [INFO] Fichiers modifies/ajoutes/supprimes: $nbFiles fichiers" -ForegroundColor White
    Write-Host ""
    Write-Host "  Resume des modifications:" -ForegroundColor Cyan
    Write-Host "  - Fichiers modifies dans Doc Systeme persistance chat/" -ForegroundColor Gray
    Write-Host "  - Fichiers modifies dans src/services et components" -ForegroundColor Gray
    Write-Host "  - Fichiers modifies dans public/" -ForegroundColor Gray
    Write-Host "  - Nouveaux fichiers de diagnostic et tests" -ForegroundColor Gray
} else {
    Write-Host "  [OK] Aucun fichier modifie" -ForegroundColor Green
}

# Etape 2: Verifier la branche
Write-Host ""
Write-Host "2. Verification de la branche..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "  Branche actuelle: $currentBranch" -ForegroundColor Gray

if ($currentBranch -ne $branche) {
    Write-Host "  [WARN] Changement de branche vers $branche..." -ForegroundColor Yellow
    git checkout -b $branche 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git checkout $branche 2>&1 | Out-Null
    }
} else {
    Write-Host "  [OK] Vous etes deja sur la branche $branche" -ForegroundColor Green
}

# Etape 3: Configuration Git optimale
Write-Host ""
Write-Host "3. Configuration Git optimale pour gros projet..." -ForegroundColor Yellow
git config core.compression 0
git config http.postBuffer 1048576000
git config http.lowSpeedTime 999999
git config http.lowSpeedLimit 0
git config pack.windowMemory "100m"
git config pack.packSizeLimit "100m"
git config pack.threads "1"
Write-Host "  [OK] Configuration appliquee (Buffer 1GB, compression desactivee)" -ForegroundColor Green

# Etape 4: Configurer le remote vers le NOUVEAU repository
Write-Host ""
Write-Host "4. Configuration du nouveau repository distant..." -ForegroundColor Yellow
Write-Host "  Repository source actuel:" -ForegroundColor Gray
$currentRemote = git remote get-url origin
Write-Host "    $currentRemote" -ForegroundColor DarkGray

Write-Host ""
Write-Host "  Changement vers le nouveau repository:" -ForegroundColor Cyan
git remote set-url origin $repoUrl
Write-Host "  [OK] Remote 'origin' mis a jour" -ForegroundColor Green

Write-Host ""
Write-Host "  Nouveau repository cible:" -ForegroundColor Cyan
Write-Host "  $repoUrl" -ForegroundColor White

# Etape 5: Verifier la connexion
Write-Host ""
Write-Host "5. Verification de la connexion au nouveau repository..." -ForegroundColor Yellow
$lsRemote = git ls-remote origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Connexion au repository reussie" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Le repository sera cree lors du premier push" -ForegroundColor Yellow
    Write-Host "  C'est normal pour un nouveau repository vide" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  DEBUT DU PUSH EN 7 PARTIES                                      " -ForegroundColor Cyan
Write-Host "  Chaque partie < 30 MB pour eviter les timeouts                  " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# Partie 1: Code Source React/TypeScript (src/)
Write-Host ""
Write-Host "[Partie 1/7] Code Source React/TypeScript (src/)..." -ForegroundColor Cyan
git add src/ 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 1: Code Source React/TypeScript" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Code Source React/TypeScript")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        Write-Host ""
        Write-Host "[INFO] Solution alternative:" -ForegroundColor Yellow
        Write-Host "   1. Utilisez GitHub Desktop" -ForegroundColor Gray
        Write-Host "   2. Ou executez: git push -u origin main --force (si nouveau repo)" -ForegroundColor Gray
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans src/" -ForegroundColor Gray
}

# Partie 2: Backend Python
Write-Host ""
Write-Host "[Partie 2/7] Backend Python (py_backend/)..." -ForegroundColor Cyan
git add py_backend/ 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 2: Backend Python" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Backend Python")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans py_backend/" -ForegroundColor Gray
}

# Partie 3: Fichiers Publics (public/)
Write-Host ""
Write-Host "[Partie 3/7] Fichiers Publics et Scripts JS (public/)..." -ForegroundColor Cyan
git add public/ 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 3: Fichiers Publics et Scripts JS" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Fichiers Publics")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans public/" -ForegroundColor Gray
}

# Partie 4: Documentation Systeme Persistance
Write-Host ""
Write-Host "[Partie 4/7] Documentation Systeme Persistance Chat..." -ForegroundColor Cyan
git add "Doc Systeme persistance chat/" 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 4: Documentation Systeme Persistance" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Documentation Systeme Persistance")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans Doc Systeme persistance chat/" -ForegroundColor Gray
}

# Partie 5: Documentation principale
Write-Host ""
Write-Host "[Partie 5/7] Documentation principale..." -ForegroundColor Cyan
git add "Doc menu demarrer/" "Doc export rapport/" "Doc_Lead_Balance/" "Doc_Etat_Fin/" "Doc papier de travail javascript/" "Doc_Github_Issue/" 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 5: Documentation principale" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Documentation principale")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans la documentation principale" -ForegroundColor Gray
}

# Partie 6: Fichiers racine (index.html, fichiers .md, .txt, etc.)
Write-Host ""
Write-Host "[Partie 6/7] Fichiers racine (HTML, MD, TXT)..." -ForegroundColor Cyan
git add *.html *.md *.txt *.json 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 6: Fichiers racine" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Fichiers racine")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun changement dans les fichiers racine" -ForegroundColor Gray
}

# Partie 7: Fichiers restants (configuration, scripts PowerShell, etc.)
Write-Host ""
Write-Host "[Partie 7/7] Configuration et fichiers divers..." -ForegroundColor Cyan
git add . 2>&1 | Out-Null
$commitResult = git commit -m "$commitPrefix - Partie 7: Configuration et fichiers divers" 2>&1
if ($commitResult -notmatch "nothing to commit") {
    Write-Host "  [OK] Commit cree" -ForegroundColor Green
    if (-not (Push-WithRetry "Configuration et fichiers divers")) {
        Write-Host ""
        Write-Host "[ERREUR] ECHEC - Arret du script" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SKIP] Aucun fichier restant" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "           [SUCCESS] PUSH TERMINE AVEC SUCCES                    " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verification finale..." -ForegroundColor Yellow
git status
Write-Host ""
Write-Host "Repository GitHub:" -ForegroundColor Cyan
Write-Host "   $repoUrl" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "   1. Verifier le repository sur GitHub:" -ForegroundColor Gray
Write-Host "      https://github.com/sekadalle2024/Claraverse_v_22_03_09-2026_persistance_no_isolation_chat_ok" -ForegroundColor DarkGray
Write-Host "   2. Configurer la visibilite (public/prive)" -ForegroundColor Gray
Write-Host "   3. Ajouter une description au repository" -ForegroundColor Gray
Write-Host ""
Write-Host "Commits effectues:" -ForegroundColor Cyan
git log --oneline -7
Write-Host ""
