# 📝 Mémo : Ajout Boutons Diagnostics Visuels

**Date** : 29 Août 2026 16:25  
**Contexte** : Utilisateur ne peut pas coller code dans console F12  
**Solution** : Boutons front-end avec diagnostics visuels en popup

---

## 🎯 PROBLÈME RÉSOLU

**Avant** :
- ❌ Diagnostic nécessitait copier-coller snippet console
- ❌ Console bloquée (pas de saisie possible)
- ❌ Logs illisibles/perdus dans console

**Après** :
- ✅ 2 nouveaux boutons diagnostics visuels
- ✅ Popups formatés, lisibles, avec instructions
- ✅ Aucune interaction console requise

---

## 🆕 MODIFICATIONS APPLIQUÉES

### 1. Bouton "📊 Diag DB" (réutilisation bouton "ℹ️ Aide")

**Fichier** : `index.html` ligne ~32  
**Fonction** : `window.diagnosticIndexedDB()`  
**Script** : `public/diagnostic-indexeddb-visual.js` (créé)

**But** : Remplacer snippet console pour inspecter IndexedDB

**Output** :
```
📊 DIAGNOSTIC INDEXEDDB

✅ DB: FloTableDB v2
📦 Total: 2 table(s)

📁 TABLES PAR SESSION:
  📌 481d3e2c...: 2 table(s)
     • Table_Consolidation
       29/08 14:23

🎯 SESSION ACTUELLE:
   481d3e2c...
   → 2 table(s) pour cette session

✅ ISOLATION OK
```

**Diagnostics inclus** :
- ✅ Compte tables total
- ✅ Groupe par session
- ✅ Compare session actuelle vs tables sauvegardées
- ✅ Détecte sessionId mismatch
- ✅ Détecte si aucune table en DB

---

### 2. Bouton "🔍 Diagnostic" (amélioration)

**Fichier** : `index.html` ligne ~38  
**Fonction** : `window.diagnosticRestauration()` (remplace `diagnosticCompletPersistance`)  
**Script** : `public/diagnostic-restauration-visual.js` (créé)

**But** : État complet restauration étape par étape

**Output** :
```
🔍 DIAGNOSTIC RESTAURATION

1️⃣ SESSION ID
   ✅ 481d3e2c...

2️⃣ BRIDGE
   ✅ Chargé

3️⃣ INDEXEDDB
   ✅ DB ouverte (v2)
   📊 Total: 2 table(s)
   🎯 Session actuelle: 2

4️⃣ TABLES DANS DOM
   ✅ 2 table(s) générée(s)

✅ SYSTÈME PRÊT

Test persistance:
1. Cliquer "📊 Diag DB"
2. Appuyer F5
3. Vérifier tables restaurées
```

**États détectés** :
- ✅ Session non définie → Instructions envoyer message
- ✅ Aucune table générée → Instructions générer table
- ✅ SessionId mismatch → Alerte isolation compromise
- ✅ Système prêt → Instructions test F5

---

### 3. Logs Debug dans flowiseTableBridge.ts

**Fichier** : `src/services/flowiseTableBridge.ts`

**Ajouts** :

#### Ligne ~2353 (dans `restoreTablesChronologically`)
```typescript
console.log(`📊 [DEBUG] Timeline récupérée: ${timeline.length} items total`);
console.log(`📊 [DEBUG] Timeline détail:`, timeline.map(...));
console.log(`📊 [DEBUG] Après filtrage session: ${filteredTimeline.length} items`);
console.log(`📊 [DEBUG] Tables à restaurer: ${tableItems.length}`);
```

**But** : Identifier où restauration échoue (timeline vide ? filtrage ? type 'table' manquant ?)

#### Ligne ~783 (dans `handleTableIntegrated`)
```typescript
console.log(`💾 [DEBUG] Sauvegarde table: keyword="${keyword}", sessionId="${this.currentSessionId?.substring(0, 8)}...", messageId="${messageId}"`);
```

**But** : Vérifier sessionId utilisé pendant sauvegarde

---

## 📂 FICHIERS CRÉÉS

```
h:\Claverse_1\
├── public/
│   ├── diagnostic-indexeddb-visual.js          # Nouveau
│   └── diagnostic-restauration-visual.js       # Nouveau
└── Doc Systeme persistance chat/
    ├── GUIDE_BOUTONS_TEST_VISUELS.md           # Nouveau (doc complète)
    ├── SNIPPET_DIAGNOSTIC_INDEXEDDB.js         # Nouveau (ref, non utilisé)
    ├── DIAGNOSTIC_ETAPE_PAR_ETAPE.md           # Nouveau (guide détaillé)
    └── 00_MEMO_AJOUT_BOUTONS_DIAGNOSTICS_*.md  # Ce fichier
```

---

## 📂 FICHIERS MODIFIÉS

```
h:\Claverse_1\
├── index.html
│   └── Ligne ~32 : Bouton "ℹ️ Aide" → "📊 Diag DB"
│   └── Ligne ~38 : Bouton "🔍 Diagnostic" → fonction remplacée
│   └── Ligne ~172 : Ajout scripts diagnostics
├── src/services/flowiseTableBridge.ts
│   └── Ligne ~2353-2380 : Logs debug restauration
│   └── Ligne ~783 : Log debug sauvegarde
└── Doc Systeme persistance chat/00_AIDE_MEMOIRE_LOGS.md
    └── Ligne ~fin : Section "LOGS DE RESTAURATION PHASE 2"
```

---

## 🧪 PROCÉDURE DE TEST

### Test Rapide (2 min)

1. **Rafraîchir** : Ctrl+F5 sur http://localhost:5174/
2. **Cliquer "🔍 Diagnostic"** → Voir état initial
3. **Générer table** dans chat (Assertion/Conclusion/CTR)
4. **Cliquer "📊 Diag DB"** → Vérifier sauvegarde
5. **F5** (recharger)
6. **Cliquer "🔍 Diagnostic"** → Vérifier restauration

**✅ SUCCÈS** : Popup affiche `4️⃣ TABLES DANS DOM ✅ X table(s)`  
**❌ ÉCHEC** : Popup affiche erreur → Copier message et envoyer

---

### Test Complet (5 min)

Suivre : `GUIDE_BOUTONS_TEST_VISUELS.md` > Section "WORKFLOW DE TEST COMPLET"

---

## 🎯 AVANTAGES

| Avant (Console) | Après (Boutons) |
|-----------------|-----------------|
| Copier-coller snippet | 1 clic |
| Chercher logs manuellement | Popup formaté |
| Console bloquée | Aucune console requise |
| Logs perdus dans console | Popup persistent |
| Pas d'instructions | Instructions contextuelles |

---

## 🔍 POINTS DE DIAGNOSTIC

Les nouveaux boutons diagnostiquent **9 points critiques** :

### Bouton "📊 Diag DB"
1. ✅ DB ouverte (version, object stores)
2. ✅ Tables présentes en DB (total)
3. ✅ Tables groupées par session
4. ✅ Session actuelle identifiée
5. ✅ Tables pour session actuelle (isolation)

### Bouton "🔍 Diagnostic"
6. ✅ SessionId défini
7. ✅ Bridge chargé
8. ✅ IndexedDB accessible + contenu
9. ✅ Tables dans DOM

---

## 📊 LOGS CONSOLE (Toujours Disponibles)

Les boutons **complètent** les logs console (pas remplacer).

**Logs console toujours utiles pour** :
- Sauvegarde : `✅ Table saved successfully`
- Restauration : `🔄 Restoring tables chronologically`
- Timeline : `📊 [DEBUG] Timeline récupérée: X items`
- Erreurs : `❌ Error...`

**Boutons utiles pour** :
- État système global
- Contenu IndexedDB
- Instructions prochaines étapes
- Diagnostics sans accès console

---

## 🚨 ROLLBACK SI PROBLÈME

Si nouveaux boutons causent problème :

```powershell
cd h:\Claverse_1
git diff index.html  # Voir modifications
git checkout index.html  # Annuler boutons
# OU restaurer commit précédent
```

**Fichiers à supprimer si rollback** :
- `public/diagnostic-indexeddb-visual.js`
- `public/diagnostic-restauration-visual.js`

**Logs debug dans flowiseTableBridge.ts** :
- Peuvent rester (utiles même sans boutons)
- Ou supprimer manuellement ligne ~2353-2380 et ~783

---

## 📞 PROCHAINES ÉTAPES

1. **Tester boutons** (suivre procédure ci-dessus)
2. **Si "📊 Diag DB" affiche tables** → ✅ Sauvegarde fonctionne
3. **Si "🔍 Diagnostic" après F5 affiche tables** → ✅ Restauration fonctionne
4. **Si échec** → Copier message popup + logs console et envoyer

---

## 🎓 DOCUMENTATION LIÉE

- **Guide complet** : `GUIDE_BOUTONS_TEST_VISUELS.md`
- **Diagnostic étape par étape** : `DIAGNOSTIC_ETAPE_PAR_ETAPE.md`
- **Logs console** : `00_AIDE_MEMOIRE_LOGS.md`
- **Snippet référence** : `SNIPPET_DIAGNOSTIC_INDEXEDDB.js` (non utilisé, ref seulement)

---

**✅ Modifications terminées et documentées**

**🧪 Prêt pour test utilisateur**

---

**Créé le** : 29 Août 2026 16:25  
**Auteur** : Kiro (diagnostic persistance Phase 2)
