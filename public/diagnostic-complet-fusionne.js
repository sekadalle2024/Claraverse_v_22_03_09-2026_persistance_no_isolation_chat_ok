/**
 * DIAGNOSTIC COMPLET FUSIONNÉ
 * Combine IndexedDB + État Restauration dans un seul popup
 */

console.log('🔧 [Diagnostic] Chargement diagnostic-complet-fusionne.js...');

window.diagnosticComplet = async function() {
  console.log('\n🔍 ===== DIAGNOSTIC COMPLET FUSIONNÉ =====\n');
  
  let message = `🔍 DIAGNOSTIC COMPLET

`;
  
  try {
    // ========================================
    // PARTIE 1 : ÉTAT SYSTÈME
    // ========================================
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `PARTIE 1 : ÉTAT SYSTÈME\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // 1. SessionId
    const sessionElement = document.querySelector('[data-session-id]');
    const sessionId = sessionElement?.dataset.sessionId;
    const shortSessionId = sessionId ? sessionId.substring(0, 8) + '...' : 'NON DÉFINI';
    
    message += `1️⃣ SESSION ID\n`;
    if (sessionId) {
      message += `   ✅ ${shortSessionId}\n\n`;
    } else {
      message += `   ❌ Non défini\n`;
      message += `   → Envoyer message dans chat\n\n`;
    }
    
    // 2. Bridge
    message += `2️⃣ BRIDGE\n`;
    if (window.flowiseTableBridge) {
      message += `   ✅ Chargé\n\n`;
    } else {
      message += `   ❌ Non chargé\n`;
      message += `   → Attendre fin chargement\n\n`;
    }
    
    // 3. Tables dans DOM
    message += `3️⃣ TABLES DANS DOM\n`;
    const tablesInDOM = document.querySelectorAll('table[data-conso-generated="true"]');
    message += `   ${tablesInDOM.length > 0 ? '✅' : '⚠️'} ${tablesInDOM.length} table(s) générée(s)\n`;
    
    if (tablesInDOM.length > 0) {
      message += `\n   Liste:\n`;
      Array.from(tablesInDOM).slice(0, 3).forEach(table => {
        const keyword = table.dataset.keyword || 'sans_keyword';
        message += `   • ${keyword}\n`;
      });
      if (tablesInDOM.length > 3) {
        message += `   ... et ${tablesInDOM.length - 3} autre(s)\n`;
      }
    }
    message += `\n`;
    
    // ========================================
    // PARTIE 2 : INDEXEDDB
    // ========================================
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `PARTIE 2 : INDEXEDDB\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    try {
      const dbRequest = indexedDB.open('FloTableDB', 2);
      const db = await new Promise((resolve, reject) => {
        dbRequest.onsuccess = () => resolve(dbRequest.result);
        dbRequest.onerror = () => reject(dbRequest.error);
        dbRequest.onupgradeneeded = () => console.warn('⚠️ DB upgrade triggered');
      });
      
      message += `4️⃣ DATABASE\n`;
      message += `   ✅ FloTableDB v${db.version}\n\n`;
      
      // Lire toutes les tables
      const transaction = db.transaction(['generatedTables'], 'readonly');
      const store = transaction.objectStore('generatedTables');
      const allRequest = store.getAll();
      const allTables = await new Promise((resolve, reject) => {
        allRequest.onsuccess = () => resolve(allRequest.result);
        allRequest.onerror = () => reject(allRequest.error);
      });
      
      message += `5️⃣ TABLES EN DB\n`;
      message += `   📊 Total: ${allTables.length} table(s)\n`;
      
      if (allTables.length === 0) {
        message += `\n   ⚠️ AUCUNE TABLE EN BASE\n`;
        message += `   → Générer table d'abord\n\n`;
      } else {
        // Grouper par session
        const bySession = {};
        allTables.forEach(t => {
          const sid = t.sessionId || 'NO_SESSION';
          if (!bySession[sid]) bySession[sid] = [];
          bySession[sid].push(t);
        });
        
        message += `   📁 Sessions: ${Object.keys(bySession).length}\n\n`;
        
        // Session actuelle
        const currentSessionTables = sessionId 
          ? allTables.filter(t => t.sessionId === sessionId)
          : [];
        
        message += `6️⃣ SESSION ACTUELLE\n`;
        message += `   🎯 ${shortSessionId}\n`;
        message += `   → ${currentSessionTables.length} table(s)\n`;
        
        if (currentSessionTables.length > 0) {
          message += `\n   Liste:\n`;
          currentSessionTables.slice(0, 3).forEach(t => {
            const keyword = t.keyword || 'sans_keyword';
            const date = new Date(t.timestamp).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
            message += `   • ${keyword}\n     ${date}\n`;
          });
          if (currentSessionTables.length > 3) {
            message += `   ... et ${currentSessionTables.length - 3} autre(s)\n`;
          }
        } else if (allTables.length > 0) {
          message += `\n   ⚠️ Tables existent mais pas\n`;
          message += `      pour session actuelle\n`;
          message += `      → SessionId mismatch\n`;
        }
        message += `\n`;
      }
      
      db.close();
    } catch (dbError) {
      message += `4️⃣ DATABASE\n`;
      message += `   ❌ Erreur: ${dbError.message}\n\n`;
    }
    
    // ========================================
    // PARTIE 3 : DIAGNOSTIC & INSTRUCTIONS
    // ========================================
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `PARTIE 3 : ANALYSE\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Analyse de l'état
    if (!sessionId) {
      message += `❌ SESSION NON DÉFINIE\n\n`;
      message += `Action immédiate:\n`;
      message += `• Envoyer un message dans chat\n`;
      message += `• Re-cliquer "🔍 Diagnostic"\n`;
      
    } else if (tablesInDOM.length === 0) {
      message += `⚠️ AUCUNE TABLE GÉNÉRÉE\n\n`;
      message += `Action immédiate:\n`;
      message += `• Générer table dans chat:\n`;
      message += `  "Crée table Assertion/\n`;
      message += `   Conclusion/CTR avec\n`;
      message += `   2 lignes"\n`;
      message += `• Re-cliquer "🔍 Diagnostic"\n`;
      message += `  pour vérifier sauvegarde\n`;
      
    } else {
      // Tables dans DOM, vérifier DB
      const dbRequest2 = indexedDB.open('FloTableDB', 2);
      const db2 = await new Promise((resolve, reject) => {
        dbRequest2.onsuccess = () => resolve(dbRequest2.result);
        dbRequest2.onerror = () => reject(dbRequest2.error);
      });
      const transaction2 = db2.transaction(['generatedTables'], 'readonly');
      const store2 = transaction2.objectStore('generatedTables');
      const allRequest2 = store2.getAll();
      const allTables2 = await new Promise((resolve, reject) => {
        allRequest2.onsuccess = () => resolve(allRequest2.result);
        allRequest2.onerror = () => reject(allRequest2.error);
      });
      const currentSessionTables = sessionId 
        ? allTables2.filter(t => t.sessionId === sessionId)
        : [];
      db2.close();
      
      if (currentSessionTables.length === 0) {
        message += `❌ SAUVEGARDE ÉCHOUE\n\n`;
        message += `Tables dans DOM MAIS\n`;
        message += `pas dans IndexedDB\n\n`;
        message += `Vérifier Console F12:\n`;
        message += `• Log "✅ Table saved"\n`;
        message += `  doit être présent\n`;
        message += `• Log "💾 [DEBUG] Sauvegarde"\n`;
        message += `  doit afficher sessionId\n`;
        
      } else if (currentSessionTables.length < tablesInDOM.length) {
        message += `⚠️ SAUVEGARDE PARTIELLE\n\n`;
        message += `${tablesInDOM.length} table(s) DOM\n`;
        message += `${currentSessionTables.length} table(s) DB\n\n`;
        message += `Certaines tables pas\n`;
        message += `sauvegardées, vérifier logs\n`;
        
      } else {
        message += `✅ SYSTÈME OPÉRATIONNEL\n\n`;
        message += `${currentSessionTables.length} table(s) générée(s)\n`;
        message += `${currentSessionTables.length} table(s) sauvegardée(s)\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `TEST PERSISTANCE:\n\n`;
        message += `1. Appuyer F5 (recharger)\n`;
        message += `2. Attendre 5 secondes\n`;
        message += `3. Vérifier tables visibles\n`;
        message += `4. Re-cliquer "🔍 Diagnostic"\n`;
        message += `   → Confirmer restauration\n\n`;
        message += `Si tables restaurées:\n`;
        message += `✅ PERSISTANCE FONCTIONNE\n\n`;
        message += `Si tables absentes:\n`;
        message += `❌ Copier logs console\n`;
        message += `   et envoyer pour analyse\n`;
      }
    }
    
  } catch (error) {
    message += `\n❌ ERREUR CRITIQUE:\n${error.message}\n`;
    console.error('Erreur diagnostic:', error);
  }
  
  console.log(message);
  alert(message);
};

console.log('✅ [Diagnostic] Fonction window.diagnosticComplet chargée');
