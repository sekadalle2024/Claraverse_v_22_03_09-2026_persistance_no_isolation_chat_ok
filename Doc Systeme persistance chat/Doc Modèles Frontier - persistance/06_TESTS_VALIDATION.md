# 🧪 TESTS PERSISTANCE - GUIDE RAPIDE

**Date** : 2 Septembre 2026  
**Correction** : useEffect restauration ajouté dans ClaraAssistant.tsx

---

## ⚡ TEST RAPIDE (2 minutes)

### Étape 1 : Vérifier IndexedDB

**Ouvrir** : `h:\Claverse_1\test-indexeddb-check.html` dans Chrome

**Cliquer** : "Vérifier IndexedDB"

**Résultat attendu** :
- ✅ Tables présentes → Sauvegarde fonctionne
- ❌ 0 tables → Sauvegarde ne fonctionne pas

---

### Étape 2 : Lancer Dev Server

```powershell
cd h:\Claverse_1
npm run dev
```

**Attendre** : Server ready (http://localhost:5173)

---

### Étape 3 : Test Restauration

1. **Ouvrir** http://localhost:5173
2. **DevTools** → Console (F12)
3. **Générer** une table (ex: Programme Travail)
4. **Observer** table visible ✅
5. **F5** (actualiser page)
6. **OBSERVER CONSOLE** :

**Logs ATTENDUS** (nouveau) :
```
🔄 [React Restore] Déclenchement restauration tables...
🔄 [CHRONO] restoreTablesChronologically called
✅ [CHRONO] Global flag check passed
📊 [CHRONO] Timeline retrieved: 1 items
✅ Table restored: table-xxx (keyword: "Programme Travail")
✅ [React Restore] Restauration réussie: 1 table(s)
```

**Table DOIT réapparaître** ✅

---

## ✅ SUCCÈS SI :

1. ✅ Logs `[React Restore]` présents
2. ✅ Logs `[CHRONO]` présents  
3. ✅ Log `✅ Table restored` présent
4. ✅ **Table visible après F5**

---

## ❌ ÉCHEC SI :

1. ❌ Aucun log `[React Restore]` → useEffect pas déclenché
2. ❌ Logs présents MAIS table invisible → Injection DOM problème
3. ❌ Erreur console → Voir message erreur

---

## 🎯 TEST PROBLÈME ORIGINAL (conso.js)

### Scénario complet

1. **Générer** Modelised_table
2. **Remplir** ligne 1 : Conclusion = "Satisfaisant"
3. **Observer** Table_Conso générée AUTO ✅
4. **Observer** Resultat généré AUTO ✅
5. **F5**
6. **VÉRIFIER** :
   - ✅ Modelised_table réapparaît
   - ✅ Table_Conso réapparaît (avec "Satisfaisant: 1")
   - ✅ Resultat réapparaît

**SI OUI** → 🎉 **PROBLÈME RÉSOLU !**

---

## 🔧 DEBUGGING

### Si aucun log restauration

**Console** :
```javascript
// Vérifier bridge chargé
console.log('Bridge:', window.flowiseTableBridge);

// Vérifier sessionId
console.log('SessionId:', window.flowiseTableBridge?.currentSessionId);

// Test manuel restauration
window.flowiseTableBridge?.restoreTablesChronologically([]);
```

**Si tables apparaissent** → Restauration fonctionne, useEffect problème  
**Si rien** → Bridge ou sauvegarde problème

---

### Si logs présents mais table invisible

**Console** :
```javascript
// Compter tables dans DOM
document.querySelectorAll('[data-table-id]').length

// Si > 0 → Tables injectées mais masquées (CSS)
// Si 0 → Container DOM introuvable
```

---

## 📊 RAPPORT

Après tests, noter :

**✅ SUCCÈS** :
- [ ] IndexedDB contient tables
- [ ] Logs sauvegarde présents
- [ ] Logs restauration présents
- [ ] Tables réapparaissent après F5
- [ ] Tables conso.js persistantes

**❌ PROBLÈMES** :
- [ ] Décrire problème exact
- [ ] Copier logs erreur
- [ ] Screenshot si nécessaire

---

**Temps estimé** : 5 minutes  
**Priorité** : CRITIQUE  
**Blocage** : Développement en attente validation

