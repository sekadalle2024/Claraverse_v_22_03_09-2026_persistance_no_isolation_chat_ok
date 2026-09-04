# ✅ Tests à Effectuer Après le Build

## 🎯 Contexte

**Tous les correctifs ont été appliqués avec succès** :
1. ✅ Erreurs backend désactivées
2. ✅ Nettoyage doublons au démarrage
3. ✅ Anti-doublon renforcé lors restauration

**Prochaine étape** : Tester dans le navigateur

---

## 📋 CHECKLIST DE TESTS

### ✅ Test 1 : Démarrage de l'Application

**Commandes** :
```bash
npm run build
npm run dev
```

**Vérifier** :
- Build sans erreur TypeScript
- Dev server démarre sur http://localhost:5173

---

### ✅ Test 2 : Console au Chargement

**Procédure** :
1. Ouvrir http://localhost:5173 dans navigateur
2. Ouvrir console (F12)
3. Observer les premiers logs

**Logs attendus** :
```
[INFO] Notebook Service: Health checking disabled
[INFO] TTS Service: Health checking disabled
[CLEANUP] No duplicates found on startup
```
OU
```
[CLEANUP] Removed X duplicate table(s) on startup
```

**Logs à NE PLUS voir** :
```
❌ Failed to load resource: net::ERR_CONNECTION_REFUSED
❌ :5001/health
```

**Résultat** : ✅ Console propre, pas d'erreurs backend

---

### ✅ Test 3 : Génération d'une Table

**Procédure** :
1. Envoyer un message qui génère une table
   - Exemple : "Affiche Balance" ou "Grand Livre"
2. Observer la console pendant la génération

**Logs attendus** (si table se sauvegarde) :
```
💾 [DEBUG] Sauvegarde table: keyword="Table_Balance", sessionId="xxx..."
✅ Table saved successfully: zzz (linked to message: yyy)
```

**Résultat** : ✅ Table générée et sauvegardée

---

### ✅ Test 4 : Restauration après F5

**Procédure** :
1. Après avoir généré une table (Test 3)
2. **F5** pour recharger la page
3. Observer les logs console

**Logs attendus** :
```
[CLEANUP] No duplicates found on startup
🔄 Restoring tables chronologically for session: xxx
📊 [DEBUG] Timeline récupérée: X items total
📊 [DEBUG] Tables à restaurer: 1
[VERIFIED] Restoring "Table_Balance" (ID: abc123)
✅ Restored 1 table(s) chronologically
```

**Résultat** : ✅ Table restaurée et visible dans l'interface

---

### ✅ Test 5 : Anti-Doublon (Deuxième F5)

**Procédure** :
1. Après avoir restauré la table (Test 4)
2. **F5** à nouveau
3. Observer les logs console

**Logs attendus** :
```
[CLEANUP] No duplicates found on startup
🔄 Restoring tables chronologically for session: xxx
[ANTI-DOUBLON] Skip "Table_Balance" (ID: abc123)
   Keyword: 1, ID: 0, Wrappers: 0
```

**Résultat** : ✅ Doublon détecté et évité, une seule table dans DOM

---

### ✅ Test 6 : Vérification DOM

**Procédure** :
1. Ouvrir console (F12)
2. Copier-coller ce code :

```javascript
// Vérifier unicité des tables
const tables = document.querySelectorAll('table[data-keyword]');
const keywords = {};
tables.forEach(t => {
  const k = t.dataset.keyword;
  keywords[k] = (keywords[k] || 0) + 1;
});
console.log('📊 Comptage des tables par keyword:');
console.table(keywords);

// Vérifier que tous les compteurs sont à 1
const hasDuplicates = Object.values(keywords).some(count => count > 1);
if (hasDuplicates) {
  console.error('❌ DOUBLONS DÉTECTÉS!');
} else {
  console.log('✅ Aucun doublon, DOM propre');
}
```

**Résultat attendu** :
```
📊 Comptage des tables par keyword:
┌─────────────────────┬────────┐
│     (index)         │ Values │
├─────────────────────┼────────┤
│  Table_Balance      │   1    │
│  Table_Grand_Livre  │   1    │
└─────────────────────┴────────┘
✅ Aucun doublon, DOM propre
```

**Résultat** : ✅ Chaque table unique dans le DOM

---

### ✅ Test 7 : Changement de Chat

**Procédure** :
1. Dans Chat 1 : Générer une table Balance
2. Créer un nouveau chat (Chat 2)
3. Observer les logs

**Logs attendus** :
```
🔄 [INLINE] CHANGEMENT DE CHAT DÉTECTÉ!
   Ancien sessionId: clara-session-ABC...
   Nouveau sessionId: clara-session-XYZ...
🔄 [INLINE] Restauration automatique pour nouveau chat...
```

4. Revenir à Chat 1
5. Vérifier que la table Balance réapparaît

**Résultat** : ✅ Isolation des chats fonctionne

---

### ✅ Test 8 : Durée sur 30 secondes

**Procédure** :
1. Console ouverte (F12)
2. Ne rien toucher pendant 30 secondes
3. Observer les logs

**Logs à NE PLUS voir** :
```
❌ Failed to load resource: ERR_CONNECTION_REFUSED
❌ :5001/health
```

**Résultat** : ✅ Aucune erreur backend récurrente

---

## 📊 TABLEAU DE VALIDATION

| Test | Description | Résultat | Notes |
|------|-------------|----------|-------|
| 1 | Build & Dev Server | ⬜ | |
| 2 | Console au chargement | ⬜ | Vérifier logs [INFO] et [CLEANUP] |
| 3 | Génération table | ⬜ | Vérifier sauvegarde |
| 4 | Restauration F5 | ⬜ | Vérifier [VERIFIED] |
| 5 | Anti-doublon (2e F5) | ⬜ | Vérifier [ANTI-DOUBLON] |
| 6 | DOM propre | ⬜ | Snippet JavaScript |
| 7 | Changement chat | ⬜ | Vérifier isolation |
| 8 | Durée 30s | ⬜ | Vérifier absence erreurs |

**Cocher ✅ quand le test réussit**

---

## 🐛 EN CAS DE PROBLÈME

### Problème : Erreurs TypeScript au Build

**Symptôme** :
```
Error: TS2304: Cannot find name 'totalExisting'
```

**Solution** :
```powershell
# Vérifier la syntaxe du fichier modifié
Get-Content "h:\Claverse_1\src\services\flowiseTableBridge.ts" -Encoding UTF8 | Select-Object -Skip 1536 -First 30
```

Si erreur de syntaxe, restaurer backup :
```powershell
Copy-Item "h:\Claverse_1\src\services\flowiseTableBridge.ts.backup-manual-20260904-010252" `
          "h:\Claverse_1\src\services\flowiseTableBridge.ts"
npm run build
```

---

### Problème : Logs [ANTI-DOUBLON] N'Apparaissent Pas

**Cause** : Modification pas prise en compte

**Solution** :
1. Vérifier que le build a été fait après la modification
2. Vérifier le cache navigateur (Ctrl+Shift+R)
3. Vérifier le code dans flowiseTableBridge.ts ligne 1537

---

### Problème : Tables Toujours en Double

**Diagnostic** :
```javascript
// Console
document.querySelectorAll('table[data-keyword="Table_Balance"]').length
// Si > 1 → Problème
```

**Solution** :
1. Vérifier log [CLEANUP] au démarrage
2. Vérifier log [ANTI-DOUBLON] lors restauration
3. Forcer nettoyage manuel :
```javascript
// Console
const duplicates = document.querySelectorAll('table[data-keyword]');
const seen = new Set();
duplicates.forEach(t => {
  const k = t.dataset.keyword;
  if (seen.has(k)) t.remove();
  else seen.add(k);
});
```

---

### Problème : Erreurs Backend Persistent

**Symptôme** :
```
Failed to load resource: ERR_CONNECTION_REFUSED
:5001/health
```

**Solution** :
1. Vérifier que les services ont été modifiés :
```powershell
Select-String -Path "h:\Claverse_1\src\services\claraNotebookService.ts" -Pattern "Health checking disabled"
```

2. Si non trouvé, réappliquer le patch :
```powershell
h:\Claverse_1\apply-patch-safe.ps1
npm run build
```

---

## 📚 DOCUMENTATION RÉFÉRENCE

**Logs complets** : `Doc Systeme persistance chat/00_AIDE_MEMOIRE_LOGS.md`  
**Logs anti-doublons** : `Doc Systeme persistance chat/LOGS_ANTI_DOUBLONS_29_AOUT.md`  
**Détails correctifs** : `CORRECTIFS_APPLIQUES_29_AOUT_2026.md`  
**Analyse technique** : `RESOLUTION_PROBLEMES_TABLES_29_AOUT_2026.md`

---

## 🎯 OBJECTIF FINAL

**Tous les tests doivent être ✅ pour valider les correctifs**

Après validation :
- ✅ Plus d'erreurs backend
- ✅ Plus de doublons
- ✅ Persistance fonctionnelle
- ✅ Isolation des chats opérationnelle

---

**Bon courage pour les tests ! 🚀**
