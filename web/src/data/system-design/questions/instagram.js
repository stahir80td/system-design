// Instagram System Design Question
export default {
  id: 'instagram',
  title: 'Design Instagram',
  companies: ['Meta', 'Facebook', 'Instagram', 'Pinterest', 'Snapchat'],
  difficulty: 'Hard',
  category: 'Social Media & Communication',
  
  description: 'Design a photo and video sharing social network that allows users to upload media, follow others, and discover content through feeds, stories, and explore features.',
  
  requirements: {
    functional: [
      'Upload photos and videos (up to 1GB)',
      'Follow/unfollow users',
      'Home feed with posts from followed users',
      'Stories that disappear after 24 hours',
      'Explore/Discover page with recommendations',
      'Like, comment, and share posts',
      'Direct messaging between users',
      'Real-time notifications',
      'Hashtags and mentions',
      'Live streaming (Instagram Live)',
      'Reels (short-form videos)',
      'Search users, hashtags, locations'
    ],
    nonFunctional: [
      'Support 2 billion users',
      '500 million daily active users',
      '100 million photos/videos uploaded daily',
      'Feed generation < 200ms',
      '99.9% availability',
      'Eventually consistent for most features',
      'Strong consistency for payments/ads',
      'Global CDN for media delivery',
      'Real-time features with < 100ms latency'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Instagram, a visual content sharing platform. The key challenges are:
      
      1. Efficient media storage and delivery at scale
      2. Real-time feed generation for millions of users
      3. Content discovery and recommendation algorithms
      4. Stories with automatic expiration
      5. Real-time features (notifications, messaging, live streaming)
      6. Image/video processing pipeline
      7. Handling viral content and celebrity accounts
      
      The system needs to deliver a personalized, engaging experience while handling billions of media files and complex social graphs.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Metrics:
      - Total users: 2 billion
      - Daily active users: 500 million
      - Average time per user: 30 minutes/day
      - Posts per user per day: 2
      - Stories per user per day: 5
      
      Content Volume:
      - Daily uploads: 100 million photos/videos
      - Average photo size: 2MB
      - Average video size: 50MB
      - Stories: 500M users * 5 = 2.5 billion/day
      - Daily storage: 5 Petabytes
      - Total storage (3 years): ~5 Exabytes
      
      Interaction Rates:
      - Likes per second: 8 million
      - Comments per second: 200,000
      - Feed refreshes: 10 million/second
      - Story views: 5 million/second
      
      Feed Generation:
      - Average following: 500 users
      - Posts to rank per refresh: 1000
      - Feed requests: 500M * 20/day = 10 billion
      - Peak QPS: 500,000
      
      CDN Bandwidth:
      - Image requests: 500M * 100/day = 50 billion
      - Average bandwidth: 10 Gbps per edge location
      - Global bandwidth: 1 Tbps
      
      Database Operations:
      - Timeline reads: 10M QPS
      - Timeline writes: 1M QPS
      - Social graph queries: 5M QPS
      - Search queries: 500K QPS
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Mobile apps (iOS/Android)
         - Web application
         - Desktop app
         - API for third-party
      
      2. **API Gateway**
         - Authentication/authorization
         - Rate limiting
         - Request routing
         - Protocol conversion
      
      3. **Core Services**
         - Media Upload Service
         - Feed Generation Service
         - Story Service
         - Timeline Service
         - Notification Service
         - Messaging Service
         - Search Service
         - Live Streaming Service
      
      4. **Media Processing Pipeline**
         - Image Resizing Service
         - Video Transcoding Service
         - Filter Application Service
         - Thumbnail Generation
         - Content Moderation (AI)
         - Face Detection/Tagging
      
      5. **Storage Systems**
         - Object Storage (photos/videos)
         - Metadata Database
         - Graph Database (social connections)
         - Timeline Cache (Redis)
         - Story Storage (TTL-based)
      
      6. **ML/Recommendation**
         - Content Ranking Service
         - Explore Recommendations
         - Hashtag Trending
         - User Suggestions
         - Ad Targeting
      
      **Media Upload Flow:**
      
      1. Client uploads to nearest edge server
      2. Edge server forwards to upload service
      3. Media processing pipeline:
         - Generate multiple resolutions
         - Apply filters if requested
         - Extract metadata
         - Run content moderation
      4. Store in distributed object storage
      5. Update metadata database
      6. Trigger feed fanout
      7. Send notifications
    `,
    
    detailedDesign: `
      **1. Feed Generation System:**
      
      Hybrid Push-Pull Model:
      \`\`\`python
      class FeedGenerator:
          def __init__(self):
              self.celebrity_threshold = 10000  # followers
          
          def publish_post(self, user_id, post_id):
              user = get_user(user_id)
              
              if user.follower_count < self.celebrity_threshold:
                  # Push model for regular users
                  self.push_to_followers(user_id, post_id)
              else:
                  # Pull model for celebrities
                  self.mark_for_pull(user_id, post_id)
          
          def push_to_followers(self, user_id, post_id):
              followers = get_followers(user_id)
              
              # Batch insert into timelines
              for batch in chunks(followers, 1000):
                  timeline_entries = [
                      {
                          'user_id': follower_id,
                          'post_id': post_id,
                          'timestamp': now(),
                          'score': calculate_relevance_score(post_id, follower_id)
                      }
                      for follower_id in batch
                  ]
                  
                  # Write to timeline storage
                  timeline_db.batch_insert(timeline_entries)
                  
                  # Update cache for active users
                  for follower_id in batch:
                      if is_active(follower_id):
                          cache.zadd(f"timeline:{follower_id}", 
                                   {post_id: timestamp})
          
          def generate_feed(self, user_id):
              # Get pre-computed timeline (push)
              timeline_posts = cache.zrevrange(f"timeline:{user_id}", 0, 100)
              
              # Get celebrity posts (pull)
              followed_celebrities = get_celebrity_follows(user_id)
              celebrity_posts = []
              for celeb_id in followed_celebrities:
                  posts = cache.zrevrange(f"posts:{celeb_id}", 0, 10)
                  celebrity_posts.extend(posts)
              
              # Merge and rank
              all_posts = timeline_posts + celebrity_posts
              ranked_posts = self.rank_posts(all_posts, user_id)
              
              return ranked_posts[:50]  # Return top 50
          
          def rank_posts(self, posts, user_id):
              # ML-based ranking
              features = []
              for post in posts:
                  features.append({
                      'recency': time_since_posted(post),
                      'engagement': get_engagement_score(post),
                      'affinity': user_affinity_score(user_id, post.author_id),
                      'content_type': post.media_type,
                      'hashtag_match': hashtag_relevance(post, user_id)
                  })
              
              scores = ml_model.predict(features)
              return sorted(zip(posts, scores), key=lambda x: x[1], reverse=True)
      \`\`\`
      
      **2. Stories Implementation:**
      
      TTL-based Storage:
      \`\`\`python
      class StoryService:
          def upload_story(self, user_id, media_url):
              story_id = generate_id()
              
              # Store with 24-hour TTL
              story_data = {
                  'story_id': story_id,
                  'user_id': user_id,
                  'media_url': media_url,
                  'created_at': now(),
                  'expires_at': now() + timedelta(hours=24),
                  'view_count': 0,
                  'viewers': []
              }
              
              # Redis with automatic expiration
              redis.setex(
                  f"story:{story_id}",
                  86400,  # 24 hours in seconds
                  json.dumps(story_data)
              )
              
              # Add to user's story list
              redis.zadd(
                  f"user_stories:{user_id}",
                  {story_id: timestamp()}
              )
              
              # Notify followers
              self.notify_followers(user_id, story_id)
          
          def get_stories_feed(self, user_id):
              following = get_following(user_id)
              stories = []
              
              for followed_id in following:
                  # Get unexpired stories
                  user_stories = redis.zrangebyscore(
                      f"user_stories:{followed_id}",
                      now() - 86400,
                      now()
                  )
                  
                  if user_stories:
                      stories.append({
                          'user_id': followed_id,
                          'stories': user_stories,
                          'has_unseen': self.has_unseen(user_id, user_stories)
                      })
              
              # Sort by unseen first, then by recency
              return sorted(stories, key=lambda x: (x['has_unseen'], x['stories'][0]))
      \`\`\`
      
      **3. Image Processing Pipeline:**
      
      \`\`\`python
      class MediaProcessor:
          def process_upload(self, media_file, media_type):
              media_id = generate_id()
              
              if media_type == 'image':
                  return self.process_image(media_id, media_file)
              else:
                  return self.process_video(media_id, media_file)
          
          def process_image(self, media_id, image_file):
              # Generate multiple resolutions
              resolutions = {
                  'thumbnail': (150, 150),
                  'low': (320, 320),
                  'medium': (640, 640),
                  'high': (1080, 1080),
                  'original': None
              }
              
              urls = {}
              for name, size in resolutions.items():
                  if size:
                      resized = resize_image(image_file, size)
                      # Convert to progressive JPEG
                      optimized = optimize_image(resized, quality=85)
                  else:
                      optimized = image_file
                  
                  # Upload to CDN
                  url = cdn.upload(f"{media_id}_{name}.jpg", optimized)
                  urls[name] = url
              
              # Extract metadata
              metadata = {
                  'width': image_file.width,
                  'height': image_file.height,
                  'format': 'JPEG',
                  'size': len(image_file),
                  'exif': extract_exif(image_file),
                  'faces': detect_faces(image_file),
                  'labels': detect_objects(image_file)
              }
              
              # Content moderation
              if not self.is_appropriate(image_file):
                  raise ContentViolationError()
              
              return {
                  'media_id': media_id,
                  'urls': urls,
                  'metadata': metadata
              }
          
          def process_video(self, media_id, video_file):
              # Transcode to multiple formats
              formats = [
                  {'codec': 'h264', 'bitrate': '500k', 'resolution': '480p'},
                  {'codec': 'h264', 'bitrate': '1000k', 'resolution': '720p'},
                  {'codec': 'h264', 'bitrate': '2000k', 'resolution': '1080p'},
                  {'codec': 'h265', 'bitrate': '1000k', 'resolution': '1080p'}
              ]
              
              urls = {}
              for format in formats:
                  transcoded = transcode_video(video_file, format)
                  key = f"{format['resolution']}_{format['codec']}"
                  urls[key] = cdn.upload(f"{media_id}_{key}.mp4", transcoded)
              
              # Generate thumbnail
              thumbnail = extract_frame(video_file, timestamp=1)
              urls['thumbnail'] = cdn.upload(f"{media_id}_thumb.jpg", thumbnail)
              
              return {'media_id': media_id, 'urls': urls}
      \`\`\`
      
      **4. Notification System:**
      
      \`\`\`python
      class NotificationService:
          def __init__(self):
              self.redis = Redis()
              self.push_service = PushNotificationService()
          
          def send_notification(self, user_id, notification):
              # Store in notification feed
              self.redis.lpush(
                  f"notifications:{user_id}",
                  json.dumps(notification)
              )
              
              # Trim to last 100
              self.redis.ltrim(f"notifications:{user_id}", 0, 99)
              
              # Check if user is online
              if self.is_user_online(user_id):
                  # Send via WebSocket
                  websocket.send(user_id, notification)
              else:
                  # Send push notification
                  self.push_service.send(user_id, notification)
          
          def batch_notify(self, user_ids, notification_template):
              # Group by online status
              online_users = []
              offline_users = []
              
              for user_id in user_ids:
                  if self.is_user_online(user_id):
                      online_users.append(user_id)
                  else:
                      offline_users.append(user_id)
              
              # Send via WebSocket to online users
              websocket.broadcast(online_users, notification_template)
              
              # Batch push notifications for offline
              self.push_service.batch_send(offline_users, notification_template)
      \`\`\`
      
      **5. Search and Discovery:**
      
      \`\`\`python
      class SearchService:
          def search(self, query, search_type='all'):
              results = {
                  'users': [],
                  'hashtags': [],
                  'places': []
              }
              
              if search_type in ['all', 'users']:
                  # Search users
                  user_results = elasticsearch.search(
                      index='users',
                      body={
                          'query': {
                              'multi_match': {
                                  'query': query,
                                  'fields': ['username^3', 'name^2', 'bio']
                              }
                          },
                          'size': 20
                      }
                  )
                  results['users'] = user_results['hits']
              
              if search_type in ['all', 'hashtags']:
                  # Search hashtags with trending boost
                  hashtag_results = elasticsearch.search(
                      index='hashtags',
                      body={
                          'query': {
                              'function_score': {
                                  'query': {'prefix': {'tag': query}},
                                  'functions': [{
                                      'field_value_factor': {
                                          'field': 'usage_count',
                                          'factor': 1.2
                                      }
                                  }]
                              }
                          }
                      }
                  )
                  results['hashtags'] = hashtag_results['hits']
              
              return results
          
          def get_explore_feed(self, user_id):
              # Get user interests
              interests = self.analyze_user_interests(user_id)
              
              # Get trending content
              trending = self.get_trending_posts()
              
              # Get recommended posts
              recommended = ml_model.recommend(
                  user_id=user_id,
                  interests=interests,
                  exclude_following=True,
                  limit=100
              )
              
              # Mix content sources
              explore_feed = self.blend_content(
                  trending=trending,
                  recommended=recommended,
                  ratio={'trending': 0.3, 'recommended': 0.7}
              )
              
              return explore_feed
      \`\`\`
    `,
    
    dataFlow: `
      **Photo Upload Flow:**
      
      1. User selects photo and filters
      2. Client compresses image locally
      3. Upload to nearest edge server
      4. Edge server validates:
         - File size < 100MB
         - Supported format
         - User quota check
      5. Forward to processing pipeline:
         - Generate multiple resolutions
         - Apply selected filter
         - Run AI moderation
      6. Store processed images in S3
      7. Write metadata to database
      8. Trigger async tasks:
         - Update user's profile grid
         - Fan out to followers' feeds
         - Extract hashtags and mentions
         - Update search indices
      9. Return success with CDN URLs
      
      **Feed Generation Flow:**
      
      1. User opens app
      2. Client sends feed request with cursor
      3. Feed service checks cache
      4. If cache miss:
         - Fetch pre-computed timeline
         - Pull celebrity posts
         - Get recommended posts
      5. Rank posts using ML model:
         - Recency score
         - Engagement probability
         - User affinity
         - Content diversity
      6. Return top 20 posts
      7. Prefetch next batch
      8. Track impressions for analytics
      
      **Story Viewing Flow:**
      
      1. User taps story circle
      2. Fetch story metadata
      3. Preload first 3 stories
      4. Stream video/show image
      5. Auto-advance after 5 seconds
      6. Track view and update count
      7. Mark as seen for user
      8. Preload next stories
      9. Handle user interactions:
         - Reply with message
         - React with emoji
         - Skip to next/previous
      
      **Live Streaming Flow:**
      
      1. User starts live stream
      2. Connect to nearest media server
      3. Stream via RTMP protocol
      4. Media server tasks:
         - Transcode to HLS
         - Generate multiple bitrates
         - Create thumbnail
      5. Notify followers
      6. Viewers join stream:
         - Adaptive bitrate streaming
         - CDN distribution
         - < 3 second latency
      7. Real-time interactions:
         - Comments via WebSocket
         - Hearts/reactions
         - Viewer count updates
      8. Save replay after stream ends
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Celebrity Problem**
         Problem: Fanout for users with millions of followers
         Solution:
         - Hybrid push-pull model
         - Pull for celebrities (>10K followers)
         - Async fanout with priority queues
         - Dedicated celebrity infrastructure
      
      2. **Media Storage Costs**
         Problem: Storing exabytes of media
         Solution:
         - Intelligent compression (HEIF, WebP)
         - Deduplication for identical content
         - Tiered storage (hot/warm/cold)
         - Delete inactive account media
      
      3. **Feed Ranking Latency**
         Problem: ML inference for millions of requests
         Solution:
         - Pre-compute scores offline
         - Cache ranked feeds
         - Lightweight online reranking
         - Edge inference servers
      
      4. **Viral Content**
         Problem: Sudden traffic spikes
         Solution:
         - Aggressive CDN caching
         - Dynamic capacity scaling
         - Circuit breakers
         - Degrade to simpler ranking
      
      5. **Story Storage**
         Problem: Billions of temporary files
         Solution:
         - TTL-based storage
         - Lazy deletion
         - Separate story infrastructure
         - Memory-optimized databases
      
      6. **Real-time Features**
         Problem: Millions of concurrent connections
         Solution:
         - WebSocket connection pooling
         - Regional presence servers
         - Long polling fallback
         - Message queuing (Kafka)
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Multi-region deployment
         - Local points of presence
         - Edge computing for uploads
         - Regional data centers
      
      2. **Caching Strategy:**
         - CDN for all media (CloudFront)
         - Redis for hot data:
           * Active user timelines
           * Story metadata
           * Session data
         - Application-level caching
         - Database query caching
      
      3. **Database Scaling:**
         - Horizontal sharding by user_id
         - Read replicas per region
         - Separate clusters for:
           * User data
           * Social graph
           * Media metadata
           * Analytics
      
      4. **Microservices Architecture:**
         - Independent service scaling
         - Service mesh (Istio)
         - Container orchestration (K8s)
         - Auto-scaling based on metrics
      
      5. **Asynchronous Processing:**
         - Message queues for fanout
         - Batch processing for analytics
         - Delayed jobs for non-critical tasks
         - Event-driven architecture
      
      6. **ML Model Optimization:**
         - Model quantization
         - Edge deployment
         - Batch inference
         - Feature caching
         - A/B testing framework
    `
  },
  
  architecture: {
    svgPath: '/diagrams/instagram.svg',
    components: [
      { 
        name: 'Media Upload Service', 
        description: 'Handles photo/video uploads with resumable upload support' 
      },
      { 
        name: 'Media Processor', 
        description: 'Generates multiple resolutions, applies filters, runs AI moderation' 
      },
      { 
        name: 'Feed Generator', 
        description: 'Creates personalized feeds using ML ranking' 
      },
      { 
        name: 'Timeline Service', 
        description: 'Manages user timelines with hybrid push-pull model' 
      },
      { 
        name: 'Story Service', 
        description: 'Handles ephemeral content with TTL-based storage' 
      },
      { 
        name: 'Graph Database', 
        description: 'Stores social connections and relationships' 
      },
      { 
        name: 'Object Storage', 
        description: 'Distributed storage for billions of media files' 
      },
      { 
        name: 'Live Streaming', 
        description: 'RTMP ingestion and HLS streaming infrastructure' 
      },
      { 
        name: 'ML Pipeline', 
        description: 'Content recommendations and feed ranking' 
      }
    ]
  },
  
  apiDesign: `
    // Media Upload APIs
    
    POST /api/media/upload
    Headers: {
      Content-Type: multipart/form-data,
      Authorization: Bearer {token}
    }
    Body: {
      media: <binary>,
      caption: "Beautiful sunset 🌅",
      location: {lat: 37.7749, lng: -122.4194},
      tags: ["user123", "user456"],
      hashtags: ["sunset", "photography"]
    }
    Response: {
      post_id: "post_xyz",
      media_urls: {
        thumbnail: "https://cdn.instagram.com/...",
        medium: "https://cdn.instagram.com/...",
        high: "https://cdn.instagram.com/..."
      },
      processing_status: "complete"
    }
    
    // Feed APIs
    
    GET /api/feed/home
    Query: {
      cursor: "cursor_token",
      limit: 20
    }
    Response: {
      posts: [
        {
          post_id: "post_123",
          user: {
            user_id: "user_456",
            username: "johndoe",
            profile_picture: "https://..."
          },
          media: {
            type: "image",
            urls: {...},
            width: 1080,
            height: 1080
          },
          caption: "Great day!",
          likes_count: 1234,
          comments_count: 56,
          created_at: "2024-01-20T10:00:00Z",
          is_liked: true
        }
      ],
      next_cursor: "next_cursor_token"
    }
    
    // Stories APIs
    
    POST /api/stories/upload
    Body: {
      media: <binary>,
      stickers: [
        {type: "location", data: {...}},
        {type: "poll", data: {...}}
      ],
      duration: 5
    }
    Response: {
      story_id: "story_abc",
      expires_at: "2024-01-21T10:00:00Z"
    }
    
    GET /api/stories/feed
    Response: {
      stories: [
        {
          user_id: "user_123",
          username: "alice",
          profile_picture: "https://...",
          stories: [
            {
              story_id: "story_1",
              media_url: "https://...",
              created_at: "2024-01-20T08:00:00Z",
              has_seen: false
            }
          ]
        }
      ]
    }
    
    // Interaction APIs
    
    POST /api/posts/{post_id}/like
    Response: {
      liked: true,
      likes_count: 1235
    }
    
    POST /api/posts/{post_id}/comment
    Body: {
      text: "Amazing photo! 📸",
      reply_to: "comment_123" // optional
    }
    Response: {
      comment_id: "comment_456",
      created_at: "2024-01-20T10:30:00Z"
    }
    
    // Live Streaming APIs
    
    POST /api/live/start
    Response: {
      stream_id: "stream_123",
      rtmp_url: "rtmp://live.instagram.com/live",
      stream_key: "xyz_secret_key"
    }
    
    GET /api/live/{stream_id}/join
    Response: {
      hls_url: "https://live.instagram.com/stream_123.m3u8",
      viewer_count: 523,
      is_live: true
    }
    
    // WebSocket Events
    
    WS /api/ws
    
    // Server -> Client
    {
      type: "notification",
      data: {
        type: "like",
        user: "alice",
        post_id: "post_123",
        timestamp: "2024-01-20T10:00:00Z"
      }
    }
    
    {
      type: "live_comment",
      data: {
        stream_id: "stream_123",
        user: "bob",
        comment: "Hello!",
        timestamp: "2024-01-20T10:00:00Z"
      }
    }
    
    // Search APIs
    
    GET /api/search
    Query: {
      q: "sunset",
      type: "hashtag", // user|hashtag|place
      limit: 20
    }
    Response: {
      results: [
        {
          type: "hashtag",
          tag: "sunset",
          post_count: 45678234,
          recent_media: [...]
        }
      ]
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for user data and metadata
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY,
        username VARCHAR(30) UNIQUE,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(100),
        bio TEXT,
        profile_picture_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_private BOOLEAN DEFAULT FALSE,
        follower_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        post_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE posts (
        post_id UUID PRIMARY KEY,
        user_id BIGINT REFERENCES users(user_id),
        media_type VARCHAR(20), -- image|video|carousel
        media_urls JSONB,
        caption TEXT,
        location JSONB,
        like_count INT DEFAULT 0,
        comment_count INT DEFAULT 0,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_posts (user_id, created_at DESC),
        INDEX idx_created (created_at DESC)
      );
      
      CREATE TABLE comments (
        comment_id UUID PRIMARY KEY,
        post_id UUID REFERENCES posts(post_id),
        user_id BIGINT REFERENCES users(user_id),
        text TEXT,
        reply_to UUID,
        like_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_comments (post_id, created_at)
      );
      
      CREATE TABLE likes (
        user_id BIGINT,
        post_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id),
        INDEX idx_post_likes (post_id)
      );
      
      CREATE TABLE stories (
        story_id UUID PRIMARY KEY,
        user_id BIGINT REFERENCES users(user_id),
        media_url TEXT,
        stickers JSONB,
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        INDEX idx_user_stories (user_id, created_at DESC),
        INDEX idx_expires (expires_at)
      );
      
      CREATE TABLE story_views (
        story_id UUID,
        viewer_id BIGINT,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (story_id, viewer_id)
      );
    `,
    
    nosql: `
      // Cassandra for timeline/feed data
      
      CREATE KEYSPACE instagram WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'us-east': 3,
        'us-west': 3,
        'eu-west': 3
      };
      
      CREATE TABLE timelines (
        user_id bigint,
        post_id uuid,
        author_id bigint,
        timestamp timestamp,
        score float,
        PRIMARY KEY (user_id, timestamp, post_id)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);
      
      CREATE TABLE user_feed (
        user_id bigint,
        post_id uuid,
        created_at timestamp,
        PRIMARY KEY (user_id, created_at, post_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC);
      
      // Neo4j for social graph
      
      CREATE (u:User {user_id: 123, username: "alice"})
      CREATE (u2:User {user_id: 456, username: "bob"})
      CREATE (u)-[:FOLLOWS {since: timestamp()}]->(u2)
      CREATE (u2)-[:FOLLOWS {since: timestamp()}]->(u)
      
      // Get followers
      MATCH (u:User {user_id: $userId})<-[:FOLLOWS]-(follower)
      RETURN follower.user_id
      
      // Get mutual friends
      MATCH (u:User {user_id: $userId})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(u)
      RETURN friend.user_id
      
      // Redis for caching
      
      // User timeline cache
      ZADD timeline:123 1705744800 "post_abc"
      ZADD timeline:123 1705744900 "post_xyz"
      
      // Story metadata
      HSET story:abc user_id 123 media_url "https://..." expires_at 1705831200
      EXPIRE story:abc 86400
      
      // Active story users (for story ring)
      SADD active_stories 123 456 789
      EXPIRE active_stories 86400
      
      // Trending hashtags
      ZINCRBY trending:hashtags 1 "sunset"
      ZREVRANGE trending:hashtags 0 9 WITHSCORES
      
      // User session
      HSET session:token123 user_id 123 device "iPhone" last_active 1705744800
      EXPIRE session:token123 3600
      
      // Live stream viewers
      SADD live:stream123:viewers 456 789
      SCARD live:stream123:viewers
      
      // ElasticSearch for search
      
      PUT /users/_doc/123
      {
        "user_id": 123,
        "username": "alice",
        "name": "Alice Smith",
        "bio": "Photographer & Traveler",
        "follower_count": 10000,
        "is_verified": true
      }
      
      PUT /hashtags/_doc/sunset
      {
        "tag": "sunset",
        "post_count": 45678234,
        "trending_score": 0.89,
        "related_tags": ["photography", "nature", "sky"]
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Feed Generation Strategy',
      analysis: `
        Pull Model:
        ✓ No pre-computation needed
        ✓ Works well for celebrities
        ✗ High latency
        ✗ Heavy read load
        
        Push Model:
        ✓ Fast feed retrieval
        ✓ Pre-computed timelines
        ✗ Celebrity fanout problem
        ✗ Storage intensive
        
        Hybrid (Chosen):
        ✓ Push for regular users (<10K followers)
        ✓ Pull for celebrities
        ✓ Balanced approach
        ✗ Complex implementation
        
        Decision: Hybrid model optimizes for both cases
      `
    },
    {
      decision: 'Storage Strategy',
      analysis: `
        Single Resolution:
        ✓ Simple
        ✓ Less storage
        ✗ Poor mobile experience
        ✗ Bandwidth waste
        
        Multiple Resolutions (Chosen):
        ✓ Optimal bandwidth usage
        ✓ Better user experience
        ✓ Device-specific delivery
        ✗ 3-4x storage cost
        
        On-demand Resizing:
        ✓ Storage efficient
        ✗ High CPU cost
        ✗ Latency issues
        
        Decision: Pre-generate multiple resolutions for performance
      `
    },
    {
      decision: 'Story Storage',
      analysis: `
        Permanent Storage with Flags:
        ✓ Simple deletion logic
        ✗ Storage waste
        ✗ Cleanup complexity
        
        TTL-based Storage (Chosen):
        ✓ Automatic expiration
        ✓ No cleanup needed
        ✓ Memory efficient
        ✗ Redis memory limits
        
        Lazy Deletion:
        ✓ Spread cleanup load
        ✗ Inconsistent state
        
        Decision: TTL-based with Redis for automatic cleanup
      `
    },
    {
      decision: 'Database Choice',
      analysis: `
        Single PostgreSQL:
        ✓ ACID compliance
        ✓ Simple
        ✗ Scaling limitations
        
        Polyglot Persistence (Chosen):
        ✓ PostgreSQL for user data
        ✓ Cassandra for timelines
        ✓ Neo4j for social graph
        ✓ Redis for caching
        ✓ Best tool for each job
        ✗ Operational complexity
        
        Decision: Multiple databases optimized for specific use cases
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Instagram System Design Interview',
        youtubeId: 'QmX2NPkJTKg',
        duration: '67:14'
      },
      { 
        title: 'Scaling Instagram Infrastructure',
        youtubeId: 'hnpzNAPiC0E',
        duration: '32:45'
      }
    ],
    articles: [
      {
        title: 'Instagram Engineering Blog',
        url: 'https://instagram-engineering.com/'
      },
      {
        title: 'Scaling Instagram - 1 Billion Users',
        url: 'https://engineering.fb.com/2021/09/21/production-engineering/instagram-scaling/'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 2: Design Instagram'
      }
    ]
  }
}