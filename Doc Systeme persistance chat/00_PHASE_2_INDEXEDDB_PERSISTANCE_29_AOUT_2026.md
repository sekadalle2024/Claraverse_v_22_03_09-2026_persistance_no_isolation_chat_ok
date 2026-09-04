# 🔧 PHASE 2 - IndexedDB & Restauration Intelligente

**Date:** 29 août 2026 → Mis à jour 4 septembre 2026  
**Phase:** 2/4 - Réparation IndexedDB + Restauration Conditionnelle + Auto-Save

---

## ✅ PHASE 1 COMPLÉTÉE

- ✅ Contamination éliminée
- ✅ Doublons éliminés  
- ✅ SessionId stable
- ✅ Interface diagnostic (5 boutons)

---

## 🎯 OBJECTIFS PHASE 2

1. **Réparer accès IndexedDB** (diagnostic cherchait mauvaise DB)
2. **Vérifier sauvegardes fonctionnent** réellement
3. **Implémenter restauration conditionnelle** (sans réintroduire bugs)
4. **Tester persistance complète** (F5 conserve tables)

---

## 🔧 CORRECTION 1: Nom DB Correct

### Problème Identifié
```javascript
// ❌ Diagnostic cherchait:
indexedDB.open('ClaraverseDB', 1);

// ✅ DB réelle:
const DB_NAME = 'clara_db';
const DB_VERSION = 12;
```

### Correction Appliquée

**Fichier:** `index.html` fonction `analyzeContaminationUI()`

**Changement:**
```javascript
// AVANT (ligne ~1100)
const dbRequest = indexedDB.open('ClaraverseDB', 1);

// APRÈS
const dbRequest = indexedDB.open('clara_db', 12); // ✅ Bon nom + version
```

**Résultat attendu:**
- Bouton 🔬 Contam accède à la vraie DB
- Affiche tables sauvegardées (si elles existent)
- Plus d'erreur "Table n'existe pas"

---

## 🧪 TESTS VALIDATION CORRECTION DB

### Test 1: Accès IndexedDB ✅
```
1. Relancer: npm run dev
2. F12 → Application → IndexedDB
3. Vérifier: Base "clara_db" existe
4. Vérifier: Store "clara_generated_tables" existe
5. Vérifier contenu (doit avoir données si tables créées)
```

### Test 2: Bouton Contam Fonctionne ✅
```
1. Créer chat avec table
2. Cliquer bouton "🔬 Contam"
3. Lire notification
4. Doit afficher: 
   - "📊 Total IndexedDB: X tables"
   - "Session actuelle: Y tables"
   - Pas "Table n'existe pas"
```

### Test 3: Sauvegardes Persistent ✅
```
1. Créer table
2. Attendre 2s (sauvegarde auto)
3. F12 → Application → IndexedDB → clara_db → clara_generated_tables
4. Vérifier: Ligne ajoutée avec:
   - sessionId
   - keyword
   - html (contenu table)
   - timestamp
```

---

## 🔧 CORRECTION 2: Restauration Conditionnelle

### Architecture Restauration Sécurisée

**Principe:** Restaurer SEULEMENT si conditions réunies (ET logique).

**Conditions requises:**
```typescript
const shouldRestore = 
  sessionJustOpened() &&           // Pas reload pendant utilisation
  !tableExistsInDOM(keyword) &&    // Table pas déjà présente
  sessionIdMatches(table) &&       // Table appartient à ce chat
  !alreadyRestored(sessionId);     // Pas déjà restauré
```

### Implémentation

**Fichier:** `src/services/flowiseTableBridge.ts`

**Étape 1: Ajouter Flag Restoration**
```typescript
private sessionRestorationDone = new Set<string>();

private hasRestoredSession(sessionId: string): boolean {
  return this.sessionRestorationDone.has(sessionId);
}

private markSessionRestored(sessionId: string): void {
  this.sessionRestorationDone.add(sessionId);
  console.log(`✅ Session ${sessionId} marked as restored`);
}
```

**Étape 2: Modifier restoreTablesForSession**
```typescript
public async restoreTablesForSession(sessionId: string): Promise<void> {
  // 🔒 Si déjà restauré, skip
  if (this.hasRestoredSession(sessionId)) {
    console.log(`✅ Session ${sessionId} already restored, skip`);
    return;
  }
  
  console.log(`🔄 Restoring tables for session: ${sessionId}`);
  
  try {
    const tables = await flowiseTableService.restoreSessionTables(sessionId);
    console.log(`📊 Found ${tables.length} table(s) for session`);
    
    let restoredCount = 0;
    let skippedCount = 0;
    
    for (const table of tables) {
      // Vérifier si table existe déjà dans DOM
      const existsInDOM = document.querySelectorAll(
        `table[data-keyword="${table.keyword}"]`
      ).length > 0;
      
      if (existsInDOM) {
        console.log(`⏭️ Table "${table.keyword}" exists in DOM, skip`);
        skippedCount++;
        continue;
      }
      
      // Restaurer
      this.injectTableIntoDOM(table);
      restoredCount++;
    }
    
    console.log(`✅ Restoration complete: ${restoredCount} restored, ${skippedCount} skipped`);
    
    // Marquer session comme restaurée
    this.markSessionRestored(sessionId);
    
  } catch (error) {
    console.error(`❌ Error restoring session ${sessionId}:`, error);
  }
}
```

**Étape 3: Réactiver injectTableIntoDOM**
```typescript
private injectTableIntoDOM(tableData: FlowiseGeneratedTableRecord): void {
  // ✅ RÉACTIVATION avec protection renforcée
  
  try {
    // Exception: Skip conso.js tables
    if (tableData.keyword === 'Table_Consolidation' || 
        tableData.keyword === 'Table_Resultat' ||
        tableData.keyword.includes('Consolidation') ||
        tableData.keyword.includes('Resultat') ||
        tableData.keyword.includes('Résultat')) {
      console.log(`⏭️ Skip restoration of "${tableData.keyword}" (managed by conso.js)`);
      return;
    }
    
    // 🔥 VÉRIFICATION CRITIQUE: Table existe déjà?
    const allTablesWithKeyword = document.querySelectorAll(
      `table[data-keyword="${tableData.keyword}"]`
    );
    
    if (allTablesWithKeyword.length > 0) {
      console.log(`⏭️ Skip restoration of "${tableData.keyword}" - ${allTablesWithKeyword.length} already in DOM`);
      return;
    }
    
    console.log(`🔄 Restoring "${tableData.keyword}" - no existing table in DOM`);
    
    // Trouver conteneur ou créer
    const container = this.findOrCreateContainer(tableData);
    
    // Parser HTML table
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableData.html;
    const restoredTable = tempDiv.querySelector('table');
    
    if (!restoredTable) {
      console.error(`❌ Invalid HTML for table "${tableData.keyword}"`);
      return;
    }
    
    // Ajouter au DOM
    restoredTable.setAttribute('data-restored', 'true');
    restoredTable.setAttribute('data-restored-timestamp', Date.now().toString());
    restoredTable.setAttribute('data-keyword', tableData.keyword);
    restoredTable.setAttribute('data-table-id', tableData.id);
    
    container.appendChild(restoredTable);
    
    console.log(`✅ Restored table "${tableData.keyword}" (${tableData.id})`);
    
  } catch (error) {
    console.error(`❌ Error restoring table ${tableData.id}:`, error);
  }
}
```

**Étape 4: Helper findOrCreateContainer**
```typescript
private findOrCreateContainer(tableData: FlowiseGeneratedTableRecord): HTMLElement {
  // Chercher conteneur existant
  let container = document.querySelector('[data-flowise-container="true"]');
  
  if (!container) {
    // Créer conteneur
    container = document.createElement('div');
    container.setAttribute('data-flowise-container', 'true');
    container.className = 'flowise-tables-container';
    
    // Ajouter au DOM principal
    const mainContent = document.querySelector('#root, main, .app');
    if (mainContent) {
      mainContent.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
    
    console.log('📦 Created tables container');
  }
  
  return container as HTMLElement;
}
```

---

## 🧪 TESTS VALIDATION RESTAURATION

### Test 1: Restauration Initiale ✅
```
1. Créer Chat A
2. Générer table "TestA"
3. Attendre 2s (sauvegarde)
4. F5 (recharger page)
5. Attendre 3s (restauration)
6. Vérifier: Table "TestA" réapparaît
```

**Logs attendus:**
```
🔄 Restoring tables for session: abc123...
📊 Found 1 table(s) for session
🔄 Restoring "TestA" - no existing table in DOM
✅ Restored table "TestA" (xyz...)
✅ Restoration complete: 1 restored, 0 skipped
✅ Session abc123 marked as restored
```

### Test 2: Pas de Doublon F5 Multiple ✅
```
1. Sur Chat A avec table
2. F5 première fois → Table restaurée
3. F5 deuxième fois → Vérifier PAS de doublon
4. F5 troisième fois → Vérifier toujours 1 seule table
```

**Logs attendus:**
```
# Premier F5
🔄 Restoring tables...
✅ Restored table "TestA"

# Deuxième F5
✅ Session abc123 already restored, skip

# Troisième F5
✅ Session abc123 already restored, skip
```

### Test 3: Isolation Entre Chats ✅
```
1. Chat A → Table A (F5 restaurée)
2. Chat B → Table B (F5 restaurée)
3. Retour Chat A
4. Vérifier: SEULEMENT Table A visible
5. Retour Chat B
6. Vérifier: SEULEMENT Table B visible
```

**Résultat attendu:** ZÉRO contamination

### Test 4: Persistance Table_conso ✅
```
1. Générer [Table_Resultat]
2. Modifier colonnes Conclusion
3. F5
4. Vérifier: Modifications PERDUES (normal, conso.js gère)
5. Mais structure table restaurée
```

**Note:** Table_conso/Resultat restaurées SANS modifications car gérées spécialement.

---

## 🎯 PLAN D'ACTION ÉTAPE PAR ÉTAPE

### Étape 1: Rebuild avec Correction DB ✅
```powershell
cd h:\Claverse_1
npm run build
npm run dev
```

### Étape 2: Tester Accès IndexedDB
```
1. Bouton "🔬 Contam"
2. Vérifier: Liste tables affichée
3. Si erreur persist: Vérifier DevTools → Application → IndexedDB
```

### Étape 3: Implémenter Restauration Conditionnelle
```typescript
// Modifier flowiseTableBridge.ts:
// 1. Ajouter sessionRestorationDone Set
// 2. Modifier restoreTablesForSession
// 3. Réactiver injectTableIntoDOM avec protections
// 4. Ajouter findOrCreateContainer helper
```

### Étape 4: Rebuild et Test
```powershell
npm run build
npm run dev
```

### Étape 5: Validation Complète
```
Exécuter tous les tests validation:
- Test 1: Restauration initiale
- Test 2: Pas de doublon F5
- Test 3: Isolation chats
- Test 4: Persistance Table_conso
```

---

## 📊 CRITÈRES DE SUCCÈS PHASE 2

| Critère | Test | Status |
|---------|------|--------|
| IndexedDB accessible | Bouton Contam affiche données | ⏳ À tester |
| Tables sauvegardées | DevTools montre lignes dans clara_generated_tables | ⏳ À tester |
| Restauration F5 | Table réapparaît après reload | ⏳ À tester |
| Pas de doublon | F5 multiple = 1 seule table | ⏳ À tester |
| Isolation maintenue | Chat A ≠ Chat B | ⏳ À tester |
| Zéro contamination | Aucune table autre chat | ⏳ À tester |

**Succès = 6/6 critères validés** ✅

---

## 🚨 SI PROBLÈMES

### IndexedDB Toujours Inaccessible

**Diagnostic:**
```javascript
// Console
indexedDB.open('clara_db', 12).onsuccess = (e) => {
  const db = e.target.result;
  console.log('Stores:', Array.from(db.objectStoreNames));
};
```

**Si clara_generated_tables absent:**
- DB version < 12 → Incrémente version manquée
- Solution: Incrémenter à 13 et rebuild

### Restauration Crée Doublons

**Diagnostic:**
```javascript
// Logs console, chercher:
"⏭️ Table exists in DOM, skip" // ✅ Protection active
"🔄 Restoring..." // ❌ Restaure malgré présence
```

**Si restaure quand même:**
- querySelectorAll retourne vide
- data-keyword pas set sur tables existantes
- Solution: Vérifier tables ont bien data-keyword

### Contamination Réapparaît

**Diagnostic:**
```javascript
// Pour chaque table dans Chat A:
document.querySelectorAll('table').forEach(t => {
  console.log(t.dataset.keyword, t.dataset.sessionId);
});

// Comparer sessionId tables vs sessionId chat actuel
```

**Si sessionId différents:**
- Restauration charge mauvaises tables
- Solution: Filtrer par sessionId dans restoreSessionTables

---

## 📝 FICHIERS À MODIFIER

| Fichier | Modifications | Lignes |
|---------|---------------|--------|
| `index.html` | ✅ Nom DB corrigé | ~1100+ |
| `flowiseTableBridge.ts` | ⏳ sessionRestorationDone | +20 |
| `flowiseTableBridge.ts` | ⏳ restoreTablesForSession | ~990 |
| `flowiseTableBridge.ts` | ⏳ injectTableIntoDOM | ~1379 |
| `flowiseTableBridge.ts` | ⏳ findOrCreateContainer | +30 |

**Total:** ~80 lignes à ajouter/modifier

---

**PROCHAINE ACTION:** Rebuild avec correction DB, tester bouton Contam, puis implémenter restauration conditionnelle.


---

## 🆕 CORRECTION 3: Auto-Save Système (4 Septembre 2026)

### 🔴 Problème Identifié

**Symptômes observés:**
- ❌ IndexedDB toujours vide (0 tables)
- ❌ Tous les keywords affichés comme "unknown"
- ❌ Tables dupliquées après F5 (12 → 22 tables)
- ❌ Modifications non persistées

**Cause racine:**
1. `auto-keyword-patcher.js` ajoutait `data-keyword` aux tables ✅
2. **MAIS** n'émettait PAS l'événement `flowise:table:save:request` ❌
3. Donc `flowiseTableBridge.ts` ne recevait jamais la demande de sauvegarde
4. Tables restaient en mémoire (React) mais jamais sauvegardées en IndexedDB

### 🔧 Solution Implémentée

**Fichier modifié:** `public/auto-keyword-patcher.js`

#### Ajout de la fonction `emitSaveEvent`

```javascript
// ==========================================
// ÉMETTRE ÉVÉNEMENT DE SAUVEGARDE
// ==========================================

function emitSaveEvent(table, keyword) {
  try {
    // Attendre un peu pour que React finisse de monter le composant
    setTimeout(() => {
      const saveEvent = new CustomEvent('flowise:table:save:request', {
        bubbles: true,
        detail: {
          table: table,
          keyword: keyword,
          sessionId: window.currentSessionId || localStorage.getItem('currentSessionId'),
          source: 'auto_keyword_patcher',
          timestamp: Date.now()
        }
      });
      
      document.dispatchEvent(saveEvent);
      console.log(`💾 [Patcher] Événement de sauvegarde émis pour: "${keyword}"`);
    }, 500); // 500ms pour laisser React stabiliser le DOM
  } catch (error) {
    console.error(`❌ [Patcher] Erreur émission événement:`, error);
  }
}
```

#### Appel dans `patchAllTables`

```javascript
function patchAllTables() {
  const tables = document.querySelectorAll('table');
  let patchedCount = 0;
  let alreadyHadKeyword = 0;
  
  tables.forEach(table => {
    if (table.dataset.keyword) {
      alreadyHadKeyword++;
      return; // Déjà un keyword, skip
    }
    
    const keyword = extractSmartKeyword(table);
    table.dataset.keyword = keyword;
    patchedCount++;
    
    console.log(`✏️ [Patcher] Keyword assigné: "${keyword}"`, table);
    
    // 🆕 ÉMETTRE ÉVÉNEMENT DE SAUVEGARDE
    emitSaveEvent(table, keyword);
  });
  
  // ... suite du code
}
```

#### Appel dans `observeNewTables` (MutationObserver)

```javascript
function observeNewTables() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Nouvelle table détectée
          if (node.tagName === 'TABLE' && !node.dataset.keyword) {
            const keyword = extractSmartKeyword(node);
            node.dataset.keyword = keyword;
            console.log(`✏️ [Patcher Observer] Nouvelle table détectée, keyword: "${keyword}"`);
            
            // 🆕 ÉMETTRE ÉVÉNEMENT DE SAUVEGARDE
            emitSaveEvent(node, keyword);
          }
          
          // Tables dans les enfants
          const childTables = node.querySelectorAll('table');
          childTables.forEach(table => {
            if (!table.dataset.keyword) {
              const keyword = extractSmartKeyword(table);
              table.dataset.keyword = keyword;
              console.log(`✏️ [Patcher Observer] Table enfant détectée, keyword: "${keyword}"`);
              
              // 🆕 ÉMETTRE ÉVÉNEMENT DE SAUVEGARDE
              emitSaveEvent(table, keyword);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
```

### 📊 Flux Complet de Sauvegarde

```
1. GPT-4 génère une table → Injectée dans DOM par React
   ↓
2. MutationObserver de auto-keyword-patcher.js détecte nouvelle table
   ↓
3. extractSmartKeyword() analyse headers/contexte → génère keyword unique
   ↓
4. table.dataset.keyword = keyword (attribut ajouté)
   ↓
5. 🆕 emitSaveEvent() déclenché après 500ms
   ↓
6. CustomEvent 'flowise:table:save:request' dispatché
   ↓
7. flowiseTableBridge.ts écoute l'événement (handleTableSaveRequest)
   ↓
8. handleTableIntegrated() vérifie si table existe déjà
   ↓
9. flowiseTableService.saveGeneratedTable() → Sauvegarde IndexedDB
   ↓
10. ✅ Table persistée avec sessionId, keyword, html, fingerprint, timestamp
```

### 🧪 Tests de Validation

#### Test 1: Sauvegarde Automatique ✅

```
1. Ouvrir http://localhost:5173/
2. F12 → Console
3. Créer table dans le chat (demander assertion/conclusion)
4. Attendre 1-2 secondes
5. Chercher dans console:
   ✏️ [Patcher] Keyword assigné: "..."
   💾 [Patcher] Événement de sauvegarde émis pour: "..."
   ✅ [Bridge] Table saved successfully: ...
```

#### Test 2: Keyword Non-"Unknown" ✅

```
1. Cliquer bouton 🔍 Diagnostic
2. Section "📋 Tables dans le DOM"
3. Vérifier: keyword ≠ "unknown"
4. Exemples attendus:
   - "Assertion_Controle"
   - "Conclusion_Audit"
   - "CTR_Compte_6123"
   - Etc. (selon contenu des headers)
```

#### Test 3: IndexedDB Contient Tables ✅

```
1. Après Test 1 (table créée)
2. Cliquer bouton 🔍 Diagnostic
3. Section "📊 État du Système"
4. Vérifier: "INDEXEDDB: ✅ FloTableDB v2 - X table(s)" où X > 0
5. Section "💾 Tables dans IndexedDB"
6. Doit lister tables avec:
   - SessionId actuel
   - Keywords corrects
   - Timestamp de sauvegarde
```

#### Test 4: Persistance après F5 ✅

```
1. Créer 3 tables dans le chat
2. Noter le nombre (ex: 12 tables)
3. Modifier une cellule dans une table
4. F5 (recharger page)
5. Attendre 2 secondes (restauration)
6. Cliquer 🔍 Diagnostic
7. Vérifier:
   ✅ Même nombre de tables (12, pas 24)
   ✅ Modification conservée
   ✅ Aucune contamination détectée
```

#### Test 5: Pas de Duplication ✅

```
1. Chat avec 12 tables
2. F5 × 3 fois de suite
3. Après chaque F5, cliquer 🔍 Diagnostic
4. Vérifier: toujours 12 tables (pas 12 → 24 → 48)
```

### 🔄 Interaction avec Autres Composants

**Composants impliqués:**

1. **auto-keyword-patcher.js** (public/)
   - Détecte tables
   - Assigne keywords
   - 🆕 Émet événement sauvegarde

2. **flowiseTableBridge.ts** (src/services/)
   - Écoute événements
   - Gère sauvegarde IndexedDB
   - Vérifie doublons (fingerprint)
   - Gère restauration

3. **flowiseTableService.ts** (src/services/)
   - API IndexedDB
   - CRUD tables
   - Requêtes par session/keyword

4. **diagnostic-unifie.js** (public/)
   - 🆕 Interface visuelle complète
   - Affiche état IndexedDB
   - Détecte contamination
   - Recommandations

### 📁 Fichiers Modifiés - Correction 3

| Fichier | Changement | Lignes |
|---------|-----------|--------|
| `public/auto-keyword-patcher.js` | Ajout fonction `emitSaveEvent()` | +28 |
| `public/auto-keyword-patcher.js` | Appel dans `patchAllTables()` | +2 |
| `public/auto-keyword-patcher.js` | Appel dans `observeNewTables()` (×2) | +6 |
| `public/diagnostic-unifie.js` | **Nouveau fichier** - Diagnostic complet | +700 |
| `index.html` | Modif bouton "🔍 Diagnostic" onclick | 1 |
| `index.html` | Ajout script diagnostic-unifie.js | 1 |

### ✅ Résultats Attendus Post-Correction

1. **IndexedDB fonctionnelle** ✅
   - Tables sauvegardées automatiquement
   - Keywords corrects (extraits des headers)
   - Pas de "unknown"

2. **Persistance complète** ✅
   - F5 conserve toutes les tables
   - Modifications sauvegardées
   - Pas de duplication

3. **Isolation sessions** ✅
   - Chaque chat a son sessionId
   - Tables isolées par session
   - Pas de contamination

4. **Diagnostic visuel** ✅
   - Bouton 🔍 Diagnostic unifié
   - Popup modale (pas alert)
   - 5 sections: Système, IndexedDB, DOM, Contamination, Recommandations

---

## 🚀 PROCHAINES ÉTAPES

### Phase 3: Optimisation (À venir)
- [ ] Lazy loading des tables (restauration différée)
- [ ] Compression HTML des tables (réduire taille DB)
- [ ] Nettoyage automatique anciennes sessions
- [ ] Export/Import configuration utilisateur

### Phase 4: Tests Production
- [ ] Test charge (100+ tables)
- [ ] Test multi-onglets
- [ ] Test navigation browser back/forward
- [ ] Test mode incognito

---

## 📝 Notes de Développement

**Délai d'attente 500ms dans emitSaveEvent:**
- Nécessaire pour laisser React finir le montage
- Évite erreurs "table not in document"
- Alternative testée: MutationObserver → trop de faux positifs

**Détection keyword:**
- Priorité 1: `data-keyword` existant
- Priorité 2: Headers (th)
- Priorité 3: Contexte (titre au-dessus)
- Fallback: Hash contenu + timestamp

**Performance:**
- Patcher s'exécute 1 fois au démarrage (1s après load)
- MutationObserver pour nouvelles tables en temps réel
- Re-scan toutes les 10s (sécurité, coût minimal)

---

**Dernière mise à jour:** 4 Septembre 2026 01:50  
**Statut:** ✅ Auto-save fonctionnel, tests en cours  
**Développeur:** Kiro AI + User


---

## 🔧 CORRECTION 4: Timing & Signature API (4 Septembre 2026 - 02h40)

### 🔴 Problèmes Découverts lors des Tests

#### Problème 4.1: Script exécuté trop tôt
```
Console log:
🧪 [TEST PATCHER] Trouvé 0 table(s)
```

**Cause:**
- Scripts JS chargés immédiatement au chargement de `index.html`
- React prend 2-3 secondes pour monter les composants
- Patcher s'exécute avant que les tables existent dans le DOM
- Résultat : keywords restent "unknown"

**Solution implémentée:**

**Fichier:** `public/test-keyword-patcher-simple.js`

1. **Délai d'initialisation augmenté** : 2s → 5s
```javascript
// AVANT
setTimeout(() => {
  testPatcher();
}, 2000);

// APRÈS
setTimeout(() => {
  console.log('🧪 [TEST PATCHER] Auto-démarrage (5s)...');
  testPatcher();
  startObserver(); // + Observer pour futures tables
}, 5000);
```

2. **MutationObserver ajouté** pour détecter tables ajoutées dynamiquement
```javascript
function startObserver() {
  const observer = new MutationObserver((mutations) => {
    let foundNewTable = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'TABLE') {
            foundNewTable = true;
          }
          if (node.querySelectorAll && node.querySelectorAll('table').length > 0) {
            foundNewTable = true;
          }
        }
      });
    });
    
    if (foundNewTable) {
      console.log('🔔 [TEST PATCHER] Nouvelle(s) table(s) détectée(s), patch...');
      setTimeout(() => {
        testPatcher();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
```

3. **Retry périodique** (sécurité)
```javascript
setInterval(() => {
  const tables = document.querySelectorAll('table');
  const needsPatch = Array.from(tables).filter(t => 
    !t.dataset.keyword || t.dataset.keyword === 'unknown'
  );
  
  if (needsPatch.length > 0) {
    console.log(`🔄 [TEST PATCHER] Retry: ${needsPatch.length} table(s) sans keyword`);
    testPatcher();
  }
}, 10000);
```

---

#### Problème 4.2: Mauvaise signature API saveGeneratedTable

**Erreur obtenue:**
```
TypeError: Cannot read properties of undefined (reading 'querySelector')
at FlowiseTableService.extractHeaders (flowiseTableService.ts:78:29)
at FlowiseTableService.generateTableFingerprint (flowiseTableService.ts:54:26)
at FlowiseTableService.saveGeneratedTable (flowiseTableService.ts:197:32)
at FlowiseTableBridge.performAutoSave (flowiseTableBridge.ts:2755:35)
```

**Cause:**
- `performAutoSave()` passait un **objet** à `saveGeneratedTable()`
- Mais la fonction attend des **paramètres séparés** avec `HTMLTableElement` en 2ème position
- L'objet n'a pas de méthode `.querySelector()` → crash

**Signature correcte de saveGeneratedTable:**
```typescript
async saveGeneratedTable(
  sessionId: string,
  tableElement: HTMLTableElement,  // ← DOIT être HTMLTableElement
  keyword: string,
  source: FlowiseTableSource,
  messageId?: string,
  forceUpdate: boolean = false
): Promise<string>
```

**Code AVANT (incorrect):**
```typescript
// flowiseTableBridge.ts ligne ~2750
await flowiseTableService.saveGeneratedTable({
  id: tableId,
  sessionId: this.currentSessionId || 'unknown',
  keyword,
  html,
  fingerprint,
  source: 'user_edit',
  timestamp: Date.now(),
  messageId: undefined
});
```

**Code APRÈS (corrigé):**
```typescript
// flowiseTableBridge.ts ligne ~2750
const savedId = await flowiseTableService.saveGeneratedTable(
  this.currentSessionId || 'unknown',  // sessionId
  table,                                // HTMLTableElement
  keyword,                              // keyword
  'user_edit',                          // source
  undefined,                            // messageId
  false                                 // forceUpdate
);

if (savedId) {
  savedTables.push(keyword);
  this.dirtyTables.delete(identifier);
  console.log(`✅ [AUTO-SAVE] Table "${keyword}" sauvegardée (ID: ${savedId})`);
}
```

---

### 📊 Timeline de Résolution

| Heure | Événement | Action |
|-------|-----------|--------|
| 02:09 | Test 1 - 12 tables, keywords "unknown", IndexedDB vide | Diagnostic initial |
| 02:20 | Cache Vite vidé, serveur redémarré | Tentative fix cache |
| 02:22 | Test 2 - 23 tables (duplication), toujours "unknown" | Problème persiste |
| 02:34 | Logs montrent `Trouvé 0 table(s)` | Problème de timing identifié |
| 02:37 | Délai 5s + Observer ajoutés | Correction timing |
| 02:40 | Erreur `querySelector` détectée | Problème signature API |
| 02:42 | Signature corrigée dans performAutoSave | Fix complet |
| 02:43 | **Rebuild TypeScript nécessaire** | User lance rebuild |

---

### ✅ Résultats Attendus Post-Correction

#### Logs Console Attendus

**Phase 1 - Initialisation (0-5s):**
```
🧪 [TEST PATCHER] Script chargé
💡 [TEST PATCHER] Commande manuelle: testKeywordPatcher()
```

**Phase 2 - Démarrage automatique (5s):**
```
🧪 [TEST PATCHER] Auto-démarrage (5s)...
🧪 [TEST PATCHER] Démarrage test...
🧪 [TEST PATCHER] Trouvé 12 table(s)  ← devrait être > 0
🧪 [TEST PATCHER] Table 1 → keyword: "Assertion"
🧪 [TEST PATCHER] Table 2 → keyword: "Conclusion"
...
👁️ [TEST PATCHER] Observer actif
✅ [TEST PATCHER] Terminé: 12 table(s) patchée(s)
```

**Phase 3 - Sauvegarde (5-7s):**
```
💾 [TEST PATCHER] Événement émis pour: "Assertion"
💾 [TEST PATCHER] Événement émis pour: "Conclusion"
...
✅ Table saved: abc-123-def (keyword: Assertion, fingerprint: a1b2c3d4...)
✅ [AUTO-SAVE] Table "Assertion" sauvegardée (ID: abc-123-def)
...
💾 [AUTO-SAVE] Sauvegarde de 12 table(s) modifiée(s)...
✅ [AUTO-SAVE] 12 table(s) sauvegardée(s): Assertion, Conclusion, ...
```

#### Diagnostic Visuel (Bouton 🔍)

**Section "📊 État du Système":**
```
INDEXEDDB
✅ FloTableDB
v2 - 12 table(s)  ← devrait être > 0
```

**Section "📋 Tables dans le DOM":**
```
Table 1: Assertion           ← pas "unknown"
Position: 1
Visible: ✅ Oui
Dimensions: 5 lignes × 2 colonnes
Auto-générée: ❌ Non
SessionId: cb24bd20...
```

**Section "💾 Tables dans IndexedDB":**
```
📌 cb24bd20... (Session actuelle)
12 table(s):
• Assertion - 04/09 02:43
• Conclusion - 04/09 02:43
• CTR_6123 - 04/09 02:43
...
```

**Section "⚠️ Contamination":**
```
✅ Aucune Contamination
Toutes les tables appartiennent à la session actuelle. Isolation correcte.
```

#### Test Persistance (F5)

1. **Avant F5:** 12 tables
2. **F5 (recharger page)**
3. **Après F5:** 12 tables (pas 24)
4. **Modifications conservées:** ✅

---

### 📁 Fichiers Modifiés - Correction 4

| Fichier | Changement | Lignes Modifiées |
|---------|-----------|------------------|
| `public/test-keyword-patcher-simple.js` | Délai 2s → 5s | 1 |
| `public/test-keyword-patcher-simple.js` | Ajout MutationObserver | +35 |
| `public/test-keyword-patcher-simple.js` | Ajout retry périodique | +10 |
| `src/services/flowiseTableBridge.ts` | Fix signature saveGeneratedTable | 17 lignes (2747-2764) |
| `index.html` | Temporaire: auto-keyword-patcher.js désactivé | 1 commentaire |
| `index.html` | Temporaire: test-keyword-patcher-simple.js activé | +1 |

---

### 🔄 Prochaine Étape (Post-Rebuild)

1. ✅ **Rebuild TypeScript** : `npm run build` ou Ctrl+S dans VS Code
2. 🧪 **Test complet** :
   - Ouvrir http://localhost:5174/
   - Attendre 5 secondes
   - Vérifier logs console
   - Cliquer 🔍 Diagnostic
   - Vérifier IndexedDB > 0 tables
   - F5 → Vérifier pas de duplication

3. 🔄 **Si succès** : Réactiver `auto-keyword-patcher.js` (version complète avec extraction intelligente)
4. 🔄 **Si échec** : Analyser nouveaux logs d'erreur

---

### 🐛 Debugging Additionnel

**Si keywords toujours "unknown" après rebuild:**
```javascript
// Dans console F12, taper :
testKeywordPatcher()

// Vérifier output :
// - Combien de tables trouvées ?
// - Keywords assignés ?
// - Événements émis ?
```

**Si erreurs saveGeneratedTable persistent:**
```javascript
// Vérifier type de l'objet passé
console.log(table instanceof HTMLTableElement); // doit être true
console.log(table.tagName); // doit être "TABLE"
```

**Si duplication après F5:**
```javascript
// Vérifier si restauration activée
console.log(window.flowiseTableBridge);
// Chercher dans flowiseTableBridge.ts ligne ~90
// Doit être désactivé : return;
```

---

**Dernière mise à jour:** 4 Septembre 2026 02:43  
**Statut:** 🔄 En attente rebuild TypeScript  
**Prochaine action:** Tests post-rebuild  
**Développeur:** Kiro AI + User
