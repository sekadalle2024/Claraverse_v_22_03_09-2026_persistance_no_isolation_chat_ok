/**
 * SNIPPET DIAGNOSTIC INDEXEDDB
 * 
 * À COPIER-COLLER DANS LA CONSOLE F12
 * 
 * Vérifie le contenu d'IndexedDB après génération de tables
 */

(async function diagnosticIndexedDB() {
  console.log('\n🔍 ===== DIAGNOSTIC INDEXEDDB =====\n');
  
  try {
    // Ouvrir la DB
    const dbRequest = indexedDB.open('FloTableDB', 2);
    
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    
    console.log('✅ Base de données ouverte:', db.name, 'version', db.version);
    console.log('📦 Object stores:', Array.from(db.objectStoreNames).join(', '));
    
    // Lire toutes les tables
    const transaction = db.transaction(['generatedTables'], 'readonly');
    const store = transaction.objectStore('generatedTables');
    const allRequest = store.getAll();
    
    const allTables = await new Promise((resolve, reject) => {
      allRequest.onsuccess = () => resolve(allRequest.result);
      allRequest.onerror = () => reject(allRequest.error);
    });
    
    console.log(`\n📊 TOTAL TABLES EN DB: ${allTables.length}\n`);
    
    if (allTables.length === 0) {
      console.warn('⚠️ AUCUNE TABLE EN BASE');
      console.log('\n❓ Causes possibles:');
      console.log('  1. Tables pas encore générées');
      console.log('  2. Sauvegarde échoue silencieusement');
      console.log('  3. SessionId manquant au moment de la sauvegarde');
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
    
    console.log('📁 TABLES PAR SESSION:\n');
    Object.keys(bySession).forEach(sid => {
      const shortId = sid === 'NO_SESSION' ? sid : sid.substring(0, 8) + '...';
      console.log(`  Session ${shortId}: ${bySession[sid].length} table(s)`);
      bySession[sid].forEach(t => {
        console.log(`    - "${t.keyword}" (${t.id.substring(0, 8)}...) créée le ${new Date(t.timestamp).toLocaleString()}`);
      });
    });
    
    // Vérifier session actuelle
    const currentSessionId = window.sessionStorage.getItem('claraverse_session_id');
    console.log(`\n🎯 SESSION ACTUELLE: ${currentSessionId ? currentSessionId.substring(0, 8) + '...' : 'NON DÉFINIE'}`);
    
    if (currentSessionId) {
      const currentSessionTables = allTables.filter(t => t.sessionId === currentSessionId);
      console.log(`   → ${currentSessionTables.length} table(s) pour cette session`);
      
      if (currentSessionTables.length === 0) {
        console.warn('\n⚠️ PROBLÈME: Aucune table pour la session actuelle');
        console.log('   Vérifier si sessionId était défini pendant la génération de tables');
      }
    } else {
      console.warn('\n⚠️ Session actuelle non définie (pas encore de message envoyé ?)');
    }
    
    db.close();
    
    console.log('\n✅ Diagnostic terminé\n');
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
})();
