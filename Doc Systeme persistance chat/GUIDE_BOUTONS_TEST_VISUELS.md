# 🧪 Guide Boutons de Test Visuels

**Contexte** : Diagnostic persistance sans accès console (impossible de coller code).

**Solution** : Boutons front-end avec popups visuels.

---

## 📍 LOCALISATION

**Position** : Haut-droite de l'écran (colonne verticale de 5 boutons)

**Fichiers** :
- Boutons : `index.html` ligne ~26-46
- Scripts : `public/diagnostic-*.js`

---

## 🎯 BOUTONS DISPONIBLES

### 1️⃣ **🧪 Test Phase 1** (Vert)
**Fonction** : `window.testPhase1()`  
**But** : Vérifier environnement de base (SessionId, services, IndexedDB)

**Utilisation** :
- Cliquer après chargement page
- Popup affiche : `Phase 1: X/5 tests passés`

**Tests** :
1. SessionId présent
2. flowiseTableService chargé
3. flowiseTableBridge chargé
4. IndexedDB accessible
5. Écouteur événements actif

**Attendu** : 4-5/5 tests passés

---

### 2️⃣ **🧪 Test Phase 2** (Bleu)
**Fonction** : `window.testPhase2()`  
**But** : Vérifier modifications code (tags data-*, forceUpdate)

**Utilisation** :
- Générer table d'abord (Assertion/Conclusion/CTR)
- Cliquer après génération
- Popup affiche détails par test

**Tests** :
1. Tags Table_Conso (data-conso-generated, data-table-position)
2. Tags Table_Résultat (data-conso-generated, data-table-position)
3. forceUpdate dans événement émis
4. Bridge reçoit forceUpdate
5. Sauvegarde forcée (pas skip)

**Attendu** : 4-5/5 tests passés

---

### 3️⃣ **🧪 Test Phase 3** (Violet)
**Fonction** : `window.testPhase3Persistance()`  
**But** : Vérifier sauvegarde IndexedDB

**Utilisation** :
- Après génération table
- Cliquer pour vérifier sauvegarde
- Popup affiche résultat + instruction F5

**Tests** :
1. Tables présentes dans DOM
2. Tables dans IndexedDB
3. Sauvegarde manuelle forcée
4. Table sauvegardée dans DB
5. Instructions test reload

**Attendu** : 3-5/5 tests passés

**Note** : Popup indique `💡 Appuyez F5 pour tester persistance !`

---

### 4️⃣ **📊 Diag DB** (Orange) ⭐ NOUVEAU
**Fonction** : `window.diagnosticIndexedDB()`  
**But** : Inspecter contenu IndexedDB (remplace snippet console)

**Utilisation** :
- Après génération table
- Cliquer pour voir contenu DB
- Popup affiche état complet

**Output** :
```
📊 DIAGNOSTIC INDEXEDDB

✅ DB: FloTableDB v2
📦 Total: 2 table(s)

📁 TABLES PAR SESSION:

  📌 481d3e2c...: 2 table(s)
     • Table_Consolidation
       29/08 14:23
     • Table_Resultat
       29/08 14:25

🎯 SESSION ACTUELLE:
   481d3e2c...
   → 2 table(s) pour cette session

✅ ISOLATION OK
Tables correctement sauvegardées
```

**Diagnostics possibles** :
- `⚠️ AUCUNE TABLE EN BASE` → Sauvegarde échoue
- `⚠️ Aucune table pour session actuelle` → SessionId mismatch
- `⚠️ Session non définie` → Pas encore de message envoyé

---

### 5️⃣ **🔍 Diagnostic** (Rouge) ⭐ AMÉLIORÉ
**Fonction** : `window.diagnosticRestauration()`  
**But** : État complet restauration étape par étape

**Utilisation** :
- Avant/après génération table
- Avant/après F5
- Affiche état système complet

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

   Tables trouvées:
   • Table_Consolidation
   • Table_Resultat

━━━━━━━━━━━━━━━━━━━━━━━

✅ SYSTÈME PRÊT

Test persistance:
1. Cliquer "📊 Diag DB"
   → Vérifier tables en DB
2. Appuyer F5 (recharger)
3. Vérifier tables restaurées
4. Re-cliquer "🔍 Diagnostic"
   pour confirmer
```

**États possibles** :
- `❌ SESSION NON DÉFINIE` → Envoyer message d'abord
- `⚠️ AUCUNE TABLE GÉNÉRÉE` → Générer table
- `⚠️ Tables existent mais pas pour session actuelle` → SessionId mismatch
- `✅ SYSTÈME PRÊT` → Prêt pour test F5

---

## 🔄 WORKFLOW DE TEST COMPLET

### Scénario 1 : Premier Test (Page Vide)

1. **Rafraîchir** : Ctrl+F5
2. **🔍 Diagnostic** → Vérifier état initial
   - Attendu : `❌ SESSION NON DÉFINIE`
3. **Envoyer message** dans chat (n'importe quoi)
4. **🔍 Diagnostic** → Confirmer session
   - Attendu : `1️⃣ SESSION ID ✅`
5. **Générer table** :
   ```
   Crée table avec colonnes: Assertion, Conclusion, CTR
   Et 2 lignes de données
   ```
6. **🧪 Test Phase 2** → Vérifier tags
   - Attendu : `4-5/5 tests passés`
7. **📊 Diag DB** → Vérifier sauvegarde
   - Attendu : `📊 Total: 1 table(s)`, session actuelle = 1
8. **F5** (recharger)
9. **🔍 Diagnostic** → Vérifier restauration
   - Attendu : `4️⃣ TABLES DANS DOM ✅ 1 table(s)`

**✅ SUCCÈS** : Tables restaurées après F5  
**❌ ÉCHEC** : Copier logs console F12 et envoyer

---

### Scénario 2 : Diagnostic SessionId Mismatch

1. **Générer table**
2. **📊 Diag DB** → Noter sessionId sauvegarde
   ```
   📌 481d3e2c...: 1 table(s)
   ```
3. **F5**
4. **🔍 Diagnostic** → Noter sessionId restauration
   ```
   1️⃣ SESSION ID
      ✅ 12345678...  ← DIFFÉRENT !
   ```
5. **Si différents** → SessionId mismatch détecté
   - Cause : Bridge utilise mauvais sessionId
   - Solution : Vérifier `stableSessionId` dans `ClaraAssistant.tsx`

---

### Scénario 3 : Sauvegarde Échoue

1. **Générer table**
2. **📊 Diag DB** → Vérifier DB
   ```
   ⚠️ AUCUNE TABLE EN BASE
   ```
3. **Cause** : Sauvegarde échoue silencieusement
4. **Diagnostic** :
   - Ouvrir Console F12
   - Chercher log : `✅ Table saved successfully`
   - Si absent → Événement pas émis ou bridge pas reçu
5. **Solution** :
   - Vérifier `conso.js` ligne 905/1667 (émission événement)
   - Vérifier `flowiseTableBridge.ts` ligne 680+ (réception)

---

## 🚨 MESSAGES D'ERREUR COURANTS

### "❌ ERREUR CRITIQUE - Object store generatedTables manquant"
**Cause** : IndexedDB pas initialisée correctement  
**Solution** : Vérifier `init-indexeddb.js` chargé dans `index.html` ligne ~38

### "⚠️ Tables existent mais pas pour session actuelle"
**Cause** : SessionId différent entre sauvegarde et restauration  
**Solution** :
1. Comparer sessionId dans popup "📊 Diag DB" vs "🔍 Diagnostic"
2. Si différents → Bug isolation, vérifier injection `setCurrentSession()`

### "⚠️ Session non définie (Pas encore de message envoyé)"
**Cause** : Aucun message envoyé dans chat  
**Solution** : Envoyer n'importe quel message pour initialiser session

---

## 📊 COMPARAISON ANCIEN VS NOUVEAU

| Fonctionnalité | Ancien (Console) | Nouveau (Boutons) |
|----------------|------------------|-------------------|
| **Diagnostic IndexedDB** | Copier-coller snippet | Bouton `📊 Diag DB` |
| **État restauration** | Chercher logs manuellement | Bouton `🔍 Diagnostic` |
| **Test phases** | Commandes console | Boutons `🧪 Test Phase 1-3` |
| **SessionId** | `document.querySelector()` | Popup affiche automatiquement |
| **Accessibilité** | Console bloquée | Tout visuel, aucune console requise |

---

## 🎯 AVANTAGES

1. ✅ **Pas besoin console** : Tout fonctionne avec boutons
2. ✅ **Popups lisibles** : Formatage clair, pas de JSON brut
3. ✅ **Diagnostics guidés** : Instructions contextuelles
4. ✅ **Détection problèmes** : Messages d'erreur explicites
5. ✅ **Workflow clair** : Étape par étape

---

## 📂 FICHIERS CONCERNÉS

```
h:\Claverse_1\
├── index.html (ligne ~26-46)              # Boutons HTML
├── public/
│   ├── diagnostic-indexeddb-visual.js     # 📊 Diag DB
│   ├── diagnostic-restauration-visual.js  # 🔍 Diagnostic
│   ├── test-phase-1-diagnostic.js         # 🧪 Test Phase 1
│   ├── test-phase-2-modifications.js      # 🧪 Test Phase 2
│   └── test-phase-3-persistance.js        # 🧪 Test Phase 3
└── Doc Systeme persistance chat/
    └── GUIDE_BOUTONS_TEST_VISUELS.md      # Ce fichier
```

---

## 🔧 MAINTENANCE

### Ajouter nouveau test
1. Créer `public/test-nouveau.js` avec fonction `window.testNouveau()`
2. Ajouter `<script src="/test-nouveau.js"></script>` dans `index.html`
3. Réutiliser bouton existant OU modifier HTML ligne ~26-46

### Modifier popup
- Fichiers : `diagnostic-*.js`
- Variable : `message` (string multi-lignes)
- Format : `alert(message)` pour affichage

### Débug boutons invisibles
- Vérifier `z-index: 999999` dans style inline
- Vérifier position `fixed` pas écrasée par CSS tiers
- Vérifier `<div>` après `<div id="root">` (pas avant)

---

**Dernière mise à jour** : 29 Août 2026 16:25
