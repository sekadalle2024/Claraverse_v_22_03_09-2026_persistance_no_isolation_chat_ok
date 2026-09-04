# 🔧 Solution : Persistance des Modifications + Suppression Anciennes Tables

## 🎯 PROBLÈME IDENTIFIÉ

**Symptômes** :
1. ✅ Tables se restaurent après F5
2. ❌ **Modifications non persistées** (tables restaurées = état initial)
3. ❌ **Anciennes tables toujours présentes** (coexistent avec restaurées)

---

## 🔍 DIAGNOSTIC

### Flux Actuel (CASSÉ)

```
1. Utilisateur modifie cellule dans table ORIGINALE
   └→ blur event sur cellule
      └→ menu.js: saveCellData()
         └→ syncWithDev()
            └→ window.claraverseSyncAPI.forceSaveTable(table)
               └→ Sauvegarde table ORIGINALE dans IndexedDB

2. F5 (Reload)
   └→ flowiseTableBridge.restoreTablesForSession()
      └→ Crée NOUVELLES tables depuis IndexedDB
         ❌ MAIS: Données IndexedDB = état INITIAL (pas les modifs!)
      
3. Tables ORIGINALES ne sont PAS supprimées
   └→ Coexistence: ORIGINALES (avec modifs) + RESTAURÉES (sans modifs)
```

### Cause Racine

**Problème 1** : Les modifications de cellules ne sont **pas re-sauvegardées** dans IndexedDB
- `menu.js` appelle `window.saveTableNow(table)`
- Mais cette fonction ne met PAS À JOUR IndexedDB avec le nouveau HTML

**Problème 2** : Les anciennes tables ne sont **pas supprimées du DOM**
- `injectTableIntoDOM()` crée de nouvelles tables
- Mais ne supprime pas les anciennes avec même keyword

---

## ✅ SOLUTION PROPOSÉE

### Solution 1 : Forcer Re-Sauvegarde après Modification

**Objectif** : Quand une cellule est modifiée, mettre à jour IndexedDB avec le nouveau HTML

**Fichier** : `public/menu.js` ligne ~1188

**Modification** :

```javascript
saveCellData(cell) {
  const table = cell.closest("table");
  if (table) {
    this.targetTable = table;
    this.notifyTableStructureChange("cell_edited", { cellContent: cell.textContent });
    
    // 🔥 AJOUT: Forcer re-sauvegarde dans IndexedDB avec HTML mis à jour
    this.forceSaveTableToIndexedDB(table);
    
    this.syncWithDev();
  }
}

// 🔥 NOUVELLE MÉTHODE
forceSaveTableToIndexedDB(table) {
  try {
    const keyword = table.dataset.keyword;
    const tableId = table.dataset.tableId;
    const sessionId = document.querySelector('[data-session-id]')?.getAttribute('data-session-id');
    
    if (!keyword || !sessionId) {
      console.warn('[SAVE] Missing keyword or sessionId, cannot update IndexedDB');
      return;
    }
    
    // Émettre événement pour que flowiseTableBridge mette à jour
    const event = new CustomEvent('flowise:table:save:request', {
      detail: {
        table: table,
        keyword: keyword,
        tableId: tableId,
        sessionId: sessionId,
        source: 'menu-edit',
        forceUpdate: true  // Force la mise à jour même si existe déjà
      }
    });
    
    document.dispatchEvent(event);
    console.log(`[SAVE] Table modification saved: ${keyword}`);
    
  } catch (error) {
    console.error('[SAVE] Error saving table modification:', error);
  }
}
```

---

### Solution 2 : Supprimer Anciennes Tables Physiquement

**Objectif** : Avant d'injecter une table restaurée, supprimer TOUTES les instances existantes

**Fichier** : `src/services/flowiseTableBridge.ts` ligne ~1537

**Modification** (ajouter AVANT la vérification anti-doublon) :

```typescript
private injectTableIntoDOM(tableData: FlowiseGeneratedTableRecord): void {
  try {
    // Exceptions (conso.js)
    if (tableData.keyword === 'Table_Consolidation' || 
        tableData.keyword === 'Table_Resultat' ||
        tableData.keyword.includes('Consolidation') ||
        tableData.keyword.includes('Resultat') ||
        tableData.keyword.includes('Résultat')) {
      console.log(`⏭️ Skip restoration of "${tableData.keyword}" (managed by conso.js)`);
      return;
    }
    
    // 🔥 NOUVELLE ÉTAPE 1: SUPPRESSION PHYSIQUE des anciennes tables
    const existingTablesKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
    const existingTablesId = document.querySelectorAll(`table[data-table-id="${tableData.id}"]`);
    const existingWrappers = document.querySelectorAll(`.restored-table-wrapper[data-table-id="${tableData.id}"]`);
    
    let removedCount = 0;
    
    // Supprimer par keyword
    existingTablesKeyword.forEach(table => {
      const wrapper = table.closest('.restored-table-wrapper');
      if (wrapper) {
        wrapper.remove();
      } else {
        table.remove();
      }
      removedCount++;
      console.log(`[DELETE-OLD] Removed table by keyword: ${tableData.keyword}`);
    });
    
    // Supprimer par ID
    existingTablesId.forEach(table => {
      if (!table.parentElement) return; // Déjà supprimée
      const wrapper = table.closest('.restored-table-wrapper');
      if (wrapper) {
        wrapper.remove();
      } else {
        table.remove();
      }
      removedCount++;
      console.log(`[DELETE-OLD] Removed table by ID: ${tableData.id}`);
    });
    
    // Supprimer wrappers orphelins
    existingWrappers.forEach(wrapper => {
      if (wrapper.parentElement) {
        wrapper.remove();
        removedCount++;
        console.log(`[DELETE-OLD] Removed orphan wrapper: ${tableData.id}`);
      }
    });
    
    if (removedCount > 0) {
      console.log(`[DELETE-OLD] Total removed: ${removedCount} element(s) for "${tableData.keyword}"`);
    }
    
    // 🔥 ÉTAPE 2: Vérification (devrait être 0 maintenant)
    const allTablesWithKeyword = document.querySelectorAll(`table[data-keyword="${tableData.keyword}"]`);
    const tablesWithId = document.querySelectorAll(`table[data-table-id="${tableData.id}"]`);
    const remainingWrappers = document.querySelectorAll(`.restored-table-wrapper[data-table-id="${tableData.id}"]`);
    
    const totalExisting = allTablesWithKeyword.length + tablesWithId.length + remainingWrappers.length;
    
    if (totalExisting > 0) {
      console.warn(`[WARN] ${totalExisting} element(s) still exist after deletion attempt`);
      console.warn(`   Keyword: ${allTablesWithKeyword.length}, ID: ${tablesWithId.length}, Wrappers: ${remainingWrappers.length}`);
      // Ne pas retourner, continuer quand même la restauration
    }
    
    // 🔥 ÉTAPE 3: Restauration (code existant)
    console.log(`[VERIFIED] Restoring "${tableData.keyword}" (ID: ${tableData.id}) after cleanup`);
    
    // ... reste du code d'injection ...
```

---

### Solution 3 : Gérer Événement de Sauvegarde

**Objectif** : Écouter l'événement `flowise:table:save:request` et mettre à jour IndexedDB

**Fichier** : `src/services/flowiseTableBridge.ts` (dans `initializeEventListeners()`)

**Ajout** :

```typescript
private initializeEventListeners(): void {
  // Nettoyage initial
  this.cleanupDuplicateTablesOnStartup();
  
  // Événements existants
  window.addEventListener('flowise-table-integrated', (event) => {
    this.handleFlowiseTableIntegrated(event);
  });
  
  window.addEventListener('flowise-table-save-request', (event) => {
    this.handleTableSaveRequest(event);
  });
  
  // 🔥 NOUVEAU: Écouter les demandes de sauvegarde depuis menu.js
  document.addEventListener('flowise:table:save:request', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { table, keyword, sessionId, forceUpdate } = customEvent.detail;
    
    if (!table || !keyword || !sessionId) {
      console.error('[SAVE] Missing required fields in save request');
      return;
    }
    
    try {
      console.log(`[SAVE] Updating table in IndexedDB: ${keyword}`);
      
      // Extraire HTML actuel de la table
      const tableHTML = table.outerHTML;
      
      // Trouver l'enregistrement existant
      const existingTables = await flowiseTableService.getTablesForSession(sessionId);
      const existingTable = existingTables.find(t => t.keyword === keyword);
      
      if (existingTable) {
        // Mettre à jour avec le nouveau HTML
        existingTable.html = tableHTML;
        existingTable.updatedAt = Date.now();
        
        // Sauvegarder dans IndexedDB
        await flowiseTableService.updateGeneratedTable(existingTable.id, {
          html: tableHTML,
          updatedAt: Date.now()
        });
        
        console.log(`[SAVE] ✅ Table updated in IndexedDB: ${keyword} (ID: ${existingTable.id})`);
      } else {
        console.warn(`[SAVE] Table not found in IndexedDB: ${keyword}`);
      }
      
    } catch (error) {
      console.error(`[SAVE] Error updating table in IndexedDB:`, error);
    }
  });
  
  // ... reste des événements ...
}
```

---

## 🧪 TESTS DE VALIDATION

### Test 1 : Modification Persistée

**Procédure** :
1. Générer une table Balance
2. Modifier une cellule (ex: "1000" → "2000")
3. Vérifier console :
   ```
   [SAVE] Table modification saved: Table_Balance
   [SAVE] ✅ Table updated in IndexedDB: Table_Balance
   ```
4. F5 (recharger)
5. Vérifier que la modification apparaît dans la table restaurée

✅ **Attendu** : Valeur "2000" visible après F5

---

### Test 2 : Suppression Anciennes Tables

**Procédure** :
1. Générer une table
2. F5
3. Vérifier console :
   ```
   [DELETE-OLD] Removed table by keyword: Table_Balance
   [DELETE-OLD] Total removed: 1 element(s)
   [VERIFIED] Restoring "Table_Balance" after cleanup
   ```
4. Inspecter DOM :
   ```javascript
   document.querySelectorAll('table[data-keyword="Table_Balance"]').length
   // Doit retourner 1
   ```

✅ **Attendu** : Une seule table dans le DOM

---

### Test 3 : Flux Complet

**Procédure** :
1. Générer table Balance
2. Modifier cellule : "1000" → "2000"
3. F5
4. Vérifier : table restaurée avec "2000"
5. Modifier cellule : "2000" → "3000"
6. F5
7. Vérifier : table restaurée avec "3000"

✅ **Attendu** : Chaque modification est persistée

---

## 📊 COMPARAISON AVANT/APRÈS

### AVANT

```
Génération → Table A (DOM)
Modification → Table A modifiée (DOM uniquement)
F5 → Table B restaurée (état initial) + Table A reste
Résultat : 2 tables, modifications perdues
```

### APRÈS

```
Génération → Table A (DOM + IndexedDB)
Modification → Table A modifiée (DOM) → Update IndexedDB
F5 → Suppression Table A → Table B restaurée (avec modifs)
Résultat : 1 table, modifications persistées
```

---

## 🚀 ORDRE D'APPLICATION

1. **Solution 2** : Suppression physique (flowiseTableBridge.ts)
2. **Solution 3** : Gestionnaire événement (flowiseTableBridge.ts)
3. **Solution 1** : Force sauvegarde (menu.js)
4. **Build** : `npm run build`
5. **Tests** : Valider les 3 tests ci-dessus

---

## 💡 ALTERNATIVE : Approche Pure DOM

Si les solutions ci-dessus sont complexes, voici une approche plus simple :

**Script à ajouter dans `index.html`** :

```html
<script>
// Suppression agressive des anciennes tables avant restauration
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Attendre que les tables soient générées
    const tables = document.querySelectorAll('table[data-keyword]');
    const keywords = new Map();
    
    tables.forEach(table => {
      const keyword = table.dataset.keyword;
      if (!keyword) return;
      
      if (keywords.has(keyword)) {
        // C'est un doublon, supprimer
        const wrapper = table.closest('.restored-table-wrapper');
        if (wrapper) wrapper.remove();
        else table.remove();
        console.log(`[DOM-CLEANUP] Removed duplicate: ${keyword}`);
      } else {
        keywords.set(keyword, table);
      }
    });
  }, 2000); // Après restauration
});
</script>
```

---

**Quelle approche préférez-vous ?**
1. Solutions complètes (1 + 2 + 3)
2. Approche DOM simple (script HTML)
3. Mix des deux

Je peux appliquer celle que vous choisissez ! 🚀
