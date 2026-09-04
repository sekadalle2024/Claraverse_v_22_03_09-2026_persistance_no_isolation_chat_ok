// ========================================
// 🔍 DIAGNOSTIC UNIFIÉ COMPLET
// ========================================
// Fusionne tous les diagnostics en un seul
// Version: 1.0
// Date: 29 Août 2026

(function() {
  'use strict';

  console.log('🔍 [Diagnostic Unifié] Chargement...');

  // ========================================
  // FONCTION PRINCIPALE
  // ========================================
  window.diagnosticUnifie = async function() {
    console.log('🔍 [Diagnostic Unifié] Début du diagnostic complet...');

    const results = {
      timestamp: new Date().toLocaleString('fr-FR'),
      sessionId: null,
      indexedDB: {},
      dom: {},
      tables: [],
      contamination: {},
      recommendations: []
    };

    try {
      // 1️⃣ SESSION ID
      results.sessionId = await checkSessionId();

      // 2️⃣ INDEXEDDB
      results.indexedDB = await checkIndexedDB();

      // 3️⃣ DOM & BRIDGE
      results.dom = await checkDOM();

      // 4️⃣ TABLES DANS LE DOM
      results.tables = await checkTables();

      // 5️⃣ CONTAMINATION
      if (results.tables.length > 0) {
        results.contamination = await checkContamination(results.sessionId, results.tables);
      }

      // 6️⃣ RECOMMANDATIONS
      results.recommendations = generateRecommendations(results);

      // 7️⃣ AFFICHAGE
      displayResults(results);

    } catch (error) {
      console.error('❌ [Diagnostic Unifié] Erreur:', error);
      alert(`❌ ERREUR DIAGNOSTIC\n\n${error.message}\n\nVoir console F12 pour détails`);
    }
  };

  // ========================================
  // 1️⃣ VÉRIFICATION SESSION ID
  // ========================================
  async function checkSessionId() {
    console.log('🔍 [Diagnostic] Vérification SessionId...');

    // Méthode 1: Variable globale
    if (window.currentSessionId) {
      return {
        status: 'ok',
        value: window.currentSessionId,
        source: 'window.currentSessionId'
      };
    }

    // Méthode 2: LocalStorage
    const lsSessionId = localStorage.getItem('currentSessionId');
    if (lsSessionId) {
      return {
        status: 'ok',
        value: lsSessionId,
        source: 'localStorage'
      };
    }

    // Méthode 3: Via Bridge
    if (window.flowiseTableBridge?.currentSessionId) {
      return {
        status: 'ok',
        value: window.flowiseTableBridge.currentSessionId,
        source: 'flowiseTableBridge'
      };
    }

    return {
      status: 'absent',
      value: null,
      source: null
    };
  }

  // ========================================
  // 2️⃣ VÉRIFICATION INDEXEDDB
  // ========================================
  async function checkIndexedDB() {
    console.log('🔍 [Diagnostic] Vérification IndexedDB...');

    const result = {
      accessible: false,
      dbName: null,
      version: null,
      totalTables: 0,
      tablesBySession: {},
      errors: []
    };

    try {
      // Ouvrir la DB
      const dbRequest = indexedDB.open('FloTableDB');

      const db = await new Promise((resolve, reject) => {
        dbRequest.onsuccess = (e) => resolve(e.target.result);
        dbRequest.onerror = (e) => reject(e.target.error);
      });

      result.accessible = true;
      result.dbName = db.name;
      result.version = db.version;

      // Vérifier l'object store
      if (!db.objectStoreNames.contains('generatedTables')) {
        result.errors.push('Object store "generatedTables" manquant');
        db.close();
        return result;
      }

      // Lire les tables
      const transaction = db.transaction(['generatedTables'], 'readonly');
      const store = transaction.objectStore('generatedTables');
      const getAllRequest = store.getAll();

      const allTables = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });

      result.totalTables = allTables.length;

      // Grouper par session
      allTables.forEach(table => {
        const sessionId = table.sessionId || 'unknown';
        if (!result.tablesBySession[sessionId]) {
          result.tablesBySession[sessionId] = [];
        }
        result.tablesBySession[sessionId].push({
          keyword: table.keyword,
          timestamp: table.timestamp,
          messageId: table.messageId
        });
      });

      db.close();

    } catch (error) {
      result.errors.push(`Erreur IndexedDB: ${error.message}`);
    }

    return result;
  }

  // ========================================
  // 3️⃣ VÉRIFICATION DOM & BRIDGE
  // ========================================
  async function checkDOM() {
    console.log('🔍 [Diagnostic] Vérification DOM & Bridge...');

    return {
      bridge: {
        loaded: !!window.flowiseTableBridge,
        hasCurrentSessionId: !!window.flowiseTableBridge?.currentSessionId
      },
      service: {
        loaded: !!window.flowiseTableService
      },
      root: {
        exists: !!document.getElementById('root'),
        hasChildren: document.getElementById('root')?.children.length > 0
      }
    };
  }

  // ========================================
  // 4️⃣ VÉRIFICATION TABLES DANS LE DOM
  // ========================================
  async function checkTables() {
    console.log('🔍 [Diagnostic] Vérification tables dans DOM...');

    const tables = [];

    // Sélecteurs multiples pour détecter les tables
    const selectors = [
      'table',
      '.claraverse-table',
      '[data-claraverse-table]',
      '[data-conso-generated]',
      '[data-table-keyword]'
    ];

    const foundElements = new Set();

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.tagName === 'TABLE' || el.querySelector('table')) {
          foundElements.add(el.tagName === 'TABLE' ? el : el.querySelector('table'));
        }
      });
    });

    foundElements.forEach(table => {
      const info = {
        keyword: table.getAttribute('data-table-keyword') || 
                 table.closest('[data-table-keyword]')?.getAttribute('data-table-keyword') ||
                 'unknown',
        position: table.getAttribute('data-table-position') || 'unknown',
        sessionId: table.getAttribute('data-session-id') || 
                   table.closest('[data-session-id]')?.getAttribute('data-session-id') ||
                   null,
        isConsoGenerated: table.hasAttribute('data-conso-generated') || 
                          table.closest('[data-conso-generated]') !== null,
        classes: Array.from(table.classList),
        visible: table.offsetParent !== null,
        rowCount: table.querySelectorAll('tr').length,
        colCount: table.querySelectorAll('th').length || 
                  (table.querySelector('tr')?.querySelectorAll('td').length || 0)
      };

      tables.push(info);
    });

    return tables;
  }

  // ========================================
  // 5️⃣ DÉTECTION CONTAMINATION
  // ========================================
  async function checkContamination(sessionInfo, tables) {
    console.log('🔍 [Diagnostic] Vérification contamination...');

    const result = {
      detected: false,
      issues: [],
      details: {}
    };

    if (!sessionInfo?.value) {
      result.issues.push('Impossible de vérifier: SessionId absent');
      return result;
    }

    const currentSessionId = sessionInfo.value;

    // Vérifier si des tables ont un sessionId différent
    const foreignTables = tables.filter(t => 
      t.sessionId && t.sessionId !== currentSessionId
    );

    if (foreignTables.length > 0) {
      result.detected = true;
      result.issues.push(`⚠️ ${foreignTables.length} table(s) d'une autre session détectée(s)`);
      result.details.foreignTables = foreignTables.map(t => ({
        keyword: t.keyword,
        foreignSessionId: t.sessionId?.substring(0, 8) + '...'
      }));
    }

    // Vérifier doublons de keyword
    const keywordCounts = {};
    tables.forEach(t => {
      keywordCounts[t.keyword] = (keywordCounts[t.keyword] || 0) + 1;
    });

    const duplicates = Object.entries(keywordCounts)
      .filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      result.detected = true;
      result.issues.push(`⚠️ ${duplicates.length} keyword(s) en doublon détecté(s)`);
      result.details.duplicates = duplicates.map(([keyword, count]) => ({
        keyword,
        count
      }));
    }

    if (!result.detected) {
      result.issues.push('✅ Aucune contamination détectée');
    }

    return result;
  }

  // ========================================
  // 6️⃣ GÉNÉRATION RECOMMANDATIONS
  // ========================================
  function generateRecommendations(results) {
    const recommendations = [];

    // Session ID
    if (results.sessionId?.status === 'absent') {
      recommendations.push({
        priority: 'high',
        title: 'Session ID manquant',
        action: 'Envoyer un message dans le chat pour initialiser la session'
      });
    }

    // IndexedDB
    if (!results.indexedDB.accessible) {
      recommendations.push({
        priority: 'high',
        title: 'IndexedDB inaccessible',
        action: 'Vérifier init-indexeddb.js chargé'
      });
    }

    if (results.indexedDB.totalTables === 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Aucune table sauvegardée',
        action: 'Générer une table (Assertion/Conclusion/CTR) pour tester'
      });
    }

    // Tables DOM
    if (results.tables.length === 0 && results.indexedDB.totalTables > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Tables en DB mais pas dans DOM',
        action: 'Appuyer F5 pour tester la restauration'
      });
    }

    // Contamination
    if (results.contamination.detected) {
      recommendations.push({
        priority: 'high',
        title: 'Contamination détectée',
        action: 'Vérifier isolation des chats - Voir détails dans section "Contamination"'
      });
    }

    // Succès
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        title: '✅ Système opérationnel',
        action: 'Tester persistance: Modifier table → F5 → Vérifier conservation'
      });
    }

    return recommendations;
  }

  // ========================================
  // 7️⃣ AFFICHAGE RÉSULTATS (MODAL)
  // ========================================
  function displayResults(results) {
    console.log('🔍 [Diagnostic] Affichage résultats:', results);

    // Créer modal si n'existe pas
    let modal = document.getElementById('diagnostic-unifie-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'diagnostic-unifie-modal';
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 9999999;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: none;
      `;
      document.body.appendChild(modal);

      // Overlay
      const overlay = document.createElement('div');
      overlay.id = 'diagnostic-unifie-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999998;
        display: none;
      `;
      overlay.onclick = () => closeModal();
      document.body.appendChild(overlay);
    }

    // Générer le HTML
    const html = generateHTML(results);
    modal.innerHTML = html;

    // Afficher
    modal.style.display = 'block';
    document.getElementById('diagnostic-unifie-overlay').style.display = 'block';
  }

  function closeModal() {
    const modal = document.getElementById('diagnostic-unifie-modal');
    const overlay = document.getElementById('diagnostic-unifie-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }

  window.closeModal = closeModal;

  // ========================================
  // GÉNÉRATION HTML
  // ========================================
  function generateHTML(results) {
    const sessionShort = results.sessionId?.value ? 
      results.sessionId.value.substring(0, 8) + '...' : 
      'N/A';

    const sessionStatus = results.sessionId?.status === 'ok' ? '✅' : '❌';
    const dbStatus = results.indexedDB.accessible ? '✅' : '❌';
    const bridgeStatus = results.dom.bridge.loaded ? '✅' : '❌';

    return `
      <div style="padding: 30px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; color: #1f2937;">
            🔍 Diagnostic Complet
          </h2>
          <button onclick="closeModal()" style="
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 600;
          ">Fermer</button>
        </div>

        <div style="font-size: 12px; color: #6b7280; margin-bottom: 20px;">
          ${results.timestamp}
        </div>

        <!-- Section 1: État Système -->
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">
            📊 État du Système
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
              <div style="font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">SESSION ID</div>
              <div style="font-size: 16px;">${sessionStatus} ${sessionShort}</div>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                ${results.sessionId?.source || 'Non trouvé'}
              </div>
            </div>

            <div>
              <div style="font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">INDEXEDDB</div>
              <div style="font-size: 16px;">${dbStatus} ${results.indexedDB.dbName || 'N/A'}</div>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                v${results.indexedDB.version || 'N/A'} - ${results.indexedDB.totalTables} table(s)
              </div>
            </div>

            <div>
              <div style="font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">BRIDGE</div>
              <div style="font-size: 16px;">${bridgeStatus} ${results.dom.bridge.loaded ? 'Chargé' : 'Absent'}</div>
            </div>

            <div>
              <div style="font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">TABLES DOM</div>
              <div style="font-size: 16px;">📋 ${results.tables.length} table(s)</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Tables dans IndexedDB -->
        ${generateIndexedDBSection(results)}

        <!-- Section 3: Tables dans le DOM -->
        ${generateDOMTablesSection(results)}

        <!-- Section 4: Contamination -->
        ${generateContaminationSection(results)}

        <!-- Section 5: Recommandations -->
        ${generateRecommendationsSection(results)}
      </div>
    `;
  }

  function generateIndexedDBSection(results) {
    if (!results.indexedDB.accessible) {
      return `
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #991b1b;">
            ❌ IndexedDB Inaccessible
          </h3>
          <div style="color: #7f1d1d;">
            ${results.indexedDB.errors.join('<br>')}
          </div>
        </div>
      `;
    }

    if (results.indexedDB.totalTables === 0) {
      return `
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #92400e;">
            ⚠️ Aucune Table Sauvegardée
          </h3>
          <div style="color: #78350f;">
            La base de données est vide. Générez une table pour tester la sauvegarde.
          </div>
        </div>
      `;
    }

    let html = `
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #065f46;">
          💾 Tables dans IndexedDB (${results.indexedDB.totalTables})
        </h3>
    `;

    const sessions = Object.entries(results.indexedDB.tablesBySession);
    const currentSessionId = results.sessionId?.value;

    sessions.forEach(([sessionId, tables]) => {
      const isCurrent = sessionId === currentSessionId;
      const sessionShort = sessionId === 'unknown' ? 'unknown' : sessionId.substring(0, 8) + '...';

      html += `
        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; ${isCurrent ? 'border: 2px solid #10b981;' : ''}">
          <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
            📌 ${sessionShort} ${isCurrent ? '(Session actuelle)' : ''}
          </div>
          <div style="font-size: 13px; color: #6b7280;">
            ${tables.length} table(s):
          </div>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #374151;">
            ${tables.map(t => `
              <li style="margin-bottom: 4px;">
                <strong>${t.keyword}</strong>
                ${t.timestamp ? `<span style="color: #9ca3af; font-size: 11px;"> - ${new Date(t.timestamp).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  function generateDOMTablesSection(results) {
    if (results.tables.length === 0) {
      return `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #374151;">
            📋 Tables dans le DOM (0)
          </h3>
          <div style="color: #6b7280;">
            Aucune table détectée dans le DOM.
          </div>
        </div>
      `;
    }

    let html = `
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1e40af;">
          📋 Tables dans le DOM (${results.tables.length})
        </h3>
    `;

    results.tables.forEach((table, index) => {
      html += `
        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
            Table ${index + 1}: ${table.keyword}
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
            <div>
              <span style="color: #6b7280;">Position:</span> 
              <span style="font-weight: 500;">${table.position}</span>
            </div>
            <div>
              <span style="color: #6b7280;">Visible:</span> 
              <span style="font-weight: 500;">${table.visible ? '✅ Oui' : '❌ Non'}</span>
            </div>
            <div>
              <span style="color: #6b7280;">Dimensions:</span> 
              <span style="font-weight: 500;">${table.rowCount} lignes × ${table.colCount} colonnes</span>
            </div>
            <div>
              <span style="color: #6b7280;">Auto-générée:</span> 
              <span style="font-weight: 500;">${table.isConsoGenerated ? '✅ Oui' : '❌ Non'}</span>
            </div>
            ${table.sessionId ? `
              <div style="grid-column: 1 / -1;">
                <span style="color: #6b7280;">SessionId:</span> 
                <span style="font-weight: 500; font-family: monospace; font-size: 11px;">${table.sessionId.substring(0, 8)}...</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  function generateContaminationSection(results) {
    if (!results.contamination.detected) {
      return `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #065f46;">
            ✅ Aucune Contamination
          </h3>
          <div style="color: #047857;">
            Toutes les tables appartiennent à la session actuelle. Isolation correcte.
          </div>
        </div>
      `;
    }

    let html = `
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #991b1b;">
          ⚠️ Contamination Détectée
        </h3>
    `;

    results.contamination.issues.forEach(issue => {
      html += `<div style="color: #7f1d1d; margin-bottom: 8px;">${issue}</div>`;
    });

    if (results.contamination.details.foreignTables) {
      html += `
        <div style="margin-top: 15px; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Tables étrangères:</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${results.contamination.details.foreignTables.map(t => `
              <li>${t.keyword} (session: ${t.foreignSessionId})</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    if (results.contamination.details.duplicates) {
      html += `
        <div style="margin-top: 10px; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Keywords en doublon:</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${results.contamination.details.duplicates.map(d => `
              <li>${d.keyword} (×${d.count})</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  function generateRecommendationsSection(results) {
    if (results.recommendations.length === 0) return '';

    let html = `
      <div style="background: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #854d0e;">
          💡 Recommandations
        </h3>
    `;

    results.recommendations.forEach((rec, index) => {
      const priorityColors = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#10b981'
      };

      html += `
        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${priorityColors[rec.priority]};">
          <div style="font-weight: 600; margin-bottom: 6px; color: #374151;">
            ${index + 1}. ${rec.title}
          </div>
          <div style="font-size: 13px; color: #6b7280;">
            ${rec.action}
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  console.log('✅ [Diagnostic Unifié] Fonction window.diagnosticUnifie chargée');

})();
