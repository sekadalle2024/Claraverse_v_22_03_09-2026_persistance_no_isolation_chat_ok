# ⚡ GUIDE RAPIDE - Correction Doublons Tables

## ✅ CE QUI A ÉTÉ FAIT

1. ✅ Ajout fonction nettoyage doublons au démarrage
2. ✅ Désactivation health checks backend (ERR_CONNECTION_REFUSED éliminé)
3. ✅ Backups créés avec timestamp

## ⚠️ CE QU'IL RESTE À FAIRE

### Modification Manuelle dans flowiseTableBridge.ts

**Fichier**: `src/services/flowiseTableBridge.ts`  
**Ligne**: ~1489

**Chercher**:
```typescript
// 🔥 CORRECTION CRITIQUE DOUBLONS
```

**Remplacer le bloc complet par**:
```typescript
      // ANTI-DOUBLON TRIPLE VERIFICATION - 29 aout 2026
      const allTablesWithKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
      const tablesWithId = document.querySelectorAll(`table[data-table-id="${tableData.id}"]`);
      const existingWrappers = document.querySelectorAll(`.restored-table-wrapper[data-table-id="${tableData.id}"]`);
      
      const totalExisting = allTablesWithKeyword.length + tablesWithId.length + existingWrappers.length;
      
      if (totalExisting > 0) {
        console.log(`[ANTI-DOUBLON] Skip "${tableData.keyword}" (ID: ${tableData.id})`);
        console.log(`   Keyword: ${allTablesWithKeyword.length}, ID: ${tablesWithId.length}, Wrappers: ${existingWrappers.length}`);
        
        [...allTablesWithKeyword, ...tablesWithId].forEach(table => {
          if (!table.getAttribute('data-restored')) {
            table.setAttribute('data-skip-restore', 'true');
            table.setAttribute('data-table-id', tableData.id);
          }
        });
        
        return;
      }
      
      console.log(`[VERIFIED] Restoring "${tableData.keyword}" (ID: ${tableData.id})`);
```

## 🚀 APRÈS LA MODIFICATION

```bash
# 1. Build
npm run build

# 2. Tester dans navigateur (F12 pour console)
# Vérifier logs:
# - [CLEANUP] au démarrage
# - [INFO] Health checking disabled
# - [ANTI-DOUBLON] ou [VERIFIED] lors restauration

# 3. Vérifier DOM (dans console):
document.querySelectorAll('table[data-keyword]').length
# Chaque table doit être unique
```

## 🔍 VALIDATION RAPIDE

**Console doit montrer**:
- ✅ `[INFO] Notebook Service: Health checking disabled`
- ✅ `[INFO] TTS Service: Health checking disabled`  
- ✅ `[CLEANUP] Removed X duplicate(s)` OU `No duplicates found`
- ✅ AUCUN `ERR_CONNECTION_REFUSED`

**DOM doit contenir**:
- ✅ Chaque table une seule fois
- ✅ Attributs `data-table-id` et `data-restored` présents
- ✅ Aucun wrapper vide

## 📦 ROLLBACK

```powershell
Copy-Item "h:\Claverse_1\src\services\*.backup-20260904-004919" .
npm run build
```

---

**Fichiers Utiles**:
- `CORRECTIFS_APPLIQUES_29_AOUT_2026.md` - Détails complets
- `RESOLUTION_PROBLEMES_TABLES_29_AOUT_2026.md` - Analyse problèmes
- `PATCH_ANTI_DOUBLONS_29_AOUT_2026.md` - Documentation technique
