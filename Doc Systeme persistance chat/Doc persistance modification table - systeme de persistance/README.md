# 📂 Doc Persistance Modification Table - Systeme de Persistance

**Date création** : 29 Août 2026  
**Objectif** : Documentation complète [Problème 1] - Persistance modifications utilisateur

---

## 🎯 Problème 1 : Modifications Utilisateur Non Persistées

### Symptôme
Après modification d'une table (édition cellule, ajout ligne/colonne), F5 restaure la version initiale générée par le LLM → **Modifications perdues**.

### Impact
- ❌ Utilisateur perd son travail après actualisation
- ❌ Éditions cellules non sauvegardées
- ❌ Ajouts lignes/colonnes perdus
- ❌ Modifications structure ignorées

---

## ✅ Solution Implémentée : Auto-Save System

### Architecture

**Composants** :
1. **MutationObserver** - Détecte modifications DOM temps réel
2. **Dirty Tables Set** - Track tables modifiées (évite sauvegardes inutiles)
3. **Interval périodique** - Sauvegarde toutes les 10 secondes
4. **IndexedDB** - Stockage persistant modifications

### Workflow
```
1. Utilisateur modifie cellule
   ↓
2. MutationObserver détecte changement
   ↓
3. Table ajoutée au Set dirtyTables
   ↓
4. Après 10 secondes → performAutoSave()
   ↓
5. HTML complet table sauvé dans IndexedDB
   ↓
6. F5 → Restauration version modifiée ✅
```

---

## 📊 Statut Actuel

| Composant | Statut | Détails |
|-----------|--------|---------|
| **MutationObserver** | ✅ IMPLÉMENTÉ | Surveille DOM (childList, characterData, attributes) |
| **Dirty Tables Set** | ✅ IMPLÉMENTÉ | Track identifiants tables modifiées |
| **Interval 10s** | ✅ IMPLÉMENTÉ | `setInterval(performAutoSave, 10000)` |
| **Sauvegarde IndexedDB** | ✅ IMPLÉMENTÉ | `saveGeneratedTable()` avec source 'user_edit' |
| **Tests utilisateur** | ⏳ EN ATTENTE | Validation modifications préservées après F5 |

---

## 🔍 Détails Techniques

### Fichier Principal
`src/services/flowiseTableBridge.ts` (lignes 2662-2823)

### Méthodes Clés

**1. startAutoSaveSystem()** (ligne 2670)
- Créer MutationObserver
- Observer document.body (subtree: true)
- Lancer interval 10 secondes

**2. handleTableMutations()** (ligne 2695)
- Parser mutations détectées
- Identifier table modifiée
- Ajouter à dirtyTables Set

**3. performAutoSave()** (ligne 2723)
- Parcourir dirtyTables
- Récupérer HTML complet table
- Sauvegarder IndexedDB
- Nettoyer dirtyTables

**4. stopAutoSaveSystem()** (ligne 2808)
- Arrêter MutationObserver
- Clearner interval
- Nettoyer dirtyTables

### Modifications Détectées

✅ **Édition cellules** :
- `characterData: true` dans MutationObserver
- Texte modifié via contenteditable

✅ **Ajout/Suppression éléments** :
- `childList: true`
- Nouvelles lignes `<tr>`
- Nouvelles colonnes `<td>`

✅ **Changements attributs** :
- `attributes: true`
- `attributeFilter: ['data-keyword', 'data-table-id', 'contenteditable']`

### Logs Auto-Save

**Démarrage** :
```
🔄 [AUTO-SAVE] Démarrage système auto-sauvegarde...
✅ [AUTO-SAVE] Système démarré (interval: 10000ms)
```

**Modification détectée** :
```
🔄 [AUTO-SAVE] Table modifiée détectée: "Compte"
```

**Sauvegarde** :
```
💾 [AUTO-SAVE] Sauvegarde de 1 table(s) modifiée(s)...
✅ [AUTO-SAVE] Table "Compte" sauvegardée (ID: xxx)
✅ [AUTO-SAVE] 1 table(s) sauvegardée(s): Compte
```

**Erreur** :
```
⚠️ [AUTO-SAVE] Table "xxx" introuvable dans DOM, skip
❌ [AUTO-SAVE] Erreur sauvegarde table "xxx": [error]
```

---

## 📋 Plan de Tests

### Test 1 : Édition Cellule Simple
1. Générer table via GPT-4
2. Double-cliquer cellule → modifier texte
3. Attendre log `🔄 Table modifiée détectée`
4. Attendre 10s → log `💾 Sauvegarde de X tables`
5. F5
6. **Vérifier** : Texte modifié préservé ✅

### Test 2 : Ajout Ligne
1. Générer table
2. Clic droit → "Ajouter ligne" (si disponible) ou manipulation DOM
3. Attendre logs auto-save
4. F5
5. **Vérifier** : Nouvelle ligne présente ✅

### Test 3 : Ajout Colonne
1. Générer table
2. Ajouter colonne (DOM manipulation)
3. Attendre logs auto-save
4. F5
5. **Vérifier** : Nouvelle colonne présente ✅

### Test 4 : Modifications Multiples
1. Générer 3 tables
2. Modifier table 1, puis table 2, puis table 3
3. Attendre logs `dirtyTables.size === 3`
4. Attendre 10s → sauvegarde 3 tables
5. F5
6. **Vérifier** : Toutes modifications préservées ✅

### Test 5 : Modifications Rapides Successives
1. Générer table
2. Modifier cellule A1
3. Immédiatement modifier cellule A2
4. Immédiatement modifier cellule A3
5. Attendre 10s (une seule sauvegarde)
6. F5
7. **Vérifier** : Toutes modifications (A1, A2, A3) préservées ✅

### Test 6 : Isolation Modifications Entre Sessions
1. Chat A : Générer table "Comptes"
2. Chat A : Modifier cellule → Attendre sauvegarde
3. Chat B : Générer table "Comptes" (même nom)
4. Chat B : Modifier cellule → Attendre sauvegarde
5. Chat A : F5 → Vérifier modifications Chat A préservées
6. Chat B : F5 → Vérifier modifications Chat B préservées
7. **Vérifier** : Aucune contamination ✅

---

## ⚠️ Points d'Attention

### Performance
- ⚠️ MutationObserver peut déclencher beaucoup d'événements
- ⚠️ Interval 10s = compromis (trop court = trop de sauvegardes, trop long = perte données)
- ✅ dirtyTables évite sauvegardes inutiles

### Robustesse
- ✅ Gestion erreur si table disparaît avant sauvegarde
- ✅ Logs clairs pour debugging
- ⚠️ Pas de retry automatique si échec sauvegarde

### Amélioration Futures
1. ⏳ Sauvegarde manuelle via bouton (en plus auto)
2. ⏳ Indicateur visuel "Sauvegarde en cours..."
3. ⏳ Notification utilisateur "Modifications sauvegardées"
4. ⏳ Historique versions (undo/redo)
5. ⏳ Export modifications (diff avant/après)

---

## 🔗 Liens Connexes

### Documentation
- `../Doc Integration table - systeme de persistance/` - Problème 2 (intégration)
- `../Doc Modèles Frontier - persistance/01_SITUATION_RESOLUTION_PERSISTANCE.md` - ROOT CAUSES
- `00_MEMO_PROGRESSIF_PERSISTANCE_MODIFICATIONS.md` - Mémo technique complet

### Code Source
- `src/services/flowiseTableBridge.ts` (lignes 2662-2823) - Auto-save system
- `src/services/flowiseTableBridge.ts` (lignes 1467-1600) - Restauration tables

### Tests
- Console F12 → Chercher `[AUTO-SAVE]`
- DevTools → Application → IndexedDB → `clara_database` → `clara_generated_tables`

---

## 📞 Support

**Si modifications perdues** :
1. Vérifier console F12 : logs `[AUTO-SAVE]` présents ?
2. Vérifier IndexedDB : tables avec `source: 'user_edit'` ?
3. Vérifier isolation : bon sessionId ?
4. Consulter mémo technique pour diagnostics

**Si problème performance** :
1. Augmenter interval (10s → 30s)
2. Désactiver temporairement : `bridge.stopAutoSaveSystem()`
3. Réactiver : `bridge.startAutoSaveSystem()`

---

**Dernière mise à jour** : 29 Août 2026 23:30
