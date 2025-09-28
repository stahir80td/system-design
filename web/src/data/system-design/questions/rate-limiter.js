// Rate Limiter System Design Question
export default {
  id: 'rate-limiter',
  title: 'Design a Distributed Rate Limiter',
  companies: ['Stripe', 'Cloudflare', 'AWS', 'Google Cloud', 'Azure'],
  difficulty: 'Medium',
  category: 'Infrastructure & Tools',
  
  description: 'Design a distributed rate limiting system that can handle millions of requests per second, support multiple rate limiting algorithms, work across multiple servers, and provide different limits for different users/tiers.',
  
  requirements: {
    functional: [
      'Limit requests per user/IP/API key',
      'Support multiple time windows (per second/minute/hour/day)',
      'Different limits for different API endpoints',
      'User tier support (free/premium/enterprise)',
      'Graceful handling when limit exceeded',
      'Real-time limit checking',
      'Whitelist/blacklist support',
      'Rate limit headers in responses',
      'Burst allowance for temporary spikes',
      'Global and per-resource limits',
      'Dynamic limit adjustment',
      'Rate limit metrics and monitoring'
    ],
    nonFunctional: [
      'Handle 10 million requests per second',
      'Latency < 1ms for limit check',
      '99.99% availability',
      'Consistent limits across distributed systems',
      'Support 100 million unique users',
      'Horizontal scalability',
      'Fault tolerance (degraded mode)',
      'Memory efficient',
      'Accurate within 1% margin',
      'Support for 10,000 different rate limit rules'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design a distributed rate limiter. The key challenges are:
      
      1. Ultra-low latency requirement (< 1ms)
      2. Distributed state synchronization
      3. Handling millions of concurrent users
      4. Multiple rate limiting algorithms
      5. Flexibility for different rules and tiers
      6. High availability and fault tolerance
      7. Accurate counting in distributed environment
      8. Memory efficiency at scale
      
      The system needs to protect backend services from overload while ensuring legitimate users have good experience and supporting business requirements like tier-based limits.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Request Volume:
      - Peak requests: 10 million/second
      - Unique users: 100 million
      - Average requests per user: 100/day
      - Burst traffic: 3x normal (30M/sec)
      
      Storage Requirements:
      - Counter per user: 16 bytes
      - Metadata per user: 64 bytes  
      - Total per user: 80 bytes
      - Memory for all users: 100M * 80 = 8GB
      - With time windows (5 windows): 40GB
      - Replication factor (3x): 120GB total
      
      Rate Limit Rules:
      - Number of rules: 10,000
      - Rule size: 200 bytes
      - Total rules storage: 2MB
      - Cached everywhere for speed
      
      Time Windows:
      - Per second: 1s window
      - Per minute: 60s window
      - Per hour: 3600s window
      - Per day: 86400s window
      - Custom windows: Variable
      
      Counter Updates:
      - Updates per second: 10 million
      - Read operations: 10 million/sec
      - Write operations: 10 million/sec
      - Total operations: 20 million/sec
      
      Infrastructure:
      - Rate limiter nodes: 100
      - Requests per node: 100,000/sec
      - Memory per node: 2GB
      - Redis clusters: 10
      - Cache nodes: 50
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **API Gateway Layer**
         - Request interceptor
         - Rate limit checker
         - Response header injector
         - Metrics collector
      
      2. **Rate Limiting Service**
         - Algorithm engines
         - Rule evaluator  
         - Counter manager
         - Synchronization service
      
      3. **Storage Layer**
         - Redis for counters
         - Rules database
         - Configuration store
         - Metrics storage
      
      4. **Algorithms**
         - Token Bucket
         - Sliding Window Log
         - Sliding Window Counter
         - Fixed Window Counter
         - Leaky Bucket
      
      5. **Management Layer**
         - Configuration API
         - Monitoring dashboard
         - Alert system
         - Admin interface
      
      **Request Flow:**
      
      1. Request arrives at API gateway
      2. Extract identifier (user/IP/API key)
      3. Load applicable rate limit rules
      4. Check current usage against limits
      5. If allowed: increment counter, proceed
      6. If blocked: return 429 Too Many Requests
      7. Add rate limit headers to response
      8. Log metrics for monitoring
    `,
    
    detailedDesign: `
      **1. Token Bucket Algorithm Implementation:**
      
      \`\`\`python
      class TokenBucket:
          def __init__(self, capacity, refill_rate):
              self.capacity = capacity  # Max tokens
              self.refill_rate = refill_rate  # Tokens per second
              self.tokens = capacity
              self.last_refill = time.time()
          
          def allow_request(self, tokens=1):
              current_time = time.time()
              self.refill(current_time)
              
              if self.tokens >= tokens:
                  self.tokens -= tokens
                  return True
              
              return False
          
          def refill(self, current_time):
              time_passed = current_time - self.last_refill
              tokens_to_add = time_passed * self.refill_rate
              
              self.tokens = min(self.capacity, self.tokens + tokens_to_add)
              self.last_refill = current_time
      
      # Distributed version using Redis
      class DistributedTokenBucket:
          def __init__(self, redis_client, key, capacity, refill_rate):
              self.redis = redis_client
              self.key = key
              self.capacity = capacity
              self.refill_rate = refill_rate
          
          def allow_request(self, tokens=1):
              # Lua script for atomic operation
              lua_script = """
                  local key = KEYS[1]
                  local capacity = tonumber(ARGV[1])
                  local refill_rate = tonumber(ARGV[2])
                  local requested = tonumber(ARGV[3])
                  local current_time = tonumber(ARGV[4])
                  
                  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
                  local tokens = tonumber(bucket[1]) or capacity
                  local last_refill = tonumber(bucket[2]) or current_time
                  
                  -- Refill tokens
                  local time_passed = current_time - last_refill
                  local tokens_to_add = time_passed * refill_rate
                  tokens = math.min(capacity, tokens + tokens_to_add)
                  
                  if tokens >= requested then
                      tokens = tokens - requested
                      redis.call('HMSET', key, 
                          'tokens', tokens,
                          'last_refill', current_time)
                      redis.call('EXPIRE', key, 3600)
                      return 1
                  else
                      redis.call('HMSET', key,
                          'tokens', tokens,
                          'last_refill', current_time)
                      redis.call('EXPIRE', key, 3600)
                      return 0
                  end
              """
              
              result = self.redis.eval(
                  lua_script, 1, self.key,
                  self.capacity, self.refill_rate, tokens, time.time()
              )
              
              return bool(result)
      \`\`\`
      
      **2. Sliding Window Counter Implementation:**
      
      \`\`\`python
      class SlidingWindowCounter:
          def __init__(self, redis_client, window_size, limit):
              self.redis = redis_client
              self.window_size = window_size  # in seconds
              self.limit = limit
          
          def allow_request(self, identifier):
              current_time = time.time()
              window_start = current_time - self.window_size
              
              # Use Redis sorted set for sliding window
              key = f"sliding_window:{identifier}"
              
              # Lua script for atomic operation
              lua_script = """
                  local key = KEYS[1]
                  local window_start = tonumber(ARGV[1])
                  local current_time = tonumber(ARGV[2])
                  local limit = tonumber(ARGV[3])
                  
                  -- Remove old entries
                  redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
                  
                  -- Count current entries
                  local current_count = redis.call('ZCARD', key)
                  
                  if current_count < limit then
                      -- Add new entry
                      redis.call('ZADD', key, current_time, current_time)
                      redis.call('EXPIRE', key, ARGV[4])
                      return 1
                  else
                      return 0
                  end
              """
              
              result = self.redis.eval(
                  lua_script, 1, key,
                  window_start, current_time, self.limit, self.window_size
              )
              
              return bool(result)
          
          def get_remaining_limit(self, identifier):
              current_time = time.time()
              window_start = current_time - self.window_size
              key = f"sliding_window:{identifier}"
              
              # Remove old entries and count
              pipe = self.redis.pipeline()
              pipe.zremrangebyscore(key, 0, window_start)
              pipe.zcard(key)
              results = pipe.execute()
              
              current_count = results[1]
              return max(0, self.limit - current_count)
      \`\`\`
      
      **3. Hierarchical Rate Limiting:**
      
      \`\`\`python
      class HierarchicalRateLimiter:
          def __init__(self, redis_client):
              self.redis = redis_client
              self.rules = self.load_rules()
          
          def check_rate_limits(self, request):
              # Check multiple levels of rate limits
              identifiers = self.extract_identifiers(request)
              
              for identifier_type, identifier_value in identifiers.items():
                  rules = self.get_applicable_rules(identifier_type, identifier_value)
                  
                  for rule in rules:
                      limiter = self.get_limiter(rule.algorithm, rule.params)
                      
                      if not limiter.allow_request(identifier_value):
                          return RateLimitResponse(
                              allowed=False,
                              limit=rule.limit,
                              remaining=0,
                              reset_at=self.get_reset_time(rule),
                              retry_after=self.get_retry_after(rule)
                          )
              
              return RateLimitResponse(allowed=True)
          
          def extract_identifiers(self, request):
              return {
                  'ip': request.ip_address,
                  'user': request.user_id,
                  'api_key': request.api_key,
                  'endpoint': request.endpoint,
                  'tier': self.get_user_tier(request.user_id)
              }
          
          def get_applicable_rules(self, identifier_type, identifier_value):
              # Priority order: specific rules > tier rules > default rules
              rules = []
              
              # Specific rules for this identifier
              specific_key = f"rules:{identifier_type}:{identifier_value}"
              specific_rules = self.redis.get(specific_key)
              if specific_rules:
                  rules.extend(json.loads(specific_rules))
              
              # Tier-based rules
              if identifier_type == 'user':
                  tier = self.get_user_tier(identifier_value)
                  tier_key = f"rules:tier:{tier}"
                  tier_rules = self.redis.get(tier_key)
                  if tier_rules:
                      rules.extend(json.loads(tier_rules))
              
              # Default rules
              default_key = f"rules:default:{identifier_type}"
              default_rules = self.redis.get(default_key)
              if default_rules:
                  rules.extend(json.loads(default_rules))
              
              return self.deduplicate_rules(rules)
      \`\`\`
      
      **4. Distributed Synchronization:**
      
      \`\`\`python
      class DistributedRateLimiter:
          def __init__(self, local_cache_ttl=1):
              self.local_cache = {}
              self.local_cache_ttl = local_cache_ttl
              self.redis_cluster = self.setup_redis_cluster()
              self.sync_interval = 0.1  # 100ms
          
          def allow_request_with_cache(self, identifier, limit, window):
              # Try local cache first for performance
              cache_key = f"{identifier}:{window}"
              
              if cache_key in self.local_cache:
                  cached_data = self.local_cache[cache_key]
                  if time.time() - cached_data['timestamp'] < self.local_cache_ttl:
                      # Use cached value
                      if cached_data['count'] < limit:
                          cached_data['count'] += 1
                          return True
                      return False
              
              # Cache miss or expired, check Redis
              return self.check_redis_and_update_cache(identifier, limit, window)
          
          def check_redis_and_update_cache(self, identifier, limit, window):
              # Get Redis instance using consistent hashing
              redis_instance = self.get_redis_instance(identifier)
              
              # Atomic increment with limit check
              lua_script = """
                  local key = KEYS[1]
                  local limit = tonumber(ARGV[1])
                  local window = tonumber(ARGV[2])
                  local current_time = tonumber(ARGV[3])
                  
                  local current = redis.call('GET', key)
                  if not current then
                      current = 0
                  else
                      current = tonumber(current)
                  end
                  
                  if current < limit then
                      redis.call('INCR', key)
                      redis.call('EXPIRE', key, window)
                      return current + 1
                  else
                      return -1
                  end
              """
              
              result = redis_instance.eval(
                  lua_script, 1, 
                  f"rate_limit:{identifier}:{window}",
                  limit, window, time.time()
              )
              
              if result > 0:
                  # Update local cache
                  self.local_cache[f"{identifier}:{window}"] = {
                      'count': result,
                      'timestamp': time.time()
                  }
                  return True
              
              return False
          
          def get_redis_instance(self, identifier):
              # Consistent hashing to distribute load
              hash_value = hashlib.md5(identifier.encode()).hexdigest()
              hash_int = int(hash_value[:8], 16)
              instance_index = hash_int % len(self.redis_cluster)
              return self.redis_cluster[instance_index]
      \`\`\`
      
      **5. Rate Limit Headers:**
      
      \`\`\`python
      class RateLimitHeaders:
          @staticmethod
          def add_headers(response, rate_limit_result):
              # Standard rate limit headers
              response.headers['X-RateLimit-Limit'] = str(rate_limit_result.limit)
              response.headers['X-RateLimit-Remaining'] = str(rate_limit_result.remaining)
              response.headers['X-RateLimit-Reset'] = str(rate_limit_result.reset_at)
              
              # If rate limited, add retry-after
              if not rate_limit_result.allowed:
                  response.headers['Retry-After'] = str(rate_limit_result.retry_after)
                  response.status_code = 429
                  response.body = json.dumps({
                      'error': 'Rate limit exceeded',
                      'message': f'API rate limit exceeded. Retry after {rate_limit_result.retry_after} seconds',
                      'limit': rate_limit_result.limit,
                      'remaining': 0,
                      'reset_at': rate_limit_result.reset_at
                  })
              
              return response
      \`\`\`
      
      **6. Configuration Management:**
      
      \`\`\`python
      class RateLimitConfiguration:
          def __init__(self, config_store):
              self.config_store = config_store
              self.rules_cache = {}
              self.last_update = 0
              self.update_interval = 60  # Refresh every minute
          
          def get_rate_limit_rules(self, force_refresh=False):
              current_time = time.time()
              
              if force_refresh or current_time - self.last_update > self.update_interval:
                  self.refresh_rules()
              
              return self.rules_cache
          
          def refresh_rules(self):
              # Load from configuration store
              rules = self.config_store.get_all_rules()
              
              # Parse and validate
              validated_rules = {}
              for rule in rules:
                  if self.validate_rule(rule):
                      key = self.generate_rule_key(rule)
                      validated_rules[key] = rule
              
              self.rules_cache = validated_rules
              self.last_update = time.time()
          
          def update_rule(self, rule):
              # Validate rule
              if not self.validate_rule(rule):
                  raise ValueError("Invalid rule configuration")
              
              # Update in store
              self.config_store.save_rule(rule)
              
              # Update cache
              key = self.generate_rule_key(rule)
              self.rules_cache[key] = rule
              
              # Broadcast update to all nodes
              self.broadcast_rule_update(rule)
          
          def validate_rule(self, rule):
              required_fields = ['identifier_type', 'limit', 'window', 'algorithm']
              
              for field in required_fields:
                  if field not in rule:
                      return False
              
              # Validate limit is positive
              if rule['limit'] <= 0:
                  return False
              
              # Validate window is positive
              if rule['window'] <= 0:
                  return False
              
              # Validate algorithm is supported
              supported_algorithms = ['token_bucket', 'sliding_window', 'fixed_window', 'leaky_bucket']
              if rule['algorithm'] not in supported_algorithms:
                  return False
              
              return True
      \`\`\`
      
      **7. Monitoring and Metrics:**
      
      \`\`\`python
      class RateLimitMetrics:
          def __init__(self, metrics_client):
              self.metrics = metrics_client
              
          def record_request(self, identifier, allowed, limit_type):
              # Record metrics
              tags = {
                  'identifier_type': identifier.type,
                  'allowed': str(allowed),
                  'limit_type': limit_type
              }
              
              self.metrics.increment('rate_limit.requests', tags=tags)
              
              if not allowed:
                  self.metrics.increment('rate_limit.blocked', tags=tags)
          
          def record_latency(self, duration_ms):
              self.metrics.histogram('rate_limit.check_duration', duration_ms)
          
          def record_cache_hit(self, hit):
              metric_name = 'rate_limit.cache.hit' if hit else 'rate_limit.cache.miss'
              self.metrics.increment(metric_name)
          
          def get_metrics_summary(self, time_range='1h'):
              return {
                  'total_requests': self.metrics.get_counter('rate_limit.requests', time_range),
                  'blocked_requests': self.metrics.get_counter('rate_limit.blocked', time_range),
                  'average_latency': self.metrics.get_average('rate_limit.check_duration', time_range),
                  'cache_hit_rate': self.calculate_cache_hit_rate(time_range),
                  'top_limited_users': self.get_top_limited_users(time_range),
                  'rate_by_endpoint': self.get_rate_by_endpoint(time_range)
              }
      \`\`\`
    `,
    
    dataFlow: `
      **Request Rate Limiting Flow:**
      
      1. Request Arrival:
         - API Gateway receives request
         - Extract request metadata
         - Start latency timer
      
      2. Identifier Extraction:
         - Parse user ID from auth token
         - Get client IP address
         - Extract API key if present
         - Identify endpoint/resource
      
      3. Rule Loading:
         - Check local rules cache
         - If stale, refresh from config store
         - Apply rule hierarchy:
           * User-specific rules
           * Tier-based rules
           * Endpoint-specific rules
           * Global defaults
      
      4. Rate Limit Check:
         - For each applicable rule:
           * Get current counter from cache/Redis
           * Apply rate limiting algorithm
           * Check if limit exceeded
           * Update counter if allowed
      
      5. Decision Making:
         - If any limit exceeded: Block request
         - If all limits OK: Allow request
         - Record decision metrics
      
      6. Response Handling:
         - Add rate limit headers
         - If blocked: Return 429 status
         - If allowed: Forward to backend
         - Log for analytics
      
      **Counter Synchronization Flow:**
      
      1. Local Counter Update:
         - Increment local counter
         - Mark as dirty
         - Add to sync queue
      
      2. Batch Synchronization:
         - Every 100ms or 1000 updates
         - Aggregate local changes
         - Send to Redis cluster
      
      3. Redis Update:
         - Use pipelining for efficiency
         - Atomic increment operations
         - Set TTL based on window
      
      4. Cache Invalidation:
         - On rule changes
         - On tier upgrades
         - Manual reset commands
      
      **Configuration Update Flow:**
      
      1. Admin updates rule via API
      2. Validate rule syntax and values
      3. Store in configuration database
      4. Publish update event
      5. All nodes receive update
      6. Refresh local rule cache
      7. Apply new rules immediately
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Redis Performance**
         Problem: Single Redis instance bottleneck
         Solution:
         - Redis Cluster with sharding
         - Consistent hashing for distribution
         - Read replicas for high-read scenarios
         - Local caching to reduce Redis calls
      
      2. **Network Latency**
         Problem: Redis round-trip adds latency
         Solution:
         - Local counters with periodic sync
         - Predictive pre-fetching
         - Connection pooling
         - Redis pipelining for batch operations
      
      3. **Hot Keys**
         Problem: Popular users/IPs create hot keys
         Solution:
         - Split counters across multiple keys
         - Local counting with async sync
         - Separate infrastructure for hot users
         - Probabilistic counting for very high volume
      
      4. **Rule Evaluation**
         Problem: Complex rules slow down checks
         Solution:
         - Pre-compile rules to bytecode
         - Cache evaluated results
         - Optimize rule ordering
         - Parallel rule evaluation
      
      5. **Clock Skew**
         Problem: Different server times affect windows
         Solution:
         - NTP synchronization
         - Use Redis server time
         - Tolerance margin in calculations
         - Centralized time service
      
      6. **Memory Usage**
         Problem: Millions of counters consume memory
         Solution:
         - TTL-based expiration
         - Cold counter eviction
         - Compression for inactive counters
         - Tiered storage (memory → disk)
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Horizontal Scaling:**
         - Add more rate limiter nodes
         - Shard by identifier (user/IP)
         - Distribute rules across nodes
         - Load balancer with health checks
      
      2. **Caching Layers:**
         - L1: Process memory (microseconds)
         - L2: Local Redis (< 1ms)
         - L3: Remote Redis cluster (< 5ms)
         - Cascade through layers
      
      3. **Data Partitioning:**
         - Partition by user ID range
         - Separate clusters for different tiers
         - Geographic distribution
         - Endpoint-based sharding
      
      4. **Degraded Mode:**
         - If Redis unavailable: Use local limits
         - Reduced accuracy for availability
         - Emergency rate limits
         - Circuit breaker pattern
      
      5. **Auto-scaling:**
         - Monitor Redis CPU/memory
         - Scale based on request rate
         - Predictive scaling for known patterns
         - Automatic failover
      
      6. **Performance Optimizations:**
         - Lua scripts for atomic operations
         - Binary protocol for Redis
         - Connection multiplexing
         - Batch updates
         - Async processing where possible
    `
  },
  
  architecture: {
    svgPath: '/diagrams/rate-limiter.svg',
    components: [
      { 
        name: 'API Gateway', 
        description: 'Entry point that intercepts all requests and applies rate limiting' 
      },
      { 
        name: 'Rate Limit Service', 
        description: 'Core service implementing various rate limiting algorithms' 
      },
      { 
        name: 'Redis Cluster', 
        description: 'Distributed storage for counters and sliding windows' 
      },
      { 
        name: 'Local Cache', 
        description: 'In-memory cache for frequent limit checks' 
      },
      { 
        name: 'Configuration Store', 
        description: 'Database storing rate limit rules and configurations' 
      },
      { 
        name: 'Sync Service', 
        description: 'Handles distributed counter synchronization' 
      },
      { 
        name: 'Monitoring Service', 
        description: 'Tracks metrics and generates alerts' 
      },
      { 
        name: 'Admin API', 
        description: 'Management interface for updating rules' 
      }
    ]
  },
  
  apiDesign: `
    // Rate Limiting Check API (Internal)
    
    POST /internal/ratelimit/check
    Request: {
      identifier: {
        type: "user",  // user | ip | api_key
        value: "user_123"
      },
      endpoint: "/api/v1/users",
      method: "GET",
      metadata: {
        tier: "premium",
        region: "us-west-1"
      }
    }
    Response: {
      allowed: true,
      limits: [
        {
          type: "user",
          limit: 1000,
          remaining: 874,
          window: "1h",
          reset_at: 1705761600
        },
        {
          type: "endpoint",
          limit: 100,
          remaining: 67,
          window: "1m",
          reset_at: 1705760540
        }
      ]
    }
    
    // Rate Limit Configuration API
    
    POST /api/ratelimit/rules
    Request: {
      identifier_type: "user",
      identifier_value: "tier:premium",  // or specific user_id
      limits: [
        {
          requests: 10000,
          window: "1h",
          algorithm: "sliding_window"
        },
        {
          requests: 100,
          window: "1s",
          algorithm: "token_bucket",
          burst_size: 150
        }
      ],
      endpoints: ["/api/v1/*"],
      priority: 10
    }
    Response: {
      rule_id: "rule_abc123",
      status: "active",
      created_at: "2024-01-20T10:00:00Z"
    }
    
    GET /api/ratelimit/rules
    Query: {
      identifier_type: "user",
      identifier_value: "user_123",
      active: true
    }
    Response: {
      rules: [
        {
          rule_id: "rule_abc123",
          identifier_type: "user",
          identifier_value: "tier:premium",
          limits: [...],
          priority: 10
        }
      ]
    }
    
    PUT /api/ratelimit/rules/{rule_id}
    Request: {
      limits: [
        {
          requests: 20000,  // Increased limit
          window: "1h",
          algorithm: "sliding_window"
        }
      ]
    }
    Response: {
      rule_id: "rule_abc123",
      status: "updated",
      updated_at: "2024-01-20T11:00:00Z"
    }
    
    DELETE /api/ratelimit/rules/{rule_id}
    Response: {
      status: "deleted"
    }
    
    // Usage Analytics API
    
    GET /api/ratelimit/usage/{identifier}
    Response: {
      identifier: "user_123",
      period: "1h",
      usage: {
        total_requests: 8234,
        allowed_requests: 8100,
        blocked_requests: 134,
        current_limits: [
          {
            type: "user",
            limit: 10000,
            used: 8234,
            remaining: 1766,
            reset_at: 1705761600
          }
        ]
      }
    }
    
    GET /api/ratelimit/metrics
    Query: {
      start_time: "2024-01-20T00:00:00Z",
      end_time: "2024-01-20T23:59:59Z",
      granularity: "1h"
    }
    Response: {
      metrics: [
        {
          timestamp: "2024-01-20T10:00:00Z",
          total_requests: 5234123,
          blocked_requests: 12453,
          unique_identifiers: 98234,
          avg_latency_ms: 0.8,
          p99_latency_ms: 2.3
        }
      ],
      top_limited_users: [
        {user_id: "user_999", blocked_count: 453},
        {user_id: "user_888", blocked_count: 234}
      ]
    }
    
    // Admin Override API
    
    POST /api/ratelimit/override
    Request: {
      identifier: {
        type: "user",
        value: "user_123"
      },
      action: "reset",  // reset | whitelist | blacklist
      duration: 3600,  // seconds (optional for temporary override)
      reason: "Customer support request"
    }
    Response: {
      override_id: "override_xyz",
      status: "applied",
      expires_at: "2024-01-20T11:00:00Z"
    }
    
    // Health Check API
    
    GET /api/ratelimit/health
    Response: {
      status: "healthy",
      components: {
        redis_cluster: "healthy",
        local_cache: "healthy",
        sync_service: "healthy",
        config_store: "healthy"
      },
      metrics: {
        requests_per_second: 523412,
        avg_latency_ms: 0.7,
        cache_hit_rate: 0.89,
        redis_connections: 450
      }
    }
    
    // Standard Response Headers
    
    HTTP/1.1 200 OK
    X-RateLimit-Limit: 1000
    X-RateLimit-Remaining: 874
    X-RateLimit-Reset: 1705761600
    X-RateLimit-Reset-After: 3247
    
    // Rate Limited Response
    
    HTTP/1.1 429 Too Many Requests
    X-RateLimit-Limit: 100
    X-RateLimit-Remaining: 0
    X-RateLimit-Reset: 1705760540
    Retry-After: 47
    
    {
      "error": "rate_limit_exceeded",
      "message": "API rate limit exceeded for user tier",
      "limit": 100,
      "window": "1m",
      "retry_after": 47
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for configuration and rules
      
      CREATE TABLE rate_limit_rules (
        rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier_type VARCHAR(50) NOT NULL,  -- user, ip, api_key, tier
        identifier_value VARCHAR(255),  -- specific value or pattern
        endpoint_pattern VARCHAR(500),  -- /api/v1/* or specific endpoint
        method VARCHAR(10),  -- GET, POST, etc. or * for all
        limit_value INT NOT NULL,
        window_seconds INT NOT NULL,
        algorithm VARCHAR(50) DEFAULT 'sliding_window',
        burst_size INT,  -- For token bucket
        priority INT DEFAULT 0,  -- Higher priority rules evaluated first
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,  -- Additional configuration
        INDEX idx_identifier (identifier_type, identifier_value),
        INDEX idx_endpoint (endpoint_pattern),
        INDEX idx_priority (priority DESC)
      );
      
      CREATE TABLE user_tiers (
        user_id VARCHAR(255) PRIMARY KEY,
        tier VARCHAR(50) NOT NULL,  -- free, premium, enterprise
        custom_limits JSONB,  -- Override default tier limits
        whitelist BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tier (tier)
      );
      
      CREATE TABLE rate_limit_overrides (
        override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier_type VARCHAR(50) NOT NULL,
        identifier_value VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,  -- reset, whitelist, blacklist, custom_limit
        custom_limit INT,
        expires_at TIMESTAMP,
        reason TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_identifier (identifier_type, identifier_value),
        INDEX idx_expires (expires_at)
      );
      
      CREATE TABLE rate_limit_logs (
        log_id BIGSERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        identifier_type VARCHAR(50),
        identifier_value VARCHAR(255),
        endpoint VARCHAR(500),
        method VARCHAR(10),
        allowed BOOLEAN,
        limit_type VARCHAR(50),  -- Which rule triggered
        current_count INT,
        limit_value INT,
        response_time_ms FLOAT,
        INDEX idx_timestamp (timestamp),
        INDEX idx_identifier (identifier_value, timestamp),
        INDEX idx_blocked (allowed, timestamp)
      ) PARTITION BY RANGE (timestamp);
      
      -- Create monthly partitions for logs
      CREATE TABLE rate_limit_logs_2024_01 
        PARTITION OF rate_limit_logs 
        FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
    `,
    
    nosql: `
      // Redis for counters and real-time data
      
      // Token bucket implementation
      HSET bucket:user:123 
        tokens 95.5
        capacity 100
        last_refill 1705760400.123
        refill_rate 10
      
      // Sliding window log
      ZADD sliding:user:123:1h 
        1705760400.123 "req_1"
        1705760401.456 "req_2"
        1705760402.789 "req_3"
      
      // Fixed window counter
      INCR fixed:user:123:1h:1705760000
      EXPIRE fixed:user:123:1h:1705760000 3600
      
      // Distributed lock for sync
      SET lock:sync:user:123 "node_1" NX EX 10
      
      // Hot key splitting
      INCR counter:user:123:shard:0
      INCR counter:user:123:shard:1
      INCR counter:user:123:shard:2
      
      // Local cache invalidation
      PUBLISH cache_invalidate "user:123"
      
      // Configuration cache
      SET config:rule:tier:premium '{
        "limits": [
          {"window": 3600, "limit": 10000},
          {"window": 60, "limit": 1000}
        ]
      }' EX 300
      
      // Whitelist/Blacklist
      SADD whitelist:global "user_456"
      SADD blacklist:ip "192.168.1.100"
      
      // Real-time metrics
      TS.ADD metric:requests 1705760400 1
      TS.ADD metric:blocked 1705760400 1
      TS.RANGE metric:requests - + AGGREGATION avg 60
      
      // Lua script for atomic token bucket
      SCRIPT LOAD "
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local requested = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        local time_passed = now - last_refill
        local new_tokens = time_passed * refill_rate
        tokens = math.min(capacity, tokens + new_tokens)
        
        if tokens >= requested then
          tokens = tokens - requested
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          redis.call('EXPIRE', key, 3600)
          return {1, tokens}
        else
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          return {0, tokens}
        end
      "
      
      // MongoDB for analytics and reporting
      
      {
        _id: ObjectId("..."),
        timestamp: ISODate("2024-01-20T10:00:00Z"),
        identifier: "user_123",
        identifier_type: "user",
        hour_bucket: "2024-01-20T10:00:00Z",
        requests: {
          total: 8234,
          allowed: 8100,
          blocked: 134
        },
        endpoints: {
          "/api/v1/users": 3421,
          "/api/v1/posts": 2834,
          "/api/v1/search": 1979
        },
        response_times: {
          avg: 0.8,
          p50: 0.7,
          p95: 1.2,
          p99: 2.3
        },
        blocked_reasons: {
          "user_limit": 89,
          "endpoint_limit": 45
        }
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Algorithm Choice',
      analysis: `
        Token Bucket:
        ✓ Allows bursts
        ✓ Smooth rate limiting
        ✓ Memory efficient
        ✗ Complex to implement
        
        Sliding Window Log:
        ✓ Most accurate
        ✓ No boundary issues  
        ✗ Memory intensive
        ✗ O(n) complexity
        
        Sliding Window Counter:
        ✓ Good accuracy
        ✓ Memory efficient
        ✗ Approximate at boundaries
        
        Fixed Window:
        ✓ Simple implementation
        ✓ Very efficient
        ✗ Boundary spike issue
        ✗ Less accurate
        
        Decision: Token Bucket for APIs, Sliding Window for accuracy-critical
      `
    },
    {
      decision: 'Storage Backend',
      analysis: `
        Redis Only:
        ✓ Fast (< 1ms)
        ✓ Atomic operations
        ✓ TTL support
        ✗ Memory limited
        ✗ Persistence concerns
        
        Database Only:
        ✓ Persistent
        ✓ Complex queries
        ✗ Too slow (> 10ms)
        ✗ Connection overhead
        
        Hybrid (Chosen):
        ✓ Redis for counters
        ✓ DB for configuration
        ✓ Best of both worlds
        ✗ Complexity
        
        Decision: Redis for real-time, PostgreSQL for config
      `
    },
    {
      decision: 'Synchronization Strategy',
      analysis: `
        Centralized Counter:
        ✓ Always accurate
        ✓ Simple logic
        ✗ Single point of failure
        ✗ Network latency
        
        Eventually Consistent:
        ✓ Low latency
        ✓ Highly available
        ✗ Temporary inaccuracy
        ✗ Complex reconciliation
        
        Hybrid (Chosen):
        ✓ Local cache for reads
        ✓ Async sync to Redis
        ✓ Balance accuracy/speed
        ✗ Cache invalidation
        
        Decision: Local cache with 1-second TTL + Redis backend
      `
    },
    {
      decision: 'Rate Limit Granularity',
      analysis: `
        Global Limits:
        ✓ Simple
        ✓ Easy to manage
        ✗ Not flexible
        ✗ Unfair to small users
        
        Per-User Only:
        ✓ Fair
        ✗ Users can abuse
        ✗ No endpoint protection
        
        Multi-level (Chosen):
        ✓ User + Endpoint + Global
        ✓ Flexible rules
        ✓ Better protection
        ✗ Complex evaluation
        
        Decision: Hierarchical limits with priority rules
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Rate Limiting at Scale - Stripe',
        youtubeId: 'CZGGfQDQPC0',
        duration: '28:43'
      },
      { 
        title: 'System Design: Rate Limiter',
        youtubeId: 'FU4WlwfS3Gc',
        duration: '45:12'
      }
    ],
    articles: [
      {
        title: 'Scaling your API with Rate Limiters',
        url: 'https://stripe.com/blog/rate-limiters'
      },
      {
        title: 'How we built rate limiting capable of scaling to millions',
        url: 'https://blog.cloudflare.com/counting-things-a-lot-of-different-things'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 4: Design a Rate Limiter'
      }
    ]
  }
}