// Dropbox System Design Question
export default {
  id: 'dropbox',
  title: 'Design Dropbox',
  companies: ['Dropbox', 'Google Drive', 'OneDrive', 'Box', 'iCloud'],
  difficulty: 'Hard',
  category: 'Storage & File Sharing',
  
  description: 'Design a cloud-based file storage and synchronization service that allows users to store, sync, and share files across multiple devices with high reliability and performance.',
  
  requirements: {
    functional: [
      'File upload, download, and storage',
      'Automatic sync across devices',
      'File versioning and history',
      'File and folder sharing',
      'Collaborative editing',
      'Offline support with sync',
      'File deduplication',
      'Desktop and mobile clients',
      'Web interface',
      'Public link generation',
      'File search and metadata',
      'Trash/recycle bin',
      'Bandwidth optimization',
      'Selective sync'
    ],
    nonFunctional: [
      '700 million registered users',
      '300 million active users',
      '1 billion files uploaded daily',
      'Average file size: 500KB',
      '99.99% durability',
      '99.95% availability',
      'Sync latency < 1 second',
      'Support files up to 50GB',
      'Storage: 500PB total',
      'Bandwidth: 10TB/s peak',
      'Version history: 30 days',
      'Cross-platform support',
      'GDPR/HIPAA compliance'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Dropbox, a cloud file storage and synchronization service. The key challenges are:
      
      1. Efficient file synchronization across devices
      2. Handling massive storage (500PB+)
      3. Fast and reliable file upload/download
      4. Deduplication to save storage
      5. Real-time collaboration features
      6. Conflict resolution for concurrent edits
      7. Bandwidth optimization
      8. Security and encryption
      
      The system needs to provide seamless file sync, sharing, and collaboration while handling billions of files with high durability and availability.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Base:
      - Registered users: 700 million
      - Active users: 300 million
      - Average storage per user: 2GB
      - Files per user: 1000
      - Devices per user: 3
      
      File Operations:
      - Daily uploads: 1 billion files
      - Daily downloads: 3 billion files
      - Uploads per second: 11,500
      - Downloads per second: 35,000
      - Peak multiplier: 3x
      
      Storage Requirements:
      - Total files: 300B files
      - Average file size: 500KB
      - Raw storage: 150PB
      - With deduplication (30% savings): 105PB
      - With redundancy (3x): 315PB
      - With versions: 500PB total
      
      Bandwidth:
      - Upload: 11,500 * 500KB = 5.75GB/s avg
      - Download: 35,000 * 500KB = 17.5GB/s avg
      - Peak total: 70GB/s
      - With optimization: 10TB/s capacity
      
      Metadata Storage:
      - Files metadata: 300B * 1KB = 300TB
      - Versions metadata: 100TB
      - Sharing metadata: 50TB
      - Total with replication: 1.5PB
      
      Infrastructure:
      - Storage nodes: 50,000
      - API servers: 10,000
      - Sync servers: 5,000
      - Database nodes: 1,000
      - Cache servers: 2,000
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Desktop clients (Windows/Mac/Linux)
         - Mobile apps (iOS/Android)
         - Web interface
         - API for third-party apps
      
      2. **Synchronization Service**
         - Block-level sync
         - Delta sync algorithms
         - Conflict detection
         - Change notification
      
      3. **File Service Layer**
         - Upload service
         - Download service
         - Chunking service
         - Deduplication service
      
      4. **Metadata Service**
         - File metadata DB
         - Version control
         - Sharing permissions
         - Search indexing
      
      5. **Storage Backend**
         - Distributed file storage
         - Block storage system
         - Cold storage tier
         - CDN for popular files
      
      6. **Processing Pipeline**
         - Compression
         - Encryption
         - Thumbnail generation
         - Virus scanning
      
      7. **Notification System**
         - Change notifications
         - Sharing notifications
         - Real-time updates
         - WebSocket connections
      
      **Key Components:**
      - Chunking for large files
      - Content-addressable storage
      - Merkle trees for sync
      - Event-driven architecture
    `,
    
    detailedDesign: `
      **1. File Chunking System:**
      
      Chunking Strategy:
      - Fixed-size chunks: 4MB default
      - Content-defined chunking for dedup
      - Rolling hash (Rabin fingerprint)
      - Chunk metadata storage
      
      Benefits:
      - Efficient deduplication
      - Parallel uploads/downloads
      - Resume capability
      - Delta sync optimization
      
      **2. Synchronization Algorithm:**
      
      Sync Protocol:
      - Client maintains local database
      - Track file modifications (filesystem watcher)
      - Compute file/chunk hashes
      - Send only changed chunks
      - Merkle tree for efficient comparison
      
      Sync Flow:
      1. Detect local changes
      2. Compute chunk hashes
      3. Compare with server state
      4. Upload new/modified chunks
      5. Update metadata
      6. Notify other devices
      7. Download changes to other devices
      
      **3. Deduplication System:**
      
      Implementation:
      - Content-based addressing (SHA-256)
      - Global deduplication across users
      - Reference counting for chunks
      - Lazy deletion when count = 0
      
      Storage Savings:
      - Same file multiple users: 100% savings
      - Similar files: 30-70% savings
      - Version storage: 90% savings
      - Overall: 30-40% reduction
      
      **4. Metadata Management:**
      
      Metadata Structure:
      - File ID, name, size, type
      - Chunk list and hashes
      - Version history
      - Permissions and sharing
      - Timestamps and checksums
      
      Database Design:
      - MySQL for structured metadata
      - Sharded by user_id
      - Read replicas for queries
      - Cache layer for hot data
      
      **5. Storage Architecture:**
      
      Block Storage:
      - Content-addressable storage
      - Distributed across data centers
      - Reed-Solomon erasure coding
      - 3x replication for hot data
      
      Storage Tiers:
      - Hot tier: SSD, frequent access
      - Warm tier: HDD, occasional access
      - Cold tier: Glacier, archival
      - Automatic tier migration
      
      **6. Conflict Resolution:**
      
      Strategies:
      - Last-write-wins for simple conflicts
      - Create conflicted copies
      - Three-way merge for text files
      - User choice for complex conflicts
      
      Implementation:
      - Vector clocks for ordering
      - Operational transformation
      - Conflict-free replicated data types
      - Manual resolution UI
      
      **7. Sharing System:**
      
      Features:
      - User-to-user sharing
      - Public link generation
      - Permission levels (view/edit)
      - Password protection
      - Expiry dates
      
      Implementation:
      - Access control lists
      - Sharing tokens
      - Permission inheritance
      - Activity tracking
      
      **8. Search and Indexing:**
      
      Search Features:
      - Full-text search
      - Metadata search
      - Content search (OCR for images)
      - Fuzzy matching
      
      Implementation:
      - Elasticsearch for indexing
      - Async indexing pipeline
      - Incremental updates
      - Cached search results
    `,
    
    dataFlow: `
      **File Upload Flow:**
      
      1. User adds/modifies file
      2. Client detects change
      3. Calculate file hash
      4. Check if file exists (dedup)
      5. If new file:
         - Chunk file into blocks
         - Compress chunks
         - Encrypt chunks
      6. Upload only new chunks
      7. Update file metadata
      8. Add to user's namespace
      9. Update version history
      10. Trigger sync to other devices
      11. Send notifications
      
      **File Download Flow:**
      
      1. User requests file
      2. Check permissions
      3. Retrieve metadata
      4. Get chunk list
      5. Check local cache
      6. Download missing chunks
      7. Verify chunk integrity
      8. Decrypt chunks
      9. Decompress chunks
      10. Reassemble file
      11. Save to local storage
      12. Update local metadata
      
      **Sync Flow:**
      
      1. Client connects to sync server
      2. Send local state (file list + hashes)
      3. Server compares with cloud state
      4. Identify differences
      5. Send change list to client
      6. Client processes changes:
         - Download new files
         - Upload local changes
         - Delete removed files
      7. Update sync cursor
      8. Maintain long-poll connection
      9. Real-time change notifications
      
      **Sharing Flow:**
      
      1. User initiates share
      2. Select files/folders
      3. Set permissions
      4. Generate sharing token
      5. Create/update ACL
      6. Send invitation
      7. Recipient accepts
      8. Add to recipient's namespace
      9. Set up sync for shared items
      10. Track sharing analytics
      
      **Conflict Resolution Flow:**
      
      1. Detect concurrent modifications
      2. Retrieve all versions
      3. Determine conflict type
      4. Apply resolution strategy:
         - Auto-merge if possible
         - Create conflicted copy
         - Prompt user for choice
      5. Update metadata
      6. Sync resolution to all devices
      7. Maintain conflict history
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Metadata Database**
         Problem: Billions of files, frequent updates
         Solution:
         - Sharding by user_id
         - Read replicas
         - Caching layer
         - Denormalization
      
      2. **Storage I/O**
         Problem: Massive read/write operations
         Solution:
         - Distributed storage
         - SSD for hot data
         - Parallel I/O
         - Prefetching
      
      3. **Network Bandwidth**
         Problem: Large file transfers
         Solution:
         - Compression
         - Delta sync
         - P2P for LAN sync
         - CDN for popular files
      
      4. **Deduplication Processing**
         Problem: Computing hashes for all chunks
         Solution:
         - Client-side hashing
         - Bloom filters
         - Cached hash values
         - Async processing
      
      5. **Sync Latency**
         Problem: Real-time sync expectations
         Solution:
         - Long polling
         - WebSockets
         - Regional servers
         - Priority queues
      
      6. **Version Storage**
         Problem: Storing all versions consumes space
         Solution:
         - Delta storage
         - Compression
         - Tier old versions to cold storage
         - Retention policies
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Storage Scaling:**
         - Horizontal scaling with sharding
         - Geographic distribution
         - Storage pools
         - Dynamic allocation
      
      2. **Service Scaling:**
         - Microservices architecture
         - Stateless services
         - Container orchestration
         - Auto-scaling based on load
      
      3. **Database Scaling:**
         - Master-slave replication
         - Sharding by user_id
         - Separate read/write paths
         - NoSQL for specific use cases
      
      4. **Caching Strategy:**
         - Client-side caching
         - CDN for static content
         - Redis for metadata
         - Block cache for chunks
      
      5. **Geographic Distribution:**
         - Multiple data centers
         - Regional storage
         - Edge locations
         - Cross-region replication
      
      6. **Load Balancing:**
         - DNS load balancing
         - Application load balancers
         - Database connection pooling
         - Request routing by file hash
      
      7. **Optimization Techniques:**
         - Batch operations
         - Async processing
         - Lazy operations
         - Predictive prefetching
    `
  },
  
  architecture: {
    svgPath: '/diagrams/dropbox.svg',
    components: [
      { 
        name: 'Sync Engine', 
        description: 'Handles file synchronization across devices using delta sync' 
      },
      { 
        name: 'Chunking Service', 
        description: 'Splits files into chunks for deduplication and transfer' 
      },
      { 
        name: 'Metadata Service', 
        description: 'Manages file metadata, versions, and permissions' 
      },
      { 
        name: 'Block Storage', 
        description: 'Content-addressable storage for file chunks' 
      },
      { 
        name: 'Deduplication Engine', 
        description: 'Identifies and eliminates duplicate chunks' 
      },
      { 
        name: 'Notification Service', 
        description: 'Sends real-time updates to connected clients' 
      },
      { 
        name: 'Sharing Service', 
        description: 'Manages file sharing and collaboration features' 
      },
      { 
        name: 'CDN', 
        description: 'Distributes frequently accessed files globally' 
      }
    ]
  },
  
  apiDesign: `
    // File Operations API
    
    POST /api/v2/files/upload
    Headers: {
      Authorization: "Bearer token",
      Content-Type: "application/octet-stream"
    }
    Request: {
      path: "/Documents/report.pdf",
      size: 10485760,
      hash: "sha256:abc123...",
      chunks: [
        { index: 0, hash: "sha256:chunk1...", size: 4194304 },
        { index: 1, hash: "sha256:chunk2...", size: 4194304 },
        { index: 2, hash: "sha256:chunk3...", size: 2097152 }
      ]
    }
    Response: {
      file_id: "file_xyz123",
      chunks_to_upload: [0, 2], // Chunks not in storage
      upload_urls: [
        "https://upload.dropbox.com/chunk/0",
        "https://upload.dropbox.com/chunk/2"
      ],
      version: 1
    }
    
    GET /api/v2/files/download
    Query: {
      path: "/Documents/report.pdf",
      version: "latest"
    }
    Response: {
      file_id: "file_xyz123",
      size: 10485760,
      modified: "2024-01-20T10:00:00Z",
      chunks: [
        { url: "https://cdn.dropbox.com/chunk1", expires: 3600 },
        { url: "https://cdn.dropbox.com/chunk2", expires: 3600 },
        { url: "https://cdn.dropbox.com/chunk3", expires: 3600 }
      ]
    }
    
    // Sync API
    
    POST /api/v2/sync/changes
    Request: {
      cursor: "cursor_abc123",
      include_deleted: true
    }
    Response: {
      changes: [{
        type: "file",
        action: "added|modified|deleted",
        path: "/Documents/report.pdf",
        file_id: "file_xyz123",
        hash: "sha256:def456...",
        size: 10485760,
        modified: "2024-01-20T10:00:00Z"
      }],
      cursor: "cursor_def456",
      has_more: false
    }
    
    // Sharing API
    
    POST /api/v2/sharing/create_link
    Request: {
      path: "/Documents/report.pdf",
      access_level: "view|edit",
      password: "optional_password",
      expires: "2024-02-20T10:00:00Z"
    }
    Response: {
      link: "https://dropbox.com/s/abc123/report.pdf",
      expires: "2024-02-20T10:00:00Z",
      access_level: "view"
    }
    
    POST /api/v2/sharing/add_member
    Request: {
      path: "/Projects/Q1",
      email: "colleague@example.com",
      access_level: "edit",
      message: "Please review the Q1 documents"
    }
    Response: {
      member_id: "member_789",
      status: "pending|active"
    }
    
    // Version History API
    
    GET /api/v2/files/versions
    Query: {
      path: "/Documents/report.pdf",
      limit: 10
    }
    Response: {
      versions: [{
        version_id: "v1",
        size: 10485760,
        hash: "sha256:abc...",
        modified: "2024-01-20T10:00:00Z",
        modified_by: "user@example.com"
      }]
    }
    
    POST /api/v2/files/restore
    Request: {
      path: "/Documents/report.pdf",
      version_id: "v1"
    }
    Response: {
      status: "restored",
      new_version: "v5"
    }
    
    // Search API
    
    GET /api/v2/search
    Query: {
      query: "quarterly report",
      type: "file|folder",
      modified_after: "2024-01-01",
      limit: 20
    }
    Response: {
      results: [{
        path: "/Documents/Q1_report.pdf",
        type: "file",
        size: 2048576,
        modified: "2024-01-15T10:00:00Z",
        highlights: ["quarterly", "report"]
      }]
    }
  `,
  
  databaseSchema: {
    sql: `
      -- MySQL for metadata
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        storage_used BIGINT DEFAULT 0,
        storage_quota BIGINT DEFAULT 2147483648,
        created_at TIMESTAMP
      );
      
      CREATE TABLE files (
        file_id VARCHAR(64) PRIMARY KEY,
        user_id BIGINT,
        path VARCHAR(4096),
        name VARCHAR(255),
        size BIGINT,
        hash VARCHAR(64),
        mime_type VARCHAR(128),
        created_at TIMESTAMP,
        modified_at TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_user_path (user_id, path),
        INDEX idx_hash (hash)
      );
      
      CREATE TABLE chunks (
        chunk_hash VARCHAR(64) PRIMARY KEY,
        size INT,
        ref_count INT DEFAULT 1,
        storage_location VARCHAR(255),
        created_at TIMESTAMP
      );
      
      CREATE TABLE file_chunks (
        file_id VARCHAR(64),
        chunk_index INT,
        chunk_hash VARCHAR(64),
        PRIMARY KEY (file_id, chunk_index),
        FOREIGN KEY (file_id) REFERENCES files(file_id),
        FOREIGN KEY (chunk_hash) REFERENCES chunks(chunk_hash)
      );
      
      CREATE TABLE versions (
        version_id VARCHAR(64) PRIMARY KEY,
        file_id VARCHAR(64),
        version_number INT,
        size BIGINT,
        hash VARCHAR(64),
        created_at TIMESTAMP,
        created_by BIGINT,
        INDEX idx_file_version (file_id, version_number)
      );
      
      CREATE TABLE shares (
        share_id VARCHAR(64) PRIMARY KEY,
        file_id VARCHAR(64),
        owner_id BIGINT,
        shared_with VARCHAR(255),
        access_level ENUM('view', 'edit'),
        created_at TIMESTAMP,
        expires_at TIMESTAMP NULL
      );
    `,
    
    nosql: `
      // DynamoDB for sync state
      
      Table: SyncState
      Partition Key: user_id
      Sort Key: device_id
      Attributes:
        cursor: String
        last_sync: Number
        pending_changes: List
      
      Table: FileIndex
      Partition Key: user_id
      Sort Key: path
      Attributes:
        file_id: String
        hash: String
        size: Number
        modified: Number
        chunks: List
      
      // Redis for caching
      
      // File metadata cache
      HSET file:file_xyz123
        path "/Documents/report.pdf"
        size "10485760"
        hash "sha256:abc..."
        chunks "chunk1,chunk2,chunk3"
      
      // User quota
      HSET user:123:quota
        used "1073741824"
        total "2147483648"
      
      // Recent files
      ZADD user:123:recent
        1642339200 "file:file_xyz123"
        1642339100 "file:file_abc456"
      
      // Sharing tokens
      SET share:token:abc123 "file:file_xyz123:view" EX 86400
      
      // Upload sessions
      HSET upload:session:xyz
        file_id "file_xyz123"
        chunks_total "3"
        chunks_uploaded "1,2"
        expires "1642339200"
      
      // Dedup bloom filter
      BF.ADD dedup:chunks "sha256:chunk1"
      BF.EXISTS dedup:chunks "sha256:chunk2"
      
      // MongoDB for activity logs
      
      {
        _id: ObjectId("..."),
        user_id: 123,
        action: "upload|download|share|delete",
        file_id: "file_xyz123",
        path: "/Documents/report.pdf",
        ip_address: "192.168.1.1",
        device_id: "device_abc",
        timestamp: ISODate("2024-01-20T10:00:00Z"),
        details: {
          size: 10485760,
          chunks_uploaded: 3
        }
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Sync Strategy',
      analysis: `
        Block-level Sync (Chosen):
        ✓ Minimal data transfer
        ✓ Fast sync for large files
        ✓ Efficient for small changes
        ✓ Enables deduplication
        ✗ Complex implementation
        ✗ More metadata overhead
        
        File-level Sync:
        ✓ Simple implementation
        ✓ Clear versioning
        ✗ Transfers entire file
        ✗ Slow for large files
        
        Hybrid Approach:
        ✓ Best of both
        ✗ Very complex
        ✗ Two code paths
        
        Decision: Block-level for efficiency
      `
    },
    {
      decision: 'Storage Architecture',
      analysis: `
        Content-Addressable (Chosen):
        ✓ Perfect deduplication
        ✓ Integrity verification
        ✓ Efficient versioning
        ✗ Hash computation overhead
        ✗ No in-place updates
        
        Traditional File System:
        ✓ Simple operations
        ✓ In-place updates
        ✗ No deduplication
        ✗ Versioning complex
        
        Object Storage:
        ✓ Scalable
        ✓ Cloud-native
        ✗ No dedup
        ✗ Higher latency
        
        Decision: CAS for deduplication benefits
      `
    },
    {
      decision: 'Conflict Resolution',
      analysis: `
        Create Copies (Chosen):
        ✓ Never lose data
        ✓ User decides
        ✓ Simple to implement
        ✗ Manual cleanup needed
        
        Last-Write-Wins:
        ✓ Automatic
        ✓ No user intervention
        ✗ Data loss possible
        ✗ Unexpected for users
        
        Operational Transform:
        ✓ Automatic merge
        ✓ Good for text
        ✗ Complex
        ✗ Not for binary files
        
        Decision: Copies for safety, OT for text
      `
    },
    {
      decision: 'Client Architecture',
      analysis: `
        Thick Client (Chosen):
        ✓ Offline support
        ✓ Better performance
        ✓ Local caching
        ✓ Reduce server load
        ✗ Complex client
        ✗ Platform-specific code
        
        Thin Client:
        ✓ Simple client
        ✓ Easy updates
        ✗ No offline support
        ✗ Higher server load
        
        Progressive Web App:
        ✓ Cross-platform
        ✓ No installation
        ✗ Limited file system access
        ✗ Performance limitations
        
        Decision: Thick client for full features
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Dropbox System Design',
        youtubeId: 'U0xTu6E2CT8',
        duration: '19:22'
      },
      { 
        title: 'How Dropbox Stores Billions of Files',
        youtubeId: 'QWQX2FCW8ys',
        duration: '45:30'
      }
    ],
    articles: [
      {
        title: 'How Dropbox Scales to Millions of Users',
        url: 'https://dropbox.tech/infrastructure/how-we-scaled-dropbox'
      },
      {
        title: 'The Dropbox Sync Engine',
        url: 'https://dropbox.tech/infrastructure/streaming-file-synchronization'
      }
    ],
    books: [
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        chapter: 'Chapter 9: Consistency and Consensus'
      }
    ]
  }
}