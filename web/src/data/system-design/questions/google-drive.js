// Google Drive System Design Question
export default {
  id: 'google-drive',
  title: 'Design Google Drive',
  companies: ['Google', 'Microsoft', 'Dropbox'],
  difficulty: 'Medium',
  category: 'Storage & Files',
  
  description: 'Design a cloud storage service that allows users to store, sync, and share files across multiple devices with support for collaboration and versioning.',
  
  requirements: {
    functional: [
      'Upload and download files (up to 5TB per file)',
      'Sync files across multiple devices',
      'Share files/folders with permissions',
      'File versioning and rollback',
      'Real-time collaborative editing',
      'Search files by name, content, metadata',
      'Offline access with sync',
      'Trash/recycle bin with recovery',
      'File preview without download',
      'Mobile app support',
      'Desktop sync client'
    ],
    nonFunctional: [
      'Support 1 billion users',
      '500 million daily active users',
      'Average 50GB storage per user',
      '99.99% durability',
      '99.9% availability',
      'Sync latency < 1 second for small files',
      'Support files from 1 byte to 5TB',
      'Bandwidth optimization',
      'End-to-end encryption for sensitive data'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Google Drive, a cloud storage and synchronization service. The key challenges are:
      
      1. Efficient file synchronization across devices
      2. Storage optimization through deduplication
      3. Real-time collaboration on documents
      4. Handling massive scale (50 Exabytes total)
      5. Conflict resolution for concurrent edits
      6. Fast sync with minimal bandwidth usage
      
      The system needs to provide seamless file access across all devices while minimizing storage and bandwidth costs.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Storage Requirements:
      - Users: 1 billion
      - Average storage per user: 50GB
      - Total storage: 1B * 50GB = 50 Exabytes
      - With replication (3x): 150 Exabytes
      - Daily upload: 500M users * 100MB = 50PB
      
      File Statistics:
      - Average file size: 500KB
      - Files per user: ~100,000
      - Total files: 100 trillion
      - Daily file operations: 10 billion
      
      Bandwidth Requirements:
      - Upload: 50PB/day = 580GB/s average
      - Download: 150PB/day = 1.7TB/s average
      - Peak bandwidth: 5TB/s globally
      
      Sync Operations:
      - Active sync connections: 100 million
      - File changes per second: 1 million
      - Metadata updates: 10 million/second
      
      Deduplication Savings:
      - Block-level dedup: 30% savings
      - File-level dedup: 20% savings
      - Actual storage: ~35 Exabytes
      
      Database Operations:
      - Metadata queries: 1M QPS
      - Permission checks: 500K QPS
      - Search queries: 100K QPS
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Web interface
         - Mobile apps (iOS/Android)
         - Desktop sync client
         - API for third-party apps
      
      2. **API Gateway**
         - Authentication/authorization
         - Rate limiting
         - Request routing
         - SSL termination
      
      3. **Application Services**
         - Upload/Download Service
         - Sync Service
         - Metadata Service
         - Sharing Service
         - Search Service
         - Preview Service
         - Collaboration Service
      
      4. **Storage Layer**
         - Block Storage (chunked files)
         - Metadata Database (file info)
         - Search Index (ElasticSearch)
         - Cache Layer (Redis)
      
      5. **Processing Pipeline**
         - Chunking Service
         - Deduplication Service
         - Compression Service
         - Encryption Service
         - Thumbnail Generator
         - Virus Scanner
      
      6. **Sync Infrastructure**
         - Change Detection Service
         - Notification Service (WebSocket)
         - Conflict Resolution Service
         - Delta Sync Engine
      
      **File Upload/Download Strategy:**
      
      1. Chunking: Split large files into 4MB blocks
      2. Deduplication: Check if blocks exist
      3. Compression: Compress unique blocks
      4. Encryption: Encrypt before storage
      5. Distribution: Store across multiple servers
    `,
    
    detailedDesign: `
      **1. File Chunking and Deduplication:**
      
      Content-Addressed Storage:
      \`\`\`python
      class FileChunker:
          def chunk_file(self, file_path):
              chunks = []
              chunk_size = 4 * 1024 * 1024  # 4MB
              
              with open(file_path, 'rb') as f:
                  while True:
                      chunk = f.read(chunk_size)
                      if not chunk:
                          break
                      
                      # Content addressing
                      chunk_hash = sha256(chunk)
                      
                      # Check if chunk exists
                      if not storage.exists(chunk_hash):
                          # Compress and encrypt
                          compressed = compress(chunk)
                          encrypted = encrypt(compressed)
                          storage.put(chunk_hash, encrypted)
                      
                      chunks.append(chunk_hash)
              
              return chunks
      \`\`\`
      
      Deduplication Benefits:
      - Same file uploaded by multiple users: Store once
      - Modified files: Only store changed chunks
      - Common patterns: OS files, libraries deduplicated
      
      **2. Sync Protocol:**
      
      Merkle Tree for Change Detection:
      \`\`\`
      Root Hash (entire folder)
           /              \\
      Folder1 Hash    Folder2 Hash
         /      \\         /      \\
      File1   File2   File3   File4
      
      # Quick comparison of tree hashes identifies changes
      \`\`\`
      
      Sync Algorithm:
      \`\`\`python
      def sync_folder(local_tree, remote_tree):
          # Compare root hashes
          if local_tree.root_hash == remote_tree.root_hash:
              return  # No changes
          
          # Find differences
          changes = []
          for node in diff_trees(local_tree, remote_tree):
              if node.in_local and not node.in_remote:
                  changes.append(('upload', node))
              elif node.in_remote and not node.in_local:
                  changes.append(('download', node))
              elif node.local_hash != node.remote_hash:
                  changes.append(('sync', node))
          
          # Apply changes
          for action, node in changes:
              if action == 'upload':
                  upload_file(node)
              elif action == 'download':
                  download_file(node)
              elif action == 'sync':
                  resolve_conflict(node)
      \`\`\`
      
      **3. Real-time Collaboration:**
      
      Operational Transformation (OT):
      \`\`\`javascript
      class CollaborativeDoc {
          constructor() {
              this.document = "";
              this.version = 0;
              this.pending = [];
          }
          
          // Transform operation against concurrent ops
          transform(op1, op2) {
              if (op1.position < op2.position) {
                  return op1;
              } else if (op1.position > op2.position) {
                  return {
                      ...op1,
                      position: op1.position + op2.length
                  };
              } else {
                  // Same position, use user ID as tiebreaker
                  return op1.userId < op2.userId ? op1 : op2;
              }
          }
          
          applyOperation(op) {
              // Transform against pending ops
              for (let pending of this.pending) {
                  op = this.transform(op, pending);
              }
              
              // Apply to document
              this.document = this.apply(this.document, op);
              this.version++;
              
              // Broadcast to other users
              this.broadcast(op);
          }
      }
      \`\`\`
      
      **4. Metadata Storage Schema:**
      
      File Metadata:
      \`\`\`sql
      CREATE TABLE files (
          file_id UUID PRIMARY KEY,
          name VARCHAR(255),
          parent_folder_id UUID,
          owner_id BIGINT,
          size BIGINT,
          mime_type VARCHAR(100),
          created_at TIMESTAMP,
          modified_at TIMESTAMP,
          chunk_list TEXT[],  -- Array of chunk hashes
          version INT,
          is_deleted BOOLEAN DEFAULT FALSE,
          INDEX idx_parent (parent_folder_id),
          INDEX idx_owner (owner_id)
      );
      
      CREATE TABLE file_versions (
          version_id UUID PRIMARY KEY,
          file_id UUID,
          version_number INT,
          chunk_list TEXT[],
          size BIGINT,
          modified_by BIGINT,
          modified_at TIMESTAMP,
          FOREIGN KEY (file_id) REFERENCES files(file_id)
      );
      \`\`\`
      
      **5. Sharing and Permissions:**
      
      ACL Implementation:
      \`\`\`python
      class PermissionService:
          def check_permission(self, user_id, file_id, action):
              # Check direct permissions
              perm = db.query("""
                  SELECT permission_level 
                  FROM permissions 
                  WHERE file_id = ? AND user_id = ?
              """, file_id, user_id)
              
              if perm and self.can_perform(perm, action):
                  return True
              
              # Check inherited permissions
              parent = self.get_parent_folder(file_id)
              if parent:
                  return self.check_permission(user_id, parent, action)
              
              # Check if owner
              owner = self.get_owner(file_id)
              return owner == user_id
          
          def share_file(self, file_id, user_id, permission):
              # Add permission entry
              db.execute("""
                  INSERT INTO permissions 
                  (file_id, user_id, permission_level)
                  VALUES (?, ?, ?)
              """, file_id, user_id, permission)
              
              # Send notification
              notify_user(user_id, f"File shared: {file_id}")
      \`\`\`
      
      **6. Delta Sync:**
      
      Binary Diff for Large Files:
      \`\`\`python
      def delta_sync(old_file, new_file):
          # Use rsync algorithm
          checksums = rolling_checksum(old_file)
          
          deltas = []
          for block in new_file:
              if block.checksum in checksums:
                  # Block exists, reference it
                  deltas.append(('ref', block.position))
              else:
                  # New block, send data
                  deltas.append(('data', block.data))
          
          return deltas
      \`\`\`
      
      **7. Conflict Resolution:**
      
      Three-way Merge:
      \`\`\`python
      def resolve_conflict(base, local, remote):
          if local == remote:
              return local  # No conflict
          
          if local == base:
              return remote  # Take remote changes
          
          if remote == base:
              return local  # Take local changes
          
          # Both changed, create conflict
          return create_conflict_file(local, remote)
      \`\`\`
    `,
    
    dataFlow: `
      **File Upload Flow:**
      
      1. Client initiates upload
      2. Check quota and permissions
      3. File chunking on client:
         - Split into 4MB chunks
         - Calculate hash for each chunk
      4. Send chunk hashes to server
      5. Server responds with missing chunks
      6. Upload only unique chunks
      7. Server assembles file metadata
      8. Update file index and permissions
      9. Trigger sync to other devices
      
      **File Download Flow:**
      
      1. Client requests file
      2. Check permissions
      3. Get file metadata and chunk list
      4. Retrieve chunks from storage:
         - Check local cache first
         - Download missing chunks
         - Parallel downloads for speed
      5. Reassemble file on client
      6. Verify integrity with checksum
      
      **Sync Flow:**
      
      1. Client connects via WebSocket
      2. Send local Merkle tree root
      3. Server compares with remote tree
      4. If different:
         - Exchange tree nodes to find changes
         - Determine minimal change set
      5. Sync changes:
         - Upload new/modified files
         - Download remote changes
         - Handle conflicts
      6. Update local and remote trees
      7. Keep connection for real-time updates
      
      **Collaboration Flow:**
      
      1. User opens document
      2. Establish WebSocket connection
      3. Receive document state and version
      4. User makes changes:
         - Generate operation
         - Send to server
         - Apply optimistically
      5. Server receives operation:
         - Transform against concurrent ops
         - Apply to master document
         - Broadcast to other users
      6. Clients receive operations:
         - Transform against local ops
         - Apply to document
         - Update cursor positions
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Metadata Database Load**
         Problem: Billions of files, heavy read/write
         Solution:
         - Shard by user_id
         - Read replicas for queries
         - Cache frequently accessed metadata
         - Denormalize for performance
      
      2. **Large File Uploads**
         Problem: Network timeouts, failures
         Solution:
         - Resumable uploads
         - Multipart upload API
         - Edge servers for upload
         - Incremental chunk uploads
      
      3. **Sync Storms**
         Problem: Mass sync after outage
         Solution:
         - Exponential backoff
         - Priority queue (active users first)
         - Rate limiting per user
         - Staggered reconnection
      
      4. **Storage Costs**
         Problem: Storing 50 Exabytes
         Solution:
         - Aggressive deduplication
         - Compression (30% savings)
         - Cold storage for old files
         - Quotas and cleanup policies
      
      5. **Real-time Collaboration Scale**
         Problem: Millions of concurrent edits
         Solution:
         - Document sharding
         - Regional servers
         - Operational transformation
         - Batch updates
      
      6. **Search Performance**
         Problem: Searching 100 trillion files
         Solution:
         - ElasticSearch clusters
         - Index only metadata
         - User-scoped searches
         - Async full-text indexing
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Storage Scaling:**
         - Distributed file system (GFS/HDFS)
         - Erasure coding (1.3x overhead vs 3x)
         - Geographic replication
         - Tiered storage (SSD → HDD → Cold)
      
      2. **Database Sharding:**
         - Metadata: Shard by user_id
         - Permissions: Shard by file_id
         - Chunks: Consistent hashing
         - Search: Separate clusters
      
      3. **Caching Layers:**
         - CDN for popular files
         - Redis for metadata
         - Local cache on clients
         - Edge servers globally
      
      4. **Service Architecture:**
         - Microservices deployment
         - Auto-scaling groups
         - Load balancers per service
         - Circuit breakers
      
      5. **Sync Optimization:**
         - Regional sync servers
         - P2P sync for same network
         - Delta sync for large files
         - Predictive prefetching
      
      6. **Cost Optimizations:**
         - Dedup saves 40% storage
         - Compress text files (60% savings)
         - Archive inactive accounts
         - Progressive download (preview first)
    `
  },
  
  architecture: {
    svgPath: '/diagrams/google-drive.svg',
    components: [
      { 
        name: 'Sync Client', 
        description: 'Desktop/mobile client with local cache and sync engine' 
      },
      { 
        name: 'API Gateway', 
        description: 'Entry point for all client requests with auth and routing' 
      },
      { 
        name: 'Chunking Service', 
        description: 'Splits files into 4MB chunks for deduplication' 
      },
      { 
        name: 'Block Storage', 
        description: 'Content-addressed storage for deduplicated chunks' 
      },
      { 
        name: 'Metadata Service', 
        description: 'Manages file metadata, permissions, and versions' 
      },
      { 
        name: 'Sync Service', 
        description: 'Handles device synchronization using Merkle trees' 
      },
      { 
        name: 'Collaboration Service', 
        description: 'Real-time collaborative editing with OT' 
      },
      { 
        name: 'Notification Service', 
        description: 'WebSocket connections for real-time updates' 
      },
      { 
        name: 'Search Service', 
        description: 'ElasticSearch for file search and indexing' 
      }
    ]
  },
  
  apiDesign: `
    // File Operations
    
    POST /api/files/upload/init
    Request: {
      name: "document.pdf",
      size: 10485760,
      parent_folder_id: "folder_123",
      mime_type: "application/pdf"
    }
    Response: {
      upload_id: "upload_xyz",
      chunk_size: 4194304,
      required_chunks: ["hash1", "hash2", "hash3"]
    }
    
    PUT /api/files/upload/chunk
    Headers: {
      Upload-Id: "upload_xyz",
      Chunk-Hash: "sha256_hash",
      Content-Range: "bytes 0-4194303/10485760"
    }
    Body: <binary chunk data>
    
    POST /api/files/upload/complete
    Request: {
      upload_id: "upload_xyz",
      chunk_list: ["hash1", "hash2", "hash3"]
    }
    Response: {
      file_id: "file_abc",
      version: 1,
      created_at: "2024-01-01T12:00:00Z"
    }
    
    GET /api/files/{file_id}/download
    Response: {
      file_name: "document.pdf",
      size: 10485760,
      chunks: [
        {hash: "hash1", url: "https://cdn.drive/chunk1"},
        {hash: "hash2", url: "https://cdn.drive/chunk2"}
      ]
    }
    
    // Sync APIs
    
    POST /api/sync/changes
    Request: {
      folder_id: "root",
      client_tree_hash: "merkle_root_hash",
      last_sync_token: "token_123"
    }
    Response: {
      changes: [
        {type: "added", file_id: "...", path: "..."},
        {type: "modified", file_id: "...", path: "..."},
        {type: "deleted", file_id: "...", path: "..."}
      ],
      sync_token: "token_124"
    }
    
    // Sharing APIs
    
    POST /api/files/{file_id}/share
    Request: {
      user_email: "user@example.com",
      permission: "edit",  // view|comment|edit
      notify: true
    }
    Response: {
      share_id: "share_123",
      share_link: "https://drive.google.com/..."
    }
    
    GET /api/files/{file_id}/permissions
    Response: {
      owner: {user_id: "123", email: "..."},
      shared_with: [
        {user_id: "456", email: "...", permission: "edit"},
        {user_id: "789", email: "...", permission: "view"}
      ],
      link_sharing: {
        enabled: true,
        permission: "view"
      }
    }
    
    // Search API
    
    GET /api/search
    Query: {
      q: "presentation",
      type: "document",
      owner: "me",
      modified_after: "2024-01-01"
    }
    Response: {
      results: [
        {
          file_id: "...",
          name: "Q1 Presentation.pptx",
          path: "/Work/Presentations/",
          modified: "2024-01-15",
          size: 5242880
        }
      ]
    }
    
    // Collaboration WebSocket
    
    WS /api/collab/{document_id}
    
    // Client → Server
    {
      type: "operation",
      op: {
        type: "insert",
        position: 42,
        text: "Hello",
        version: 5
      }
    }
    
    // Server → Client
    {
      type: "operation",
      op: {
        type: "insert",
        position: 42,
        text: "Hello",
        version: 6,
        user_id: "123"
      }
    }
    
    {
      type: "cursor",
      user_id: "456",
      position: 100
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for metadata
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        quota_bytes BIGINT DEFAULT 15737418240, -- 15GB
        used_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE files (
        file_id UUID PRIMARY KEY,
        name VARCHAR(255),
        parent_folder_id UUID,
        owner_id BIGINT,
        size_bytes BIGINT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP,
        modified_at TIMESTAMP,
        chunk_list TEXT[], -- Array of chunk hashes
        version INT DEFAULT 1,
        is_folder BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,
        INDEX idx_parent (parent_folder_id),
        INDEX idx_owner (owner_id),
        INDEX idx_deleted (is_deleted, deleted_at)
      );
      
      CREATE TABLE file_versions (
        version_id UUID PRIMARY KEY,
        file_id UUID,
        version_number INT,
        chunk_list TEXT[],
        size_bytes BIGINT,
        modified_by BIGINT,
        modified_at TIMESTAMP,
        INDEX idx_file_version (file_id, version_number)
      );
      
      CREATE TABLE permissions (
        permission_id UUID PRIMARY KEY,
        file_id UUID,
        user_id BIGINT,
        permission_level VARCHAR(20), -- owner|edit|comment|view
        granted_by BIGINT,
        granted_at TIMESTAMP,
        INDEX idx_file_perms (file_id),
        INDEX idx_user_perms (user_id)
      );
      
      CREATE TABLE sync_tokens (
        user_id BIGINT,
        device_id VARCHAR(100),
        folder_id UUID,
        sync_token VARCHAR(100),
        tree_hash VARCHAR(64),
        last_sync TIMESTAMP,
        PRIMARY KEY (user_id, device_id, folder_id)
      );
    `,
    
    nosql: `
      // DynamoDB for chunk registry
      
      Table: chunks
      Partition Key: chunk_hash (String)
      Attributes:
        - size (Number)
        - storage_location (String)
        - reference_count (Number)
        - created_at (Number)
      
      // Redis for caching
      
      // File metadata cache
      HASH file:{file_id}
      Fields: name, size, owner_id, parent_folder_id, chunk_list
      TTL: 3600
      
      // User quota cache
      STRING quota:{user_id} -> used_bytes
      TTL: 300
      
      // Active sync connections
      SET sync:{user_id} -> [device_ids]
      
      // Collaboration sessions
      HASH collab:{document_id}
      Fields: users (JSON), version, last_op
      
      // Recent changes for sync
      LIST changes:{user_id}
      Values: JSON change objects
      MAXLEN: 1000
      
      // Share links
      STRING share:{share_id} -> file_id
      TTL: 86400 (optional expiry)
      
      // ElasticSearch for search
      
      Index: files
      {
        "file_id": "uuid",
        "name": "document.pdf",
        "content": "extracted text...",
        "owner_id": 123,
        "path": "/folder/subfolder/",
        "mime_type": "application/pdf",
        "size": 1048576,
        "modified_at": "2024-01-01T12:00:00Z",
        "shared_with": [456, 789],
        "tags": ["work", "important"]
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Chunking Size',
      analysis: `
        Small Chunks (1MB):
        ✓ Better deduplication
        ✓ Granular changes
        ✗ More metadata overhead
        ✗ More network requests
        
        Large Chunks (4MB - Chosen):
        ✓ Less metadata
        ✓ Fewer requests
        ✓ Good balance
        ✗ Less dedup for small changes
        
        Variable Size (Content-defined):
        ✓ Better dedup
        ✗ Complex implementation
        
        Decision: 4MB fixed chunks for simplicity and performance
      `
    },
    {
      decision: 'Sync Strategy',
      analysis: `
        Full Sync:
        ✓ Simple
        ✗ Bandwidth intensive
        ✗ Slow
        
        Delta Sync (Chosen):
        ✓ Bandwidth efficient
        ✓ Fast updates
        ✗ Complex implementation
        
        Merkle Tree Comparison:
        ✓ Efficient change detection
        ✓ Logarithmic comparison
        ✗ Tree maintenance overhead
        
        Decision: Merkle tree + delta sync for efficiency
      `
    },
    {
      decision: 'Consistency Model',
      analysis: `
        Strong Consistency:
        ✓ No conflicts
        ✗ Higher latency
        ✗ Availability issues
        
        Eventual Consistency (Chosen):
        ✓ Better performance
        ✓ Higher availability
        ✗ Conflict resolution needed
        
        Decision: Eventually consistent with automatic conflict resolution
      `
    },
    {
      decision: 'Storage Architecture',
      analysis: `
        File System:
        ✓ Simple
        ✗ No deduplication
        ✗ Scaling issues
        
        Object Storage:
        ✓ Scalable
        ✗ No dedup
        
        Block Storage with CAS (Chosen):
        ✓ Deduplication
        ✓ Efficient storage
        ✓ Version control
        ✗ Complex implementation
        
        Decision: Content-addressed block storage for dedup
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Google File System - MIT Lecture',
        youtubeId: 'WLad7CCexo8',
        duration: '71:42'
      },
      { 
        title: 'Dropbox System Design',
        youtubeId: 'U0xTu6E2CT8',
        duration: '45:23'
      }
    ],
    articles: [
      {
        title: 'How Google Drive Works',
        url: 'https://www.blog.google/products/drive/how-google-drive-works/'
      },
      {
        title: 'Dropbox Sync Engine Rebuild',
        url: 'https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 3: Design Google Drive'
      }
    ]
  }
}