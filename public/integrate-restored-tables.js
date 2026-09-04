/**
 * 🔄 INTÉGRATION TABLES RESTAURÉES DANS CHAT
 * Résout [Problème 2] : Les tables restaurées remplacent les tables initiales
 * 
 * Date : 4 Septembre 2026
 * Contexte : Les tables restaurées après F5 s'ajoutent aux tables initiales au lieu de les remplacer
 * 
 * STRATÉGIE D'INTÉGRATION :
 * 1. Identifier tables restaurées (data-restored="true")
 * 2. Identifier tables initiales dans chat (dans .markdown-body ou .chat-messages)
 * 3. Matcher par keyword (data-keyword) ou par position (benchmarking)
 * 4. Remplacer innerHTML des tables initiales par outerHTML des tables restaurées
 * 5. Supprimer doublons restaurés pour éviter affichage double
 */

(function() {
  'use strict';
  
  console.log('🔄 [INTEGRATION] Module chargé v1.0');
  
  // ==========================================
  // SÉLECTEURS CSS (basés sur captures écran + analyse DOM)
  // ==========================================
  
  const SELECTORS = {
    // Conteneurs principaux du chat
    chatContainers: [
      '.markdown-body',
      '.chat-messages', 
      '.message-content',
      '[class*="message"]',
      '[class*="chat"]'
    ],
    
    // Tables initiales (avant F5) - Sélecteur générique puis filtrage
    tablesInitialesSelectors: [
      'table'  // TOUTES les tables, puis filtre dans collectTables()
    ],
    
    // Tables restaurées (après F5) - injectées par flowiseTableBridge
    tablesRestaureesSelectors: [
      'table[data-restored="true"]',
      '.restored-table-wrapper table',
      '[data-table-id] table'
    ],
    
    // Wrappers à nettoyer après intégration
    wrappersRestaurees: [
      '.restored-table-wrapper',
      '[data-restored="true"]'
    ]
  };
  
  // ==========================================
  // UTILITAIRES
  // ==========================================
  
  function findChatContainer() {
    for (const selector of SELECTORS.chatContainers) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`📍 [INTEGRATION] Conteneur chat trouvé: ${selector}`);
        return container;
      }
    }
    console.warn('⚠️ [INTEGRATION] Aucun conteneur chat trouvé, utilisation body');
    return document.body;
  }
  
  function collectTables(selectors, filterRestored = false) {
    const tables = new Set();
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(table => {
        if (table.tagName === 'TABLE') {
          if (filterRestored) {
            // Exclure tables restaurées si on cherche tables initiales
            const isRestored = table.hasAttribute('data-restored') || 
                             table.closest('.restored-table-wrapper') ||
                             table.classList.contains('restored-table');
            
            if (!isRestored) {
              console.log(`   🔍 [COLLECT] Table candidate trouvée:`, {
                keyword: table.getAttribute('data-keyword'),
                classes: table.className,
                hasDataRestored: table.hasAttribute('data-restored'),
                inWrapper: !!table.closest('.restored-table-wrapper')
              });
              tables.add(table);
            }
          } else {
            tables.add(table);
          }
        }
      });
    });
    
    return Array.from(tables);
  }
  
  function getTableIdentifier(table) {
    // Priorité 1 : data-keyword (mais ignorer keywords temporaires ET UUIDs)
    const keyword = table.getAttribute('data-keyword');
    if (keyword && keyword !== 'unknown') {
      // Vérifier si c'est un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(keyword);
      
      // Vérifier si c'est un keyword temporaire (contient timestamp)
      const isTemporary = keyword.match(/Table_\d+_\d{13}$/);  // Format: Table_X_timestamp
      
      // Si c'est un keyword "stable" (ni UUID ni temporaire), l'utiliser
      if (!isUUID && !isTemporary) {
        return { type: 'keyword', value: keyword };
      }
      // Si UUID ou temporaire, passer à la méthode suivante mais garder info
      if (isUUID) {
        console.log(`   ℹ️ UUID détecté (${keyword.substring(0, 8)}...), recherche par header/position`);
      }
    }
    
    // Priorité 2 : data-table-id (sauf si UUID)
    const tableId = table.getAttribute('data-table-id');
    if (tableId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);
      if (!isUUID) {
        return { type: 'tableId', value: tableId };
      }
    }
    
    // Priorité 3 : Premier header (th) - MÉTHODE PRÉFÉRÉE pour UUIDs
    const firstTh = table.querySelector('th');
    if (firstTh && firstTh.textContent.trim()) {
      const headerText = firstTh.textContent.trim();
      // Ignorer headers trop courts/génériques
      if (headerText.length >= 3 && !['No', 'N°', 'ID', '#'].includes(headerText)) {
        return { type: 'header', value: headerText.substring(0, 50) };
      }
    }
    
    // Priorité 4 : Compter nombre de colonnes et lignes (signature structurelle)
    const rows = table.querySelectorAll('tr').length;
    const cols = table.querySelector('tr')?.querySelectorAll('th, td').length || 0;
    
    // Priorité 5 : Position dans DOM (améliorée)
    const allTables = Array.from(document.querySelectorAll('table'));
    const position = allTables.indexOf(table);
    
    // Pour keywords temporaires, utiliser position ET pattern keyword
    if (keyword && keyword.match(/Table_\d+_\d{13}$/)) {
      const tableNumber = keyword.match(/Table_(\d+)_/)?.[1];
      return { 
        type: 'position_temp', 
        value: position,
        tempKeywordPattern: tableNumber ? `Table_${tableNumber}_` : null,
        structure: { rows, cols }
      };
    }
    
    return { 
      type: 'position', 
      value: position,
      structure: { rows, cols },
      originalKeyword: keyword  // Garder trace UUID pour logs
    };
  }
  
  // ==========================================
  // FONCTION PRINCIPALE D'INTÉGRATION
  // ==========================================
  
  function integrerTablesRestaurees() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 [INTEGRATION] DÉMARRAGE INTÉGRATION TABLES');
    console.log('═══════════════════════════════════════════════════');
    
    // 1. Collecter tables restaurées
    const tablesRestaurees = collectTables(SELECTORS.tablesRestaureesSelectors);
    console.log(`📊 [INTEGRATION] ${tablesRestaurees.length} table(s) restaurée(s) trouvée(s)`);
    
    if (tablesRestaurees.length === 0) {
      console.warn('⚠️ [INTEGRATION] Aucune table restaurée trouvée');
      console.log('ℹ️ [INTEGRATION] Vérifier si restauration s\'est exécutée (logs flowiseTableBridge)');
      return { integrated: 0, skipped: 0, errors: 0, message: 'Aucune table restaurée' };
    }
    
    // 2. Collecter tables initiales
    const tablesInitiales = collectTables(SELECTORS.tablesInitialesSelectors, true);
    console.log(`📊 [INTEGRATION] ${tablesInitiales.length} table(s) initiale(s) trouvée(s)`);
    
    // Debug: afficher structure des tables initiales
    console.log(`🔍 [DEBUG] Structure tables initiales:`);
    tablesInitiales.forEach((t, i) => {
      const rows = t.querySelectorAll('tr').length;
      const cols = t.querySelector('tr')?.querySelectorAll('th, td').length || 0;
      const keyword = t.getAttribute('data-keyword') || 'none';
      const header = t.querySelector('th')?.textContent.trim().substring(0, 20) || 'none';
      console.log(`   ${i + 1}. ${rows}x${cols} | keyword: ${keyword} | header: "${header}"`);
    });
    
    if (tablesInitiales.length === 0) {
      console.warn('⚠️ [INTEGRATION] Aucune table initiale trouvée dans chat');
      console.log('ℹ️ [INTEGRATION] Les tables restaurées sont peut-être déjà les seules présentes');
      return { integrated: 0, skipped: tablesRestaurees.length, errors: 0, message: 'Aucune table initiale' };
    }
    
    let integrated = 0;
    let skipped = 0;
    let errors = 0;
    const integrationDetails = [];  // Nouveau: tracker détails pour popup
    
    // 3. Matcher et intégrer chaque table restaurée
    tablesRestaurees.forEach((tableRestauree, index) => {
      try {
        const identRestauree = getTableIdentifier(tableRestauree);
        console.log(`\n🔍 [INTEGRATION] Table restaurée ${index + 1}/${tablesRestaurees.length}`);
        console.log(`   Identifiant: ${identRestauree.type} = "${identRestauree.value}"`);
        
        // Trouver table initiale correspondante
        let tableInitiale = null;
        let matchMethod = null;
        
        // Tentative 1 : Match par keyword
        if (identRestauree.type === 'keyword') {
          tableInitiale = tablesInitiales.find(t => 
            t.getAttribute('data-keyword') === identRestauree.value
          );
          if (tableInitiale) matchMethod = 'keyword';
        }
        
        // Tentative 2 : Match par tableId
        if (!tableInitiale && identRestauree.type === 'tableId') {
          tableInitiale = tablesInitiales.find(t => 
            t.getAttribute('data-table-id') === identRestauree.value
          );
          if (tableInitiale) matchMethod = 'tableId';
        }
        
        // Tentative 3 : Match par header
        if (!tableInitiale && identRestauree.type === 'header') {
          tableInitiale = tablesInitiales.find(t => {
            const th = t.querySelector('th');
            return th && th.textContent.trim().substring(0, 50) === identRestauree.value;
          });
          if (tableInitiale) matchMethod = 'header';
        }
        
        // Tentative 4 : Match par structure (rows x cols) puis position
        if (!tableInitiale && identRestauree.structure) {
          // Chercher table avec structure similaire
          const candidatesWithSameStructure = tablesInitiales.filter(t => {
            const rows = t.querySelectorAll('tr').length;
            const cols = t.querySelector('tr')?.querySelectorAll('th, td').length || 0;
            return rows === identRestauree.structure.rows && cols === identRestauree.structure.cols;
          });
          
          if (candidatesWithSameStructure.length === 1) {
            // Une seule table avec cette structure unique → match certain
            tableInitiale = candidatesWithSameStructure[0];
            matchMethod = 'structure_unique';
            console.log(`   🎯 Match par structure unique: ${identRestauree.structure.rows}x${identRestauree.structure.cols}`);
          } else if (candidatesWithSameStructure.length > 1) {
            // Plusieurs tables similaires → utiliser position relative
            const restoredIndex = tablesRestaurees.indexOf(tableRestauree);
            if (restoredIndex < candidatesWithSameStructure.length) {
              tableInitiale = candidatesWithSameStructure[restoredIndex];
              matchMethod = 'structure_position';
              console.log(`   🎯 Match par structure + position: ${restoredIndex + 1}/${candidatesWithSameStructure.length}`);
            }
          }
        }
        
        // Tentative 5 : Match par position (amélioré pour keywords temporaires)
        if (!tableInitiale && (identRestauree.type === 'position' || identRestauree.type === 'position_temp')) {
          // Pour keywords temporaires, chercher table avec même pattern
          if (identRestauree.type === 'position_temp' && identRestauree.tempKeywordPattern) {
            tableInitiale = tablesInitiales.find(t => {
              const kw = t.getAttribute('data-keyword') || '';
              return kw.startsWith(identRestauree.tempKeywordPattern);
            });
            if (tableInitiale) matchMethod = 'position_temp_pattern';
          }
          
          // Sinon, match par position DOM pure
          if (!tableInitiale && identRestauree.value < tablesInitiales.length) {
            tableInitiale = tablesInitiales[identRestauree.value];
            matchMethod = 'position';
          }
        }
        
        if (!tableInitiale) {
          const keywordDisplay = identRestauree.originalKeyword 
            ? `${identRestauree.originalKeyword.substring(0, 8)}...` 
            : (identRestauree.value || 'unknown');
          console.log(`   ⏭️ Pas de match trouvé pour ${keywordDisplay}, skip (peut-être nouvelle table)`);
          integrationDetails.push({
            keyword: keywordDisplay,
            method: 'none',
            result: 'SKIPPED'
          });
          skipped++;
          return;
        }
        
        console.log(`   ✅ Match trouvé via ${matchMethod}`);
        
        // 4. REMPLACEMENT COMPLET
        console.log(`   🔄 Remplacement en cours...`);
        
        // Préserver parent et position
        const parent = tableInitiale.parentElement;
        const nextSibling = tableInitiale.nextSibling;
        
        // Cloner table restaurée
        const clonedRestored = tableRestauree.cloneNode(true);
        
        // Nettoyer attributs "restored"
        clonedRestored.removeAttribute('data-restored');
        clonedRestored.classList.remove('restored-table');
        
        // Préserver certains attributs de la table initiale si pertinents
        const preserveAttrs = ['data-keyword', 'data-table-id', 'class'];
        preserveAttrs.forEach(attr => {
          const initialValue = tableInitiale.getAttribute(attr);
          if (initialValue && !clonedRestored.getAttribute(attr)) {
            clonedRestored.setAttribute(attr, initialValue);
          }
        });
        
        // Remplacer dans le DOM
        if (nextSibling) {
          parent.insertBefore(clonedRestored, nextSibling);
        } else {
          parent.appendChild(clonedRestored);
        }
        parent.removeChild(tableInitiale);
        
        console.log(`   ✅ Table ${identRestauree.originalKeyword ? identRestauree.originalKeyword.substring(0, 8) + '...' : identRestauree.value} intégrée avec succès`);
        integrationDetails.push({
          keyword: identRestauree.originalKeyword 
            ? identRestauree.originalKeyword.substring(0, 8) + '...'
            : (identRestauree.value || 'unknown'),
          method: matchMethod,
          result: 'INTEGRATED'
        });
        integrated++;
        
      } catch (error) {
        console.error(`   ❌ Erreur intégration table ${index + 1}:`, error);
        integrationDetails.push({
          keyword: 'error',
          method: 'error',
          result: 'ERROR: ' + error.message
        });
        errors++;
      }
    });
    
    // 5. Nettoyer wrappers de tables restaurées
    console.log(`\n🧹 [INTEGRATION] Nettoyage wrappers restaurés...`);
    let cleanedWrappers = 0;
    
    SELECTORS.wrappersRestaurees.forEach(selector => {
      document.querySelectorAll(selector).forEach(wrapper => {
        // Vérifier que ce n'est pas une table intégrée
        if (wrapper.hasAttribute('data-restored') || 
            wrapper.classList.contains('restored-table-wrapper')) {
          wrapper.remove();
          cleanedWrappers++;
        }
      });
    });
    
    console.log(`   🗑️ ${cleanedWrappers} wrapper(s) nettoyé(s)`);
    
    // 6. Résumé final
    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`✅ [INTEGRATION] TERMINÉ`);
    console.log(`   ✅ Intégrées : ${integrated}`);
    console.log(`   ⏭️ Skippées  : ${skipped}`);
    console.log(`   ❌ Erreurs   : ${errors}`);
    console.log(`═══════════════════════════════════════════════════`);
    
    return { 
      integrated, 
      skipped, 
      errors, 
      details: integrationDetails,  // Nouveau: détails pour popup
      message: `${integrated} table(s) intégrée(s)` 
    };
  }
  
  // ==========================================
  // DÉMARRAGE AUTOMATIQUE + EXPOSITION GLOBALE
  // ==========================================
  
  // Observer pour détecter quand restauration est terminée
  function waitForRestoration(callback, maxWait = 10000) {
    console.log('⏳ [INTEGRATION] Attente restauration tables...');
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const restoredTables = collectTables(SELECTORS.tablesRestaureesSelectors);
      
      if (restoredTables.length > 0) {
        console.log('✅ [INTEGRATION] Tables restaurées détectées, lancement intégration');
        clearInterval(checkInterval);
        callback();
      } else if (Date.now() - startTime > maxWait) {
        console.warn('⚠️ [INTEGRATION] Timeout attente restauration');
        clearInterval(checkInterval);
        callback();
      }
    }, 500); // Vérifier toutes les 500ms
  }
  
  // Auto-démarrage après détection restauration
  setTimeout(() => {
    waitForRestoration(() => {
      setTimeout(() => {
        console.log('🚀 [INTEGRATION] Auto-démarrage...');
        const result = integrerTablesRestaurees();
        
        if (result.integrated > 0) {
          console.log(`🎉 [INTEGRATION] ${result.integrated} table(s) intégrée(s) avec succès`);
        }
      }, 1000); // Délai additionnel pour laisser le DOM se stabiliser
    });
  }, 2000); // Délai initial 2s
  
  // Exposer fonction globalement pour bouton manuel
  window.integrerTablesRestaurees = integrerTablesRestaurees;
  
  console.log('💡 [INTEGRATION] Commande manuelle: integrerTablesRestaurees()');
  console.log('💡 [INTEGRATION] Ou cliquer bouton "🔄 Intégrer Tables"');
  
})();
