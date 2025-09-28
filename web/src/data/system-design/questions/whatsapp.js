// WhatsApp System Design Question
export default {
  id: 'whatsapp',
  title: 'Design WhatsApp',
  companies: ['Meta', 'Microsoft', 'Amazon'],
  difficulty: 'Medium',
  category: 'Social Media & Communication',
  
  description: 'Design a scalable real-time messaging application that supports one-to-one and group messaging, with features like online presence, read receipts, and media sharing.',
  
  requirements: {
    functional: [
      'One-to-one text messaging',
      'Group messaging (up to 256 users)',
      'Online/offline/last-seen status',
      'Message delivery receipts (sent, delivered, read)',
      'Media sharing (images, videos up to 100MB, documents)',
      'End-to-end encryption',
      'Voice and video calls',
      'Message history synchronization across devices',
      'Push notifications for offline users'
    ],
    nonFunctional: [
      'Support 2 billion active users',
      'Handle 100 billion messages per day',
      'Message delivery latency < 200ms globally',
      '99.99% availability',
      'Messages stored encrypted',
      'Minimal battery and bandwidth usage on mobile',
      'Work on 2G/3G/4G/5G networks',
      'Support message history for 1 year'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design WhatsApp, a real-time messaging system serving 2 billion users globally. The key challenges are:
      
      1. Real-time message delivery at massive scale
      2. Efficient handling of online/offline users
      3. End-to-end encryption while maintaining features
      4. Optimizing for mobile constraints (battery, bandwidth)
      5. Global distribution with low latency
      
      Let me start with understanding the scale and then design the architecture.
    `,
    
    capacityEstimation: `
      **Scale Estimates:**
      
      Users:
      - Total users: 2 billion
      - Daily active users: 500 million
      - Concurrent users: 100 million peak
      - Average user sends: 50 messages/day
      
      Messages:
      - Total messages: 100 billion/day
      - Message rate: 1.2M messages/second average
      - Peak rate: 3M messages/second
      
      Storage:
      - Text message size: ~100 bytes
      - Media message metadata: ~500 bytes
      - Daily text storage: 100B * 100 bytes = 10 TB
      - Daily media storage: 20B * 5MB average = 100 PB
      - Yearly storage: ~40 PB for text + media metadata
      - Media files stored separately in object storage
      
      Bandwidth:
      - Incoming: 1.2M * 1KB = 1.2 GB/s
      - Outgoing (with delivery): 1.2M * 1KB * 2 = 2.4 GB/s
      - Media bandwidth: 100 Gbps globally
      
      Connections:
      - Concurrent WebSocket connections: 100 million
      - Connection servers needed: 100M / 100K per server = 1000 servers
    `,
    
    highLevelDesign: `
      The architecture consists of these main components:
      
      1. **Client Layer**
         - Mobile/Web clients with E2E encryption
         - Local SQLite for message storage
         - WebSocket for real-time communication
      
      2. **Connection Layer**
         - WebSocket Gateway servers
         - Maintains persistent connections
         - Routes messages to correct servers
      
      3. **Application Layer**
         - Message Service: Handles routing and delivery
         - Presence Service: Tracks online/offline status
         - Media Service: Handles file uploads/downloads
         - Notification Service: Push notifications
         - Group Service: Manages group metadata
      
      4. **Storage Layer**
         - Cassandra: Message storage (distributed, write-heavy)
         - Redis: Session data, presence info
         - PostgreSQL: User profiles, contacts
         - S3/Object Storage: Media files
      
      5. **Infrastructure**
         - Message Queue (Kafka): Async processing
         - CDN: Media delivery
         - Load balancers at each layer
      
      Message Flow:
      1. Sender encrypts message client-side
      2. Sends via WebSocket to Gateway
      3. Gateway routes to Message Service
      4. Message Service stores and forwards
      5. If recipient online: deliver via WebSocket
      6. If offline: queue and send push notification
    `,
    
    detailedDesign: `
      **1. Connection Management:**
      
      WebSocket Gateway Design:
      - Sticky sessions using consistent hashing
      - Each server handles ~100K connections
      - Connection registry in Redis: userId -> serverId
      - Heartbeat every 30 seconds
      - Automatic reconnection with exponential backoff
      
      Protocol:
      \`\`\`
      Client -> Gateway: CONNECT {userId, authToken}
      Gateway -> Client: CONNECTED {sessionId}
      Client -> Gateway: MESSAGE {to, encryptedContent, messageId}
      Gateway -> Client: ACK {messageId, timestamp}
      \`\`\`
      
      **2. Message Delivery System:**
      
      Online Message Flow:
      - Sender -> Gateway1 -> Message Service
      - Message Service checks recipient status in Redis
      - If online: get Gateway2 from registry
      - Route directly: Message Service -> Gateway2 -> Recipient
      - Store message asynchronously in Cassandra
      
      Offline Message Flow:
      - Store in Cassandra immediately
      - Add to offline queue (userId -> [messageIds])
      - Trigger push notification service
      - When user comes online, deliver queued messages
      
      **3. End-to-End Encryption:**
      
      Signal Protocol Implementation:
      - Each device has identity key pair
      - Pre-keys uploaded to server
      - Double Ratchet Algorithm for forward secrecy
      - Server never sees plaintext
      
      Key Exchange:
      \`\`\`
      1. Alice requests Bob's pre-key bundle
      2. Alice creates shared secret using X3DH
      3. Alice encrypts message with shared key
      4. Bob decrypts using his private key
      5. Both derive new keys (ratchet forward)
      \`\`\`
      
      **4. Group Messaging:**
      
      Sender-side fan-out approach:
      - Client encrypts message for each group member
      - Sends bundle to server
      - Server fans out to all recipients
      - Trade-off: More bandwidth vs server simplicity
      
      Group metadata stored in PostgreSQL:
      - group_id, name, members[], admins[]
      - Member changes trigger key rotation
      
      **5. Media Handling:**
      
      Upload flow:
      1. Client requests upload URL from Media Service
      2. Encrypts file client-side
      3. Uploads to S3 via presigned URL
      4. Sends message with media metadata
      
      Download flow:
      1. Receive message with media reference
      2. Request download URL from Media Service
      3. Download from CDN
      4. Decrypt client-side
      
      **6. Presence System:**
      
      Status tracking:
      - Online: Active WebSocket connection
      - Last seen: Timestamp of last activity
      - Typing: Temporary status (expires after 10s)
      
      Implementation:
      - Redis SET: online_users {userId: timestamp}
      - Pub/Sub for real-time updates
      - Batch updates to reduce load
    `,
    
    dataFlow: `
      **Sending a Message:**
      
      1. Alice types message in chat with Bob
      2. Client generates unique messageId (UUID)
      3. Client encrypts using Bob's public key
      4. Send via WebSocket:
         \`{
           type: "message",
           to: "bob_id",
           encrypted_body: "...",
           messageId: "uuid",
           timestamp: 1234567890
         }\`
      
      5. Gateway receives, authenticates Alice
      6. Routes to Message Service
      7. Message Service:
         - Validates request
         - Checks Bob's status in Redis
         - Stores in Cassandra (async)
         - If Bob online: forwards to Bob's Gateway
         - If offline: queues and triggers push notification
      
      8. Bob's Gateway delivers via WebSocket
      9. Bob's client:
         - Decrypts message
         - Stores locally
         - Shows in UI
         - Sends delivery receipt
      
      **Read Receipts Flow:**
      
      1. Bob reads message
      2. Client sends read receipt:
         \`{type: "receipt", messageId: "uuid", status: "read"}\`
      3. Gateway routes to Message Service
      4. Message Service forwards to Alice if online
      5. Updates message status in database
      
      **Group Message Flow:**
      
      1. Alice sends to group (50 members)
      2. Client encrypts message 50 times (once per member)
      3. Sends bundle to server
      4. Message Service fans out to all online members
      5. Queues for offline members
      6. Stores single copy in database with recipient list
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Connection Gateway Overload**
         - Problem: 100M concurrent WebSocket connections
         - Solution: Horizontal scaling, connection pooling
         - Use multiple ports per server
         - Regional distribution
      
      2. **Message Database Hot Partitions**
         - Problem: Celebrity users cause hot shards
         - Solution: Separate queues for high-volume users
         - Multiple partition keys per user
         - Read replicas for popular content
      
      3. **Media Upload/Download Bandwidth**
         - Problem: 100GB/s media transfer globally
         - Solution: Direct S3 uploads with presigned URLs
         - CDN for downloads
         - Compression and quality options
      
      4. **Encryption Overhead on Client**
         - Problem: Battery drain from encryption
         - Solution: Hardware acceleration where available
         - Batch encryption operations
         - Cache session keys
      
      5. **Push Notification Delays**
         - Problem: iOS/Android notification services rate limits
         - Solution: Batch notifications
         - Priority queues for important messages
         - Fallback to SMS for critical alerts
      
      6. **Group Message Fan-out**
         - Problem: Large groups (256 members) create amplification
         - Solution: Async fan-out using message queues
         - Batch delivery to offline members
         - Consider server-side fan-out for very large groups
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Deploy in 20+ regions globally
         - Users connect to nearest data center
         - Cross-region replication for messages
         - Regional message routing
      
      2. **Database Scaling:**
         
         Cassandra (Messages):
         - Partition by (userId, timestamp)
         - 3x replication per region
         - TTL for old messages (1 year)
         - Separate cluster for media metadata
         
         Redis (Presence/Sessions):
         - Redis Cluster with sharding
         - Separate clusters for different data types
         - Local caches in application servers
      
      3. **Connection Layer Scaling:**
         - Auto-scaling based on connection count
         - Connection draining for graceful updates
         - Kubernetes for orchestration
         - Service mesh for internal communication
      
      4. **Message Queue Scaling:**
         - Kafka with topic partitioning
         - Partition by userId for ordering
         - Separate clusters for different message types
         - Dead letter queues for failed deliveries
      
      5. **Optimization Techniques:**
         - Message batching for group sends
         - Compression (gzip) for text messages
         - Delta sync for message history
         - Lazy loading of old messages
         - Adaptive quality for media based on network
      
      6. **Monitoring and Auto-scaling:**
         - Metrics: Message latency, delivery rate, connection count
         - Auto-scale based on CPU, memory, connection count
         - Circuit breakers for failing services
         - Gradual rollout for new features
    `
  },
  
  architecture: {
    svgPath: '/diagrams/whatsapp.svg',
    components: [
      { 
        name: 'WebSocket Gateway', 
        description: 'Maintains persistent connections with clients, handles 100K connections per server' 
      },
      { 
        name: 'Message Service', 
        description: 'Routes messages between users, handles delivery logic and receipts' 
      },
      { 
        name: 'Presence Service', 
        description: 'Tracks online/offline status and last seen timestamps' 
      },
      { 
        name: 'Media Service', 
        description: 'Handles file uploads/downloads with encryption' 
      },
      { 
        name: 'Notification Service', 
        description: 'Sends push notifications via APNS/FCM for offline users' 
      },
      { 
        name: 'Cassandra', 
        description: 'Distributed database for message storage with high write throughput' 
      },
      { 
        name: 'Redis Cluster', 
        description: 'Stores session data, presence info, and message queues' 
      },
      { 
        name: 'Kafka', 
        description: 'Message queue for async processing and reliability' 
      },
      { 
        name: 'S3/Object Storage', 
        description: 'Stores encrypted media files with CDN integration' 
      }
    ]
  },
  
  apiDesign: `
    // WebSocket Messages
    
    // Connection
    Client -> Server: 
    {
      type: "connect",
      userId: "user123",
      deviceId: "device456",
      authToken: "jwt_token"
    }
    
    Server -> Client:
    {
      type: "connected",
      sessionId: "session789",
      serverTime: 1234567890
    }
    
    // Send Message
    Client -> Server:
    {
      type: "message",
      messageId: "msg_uuid",
      to: "recipient_id",
      groupId: null,
      encryptedContent: "base64_encrypted",
      mediaRef: null,
      timestamp: 1234567890
    }
    
    // Message Delivery
    Server -> Client:
    {
      type: "message",
      messageId: "msg_uuid",
      from: "sender_id",
      encryptedContent: "base64_encrypted",
      timestamp: 1234567890
    }
    
    // Receipts
    Client -> Server:
    {
      type: "receipt",
      messageId: "msg_uuid",
      status: "delivered" | "read"
    }
    
    // Presence Update
    Server -> Client:
    {
      type: "presence",
      userId: "user123",
      status: "online" | "offline" | "typing",
      lastSeen: 1234567890
    }
    
    // REST APIs
    
    // Get Pre-keys for E2E Encryption
    GET /api/users/{userId}/prekeys
    Response: {
      identityKey: "base64_public_key",
      signedPreKey: {...},
      oneTimePreKey: {...}
    }
    
    // Upload Media
    POST /api/media/upload
    Request: {
      contentType: "image/jpeg",
      size: 1024000,
      hash: "sha256_hash"
    }
    Response: {
      uploadUrl: "https://s3.presigned.url",
      mediaId: "media_uuid"
    }
    
    // Get Message History
    GET /api/messages?conversationId={id}&before={timestamp}&limit=50
    Response: {
      messages: [{
        messageId: "uuid",
        encryptedContent: "...",
        timestamp: 1234567890,
        status: "delivered"
      }]
    }
    
    // Group Management
    POST /api/groups
    PUT /api/groups/{groupId}/members
    DELETE /api/groups/{groupId}/members/{userId}
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for user and group data
      
      CREATE TABLE users (
        user_id VARCHAR(36) PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        status_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP,
        public_key TEXT NOT NULL,
        devices JSONB -- Array of device info
      );
      
      CREATE TABLE contacts (
        user_id VARCHAR(36),
        contact_user_id VARCHAR(36),
        nickname VARCHAR(255),
        blocked BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (user_id, contact_user_id)
      );
      
      CREATE TABLE groups (
        group_id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        avatar_url TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        encryption_key TEXT
      );
      
      CREATE TABLE group_members (
        group_id VARCHAR(36),
        user_id VARCHAR(36),
        role VARCHAR(20), -- 'admin' or 'member'
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      );
    `,
    
    nosql: `
      // Cassandra for messages
      
      CREATE TABLE messages (
        conversation_id TEXT, // userId for 1-1, groupId for groups
        message_id UUID,
        timestamp TIMESTAMP,
        sender_id TEXT,
        encrypted_content TEXT,
        media_ref TEXT,
        status TEXT, // sent, delivered, read
        PRIMARY KEY (conversation_id, timestamp, message_id)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);
      
      CREATE TABLE user_conversations (
        user_id TEXT,
        conversation_id TEXT,
        last_message_id UUID,
        last_message_time TIMESTAMP,
        unread_count INT,
        PRIMARY KEY (user_id, last_message_time, conversation_id)
      ) WITH CLUSTERING ORDER BY (last_message_time DESC);
      
      // Redis structures
      
      // Online users
      SET online_users = {
        "user123": "gateway_server_5",
        "user456": "gateway_server_12"
      }
      
      // Presence data
      HASH presence:user123 = {
        "status": "online",
        "last_seen": "1234567890",
        "typing_in": "conversation_id"
      }
      
      // Offline message queue
      LIST offline_queue:user123 = [
        "message_id_1",
        "message_id_2"
      ]
      
      // Session data
      HASH session:session_id = {
        "user_id": "user123",
        "device_id": "device456",
        "gateway": "server_5",
        "connected_at": "1234567890"
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Client-side vs Server-side Encryption',
      analysis: `
        Client-side E2E Encryption (Chosen):
        ✓ True privacy - server can't read messages
        ✓ User trust and legal compliance
        ✓ No server-side key management
        ✗ More complex client implementation
        ✗ Features like server-side search impossible
        ✗ Higher battery usage
        
        Server-side Encryption:
        ✓ Simpler client implementation
        ✓ Server-side features possible
        ✗ Server can read messages
        ✗ Legal/privacy concerns
        
        Decision: E2E encryption is core to WhatsApp's value proposition
      `
    },
    {
      decision: 'Message Storage Strategy',
      analysis: `
        Store Forever vs Time-based Deletion:
        
        Current approach - 1 year retention:
        ✓ Reasonable history for users
        ✓ Manageable storage costs
        ✓ GDPR compliance easier
        ✗ Users may want longer history
        
        Alternative - User-controlled:
        ✓ Users choose retention period
        ✗ Complex to implement
        ✗ Variable storage costs
        
        Decision: Default 1 year with option for users to backup locally
      `
    },
    {
      decision: 'Push vs Pull for Message Delivery',
      analysis: `
        Push (WebSocket) - Chosen:
        ✓ Real-time delivery
        ✓ Lower latency
        ✓ Better user experience
        ✗ Requires persistent connections
        ✗ More server resources
        
        Pull (Polling):
        ✓ Simpler implementation
        ✓ Works with firewalls
        ✗ Higher latency
        ✗ Wastes bandwidth
        
        Hybrid approach: WebSocket when possible, fall back to polling
      `
    },
    {
      decision: 'Group Message Fan-out',
      analysis: `
        Sender-side fan-out (Current):
        ✓ Server simplicity
        ✓ True E2E encryption for groups
        ✗ More bandwidth from sender
        ✗ Slow for large groups
        
        Server-side fan-out:
        ✓ Efficient for large groups
        ✓ Less client bandwidth
        ✗ Breaks E2E encryption model
        
        Decision: Sender-side up to 256 members, consider server-side for larger broadcast lists
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'WhatsApp System Design - Gaurav Sen',
        youtubeId: 'vvhC64hQZMk',
        duration: '19:34'
      },
      { 
        title: 'Chat Application System Design - Tech Dummies',
        youtubeId: 'xyLO8ZAk2KE',
        duration: '24:15'
      },
      {
        title: 'WhatsApp End-to-End Encryption Explained',
        youtubeId: 'tpJJkgLNqUo',
        duration: '12:45'
      }
    ],
    articles: [
      {
        title: 'The WhatsApp Architecture Facebook Bought For $19 Billion',
        url: 'https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/'
      },
      {
        title: 'WhatsApp Engineering - Inside Story',
        url: 'https://www.youtube.com/watch?v=6LgQ3HQVVEU'
      },
      {
        title: 'Signal Protocol - Technical Documentation',
        url: 'https://signal.org/docs/'
      }
    ],
    books: [
      {
        title: 'System Design Interview – An Insider\'s Guide',
        author: 'Alex Xu',
        chapter: 'Chapter 12: Design a Chat System'
      }
    ]
  }
}