/**
 * 🔍 DIAGNOSTIC DÉTAILLÉ DE PERSISTANCE
 * Console log pour identifier le point de blocage exact
 * UTILISATION: Via bouton 🔍 en bas à droite OU window.runPersistenceDiagnostic()
 */

(function() {
  'use strict';
  
  console.log("🔍 Diagnostic persistance chargé - Cliquez sur le bouton 🔍 pour lancer");
  
  // Exposer la fonction globalement
  window.runPersistenceDiagnostic = runDiagnostic;
  
  function runDiagnostic() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 ÉTAT DU SYSTÈME");
    console.log("=".repeat(80));
    
    // 1. SessionId
    const sessionId = getSessionIdFromDOM();
    console.log(`\n1️⃣ SESSION ID`);
    console.log(`   Valeur: ${sessionId ? sessionId.substring(0, 40) + '...' : '❌ NON TROUVÉ'}`);
    console.log(`   Statut: ${sessionId ? '✅ PRÉSENT' : '❌ ABSENT'}`);
    
    // 2. conso.js
    console.log(`\n2️⃣ CONSO.JS`);
    console.log(`   claraverseProcessor: ${!!window.claraverseProcessor ? '✅ CHARGÉ' : '❌ NON CHARGÉ'}`);
    if (window.claraverseProcessor) {
      console.log(`   currentSessionId: ${window.claraverseProcessor.currentSessionId || 'null'}`);
      console.log(`   getStorageKey: ${typeof window.claraverseProcessor.getStorageKey === 'function' ? '✅ OK' : '❌ MANQUANT'}`);
    }
    
    // 3. flowiseTableBridge
    console.log(`\n3️⃣ FLOWISE TABLE BRIDGE`);
    console.log(`   flowiseTableBridge: ${!!window.flowiseTableBridge ? '✅ CHARGÉ' : '❌ NON CHARGÉ'}`);
    if (window.flowiseTableBridge) {
      const bridgeSession = window.flowiseTableBridge.getCurrentSession();
      console.log(`   getCurrentSession(): ${bridgeSession ? bridgeSession.substring(0, 40) + '...' : 'null'}`);
    }
    
    // 4. flowiseTableService
    console.log(`\n4️⃣ FLOWISE TABLE SERVICE`);
    console.log(`   flowiseTableService: ${!!window.flowiseTableService ? '✅ CHARGÉ' : '❌ NON CHARGÉ'}`);
    
    // 5. Tables dans le DOM
    const tables = document.querySelectorAll('table');
    console.log(`\n5️⃣ TABLES DANS LE DOM`);
    console.log(`   Nombre total: ${tables.length}`);
    
    const tablesWithKeyword = Array.from(tables).filter(t => t.dataset.keyword);
    console.log(`   Avec keyword: ${tablesWithKeyword.length}`);
    
    if (tables.length > 0) {
      console.log(`\n   📋 Détail des 3 premières tables:`);
      for (let i = 0; i < Math.min(3, tables.length); i++) {
        const table = tables[i];
        console.log(`   Table ${i+1}:`);
        console.log(`     - keyword: ${table.dataset.keyword || '❌ MANQUANT'}`);
        console.log(`     - tableId: ${table.dataset.tableId || '❌ MANQUANT'}`);
        console.log(`     - observerInstalled: ${table.dataset.observerInstalled || 'non'}`);
      }
    }
    
    // 6. Écouteurs d'événements
    console.log(`\n6️⃣ ÉCOUTEURS D'ÉVÉNEMENTS`);
    console.log(`   Test émission d'événement flowise:table:save:request...`);
    
    let eventReceived = false;
    const testListener = (e) => {
      eventReceived = true;
      console.log(`   ✅ Événement REÇU par écouteur test`);
      console.log(`   Détails:`, e.detail);
    };
    
    document.addEventListener('flowise:table:save:request', testListener, { once: true });
    
    // Émettre événement test
    const testEvent = new CustomEvent('flowise:table:save:request', {
      detail: {
        table: document.querySelector('table'),
        sessionId: sessionId || 'test-session',
        keyword: 'Test_Table',
        source: 'diagnostic'
      }
    });
    document.dispatchEvent(testEvent);
    
    setTimeout(() => {
      if (!eventReceived) {
        console.log(`   ❌ Événement NON reçu - Écouteurs peut-être manquants`);
      }
      document.removeEventListener('flowise:table:save:request', testListener);
    }, 100);
    
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TEST DE SAUVEGARDE FORCÉE");
    console.log("=".repeat(80));
    
    if (tables.length > 0 && window.claraverseProcessor) {
      const firstTable = tables[0];
      console.log(`\nTest sur première table (keyword: ${firstTable.dataset.keyword || 'AUCUN'})`);
      
      try {
        console.log(`⏳ Appel de window.claraverseProcessor.saveTableDataNow()...`);
        window.claraverseProcessor.saveTableDataNow(firstTable);
        console.log(`✅ Appel réussi, vérifier logs au-dessus`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'appel:`, error);
      }
    } else {
      console.log(`⚠️ Impossible de tester: ${!tables.length ? 'Aucune table' : 'conso.js non chargé'}`);
    }
    
    // 7. Vérifier IndexedDB
    console.log("\n" + "=".repeat(80));
    console.log("💾 CONTENU INDEXEDDB");
    console.log("=".repeat(80));
    
    if (window.flowiseTableService && sessionId) {
      console.log(`\n⏳ Récupération des tables pour session ${sessionId.substring(0, 40)}...`);
      
      window.flowiseTableService.getAllTables()
        .then(allTables => {
          const sessionTables = allTables.filter(t => t.sessionId === sessionId);
          console.log(`\n📊 RÉSULTAT:`);
          console.log(`   Total toutes sessions: ${allTables.length}`);
          console.log(`   Session courante: ${sessionTables.length}`);
          
          if (sessionTables.length > 0) {
            console.log(`\n   📋 Tables sauvegardées:`);
            sessionTables.forEach((t, i) => {
              console.log(`   ${i+1}. ${t.keyword} (${new Date(t.timestamp).toLocaleTimeString()})`);
            });
          } else {
            console.log(`\n   ❌ AUCUNE TABLE SAUVEGARDÉE pour cette session`);
            console.log(`   💡 C'est probablement ici le problème !`);
          }
        })
        .catch(error => {
          console.error(`❌ Erreur lecture IndexedDB:`, error);
        });
    } else {
      console.log(`⚠️ Impossible de vérifier IndexedDB:`);
      console.log(`   flowiseTableService: ${!!window.flowiseTableService ? 'OK' : '❌ MANQUANT'}`);
      console.log(`   sessionId: ${sessionId ? 'OK' : '❌ MANQUANT'}`);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("🎯 SYNTHÈSE");
    console.log("=".repeat(80));
    
    const issues = [];
    if (!sessionId) issues.push("❌ SessionId manquant dans le DOM");
    if (!window.claraverseProcessor) issues.push("❌ conso.js non chargé");
    if (!window.flowiseTableBridge) issues.push("❌ flowiseTableBridge non chargé");
    if (!window.flowiseTableService) issues.push("❌ flowiseTableService non chargé");
    if (tables.length === 0) issues.push("⚠️ Aucune table dans le DOM");
    if (tablesWithKeyword.length < tables.length) issues.push(`⚠️ ${tables.length - tablesWithKeyword.length} table(s) sans keyword`);
    
    if (issues.length === 0) {
      console.log(`\n✅ TOUS LES COMPOSANTS SONT PRÉSENTS`);
      console.log(`💡 Si pas de persistance, vérifier:`);
      console.log(`   1. Logs "⚠️ Sauvegarde ignorée" dans console`);
      console.log(`   2. Logs "ℹ️ Table unchanged, skipping duplicate" dans console`);
      console.log(`   3. Contenu IndexedDB ci-dessus (doit avoir des tables)`);
    } else {
      console.log(`\n❌ PROBLÈMES DÉTECTÉS:`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ DIAGNOSTIC TERMINÉ");
    console.log("=".repeat(80) + "\n");
  }
  
  function getSessionIdFromDOM() {
    try {
      const sessionElement = document.querySelector('[data-session-id], [data-chat-session-id], [data-clara-session-id]');
      if (sessionElement) {
        return sessionElement.getAttribute('data-session-id') || 
               sessionElement.getAttribute('data-chat-session-id') ||
               sessionElement.getAttribute('data-clara-session-id');
      }
    } catch (e) {}
    return null;
  }
  
})();
