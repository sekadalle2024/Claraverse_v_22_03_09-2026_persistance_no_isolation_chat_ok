# Script PowerShell pour appliquer le patch anti-doublons
# 29 août 2026

Write-Host "🔧 APPLICATION DU PATCH ANTI-DOUBLONS..." -ForegroundColor Cyan

$bridgeFile = "h:\Claverse_1\src\services\flowiseTableBridge.ts"
$notebookFile = "h:\Claverse_1\src\services\claraNotebookService.ts"
$ttsFile = "h:\Claverse_1\src\services\claraTTSService.ts"
$voiceFile = "h:\Claverse_1\src\services\claraVoiceService.ts"

# Backup files
Write-Host "`n📦 Création des backups..." -ForegroundColor Yellow
Copy-Item $bridgeFile "$bridgeFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $notebookFile "$notebookFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $ttsFile "$ttsFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $voiceFile "$voiceFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 1. Modifier flowiseTableBridge.ts - Ajouter fonction de nettoyage
Write-Host "`n1️⃣ Ajout de la fonction cleanupDuplicateTablesOnStartup..." -ForegroundColor Green

$cleanupFunction = @'

  /**
   * Nettoyer les tables en doublon au démarrage
   * Évite la coexistence de tables anciennes et restaurées
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

      // Vérifier doublon par keyword OU par table-id
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
        console.log(`🗑️ [CLEANUP] Removed duplicate: ${keyword} (${tableId || 'no-id'})`);
      } else {
        // Première occurrence - garder et enregistrer
        seenKeywords.set(keyword, table as HTMLTableElement);
        if (tableId) seenIds.add(tableId);
      }
    });

    if (removedCount > 0) {
      console.log(`✅ [CLEANUP] Removed ${removedCount} duplicate table(s) on startup`);
    } else {
      console.log(`✅ [CLEANUP] No duplicates found on startup`);
    }
  }
'@

$content = Get-Content $bridgeFile -Raw -Encoding UTF8
# Insérer avant la méthode initializeEventListeners
$content = $content -replace '(private initializeEventListeners\(\): void \{)', "$cleanupFunction`n`n  `$1"
Set-Content $bridgeFile -Value $content -Encoding UTF8

# 2. Appeler la fonction de nettoyage au démarrage
Write-Host "2️⃣ Ajout de l'appel au nettoyage dans initializeEventListeners..." -ForegroundColor Green

$content = Get-Content $bridgeFile -Raw -Encoding UTF8
$content = $content -replace '(private initializeEventListeners\(\): void \{\s*)', "`$1`n    // 🧹 NETTOYAGE INITIAL DES DOUBLONS`n    this.cleanupDuplicateTablesOnStartup();`n"
Set-Content $bridgeFile -Value $content -Encoding UTF8

# 3. Désactiver health checking dans claraNotebookService
Write-Host "`n3️⃣ Désactivation du health checking (claraNotebookService)..." -ForegroundColor Green

$content = Get-Content $notebookFile -Raw -Encoding UTF8
$content = $content -replace '(\s+)this\.startHealthChecking\(\);', "`$1// ⛔ DÉSACTIVÉ - Backend non nécessaire pour le moment`n`$1// this.startHealthChecking();`n`$1console.log('ℹ️ Notebook Service: Health checking disabled (backend not required)');"
Set-Content $notebookFile -Value $content -Encoding UTF8

# 4. Désactiver health checking dans claraTTSService
Write-Host "4️⃣ Désactivation du health checking (claraTTSService)..." -ForegroundColor Green

$content = Get-Content $ttsFile -Raw -Encoding UTF8
$content = $content -replace '(\s+)this\.startHealthChecking\(\);', "`$1// ⛔ DÉSACTIVÉ - Backend non nécessaire pour le moment`n`$1// this.startHealthChecking();`n`$1console.log('ℹ️ TTS Service: Health checking disabled (backend not required)');"
Set-Content $ttsFile -Value $content -Encoding UTF8

# 5. Désactiver health checking dans claraVoiceService
Write-Host "5️⃣ Désactivation du health checking (claraVoiceService)..." -ForegroundColor Green

$content = Get-Content $voiceFile -Raw -Encoding UTF8
$content = $content -replace '(\s+)this\.startHealthChecking\(\);', "`$1// ⛔ DÉSACTIVÉ - Backend non nécessaire pour le moment`n`$1// this.startHealthChecking();`n`$1console.log('ℹ️ Voice Service: Health checking disabled (backend not required)');"
Set-Content $voiceFile -Value $content -Encoding UTF8

Write-Host "`n✅ PATCH APPLIQUÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les modifications dans les fichiers"
Write-Host "   2. npm run build"
Write-Host "   3. Tester avec F5 dans le navigateur"
Write-Host "   4. Vérifier les logs console"
Write-Host "`n💾 Backups créés avec timestamp" -ForegroundColor Yellow
