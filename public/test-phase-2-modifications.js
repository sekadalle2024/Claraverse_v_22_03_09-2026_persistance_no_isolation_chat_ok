/**
 * 🧪 TEST PHASE 2 : Vérification Modifications Critiques
 * Bouton intégré dans le panneau de diagnostic
 */

(function() {
  'use strict';
  
  console.log("🧪 Test Phase 2 chargé");
  
  window.testPhase2 = async function() {
    const results = {
      timestamp: new Date().toLocaleString('fr-FR'),
      phase: 'Phase 2 - Modifications Critiques',
      tests: []
    };
    
    console.log("\n" + "=".repeat(80));
    console.log("🧪 PHASE 2 : VÉRIFICATION MODIFICATIONS CRITIQUES");
    console.log("=".repeat(80) + "\n");
    
    // Test 1: Tags sur Table_Conso
    console.log("1️⃣ Vérification tags Table_Conso...");
    try {
      const consoTable = document.querySelector('.claraverse-conso-table');
      
      if (!consoTable) {
        throw new Error("Table_Conso non trouvée (générez une table d'abord)");
      }
      
      const hasTags = {
        keyword: !!consoTable.dataset.keyword,
        consoGenerated: consoTable.dataset.consoGenerated === 'true',
        tablePosition: consoTable.dataset.tablePosition === '1',
        createdTimestamp: !!consoTable.dataset.createdTimestamp
      };
      
      const allTagsPresent = Object.values(hasTags).every(v => v);
      
      results.tests.push({
        name: "Tags Table_Conso",
        passed: allTagsPresent,
        details: hasTags
      });
      
      console.log(`   ${hasTags.keyword ? '✅' : '❌'} data-keyword: ${consoTable.dataset.keyword || 'MANQUANT'}`);
      console.log(`   ${hasTags.consoGenerated ? '✅' : '❌'} data-conso-generated: ${consoTable.dataset.consoGenerated || 'MANQUANT'}`);
      console.log(`   ${hasTags.tablePosition ? '✅' : '❌'} data-table-position: ${consoTable.dataset.tablePosition || 'MANQUANT'}`);
      console.log(`   ${hasTags.createdTimestamp ? '✅' : '❌'} data-created-timestamp: ${consoTable.dataset.createdTimestamp || 'MANQUANT'}`);
      
    } catch (error) {
      results.tests.push({
        name: "Tags Table_Conso",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 2: Tags sur Table_Résultat
    console.log("\n2️⃣ Vérification tags Table_Résultat...");
    try {
      const allTables = document.querySelectorAll('table');
      const resultatTable = Array.from(allTables).find(t => {
        const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
        return headers.some(h => h.includes('resultat') || h.includes('résultat'));
      });
      
      if (!resultatTable) {
        throw new Error("Table_Resultat non trouvée (générez une table d'abord)");
      }
      
      const hasTags = {
        keyword: !!resultatTable.dataset.keyword,
        consoGenerated: resultatTable.dataset.consoGenerated === 'true',
        tablePosition: resultatTable.dataset.tablePosition === '2',
        createdTimestamp: !!resultatTable.dataset.createdTimestamp
      };
      
      const allTagsPresent = Object.values(hasTags).every(v => v);
      
      results.tests.push({
        name: "Tags Table_Résultat",
        passed: allTagsPresent,
        details: hasTags
      });
      
      console.log(`   ${hasTags.keyword ? '✅' : '❌'} data-keyword: ${resultatTable.dataset.keyword || 'MANQUANT'}`);
      console.log(`   ${hasTags.consoGenerated ? '✅' : '❌'} data-conso-generated: ${resultatTable.dataset.consoGenerated || 'MANQUANT'}`);
      console.log(`   ${hasTags.tablePosition ? '✅' : '❌'} data-table-position: ${resultatTable.dataset.tablePosition || 'MANQUANT'}`);
      console.log(`   ${hasTags.createdTimestamp ? '✅' : '❌'} data-created-timestamp: ${resultatTable.dataset.createdTimestamp || 'MANQUANT'}`);
      
    } catch (error) {
      results.tests.push({
        name: "Tags Table_Résultat",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 3: forceUpdate dans événement
    console.log("\n3️⃣ Test forceUpdate dans événement...");
    try {
      const consoTable = document.querySelector('.claraverse-conso-table');
      
      if (!consoTable) {
        throw new Error("Table_Conso non trouvée");
      }
      
      // Capturer l'événement
      let eventDetail = null;
      const eventListener = (e) => {
        eventDetail = e.detail;
      };
      document.addEventListener('flowise:table:save:request', eventListener, { once: true });
      
      // Déclencher sauvegarde
      window.claraverseProcessor.saveTableDataNow(consoTable);
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hasForceUpdate = eventDetail && eventDetail.forceUpdate === true;
      
      results.tests.push({
        name: "forceUpdate dans Événement",
        passed: hasForceUpdate,
        details: {
          eventEmitted: !!eventDetail,
          forceUpdate: eventDetail?.forceUpdate,
          keyword: eventDetail?.keyword
        }
      });
      
      console.log(`   ${eventDetail ? '✅' : '❌'} Événement émis`);
      console.log(`   ${hasForceUpdate ? '✅' : '❌'} forceUpdate=true`);
      console.log(`   Keyword: ${eventDetail?.keyword || 'N/A'}`);
      
    } catch (error) {
      results.tests.push({
        name: "forceUpdate dans Événement",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 4: Bridge reçoit forceUpdate
    console.log("\n4️⃣ Test Bridge reçoit forceUpdate...");
    try {
      // Capturer les logs console
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      const consoTable = document.querySelector('.claraverse-conso-table');
      if (!consoTable) {
        throw new Error("Table_Conso non trouvée");
      }
      
      // Déclencher sauvegarde
      window.claraverseProcessor.saveTableDataNow(consoTable);
      
      // Attendre
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log = originalLog;
      
      const bridgeReceivedForceUpdate = logs.some(log => 
        log.includes('[Bridge] forceUpdate=true') || 
        log.includes('ForceUpdate actif')
      );
      
      results.tests.push({
        name: "Bridge Reçoit forceUpdate",
        passed: bridgeReceivedForceUpdate,
        details: {
          logsCount: logs.length,
          forceUpdateDetected: bridgeReceivedForceUpdate
        }
      });
      
      console.log(`   ${bridgeReceivedForceUpdate ? '✅' : '❌'} Bridge a détecté forceUpdate`);
      
    } catch (error) {
      results.tests.push({
        name: "Bridge Reçoit forceUpdate",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 5: Sauvegarde sans skip
    console.log("\n5️⃣ Test sauvegarde forcée (pas de skip)...");
    try {
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      const consoTable = document.querySelector('.claraverse-conso-table');
      if (!consoTable) {
        throw new Error("Table_Conso non trouvée");
      }
      
      // Déclencher sauvegarde
      window.claraverseProcessor.saveTableDataNow(consoTable);
      
      // Attendre
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log = originalLog;
      
      const hasSkipLog = logs.some(log => 
        log.includes('skipping duplicate') || 
        log.includes('unchanged')
      );
      
      const hasSaveSuccess = logs.some(log => 
        log.includes('Table saved successfully') || 
        log.includes('Table forcée à jour')
      );
      
      results.tests.push({
        name: "Sauvegarde Forcée (Pas Skip)",
        passed: !hasSkipLog && hasSaveSuccess,
        details: {
          skipDetected: hasSkipLog,
          saveSuccess: hasSaveSuccess,
          logsCount: logs.length
        }
      });
      
      console.log(`   ${!hasSkipLog ? '✅' : '❌'} Pas de skip doublon`);
      console.log(`   ${hasSaveSuccess ? '✅' : '❌'} Sauvegarde réussie`);
      
    } catch (error) {
      results.tests.push({
        name: "Sauvegarde Forcée (Pas Skip)",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ PHASE 2 TERMINÉE");
    console.log("=".repeat(80) + "\n");
    
    return results;
  };
  
  // Formater résultats pour affichage HTML
  window.formatPhase2Results = function(results) {
    const passedCount = results.tests.filter(t => t.passed).length;
    const totalCount = results.tests.length;
    const allPassed = passedCount === totalCount;
    
    let html = `
      <div style="padding: 20px;">
        <div style="background: ${allPassed ? '#c6f6d5' : '#fed7d7'}; color: ${allPassed ? '#22543d' : '#742a2a'}; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Phase 2 - Modifications Critiques</h3>
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
        html += window.formatDetails ? window.formatDetails(test.details) : JSON.stringify(test.details);
        html += `</div>`;
      }
      
      html += `</div>`;
    });
    
    html += `
        <div style="margin-top: 20px; padding: 15px; background: #edf2f7; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #2d3748;">📊 Interprétation</h4>
    `;
    
    if (allPassed) {
      html += `
        <p style="color: #22543d; margin: 5px 0;">
          ✅ <strong>Tous les tests sont passés</strong><br>
          Les modifications critiques sont appliquées correctement.<br>
          Prêt pour Phase 3 (Test de Persistance).
        </p>
      `;
    } else {
      const failedTests = results.tests.filter(t => !t.passed);
      html += `
        <p style="color: #742a2a; margin: 5px 0;">
          ⚠️ <strong>${failedTests.length} test(s) échoué(s)</strong><br>
      `;
      failedTests.forEach(t => {
        html += `   • ${t.name}: ${t.error || 'Vérifiez les détails'}<br>`;
      });
      html += `</p>`;
    }
    
    html += `
        </div>
        <div style="margin-top: 15px; text-align: center;">
          <button onclick="window.runNextPhase(3)" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
            Continuer vers Phase 3 (Test Persistance) →
          </button>
        </div>
      </div>
    `;
    
    return html;
  };
  
})();
