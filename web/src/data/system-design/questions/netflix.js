// Netflix System Design Question
export default {
  id: 'netflix',
  title: 'Design Netflix',
  companies: ['Netflix', 'Amazon', 'Google'],
  difficulty: 'Hard',
  category: 'Video & Streaming',
  
  description: 'Design a video streaming service that delivers content globally with personalized recommendations, handling millions of concurrent streams.',
  
  requirements: {
    functional: [
      'Stream videos to millions of users globally',
      'Multiple device support (TV, mobile, web, gaming consoles)',
      'Personalized recommendations',
      'Search and browse catalog',
      'User profiles (multiple per account)',
      'Continue watching across devices',
      'Download for offline viewing',
      'Parental controls',
      'Multiple audio/subtitle tracks',
      'Variable quality based on bandwidth'
    ],
    nonFunctional: [
      'Support 200 million subscribers globally',
      '2 billion hours streamed per week',
      'Peak concurrent streams: 50 million',
      'Available in 190+ countries',
      'Start streaming within 2 seconds',
      '99.99% availability',
      'Bandwidth adaptive streaming',
      'Regional content restrictions',
      'Support 4K/HDR content'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Netflix, a global streaming service that serves 200+ million subscribers. Key challenges include:
      
      1. Global content delivery with minimal buffering
      2. Personalized recommendations driving 80% of views
      3. Handling massive concurrent streams (50M+ peak)
      4. Bandwidth optimization (30% of internet traffic)
      5. Microservices architecture at scale
      6. Regional licensing and content restrictions
      
      Netflix has pioneered many innovations including Open Connect CDN, per-title encoding, and chaos engineering.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Content Library:
      - Total titles: ~15,000 globally
      - Average movie size: 4GB (HD), 15GB (4K)
      - Average series: 10 episodes * 1GB = 10GB
      - Total content: ~100TB per region
      - With all encodings: 100TB * 40 versions = 4PB per region
      - Global storage: 4PB * 50 regions = 200PB
      
      Streaming Bandwidth:
      - Concurrent streams: 50 million peak
      - Average bitrate: 5 Mbps (HD)
      - Peak bandwidth: 50M * 5 Mbps = 250 Tbps
      - Daily data transfer: 3 Exabytes
      
      Open Connect Appliances:
      - ISP locations: 1000+ globally
      - Appliances per location: 1-100 based on size
      - Storage per appliance: 200TB
      - Total edge storage: 10PB+ 
      
      API Requests:
      - Browse/search: 1M requests/sec
      - Play starts: 100K/sec peak
      - Recommendation queries: 500K/sec
      - Progress tracking: 1M updates/sec
      
      Encoding Requirements:
      - New content daily: ~100 titles
      - Encoding versions: 40+ per title
      - Encoding time: 5x real-time per version
      - Compute hours: 100 * 2hr * 40 * 5 = 40,000 hours/day
    `,
    
    highLevelDesign: `
      **Architecture Overview:**
      
      1. **Client Layer**
         - Smart TVs, mobile apps, web browsers
         - Gaming consoles (PlayStation, Xbox)
         - Set-top boxes (Roku, Apple TV)
      
      2. **Edge Layer (Open Connect)**
         - Open Connect Appliances (OCAs) in ISPs
         - Fill during off-peak hours
         - Serve 90%+ of traffic
         - Predictive content placement
      
      3. **Control Plane (AWS)**
         - API Gateway (Zuul)
         - Service discovery (Eureka)
         - Circuit breaker (Hystrix)
         - Configuration (Archaius)
      
      4. **Microservices (100+)**
         - Viewing Service
         - Recommendation Service
         - User Service
         - Billing Service
         - Content Metadata Service
         - A/B Testing Service
      
      5. **Data Plane**
         - Video storage (S3)
         - Metadata (Cassandra)
         - User data (MySQL)
         - Caching (EVCache)
      
      6. **Analytics Platform**
         - Real-time: Kafka + Flink
         - Batch: Spark on S3
         - Data warehouse: Presto/Hive
      
      **Content Delivery Strategy:**
      
      1. Pre-position popular content at ISP edges
      2. Use ML to predict what to cache where
      3. Fill caches during off-peak hours
      4. Serve from closest OCA
      5. Fallback to AWS origins if needed
    `,
    
    detailedDesign: `
      **1. Open Connect CDN:**
      
      OCA (Open Connect Appliance) Design:
      - Hardware: 100-200TB SSD storage
      - Software: FreeBSD + NGINX
      - Deployment: Inside ISP networks
      - Fill: BGP announcement during off-peak
      
      Content Placement Algorithm:
      \`\`\`python
      def place_content(region):
          # Popularity prediction
          trending = ml_model.predict_popularity(region)
          new_releases = get_upcoming_releases()
          viewing_history = analyze_regional_patterns()
          
          # Allocation strategy
          content_list = []
          
          # 40% - Currently trending
          content_list.extend(trending[:40])
          
          # 30% - New releases
          content_list.extend(new_releases[:30])
          
          # 20% - Predicted based on history
          content_list.extend(viewing_history[:20])
          
          # 10% - Long tail popular
          content_list.extend(catalog.get_steady_popular()[:10])
          
          return optimize_placement(content_list, storage_limit)
      \`\`\`
      
      **2. Playback Service:**
      
      Manifest File Generation:
      \`\`\`
      GET /manifest?movie_id=123&profile=high
      
      Returns DASH/HLS manifest:
      - Multiple bitrates (235kbps - 15Mbps)
      - Multiple resolutions (320p - 4K)
      - CDN URLs for segments
      - DRM license URL
      \`\`\`
      
      Adaptive Bitrate Algorithm:
      \`\`\`javascript
      class AdaptivePlayer {
          selectQuality() {
              const bandwidth = this.measureBandwidth();
              const bufferHealth = this.getBufferLevel();
              const cpu = this.getCPUUsage();
              
              if (bufferHealth < 5) {
                  return this.dropQuality();
              } else if (bufferHealth > 30 && bandwidth > current * 1.5) {
                  return this.increaseQuality();
              }
              
              return this.currentQuality;
          }
      }
      \`\`\`
      
      **3. Recommendation System:**
      
      Multi-Armed Bandit Approach:
      - Explore (10%): Show diverse content
      - Exploit (90%): Show personalized picks
      
      Recommendation Pipeline:
      \`\`\`
      User Profile → Candidate Generation → Filtering → Ranking → Presentation
                           ↓                    ↓           ↓            ↓
                     (Collaborative)     (Regional)   (Deep NN)   (Row Selection)
                     (Content-based)    (Maturity)   (Context)   (Artwork)
                     (Trending)        (History)     (Time)      (Explanation)
      \`\`\`
      
      Features for Ranking:
      - Video features: genre, actors, director
      - User features: watch history, time patterns
      - Context: device, time of day, day of week
      - Interaction: clicks, watch duration, completion
      
      **4. Microservices Architecture:**
      
      Service Mesh Pattern:
      \`\`\`
      Client → Zuul (API Gateway)
              ↓
      Service A → Hystrix → Service B
              ↓          ↓
          EVCache    Cassandra
      \`\`\`
      
      Circuit Breaker (Hystrix):
      \`\`\`java
      @HystrixCommand(
          fallbackMethod = "getDefaultRecommendations",
          commandProperties = {
              @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20"),
              @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50")
          }
      )
      public List<Movie> getRecommendations(String userId) {
          return recommendationService.get(userId);
      }
      \`\`\`
      
      **5. Data Pipeline:**
      
      Real-time Events:
      \`\`\`
      Client Events → Kafka → Flink → ElasticSearch
                        ↓        ↓
                     S3 (Raw)  Druid (Real-time Analytics)
      \`\`\`
      
      Batch Processing:
      - Hourly: Update viewing stats
      - Daily: Retrain recommendation models
      - Weekly: Content performance analysis
      
      **6. Encoding Pipeline:**
      
      Per-Title Encoding:
      - Analyze each video's complexity
      - Create custom bitrate ladder
      - Optimize quality vs bandwidth
      
      \`\`\`python
      def encode_title(video):
          complexity = analyze_complexity(video)
          
          if complexity == "simple":  # Animation
              bitrates = [400, 600, 1000, 1500, 2500]
          elif complexity == "complex":  # Action scenes
              bitrates = [600, 1000, 1750, 2500, 4000]
          else:
              bitrates = [500, 800, 1200, 2000, 3000]
          
          for bitrate in bitrates:
              encode_variant(video, bitrate)
      \`\`\`
      
      **7. Chaos Engineering:**
      
      Chaos Monkey: Randomly terminates instances
      Chaos Kong: Simulates region failure
      FIT (Failure Injection Testing): Network latency
      
      \`\`\`python
      class ChaosMonkey:
          def run(self):
              if random() < 0.01:  # 1% chance
                  instance = select_random_instance()
                  if instance.is_critical():
                      log("Would terminate: " + instance)
                  else:
                      instance.terminate()
      \`\`\`
    `,
    
    dataFlow: `
      **Video Streaming Flow:**
      
      1. User opens Netflix app
      2. App authenticates with API Gateway
      3. Fetch personalized homepage:
         - Call Recommendation Service
         - Get user's continue watching
         - Fetch trending content
      4. User selects title:
         - Get manifest from Playback Service
         - Resolve CDN URLs based on location
      5. Start streaming:
         - Connect to nearest OCA
         - If content not in OCA, redirect to AWS
         - Begin adaptive streaming
      6. During playback:
         - Send progress updates
         - Log quality metrics
         - Adjust bitrate based on bandwidth
      
      **Content Ingestion Flow:**
      
      1. Content arrives from studio
      2. Ingest into secure storage
      3. Quality check and validation
      4. Encoding pipeline:
         - Generate all quality variants
         - Create audio/subtitle tracks
         - Generate thumbnails/trailers
      5. Metadata entry:
         - Title, description, cast
         - Ratings, categories
         - Regional availability
      6. Distribution:
         - Push to S3 origins
         - Schedule OCA distribution
         - Update content catalog
      
      **Recommendation Update Flow:**
      
      1. User watches content
      2. Stream events to Kafka
      3. Real-time processing:
         - Update user profile
         - Adjust recommendations
         - A/B test tracking
      4. Batch processing:
         - Aggregate viewing data
         - Retrain ML models
         - Generate insights
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **ISP Bandwidth Limitations**
         Problem: ISP interconnect congestion
         Solution:
         - Open Connect Appliances inside ISPs
         - Peer directly at Internet Exchanges
         - Multiple transit providers
      
      2. **Popular Content Spikes**
         Problem: New season release causes traffic surge
         Solution:
         - Pre-position content globally
         - Stagger release times by region
         - Increase cache capacity temporarily
         - Use multiple CDN providers as backup
      
      3. **Microservice Cascading Failures**
         Problem: One service failure affects many
         Solution:
         - Circuit breakers (Hystrix)
         - Fallback responses
         - Service isolation
         - Request hedging
      
      4. **Recommendation Compute**
         Problem: ML inference for millions of users
         Solution:
         - Pre-compute recommendations
         - Cache for time windows
         - Approximate algorithms
         - Edge inference
      
      5. **Database Hotspots**
         Problem: Popular content metadata
         Solution:
         - EVCache (memcached) layers
         - Read replicas
         - Denormalization
         - Request coalescing
      
      6. **Encoding Backlogs**
         Problem: Large influx of new content
         Solution:
         - Priority queues
         - Auto-scaling encoding farm
         - Parallel chunk encoding
         - Spot instances for batch
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Scaling:**
         - OCAs in 1000+ ISP locations
         - AWS regions: 20+ globally
         - Local caches serve 90% traffic
         - Anycast for routing
      
      2. **Microservices Scaling:**
         - Independent scaling per service
         - Auto-scaling based on metrics
         - Container orchestration (Titus)
         - Service mesh for communication
      
      3. **Data Store Scaling:**
         
         Cassandra:
         - 100+ clusters
         - Petabytes of data
         - Multi-region replication
         
         EVCache:
         - Layered caching
         - Consistent hashing
         - Cross-region replication
         
         ElasticSearch:
         - Sharded by date
         - Hot-warm architecture
      
      4. **Cost Optimization:**
         - Open Connect saves 90% bandwidth cost
         - Spot instances for encoding
         - Reserved instances for baseline
         - S3 intelligent tiering
         - Optimize encoding (saves 20% bandwidth)
      
      5. **Performance Optimization:**
         - Predictive caching
         - Connection reuse
         - HTTP/2 and QUIC
         - WebP for images
         - Zstandard compression
      
      6. **Resilience Patterns:**
         - Multi-region failover
         - Stateless services
         - Immutable infrastructure
         - Red-black deployments
         - Automated canary analysis
    `
  },
  
  architecture: {
    svgPath: '/diagrams/netflix.svg',
    components: [
      { 
        name: 'Open Connect CDN', 
        description: 'Custom CDN with appliances in ISP networks serving 90% of traffic' 
      },
      { 
        name: 'API Gateway (Zuul)', 
        description: 'Entry point for all client requests with routing and filtering' 
      },
      { 
        name: 'Playback Service', 
        description: 'Handles video manifest generation and streaming logic' 
      },
      { 
        name: 'Recommendation Service', 
        description: 'ML-based personalized content recommendations' 
      },
      { 
        name: 'EVCache', 
        description: 'Distributed memcached for low-latency data access' 
      },
      { 
        name: 'Cassandra', 
        description: 'Distributed database for user data and viewing history' 
      },
      { 
        name: 'Hystrix', 
        description: 'Circuit breaker for fault tolerance' 
      },
      { 
        name: 'Eureka', 
        description: 'Service discovery and registry' 
      },
      { 
        name: 'Titus', 
        description: 'Container orchestration platform' 
      }
    ]
  },
  
  apiDesign: `
    // Authentication
    POST /api/auth/login
    Request: {
      email: "user@example.com",
      password: "...",
      device_id: "..."
    }
    Response: {
      token: "jwt_token",
      profiles: [{id: "prof1", name: "John", avatar: "..."}],
      plan: "premium_4k"
    }
    
    // Browse/Discovery
    GET /api/browse/home
    Headers: {
      Authorization: "Bearer token",
      Profile-Id: "prof1"
    }
    Response: {
      rows: [
        {
          title: "Continue Watching",
          items: [{
            id: "movie123",
            title: "...",
            progress: 0.45,
            thumbnail: "..."
          }]
        },
        {
          title: "Trending Now",
          items: [...]
        },
        {
          title: "Because you watched X",
          items: [...]
        }
      ]
    }
    
    // Search
    GET /api/search?query=stranger&limit=20
    Response: {
      results: [{
        type: "series",
        id: "series456",
        title: "Stranger Things",
        seasons: 4,
        match_score: 0.98
      }]
    }
    
    // Playback
    GET /api/play/manifest/{content_id}
    Query: {
      profile: "high",
      device: "tv"
    }
    Response: {
      manifest_url: "https://oca5.isp.net/content/dash/manifest.mpd",
      license_url: "https://api.netflix.com/drm/license",
      subtitles: [...],
      audio_tracks: [...]
    }
    
    // Progress Tracking
    POST /api/viewing/progress
    Request: {
      content_id: "movie123",
      position: 1234,
      duration: 7200,
      quality: "1080p"
    }
    
    // Recommendations
    GET /api/recommendations/{profile_id}
    Response: {
      recommendations: [{
        id: "movie789",
        title: "...",
        match_percentage: 95,
        reason: "Because you liked MovieX"
      }]
    }
    
    // Download for Offline
    POST /api/download/request
    Request: {
      content_id: "movie123",
      quality: "high"
    }
    Response: {
      download_urls: [
        "https://cdn.netflix.com/downloads/chunk1.mp4",
        "https://cdn.netflix.com/downloads/chunk2.mp4"
      ],
      expiry: "2024-02-01T00:00:00Z"
    }
  `,
  
  databaseSchema: {
    sql: `
      -- MySQL for account/billing data
      
      CREATE TABLE accounts (
        account_id BIGINT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        plan_type VARCHAR(50),
        billing_date DATE,
        country VARCHAR(2),
        created_at TIMESTAMP
      );
      
      CREATE TABLE profiles (
        profile_id BIGINT PRIMARY KEY,
        account_id BIGINT,
        name VARCHAR(100),
        avatar_url VARCHAR(500),
        maturity_level VARCHAR(20),
        language VARCHAR(10),
        FOREIGN KEY (account_id) REFERENCES accounts(account_id)
      );
      
      CREATE TABLE billing (
        billing_id BIGINT PRIMARY KEY,
        account_id BIGINT,
        amount DECIMAL(10,2),
        currency VARCHAR(3),
        status VARCHAR(20),
        billing_date DATE,
        FOREIGN KEY (account_id) REFERENCES accounts(account_id)
      );
    `,
    
    nosql: `
      // Cassandra for viewing history and user data
      
      CREATE KEYSPACE netflix WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'us-east': 3,
        'us-west': 3,
        'eu-west': 3
      };
      
      CREATE TABLE viewing_history (
        profile_id UUID,
        timestamp TIMESTAMP,
        content_id TEXT,
        position INT,
        duration INT,
        device_type TEXT,
        PRIMARY KEY (profile_id, timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);
      
      CREATE TABLE content_metadata (
        content_id TEXT PRIMARY KEY,
        title TEXT,
        type TEXT,
        genres SET<TEXT>,
        cast LIST<TEXT>,
        director TEXT,
        release_date DATE,
        ratings MAP<TEXT, FLOAT>,
        available_regions SET<TEXT>
      );
      
      CREATE TABLE recommendations (
        profile_id UUID,
        generated_at TIMESTAMP,
        content_id TEXT,
        score FLOAT,
        reason TEXT,
        PRIMARY KEY (profile_id, generated_at, content_id)
      ) WITH CLUSTERING ORDER BY (generated_at DESC, score DESC);
      
      // EVCache (memcached) structure
      
      // User session
      KEY: session:{session_id}
      VALUE: {
        profile_id: "...",
        account_id: "...",
        country: "US",
        plan: "premium"
      }
      TTL: 86400
      
      // Content metadata cache
      KEY: content:{content_id}
      VALUE: JSON metadata
      TTL: 3600
      
      // Viewing history cache
      KEY: history:{profile_id}
      VALUE: Recent 20 items
      TTL: 1800
      
      // Recommendations cache
      KEY: recommendations:{profile_id}
      VALUE: Top 100 recommendations
      TTL: 3600
    `
  },
  
  tradeoffs: [
    {
      decision: 'Build vs Buy CDN',
      analysis: `
        Build Own CDN (Open Connect):
        ✓ Cost savings at Netflix scale (90% reduction)
        ✓ Full control over caching logic
        ✓ Optimized for video streaming
        ✓ Direct ISP relationships
        ✗ High initial investment
        ✗ Operational complexity
        
        Use Commercial CDN:
        ✓ Quick to deploy
        ✓ No maintenance
        ✗ Extremely expensive at scale
        ✗ Less control
        
        Decision: Build Open Connect for scale and control
      `
    },
    {
      decision: 'Microservices vs Monolith',
      analysis: `
        Microservices (Chosen):
        ✓ Independent scaling
        ✓ Technology diversity
        ✓ Team autonomy
        ✓ Fault isolation
        ✗ Network complexity
        ✗ Debugging difficulty
        
        Monolith:
        ✓ Simpler deployment
        ✓ Easier debugging
        ✗ Scaling bottlenecks
        ✗ Team coordination issues
        
        Decision: Microservices for organizational scaling
      `
    },
    {
      decision: 'Encoding Strategy',
      analysis: `
        Per-Title Encoding (Chosen):
        ✓ 20% bandwidth savings
        ✓ Better quality per bit
        ✗ More complex pipeline
        ✗ Higher compute cost
        
        Fixed Bitrate Ladder:
        ✓ Simple implementation
        ✗ Wastes bandwidth
        ✗ Suboptimal quality
        
        Decision: Per-title for bandwidth optimization
      `
    },
    {
      decision: 'Recommendation Computation',
      analysis: `
        Real-time:
        ✓ Most accurate
        ✓ Instantly reflects behavior
        ✗ Expensive compute
        ✗ Latency issues
        
        Batch Pre-computation (Chosen):
        ✓ Fast serving
        ✓ Complex algorithms possible
        ✗ Less fresh
        
        Hybrid:
        - Batch for candidates
        - Real-time ranking
        - Best of both worlds
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Netflix System Architecture - InfoQ',
        youtubeId: 'psQzyFfsUGU',
        duration: '44:31'
      },
      { 
        title: 'Netflix Microservices - Josh Evans',
        youtubeId: '57UK46qfBLY',
        duration: '38:42'
      }
    ],
    articles: [
      {
        title: 'Netflix Technology Blog',
        url: 'https://netflixtechblog.com/'
      },
      {
        title: 'How Netflix Works - High Scalability',
        url: 'http://highscalability.com/blog/2017/12/14/netflix-what-happens-when-you-press-play.html'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 7: Design Video Streaming (Netflix)'
      }
    ]
  }
}