// Facebook News Feed System Design Question
export default {
  id: 'facebook-newsfeed',
  title: 'Design Facebook News Feed',
  companies: ['Meta (Facebook)', 'Twitter', 'LinkedIn', 'Instagram', 'TikTok'],
  difficulty: 'Hard',
  category: 'Social Media & Feed Systems',
  
  description: 'Design a news feed system that aggregates and displays personalized content from friends, pages, and groups with real-time updates, ranking algorithms, and engagement features.',
  
  requirements: {
    functional: [
      'Display personalized feed for 3 billion users',
      'Aggregate posts from friends, pages, groups',
      'Support multiple content types (text, photos, videos, links)',
      'Real-time feed updates',
      'Like, comment, share functionality',
      'Story/status updates (ephemeral content)',
      'Feed ranking and personalization',
      'Ad insertion and sponsored content',
      'Content moderation and filtering',
      'Push/pull hybrid feed generation',
      'Cross-platform sync (web, mobile)',
      'Offline support with sync',
      'Privacy controls (who sees what)'
    ],
    nonFunctional: [
      '3 billion monthly active users',
      '1.5 billion daily active users',
      '500,000 posts per second at peak',
      'Feed generation latency < 200ms',
      'Real-time updates < 100ms',
      '99.99% availability',
      'Support 5000 friends per user',
      'Store 30 days of feed data hot',
      'Process 100 billion feed ranking queries/day',
      'Handle 10TB/s aggregate read traffic',
      'Support 100+ ranking signals',
      'GDPR/CCPA compliance',
      'Multi-region deployment'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Facebook's News Feed, a personalized content aggregation system. The key challenges are:
      
      1. Massive scale - billions of users and posts
      2. Real-time personalization and ranking
      3. Balancing relevance vs recency
      4. Managing celebrity/influencer fan-out
      5. Handling diverse content types
      6. Privacy and visibility controls
      7. Real-time updates with minimal latency
      8. Efficient storage and caching strategies
      
      The system needs to generate personalized feeds for billions of users while maintaining sub-second latency and handling massive write volumes.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Activity:
      - Total users: 3 billion
      - Daily active users: 1.5 billion
      - Average friends: 500 per user
      - Average posts per user per day: 2
      - Average feed refreshes per day: 20
      
      Content Volume:
      - New posts daily: 3 billion
      - Posts per second (peak): 500,000
      - Average post size: 1KB (text + metadata)
      - Photos/videos: 500 million daily
      - Average media size: 2MB
      
      Feed Generation:
      - Feed requests: 30 billion/day
      - Peak QPS: 1 million
      - Posts considered per feed: 1000
      - Posts displayed: 20-50
      - Ranking computations: 100 billion/day
      
      Storage Requirements:
      - Post metadata: 3B * 1KB * 30 days = 90TB
      - Media content: 500M * 2MB * 365 days = 365PB/year
      - User feed cache: 1.5B * 50 posts * 1KB = 75TB
      - Edge/CDN cache: 10PB globally
      
      Bandwidth:
      - Read traffic: 10TB/s peak
      - Write traffic: 500MB/s peak
      - Media delivery: 50TB/s peak
      - API traffic: 1TB/s
      
      Infrastructure:
      - Application servers: 100,000
      - Cache servers: 50,000
      - Database shards: 10,000
      - ML inference servers: 20,000
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Mobile apps (iOS/Android)
         - Web application
         - Desktop apps
         - API clients
      
      2. **API Gateway**
         - Request routing
         - Rate limiting
         - Authentication
         - Protocol translation
      
      3. **Feed Service Layer**
         - Feed Generator Service
         - Ranking Service
         - Timeline Service
         - Story Service
         - Notification Service
      
      4. **Data Processing**
         - Post Fanout Service
         - Media Processing
         - Content Understanding (NLP/CV)
         - Spam/Abuse Detection
         - Privacy Checker
      
      5. **Storage Layer**
         - Post Database (Cassandra)
         - User Graph (TAO)
         - Media Storage (Haystack)
         - Feed Cache (Memcached)
         - Timeline Storage (RocksDB)
      
      6. **ML/Ranking Pipeline**
         - Feature Extraction
         - Model Serving
         - A/B Testing Framework
         - Real-time Training
      
      **Feed Generation Strategies:**
      
      1. Pull Model (On-demand generation)
      2. Push Model (Pre-computed timelines)
      3. Hybrid Model (Push for regular users, Pull for celebrities)
    `,
    
    detailedDesign: `
      **Feed Generation Pipeline:**
      
      1. **Post Creation Flow**
         - User creates post
         - Post stored in database
         - Media uploaded to CDN
         - Privacy rules applied
         - Fanout initiated
      
      2. **Fanout Service (Push Model)**
         - For regular users (< 10K followers)
         - Async job to push to followers' timelines
         - Timeline stored in memory cache
         - Batched writes for efficiency
      
      3. **Pull Model (Celebrity Posts)**
         - For users with > 10K followers
         - Posts fetched on-demand
         - Merged with pre-computed timeline
         - Cached for subsequent requests
      
      4. **Ranking Pipeline**
         - Feature extraction (100+ signals)
         - Engagement prediction
         - Relevance scoring
         - Diversity optimization
         - Time decay factor
         - Final ranking score
      
      5. **Feed Mixing**
         - Friends' posts (70%)
         - Pages/Groups (20%)
         - Ads/Sponsored (10%)
         - Story updates (top)
         - Deduplication
      
      **Ranking Signals:**
      - User affinity (interaction history)
      - Post engagement metrics
      - Content type preferences
      - Time since posting
      - Device and connection type
      - Previous session behavior
      - Social proof (mutual friends' engagement)
      - Content quality score
      - Creator relationship strength
      - Topic relevance
    `,
    
    dataFlow: `
      **Post Creation Flow:**
      
      1. User creates post via client
      2. API Gateway validates request
      3. Post Service processes content:
         - Generate post ID
         - Extract hashtags/mentions
         - Apply privacy settings
      4. Media Service handles uploads:
         - Multiple resolutions
         - CDN distribution
         - Thumbnail generation
      5. Write to Post Database
      6. Send to Fanout Service
      7. Update user's own timeline
      8. Trigger push notifications
      9. Update analytics
      
      **Feed Retrieval Flow:**
      
      1. User opens app/refreshes feed
      2. Client sends request with:
         - User ID
         - Timestamp/cursor
         - Device info
      3. Feed Service checks cache
      4. If cache miss:
         - Fetch from Timeline Storage
         - Get celebrity posts (pull)
         - Apply ranking algorithm
         - Mix in ads
      5. Post-processing:
         - Privacy filtering
         - Deduplication
         - Format for client
      6. Return paginated results
      7. Preload next page
      8. Update impression tracking
      
      **Real-time Updates:**
      
      1. WebSocket connection established
      2. Subscribe to relevant channels:
         - Friends' activities
         - Group updates
         - Page posts
      3. New content pushed:
         - Notification badges
         - Feed position markers
         - Live comments/reactions
      4. Client decides when to show
      5. Maintains feed position
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Celebrity Fanout Problem**
         Problem: Millions of followers cause fanout explosion
         Solution:
         - Hybrid push/pull model
         - Pull for celebrities
         - Async processing
         - Batched writes
      
      2. **Feed Ranking Latency**
         Problem: Complex ML models slow down feed generation
         Solution:
         - Pre-computed features
         - Model caching
         - Approximate ranking
         - Progressive loading
      
      3. **Storage Scalability**
         Problem: Billions of posts and media files
         Solution:
         - Sharded databases
         - Cold storage tiering
         - CDN for media
         - Compression
      
      4. **Cache Invalidation**
         Problem: Keeping caches consistent
         Solution:
         - TTL-based expiry
         - Event-driven invalidation
         - Versioned caching
         - Regional caches
      
      5. **Real-time Updates**
         Problem: Millions of concurrent connections
         Solution:
         - WebSocket servers
         - Long polling fallback
         - Batched updates
         - Regional endpoints
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Horizontal Scaling:**
         - Microservices architecture
         - Stateless services
         - Database sharding
         - Cache partitioning
      
      2. **Geographic Distribution:**
         - Regional data centers
         - Edge caching (PoPs)
         - CDN for media
         - Geo-replicated databases
      
      3. **Caching Strategy:**
         - L1: Browser cache
         - L2: CDN edge cache
         - L3: Regional cache
         - L4: Service-level cache
         - L5: Database cache
      
      4. **Database Optimization:**
         - Sharding by user ID
         - Read replicas
         - Denormalized data
         - Hot/cold separation
      
      5. **Feed Optimization:**
         - Lazy loading
         - Infinite scroll
         - Progressive enhancement
         - Predictive prefetching
      
      6. **ML Model Serving:**
         - Model versioning
         - A/B testing
         - Feature caching
         - Distributed inference
    `
  },
  
  architecture: {
    svgPath: '/diagrams/facebook-newsfeed.svg',
    components: [
      { 
        name: 'Feed Generator', 
        description: 'Orchestrates feed creation by aggregating and ranking posts' 
      },
      { 
        name: 'Fanout Service', 
        description: 'Distributes new posts to followers timelines' 
      },
      { 
        name: 'Ranking Service', 
        description: 'ML-based service that scores and orders posts' 
      },
      { 
        name: 'Timeline Storage', 
        description: 'Stores pre-computed user timelines for fast retrieval' 
      },
      { 
        name: 'Post Database', 
        description: 'Distributed storage for all posts and metadata' 
      },
      { 
        name: 'Media Service', 
        description: 'Handles upload, processing, and serving of photos/videos' 
      },
      { 
        name: 'Notification Service', 
        description: 'Manages real-time updates and push notifications' 
      },
      { 
        name: 'Privacy Service', 
        description: 'Enforces visibility and access control rules' 
      }
    ]
  },
  
  apiDesign: `
    // Feed APIs
    
    GET /api/feed
    Request Headers: {
      Authorization: "Bearer {token}"
    }
    Query Parameters: {
      cursor: "timestamp_or_id",
      limit: 20,
      feed_type: "home|discover|following",
      content_filter: "all|photos|videos"
    }
    Response: {
      posts: [{
        id: "post_123",
        author: {
          id: "user_456",
          name: "John Doe",
          avatar: "https://..."
        },
        content: {
          text: "Hello world!",
          media: [{
            type: "photo",
            url: "https://...",
            thumbnail: "https://..."
          }]
        },
        engagement: {
          likes: 1523,
          comments: 89,
          shares: 34
        },
        created_at: "2024-01-20T10:00:00Z",
        ranking_score: 0.95
      }],
      next_cursor: "next_timestamp",
      has_more: true
    }
    
    POST /api/posts
    Request: {
      content: {
        text: "Check out this photo!",
        media_ids: ["media_789"]
      },
      privacy: "friends|public|custom",
      tags: ["user_111", "user_222"],
      location: {
        lat: 37.7749,
        lng: -122.4194
      }
    }
    Response: {
      post_id: "post_new_123",
      status: "published",
      permalink: "https://fb.com/posts/123"
    }
    
    // Engagement APIs
    
    POST /api/posts/{post_id}/like
    Response: {
      liked: true,
      like_count: 1524
    }
    
    POST /api/posts/{post_id}/comments
    Request: {
      text: "Great photo!",
      parent_comment_id: null
    }
    Response: {
      comment_id: "comment_456",
      created_at: "2024-01-20T10:05:00Z"
    }
    
    // Real-time Subscriptions
    
    WebSocket /ws/feed
    
    Subscribe: {
      type: "subscribe",
      channels: ["user_feed", "notifications"]
    }
    
    Message: {
      type: "new_post",
      post: { ... },
      position: "top"
    }
    
    Message: {
      type: "engagement_update",
      post_id: "post_123",
      likes: 1525,
      comments: 90
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for user data and relationships
      
      CREATE TABLE users (
        id BIGINT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP
      );
      
      CREATE TABLE friendships (
        user_id BIGINT,
        friend_id BIGINT,
        status VARCHAR(20), -- pending|accepted|blocked
        created_at TIMESTAMP,
        PRIMARY KEY (user_id, friend_id),
        INDEX idx_friend (friend_id)
      );
      
      CREATE TABLE posts (
        id BIGINT PRIMARY KEY,
        user_id BIGINT,
        content TEXT,
        media_urls JSONB,
        privacy VARCHAR(20),
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        INDEX idx_user_time (user_id, created_at DESC)
      );
      
      CREATE TABLE engagements (
        id BIGINT PRIMARY KEY,
        post_id BIGINT,
        user_id BIGINT,
        type VARCHAR(20), -- like|comment|share
        created_at TIMESTAMP,
        INDEX idx_post (post_id),
        INDEX idx_user (user_id),
        UNIQUE KEY unique_like (post_id, user_id, type)
      );
    `,
    
    nosql: `
      // Cassandra for timeline storage
      
      CREATE TABLE timelines (
        user_id BIGINT,
        post_id BIGINT,
        created_at TIMESTAMP,
        post_data TEXT,
        score DOUBLE,
        PRIMARY KEY (user_id, created_at, post_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC);
      
      // Redis for caching
      
      // User feed cache
      ZADD feed:user:123 
        1705744800 "post:456"
        1705744900 "post:789"
      
      // Post data cache
      HSET post:456
        author_id "123"
        content "Hello world"
        likes "1523"
        comments "89"
      
      // Hot posts (trending)
      ZADD trending:global
        9500 "post:456"  // score based on engagement
        8900 "post:789"
      
      // User session
      HSET session:user:123
        last_feed_fetch "1705744800"
        unread_count "5"
        active_device "mobile"
    `
  },
  
  tradeoffs: [
    {
      decision: 'Push vs Pull vs Hybrid Model',
      analysis: `
        Push Model (Timeline pre-computation):
        ✓ Fast read (simple cache lookup)
        ✓ Good for normal users
        ✗ Slow writes (fanout delay)
        ✗ Celebrity fanout problem
        ✗ Storage intensive
        
        Pull Model (On-demand generation):
        ✓ Fast writes
        ✓ Handles celebrities well
        ✓ Storage efficient
        ✗ Slow reads (computation needed)
        ✗ Higher latency
        
        Hybrid Model (Chosen):
        ✓ Push for regular users
        ✓ Pull for celebrities
        ✓ Balanced performance
        ✓ Optimized storage
        ✗ Complex implementation
        ✗ Two code paths
        
        Decision: Hybrid for optimal performance at scale
      `
    },
    {
      decision: 'Ranking Algorithm Approach',
      analysis: `
        Chronological:
        ✓ Simple and predictable
        ✓ Real-time updates
        ✗ Misses important content
        ✗ Information overload
        
        EdgeRank/ML-based (Chosen):
        ✓ Better engagement
        ✓ Personalized experience
        ✓ Reduces noise
        ✗ Complex implementation
        ✗ "Filter bubble" concerns
        ✗ Requires extensive data
        
        User-controlled:
        ✓ User satisfaction
        ✓ Transparency
        ✗ Most users won't customize
        ✗ Multiple algorithms to maintain
        
        Decision: ML-based with some user controls
      `
    },
    {
      decision: 'Storage Architecture',
      analysis: `
        Single Database:
        ✓ Simple consistency
        ✓ Easy transactions
        ✗ Can't scale
        ✗ Single point of failure
        
        Sharded Databases (Chosen):
        ✓ Horizontal scaling
        ✓ Parallel processing
        ✓ Fault isolation
        ✗ Complex queries
        ✗ Shard rebalancing
        
        Denormalized Storage:
        ✓ Fast reads
        ✓ No joins needed
        ✗ Data duplication
        ✗ Update complexity
        
        Decision: Sharded with selective denormalization
      `
    },
    {
      decision: 'Real-time Updates',
      analysis: `
        Polling:
        ✓ Simple implementation
        ✓ Works everywhere
        ✗ Inefficient
        ✗ Higher latency
        
        WebSockets (Chosen):
        ✓ Real-time bidirectional
        ✓ Efficient
        ✓ Low latency
        ✗ Connection overhead
        ✗ Scaling challenges
        
        Server-Sent Events:
        ✓ Simple protocol
        ✓ Auto-reconnect
        ✗ Unidirectional
        ✗ Limited browser support
        
        Decision: WebSockets with polling fallback
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Facebook News Feed Architecture',
        youtubeId: 'DkJ8JQQQQQc',
        duration: '15:30'
      },
      { 
        title: 'Scaling Instagram Feed',
        youtubeId: 'hnpzNAPiC0E',
        duration: '32:45'
      }
    ],
    articles: [
      {
        title: 'Facebook TAO: The Social Graph Store',
        url: 'https://www.usenix.org/conference/atc13/technical-sessions/presentation/bronson'
      },
      {
        title: 'Serving Facebook Multifeed',
        url: 'https://engineering.fb.com/2022/01/18/web/facebook-multifeed/'
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