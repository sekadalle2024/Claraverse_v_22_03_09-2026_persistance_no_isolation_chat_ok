# 🚀 GUIDE D'IMPLÉMENTATION - Correction Persistance Tables ClaraVerse

## 📋 RÉSUMÉ EXÉCUTIF

Vous devez résoudre **3 problèmes critiques** de persistance des tables générées automatiquement par `conso.js` :

1. **🔴 Table [Résultat] positionnée SOUS [Modelised_table]** au lieu d'ENTRE [Table_conso] et [Modelised_table]
2. **🔴 Tables d'un ancien chat contaminent le nouveau chat** (session non liée au chat actif)
3. **🟡 Ordre de restauration perturbé** après rechargement

## 🎯 OBJECTIF

Garantir que l'ordre des tables dans le DOM soit TOUJOURS :
```
📊 Table de Consolidation (Table_conso)
📋 Table Résultat  
📑 Table Modélisée (Modelised_table)
```

## 📂 FICHIERS À MODIFIER

### Priorité CRITIQUE 🔴
1. **`public/auto-restore-chat-change.js`** - Lier sessionId au chat actif
2. **`public/conso.js`** - Corriger positionnement Table Résultat
3. **`src/services/flowiseTableBridge.ts`** - Protéger la nouvelle Modelised_table du cleanup

### Priorité MOYENNE 🟡
4. **`public/conso-indexeddb-bridge.js`** - Synchroniser avec changements de session

## 🔧 MODIFICATIONS DÉTAILLÉES

---

### 1️⃣ **auto-restore-chat-change.js**

#### ❌ PROBLÈME ACTUEL
- Le `sessionId` est global et stable (`claraverse_stable_session`)
- Il ne change PAS lors du changement de chat
- Résultat : les tables de l'ancien chat sont restaurées dans le nouveau chat

#### ✅ SOLUTION
Détecter l'ID de conversation ClaraVerse et réinitialiser le `sessionId` lors du changement de chat.

#### 📝 CODE À AJOUTER

**A. Détecter l'ID de conversation depuis le DOM/URL/React**

```javascript
// Ajouter après la fonction restoreCurrentSession()

// === DÉTECTION DU CHAT ACTIF ===
function detectChatId() {
    // 1. Depuis l'URL (prioritaire)
    const pathMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
    if (pathMatch) return pathMatch[1];
    
    // 2. Depuis un attribut DOM React
    const chatContainer = document.querySelector('[data-chat-id], [data-conversation-id]');
    if (chatContainer) {
        return chatContainer.dataset.chatId || chatContainer.dataset.conversationId;
    }
    
    // 3. Depuis le state React global
    if (window.claraverseState?.currentChat?.id) {
        return window.claraverseState.currentChat.id;
    }
    
    // 4. Depuis le titre du chat (fallback)
    const title = document.querySelector('[data-chat-title]')?.textContent;
    if (title) {
        return `chat_${title.substring(0, 20)}_${Date.now()}`;
    }
    
    return null;
}

let lastDetectedChatId = null;

function onChatChanged(newChatId) {
    console.log(`🔄 Changement de chat détecté: ${lastDetectedChatId} → ${newChatId}`);
    
    // Effacer l'ancien sessionId
    try {
        sessionStorage.removeItem('claraverse_stable_session');
    } catch (e) {}
    
    // Générer un nouveau sessionId lié au chat
    const newSessionId = `chat_${newChatId}_${Date.now()}`;
    try {
        sessionStorage.setItem('claraverse_stable_session', newSessionId);
    } catch (e) {}
    
    // Émettre l'événement de changement de session
    document.dispatchEvent(new CustomEvent('claraverse:session:changed', {
        detail: { 
            oldSessionId: lastDetectedChatId ? `chat_${lastDetectedChatId}` : null,
            newSessionId: newSessionId,
            chatId: newChatId 
        }
    }));
    
    lastDetectedChatId = newChatId;
    
    // Déclencher une restauration après un court délai
    setTimeout(() => {
        restoreCurrentSession();
    }, 500);
}

// Surveiller les changements de chat
function monitorChatChanges() {
    // Via popstate (navigation navigateur)
    window.addEventListener('popstate', () => {
        const chatId = detectChatId();
        if (chatId && chatId !== lastDetectedChatId) {
            onChatChanged(chatId);
        }
    });
    
    // Via MutationObserver (changement de titre ou d'attributs)
    const chatObserver = new MutationObserver(() => {
        const chatId = detectChatId();
        if (chatId && chatId !== lastDetectedChatId) {
            onChatChanged(chatId);
        }
    });
    
    chatObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-chat-id', 'data-conversation-id']
    });
}

// Initialiser au chargement
setTimeout(() => {
    const initialChatId = detectChatId();
    if (initialChatId) {
        lastDetectedChatId = initialChatId;
        console.log(`📍 Chat initial détecté: ${initialChatId}`);
    }
    monitorChatChanges();
}, 1000);
```

---

### 2️⃣ **conso.js**

#### ❌ PROBLÈME ACTUEL
Dans la fonction `updateResultatTable()`, la table Résultat est insérée APRÈS la [Modelised_table] au lieu d'AVANT.

#### ✅ SOLUTION
Modifier l'insertion pour positionner la Table Résultat entre Table_conso et Modelised_table.

#### 📝 CODE À MODIFIER

Localiser la fonction `updateResultatTable()` (rechercher "updateResultatTable" dans conso.js) et remplacer la logique d'insertion par :

```javascript
// AVANT (incorrect) :
// consoContainer.appendChild(resultatTable); 
// OU
// modelisedTable.after(resultatTable);

// APRÈS (correct) :
function insertResultatTableBeforeModelised(resultatTable, modelisedTable) {
    // 1. Chercher la Table_conso (au-dessus de la Modelised_table)
    const consoTable = document.querySelector('.claraverse-conso-table');
    
    if (consoTable && modelisedTable) {
        // Insérer entre conso et modelised
        modelisedTable.parentNode.insertBefore(resultatTable, modelisedTable);
        console.log('✅ Table Résultat positionnée entre Conso et Modelised');
    } else if (modelisedTable) {
        // Pas de Table_conso trouvée, insérer avant Modelised
        modelisedTable.parentNode.insertBefore(resultatTable, modelisedTable);
        console.log('⚠️ Table Résultat positionnée avant Modelised (pas de Conso trouvée)');
    } else {
        // Fallback : insérer dans le conteneur
        const container = document.querySelector('[data-container-id]') || document.body;
        container.appendChild(resultatTable);
        console.log('⚠️ Table Résultat insérée dans le conteneur (fallback)');
    }
}

// Dans updateResultatTable(), remplacer l'insertion par :
insertResultatTableBeforeModelised(resultatTable, modelisedTable);
```

**Important :** Ajouter également un attribut `data-table-position="2"` sur la Table Résultat pour aider la restauration :

```javascript
resultatTable.setAttribute('data-table-position', '2'); // 1=Conso, 2=Résultat, 3=Modelised
```

---

### 3️⃣ **flowiseTableBridge.ts**

#### ❌ PROBLÈME ACTUEL
La fonction `cleanupDuplicateOriginalTables()` supprime la NOUVELLE [Modelised_table] du nouveau chat car elle a les mêmes en-têtes que l'ancienne table restaurée.

#### ✅ SOLUTION
Protéger les tables fraîchement générées (< 5 secondes) du cleanup.

#### 📝 CODE À MODIFIER

Localiser `cleanupDuplicateOriginalTables()` dans `src/services/flowiseTableBridge.ts` (ligne ~1224) et ajouter une protection :

```typescript
private cleanupDuplicateOriginalTables(): void {
    console.log('🧹 Cleaning up duplicate original tables...');
    
    // 1. Extraire les signatures des tables restaurées
    const restoredTables = document.querySelectorAll<HTMLTableElement>(
        'table[data-restored="true"]'
    );
    
    const restoredSignatures = new Set<string>();
    const restoredKeywords = new Set<string>();
    const restoredFirstHeaders = new Set<string>();
    
    restoredTables.forEach(table => {
        // Signature par en-têtes
        const headers = Array.from(table.querySelectorAll('th'))
            .map(th => th.textContent?.trim() || '')
            .filter(Boolean)
            .sort();
        if (headers.length > 0) {
            restoredSignatures.add(headers.join('|'));
        }
        
        // Keyword
        const keyword = table.dataset.n8nKeyword;
        if (keyword) {
            restoredKeywords.add(keyword);
        }
        
        // Premier en-tête (Table_conso, Résultat, etc.)
        const firstHeader = headers[0];
        if (firstHeader) {
            restoredFirstHeaders.add(firstHeader);
        }
    });
    
    // 2. Scanner les tables NON restaurées
    const allTables = document.querySelectorAll<HTMLTableElement>('table:not([data-restored="true"])');
    
    allTables.forEach(table => {
        // 🛡️ PROTECTION : Ne jamais supprimer une table fraîche
        const createdAt = parseInt(table.dataset.createdTimestamp || '0', 10);
        const now = Date.now();
        const ageInSeconds = (now - createdAt) / 1000;
        
        if (createdAt > 0 && ageInSeconds < 5) {
            console.log(`🛡️ Table protégée (créée il y a ${ageInSeconds.toFixed(1)}s)`);
            return; // Sauter cette table
        }
        
        // 🛡️ PROTECTION : Ne jamais supprimer si dans un message récent
        const messageContainer = table.closest('[data-message-id]');
        if (messageContainer) {
            const messageTimestamp = parseInt(messageContainer.dataset.messageTimestamp || '0', 10);
            const messageAge = (now - messageTimestamp) / 1000;
            if (messageTimestamp > 0 && messageAge < 10) {
                console.log(`🛡️ Table dans un message récent (${messageAge.toFixed(1)}s)`);
                return;
            }
        }
        
        // Vérifier si c'est un doublon
        const headers = Array.from(table.querySelectorAll('th'))
            .map(th => th.textContent?.trim() || '')
            .filter(Boolean)
            .sort();
        const signature = headers.join('|');
        const keyword = table.dataset.n8nKeyword;
        const firstHeader = headers[0];
        
        const isDuplicate = 
            (signature && restoredSignatures.has(signature)) ||
            (keyword && restoredKeywords.has(keyword)) ||
            (firstHeader && restoredFirstHeaders.has(firstHeader));
        
        if (isDuplicate) {
            console.log(`🗑️ Suppression doublon: ${firstHeader || keyword || 'table sans nom'}`);
            table.remove();
        }
    });
    
    console.log('✅ Cleanup completed');
}
```

**Important :** S'assurer que conso.js tagge les tables à leur création :

```javascript
// Dans conso.js, lors de la création d'une table :
table.setAttribute('data-created-timestamp', Date.now().toString());
```

---

### 4️⃣ **conso-indexeddb-bridge.js**

#### ✅ SOLUTION
Écouter l'événement `claraverse:session:changed` pour mettre à jour le sessionId.

#### 📝 CODE À AJOUTER

Ajouter à la fin du fichier (avant le `console.log` final) :

```javascript
// ─── Synchronisation avec changement de chat ─────────────────────────────────

let currentBridgeSessionId = getCurrentSessionId();

document.addEventListener('claraverse:session:changed', function (event) {
    const detail = event.detail;
    console.log('🔄 [ConsoIndexedDB] Session changée:', detail);
    
    // Mettre à jour le sessionId interne
    currentBridgeSessionId = detail.newSessionId || getCurrentSessionId();
    
    // Forcer une nouvelle détection au prochain save
    console.log(`✅ [ConsoIndexedDB] Nouvelle session: ${currentBridgeSessionId}`);
});

// Modifier getCurrentSessionId() pour utiliser le cache :
function getCurrentSessionId() {
    if (currentBridgeSessionId) return currentBridgeSessionId;
    
    // [... reste du code existant ...]
}
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Après avoir appliqué toutes les modifications :

### Test 1 : Ordre des tables
- [ ] Ouvrir un chat
- [ ] Générer une [Modelised_table] avec colonnes Assertion/Conclusion/Ctr
- [ ] Vérifier que la Table Résultat apparaît ENTRE Table_conso et Modelised_table
- [ ] Ordre attendu : Conso → Résultat → Modelised

### Test 2 : Persistance simple
- [ ] Modifier des cellules dans les 3 tables
- [ ] Recharger la page (F5)
- [ ] Vérifier que les 3 tables ont conservé leurs modifications
- [ ] Vérifier que l'ordre est respecté

### Test 3 : Isolation inter-chats
- [ ] Chat A : Générer des tables et modifier des cellules
- [ ] Ouvrir Chat B (nouveau chat)
- [ ] Vérifier que les tables du Chat A ne contaminent PAS le Chat B
- [ ] Retourner au Chat A
- [ ] Vérifier que les données du Chat A sont toujours là

### Test 4 : IndexedDB
- [ ] Ouvrir DevTools (F12) → Application → IndexedDB → `clara_db` → `clara_generated_tables`
- [ ] Vérifier que chaque chat a un `sessionId` différent
- [ ] Exemple : `chat_abc123_1234567890` vs `chat_xyz789_1234567891`

---

## 🐛 DÉPANNAGE

### Problème : Les tables n'apparaissent pas dans le bon ordre
**Solution :** Vérifier dans `conso.js` que `insertResultatTableBeforeModelised()` est bien appelée.

### Problème : Les tables de l'ancien chat apparaissent toujours
**Solution :** 
1. Ouvrir la console (F12)
2. Vérifier que l'événement `claraverse:session:changed` est bien émis
3. Vérifier le `sessionId` actif : `sessionStorage.getItem('claraverse_stable_session')`

### Problème : Les tables disparaissent après rechargement
**Solution :** Vérifier dans IndexedDB (`clara_generated_tables`) que les tables sont bien enregistrées avec le bon `sessionId`.

---

## 📞 CONTACT

Si vous rencontrez des difficultés :
1. Consulter `MEMO_MISE_EN_OEUVRE_PERSISTANCE.md` pour l'architecture complète
2. Consulter `PLAN_IMPLEMENTATION_CHAT_PERSISTANCE.md` pour l'analyse détaillée des causes

---

**Date de création :** 28 août 2026  
**Version du plan :** 1.0  
**Statut :** 🔴 EN ATTENTE D'IMPLÉMENTATION
