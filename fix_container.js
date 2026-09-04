// CORRECTION: Remplacer lignes 1529-1538 dans flowiseTableBridge.ts

// ANCIEN CODE (MAUVAIS):
/*
        const messagesContainer = document.querySelector('.messages-container') 
                                || document.querySelector('.markdown-content')
                                || document.querySelector('#chat-messages')
                                || document.body;
        
        console.log(`📍 [Conteneur] Trouvé: ${messagesContainer.className || messagesContainer.tagName}`);
*/

// NOUVEAU CODE (BON):
        let messagesContainer = null;
        
        // 1. Conteneur Clara identifié via DevTools
        messagesContainer = document.querySelector('.flex-1.overflow-y-auto');
        
        if (messagesContainer) {
          console.log('📍 [Conteneur] Trouvé: flex-1 overflow-y-auto (conteneur principal Clara)');
        } else {
          // 2. Fallback: Chercher parent table existante
          const anyTable = document.querySelector('table[data-keyword]');
          if (anyTable) {
            let parent = anyTable.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                messagesContainer = parent;
                console.log(`📍 [Conteneur] Via table: ${parent.className || parent.tagName}`);
                break;
              }
              parent = parent.parentElement;
            }
          }
        }
        
        // 3. Fallback: max-w-4xl
        if (!messagesContainer) {
          messagesContainer = document.querySelector('.max-w-4xl.mx-auto');
          if (messagesContainer) {
            console.log('📍 [Conteneur] Fallback: max-w-4xl mx-auto');
          }
        }
        
        // 4. Dernier recours
        if (!messagesContainer) {
          console.warn('⚠️ [Conteneur] ATTENTION: Utilisation document.body (TABLES HORS ZONE VISIBLE)');
          messagesContainer = document.body;
        }
