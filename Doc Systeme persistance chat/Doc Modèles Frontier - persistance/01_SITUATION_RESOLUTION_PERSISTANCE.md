# 📋 SITUATION DE RÉSOLUTION - PERSISTANCE TABLES CLARAVERSE

**Date** : 2 Septembre 2026  
**Statut** : ✅ Isolation OK | ❌ Persistance NON fonctionnelle  
**Session** : Résolution contamination + doublons + persistance

---

## 🎯 OBJECTIF FINAL

**Garantir la persistance complète des tables générées après actualisation (F5)** tout en maintenant l'isolation stricte entre sessions (chats).

---

## ✅ ACQUIS - CE QUI FONCTIONNE

### 1. Isolation inter-sessions (✅ VALIDÉ)
**Implémentation** : `src/services/flowiseTableBridge.ts` ligne 2318
```typescript
const filteredTimeline = timeline.filter(item => {
  const belongsToSession = item.sessionId === this.currentSessionId;
  if (!belongsToSession && item.type === 'table') {
    console.warn(`🚫 [ISOLATION] Table autre session filtrée`);
  }
  return belongsToSession;
});
```

**Résultat test** : ✅ 0 contamination détectée  
**Logs confirmation** : `🚫 [ISOLATION] Table autre session filtrée`

### 2. Flag restauration activé (✅ VALIDÉ)
**Implémentation** : `index.html` ligne 148
```javascript
window.DISABLE_TABLE_RESTORATION = false; // ✅ ACTIVÉ
console.log("✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false");
console.log("✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests");
```

**Logs confirmation** :
```
✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false
✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests
```

### 3. Messages et chats fonctionnels (✅ VALIDÉ)
- Envoi messages : ✅ OK
- Création nouveaux chats : ✅ OK
- Interface React : ✅ Opérationnelle

---

## ❌ PROBLÈME ACTUEL - PERSISTANCE NON FONCTIONNELLE

### Symptômes observés
1. **Génération table** : ✅ Table s'affiche correctement
2. **Actualisation F5** : ❌ Table disparaît (pas restaurée)
3. **Logs restauration** : ❓ Absents ou incomplets

### Comportement attendu vs réel

| Étape | Attendu | Réel |
|-------|---------|------|
| Générer table | Table visible | ✅ OK |
| Sauvegarde auto | Table → IndexedDB | ❓ À vérifier |
| F5 (actualiser) | Table restaurée | ❌ Table disparaît |
| Logs console | `Starting chronological restoration` | ❓ Absent |

---

## 🔍 HYPOTHÈSES SUR LE PROBLÈME

### Hypothèse A : Tables pas sauvées dans IndexedDB
**Symptôme** : Aucune donnée à restaurer car sauvegarde échoue
**Vérification** : 
- DevTools → Application → IndexedDB → `clara_database` → `clara_generated_tables`
- Compter nombre d'entrées après génération table
**Log attendu** : `✅ Table saved successfully: ID`

### Hypothèse B : Restauration pas déclenchée
**Symptôme** : Données existent mais restauration ne s'exécute pas
**Vérification** :
- Console après F5
- Chercher `Starting chronological restoration`
**Code concerné** : `restoreTablesChronologically()` ligne 2301

### Hypothèse C : SessionId mismatch
**Symptôme** : SessionId au moment de la sauvegarde ≠ SessionId à la restauration
**Vérification** :
- Log sessionId pendant sauvegarde : `console.log('SAVE sessionId:', this.currentSessionId)`
- Log sessionId pendant restauration : `console.log('RESTORE sessionId:', this.currentSessionId)`
**Code concerné** : `currentSessionId` dans `flowiseTableBridge.ts`

### Hypothèse D : Timeline vide ou malformée
**Symptôme** : `getSessionTimeline()` retourne tableau vide
**Vérification** :
- Log timeline : `console.log('Timeline items:', timeline.length)`
**Code concerné** : `flowiseTimelineService.getSessionTimeline()` ligne 2320

### Hypothèse E : Messages array vide
**Symptôme** : `restoreTablesChronologically(messages)` reçoit array vide
**Vérification** :
- Log messages : `console.log('Messages count:', messages?.length)`
**Code concerné** : Appel à `restoreTablesChronologically()` depuis React

---

## 🛠️ SOLUTIONS POTENTIELLES

### Solution 1 : Ajouter logs diagnostiques complets
**Objectif** : Identifier quel maillon de la chaîne casse

**Modifications à faire** :
```typescript
// Dans handleTableIntegrated() ligne ~695
console.log('💾 [SAVE] Attempting save:', {
  sessionId: this.currentSessionId,
  keyword,
  fingerprint: fingerprint.substring(0, 20)
});

// Dans restoreTablesChronologically() ligne ~2301
console.log('🔄 [RESTORE] Starting restoration:', {
  sessionId: this.currentSessionId,
  messagesCount: messages?.length,
  timelineLength: timeline?.length
});

// Après filtrage ligne ~2327
console.log('📊 [RESTORE] After filtering:', {
  originalCount: timeline.length,
  filteredCount: filteredTimeline.length
});
```

### Solution 2 : Vérifier intégration React
**Problème potentiel** : React ne déclenche pas restauration au chargement

**Vérifications** :
1. Chercher appel `restoreTablesChronologically()` dans composants React
2. Vérifier lifecycle hooks (useEffect, componentDidMount)
3. Confirmer que messages sont passés correctement

**Fichiers à vérifier** :
- `src/components/clara/ClaraAssistant.tsx`
- `src/components/chat/ChatInterface.tsx`
- Tout composant appelant `flowiseTableBridge`

### Solution 3 : Forcer restauration manuelle
**Test de validation** : Vérifier que la mécanique fonctionne

**Console navigateur après F5** :
```javascript
// Récupérer le bridge
const bridge = window.flowiseTableBridge;

// Forcer restauration
bridge.restoreTablesChronologically([]);

// Observer logs et résultat
```

Si tables réapparaissent → Problème dans déclenchement auto  
Si tables ne réapparaissent pas → Problème dans sauvegarde ou restauration

### Solution 4 : Vérifier flag à d'autres endroits
**Problème potentiel** : Flag vérifié ailleurs et bloque

**Chercher dans code** :
```bash
grep -r "DISABLE_TABLE_RESTORATION" src/
```

**Vérifier** : Pas d'autre vérification du flag qui court-circuite

### Solution 5 : Restauration alternative via localStorage
**Fallback temporaire** : Utiliser localStorage si IndexedDB échoue

**Implémentation** :
```typescript
// Sauvegarde
localStorage.setItem(
  `table_${sessionId}_${keyword}`,
  JSON.stringify({html, fingerprint, timestamp})
);

// Restauration
const stored = localStorage.getItem(`table_${sessionId}_${keyword}`);
if (stored) {
  const {html} = JSON.parse(stored);
  // Injecter dans DOM
}
```

---

## 📊 PLAN D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 : Diagnostic (15 min)
1. **Ajouter logs complets** (Solution 1)
2. **Générer table test**
3. **Observer console** : Identifier quel log manque
4. **Vérifier IndexedDB** : Tables sauvées ?
5. **F5 + observer console** : Restauration tentée ?

### Phase 2 : Correction ciblée (20 min)
**Selon résultat diagnostic** :

**Si logs sauvegarde absents** :
- Problème : `handleTableIntegrated()` pas appelé
- Vérifier événements `flowise:table:integrated`
- Vérifier intégration `conso.js`

**Si logs restauration absents** :
- Problème : `restoreTablesChronologically()` pas appelé
- Vérifier intégration React
- Ajouter appel explicite au chargement

**Si logs présents mais tables pas restaurées** :
- Problème : Injection DOM échoue
- Vérifier sélecteurs CSS
- Vérifier que container existe

### Phase 3 : Validation (10 min)
1. **Test persistance basique** : Générer + F5
2. **Test isolation maintenue** : Vérifier 0 contamination
3. **Test workflow complet** : Bouton 🧪 Auto

---

## 🔧 CUSTOM INSTRUCTIONS POUR AGENT DE CODE

### Contexte à fournir
```
CONTEXTE PROJET :
- Application React/TypeScript chatbot conversationnel
- Tables générées dynamiquement dans chat (HTML injecté)
- Système persistance IndexedDB via flowiseTableBridge.ts
- Isolation stricte par sessionId (1 session = 1 chat)

PROBLÈME ACTUEL :
- Isolation inter-sessions : ✅ FONCTIONNE (0 contamination)
- Persistance tables après F5 : ❌ NE FONCTIONNE PAS
- Flag DISABLE_TABLE_RESTORATION = false (restauration activée)
- Messages et chats fonctionnent normalement

SYMPTÔME :
1. Générer table → Table visible ✅
2. Actualiser (F5) → Table disparaît ❌
3. Logs "Starting chronological restoration" absents

HYPOTHÈSE PRINCIPALE :
Restauration pas déclenchée OU tables pas sauvées OU sessionId mismatch
```

### Questions de diagnostic
```
QUESTIONS AGENT :
1. Les tables sont-elles sauvées dans IndexedDB ?
   - Vérifier store "clara_generated_tables" après génération
   - Logs "Table saved successfully" présents ?

2. La restauration est-elle appelée ?
   - Logs "Starting chronological restoration" après F5 ?
   - Méthode restoreTablesChronologically() exécutée ?

3. Quel est le sessionId utilisé ?
   - sessionId pendant sauvegarde = sessionId pendant restauration ?
   - currentSessionId défini correctement ?

4. Les messages sont-ils passés à restoreTablesChronologically() ?
   - Array messages vide ou undefined ?
   - Timeline générée contient des items ?

5. Le flag DISABLE_TABLE_RESTORATION est-il vérifié ailleurs ?
   - Grep "DISABLE_TABLE_RESTORATION" dans src/
   - Autres vérifications qui bloquent ?
```

### Actions recommandées
```
ACTIONS PRIORITAIRES :
1. Ajouter logs diagnostiques dans :
   - handleTableIntegrated() (sauvegarde)
   - restoreTablesChronologically() (restauration)
   - Après filtrage sessionId

2. Tester manuellement depuis console :
   - window.flowiseTableBridge.restoreTablesChronologically([])
   - Observer si tables réapparaissent

3. Vérifier intégration React :
   - Chercher où restoreTablesChronologically() est appelé
   - Confirmer useEffect ou lifecycle hook correct

4. Analyser logs console complets :
   - Exporter logs après génération + F5
   - Identifier différence entre cas fonctionnel/non-fonctionnel
```

### Code à inspecter prioritairement
```
FICHIERS CRITIQUES :
1. src/services/flowiseTableBridge.ts
   - Ligne 695 : handleTableIntegrated() (sauvegarde)
   - Ligne 2301 : restoreTablesChronologically() (restauration)
   - Ligne 2318 : Filtrage sessionId (isolation)

2. src/services/flowiseTableService.ts
   - saveGeneratedTable() : Écriture IndexedDB
   - restoreSessionTables() : Lecture IndexedDB

3. Composants React (à identifier) :
   - Qui appelle restoreTablesChronologically() ?
   - Quand est-ce appelé (mount, session change) ?

4. index.html
   - Ligne 148 : Flag DISABLE_TABLE_RESTORATION
   - Scripts inline (conso.js integration)
```

---

## 📝 LOGS À COLLECTER POUR DIAGNOSTIC

### Scénario test à reproduire
```
1. Ouvrir http://localhost:5174/
2. Console (F12) ouverte
3. Créer nouveau chat
4. Générer table : "Créer programme de travail"
5. COPIER LOGS console → fichier "logs_generation.txt"
6. F5 (actualiser)
7. COPIER LOGS console → fichier "logs_restauration.txt"
8. Comparer les deux fichiers
```

### Logs critiques à chercher
```
PENDANT GÉNÉRATION :
✅ "💾 [Bridge] Handling table integrated"
✅ "✅ Table saved successfully"
✅ sessionId utilisé

APRÈS F5 :
✅ "🔄 [RESTORE] Starting restoration"
✅ "Starting chronological restoration"
✅ "📊 Timeline items: X"
✅ "After filtering: Y tables"
✅ "✅ Table restored: ID"

SI ABSENTS :
❌ Identifier quel log manque
❌ Remonter la chaîne d'appels
```

---

## 🎯 CRITÈRES DE SUCCÈS

### Validation complète
1. ✅ Générer table → Visible immédiatement
2. ✅ F5 → Table réapparaît automatiquement
3. ✅ Logs présents :
   - `Table saved successfully`
   - `Starting chronological restoration`
   - `Table restored`
4. ✅ IndexedDB contient table
5. ✅ Isolation maintenue (0 contamination)
6. ✅ Test automatique : Tous ✅

### Métriques attendues
- **Temps persistance** : < 500ms après génération
- **Temps restauration** : < 1s après F5
- **Taux succès** : 100% (toutes tables persistées)
- **Contamination** : 0 tables autres sessions

---

## 🚨 POINTS D'ATTENTION

### Ne PAS casser l'isolation
- ⚠️ Isolation fonctionne, ne pas toucher au filtrage sessionId
- ⚠️ Toute modification doit préserver `filteredTimeline.filter()`

### Ne PAS réintroduire anti-doublons maintenant
- ⚠️ Anti-doublons en suspens (causait erreurs React)
- ⚠️ Résoudre persistance PUIS anti-doublons

### Vérifier cache navigateur
- ⚠️ Cache peut garder ancien code
- ⚠️ Toujours Ctrl+F5 après modifications
- ⚠️ Vider IndexedDB si tests incohérents

---

## 📚 RÉFÉRENCES UTILES

### Documents existants
- `17_GUIDE_TESTS_CONTEXTE_AUDIT.md` : Tests métier audit
- `19_CORRECTION_CRITIQUE_COMPREHENSION.md` : Erreur compréhension passée
- `20_VRAIE_SOLUTION_ISOLATION_SESSIONS.md` : Solution isolation actuelle
- Logs console : `localhost-1788376956915.log`

### Code rollback disponible
- Anti-doublons supprimé mais archivé dans Git
- Peut être réintroduit après résolution persistance
- Commit restauration : `git checkout HEAD -- src/services/`

---

**Document créé le** : 2 Septembre 2026 18:10  
**Prochaine étape** : Diagnostic logs + identification blocage restauration  
**Durée estimée résolution** : 30-45 minutes
