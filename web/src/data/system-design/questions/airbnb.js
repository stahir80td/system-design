// Airbnb System Design Question
export default {
  id: 'airbnb',
  title: 'Design Airbnb',
  companies: ['Airbnb', 'Booking.com', 'VRBO', 'Expedia', 'Hotels.com'],
  difficulty: 'Hard',
  category: 'Marketplace & Booking',
  
  description: 'Design a global accommodation marketplace that connects hosts with guests, supporting search, booking, payments, reviews, and host management.',
  
  requirements: {
    functional: [
      'Property listing and management',
      'Search with filters (location, dates, price, amenities)',
      'Availability calendar management',
      'Booking and reservation system',
      'Payment processing and escrow',
      'Two-way review system',
      'Messaging between hosts and guests',
      'Photo uploads and galleries',
      'Pricing recommendations',
      'Instant booking vs approval flow',
      'Cancellation policies',
      'Host verification and trust',
      'Multi-currency support',
      'Mobile and web platforms'
    ],
    nonFunctional: [
      '150 million users',
      '50 million active listings',
      '2 million bookings per day',
      '500 million searches per day',
      'Search latency < 200ms',
      'Booking success rate > 99.9%',
      '99.99% availability',
      'Support 62 currencies',
      'Available in 220+ countries',
      'Handle $100B+ in transactions/year',
      'Peak: 10M concurrent users',
      'Photo storage: 10PB+',
      'GDPR/PCI compliance'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design Airbnb, a global accommodation marketplace. The key challenges are:
      
      1. Geographic search at scale (proximity queries)
      2. Real-time availability and pricing
      3. Double-booking prevention
      4. Global payment processing
      5. Trust and safety systems
      6. Dynamic pricing optimization
      7. High-quality image serving
      8. Handling seasonality and traffic spikes
      
      The system needs to handle millions of properties worldwide, process secure payments, maintain consistency for bookings, and provide fast search across multiple criteria.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      User Base:
      - Total users: 150 million
      - Active hosts: 4 million
      - Active guests: 50 million/month
      - Listings: 50 million
      - Photos per listing: 20 average
      
      Traffic Patterns:
      - Daily searches: 500 million
      - Search QPS: 5,800 avg, 20,000 peak
      - Daily bookings: 2 million
      - Booking QPS: 23 avg, 100 peak
      - Page views: 5 billion/day
      
      Data Volume:
      - Listing data: 50M * 10KB = 500GB
      - Photos: 50M * 20 * 2MB = 2PB
      - User profiles: 150M * 1KB = 150GB
      - Reviews: 500M * 500B = 250GB
      - Messages: 10B * 200B = 2TB
      - Total with replication: 10PB+
      
      Search Requirements:
      - Index size: 50M listings * 5KB = 250GB
      - Geographic queries: 500M/day
      - Filter combinations: 100+
      - Response time: < 200ms
      
      Booking System:
      - Concurrent bookings: 10,000
      - Payment processing: $300M/day
      - Transaction rate: 2M/day
      - Inventory updates: 20M/day
      
      Infrastructure:
      - API servers: 5,000
      - Search clusters: 500 nodes
      - Database servers: 1,000
      - Cache servers: 2,000
      - CDN nodes: 200 globally
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **Client Layer**
         - Web application
         - Mobile apps (iOS/Android)
         - Host management tools
         - Admin dashboard
      
      2. **API Gateway**
         - Request routing
         - Authentication
         - Rate limiting
         - API versioning
      
      3. **Core Services**
         - Search Service
         - Booking Service
         - Payment Service
         - User Service
         - Listing Service
         - Review Service
         - Messaging Service
      
      4. **Search Infrastructure**
         - Elasticsearch clusters
         - Geospatial indexing
         - Personalization engine
         - Ranking algorithm
      
      5. **Booking System**
         - Availability management
         - Reservation workflow
         - Inventory service
         - Calendar sync
      
      6. **Payment Platform**
         - Payment gateway integration
         - Escrow management
         - Currency conversion
         - Fraud detection
      
      7. **Data Storage**
         - PostgreSQL for transactions
         - MongoDB for listings
         - Redis for caching
         - S3 for media storage
      
      **Key Design Principles:**
      - Microservices architecture
      - Event-driven communication
      - ACID for bookings
      - Eventually consistent for non-critical data
    `,
    
    detailedDesign: `
      **1. Search System Design:**
      
      Geographic Search:
      - Quadtree/Geohash for spatial indexing
      - Multiple resolution levels
      - Bounding box queries
      - Distance calculations
      
      Search Flow:
      1. Parse query (location, dates, filters)
      2. Geographic filtering (radius/bbox)
      3. Availability check
      4. Apply filters (price, amenities, type)
      5. Personalized ranking
      6. Return paginated results
      
      Elasticsearch Schema:
      - Geospatial data (lat/lon)
      - Amenities (nested objects)
      - Price ranges by date
      - Availability calendar
      - Host response time
      - Review scores
      
      **2. Booking System:**
      
      Availability Management:
      - Calendar-based availability
      - Real-time inventory updates
      - Optimistic locking
      - Distributed locks for critical sections
      
      Booking Flow:
      1. Check availability
      2. Calculate pricing
      3. Hold inventory (temporary lock)
      4. Process payment
      5. Confirm booking
      6. Update calendar
      7. Send notifications
      8. Release lock
      
      Double-Booking Prevention:
      - Distributed locking (Redis/Zookeeper)
      - Transaction isolation
      - Optimistic concurrency control
      - Saga pattern for distributed transactions
      
      **3. Payment Processing:**
      
      Payment Flow:
      1. Guest initiates booking
      2. Calculate total (base + fees + taxes)
      3. Authorize payment
      4. Hold in escrow
      5. Booking confirmation
      6. Release to host (after check-in)
      7. Handle refunds/cancellations
      
      Multi-Currency:
      - Real-time exchange rates
      - Currency conversion service
      - Local payment methods
      - Regional tax calculation
      
      **4. Dynamic Pricing:**
      
      Pricing Factors:
      - Seasonal demand
      - Local events
      - Historical booking data
      - Competitor pricing
      - Day of week patterns
      - Lead time to booking
      
      ML Model:
      - Feature extraction
      - Demand forecasting
      - Price elasticity
      - A/B testing framework
      - Real-time adjustments
      
      **5. Trust & Safety:**
      
      Verification Systems:
      - Identity verification
      - Photo verification
      - Address verification
      - Payment verification
      
      Risk Assessment:
      - Fraud detection ML models
      - Anomaly detection
      - Review authenticity
      - Behavioral analysis
      
      **6. Review System:**
      
      Two-Way Reviews:
      - Guest reviews host
      - Host reviews guest
      - Simultaneous reveal
      - Review period (14 days)
      
      Review Pipeline:
      - Sentiment analysis
      - Spam detection
      - Profanity filtering
      - Aggregation and scoring
      
      **7. Image Service:**
      
      Image Processing:
      - Multiple resolutions
      - CDN distribution
      - Lazy loading
      - WebP optimization
      - Watermarking
      
      Storage Strategy:
      - S3 for original images
      - CloudFront CDN
      - Thumbnail generation
      - Progressive loading
    `,
    
    dataFlow: `
      **Search Flow:**
      
      1. User enters location and dates
      2. Frontend sends search request
      3. API Gateway validates request
      4. Search Service processes:
         - Geocode location
         - Query Elasticsearch
         - Filter by availability
         - Apply user filters
      5. Availability Service checks:
         - Query calendar data
         - Filter booked dates
      6. Pricing Service calculates:
         - Base price
         - Seasonal adjustments
         - Dynamic pricing
      7. Ranking Service orders results:
         - Quality score
         - User preferences
         - ML predictions
      8. Return paginated results
      
      **Booking Flow:**
      
      1. Guest selects property
      2. Check real-time availability
      3. Calculate final price
      4. Initiate booking request
      5. Acquire distributed lock
      6. Validate availability again
      7. Create pending reservation
      8. Process payment:
         - Validate card
         - Charge amount
         - Hold in escrow
      9. Confirm booking:
         - Update inventory
         - Send confirmations
         - Update calendar
      10. Release lock
      11. Trigger async tasks:
          - Email notifications
          - SMS confirmations
          - Calendar sync
          - Analytics events
      
      **Host Listing Flow:**
      
      1. Host creates listing
      2. Enter property details
      3. Upload photos:
         - Compress images
         - Generate thumbnails
         - Upload to S3
         - Get CDN URLs
      4. Set availability calendar
      5. Configure pricing:
         - Base price
         - Seasonal rates
         - Special offers
      6. Set house rules
      7. Submit for review
      8. Verification process:
         - Address verification
         - Photo verification
         - Quality check
      9. Publish listing
      10. Index in search
      
      **Review Flow:**
      
      1. Trip completion
      2. Trigger review requests
      3. Guest writes review
      4. Host writes review
      5. Hold both reviews (blind)
      6. After deadline or both complete:
         - Reveal simultaneously
         - Calculate new ratings
         - Update search rankings
      7. Send notifications
      8. Update ML models
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **Search Performance**
         Problem: Geographic queries on millions of listings
         Solution:
         - Geospatial indexing (QuadTree)
         - Elasticsearch with geo queries
         - Caching popular searches
         - Regional sharding
      
      2. **Booking Conflicts**
         Problem: Race conditions for popular properties
         Solution:
         - Distributed locking
         - Optimistic concurrency
         - Queue-based booking
         - Inventory reservation system
      
      3. **Payment Processing**
         Problem: High-value transactions, fraud risk
         Solution:
         - Multiple payment gateways
         - Fraud detection ML
         - Escrow system
         - Async payment processing
      
      4. **Image Storage/Delivery**
         Problem: Billions of high-res images
         Solution:
         - CDN distribution
         - Multiple resolutions
         - Lazy loading
         - Image optimization
      
      5. **Calendar Sync**
         Problem: Real-time availability across channels
         Solution:
         - Event streaming
         - CDC (Change Data Capture)
         - Webhooks
         - Eventually consistent updates
      
      6. **Peak Season Load**
         Problem: 10x traffic during holidays
         Solution:
         - Auto-scaling
         - Queue-based architecture
         - Cache warming
         - Regional failover
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Geographic Distribution:**
         - Regional data centers
         - Local CDN edges
         - Country-specific servers
         - Cross-region replication
      
      2. **Database Scaling:**
         - Read replicas for searches
         - Sharding by geography
         - Separate OLTP/OLAP
         - Time-series for analytics
      
      3. **Search Optimization:**
         - Elasticsearch clusters
         - Index partitioning
         - Query result caching
         - Denormalized data
      
      4. **Service Scaling:**
         - Horizontal scaling
         - Container orchestration
         - Service mesh
         - Circuit breakers
      
      5. **Caching Strategy:**
         - Multi-level caching
         - CDN for static content
         - Redis for sessions
         - Application-level caching
      
      6. **Async Processing:**
         - Message queues
         - Event streaming
         - Batch processing
         - Background jobs
      
      7. **Performance Optimization:**
         - Database query optimization
         - API response pagination
         - GraphQL for mobile
         - Image lazy loading
    `
  },
  
  architecture: {
    svgPath: '/diagrams/airbnb.svg',
    components: [
      { 
        name: 'Search Service', 
        description: 'Handles geographic and filtered searches with Elasticsearch' 
      },
      { 
        name: 'Booking Service', 
        description: 'Manages reservations with distributed locking' 
      },
      { 
        name: 'Payment Service', 
        description: 'Processes payments with escrow management' 
      },
      { 
        name: 'Calendar Service', 
        description: 'Manages availability and prevents double-booking' 
      },
      { 
        name: 'Pricing Engine', 
        description: 'Dynamic pricing with ML-based optimization' 
      },
      { 
        name: 'Review Service', 
        description: 'Two-way review system with simultaneous reveal' 
      },
      { 
        name: 'Image Service', 
        description: 'Handles photo uploads and CDN distribution' 
      },
      { 
        name: 'Messaging Service', 
        description: 'In-app messaging between hosts and guests' 
      }
    ]
  },
  
  apiDesign: `
    // Search API
    
    GET /api/v2/search
    Query Parameters: {
      location: "San Francisco, CA",
      checkin: "2024-03-01",
      checkout: "2024-03-05",
      guests: 2,
      min_price: 50,
      max_price: 200,
      amenities: ["wifi", "parking"],
      property_type: ["entire_place"],
      instant_book: true,
      radius_km: 10,
      limit: 20,
      offset: 0
    }
    Response: {
      results: [{
        listing_id: "list_123",
        title: "Cozy Downtown Apartment",
        type: "entire_place",
        location: {
          lat: 37.7749,
          lon: -122.4194,
          address: "123 Market St"
        },
        host: {
          id: "host_456",
          name: "John",
          rating: 4.8,
          superhost: true,
          response_time: "1 hour"
        },
        price: {
          base: 150,
          total: 680,
          currency: "USD"
        },
        availability: true,
        instant_book: true,
        photos: ["url1", "url2"],
        amenities: ["wifi", "parking", "kitchen"],
        rating: 4.9,
        reviews_count: 234,
        distance_km: 2.5
      }],
      total_count: 1543,
      has_more: true
    }
    
    // Booking APIs
    
    POST /api/v2/bookings/check_availability
    Request: {
      listing_id: "list_123",
      checkin: "2024-03-01",
      checkout: "2024-03-05",
      guests: 2
    }
    Response: {
      available: true,
      price_breakdown: {
        nights: 4,
        nightly_rate: 150,
        subtotal: 600,
        cleaning_fee: 50,
        service_fee: 84,
        taxes: 96,
        total: 830
      }
    }
    
    POST /api/v2/bookings/reserve
    Request: {
      listing_id: "list_123",
      checkin: "2024-03-01",
      checkout: "2024-03-05",
      guests: 2,
      payment_method_id: "pm_789",
      message_to_host: "Looking forward to staying!"
    }
    Response: {
      booking_id: "book_abc123",
      status: "confirmed",
      confirmation_code: "ABCD1234",
      check_in_details: {
        time: "3:00 PM",
        instructions: "Key in lockbox"
      },
      cancellation_policy: "flexible",
      total_paid: 830
    }
    
    // Calendar API
    
    GET /api/v2/listings/{listing_id}/calendar
    Query: {
      start_date: "2024-03-01",
      end_date: "2024-03-31"
    }
    Response: {
      availability: [{
        date: "2024-03-01",
        available: true,
        price: 150,
        min_nights: 2
      }],
      blocked_dates: ["2024-03-15", "2024-03-16"]
    }
    
    PUT /api/v2/listings/{listing_id}/calendar
    Request: {
      dates: ["2024-03-10", "2024-03-11"],
      available: false,
      price: null
    }
    
    // Review API
    
    POST /api/v2/reviews
    Request: {
      booking_id: "book_abc123",
      rating: {
        overall: 5,
        cleanliness: 5,
        communication: 4,
        checkin: 5,
        accuracy: 5,
        location: 5,
        value: 4
      },
      public_review: "Great stay! Very clean and convenient.",
      private_feedback: "Maybe add more towels"
    }
    
    // Messaging API
    
    POST /api/v2/messages
    Request: {
      thread_id: "thread_123",
      recipient_id: "user_456",
      message: "Hi! Is early check-in possible?",
      listing_id: "list_123"
    }
    
    GET /api/v2/messages/threads
    Response: {
      threads: [{
        thread_id: "thread_123",
        participants: ["user_123", "user_456"],
        listing: {
          id: "list_123",
          title: "Cozy Downtown Apartment"
        },
        last_message: {
          text: "Yes, 1 PM works!",
          timestamp: "2024-02-28T10:30:00Z",
          sender_id: "user_456"
        },
        unread_count: 1
      }]
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for transactional data
      
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP,
        verified BOOLEAN,
        host_since DATE
      );
      
      CREATE TABLE listings (
        listing_id SERIAL PRIMARY KEY,
        host_id INT REFERENCES users(user_id),
        title VARCHAR(500),
        description TEXT,
        property_type VARCHAR(50),
        room_type VARCHAR(50),
        accommodates INT,
        bedrooms INT,
        bathrooms DECIMAL(3,1),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        address JSONB,
        amenities JSONB,
        house_rules TEXT,
        cancellation_policy VARCHAR(50),
        created_at TIMESTAMP,
        status VARCHAR(20),
        INDEX idx_geo (latitude, longitude),
        INDEX idx_host (host_id)
      );
      
      CREATE TABLE bookings (
        booking_id SERIAL PRIMARY KEY,
        listing_id INT REFERENCES listings(listing_id),
        guest_id INT REFERENCES users(user_id),
        check_in DATE,
        check_out DATE,
        guests INT,
        total_price DECIMAL(10,2),
        status VARCHAR(20),
        created_at TIMESTAMP,
        UNIQUE KEY unique_booking (listing_id, check_in, check_out),
        INDEX idx_dates (check_in, check_out)
      );
      
      CREATE TABLE availability (
        listing_id INT REFERENCES listings(listing_id),
        date DATE,
        available BOOLEAN,
        price DECIMAL(10,2),
        min_nights INT,
        PRIMARY KEY (listing_id, date),
        INDEX idx_date (date)
      );
      
      CREATE TABLE reviews (
        review_id SERIAL PRIMARY KEY,
        booking_id INT REFERENCES bookings(booking_id),
        reviewer_id INT REFERENCES users(user_id),
        rating_overall INT,
        rating_cleanliness INT,
        rating_communication INT,
        rating_checkin INT,
        rating_accuracy INT,
        rating_location INT,
        rating_value INT,
        public_review TEXT,
        created_at TIMESTAMP,
        INDEX idx_booking (booking_id)
      );
    `,
    
    nosql: `
      // MongoDB for listing details
      
      {
        _id: ObjectId("..."),
        listing_id: 123,
        host_id: 456,
        title: "Cozy Downtown Apartment",
        description: "Beautiful apartment...",
        photos: [
          {
            url: "https://cdn.airbnb.com/...",
            caption: "Living room",
            order: 1
          }
        ],
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7749],
          address: {
            street: "123 Market St",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            zip: "94102"
          }
        },
        amenities: {
          wifi: true,
          parking: true,
          kitchen: true,
          air_conditioning: true,
          workspace: true
        },
        pricing: {
          base_price: 150,
          cleaning_fee: 50,
          extra_guest_fee: 20,
          weekend_multiplier: 1.2,
          seasonal_adjustments: [
            {
              start: "2024-06-01",
              end: "2024-08-31",
              multiplier: 1.5
            }
          ]
        },
        stats: {
          views: 10234,
          bookings: 156,
          response_rate: 0.98,
          response_time: 3600,
          acceptance_rate: 0.85
        }
      }
      
      // Elasticsearch for search
      
      {
        "listing_id": 123,
        "title": "Cozy Downtown Apartment",
        "description": "Beautiful apartment...",
        "location": {
          "lat": 37.7749,
          "lon": -122.4194
        },
        "amenities": ["wifi", "parking", "kitchen"],
        "property_type": "apartment",
        "room_type": "entire_place",
        "price": 150,
        "rating": 4.9,
        "reviews_count": 234,
        "superhost": true,
        "instant_book": true
      }
      
      // Redis for caching
      
      // Session data
      SET session:abc123 "user_id:456,expires:1234567890"
      
      // Search results cache
      SET search:sf:2024-03-01:2024-03-05:2 "[listing_ids]" EX 3600
      
      // Availability cache
      HSET availability:123:2024-03
        "2024-03-01" "available:true,price:150"
        "2024-03-02" "available:true,price:150"
      
      // Pricing cache
      SET price:123:2024-03-01:2024-03-05:2 "830" EX 300
      
      // Lock for booking
      SET lock:booking:123:2024-03-01 "book_abc" NX EX 30
    `
  },
  
  tradeoffs: [
    {
      decision: 'Consistency Model',
      analysis: `
        Strong Consistency for Bookings (Chosen):
        ✓ No double bookings
        ✓ Accurate inventory
        ✓ Trust with users
        ✗ Higher latency
        ✗ Complex distributed transactions
        
        Eventually Consistent:
        ✓ Better performance
        ✓ Higher availability
        ✗ Risk of double booking
        ✗ Complex conflict resolution
        
        Decision: Strong consistency for bookings, eventual for rest
      `
    },
    {
      decision: 'Search Architecture',
      analysis: `
        Elasticsearch (Chosen):
        ✓ Powerful geo queries
        ✓ Complex filtering
        ✓ Full-text search
        ✓ Fast aggregations
        ✗ Additional infrastructure
        ✗ Sync complexity
        
        Database-only:
        ✓ Simpler architecture
        ✓ Single source of truth
        ✗ Limited search capabilities
        ✗ Performance issues
        
        Decision: Elasticsearch for search flexibility
      `
    },
    {
      decision: 'Pricing Strategy',
      analysis: `
        Dynamic Pricing (Chosen):
        ✓ Revenue optimization
        ✓ Market responsive
        ✓ Competitive advantage
        ✗ Complex ML models
        ✗ Host confusion
        
        Fixed Pricing:
        ✓ Simple
        ✓ Predictable
        ✗ Lost revenue opportunity
        ✗ Not competitive
        
        Decision: Dynamic with host controls
      `
    },
    {
      decision: 'Payment Model',
      analysis: `
        Escrow System (Chosen):
        ✓ Trust for both parties
        ✓ Dispute resolution
        ✓ Fraud protection
        ✗ Cash flow delay
        ✗ Complex implementation
        
        Direct Payment:
        ✓ Simple flow
        ✓ Immediate payment
        ✗ No protection
        ✗ Trust issues
        
        Decision: Escrow for trust and safety
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Airbnb System Design Interview',
        youtubeId: 'YyOXt2MEkv4',
        duration: '26:35'
      },
      { 
        title: 'How Airbnb Scaled to 100M Users',
        youtubeId: 'QUfFxDpzHdw',
        duration: '42:15'
      }
    ],
    articles: [
      {
        title: 'Scaling Airbnbs Payment Platform',
        url: 'https://medium.com/airbnb-engineering/scaling-airbnbs-payment-platform'
      },
      {
        title: 'Building Services at Airbnb',
        url: 'https://medium.com/airbnb-engineering/building-services-at-airbnb'
      }
    ],
    books: [
      {
        title: 'The Airbnb Story',
        author: 'Leigh Gallagher',
        chapter: 'Chapter 8: Scaling Globally'
      }
    ]
  }
}