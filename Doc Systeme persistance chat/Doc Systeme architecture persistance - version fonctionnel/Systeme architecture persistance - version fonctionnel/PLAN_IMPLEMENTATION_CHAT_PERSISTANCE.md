Plan d'Implémentation — Correction des Problèmes Persistants de Tables ClaraVerse
Contexte et Diagnostic
Après analyse approfondie du code, voici les causes racines exactes des problèmes restants signalés dans la [Tâche Actualisée] 1.

Problèmes Confirmés et Analyse
🔴 Problème [Tâche Actualisée] 1.A — Table [Résultat] se positionne en DESSOUS de [Modelised_table]
Cause racine identifiée dans conso.js → fonction updateResultatTable() :

La table [Résultat] est créée APRÈS la [Modelised_table] dans le DOM, ce qui la place en dessous. La logique d'insertion de insertConsoTable() insère la Table_conso AU-DESSUS de la table modélisée mais la Table Résultat est insérée dans un autre endroit du DOM par updateResultatTable().

De plus, après restauration via flowiseTableBridge.ts → injectTableIntoDOM(), la table restaurée remplace le contenu du conteneur (container.innerHTML = '') sans respecter l'ordre : Table_conso → Table Résultat → Modelised_table. L'ordre est donc perturbé.

Ordre attendu dans le DOM :


📊 Table de Consolidation (Table_conso)
📋 Table Résultat  
📑 Table Modélisée (Modelised_table)
Ordre actuel problématique :


📊 Table de Consolidation (Table_conso)
📑 Table Modélisée (Modelised_table)
📋 Table Résultat ← insérée EN DESSOUS de la table modélisée
🔴 Problème [Tâche Actualisée] 1.B — [Modelised_table] d'un ancien chat écrase le nouveau chat
Cause racine identifiée dans flowiseTableBridge.ts → restoreTablesForSession() et injectTableIntoDOM() :

La session n'est pas liée au chat actif : Le sessionId est généré une seule fois par page (stable_session_...). Quand on ouvre un nouveau chat, le sessionId dans sessionStorage est le même que l'ancien chat. Donc la restauration ramène les tables de l'ancien chat.

findTableByKeyword() est trop générique : Quand la restauration cherche "📊 Table de Consolidation", elle trouve la première table dans le DOM avec ce texte — que ce soit celle du nouveau chat ou de l'ancien. Les tables [Modelised_table] identiques (mêmes colonnes) sont confondues entre chats.

cleanupDuplicateOriginalTables() supprime la NOUVELLE table : Elle supprime les tables non marquées data-restored="true" qui ont les mêmes en-têtes que les tables restaurées. Or la nouvelle [Modelised_table] (générée par le nouveau chat) a les mêmes en-têtes → elle est supprimée au profit de la version restaurée (ancienne).

La sessionId de conso.js et celle de flowiseTableBridge.ts ne sont pas synchronisées avec l'ID de chat actif de ClaraVerse, créant ainsi une contamination inter-chats.

🟡 Problème [Problème] 3 — Actions "Insérer table" non persistantes
Cause : Quand menu.js insère une nouvelle table créée de zéro, elle n'a pas de data-container-id et n'est donc pas restaurée par injectTableIntoDOM() qui cherche un conteneur par containerId.

🟡 Problème [Problème] 5 — Double table après insertion de colonne
Cause : cleanupDuplicateOriginalTables() est censée supprimer la table originale quand la restaurée prend sa place, mais si l'en-tête a changé (nouvelle colonne), le match par signature échoue. Le match par keyword fonctionne mais ne couvre pas tous les cas de tables dynamiques créées par conso.js (qui n'ont pas d'attribut data-n8n-keyword).

Causes Racines — Résumé Prioritaire
Priorité	Problème	Fichier(s) concerné(s)
🔴 CRITIQUE	Session non liée au chat actif → contamination inter-chats	conso.js, auto-restore-chat-change.js, flowiseTableBridge.ts
🔴 CRITIQUE	Table Résultat positionnée sous Modelised_table	conso.js → updateResultatTable()
🟠 MAJEUR	cleanup supprime la nouvelle Modelised_table	flowiseTableBridge.ts → cleanupDuplicateOriginalTables()
🟡 MOYEN	Table Résultat restaurée n'est pas repositionnée correctement	flowiseTableBridge.ts → injectTableIntoDOM()
Solution Proposée
Principe
Lier le sessionId à l'ID de conversation ClaraVerse (pas une clé stable_session générique)
Protéger la [Modelised_table] du nouveau chat dans cleanupDuplicateOriginalTables()
Corriger le positionnement de la Table Résultat dans conso.js
Synchroniser le sessionId entre conso.js et le bridge TypeScript
Modifications Proposées
Composant 1 — 
auto-restore-chat-change.js
Problème : Le script détecte les changements de tables mais utilise un sessionId global stable qui ne change pas d'un chat à l'autre.

[MODIFY] auto-restore-chat-change.js
Modification : Détecter l'ID de conversation ClaraVerse depuis le DOM (l'URL, le titre du chat actif, ou un attribut sur le composant React) et réinitialiser le sessionId dans sessionStorage lors d'un changement de chat.

Écouter les changements d'URL (React Router) via window.addEventListener('popstate') et MutationObserver sur le titre ou l'ID de conversation dans le DOM
Quand l'ID de chat change, effacer sessionStorage.claraverse_stable_session et en générer un nouveau lié au chatId
Émettre claraverse:session:changed avec le nouveau sessionId
Composant 2 — 
flowiseTableBridge.ts
[MODIFY] Méthode cleanupDuplicateOriginalTables()
Problème : Elle supprime les [Modelised_table] du NOUVEAU chat parce que leurs en-têtes correspondent aux tables restaurées de l'ANCIEN chat.

Solution :

Avant de supprimer une table, vérifier si elle est fraîchement générée (pas de data-restored="true" ET pas de data-conso-session-id correspondant à la session actuelle)
Ne jamais supprimer une table qui est INSIDE un message nouvellement arrivé (détectable via data-message-id récent ou position dans le DOM relative au dernier message)
Ajouter une protection : si la table à supprimer n'a pas l'attribut data-restored="true" mais est dans un conteneur récemment ajouté (moins de 5 secondes), ne pas la supprimer
[MODIFY] Méthode injectTableIntoDOM()
Problème : La table Résultat (keyword = "📋 Table Résultat") est restaurée mais son positionnement relatif à Modelised_table n'est pas respecté.

Solution :

Ajouter la détection des tables claraverse-conso-table proches pour injecter la Table Résultat avant la [Modelised_table] (entre la Table_conso et la Modelised_table)
Composant 3 — 
conso.js
[MODIFY] Méthode updateResultatTable()
Problème : La table Résultat est insérée après la [Modelised_table] au lieu d'avant.

Solution :

Dans la méthode qui crée/insère la table Résultat, utiliser insertConsoTable() ou une logique similaire pour placer la table Résultat entre la Table_conso et la Modelised_table (juste au-dessus de la table modélisée)
Ordre à garantir : Table_conso → Table Résultat → Modelised_table
[MODIFY] Méthode saveConsolidationData() — Keyword sémantique stable
Solution : Utiliser des keywords sémantiques différenciés pour la Table Résultat par rapport à la Table_conso lors de la sauvegarde IndexedDB :

Table_conso → keyword : "📊 Table de Consolidation"
Table Résultat → keyword : "📋 Table Résultat"
Ces keywords sont déjà utilisés dans conso-indexeddb-bridge.js mais pas dans saveConsolidationData().

Composant 4 — 
conso-indexeddb-bridge.js
[MODIFY] Synchronisation du sessionId avec le chat actif
Solution :

Écouter l'événement claraverse:session:changed pour mettre à jour le stableSessionId interne
Ainsi, quand on change de chat, le bridge conso utilise automatiquement le nouveau sessionId et sauvegarde les tables dans la bonne session IndexedDB
Ordre de Chargement (inchangé — déjà correct dans index.html)
html

<!-- 1. Gestionnaire de verrouillage (en premier) -->
<script src="/restore-lock-manager.js"></script>
<!-- 2. Scripts de base -->
<script src="/Flowise.js"></script>
<!-- 3. Pont de persistance (AVANT menu.js et conso.js) -->
<script src="/menu-persistence-bridge.js"></script>
<!-- 4. Scripts utilisant la persistance -->
<script src="/menu.js"></script>
<script src="/conso.js"></script>
<script src="/conso-indexeddb-bridge.js"></script>
<!-- 5. Restauration automatique (en dernier) -->
<script type="module" src="/auto-restore-chat-change.js"></script>
Questions Ouvertes
IMPORTANT

Comment ClaraVerse identifie-t-il un "nouveau chat" vs un rechargement de la même page ? Pour lier le sessionId au chat actif, nous avons besoin d'un identifiant stable de conversation. Est-ce que :

L'URL change quand on change de conversation (ex: /chat/conversation-id-123) ?
Un attribut DOM (data-conversation-id, data-chat-id) est présent sur le composant de chat ?
Un événement React est émis quand on change de chat ?
Répondre à cette question déterminera la méthode de détection dans auto-restore-chat-change.js.

WARNING

Risque de régression sur les tables persistantes actuelles : La modification de cleanupDuplicateOriginalTables() doit être faite avec précaution pour ne pas casser les tables qui fonctionnent déjà (tables modifiées via menu.js).

Plan de Vérification
Tests Automatiques
Aucun test automatisé existant à modifier — vérification manuelle requise
Vérification Manuelle
Ouvrir un chat, générer une [Modelised_table] avec colonnes Assertion/Conclusion/Ctr
Vérifier que la Table Résultat apparaît au-dessus de la Modelised_table
Modifier des cellules → recharger → vérifier que les données persistent
Ouvrir un nouveau chat → vérifier que les tables du premier chat ne contaminent PAS le nouveau
Vérifier dans DevTools → IndexedDB → clara_db → clara_generated_tables que les tables sont bien liées à des sessionIds différents par chat