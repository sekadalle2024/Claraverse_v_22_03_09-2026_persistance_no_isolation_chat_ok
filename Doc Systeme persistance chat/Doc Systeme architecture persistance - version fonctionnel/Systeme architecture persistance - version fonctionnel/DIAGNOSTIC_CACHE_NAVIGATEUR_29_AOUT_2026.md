# 🔴 DIAGNOSTIC : Cache Navigateur - 29 août 2026

## ✅ CAUSE IDENTIFIÉE

Le problème vient très probablement du **CACHE DU NAVIGATEUR** :

1. ✅ `npm run dev` est utilisé → Vite compile à la volée ✓
2. ❌ **AUCUN hard refresh (Ctrl+Shift+R) effectué** → Ancien JS en cache ✗
3. ❌ URL ne change pas → Pas de sessionId visible dans l'URL ✗

## 🎯 SOLUTION IMMÉDIATE (1 minute)

### Étape 1 : Hard Refresh du navigateur

```
Windows : Ctrl + Shift + R
ou
Ctrl + F5
```

### Étape 2 : Vider le cache si le problème persiste

**Dans Chrome/Edge :**
1. F12 (ouvrir DevTools)
2. Clic droit sur le bouton de refresh 🔄
3. Sélectionner **"Vider le cache et actualiser de manière forcée"**

**Dans Firefox :**
1. F12 (ouvrir DevTools)
2. Clic droit sur le bouton de refresh 🔄
3. Sélectionner **"Vider le cache et actualiser"**

### Étape 3 : Vérifier dans la console

```javascript
// Ouvrir la console (F12)
console.log("Session actuelle:", window.currentSessionId);
debugFlowiseTableState(window.currentSessionId);
```

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES

### A. Le sessionId est-il défini ?

Dans la console :
```javascript
window.currentSessionId
// Devrait retourner: "session_XXXXXXXX" ou similaire
```

### B. La fonction switchToSession est-elle appelée ?

Ajoutez un log temporaire dans `flowiseTableBridge.ts` ligne ~554 :
```typescript
async switchToSession(sessionId: string): Promise<void> {
    console.log("🔄 SWITCH TO SESSION:", sessionId); // ← AJOUTEZ CECI
    await this.clearAllTablesFromDOM(sessionId);
    await this.restoreTablesForSession(sessionId);
}
```

### C. Les tables ont-elles l'attribut data-session-id ?

Dans la console :
```javascript
document.querySelectorAll('[data-session-id]').forEach(el => {
    console.log("Table:", el.id, "Session:", el.getAttribute('data-session-id'));
});
```

## 📋 CHECKLIST DE DIAGNOSTIC

- [ ] Hard refresh effectué (Ctrl+Shift+R)
- [ ] Cache vidé via DevTools
- [ ] `window.currentSessionId` est défini
- [ ] `switchToSession()` est appelée au changement de session
- [ ] Les tables ont l'attribut `data-session-id`
- [ ] localStorage contient bien `flowise_tables_<sessionId>`

## 🚨 SI LE PROBLÈME PERSISTE APRÈS LE HARD REFRESH

### Option 1 : Vérifier le localStorage

```javascript
// Dans la console
Object.keys(localStorage)
    .filter(k => k.startsWith('flowise_tables_'))
    .forEach(k => console.log(k));
```

### Option 2 : Réinitialiser complètement

```javascript
// ATTENTION : Ceci efface toutes les données
localStorage.clear();
location.reload();
```

### Option 3 : Vérifier la version du code en cours

```javascript
// Ajouter temporairement dans flowiseTableBridge.ts en début de fichier
console.log("🔧 FlowiseTableBridge VERSION: 29-AOUT-2026-ISOLATION-FIX");
```

Recharger la page et vérifier que ce message apparaît dans la console.

## 📊 RÉSULTAT ATTENDU APRÈS CORRECTION

Après le hard refresh :
1. ✅ Changement de session → anciennes tables disparaissent
2. ✅ Nouvelles tables apparaissent avec le bon `data-session-id`
3. ✅ Pas de mélange de données entre sessions
4. ✅ localStorage séparé par session

## 💡 EXPLICATION TECHNIQUE

**Pourquoi le cache pose problème ?**

Avec `npm run dev` :
- Vite compile le TypeScript → JavaScript
- Le navigateur charge le JS
- **MAIS** le navigateur met le JS en cache
- Les modifications de code ne sont PAS automatiquement rechargées
- **Solution** : Hard refresh pour forcer le rechargement

**Différence avec `npm run build` :**
- `build` génère des fichiers dans `/dist` avec des hash de version
- Chaque build a un nom de fichier différent
- Le navigateur ne peut PAS utiliser l'ancien cache
- Mais avec `dev`, le nom reste le même → cache possible
