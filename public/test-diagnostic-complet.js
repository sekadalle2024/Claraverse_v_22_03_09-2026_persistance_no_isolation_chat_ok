/**
 * 🔍 DIAGNOSTIC COMPLET : Flux de Persistance de A à Z
 */

(function() {
  'use strict';
  
  console.log("🔍 Diagnostic Complet chargé");
  
  window.diagnosticCompletPersistance = async function() {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 DIAGNOSTIC COMPLET - FLUX PERSISTANCE");
    console.log("=".repeat(80) + "\n");
    
    const results = [];
    
    // 1. Vérifier SessionId
    console.log("1️⃣ Vérification SessionId...");
    const sessionElement = document.querySelector('[data-session-id]');
    const sessionId = sessionElement?.dataset.sessionId;
    
    results.push({
      test: "SessionId",
      passed: !!sessionId,
      value: sessionId ? sessionId.substring(0, 30) + '...' : 'MANQUANT'
    });
    console.log(`   ${sessionId ? '✅' : '❌'} SessionId: ${sessionId ? sessionId.substring(0, 30) + '...' : 'MANQUANT'}`);
    
    // 2. Vérifier flowiseTableService
    console.log("\n2️⃣ Vérification flowiseTableService...");
    const serviceExists = !!window.flowiseTableService;
    results.push({
      test: "flowiseTableService",
      passed: serviceExists,
      value: typeof window.flowiseTableService
    });
    console.log(`   ${serviceExists ? '✅' : '❌'} flowiseTableService: ${typeof window.flowiseTableService}`);
    
    // 3. Vérifier flowiseTableBridge
    console.log("\n3️⃣ Vérification flowiseTableBridge...");
    const bridgeExists = !!window.flowiseTableBridge;
    results.push({
      test: "flowiseTableBridge",
      passed: bridgeExists,
      value: typeof window.flowiseTableBridge
    });
    console.log(`   ${bridgeExists ? '✅' : '❌'} flowiseTableBridge: ${typeof window.flowiseTableBridge}`);
    
    // 4. Vérifier IndexedDB accessible
    console.log("\n4️⃣ Vérification IndexedDB...");
    try {
      const dbName = 'FloTableDB';
      const request = indexedDB.open(dbName, 1);
      
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('generatedTables')) {
            db.createObjectStore('generatedTables', { keyPath: 'id' });
          }
        };
      });
      
      results.push({
        test: "IndexedDB Accessible",
        passed: true,
        value: `DB ouverte, version ${db.version}`
      });
      console.log(`   ✅ IndexedDB: Accessible (version ${db.version})`);
      
      db.close();
      
    } catch (error) {
      results.push({
        test: "IndexedDB Accessible",
        passed: false,
        value: error.message
      });
      console.error(`   ❌ IndexedDB: ${error.message}`);
    }
    
    // 5. Vérifier écouteur d'événement
    console.log("\n5️⃣ Test écouteur événement flowise:table:save:request...");
    let eventReceived = false;
    const testListener = (e) => {
      eventReceived = true;
      console.log(`   ✅ Événement reçu:`, e.detail);
    };
    
    document.addEventListener('flowise:table:save:request', testListener, { once: true });
    
    const testEvent = new CustomEvent('flowise:table:save:request', {
      detail: {
        table: document.createElement('table'),
        sessionId: sessionId || 'test-session',
        keyword: 'Test_Diagnostic',
        source: 'test',
        forceUpdate: true
      },
      bubbles: true
    });
    
    document.dispatchEvent(testEvent);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    results.push({
      test: "Écouteur Événement",
      passed: eventReceived,
      value: eventReceived ? 'Reçu' : 'Non reçu'
    });
    console.log(`   ${eventReceived ? '✅' : '❌'} Écouteur: ${eventReceived ? 'Actif' : 'Absent'}`);
    
    // 6. Vérifier sauvegarde directe
    console.log("\n6️⃣ Test sauvegarde directe IndexedDB...");
    try {
      const dbName = 'FloTableDB';
      const request = indexedDB.open(dbName, 1);
      
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const testRecord = {
        id: 'test-diagnostic-' + Date.now(),
        sessionId: sessionId || 'test-session',
        keyword: 'Test_Diagnostic_Direct',
        html: '<table><tr><td>Test</td></tr></table>',
        fingerprint: 'test-fingerprint',
        timestamp: new Date().toISOString(),
        source: 'test'
      };
      
      const tx = db.transaction(['generatedTables'], 'readwrite');
      const store = tx.objectStore('generatedTables');
      const putRequest = store.put(testRecord);
      
      await new Promise((resolve, reject) => {
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
      
      results.push({
        test: "Sauvegarde Directe DB",
        passed: true,
        value: testRecord.id
      });
      console.log(`   ✅ Sauvegarde directe: OK (ID: ${testRecord.id})`);
      
      db.close();
      
    } catch (error) {
      results.push({
        test: "Sauvegarde Directe DB",
        passed: false,
        value: error.message
      });
      console.error(`   ❌ Sauvegarde directe: ${error.message}`);
    }
    
    // 7. Vérifier contenu DB
    console.log("\n7️⃣ Lecture contenu IndexedDB...");
    try {
      const dbName = 'FloTableDB';
      const request = indexedDB.open(dbName);
      
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const tx = db.transaction(['generatedTables'], 'readonly');
      const store = tx.objectStore('generatedTables');
      const getAllRequest = store.getAll();
      
      const allTables = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      const sessionTables = allTables.filter(t => t.sessionId === sessionId);
      
      results.push({
        test: "Contenu IndexedDB",
        passed: allTables.length > 0,
        value: `Total: ${allTables.length}, Session: ${sessionTables.length}`
      });
      
      console.log(`   Total DB: ${allTables.length}`);
      console.log(`   Session actuelle: ${sessionTables.length}`);
      if (allTables.length > 0) {
        console.log(`   Dernière table:`, allTables[allTables.length - 1].keyword);
      }
      
      db.close();
      
    } catch (error) {
      results.push({
        test: "Contenu IndexedDB",
        passed: false,
        value: error.message
      });
      console.error(`   ❌ Lecture DB: ${error.message}`);
    }
    
    // 8. Vérifier Table_Conso existe
    console.log("\n8️⃣ Vérification Table_Conso dans DOM...");
    const consoTable = document.querySelector('.claraverse-conso-table');
    results.push({
      test: "Table_Conso dans DOM",
      passed: !!consoTable,
      value: consoTable ? 'Présente' : 'Absente'
    });
    console.log(`   ${consoTable ? '✅' : '❌'} Table_Conso: ${consoTable ? 'Présente' : 'Absente'}`);
    
    if (consoTable) {
      console.log(`   Keyword: ${consoTable.dataset.keyword || 'MANQUANT'}`);
      console.log(`   consoGenerated: ${consoTable.dataset.consoGenerated || 'MANQUANT'}`);
    }
    
    // RÉSUMÉ
    console.log("\n" + "=".repeat(80));
    console.log("📊 RÉSUMÉ DIAGNOSTIC");
    console.log("=".repeat(80));
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`\n✅ Tests passés: ${passedCount}/${totalCount}\n`);
    
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.passed ? '✅' : '❌'} ${r.test}: ${r.value}`);
    });
    
    console.log("\n" + "=".repeat(80));
    
    return {
      passedCount,
      totalCount,
      results
    };
  };
  
})();
