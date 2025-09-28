// Dynamic loader for system design questions
// Maps question IDs to their module imports for lazy loading

const questionModules = {
  // Social Media & Communication
   'twitter': () => import('../data/system-design/questions/twitter.js'),
   'whatsapp': () => import('../data/system-design/questions/whatsapp.js'),
   'instagram': () => import('../data/system-design/questions/instagram.js'),
   'discord': () => import('../data/system-design/questions/discord.js'),
   'facebook-newsfeed': () => import('../data/system-design/questions/facebook-newsfeed.js'),
   'linkedin': () => import('../data/system-design/questions/linkedin.js'),
    'telegram': () => import('../data/system-design/questions/telegram.js'),
  // 'reddit': () => import('../data/system-design/questions/reddit.js'),
  
  // Video & Streaming
   'youtube': () => import('../data/system-design/questions/youtube.js'),
   'netflix': () => import('../data/system-design/questions/netflix.js'),
   'twitch': () => import('../data/system-design/questions/twitch.js'),
   'zoom': () => import('../data/system-design/questions/zoom.js'),
  
  // Storage & Files
   'google-drive': () => import('../data/system-design/questions/google-drive.js'),
   'dropbox': () => import('../data/system-design/questions/dropbox.js'),
  // 'google-photos': () => import('../data/system-design/questions/google-photos.js'),
  
  // E-commerce & Marketplace
  // 'amazon': () => import('../data/system-design/questions/amazon.js'),
   'uber': () => import('../data/system-design/questions/uber.js'),
  'airbnb': () => import('../data/system-design/questions/airbnb.js'),
  // 'ticketmaster': () => import('../data/system-design/questions/ticketmaster.js'),
  
  // Infrastructure & Tools
  'url-shortener': () => import('../data/system-design/questions/url-shortener.js'),
  // 'pastebin': () => import('../data/system-design/questions/pastebin.js'),
   'rate-limiter': () => import('../data/system-design/questions/rate-limiter.js'),
  // 'distributed-cache': () => import('../data/system-design/questions/distributed-cache.js'),
  // 'search-autocomplete': () => import('../data/system-design/questions/search-autocomplete.js'),
   'web-crawler': () => import('../data/system-design/questions/web-crawler.js'),
  
  // Financial & Payments
  // 'payment-system': () => import('../data/system-design/questions/payment-system.js'),
  // 'stock-trading': () => import('../data/system-design/questions/stock-trading.js'),
  
  // Gaming & Real-time
  // 'multiplayer-game': () => import('../data/system-design/questions/multiplayer-game.js'),
  // 'leaderboard': () => import('../data/system-design/questions/leaderboard.js'),
  // 'notification-system': () => import('../data/system-design/questions/notification-system.js')
}

// Cache for already loaded questions
const questionCache = new Map()

/**
 * Load a system design question by ID
 * @param {string} id - Question ID
 * @returns {Promise<Object>} Question data
 */
export async function loadQuestion(id) {
  // Check cache first
  if (questionCache.has(id)) {
    return questionCache.get(id)
  }
  
  // Load module if exists
  if (questionModules[id]) {
    try {
      const module = await questionModules[id]()
      const questionData = module.default
      
      // Cache for future use
      questionCache.set(id, questionData)
      
      return questionData
    } catch (error) {
      console.error(`Error loading question ${id}:`, error)
      throw new Error(`Failed to load question: ${id}`)
    }
  }
  
  throw new Error(`Question not found: ${id}`)
}

/**
 * Preload multiple questions (for performance)
 * @param {string[]} ids - Array of question IDs
 */
export async function preloadQuestions(ids) {
  const promises = ids.map(id => loadQuestion(id))
  return Promise.all(promises)
}

/**
 * Clear the question cache
 */
export function clearCache() {
  questionCache.clear()
}