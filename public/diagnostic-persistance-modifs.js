// Diagnostic: Persistance des Modifications
// À charger dans index.html pour diagnostiquer le problème

console.log('🔍 [DIAGNOSTIC] Script chargé');

// Fonction 1: Vérifier les tables dans le DOM
window.checkDOMTables = function() {
  console.log('\n📊 === ANALYSE DOM ===');
  
  const tables = document.querySelectorAll('table[data-keyword]');
  console.log(`Total tables avec data-keyword: ${tables.length}`);
  
  const keywords = {};
  tables.forEach((table, index) => {
    const keyword = table.dataset.keyword;
    const tableId = table.dataset.tableId;
    const restored = table.dataset.restored;
    const skipRestore = table.dataset.skipRestore;
    
    if (!keywords[keyword]) keywords[keyword] = [];
    keywords[keyword].push({
      index,
      tableId,
      restored: restored === 'true',
      skipRestore: skipRestore === 'true',
      hasWrapper: !!table.closest('.restored-table-wrapper'),
      cellCount: table.querySelectorAll('td').length,
      firstCellValue: table.querySelector('td')?.textContent?.trim()
    });
  });
  
  console.log('\n📋 Tables par keyword:');
  Object.entries(keywords).forEach(([keyword, instances]) => {
    console.log(`\n  "${keyword}": ${instances.length} instance(s)`);
    instances.forEach((inst, i) => {
      console.log(`    [${i}] ID: ${inst.tableId || 'none'}`);
      console.log(`        Restored: ${inst.restored}, Wrapper: ${inst.hasWrapper}`);
      console.log(`        First cell: "${inst.firstCellValue}"`);
    });
  });
  
  // Détecter doublons
  const duplicates = Object.entries(keywords).filter(([k, v]) => v.length > 1);
  if (duplicates.length > 0) {
    console.warn('\n⚠️ DOUBLONS DÉTECTÉS:');
    duplicates.forEach(([keyword, instances]) => {
      console.warn(`  "${keyword}": ${instances.length} instances`);
    });
  } else {
    console.log('\n✅ Aucun doublon détecté');
  }
  
  return keywords;
};

// Fonction 2: Vérifier IndexedDB
window.checkIndexedDBTables = async function() {
  console.log('\n💾 === ANALYSE INDEXEDDB ===');
  
  try {
    const dbName = 'clara_db';
    const request = indexedDB.open(dbName);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['clara_generated_tables'], 'readonly');
        const store = transaction.objectStore('clara_generated_tables');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const tables = getAllRequest.result;
          console.log(`Total tables en DB: ${tables.length}`);
          
          // Grouper par session
          const bySessions = {};
          tables.forEach(table => {
            if (!bySessions[table.sessionId]) bySessions[table.sessionId] = [];
            bySessions[table.sessionId].push(table);
          });
          
          console.log(`\n📁 Tables par session:`);
          Object.entries(bySessions).forEach(([sessionId, sessionTables]) => {
            const shortId = sessionId.substring(0, 20) + '...';
            console.log(`\n  Session ${shortId}: ${sessionTables.length} table(s)`);
            sessionTables.forEach(table => {
              const date = new Date(table.createdAt).toLocaleString('fr-FR');
              const updated = table.updatedAt ? 
                ` (modif: ${new Date(table.updatedAt).toLocaleString('fr-FR')})` : '';
              console.log(`    - "${table.keyword}" (ID: ${table.id.substring(0, 8)}...)`);
              console.log(`      Créée: ${date}${updated}`);
              
              // Extraire première cellule du HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = table.html;
              const firstCell = tempDiv.querySelector('td')?.textContent?.trim();
              if (firstCell) {
                console.log(`      Première cellule DB: "${firstCell}"`);
              }
            });
          });
          
          resolve(tables);
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  } catch (error) {
    console.error('Erreur IndexedDB:', error);
    return [];
  }
};

// Fonction 3: Comparer DOM vs IndexedDB
window.compareDOMvsDB = async function() {
  console.log('\n🔀 === COMPARAISON DOM vs INDEXEDDB ===');
  
  const domTables = window.checkDOMTables();
  const dbTables = await window.checkIndexedDBTables();
  
  const sessionId = document.querySelector('[data-session-id]')?.getAttribute('data-session-id');
  if (!sessionId) {
    console.warn('⚠️ Aucun sessionId trouvé dans le DOM');
    return;
  }
  
  const sessionTables = dbTables.filter(t => t.sessionId === sessionId);
  
  console.log(`\n📊 Session actuelle: ${sessionId.substring(0, 20)}...`);
  console.log(`   DOM: ${Object.keys(domTables).length} keyword(s)`);
  console.log(`   DB:  ${sessionTables.length} table(s)`);
  
  // Comparer chaque keyword
  Object.entries(domTables).forEach(([keyword, domInstances]) => {
    const dbTable = sessionTables.find(t => t.keyword === keyword);
    
    console.log(`\n  Keyword: "${keyword}"`);
    console.log(`    DOM: ${domInstances.length} instance(s)`);
    console.log(`    DB:  ${dbTable ? '1 enregistrement' : 'AUCUN'}`);
    
    if (dbTable && domInstances.length > 0) {
      // Comparer première cellule
      const domFirstCell = domInstances[0].firstCellValue;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = dbTable.html;
      const dbFirstCell = tempDiv.querySelector('td')?.textContent?.trim();
      
      console.log(`    Première cellule:`);
      console.log(`      DOM: "${domFirstCell}"`);
      console.log(`      DB:  "${dbFirstCell}"`);
      
      if (domFirstCell !== dbFirstCell) {
        console.warn(`    ⚠️ DIFFÉRENCE DÉTECTÉE! Modifications non persistées?`);
      } else {
        console.log(`    ✅ Identiques`);
      }
    }
  });
};

// Fonction 4: Intercepter les modifications
let modificationsLog = [];

window.trackModifications = function() {
  console.log('\n🎯 === TRACKING DES MODIFICATIONS ===');
  console.log('Écoute des événements de modification...\n');
  
  // Intercepter les événements blur sur cellules
  document.addEventListener('blur', (e) => {
    const cell = e.target;
    if (cell.tagName === 'TD' && cell.hasAttribute('contenteditable')) {
      const table = cell.closest('table');
      const keyword = table?.dataset?.keyword;
      
      const log = {
        timestamp: new Date().toISOString(),
        keyword,
        cellContent: cell.textContent,
        tableId: table?.dataset?.tableId,
        event: 'cell-blur'
      };
      
      modificationsLog.push(log);
      console.log(`📝 [MODIF] Cell edited in "${keyword}": "${cell.textContent}"`);
    }
  }, true);
  
  // Intercepter événements de sauvegarde
  document.addEventListener('flowise:table:save:request', (e) => {
    console.log(`💾 [EVENT] flowise:table:save:request`, e.detail);
  });
  
  document.addEventListener('claraverse:table:updated', (e) => {
    console.log(`🔄 [EVENT] claraverse:table:updated`, e.detail);
  });
  
  window.addEventListener('flowise-table-save-request', (e) => {
    console.log(`💾 [EVENT] flowise-table-save-request`, e.detail);
  });
};

// Fonction 5: Voir le log des modifications
window.showModificationsLog = function() {
  console.log('\n📋 === LOG DES MODIFICATIONS ===');
  if (modificationsLog.length === 0) {
    console.log('Aucune modification enregistrée');
  } else {
    modificationsLog.forEach((log, i) => {
      console.log(`[${i}] ${log.timestamp}`);
      console.log(`    Keyword: ${log.keyword}`);
      console.log(`    Content: "${log.cellContent}"`);
    });
  }
  return modificationsLog;
};

// Fonction 6: Diagnostic complet
window.runFullDiagnostic = async function() {
  console.clear();
  console.log('🔍 ============================================');
  console.log('🔍 DIAGNOSTIC COMPLET - PERSISTANCE MODIFS');
  console.log('🔍 ============================================\n');
  
  window.checkDOMTables();
  await window.checkIndexedDBTables();
  await window.compareDOMvsDB();
  
  console.log('\n✅ Diagnostic terminé');
  console.log('\n📝 Commandes disponibles:');
  console.log('  checkDOMTables()        - Analyser tables dans DOM');
  console.log('  checkIndexedDBTables()  - Analyser tables dans IndexedDB');
  console.log('  compareDOMvsDB()        - Comparer DOM et DB');
  console.log('  trackModifications()    - Tracker les modifs en temps réel');
  console.log('  showModificationsLog()  - Voir le log des modifs');
  console.log('  runFullDiagnostic()     - Relancer diagnostic complet');
};

// Auto-démarrer le tracking
window.trackModifications();

console.log('✅ [DIAGNOSTIC] Prêt! Tapez runFullDiagnostic() pour commencer');
