# Application de la modification manuelle anti-doublon
# 29 aout 2026 - Ligne 1537 de flowiseTableBridge.ts

$bridgeFile = "h:\Claverse_1\src\services\flowiseTableBridge.ts"

Write-Host "[PATCH] Application modification anti-doublon ligne 1537..." -ForegroundColor Cyan

# Backup
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item $bridgeFile "$bridgeFile.backup-manual-$timestamp"
Write-Host "[OK] Backup cree: backup-manual-$timestamp" -ForegroundColor Green

# Lire le fichier
$content = Get-Content $bridgeFile -Raw -Encoding UTF8

# Ancien code (lignes 1537-1555)
$oldPattern = @'
      // .* CORRECTION CRITIQUE DOUBLONS: Compter toutes les tables avec ce keyword
      const allTablesWithKeyword = document\.querySelectorAll\(`table\[data-keyword="\$\{tableData\.keyword\}"\]`\);
      
      if \(allTablesWithKeyword\.length > 0\) \{
        // Il existe .* une ou plusieurs tables avec ce keyword dans le DOM
        // C'est soit une restauration .* effectuee, soit Flowise vient de la generer
        console\.log\(`.*Skip restoration of "\$\{tableData\.keyword\}" - \$\{allTablesWithKeyword\.length\} table\(s\) already in DOM`\);
        
        // Marquer toutes ces tables comme "deja traitees" pour eviter future restauration
        allTablesWithKeyword\.forEach\(table => \{
          if \(!table\.getAttribute\('data-restored'\)\) \{
            table\.setAttribute\('data-skip-restore', 'true'\);
          \}
        \}\);
        
        return;
      \}
      
      // Si on arrive ici, aucune table avec ce keyword n'existe dans le DOM
      // On peut restaurer en toute securite
      console\.log\(`.*Restoring "\$\{tableData\.keyword\}" - no existing table found in DOM`\);
'@

# Nouveau code avec triple verification
$newCode = @'
      // ANTI-DOUBLON TRIPLE VERIFICATION - 29 aout 2026
      // 1. Verifier par data-keyword
      const allTablesWithKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
      
      // 2. Verifier par data-table-id sur les tables
      const tablesWithId = document.querySelectorAll(`table[data-table-id="${tableData.id}"]`);
      
      // 3. Verifier les wrappers deja restaures avec meme ID
      const existingWrappers = document.querySelectorAll(`.restored-table-wrapper[data-table-id="${tableData.id}"]`);
      
      const totalExisting = allTablesWithKeyword.length + tablesWithId.length + existingWrappers.length;
      
      if (totalExisting > 0) {
        console.log(`[ANTI-DOUBLON] Skip "${tableData.keyword}" (ID: ${tableData.id})`);
        console.log(`   Keyword: ${allTablesWithKeyword.length}, ID: ${tablesWithId.length}, Wrappers: ${existingWrappers.length}`);
        
        // Marquer TOUTES comme traitees pour eviter futures restaurations
        [...allTablesWithKeyword, ...tablesWithId].forEach(table => {
          if (!table.getAttribute('data-restored')) {
            table.setAttribute('data-skip-restore', 'true');
            table.setAttribute('data-table-id', tableData.id);
          }
        });
        
        return;
      }
      
      // Si on arrive ici, AUCUNE table avec ce keyword/id n'existe
      // On peut restaurer en toute securite
      console.log(`[VERIFIED] Restoring "${tableData.keyword}" (ID: ${tableData.id})`);
'@

# Essayer le remplacement avec regex
try {
    if ($content -match $oldPattern) {
        Write-Host "[OK] Pattern trouve, remplacement en cours..." -ForegroundColor Green
        $content = $content -replace $oldPattern, $newCode
        Set-Content $bridgeFile -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[OK] Modification appliquee avec succes!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Pattern non trouve, approche alternative..." -ForegroundColor Yellow
        
        # Approche ligne par ligne
        $lines = Get-Content $bridgeFile -Encoding UTF8
        $lineNumber = 0
        $startLine = -1
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "CORRECTION CRITIQUE DOUBLONS") {
                $startLine = $i
                Write-Host "[OK] Ligne trouvee: $($i + 1)" -ForegroundColor Green
                break
            }
        }
        
        if ($startLine -ge 0) {
            # Trouver la ligne de fin (console.log Restoring)
            $endLine = -1
            for ($i = $startLine; $i -lt [Math]::Min($startLine + 30, $lines.Count); $i++) {
                if ($lines[$i] -match "no existing table found in DOM") {
                    $endLine = $i
                    break
                }
            }
            
            if ($endLine -gt $startLine) {
                Write-Host "[OK] Bloc a remplacer: lignes $($startLine + 1) a $($endLine + 1)" -ForegroundColor Green
                
                # Creer nouveau contenu
                $newLines = @()
                # Avant le bloc
                $newLines += $lines[0..($startLine - 1)]
                # Nouveau code (split par lignes)
                $newLines += $newCode -split "`n"
                # Apres le bloc
                $newLines += $lines[($endLine + 1)..($lines.Count - 1)]
                
                # Sauvegarder
                $newLines | Set-Content $bridgeFile -Encoding UTF8
                Write-Host "[OK] Modification appliquee (approche ligne par ligne)!" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] Ligne de fin non trouvee" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "[ERROR] Ligne de debut non trouvee" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host "MODIFICATION APPLIQUEE!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
    Write-Host "1. Arreter npm run dev (Ctrl+C)"
    Write-Host "2. npm run build"
    Write-Host "3. npm run dev"
    Write-Host "4. Tester dans navigateur (F12 console)"
    Write-Host "`nLogs attendus:" -ForegroundColor Yellow
    Write-Host "- [ANTI-DOUBLON] Skip ... (si table existe)"
    Write-Host "- [VERIFIED] Restoring ... (si table absente)"
    
} catch {
    Write-Host "[ERROR] Erreur lors du remplacement: $_" -ForegroundColor Red
    Write-Host "[INFO] Restauration du backup..." -ForegroundColor Yellow
    Copy-Item "$bridgeFile.backup-manual-$timestamp" $bridgeFile
    Write-Host "[OK] Fichier restaure" -ForegroundColor Green
    exit 1
}
