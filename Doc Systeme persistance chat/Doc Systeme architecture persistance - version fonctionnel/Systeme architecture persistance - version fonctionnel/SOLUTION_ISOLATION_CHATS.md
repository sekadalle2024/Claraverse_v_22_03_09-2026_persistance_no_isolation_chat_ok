# 🔒 Solution - Isolation des Chats

## 📌 Problème Identifié

**Symptôme** : Les tables `[Modelised_table]` du chat précédent écrasent celles du nouveau chat.

**Cause Racine** : Le système utilise un `sessionId` stable qui **ne change pas** entre les chats, provoquant :
- ❌ Même clé de stockage pour différents chats
- ❌ Les nouvelles tables écrasent les anciennes  
- ❌ Restauration des tables de l'ancien chat dans le nouveau
- ❌ Pas d'isolation réelle entre conversations

**Référence** : `INDEX_RESTAURATION_UNIQUE.md` - Le système de session stable résout la restauration multiple mais crée un problème d'isolation.

---

## 🎯 Solution : Double Identifiant

### Architecture

```
┌─────────────────────────────────────────┐
│  ANCIEN (Problématique)                 │
├─────────────────────────────────────────┤
│  sessionId (stable)                     │
│  └── Persiste entre les chats ❌       │
│                                         │
│  Table_1 (Chat A) → IndexedDB           │
│  Table_1 (Chat B) → Écrase Chat A ❌   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  NOUVEAU (Solution)                     │
├─────────────────────────────────────────┤
│  sessionId (stable)                     │
│  └── Pour la restauration unique ✅    │
│                                         │
│  chatId (unique par conversation)       │
│  └── Pour l'isolation des chats ✅     │
│                                         │
│  Clé composite: chatId_sessionId        │
│  └── Isolation + Restauration ✅       │
└─────────────────────────────────────────┘
```

### Principe

1. **sessionId** : Identifiant stable pour la restauration unique (ne change pas)
2. **chatId** : Identifiant unique par conversation (change à chaque nouveau chat)
3. **Clé composite** : `${chatId}_${sessionId}` pour stocker les tables

---

## 🔧 Implémentation

### Phase 1 : Détecter le chatId

#### Fichier: `public/chat-id-detector.js`

```javascript
/**
 * Détecteur de chatId pour l'isolation des conversations
 * Phase 4 - Isolation inter-chats
 */

(function() {
  'use strict';

  console.log('🔍 [ChatIdDetector] Initialisation...');

  // Cache du chatId courant
  let currentChatId = null;

  /**
   * Génère un chatId unique basé sur le timestamp et un random
   */
  function generateChatId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `chat_${timestamp}_${random}`;
  }

  /**
   * Détecte le chatId depuis l'URL
   */
  function detectChatIdFromUrl() {
    try {
      const url = new URL(window.location.href);
      const chatId = url.searchParams.get('chatId') || 
                     url.searchParams.get('chat') ||
                     url.searchParams.get('id');
      
      if (chatId && chatId.trim()) {
        console.log(`🔍 [ChatIdDetector] ChatId depuis URL: ${chatId}`);
        return chatId;
      }
    } catch (err) {
      console.warn('⚠️ [ChatIdDetector] Erreur lecture URL:', err);
    }
    return null;
  }

  /**
   * Détecte le chatId depuis le sessionStorage
   */
  function detectChatIdFromStorage() {
    try {
      const stored = sessionStorage.getItem('claraverse_current_chat_id');
      if (stored && stored !== 'undefined') {
        console.log(`🔍 [ChatIdDetector] ChatId depuis storage: ${stored}`);
        return stored;
      }
    } catch (err) {
      console.warn('⚠️ [ChatIdDetector] Erreur lecture storage:', err);
    }
    return null;
  }

  /**
   * Compte le nombre de tables dans le DOM pour détecter un changement de chat
   */
  function getTableCount() {
    return document.querySelectorAll('table').length;
  }

  /**
   * Obtient le chatId actuel (avec détection automatique)
   */
  function getCurrentChatId() {
    // Si on a déjà un chatId en cache, le retourner
    if (currentChatId) {
      return currentChatId;
    }

    // 1. Essayer depuis l'URL
    let chatId = detectChatIdFromUrl();
    
    // 2. Essayer depuis le storage
    if (!chatId) {
      chatId = detectChatIdFromStorage();
    }
    
    // 3. Générer un nouveau chatId si aucun n'existe
    if (!chatId) {
      chatId = generateChatId();
      console.log(`🆕 [ChatIdDetector] Nouveau chatId généré: ${chatId}`);
    }
    
    // Sauvegarder dans le cache et le storage
    currentChatId = chatId;
    try {
      sessionStorage.setItem('claraverse_current_chat_id', chatId);
    } catch (err) {
      console.warn('⚠️ [ChatIdDetector] Impossible de sauvegarder chatId:', err);
    }
    
    return chatId;
  }

  /**
   * Détecte un changement de chat (nouveau chat ou navigation)
   */
  let previousTableCount = getTableCount();
  let chatChangeDetectionTimer = null;

  function detectChatChange() {
    clearTimeout(chatChangeDetectionTimer);
    
    chatChangeDetectionTimer = setTimeout(() => {
      const currentTableCount = getTableCount();
      
      // Si le nombre de tables diminue drastiquement, c'est probablement un nouveau chat
      if (previousTableCount > 0 && currentTableCount === 0) {
        console.log('🔄 [ChatIdDetector] Nouveau chat détecté (tables supprimées)');
        
        // Invalider le chatId actuel
        const oldChatId = currentChatId;
        currentChatId = null;
        
        // Générer un nouveau chatId
        const newChatId = getCurrentChatId();
        
        // Émettre un événement de changement de chat
        document.dispatchEvent(new CustomEvent('claraverse:chat:changed', {
          detail: {
            oldChatId: oldChatId,
            newChatId: newChatId,
            timestamp: Date.now()
          },
          bubbles: true,
          cancelable: false
        }));
        
        console.log(`✅ [ChatIdDetector] Changement: ${oldChatId} → ${newChatId}`);
      }
      
      previousTableCount = currentTableCount;
    }, 500); // Attendre 500ms pour éviter les faux positifs
  }

  // Observer les changements dans le DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        detectChatChange();
        break;
      }
    }
  });

  // Démarrer l'observation
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // API Globale
  window.chatIdDetector = {
    getCurrentChatId,
    generateChatId,
    reset: () => {
      currentChatId = null;
      sessionStorage.removeItem('claraverse_current_chat_id');
      console.log('🔄 [ChatIdDetector] Reset effectué');
    },
    setChatId: (chatId) => {
      currentChatId = chatId;
      sessionStorage.setItem('claraverse_current_chat_id', chatId);
      console.log(`🔒 [ChatIdDetector] ChatId forcé: ${chatId}`);
    }
  };

  console.log('✅ [ChatIdDetector] Prêt - chatId:', getCurrentChatId());

})();
```

---

### Phase 2 : Adapter le système de sauvegarde

#### Modification: `public/conso-indexeddb-bridge.js`

```javascript
// AVANT (ligne ~39)
function getCurrentSessionId() {
  // 1. Via le pont menu-persistence-bridge (le plus fiable)
  if (window.claraverseSyncAPI?.getCurrentSessionId) {
    const id = window.claraverseSyncAPI.getCurrentSessionId();
    if (id) return id;
  }
  // ...
}

// APRÈS
function getCurrentSessionId() {
  // Phase 4: Utiliser chatId_sessionId pour l'isolation
  const chatId = getCurrentChatId();
  const sessionId = getBaseSessionId();
  
  // Clé composite pour isolation
  return `${chatId}_${sessionId}`;
}

function getCurrentChatId() {
  // 1. Via le détecteur de chatId
  if (window.chatIdDetector?.getCurrentChatId) {
    return window.chatIdDetector.getCurrentChatId();
  }
  
  // 2. Fallback: générer un chatId temporaire
  const fallback = `chat_${Date.now()}`;
  console.warn('⚠️ [ConsoIndexedDB] chatIdDetector non disponible, fallback:', fallback);
  return fallback;
}

function getBaseSessionId() {
  // Session stable (pour restauration)
  if (window.claraverseSyncAPI?.getBaseSessionId) {
    return window.claraverseSyncAPI.getBaseSessionId();
  }
  
  // Fallback
  const fallback = sessionStorage.getItem('claraverse_stable_session') || 'session_1';
  return fallback;
}
```

---

### Phase 3 : Adapter la restauration

#### Modification: `public/single-restore-on-load.js`

```javascript
// AVANT (ligne ~50)
async function restoreTables() {
  const sessionId = getCurrentSessionId();
  console.log(`📍 [SingleRestore] Restauration pour session: ${sessionId}`);
  // ...
}

// APRÈS
async function restoreTables() {
  const chatId = getCurrentChatId();
  const sessionId = getBaseSessionId();
  const compositeKey = `${chatId}_${sessionId}`;
  
  console.log(`📍 [SingleRestore] Restauration pour chat: ${chatId}, session: ${sessionId}`);
  console.log(`🔑 [SingleRestore] Clé composite: ${compositeKey}`);
  
  // Utiliser la clé composite pour la restauration
  // ...
}

function getCurrentChatId() {
  return window.chatIdDetector?.getCurrentChatId() || `chat_${Date.now()}`;
}

function getBaseSessionId() {
  return sessionStorage.getItem('claraverse_stable_session') || 'session_1';
}
```

---

### Phase 4 : Gérer le changement de chat

#### Fichier: `public/chat-change-handler.js`

```javascript
/**
 * Gestionnaire de changement de chat
 * Phase 4 - Isolation inter-chats
 */

(function() {
  'use strict';

  console.log('🔄 [ChatChangeHandler] Initialisation...');

  // Écouter les changements de chat
  document.addEventListener('claraverse:chat:changed', async function(event) {
    const { oldChatId, newChatId, timestamp } = event.detail;
    
    console.log('🔄 [ChatChangeHandler] Changement de chat détecté');
    console.log(`  Ancien: ${oldChatId}`);
    console.log(`  Nouveau: ${newChatId}`);
    
    // 1. Sauvegarder les tables actuelles avec l'ancien chatId
    if (oldChatId) {
      console.log('💾 [ChatChangeHandler] Sauvegarde des tables de l\'ancien chat...');
      // Les tables seront automatiquement sauvegardées avec oldChatId
      // car getCurrentChatId() retourne encore oldChatId à ce moment
    }
    
    // 2. Attendre que le DOM se stabilise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Nettoyer le DOM (supprimer les tables de l'ancien chat)
    console.log('🧹 [ChatChangeHandler] Nettoyage du DOM...');
    const allTables = document.querySelectorAll('table');
    allTables.forEach(table => {
      // Vérifier si la table appartient à l'ancien chat
      const tableSessionId = table.dataset.consoSessionId;
      if (tableSessionId && tableSessionId.startsWith(oldChatId + '_')) {
        console.log(`🗑️ [ChatChangeHandler] Suppression table de l'ancien chat`);
        table.remove();
      }
    });
    
    // 4. Attendre encore un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. Restaurer les tables du nouveau chat (si elles existent)
    console.log('📥 [ChatChangeHandler] Restauration du nouveau chat...');
    
    // Vérifier si le nouveau chat a des tables sauvegardées
    const hasSavedTables = await checkIfChatHasSavedTables(newChatId);
    
    if (hasSavedTables) {
      console.log('✅ [ChatChangeHandler] Tables trouvées, restauration...');
      
      // Déclencher la restauration via l'événement
      document.dispatchEvent(new CustomEvent('claraverse:restore:request', {
        detail: {
          chatId: newChatId,
          timestamp: Date.now()
        },
        bubbles: true,
        cancelable: false
      }));
    } else {
      console.log('ℹ️ [ChatChangeHandler] Pas de tables sauvegardées pour ce chat');
    }
  });

  /**
   * Vérifie si un chat a des tables sauvegardées
   */
  async function checkIfChatHasSavedTables(chatId) {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('clara_db', 12);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['clara_generated_tables'], 'readonly');
      const store = transaction.objectStore('clara_generated_tables');
      
      const allTables = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      // Vérifier si des tables commencent par ce chatId
      const chatTables = allTables.filter(t => 
        t.sessionId && t.sessionId.startsWith(chatId + '_')
      );

      return chatTables.length > 0;
    } catch (err) {
      console.error('❌ [ChatChangeHandler] Erreur vérification tables:', err);
      return false;
    }
  }

  console.log('✅ [ChatChangeHandler] Prêt');

})();
```

---

## 📝 Ordre de Chargement

### Mise à jour: `index.html`

```html
<!-- Phase 4: Isolation des chats -->
<script src="/chat-id-detector.js"></script>
<script src="/chat-change-handler.js"></script>

<!-- Système de persistance (doit charger APRÈS chat-id-detector) -->
<script src="/restore-lock-manager.js"></script>
<script src="/menu-persistence-bridge.js"></script>
<script src="/conso-indexeddb-bridge.js"></script>
<script src="/single-restore-on-load.js"></script>
```

---

## 🧪 Tests

### Test 1: Vérifier le chatId

```javascript
// Console navigateur
console.log('ChatId actuel:', window.chatIdDetector.getCurrentChatId());

// Devrait afficher quelque chose comme: chat_1735390000000_abc1234
```

### Test 2: Simuler un changement de chat

```javascript
// 1. Créer des tables dans le chat A
// 2. Noter le chatId
const chatA = window.chatIdDetector.getCurrentChatId();
console.log('Chat A:', chatA);

// 3. Forcer un nouveau chat
window.chatIdDetector.reset();

// 4. Créer des tables dans le chat B
const chatB = window.chatIdDetector.getCurrentChatId();
console.log('Chat B:', chatB);

// 5. Vérifier que chatA !== chatB
console.log('Chats différents:', chatA !== chatB); // true
```

### Test 3: Vérifier l'isolation dans IndexedDB

```javascript
// Ouvrir IndexedDB
const req = indexedDB.open('clara_db', 12);
req.onsuccess = () => {
  const db = req.result;
  const tx = db.transaction(['clara_generated_tables'], 'readonly');
  const store = tx.objectStore('clara_generated_tables');
  
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    const tables = getAll.result;
    
    // Regrouper par chatId
    const byChat = {};
    tables.forEach(t => {
      const chatId = t.sessionId.split('_')[0] + '_' + t.sessionId.split('_')[1];
      if (!byChat[chatId]) byChat[chatId] = [];
      byChat[chatId].push(t);
    });
    
    console.log('Tables par chat:', byChat);
    // Devrait montrer des groupes séparés
  };
};
```

---

## ✅ Résultat Attendu

Après l'implémentation :

1. ✅ Chaque chat a un `chatId` unique
2. ✅ Les tables sont sauvegardées avec `chatId_sessionId`
3. ✅ Les tables d'un chat n'écrasent pas celles d'un autre
4. ✅ La restauration charge uniquement les tables du chat actuel
5. ✅ Le changement de chat déclenche la sauvegarde + nettoyage + restauration

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| Identifiant | `sessionId` (stable) | `chatId_sessionId` (unique) |
| Isolation | ❌ Écrasement | ✅ Séparation complète |
| Changement de chat | ❌ Tables mélangées | ✅ Nettoyage + Restauration |
| Stockage | 1 clé pour tous | 1 clé par chat |
| Restauration | ✅ Fonctionne | ✅ Fonctionne + Isolation |

---

*Solution créée le 28 août 2026*
