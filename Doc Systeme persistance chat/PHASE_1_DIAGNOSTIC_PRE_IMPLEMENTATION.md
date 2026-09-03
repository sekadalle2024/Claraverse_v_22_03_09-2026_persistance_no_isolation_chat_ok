# 🧪 PHASE 1 : Diagnostic Pré-Implémentation

**Date**: 29 Août 2026  
**Durée**: 15 minutes  
**Objectif**: Valider l'état actuel avant modifications

---

## 📊 Tests Effectués

### Test 1 : IndexedDB - Tables Session Courante
**Vérifie** : Quelles tables sont déjà sauvegardées dans IndexedDB

**Critères** :
- ✅ Total tables toutes sessions
- ✅ Nombre de tables pour la session courante
- ✅ Présence Table_Conso
- ✅ Présence Table_Resultat
- ✅ Présence Table Modélisée

**Interprétation** :
- Si `sessionTables = 0` → Aucune table sauvegardée (normal si nouveau chat)
- Si `hasTableConso = false` → Table_Conso pas persistante (PROBLÈME attendu)
- Si `hasTableResultat = false` → Table_Resultat pas persistante (PROBLÈME attendu)

### Test 2 : SessionId Unique
**Vérifie** : Le sessionId est-il unique par chat ?

**Critères** :
- ✅ SessionId trouvé dans le DOM
- ✅ Format contient "clara-session" ou "chat"

**Interprétation** :
- Format correct → Isolation inter-chats ACTIVE
- Format incorrect → Risque de contamination

### Test 3 : Tables dans le DOM
**Vérifie** : Quelles tables sont présentes et leurs tags

**Critères** :
- ✅ Table_Conso présente
- ✅ Table_Resultat présente
- ✅ Table Modélisée présente
- ✅ Tags sur Table_Conso :
  - `data-keyword`
  - `data-conso-generated` ⚠️ **MANQUANT AVANT PHASE 2**
  - `data-table-position` ⚠️ **MANQUANT AVANT PHASE 2**
  - `data-created-timestamp`

**Interprétation** :
- Tags manquants → Normal, seront ajoutés en Phase 2

### Test 4 : Composants Système
**Vérifie** : Tous les composants sont chargés

**Critères** :
- ✅ `claraverseProcessor` (conso.js)
- ✅ `flowiseTableBridge` (sauvegarde)
- ✅ `flowiseTableService` (IndexedDB)
- ✅ `autoKeywordPatcher` (keywords)

### Test 5 : Test Sauvegarde Manuelle
**Vérifie** : La chaîne d'événements fonctionne

**Critères** :
- ✅ Événement `flowise:table:save:request` émis
- ✅ Bridge reçoit l'événement

**Interprétation** :
- Événement émis MAIS skip par fingerprint → Confirme le problème

---

## 🎯 Résultats Attendus (Phase 1)

| Test | Attendu | Si Échec |
|------|---------|----------|
| IndexedDB | 0-N tables | ⚠️ Vérifier flowiseTableService chargé |
| SessionId | Unique | ❌ STOP - Problème isolation |
| Tables DOM | 0-3 tables | ℹ️ Normal si pas de génération |
| Composants | 4/4 | ❌ STOP - Recharger page |
| Sauvegarde | Événement émis | ⚠️ Confirme problème fingerprint |

---

## 🚀 Comment Tester

### 1. Rechargez la page (F5)

### 2. Attendez 7-10 secondes (chargement conso.js)

### 3. Cliquez sur 🔍 (coin inférieur droit)

### 4. Cliquez sur "🧪 Test Phase 1"

### 5. Attendez résultats (5-10 secondes)

---

## ✅ Validation Phase 1

**Tous les tests doivent passer SAUF** :
- ❌ Tags `data-conso-generated` manquants (normal, ajoutés en Phase 2)
- ❌ Tags `data-table-position` manquants (normal, ajoutés en Phase 2)
- ⚠️ Tables Conso/Résultat absentes d'IndexedDB (confirme le problème)

**Si ces 3 points sont les SEULS échecs** → ✅ **Prêt pour Phase 2**

**Si autres échecs** :
- Composants manquants → Recharger page
- SessionId incorrect → Vérifier `ClaraAssistant.tsx`
- Événements non émis → Vérifier `index.html` inline

---

## 📝 Logs Console (Référence)

Si tout fonctionne, vous verrez :
```
🧪 PHASE 1 : DIAGNOSTIC PRÉ-IMPLÉMENTATION
================================================================================

1️⃣ Vérification IndexedDB...
   ✅ Total tables toutes sessions: X
   ✅ Tables session courante: Y
   ❌ Table_Conso trouvée (attendu)
   ❌ Table_Resultat trouvée (attendu)
   ✅ Table Modélisée trouvée

2️⃣ Vérification SessionId...
   ✅ SessionId: clara-session-xxx...
   ✅ Format unique par chat

3️⃣ Analyse tables DOM...
   ✅ Total tables DOM: 3
   ✅ Table_Conso dans DOM
   ✅ Table_Resultat dans DOM
   ✅ Table Modélisée dans DOM

   📋 Tags Table_Conso:
      keyword: Table_Consolidation
      consoGenerated: ❌ MANQUANT (normal)
      tablePosition: ❌ MANQUANT (normal)
      createdTimestamp: 1788393571656

4️⃣ Vérification composants...
   ✅ claraverseProcessor
   ✅ flowiseTableBridge
   ✅ flowiseTableService
   ✅ autoKeywordPatcher

5️⃣ Test sauvegarde manuelle...
   ✅ Événement émis
   ✅ Bridge a reçu l'événement

================================================================================
✅ PHASE 1 TERMINÉE
================================================================================
```

---

## ➡️ Prochaine Étape

**Une fois Phase 1 validée** :
- Cliquez sur le bouton **"Continuer vers Phase 2 →"**
- OU lancez manuellement Phase 2

**Phase 2** : Modifications Critiques (ajout tags, forceUpdate, etc.)
