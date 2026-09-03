# 📝 MÉMO DE MISE EN ŒUVRE - SYSTÈME DE PERSISTANCE DES TABLES

## 1. Introduction & Objectifs
Ce mémo documente de manière exhaustive l'architecture et les modifications apportées pour résoudre **5 problèmes critiques de persistance des tables** dans l'application ClaraVerse. L'objectif de cette intervention était d'unifier la sauvegarde des tables automatisées (`Table_conso`, `Résultat`) générées par `conso.js` avec le nouveau système de persistance asynchrone basé sur `IndexedDB` et de résoudre les conflits liés au cycle de vie des sessions de chat.

## 2. Architecture Globale du Système de Persistance
L'application ClaraVerse repose sur deux systèmes de stockage fonctionnant initialement en parallèle (ce qui causait des conflits) :
- **Le système unifié (Nouveau, via `flowiseTableBridge.ts` et IndexedDB `clara_db`)** : Il intercepte les modifications des tables via l'événement DOM `flowise:table:save:request`, compresse les données HTML, et les sauvegarde dans `clara_generated_tables` avec des métadonnées (dont le `sessionId`, `keyword`, et `timestamp`).
- **Le système de Fallback / Legacy (Ancien, via `conso.js` et LocalStorage)** : Stockait l'état JSON brut des tables dans la clé `claraverse_tables_data`.

### Flux de données de la sauvegarde (Après mise à jour) :
1. Une table est modifiée (manuellement par l'utilisateur ou automatiquement par un script comme `conso.js`).
2. Un événement Custom (`flowise:table:save:request`) est émis sur le `document`.
3. Le `menu-persistence-bridge.js` (ou l'écouteur React/TypeScript `menuIntegration.ts`) capte l'événement et appelle `flowiseTableService.saveGeneratedTable()`.
4. Le service stocke la table dans **IndexedDB**.
5. Lors d'un changement de chat, `auto-restore-chat-change.js` émet `flowise:table:restore:request` avec le nouveau `sessionId`.
6. Le `flowiseTableBridge.ts` charge les tables de cette session depuis IndexedDB et les réinjecte dans le DOM à la place des tables originales.

## 3. Détail Exhaustif des Résolutions (Problème par Problème)

### Problème 1 & 2 : Données automatiques non persistantes après rechargement/redémarrage
**Le Bug :** Les modifications automatisées de `conso.js` n'étaient enregistrées que dans le `localStorage` (via `saveTableDataNow()`). En cas de redémarrage ou de restauration, le pont `IndexedDB` n'avait aucune trace de ces modifications, provoquant l'écrasement des données automatiques par des données manuelles plus anciennes.

**Mise en œuvre :**
- **Création du pont `conso-indexeddb-bridge.js`** : Ce script écoute l'événement `claraverse:consolidation:complete` (émis par `conso.js`) ainsi que les mutations du DOM (`MutationObserver` sur les attributs `data-updated`). Il capture les tables affectées et déclenche explicitement `flowise:table:save:request`.
- **Modification de `conso.js` (`saveTableDataNow`)** : La fonction appelle dorénavant `window.claraverseSyncAPI.forceSaveTable(table)` si disponible. Elle possède aussi une protection stricte pour ne jamais sauvegarder de tables vides ou contenant les marqueurs `"⏳ En attente de consolidation..."`.

### Problème 3 : L'API de persistance ne chargeait pas (Action contextuelle non persistante)
**Le Bug :** Une erreur typographique dans `index.html` empêchait le chargement du pont.
**Mise en œuvre :**
- Dans `index.html`, la balise `<script src="/menu-perssistence-bridge.js"></script>` a été corrigée en `menu-persistence-bridge.js`. Un `s` parasite à la ligne suivante a été supprimé.
- Ajout de la méthode `saveAllTables()` dans l'objet global `window.claraverseSyncAPI` pour permettre à `conso.js` de déclencher une sauvegarde forcée.

### Problème 4 : Contamination Inter-Chats
**Le Bug :** Les tables créées par `conso.js` partageaient la clé globale `claraverse_tables_data` dans le LocalStorage. De plus, à la restauration, IndexedDB cherchait les tables via leur mot-clé (`data-n8n-keyword`) sans les filtrer strictement, causant l'apparition de données d'un Chat A dans un Chat B.
**Mise en œuvre :**
- Implémentation de la fonction `getCurrentSessionId()` dans `conso.js` pour extraire ou générer une session stable unique.
- Les méthodes `loadAllData()`, `saveAllData()` et `clearAllData()` de `conso.js` ont été réécrites pour scoper dynamiquement la clé de stockage (ex: `claraverse_tables_data_[sessionId]`).
- Lors de la création d'une nouvelle `Table_conso` dans `conso.js` (fonction `createConsolidationTable()`), les attributs `data-conso-session-id` et `data-source-table-id` lui sont assignés dès sa naissance.
- Le pont `flowiseTableBridge.ts` a été confirmé comme restaurant correctement par `sessionId` via IndexedDB.

### Problème 5 : Tables dupliquées (avant et après insertion de colonne)
**Le Bug :** Lors de l'ajout d'une colonne (via `menu.js`), le "header signature" (la concaténation des noms des colonnes triés) change. La fonction de nettoyage `cleanupDuplicateOriginalTables` dans `flowiseTableBridge.ts` (chargée de supprimer la table d'origine générée par Flowise une fois la table modifiée injectée) ne reconnaissait plus la table d'origine comme étant un "doublon" de la table restaurée. Les deux restaient visibles.
**Mise en œuvre :**
- Réécriture majeure de la méthode `cleanupDuplicateOriginalTables()` dans `src/services/flowiseTableBridge.ts`.
- La nouvelle logique extrait non seulement les signatures d'en-têtes, mais aussi les **mots-clés (`data-n8n-keyword`)** et le texte des premiers en-têtes (ex: `📊 Table de Consolidation`) de toutes les tables portant l'attribut `data-restored="true"`.
- Lorsqu'elle scanne le DOM pour trouver les tables non restaurées (les tables brutes générées à la volée par Flowise), elle les marque comme "doublon à supprimer" si **soit** leur signature correspond, **soit** leur mot-clé correspond. Ainsi, même si une colonne a été ajoutée/retirée, la table brute est supprimée correctement.

## 4. Fichiers Impactés
1. `index.html`
2. `public/menu-persistence-bridge.js`
3. `public/conso.js`
4. `public/conso-indexeddb-bridge.js` (Nouveau)
5. `src/services/flowiseTableBridge.ts`

## 5. Guide de Maintenance et Débogage
- **Logs Console utiles** : 
  - Recherchez `🔌 [ConsoIndexedDB]` pour voir si le pont capte bien les événements de consolidation.
  - Recherchez `🧹 Cleaning up duplicate original tables` pour voir l'action du dédoublonnage hybride (par signature ou par mot-clé).
- **Inspection de la base de données** : Allez dans DevTools (F12) > Application > IndexedDB > `clara_db` > `clara_generated_tables`. Vérifiez que les tables `Table_conso` possèdent bien le bon `sessionId`.
- **Restauration via TypeScript** : Les modifications TypeScript ont été compilées avec succès. Si des modifications futures dans `flowiseTableBridge.ts` sont requises, n'oubliez pas d'exécuter `npm run build` ou `vite build`.

---
*Document généré lors de la résolution de l'intégration IndexedDB / Conso.js.*
