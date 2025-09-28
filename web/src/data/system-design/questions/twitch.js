// Twitch System Design Question
export default {
  id: 'twitch',
  title: 'Design Twitch',
  companies: ['Amazon', 'Twitch', 'YouTube', 'Facebook Gaming', 'Discord'],
  difficulty: 'Hard',
  category: 'Video & Streaming',
  
  description: 'Design a live streaming platform that supports millions of concurrent viewers, real-time chat, video transcoding, clips generation, and creator monetization features.',
  
  requirements: {
    functional: [
      'Live video streaming (up to 4K 60fps)',
      'Real-time chat with emotes and moderation',
      'Multiple quality options (auto, 1080p, 720p, 480p, 360p, 160p)',
      'VOD (Video on Demand) - past broadcasts',
      'Clips - 60-second highlight creation',
      'Channel subscriptions and donations',
      'Bits (virtual currency) system',
      'Stream categories and discovery',
      'Raids and hosting other channels',
      'Moderator tools and AutoMod',
      'Stream alerts and notifications',
      'Mobile streaming support',
      'Co-streaming/Squad streams',
      'Extensions and overlays'
    ],
    nonFunctional: [
      'Support 15 million daily active users',
      'Support 7.5 million concurrent viewers',
      'Average 150,000 concurrent live channels',
      'Stream latency < 5 seconds (low latency mode < 2 seconds)',
      'Chat latency < 500ms globally',
      '99.9% availability',
      'Support streams up to 24 hours continuous',
      'Transcode to 5+ quality levels in real-time',
      'Store VODs for 14-60 days',
      'Handle 15 million chat messages per second (peak)',
      'Global CDN distribution'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Twitch, a live streaming platform. The key challenges are:
      
      1. Ultra-low latency live video distribution to millions
      2. Real-time transcoding for multiple quality levels
      3. Massive scale chat system with emotes
      4. Global CDN for worldwide distribution
      5. VOD storage and clips generation
      6. Creator monetization and analytics
      7. Content moderation at scale
      8. Stream discovery and recommendations
      
      The system needs to handle everything from small streamers to events with millions of viewers while maintaining low latency for interaction between streamers and viewers.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Streaming Statistics:
      - Daily active users: 15 million
      - Concurrent viewers (peak): 7.5 million
      - Concurrent live channels: 150,000
      - Average viewers per stream: 50
      - Top streams: 500,000+ concurrent viewers
      
      Video Bandwidth:
      - Source stream: 6-8 Mbps (1080p 60fps)
      - Total ingest: 150K * 7 Mbps = 1.05 Tbps
      - Viewer bandwidth (avg 720p): 2.5 Mbps
      - Total egress: 7.5M * 2.5 Mbps = 18.75 Tbps
      - CDN bandwidth multiplier: 3x = 56 Tbps globally
      
      Transcoding Requirements:
      - Streams to transcode: 150,000
      - Qualities per stream: 5 (1080p, 720p, 480p, 360p, 160p)
      - Transcoding servers needed: 15,000 (10 streams per server)
      - GPU resources: 30,000 GPUs
      
      Storage Requirements:
      - VOD storage per day: 150K * 3 hours * 3 GB/hour = 1.35 PB
      - 30-day retention: 40 PB
      - Clips per day: 1 million * 100 MB = 100 TB
      - Total storage with redundancy: 150 PB
      
      Chat System:
      - Messages per second (average): 2 million
      - Messages per second (peak): 15 million
      - Emote renders per second: 5 million
      - Mod actions per second: 10,000
      
      Database Operations:
      - Stream metadata updates: 500K QPS
      - User authentications: 100K QPS
      - Subscription transactions: 10K QPS
      - Analytics writes: 1M QPS
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Streaming Layer**
         - Ingest servers (RTMP)
         - Transcoding clusters
         - Origin servers
         - Edge servers (CDN)
         - Low latency infrastructure
      
      2. **Application Services**
         - Stream Management Service
         - Chat Service
         - User Service
         - Discovery Service
         - Monetization Service
         - Clips Service
         - VOD Service
         - Analytics Service
      
      3. **Real-time Infrastructure**
         - WebSocket servers (chat)
         - PubSub system
         - Notification service
         - Stream alerts
      
      4. **Storage Systems**
         - Object storage (videos)
         - Database (metadata)
         - Cache layer (Redis)
         - Time-series DB (metrics)
         - Search index
      
      5. **Content Delivery**
         - Global CDN
         - Edge locations
         - Peering points
         - Adaptive bitrate
      
      6. **Processing Pipeline**
         - Video transcoding
         - Thumbnail generation
         - Clip processing
         - VOD generation
         - ML recommendations
      
      **Streaming Flow:**
      
      1. Streamer broadcasts via OBS/streaming software
      2. RTMP ingest at nearest POP
      3. Forward to transcoding cluster
      4. Transcode to multiple qualities
      5. Distribute to CDN edge servers
      6. Viewers pull adaptive bitrate stream
    `,
    
    detailedDesign: `
      **1. Video Ingestion and Transcoding:**
      
      RTMP Ingest Server:
      \`\`\`python
      class IngestServer:
          def __init__(self):
              self.streams = {}
              self.transcoders = TranscoderPool()
              
          async def handle_stream(self, stream_key, rtmp_stream):
              # Validate stream key
              channel = await self.validate_stream_key(stream_key)
              if not channel:
                  return self.reject_stream("Invalid stream key")
              
              # Check if already streaming
              if channel.is_live:
                  return self.reject_stream("Already streaming")
              
              # Allocate transcoder resources
              transcoder = self.transcoders.allocate(channel.quality_preset)
              
              # Start ingesting
              stream_id = generate_stream_id()
              self.streams[stream_id] = {
                  'channel': channel,
                  'transcoder': transcoder,
                  'start_time': time.time(),
                  'viewer_count': 0
              }
              
              # Process incoming stream
              async for chunk in rtmp_stream:
                  # Forward to transcoder
                  await transcoder.process_chunk(chunk)
                  
                  # Store original for VOD
                  await self.store_original_chunk(stream_id, chunk)
                  
                  # Update stream health metrics
                  self.monitor_stream_health(stream_id, chunk)
              
              # Stream ended
              await self.end_stream(stream_id)
          
          async def store_original_chunk(self, stream_id, chunk):
              # Store in segments for HLS
              segment_duration = 2  # seconds
              segment_key = f"{stream_id}/segment_{chunk.timestamp}.ts"
              
              await s3.put_object(
                  Bucket='twitch-source-videos',
                  Key=segment_key,
                  Body=chunk.data
              )
              
              # Update manifest
              await self.update_hls_manifest(stream_id, segment_key)
      \`\`\`
      
      Transcoding Pipeline:
      \`\`\`python
      class TranscodingPipeline:
          def __init__(self):
              self.gpu_pool = GPUResourcePool()
              self.quality_ladder = [
                  {'name': '1080p60', 'resolution': '1920x1080', 'bitrate': 6000, 'fps': 60},
                  {'name': '720p60', 'resolution': '1280x720', 'bitrate': 3500, 'fps': 60},
                  {'name': '720p30', 'resolution': '1280x720', 'bitrate': 2500, 'fps': 30},
                  {'name': '480p30', 'resolution': '854x480', 'bitrate': 1200, 'fps': 30},
                  {'name': '360p30', 'resolution': '640x360', 'bitrate': 800, 'fps': 30},
                  {'name': '160p30', 'resolution': '284x160', 'bitrate': 300, 'fps': 30}
              ]
          
          async def transcode_segment(self, input_segment):
              # Allocate GPU for hardware acceleration
              gpu = await self.gpu_pool.acquire()
              
              try:
                  outputs = []
                  for quality in self.quality_ladder:
                      # Skip higher qualities if source is lower
                      if self.exceeds_source_quality(input_segment, quality):
                          continue
                      
                      # Transcode using FFmpeg with GPU
                      output = await self.transcode_with_gpu(
                          input_segment,
                          quality,
                          gpu
                      )
                      
                      outputs.append({
                          'quality': quality['name'],
                          'data': output,
                          'bitrate': quality['bitrate']
                      })
                  
                  return outputs
                  
              finally:
                  await self.gpu_pool.release(gpu)
          
          async def transcode_with_gpu(self, input_segment, quality, gpu):
              cmd = [
                  'ffmpeg',
                  '-hwaccel', 'nvenc',  # NVIDIA GPU encoding
                  '-i', input_segment,
                  '-c:v', 'h264_nvenc',
                  '-preset', 'llhq',  # Low latency high quality
                  '-b:v', f"{quality['bitrate']}k",
                  '-s', quality['resolution'],
                  '-r', str(quality['fps']),
                  '-g', str(quality['fps'] * 2),  # GOP size
                  '-c:a', 'aac',
                  '-b:a', '128k',
                  '-f', 'mpegts',
                  'pipe:1'
              ]
              
              return await run_ffmpeg(cmd, gpu_id=gpu.id)
      \`\`\`
      
      **2. Low Latency Streaming:**
      
      \`\`\`python
      class LowLatencyStreaming:
          def __init__(self):
              self.segment_duration = 1  # 1 second segments for low latency
              self.playlist_length = 3  # Keep only 3 segments in playlist
              
          def generate_hls_manifest(self, stream_id, segments):
              manifest = [
                  '#EXTM3U',
                  '#EXT-X-VERSION:7',
                  '#EXT-X-TARGETDURATION:1',
                  f'#EXT-X-MEDIA-SEQUENCE:{segments[0].sequence}',
                  '#EXT-X-PLAYLIST-TYPE:EVENT',
                  '#EXT-X-PART-INF:PART-TARGET=0.33',  # 333ms parts
              ]
              
              for segment in segments[-self.playlist_length:]:
                  # Add partial segments for even lower latency
                  for part in segment.parts:
                      manifest.append(
                          f'#EXT-X-PART:DURATION={part.duration},'
                          f'URI="{part.uri}",INDEPENDENT=YES'
                      )
                  
                  manifest.append(f'#EXTINF:{segment.duration},')
                  manifest.append(segment.uri)
              
              # Preload hint for next segment
              next_part = self.predict_next_part(stream_id)
              manifest.append(f'#EXT-X-PRELOAD-HINT:TYPE=PART,URI="{next_part}"')
              
              return '\\n'.join(manifest)
          
          async def push_to_cdn(self, stream_id, segment):
              # Push to multiple edge locations simultaneously
              edge_servers = self.get_nearest_edges(stream_id)
              
              tasks = []
              for edge in edge_servers:
                  task = self.push_segment_to_edge(edge, stream_id, segment)
                  tasks.append(task)
              
              await asyncio.gather(*tasks)
      \`\`\`
      
      **3. Chat System Architecture:**
      
      \`\`\`python
      class ChatService:
          def __init__(self):
              self.connections = {}  # channel -> set of websockets
              self.rate_limiter = RateLimiter()
              self.emote_cache = EmoteCache()
              self.mod_tools = ModeratorTools()
              
          async def handle_message(self, channel_id, user_id, message):
              # Rate limiting
              if not await self.rate_limiter.check(user_id):
                  return {'error': 'Rate limited', 'wait': 30}
              
              # Check user privileges
              user_role = await self.get_user_role(channel_id, user_id)
              
              # Run through AutoMod if enabled
              if await self.channel_has_automod(channel_id):
                  mod_result = await self.mod_tools.check_message(
                      message,
                      channel_settings=await self.get_channel_settings(channel_id)
                  )
                  
                  if mod_result.action == 'block':
                      return {'error': 'Message blocked by AutoMod'}
                  elif mod_result.action == 'flag':
                      await self.flag_for_review(channel_id, user_id, message)
              
              # Parse emotes
              message_with_emotes = await self.parse_emotes(message, user_id)
              
              # Prepare chat message
              chat_msg = {
                  'id': generate_id(),
                  'channel_id': channel_id,
                  'user_id': user_id,
                  'username': await self.get_username(user_id),
                  'message': message,
                  'emotes': message_with_emotes.emotes,
                  'badges': await self.get_user_badges(channel_id, user_id),
                  'color': await self.get_user_color(user_id),
                  'timestamp': time.time(),
                  'user_role': user_role
              }
              
              # Store in chat history
              await self.store_chat_message(chat_msg)
              
              # Broadcast to all connections in channel
              await self.broadcast_to_channel(channel_id, chat_msg)
              
              # Update chat statistics
              await self.update_chat_stats(channel_id)
              
              return {'success': True, 'message_id': chat_msg['id']}
          
          async def broadcast_to_channel(self, channel_id, message):
              connections = self.connections.get(channel_id, set())
              
              # Serialize message once
              msg_json = json.dumps(message)
              
              # Send to all connections in parallel
              tasks = []
              for ws in connections:
                  tasks.append(ws.send(msg_json))
              
              # Remove failed connections
              results = await asyncio.gather(*tasks, return_exceptions=True)
              for ws, result in zip(connections.copy(), results):
                  if isinstance(result, Exception):
                      connections.discard(ws)
          
          def scale_chat_servers(self, channel_id, viewer_count):
              # Dynamically scale chat servers based on load
              if viewer_count > 100000:
                  # Shard chat across multiple servers
                  shard_count = math.ceil(viewer_count / 50000)
                  return self.create_chat_shards(channel_id, shard_count)
              else:
                  return self.get_default_chat_server(channel_id)
      \`\`\`
      
      **4. Clips Generation System:**
      
      \`\`\`python
      class ClipsService:
          def __init__(self):
              self.buffer_duration = 90  # Keep 90 seconds in buffer
              self.clip_duration = 60  # Max clip length
              self.processing_queue = Queue()
              
          async def create_clip(self, channel_id, user_id, timestamp, duration):
              # Validate clip parameters
              if duration > self.clip_duration:
                  return {'error': f'Clip too long. Max {self.clip_duration}s'}
              
              # Get buffered video segments
              segments = await self.get_buffered_segments(
                  channel_id,
                  timestamp - duration,
                  timestamp
              )
              
              if not segments:
                  return {'error': 'Video not available for clipping'}
              
              # Create clip job
              clip_job = {
                  'clip_id': generate_clip_id(),
                  'channel_id': channel_id,
                  'creator_id': user_id,
                  'source_segments': segments,
                  'start_time': timestamp - duration,
                  'duration': duration,
                  'status': 'processing'
              }
              
              # Queue for processing
              await self.processing_queue.put(clip_job)
              
              # Return immediately with clip ID
              return {
                  'clip_id': clip_job['clip_id'],
                  'status': 'processing',
                  'estimated_time': 30  # seconds
              }
          
          async def process_clip(self, clip_job):
              # Download source segments
              video_segments = await self.download_segments(
                  clip_job['source_segments']
              )
              
              # Concatenate and trim
              raw_clip = await self.concatenate_segments(video_segments)
              trimmed_clip = await self.trim_video(
                  raw_clip,
                  clip_job['start_time'],
                  clip_job['duration']
              )
              
              # Generate multiple qualities
              qualities = ['1080p', '720p', '480p']
              clip_versions = {}
              
              for quality in qualities:
                  encoded = await self.encode_clip(trimmed_clip, quality)
                  
                  # Upload to CDN
                  cdn_url = await self.upload_to_cdn(
                      f"clips/{clip_job['clip_id']}/{quality}.mp4",
                      encoded
                  )
                  
                  clip_versions[quality] = cdn_url
              
              # Generate thumbnail
              thumbnail = await self.generate_thumbnail(trimmed_clip)
              thumbnail_url = await self.upload_to_cdn(
                  f"clips/{clip_job['clip_id']}/thumbnail.jpg",
                  thumbnail
              )
              
              # Update clip status
              await self.update_clip_metadata(clip_job['clip_id'], {
                  'status': 'ready',
                  'urls': clip_versions,
                  'thumbnail': thumbnail_url,
                  'view_count': 0
              })
              
              # Notify creator
              await self.notify_clip_ready(clip_job['creator_id'], clip_job['clip_id'])
      \`\`\`
      
      **5. CDN Distribution Strategy:**
      
      \`\`\`python
      class CDNManager:
          def __init__(self):
              self.edge_locations = self.initialize_edges()
              self.hot_streams = {}  # Track popular streams
              
          async def get_stream_url(self, channel_id, user_location):
              # Find nearest edge server
              nearest_edge = self.find_nearest_edge(user_location)
              
              # Check if stream is cached at edge
              if await nearest_edge.has_stream(channel_id):
                  return nearest_edge.get_stream_url(channel_id)
              
              # Stream not cached, need to pull from origin
              origin = self.get_origin_server(channel_id)
              
              # Pre-cache if stream is popular
              viewer_count = await self.get_viewer_count(channel_id)
              if viewer_count > 1000:
                  await self.pre_cache_at_edge(nearest_edge, channel_id, origin)
              
              # Return pull-through URL
              return nearest_edge.get_pull_through_url(channel_id, origin)
          
          async def pre_warm_popular_streams(self):
              # Get top streams
              top_streams = await self.get_top_streams(limit=100)
              
              for stream in top_streams:
                  # Determine edges to pre-warm based on viewer geography
                  viewer_locations = await self.get_viewer_geography(stream.channel_id)
                  
                  for location, viewer_percentage in viewer_locations.items():
                      if viewer_percentage > 0.05:  # More than 5% of viewers
                          edge = self.get_edge_for_location(location)
                          await edge.pre_cache_stream(stream.channel_id)
          
          def implement_anycast(self):
              # Use anycast IP for automatic routing to nearest edge
              return {
                  'live_hls': '151.101.0.0/16',  # Anycast IP range
                  'websocket': '151.102.0.0/16',  # Chat anycast
                  'vod': '151.103.0.0/16'  # VOD anycast
              }
      \`\`\`
      
      **6. Analytics and Monitoring:**
      
      \`\`\`python
      class StreamAnalytics:
          def __init__(self):
              self.metrics_buffer = []
              self.aggregation_interval = 60  # seconds
              
          async def collect_metrics(self, stream_id):
              metrics = {
                  'timestamp': time.time(),
                  'viewer_count': await self.get_viewer_count(stream_id),
                  'chat_rate': await self.get_chat_rate(stream_id),
                  'bitrate': await self.get_stream_bitrate(stream_id),
                  'dropped_frames': await self.get_dropped_frames(stream_id),
                  'average_latency': await self.measure_latency(stream_id),
                  'quality_distribution': await self.get_quality_stats(stream_id),
                  'geographic_distribution': await self.get_geo_stats(stream_id),
                  'device_types': await self.get_device_stats(stream_id)
              }
              
              # Store in time-series database
              await self.store_metrics(stream_id, metrics)
              
              # Update real-time dashboard
              await self.update_dashboard(stream_id, metrics)
              
              # Check for alerts
              await self.check_alert_conditions(stream_id, metrics)
              
              return metrics
      \`\`\`
    `,
    
    dataFlow: `
      **Stream Start Flow:**
      
      1. Streamer configures OBS/streaming software
      2. Start stream with stream key
      3. RTMP connection to ingest server
      4. Validate stream key and check permissions
      5. Allocate transcoding resources
      6. Begin receiving video/audio data
      7. Start transcoding pipeline:
         - Decode source stream
         - Generate multiple qualities
         - Package as HLS segments
      8. Push segments to origin servers
      9. Update stream metadata (title, category, etc.)
      10. Notify followers stream is live
      11. Add to discovery/browse sections
      
      **Viewer Join Flow:**
      
      1. User clicks on stream
      2. Load stream page and player
      3. Geolocate to nearest CDN edge
      4. Request HLS manifest
      5. If not cached:
         - Edge pulls from origin
         - Cache for future viewers
      6. Start downloading segments
      7. Adaptive bitrate selection:
         - Monitor bandwidth
         - Switch qualities seamlessly
      8. Connect to chat WebSocket
      9. Load chat history (last 100 messages)
      10. Begin rendering video and chat
      
      **Chat Message Flow:**
      
      1. User types message
      2. Client-side validation
      3. Send via WebSocket
      4. Server rate limit check
      5. AutoMod filtering:
         - Check for banned words
         - Detect spam patterns
         - Flag suspicious content
      6. Parse emotes and badges
      7. Store in chat database
      8. Broadcast to all viewers:
         - Shard if > 100K viewers
         - Regional chat servers
      9. Update chat metrics
      10. Render in all connected clients
      
      **Clip Creation Flow:**
      
      1. Viewer clicks "Clip" button
      2. Client captures timestamp
      3. Send clip request to API
      4. Validate user permissions
      5. Check video buffer availability
      6. Create clip job:
         - Mark start/end timestamps
         - Queue for processing
      7. Return clip ID to user
      8. Background processing:
         - Download source segments
         - Trim to exact timestamps
         - Transcode to multiple qualities
         - Generate thumbnail
      9. Upload to CDN
      10. Update clip metadata
      11. Notify creator when ready
      12. Add to channel's clips section
      
      **VOD Generation Flow:**
      
      1. Stream ends
      2. Concatenate all segments
      3. Generate complete VOD file
      4. Create multiple qualities:
         - Same as live qualities
         - Add audio-only version
      5. Generate chapters/timestamps
      6. Create thumbnail grid
      7. Upload to S3 cold storage
      8. Update VOD metadata
      9. Apply retention policy:
         - Regular users: 14 days
         - Affiliates: 14 days
         - Partners: 60 days
      10. Make available on channel page
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Transcoding Capacity**
         Problem: GPU shortage during peak hours
         Solution:
         - Auto-scaling GPU clusters
         - Spot instances for non-critical streams
         - Reduce quality ladder for small streams
         - Hardware encoding (NVENC, QuickSync)
      
      2. **Chat Server Overload**
         Problem: Popular streams with 500K+ viewers
         Solution:
         - Horizontal sharding by user ID
         - Regional chat servers
         - Message aggregation/sampling
         - Read-only mode for massive streams
      
      3. **CDN Cache Misses**
         Problem: Long tail of small streams
         Solution:
         - Predictive pre-warming
         - Tiered caching strategy
         - Direct viewer-to-origin for <10 viewers
         - P2P assist for popular streams
      
      4. **Ingest Server Failure**
         Problem: Streamer disconnection
         Solution:
         - Multiple ingest points
         - Automatic reconnection
         - Buffer last 30 seconds
         - Seamless failover
      
      5. **Database Write Throughput**
         Problem: Analytics and chat history
         Solution:
         - Write batching
         - Separate analytics cluster
         - Time-series database for metrics
         - Eventual consistency for non-critical data
      
      6. **Storage Costs**
         Problem: Storing all VODs is expensive
         Solution:
         - Tiered storage (hot/warm/cold)
         - Compress older VODs
         - Delete VODs with <10 views
         - Charge for extended storage
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Ingest POPs in 50+ cities
         - Transcoding clusters in 20 regions
         - CDN edges in 200+ locations
         - Chat servers in 15 regions
      
      2. **Auto-scaling Policies:**
         - Scale transcoders based on stream count
         - Scale chat servers based on message rate
         - Scale CDN based on viewer geography
         - Scale storage based on VOD retention
      
      3. **Load Balancing:**
         - GeoDNS for ingest routing
         - Anycast for CDN routing
         - Consistent hashing for chat sharding
         - Least-connections for transcoders
      
      4. **Caching Strategy:**
         - L1: Edge server memory (segments)
         - L2: Edge server disk (recent streams)
         - L3: Regional cache (popular content)
         - Origin: Source of truth
      
      5. **Quality Optimization:**
         - Skip transcoding for <10 viewers
         - Reduce quality options for small streams
         - Prioritize partners for resources
         - Dynamic bitrate ladders
      
      6. **Cost Optimizations:**
         - Peering agreements with ISPs
         - Compression (H.265 for VODs)
         - P2P offloading for popular streams
         - Sponsored transcoding (NVIDIA partnership)
      
      7. **Database Scaling:**
         - Shard by channel ID
         - Read replicas for analytics
         - Separate clusters for different data types
         - Archive old data to cold storage
    `
  },
  
  architecture: {
    svgPath: '/diagrams/twitch.svg',
    components: [
      { 
        name: 'Ingest Servers', 
        description: 'RTMP servers that receive streams from broadcasters' 
      },
      { 
        name: 'Transcoding Cluster', 
        description: 'GPU-accelerated servers for real-time video transcoding' 
      },
      { 
        name: 'Origin Servers', 
        description: 'Store and serve HLS segments to CDN' 
      },
      { 
        name: 'CDN Edge Servers', 
        description: 'Global distribution network for low-latency delivery' 
      },
      { 
        name: 'Chat Servers', 
        description: 'WebSocket servers for real-time chat' 
      },
      { 
        name: 'API Services', 
        description: 'RESTful APIs for platform features' 
      },
      { 
        name: 'VOD Storage', 
        description: 'S3-based storage for past broadcasts and clips' 
      },
      { 
        name: 'Analytics Pipeline', 
        description: 'Real-time and batch processing of viewer metrics' 
      }
    ]
  },
  
  apiDesign: `
    // Streaming APIs
    
    POST /api/stream/start
    Headers: {
      Authorization: "Bearer {stream_key}"
    }
    Request: {
      title: "Playing Valorant - Ranked Grind",
      category: "Valorant",
      tags: ["English", "PC", "Competitive"],
      mature_content: false
    }
    Response: {
      stream_id: "stream_abc123",
      ingest_url: "rtmp://ingest.twitch.tv/live",
      backup_urls: [
        "rtmp://ingest-sfo.twitch.tv/live",
        "rtmp://ingest-lax.twitch.tv/live"
      ],
      stream_key: "{user_stream_key}"
    }
    
    GET /api/stream/{channel_id}/playback
    Response: {
      channel: "shroud",
      stream_id: "stream_abc123",
      is_live: true,
      playback_url: "https://usher.ttvnw.net/api/channel/hls/shroud.m3u8",
      qualities: [
        {quality: "Source", bitrate: 6000, fps: 60},
        {quality: "1080p60", bitrate: 4500, fps: 60},
        {quality: "720p60", bitrate: 3000, fps: 60},
        {quality: "720p", bitrate: 2000, fps: 30},
        {quality: "480p", bitrate: 1200, fps: 30},
        {quality: "360p", bitrate: 800, fps: 30},
        {quality: "160p", bitrate: 300, fps: 30}
      ],
      viewer_count: 45234,
      started_at: "2024-01-20T15:00:00Z"
    }
    
    // Chat WebSocket API
    
    WS /api/chat/connect
    
    // Client -> Server: Join channel
    {
      type: "JOIN",
      channel: "shroud",
      auth_token: "oauth:token123"
    }
    
    // Server -> Client: Message
    {
      type: "MESSAGE",
      channel: "shroud",
      user: {
        id: "user123",
        login: "pokimane",
        display_name: "Pokimane",
        badges: ["verified", "subscriber/12"],
        color: "#FF69B4"
      },
      message: "Great play! PogChamp",
      emotes: [
        {id: "88", positions: [[12, 19]]}
      ],
      timestamp: "2024-01-20T15:30:45Z"
    }
    
    // Client -> Server: Send message
    {
      type: "SEND_MESSAGE",
      message: "LUL that was close"
    }
    
    // Server -> Client: Moderation action
    {
      type: "MODERATION",
      action: "timeout",
      user: "toxic_user",
      duration: 600,
      reason: "Spam",
      moderator: "mod_user"
    }
    
    // Clips API
    
    POST /api/clips/create
    Request: {
      channel_id: "shroud",
      title: "Insane 1v5 Clutch",
      offset_seconds: 30,  // How far back from now
      duration: 30  // Clip length in seconds
    }
    Response: {
      clip_id: "ExcitingCreativeWalrus",
      edit_url: "https://clips.twitch.tv/ExcitingCreativeWalrus/edit",
      status: "processing",
      created_at: "2024-01-20T15:35:00Z"
    }
    
    GET /api/clips/{clip_id}
    Response: {
      clip_id: "ExcitingCreativeWalrus",
      broadcaster: "shroud",
      creator: "fan_user",
      title: "Insane 1v5 Clutch",
      view_count: 125430,
      duration: 30,
      thumbnail_url: "https://clips-media-assets.twitch.tv/...",
      video_url: "https://clips.twitch.tv/ExcitingCreativeWalrus",
      embed_url: "https://clips.twitch.tv/embed?clip=ExcitingCreativeWalrus",
      created_at: "2024-01-20T15:35:00Z"
    }
    
    // VOD API
    
    GET /api/videos/{video_id}
    Response: {
      video_id: "v123456789",
      channel: "shroud",
      title: "Valorant Ranked - Road to Radiant",
      duration: 28800,  // 8 hours in seconds
      views: 543210,
      recorded_at: "2024-01-19T14:00:00Z",
      thumbnail_url: "https://static-cdn.jtvnw.net/...",
      playback_url: "https://usher.ttvnw.net/vod/123456789.m3u8",
      seek_previews: "https://static-cdn.jtvnw.net/vods/...storyboard.vtt",
      muted_segments: [
        {offset: 3600, duration: 180}  // DMCA muted section
      ]
    }
    
    // Discovery API
    
    GET /api/streams
    Query: {
      game_id: "516575",  // Valorant
      language: "en",
      first: 20
    }
    Response: {
      streams: [
        {
          channel: "shroud",
          title: "Ranked grind",
          viewer_count: 45234,
          thumbnail_url: "https://static-cdn.jtvnw.net/previews-ttv/...",
          game: "Valorant",
          tags: ["English", "DropsEnabled"]
        }
      ],
      pagination: {
        cursor: "eyJiIjpudWxsLCJhIjo..."
      }
    }
    
    // Analytics API (for streamers)
    
    GET /api/analytics/stream/{stream_id}
    Response: {
      stream_id: "stream_abc123",
      metrics: {
        average_viewers: 12543,
        peak_viewers: 18234,
        unique_viewers: 145632,
        chat_messages: 432156,
        new_followers: 1234,
        subscriptions: 89,
        bits_cheered: 54320,
        ad_revenue: 234.56
      },
      viewer_geography: {
        "US": 0.45,
        "CA": 0.15,
        "GB": 0.10,
        "DE": 0.08
      },
      quality_distribution: {
        "Source": 0.15,
        "1080p": 0.25,
        "720p": 0.35,
        "480p": 0.20,
        "360p": 0.05
      }
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for core data
      
      CREATE TABLE users (
        user_id BIGINT PRIMARY KEY,
        username VARCHAR(25) UNIQUE,
        email VARCHAR(255) UNIQUE,
        display_name VARCHAR(50),
        bio TEXT,
        profile_image_url TEXT,
        offline_image_url TEXT,
        channel_views INT DEFAULT 0,
        follower_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      );
      
      CREATE TABLE streams (
        stream_id UUID PRIMARY KEY,
        channel_id BIGINT REFERENCES users(user_id),
        title VARCHAR(140),
        game_id INT,
        language VARCHAR(5),
        is_mature BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        peak_viewers INT DEFAULT 0,
        unique_viewers INT DEFAULT 0,
        INDEX idx_channel (channel_id),
        INDEX idx_live (ended_at),
        INDEX idx_game (game_id)
      );
      
      CREATE TABLE stream_sessions (
        session_id UUID PRIMARY KEY,
        stream_id UUID REFERENCES streams(stream_id),
        viewer_id BIGINT REFERENCES users(user_id),
        started_watching TIMESTAMP,
        stopped_watching TIMESTAMP,
        quality_watched VARCHAR(20),
        platform VARCHAR(20),
        INDEX idx_stream_viewer (stream_id, viewer_id)
      );
      
      CREATE TABLE clips (
        clip_id VARCHAR(30) PRIMARY KEY,
        stream_id UUID REFERENCES streams(stream_id),
        creator_id BIGINT REFERENCES users(user_id),
        title VARCHAR(100),
        view_count INT DEFAULT 0,
        duration FLOAT,
        offset_seconds INT,
        thumbnail_url TEXT,
        video_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stream_clips (stream_id),
        INDEX idx_popular (view_count DESC)
      );
      
      CREATE TABLE vods (
        vod_id VARCHAR(20) PRIMARY KEY,
        stream_id UUID REFERENCES streams(stream_id),
        channel_id BIGINT REFERENCES users(user_id),
        title VARCHAR(140),
        duration INT, -- seconds
        view_count INT DEFAULT 0,
        storage_path TEXT,
        thumbnail_url TEXT,
        created_at TIMESTAMP,
        expires_at TIMESTAMP,
        INDEX idx_channel_vods (channel_id),
        INDEX idx_expiry (expires_at)
      );
      
      CREATE TABLE subscriptions (
        subscription_id UUID PRIMARY KEY,
        user_id BIGINT REFERENCES users(user_id),
        channel_id BIGINT REFERENCES users(user_id),
        tier INT, -- 1, 2, 3 ($4.99, $9.99, $24.99)
        started_at TIMESTAMP,
        renewed_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_gift BOOLEAN DEFAULT FALSE,
        INDEX idx_user_subs (user_id),
        INDEX idx_channel_subs (channel_id)
      );
    `,
    
    nosql: `
      // DynamoDB for chat messages
      
      Table: ChatMessages
      Partition Key: channel_id (String)
      Sort Key: timestamp (Number)
      Attributes:
        - message_id (String)
        - user_id (Number)
        - username (String)
        - message (String)
        - emotes (Map)
        - badges (List)
        - deleted (Boolean)
      TTL: timestamp + 86400 (24 hours)
      
      // Redis for real-time data
      
      // Current viewers per stream
      ZADD viewers:stream:abc123 {timestamp} {user_id}
      
      // Stream metadata cache
      HSET stream:abc123
        title "Playing Valorant"
        game "Valorant"
        viewers 45234
        started_at 1705761600
      TTL: 300
      
      // Chat rate limiting
      INCR chat:ratelimit:user:123
      EXPIRE chat:ratelimit:user:123 30
      
      // Viewer count snapshots
      TS.ADD stream:abc123:viewers 1705761600 45234
      
      // Active streams by category
      ZADD streams:game:valorant 45234 "shroud"
      
      // User session tokens
      SET session:token:xyz user_id:123
      EXPIRE session:token:xyz 86400
      
      // MongoDB for analytics
      
      {
        stream_id: "abc123",
        timestamp: ISODate("2024-01-20T15:00:00Z"),
        metrics: {
          viewers: 45234,
          chat_rate: 156, // messages per second
          new_followers: 234,
          quality_distribution: {
            source: 0.15,
            "1080p": 0.25,
            "720p": 0.35,
            "480p": 0.20,
            "360p": 0.05
          },
          geography: {
            US: 20543,
            CA: 6785,
            GB: 4523,
            DE: 3617
          },
          platforms: {
            web: 0.45,
            mobile: 0.30,
            tv: 0.15,
            console: 0.10
          }
        }
      }
      
      // Cassandra for time-series metrics
      
      CREATE KEYSPACE twitch WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'us-east': 3,
        'us-west': 3,
        'eu-west': 3
      };
      
      CREATE TABLE stream_metrics (
        stream_id UUID,
        timestamp TIMESTAMP,
        viewer_count INT,
        chat_messages_per_minute INT,
        bitrate INT,
        dropped_frames INT,
        PRIMARY KEY (stream_id, timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);
      
      // ElasticSearch for discovery
      
      PUT /streams/_doc/abc123
      {
        "channel": "shroud",
        "title": "Valorant Ranked Grind",
        "game": "Valorant",
        "tags": ["English", "PC", "Competitive"],
        "viewer_count": 45234,
        "started_at": "2024-01-20T15:00:00Z",
        "language": "en",
        "is_mature": false
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Video Protocol',
      analysis: `
        RTMP Ingest + HLS Delivery (Chosen):
        ✓ RTMP widely supported by encoders
        ✓ HLS works everywhere
        ✓ Adaptive bitrate with HLS
        ✓ CDN friendly
        ✗ Higher latency (5-10s)
        
        WebRTC End-to-End:
        ✓ Ultra-low latency (<1s)
        ✓ P2P possible
        ✗ Complex at scale
        ✗ Transcoding challenges
        
        Custom Protocol:
        ✓ Optimized for use case
        ✓ Better control
        ✗ Client compatibility
        ✗ Development cost
        
        Decision: RTMP+HLS for compatibility, WebRTC for low-latency mode
      `
    },
    {
      decision: 'Transcoding Strategy',
      analysis: `
        Transcode Everything:
        ✓ Consistent quality options
        ✓ Better viewer experience
        ✗ Expensive at scale
        ✗ Wasteful for small streams
        
        On-Demand Transcoding:
        ✓ Cost efficient
        ✗ First viewer latency
        ✗ Quality switches slow
        
        Selective Transcoding (Chosen):
        ✓ Transcode based on viewers
        ✓ More qualities for popular streams
        ✓ Cost optimized
        ✗ Complex logic
        
        Decision: Selective based on viewer count and streamer tier
      `
    },
    {
      decision: 'Chat Architecture',
      analysis: `
        Single WebSocket Server:
        ✓ Simple
        ✗ Single point of failure
        ✗ Doesn't scale
        
        IRC Protocol:
        ✓ Established protocol
        ✓ Client compatibility
        ✗ Limited features
        ✗ Scaling challenges
        
        Distributed WebSocket (Chosen):
        ✓ Horizontal scaling
        ✓ Regional servers
        ✓ Rich features
        ✗ Complex state sync
        
        Decision: Distributed WebSocket with Redis pub/sub
      `
    },
    {
      decision: 'VOD Storage',
      analysis: `
        Store Everything Forever:
        ✓ Never lose content
        ✗ Massive storage costs
        ✗ Most never watched
        
        No VOD Storage:
        ✓ No storage costs
        ✗ Viewers want replays
        ✗ Clips need source
        
        Tiered Retention (Chosen):
        ✓ Partners: 60 days
        ✓ Affiliates: 14 days
        ✓ Highlights: permanent
        ✓ Cost balanced
        ✗ Some content lost
        
        Decision: Tiered based on streamer status and popularity
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Twitch Engineering: Live Video Infrastructure',
        youtubeId: 'UKzH1A2MSOQ',
        duration: '47:23'
      },
      { 
        title: 'Building Live Streaming at Scale',
        youtubeId: 'GH4ms7O3pdI',
        duration: '35:18'
      }
    ],
    articles: [
      {
        title: 'How Twitch Works - High Level Architecture',
        url: 'https://blog.twitch.tv/en/2015/12/18/twitch-engineering-an-introduction/'
      },
      {
        title: 'Scaling Twitch Chat to Millions',
        url: 'https://blog.twitch.tv/en/2019/03/14/twitch-chat-architecture/'
      }
    ],
    books: [
      {
        title: 'Streaming Systems',
        author: "Tyler Akidau, Slava Chernyak, Reuven Lax",
        chapter: 'Chapter 6: Streams and Tables'
      }
    ]
  }
}