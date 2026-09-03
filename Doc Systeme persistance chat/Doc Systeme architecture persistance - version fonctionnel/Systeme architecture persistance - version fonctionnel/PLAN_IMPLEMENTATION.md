# Plan d'Implémentation — Système de Persistance Tables ClaraVerse

## Contexte et Diagnostic

### Résumé des 5 Problèmes

Après analyse complète des fichiers `conso.js`, `menu-persistence-bridge.js`, `index.html` et des services TypeScript (`flowiseTableBridge.ts`, `flowiseTableService.ts`, etc.), voici les causes racines identifiées :

---

## Causes Racines Confirmées

### 🔴 Problème 1 & 2 — Non-persistance des tables `Table_conso` et `Résultat`

**Cause racine** : `conso.js` utilise **localStorage** (`claraverse_tables_data`) au lieu du système unifié **IndexedDB** (`clara_db/clara_generated_tables`).

- La fonction `saveTableDataNow()` (ligne 2049) appelle `saveAllData()` → `localStorage.setItem()`
- La fonction `saveConsolidationData()` (ligne 2137) fait de même
- La restauration `restoreAllTablesData()` (ligne 2250) relit localStorage
- **Les tables `Table_conso` et `Résultat` créées et remplies automatiquement par `conso.js` ne déclenchent JAMAIS l'événement `flowise:table:save:request`** que le système IndexedDB écoute
- Après redémarrage du serveur, localStorage est vide → tables perdues
- Le bouton "Activer édition des cellules" fonctionne car il passe par le système IndexedDB (via `menu.js`)
- **Conflit** : Une saisie manuelle (via IndexedDB) est ensuite écrasée si localStorage contient des données plus récentes

### 🔴 Problème 3 — Typo critique dans `index.html`

**Cause racine** : Le script référencé dans `index.html` (ligne 130) est `menu-perssistence-bridge.js` (double `s`) mais le fichier réel s'appelle `menu-persistence-bridge.js` (un seul `s`). De plus, un caractère parasite `s` se trouve à la ligne 131, créant une erreur de syntaxe HTML.

**Impact** : Le pont de persistance ne se charge pas → `window.claraverseSyncAPI` n'est jamais créé → `conso.js` tente `window.claraverseSyncAPI.saveAllTables()` mais cette méthode n'existe pas dans l'API.

### 🔴 Problème 4 — Contamination inter-chats

**Cause racine** : Les tables générées par `conso.js` n'ont pas de `sessionId` associé dans IndexedDB. Quand `flowiseTableBridge.ts` restaure les tables, il les retrouve par **keyword/headers** globalement dans la BDD, sans filtrer par session. Une table `Table_conso` modifiée dans le Chat A est donc restaurée dans le Chat B si ses colonnes correspondent.

**Cause secondaire** : `conso.js` crée des `Table_conso` vides au chargement → si IndexedDB contient une ancienne version, la vide écrase la sauvegardée (Cas 6 des hypothèses).

### 🟡 Problème 5 — Table dupliquée après insertion de colonne

**Cause racine** : Lors d'une insertion de colonne via `menu.js`, le système de sauvegarde IndexedDB enregistre le **HTML complet** de la table. À la restauration, `flowiseTableBridge.ts` injecte la table restaurée **à côté** de l'originale (qui a déjà été modifiée par `menu.js`) au lieu de la remplacer. L'ID `data-container-id` change, cassant le mécanisme de matching.

---

## Solution Proposée

### Approche : Intégrer `conso.js` dans le système IndexedDB via événements

La solution minimise les modifications côté TypeScript (ne pas toucher `flowiseTableService.ts` ni `flowiseTableBridge.ts`) et agit côté `conso.js` et `index.html`.

**Principe** : `conso.js` doit déclencher l'événement `flowise:table:save:request` après chaque consolidation, comme `menu.js` le fait après ses modifications. Le `menu-persistence-bridge.js` gère déjà ce mécanisme.

---

## Modifications Proposées

---

### Composant 1 — `index.html` (Corrections critiques)

**3 corrections** :
1. Corriger la typo `menu-perssistence-bridge.js` → `menu-persistence-bridge.js` (ligne 130)
2. Supprimer le caractère parasite `s` à la ligne 131
3. Ajouter la méthode `saveAllTables` manquante dans l'API exposée par le pont

---

### Composant 2 — `conso.js` (Intégration IndexedDB)

**9 modifications ciblées** (basées sur le guide `PATCH_CONSO_INDEXEDDB.md` déjà documenté) :

**Modification 1** — Ajouter `getCurrentSessionId()` (après `init()`, ~ligne 58)
**Modification 2** — Remplacer `saveTableDataNow()` pour déclencher `flowise:table:save:request`
**Modification 3** — Ajouter `saveTableDataLocalStorage()` (ancien code déplacé = fallback)
**Modification 4** — Ajouter `notifyTableSaveToIndexedDB(tableElement, keyword, source)`
**Modification 5** — Modifier `updateConsolidationDisplay()` pour appeler `notifyTableSaveToIndexedDB()` après la mise à jour des tables `Table_conso` et `Résultat`
**Modification 6** — Modifier `createConsolidationTable()` : **ne pas sauvegarder les tables vides**.
**Modification 7** — Modifier `restoreAllTablesData()` : utiliser d'abord IndexedDB (via événement), localStorage en fallback
**Modification 8** — Ajouter `migrateFromLocalStorage()` : migrer les anciennes données localStorage vers IndexedDB au premier chargement
**Modification 9** — Modifier `performConsolidation()` : après consolidation réussie, déclencher la sauvegarde des tables concernées dans IndexedDB

---

### Composant 3 — `menu-persistence-bridge.js` (Extension API)

Ajouter la méthode `saveAllTables` manquante dans `window.claraverseSyncAPI` et ajouter `getCurrentSessionId` dans l'API exposée.

---

### Composant 4 — Nouveau script `conso-indexeddb-bridge.js` (OPTIONNEL mais recommandé)

Ce script :
- Écoute l'événement `claraverse:consolidation:complete` (déjà émis par `conso.js` via `notifyConsolidationComplete()`)
- Identifie les tables `Table_conso` et `Résultat` affectées
- Déclenche `flowise:table:save:request` pour chacune avec le bon `sessionId`
- Protège contre la sauvegarde de tables vides (`"⏳ En attente de consolidation..."`)

---

## Ordre de Chargement dans `index.html` (après corrections)

```html
<!-- 1. Gestionnaires de verrouillage (en premier) -->
<script src="/restore-lock-manager.js"></script>
<script src="/single-restore-on-load.js"></script>

<!-- 2. Scripts de base -->
<script src="/wrap-tables-auto.js"></script>
<script src="/Flowise.js"></script>

<!-- 3. Pont de persistance (AVANT menu.js et conso.js) -->
<script src="/menu-persistence-bridge.js"></script>  <!-- TYPO CORRIGÉE -->

<!-- 4. Scripts utilisant la persistance -->
<script src="/menu.js"></script>
<script src="/conso.js"></script>
<script src="/conso-indexeddb-bridge.js"></script>  <!-- NOUVEAU -->

<!-- 5. Restauration automatique (en dernier) -->
<script type="module" src="/auto-restore-chat-change.js"></script>
```
