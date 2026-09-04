/**
 * SCRIPT DE NETTOYAGE INDEXEDDB
 * ==============================
 * 
 * Objectif: Supprimer toutes les données IndexedDB pour résoudre l'incompatibilité
 *          entre anciens keywords (hash/UUID) et nouveaux keywords (timestamp)
 * 
 * Utilisation:
 * 1. Ouvrir la console F12
 * 2. Copier-coller ce script complet
 * 3. Appuyer sur Entrée
 * 4. Recharger la page (F5)
 * 
 * Fichier: public/clean-indexeddb.js
 * Date: 29 août 2026
 */

(function cleanIndexedDB() {
    console.log('🧹 [CLEAN] Démarrage nettoyage IndexedDB...');
    
    const dbName = 'FloTableDB';
    
    // Étape 1: Supprimer complètement la base de données
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = function() {
        console.log('✅ [CLEAN] Base de données supprimée avec succès');
        console.log('🔄 [CLEAN] Rechargement de la page dans 2 secondes...');
        
        // Recharger automatiquement après 2 secondes
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    };
    
    deleteRequest.onerror = function(event) {
        console.error('❌ [CLEAN] Erreur lors de la suppression:', event);
        console.log('⚠️ [CLEAN] Veuillez fermer tous les onglets de cette application et réessayer');
    };
    
    deleteRequest.onblocked = function() {
        console.warn('⚠️ [CLEAN] Suppression bloquée - Fermez tous les autres onglets de cette application');
        alert('⚠️ Suppression bloquée\n\nVeuillez:\n1. Fermer tous les autres onglets de cette application\n2. Réessayer le nettoyage');
    };
    
    console.log('⏳ [CLEAN] Suppression en cours...');
})();
