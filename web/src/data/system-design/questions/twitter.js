// Twitter/X System Design Question
export default {
  id: 'twitter',
  title: 'Design Twitter/X',
  companies: ['Meta', 'Microsoft', 'Amazon'],
  difficulty: 'Hard',
  category: 'Social Media & Communication',
  
  description: 'Design a microblogging platform that supports tweets, following, timeline generation, trending topics, and real-time updates at massive scale.',
  
  requirements: {
    functional: [
      'Post tweets (280 characters + media)',
      'Follow/unfollow users',
      'Home timeline (tweets from people you follow)',
      'User timeline (user\'s own tweets)',
      'Like, retweet, reply to tweets',
      'Trending topics detection',
      'Search tweets and users',
      'Direct messages',
      'Notifications (mentions, likes, follows)',
      'Media attachments (images, videos)',
      'Hashtags and mentions'
    ],
    nonFunctional: [
      'Support 400 million users',
      '150 million daily active users',
      '500 million tweets per day (6000 tweets/second)',
      'Timeline generation < 500ms',
      'Eventually consistent (few seconds delay acceptable)',
      '99.99% availability',
      'Handle celebrity accounts (100M+ followers)',
      'Real-time trending within 5 minutes',
      'Store tweets forever'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Twitter, a real-time microblogging platform. The main challenges are:
      
      1. Timeline generation at scale (fan-out problem)
      2. Celebrity users causing hotspots (100M+ followers)
      3. Real-time trending topic detection
      4. Low-latency tweet delivery globally
      5. Handling massive read-to-write ratio (1000:1)
      
      The system needs to balance between real-time updates and scalability, especially for users with millions of followers.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Activity:
      - Total users: 400 million
      - Daily active: 150 million
      - Tweets per day: 500 million
      - Average tweet rate: 6,000/second
      - Peak tweet rate: 15,000/second
      - Follows per user: ~500 average
      
      Storage Requirements:
      - Tweet size: 280 chars + metadata = ~3KB
      - Media tweets: 5KB average (with URL)
      - Daily storage: 500M * 3KB = 1.5TB
      - 5-year storage: 1.5TB * 365 * 5 = 2.7PB
      - With replication (3x): ~8PB
      
      Timeline Operations:
      - Home timeline reads: 150M users * 5 times/day = 750M/day
      - Timeline read QPS: 750M / 86400 = 8,700/second
      - Peak QPS: 25,000/second
      
      Fan-out Write Calculations:
      - Average followers: 500
      - Celebrity followers: 100 million
      - Fan-out writes per tweet: 500 average
      - Celebrity fan-out: Requires special handling
      
      Cache Requirements:
      - Active timelines: 150M * 1KB = 150GB
      - Recent tweets cache: 1M * 3KB = 3GB
      - User cache: 400M * 200 bytes = 80GB
      - Total cache: ~250GB across cluster
      
      Bandwidth:
      - Read bandwidth: 25K QPS * 20KB = 500MB/s
      - Write bandwidth: 6K QPS * 3KB = 18MB/s
      - Media bandwidth: 100GB/s globally
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **API Layer**
         - REST API servers
         - GraphQL for mobile
         - WebSocket for real-time
         - Rate limiting
      
      2. **Application Services**
         - Tweet Service (posting, deleting)
         - Timeline Service (generation, ranking)
         - User Graph Service (follow/unfollow)
         - Search Service (ElasticSearch)
         - Trending Service (real-time analytics)
         - Notification Service
         - Media Service
      
      3. **Data Storage**
         - Tweet Store (Cassandra)
         - User Graph (Neo4j or custom)
         - Timeline Store (Redis)
         - Media Store (S3)
         - User Data (MySQL)
      
      4. **Cache Layer**
         - Timeline Cache (Redis)
         - Tweet Cache (Memcached)
         - User Cache
         - Trending Cache
      
      5. **Message Queue**
         - Kafka for async processing
         - Timeline fan-out
         - Analytics pipeline
      
      6. **Real-time Infrastructure**
         - WebSocket servers
         - Pub/Sub for updates
         - Push notifications
      
      **Timeline Generation Strategies:**
      
      1. Pull Model: Generate timeline on read
      2. Push Model: Pre-compute timeline on write
      3. Hybrid Model: Mix based on user type
    `,
    
    detailedDesign: `
      **1. Timeline Generation - Hybrid Approach:**
      
      Regular Users (Push Model):
      \`\`\`python
      def post_tweet(user_id, tweet):
          # Store tweet
          tweet_id = tweet_store.save(tweet)
          
          # Get followers
          followers = graph_service.get_followers(user_id)
          
          # Fan-out to follower timelines
          for follower_id in followers:
              if not is_celebrity(follower_id):
                  timeline_cache.add(follower_id, tweet_id)
          
          # Async processing for non-critical
          kafka.publish("tweet_posted", {
              "tweet_id": tweet_id,
              "user_id": user_id
          })
      \`\`\`
      
      Celebrity Users (Pull Model):
      \`\`\`python
      def get_home_timeline(user_id):
          timeline = []
          
          # Get pre-computed timeline from cache
          cached_tweets = timeline_cache.get(user_id)
          timeline.extend(cached_tweets)
          
          # Get celebrities user follows
          celebrity_follows = get_celebrity_follows(user_id)
          
          # Pull recent tweets from celebrities
          for celeb_id in celebrity_follows:
              recent_tweets = get_recent_tweets(celeb_id)
              timeline.extend(recent_tweets)
          
          # Merge, sort, and rank
          timeline = merge_and_rank(timeline)
          return timeline[:100]  # Return top 100
      \`\`\`
      
      **2. Tweet Storage Schema:**
      
      Cassandra Tweet Table:
      \`\`\`
      CREATE TABLE tweets (
          tweet_id UUID,
          user_id BIGINT,
          content TEXT,
          media_urls LIST<TEXT>,
          created_at TIMESTAMP,
          reply_to UUID,
          retweet_of UUID,
          likes_count COUNTER,
          retweets_count COUNTER,
          PRIMARY KEY (tweet_id)
      );
      
      CREATE TABLE user_tweets (
          user_id BIGINT,
          created_at TIMESTAMP,
          tweet_id UUID,
          PRIMARY KEY (user_id, created_at, tweet_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC);
      \`\`\`
      
      **3. Social Graph Storage:**
      
      Follower Relationships:
      \`\`\`
      # Forward index
      user:123:following -> SET[456, 789, ...]
      
      # Reverse index  
      user:456:followers -> SET[123, 234, ...]
      
      # Counts
      user:123:following_count -> 500
      user:456:followers_count -> 1000000
      \`\`\`
      
      Graph Operations:
      \`\`\`python
      def follow_user(follower_id, followee_id):
          # Update both directions
          graph.add_edge(follower_id, "following", followee_id)
          graph.add_edge(followee_id, "followers", follower_id)
          
          # Update counts
          incr_following_count(follower_id)
          incr_followers_count(followee_id)
          
          # Update timeline if not celebrity
          if not is_celebrity(followee_id):
              backfill_timeline(follower_id, followee_id)
      \`\`\`
      
      **4. Trending Topics Detection:**
      
      Sliding Window Algorithm:
      \`\`\`python
      class TrendingDetector:
          def process_tweet(self, tweet):
              hashtags = extract_hashtags(tweet)
              current_window = get_time_window()
              
              for tag in hashtags:
                  # Count in current window
                  redis.hincrby(f"trending:{current_window}", tag, 1)
                  
                  # Check if trending
                  count = get_hashtag_velocity(tag)
                  if count > TRENDING_THRESHOLD:
                      mark_as_trending(tag)
          
          def get_hashtag_velocity(self, tag):
              # Compare current vs previous windows
              current = redis.hget(f"trending:{current_window}", tag)
              previous = redis.hget(f"trending:{prev_window}", tag)
              
              velocity = (current - previous) / previous
              return velocity
      \`\`\`
      
      **5. Search Implementation:**
      
      ElasticSearch Indexing:
      \`\`\`json
      {
        "mappings": {
          "properties": {
            "tweet_id": {"type": "keyword"},
            "content": {"type": "text", "analyzer": "standard"},
            "user_id": {"type": "keyword"},
            "username": {"type": "keyword"},
            "hashtags": {"type": "keyword"},
            "mentions": {"type": "keyword"},
            "created_at": {"type": "date"},
            "engagement_score": {"type": "float"}
          }
        }
      }
      \`\`\`
      
      **6. Rate Limiting:**
      
      Token Bucket Algorithm:
      \`\`\`python
      class RateLimiter:
          def __init__(self, capacity, refill_rate):
              self.capacity = capacity
              self.tokens = capacity
              self.refill_rate = refill_rate
              self.last_refill = time.now()
          
          def allow_request(self, user_id):
              self.refill()
              
              if self.tokens >= 1:
                  self.tokens -= 1
                  return True
              
              return False
          
          def refill(self):
              now = time.now()
              tokens_to_add = (now - self.last_refill) * self.refill_rate
              self.tokens = min(self.capacity, self.tokens + tokens_to_add)
              self.last_refill = now
      \`\`\`
      
      **7. Notification System:**
      
      Push Notification Flow:
      \`\`\`
      Event (like/follow/mention) 
        → Notification Service
        → Check user preferences
        → Generate notification
        → Push to device (APNs/FCM)
        → Store in notification timeline
      \`\`\`
    `,
    
    dataFlow: `
      **Tweet Posting Flow:**
      
      1. User posts tweet via API
      2. Rate limiter checks quota
      3. Tweet Service:
         - Validates content
         - Stores in Cassandra
         - Updates user tweet index
      4. Async fan-out:
         - Publish to Kafka
         - Fan-out worker processes
         - Updates follower timelines
      5. Real-time delivery:
         - WebSocket notification
         - Push to online followers
      6. Analytics pipeline:
         - Extract hashtags
         - Update trending
         - Index in search
      
      **Timeline Generation Flow:**
      
      1. User requests home timeline
      2. Check if user is celebrity follower
      3. If regular user:
         - Fetch from pre-computed timeline cache
         - Return top 100 tweets
      4. If following celebrities:
         - Fetch pre-computed timeline
         - Pull recent celebrity tweets
         - Merge and rank
         - Cache result
      5. Apply filters and ranking
      6. Return paginated results
      
      **Search Flow:**
      
      1. User enters search query
      2. Query parser:
         - Extract keywords
         - Identify hashtags/mentions
         - Detect filters
      3. ElasticSearch query:
         - Full-text search
         - Filter by date/user
         - Boost by engagement
      4. Rank results:
         - Relevance score
         - Recency
         - User authority
      5. Return paginated results
      
      **Trending Topics Flow:**
      
      1. Tweet posted with hashtags
      2. Stream processor extracts tags
      3. Update counters in time windows
      4. Calculate velocity:
         - Current vs past hour
         - Geographic distribution
      5. If threshold exceeded:
         - Mark as trending
         - Update trending cache
         - Notify interested users
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Celebrity Tweet Fan-out**
         Problem: 100M+ writes for single tweet
         Solution:
         - Hybrid approach: Pull for celebrities
         - Lazy computation on read
         - Dedicated celebrity infrastructure
         - Pre-aggregate for top followers
      
      2. **Timeline Generation Latency**
         Problem: Merging multiple sources
         Solution:
         - Pre-computed timelines in Redis
         - Parallel fetching
         - Pagination (load 20 at a time)
         - Edge caching for popular content
      
      3. **Trending Computation**
         Problem: Processing millions of tweets
         Solution:
         - Distributed stream processing (Flink)
         - Probabilistic data structures (Count-Min Sketch)
         - Sample-based approximation
         - Geographic sharding
      
      4. **Database Hotspots**
         Problem: Popular tweets get excessive reads
         Solution:
         - Multiple cache layers
         - Read replicas
         - CDN for media
         - Request coalescing
      
      5. **Search Latency**
         Problem: Searching billions of tweets
         Solution:
         - Sharded ElasticSearch
         - Time-based indices
         - Query result caching
         - Denormalized data
      
      6. **Graph Operations**
         Problem: Complex follower queries
         Solution:
         - Denormalized follower lists
         - Graph database (Neo4j)
         - In-memory caching
         - Async updates
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Data Partitioning:**
         
         Tweets:
         - Partition by tweet_id (UUID)
         - Time-based archival
         - Hot/cold storage tiers
         
         Timelines:
         - Partition by user_id
         - In-memory for active users
         - Disk for inactive
         
         Social Graph:
         - Shard by user_id
         - Replicate celebrity data
         - Edge servers for reads
      
      2. **Caching Strategy:**
         
         Multi-level caching:
         - CDN: Static content, media
         - Application: Hot tweets, timelines
         - Database: Query results
         - Browser: Recent timelines
      
      3. **Service Scaling:**
         
         Timeline Service:
         - Horizontal scaling
         - Read replicas
         - Celebrity tier
         
         Tweet Service:
         - Auto-scaling groups
         - Regional deployment
         - Write throttling
      
      4. **Geographic Distribution:**
         - Multiple data centers
         - Regional tweet stores
         - Cross-region replication
         - Edge servers for API
      
      5. **Performance Optimizations:**
         - Connection pooling
         - Batch processing
         - Async I/O
         - Protocol buffers
         - HTTP/2 multiplexing
      
      6. **Cost Optimizations:**
         - Archive old tweets to cold storage
         - Compress media files
         - Deduplicate retweets
         - Lazy deletion
         - Spot instances for batch jobs
    `
  },
  
  architecture: {
    svgPath: '/diagrams/twitter.svg',
    components: [
      { 
        name: 'API Gateway', 
        description: 'Entry point with rate limiting and authentication' 
      },
      { 
        name: 'Tweet Service', 
        description: 'Handles tweet creation, deletion, and retrieval' 
      },
      { 
        name: 'Timeline Service', 
        description: 'Generates and serves user timelines using hybrid approach' 
      },
      { 
        name: 'Fan-out Service', 
        description: 'Distributes tweets to follower timelines asynchronously' 
      },
      { 
        name: 'Graph Service', 
        description: 'Manages follow relationships and social graph' 
      },
      { 
        name: 'Trending Service', 
        description: 'Real-time detection of trending topics' 
      },
      { 
        name: 'Redis Cache', 
        description: 'Stores pre-computed timelines and hot data' 
      },
      { 
        name: 'Cassandra', 
        description: 'Distributed storage for tweets and user data' 
      },
      { 
        name: 'Kafka', 
        description: 'Message queue for async processing and analytics' 
      }
    ]
  },
  
  apiDesign: `
    // Tweet APIs
    
    POST /api/tweets
    Request: {
      content: "Hello Twitter! #firsttweet",
      media_ids: ["media_123"],
      reply_to_id: null
    }
    Response: {
      tweet_id: "1234567890",
      created_at: "2024-01-01T12:00:00Z",
      url: "https://twitter.com/user/status/1234567890"
    }
    
    GET /api/tweets/{tweet_id}
    Response: {
      tweet_id: "1234567890",
      user: {
        id: "user_123",
        username: "johndoe",
        name: "John Doe",
        verified: true
      },
      content: "Hello Twitter!",
      created_at: "2024-01-01T12:00:00Z",
      likes: 1500,
      retweets: 200,
      replies: 50
    }
    
    DELETE /api/tweets/{tweet_id}
    
    // Timeline APIs
    
    GET /api/timeline/home
    Query: {
      count: 20,
      since_id: "1234567889",
      max_id: "1234567999"
    }
    Response: {
      tweets: [...],
      next_cursor: "1234567889"
    }
    
    GET /api/timeline/user/{user_id}
    Response: {
      tweets: [...],
      next_cursor: "..."
    }
    
    // Social Graph APIs
    
    POST /api/users/{user_id}/follow
    Response: {
      following: true,
      follower_count: 1501
    }
    
    DELETE /api/users/{user_id}/follow
    
    GET /api/users/{user_id}/followers
    Query: {cursor: "...", count: 100}
    Response: {
      users: [...],
      next_cursor: "..."
    }
    
    // Interaction APIs
    
    POST /api/tweets/{tweet_id}/like
    DELETE /api/tweets/{tweet_id}/like
    
    POST /api/tweets/{tweet_id}/retweet
    Request: {
      comment: "Great thread!"
    }
    
    // Search API
    
    GET /api/search/tweets
    Query: {
      q: "#tech OR @elonmusk",
      result_type: "recent|popular|mixed",
      count: 20
    }
    Response: {
      statuses: [...],
      search_metadata: {
        count: 20,
        since_id: "...",
        max_id: "..."
      }
    }
    
    // Trending API
    
    GET /api/trends/place
    Query: {
      woeid: 1  // Where On Earth ID
    }
    Response: {
      trends: [{
        name: "#WorldCup",
        tweet_volume: 1234567,
        url: "...",
        promoted: false
      }],
      as_of: "2024-01-01T12:00:00Z",
      location: "Worldwide"
    }
    
    // WebSocket Events
    
    // Subscribe to real-time updates
    WS /api/streaming/user
    
    // Incoming events
    {
      type: "tweet",
      data: {tweet_id: "...", user_id: "..."}
    }
    
    {
      type: "follow",
      data: {follower_id: "...", timestamp: "..."}
    }
    
    {
      type: "like",
      data: {tweet_id: "...", user_id: "..."}
    }
  `,
  
  databaseSchema: {
    sql: `
      -- MySQL for user data
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        bio TEXT,
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        follower_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        tweet_count INT DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        INDEX idx_username (username),
        INDEX idx_email (email)
      );
      
      CREATE TABLE user_settings (
        user_id BIGINT PRIMARY KEY,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        private_account BOOLEAN DEFAULT FALSE,
        language VARCHAR(10),
        timezone VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );
    `,
    
    nosql: `
      // Cassandra for tweets
      
      CREATE KEYSPACE twitter WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'dc1': 3,
        'dc2': 3
      };
      
      CREATE TABLE tweets (
        tweet_id UUID PRIMARY KEY,
        user_id BIGINT,
        content TEXT,
        media_urls LIST<TEXT>,
        created_at TIMESTAMP,
        reply_to UUID,
        retweet_of UUID,
        hashtags SET<TEXT>,
        mentions SET<TEXT>,
        likes_count COUNTER,
        retweets_count COUNTER,
        replies_count COUNTER
      );
      
      CREATE TABLE user_tweets (
        user_id BIGINT,
        created_at TIMESTAMP,
        tweet_id UUID,
        PRIMARY KEY (user_id, created_at, tweet_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC);
      
      CREATE TABLE timelines (
        user_id BIGINT,
        created_at TIMESTAMP,
        tweet_id UUID,
        author_id BIGINT,
        PRIMARY KEY (user_id, created_at)
      ) WITH CLUSTERING ORDER BY (created_at DESC)
      AND default_time_to_live = 2592000;  -- 30 days TTL
      
      // Redis structures
      
      // Timeline cache
      ZSET timeline:{user_id}
      Score: timestamp
      Member: tweet_id
      
      // Tweet cache
      HASH tweet:{tweet_id}
      Fields: content, user_id, created_at, likes, retweets
      
      // Social graph
      SET following:{user_id} -> [user_ids...]
      SET followers:{user_id} -> [user_ids...]
      
      // Trending topics
      ZSET trending:global
      Score: count
      Member: hashtag
      
      ZSET trending:{country}
      Score: count  
      Member: hashtag
      
      // Rate limiting
      STRING rate:{user_id}:{action} -> count
      TTL: 60 seconds
      
      // User sessions
      HASH session:{session_id}
      Fields: user_id, created_at, ip, device
    `
  },
  
  tradeoffs: [
    {
      decision: 'Push vs Pull vs Hybrid Timeline',
      analysis: `
        Push (Pre-compute):
        ✓ Fast reads (pre-computed)
        ✓ Good for regular users
        ✗ Celebrity fan-out problem
        ✗ Storage intensive
        
        Pull (On-demand):
        ✓ No fan-out issues
        ✓ Storage efficient
        ✗ Slow reads
        ✗ Heavy compute on read
        
        Hybrid (Chosen):
        ✓ Push for regular users
        ✓ Pull for celebrities
        ✓ Balances trade-offs
        ✗ More complex
        
        Decision: Hybrid with celebrity threshold at 10K followers
      `
    },
    {
      decision: 'Consistency Model',
      analysis: `
        Strong Consistency:
        ✓ Immediate visibility
        ✗ Performance impact
        ✗ Scaling challenges
        
        Eventual Consistency (Chosen):
        ✓ Better performance
        ✓ Easier to scale
        ✓ Acceptable for social media
        ✗ Temporary inconsistencies
        
        Decision: Eventual consistency with ~1-2 second delay
      `
    },
    {
      decision: 'Storage Strategy',
      analysis: `
        Single Database:
        ✓ Simple queries
        ✗ Scaling bottleneck
        
        Polyglot Persistence (Chosen):
        ✓ Optimal for each use case
        ✓ Better scaling
        ✗ Operational complexity
        
        Breakdown:
        - Cassandra: Tweets (write-heavy)
        - Redis: Timelines (read-heavy)
        - MySQL: User data (relational)
        - Neo4j: Social graph (graph queries)
      `
    },
    {
      decision: 'Real-time Updates',
      analysis: `
        Polling:
        ✓ Simple
        ✗ Inefficient
        ✗ Delay
        
        WebSockets (Chosen):
        ✓ Real-time
        ✓ Efficient
        ✗ Connection overhead
        ✗ Scaling complexity
        
        Server-Sent Events:
        ✓ Simple
        ✗ One-way only
        
        Decision: WebSockets for active users, polling fallback
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Scaling Twitter - Raffi Krikorian',
        youtubeId: 'wDGRJRMAW7E',
        duration: '26:42'
      },
      { 
        title: 'Twitter Timeline at Scale',
        youtubeId: 'x7m5pqvjhGg',
        duration: '18:35'
      }
    ],
    articles: [
      {
        title: 'How Twitter Timeline Works',
        url: 'https://blog.twitter.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale'
      },
      {
        title: 'Twitter Architecture - High Scalability',
        url: 'http://highscalability.com/blog/2013/7/8/the-architecture-twitter-uses-to-deal-with-150m-active-users.html'
      }
    ],
    books: [
      {
        title: 'System Design Interview',
        author: 'Alex Xu',
        chapter: 'Chapter 11: Design Twitter'
      }
    ]
  }
}