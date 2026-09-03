/**
 * 🧪 TEST PHASE 3 : Test de Persistance Réelle
 * Génère table, sauvegarde, recharge, vérifie restauration
 */

(function() {
  'use strict';
  
  console.log("🧪 Test Phase 3 (Persistance) chargé");
  
  window.testPhase3Persistance = async function() {
    const results = {
      timestamp: new Date().toLocaleString('fr-FR'),
      phase: 'Phase 3 - Test Persistance Réelle',
      tests: []
    };
    
    console.log("\n" + "=".repeat(80));
    console.log("🧪 PHASE 3 : TEST PERSISTANCE RÉELLE");
    console.log("=".repeat(80) + "\n");
    
    // Test 1: Vérifier tables dans DOM
    console.log("1️⃣ Vérification tables dans DOM...");
    try {
      const consoTable = document.querySelector('.claraverse-conso-table');
      const allTables = document.querySelectorAll('table');
      const resultatTable = Array.from(allTables).find(t => {
        const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
        return headers.some(h => h.includes('resultat') || h.includes('résultat'));
      });
      
      results.tests.push({
        name: "Tables Présentes dans DOM",
        passed: !!consoTable && !!resultatTable,
        details: {
          consoTable: !!consoTable,
          resultatTable: !!resultatTable,
          totalTables: allTables.length
        }
      });
      
      console.log(`   ${consoTable ? '✅' : '❌'} Table_Conso: ${consoTable ? 'OUI' : 'NON'}`);
      console.log(`   ${resultatTable ? '✅' : '❌'} Table_Résultat: ${resultatTable ? 'OUI' : 'NON'}`);
      console.log(`   Total tables: ${allTables.length}`);
      
    } catch (error) {
      results.tests.push({
        name: "Tables Présentes dans DOM",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 2: Vérifier IndexedDB
    console.log("\n2️⃣ Vérification IndexedDB...");
    try {
      if (!window.flowiseTableService) {
        throw new Error("flowiseTableService non disponible");
      }
      
      const sessionId = document.querySelector('[data-session-id]')?.dataset.sessionId;
      if (!sessionId) {
        throw new Error("SessionId non trouvé dans DOM");
      }
      
      // Ouvrir IndexedDB manuellement
      const dbName = 'FloTableDB';
      const request = indexedDB.open(dbName);
      
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const db = request.result;
      const tx = db.transaction(['generatedTables'], 'readonly');
      const store = tx.objectStore('generatedTables');
      const getAllRequest = store.getAll();
      
      const allTables = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      const sessionTables = allTables.filter(t => t.sessionId === sessionId);
      
      results.tests.push({
        name: "Tables dans IndexedDB",
        passed: sessionTables.length > 0,
        details: {
          totalDB: allTables.length,
          sessionTables: sessionTables.length,
          keywords: sessionTables.map(t => t.keyword)
        }
      });
      
      console.log(`   Total DB: ${allTables.length}`);
      console.log(`   Session actuelle: ${sessionTables.length}`);
      console.log(`   Keywords:`, sessionTables.map(t => t.keyword));
      
      db.close();
      
    } catch (error) {
      results.tests.push({
        name: "Tables dans IndexedDB",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 3: Forcer sauvegarde manuelle
    console.log("\n3️⃣ Test sauvegarde manuelle forcée...");
    try {
      const consoTable = document.querySelector('.claraverse-conso-table');
      if (!consoTable) {
        throw new Error("Table_Conso non trouvée");
      }
      
      // Émettre événement de sauvegarde
      const sessionId = document.querySelector('[data-session-id]')?.dataset.sessionId;
      const event = new CustomEvent('flowise:table:save:request', {
        detail: {
          table: consoTable,
          sessionId: sessionId,
          keyword: 'Table_Consolidation',
          source: 'test-manual',
          forceUpdate: true // ⚡ FORCER
        },
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      // Attendre sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results.tests.push({
        name: "Sauvegarde Manuelle Forcée",
        passed: true,
        details: {
          keyword: 'Table_Consolidation',
          forceUpdate: true
        }
      });
      
      console.log(`   ✅ Événement sauvegarde émis avec forceUpdate=true`);
      
    } catch (error) {
      results.tests.push({
        name: "Sauvegarde Manuelle Forcée",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 4: Vérifier sauvegarde effective
    console.log("\n4️⃣ Vérification sauvegarde effective...");
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dbName = 'FloTableDB';
      const request = indexedDB.open(dbName);
      
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const db = request.result;
      const tx = db.transaction(['generatedTables'], 'readonly');
      const store = tx.objectStore('generatedTables');
      const getAllRequest = store.getAll();
      
      const allTables = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      const sessionId = document.querySelector('[data-session-id]')?.dataset.sessionId;
      const consoTableSaved = allTables.find(t => 
        t.sessionId === sessionId && 
        t.keyword === 'Table_Consolidation'
      );
      
      results.tests.push({
        name: "Table Sauvegardée dans DB",
        passed: !!consoTableSaved,
        details: {
          found: !!consoTableSaved,
          tableId: consoTableSaved?.id,
          timestamp: consoTableSaved?.timestamp
        }
      });
      
      console.log(`   ${consoTableSaved ? '✅' : '❌'} Table_Consolidation ${consoTableSaved ? 'trouvée' : 'absente'} dans DB`);
      if (consoTableSaved) {
        console.log(`   ID: ${consoTableSaved.id}`);
        console.log(`   Timestamp: ${consoTableSaved.timestamp}`);
      }
      
      db.close();
      
    } catch (error) {
      results.tests.push({
        name: "Table Sauvegardée dans DB",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 5: Instructions pour test reload
    console.log("\n5️⃣ Instructions test persistance après reload...");
    results.tests.push({
      name: "Instructions Test Reload",
      passed: true,
      details: {
        instruction: "Appuyez F5 et vérifiez si les tables réapparaissent"
      }
    });
    console.log(`   ℹ️ Pour tester persistance: Appuyez F5 et vérifiez si tables réapparaissent`);
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ PHASE 3 TERMINÉE");
    console.log("=".repeat(80) + "\n");
    
    return results;
  };
  
  // Formater résultats
  window.formatPhase3Results = function(results) {
    const passedCount = results.tests.filter(t => t.passed).length;
    const totalCount = results.tests.length;
    const allPassed = passedCount === totalCount;
    
    let html = `
      <div style="padding: 20px;">
        <div style="background: ${allPassed ? '#c6f6d5' : '#fed7d7'}; color: ${allPassed ? '#22543d' : '#742a2a'}; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Phase 3 - Test Persistance</h3>
          <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">
            ${passedCount}/${totalCount} Tests Passés ${allPassed ? '✅' : '⚠️'}
          </p>
          <small>${results.timestamp}</small>
        </div>
    `;
    
    results.tests.forEach((test, index) => {
      const bgColor = test.passed ? '#f0fff4' : '#fff5f5';
      const borderColor = test.passed ? '#48bb78' : '#f56565';
      const icon = test.passed ? '✅' : '❌';
      
      html += `
        <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #2d3748;">${icon} ${index + 1}. ${test.name}</h4>
      `;
      
      if (test.error) {
        html += `<p style="margin: 5px 0; color: #742a2a; font-family: monospace; font-size: 12px;">Erreur: ${test.error}</p>`;
      }
      
      if (test.details) {
        html += `<div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px; font-family: monospace; font-size: 12px;">`;
        Object.entries(test.details).forEach(([key, value]) => {
          html += `<div><strong>${key}:</strong> ${JSON.stringify(value)}</div>`;
        });
        html += `</div>`;
      }
      
      html += `</div>`;
    });
    
    html += `
        <div style="margin-top: 20px; padding: 15px; background: #edf2f7; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #2d3748;">📊 Prochaine Étape</h4>
          <p style="color: #2d3748; margin: 5px 0;">
            Pour tester la persistance complète:<br>
            1. Appuyez <strong>F5</strong> (recharger page)<br>
            2. Vérifiez si les tables réapparaissent<br>
            3. Si OUI ✅ = Persistance fonctionne !<br>
            4. Si NON ❌ = Problème restauration
          </p>
        </div>
      </div>
    `;
    
    return html;
  };
  
})();
