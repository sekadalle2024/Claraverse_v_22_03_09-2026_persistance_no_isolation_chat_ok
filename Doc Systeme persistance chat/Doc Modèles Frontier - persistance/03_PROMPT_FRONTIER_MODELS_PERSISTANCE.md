# 🤖 PROMPT CUSTOM INSTRUCTIONS - MODÈLES FRONTIÈRES

**Destination** : Claude Opus / GPT-4 / Gemini Ultra / Kimi K3  
**Objectif** : Résolution problème persistance tables ClaraVerse  
**Date** : 2 Septembre 2026

---

# CUSTOM INSTRUCTIONS - CONTEXTE PROJET

## Votre Rôle et Expertise

Vous êtes un développeur senior expert avec 30 ans d'expérience en :
- **React.js, TypeScript, JavaScript, Node.js**
- **Frontend avancé** : Manipulation DOM, événements, lifecycle
- **Persistance données** : IndexedDB, localStorage, stratégies de cache
- **Architecture logicielle** : Event-driven, pub/sub patterns
- **Debugging complexe** : Root cause analysis, diagnostic systémique

Vous avez également :
- **5 ans d'expérience** sur le projet open source **ClaraVerse** (GitHub)
- **Expertise en chatbots conversationnels** React/TypeScript
- **Maîtrise complète** des sélecteurs CSS, manipulation tables HTML
- **Compétence diagnostic** : DevTools, logs structurés, métriques

---

## Architecture Projet ClaraVerse

### Stack Technique
```
Frontend:  React 18 + TypeScript + Vite
Backend:   Python (FastAPI/Flask)
Database:  IndexedDB (client-side) + SQLite/PostgreSQL (server-side)
Build:     Vite 5.4.19
```

### Fonctionnalités Clés
- **Chatbot conversationnel** multi-sessions
- **Tables HTML dynamiques** générées dans chat
- **Persistance locale** tables via IndexedDB
- **Isolation stricte** : 1 session = 1 chat (pas de contamination)
- **Scripts externes** : conso.js (génération tables), menu.js (CRUD)

---

# CONTEXTE MÉTIER - APPLICATION AUDIT COMPTABLE

## 🏢 Nature de l'Application ClaraVerse

**ClaraVerse est un logiciel d'AUDIT COMPTABLE professionnel** utilisant un chatbot conversationnel pour générer et manipuler des **feuilles de test d'audit**.

### Cycle de Mission d'Audit

```
Cycle Comptable (1 an)
  └─> 71 Feuilles de Test d'Audit
      └─> Chaque Feuille = 11 Tables spécialisées
          └─> Total: 781 tables par cycle comptable
```

### Types de Tables par Feuille de Test (11 tables)

| # | Type Table | Rôle | Modifiable | Persistance Critique |
|---|------------|------|------------|---------------------|
| 1 | **Modelised_table** | Données test (lignes assertions) | ✅ Manuel | 🔴 CRITIQUE |
| 2 | **Table_Conso** | Consolidation automatique | ✅ Auto+Manuel | 🔴 CRITIQUE |
| 3 | **Resultat** | Synthèse conclusions | ✅ Auto+Manuel | 🔴 CRITIQUE |
| 4 | Table_entete | En-tête feuille | ❌ Lecture seule | 🟡 Importante |
| 5 | Table_objectif | Objectifs test | ❌ Lecture seule | 🟡 Importante |
| 6 | Table_travaux | Description travaux | ❌ Lecture seule | 🟡 Importante |
| 7 | Table_signature | Signatures auditeurs | ✅ Manuel | 🟡 Importante |
| 8 | Table_legend | Légende symboles | ❌ Lecture seule | 🟢 Secondaire |
| 9 | Table_schemas_calcul | Formules calcul | ❌ Lecture seule | 🟢 Secondaire |
| 10 | Table_revue_manager | Revue managériale | ✅ Manuel | 🟡 Importante |
| 11 | Table_lead_balance | Balance générale | ❌ Lecture seule | 🟡 Importante |

### Colonnes Spécialisées dans Modelised_table

**4 colonnes interactives avec menus déroulants** :

#### 1. Colonne [Assertion]
**Variations** : `Assertion`, `ASSERTION`, `assertion`

**Menu déroulant** (clic sur cellule) :
- ✅ Validité
- ✅ Exhaustivité
- ✅ Formalisation
- ✅ Application
- ✅ Permanence

**Usage** : Auditeur sélectionne type d'assertion testé par ligne

#### 2. Colonne [Conclusion]
**Variations** : `Conclusion`, `CONCLUSION`, `conclusion`

**Menu déroulant** (clic sur cellule) :
- ✅ Satisfaisant
- ❌ Non-Satisfaisant
- ⚠️ Limitation
- ⏸️ Non-Applicable

**Usage** : Auditeur valide résultat test par ligne

#### 3. Colonne [Ctr] (Contrôle)
**Variations** : `CTR1`, `CTR2`, `CTR3`, `Ctr1`, `Ctr2`, `Ctr3`, `Ctr4`

**Menu déroulant** (clic sur cellule) :
- ✅ + (Conforme)
- ❌ - (Anomalie)
- ⏸️ N/A (Non applicable)

**Usage** : Résultat contrôle par ligne

#### 4. Colonne [Ecart]
**Variations** : `Ecart`, `ECART`, `ecart`

**Type** : Numérique (montants en devise)

**Usage** : Montant anomalie détectée

---

## 🔧 FONCTIONNEMENT conso.js (SCRIPT CRITIQUE)

### Rôle de conso.js

**conso.js = Moteur de consolidation automatique des résultats de test**

```
Utilisateur valide ligne par ligne dans Modelised_table
  ↓ (événement click)
conso.js détecte changement [Conclusion], [Ctr], [Assertion]
  ↓ (calcul automatique)
Mise à jour automatique Table_Conso + Resultat
  ↓ (CRITIQUE)
Sauvegarde vers IndexedDB (DOIT PERSISTER)
```

### Workflow Utilisateur Typique

```
1. Auditeur ouvre Chat "Test Caisse"
   ↓
2. LLM génère 11 tables feuille de test
   ├─> Modelised_table (vide, 50 lignes)
   ├─> Table_Conso (vide)
   ├─> Resultat (vide)
   └─> 8 autres tables (pré-remplies)
   ↓
3. Auditeur remplit Modelised_table ligne par ligne:
   Ligne 1: Assertion=Exhaustivité, Conclusion=Satisfaisant, Ctr1=+, Ecart=0
   ↓ (conso.js déclenché)
4. Table_Conso et Resultat se remplissent AUTO
   Table_Conso: "Exhaustivité: 1 Satisfaisant"
   Resultat: "Total Satisfaisant: 1"
   ↓
5. Auditeur continue lignes 2-50...
   ↓ (conso.js met à jour en temps réel)
6. Modifications AUTO sauvées par conso.js
   ↓ ⚠️ CRITIQUE
7. F5 (actualisation page)
   ↓ ❌ PROBLÈME ICI
8. Table_Conso et Resultat DISPARAISSENT
   (Ou réapparaissent vides/ancienne version)
```

### Comportements Attendus vs Réels

| Scénario | Modifications | Attendu après F5 | Réel Actuel |
|----------|---------------|------------------|-------------|
| 1 | Auto par conso.js uniquement | ✅ Tables avec données | ❌ Vides/Disparues |
| 2 | Manuelles uniquement | ✅ Tables avec données | ❓ À vérifier |
| 3 | Auto PUIS manuelles | ✅ Dernier état | ❌ État perdu |
| 4 | Manuelles PUIS auto | ✅ Dernier état | ❌ État perdu |
| 5 | Auto + Manuel alternés | ✅ Dernier état | ❌ État perdu |

**Conclusion** : Toute modification incluant conso.js est perdue

---

## 🎯 VRAI PROBLÈME INITIAL (Clarification User)

### Question 1 : Nature du Problème

**Réponse User** :
> "Résoudre un problème avec leur persistance (mal sauvées/restaurées). Les modifications exécutées par le script conso.js pour conclure le test, ou manuellement pour les tables conso et resultat, n'étaient pas persistantes après actualisation."

**Traduction technique** :
- ❌ PAS "empêcher persistance de certaines tables"
- ✅ MAIS "réparer persistance cassée pour Table_Conso et Resultat"
- 🔑 **Root cause** : Modifications conso.js ne sont PAS sauvées/restaurées

### Question 2 : Contamination Inter-Chats

**Réponse User** :
> "Les 11 tables d'autres sessions : un mélange des 11 types de tables. D'un autre chat ou du même chat (doublons conformes, ou versions modifiées). Nous avons 71 feuilles de test par cycle comptable."

**Exemples concrets** :
1. **Test Caisse** (Chat A) → Modelised_table Caisse visible
2. **Test Immobilisations** (Chat B) → Modelised_table Caisse APPARAÎT aussi ❌
3. Identifiable car colonnes différentes (Caisse ≠ Immobilisations)

**Ou** :
1. Même chat : Table_Conso générée 2 fois (ancienne + nouvelle version)
2. Doublons visibles simultanément

**Pratique adoptée** : 1 seul test par chat (workaround contamination)

### Question 3 : Rôle conso.js

**Réponse User** :
> "Quand conso.js sauvegarde Table_Conso : souhaité (consolidation automatique). Pour chaque ligne de test l'utilisateur valide la conclusion par ligne, et automatiquement les tables resultat et conso sont alimentées par assertion et montant en anomalies."

**Workflow détaillé** :
```javascript
// Dans Modelised_table
Ligne 5: User sélectionne Conclusion = "Non-Satisfaisant"
Ligne 5: User entre Ecart = "5000 €"
Ligne 5: User sélectionne Assertion = "Exhaustivité"

↓ conso.js détecte changement

// Table_Conso mise à jour AUTO
Table_Conso ajoute ligne:
  Assertion: Exhaustivité
  Conclusion: Non-Satisfaisant
  Montant: 5000 €

// Resultat mise à jour AUTO
Resultat: "Non-Satisfaisant: 1 (5000 €)"

↓ SAUVEGARDE DOIT SE DÉCLENCHER ICI
```

### Question 4 : Comportement Souhaité

**Réponse User** :
> "Les 3 tables doivent réapparaître avec le dernier état avant actualisation (modification auto, modification manuelle, modification auto et ensuite manuelle, modification manuelle et auto et ensuite)."

**Spécifications** :
- ✅ Modelised_table : Dernier état (50 lignes remplies)
- ✅ Table_Conso : Dernière consolidation (auto par conso.js)
- ✅ Resultat : Dernière synthèse (auto par conso.js)
- ✅ Toute combinaison modifications (auto/manuel) doit persister

---

# PROBLÈME À RÉSOUDRE (REFORMULÉ AVEC CONTEXTE MÉTIER)

## ❌ Symptômes Observés (2 Septembre 2026)

### Problème Principal : PERSISTANCE MODIFICATIONS conso.js

#### Scénario Type (Reproduction)
```
1. Créer chat "Test Trésorerie"
2. Générer feuille de test → 11 tables apparaissent
3. Remplir Modelised_table ligne 1:
   - Assertion: Exhaustivité
   - Conclusion: Satisfaisant
   - Ctr1: +
   - Ecart: 0
4. Observer: Table_Conso et Resultat se remplissent AUTO ✅
5. Continuer lignes 2-10
6. Observer: Table_Conso et Resultat mis à jour en temps réel ✅
7. F5 (actualiser page)
8. Observer:
   - ✅ Modelised_table réapparaît (10 lignes remplies)
   - ❌ Table_Conso DISPARAÎT ou VIDE
   - ❌ Resultat DISPARAÎT ou VIDE
```

**Résultat** : Travail auditeur perdu (doit recommencer consolidation)

#### Impact Métier Critique
- **Temps perdu** : Auditeur doit refaire saisie (50 lignes × 71 tests)
- **Fiabilité** : Perte confiance dans logiciel
- **Conformité** : Risque erreur si données anciennes affichées
- **Productivité** : Workflow cassé (F5 fréquent pour rafraîchir)

### Contexte Récent
- **Isolation inter-sessions** : ✅ FONCTIONNE (0 contamination)
- **Messages et chats** : ✅ FONCTIONNELS
- **Flag restauration** : ✅ ACTIVÉ (`DISABLE_TABLE_RESTORATION = false`)
- **Anti-doublons** : ⏸️ En suspens (causait erreurs React)

### Historique Problèmes Résolus
- ✅ **Contamination inter-chats** : Résolu via filtrage sessionId
- ✅ **Doublons tables** : Anti-doublons implémenté puis retiré (bugs)
- ✅ **Cache navigateur** : Résolu via hard refresh + nettoyage
- ❌ **Persistance conso.js** : NON RÉSOLU depuis 2 jours

---

# 🚨 DÉCOUVERTE CRITIQUE PRÉ-DIAGNOSTIC

## ❌ ROOT CAUSE IDENTIFIÉE (Confiance 85%)

### Problème Majeur : ClaraAssistant.tsx NE RESTAURE PAS LES TABLES

**Investigation technique** :
```bash
$ grep "flowiseTableBridge" src/components/ClaraAssistant.tsx
No matches found ❌

$ grep "restoreTablesChronologically" src/components/ClaraAssistant.tsx
No matches found ❌

$ grep "useEffect.*restore" src/components/ClaraAssistant.tsx
No matches found ❌
```

**Conclusion** :
1. ✅ **Phase 1 (Sauvegarde)** : Fonctionne probablement
   - index.html intercepte événements conso.js
   - flowiseTableBridge.handleTableIntegrated() appelé
   - flowiseTableService.saveGeneratedTable() écrit dans IndexedDB
   
2. ❌ **Phase 2 (Restauration)** : JAMAIS déclenchée
   - ClaraAssistant.tsx ne contient AUCUNE référence à flowiseTableBridge
   - Aucun useEffect ne déclenche restoreTablesChronologically()
   - Au F5, React remonte composant mais ne restaure RIEN

**Hypothèse validée** : **Hypothèse B** (Restauration pas déclenchée)

**Impact** :
- Tables sauvées dans IndexedDB (invisible pour user)
- Mais JAMAIS restaurées dans DOM après F5
- User voit tables disparaître → Travail perdu

---

## 🔧 SOLUTION ATTENDUE (À Valider par Agent)

### Correction Nécessaire : Ajouter useEffect Restauration

**Fichier** : `src/components/ClaraAssistant.tsx`

**Code à implémenter** :
```typescript
// Import en haut du fichier
import flowiseTableBridge from '../services/flowiseTableBridge';

// useEffect après ligne ~450 (après useEffect stableSessionId)
useEffect(() => {
  // Guard: Pas de session ou pas de messages
  if (!currentSession?.id || !messages || messages.length === 0) {
    return;
  }

  console.log('🔄 [React] Déclenchement restauration tables...', {
    sessionId: currentSession.id.substring(0, 30) + '...',
    messagesCount: messages.length,
    timestamp: Date.now()
  });

  // Déclencher restauration chronologique
  flowiseTableBridge.restoreTablesChronologically(messages)
    .then(count => {
      console.log(`✅ [React] ${count} table(s) restaurée(s) avec succès`);
    })
    .catch(error => {
      console.error('❌ [React] Erreur restauration tables:', error);
    });

}, [currentSession?.id, messages]); // Dépendances: session change OU nouveaux messages
```

**Questions pour l'agent** :
1. ✅ Confirmer que IndexedDB contient bien données (vérif manuelle DevTools)
2. ⚠️ Dépendances useEffect optimales ? `[currentSession?.id, messages]` peut causer re-renders
3. ⚠️ Quand déclencher exactement ? (mount, session change, messages change, ou combinaison)
4. ⚠️ Risque doublons temporaires si restauration + nouveau message simultanés ?
5. ⚠️ Faut-il débounce pour éviter restaurations multiples ?

---

## 📊 VALIDATION HYPOTHÈSES (Mise à Jour)

### Hypothèse A : Tables pas sauvées (Phase 1 échoue)
**Probabilité** : 15% ⬇️ (était 40%)

**Raison rejet** :
- Script inline index.html fonctionnel (logs présents)
- handleTableIntegrated() appelé (architecture confirmée)
- saveGeneratedTable() robuste (try-catch, retry logic)

**À vérifier quand même** :
- IndexedDB contient données (DevTools → clara_database)

---

### Hypothèse B : Restauration pas déclenchée (Phase 2 n'exécute pas)
**Probabilité** : 85% ⬆️ (était 35%)

**Raison validation** :
- ✅ **PREUVE TECHNIQUE** : grep confirme aucun appel
- ✅ ClaraAssistant.tsx ignore complètement flowiseTableBridge
- ✅ Logs restauration absents après F5 (cohérent)

**Solution confirmée** :
- Ajouter useEffect dans ClaraAssistant.tsx

---

### Hypothèse C : SessionId mismatch (Données sauvées mais filtrées)
**Probabilité** : 5% ⬇️ (était 15%)

**Raison rejet** :
- Isolation fonctionne (0 contamination confirmée)
- detectSessionId() stable
- Mais PEUT ÊTRE problème secondaire après correction B

**À vérifier après correction B** :
- SessionId identique sauvegarde vs restauration

---

### Hypothèse D : Timeline vide (getSessionTimeline échoue)
**Probabilité** : 3% ⬇️ (était 5%)

**Raison rejet** :
- Hypothèse B explique tout (restauration jamais appelée)
- getSessionTimeline() jamais exécuté

---

### Hypothèse E : Injection DOM échoue (Restauration exécute mais invisible)
**Probabilité** : 2% ⬇️ (était 5%)

**Raison rejet** :
- Injection DOM jamais tentée (restauration pas déclenchée)

---

# ARCHITECTURE TECHNIQUE ACTUELLE

## Fichiers Critiques (ordre importance)

### 1. src/services/flowiseTableBridge.ts
**Rôle** : Orchestrateur central sauvegarde + restauration

**Méthodes critiques** :
- `handleTableIntegrated()` ligne ~695 : Sauvegarde table dans IndexedDB
- `restoreTablesChronologically()` ligne ~2301 : Restaure tables après F5
- `detectSessionId()` ligne ~450 : Détecte sessionId depuis DOM React

**État actuel** :
- ✅ Isolation implémentée (filtrage sessionId ligne 2318)
- ❌ Restauration ne se déclenche pas OU échoue silencieusement

### 2. src/services/flowiseTableService.ts
**Rôle** : Couche service IndexedDB

**Méthodes critiques** :
- `saveGeneratedTable()` ligne ~200 : Écrit dans IndexedDB
- `restoreSessionTables()` ligne ~1000 : Lit depuis IndexedDB
- `generateTableFingerprint()` ligne ~350 : Hash contenu table

**État actuel** :
- ✅ Code semble fonctionnel
- ❓ Sauvegarde réellement appelée ?

### 3. index.html
**Rôle** : Config globale + Scripts inline

**Sections critiques** :
- Ligne 148 : Flag `DISABLE_TABLE_RESTORATION = false` ✅
- Ligne 160-700 : Script inline interception conso.js
- Événements : `flowise:table:integrated`, `flowise:table:save:request`

**État actuel** :
- ✅ Flag correct chargé
- ❓ Événements émis correctement ?

### 4. public/conso.js
**Rôle** : Génération tables + Émission événements

**État actuel** :
- ✅ Génère tables Table_conso et Resultat
- ❓ Émet événements save:request ?

### 5. src/components/clara/ClaraAssistant.tsx (React)
**Rôle** : Composant principal chat - Déclenche restauration

**État actuel** :
- ❓ **POINT CRITIQUE À VÉRIFIER** : Appelle restoreTablesChronologically() ?
- ❓ useEffect configuré avec bonnes dépendances ?

---

# FLUX ATTENDU (NON FONCTIONNEL)

## Phase 1 : Sauvegarde (✅ ❓)

```
1. Table générée → DOM
   ↓
2. MutationObserver (conso.js) détecte
   ↓
3. Émission événement flowise:table:save:request
   ↓
4. Script inline intercepte + convertit
   ↓
5. Émission événement flowise:table:integrated
   ↓
6. flowiseTableBridge.handleTableIntegrated()
   ↓
7. flowiseTableService.saveGeneratedTable()
   ↓
8. IndexedDB: Table sauvée
   LOG ATTENDU: ✅ Table saved successfully: ID
```

## Phase 2 : Restauration (❌ ÉCHOUE)

```
1. Page recharge (F5)
   ↓
2. React monte ClaraAssistant
   ↓
3. useEffect déclenche restauration
   flowiseTableBridge.restoreTablesChronologically(messages)
   ↓
4. Vérification flag DISABLE_TABLE_RESTORATION
   Si true → STOP | Si false → Continue ✅
   ↓
5. Vérification currentSessionId
   Si undefined → STOP | Si défini → Continue ❓
   ↓
6. Récupération timeline
   flowiseTimelineService.getSessionTimeline(sessionId, messages)
   ↓
7. Filtrage par sessionId (ISOLATION ✅)
   ↓
8. Pour chaque table: Injection DOM
   ↓
9. Tables restaurées visibles
   LOG ATTENDU: ✅ Table restored: ID
```

**❌ BLOCAGE QUELQUE PART DANS CE FLUX**

---

# HYPOTHÈSES SUR LE PROBLÈME

## Hypothèse A : Tables pas sauvées (Phase 1 échoue)
**Probabilité** : 40%

**Symptôme** :
- Aucune donnée dans IndexedDB après génération
- Log `✅ Table saved successfully` absent

**Vérification** :
```javascript
// DevTools → Application → IndexedDB → clara_database
// Compter entrées dans "clara_generated_tables" après génération
// Si 0 entrées → Hypothèse confirmée
```

**Causes possibles** :
1. Événement `flowise:table:save:request` pas émis (conso.js)
2. Événement émis mais pas écouté (bridge)
3. handleTableIntegrated() pas appelé
4. saveGeneratedTable() retourne error silencieusement
5. currentSessionId undefined → Sauvegarde échoue

## Hypothèse B : Restauration pas déclenchée (Phase 2 n'exécute pas)
**Probabilité** : 35%

**Symptôme** :
- Données existent dans IndexedDB
- Aucun log `Starting chronological restoration`
- restoreTablesChronologically() jamais appelé

**Vérification** :
```javascript
// Console après F5
// Chercher log "🔄 Restoring tables chronologically"
// Si absent → Hypothèse confirmée
```

**Causes possibles** :
1. ClaraAssistant.tsx n'appelle pas restoreTablesChronologically()
2. useEffect pas configuré (dépendances manquantes)
3. useEffect s'exécute mais flowiseTableBridge undefined
4. Condition de déclenchement pas remplie

## Hypothèse C : SessionId mismatch (Données sauvées mais filtrées)
**Probabilité** : 15%

**Symptôme** :
- Sauvegarde OK (données dans IndexedDB)
- Restauration tentée (logs présents)
- Timeline récupérée mais filtrée à 0

**Vérification** :
```javascript
// Logs console après F5
// "📚 Timeline: X items" → OK
// "After filtering: 0 tables" → SessionId différent
```

**Causes possibles** :
1. SessionId change entre sauvegarde et restauration
2. SessionId temporaire créé à chaque fois
3. React ne met pas à jour data-session-id correctement

## Hypothèse D : Timeline vide (getSessionTimeline échoue)
**Probabilité** : 5%

**Symptôme** :
- Restauration déclenchée
- Log "No timeline items for session"
- IndexedDB vide OU sessionId mismatch

**Vérification** :
```javascript
// Console après F5
// "ℹ️ No timeline items for session: uuid-xxx"
```

**Causes possibles** :
1. Messages array vide passé à restoreTablesChronologically()
2. getSessionTimeline() retourne []
3. IndexedDB lecture échoue

## Hypothèse E : Injection DOM échoue (Restauration exécute mais invisible)
**Probabilité** : 5%

**Symptôme** :
- Tous logs présents (sauvegarde + restauration)
- Log "Table restored" présent
- Mais table pas visible dans DOM

**Vérification** :
```javascript
// Console après F5
// "✅ Table restored: ID" présent
// Mais aucune table visible
```

**Causes possibles** :
1. Container DOM pas trouvé (sélecteur CSS incorrect)
2. Table injectée au mauvais endroit
3. CSS masque table
4. React re-render écrase injection

---

# SCRIPTS DIAGNOSTICS DÉJÀ INTÉGRÉS

## Script 1 : Logs Sauvegarde (À AJOUTER)

**Fichier** : `src/services/flowiseTableBridge.ts`  
**Ligne** : ~695 (début handleTableIntegrated)

```typescript
console.log('💾 [DEBUG SAVE] handleTableIntegrated called:', {
  keyword,
  sessionId: this.currentSessionId,
  hasTableElement: !!tableElement,
  timestamp: Date.now()
});
```

**Mesure** : Confirme que handleTableIntegrated() est appelé  
**Résultat attendu** : Log apparaît après génération table  
**Si absent** : Événement pas émis OU pas écouté

## Script 2 : Logs Restauration (À AJOUTER)

**Fichier** : `src/services/flowiseTableBridge.ts`  
**Ligne** : ~2301 (début restoreTablesChronologically)

```typescript
console.log('🔄 [DEBUG RESTORE] restoreTablesChronologically called:', {
  sessionId: this.currentSessionId,
  messagesCount: messages?.length,
  flagValue: (window as any).DISABLE_TABLE_RESTORATION,
  timestamp: Date.now()
});
```

**Mesure** : Confirme que restauration est déclenchée  
**Résultat attendu** : Log apparaît après F5  
**Si absent** : React n'appelle pas la méthode

## Script 3 : Logs Timeline (À AJOUTER)

**Fichier** : `src/services/flowiseTableBridge.ts`  
**Ligne** : ~2325 (après getSessionTimeline)

```typescript
console.log('📊 [DEBUG TIMELINE] Timeline retrieved:', {
  totalItems: timeline.length,
  tableItems: timeline.filter(i => i.type === 'table').length,
  sessionId: this.currentSessionId
});
```

**Mesure** : Vérifie contenu timeline avant filtrage  
**Résultat attendu** : X items récupérés depuis IndexedDB  
**Si 0** : Pas de données OU sessionId mismatch

## Script 4 : Logs Filtrage (À AJOUTER)

**Fichier** : `src/services/flowiseTableBridge.ts`  
**Ligne** : ~2330 (après filtrage)

```typescript
console.log('🛡️ [DEBUG FILTER] After filtering:', {
  beforeFilter: timeline.length,
  afterFilter: filteredTimeline.length,
  removed: timeline.length - filteredTimeline.length,
  currentSessionId: this.currentSessionId
});
```

**Mesure** : Vérifie combien de tables filtrées par isolation  
**Résultat attendu** : Avant=X, Après=Y, Removed=(X-Y)  
**Si Après=0** : SessionId mismatch

## Script 5 : Logs IndexedDB (À AJOUTER)

**Fichier** : `src/services/flowiseTableService.ts`  
**Ligne** : ~220 (après sauvegarde)

```typescript
console.log('💾 [DEBUG IDB] Table saved to IndexedDB:', {
  tableId,
  sessionId,
  keyword,
  htmlLength: html.length,
  compressed: metadata.compressed || false
});
```

**Mesure** : Confirme écriture réussie dans IndexedDB  
**Résultat attendu** : Log avec détails table  
**Si absent** : Sauvegarde échoue silencieusement

## Script 6 : Test Manuel Console (DISPONIBLE)

**Usage** : Console navigateur après F5

```javascript
// Vérifier bridge chargé
console.log('Bridge:', window.flowiseTableBridge);

// Vérifier sessionId
console.log('SessionId:', window.flowiseTableBridge?.currentSessionId);

// Forcer restauration manuelle
window.flowiseTableBridge?.restoreTablesChronologically([]);

// Résultat: Si tables apparaissent → Restauration fonctionne
//           Si rien → Problème sauvegarde OU injection DOM
```

**Mesure** : Valide que mécanique restauration fonctionne  
**Résultat attendu** : Tables réapparaissent  
**Si non** : Problème plus profond (sauvegarde ou injection)

---

# ÉLÉMENTS OBLIGATOIRES DANS VOTRE RÉPONSE

Votre réponse DOIT contenir les sections suivantes dans cet ordre :

## 1. DIAGNOSTIC ROOT CAUSE (Obligatoire)

### 1.1 Analyse Hypothèses
Pour CHAQUE hypothèse (A à E) :
- ✅ ou ❌ : Validez ou rejetez l'hypothèse
- **Justification** : Expliquez pourquoi (basé sur architecture + flux)
- **Tests recommandés** : Scripts spécifiques pour vérifier

### 1.2 Root Cause Identifiée
- **Hypothèse retenue** : Quelle est LA cause principale ?
- **Confiance** : % de certitude
- **Raisonnement** : Chaîne logique menant à cette conclusion

## 2. PLAN D'IMPLÉMENTATION (Obligatoire)

### 2.1 Phase Diagnostic (15-20 min)
**Objectif** : Confirmer root cause

**Actions** :
1. Ajouter logs diagnostics (Scripts 1-5)
2. Générer table test
3. Observer console (quels logs apparaissent / manquent)
4. Vérifier IndexedDB (DevTools → Application)
5. F5 + observer console
6. Identifier quel log manque en premier

**Critère succès** : Confirmation root cause par absence log critique

### 2.2 Phase Correction (20-30 min)
**Objectif** : Corriger le problème identifié

**Pour chaque hypothèse possible** :

#### Si Root Cause = A (Tables pas sauvées)
**Actions** :
1. Vérifier émission événement conso.js
2. Vérifier écoute événement bridge
3. Ajouter try-catch avec logs dans handleTableIntegrated
4. Vérifier currentSessionId défini pendant sauvegarde
5. Corriger selon découverte

#### Si Root Cause = B (Restauration pas déclenchée)
**Actions** :
1. Localiser appel restoreTablesChronologically dans ClaraAssistant.tsx
2. Vérifier useEffect existe et configuré
3. Ajouter logs dans useEffect
4. Vérifier dépendances array [currentSession, messages]
5. Si absent : Implémenter useEffect
6. Si présent mais broken : Corriger dépendances

#### Si Root Cause = C (SessionId mismatch)
**Actions** :
1. Logger sessionId pendant sauvegarde ET restauration
2. Comparer les deux
3. Vérifier detectSessionId() retourne stable ID
4. Vérifier React met à jour data-session-id correctement
5. Si temporaire créé : Implémenter persistence sessionId

#### Si Root Cause = D (Timeline vide)
**Actions** :
1. Logger messages passés à restoreTablesChronologically
2. Vérifier getSessionTimeline reçoit messages non vides
3. Logger résultat restoreSessionTables()
4. Corriger selon découverte (API ou state React)

#### Si Root Cause = E (Injection DOM échoue)
**Actions** :
1. Logger container trouvé avant injection
2. Vérifier sélecteur CSS valide
3. Tester injection manuelle console
4. Corriger sélecteur ou méthode injection

### 2.3 Phase Validation (10 min)
**Objectif** : Confirmer fix complet

**Tests** :
1. ✅ Générer table → Visible
2. ✅ Log "Table saved successfully"
3. ✅ IndexedDB contient table
4. ✅ F5 → Log "Starting chronological restoration"
5. ✅ Log "Table restored"
6. ✅ Table réapparaît dans DOM
7. ✅ Isolation maintenue (0 contamination)
8. ✅ Test automatique : Tous ✅

## 3. CODE CORRECTIONS (Obligatoire)

Pour CHAQUE correction recommandée :
- **Fichier** : Chemin exact
- **Ligne** : Numéro approximatif
- **Code AVANT** : Montrer code actuel problématique
- **Code APRÈS** : Montrer correction complète
- **Explication** : Pourquoi ce changement résout le problème

**Format attendu** :
```typescript
// Fichier: src/services/example.ts
// Ligne: ~100

// ❌ AVANT (problématique)
async saveTable() {
  // Code problématique
}

// ✅ APRÈS (corrigé)
async saveTable() {
  console.log('[DEBUG] saveTable called'); // ← Ajout log
  // Code corrigé avec gestion erreur
  try {
    // ...
  } catch (error) {
    console.error('[ERROR] saveTable failed:', error);
  }
}

// Explication: Ajout logs + try-catch pour capturer erreurs silencieuses
```

## 4. HYPOTHÈSES ALTERNATIVES (Obligatoire)

Si votre diagnostic n'est pas 100% certain :
- Listez 2-3 **causes alternatives possibles**
- Pour chacune : Tests spécifiques pour confirmer/infirmer
- Plan B si première correction échoue

## 5. RISQUES ET PRÉCAUTIONS (Obligatoire)

- **Risques** : Quels effets de bord possibles avec vos corrections ?
- **Isolation** : Comment garantir que l'isolation reste fonctionnelle ?
- **Rollback** : Comment annuler si corrections cassent quelque chose ?
- **Tests régression** : Quels tests pour valider rien n'est cassé ?

---

# FICHIERS SOURCE À JOINDRE (TOP 3 CRITIQUE)

## 🔴 FICHIER 1 : src/services/flowiseTableBridge.ts (CRITIQUE++)

**Rôle** : Orchestrateur central - Gère TOUT le flux sauvegarde/restauration

**Pourquoi joindre** :
- ✅ Contient `handleTableIntegrated()` (ligne ~695) : Point d'entrée sauvegarde
- ✅ Contient `restoreTablesChronologically()` (ligne ~2301) : Restauration chronologique
- ✅ Contient `detectSessionId()` : Gestion isolation inter-sessions
- ✅ Filtrage sessionId ligne 2318 (isolation fonctionnelle)
- ⚠️ **PROBLÈME POTENTIEL** : Restauration peut ne jamais être appelée

**Méthodes critiques** :
```typescript
handleTableIntegrated(detail)         // Ligne ~695  - Sauvegarde
restoreTablesChronologically(messages) // Ligne ~2301 - Restauration
detectSessionId()                      // Ligne ~450  - SessionId
```

**Taille** : ~2500 lignes (fichier complet recommandé)

---

## 🔴 FICHIER 2 : src/services/flowiseTableService.ts (CRITIQUE+)

**Rôle** : Couche service IndexedDB - Lit/Écrit données persistantes

**Pourquoi joindre** :
- ✅ Contient `saveGeneratedTable()` (ligne 187) : Écriture IndexedDB
- ✅ Contient `restoreSessionTables()` (ligne 423) : Lecture IndexedDB
- ✅ Gestion compression/décompression HTML
- ✅ Gestion fingerprints (anti-doublons)
- ✅ Gestion quotas storage

**Méthodes critiques** :
```typescript
saveGeneratedTable(sessionId, tableElement, keyword, source) // Ligne 187
restoreSessionTables(sessionId)                               // Ligne 423
generateTableFingerprint(tableElement)                        // Ligne ~350
```

**Taille** : ~1200 lignes (fichier complet recommandé)

---

## 🟡 FICHIER 3 : index.html (IMPORTANT)

**Rôle** : Config globale + Script inline interception événements conso.js

**Pourquoi joindre** :
- ✅ Contient flag `DISABLE_TABLE_RESTORATION = false` (ligne 148)
- ✅ Contient script inline (lignes 160-700) : Intercepte événements conso.js
- ✅ Convertit `flowise:table:save:request` → `flowise:table:integrated`
- ⚠️ **PROBLÈME POTENTIEL** : Événements pas émis ou pas écoutés

**Sections critiques** :
```javascript
// Ligne 148 - Flag global
window.DISABLE_TABLE_RESTORATION = false

// Ligne 160-700 - Script inline interception
document.addEventListener('flowise:table:save:request', handler)
document.dispatchEvent(new CustomEvent('flowise:table:integrated', {...}))
```

**Taille** : ~1500 lignes (sections 1-800 suffisantes)

---

## ❌ FICHIERS NON CRITIQUES (Ne pas joindre sauf demande spécifique)

### conso.js (Génération tables)
**Pourquoi PAS critique** :
- ✅ Génère correctement tables Table_Conso et Resultat (fonctionne)
- ❓ Émet événements `claraverse:table:updated` (pas `flowise:table:save`)
- ⚠️ **Problème identifié** : Pas d'événements `flowise:table:save:request`

**Verdict** : Script inline index.html doit convertir événements conso.js → Flowise
**Joindre si** : Problème confirmé dans émission événements

### menu.js (CRUD tables)
**Pourquoi PAS critique** :
- ✅ Gère édition cellules (contenteditable)
- ✅ Appelle `forceSaveTable()` API
- ⏸️ **Non lié au problème** : Persistance conso.js échoue AVANT modifications manuelles

**Verdict** : Secondaire pour diagnostic actuel
**Joindre si** : Modifications manuelles aussi non-persistantes (étape 2)

### ClaraAssistant.tsx (Composant React)
**Pourquoi CRITIQUE** :
- ❌ **PROBLÈME MAJEUR IDENTIFIÉ** : Aucun appel à `flowiseTableBridge.restoreTablesChronologically()`
- ❌ Aucune référence à `flowiseTableBridge` dans le fichier
- ❌ Aucun useEffect pour restauration tables

**Verdict** : 🚨 **ROOT CAUSE PROBABLE** 🚨
**Action** : Extraire section useEffect (lignes 360-3600) pour analyse

---

## 🚨 DÉCOUVERTE CRITIQUE

### ❌ PROBLÈME MAJEUR : ClaraAssistant ne restaure PAS les tables

**Investigation grep** :
```bash
grep "flowiseTableBridge" src/components/ClaraAssistant.tsx
# Résultat: No matches found ❌
```

**Conclusion** :
1. ✅ Sauvegarde fonctionne (flowiseTableBridge.handleTableIntegrated appelé)
2. ✅ IndexedDB contient probablement données
3. ❌ **Restauration jamais déclenchée** (ClaraAssistant n'appelle pas restoreTablesChronologically)

**Root Cause = Hypothèse B (85% confiance)** :
> "Restauration pas déclenchée (Phase 2 n'exécute pas)"

**Prochaine étape** :
1. Vérifier IndexedDB manuellement (DevTools) → Confirmer données sauvées
2. Ajouter useEffect dans ClaraAssistant.tsx :
```typescript
useEffect(() => {
  if (currentSession?.id && messages.length > 0) {
    flowiseTableBridge.restoreTablesChronologically(messages);
  }
}, [currentSession?.id, messages]);
```

---

# CONTRAINTES TECHNIQUES

## À RESPECTER ABSOLUMENT

### 1. Isolation Inter-Sessions
⚠️ **NE PAS TOUCHER** au filtrage sessionId ligne 2318 (flowiseTableBridge.ts)

```typescript
// ✅ CODE À PRÉSERVER (fonctionne)
const filteredTimeline = timeline.filter(item => {
  const belongsToSession = item.sessionId === this.currentSessionId;
  if (!belongsToSession && item.type === 'table') {
    console.warn(`🚫 [ISOLATION] Table autre session filtrée`);
  }
  return belongsToSession;
});
```

**Raison** : Isolation fonctionne, 0 contamination confirmée

### 2. Anti-Doublons
⏸️ **NE PAS réimplémenter** maintenant (causait bugs React)

Méthodes supprimées :
- `findTableByKeywordAndSession()`
- `updateGeneratedTable()`
- `shouldUpdateExistingTable()`

**Raison** : Résoudre persistance D'ABORD, anti-doublons APRÈS

### 3. Flag Restauration
✅ **NE PAS changer** `DISABLE_TABLE_RESTORATION = false`

**Raison** : Flag correct, problème est ailleurs

### 4. Compatibilité React
⚠️ **Vérifier** que corrections n'empêchent pas messages/chats

**Raison** : Ce problème survenu avant, vigilance requise

---

# INFORMATIONS COMPLÉMENTAIRES

## Logs Console Actuels (Post-Correction Flag)

```
✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false
✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests
🔗 [INLINE] Chargement intégration conso → IndexedDB
⏳ [INLINE] Attente de claraverseProcessor...
```

**Observation** : Flag correct mais aucun log de restauration après F5

## Historique Solutions Tentées

### Solution 1 : Modification flag (✅ Succès)
**Date** : 2 Sept 2026 18:00  
**Action** : `DISABLE_TABLE_RESTORATION true → false`  
**Résultat** : Flag correct mais persistance toujours KO

### Solution 2 : Rollback anti-doublons (✅ Succès partiel)
**Date** : 2 Sept 2026 17:00  
**Action** : Suppression code anti-doublons (bugs React)  
**Résultat** : Messages/chats fonctionnent, persistance toujours KO

### Solution 3 : Rebuild complet (⏸️ Neutre)
**Date** : 2 Sept 2026 16:30  
**Action** : Cache vidé + Rebuild Vite  
**Résultat** : Pas d'amélioration

### Solution 4 : Restauration Git (⏸️ Neutre)
**Date** : 2 Sept 2026 16:00  
**Action** : `git checkout HEAD -- index.html src/services/`  
**Résultat** : Problème existait déjà dans code original

## Documents Référence Disponibles

Dans dossier `Doc Systeme persistance chat/Doc Modèles Frontier - persistance/` :

1. **01_SITUATION_RESOLUTION_PERSISTANCE.md**
   - Hypothèses A-E détaillées
   - Solutions potentielles 1-5
   - Plan implémentation 3 phases
   - Custom instructions
   - Logs à collecter

2. **02_SYSTEME_SCRIPTS_PERSISTANCE.md**
   - 6 fichiers critiques documentés
   - Flux complet sauvegarde/restauration
   - 5 points défaillance potentiels
   - Outils diagnostic console
   - Métriques validation

3. **00_MEMO_ARCHITECTURE_ISOLATION_CHATS_COMPLET.md**
   - Historique problèmes contamination
   - Solutions tentées (échecs + succès)
   - Architecture isolation actuelle

4. **SOLUTION_CONSO_INDEXEDDB.md**
   - Intégration conso.js → IndexedDB
   - Architecture événements
   - Script inline index.html

---

# FORMAT RÉPONSE ATTENDU

## Structure Obligatoire

```markdown
# DIAGNOSTIC PERSISTANCE CLARAVERSE

## 1. DIAGNOSTIC ROOT CAUSE

### 1.1 Analyse Hypothèses
#### Hypothèse A: Tables pas sauvées
[Votre analyse]

#### Hypothèse B: Restauration pas déclenchée
[Votre analyse]

[...autres hypothèses...]

### 1.2 Root Cause Identifiée
**Hypothèse retenue:** [A/B/C/D/E]
**Confiance:** [%]
**Raisonnement:** [Explication]

## 2. PLAN D'IMPLÉMENTATION

### 2.1 Phase Diagnostic (15-20 min)
[Actions détaillées]

### 2.2 Phase Correction (20-30 min)
[Actions selon root cause]

### 2.3 Phase Validation (10 min)
[Tests validation]

## 3. CODE CORRECTIONS

### Correction 1: [Titre]
```typescript
// Code AVANT
// Code APRÈS
```
[Explication]

[...autres corrections...]

## 4. HYPOTHÈSES ALTERNATIVES

[Si diagnostic incertain]

## 5. RISQUES ET PRÉCAUTIONS

[Effets de bord + Rollback]
```

---

# CRITÈRES DE SUCCÈS

Votre réponse sera considérée réussie si :

1. ✅ **Root cause clairement identifiée** (pas "peut-être A ou B")
2. ✅ **Plan implémentation actionnable** (étapes concrètes)
3. ✅ **Code corrections fourni** (pas juste "ajouter logs")
4. ✅ **Raisonnement technique solide** (basé sur architecture)
5. ✅ **Tests validation définis** (critères succès mesurables)
6. ✅ **Risques anticipés** (effets de bord identifiés)

---

# QUESTIONS DE RÉFLEXION

Pour guider votre diagnostic :

1. **Où se trouve le premier point de défaillance ?**
   - Génération → Événement → Sauvegarde → Restauration ?

2. **Les événements sont-ils émis et écoutés ?**
   - flowise:table:save:request
   - flowise:table:integrated

3. **Le sessionId est-il stable ?**
   - Même ID pendant sauvegarde et restauration ?
   - Temporaire créé à chaque fois ?

4. **React appelle-t-il la restauration ?**
   - useEffect existe ?
   - Dépendances correctes ?

5. **IndexedDB contient-il des données ?**
   - Store vide = Sauvegarde échoue
   - Store plein = Restauration échoue

---

# CONTEXTE OPÉRATIONNEL

## Environnement Dev
- **OS** : Windows
- **Node** : v20.x
- **npm** : v10.9.4
- **Navigateur** : Chrome/Edge (DevTools disponibles)
- **Serveur** : `npm run dev` (Vite port 5173/5174)

## Outils Disponibles
- ✅ Console navigateur
- ✅ DevTools (Application → IndexedDB)
- ✅ Logs structurés
- ✅ Git (rollback possible)
- ✅ Scripts diagnostic intégrés (à ajouter)

## Temps Disponible
- **Diagnostic** : 15-20 min
- **Implémentation** : 20-30 min
- **Validation** : 10 min
- **Total estimé** : 45-60 min

---

# NOTES FINALES

## Priorités
1. **URGENT** : Identifier root cause (logs manquants)
2. **IMPORTANT** : Corriger sans casser isolation
3. **SOUHAITABLE** : Solution élégante et maintenable

## État d'esprit
- Approche **méthodique** : Logs → Diagnostic → Correction
- **Pas de guess** : Confirmer hypothèses par tests
- **Sécurité** : Préserver ce qui fonctionne (isolation)

## Attentes
Nous attendons une analyse **technique approfondie** avec :
- Diagnostic **basé sur l'architecture** (pas intuition)
- Corrections **testables** (logs pour valider)
- Plan **exécutable immédiatement**

---

**Bonne chance ! Nous comptons sur votre expertise pour résoudre ce problème qui nous bloque depuis 2 jours.**
