# Script de Vérification de l'Implémentation
# Vérifie que les modifications du plan d'implémentation ont été appliquées

Write-Host "🔍 VÉRIFICATION DE L'IMPLÉMENTATION - Persistance Tables ClaraVerse" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0
$success = 0

# Fonction de vérification
function Test-FileModification {
    param(
        [string]$FilePath,
        [string]$SearchPattern,
        [string]$Description
    )
    
    if (!(Test-Path $FilePath)) {
        Write-Host "❌ ERREUR: Fichier introuvable - $FilePath" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    if ($content -match $SearchPattern) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️  AVERTISSEMENT: $Description - Pattern non trouvé" -ForegroundColor Yellow
        Write-Host "   Recherché: $SearchPattern" -ForegroundColor Gray
        return $false
    }
}

Write-Host "📂 VÉRIFICATION DES FICHIERS" -ForegroundColor Yellow
Write-Host "-" * 80

# 1. Vérifier auto-restore-chat-change.js
Write-Host "`n1️⃣  Vérification de auto-restore-chat-change.js..." -ForegroundColor Cyan
$file1 = "h:\ClaraVerse\public\auto-restore-chat-change.js"

if (Test-FileModification -FilePath $file1 -SearchPattern "detectChatId" -Description "Fonction detectChatId() ajoutée") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file1 -SearchPattern "onChatChanged" -Description "Fonction onChatChanged() ajoutée") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file1 -SearchPattern "claraverse:session:changed" -Description "Événement claraverse:session:changed émis") {
    $success++
} else {
    $warnings++
}

# 2. Vérifier conso.js
Write-Host "`n2️⃣  Vérification de conso.js..." -ForegroundColor Cyan
$file2 = "h:\ClaraVerse\public\conso.js"

if (Test-FileModification -FilePath $file2 -SearchPattern "insertResultatTableBeforeModelised" -Description "Fonction insertResultatTableBeforeModelised() ajoutée") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file2 -SearchPattern "data-table-position" -Description "Attribut data-table-position défini") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file2 -SearchPattern "data-created-timestamp" -Description "Attribut data-created-timestamp défini") {
    $success++
} else {
    $warnings++
}

# 3. Vérifier flowiseTableBridge.ts
Write-Host "`n3️⃣  Vérification de flowiseTableBridge.ts..." -ForegroundColor Cyan
$file3 = "h:\ClaraVerse\src\services\flowiseTableBridge.ts"

if (Test-FileModification -FilePath $file3 -SearchPattern "data-created-timestamp|createdTimestamp" -Description "Protection par timestamp ajoutée dans cleanup") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file3 -SearchPattern "ageInSeconds\s*<\s*5" -Description "Seuil de protection 5 secondes implémenté") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file3 -SearchPattern "data-message-timestamp|messageTimestamp" -Description "Protection par message récent ajoutée") {
    $success++
} else {
    $warnings++
}

# 4. Vérifier conso-indexeddb-bridge.js
Write-Host "`n4️⃣  Vérification de conso-indexeddb-bridge.js..." -ForegroundColor Cyan
$file4 = "h:\ClaraVerse\public\conso-indexeddb-bridge.js"

if (Test-FileModification -FilePath $file4 -SearchPattern "claraverse:session:changed" -Description "Écoute de l'événement session:changed") {
    $success++
} else {
    $warnings++
}

if (Test-FileModification -FilePath $file4 -SearchPattern "currentBridgeSessionId" -Description "Variable de session interne ajoutée") {
    $success++
} else {
    $warnings++
}

# 5. Vérifier la compilation TypeScript
Write-Host "`n5️⃣  Vérification de la compilation TypeScript..." -ForegroundColor Cyan

$distPath = "h:\ClaraVerse\dist"
if (Test-Path $distPath) {
    Write-Host "✅ Dossier dist/ existe" -ForegroundColor Green
    $success++
    
    $indexJs = Join-Path $distPath "index.js"
    if (Test-Path $indexJs) {
        Write-Host "✅ Fichier dist/index.js existe" -ForegroundColor Green
        $success++
    } else {
        Write-Host "⚠️  AVERTISSEMENT: dist/index.js introuvable - Compiler avec 'npm run build'" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "⚠️  AVERTISSEMENT: Dossier dist/ introuvable - Compiler avec 'npm run build'" -ForegroundColor Yellow
    $warnings++
}

# 6. Vérifier index.html (ordre des scripts)
Write-Host "`n6️⃣  Vérification de index.html..." -ForegroundColor Cyan
$indexHtml = "h:\ClaraVerse\index.html"

if (Test-Path $indexHtml) {
    $htmlContent = Get-Content $indexHtml -Raw
    
    # Vérifier l'ordre des scripts
    $menuPersistencePos = $htmlContent.IndexOf("menu-persistence-bridge.js")
    $consoJsPos = $htmlContent.IndexOf("conso.js")
    $autoRestorePos = $htmlContent.IndexOf("auto-restore-chat-change.js")
    
    if ($menuPersistencePos -lt $consoJsPos -and $consoJsPos -lt $autoRestorePos) {
        Write-Host "✅ Ordre des scripts correct dans index.html" -ForegroundColor Green
        $success++
    } else {
        Write-Host "❌ ERREUR: Ordre des scripts incorrect dans index.html" -ForegroundColor Red
        Write-Host "   Attendu: menu-persistence-bridge.js < conso.js < auto-restore-chat-change.js" -ForegroundColor Gray
        $errors++
    }
    
    # Vérifier l'absence de la typo
    if ($htmlContent -match "menu-perssistence") {
        Write-Host "❌ ERREUR: Typo 'menu-perssistence' trouvée (devrait être 'menu-persistence')" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "✅ Pas de typo dans le nom du script" -ForegroundColor Green
        $success++
    }
} else {
    Write-Host "❌ ERREUR: index.html introuvable" -ForegroundColor Red
    $errors++
}

# RÉSUMÉ
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DE LA VÉRIFICATION" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

Write-Host "`n✅ Succès   : $success" -ForegroundColor Green
Write-Host "⚠️  Avertis.: $warnings" -ForegroundColor Yellow
Write-Host "❌ Erreurs  : $errors" -ForegroundColor Red

$total = $success + $warnings + $errors
$percentage = if ($total -gt 0) { [math]::Round(($success / $total) * 100, 1) } else { 0 }

Write-Host "`n📈 Taux de complétion : $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 50) { "Yellow" } else { "Red" })

# Recommandations
Write-Host "`n💡 RECOMMANDATIONS" -ForegroundColor Yellow
Write-Host "-" * 80

if ($warnings -gt 0) {
    Write-Host "⚠️  Certaines modifications recommandées n'ont pas été détectées." -ForegroundColor Yellow
    Write-Host "   Consultez 00_COMMENCER_ICI_IMPLEMENTATION.md pour les détails." -ForegroundColor Gray
}

if ($errors -gt 0) {
    Write-Host "❌ Des erreurs critiques ont été détectées." -ForegroundColor Red
    Write-Host "   Corrigez-les avant de continuer." -ForegroundColor Gray
}

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 Toutes les vérifications sont passées !" -ForegroundColor Green
    Write-Host "   Prochaines étapes :" -ForegroundColor Gray
    Write-Host "   1. Compiler TypeScript : npm run build" -ForegroundColor Gray
    Write-Host "   2. Redémarrer le serveur : npm run dev" -ForegroundColor Gray
    Write-Host "   3. Tester avec test-persistence-tables.html" -ForegroundColor Gray
}

# Instructions pour compiler
if ($warnings -gt 3) {
    Write-Host "`n📦 Pour compiler le projet TypeScript :" -ForegroundColor Cyan
    Write-Host "   cd h:\ClaraVerse" -ForegroundColor Gray
    Write-Host "   npm run build" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "Fin de la vérification" -ForegroundColor Cyan
Write-Host ("=" * 80) + "`n" -ForegroundColor Cyan

# Code de sortie
if ($errors -gt 0) {
    exit 1
} elseif ($warnings -gt 3) {
    exit 2
} else {
    exit 0
}
