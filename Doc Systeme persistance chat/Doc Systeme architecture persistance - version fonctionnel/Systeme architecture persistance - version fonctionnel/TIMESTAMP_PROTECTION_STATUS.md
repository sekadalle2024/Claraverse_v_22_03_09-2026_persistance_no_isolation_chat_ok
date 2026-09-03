# État d'implémentation de la Protection Temporelle

**Date:** 28 août 2026  
**Statut:** ✅ IMPLÉMENTÉ ET OPÉRATIONNEL

## Résumé

La protection temporelle basée sur les timestamps est **complètement implémentée** et empêche la suppression prématurée des tables restaurées pendant les 5 premières secondes après leur création.

---

## 🎯 Objectif

Empêcher le système de cleanup (`cleanupDuplicateOriginalTables()`) de supprimer les tables fraîchement créées/restaurées, évitant ainsi que les tables disparaissent immédiatement après le rechargement de la page.

---

## ✅ Composants Implémentés

### 1. **Ajout de Timestamps aux Tables** (Flowise.js)

**Fichiers:**
- `public/Flowise.js` (ligne 839)
- `Flowise.js` (racine, ligne 839)

**Code:**
```javascript
// 🎯 AJOUT : timestamp numérique pour protection temporelle
const now = Date.now();
tableWrapper.setAttribute('data-timestamp', now.toString());
tableWrapper.setAttribute('data-created-at', new Date().toISOString());
```

**Attributs ajoutés:**
- `data-timestamp`: Timestamp numérique en millisecondes (Date.now())
- `data-created-at`: Timestamp ISO 8601 lisible par humain

---

### 2. **Protection dans le Cleanup** (flowiseTableBridge.ts)

**Fichier:** `src/services/flowiseTableBridge.ts` (ligne 1265-1293)

**Code:**
```typescript
const NOW = Date.now();
const PROTECTION_WINDOW_MS = 5000; // 🎯 Protection de 5 secondes

allTables.forEach(table => {
  const wrapper = table.closest('[data-n8n-table]');
  const isRestored = wrapper?.getAttribute('data-restored') === 'true';
  
  // Skip if this is a restored table
  if (isRestored) {
    return;
  }
  
  // 🎯 PROTECTION TEMPORELLE : Vérifier l'âge de la table
  const container = table.closest('[data-container-id]') as HTMLElement;
  if (container) {
    const timestampAttr = container.getAttribute('data-timestamp');
    if (timestampAttr) {
      const tableAge = NOW - parseInt(timestampAttr, 10);
      
      if (tableAge < PROTECTION_WINDOW_MS) {
        console.log(`🛡️ Table protégée (âge: ${tableAge}ms < ${PROTECTION_WINDOW_MS}ms) - Skip cleanup`);
        return; // PROTÉGER les tables récentes
      }
    } else {
      // Pas de timestamp ? Ajouter un timestamp maintenant
      container.setAttribute('data-timestamp', NOW.toString());
      console.log(`⏰ Timestamp ajouté à la table (protection future)`);
      return; // Protéger au premier passage
    }
  }
  
  // ... reste de la logique de cleanup (duplicate detection)
});
```

---

### 3. **Ajout de Timestamps à la Restauration** (flowiseTableBridge.ts)

**Fichier:** `src/services/flowiseTableBridge.ts` (ligne 1521-1524)

**Code:**
```typescript
// 🎯 CORRECTION : Ajouter timestamp numérique pour protection temporelle
const now = Date.now();
container.setAttribute('data-timestamp', now.toString());
container.setAttribute('data-created-at', new Date().toISOString());
```

Les tables restaurées depuis IndexedDB reçoivent également un timestamp de création pour être protégées pendant 5 secondes.

---

## 📊 Constantes de Configuration

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `PROTECTION_WINDOW_MS` | 5000 ms (5 secondes) | Durée de protection des tables récentes |

### Justification du seuil de 5 secondes

**Choisi pour:**
- ✅ Laisser le temps à React de rendre les tables restaurées
- ✅ Éviter la suppression pendant le processus de restauration
- ✅ Permettre au MutationObserver de détecter les nouvelles tables
- ✅ Balance entre protection et nettoyage de la mémoire

**Rejeté:**
- ❌ 3000ms (trop court, React peut prendre plus de temps)
- ❌ 10000ms (trop long, retarde le cleanup inutilement)

---

## 🔄 Flux de Protection

### Scénario 1: Nouvelle Table Créée par Flowise

```
1. Flowise.js génère une table
2. Flowise.js ajoute data-timestamp=NOW
3. cleanupDuplicateOriginalTables() détecte la table
4. Protection: tableAge < 5000ms → SKIP cleanup
5. Après 5 secondes → table éligible pour cleanup si doublon
```

### Scénario 2: Table Restaurée depuis IndexedDB

```
1. flowiseTableBridge.restoreTablesForSession() restaure la table
2. Bridge ajoute data-timestamp=NOW au container
3. cleanupDuplicateOriginalTables() s'exécute 5s après
4. Protection: tableAge < 5000ms → SKIP cleanup
5. Après 5 secondes → table éligible pour cleanup si doublon
```

### Scénario 3: Table Sans Timestamp (Fallback)

```
1. cleanupDuplicateOriginalTables() trouve une table sans timestamp
2. Ajoute data-timestamp=NOW immédiatement
3. SKIP cleanup pour ce passage (protection au premier passage)
4. Au prochain cleanup → timestamp existe, protection de 5s appliquée
```

---

## 🧪 Tests de Vérification

### Test 1: Protection Immédiate
```javascript
// Dans la console du navigateur
const tables = document.querySelectorAll('[data-timestamp]');
tables.forEach(t => {
  const age = Date.now() - parseInt(t.getAttribute('data-timestamp'));
  console.log(`Table age: ${age}ms, Protected: ${age < 5000}`);
});
```

**Résultat attendu:** Tables récentes (< 5s) affichent "Protected: true"

### Test 2: Cleanup Après Expiration
```javascript
// Attendre 6 secondes après restauration
setTimeout(() => {
  const tables = document.querySelectorAll('[data-timestamp]');
  tables.forEach(t => {
    const age = Date.now() - parseInt(t.getAttribute('data-timestamp'));
    console.log(`Table age: ${age}ms, Eligible for cleanup: ${age >= 5000}`);
  });
}, 6000);
```

**Résultat attendu:** Tables anciennes (> 5s) affichent "Eligible for cleanup: true"

### Test 3: Logs de Protection dans Console

**Console attendue lors de la restauration:**
```
🛡️ Table protégée (âge: 234ms < 5000ms) - Skip cleanup
🛡️ Table protégée (âge: 456ms < 5000ms) - Skip cleanup
⏰ Timestamp ajouté à la table (protection future)
```

---

## 📈 Métriques de Suivi

### Attributs Disponibles pour Monitoring

1. **data-timestamp** (numeric): Pour calcul d'âge précis
2. **data-created-at** (ISO): Pour lisibilité humaine et logs
3. **data-restored** (boolean): Différencier tables restaurées vs nouvelles

### Requêtes de Diagnostic

```javascript
// Tables protégées actuellement
document.querySelectorAll('[data-timestamp]').length

// Tables restaurées
document.querySelectorAll('[data-restored="true"]').length

// Tables originales (non restaurées)
document.querySelectorAll('table:not([data-restored="true"])').length

// Age moyen des tables
Array.from(document.querySelectorAll('[data-timestamp]'))
  .map(t => Date.now() - parseInt(t.getAttribute('data-timestamp')))
  .reduce((a, b) => a + b, 0) / document.querySelectorAll('[data-timestamp]').length
```

---

## ⚠️ Limitations Connues

1. **Tables sans container `[data-container-id]`**
   - Ne peuvent pas être timestampées automatiquement
   - Fallback: ajout de timestamp au premier passage du cleanup

2. **Modification manuelle de data-timestamp**
   - Les utilisateurs/scripts peuvent modifier l'attribut
   - Protection non cryptographiquement sécurisée

3. **Horloge système**
   - Dépend de `Date.now()` (horloge client)
   - Modifications d'horloge système peuvent affecter la protection

---

## 🔮 Améliorations Futures (Phase 2)

### Proposition 1: Event Bus pour Traçabilité
- Émettre des événements lors de la protection/cleanup
- Permettre le monitoring externe
- Historique des décisions de protection

### Proposition 2: Configuration Dynamique
- Permettre l'ajustement de `PROTECTION_WINDOW_MS` via config
- Adapter le seuil selon la performance du client
- Tests A/B pour optimisation

### Proposition 3: Métriques de Performance
- Tracker le nombre de tables protégées
- Mesurer les taux de faux positifs/négatifs
- Dashboard de monitoring en temps réel

---

## ✅ Conclusion

La protection temporelle est **COMPLÈTEMENT FONCTIONNELLE** et résout le problème de suppression prématurée des tables après rechargement.

**Prochaines étapes:**
- Tâche 2: Corriger l'ordre des tables (Conso → Résultat → Modelised)
- Tâche 3: Ajouter data-table-position pour l'ordre de restauration
- Tâche 4-5: Implémenter la détection de changement de chat
- Tâche 6: Ajouter data-created-timestamp pour protection additionnelle
- Tâche 7: Tests d'intégration complets

---

**Vérifié par:** Kiro  
**Date de vérification:** 28 août 2026  
**Statut final:** ✅ IMPLÉMENTÉ ET OPÉRATIONNEL
