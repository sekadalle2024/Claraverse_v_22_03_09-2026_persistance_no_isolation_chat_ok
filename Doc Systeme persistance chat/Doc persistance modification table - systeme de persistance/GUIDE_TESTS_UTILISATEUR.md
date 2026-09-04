# 🧪 Guide Tests Utilisateur - Persistance Modifications

**Date** : 29 Août 2026  
**Objectif** : Valider que les modifications utilisateur sont persistées après F5

---

## 🎯 Ce Qu'on Teste

**Fonctionnalité** : Auto-save modifications tables

**Critère succès** : Après modification table + F5 → Modifications préservées (pas version initiale LLM)

---

## ✅ Test 1 : Édition Cellule Simple

### Procédure
1. **Générer table** via GPT-4 (ex: "Crée une table de 3 comptes")
2. **Attendre** que la table s'affiche
3. **Double-cliquer** sur une cellule pour l'éditer
4. **Modifier** le texte (ex: "Compte 1" → "Compte Principal")
5. **Cliquer** en dehors de la cellule (blur)
6. **Observer console F12** :
   ```
   🔄 [AUTO-SAVE] Table modifiée détectée: "xxx"
   ```
7. **Attendre 10 secondes**
8. **Observer console F12** :
   ```
   💾 [AUTO-SAVE] Sauvegarde de 1 table(s) modifiée(s)...
   ✅ [AUTO-SAVE] Table "xxx" sauvegardée
   ```
9. **F5** (recharger page)
10. **VÉRIFIER** : Texte modifié toujours présent ("Compte Principal")

### Résultat Attendu
✅ Modification préservée après F5

### Si Échec
- Console montre `🔄 Table modifiée` ? → OUI = MutationObserver OK
- Console montre `💾 Sauvegarde` ? → OUI = Sauvegarde déclenchée OK
- DevTools → IndexedDB → `clara_database` contient table avec `source: "user_edit"` ?
- F5 restaure version initiale ? → Problème restauration (voir Problème 2)

---

## ✅ Test 2 : Ajout Ligne (Si Éditable)

### Procédure
1. **Générer table** (3 lignes initialement)
2. **Ajouter ligne** (selon interface disponible)
   - Si bouton "+" : Cliquer bouton
   - Si menu contextuel : Clic droit → "Ajouter ligne"
   - Si aucune interface : Skip ce test
3. **Remplir nouvelle ligne** avec données
4. **Observer logs** `[AUTO-SAVE]` (modif détectée + sauvegarde après 10s)
5. **F5**
6. **VÉRIFIER** : 4 lignes présentes (3 + 1 ajoutée)

### Résultat Attendu
✅ Nouvelle ligne préservée après F5

---

## ✅ Test 3 : Ajout Colonne (Si Éditable)

### Procédure
1. **Générer table** (3 colonnes initialement)
2. **Ajouter colonne** (selon interface)
3. **Remplir en-tête colonne** (ex: "Nouveau")
4. **Observer logs** `[AUTO-SAVE]`
5. **F5**
6. **VÉRIFIER** : 4 colonnes présentes (3 + 1 ajoutée)

### Résultat Attendu
✅ Nouvelle colonne préservée après F5

---

## ✅ Test 4 : Modifications Multiples Tables

### Procédure
1. **Générer 3 tables** distinctes (via 3 prompts GPT-4)
2. **Modifier table 1** : Éditer cellule
3. **Modifier table 2** : Éditer cellule
4. **Modifier table 3** : Éditer cellule
5. **Observer console** :
   ```
   🔄 [AUTO-SAVE] Table modifiée détectée: "Table1"
   🔄 [AUTO-SAVE] Table modifiée détectée: "Table2"
   🔄 [AUTO-SAVE] Table modifiée détectée: "Table3"
   ```
6. **Attendre 10s**
7. **Observer console** :
   ```
   💾 [AUTO-SAVE] Sauvegarde de 3 table(s) modifiée(s)...
   ✅ [AUTO-SAVE] 3 table(s) sauvegardée(s): Table1, Table2, Table3
   ```
8. **F5**
9. **VÉRIFIER** : 3 tables avec modifications préservées

### Résultat Attendu
✅ Toutes modifications préservées après F5

---

## ✅ Test 5 : Modifications Rapides Successives

### Objectif
Vérifier que modifications successives sur même table sont regroupées

### Procédure
1. **Générer table**
2. **Modifier cellule A1** → "Texte1"
3. **Immédiatement modifier cellule A2** → "Texte2"
4. **Immédiatement modifier cellule A3** → "Texte3"
5. **Observer console** : Seulement **1 log** `Table modifiée détectée` (pas 3)
   - Raison : Set dirtyTables évite doublons
6. **Attendre 10s**
7. **Observer console** : **1 sauvegarde** (pas 3)
8. **F5**
9. **VÉRIFIER** : 3 cellules (A1, A2, A3) ont modifications préservées

### Résultat Attendu
✅ Toutes modifications préservées avec une seule sauvegarde

---

## ✅ Test 6 : Isolation Entre Sessions (CRITIQUE)

### Objectif
Vérifier que modifications d'un chat n'affectent pas autre chat

### Procédure
1. **Chat A** : Générer table "Comptes" avec 3 lignes
2. **Chat A** : Modifier cellule "Compte 1" → "Compte ALPHA"
3. **Chat A** : Attendre sauvegarde (10s)
4. **Chat B** (nouveau chat) : Générer table "Comptes" avec 3 lignes (même structure)
5. **Chat B** : Modifier cellule "Compte 1" → "Compte BETA"
6. **Chat B** : Attendre sauvegarde (10s)
7. **Chat A** : F5
8. **VÉRIFIER Chat A** : Cellule = "Compte ALPHA" (pas "BETA")
9. **Chat B** : F5
10. **VÉRIFIER Chat B** : Cellule = "Compte BETA" (pas "ALPHA")

### Résultat Attendu
✅ Modifications isolées par session (0 contamination)

### Si Échec
❌ **PROBLÈME CRITIQUE** - Isolation cassée
- Vérifier `sessionId` dans logs sauvegarde
- Vérifier `sessionId` dans DevTools IndexedDB
- Consulter documentation isolation (Problème résolu antérieur)

---

## 📊 Résumé Tests

| Test | Description | Priorité | Résultat Attendu |
|------|-------------|----------|------------------|
| **Test 1** | Édition cellule simple | 🔴 CRITIQUE | ✅ Modif préservée |
| **Test 2** | Ajout ligne | 🟡 IMPORTANTE | ✅ Ligne préservée |
| **Test 3** | Ajout colonne | 🟡 IMPORTANTE | ✅ Colonne préservée |
| **Test 4** | Modifications multiples | 🟢 NORMALE | ✅ Toutes préservées |
| **Test 5** | Modifications rapides | 🟢 NORMALE | ✅ Toutes préservées |
| **Test 6** | Isolation sessions | 🔴 CRITIQUE | ✅ 0 contamination |

---

## 🔍 Logs Console à Observer

### Logs Succès

**Modification détectée** :
```
🔄 [AUTO-SAVE] Table modifiée détectée: "Compte"
```

**Sauvegarde déclenchée** :
```
💾 [AUTO-SAVE] Sauvegarde de 1 table(s) modifiée(s)...
✅ [AUTO-SAVE] Table "Compte" sauvegardée (ID: xxx-xxx-xxx)
✅ [AUTO-SAVE] 1 table(s) sauvegardée(s): Compte
```

**Restauration** (après F5) :
```
📊 [7/7] INJECTION DOM (1 tables)...
   🔄 Restauration "Compte"...
   🆕 Creating new table for keyword "Compte"
   ✅ Created and injected new table "Compte"
```

### Logs Problème

**Table introuvable** :
```
⚠️ [AUTO-SAVE] Table "xxx" introuvable dans DOM, skip
```
→ Table supprimée avant sauvegarde (acceptable)

**Erreur sauvegarde** :
```
❌ [AUTO-SAVE] Erreur sauvegarde table "xxx": [error message]
```
→ Problème IndexedDB (quota, corruption, mode privé)

**Échec isolation** :
```
🚫 [ISOLATION] Table autre session filtrée
```
→ Si absent = problème isolation

---

## 🛠️ Debugging

### Vérifier Système Actif

**Console F12** :
```javascript
// Vérifier auto-save démarré
window.flowiseTableBridge.mutationObserver !== null
// Résultat attendu: true

// Vérifier tables en attente sauvegarde
window.flowiseTableBridge.dirtyTables.size
// Résultat attendu: 0 (si aucune modif) ou >0 (si modifs non sauvegardées)
```

### Forcer Sauvegarde Immédiate

**Console F12** :
```javascript
// Ne pas attendre 10s, sauvegarder maintenant
await window.flowiseTableBridge.performAutoSave();
// Logs: [AUTO-SAVE] Sauvegarde de X tables...
```

### Vérifier IndexedDB

**DevTools** :
1. F12 → Onglet **Application**
2. Gauche → **IndexedDB** → `clara_database` → `clara_generated_tables`
3. Chercher entrées avec `source: "user_edit"`
4. Cliquer ligne → Vérifier `html` contient modifications

### Arrêter/Redémarrer Système

**Arrêter** (si besoin debug) :
```javascript
window.flowiseTableBridge.stopAutoSaveSystem();
```

**Redémarrer** :
```javascript
window.flowiseTableBridge.startAutoSaveSystem();
```

---

## ✅ Critères Validation Globale

**Pour considérer Problème 1 RÉSOLU** :
1. ✅ Test 1 (édition cellule) passé
2. ✅ Test 2 ou 3 (ajout ligne/colonne) passé
3. ✅ Test 4 (modifications multiples) passé
4. ✅ Test 6 (isolation) passé (CRITIQUE)
5. ✅ Logs console cohérents et complets
6. ✅ IndexedDB contient tables avec `source: "user_edit"`
7. ✅ 0 erreur sauvegarde
8. ✅ 0 contamination sessions

---

## 📝 Rapport Tests

**Après exécution tests, documenter** :
- ✅ Tests passés : [liste]
- ❌ Tests échoués : [liste + raison]
- ⚠️ Problèmes observés : [description]
- 📊 Métriques : Temps sauvegarde moyen, taille tables, etc.

---

**Prêt à tester ?** Commencez par Test 1 (édition cellule simple) ! 🚀
