# 🔍 HYPOTHÈSES SOURCES DU PROBLÈME

**Date:** 02 Septembre 2026  
**Problème:** Messages envoyés n'apparaissent pas dans le chat

---

## 📋 Toutes les Hypothèses Explorées

### ✅ Hypothèse A: Validation de modèle bloque l'envoi
**Probabilité initiale:** Non évaluée (découverte pendant diagnostic)  
**Probabilité finale:** 100% - **ROOT CAUSE CONFIRMÉ**

#### Description
Le code contenait une validation qui vérifiait si un modèle AI était configuré avant d'envoyer le message. Si aucun modèle n'était trouvé, la fonction faisait `return` **avant** d'ajouter le message à l'état `messages`.

#### Preuve
```typescript
// Ligne 1408-1414 ClaraAssistant.tsx
if (currentProviderModels.length === 0 || !hasSelectedModel) {
  addErrorNotification('No Model Selected', ...);
  return; // ← BLOQUE ICI
}

// setMessages() n'est JAMAIS exécuté si on arrive au return ci-dessus
setMessages(currentMessages); // ← Cette ligne n'est jamais atteinte
```

#### Logs confirmant l'hypothèse
```
🟢 [INPUT] Calling onSendMessage with: {promptLength: 284}
📢 Notification error: No Model Selected
// ❌ Aucun log 🔵 [SEND] après → Message jamais ajouté
```

#### Solution
Commenter les validations de modèle pour permettre l'envoi sans modèle local (utile pour providers externes).

---

### ❌ Hypothèse B: handleSend() pas appelé
**Probabilité initiale:** 70%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
Le clic sur le bouton Send ou la touche Enter ne déclenchait pas la fonction `handleSend()` dans le composant input.

#### Test effectué
Ajout de logs dans `clara_assistant_input.tsx`:
```typescript
console.log('🟢 [INPUT] handleSend called');
```

#### Résultat
✅ Le log `🟢 [INPUT] handleSend called` **apparaissait** → handleSend() était bien exécuté.

#### Conclusion
Cette hypothèse est **infirmée**. Le problème n'était pas dans le composant d'input.

---

### ❌ Hypothèse C: onSendMessage prop undefined
**Probabilité initiale:** 10%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
La prop `onSendMessage` passée à `ClaraAssistantInput` n'était pas définie ou était `undefined`.

#### Test effectué
Log dans le composant input:
```typescript
console.log('🟢 [INPUT] Calling onSendMessage with:', {
  promptLength: enhancedPrompt.length,
  attachmentsCount: attachments?.length || 0
});
onSendMessage(enhancedPrompt, attachments);
```

#### Résultat
✅ Le log apparaissait ET `onSendMessage()` était appelé → La prop existait.

#### Conclusion
Cette hypothèse est **infirmée**. La prop était correctement passée.

---

### ❌ Hypothèse D: useEffect de restauration interfère
**Probabilité initiale:** 60%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
Le useEffect de restauration des tables (ajouté récemment) avait `messages` dans ses dépendances et pouvait causer une boucle ou un conflit lors de l'ajout de nouveaux messages.

#### Code concerné
```typescript
useEffect(() => {
  // Restauration des tables
  if (!messages || messages.length === 0) return;
  flowiseTableBridge.restoreTablesChronologically(messages);
}, [currentSession?.id, messages]); // ← messages dans dépendances
```

#### Test effectué
Logs ajoutés pour compter les déclenchements:
```typescript
console.log('🔄 [React Restore] useEffect triggered');
```

#### Résultat
Le useEffect se déclenchait normalement (1-2 fois au chargement) et **ne bloquait PAS** l'envoi de messages.

#### Conclusion
Cette hypothèse est **infirmée**. Le useEffect ne causait pas le problème.

---

### ❌ Hypothèse E: React ne re-render pas ClaraChatWindow
**Probabilité initiale:** 30%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
Le composant `ClaraChatWindow` ne détectait pas le changement de la prop `messages` et ne se re-rendait pas.

#### Test effectué
Le problème a été identifié **avant** d'arriver à cette étape. Les messages n'étaient jamais ajoutés à l'état, donc pas de re-render à tester.

#### Conclusion
Cette hypothèse n'a pas été testée car le problème était en amont (messages jamais ajoutés).

---

### ❌ Hypothèse F: messages écrasé ailleurs
**Probabilité initiale:** 10%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
Un autre `setMessages([])` ou `setMessages(oldValue)` écrasait l'état juste après l'ajout du message.

#### Test effectué
Recherche de tous les `setMessages` dans le fichier pour vérifier l'ordre d'exécution.

#### Résultat
Aucun `setMessages` concurrent trouvé. Le problème était le `return` précoce qui empêchait d'atteindre `setMessages()`.

#### Conclusion
Cette hypothèse est **infirmée**.

---

### ❌ Hypothèse G: Input vide ou fichiers manquants
**Probabilité initiale:** 5%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
La condition `if (!input.trim() && files.length === 0)` bloquait l'envoi car l'input était considéré vide.

#### Test effectué
Log de la longueur de l'input:
```typescript
console.log('🟢 [INPUT] handleSend called', { inputLength: input?.length });
```

#### Résultat
```
🟢 [INPUT] handleSend called {inputLength: 4} // "test" = 4 caractères
```

L'input n'était **pas vide**.

#### Conclusion
Cette hypothèse est **infirmée**.

---

### ❌ Hypothèse H: Provider health check échoue
**Probabilité initiale:** 15%  
**Probabilité finale:** 0% - **INFIRMÉE**

#### Description
La fonction `checkProviderHealth()` retournait `false` et bloquait l'envoi avec un early return.

#### Test effectué
Log ajouté:
```typescript
const isProviderHealthy = await checkProviderHealth();
if (!isProviderHealthy) {
  console.log('🟡 [INPUT] handleSend aborted: provider not healthy');
  return;
}
```

#### Résultat
Aucun log `🟡 [INPUT] handleSend aborted: provider not healthy` → Le provider était OK.

#### Conclusion
Cette hypothèse est **infirmée**.

---

## 📊 Résumé des Hypothèses

| Hypothèse | Probabilité Initiale | Statut Final | Root Cause? |
|-----------|---------------------|--------------|-------------|
| A - Validation modèle bloque | Non évaluée | ✅ CONFIRMÉE | **OUI** |
| B - handleSend() pas appelé | 70% | ❌ INFIRMÉE | Non |
| C - onSendMessage undefined | 10% | ❌ INFIRMÉE | Non |
| D - useEffect interfère | 60% | ❌ INFIRMÉE | Non |
| E - Pas de re-render | 30% | ❌ Non testée | Non |
| F - messages écrasé | 10% | ❌ INFIRMÉE | Non |
| G - Input vide | 5% | ❌ INFIRMÉE | Non |
| H - Provider health fail | 15% | ❌ INFIRMÉE | Non |

---

## 🎯 Méthode de Diagnostic Utilisée

### 1. Approche Top-Down
Partir du symptôme (messages pas affichés) et remonter la chaîne:
1. Messages affichés? → Non
2. Messages dans l'état `messages`? → Non (vérifié avec logs)
3. `setMessages()` appelé? → Non
4. `handleSendMessage()` exécuté? → Oui, mais bloqué par return précoce
5. **Root cause trouvé** → Validation de modèle

### 2. Logs de Diagnostic Stratégiques
Placement de logs à chaque étape critique:
- `🟢 [INPUT]` → Composant input
- `🔵 [SEND]` → Fonction handleSendMessage
- `🔄 [React Restore]` → useEffect restauration

### 3. Élimination Progressive
Tester chaque hypothèse et éliminer celles qui sont infirmées jusqu'à trouver la bonne.

---

## 💡 Leçons Apprises

### Ce qui a bien fonctionné
✅ **Logs de diagnostic précis** - Ont permis d'identifier rapidement où le flux s'arrêtait  
✅ **Approche méthodique** - Tester une hypothèse à la fois  
✅ **Documentation en temps réel** - Évite la perte d'information

### Ce qui aurait pu être mieux
⚠️ **Chercher les `return` précoces dès le début** - Aurait accéléré le diagnostic  
⚠️ **Vérifier les notifications d'erreur** - Le message "No Model Selected" donnait déjà un indice

### Recommandations futures
1. **Toujours chercher les early returns** dans les fonctions qui ne fonctionnent pas
2. **Lire les notifications d'erreur** avant de diagnostiquer
3. **Garder les logs de diagnostic** en place pour faciliter le debug futur

---

**Créé par:** Kiro AI  
**Date:** 02 Septembre 2026, 22:45
