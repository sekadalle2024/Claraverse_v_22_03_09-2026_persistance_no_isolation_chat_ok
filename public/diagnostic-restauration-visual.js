/**
 * DIAGNOSTIC RESTAURATION VISUEL
 * Affiche l'état de la restauration étape par étape
 */

window.diagnosticRestauration = async function() {
  console.log('\n🔍 ===== DIAGNOSTIC RESTAURATION =====\n');
  
  let message = `🔍 DIAGNOSTIC RESTAURATION

`;
  
  try {
    // 1. Vérifier SessionId
    const sessionElement = document.querySelector('[data-session-id]');
    const sessionId = sessionElement?.dataset.sessionId;
    const shortSessionId = sessionId ? sessionId.substring(0, 8) + '...' : 'NON DÉFINI';
    
    message += `1️⃣ SESSION ID\n`;
    if (sessionId) {
      message += `   ✅ ${shortSessionId}\n\n`;
    } else {
      message += `   ❌ Non défini\n`;
      message += `   → Vérifier data-session-id dans DOM\n\n`;
    }
    
    // 2. Vérifier Bridge
    message += `2️⃣ BRIDGE\n`;
    if (window.flowiseTableBridge) {
      message += `   ✅ Chargé\n\n`;
    } else {
      message += `   ❌ Non chargé\n`;
      message += `   → Attendre chargement complet\n\n`;
    }
    
    // 3. Vérifier IndexedDB
    message += `3️⃣ INDEXEDDB\n`;
    try {
      const dbRequest = indexedDB.open('FloTableDB', 2);
      const db = await new Promise((resolve, reject) => {
        dbRequest.onsuccess = () => resolve(dbRequest.result);
        dbRequest.onerror = () => reject(dbRequest.error);
      });
      
      const transaction = db.transaction(['generatedTables'], 'readonly');
      const store = transaction.objectStore('generatedTables');
      const allRequest = store.getAll();
      const allTables = await new Promise((resolve, reject) => {
        allRequest.onsuccess = () => resolve(allRequest.result);
        allRequest.onerror = () => reject(allRequest.error);
      });
      
      const currentSessionTables = sessionId 
        ? allTables.filter(t => t.sessionId === sessionId)
        : [];
      
      message += `   ✅ DB ouverte (v${db.version})\n`;
      message += `   📊 Total: ${allTables.length} table(s)\n`;
      message += `   🎯 Session actuelle: ${currentSessionTables.length}\n\n`;
      
      if (currentSessionTables.length === 0 && allTables.length > 0) {
        message += `   ⚠️ Tables existent mais pas\n`;
        message += `      pour session actuelle\n`;
        message += `      → SessionId mismatch\n\n`;
      }
      
      db.close();
    } catch (dbError) {
      message += `   ❌ Erreur: ${dbError.message}\n\n`;
    }
    
    // 4. Vérifier tables dans DOM
    message += `4️⃣ TABLES DANS DOM\n`;
    const tablesInDOM = document.querySelectorAll('table[data-conso-generated="true"]');
    message += `   ${tablesInDOM.length > 0 ? '✅' : '⚠️'} ${tablesInDOM.length} table(s) générée(s)\n\n`;
    
    if (tablesInDOM.length > 0) {
      message += `   Tables trouvées:\n`;
      Array.from(tablesInDOM).slice(0, 3).forEach(table => {
        const keyword = table.dataset.keyword || 'sans_keyword';
        message += `   • ${keyword}\n`;
      });
      if (tablesInDOM.length > 3) {
        message += `   ... et ${tablesInDOM.length - 3} autre(s)\n`;
      }
      message += `\n`;
    }
    
    // 5. Instructions
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (!sessionId) {
      message += `❌ SESSION NON DÉFINIE\n\n`;
      message += `Action:\n`;
      message += `• Envoyer un message dans chat\n`;
      message += `• Re-cliquer ce bouton\n`;
    } else if (tablesInDOM.length === 0) {
      message += `⚠️ AUCUNE TABLE GÉNÉRÉE\n\n`;
      message += `Action:\n`;
      message += `• Générer table (ex: Assertion/\n`;
      message += `  Conclusion/CTR avec 2 lignes)\n`;
      message += `• Cliquer "📊 Diag DB" pour\n`;
      message += `  vérifier sauvegarde\n`;
      message += `• F5 pour tester restauration\n`;
    } else {
      message += `✅ SYSTÈME PRÊT\n\n`;
      message += `Test persistance:\n`;
      message += `1. Cliquer "📊 Diag DB"\n`;
      message += `   → Vérifier tables en DB\n`;
      message += `2. Appuyer F5 (recharger)\n`;
      message += `3. Vérifier tables restaurées\n`;
      message += `4. Re-cliquer "🔍 Diagnostic"\n`;
      message += `   pour confirmer\n`;
    }
    
  } catch (error) {
    message += `\n❌ ERREUR:\n${error.message}\n`;
  }
  
  console.log(message);
  alert(message);
};

console.log('✅ Diagnostic Restauration visuel chargé (bouton "🔍 Diagnostic")');
