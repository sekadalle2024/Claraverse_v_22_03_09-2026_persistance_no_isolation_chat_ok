# 🔍 Guide Diagnostic - Persistance des Modifications

## 🎯 Objectif

Diagnostiquer pourquoi les modifications ne sont pas persistées et pourquoi les anciennes tables ne sont pas supprimées.

---

## 🚀 ÉTAPE 1 : Lancer l'Application

```bash
npm run build
npm run dev
```

Ouvrir http://localhost:5173

---

## 🔍 ÉTAPE 2 : Exécuter le Diagnostic

### Dans la console navigateur (F12) :

```javascript
// Diagnostic complet
runFullDiagnostic()
```

**Résultat attendu** :
```
🔍 ============================================
🔍 DIAGNOSTIC COMPLET - PERSISTANCE MODIFS
🔍 ============================================

📊 === ANALYSE DOM ===
Total tables avec data-keyword: 2

📋 Tables par keyword:
  "Table_Balance": 1 instance(s)
    [0] ID: table_balance_xxx
        Restored: false, Wrapper: false
        First cell: "1000"
        
💾 === ANALYSE INDEXEDDB ===
Total tables en DB: 2
...
```

---

## 🧪 ÉTAPE 3 : Tester la Modification

### Test Manuel :

1. **Générer une table** (ex: "Affiche Balance")
2. **Vérifier dans console** :
   ```javascript
   checkDOMTables()
   ```
   Noter la valeur de la première cellule
   
3. **Modifier une cellule** : Double-clic, changer valeur, cliquer ailleurs
4. **Observer les logs** :
   ```
   📝 [MODIF] Cell edited in "Table_Balance": "2000"
   💾 [EVENT] claraverse:table:updated { ... }
   ```
   
5. **Vérifier si sauvegardé** :
   ```javascript
   await checkIndexedDBTables()
   ```
   Chercher la table modifiée, voir si le HTML contient "2000"

6. **F5 (Recharger)**

7. **Comparer** :
   ```javascript
   await compareDOMvsDB()
   ```
   
**Résultat attendu** :
```
  Keyword: "Table_Balance"
    Première cellule:
      DOM: "2000"
      DB:  "1000"
    ⚠️ DIFFÉRENCE DÉTECTÉE! Modifications non persistées?
```

---

## 📊 ÉTAPE 4 : Analyser les Résultats

### Scénario 1 : Modifications NON sauvegardées

**Symptôme** :
```
📝 [MODIF] Cell edited in "Table_Balance": "2000"
(PAS de log [EVENT] ou de sauvegarde)
```

**Cause probable** : `menu.js` n'émet pas l'événement de sauvegarde

**Solution** : Appliquer **Solution 1** (forceSaveTableToIndexedDB)

---

### Scénario 2 : Modifications sauvegardées MAIS pas en IndexedDB

**Symptôme** :
```
📝 [MODIF] Cell edited
💾 [EVENT] claraverse:table:updated
(Mais IndexedDB montre ancienne valeur)
```

**Cause probable** : Événement émis mais pas écouté par `flowiseTableBridge`

**Solution** : Appliquer **Solution 3** (gestionnaire d'événement)

---

### Scénario 3 : Tables en double dans DOM

**Symptôme** :
```
📋 Tables par keyword:
  "Table_Balance": 2 instance(s)
```

**Cause probable** : Suppression physique pas effectuée

**Solution** : Appliquer **Solution 2** (suppression physique)

---

## 🔧 ÉTAPE 5 : Appliquer les Solutions

Selon le diagnostic, choisir la solution appropriée dans `SOLUTION_PERSISTANCE_MODIFICATIONS.md`

### Solutions Disponibles :

1. **Solution 1** : Force re-sauvegarde (menu.js)
2. **Solution 2** : Suppression physique (flowiseTableBridge.ts)
3. **Solution 3** : Gestionnaire événement (flowiseTableBridge.ts)
4. **Alternative** : Script DOM simple (index.html)

---

## 📝 COMMANDES UTILES

### Diagnostic :
```javascript
runFullDiagnostic()           // Diagnostic complet
checkDOMTables()              // Voir tables DOM
await checkIndexedDBTables()  // Voir tables DB
await compareDOMvsDB()        // Comparer
showModificationsLog()        // Voir log modifs
```

### Nettoyage manuel :
```javascript
// Supprimer doublons dans DOM
const tables = document.querySelectorAll('table[data-keyword]');
const keywords = new Set();
tables.forEach(t => {
  const k = t.dataset.keyword;
  if (keywords.has(k)) t.remove();
  else keywords.set(k, t);
});
```

### Forcer sauvegarde :
```javascript
// Forcer sauvegarde d'une table
const table = document.querySelector('table[data-keyword="Table_Balance"]');
const event = new CustomEvent('flowise:table:save:request', {
  detail: {
    table: table,
    keyword: table.dataset.keyword,
    sessionId: document.querySelector('[data-session-id]').getAttribute('data-session-id'),
    forceUpdate: true
  }
});
document.dispatchEvent(event);
```

---

## ✅ CHECKLIST DE VALIDATION

Après application des solutions :

- [ ] Modification de cellule sauvegardée (logs `[SAVE]`)
- [ ] IndexedDB mis à jour avec nouveau HTML
- [ ] F5 : table restaurée avec modification
- [ ] F5 : anciennes tables supprimées (1 seule instance dans DOM)
- [ ] `compareDOMvsDB()` montre "✅ Identiques"
- [ ] Aucun doublon détecté

---

## 🎯 RÉSULTAT ATTENDU

```javascript
// Après modification et F5
await compareDOMvsDB()

// Output:
  Keyword: "Table_Balance"
    DOM: 1 instance(s)
    DB:  1 enregistrement
    Première cellule:
      DOM: "2000"
      DB:  "2000"
    ✅ Identiques
```

---

**Fichiers de référence** :
- 📄 `SOLUTION_PERSISTANCE_MODIFICATIONS.md` - Solutions détaillées
- 🔧 `public/diagnostic-persistance-modifs.js` - Script diagnostic
- 📋 Ce guide

**Prochaine étape** : Exécuter `runFullDiagnostic()` et analyser ! 🚀
