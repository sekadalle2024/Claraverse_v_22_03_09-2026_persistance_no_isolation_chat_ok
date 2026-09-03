# 🚨 INSTRUCTIONS TEST CRITIQUE - PERSISTANCE TABLES

## PROBLÈME ACTUEL
Le code TypeScript modifié n'est PAS chargé dans le navigateur.
Les modifications pour isolation sessions + anti-doublons ne sont pas actives.

## ✅ SOLUTION ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Fermer COMPLÈTEMENT le navigateur
1. **Fermer TOUS les onglets** ClaraVerse
2. **Fermer le navigateur** complètement (Alt+F4 ou X en haut à droite)
3. Attendre 5 secondes

### ÉTAPE 2 : Vider le cache navigateur (CRITIQUE)
1. Rouvrir le navigateur
2. Appuyer **Ctrl + Shift + Delete** (ou Ctrl + Maj + Suppr)
3. Dans la fenêtre qui s'ouvre :
   - ✅ Cocher "Images et fichiers en cache"
   - ✅ Cocher "Cookies et données de sites"
   - Période : **Dernière heure** (ou Tout)
4. Cliquer **Effacer les données** / **Clear data**
5. Fermer cette fenêtre

### ÉTAPE 3 : Vider IndexedDB (IMPORTANT)
1. Ouvrir console (F12)
2. Aller dans onglet **Application** (ou Stockage)
3. À gauche, section **Storage** :
   - Clic droit sur **IndexedDB**
   - Choisir **Delete database** ou **Supprimer**
   - Confirmer pour `clara_database` et `clara_db`
4. OU utiliser le bouton **Clear storage** en haut
5. Recharger la page (F5)

### ÉTAPE 4 : Ouvrir la NOUVELLE URL
**ATTENTION : Nouveau port !**

1. Taper dans la barre d'adresse : **http://localhost:5174/**
   (PAS 5173, mais **5174** !)
2. Appuyer Entrée
3. Attendre le chargement complet

### ÉTAPE 5 : Vérifier les logs console
Ouvrir console (F12), chercher ces logs :

✅ Logs attendus :
```
✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false
✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests
```

❌ Si vous voyez :
```
🚫 [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = true
```
→ Le cache n'est pas vidé, recommencer ÉTAPE 2

### ÉTAPE 6 : Générer une table test
1. Dans un nouveau chat, générer une table simple
   Exemple : "Créer un programme de travail basique"
2. Observer console pendant la génération
3. Chercher log : `💾 [Bridge] Handling table integrated`

### ÉTAPE 7 : Tester la persistance
1. Une fois table générée et visible
2. **F5** (actualiser la page)
3. Observer console : Chercher `Starting chronological restoration`
4. La table DOIT réapparaître automatiquement

### ÉTAPE 8 : Refaire le test automatique
1. Cliquer bouton **🧪 TEST AUTOMATIQUE COMPLET**
2. **Résultats attendus** :
   - ✅ TEST 1: Flag = false
   - ✅ TEST 2: Logs restauration trouvés
   - ✅ TEST 3: 0 contamination
   - ✅ TEST 4: 0 doublons

---

## 📋 SI LE PROBLÈME PERSISTE

### Option A : Build de production
```powershell
npm run build
npm run preview
```
Ouvrir l'URL affichée (généralement port 4173)

### Option B : Vérifier que le bon serveur tourne
Dans PowerShell :
```powershell
netstat -ano | findstr "5174"
```
Doit afficher une ligne avec :5174

### Option C : Copier logs console complets
1. Console (F12)
2. Clic droit dans console → Save as...
3. M'envoyer le fichier ou copier les 50 premières lignes

---

## ⚠️ POINTS CRITIQUES

1. **Port 5174** (pas 5173 !)
2. **Cache navigateur DOIT être vidé** (Ctrl+Shift+Delete)
3. **IndexedDB DOIT être vidée** (Application → Clear storage)
4. **Fermer/Rouvrir navigateur** entre chaque tentative
5. **Hard refresh** : Ctrl + F5 après chaque modification

---

## 🎯 OBJECTIF FINAL

Après ces étapes, vous devriez voir :

✅ Tables persistent après F5
✅ Aucune contamination (0 tables autres sessions)
✅ Aucun doublon (1 seule table par keyword)
✅ Logs restauration dans console

**Si ça ne fonctionne toujours pas, communiquez les logs console complets.**
