// YouTube System Design Question
export default {
  id: 'youtube',
  title: 'Design YouTube',
  companies: ['Google', 'Meta', 'Netflix'],
  difficulty: 'Hard',
  category: 'Video & Streaming',
  
  description: 'Design a video sharing platform that supports uploading, processing, streaming billions of videos with recommendations, comments, and monetization.',
  
  requirements: {
    functional: [
      'Upload videos (up to 12 hours, 256GB)',
      'Process videos into multiple resolutions (144p to 8K)',
      'Stream videos with adaptive bitrate',
      'Search videos by title, description, tags',
      'Personalized recommendations',
      'Like, dislike, comment on videos',
      'Subscribe to channels',
      'View count and analytics',
      'Monetization (ads, memberships)',
      'Live streaming capability',
      'Playlists and watch history'
    ],
    nonFunctional: [
      'Support 2 billion monthly active users',
      '720,000 hours uploaded daily (500 hours/minute)',
      '1 billion hours watched daily',
      '5 billion videos watched per day',
      'Global availability with <200ms latency',
      '99.95% uptime',
      'Support all devices (mobile, TV, desktop)',
      'Minimize bandwidth costs',
      'Copyright detection (Content ID)'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design YouTube, the world's largest video platform serving 2 billion users. The main challenges are:
      
      1. Massive storage requirements (exabytes of video data)
      2. Video processing pipeline for multiple formats
      3. Global content delivery with minimal latency
      4. Bandwidth optimization (largest internet consumer)
      5. Real-time recommendations at scale
      6. Handling viral videos (millions of concurrent viewers)
      
      The system must handle everything from uploading to streaming to monetization while maintaining low latency globally.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Content Volume:
      - Videos uploaded: 500 hours/minute = 30,000 hours/hour
      - Daily uploads: 720,000 hours
      - Average video: 10 minutes, 100MB (after compression)
      - Daily storage: 720,000 hours * 6 videos/hour * 100MB = 432TB/day
      - Yearly raw storage: 432TB * 365 = 157 PB/year
      
      With multiple resolutions:
      - Each video encoded to 5-7 formats
      - Total storage: 157 PB * 6 = ~1 Exabyte/year
      - Total accumulated: ~10 Exabytes
      
      Bandwidth Requirements:
      - Watch time: 1 billion hours/day
      - Average bitrate: 3 Mbps
      - Total bandwidth: 1B hours * 3600 sec * 3 Mb/sec = 10.8 Exabits/day
      - Peak bandwidth: ~400 Tbps globally
      - CDN distribution reduces origin to ~40 Tbps
      
      Processing Requirements:
      - Videos to process: 30,000 hours/hour
      - Transcoding time: ~2x real-time per format
      - CPU hours: 30,000 * 2 * 6 formats = 360,000 CPU-hours/hour
      - Servers needed: 360,000 / 24 = 15,000 servers for transcoding
      
      Database Operations:
      - Video metadata writes: 500/minute
      - Video views: 60,000/second
      - Searches: 100,000/second
      - Comments: 10,000/second
    `,
    
    highLevelDesign: `
      **System Architecture Components:**
      
      1. **Upload Path**
         - Upload servers (resumable uploads)
         - Raw video storage (distributed file system)
         - Video processing pipeline
         - Multiple CDN origins
      
      2. **Video Processing Pipeline**
         - Preprocessor (validation, metadata)
         - Transcoding service (multiple resolutions)
         - Thumbnail generator
         - Content ID matching
         - Post-processor (optimization)
      
      3. **Serving Path**
         - API servers for metadata
         - Video streaming servers
         - CDN (global edge locations)
         - Adaptive streaming service
      
      4. **Core Services**
         - Search service (ElasticSearch)
         - Recommendation service
         - User service
         - Analytics service
         - Comment service
         - Monetization service
      
      5. **Data Storage**
         - Blob storage: Videos (GFS/Colossus)
         - BigTable: Video metadata
         - Spanner: User data, comments
         - BigQuery: Analytics
         - Memcache/Redis: Hot data
      
      **Content Delivery Strategy:**
      - Multi-tier caching (Hot, Warm, Cold)
      - Popular videos in edge caches
      - Regional distribution centers
      - ISP partnerships for local caches
      - P2P delivery for live streams
    `,
    
    detailedDesign: `
      **1. Video Upload Pipeline:**
      
      Resumable Upload Protocol:
      \`\`\`
      1. Client: POST /upload/initialize
         Response: {uploadId: "abc123", chunkSize: 10MB}
      
      2. Client: PUT /upload/chunk
         Headers: {
           Upload-Id: "abc123",
           Content-Range: "bytes 0-10485759/104857600"
         }
      
      3. Server: Stores chunks in distributed storage
      
      4. Client: POST /upload/complete
         Server: Triggers processing pipeline
      \`\`\`
      
      **2. Video Processing Pipeline:**
      
      DAG Workflow:
      \`\`\`
      Upload Complete → Validate → Extract Metadata
                                 ↓
      Generate Thumbnails ← Transcode → Content ID Check
                         ↓              ↓
                    Store Files → Update Index → Publish
      \`\`\`
      
      Transcoding Strategy:
      - Resolutions: 144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 4K
      - Codecs: H.264 (compatibility), VP9 (efficiency), AV1 (future)
      - Adaptive bitrate: Multiple bitrates per resolution
      - Container: MP4 for compatibility, WebM for web
      
      Distributed Processing:
      \`\`\`python
      def process_video(video_id):
          # Split video into segments
          segments = split_video(video_id, segment_size="10s")
          
          # Parallel transcoding
          tasks = []
          for segment in segments:
              for resolution in RESOLUTIONS:
                  task = transcode_async(segment, resolution)
                  tasks.append(task)
          
          # Wait for completion
          results = await gather(tasks)
          
          # Stitch segments
          for resolution in RESOLUTIONS:
              stitch_segments(results, resolution)
          
          # Generate manifest for adaptive streaming
          create_hls_manifest(video_id)
      \`\`\`
      
      **3. Video Storage System:**
      
      Hierarchical Storage:
      - Hot (SSD): Trending videos (<1 day old, >1M views)
      - Warm (HDD): Regular videos (1-30 days, >10K views)
      - Cold (Tape/Archive): Old videos with low views
      
      Chunk-based Storage:
      - Split videos into 2MB chunks
      - Erasure coding (Reed-Solomon) for redundancy
      - Store chunks across multiple data centers
      - Reconstruct on-the-fly during streaming
      
      **4. Streaming Service:**
      
      Adaptive Bitrate Streaming (HLS):
      \`\`\`
      Master Playlist (m3u8):
      #EXTM3U
      #EXT-X-STREAM-INF:BANDWIDTH=628000,RESOLUTION=640x360
      360p/playlist.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=1628000,RESOLUTION=1280x720
      720p/playlist.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=4628000,RESOLUTION=1920x1080
      1080p/playlist.m3u8
      
      Segment Playlist:
      #EXTM3U
      #EXT-X-TARGETDURATION:10
      #EXTINF:10.0,
      segment000.ts
      #EXTINF:10.0,
      segment001.ts
      \`\`\`
      
      Client Adaptation Algorithm:
      - Monitor buffer health
      - Measure bandwidth
      - Switch quality based on conditions
      - Prefetch next segments
      
      **5. CDN Architecture:**
      
      Multi-Tier Caching:
      \`\`\`
      Origin (Master Copy)
           ↓
      Regional Cache (Per Region)
           ↓
      ISP Cache (Partnership)
           ↓
      Edge Cache (PoP)
           ↓
      Client Device
      \`\`\`
      
      Cache Strategy:
      - LRU for edge caches
      - Predictive caching for trending
      - Geo-distributed origins
      - Anycast routing to nearest edge
      
      **6. Recommendation System:**
      
      Two-Stage Approach:
      
      Candidate Generation (Recall):
      - Collaborative filtering
      - Content-based filtering
      - Watch history
      - Trending videos
      - Subscriptions
      → Generates ~1000 candidates
      
      Ranking (Precision):
      - Deep neural network
      - Features: watch time, CTR, user profile
      - Real-time personalization
      → Returns top 20-50 videos
      
      **7. Search System:**
      
      Inverted Index:
      - Video title, description, tags
      - Closed captions (auto-generated)
      - ElasticSearch clusters
      - Fuzzy matching and synonyms
      
      Ranking Factors:
      - Relevance score
      - View count
      - Recency
      - User engagement
      - Channel authority
    `,
    
    dataFlow: `
      **Video Upload Flow:**
      
      1. Creator uploads video via resumable protocol
      2. Video stored in raw storage temporarily
      3. Processing pipeline triggered:
         - Validate format and content
         - Extract metadata (duration, codec)
         - Generate multiple resolutions
         - Create thumbnails
         - Run Content ID check
      4. Processed files uploaded to CDN origin
      5. Metadata indexed in search system
      6. Video published and available
      
      **Video Streaming Flow:**
      
      1. User searches/browses for video
      2. Recommendation service returns results
      3. User clicks video:
         - Fetch metadata from cache/database
         - Get CDN URL for user's region
      4. Video player:
         - Downloads HLS manifest
         - Starts downloading segments
         - Monitors bandwidth
         - Switches quality adaptively
      5. Analytics:
         - Log view start
         - Track watch time
         - Update recommendations
      
      **Comment Flow:**
      
      1. User posts comment
      2. Spam/abuse detection
      3. Store in Spanner (globally consistent)
      4. Invalidate comment cache
      5. Notify channel owner
      6. Update engagement metrics
      
      **Live Streaming Flow:**
      
      1. Creator starts stream
      2. Ingest servers receive RTMP stream
      3. Real-time transcoding to multiple bitrates
      4. Segment into HLS chunks (2-4 seconds)
      5. Distribute to edge servers
      6. Viewers receive with 10-30 second delay
      7. DVR functionality for rewind
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Storage Capacity**
         Problem: Exabytes of data growing rapidly
         Solution:
         - Compression (VP9/AV1 saves 30-50%)
         - Deduplication of similar videos
         - Archive old/unpopular content
         - Delete policy for inactive accounts
      
      2. **Transcoding Pipeline**
         Problem: 500 hours/minute upload
         Solution:
         - Distributed processing (map-reduce)
         - GPU acceleration for encoding
         - Prioritize popular content
         - Progressive encoding (basic first, enhance later)
      
      3. **Bandwidth Costs**
         Problem: Largest bandwidth consumer globally
         Solution:
         - ISP partnerships for local caching
         - P2P delivery for live events
         - Adaptive bitrate to minimize waste
         - Compression improvements
      
      4. **Viral Video Spikes**
         Problem: Millions hitting same video
         Solution:
         - Predictive caching based on trends
         - Multiple CDN providers
         - Dynamic capacity scaling
         - Anycast routing to distribute load
      
      5. **Search Latency**
         Problem: Searching billions of videos
         Solution:
         - Distributed ElasticSearch
         - Caching popular queries
         - Query suggestion/autocomplete
         - Tiered indices (recent, popular, archive)
      
      6. **Recommendation Compute**
         Problem: Personalizing for 2B users
         Solution:
         - Offline batch processing
         - Approximate algorithms
         - Edge computing for inference
         - Cache recommendations
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Data centers on all continents
         - 200+ PoPs (Points of Presence)
         - Regional content policies
         - Local language processing
      
      2. **Storage Scaling:**
         - Custom distributed file system (Colossus)
         - Erasure coding instead of replication
         - Hierarchical storage management
         - Tape archives for cold data
      
      3. **Compute Scaling:**
         
         Transcoding:
         - Kubernetes clusters for processing
         - Spot instances for batch jobs
         - GPU clusters for ML workloads
         - Preemptible VMs for non-critical tasks
         
         Serving:
         - Auto-scaling based on traffic
         - Load shedding during peaks
         - Graceful degradation
         - Circuit breakers
      
      4. **Database Scaling:**
         
         Bigtable (Metadata):
         - Automatic sharding
         - Row key: video_id
         - Column families for different data
         
         Spanner (User data):
         - Global consistency
         - Multi-region replication
         - Automatic resharding
         
         Analytics:
         - BigQuery for data warehouse
         - Dataflow for streaming
         - Pub/Sub for event bus
      
      5. **CDN Optimization:**
         - Netflix Open Connect model
         - ISP cache appliances
         - Predictive pre-positioning
         - Multi-CDN strategy
         - BGP anycast routing
      
      6. **Cost Optimization:**
         - Transcode on-demand for long-tail
         - Delete redundant formats
         - Aggressive compression
         - Bandwidth throttling for free users
         - Regional pricing models
    `
  },
  
  architecture: {
    svgPath: '/diagrams/youtube.svg',
    components: [
      { 
        name: 'Upload Service', 
        description: 'Handles resumable video uploads with chunking' 
      },
      { 
        name: 'Video Processing Pipeline', 
        description: 'Transcodes videos to multiple resolutions and formats' 
      },
      { 
        name: 'Colossus/GFS', 
        description: 'Distributed file system for video storage' 
      },
      { 
        name: 'CDN', 
        description: 'Global content delivery network with edge caching' 
      },
      { 
        name: 'Streaming Service', 
        description: 'Delivers adaptive bitrate streams (HLS/DASH)' 
      },
      { 
        name: 'BigTable', 
        description: 'Stores video metadata and indexes' 
      },
      { 
        name: 'Recommendation Service', 
        description: 'ML-based video recommendations' 
      },
      { 
        name: 'Search Service', 
        description: 'ElasticSearch for video discovery' 
      },
      { 
        name: 'Analytics Pipeline', 
        description: 'Processes billions of events for insights' 
      }
    ]
  },
  
  apiDesign: `
    // Video Upload APIs
    
    POST /api/videos/upload/init
    Request: {
      title: "My Video",
      description: "...",
      file_size: 1073741824,
      file_type: "video/mp4"
    }
    Response: {
      upload_id: "upload_xyz",
      chunk_size: 10485760,
      upload_url: "https://upload.youtube.com/..."
    }
    
    PUT /api/videos/upload/chunk
    Headers: {
      Upload-Id: "upload_xyz",
      Content-Range: "bytes 0-10485759/1073741824"
    }
    Body: <binary data>
    Response: {
      received: 10485760,
      total: 1073741824
    }
    
    POST /api/videos/upload/complete
    Request: {
      upload_id: "upload_xyz",
      privacy: "public",
      tags: ["tech", "tutorial"]
    }
    Response: {
      video_id: "dQw4w9WgXcQ",
      status: "processing",
      estimated_time: 600
    }
    
    // Video Streaming APIs
    
    GET /api/videos/{video_id}
    Response: {
      video_id: "dQw4w9WgXcQ",
      title: "...",
      channel: {...},
      views: 1234567,
      likes: 12345,
      manifest_url: "https://cdn.youtube.com/video/master.m3u8",
      thumbnails: [...],
      description: "...",
      published_at: "2024-01-01T00:00:00Z"
    }
    
    GET /api/videos/{video_id}/manifest.m3u8
    Response: (HLS Manifest)
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-STREAM-INF:BANDWIDTH=628000,RESOLUTION=640x360
    360p/playlist.m3u8
    #EXT-X-STREAM-INF:BANDWIDTH=1628000,RESOLUTION=1280x720
    720p/playlist.m3u8
    
    // Search and Discovery
    
    GET /api/search
    Query: {
      q: "machine learning",
      type: "video",
      duration: "medium",
      sort: "relevance",
      page_token: "..."
    }
    Response: {
      results: [{
        video_id: "...",
        title: "...",
        channel: {...},
        thumbnail: "...",
        duration: 600,
        views: 12345
      }],
      next_page_token: "..."
    }
    
    GET /api/recommendations
    Headers: {
      Authorization: "Bearer token"
    }
    Response: {
      sections: [{
        title: "Recommended for you",
        videos: [...]
      }, {
        title: "Trending",
        videos: [...]
      }]
    }
    
    // Engagement APIs
    
    POST /api/videos/{video_id}/like
    POST /api/videos/{video_id}/dislike
    
    POST /api/videos/{video_id}/comments
    Request: {
      text: "Great video!",
      parent_id: null
    }
    
    POST /api/channels/{channel_id}/subscribe
    
    // Analytics Events (Client → Server)
    
    POST /api/analytics/watch
    Request: {
      video_id: "...",
      timestamp: 1234567890,
      position: 30.5,
      quality: "720p",
      buffer_health: 10.2,
      event_type: "play|pause|seek|quality_change"
    }
  `,
  
  databaseSchema: {
    sql: `
      -- Spanner for user data and comments (global consistency)
      
      CREATE TABLE channels (
        channel_id STRING(64) NOT NULL,
        name STRING(100),
        owner_email STRING(255),
        subscriber_count INT64,
        total_views INT64,
        created_at TIMESTAMP,
        country STRING(2),
        verified BOOL
      ) PRIMARY KEY (channel_id);
      
      CREATE TABLE videos_metadata (
        video_id STRING(64) NOT NULL,
        channel_id STRING(64),
        title STRING(100),
        description STRING(5000),
        duration_seconds INT64,
        upload_date TIMESTAMP,
        privacy STRING(20),
        view_count INT64,
        like_count INT64,
        dislike_count INT64,
        comment_count INT64
      ) PRIMARY KEY (video_id);
      
      CREATE TABLE comments (
        comment_id STRING(64) NOT NULL,
        video_id STRING(64),
        user_id STRING(64),
        text STRING(10000),
        parent_id STRING(64),
        created_at TIMESTAMP,
        likes INT64,
        is_pinned BOOL
      ) PRIMARY KEY (video_id, created_at DESC, comment_id),
      INTERLEAVE IN PARENT videos_metadata ON DELETE CASCADE;
      
      CREATE TABLE subscriptions (
        user_id STRING(64) NOT NULL,
        channel_id STRING(64) NOT NULL,
        subscribed_at TIMESTAMP,
        notifications BOOL
      ) PRIMARY KEY (user_id, channel_id);
    `,
    
    nosql: `
      // BigTable for video metadata and analytics
      
      Table: video_metadata
      Row Key: video_id
      Column Families:
        basic: {title, description, channel_id, duration}
        stats: {views, likes, dislikes, comments}
        processing: {status, formats_available, thumbnails}
        search: {tags, category, language}
      
      Table: user_history
      Row Key: user_id#timestamp
      Column Families:
        watch: {video_id, watch_time, position}
        search: {query, results_clicked}
        engagement: {likes, comments, shares}
      
      Table: video_segments
      Row Key: video_id#resolution#segment_number
      Column Families:
        data: {cdn_url, size, duration}
        stats: {requests, bandwidth}
      
      // Redis for caching
      
      // Hot video metadata
      KEY video:metadata:{video_id}
      VALUE JSON{title, views, likes, channel}
      TTL 3600
      
      // Trending videos by region
      ZSET trending:global
      ZSET trending:{country_code}
      
      // User session
      HASH session:{session_id}
      Fields: user_id, preferences, watch_history
      
      // View count buffer (batch write to DB)
      INCR views:buffer:{video_id}
      
      // Recommendation cache
      LIST recommendations:{user_id}
      TTL 1800
    `
  },
  
  tradeoffs: [
    {
      decision: 'Storage: Replication vs Erasure Coding',
      analysis: `
        Replication (3x copies):
        ✓ Simple and fast reads
        ✓ High availability
        ✗ 3x storage cost
        ✗ Expensive at exabyte scale
        
        Erasure Coding (Reed-Solomon):
        ✓ 1.5x storage overhead
        ✓ Cost effective at scale
        ✓ Still maintains availability
        ✗ CPU overhead for reconstruction
        ✗ Slightly higher latency
        
        Decision: Erasure coding for video files, replication for metadata
      `
    },
    {
      decision: 'Transcoding: Real-time vs Batch',
      analysis: `
        Real-time transcoding:
        ✓ Videos available immediately
        ✓ Better creator experience
        ✗ Expensive compute resources
        ✗ May delay under load
        
        Batch processing:
        ✓ Efficient resource usage
        ✓ Can use spot instances
        ✗ Delay in availability
        
        Hybrid approach (Chosen):
        - Real-time for popular creators
        - Quick basic format, batch for all resolutions
        - Priority queue based on channel size
      `
    },
    {
      decision: 'CDN Strategy',
      analysis: `
        Build own CDN:
        ✓ Full control
        ✓ Optimized for video
        ✓ Cost savings at scale
        ✗ Huge capital investment
        ✗ Operational complexity
        
        Use existing CDN:
        ✓ Quick deployment
        ✓ Global presence
        ✗ Expensive at YouTube scale
        ✗ Less control
        
        Decision: Hybrid - Own CDN + ISP partnerships + Cloud CDN backup
      `
    },
    {
      decision: 'Recommendation: Real-time vs Pre-computed',
      analysis: `
        Real-time computation:
        ✓ Most relevant recommendations
        ✓ Immediately reflects new behavior
        ✗ Expensive compute
        ✗ Latency concerns
        
        Pre-computed (Chosen for candidate generation):
        ✓ Fast serving
        ✓ Can use complex models offline
        ✗ Less fresh
        
        Decision: Two-stage with pre-computed candidates and real-time ranking
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'YouTube Architecture - High Scalability',
        youtubeId: 'w5WVu624fY8',
        duration: '42:15'
      },
      { 
        title: 'Building Billion User Systems - InfoQ',
        youtubeId: 'hnpzNAPiC0M',
        duration: '38:45'
      }
    ],
    articles: [
      {
        title: 'YouTube Architecture - High Scalability',
        url: 'http://highscalability.com/youtube-architecture'
      },
      {
        title: 'How YouTube Works - Computerphile',
        url: 'https://www.youtube.com/watch?v=OqQk7kLuaK4'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 6: Design YouTube'
      }
    ]
  }
}