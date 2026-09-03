/**
 * SCRIPT DE DIAGNOSTIC - CONTAMINATION & DOUBLONS
 * 
 * Définitions (clarifiées 10 avril 2026):
 * 
 * CONTAMINATION INTER-SESSIONS:
 *   - Tables d'un Chat A apparaissent dans Chat B
 *   - Root cause: restoreTablesChronologically() ne filtre pas par sessionId
 *   - Détection: Comparer sessionId table vs sessionId courant
 * 
 * DOUBLONS INTRA-SESSION:
 *   - Même table (même keyword) apparaît 2+ fois dans MÊME session
 *   - Root cause: handleTableIntegrated() ne détecte pas table existante
 *   - Détection: Compter tables avec même keyword dans session courante
 * 
 * Usage:
 * 1. Ouvrir console (F12)
 * 2. Charger script: <script src="/diagnostic-contamination-doublons.js"></script>
 * 3. Taper: testContaminationDoublons()
 */

window.testContaminationDoublons = async function() {
  console.clear();
  console.log("═".repeat(80));
  console.log("🔬 DIAGNOSTIC CONTAMINATION & DOUBLONS - ClaraVerse");
  console.log("═".repeat(80));
  console.log("");
  
  // ═══════════════════════════════════════════════════════════════════
  // ÉTAPE 1: Récupérer sessionId courant
  // ═══════════════════════════════════════════════════════════════════
  console.log("📋 ÉTAPE 1: Identifier session courante");
  console.log("─".repeat(80));
  
  const sessionElement = document.querySelector('[data-session-id], [data-chat-session-id]');
  let currentSessionId = null;
  
  if (sessionElement) {
    currentSessionId = sessionElement.getAttribute('data-session-id') || 
                      sessionElement.getAttribute('data-chat-session-id');
    console.log(`✅ SessionId courant: ${currentSessionId?.substring(0, 40)}...`);
  } else {
    console.error("❌ ERREUR CRITIQUE: Impossible de trouver sessionId dans DOM");
    console.error("   → Tests contamination/doublons impossibles");
    return;
  }
  console.log("");

  // ═══════════════════════════════════════════════════════════════════
  // ÉTAPE 2: Lire TOUTES les tables depuis IndexedDB
  // ═══════════════════════════════════════════════════════════════════
  console.log("📋 ÉTAPE 2: Lire toutes tables depuis IndexedDB");
  console.log("─".repeat(80));
  
  let allTables = [];
  try {
    const dbName = 'clara_database';
    const storeName = 'clara_generated_tables';
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    allTables = await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ ${allTables.length} tables trouvées dans IndexedDB`);
    db.close();
  } catch (error) {
    console.error("❌ ERREUR: Impossible de lire IndexedDB:", error);
    return;
  }
  console.log("");

  // ═══════════════════════════════════════════════════════════════════
  // TEST A: CONTAMINATION INTER-SESSIONS
  // ═══════════════════════════════════════════════════════════════════
  console.log("🧪 TEST A: CONTAMINATION INTER-SESSIONS");
  console.log("─".repeat(80));
  console.log("Définition: Tables d'autres chats présentes dans session courante");
  console.log("");
  
  const tablesAutresSessions = allTables.filter(table => {
    return table.sessionId !== currentSessionId;
  });
  
  if (tablesAutresSessions.length === 0) {
    console.log("✅ AUCUNE CONTAMINATION détectée");
    console.log("   Toutes les tables appartiennent à la session courante");
  } else {
    console.error(`❌ CONTAMINATION DÉTECTÉE: ${tablesAutresSessions.length} tables d'autres sessions`);
    console.error("");
    console.error("   Tables contaminées:");
    tablesAutresSessions.slice(0, 5).forEach(table => {
      console.error(`   - "${table.keyword}" (session: ${table.sessionId?.substring(0, 20)}...)`);
    });
    if (tablesAutresSessions.length > 5) {
      console.error(`   ... et ${tablesAutresSessions.length - 5} autres`);
    }
  }
  console.log("");

  // ═══════════════════════════════════════════════════════════════════
  // TEST B: DOUBLONS INTRA-SESSION
  // ═══════════════════════════════════════════════════════════════════
  console.log("🧪 TEST B: DOUBLONS INTRA-SESSION");
  console.log("─".repeat(80));
  console.log("Définition: Même keyword apparaît 2+ fois dans MÊME session");
  console.log("");
  
  const tablesSessionCourante = allTables.filter(table => {
    return table.sessionId === currentSessionId;
  });
  
  console.log(`📊 ${tablesSessionCourante.length} tables dans session courante`);
  
  // Grouper par keyword
  const keywordCounts = {};
  tablesSessionCourante.forEach(table => {
    const keyword = table.keyword?.toLowerCase() || 'sans-keyword';
    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
  });
  
  // Identifier doublons
  const doublons = Object.entries(keywordCounts).filter(([keyword, count]) => count > 1);
  
  if (doublons.length === 0) {
    console.log("✅ AUCUN DOUBLON détecté");
    console.log("   Chaque keyword est unique dans la session");
  } else {
    console.error(`❌ DOUBLONS DÉTECTÉS: ${doublons.length} keywords dupliqués`);
    console.error("");
    console.error("   Keywords en doublon:");
    doublons.forEach(([keyword, count]) => {
      console.error(`   - "${keyword}": ${count} occurrences`);
    });
  }
  console.log("");

  // ═══════════════════════════════════════════════════════════════════
  // TEST C: TABLES DANS DOM
  // ═══════════════════════════════════════════════════════════════════
  console.log("🧪 TEST C: TABLES VISIBLES DANS DOM");
  console.log("─".repeat(80));
  
  const tablesDOM = document.querySelectorAll('table[data-keyword], table[data-table-keyword]');
  console.log(`📺 ${tablesDOM.length} tables visibles dans DOM`);
  
  if (tablesDOM.length === 0) {
    console.warn("⚠️ ATTENTION: Aucune table dans DOM");
    console.warn("   → Soit aucune table générée, soit restauration a échoué");
  } else {
    console.log("   Keywords visibles:");
    const keywordsDOM = Array.from(tablesDOM).map(t => 
      t.getAttribute('data-keyword') || t.getAttribute('data-table-keyword') || 'unknown'
    );
    keywordsDOM.slice(0, 10).forEach(kw => {
      console.log(`   - ${kw}`);
    });
    if (keywordsDOM.length > 10) {
      console.log(`   ... et ${keywordsDOM.length - 10} autres`);
    }
  }
  console.log("");

  // ═══════════════════════════════════════════════════════════════════
  // RÉSUMÉ FINAL
  // ═══════════════════════════════════════════════════════════════════
  console.log("═".repeat(80));
  console.log("📊 RÉSUMÉ DIAGNOSTIC");
  console.log("═".repeat(80));
  console.log(`Session courante: ${currentSessionId?.substring(0, 40)}...`);
  console.log(`Tables IndexedDB: ${allTables.length} total`);
  console.log(`Tables session courante: ${tablesSessionCourante.length}`);
  console.log(`Tables autres sessions: ${tablesAutresSessions.length} ${tablesAutresSessions.length > 0 ? '❌' : '✅'}`);
  console.log(`Doublons détectés: ${doublons.length} ${doublons.length > 0 ? '❌' : '✅'}`);
  console.log(`Tables DOM: ${tablesDOM.length}`);
  console.log("");
  
  if (tablesAutresSessions.length === 0 && doublons.length === 0) {
    console.log("✅✅✅ SYSTÈME 100% OK - Aucun problème détecté ✅✅✅");
  } else {
    console.error("❌ PROBLÈMES DÉTECTÉS - Voir détails ci-dessus");
  }
  console.log("═".repeat(80));
};

console.log("✅ Script diagnostic chargé");
console.log("💡 Taper: testContaminationDoublons()");
