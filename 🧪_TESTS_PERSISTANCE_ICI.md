# 🧪 TESTS PERSISTANCE - DÉMARRER ICI

**Date** : 2 Septembre 2026  
**Status** : ✅ Correction implémentée - Tests requis

---

## ⚡ TESTS RAPIDES (5 minutes)

### 📍 Où trouver les documents ?

**Dossier principal** :
```
Doc Systeme persistance chat\
  └── Doc Modèles Frontier - persistance\
      ├── 00_INDEX_DOCUMENTS.md          [📚 INDEX COMPLET]
      ├── 06_TESTS_VALIDATION.md         [🧪 TESTS À FAIRE]
      └── 07_RESUME_CORRECTIONS.md       [📊 RÉSUMÉ]
```

---

## 🎯 ACTIONS IMMÉDIATES

### Étape 1 : Vérifier IndexedDB (1 min)

**Ouvrir dans Chrome** :
```
h:\Claverse_1\test-indexeddb-check.html
```

**Cliquer** : "Vérifier IndexedDB"

**Résultat** :
- ✅ Si tables présentes → Sauvegarde fonctionne
- ❌ Si 0 tables → Sauvegarde ne fonctionne pas

---

### Étape 2 : Lancer Dev Server (1 min)

**Terminal PowerShell** :
```powershell
cd h:\Claverse_1
npm run dev
```

**Attendre** : `Server ready at http://localhost:5173`

---

### Étape 3 : Test Restauration (3 min)

1. **Ouvrir** : http://localhost:5173
2. **Console** : F12 → Console
3. **Générer** : Une table (Programme Travail)
4. **Observer** : Table visible ✅
5. **F5** : Actualiser page
6. **OBSERVER LOGS** :

**Logs ATTENDUS** :
```
🔄 [React Restore] Déclenchement restauration tables...
🔄 [CHRONO] restoreTablesChronologically called
✅ [CHRONO] Global flag check passed
📊 [CHRONO] Timeline retrieved: 1 items
✅ Table restored: table-xxx
✅ [React Restore] Restauration réussie: 1 table(s)
```

7. **VÉRIFIER** : Table réapparaît ✅

---

## ✅ SUCCÈS SI :

- ✅ Logs `[React Restore]` présents
- ✅ Logs `[CHRONO]` présents
- ✅ Log `✅ Table restored` présent
- ✅ **Table visible après F5**

---

## ❌ PROBLÈME SI :

- ❌ Aucun log `[React Restore]` → useEffect pas déclenché
- ❌ Logs présents MAIS table invisible → Injection DOM problème
- ❌ Erreur console → Copier message erreur

---

## 🎯 TEST PROBLÈME ORIGINAL (conso.js)

### Le plus important !

1. **Générer** : Modelised_table
2. **Remplir** : Ligne 1 → Conclusion = "Satisfaisant"
3. **Observer** : Table_Conso générée AUTO ✅
4. **Observer** : Resultat généré AUTO ✅
5. **F5** : Actualiser
6. **VÉRIFIER** :
   - ✅ Modelised_table réapparaît
   - ✅ Table_Conso réapparaît (avec données)
   - ✅ Resultat réapparaît

**SI OUI** → 🎉 **PROBLÈME RÉSOLU !**

---

## 📋 REPORTER RÉSULTATS

Après tests, noter :

### ✅ CE QUI FONCTIONNE :
- [ ] IndexedDB contient tables
- [ ] Logs sauvegarde présents
- [ ] Logs restauration présents
- [ ] Tables réapparaissent après F5
- [ ] Tables conso.js persistantes

### ❌ PROBLÈMES RENCONTRÉS :
- [ ] Décrire problème exact
- [ ] Copier logs erreur
- [ ] Screenshot si nécessaire

---

## 📚 DOCUMENTATION COMPLÈTE

**Pour plus de détails** :
```
Doc Systeme persistance chat\
  Doc Modèles Frontier - persistance\
    00_INDEX_DOCUMENTS.md  ← COMMENCER ICI
```

---

## 🔧 CORRECTIONS APPLIQUÉES

**Fichier modifié** : `src/components/ClaraAssistant.tsx`

**Modifications** :
1. ✅ Import flowiseTableBridge (ligne ~42)
2. ✅ useEffect restauration (ligne ~450)

**Root cause** : React ne déclenchait jamais la restauration

**Solution** : useEffect ajouté pour restaurer tables au chargement session

---

## ⏱️ TEMPS ESTIMÉ

- Vérification IndexedDB : **1 minute**
- Lancer dev server : **1 minute**
- Test restauration : **3 minutes**
- **TOTAL : 5 minutes**

---

## 🆘 BESOIN D'AIDE ?

**Debugging rapide** :

### Si aucun log restauration

**Console navigateur** :
```javascript
// Vérifier bridge chargé
console.log('Bridge:', window.flowiseTableBridge);

// Test manuel
window.flowiseTableBridge?.restoreTablesChronologically([]);
```

### Si tables invisibles mais logs OK

**Console navigateur** :
```javascript
// Compter tables dans DOM
document.querySelectorAll('[data-table-id]').length
```

---

**Créé le** : 2 Septembre 2026 - 21:05  
**Priorité** : 🔴 CRITIQUE  
**Status** : ✅ Prêt pour tests

---

# 🎯 DÉMARRER LES TESTS MAINTENANT

**Action 1** : Ouvrir `test-indexeddb-check.html`  
**Action 2** : Lancer `npm run dev`  
**Action 3** : Tester restauration (F12 → Console → Générer table → F5)

**Temps total** : 5 minutes

**Résultat attendu** : Tables réapparaissent après F5 ✅

---

Bonne chance ! 🚀

