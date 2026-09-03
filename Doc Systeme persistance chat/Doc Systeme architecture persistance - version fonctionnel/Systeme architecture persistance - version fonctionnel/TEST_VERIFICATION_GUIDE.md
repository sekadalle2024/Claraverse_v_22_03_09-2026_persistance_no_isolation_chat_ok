# Guide de Test et Vérification - Système de Persistance Tables ClaraVerse

**Date:** 28 août 2026  
**Version:** 1.0  
**Statut:** ✅ IMPLÉMENTATION COMPLÈTE - PRÊT POUR LES TESTS

---

## 📋 Résumé des Modifications Implémentées

### ✅ Tâche 1: Protection Temporelle (Timestamp Protection)
- **Fichier:** `src/services/flowiseTableBridge.ts` (ligne 1265)
- **Protection:** PROTECTION_WINDOW_MS = 5000ms (5 secondes)
- **Attributs ajoutés:** `data-timestamp`, `data-created-at`
- **Mécanisme:** Les tables < 5 secondes sont protégées du cleanup

### ✅ Tâche 2: Ordre des Tables Corrigé
- **Fichier:** `public/conso.js`
- **Fonction:** `insertConsoTable()` simplifiée (ligne 912)
- **Fonction:** `repositionResultatTable()` ajoutée (ligne 1875)
- **Ordre garanti:** Conso → Résultat → Modelised

### ✅ Tâche 3: Attributs de Position
- **Fichier:** `public/conso.js`
- **Attribut:** `data-table-position='1'` (Conso, ligne 875)
- **Attribut:** `data-table-position='2'` (Résultat, lignes 1602, 1633)
- **Attribut:** `data-table-position='3'` (Modelised, ligne 264)
- **Fichier:** `src/services/flowiseTableService.ts` (ligne 1276)
- **Mécanisme:** Priorité à l'attribut explicite sur l'ordre DOM

### ✅ Tâche 4: Détection de Changement de Chat
- **Fichier:** `public/auto-restore-chat-change.js`
- **Fonction:** `detectChatId()` (ligne 15)
- **Fonction:** `onChatChanged()` (ligne 65)
- **Fonction:** `monitorChatChanges()` (ligne 103)
- **Format sessionId:** `chat_{chatId}_{timestamp}`

### ✅ Tâche 5: Synchronisation des Sessions
- **Fichier:** `public/conso-indexeddb-bridge.js`
- **Événement écouté:** `claraverse:session:changed` (ligne 324)
- **Cache sessionId:** `currentBridgeSessionId` (ligne 320)
- **Synchronisation:** sessionStorage + cache interne

### ✅ Tâche 6: Timestamps de Création
- **Fichier:** `public/conso.js`
- **Attribut:** `data-created-timestamp` sur toutes les tables
- **Format:** Millisecondes depuis epoch (Date.now())
- **Protection additionnelle:** Complète data-timestamp de Flowise.js

---

## 🧪 Tests à Effectuer

### Test 1: Ordre des Tables ✓

**Objectif:** Vérifier que les tables apparaissent dans le bon ordre après consolidation

**Procédure:**
1. Ouvrir un chat dans ClaraVerse
2. Générer une table Modelised avec colonnes: Assertion, Conclusion, Ctr
3. Effectuer une consolidation (modifier des cellules)
4. Observer l'ordre des tables dans le DOM

**Résultat Attendu:**
```
📊 Table de Consolidation (Table_conso)
     ↓
📋 Table Résultat
     ↓
📑 Table Modélisée (Modelised_table)
```

**Vérification Console:**
```javascript
// Dans la console du navigateur
const tables = document.querySelectorAll('table');
Array.from(tables).forEach((t, i) => {
  const position = t.dataset.tablePosition;
  const type = t.classList.contains('claraverse-conso-table') ? 'Conso' :
               t.dataset.tablePosition === '2' ? 'Résultat' :
               t.dataset.tablePosition === '3' ? 'Modelised' : 'Autre';
  console.log(`${i}: Position=${position}, Type=${type}`);
});
```

**Critères de Succès:**
- [ ] Table_conso (position=1) apparaît en premier
- [ ] Table Résultat (position=2) apparaît au milieu
- [ ] Modelised_table (position=3) apparaît en dernier
- [ ] Pas de tables dupliquées
- [ ] Ordre maintenu après rechargement (Test 2)

---

### Test 2: Persistance Simple ✓

**Objectif:** Vérifier que les tables conservent leurs données après rechargement

**Procédure:**
1. Partir du résultat du Test 1 (3 tables dans le bon ordre)
2. Modifier des cellules dans chaque table:
   - Table_conso: Modifier le contenu de consolidation
   - Table Résultat: Modifier une cellule de résultat
   - Modelised: Modifier une assertion ou conclusion
3. Recharger la page (F5)
4. Observer les tables restaurées

**Résultat Attendu:**
- Toutes les 3 tables sont restaurées
- Les modifications sont préservées
- L'ordre est maintenu: Conso → Résultat → Modelised

**Vérification Console:**
```javascript
// Vérifier les tables restaurées
const restored = document.querySelectorAll('[data-restored="true"]');
console.log(`Tables restaurées: ${restored.length}`);

// Vérifier l'ordre
const positions = Array.from(document.querySelectorAll('table[data-table-position]'))
  .map(t => parseInt(t.dataset.tablePosition))
  .sort((a, b) => a - b);
console.log('Positions:', positions); // Devrait être [1, 2, 3]
```

**Vérification IndexedDB:**
```javascript
// Ouvrir DevTools → Application → IndexedDB → clara_db → clara_generated_tables
// Vérifier que les 3 tables sont enregistrées avec:
// - Même sessionId
// - position: 1, 2, 3
// - Données modifiées présentes dans le HTML
```

**Critères de Succès:**
- [ ] 3 tables restaurées (pas plus, pas moins)
- [ ] Ordre correct maintenu
- [ ] Modifications conservées dans chaque table
- [ ] Pas de tables vides restaurées
- [ ] sessionId cohérent pour toutes les tables

---

### Test 3: Isolation Inter-Chats ✓

**Objectif:** Vérifier que les tables d'un chat ne contaminent pas un autre chat

**Procédure:**

**3.1. Chat A - Création**
1. Ouvrir Chat A (ou créer un nouveau chat)
2. Générer une table Modelised avec contenu spécifique (ex: "Assertion Chat A")
3. Effectuer consolidation
4. Modifier des cellules pour identifier le chat (ex: "Données Chat A")
5. Noter le sessionId:
   ```javascript
   console.log('Session Chat A:', sessionStorage.getItem('claraverse_stable_session'));
   ```

**3.2. Chat B - Création**
6. Ouvrir Chat B (nouveau chat différent)
7. Vérifier dans la console que le sessionId a changé:
   ```javascript
   console.log('Session Chat B:', sessionStorage.getItem('claraverse_stable_session'));
   // Devrait être différent de Chat A
   ```
8. Vérifier qu'aucune table du Chat A n'est présente
9. Générer une nouvelle table Modelised avec contenu différent (ex: "Assertion Chat B")
10. Effectuer consolidation avec données différentes (ex: "Données Chat B")

**3.3. Chat A - Retour**
11. Retourner au Chat A (via historique ou liste des chats)
12. Vérifier la restauration:
    ```javascript
    // Vérifier le sessionId restauré
    console.log('Session restaurée:', sessionStorage.getItem('claraverse_stable_session'));
    // Devrait correspondre au Chat A original
    
    // Vérifier le contenu
    const tables = document.querySelectorAll('table');
    Array.from(tables).forEach(t => {
      console.log('Contenu:', t.textContent.substring(0, 100));
    });
    ```

**Résultat Attendu:**
- Chat A a son propre sessionId unique
- Chat B a un sessionId différent
- Retour au Chat A restaure uniquement les tables du Chat A
- Aucune contamination: données du Chat B n'apparaissent pas dans Chat A

**Vérification IndexedDB:**
```javascript
// Dans la console, vérifier les sessions enregistrées
// Application → IndexedDB → clara_db → clara_generated_tables
// Filtrer par sessionId:
// - Tables du Chat A ont toutes le même sessionId
// - Tables du Chat B ont toutes un sessionId différent
// - Pas de mélange entre les deux
```

**Critères de Succès:**
- [ ] Chat A et Chat B ont des sessionId différents
- [ ] Changement de chat détecte et met à jour le sessionId
- [ ] Événement `claraverse:session:changed` émis lors du changement
- [ ] Tables restaurées correspondent au chat actif uniquement
- [ ] Aucune table d'un autre chat n'apparaît
- [ ] Données spécifiques à chaque chat sont préservées

---

### Test 4: Protection Temporelle ✓

**Objectif:** Vérifier que les tables fraîchement créées ne sont pas supprimées prématurément

**Procédure:**
1. Ouvrir la console du navigateur (F12)
2. Générer une table Modelised
3. Observer immédiatement (< 5 secondes) les logs de console
4. Vérifier la présence de messages de protection:
   ```
   🛡️ Table protégée (âge: XXXms < 5000ms) - Skip cleanup
   ```
5. Attendre 6 secondes
6. Observer que le cleanup peut maintenant s'exécuter si nécessaire

**Vérification des Timestamps:**
```javascript
// Vérifier que les tables ont les attributs timestamp
const tables = document.querySelectorAll('table');
Array.from(tables).forEach((t, i) => {
  const timestamp = t.dataset.timestamp || t.closest('[data-timestamp]')?.dataset.timestamp;
  const createdTimestamp = t.dataset.createdTimestamp;
  const age = timestamp ? Date.now() - parseInt(timestamp) : 'N/A';
  console.log(`Table ${i}: timestamp=${timestamp}, age=${age}ms, created=${createdTimestamp}`);
});
```

**Vérification du Cleanup:**
```javascript
// Déclencher manuellement le cleanup après 6 secondes
setTimeout(() => {
  console.log('Test: Tables visibles après protection expirée');
  const tablesAfter = document.querySelectorAll('table');
  console.log(`Nombre de tables: ${tablesAfter.length}`);
}, 6000);
```

**Critères de Succès:**
- [ ] Tables ont `data-timestamp` défini
- [ ] Tables ont `data-created-timestamp` défini
- [ ] Messages de protection apparaissent dans les logs (< 5s)
- [ ] Cleanup respecte la fenêtre de protection
- [ ] Après 5 secondes, cleanup normal peut procéder
- [ ] Tables légitimes ne sont jamais supprimées

---

## 🔍 Vérifications Supplémentaires

### Vérification 1: Attributs des Tables

**Script de Diagnostic:**
```javascript
function verifyTableAttributes() {
  const tables = document.querySelectorAll('table');
  const report = [];
  
  tables.forEach((table, index) => {
    const container = table.closest('[data-container-id]');
    
    report.push({
      index,
      className: table.className,
      position: table.dataset.tablePosition,
      createdTimestamp: table.dataset.createdTimestamp,
      timestamp: container?.dataset.timestamp,
      sessionId: table.dataset.consoSessionId,
      restored: table.closest('[data-restored="true"]') ? 'Yes' : 'No',
      containerId: container?.dataset.containerId
    });
  });
  
  console.table(report);
  return report;
}

// Exécuter
verifyTableAttributes();
```

**Résultat Attendu:**
Chaque table devrait avoir:
- `position`: 1, 2, ou 3
- `createdTimestamp`: nombre (millisecondes)
- `timestamp`: nombre (millisecondes)
- `sessionId`: string (pour Table_conso)

---

### Vérification 2: État d'IndexedDB

**Script de Diagnostic:**
```javascript
async function verifyIndexedDB() {
  // Ouvrir la base de données
  const dbRequest = indexedDB.open('clara_db', 1);
  
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['clara_generated_tables'], 'readonly');
    const store = transaction.objectStore('clara_generated_tables');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const tables = request.result;
      console.log(`📊 Total tables in IndexedDB: ${tables.length}`);
      
      // Grouper par sessionId
      const bySession = {};
      tables.forEach(t => {
        if (!bySession[t.sessionId]) bySession[t.sessionId] = [];
        bySession[t.sessionId].push({
          id: t.id,
          keyword: t.keyword,
          position: t.position,
          size: t.size
        });
      });
      
      console.log('📋 Tables par session:');
      Object.keys(bySession).forEach(sessionId => {
        console.log(`\n  Session: ${sessionId}`);
        console.table(bySession[sessionId]);
      });
    };
  };
}

// Exécuter
verifyIndexedDB();
```

---

### Vérification 3: Événements de Session

**Script de Surveillance:**
```javascript
// Écouter les événements de session
document.addEventListener('claraverse:session:changed', (e) => {
  console.log('🔄 SESSION CHANGED:', {
    oldSessionId: e.detail.oldSessionId,
    newSessionId: e.detail.newSessionId,
    chatId: e.detail.chatId,
    timestamp: new Date().toISOString()
  });
});

// Vérifier la détection de chat
console.log('Chat ID actuel:', window.detectChatId?.());
console.log('Last Chat ID:', window.lastDetectedChatId?.());
console.log('Session ID:', sessionStorage.getItem('claraverse_stable_session'));
```

---

## 🐛 Dépannage

### Problème 1: Tables dans le Mauvais Ordre

**Symptôme:** Tables apparaissent dans un ordre incorrect après consolidation

**Diagnostic:**
```javascript
// Vérifier l'ordre dans le DOM
const parent = document.querySelector('[data-container-id]');
const children = Array.from(parent.children);
children.forEach((child, i) => {
  const table = child.querySelector('table');
  if (table) {
    console.log(`Position ${i}: ${table.dataset.tablePosition}, Class: ${table.className}`);
  }
});
```

**Solution:**
1. Vérifier que `repositionResultatTable()` est appelée
2. Vérifier les logs de console pour "✅ Table Résultat repositionnée"
3. Vérifier que les attributs `data-table-position` sont définis
4. Recharger la page pour tester la restauration avec ordre correct

---

### Problème 2: Tables Disparaissent Après Rechargement

**Symptôme:** Tables ne sont pas restaurées après F5

**Diagnostic:**
```javascript
// Vérifier IndexedDB
async function checkStorage() {
  const dbRequest = indexedDB.open('clara_db', 1);
  dbRequest.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction(['clara_generated_tables'], 'readonly');
    const store = tx.objectStore('clara_generated_tables');
    const req = store.count();
    req.onsuccess = () => {
      console.log(`Tables en storage: ${req.result}`);
      if (req.result === 0) {
        console.error('❌ Aucune table enregistrée!');
      }
    };
  };
}
checkStorage();
```

**Solutions Possibles:**
1. Vérifier que `conso-indexeddb-bridge.js` est chargé
2. Vérifier que les événements `flowise:table:save:request` sont émis
3. Vérifier le sessionId est cohérent
4. Vérifier dans DevTools → Application → IndexedDB

---

### Problème 3: Contamination Inter-Chats

**Symptôme:** Tables d'un autre chat apparaissent dans le chat actuel

**Diagnostic:**
```javascript
// Vérifier les sessionId
const currentSession = sessionStorage.getItem('claraverse_stable_session');
console.log('Session actuelle:', currentSession);

// Vérifier les tables restaurées
const restored = document.querySelectorAll('[data-restored="true"]');
Array.from(restored).forEach(t => {
  const table = t.querySelector('table');
  const sessionId = table?.dataset.consoSessionId;
  console.log(`Table session: ${sessionId}, Match: ${sessionId === currentSession}`);
});
```

**Solutions:**
1. Vérifier que `detectChatId()` détecte correctement le chat
2. Vérifier que `onChatChanged()` est appelé lors du changement
3. Vérifier que l'événement `claraverse:session:changed` est émis
4. Vérifier que `conso-indexeddb-bridge.js` met à jour son sessionId

---

### Problème 4: Tables Supprimées Trop Tôt

**Symptôme:** Tables disparaissent immédiatement après création

**Diagnostic:**
```javascript
// Vérifier la protection temporelle
const NOW = Date.now();
const tables = document.querySelectorAll('table');
tables.forEach((t, i) => {
  const container = t.closest('[data-container-id]');
  const timestamp = container?.dataset.timestamp;
  if (timestamp) {
    const age = NOW - parseInt(timestamp);
    const protected = age < 5000;
    console.log(`Table ${i}: age=${age}ms, protected=${protected}`);
  }
});
```

**Solutions:**
1. Vérifier que `data-timestamp` est défini sur les containers
2. Vérifier que `data-created-timestamp` est défini sur les tables
3. Vérifier que PROTECTION_WINDOW_MS = 5000 dans flowiseTableBridge.ts
4. Vérifier les logs pour "🛡️ Table protégée"

---

## ✅ Checklist Finale

### Fonctionnalités Implémentées

- [x] Protection temporelle (5 secondes)
- [x] Ordre des tables garanti (Conso → Résultat → Modelised)
- [x] Attributs de position pour restauration
- [x] Détection de changement de chat
- [x] Synchronisation des sessions
- [x] Timestamps de création
- [x] Isolation inter-chats par sessionId

### Tests à Exécuter

- [ ] Test 1: Ordre des tables
- [ ] Test 2: Persistance simple
- [ ] Test 3: Isolation inter-chats
- [ ] Test 4: Protection temporelle

### Vérifications Supplémentaires

- [ ] Attributs des tables corrects
- [ ] IndexedDB contient les bonnes données
- [ ] Événements de session fonctionnent
- [ ] Aucune erreur dans la console

### Documentation

- [x] TIMESTAMP_PROTECTION_STATUS.md
- [x] TEST_VERIFICATION_GUIDE.md (ce document)
- [x] Code commenté et documenté

---

## 📞 Support et Debugging

### Commandes Console Utiles

```javascript
// État du système
verifyTableAttributes();
verifyIndexedDB();

// Test manuel de restauration
window.restoreCurrentSession();

// Détection de chat
window.detectChatId();
window.lastDetectedChatId();

// Bridge conso
window.consoIndexedDBBridge.saveAllConsoTables();
window.consoIndexedDBBridge.getCurrentSessionId();

// Logs de diagnostic
window.consoIndexedDBBridge.findConsoTables();
window.consoIndexedDBBridge.findResultatTables();
```

### Logs à Surveiller

```
✅ [ConsoIndexedDB] Pont initialisé
🔄 [ConsoIndexedDB] Session changée
💾 [ConsoIndexedDB] Sauvegarde table
🛡️ Table protégée (âge: XXXms < 5000ms)
✅ Table Résultat repositionnée
📍 Chat initial détecté
🔄 Changement de chat détecté
```

---

**Créé par:** Kiro  
**Date:** 28 août 2026  
**Version:** 1.0  
**Statut:** ✅ PRÊT POUR LES TESTS
