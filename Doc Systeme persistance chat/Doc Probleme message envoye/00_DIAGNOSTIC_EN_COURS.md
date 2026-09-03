# 🔍 DIAGNOSTIC EN COURS - Messages envoyés n'apparaissent pas

**Date:** 02 Septembre 2026, 22:27  
**Problème:** Lorsque l'utilisateur envoie un message dans le chat, celui-ci n'apparaît pas à l'écran  
**Historique:** Problème récurrent, déjà corrigé 4 fois en 2 jours (aucun mémo disponible)

---

## 📊 État Initial

### Symptômes
- User envoie un message
- Message n'apparaît pas dans le chat
- Chat reste vide ou montre seulement d'anciens messages

### Contexte
- Application fonctionne (pas d'erreur de build)
- Base de données vide (nettoyée récemment)
- Nouveau chat créé avec succès
- Log console: `📝 Auto-loaded most recent session: New Chat with 0 messages`

---

## 🛠️ Actions de Diagnostic Effectuées

### 1. Vérification du code d'envoi de message
**Fichier:** `src/components/ClaraAssistant.tsx`

**Ligne ~1529** - Ajout du message user à l'état:
```typescript
const currentMessages = [...messages, userMessage];
setMessages(currentMessages);
```

**Ligne ~1570** - Ajout du message streaming assistant:
```typescript
setMessages(prev => [...prev, streamingMessage]);
```

✅ **Code semble correct** - Les deux `setMessages()` devraient déclencher un re-render

### 2. Logs de diagnostic ajoutés

**A. Dans le composant d'input (clara_assistant_input.tsx ligne ~3208):**
```typescript
console.log('🟢 [INPUT] handleSend called', {
  inputLength: input?.length || 0,
  filesCount: files?.length || 0,
  onSendMessageExists: !!onSendMessage
});
```

**B. Avant l'appel onSendMessage (ligne ~3312):**
```typescript
console.log('🟢 [INPUT] Calling onSendMessage with:', {
  promptLength: enhancedPrompt.length,
  attachmentsCount: attachments?.length || 0
});
```

**C. Lors de l'envoi du message user (ClaraAssistant.tsx ligne ~1529):**
```typescript
console.log('🔵 [SEND] Adding user message to state:', {
  userMessageId: userMessage.id,
  userMessageContent: userMessage.content.substring(0, 50),
  currentMessagesLength: messages.length,
  newMessagesLength: currentMessages.length
});
```

**D. Lors de l'ajout du message streaming (ligne ~1570):**
```typescript
console.log('🔵 [SEND] Adding streaming message to state:', {
  streamingMessageId,
  currentMessagesCount: currentMessages.length,
  messagesStateBeforeAdd: messages.length
});
```

**E. Dans le useEffect de restauration (ligne ~454):**
```typescript
console.log('🔄 [React Restore] useEffect triggered', {
  sessionId: currentSession?.id?.substring(0, 20),
  messagesLength: messages?.length || 0,
  timestamp: Date.now()
});
```

---

## 🧪 Tests Effectués

### Test 1: Premier test - Résultat
**Action:** Envoi d'un message test dans le chat  
**Résultat:** ❌ AUCUN log `🔵 [SEND]` trouvé  
**Conclusion:** `handleSendMessage()` dans ClaraAssistant.tsx n'est jamais appelé

**→ Hypothèse:** Le problème est dans le composant d'input (`handleSend()` pas exécuté OU `onSendMessage` pas appelé)

### Test 2: En cours
**Action:** Logs ajoutés dans clara_assistant_input.tsx pour tracer handleSend()  
**Attente:** Logs `🟢 [INPUT]` pour confirmer si handleSend() est exécuté

---

## 🔎 Hypothèses Mises à Jour

### Hypothèse A: handleSend() n'est jamais appelé (NOUVELLE)
**Probabilité:** 70%

Le clic sur le bouton Send ou la touche Enter ne déclenche pas `handleSend()`.

**Causes possibles:**
- Bouton disabled par erreur
- Event listener pas attaché
- Condition `if (!input.trim() && files.length === 0)` bloque

**Solution potentielle:**
- Vérifier le HTML du bouton send
- Vérifier si `input` state est bien mis à jour pendant la frappe

### Hypothèse B: onSendMessage pas appelé
**Probabilité:** 20%

`handleSend()` s'exécute mais ne call pas `onSendMessage()`

**Solution potentielle:**
- Vérifier si un early return bloque avant l'appel
- Vérifier `checkProviderHealth()` qui peut bloquer

### Hypothèse C: onSendMessage prop undefined
**Probabilité:** 10%

La prop `onSendMessage` n'est pas passée correctement

**Solution potentielle:**
- Vérifier le passage de prop dans ClaraAssistant.tsx ligne ~4018

---

## 📝 Informations Manquantes

Pour progresser, il nous faut:
1. ✅ **Logs de la console F12** après envoi d'un message (en cours)
2. ❌ Contenu exact des corrections précédentes (aucun mémo)
3. ❌ Conditions spécifiques qui déclenchent le bug

---

## 🎯 État Actuel

**Statut:** ⏳ En attente des logs console du user

**Prochaine action:** Analyser les logs `🔵 [SEND]` et `🔄 [React Restore]` pour identifier le root cause

---

**Mis à jour:** 02 Sept 2026, 22:30
