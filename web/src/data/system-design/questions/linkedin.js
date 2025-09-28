// LinkedIn System Design Question
export default {
  id: 'linkedin',
  title: 'Design LinkedIn',
  companies: ['LinkedIn (Microsoft)', 'Indeed', 'AngelList', 'Glassdoor', 'Xing'],
  difficulty: 'Hard',
  category: 'Social Media & Professional Network',
  
  description: 'Design a professional networking platform with features like profiles, connections, job postings, messaging, feed, recommendations, and search capabilities.',
  
  requirements: {
    functional: [
      'User profiles with work history and skills',
      'Connection network (1st, 2nd, 3rd degree)',
      'News feed with professional content',
      'Job search and applications',
      'Recruiter tools and InMail',
      'Messaging and real-time chat',
      'Content publishing (articles, posts)',
      'Skill endorsements and recommendations',
      'Company pages and following',
      'Professional groups and communities',
      'Learning platform integration',
      'Event management',
      'Profile views and analytics',
      'Search (people, jobs, companies, content)'
    ],
    nonFunctional: [
      '800 million total members',
      '310 million monthly active users',
      '40% daily active users',
      '20 million job postings active',
      '100 million job applications per month',
      '3 million company pages',
      '50 billion connections in the graph',
      'Feed generation < 200ms',
      'Search latency < 100ms',
      'Message delivery < 500ms',
      '99.95% availability',
      'GDPR/CCPA compliant',
      'Support 20+ languages'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design LinkedIn, a professional networking platform. The key challenges are:
      
      1. Large-scale graph database for connections
      2. Multi-faceted search (people, jobs, companies)
      3. Personalized feed with professional content
      4. Job matching and recommendation engine
      5. Real-time messaging at scale
      6. Privacy controls for profile visibility
      7. Recruiter tools with advanced filters
      8. Analytics and insights generation
      
      The system needs to handle professional networking, job marketplace, content platform, and learning management all in one cohesive platform.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Base:
      - Total members: 800 million
      - MAU: 310 million
      - DAU: 124 million (40% of MAU)
      - Average connections: 500 per user
      - Profile views: 10 per user per day
      
      Content Volume:
      - Posts per day: 10 million
      - Articles per day: 100,000
      - Job postings active: 20 million
      - Job applications: 3.3M per day
      - Messages sent: 50M per day
      - InMails: 5M per day
      
      Graph Database:
      - Nodes (users + companies): 803 million
      - Edges (connections): 50 billion
      - Average degree: 500
      - 2nd degree reach: ~250,000
      - 3rd degree reach: ~10 million
      
      Storage Requirements:
      - User profiles: 800M * 50KB = 40TB
      - Profile photos: 800M * 500KB = 400TB
      - Work history/details: 800M * 100KB = 80TB
      - Connection graph: 50B * 100B = 5TB
      - Posts/articles: 10TB per year
      - Messages: 20TB per year
      - Total storage: 2PB+
      
      Bandwidth:
      - API requests: 1M QPS peak
      - Feed requests: 200K QPS
      - Search queries: 100K QPS
      - Message delivery: 50K QPS
      - Job searches: 30K QPS
      
      Infrastructure:
      - Application servers: 50,000
      - Cache servers: 20,000
      - Database nodes: 5,000
      - Search clusters: 1,000 nodes
      - ML training clusters: 500 GPUs
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Web application
         - Mobile apps (iOS/Android)
         - Recruiter tools
         - API for partners
      
      2. **API Gateway**
         - Authentication/authorization
         - Rate limiting
         - Request routing
         - API versioning
      
      3. **Core Services**
         - Profile Service
         - Connection Service
         - Feed Service
         - Messaging Service
         - Job Service
         - Search Service
         - Notification Service
      
      4. **Graph Database**
         - User nodes
         - Company nodes
         - Connection edges
         - Graph traversal engine
      
      5. **Content Systems**
         - Post/Article storage
         - Media CDN
         - Content moderation
         - Trending detection
      
      6. **Job Marketplace**
         - Job posting service
         - Application tracking
         - Matching engine
         - Recruiter platform
      
      7. **ML/Recommendation**
         - People You May Know
         - Job recommendations
         - Feed ranking
         - Skill inference
         - Search ranking
      
      **Data Flow Patterns:**
      
      1. Push model for messaging
      2. Pull model for feed generation
      3. Graph traversal for connections
      4. Inverted index for search
      5. Stream processing for analytics
    `,
    
    detailedDesign: `
      **1. Connection Graph System:**
      
      Graph Structure:
      - Nodes: Users, Companies, Schools, Skills
      - Edges: Connections, Follows, Works-at, Studied-at
      - Properties: Connection strength, timestamp, type
      
      Graph Storage:
      - Primary: Neo4j or custom graph DB
      - Cache: Redis for 1st/2nd degree
      - Batch processing: Spark GraphX
      
      Traversal Optimization:
      - Pre-compute 2nd degree connections
      - Cache frequently accessed paths
      - Partition by geographic region
      - Use bloom filters for existence checks
      
      **2. Feed Generation System:**
      
      Content Sources:
      - User posts and articles
      - Connection activity
      - Company updates
      - Job postings
      - Sponsored content
      
      Ranking Algorithm:
      - Relevance score (ML model)
      - Connection strength
      - Content quality signals
      - Engagement prediction
      - Recency factor
      - Diversity constraints
      
      Feed Architecture:
      - Timeline service for storage
      - Ranking service for ordering
      - Mixer for content types
      - Real-time updates via WebSocket
      
      **3. Search System:**
      
      Search Types:
      - People search (name, title, company, skills)
      - Job search (title, location, company, salary)
      - Company search
      - Content search (posts, articles)
      
      Implementation:
      - Elasticsearch clusters
      - Separate indices per entity type
      - Real-time indexing pipeline
      - Query understanding (NLP)
      - Personalized ranking
      - Faceted search filters
      
      **4. Job Matching System:**
      
      Components:
      - Job posting ingestion
      - Candidate profile analysis
      - Skill extraction and matching
      - Location and preference matching
      - Salary range compatibility
      - ML-based ranking
      
      Matching Pipeline:
      - Extract requirements from job posting
      - Generate candidate pool
      - Score candidates
      - Apply recruiter filters
      - Rank and return results
      
      **5. Messaging System:**
      
      Architecture:
      - WebSocket for real-time
      - Message queue (Kafka)
      - Conversation service
      - Notification service
      - Media attachment handling
      
      Features:
      - 1-1 and group messaging
      - Read receipts
      - Typing indicators
      - Message search
      - InMail for recruiters
      
      **6. Analytics Pipeline:**
      
      Profile Analytics:
      - View tracking
      - Search appearances
      - Engagement metrics
      - Skill trends
      
      Company Analytics:
      - Page views
      - Follower growth
      - Content performance
      - Talent insights
      
      Implementation:
      - Event streaming (Kafka)
      - Batch processing (Spark)
      - Real-time processing (Flink)
      - Data warehouse (Hadoop)
    `,
    
    dataFlow: `
      **Profile Update Flow:**
      
      1. User updates profile information
      2. Profile Service validates changes
      3. Update primary database
      4. Invalidate cache entries
      5. Trigger async tasks:
         - Update search index
         - Recalculate recommendations
         - Notify connections (if public)
         - Update analytics
      6. Return confirmation to user
      
      **Connection Request Flow:**
      
      1. User A sends connection request to User B
      2. Connection Service validates:
         - Not already connected
         - Not blocked
         - Within connection limits
      3. Create pending connection edge
      4. Send notification to User B
      5. User B accepts/rejects
      6. If accepted:
         - Create bidirectional edge
         - Update both users' networks
         - Trigger PYMK recalculation
         - Send confirmation notifications
      
      **Job Application Flow:**
      
      1. User searches for jobs
      2. Search Service returns ranked results
      3. User clicks Apply
      4. Application Service:
         - Validates prerequisites
         - Attaches resume/profile
         - Records application
      5. Notify recruiter/company
      6. Update application tracking
      7. Track in user's applications
      8. Analytics pipeline records event
      
      **Feed Generation Flow:**
      
      1. User opens LinkedIn
      2. Feed Service called
      3. Gather content sources:
         - Connection activities
         - Followed companies
         - Relevant job posts
         - Sponsored content
      4. Apply ranking algorithm
      5. Mix content types
      6. Return paginated feed
      7. Track impressions
      8. Prefetch next page
      
      **Search Flow:**
      
      1. User enters search query
      2. Query understanding:
         - Tokenization
         - Entity recognition
         - Intent classification
      3. Route to appropriate index
      4. Apply filters and facets
      5. Personalized ranking
      6. Return results
      7. Track search metrics
      8. Update user interests
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Graph Traversal Performance**
         Problem: Finding 2nd/3rd degree connections
         Solution:
         - Pre-compute common traversals
         - Graph partitioning
         - Caching strategies
         - Parallel processing
      
      2. **Feed Generation Latency**
         Problem: Ranking millions of posts
         Solution:
         - Pre-computed timelines
         - Approximate ranking
         - Progressive loading
         - Edge caching
      
      3. **Search Scalability**
         Problem: Complex queries across billions of documents
         Solution:
         - Sharded Elasticsearch
         - Query caching
         - Index optimization
         - Tiered search (fast then deep)
      
      4. **Message Delivery**
         Problem: Real-time delivery to millions
         Solution:
         - Geographic WebSocket servers
         - Message queuing
         - Batched delivery
         - Fallback to push notifications
      
      5. **Job Matching Performance**
         Problem: Matching millions of profiles to jobs
         Solution:
         - Offline batch processing
         - Inverted indices
         - ML model caching
         - Approximate matching
      
      6. **Profile View Tracking**
         Problem: High volume of view events
         Solution:
         - Sampling for non-premium
         - Batch processing
         - Approximate counting
         - Async processing
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Regional data centers
         - Edge locations for static content
         - CDN for media
         - Local caching layers
      
      2. **Database Scaling:**
         - Horizontal sharding by user ID
         - Read replicas for queries
         - Separate clusters for different data types
         - Graph database partitioning
      
      3. **Service Architecture:**
         - Microservices design
         - Service mesh (Istio)
         - Container orchestration (K8s)
         - Auto-scaling based on load
      
      4. **Caching Strategy:**
         - Multi-level caching
         - Cache warming
         - Smart invalidation
         - Regional cache clusters
      
      5. **Search Optimization:**
         - Index sharding
         - Query routing
         - Result caching
         - Relevance feedback
      
      6. **ML Model Serving:**
         - Model versioning
         - GPU clusters for inference
         - Feature store
         - Online/offline training split
      
      7. **Cost Optimization:**
         - Cold storage for old data
         - Compressed storage formats
         - Compute spot instances
         - Bandwidth optimization
    `
  },
  
  architecture: {
    svgPath: '/diagrams/linkedin.svg',
    components: [
      { 
        name: 'Profile Service', 
        description: 'Manages user profiles, work history, skills, and endorsements' 
      },
      { 
        name: 'Connection Service', 
        description: 'Handles the professional network graph and connection requests' 
      },
      { 
        name: 'Feed Service', 
        description: 'Generates personalized professional content feeds' 
      },
      { 
        name: 'Job Service', 
        description: 'Manages job postings, applications, and matching' 
      },
      { 
        name: 'Search Service', 
        description: 'Powers people, job, company, and content search' 
      },
      { 
        name: 'Messaging Service', 
        description: 'Handles direct messages, InMail, and real-time chat' 
      },
      { 
        name: 'Graph Database', 
        description: 'Stores and traverses the professional network graph' 
      },
      { 
        name: 'ML Platform', 
        description: 'Powers recommendations, matching, and personalization' 
      }
    ]
  },
  
  apiDesign: `
    // Profile APIs
    
    GET /api/v2/profile/{userId}
    Response: {
      id: "user123",
      name: "John Doe",
      headline: "Senior Software Engineer at TechCorp",
      location: "San Francisco Bay Area",
      connections: 500,
      followers: 1200,
      summary: "10+ years experience...",
      experience: [{
        title: "Senior Software Engineer",
        company: "TechCorp",
        startDate: "2020-01",
        current: true,
        description: "Leading backend development..."
      }],
      education: [{
        school: "Stanford University",
        degree: "MS Computer Science",
        year: 2012
      }],
      skills: [
        { name: "Java", endorsements: 47 },
        { name: "System Design", endorsements: 32 }
      ]
    }
    
    POST /api/v2/connections/request
    Request: {
      targetUserId: "user456",
      message: "Hi, I'd like to connect",
      how_you_know: "colleague"
    }
    Response: {
      requestId: "req789",
      status: "pending"
    }
    
    // Feed API
    
    GET /api/v2/feed
    Query Parameters: {
      limit: 20,
      offset: 0,
      sort: "relevant|recent"
    }
    Response: {
      posts: [{
        id: "post123",
        author: {
          id: "user789",
          name: "Jane Smith",
          headline: "Product Manager at StartupCo"
        },
        content: "Excited to announce...",
        media: ["image_url"],
        reactions: {
          like: 234,
          celebrate: 45,
          support: 12
        },
        comments: 23,
        timestamp: "2024-01-20T10:00:00Z",
        isSponsored: false
      }],
      nextCursor: "cursor_abc"
    }
    
    // Job Search API
    
    GET /api/v2/jobs/search
    Query Parameters: {
      keywords: "software engineer",
      location: "San Francisco",
      experienceLevel: "mid-senior",
      jobType: "full-time",
      remote: true,
      salary: "100000-200000",
      posted: "past-week"
    }
    Response: {
      total: 1543,
      jobs: [{
        id: "job123",
        title: "Senior Software Engineer",
        company: {
          id: "comp456",
          name: "TechCorp",
          logo: "logo_url"
        },
        location: "San Francisco, CA",
        remote: "hybrid",
        salary: "$150K - $200K",
        posted: "2 days ago",
        applicants: 47,
        matchScore: 0.92
      }],
      facets: {
        companies: [
          { name: "TechCorp", count: 12 }
        ],
        experienceLevels: [
          { level: "Senior", count: 543 }
        ]
      }
    }
    
    // Messaging API
    
    WebSocket /ws/messaging
    
    // Send message
    {
      type: "message",
      conversationId: "conv123",
      text: "Hi, interested in the position",
      timestamp: "2024-01-20T10:00:00Z"
    }
    
    // Receive message
    {
      type: "message",
      messageId: "msg456",
      senderId: "user789",
      text: "Thanks for reaching out!",
      timestamp: "2024-01-20T10:01:00Z"
    }
    
    // People You May Know API
    
    GET /api/v2/pymk
    Response: {
      suggestions: [{
        userId: "user999",
        name: "Bob Johnson",
        headline: "CTO at StartupXYZ",
        mutualConnections: 12,
        reason: "Worked at same company",
        score: 0.87
      }]
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for structured data
      
      CREATE TABLE users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        headline VARCHAR(500),
        location VARCHAR(255),
        industry VARCHAR(100),
        created_at TIMESTAMP,
        last_active TIMESTAMP
      );
      
      CREATE TABLE experiences (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id),
        company_id BIGINT,
        title VARCHAR(255),
        description TEXT,
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN
      );
      
      CREATE TABLE skills (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE
      );
      
      CREATE TABLE user_skills (
        user_id BIGINT REFERENCES users(id),
        skill_id BIGINT REFERENCES skills(id),
        endorsement_count INT DEFAULT 0,
        PRIMARY KEY (user_id, skill_id)
      );
      
      CREATE TABLE jobs (
        id BIGSERIAL PRIMARY KEY,
        company_id BIGINT,
        title VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        salary_min INT,
        salary_max INT,
        experience_level VARCHAR(50),
        posted_at TIMESTAMP,
        expires_at TIMESTAMP
      );
      
      CREATE TABLE applications (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT REFERENCES jobs(id),
        user_id BIGINT REFERENCES users(id),
        status VARCHAR(50),
        applied_at TIMESTAMP
      );
    `,
    
    nosql: `
      // Neo4j for graph data
      
      // Nodes
      CREATE (u:User {
        id: 'user123',
        name: 'John Doe',
        headline: 'Software Engineer'
      })
      
      CREATE (c:Company {
        id: 'comp456',
        name: 'TechCorp',
        industry: 'Technology'
      })
      
      CREATE (s:School {
        id: 'school789',
        name: 'Stanford University'
      })
      
      // Relationships
      CREATE (u1:User)-[:CONNECTED {since: '2020-01-15'}]->(u2:User)
      CREATE (u:User)-[:WORKS_AT {title: 'Engineer', startDate: '2020-01'}]->(c:Company)
      CREATE (u:User)-[:STUDIED_AT {degree: 'MS', year: 2012}]->(s:School)
      CREATE (u:User)-[:HAS_SKILL {level: 'expert'}]->(s:Skill)
      
      // Graph queries
      
      // Find 2nd degree connections
      MATCH (u:User {id: $userId})-[:CONNECTED]-(friend)-[:CONNECTED]-(foaf)
      WHERE NOT (u)-[:CONNECTED]-(foaf) AND u <> foaf
      RETURN foaf, COUNT(friend) as mutualConnections
      ORDER BY mutualConnections DESC
      
      // MongoDB for content and feeds
      
      {
        _id: ObjectId("..."),
        type: "post",
        authorId: "user123",
        content: "Excited to announce...",
        media: ["url1", "url2"],
        hashtags: ["#tech", "#innovation"],
        mentions: ["user456"],
        reactions: {
          like: ["user789", "user012"],
          celebrate: ["user345"]
        },
        comments: [
          {
            userId: "user456",
            text: "Congratulations!",
            timestamp: ISODate("2024-01-20")
          }
        ],
        visibility: "public",
        createdAt: ISODate("2024-01-20")
      }
      
      // Elasticsearch for search
      
      {
        index: "professionals",
        type: "user",
        body: {
          id: "user123",
          name: "John Doe",
          headline: "Senior Software Engineer",
          skills: ["Java", "Python", "System Design"],
          location: "San Francisco",
          company: "TechCorp",
          experience_years: 10,
          education: ["Stanford University"],
          industries: ["Technology", "Software"]
        }
      }
      
      // Redis for caching and sessions
      
      // User session
      SET session:abc123 "{'userId':'user123','expires':1234567890}"
      
      // Connection cache
      SADD connections:user123 "user456" "user789"
      
      // Feed cache
      ZADD feed:user123 1705744800 "post:123" 1705744900 "post:456"
      
      // Profile view tracking
      HINCRBY profile:views:user123 "2024-01-20" 1
    `
  },
  
  tradeoffs: [
    {
      decision: 'Graph Database Choice',
      analysis: `
        Native Graph DB (Neo4j) - Chosen:
        ✓ Optimized for graph traversals
        ✓ Cypher query language
        ✓ Built-in algorithms
        ✓ ACID compliance
        ✗ Expensive at scale
        ✗ Single point of failure
        
        Distributed Graph (JanusGraph):
        ✓ Horizontal scaling
        ✓ Multiple backend options
        ✗ Complex setup
        ✗ Less mature
        
        Custom Implementation:
        ✓ Full control
        ✓ Optimized for use case
        ✗ Development time
        ✗ Maintenance burden
        
        Decision: Neo4j for core graph, cache for performance
      `
    },
    {
      decision: 'Feed Generation Strategy',
      analysis: `
        Pure Pull Model:
        ✓ Storage efficient
        ✓ Always fresh
        ✗ High latency
        ✗ Compute intensive
        
        Pure Push Model:
        ✓ Fast reads
        ✓ Simple implementation
        ✗ Storage heavy
        ✗ Influencer problem
        
        Hybrid (Chosen):
        ✓ Balanced performance
        ✓ Handles varied use cases
        ✓ Cost effective
        ✗ Complex implementation
        
        ML-Driven Adaptive:
        ✓ Optimal per user
        ✓ Self-tuning
        ✗ Very complex
        ✗ Hard to debug
        
        Decision: Hybrid with ML ranking
      `
    },
    {
      decision: 'Search Architecture',
      analysis: `
        Elasticsearch (Chosen):
        ✓ Powerful full-text search
        ✓ Faceted search
        ✓ Rich query DSL
        ✓ Horizontal scaling
        ✗ Resource intensive
        ✗ Near real-time (not real-time)
        
        Solr:
        ✓ Mature and stable
        ✓ Good for structured data
        ✗ Less modern features
        ✗ Complex clustering
        
        Custom Lucene:
        ✓ Full control
        ✓ Optimized for use case
        ✗ Development overhead
        ✗ Maintenance burden
        
        Decision: Elasticsearch for flexibility and features
      `
    },
    {
      decision: 'Messaging Architecture',
      analysis: `
        WebSocket + Queue (Chosen):
        ✓ Real-time delivery
        ✓ Reliable with fallback
        ✓ Handles offline users
        ✓ Scalable
        ✗ Complex infrastructure
        
        Pure WebSocket:
        ✓ Simple and direct
        ✓ Low latency
        ✗ Connection management
        ✗ Offline handling
        
        Polling:
        ✓ Simple implementation
        ✓ Works everywhere
        ✗ High latency
        ✗ Resource waste
        
        Decision: WebSocket with Kafka queue for reliability
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'LinkedIn System Architecture',
        youtubeId: 'aDHp3fAxgXo',
        duration: '18:45'
      },
      { 
        title: 'Graph Databases Explained',
        youtubeId: 'GekQqFZm7mA',
        duration: '25:30'
      }
    ],
    articles: [
      {
        title: 'The Log: What every software engineer should know',
        url: 'https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying'
      },
      {
        title: 'LinkedIn Kafka Architecture',
        url: 'https://engineering.linkedin.com/kafka/running-kafka-scale'
      }
    ],
    books: [
      {
        title: 'Graph Databases',
        author: 'Ian Robinson, Jim Webber, Emil Eifrem',
        chapter: 'Chapter 3: Data Modeling with Graphs'
      }
    ]
  }
}