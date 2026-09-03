/**
 * 🔧 INITIALISATION INDEXEDDB
 * Garantit que la DB FloTableDB existe avec le bon schema
 */

(function() {
  'use strict';
  
  console.log("🔧 [Init IndexedDB] Démarrage...");
  
  const DB_NAME = 'FloTableDB';
  const DB_VERSION = 2; // Incrémenter pour forcer upgrade
  const STORE_NAME = 'generatedTables';
  
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      console.log(`🔧 [Init IndexedDB] Ouverture ${DB_NAME} version ${DB_VERSION}...`);
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('❌ [Init IndexedDB] Erreur ouverture:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`✅ [Init IndexedDB] DB ouverte, version ${db.version}`);
        console.log(`📦 [Init IndexedDB] Object stores:`, Array.from(db.objectStoreNames));
        
        // Vérifier que generatedTables existe
        if (db.objectStoreNames.contains(STORE_NAME)) {
          console.log(`✅ [Init IndexedDB] Object store "${STORE_NAME}" présent`);
        } else {
          console.warn(`⚠️ [Init IndexedDB] Object store "${STORE_NAME}" MANQUANT`);
        }
        
        db.close();
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        
        console.log(`🔄 [Init IndexedDB] Upgrade ${oldVersion} → ${newVersion}`);
        
        // Créer object store si absent
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log(`➕ [Init IndexedDB] Création object store "${STORE_NAME}"...`);
          
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id' 
          });
          
          // Créer index pour sessionId (recherche rapide)
          objectStore.createIndex('sessionId', 'sessionId', { unique: false });
          
          // Créer index pour keyword (recherche rapide)
          objectStore.createIndex('keyword', 'keyword', { unique: false });
          
          // Créer index composite sessionId+keyword
          objectStore.createIndex('sessionId_keyword', ['sessionId', 'keyword'], { unique: false });
          
          console.log(`✅ [Init IndexedDB] Object store "${STORE_NAME}" créé avec index`);
        } else {
          console.log(`ℹ️ [Init IndexedDB] Object store "${STORE_NAME}" existe déjà`);
        }
      };
    });
  }
  
  // Initialiser dès que le script se charge
  initIndexedDB()
    .then(() => {
      console.log("✅ [Init IndexedDB] Initialisation terminée");
      
      // Exposer fonction de réinitialisation globale
      window.reinitIndexedDB = async function() {
        console.log("🔄 [Init IndexedDB] Réinitialisation demandée...");
        
        // Supprimer DB existante
        return new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
          
          deleteRequest.onsuccess = () => {
            console.log(`✅ [Init IndexedDB] DB "${DB_NAME}" supprimée`);
            
            // Recréer
            initIndexedDB().then(resolve).catch(reject);
          };
          
          deleteRequest.onerror = (event) => {
            console.error('❌ [Init IndexedDB] Erreur suppression:', event.target.error);
            reject(event.target.error);
          };
          
          deleteRequest.onblocked = () => {
            console.warn('⚠️ [Init IndexedDB] Suppression bloquée (connexions ouvertes)');
            alert('Fermez tous les onglets de cette application puis réessayez');
            reject(new Error('Delete blocked'));
          };
        });
      };
      
      console.log("💡 [Init IndexedDB] Commande disponible: window.reinitIndexedDB()");
    })
    .catch((error) => {
      console.error("❌ [Init IndexedDB] Échec initialisation:", error);
    });
  
})();
