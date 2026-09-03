/**
 * DIAGNOSTIC INDEXEDDB VISUEL
 * Remplace le snippet console par un popup visuel
 */

window.diagnosticIndexedDB = async function() {
  console.log('\n🔍 ===== DIAGNOSTIC INDEXEDDB =====\n');
  
  try {
    // Ouvrir la DB
    const dbRequest = indexedDB.open('FloTableDB', 2);
    
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onupgradeneeded = (event) => {
        console.warn('⚠️ DB upgrade nécessaire, version actuelle:', event.oldVersion);
      };
    });
    
    console.log('✅ Base de données ouverte:', db.name, 'version', db.version);
    
    // Vérifier object stores
    const storeNames = Array.from(db.objectStoreNames);
    console.log('📦 Object stores:', storeNames.join(', '));
    
    if (!storeNames.includes('generatedTables')) {
      const message = '❌ ERREUR CRITIQUE\n\nObject store "generatedTables" manquant!\n\nStores disponibles: ' + storeNames.join(', ') + '\n\nSolution: Vérifier init-indexeddb.js';
      alert(message);
      db.close();
      return;
    }
    
    // Lire toutes les tables
    const transaction = db.transaction(['generatedTables'], 'readonly');
    const store = transaction.objectStore('generatedTables');
    const allRequest = store.getAll();
    
    const allTables = await new Promise((resolve, reject) => {
      allRequest.onsuccess = () => resolve(allRequest.result);
      allRequest.onerror = () => reject(allRequest.error);
    });
    
    console.log(`\n📊 TOTAL TABLES EN DB: ${allTables.length}\n`);
    
    // Session actuelle
    const currentSessionId = window.sessionStorage.getItem('claraverse_session_id');
    const shortCurrentSession = currentSessionId ? currentSessionId.substring(0, 8) + '...' : 'NON DÉFINIE';
    
    if (allTables.length === 0) {
      const message = `📊 DIAGNOSTIC INDEXEDDB

✅ DB: FloTableDB v${db.version}
📦 Stores: ${storeNames.join(', ')}

⚠️ AUCUNE TABLE EN BASE

🎯 Session actuelle: ${shortCurrentSession}

❓ Causes possibles:
1. Tables pas encore générées
2. Sauvegarde échoue silencieusement
3. SessionId manquant pendant sauvegarde

💡 Action:
• Générez une table dans le chat
• Vérifiez logs console:
  ✅ Table saved successfully
• Re-cliquez ce bouton`;
      
      alert(message);
      db.close();
      return;
    }
    
    // Grouper par session
    const bySession = {};
    allTables.forEach(t => {
      const sid = t.sessionId || 'NO_SESSION';
      if (!bySession[sid]) bySession[sid] = [];
      bySession[sid].push(t);
    });
    
    // Construire le message
    let message = `📊 DIAGNOSTIC INDEXEDDB

✅ DB: FloTableDB v${db.version}
📦 Total: ${allTables.length} table(s)

📁 TABLES PAR SESSION:
`;
    
    // Lister chaque session (max 3 sessions)
    const sessionIds = Object.keys(bySession).slice(0, 3);
    sessionIds.forEach(sid => {
      const shortId = sid === 'NO_SESSION' ? sid : sid.substring(0, 8) + '...';
      const tables = bySession[sid];
      message += `\n  📌 ${shortId}: ${tables.length} table(s)\n`;
      
      // Lister tables (max 3 par session)
      tables.slice(0, 3).forEach(t => {
        const keyword = t.keyword || 'sans_keyword';
        const date = new Date(t.timestamp).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        message += `     • ${keyword}\n       ${date}\n`;
      });
      
      if (tables.length > 3) {
        message += `     ... et ${tables.length - 3} autre(s)\n`;
      }
    });
    
    if (Object.keys(bySession).length > 3) {
      message += `\n  ... et ${Object.keys(bySession).length - 3} autre(s) sessions\n`;
    }
    
    // Analyse session actuelle
    message += `\n🎯 SESSION ACTUELLE:\n`;
    message += `   ${shortCurrentSession}\n`;
    
    if (currentSessionId) {
      const currentSessionTables = allTables.filter(t => t.sessionId === currentSessionId);
      message += `   → ${currentSessionTables.length} table(s) pour cette session\n`;
      
      if (currentSessionTables.length === 0) {
        message += `\n⚠️ PROBLÈME DÉTECTÉ\n`;
        message += `Aucune table pour session actuelle\n\n`;
        message += `Vérifier:\n`;
        message += `• SessionId défini pendant génération?\n`;
        message += `• Logs: 💾 [DEBUG] Sauvegarde table\n`;
      } else {
        message += `\n✅ ISOLATION OK\n`;
        message += `Tables correctement sauvegardées\n`;
      }
    } else {
      message += `\n⚠️ Session non définie\n`;
      message += `(Pas encore de message envoyé)\n`;
    }
    
    db.close();
    
    console.log('\n✅ Diagnostic terminé\n');
    alert(message);
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    alert(`❌ ERREUR DIAGNOSTIC\n\n${error.message}\n\nVoir console F12 pour détails`);
  }
};

console.log('✅ Diagnostic IndexedDB visuel chargé (bouton "📊 Diag DB")');
