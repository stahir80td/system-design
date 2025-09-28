// Discord System Design Question
export default {
  id: 'discord',
  title: 'Design Discord',
  companies: ['Discord', 'Slack', 'Microsoft Teams', 'Telegram', 'Matrix'],
  difficulty: 'Hard',
  category: 'Social Media & Communication',
  
  description: 'Design a real-time communication platform that supports text/voice/video channels, servers with millions of users, rich presence, screen sharing, and low-latency gaming communication.',
  
  requirements: {
    functional: [
      'Text messaging with rich media support',
      'Voice channels with spatial audio',
      'Video calls and screen sharing',
      'Server/Guild system with channels',
      'Role-based permissions (extremely granular)',
      'Direct messages and group DMs',
      'Rich presence (game activity, status)',
      'Message history and search',
      'File sharing (up to 500MB for Nitro)',
      'Reactions and threaded conversations',
      'Slash commands and bots',
      'Go Live streaming for games',
      'Stage channels for events',
      'Forum channels for organized discussions'
    ],
    nonFunctional: [
      'Support 150 million monthly active users',
      '14 million concurrent users',
      '4 billion messages per day',
      'Voice latency < 60ms (gaming requirement)',
      'Text message delivery < 100ms',
      '99.99% uptime',
      'Servers with up to 1 million members',
      'Support 10,000 online members per server',
      'Message history forever (billions of messages)',
      'Real-time typing indicators',
      'Cross-platform sync'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Discord, a real-time communication platform. The key challenges are:
      
      1. Ultra-low latency for gaming voice chat (< 60ms)
      2. Complex permission system with role hierarchies
      3. Massive servers with 1M+ members
      4. Real-time message delivery to millions
      5. Voice/video infrastructure at scale
      6. Rich presence system for gaming
      7. Message history storage (billions of messages)
      8. Bot ecosystem and slash commands
      
      The system needs to handle everything from small friend groups to massive communities while maintaining the low latency required for gaming.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Metrics:
      - Monthly active users: 150 million
      - Daily active users: 50 million
      - Concurrent users: 14 million
      - Average session: 2.5 hours
      
      Messaging:
      - Messages per day: 4 billion
      - Messages per second: 46,000 average, 150,000 peak
      - Average message size: 200 bytes
      - Daily message storage: 800GB
      - With media/attachments: 5TB/day
      
      Voice Channels:
      - Concurrent voice users: 3 million
      - Voice servers needed: 30,000
      - Bandwidth per user: 64 kbps
      - Total voice bandwidth: 192 Gbps
      
      Servers (Guilds):
      - Total servers: 20 million
      - Active servers: 8 million daily
      - Average channels per server: 25
      - Average members per server: 50
      - Large servers (>10K members): 50,000
      
      Storage Requirements:
      - Message history: 10 trillion messages
      - Storage for messages: 2PB (compressed)
      - Media storage: 500PB
      - User data and metadata: 50TB
      - Total with redundancy: 2 Exabytes
      
      Gateway Connections:
      - WebSocket connections: 14 million
      - Events per second: 10 million
      - Gateway servers: 1,000
      - Connections per server: 14,000
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Desktop app (Electron)
         - Mobile apps (React Native)
         - Web app
         - Console integrations
      
      2. **Gateway (WebSocket)**
         - Real-time event streaming
         - Presence updates
         - Heartbeat management
         - Sharding for scale
      
      3. **Core Services**
         - Message Service
         - Voice Service
         - Video Service
         - Presence Service
         - Permission Service
         - Guild Service
         - Channel Service
      
      4. **Storage Layer**
         - Cassandra (messages)
         - PostgreSQL (guild data)
         - Redis (sessions/presence)
         - S3 (media files)
      
      5. **Voice Infrastructure**
         - Voice servers (UDP)
         - WebRTC for video
         - Opus codec
         - Echo cancellation
      
      6. **CDN & Media**
         - CloudFlare CDN
         - Media proxy
         - Image resizing
         - Video transcoding
      
      **Gateway Sharding Strategy:**
      
      Discord uses sharding to distribute load across multiple gateway instances. Each shard handles a subset of guilds, determined by:
      - Guild ID modulo shard count
      - Ensures all events for a guild go through same shard
      - Enables horizontal scaling
      - Typical shard handles ~2,500 guilds
    `,
    
    detailedDesign: `
      **1. Snowflake ID System:**
      
      Discord uses Snowflake IDs - 64-bit integers that encode:
      - Timestamp (42 bits) - milliseconds since Discord epoch
      - Worker ID (10 bits) - identifies the worker that generated it
      - Process ID (5 bits) - identifies the process
      - Sequence (12 bits) - increments for IDs in same millisecond
      
      Benefits:
      - Globally unique without coordination
      - Roughly sortable by creation time
      - Can extract creation timestamp from ID
      - No need for central ID generator
      
      **2. Permission System Architecture:**
      
      Discord's permission system is incredibly complex with multiple layers:
      
      Role Hierarchy:
      - Server owner has all permissions
      - Roles have position/hierarchy
      - Higher roles can manage lower ones
      - @everyone role as baseline
      
      Permission Calculation:
      - Start with @everyone permissions
      - OR all role permissions together
      - Apply channel-specific overwrites
      - Member overwrites take precedence
      - Administrator bypasses everything
      
      Permission Types:
      - Guild-level (kick, ban, manage server)
      - Channel-level (send messages, connect to voice)
      - Overrides can explicitly allow or deny
      
      **3. Message Storage Strategy:**
      
      Cassandra for Messages:
      - Partitioned by channel_id and time bucket
      - Time buckets prevent huge partitions
      - Allows efficient range queries
      - Replication factor of 3
      
      Message Flow:
      - Store in Cassandra immediately
      - Cache recent messages in Redis
      - CDN for media attachments
      - Full-text search in Elasticsearch
      
      **4. Voice Server Architecture:**
      
      Voice Region Selection:
      - Multiple regions globally
      - Automatic selection based on latency
      - Manual override available
      - Failover to nearby regions
      
      Audio Pipeline:
      - Opus codec for compression
      - 48kHz sampling rate
      - Variable bitrate (8-128 kbps)
      - Forward Error Correction
      - Jitter buffer for smooth playback
      
      Voice Processing:
      - Noise suppression (Krisp integration)
      - Echo cancellation
      - Automatic gain control
      - Voice activity detection
      
      **5. Rich Presence System:**
      
      Activity Types:
      - Playing (game detection)
      - Streaming (Twitch/YouTube)
      - Listening (Spotify integration)
      - Watching (YouTube/Netflix)
      - Custom status
      - Competing (tournaments)
      
      Game Detection:
      - Process scanning on desktop
      - Game SDK integration
      - Rich presence API for developers
      - Assets hosted on Discord CDN
      
      **6. Gateway Event System:**
      
      Event Types:
      - MESSAGE_CREATE/UPDATE/DELETE
      - GUILD_MEMBER_ADD/REMOVE/UPDATE
      - PRESENCE_UPDATE
      - VOICE_STATE_UPDATE
      - TYPING_START
      - And 50+ more event types
      
      Event Distribution:
      - Only send relevant events to clients
      - Intent system to reduce bandwidth
      - Compression with zlib
      - ETF encoding option for efficiency
      
      **7. Bot Ecosystem:**
      
      Bot Architecture:
      - Separate bot gateway
      - Higher rate limits
      - Privileged intents require approval
      - Slash commands for interactions
      
      Scaling Bots:
      - Sharding for large bots
      - Gateway resuming for disconnections
      - Rate limiting per route
      - Global rate limit handling
      
      **8. Stage Channels:**
      
      Special voice channel type for events:
      - Designated speakers
      - Audience members muted by default
      - Request to speak feature
      - Supports 1,000+ listeners
      - Lower quality for audience
    `,
    
    dataFlow: `
      **Message Send Flow:**
      
      1. User types message in client
      2. Client sends via Gateway WebSocket
      3. Gateway validates session
      4. Message Service checks permissions
      5. Generate Snowflake ID
      6. Process mentions and embeds
      7. Store in Cassandra
      8. Update channel last_message_id
      9. Publish to Gateway
      10. Gateway broadcasts to online recipients
      11. Push notifications for mobile users
      12. Update unread indicators
      
      **Voice Channel Join Flow:**
      
      1. User clicks on voice channel
      2. Client requests voice server endpoint
      3. Select geographically closest server
      4. Reserve slot on voice server
      5. Exchange ICE candidates
      6. Establish UDP connection
      7. Start sending Opus-encoded audio
      8. Voice server mixes and forwards
      9. Update voice states
      10. Broadcast presence to channel
      
      **Guild Join Flow:**
      
      1. User accepts invite or joins via discovery
      2. Create member record
      3. Assign default roles
      4. Calculate permissions for all channels
      5. Load message history
      6. Subscribe to guild events
      7. Send GUILD_CREATE event
      8. Sync member list and presences
      9. Load guild emojis and stickers
      10. Start receiving real-time updates
      
      **Rich Presence Update Flow:**
      
      1. Game process detected on client
      2. Client sends presence update
      3. Presence service validates data
      4. Store in Redis with TTL
      5. Calculate who should receive update
      6. Broadcast to friends
      7. Broadcast to mutual guilds
      8. Update user profile card
      
      **Slash Command Flow:**
      
      1. User types / to see commands
      2. Client fetches command list
      3. User selects and fills parameters
      4. Send interaction to bot
      5. Bot has 3 seconds to acknowledge
      6. Bot processes command
      7. Bot sends response
      8. Response shown to user/channel
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Large Server Member Lists**
         Problem: Servers with 1M+ members
         Solution:
         - Lazy loading member lists
         - Offline members not sent initially
         - Pagination for member fetching
         - Member list virtualization in client
      
      2. **Message History in Popular Channels**
         Problem: Channels with millions of messages
         Solution:
         - Time-bucketed partitions
         - Archive old buckets to cold storage
         - Cache recent messages aggressively
         - Indexes for jump-to-date
      
      3. **Gateway Connection Storms**
         Problem: Mass reconnections after outage
         Solution:
         - Exponential backoff
         - Session resuming
         - Regional gateway clusters
         - Connection queue management
      
      4. **Voice Server Capacity**
         Problem: Popular servers hit voice limits
         Solution:
         - Dynamic server allocation
         - Voice region overflow
         - Reduced quality for large calls
         - Stage channels for events
      
      5. **Permission Calculations**
         Problem: Complex permission checks
         Solution:
         - Permission cache per user
         - Invalidate on role changes
         - Batch permission calculations
         - Denormalize critical permissions
      
      6. **Rich Presence Updates**
         Problem: Millions of presence updates
         Solution:
         - Presence sharding
         - Update coalescing
         - Smart client filtering
         - TTL-based cleanup
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Horizontal Sharding:**
         - Gateway sharded by guild
         - Voice servers by region
         - Message storage by channel
         - Presence by user ID hash
      
      2. **Geographic Distribution:**
         - Regional clusters globally
         - Voice servers in all regions
         - CDN for media files
         - Edge caching for API
      
      3. **Service Architecture:**
         - Microservices in Elixir/Rust
         - gRPC for internal communication
         - Service mesh for routing
         - Circuit breakers
      
      4. **Caching Strategy:**
         - Redis for hot data
         - Local caches in services
         - CDN for static content
         - Browser caching
      
      5. **Database Scaling:**
         - Cassandra for messages
         - PostgreSQL with read replicas
         - Redis clustering
         - S3 for media
      
      6. **Load Balancing:**
         - Anycast for initial connection
         - Consistent hashing for services
         - Least connections for voice
         - Geographic routing
    `
  },
  
  architecture: {
    svgPath: '/diagrams/discord.svg',
    components: [
      { 
        name: 'Gateway', 
        description: 'WebSocket servers handling real-time events and presence' 
      },
      { 
        name: 'Message Service', 
        description: 'Handles message CRUD, storage, and distribution' 
      },
      { 
        name: 'Voice Servers', 
        description: 'Regional servers handling voice chat with Opus codec' 
      },
      { 
        name: 'Permission Service', 
        description: 'Complex hierarchical permission calculation engine' 
      },
      { 
        name: 'Presence Service', 
        description: 'Tracks user status, activities, and game detection' 
      },
      { 
        name: 'Guild Service', 
        description: 'Manages servers, channels, roles, and members' 
      },
      { 
        name: 'Cassandra Cluster', 
        description: 'Distributed storage for trillions of messages' 
      },
      { 
        name: 'CDN', 
        description: 'CloudFlare CDN for media files and attachments' 
      }
    ]
  },
  
  apiDesign: `
    // Gateway WebSocket Protocol
    
    WS wss://gateway.discord.gg/?v=10&encoding=json
    
    // Identify (Client -> Server)
    {
      "op": 2,
      "d": {
        "token": "Bot TOKEN",
        "intents": 32767,
        "properties": {
          "$os": "linux",
          "$browser": "disco",
          "$device": "disco"
        },
        "shard": [0, 1],
        "presence": {
          "status": "online",
          "afk": false
        }
      }
    }
    
    // Heartbeat (Client -> Server)
    {
      "op": 1,
      "d": 251
    }
    
    // Message Create Event (Server -> Client)
    {
      "op": 0,
      "t": "MESSAGE_CREATE",
      "s": 252,
      "d": {
        "id": "1062456789123456789",
        "channel_id": "1062456789123456789",
        "guild_id": "1062456789123456789",
        "author": {
          "id": "1062456789123456789",
          "username": "user",
          "discriminator": "0001",
          "avatar": "hash"
        },
        "content": "Hello, world!",
        "timestamp": "2024-01-20T10:00:00.000Z",
        "edited_timestamp": null,
        "tts": false,
        "mention_everyone": false,
        "mentions": [],
        "attachments": [],
        "embeds": []
      }
    }
    
    // REST API Examples
    
    GET /api/v10/channels/{channel_id}/messages
    Query: {
      limit: 100,
      before: "1062456789123456789",
      after: "1062456789123456789"
    }
    Response: [
      {
        "id": "1062456789123456789",
        "content": "Message content",
        "author": {...},
        "timestamp": "2024-01-20T10:00:00.000Z"
      }
    ]
    
    POST /api/v10/channels/{channel_id}/messages
    Request: {
      "content": "Hello!",
      "embeds": [{
        "title": "Embed Title",
        "description": "Embed Description",
        "color": 5814783
      }],
      "message_reference": {
        "message_id": "1062456789123456789"
      }
    }
    
    PUT /api/v10/guilds/{guild_id}/members/{user_id}/roles/{role_id}
    Response: 204 No Content
    
    POST /api/v10/channels/{channel_id}/voice-states/@me
    Request: {
      "channel_id": "1062456789123456789",
      "self_mute": false,
      "self_deaf": false
    }
    
    // Slash Command Interaction
    POST /api/v10/interactions/{interaction_id}/{interaction_token}/callback
    Request: {
      "type": 4,
      "data": {
        "content": "Command response!",
        "embeds": [...],
        "flags": 64  // Ephemeral
      }
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for guild and user data
      
      CREATE TABLE guilds (
        guild_id BIGINT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        owner_id BIGINT NOT NULL,
        icon VARCHAR(255),
        created_at TIMESTAMP,
        member_count INTEGER DEFAULT 0,
        features TEXT[],
        premium_tier INTEGER DEFAULT 0,
        system_channel_id BIGINT,
        rules_channel_id BIGINT,
        INDEX idx_owner (owner_id)
      );
      
      CREATE TABLE members (
        guild_id BIGINT,
        user_id BIGINT,
        nick VARCHAR(32),
        joined_at TIMESTAMP,
        roles BIGINT[],
        deaf BOOLEAN DEFAULT FALSE,
        mute BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (guild_id, user_id),
        INDEX idx_user (user_id)
      );
      
      CREATE TABLE channels (
        channel_id BIGINT PRIMARY KEY,
        guild_id BIGINT,
        type INTEGER, -- 0=text, 2=voice, 4=category, 13=stage
        name VARCHAR(100),
        position INTEGER,
        parent_id BIGINT,
        topic TEXT,
        nsfw BOOLEAN DEFAULT FALSE,
        last_message_id BIGINT,
        rate_limit_per_user INTEGER DEFAULT 0,
        user_limit INTEGER, -- for voice channels
        INDEX idx_guild (guild_id)
      );
      
      CREATE TABLE roles (
        role_id BIGINT PRIMARY KEY,
        guild_id BIGINT,
        name VARCHAR(100),
        permissions BIGINT,
        position INTEGER,
        color INTEGER,
        hoist BOOLEAN DEFAULT FALSE,
        mentionable BOOLEAN DEFAULT FALSE,
        INDEX idx_guild (guild_id)
      );
      
      CREATE TABLE overwrites (
        channel_id BIGINT,
        target_id BIGINT, -- role_id or user_id
        type INTEGER, -- 0=role, 1=member
        allow BIGINT,
        deny BIGINT,
        PRIMARY KEY (channel_id, target_id),
        INDEX idx_channel (channel_id)
      );
    `,
    
    nosql: `
      // Cassandra for message storage
      
      CREATE KEYSPACE discord WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'datacenter1': 3
      };
      
      CREATE TABLE messages (
        channel_id BIGINT,
        bucket BIGINT, -- time bucket (e.g., day)
        message_id BIGINT,
        author_id BIGINT,
        content TEXT,
        timestamp TIMESTAMP,
        edited_timestamp TIMESTAMP,
        attachments TEXT, -- JSON
        embeds TEXT, -- JSON
        mentions LIST<BIGINT>,
        reactions MAP<TEXT, INT>, -- emoji -> count
        PRIMARY KEY ((channel_id, bucket), message_id)
      ) WITH CLUSTERING ORDER BY (message_id DESC);
      
      CREATE TABLE message_edits (
        message_id BIGINT,
        edit_timestamp TIMESTAMP,
        old_content TEXT,
        new_content TEXT,
        PRIMARY KEY (message_id, edit_timestamp)
      );
      
      // Redis for presence and cache
      
      // User presence
      HSET presence:123456
        status "online"
        activities '[{"type":0,"name":"Valorant"}]'
        client_status '{"desktop":"online"}'
      EXPIRE presence:123456 300
      
      // Voice states
      HSET voice:guild:789
        user:123 '{"channel_id":"456","self_mute":false}'
        user:456 '{"channel_id":"456","self_mute":true}'
      
      // Gateway sessions
      HSET session:abc123
        user_id "123456"
        guilds "[789, 012, 345]"
        intents 32767
        sequence 251
      
      // Recent messages cache
      LPUSH messages:channel:456 "{...message_json...}"
      LTRIM messages:channel:456 0 99
      
      // Typing indicators
      ZADD typing:channel:456 1705744800 "user:123"
      ZREMRANGEBYSCORE typing:channel:456 0 {5_seconds_ago}
      
      // MongoDB for analytics and bots
      
      {
        _id: "interaction_123",
        type: "slash_command",
        guild_id: "789",
        channel_id: "456",
        user_id: "123",
        command: "play",
        options: {
          song: "Never Gonna Give You Up"
        },
        responded: true,
        timestamp: ISODate("2024-01-20T10:00:00Z")
      }
      
      {
        _id: "analytics_789",
        guild_id: "789",
        date: ISODate("2024-01-20"),
        messages_sent: 12456,
        voice_minutes: 34567,
        active_users: 234,
        new_members: 12,
        left_members: 5
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Gateway vs REST',
      analysis: `
        REST Only:
        ✓ Simple, stateless
        ✓ Easy load balancing
        ✗ Polling inefficient
        ✗ Not real-time
        
        WebSocket Gateway (Chosen):
        ✓ Real-time events
        ✓ Efficient for updates
        ✓ Persistent connection
        ✗ Complex state management
        ✗ Connection limits
        
        Decision: WebSocket for real-time, REST for CRUD operations
      `
    },
    {
      decision: 'Message Storage',
      analysis: `
        SQL Database:
        ✓ ACID compliance
        ✓ Complex queries
        ✗ Hard to scale
        ✗ Expensive for volume
        
        Cassandra (Chosen):
        ✓ Linear scalability
        ✓ High write throughput
        ✓ Time-series friendly
        ✗ Limited query flexibility
        ✗ Eventual consistency
        
        Decision: Cassandra for messages, PostgreSQL for guild data
      `
    },
    {
      decision: 'Voice Architecture',
      analysis: `
        P2P:
        ✓ Low latency
        ✓ No server costs
        ✗ Doesn't scale
        ✗ NAT issues
        
        Central Mixing:
        ✓ Consistent quality
        ✗ High server load
        ✗ Increased latency
        
        SFU (Chosen):
        ✓ Scalable
        ✓ Low latency
        ✓ Selective forwarding
        ✗ More complex
        
        Decision: SFU with regional servers for gaming latency
      `
    },
    {
      decision: 'ID Generation',
      analysis: `
        UUID:
        ✓ Simple
        ✓ No coordination
        ✗ Not sortable
        ✗ Large size (128-bit)
        
        Database Auto-increment:
        ✓ Simple
        ✓ Sequential
        ✗ Database bottleneck
        ✗ Not distributed
        
        Snowflake (Chosen):
        ✓ Distributed generation
        ✓ Time-sortable
        ✓ Compact (64-bit)
        ✓ Timestamp extractable
        ✗ Clock sync required
        
        Decision: Snowflake IDs for all entities
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'How Discord Stores Billions of Messages',
        youtubeId: 'xynXjChKkJc',
        duration: '6:51'
      },
      { 
        title: 'Discord System Design Interview',
        youtubeId: 'zUKHgQ2C6Dg',
        duration: '42:18'
      }
    ],
    articles: [
      {
        title: 'How Discord Stores Billions of Messages',
        url: 'https://discord.com/blog/how-discord-stores-billions-of-messages'
      },
      {
        title: 'How Discord Handles Two and a Half Million Concurrent Voice Users',
        url: 'https://discord.com/blog/how-discord-handles-two-and-half-million-concurrent-voice-users-using-webrtc'
      }
    ],
    books: [
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        chapter: 'Chapter 11: Stream Processing'
      }
    ]
  }
}