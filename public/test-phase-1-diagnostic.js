/**
 * 🧪 TEST PHASE 1 : Diagnostic Pré-Implémentation
 * Bouton intégré dans le panneau de diagnostic
 */

(function() {
  'use strict';
  
  console.log("🧪 Test Phase 1 chargé");
  
  window.testPhase1 = async function() {
    const results = {
      timestamp: new Date().toLocaleString('fr-FR'),
      phase: 'Phase 1 - Diagnostic Pré-Implémentation',
      tests: []
    };
    
    console.log("\n" + "=".repeat(80));
    console.log("🧪 PHASE 1 : DIAGNOSTIC PRÉ-IMPLÉMENTATION");
    console.log("=".repeat(80) + "\n");
    
    // Test 1: Vérifier IndexedDB
    console.log("1️⃣ Vérification IndexedDB...");
    try {
      if (!window.flowiseTableService) {
        throw new Error("flowiseTableService non disponible");
      }
      
      const allTables = await window.flowiseTableService.getAllTables();
      const sessionId = document.querySelector('[data-session-id]')?.dataset.sessionId;
      const sessionTables = sessionId ? allTables.filter(t => t.sessionId === sessionId) : [];
      
      const consoTable = sessionTables.find(t => t.keyword.includes('Conso'));
      const resultatTable = sessionTables.find(t => t.keyword.includes('Resultat') || t.keyword.includes('Résultat'));
      const modelisedTable = sessionTables.find(t => 
        t.keyword.includes('Modelis') || 
        t.keyword.includes('Assertion') || 
        t.keyword.includes('Conclusion')
      );
      
      results.tests.push({
        name: "IndexedDB - Tables Session Courante",
        passed: true,
        details: {
          totalTables: allTables.length,
          sessionTables: sessionTables.length,
          hasTableConso: !!consoTable,
          hasTableResultat: !!resultatTable,
          hasModelised: !!modelisedTable
        }
      });
      
      console.log(`   ✅ Total tables toutes sessions: ${allTables.length}`);
      console.log(`   ✅ Tables session courante: ${sessionTables.length}`);
      console.log(`   ${consoTable ? '✅' : '❌'} Table_Conso trouvée`);
      console.log(`   ${resultatTable ? '✅' : '❌'} Table_Resultat trouvée`);
      console.log(`   ${modelisedTable ? '✅' : '❌'} Table Modélisée trouvée`);
      
    } catch (error) {
      results.tests.push({
        name: "IndexedDB - Tables Session Courante",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 2: SessionId Unique Par Chat
    console.log("\n2️⃣ Vérification SessionId...");
    try {
      const sessionElement = document.querySelector('[data-session-id]');
      const sessionId = sessionElement?.dataset.sessionId;
      
      if (!sessionId) {
        throw new Error("SessionId non trouvé dans le DOM");
      }
      
      const isUnique = sessionId.includes('clara-session') || sessionId.includes('chat');
      
      results.tests.push({
        name: "SessionId Unique",
        passed: isUnique,
        details: {
          sessionId: sessionId.substring(0, 40) + '...',
          format: isUnique ? 'Correct (unique par chat)' : 'Incorrect (global)'
        }
      });
      
      console.log(`   ✅ SessionId: ${sessionId.substring(0, 40)}...`);
      console.log(`   ${isUnique ? '✅' : '❌'} Format unique par chat`);
      
    } catch (error) {
      results.tests.push({
        name: "SessionId Unique",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 3: Tables dans le DOM
    console.log("\n3️⃣ Analyse tables DOM...");
    try {
      const allDomTables = document.querySelectorAll('table');
      const consoTableDom = document.querySelector('.claraverse-conso-table');
      const resultatTableDom = Array.from(allDomTables).find(t => {
        const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
        return headers.some(h => h.includes('resultat') || h.includes('résultat'));
      });
      
      const modelisedTableDom = Array.from(allDomTables).find(t => {
        const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
        return headers.some(h => h.includes('assertion') || h.includes('conclusion') || h.includes('ctr'));
      });
      
      results.tests.push({
        name: "Tables dans le DOM",
        passed: true,
        details: {
          totalTables: allDomTables.length,
          hasTableConso: !!consoTableDom,
          hasTableResultat: !!resultatTableDom,
          hasModelised: !!modelisedTableDom,
          consoTags: consoTableDom ? {
            hasKeyword: !!consoTableDom.dataset.keyword,
            hasConsoGenerated: consoTableDom.dataset.consoGenerated === 'true',
            hasTablePosition: !!consoTableDom.dataset.tablePosition,
            hasTimestamp: !!consoTableDom.dataset.createdTimestamp
          } : null
        }
      });
      
      console.log(`   ✅ Total tables DOM: ${allDomTables.length}`);
      console.log(`   ${consoTableDom ? '✅' : '❌'} Table_Conso dans DOM`);
      console.log(`   ${resultatTableDom ? '✅' : '❌'} Table_Resultat dans DOM`);
      console.log(`   ${modelisedTableDom ? '✅' : '❌'} Table Modélisée dans DOM`);
      
      if (consoTableDom) {
        console.log(`\n   📋 Tags Table_Conso:`);
        console.log(`      keyword: ${consoTableDom.dataset.keyword || '❌ MANQUANT'}`);
        console.log(`      consoGenerated: ${consoTableDom.dataset.consoGenerated || '❌ MANQUANT'}`);
        console.log(`      tablePosition: ${consoTableDom.dataset.tablePosition || '❌ MANQUANT'}`);
        console.log(`      createdTimestamp: ${consoTableDom.dataset.createdTimestamp || '❌ MANQUANT'}`);
      }
      
    } catch (error) {
      results.tests.push({
        name: "Tables dans le DOM",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    // Test 4: Composants Système
    console.log("\n4️⃣ Vérification composants...");
    const components = {
      claraverseProcessor: !!window.claraverseProcessor,
      flowiseTableBridge: !!window.flowiseTableBridge,
      flowiseTableService: !!window.flowiseTableService,
      autoKeywordPatcher: !!window.autoKeywordPatcher
    };
    
    results.tests.push({
      name: "Composants Système",
      passed: Object.values(components).every(v => v),
      details: components
    });
    
    Object.entries(components).forEach(([name, loaded]) => {
      console.log(`   ${loaded ? '✅' : '❌'} ${name}`);
    });
    
    // Test 5: Test Sauvegarde Manuelle
    console.log("\n5️⃣ Test sauvegarde manuelle...");
    try {
      const testTable = document.querySelector('table');
      if (!testTable) {
        throw new Error("Aucune table dans le DOM pour tester");
      }
      
      console.log("   ⏳ Tentative de sauvegarde...");
      
      // Capturer événements
      let eventEmitted = false;
      let bridgeReceived = false;
      
      const eventListener = () => { eventEmitted = true; };
      document.addEventListener('flowise:table:save:request', eventListener, { once: true });
      
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      // Déclencher sauvegarde
      window.claraverseProcessor.saveTableDataNow(testTable);
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log = originalLog;
      
      bridgeReceived = logs.some(log => log.includes('[Bridge] Handling save request'));
      
      results.tests.push({
        name: "Test Sauvegarde Manuelle",
        passed: eventEmitted,
        details: {
          eventEmitted,
          bridgeReceived,
          logsCount: logs.length
        }
      });
      
      console.log(`   ${eventEmitted ? '✅' : '❌'} Événement émis`);
      console.log(`   ${bridgeReceived ? '✅' : '❌'} Bridge a reçu l'événement`);
      
    } catch (error) {
      results.tests.push({
        name: "Test Sauvegarde Manuelle",
        passed: false,
        error: error.message
      });
      console.error(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ PHASE 1 TERMINÉE");
    console.log("=".repeat(80) + "\n");
    
    return results;
  };
  
  // Formater résultats pour affichage HTML
  window.formatPhase1Results = function(results) {
    const passedCount = results.tests.filter(t => t.passed).length;
    const totalCount = results.tests.length;
    const allPassed = passedCount === totalCount;
    
    let html = `
      <div style="padding: 20px;">
        <div style="background: ${allPassed ? '#c6f6d5' : '#fed7d7'}; color: ${allPassed ? '#22543d' : '#742a2a'}; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Phase 1 - Diagnostic Pré-Implémentation</h3>
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
        html += formatDetails(test.details);
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
          Le système est prêt pour la Phase 2 (Modifications Critiques).
        </p>
      `;
    } else {
      html += `
        <p style="color: #742a2a; margin: 5px 0;">
          ⚠️ <strong>${totalCount - passedCount} test(s) échoué(s)</strong><br>
          Vérifiez les détails ci-dessus avant de continuer.
        </p>
      `;
    }
    
    html += `
        </div>
        <div style="margin-top: 15px; text-align: center;">
          <button onclick="window.runNextPhase(2)" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
            Continuer vers Phase 2 →
          </button>
        </div>
      </div>
    `;
    
    return html;
  };
  
  function formatDetails(obj, indent = 0) {
    let html = '';
    const indentStr = '&nbsp;'.repeat(indent * 4);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        html += `${indentStr}<strong>${key}:</strong><br>`;
        html += formatDetails(value, indent + 1);
      } else {
        const displayValue = typeof value === 'boolean' 
          ? (value ? '✅ true' : '❌ false')
          : value;
        html += `${indentStr}<strong>${key}:</strong> ${displayValue}<br>`;
      }
    }
    
    return html;
  }
  
})();
