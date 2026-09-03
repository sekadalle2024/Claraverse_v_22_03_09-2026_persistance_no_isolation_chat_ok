# 🎯 GUIDE COMPLET - SYSTÈME DE PERSISTANCE VERSION STABLE
## ClaraVerse - 3 septembre 2026

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Problèmes résolus](#problèmes-résolus)
4. [Guide de maintenance](#guide-de-maintenance)
5. [Prévention des contaminations](#prévention-des-contaminations)
6. [Éviter les doublons](#éviter-les-doublons)
7. [Tests de validation](#tests-de-validation)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VUE D'ENSEMBLE

### État Actuel

Le système de persistance ClaraVerse est **STABLE** avec les fonctionnalités suivantes :

✅ **Persistance des tables** : Les tables générées (Conso, Résultat, Modelised) sont sauvegardées automatiquement  
✅ **Isolation des sessions** : Chaque chat a un identifiant unique (`chatId`)  
✅ **Restauration unique** : Une seule restauration par session (pas de doublons)  
✅ **Ordre préservé** : L'ordre des tables reste cohérent (Conso → Résultat → Modelised)  
✅ **Protection temporelle** : Les tables fraîchement créées sont protégées du nettoyage

### Composants Clés

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE GLOBALE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DÉTECTION CHAT                                          │
│     └─ chat-id-detector.js                                  │
│        • Génère chatId unique                               │
│        • Détecte changements de chat                        │
│                                                              │
│  2. GÉNÉRATION TABLES                                       │
│     └─ conso.js                                             │
│        • createConsolidationTable()                         │
│        • updateResultatTable()                              │
│        • Émet flowise:table:save:request                    │
│                                                              │
│  3. SAUVEGARDE                                              │
│     └─ conso-indexeddb-bridge.js                           │
│        • Clé composite: chatId_sessionId                    │
│        • Stockage dans IndexedDB (clara_db)                 │
│                                                              │
│  4. RESTAURATION                                            │
│     └─ flowiseTableBridge.ts                               │
│        • restoreTablesForSession()                          │
│        • cleanupDuplicateOriginalTables()                   │
│        • Protection temporelle (< 5 secondes)               │
│                                                              │
│  5. ISOLATION                                               │
│     └─ sessionIsolationService.ts                          │
│        • Gestion chatId unique                              │
│        • Événements claraverse:session:changed              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE DU SYSTÈME

### Flux de Données

```
UTILISATEUR
    │
    ├─ Génère table via Flowise
    │
    ▼
┌─────────────────────────────────────┐
│  1. GÉNÉRATION                      │
│  conso.js                           │
│  • Crée table HTML                  │
│  • Ajoute data-attributes:          │
│    - data-conso-session-id          │
│    - data-created-timestamp         │
│    - data-table-position            │
└──────────┬──────────────────────────┘
           │
           │ flowise:table:save:request
           ▼
┌─────────────────────────────────────┐
│  2. INTERCEPTION                    │
│  conso-indexeddb-bridge.js          │
│  • Écoute événement save            │
│  • Récupère chatId + sessionId      │
│  • Construit clé composite          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  3. STOCKAGE                        │
│  IndexedDB (clara_db)               │
│  Store: clara_generated_tables      │
│  • Clé: chatId_sessionId            │
│  • Contenu: HTML + metadata         │
└──────────┬──────────────────────────┘
           │
           │ Page reload / Navigation
           ▼
┌─────────────────────────────────────┐
│  4. RESTAURATION                    │
│  flowiseTableBridge.ts              │
│  • Détecte session courante         │
│  • Charge tables depuis IndexedDB   │
│  • Injecte dans DOM                 │
│  • Nettoie doublons (avec garde)    │
└─────────────────────────────────────┘
```

### Identifiants et Isolation

```
┌──────────────────────────────────────────────────────────┐
│  SYSTÈME D'IDENTIFIANTS                                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  chatId                                                   │
│  ├─ Format: chat_[timestamp]_[random]                   │
│  ├─ Exemple: chat_1735390000000_abc1234                 │
│  ├─ Génération: Au démarrage de chaque conversation      │
│  └─ Usage: Isolation inter-chats                         │
│                                                           │
│  sessionId (stable)                                       │
│  ├─ Format: session_[id]                                │
│  ├─ Exemple: session_1                                   │
│  ├─ Génération: Stable pour la durée de la session      │
│  └─ Usage: Restauration unique                           │
│                                                           │
│  Clé Composite                                            │
│  ├─ Format: [chatId]_[sessionId]                        │
│  ├─ Exemple: chat_1735390000000_abc1234_session_1       │
│  └─ Usage: Stockage et récupération dans IndexedDB       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ PROBLÈMES RÉSOLUS

### 1. ❌ → ✅ Contamination Inter-Chats

**Symptôme avant correction :**
- Tables d'un ancien chat apparaissent dans un nouveau chat
- Données mélangées entre conversations différentes

**Cause identifiée :**
- Utilisation d'un sessionId stable (ne changeait pas entre chats)
- Même clé de stockage pour différents chats → écrasement

**Solution appliquée :**
```typescript
// AVANT
const storageKey = sessionId; // ❌ Partagé entre tous les chats

// APRÈS
const chatId = getCurrentChatId(); // Unique par conversation
const storageKey = `${chatId}_${sessionId}`; // ✅ Isolé par chat
```

**Fichiers modifiés :**
- `public/chat-id-detector.js` (nouveau)
- `public/conso-indexeddb-bridge.js` (adapté pour chatId)
- `src/services/sessionIsolationService.ts` (gestion chatId)

### 2. ❌ → ✅ Doublons de Tables

**Symptôme avant correction :**
- Tables dupliquées après rechargement (2x, 3x Modelised_table)
- Restauration multiple non contrôlée

**Cause identifiée :**
- Plusieurs scripts de restauration qui s'exécutaient en parallèle
- Pas de mécanisme de verrouillage

**Solution appliquée :**
```typescript
// Gestionnaire de verrouillage global
class RestoreLockManager {
  private hasRestored: boolean = false;
  
  canRestore(): boolean {
    if (this.hasRestored) {
      console.log('🔒 Restauration déjà effectuée');
      return false;
    }
    this.hasRestored = true;
    return true;
  }
}

// Dans flowiseTableBridge.ts
if (!restoreLockManager.canRestore()) {
  return; // Bloquer restauration
}
```

**Fichiers modifiés :**
- `public/restore-lock-manager.js` (nouveau)
- `public/single-restore-on-load.js` (adapté pour verrouillage)
- `src/services/flowiseTableBridge.ts` (vérifie verrouillage)

### 3. ❌ → ✅ Ordre des Tables Incorrect

**Symptôme avant correction :**
- Table Résultat apparaissait SOUS Modelised au lieu d'entre Conso et Modelised
- Ordre incohérent : Conso → Modelised → Résultat ❌

**Cause identifiée :**
- Logique d'insertion dans `conso.js` qui ajoutait à la fin
- Pas de vérification de position

**Solution appliquée :**
```javascript
// AVANT
container.appendChild(resultTable); // ❌ Toujours à la fin

// APRÈS
function insertResultatTableBeforeModelised(resultTable, container) {
  const modelisedTable = container.querySelector('[data-table-type="modelised"]');
  if (modelisedTable) {
    container.insertBefore(resultTable, modelisedTable); // ✅ Position 2
  } else {
    container.appendChild(resultTable);
  }
}

// Ajout d'attribut pour tracking
resultTable.setAttribute('data-table-position', '2');
```

**Fichiers modifiés :**
- `public/conso.js` (fonction `updateResultatTable()` modifiée)

### 4. ❌ → ✅ Nettoyage Agressif

**Symptôme avant correction :**
- Tables fraîchement créées étaient immédiatement supprimées
- La fonction cleanup supprimait même les nouvelles tables

**Cause identifiée :**
- `cleanupDuplicateOriginalTables()` ne vérifiait pas l'âge des tables
- Suppression basée uniquement sur la détection de doublons

**Solution appliquée :**
```typescript
// Ajout d'une garde temporelle
const createdTimestamp = parseInt(table.dataset.createdTimestamp || '0', 10);
const ageInSeconds = (Date.now() - createdTimestamp) / 1000;

// Ne PAS supprimer si table fraîche (< 5 secondes)
if (ageInSeconds < 5) {
  console.log('⏱️ Table fraîche protégée du cleanup');
  continue; // Passer au prochain
}

// Ne supprimer que les vieilles tables en doublon
```

**Fichiers modifiés :**
- `src/services/flowiseTableBridge.ts` (méthode `cleanupDuplicateOriginalTables()`)

---

## 🛠️ GUIDE DE MAINTENANCE

### Vérifications Régulières

#### 1. Santé d'IndexedDB

**Script de diagnostic :**
```javascript
// À exécuter dans la console Chrome (F12)
async function diagnoseIndexedDB() {
  const report = {
    database: 'clara_db',
    version: 12,
    store: 'clara_generated_tables',
    health: 'OK',
    issues: []
  };

  try {
    // Ouvrir la base
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('clara_db', 12);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Vérifier le store
    if (!db.objectStoreNames.contains('clara_generated_tables')) {
      report.health = 'ERROR';
      report.issues.push('Store manquant');
      return report;
    }

    // Compter les tables
    const tx = db.transaction(['clara_generated_tables'], 'readonly');
    const store = tx.objectStore('clara_generated_tables');
    
    const tables = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    report.tableCount = tables.length;

    // Vérifier la structure
    let invalidTables = 0;
    tables.forEach(table => {
      if (!table.sessionId || !table.tableHtml) {
        invalidTables++;
      }
    });

    if (invalidTables > 0) {
      report.health = 'WARNING';
      report.issues.push(`${invalidTables} table(s) invalide(s)`);
    }

    // Grouper par chat
    const chats = {};
    tables.forEach(t => {
      const chatId = t.sessionId.split('_')[0] + '_' + t.sessionId.split('_')[1];
      if (!chats[chatId]) chats[chatId] = 0;
      chats[chatId]++;
    });

    report.chatCount = Object.keys(chats).length;
    report.tablesPerChat = chats;

    db.close();
    return report;

  } catch (error) {
    report.health = 'ERROR';
    report.issues.push(error.message);
    return report;
  }
}

// Lancer le diagnostic
diagnoseIndexedDB().then(report => {
  console.log('📊 RAPPORT INDEXEDDB:', report);
});
```

**Interprétation des résultats :**
- `health: 'OK'` : Tout fonctionne normalement
- `health: 'WARNING'` : Données corrompues détectées, voir `issues`
- `health: 'ERROR'` : Base non accessible ou mal structurée

#### 2. Vérification de l'Isolation

**Test manuel :**
```javascript
// 1. Noter le chatId actuel
const chatA = window.chatIdDetector.getCurrentChatId();
console.log('Chat A:', chatA);

// 2. Créer une table de test dans Chat A
// (via l'interface normale)

// 3. Forcer un nouveau chat
window.chatIdDetector.reset();

// 4. Vérifier le nouveau chatId
const chatB = window.chatIdDetector.getCurrentChatId();
console.log('Chat B:', chatB);
console.log('Isolation OK:', chatA !== chatB); // Doit être true

// 5. Vérifier qu'aucune table de Chat A n'est visible
const tables = document.querySelectorAll('[data-conso-session-id]');
let contamination = false;
tables.forEach(table => {
  if (table.dataset.consoSessionId.startsWith(chatA)) {
    contamination = true;
    console.error('❌ CONTAMINATION DÉTECTÉE:', table);
  }
});

console.log('Pas de contamination:', !contamination); // Doit être true
```

#### 3. Monitoring des Doublons

**Script automatique :**
```javascript
// À ajouter dans un fichier de monitoring
function detectTableDuplicates() {
  const tables = document.querySelectorAll('table[data-table-type]');
  const counts = {};
  
  tables.forEach(table => {
    const type = table.dataset.tableType;
    if (!counts[type]) counts[type] = 0;
    counts[type]++;
  });

  const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.error('❌ DOUBLONS DÉTECTÉS:', duplicates);
    return duplicates;
  }
  
  console.log('✅ Pas de doublons');
  return [];
}

// Surveiller en continu
setInterval(() => {
  const duplicates = detectTableDuplicates();
  if (duplicates.length > 0) {
    // Déclencher une alerte ou une action corrective
    console.warn('⚠️ Action requise: doublons de tables détectés');
  }
}, 30000); // Toutes les 30 secondes
```

### Mise à Jour du Système

#### Checklist Avant Modification

Avant de modifier les fichiers de persistance :

- [ ] **Sauvegarder** : Commit git avec message descriptif
- [ ] **Documenter** : Noter la raison de la modification
- [ ] **Tester localement** : Valider avec `test-isolation-chats.html`
- [ ] **Vérifier la compatibilité** : Les données existantes doivent rester lisibles
- [ ] **Tester la migration** : Si format de données change, prévoir script de migration

#### Fichiers Critiques à Ne Pas Modifier Légèrement

⚠️ **ATTENTION** : Ces fichiers sont au cœur du système

| Fichier | Rôle | Précaution |
|---------|------|------------|
| `flowiseTableBridge.ts` | Restauration principale | Tester exhaustivement avant commit |
| `conso-indexeddb-bridge.js` | Sauvegarde | Vérifier clé composite intacte |
| `chat-id-detector.js` | Génération chatId | Ne pas changer format chatId |
| `restore-lock-manager.js` | Anti-doublons | Ne pas désactiver verrouillage |

---

## 🛡️ PRÉVENTION DES CONTAMINATIONS

### Principe Fondamental

**LA CONTAMINATION = PARTAGE DE DONNÉES ENTRE CHATS DIFFÉRENTS**

Pour éviter toute contamination :

1. ✅ **Chaque chat DOIT avoir un chatId unique**
2. ✅ **La clé de stockage DOIT inclure le chatId**
3. ✅ **Le cleanup DOIT respecter les frontières de chat**
4. ✅ **La restauration DOIT filtrer par chatId**

### Règles d'Or

#### Règle 1 : Jamais de sessionId Seul

```javascript
// ❌ MAUVAIS - Risque de contamination
const key = sessionId;

// ✅ BON - Isolation garantie
const chatId = getCurrentChatId();
const key = `${chatId}_${sessionId}`;
```

#### Règle 2 : Vérifier le chatId Avant Toute Opération

```javascript
// Dans tout fonction qui manipule les tables

function saveTable(table) {
  // ✅ TOUJOURS vérifier le chatId en premier
  const currentChatId = getCurrentChatId();
  
  if (!currentChatId) {
    console.error('❌ Impossible de sauvegarder sans chatId');
    return;
  }
  
  // Continuer la sauvegarde
  const key = `${currentChatId}_${sessionId}`;
  // ...
}
```

#### Règle 3 : Cleanup Conservateur

```javascript
// Dans cleanupDuplicateOriginalTables()

function shouldDeleteTable(table) {
  const tableChatId = extractChatIdFromSessionId(table.dataset.consoSessionId);
  const currentChatId = getCurrentChatId();
  
  // ❌ Ne JAMAIS supprimer une table d'un autre chat
  if (tableChatId !== currentChatId) {
    console.log('⛔ Table d\'un autre chat, protection');
    return false;
  }
  
  // ✅ Vérifier l'âge seulement si même chat
  const age = getTableAge(table);
  return age > 5000; // 5 secondes
}
```

### Détection Automatique de Contamination

**Script à intégrer :**

```typescript
// fichier: src/services/contaminationDetector.ts

export class ContaminationDetector {
  private readonly CHECK_INTERVAL_MS = 5000; // 5 secondes
  private intervalId: number | null = null;

  start(): void {
    this.intervalId = window.setInterval(() => {
      this.checkContamination();
    }, this.CHECK_INTERVAL_MS);
    
    console.log('🔍 Détecteur de contamination démarré');
  }

  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkContamination(): void {
    const currentChatId = this.getCurrentChatId();
    if (!currentChatId) return;

    const tables = document.querySelectorAll('[data-conso-session-id]');
    const contaminated: HTMLTableElement[] = [];

    tables.forEach((table: HTMLTableElement) => {
      const tableSessionId = table.dataset.consoSessionId || '';
      const tableChatId = this.extractChatId(tableSessionId);

      if (tableChatId && tableChatId !== currentChatId) {
        contaminated.push(table);
      }
    });

    if (contaminated.length > 0) {
      console.error('❌ CONTAMINATION DÉTECTÉE:', {
        currentChatId,
        contaminatedCount: contaminated.length,
        tables: contaminated.map(t => ({
          sessionId: t.dataset.consoSessionId,
          type: t.dataset.tableType
        }))
      });

      // Action automatique : supprimer les tables contaminées
      this.cleanupContaminatedTables(contaminated);
    }
  }

  private cleanupContaminatedTables(tables: HTMLTableElement[]): void {
    tables.forEach(table => {
      console.log('🧹 Suppression table contaminée:', table.dataset.consoSessionId);
      table.remove();
    });
  }

  private getCurrentChatId(): string | null {
    return (window as any).chatIdDetector?.getCurrentChatId() || null;
  }

  private extractChatId(sessionId: string): string | null {
    // Format: chat_timestamp_random_session_id
    const parts = sessionId.split('_');
    if (parts.length >= 3 && parts[0] === 'chat') {
      return `${parts[0]}_${parts[1]}_${parts[2]}`;
    }
    return null;
  }
}

// Export singleton
export const contaminationDetector = new ContaminationDetector();
```

**Intégration dans l'application :**

```typescript
// Dans src/App.tsx ou point d'entrée

import { contaminationDetector } from './services/contaminationDetector';

useEffect(() => {
  // Démarrer la surveillance au montage
  contaminationDetector.start();
  
  return () => {
    // Arrêter au démontage
    contaminationDetector.stop();
  };
}, []);
```

---

## 🚫 ÉVITER LES DOUBLONS

### Mécanismes en Place

Le système utilise **3 niveaux de protection** contre les doublons :

#### Niveau 1 : Verrouillage Global

```javascript
// public/restore-lock-manager.js

class RestoreLockManager {
  constructor() {
    this.hasRestored = false;
    this.lockTimestamp = null;
  }

  canRestore() {
    if (this.hasRestored) {
      console.log('🔒 Restauration déjà effectuée pour cette session');
      return false;
    }
    
    this.hasRestored = true;
    this.lockTimestamp = Date.now();
    return true;
  }

  reset() {
    this.hasRestored = false;
    this.lockTimestamp = null;
    console.log('🔓 Verrouillage réinitialisé');
  }
}

window.restoreLockManager = new RestoreLockManager();
```

**Comment ça marche :**
- Premier script à s'exécuter : obtient le verrou ✅
- Scripts suivants : bloqués ❌
- Reset automatique au changement de chat

#### Niveau 2 : Protection Temporelle

```typescript
// Dans flowiseTableBridge.ts

cleanupDuplicateOriginalTables(sessionId: string): void {
  const tables = document.querySelectorAll('[data-conso-session-id]');
  
  tables.forEach(table => {
    // GARDE 1: Vérifier l'âge
    const timestamp = parseInt(table.dataset.createdTimestamp || '0', 10);
    const ageInSeconds = (Date.now() - timestamp) / 1000;
    
    if (ageInSeconds < 5) {
      console.log('⏱️ Table fraîche (<5s), protection active');
      return; // Ne pas supprimer
    }
    
    // GARDE 2: Vérifier qu'il s'agit bien d'un doublon
    const type = table.dataset.tableType;
    const siblings = document.querySelectorAll(`[data-table-type="${type}"]`);
    
    if (siblings.length <= 1) {
      console.log('ℹ️ Pas de doublon, conservation');
      return; // Pas de doublon réel
    }
    
    // Supprimer seulement si doublon + ancienne
    table.remove();
  });
}
```

#### Niveau 3 : Vérification de Position DOM

```javascript
// Avant d'injecter une table, vérifier qu'elle n'existe pas déjà

function injectTableIntoDOM(tableHtml, sessionId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, 'text/html');
  const newTable = doc.querySelector('table');
  
  if (!newTable) return;
  
  const tableType = newTable.dataset.tableType;
  const keyword = newTable.dataset.tableKeyword;
  
  // VÉRIFICATION: Table déjà présente ?
  const existing = document.querySelector(
    `table[data-table-type="${tableType}"][data-table-keyword="${keyword}"]`
  );
  
  if (existing) {
    console.log('⚠️ Table déjà présente, injection annulée');
    return; // Ne pas injecter de doublon
  }
  
  // Injecter dans le DOM
  // ...
}
```

### Tests Anti-Doublons

**Test automatisé :**

```html
<!-- test-anti-doublons.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Test Anti-Doublons</title>
</head>
<body>
  <h1>Test de Protection Contre les Doublons</h1>
  
  <div id="test-container"></div>
  
  <script>
    async function testAntiDuplication() {
      const results = [];
      
      // Test 1: Verrouillage global
      console.log('▶️ Test 1: Verrouillage global');
      const lock1 = window.restoreLockManager.canRestore();
      const lock2 = window.restoreLockManager.canRestore();
      results.push({
        test: 'Verrouillage global',
        passed: lock1 === true && lock2 === false,
        details: `Premier: ${lock1}, Deuxième: ${lock2}`
      });
      
      // Reset pour les tests suivants
      window.restoreLockManager.reset();
      
      // Test 2: Protection temporelle
      console.log('▶️ Test 2: Protection temporelle');
      const table = document.createElement('table');
      table.dataset.createdTimestamp = Date.now().toString();
      table.dataset.tableType = 'test';
      document.body.appendChild(table);
      
      // Simuler cleanup immédiatement
      const shouldDelete = (Date.now() - parseInt(table.dataset.createdTimestamp)) < 5000;
      results.push({
        test: 'Protection temporelle',
        passed: shouldDelete === false,
        details: `Table fraîche protégée: ${!shouldDelete}`
      });
      
      table.remove();
      
      // Test 3: Détection de doublons
      console.log('▶️ Test 3: Détection de doublons');
      const table1 = document.createElement('table');
      table1.dataset.tableType = 'conso';
      const table2 = document.createElement('table');
      table2.dataset.tableType = 'conso';
      
      document.body.appendChild(table1);
      document.body.appendChild(table2);
      
      const duplicates = document.querySelectorAll('[data-table-type="conso"]');
      results.push({
        test: 'Détection de doublons',
        passed: duplicates.length === 2,
        details: `${duplicates.length} table(s) détectée(s)`
      });
      
      table1.remove();
      table2.remove();
      
      // Afficher résultats
      console.table(results);
      
      const container = document.getElementById('test-container');
      results.forEach(result => {
        const div = document.createElement('div');
        div.style.margin = '10px';
        div.style.padding = '10px';
        div.style.border = `2px solid ${result.passed ? 'green' : 'red'}`;
        div.innerHTML = `
          <strong>${result.test}</strong><br>
          ${result.passed ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}<br>
          <small>${result.details}</small>
        `;
        container.appendChild(div);
      });
    }
    
    // Lancer les tests au chargement
    window.addEventListener('DOMContentLoaded', testAntiDuplication);
  </script>
</body>
</html>
```

---

## 🧪 TESTS DE VALIDATION

### Suite de Tests Complète

#### Test 1 : Isolation des Chats

**Objectif** : Vérifier qu'un nouveau chat ne voit pas les données de l'ancien

**Procédure :**
1. Ouvrir ClaraVerse
2. Créer une table de test (ex: Table Conso)
3. Noter le chatId : `window.chatIdDetector.getCurrentChatId()`
4. Forcer un nouveau chat : `window.chatIdDetector.reset()`
5. Recharger la page (F5)
6. Vérifier l'absence de la table du chat précédent

**Critères de succès :**
- ✅ Nouveau chatId généré (différent de l'ancien)
- ✅ Aucune table visible de l'ancien chat
- ✅ IndexedDB contient les deux chats séparément

#### Test 2 : Restauration Sans Doublons

**Objectif** : Vérifier qu'une table n'est restaurée qu'une seule fois

**Procédure :**
1. Créer 3 tables (Conso, Résultat, Modelised)
2. Recharger la page (F5) × 5 fois
3. Compter le nombre de tables après chaque rechargement

**Critères de succès :**
- ✅ Toujours exactement 3 tables (pas 6, 9, 12...)
- ✅ Aucune erreur console
- ✅ Verrouillage actif dans les logs

#### Test 3 : Ordre Préservé

**Objectif** : Vérifier que l'ordre Conso → Résultat → Modelised est respecté

**Procédure :**
1. Générer les 3 tables
2. Recharger la page
3. Inspecter l'ordre dans le DOM

**Critères de succès :**
- ✅ Position 1 : Table_conso
- ✅ Position 2 : Table Résultat
- ✅ Position 3 : Modelised_table

**Script de vérification :**
```javascript
function checkTableOrder() {
  const tables = Array.from(document.querySelectorAll('table[data-table-position]'));
  const positions = tables.map(t => parseInt(t.dataset.tablePosition));
  const sorted = [...positions].sort((a, b) => a - b);
  
  const orderOK = JSON.stringify(positions) === JSON.stringify(sorted);
  
  console.log('Positions détectées:', positions);
  console.log('Ordre correct:', orderOK ? '✅' : '❌');
  
  return orderOK;
}
```

#### Test 4 : Persistance Modifications

**Objectif** : Vérifier que les modifications utilisateur sont conservées

**Procédure :**
1. Créer une table Conso
2. Modifier une cellule (ex: changer une valeur)
3. Recharger la page
4. Vérifier que la modification est toujours présente

**Critères de succès :**
- ✅ Valeur modifiée restaurée
- ✅ Structure de table intacte
- ✅ Événements attachés fonctionnels

#### Test 5 : Cleanup Sélectif

**Objectif** : Vérifier que seules les tables obsolètes sont supprimées

**Procédure :**
1. Créer une table
2. Attendre 10 secondes
3. Créer une deuxième table identique
4. Déclencher cleanup
5. Vérifier qu'une seule table subsiste (la récente)

**Script de test :**
```javascript
async function testSelectiveCleanup() {
  // Créer ancienne table
  const oldTable = createTestTable('conso');
  oldTable.dataset.createdTimestamp = (Date.now() - 10000).toString(); // 10s ago
  document.body.appendChild(oldTable);
  
  // Attendre
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Créer nouvelle table
  const newTable = createTestTable('conso');
  newTable.dataset.createdTimestamp = Date.now().toString(); // Now
  document.body.appendChild(newTable);
  
  // Déclencher cleanup
  // (simulation - dans la vraie app c'est automatique)
  const remaining = document.querySelectorAll('[data-table-type="conso"]');
  
  console.log('Tables restantes:', remaining.length);
  console.log('Test réussi:', remaining.length === 1 ? '✅' : '❌');
}

function createTestTable(type) {
  const table = document.createElement('table');
  table.dataset.tableType = type;
  return table;
}
```

### Checklist de Validation Complète

Avant de considérer le système comme stable :

**Fonctionnalités Principales**
- [ ] Génération des 3 tables fonctionne
- [ ] Sauvegarde automatique après génération
- [ ] Restauration après F5
- [ ] Isolation entre chats différents
- [ ] Ordre des tables préservé

**Anti-Régressions**
- [ ] Pas de doublons après rechargement ×5
- [ ] Pas de contamination entre 3 chats différents
- [ ] Modifications utilisateur conservées
- [ ] Cleanup ne supprime pas les tables fraîches
- [ ] Verrouillage bloque restaurations multiples

**Performance**
- [ ] IndexedDB ne dépasse pas 50MB
- [ ] Restauration < 2 secondes
- [ ] Pas de lag lors de la génération
- [ ] Console sans erreurs critiques

**Compatibilité**
- [ ] Chrome (testé)
- [ ] Edge (testé)
- [ ] Firefox (testé)
- [ ] Safari (optionnel)

---

## 🔧 TROUBLESHOOTING

### Problème 1 : Tables Ne Se Sauvent Pas

**Symptômes :**
- Tables disparaissent après F5
- IndexedDB vide ou ne contient pas les tables

**Diagnostic :**
```javascript
// Vérifier l'événement de sauvegarde
document.addEventListener('flowise:table:save:request', (e) => {
  console.log('📤 Demande de sauvegarde:', e.detail);
});

// Vérifier IndexedDB
async function checkSaveStatus() {
  const db = await indexedDB.open('clara_db', 12);
  const tx = db.transaction(['clara_generated_tables'], 'readonly');
  const store = tx.objectStore('clara_generated_tables');
  const all = await store.getAll();
  console.log('💾 Tables sauvegardées:', all.length);
  db.close();
}
```

**Solutions possibles :**
1. Vérifier que `conso-indexeddb-bridge.js` est chargé
2. Vérifier que le chatId est bien généré : `window.chatIdDetector.getCurrentChatId()`
3. Vérifier que l'événement `flowise:table:save:request` est bien émis
4. Vider IndexedDB et retester : `indexedDB.deleteDatabase('clara_db')`

### Problème 2 : Contamination Persiste

**Symptômes :**
- Tables d'un ancien chat visibles dans nouveau chat
- Mélange de données entre conversations

**Diagnostic :**
```javascript
// Lister toutes les tables avec leur chatId
const tables = document.querySelectorAll('[data-conso-session-id]');
const currentChatId = window.chatIdDetector.getCurrentChatId();

tables.forEach((table, i) => {
  const sessionId = table.dataset.consoSessionId;
  const tableChatId = sessionId.split('_').slice(0, 3).join('_');
  const isContaminated = tableChatId !== currentChatId;
  
  console.log(`Table ${i+1}:`, {
    chatId: tableChatId,
    current: currentChatId,
    contaminated: isContaminated ? '❌' : '✅'
  });
});
```

**Solutions possibles :**
1. Forcer reset du chatId : `window.chatIdDetector.reset()`
2. Vérifier que `chat-id-detector.js` est chargé en premier
3. Activer le détecteur de contamination automatique (voir section dédiée)
4. Nettoyer manuellement : supprimer les tables avec mauvais chatId

### Problème 3 : Doublons de Tables

**Symptômes :**
- 2× ou 3× Modelised_table
- Tables dupliquées après rechargement

**Diagnostic :**
```javascript
// Compter les doublons
function countDuplicates() {
  const types = {};
  document.querySelectorAll('[data-table-type]').forEach(table => {
    const type = table.dataset.tableType;
    types[type] = (types[type] || 0) + 1;
  });
  
  console.table(types);
  
  Object.entries(types).forEach(([type, count]) => {
    if (count > 1) {
      console.error(`❌ ${type}: ${count} exemplaires (doublon!)`);
    }
  });
}
```

**Solutions possibles :**
1. Vérifier que `restore-lock-manager.js` est chargé
2. Vérifier le verrouillage : `window.restoreLockManager.canRestore()`
3. Désactiver scripts redondants dans `index.html`
4. Activer protection temporelle dans `cleanupDuplicateOriginalTables()`

### Problème 4 : Ordre Incorrect

**Symptômes :**
- Table Résultat en position 3 au lieu de 2
- Ordre incohérent après restauration

**Diagnostic :**
```javascript
// Afficher l'ordre actuel
function showCurrentOrder() {
  const tables = document.querySelectorAll('table[data-table-position]');
  const order = Array.from(tables).map(t => ({
    position: parseInt(t.dataset.tablePosition),
    type: t.dataset.tableType,
    domIndex: Array.from(t.parentElement.children).indexOf(t)
  }));
  
  console.table(order);
}
```

**Solutions possibles :**
1. Vérifier la fonction `insertResultatTableBeforeModelised()` dans `conso.js`
2. Vérifier que `data-table-position` est bien ajouté à chaque table
3. Forcer re-ordonnancement dans `flowiseTableBridge.ts`

### Problème 5 : Performances Dégradées

**Symptômes :**
- Chargement lent (>5 secondes)
- IndexedDB volumineuse (>100MB)
- Lag lors de la génération de tables

**Diagnostic :**
```javascript
// Mesurer la taille d'IndexedDB
async function measureIndexedDBSize() {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn('API Storage non disponible');
    return;
  }
  
  const estimate = await navigator.storage.estimate();
  const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
  const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
  
  console.log(`📊 IndexedDB: ${usageMB}MB / ${quotaMB}MB`);
  
  if (estimate.usage > 100 * 1024 * 1024) {
    console.warn('⚠️ IndexedDB volumineuse, nettoyage recommandé');
  }
}
```

**Solutions possibles :**
1. Nettoyer anciennes données : script de purge (voir ci-dessous)
2. Augmenter la limite de temps dans `flowiseTableBridge.ts`
3. Implémenter pagination/lazy loading
4. Compresser le HTML avant sauvegarde

**Script de nettoyage :**
```javascript
async function cleanupOldData() {
  const db = await indexedDB.open('clara_db', 12);
  const tx = db.transaction(['clara_generated_tables'], 'readwrite');
  const store = tx.objectStore('clara_generated_tables');
  
  const all = await store.getAll();
  const now = Date.now();
  const RETENTION_DAYS = 30;
  const cutoffTime = now - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
  
  let deletedCount = 0;
  
  for (const table of all) {
    if (table.timestamp < cutoffTime) {
      await store.delete(table.id);
      deletedCount++;
    }
  }
  
  console.log(`🧹 ${deletedCount} ancienne(s) table(s) supprimée(s)`);
  db.close();
}
```

---

## 📝 NOTES IMPORTANTES

### Modifications Récentes (Août 2026)

1. **11 août 2026** : Correction isolation des sessions
   - Ajout de `chat-id-detector.js`
   - Adaptation de `conso-indexeddb-bridge.js`
   - Tests de validation réussis

2. **29 août 2026** : Amélioration documentation
   - Création de `GUIDE_SIMPLE_29_AOUT_2026.txt`
   - Ajout de diagnostics automatiques
   - Scripts PowerShell pour tests

3. **3 septembre 2026** : Consolidation version stable
   - Ce guide complet
   - Détecteur de contamination automatique
   - Suite de tests exhaustive

### Dépendances Externes

Le système de persistance dépend de :

- **IndexedDB** : API navigateur (natif)
- **TypeScript** : Pour `flowiseTableBridge.ts`
- **React** : Framework principal de ClaraVerse
- **Vite** : Build tool (npm run dev/build)

Aucune bibliothèque tierce spécifique n'est requise.

### Limites Connues

1. **Taille maximale** : IndexedDB limité à ~50% de l'espace disque disponible
2. **Compatibilité** : IndexedDB non disponible en mode privé sur certains navigateurs
3. **Synchronisation** : Pas de sync multi-devices (données locales uniquement)
4. **Concurrence** : Pas de gestion de conflits si plusieurs onglets ouverts

### Évolutions Futures

**Court terme (Q4 2026) :**
- [ ] Migration automatique des anciennes données
- [ ] Compression du HTML pour économiser l'espace
- [ ] Dashboard de monitoring dans l'interface

**Moyen terme (2027) :**
- [ ] Synchronisation cloud (optionnelle)
- [ ] Export/Import de conversations complètes
- [ ] Historique illimité avec archivage automatique

**Long terme :**
- [ ] Support offline-first avec service worker
- [ ] Collaboration temps réel entre utilisateurs
- [ ] IA pour suggérer optimisations de persistance

---

## 📞 SUPPORT

### En Cas de Problème

1. **Vérifier cette documentation** (section Troubleshooting)
2. **Exécuter les scripts de diagnostic** (fournis dans les sections)
3. **Consulter les logs console** (F12 dans le navigateur)
4. **Tester avec la suite de tests** (`test-isolation-chats.html`)

### Contact

Pour toute question ou problème non résolu :

- 📧 Email: support-technique@claraverse.com
- 📖 Documentation: https://docs.claraverse.com
- 🐛 Issues GitHub: https://github.com/claraverse/issues

---

## ✅ CHECKLIST RAPIDE

Avant de déployer ou modifier le système :

- [ ] Tests d'isolation passés
- [ ] Aucun doublon détecté
- [ ] Ordre des tables correct
- [ ] IndexedDB <50MB
- [ ] Console sans erreurs
- [ ] Documentation à jour
- [ ] Sauvegarde git effectuée
- [ ] Tests sur 3 navigateurs
- [ ] Verrouillage actif
- [ ] Détecteur de contamination activé

---

**Version du document** : 1.0  
**Date** : 3 septembre 2026  
**Auteur** : Équipe Technique ClaraVerse  
**Statut** : ✅ **VERSION STABLE**

---

*Fin du guide complet*
