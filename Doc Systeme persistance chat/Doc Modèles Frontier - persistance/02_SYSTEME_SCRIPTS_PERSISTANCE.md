# 🔧 SYSTÈME DE SCRIPTS - PERSISTANCE TABLES CLARAVERSE

**Date** : 2 Septembre 2026  
**Objectif** : Documentation technique exhaustive des 6 fichiers critiques  
**Mise à jour** : Intégration découverte root cause (ClaraAssistant.tsx)

---

## 📂 ARCHITECTURE FICHIERS CLÉS

```
Claraverse/
├── index.html                              [🟡 Config + Script inline interception]
├── public/
│   └── conso.js                            [🟢 Génération tables + Événements]
└── src/
    ├── services/
    │   ├── flowiseTableBridge.ts          [🔴 CRITIQUE - Orchestrateur]
    │   └── flowiseTableService.ts         [🔴 CRITIQUE - IndexedDB]
    └── components/
        └── ClaraAssistant.tsx             [🚨 PROBLÈME - Restauration manquante]
```

**Légende** :
- 🔴 CRITIQUE : Fichier central au problème
- 🟡 IMPORTANT : Configuration essentielle
- 🟢 SECONDAIRE : Fonctionne mais à documenter
- 🚨 PROBLÈME : Root cause identifiée

---

# 🔴 FICHIER #1 : src/services/flowiseTableBridge.ts

**Score importance** : 10/10 - **ABSOLUMENT CRITIQUE**

## Rôle Global

**Orchestrateur central** du système de persistance :
- Écoute événements de sauvegarde émis par conso.js
- Gère sauvegarde tables vers IndexedDB
- Gère restauration tables après F5
- Implémente isolation inter-sessions (sessionId filtering)
- Maintient timeline chronologique

**Taille** : ~2500 lignes TypeScript

---

## Architecture Interne

```typescript
class FlowiseTableBridge {
  // État
  private currentSessionId: string | null = null;
  private sessionInitialized: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  
  // Services dépendants
  private flowiseTableService: FlowiseTableService;
  private flowiseTimelineService: FlowiseTimelineService;
  
  // Méthodes publiques
  public initialize(): void
  public restoreTablesChronologically(messages: any[]): Promise<number>
  public getCurrentSessionId(): string | null
  
  // Méthodes privées (sauvegarde)
  private handleTableIntegrated(detail: FlowiseTableIntegratedDetail): Promise<void>
  private handleTableSaveRequest(event: Event): void
  private detectSessionId(): string | null
  
  // Méthodes privées (restauration)
  private restoreTableFromTimeline(item: TimelineItem): Promise<void>
  private injectTableIntoDOM(table: FlowiseGeneratedTableRecord): void
}
```

---

## Méthodes Critiques - SAUVEGARDE

### 1. `handleTableIntegrated()` - Ligne ~695

**Déclencheur** : Événement `flowise:table:integrated` (émis par script inline index.html)

**Fonction** : Point d'entrée unique pour sauvegarder une table générée

**Code simplifié** :
```typescript
private async handleTableIntegrated(detail: FlowiseTableIntegratedDetail): Promise<void> {
  console.log('💾 [Bridge] Handling table integrated:', detail.keyword);
  
  // 1. Vérification session active
  if (!this.currentSessionId) {
    console.error('❌ No active session, cannot save table');
    return;
  }
  
  // 2. Extraction données
  const { table: tableElement, keyword, source, messageId } = detail;
  
  // 3. Validation table
  if (!tableElement || !(tableElement instanceof HTMLTableElement)) {
    console.error('❌ Invalid table element');
    return;
  }
  
  // 4. Génération timestamp
  const timestamp = detail.timestamp || Date.now();
  
  // 5. Appel service sauvegarde
  try {
    const tableId = await flowiseTableService.saveGeneratedTable(
      this.currentSessionId,  // 🔑 SessionId CRUCIAL
      tableElement,
      keyword,
      source,
      messageId
    );
    
    if (tableId) {
      console.log(`✅ Table saved successfully: ${tableId} (keyword: "${keyword}")`);
      
      // 6. Émission événement confirmation
      this.emitTableSaved(tableId, this.currentSessionId, keyword);
    }
  } catch (error) {
    console.error('❌ Error in handleTableIntegrated:', error);
  }
}
```

**Logs attendus** (si fonctionne) :
```
💾 [Bridge] Handling table integrated: "Programme Travail"
✅ Table saved successfully: table-1693756800-abc123 (keyword: "Programme Travail")
```

**Logs absents si problème** :
- ❌ Pas de `💾 [Bridge] Handling` → Événement jamais reçu
- ❌ `❌ No active session` → sessionId undefined
- ❌ `❌ Invalid table element` → Élément corrompu

**Dépendances** :
- ✅ `this.currentSessionId` DOIT être défini (sinon échec)
- ✅ `tableElement` DOIT être HTMLTableElement valide
- ✅ `flowiseTableService.saveGeneratedTable()` ne doit pas throw

**Points de défaillance potentiels** :
1. **Événement pas écouté** : Listener pas ajouté dans initialize()
2. **SessionId undefined** : detectSessionId() échoue
3. **Erreur silencieuse** : Try-catch avale exception sans log
4. **TableElement invalide** : Passage par value corrompt élément

---

### 2. `detectSessionId()` - Ligne ~450

**Fonction** : Détecte sessionId depuis DOM React pour isolation

**Code** :
```typescript
private detectSessionId(): string | null {
  // Méthode 1: Attribut data-session-id
  const sessionElement = document.querySelector('[data-session-id]');
  if (sessionElement) {
    const id = sessionElement.getAttribute('data-session-id');
    if (id && id !== 'undefined' && id !== 'null') {
      console.log(`📍 SessionId détecté (méthode 1): ${id.substring(0, 30)}...`);
      return id;
    }
  }
  
  // Méthode 2: Attribut data-chat-session-id
  const chatElement = document.querySelector('[data-chat-session-id]');
  if (chatElement) {
    const id = chatElement.getAttribute('data-chat-session-id');
    if (id && id !== 'undefined' && id !== 'null') {
      console.log(`📍 SessionId détecté (méthode 2): ${id.substring(0, 30)}...`);
      return id;
    }
  }
  
  // Méthode 3: Depuis URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlSessionId = urlParams.get('sessionId');
  if (urlSessionId) {
    console.log(`📍 SessionId depuis URL: ${urlSessionId.substring(0, 30)}...`);
    return urlSessionId;
  }
  
  // ÉCHEC: Créer sessionId temporaire
  console.warn('⚠️ All session detection methods failed, creating temporary session');
  return this.createTemporarySession();
}

private createTemporarySession(): string {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.warn(`🆕 Created temporary sessionId: ${tempId}`);
  return tempId;
}
```

**Problème CRITIQUE** :
- ❌ Si sessionId **temporaire** créé à chaque fois → Jamais le même
- ❌ Sauvegarde avec `tempId-123` → Restauration cherche `tempId-456` → Rien trouvé
- ⚠️ React ne met pas à jour `data-session-id` → Fallback sur temporaire

**Solution attendue** :
- React DOIT mettre à jour attribut `data-session-id` sur élément racine
- OU passer sessionId stable via props/context

---

## Méthodes Critiques - RESTAURATION

### 3. `restoreTablesChronologically()` - Ligne ~2301

**Déclencheur** : ❌ **DEVRAIT être appelé par ClaraAssistant.tsx (MAIS NE L'EST PAS)**

**Fonction** : Restaure toutes les tables sauvées pour la session courante

**Code complet** :
```typescript
public async restoreTablesChronologically(messages: any[]): Promise<number> {
  console.log('🔄 [CHRONO] restoreTablesChronologically called');
  
  // 🛡️ NIVEAU 1 : Vérification flag global
  if ((window as any).DISABLE_TABLE_RESTORATION === true) {
    console.log(`🚫 [CHRONO] Global flag DISABLE_TABLE_RESTORATION is true, skipping restoration`);
    return 0;
  }
  
  console.log(`✅ [CHRONO] Global flag check passed (flag is false)`);
  
  // 🛡️ NIVEAU 2 : Vérification sessionId
  if (!this.currentSessionId) {
    console.warn('⚠️ [CHRONO] No active session, cannot restore tables');
    return 0;
  }
  
  console.log(`✅ [CHRONO] SessionId detected: ${this.currentSessionId.substring(0, 30)}...`);
  
  // 🛡️ NIVEAU 3 : Vérification messages
  if (!messages || messages.length === 0) {
    console.log(`ℹ️ [CHRONO] No messages provided, timeline may be incomplete`);
  }
  
  console.log(`🔄 Restoring tables chronologically for session: ${this.currentSessionId}`);
  console.log(`📚 [CHRONO] Starting chronological restoration (messages: ${messages?.length || 0})`);
  
  try {
    // ÉTAPE 1 : Récupération timeline
    const timeline = await flowiseTimelineService.getSessionTimeline(
      this.currentSessionId,
      messages
    );
    
    console.log(`📊 [CHRONO] Timeline retrieved: ${timeline.length} items`);
    
    if (timeline.length === 0) {
      console.log(`ℹ️ No timeline items for session ${this.currentSessionId}`);
      return 0;
    }
    
    // ÉTAPE 2 : Filtrage défensif (ISOLATION) ✅ FONCTIONNE
    const filteredTimeline = timeline.filter(item => {
      const belongsToSession = item.sessionId === this.currentSessionId;
      
      if (!belongsToSession && item.type === 'table') {
        console.warn(`🚫 [ISOLATION] Filtering out table from different session:`, {
          tableId: item.id,
          tableSessionId: item.sessionId,
          currentSessionId: this.currentSessionId
        });
      }
      
      return belongsToSession;
    });
    
    console.log(`🛡️ [CHRONO] After filtering: ${filteredTimeline.length} items (removed: ${timeline.length - filteredTimeline.length})`);
    
    if (filteredTimeline.length === 0) {
      console.log(`ℹ️ No tables belong to current session after filtering`);
      return 0;
    }
    
    // ÉTAPE 3 : Restauration une par une
    let restoredCount = 0;
    
    for (const item of filteredTimeline) {
      if (item.type === 'table') {
        try {
          await this.restoreTableFromTimeline(item);
          restoredCount++;
          console.log(`✅ Table restored: ${item.id} (keyword: "${item.keyword}")`);
        } catch (error) {
          console.error(`❌ Failed to restore table ${item.id}:`, error);
        }
      }
    }
    
    console.log(`✅ [CHRONO] Chronological restoration complete: ${restoredCount} tables restored`);
    
    // ÉTAPE 4 : Émission événement complétion
    window.dispatchEvent(new CustomEvent('flowise:restoration:complete', {
      detail: {
        sessionId: this.currentSessionId,
        restoredCount,
        timestamp: Date.now()
      }
    }));
    
    return restoredCount;
    
  } catch (error) {
    console.error('❌ [CHRONO] Error in chronological restoration:', error);
    return 0;
  }
}
```

**Logs attendus** (si appelé) :
```
🔄 [CHRONO] restoreTablesChronologically called
✅ [CHRONO] Global flag check passed (flag is false)
✅ [CHRONO] SessionId detected: uuid-abc123...
🔄 Restoring tables chronologically for session: uuid-abc123...
📚 [CHRONO] Starting chronological restoration (messages: 15)
📊 [CHRONO] Timeline retrieved: 3 items
🛡️ [CHRONO] After filtering: 3 items (removed: 0)
✅ Table restored: table-123 (keyword: "Programme Travail")
✅ Table restored: table-456 (keyword: "Table_Conso")
✅ Table restored: table-789 (keyword: "Resultat")
✅ [CHRONO] Chronological restoration complete: 3 tables restored
```

**Logs absents actuellement** :
```
❌ AUCUN log restauration après F5
❌ Méthode JAMAIS appelée
```

**Root Cause** : ClaraAssistant.tsx ne contient aucun appel à cette méthode

---

### 4. `restoreTableFromTimeline()` - Ligne ~2400

**Fonction** : Restaure une table individuelle depuis timeline

**Code** :
```typescript
private async restoreTableFromTimeline(item: TimelineItem): Promise<void> {
  console.log(`🔄 Restoring table from timeline: ${item.id}`);
  
  // 1. Récupération données depuis IndexedDB
  const tableData = item.data as FlowiseGeneratedTableRecord;
  
  if (!tableData || !tableData.html) {
    console.error(`❌ No HTML data for table ${item.id}`);
    return;
  }
  
  // 2. Injection dans DOM
  await this.injectTableIntoDOM(tableData);
  
  // 3. Restauration événements (menu contextuel, édition, etc.)
  await this.restoreTableEventHandlers(tableData);
  
  console.log(`✅ Table ${item.id} fully restored`);
}
```

---

### 5. `injectTableIntoDOM()` - Ligne ~2450

**Fonction** : Injection physique table dans DOM

**Code** :
```typescript
private injectTableIntoDOM(tableData: FlowiseGeneratedTableRecord): void {
  console.log(`💉 Injecting table into DOM: ${tableData.id}`);
  
  // 1. Recherche container cible
  const containerId = tableData.containerId || 'default-container';
  let container = document.querySelector(`[data-container-id="${containerId}"]`);
  
  if (!container) {
    // Fallback: chercher container générique
    container = document.querySelector('.message-content') ||
                document.querySelector('.chat-messages') ||
                document.body;
    console.warn(`⚠️ Container ${containerId} not found, using fallback`);
  }
  
  // 2. Création wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'restored-table-wrapper';
  wrapper.setAttribute('data-table-id', tableData.id);
  wrapper.setAttribute('data-restored', 'true');
  wrapper.innerHTML = tableData.html;
  
  // 3. Insertion au bon endroit (position chronologique)
  if (tableData.position !== undefined) {
    const existingTables = container.querySelectorAll('[data-table-id]');
    if (tableData.position < existingTables.length) {
      container.insertBefore(wrapper, existingTables[tableData.position]);
    } else {
      container.appendChild(wrapper);
    }
  } else {
    container.appendChild(wrapper);
  }
  
  console.log(`✅ Table injected at position ${tableData.position || 'end'}`);
}
```

**Problème potentiel** :
- ❌ Container pas trouvé → Table injectée dans body (invisible)
- ❌ Position invalide → Ordre chronologique cassé
- ❌ React re-render écrase injection

---

## Événements Écoutés

**Configurés dans `initialize()`** :
```typescript
public initialize(): void {
  // 1. Écouter sauvegarde depuis index.html/conso.js
  window.addEventListener('flowise:table:integrated', (e: Event) => {
    this.handleTableIntegrated((e as CustomEvent).detail);
  });
  
  // 2. Écouter requête sauvegarde directe depuis conso.js
  window.addEventListener('flowise:table:save:request', (e: Event) => {
    this.handleTableSaveRequest(e);
  });
  
  // 3. Écouter changement session
  window.addEventListener('claraverse:session:changed', (e: Event) => {
    this.handleSessionChanged((e as CustomEvent).detail);
  });
  
  console.log('✅ FlowiseTableBridge initialized with event listeners');
}
```

## Événements Émis

```typescript
// Après sauvegarde réussie
window.dispatchEvent(new CustomEvent('flowise:table:saved', {
  detail: { tableId, sessionId, keyword, fingerprint, timestamp }
}));

// Après restauration complète
window.dispatchEvent(new CustomEvent('flowise:restoration:complete', {
  detail: { sessionId, restoredCount, timestamp }
}));

// En cas d'erreur
window.dispatchEvent(new CustomEvent('flowise:table:error', {
  detail: { error, context, timestamp }
}));
```

---

## Résumé Fichier #1

**Ce qui fonctionne** :
- ✅ Écoute événements `flowise:table:integrated`
- ✅ Sauvegarde tables via `handleTableIntegrated()`
- ✅ Filtrage isolation sessions (ligne 2318)
- ✅ Méthode `restoreTablesChronologically()` existe et semble correcte

**Ce qui NE fonctionne PAS** :
- ❌ `restoreTablesChronologically()` JAMAIS appelé (root cause)
- ❌ SessionId peut être temporaire (si React ne met pas à jour attribut)

**Prochaines actions** :
1. Vérifier IndexedDB manuellement → Confirmer sauvegarde OK
2. Implémenter appel `restoreTablesChronologically()` dans ClaraAssistant.tsx

---

# 🔴 FICHIER #2 : src/services/flowiseTableService.ts

**Score importance** : 9/10 - **INDISPENSABLE**

## Rôle Global

**Couche service** pour opérations IndexedDB :
- Sauvegarde tables (CREATE)
- Restauration tables (READ)
- Suppression tables (DELETE)
- Génération fingerprints (anti-doublons)
- Compression HTML (storage optimization)
- Gestion quotas IndexedDB

**Taille** : ~1200 lignes TypeScript

---

## Architecture Interne

```typescript
class FlowiseTableService {
  // Constantes
  private readonly COMPRESSION_THRESHOLD = 50 * 1024; // 50KB
  private readonly MAX_TABLES_PER_SESSION = 100;
  private readonly QUOTA_THRESHOLD = 0.9; // 90%
  
  // Service dépendant
  private indexedDBService: IndexedDBService;
  
  // Méthodes publiques
  public async saveGeneratedTable(...): Promise<string>
  public async restoreSessionTables(sessionId: string): Promise<FlowiseGeneratedTableRecord[]>
  public async deleteTable(tableId: string): Promise<void>
  public async deleteSessionTables(sessionId: string): Promise<number>
  
  // Méthodes privées
  private generateTableFingerprint(table: HTMLTableElement): string
  private compressHTML(html: string): string
  private decompressHTML(compressed: string): string
  private extractTableMetadata(table: HTMLTableElement): TableMetadata
}
```

---

## Méthodes Critiques

### 1. `saveGeneratedTable()` - Ligne 187

**Fonction** : Sauvegarde table dans IndexedDB avec compression et métadonnées

**Signature** :
```typescript
async saveGeneratedTable(
  sessionId: string,
  tableElement: HTMLTableElement,
  keyword: string,
  source: FlowiseTableSource,
  messageId?: string,
  forceUpdate: boolean = false
): Promise<string>
```

**Code complet** :
```typescript
async saveGeneratedTable(
  sessionId: string,
  tableElement: HTMLTableElement,
  keyword: string,
  source: FlowiseTableSource,
  messageId?: string,
  forceUpdate: boolean = false
): Promise<string> {
  try {
    // ÉTAPE 1 : Génération fingerprint (hash contenu)
    const fingerprint = this.generateTableFingerprint(tableElement);
    console.log(`🔑 Fingerprint generated: ${fingerprint.substring(0, 16)}...`);
    
    // ÉTAPE 2 : Vérification doublons (sauf si forceUpdate)
    if (!forceUpdate) {
      const exists = await this.tableExists(sessionId, fingerprint);
      if (exists) {
        console.log('ℹ️ Table with same fingerprint already exists, skipping save');
        return ''; // Retourne vide mais pas d'erreur
      }
    }
    
    // ÉTAPE 3 : Vérification limites storage
    await this.enforceStorageLimits(sessionId);
    
    const quotaInfo = await this.checkStorageQuota();
    if (quotaInfo.percentage >= this.QUOTA_THRESHOLD) {
      console.warn(`⚠️ Storage quota at ${(quotaInfo.percentage * 100).toFixed(1)}%, performing cleanup...`);
      await this.performAutomaticCleanup(sessionId);
    }
    
    // ÉTAPE 4 : Extraction HTML
    let html = tableElement.outerHTML;
    const originalSize = html.length;
    
    // ÉTAPE 5 : Extraction métadonnées
    const metadata = this.extractTableMetadata(tableElement, html);
    
    // ÉTAPE 6 : Compression si > 50KB
    if (originalSize > this.COMPRESSION_THRESHOLD) {
      html = this.compressHTML(html);
      metadata.compressed = true;
      metadata.originalSize = originalSize;
      console.log(`🗜️ Compressed table from ${originalSize} to ${html.length} bytes`);
    }
    
    // ÉTAPE 7 : Détection container et position
    const container = tableElement.closest('[data-container-id]') as HTMLElement;
    const containerId = container?.getAttribute('data-container-id') || this.generateContainerId();
    const position = this.detectTablePosition(tableElement, container);
    
    // ÉTAPE 8 : Création record
    const tableRecord: FlowiseGeneratedTableRecord = {
      id: this.generateUUID(),
      sessionId,
      messageId,
      keyword,
      html,
      fingerprint,
      containerId,
      position,
      timestamp: new Date().toISOString(),
      source,
      metadata,
      user_id: await this.getCurrentUserId(),
      tableType: 'generated',
      processed: false
    };
    
    // ÉTAPE 9 : Sauvegarde IndexedDB avec gestion erreurs
    try {
      await indexedDBService.putGeneratedTable(tableRecord);
      console.log(`✅ Table saved: ${tableRecord.id} (keyword: ${keyword}, fingerprint: ${fingerprint.substring(0, 8)}...)`);
      return tableRecord.id;
      
    } catch (saveError: any) {
      // GESTION QUOTA EXCEEDED
      if (this.isQuotaExceededError(saveError)) {
        console.error('❌ Storage quota exceeded, attempting cleanup and retry...');
        
        // Log erreur
        this.logStorageError('QuotaExceededError', saveError, {
          sessionId,
          keyword,
          tableSize: html.length,
          compressed: metadata.compressed
        });
        
        // Cleanup agressif
        await this.performAutomaticCleanup(sessionId);
        
        // Retry une fois
        try {
          await indexedDBService.putGeneratedTable(tableRecord);
          console.log(`✅ Table saved after cleanup: ${tableRecord.id}`);
          return tableRecord.id;
        } catch (retryError) {
          console.error('❌ Failed to save table even after cleanup:', retryError);
          throw new Error(`Storage quota exceeded and cleanup failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      } else {
        // Autre erreur storage
        console.error('❌ Storage error (not quota):', saveError);
        this.logStorageError('StorageError', saveError, { sessionId, keyword, tableSize: html.length });
        throw saveError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error saving generated table:', error);
    throw error;
  }
}
```

**Logs attendus** :
```
🔑 Fingerprint generated: a1b2c3d4e5f6g7h8...
✅ Table saved: table-1693756800-abc123 (keyword: Programme Travail, fingerprint: a1b2c3d4...)
```

**Logs d'erreur potentiels** :
```
ℹ️ Table with same fingerprint already exists, skipping save
⚠️ Storage quota at 91.5%, performing cleanup...
🗜️ Compressed table from 65536 to 22841 bytes
❌ Storage quota exceeded, attempting cleanup and retry...
❌ Failed to save table even after cleanup: QuotaExceededError
```

**Points de défaillance** :
1. **Fingerprint collision** : Même contenu → Skip save silencieusement
2. **Quota exceeded** : Espace plein → Cleanup échoue
3. **SessionId null** : Record invalide → Exception
4. **TableElement corrompu** : outerHTML vide → HTML invalide

---

### 2. `restoreSessionTables()` - Ligne 423

**Fonction** : Récupère toutes tables d'une session depuis IndexedDB

**Code** :
```typescript
async restoreSessionTables(sessionId: string): Promise<FlowiseGeneratedTableRecord[]> {
  try {
    console.log(`📂 Restoring tables for session: ${sessionId.substring(0, 30)}...`);
    
    // ÉTAPE 1 : Récupération tables restaurables (exclu processed=true)
    const tables = await this.getRestorableTables(sessionId);
    
    console.log(`📊 Found ${tables.length} restorable table(s) for session`);
    
    // ÉTAPE 2 : Décompression si nécessaire
    const restoredTables = tables.map(table => {
      if (table.metadata.compressed) {
        console.log(`🗜️ Decompressing table ${table.id}`);
        return {
          ...table,
          html: this.decompressHTML(table.html)
        };
      }
      return table;
    });
    
    // ÉTAPE 3 : Tri chronologique (important pour ordre restauration)
    restoredTables.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    console.log(`✅ Restored ${restoredTables.length} table(s) for session ${sessionId.substring(0, 30)}...`);
    
    return restoredTables;
    
  } catch (error) {
    console.error('❌ Error restoring session tables:', error);
    throw error;
  }
}
```

**Méthode auxiliaire** :
```typescript
private async getRestorableTables(sessionId: string): Promise<FlowiseGeneratedTableRecord[]> {
  const allTables = await indexedDBService.getAllGeneratedTables();
  
  // Filtrage :
  // - Appartient à la session
  // - Type 'generated' (pas 'trigger')
  // - Pas encore traité (processed=false)
  return allTables.filter(table =>
    table.sessionId === sessionId &&
    table.tableType === 'generated' &&
    table.processed === false
  );
}
```

**Logs attendus** :
```
📂 Restoring tables for session: uuid-abc123...
📊 Found 3 restorable table(s) for session
🗜️ Decompressing table table-456
✅ Restored 3 table(s) for session uuid-abc123...
```

**Problème potentiel** :
- ❌ SessionId mismatch → Array vide retourné
- ❌ Décompression échoue → HTML corrompu
- ❌ Exception IndexedDB → Throw error

---

### 3. `generateTableFingerprint()` - Ligne ~350

**Fonction** : Génère hash unique du contenu table (anti-doublons)

**Code** :
```typescript
generateTableFingerprint(tableElement: HTMLTableElement): string {
  // ÉTAPE 1 : Extraction contenu textuel (normalisé)
  const text = (tableElement.textContent || '')
    .replace(/\s+/g, ' ')  // Normaliser whitespace
    .trim()
    .toLowerCase();
  
  // ÉTAPE 2 : Extraction structure
  const rows = tableElement.querySelectorAll('tr').length;
  const cols = tableElement.querySelectorAll('th, td').length;
  const headers = Array.from(tableElement.querySelectorAll('th'))
    .map(th => (th.textContent || '').trim())
    .join('|');
  
  // ÉTAPE 3 : Création chaîne composite
  const composite = `${text}::${rows}x${cols}::${headers}`;
  
  // ÉTAPE 4 : Hash simple (CRC32 ou SHA256 simplifi)
  return this.simpleHash(composite);
}

private simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
```

**Utilité** :
- ✅ Détection doublons (même contenu = même fingerprint)
- ✅ Vérification modifications (fingerprint change)
- ⚠️ Collision possible (hash simple, pas cryptographique)

**Exemple** :
```
Table avec 3 rows, 5 cols, headers="Nom|Age|Ville", contenu="alice 30 paris"
→ Fingerprint: "7q8r9s0t1u"
```

---

## Compression HTML

### `compressHTML()` et `decompressHTML()`

**Code** :
```typescript
private compressHTML(html: string): string {
  try {
    // Utilisation pako (zlib pour JS) ou LZ-string
    const compressed = LZString.compressToBase64(html);
    return compressed;
  } catch (error) {
    console.warn('⚠️ Compression failed, storing uncompressed:', error);
    return html; // Fallback: non compressé
  }
}

private decompressHTML(compressed: string): string {
  try {
    const decompressed = LZString.decompressFromBase64(compressed);
    return decompressed || compressed; // Fallback si décompression échoue
  } catch (error) {
    console.error('❌ Decompression failed:', error);
    return compressed; // Retourner compressed (HTML peut être lisible quand même)
  }
}
```

**Gains typiques** :
- HTML 65KB → Compressed 22KB (65% réduction)
- HTML 150KB → Compressed 48KB (68% réduction)

---

## Résumé Fichier #2

**Ce qui fonctionne** :
- ✅ Sauvegarde robuste avec retry logic
- ✅ Compression automatique si > 50KB
- ✅ Gestion quotas storage
- ✅ Tri chronologique restauration
- ✅ Décompression automatique

**Limitations** :
- ⚠️ Hash simple (collisions possibles)
- ⚠️ Quota cleanup peut être agressif

---

# 🟡 FICHIER #3 : index.html

**Score importance** : 7/10 - **IMPORTANT**

## Rôle Global

**Configuration globale** + **Script inline** :
- Définit flag `DISABLE_TABLE_RESTORATION`
- Intercepte événements conso.js
- Convertit format événements
- Charge scripts externes

**Taille** : ~1500 lignes HTML + JavaScript

---

## Sections Critiques

### 1. Flag Global - Ligne 148

```html
<script>
  // 🔧 FLAG GLOBAL - CONTRÔLE RESTAURATION
  window.DISABLE_TABLE_RESTORATION = false; // ✅ ACTIVÉ pour tests
  
  console.log("✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false");
  console.log("✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests");
</script>
```

**Vérification** :
```javascript
// Console navigateur
console.log('Flag:', window.DISABLE_TABLE_RESTORATION);
// Doit afficher: false
```

**Si problème** :
- ❌ `true` → Restauration bloquée
- ❌ `undefined` → Script pas chargé
- ❌ Cache navigateur → Ancien flag persisté

---

### 2. Script Inline Interception - Lignes 160-700

**Fonction** : Intercepte événements conso.js et convertit format

**Code** :
```html
<script>
  console.log('🔗 [INLINE] Chargement intégration conso → IndexedDB');
  
  // ==========================================
  // ÉCOUTE ÉVÉNEMENTS CONSO.JS
  // ==========================================
  
  // Événement 1 : flowise:table:save:request (émis par conso.js)
  window.addEventListener('flowise:table:save:request', function(event) {
    console.log('📥 [INLINE] Événement save:request reçu:', event.detail);
    
    const detail = event.detail;
    
    // Validation
    if (!detail.table) {
      console.error('❌ [INLINE] Table manquante dans événement');
      return;
    }
    
    // Conversion format → flowise:table:integrated
    const integratedDetail = {
      table: detail.table,
      keyword: detail.keyword || 'unknown',
      source: detail.source || 'n8n',
      messageId: detail.messageId || undefined,
      timestamp: Date.now()
    };
    
    console.log('📤 [INLINE] Émission événement integrated:', integratedDetail.keyword);
    
    // Émission vers flowiseTableBridge
    window.dispatchEvent(new CustomEvent('flowise:table:integrated', {
      detail: integratedDetail,
      bubbles: true
    }));
  });
  
  // Événement 2 : claraverse:table:updated (émis par conso.js aussi)
  window.addEventListener('claraverse:table:updated', function(event) {
    console.log('🔄 [INLINE] Table updated:', event.detail);
    
    // Conversion similaire
    const detail = event.detail;
    if (detail.table) {
      window.dispatchEvent(new CustomEvent('flowise:table:save:request', {
        detail: {
          table: detail.table,
          keyword: detail.table.getAttribute('data-keyword') || 'updated',
          source: 'menu'
        }
      }));
    }
  });
  
  // Événement 3 : claraverse:table:created (nouvelles tables)
  window.addEventListener('claraverse:table:created', function(event) {
    console.log('🆕 [INLINE] Table created:', event.detail);
    
    const detail = event.detail;
    if (detail.table) {
      window.dispatchEvent(new CustomEvent('flowise:table:save:request', {
        detail: {
          table: detail.table,
          keyword: detail.table.getAttribute('data-keyword') || 'created',
          source: 'conso'
        }
      }));
    }
  });
  
  console.log('✅ [INLINE] Listeners installés avec succès');
</script>
```

**Logs attendus** :
```
🔗 [INLINE] Chargement intégration conso → IndexedDB
✅ [INLINE] Listeners installés avec succès
📥 [INLINE] Événement save:request reçu: {table: <table>, keyword: "Programme Travail"}
📤 [INLINE] Émission événement integrated: Programme Travail
```

**Problème potentiel** :
- ❌ Événement `save:request` jamais émis par conso.js
- ❌ `detail.table` undefined → Conversion échoue
- ❌ Listener ajouté après émission événement (timing)

---

## Résumé Fichier #3

**Ce qui fonctionne** :
- ✅ Flag `DISABLE_TABLE_RESTORATION = false` correct
- ✅ Listeners installés (logs présents)
- ✅ Conversion événements fonctionnelle

**À vérifier** :
- ❓ conso.js émet bien événements `save:request` ?
- ❓ Timing chargement scripts (conso.js chargé avant listeners) ?

---

# 🟢 FICHIER #4 : public/conso.js

**Score importance** : 4/10 - **SECONDAIRE** (génération fonctionne)

## Rôle Global

**Script externe** qui :
- Génère automatiquement Table_Conso et Resultat
- Détecte modifications dans Modelised_table
- Consolide assertions et conclusions
- Émet événements de sauvegarde

**Taille** : ~2600 lignes JavaScript

---

## Architecture Interne

```javascript
class ClaraverseProcessor {
  constructor() {
    this.tables = new Map();
    this.observer = null;
    this.initialized = false;
  }
  
  // Initialisation
  init() {
    this.setupMutationObserver();
    this.scanExistingTables();
  }
  
  // Détection tables
  setupMutationObserver() {...}
  scanExistingTables() {...}
  
  // Consolidation
  consolidateTable(modelisedTable) {...}
  generateTableConso(data) {...}
  generateResultat(data) {...}
  
  // Événements
  emitTableSaveRequest(table, keyword) {...}
  notifyTableUpdated(table, updateType) {...}
}
```

---

## Émission Événements

### Fonction critique : `emitTableSaveRequest()`

**Code** :
```javascript
emitTableSaveRequest(table, keyword) {
  try {
    console.log(`📤 [conso.js] Émission save:request pour: ${keyword}`);
    
    // Création événement
    const event = new CustomEvent('flowise:table:save:request', {
      detail: {
        table: table,
        keyword: keyword,
        source: 'conso',
        timestamp: Date.now()
      },
      bubbles: true
    });
    
    // Émission
    window.dispatchEvent(event);
    
    console.log(`✅ [conso.js] Événement save:request émis pour: ${keyword}`);
    
  } catch (error) {
    console.error('❌ [conso.js] Erreur émission événement:', error);
  }
}
```

**Appelée depuis** :
```javascript
// Après génération Table_Conso
generateTableConso(data) {
  const table = this.createTableElement(data);
  document.querySelector('.message-content').appendChild(table);
  
  // 🔑 ÉMISSION ÉVÉNEMENT ICI
  this.emitTableSaveRequest(table, 'Table_Conso');
  
  return table;
}

// Après génération Resultat
generateResultat(data) {
  const table = this.createTableElement(data);
  document.querySelector('.message-content').appendChild(table);
  
  // 🔑 ÉMISSION ÉVÉNEMENT ICI
  this.emitTableSaveRequest(table, 'Resultat');
  
  return table;
}
```

**Logs attendus** :
```
📤 [conso.js] Émission save:request pour: Table_Conso
✅ [conso.js] Événement save:request émis pour: Table_Conso
```

**À vérifier** :
- ❓ Événements bien émis après génération ?
- ❓ Keyword correct passé ?
- ❓ TableElement valide ?

---

## Résumé Fichier #4

**Ce qui fonctionne** (probablement) :
- ✅ Génération tables Table_Conso et Resultat
- ✅ Consolidation automatique (visible temps réel)
- ✅ Émission événements `save:request`

**À vérifier** :
- ❓ Logs émission présents dans console ?
- ❓ Événements arrivent bien au script inline index.html ?

---

# 🚨 FICHIER #5 : src/components/ClaraAssistant.tsx

**Score importance** : 8/10 - **ROOT CAUSE IDENTIFIÉE ICI**

## Rôle Global

**Composant React principal** :
- Affiche interface chat
- Gère état sessions (currentSession)
- Gère état messages
- **DEVRAIT déclencher restauration (MAIS NE LE FAIT PAS ❌)**

**Taille** : ~3600 lignes TypeScript React

---

## Problème Critique Identifié

### ❌ RESTAURATION JAMAIS APPELÉE

**Preuve** :
```bash
$ grep "flowiseTableBridge" src/components/ClaraAssistant.tsx
No matches found

$ grep "restoreTablesChronologically" src/components/ClaraAssistant.tsx
No matches found

$ grep "useEffect.*restore" src/components/ClaraAssistant.tsx
No matches found
```

**Conclusion** : Ce fichier ne contient AUCUNE logique de restauration

---

## Architecture Actuelle (Simplifiée)

```tsx
const ClaraAssistant: React.FC = () => {
  // États
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ClaraMessage[]>([]);
  const [stableSessionId, setStableSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // useEffect 1 : Chargement sessions
  useEffect(() => {
    const loadSessions = async () => {
      const sessions = await db.getAllSessions();
      setCurrentSession(sessions[0]);
    };
    loadSessions();
  }, []);
  
  // useEffect 2 : Chargement messages
  useEffect(() => {
    if (currentSession?.id) {
      const loadMessages = async () => {
        const msgs = await db.getMessages(currentSession.id);
        setMessages(msgs);
      };
      loadMessages();
    }
  }, [currentSession]);
  
  // useEffect 3 : stableSessionId tracking
  useEffect(() => {
    if (currentSession?.id) {
      setStableSessionId(currentSession.id);
    }
  }, [currentSession?.id]);
  
  // ❌ MANQUE : useEffect pour restauration tables ❌
  
  return (
    <div className="clara-assistant">
      {/* Interface chat */}
    </div>
  );
};
```

---

## Correction Nécessaire

### Code à Ajouter

**Emplacement** : Après useEffect stableSessionId (ligne ~450)

```tsx
// ==========================================
// 🔧 CORRECTION PERSISTANCE TABLES
// ==========================================

// Import en haut du fichier
import flowiseTableBridge from '../services/flowiseTableBridge';

// useEffect à ajouter
useEffect(() => {
  // Guard 1 : Pas de session active
  if (!currentSession?.id) {
    console.log('⏸️ [React] No active session, skipping restoration');
    return;
  }
  
  // Guard 2 : Pas de messages chargés
  if (!messages || messages.length === 0) {
    console.log('⏸️ [React] No messages loaded yet, skipping restoration');
    return;
  }
  
  // Guard 3 : Vérifier bridge initialisé
  if (!flowiseTableBridge) {
    console.error('❌ [React] flowiseTableBridge not available');
    return;
  }
  
  console.log('🔄 [React] Déclenchement restauration tables...', {
    sessionId: currentSession.id.substring(0, 30) + '...',
    messagesCount: messages.length,
    timestamp: Date.now()
  });
  
  // Déclencher restauration chronologique
  flowiseTableBridge.restoreTablesChronologically(messages)
    .then(count => {
      console.log(`✅ [React] Restauration réussie: ${count} table(s)`);
    })
    .catch(error => {
      console.error('❌ [React] Erreur restauration tables:', error);
    });
  
}, [currentSession?.id, messages]); // Dépendances : session change OU messages change
```

**Logs attendus après correction** :
```
🔄 [React] Déclenchement restauration tables... {sessionId: "uuid-abc123...", messagesCount: 15}
🔄 [CHRONO] restoreTablesChronologically called
✅ [CHRONO] Global flag check passed
✅ [CHRONO] SessionId detected: uuid-abc123...
📊 [CHRONO] Timeline retrieved: 3 items
✅ Table restored: table-123 (keyword: "Programme Travail")
✅ Table restored: table-456 (keyword: "Table_Conso")
✅ Table restored: table-789 (keyword: "Resultat")
✅ [React] Restauration réussie: 3 table(s)
```

---

## Questions pour Agent

### Optimisation Dépendances useEffect

**Question 1** : Dépendances `[currentSession?.id, messages]` optimales ?

**Problème potentiel** :
- `messages` change souvent (nouveau message) → Restauration répétée
- Peut causer re-renders excessifs
- Doublons temporaires si restauration pendant génération

**Alternatives** :
```tsx
// Option A : Uniquement au changement session
useEffect(() => {...}, [currentSession?.id]);

// Option B : Flag pour éviter restaurations multiples
const restoredRef = useRef(false);
useEffect(() => {
  if (!restoredRef.current && currentSession?.id && messages.length > 0) {
    restoredRef.current = true;
    // Restaurer...
  }
}, [currentSession?.id, messages]);

// Option C : Debounce
const debouncedRestore = useMemo(
  () => debounce(() => {
    flowiseTableBridge.restoreTablesChronologically(messages);
  }, 300),
  [messages]
);

useEffect(() => {
  if (currentSession?.id) {
    debouncedRestore();
  }
}, [currentSession?.id, messages]);
```

**Question agent** : Quelle approche recommandez-vous ?

---

**Question 2** : Quand exactement déclencher ?

**Options** :
1. **Au mount composant** : useEffect avec `[]` (une fois)
2. **Au changement session** : useEffect avec `[currentSession?.id]`
3. **Messages chargés** : useEffect avec `[messages]`
4. **Combinaison** : `[currentSession?.id, messages]`

**Question agent** : Quel timing optimal ?

---

**Question 3** : Risque doublons temporaires ?

**Scénario** :
1. User génère table → Sauvegarde déclenchée
2. Simultanément, nouveau message arrive → useEffect déclenche restauration
3. Table apparaît 2 fois temporairement ?

**Question agent** : Comment gérer ce race condition ?

---

## Résumé Fichier #5

**Ce qui manque (ROOT CAUSE)** :
- ❌ Aucune importation de `flowiseTableBridge`
- ❌ Aucun appel à `restoreTablesChronologically()`
- ❌ Aucun useEffect pour déclencher restauration

**Correction nécessaire** :
- ✅ Ajouter import
- ✅ Ajouter useEffect avec guards
- ✅ Gérer dépendances optimalement

---

# 🔄 FLUX COMPLET AVEC LES 5 FICHIERS

## Phase 1 : SAUVEGARDE (Probablement Fonctionnelle ✅)

```
1. User remplit Modelised_table (sélectionne Conclusion="Satisfaisant")
   ↓
2. conso.js détecte changement (MutationObserver ou event listener)
   ↓
3. conso.js génère Table_Conso automatiquement
   ↓
4. conso.js injecte Table_Conso dans DOM
   ↓
5. conso.js émet événement
   window.dispatchEvent('flowise:table:save:request', {
     detail: {table: <HTMLTableElement>, keyword: "Table_Conso", source: "conso"}
   })
   LOG conso.js: 📤 Émission save:request pour: Table_Conso
   ↓
6. Script inline index.html intercepte
   LOG index.html: 📥 Événement save:request reçu: {keyword: "Table_Conso"}
   ↓
7. Script inline convertit et ré-émet
   window.dispatchEvent('flowise:table:integrated', {
     detail: {table, keyword, source, timestamp}
   })
   LOG index.html: 📤 Émission événement integrated: Table_Conso
   ↓
8. flowiseTableBridge.handleTableIntegrated() écoute et reçoit
   LOG Bridge: 💾 [Bridge] Handling table integrated: "Table_Conso"
   ↓
9. Bridge valide sessionId et table
   if (!this.currentSessionId) → ❌ STOP
   if (!tableElement) → ❌ STOP
   ↓ (si OK)
10. Bridge appelle flowiseTableService.saveGeneratedTable()
   ↓
11. Service génère fingerprint
   LOG Service: 🔑 Fingerprint generated: a1b2c3d4...
   ↓
12. Service vérifie doublons (skip si existe)
   ↓
13. Service extrait HTML + compresse si > 50KB
   LOG Service: 🗜️ Compressed table from 65536 to 22841 bytes
   ↓
14. Service crée record avec sessionId, keyword, fingerprint, etc.
   ↓
15. Service sauvegarde dans IndexedDB
   await indexedDBService.putGeneratedTable(record)
   ↓
16. Sauvegarde réussie
   LOG Service: ✅ Table saved: table-1693756800-abc123 (keyword: Table_Conso)
   ↓
17. Bridge émet confirmation
   window.dispatchEvent('flowise:table:saved', {detail: {tableId, sessionId}})
```

**Résultat** : Table sauvée dans IndexedDB ✅

**Logs attendus** :
```
📤 [conso.js] Émission save:request pour: Table_Conso
📥 [INLINE] Événement save:request reçu: {keyword: "Table_Conso"}
📤 [INLINE] Émission événement integrated: Table_Conso
💾 [Bridge] Handling table integrated: "Table_Conso"
🔑 Fingerprint generated: a1b2c3d4e5f6g7h8...
✅ Table saved: table-1693756800-abc123 (keyword: Table_Conso, fingerprint: a1b2c3d4...)
```

**À vérifier** :
- ✅ Logs présents → Sauvegarde fonctionne
- ❌ Logs absents → Identifier quel log manque en premier

---

## Phase 2 : RESTAURATION (NON FONCTIONNELLE ❌)

### Flux ATTENDU (pas implémenté)

```
1. User actualise page (F5)
   ↓
2. React recharge application
   ↓
3. ClaraAssistant.tsx monte (componentDidMount / useEffect)
   ↓
4. currentSession chargé depuis IndexedDB (db.getAllSessions)
   LOG React: 📂 Session loaded: uuid-abc123
   ↓
5. messages chargés depuis IndexedDB (db.getMessages)
   LOG React: 📬 15 messages loaded
   ↓
6. ❌ MANQUE : useEffect restauration déclenché ❌
   LOG React attendu: 🔄 Déclenchement restauration tables...
   ↓
7. ❌ MANQUE : Appel flowiseTableBridge.restoreTablesChronologically(messages) ❌
   LOG Bridge attendu: 🔄 [CHRONO] restoreTablesChronologically called
   ↓
8. Bridge vérifie flag
   if (DISABLE_TABLE_RESTORATION === true) → STOP
   LOG Bridge: ✅ Global flag check passed (flag is false)
   ↓
9. Bridge vérifie sessionId
   if (!this.currentSessionId) → STOP
   LOG Bridge: ✅ SessionId detected: uuid-abc123...
   ↓
10. Bridge récupère timeline
   const timeline = await flowiseTimelineService.getSessionTimeline(sessionId, messages)
   LOG Timeline: 📊 Timeline retrieved: 3 items
   ↓
11. Timeline appelle flowiseTableService.restoreSessionTables(sessionId)
   LOG Service: 📂 Restoring tables for session: uuid-abc123...
   ↓
12. Service récupère tables depuis IndexedDB
   const tables = await indexedDBService.getAllGeneratedTables()
   const filtered = tables.filter(t => t.sessionId === sessionId)
   LOG Service: 📊 Found 3 restorable table(s)
   ↓
13. Service décompresse si nécessaire
   LOG Service: 🗜️ Decompressing table table-456
   ↓
14. Service tri chronologique et retourne
   LOG Service: ✅ Restored 3 table(s)
   ↓
15. Bridge filtre par sessionId (ISOLATION)
   const filtered = timeline.filter(item => item.sessionId === currentSessionId)
   LOG Bridge: 🛡️ After filtering: 3 items (removed: 0)
   ↓
16. Bridge restaure chaque table
   for (item of filteredTimeline) {
     await this.restoreTableFromTimeline(item)
   }
   ↓
17. Pour chaque table :
   - Récupère HTML depuis record
   - Injecte dans DOM (container approprié)
   - Restaure event handlers
   LOG Bridge: ✅ Table restored: table-123 (keyword: "Programme Travail")
   LOG Bridge: ✅ Table restored: table-456 (keyword: "Table_Conso")
   LOG Bridge: ✅ Table restored: table-789 (keyword: "Resultat")
   ↓
18. Restauration complète
   LOG Bridge: ✅ [CHRONO] Chronological restoration complete: 3 tables restored
   ↓
19. Bridge émet confirmation
   window.dispatchEvent('flowise:restoration:complete', {detail: {restoredCount: 3}})
```

### Flux RÉEL (actuel)

```
1. User actualise page (F5)
   ↓
2. React recharge application
   ↓
3. ClaraAssistant.tsx monte
   ↓
4. currentSession chargé
   LOG React: 📂 Session loaded: uuid-abc123
   ↓
5. messages chargés
   LOG React: 📬 15 messages loaded
   ↓
6. ❌ RIEN - Aucun useEffect pour restauration ❌
   ❌ Aucun log restauration
   ❌ Aucun appel flowiseTableBridge
   ↓
7. User voit chat SANS les tables
   ❌ Table_Conso disparue
   ❌ Resultat disparue
   ❌ Travail perdu
```

**Logs RÉELS actuels** :
```
✅ [GLOBAL FLAG] DISABLE_TABLE_RESTORATION = false
✅ [GLOBAL FLAG] Restauration tables ACTIVÉE pour tests
📂 Session loaded: uuid-abc123...
📬 15 messages loaded
❌ [Silence total - Aucun log restauration]
```

---

## Points de Défaillance Identifiés

| # | Point Défaillance | Fichier | Probabilité | Status |
|---|-------------------|---------|-------------|--------|
| 1 | Événement save:request pas émis | conso.js | 10% | ❓ À vérifier |
| 2 | Listener save:request pas installé | index.html | 5% | ✅ Installé (logs présents) |
| 3 | Conversion événement échoue | index.html | 5% | ❓ À vérifier |
| 4 | handleTableIntegrated() pas appelé | flowiseTableBridge.ts | 10% | ❓ À vérifier |
| 5 | SessionId undefined pendant sauvegarde | flowiseTableBridge.ts | 10% | ❓ À vérifier |
| 6 | Sauvegarde IndexedDB échoue | flowiseTableService.ts | 5% | ❓ À vérifier |
| 7 | **restoreTablesChronologically() jamais appelé** | **ClaraAssistant.tsx** | **85%** | ❌ **ROOT CAUSE** |
| 8 | Flag DISABLE_TABLE_RESTORATION = true | index.html | 0% | ✅ Vérifié false |
| 9 | SessionId mismatch sauvegarde/restauration | flowiseTableBridge.ts | 5% | ❓ À vérifier après fix #7 |
| 10 | Timeline vide (pas de données) | flowiseTimelineService.ts | 5% | ❓ À vérifier après fix #7 |

**Conclusion** : **Point #7 est le root cause avec 85% confiance**

---

# 📊 VÉRIFICATIONS À EFFECTUER

## Étape 1 : Vérifier Sauvegarde Fonctionne (5 min)

### Test 1.1 : Logs console pendant génération

```
1. Ouvrir DevTools → Console
2. Générer une table (ex: Programme Travail)
3. Observer logs attendus :
   - 📤 [conso.js] Émission save:request
   - 📥 [INLINE] Événement save:request reçu
   - 📤 [INLINE] Émission événement integrated
   - 💾 [Bridge] Handling table integrated
   - ✅ Table saved: table-xxx
```

**Si logs présents** → Sauvegarde fonctionne ✅  
**Si logs absents** → Identifier premier log manquant

### Test 1.2 : IndexedDB contient données

```
1. DevTools → Application → IndexedDB
2. Ouvrir "clara_database"
3. Object Store "clara_generated_tables"
4. Compter entrées
```

**Si > 0 entrées** → Sauvegarde fonctionne ✅  
**Si 0 entrées** → Sauvegarde échoue ❌

### Test 1.3 : SessionId stable

```
1. Console avant génération :
   console.log('SessionId AVANT:', flowiseTableBridge.currentSessionId)
   
2. Générer table

3. Console après génération :
   console.log('SessionId APRÈS:', flowiseTableBridge.currentSessionId)
   
4. Comparer : Doit être identique
```

**Si identique** → SessionId stable ✅  
**Si différent ou temporaire** → SessionId problématique ❌

---

## Étape 2 : Implémenter Correction ClaraAssistant (15 min)

### Action 2.1 : Ajouter useEffect restauration

**Fichier** : `src/components/ClaraAssistant.tsx`

**Ligne** : Après useEffect stableSessionId (~450)

**Code** : (Voir section "Correction Nécessaire" plus haut)

### Action 2.2 : Tester après correction

```
1. npm run dev (rebuild)
2. Actualiser page (F5)
3. Observer logs attendus :
   - 🔄 [React] Déclenchement restauration tables...
   - 🔄 [CHRONO] restoreTablesChronologically called
   - ✅ [CHRONO] Global flag check passed
   - 📊 [CHRONO] Timeline retrieved: X items
   - ✅ Table restored: table-xxx
   - ✅ [React] Restauration réussie: X table(s)
```

**Si logs présents ET tables visibles** → Correction réussie ✅  
**Si logs présents MAIS tables invisibles** → Problème injection DOM  
**Si logs absents** → Problème import ou dépendances useEffect

---

## Étape 3 : Validation Complète (10 min)

### Test 3.1 : Scénario complet

```
1. Créer nouveau chat "Test Persistance"
2. Générer table Programme Travail
3. Observer table visible ✅
4. F5 (actualiser)
5. Observer table réapparaît ✅
6. Répéter avec Table_Conso et Resultat
```

### Test 3.2 : Isolation maintenue

```
1. Créer chat A "Test Caisse"
2. Générer table Caisse
3. Créer chat B "Test Immobilisations"
4. Générer table Immobilisations
5. Retourner chat A
6. Vérifier : SEULEMENT table Caisse visible ✅
7. Retourner chat B
8. Vérifier : SEULEMENT table Immobilisations visible ✅
```

### Test 3.3 : Modifications persistantes

```
1. Générer table Modelised_table
2. User remplit ligne 1 : Conclusion="Satisfaisant"
3. Observer Table_Conso générée et remplie ✅
4. F5
5. Observer Modelised_table ET Table_Conso réapparaissent ✅
6. Vérifier Table_Conso contient "Satisfaisant: 1" ✅
```

---

# 📋 RÉSUMÉ POUR AGENT FRONTIER

## Root Cause Identifiée (85% confiance)

**Problème** : ClaraAssistant.tsx ne déclenche JAMAIS la restauration

**Preuve** :
```bash
grep "flowiseTableBridge" src/components/ClaraAssistant.tsx → No matches
grep "restoreTablesChronologically" src/components/ClaraAssistant.tsx → No matches
```

**Impact** :
- Tables sauvées dans IndexedDB (invisible)
- Mais JAMAIS restaurées dans DOM après F5
- User voit tables disparaître

---

## Solution Recommandée

**Fichier** : `src/components/ClaraAssistant.tsx`

**Action** : Ajouter useEffect pour déclencher restauration

**Code** : (Voir section "Correction Nécessaire" ligne 1450)

**Dépendances** : `[currentSession?.id, messages]`

**Questions pour agent** :
1. Optimisation dépendances useEffect ?
2. Timing exact déclenchement ?
3. Gestion race conditions (doublons temporaires) ?
4. Debounce nécessaire ?

---

## Vérifications Préalables

**Avant correction** :
1. ✅ Vérifier IndexedDB contient données (confirme sauvegarde OK)
2. ✅ Vérifier logs sauvegarde présents (confirme flux Phase 1 OK)
3. ✅ Vérifier sessionId stable (pas temporaire)

**Après correction** :
1. ✅ Logs restauration apparaissent
2. ✅ Tables réapparaissent après F5
3. ✅ Isolation maintenue (0 contamination)
4. ✅ Modifications persistantes (conso.js + manuel)

---

**Document créé le** : 2 Septembre 2026 20:00  
**Mise à jour** : Intégration découverte root cause  
**Utilisation** : Guide technique exhaustif pour agents de code  
**Prochaine action** : Implémenter correction ClaraAssistant.tsx

