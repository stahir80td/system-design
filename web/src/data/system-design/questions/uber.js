// Uber/Lyft System Design Question
export default {
  id: 'uber',
  title: 'Design Uber/Lyft',
  companies: ['Uber', 'Lyft', 'Google'],
  difficulty: 'Hard',
  category: 'E-commerce & Marketplace',
  
  description: 'Design a ride-sharing service that matches drivers with riders in real-time, handles payments, tracks locations, and calculates dynamic pricing.',
  
  requirements: {
    functional: [
      'User registration (drivers and riders)',
      'Request ride with pickup and destination',
      'Match riders with nearby available drivers',
      'Real-time location tracking during ride',
      'Calculate fare based on distance and time',
      'Process payments and tips',
      'Driver and rider ratings',
      'Trip history for both parties',
      'Support multiple vehicle types (UberX, Black, Pool)',
      'Dynamic/surge pricing based on demand'
    ],
    nonFunctional: [
      'Support 100 million users globally',
      '10 million daily active riders',
      '1 million daily active drivers',
      '10 million rides per day',
      'Match within 15 seconds',
      'Location update every 4 seconds',
      '99.95% availability',
      'Handle peak hours (5x normal traffic)',
      'Global operation across 500+ cities'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design a ride-sharing system like Uber that operates globally at massive scale. The key challenges are:
      
      1. Real-time matching of supply (drivers) and demand (riders)
      2. Efficient geospatial queries to find nearby drivers
      3. Live location tracking throughout the trip
      4. Dynamic pricing based on supply-demand
      5. Reliable payment processing
      6. Handling peak traffic (New Year's Eve, concerts, etc.)
      
      The system needs to be highly available as people depend on it for transportation.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Users and Activity:
      - Total users: 100 million (75M riders, 25M drivers)
      - Daily active: 10M riders, 1M drivers
      - Rides per day: 10 million
      - Peak rides/second: 1,000 (during rush hour)
      - Average ride: 20 minutes, 5 miles
      
      Location Updates:
      - Active drivers sending location: 1M
      - Update frequency: every 4 seconds
      - Location updates/sec: 250,000
      - During rides: 500K active trips * 2 (driver+rider) / 4 sec = 250K/sec
      - Total location updates: 500K/second peak
      
      Storage Estimates:
      - User profiles: 100M * 1KB = 100 GB
      - Trip records: 10M/day * 2KB = 20 GB/day
      - 5 year trip history: 20 GB * 365 * 5 = 36.5 TB
      - Location data: 500K/sec * 100 bytes = 50 MB/sec = 4.3 TB/day
      - Keep location data for 30 days: 130 TB
      
      Bandwidth:
      - Location updates: 500K * 100 bytes = 50 MB/sec
      - API requests: 10K/sec * 1KB = 10 MB/sec
      - Total: ~100 MB/sec globally
      
      Database Operations:
      - Location writes: 500K/second
      - Trip reads/writes: 1K/second
      - Matching queries: 1K/second with geospatial
    `,
    
    highLevelDesign: `
      **System Architecture Overview:**
      
      1. **Client Applications**
         - Rider app (iOS/Android)
         - Driver app (iOS/Android)
         - Web dashboard
      
      2. **API Gateway**
         - Authentication and authorization
         - Rate limiting
         - Request routing
      
      3. **Core Services**
         - User Service: Registration, profiles
         - Matching Service: Supply-demand matching
         - Location Service: Real-time tracking
         - Trip Service: Ride lifecycle management
         - Pricing Service: Fare calculation, surge pricing
         - Payment Service: Process transactions
         - Notification Service: Push notifications
      
      4. **Data Storage**
         - PostgreSQL: Users, trips, transactions
         - Cassandra: Location history
         - Redis: Live driver locations, sessions
         - S3: Trip receipts, documents
         - ElasticSearch: Trip search, analytics
      
      5. **Supporting Systems**
         - Kafka: Event streaming
         - WebSocket servers: Real-time updates
         - ML platform: ETA prediction, fraud detection
      
      **Basic Flow:**
      1. Rider requests ride with pickup/destination
      2. System finds nearby available drivers
      3. Sends ride request to drivers (sorted by distance/rating)
      4. First driver to accept gets the ride
      5. Track both parties during pickup and trip
      6. Calculate fare and process payment at trip end
    `,
    
    detailedDesign: `
      **1. Location Service - Geospatial Indexing:**
      
      QuadTree Implementation:
      - Divide map into grids recursively
      - Each node represents a geographic boundary
      - Leaf nodes contain driver IDs
      - Dynamic: split when >500 drivers, merge when <100
      
      Alternative - Geohash:
      - Convert lat/long to base-32 string
      - Longer string = more precision
      - Use 6-character precision (~1.2km x 600m)
      - Redis sorted sets for efficient queries
      
      Location Updates:
      \`\`\`
      Driver app -> Location Service:
      {
        driverId: "d123",
        lat: 37.7749,
        lng: -122.4194,
        heading: 45,
        speed: 25,
        timestamp: 1234567890
      }
      
      Location Service:
      1. Update Redis: GEO ADD drivers d123 -122.4194 37.7749
      2. Update Cassandra (async): INSERT INTO locations...
      3. If on trip: notify Trip Service
      \`\`\`
      
      **2. Matching Service:**
      
      Driver Selection Algorithm:
      \`\`\`python
      def find_drivers(pickup_location, max_distance=5km):
          # Get nearby grid cells
          cells = get_adjacent_cells(pickup_location)
          
          candidates = []
          for cell in cells:
              drivers = redis.georadius(
                  cell, 
                  pickup_lat, 
                  pickup_lng,
                  max_distance
              )
              candidates.extend(drivers)
          
          # Filter and rank
          available = filter_available(candidates)
          ranked = rank_drivers(available, factors=[
              'distance',      # 40% weight
              'driver_rating', # 30% weight  
              'acceptance_rate', # 20% weight
              'vehicle_type'   # 10% weight
          ])
          
          return ranked[:10]  # Top 10 candidates
      \`\`\`
      
      Request Broadcasting:
      - Send to closest driver first
      - Wait 10 seconds for response
      - If no response, send to next 2 drivers
      - Continue expanding until accepted
      - Timeout after 2 minutes
      
      **3. Trip Service:**
      
      State Machine for Trip:
      \`\`\`
      REQUESTED -> ACCEPTED -> DRIVER_ARRIVED 
      -> STARTED -> COMPLETED -> PAID
      
      Any state -> CANCELLED (with reason)
      \`\`\`
      
      Trip Tracking:
      - Store waypoints every 100 meters
      - Calculate distance using actual route
      - Detect anomalies (wrong route, stops)
      
      **4. Pricing Service:**
      
      Base Fare Calculation:
      \`\`\`
      fare = base_price 
           + (time_minutes * time_rate)
           + (distance_miles * distance_rate)
           + surge_multiplier
           + tolls
           + booking_fee
      \`\`\`
      
      Surge Pricing Algorithm:
      \`\`\`python
      def calculate_surge(grid_cell):
          # Last 10 minutes data
          demand = get_ride_requests(grid_cell, 10_min)
          supply = get_available_drivers(grid_cell)
          
          ratio = demand / max(supply, 1)
          
          if ratio < 1.5:
              return 1.0  # No surge
          elif ratio < 2.5:
              return 1.5  # 1.5x surge
          elif ratio < 4.0:
              return 2.0  # 2x surge
          else:
              return min(3.0, ratio * 0.75)  # Cap at 3x
      \`\`\`
      
      **5. Payment Processing:**
      
      Payment Flow:
      1. Pre-authorize card when ride starts
      2. Calculate final fare at trip end
      3. Capture payment
      4. Split payment (Uber commission ~25%)
      5. Add to driver earnings (weekly payout)
      
      **6. Real-time Updates via WebSocket:**
      
      Channels:
      - Driver: trip-updates, location-requests
      - Rider: driver-location, trip-status, fare-updates
      
      Message format:
      \`\`\`json
      {
        "type": "driver_location",
        "data": {
          "lat": 37.7749,
          "lng": -122.4194,
          "eta_seconds": 180
        },
        "timestamp": 1234567890
      }
      \`\`\`
    `,
    
    dataFlow: `
      **Complete Ride Flow:**
      
      1. **Ride Request:**
         - Rider opens app -> GET /api/estimate?from=x&to=y
         - Pricing Service calculates estimate with current surge
         - Rider confirms -> POST /api/rides/request
         
      2. **Driver Matching:**
         - Trip Service creates trip record (status: REQUESTED)
         - Calls Matching Service with pickup location
         - Matching Service queries Location Service for nearby drivers
         - Filters by availability, vehicle type, rating
         - Returns ranked list
      
      3. **Driver Assignment:**
         - Send push notification to top driver
         - Driver has 15 seconds to accept/decline
         - If accepted: Update trip (status: ACCEPTED, driverId)
         - If declined/timeout: Try next driver
         - Notify rider when driver assigned
      
      4. **Pickup Phase:**
         - Driver navigates to pickup (external maps API)
         - Location Service tracks driver
         - Send updates to rider via WebSocket
         - Driver arrives -> Update status: DRIVER_ARRIVED
         - Send push notification to rider
      
      5. **Trip Phase:**
         - Driver starts trip -> Status: STARTED
         - Record start time, location
         - Track both driver and rider locations
         - Store waypoints for route verification
         - Calculate distance in real-time
      
      6. **Completion:**
         - Driver ends trip -> Status: COMPLETED
         - Calculate final fare
         - Process payment
         - Request ratings from both parties
         - Update driver availability
         - Generate receipt
      
      **Location Update Flow:**
      
      Driver App -> API Gateway -> Location Service
      -> Redis (immediate update)
      -> Kafka (async)
      -> Cassandra (permanent storage)
      -> Analytics Pipeline
      
      If driver on trip:
      -> Trip Service -> WebSocket -> Rider App
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Hot Spots in City Centers**
         Problem: Too many drivers/requests in small area
         Solution: 
         - Finer grid granularity in city centers
         - Multiple Redis shards for hot zones
         - Cache popular queries
      
      2. **Location Update Storm**
         Problem: 500K updates/second during peak
         Solution:
         - Batch updates from same driver (aggregate 2-3)
         - Use UDP for location updates (acceptable loss)
         - Separate infrastructure for location pipeline
      
      3. **Matching Service Overload**
         Problem: Complex queries during high demand
         Solution:
         - Pre-compute driver rankings
         - Cache available drivers per grid
         - Reduce match radius during peak times
      
      4. **Database Write Bottlenecks**
         Problem: High write load for trips/locations
         Solution:
         - Cassandra for write-heavy location data
         - Async writes via Kafka
         - Separate OLTP and OLAP systems
      
      5. **Payment Processing Delays**
         Problem: Third-party payment gateway latency
         Solution:
         - Async payment processing
         - Pre-authorize during ride
         - Multiple payment provider fallbacks
         - Store payment tokens for repeat customers
      
      6. **Driver-Rider Notification Delays**
         Problem: Push notification latency
         Solution:
         - WebSocket for active app users
         - SMS fallback for critical notifications
         - Regional notification services
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Sharding:**
         - Shard by city/region
         - Each region has dedicated infrastructure
         - Cross-region trips handled specially
         - Example: NYC, SF, London separate clusters
      
      2. **Service Scaling:**
         
         Location Service:
         - Horizontal scaling with consistent hashing
         - Read replicas for location queries
         - Separate clusters for real-time vs historical
         
         Matching Service:
         - Cache layers for hot data
         - Read-through cache for driver availability
         - Scale based on request rate
         
         Trip Service:
         - Shard by trip ID
         - Event sourcing for trip state changes
         - CQRS pattern for read/write separation
      
      3. **Data Tier Scaling:**
         
         Redis Cluster:
         - Partition by geohash prefix
         - Replica sets for read scaling
         - Separate clusters for different data types
         
         Cassandra:
         - Partition by (city, date, hour)
         - TTL for old location data
         - Batch writes for efficiency
         
         PostgreSQL:
         - Master-slave replication
         - Read replicas for analytics
         - Partition trips by date
      
      4. **Peak Hour Handling:**
         - Auto-scale based on CloudWatch metrics
         - Pre-warm servers before known peaks
         - Reduce location precision during extreme load
         - Queue non-critical operations
         - Circuit breakers for graceful degradation
      
      5. **Global Distribution:**
         - Multi-region deployment
         - Data centers in 20+ regions
         - Edge servers for static content
         - Regional compliance for data residency
      
      6. **Optimization Techniques:**
         - Connection pooling for databases
         - Protobuf instead of JSON for mobile
         - HTTP/2 for multiplexing
         - Aggressive caching of driver profiles
         - Batch API calls where possible
    `
  },
  
  architecture: {
    svgPath: '/diagrams/uber.svg',
    components: [
      { 
        name: 'API Gateway', 
        description: 'Entry point for all client requests, handles auth and routing' 
      },
      { 
        name: 'Location Service', 
        description: 'Manages real-time location updates and geospatial queries' 
      },
      { 
        name: 'Matching Service', 
        description: 'Matches riders with nearby available drivers using algorithms' 
      },
      { 
        name: 'Trip Service', 
        description: 'Manages trip lifecycle from request to completion' 
      },
      { 
        name: 'Pricing Service', 
        description: 'Calculates fares and surge pricing based on demand' 
      },
      { 
        name: 'Payment Service', 
        description: 'Processes payments and manages driver payouts' 
      },
      { 
        name: 'QuadTree/Geohash', 
        description: 'Spatial index for efficient nearby driver queries' 
      },
      { 
        name: 'Redis Geo', 
        description: 'In-memory storage for live driver locations' 
      },
      { 
        name: 'Kafka', 
        description: 'Event streaming for async processing' 
      }
    ]
  },
  
  apiDesign: `
    // REST APIs
    
    // Get fare estimate
    GET /api/estimate
    Query: {
      pickup_lat: 37.7749,
      pickup_lng: -122.4194,
      dest_lat: 37.7849,
      dest_lng: -122.4294,
      vehicle_type: "uberx"
    }
    Response: {
      estimated_fare: "$12-15",
      surge_multiplier: 1.5,
      estimated_time: 15,
      estimated_distance: 3.2
    }
    
    // Request ride
    POST /api/rides/request
    Request: {
      pickup_location: {lat: 37.7749, lng: -122.4194},
      destination: {lat: 37.7849, lng: -122.4294},
      vehicle_type: "uberx",
      payment_method_id: "pm_123"
    }
    Response: {
      ride_id: "ride_abc123",
      status: "FINDING_DRIVER",
      estimated_arrival: 300
    }
    
    // Get ride status
    GET /api/rides/{ride_id}
    Response: {
      ride_id: "ride_abc123",
      status: "EN_ROUTE_TO_PICKUP",
      driver: {
        name: "John",
        rating: 4.8,
        vehicle: "Toyota Camry",
        plate: "ABC123"
      },
      eta: 180,
      driver_location: {lat: 37.7749, lng: -122.4194}
    }
    
    // Driver APIs
    
    // Update availability
    PUT /api/driver/status
    Request: {
      available: true,
      location: {lat: 37.7749, lng: -122.4194}
    }
    
    // Accept ride request  
    POST /api/driver/rides/{ride_id}/accept
    
    // Update location
    POST /api/driver/location
    Request: {
      lat: 37.7749,
      lng: -122.4194,
      heading: 45,
      speed: 30
    }
    
    // WebSocket Events
    
    // To Rider
    {
      event: "driver_assigned",
      data: {
        driver: {...},
        eta: 300,
        vehicle: {...}
      }
    }
    
    {
      event: "driver_location",
      data: {
        lat: 37.7749,
        lng: -122.4194,
        eta: 60
      }
    }
    
    {
      event: "trip_started",
      data: {
        start_time: 1234567890,
        start_location: {...}
      }
    }
    
    {
      event: "trip_completed",
      data: {
        fare: 15.50,
        distance: 3.2,
        time: 15,
        end_location: {...}
      }
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for core data
      
      CREATE TABLE users (
        user_id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        name VARCHAR(255),
        user_type VARCHAR(20), -- 'rider' or 'driver'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rating DECIMAL(2,1),
        status VARCHAR(20) -- 'active', 'suspended', etc
      );
      
      CREATE TABLE drivers (
        driver_id UUID PRIMARY KEY REFERENCES users(user_id),
        license_number VARCHAR(50) UNIQUE,
        vehicle_id UUID,
        available BOOLEAN DEFAULT false,
        current_location POINT,
        total_earnings DECIMAL(10,2),
        acceptance_rate DECIMAL(3,2),
        cancellation_rate DECIMAL(3,2)
      );
      
      CREATE TABLE vehicles (
        vehicle_id UUID PRIMARY KEY,
        driver_id UUID REFERENCES drivers(driver_id),
        make VARCHAR(50),
        model VARCHAR(50),
        year INTEGER,
        plate_number VARCHAR(20) UNIQUE,
        vehicle_type VARCHAR(20), -- 'uberx', 'black', etc
        capacity INTEGER
      );
      
      CREATE TABLE trips (
        trip_id UUID PRIMARY KEY,
        rider_id UUID REFERENCES users(user_id),
        driver_id UUID REFERENCES drivers(driver_id),
        pickup_location POINT,
        destination POINT,
        status VARCHAR(20),
        requested_at TIMESTAMP,
        accepted_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        distance_miles DECIMAL(5,2),
        duration_minutes INTEGER,
        base_fare DECIMAL(10,2),
        surge_multiplier DECIMAL(3,2),
        total_fare DECIMAL(10,2),
        payment_method_id VARCHAR(50),
        payment_status VARCHAR(20),
        rider_rating INTEGER,
        driver_rating INTEGER
      );
      
      CREATE INDEX idx_trips_rider ON trips(rider_id, requested_at DESC);
      CREATE INDEX idx_trips_driver ON trips(driver_id, requested_at DESC);
      CREATE INDEX idx_trips_status ON trips(status) WHERE status IN ('REQUESTED', 'ACCEPTED', 'STARTED');
    `,
    
    nosql: `
      // Cassandra for location history
      
      CREATE TABLE driver_locations (
        driver_id UUID,
        timestamp TIMESTAMP,
        location POINT,
        heading INT,
        speed DECIMAL(5,2),
        PRIMARY KEY ((driver_id, date_hour), timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC)
      AND default_time_to_live = 2592000; -- 30 days
      
      CREATE TABLE trip_waypoints (
        trip_id UUID,
        timestamp TIMESTAMP,
        location POINT,
        PRIMARY KEY (trip_id, timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp ASC);
      
      // Redis structures
      
      // Live driver locations (Geo)
      GEOADD drivers -122.4194 37.7749 driver:123
      GEORADIUS drivers -122.4194 37.7749 5 km WITHDIST
      
      // Driver availability
      HSET driver:123 available true vehicle_type uberx
      
      // Grid-based driver index
      SADD grid:abc123 driver:456 driver:789
      
      // Surge pricing cache
      HSET surge:grid:xyz multiplier 1.5 expires_at 1234567890
      
      // Rate limiting
      INCR api_limit:user:123:1234567 
      EXPIRE api_limit:user:123:1234567 60
    `
  },
  
  tradeoffs: [
    {
      decision: 'QuadTree vs Geohash for Location',
      analysis: `
        QuadTree:
        ✓ Dynamic grid sizing based on density
        ✓ Efficient for non-uniform distribution
        ✓ Better for varying city densities
        ✗ More complex implementation
        ✗ Rebalancing overhead
        
        Geohash (Chosen):
        ✓ Simple implementation
        ✓ Works well with Redis/databases
        ✓ Fixed-size grids
        ✓ Easy to query neighbors
        ✗ Less efficient for sparse areas
        
        Decision: Geohash for simplicity, with adaptive precision
      `
    },
    {
      decision: 'Push vs Pull for Driver Selection',
      analysis: `
        Push (Send to specific drivers):
        ✓ Lower latency
        ✓ Controlled experience
        ✓ Better acceptance rates
        ✗ Complex orchestration
        
        Pull (Drivers see available rides):
        ✓ Simple implementation
        ✓ Drivers have choice
        ✗ Cherry-picking problems
        ✗ Slower matching
        
        Decision: Push model with intelligent routing
      `
    },
    {
      decision: 'Synchronous vs Async Payment',
      analysis: `
        Synchronous:
        ✓ Immediate confirmation
        ✓ Simple flow
        ✗ Blocks trip completion
        ✗ Poor user experience if slow
        
        Asynchronous (Chosen):
        ✓ Better user experience
        ✓ Trip completes immediately
        ✓ Retry logic for failures
        ✗ Complex error handling
        ✗ Potential payment failures post-trip
        
        Decision: Async with pre-authorization
      `
    },
    {
      decision: 'Monolithic vs Microservices',
      analysis: `
        Microservices (Chosen):
        ✓ Independent scaling
        ✓ Technology flexibility
        ✓ Fault isolation
        ✓ Team autonomy
        ✗ Network complexity
        ✗ Distributed transaction challenges
        
        Decision: Microservices for scale and team structure
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Uber System Design - Tech Dummies',
        youtubeId: 'umWHrU5jvYQ',
        duration: '26:15'
      },
      { 
        title: 'Design Uber - Gaurav Sen',
        youtubeId: 'R_agd5qZ26Y',
        duration: '31:22'
      }
    ],
    articles: [
      {
        title: 'How Uber Scales Their Real-Time Market Platform',
        url: 'https://eng.uber.com/real-time-market-platform/'
      },
      {
        title: 'Uber Engineering - Location Services',
        url: 'https://eng.uber.com/locations-services/'
      }
    ],
    books: [
      {
        title: 'System Design Interview Volume 2',
        author: 'Alex Xu',
        chapter: 'Chapter 1: Design a Ride-Sharing Service'
      }
    ]
  }
}