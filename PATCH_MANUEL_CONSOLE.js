/**
 * PATCH MANUEL - À copier-coller dans console F12
 * Si le script test-keyword-patcher-simple.js ne fonctionne pas
 */

(function patchManuel() {
  console.log('🔧 [PATCH MANUEL] Démarrage...');
  
  const tables = document.querySelectorAll('table');
  console.log(`🔧 [PATCH MANUEL] ${tables.length} table(s) trouvée(s)`);
  
  let count = 0;
  
  tables.forEach((table, index) => {
    // Si déjà un keyword valide, skip
    if (table.dataset.keyword && table.dataset.keyword !== 'unknown') {
      console.log(`⏭️ Table ${index + 1} a déjà: ${table.dataset.keyword}`);
      return;
    }
    
    // Extraire keyword du premier header
    const firstTh = table.querySelector('th');
    let keyword = 'unknown';
    
    if (firstTh && firstTh.textContent.trim()) {
      keyword = firstTh.textContent.trim()
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
    console.log(`✅ Table ${index + 1} → "${keyword}"`);
    
    // Émettre événement sauvegarde
    setTimeout(() => {
      const event = new CustomEvent('flowise:table:save:request', {
        bubbles: true,
        detail: {
          table: table,
          keyword: keyword,
          sessionId: window.currentSessionId || localStorage.getItem('currentSessionId'),
          source: 'manual_patch',
          timestamp: Date.now()
        }
      });
      
      document.dispatchEvent(event);
      console.log(`💾 Événement émis: "${keyword}"`);
    }, 300 * (index + 1));
    
    count++;
  });
  
  console.log(`✅ [PATCH MANUEL] ${count} table(s) patchée(s)`);
  
  // Attendre 5 secondes et vérifier IndexedDB
  setTimeout(() => {
    console.log('🔍 Vérification IndexedDB dans 5s...');
  }, 5000);
  
})();
