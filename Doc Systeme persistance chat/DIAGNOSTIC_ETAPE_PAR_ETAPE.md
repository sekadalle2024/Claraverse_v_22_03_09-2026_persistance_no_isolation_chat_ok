# 🔍 DIAGNOSTIC ÉTAPE PAR ÉTAPE - Persistance Tables

**Contexte** : Restauration SE DÉCLENCHE mais échoue silencieusement (aucune table restaurée).

**Objectif** : Identifier où le flux échoue entre déclenchement et injection DOM.

---

## 📋 PRÉREQUIS

Avant de commencer :
1. ✅ Serveur Vite tourne sur http://localhost:5174/
2. ✅ Modifications appliquées (stableSessionId, logs debug)
3. ✅ Navigateur ouvert avec console (F12)
4. ✅ Cache vidé (Ctrl+Shift+Delete)

---

## 🧪 ÉTAPE 1 : GÉNÉRER TABLE

### Actions
1. Rafraîchir page (Ctrl+F5)
2. Envoyer message dans chat :
   ```
   Crée une table avec colonnes: Assertion, Conclusion, CTR
   Et 2 lignes de données
   ```
3. Attendre génération complète

### Logs attendus
```
💾 [DEBUG] Sauvegarde table: keyword="Table_Consolidation", sessionId="xxx...", messageId="yyy"
✅ Table saved successfully: zzz (linked to message: yyy)
```

### Vérifications
- [ ] Log `💾 [DEBUG] Sauvegarde table` présent ?
- [ ] Log `✅ Table saved successfully` présent ?
- [ ] SessionId commence par "481d3e2c" ou "clara-session" ?

### ❌ Si logs absents
**Problème** : Sauvegarde ne se déclenche pas

**Diagnostic** :
1. Chercher `✅ [INLINE] Événement émis pour:` dans console
   - Si absent → `conso.js` n'émet pas événement
2. Chercher `🚨 [DIAGNOSTIC] Événement save:request reçu` dans console
   - Si absent → Bridge ne reçoit pas événement

**Solution** :
- Vérifier `conso.js` ligne ~905 et ~1667 (tags data-conso-generated, forceUpdate)
- Vérifier `flowiseTableBridge.ts` écoute événement `table:integrated`

---

## 🧪 ÉTAPE 2 : VÉRIFIER INDEXEDDB

### Actions
1. **NE PAS RECHARGER PAGE**
2. Ouvrir console (F12)
3. Copier-coller contenu de `SNIPPET_DIAGNOSTIC_INDEXEDDB.js`
4. Appuyer Entrée

### Output attendu
```
🔍 ===== DIAGNOSTIC INDEXEDDB =====
✅ Base de données ouverte: FloTableDB version 2
📊 TOTAL TABLES EN DB: 1

📁 TABLES PAR SESSION:
  Session 481d3e2c...: 1 table(s)
    - "Table_Consolidation" (a5cfecc4...) créée le ...

🎯 SESSION ACTUELLE: 481d3e2c...
   → 1 table(s) pour cette session
```

### Vérifications
- [ ] DB version 2 ?
- [ ] Au moins 1 table en DB ?
- [ ] SessionId de la table = SESSION ACTUELLE ?

### ❌ Si aucune table en DB
**Problème** : Sauvegarde échoue après log `✅ Table saved`

**Diagnostic** :
1. Chercher erreur `❌ Error saving table` dans console
2. Vérifier si `flowiseTableService.saveGeneratedTable()` lève exception

**Solution** :
- Vérifier que IndexedDB `generatedTables` object store existe
- Vérifier permissions IndexedDB (pas en navigation privée)

### ❌ Si sessionId différent
**Problème** : SessionId mismatch entre sauvegarde et session actuelle

**Exemple** :
```
📁 TABLES PAR SESSION:
  Session 12345678...: 1 table(s)  ← Sauvegardée avec ID différent

🎯 SESSION ACTUELLE: 481d3e2c...  ← Session actuelle différente
   → 0 table(s) pour cette session
```

**Cause** : Bridge utilise mauvais sessionId pendant sauvegarde

**Solution** :
- Vérifier injection `flowiseTableBridge.setCurrentSession(stableSessionId)` dans `ClaraAssistant.tsx` ligne ~484
- Vérifier `stableSessionId` défini ligne 415-417

---

## 🧪 ÉTAPE 3 : TESTER RESTAURATION

### Actions
1. **Appuyer F5** (recharger page)
2. Attendre 5 secondes
3. Observer logs console

### Logs attendus
```
🔄 [React Restore] useEffect triggered {stableSessionId: '481d3e2c...', messagesLength: 1}
✅ Session manually set to: 481d3e2c...
🔄 [React Restore] Déclenchement restauration tables...
🔄 Restoring tables chronologically for session: 481d3e2c...
📊 [DEBUG] Timeline récupérée: 2 items total
📊 [DEBUG] Timeline détail: [...]
📊 [DEBUG] Après filtrage session: 2 items
📊 [DEBUG] Tables à restaurer: 1
✅ Filtered timeline: 1 table(s) for session 481d3e2c...
✅ Restored 1 table(s) chronologically for session 481d3e2c...
✅ [React Restore] Restauration réussie: 1 table(s)
```

### Vérifications POINT PAR POINT

#### ✅ Point 1 : Restauration déclenchée
```
🔄 Restoring tables chronologically for session: xxx
```

- [ ] Ce log est présent ?

**Si absent** → useEffect pas déclenché, voir `ClaraAssistant.tsx` ligne 456-501

---

#### ✅ Point 2 : Timeline récupérée
```
📊 [DEBUG] Timeline récupérée: X items total
```

- [ ] Log présent ?
- [ ] X > 0 ?

**Si X = 0** :
- **Cause** : `getSessionTimeline()` retourne tableau vide
- **Diagnostic** : Tables pas en IndexedDB (retour Étape 2)

---

#### ✅ Point 3 : Filtrage session
```
📊 [DEBUG] Après filtrage session: X items
```

- [ ] Log présent ?
- [ ] X > 0 ?

**Si X = 0 MAIS timeline récupérée > 0** :
- **Cause** : SessionId mismatch
- **Diagnostic** :
  1. Comparer sessionId log restauration vs snippet IndexedDB Étape 2
  2. Si différents → Bug isolation, tables filtrées

**Solution** :
- Vérifier `stableSessionId` utilisé dans restauration = sessionId sauvegarde

---

#### ✅ Point 4 : Tables identifiées
```
📊 [DEBUG] Tables à restaurer: X
```

- [ ] Log présent ?
- [ ] X > 0 ?

**Si X = 0 MAIS filtrage > 0** :
- **Cause** : Timeline contient messages mais pas tables
- **Diagnostic** : Tables pas sauvegardées avec type 'table'

**Solution** :
- Vérifier que `flowiseTimelineService` sauvegarde items avec `type: 'table'`

---

#### ✅ Point 5 : Restauration exécutée
```
✅ Restored X table(s) chronologically
```

- [ ] Log présent ?

**Si absent** :
- **Cause** : Boucle restauration pas atteinte OU exception levée
- **Diagnostic** : Chercher `❌ Error restoring tables chronologically`

---

#### ✅ Point 6 : Tables visibles
- [ ] Interface affiche les tables ?

**Si logs OK MAIS tables absentes** :
- **Cause** : Injection DOM échoue
- **Diagnostic** :
  1. Vérifier conteneur `.markdown-content` existe dans DOM
  2. Chercher erreurs JavaScript après log restauration
  3. Inspecter Elements (F12) : tables insérées dans DOM ?

**Solution** :
- Vérifier `injectTableIntoDOM()` ligne ~2400-2410

---

## 📊 TABLEAU DIAGNOSTIC RAPIDE

| Étape | Log Clé | Problème Si Absent | Solution |
|-------|---------|-------------------|----------|
| **1. Sauvegarde** | `💾 [DEBUG] Sauvegarde table` | Événement pas émis | Vérifier `conso.js` ligne 905/1667 |
| **1bis. Sauvegarde OK** | `✅ Table saved successfully` | Exception dans save | Vérifier `flowiseTableService` |
| **2. IndexedDB** | `📊 TOTAL TABLES EN DB: X` (X>0) | Tables pas en DB | Vérifier permissions DB |
| **3a. Restauration** | `🔄 Restoring tables chronologically` | useEffect pas déclenché | Vérifier `ClaraAssistant.tsx` ligne 456 |
| **3b. Timeline** | `📊 Timeline récupérée: X` (X>0) | `getSessionTimeline()` vide | Retour Étape 2 |
| **3c. Filtrage** | `📊 Après filtrage: X` (X>0) | SessionId mismatch | Comparer IDs sauvegarde vs restauration |
| **3d. Tables** | `📊 Tables à restaurer: X` (X>0) | Type 'table' manquant | Vérifier timeline items |
| **3e. Exécution** | `✅ Restored X table(s)` | Exception boucle | Chercher erreur dans console |
| **3f. Injection** | Tables visibles UI | DOM injection échoue | Vérifier conteneur `.markdown-content` |

---

## 🎯 RACCOURCI DIAGNOSTIC

Si vous ne voulez pas lire tout le document, suivez cette séquence :

1. **Générer table** → Vérifier log `✅ Table saved successfully`
2. **Snippet IndexedDB** → Vérifier `TOTAL TABLES: X` (X > 0) et SessionId match
3. **F5** → Vérifier log `✅ Restored X table(s)`

**Si l'un échoue**, retourner à l'étape détaillée correspondante ci-dessus.

---

## 📞 AIDE

Si bloqué après avoir suivi toutes les étapes :

1. Copier TOUS les logs console depuis chargement jusqu'à fin restauration
2. Noter à quelle étape ça bloque (1, 2, 3a, 3b, etc.)
3. Fournir output snippet IndexedDB

---

**Dernière mise à jour** : 29 Août 2026 16:10
