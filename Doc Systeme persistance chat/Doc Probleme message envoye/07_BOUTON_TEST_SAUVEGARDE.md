# 🧪 Bouton Test Sauvegarde - Guide d'Utilisation

**Date**: 29 Août 2026  
**Objectif**: Tester manuellement la sauvegarde des tables pour identifier les blocages

---

## 🎯 Accès au Bouton

### Localisation
**Bouton 🔍** en bas à droite de l'écran → Ouvre panneau de diagnostic

### Boutons Disponibles

1. **🚀 Diagnostic Complet** - Vue d'ensemble système (session, storage, tables)
2. **🧪 Test Sauvegarde** - ⭐ **NOUVEAU** - Test manuel de sauvegarde d'une table
3. **🔑 Session ID** - Affiche uniquement info session
4. **💾 Storage** - Affiche uniquement info localStorage
5. **🗑️ Effacer** - Supprime toutes les données

---

## 🧪 Utilisation "Test Sauvegarde"

### Pré-requis
1. Au moins une table doit être présente dans le chat
2. Attendre ~7 secondes après chargement de la page (pour que conso.js se charge)

### Procédure

#### 1. Créer une Table
Demandez à Clara de créer une table simple :
```
Créez une table avec 3 colonnes : Nom, Prénom, Âge
```

#### 2. Ouvrir le Diagnostic
Cliquez sur le bouton **🔍** en bas à droite

#### 3. Lancer le Test
Cliquez sur **🧪 Test Sauvegarde**

#### 4. Ouvrir la Console
Appuyez sur **F12** pour ouvrir la console du navigateur

#### 5. Analyser les Logs

**Logs attendus (sauvegarde réussie)** :
```
================================================================================
🧪 TEST MANUEL DE SAUVEGARDE
================================================================================

📊 Test sur première table:
   Keyword: Nom
   Lignes: 4
   Observer installé: true

⏳ Appel de saveTableDataNow()...
💾 [INLINE] Interception sauvegarde table
🔑 [INLINE] Keyword: Nom
📍 [INLINE] SessionId: clara-session-xxx...
✅ [INLINE] Événement émis pour: Nom
💾 [Bridge] Handling save request for: Nom
✅ Table saved successfully: xxx-xxx-xxx

📊 VÉRIFICATION INDEXEDDB:
   Tables dans cette session: 1
   ✅ Tables sauvegardées:
     - Nom (00:02:15)
```

**Logs d'erreur (sauvegarde échouée)** :

**Erreur #1 : SessionId manquant**
```
⚠️ [INLINE] Sauvegarde ignorée - SessionId pas encore disponible
   Table: Nom
   Réessayez dans 100ms...
❌ [INLINE] SessionId toujours indisponible après retry
   Table NON sauvegardée: Nom
```
→ **Solution** : Vérifier que React expose `data-session-id` sur un élément DOM

**Erreur #2 : Doublon détecté**
```
ℹ️ Table unchanged, skipping duplicate
```
→ **Solution** : La table existe déjà, contenu identique → Normal si vous retestez

**Erreur #3 : Bridge non chargé**
```
💾 [INLINE] Interception sauvegarde table
✅ [INLINE] Événement émis pour: Nom
(puis rien)
```
→ **Solution** : flowiseTableBridge.ts n'écoute pas l'événement

---

## 📊 Interprétation des Résultats

### ✅ Succès Total
```
📊 VÉRIFICATION INDEXEDDB:
   Tables dans cette session: 1+
   ✅ Tables sauvegardées:
     - Nom (00:02:15)
```
→ **La persistance fonctionne !** Actualisez la page (F5) pour tester la restauration

### ❌ Échec - 0 tables dans IndexedDB
```
📊 VÉRIFICATION INDEXEDDB:
   Tables dans cette session: 0
   ❌ Aucune table sauvegardée
```
→ **La sauvegarde échoue quelque part**, remontez dans les logs pour trouver où

### ⚠️ Échec Partiel
```
📊 VÉRIFICATION INDEXEDDB:
   Tables dans cette session: 3
   ✅ Tables sauvegardées:
     - Table_Consolidation (00:01:45)
     - Table_Resultat (00:01:46)
     (mais pas la table testée)
```
→ Seules certaines tables se sauvent (Table_Consolidation/Resultat de conso.js OK, mais autres tables KO)

---

## 🔧 Commandes Console Avancées

### Vérifier Composants Chargés
```javascript
console.log('claraverseProcessor:', !!window.claraverseProcessor);
console.log('flowiseTableBridge:', !!window.flowiseTableBridge);
console.log('flowiseTableService:', !!window.flowiseTableService);
```

### Vérifier SessionId
```javascript
const el = document.querySelector('[data-session-id]');
console.log('SessionId:', el?.dataset.sessionId);
```

### Lister Toutes les Tables IndexedDB
```javascript
window.flowiseTableService.getAllTables().then(tables => {
  console.log(`📊 Total: ${tables.length} table(s)`);
  tables.forEach(t => {
    console.log(`  - ${t.keyword} (session: ${t.sessionId.substring(0, 20)}...)`);
  });
});
```

### Forcer Sauvegarde sur Table Spécifique
```javascript
const tables = document.querySelectorAll('table');
const maTable = tables[1]; // Deuxième table
window.claraverseProcessor.saveTableDataNow(maTable);
```

### Lancer Diagnostic Détaillé
```javascript
window.runPersistenceDiagnostic();
```

---

## 🐛 Points de Blocage Connus

### 1. SessionId Pas Encore Disponible
**Symptôme** : `⚠️ Sauvegarde ignorée - SessionId pas encore disponible`

**Cause** : React n'a pas encore ajouté `data-session-id` au DOM

**Solution** :
- Attendre quelques secondes de plus
- Vérifier `src/components/ClaraAssistant.tsx` ligne 3841
- Vérifier que `stableSessionId` est bien initialisé

### 2. Détection Doublons Trop Stricte
**Symptôme** : `ℹ️ Table unchanged, skipping duplicate`

**Cause** : flowiseTableBridge détecte que la table existe déjà avec le même contenu

**Solution** :
- Normal si vous retestez la même table
- Pour forcer la sauvegarde, modifier légèrement le contenu de la table
- Ou effacer les données avec **🗑️ Effacer** puis retester

### 3. Événement Non Reçu
**Symptôme** : Événement émis mais aucun log "💾 [Bridge] Handling save request"

**Cause** : flowiseTableBridge.ts n'écoute pas l'événement ou ne démarre pas

**Solution** :
- Vérifier que TypeScript compile sans erreur
- Vérifier console pour erreurs TypeScript
- Forcer rechargement avec Ctrl+Shift+R (hard reload)

### 4. Quota IndexedDB Dépassé
**Symptôme** : `❌ Storage quota exceeded`

**Cause** : IndexedDB plein (limite navigateur ~50-500MB)

**Solution** :
- Cliquer **🗑️ Effacer** pour nettoyer
- Ou utiliser DevTools → Application → IndexedDB → Supprimer base

---

## 📝 Notes Importantes

### Timing du Test
- **NE PAS** tester immédiatement après chargement page
- **ATTENDRE** ~7-10 secondes pour que conso.js se charge
- Le diagnostic automatique se lance trop tôt (à 2s) → Utiliser le bouton à la place

### Isolation Par Session
- Chaque chat a son propre `sessionId`
- Les tables sont isolées par session
- Changement de chat = nouveau sessionId = nouvelles tables

### Doublons
- Le système détecte les doublons par **fingerprint** (hash du contenu HTML)
- Si vous modifiez une cellule, le fingerprint change → Nouvelle sauvegarde
- Si contenu identique → Skip silencieux

---

## ✅ Workflow de Débogage

1. **Créer table** dans chat
2. **Attendre 7-10 secondes**
3. **Cliquer 🔍** → **🧪 Test Sauvegarde**
4. **Ouvrir Console F12**
5. **Analyser les logs** :
   - Chercher `❌` ou `⚠️` (erreurs)
   - Chercher section `📊 VÉRIFICATION INDEXEDDB`
   - Compter nombre de tables sauvegardées
6. **Si 0 tables** → Identifier quel log manque dans la chaîne :
   - `💾 [INLINE]` → conso.js fonctionne ?
   - `🔑 [INLINE]` → Keyword extrait ?
   - `📍 [INLINE]` → SessionId présent ?
   - `✅ [INLINE]` → Événement émis ?
   - `💾 [Bridge]` → Bridge reçoit événement ?
   - `✅ Table saved` → IndexedDB sauvegarde ?
7. **Si tables > 0** → **Actualiser page (F5)** pour tester restauration

---

## 🎯 Objectif Final

**But** : Voir ce log dans la console après le test :
```
📊 VÉRIFICATION INDEXEDDB:
   Tables dans cette session: 1+
   ✅ Tables sauvegardées:
     - Nom (00:02:15)
```

**Et après F5** : La table doit **réapparaître automatiquement** dans le chat.

Si cela fonctionne → **Persistance OK** ✅  
Sinon → Analyser les logs et identifier le blocage
