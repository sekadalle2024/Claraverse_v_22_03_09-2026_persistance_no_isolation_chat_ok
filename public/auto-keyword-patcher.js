/**
 * 🏷️ AUTO KEYWORD PATCHER
 * Assigne automatiquement des keywords aux tables qui n'en ont pas
 * Utilise la même logique que extractKeyword() de index.html
 */

(function() {
  'use strict';
  
  console.log("🏷️ [Auto Keyword Patcher] Initialisation...");
  
  // ==========================================
  // FONCTION D'EXTRACTION DE KEYWORD
  // ==========================================
  
  function extractSmartKeyword(table) {
    // 1. Si data-keyword existe déjà, le garder
    if (table.dataset && table.dataset.keyword) {
      return table.dataset.keyword;
    }
    
    // 2. Chercher dans le wrapper parent
    const wrapper = table.closest('[data-n8n-keyword]');
    if (wrapper && wrapper.dataset.n8nKeyword) {
      return wrapper.dataset.n8nKeyword;
    }
    
    // 3. Analyser le premier header (th)
    const firstHeader = table.querySelector('th');
    if (firstHeader && firstHeader.textContent.trim()) {
      const text = firstHeader.textContent.trim();
      
      // Cas spéciaux reconnus
      if (text.toLowerCase().includes('consolidation') || text.includes('📊')) {
        return 'Table_Consolidation';
      }
      if (text.toLowerCase().includes('resultat') || text.toLowerCase().includes('résultat')) {
        return 'Table_Resultat';
      }
      
      // ❌ ÉVITER keywords trop courts/génériques (causent doublons)
      if (text.length < 3 || ['no', 'n°', 'id', '#'].includes(text.toLowerCase())) {
        // Skip ce header, essayer le suivant
        const secondHeader = table.querySelectorAll('th')[1];
        if (secondHeader && secondHeader.textContent.trim().length >= 3) {
          return sanitizeKeyword(secondHeader.textContent.trim().substring(0, 50));
        }
        // Sinon passer à la stratégie suivante
      } else {
        // Utiliser le premier header comme keyword (max 50 chars)
        return sanitizeKeyword(text.substring(0, 50));
      }
    }
    
    // 4. Vérifier les classes CSS
    if (table.classList.contains('claraverse-conso-table')) {
      return 'Table_Consolidation';
    }
    if (table.classList.contains('claraverse-resultat-table')) {
      return 'Table_Resultat';
    }
    
    // 5. Analyser tous les headers pour détecter le type
    const headers = Array.from(table.querySelectorAll('th'))
      .map(th => th.textContent.trim().toLowerCase());
    
    const headerText = headers.join(' ');
    
    if (headerText.includes('conclusion') || headerText.includes('assertion')) {
      return 'Table_Consolidation';
    }
    if (headerText.includes('resultat') || headerText.includes('résultat')) {
      return 'Table_Resultat';
    }
    
    // 6. Extraire le contexte du message (chercher un titre au-dessus)
    const messageContext = findMessageContext(table);
    if (messageContext && messageContext.length >= 5) {
      return sanitizeKeyword(messageContext);
    }
    
    // 7. Fallback: combiner plusieurs headers pour keyword unique
    if (headers.length >= 2) {
      // Prendre les 2-3 premiers headers significatifs
      const significantHeaders = headers
        .filter(h => h.length >= 3 && !['no', 'n°', 'id', '#'].includes(h.toLowerCase()))
        .slice(0, 3)
        .join('_');
      
      if (significantHeaders.length >= 5) {
        return sanitizeKeyword(significantHeaders.substring(0, 50));
      }
    }
    
    // 8. Première cellule de contenu (td)
    const firstCellText = table.querySelector('td')?.textContent.trim();
    if (firstCellText && firstCellText.length >= 5) {
      return sanitizeKeyword(firstCellText.substring(0, 30));
    }
    
    // 9. Dernier recours: hash basé sur contenu + timestamp pour unicité
    const tableContent = table.textContent.trim().substring(0, 100);
    const hash = simpleHash(tableContent);
    return `Table_${hash}_${Date.now()}`;
  }
  
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
  
  function sanitizeKeyword(text) {
    // Nettoyer le texte pour faire un keyword valide
    return text
      .replace(/[^\w\s-]/g, '') // Enlever caractères spéciaux
      .replace(/\s+/g, '_')      // Remplacer espaces par _
      .replace(/_+/g, '_')       // Éviter ___
      .replace(/^_|_$/g, '');    // Enlever _ au début/fin
  }
  
  function findMessageContext(table) {
    // Chercher un titre (h1-h6) ou un texte fort (strong) au-dessus de la table
    let current = table.previousElementSibling;
    let attempts = 0;
    
    while (current && attempts < 5) {
      if (current.matches('h1, h2, h3, h4, h5, h6')) {
        return current.textContent.trim();
      }
      if (current.matches('strong, b')) {
        return current.textContent.trim();
      }
      if (current.matches('p') && current.textContent.length < 100) {
        // Petit paragraphe avant la table, potentiellement un titre
        const text = current.textContent.trim();
        if (text && !text.includes('.') && text.length > 5) {
          return text;
        }
      }
      
      current = current.previousElementSibling;
      attempts++;
    }
    
    return null;
  }
  
  // ==========================================
  // PATCHER LES TABLES
  // ==========================================
  
  function patchAllTables() {
    const tables = document.querySelectorAll('table');
    let patchedCount = 0;
    let alreadyHadKeyword = 0;
    
    tables.forEach(table => {
      if (table.dataset.keyword) {
        alreadyHadKeyword++;
        return; // Déjà un keyword, skip
      }
      
      const keyword = extractSmartKeyword(table);
      table.dataset.keyword = keyword;
      patchedCount++;
      
      console.log(`✏️ [Patcher] Keyword assigné: "${keyword}"`, table);
    });
    
    if (patchedCount > 0) {
      console.log(`✅ [Patcher] ${patchedCount} table(s) patchée(s)`);
    }
    if (alreadyHadKeyword > 0) {
      console.log(`ℹ️ [Patcher] ${alreadyHadKeyword} table(s) avaient déjà un keyword`);
    }
    
    return { patchedCount, alreadyHadKeyword, total: tables.length };
  }
  
  // ==========================================
  // OBSERVER LES NOUVELLES TABLES
  // ==========================================
  
  function observeNewTables() {
    const observer = new MutationObserver((mutations) => {
      let foundNewTables = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element
            // Vérifier si c'est une table
            if (node.tagName === 'TABLE' && !node.dataset.keyword) {
              const keyword = extractSmartKeyword(node);
              node.dataset.keyword = keyword;
              console.log(`✏️ [Patcher Observer] Nouvelle table détectée, keyword: "${keyword}"`);
              foundNewTables = true;
            }
            
            // Vérifier les tables dans les enfants
            const childTables = node.querySelectorAll('table');
            childTables.forEach(table => {
              if (!table.dataset.keyword) {
                const keyword = extractSmartKeyword(table);
                table.dataset.keyword = keyword;
                console.log(`✏️ [Patcher Observer] Table enfant détectée, keyword: "${keyword}"`);
                foundNewTables = true;
              }
            });
          }
        });
      });
      
      if (foundNewTables) {
        console.log("🔄 [Patcher] Nouvelles tables ajoutées au DOM");
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log("👁️ [Patcher] Observer installé pour détecter nouvelles tables");
  }
  
  // ==========================================
  // DÉMARRAGE
  // ==========================================
  
  function init() {
    console.log("🚀 [Patcher] Démarrage...");
    
    // Patcher les tables existantes après un petit délai
    setTimeout(() => {
      const stats = patchAllTables();
      console.log(`📊 [Patcher] Stats: ${stats.patchedCount} patchées, ${stats.alreadyHadKeyword} déjà OK, ${stats.total} total`);
      
      // Installer l'observer pour les futures tables
      observeNewTables();
    }, 1000); // 1 seconde après le chargement
    
    // Re-patcher toutes les 10 secondes (sécurité)
    setInterval(() => {
      const stats = patchAllTables();
      if (stats.patchedCount > 0) {
        console.log(`🔄 [Patcher Periodic] ${stats.patchedCount} nouvelle(s) table(s) patchée(s)`);
      }
    }, 10000);
  }
  
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Exposer globalement pour tests
  window.autoKeywordPatcher = {
    patchAllTables,
    extractSmartKeyword,
    version: '1.0'
  };
  
  console.log("💡 [Patcher] Commande test: autoKeywordPatcher.patchAllTables()");
  
})();
