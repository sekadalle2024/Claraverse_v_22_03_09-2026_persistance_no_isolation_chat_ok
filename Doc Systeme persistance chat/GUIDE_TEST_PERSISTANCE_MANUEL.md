# 📋 GUIDE DE TEST PERSISTANCE MANUEL

**Date** : 3 septembre 2026  
**Objectif** : Tester la persistance des tables auto-générées (Table_Conso, Table_Résultat)  
**Durée** : 5 minutes

---

## 🎯 OBJECTIF

Vérifier que les tables générées par `conso.js` sont **sauvegardées dans IndexedDB** et **réapparaissent après F5**.

---

## 📋 PRÉREQUIS

1. ✅ Serveur dev actif : http://localhost:5174/
2. ✅ Navigateur : Chrome/Edge (DevTools F12)
3. ✅ Cache vidé (Ctrl + Shift + Delete)

---

## 🧪 PROCÉDURE DE TEST

### ÉTAPE 1 : Préparer l'environnement

1. **Ouvrir http://localhost:5174/**
2. **Ouvrir DevTools (F12)** → Onglet **Console**
3. **Vider IndexedDB** :
   - Onglet **Application** → **Storage** → **IndexedDB**
   - Clic droit sur **FloTableDB** → **Delete database**
   - Ou taper dans Console : `window.reinitIndexedDB()`
4. **Rafraîchir** : **Ctrl + F5**

---

### ÉTAPE 2 : Générer une table

1. **Dans le chat Clara**, taper :
   ```
   Crée une table avec colonnes: Assertion, Conclusion, CTR
   Et 2 lignes de données
   ```

2. **Attendre** que Clara génère la table

3. **Vérifier présence de 2-3 tables** dans l'interface :
   - Table **modélisée** (colonnes Assertion/Conclusion/CTR) ✅
   - **Table_Conso** (en dessous, tableau de consolidation) ✅
   - **Table_Résultat** (modifiée avec résultats) ✅

4. **Si seulement 1 table visible** : Problème génération `conso.js`

---

### ÉTAPE 3 : Vérifier sauvegarde dans IndexedDB

1. **Dans Console F12**, taper :
   ```javascript
   // Ouvrir IndexedDB
   const request = indexedDB.open('FloTableDB');
   request.onsuccess = () => {
     const db = request.result;
     const tx = db.transaction(['generatedTables'], 'readonly');
     const store = tx.objectStore('generatedTables');
     store.getAll().onsuccess = (e) => {
       console.log('📦 Tables en DB:', e.target.result.length);
       e.target.result.forEach(t => {
         console.log(`  - ${t.keyword} (session: ${t.sessionId.substring(0,20)}...)`);
       });
       db.close();
     };
   };
   ```

2. **Résultat attendu** :
   ```
   📦 Tables en DB: 2-3
     - Table_Consolidation (session: clara-session-...)
     - Table_Resultat (session: clara-session-...)
     - [Table modélisée] (session: clara-session-...)
   ```

3. **Si 0 tables** : ❌ **Sauvegarde échoue** (problème critique)

4. **Si 2-3 tables** : ✅ **Sauvegarde fonctionne** (passer à Étape 4)

---

### ÉTAPE 4 : Tester restauration après reload

1. **Appuyer F5** (recharger page)

2. **Attendre 5 secondes** (le temps de la restauration)

3. **Vérifier présence tables dans l'interface** :
   - ✅ **Tables réapparaissent** avec données → **SUCCÈS** 🎉
   - ❌ **Aucune table** → **Problème restauration**
   - ⚠️ **Tables vides** → **Problème HTML restauré**

4. **Cas particuliers** :
   - Si **tables apparaissent puis disparaissent** : Conflit contamination (mémo existant)
   - Si **tables dupliquées** : Problème doublons (mémo existant)

---

## 📊 INTERPRÉTATION RÉSULTATS

### ✅ SUCCÈS COMPLET (Persistance fonctionne)

```
Étape 2: ✅ Tables générées (2-3 visibles)
Étape 3: ✅ 2-3 tables en IndexedDB
Étape 4: ✅ Tables réapparaissent après F5
```

**Conclusion** : Système de persistance **fonctionnel** ✅

**Prochaines étapes** :
- Résoudre contamination (mémo existant)
- Résoudre doublons (mémo existant)

---

### ⚠️ SUCCÈS PARTIEL (Sauvegarde OK, Restauration KO)

```
Étape 2: ✅ Tables générées
Étape 3: ✅ 2-3 tables en IndexedDB
Étape 4: ❌ Aucune table après F5
```

**Conclusion** : Sauvegarde fonctionne, **restauration échoue** ⚠️

**Problème probable** :
- Flag `DISABLE_TABLE_RESTORATION = true` actif
- `single-restore-on-load.js` pas exécuté
- Erreur JavaScript bloque restauration

**Action** :
1. Vérifier dans Console F12 après F5 :
   ```
   🔄 [Restore] Starting restoration...
   ```
2. Si absent : Script restauration pas chargé
3. Si présent avec erreur : Corriger erreur affichée

---

### ❌ ÉCHEC (Sauvegarde échoue)

```
Étape 2: ✅ Tables générées
Étape 3: ❌ 0 tables en IndexedDB
Étape 4: ❌ Aucune table après F5
```

**Conclusion** : **Sauvegarde ne fonctionne pas** ❌

**Problème probable** :
- `flowiseTableBridge` pas initialisé
- Événement `flowise:table:save:request` pas écouté
- IndexedDB en lecture seule
- SessionId manquant

**Action** :
1. Vérifier logs Console après génération table :
   ```
   ✅ [INLINE] Événement émis pour: Table_Consolidation
   🚨 [DIAGNOSTIC] Événement save:request reçu...
   ✅ Table saved successfully: ...
   ```
2. Si logs absents : Bridge pas initialisé (problème TypeScript)
3. Si erreur : Corriger erreur affichée

---

## 🔍 LOGS À SURVEILLER

### Au chargement page

```
🔧 [Init IndexedDB] Démarrage...
✅ [Init IndexedDB] Initialisation terminée
🔒 RESTORE LOCK MANAGER - Initialisation
✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false
✅ [INLINE] ISOLATION ACTIVE - SessionId unique par chat
```

### Après génération table

```
🔑 [INLINE] Keyword: Table_Consolidation
📍 [INLINE] SessionId: clara-session-...
✅ [INLINE] Événement émis pour: Table_Consolidation (forceUpdate=true)
🚨 [DIAGNOSTIC] Événement save:request reçu via conso.js...
🔄 [Bridge] ForceUpdate actif, mise à jour forcée: "Table_Consolidation"
✅ [Bridge] Table forcée à jour: xxx
✅ Table saved successfully: xxx
```

### Après F5 (restauration)

```
🔄 [Restore] Starting restoration for session: clara-session-...
✅ [Restore] Found 2 tables to restore
✅ [Restore] Table restored: Table_Consolidation
✅ [Restore] Table restored: Table_Resultat
✅ [Restore] Restoration completed successfully
```

---

## 🛠️ COMMANDES UTILES (Console F12)

### Vider IndexedDB
```javascript
window.reinitIndexedDB()
```

### Lister tables en DB
```javascript
const request = indexedDB.open('FloTableDB');
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction(['generatedTables'], 'readonly');
  const store = tx.objectStore('generatedTables');
  store.getAll().onsuccess = (e) => {
    console.table(e.target.result.map(t => ({
      keyword: t.keyword,
      sessionId: t.sessionId.substring(0,20)+'...',
      timestamp: new Date(t.timestamp).toLocaleTimeString()
    })));
    db.close();
  };
};
```

### Forcer sauvegarde manuelle
```javascript
const table = document.querySelector('.claraverse-conso-table');
if (table) {
  const event = new CustomEvent('flowise:table:save:request', {
    detail: {
      table: table,
      sessionId: document.querySelector('[data-session-id]').dataset.sessionId,
      keyword: 'Table_Consolidation',
      source: 'manual',
      forceUpdate: true
    },
    bubbles: true
  });
  document.dispatchEvent(event);
  console.log('✅ Événement sauvegarde émis');
}
```

### Vérifier SessionId
```javascript
const sessionId = document.querySelector('[data-session-id]')?.dataset.sessionId;
console.log('SessionId:', sessionId || 'MANQUANT');
```

---

## 📞 CONTACT / SUPPORT

**Développeur** : Kiro AI  
**Date création** : 3 septembre 2026  
**Dernière mise à jour** : 3 septembre 2026

**Mémos connexes** :
- `00_PLAN_IMPLEMENTATION_SYSTEME_ARCHITECTURE_PERSISTANCE_FONCTIONNEL.md`
- `Doc visibilité bouton de test en front end/`
- `00_AIDE_MEMOIRE_LOGS.md`

---

**FIN DU GUIDE**
