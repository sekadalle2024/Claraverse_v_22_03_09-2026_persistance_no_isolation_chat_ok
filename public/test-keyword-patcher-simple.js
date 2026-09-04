/**
 * TEST SIMPLE - Vérifier si le patcher fonctionne
 */

(function() {
  'use strict';
  
  console.log('🧪 [TEST PATCHER] Script chargé');
  
  function testPatcher() {
    console.log('🧪 [TEST PATCHER] Démarrage test...');
    
    const tables = document.querySelectorAll('table');
    console.log(`🧪 [TEST PATCHER] Trouvé ${tables.length} table(s)`);
    
    let patchedCount = 0;
    
    tables.forEach((table, index) => {
      // Si déjà un keyword, skip
      if (table.dataset.keyword && table.dataset.keyword !== 'unknown') {
        console.log(`🧪 [TEST PATCHER] Table ${index + 1} a déjà keyword: ${table.dataset.keyword}`);
        return;
      }
      
      // Extraire premier header
      const firstHeader = table.querySelector('th');
      let keyword = 'unknown';
      
      if (firstHeader && firstHeader.textContent.trim()) {
        const headerText = firstHeader.textContent.trim();
        keyword = headerText
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 30);
        
        if (keyword.length < 3) {
          keyword = `Table_${index + 1}_${Date.now()}`;
        }
      } else {
        keyword = `Table_${index + 1}_${Date.now()}`;
      }
      
      // Assigner keyword
      table.dataset.keyword = keyword;
      console.log(`🧪 [TEST PATCHER] Table ${index + 1} → keyword: "${keyword}"`);
      
      // Émettre événement
      setTimeout(() => {
        try {
          const event = new CustomEvent('flowise:table:save:request', {
            bubbles: true,
            detail: {
              table: table,
              keyword: keyword,
              sessionId: window.currentSessionId || localStorage.getItem('currentSessionId'),
              source: 'test_patcher',
              timestamp: Date.now()
            }
          });
          
          document.dispatchEvent(event);
          console.log(`💾 [TEST PATCHER] Événement émis pour: "${keyword}"`);
        } catch (error) {
          console.error(`❌ [TEST PATCHER] Erreur événement:`, error);
        }
      }, 200 * (index + 1)); // Échelonner les événements
      
      patchedCount++;
    });
    
    console.log(`✅ [TEST PATCHER] Terminé: ${patchedCount} table(s) patchée(s)`);
    return { total: tables.length, patched: patchedCount };
  }
  
  // Exposer globalement
  window.testKeywordPatcher = testPatcher;
  
  // Auto-démarrage après 2 secondes
  setTimeout(() => {
    console.log('🧪 [TEST PATCHER] Auto-démarrage...');
    testPatcher();
  }, 2000);
  
  console.log('💡 [TEST PATCHER] Commande manuelle: testKeywordPatcher()');
  
})();
