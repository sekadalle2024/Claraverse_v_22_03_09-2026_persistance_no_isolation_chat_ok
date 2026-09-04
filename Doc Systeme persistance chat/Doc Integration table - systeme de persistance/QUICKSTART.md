# 🚀 QUICKSTART - Nettoyage IndexedDB & Intégration Tables

**Dernière mise à jour** : 29 Août 2026 04:00  
**Objectif** : Résoudre rapidement l'incompatibilité keywords (9 tables skippées sur 13)

---

## ⚡ Solution Rapide (5 minutes)

### Étape 1 : Nettoyer IndexedDB

**Ouvrir console F12** (touche F12 dans navigateur)

**Copier-coller cette commande** :

```javascript
indexedDB.deleteDatabase('FloTableDB').onsuccess = () => { console.log('✅ DB supprimée'); location.reload(); };
```

**Appuyer sur Entrée**

✅ La page va recharger automatiquement après 2 secondes

---

### Étape 2 : Générer des Tables de Test

Une fois la page rechargée :

1. Générer des tables via GPT-4 dans le chat
2. Attendre que les tables s'affichent
3. **F5** pour recharger la page (simuler restauration)

---

### Étape 3 : Vérifier l'Intégration

Après le F5, **automatiquement** :
- Le système détecte les tables restaurées
- L'intégration se déclenche après 5 secondes

**Vérifier dans la console F12** :
```
✅ [INTEGRATION] TERMINÉ
    ✅ Intégrées : 13  ← DOIT ÊTRE 13 (pas 4)
    ⏭️ Skippées  : 0   ← DOIT ÊTRE 0 (pas 9)
```

**Vérifier visuellement** :
- ✅ Toutes les feuilles de test sont visibles (pas juste une)
- ✅ Pas de duplication (12 tables restent 12, pas 24)

---

## 🔍 Alternative : Bouton Manuel

Si l'intégration automatique ne se déclenche pas :

1. Chercher le bouton orange **"🔄 Intégrer Tables"** (haut droite, 4ème bouton)
2. Cliquer dessus
3. Lire le popup avec les résultats détaillés

---

## 📋 Logs Détaillés à Chercher

**Console F12** → Filtrer par `[INTEGRATION]`

**Exemple de succès** :
```
📊 [INTEGRATION] 13 table(s) restaurée(s) trouvée(s)
📊 [INTEGRATION] 13 table(s) initiale(s) trouvée(s)

🔍 [INTEGRATION] Table restaurée 1/13
    Identifiant: keyword = "Table_8_1788562131933"
    ✅ Match trouvé via keyword
    ✅ Table Table_8_1788562131933 intégrée avec succès
    
... (répéter pour 13 tables)

✅ [INTEGRATION] TERMINÉ
    ✅ Intégrées : 13
    ⏭️ Skippées  : 0
```

---

## ❌ Si Ça Ne Marche Pas

### Problème : Toujours des tables skippées

**Solution** : Vider complètement le cache navigateur

1. **Chrome/Edge** : Ctrl+Shift+Delete → Cocher "Cached images and files" → Clear data
2. **Firefox** : Ctrl+Shift+Delete → Cocher "Cache" → Clear Now
3. Fermer **TOUS** les onglets de l'application
4. Réouvrir l'application
5. Refaire Étape 1 (nettoyage IndexedDB)

---

### Problème : Bouton "🔄 Intégrer Tables" invisible

**Vérifier** :
```javascript
// Console F12
console.log(window.integrerTablesRestaurees);
```

Si `undefined` → Script pas chargé :
1. Vérifier `index.html` ligne 189 contient `<script src="/integrate-restored-tables.js">`
2. Network tab F12 → Chercher `integrate-restored-tables.js` → Doit être 200 OK
3. Redémarrer serveur : `npm run dev`

---

### Problème : Erreur "deleteDatabase failed"

**Cause** : Autre onglet/fenêtre a la base ouverte

**Solution** :
1. Fermer **TOUS** les onglets de `localhost:5173`
2. Fermer **TOUS** les DevTools F12
3. Attendre 5 secondes
4. Réessayer commande nettoyage

---

## 📝 Comprendre Pourquoi Cette Étape Est Nécessaire

**Contexte** : 2 systèmes de keywords coexistent dans IndexedDB

**Anciens keywords (incompatibles)** :
- `table_jj2wki` (hash 6 chars)
- `bdbcb6f3-7abf-4d44-9eae-a6e15230008a` (UUIDs complets)

**Nouveaux keywords (corrects)** :
- `Table_8_1788562131933` (pattern timestamp)

**Problème** : L'algorithme de matching ne peut pas faire correspondre `table_jj2wki` ↔ `Table_8_1788562131933`

**Solution** : Supprimer les anciennes données → Toutes nouvelles tables auront le nouveau format → Match 100% réussi

---

## 🔗 Liens Utiles

- **Mémo complet** : `00_MEMO_PROGRESSIF_INTEGRATION_TABLE_SYSTEME_PERSISTANCE.md`
- **Documentation** : `README.md`
- **Script nettoyage** : `public/clean-indexeddb.js`

---

**Besoin d'aide ?** Consulter les logs console F12 section `[INTEGRATION]` pour diagnostiquer.
