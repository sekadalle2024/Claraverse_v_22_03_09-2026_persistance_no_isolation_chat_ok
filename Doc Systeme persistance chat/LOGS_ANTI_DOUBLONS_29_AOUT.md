# 🔍 Guide des Nouveaux Logs Anti-Doublons - 29 Août 2026

Guide rapide pour comprendre les nouveaux logs ajoutés suite aux correctifs anti-doublons.

---

## ✅ LOGS NORMAUX (Système Sain)

### Au Démarrage de l'Application

#### Si aucun doublon détecté
```
[CLEANUP] No duplicates found on startup
```
✅ **Signification** : Le DOM est propre, aucune table en double.

#### Si doublons nettoyés
```
[CLEANUP] Removed duplicate: Table_Balance (table_balance_123)
[CLEANUP] Removed duplicate: Table_Grand_Livre (no-id)
✅ [CLEANUP] Removed 2 duplicate table(s) on startup
```
✅ **Signification** : Des doublons existaient, ils ont été supprimés automatiquement.

---

### Lors de la Restauration de Tables (après F5)

#### Table déjà présente (skip doublon)
```
[ANTI-DOUBLON] Skip "Table_Balance" (ID: abc123)
   Keyword: 1, ID: 0, Wrappers: 0
```
✅ **Signification** : 
- Une table avec keyword "Table_Balance" existe déjà dans le DOM
- La restauration est annulée pour éviter duplication
- Détails : 1 table trouvée par keyword, 0 par ID, 0 wrappers

#### Table absente (restauration effectuée)
```
[VERIFIED] Restoring "Table_Balance" (ID: abc123)
```
✅ **Signification** :
- Aucune table avec ce keyword/ID n'existe
- Vérification triple effectuée (keyword + ID + wrappers)
- Restauration sécurisée en cours

---

### Services Backend Désactivés

Au chargement, vous devez voir :
```
[INFO] Notebook Service: Health checking disabled
[INFO] TTS Service: Health checking disabled
```
✅ **Signification** : Les services n'essaient plus de se connecter au backend inexistant.

**Vous NE devez PLUS voir** :
```
❌ Failed to load resource: net::ERR_CONNECTION_REFUSED
❌ :5001/health:1
```

---

## 🔍 INTERPRÉTATION DÉTAILLÉE

### Log [ANTI-DOUBLON] - Décomposition

```
[ANTI-DOUBLON] Skip "Table_Balance" (ID: abc123)
   Keyword: 1, ID: 0, Wrappers: 0
```

**Décomposition** :
- `Keyword: 1` → 1 table avec `data-keyword="Table_Balance"` trouvée
- `ID: 0` → 0 table avec `data-table-id="abc123"` trouvée
- `Wrappers: 0` → 0 wrapper `.restored-table-wrapper[data-table-id="abc123"]` trouvé

**Interprétation** :
- **Total = 1** → Un élément existe, skip restauration ✅
- Si **Total = 0** → Aucun élément, restauration autorisée ✅
- Si **Total > 1** → Multiples instances (ne devrait plus arriver) ⚠️

---

### Log [CLEANUP] - Décomposition

```
[CLEANUP] Removed duplicate: Table_Balance (table_balance_123)
```

**Signification** :
- Une table avec keyword `Table_Balance` était en doublon
- Elle avait l'ID `table_balance_123`
- Elle a été supprimée du DOM
- Si `(no-id)` → La table n'avait pas de `data-table-id`

**Résumé total** :
```
✅ [CLEANUP] Removed 2 duplicate table(s) on startup
```

---

## 🚨 LOGS PROBLÉMATIQUES

### ⚠️ Problème : Erreurs Backend Persistent

Si vous voyez encore :
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5001/health
```

**Cause** : Le script de correctif n'a pas fonctionné OU le build n'a pas été fait.

**Solution** :
1. Vérifier fichiers modifiés :
   ```powershell
   Select-String -Path "h:\Claverse_1\src\services\claraNotebookService.ts" -Pattern "Health checking disabled"
   ```
   Doit retourner une ligne.

2. Si non trouvé, réappliquer :
   ```powershell
   h:\Claverse_1\apply-patch-safe.ps1
   npm run build
   ```

---

### ⚠️ Problème : Doublons Non Nettoyés

Si après F5, vous avez :
```
[CLEANUP] No duplicates found on startup
```

MAIS dans le DOM, vous voyez 2 fois la même table :
```javascript
// Console
document.querySelectorAll('table[data-keyword="Table_Balance"]')
// Retourne 2 éléments ❌
```

**Cause** : Les tables n'ont pas `data-keyword` défini.

**Diagnostic** :
```javascript
// Console
document.querySelectorAll('table').forEach(t => {
  console.log(t.className, 'keyword:', t.dataset.keyword);
});
```

**Solution** :
- Vérifier que `conso.js` ajoute bien `data-keyword`
- Vérifier ligne 838-850 et 1528-1540 de `public/conso.js`

---

### ⚠️ Problème : [VERIFIED] mais Table Non Visible

Si log montre :
```
[VERIFIED] Restoring "Table_Balance" (ID: abc123)
```

MAIS la table n'apparaît pas dans l'interface :

**Cause** : L'injection DOM échoue après vérification.

**Diagnostic** :
1. Vérifier erreurs JavaScript après ce log
2. Vérifier que conteneur `.markdown-content` existe
3. Vérifier HTML de la table dans IndexedDB

**Solution** :
```javascript
// Console - Vérifier conteneur
document.querySelector('.markdown-content')
// Si null → Conteneur introuvable

// Vérifier tables en IndexedDB
checkIndexedDB()
```

---

### ⚠️ Problème : [ANTI-DOUBLON] Trop Fréquent

Si CHAQUE restauration montre :
```
[ANTI-DOUBLON] Skip "Table_XXX" (ID: xxx)
   Keyword: 1, ID: 1, Wrappers: 1
```

Avec `Total = 3` (somme des 3 valeurs) :

**Cause** : La table existe déjà 3 fois dans le DOM (keyword + ID + wrapper).

**Solution** :
1. Cela indique que le nettoyage initial n'a pas fonctionné
2. Vérifier que `cleanupDuplicateTablesOnStartup()` s'exécute bien :
   ```javascript
   // Dans flowiseTableBridge.ts, ligne ~570
   // Doit contenir:
   this.cleanupDuplicateTablesOnStartup();
   ```

3. Si absent, réappliquer le patch :
   ```powershell
   h:\Claverse_1\apply-patch-safe.ps1
   npm run build
   ```

---

## 🧪 TESTS DE VALIDATION

### Test 1 : Vérifier Nettoyage Fonctionne

**Procédure** :
1. Générer une table (ex: Balance)
2. Dupliquer manuellement dans console :
   ```javascript
   const table = document.querySelector('table[data-keyword="Table_Balance"]');
   const clone = table.cloneNode(true);
   table.parentElement.appendChild(clone);
   console.log('Doublon créé artificiellement');
   ```
3. Recharger page (F5)
4. Vérifier log :
   ```
   [CLEANUP] Removed duplicate: Table_Balance (...)
   ```

✅ **Attendu** : Doublon supprimé automatiquement

---

### Test 2 : Vérifier Anti-Doublon Restauration

**Procédure** :
1. Générer table Balance
2. F5
3. Vérifier log : `[ANTI-DOUBLON] Skip "Table_Balance"` (table déjà présente)
4. Supprimer table du DOM :
   ```javascript
   document.querySelector('table[data-keyword="Table_Balance"]').remove();
   ```
5. Déclencher restauration :
   ```javascript
   const sessionId = document.querySelector('[data-session-id]')?.getAttribute('data-session-id');
   window.flowiseTableBridge.restoreTablesForSession(sessionId);
   ```
6. Vérifier log : `[VERIFIED] Restoring "Table_Balance"`

✅ **Attendu** : Restauration effectuée car table absente

---

### Test 3 : Vérifier Absence Erreurs Backend

**Procédure** :
1. Ouvrir console (F12)
2. Recharger page (F5)
3. Attendre 30 secondes
4. Filtrer logs par "health" ou "5001"

✅ **Attendu** : 
- Présence : `[INFO] ... Health checking disabled`
- Absence : `ERR_CONNECTION_REFUSED`

---

## 📊 COMPARAISON AVANT/APRÈS

### Console - AVANT Correctifs
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5001/health:1
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5001/health:1
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5001/health:1
(répété ~100 fois par minute)

✅ Restored 2 table(s)
(mais doublons visibles dans DOM)
```

### Console - APRÈS Correctifs
```
[INFO] Notebook Service: Health checking disabled
[INFO] TTS Service: Health checking disabled
[CLEANUP] No duplicates found on startup
✅ [INLINE] ISOLATION ACTIVE
✅ Restored 2 table(s)
[ANTI-DOUBLON] Skip "Table_Balance" (ID: abc123)
   Keyword: 1, ID: 0, Wrappers: 0
```

---

## 🎯 CHECKLIST VALIDATION RAPIDE

Après avoir appliqué les correctifs et fait `npm run build` + `npm run dev` :

- [ ] **Logs health disabled** : `[INFO] ... Health checking disabled` × 2
- [ ] **Aucune erreur 5001** : Pas de `ERR_CONNECTION_REFUSED`
- [ ] **Log cleanup au démarrage** : `[CLEANUP]` visible après F5
- [ ] **Log anti-doublon** : `[ANTI-DOUBLON]` ou `[VERIFIED]` lors restauration
- [ ] **DOM propre** : Une seule instance de chaque table
- [ ] **Restauration fonctionne** : Tables visibles après F5

**Si tous cochés → ✅ CORRECTIFS OPÉRATIONNELS**

---

## 📝 MODIFICATIONS MANUELLES REQUISES

### ⚠️ Modification dans flowiseTableBridge.ts

**Fichier** : `src/services/flowiseTableBridge.ts`  
**Ligne** : ~1489  
**Statut** : ⚠️ À FAIRE MANUELLEMENT

**Instructions détaillées** : Voir `QUICK_FIX_GUIDE.md`

**Après modification** :
```bash
npm run build
npm run dev
```

**Vérification** :
```javascript
// Console après F5
// Doit montrer:
[ANTI-DOUBLON] Skip "Table_XXX" (ID: xxx)
// OU
[VERIFIED] Restoring "Table_XXX" (ID: xxx)
```

---

## 🔗 FICHIERS RÉFÉRENCE

- `00_AIDE_MEMOIRE_LOGS.md` - Logs complets système persistance
- `QUICK_FIX_GUIDE.md` - Guide modification manuelle
- `CORRECTIFS_APPLIQUES_29_AOUT_2026.md` - Détails techniques
- `RESOLUTION_PROBLEMES_TABLES_29_AOUT_2026.md` - Analyse approfondie

---

**Dernière mise à jour** : 29 Août 2026 23:15  
**Version** : 1.0  
**Statut** : ✅ Correctifs partiellement appliqués (1 modification manuelle requise)
