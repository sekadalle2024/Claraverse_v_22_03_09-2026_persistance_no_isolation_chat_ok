# Script PowerShell pour appliquer le patch anti-doublons
# 29 aout 2026 - Version sans emojis

Write-Host "[PATCH] APPLICATION DU PATCH ANTI-DOUBLONS..." -ForegroundColor Cyan

$bridgeFile = "h:\Claverse_1\src\services\flowiseTableBridge.ts"
$notebookFile = "h:\Claverse_1\src\services\claraNotebookService.ts"
$ttsFile = "h:\Claverse_1\src\services\claraTTSService.ts"
$voiceFile = "h:\Claverse_1\src\services\claraVoiceService.ts"

# Backup files
Write-Host "`n[BACKUP] Creation des backups..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item $bridgeFile "$bridgeFile.backup-$timestamp"
Copy-Item $notebookFile "$notebookFile.backup-$timestamp"
Copy-Item $ttsFile "$ttsFile.backup-$timestamp"
Copy-Item $voiceFile "$voiceFile.backup-$timestamp"
Write-Host "[OK] Backups crees" -ForegroundColor Green

# 1. Ajouter fonction de nettoyage dans flowiseTableBridge.ts
Write-Host "`n[1/5] Ajout de la fonction cleanupDuplicateTablesOnStartup..." -ForegroundColor Green

$cleanupFunction = @'

  /**
   * Nettoyer les tables en doublon au demarrage
   * Evite la coexistence de tables anciennes et restaurees
   */
  private cleanupDuplicateTablesOnStartup(): void {
    const allTables = document.querySelectorAll('table[data-keyword]');
    const seenKeywords = new Map<string, HTMLTableElement>();
    const seenIds = new Set<string>();
    let removedCount = 0;

    allTables.forEach(table => {
      const keyword = (table as HTMLTableElement).dataset.keyword;
      const tableId = (table as HTMLTableElement).dataset.tableId;
      
      if (!keyword) return;

      // Verifier doublon par keyword OU par table-id
      const isDuplicateKeyword = seenKeywords.has(keyword);
      const isDuplicateId = tableId && seenIds.has(tableId);

      if (isDuplicateKeyword || isDuplicateId) {
        // C'est un doublon - supprimer
        const wrapper = table.closest('.restored-table-wrapper');
        if (wrapper) {
          wrapper.remove();
        } else {
          table.remove();
        }
        removedCount++;
        console.log(`[CLEANUP] Removed duplicate: ${keyword} (${tableId || 'no-id'})`);
      } else {
        // Premiere occurrence - garder et enregistrer
        seenKeywords.set(keyword, table as HTMLTableElement);
        if (tableId) seenIds.add(tableId);
      }
    });

    if (removedCount > 0) {
      console.log(`[CLEANUP] Removed ${removedCount} duplicate table(s) on startup`);
    } else {
      console.log(`[CLEANUP] No duplicates found on startup`);
    }
  }
'@

$content = Get-Content $bridgeFile -Raw -Encoding UTF8
# Inserer avant la methode initializeEventListeners
$pattern = '(  private initializeEventListeners\(\): void \{)'
if ($content -match $pattern) {
    $content = $content -replace $pattern, "$cleanupFunction`n`n  `$1"
    Set-Content $bridgeFile -Value $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] Fonction ajoutee" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Pattern initializeEventListeners non trouve" -ForegroundColor Red
}

# 2. Appeler la fonction au demarrage
Write-Host "`n[2/5] Ajout de l'appel au nettoyage..." -ForegroundColor Green

$content = Get-Content $bridgeFile -Raw -Encoding UTF8
$pattern = '(  private initializeEventListeners\(\): void \{)'
$replacement = '$1' + "`n" + '    // NETTOYAGE INITIAL DES DOUBLONS' + "`n" + '    this.cleanupDuplicateTablesOnStartup();' + "`n"
$content = $content -replace $pattern, $replacement
Set-Content $bridgeFile -Value $content -Encoding UTF8 -NoNewline
Write-Host "[OK] Appel ajoute" -ForegroundColor Green

# 3. Desactiver health checking dans claraNotebookService
Write-Host "`n[3/5] Desactivation du health checking (claraNotebookService)..." -ForegroundColor Green

$content = Get-Content $notebookFile -Raw -Encoding UTF8
$content = $content -replace '    this\.startHealthChecking\(\);', "    // DESACTIVE - Backend non necessaire`n    // this.startHealthChecking();`n    console.log('[INFO] Notebook Service: Health checking disabled');"
Set-Content $notebookFile -Value $content -Encoding UTF8 -NoNewline
Write-Host "[OK] Health checking desactive" -ForegroundColor Green

# 4. Desactiver health checking dans claraTTSService
Write-Host "`n[4/5] Desactivation du health checking (claraTTSService)..." -ForegroundColor Green

$content = Get-Content $ttsFile -Raw -Encoding UTF8
$content = $content -replace '    this\.startHealthChecking\(\);', "    // DESACTIVE - Backend non necessaire`n    // this.startHealthChecking();`n    console.log('[INFO] TTS Service: Health checking disabled');"
Set-Content $ttsFile -Value $content -Encoding UTF8 -NoNewline
Write-Host "[OK] Health checking desactive" -ForegroundColor Green

# 5. Desactiver health checking dans claraVoiceService (si present)
Write-Host "`n[5/5] Desactivation du health checking (claraVoiceService)..." -ForegroundColor Green

$content = Get-Content $voiceFile -Raw -Encoding UTF8
if ($content -match 'startHealthChecking') {
    $content = $content -replace '    this\.startHealthChecking\(\);', "    // DESACTIVE - Backend non necessaire`n    // this.startHealthChecking();`n    console.log('[INFO] Voice Service: Health checking disabled');"
    Set-Content $voiceFile -Value $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] Health checking desactive" -ForegroundColor Green
} else {
    Write-Host "[INFO] Pas de startHealthChecking dans Voice Service" -ForegroundColor Yellow
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "PATCH APPLIQUE AVEC SUCCES!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "`nProchaines etapes:" -ForegroundColor Cyan
Write-Host "1. Verifier les modifications dans les fichiers"
Write-Host "2. npm run build"
Write-Host "3. Tester avec F5 dans le navigateur"
Write-Host "4. Verifier les logs console"
Write-Host "`nBackups crees avec timestamp: $timestamp" -ForegroundColor Yellow
