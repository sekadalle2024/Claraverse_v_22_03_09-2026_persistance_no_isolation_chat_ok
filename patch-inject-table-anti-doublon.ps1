# Patch spécifique pour renforcer l'anti-doublon dans injectTableIntoDOM
# 29 août 2026

Write-Host "🔧 PATCH ANTI-DOUBLON RENFORCÉ dans injectTableIntoDOM..." -ForegroundColor Cyan

$bridgeFile = "h:\Claverse_1\src\services\flowiseTableBridge.ts"

# Backup
Write-Host "`n📦 Création du backup..." -ForegroundColor Yellow
Copy-Item $bridgeFile "$bridgeFile.backup-inject-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Lire le fichier
$content = Get-Content $bridgeFile -Raw -Encoding UTF8

# Ancien code à remplacer (ligne ~1489)
$oldCode = @'
      // 🔥 CORRECTION CRITIQUE DOUBLONS: Compter toutes les tables avec ce keyword
      const allTablesWithKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
      
      if (allTablesWithKeyword.length > 0) {
        // Il existe DÉJÀ une ou plusieurs tables avec ce keyword dans le DOM
        // C'est soit une restauration déjà effectuée, soit Flowise vient de la générer
        console.log(`⏭️ Skip restoration of "${tableData.keyword}" - ${allTablesWithKeyword.length} table(s) already in DOM`);
        
        // Marquer toutes ces tables comme "déjà traitées" pour éviter future restauration
        allTablesWithKeyword.forEach(table => {
          if (!table.getAttribute('data-restored')) {
            table.setAttribute('data-skip-restore', 'true');
          }
        });
        
        return;
      }
      
      // Si on arrive ici, aucune table avec ce keyword n'existe dans le DOM
      // On peut restaurer en toute sécurité
      console.log(`🔄 Restoring "${tableData.keyword}" - no existing table found in DOM`);
'@

# Nouveau code avec triple vérification
$newCode = @'
      // 🔥 ANTI-DOUBLON TRIPLE VÉRIFICATION - 29 août 2026
      // 1. Vérifier par data-keyword
      const allTablesWithKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
      
      // 2. Vérifier par data-table-id sur les tables
      const tablesWithId = document.querySelectorAll(`table[data-table-id="${tableData.id}"]`);
      
      // 3. Vérifier les wrappers déjà restaurés avec même ID
      const existingWrappers = document.querySelectorAll(`.restored-table-wrapper[data-table-id="${tableData.id}"]`);
      
      const totalExisting = allTablesWithKeyword.length + tablesWithId.length + existingWrappers.length;
      
      if (totalExisting > 0) {
        console.log(`⏭️ [ANTI-DOUBLON] Skip "${tableData.keyword}" (ID: ${tableData.id}) - Already in DOM:`);
        console.log(`   - ${allTablesWithKeyword.length} table(s) with keyword`);
        console.log(`   - ${tablesWithId.length} table(s) with table-id`);
        console.log(`   - ${existingWrappers.length} wrapper(s) with table-id`);
        
        // Marquer TOUTES comme traitées pour éviter futures restaurations
        [...allTablesWithKeyword, ...tablesWithId].forEach(table => {
          if (!table.getAttribute('data-restored')) {
            table.setAttribute('data-skip-restore', 'true');
            table.setAttribute('data-table-id', tableData.id);
          }
        });
        
        return;
      }
      
      // Si on arrive ici, AUCUNE table avec ce keyword/id n'existe
      // On peut restaurer en toute sécurité
      console.log(`🔄 [VERIFIED] Restoring "${tableData.keyword}" (ID: ${tableData.id}) - NO duplicates found`);
'@

# Vérifier si l'ancien code existe
if ($content -match [regex]::Escape("CORRECTION CRITIQUE DOUBLONS")) {
    Write-Host "✅ Ancien code trouvé, remplacement en cours..." -ForegroundColor Green
    
    # Remplacer avec gestion des caractères spéciaux
    $content = $content -replace [regex]::Escape($oldCode), $newCode
    
    # Sauvegarder
    Set-Content $bridgeFile -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "✅ PATCH APPLIQUÉ AVEC SUCCÈS!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Code source non trouvé - vérification manuelle nécessaire" -ForegroundColor Yellow
    Write-Host "Le nouveau code a été préparé dans: patch-nouveau-code.txt" -ForegroundColor Yellow
    
    # Sauvegarder le nouveau code pour application manuelle
    Set-Content "h:\Claverse_1\patch-nouveau-code.txt" -Value $newCode -Encoding UTF8
}

Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les modifications"
Write-Host "   2. npm run build"
Write-Host "   3. F5 dans le navigateur"
Write-Host "   4. Vérifier logs console: [ANTI-DOUBLON] et [VERIFIED]"
