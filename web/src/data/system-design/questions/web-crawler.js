// Web Crawler System Design Question
export default {
  id: 'web-crawler',
  title: 'Design a Web Crawler',
  companies: ['Google', 'Microsoft Bing', 'Baidu', 'Amazon', 'Internet Archive'],
  difficulty: 'Hard',
  category: 'Infrastructure & Tools',
  
  description: 'Design a distributed web crawler that can crawl billions of web pages, handle duplicate detection, respect robots.txt, maintain politeness policies, and feed data into a search engine index.',
  
  requirements: {
    functional: [
      'Crawl billions of web pages',
      'Discover new URLs through links',
      'Handle duplicate URL detection',
      'Respect robots.txt and crawl delays',
      'Support multiple content types (HTML, PDF, images)',
      'Extract and follow links',
      'Handle dynamic JavaScript content',
      'Support sitemap.xml parsing',
      'Implement URL prioritization',
      'Handle redirects and errors gracefully',
      'Extract metadata and content',
      'Support recrawling for updates',
      'Detect and handle spider traps'
    ],
    nonFunctional: [
      'Crawl 1 billion pages per day',
      'Store 100 billion pages total',
      'Handle 100,000 requests per second',
      'Politeness: Max 1 request per domain per second',
      'Deduplication accuracy > 99.9%',
      '99.9% availability',
      'Crawl latency < 10 seconds per page',
      'Support for 100+ million unique domains',
      'Handle pages up to 10MB size',
      'Process JavaScript-rendered content',
      'Distributed across multiple data centers'
    ]
  },
  
  talkingPoints: {
    introduction: `
      I'll design a web crawler system. The key challenges are:
      
      1. Scale - crawling billions of pages efficiently
      2. Politeness - respecting server resources and robots.txt
      3. Deduplication - avoiding crawling the same content
      4. URL frontier management - prioritizing what to crawl
      5. Content extraction and parsing
      6. Handling dynamic content and JavaScript
      7. Spider trap detection
      8. Distributed coordination
      9. Storage and indexing pipeline
      
      The system needs to balance between crawling speed and being respectful to web servers while maintaining fresh content for search indexing.
    `,
    
    capacityEstimation: `
      **Scale Calculations:**
      
      Crawling Volume:
      - Pages to crawl per day: 1 billion
      - Average page size: 100KB
      - Daily data volume: 1B * 100KB = 100TB
      - Pages per second: 1B / 86400 = ~12,000 pages/sec
      - Assuming 5 pages per domain: 2,400 domains/sec
      
      Network Bandwidth:
      - Download bandwidth: 12,000 * 100KB = 1.2GB/s
      - With compression (30%): 840MB/s
      - Global bandwidth needed: 10Gbps minimum
      - Peak bandwidth (3x): 30Gbps
      
      Storage Requirements:
      - Raw HTML storage: 100TB/day
      - With compression (4:1): 25TB/day
      - 1-year retention: 9PB compressed
      - Extracted text: 10% of original = 2.5TB/day
      - Index size: 5% of text = 125GB/day
      - Total storage with redundancy: 30PB
      
      URL Frontier:
      - Active URLs in queue: 10 billion
      - URL record size: 100 bytes
      - Frontier size: 1TB in memory
      - Discovered URLs/day: 20 billion
      - Unique new URLs: 2 billion (90% duplicates)
      
      Infrastructure:
      - Crawler machines: 10,000
      - Pages per crawler: 100/second
      - DNS servers: 100 (distributed)
      - Storage servers: 1,000
      - Coordination servers: 50
      
      Processing Requirements:
      - HTML parsing: 1ms per page
      - Link extraction: 0.5ms per page
      - Content extraction: 2ms per page
      - JavaScript rendering: 1-5 seconds per page
      - Deduplication check: 0.1ms per URL
    `,
    
    highLevelDesign: `
      **System Architecture:**
      
      1. **URL Frontier**
         - Priority queues
         - Politeness scheduler
         - Back/front queues
         - URL deduplication
      
      2. **Crawler Workers**
         - Fetcher threads
         - DNS resolver
         - Content downloader
         - robots.txt checker
      
      3. **Content Processing**
         - HTML parser
         - Link extractor
         - Content extractor
         - JavaScript renderer
         - Document fingerprinting
      
      4. **Storage Layer**
         - Raw content store
         - Processed documents
         - URL database
         - Metadata store
      
      5. **Coordination Services**
         - URL distributor
         - Crawler manager
         - Health monitor
         - Rate limiter
      
      6. **Analytics Pipeline**
         - Quality metrics
         - Coverage analysis
         - Performance monitoring
         - Spider trap detection
      
      **Crawling Flow:**
      
      1. Seed URLs loaded into frontier
      2. URLs distributed to crawlers
      3. Check robots.txt and politeness
      4. Fetch content with timeout
      5. Extract links and content
      6. Store raw and processed data
      7. Add new URLs to frontier
      8. Update crawl metadata
    `,
    
    detailedDesign: `
      **1. URL Frontier Architecture:**
      
      \`\`\`python
      class URLFrontier:
          def __init__(self):
              # Multiple priority queues
              self.priority_queues = {
                  'high': PriorityQueue(),    # News sites, frequently updated
                  'medium': PriorityQueue(),   # Regular websites
                  'low': PriorityQueue()       # Archives, rarely updated
              }
              
              # Politeness queues per domain
              self.domain_queues = {}  # domain -> queue of URLs
              self.domain_last_access = {}  # domain -> timestamp
              self.crawl_delay = {}  # domain -> delay in seconds
              
              # Back queues for redistribution
              self.back_queues = [Queue() for _ in range(100)]
              
              # Bloom filter for deduplication
              self.seen_urls = BloomFilter(capacity=100_000_000_000, error_rate=0.001)
              
          def add_url(self, url, priority='medium', depth=0):
              # Normalize URL
              normalized = self.normalize_url(url)
              
              # Check if already seen
              if normalized in self.seen_urls:
                  return False
              
              # Add to bloom filter
              self.seen_urls.add(normalized)
              
              # Calculate priority score
              score = self.calculate_priority(url, depth)
              
              # Add to appropriate queue
              domain = self.extract_domain(url)
              if domain not in self.domain_queues:
                  self.domain_queues[domain] = Queue()
              
              self.domain_queues[domain].put({
                  'url': normalized,
                  'priority': score,
                  'depth': depth,
                  'discovered': time.time()
              })
              
              return True
          
          def get_url_to_crawl(self, crawler_id):
              # Round-robin through back queues
              back_queue_id = crawler_id % len(self.back_queues)
              back_queue = self.back_queues[back_queue_id]
              
              if not back_queue.empty():
                  return back_queue.get()
              
              # Refill back queue from domain queues
              self.refill_back_queue(back_queue_id)
              
              if not back_queue.empty():
                  return back_queue.get()
              
              return None
          
          def refill_back_queue(self, queue_id):
              # Select domains respecting politeness
              batch_size = 100
              selected_urls = []
              
              for domain, queue in self.domain_queues.items():
                  if queue.empty():
                      continue
                  
                  # Check politeness constraint
                  last_access = self.domain_last_access.get(domain, 0)
                  delay = self.crawl_delay.get(domain, 1)  # Default 1 second
                  
                  if time.time() - last_access < delay:
                      continue
                  
                  # Take one URL from this domain
                  if not queue.empty():
                      url_data = queue.get()
                      selected_urls.append(url_data)
                      self.domain_last_access[domain] = time.time()
                  
                  if len(selected_urls) >= batch_size:
                      break
              
              # Add to back queue
              for url_data in selected_urls:
                  self.back_queues[queue_id].put(url_data)
          
          def calculate_priority(self, url, depth):
              score = 1.0
              
              # Penalize deep links
              score *= (1.0 / (1 + depth * 0.1))
              
              # Boost certain domains
              domain = self.extract_domain(url)
              if domain in self.high_priority_domains:
                  score *= 10
              
              # Boost based on page rank (if available)
              page_rank = self.get_page_rank(url)
              score *= (1 + page_rank)
              
              # Freshness factor
              last_crawled = self.get_last_crawled(url)
              if last_crawled:
                  days_old = (time.time() - last_crawled) / 86400
                  score *= (1 + days_old * 0.1)
              
              return score
      \`\`\`
      
      **2. Crawler Worker Implementation:**
      
      \`\`\`python
      class CrawlerWorker:
          def __init__(self, worker_id):
              self.worker_id = worker_id
              self.session = requests.Session()
              self.dns_cache = DNSCache()
              self.robots_cache = RobotsCache()
              self.js_renderer = JavaScriptRenderer()
              
          async def crawl_page(self, url_data):
              url = url_data['url']
              
              try:
                  # Check robots.txt
                  if not await self.check_robots(url):
                      return None
                  
                  # DNS resolution with caching
                  ip = await self.dns_cache.resolve(url)
                  
                  # Download content
                  response = await self.fetch_content(url, ip)
                  
                  # Check content type
                  content_type = response.headers.get('Content-Type', '')
                  
                  if 'text/html' in content_type:
                      return await self.process_html(url, response)
                  elif 'application/pdf' in content_type:
                      return await self.process_pdf(url, response)
                  else:
                      return self.process_other(url, response)
                      
              except Exception as e:
                  logger.error(f"Failed to crawl {url}: {e}")
                  return None
          
          async def fetch_content(self, url, ip):
              headers = {
                  'User-Agent': 'MySearchBot/1.0 (+http://example.com/bot)',
                  'Accept-Encoding': 'gzip, deflate',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Connection': 'keep-alive'
              }
              
              # Use IP to avoid DNS lookup
              url_with_ip = url.replace(urlparse(url).netloc, ip)
              
              response = await self.session.get(
                  url_with_ip,
                  headers=headers,
                  timeout=10,
                  allow_redirects=True,
                  max_redirects=5
              )
              
              # Check response size
              if len(response.content) > 10 * 1024 * 1024:  # 10MB limit
                  raise ValueError("Content too large")
              
              return response
          
          async def process_html(self, url, response):
              # Parse HTML
              soup = BeautifulSoup(response.content, 'lxml')
              
              # Extract metadata
              metadata = {
                  'title': self.extract_title(soup),
                  'description': self.extract_description(soup),
                  'keywords': self.extract_keywords(soup),
                  'language': self.detect_language(soup),
                  'publish_date': self.extract_publish_date(soup)
              }
              
              # Extract links
              links = self.extract_links(soup, url)
              
              # Extract main content
              content = self.extract_content(soup)
              
              # Check if JavaScript rendering needed
              if self.needs_js_rendering(soup):
                  rendered = await self.js_renderer.render(url)
                  soup_rendered = BeautifulSoup(rendered, 'lxml')
                  links.extend(self.extract_links(soup_rendered, url))
                  content = self.extract_content(soup_rendered)
              
              # Generate fingerprint for deduplication
              fingerprint = self.generate_fingerprint(content)
              
              return {
                  'url': url,
                  'content': content,
                  'links': links,
                  'metadata': metadata,
                  'fingerprint': fingerprint,
                  'crawled_at': time.time()
              }
          
          def extract_links(self, soup, base_url):
              links = []
              
              for tag in soup.find_all(['a', 'link']):
                  href = tag.get('href')
                  if not href:
                      continue
                  
                  # Resolve relative URLs
                  absolute_url = urljoin(base_url, href)
                  
                  # Filter out non-HTTP URLs
                  if not absolute_url.startswith(('http://', 'https://')):
                      continue
                  
                  # Normalize URL
                  normalized = self.normalize_url(absolute_url)
                  
                  links.append({
                      'url': normalized,
                      'anchor_text': tag.get_text().strip(),
                      'rel': tag.get('rel', [])
                  })
              
              return links
          
          def generate_fingerprint(self, content):
              # Use SimHash for near-duplicate detection
              features = self.extract_features(content)
              return simhash(features)
      \`\`\`
      
      **3. Robots.txt and Politeness Manager:**
      
      \`\`\`python
      class PolitenessManager:
          def __init__(self):
              self.robots_cache = {}  # domain -> RobotFileParser
              self.crawl_delays = {}  # domain -> delay in seconds
              self.last_access = {}  # domain -> timestamp
              self.concurrent_connections = {}  # domain -> count
              
          async def can_fetch(self, url, user_agent='*'):
              domain = self.extract_domain(url)
              
              # Get robots.txt for domain
              if domain not in self.robots_cache:
                  await self.fetch_robots_txt(domain)
              
              robots = self.robots_cache.get(domain)
              if robots:
                  # Check if URL is allowed
                  if not robots.can_fetch(user_agent, url):
                      return False
                  
                  # Get crawl delay
                  delay = robots.crawl_delay(user_agent) or 1.0
                  self.crawl_delays[domain] = delay
              
              # Check rate limiting
              last_access = self.last_access.get(domain, 0)
              required_delay = self.crawl_delays.get(domain, 1.0)
              
              if time.time() - last_access < required_delay:
                  return False
              
              # Check concurrent connections
              current_connections = self.concurrent_connections.get(domain, 0)
              if current_connections >= 2:  # Max 2 concurrent per domain
                  return False
              
              return True
          
          async def fetch_robots_txt(self, domain):
              robots_url = f"http://{domain}/robots.txt"
              
              try:
                  response = await self.fetch_with_timeout(robots_url, timeout=5)
                  
                  if response.status_code == 200:
                      robots = RobotFileParser()
                      robots.parse(response.text.splitlines())
                      self.robots_cache[domain] = robots
                  else:
                      # No robots.txt, allow all
                      self.robots_cache[domain] = None
                      
              except Exception:
                  # Error fetching, be conservative
                  self.robots_cache[domain] = None
                  self.crawl_delays[domain] = 2.0  # Default 2 second delay
          
          def mark_access(self, domain):
              self.last_access[domain] = time.time()
              self.concurrent_connections[domain] = \
                  self.concurrent_connections.get(domain, 0) + 1
          
          def release_access(self, domain):
              if domain in self.concurrent_connections:
                  self.concurrent_connections[domain] -= 1
      \`\`\`
      
      **4. Duplicate Detection System:**
      
      \`\`\`python
      class DuplicateDetector:
          def __init__(self):
              # URL deduplication
              self.url_seen = BloomFilter(capacity=100_000_000_000)
              self.url_fingerprints = {}  # hash -> canonical URL
              
              # Content deduplication using SimHash
              self.content_fingerprints = {}  # simhash -> URL
              self.simhash_index = SimHashIndex()
              
          def is_duplicate_url(self, url):
              # Normalize URL
              normalized = self.normalize_url(url)
              
              # Check bloom filter first
              if normalized in self.url_seen:
                  return True
              
              # Check exact match
              url_hash = hashlib.md5(normalized.encode()).hexdigest()
              if url_hash in self.url_fingerprints:
                  return True
              
              # Check URL patterns (remove session IDs, etc.)
              canonical = self.canonicalize_url(normalized)
              canonical_hash = hashlib.md5(canonical.encode()).hexdigest()
              
              if canonical_hash in self.url_fingerprints:
                  return True
              
              return False
          
          def is_duplicate_content(self, content, threshold=0.95):
              # Generate SimHash
              simhash = self.generate_simhash(content)
              
              # Find near-duplicates
              duplicates = self.simhash_index.find_similar(
                  simhash,
                  max_distance=3  # Hamming distance
              )
              
              if duplicates:
                  # Calculate similarity
                  for dup_hash, dup_url in duplicates:
                      similarity = self.calculate_similarity(simhash, dup_hash)
                      if similarity > threshold:
                          return True, dup_url
              
              return False, None
          
          def normalize_url(self, url):
              # Parse URL
              parsed = urlparse(url.lower())
              
              # Remove fragment
              parsed = parsed._replace(fragment='')
              
              # Sort query parameters
              query_params = parse_qs(parsed.query)
              sorted_query = urlencode(sorted(query_params.items()))
              parsed = parsed._replace(query=sorted_query)
              
              # Remove trailing slash
              path = parsed.path.rstrip('/')
              if not path:
                  path = '/'
              parsed = parsed._replace(path=path)
              
              # Remove www
              netloc = parsed.netloc.replace('www.', '')
              parsed = parsed._replace(netloc=netloc)
              
              return urlunparse(parsed)
          
          def generate_simhash(self, content):
              # Extract features (shingles)
              features = []
              words = content.split()
              
              # Word shingles
              for i in range(len(words) - 2):
                  shingle = ' '.join(words[i:i+3])
                  features.append(hash(shingle))
              
              return SimHash(features)
      \`\`\`
      
      **5. JavaScript Rendering Service:**
      
      \`\`\`python
      class JavaScriptRenderer:
          def __init__(self):
              self.browser_pool = BrowserPool(size=100)
              
          async def render(self, url):
              browser = await self.browser_pool.acquire()
              
              try:
                  page = await browser.new_page()
                  
                  # Set viewport and user agent
                  await page.set_viewport({'width': 1920, 'height': 1080})
                  await page.set_user_agent('MySearchBot/1.0')
                  
                  # Navigate with timeout
                  await page.goto(url, wait_until='networkidle', timeout=30000)
                  
                  # Wait for dynamic content
                  await self.wait_for_content(page)
                  
                  # Scroll to load lazy content
                  await self.scroll_page(page)
                  
                  # Get rendered HTML
                  html = await page.content()
                  
                  # Extract any dynamically loaded URLs
                  dynamic_urls = await page.evaluate('''
                      () => {
                          const links = Array.from(document.querySelectorAll('a'));
                          return links.map(link => link.href);
                      }
                  ''')
                  
                  await page.close()
                  
                  return {
                      'html': html,
                      'dynamic_urls': dynamic_urls
                  }
                  
              finally:
                  await self.browser_pool.release(browser)
          
          async def wait_for_content(self, page):
              # Wait for specific selectors that indicate content loaded
              selectors = ['main', 'article', '#content', '.content']
              
              for selector in selectors:
                  try:
                      await page.wait_for_selector(selector, timeout=5000)
                      break
                  except:
                      continue
          
          async def scroll_page(self, page):
              # Scroll to trigger lazy loading
              await page.evaluate('''
                  async () => {
                      const distance = 100;
                      const delay = 100;
                      const maxScroll = document.body.scrollHeight;
                      
                      for (let i = 0; i < maxScroll; i += distance) {
                          window.scrollBy(0, distance);
                          await new Promise(r => setTimeout(r, delay));
                      }
                  }
              ''')
      \`\`\`
      
      **6. Spider Trap Detection:**
      
      \`\`\`python
      class SpiderTrapDetector:
          def __init__(self):
              self.url_patterns = {}  # domain -> URL pattern counter
              self.crawl_depths = {}  # domain -> max depth seen
              self.similar_urls = {}  # domain -> similar URL counter
              
          def is_spider_trap(self, url, depth):
              domain = self.extract_domain(url)
              
              # Check excessive depth
              if depth > 100:
                  return True
              
              # Check URL length
              if len(url) > 500:
                  return True
              
              # Check repeating patterns
              if self.has_repeating_pattern(url):
                  return True
              
              # Check calendar traps (infinite date URLs)
              if self.is_calendar_trap(url):
                  return True
              
              # Check session ID traps
              if self.has_multiple_session_ids(url):
                  return True
              
              # Track similar URLs
              url_pattern = self.extract_pattern(url)
              if domain not in self.similar_urls:
                  self.similar_urls[domain] = {}
              
              pattern_count = self.similar_urls[domain].get(url_pattern, 0)
              if pattern_count > 1000:  # Too many similar URLs
                  return True
              
              self.similar_urls[domain][url_pattern] = pattern_count + 1
              
              return False
          
          def has_repeating_pattern(self, url):
              # Check for repeating path segments
              path = urlparse(url).path
              segments = path.split('/')
              
              # Look for repeating segments
              for i in range(1, len(segments) // 2 + 1):
                  pattern = segments[:i]
                  if segments == pattern * (len(segments) // i):
                      return True
              
              return False
          
          def is_calendar_trap(self, url):
              # Check for date patterns that could be infinite
              date_patterns = [
                  r'/\\d{4}/\\d{2}/\\d{2}/',  # /2024/01/20/
                  r'/calendar/\\d+/',
                  r'/archive/\\d{4}/',
                  r'/date/\\d+'
              ]
              
              for pattern in date_patterns:
                  if re.search(pattern, url):
                      return True
              
              return False
      \`\`\`
    `,
    
    dataFlow: `
      **Crawling Flow:**
      
      1. Seed URLs Loading:
         - Load high-priority seed URLs
         - Add to URL frontier
         - Set initial priorities
      
      2. URL Distribution:
         - Frontier assigns URLs to workers
         - Respect domain politeness
         - Balance load across workers
      
      3. Pre-crawl Checks:
         - Check robots.txt cache
         - Verify crawl delay
         - Check duplicate URL
         - Verify not in spider trap
      
      4. Content Fetching:
         - DNS resolution (cached)
         - HTTP GET request
         - Handle redirects (max 5)
         - Timeout after 10 seconds
      
      5. Content Processing:
         - Parse HTML/PDF/etc
         - Extract text content
         - Extract metadata
         - Find all links
         - Generate fingerprint
      
      6. JavaScript Rendering (if needed):
         - Detect JS-heavy sites
         - Render with headless browser
         - Extract dynamic content
         - Find AJAX-loaded links
      
      7. Duplicate Detection:
         - Check content fingerprint
         - SimHash for near-duplicates
         - Update dedup database
      
      8. Storage:
         - Store raw HTML
         - Store extracted content
         - Update URL database
         - Queue for indexing
      
      9. Link Discovery:
         - Extract all links
         - Normalize URLs
         - Filter by rules
         - Add to frontier
      
      10. Crawl Completion:
          - Update crawl metadata
          - Release domain lock
          - Report metrics
          - Get next URL
      
      **Politeness Flow:**
      
      1. Domain enters system
      2. Fetch robots.txt
      3. Parse crawl-delay directive
      4. Check sitemap.xml
      5. Set rate limits:
         - Default: 1 req/sec
         - Robots.txt override
         - Adaptive based on response time
      6. Enforce delays between requests
      7. Limit concurrent connections
      8. Back off on errors
      
      **Recrawl Strategy:**
      
      1. Page importance scoring:
         - PageRank value
         - Update frequency
         - User traffic
      
      2. Freshness requirements:
         - News sites: hourly
         - Blogs: daily
         - Corporate: weekly
         - Archives: monthly
      
      3. Change detection:
         - HTTP ETag
         - Last-Modified header
         - Content hash comparison
      
      4. Adaptive scheduling:
         - Increase frequency if changes detected
         - Decrease if content stable
         - Priority boost for important pages
    `,
    
    bottlenecks: `
      **Potential Bottlenecks and Solutions:**
      
      1. **URL Frontier Bottleneck**
         Problem: Billions of URLs to manage
         Solution:
         - Distributed frontier with sharding
         - Bloom filters for deduplication
         - Priority queues with sampling
         - Disk-backed queues for overflow
      
      2. **DNS Resolution**
         Problem: DNS lookups are slow
         Solution:
         - Large DNS cache (TTL-aware)
         - Multiple DNS servers
         - Prefetch DNS for queued URLs
         - Local DNS server
      
      3. **Network Bandwidth**
         Problem: Limited bandwidth for crawling
         Solution:
         - Compression (gzip/brotli)
         - Distributed crawling locations
         - Bandwidth throttling per domain
         - CDN for common resources
      
      4. **JavaScript Rendering**
         Problem: Expensive and slow
         Solution:
         - Selective rendering (detect need)
         - Browser pool management
         - Caching rendered content
         - Distributed rendering farm
      
      5. **Duplicate Detection**
         Problem: Checking billions of URLs
         Solution:
         - Bloom filters (probabilistic)
         - SimHash for content
         - Distributed dedup service
         - Periodic cleanup
      
      6. **Storage Scalability**
         Problem: Petabytes of data
         Solution:
         - Compression (70% reduction)
         - Tiered storage (hot/cold)
         - Distributed file system
         - Data expiration policies
      
      7. **Spider Traps**
         Problem: Infinite URL spaces
         Solution:
         - URL pattern detection
         - Depth limiting
         - Similar URL counting
         - Blacklist patterns
    `,
    
    scaling: `
      **Scaling Strategies:**
      
      1. **Horizontal Scaling:**
         - Add more crawler workers
         - Distributed URL frontier
         - Multiple data centers
         - Sharded storage
      
      2. **Geographic Distribution:**
         - Regional crawling centers
         - Local DNS servers
         - Edge caching
         - Reduce latency to targets
      
      3. **Priority-based Resource Allocation:**
         - More resources for important sites
         - Adaptive crawl rates
         - Dynamic worker assignment
         - Quality-based scheduling
      
      4. **Caching Strategies:**
         - DNS cache (1 hour TTL)
         - robots.txt cache (24 hours)
         - Rendered JS cache (1 week)
         - Common resource cache
      
      5. **Queue Management:**
         - Multiple priority levels
         - Domain-based sharding
         - Back pressure handling
         - Dead letter queues
      
      6. **Data Pipeline Optimization:**
         - Batch processing
         - Stream processing for real-time
         - Parallel extraction
         - Async I/O everywhere
      
      7. **Monitoring and Auto-scaling:**
         - Queue depth monitoring
         - Crawler health checks
         - Auto-scale based on queue
         - Performance metrics tracking
    `
  },
  
  architecture: {
    svgPath: '/diagrams/web-crawler.svg',
    components: [
      { 
        name: 'URL Frontier', 
        description: 'Manages billions of URLs with priority queuing and politeness' 
      },
      { 
        name: 'Crawler Workers', 
        description: 'Distributed workers that fetch and process web pages' 
      },
      { 
        name: 'DNS Resolver', 
        description: 'Cached DNS resolution service for fast lookups' 
      },
      { 
        name: 'Content Processor', 
        description: 'Extracts text, links, and metadata from pages' 
      },
      { 
        name: 'Dedup Service', 
        description: 'Detects duplicate URLs and content using fingerprinting' 
      },
      { 
        name: 'JS Renderer', 
        description: 'Headless browser farm for JavaScript-heavy sites' 
      },
      { 
        name: 'Storage System', 
        description: 'Distributed storage for raw pages and extracted content' 
      },
      { 
        name: 'Analytics Engine', 
        description: 'Monitors crawl quality, coverage, and performance' 
      }
    ]
  },
  
  apiDesign: `
    // Crawler Control APIs
    
    POST /api/crawler/seed
    Request: {
      urls: [
        "https://example.com",
        "https://news.site.com"
      ],
      priority: "high",
      crawl_depth: 5,
      follow_external: true
    }
    Response: {
      job_id: "crawl_job_123",
      urls_added: 2,
      status: "queued"
    }
    
    GET /api/crawler/status
    Response: {
      active_workers: 9523,
      pages_crawled_today: 823456789,
      crawl_rate: 11234,  // pages per second
      queue_depth: 8234567890,
      domains_in_queue: 45678234
    }
    
    POST /api/crawler/recrawl
    Request: {
      domain: "example.com",
      strategy: "force",  // force | if_modified | scheduled
      depth: 10
    }
    Response: {
      job_id: "recrawl_job_456",
      estimated_pages: 50000,
      estimated_time: 3600  // seconds
    }
    
    // URL Management APIs
    
    POST /api/urls/add
    Request: {
      urls: [
        {
          url: "https://example.com/page",
          priority: 0.8,
          crawl_after: "2024-01-20T10:00:00Z"
        }
      ]
    }
    Response: {
      added: 1,
      duplicates: 0,
      rejected: 0
    }
    
    GET /api/urls/status/{url}
    Response: {
      url: "https://example.com/page",
      last_crawled: "2024-01-19T15:30:00Z",
      status: "success",
      content_hash: "abc123...",
      outgoing_links: 45,
      crawl_depth: 3,
      next_crawl: "2024-01-26T15:30:00Z"
    }
    
    DELETE /api/urls/remove
    Request: {
      pattern: "https://spam-site.com/*"
    }
    Response: {
      urls_removed: 15234,
      pattern_blacklisted: true
    }
    
    // Domain Management APIs
    
    PUT /api/domains/{domain}/settings
    Request: {
      crawl_delay: 2,  // seconds
      max_concurrent: 1,
      user_agent: "CustomBot/1.0",
      respect_robots: true
    }
    Response: {
      domain: "example.com",
      settings_updated: true
    }
    
    GET /api/domains/{domain}/robots
    Response: {
      domain: "example.com",
      robots_txt: "User-agent: *\\nCrawl-delay: 1\\nDisallow: /private/",
      sitemap: "https://example.com/sitemap.xml",
      crawl_delay: 1,
      disallowed_paths: ["/private/", "/admin/"]
    }
    
    // Content APIs
    
    GET /api/content/{page_id}
    Response: {
      page_id: "page_789",
      url: "https://example.com/article",
      crawled_at: "2024-01-20T10:00:00Z",
      title: "Article Title",
      content: "Extracted text content...",
      html: "<html>...</html>",  // Optional
      metadata: {
        description: "Page description",
        keywords: ["keyword1", "keyword2"],
        author: "John Doe",
        published_date: "2024-01-15"
      },
      links: [
        {
          url: "https://example.com/related",
          anchor_text: "Related Article",
          rel: ["follow"]
        }
      ]
    }
    
    GET /api/content/search
    Query: {
      domain: "example.com",
      content_hash: "def456...",
      crawled_after: "2024-01-01"
    }
    Response: {
      results: [...],
      total: 1234,
      page: 1
    }
    
    // Analytics APIs
    
    GET /api/analytics/coverage
    Query: {
      domain: "example.com"
    }
    Response: {
      domain: "example.com",
      total_pages: 50000,
      crawled_pages: 45000,
      coverage: 0.9,
      failed_pages: 500,
      robots_blocked: 4500,
      last_updated: "2024-01-20T10:00:00Z"
    }
    
    GET /api/analytics/performance
    Query: {
      time_range: "24h"
    }
    Response: {
      metrics: {
        pages_crawled: 950000000,
        success_rate: 0.985,
        avg_response_time: 1.2,  // seconds
        bandwidth_used: 95.5,  // TB
        domains_crawled: 5234567,
        new_urls_discovered: 1234567890
      },
      errors: {
        timeouts: 12345,
        dns_failures: 2345,
        robots_blocked: 345678,
        server_errors: 23456
      }
    }
    
    // Spider Trap Detection API
    
    GET /api/traps/check
    Query: {
      url: "https://example.com/path/path/path"
    }
    Response: {
      url: "https://example.com/path/path/path",
      is_trap: true,
      trap_type: "repeating_pattern",
      confidence: 0.95
    }
    
    POST /api/traps/report
    Request: {
      url: "https://trap-site.com/infinite/*",
      trap_type: "infinite_calendar"
    }
    Response: {
      pattern_added: true,
      urls_blacklisted: 5234
    }
  `,
  
  databaseSchema: {
    sql: `
      -- PostgreSQL for metadata
      
      CREATE TABLE domains (
        domain_id BIGSERIAL PRIMARY KEY,
        domain VARCHAR(255) UNIQUE,
        robots_txt TEXT,
        robots_txt_updated TIMESTAMP,
        sitemap_url VARCHAR(1024),
        crawl_delay FLOAT DEFAULT 1.0,
        last_crawled TIMESTAMP,
        total_pages INT DEFAULT 0,
        INDEX idx_domain (domain)
      );
      
      CREATE TABLE urls (
        url_id BIGSERIAL PRIMARY KEY,
        url VARCHAR(2048) UNIQUE,
        domain_id BIGINT REFERENCES domains(domain_id),
        content_hash VARCHAR(64),
        last_crawled TIMESTAMP,
        last_modified TIMESTAMP,
        crawl_count INT DEFAULT 0,
        status VARCHAR(20),
        priority FLOAT DEFAULT 0.5,
        depth INT DEFAULT 0,
        INDEX idx_url_hash (url_hash),
        INDEX idx_domain_urls (domain_id),
        INDEX idx_priority (priority DESC),
        INDEX idx_last_crawled (last_crawled)
      );
      
      CREATE TABLE pages (
        page_id BIGSERIAL PRIMARY KEY,
        url_id BIGINT REFERENCES urls(url_id),
        title TEXT,
        content_text TEXT,
        meta_description TEXT,
        meta_keywords TEXT[],
        language VARCHAR(10),
        published_date TIMESTAMP,
        author VARCHAR(255),
        content_fingerprint VARCHAR(64),
        crawled_at TIMESTAMP,
        processing_time INT,  -- milliseconds
        INDEX idx_url_pages (url_id),
        INDEX idx_fingerprint (content_fingerprint)
      );
      
      CREATE TABLE links (
        link_id BIGSERIAL PRIMARY KEY,
        from_url_id BIGINT REFERENCES urls(url_id),
        to_url_id BIGINT REFERENCES urls(url_id),
        anchor_text TEXT,
        rel VARCHAR(50)[],
        discovered_at TIMESTAMP,
        INDEX idx_from_url (from_url_id),
        INDEX idx_to_url (to_url_id)
      );
      
      CREATE TABLE crawl_stats (
        stat_id BIGSERIAL PRIMARY KEY,
        url_id BIGINT REFERENCES urls(url_id),
        status_code INT,
        response_time INT,  -- milliseconds
        content_length INT,
        content_type VARCHAR(100),
        error_message TEXT,
        crawled_at TIMESTAMP,
        INDEX idx_url_stats (url_id),
        INDEX idx_crawled (crawled_at)
      );
    `,
    
    nosql: `
      // Redis for caching and queues
      
      // URL frontier queues
      ZADD frontier:high {priority_score} "https://example.com"
      ZADD frontier:medium {priority_score} "https://site.com"
      ZADD frontier:low {priority_score} "https://archive.org"
      
      // Domain politeness tracking
      HSET domain:example.com 
        last_accessed {timestamp}
        crawl_delay 1.0
        concurrent_connections 2
      
      // robots.txt cache
      SETEX robots:example.com 86400 "User-agent: *\\nDisallow: /private/"
      
      // DNS cache
      HSET dns:example.com
        ip "93.184.216.34"
        ttl 3600
        resolved_at {timestamp}
      
      // Bloom filter for URL deduplication
      BF.ADD seen_urls "https://example.com/page"
      BF.EXISTS seen_urls "https://example.com/page"
      
      // Content fingerprints
      SET fingerprint:abc123def456 "https://example.com/page"
      
      // Crawl rate limiting
      INCR rate:example.com
      EXPIRE rate:example.com 1
      
      // Worker assignment
      HSET worker:1234
        current_url "https://example.com/page"
        started_at {timestamp}
        status "crawling"
      
      // MongoDB for content storage
      
      {
        _id: ObjectId("..."),
        url: "https://example.com/page",
        domain: "example.com",
        raw_html: "<html>...</html>",
        extracted_text: "Page content...",
        metadata: {
          title: "Page Title",
          description: "Description",
          keywords: ["keyword1", "keyword2"],
          published_date: ISODate("2024-01-15")
        },
        links: [
          {
            url: "https://example.com/other",
            anchor_text: "Link Text",
            rel: ["follow", "noopener"]
          }
        ],
        fingerprint: "simhash_value",
        crawled_at: ISODate("2024-01-20T10:00:00Z"),
        version: 1
      }
      
      // Cassandra for time-series metrics
      
      CREATE KEYSPACE crawler WITH replication = {
        'class': 'NetworkTopologyStrategy',
        'datacenter1': 3
      };
      
      CREATE TABLE crawl_metrics (
        domain TEXT,
        timestamp TIMESTAMP,
        pages_crawled INT,
        success_count INT,
        error_count INT,
        avg_response_time FLOAT,
        bandwidth_bytes BIGINT,
        PRIMARY KEY (domain, timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC);
      
      // ElasticSearch for full-text search
      
      PUT /crawled_pages/_doc/1
      {
        "url": "https://example.com/page",
        "title": "Page Title",
        "content": "Full text content...",
        "domain": "example.com",
        "crawled_at": "2024-01-20T10:00:00Z",
        "language": "en",
        "page_rank": 0.73,
        "inbound_links": 234
      }
    `
  },
  
  tradeoffs: [
    {
      decision: 'Crawling Strategy',
      analysis: `
        Breadth-First:
        ✓ Discovers more domains
        ✓ Better coverage
        ✗ May miss deep content
        ✗ Slower to fully crawl sites
        
        Depth-First:
        ✓ Complete site coverage
        ✓ Faster for single sites
        ✗ Can get stuck in traps
        ✗ Poor domain discovery
        
        Hybrid (Chosen):
        ✓ Balanced coverage
        ✓ Configurable per domain
        ✓ Trap detection
        ✗ Complex implementation
        
        Decision: Hybrid with depth limits and priority
      `
    },
    {
      decision: 'Duplicate Detection',
      analysis: `
        URL-only:
        ✓ Fast
        ✓ Simple
        ✗ Misses similar content
        ✗ Session IDs cause issues
        
        Content Hash:
        ✓ Exact duplicate detection
        ✗ Misses near-duplicates
        ✗ Minor changes = different
        
        SimHash (Chosen):
        ✓ Near-duplicate detection
        ✓ Configurable threshold
        ✓ Efficient comparison
        ✗ More complex
        ✗ Some false positives
        
        Decision: SimHash with Bloom filter for URLs
      `
    },
    {
      decision: 'JavaScript Handling',
      analysis: `
        Ignore JS:
        ✓ Fast crawling
        ✓ Low resource usage
        ✗ Misses dynamic content
        ✗ Poor modern web coverage
        
        Always Render:
        ✓ Complete content
        ✗ Very expensive
        ✗ Slow (5-10x slower)
        
        Selective Rendering (Chosen):
        ✓ Render when needed
        ✓ Detect JS-heavy sites
        ✓ Cache rendered content
        ✗ Detection complexity
        
        Decision: Selective based on site signals
      `
    },
    {
      decision: 'Storage Architecture',
      analysis: `
        Store Everything:
        ✓ Complete archive
        ✓ Can reprocess
        ✗ Massive storage costs
        ✗ Much duplicated data
        
        Store Processed Only:
        ✓ Less storage
        ✗ Can't reprocess
        ✗ Lose original
        
        Tiered Storage (Chosen):
        ✓ Recent: full content
        ✓ Old: compressed/extracted
        ✓ Cost optimized
        ✗ Complex management
        
        Decision: Tiered with compression and expiration
      `
    }
  ],
  
  resources: {
    videos: [
      { 
        title: 'Google Search Architecture',
        youtubeId: 'BYYqPZjwC7E',
        duration: '45:23'
      },
      { 
        title: 'Web Crawler System Design',
        youtubeId: 'BKZxZwUgL3Y',
        duration: '31:18'
      }
    ],
    articles: [
      {
        title: 'The Anatomy of a Large-Scale Web Crawler',
        url: 'http://infolab.stanford.edu/~backrub/google.html'
      },
      {
        title: 'Mercator: A Scalable, Extensible Web Crawler',
        url: 'https://www.cin.ufpe.br/~redis/intranet/bibliografia/www/mercator.pdf'
      }
    ],
    books: [
      {
        title: 'Introduction to Information Retrieval',
        author: 'Manning, Raghavan, Schütze',
        chapter: 'Chapter 20: Web Crawling'
      }
    ]
  }
}