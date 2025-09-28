// Telegram System Design Question
export default {
  id: 'telegram',
  title: 'Design Telegram',
  companies: ['Telegram', 'WhatsApp', 'Signal', 'Discord', 'Slack'],
  difficulty: 'Hard',
  category: 'Messaging & Communication',
  
  description: 'Design a cloud-based instant messaging platform with support for large groups, channels, end-to-end encryption, media sharing, and multi-device synchronization.',
  
  requirements: {
    functional: [
      'One-to-one messaging with E2E encryption',
      'Group chats up to 200,000 members',
      'Broadcast channels with unlimited subscribers',
      'File sharing up to 2GB per file',
      'Voice and video calls',
      'Multi-device synchronization',
      'Message editing and deletion',
      'Self-destructing messages',
      'Bot platform and API',
      'Stickers and animated emojis',
      'Voice messages and video notes',
      'Cloud storage for all messages',
      'Desktop and mobile clients',
      'Message search across all chats'
    ],
    nonFunctional: [
      '700 million monthly active users',
      '100 billion messages per day',
      'Support groups with 200K members',
      'Channels with 10M+ subscribers',
      'Message delivery < 100ms globally',
      '99.99% availability',
      'File upload/download 100MB/s',
      'Sync across unlimited devices',
      'Store messages indefinitely',
      'End-to-end encryption for secret chats',
      'Support 100K concurrent calls',
      'Bot API handling 1M requests/sec',
      'Distributed across 5+ data centers'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Telegram, a cloud-based messaging platform. The key challenges are:
      
      1. Massive scale with 700M users and 100B messages/day
      2. Large groups (200K) and channels (unlimited)
      3. Multi-device synchronization with cloud storage
      4. Fast global message delivery
      5. Large file transfers (up to 2GB)
      6. End-to-end encryption for secret chats
      7. Bot platform with high throughput
      8. Distributed infrastructure across regions
      
      The system needs to handle instant messaging, file sharing, voice/video calls, and serve as a platform for bots and channels while maintaining sub-100ms message delivery globally.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Base:
      - MAU: 700 million
      - DAU: 350 million (50% of MAU)
      - Peak concurrent: 100 million
      - Average contacts: 100 per user
      - Average active chats: 20 per user
      
      Message Volume:
      - Messages per day: 100 billion
      - Messages per second (avg): 1.15 million
      - Messages per second (peak): 3 million
      - Average message size: 500 bytes
      - Media messages: 20% of total
      
      Groups and Channels:
      - Total groups: 500 million
      - Active groups: 100 million
      - Supergroups (>1K members): 1 million
      - Channels: 5 million
      - Channel subscribers (avg): 10,000
      
      Storage Requirements:
      - Text messages: 100B * 500B * 365 = 18PB/year
      - Media files: 20B * 5MB * 365 = 36PB/year
      - File storage: 10M * 500MB daily = 5PB/day
      - Total storage: 100PB+ active
      - Backup/replication: 300PB total
      
      Bandwidth:
      - Message traffic: 3M * 500B = 1.5GB/s
      - Media uploads: 10GB/s peak
      - Media downloads: 50GB/s peak
      - Total bandwidth: 100GB/s peak
      
      Infrastructure:
      - API servers: 20,000
      - Media servers: 5,000
      - Database nodes: 2,000
      - Cache servers: 10,000
      - CDN edge nodes: 500
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Mobile apps (iOS/Android)
         - Desktop apps (Windows/Mac/Linux)
         - Web client
         - Telegram Bot API clients
      
      2. **API Gateway Layer**
         - MTProto protocol handlers
         - WebSocket connections
         - Load balancers
         - DDoS protection
      
      3. **Core Messaging Services**
         - Message Service
         - Presence Service
         - Notification Service
         - Sync Service
         - Delivery Service
      
      4. **Group & Channel Services**
         - Group Management
         - Channel Broadcasting
         - Permission Service
         - Member Management
      
      5. **Media Services**
         - Media Upload Service
         - Media Processing
         - CDN Distribution
         - Thumbnail Generation
      
      6. **Security Layer**
         - Secret Chat Service (E2E)
         - Key Exchange Service
         - Encryption/Decryption
         - Two-factor authentication
      
      7. **Storage Systems**
         - Message Storage (Cassandra)
         - Media Storage (Distributed FS)
         - User Data (PostgreSQL)
         - Cache Layer (Redis)
      
      **MTProto Protocol:**
      - Custom protocol for speed and security
      - Binary serialization
      - Built-in encryption
      - Automatic reconnection
      - Message acknowledgment system
    `,
    
    detailedDesign: `
      **1. Message Delivery System:**
      
      Message Flow:
      - Client sends message via MTProto
      - API server validates and assigns message_id
      - Message queued for delivery
      - Store in database (Cassandra)
      - Push to recipient's online devices
      - Queue for offline devices
      - Send delivery confirmation
      
      Multi-Device Sync:
      - Cloud-based message storage
      - All devices poll for updates
      - Incremental sync using sequence numbers
      - Conflict resolution by timestamp
      - Background sync for mobile
      
      **2. Group Chat Architecture:**
      
      Regular Groups (up to 200 members):
      - Client-side member list
      - P2P-like distribution
      - All members receive all messages
      
      Supergroups (up to 200,000 members):
      - Server-side member management
      - Paginated member lists
      - Message fanout optimization
      - Admin hierarchy and permissions
      - Anti-spam measures
      
      Message Distribution:
      - Batch processing for large groups
      - Priority queues for active users
      - Lazy loading for inactive members
      - Regional distribution servers
      
      **3. Channel Broadcasting:**
      
      Architecture:
      - One-to-many broadcasting
      - No member limit
      - Read-only for subscribers
      - Optional discussion groups
      
      Distribution Strategy:
      - CDN for media content
      - Regional cache servers
      - Push notifications batching
      - Progressive loading
      
      **4. File Transfer System:**
      
      Upload Process:
      - Chunked uploads (512KB chunks)
      - Parallel chunk upload
      - Resume capability
      - Deduplication by hash
      
      Download Process:
      - Multi-part downloads
      - CDN distribution
      - P2P assistance for popular files
      - Adaptive bitrate for media
      
      Storage:
      - Distributed file system
      - Reed-Solomon erasure coding
      - Geographic replication
      - Hot/cold storage tiers
      
      **5. Secret Chats (E2E Encryption):**
      
      Implementation:
      - Diffie-Hellman key exchange
      - MTProto 2.0 encryption
      - Perfect forward secrecy
      - Self-destruct timers
      - No cloud storage
      - Device-specific (no sync)
      
      **6. Bot Platform:**
      
      Architecture:
      - Webhook and polling modes
      - Inline queries
      - Keyboard interactions
      - Payment integration
      
      Performance:
      - Dedicated bot API servers
      - Rate limiting per bot
      - Async webhook delivery
      - Response caching
      
      **7. Search System:**
      
      Implementation:
      - Local device search (SQLite FTS)
      - Server-side global search
      - Elasticsearch for indexing
      - Fuzzy matching
      - Search filters (date, chat, media type)
    `,
    
    dataFlow: `
      **Message Send Flow:**
      
      1. User types message in client
      2. Client encrypts with MTProto
      3. Send to nearest API server
      4. Server validates auth token
      5. Assign unique message_id
      6. Store in message database
      7. Add to delivery queue
      8. Check recipient status:
         - If online: Push immediately
         - If offline: Store for later
      9. Send to all recipient devices
      10. Return confirmation to sender
      11. Update read receipts
      
      **Group Message Flow:**
      
      1. User sends message to group
      2. API server receives message
      3. Validate user membership
      4. Check group permissions
      5. Store message in group history
      6. Fanout strategy based on size:
         - Small group: Direct push
         - Large group: Batch processing
      7. Queue for each member
      8. Optimize delivery:
         - Active users: Immediate
         - Inactive: Delayed batch
      9. Track delivery status
      
      **File Upload Flow:**
      
      1. Client initiates upload
      2. Server returns upload URL
      3. Split file into chunks
      4. Upload chunks in parallel
      5. Server validates each chunk
      6. Reassemble on completion
      7. Generate file_id and hash
      8. Store in distributed FS
      9. Replicate across regions
      10. Generate thumbnails (if media)
      11. Return file reference
      
      **Channel Broadcast Flow:**
      
      1. Admin posts to channel
      2. Validate admin permissions
      3. Store in channel feed
      4. Generate notification batch
      5. Regional distribution:
         - Split by geography
         - Queue per region
      6. CDN cache for media
      7. Push notifications (batched)
      8. Lazy load for inactive users
      9. Track view count
      
      **Secret Chat Flow:**
      
      1. Initiate secret chat request
      2. Diffie-Hellman key exchange
      3. Generate session keys
      4. E2E encrypt messages
      5. Direct device-to-device
      6. No server storage
      7. Implement self-destruct
      8. Perfect forward secrecy
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Large Group Fanout**
         Problem: 200K members receiving each message
         Solution:
         - Batch processing
         - Priority queues
         - Regional fanout servers
         - Lazy delivery for inactive
      
      2. **File Transfer Bandwidth**
         Problem: 2GB files consuming bandwidth
         Solution:
         - Chunked transfers
         - P2P assistance
         - CDN distribution
         - Compression
      
      3. **Global Message Latency**
         Problem: Sub-100ms delivery worldwide
         Solution:
         - Regional data centers
         - GeoDNS routing
         - Edge servers
         - Connection pooling
      
      4. **Message Storage Growth**
         Problem: 100B messages/day storage
         Solution:
         - Compression
         - Cold storage tiering
         - Deduplication
         - Retention policies
      
      5. **Bot API Load**
         Problem: 1M requests/sec from bots
         Solution:
         - Dedicated bot servers
         - Rate limiting
         - Response caching
         - Webhook batching
      
      6. **Search Performance**
         Problem: Searching billions of messages
         Solution:
         - Local search first
         - Indexed server search
         - Search result caching
         - Progressive loading
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - 5+ data centers globally
         - Regional message routing
         - Local media caches
         - Cross-region replication
      
      2. **Database Scaling:**
         - Cassandra for messages
         - Sharding by user_id
         - Time-based partitioning
         - Read replicas per region
      
      3. **Service Architecture:**
         - Microservices design
         - Horizontal scaling
         - Container orchestration
         - Auto-scaling groups
      
      4. **Caching Strategy:**
         - Multi-layer caching
         - Redis for hot data
         - CDN for media
         - Client-side caching
      
      5. **Message Queue Scaling:**
         - Kafka for message delivery
         - Partition by recipient
         - Multiple consumer groups
         - Backpressure handling
      
      6. **Media Storage:**
         - Distributed file system
         - Erasure coding
         - Geographic replication
         - Hot/cold separation
      
      7. **Connection Management:**
         - Long-lived connections
         - Connection pooling
         - Regional terminators
         - WebSocket compression
    `
  },
  
  architecture: {
    svgPath: '/diagrams/telegram.svg',
    components: [
      { 
        name: 'MTProto Gateway', 
        description: 'Custom protocol handler for secure, fast communication' 
      },
      { 
        name: 'Message Service', 
        description: 'Core messaging logic and delivery system' 
      },
      { 
        name: 'Group Service', 
        description: 'Manages groups and supergroups up to 200K members' 
      },
      { 
        name: 'Channel Service', 
        description: 'Broadcasting to unlimited subscribers' 
      },
      { 
        name: 'Media Service', 
        description: 'Handles file uploads, processing, and distribution' 
      },
      { 
        name: 'Secret Chat Service', 
        description: 'End-to-end encrypted messaging' 
      },
      { 
        name: 'Bot Platform', 
        description: 'API for bot interactions and webhooks' 
      },
      { 
        name: 'Sync Service', 
        description: 'Multi-device message synchronization' 
      }
    ]
  },
  
  apiDesign: `
    // Telegram Bot API
    
    POST /bot{token}/sendMessage
    Request: {
      chat_id: -1001234567890,
      text: "Hello, Telegram!",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "Button 1", callback_data: "btn1" },
          { text: "Button 2", callback_data: "btn2" }
        ]]
      }
    }
    Response: {
      ok: true,
      result: {
        message_id: 123,
        from: { id: 987654321, is_bot: true, username: "MyBot" },
        chat: { id: -1001234567890, title: "Group Name", type: "supergroup" },
        date: 1642339200,
        text: "Hello, Telegram!"
      }
    }
    
    // MTProto API (Client)
    
    messages.sendMessage {
      flags: 0,
      peer: { _: "peerUser", user_id: 123456 },
      message: "Hello!",
      random_id: 7891011,
      reply_to_msg_id: null,
      entities: []
    }
    
    // File Upload API
    
    POST /upload/initiate
    Request: {
      file_size: 104857600,  // 100MB
      file_name: "document.pdf",
      mime_type: "application/pdf"
    }
    Response: {
      upload_id: "upload_xyz",
      chunk_size: 524288,  // 512KB
      total_chunks: 200,
      upload_urls: [
        "https://dc1.telegram.org/upload/chunk",
        "https://dc2.telegram.org/upload/chunk"
      ]
    }
    
    POST /upload/chunk
    Request: {
      upload_id: "upload_xyz",
      chunk_index: 0,
      chunk_data: "base64_encoded_data",
      checksum: "md5_hash"
    }
    Response: {
      chunk_index: 0,
      status: "success"
    }
    
    // Group Management
    
    POST /groups/create
    Request: {
      title: "My Supergroup",
      description: "A large community",
      type: "supergroup",
      is_public: true,
      username: "mysupergroup"
    }
    Response: {
      group_id: -1001234567890,
      invite_link: "https://t.me/mysupergroup",
      member_count: 1
    }
    
    POST /groups/{group_id}/members/add
    Request: {
      user_ids: [123456, 789012],
      forward_limit: 100
    }
    Response: {
      added: 2,
      failed: []
    }
    
    // Channel Broadcasting
    
    POST /channels/{channel_id}/broadcast
    Request: {
      content: {
        text: "Breaking news!",
        media: [{
          type: "photo",
          file_id: "AgACAgIA...",
          caption: "News photo"
        }]
      },
      silent: false,
      scheduled_date: null
    }
    Response: {
      message_id: 456,
      views: 0,
      forwards: 0
    }
    
    // Secret Chat
    
    POST /secret_chat/initiate
    Request: {
      user_id: 123456,
      g_a: "diffie_hellman_public_key"
    }
    Response: {
      chat_id: "secret_chat_789",
      g_b: "server_public_key",
      key_fingerprint: "1234567890abcdef"
    }
    
    // Search API
    
    GET /search/global
    Query: {
      q: "search query",
      type: "messages|media|files|links",
      from_date: "2024-01-01",
      limit: 50
    }
    Response: {
      results: [{
        message_id: 123,
        chat_id: 456,
        text: "...search query...",
        date: 1642339200,
        highlights: [[10, 22]]
      }],
      next_offset: "offset_token"
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for user data
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY,
        phone_hash VARCHAR(64) UNIQUE,
        username VARCHAR(32) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        bio TEXT,
        photo_id VARCHAR(255),
        last_seen TIMESTAMP,
        created_at TIMESTAMP
      );
      
      CREATE TABLE chats (
        chat_id BIGINT PRIMARY KEY,
        type VARCHAR(20), -- private|group|supergroup|channel
        title VARCHAR(255),
        username VARCHAR(32) UNIQUE,
        member_count INT,
        description TEXT,
        created_at TIMESTAMP
      );
      
      CREATE TABLE chat_members (
        chat_id BIGINT,
        user_id BIGINT,
        role VARCHAR(20), -- member|admin|owner
        joined_at TIMESTAMP,
        permissions JSONB,
        PRIMARY KEY (chat_id, user_id)
      );
      
      CREATE TABLE secret_chats (
        chat_id VARCHAR(64) PRIMARY KEY,
        user_a BIGINT,
        user_b BIGINT,
        key_fingerprint VARCHAR(32),
        layer INT,
        ttl INT,
        created_at TIMESTAMP
      );
    `,
    
    nosql: `
      // Cassandra for messages
      
      CREATE TABLE messages (
        chat_id BIGINT,
        message_id BIGINT,
        sender_id BIGINT,
        text TEXT,
        media_ids LIST<TEXT>,
        reply_to_id BIGINT,
        forward_from BIGINT,
        edit_date TIMESTAMP,
        views INT,
        created_at TIMESTAMP,
        PRIMARY KEY (chat_id, message_id)
      ) WITH CLUSTERING ORDER BY (message_id DESC);
      
      CREATE TABLE user_messages (
        user_id BIGINT,
        message_id BIGINT,
        chat_id BIGINT,
        is_read BOOLEAN,
        created_at TIMESTAMP,
        PRIMARY KEY (user_id, created_at, message_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC);
      
      // MongoDB for media metadata
      
      {
        _id: "file_xyz",
        type: "photo|video|document|audio",
        size: 10485760,
        mime_type: "image/jpeg",
        width: 1920,
        height: 1080,
        duration: 120,  // for video/audio
        thumbnail_id: "thumb_abc",
        chunks: [
          { index: 0, location: "dc1/chunk0", checksum: "md5" }
        ],
        access_hash: "hash123",
        created_at: ISODate("2024-01-20"),
        references: 1543  // deduplication count
      }
      
      // Redis for cache and presence
      
      // User presence
      HSET user:123456
        status "online"
        last_seen "1642339200"
        device "mobile"
      
      // Active chats
      ZADD user:123456:chats
        1642339200 "chat:789"
        1642339100 "chat:456"
      
      // Message delivery queue
      LPUSH delivery:user:123456
        "{'chat_id':789,'message_id':123}"
      
      // Typing indicators
      SETEX typing:chat:789:user:123 5 "1"
      
      // Unread counts
      HSET unread:user:123456
        chat:789 "5"
        chat:456 "2"
      
      // Bot session data
      HSET bot:session:abc123
        user_id "123456"
        state "waiting_for_input"
        context "{'step':'name'}"
    `
  },
  
  tradeoffs: [
    {
      decision: 'Message Storage Architecture',
      analysis: `
        Cloud Storage (Chosen):
        ✓ Multi-device sync
        ✓ Message history preserved
        ✓ Search across all messages
        ✓ Device-independent
        ✗ Privacy concerns
        ✗ Storage costs
        
        Device-only Storage:
        ✓ Maximum privacy
        ✓ No server costs
        ✗ No multi-device sync
        ✗ Lost if device lost
        
        Hybrid (Regular + Secret):
        ✓ User choice
        ✓ Balance privacy/features
        ✓ Best of both worlds
        ✗ Complex implementation
        
        Decision: Cloud for regular, device for secret chats
      `
    },
    {
      decision: 'Group Size Limits',
      analysis: `
        Small Groups Only (<1000):
        ✓ Simple implementation
        ✓ Better performance
        ✗ Limited use cases
        
        Unlimited Size:
        ✓ Maximum flexibility
        ✗ Performance issues
        ✗ Spam/moderation hard
        
        Tiered System (Chosen):
        ✓ Groups: 200 members
        ✓ Supergroups: 200K members
        ✓ Channels: Unlimited
        ✓ Optimized per tier
        ✗ Multiple codepaths
        
        Decision: Tiered for flexibility and performance
      `
    },
    {
      decision: 'Protocol Choice',
      analysis: `
        Custom MTProto (Chosen):
        ✓ Optimized for use case
        ✓ Built-in encryption
        ✓ Efficient binary format
        ✓ Mobile-optimized
        ✗ Maintenance burden
        ✗ Non-standard
        
        XMPP:
        ✓ Standard protocol
        ✓ Extensible
        ✗ Verbose XML
        ✗ Not mobile-optimized
        
        Matrix:
        ✓ Decentralized
        ✓ Open standard
        ✗ Complex
        ✗ Higher overhead
        
        Decision: MTProto for performance and control
      `
    },
    {
      decision: 'File Storage Strategy',
      analysis: `
        Unlimited Storage (Chosen):
        ✓ Best user experience
        ✓ Competitive advantage
        ✓ No user limits
        ✗ High storage costs
        ✗ Abuse potential
        
        Limited Free + Paid:
        ✓ Sustainable model
        ✓ Revenue generation
        ✗ User friction
        ✗ Competitive disadvantage
        
        Time-based Expiry:
        ✓ Reduced storage
        ✓ Automatic cleanup
        ✗ User frustration
        ✗ Lost data
        
        Decision: Unlimited with deduplication
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Telegram System Design',
        youtubeId: 'aIC7PlzdvdU',
        duration: '22:15'
      },
      { 
        title: 'MTProto Protocol Explained',
        youtubeId: 'rqj1uR6g3wY',
        duration: '18:30'
      }
    ],
    articles: [
      {
        title: 'Telegram MTProto Protocol',
        url: 'https://core.telegram.org/mtproto'
      },
      {
        title: 'How Telegram Handles Billions of Messages',
        url: 'https://telegram.org/blog/billion'
      }
    ],
    books: [
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        chapter: 'Chapter 5: Replication'
      }
    ]
  }
}