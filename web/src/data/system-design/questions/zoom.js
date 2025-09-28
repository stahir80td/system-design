// Zoom System Design Question
export default {
  id: 'zoom',
  title: 'Design Zoom',
  companies: ['Zoom', 'Microsoft Teams', 'Google Meet', 'Cisco WebEx', 'Discord'],
  difficulty: 'Hard',
  category: 'Video & Streaming',
  
  description: 'Design a video conferencing platform that supports large-scale meetings with features like screen sharing, recording, breakout rooms, and real-time collaboration.',
  
  requirements: {
    functional: [
      'Host video meetings with up to 1000 participants',
      'Audio/video streaming with low latency',
      'Screen sharing and annotation',
      'Meeting recording and cloud storage',
      'Breakout rooms for sub-meetings',
      'Virtual backgrounds and filters',
      'Chat and file sharing during meetings',
      'Meeting scheduling and calendar integration',
      'Waiting room and admission control',
      'Host controls (mute all, remove participants)',
      'Webinar mode with up to 10,000 view-only attendees',
      'Phone dial-in support',
      'End-to-end encryption option'
    ],
    nonFunctional: [
      'Support 300 million daily meeting participants',
      'Support 3.3 trillion annual meeting minutes',
      'Audio latency < 150ms',
      'Video latency < 200ms',
      '99.99% uptime for enterprise',
      'Adaptive quality (240p to 1080p)',
      'Bandwidth: 600kbps to 3.8Mbps per stream',
      'Support poor network conditions (packet loss up to 20%)',
      'GDPR/HIPAA compliance',
      'Cross-platform support (Web, Desktop, Mobile)'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Zoom, a video conferencing platform. The key challenges are:
      
      1. Ultra-low latency audio/video transmission
      2. Scaling to millions of concurrent meetings
      3. Adaptive quality based on network conditions
      4. NAT traversal and firewall issues
      5. Efficient bandwidth usage with many participants
      6. Screen sharing with high quality
      7. Recording and storing massive amounts of video
      8. End-to-end encryption while maintaining features
      
      The system needs to provide crystal-clear communication even under poor network conditions while supporting features like virtual backgrounds, breakout rooms, and recordings.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Meeting Statistics:
      - Daily meeting participants: 300 million
      - Average meeting duration: 45 minutes
      - Concurrent meetings (peak): 5 million
      - Participants per meeting: 2-1000 (avg: 8)
      - Peak concurrent users: 40 million
      
      Bandwidth Requirements:
      - Video bitrate: 600kbps (360p) to 3.8Mbps (1080p)
      - Audio bitrate: 80kbps (high quality)
      - Screen share: 150kbps to 2Mbps
      - Per meeting (8 users, 720p): 8 * 1.5Mbps = 12Mbps
      - Global bandwidth (peak): 5M meetings * 12Mbps = 60Tbps
      
      Recording Storage:
      - Meetings recorded: 20% = 60M daily
      - Average recording size: 500MB (45min, compressed)
      - Daily storage: 60M * 500MB = 30PB
      - Annual storage: 10 Exabytes
      
      Infrastructure:
      - Media servers needed: 100,000 globally
      - Signaling servers: 10,000
      - STUN/TURN servers: 50,000
      - Data centers: 17+ regions worldwide
      
      Processing Requirements:
      - Video encoding/decoding: Real-time
      - Background blur: 10ms per frame
      - Audio processing: < 5ms latency
      - Transcription: Real-time for 10% meetings
      
      Network Metrics:
      - Average RTT: 50ms (regional)
      - Packet loss tolerance: up to 20%
      - Jitter buffer: 100-200ms
      - FEC overhead: 20% for resilience
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Desktop clients (Windows/Mac/Linux)
         - Mobile apps (iOS/Android)
         - Web client (WebRTC)
         - Conference room systems
         - Phone gateway (PSTN)
      
      2. **Signaling Layer**
         - WebSocket servers
         - SIP servers
         - Meeting coordination
         - Participant management
         - Feature negotiation
      
      3. **Media Layer**
         - Media servers (SFU/MCU)
         - Audio mixers
         - Video routers
         - Screen share servers
         - Recording servers
      
      4. **Network Infrastructure**
         - STUN servers (NAT discovery)
         - TURN servers (relay)
         - Load balancers
         - Edge servers
         - BGP anycast routing
      
      5. **Application Services**
         - Meeting Service
         - User Service
         - Calendar Service
         - Recording Service
         - Analytics Service
         - Notification Service
      
      6. **Processing Pipeline**
         - Video codec (H.264/VP8/VP9)
         - Audio codec (Opus)
         - Background effects
         - Noise suppression
         - Echo cancellation
         - Bandwidth adaptation
      
      **Connection Flow:**
      
      1. Client connects to nearest edge server
      2. STUN/TURN for NAT traversal
      3. WebSocket for signaling
      4. Media server assignment (geo-based)
      5. WebRTC peer connections
      6. Adaptive bitrate based on conditions
    `,
    
    detailedDesign: `
      **1. Media Server Architecture:**
      
      Selective Forwarding Unit (SFU) Design:
      \`\`\`python
      class MediaServer:
          def __init__(self):
              self.meetings = {}  # meeting_id -> Meeting
              self.clients = {}   # client_id -> Client
              
          def handle_video_packet(self, sender_id, packet):
              meeting = self.get_meeting(sender_id)
              if not meeting:
                  return
              
              # Don't send back to sender
              recipients = meeting.get_participants() - {sender_id}
              
              for recipient_id in recipients:
                  client = self.clients[recipient_id]
                  
                  # Simulcast: Choose quality based on recipient
                  if client.bandwidth < 500:  # kbps
                      # Send low quality stream
                      if packet.quality == 'low':
                          self.forward_packet(recipient_id, packet)
                  elif client.bandwidth < 1500:
                      # Send medium quality
                      if packet.quality == 'medium':
                          self.forward_packet(recipient_id, packet)
                  else:
                      # Send high quality
                      if packet.quality == 'high':
                          self.forward_packet(recipient_id, packet)
          
          def handle_audio_packet(self, sender_id, packet):
              meeting = self.get_meeting(sender_id)
              
              # Audio mixing for active speakers
              if meeting.is_active_speaker(sender_id):
                  mixed_audio = self.mix_audio_streams(meeting, sender_id)
                  
                  for recipient_id in meeting.get_participants():
                      if recipient_id != sender_id:
                          self.send_audio(recipient_id, mixed_audio)
          
          def adapt_bitrate(self, client_id):
              client = self.clients[client_id]
              stats = client.get_connection_stats()
              
              # REMB (Receiver Estimated Maximum Bitrate)
              if stats.packet_loss > 0.05:  # 5% loss
                  client.target_bitrate *= 0.8
              elif stats.packet_loss < 0.01:  # 1% loss
                  client.target_bitrate *= 1.1
              
              # Constrain bitrate
              client.target_bitrate = min(
                  max(client.target_bitrate, 150_000),  # 150kbps min
                  3_800_000  # 3.8Mbps max
              )
              
              return client.target_bitrate
      \`\`\`
      
      **2. Cascading for Large Meetings:**
      
      \`\`\`python
      class CascadingMeetingServer:
          def __init__(self):
              self.origin_server = None
              self.cascade_servers = []
              self.participant_limit = 500  # per server
          
          def setup_cascade(self, total_participants):
              servers_needed = math.ceil(total_participants / self.participant_limit)
              
              # Create tree structure
              self.origin_server = MediaServer("origin")
              
              for i in range(servers_needed - 1):
                  cascade = MediaServer(f"cascade_{i}")
                  cascade.set_upstream(self.origin_server)
                  self.cascade_servers.append(cascade)
              
              return self.cascade_servers
          
          def join_meeting(self, participant):
              # Find server with capacity
              for server in [self.origin_server] + self.cascade_servers:
                  if server.get_participant_count() < self.participant_limit:
                      server.add_participant(participant)
                      return server
              
              # Create new cascade server
              new_server = self.add_cascade_server()
              new_server.add_participant(participant)
              return new_server
          
          def broadcast_video(self, sender_id, video_stream):
              # Origin server receives video
              if self.is_presenter(sender_id):
                  # Distribute to cascade servers
                  for cascade in self.cascade_servers:
                      cascade.receive_stream(video_stream)
              
              # Each cascade forwards to its participants
              for cascade in self.cascade_servers:
                  cascade.forward_to_participants(video_stream)
      \`\`\`
      
      **3. WebRTC Connection Management:**
      
      \`\`\`javascript
      class ZoomClient {
          constructor() {
              this.pc = null;  // RTCPeerConnection
              this.localStream = null;
              this.remoteStreams = new Map();
              this.ws = null;  // WebSocket for signaling
          }
          
          async joinMeeting(meetingId) {
              // Get user media
              this.localStream = await navigator.mediaDevices.getUserMedia({
                  video: {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      frameRate: { ideal: 30 }
                  },
                  audio: {
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true
                  }
              });
              
              // Setup WebRTC
              this.pc = new RTCPeerConnection({
                  iceServers: [
                      { urls: 'stun:stun.zoom.us:3478' },
                      { 
                          urls: 'turn:turn.zoom.us:3478',
                          username: 'user',
                          credential: 'pass'
                      }
                  ],
                  bundlePolicy: 'max-bundle',
                  rtcpMuxPolicy: 'require'
              });
              
              // Add local tracks with simulcast
              this.localStream.getTracks().forEach(track => {
                  const transceiver = this.pc.addTransceiver(track, {
                      direction: 'sendrecv',
                      streams: [this.localStream]
                  });
                  
                  if (track.kind === 'video') {
                      const params = transceiver.sender.getParameters();
                      params.encodings = [
                          { rid: 'low', maxBitrate: 150000 },
                          { rid: 'medium', maxBitrate: 500000 },
                          { rid: 'high', maxBitrate: 1500000 }
                      ];
                      transceiver.sender.setParameters(params);
                  }
              });
              
              // Handle incoming streams
              this.pc.ontrack = (event) => {
                  const stream = event.streams[0];
                  const participantId = event.transceiver.mid;
                  this.remoteStreams.set(participantId, stream);
                  this.renderVideo(participantId, stream);
              };
              
              // Create offer
              const offer = await this.pc.createOffer();
              await this.pc.setLocalDescription(offer);
              
              // Send to signaling server
              this.ws.send(JSON.stringify({
                  type: 'join',
                  meetingId: meetingId,
                  sdp: offer.sdp
              }));
          }
          
          enableVirtualBackground() {
              const video = this.localStream.getVideoTracks()[0];
              const processor = new VideoProcessor();
              
              // Use TensorFlow.js for segmentation
              processor.processFrame = async (input, output) => {
                  const segmentation = await this.bodyPix.segmentPerson(input);
                  
                  // Apply background
                  const ctx = output.getContext('2d');
                  ctx.drawImage(this.backgroundImage, 0, 0);
                  
                  // Draw person
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.drawImage(input, 0, 0);
                  
                  // Apply mask
                  ctx.globalCompositeOperation = 'destination-in';
                  ctx.drawImage(segmentation.mask, 0, 0);
              };
              
              // Replace track
              const processedTrack = processor.getProcessedTrack(video);
              this.pc.getSenders().forEach(sender => {
                  if (sender.track === video) {
                      sender.replaceTrack(processedTrack);
                  }
              });
          }
      }
      \`\`\`
      
      **4. Adaptive Bitrate Algorithm:**
      
      \`\`\`python
      class AdaptiveBitrate:
          def __init__(self):
              self.current_bitrate = 1000000  # 1 Mbps
              self.rtt_history = deque(maxlen=10)
              self.loss_history = deque(maxlen=10)
              self.jitter_history = deque(maxlen=10)
          
          def update_stats(self, stats):
              self.rtt_history.append(stats.rtt)
              self.loss_history.append(stats.packet_loss)
              self.jitter_history.append(stats.jitter)
          
          def calculate_target_bitrate(self):
              avg_rtt = np.mean(self.rtt_history)
              avg_loss = np.mean(self.loss_history)
              avg_jitter = np.mean(self.jitter_history)
              
              # Network quality score
              quality_score = 1.0
              
              # RTT impact
              if avg_rtt > 300:  # ms
                  quality_score *= 0.5
              elif avg_rtt > 150:
                  quality_score *= 0.8
              
              # Packet loss impact
              if avg_loss > 0.05:  # 5%
                  quality_score *= 0.5
              elif avg_loss > 0.02:  # 2%
                  quality_score *= 0.7
              elif avg_loss > 0.01:  # 1%
                  quality_score *= 0.9
              
              # Jitter impact
              if avg_jitter > 50:  # ms
                  quality_score *= 0.7
              elif avg_jitter > 30:
                  quality_score *= 0.9
              
              # Calculate new bitrate
              if quality_score > 0.9:
                  # Increase bitrate
                  self.current_bitrate = min(
                      self.current_bitrate * 1.1,
                      3800000  # Max 3.8 Mbps
                  )
              elif quality_score < 0.6:
                  # Decrease bitrate
                  self.current_bitrate = max(
                      self.current_bitrate * quality_score,
                      150000  # Min 150 kbps
                  )
              
              # Apply video resolution constraints
              if self.current_bitrate < 300000:
                  resolution = "240p"
              elif self.current_bitrate < 600000:
                  resolution = "360p"
              elif self.current_bitrate < 1200000:
                  resolution = "480p"
              elif self.current_bitrate < 2000000:
                  resolution = "720p"
              else:
                  resolution = "1080p"
              
              return {
                  'bitrate': int(self.current_bitrate),
                  'resolution': resolution,
                  'fps': 30 if self.current_bitrate > 1000000 else 15
              }
      \`\`\`
      
      **5. Screen Sharing Optimization:**
      
      \`\`\`python
      class ScreenShareOptimizer:
          def __init__(self):
              self.last_frame = None
              self.keyframe_interval = 60  # frames
              self.frame_count = 0
          
          def process_screen_frame(self, frame):
              # Detect if content is static or dynamic
              if self.last_frame is not None:
                  diff = cv2.absdiff(frame, self.last_frame)
                  change_ratio = np.sum(diff > 30) / diff.size
                  
                  if change_ratio < 0.01:  # Less than 1% change
                      # Static content - reduce framerate
                      if self.frame_count % 5 != 0:  # Send 1 in 5 frames
                          return None
                  
                  # Detect regions of change
                  contours = self.find_changed_regions(diff)
                  
                  if len(contours) > 0 and len(contours) < 5:
                      # Partial update - send only changed regions
                      updates = []
                      for contour in contours:
                          x, y, w, h = cv2.boundingRect(contour)
                          region = frame[y:y+h, x:x+w]
                          updates.append({
                              'x': x, 'y': y,
                              'width': w, 'height': h,
                              'data': self.encode_region(region)
                          })
                      return {'type': 'partial', 'updates': updates}
              
              # Full frame update
              self.last_frame = frame.copy()
              self.frame_count += 1
              
              # Force keyframe periodically
              is_keyframe = (self.frame_count % self.keyframe_interval == 0)
              
              return {
                  'type': 'full',
                  'frame': self.encode_frame(frame, is_keyframe),
                  'timestamp': time.time()
              }
          
          def encode_frame(self, frame, is_keyframe):
              # Use different compression for text vs images
              if self.is_text_heavy(frame):
                  # Use lossless or high-quality compression
                  return self.encode_h264(frame, crf=18, preset='fast')
              else:
                  # Standard compression
                  return self.encode_h264(frame, crf=23, preset='medium')
      \`\`\`
      
      **6. Recording Architecture:**
      
      \`\`\`python
      class MeetingRecorder:
          def __init__(self, meeting_id):
              self.meeting_id = meeting_id
              self.audio_buffer = []
              self.video_buffer = []
              self.start_time = time.time()
              self.s3_client = boto3.client('s3')
          
          def record_streams(self, audio_stream, video_streams):
              # Composite video streams
              compositor = VideoCompositor()
              
              while self.is_recording:
                  # Mix audio
                  audio_frame = self.mix_audio(audio_stream.get_frame())
                  self.audio_buffer.append(audio_frame)
                  
                  # Composite video (gallery view)
                  video_frame = compositor.create_gallery(
                      [stream.get_frame() for stream in video_streams]
                  )
                  self.video_buffer.append(video_frame)
                  
                  # Flush to disk periodically
                  if len(self.video_buffer) > 1800:  # 1 minute at 30fps
                      self.flush_segment()
          
          def flush_segment(self):
              segment_num = self.get_segment_number()
              
              # Encode segment
              video_file = self.encode_segment(
                  self.video_buffer,
                  self.audio_buffer
              )
              
              # Upload to S3
              s3_key = f"recordings/{self.meeting_id}/segment_{segment_num}.mp4"
              self.s3_client.upload_file(video_file, 'zoom-recordings', s3_key)
              
              # Clear buffers
              self.video_buffer.clear()
              self.audio_buffer.clear()
          
          def finalize_recording(self):
              # Flush remaining data
              if self.video_buffer:
                  self.flush_segment()
              
              # Create manifest for all segments
              manifest = self.create_manifest()
              
              # Trigger post-processing
              self.trigger_transcoding(manifest)
              self.trigger_transcription(manifest)
              
              return manifest['recording_url']
      \`\`\`
    `,
    
    dataFlow: `
      **Meeting Join Flow:**
      
      1. User clicks meeting link
      2. Client app/browser opens
      3. Authenticate user (if required)
      4. Check meeting status and permissions
      5. Enter waiting room (if enabled)
      6. Host admits participant
      7. Client connects to signaling server:
         - Get meeting configuration
         - Get list of participants
         - Get media server assignment
      8. Establish WebRTC connection:
         - ICE candidate gathering
         - STUN for public IP
         - TURN relay if needed
      9. Start media streams:
         - Camera and microphone access
         - Negotiate codecs
         - Start sending/receiving
      10. Join meeting successfully
      
      **Audio/Video Flow:**
      
      1. Capture from device:
         - Camera: 30fps, up to 1080p
         - Microphone: 48kHz sampling
      2. Local processing:
         - Echo cancellation
         - Noise suppression
         - Auto gain control
      3. Encode streams:
         - Video: H.264/VP8/VP9
         - Audio: Opus codec
      4. Simulcast (3 quality levels):
         - Low: 240p, 150kbps
         - Medium: 360p, 500kbps  
         - High: 720p, 1.5Mbps
      5. Send to media server (SFU)
      6. Server routes to participants:
         - Select quality per recipient
         - Based on bandwidth/CPU
      7. Clients decode and render
      8. Continuous adaptation:
         - Monitor network conditions
         - Adjust quality dynamically
      
      **Screen Share Flow:**
      
      1. User initiates screen share
      2. Select screen/window/tab
      3. Capture at native resolution
      4. Detect content type:
         - Static (documents): Low FPS
         - Dynamic (video): Higher FPS
      5. Optimize encoding:
         - Text: High quality, low FPS
         - Video: Balanced quality
      6. Send as separate stream
      7. Server prioritizes screen share:
         - Higher bandwidth allocation
         - Lower latency path
      8. Clients receive and display:
         - Full screen mode
         - Annotation overlay
      
      **Recording Flow:**
      
      1. Host starts recording
      2. Recording server joins as bot
      3. Receive all media streams
      4. Process in real-time:
         - Mix audio streams
         - Composite video (gallery/speaker)
         - Add metadata (participants, chat)
      5. Encode in segments (1-minute)
      6. Upload segments to S3
      7. Continue until meeting ends
      8. Post-processing:
         - Transcode to multiple formats
         - Generate thumbnails
         - Create playback manifest
      9. Optional: Generate transcript
      10. Notify host when ready
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Media Server CPU**
         Problem: Encoding/decoding for many streams
         Solution:
         - Hardware acceleration (GPU)
         - SFU instead of MCU (no transcoding)
         - Simulcast to avoid transcoding
         - Dedicated servers for large meetings
      
      2. **Network Bandwidth**
         Problem: Last-mile bandwidth limitations
         Solution:
         - Adaptive bitrate streaming
         - Simulcast with quality selection
         - Audio-only fallback
         - Regional media servers
      
      3. **NAT/Firewall Traversal**
         Problem: Corporate networks blocking UDP
         Solution:
         - TURN servers for relay
         - TCP fallback
         - Port 443 for firewall bypass
         - Multiple TURN servers globally
      
      4. **Audio/Video Sync**
         Problem: Streams getting out of sync
         Solution:
         - NTP time synchronization
         - RTP timestamps
         - Jitter buffers
         - Lip sync correction
      
      5. **Large Meeting Scale**
         Problem: 1000+ participants
         Solution:
         - Cascading architecture
         - Webinar mode (view-only)
         - Active speaker detection
         - Pagination for video tiles
      
      6. **Recording Storage**
         Problem: Massive storage requirements
         Solution:
         - Compression optimization
         - Tiered storage (hot/cold)
         - Automatic deletion policies
         - Cloud storage (S3)
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - 17+ data centers globally
         - Anycast routing to nearest DC
         - Regional media servers
         - Edge caching for recordings
      
      2. **Server Architecture:**
         - Microservices design
         - Kubernetes orchestration
         - Auto-scaling based on load
         - Dedicated pools for enterprise
      
      3. **Load Balancing:**
         - Geo-based routing
         - Least-connections algorithm
         - Health checks every 5s
         - Automatic failover
      
      4. **Meeting Distribution:**
         - Shard by meeting ID
         - Consistent hashing
         - Meeting migration for load
         - Reserved capacity for large meetings
      
      5. **Bandwidth Optimization:**
         - Peering agreements with ISPs
         - Direct connections to cloud providers
         - CDN for recordings
         - Compression optimization
      
      6. **Cascade Architecture:**
         - Tree structure for 1000+ participants
         - Origin + cascade servers
         - Regional cascades
         - Automatic cascade creation
      
      7. **WebRTC Optimizations:**
         - Bundle multiple streams
         - DataChannel for chat/files
         - RTCP feedback
         - FEC for packet loss recovery
    `
  },
  
  architecture: {
    svgPath: '/diagrams/zoom.svg',
    components: [
      { 
        name: 'WebRTC Client', 
        description: 'Browser/app client with WebRTC stack for real-time communication' 
      },
      { 
        name: 'Signaling Server', 
        description: 'WebSocket server for meeting coordination and SDP exchange' 
      },
      { 
        name: 'STUN/TURN', 
        description: 'NAT traversal and relay servers for connectivity' 
      },
      { 
        name: 'Media Server (SFU)', 
        description: 'Selective Forwarding Unit for routing media streams' 
      },
      { 
        name: 'Meeting Service', 
        description: 'Manages meeting lifecycle, participants, and permissions' 
      },
      { 
        name: 'Recording Service', 
        description: 'Records and processes meeting audio/video' 
      },
      { 
        name: 'Transcoding Service', 
        description: 'Converts recordings to multiple formats' 
      },
      { 
        name: 'Analytics Pipeline', 
        description: 'Processes meeting metrics and quality data' 
      }
    ]
  },
  
  apiDesign: `
    // Meeting Management APIs
    
    POST /api/meetings/create
    Request: {
      topic: "Team Standup",
      start_time: "2024-01-20T10:00:00Z",
      duration: 60,  // minutes
      settings: {
        host_video: true,
        participant_video: true,
        waiting_room: true,
        recording: "cloud",
        mute_upon_entry: true,
        breakout_rooms: 5
      },
      password: "secure123"
    }
    Response: {
      meeting_id: "850123456",
      join_url: "https://zoom.us/j/850123456",
      start_url: "https://zoom.us/s/850123456?zak=...",
      password: "secure123",
      dial_in: {
        numbers: ["+1-669-900-6833"],
        meeting_id: "850123456"
      }
    }
    
    POST /api/meetings/{meeting_id}/join
    Request: {
      display_name: "John Doe",
      audio: true,
      video: true
    }
    Response: {
      participant_id: "abc123",
      token: "jwt_token_here",
      media_servers: [
        {
          region: "us-west",
          url: "wss://ms1.zoom.us",
          priority: 1
        }
      ],
      ice_servers: [
        { urls: "stun:stun.zoom.us:3478" },
        { 
          urls: "turn:turn.zoom.us:3478",
          username: "temp_user",
          credential: "temp_pass"
        }
      ]
    }
    
    // WebSocket Signaling Protocol
    
    WS /ws/meeting/{meeting_id}
    
    // Client -> Server: Join meeting
    {
      type: "join",
      participant_id: "abc123",
      offer: {
        type: "offer",
        sdp: "v=0\\r\\no=- ..."
      }
    }
    
    // Server -> Client: Answer
    {
      type: "answer",
      answer: {
        type: "answer", 
        sdp: "v=0\\r\\no=- ..."
      }
    }
    
    // Server -> Client: Participant joined
    {
      type: "participant_joined",
      participant: {
        id: "def456",
        name: "Jane Smith",
        audio: true,
        video: true
      }
    }
    
    // Client -> Server: Mute/unmute
    {
      type: "media_control",
      audio: false,
      video: true
    }
    
    // Server -> Client: Active speaker
    {
      type: "active_speaker",
      participant_id: "def456",
      volume_level: 0.8
    }
    
    // Recording APIs
    
    POST /api/meetings/{meeting_id}/recording/start
    Response: {
      recording_id: "rec_789",
      status: "started"
    }
    
    POST /api/meetings/{meeting_id}/recording/stop
    Response: {
      recording_id: "rec_789",
      status: "processing",
      estimated_time: 300  // seconds
    }
    
    GET /api/recordings/{recording_id}
    Response: {
      recording_id: "rec_789",
      meeting_id: "850123456",
      duration: 3600,  // seconds
      size: 524288000,  // bytes
      status: "completed",
      files: [
        {
          type: "video",
          url: "https://zoom.us/rec/play/...",
          format: "MP4"
        },
        {
          type: "audio",
          url: "https://zoom.us/rec/play/...",
          format: "M4A"
        },
        {
          type: "transcript",
          url: "https://zoom.us/rec/play/...",
          format: "VTT"
        }
      ]
    }
    
    // Screen Share API
    
    POST /api/meetings/{meeting_id}/screen_share/start
    Request: {
      stream_id: "screen_stream_123",
      optimize_for: "text"  // "text" | "video" | "auto"
    }
    Response: {
      status: "sharing",
      stream_endpoint: "wss://screen.zoom.us/..."
    }
    
    // Breakout Rooms API
    
    POST /api/meetings/{meeting_id}/breakout_rooms/create
    Request: {
      rooms: [
        {
          name: "Room 1",
          participants: ["abc123", "def456"]
        },
        {
          name: "Room 2", 
          participants: ["ghi789"]
        }
      ]
    }
    Response: {
      rooms: [
        {
          room_id: "br_1",
          name: "Room 1",
          join_url: "https://zoom.us/j/..."
        }
      ]
    }
    
    // Quality Stats API
    
    POST /api/meetings/{meeting_id}/stats
    Request: {
      participant_id: "abc123",
      stats: {
        video: {
          bitrate: 1500000,
          framerate: 30,
          resolution: "1280x720",
          packet_loss: 0.01
        },
        audio: {
          bitrate: 64000,
          packet_loss: 0.005,
          jitter: 20
        },
        network: {
          rtt: 45,
          bandwidth: 5000000
        }
      }
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for meeting and user data
      
      CREATE TABLE users (
        user_id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        timezone VARCHAR(50),
        plan_type VARCHAR(50), -- basic|pro|business|enterprise
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE meetings (
        meeting_id BIGINT PRIMARY KEY,
        uuid UUID UNIQUE,
        host_id UUID REFERENCES users(user_id),
        topic VARCHAR(500),
        start_time TIMESTAMP,
        duration INT, -- minutes
        timezone VARCHAR(50),
        password VARCHAR(50),
        waiting_room BOOLEAN DEFAULT FALSE,
        record_meeting BOOLEAN DEFAULT FALSE,
        status VARCHAR(20), -- scheduled|started|ended
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_host (host_id),
        INDEX idx_status (status),
        INDEX idx_start_time (start_time)
      );
      
      CREATE TABLE participants (
        participant_id UUID PRIMARY KEY,
        meeting_id BIGINT REFERENCES meetings(meeting_id),
        user_id UUID REFERENCES users(user_id),
        display_name VARCHAR(255),
        join_time TIMESTAMP,
        leave_time TIMESTAMP,
        duration INT, -- seconds
        device_type VARCHAR(50),
        ip_address INET,
        location VARCHAR(100),
        network_type VARCHAR(50),
        INDEX idx_meeting (meeting_id),
        INDEX idx_user (user_id)
      );
      
      CREATE TABLE recordings (
        recording_id UUID PRIMARY KEY,
        meeting_id BIGINT REFERENCES meetings(meeting_id),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        file_size BIGINT,
        duration INT, -- seconds
        storage_location TEXT, -- S3 path
        status VARCHAR(20), -- recording|processing|completed
        play_url TEXT,
        download_url TEXT,
        password VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_meeting (meeting_id),
        INDEX idx_status (status)
      );
      
      CREATE TABLE meeting_events (
        event_id UUID PRIMARY KEY,
        meeting_id BIGINT,
        participant_id UUID,
        event_type VARCHAR(50), -- joined|left|muted|unmuted|screen_share
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_meeting_events (meeting_id, timestamp)
      );
    `,
    
    nosql: `
      // Redis for real-time data
      
      // Active meetings
      HSET meeting:850123456
        host_id "user_123"
        participant_count 25
        recording_status "active"
        start_time 1705744800
        media_server "ms-west-1.zoom.us"
      
      // Participants in meeting
      SADD meeting:850123456:participants "abc123" "def456" "ghi789"
      
      // Participant details
      HSET participant:abc123
        meeting_id "850123456"
        name "John Doe"
        audio_muted false
        video_enabled true
        screen_sharing false
        connection_quality "good"
      
      // Active speakers (sorted set by volume)
      ZADD meeting:850123456:speakers 
        0.9 "abc123"
        0.7 "def456"
        0.3 "ghi789"
      
      // Meeting chat messages
      LPUSH meeting:850123456:chat 
        '{"from":"abc123","message":"Hello everyone","timestamp":1705744900}'
      
      // Screen share state
      SET meeting:850123456:screen_share "participant:def456"
      
      // Breakout rooms
      HSET meeting:850123456:breakout:1
        name "Room 1"
        participants "abc123,def456"
        status "open"
      
      // Quality metrics (time series)
      TS.ADD participant:abc123:bitrate 1705744800 1500000
      TS.ADD participant:abc123:packet_loss 1705744800 0.01
      TS.ADD participant:abc123:rtt 1705744800 45
      
      // DynamoDB for session management
      
      Table: Sessions
      Partition Key: session_id
      Attributes:
        - user_id (String)
        - meeting_id (Number) 
        - joined_at (Number)
        - connection_state (String)
        - media_capabilities (Map)
        - quality_preferences (Map)
        - ttl (Number) // Auto-expire after meeting
      
      // MongoDB for analytics
      
      {
        meeting_id: "850123456",
        date: ISODate("2024-01-20"),
        metrics: {
          total_participants: 150,
          peak_concurrent: 89,
          average_duration: 2847, // seconds
          device_breakdown: {
            desktop: 0.45,
            mobile: 0.35,
            web: 0.20
          },
          quality_stats: {
            excellent: 0.7,
            good: 0.2,
            fair: 0.08,
            poor: 0.02
          },
          features_used: [
            "screen_share",
            "recording",
            "breakout_rooms",
            "chat"
          ]
        },
        network_metrics: {
          average_bitrate: 1250000,
          average_packet_loss: 0.008,
          average_rtt: 52
        }
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Media Server Architecture',
      analysis: `
        MCU (Multipoint Control Unit):
        ✓ Single stream to each client
        ✓ Lower client bandwidth
        ✓ Server-side composition
        ✗ High server CPU usage
        ✗ Transcoding latency
        ✗ Expensive to scale
        
        SFU (Selective Forwarding Unit) - Chosen:
        ✓ No transcoding (lower CPU)
        ✓ Lower latency
        ✓ Scalable architecture
        ✓ Simulcast support
        ✗ Higher client bandwidth
        ✗ Client-side composition
        
        P2P (Peer-to-Peer):
        ✓ No server infrastructure
        ✓ Lowest latency
        ✗ Doesn't scale beyond 4-5 users
        ✗ High client bandwidth/CPU
        
        Decision: SFU for scalability and lower latency
      `
    },
    {
      decision: 'Video Codec Selection',
      analysis: `
        H.264:
        ✓ Universal hardware support
        ✓ Excellent compression
        ✓ Mature technology
        ✗ Licensing costs
        
        VP8/VP9:
        ✓ Royalty-free
        ✓ Good quality
        ✓ WebRTC native
        ✗ Less hardware support
        
        AV1:
        ✓ Best compression
        ✓ Royalty-free
        ✗ High encoding CPU
        ✗ Limited support
        
        Decision: H.264 primary, VP8 fallback for web
      `
    },
    {
      decision: 'Recording Architecture',
      analysis: `
        Client-side Recording:
        ✓ No server resources
        ✓ Privacy (local)
        ✗ Unreliable
        ✗ Quality issues
        ✗ Upload bandwidth
        
        Server-side Recording (Chosen):
        ✓ Reliable quality
        ✓ All streams captured
        ✓ Post-processing options
        ✓ No client overhead
        ✗ Server resources
        ✗ Storage costs
        
        Hybrid (Client + Server):
        ✓ Redundancy
        ✗ Complex sync
        ✗ Double resources
        
        Decision: Server-side for reliability and quality
      `
    },
    {
      decision: 'Encryption Strategy',
      analysis: `
        Transport Encryption Only:
        ✓ Simple implementation
        ✓ Server features work
        ✗ Server can access content
        
        End-to-End Encryption:
        ✓ Maximum privacy
        ✓ Compliance (HIPAA)
        ✗ No server features
        ✗ Complex key management
        
        Selective E2EE (Chosen):
        ✓ User choice
        ✓ Features when needed
        ✓ Privacy when required
        ✗ Complex implementation
        
        Decision: Optional E2EE for flexibility
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'WebRTC Crash Course',
        youtubeId: 'WmR9IMUD_CY',
        duration: '91:23'
      },
      { 
        title: 'How Zoom Works - System Design',
        youtubeId: 'G32ThJakeHk',
        duration: '26:15'
      }
    ],
    articles: [
      {
        title: 'How Zoom Scaled to 300 Million Participants',
        url: 'https://blog.zoom.us/zoom-scaling-300-million-participants/'
      },
      {
        title: 'WebRTC Architecture',
        url: 'https://webrtc.org/architecture/'
      }
    ],
    books: [
      {
        title: 'High Performance Browser Networking',
        author: 'Ilya Grigorik',
        chapter: 'Chapter 18: WebRTC'
      }
    ]
  }
}