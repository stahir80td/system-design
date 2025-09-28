// URL Shortener System Design Question
export default {
  id: 'url-shortener',
  title: 'Design URL Shortener',
  companies: ['Google', 'Amazon', 'Microsoft'],
  difficulty: 'Easy',
  category: 'Infrastructure & Tools',
  
  description: 'Design a URL shortening service like bit.ly or TinyURL that takes long URLs and converts them to short, unique aliases.',
  
  requirements: {
    functional: [
      'Shorten long URLs to 7-character short codes',
      'Redirect users from short URL to original URL',
      'Custom aliases (optional)',
      'URL expiration (optional)',
      'Analytics - track number of clicks',
      'REST API for URL operations'
    ],
    nonFunctional: [
      'Handle 100 million URLs per day',
      'Read/Write ratio of 100:1',
      'Sub-100ms latency for redirection',
      '99.9% availability',
      'Store URLs for 5 years by default',
      'As short as possible URLs'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design a URL shortening service similar to bit.ly. Let me start by understanding the requirements.
      
      The system needs to:
      1. Convert long URLs to short 7-character codes
      2. Redirect users efficiently when they access short URLs
      3. Handle analytics and potentially custom aliases
      
      This is essentially a large-scale distributed system with heavy read traffic.
    `,
    
    capacityEstimation: `
      Let's estimate the scale:
      
      **Traffic Estimates:**
      - Write QPS: 100M / (24 * 3600) ≈ 1,200 URLs/second
      - Read QPS: 1,200 * 100 = 120,000 requests/second
      - Peak traffic: 2x average = 240,000 reads/second
      
      **Storage Estimates:**
      - URL object size: ~500 bytes (original URL + metadata)
      - Daily storage: 100M * 500 bytes = 50 GB/day
      - 5-year storage: 50 GB * 365 * 5 = ~90 TB
      
      **Bandwidth Estimates:**
      - Write bandwidth: 1,200 * 500 bytes = 600 KB/s
      - Read bandwidth: 120,000 * 500 bytes = 60 MB/s
      
      **Memory Estimates for Cache:**
      - If we cache 20% of hot URLs
      - Cache size: 0.2 * 90 TB = ~18 TB
      - Distributed across servers: reasonable with modern hardware
    `,
    
    highLevelDesign: `
      The high-level architecture consists of:
      
      1. **API Gateway**: Entry point for all requests
      2. **Load Balancer**: Distributes traffic across app servers
      3. **Application Servers**: Handle business logic
      4. **Cache Layer (Redis)**: Store frequently accessed URLs
      5. **Database**: Persistent storage for all URLs
      6. **CDN**: Cache and serve redirects globally
      7. **Analytics Service**: Track clicks and usage
      
      Flow for shortening:
      1. Client sends POST request with long URL
      2. App server generates unique short code
      3. Store mapping in database
      4. Update cache
      5. Return short URL to client
      
      Flow for redirection:
      1. User accesses short URL
      2. CDN checks if cached, returns 301 if found
      3. Otherwise, check Redis cache
      4. If not in cache, query database
      5. Update cache and return redirect
      6. Log analytics asynchronously
    `,
    
    detailedDesign: `
      **URL Encoding Algorithm:**
      
      Option 1: Counter-based approach
      - Use auto-incrementing counter
      - Convert to base62 (a-z, A-Z, 0-9)
      - Pros: No collisions, simple
      - Cons: Predictable, needs coordination
      
      Option 2: Hash-based approach (Chosen)
      - Take MD5 hash of long URL
      - Take first 43 bits → 7 base62 characters
      - Handle collisions with linear probing
      - Pros: Distributed generation, no coordination
      - Cons: Potential collisions
      
      **Database Design:**
      
      Primary table:
      \`\`\`sql
      urls (
        short_code VARCHAR(7) PRIMARY KEY,
        long_url TEXT NOT NULL,
        created_at TIMESTAMP,
        expires_at TIMESTAMP,
        user_id BIGINT,
        click_count INT DEFAULT 0
      )
      \`\`\`
      
      Analytics table:
      \`\`\`sql
      url_clicks (
        id BIGINT AUTO_INCREMENT,
        short_code VARCHAR(7),
        timestamp TIMESTAMP,
        ip_address VARCHAR(45),
        referrer TEXT,
        user_agent TEXT,
        INDEX idx_short_code_time (short_code, timestamp)
      )
      \`\`\`
      
      **Caching Strategy:**
      - Use Redis with LRU eviction
      - Cache-aside pattern for reads
      - Write-through for new URLs
      - TTL based on access patterns
      
      **Database Sharding:**
      - Shard by short_code (range-based)
      - Each shard handles specific character ranges
      - Consistent hashing for even distribution
    `,
    
    dataFlow: `
      **Creating a Short URL:**
      1. Client: POST /api/shorten {url: "https://example.com/very/long/url"}
      2. API Gateway validates request
      3. App Server:
         - Generate MD5 hash
         - Extract 7 characters
         - Check for collision in DB
         - If collision, add salt and retry
      4. Write to primary DB
      5. Write to cache (write-through)
      6. Return: {shortUrl: "bit.ly/abc1234"}
      
      **Accessing a Short URL:**
      1. User visits: bit.ly/abc1234
      2. CDN checks edge cache → return 301 if found
      3. Load Balancer routes to App Server
      4. App Server:
         - Check Redis cache → return if found
         - Query database by short_code
         - Update Redis cache
         - Log to analytics queue
      5. Return 301 redirect with Cache-Control headers
      6. Analytics service processes click asynchronously
    `,
    
    bottlenecks: `
      **Potential Bottlenecks:**
      
      1. **Database becomes hotspot**
         - Solution: Read replicas, sharding
         
      2. **Cache misses during traffic spikes**
         - Solution: Warm cache, increase cache size
         
      3. **Popular URLs cause hot partitions**
         - Solution: Replicate hot URLs across shards
         
      4. **Analytics writes overwhelming DB**
         - Solution: Use message queue, batch writes
         
      5. **Global users face latency**
         - Solution: Multi-region deployment, CDN
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Horizontal Scaling:**
         - Add more app servers behind load balancer
         - Shard database by short_code range
         - Distributed Redis cluster
      
      2. **Caching Improvements:**
         - Multi-level caching (CDN → Redis → Application)
         - Preload frequently accessed URLs
         - Geographic distribution of cache
      
      3. **Database Optimization:**
         - Read replicas for analytics queries
         - Archive old URLs to cold storage
         - Use NoSQL for flexibility (DynamoDB/Cassandra)
      
      4. **Global Distribution:**
         - Deploy in multiple regions
         - Use GeoDNS for routing
         - Replicate popular content globally
    `
  },
  
  architecture: {
    svgPath: '/diagrams/url-shortener.svg',
    components: [
      { 
        name: 'CDN', 
        description: 'CloudFlare or AWS CloudFront for global edge caching' 
      },
      { 
        name: 'Load Balancer', 
        description: 'NGINX or AWS ALB for distributing requests' 
      },
      { 
        name: 'API Gateway', 
        description: 'Kong or AWS API Gateway for rate limiting and auth' 
      },
      { 
        name: 'App Servers', 
        description: 'Stateless servers running Node.js or Java Spring' 
      },
      { 
        name: 'Cache (Redis)', 
        description: 'Redis cluster for hot URL caching' 
      },
      { 
        name: 'Database', 
        description: 'PostgreSQL with read replicas or DynamoDB' 
      },
      { 
        name: 'Analytics Queue', 
        description: 'Kafka or SQS for async analytics processing' 
      },
      { 
        name: 'Object Storage', 
        description: 'S3 for archived URLs and backups' 
      }
    ]
  },
  
  apiDesign: `
    // Create short URL
    POST /api/shorten
    Request: {
      "url": "https://example.com/very/long/url",
      "custom_alias": "my-link" (optional),
      "expires_at": "2025-12-31" (optional)
    }
    Response: {
      "short_url": "https://bit.ly/abc1234",
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z"
    }
    
    // Redirect
    GET /{short_code}
    Response: 301 Moved Permanently
    Location: https://example.com/very/long/url
    Cache-Control: public, max-age=3600
    
    // Get analytics
    GET /api/analytics/{short_code}
    Response: {
      "short_code": "abc1234",
      "long_url": "https://example.com",
      "created_at": "2024-01-01",
      "total_clicks": 15420,
      "unique_visitors": 8234,
      "clicks_by_day": [...]
    }
    
    // Delete URL
    DELETE /api/urls/{short_code}
    Response: 204 No Content
  `,
  
  databaseSchema: {
    sql: `
      -- Main URL storage
      CREATE TABLE urls (
        short_code VARCHAR(7) PRIMARY KEY,
        long_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        user_id BIGINT,
        custom_alias BOOLEAN DEFAULT FALSE,
        click_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_user_id (user_id),
        INDEX idx_expires (expires_at),
        INDEX idx_created (created_at)
      );
      
      -- Analytics data
      CREATE TABLE url_clicks (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        short_code VARCHAR(7) NOT NULL,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        country VARCHAR(2),
        referrer TEXT,
        user_agent TEXT,
        INDEX idx_short_code (short_code),
        INDEX idx_clicked_at (clicked_at),
        FOREIGN KEY (short_code) REFERENCES urls(short_code)
      );
      
      -- User management
      CREATE TABLE users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        api_key VARCHAR(64) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        urls_created INT DEFAULT 0,
        rate_limit INT DEFAULT 1000
      );
    `,
    
    nosql: `
      // DynamoDB alternative schema
      Table: urls
      Partition Key: short_code (String)
      Attributes:
        - long_url (String)
        - created_at (Number)
        - expires_at (Number)
        - user_id (String)
        - click_count (Number)
      
      Global Secondary Index:
        - GSI1: user_id (PK), created_at (SK)
        
      Table: analytics
      Partition Key: short_code (String)
      Sort Key: timestamp (Number)
      Attributes:
        - ip_address (String)
        - country (String)
        - referrer (String)
    `
  },
  
  tradeoffs: [
    {
      decision: 'SQL vs NoSQL Database',
      analysis: `
        SQL (PostgreSQL):
        ✓ ACID guarantees for URL uniqueness
        ✓ Complex queries for analytics
        ✗ Harder to scale horizontally
        
        NoSQL (DynamoDB):
        ✓ Easy horizontal scaling
        ✓ Better for simple key-value lookups
        ✗ Eventually consistent
        
        Decision: Start with PostgreSQL, migrate hot data to DynamoDB
      `
    },
    {
      decision: 'Encoding: Counter vs Hash',
      analysis: `
        Counter-based:
        ✓ No collisions
        ✓ Shorter URLs possible
        ✗ Needs coordination between servers
        ✗ Predictable (security concern)
        
        Hash-based:
        ✓ Stateless generation
        ✓ No coordination needed
        ✗ Collision handling needed
        
        Decision: Hash-based for simplicity and scale
      `
    },
    {
      decision: 'Cache Strategy',
      analysis: `
        Cache-aside vs Write-through vs Write-behind
        
        Decision: Hybrid approach
        - Write-through for new URLs (consistency)
        - Cache-aside for reads (performance)
        - Lazy loading for cache misses
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'URL Shortener System Design - Tech Dummies',
        youtubeId: 'JQDHz72OA3c',
        duration: '15:23'
      },
      { 
        title: 'TinyURL System Design - Gaurav Sen',
        youtubeId: 'fMZMm7Aqf7Q',
        duration: '22:45'
      }
    ],
    articles: [
      {
        title: 'Designing a URL Shortening service like TinyURL',
        url: 'https://www.educative.io/courses/grokking-the-system-design-interview/m2ygV4E81AR'
      },
      {
        title: 'URL Shortener Design - High Scalability',
        url: 'http://highscalability.com/blog/2021/5/17/designing-url-shortener.html'
      }
    ],
    books: [
      {
        title: 'System Design Interview – An Insider\'s Guide',
        author: 'Alex Xu',
        chapter: 'Chapter 8: Design a URL Shortener'
      }
    ]
  }
}