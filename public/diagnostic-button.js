/**
 * 🔍 BOUTON DE DIAGNOSTIC PERSISTANCE
 * Injecte un bouton flottant dans l'interface pour diagnostiquer les problèmes de sauvegarde
 */

(function() {
  'use strict';
  
  console.log("🔍 [Diagnostic Button] Initialisation...");
  
  // ⚡ Stratégie agressive : Vérifier toutes les secondes et recréer si disparu
  setInterval(() => {
    const existingBtn = document.getElementById('claraverse-diagnostic-btn');
    if (!existingBtn || !document.body.contains(existingBtn)) {
      console.log("⚠️ [Diagnostic Button] Bouton disparu, recréation...");
      init();
    }
  }, 1000);
  
  // Création initiale après 500ms
  setTimeout(() => {
    console.log("🔍 [Diagnostic Button] Création initiale...");
    init();
  }, 500);
  
  function init() {
    console.log("🔍 [Diagnostic Button] Création du bouton...");
    
    // ⚡ SUPPRIMER TOUS LES AUTRES BOUTONS DE DIAGNOSTIC
    document.querySelectorAll('button').forEach(btn => {
      if (btn.id === 'claraverse-diagnostic-btn') return; // Garder le nôtre
      
      const title = btn.title || '';
      const text = btn.textContent || '';
      const html = btn.innerHTML || '';
      
      // Si c'est un bouton de diagnostic (contient 🔍 ou "diagnostic")
      if (html.includes('🔍') || title.toLowerCase().includes('diagnostic') || btn.id === 'diagnostic-button') {
        console.log("🗑️ [Diagnostic Button] Suppression bouton concurrent:", btn.id || 'sans-id');
        btn.remove();
      }
    });
    
    // Vérifier si notre bouton existe déjà
    if (document.getElementById('claraverse-diagnostic-btn')) {
      console.log("✅ [Diagnostic Button] Bouton déjà présent");
      return;
    }
    
    // ==========================================
    // 1. CRÉER LE BOUTON FLOTTANT
    // ==========================================
    
    const button = document.createElement('button');
    button.id = 'claraverse-diagnostic-btn';
    button.innerHTML = '🔍';
    button.title = 'Diagnostic Persistance';
    
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '3px solid white', // Bordure blanche pour le rendre visible
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: '99999', // ⚡ TRÈS ÉLEVÉ pour être au-dessus de tout
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });
    
    button.addEventListener('click', openDiagnosticPanel);
    
    document.body.appendChild(button);
    console.log("✅ [Diagnostic Button] Bouton ajouté");
    
    // ==========================================
    // 2. CRÉER LE PANNEAU DE DIAGNOSTIC
    // ==========================================
    
    function openDiagnosticPanel() {
      // Vérifier si le panneau existe déjà
      let panel = document.getElementById('claraverse-diagnostic-panel');
      
      if (panel) {
        // Basculer la visibilité
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        return;
      }
      
      // Créer le panneau
      panel = document.createElement('div');
      panel.id = 'claraverse-diagnostic-panel';
      
      Object.assign(panel.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: '99998', // ⚡ Juste en dessous du bouton
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      });
      
      panel.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 20px;">🔍 Diagnostic Persistance ClaraVerse</h2>
          <button id="close-diagnostic" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
        </div>
        
        <div style="padding: 20px; display: flex; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0;">
          <button class="diag-btn" data-action="full" style="flex: 1; min-width: 150px; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🚀 Diagnostic Complet
          </button>
          <button class="diag-btn" data-action="test-phase-1" style="flex: 1; min-width: 150px; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🧪 Test Phase 1
          </button>
          <button class="diag-btn" data-action="test-phase-2" style="flex: 1; min-width: 150px; padding: 12px; background: #06b6d4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🧪 Test Phase 2
          </button>
          <button class="diag-btn" data-action="test-save" style="flex: 1; min-width: 150px; padding: 12px; background: #9333ea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🧪 Test Sauvegarde
          </button>
          <button class="diag-btn" data-action="session" style="flex: 1; min-width: 150px; padding: 12px; background: #48bb78; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🔑 Session ID
          </button>
          <button class="diag-btn" data-action="storage" style="flex: 1; min-width: 150px; padding: 12px; background: #ed8936; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            💾 Storage
          </button>
          <button class="diag-btn" data-action="clear" style="flex: 1; min-width: 150px; padding: 12px; background: #f56565; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🗑️ Effacer
          </button>
        </div>
        
        <div id="diagnostic-results" style="flex: 1; overflow-y: auto; padding: 20px;">
          <div style="text-align: center; color: #a0aec0; padding: 40px;">
            <h3>👆 Cliquez sur un bouton pour démarrer le diagnostic</h3>
          </div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Event listeners
      document.getElementById('close-diagnostic').addEventListener('click', () => {
        panel.style.display = 'none';
      });
      
      document.querySelectorAll('.diag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          handleDiagnosticAction(action);
        });
      });
      
      // Fermer en cliquant en dehors
      panel.addEventListener('click', (e) => {
        if (e.target === panel) {
          panel.style.display = 'none';
        }
      });
    }
    
    // ==========================================
    // 3. ACTIONS DE DIAGNOSTIC
    // ==========================================
    
    function handleDiagnosticAction(action) {
      const resultsDiv = document.getElementById('diagnostic-results');
      
      switch(action) {
        case 'full':
          resultsDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div style="border: 3px solid #667eea; border-top: 3px solid transparent; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div></div>';
          setTimeout(() => {
            resultsDiv.innerHTML = generateFullDiagnostic();
            
            // NOUVEAU: Lancer aussi le diagnostic détaillé dans la console
            if (window.runPersistenceDiagnostic) {
              console.log("\n🔍 Lancement diagnostic détaillé dans la console...\n");
              window.runPersistenceDiagnostic();
            }
          }, 300);
          break;
          
        case 'test-phase-1':
          resultsDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div style="border: 3px solid #10b981; border-top: 3px solid transparent; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div><p style="margin-top: 15px; color: #4a5568;">Exécution Test Phase 1...</p></div>';
          
          if (!window.testPhase1) {
            resultsDiv.innerHTML = '<div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;"><strong>❌ Test Phase 1 non chargé</strong><br><p style="margin: 10px 0;">Rechargez la page.</p></div>';
            return;
          }
          
          window.testPhase1().then(results => {
            resultsDiv.innerHTML = window.formatPhase1Results(results);
          }).catch(error => {
            resultsDiv.innerHTML = `<div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;"><strong>❌ Erreur</strong><br><p style="margin: 10px 0; font-family: monospace; font-size: 12px;">${error.message}</p></div>`;
          });
          break;
          
        case 'test-phase-2':
          resultsDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div style="border: 3px solid #06b6d4; border-top: 3px solid transparent; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div><p style="margin-top: 15px; color: #4a5568;">Exécution Test Phase 2...</p></div>';
          
          if (!window.testPhase2) {
            resultsDiv.innerHTML = '<div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;"><strong>❌ Test Phase 2 non chargé</strong><br><p style="margin: 10px 0;">Rechargez la page.</p></div>';
            return;
          }
          
          window.testPhase2().then(results => {
            resultsDiv.innerHTML = window.formatPhase2Results(results);
          }).catch(error => {
            resultsDiv.innerHTML = `<div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;"><strong>❌ Erreur</strong><br><p style="margin: 10px 0; font-family: monospace; font-size: 12px;">${error.message}</p></div>`;
          });
          break;
          
        case 'test-save':
          resultsDiv.innerHTML = testManualSave();
          break;
          
        case 'session':
          resultsDiv.innerHTML = generateSessionDiagnostic();
          break;
          
        case 'storage':
          resultsDiv.innerHTML = generateStorageDiagnostic();
          break;
          
        case 'clear':
          if (confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUTES les données de tables ?\n\nCette action est irréversible !')) {
            clearAllData();
            resultsDiv.innerHTML = '<div style="padding: 20px; background: #c6f6d5; color: #22543d; border-radius: 8px; text-align: center;"><strong>✅ Données effacées</strong><br>Toutes les clés localStorage ont été supprimées.</div>';
          }
          break;
      }
    }
    
    function testManualSave() {
      console.log("\n" + "=".repeat(80));
      console.log("🧪 TEST MANUEL DE SAUVEGARDE");
      console.log("=".repeat(80));
      
      const tables = document.querySelectorAll('table');
      
      if (tables.length === 0) {
        console.log("❌ Aucune table trouvée dans le DOM");
        return `
          <div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;">
            <strong>❌ Aucune table trouvée</strong><br>
            <p style="margin: 10px 0;">Créez d'abord une table dans le chat, puis réessayez.</p>
          </div>
        `;
      }
      
      if (!window.claraverseProcessor) {
        console.log("❌ conso.js non chargé");
        return `
          <div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;">
            <strong>❌ conso.js non chargé</strong><br>
            <p style="margin: 10px 0;">Rechargez la page et réessayez.</p>
          </div>
        `;
      }
      
      const firstTable = tables[0];
      const keyword = firstTable.dataset.keyword || 'Sans_Keyword';
      
      console.log(`\n📊 Test sur première table:`);
      console.log(`   Keyword: ${keyword}`);
      console.log(`   Lignes: ${firstTable.querySelectorAll('tr').length}`);
      console.log(`   Observer installé: ${firstTable.dataset.observerInstalled || 'non'}`);
      
      try {
        console.log(`\n⏳ Appel de saveTableDataNow()...`);
        window.claraverseProcessor.saveTableDataNow(firstTable);
        console.log(`✅ Appel réussi`);
        console.log(`\n💡 Vérifiez les logs ci-dessus pour voir si la sauvegarde a fonctionné`);
        console.log(`   Cherchez:`);
        console.log(`   - "💾 [INLINE] Interception sauvegarde table"`);
        console.log(`   - "🔑 [INLINE] Keyword: xxx"`);
        console.log(`   - "✅ [INLINE] Événement émis pour: xxx"`);
        console.log(`   - "💾 [Bridge] Handling save request for: xxx"`);
        console.log(`   - "✅ Table saved successfully: xxx"`);
        console.log("=".repeat(80) + "\n");
        
        // Vérifier IndexedDB après 1 seconde
        setTimeout(() => {
          if (window.flowiseTableService) {
            window.flowiseTableService.getAllTables().then(allTables => {
              const sessionId = detectSession().id;
              const sessionTables = allTables.filter(t => t.sessionId === sessionId);
              
              console.log(`\n📊 VÉRIFICATION INDEXEDDB:`);
              console.log(`   Tables dans cette session: ${sessionTables.length}`);
              if (sessionTables.length > 0) {
                console.log(`   ✅ Tables sauvegardées:`);
                sessionTables.forEach(t => {
                  console.log(`     - ${t.keyword} (${new Date(t.timestamp).toLocaleTimeString()})`);
                });
              } else {
                console.log(`   ❌ Aucune table sauvegardée`);
                console.log(`   💡 La sauvegarde a probablement échoué, vérifiez les logs ci-dessus`);
              }
            });
          }
        }, 1000);
        
        return `
          <div style="padding: 20px;">
            <div style="background: #c6f6d5; color: #22543d; border-radius: 8px; padding: 15px; margin-bottom: 15px; text-align: center;">
              <strong>✅ Sauvegarde déclenchée</strong><br>
              <small>Table: ${keyword}</small>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <h4 style="margin: 0 0 10px 0; color: #2d3748;">📋 Instructions</h4>
              <ol style="margin: 0; padding-left: 20px; color: #4a5568;">
                <li>Ouvrez la Console (F12)</li>
                <li>Cherchez les logs du test de sauvegarde</li>
                <li>Vérifiez si vous voyez "✅ Table saved successfully"</li>
                <li>Vérifiez la section "📊 VÉRIFICATION INDEXEDDB"</li>
              </ol>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #edf2f7; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #2d3748;">🔍 Logs à Chercher</h4>
              <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-family: monospace; font-size: 12px;">
                <li>💾 [INLINE] Interception sauvegarde table</li>
                <li>🔑 [INLINE] Keyword: ${keyword}</li>
                <li>📍 [INLINE] SessionId: xxx</li>
                <li>✅ [INLINE] Événement émis pour: ${keyword}</li>
                <li>💾 [Bridge] Handling save request for: ${keyword}</li>
                <li>✅ Table saved successfully: xxx</li>
              </ul>
            </div>
          </div>
        `;
      } catch (error) {
        console.error("❌ Erreur lors du test:", error);
        return `
          <div style="padding: 20px; background: #fed7d7; color: #742a2a; border-radius: 8px; text-align: center;">
            <strong>❌ Erreur lors du test</strong><br>
            <p style="margin: 10px 0; font-family: monospace; font-size: 12px;">${error.message}</p>
          </div>
        `;
      }
    }
    
    function generateFullDiagnostic() {
      return `
        ${generateSessionDiagnostic()}
        <div style="height: 2px; background: #e2e8f0; margin: 30px 0;"></div>
        ${generateStorageDiagnostic()}
        <div style="height: 2px; background: #e2e8f0; margin: 30px 0;"></div>
        ${generateTablesDiagnostic()}
        <div style="height: 2px; background: #e2e8f0; margin: 30px 0;"></div>
        ${generateConsoDiagnostic()}
      `;
    }
    
    function generateSessionDiagnostic() {
      const session = detectSession();
      const statusColor = session.found ? '#c6f6d5' : '#fed7d7';
      const statusTextColor = session.found ? '#22543d' : '#742a2a';
      const statusText = session.found ? 'Session Détectée ✓' : 'Session Non Détectée ✗';
      
      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">🔑 Détection du Session ID</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Statut</div>
              <div style="background: ${statusColor}; color: ${statusTextColor}; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${statusText}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Session ID</div>
              <div style="font-size: 14px; color: #2d3748; word-break: break-all;">${session.id || 'Non trouvé'}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Source</div>
              <div style="font-size: 14px; color: #2d3748;">${session.source || 'N/A'}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Clé Storage</div>
              <div style="font-size: 14px; color: #2d3748; word-break: break-all;">${session.storageKey}</div>
            </div>
          </div>
          ${!session.found ? `
            <div style="margin-top: 15px; padding: 15px; background: #fed7d7; border-left: 4px solid #f56565; border-radius: 8px;">
              <strong style="color: #742a2a;">⚠️ Problème Détecté</strong>
              <p style="color: #742a2a; margin: 5px 0 0 0;">Le sessionId n'est pas trouvé dans le DOM. Vérifiez que React ajoute l'attribut <code>[data-session-id]</code> sur un élément.</p>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    function generateStorageDiagnostic() {
      const storage = inspectStorage();
      
      let keysHtml = '';
      if (storage.keys.length === 0) {
        keysHtml = '<p style="color: #a0aec0;">Aucune clé de table trouvée dans localStorage</p>';
      } else {
        storage.keys.forEach(key => {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const tableCount = Object.keys(data).length;
          keysHtml += `
            <div style="background: white; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
              <strong style="color: #2d3748;">${key}</strong><br>
              <small style="color: #718096;">${tableCount} table(s) | Taille: ${storage.sizes[key] || 0} Ko</small>
            </div>
          `;
        });
      }
      
      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">💾 Inspection localStorage</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Nombre de Clés</div>
              <div style="font-size: 18px; color: #2d3748; font-weight: 600;">${storage.keys.length}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Taille Totale</div>
              <div style="font-size: 18px; color: #2d3748; font-weight: 600;">${storage.totalSize} Ko</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Quota Utilisé</div>
              <div style="font-size: 18px; color: #2d3748; font-weight: 600;">${storage.quotaPercent}%</div>
            </div>
          </div>
          <h4 style="margin: 15px 0 10px 0; color: #2d3748;">Clés Trouvées:</h4>
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
            ${keysHtml}
          </div>
        </div>
      `;
    }
    
    function generateTablesDiagnostic() {
      const tables = findAllTables();
      
      let tablesHtml = '';
      if (tables.length === 0) {
        tablesHtml = '<p style="color: #a0aec0;">Aucune table trouvée dans le DOM</p>';
      } else {
        tables.forEach((table, index) => {
          const headers = getTableHeaders(table);
          const rowCount = table.querySelectorAll('tr').length - 1;
          tablesHtml += `
            <div style="background: white; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
              <strong style="color: #2d3748;">Table ${index + 1}</strong><br>
              <small style="color: #718096;">
                ID: ${table.dataset.tableId || 'Non assigné'}<br>
                En-têtes: ${headers.join(', ')}<br>
                Lignes: ${rowCount}
              </small>
            </div>
          `;
        });
      }
      
      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">📊 Tables dans le DOM</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Nombre de Tables</div>
              <div style="font-size: 18px; color: #2d3748; font-weight: 600;">${tables.length}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Tables avec ID</div>
              <div style="font-size: 18px; color: #2d3748; font-weight: 600;">${tables.filter(t => t.dataset.tableId).length}</div>
            </div>
          </div>
          <h4 style="margin: 15px 0 10px 0; color: #2d3748;">Liste des Tables:</h4>
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
            ${tablesHtml}
          </div>
        </div>
      `;
    }
    
    function generateConsoDiagnostic() {
      const processor = window.claraverseProcessor;
      const hasProcessor = !!processor;
      const statusColor = hasProcessor ? '#c6f6d5' : '#fed7d7';
      const statusTextColor = hasProcessor ? '#22543d' : '#742a2a';
      const statusText = hasProcessor ? 'OUI ✓' : 'NON ✗';
      
      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">⚙️ Configuration conso.js</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Script Chargé</div>
              <div style="background: ${statusColor}; color: ${statusTextColor}; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${statusText}</div>
            </div>
            ${hasProcessor ? `
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">SessionId dans Processor</div>
              <div style="font-size: 14px; color: #2d3748; word-break: break-all;">${processor.currentSessionId || 'null'}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Storage Key</div>
              <div style="font-size: 14px; color: #2d3748; word-break: break-all;">${processor.getStorageKey ? processor.getStorageKey() : 'N/A'}</div>
            </div>
            ` : ''}
          </div>
          ${!hasProcessor ? `
            <div style="margin-top: 15px; padding: 15px; background: #fed7d7; border-left: 4px solid #f56565; border-radius: 8px;">
              <strong style="color: #742a2a;">⚠️ Erreur Critique</strong>
              <p style="color: #742a2a; margin: 5px 0 0 0;">Le script conso.js n'est pas chargé. Vérifiez la balise <code>&lt;script src="/conso.js"&gt;</code> dans index.html.</p>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // ==========================================
    // 4. FONCTIONS UTILITAIRES
    // ==========================================
    
    function detectSession() {
      // Stratégie 1: attributs data
      let sessionElement = document.querySelector('[data-session-id]');
      if (sessionElement && sessionElement.dataset.sessionId) {
        return {
          found: true,
          id: sessionElement.dataset.sessionId,
          source: 'data-session-id',
          storageKey: `claraverse_tables_data_${sessionElement.dataset.sessionId}`
        };
      }
      
      sessionElement = document.querySelector('[data-chat-session-id]');
      if (sessionElement && sessionElement.dataset.chatSessionId) {
        return {
          found: true,
          id: sessionElement.dataset.chatSessionId,
          source: 'data-chat-session-id',
          storageKey: `claraverse_tables_data_${sessionElement.dataset.chatSessionId}`
        };
      }
      
      // Stratégie 2: URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlSessionId = urlParams.get('sessionId') || urlParams.get('chatId');
      if (urlSessionId) {
        return {
          found: true,
          id: urlSessionId,
          source: 'URL parameter',
          storageKey: `claraverse_tables_data_${urlSessionId}`
        };
      }
      
      return {
        found: false,
        id: null,
        source: null,
        storageKey: 'claraverse_tables_data_unsaved'
      };
    }
    
    function inspectStorage() {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('claraverse_tables_data'));
      const sizes = {};
      let totalSize = 0;
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size / 1024;
        sizes[key] = size.toFixed(2);
        totalSize += size;
      });
      
      const estimatedQuota = 5000;
      const quotaPercent = ((totalSize / estimatedQuota) * 100).toFixed(2);
      
      return {
        keys,
        sizes,
        totalSize: totalSize.toFixed(2),
        quotaPercent
      };
    }
    
    function findAllTables() {
      const selectors = [
        'table.min-w-full',
        'div.prose table',
        'table'
      ];
      
      let allTables = [];
      selectors.forEach(selector => {
        try {
          const tables = document.querySelectorAll(selector);
          allTables = [...allTables, ...Array.from(tables)];
        } catch (e) {}
      });
      
      return [...new Set(allTables)];
    }
    
    function getTableHeaders(table) {
      const headers = [];
      const headerCells = table.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim() || '[vide]');
      });
      return headers;
    }
    
    function clearAllData() {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('claraverse_tables_data'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`✅ [Diagnostic] ${keys.length} clé(s) effacée(s)`);
    }
  }
  
  // Style pour l'animation de rotation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
})();

console.log("✅ [Diagnostic Button] Chargement complet avec boutons Phase 1/2");
console.log("🔍 [Diagnostic Button] Bouton visible dans 0.5s");
